import type { Meta, StoryObj } from "@storybook/react-vite";

import { FeatureAnnouncement } from "@/registry/super-ai/feature-announcement";
import { FeatureAnnouncementDocs } from "@/content/components/feature-announcement.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const meta: Meta<typeof FeatureAnnouncement> = {
  title: "Super AI/Feature Announcement",
  component: FeatureAnnouncement,
  parameters: { layout: "centered", docs: { page: componentDocsPage(FeatureAnnouncementDocs) } },
};

export default meta;
type Story = StoryObj<typeof FeatureAnnouncement>;

/** Loudest level: the product genuinely works differently now. */
export const Modal: Story = {
  args: {
    id: "agent-mode-launch",
    level: "modal",
    stage: "New",
    title: "Agent mode",
    description: "Hand the assistant a goal and it plans, runs, and reports back on its own.",
    ctaLabel: "Try agent mode",
    onCtaClick: () => {},
    onDismiss: () => {},
  },
};

/** Points at the control the feature lives on. */
export const Anchored: Story = {
  args: {
    id: "timeline-markers",
    level: "anchored",
    stage: "Beta",
    title: "Markers on the timeline",
    description: "Drop a marker with M and jump between them with the bracket keys.",
    ctaLabel: "Show me",
    anchorLabel: "Timeline",
    onCtaClick: () => {},
    onDismiss: () => {},
  },
};

/** Worth reading in the flow of a surface, not worth blocking. */
export const InlineCard: Story = {
  args: {
    id: "voice-library",
    level: "inline-card",
    stage: "Preview",
    title: "Shared voice library",
    description: "Voices you clone are now available to everyone in the workspace.",
    ctaLabel: "Open the library",
    onCtaClick: () => {},
    onDismiss: () => {},
  },
};

/** Quietest level: a tweak, a rename, a raised limit. */
export const DismissibleChip: Story = {
  args: {
    id: "export-limit-raised",
    level: "dismissible-chip",
    stage: "v2.4",
    title: "Exports now run up to 4K",
    ctaLabel: "Details",
    onCtaClick: () => {},
    onDismiss: () => {},
  },
};

/**
 * Stage badges set expectations. All four render as a word — never a bare
 * coloured dot — so the stage survives for colourblind and screen-reader users.
 */
export const StageBadge: Story = {
  args: {
    id: "stage-badges",
    level: "inline-card",
    title: "Stage badges",
    onDismiss: () => {},
  },
  render: (args) => (
    <div className="flex flex-col items-start gap-3">
      {["New", "Beta", "Preview", "v2.4"].map((stage) => (
        <FeatureAnnouncement
          {...args}
          key={stage}
          id={`stage-badges-${stage.toLowerCase()}`}
          stage={stage}
          title={`Shared voice library (${stage})`}
          description="The badge is the promise: what you can expect from this feature today."
        />
      ))}
    </div>
  ),
};
