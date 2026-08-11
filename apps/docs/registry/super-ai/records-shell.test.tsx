import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RecordsShell } from "./records-shell";

describe("RecordsShell", () => {

  it("passes className through", () => {
    render(<RecordsShell className="test-class" />);
    expect(document.querySelector('[data-slot="records-shell"]')!.className).toContain("test-class");
  });
});
