import type { Meta, StoryObj } from "@storybook/react-vite";
import { Clock, Palette, Sparkles, Wand2 } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

const meta: Meta<typeof Tabs> = {
  title: "shadcn/ui/Tabs",
  component: Tabs,
  parameters: { layout: "centered" },
};
export default meta;

type Story = StoryObj<typeof Tabs>;

const styles = [
  { id: "photoreal", label: "Photoreal", desc: "Crisp, true-to-life detail" },
  { id: "anime", label: "Anime", desc: "Cel-shaded, bold linework" },
  { id: "3d", label: "3D Render", desc: "Soft global illumination" },
  { id: "watercolor", label: "Watercolor", desc: "Loose, organic bleeds" },
];

const history = [
  { id: "gen-8842", prompt: "Neon koi swimming through a rainstorm", time: "2m ago", credits: 4 },
  { id: "gen-8839", prompt: "Brutalist library at golden hour", time: "18m ago", credits: 4 },
  { id: "gen-8831", prompt: "Cartographer's desk, candlelit, top-down", time: "1h ago", credits: 6 },
];

export const Default: Story = {
  // defaultValue selects the first tab ("prompt") so it is visible on load.
  render: () => (
    <Tabs defaultValue="prompt" className="w-[420px]">
      <TabsList>
        <TabsTrigger value="prompt">
          <Wand2 />
          Prompt
        </TabsTrigger>
        <TabsTrigger value="style">
          <Palette />
          Style
        </TabsTrigger>
        <TabsTrigger value="history">
          <Clock />
          History
        </TabsTrigger>
      </TabsList>

      <TabsContent value="prompt" className="mt-3 space-y-3">
        <p className="text-sm font-medium">Describe your image</p>
        <Textarea
          defaultValue="A lone lighthouse on a cliff at dusk, long exposure, bioluminescent waves crashing below, cinematic, 35mm"
          className="min-h-28"
        />
        <p className="text-xs text-muted-foreground">
          Nova v3 · ~4 credits per render · 1024 × 1024
        </p>
      </TabsContent>

      <TabsContent value="style" className="mt-3 space-y-2">
        <p className="text-sm font-medium">Pick a base style</p>
        <div className="grid grid-cols-2 gap-2">
          {styles.map((s) => (
            <div
              key={s.id}
              className="rounded-lg border border-input p-2.5 transition-colors hover:bg-muted"
            >
              <p className="text-sm font-medium">{s.label}</p>
              <p className="text-xs text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="history" className="mt-3 space-y-2">
        {history.map((h) => (
          <div
            key={h.id}
            className="flex items-start justify-between gap-3 rounded-lg border border-input p-2.5"
          >
            <div className="min-w-0">
              <p className="truncate text-sm">{h.prompt}</p>
              <p className="text-xs text-muted-foreground">
                {h.id} · {h.time}
              </p>
            </div>
            <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
              {h.credits} cr
            </span>
          </div>
        ))}
      </TabsContent>
    </Tabs>
  ),
};

export const LineVariant: Story = {
  render: () => (
    <Tabs defaultValue="prompt" className="w-[380px]">
      <TabsList variant="line">
        <TabsTrigger value="prompt">
          <Sparkles />
          Prompt
        </TabsTrigger>
        <TabsTrigger value="style">
          <Palette />
          Style
        </TabsTrigger>
      </TabsList>
      <TabsContent value="prompt" className="mt-3 text-sm text-muted-foreground">
        Write a prompt to generate your first variation.
      </TabsContent>
      <TabsContent value="style" className="mt-3 text-sm text-muted-foreground">
        Style presets shape lighting, color, and texture.
      </TabsContent>
    </Tabs>
  ),
};
