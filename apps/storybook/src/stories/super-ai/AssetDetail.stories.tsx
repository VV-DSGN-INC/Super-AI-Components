import type { Meta, StoryObj } from "@storybook/react-vite";
import { Sparkles } from "lucide-react";

import { AssetDetail } from "@/registry/super-ai/asset-detail";
import { AssetDetailDocs } from "@/content/components/asset-detail.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const PROMPT = "A red bicycle leaning on a sunlit wall, shot on 35mm film";
const spanFor = (phrase: string) => {
  const start = PROMPT.indexOf(phrase);
  return { start, end: start + phrase.length };
};

function Media() {
  return (
    <div className="bg-foreground/10 flex aspect-video w-full items-center justify-center">
      <Sparkles aria-hidden className="text-foreground/40 size-10" />
    </div>
  );
}

const PARAMS = [
  { label: "Model", value: "Flux 1.1 Pro" },
  { label: "Seed", value: "4471", copyable: true },
  { label: "Sampler", value: "Euler a", copyable: true },
  { label: "Steps", value: "28" },
];

const meta: Meta<typeof AssetDetail> = {
  title: "Super AI/Asset Detail",
  component: AssetDetail,
  parameters: { layout: "centered", docs: { page: componentDocsPage(AssetDetailDocs) } },
  args: {
    open: true,
    media: <Media />,
    prompt: PROMPT,
    params: PARAMS,
    cost: { amount: 17 },
    onCopyPrompt: () => {},
    onRemix: () => {},
    onEdit: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof AssetDetail>;

/** Clicking a highlighted phrase hands that exact text to Remix. */
export const HighlightedSpans: Story = {
  args: {
    highlightedSpans: [spanFor("a sunlit wall"), spanFor("35mm film")],
    onSpanSelect: () => {},
  },
};

/** A10's grid, with a missing value rendering as an em-dash. */
export const ParamsGrid: Story = {
  args: {
    params: [...PARAMS, { label: "Guidance" }],
  },
};

/** Copy prompt · Remix · Edit, always in that order. */
export const HandoffVerbs: Story = {};

/** Suggestions supplied by the caller. */
export const MoreLikeThis: Story = {
  args: {
    moreLikeThis: (
      <div className="grid grid-cols-3 gap-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="bg-foreground/10 aspect-square rounded" />
        ))}
      </div>
    ),
  },
};
