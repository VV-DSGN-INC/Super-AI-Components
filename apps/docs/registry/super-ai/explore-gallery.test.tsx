import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ExploreGallery, type ExploreGalleryItem } from "./explore-gallery";

const SORTS = [
  { value: "hot", label: "Hot" },
  { value: "new", label: "New" },
  { value: "top", label: "Top" },
];

const TYPES = [
  { value: "all", label: "All", count: 240 },
  { value: "image", label: "Images", count: 180 },
  { value: "video", label: "Video", count: 60 },
];

const ITEMS: ExploreGalleryItem[] = [
  { id: "a", title: "Neon city at dusk", aspectRatio: "3 / 4", type: "image", prompt: "neon city at dusk" },
  { id: "b", title: "Paper-cut forest", aspectRatio: "16 / 9", type: "image" },
  { id: "c", title: "Chrome jellyfish", aspectRatio: "1 / 1", type: "video" },
];

describe("ExploreGallery", () => {
  it("renders the sort-tabs state: one tablist, first sort active, selecting another reports it", async () => {
    const onSortChange = vi.fn();
    render(<ExploreGallery items={ITEMS} sorts={SORTS} onSortChange={onSortChange} dockedPrompt={false} />);

    const tablist = screen.getByRole("tablist", { name: "Sort" });
    expect(within(tablist).getAllByRole("tab")).toHaveLength(3);
    expect(screen.getByRole("tab", { name: "Hot" })).toHaveAttribute("aria-selected", "true");

    await userEvent.click(screen.getByRole("tab", { name: "Top" }));
    expect(onSortChange).toHaveBeenCalledWith("top");
    expect(screen.getByRole("tab", { name: "Top" })).toHaveAttribute("aria-selected", "true");
    // The feed is the tab panel, so the sort tabs and the thing they sort are
    // programmatically associated rather than two loose divs.
    expect(screen.getByRole("tabpanel")).toHaveAttribute("data-slot", "explore-gallery-feed");
  });

  it("renders the type-pills state as a second, separate axis — not merged into the sort row", async () => {
    const onTypeChange = vi.fn();
    const onSortChange = vi.fn();
    render(
      <ExploreGallery
        items={ITEMS}
        sorts={SORTS}
        types={TYPES}
        onTypeChange={onTypeChange}
        onSortChange={onSortChange}
        dockedPrompt={false}
      />,
    );

    // Two controls, two accessible groups, two data-slots. This is the
    // assertion a "let's just make one filter row" refactor has to break.
    const pills = screen.getByRole("radiogroup", { name: "Type" });
    const tablist = screen.getByRole("tablist", { name: "Sort" });
    expect(pills).not.toBe(tablist);
    expect(tablist.contains(pills)).toBe(false);
    expect(document.querySelector('[data-slot="explore-gallery-sorts"]')).toBe(tablist);
    expect(document.querySelector('[data-slot="explore-gallery-types"]')).toContainElement(pills);
    expect(within(pills).getAllByRole("radio")).toHaveLength(3);
    expect(within(pills).getByRole("radio", { name: /Images/ })).toHaveTextContent("180");

    await userEvent.click(within(pills).getByRole("radio", { name: /Video/ }));
    expect(onTypeChange).toHaveBeenCalledWith("video");
    expect(within(pills).getByRole("radio", { name: /Video/ })).toHaveAttribute("aria-checked", "true");
    // Filtering by type must not disturb the sort — different axes.
    expect(onSortChange).not.toHaveBeenCalled();
    expect(screen.getByRole("tab", { name: "Hot" })).toHaveAttribute("aria-selected", "true");
  });

  it("renders the infinite-scroll state with a real Load more button and a live count", async () => {
    const onLoadMore = vi.fn();
    render(
      <ExploreGallery items={ITEMS} sorts={SORTS} totalCount={240} hasMore onLoadMore={onLoadMore} dockedPrompt={false} />,
    );

    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("3 of 240 shown");

    // Reachable by keyboard, not by scroll position alone.
    const loadMore = screen.getByRole("button", { name: "Load more" });
    loadMore.focus();
    expect(loadMore).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });

  it("announces and disables while a page is loading, and drops the button when the feed is exhausted", () => {
    const { rerender } = render(
      <ExploreGallery items={ITEMS} sorts={SORTS} totalCount={240} hasMore loading dockedPrompt={false} />,
    );
    expect(screen.getByRole("status")).toHaveTextContent("Loading more…");
    expect(screen.getByRole("button", { name: "Loading more…" })).toBeDisabled();

    rerender(<ExploreGallery items={ITEMS} sorts={SORTS} totalCount={3} dockedPrompt={false} />);
    expect(screen.queryByRole("button", { name: /Load more/ })).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("3 of 3 shown");
  });

  it("renders the docked-prompt state above the feed, and a tile's Remix seeds it in place", async () => {
    const onRemix = vi.fn();
    render(<ExploreGallery items={ITEMS} sorts={SORTS} onRemix={onRemix} />);

    const root = document.querySelector('[data-slot="explore-gallery"]')!;
    const prompt = document.querySelector('[data-slot="explore-gallery-prompt"]')!;
    const feed = screen.getByRole("tabpanel");
    // "Above the feed" is structural, not a class: the prompt precedes the
    // feed in document order, inside this component rather than beside it.
    expect(root).toContainElement(prompt as HTMLElement);
    expect(prompt.compareDocumentPosition(feed) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    const textarea = screen.getByRole("textbox", { name: "Prompt" });
    expect(textarea).toHaveValue("");

    await userEvent.click(screen.getByRole("button", { name: "Remix: Neon city at dusk" }));
    expect(onRemix).toHaveBeenCalledWith(expect.objectContaining({ id: "a" }));
    // Converted without a navigation step: same feed, prompt now filled.
    expect(textarea).toHaveValue("neon city at dusk");
    expect(screen.getByRole("tabpanel")).toBeInTheDocument();
  });

  it("owns its own variable-height tile rather than composing preview-tile's fixed frame", () => {
    render(<ExploreGallery items={ITEMS} sorts={SORTS} dockedPrompt={false} />);

    expect(document.querySelector('[data-slot="preview-tile"]')).toBeNull();
    const media = Array.from(
      document.querySelectorAll<HTMLElement>('[data-slot="explore-gallery-item-media"]'),
    );
    expect(media).toHaveLength(3);
    // Every tile carries its own ratio. Equal heights here would be the bug.
    expect(media.map((node) => node.style.aspectRatio)).toEqual(["3 / 4", "16 / 9", "1 / 1"]);
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
  });

  it("keeps hover-revealed tile actions mounted and keyboard reachable", () => {
    render(<ExploreGallery items={ITEMS} sorts={SORTS} dockedPrompt={false} />);

    const remix = screen.getByRole("button", { name: "Remix: Neon city at dusk" });
    expect(remix).toBeInTheDocument();
    remix.focus();
    expect(remix).toHaveFocus();

    const actions = document.querySelector<HTMLElement>('[data-slot="explore-gallery-item-actions"]')!;
    // opacity + group-focus-within, never display:none — a hidden action is
    // an action keyboard users cannot reach.
    expect(actions.className).toContain("opacity-0");
    expect(actions.className).toContain("group-focus-within/explore-item:opacity-100");
    expect(actions.className).not.toContain("hidden");

    // And the open control never wraps another control.
    const open = document.querySelector('[data-slot="explore-gallery-item-open"]')!;
    expect(open.querySelector("button")).toBeNull();
  });

  it("keeps the scrollable feed focusable when there are no sort tabs", () => {
    render(<ExploreGallery items={ITEMS} types={TYPES} dockedPrompt={false} />);

    const feed = screen.getByRole("region", { name: "Community feed" });
    expect(feed).toHaveAttribute("data-slot", "explore-gallery-feed");
    expect(feed).toHaveAttribute("tabindex", "0");
    expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
    expect(screen.getByRole("radiogroup", { name: "Type" })).toBeInTheDocument();
  });

  it("switches to row layout without losing variable tile heights", () => {
    render(<ExploreGallery items={ITEMS} sorts={SORTS} layout="rows" dockedPrompt={false} />);

    const list = document.querySelector<HTMLElement>('[data-slot="explore-gallery-masonry"]')!;
    expect(list).toHaveAttribute("data-layout", "rows");
    expect(list.className).not.toContain("columns-");
    expect(
      document.querySelector<HTMLElement>('[data-slot="explore-gallery-item-media"]')!.style.aspectRatio,
    ).toBe("3 / 4");
  });

  it("passes className through", () => {
    render(<ExploreGallery className="test-class" />);
    expect(document.querySelector('[data-slot="explore-gallery"]')!.className).toContain("test-class");
  });
});
