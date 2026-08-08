import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TraceTimeline } from "./trace-timeline";

describe("TraceTimeline", () => {
  it("renders the collapsed state", () => {
    expect.fail("implement the collapsed state per docs/design-system/component-specs.md#n4-trace-timeline");
  });

  it("renders the expanded state", () => {
    expect.fail("implement the expanded state per docs/design-system/component-specs.md#n4-trace-timeline");
  });

  it("renders the errored state", () => {
    expect.fail("implement the errored state per docs/design-system/component-specs.md#n4-trace-timeline");
  });

  it("renders the retry-siblings state", () => {
    expect.fail("implement the retry-siblings state per docs/design-system/component-specs.md#n4-trace-timeline");
  });

  it("passes className through", () => {
    render(<TraceTimeline className="test-class" />);
    expect(document.querySelector('[data-slot="trace-timeline"]')!.className).toContain("test-class");
  });
});
