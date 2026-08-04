import type { ComponentDocs } from "@/lib/component-docs";
import { AnchorIndependentOfExcerpt, OverlongExcerpt, QuoteSiblingToDraft, VagueAnchor } from "./quote-reply.examples";

/**
 * Seeded from docs/design-system/component-specs.md#d5-quote-reply.
 * Translate the spec's internal voice into consumer-facing guidance — do not
 * ship the seed text verbatim.
 *
 * No "use client" here: this module is plain data read by a Server
 * Component (component-docs.tsx), which destructures `docs.whatItIs`,
 * `docs.evidence`, etc. directly. Live examples that need interactivity live
 * in the ./quote-reply.examples client sidecar and get referenced here as
 * zero-prop elements — see that file for why.
 */
export const QuoteReplyDocs: ComponentDocs = {
  whatItIs:
    "A small quoted block that attaches a selection — a text range, an image region, a table cell, or a timeline range — to the message being composed. It shows a readable excerpt of what was selected, where that selection came from, and a control to drop the quote without touching anything already typed.",
  whyItMatters:
    "Claude, Notion AI, Spellbook, and Descript all let a user select something first and reply to that selection specifically, across four completely different surfaces — a document, an image, a spreadsheet, a transcript. The pattern only holds together because it's one component, not four: the excerpt is the only thing that changes shape per source, while the anchor, the source-kind glyph, and the removal control stay identical. That's what lets a quote outlive the moment it was taken — the anchor is a stable position, not a snapshot of the text, so it can still say where it pointed even after the source underneath it changes.",
  evidence: ["Claude", "Notion AI", "Spellbook", "Descript"],
  anatomy: [
    { slot: "quote-reply", note: "Root container — one row holding the icon, the excerpt, and the remove control." },
    { slot: "quote-reply-icon", note: "Decorative glyph naming the source kind at a glance; the label carries the same information in text." },
    { slot: "quote-reply-excerpt", note: "The `<blockquote>` — a text excerpt for three sources, a thumbnail for image-region." },
    { slot: "quote-reply-text", note: "The excerpt text itself, when the source isn't an image with a thumbnail." },
    {
      slot: "quote-reply-anchor",
      note: "The `<cite>` line naming the source kind and the stable anchor — independent of the excerpt text.",
    },
    { slot: "quote-reply-remove", note: "Removes the quote. Never touches the composer's typed draft." },
  ],
  usage:
    "Reach for it whenever a composer needs to carry a reply-to-this-selection context alongside the typed message — always pass a real `anchor` (a paragraph offset, a cell reference, a time range, or region bounds), not a restatement of the excerpt, since the anchor is what the quote resolves against if the source is edited later. Pass `thumbnail` for image-region quotes once you have a crop to show; until then it falls back to the same text rendering as the other three sources, so the component never has to wait on an image to be useful.",
  dos: [
    {
      text: "Pass the excerpt and the anchor as two independent values — the excerpt is what was selected, the anchor is where it lives, and only the anchor has to keep resolving after an edit.",
      example: <AnchorIndependentOfExcerpt />,
    },
    {
      text: "Mount the quote as a sibling of the composer's input, not inside it — removing the quote must never clear what the user already typed.",
      example: <QuoteSiblingToDraft />,
    },
  ],
  donts: [
    {
      text: "Don't quote a whole paragraph or transcript minute — trim to the sentence the reply is actually about. `line-clamp-2` will cut a long excerpt mid-sentence, which reads as broken rather than intentional.",
      example: <OverlongExcerpt />,
    },
    {
      text: "Don't hand it a vague anchor like \"here\" — the anchor is the one thing that has to survive the source being edited, so it needs to be an actual position, not a placeholder.",
      example: <VagueAnchor />,
    },
  ],
  pitfalls: [
    "Four sources, one component — resist forking text-range/image-region/table-cell/timeline-range into four separate components. Only the excerpt rendering branches internally (thumbnail vs. text); the icon, the anchor line, and the removal control are identical across all four, and a fork is how one of them quietly loses the dismiss control or the anchor contract.",
    "For image-region, `excerpt` is the visible caption under the thumbnail, not just an accessibility label — leaving it as a placeholder string makes the quote unreadable at a glance even though a screen reader would still announce something.",
    "`thumbnail` is optional on purpose: without it, an image-region quote renders through the exact same text branch as the other three sources. Don't assume the thumbnail branch always fires for `source=\"image-region\"` — design for the text fallback too.",
  ],
};
