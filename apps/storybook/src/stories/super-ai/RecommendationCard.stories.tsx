import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, userEvent, within } from "storybook/test";

import { RecommendationCard, type RecommendationCardProps } from "@/registry/super-ai/recommendation-card";
import { RecommendationCardDocs } from "@/content/components/recommendation-card.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const meta: Meta<typeof RecommendationCard> = {
  title: "Super AI/Recommendation Card",
  component: RecommendationCard,
  parameters: { layout: "centered", docs: { page: componentDocsPage(RecommendationCardDocs) } },
};

export default meta;
type Story = StoryObj<typeof RecommendationCard>;

const BASE_ARGS = {
  title: "Automate your weekly report",
  description: "Zapier can pull last week's numbers into Sheets and post a summary to Slack.",
  apps: ["Sheets", "Slack"],
  steps: [
    "Connect your Sheets and Slack accounts",
    "Pick which sheet holds this week's numbers",
    "Review the summary format and turn it on",
  ],
  onTry: () => {},
  onSaveForLater: () => {},
  onDismiss: () => {},
} satisfies Partial<RecommendationCardProps>;

// RecommendationCard is controlled — it owns none of the dismissed/saved
// state itself. These play tests need the card to actually reflect a click,
// so this wrapper stands in for the persistence a real consumer would own.
function ControlledRecommendationCard(props: RecommendationCardProps) {
  const [dismissed, setDismissed] = useState(props.dismissed ?? false);
  const [saved, setSaved] = useState(props.saved ?? false);
  return (
    <RecommendationCard
      {...props}
      dismissed={dismissed}
      onDismiss={() => {
        setDismissed(true);
        props.onDismiss();
      }}
      saved={saved}
      onSaveForLater={() => {
        setSaved(true);
        props.onSaveForLater?.();
      }}
    />
  );
}

export const Collapsed: Story = {
  args: { ...BASE_ARGS },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("Automate your weekly report")).toBeInTheDocument();
    await expect(canvas.queryByRole("dialog")).not.toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: "Try it" })).toHaveAttribute("aria-expanded", "false");
  },
};

export const Expanded: Story = {
  args: { ...BASE_ARGS, defaultOpen: true },
  play: async ({ canvasElement }) => {
    // The dialog renders in a portal, outside canvasElement, so this story
    // asserts against the document rather than the story canvas.
    const dialog = await within(document.body).findByRole("dialog", { name: "Automate your weekly report" });
    await expect(within(dialog).getAllByRole("listitem")).toHaveLength(3);
  },
};

export const Dismissible: Story = {
  args: { ...BASE_ARGS },
  render: (args) => <ControlledRecommendationCard {...args} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("Automate your weekly report")).toBeInTheDocument();

    await userEvent.click(canvas.getByRole("button", { name: "Dismiss" }));

    await expect(canvas.queryByText("Automate your weekly report")).not.toBeInTheDocument();
  },
};

export const SaveForLater: Story = {
  args: { ...BASE_ARGS },
  render: (args) => <ControlledRecommendationCard {...args} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const save = canvas.getByRole("button", { name: "Save for later" });

    await userEvent.click(save);

    await expect(canvas.getByRole("button", { name: "Saved" })).toBeDisabled();
    await expect(canvas.queryByRole("button", { name: "Save for later" })).not.toBeInTheDocument();
  },
};
