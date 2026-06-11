import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AddFilterChip, FilterBar, FilterChip, FiltersButton } from "./filter-bar";

describe("FilterBar", () => {
  it("renders chips; active chip exposes pressed state and data-slots", () => {
    render(
      <FilterBar data-testid="bar">
        <FilterChip active>Genre</FilterChip>
        <FilterChip>Mood</FilterChip>
      </FilterBar>,
    );
    expect(screen.getByTestId("bar")).toHaveAttribute("data-slot", "filter-bar");
    const genre = screen.getByRole("button", { name: "Genre" });
    expect(genre).toHaveAttribute("aria-pressed", "true");
    expect(genre).toHaveAttribute("data-slot", "filter-chip-toggle");
    const wrapper = genre.closest('[data-slot="filter-chip"]');
    expect(wrapper).not.toBeNull();
    expect(wrapper).toHaveAttribute("data-state", "on");
    expect(screen.getByRole("button", { name: "Mood" })).toHaveAttribute("aria-pressed", "false");
  });
  it("removable chip fires onRemove, add-chip and filters button fire onClick", async () => {
    const onRemove = vi.fn();
    const onAdd = vi.fn();
    const onOpen = vi.fn();
    render(
      <FilterBar>
        <FilterChip active onRemove={onRemove}>
          Owner
        </FilterChip>
        <AddFilterChip onClick={onAdd}>Owner</AddFilterChip>
        <FiltersButton onClick={onOpen} />
      </FilterBar>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Remove Owner filter" }));
    await userEvent.click(screen.getByRole("button", { name: /add owner/i }));
    await userEvent.click(screen.getByRole("button", { name: "Filters" }));
    expect(onRemove).toHaveBeenCalledOnce();
    expect(onAdd).toHaveBeenCalledOnce();
    expect(onOpen).toHaveBeenCalledOnce();
  });
  it("keyboard Enter on remove button fires onRemove", async () => {
    const onRemove = vi.fn();
    render(
      <FilterBar>
        <FilterChip active onRemove={onRemove}>
          Owner
        </FilterChip>
      </FilterBar>,
    );
    screen.getByRole("button", { name: "Remove Owner filter" }).focus();
    await userEvent.keyboard("{Enter}");
    expect(onRemove).toHaveBeenCalledOnce();
  });
});
