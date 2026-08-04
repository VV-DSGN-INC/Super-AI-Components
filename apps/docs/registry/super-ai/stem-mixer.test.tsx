import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { StemMixer, type Stem } from "./stem-mixer";

const STEMS: Stem[] = [
  { id: "drums", name: "Drums", volume: 84, pan: -30 },
  { id: "bass", name: "Bass", volume: 70, pan: 0 },
  { id: "vocals", name: "Vocals", volume: 92, pan: 20 },
];

const laneState = (name: string) =>
  screen
    .getByText(name)
    .closest('[data-slot="stem-mixer-lane"]')!
    .querySelector('[data-slot="stem-mixer-lane-state"]')!.textContent;

const lane = (container: HTMLElement, id: string) =>
  container.querySelector<HTMLElement>(`[data-slot="stem-mixer-lane"][data-stem-id="${id}"]`)!;

/**
 * Base UI keeps a slider thumb `visibility: hidden` until it has measured the
 * track, which never happens under jsdom — so `getByRole("slider")` correctly
 * finds nothing. The hidden `input[type=range]` carries the same ARIA, and axe
 * re-checks the real thing in the story gate. Same approach as compare-viewer.
 */
const rangeInput = (root: HTMLElement, slot: string) =>
  root.querySelector(`[data-slot="${slot}"] input[type="range"]`)!;

