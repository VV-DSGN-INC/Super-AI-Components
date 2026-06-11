import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MediaSlot } from "./media-slot";

describe("MediaSlot", () => {
  it("empty state copy follows the convention", () => {
    render(<MediaSlot kind="audio" status="idle" />);
    expect(screen.getByText("Your audio will appear here")).toBeInTheDocument();
  });
  it("streaming shows shimmer", () => {
    render(<MediaSlot kind="image" status="streaming" />);
    expect(
      document.querySelector("[data-slot=media-slot][data-status=streaming] [data-shimmer]"),
    ).toBeTruthy();
  });
  it("renders image output", () => {
    render(<MediaSlot kind="image" status="done" src="/x.png" alt="result" />);
    expect(screen.getByAltText("result")).toHaveAttribute("src", "/x.png");
  });
  it("video kind uses generation copy", () => {
    render(<MediaSlot kind="video" status="idle" />);
    expect(screen.getByText("Your generation will appear here")).toBeInTheDocument();
  });
  it("emptyText override renders custom string", () => {
    render(<MediaSlot kind="image" status="idle" emptyText="Drop image here" />);
    expect(screen.getByText("Drop image here")).toBeInTheDocument();
  });
  it("failed renders the unified Failed fallback", () => {
    render(<MediaSlot kind="image" status="failed" />);
    expect(screen.getByText("Failed")).toBeInTheDocument();
  });
  it("audio + streaming shows shimmer AND the audio empty copy", () => {
    render(<MediaSlot kind="audio" status="streaming" />);
    expect(
      document.querySelector("[data-slot=media-slot][data-status=streaming] [data-shimmer]"),
    ).toBeTruthy();
    expect(screen.getByText("Your audio will appear here")).toBeInTheDocument();
  });
});
