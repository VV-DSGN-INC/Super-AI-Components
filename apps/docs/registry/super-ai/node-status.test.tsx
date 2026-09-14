import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { NodeStatus } from "./node-status";

describe("NodeStatus", () => {
  it("renders the idle state", () => {
    expect.fail("implement the idle state per docs/design-system/component-specs.md#g11-node-status");
  });

  it("renders the queued state", () => {
    expect.fail("implement the queued state per docs/design-system/component-specs.md#g11-node-status");
  });

  it("renders the streaming state", () => {
    expect.fail("implement the streaming state per docs/design-system/component-specs.md#g11-node-status");
  });

  it("renders the done state", () => {
    expect.fail("implement the done state per docs/design-system/component-specs.md#g11-node-status");
  });

  it("renders the failed state", () => {
    expect.fail("implement the failed state per docs/design-system/component-specs.md#g11-node-status");
  });

  it("renders the locked state", () => {
    expect.fail("implement the locked state per docs/design-system/component-specs.md#g11-node-status");
  });

  it("renders the compact state", () => {
    expect.fail("implement the compact state per docs/design-system/component-specs.md#g11-node-status");
  });

  it("passes className through", () => {
    render(<NodeStatus className="test-class" />);
    expect(document.querySelector('[data-slot="node-status"]')!.className).toContain("test-class");
  });
});
