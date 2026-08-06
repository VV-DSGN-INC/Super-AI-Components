import type { Meta, StoryObj } from "@storybook/react-vite";

import { SourcePanel } from "@/registry/super-ai/source-panel";
import { SourcePanelDocs } from "@/content/components/source-panel.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const meta: Meta<typeof SourcePanel> = {
  title: "Super AI/Source Panel",
  component: SourcePanel,
  parameters: { layout: "centered", docs: { page: componentDocsPage(SourcePanelDocs) } },
};

export default meta;
type Story = StoryObj<typeof SourcePanel>;

export const Parsing: Story = {
  args: {
    heading: "Sources",
    sources: [
      { id: "1", name: "Q3-report.pdf", meta: "PDF · 2.4 MB", stage: "parsing" },
      { id: "2", name: "annual-review-2024.pdf", meta: "PDF · 18 MB", stage: "parsing" },
      { id: "3", name: "pricing-policy.docx", meta: "Word · 310 KB", stage: "ready", chunkCount: 96 },
    ],
  },
};

export const Chunking: Story = {
  args: {
    heading: "Sources",
    sources: [
      { id: "1", name: "Q3-report.pdf", meta: "PDF · 2.4 MB", stage: "chunking" },
      { id: "2", name: "kickoff-call.vtt", meta: "Transcript · 48 min", stage: "chunking" },
      { id: "3", name: "pricing-policy.docx", meta: "Word · 310 KB", stage: "ready", chunkCount: 96 },
    ],
  },
};

export const Embedding: Story = {
  args: {
    heading: "Sources",
    sources: [
      { id: "1", name: "Q3-report.pdf", meta: "PDF · 2.4 MB", stage: "embedding" },
      { id: "2", name: "competitor-teardown.md", meta: "Markdown · 61 KB", stage: "embedding" },
      { id: "3", name: "pricing-policy.docx", meta: "Word · 310 KB", stage: "ready", chunkCount: 96 },
    ],
  },
};

export const Ready: Story = {
  args: {
    heading: "Sources",
    sources: [
      { id: "1", name: "Q3-report.pdf", meta: "PDF · 2.4 MB", stage: "ready", chunkCount: 1284 },
      {
        id: "2",
        name: "pricing-policy.docx",
        meta: "Word · 310 KB",
        stage: "ready",
        chunkCount: 96,
        stats: [{ label: "Indexed", value: "2 days ago" }],
      },
      { id: "3", name: "kickoff-call.vtt", meta: "Transcript · 48 min", stage: "ready", chunkCount: 412 },
    ],
  },
};

export const Failed: Story = {
  args: {
    heading: "Sources",
    sources: [
      { id: "1", name: "Q3-report.pdf", meta: "PDF · 2.4 MB", stage: "ready", chunkCount: 1284 },
      {
        id: "2",
        name: "annual-review-2024.pdf",
        meta: "PDF · 18 MB",
        stage: "failed",
        errorMessage: "Parse failed — the file is a scan with no text layer",
      },
      {
        id: "3",
        name: "kickoff-call.vtt",
        meta: "Transcript · 48 min",
        stage: "failed",
        errorMessage: "Embedding request timed out",
      },
    ],
    onRetrySource: () => {},
  },
};

export const Empty: Story = {
  args: {
    heading: "Sources",
    sources: [],
  },
};
