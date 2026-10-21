import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SummaryCard } from "./summary-card";

describe("SummaryCard", () => {
  it("renders the generating state", () => {
    expect.fail("implement the generating state per docs/design-system/component-specs.md#k9-summary-card");
  });

  it("renders the ready state", () => {
    expect.fail("implement the ready state per docs/design-system/component-specs.md#k9-summary-card");
  });

  it("renders the attributed state", () => {
    expect.fail("implement the attributed state per docs/design-system/component-specs.md#k9-summary-card");
  });

  it("renders the quote-and-condense state", () => {
    expect.fail("implement the quote-and-condense state per docs/design-system/component-specs.md#k9-summary-card");
  });

  it("renders the collapsed state", () => {
    expect.fail("implement the collapsed state per docs/design-system/component-specs.md#k9-summary-card");
  });

  it("renders the turned-off state", () => {
    expect.fail("implement the turned-off state per docs/design-system/component-specs.md#k9-summary-card");
  });

  it("passes className through", () => {
    render(<SummaryCard className="test-class" />);
    expect(document.querySelector('[data-slot="summary-card"]')!.className).toContain("test-class");
  });
});
