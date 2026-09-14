import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AiNode } from "./ai-node";

describe("AiNode", () => {
  it("renders the idle state", () => {
    expect.fail("implement the idle state per docs/design-system/component-specs.md#g2-ai-node");
  });

  it("renders the queued state", () => {
    expect.fail("implement the queued state per docs/design-system/component-specs.md#g2-ai-node");
  });

  it("renders the streaming state", () => {
    expect.fail("implement the streaming state per docs/design-system/component-specs.md#g2-ai-node");
  });

  it("renders the done state", () => {
    expect.fail("implement the done state per docs/design-system/component-specs.md#g2-ai-node");
  });

  it("renders the failed state", () => {
    expect.fail("implement the failed state per docs/design-system/component-specs.md#g2-ai-node");
  });

  it("renders the locked state", () => {
    expect.fail("implement the locked state per docs/design-system/component-specs.md#g2-ai-node");
  });

  it("renders the selected state", () => {
    expect.fail("implement the selected state per docs/design-system/component-specs.md#g2-ai-node");
  });

  it("renders the menu-floating state", () => {
    expect.fail("implement the menu-floating state per docs/design-system/component-specs.md#g2-ai-node");
  });

  it("passes className through", () => {
    render(<AiNode className="test-class" />);
    expect(document.querySelector('[data-slot="ai-node"]')!.className).toContain("test-class");
  });
});
