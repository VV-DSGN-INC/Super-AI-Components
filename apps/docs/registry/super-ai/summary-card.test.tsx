import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SummaryCard, type SummaryPoint, type SummaryQuote, type SummaryScope } from "./summary-card";

const SCOPE: SummaryScope = {
  kind: "document",
  title: "leave-policy-emea.docx",
  href: "/files/leave-policy-emea",
};

const POINTS: SummaryPoint[] = [
  { id: "a", text: "Parental leave is 16 weeks at full pay.", citations: [1] },
  { id: "b", text: "The first four weeks are taken in one block.", citations: [1, 2] },
  { id: "c", text: "Contractors are not covered." },
];

const QUOTES: SummaryQuote[] = [
  { id: "q1", text: "Eligible employees receive 16 weeks of parental leave.", locator: "Section 2.1" },
  { id: "q2", text: "The initial block is continuous.", locator: "Section 2.3" },
];

const root = () => document.querySelector('[data-slot="summary-card"]')!;

describe("SummaryCard", () => {
  it("renders the generating state as a polite pending status, not an empty card", () => {
    render(<SummaryCard scope={SCOPE} state="generating" />);
    expect(screen.getByRole("status")).toHaveTextContent("Summarizing the document");
    expect(root().getAttribute("data-state")).toBe("generating");
    expect(document.querySelector('[data-slot="summary-card-point"]')).toBeNull();
  });

  it("renders the ready state with the AI label and the scope stated in text", () => {
    render(<SummaryCard scope={SCOPE} points={POINTS} />);
    expect(screen.getByRole("note", { name: "Summarized by AI" })).toBeInTheDocument();
    expect(root()).toHaveTextContent("Summary of the document leave-policy-emea.docx");
    expect(screen.getAllByText(/Parental leave|first four|Contractors/)).toHaveLength(3);
  });

  it("links back to the source when href is given, and states it plainly when not", () => {
    const { rerender } = render(<SummaryCard scope={SCOPE} points={POINTS} />);
    expect(screen.getByRole("link", { name: "leave-policy-emea.docx" })).toHaveAttribute(
      "href",
      "/files/leave-policy-emea",
    );
    rerender(<SummaryCard scope={{ kind: "thread", title: "Launch planning" }} points={POINTS} />);
    expect(screen.queryByRole("link")).toBeNull();
    expect(root()).toHaveTextContent("Summary of the thread Launch planning");
  });

  it("renders the attributed state with host markers at the end of each cited point", () => {
    render(
      <SummaryCard
        scope={SCOPE}
        state="attributed"
        points={POINTS}
        renderCitation={(index) => <button type="button">{`Source ${index}`}</button>}
      />,
    );
    const points = document.querySelectorAll('[data-slot="summary-card-point"]');
    expect(points[0].querySelectorAll("button")).toHaveLength(1);
    expect(points[1].querySelectorAll("button")).toHaveLength(2);
    expect(points[2].querySelectorAll("button")).toHaveLength(0);
    // The marker follows the text it supports, never precedes it.
    expect(points[0].textContent).toBe("Parental leave is 16 weeks at full pay.Source 1");
  });

  it("falls back to a plain numbered marker and shows none outside the attributed state", () => {
    const { rerender } = render(<SummaryCard scope={SCOPE} state="attributed" points={POINTS} />);
    expect(screen.getAllByText("[1]")).toHaveLength(2);
    rerender(<SummaryCard scope={SCOPE} state="ready" points={POINTS} />);
    expect(screen.queryByText("[1]")).toBeNull();
  });

  it("renders the quote-and-condense state as verbatim quotations with framing", () => {
    render(<SummaryCard scope={SCOPE} state="quote-and-condense" quotes={QUOTES} />);
    expect(screen.getByText(/quoted word for word/)).toBeInTheDocument();
    const quotes = document.querySelectorAll("blockquote");
    expect(quotes).toHaveLength(2);
    expect(quotes[0].textContent).toBe("“Eligible employees receive 16 weeks of parental leave.”");
    expect(screen.getByText("Section 2.3")).toBeInTheDocument();
  });

  it("renders the collapsed state as the first point with an expand control", async () => {
    const user = userEvent.setup();
    const onExpandedChange = vi.fn();
    render(
      <SummaryCard scope={SCOPE} state="collapsed" points={POINTS} onExpandedChange={onExpandedChange} />,
    );
    expect(document.querySelectorAll('[data-slot="summary-card-point"]')).toHaveLength(1);
    const toggle = screen.getByRole("button", { name: "Show full summary" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("group", { name: "Summary depth" })).toBeNull();

    await user.click(toggle);
    expect(onExpandedChange).toHaveBeenCalledWith(true);
    expect(document.querySelectorAll('[data-slot="summary-card-point"]')).toHaveLength(3);
    expect(screen.getByRole("button", { name: "Show less" })).toHaveAttribute("aria-expanded", "true");
  });

  it("renders the turned-off state as a card that says so, with a turn-on action", async () => {
    const user = userEvent.setup();
    const onTurnOn = vi.fn();
    render(<SummaryCard scope={SCOPE} state="turned-off" onTurnOn={onTurnOn} />);
    expect(root()).toHaveTextContent("Automatic summaries are off");
    expect(screen.queryByRole("note")).toBeNull();
    expect(screen.queryByRole("group", { name: "Summary depth" })).toBeNull();
    await user.click(screen.getByRole("button", { name: "Turn on summaries" }));
    expect(onTurnOn).toHaveBeenCalledTimes(1);
  });

  it("asks the host to regenerate when the depth changes, and ignores un-pressing", async () => {
    const user = userEvent.setup();
    const onDepthChange = vi.fn();
    render(<SummaryCard scope={SCOPE} points={POINTS} depth="short" onDepthChange={onDepthChange} />);
    const group = screen.getByRole("group", { name: "Summary depth" });
    expect(group).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Short" })).toHaveAttribute("aria-pressed", "true");

    await user.click(screen.getByRole("button", { name: "Key points" }));
    expect(onDepthChange).toHaveBeenCalledWith("key-points");

    await user.click(screen.getByRole("button", { name: "Short" }));
    expect(onDepthChange).toHaveBeenCalledTimes(1);
    // The card does not hold the depth: with no new prop it stays on short.
    expect(screen.getByRole("button", { name: "Short" })).toHaveAttribute("aria-pressed", "true");
  });

  it("renders key-points as a list and the other depths as paragraphs", () => {
    const { rerender } = render(<SummaryCard scope={SCOPE} points={POINTS} depth="key-points" />);
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
    rerender(<SummaryCard scope={SCOPE} points={POINTS} depth="detailed" />);
    expect(screen.queryByRole("list")).toBeNull();
    expect(root().getAttribute("data-depth")).toBe("detailed");
  });

  it("offers turn-off only when the host handles it", async () => {
    const user = userEvent.setup();
    const onTurnOff = vi.fn();
    const { rerender } = render(<SummaryCard scope={SCOPE} points={POINTS} />);
    expect(screen.queryByRole("button", { name: "Turn off summaries" })).toBeNull();
    rerender(<SummaryCard scope={SCOPE} points={POINTS} onTurnOff={onTurnOff} />);
    await user.click(screen.getByRole("button", { name: "Turn off summaries" }));
    expect(onTurnOff).toHaveBeenCalledTimes(1);
  });

  it("is a named group labelled by the scope sentence", () => {
    render(<SummaryCard scope={SCOPE} points={POINTS} />);
    expect(screen.getByRole("group", { name: /Summary of the document leave-policy-emea\.docx/ })).toBe(
      root(),
    );
  });

  it("passes className through", () => {
    render(<SummaryCard scope={SCOPE} className="test-class" />);
    expect(root().className).toContain("test-class");
  });
});
