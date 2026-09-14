import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ConnectionHint } from "./connection-hint";

describe("ConnectionHint", () => {
  it("renders the with-matches state", () => {
    expect.fail("implement the with-matches state per docs/design-system/component-specs.md#g12-connection-hint");
  });

  it("renders the no-matches state", () => {
    expect.fail("implement the no-matches state per docs/design-system/component-specs.md#g12-connection-hint");
  });

  it("renders the chips state", () => {
    expect.fail("implement the chips state per docs/design-system/component-specs.md#g12-connection-hint");
  });

  it("passes className through", () => {
    render(<ConnectionHint className="test-class" />);
    expect(document.querySelector('[data-slot="connection-hint"]')!.className).toContain("test-class");
  });
});
