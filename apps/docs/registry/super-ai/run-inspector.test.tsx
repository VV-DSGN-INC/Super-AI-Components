import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RunInspector } from "./run-inspector";

describe("RunInspector", () => {
  it("renders the input-tab state", () => {
    expect.fail("implement the input-tab state per docs/design-system/component-specs.md#n5-run-inspector");
  });

  it("renders the output-tab state", () => {
    expect.fail("implement the output-tab state per docs/design-system/component-specs.md#n5-run-inspector");
  });

  it("renders the metadata-tab state", () => {
    expect.fail("implement the metadata-tab state per docs/design-system/component-specs.md#n5-run-inspector");
  });

  it("renders the error-tab state", () => {
    expect.fail("implement the error-tab state per docs/design-system/component-specs.md#n5-run-inspector");
  });

  it("passes className through", () => {
    render(<RunInspector className="test-class" />);
    expect(document.querySelector('[data-slot="run-inspector"]')!.className).toContain("test-class");
  });
});
