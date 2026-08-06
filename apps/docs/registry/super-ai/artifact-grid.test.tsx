import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ArtifactGrid, type ArtifactGridSession } from "./artifact-grid";

const SESSIONS: ArtifactGridSession[] = [
  {
    id: "s1",
    label: "Pricing page rewrite",
    items: [
      {
        id: "a1",
        type: "document",
        title: "Untitled document",
        excerpt: "Three tiers, and the middle one is the default. Everything else is anchoring.",
        editedAgo: "Edited 2 hours ago",
        viewCount: 1204,
        visibility: "public",
        href: "#a1",
      },
      {
        id: "a2",
        type: "react",
        excerpt: "export function PricingTable() { return <table aria-label=\"Plans\" /> }",
        editedAgo: "Edited yesterday",
        viewCount: 1,
        visibility: "private",
        href: "#a2",
      },
    ],
  },
  {
    id: "s2",
    label: "Churn analysis",
    items: [
      {
        id: "a3",
        type: "data-table",
        excerpt: "Cohort retention by signup month, 2024 Q1 through Q4.",
        visibility: "shared",
        viewCount: 42,
        href: "#a3",
      },
    ],
  },
];

describe("ArtifactGrid", () => {
  it("renders the type-badge state from the item's type value", () => {
    render(<ArtifactGrid sessions={SESSIONS} />);
    const card = document.querySelector('[data-artifact-id="a1"]')!;
    const badge = within(card as HTMLElement).getByText("Document");
    expect(badge).toHaveAttribute("data-slot", "artifact-grid-type");
    expect(badge).toHaveAttribute("data-artifact-type", "document");
    // Multi-word and acronym types are derived from the same value, never a
    // second display string the caller supplies.
    expect(document.querySelector('[data-artifact-id="a2"] [data-slot="artifact-grid-type"]')).toHaveTextContent(
      "React",
    );
    expect(document.querySelector('[data-artifact-id="a3"] [data-slot="artifact-grid-type"]')).toHaveTextContent(
      "Data table",
    );
  });

  it("renders the excerpt state as the card's load-bearing field, not a subtitle under the title", () => {
    render(<ArtifactGrid sessions={SESSIONS} />);
    const excerpt = document.querySelector('[data-artifact-id="a1"] [data-slot="artifact-grid-excerpt"]')!;
    expect(excerpt).toHaveTextContent(
      "Three tiers, and the middle one is the default. Everything else is anchoring.",
    );

    // The excerpt — not the (unreliable, auto-generated) title — is the
    // accessible name of the card's link. If a refactor wraps the whole card
    // in an anchor, the name fuses into "Document Untitled document Three
    // tiers…" and this fails.
    const link = screen.getByRole("link", {
      name: "Three tiers, and the middle one is the default. Everything else is anchoring.",
    });
    expect(excerpt).toContainElement(link);
    expect(screen.queryByRole("link", { name: /Untitled document/ })).not.toBeInTheDocument();
  });

  it("renders the excerpt with no title at all — the title is optional, the excerpt is not", () => {
    render(<ArtifactGrid sessions={[{ id: "s", label: "Session", items: [SESSIONS[0].items[1]] }]} />);
    expect(document.querySelector('[data-slot="artifact-grid-excerpt"]')).toBeInTheDocument();
    expect(document.querySelector('[data-slot="artifact-grid-title"]')).not.toBeInTheDocument();
  });

  it("renders the edited-ago state as recency text, and omits the line when absent", () => {
    render(<ArtifactGrid sessions={SESSIONS} />);
    expect(document.querySelector('[data-artifact-id="a1"] [data-slot="artifact-grid-edited-ago"]')).toHaveTextContent(
      "Edited 2 hours ago",
    );
    expect(
      document.querySelector('[data-artifact-id="a3"] [data-slot="artifact-grid-edited-ago"]'),
    ).not.toBeInTheDocument();
  });

  it("renders the view-count state as readable text with a unit, not a bare number", () => {
    render(<ArtifactGrid sessions={SESSIONS} />);
    expect(document.querySelector('[data-artifact-id="a1"] [data-slot="artifact-grid-view-count"]')).toHaveTextContent(
      "1,204 views",
    );
    expect(document.querySelector('[data-artifact-id="a2"] [data-slot="artifact-grid-view-count"]')).toHaveTextContent(
      "1 view",
    );
  });

  it("renders the privacy-icon state with a visible word, never an icon or a colour alone", () => {
    render(<ArtifactGrid sessions={SESSIONS} />);
    const privacy = document.querySelector('[data-artifact-id="a1"] [data-slot="artifact-grid-privacy"]')!;
    expect(privacy).toHaveAttribute("data-visibility", "public");
    expect(privacy).toHaveTextContent("Public");
    expect(document.querySelector('[data-artifact-id="a2"] [data-slot="artifact-grid-privacy"]')).toHaveTextContent(
      "Private",
    );
    expect(document.querySelector('[data-artifact-id="a3"] [data-slot="artifact-grid-privacy"]')).toHaveTextContent(
      "Shared",
    );
    // The glyph is decorative; the word carries the meaning.
    expect(privacy.querySelector("svg")).toHaveAttribute("aria-hidden");
  });

  it("keeps the privacy icon and the view count together in the footer", () => {
    render(<ArtifactGrid sessions={SESSIONS} />);
    const footer = document.querySelector('[data-artifact-id="a1"] [data-slot="artifact-grid-footer"]')!;
    expect(footer.querySelector('[data-slot="artifact-grid-privacy"]')).toBeInTheDocument();
    expect(footer.querySelector('[data-slot="artifact-grid-view-count"]')).toBeInTheDocument();
  });

  it("groups artifacts by session under a section-header, keeping the header's own data-slot", () => {
    render(<ArtifactGrid sessions={SESSIONS} />);
    const sections = document.querySelectorAll('[data-slot="artifact-grid-session"]');
    expect(sections).toHaveLength(2);
    expect(sections[0]).toHaveAttribute("data-session-id", "s1");
    // section-header (A12) keeps its own slots — overriding them erases every
    // style and test keyed to them.
    expect(sections[0].querySelector('[data-slot="section-header"]')).toBeInTheDocument();
    expect(sections[0].querySelector('[data-slot="section-header-title"]')).toHaveTextContent("Pricing page rewrite");
    expect(sections[0].querySelector('[data-slot="section-header-count"]')).toHaveTextContent("2");
    // The group is programmatically labelled by its session name.
    expect(screen.getByRole("region", { name: "Pricing page rewrite" })).toBe(sections[0]);
  });

  it("drives the badge and the filter facet from the same type value", async () => {
    const onActiveTypeChange = vi.fn();
    render(<ArtifactGrid sessions={SESSIONS} onActiveTypeChange={onActiveTypeChange} />);

    // Every facet label is the same derived string the badge renders.
    const facets = screen.getByRole("radiogroup", { name: "Filter artifacts by type" });
    expect(within(facets).getByRole("radio", { name: /^Document/ })).toBeInTheDocument();
    expect(within(facets).getByRole("radio", { name: /^Data table/ })).toBeInTheDocument();

    await userEvent.click(within(facets).getByRole("radio", { name: /^React/ }));
    expect(onActiveTypeChange).toHaveBeenCalledWith("react");
    expect(document.querySelectorAll('[data-slot="artifact-grid-card"]')).toHaveLength(1);
    expect(document.querySelector('[data-slot="artifact-grid-card"]')).toHaveAttribute("data-artifact-type", "react");
    // Sessions with nothing left to show disappear rather than sitting empty.
    expect(document.querySelectorAll('[data-slot="artifact-grid-session"]')).toHaveLength(1);
  });

  it("suppresses the facet row when every visible artifact shares one type", () => {
    render(<ArtifactGrid sessions={[{ id: "s", label: "Session", items: [SESSIONS[0].items[0]] }]} />);
    expect(document.querySelector('[data-slot="artifact-grid-filters"]')).not.toBeInTheDocument();
  });

  it("announces an empty filtered view instead of silently blanking", () => {
    render(<ArtifactGrid sessions={SESSIONS} activeType="svg" emptyLabel="No SVG artifacts here." />);
    const empty = screen.getByRole("status");
    expect(empty).toHaveAttribute("data-slot", "artifact-grid-empty");
    expect(empty).toHaveTextContent("No SVG artifacts here.");
  });

  it("is not a preview-tile consumer — the excerpt is the content, not a thumbnail", () => {
    render(<ArtifactGrid sessions={SESSIONS} />);
    expect(document.querySelector('[data-slot="preview-tile"]')).not.toBeInTheDocument();
    expect(document.querySelector("img")).not.toBeInTheDocument();
  });

  it("opens an artifact by keyboard when given onOpen instead of href", async () => {
    const onOpen = vi.fn();
    render(
      <ArtifactGrid
        sessions={[{ id: "s", label: "Session", items: [{ id: "a", type: "document", excerpt: "Open me", onOpen }] }]}
      />,
    );
    const trigger = screen.getByRole("button", { name: "Open me" });
    await userEvent.tab();
    expect(document.activeElement).toBe(trigger);
    await userEvent.keyboard("{Enter}");
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it("passes className through", () => {
    render(<ArtifactGrid className="test-class" />);
    expect(document.querySelector('[data-slot="artifact-grid"]')!.className).toContain("test-class");
  });
});
