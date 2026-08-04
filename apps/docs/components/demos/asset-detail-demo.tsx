"use client";

import { Sparkles } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { AssetDetail } from "@/registry/super-ai/asset-detail";

const PROMPT = "A red bicycle leaning on a sunlit wall, shot on 35mm film";

const spanFor = (phrase: string) => {
  const start = PROMPT.indexOf(phrase);
  return { start, end: start + phrase.length };
};

export default function AssetDetailDemo() {
  const [open, setOpen] = React.useState(false);
  const [remixing, setRemixing] = React.useState<string>();

  return (
    <div className="flex flex-col items-start gap-3">
      <Button onClick={() => setOpen(true)}>Open result</Button>
      {remixing ? (
        <p className="text-foreground text-xs">Remixing from: &ldquo;{remixing}&rdquo;</p>
      ) : null}

      <AssetDetail
        open={open}
        onOpenChange={setOpen}
        prompt={PROMPT}
        highlightedSpans={[spanFor("a sunlit wall"), spanFor("35mm film")]}
        onSpanSelect={(text) => setRemixing(text)}
        media={
          <div className="bg-foreground/10 flex aspect-video w-full items-center justify-center">
            <Sparkles aria-hidden className="text-foreground/40 size-10" />
          </div>
        }
        params={[
          { label: "Model", value: "Flux 1.1 Pro" },
          { label: "Seed", value: "4471", copyable: true },
          { label: "Sampler", value: "Euler a", copyable: true },
          { label: "Steps", value: "28" },
          { label: "Guidance" },
        ]}
        cost={{ amount: 17 }}
        onCopyPrompt={() => {}}
        onRemix={() => setOpen(false)}
        onEdit={() => setOpen(false)}
      />
    </div>
  );
}
