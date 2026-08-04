import type { Meta, StoryObj } from "@storybook/react-vite";

import { RateLimitBanner } from "@/registry/super-ai/rate-limit-banner";
import { RateLimitBannerDocs } from "@/content/components/rate-limit-banner.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const meta: Meta<typeof RateLimitBanner> = {
  title: "Super AI/Rate Limit Banner",
  component: RateLimitBanner,
  parameters: { layout: "centered", docs: { page: componentDocsPage(RateLimitBannerDocs) } },
  decorators: [
    (Story) => (
      <div className="w-[32rem] max-w-full">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof RateLimitBanner>;

/** The ceiling is on the account — stated as a plan boundary, not a reprimand. */
export const YourLimit: Story = {
  args: {
    cause: "your-limit",
    resource: "Image generations · 50 of 50 used today",
    remainingSeconds: 1847,
  },
};

/**
 * Same wall, different truth: the model is saturated. The copy clears the user
 * of fault outright, because the alternative is selling them an upgrade that
 * fixes nothing.
 */
export const ProviderCapacity: Story = {
  args: {
    cause: "provider-capacity",
    resource: "Claude Opus 4.5",
    remainingSeconds: 95,
  },
};

/**
 * `remainingSeconds` is host-owned — this story renders one frame of it. The
 * component starts no interval; a real host re-passes the value each second.
 */
export const LiveCountdown: Story = {
  args: {
    cause: "your-limit",
    resource: "Video renders",
    remainingSeconds: 154,
  },
};

/**
 * No estimate to give, so the opt-in replaces the countdown rather than a
 * vaguer sentence. `notifyEnabled` is controlled by the host — flip it in the
 * controls to see the taken state, which reads as text plus `aria-pressed`,
 * never as a colour change alone.
 */
export const NotifyMe: Story = {
  args: {
    cause: "provider-capacity",
    resource: "Claude Opus 4.5",
    onNotifyMe: () => {},
    notifyEnabled: false,
  },
};
