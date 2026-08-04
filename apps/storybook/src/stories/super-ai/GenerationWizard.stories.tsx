import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";

import { CostChip } from "@/registry/super-ai/cost-chip";
import { ChoiceChip, ChoiceChips } from "@/registry/super-ai/choice-chips";
import { GenerationWizard, type GenerationWizardStep } from "@/registry/super-ai/generation-wizard";
import { GenerationWizardDocs } from "@/content/components/generation-wizard.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const meta: Meta<typeof GenerationWizard> = {
  title: "Super AI/Generation Wizard",
  component: GenerationWizard,
  parameters: { layout: "centered", docs: { page: componentDocsPage(GenerationWizardDocs) } },
};

export default meta;
type Story = StoryObj<typeof GenerationWizard>;

const STEPS: GenerationWizardStep[] = [
  {
    id: "model",
    title: "Choose model",
    description: "Pick the engine this generation runs on.",
    content: (
      <ChoiceChips defaultValue="fast">
        <ChoiceChip value="fast">Fast</ChoiceChip>
        <ChoiceChip value="quality">Quality</ChoiceChip>
      </ChoiceChips>
    ),
    preview: (
      <div className="flex flex-col items-center gap-2 text-center">
        <p className="text-foreground text-sm font-medium">Fast model</p>
        <CostChip amount={2} className="text-foreground" />
      </div>
    ),
  },
  {
    id: "style",
    title: "Set style",
    description: "Applied to every frame in this generation.",
    content: (
      <ChoiceChips defaultValue="cinematic">
        <ChoiceChip value="cinematic">Cinematic</ChoiceChip>
        <ChoiceChip value="anime">Anime</ChoiceChip>
      </ChoiceChips>
    ),
    preview: <p className="text-foreground text-center text-sm">Cinematic, 16:9, +1 credit</p>,
  },
  {
    id: "review",
    title: "Review",
    description: "Confirm before spending credits.",
    content: <p className="text-foreground text-sm">Fast model · Cinematic style · 1 clip</p>,
    preview: (
      <div className="flex flex-col items-center gap-2 text-center">
        <p className="text-foreground text-sm font-medium">Total cost</p>
        <CostChip amount={3} className="text-foreground" />
      </div>
    ),
  },
];

// The stepper: position and total are exposed programmatically (an
// accessible name on the step list), not only via the visual marker trail.
export const Stepper: Story = {
  args: { steps: STEPS },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const stepper = canvas.getByRole("list", { name: "Step 1 of 3" });
    await expect(stepper).toBeInTheDocument();
    // Scoped to the stepper itself: the active step's title ("Choose model")
    // is also echoed as the section-header heading for the content below it,
    // so an unscoped canvas.getByText would match both and throw.
    const current = within(stepper).getByText("Choose model").closest("[data-slot='generation-wizard-step']");
    await expect(current).toHaveAttribute("aria-current", "step");
  },
};

// The preview pane: it reflects the active step's choices, so the cost of a
// wrong choice is visible before Next — started mid-flow to show it isn't
// just the first step's content carried forward.
export const PreviewPane: Story = {
  args: { steps: STEPS, defaultStep: "style" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const preview = canvasElement.querySelector('[data-slot="generation-wizard-preview"]');
    await expect(preview).toHaveTextContent("Cinematic, 16:9, +1 credit");
    await expect(canvas.getByRole("list", { name: "Step 2 of 3" })).toBeInTheDocument();
  },
};

// Skip / Back / primary: started on the middle step so all three nav
// elements are visible together — Back and Skip secondary, only the primary
// advances.
export const SkipBackPrimary: Story = {
  args: { steps: STEPS, defaultStep: "style" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const back = canvas.getByRole("button", { name: "Back" });
    const skip = canvas.getByRole("button", { name: "Skip" });
    const next = canvas.getByRole("button", { name: "Next" });
    await expect(back).toHaveAttribute("data-slot", "generation-wizard-back");
    await expect(skip).toHaveAttribute("data-slot", "generation-wizard-skip");
    await expect(next).toHaveAttribute("data-slot", "generation-wizard-primary");
    await expect(back).not.toBeDisabled();
  },
};
