import type { Meta, StoryObj } from "@storybook/react-vite";

import { ConnectionManager } from "@/registry/super-ai/connection-manager";
import { ConnectionManagerDocs } from "@/content/components/connection-manager.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const meta: Meta<typeof ConnectionManager> = {
  title: "Super AI/Connection Manager",
  component: ConnectionManager,
  parameters: { layout: "centered", docs: { page: componentDocsPage(ConnectionManagerDocs) } },
};

export default meta;
type Story = StoryObj<typeof ConnectionManager>;

/** Nothing stored: a labelled password field, and nothing to test yet. */
export const NotSet: Story = {
  args: {
    label: "Model providers",
    description: "Bring your own keys, or run a model on this machine.",
    providers: [{ id: "openai", name: "OpenAI", status: "not-set" }],
    onSaveKey: () => {},
    onTest: () => {},
  },
};

/** Stored and verified. The key is a fingerprint from here on, never a value. */
export const Valid: Story = {
  args: {
    label: "Model providers",
    providers: [
      {
        id: "openai",
        name: "OpenAI",
        status: "valid",
        fingerprint: "sk-live ···· 4f2a",
        testedAt: "Tested 4 minutes ago",
      },
    ],
    onSaveKey: () => {},
    onTest: () => {},
  },
};

/** The provider answered, and refused the key. The user's problem: replace it. */
export const Invalid: Story = {
  args: {
    label: "Model providers",
    providers: [
      {
        id: "anthropic",
        name: "Anthropic",
        status: "invalid",
        fingerprint: "sk-ant ···· 91bd",
        testedAt: "Tested just now",
      },
    ],
    onSaveKey: () => {},
    onTest: () => {},
  },
};

/** Not the user's problem. Opposite advice to Invalid, and deliberately no Replace key. */
export const Unreachable: Story = {
  args: {
    label: "Model providers",
    providers: [
      {
        id: "replicate",
        name: "Replicate",
        status: "unreachable",
        fingerprint: "r8 ···· 0c17",
        testedAt: "Tested 30 seconds ago",
      },
    ],
    onSaveKey: () => {},
    onTest: () => {},
  },
};

/** Hardware requirements on the same row, stated before the download — and blocking it. */
export const LocalModel: Story = {
  args: {
    label: "Local models",
    providers: [
      {
        id: "llama",
        name: "Llama 3.1 8B",
        status: "not-set",
        local: {
          size: "4.7 GB",
          requirements: [
            { label: "Memory", value: "16 GB RAM", met: true },
            { label: "Disk", value: "12 GB free", met: true },
            { label: "Accelerator", value: "Apple silicon or CUDA GPU", met: false },
          ],
        },
      },
    ],
    onDownload: () => {},
    onTest: () => {},
  },
};
