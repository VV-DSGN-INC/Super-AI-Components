import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TypedEdge } from "./typed-edge";

describe("TypedEdge", () => {
  it("renders the type-coloured state", () => {
    expect.fail("implement the type-coloured state per docs/design-system/component-specs.md#g10-typed-edge");
  });

  it("renders the selected state", () => {
    expect.fail("implement the selected state per docs/design-system/component-specs.md#g10-typed-edge");
  });

  it("renders the streaming state", () => {
    expect.fail("implement the streaming state per docs/design-system/component-specs.md#g10-typed-edge");
  });

  it("passes className through", () => {
    render(<TypedEdge className="test-class" />);
    expect(document.querySelector('[data-slot="typed-edge"]')!.className).toContain("test-class");
  });
});
