import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { SafetyBanner } from "./safety-banner";

describe("SafetyBanner", () => {
  it("renders status role with kind and message", () => {
    render(<SafetyBanner kind="degraded" message="Fallback model active — responses may be slower." />);
    const banner = screen.getByRole("status");
    expect(banner).toHaveAttribute("data-kind", "degraded");
    expect(screen.getByText("Fallback model active — responses may be slower.")).toBeInTheDocument();
  });

  it("fires onDismiss when dismissible", async () => {
    const onDismiss = vi.fn();
    render(<SafetyBanner kind="sandbox" message="Running in sandbox." onDismiss={onDismiss} />);
    await userEvent.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(onDismiss).toHaveBeenCalledOnce();
  });
});
