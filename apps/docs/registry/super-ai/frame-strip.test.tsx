import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { FrameStrip, type FrameStripItem, type FrameStripKind } from "./frame-strip";

const FRAMES: FrameStripItem[] = [
  { id: "f1", label: "00:00:00", thumbnail: <img src="/frames/1.png" alt="" /> },
  { id: "f2", label: "00:00:04", thumbnail: <img src="/frames/2.png" alt="" /> },
  { id: "f3", label: "00:00:08", thumbnail: <img src="/frames/3.png" alt="" /> },
];

const PAGES: FrameStripItem[] = [
  { id: "p1", label: "Page 1" },
  { id: "p2", label: "Page 2" },
  { id: "p3", label: "Page 3" },
];

const ARTBOARDS: FrameStripItem[] = [
  { id: "a1", label: "Hero" },
  { id: "a2", label: "Pricing" },
  { id: "a3", label: "Footer" },
];

/** Every class on A8's frame that is not part of the selection ring. */
const geometryClasses = () =>
  [...document.querySelectorAll('[data-slot="preview-tile-frame"]')].map((frame) =>
    frame.className
      .split(/\s+/)
      .filter((token) => token && !token.startsWith("ring"))
      .join(" "),
  );

describe("FrameStrip", () => {
  it("renders the video-frames state", async () => {
    const onValueChange = vi.fn();
    render(<FrameStrip kind="video" items={FRAMES} defaultValue="f1" onValueChange={onValueChange} />);

    const strip = document.querySelector('[data-slot="frame-strip"]')!;
    expect(strip).toHaveAttribute("data-kind", "video");
    // Carousel base: a labelled region with visible scroll affordances, which is
    // what keeps a horizontally scrolling strip keyboard-reachable.
    expect(strip).toHaveAttribute("role", "region");
    expect(strip).toHaveAccessibleName("Frames");
    expect(screen.getByRole("button", { name: /previous slide/i })).toBeInTheDocument();

    // Timecodes are the tiles' accessible names — the frames are not just pictures.
    expect(screen.getByRole("button", { name: "00:00:00" })).toHaveAttribute("aria-current", "true");
    expect(screen.getByRole("button", { name: "00:00:04" })).not.toHaveAttribute("aria-current");

    await userEvent.click(screen.getByRole("button", { name: "00:00:04" }));
    expect(onValueChange).toHaveBeenCalledWith("f2");
    // Active is a programmatic state, never colour alone.
    expect(screen.getByRole("button", { name: "00:00:04" })).toHaveAttribute("aria-current", "true");
    expect(screen.getByRole("button", { name: "00:00:00" })).not.toHaveAttribute("aria-current");
  });

  it("renders the slide-pages state", async () => {
    const onValueChange = vi.fn();
    const onAdd = vi.fn();
    render(<FrameStrip kind="slides" items={PAGES} defaultValue="p2" onValueChange={onValueChange} onAdd={onAdd} />);

    const strip = document.querySelector('[data-slot="frame-strip"]')!;
    expect(strip).toHaveAttribute("data-kind", "slides");
    expect(strip).toHaveAccessibleName("Pages");

    expect(screen.getByRole("button", { name: "Page 2" })).toHaveAttribute("aria-current", "true");
    await userEvent.click(screen.getByRole("button", { name: "Page 3" }));
    expect(onValueChange).toHaveBeenCalledWith("p3");

    // Add is a tile in the strip, in the same cell geometry as a page.
    await userEvent.click(screen.getByRole("button", { name: /add page/i }));
    expect(onAdd).toHaveBeenCalledOnce();
  });

  it("gives video frames, slide pages and artboards identical selection, reorder and add behaviour", async () => {
    // H5: "one component for video frames, slide pages and artboards.
    // Selection, reorder and add are identical." Only tile contents differ.
    const cases: [FrameStripKind, FrameStripItem[], string][] = [
      ["video", FRAMES, "00:00:08"],
      ["slides", PAGES, "Page 3"],
      ["artboards", ARTBOARDS, "Footer"],
    ];

    for (const [kind, items, lastLabel] of cases) {
      const onValueChange = vi.fn();
      const onReorder = vi.fn();
      const onAdd = vi.fn();
      const { unmount } = render(
        <FrameStrip kind={kind} items={items} onValueChange={onValueChange} onReorder={onReorder} onAdd={onAdd} />,
      );

      // Same slots, same counts, whatever the content kind.
      expect(document.querySelectorAll('[data-slot="frame-strip-frame"]')).toHaveLength(items.length);
      expect(document.querySelectorAll('[data-slot="frame-strip-controls"]')).toHaveLength(items.length);

      await userEvent.click(screen.getByRole("button", { name: lastLabel }));
      expect(onValueChange).toHaveBeenCalledWith(items[2].id);

      await userEvent.click(screen.getByRole("button", { name: new RegExp(`move ${lastLabel} left`, "i") }));
      expect(onReorder).toHaveBeenCalledWith(items[2].id, "left");

      await userEvent.click(screen.getByRole("button", { name: /^add /i }));
      expect(onAdd).toHaveBeenCalledOnce();

      unmount();
    }
  });

  it("renders the in-out-picker state", async () => {
    const onInOutChange = vi.fn();
    render(<FrameStrip kind="video" variant="in-out" items={FRAMES} onInOutChange={onInOutChange} />);

    expect(document.querySelector('[data-slot="frame-strip"]')).toHaveAttribute("data-variant", "in-out");
    // Two marks, not one selection — the frame itself is inert here, so the
    // In/Out toggles are the only controls over it.
    expect(screen.queryByRole("button", { name: "00:00:00" })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /in point at 00:00:00/i }));
    expect(onInOutChange).toHaveBeenLastCalledWith({ inPoint: "f1", outPoint: undefined });

    await userEvent.click(screen.getByRole("button", { name: /out point at 00:00:08/i }));
    expect(onInOutChange).toHaveBeenLastCalledWith({ inPoint: "f1", outPoint: "f3" });

    // Both marked frames are ringed, and each says in words which end it is.
    const marked = [...document.querySelectorAll('[data-slot="frame-strip-item"][data-active="true"]')];
    expect(marked).toHaveLength(2);
    expect(marked[0].querySelector('[data-slot="frame-strip-mark"]')).toHaveTextContent("In");
    expect(marked[1].querySelector('[data-slot="frame-strip-mark"]')).toHaveTextContent("Out");
    expect(screen.getByRole("button", { name: /in point at 00:00:00/i })).toHaveAttribute("aria-pressed", "true");

    // In must precede out: marking in past the current out point drops the out
    // point rather than keeping an impossible range (this pair feeds D2).
    await userEvent.click(screen.getByRole("button", { name: /in point at 00:00:08/i }));
    expect(onInOutChange).toHaveBeenLastCalledWith({ inPoint: "f3", outPoint: undefined });
  });

  it("renders the reorder state", async () => {
    const onReorder = vi.fn();
    render(<FrameStrip kind="slides" items={PAGES} defaultValue="p1" onReorder={onReorder} />);

    await userEvent.click(screen.getByRole("button", { name: /move page 2 right/i }));
    expect(onReorder).toHaveBeenCalledWith("p2", "right");

    // Reorder stops at the ends rather than wrapping silently.
    expect(screen.getByRole("button", { name: /move page 1 left/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /move page 3 right/i })).toBeDisabled();

    // Hover-revealed, but never display:none — the controls stay in the tab
    // order and focus-within reveals them for keyboard users.
    const moveRight = screen.getByRole("button", { name: /move page 2 right/i });
    const controls = moveRight.parentElement!;
    expect(controls.className).toContain("group-focus-within/frame:opacity-100");
    expect(controls.className).not.toMatch(/(^|\s)hidden(\s|$)/);
    moveRight.focus();
    expect(moveRight).toHaveFocus();
  });

  it("does not shift the strip when the selection moves", () => {
    // H5's load-bearing sentence: "active item is ringed, not bordered, so the
    // strip does not shift when selection moves." Selecting may add ring
    // utilities (a box-shadow, zero layout) and nothing else, and it must not
    // remount the tiles.
    const { rerender } = render(<FrameStrip items={FRAMES} value="f1" />);
    const before = geometryClasses();
    const firstFrame = document.querySelectorAll('[data-slot="frame-strip-frame"]')[0];

    rerender(<FrameStrip items={FRAMES} value="f3" />);
    expect(geometryClasses()).toEqual(before);
    expect(document.querySelectorAll('[data-slot="frame-strip-frame"]')[0]).toBe(firstFrame);

    // Ringed, not bordered: no border utility on any frame, and the active one
    // carries the ring.
    const frames = [...document.querySelectorAll('[data-slot="preview-tile-frame"]')];
    for (const frame of frames) {
      expect(frame.className).not.toMatch(/(^|\s)border(-|\s|$)/);
    }
    expect(frames[2].className).toContain("ring-2");
    expect(frames[0].className).not.toContain("ring-2");
  });

  it("builds every tile on preview-tile rather than a hand-rolled thumbnail", () => {
    render(<FrameStrip items={FRAMES} onAdd={() => {}} onReorder={() => {}} />);

    // A8 keeps its own data-slot — the composition stays visible in the DOM.
    const frames = document.querySelectorAll('[data-slot="frame-strip-frame"]');
    expect(frames).toHaveLength(FRAMES.length);
    for (const frame of frames) {
      expect(frame.querySelector('[data-slot="preview-tile"]')).toBeInTheDocument();
    }
    expect(document.querySelector('[data-slot="frame-strip-add"] [data-slot="preview-tile"]')).toBeInTheDocument();

    // A8 renders its `action` slot inside the frame, so no control ever goes
    // there: one interactive element per tile, no nested interactives at all.
    expect(document.querySelector("button button")).toBeNull();
  });

  it("passes className through", () => {
    render(<FrameStrip className="test-class" />);
    expect(document.querySelector('[data-slot="frame-strip"]')!.className).toContain("test-class");
  });
});
