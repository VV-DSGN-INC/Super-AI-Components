import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { GenerationGrid, type GenerationGridDensity, type GenerationItemContext } from "./generation-grid";
import { ResultCard, type ResultCardState } from "./result-card";

interface Result {
  id: string;
  state: ResultCardState;
}

const results = (...states: ResultCardState[]): Result[] =>
  states.map((state, i) => ({ id: `r${i}`, state }));

const grid = (root: HTMLElement) => root.querySelector('[data-slot="generation-grid-grid"]') as HTMLElement;

/** The default cell: a result card wired to the grid's own selection. */
const renderResult = (item: Result, ctx: GenerationItemContext) => (
  <ResultCard
    state={item.state}
    selectable={ctx.selectMode}
    selected={ctx.selected}
    onSelect={ctx.toggleSelected}
    actions={<button type="button">Download</button>}
  />
);

describe("GenerationGrid", () => {
  it("renders the date-sections state", () => {
    const { container } = render(
      <GenerationGrid
        groups={[
          { id: "today", label: "Today", items: results("done", "done") },
          { id: "yesterday", label: "Yesterday", items: results("done") },
        ]}
        getItemId={(i) => i.id}
        renderItem={renderResult}
      />,
    );
    // One A3 per group, in the order given — relative buckets first.
    const groups = container.querySelectorAll('[data-slot="date-section"]');
    expect(groups).toHaveLength(2);
    expect(screen.getByText("Today")).toBeInTheDocument();
    expect(screen.getByText("Yesterday")).toBeInTheDocument();
    // Each group labels its own region, so the grid is navigable by region.
    expect(screen.getAllByRole("group")).toHaveLength(2);
  });

  it("renders the density state", () => {
    const columns = (density: GenerationGridDensity) => {
      const { container } = render(
        <GenerationGrid
          density={density}
          items={results("done", "done")}
          getItemId={(i) => i.id}
          renderItem={renderResult}
        />,
      );
      return grid(container).className;
    };
    expect(columns("compact")).toContain("lg:grid-cols-8");
    expect(columns("default")).toContain("lg:grid-cols-6");
    expect(columns("comfortable")).toContain("lg:grid-cols-4");
  });

  it("renders the select-mode state", () => {
    render(
      <GenerationGrid
        selectMode
        selectedIds={["r0"]}
        items={results("done", "done")}
        getItemId={(i) => i.id}
        renderItem={renderResult}
        bulkActions={<button type="button">Delete</button>}
      />,
    );
    expect(screen.getAllByRole("checkbox")).toHaveLength(2);
    expect(screen.getByRole("toolbar", { name: /bulk actions/i })).toBeInTheDocument();
    expect(screen.getByText("1 selected")).toBeInTheDocument();
  });

  it("renders the empty state", () => {
    const { container } = render(
      <GenerationGrid
        items={[] as Result[]}
        getItemId={(i) => i.id}
        renderItem={renderResult}
        empty={<p>Nothing generated yet.</p>}
      />,
    );
    expect(screen.getByText("Nothing generated yet.")).toBeInTheDocument();
    expect(container.querySelector('[data-slot="generation-grid-empty"]')).toBeInTheDocument();
  });

  it("passes className through", () => {
    render(
      <GenerationGrid
        className="test-class"
        items={[] as Result[]}
        getItemId={(i) => i.id}
        renderItem={renderResult}
      />,
    );
    expect(document.querySelector('[data-slot="generation-grid"]')!.className).toContain("test-class");
  });

  // ---------------------------------------------------------------------------
  // Load-bearing assertions (wave-4 spec §8)
  // ---------------------------------------------------------------------------

  it("does not change grid geometry when one item transitions streaming to done", () => {
    const items = results("streaming", "done", "queued");
    const { container, rerender } = render(
      <GenerationGrid items={items} getItemId={(i) => i.id} renderItem={renderResult} />,
    );
    const before = grid(container).className;
    const cellsBefore = container.querySelectorAll('[data-slot="generation-grid-item"]').length;

    const resolved = items.map((i) => (i.state === "streaming" ? { ...i, state: "done" as const } : i));
    rerender(<GenerationGrid items={resolved} getItemId={(i) => i.id} renderItem={renderResult} />);

    expect(grid(container).className).toBe(before);
    expect(container.querySelectorAll('[data-slot="generation-grid-item"]')).toHaveLength(cellsBefore);
  });

  it("changes columns with density, never the cells' contents", () => {
    const items = results("done", "done");
    const cellsFor = (density: GenerationGridDensity) => {
      const { container } = render(
        <GenerationGrid density={density} items={items} getItemId={(i) => i.id} renderItem={renderResult} />,
      );
      return [...container.querySelectorAll('[data-slot="generation-grid-item"]')].map((c) => c.innerHTML);
    };
    // Identical markup in every cell; only the container's column count moved.
    expect(cellsFor("compact")).toEqual(cellsFor("comfortable"));
  });

  it("never has select mode and hover actions live at the same time", () => {
    const items = results("done", "done");
    const { container: browsing } = render(
      <GenerationGrid items={items} getItemId={(i) => i.id} renderItem={renderResult} />,
    );
    expect(browsing.querySelectorAll('[data-slot="result-card-actions"]')).toHaveLength(2);
    expect(browsing.querySelectorAll('[data-slot="result-card-select"]')).toHaveLength(0);

    const { container: selecting } = render(
      <GenerationGrid selectMode items={items} getItemId={(i) => i.id} renderItem={renderResult} />,
    );
    expect(selecting.querySelectorAll('[data-slot="result-card-select"]')).toHaveLength(2);
    expect(selecting.querySelectorAll('[data-slot="result-card-actions"]')).toHaveLength(0);
  });

  it("renders empty as a tile inside the grid, not as a replacement for it", () => {
    const { container } = render(
      <GenerationGrid
        density="compact"
        items={[] as Result[]}
        getItemId={(i) => i.id}
        renderItem={renderResult}
        empty={<p>Nothing yet.</p>}
      />,
    );
    // The grid survives, with its column count intact, and the empty state is
    // one of its children — not a page takeover that replaced the surface.
    const g = grid(container);
    expect(g).toBeInTheDocument();
    expect(g.className).toContain("lg:grid-cols-8");
    expect(within(g).getByText("Nothing yet.")).toBeInTheDocument();
  });

  it("renders one date-section per group and nothing extra when ungrouped", () => {
    const { container: ungrouped } = render(
      <GenerationGrid items={results("done")} getItemId={(i) => i.id} renderItem={renderResult} />,
    );
    expect(ungrouped.querySelectorAll('[data-slot="date-section"]')).toHaveLength(0);

    const { container: grouped } = render(
      <GenerationGrid
        groups={[
          { id: "a", label: "Today", items: results("done") },
          { id: "b", label: "Last week", items: results("done", "done") },
          { id: "c", label: "Older", items: results("failed") },
        ]}
        getItemId={(i) => i.id}
        renderItem={renderResult}
      />,
    );
    expect(grouped.querySelectorAll('[data-slot="date-section"]')).toHaveLength(3);
    expect(grouped.querySelectorAll('[data-slot="generation-grid-item"]')).toHaveLength(4);
  });

  // ---------------------------------------------------------------------------
  // Selection
  // ---------------------------------------------------------------------------

  it("reports a toggled item through onSelectionChange", async () => {
    const onSelectionChange = vi.fn();
    render(
      <GenerationGrid
        selectMode
        selectedIds={[]}
        onSelectionChange={onSelectionChange}
        items={results("done", "done")}
        getItemId={(i) => i.id}
        renderItem={renderResult}
      />,
    );
    await userEvent.click(screen.getAllByRole("checkbox")[1]);
    expect(onSelectionChange).toHaveBeenCalledWith(["r1"]);
  });

  it("removes an already-selected item rather than re-adding it", async () => {
    const onSelectionChange = vi.fn();
    render(
      <GenerationGrid
        selectMode
        selectedIds={["r0", "r1"]}
        onSelectionChange={onSelectionChange}
        items={results("done", "done")}
        getItemId={(i) => i.id}
        renderItem={renderResult}
      />,
    );
    await userEvent.click(screen.getAllByRole("checkbox")[0]);
    expect(onSelectionChange).toHaveBeenCalledWith(["r1"]);
  });

  it("hides the bulk bar outside select mode even when bulkActions is supplied", () => {
    render(
      <GenerationGrid
        items={results("done")}
        getItemId={(i) => i.id}
        renderItem={renderResult}
        bulkActions={<button type="button">Delete</button>}
      />,
    );
    expect(screen.queryByRole("toolbar")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Delete" })).not.toBeInTheDocument();
  });
});
