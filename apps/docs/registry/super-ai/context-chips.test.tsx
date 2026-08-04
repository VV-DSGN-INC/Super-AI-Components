import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ContextChip, ContextChipOverflow, ContextChips } from "./context-chips";

describe("ContextChips", () => {
  it("renders the file state", () => {
    render(
      <ContextChips>
        <ContextChip kind="file" label="design.fig" onRemove={vi.fn()} />
      </ContextChips>,
    );
    const chip = screen.getByText("design.fig").closest('[data-slot="context-chip"]');
    expect(chip).toHaveAttribute("data-kind", "file");
    expect(chip).toHaveAttribute("data-state", "resolved");
  });

  it("renders the selection state", () => {
    render(
      <ContextChips>
        <ContextChip kind="selection" label="lines 12-40" onRemove={vi.fn()} />
      </ContextChips>,
    );
    const chip = screen.getByText("lines 12-40").closest('[data-slot="context-chip"]');
    expect(chip).toHaveAttribute("data-kind", "selection");
  });

  it("renders the url state", () => {
    render(
      <ContextChips>
        <ContextChip kind="url" label="vercel.com/docs" onRemove={vi.fn()} />
      </ContextChips>,
    );
    const chip = screen.getByText("vercel.com/docs").closest('[data-slot="context-chip"]');
    expect(chip).toHaveAttribute("data-kind", "url");
  });

  it("renders the mention state", () => {
    render(
      <ContextChips>
        <ContextChip kind="mention" label="@teammate" onRemove={vi.fn()} />
      </ContextChips>,
    );
    const chip = screen.getByText("@teammate").closest('[data-slot="context-chip"]');
    expect(chip).toHaveAttribute("data-kind", "mention");
  });

  it("renders the overflow state as a count chip with a discernible name", () => {
    render(
      <ContextChips>
        <ContextChipOverflow count={3} />
      </ContextChips>,
    );
    const overflow = screen.getByRole("button", { name: "3 more references" });
    expect(overflow).toHaveAttribute("data-slot", "context-chip-overflow");
    expect(overflow).toHaveTextContent("+3");
  });

  it("renders the unresolved state with text/icon signal, not colour alone, and removes without nesting a button in a button", async () => {
    const onRemove = vi.fn();
    render(
      <ContextChips>
        <ContextChip kind="file" label="brief.pdf" unresolved onRemove={onRemove} />
      </ContextChips>,
    );
    const chip = screen.getByText("brief.pdf").closest('[data-slot="context-chip"]')!;
    expect(chip).toHaveAttribute("data-state", "unresolved");
    // The word "unresolved" is literal text content, not only a colour cue.
    expect(chip).toHaveTextContent(/unresolved/i);
    // The chip itself is not a button — only its remove control is — so no
    // interactive element is nested inside another one.
    expect(chip.tagName).not.toBe("BUTTON");
    const removeButton = screen.getByRole("button", { name: /remove unresolved reference brief\.pdf/i });
    expect(removeButton).toHaveAccessibleName();
    await userEvent.click(removeButton);
    expect(onRemove).toHaveBeenCalledOnce();
  });

  it("removable chip fires onRemove and omitting onRemove renders no remove control", async () => {
    const onRemove = vi.fn();
    render(
      <ContextChips>
        <ContextChip kind="file" label="removable.ts" onRemove={onRemove} />
        <ContextChip kind="file" label="fixed.ts" />
      </ContextChips>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Remove removable.ts" }));
    expect(onRemove).toHaveBeenCalledOnce();
    expect(screen.queryByRole("button", { name: /fixed\.ts/i })).not.toBeInTheDocument();
  });

  it("passes className through", () => {
    render(<ContextChips className="test-class" />);
    expect(document.querySelector('[data-slot="context-chips"]')!.className).toContain("test-class");
  });
});
