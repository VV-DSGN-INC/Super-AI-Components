import type { Meta, StoryObj } from "@storybook/react-vite";
import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CoachMark } from "@/registry/super-ai/coach-mark";
import { CoachMarkDocs } from "@/content/components/coach-mark.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const meta: Meta<typeof CoachMark> = {
  title: "Super AI/Coach Mark",
  component: CoachMark,
  parameters: { layout: "centered", docs: { page: componentDocsPage(CoachMarkDocs) } },
  args: {
    onSkip: () => {},
    onNext: () => {},
    onBack: () => {},
    // Off in Storybook only. The real default is `true` — a coach-mark takes
    // focus so Skip is one Tab away — but the docs page renders every story at
    // once, and four marks fighting over focus makes the page unreadable.
    autoFocus: false,
  },
};

export default meta;
type Story = StoryObj<typeof CoachMark>;

/**
 * The default. Everything outside the cut-out dims; the anchored button keeps
 * its own colours and stays clickable.
 */
export const Spotlight: Story = {
  args: {
    title: "Generate when you are ready",
    description: "The cost is confirmed here before anything is spent.",
    step: 3,
    total: 4,
    side: "top",
    children: (
      <Button type="button">
        <Sparkles /> Generate
      </Button>
    ),
  },
};

/**
 * A tip that annotates without taking over the screen — no dim, same anatomy.
 * Reach for this when the tour is optional rather than a first-run walkthrough.
 */
export const NoSpotlight: Story = {
  args: {
    title: "Swap the model anytime",
    description: "Faster models cost less, and changing this between runs loses nothing.",
    spotlight: false,
    step: 2,
    total: 4,
    side: "bottom",
    children: (
      <Button variant="outline" type="button">
        Veo 3.1 Fast
      </Button>
    ),
  },
};

/**
 * The counter and Skip are structural, not optional: a single-step tip with no
 * Next and no Back still says how long it is and still offers a way out.
 */
export const StepCounter: Story = {
  args: {
    title: "One thing before you start",
    description: "Autosave is on. Nothing on this page needs a save button.",
    step: 1,
    total: 1,
    side: "bottom",
    onNext: undefined,
    onBack: undefined,
    children: (
      <Button variant="outline" type="button">
        Autosave
      </Button>
    ),
  },
};

/**
 * Placed above the anchor instead of below it. The arrow follows the popover
 * to whichever side it lands on, so the pointer never detaches from the target
 * when there is no room underneath.
 */
export const ArrowFlip: Story = {
  args: {
    title: "Your renders land here",
    description: "Finished clips appear in this tray. Nothing is lost if you navigate away.",
    step: 4,
    total: 4,
    side: "top",
    align: "start",
    children: (
      <Button variant="outline" type="button">
        Library
      </Button>
    ),
  },
};
