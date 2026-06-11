import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { RunButton } from "./run-button";

describe("RunButton", () => {
  it("fires onRun, and shows Stop while streaming", async () => {
    const onRun = vi.fn();
    const onStop = vi.fn();
    const { rerender } = render(<RunButton status="idle" onRun={onRun} onStop={onStop} />);
    await userEvent.click(screen.getByRole("button", { name: "Run" }));
    expect(onRun).toHaveBeenCalledOnce();
    rerender(<RunButton status="streaming" onRun={onRun} onStop={onStop} />);
    await userEvent.click(screen.getByRole("button", { name: "Stop" }));
    expect(onStop).toHaveBeenCalledOnce();
  });
  it("locked disables and relabels", () => {
    render(<RunButton status="locked" onRun={() => {}} />);
    expect(screen.getByRole("button", { name: "Upgrade to run" })).toBeDisabled();
  });
  it("renders scope menu items when handlers provided", async () => {
    const onRunFrom = vi.fn();
    render(<RunButton status="idle" onRun={() => {}} onRunFrom={onRunFrom} />);
    await userEvent.click(screen.getByRole("button", { name: "Run options" }));
    await userEvent.click(await screen.findByText("Run from here"));
    expect(onRunFrom).toHaveBeenCalledOnce();
  });
  it("shows cost chip on hover via title", () => {
    render(<RunButton status="idle" onRun={() => {}} cost={{ amount: 12, unit: "credits" }} />);
    expect(screen.getByRole("button", { name: "Run" })).toHaveAttribute("title", "~12 credits");
  });
  it("status=locked with onRunAll provided — Run options trigger is disabled", () => {
    render(<RunButton status="locked" onRun={() => {}} onRunAll={() => {}} />);
    expect(screen.getByRole("button", { name: "Run options" })).toBeDisabled();
  });
  it("no scope handlers → no Run options button in the DOM", () => {
    render(<RunButton status="idle" onRun={() => {}} />);
    expect(screen.queryByRole("button", { name: "Run options" })).toBeNull();
  });
});
