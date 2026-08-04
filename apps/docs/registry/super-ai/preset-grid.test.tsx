import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PresetGrid, type PresetGridItem } from "./preset-grid";

const STYLE_ITEMS: PresetGridItem[] = [
  { id: "anime", label: "Anime" },
  { id: "photoreal", label: "Photoreal" },
  { id: "sketch", label: "Sketch" },
];

const PALETTE_ITEMS: PresetGridItem[] = [
  { id: "sunset", label: "Sunset orange", color: "#f97316" },
  { id: "ocean", label: "Ocean blue", color: "#0ea5e9" },
];

const FILTER_ITEMS: PresetGridItem[] = [
  { id: "vivid", label: "Vivid" },
  { id: "mono", label: "Mono" },
];

const ENVIRONMENT_ITEMS: PresetGridItem[] = [
  { id: "studio", label: "Studio" },
  { id: "outdoor", label: "Outdoor" },
  { id: "night", label: "Night" },
];

describe("PresetGrid", () => {
  it("renders the style state", () => {
    render(<PresetGrid items={STYLE_ITEMS} content="style" aria-label="Style presets" />);

    const root = document.querySelector('[data-slot="preset-grid"]')!;
    expect(root).toHaveAttribute("role", "radiogroup");
    expect(root).toHaveAttribute("data-content", "style");

    expect(screen.getAllByRole("radio")).toHaveLength(3);
    expect(screen.getByRole("radio", { name: "Anime" })).toHaveAttribute("aria-checked", "false");

    // E4: labels overlay the thumbnail, they never sit below it — pin the
    // placement, not just the text.
    expect(
      document.querySelector('[data-slot="preview-tile-frame"] [data-slot="preview-tile-label"]'),
    ).toBeInTheDocument();
    expect(document.querySelectorAll('[data-slot="preview-tile-label"]')).toHaveLength(3);
  });

  it("renders the palette state", async () => {
    const onValueChange = vi.fn();
    render(
      <PresetGrid items={PALETTE_ITEMS} content="palette" aria-label="Colour presets" onValueChange={onValueChange} />,
    );

    // A colour swatch alone can't carry the pick's meaning (E4) — the
    // accessible name has to say what the colour *is*, not just render it.
    const sunset = screen.getByRole("radio", { name: "Sunset orange" });
    expect(sunset).toBeInTheDocument();
    // The swatch itself is decorative; the colour value never leaks into the
    // accessible tree as if it were the name.
    expect(document.querySelector('[data-slot="preset-grid-swatch"]')).toHaveAttribute("aria-hidden");

    await userEvent.click(sunset);
    expect(onValueChange).toHaveBeenCalledWith("sunset");
  });

  it("renders the filter state", async () => {
    render(<PresetGrid items={FILTER_ITEMS} content="filter" aria-label="Filter presets" defaultValue="vivid" />);

    expect(screen.getByRole("radio", { name: "Vivid" })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("radio", { name: "Mono" })).toHaveAttribute("aria-checked", "false");

    await userEvent.click(screen.getByRole("radio", { name: "Mono" }));
    // Single-select: choosing a new value clears the old one.
    expect(screen.getByRole("radio", { name: "Mono" })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("radio", { name: "Vivid" })).toHaveAttribute("aria-checked", "false");
  });

  it("renders the environment state", async () => {
    // Environment presets can stack (a scene can mix "Studio" + "Night"),
    // unlike style/filter — this exercises `multiple`: checkbox semantics
    // and an independent-selection group, not a radiogroup.
    const onValueChange = vi.fn();
    render(
      <PresetGrid
        items={ENVIRONMENT_ITEMS}
        content="environment"
        aria-label="Environment presets"
        multiple
        onValueChange={onValueChange}
      />,
    );

    const root = document.querySelector('[data-slot="preset-grid"]')!;
    expect(root).toHaveAttribute("role", "group");
    expect(screen.getAllByRole("checkbox")).toHaveLength(3);

    await userEvent.click(screen.getByRole("checkbox", { name: "Studio" }));
    expect(onValueChange).toHaveBeenLastCalledWith(["studio"]);

    await userEvent.click(screen.getByRole("checkbox", { name: "Night" }));
    expect(onValueChange).toHaveBeenLastCalledWith(["studio", "night"]);
  });

  it("renders the see-more state", async () => {
    const items = [...STYLE_ITEMS, ...ENVIRONMENT_ITEMS]; // 6 total
    render(<PresetGrid items={items} content="style" aria-label="Style presets" visibleCount={3} />);

    expect(screen.getAllByRole("radio")).toHaveLength(3);
    const seeMore = screen.getByRole("button", { name: /see more/i });
    expect(seeMore).toBeInTheDocument();
    // It's a grid tile, not a link below the grid (E4).
    expect(seeMore.tagName).toBe("BUTTON");
    expect(seeMore.parentElement).toBe(document.querySelector('[data-slot="preset-grid"]'));

    const beforeNode = screen.getByRole("radio", { name: "Anime" });

    await userEvent.click(seeMore);

    // E4: the grid never reflows when it expands — tiles already on screen
    // keep their exact DOM identity rather than being unmounted and
    // recreated in a new order.
    expect(screen.getByRole("radio", { name: "Anime" })).toBe(beforeNode);
    expect(screen.getAllByRole("radio")).toHaveLength(6);
    expect(screen.queryByRole("button", { name: /see more/i })).not.toBeInTheDocument();
  });

  it("passes className through", () => {
    render(<PresetGrid items={STYLE_ITEMS} className="test-class" aria-label="Style presets" />);
    expect(document.querySelector('[data-slot="preset-grid"]')!.className).toContain("test-class");
  });
});
