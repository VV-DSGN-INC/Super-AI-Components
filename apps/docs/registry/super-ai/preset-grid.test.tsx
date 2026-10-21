import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { expectAccessibleName } from "@/lib/test-utils";
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
      <PresetGrid
        items={PALETTE_ITEMS}
        content="palette"
        aria-label="Colour presets"
        onValueChange={onValueChange}
      />,
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
    render(
      <PresetGrid items={FILTER_ITEMS} content="filter" aria-label="Filter presets" defaultValue="vivid" />,
    );

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

  it("single-select is one tab stop and arrows move the selection; multi-select keeps a stop per tile", async () => {
    const user = userEvent.setup();
    const items = [
      { id: "a", label: "Photoreal" },
      { id: "b", label: "Anime" },
      { id: "c", label: "Sketch" },
    ];
    const { unmount } = render(<PresetGrid aria-label="Style" items={items} defaultValue="a" />);
    await user.tab();
    expect(screen.getByRole("radio", { name: "Photoreal" })).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("radio", { name: "Anime" })).toHaveFocus();
    expect(screen.getByRole("radio", { name: "Anime" })).toHaveAttribute("aria-checked", "true");
    await user.tab();
    expect(document.body).toHaveFocus();
    unmount();

    render(<PresetGrid aria-label="Style" items={items} multiple defaultValue={[]} />);
    await user.tab();
    await user.tab();
    expect(screen.getByRole("checkbox", { name: "Anime" })).toHaveFocus();
  });

  describe("user-presets", () => {
    const MIXED: PresetGridItem[] = [
      { id: "anime", label: "Anime" },
      { id: "mine", label: "Neon noir", source: "personal" },
      { id: "crew", label: "Studio look", source: "team" },
      { id: "sketch", label: "Sketch" },
    ];

    it("renders Your styles above the system presets", () => {
      render(<PresetGrid items={MIXED} aria-label="Style presets" onSaveCurrent={() => {}} />);
      const sections = document.querySelectorAll('[data-slot="preset-grid-section"]');
      expect(sections).toHaveLength(2);
      expect(sections[0]).toHaveAttribute("data-section", "user");
      expect(sections[0]).toHaveTextContent("Your styles");
      expect(sections[0].querySelectorAll('[data-slot="preset-grid-tile"]')).toHaveLength(2);
      expect(sections[1].querySelectorAll('[data-slot="preset-grid-tile"]')).toHaveLength(2);
      const order = Array.from(document.querySelectorAll('[data-slot="preset-grid-tile"]')).map(
        (el) => el.getAttribute("aria-label") ?? el.textContent,
      );
      expect(order[0]).toBe("Neon noir, Personal");
      expect(order[1]).toBe("Studio look, Team");
    });

    it("shows the source as text and in the accessible name", () => {
      render(<PresetGrid items={MIXED} aria-label="Style presets" />);
      expectAccessibleName(screen.getByRole("radio", { name: "Neon noir, Personal" }), "Neon noir, Personal");
      expectAccessibleName(screen.getByRole("radio", { name: "Studio look, Team" }), "Studio look, Team");
      const sources = Array.from(document.querySelectorAll('[data-slot="preset-grid-source"]')).map(
        (el) => el.textContent,
      );
      expect(sources).toEqual(["Personal", "Team"]);
      // System presets without a source keep their plain name.
      expect(screen.getByRole("radio", { name: "Anime" })).toBeInTheDocument();
    });

    it("keeps the save tile out of the radio set", async () => {
      const user = userEvent.setup();
      const onSaveCurrent = vi.fn();
      const onValueChange = vi.fn();
      render(
        <PresetGrid
          items={MIXED}
          aria-label="Style presets"
          defaultValue="mine"
          onSaveCurrent={onSaveCurrent}
          onValueChange={onValueChange}
        />,
      );
      const save = screen.getByRole("button", { name: /save current/i });
      expect(save).toHaveAttribute("data-slot", "preset-grid-save-current");
      expect(screen.queryByRole("radio", { name: /save current/i })).not.toBeInTheDocument();
      expect(screen.getAllByRole("radio")).toHaveLength(4);
      // It is the first cell of the Your styles grid.
      const firstCell = document.querySelector('[data-section="user"] [data-slot]:is(button)');
      expect(firstCell).toBe(save);

      await user.click(save);
      expect(onSaveCurrent).toHaveBeenCalledTimes(1);
      expect(onValueChange).not.toHaveBeenCalled();
      expect(screen.getByRole("radio", { name: "Neon noir, Personal" })).toHaveAttribute(
        "aria-checked",
        "true",
      );

      // Arrow keys walk the radios and skip the save tile.
      await user.click(screen.getByRole("radio", { name: "Neon noir, Personal" }));
      await user.keyboard("{ArrowLeft}");
      expect(save).not.toHaveFocus();
    });

    it("renders exactly as before with no user presets and no save handler", () => {
      render(<PresetGrid items={STYLE_ITEMS} aria-label="Style presets" />);
      expect(document.querySelector('[data-slot="preset-grid-section"]')).toBeNull();
      expect(document.querySelector('[data-slot="preset-grid-save-current"]')).toBeNull();
      const root = document.querySelector('[data-slot="preset-grid"]')!;
      expect(root.className).toContain("grid");
      expect(root.querySelectorAll(':scope > [data-slot="preset-grid-tile"]')).toHaveLength(3);
    });

    it("offers the save tile on its own when there are no user presets yet", () => {
      render(<PresetGrid items={STYLE_ITEMS} aria-label="Style presets" onSaveCurrent={() => {}} />);
      expect(screen.getByRole("button", { name: /save current/i })).toBeInTheDocument();
      expect(document.querySelector('[data-section="user"]')).toBeInTheDocument();
    });
  });
});
