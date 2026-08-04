import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { FeatureCardRow, type FeatureCardRowItem } from "./feature-card-row";

const cardCount = () => document.querySelectorAll('[data-slot="feature-card-row-card"]').length;

describe("FeatureCardRow", () => {
  it("renders the icon-title-desc state", async () => {
    const onSelect = vi.fn();
    const items: FeatureCardRowItem[] = [
      {
        id: "script",
        icon: <span>ICON</span>,
        title: "Write a script",
        description: "Generate a first draft from a one-line prompt.",
        onSelect,
      },
      { id: "voice", icon: <span>VOICE</span>, title: "Clone a voice" },
    ];
    render(<FeatureCardRow items={items} />);

    expect(cardCount()).toBe(2);
    expect(document.querySelector('[data-slot="entity-row-title"]')!.textContent).toBe(
      "Write a script",
    );
    expect(document.querySelector('[data-slot="entity-row-description"]')!.textContent).toBe(
      "Generate a first draft from a one-line prompt.",
    );
    expect(screen.getByText("ICON")).toBeInTheDocument();
    // Card acts as a button: discernible name comes from its visible text content.
    await userEvent.click(screen.getByRole("button", { name: /Write a script/ }));
    expect(onSelect).toHaveBeenCalledOnce();
  });

  it("renders the with-thumbnail state", () => {
    const items: FeatureCardRowItem[] = [
      {
        id: "templates",
        thumbnail: { src: "/thumbnails/templates.png", alt: "Grid of starter templates" },
        title: "Explore templates",
      },
    ];
    render(<FeatureCardRow items={items} />);

    const thumbnail = screen.getByAltText("Grid of starter templates");
    expect(thumbnail.tagName).toBe("IMG");
    expect(thumbnail).toHaveAttribute("src", "/thumbnails/templates.png");
    // Thumbnail cards carry no icon slot — the media is the leading visual.
    expect(document.querySelector('[data-slot="entity-row-icon"]')).not.toBeInTheDocument();
  });

  it("renders the horizontal-scroll state as a keyboard-reachable region with a visible next affordance", () => {
    const items: FeatureCardRowItem[] = Array.from({ length: 8 }, (_, index) => ({
      id: `feature-${index}`,
      title: `Feature ${index}`,
    }));
    render(<FeatureCardRow items={items} />);

    const region = document.querySelector('[data-slot="feature-card-row"]')!;
    // role="region" (from Carousel) is what makes the scrollable row
    // reachable by assistive tech, satisfying axe's scrollable-region-focusable.
    expect(region).toHaveAttribute("role", "region");
    expect(screen.getByRole("button", { name: /previous slide/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /next slide/i })).toBeInTheDocument();
    expect(cardCount()).toBe(8);
  });

  it("passes className through", () => {
    render(<FeatureCardRow items={[]} className="test-class" />);
    expect(document.querySelector('[data-slot="feature-card-row"]')!.className).toContain(
      "test-class",
    );
  });
});
