import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TrustDialog } from "./trust-dialog";

describe("TrustDialog", () => {
  it("renders the preview state", () => {
    expect.fail("implement the preview state per docs/design-system/component-specs.md#n2-trust-dialog");
  });

  it("renders the warning state", () => {
    expect.fail("implement the warning state per docs/design-system/component-specs.md#n2-trust-dialog");
  });

  it("renders the trust-checkbox state", () => {
    expect.fail("implement the trust-checkbox state per docs/design-system/component-specs.md#n2-trust-dialog");
  });

  it("renders the account-picker state", () => {
    expect.fail("implement the account-picker state per docs/design-system/component-specs.md#n2-trust-dialog");
  });

  it("passes className through", () => {
    render(<TrustDialog className="test-class" />);
    expect(document.querySelector('[data-slot="trust-dialog"]')!.className).toContain("test-class");
  });
});
