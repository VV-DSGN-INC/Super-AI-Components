import type { ComponentDocs } from "@/lib/component-docs";
import {
  DetailBehindAnExpand,
  FixedVerbOrder,
  ResolvedWithoutUndo,
  VagueSummary,
} from "./approval-card.examples";

/**
 * Seeded from docs/design-system/component-specs.md#f7-approval-card.
 *
 * No "use client" here: this module is plain data read by a Server Component
 * (component-docs.tsx). Live examples live in the ./approval-card.examples
 * client sidecar and are referenced here as zero-prop elements.
 */
export const ApprovalCardDocs: ComponentDocs = {
  whatItIs:
    "A single artifact held for a human decision, with four verbs in a fixed order — Confirm, Edit, Regenerate, Skip — a summary you decide on, and detail folded behind an explicit expand. Confirm and Skip end the interaction and keep an Undo window; Edit and Regenerate hand you back to the artifact.",
  whyItMatters:
    "This is the Approval contract's only implementation in the catalog, so every other approval surface — the ones in families K and N — inherits this shape rather than inventing its own. That matters because approval is where autonomy is actually negotiated: the whole point is that a person can decline, and a person who cannot tell what they are declining has not really been asked. So the verbs never reorder themselves (muscle memory has to hold across every surface in the product), the detail is never auto-expanded and never merely clipped, and the two terminal verbs keep a window in which the decision can be taken back. Products that get this wrong ship approval UI that trains people to click Confirm without reading, which is worse than no approval step at all.",
  evidence: ["Sprig AI", "Zapier user-approval", "OpenAI Agent Builder", "Spellbook"],
  anatomy: [
    { slot: "approval-card", note: "The card. Carries `data-state` for pending, submitting or resolved." },
    { slot: "approval-card-title", note: "What is being decided, in a few words." },
    { slot: "approval-card-summary", note: "The sentence the decision is made on. Full-contrast text, not secondary." },
    { slot: "approval-card-expand", note: "The explicit expand toggle, carrying aria-expanded and aria-controls." },
    { slot: "approval-card-detail", note: "The full detail. Rendered only when expanded — not clipped." },
    { slot: "approval-card-verbs", note: "The button group. Iterates a fixed list, so caller order cannot reach it." },
    { slot: "approval-card-confirm", note: "Terminal. Shows the spinner while submitting." },
    { slot: "approval-card-edit", note: "Returns you to the artifact; resolves nothing on its own." },
    { slot: "approval-card-regenerate", note: "Returns you to the artifact; resolves nothing on its own." },
    { slot: "approval-card-skip", note: "Terminal." },
    { slot: "approval-card-resolution", note: "The outcome, stated in words. Replaces the verbs once resolved." },
    { slot: "approval-card-undo", note: "Available for `undoWindowMs` after resolution, then withdrawn." },
    { slot: "approval-card-status", note: "Visually hidden live region announcing each transition." },
  ],
  usage:
    "Give it a `title` that names the decision and a `summary` someone could actually decide on — not a description of the artifact. Put anything longer in `detail`; it stays collapsed until the reader asks for it. Supply only the verbs that apply: the component renders the ones with handlers and drops the rest, always in Confirm, Edit, Regenerate, Skip order. Move `state` to `submitting` while your request is in flight (every verb disables, so a decision cannot be submitted twice) and then to `resolved` with the matching `resolution`. Pass `onUndo` unless the decision genuinely cannot be reversed — the window defaults to 8 seconds and closes itself.",
  dos: [
    {
      text: "Pass handlers in whatever order suits your code — the component fixes the verb order, so the reading order is the same on every approval surface.",
      example: <FixedVerbOrder />,
    },
    {
      text: "Put anything longer than a sentence in `detail`, so the reader chooses to expand it rather than being asked to approve a wall of text.",
      example: <DetailBehindAnExpand />,
    },
  ],
  donts: [
    {
      text: "Don't write a summary that describes the artifact instead of the decision — say what confirming will do.",
      example: <VagueSummary />,
    },
    {
      text: "Don't resolve without an `onUndo` unless the action really is irreversible; Confirm and Skip are terminal and a misclick is otherwise final.",
      example: <ResolvedWithoutUndo />,
    },
  ],
  pitfalls: [
    "The Undo window is wall-clock time inside the component, so it closes whether or not your backend has finished. If your undo endpoint is slow, keep `undoWindowMs` comfortably longer than the round trip or people will click Undo into a closed window.",
    "Entering `resolved` a second time restarts the window — that is deliberate, so a re-decision gets a fresh chance — but it means holding the component in `resolved` while changing `resolution` also restarts it.",
    "`detail` is not rendered at all while collapsed, rather than hidden with CSS. That is the point (a screen reader should not be able to read what a sighted user has not been shown), but it means anything expensive in `detail` mounts on expand, not on first render.",
    "Only verbs with handlers appear. A card with no handlers at all renders an empty button group, which usually means the callbacks were forgotten rather than that no action was intended.",
    "Edit and Regenerate resolve nothing on their own — they hand control back to the artifact. If you set `state=\"resolved\"` from them without actually returning the user anywhere, the card claims a decision that was never made.",
  ],
};
