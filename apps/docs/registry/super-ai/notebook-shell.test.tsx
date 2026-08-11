import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { NotebookShell, type NotebookShellProps } from "./notebook-shell";

const REGIONS = ["sources", "chat", "composer", "studio-outputs"];

const SOURCES: NotebookShellProps["sources"] = [
  { id: "s1", name: "Q3-report.pdf", meta: "PDF · 2.4 MB", stage: "ready", chunkCount: 184 },
  { id: "s2", name: "kickoff-call.txt", meta: "Transcript", stage: "failed", errorMessage: "Embedding timed out" },
];

const GROUNDED: NotebookShellProps["messages"] = [
  {
    id: "m1",
    role: "assistant",
    claims: [
      { id: "c1", text: "Revenue grew 12% quarter over quarter.", citations: [{ id: "x1", label: "1", sourceId: "s1" }] },
    ],
  },
];

const OUTPUT_TYPES: NotebookShellProps["outputTypes"] = [
  { id: "audio", title: "Audio Overview", description: "Two hosts discuss your sources." },
  { id: "mindmap", title: "Mind Map", description: "The shape of what you uploaded." },
];

describe("NotebookShell", () => {
  it.each(REGIONS)("renders the %s region", (region) => {
    const { container } = render(<NotebookShell />);
    expect(container.querySelector(`[data-region="${region}"]`)).not.toBeNull();
  });

  it("passes className through", () => {
    render(<NotebookShell className="test-class" />);
    expect(document.querySelector('[data-slot="notebook-shell"]')!.className).toContain("test-class");
  });

  // "Three panes, each independently empty-able. On first load all three are
  // empty at once — the case that turned the empty contract into a contract."
  // This is the load-bearing sentence of the whole block: not one empty pane
  // beside two populated ones, but three L1s on screen simultaneously.
  it("shows three independent empty states on first load", () => {
    const { container } = render(<NotebookShell />);
    for (const region of ["sources", "chat", "studio-outputs"]) {
      const pane = container.querySelector(`[data-region="${region}"]`)!;
      expect(pane.querySelector('[data-slot="empty-state"]')).not.toBeNull();
    }
    expect(document.querySelectorAll('[data-slot="empty-state"]')).toHaveLength(3);
  });

  it("empties each pane independently of the other two", () => {
    const { container } = render(
      <NotebookShell
        sources={SOURCES}
        messages={[{ id: "m1", role: "user", content: "What changed in Q3?" }]}
      />,
    );
    // Sources and chat are filled; the studio is still empty, and says so.
    expect(container.querySelector('[data-region="sources"] [data-slot="empty-state"]')).toBeNull();
    expect(container.querySelector('[data-region="chat"] [data-slot="empty-state"]')).toBeNull();
    expect(
      container.querySelector('[data-region="studio-outputs"] [data-slot="empty-state"]'),
    ).not.toBeNull();
  });

  // Every pane is mounted whether or not it has anything in it — a region that
  // appears from nowhere cannot teach that it exists.
  it("keeps every region mounted when populated", () => {
    const { container } = render(
      <NotebookShell sources={SOURCES} messages={GROUNDED} outputTypes={OUTPUT_TYPES} />,
    );
    for (const region of REGIONS) {
      expect(container.querySelector(`[data-region="${region}"]`)).not.toBeNull();
    }
  });

  it("composes K5 source-panel rows rather than rendering its own", () => {
    const { container } = render(<NotebookShell sources={SOURCES} />);
    const pane = container.querySelector('[data-region="sources"]')!;
    expect(pane.querySelectorAll('[data-slot="source-panel-item"]')).toHaveLength(2);
    // K5's own per-source stage badge, not a shell-drawn one.
    expect(within(pane as HTMLElement).getAllByText("Ready")).toHaveLength(1);
  });

  it("retries a failed source through K5's own per-row control", async () => {
    const onRetrySource = vi.fn();
    render(<NotebookShell sources={SOURCES} onRetrySource={onRetrySource} />);
    await userEvent.click(screen.getByRole("button", { name: "Retry kickoff-call.txt" }));
    expect(onRetrySource).toHaveBeenCalledWith("s2");
  });

  // "Citations in the middle pane resolve into the left pane. Two ends of one
  // mechanism, not two features." The citation names its source from the left
  // pane's data, and clicking it moves that pane.
  it("resolves a citation against the sources pane", async () => {
    const onJumpToSource = vi.fn();
    render(<NotebookShell sources={SOURCES} messages={GROUNDED} onJumpToSource={onJumpToSource} />);
    const marker = document.querySelector('[data-slot="citation-ref"]')!;
    expect(marker).toHaveAttribute("data-state", "resolved");
    await userEvent.click(marker);
    expect(onJumpToSource).toHaveBeenCalledWith("s1");
  });

  it("announces the jump in the sources pane rather than only scrolling", async () => {
    const { container } = render(<NotebookShell sources={SOURCES} messages={GROUNDED} />);
    await userEvent.click(document.querySelector('[data-slot="citation-ref"]')!);
    const pane = container.querySelector('[data-region="sources"]')!;
    const status = pane.querySelector('[data-slot="notebook-shell-jump-status"]')!;
    // role="status" is not name-from-content, so the text is the assertion.
    expect(status).toHaveAttribute("role", "status");
    expect(status.textContent).toContain("Q3-report.pdf");
  });

  // The other end of the same mechanism: a citation that points at a document
  // the panel does not have is broken, and K6 says so visibly rather than the
  // shell dropping the marker.
  it("marks a citation with no matching source unresolved", () => {
    render(
      <NotebookShell
        sources={SOURCES}
        messages={[
          {
            id: "m1",
            role: "assistant",
            claims: [
              { id: "c1", text: "Headcount doubled.", citations: [{ id: "x1", label: "4", sourceId: "gone" }] },
            ],
          },
        ]}
      />,
    );
    const marker = document.querySelector('[data-slot="citation-ref"]')!;
    expect(marker).toHaveAttribute("data-state", "unresolved");
    expect(marker).toHaveAccessibleName(/source unavailable/i);
  });

  // A grounded answer goes through K7 answer-block, which is where the
  // claim → citation arrangement and the "not everything here is sourced"
  // warning already live.
  it("renders a grounded answer as K7 answer-block", () => {
    render(
      <NotebookShell
        sources={SOURCES}
        messages={[
          {
            id: "m1",
            role: "assistant",
            claims: [
              { id: "c1", text: "Revenue grew 12%.", citations: [{ id: "x1", label: "1", sourceId: "s1" }] },
              { id: "c2", text: "Margins held flat." },
            ],
          },
        ]}
      />,
    );
    const block = document.querySelector('[data-slot="answer-block"]')!;
    expect(block).toHaveAttribute("data-coverage", "partially-cited");
    expect(block.querySelector('[data-slot="answer-block-coverage-warning"]')).not.toBeNull();
  });

  // "Composes AI Elements' conversation and message rather than reimplementing
  // them" (O2, and the same two surfaces here). There is no data-slot to key on
  // upstream; the `is-user`/`is-assistant` class is the one observable that
  // separates composing Message from hand-rolling a bubble. Asserting a class
  // is normally wrong — here it is the only thing that catches the regression.
  it("composes AI Elements' Message rather than a hand-rolled bubble", () => {
    render(
      <NotebookShell
        messages={[
          { id: "m1", role: "user", content: "What changed in Q3?" },
          { id: "m2", role: "assistant", content: "Revenue grew." },
        ]}
      />,
    );
    expect(document.querySelector('[data-message-id="m1"]')!.className).toContain("is-user");
    expect(document.querySelector('[data-message-id="m2"]')!.className).toContain("is-assistant");
  });

  it("keeps the chat pane a log region with a name and a tab stop", () => {
    const { container } = render(<NotebookShell />);
    const chat = container.querySelector('[data-region="chat"]')!;
    expect(chat).toHaveAttribute("role", "log");
    expect(chat).toHaveAttribute("tabindex", "0");
    expect(chat).toHaveAccessibleName("Chat");
  });

  // Both side panes scroll, so both need their own tab stop and their own name
  // (axe scrollable-region-focusable).
  it.each([
    ["sources", "Sources"],
    ["studio-outputs", "Studio"],
  ])("gives the %s pane a name and a tab stop", (region, name) => {
    const { container } = render(<NotebookShell />);
    const pane = container.querySelector(`[data-region="${region}"]`)!;
    expect(pane).toHaveAttribute("tabindex", "0");
    expect(pane).toHaveAccessibleName(name);
  });

  it("puts D3 chips inside the composer, with D1 and N3", () => {
    const { container } = render(
      <NotebookShell contextChips={[{ id: "c1", kind: "file", label: "Q3-report.pdf" }]} />,
    );
    const composer = container.querySelector('[data-region="composer"]')!;
    expect(within(composer as HTMLElement).getByText("Q3-report.pdf")).toBeVisible();
    expect(composer.querySelector('[data-slot="media-prompt-bar"]')).not.toBeNull();
    expect(composer.querySelector('[data-slot="disclaimer-note"]')).not.toBeNull();
  });

  it("keeps the composer out of the scrolling chat pane", () => {
    const { container } = render(<NotebookShell />);
    const chat = container.querySelector('[data-region="chat"]')!;
    expect(chat.querySelector('[data-region="composer"]')).toBeNull();
  });

  // "The right pane is a menu of output types, not a canvas." The menu is C3,
  // and choosing a type is what generates.
  it("renders output types as a C3 feature-card row", () => {
    const { container } = render(<NotebookShell outputTypes={OUTPUT_TYPES} />);
    const studio = container.querySelector('[data-region="studio-outputs"]')!;
    expect(studio.querySelector('[data-slot="feature-card-row"]')).not.toBeNull();
    expect(studio.querySelectorAll('[data-slot="feature-card-row-card"]')).toHaveLength(2);
  });

  it("generates from the output-type card's own control", async () => {
    const onGenerateOutput = vi.fn();
    render(<NotebookShell outputTypes={OUTPUT_TYPES} onGenerateOutput={onGenerateOutput} />);
    await userEvent.click(screen.getByRole("button", { name: /Audio Overview/ }));
    expect(onGenerateOutput).toHaveBeenCalledWith("audio");
  });

  // "Choosing 'Audio Overview' or 'Mind Map' generates into that pane." The
  // result lands beside the menu, not in a new surface, and the menu stays.
  it("renders generated outputs as F1 result cards in the same pane", () => {
    const { container } = render(
      <NotebookShell
        outputTypes={OUTPUT_TYPES}
        outputs={[{ id: "o1", state: "done", label: "Audio Overview", aspect: "video" }]}
      />,
    );
    const studio = container.querySelector('[data-region="studio-outputs"]')!;
    expect(studio.querySelector('[data-slot="result-card"]')).not.toBeNull();
    expect(studio.querySelector('[data-output-id="o1"]')).not.toBeNull();
    // The menu is not replaced by its own output.
    expect(studio.querySelector('[data-slot="feature-card-row"]')).not.toBeNull();
    expect(studio.querySelector('[data-slot="empty-state"]')).toBeNull();
  });

  it("forwards a streaming output's state to F1 rather than reimplementing it", () => {
    render(<NotebookShell outputs={[{ id: "o1", state: "streaming", progress: 40 }]} />);
    expect(document.querySelector('[data-slot="result-card"]')).toHaveAttribute("data-state", "streaming");
    expect(document.querySelector('[data-slot="result-card-progress"]')).not.toBeNull();
  });
});
