import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { TimelineShell, type TimelineShellProps } from "./timeline-shell";

const REGIONS = ["rail", "content-panel", "preview", "inspector", "transport", "tracks-ruler"];

const RAIL = [
  { id: "media", label: "Media", icon: <span /> },
  { id: "text", label: "Text", icon: <span /> },
];

const TRACKS: TimelineShellProps["tracks"] = [
  {
    id: "video",
    name: "Video",
    type: "filmstrip",
    clips: [{ id: "c1", label: "Opening shot", start: 0, end: 4 }],
  },
  {
    id: "voice",
    name: "Voice",
    type: "waveform",
    clips: [{ id: "c2", label: "Narration", start: 1, end: 6 }],
  },
];

const TRANSCRIPT: TimelineShellProps["transcript"] = {
  speakers: [{ id: "s1", name: "Ada" }],
  segments: [
    {
      id: "seg1",
      speakerId: "s1",
      tokens: [
        { id: "w1", kind: "word", text: "Northwind", start: 0, end: 1 },
        { id: "w2", kind: "word", text: "ships", start: 1, end: 2 },
      ],
    },
  ],
};

const JOBS: TimelineShellProps["renderJobs"] = [
  {
    id: "j1",
    name: "Rough cut",
    stage: "preview",
    state: "done",
    spec: { format: "MP4", codec: "H.264", resolution: "1280×720", fps: 24 },
  },
];

