import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DateSection } from "./date-section";

describe("DateSection", () => {
  it("renders a labeled section containing its children", () => {
    render(
      <DateSection label="Today">
        <p>item</p>
      </DateSection>,
    );
    const section = screen.getByRole("group", { name: "Today" });
    expect(section).toContainElement(screen.getByText("item"));
    expect(section).toHaveAttribute("data-slot", "date-section");
  });
});
