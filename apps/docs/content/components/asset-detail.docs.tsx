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
  accessibility: {
    keyboard: [
      "The dialog is modal, so every tab stop is inside it and Escape closes it. The cycle is: one button per selectable span, Copy prompt, Remix, Edit, one copy button per `copyable` parameter that has a value, anything interactive you passed in `moreLikeThis`, then the close X.",
      "A verb with no handler is rendered `disabled`, which takes it out of the tab order entirely. A dialog wired only for `onRemix` is one reachable verb, not three, and nothing in the dialog explains the other two.",
      "A highlighted span is a tab stop only when `onSpanSelect` is passed. Without it the same range renders as a `<mark>`: still highlighted, not focusable, not activatable — which is how a highlight that looks interactive ends up not being.",
      "The spans are ordinary buttons in prose, so a prompt with six selectable phrases is six tab stops before Copy prompt. There is no arrow-key traversal of the prompt and no way to skip past it.",
      "The parameter labels, the cost line and the media are text; only the copy buttons in the params grid are reachable. There is no keyboard route to the image itself.",
    ],
    screenReader: [
      "The dialog is always named \"Result detail\", from an `sr-only` title with no prop behind it. Every asset's lightbox therefore announces identically — the name never says which result is open, and there is no way to override it from the call site.",
      "Its description is fixed too: \"The generated result at full size, with the prompt and parameters that produced it.\" It describes the component, not this result.",
      "Each selectable span's accessible name is its own text, so what a reader hears is exactly the substring `onSpanSelect` will hand back. The trade-off is that the prompt is announced as a run of alternating text and buttons rather than as one sentence.",
      "The three verb icons are `aria-hidden`; the names are the visible words — \"Copy prompt\", \"Remix\", \"Edit\".",
      "Every copyable parameter's copy button is labelled just \"Copy\". A10 hard-codes that name and hides its `⧉` glyph, so marking seed and sampler `copyable` produces two buttons a reader cannot tell apart; only the `<dl>` reading order ties one to its `<dt>`.",
      "A parameter with no value renders A10's em-dash, which is announced as the character rather than as \"unknown\". The absence is deliberate but it is not spoken as deliberate.",
      "Nothing announces a copy. Neither this dialog nor A10 owns a live region, so pressing Copy prompt or a parameter's copy button is silent — put the confirmation somewhere yourself if it matters.",
      "`media` and `moreLikeThis` are opaque slots whose accessible names are entirely yours. An `<img>` with no `alt` in `media` leaves the largest thing in the dialog unannounced, and the fixed title will not cover for it.",
    ],
    focus: [
      "Opening moves focus into the popup and marks the rest of the page inert; closing restores focus to whatever was focused before, usually the tile that opened it. That is the primitive's default and needs nothing at the call site.",
      "Focus lands on the first tabbable element inside, which is the first highlighted span when the prompt has one and Copy prompt otherwise — never the heading, because the heading is `sr-only`.",
      "Spans and A10's copy buttons carry their own `focus-visible:ring-2`; the three verbs and the close X use the shared button ring. Every control here is visible on focus without a global style.",
    ],
  },
  pitfalls: [
    "`highlightedSpans` are character offsets into `prompt`, so they go stale the moment the prompt is reworded. Derive them (indexOf, or from whatever produced them) rather than hard-coding numbers.",
    "Overlapping, reversed and out-of-range spans are dropped or clamped rather than throwing, and the full prompt always renders exactly once. That means a bad range fails silently — if a highlight does not appear, check the offsets.",
    "A span with no `onSpanSelect` renders as a `<mark>` instead of a button. That is intentional (the highlight is still information) but it also means forgetting the handler produces something that looks interactive and is not.",
    "The verbs are always present and disable themselves without handlers, so the set of three reads the same everywhere. If you need a genuinely different action set, that is F4 `action-stack`, not this.",
    "`params` is A10's shape verbatim, which is what keeps this grid and N5 `run-inspector` identical. Reshaping it here would fork provenance rendering across the registry.",
  ],
};
