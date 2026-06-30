import type { Meta, StoryObj } from "@storybook/react-vite";
import { Image as ImageIcon, Settings, Sparkles } from "lucide-react";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

const meta: Meta<typeof ResizablePanelGroup> = {
  title: "shadcn/ui/Resizable",
  component: ResizablePanelGroup,
  parameters: { layout: "fullscreen" },
};
export default meta;

type Story = StoryObj<typeof ResizablePanelGroup>;

export const Default: Story = {
  render: () => (
    <ResizablePanelGroup
      orientation="horizontal"
      className="h-[420px] max-w-4xl rounded-lg border"
    >
      <ResizablePanel defaultSize={28} minSize={18}>
        <div className="flex h-full flex-col gap-3 p-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Sparkles className="size-4" />
            Prompt
          </div>
          <textarea
            readOnly
            className="flex-1 resize-none rounded-md border bg-muted/40 p-2 text-xs text-muted-foreground outline-none"
            value="A bioluminescent jellyfish drifting through a dark ocean, cinematic, volumetric light, ultra detailed, 35mm"
          />
          <div className="rounded-md bg-accent/40 p-2 text-xs text-muted-foreground">
            Negative: blurry, watermark, text
          </div>
        </div>
      </ResizablePanel>

      <ResizableHandle withHandle />

      <ResizablePanel defaultSize={48} minSize={30}>
        <div className="flex h-full flex-col items-center justify-center gap-2 bg-muted/20 p-4">
          <ImageIcon className="size-8 text-muted-foreground" />
          <span className="text-sm font-medium">Preview canvas</span>
          <span className="text-xs text-muted-foreground">
            1024 × 1024 · Standard quality
          </span>
        </div>
      </ResizablePanel>

      <ResizableHandle withHandle />

      <ResizablePanel defaultSize={24} minSize={16}>
        <div className="flex h-full flex-col gap-3 p-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Settings className="size-4" />
            Settings
          </div>
          <dl className="flex flex-col gap-2 text-xs">
            {[
              ["Model", "nova-diffusion-3"],
              ["Steps", "32"],
              ["Guidance", "7.5"],
              ["Seed", "184203"],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <dt className="text-muted-foreground">{k}</dt>
                <dd className="font-medium tabular-nums">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  ),
};

export const Vertical: Story = {
  render: () => (
    <ResizablePanelGroup
      orientation="vertical"
      className="h-[420px] max-w-md rounded-lg border"
    >
      <ResizablePanel defaultSize={65} minSize={30}>
        <div className="flex h-full flex-col items-center justify-center gap-2 bg-muted/20">
          <ImageIcon className="size-7 text-muted-foreground" />
          <span className="text-sm font-medium">Generated output</span>
        </div>
      </ResizablePanel>

      <ResizableHandle withHandle />

      <ResizablePanel defaultSize={35} minSize={20}>
        <div className="flex h-full flex-col gap-2 p-4">
          <span className="text-sm font-medium">Render log</span>
          <div className="flex-1 overflow-auto font-mono text-[11px] leading-relaxed text-muted-foreground">
            <p>[00:00] Loading model nova-diffusion-3…</p>
            <p>[00:02] Encoding prompt (77 tokens)</p>
            <p>[00:03] Sampling 32 steps</p>
            <p>[00:14] Decoding latents</p>
            <p>[00:15] Done · 12 credits spent</p>
          </div>
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  ),
};
