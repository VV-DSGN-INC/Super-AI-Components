import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SourceCards, type RetrievedSource } from "./source-cards";

const SOURCES: RetrievedSource[] = [
  { id: "a", title: "Benefits policy 2026", used: true, relevance: "high" },
  { id: "b", title: "Vendor handbook", used: false, relevance: "low" },
  { id: "c", title: "Plan summary", used: true, relevance: "medium" },
];

describe("SourceCards", () => {
  it("shows retrieved-but-unused sources rather than hiding them", () => {
    // Showing only cited sources conceals the retrieval failure mode.
    render(<SourceCards sources={SOURCES} />);
    expect(screen.getByText("Vendor handbook")).toBeInTheDocument();
    expect(screen.getByText("Retrieved, not used")).toBeInTheDocument();
    expect(screen.getAllByText("Cited")).toHaveLength(2);
  });

  it("orders cited sources ahead of merely retrieved ones", () => {
    render(<SourceCards sources={SOURCES} />);
    const used = Array.from(document.querySelectorAll('[data-slot="source-cards-item"]')).map((el) =>
      el.hasAttribute("data-used"),
    );
    expect(used).toEqual([true, true, false]);
  });

  it("bands relevance instead of showing a raw score", () => {
    render(<SourceCards sources={SOURCES} />);
    expect(screen.getByText("Strong match")).toBeInTheDocument();
    expect(screen.getByText("Weak match")).toBeInTheDocument();
    expect(screen.queryByText(/0\.\d/)).not.toBeInTheDocument();
  });

  it("names permission-filtered sources without leaking their titles", () => {
    render(<SourceCards sources={SOURCES} permissionFilteredCount={3} />);
    const note = document.querySelector('[data-slot="source-cards-permission-filtered"]')!;
    expect(note.textContent).toContain("3 sources excluded");
    expect(note.textContent).not.toContain("Benefits");
  });

  it("distinguishes a search that found nothing from one that has not run", () => {
    const ran = render(<SourceCards sources={[]} />);
    expect(screen.getByText(/isn't grounded in a document/)).toBeInTheDocument();
    ran.unmount();

    render(<SourceCards sources={[]} hasRun={false} />);
    expect(screen.getByText(/once a search runs/)).toBeInTheDocument();
  });
});
