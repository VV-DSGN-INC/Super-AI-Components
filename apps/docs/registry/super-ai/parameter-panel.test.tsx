import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ParameterPanel, ParameterSegmented, ParameterSlider, ParameterTabs } from "./parameter-panel";
import { ResetAffordance } from "./reset-affordance";

describe("ParameterPanel", () => {
  it("renders the slider-unit state with a real accessible name, spoken value text, and the raw number visible", () => {
    render(
      <ParameterPanel>
        <ParameterSlider
          label="Guidance"
          value={7}
          min={0}
          max={20}
          unit=""
          endpoints={["More creative", "More literal"]}
          onValueChange={vi.fn()}
        />
      </ParameterPanel>,
    );

    const slider = screen.getByRole("slider", { name: "Guidance" });
    expect(slider).toHaveAttribute("aria-valuetext", "7");
    // The raw number stays visible in its own field alongside the slider —
    // spec: "the raw number stays visible."
    expect(screen.getByRole("spinbutton", { name: "Guidance value" })).toHaveValue(7);
    // Endpoints speak human, never the raw min/max.
    expect(screen.getByText("More creative")).toBeInTheDocument();
    expect(screen.getByText("More literal")).toBeInTheDocument();
    expect(screen.queryByText("0")).not.toBeInTheDocument();
    expect(screen.queryByText("20")).not.toBeInTheDocument();
  });

  it("renders the segmented state with real selected semantics", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <ParameterPanel>
        <ParameterSegmented
          label="Quality"
          options={[
            { value: "draft", label: "Draft" },
            { value: "standard", label: "Standard" },
            { value: "high", label: "High" },
          ]}
          defaultValue="standard"
          onValueChange={onValueChange}
        />
      </ParameterPanel>,
    );

    const standard = screen.getByRole("button", { name: "Standard" });
    const high = screen.getByRole("button", { name: "High" });
    // Selection is programmatic (aria-pressed), not colour-only.
    expect(standard).toHaveAttribute("aria-pressed", "true");
    expect(high).toHaveAttribute("aria-pressed", "false");

    await user.click(high);
    expect(onValueChange).toHaveBeenCalledWith("high");
  });

  it("renders the tabbed state, grouping parameters and switching panels", async () => {
    const user = userEvent.setup();
    render(
      <ParameterTabs
        groups={[
          { value: "basic", label: "Basic", content: <ParameterSlider label="Steps" value={20} onValueChange={vi.fn()} /> },
          {
            value: "advanced",
            label: "Advanced",
            content: <ParameterSlider label="Seed" value={42} onValueChange={vi.fn()} />,
          },
        ]}
      />,
    );

    expect(screen.getByRole("slider", { name: "Steps" })).toBeInTheDocument();
    expect(screen.queryByRole("slider", { name: "Seed" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Advanced" }));
    expect(screen.getByRole("slider", { name: "Seed" })).toBeInTheDocument();
  });

  it("renders the reset-all state as a group-scope reset that clears every row beneath it", async () => {
    const user = userEvent.setup();
    const onResetAll = vi.fn();
    render(
      <ParameterPanel title="Sampling" modified onResetAll={onResetAll}>
        <ParameterSlider label="Guidance" value={12} onValueChange={vi.fn()} />
      </ParameterPanel>,
    );

    const groupReset = screen.getByRole("button", { name: "Reset all" });
    expect(groupReset).toHaveAttribute("data-state", "modified");
    expect(groupReset).toHaveAttribute("data-slot", "reset-affordance");

    await user.click(groupReset);
    expect(onResetAll).toHaveBeenCalledTimes(1);
  });

  it("renders the inline-education state as always-visible text wired to the control, not a hover-only tooltip", () => {
    render(
      <ParameterPanel>
        <ParameterSlider
          label="Temperature"
          value={0.7}
          min={0}
          max={1}
          step={0.1}
          description="Controls how much the model varies its wording between runs."
          onValueChange={vi.fn()}
        />
      </ParameterPanel>,
    );

    // The explanation is real, always-rendered text — not something that
    // only appears on hover/focus of a tooltip trigger.
    const explanation = screen.getByText("Controls how much the model varies its wording between runs.");
    expect(explanation).toBeVisible();
    expect(screen.getByRole("slider", { name: "Temperature" })).toHaveAccessibleDescription(
      "Controls how much the model varies its wording between runs.",
    );
  });

  it("supports a row-scope reset affordance composed from A11", () => {
    render(
      <ParameterPanel>
        <ParameterSlider
          label="Opacity"
          value={50}
          onValueChange={vi.fn()}
          reset={<ResetAffordance state="modified" onReset={vi.fn()} />}
        />
      </ParameterPanel>,
    );

    expect(document.querySelector('[data-slot="field-row-reset"] [data-slot="reset-affordance"]')).toBeInTheDocument();
  });

  it("passes className through", () => {
    render(<ParameterPanel className="test-class" />);
    expect(document.querySelector('[data-slot="parameter-panel"]')!.className).toContain("test-class");
  });
});
