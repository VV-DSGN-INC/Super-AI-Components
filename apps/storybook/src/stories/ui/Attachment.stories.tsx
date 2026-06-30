import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  Attachment,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentContent,
  AttachmentTitle,
  AttachmentDescription,
  AttachmentActions,
  AttachmentAction,
} from "@/components/ui/attachment";
import { FileTextIcon, ImageIcon, XIcon } from "lucide-react";

const meta: Meta<typeof Attachment> = {
  title: "shadcn/ui/Attachment",
  component: Attachment,
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof Attachment>;

export const Default: Story = {
  render: () => (
    <Attachment className="w-72">
      <AttachmentMedia>
        <ImageIcon />
      </AttachmentMedia>
      <AttachmentContent>
        <AttachmentTitle>reference-moodboard.png</AttachmentTitle>
        <AttachmentDescription>2.4 MB &middot; 1920&times;1080</AttachmentDescription>
      </AttachmentContent>
      <AttachmentActions>
        <AttachmentAction aria-label="Remove">
          <XIcon />
        </AttachmentAction>
      </AttachmentActions>
    </Attachment>
  ),
};

export const States: Story = {
  render: () => (
    <div className="flex w-72 flex-col gap-3">
      <Attachment state="uploading">
        <AttachmentMedia>
          <FileTextIcon />
        </AttachmentMedia>
        <AttachmentContent>
          <AttachmentTitle>style-guide.pdf</AttachmentTitle>
          <AttachmentDescription>Uploading&hellip; 64%</AttachmentDescription>
        </AttachmentContent>
      </Attachment>
      <Attachment state="processing">
        <AttachmentMedia>
          <ImageIcon />
        </AttachmentMedia>
        <AttachmentContent>
          <AttachmentTitle>sketch-input.jpg</AttachmentTitle>
          <AttachmentDescription>Analyzing depth map&hellip;</AttachmentDescription>
        </AttachmentContent>
      </Attachment>
      <Attachment state="error">
        <AttachmentMedia>
          <FileTextIcon />
        </AttachmentMedia>
        <AttachmentContent>
          <AttachmentTitle>raw-prompt.txt</AttachmentTitle>
          <AttachmentDescription>Upload failed &middot; retry</AttachmentDescription>
        </AttachmentContent>
      </Attachment>
    </div>
  ),
};

export const Gallery: Story = {
  render: () => (
    <AttachmentGroup className="w-80">
      {["render-01", "render-02", "render-03", "render-04"].map((name) => (
        <Attachment key={name} orientation="vertical">
          <AttachmentMedia variant="image">
            <div className="size-full bg-gradient-to-br from-fuchsia-500 to-cyan-500" />
          </AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle>{name}.png</AttachmentTitle>
            <AttachmentDescription>Aurora-XL</AttachmentDescription>
          </AttachmentContent>
        </Attachment>
      ))}
    </AttachmentGroup>
  ),
};
