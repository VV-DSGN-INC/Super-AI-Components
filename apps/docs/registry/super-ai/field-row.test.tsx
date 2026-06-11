import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { FieldRow, UnitInput } from "./field-row";

describe("FieldRow", () => {
  it("associates label with the control, shows hint, exposes data-slot", () => {
    render(
      <FieldRow label="Volume" hint="Loudness of the clip" data-testid="row">
        {(id) => <input id={id} type="range" />}
      </FieldRow>,
    );
    expect(screen.getByLabelText("Volume")).toBeInTheDocument();
    expect(screen.getByText("Loudness of the clip")).toBeInTheDocument();
    expect(screen.getByTestId("row")).toHaveAttribute("data-slot", "field-row");
  });
});

describe("UnitInput", () => {
  it("renders the unit suffix and fires onValueChange with numbers", async () => {
    const onValueChange = vi.fn();
    render(<UnitInput aria-label="Speed" unit="x" defaultValue={1} onValueChange={onValueChange} />);
    expect(screen.getByText("x")).toBeInTheDocument();
    const input = screen.getByLabelText("Speed");
    await userEvent.clear(input);
    await userEvent.type(input, "2");
    expect(onValueChange).toHaveBeenLastCalledWith(2);
  });
});
