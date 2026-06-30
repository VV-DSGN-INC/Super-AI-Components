import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  ButtonGroup,
  ButtonGroupText,
  ButtonGroupSeparator,
} from "@/components/ui/button-group";
import { Button } from "@/components/ui/button";
import {
  AlignLeftIcon,
  AlignCenterIcon,
  AlignRightIcon,
  MinusIcon,
  PlusIcon,
  SparklesIcon,
} from "lucide-react";

const meta: Meta<typeof ButtonGroup> = {
  title: "shadcn/ui/Button Group",
  component: ButtonGroup,
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof ButtonGroup>;

export const Default: Story = {
  render: () => (
    <ButtonGroup>
      <Button variant="outline">1:1</Button>
      <Button variant="outline">16:9</Button>
      <Button variant="outline">9:16</Button>
      <Button variant="outline">4:3</Button>
    </ButtonGroup>
  ),
};

export const IconToolbar: Story = {
  render: () => (
    <ButtonGroup>
      <Button variant="outline" size="icon" aria-label="Align left">
        <AlignLeftIcon />
      </Button>
      <Button variant="outline" size="icon" aria-label="Align center">
        <AlignCenterIcon />
      </Button>
      <Button variant="outline" size="icon" aria-label="Align right">
        <AlignRightIcon />
      </Button>
    </ButtonGroup>
  ),
};

export const WithText: Story = {
  render: () => (
    <ButtonGroup>
      <ButtonGroupText>Steps</ButtonGroupText>
      <Button variant="outline" size="icon" aria-label="Decrease">
        <MinusIcon />
      </Button>
      <ButtonGroupText>30</ButtonGroupText>
      <Button variant="outline" size="icon" aria-label="Increase">
        <PlusIcon />
      </Button>
    </ButtonGroup>
  ),
};

export const SplitAction: Story = {
  render: () => (
    <ButtonGroup>
      <Button>
        <SparklesIcon data-icon="inline-start" />
        Generate
      </Button>
      <ButtonGroupSeparator />
      <Button aria-label="More options">⌄</Button>
    </ButtonGroup>
  ),
};

export const Vertical: Story = {
  render: () => (
    <ButtonGroup orientation="vertical">
      <Button variant="outline">Aurora-XL</Button>
      <Button variant="outline">Sketch-v3</Button>
      <Button variant="outline">Lumen-Turbo</Button>
    </ButtonGroup>
  ),
};
