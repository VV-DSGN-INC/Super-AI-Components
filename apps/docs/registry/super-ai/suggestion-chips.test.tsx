import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SuggestionChips } from "./suggestion-chips";

describe("SuggestionChips", () => {
  it("renders the plain state", () => {
    expect.fail("implement the plain state per docs/design-system/component-specs.md#c2-suggestion-chips");
  });

  it("renders the with-icon state", () => {
    expect.fail("implement the with-icon state per docs/design-system/component-specs.md#c2-suggestion-chips");
  });

  it("renders the with-thumbnail state", () => {
    expect.fail("implement the with-thumbnail state per docs/design-system/component-specs.md#c2-suggestion-chips");
  });

  it("renders the overflow-link state", () => {
    expect.fail("implement the overflow-link state per docs/design-system/component-specs.md#c2-suggestion-chips");
  });

  it("passes className through", () => {
    render(<SuggestionChips className="test-class" />);
    expect(document.querySelector('[data-slot="suggestion-chips"]')!.className).toContain("test-class");
  });
});
