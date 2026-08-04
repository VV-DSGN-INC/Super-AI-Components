import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import {
  ParameterPanel,
  ParameterSegmented,
  ParameterSlider,
  ParameterTabs,
} from "@/registry/super-ai/parameter-panel";
import { ResetAffordance } from "@/registry/super-ai/reset-affordance";
import { ParameterPanelDocs } from "@/content/components/parameter-panel.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const meta: Meta<typeof ParameterPanel> = {
  title: "Super AI/Parameter Panel",
  component: ParameterPanel,
  parameters: { layout: "centered", docs: { page: componentDocsPage(ParameterPanelDocs) } },
  decorators: [(Story) => <div className="w-80"><Story /></div>],
};

export default meta;
type Story = StoryObj<typeof ParameterPanel>;

export const SliderUnit: Story = {
  render: (args) => (
    <ParameterPanel {...args}>
      <ParameterSlider
        label="Guidance"
        value={7}
        min={0}
        max={20}
        step={0.5}
        unit=""
        endpoints={["More creative", "More literal"]}
        onValueChange={() => {}}
      />
    </ParameterPanel>
  ),
};

export const Segmented: Story = {
  render: (args) => (
    <ParameterPanel {...args}>
      <ParameterSegmented
        label="Quality"
        options={[
          { value: "draft", label: "Draft" },
          { value: "standard", label: "Standard" },
          { value: "high", label: "High" },
        ]}
        defaultValue="standard"
        onValueChange={() => {}}
      />
    </ParameterPanel>
  ),
};

export const Tabbed: Story = {
  render: () => (
    <ParameterTabs
      groups={[
        {
          value: "basic",
          label: "Basic",
          content: (
            <ParameterSlider
              label="Steps"
              value={20}
              min={1}
              max={50}
              endpoints={["Faster", "More detail"]}
              onValueChange={() => {}}
            />
          ),
        },
        {
          value: "advanced",
          label: "Advanced",
          content: (
            <ParameterSlider
              label="Seed"
              value={8}
              min={0}
              max={9999}
              description="Fixing the seed reproduces the same result across runs with identical settings."
              onValueChange={() => {}}
            />
          ),
        },
      ]}
    />
  ),
};

export const ResetAll: Story = {
  args: { title: "Sampling", modified: true },
  render: function ResetAllStory(args) {
    const [guidance, setGuidance] = useState(12);
    return (
      <ParameterPanel {...args} modified={guidance !== 7} onResetAll={() => setGuidance(7)}>
        <ParameterSlider
          label="Guidance"
          value={guidance}
          min={0}
          max={20}
          endpoints={["More creative", "More literal"]}
          onValueChange={setGuidance}
          reset={
            guidance !== 7 ? (
              <ResetAffordance state="modified" onReset={() => setGuidance(7)} />
            ) : (
              <ResetAffordance state="default" />
            )
          }
        />
      </ParameterPanel>
    );
  },
};

export const InlineEducation: Story = {
  render: (args) => (
    <ParameterPanel {...args}>
      <ParameterSlider
        label="Temperature"
        value={0.7}
        min={0}
        max={1}
        step={0.1}
        description="Controls how much the model varies its wording between runs. Higher values read as more creative, lower as more consistent."
        onValueChange={() => {}}
      />
    </ParameterPanel>
  ),
};
