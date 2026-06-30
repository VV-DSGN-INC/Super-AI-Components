import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Plan,
  PlanAction,
  PlanContent,
  PlanDescription,
  PlanFooter,
  PlanHeader,
  PlanTitle,
  PlanTrigger,
} from "@/components/ai-elements/plan";
import { CheckIcon } from "lucide-react";

const meta: Meta<typeof Plan> = {
  title: "AI Elements/Plan",
  component: Plan,
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof Plan>;

const steps = [
  "Research short-form video best practices",
  "Draft a 4-scene script (hook, problem, solution, CTA)",
  "Generate placeholder keyframes for each scene",
  "Render a 20-second draft at 1080p",
  "Add captions and a synth-pop music bed",
];

export const Default: Story = {
  render: () => (
    <div className="w-[480px]">
      <Plan defaultOpen>
        <PlanHeader>
          <div className="space-y-1.5">
            <PlanTitle>Marketing video production plan</PlanTitle>
            <PlanDescription>
              Five steps to ship a 20-second promo for the analytics dashboard.
            </PlanDescription>
          </div>
          <PlanAction>
            <PlanTrigger />
          </PlanAction>
        </PlanHeader>
        <PlanContent>
          <ol className="space-y-3">
            {steps.map((step, index) => (
              <li className="flex items-start gap-2 text-sm" key={step}>
                <CheckIcon className="mt-0.5 size-4 shrink-0 text-green-600" />
                <span>
                  <span className="text-muted-foreground">{index + 1}. </span>
                  {step}
                </span>
              </li>
            ))}
          </ol>
        </PlanContent>
        <PlanFooter>
          <p className="text-muted-foreground text-xs">
            Estimated total time: about 4 minutes.
          </p>
        </PlanFooter>
      </Plan>
    </div>
  ),
};
