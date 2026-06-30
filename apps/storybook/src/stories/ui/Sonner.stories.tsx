import type { Meta, StoryObj } from "@storybook/react-vite";
import { Sparkles, Coins, ImageOff } from "lucide-react";
import { toast } from "sonner";

import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";

const meta: Meta<typeof Toaster> = {
  title: "shadcn/ui/Sonner",
  component: Toaster,
  parameters: { layout: "centered" },
};

export default meta;

type Story = StoryObj<typeof Toaster>;

export const Default: Story = {
  render: () => (
    <div className="flex flex-col items-center gap-3">
      <Button
        onClick={() =>
          toast.success("Image generated — 4 variations ready", {
            description: "Aurora XL · 1024×1024 · 28 steps",
          })
        }
      >
        <Sparkles className="size-4" />
        Generate image
      </Button>
      <Toaster />
    </div>
  ),
};

export const Variants: Story = {
  render: () => (
    <div className="flex flex-col items-center gap-3">
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button
          variant="outline"
          onClick={() =>
            toast.success("Image generated — 4 variations ready", {
              description: "Aurora XL · 1024×1024 · 28 steps",
            })
          }
        >
          <Sparkles className="size-4" />
          Success
        </Button>
        <Button
          variant="outline"
          onClick={() =>
            toast.error("Generation failed", {
              description: "The prompt was flagged by the safety filter.",
            })
          }
        >
          <ImageOff className="size-4" />
          Error
        </Button>
        <Button
          variant="outline"
          onClick={() =>
            toast.warning("Low on credits", {
              description: "You have 42 credits left this cycle.",
            })
          }
        >
          <Coins className="size-4" />
          Warning
        </Button>
        <Button
          variant="outline"
          onClick={() =>
            toast.info("Model updated", {
              description: "Aurora XL v2.3 is now the default.",
            })
          }
        >
          Info
        </Button>
      </div>
      <Toaster />
    </div>
  ),
};

export const WithAction: Story = {
  render: () => (
    <div className="flex flex-col items-center gap-3">
      <Button
        onClick={() =>
          toast("Upscale queued", {
            description: "“neon koi pond at dusk” → 4K",
            action: {
              label: "Cancel",
              onClick: () => toast.info("Upscale cancelled"),
            },
          })
        }
      >
        Upscale to 4K
      </Button>
      <Toaster />
    </div>
  ),
};

export const LoadingPromise: Story = {
  render: () => (
    <div className="flex flex-col items-center gap-3">
      <Button
        onClick={() =>
          toast.promise(
            new Promise((resolve) => setTimeout(resolve, 2200)),
            {
              loading: "Rendering 4 variations…",
              success: "Done — 4 variations ready",
              error: "Render failed, please retry",
            }
          )
        }
      >
        <Sparkles className="size-4" />
        Render with status
      </Button>
      <Toaster />
    </div>
  ),
};
