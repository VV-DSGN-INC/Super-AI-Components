import type { Meta, StoryObj } from "@storybook/react-vite";

import { PaywallMessage } from "@/registry/super-ai/paywall-message";
import { CostProvider } from "@/registry/super-ai/cost";
import { PaywallMessageDocs } from "@/content/components/paywall-message.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const PROMPT = "A slow dolly across a rain-lit Tokyo alley at night, neon reflections in the puddles";

const meta: Meta<typeof PaywallMessage> = {
  title: "Super AI/Paywall Message",
  component: PaywallMessage,
  parameters: { layout: "centered", docs: { page: componentDocsPage(PaywallMessageDocs) } },
  // Every story sits inside the cost contract: the shortfall line under the
  // price is derived from this balance, never passed to the card as a prop.
  decorators: [
    (Story) => (
      <CostProvider balance={120} onTopUp={() => {}}>
        <div className="w-[28rem] max-w-full">
          <Story />
        </div>
      </CostProvider>
    ),
  ],
  args: {
    prompt: PROMPT,
    model: "Veo 3.1",
    onUpgrade: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof PaywallMessage>;

/** The model is not on the plan. The prompt and the model both survive the block. */
export const LockedModel: Story = {
  args: {
    state: "locked-model",
    requirement: "Pro",
    cost: { amount: 900, per: "min" },
    preview: "8 seconds, 1080p — handheld drift past a ramen counter, sign flicker on wet asphalt.",
    before:
      "I have the shot ready to go, but Veo 3.1 is not on your current plan, so I stopped before spending anything.",
    after:
      "Your prompt and model are held here — upgrading picks this back up exactly where it stopped. In the meantime I can storyboard it as stills.",
  },
};

/** The balance falls short, so the shortfall line derives itself from the contract. */
export const QuotaExhausted: Story = {
  args: {
    state: "quota-exhausted",
    prompt: "Upscale the final cut to 4K and export an MP4 for the client review",
    model: "Topaz Video AI",
    cost: { amount: 900 },
    preview: "One 4K MP4, roughly 90 seconds, H.264.",
    before: "You are out of credits for this billing period, so I did not start the export.",
    after: "Credits reset on the 1st. I have kept the export settings, so nothing needs rebuilding.",
  },
};

/** A capability the account never had — no price to quote, only work to hold. */
export const FeatureLocked: Story = {
  args: {
    state: "feature-locked",
    requirement: "Studio",
    prompt: "Give the narrator my cloned voice and lip-sync it to the presenter shot",
    model: "ElevenLabs v3",
    preview: "A 40-second voice track, lip-synced to the presenter take.",
    before:
      "Voice cloning is a Studio feature, so I stopped at the script rather than generating something you cannot use.",
    after: "Everything else in this edit is done — this is the only step waiting on the plan.",
  },
};
