import { fireEvent, render, screen } from "@testing-library/react";
import type { FormEvent } from "react";
import { describe, expect, it, vi } from "vitest";

import { SuggestionChip, SuggestionChips, SuggestionChipsOverflow } from "./suggestion-chips";

describe("SuggestionChips", () => {
  it("renders the plain state", () => {
    render(
      <SuggestionChips>
        <SuggestionChip suggestion="Summarize this document" onSelect={() => {}} />
        <SuggestionChip suggestion="Find action items" onSelect={() => {}} />
      </SuggestionChips>,
    );

    expect(screen.getByRole("button", { name: "Summarize this document" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Find action items" })).toBeInTheDocument();
  });

  it("renders the with-icon state", () => {
    render(
      <SuggestionChips>
        <SuggestionChip
          suggestion="Draft a reply"
          onSelect={() => {}}
          icon={<svg data-testid="chip-icon" />}
        />
      </SuggestionChips>,
    );

    const chip = screen.getByRole("button", { name: "Draft a reply" });
    expect(chip.querySelector('[data-slot="suggestion-chip-icon"]')).toBeInTheDocument();
    expect(screen.getByTestId("chip-icon")).toBeInTheDocument();
    // The icon wrapper is decorative — the accessible name comes from the
    // suggestion text alone, not icon markup leaking into it.
    expect(chip.querySelector('[data-slot="suggestion-chip-icon"]')).toHaveAttribute("aria-hidden");
  });

  it("renders the with-thumbnail state", () => {
    render(
      <SuggestionChips>
        <SuggestionChip
          suggestion="Continue from template"
          onSelect={() => {}}
          thumbnail={<img alt="" data-testid="chip-thumbnail" src="/template.png" />}
        />
      </SuggestionChips>,
    );

    const chip = screen.getByRole("button", { name: "Continue from template" });
    expect(chip.querySelector('[data-slot="suggestion-chip-thumbnail"]')).toBeInTheDocument();
    expect(screen.getByTestId("chip-thumbnail")).toBeInTheDocument();
  });

  it("renders the overflow-link state as a real link, not a chip", () => {
    render(
      <SuggestionChips>
        <SuggestionChip suggestion="Summarize this document" onSelect={() => {}} />
        <SuggestionChip suggestion="Find action items" onSelect={() => {}} />
        <SuggestionChipsOverflow count={4} href="/prompts" />
      </SuggestionChips>,
    );

    const overflow = screen.getByRole("link", { name: "4 more" });
    expect(overflow.tagName).toBe("A");
    expect(overflow).toHaveAttribute("href", "/prompts");
    expect(overflow).toHaveAttribute("data-slot", "suggestion-chips-overflow");
    // It is not one more prompt button — clicking it navigates, it never
    // fills the composer the way a SuggestionChip does.
    expect(screen.queryByRole("button", { name: "4 more" })).not.toBeInTheDocument();
  });

  it("fills the composer on click — never submits, never navigates", () => {
    const handleSelect = vi.fn();
    const handleSubmit = vi.fn((e: FormEvent) => e.preventDefault());

    render(
      <form onSubmit={handleSubmit}>
        <SuggestionChips>
          <SuggestionChip suggestion="Summarize this document" onSelect={handleSelect} />
        </SuggestionChips>
      </form>,
    );

    const chip = screen.getByRole("button", { name: "Summarize this document" });
    expect(chip).toHaveAttribute("type", "button");

    fireEvent.click(chip);

    expect(handleSelect).toHaveBeenCalledTimes(1);
    expect(handleSelect).toHaveBeenCalledWith("Summarize this document");
    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it("passes className through", () => {
    render(<SuggestionChips className="test-class" />);
    expect(document.querySelector('[data-slot="suggestion-chips"]')!.className).toContain("test-class");
  });
});
