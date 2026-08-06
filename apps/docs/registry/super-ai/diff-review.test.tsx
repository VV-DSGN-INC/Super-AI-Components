import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type * as React from "react";
import { describe, expect, it, vi } from "vitest";

import { DiffReview, type DiffChange, type DiffParagraph } from "./diff-review";

/**
 * One paragraph, one replacement, one insertion — deliberately a *run* of
 * segments rather than a pair of lines, because that distinction is the spec.
 */
const paragraphs: DiffParagraph[] = [
  {
    id: "p1",
    segments: [
      { kind: "unchanged", text: "The team will " },
      { kind: "deleted", text: "utilise", changeId: "c1" },
      { kind: "inserted", text: "use", changeId: "c1" },
      { kind: "unchanged", text: " the new export API" },
      { kind: "inserted", text: " from Monday", changeId: "c2" },
      { kind: "unchanged", text: "." },
    ],
  },
];

const changes: DiffChange[] = [
  { id: "c1", rationale: "Plain English reads faster in release notes." },
  { id: "c2", rationale: "The launch date was missing, so readers had to ask." },
];

const renderReview = (props: Partial<React.ComponentProps<typeof DiffReview>> = {}) =>
  render(<DiffReview paragraphs={paragraphs} changes={changes} {...props} />);

