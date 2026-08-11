import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ExploreShell } from "./explore-shell";

describe("ExploreShell", () => {

  it("passes className through", () => {
    render(<ExploreShell className="test-class" />);
    expect(document.querySelector('[data-slot="explore-shell"]')!.className).toContain("test-class");
  });
});