describe("StemMixer", () => {
  // ---------------------------------------------------------------------------
  // Declared states
  // ---------------------------------------------------------------------------

  it("renders the exclusive-solo state", async () => {
    const onSoloChange = vi.fn();
    const stems = STEMS.map((stem) => ({ ...stem, soloed: stem.id === "drums" }));
    const { container } = render(
      <StemMixer stems={stems} soloMode="exclusive" onSoloChange={onSoloChange} />,
    );

    expect(container.querySelector('[data-slot="stem-mixer"]')).toHaveAttribute(
      "data-solo-mode",
      "exclusive",
    );
    // The mode is stated, not left to be inferred from which lanes are lit.
    expect(container.querySelector('[data-slot="stem-mixer-solo-mode"]')).toHaveTextContent(
      "Solo is exclusive",
    );

    // Soloing one lane silences the rest, and every lane says so in words.
    expect(laneState("Drums")).toBe("Solo");
    expect(laneState("Bass")).toBe("Silenced by solo");
    expect(laneState("Vocals")).toBe("Silenced by solo");

    // Pressing another lane's solo hands back a set of exactly one.
    await userEvent.click(screen.getByRole("button", { name: "Solo Bass" }));
    expect(onSoloChange).toHaveBeenCalledWith("bass", ["bass"]);
  });

  it("renders the additive-solo state", async () => {
    const onSoloChange = vi.fn();
    const stems = STEMS.map((stem) => ({ ...stem, soloed: stem.id === "drums" }));
    const { container } = render(
      <StemMixer stems={stems} soloMode="additive" onSoloChange={onSoloChange} />,
    );

    expect(container.querySelector('[data-slot="stem-mixer"]')).toHaveAttribute(
      "data-solo-mode",
      "additive",
    );
    expect(container.querySelector('[data-slot="stem-mixer-solo-mode"]')).toHaveTextContent(
      "Solo is additive",
    );

    // Same markup as exclusive — only the resolution differs.
    await userEvent.click(screen.getByRole("button", { name: "Solo Bass" }));
    expect(onSoloChange).toHaveBeenCalledWith("bass", ["drums", "bass"]);
  });

  it("renders the live-meters state", () => {
    const stems = STEMS.map((stem, i) => ({ ...stem, level: [72, 41, 0][i] }));
    render(<StemMixer stems={stems} />);

    // A meter per lane, each named for its stem rather than being one of three
    // anonymous progressbars.
    expect(screen.getByRole("progressbar", { name: "Drums level" })).toHaveAttribute(
      "aria-valuenow",
      "72",
    );
    expect(screen.getByRole("progressbar", { name: "Bass level" })).toHaveAttribute(
      "aria-valuenow",
      "41",
    );
    expect(screen.getByRole("progressbar", { name: "Vocals level" })).toHaveAttribute(
      "aria-valuenow",
      "0",
    );
  });

  it("renders the stem-lineage state", () => {
    const { container } = render(
      <StemMixer
        stems={[
          {
            ...STEMS[0],
            lineage: {
              origin: "separated",
              source: "Midnight Drive (master).wav",
              detail: "Demucs v4",
            },
          },
          { ...STEMS[1], lineage: { origin: "generated", source: "warm upright bass, 92 BPM" } },
        ]}
      />,
    );

    const drums = within(lane(container, "drums")).getByText(/Separated from/);
    expect(drums).toHaveTextContent("Separated from Midnight Drive (master).wav · Demucs v4");
    expect(drums.closest('[data-slot="stem-mixer-lineage"]')).toHaveAttribute(
      "data-origin",
      "separated",
    );

    // Origin is spelled out, so separated and generated are never told apart by
    // icon shape alone.
    expect(within(lane(container, "bass")).getByText(/Generated from/)).toHaveTextContent(
      "Generated from warm upright bass, 92 BPM",
    );
  });

  it("passes className through", () => {
    render(<StemMixer stems={STEMS} className="test-class" />);
    expect(document.querySelector('[data-slot="stem-mixer"]')!.className).toContain("test-class");
  });

  // ---------------------------------------------------------------------------
  // Load-bearing: exclusive vs additive is a prop, not a fork (gaps.md R4)
  // ---------------------------------------------------------------------------

  it("clears the solo set when the only soloed stem is pressed again, in exclusive mode", async () => {
    const onSoloChange = vi.fn();
    render(
      <StemMixer
        stems={STEMS.map((stem) => ({ ...stem, soloed: stem.id === "drums" }))}
        soloMode="exclusive"
        onSoloChange={onSoloChange}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Solo Drums" }));
    expect(onSoloChange).toHaveBeenCalledWith("drums", []);
  });

  it("removes only the pressed stem from the solo set, in additive mode", async () => {
    const onSoloChange = vi.fn();
    render(
      <StemMixer
        stems={STEMS.map((stem) => ({ ...stem, soloed: stem.id !== "vocals" }))}
        soloMode="additive"
        onSoloChange={onSoloChange}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Solo Bass" }));
    expect(onSoloChange).toHaveBeenCalledWith("bass", ["drums"]);
  });

  it("emits the resulting solo set in stem order, not press order", async () => {
    const onSoloChange = vi.fn();
    render(
      <StemMixer
        stems={STEMS.map((stem) => ({ ...stem, soloed: stem.id === "vocals" }))}
        soloMode="additive"
        onSoloChange={onSoloChange}
      />,
    );
    // Vocals was soloed first, but drums comes first in `stems`.
    await userEvent.click(screen.getByRole("button", { name: "Solo Drums" }));
    expect(onSoloChange).toHaveBeenCalledWith("drums", ["drums", "vocals"]);
  });

  it("defaults to exclusive solo", async () => {
    const onSoloChange = vi.fn();
    render(
      <StemMixer
        stems={STEMS.map((stem) => ({ ...stem, soloed: stem.id === "drums" }))}
        onSoloChange={onSoloChange}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Solo Bass" }));
    expect(onSoloChange).toHaveBeenCalledWith("bass", ["bass"]);
  });

  it("is fully controlled — pressing solo changes nothing until the caller says so", async () => {
    render(<StemMixer stems={STEMS} soloMode="exclusive" />);
    await userEvent.click(screen.getByRole("button", { name: "Solo Drums" }));
    expect(screen.getByRole("button", { name: "Solo Drums" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(laneState("Drums")).toBe("Audible");
  });

  // ---------------------------------------------------------------------------
  // Load-bearing: audibility is stated, never conveyed by colour alone
  // ---------------------------------------------------------------------------

  it("says in words why a lane is silent, and marks it programmatically", () => {
    const { container } = render(
      <StemMixer
        stems={[
          { ...STEMS[0], soloed: true },
          { ...STEMS[1] },
          { ...STEMS[2], muted: true, soloed: true },
        ]}
      />,
    );

    expect(laneState("Drums")).toBe("Solo");
    expect(lane(container, "drums")).toHaveAttribute("data-audible", "true");

    // Not soloed while someone else is — silent, and it says so.
    expect(laneState("Bass")).toBe("Silenced by solo");
    expect(lane(container, "bass")).toHaveAttribute("data-audible", "false");

    // Mute beats solo: an explicitly muted lane reads as muted even when soloed.
    expect(laneState("Vocals")).toBe("Muted");
    expect(lane(container, "vocals")).toHaveAttribute("data-audible", "false");
  });

  it("announces the audible count, and names the soloed stems", () => {
    const { rerender, container } = render(<StemMixer stems={STEMS} />);
    const summary = container.querySelector('[data-slot="stem-mixer-summary"]')!;
    expect(summary).toHaveAttribute("role", "status");
    expect(summary).toHaveTextContent("3 of 3 stems audible.");

    rerender(<StemMixer stems={STEMS.map((s) => ({ ...s, soloed: s.id === "bass" }))} />);
    expect(container.querySelector('[data-slot="stem-mixer-summary"]')).toHaveTextContent(
      "Soloing Bass. 1 of 3 stems audible.",
    );
  });

  // ---------------------------------------------------------------------------
  // Controls
  // ---------------------------------------------------------------------------

  it("gives mute and solo real toggle semantics, named for their stem", async () => {
    const onMuteChange = vi.fn();
    render(
      <StemMixer stems={[{ ...STEMS[0], muted: true }, STEMS[1]]} onMuteChange={onMuteChange} />,
    );

    expect(screen.getByRole("button", { name: "Mute Drums" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "Mute Bass" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );

    await userEvent.click(screen.getByRole("button", { name: "Mute Drums" }));
    expect(onMuteChange).toHaveBeenCalledWith("drums", false);
    await userEvent.click(screen.getByRole("button", { name: "Mute Bass" }));
    expect(onMuteChange).toHaveBeenCalledWith("bass", true);
  });

  it("names every slider thumb for its stem", () => {
    const { container } = render(<StemMixer stems={STEMS} />);

    const drums = lane(container, "drums");
    expect(rangeInput(drums, "stem-mixer-volume")).toHaveAttribute("aria-label", "Drums volume");
    expect(rangeInput(drums, "stem-mixer-volume")).toHaveAttribute("aria-valuenow", "84");

    const vocals = lane(container, "vocals");
    expect(rangeInput(vocals, "stem-mixer-pan")).toHaveAttribute("aria-label", "Vocals pan");
  });

  it("announces pan as a position rather than a signed number", () => {
    const { container } = render(<StemMixer stems={STEMS} />);
    expect(rangeInput(lane(container, "drums"), "stem-mixer-pan")).toHaveAttribute(
      "aria-valuetext",
      "30% left",
    );
    expect(rangeInput(lane(container, "bass"), "stem-mixer-pan")).toHaveAttribute(
      "aria-valuetext",
      "Centre",
    );
    expect(rangeInput(lane(container, "vocals"), "stem-mixer-pan")).toHaveAttribute(
      "aria-valuetext",
      "20% right",
    );
  });

  it("renders no meter for a stem with no measured level", () => {
    const { container } = render(<StemMixer stems={[{ ...STEMS[0], level: 55 }, STEMS[1]]} />);
    expect(container.querySelectorAll('[data-slot="stem-mixer-meter"]')).toHaveLength(1);
    expect(lane(container, "bass").querySelector('[data-slot="stem-mixer-meter"]')).toBeNull();
  });

  it("defaults volume to unity and pan to centre", () => {
    const { container } = render(<StemMixer stems={[{ id: "fx", name: "FX" }]} />);
    const fx = lane(container, "fx");
    expect(rangeInput(fx, "stem-mixer-volume")).toHaveAttribute("aria-valuenow", "100");
    expect(rangeInput(fx, "stem-mixer-pan")).toHaveAttribute("aria-valuetext", "Centre");
  });

  it("names the mixer group", () => {
    render(<StemMixer stems={STEMS} label="Midnight Drive stems" />);
    expect(screen.getByRole("group", { name: "Midnight Drive stems" })).toBeInTheDocument();
  });
});
