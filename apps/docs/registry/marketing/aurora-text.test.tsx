import * as React from "react";

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AuroraText } from "./aurora-text";

describe("AuroraText", () => {
  it("renders text with the data-slot contract and aurora class", () => {
    render(<AuroraText>beautiful</AuroraText>);
    const el = screen.getByText("beautiful");
    expect(el).toHaveAttribute("data-slot", "aurora-text");
    expect(el.classList.contains("marketing-aurora-text")).toBe(true);
  });
  it("exposes the duration knob and merges className", () => {
    render(
      <AuroraText duration={12} className="font-bold">
        glow
      </AuroraText>,
    );
    const el = screen.getByText("glow");
    expect(el.style.getPropertyValue("--marketing-aurora-duration")).toBe("12");
    expect(el.classList.contains("font-bold")).toBe(true);
  });
  it("forwards ref to the span element", () => {
    const ref = React.createRef<HTMLSpanElement>();
    render(<AuroraText ref={ref}>glow</AuroraText>);
    expect(ref.current?.getAttribute("data-slot")).toBe("aurora-text");
  });
});
