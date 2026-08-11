import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StudioShell } from "./studio-shell";

describe("StudioShell", () => {

  it("passes className through", () => {
    render(<StudioShell className="test-class" />);
    expect(document.querySelector('[data-slot="studio-shell"]')!.className).toContain("test-class");
  });
});
