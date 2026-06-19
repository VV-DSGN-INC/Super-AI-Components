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
});
