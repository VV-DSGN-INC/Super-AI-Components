import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { TrackLane, type TrackClip, type TrackType } from "./track-lane";

const CLIPS: TrackClip[] = [
  {
    id: "a",
    label: "Establishing shot",
    start: 0,
    end: 4,
    frames: ["/a1.jpg", "/a2.jpg"],
    peaks: [0.2, 0.9, 0.4],
    text: "Nobody moves.",
    adjustment: { name: "Exposure", amount: 12 },
  },
  {
    id: "b",
    label: "Interview",
    start: 5,
    end: 9,
    frames: ["/b1.jpg"],
    peaks: [0.5, 0.5],
    text: "It started in a garage.",
    adjustment: { name: "Warmth", amount: 30 },
  },
  {
    id: "c",
    label: "Cutaway",
    start: 10,
    end: 12,
    text: "Hands on a keyboard.",
    adjustment: { name: "Contrast" },
  },
];

const TYPES: TrackType[] = ["filmstrip", "waveform", "text", "adjustment"];

function renderLane(overrides: Partial<React.ComponentProps<typeof TrackLane>> = {}) {
  return render(
    <TrackLane
      name="Video"
      type="filmstrip"
      clips={CLIPS}
      duration={12}
      pixelsPerSecond={40}
      {...overrides}
    />,
  );
}

const root = (c: HTMLElement) => c.querySelector('[data-slot="track-lane"]')!;
const header = (c: HTMLElement) => c.querySelector('[data-slot="track-lane-header"]')!;
const scroller = (c: HTMLElement) => c.querySelector('[data-slot="track-lane-clips"]')!;
const clipEls = (c: HTMLElement) => [...c.querySelectorAll('[data-slot="track-lane-clip"]')];
const handles = (c: HTMLElement) => [...c.querySelectorAll('[data-slot="track-lane-trim-handle"]')];
const bodyRenderers = (c: HTMLElement) =>
  [...c.querySelectorAll('[data-slot="track-lane-clip-body"]')].map((n) => n.getAttribute("data-render"));

