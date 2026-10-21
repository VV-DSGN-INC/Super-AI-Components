import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MessageLog } from "./message-log";

describe("MessageLog", () => {
  it("renders the empty state", () => {
    expect.fail("implement the empty state per docs/design-system/component-specs.md#r2-message-log");
  });

  it("renders the populated state", () => {
    expect.fail("implement the populated state per docs/design-system/component-specs.md#r2-message-log");
  });

  it("passes className through", () => {
    render(<MessageLog className="test-class" />);
    expect(document.querySelector('[data-slot="message-log"]')!.className).toContain("test-class");
  });
});
