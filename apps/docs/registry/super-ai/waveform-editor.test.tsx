import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { WaveformEditor, type WaveformRegion, type WaveformRegionAction } from "./waveform-editor";

// 44.1 kHz, ~2.97 s. Sample-accurate numbers throughout — this component has
// no second-valued API surface at all.
const SAMPLE_RATE = 44_100;
const SAMPLE_COUNT = 131_072;
const PEAKS = Array.from({ length: 64 }, (_, i) => 0.2 + 0.6 * Math.abs(Math.sin(i / 4)));

const REGION: WaveformRegion = { start: 12_000, end: 30_000, label: "Breath" };

const ACTIONS: WaveformRegionAction[] = [
  { id: "trim", label: "Trim" },
  { id: "silence", label: "Silence" },
  { id: "delete", label: "Delete", destructive: true },
];

/**
 * Base UI keeps a slider thumb `visibility: hidden` until it has measured the
 * track, which never happens under jsdom — so `getByRole("slider")` correctly
 * finds nothing. The nested `input[type=range]` is where the accessible name
 * and value live, and axe re-checks the rendered result for real in the story
 * gate. Same technique as compare-viewer.test.tsx.
 */
const rangeInputs = (root: HTMLElement, slot: string) => [
  ...root.querySelectorAll<HTMLInputElement>(`[data-slot="${slot}"] input[type="range"]`),
];

const rangeInput = (root: HTMLElement, slot: string) => rangeInputs(root, slot)[0]!;

const renderEditor = (props: Partial<React.ComponentProps<typeof WaveformEditor>> = {}) =>
  render(<WaveformEditor peaks={PEAKS} sampleCount={SAMPLE_COUNT} sampleRate={SAMPLE_RATE} {...props} />);

