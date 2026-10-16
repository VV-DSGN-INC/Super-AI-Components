import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { GenSettingsBar, GenSettingsItem } from "./gen-settings-bar";

describe("GenSettingsBar", () => {
  it("renders items as a toolbar with data-slots; items fire onClick", async () => {
    const onClick = vi.fn();
    render(
      <GenSettingsBar aria-label="Generation settings">
        <GenSettingsItem onClick={onClick}>Veo 3.1 Fast</GenSettingsItem>
        <GenSettingsItem>16:9</GenSettingsItem>
      </GenSettingsBar>,
    );
    const bar = screen.getByRole("toolbar", { name: "Generation settings" });
    expect(bar).toHaveAttribute("data-slot", "gen-settings-bar");
    const model = screen.getByRole("button", { name: "Veo 3.1 Fast" });
    expect(model).toHaveAttribute("data-slot", "gen-settings-item");
    await userEvent.click(model);
    expect(onClick).toHaveBeenCalledOnce();
  });
  it("disabled bar disables every item (running state)", () => {
    render(
      <GenSettingsBar disabled>
        <GenSettingsItem>16:9</GenSettingsItem>
      </GenSettingsBar>,
    );
    expect(screen.getByRole("button", { name: "16:9" })).toBeDisabled();
  });
  it("an explicitly enabled item can override the bar default", () => {
    render(
      <GenSettingsBar disabled>
        <GenSettingsItem disabled={false}>Download</GenSettingsItem>
      </GenSettingsBar>,
    );
    expect(screen.getByRole("button", { name: "Download" })).toBeEnabled();
  });

  it("is one tab stop (APG toolbar); the arrow walk needs layout, so GenSettingsBar's KeyboardOrder story asserts it", async () => {
    const user = userEvent.setup();
    render(
      <>
        <button type="button">before</button>
        <GenSettingsBar aria-label="Generation settings">
          <GenSettingsItem>Veo 3.1 Fast</GenSettingsItem>
          <GenSettingsItem>16:9</GenSettingsItem>
          <GenSettingsItem>720p</GenSettingsItem>
        </GenSettingsBar>
        <button type="button">after</button>
      </>,
    );
    await user.tab();
    await user.tab();
    expect(screen.getByRole("button", { name: "Veo 3.1 Fast" })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("button", { name: "after" })).toHaveFocus();
    expect(screen.getByRole("button", { name: "16:9" })).toHaveAttribute("tabindex", "-1");
  });
});
