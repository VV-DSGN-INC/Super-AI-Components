import type { ComponentDocs } from "@/lib/component-docs";
import {
  CounterAndSkipAlwaysPresent,
  CutOutKeepsTheTargetLit,
  DotsWithoutACounter,
  ScrimCoveringTheTarget,
} from "./coach-mark.examples";

/**
 * Seeded from docs/design-system/component-specs.md#l2-coach-mark.
 *
 * No "use client" here: this module is plain data read by a Server Component
 * (component-docs.tsx). The live Do/Don't renders are interactive, so they
 * live in the ./coach-mark.examples client sidecar and are referenced here as
 * zero-prop elements.
 */

export const CoachMarkDocs: ComponentDocs = {
  whatItIs:
    "One step of a product tour: a popover anchored to a real element, with a scrim that cuts a hole around that element so it stays fully lit while the rest of the screen dims. It always carries a step counter and a Skip control, and it always hands control back — it advances nothing on its own.",
  whyItMatters:
    "Every onboarding surface on the reference board points at something specific. CapCut's yellow tips, Lovable's inline tooltips, Airtable's Omni introduction and Spline's first-run walkthrough all teach by highlighting one live control at a time rather than describing it in a modal. The cut-out is what makes that work: the moment the scrim covers the thing being explained, the user is reading a description of a button they can no longer see, and the tour becomes a slideshow. The counter and Skip matter for the opposite reason — a tour with no visible length and no exit is a hostage situation, and it is the single most common complaint about onboarding flows.",
  evidence: ["CapCut", "Lovable", "Airtable Omni", "Spline"],
  anatomy: [
    { slot: "coach-mark", note: "Root wrapper around the anchored element. Establishes the positioning context; adds no visual of its own." },
    { slot: "coach-mark-anchor", note: "Empty, aria-hidden span laid over the anchor box. Positions the popover and nothing else — it is never a control." },
    { slot: "coach-mark-scrim", note: "The dim. Painted outside the cut-out by a large shadow spread, so the anchor is never covered." },
    { slot: "coach-mark-cutout", note: "Full-strength ring around the lit area, so the hole reads as deliberate rather than as a rendering gap." },
    { slot: "coach-mark-content", note: "The popover itself — role=dialog, named by the title, and where focus lands when the step opens." },
    { slot: "coach-mark-arrow", note: "Pointer back to the anchor. Carries data-side, so it follows the popover when it flips." },
    { slot: "coach-mark-header", note: "Title and description." },
    { slot: "coach-mark-title", note: "The step heading, and the accessible name of the dialog." },
    { slot: "coach-mark-description", note: "Body copy explaining the anchored element." },
    { slot: "coach-mark-footer", note: "Counter on one side, controls on the other." },
    { slot: "coach-mark-step", note: "The mandatory counter. Text first; the dots beside it are decorative and aria-hidden." },
    { slot: "coach-mark-skip", note: "The mandatory exit. Always rendered, always inside the popup where focus lands." },
    { slot: "coach-mark-back", note: "Previous step. Suppressed on step 1 whether or not onBack is passed." },
    { slot: "coach-mark-next", note: "Advance. Relabels to the finish label on the last step." },
  ],
  usage:
    "Wrap the element you want to teach and pass the copy, the position in the sequence, and the callbacks: `step`, `total` and `onSkip` are required, because a step that cannot say how long the tour is or let the user out is not a coach-mark. Reach for it when a single live control needs explaining in place; reach for a dialog instead when what you have to say is not about one element. Leave `spotlight` on when the tour should own the screen, and turn it off for a tip that annotates without taking over. Because the component is not modal, the anchored element stays clickable and stays announced to screen readers — dimming it, visually or programmatically, is the one thing this component exists to prevent.\n\nThere is no `<Tour>` component here, and there should never be one. A tour is a sequence of coach-marks over shared state: the host owns the array of steps, the current index, and whether the user has seen it before, and drives each mark with `open`, `step` and `total`. Rendering every mark and toggling `open` keeps the anchors stable; mounting them one at a time also works. If you find yourself wanting a manager component, what you actually want is a hook in your own app that owns the index.",
  dos: [
    {
      text: "Keep the anchored element at full strength — the cut-out is the component, not a decoration on it.",
      example: <CutOutKeepsTheTargetLit />,
    },
    {
      text: "Let the counter and Skip stand even on a one-step tip; they are structural, not optional trimmings.",
      example: <CounterAndSkipAlwaysPresent />,
    },
  ],
  donts: [
    {
      text: "Don't lay a full-bleed scrim over the anchor. Dimming what you point at turns a tour into a slideshow about an invisible button.",
      example: <ScrimCoveringTheTarget />,
    },
    {
      text: "Don't reduce progress to a row of dots, and never ship a step with no way out. Two greys are not a sentence, and a screen reader reads neither.",
      example: <DotsWithoutACounter />,
    },
  ],
  pitfalls: [
    "The scrim is a very large shadow spread, so any ancestor with `overflow: hidden` clips it and the dim stops at that edge. If a tour step lives inside a scroll container or a card that clips, either move the coach-mark up the tree or accept a scoped dim — there is no measurement to fix it with.",
    "The same applies to stacking contexts: an ancestor with its own `transform`, `filter` or `z-index` traps the scrim inside it, and page chrome painted above that context stays undimmed. Anchor tours to elements in the main document flow where you can.",
    "`step` and `total` describe where a step sits; they do not move it. Clicking Next fires `onNext` and changes nothing on screen. If a step appears frozen, the host is not updating its index — that is the intended split, not a bug.",
    "Focus moves into the step when it opens and is deliberately not restored on close, because in a running tour the right destination is the next step, not the previous anchor. The host must send focus somewhere sensible when the tour ends or is skipped, or a keyboard user is left at the top of the document.",
    "Passing an interactive element as the anchor is normal and safe — the anchor span is a sibling of your children, not a wrapper around them, so a tour pointing at a button never nests one control inside another. Do not wrap the children in your own trigger to 'help'.",
    "Dismissal is not persisted here. A coach-mark shown again on every visit is the most-hated pattern in this family; the host owns the seen-flag, exactly as it owns the index.",
  ],
};
