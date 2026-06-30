import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  ModelSelector,
  ModelSelectorContent,
  ModelSelectorEmpty,
  ModelSelectorGroup,
  ModelSelectorInput,
  ModelSelectorItem,
  ModelSelectorList,
  ModelSelectorLogo,
  ModelSelectorName,
  ModelSelectorSeparator,
  ModelSelectorTrigger,
} from "@/components/ai-elements/model-selector";

const meta: Meta<typeof ModelSelector> = {
  title: "AI Elements/Model Selector",
  component: ModelSelector,
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof ModelSelector>;

const models = [
  { id: "gpt-4o", name: "GPT-4o", provider: "openai" as const },
  { id: "o3", name: "o3", provider: "openai" as const },
  { id: "claude-opus-4", name: "Claude Opus 4", provider: "anthropic" as const },
  {
    id: "gemini-2-flash",
    name: "Gemini 2.0 Flash",
    provider: "google" as const,
  },
];

export const Default: Story = {
  render: () => {
    const [open, setOpen] = React.useState(false);
    const [selected, setSelected] = React.useState(models[0]);

    return (
      <ModelSelector onOpenChange={setOpen} open={open}>
        <ModelSelectorTrigger render={<Button variant="outline" />}>
          <ModelSelectorLogo provider={selected.provider} />
          {selected.name}
        </ModelSelectorTrigger>
        <ModelSelectorContent>
          <ModelSelectorInput placeholder="Search models…" />
          <ModelSelectorList>
            <ModelSelectorEmpty>No models found.</ModelSelectorEmpty>
            <ModelSelectorGroup heading="Available models">
              {models.map((model) => (
                <ModelSelectorItem
                  key={model.id}
                  onSelect={() => {
                    setSelected(model);
                    setOpen(false);
                  }}
                  value={model.name}
                >
                  <ModelSelectorLogo provider={model.provider} />
                  <ModelSelectorName>{model.name}</ModelSelectorName>
                </ModelSelectorItem>
              ))}
            </ModelSelectorGroup>
            <ModelSelectorSeparator />
          </ModelSelectorList>
        </ModelSelectorContent>
      </ModelSelector>
    );
  },
};
