import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TtsComposer, type TtsComposerSegment } from "./tts-composer";

const SEGMENTS: TtsComposerSegment[] = [
  { id: "s1", text: "Welcome to the show.", voice: "Bella", emotion: "Warm", status: "ready", durationLabel: "0:03", regenerateCost: 2 },
  { id: "s2", text: "Today we're talking about design systems.", voice: "Bella", emotion: "Excited", status: "ready", regenerateCost: 2 },
];

describe("TtsComposer", () => {
  it("renders the segment-select state — selecting a segment expands its settings inspector", async () => {
    const onSelectSegment = vi.fn();
    render(<TtsComposer segments={SEGMENTS} selectedSegmentId="s1" onSelectSegment={onSelectSegment} />);

    const selectFirst = screen.getByRole("button", { name: "Select Segment 1" });
    const selectSecond = screen.getByRole("button", { name: "Select Segment 2" });
    expect(selectFirst).toHaveAttribute("aria-pressed", "true");
    expect(selectSecond).toHaveAttribute("aria-pressed", "false");

    // The selected segment's settings are exposed as a labelled group —
    // programmatic state, not just a visual highlight.
    expect(screen.getByRole("group", { name: "Segment 1 settings" })).toBeInTheDocument();
    expect(screen.queryByRole("group", { name: "Segment 2 settings" })).not.toBeInTheDocument();

    await userEvent.click(selectSecond);
    expect(onSelectSegment).toHaveBeenCalledWith("s2");
  });

  it("renders the per-segment-regenerate state — priced, discernibly named, and announced while running", async () => {
    const onRegenerateSegment = vi.fn();
    const segments: TtsComposerSegment[] = [
      { ...SEGMENTS[0]!, status: "generating" },
      SEGMENTS[1]!,
    ];
    render(<TtsComposer segments={segments} onRegenerateSegment={onRegenerateSegment} costUnit="credits" />);

    // Each regenerate control names the segment it acts on, never a bare "Regenerate".
    const regenerateFirst = screen.getByRole("button", { name: "Regenerate Segment 1" });
    const regenerateSecond = screen.getByRole("button", { name: "Regenerate Segment 2" });
    expect(regenerateFirst).toBeDisabled();
    expect(regenerateSecond).not.toBeDisabled();

    // Regeneration is priced per segment — never a whole-script regenerate control.
    expect(screen.getAllByText("2 credits")).toHaveLength(2);
    expect(screen.queryByRole("button", { name: /regenerate script/i })).not.toBeInTheDocument();

    // The transition is announced, not just shown by the spinner icon.
    expect(screen.getByText("Segment 1: Generating…", { selector: '[role="status"]' })).toBeInTheDocument();

    await userEvent.click(regenerateSecond);
    expect(onRegenerateSegment).toHaveBeenCalledWith("s2");
  });

  it("renders the whole-script-play state — transport toggles and the current segment is announced", async () => {
    const onPlayScript = vi.fn();
    const onPauseScript = vi.fn();
    const { rerender } = render(
      <TtsComposer
        segments={SEGMENTS}
        isPlayingScript={false}
        onPlayScript={onPlayScript}
        onPauseScript={onPauseScript}
        scriptDurationLabel="0:32"
      />,
    );

    const playButton = screen.getByRole("button", { name: "Play script" });
    expect(playButton).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByText("0:32")).toBeInTheDocument();

    await userEvent.click(playButton);
    expect(onPlayScript).toHaveBeenCalledOnce();

    rerender(
      <TtsComposer
        segments={SEGMENTS}
        isPlayingScript
        playingSegmentId="s2"
        onPlayScript={onPlayScript}
        onPauseScript={onPauseScript}
      />,
    );

    const pauseButton = screen.getByRole("button", { name: "Pause script" });
    expect(pauseButton).toHaveAttribute("aria-pressed", "true");
    // Playback state is announced rather than shown only by the icon swap.
    expect(screen.getByText("Playing script — Segment 2", { selector: '[role="status"]' })).toBeInTheDocument();

    await userEvent.click(pauseButton);
    expect(onPauseScript).toHaveBeenCalledOnce();
  });

  it("passes className through", () => {
    render(<TtsComposer segments={SEGMENTS} className="test-class" />);
    expect(document.querySelector('[data-slot="tts-composer"]')!.className).toContain("test-class");
  });
});
