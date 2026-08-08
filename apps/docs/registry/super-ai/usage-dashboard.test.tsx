import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { UsageDashboard } from "./usage-dashboard";

describe("UsageDashboard", () => {
  it("renders the period-select state", () => {
    expect.fail("implement the period-select state per docs/design-system/component-specs.md#n6-usage-dashboard");
  });

  it("renders the summary-cards state", () => {
    expect.fail("implement the summary-cards state per docs/design-system/component-specs.md#n6-usage-dashboard");
  });

  it("renders the model-breakdown state", () => {
    expect.fail("implement the model-breakdown state per docs/design-system/component-specs.md#n6-usage-dashboard");
  });

  it("passes className through", () => {
    render(<UsageDashboard className="test-class" />);
    expect(document.querySelector('[data-slot="usage-dashboard"]')!.className).toContain("test-class");
  });
});
