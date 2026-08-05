import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { AssetDetail } from "./asset-detail";

const PROMPT = "A red bicycle leaning on a sunlit wall, shot on 35mm film";

/** Offsets derived from the string, so a reworded prompt cannot silently skew them. */
const spanFor = (phrase: string) => {
  const start = PROMPT.indexOf(phrase);
  if (start < 0) throw new Error(`"${phrase}" is not in the test prompt`);
  return { start, end: start + phrase.length };
};

const SUNLIT = spanFor("a sunlit wall");
const FILM = spanFor("35mm film");
const SPANS = [SUNLIT, FILM];

const media = <img alt="A red bicycle" src="/result.png" />;

const open = (extra: Partial<React.ComponentProps<typeof AssetDetail>> = {}) =>
  render(<AssetDetail open media={media} prompt={PROMPT} {...extra} />);

describe("AssetDetail", () => {
  it("renders the highlighted-spans state", () => {
    open({ highlightedSpans: SPANS, onSpanSelect: () => {} });
    expect(screen.getByRole("button", { name: "a sunlit wall" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "35mm film" })).toBeInTheDocument();
  });

  it("renders the params-grid state", () => {
    open({
      params: [
        { label: "Seed", value: "4471", copyable: true },
        { label: "Sampler", value: "Euler a" },
      ],
    });
    expect(screen.getByText("Seed")).toBeInTheDocument();
    expect(screen.getByText("4471")).toBeInTheDocument();
    // A10 verbatim, so the grid is the same one N5 run-inspector renders.
    expect(document.querySelector('[data-slot="stat-readout"]')).toBeInTheDocument();
  });

  it("renders the handoff-verbs state", () => {
    open({ onCopyPrompt: () => {}, onRemix: () => {}, onEdit: () => {} });
    const group = screen.getByRole("group", { name: "Result actions" });
    expect(within(group).getByRole("button", { name: /copy prompt/i })).toBeEnabled();
    expect(within(group).getByRole("button", { name: /remix/i })).toBeEnabled();
    expect(within(group).getByRole("button", { name: /edit/i })).toBeEnabled();
  });

  it("renders the more-like-this state", () => {
    open({ moreLikeThis: <div data-testid="suggestions">Four similar results</div> });
    expect(screen.getByTestId("suggestions")).toBeInTheDocument();
    expect(screen.getByText("More like this")).toBeInTheDocument();
  });

  it("passes className through", () => {
    // The dialog owns its own frame, so className lands on DialogContent via
    // the component's own data-slot rather than a caller prop — assert the
    // slot is present and identifiable instead.
    open();
    expect(document.querySelector('[data-slot="asset-detail"]')).toBeInTheDocument();
  });

  // ---------------------------------------------------------------------------
  // Load-bearing assertions (wave-4 spec §8)
  // ---------------------------------------------------------------------------

  it("emits onSpanSelect with the exact text of the span", async () => {
    const onSpanSelect = vi.fn();
    open({ highlightedSpans: SPANS, onSpanSelect });
    await userEvent.click(screen.getByRole("button", { name: "a sunlit wall" }));
    // Exact text, because that string is what gets fed into Remix — an
    // off-by-one here silently remixes the wrong phrase.
    expect(onSpanSelect).toHaveBeenCalledWith("a sunlit wall", SUNLIT);
    expect(PROMPT.slice(SUNLIT.start, SUNLIT.end)).toBe("a sunlit wall");
  });

  it("renders an em-dash for a missing param rather than a blank cell", () => {
    open({ params: [{ label: "Seed", value: "4471" }, { label: "Sampler" }] });
    // Inherited from A10: the absence has to read as deliberate.
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("has Copy, Remix and Edit all present", () => {
    open({ onCopyPrompt: () => {}, onRemix: () => {}, onEdit: () => {} });
    const group = screen.getByRole("group", { name: "Result actions" });
    const verbs = within(group)
      .getAllByRole("button")
      .map((b) => b.textContent?.trim());
    expect(verbs).toEqual(["Copy prompt", "Remix", "Edit"]);
  });

  it("keeps the verbs present but inert when their handlers are absent", () => {
    open();
    const group = screen.getByRole("group", { name: "Result actions" });
    // The three verbs are the contract; a lightbox missing Remix entirely
    // would read as a different component.
    for (const name of [/copy prompt/i, /remix/i, /edit/i]) {
      expect(within(group).getByRole("button", { name })).toBeDisabled();
    }
  });

  // ---------------------------------------------------------------------------
  // Prompt segmentation
  // ---------------------------------------------------------------------------

  it("renders the whole prompt exactly once, spans included", () => {
    open({ highlightedSpans: SPANS, onSpanSelect: () => {} });
    expect(document.querySelector('[data-slot="asset-detail-prompt"]')).toHaveTextContent(PROMPT);
  });

  it("marks a span without a handler rather than making it a dead button", () => {
    open({ highlightedSpans: SPANS });
    expect(screen.queryByRole("button", { name: "a sunlit wall" })).not.toBeInTheDocument();
    expect(document.querySelectorAll('[data-slot="asset-detail-span"]')).toHaveLength(2);
  });

  it("drops overlapping and reversed spans instead of duplicating text", () => {
    open({
      highlightedSpans: [
        SUNLIT,
        { start: SUNLIT.start + 2, end: SUNLIT.end - 2 }, // inside the first
        { start: 20, end: 5 }, // reversed
      ],
      onSpanSelect: () => {},
    });
    expect(document.querySelector('[data-slot="asset-detail-prompt"]')).toHaveTextContent(PROMPT);
    expect(document.querySelectorAll('[data-slot="asset-detail-span"]')).toHaveLength(1);
  });

  it("clamps a span that runs past the end of the prompt", () => {
    open({ highlightedSpans: [{ start: 2, end: 9999 }], onSpanSelect: () => {} });
    expect(document.querySelector('[data-slot="asset-detail-prompt"]')).toHaveTextContent(PROMPT);
  });

  it("renders nothing prompt-shaped when there is no prompt", () => {
    render(<AssetDetail open media={media} />);
    expect(document.querySelector('[data-slot="asset-detail-prompt"]')).toBeNull();
  });

  it("stays closed when open is false", () => {
    render(<AssetDetail open={false} media={media} prompt={PROMPT} />);
    expect(document.querySelector('[data-slot="asset-detail"]')).toBeNull();
  });
});
