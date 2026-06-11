import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PortChips } from "./port-chip";

describe("PortChips", () => {
  it("renders IN and OUT rows with one chip per port", () => {
    render(<PortChips in={["text", "image"]} out={["video"]} />);
    expect(screen.getByText("IN").parentElement?.querySelectorAll("[data-slot=port-chip]")).toHaveLength(2);
    expect(screen.getByText("OUT").parentElement?.querySelectorAll("[data-slot=port-chip]")).toHaveLength(1);
    expect(screen.getByText("Video")).toBeInTheDocument();
  });
  it("marks satisfied ports", () => {
    render(<PortChips in={["text"]} satisfied={["text"]} />);
    expect(screen.getByText("Text").closest("[data-slot=port-chip]")).toHaveAttribute(
      "data-satisfied",
      "true",
    );
  });
});
