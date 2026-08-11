import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TimelineShell } from "./timeline-shell";

describe("TimelineShell", () => {

  it("passes className through", () => {
    render(<TimelineShell className="test-class" />);
    expect(document.querySelector('[data-slot="timeline-shell"]')!.className).toContain("test-class");
  });
});
