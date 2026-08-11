import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SettingsShell } from "./settings-shell";

describe("SettingsShell", () => {

  it("passes className through", () => {
    render(<SettingsShell className="test-class" />);
    expect(document.querySelector('[data-slot="settings-shell"]')!.className).toContain("test-class");
  });
});
