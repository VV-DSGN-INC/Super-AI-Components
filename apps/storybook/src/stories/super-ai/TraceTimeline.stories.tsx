import type { Meta, StoryObj } from "@storybook/react-vite";

import { TraceTimeline, type TraceSpan } from "@/registry/super-ai/trace-timeline";
import { TraceTimelineDocs } from "@/content/components/trace-timeline.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const meta: Meta<typeof TraceTimeline> = {
  title: "Super AI/Trace Timeline",
  component: TraceTimeline,
  parameters: { layout: "centered", docs: { page: componentDocsPage(TraceTimelineDocs) } },
};

export default meta;
type Story = StoryObj<typeof TraceTimeline>;

const BASE_SPANS: TraceSpan[] = [
  { id: "plan", name: "Plan the task", kind: "chain", status: "ok", startMs: 0, durationMs: 400 },
  { id: "search", name: "Search the web", kind: "tool", status: "ok", startMs: 400, durationMs: 900 },
  { id: "read-file", name: "Read repo file", kind: "tool", status: "ok", startMs: 600, durationMs: 500 },
];

export const Collapsed: Story = {
  args: { spans: BASE_SPANS, className: "w-[420px]" },
};

export const Expanded: Story = {
  args: { spans: BASE_SPANS, defaultExpandedId: "search", className: "w-[420px]" },
};

export const Errored: Story = {
  args: {
    spans: [
      ...BASE_SPANS,
      {
        id: "call-1",
        name: "Call LLM: draft answer",
        kind: "llm",
        status: "error",
        startMs: 1320,
        durationMs: 380,
        error: "Provider timed out after 30s",
      },
    ],
    defaultExpandedId: "call-1",
    className: "w-[420px]",
  },
};

export const RetrySiblings: Story = {
  args: {
    spans: [
      ...BASE_SPANS,
      {
        id: "call-1",
        name: "Call LLM: draft answer",
        kind: "llm",
        status: "error",
        startMs: 1320,
        durationMs: 380,
        error: "Provider timed out after 30s",
      },
      {
        id: "call-2",
        name: "Call LLM: draft answer",
        kind: "llm",
        status: "ok",
        retryOf: "call-1",
        startMs: 1700,
        durationMs: 640,
      },
    ],
    className: "w-[420px]",
  },
};
