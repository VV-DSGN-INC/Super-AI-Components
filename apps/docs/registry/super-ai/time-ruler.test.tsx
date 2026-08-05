import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  MIN_LABEL_GAP_PX,
  MIN_TICK_GAP_PX,
  TimeRuler,
  TimeRulerPlayhead,
  formatTimecode,
  pixelsToTime,
  snapTime,
  timeRulerScale,
  timeToPixels,
} from "./time-ruler";

const ticks = (root: HTMLElement) => [...root.querySelectorAll('[data-slot="time-ruler-tick"]')];
const labels = (root: HTMLElement) =>
  [...root.querySelectorAll('[data-slot="time-ruler-label"]')].map((n) => n.textContent?.trim());

/**
 * Base UI keeps a slider thumb `visibility: hidden` until it has measured the
 * track, which never happens under jsdom — so `getByRole("slider")` finds
 * nothing and the assertions go to the nested `input[type=range]` instead. Same
 * approach as compare-viewer.test.tsx; axe re-checks the names for real in the
 * story gate.
 */
const handle = (root: HTMLElement, slot: string) =>
  root.querySelector(`[data-slot="${slot}"] input[type="range"]`)!;

describe("TimeRuler", () => {
  it("renders the zoom-levels state", () => {
    const { container: coarse } = render(<TimeRuler duration={120} zoom={8} />);
    const { container: fine } = render(<TimeRuler duration={120} zoom={80} />);

    // Same 120 seconds, two zooms, two different scales — derived, not passed.
    expect(ticks(fine).length).toBeGreaterThan(ticks(coarse).length);
    expect(labels(fine).length).toBeGreaterThan(labels(coarse).length);

    // And the ruler is as wide as the timeline is long at that zoom, which is
    // what lets a track lane below it line up on the same grid.
    expect(coarse.querySelector<HTMLElement>('[data-slot="time-ruler"]')!.style.width).toBe("960px");
    expect(fine.querySelector<HTMLElement>('[data-slot="time-ruler"]')!.style.width).toBe("9600px");
  });

  it("renders the snap state", () => {
    const onPlayheadChange = vi.fn();
    const { container } = render(
      <TimeRuler duration={60} zoom={40} playhead={3} snap={0.5} onPlayheadChange={onPlayheadChange} />,
    );

    // Snap is the increment every value moves in — the playhead and both
    // handles step by it rather than by a pixel.
    expect(handle(container, "time-ruler-scrub")).toHaveAttribute("step", "0.5");

    // Without a snap the finest increment is one pixel of ruler, so precision
    // follows zoom instead of being fixed.
    const { container: free } = render(<TimeRuler duration={60} zoom={40} playhead={3} />);
    expect(handle(free, "time-ruler-scrub")).toHaveAttribute("step", "0.025");

    // And a seek that lands between increments is reported on the grid, not
    // where the pointer happened to be.
    fireEvent.change(handle(container, "time-ruler-scrub"), { target: { value: "3.7" } });
    expect(onPlayheadChange).toHaveBeenCalledWith(3.5);
  });

  it("renders the in-out-range state", () => {
    const { container } = render(
      <TimeRuler duration={60} zoom={20} playhead={12} inPoint={8} outPoint={30} />,
    );

    expect(handle(container, "time-ruler-in-handle")).toHaveAttribute("aria-label", "In point");
    expect(handle(container, "time-ruler-out-handle")).toHaveAttribute("aria-label", "Out point");
    expect(handle(container, "time-ruler-in-handle")).toHaveAttribute("aria-valuenow", "8");
    expect(handle(container, "time-ruler-out-handle")).toHaveAttribute("aria-valuenow", "30");
    expect(container.querySelector('[data-slot="time-ruler-range-band"]')).toBeInTheDocument();
  });

  it("renders the scrubbing state", () => {
    const { container } = render(<TimeRuler duration={60} zoom={20} playhead={7.5} scrubbing />);

    expect(container.querySelector('[data-slot="time-ruler"]')).toHaveAttribute(
      "data-scrubbing",
      "true",
    );
    // The readout is text and it is announced — the state is never carried by
    // the moving line alone.
    const bubble = screen.getByRole("status");
    expect(bubble).toHaveAttribute("data-slot", "time-ruler-playhead-time");
    expect(bubble).toHaveTextContent("0:07.50");

    const { container: idle } = render(<TimeRuler duration={60} zoom={20} playhead={7.5} />);
    expect(idle.querySelector('[data-slot="time-ruler"]')).not.toHaveAttribute("data-scrubbing");
    expect(idle.querySelector('[data-slot="time-ruler-playhead-time"]')).not.toBeInTheDocument();
  });

  it("passes className through", () => {
    render(<TimeRuler duration={60} className="test-class" />);
    expect(document.querySelector('[data-slot="time-ruler"]')!.className).toContain("test-class");
  });

  // ---------------------------------------------------------------------------
  // Load-bearing: "Tick density is derived from zoom. Labels thin out rather
  // than overlapping."
  // ---------------------------------------------------------------------------

  it("keeps labels from overlapping at every zoom, by thinning them out", () => {
    for (let zoom = 1; zoom <= 400; zoom += 1) {
      const scale = timeRulerScale(600, zoom);
      expect(timeToPixels(scale.labelInterval, zoom)).toBeGreaterThanOrEqual(MIN_LABEL_GAP_PX);
      expect(timeToPixels(scale.interval, zoom)).toBeGreaterThanOrEqual(MIN_TICK_GAP_PX);
    }
  });

  it("puts every label on a tick, so the two scales never drift apart", () => {
    for (let zoom = 1; zoom <= 400; zoom += 7) {
      const scale = timeRulerScale(600, zoom);
      const ratio = scale.labelInterval / scale.interval;
      expect(Math.abs(ratio - Math.round(ratio))).toBeLessThan(1e-6);

      const majors = scale.ticks.filter((t) => t.major);
      expect(majors.length).toBeGreaterThan(0);
      for (const tick of majors) {
        const multiple = tick.time / scale.labelInterval;
        expect(Math.abs(multiple - Math.round(multiple))).toBeLessThan(1e-6);
      }
    }
  });

  it("subdivides as you zoom in and never coarsens", () => {
    let previous = Infinity;
    for (let zoom = 1; zoom <= 400; zoom += 1) {
      const { interval } = timeRulerScale(600, zoom);
      expect(interval).toBeLessThanOrEqual(previous);
      previous = interval;
    }
    // Nothing about the scale is fixed: an order of magnitude of zoom moves it
    // by an order of magnitude too.
    expect(timeRulerScale(600, 4).interval).toBeGreaterThan(timeRulerScale(600, 400).interval * 10);
  });

  it("uses human-readable intervals rather than dividing the span by a constant", () => {
    const seen = new Set<number>();
    for (let zoom = 1; zoom <= 400; zoom += 1) seen.add(timeRulerScale(600, zoom).interval);
    for (const interval of seen) {
      expect([0.04, 0.1, 0.2, 0.5, 1, 2, 5, 10, 15, 30, 60, 120, 300, 600]).toContain(interval);
    }
  });

  // ---------------------------------------------------------------------------
  // Load-bearing: "The playhead spans every track, not just the ruler."
  // ---------------------------------------------------------------------------

  it("draws a playhead that is not clipped to the ruler box", () => {
    const { container } = render(<TimeRuler duration={60} zoom={20} playhead={9} />);
    const root = container.querySelector<HTMLElement>('[data-slot="time-ruler"]')!;
    const playhead = container.querySelector<HTMLElement>('[data-slot="time-ruler-playhead"]')!;

    expect(root.className).not.toContain("overflow-hidden");
    // Its height is the caller's to set — give it the height of the track
    // stack and the same line runs down every lane.
    expect(playhead.style.height).toBe("var(--time-ruler-playhead-height, 100%)");
    expect(playhead.style.left).toBe("180px");
  });

  it("places a standalone playhead exactly where the ruler places its own", () => {
    const { container: inRuler } = render(<TimeRuler duration={60} zoom={20} playhead={9} />);
    const { container: alone } = render(<TimeRulerPlayhead time={9} zoom={20} />);

    const at = (root: HTMLElement) =>
      root.querySelector<HTMLElement>('[data-slot="time-ruler-playhead"]')!.style.left;

    // Same two numbers in, same offset out — a playhead rendered across a stack
    // of lanes cannot disagree with the ruler about where "now" is.
    expect(at(alone)).toBe(at(inRuler));
    expect(alone.querySelector('[data-slot="time-ruler-playhead"]')).toHaveAttribute("data-time", "9");
  });

  // ---------------------------------------------------------------------------
  // Load-bearing: "In/out handles are a separate layer from the playhead."
  // ---------------------------------------------------------------------------

  it("keeps the playhead and the in/out range as three independent values", () => {
    const onPlayheadChange = vi.fn();
    const onRangeChange = vi.fn();
    const { container, rerender } = render(
      <TimeRuler
        duration={60}
        zoom={20}
        playhead={12}
        inPoint={8}
        outPoint={30}
        onPlayheadChange={onPlayheadChange}
        onRangeChange={onRangeChange}
      />,
    );

    expect(handle(container, "time-ruler-scrub")).toHaveAttribute("aria-valuenow", "12");
    expect(handle(container, "time-ruler-in-handle")).toHaveAttribute("aria-valuenow", "8");
    expect(handle(container, "time-ruler-out-handle")).toHaveAttribute("aria-valuenow", "30");

    // Moving the range does not move the playhead, even when the playhead sits
    // inside the range being redrawn.
    rerender(
      <TimeRuler
        duration={60}
        zoom={20}
        playhead={12}
        inPoint={2}
        outPoint={50}
        onPlayheadChange={onPlayheadChange}
        onRangeChange={onRangeChange}
      />,
    );
    expect(handle(container, "time-ruler-scrub")).toHaveAttribute("aria-valuenow", "12");
    expect(onPlayheadChange).not.toHaveBeenCalled();
  });

  it("draws no range layer at all until both points are set", () => {
    const { container } = render(<TimeRuler duration={60} zoom={20} inPoint={5} />);
    expect(container.querySelector('[data-slot="time-ruler-range"]')).not.toBeInTheDocument();
    // The playhead is not conditional on it.
    expect(container.querySelector('[data-slot="time-ruler-playhead"]')).toBeInTheDocument();
  });

  // ---------------------------------------------------------------------------
  // Accessible names — the slider trap
  // ---------------------------------------------------------------------------

  it("names the scrub handle and speaks its value as a timecode", () => {
    const { container } = render(<TimeRuler duration={60} zoom={20} playhead={7.5} />);
    const scrub = handle(container, "time-ruler-scrub");
    expect(scrub).toHaveAttribute("aria-label", "Playhead");
    expect(scrub).toHaveAttribute("aria-valuetext", "0:07.50");
  });

  it("honours a caller's time format everywhere, labels included", () => {
    const { container } = render(
      <TimeRuler duration={60} zoom={20} playhead={7} formatTime={(s) => `${s}s`} />,
    );
    expect(handle(container, "time-ruler-scrub")).toHaveAttribute("aria-valuetext", "7s");
    expect(labels(container)[1]).toBe("5s");
  });

  // ---------------------------------------------------------------------------
  // The coordinate model, which H3 track-lane shares
  // ---------------------------------------------------------------------------

  it("exposes the coordinate model as pure functions", () => {
    expect(timeToPixels(2.5, 40)).toBe(100);
    expect(pixelsToTime(100, 40)).toBe(2.5);
    // A zero zoom is a division by zero waiting to happen in a lane renderer.
    expect(pixelsToTime(100, 0)).toBe(0);
  });

  it("snaps to an increment, and rounds the float noise that comes with it", () => {
    expect(snapTime(3.7, 0.5)).toBe(3.5);
    expect(snapTime(3.8, 0.5)).toBe(4);
    expect(snapTime(0.1 + 0.2, 0.1)).toBe(0.3);
    // No snap means no rounding to a grid.
    expect(snapTime(3.7)).toBe(3.7);
    expect(snapTime(3.7, 0)).toBe(3.7);
  });

  it("formats timecodes rather than bare seconds", () => {
    expect(formatTimecode(7)).toBe("0:07");
    expect(formatTimecode(7.5, 2)).toBe("0:07.50");
    expect(formatTimecode(3725)).toBe("1:02:05");
    // 59.6 must not round to "0:60".
    expect(formatTimecode(59.6)).toBe("1:00");
  });
});
