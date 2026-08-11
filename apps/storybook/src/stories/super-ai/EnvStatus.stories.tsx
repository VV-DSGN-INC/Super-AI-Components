import type { Meta, StoryObj } from "@storybook/react-vite";

import { EnvStatus } from "@/registry/super-ai/env-status";
import { EnvStatusDocs } from "@/content/components/env-status.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const meta: Meta<typeof EnvStatus> = {
  title: "Super AI/Env Status",
  component: EnvStatus,
  parameters: { layout: "centered", docs: { page: componentDocsPage(EnvStatusDocs) } },
};

export default meta;
type Story = StoryObj<typeof EnvStatus>;

/** Reachable. Nothing to do — the remedy for the state where nothing is wrong. */
export const Ok: Story = {
  args: {
    label: "Model providers",
    providers: [{ id: "openai", name: "OpenAI", state: "ok", checkedAt: "Checked 30 seconds ago" }],
  },
};

/** Slower than usual, but succeeding. The remedy is to wait — never to touch a credential. */
export const Degraded: Story = {
  args: {
    label: "Model providers",
    providers: [{ id: "anthropic", name: "Anthropic", state: "degraded", checkedAt: "Checked just now" }],
  },
};

/** The provider answered and rejected the credential — the user's problem to fix. */
export const KeyInvalid: Story = {
  args: {
    label: "Model providers",
    providers: [
      { id: "replicate", name: "Replicate", state: "key-invalid", checkedAt: "Checked 2 minutes ago" },
    ],
  },
};

/** Nothing answered — no local runtime is up. The remedy is to start it locally. */
export const NotRunning: Story = {
  args: {
    label: "Model providers",
    providers: [
      { id: "llama", name: "Llama 3.1 8B (local)", state: "not-running", checkedAt: "Checked 1 minute ago" },
    ],
  },
};
