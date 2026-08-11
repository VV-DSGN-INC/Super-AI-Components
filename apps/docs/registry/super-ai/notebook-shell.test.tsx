import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { NotebookShell } from "./notebook-shell";

describe("NotebookShell", () => {

  it("passes className through", () => {
    render(<NotebookShell className="test-class" />);
    expect(document.querySelector('[data-slot="notebook-shell"]')!.className).toContain("test-class");
  });
});
