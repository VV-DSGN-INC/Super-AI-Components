import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AutoFill } from "./auto-fill";

describe("AutoFill", () => {
  it("renders the configuring state", () => {
    expect.fail("implement the configuring state per docs/design-system/component-specs.md#p3-auto-fill");
  });

  it("renders the sample-preview state", () => {
    expect.fail("implement the sample-preview state per docs/design-system/component-specs.md#p3-auto-fill");
  });

  it("renders the applying state", () => {
    expect.fail("implement the applying state per docs/design-system/component-specs.md#p3-auto-fill");
  });

  it("renders the suggested state", () => {
    expect.fail("implement the suggested state per docs/design-system/component-specs.md#p3-auto-fill");
  });

  it("renders the accepted state", () => {
    expect.fail("implement the accepted state per docs/design-system/component-specs.md#p3-auto-fill");
  });

  it("renders the overridden state", () => {
    expect.fail("implement the overridden state per docs/design-system/component-specs.md#p3-auto-fill");
  });

  it("renders the failed state", () => {
    expect.fail("implement the failed state per docs/design-system/component-specs.md#p3-auto-fill");
  });

  it("passes className through", () => {
    render(<AutoFill className="test-class" />);
    expect(document.querySelector('[data-slot="auto-fill"]')!.className).toContain("test-class");
  });
});
