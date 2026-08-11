import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AuthShell } from "./auth-shell";

describe("AuthShell", () => {

  it("passes className through", () => {
    render(<AuthShell className="test-class" />);
    expect(document.querySelector('[data-slot="auth-shell"]')!.className).toContain("test-class");
  });
});
