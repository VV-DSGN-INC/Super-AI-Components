import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AnswerBlock, coverageOf, type AnswerClaim } from "./answer-block";

const cited = (id: string): AnswerClaim => ({
  id,
  text: `Claim ${id}.`,
  citations: [{ id: `${id}-c`, label: "1", source: "Policy.pdf" }],
});
const bare = (id: string): AnswerClaim => ({ id, text: `Claim ${id}.` });

describe("AnswerBlock", () => {
  it("treats a partially-cited answer as its own state, not as cited", () => {
    expect(coverageOf([cited("a"), cited("b")])).toBe("cited");
    expect(coverageOf([cited("a"), bare("b")])).toBe("partially-cited");
    expect(coverageOf([bare("a"), bare("b")])).toBe("uncited");
  });

  it("warns when only some claims are sourced", () => {
    render(<AnswerBlock claims={[cited("a"), bare("b")]} />);
    expect(document.querySelector('[data-slot="answer-block"]')!.getAttribute("data-coverage")).toBe(
      "partially-cited",
    );
    expect(screen.getByText(/aren't sourced/)).toBeInTheDocument();
  });

  it("warns harder when nothing is sourced", () => {
    render(<AnswerBlock claims={[bare("a")]} />);
    expect(screen.getByText(/Nothing in this answer is sourced/)).toBeInTheDocument();
  });

  it("stays quiet when every claim is sourced", () => {
    render(<AnswerBlock claims={[cited("a"), cited("b")]} />);
    expect(document.querySelector('[data-slot="answer-block-coverage-warning"]')).toBeNull();
  });

  it("surfaces retrieved-but-unused sources — the gap is the informative part", () => {
    render(<AnswerBlock claims={[cited("a")]} retrievedUnused={3} />);
    expect(screen.getByText(/3 retrieved sources were not used/)).toBeInTheDocument();
  });

  it("holds citations off the in-flight claim while streaming", () => {
    // A citation rendering before the text it supports reads as a load failure.
    render(<AnswerBlock claims={[cited("a"), cited("b")]} streaming />);
    const claims = document.querySelectorAll('[data-slot="answer-block-claim"]');
    expect(claims[0].hasAttribute("data-settled")).toBe(true);
    expect(claims[1].hasAttribute("data-settled")).toBe(false);
    expect(document.querySelectorAll('[data-slot="citation-ref"]')).toHaveLength(1);
  });

  it("does not nag about coverage mid-stream", () => {
    render(<AnswerBlock claims={[bare("a")]} streaming retrievedUnused={2} />);
    expect(document.querySelector('[data-slot="answer-block-coverage-warning"]')).toBeNull();
    expect(document.querySelector('[data-slot="answer-block-unused"]')).toBeNull();
  });
});