describe("TrackLane", () => {
  // ---------------------------------------------------------------------------
  // Declared states
  // ---------------------------------------------------------------------------

  it("renders the filmstrip state", () => {
    const { container } = renderLane({ type: "filmstrip" });
    expect(root(container)).toHaveAttribute("data-type", "filmstrip");
    expect(bodyRenderers(container)).toEqual(["filmstrip", "filmstrip", "filmstrip"]);
    // Frames are drawn edge to edge across the clip, one cell per source.
    const first = clipEls(container)[0];
    expect(first.querySelectorAll('[data-slot="track-lane-frame"]')).toHaveLength(2);
    // The clip is still named, whatever the renderer draws.
    expect(
      within(first as HTMLElement).getByRole("button", { name: "Establishing shot" }),
    ).toBeInTheDocument();
  });

  it("renders the waveform state", () => {
    const { container } = renderLane({ type: "waveform", name: "Dialogue" });
    expect(root(container)).toHaveAttribute("data-type", "waveform");
    expect(bodyRenderers(container)).toEqual(["waveform", "waveform", "waveform"]);
    const first = clipEls(container)[0];
    const peaks = [...first.querySelectorAll('[data-slot="track-lane-peak"]')];
    expect(peaks).toHaveLength(3);
    expect((peaks[1] as HTMLElement).style.height).toBe("90%");
  });

  it("renders the text state", () => {
    const { container } = renderLane({ type: "text", name: "Captions" });
    expect(root(container)).toHaveAttribute("data-type", "text");
    expect(bodyRenderers(container)).toEqual(["text", "text", "text"]);
    expect(screen.getByText("It started in a garage.")).toBeInTheDocument();
    // Media renderers have no business drawing here.
    expect(container.querySelector('[data-slot="track-lane-frame"]')).toBeNull();
    expect(container.querySelector('[data-slot="track-lane-peak"]')).toBeNull();
  });

  it("renders the adjustment state", () => {
    const { container } = renderLane({ type: "adjustment", name: "Colour" });
    expect(root(container)).toHaveAttribute("data-type", "adjustment");
    expect(bodyRenderers(container)).toEqual(["adjustment", "adjustment", "adjustment"]);
    expect(screen.getByText("Exposure")).toBeInTheDocument();
    expect(screen.getByText("12%")).toBeInTheDocument();
    // No strength given for "Contrast" — the effect name still renders alone.
    expect(screen.getByText("Contrast")).toBeInTheDocument();
  });

  it("renders the locked state", async () => {
    const onSelectClip = vi.fn();
    const { container } = renderLane({ locked: true, selectedClipId: "b", onSelectClip });

    expect(root(container)).toHaveAttribute("data-locked", "true");

    // Not colour alone: a pressed control, an icon and the word "Locked".
    expect(screen.getByRole("button", { name: "Lock Video" })).toHaveAttribute("aria-pressed", "true");
    expect(container.querySelector('[data-slot="track-lane-locked-badge"]')).toHaveTextContent("Locked");

    // A locked lane is not editable: clips cannot be selected and the selected
    // clip grows no handles.
    const clipButton = screen.getByRole("button", { name: "Interview" });
    expect(clipButton).toBeDisabled();
    await userEvent.click(clipButton);
    expect(onSelectClip).not.toHaveBeenCalled();
    expect(handles(container)).toHaveLength(0);

    // Mute and solo are routing, not editing — lock does not disable them.
    expect(screen.getByRole("button", { name: "Mute Video" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Solo Video" })).toBeEnabled();
  });

  it("renders the trim-handles state", async () => {
    const onTrimClip = vi.fn();
    const { container } = renderLane({ selectedClipId: "b", onTrimClip, trimStep: 0.25 });

    const [start, end] = handles(container);
    expect(start).toHaveAccessibleName("Trim start of Interview");
    expect(end).toHaveAccessibleName("Trim end of Interview");

    (start as HTMLElement).focus();
    await userEvent.keyboard("{ArrowLeft}");
    expect(onTrimClip).toHaveBeenCalledWith("b", "start", -0.25);

    (end as HTMLElement).focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(onTrimClip).toHaveBeenCalledWith("b", "end", 0.25);
  });

  it("passes className through", () => {
    render(<TrackLane name="Video" type="filmstrip" clips={CLIPS} duration={12} className="test-class" />);
    expect(document.querySelector('[data-slot="track-lane"]')!.className).toContain("test-class");
  });

  // ---------------------------------------------------------------------------
  // Load-bearing: "The lane header is a fixed-width gutter ... It never scrolls
  // horizontally."
  // ---------------------------------------------------------------------------

  it("keeps the gutter out of the horizontal scroll context", () => {
    const { container } = renderLane();

    // The gutter is a sibling of the scroller, not a descendant of it: nothing
    // the scroller does can move it.
    expect(scroller(container).contains(header(container))).toBe(false);
    expect(header(container).parentElement).toBe(root(container));
    expect(scroller(container).parentElement).toBe(root(container));

    // Exactly one element scrolls horizontally, and it is not the gutter.
    expect(scroller(container).className).toContain("overflow-x-auto");
    expect(header(container).className).not.toMatch(/overflow-x/);
    expect(header(container).className).toContain("overflow-hidden");

    // Every clip lives inside the scroller; every control lives outside it.
    expect(clipEls(container).every((clip) => scroller(container).contains(clip))).toBe(true);
    for (const name of ["Mute Video", "Solo Video", "Lock Video"]) {
      expect(scroller(container).contains(screen.getByRole("button", { name }))).toBe(false);
    }
  });

  it("makes the scrolling region reachable from the keyboard and names it", () => {
    const { container } = renderLane({ name: "Dialogue" });
    const region = screen.getByRole("region", { name: "Dialogue clips" });
    expect(region).toBe(scroller(container));
    expect(region).toHaveAttribute("tabIndex", "0");
    // Something has to overflow for the scroller to matter.
    expect((container.querySelector('[data-slot="track-lane-track"]') as HTMLElement).style.width).toBe(
      "480px",
    );
  });

  // ---------------------------------------------------------------------------
  // Load-bearing: "Trim handles appear only on selection and belong to the
  // clip, not the lane."
  // ---------------------------------------------------------------------------

  it("shows no trim handles until something is selected", () => {
    const { container } = renderLane({ selectedClipId: null });
    expect(clipEls(container)).toHaveLength(3);
    expect(handles(container)).toHaveLength(0);
  });

  it("gives the handles to the selected clip only, not to the lane", () => {
    const { container } = renderLane({ selectedClipId: "b" });

    // Three clips, one selected: two handles, both inside that clip.
    const found = handles(container);
    expect(found).toHaveLength(2);
    const selected = container.querySelector('[data-clip-id="b"]')!;
    expect(selected).toHaveAttribute("data-selected", "true");
    for (const handle of found) {
      expect(handle.closest('[data-slot="track-lane-clip"]')).toBe(selected);
    }
    // Not children of the lane or the scroller.
    expect(
      [...scroller(container).children].some((n) => n.matches('[data-slot="track-lane-trim-handle"]')),
    ).toBe(false);
  });

  it("moves the handles with the selection rather than leaving them behind", () => {
    const { container, rerender } = renderLane({ selectedClipId: "a" });
    expect(handles(container)[0].closest("[data-clip-id]")).toHaveAttribute("data-clip-id", "a");

    rerender(<TrackLane name="Video" type="filmstrip" clips={CLIPS} duration={12} selectedClipId="c" />);
    expect(handles(container)).toHaveLength(2);
    expect(handles(container)[0].closest("[data-clip-id]")).toHaveAttribute("data-clip-id", "c");
  });

  it("keeps the trim handles out of the clip's select button", () => {
    // A handle nested inside the select button would be a nested interactive.
    const { container } = renderLane({ selectedClipId: "b" });
    for (const handle of handles(container)) {
      expect(handle.closest('[data-slot="track-lane-clip-select"]')).toBeNull();
    }
  });

  // ---------------------------------------------------------------------------
  // Load-bearing: "Track type changes clip rendering but not lane behaviour.
  // One component, four renderers."
  // ---------------------------------------------------------------------------

  it("draws identical lane geometry for all four track types", () => {
    const geometry = TYPES.map((type) => {
      const { container } = render(
        <TrackLane name="Track" type={type} clips={CLIPS} duration={12} pixelsPerSecond={40} />,
      );
      return {
        headerClass: header(container).className,
        scrollerClass: scroller(container).className,
        trackWidth: (container.querySelector('[data-slot="track-lane-track"]') as HTMLElement).style.width,
        clips: clipEls(container).map((clip) => ({
          id: clip.getAttribute("data-clip-id"),
          left: (clip as HTMLElement).style.left,
          width: (clip as HTMLElement).style.width,
        })),
      };
    });

    for (const g of geometry.slice(1)) {
      expect(g).toEqual(geometry[0]);
    }
    // And the geometry is the one the props asked for, not an accident.
    expect(geometry[0].clips).toEqual([
      { id: "a", left: "0px", width: "160px" },
      { id: "b", left: "200px", width: "160px" },
      { id: "c", left: "400px", width: "80px" },
    ]);
  });

  it("keeps identical lane behaviour across all four track types", async () => {
    for (const type of TYPES) {
      const onSelectClip = vi.fn();
      const { container, unmount } = render(
        <TrackLane
          name="Track"
          type={type}
          clips={CLIPS}
          duration={12}
          selectedClipId="b"
          onSelectClip={onSelectClip}
        />,
      );

      // Same controls, same names, same selection, same handles — every type.
      expect(screen.getByRole("button", { name: "Mute Track" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Solo Track" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Lock Track" })).toBeInTheDocument();
      expect(handles(container)).toHaveLength(2);

      await userEvent.click(screen.getByRole("button", { name: "Cutaway" }));
      expect(onSelectClip).toHaveBeenCalledWith("c");

      unmount();
    }
  });

  it("changes only what a clip draws when the type changes", () => {
    const { container, rerender } = renderLane({ type: "filmstrip" });
    const before = clipEls(container).map((c) => (c as HTMLElement).style.cssText);

    rerender(<TrackLane name="Video" type="text" clips={CLIPS} duration={12} pixelsPerSecond={40} />);
    expect(clipEls(container).map((c) => (c as HTMLElement).style.cssText)).toEqual(before);
    expect(bodyRenderers(container)).toEqual(["text", "text", "text"]);
  });

  // ---------------------------------------------------------------------------
  // Gutter controls
  // ---------------------------------------------------------------------------

  it("names the gutter controls and reports their state programmatically", async () => {
    const onMutedChange = vi.fn();
    const onSoloedChange = vi.fn();
    const onLockedChange = vi.fn();
    const { container } = renderLane({
      name: "Dialogue",
      muted: true,
      soloed: false,
      onMutedChange,
      onSoloedChange,
      onLockedChange,
    });

    const group = within(container.querySelector('[data-slot="track-lane-controls"]') as HTMLElement);
    expect(group.getByRole("button", { name: "Mute Dialogue" })).toHaveAttribute("aria-pressed", "true");
    expect(group.getByRole("button", { name: "Solo Dialogue" })).toHaveAttribute("aria-pressed", "false");

    await userEvent.click(group.getByRole("button", { name: "Solo Dialogue" }));
    expect(onSoloedChange).toHaveBeenCalledWith(true);

    await userEvent.click(group.getByRole("button", { name: "Mute Dialogue" }));
    expect(onMutedChange).toHaveBeenCalledWith(false);

    await userEvent.click(group.getByRole("button", { name: "Lock Dialogue" }));
    expect(onLockedChange).toHaveBeenCalledWith(true);
  });

  it("lets the toggle primitive keep its own data-slot", () => {
    const { container } = renderLane();
    const mute = container.querySelector('[data-control="mute"]')!;
    expect(mute).toHaveAttribute("data-slot", "toggle");
  });

  it("reports selection from the clip that was clicked", async () => {
    const onSelectClip = vi.fn();
    renderLane({ onSelectClip });
    await userEvent.click(screen.getByRole("button", { name: "Interview" }));
    expect(onSelectClip).toHaveBeenCalledWith("b");
  });

  it("marks the selected clip programmatically, not by ring alone", () => {
    const { container } = renderLane({ selectedClipId: "b" });
    expect(screen.getByRole("button", { name: "Interview" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Cutaway" })).toHaveAttribute("aria-pressed", "false");
    expect(container.querySelector('[data-clip-id="c"]')).not.toHaveAttribute("data-selected");
  });

  it("keeps a zero-length clip wide enough to hit", () => {
    const { container } = render(
      <TrackLane
        name="Video"
        type="filmstrip"
        duration={12}
        pixelsPerSecond={40}
        clips={[{ id: "z", label: "Frozen frame", start: 3, end: 3 }]}
      />,
    );
    expect((clipEls(container)[0] as HTMLElement).style.width).toBe("12px");
  });
});
