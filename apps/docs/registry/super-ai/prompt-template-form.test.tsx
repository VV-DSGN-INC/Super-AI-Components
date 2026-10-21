import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PromptTemplateForm } from "./prompt-template-form";

describe("PromptTemplateForm", () => {
  it("renders the empty state", () => {
    expect.fail("implement the empty state per docs/design-system/component-specs.md#d9-prompt-template-form");
  });

  it("renders the partially-filled state", () => {
    expect.fail("implement the partially-filled state per docs/design-system/component-specs.md#d9-prompt-template-form");
  });

  it("renders the complete state", () => {
    expect.fail("implement the complete state per docs/design-system/component-specs.md#d9-prompt-template-form");
  });

  it("renders the with-defaults state", () => {
    expect.fail("implement the with-defaults state per docs/design-system/component-specs.md#d9-prompt-template-form");
  });

  it("renders the missing-required state", () => {
    expect.fail("implement the missing-required state per docs/design-system/component-specs.md#d9-prompt-template-form");
  });

  it("renders the multi-step state", () => {
    expect.fail("implement the multi-step state per docs/design-system/component-specs.md#d9-prompt-template-form");
  });

  it("passes className through", () => {
    render(<PromptTemplateForm className="test-class" />);
    expect(document.querySelector('[data-slot="prompt-template-form"]')!.className).toContain("test-class");
  });
});
