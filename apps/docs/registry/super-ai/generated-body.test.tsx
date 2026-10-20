import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { GeneratedBody } from "./generated-body";

describe("GeneratedBody", () => {
  it("renders the streaming state", () => {
    expect.fail("implement the streaming state per docs/design-system/component-specs.md#r4-generated-body");
  });

  it("renders the rendered state", () => {
    expect.fail("implement the rendered state per docs/design-system/component-specs.md#r4-generated-body");
  });

  it("renders the failed-with-fallback state", () => {
    expect.fail("implement the failed-with-fallback state per docs/design-system/component-specs.md#r4-generated-body");
  });

  it("renders the failed-without-fallback state", () => {
    expect.fail("implement the failed-without-fallback state per docs/design-system/component-specs.md#r4-generated-body");
  });

  it("passes className through", () => {
    render(<GeneratedBody className="test-class" />);
    expect(document.querySelector('[data-slot="generated-body"]')!.className).toContain("test-class");
  });
});
