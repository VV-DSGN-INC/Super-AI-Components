import type { Meta, StoryObj } from "@storybook/react-vite";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { ArrowUp, Command, CornerDownLeft } from "lucide-react";

const meta: Meta<typeof Kbd> = {
  title: "shadcn/ui/Kbd",
  component: Kbd,
  parameters: { layout: "centered" },
};
export default meta;
type Story = StoryObj<typeof Kbd>;

export const Default: Story = {
  render: () => <Kbd>Enter</Kbd>,
};

export const Shortcuts: Story = {
  render: () => (
    <div className="flex flex-col gap-4 text-sm">
      <div className="flex items-center justify-between gap-6">
        <span className="text-muted-foreground">Generate image</span>
        <KbdGroup>
          <Kbd>
            <Command />
          </Kbd>
          <Kbd>
            <CornerDownLeft />
          </Kbd>
        </KbdGroup>
      </div>
      <div className="flex items-center justify-between gap-6">
        <span className="text-muted-foreground">New chat thread</span>
        <KbdGroup>
          <Kbd>
            <Command />
          </Kbd>
          <Kbd>K</Kbd>
        </KbdGroup>
      </div>
      <div className="flex items-center justify-between gap-6">
        <span className="text-muted-foreground">Upscale selection</span>
        <KbdGroup>
          <Kbd>
            <Command />
          </Kbd>
          <Kbd>
            <ArrowUp />
          </Kbd>
          <Kbd>U</Kbd>
        </KbdGroup>
      </div>
    </div>
  ),
};

export const InlineCopy: Story = {
  render: () => (
    <p className="max-w-sm text-sm text-muted-foreground">
      Press <Kbd>/</Kbd> to focus the prompt box, then{" "}
      <KbdGroup>
        <Kbd>
          <Command />
        </Kbd>
        <Kbd>Enter</Kbd>
      </KbdGroup>{" "}
      to send it to the model.
    </p>
  ),
};