describe("DiffReview", () => {
  it("renders the word-level state", () => {
    const { container } = renderReview();

    // One paragraph element, not one element per "line".
    const paragraphEls = container.querySelectorAll('[data-slot="diff-review-paragraph"]');
    expect(paragraphEls).toHaveLength(1);

    const paragraph = paragraphEls[0];
    // Changed and unchanged words share the paragraph: the diff is inside the
    // prose flow, not stacked above and below it.
    expect(paragraph.querySelector("del")).toHaveTextContent("utilise");
    expect(paragraph.querySelector("ins")).toHaveTextContent("use");
    expect(paragraph.querySelectorAll('[data-slot="diff-review-segment"]')).toHaveLength(6);

    // The load-bearing one: a line diff would print the untouched words twice,
    // once in the removed line and once in the added line.
    expect(paragraph.textContent!.match(/the new export API/g)).toHaveLength(1);
    expect(paragraph.textContent!.match(/The team will/g)).toHaveLength(1);
  });

  it("renders the per-change-verbs state", async () => {
    const onAccept = vi.fn();
    const onReject = vi.fn();
    renderReview({ onAccept, onReject });

    // Named for the change, not "Accept" repeated N times.
    const acceptFirst = screen.getByRole("button", { name: /accept: replace .*utilise.*use/i });
    const acceptSecond = screen.getByRole("button", { name: /accept: insert .*from Monday/i });
    expect(acceptFirst).not.toBe(acceptSecond);
    expect(screen.getByRole("button", { name: /reject: replace .*utilise/i })).toBeInTheDocument();

    await userEvent.click(acceptSecond);
    expect(onAccept).toHaveBeenCalledWith("c2");
    await userEvent.click(screen.getByRole("button", { name: /reject: replace .*utilise/i }));
    expect(onReject).toHaveBeenCalledWith("c1");
  });

  it("renders the bulk-verbs state", () => {
    const { container } = renderReview({
      onAccept: () => {},
      onReject: () => {},
      onAcceptAll: () => {},
      onRejectAll: () => {},
    });

    const bulk = container.querySelector('[data-slot="diff-review-bulk"]');
    expect(bulk).toBeInTheDocument();
    expect(bulk).toHaveAttribute("role", "group");

    // Structurally apart: the whole-document verbs are not inside the list of
    // per-change verbs, so a stray click cannot resolve the document.
    const changeList = container.querySelector('[data-slot="diff-review-changes"]')!;
    expect(changeList.contains(bulk)).toBe(false);
    for (const name of [/accept all changes/i, /reject all changes/i]) {
      const button = screen.getByRole("button", { name });
      expect(changeList.contains(button)).toBe(false);
      expect(bulk!.contains(button)).toBe(true);
    }
  });

  it("passes className through", () => {
    render(<DiffReview paragraphs={paragraphs} changes={changes} className="test-class" />);
    expect(document.querySelector('[data-slot="diff-review"]')!.className).toContain("test-class");
  });

  // ---------------------------------------------------------------------------
  // Load-bearing assertions
  // ---------------------------------------------------------------------------

  it("requires a rationale on every change and always renders it", () => {
    const { container } = renderReview();

    const rationales = container.querySelectorAll('[data-slot="diff-review-rationale"]');
    expect(rationales).toHaveLength(changes.length);
    expect(screen.getByText("Plain English reads faster in release notes.")).toBeVisible();
    expect(screen.getByText("The launch date was missing, so readers had to ask.")).toBeVisible();

    // And it is a slot, not a tooltip: no hover, no title attribute, no
    // disclosure stands between the reader and the reason.
    for (const rationale of rationales) {
      expect(rationale).not.toHaveAttribute("title");
      expect(rationale.closest("[hidden]")).toBeNull();
    }

    // @ts-expect-error — rationale is required; a change without one cannot be
    // constructed. This line is the compile-time half of the rule and fails
    // `pnpm typecheck` if `rationale` ever becomes optional.
    const unexplained: DiffChange = { id: "c3" };
    expect(unexplained.id).toBe("c3");
  });

  it("distinguishes insertion from deletion without relying on colour", () => {
    const { container } = renderReview();

    const inserted = container.querySelector('[data-kind="inserted"]')!;
    const deleted = container.querySelector('[data-kind="deleted"]')!;

    // 1. Real semantics, carried by the element itself.
    expect(inserted.tagName).toBe("INS");
    expect(deleted.tagName).toBe("DEL");

    // 2. Named in words for anyone who cannot see the styling at all.
    expect(inserted).toHaveTextContent(/insertion start/i);
    expect(inserted).toHaveTextContent(/insertion end/i);
    expect(deleted).toHaveTextContent(/deletion start/i);
    expect(deleted).toHaveTextContent(/deletion end/i);

    // 3. Shape, not hue: strike-through vs. underline survives greyscale.
    expect(deleted.className).toContain("line-through");
    expect(inserted.className).toContain("underline");
    expect(inserted.className).not.toContain("line-through");
  });

  it("puts no interactive control inside the prose", () => {
    const { container } = renderReview({ onAccept: () => {}, onReject: () => {} });

    const doc = container.querySelector('[data-slot="diff-review-document"]')!;
    expect(doc.querySelectorAll("button, a, input, [tabindex]")).toHaveLength(0);

    // ...and no verb is nested inside another interactive element either.
    for (const button of screen.getAllByRole("button")) {
      expect(button.parentElement!.closest("button")).toBeNull();
    }
  });

  it("applies a resolved change to the prose instead of annotating it", () => {
    const { container } = render(
      <DiffReview
        paragraphs={paragraphs}
        changes={[{ ...changes[0], status: "accepted" }, { ...changes[1], status: "rejected" }]}
      />,
    );

    const paragraph = container.querySelector('[data-slot="diff-review-paragraph"]')!;
    // Accepted: the replacement stands, the old word is gone.
    expect(paragraph.textContent).toContain("use");
    expect(paragraph.textContent).not.toContain("utilise");
    // Rejected: the insertion never lands.
    expect(paragraph.textContent).not.toContain("from Monday");
    // Nothing is left marked up once every change is resolved.
    expect(paragraph.querySelector("ins")).toBeNull();
    expect(paragraph.querySelector("del")).toBeNull();

    // The outcome is stated in words, and the verbs are withdrawn.
    const rows = container.querySelectorAll('[data-slot="diff-review-change"]');
    expect(rows[0]).toHaveAttribute("data-status", "accepted");
    expect(rows[0]).toHaveTextContent("Accepted");
    expect(rows[1]).toHaveTextContent("Rejected");
    expect(screen.queryByRole("button", { name: /^accept:/i })).not.toBeInTheDocument();
  });

  it("announces how many changes are left", () => {
    const { rerender } = renderReview();
    expect(screen.getByRole("status")).toHaveTextContent("2 of 2 changes awaiting review");

    rerender(
      <DiffReview paragraphs={paragraphs} changes={[{ ...changes[0], status: "accepted" }, changes[1]]} />,
    );
    expect(screen.getByRole("status")).toHaveTextContent("1 of 2 changes awaiting review");

    rerender(
      <DiffReview
        paragraphs={paragraphs}
        changes={changes.map((change) => ({ ...change, status: "accepted" as const }))}
      />,
    );
    expect(screen.getByRole("status")).toHaveTextContent("All 2 changes resolved");
  });

  it("disables the bulk verbs once nothing is pending", () => {
    render(
      <DiffReview
        paragraphs={paragraphs}
        changes={changes.map((change) => ({ ...change, status: "rejected" as const }))}
        onAcceptAll={() => {}}
        onRejectAll={() => {}}
      />,
    );
    expect(screen.getByRole("button", { name: /accept all changes/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /reject all changes/i })).toBeDisabled();
  });

  it("renders only the verbs it was given handlers for", () => {
    const { container } = renderReview();
    expect(container.querySelector('[data-slot="diff-review-change-verbs"]')).toBeNull();
    expect(container.querySelector('[data-slot="diff-review-bulk"]')).toBeNull();
    // The diff and its rationales still render read-only.
    expect(container.querySelectorAll('[data-slot="diff-review-rationale"]')).toHaveLength(2);
  });

  it("derives each change's description from its own segments", () => {
    renderReview({ onAccept: () => {} });
    // A pure deletion reads as a deletion, not as a replacement.
    render(
      <DiffReview
        paragraphs={[
          {
            id: "p2",
            segments: [
              { kind: "unchanged", text: "It was " },
              { kind: "deleted", text: "very ", changeId: "d1" },
              { kind: "unchanged", text: "clear." },
            ],
          },
        ]}
        changes={[{ id: "d1", rationale: "Intensifiers weaken the sentence." }]}
        onAccept={() => {}}
      />,
    );
    expect(screen.getByRole("button", { name: /accept: delete .*very/i })).toBeInTheDocument();
  });
});
