import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ViewFrame } from "./view-frame";

describe("ViewFrame", () => {
  it("renders the docked state", () => {
    expect.fail("implement the docked state per docs/design-system/component-specs.md#r3-view-frame");
  });

  it("renders the page state", () => {
    expect.fail("implement the page state per docs/design-system/component-specs.md#r3-view-frame");
  });

  it("renders the with-modes state", () => {
    expect.fail("implement the with-modes state per docs/design-system/component-specs.md#r3-view-frame");
  });

  it("renders the with-ask-bar state", () => {
    expect.fail("implement the with-ask-bar state per docs/design-system/component-specs.md#r3-view-frame");
  });

  it("renders the rerunning state", () => {
    expect.fail("implement the rerunning state per docs/design-system/component-specs.md#r3-view-frame");
  });

  it("renders the failed state", () => {
    expect.fail("implement the failed state per docs/design-system/component-specs.md#r3-view-frame");
  });

  it("passes className through", () => {
    render(<ViewFrame className="test-class" />);
    expect(document.querySelector('[data-slot="view-frame"]')!.className).toContain("test-class");
  });
});