describe("TimelineShell", () => {
  it.each(REGIONS)("renders the %s region", (region) => {
    const { container } = render(<TimelineShell />);
    expect(container.querySelector(`[data-region="${region}"]`)).not.toBeNull();
  });

  it("passes className through", () => {
    render(<TimelineShell className="test-class" />);
    expect(document.querySelector('[data-slot="timeline-shell"]')!.className).toContain("test-class");
  });

  // O4 is "a variant of O3", and the rail is one of O3's invariants. The rail
  // region *is* B4 — if a future refactor hand-rolls an icon column, the region
  // marker and the composed component stop being the same element.
  it("composes B4 as the rail region itself", () => {
    const { container } = render(<TimelineShell railItems={RAIL} />);
    const rail = container.querySelector('[data-region="rail"]')!;
    expect(rail.getAttribute("data-slot")).toBe("modality-rail");
    expect(rail.querySelectorAll('[data-slot="modality-rail-item"]')).toHaveLength(2);
  });

  it("selects a tool through B4's own control", async () => {
    const onRailSelect = vi.fn();
    render(<TimelineShell railItems={RAIL} activeRailId="media" onRailSelect={onRailSelect} />);
    await userEvent.click(screen.getByRole("button", { name: "Text" }));
    expect(onRailSelect).toHaveBeenCalledWith("text");
  });

  it("composes I1 in the content panel", () => {
    const { container } = render(
      <TimelineShell panel={{ sections: [{ id: "stock", title: "Stock video", items: [] }] }} />,
    );
    const region = container.querySelector('[data-region="content-panel"]')!;
    expect(region.querySelector('[data-slot="tool-panel"]')).not.toBeNull();
    expect(within(region as HTMLElement).getByText("Stock video")).toBeVisible();
  });

  // "Export is staged through F6: a cheap preview render precedes the expensive
  // full export." The queue lives with the thing it renders, and it is mounted
  // whether or not anything is queued — a region that appears from nowhere
  // cannot teach that it exists.
  it("keeps F6 inside the preview region, mounted with or without jobs", () => {
    const { container, rerender } = render(<TimelineShell />);
    const emptyPreview = container.querySelector('[data-region="preview"]')!;
    expect(emptyPreview.querySelector('[data-slot="timeline-shell-render-queue"]')).not.toBeNull();

    rerender(<TimelineShell renderJobs={JOBS} />);
    const preview = container.querySelector('[data-region="preview"]')!;
    const queue = preview.querySelector('[data-slot="timeline-shell-render-queue"]')!;
    expect(queue.querySelector('[data-slot="render-queue"]')).not.toBeNull();
    // The spec column is what makes a queue auditable — assert F6's own cell,
    // not a string the shell could have printed itself.
    expect(queue.querySelector('[data-slot="render-queue-spec"]')!.textContent).toContain("H.264");
    expect(queue.querySelector('[data-slot="render-queue-stage"]')!.textContent).toBe("Preview");
  });

  it("composes H1 in the transport region and wires it to the shell clock", async () => {
    const onSeek = vi.fn();
    const { container } = render(<TimelineShell duration={30} currentTime={0} onSeek={onSeek} />);
    const region = container.querySelector('[data-region="transport"]')!;
    expect(region.querySelector('[data-slot="transport-controls"]')).not.toBeNull();
    // H1 falls back to onSeek when it has no onSkip, so this proves the
    // transport and the ruler are reading the same clock rather than two.
    await userEvent.click(screen.getByRole("button", { name: "Skip forward 5 seconds" }));
    expect(onSeek).toHaveBeenCalledWith(5);
  });

  it("composes H2 and H3 in the dock", () => {
    const { container } = render(<TimelineShell duration={10} tracks={TRACKS} />);
    const dock = container.querySelector('[data-region="tracks-ruler"]')!;
    expect(dock.querySelector('[data-slot="time-ruler"]')).not.toBeNull();
    expect(dock.querySelectorAll('[data-slot="track-lane"]')).toHaveLength(2);
  });

  // The one number the whole dock depends on. Ruler width and lane track width
  // are both `duration × zoom`, so if they ever disagree a clip has stopped
  // sitting under its own timecode.
  it("hands the ruler and every lane the same scale", () => {
    const { container } = render(<TimelineShell duration={10} zoom={30} tracks={TRACKS} />);
    const ruler = container.querySelector('[data-slot="time-ruler"]') as HTMLElement;
    const laneTracks = container.querySelectorAll<HTMLElement>('[data-slot="track-lane-track"]');
    expect(ruler.style.width).toBe("300px");
    expect(laneTracks).toHaveLength(2);
    for (const lane of laneTracks) expect(lane.style.width).toBe("300px");
  });

  // "The playhead spans every track, not just the ruler" (H2). H2 exports the
  // playhead separately for exactly this; a copy drawn by the shell would drift
  // from the ruler's own.
  it("draws a playhead across the whole dock, not only inside the ruler", () => {
    const { container } = render(<TimelineShell duration={10} tracks={TRACKS} currentTime={2} />);
    const dock = container.querySelector('[data-region="tracks-ruler"]')!;
    const heads = Array.from(dock.querySelectorAll('[data-slot="time-ruler-playhead"]'));
    const spanning = heads.filter((head) => head.closest('[data-slot="time-ruler"]') === null);
    expect(spanning).toHaveLength(1);
    expect(spanning[0].getAttribute("data-time")).toBe("2");
  });

  it("selects a clip through H3's own control", async () => {
    const onSelectClip = vi.fn();
    render(<TimelineShell duration={10} tracks={TRACKS} onSelectClip={onSelectClip} />);
    await userEvent.click(screen.getByRole("button", { name: "Opening shot" }));
    expect(onSelectClip).toHaveBeenCalledWith("c1");
  });

  // "The transcript variant (H4) replaces the track stack entirely." Replaces —
  // so the lanes and the ruler are gone, and the region is still there.
  it("replaces the track stack with H4 under variant=transcript", () => {
    const { container } = render(
      <TimelineShell variant="transcript" duration={10} tracks={TRACKS} transcript={TRANSCRIPT} />,
    );
    const dock = container.querySelector('[data-region="tracks-ruler"]')!;
    expect(dock.querySelector('[data-slot="transcript-editor"]')).not.toBeNull();
    expect(dock.querySelector('[data-slot="track-lane"]')).toBeNull();
    expect(dock.querySelector('[data-slot="time-ruler"]')).toBeNull();
  });

  // "Both are views of the same edit-decision list." One clock in, one seek out.
  it("marks the transcript token under the shared playhead", () => {
    const { container } = render(
      <TimelineShell variant="transcript" currentTime={1.5} transcript={TRANSCRIPT} />,
    );
    const current = container.querySelector('[data-token-id="w2"]')!;
    expect(current).toHaveAttribute("aria-current", "true");
    expect(container.querySelector('[data-token-id="w1"]')).not.toHaveAttribute("aria-current");
  });

  it("seeks the shell clock from a transcript token", async () => {
    const onSeek = vi.fn();
    render(<TimelineShell variant="transcript" transcript={TRANSCRIPT} onSeek={onSeek} />);
    await userEvent.click(screen.getByText("ships"));
    expect(onSeek).toHaveBeenCalledWith(1);
  });

  // "The inspector is selection-driven and must ship an empty state, because
  // nothing selected is the most common state" (O3, inherited by O4). I2 owns
  // that state — the shell must not paper over it with one of its own.
  it("composes I2 and leans on its own empty state", () => {
    const { container } = render(<TimelineShell />);
    const region = container.querySelector('[data-region="inspector"]')!;
    expect(region.querySelector('[data-slot="property-inspector"]')).not.toBeNull();
    expect(region.querySelector('[data-slot="property-inspector-empty"]')).not.toBeNull();
  });

  it("shows the inspector variant for the selected element type", () => {
    const { container } = render(
      <TimelineShell
        inspector={{
          elementType: "clip",
          selectionLabel: "Opening shot",
          // I2 keys its sections *by element type*, so switching selection is a
          // data lookup rather than a branch at the call site.
          sections: { clip: [{ id: "timing", label: "Timing", content: null }] },
        }}
      />,
    );
    const region = container.querySelector('[data-region="inspector"]')!;
    expect(region.querySelector('[data-slot="property-inspector-empty"]')).toBeNull();
    expect(within(region as HTMLElement).getByText("Timing")).toBeVisible();
  });

  // Day one: the stage, the dock and the queue are all empty at once, and each
  // one says so on its own rather than the shell collapsing to a single blank.
  it("falls to L1 in the stage, the dock and the queue on day one", () => {
    const { container } = render(<TimelineShell />);
    const preview = container.querySelector('[data-region="preview"]')!;
    const dock = container.querySelector('[data-region="tracks-ruler"]')!;
    const queue = preview.querySelector('[data-slot="timeline-shell-render-queue"]')!;
    expect(
      preview.querySelector('[data-slot="timeline-shell-stage"] [data-slot="empty-state"]'),
    ).not.toBeNull();
    expect(queue.querySelector('[data-slot="empty-state"]')).not.toBeNull();
    expect(dock.querySelector('[data-slot="empty-state"]')).not.toBeNull();
  });

  it("drops the stage empty state as soon as there is something to play", () => {
    const { container } = render(<TimelineShell preview={<div data-testid="player" />} />);
    const stage = container.querySelector('[data-slot="timeline-shell-stage"]')!;
    expect(stage.querySelector('[data-slot="empty-state"]')).toBeNull();
    expect(screen.getByTestId("player")).toBeVisible();
  });

  // Three regions scroll, so all three have to be reachable by keyboard and
  // named (axe scrollable-region-focusable).
  it("gives every scrolling region a name and a tab stop", () => {
    const { container } = render(<TimelineShell tracks={TRACKS} duration={10} />);
    const inspector = container.querySelector('[data-region="inspector"]')!;
    const dock = container.querySelector('[data-slot="timeline-shell-tracks"]')!;
    const queue = container.querySelector('[data-slot="timeline-shell-render-queue"]')!;
    for (const node of [inspector, dock, queue]) {
      expect(node).toHaveAttribute("tabindex", "0");
      expect(node).toHaveAccessibleName();
    }
  });
});
