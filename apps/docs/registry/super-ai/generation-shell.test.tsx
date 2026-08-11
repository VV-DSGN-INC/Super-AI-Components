import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { GenerationShell } from "./generation-shell";

describe("GenerationShell", () => {

  it("passes className through", () => {
    render(<GenerationShell className="test-class" />);
    expect(document.querySelector('[data-slot="generation-shell"]')!.className).toContain("test-class");
  });
});
