import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { SafetyBlock } from "./safety-block";

describe("SafetyBlock", () => {
  it("says something different for a blocked request than for a withheld response", () => {
    // These are different events: "rephrase" vs "it ran, you can't see it".
    const input = render(<SafetyBlock variant="input-blocked" policy="Policy A" />);
    expect(screen.getByText("Request blocked")).toBeInTheDocument();
    expect(screen.getByText(/wasn't sent/)).toBeInTheDocument();
    input.unmount();

    render(<SafetyBlock variant="output-blocked" policy="Policy A" />);
    expect(screen.getByText("Response withheld")).toBeInTheDocument();
    expect(screen.getByText(/can't be shown/)).toBeInTheDocument();
  });

  it("always names the policy — a block with no locus is indistinguishable from a bug", () => {
    render(<SafetyBlock variant="input-blocked" policy="Clinical advice boundary" />);
    expect(document.querySelector('[data-slot="safety-block-policy"]')!.textContent).toBe(
      "Clinical advice boundary",
    );
  });

  it("is a note, not an alert, so it does not interrupt a screen reader mid-sentence", () => {
    render(<SafetyBlock variant="input-blocked" policy="Policy A" />);
    expect(screen.getByRole("note")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("blurs a sensitive fragment until the reader asks, and reveal is a click not a hover", async () => {
    render(<SafetyBlock variant="output-blocked" policy="PHI" sensitive fragment="member 449-22" />);
    const fragment = document.querySelector('[data-slot="safety-block-fragment"]')!;
    expect(fragment.className).toContain("blur");

    await userEvent.click(screen.getByRole("button", { name: "Show blocked text" }));
    expect(document.querySelector('[data-slot="safety-block-fragment"]')!.className).not.toContain("blur");
  });

  it("renders a non-sensitive fragment unblurred and with no reveal control", () => {
    render(<SafetyBlock variant="input-blocked" policy="Policy A" fragment="delete all records" />);
    expect(document.querySelector('[data-slot="safety-block-fragment"]')!.className).not.toContain("blur");
    expect(screen.queryByRole("button", { name: "Show blocked text" })).not.toBeInTheDocument();
  });

  it("renders the compliant path when one is given", () => {
    render(
      <SafetyBlock
        variant="input-blocked"
        policy="Policy A"
        alternatives="Ask a benefits administrator instead."
      />,
    );
    expect(document.querySelector('[data-slot="safety-block-alternatives"]')!.textContent).toContain(
      "benefits administrator",
    );
  });
});
