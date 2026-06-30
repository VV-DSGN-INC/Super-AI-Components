import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  Avatar,
  AvatarImage,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarBadge,
} from "@/components/ui/avatar";

const meta: Meta<typeof Avatar> = {
  title: "shadcn/ui/Avatar",
  component: Avatar,
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof Avatar>;

export const Default: Story = {
  render: () => (
    <Avatar>
      <AvatarImage
        src="https://i.pravatar.cc/80?img=12"
        alt="Maya Chen"
      />
      <AvatarFallback>MC</AvatarFallback>
    </Avatar>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-end gap-4">
      <Avatar size="sm">
        <AvatarFallback>AI</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarImage src="https://i.pravatar.cc/80?img=32" alt="Jonas" />
        <AvatarFallback>JR</AvatarFallback>
      </Avatar>
      <Avatar size="lg">
        <AvatarImage src="https://i.pravatar.cc/120?img=5" alt="Priya" />
        <AvatarFallback>PV</AvatarFallback>
      </Avatar>
    </div>
  ),
};

export const WithStatusBadge: Story = {
  render: () => (
    <Avatar size="lg">
      <AvatarImage src="https://i.pravatar.cc/120?img=15" alt="Online artist" />
      <AvatarFallback>LK</AvatarFallback>
      <AvatarBadge className="bg-emerald-500" />
    </Avatar>
  ),
};

export const Collaborators: Story = {
  render: () => (
    <AvatarGroup>
      <Avatar>
        <AvatarImage src="https://i.pravatar.cc/80?img=1" alt="Collaborator" />
        <AvatarFallback>A1</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarImage src="https://i.pravatar.cc/80?img=2" alt="Collaborator" />
        <AvatarFallback>A2</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarImage src="https://i.pravatar.cc/80?img=3" alt="Collaborator" />
        <AvatarFallback>A3</AvatarFallback>
      </Avatar>
      <AvatarGroupCount>+9</AvatarGroupCount>
    </AvatarGroup>
  ),
};
