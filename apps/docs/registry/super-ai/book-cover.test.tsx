import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BookCover } from "./book-cover";

const slot = (name: string) => document.querySelector(`[data-slot="book-cover-${name}"]`);

describe("BookCover", () => {
  it("renders the plain state as a real heading, not styled text", () => {
    // The whole semantic budget of this component is the title. A grid of
    // covers has to announce as a list of titles or it announces as nothing.
    render(<BookCover title="Brand guidelines" />);
    const heading = screen.getByRole("heading", { name: "Brand guidelines" });
    expect(heading.tagName).toBe("H3");
    expect(slot("stripe")).not.toBeInTheDocument();
    expect(slot("illustration")).not.toBeInTheDocument();
  });

  it("renders the stripe state as decoration beside the title", () => {
    render(<BookCover title="API reference" variant="stripe" />);
    expect(slot("stripe")).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByRole("heading", { name: "API reference" })).toBeInTheDocument();
  });

  it("renders the illustrated state, and falls back to plain with nothing to illustrate", () => {
    render(<BookCover title="Onboarding templates" variant="illustrated" illustration={<svg />} />);
    expect(slot("illustration")).toHaveAttribute("aria-hidden", "true");

    // An empty well where a picture is implied is worse than no well.
    render(<BookCover title="Onboarding templates" variant="illustrated" />);
    expect(document.querySelectorAll('[data-slot="book-cover-illustration"]')).toHaveLength(1);
  });

  it("renders the textured state from the border token alone", () => {
    const { container } = render(<BookCover title="Style guide" textured />);
    const texture = container.querySelector('[style*="repeating-linear-gradient"]')!;
    expect(texture).toHaveAttribute("aria-hidden", "true");
    // No colour of its own means it cannot drift from the palette.
    expect(texture.getAttribute("style")).toContain("var(--border)");
  });

  it("renders the tone state as three distinct surfaces", () => {
    // Tone is a surface, so the painted class is the only observable. What is
    // pinned is that the three do not collapse into one another.
    const faces = (["paper", "ink", "muted"] as const).map((tone) => {
      const { container, unmount } = render(<BookCover title="Field notes" tone={tone} />);
      const className = container.querySelector('[data-slot="book-cover-face"]')!.className;
      unmount();
      return className;
    });
    expect(new Set(faces).size).toBe(3);
  });

  it("puts the title at the heading level the caller asked for", () => {
    render(<BookCover title="Source collection" headingLevel={2} />);
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("Source collection");
  });

  it("hides every decorative part, including a supplied icon", () => {
    render(<BookCover title="Changelog" variant="stripe" icon={<svg />} illustration={<svg />} textured />);
    for (const name of ["spine", "stripe", "icon"]) {
      expect(slot(name)).toHaveAttribute("aria-hidden", "true");
    }
  });

  it("adds no tab stop — the focus ring belongs to whatever link wraps it", () => {
    const { container } = render(<BookCover title="Design tokens" />);
    expect(container.querySelectorAll("a, button, input, [tabindex]")).toHaveLength(0);
  });

  it("fills its container when no width is given, and hugs its face when one is", () => {
    const { unmount } = render(<BookCover title="Runbook" />);
    expect(slot("face")!.className).toContain("w-full");
    expect(document.querySelector('[data-slot="book-cover"]')!.className).toContain("w-full");
    unmount();

    // The wrapper carries no width of its own, so as a flex item it shrinks
    // below the face and the px-sized face overflows onto its neighbours. The
    // first render of the docs demo showed three covers stacked on top of each
    // other; `w-fit shrink-0` is what makes `width` mean what it says.
    render(<BookCover title="Runbook" width={140} />);
    const wrapper = document.querySelector('[data-slot="book-cover"]')!;
    expect(wrapper.className).toContain("w-fit");
    expect(wrapper.className).toContain("shrink-0");

    // And the wrapper must never become a query container itself:
    // `container-type: inline-size` blocks content-based sizing, so `w-fit`
    // would measure 0 and the overlap returns. This is the assertion that
    // stops someone "fixing" the two-element shape back in.
    expect(wrapper.className).not.toContain("@container");
  });

  it("resolves width against its own container, and inherits unspecified rungs", () => {
    // D19: a cover in a 300px sidebar and one in a full-width grid resolve
    // independently, so the rungs are container queries, not viewport ones.
    const { container: fixed, unmount } = render(<BookCover title="Runbook" width={196} />);
    const fixedStyle = fixed.querySelector('[data-slot="book-cover"]')!.getAttribute("style")!;
    expect(fixedStyle).toContain("--book-cover-w: 196px");
    expect(fixedStyle).toContain("--book-cover-w-lg: 196px");
    unmount();

    // `{ sm, lg }` holds sm through the middle rung rather than collapsing.
    render(<BookCover title="Runbook" width={{ sm: 150, lg: 240 }} />);
    const style = document.querySelector('[data-slot="book-cover"]')!.getAttribute("style")!;
    expect(style).toContain("--book-cover-w: 150px");
    expect(style).toContain("--book-cover-w-md: 150px");
    expect(style).toContain("--book-cover-w-lg: 240px");
    expect(slot("face")!.className).toContain("@[40rem]:w-(--book-cover-w-lg)");
  });

  it("passes className through", () => {
    render(<BookCover title="Runbook" className="test-class" />);
    expect(document.querySelector('[data-slot="book-cover"]')!.className).toContain("test-class");
  });
});
