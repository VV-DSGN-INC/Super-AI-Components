import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupText,
  InputGroupInput,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import { SearchIcon, SparklesIcon, SendIcon } from "lucide-react";

const meta: Meta<typeof InputGroup> = {
  title: "shadcn/ui/Input Group",
  component: InputGroup,
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof InputGroup>;

export const Search: Story = {
  render: () => (
    <InputGroup className="w-80">
      <InputGroupAddon>
        <SearchIcon />
      </InputGroupAddon>
      <InputGroupInput placeholder="Search your renders..." />
    </InputGroup>
  ),
};

export const WithButton: Story = {
  render: () => (
    <InputGroup className="w-80">
      <InputGroupAddon>
        <SparklesIcon />
      </InputGroupAddon>
      <InputGroupInput placeholder="Describe an image..." />
      <InputGroupAddon align="inline-end">
        <InputGroupButton variant="default" size="sm">
          Generate
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  ),
};

export const WithPrefixText: Story = {
  render: () => (
    <InputGroup className="w-80">
      <InputGroupAddon>
        <InputGroupText>aurora.studio/r/</InputGroupText>
      </InputGroupAddon>
      <InputGroupInput defaultValue="neon-city-48213" />
    </InputGroup>
  ),
};

export const PromptComposer: Story = {
  render: () => (
    <InputGroup className="w-96">
      <InputGroupTextarea
        rows={3}
        placeholder="cyberpunk alley at night, heavy rain, neon reflections..."
      />
      <InputGroupAddon align="block-end">
        <InputGroupText>Aurora-XL &middot; 4 credits</InputGroupText>
        <InputGroupButton
          variant="default"
          size="icon-sm"
          className="ml-auto"
          aria-label="Send"
        >
          <SendIcon />
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  ),
};
