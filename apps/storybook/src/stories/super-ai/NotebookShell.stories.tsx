import type { Meta, StoryObj } from "@storybook/react-vite";
import { AudioLines, FileText, Network, Plus } from "lucide-react";
import { expect } from "storybook/test";

import { Button } from "@/components/ui/button";
import { NotebookShellDocs } from "@/content/components/notebook-shell.docs";
import { componentDocsPage } from "@/lib/component-docs-page";
import { NotebookShell, type NotebookShellProps } from "@/registry/super-ai/notebook-shell";

const SOURCES: NotebookShellProps["sources"] = [
  { id: "q3-report", name: "Q3-report.pdf", meta: "PDF · 2.4 MB", stage: "ready", chunkCount: 184 },
  {
    id: "kickoff-call",
    name: "Kickoff call transcript",
    meta: "Transcript · 48 min",
    stage: "ready",
    chunkCount: 96,
  },
  { id: "pricing-page", name: "competitor-pricing.html", meta: "Web page", stage: "embedding" },
  {
    id: "contract",
    name: "master-agreement.docx",
    meta: "DOCX · 812 KB",
    stage: "failed",
    errorMessage: "Could not read the file — it looks password protected.",
  },
];

const MESSAGES: NotebookShellProps["messages"] = [
  {
    id: "m1",
    role: "user",
    content: "What did we actually commit to on pricing, and where is that written down?",
  },
  {
    id: "m2",
    role: "assistant",
    claims: [
      {
        id: "c1",
        text: "The commitment is a flat per-seat price held for the first twelve months.",
        citations: [
          {
            id: "x1",
            label: "1",
            sourceId: "q3-report",
            quote: "Per-seat pricing is fixed for the first four quarters of any new contract.",
          },
        ],
      },
      {
        id: "c2",
        text: "It was agreed verbally on the kickoff call two weeks before it reached the report.",
        citations: [
          {
            id: "x2",
            label: "2",
            sourceId: "kickoff-call",
            quote: "We will hold the seat price for a year — put that in writing before Q4.",
          },
        ],
      },
      { id: "c3", text: "Nothing in the uploaded set covers renewal pricing after year one." },
    ],
    retrievedUnused: 1,
  },
];

const OUTPUT_TYPES: NotebookShellProps["outputTypes"] = [
  {
    id: "audio",
    icon: <AudioLines aria-hidden />,
    title: "Audio Overview",
    description: "Two hosts talk through everything you have added.",
  },
  {
    id: "mind-map",
    icon: <Network aria-hidden />,
    title: "Mind Map",
    description: "How the sources connect to one another.",
  },
  {
    id: "briefing",
    icon: <FileText aria-hidden />,
    title: "Briefing Doc",
    description: "A one-page summary, cited throughout.",
  },
];

const OUTPUTS: NotebookShellProps["outputs"] = [
  {
    id: "o1",
    state: "done",
    aspect: "video",
    label: "Audio Overview · 11 min",
    badge: "Audio",
    footer: <span>Generated from 3 sources</span>,
  },
  {
    id: "o2",
    state: "streaming",
    aspect: "video",
    progress: 62,
    label: "Mind Map",
    badge: "Diagram",
  },
];

const ADD_SOURCE = (
  <Button type="button" size="sm" variant="outline">
    <Plus aria-hidden />
    Add source
  </Button>
);

const FULL_ARGS: NotebookShellProps = {
  sources: SOURCES,
  sourcesAction: ADD_SOURCE,
  sourcesEmptyAction: (
    <Button type="button" size="sm">
      Add source
    </Button>
  ),
  onRetrySource: () => {},
  messages: MESSAGES,
  contextChips: [{ id: "chip-1", kind: "file", label: "Q3-report.pdf", onRemove: () => {} }],
  outputTypes: OUTPUT_TYPES,
  outputs: OUTPUTS,
  onGenerateOutput: () => {},
};

