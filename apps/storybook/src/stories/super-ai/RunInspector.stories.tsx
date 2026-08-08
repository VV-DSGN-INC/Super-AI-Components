import type { Meta, StoryObj } from "@storybook/react-vite";

import { RunInspector } from "@/registry/super-ai/run-inspector";
import { RunInspectorDocs } from "@/content/components/run-inspector.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const meta: Meta<typeof RunInspector> = {
  title: "Super AI/Run Inspector",
  component: RunInspector,
  parameters: { layout: "centered", docs: { page: componentDocsPage(RunInspectorDocs) } },
};

export default meta;
type Story = StoryObj<typeof RunInspector>;

const INPUT = {
  model: "gpt-4o-mini",
  messages: [{ role: "user", content: "Draft a one-paragraph release summary." }],
  maxTokens: 256,
};

const OUTPUT = {
  text: "This release ships the run inspector, giving engineers a single place to read a span's input, output, cost, and any retry it went through.",
};

const METADATA = {
  model: "gpt-4o-mini",
  latencyMs: 640,
  tokensIn: 118,
  tokensOut: 54,
  cost: 0.07,
  costUnit: "credits",
  cacheHit: false,
};

export const InputTab: Story = {
  args: { input: INPUT, output: OUTPUT, metadata: METADATA, defaultTab: "input", className: "w-[440px]" },
};

export const OutputTab: Story = {
  args: { input: INPUT, output: OUTPUT, metadata: METADATA, defaultTab: "output", className: "w-[440px]" },
};

export const MetadataTab: Story = {
  args: {
    input: INPUT,
    output: OUTPUT,
    metadata: { ...METADATA, cacheHit: true, cost: 0 },
    defaultTab: "metadata",
    className: "w-[440px]",
  },
};

export const ErrorTab: Story = {
  args: {
    input: INPUT,
    metadata: METADATA,
    defaultTab: "error",
    error: "Provider timed out after 30s",
    retriedAttempt: { id: "call-0", name: "Call LLM: draft summary", status: "error" },
    retriedBy: { id: "call-2", name: "Call LLM: draft summary (retry)", status: "ok" },
    className: "w-[440px]",
  },
};
