import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ExploreShell, type ExploreShellItem } from "./explore-shell";

const REGIONS = ["rail", "docked-prompt-bar", "sort-tabs", "masonry-feed"];

const RAIL = [
  { id: "explore", label: "Explore", icon: <span /> },
  { id: "create", label: "Create", icon: <span /> },
];

const SORTS = [
  { value: "hot", label: "Hot" },
  { value: "new", label: "New" },
];

const TYPES = [
  { value: "image", label: "Images", count: 812 },
  { value: "video", label: "Videos", count: 44 },
];

const ITEMS: ExploreShellItem[] = [
  {
    id: "neon",
    title: "Neon city",
    type: "image",
    aspectRatio: "3 / 4",
    prompt: "neon city at dusk, wet asphalt",
    media: <div />,
    asset: { media: <div />, prompt: "neon city at dusk, wet asphalt" },
  },
  {
    id: "forest",
    title: "Paper forest",
    type: "image",
    aspectRatio: "16 / 9",
    prompt: "layered paper-cut forest",
    media: <div />,
    asset: { media: <div />, prompt: "layered paper-cut forest" },
  },
  {
    id: "deck",
    title: "Pitch deck",
    type: "template",
    aspectRatio: "1 / 1",
    media: <div />,
    template: { templates: [{ id: "deck", title: "Pitch deck" }] },
  },
];

