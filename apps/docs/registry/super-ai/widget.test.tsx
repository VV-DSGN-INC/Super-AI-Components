import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Widget } from "./widget";

describe("Widget", () => {
  it("renders the small state", () => {
    expect.fail("implement the small state per docs/design-system/component-specs.md#r1-widget");
  });

  it("renders the medium state", () => {
    expect.fail("implement the medium state per docs/design-system/component-specs.md#r1-widget");
  });

  it("renders the large state", () => {
    expect.fail("implement the large state per docs/design-system/component-specs.md#r1-widget");
  });

  it("renders the loading state", () => {
    expect.fail("implement the loading state per docs/design-system/component-specs.md#r1-widget");
  });

  it("renders the openable state", () => {
    expect.fail("implement the openable state per docs/design-system/component-specs.md#r1-widget");
  });

  it("renders the header-hidden state", () => {
    expect.fail("implement the header-hidden state per docs/design-system/component-specs.md#r1-widget");
  });

  it("passes className through", () => {
    render(<Widget className="test-class" />);
    expect(document.querySelector('[data-slot="widget"]')!.className).toContain("test-class");
  });
});
