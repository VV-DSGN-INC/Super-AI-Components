import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PromptEnhancer } from "./prompt-enhancer";

describe("PromptEnhancer", () => {
  it("renders the idle state", () => {
    expect.fail("implement the idle state per docs/design-system/component-specs.md#d8-prompt-enhancer");
  });

  it("renders the enhancing state", () => {
    expect.fail("implement the enhancing state per docs/design-system/component-specs.md#d8-prompt-enhancer");
  });

  it("renders the suggested state", () => {
    expect.fail("implement the suggested state per docs/design-system/component-specs.md#d8-prompt-enhancer");
  });

  it("renders the accepted state", () => {
    expect.fail("implement the accepted state per docs/design-system/component-specs.md#d8-prompt-enhancer");
  });

  it("renders the reverted state", () => {
    expect.fail("implement the reverted state per docs/design-system/component-specs.md#d8-prompt-enhancer");
  });

  it("renders the failed state", () => {
    expect.fail("implement the failed state per docs/design-system/component-specs.md#d8-prompt-enhancer");
  });

  it("passes className through", () => {
    render(<PromptEnhancer className="test-class" />);
    expect(document.querySelector('[data-slot="prompt-enhancer"]')!.className).toContain("test-class");
  });
});
