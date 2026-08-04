import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { QuoteReply } from "./quote-reply";

describe("QuoteReply", () => {
  it("renders the text-range state", () => {
    render(<QuoteReply source="text-range" excerpt="the quick brown fox" anchor="¶3" />);
    const root = document.querySelector('[data-slot="quote-reply"]')!;
    expect(root.getAttribute("data-source")).toBe("text-range");
    const blockquote = root.querySelector("blockquote")!;
    expect(blockquote.textContent).toContain("the quick brown fox");
    expect(screen.getByText(/Text ·/)).toBeInTheDocument();
    expect(screen.getByText(/¶3/)).toBeInTheDocument();
  });

  it("renders the image-region state", () => {
    render(
      <QuoteReply
        source="image-region"
        excerpt="cropped hero shot"
        anchor="120,64 · 240×180"
        thumbnail={<img src="/thumb.png" alt="cropped hero shot" />}
      />,
    );
    const root = document.querySelector('[data-slot="quote-reply"]')!;
    expect(root.getAttribute("data-source")).toBe("image-region");
    // The thumbnail renders through preview-tile; the excerpt still shows up
    // as a readable caption rather than being hidden inside alt text alone.
    expect(screen.getByRole("img", { name: "cropped hero shot" })).toBeInTheDocument();
    expect(screen.getByText("cropped hero shot")).toBeInTheDocument();
    expect(screen.getByText(/Image ·/)).toBeInTheDocument();
  });

  it("falls back to text when image-region has no thumbnail yet", () => {
    render(<QuoteReply source="image-region" excerpt="cropped hero shot" anchor="120,64 · 240×180" />);
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByText("cropped hero shot")).toBeInTheDocument();
  });

  it("renders the table-cell state", () => {
    render(<QuoteReply source="table-cell" excerpt="$42,000" anchor="Sheet1!B4" />);
    const root = document.querySelector('[data-slot="quote-reply"]')!;
    expect(root.getAttribute("data-source")).toBe("table-cell");
    expect(screen.getByText("$42,000")).toBeInTheDocument();
    expect(screen.getByText(/Table cell ·/)).toBeInTheDocument();
    expect(screen.getByText(/Sheet1!B4/)).toBeInTheDocument();
  });

  it("renders the timeline-range state", () => {
    render(<QuoteReply source="timeline-range" excerpt="so what we're seeing here is" anchor="0:12–0:34" />);
    const root = document.querySelector('[data-slot="quote-reply"]')!;
    expect(root.getAttribute("data-source")).toBe("timeline-range");
    expect(screen.getByText("so what we're seeing here is")).toBeInTheDocument();
    expect(screen.getByText(/Timeline ·/)).toBeInTheDocument();
    expect(screen.getByText(/0:12–0:34/)).toBeInTheDocument();
  });

  it("removes the quote independently of any typed message via an accessibly-named control", async () => {
    const onRemove = vi.fn();
    render(<QuoteReply source="text-range" excerpt="quoted text" anchor="¶1" onRemove={onRemove} />);
    const button = screen.getByRole("button", { name: "Remove quote" });
    await userEvent.click(button);
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it("omits the remove control when onRemove is not provided", () => {
    render(<QuoteReply source="text-range" excerpt="quoted text" anchor="¶1" />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("passes className through", () => {
    render(<QuoteReply source="text-range" excerpt="quoted text" anchor="¶1" className="test-class" />);
    expect(document.querySelector('[data-slot="quote-reply"]')!.className).toContain("test-class");
  });
});