const meta: Meta<typeof NotebookShell> = {
  title: "Super AI/Notebook Shell",
  component: NotebookShell,
  // A block is a page, so it gets the whole canvas rather than a centred box.
  // The `h-svh` wrapper is what the shell's `h-full` measures against — in a
  // real app that is the document, here it is the story frame.
  parameters: { layout: "fullscreen", docs: { page: componentDocsPage(NotebookShellDocs) } },
  decorators: [
    (Story) => (
      <div className="h-svh w-full">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof NotebookShell>;

/** The working notebook: four sources, a cited answer, two outputs in the studio. */
export const Grounded: Story = { args: FULL_ARGS };

/**
 * Day one, and the reason this block has an empty contract at all: no sources,
 * no conversation, nothing generated — three L1s on screen at the same time.
 * The studio still shows its menu, because a menu of things you could make is
 * the one part of an empty notebook that is worth reading. Mandatory export for
 * the block contract.
 */
export const Empty: Story = {
  args: {
    sourcesAction: ADD_SOURCE,
    sourcesEmptyAction: (
      <Button type="button" size="sm">
        Add source
      </Button>
    ),
    outputTypes: OUTPUT_TYPES,
    onGenerateOutput: () => {},
  },
};

/**
 * Narrow viewport. Three columns are unusable well before the phone
 * breakpoint, so below `lg` the panes stack in reading order — sources, the
 * conversation about them, then what it produced — and the scroll moves from
 * the panes to the shell root. Mandatory export for the block contract; a
 * shell is a layout, and layout is what breaks.
 *
 * `globals.viewport.value` is the Storybook 9 API. `parameters.viewport
 * .defaultViewport` was removed in 9 and does nothing while looking
 * configured, and `options` is declared explicitly so the selection cannot
 * silently resolve to nothing.
 *
 * KNOWN LIMIT: this resizes the canvas in the Storybook UI only. The vitest
 * runner behind `test:stories` has no manager to resize an iframe, so it
 * renders and axe-checks this story at the browser's default width. The narrow
 * layout is verified by hand, not by a gate.
 */
export const Responsive: Story = {
  args: FULL_ARGS,
  parameters: {
    viewport: {
      options: {
        mobile: { name: "Mobile", styles: { width: "375px", height: "812px" }, type: "mobile" },
      },
    },
  },
  globals: { viewport: { value: "mobile" } },
};

/**
 * Geometric proof for `OUTPUT_TYPES_IN_PANE`'s vertical override
 * (notebook-shell.tsx): the studio pane is a fixed twenty rem (`lg:w-80`),
 * and C3's own arrows are vertically centred by default — inside that width
 * they land on the card's title, the reason this shell repositions them at
 * all. The override moves them to the row's header line and marks its `top`
 * important to survive C3's own `!top-2`; without that `!`, C3's importance
 * wins over this selector's higher specificity and the arrows end up back
 * inside the row, over the first card's icon — the same "arrows over a card"
 * failure the header-line placement exists to avoid. See that constant's
 * docstring for the full mechanism.
 */
export const ArrowsClearTheRow: Story = {
  args: FULL_ARGS,
  play: async ({ canvasElement }) => {
    const row = canvasElement.querySelector<HTMLElement>('[data-slot="feature-card-row"]')!;
    const prev = canvasElement.querySelector<HTMLElement>(
      '[data-slot="feature-card-row-previous"]',
    )!;
    const next = canvasElement.querySelector<HTMLElement>('[data-slot="feature-card-row-next"]')!;
    const pane = canvasElement.querySelector<HTMLElement>('[data-region="studio-outputs"]')!;

    const rowBox = row.getBoundingClientRect();
    const prevBox = prev.getBoundingClientRect();
    const nextBox = next.getBoundingClientRect();
    const paneBox = pane.getBoundingClientRect();

    // Above the row's header line, never over the cards.
    await expect(prevBox.bottom).toBeLessThanOrEqual(rowBox.top + 1);
    await expect(nextBox.bottom).toBeLessThanOrEqual(rowBox.top + 1);

    // Inside the pane — not clipped at its twenty-rem width.
    await expect(prevBox.left).toBeGreaterThanOrEqual(paneBox.left);
    await expect(nextBox.right).toBeLessThanOrEqual(paneBox.right);
  },
};

/**
 * Sources mid-ingest. The pipeline is the status — a source being embedded says
 * so by name, and a failed one is retryable in place without touching the other
 * three.
 */
export const Ingesting: Story = {
  args: {
    ...FULL_ARGS,
    sources: [
      { id: "q3-report", name: "Q3-report.pdf", meta: "PDF · 2.4 MB", stage: "parsing" },
      { id: "kickoff-call", name: "Kickoff call transcript", meta: "Transcript", stage: "chunking" },
      { id: "pricing-page", name: "competitor-pricing.html", meta: "Web page", stage: "embedding" },
      {
        id: "contract",
        name: "master-agreement.docx",
        meta: "DOCX · 812 KB",
        stage: "failed",
        errorMessage: "Could not read the file — it looks password protected.",
      },
    ],
    messages: [],
    outputs: [],
  },
};

/**
 * A citation pointing at a document the panel does not have. It still renders,
 * and it still says it is broken — silently dropping the marker is how an
 * answer stops being auditable.
 */
export const UnresolvedCitation: Story = {
  args: {
    ...FULL_ARGS,
    outputs: [],
    messages: [
      {
        id: "m1",
        role: "assistant",
        claims: [
          {
            id: "c1",
            text: "Headcount doubled between the second and third quarter.",
            citations: [{ id: "x1", label: "4", sourceId: "headcount-sheet" }],
          },
        ],
      },
    ],
  },
};
