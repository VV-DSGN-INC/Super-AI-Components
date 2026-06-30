import type { Meta, StoryObj } from "@storybook/react-vite";
import { ImageIcon } from "lucide-react";

import { ScrollArea } from "@/components/ui/scroll-area";

const meta: Meta<typeof ScrollArea> = {
  title: "shadcn/ui/Scroll Area",
  component: ScrollArea,
  parameters: { layout: "centered" },
};
export default meta;

type Story = StoryObj<typeof ScrollArea>;

const history = [
  { prompt: "neon koi pond at dusk", model: "nova-3", time: "2m ago", credits: 4 },
  { prompt: "isometric cyberpunk diner", model: "nova-3", time: "8m ago", credits: 4 },
  { prompt: "watercolor mountain range", model: "nova-2", time: "21m ago", credits: 1 },
  { prompt: "portrait, soft rim light", model: "nova-3-ultra", time: "34m ago", credits: 12 },
  { prompt: "vintage sci-fi book cover", model: "nova-3", time: "1h ago", credits: 4 },
  { prompt: "low-poly forest island", model: "nova-2", time: "1h ago", credits: 1 },
  { prompt: "macro shot of dewy spiderweb", model: "nova-3-ultra", time: "2h ago", credits: 12 },
  { prompt: "brutalist concrete chapel", model: "nova-3", time: "3h ago", credits: 4 },
  { prompt: "claymation robot chef", model: "nova-3", time: "4h ago", credits: 4 },
  { prompt: "aurora over a glass city", model: "nova-3-ultra", time: "5h ago", credits: 12 },
  { prompt: "retro arcade cabinet rows", model: "nova-2", time: "6h ago", credits: 1 },
  { prompt: "origami crane flock", model: "nova-3", time: "Yesterday", credits: 4 },
];

export const Default: Story = {
  render: () => (
    <ScrollArea className="h-80 w-80 rounded-lg border">
      <div className="flex flex-col">
        <div className="sticky top-0 bg-background px-3 py-2 text-xs font-medium text-muted-foreground">
          Generation history
        </div>
        {history.map((item, i) => (
          <div
            key={i}
            className="flex items-center gap-3 border-t px-3 py-2.5 first:border-t-0"
          >
            <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted">
              <ImageIcon className="size-4 text-muted-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{item.prompt}</p>
              <p className="text-xs text-muted-foreground">
                {item.model} · {item.time}
              </p>
            </div>
            <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
              {item.credits} cr
            </span>
          </div>
        ))}
      </div>
    </ScrollArea>
  ),
};

export const Prompts: Story = {
  render: () => (
    <ScrollArea className="h-72 w-96 rounded-lg border p-4">
      <div className="flex flex-col gap-3 text-sm">
        <h4 className="font-medium">Saved prompt snippets</h4>
        {Array.from({ length: 18 }, (_, i) => (
          <p key={i} className="text-muted-foreground">
            {i + 1}. {SNIPPETS[i % SNIPPETS.length]}
          </p>
        ))}
      </div>
    </ScrollArea>
  ),
};

const SNIPPETS = [
  "ultra detailed, volumetric lighting, 35mm film grain",
  "soft studio key light, shallow depth of field",
  "isometric, pastel palette, clean vector edges",
  "cinematic, golden hour, atmospheric haze",
  "hand-drawn ink, cross-hatching, high contrast",
  "photoreal product shot on seamless backdrop",
];
