import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AccountMenu } from "./account-menu";

const USER = { name: "Ada Lovelace", email: "ada@example.com" };

function baseProps() {
  return {
    user: USER,
    theme: "light",
    onThemeChange: vi.fn(),
    background: "default",
    onBackgroundChange: vi.fn(),
    onSignOut: vi.fn(),
  };
}

async function openMenu() {
  await userEvent.click(screen.getByRole("button", { name: /account menu for ada lovelace/i }));
}

async function openAppearanceSubmenu() {
  const trigger = await screen.findByRole("menuitem", { name: /appearance/i });
  // Base UI opens submenus on hover by default; the trigger click is
  // mouse-ignored for openOnHover triggers, so hover + wait for the popup.
  await userEvent.hover(trigger);
}

describe("AccountMenu", () => {
  it("renders the theme-radio state with real radio semantics", async () => {
    const onThemeChange = vi.fn();
    render(<AccountMenu {...baseProps()} onThemeChange={onThemeChange} />);
    await openMenu();
    await openAppearanceSubmenu();

    const lightOption = await screen.findByRole("menuitemradio", { name: "Light" });
    expect(lightOption).toHaveAttribute("aria-checked", "true");

    const darkOption = screen.getByRole("menuitemradio", { name: "Dark" });
    expect(darkOption).toHaveAttribute("aria-checked", "false");
    await userEvent.click(darkOption);
    expect(onThemeChange).toHaveBeenCalledWith("dark");
  });

  it("renders the background-swatches state with accessible names, not colour alone", async () => {
    const onBackgroundChange = vi.fn();
    render(<AccountMenu {...baseProps()} onBackgroundChange={onBackgroundChange} />);
    await openMenu();
    await openAppearanceSubmenu();

    // Every swatch must be reachable by an accessible name — colour alone
    // never conveys which background is which.
    const defaultSwatch = await screen.findByRole("radio", { name: "Default" });
    expect(defaultSwatch).toHaveAttribute("aria-checked", "true");

    const slateSwatch = screen.getByRole("radio", { name: "Slate" });
    expect(slateSwatch).toHaveAttribute("aria-checked", "false");
    await userEvent.click(slateSwatch);
    expect(onBackgroundChange).toHaveBeenCalledWith("slate");
  });

  it("renders the shortcut-hints state as real <kbd> elements", async () => {
    render(
      <AccountMenu
        {...baseProps()}
        items={[{ label: "Settings", shortcut: ["⌘", ","] }]}
      />,
    );
    await openMenu();

    const settingsRow = await screen.findByRole("menuitem", { name: /settings/i });
    const keys = within(settingsRow)
      .getAllByText(/^(⌘|,)$/)
      .map((el) => el.tagName);
    expect(keys).toEqual(["KBD", "KBD"]);
  });

  it("pins sign-out as the last item, separated by a rule", async () => {
    render(<AccountMenu {...baseProps()} items={[{ label: "Settings" }]} />);
    await openMenu();

    const items = await screen.findAllByRole("menuitem");
    expect(items[items.length - 1]).toHaveTextContent(/sign out/i);
  });

  it("pins appearance as a nested submenu rather than a dialog", async () => {
    render(<AccountMenu {...baseProps()} />);
    await openMenu();
    await openAppearanceSubmenu();

    await screen.findByRole("menuitemradio", { name: "Light" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("passes className through", () => {
    render(<AccountMenu {...baseProps()} className="test-class" />);
    expect(document.querySelector('[data-slot="account-menu"]')!.className).toContain("test-class");
  });
});
