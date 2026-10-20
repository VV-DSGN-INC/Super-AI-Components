import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { WidgetGrid } from "./widget-grid";

describe("WidgetGrid", () => {
  it("renders the two-column state", () => {
    expect.fail("implement the two-column state per docs/design-system/component-specs.md#r2-widget-grid");
  });

  it("renders the four-column state", () => {
    expect.fail("implement the four-column state per docs/design-system/component-specs.md#r2-widget-grid");
  });

  it("renders the mixed-sizes state", () => {
    expect.fail("implement the mixed-sizes state per docs/design-system/component-specs.md#r2-widget-grid");
  });

  it("passes className through", () => {
    render(<WidgetGrid className="test-class" />);
    expect(document.querySelector('[data-slot="widget-grid"]')!.className).toContain("test-class");
  });
});
