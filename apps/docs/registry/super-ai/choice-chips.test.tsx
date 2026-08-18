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

  // The group announced role="radiogroup" and shipped one tab stop per chip
  // with inert arrow keys — an ARIA pattern advertised but not implemented.
  const Group = (props: { defaultValue?: string; onValueChange?: (v: string) => void }) => (
    <ChoiceChips {...props}>
      <ChoiceChip value="a">a</ChoiceChip>
      <ChoiceChip value="b">b</ChoiceChip>
      <ChoiceChip value="c">c</ChoiceChip>
    </ChoiceChips>
  );

  it("exposes exactly one tab stop, on the selected chip", () => {
    render(<Group defaultValue="b" />);
    const chips = screen.getAllByRole("radio");
    expect(chips.map((c) => c.tabIndex)).toEqual([-1, 0, -1]);
  });

  it("falls back to the first chip so the group never leaves the tab order", () => {
    render(<Group />);
    expect(screen.getAllByRole("radio").map((c) => c.tabIndex)).toEqual([0, -1, -1]);
  });

  it("moves focus and selection together, as the radio pattern requires", async () => {
    const onValueChange = vi.fn();
    render(<Group defaultValue="a" onValueChange={onValueChange} />);
    const [a, b] = screen.getAllByRole("radio");
    a.focus();

    await userEvent.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(b);
    expect(onValueChange).toHaveBeenCalledWith("b");
    expect(b).toHaveAttribute("aria-checked", "true");
  });

  it("wraps at both ends and honours Home and End", async () => {
    render(<Group defaultValue="a" />);
    const chips = screen.getAllByRole("radio");
    chips[0].focus();

    await userEvent.keyboard("{ArrowLeft}");
    expect(document.activeElement).toBe(chips[2]);

    await userEvent.keyboard("{Home}");
    expect(document.activeElement).toBe(chips[0]);

    await userEvent.keyboard("{End}");
    expect(document.activeElement).toBe(chips[2]);
  });

  it("leaves keys it does not own alone", async () => {
    render(<Group defaultValue="a" />);
    const chips = screen.getAllByRole("radio");
    chips[0].focus();
    await userEvent.keyboard("{Tab}");
    expect(document.activeElement).not.toBe(chips[1]);
  });
});
