import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ModelBar, type ModelBarSegment } from "./model-bar";

const segments: ModelBarSegment[] = [
  {
    kind: "model",
    id: "model",
    value: "eleven-sfx",
    options: [{ value: "eleven-sfx", label: "Eleven SFX" }],
  },
  { kind: "toggle", id: "loop", label: "Loop", value: false },
  { kind: "duration", id: "duration", value: "auto", options: [4, 6, 8] },
  { kind: "percent", id: "influence", label: "Prompt influence", value: 30 },
];

describe("ModelBar", () => {
  it("renders the SFX stress-test bar", () => {
    render(<ModelBar segments={segments} onChange={() => {}} />);
    expect(screen.getByText("Eleven SFX")).toBeInTheDocument();
    expect(screen.getByText("Auto")).toBeInTheDocument();
    expect(screen.getByText("30%")).toBeInTheDocument();
  });
  it("emits patch on toggle", async () => {
    const onChange = vi.fn();
    render(<ModelBar segments={segments} onChange={onChange} />);
    await userEvent.click(screen.getByRole("switch", { name: "Loop" }));
    // Review fix: ModelBarPatch gained a `kind` discriminant, so this spec assertion
    // now expects it — the one sanctioned change to the original spec tests.
    expect(onChange).toHaveBeenCalledWith({ id: "loop", kind: "toggle", value: true });
  });
  it("disabled while parent streams", () => {
    render(<ModelBar segments={segments} onChange={() => {}} disabled />);
    expect(screen.getByRole("toolbar")).toHaveAttribute("aria-disabled", "true");
  });

  it("cycles a 3-option aspect segment to the next option", async () => {
    const onChange = vi.fn();
    const aspect: ModelBarSegment = {
      kind: "aspect",
      id: "aspect",
      value: "16:9",
      options: [
        { value: "1:1", label: "1:1" },
        { value: "16:9", label: "16:9" },
        { value: "9:16", label: "9:16" },
      ],
    };
    render(<ModelBar segments={[aspect]} onChange={onChange} />);
    await userEvent.click(screen.getByRole("button", { name: "16:9" }));
    expect(onChange).toHaveBeenCalledWith({ id: "aspect", kind: "aspect", value: "9:16" });
  });

  it("includes auto in the duration cycle ring (last option → auto → first)", async () => {
    const onChange = vi.fn();
    const durationAt = (value: number | "auto"): ModelBarSegment => ({
      kind: "duration",
      id: "duration",
      value,
      options: [4, 6, 8],
    });
    const { rerender } = render(<ModelBar segments={[durationAt(8)]} onChange={onChange} />);
    await userEvent.click(screen.getByRole("button", { name: "8" }));
    expect(onChange).toHaveBeenLastCalledWith({ id: "duration", kind: "duration", value: "auto" });
    rerender(<ModelBar segments={[durationAt("auto")]} onChange={onChange} />);
    await userEvent.click(screen.getByRole("button", { name: "Auto" }));
    // number[] options normalize internally via String(v), so the ring re-enters at "4".
    expect(onChange).toHaveBeenLastCalledWith({ id: "duration", kind: "duration", value: "4" });
  });

  it("percent: auto click → 0, 100 click → auto", async () => {
    const onChange = vi.fn();
    const percentAt = (value: number | "auto"): ModelBarSegment => ({
      kind: "percent",
      id: "influence",
      label: "Prompt influence",
      value,
    });
    const { rerender } = render(<ModelBar segments={[percentAt("auto")]} onChange={onChange} />);
    await userEvent.click(screen.getByRole("button", { name: /Prompt influence/ }));
    expect(onChange).toHaveBeenLastCalledWith({ id: "influence", kind: "percent", value: 0 });
    rerender(<ModelBar segments={[percentAt(100)]} onChange={onChange} />);
    await userEvent.click(screen.getByRole("button", { name: /Prompt influence/ }));
    expect(onChange).toHaveBeenLastCalledWith({ id: "influence", kind: "percent", value: "auto" });
  });

  it("model segment opens a dropdown listing every option and emits the selection", async () => {
    const onChange = vi.fn();
    const model: ModelBarSegment = {
      kind: "model",
      id: "model",
      value: "flux-1.1-pro",
      options: [
        { value: "flux-1.1-pro", label: "Flux 1.1 Pro" },
        { value: "imagen-4", label: "Imagen 4" },
      ],
    };
    render(<ModelBar segments={[model]} onChange={onChange} />);
    await userEvent.click(screen.getByRole("button", { name: "Flux 1.1 Pro" }));
    expect(await screen.findByRole("menuitem", { name: "Flux 1.1 Pro" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("menuitem", { name: "Imagen 4" }));
    expect(onChange).toHaveBeenCalledWith({ id: "model", kind: "model", value: "imagen-4" });
  });

  it("overflows segments past the limit into a dropdown; Escape dismisses it", async () => {
    const seven: ModelBarSegment[] = [
      ...Array.from({ length: 6 }, (_, i) => ({
        kind: "toggle" as const,
        id: `t${i + 1}`,
        label: `Toggle ${i + 1}`,
        value: false,
      })),
      { kind: "percent", id: "steps", label: "Steps", value: 50 },
    ];
    render(<ModelBar segments={seven} onChange={vi.fn()} />);
    expect(screen.queryByText("Steps")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "More settings" }));
    expect(await screen.findByText("Steps")).toBeInTheDocument();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByText("Steps")).not.toBeInTheDocument());
  });

  it("does not emit when cycling cannot change the value", async () => {
    const onChange = vi.fn();
    render(
      <ModelBar
        segments={[{ kind: "aspect", id: "aspect", value: "1:1", options: [{ value: "1:1", label: "1:1" }] }]}
        onChange={onChange}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "1:1" }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("disables every segment control individually while disabled", () => {
    render(<ModelBar segments={segments} onChange={() => {}} disabled />);
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(3); // model trigger, duration, percent — the toggle is the switch
    for (const button of buttons) expect(button).toBeDisabled();
    expect(screen.getByRole("switch", { name: "Loop" })).toBeDisabled();
  });

  it("honors per-segment disabled without disabling the bar", () => {
    render(
      <ModelBar
        segments={[
          { kind: "toggle", id: "loop", label: "Loop", value: false, disabled: true },
          { kind: "percent", id: "influence", label: "Prompt influence", value: 30 },
        ]}
        onChange={() => {}}
      />,
    );
    expect(screen.getByRole("switch", { name: "Loop" })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Prompt influence/ })).toBeEnabled();
  });
});
