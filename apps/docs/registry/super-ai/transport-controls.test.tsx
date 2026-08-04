import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TransportControls } from "./transport-controls";

/** DOM order of the transport buttons, read off their data-slots. */
function transportOrder(scope: Element) {
  return Array.from(scope.querySelectorAll("button[data-slot^='transport-controls-']")).map((button) =>
    button.getAttribute("data-slot"),
  );
}

function root() {
  return document.querySelector('[data-slot="transport-controls"]')!;
}

describe("TransportControls", () => {
  it("renders the simple state — play, skip, an editable elapsed field and speed", () => {
    render(<TransportControls duration={90} currentTime={12} />);

    expect(root()).toHaveAttribute("data-variant", "simple");
    expect(root()).toHaveAttribute("data-state", "paused");

    expect(screen.getByRole("button", { name: "Play" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /skip back/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /skip forward/i })).toBeInTheDocument();

    // Simple is elapsed/total at second precision — no frame field.
    expect(screen.getByRole("textbox", { name: /elapsed time/i })).toHaveValue("0:12");
    expect(document.querySelector('[data-slot="transport-controls-duration"]')).toHaveTextContent("1:30");

    // Frame step and in/out belong to the other variant only.
    expect(screen.queryByRole("button", { name: "Next frame" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /mark in/i })).not.toBeInTheDocument();

    expect(screen.getByLabelText("Playback speed")).toBeInTheDocument();
  });

  it("renders the frame-accurate state — frame step, in/out and a frame-precise timecode", () => {
    render(
      <TransportControls
        variant="frame-accurate"
        currentTime={12.5}
        duration={90}
        fps={24}
        inPoint={2}
        outPoint={30}
      />,
    );

    expect(root()).toHaveAttribute("data-variant", "frame-accurate");

    expect(screen.getByRole("button", { name: "Previous frame" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next frame" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Mark in point" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Mark out point" })).toBeInTheDocument();

    // 12.5s at 24fps is frame 12 — the frame field is what "frame-accurate" adds.
    expect(screen.getByRole("textbox", { name: /elapsed time/i })).toHaveValue("00:00:12:12");

    // In/out reads as text, not as a colour on a ruler somewhere else.
    expect(document.querySelector('[data-slot="transport-controls-range"]')).toHaveTextContent("In 00:00:02:00");
  });

  it("keeps button order unchanged between variants — frame-accurate appends, never reorders", () => {
    const { unmount } = render(<TransportControls />);
    const simple = transportOrder(root());
    unmount();

    render(<TransportControls variant="frame-accurate" />);
    const frameAccurate = transportOrder(root());

    // The spec's load-bearing sentence: "Frame-accurate adds timecode, frame
    // step and in/out; button order is unchanged." So simple's order has to be
    // a literal prefix of frame-accurate's — nothing inserted between the
    // shared controls, nothing swapped.
    expect(simple).toEqual([
      "transport-controls-skip-back",
      "transport-controls-play",
      "transport-controls-skip-forward",
    ]);
    expect(frameAccurate.slice(0, simple.length)).toEqual(simple);
    expect(frameAccurate).toEqual([
      ...simple,
      "transport-controls-step-back",
      "transport-controls-step-forward",
      "transport-controls-mark-in",
      "transport-controls-mark-out",
    ]);
  });

  it("toggles play and announces the change rather than only repainting the icon", async () => {
    const user = userEvent.setup();
    const onPlayPause = vi.fn();
    const { rerender } = render(<TransportControls onPlayPause={onPlayPause} />);

    expect(screen.getByRole("status")).toHaveTextContent("Paused");
    await user.click(screen.getByRole("button", { name: "Play" }));
    expect(onPlayPause).toHaveBeenCalledWith(true);

    rerender(<TransportControls playing onPlayPause={onPlayPause} />);
    expect(root()).toHaveAttribute("data-state", "playing");
    expect(screen.getByRole("status")).toHaveTextContent("Playing");
    await user.click(screen.getByRole("button", { name: "Pause" }));
    expect(onPlayPause).toHaveBeenLastCalledWith(false);
  });

  it("seeks when a timecode is typed — elapsed is a field, not a caption", async () => {
    const user = userEvent.setup();
    const onSeek = vi.fn();
    render(<TransportControls duration={600} onSeek={onSeek} />);

    const field = screen.getByRole("textbox", { name: /elapsed time/i });
    await user.clear(field);
    await user.type(field, "2:30{Enter}");

    expect(onSeek).toHaveBeenCalledWith(150);
  });

  it("parses a frame-accurate timecode against fps and clamps to duration", async () => {
    const user = userEvent.setup();
    const onSeek = vi.fn();
    render(<TransportControls variant="frame-accurate" fps={25} duration={60} onSeek={onSeek} />);

    const field = screen.getByRole("textbox", { name: /elapsed time/i });
    await user.clear(field);
    await user.type(field, "00:00:10:05{Enter}");
    expect(onSeek).toHaveBeenLastCalledWith(10.2);

    await user.clear(field);
    await user.type(field, "99:00:00:00{Enter}");
    expect(onSeek).toHaveBeenLastCalledWith(60);
  });

  it("reverts an unusable or abandoned edit instead of seeking to nowhere", async () => {
    const user = userEvent.setup();
    const onSeek = vi.fn();
    render(<TransportControls currentTime={12} duration={90} onSeek={onSeek} />);

    const field = screen.getByRole("textbox", { name: /elapsed time/i });
    await user.clear(field);
    await user.type(field, "later{Enter}");
    expect(onSeek).not.toHaveBeenCalled();
    expect(field).toHaveValue("0:12");

    await user.clear(field);
    await user.type(field, "0:45{Escape}");
    expect(onSeek).not.toHaveBeenCalled();
    expect(field).toHaveValue("0:12");
  });

  it("gives every control a keyboard equivalent, declared on the control itself", async () => {
    const user = userEvent.setup();
    const handlers = {
      onPlayPause: vi.fn(),
      onSkip: vi.fn(),
      onStepFrame: vi.fn(),
      onMarkIn: vi.fn(),
      onMarkOut: vi.fn(),
    };
    render(<TransportControls variant="frame-accurate" currentTime={8} skipBy={5} {...handlers} />);

    // Declared on the button, so assistive tech can read the shortcut out —
    // a tooltip is never the only place it lives.
    expect(screen.getByRole("button", { name: "Play" })).toHaveAttribute("aria-keyshortcuts", "Space");
    expect(screen.getByRole("button", { name: "Next frame" })).toHaveAttribute("aria-keyshortcuts", ".");
    expect(screen.getByRole("button", { name: "Mark in point" })).toHaveAttribute("aria-keyshortcuts", "I");

    root().dispatchEvent(new KeyboardEvent("keydown", { key: " ", bubbles: true }));
    expect(handlers.onPlayPause).toHaveBeenCalledWith(true);

    root().dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }));
    expect(handlers.onSkip).toHaveBeenLastCalledWith(-5);
    root().dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    expect(handlers.onSkip).toHaveBeenLastCalledWith(5);

    root().dispatchEvent(new KeyboardEvent("keydown", { key: ",", bubbles: true }));
    expect(handlers.onStepFrame).toHaveBeenLastCalledWith(-1);
    root().dispatchEvent(new KeyboardEvent("keydown", { key: ".", bubbles: true }));
    expect(handlers.onStepFrame).toHaveBeenLastCalledWith(1);

    root().dispatchEvent(new KeyboardEvent("keydown", { key: "i", bubbles: true }));
    expect(handlers.onMarkIn).toHaveBeenCalledWith(8);
    root().dispatchEvent(new KeyboardEvent("keydown", { key: "o", bubbles: true }));
    expect(handlers.onMarkOut).toHaveBeenCalledWith(8);

    // Every control is tab-reachable too, not shortcut-only.
    await user.tab();
    expect(screen.getByRole("button", { name: /skip back/i })).toHaveFocus();
  });

  it("does not steal keys the timecode field owns", async () => {
    const user = userEvent.setup();
    const onSkip = vi.fn();
    const onStepFrame = vi.fn();
    render(<TransportControls variant="frame-accurate" onSkip={onSkip} onStepFrame={onStepFrame} />);

    const field = screen.getByRole("textbox", { name: /elapsed time/i });
    await user.click(field);
    await user.keyboard("{ArrowLeft}");
    expect(onSkip).not.toHaveBeenCalled();

    // Typing "." into a timecode must not also step a frame.
    await user.keyboard(".");
    expect(onStepFrame).not.toHaveBeenCalled();
  });

  it("does not expose frame-accurate shortcuts in the simple variant", () => {
    const onStepFrame = vi.fn();
    const onMarkIn = vi.fn();
    render(<TransportControls onStepFrame={onStepFrame} onMarkIn={onMarkIn} />);

    root().dispatchEvent(new KeyboardEvent("keydown", { key: ".", bubbles: true }));
    root().dispatchEvent(new KeyboardEvent("keydown", { key: "i", bubbles: true }));

    expect(onStepFrame).not.toHaveBeenCalled();
    expect(onMarkIn).not.toHaveBeenCalled();
  });

  it("changes playback speed through a named control", async () => {
    const user = userEvent.setup();
    const onSpeedChange = vi.fn();
    render(<TransportControls speed={1} onSpeedChange={onSpeedChange} />);

    await user.click(screen.getByLabelText("Playback speed"));
    await user.click(await screen.findByRole("option", { name: "2×" }));
    expect(onSpeedChange).toHaveBeenCalledWith(2);
  });

  it("falls back to onSeek when skip and step have no dedicated handler", () => {
    const onSeek = vi.fn();
    render(<TransportControls variant="frame-accurate" currentTime={10} duration={90} fps={25} onSeek={onSeek} />);

    screen.getByRole("button", { name: /skip forward/i }).click();
    expect(onSeek).toHaveBeenLastCalledWith(15);

    screen.getByRole("button", { name: "Next frame" }).click();
    expect(onSeek).toHaveBeenLastCalledWith(10.04);
  });

  it("passes className through", () => {
    render(<TransportControls className="test-class" />);
    expect(document.querySelector('[data-slot="transport-controls"]')!.className).toContain("test-class");
  });
});
