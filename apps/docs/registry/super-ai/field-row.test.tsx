import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { FieldRow, UnitInput } from "./field-row";
import { ResetAffordance } from "./reset-affordance";

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
  it("wires aria-describedby to the hint", () => {
    render(
      <FieldRow label="Speed" hint="Playback rate">
        {(id, describedBy) => <input id={id} aria-describedby={describedBy} />}
      </FieldRow>,
    );
    const input = screen.getByLabelText("Speed");
    expect(input).toHaveAccessibleDescription("Playback rate");
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
  it("composes a consumer onChange with onValueChange", async () => {
    const onValueChange = vi.fn();
    const onChange = vi.fn();
    render(
      <UnitInput
        aria-label="V"
        unit="%"
        defaultValue={1}
        onValueChange={onValueChange}
        onChange={onChange}
      />,
    );
    const input = screen.getByLabelText("V");
    await userEvent.clear(input);
    await userEvent.type(input, "5");
    expect(onValueChange).toHaveBeenLastCalledWith(5);
    expect(onChange).toHaveBeenCalled();
  });
});

describe("FieldRow reset slot (A11 retrofit)", () => {
  it("renders nothing extra when reset is omitted", () => {
    render(<FieldRow label="Opacity">{(id) => <input id={id} />}</FieldRow>);
    expect(document.querySelector('[data-slot="field-row-reset"]')).toBeNull();
  });

  it("renders the reset affordance in the control row when given", () => {
    render(
      <FieldRow label="Opacity" reset={<ResetAffordance state="modified" onReset={() => {}} />}>
        {(id) => <input id={id} />}
      </FieldRow>,
    );
    const slot = document.querySelector('[data-slot="field-row-reset"]')!;
    expect(slot.querySelector('[data-slot="reset-affordance"]')).toBeInTheDocument();
  });
});
