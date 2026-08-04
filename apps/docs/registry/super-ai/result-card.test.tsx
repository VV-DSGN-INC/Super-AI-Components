import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ResultCard, type ResultCardState } from "./result-card";

const ALL_STATES: ResultCardState[] = ["idle", "queued", "streaming", "done", "failed", "locked"];

const frame = (root: HTMLElement) => root.querySelector('[data-slot="preview-tile-frame"]') as HTMLElement;
const footer = (root: HTMLElement) => root.querySelector('[data-slot="result-card-footer"]') as HTMLElement;

describe("ResultCard", () => {
  it("renders the idle state", () => {
    const { container } = render(<ResultCard state="idle" />);
    expect(container.querySelector('[data-slot="result-card"]')).toHaveAttribute("data-state", "idle");
    // idle reserves the slot at final aspect; nothing has been produced yet.
    expect(frame(container)).toContainElement(
      container.querySelector<HTMLElement>('[data-slot="preview-tile-loading"]'),
    );
    expect(screen.getByRole("status")).toHaveTextContent("Not started");
  });

  it("renders the queued state", () => {
    const { container } = render(<ResultCard state="queued" badge="3rd in queue" />);
    expect(container.querySelector('[data-slot="result-card"]')).toHaveAttribute("data-state", "queued");
    // Queue position rides in A8's badge slot, inside the frame.
    expect(screen.getByText("3rd in queue")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Queued");
  });

  it("renders the streaming state", () => {
    const { container } = render(<ResultCard state="streaming" progress={42} />);
    const bar = screen.getByRole("progressbar");
    expect(bar).toBeInTheDocument();
    expect(bar).toHaveAttribute("aria-valuenow", "42");
    expect(container.querySelector('[data-slot="result-card-progress"]')).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Generating, 42%");
  });

  it("renders the done state", () => {
    render(
      <ResultCard state="done">
        <img alt="A red bicycle on a beach" src="/result.png" />
      </ResultCard>,
    );
    // `done` is the only state that shows the media itself.
    expect(screen.getByAltText("A red bicycle on a beach")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Result ready");
  });

  it("renders the failed state", () => {
    const { container } = render(<ResultCard state="failed" onRetry={() => {}} />);
    expect(container.querySelector('[data-slot="preview-tile-failed"]')).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Generation failed");
  });

  it("renders the locked state", () => {
    render(
      <ResultCard state="locked" lockedAction={<button type="button">Upgrade to unlock</button>}>
        <img alt="Blurred preview" src="/locked.png" />
      </ResultCard>,
    );
    expect(screen.getByRole("button", { name: "Upgrade to unlock" })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Locked");
  });

  it("renders the media-types state", () => {
    // The media is opaque to F1 — image, video, audio, text or 3D all sit in
    // the same frame, which is why the card is one component and not five.
    const { container: video } = render(
      <ResultCard state="done" aspect="video">
        <video data-testid="clip" />
      </ResultCard>,
    );
    const { container: text } = render(
      <ResultCard state="done" aspect="video">
        <p>A generated paragraph of copy.</p>
      </ResultCard>,
    );
    expect(video.querySelector('[data-testid="clip"]')).toBeInTheDocument();
    expect(screen.getByText("A generated paragraph of copy.")).toBeInTheDocument();
    // Same aspect in, same box out, regardless of what the media actually is.
    expect(frame(video).className).toBe(frame(text).className);
  });

  it("passes className through", () => {
    render(<ResultCard className="test-class" />);
    expect(document.querySelector('[data-slot="result-card"]')!.className).toContain("test-class");
  });

  // ---------------------------------------------------------------------------
  // Load-bearing assertions (wave-4 spec §8)
  // ---------------------------------------------------------------------------

  it("keeps the card's box identical in all six states", () => {
    // The wave's defining assertion: if this regresses, every grid reflows the
    // moment a result resolves. jsdom does no layout, so the proof is that the
    // geometry-bearing class lists are byte-identical across the six states —
    // everything that varies is inside the frame or absolutely positioned.
    const boxes = ALL_STATES.map((state) => {
      const { container } = render(
        <ResultCard state={state} aspect="video" footer={state === "done" ? "17 credits" : null}>
          <img alt={state} src="/x.png" />
        </ResultCard>,
      );
      return {
        state,
        card: container.querySelector('[data-slot="result-card"]')!.className,
        frame: frame(container).className,
        footer: footer(container).className,
      };
    });

    const [first, ...rest] = boxes;
    for (const box of rest) {
      expect(box.frame, `frame geometry drifted in "${box.state}"`).toBe(first.frame);
      expect(box.card, `card geometry drifted in "${box.state}"`).toBe(first.card);
      expect(box.footer, `footer geometry drifted in "${box.state}"`).toBe(first.footer);
    }
  });

  it("reserves the footer's height even when it is empty", () => {
    // A footer that appears only in `done` reintroduces the very reflow the
    // fixed frame exists to prevent.
    const { container } = render(<ResultCard state="idle" />);
    const empty = footer(container);
    expect(empty).toBeInTheDocument();
    expect(empty).toBeEmptyDOMElement();
    expect(empty.className).toContain("min-h-9");
  });

  it("retains the media under a scrim when locked, rather than blanking the box", () => {
    // "locked shows the shape of what would have been made, then the CTA —
    // never an empty box with a padlock."
    const { container } = render(
      <ResultCard state="locked" lockedAction={<button type="button">Upgrade</button>}>
        <img alt="What you would have got" src="/locked.png" />
      </ResultCard>,
    );
    expect(screen.getByAltText("What you would have got")).toBeInTheDocument();
    expect(container.querySelector('[data-slot="preview-tile-locked"]')).toBeInTheDocument();
  });

  it("puts retry inside the card, not somewhere a toast would go", () => {
    const onRetry = vi.fn();
    const { container } = render(<ResultCard state="failed" onRetry={onRetry} />);
    const retry = screen.getByRole("button", { name: /retry/i });
    // Inside the failed treatment, which is inside the frame, which is inside
    // the card — the association between failure and its retry is structural.
    expect(container.querySelector('[data-slot="preview-tile-failed"]')).toContainElement(retry);
    expect(frame(container)).toContainElement(retry);
  });

  it("omits retry when no handler is supplied, but still names the failure", () => {
    const { container } = render(<ResultCard state="failed" />);
    expect(screen.queryByRole("button", { name: /retry/i })).not.toBeInTheDocument();
    // Never colour alone: the words are visibly present with or without the
    // action, independently of the sr-only status region that also says them.
    expect(container.querySelector('[data-slot="preview-tile-failed"]')).toHaveTextContent(
      "Generation failed",
    );
  });

  it("renders streaming progress without changing the frame", () => {
    const { container: streaming } = render(<ResultCard state="streaming" progress={70} />);
    const { container: idle } = render(<ResultCard state="idle" />);
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
    expect(frame(streaming).className).toBe(frame(idle).className);
  });

  it("falls back to an indeterminate bar when streaming without a progress value", () => {
    render(<ResultCard state="streaming" />);
    expect(screen.getByRole("progressbar")).not.toHaveAttribute("aria-valuenow");
  });

  it("takes button semantics only when onSelect is passed", () => {
    const { container: inert } = render(<ResultCard state="done" />);
    expect(inert.querySelector("button")).toBeNull();
    expect(frame(inert).tagName).toBe("DIV");

    const { container: live } = render(<ResultCard state="done" onSelect={() => {}} />);
    expect(frame(live).tagName).toBe("BUTTON");
  });

  it("never nests the retry or unlock control inside an interactive frame", async () => {
    // A8 draws its action slot inside the frame, so a frame that is also a
    // button puts one interactive inside another — axe fails this outright.
    const { container: failed } = render(
      <ResultCard state="failed" onSelect={() => {}} onRetry={() => {}} />,
    );
    expect(frame(failed).tagName).toBe("DIV");
    expect(frame(failed)).toContainElement(screen.getByRole("button", { name: /retry/i }));

    const { container: locked } = render(
      <ResultCard state="locked" onSelect={() => {}} lockedAction={<button type="button">Upgrade</button>} />,
    );
    expect(frame(locked).tagName).toBe("DIV");
    expect(frame(locked)).toContainElement(screen.getByRole("button", { name: "Upgrade" }));
  });

  it("reports selection through aria-pressed when the tile is the control", async () => {
    const onSelect = vi.fn();
    render(<ResultCard state="done" selected onSelect={onSelect} />);
    const tile = screen.getByRole("button", { pressed: true });
    await userEvent.click(tile);
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  // ---------------------------------------------------------------------------
  // Select mode
  // ---------------------------------------------------------------------------

  it("replaces hover actions with a checkbox in select mode, never both at once", () => {
    const { container: hover } = render(
      <ResultCard state="done" actions={<button type="button">Download</button>} />,
    );
    expect(hover.querySelector('[data-slot="result-card-actions"]')).toBeInTheDocument();
    expect(hover.querySelector('[data-slot="result-card-select"]')).toBeNull();

    const { container: select } = render(
      <ResultCard state="done" selectable actions={<button type="button">Download</button>} />,
    );
    expect(select.querySelector('[data-slot="result-card-select"]')).toBeInTheDocument();
    expect(select.querySelector('[data-slot="result-card-actions"]')).toBeNull();
  });

  it("keeps hover actions keyboard reachable rather than display:none", () => {
    const { container } = render(
      <ResultCard state="done" actions={<button type="button">Download</button>} />,
    );
    const layer = container.querySelector('[data-slot="result-card-actions"]')!;
    expect(layer.className).toContain("opacity-0");
    expect(layer.className).toContain("group-focus-within/card:opacity-100");
    expect(layer.className).not.toContain("hidden");
    // Still in the tab order, so a keyboard user can reach it at all.
    expect(screen.getByRole("button", { name: "Download" })).toBeInTheDocument();
  });

  it("does not make the tile a button in select mode, so selection has one control", async () => {
    const onSelect = vi.fn();
    const { container } = render(<ResultCard state="done" selectable onSelect={onSelect} />);
    expect(frame(container).tagName).toBe("DIV");
    const box = screen.getByRole("checkbox", { name: "Select this result" });
    await userEvent.click(box);
    expect(onSelect).toHaveBeenCalledTimes(1);
  });
});
