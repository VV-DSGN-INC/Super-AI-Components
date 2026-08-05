import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { EmptyState, type EmptyStateSize } from "./empty-state";
import { GenerationGrid } from "./generation-grid";

const PAIR = {
  before: { content: <span>flat photo</span>, label: "Before" },
  after: { content: <span>relit photo</span>, label: "After" },
};

const root = (container: HTMLElement) =>
  container.querySelector('[data-slot="empty-state"]') as HTMLElement;

const slotsOf = (container: HTMLElement) =>
  [...container.querySelectorAll("[data-slot]")].map((el) => el.getAttribute("data-slot"));

describe("EmptyState", () => {
  it("renders the page state", () => {
    const { container } = render(
      <EmptyState
        size="page"
        title="No projects yet"
        description="Everything you create lands here."
        action={<button type="button">Create a project</button>}
      />,
    );
    expect(root(container).dataset.size).toBe("page");
    expect(screen.getByText("No projects yet")).toBeInTheDocument();
    expect(screen.getByText("Everything you create lands here.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create a project" })).toBeInTheDocument();
  });

  it("renders the panel state", () => {
    const { container } = render(
      <EmptyState size="panel" title="Nothing pinned" description="Pin a result to keep it here." />,
    );
    expect(root(container).dataset.size).toBe("panel");
    expect(screen.getByText("Nothing pinned")).toBeInTheDocument();
    // No CTA supplied, so the component contributes none of its own.
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("renders the in-grid state", () => {
    const { container } = render(
      <EmptyState
        size="in-grid"
        title="Nothing generated yet"
        action={<button type="button">Generate</button>}
      />,
    );
    const el = root(container);
    expect(el.dataset.size).toBe("in-grid");
    // A tile: it draws its own frame and fills the cell it was handed rather
    // than reserving page-sized vertical space.
    expect(el.className).toContain("border-dashed");
    expect(el.className).toContain("h-full");
    expect(el.className).not.toContain("min-h-80");
  });

  it("renders the example-pair state", () => {
    render(
      <EmptyState
        size="panel"
        title="Try a relight"
        examplePair={{ ...PAIR, caption: "Prompt: warm rim light" }}
      />,
    );
    const halves = screen.getAllByRole("figure");
    expect(halves).toHaveLength(2);
    // Before comes first, after second — the transformation reads left to right.
    expect(within(halves[0]).getByText("Before")).toBeInTheDocument();
    expect(within(halves[1]).getByText("After")).toBeInTheDocument();
    expect(screen.getByText("flat photo")).toBeInTheDocument();
    expect(screen.getByText("relit photo")).toBeInTheDocument();
    expect(screen.getByText("Prompt: warm rim light")).toBeInTheDocument();
  });

  it("passes className through", () => {
    render(<EmptyState className="test-class" title="Nothing here" />);
    expect(document.querySelector('[data-slot="empty-state"]')!.className).toContain("test-class");
  });

  // ---------------------------------------------------------------------------
  // Load-bearing assertions (spec § L1 `empty-state`)
  // ---------------------------------------------------------------------------

  it("emits the same slots at every size — three sizes, one component", () => {
    const shapeOf = (size: EmptyStateSize) => {
      const { container } = render(
        <EmptyState
          size={size}
          title="No results"
          description="Run a generation to fill this in."
          icon={<span data-testid="mark" />}
          action={<button type="button">Generate</button>}
        />,
      );
      return slotsOf(container);
    };
    expect(shapeOf("page")).toEqual(shapeOf("panel"));
    expect(shapeOf("page")).toEqual(shapeOf("in-grid"));
    expect(shapeOf("page")).toEqual([
      "empty-state",
      "empty-state-header",
      "empty-state-media",
      "empty-state-title",
      "empty-state-description",
      "empty-state-actions",
    ]);
  });

  it("changes only the frame between sizes, never the content", () => {
    // Type scale and alignment legitimately differ between sizes; the rendered
    // text and the element tags must not, or `size` has become a fork.
    const shape = (size: EmptyStateSize) => {
      const { container } = render(
        <EmptyState
          size={size}
          title="No results"
          description="Run a generation to fill this in."
          action={<button type="button">Generate</button>}
        />,
      );
      const el = root(container);
      return {
        text: el.textContent,
        tags: [...el.querySelectorAll("*")].map((n) => n.tagName),
      };
    };
    expect(shape("page")).toEqual(shape("panel"));
    expect(shape("page")).toEqual(shape("in-grid"));
  });

  it("drops into a generation grid's empty slot without breaking its columns", () => {
    const { container } = render(
      <GenerationGrid
        density="compact"
        items={[] as { id: string }[]}
        getItemId={(i) => i.id}
        renderItem={() => null}
        empty={<EmptyState size="in-grid" title="Nothing generated yet" />}
      />,
    );
    const grid = container.querySelector('[data-slot="generation-grid-grid"]') as HTMLElement;
    // The grid keeps its column count; the empty state is a cell inside it.
    expect(grid.className).toContain("lg:grid-cols-8");
    const cell = container.querySelector('[data-slot="generation-grid-empty"]') as HTMLElement;
    expect(within(cell).getByText("Nothing generated yet")).toBeInTheDocument();
    expect(cell.querySelector('[data-slot="empty-state"]')).toBeInTheDocument();
  });

  it("never invents a CTA — the caller owns the verb", () => {
    const { rerender } = render(<EmptyState title="No exports" description="Export a take to see it here." />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(document.querySelector('[data-slot="empty-state-actions"]')).toBeNull();

    // Whatever verb the surface uses is what renders — verbatim, unwrapped.
    rerender(<EmptyState title="No exports" action={<button type="button">Export this take</button>} />);
    expect(screen.getByRole("button", { name: "Export this take" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /get started/i })).not.toBeInTheDocument();
  });

  it("renders a secondary action beside the CTA, in that order", () => {
    render(
      <EmptyState
        title="No takes"
        action={<button type="button">Generate</button>}
        secondaryAction={<button type="button">Browse templates</button>}
      />,
    );
    const actions = document.querySelector('[data-slot="empty-state-actions"]') as HTMLElement;
    const labels = [...actions.querySelectorAll("button")].map((b) => b.textContent);
    expect(labels).toEqual(["Generate", "Browse templates"]);
  });

  it("keeps the icon out of the accessible name", () => {
    const { container } = render(
      <EmptyState
        title="No documents"
        icon={<span>Document illustration</span>}
        action={<button type="button">Upload a document</button>}
      />,
    );
    const media = container.querySelector('[data-slot="empty-state-media"]') as HTMLElement;
    expect(media).toHaveAttribute("aria-hidden", "true");
    // Decoration that renders text would otherwise be concatenated into every
    // name around it ("No documentsDocument illustration").
    expect(screen.getByRole("button", { name: "Upload a document" })).toBeInTheDocument();
  });

  it("labels both halves of the pair so the direction survives without the arrow", () => {
    const { container } = render(
      <EmptyState
        title="Try a relight"
        examplePair={{
          before: { content: <span>source</span>, label: "Your photo" },
          after: { content: <span>result</span>, label: "Relit" },
        }}
      />,
    );
    expect(screen.getByRole("figure", { name: "Your photo" })).toBeInTheDocument();
    expect(screen.getByRole("figure", { name: "Relit" })).toBeInTheDocument();
    const arrow = container.querySelector('[data-slot="empty-state-example-arrow"]');
    expect(arrow).toHaveAttribute("aria-hidden", "true");
  });

  it("composes the example pair with any size rather than being a fourth size", () => {
    const { container } = render(
      <EmptyState size="page" title="Try a relight" examplePair={PAIR} />,
    );
    expect(root(container).dataset.size).toBe("page");
    expect(container.querySelector('[data-slot="empty-state-example-pair"]')).toBeInTheDocument();
  });
});
