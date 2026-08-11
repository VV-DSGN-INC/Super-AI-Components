import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { AuthShell, type AuthShellProps } from "./auth-shell";

const REGIONS = ["marketing-panel", "provider-rows", "email-fallback", "legal-footer"];

const PROVIDERS: AuthShellProps["providers"] = [
  { id: "google", name: "Google", description: "you@northwind.com", trailing: "Last used" },
  { id: "github", name: "GitHub" },
  { id: "sso", name: "Okta SSO", disabled: true, disabledReason: "Not enabled for this workspace" },
];

describe("AuthShell", () => {
  // A shell is a layout, so the contract is regions, not states — and every
  // one of them is mounted whether or not it has content, so a region can be
  // discovered rather than appearing from nowhere once data arrives.
  it.each(REGIONS)("renders the %s region", (region) => {
    const { container } = render(<AuthShell />);
    expect(container.querySelector(`[data-region="${region}"]`)).not.toBeNull();
  });

  it("passes className through", () => {
    render(<AuthShell className="test-class" />);
    expect(document.querySelector('[data-slot="auth-shell"]')!.className).toContain("test-class");
  });

  // "The marketing panel is the same split layout as L6." The pane is not a
  // second split cut here — it goes into L6's own panel slot, so the two
  // surfaces stay one visual family by construction rather than by agreement.
  it("composes L6 and puts the marketing panel in L6's own panel slot", () => {
    const { container } = render(<AuthShell marketing={<p>Ship your first render in a minute.</p>} />);
    const wizard = container.querySelector('[data-slot="onboarding-wizard"]')!;
    expect(wizard).not.toBeNull();
    const panel = wizard.querySelector('[data-slot="onboarding-wizard-panel"]')!;
    expect(panel.querySelector('[data-region="marketing-panel"]')).not.toBeNull();
    expect(screen.getByText("Ship your first render in a minute.")).toBeVisible();
  });

  // L6 is a wizard and always draws a progress rail and a Back / Skip /
  // primary footer. This screen has one step, so that chrome is suppressed
  // outright — `display:none`, which takes the three controls out of the tab
  // order and off the accessibility tree as well as off the screen.
  //
  // Asserting a class is normally the wrong instinct, and this is the only
  // place in this file that does it: the suppression *is* CSS, and jsdom
  // computes no stylesheet, so `queryByRole` still finds all three buttons
  // here while a real browser (and axe) does not. It is paired with a presence
  // check on the two slots the override targets, so renaming either one inside
  // L6 fails here instead of silently restoring three dead buttons.
  it("suppresses L6's wizard chrome", () => {
    const { container } = render(<AuthShell />);
    const wizard = container.querySelector('[data-slot="onboarding-wizard"]') as HTMLElement;
    expect(wizard.querySelector('[data-slot="onboarding-wizard-progress"]')).not.toBeNull();
    expect(wizard.querySelector('[data-slot="onboarding-wizard-nav"]')).not.toBeNull();
    expect(wizard.className).toContain("[&_[data-slot=onboarding-wizard-progress]]:hidden");
    expect(wizard.className).toContain("[&_[data-slot=onboarding-wizard-nav]]:hidden");
  });

  // The wireframe reconciliation settled this one explicitly: O14's regions
  // said "provider buttons", its own Filled by: said A9 provider rows, and A9
  // won. Asserting A9's own slot is what separates composing from imitating.
  it("composes A9 entity rows for the providers", () => {
    render(<AuthShell providers={PROVIDERS} />);
    const rows = document.querySelectorAll('[data-slot="entity-row"]');
    expect(rows).toHaveLength(3);
    expect(
      document.querySelector('[data-provider-id="google"] [data-slot="entity-row-trailing"]')!,
    ).toHaveTextContent("Last used");
  });

  // The row title is a verb phrase, not a brand name: it is the button's whole
  // accessible name, and "Google" alone does not say what pressing it does.
  it("names each provider row with the action, not just the vendor", () => {
    render(<AuthShell providers={PROVIDERS} />);
    expect(screen.getByRole("button", { name: /Continue with Google/ })).toBeVisible();
    expect(screen.getByRole("button", { name: /Continue with GitHub/ })).toBeVisible();
  });

  it("selects a provider through A9's own row control", async () => {
    const onSelectProvider = vi.fn();
    render(<AuthShell providers={PROVIDERS} onSelectProvider={onSelectProvider} />);
    await userEvent.click(screen.getByRole("button", { name: /Continue with GitHub/ }));
    expect(onSelectProvider).toHaveBeenCalledWith("github");
  });

  it("lets a provider carry its own handler", async () => {
    const onSelect = vi.fn();
    const onSelectProvider = vi.fn();
    render(
      <AuthShell
        providers={[{ id: "google", name: "Google", onSelect }]}
        onSelectProvider={onSelectProvider}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: /Continue with Google/ }));
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelectProvider).not.toHaveBeenCalled();
  });

  // Unavailable is a real disabled control *and* a sentence. A9 dims the row,
  // but dimming alone is state conveyed by colour, and a dimmed div that still
  // looks pressable is worse than either.
  it("renders an unavailable provider as a disabled control with a written reason", () => {
    render(<AuthShell providers={PROVIDERS} />);
    const row = document.querySelector('[data-provider-id="sso"]')!;
    expect(row.tagName).toBe("BUTTON");
    expect(row).toBeDisabled();
    expect(within(row as HTMLElement).getByText("Not enabled for this workspace")).toBeVisible();
  });

  // Day one for this shell is an identity stack nobody has wired up yet. The
  // region stays mounted and falls to L1 rather than collapsing.
  it("falls to L1 inside the provider region when nothing is configured", () => {
    const { container } = render(<AuthShell />);
    const region = container.querySelector('[data-region="provider-rows"]')!;
    expect(region.querySelector('[data-slot="empty-state"]')).not.toBeNull();
    expect(region.querySelector('[data-slot="entity-row"]')).toBeNull();
  });

  it("submits the email fallback with the typed address", async () => {
    const onEmailSubmit = vi.fn();
    render(<AuthShell onEmailSubmit={onEmailSubmit} />);
    await userEvent.type(screen.getByLabelText("Email"), "ada@northwind.com");
    await userEvent.click(screen.getByRole("button", { name: "Continue with email" }));
    expect(onEmailSubmit).toHaveBeenCalledWith("ada@northwind.com");
  });

  it("accepts a controlled email value", async () => {
    const onEmailChange = vi.fn();
    render(<AuthShell email="ada@northwind.com" onEmailChange={onEmailChange} />);
    const field = screen.getByLabelText("Email");
    expect(field).toHaveValue("ada@northwind.com");
    await userEvent.type(field, "x");
    expect(onEmailChange).toHaveBeenCalled();
    // Still the caller's value: the shell holds the field only when nobody else does.
    expect(field).toHaveValue("ada@northwind.com");
  });

  // "UI only, no auth logic." The shell must never navigate on its own — a
  // default form submission would reload the page out from under the caller.
  it("does not let the email form submit natively", async () => {
    const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault());
    render(
      <div onSubmit={onSubmit}>
        <AuthShell onEmailSubmit={() => {}} />
      </div>,
    );
    await userEvent.type(screen.getByLabelText("Email"), "ada@northwind.com");
    await userEvent.click(screen.getByRole("button", { name: "Continue with email" }));
    const [event] = onSubmit.mock.calls[0];
    expect(event.defaultPrevented).toBe(true);
  });

  // "Terms and privacy links are part of the component, not an afterthought."
  it("renders both legal links with real destinations", () => {
    const { container } = render(
      <AuthShell
        terms={{ label: "Terms", href: "/legal/terms" }}
        privacy={{ label: "Privacy", href: "/legal/privacy" }}
      />,
    );
    const footer = container.querySelector('[data-region="legal-footer"]') as HTMLElement;
    expect(within(footer).getByRole("link", { name: "Terms" })).toHaveAttribute("href", "/legal/terms");
    expect(within(footer).getByRole("link", { name: "Privacy" })).toHaveAttribute("href", "/legal/privacy");
  });

  it("switches between sign in and sign up when a handler is given", async () => {
    const onModeChange = vi.fn();
    render(<AuthShell mode="sign-in" onModeChange={onModeChange} />);
    expect(screen.getByRole("heading", { name: "Sign in" })).toBeVisible();
    await userEvent.click(screen.getByRole("button", { name: "Create an account" }));
    expect(onModeChange).toHaveBeenCalledWith("sign-up");
  });

  it("renders no mode switch when there is nowhere to switch to", () => {
    render(<AuthShell mode="sign-up" />);
    expect(screen.getByRole("heading", { name: "Create your account" })).toBeVisible();
    expect(document.querySelector('[data-slot="auth-shell-mode-switch"]')).toBeNull();
  });

  it("takes copy as props rather than owning it", () => {
    render(
      <AuthShell
        title="Welcome back to Northwind"
        description="One account for every workspace."
        emailSubmitLabel="Email me a link"
      />,
    );
    expect(screen.getByRole("heading", { name: "Welcome back to Northwind" })).toBeVisible();
    expect(screen.getByText("One account for every workspace.")).toBeVisible();
    expect(screen.getByRole("button", { name: "Email me a link" })).toBeVisible();
  });
});
