import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  WebPreview,
  WebPreviewBody,
  WebPreviewConsole,
  WebPreviewNavigation,
  WebPreviewNavigationButton,
  WebPreviewUrl,
} from "@/components/ai-elements/web-preview";
import { ArrowLeftIcon, ArrowRightIcon, RotateCwIcon } from "lucide-react";

const meta: Meta<typeof WebPreview> = {
  title: "AI Elements/Web Preview",
  component: WebPreview,
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof WebPreview>;

const logs = [
  {
    level: "log" as const,
    message: "[vite] connected.",
    timestamp: new Date("2026-06-30T10:00:00"),
  },
  {
    level: "warn" as const,
    message: "Video element will autoplay muted to satisfy browser policy.",
    timestamp: new Date("2026-06-30T10:00:01"),
  },
];

export const Default: Story = {
  render: () => (
    <div className="h-[480px] w-[640px]">
      <WebPreview defaultUrl="https://vercel.com">
        <WebPreviewNavigation>
          <WebPreviewNavigationButton disabled tooltip="Back">
            <ArrowLeftIcon className="size-4" />
          </WebPreviewNavigationButton>
          <WebPreviewNavigationButton disabled tooltip="Forward">
            <ArrowRightIcon className="size-4" />
          </WebPreviewNavigationButton>
          <WebPreviewNavigationButton tooltip="Reload">
            <RotateCwIcon className="size-4" />
          </WebPreviewNavigationButton>
          <WebPreviewUrl />
        </WebPreviewNavigation>
        <WebPreviewBody />
        <WebPreviewConsole logs={logs} />
      </WebPreview>
    </div>
  ),
};
