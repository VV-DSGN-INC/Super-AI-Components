import type { ComponentDocs } from "@/lib/component-docs";
import {
  ChunkCountsOnReadySources,
  GenericSpinnerHidesTheStage,
  PanelLevelRetry,
  StageIsTheStatus,
} from "./source-panel.examples";

/**
 * Seeded from docs/design-system/component-specs.md#k5-source-panel.
 *
 * No "use client" here: this module is plain data read by a Server Component
 * (component-docs.tsx), which destructures `docs.whatItIs`, `docs.evidence`,
 * etc. directly. Live examples that need handlers live in the
 * ./source-panel.examples client sidecar and are referenced here as
 * zero-prop elements — see that file for why.
 */
export const SourcePanelDocs: ComponentDocs = {
  whatItIs:
    "The list of everything a retrieval-backed surface knows about — files, pages, transcripts — with each source showing exactly where it is in the ingestion pipeline: parsing, chunking, embedding, ready, or failed. Ready sources carry their chunk count; failed sources carry their error and their own Retry.",
  whyItMatters:
    "Ingestion is slow, multi-stage and fails for boring reasons — a scanned PDF with no text layer, a transcript that times out mid-embed. Every product on the reference board (the NotebookLM sources pane, Lovable's knowledge panel, Claude projects) learned that a single spinner is not enough: when a source never becomes citable, the first question is which stage it died at, and a generic progress indicator has already thrown that away. Naming the stage turns an opaque wait into a diagnosable one, and it is the difference between a user retrying the right file and a user re-uploading everything.",
  evidence: ["NotebookLM", "Lovable", "Claude projects"],
  anatomy: [
    { slot: "source-panel", note: "Root wrapper around the header and the list of sources." },
    { slot: "source-panel-header", note: "Heading and the caller-supplied panel action, shown when either is present." },
    { slot: "source-panel-heading", note: "The panel label, e.g. Sources." },
    { slot: "source-panel-items", note: "The list of sources, in the order they were added." },
    { slot: "source-panel-item", note: "One source. Carries data-stage, so the pipeline position is queryable, not just visible." },
    { slot: "source-panel-stage", note: "The stage name as visible text — present in all five states, in the same place." },
    { slot: "source-panel-item-progress", note: "Indeterminate progressbar plus a step counter, only while a source is in flight." },
    { slot: "source-panel-item-stats", note: "Chunk count and any extra metadata on a ready source, rendered through stat-readout." },
    { slot: "source-panel-retry", note: "Per-row Retry, named after that source. Only rendered on a failed row." },
    { slot: "source-panel-item-status", note: "Visually hidden role=status text announcing that row's stage transitions." },
    { slot: "source-panel-empty", note: "Wraps the empty-state shown when there are no sources at all." },
  ],
  usage:
    "Create a row the moment a source is accepted, in `parsing`, and move it forward by updating that source's `stage` — the component is fully controlled and knows nothing about polling or timing. Set `chunkCount` when a source reaches `ready`; set `errorMessage` and `stage: \"failed\"` when it dies, and pass `onRetrySource` so the failed row can re-enter the pipeline in place. Reach for the empty state's `emptyAction` to repeat whatever verb this surface uses to add a source, rather than inventing a generic one.",
  dos: [
    {
      text: "Name the current stage in visible text on every row — parsing, chunking and embedding are different waits, and only the name tells them apart.",
      example: <StageIsTheStatus />,
    },
    {
      text: "Show the chunk count once a source is ready; it is the only visible signal of how well that source will retrieve.",
      example: <ChunkCountsOnReadySources />,
    },
  ],
  donts: [
    {
      text: "Don't collapse the pipeline into one spinner and a word like Processing — when a source fails, nobody can tell which stage it died at.",
      example: <GenericSpinnerHidesTheStage />,
    },
    {
      text: "Don't put Retry at the panel level; one source failing to embed says nothing about the four that succeeded, and a panel-wide retry re-ingests all of them.",
      example: <PanelLevelRetry />,
    },
  ],
  pitfalls: [
    "The in-flight bar is deliberately indeterminate — parsing, chunking and embedding report completion, not percentages. If you have a real per-stage percentage, add it as visible text beside the stage name rather than reaching for a value on the bar; a fabricated percentage that sticks at 90% is worse than an honest indeterminate one.",
    "Rows are not clickable. Retry lives inside the row, so making the row itself a button would nest one interactive element inside another. If you need jump-to-source (the other half of the citation-ref mechanism), put an explicit control in the row rather than making the whole row activate.",
    "A row's status region re-announces whenever its text changes. Move a source through the pipeline on real transitions only — pushing the same stage repeatedly from a polling loop will read the stage out loud on every tick.",
    "`chunkCount` is ignored on anything other than a ready source. A count that survives into `failed` implies the source is partially retrievable, which is usually not true — clear it when a source drops out of the pipeline.",
  ],
};
