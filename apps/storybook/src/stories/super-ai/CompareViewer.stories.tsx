import type { Meta, StoryObj } from "@storybook/react-vite";

import { CompareViewer, type ComparePane } from "@/registry/super-ai/compare-viewer";
import { CompareViewerDocs } from "@/content/components/compare-viewer.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

function Pane({ tone, caption }: { tone: string; caption: string }) {
  return (
    <div className={`flex h-56 w-full items-end p-3 ${tone}`}>
      <span className="bg-background text-foreground rounded px-2 py-1 text-xs">{caption}</span>
    </div>
  );
}

const PANES: ComparePane[] = [
  { id: "a", label: "Original", content: <Pane tone="bg-foreground/10" caption="1080p source" /> },
  {
    id: "b",
    label: "Upscaled 4x",
    content: <Pane tone="bg-foreground/25" caption="4K, Topaz v4" />,
  },
];

const meta: Meta<typeof CompareViewer> = {
  title: "Super AI/Compare Viewer",
  component: CompareViewer,
  parameters: { layout: "centered", docs: { page: componentDocsPage(CompareViewerDocs) } },
  decorators: [
    (Story) => (
      <div className="w-[40rem] max-w-full">
        <Story />
      </div>
    ),
  ],
  args: {
    panes: PANES,
    onModeChange: () => {},
    syncKey: "upscale-run-4",
  },
};

export default meta;
type Story = StoryObj<typeof CompareViewer>;

/** The only mode with room for both captions — so the only one that shows them. */
export const Side: Story = {
  args: { mode: "side" },
};

/** One pane at a time. The label is gone; the number and the switcher remain. */
export const Single: Story = {
  args: { mode: "single", activePaneId: "b", onActivePaneChange: () => {} },
};

/** A wipe is a mode, not a separate before/after component. */
export const Wipe: Story = {
  args: { mode: "wipe", wipePosition: 45, onWipePositionChange: () => {} },
};
