import type { ComponentDocs } from "@/lib/component-docs";
import {
  NoProvenance,
  PromptAsCaption,
  ReproducibleParams,
  SpansFeedRemix,
} from "./asset-detail.examples";

/**
 * Seeded from docs/design-system/component-specs.md#f3-asset-detail.
 * Plain data read by a Server Component; examples live in the client sidecar.
 */
export const AssetDetailDocs: ComponentDocs = {
  whatItIs:
    "The lightbox for a single result: the media at full size beside a provenance rail carrying the prompt, the parameters that produced it, the cost, and the three handoff verbs — Copy prompt, Remix, Edit. Phrases within the prompt can be marked selectable, and clicking one hands that exact text to Remix.",
  whyItMatters:
    "Opening a result full-size is almost never about looking at it. It is about doing it again, slightly differently — which means the prompt is editable material, not a caption underneath the picture. Highlighting the phrases worth changing and feeding a clicked phrase straight into Remix is what turns a viewer into a starting point. The parameters matter for the same reason but a stricter one: seed and sampler are what make a result reproducible at all, so they render through A10 `stat-readout` — the same grid N5 `run-inspector` uses, down to its em-dash for a value that is missing — and they are copyable. A lightbox that shows a beautiful image and none of what made it is a dead end.",
  evidence: ["Midjourney", "Playground", "Freepik"],
  anatomy: [
    { slot: "asset-detail", note: "The dialog surface." },
    { slot: "asset-detail-media", note: "The result at full size. Opaque — any media works." },
    { slot: "asset-detail-rail", note: "The provenance column beside the media." },
    { slot: "asset-detail-prompt", note: "The prompt, segmented into plain and selectable runs." },
    { slot: "asset-detail-span", note: "One highlighted phrase. A button when selectable, a mark when not." },
    { slot: "asset-detail-verbs", note: "Copy prompt · Remix · Edit, always in that order." },
    { slot: "stat-readout", note: "A10, rendering the params grid — the same one N5 uses." },
    { slot: "asset-detail-cost", note: "What this result cost, via the shared formatter." },
    { slot: "asset-detail-more", note: "More-like-this suggestions, supplied by you." },
  ],
  usage:
    "Control `open` yourself and pass `media` as whatever the result actually is — the component treats it as opaque. Give `prompt` the full text and `highlightedSpans` the character ranges worth reusing; wire `onSpanSelect` and it will hand you the exact substring plus its range, ready to seed a remix. Pass `params` in A10's shape and mark seed and sampler `copyable`. All three verbs always render; supplying a handler is what enables one, so a dialog with no `onRemix` still shows Remix, greyed.",
  dos: [
    {
      text: "Highlight the phrases someone would actually want to change, and wire onSpanSelect so a click starts a remix.",
      example: <SpansFeedRemix />,
    },
    {
      text: "Include seed and sampler, and mark them copyable — they are what make the result reproducible.",
      example: <ReproducibleParams />,
    },
  ],
  donts: [
    {
      text: "Don't treat the prompt as a caption; without onSpanSelect and onRemix the dialog is a dead end.",
      example: <PromptAsCaption />,
    },
    {
      text: "Don't ship provenance without a seed — the result can be admired but never reproduced.",
      example: <NoProvenance />,
    },
  ],
  pitfalls: [
    "`highlightedSpans` are character offsets into `prompt`, so they go stale the moment the prompt is reworded. Derive them (indexOf, or from whatever produced them) rather than hard-coding numbers.",
    "Overlapping, reversed and out-of-range spans are dropped or clamped rather than throwing, and the full prompt always renders exactly once. That means a bad range fails silently — if a highlight does not appear, check the offsets.",
    "A span with no `onSpanSelect` renders as a `<mark>` instead of a button. That is intentional (the highlight is still information) but it also means forgetting the handler produces something that looks interactive and is not.",
    "The verbs are always present and disable themselves without handlers, so the set of three reads the same everywhere. If you need a genuinely different action set, that is F4 `action-stack`, not this.",
    "`params` is A10's shape verbatim, which is what keeps this grid and N5 `run-inspector` identical. Reshaping it here would fork provenance rendering across the registry.",
  ],
};
