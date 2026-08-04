import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { RecentGrid, type RecentGridItem } from "./recent-grid";

const ITEMS: RecentGridItem[] = [
  { id: "1", title: "Q3 Launch Video", durationLabel: "12:04", editedAgo: "Edited 19 hours ago" },
  { id: "2", title: "Brand Explainer", durationLabel: "3:41", editedAgo: "Edited 2 days ago" },
];

describe("RecentGrid", () => {
  it("renders the grid state", () => {
    render(<RecentGrid items={ITEMS} layout="grid" />);
    expect(document.querySelector('[data-slot="recent-grid"]')).toHaveAttribute("data-layout", "grid");
    expect(document.querySelectorAll('[data-slot="recent-grid-item"]')).toHaveLength(2);
    expect(screen.getByText("Q3 Launch Video")).toBeInTheDocument();
  });

  it("renders the list state", () => {
    render(<RecentGrid items={ITEMS} layout="list" />);
    expect(document.querySelector('[data-slot="recent-grid"]')).toHaveAttribute("data-layout", "list");
    expect(document.querySelectorAll('[data-slot="recent-grid-item"]')).toHaveLength(2);
    // List rows render the title as their own text node, beside the thumbnail.
    expect(document.querySelector('[data-slot="recent-grid-title"]')).toHaveTextContent("Q3 Launch Video");
  });

  it("renders the duration-badge state", () => {
    render(<RecentGrid items={[{ id: "1", title: "Q3 Launch Video", durationLabel: "12:04" }]} />);
    expect(document.querySelector('[data-slot="recent-grid-duration"]')).toHaveTextContent("12:04");
  });

  it("omits the duration badge when no duration is given", () => {
    render(<RecentGrid items={[{ id: "1", title: "Untimed asset" }]} />);
    expect(document.querySelector('[data-slot="recent-grid-duration"]')).not.toBeInTheDocument();
  });

  it("renders the edited-ago state", () => {
    render(<RecentGrid items={[{ id: "1", title: "Q3 Launch Video", editedAgo: "Edited 19 hours ago" }]} />);
    const editedAgo = document.querySelector('[data-slot="recent-grid-edited-ago"]');
    expect(editedAgo).toHaveTextContent("Edited 19 hours ago");
    expect(editedAgo).not.toHaveAttribute("aria-hidden", "true");
  });

  it("renders the empty state as a first-class in-grid tile, not a bare string", () => {
    render(<RecentGrid items={[]} emptyTitle="No recent projects" emptyDescription="Start a new one." />);
    expect(document.querySelector('[data-slot="recent-grid-empty"]')).toBeInTheDocument();
    expect(document.querySelectorAll('[data-slot="recent-grid-item"]')).toHaveLength(0);
    expect(screen.getByText("No recent projects")).toBeInTheDocument();
    expect(screen.getByText("Start a new one.")).toBeInTheDocument();
  });

  it("renders the hover-actions state reachable by keyboard, not hover-gated", async () => {
    const onDelete = vi.fn();
    render(
      <RecentGrid
        items={[
          {
            id: "1",
            title: "Q3 Launch Video",
            actions: (
              <button type="button" onClick={onDelete}>
                Delete
              </button>
            ),
          },
        ]}
      />,
    );
    // getByRole excludes elements hidden via display:none/visibility:hidden/[hidden] —
    // finding it here proves visibility is opacity-driven, not existence-driven, so
    // the action stays mounted and tabbable without a hover event.
    const deleteButton = screen.getByRole("button", { name: "Delete" });
    expect(document.querySelector('[data-slot="recent-grid-actions"]')).toContainElement(deleteButton);

    // Keep tabbing until we reach the action button, proving it sits in the
    // natural tab order (the preview-tile frame trigger is the first stop).
    let guard = 0;
    while (document.activeElement !== deleteButton && guard < 5) {
      // eslint-disable-next-line no-await-in-loop
      await userEvent.tab();
      guard += 1;
    }
    expect(document.activeElement).toBe(deleteButton);
    await userEvent.keyboard("{Enter}");
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it("passes className through", () => {
    render(<RecentGrid className="test-class" />);
    expect(document.querySelector('[data-slot="recent-grid"]')!.className).toContain("test-class");
  });
});
