import type { Meta, StoryObj } from "@storybook/react-vite";
import { Clapperboard, Megaphone, Mic, Users } from "lucide-react";
import { expect, within } from "storybook/test";

import { OnboardingWizard, type OnboardingWizardStep } from "@/registry/super-ai/onboarding-wizard";
import { OnboardingWizardDocs } from "@/content/components/onboarding-wizard.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const meta: Meta<typeof OnboardingWizard> = {
  title: "Super AI/Onboarding Wizard",
  component: OnboardingWizard,
  parameters: { layout: "centered", docs: { page: componentDocsPage(OnboardingWizardDocs) } },
};

export default meta;
type Story = StoryObj<typeof OnboardingWizard>;

const STEPS: OnboardingWizardStep[] = [
  {
    id: "role",
    title: "What do you make?",
    description: "This picks the templates and sample project you land in.",
    choices: [
      {
        value: "marketing",
        label: "Marketing video",
        description: "Ads, social cuts, product clips",
        icon: <Megaphone className="size-4" />,
      },
      {
        value: "film",
        label: "Film and story",
        description: "Scenes, shot lists, longer edits",
        icon: <Clapperboard className="size-4" />,
      },
      {
        value: "voice",
        label: "Voice and audio",
        description: "Narration, dubbing, podcasts",
        icon: <Mic className="size-4" />,
      },
      {
        value: "team",
        label: "Something for my team",
        description: "Shared brand kit and review flow",
        icon: <Users className="size-4" />,
      },
    ],
    effect: "Sets your default aspect ratio, template set, and the sample project we open first.",
  },
  {
    id: "volume",
    title: "How much do you expect to make?",
    choices: [
      { value: "few", label: "A few a month", description: "Starter credit pack" },
      { value: "weekly", label: "Something most weeks", description: "Batch queue turned on" },
      { value: "daily", label: "Every day", description: "Concurrency raised to 4 renders" },
    ],
    effect: "Picks your credit pack and whether the batch queue starts on.",
  },
  {
    id: "brand",
    title: "Bring your brand in",
    description: "Optional — you can add this later from Settings.",
    content: (
      <p className="text-foreground text-sm">
        Drop a logo and two brand colours here and every template picks them up.
      </p>
    ),
    effect: "Applies your palette to every generated title card.",
    panel: (
      <div className="flex flex-col gap-1">
        <p className="text-foreground text-sm font-medium">Teams ship 3x faster with a brand kit</p>
        <p className="text-foreground/70 text-xs">
          Brand kits are shared across the workspace, so nobody re-picks the same blue twice.
        </p>
      </div>
    ),
    panelSide: "end",
  },
];

// Choice cards are real radios inside a group named by the question, and each
// step says what answering it changes.
export const ChoiceCards: Story = {
  args: { steps: STEPS, defaultAnswers: { role: "marketing" } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const group = canvas.getByRole("radiogroup", { name: "What do you make?" });
    await expect(within(group).getByRole("radio", { name: /Marketing video/ })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    await expect(within(group).getByRole("radio", { name: /Film and story/ })).toHaveAttribute(
      "aria-checked",
      "false",
    );
    const effect = canvasElement.querySelector('[data-slot="onboarding-wizard-effect"]');
    await expect(effect).toHaveTextContent("Sets your default aspect ratio");
  },
};

// The dots are decorative; the position, the total and how many remain are on
// a real progressbar and in visible text.
export const DotProgress: Story = {
  args: { steps: STEPS, defaultStep: "volume" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const progress = canvas.getByRole("progressbar", { name: "Setup progress: step 2 of 3" });
    await expect(progress).toHaveAttribute("aria-valuetext", "Step 2 of 3, 1 step remaining");
    await expect(canvas.getByText("1 to go")).toBeInTheDocument();
    await expect(canvasElement.querySelectorAll('[data-slot="onboarding-wizard-dot"]')).toHaveLength(3);
  },
};

// Every step is skippable, the last one included — shown on the last step,
// where a commit-shaped wizard would have dropped Skip.
export const Skippable: Story = {
  args: { steps: STEPS, defaultStep: "brand" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const skip = canvas.getByRole("button", { name: "Skip" });
    await expect(skip).toHaveAttribute("data-slot", "onboarding-wizard-skip");
    await expect(canvas.getByRole("button", { name: "Finish setup" })).toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: "Back" })).not.toBeDisabled();
  },
};

// The marketing pane is a prop on a step: same dots, same Skip, same primary.
export const SplitPanel: Story = {
  args: { steps: STEPS, defaultStep: "brand" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const panel = canvasElement.querySelector('[data-slot="onboarding-wizard-panel"]');
    await expect(panel).toHaveTextContent("Teams ship 3x faster with a brand kit");
    await expect(canvas.getByRole("progressbar", { name: "Setup progress: step 3 of 3" })).toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: "Skip" })).toBeInTheDocument();
  },
};
