import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ModelBar } from "./model-bar";

const segments = [
  {
    kind: "model" as const,
    id: "model",
    value: "eleven-sfx",
    options: [{ value: "eleven-sfx", label: "Eleven SFX" }],
  },
  { kind: "toggle" as const, id: "loop", label: "Loop", value: false },
  { kind: "duration" as const, id: "duration", value: "auto" as const, options: [4, 6, 8] },
  { kind: "percent" as const, id: "influence", label: "Prompt influence", value: 30 },
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
    expect(onChange).toHaveBeenCalledWith({ id: "loop", value: true });
  });
  it("disabled while parent streams", () => {
    render(<ModelBar segments={segments} onChange={() => {}} disabled />);
    expect(screen.getByRole("toolbar")).toHaveAttribute("aria-disabled", "true");
  });
});
