import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ChoiceChip, ChoiceChips } from "./choice-chips";

describe("ChoiceChips", () => {
  it("controlled: marks the selected chip and fires onValueChange", async () => {
    const onValueChange = vi.fn();
    render(
      <ChoiceChips value="2" onValueChange={onValueChange} data-testid="group">
        <ChoiceChip value="1">1</ChoiceChip>
        <ChoiceChip value="2">2</ChoiceChip>
      </ChoiceChips>,
    );
    expect(screen.getByTestId("group")).toHaveAttribute("data-slot", "choice-chips");
    expect(screen.getByRole("radio", { name: "2" })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("radio", { name: "2" })).toHaveAttribute("data-slot", "choice-chip");
    await userEvent.click(screen.getByRole("radio", { name: "1" }));
    expect(onValueChange).toHaveBeenCalledWith("1");
  });
  it("uncontrolled: defaultValue selects, clicking moves selection", async () => {
    render(
      <ChoiceChips defaultValue="a">
        <ChoiceChip value="a">a</ChoiceChip>
        <ChoiceChip value="b">b</ChoiceChip>
      </ChoiceChips>,
    );
    await userEvent.click(screen.getByRole("radio", { name: "b" }));
    expect(screen.getByRole("radio", { name: "b" })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("radio", { name: "a" })).toHaveAttribute("aria-checked", "false");
  });

  it("composes a consumer onClick instead of replacing selection", async () => {
    const onValueChange = vi.fn();
    const onClick = vi.fn();
    render(
      <ChoiceChips defaultValue="a" onValueChange={onValueChange}>
        <ChoiceChip value="a">a</ChoiceChip>
        <ChoiceChip value="b" onClick={onClick}>
          b
        </ChoiceChip>
      </ChoiceChips>,
    );
    await userEvent.click(screen.getByRole("radio", { name: "b" }));
    expect(onValueChange).toHaveBeenCalledWith("b");
    expect(onClick).toHaveBeenCalledOnce();
  });

  describe("keyboard — the ARIA radio pattern", () => {
    function Group({ disabledValue }: { disabledValue?: string }) {
      return (
        <>
          <button type="button">before</button>
          <ChoiceChips aria-label="Aspect ratio" defaultValue="4:5">
            {["1:1", "4:5", "16:9", "21:9"].map((v) => (
              <ChoiceChip key={v} value={v} disabled={v === disabledValue}>
                {v}
              </ChoiceChip>
            ))}
          </ChoiceChips>
          <button type="button">after</button>
        </>
      );
    }

    it("is one tab stop, landing on the checked chip", async () => {
      const user = userEvent.setup();
      render(<Group />);
      await user.tab();
      expect(screen.getByRole("button", { name: "before" })).toHaveFocus();
      await user.tab();
      expect(screen.getByRole("radio", { name: "4:5" })).toHaveFocus();
      await user.tab();
      expect(screen.getByRole("button", { name: "after" })).toHaveFocus();
    });

    it("arrow keys move focus and selection together, and wrap", async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      render(
        <ChoiceChips aria-label="Aspect ratio" defaultValue="1:1" onValueChange={onValueChange}>
          <ChoiceChip value="1:1">1:1</ChoiceChip>
          <ChoiceChip value="16:9">16:9</ChoiceChip>
        </ChoiceChips>,
      );
      await user.tab();
      await user.keyboard("{ArrowRight}");
      const wide = screen.getByRole("radio", { name: "16:9" });
      expect(wide).toHaveFocus();
      expect(wide).toHaveAttribute("aria-checked", "true");
      expect(onValueChange).toHaveBeenLastCalledWith("16:9");
      await user.keyboard("{ArrowRight}");
      expect(screen.getByRole("radio", { name: "1:1" })).toHaveAttribute("aria-checked", "true");
      await user.keyboard("{ArrowLeft}");
      expect(wide).toHaveAttribute("aria-checked", "true");
    });

    it("arrows skip a disabled chip, which never takes the selection", async () => {
      const user = userEvent.setup();
      render(<Group disabledValue="16:9" />);
      const disabled = screen.getByRole("radio", { name: "16:9" });
      expect(disabled).toHaveAttribute("data-disabled");
      await user.tab();
      await user.tab();
      await user.keyboard("{ArrowRight}");
      expect(screen.getByRole("radio", { name: "21:9" })).toHaveFocus();
      expect(disabled).toHaveAttribute("aria-checked", "false");
      await user.click(disabled);
      expect(disabled).toHaveAttribute("aria-checked", "false");
    });
  });
});
