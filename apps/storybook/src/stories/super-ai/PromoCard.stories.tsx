import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, userEvent, within } from "storybook/test";

import { PromoCard, type PromoCardProps } from "@/registry/super-ai/promo-card";
import { PromoCardDocs } from "@/content/components/promo-card.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const meta: Meta<typeof PromoCard> = {
  title: "Super AI/Promo Card",
  component: PromoCard,
  parameters: { layout: "centered", docs: { page: componentDocsPage(PromoCardDocs) } },
};

export default meta;
type Story = StoryObj<typeof PromoCard>;

// PromoCard is controlled — it owns none of the dismissal state itself. The
// play test below needs the card to actually leave the DOM after a click, so
// this wrapper stands in for the persistence a real consumer would own.
function ControlledPromoCard(props: PromoCardProps) {
  const [dismissed, setDismissed] = useState(props.dismissed ?? false);
  return (
    <PromoCard
      {...props}
      dismissed={dismissed}
      onDismiss={() => {
        setDismissed(true);
        props.onDismiss();
      }}
    />
  );
}

export const Upgrade: Story = {
  args: {
    flavour: "upgrade",
    title: "Upgrade to Pro",
    description: "Unlock unlimited generations and priority rendering.",
    ctaLabel: "Upgrade",
    onCtaClick: () => {},
    onDismiss: () => {},
  },
  render: (args) => <ControlledPromoCard {...args} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("Upgrade to Pro")).toBeInTheDocument();

    await userEvent.click(canvas.getByRole("button", { name: /dismiss/i }));

    await expect(canvas.queryByText("Upgrade to Pro")).not.toBeInTheDocument();
  },
};

export const Invite: Story = {
  args: {
    flavour: "invite",
    title: "Invite your team",
    description: "Projects are better with collaborators. Invites are free.",
    ctaLabel: "Invite teammates",
    onCtaClick: () => {},
    onDismiss: () => {},
  },
};

export const UpdateAvailable: Story = {
  args: {
    flavour: "update-available",
    title: "Update available",
    description: "Version 2.4 adds faster exports and a new brush engine.",
    ctaLabel: "Update now",
    onCtaClick: () => {},
    onDismiss: () => {},
  },
};

export const QuotaWarning: Story = {
  args: {
    flavour: "quota-warning",
    title: "You're near your limit",
    description: "You've used 90% of this month's generation credits.",
    ctaLabel: "Manage usage",
    onCtaClick: () => {},
    onDismiss: () => {},
  },
};

export const Dismissed: Story = {
  args: {
    flavour: "upgrade",
    title: "Upgrade to Pro",
    dismissed: true,
    onDismiss: () => {},
  },
};
