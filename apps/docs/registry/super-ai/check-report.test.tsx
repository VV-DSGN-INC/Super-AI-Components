import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CheckReport } from "./check-report";

describe("CheckReport", () => {
  it("renders the all-pass state", () => {
    expect.fail("implement the all-pass state per docs/design-system/component-specs.md#r3-check-report");
  });

  it("renders the some-fail state", () => {
    expect.fail("implement the some-fail state per docs/design-system/component-specs.md#r3-check-report");
  });

  it("passes className through", () => {
    render(<CheckReport className="test-class" />);
    expect(document.querySelector('[data-slot="check-report"]')!.className).toContain("test-class");
  });
});
