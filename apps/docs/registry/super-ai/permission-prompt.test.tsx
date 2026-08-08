import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PermissionPrompt } from "./permission-prompt";

describe("PermissionPrompt", () => {
  it("renders the allow-once state", () => {
    expect.fail("implement the allow-once state per docs/design-system/component-specs.md#n8-permission-prompt");
  });

  it("renders the always-allow state", () => {
    expect.fail("implement the always-allow state per docs/design-system/component-specs.md#n8-permission-prompt");
  });

  it("renders the deny state", () => {
    expect.fail("implement the deny state per docs/design-system/component-specs.md#n8-permission-prompt");
  });

  it("renders the edit-first state", () => {
    expect.fail("implement the edit-first state per docs/design-system/component-specs.md#n8-permission-prompt");
  });

  it("passes className through", () => {
    render(<PermissionPrompt className="test-class" />);
    expect(document.querySelector('[data-slot="permission-prompt"]')!.className).toContain("test-class");
  });
});
