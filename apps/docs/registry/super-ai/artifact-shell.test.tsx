import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ArtifactShell, type ArtifactShellGroup } from "./artifact-shell";

const REGIONS = ["sidebar", "header", "search", "artifact-card-grid"];

const GROUPS: ArtifactShellGroup[] = [
  {
    id: "today",
    label: "Today",
    sessions: [
      {
        id: "brand-audit",
        label: "Brand audit for Northwind",
        items: [
          {
            id: "a1",
            excerpt: "Northwind is the only voice in the set that opens on reassurance.",
            type: "markdown",
            editedAgo: "Edited 4 minutes ago",
          },
          {
            id: "a2",
            excerpt: "const TONE = ['reassuring', 'plain', 'unhurried']",
            type: "code",
          },
        ],
      },
    ],
  },
  {
    id: "earlier",
    label: "Last 7 days",
    sessions: [
      {
        id: "pricing",
        label: "Pricing page copy",
        items: [
          {
            id: "a3",
            excerpt: "Three tiers, and the middle one is the one we want people to pick.",
            type: "markdown",
          },
        ],
      },
    ],
  },
];

describe("ArtifactShell", () => {
  it.each(REGIONS)("renders the %s region", (region) => {
    const { container } = render(<ArtifactShell />);
    expect(container.querySelector(`[data-region="${region}"]`)).not.toBeNull();
  });

  it("passes className through", () => {
    render(<ArtifactShell className="test-class" />);
    expect(document.querySelector('[data-slot="artifact-shell"]')!.className).toContain(
      "test-class",
    );
  });

  // The spec's Regions line reads "sidebar · header + filter · search · artifact
  // card grid": the filter is part of the header, and search is its own region.
  // Two regions rather than one shared toolbar is the decision, not an accident
  // of markup.
  it("keeps the filter inside the header and search outside it", () => {
    const { container } = render(<ArtifactShell groups={GROUPS} />);
    const header = container.querySelector('[data-region="header"]')!;
    const search = container.querySelector('[data-region="search"]')!;
    expect(header.querySelector('[data-slot="filter-bar"]')).not.toBeNull();
    expect(search.querySelector('[data-slot="filter-bar"]')).toBeNull();
    expect(within(search as HTMLElement).getByRole("searchbox")).toBeVisible();
  });

  // "Excerpts, not thumbnails. Artifacts are mostly text and their
  // auto-generated titles are unreliable — the first lines are what identify
  // them." J4 is the only card renderer here, and J4 is deliberately not a
  // preview-tile consumer: no media frame may appear above the excerpt.
  it("identifies artifacts by their excerpt, with no thumbnail frame", () => {
    render(<ArtifactShell groups={GROUPS} />);
    const cards = document.querySelectorAll('[data-slot="artifact-grid-card"]');
    expect(cards).toHaveLength(3);
    expect(document.querySelectorAll('[data-slot="artifact-grid-excerpt"]')).toHaveLength(3);
    expect(
      screen.getByText("Northwind is the only voice in the set that opens on reassurance."),
    ).toBeVisible();
    // A8 preview-tile is the thumbnail frame in this registry. Its presence
    // anywhere in the grid means someone swapped the text card for a media one.
    expect(document.querySelector('[data-slot="preview-tile"]')).toBeNull();
    expect(document.querySelector('[data-region="artifact-card-grid"] img')).toBeNull();
  });

  // "Grouped by originating session, so the artifact index and the conversation
  // history stay linked." A3 buckets by recency on the outside; J4's session is
  // the unit inside. A flat list of cards would break the link.
  it("nests J4 sessions inside A3 date buckets", () => {
    const { container } = render(<ArtifactShell groups={GROUPS} />);
    const buckets = container.querySelectorAll('[data-slot="date-section"]');
    expect(buckets).toHaveLength(2);
    expect(within(buckets[0] as HTMLElement).getByText("Today")).toBeVisible();
    const sessions = buckets[0].querySelectorAll('[data-slot="artifact-grid-session"]');
    expect(sessions).toHaveLength(1);
    expect(sessions[0].getAttribute("data-session-id")).toBe("brand-audit");
    expect(within(sessions[0] as HTMLElement).getByText("Brand audit for Northwind")).toBeVisible();
  });

  // "Type badges double as filter facets and must be driven by the same value in
  // both places." The facet label comes from J4's own artifactTypeLabel, so the
  // chip and the badge cannot render two different strings for one type.
  it("drives the header facets from the same type value as J4's badges", () => {
    render(<ArtifactShell groups={GROUPS} />);
    const badges = [...document.querySelectorAll('[data-slot="artifact-grid-type"]')];
    const markdownBadge = badges.find((badge) => badge.getAttribute("data-artifact-type") === "markdown")!;
    const markdownFacet = document.querySelector('[data-artifact-type="markdown"][data-slot="filter-chip-toggle"]')!;
    expect(markdownBadge.textContent).toBe("Markdown");
    expect(markdownFacet.textContent).toContain("Markdown");
    // …and the facet's count is the number of cards carrying that badge.
    expect(markdownFacet.textContent).toContain("2");
  });

  it("filters the grid through A5's own chip control", async () => {
    render(<ArtifactShell groups={GROUPS} />);
    await userEvent.click(screen.getByRole("button", { name: /^Code/ }));
    expect(document.querySelectorAll('[data-slot="artifact-grid-card"]')).toHaveLength(1);
    // Never colour alone: A5's chip carries the state programmatically.
    expect(screen.getByRole("button", { name: /^Code/ })).toHaveAttribute("aria-pressed", "true");
  });

  it("reports the active facet to a controlled owner", async () => {
    const onActiveTypeChange = vi.fn();
    render(
      <ArtifactShell groups={GROUPS} activeType={null} onActiveTypeChange={onActiveTypeChange} />,
    );
    await userEvent.click(screen.getByRole("button", { name: /^Markdown/ }));
    expect(onActiveTypeChange).toHaveBeenCalledWith("markdown");
  });

  // A one-facet filter is a choice with one option, which is J4's own rule and
  // is noise here for the same reason. The header region stays mounted; only
  // the chips go.
  it("suppresses the facets when every artifact shares a type", () => {
    const { container } = render(
      <ArtifactShell
        groups={[{ id: "today", label: "Today", sessions: [GROUPS[1].sessions[0]] }]}
      />,
    );
    expect(container.querySelector('[data-region="header"]')).not.toBeNull();
    expect(container.querySelectorAll('[data-slot="filter-chip"]')).toHaveLength(0);
  });

  // The excerpt is what identifies an artifact, so it is what search reads —
  // a title-only search would miss the card its own excerpt names.
  it("searches the excerpt, not just the title", async () => {
    render(<ArtifactShell groups={GROUPS} />);
    await userEvent.type(screen.getByRole("searchbox"), "reassurance");
    expect(document.querySelectorAll('[data-slot="artifact-grid-card"]')).toHaveLength(1);
    expect(screen.getByText(/opens on reassurance/)).toBeVisible();
  });

  it("announces how much of the index is showing", async () => {
    render(<ArtifactShell groups={GROUPS} />);
    const count = () =>
      screen.getAllByRole("status").find((node) => /artifact/i.test(node.textContent ?? ""))!;
    expect(count().textContent).toBe("3 artifacts");
    await userEvent.type(screen.getByRole("searchbox"), "reassurance");
    expect(count().textContent).toBe("1 of 3 artifacts");
  });

  it("leaves matching to the caller when localSearch is off", async () => {
    const onQueryChange = vi.fn();
    render(<ArtifactShell groups={GROUPS} localSearch={false} onQueryChange={onQueryChange} />);
    await userEvent.type(screen.getByRole("searchbox"), "reassurance");
    expect(onQueryChange).toHaveBeenCalled();
    expect(document.querySelectorAll('[data-slot="artifact-grid-card"]')).toHaveLength(3);
  });

  // Two independent empty affordances, both L1: the sidebar's and the grid's.
  // Day one is the view most users actually see.
  it("falls to L1 in both the sidebar and the grid on day one", () => {
    const { container } = render(<ArtifactShell />);
    const sidebar = container.querySelector('[data-region="sidebar"]')!;
    const grid = container.querySelector('[data-region="artifact-card-grid"]')!;
    expect(sidebar.querySelector('[data-slot="empty-state"]')).not.toBeNull();
    expect(grid.querySelector('[data-slot="empty-state"]')).not.toBeNull();
  });

  it("distinguishes an empty index from an emptied one", async () => {
    const { container } = render(<ArtifactShell groups={GROUPS} />);
    await userEvent.type(screen.getByRole("searchbox"), "nothing matches this");
    const grid = container.querySelector('[data-region="artifact-card-grid"]')!;
    const emptyState = grid.querySelector('[data-slot="empty-state"]')!;
    expect(emptyState).toHaveTextContent("No artifacts match");
    // Announced: a view emptied by a filter is indistinguishable from a broken
    // filter if it disappears in silence.
    expect(emptyState).toHaveAttribute("role", "status");
  });

  // Every region mounts unconditionally, empty or not — a region that appears
  // from nowhere cannot teach that it exists.
  it.each(REGIONS)("keeps the %s region mounted with no data at all", (region) => {
    const { container } = render(<ArtifactShell groups={[]} />);
    expect(container.querySelector(`[data-region="${region}"]`)).not.toBeNull();
  });

  // K1 is a passage that has not been filed yet, so it keeps its own approval
  // verbs and sits outside the index rather than under a date bucket.
  it("holds an unfiled draft in K1, above the buckets and outside the filter", async () => {
    const { container } = render(
      <ArtifactShell
        groups={GROUPS}
        draft={{ children: <p>A first pass at the launch note.</p>, onKeep: () => {}, onDiscard: () => {} }}
      />,
    );
    const grid = container.querySelector('[data-region="artifact-card-grid"]')!;
    const block = grid.querySelector('[data-slot="ai-doc-block"]')!;
    expect(block).not.toBeNull();
    expect(block.closest('[data-slot="date-section"]')).toBeNull();
    expect(within(block as HTMLElement).getByRole("button", { name: "Keep" })).toBeVisible();
    // Filtering the index down to nothing must not take the draft with it.
    await userEvent.type(screen.getByRole("searchbox"), "nothing matches this");
    expect(grid.querySelector('[data-slot="ai-doc-block"]')).not.toBeNull();
  });

  it("composes B1 for the sidebar rather than rendering its own", () => {
    const { container } = render(
      <ArtifactShell nav={<nav aria-label="Library">Collections</nav>} />,
    );
    const sidebar = container.querySelector('[data-region="sidebar"]')!;
    expect(sidebar.querySelector('[data-slot="app-sidebar"]')).not.toBeNull();
    expect(sidebar.querySelector('[data-slot="app-sidebar-nav"]')).not.toBeNull();
    expect(screen.getByRole("navigation", { name: "Library" })).toBeInTheDocument();
  });

  // The grid scrolls, so it has to be reachable by keyboard on its own (axe
  // `scrollable-region-focusable`) and it has to have a name.
  it("gives the scrolling grid a name and a tab stop", () => {
    const { container } = render(<ArtifactShell groups={GROUPS} />);
    const grid = container.querySelector('[data-region="artifact-card-grid"]')!;
    expect(grid).toHaveAttribute("tabindex", "0");
    expect(grid).toHaveAccessibleName("Artifacts");
  });

  it("renders A5's Filters button only when there is a panel to open", async () => {
    const onOpenFilters = vi.fn();
    const { rerender } = render(<ArtifactShell groups={GROUPS} />);
    expect(document.querySelector('[data-slot="filters-button"]')).toBeNull();
    rerender(<ArtifactShell groups={GROUPS} onOpenFilters={onOpenFilters} />);
    await userEvent.click(screen.getByRole("button", { name: "Filters" }));
    expect(onOpenFilters).toHaveBeenCalled();
  });
});