describe("ExploreShell", () => {
  it.each(REGIONS)("renders the %s region", (region) => {
    const { container } = render(<ExploreShell />);
    expect(container.querySelector(`[data-region="${region}"]`)).not.toBeNull();
  });

  it("passes className through", () => {
    render(<ExploreShell className="test-class" />);
    expect(document.querySelector('[data-slot="explore-shell"]')!.className).toContain("test-class");
  });

  // "Masonry, not a grid. Community feeds are browsed for surprise, and
  // equal-height rows suppress exactly that." The layout is the block, so it is
  // pinned rather than defaulted — and the per-item aspect ratio that makes it
  // masonry has to survive the shell.
  it("keeps the feed masonry, with a per-item aspect ratio", () => {
    const { container } = render(<ExploreShell items={ITEMS} />);
    const feed = container.querySelector('[data-region="masonry-feed"]')!;
    expect(feed.querySelector('[data-slot="explore-gallery-masonry"]')).toHaveAttribute(
      "data-layout",
      "masonry",
    );
    const media = feed.querySelectorAll<HTMLElement>('[data-slot="explore-gallery-item-media"]');
    expect(media[0].style.aspectRatio).toBe("3 / 4");
    // The second tile is a different height. Equal ratios would be a grid
    // wearing a masonry class name.
    expect(media[1].style.aspectRatio).toBe("16 / 9");
  });

  it("composes J3 explore-gallery rather than rendering its own feed", () => {
    const { container } = render(<ExploreShell items={ITEMS} />);
    const feed = container.querySelector('[data-region="masonry-feed"]')!;
    expect(feed.querySelector('[data-slot="explore-gallery"]')).not.toBeNull();
    expect(feed.querySelectorAll('[data-slot="explore-gallery-item"]')).toHaveLength(3);
  });

  it("composes B4 modality-rail and selects through its own control", async () => {
    const onRailSelect = vi.fn();
    const { container } = render(<ExploreShell rail={RAIL} activeRailId="explore" onRailSelect={onRailSelect} />);
    const rail = container.querySelector('[data-region="rail"]') as HTMLElement;
    expect(rail).toHaveAttribute("data-slot", "modality-rail");
    expect(rail.querySelectorAll('[data-slot="modality-rail-item"]')).toHaveLength(2);
    // Scoped to the rail on purpose: D1's submit button is also called
    // "Create", which is the shell working — the rail destination and the
    // omnibox verb are the same word by design.
    await userEvent.click(within(rail).getByRole("button", { name: "Create" }));
    expect(onRailSelect).toHaveBeenCalledWith("create");
  });

  // "Sort tabs and type pills are different axes and must stay as separate
  // controls." One region, two named groups — merging them would make "Hot"
  // and "Videos" look mutually exclusive when they compose.
  it("keeps sorting and filtering as two separate controls in one region", () => {
    const { container } = render(<ExploreShell sorts={SORTS} types={TYPES} items={ITEMS} />);
    const region = container.querySelector('[data-region="sort-tabs"]') as HTMLElement;
    const tabs = within(region).getByRole("tablist", { name: "Sort" });
    const pills = within(region).getByRole("radiogroup", { name: "Type" });
    expect(tabs).not.toBe(pills);
    expect(within(tabs as HTMLElement).getAllByRole("tab")).toHaveLength(2);
    expect(within(pills as HTMLElement).getAllByRole("radio")).toHaveLength(2);
  });

  it("reorders through the sort tabs and narrows through the type pills", async () => {
    const onSortChange = vi.fn();
    const onTypeChange = vi.fn();
    render(
      <ExploreShell
        sorts={SORTS}
        types={TYPES}
        items={ITEMS}
        onSortChange={onSortChange}
        onTypeChange={onTypeChange}
      />,
    );
    await userEvent.click(screen.getByRole("tab", { name: "New" }));
    expect(onSortChange).toHaveBeenCalledWith("new");
    await userEvent.click(screen.getByRole("radio", { name: /Videos/ }));
    expect(onTypeChange).toHaveBeenCalledWith("video");
    // Both axes stay readable off the shell root, so a host can style or test
    // against the state without owning it.
    const root = document.querySelector('[data-slot="explore-shell"]')!;
    expect(root).toHaveAttribute("data-sort", "new");
    expect(root).toHaveAttribute("data-type", "video");
  });

  it("shows the facet counts that make the type axis usable", () => {
    render(<ExploreShell types={TYPES} items={ITEMS} />);
    expect(screen.getByRole("radio", { name: /Images/ })).toHaveTextContent("812");
  });

  // "The prompt bar sits above the feed so inspiration converts into a
  // generation without a navigation step." D1 lives in its own region above
  // the feed, and J3's copy of it is off — two omniboxes on one page is the
  // failure this asserts against.
  it("docks exactly one D1 prompt bar, above the feed", () => {
    const { container } = render(<ExploreShell items={ITEMS} />);
    const bar = container.querySelector('[data-region="docked-prompt-bar"]')!;
    expect(bar.querySelector('[data-slot="media-prompt-bar"]')).not.toBeNull();
    expect(document.querySelectorAll('[data-slot="media-prompt-bar"]')).toHaveLength(1);
    const feed = container.querySelector('[data-region="masonry-feed"]')!;
    // Source order is the reading order: the bar precedes the feed.
    expect(bar.compareDocumentPosition(feed) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  // The conversion itself. Remix is J3's own tile control; the shell hosts the
  // bar it seeds, so this is the seam that breaks first if either side moves.
  it("seeds the docked prompt bar from a tile's own Remix control", async () => {
    const onRemix = vi.fn();
    render(<ExploreShell items={ITEMS} onRemix={onRemix} />);
    await userEvent.click(screen.getByRole("button", { name: "Remix: Neon city" }));
    expect(screen.getByLabelText("Prompt")).toHaveValue("neon city at dusk, wet asphalt");
    expect(onRemix).toHaveBeenCalledWith(expect.objectContaining({ id: "neon" }));
  });

  it("opens F3 asset-detail from a tile, through J3's own open control", async () => {
    render(<ExploreShell items={ITEMS} />);
    expect(screen.queryByRole("dialog")).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "Open Neon city" }));
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("data-slot", "asset-detail");
    expect(within(dialog).getByText(/neon city at dusk/)).toBeVisible();
  });

  it("opens J6 template-detail for a template tile instead", async () => {
    render(<ExploreShell items={ITEMS} />);
    await userEvent.click(screen.getByRole("button", { name: "Open Pitch deck" }));
    expect(document.querySelector('[data-slot="template-detail"]')).not.toBeNull();
    expect(document.querySelector('[data-slot="asset-detail"]')).toBeNull();
  });

  // F3's "more like this" is filled from the feed the shell already has, as A8
  // preview-tiles inside real buttons — never A8's own onSelect, which is
  // toggle semantics.
  it("fills F3's more-like-this with A8 tiles that swap the open item", async () => {
    render(<ExploreShell items={ITEMS} />);
    await userEvent.click(screen.getByRole("button", { name: "Open Neon city" }));
    const related = screen.getByRole("button", { name: "Open Paper forest" });
    expect(related.querySelector('[data-slot="preview-tile"]')).not.toBeNull();
    expect(related).not.toHaveAttribute("aria-pressed");
    await userEvent.click(related);
    expect(screen.getByText(/layered paper-cut forest/)).toBeVisible();
  });

  // "The empty state is the view most users actually see." J3 renders an empty
  // list and a "0 shown" status when it has no items, which is a blank page,
  // not an empty state — the shell falls to L1 and keeps the region mounted.
  it("falls to L1 in the feed on day one, with every region still mounted", () => {
    const { container } = render(<ExploreShell rail={RAIL} sorts={SORTS} types={TYPES} />);
    const feed = container.querySelector('[data-region="masonry-feed"]')!;
    expect(feed.querySelector('[data-slot="empty-state"]')).not.toBeNull();
    for (const region of REGIONS) {
      expect(container.querySelector(`[data-region="${region}"]`)).not.toBeNull();
    }
  });

  it("drops the empty state as soon as the feed has something in it", () => {
    const { container } = render(<ExploreShell items={ITEMS} />);
    const feed = container.querySelector('[data-region="masonry-feed"]')!;
    expect(feed.querySelector('[data-slot="empty-state"]')).toBeNull();
  });

  // A feed with neither axis still mounts the control region — a region that
  // appears from nowhere cannot teach that it exists.
  it("says what the feed contains when it offers no axes at all", () => {
    const { container } = render(<ExploreShell items={ITEMS} />);
    const region = container.querySelector('[data-region="sort-tabs"]')!;
    expect(region.querySelector('[data-slot="explore-shell-scope"]')).toHaveTextContent(
      "Showing everything",
    );
  });

  // Base UI makes an open tab panel a tab stop, which is right when the panel
  // scrolls. Here J3 keeps its own named, focusable, scrolling feed inside it,
  // so the panel must not add a second stop in front of the same content.
  it("leaves exactly one tab stop in front of the feed", () => {
    const { container } = render(<ExploreShell sorts={SORTS} items={ITEMS} />);
    const panel = container.querySelector('[data-region="masonry-feed"]')!;
    expect(panel).toHaveAttribute("tabindex", "-1");
    const feed = panel.querySelector('[data-slot="explore-gallery-feed"]')!;
    expect(feed).toHaveAttribute("tabindex", "0");
    expect(feed).toHaveAccessibleName("Community feed");
  });
});
