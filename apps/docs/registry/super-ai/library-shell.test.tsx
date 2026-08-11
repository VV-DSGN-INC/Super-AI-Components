import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LibraryShell } from "./library-shell";

describe("LibraryShell", () => {

  it("passes className through", () => {
    render(<LibraryShell className="test-class" />);
    expect(document.querySelector('[data-slot="library-shell"]')!.className).toContain("test-class");
  });
});
