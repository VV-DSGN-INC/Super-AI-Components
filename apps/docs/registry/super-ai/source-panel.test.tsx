import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SourcePanel, type SourcePanelSource } from "./source-panel";

const source = (overrides: Partial<SourcePanelSource> & Pick<SourcePanelSource, "stage">): SourcePanelSource => ({
  id: "1",
  name: "Q3-report.pdf",
  meta: "PDF · 2.4 MB",
  ...overrides,
});

describe("SourcePanel", () => {
  it("renders the parsing state", () => {
    render(<SourcePanel sources={[source({ stage: "parsing" })]} />);

    expect(screen.getByText("Q3-report.pdf")).toBeInTheDocument();
    // The stage is named in visible text. A bar alone would tell you work is
    // happening without telling you which stage it is.
    expect(screen.getByText("Parsing")).toBeInTheDocument();
    expect(screen.getByText("Step 1 of 3")).toBeInTheDocument();
  });

  it("renders the chunking state", () => {
    render(<SourcePanel sources={[source({ stage: "chunking" })]} />);

    expect(screen.getByText("Chunking")).toBeInTheDocument();
    expect(screen.getByText("Step 2 of 3")).toBeInTheDocument();
    expect(screen.queryByText("Parsing")).not.toBeInTheDocument();
  });

  it("renders the embedding state", () => {
    render(<SourcePanel sources={[source({ stage: "embedding" })]} />);

    expect(screen.getByText("Embedding")).toBeInTheDocument();
    expect(screen.getByText("Step 3 of 3")).toBeInTheDocument();
  });

  it("renders the ready state", () => {
    render(<SourcePanel sources={[source({ stage: "ready", chunkCount: 1284 })]} />);

    expect(screen.getByText("Ready")).toBeInTheDocument();
    // Chunk counts belong on ready sources — retrieval quality is otherwise
    // invisible — and they render through A10 stat-readout, not a bespoke row.
    expect(screen.getByText("Chunks")).toBeInTheDocument();
    expect(screen.getByText("1,284")).toBeInTheDocument();
    // Nothing is still in flight, so no bar remains.
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });

  it("renders the failed state", () => {
    render(
      <SourcePanel
        sources={[source({ stage: "failed", errorMessage: "Embedding request timed out" })]}
        onRetrySource={() => {}}
      />,
    );

    // Failure is carried by text and by a distinct icon shape, never by a
    // coloured dot: the word "Failed" and the error message are both present.
    expect(screen.getByText("Failed")).toBeInTheDocument();
    expect(screen.getByText("Embedding request timed out")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry Q3-report.pdf" })).toBeInTheDocument();
    expect(screen.queryByText("Ready")).not.toBeInTheDocument();
  });

  it("renders the empty state", () => {
    render(<SourcePanel />);

    expect(document.querySelector('[data-slot="source-panel-empty"]')).not.toBeNull();
    // Composes L1 empty-state rather than a bespoke paragraph.
    expect(document.querySelector('[data-slot="empty-state"]')).not.toBeNull();
    expect(document.querySelector('[data-slot="source-panel-items"]')).toBeNull();
    expect(screen.getByText("No sources yet")).toBeInTheDocument();
  });

  it("gives each in-flight stage an indeterminate progressbar named for the source and the stage", () => {
    render(
      <SourcePanel
        sources={[
          source({ id: "1", name: "Q3-report.pdf", stage: "chunking" }),
          source({ id: "2", name: "board-notes.md", stage: "embedding" }),
        ]}
      />,
    );

    // Not a bare "Loading" repeated N times: each bar names its own source
    // *and* its own stage, so a screen reader user can tell them apart.
    const chunking = screen.getByRole("progressbar", { name: "Q3-report.pdf: Chunking" });
    const embedding = screen.getByRole("progressbar", { name: "board-notes.md: Embedding" });

    // Indeterminate: these stages report completion, not a percentage, so
    // there is deliberately no aria-valuenow to fabricate one.
    expect(chunking).not.toHaveAttribute("aria-valuenow");
    expect(embedding).not.toHaveAttribute("aria-valuenow");
  });

  it("keeps retry per-source and in place, never panel-level", () => {
    const onRetrySource = vi.fn();
    render(
      <SourcePanel
        sources={[
          source({ id: "1", name: "Q3-report.pdf", stage: "failed", errorMessage: "Parse error" }),
          source({ id: "2", name: "board-notes.md", stage: "failed", errorMessage: "Timed out" }),
          source({ id: "3", name: "kickoff.vtt", stage: "ready", chunkCount: 12 }),
        ]}
        onRetrySource={onRetrySource}
      />,
    );

    // One button per failed source, each named after its own source, and none
    // anywhere else on the panel — one source failing says nothing about the
    // others, so a panel-wide retry would re-ingest all of them.
    const retries = screen.getAllByRole("button");
    expect(retries).toHaveLength(2);

    for (const button of retries) {
      expect(button.closest('[data-slot="source-panel-item"]')?.getAttribute("data-stage")).toBe("failed");
    }

    fireEvent.click(screen.getByRole("button", { name: "Retry board-notes.md" }));
    expect(onRetrySource).toHaveBeenCalledTimes(1);
    expect(onRetrySource).toHaveBeenCalledWith("2");
  });

  it("names the stage in visible text in every state, not only while in flight", () => {
    const stages = ["parsing", "chunking", "embedding", "ready", "failed"] as const;
    render(
      <SourcePanel
        sources={stages.map((stage, i) => source({ id: String(i), name: `doc-${i}.pdf`, stage }))}
      />,
    );

    for (const label of ["Parsing", "Chunking", "Embedding", "Ready", "Failed"]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it("announces each row's stage through a status region", () => {
    render(<SourcePanel sources={[source({ stage: "failed", errorMessage: "Parse error" })]} />);

    expect(screen.getByRole("status")).toHaveTextContent("Q3-report.pdf: Failed, Parse error");
  });

  it("composes entity-row and stat-readout without replacing their slots", () => {
    render(<SourcePanel sources={[source({ stage: "ready", chunkCount: 12 })]} />);

    // Overriding a composed registry component's data-slot silently erases
    // every test and style keyed to it, so these have to survive intact.
    expect(document.querySelector('[data-slot="entity-row"]')).not.toBeNull();
    expect(document.querySelector('[data-slot="entity-row-title"]')).not.toBeNull();
    expect(document.querySelector('[data-slot="stat-readout"]')).not.toBeNull();
    expect(document.querySelector('[data-slot="stat-readout-value"]')).not.toBeNull();
  });

  it("renders a heading and a caller-supplied action", () => {
    render(
      <SourcePanel
        heading="Sources"
        action={<button type="button">Add source</button>}
        sources={[source({ stage: "ready", chunkCount: 4 })]}
      />,
    );

    expect(screen.getByText("Sources")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add source" })).toBeInTheDocument();
  });

  it("passes className through", () => {
    render(<SourcePanel className="test-class" />);
    expect(document.querySelector('[data-slot="source-panel"]')!.className).toContain("test-class");
  });
});
