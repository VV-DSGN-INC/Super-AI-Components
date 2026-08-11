import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HomeShell } from "./home-shell";

describe("HomeShell", () => {

  it("passes className through", () => {
    render(<HomeShell className="test-class" />);
    expect(document.querySelector('[data-slot="home-shell"]')!.className).toContain("test-class");
  });
});
