"use client";

import { Sparkles } from "lucide-react";

import { AssetDetail } from "@/registry/super-ai/asset-detail";

/** Live examples for asset-detail.docs.tsx — client sidecar, see the docs module. */

const PROMPT = "A red bicycle leaning on a sunlit wall, shot on 35mm film";
const spanFor = (phrase: string) => {
  const start = PROMPT.indexOf(phrase);
  return { start, end: start + phrase.length };
};

function Media() {
  return (
    <div className="bg-foreground/10 flex aspect-video w-full items-center justify-center">
      <Sparkles aria-hidden className="text-foreground/40 size-8" />
    </div>
  );
}

const FULL_PARAMS = [
  { label: "Model", value: "Flux 1.1 Pro" },
  { label: "Seed", value: "4471", copyable: true },
  { label: "Sampler", value: "Euler a", copyable: true },
  { label: "Steps", value: "28" },
];

/** DO — highlight the phrases worth reusing, so a click feeds Remix. */
export function SpansFeedRemix() {
  return (
    <AssetDetail
      open
      media={<Media />}
      prompt={PROMPT}
      highlightedSpans={[spanFor("a sunlit wall"), spanFor("35mm film")]}
      onSpanSelect={() => {}}
      params={FULL_PARAMS}
      onCopyPrompt={() => {}}
      onRemix={() => {}}
      onEdit={() => {}}
    />
  );
}

/** DO — seed and sampler copyable, because those are what make a result reproducible. */
export function ReproducibleParams() {
  return (
    <AssetDetail
      open
      media={<Media />}
      prompt={PROMPT}
      params={FULL_PARAMS}
      onCopyPrompt={() => {}}
      onRemix={() => {}}
      onEdit={() => {}}
    />
  );
}

/**
 * DON&apos;T — the prompt as a plain caption. Nothing here can be lifted into
 * a new generation, which is the one thing people open this dialog to do.
 */
export function PromptAsCaption() {
  return (
    <AssetDetail
      open
      media={<Media />}
      prompt={PROMPT}
      params={FULL_PARAMS}
      onCopyPrompt={() => {}}
      onEdit={() => {}}
    />
  );
}

/** DON&apos;T — provenance with no seed. The result can be admired but never reproduced. */
export function NoProvenance() {
  return (
    <AssetDetail
      open
      media={<Media />}
      prompt={PROMPT}
      params={[{ label: "Model", value: "Flux 1.1 Pro" }]}
      onCopyPrompt={() => {}}
      onRemix={() => {}}
      onEdit={() => {}}
    />
  );
}
