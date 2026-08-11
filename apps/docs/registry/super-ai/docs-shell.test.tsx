import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DocsShell } from "./docs-shell";

describe("DocsShell", () => {

  it("passes className through", () => {
    render(<DocsShell className="test-class" />);
    expect(document.querySelector('[data-slot="docs-shell"]')!.className).toContain("test-class");
  });
});
