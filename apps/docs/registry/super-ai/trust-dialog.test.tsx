import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { TrustDialog } from "./trust-dialog";

const PREVIEW = "curl -fsSL https://community-scripts.example/install.sh | sh";

const ACCOUNTS = [
  { id: "personal", name: "Personal" },
  { id: "acme", name: "Acme Corp", description: "Shared workspace" },
];

describe("TrustDialog", () => {
  it("renders the preview state, always above the warning", () => {
    render(<TrustDialog open preview={PREVIEW} />);

    const preview = screen.getByText(PREVIEW);
    const warning = screen.getByText("This is third-party content");

    // Spec rule: "A preview of what will run sits above the warning" — a
    // fixed layout decision, so this pins DOM order, not just presence.
    expect(preview.compareDocumentPosition(warning) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("renders the warning state, with a specific warning replacing the default copy", () => {
    render(<TrustDialog open preview={PREVIEW} warning="This template reads your clipboard on install." />);

    expect(screen.getByText("This template reads your clipboard on install.")).toBeInTheDocument();
    expect(
      screen.queryByText(/This may run code or access data from a source you didn't create/),
    ).not.toBeInTheDocument();
  });

  it("renders the trust-checkbox state, unchecked by default with a real accessible name", () => {
    render(<TrustDialog open preview={PREVIEW} trustLabel="I trust this template" />);

    const checkbox = screen.getByRole("checkbox", { name: "I trust this template" });
    expect(checkbox).toHaveAttribute("aria-checked", "false");
  });

  it("renders the account-picker state, attached to Continue rather than a separate step", () => {
    render(<TrustDialog open preview={PREVIEW} accounts={ACCOUNTS} />);

    const group = screen.getByRole("group");
    const continueButton = within(group).getByRole("button", { name: "Continue" });
    const picker = within(group).getByRole("combobox", { name: "Run in: Personal" });
    expect(continueButton).toBeInTheDocument();
    expect(picker).toBeInTheDocument();
  });

  it("keeps Continue disabled until the trust checkbox is ticked — the load-bearing safety property", async () => {
    const user = userEvent.setup();
    render(<TrustDialog open preview={PREVIEW} />);

    const continueButton = screen.getByRole("button", { name: "Continue" });
    expect(continueButton).toBeDisabled();

    await user.click(screen.getByRole("checkbox"));

    expect(continueButton).toBeEnabled();
  });

  it("passes className through", () => {
    render(<TrustDialog open preview={PREVIEW} className="test-class" />);
    expect(document.querySelector('[data-slot="trust-dialog"]')!.className).toContain("test-class");
  });
});