describe("WaveformEditor", () => {
  it("renders the region-select state", () => {
    const { container } = renderEditor({ region: REGION, onRegionChange: () => {} });

    // Both boundaries are draggable handles *and* named values — never a
    // nameless drag target.
    const thumbs = rangeInputs(container, "waveform-editor-region-band");
    expect(thumbs).toHaveLength(2);
    expect(thumbs[0]).toHaveAttribute("aria-label", "Region start");
    expect(thumbs[1]).toHaveAttribute("aria-label", "Region end");

    // …and the same two numbers are typeable text, so the selection is
    // operable without seeing the waveform at all.
    expect(screen.getByLabelText("Start")).toHaveValue(12_000);
    expect(screen.getByLabelText("End")).toHaveValue(30_000);

    // Derived length, in samples and in time.
    expect(screen.getByText("18,000 smp")).toBeInTheDocument();
    expect(screen.getByText("408.2 ms")).toBeInTheDocument();
    expect(screen.getByText("Breath")).toBeInTheDocument();
  });

  it("renders the zoom-to-sample state", () => {
    const { container } = renderEditor({
      view: { start: 12_000, end: 12_008 },
      playhead: 12_004,
      onViewChange: () => {},
    });

    expect(container.querySelector('[data-slot="waveform-editor"]')).toHaveAttribute(
      "data-sample-level",
      "true",
    );
    // The zoom level stated in the only unit that answers "can I address one
    // sample yet?" — not a magnification factor.
    expect(container.querySelector('[data-slot="waveform-editor-view-readout"]')).toHaveTextContent(
      "8 samples visible · 1 sample per column",
    );

    const zoom = rangeInput(container, "waveform-editor-zoom");
    expect(zoom).toHaveAttribute("aria-label", "Zoom level");
    expect(zoom).toHaveAttribute("aria-valuetext", "8 samples visible");
  });

  it("renders the scrub state", () => {
    const { container } = renderEditor({ playhead: 12_000, onScrub: () => {} });

    const playhead = rangeInput(container, "waveform-editor-playhead");
    expect(playhead).toHaveAttribute("aria-label", "Playhead");
    expect(playhead).toHaveAttribute("aria-valuenow", "12000");
    // Samples first, time second — the time is a courtesy rendering of the
    // sample offset, not the value itself.
    expect(playhead).toHaveAttribute("aria-valuetext", "12,000 samples, 0:00.272");

    expect(container.querySelector('[data-slot="waveform-editor-playhead-readout"]')).toHaveTextContent(
      "Playhead 12,000 smp · 0:00.272",
    );
  });

  it("renders the region-actions state", async () => {
    const onRegionAction = vi.fn();
    renderEditor({ region: REGION, regionActions: ACTIONS, onRegionAction });

    const group = screen.getByRole("group", { name: "Region actions" });
    // Every action names the region it will act on, so "Delete" is never an
    // unqualified verb when read out of context.
    await userEvent.click(
      within(group).getByRole("button", { name: "Delete region 12,000 to 30,000 samples" }),
    );
    expect(onRegionAction).toHaveBeenCalledWith("delete", REGION);

    expect(within(group).getByRole("button", { name: /^Trim region/ })).toBeInTheDocument();
    expect(within(group).getByRole("button", { name: /^Silence region/ })).toBeInTheDocument();
  });

  it("passes className through", () => {
    render(
      <WaveformEditor
        peaks={PEAKS}
        sampleCount={SAMPLE_COUNT}
        sampleRate={SAMPLE_RATE}
        className="test-class"
      />,
    );
    expect(document.querySelector('[data-slot="waveform-editor"]')!.className).toContain("test-class");
  });

  // ---------------------------------------------------------------------------
  // Load-bearing (catalog.md H6 + gaps.md R3 — this component has no spec prose)
  // ---------------------------------------------------------------------------

  it("reports every boundary edit as an integer sample offset", () => {
    const onRegionChange = vi.fn();
    renderEditor({ region: REGION, onRegionChange });

    fireEvent.change(screen.getByLabelText("Start"), { target: { value: "12345" } });
    expect(onRegionChange).toHaveBeenCalledWith({ start: 12_345, end: 30_000, label: "Breath" });

    fireEvent.change(screen.getByLabelText("End"), { target: { value: "29999.6" } });
    expect(onRegionChange).toHaveBeenLastCalledWith({
      start: 12_000,
      end: 30_000,
      label: "Breath",
    });
  });

  it("keeps a boundary adjustable one sample at a time", () => {
    // R3's whole justification: track-lane selects whole clips, and a ruler
    // that tops out at frames cannot express this. One sample of movement has
    // to be reachable, and at full zoom-out a mouse cannot deliver it.
    const onRegionChange = vi.fn();
    renderEditor({
      region: { start: 12_000, end: 30_000 },
      view: { start: 0, end: SAMPLE_COUNT },
      onRegionChange,
    });

    fireEvent.change(screen.getByLabelText("Start"), { target: { value: "12001" } });
    expect(onRegionChange).toHaveBeenCalledWith({ start: 12_001, end: 30_000 });
  });

  it("refuses to let a boundary cross the other one", () => {
    const onRegionChange = vi.fn();
    renderEditor({ region: { start: 12_000, end: 30_000 }, onRegionChange });

    fireEvent.change(screen.getByLabelText("Start"), { target: { value: "80000" } });
    expect(onRegionChange).toHaveBeenCalledWith({ start: 29_999, end: 30_000 });

    fireEvent.change(screen.getByLabelText("End"), { target: { value: "0" } });
    expect(onRegionChange).toHaveBeenLastCalledWith({ start: 12_000, end: 12_001 });
  });

  it("keeps the true boundary values when the region runs past the visible window", () => {
    const { container } = renderEditor({
      region: { start: 1_000, end: 120_000 },
      view: { start: 10_000, end: 20_000 },
      onRegionChange: () => {},
    });

    // The band thumbs are clamped to the window — you cannot drag what you
    // cannot see …
    const thumbs = rangeInputs(container, "waveform-editor-region-band");
    expect(thumbs[0]).toHaveAttribute("aria-valuenow", "10000");
    expect(thumbs[1]).toHaveAttribute("aria-valuenow", "20000");

    // … but the numbers never lie about where the region actually is, and the
    // discrepancy is stated in text rather than left to be inferred.
    expect(screen.getByLabelText("Start")).toHaveValue(1_000);
    expect(screen.getByLabelText("End")).toHaveValue(120_000);
    expect(container.querySelector('[data-slot="waveform-editor-region-clipped"]')).toBeInTheDocument();
  });

  it("anchors a zoom-to-region on the region, not on the buffer origin", async () => {
    const onViewChange = vi.fn();
    renderEditor({ region: REGION, onViewChange });

    await userEvent.click(screen.getByRole("button", { name: "Zoom to region" }));
    expect(onViewChange).toHaveBeenCalledWith({ start: 12_000, end: 30_000 });

    await userEvent.click(screen.getByRole("button", { name: "Fit" }));
    expect(onViewChange).toHaveBeenLastCalledWith({ start: 0, end: SAMPLE_COUNT });
  });

  it("never shrinks the window below the sample floor", async () => {
    const onViewChange = vi.fn();
    renderEditor({
      region: { start: 5_000, end: 5_001 },
      minVisibleSamples: 8,
      onViewChange,
    });

    await userEvent.click(screen.getByRole("button", { name: "Zoom to region" }));
    // A one-sample region would otherwise zoom to a one-sample window, which
    // has nothing to draw and nowhere to put the playhead.
    expect(onViewChange).toHaveBeenCalledWith({ start: 4_997, end: 5_005 });
  });

  it("reports a scrub without moving the playhead itself", () => {
    const onScrub = vi.fn();
    const { container } = renderEditor({ playhead: 12_000, onScrub });

    fireEvent.change(rangeInput(container, "waveform-editor-playhead"), {
      target: { value: "12500" },
    });
    expect(onScrub).toHaveBeenCalledWith(12_500);

    // Fully controlled: the component holds no playhead state of its own, so
    // the rendered value is unchanged until the caller sends a new prop.
    expect(container.querySelector('[data-slot="waveform-editor-playhead-readout"]')).toHaveTextContent(
      "Playhead 12,000 smp",
    );
  });

  it("inerts the controls it was given no handler for", () => {
    const { container } = renderEditor({ region: REGION });

    expect(rangeInput(container, "waveform-editor-playhead")).toBeDisabled();
    expect(rangeInput(container, "waveform-editor-region-band")).toBeDisabled();
    expect(screen.getByLabelText("Start")).toHaveAttribute("readonly");
    expect(container.querySelector('[data-slot="waveform-editor-zoom"]')).toBeNull();
    expect(screen.queryByRole("button", { name: "Fit" })).not.toBeInTheDocument();
  });

  it("announces selection and zoom but never the playhead", () => {
    const { container } = renderEditor({
      region: REGION,
      playhead: 12_000,
      view: { start: 0, end: 32_768 },
      onScrub: () => {},
    });

    expect(container.querySelector('[data-slot="waveform-editor-region-status"]')).toHaveTextContent(
      "Region 12,000 to 30,000 samples, 0:00.272 to 0:00.680, 18,000 samples long",
    );
    expect(container.querySelector('[data-slot="waveform-editor-view-status"]')).toHaveTextContent(
      "Showing 32,768 samples from 0",
    );

    // The playhead moves on every arrow press; a live region on it would talk
    // over everything else. Its slider's aria-valuetext covers it instead.
    const readout = container.querySelector('[data-slot="waveform-editor-playhead-readout"]')!;
    expect(readout).not.toHaveAttribute("aria-live");
    expect(readout).not.toHaveAttribute("role");
  });

  it("hides the waveform picture from assistive technology", () => {
    const { container } = renderEditor({ region: REGION });
    expect(container.querySelector('[data-slot="waveform-editor-peaks"]')).toHaveAttribute(
      "aria-hidden",
      "true",
    );
    expect(container.querySelector('[data-slot="waveform-editor-region-overlay"]')).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });

  it("marks the sample-level regime programmatically, not just visually", () => {
    const { container, rerender } = renderEditor({ view: { start: 0, end: SAMPLE_COUNT } });
    expect(container.querySelector('[data-slot="waveform-editor"]')).toHaveAttribute(
      "data-sample-level",
      "false",
    );
    expect(container.querySelector('[data-slot="waveform-editor-view-readout"]')).toHaveTextContent(
      "1,365 samples per column",
    );

    rerender(
      <WaveformEditor
        peaks={PEAKS}
        sampleCount={SAMPLE_COUNT}
        sampleRate={SAMPLE_RATE}
        view={{ start: 0, end: 64 }}
      />,
    );
    expect(container.querySelector('[data-slot="waveform-editor"]')).toHaveAttribute(
      "data-sample-level",
      "true",
    );
  });

  it("stays an editor and never becomes a generator", () => {
    renderEditor({ region: REGION, regionActions: ACTIONS, onRegionAction: () => {} });
    // The E9 tts-composer boundary: script in / audio out is not this
    // component's job, and a regenerate control here is the drift that
    // collapses the two.
    expect(screen.queryByRole("button", { name: /regenerate|generate/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });

  it("says so when there is nothing selected", () => {
    const { container } = renderEditor({ region: null });
    expect(container.querySelector('[data-slot="waveform-editor-no-region"]')).toHaveTextContent(
      "No region selected",
    );
    expect(screen.queryByLabelText("Start")).not.toBeInTheDocument();
    expect(screen.queryByRole("group", { name: "Region actions" })).not.toBeInTheDocument();
  });
});
