import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TypedHandle } from "./typed-handle";

describe("TypedHandle", () => {
  it("renders the input state", () => {
    expect.fail("implement the input state per docs/design-system/component-specs.md#g3-typed-handle");
  });

  it("renders the output state", () => {
    expect.fail("implement the output state per docs/design-system/component-specs.md#g3-typed-handle");
  });

  it("renders the stacked state", () => {
    expect.fail("implement the stacked state per docs/design-system/component-specs.md#g3-typed-handle");
  });

  it("renders the compatible state", () => {
    expect.fail("implement the compatible state per docs/design-system/component-specs.md#g3-typed-handle");
  });

  it("renders the unregistered-type state", () => {
    expect.fail("implement the unregistered-type state per docs/design-system/component-specs.md#g3-typed-handle");
  });

  it("passes className through", () => {
    render(<TypedHandle className="test-class" />);
    expect(document.querySelector('[data-slot="typed-handle"]')!.className).toContain("test-class");
  });
});
