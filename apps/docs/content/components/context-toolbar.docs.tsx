import type { ComponentDocs } from "@/lib/component-docs";
import {
  AiEntryBuriedLast,
  AiEntryFirst,
  EverythingInOneRow,
  FlippedBelowSelection,
  OverflowCollapses,
} from "./context-toolbar.examples";

/**
 * Seeded from docs/design-system/component-specs.md#i3-context-toolbar.
 *
 * No "use client" here: this module is plain data read by a Server Component
 * (component-docs.tsx), which destructures `docs.whatItIs`, `docs.evidence`
 * and so on directly. Anything interactive lives in the
 * ./context-toolbar.examples client sidecar and is referenced below as a
 * zero-prop element.
 */
export const ContextToolbarDocs: ComponentDocs = {
  whatItIs:
    "The small floating bar that appears beside whatever is currently selected on a canvas, offering the handful of actions that apply to it. It leads with an AI entry, carries at most eight buttons, and folds everything past that into an overflow menu. It is a toolbar in the ARIA sense — one tab stop, arrow keys to travel along it — not a row of loose buttons.",
  whyItMatters:
    "Selection surfaces are a family: Canva, Fotor, Spline and Notion all put the same bar in the same place, and people arrive already knowing how it behaves. The cap is what keeps it a bar rather than a second inspector — past eight actions it stops being the fast path and starts competing with the panel it was meant to shortcut. Leading with AI is what makes the selection itself the prompt context: the object you picked is the input, so the AI entry belongs where the eye lands first, not tucked behind an overflow menu.",
  evidence: ["Canva", "Fotor", "Spline", "Notion"],
  anatomy: [
    {
      slot: "context-toolbar",
      note: "The floating frame. Carries data-selection, data-placement and data-overflow-count.",
    },
    { slot: "context-toolbar-ai", note: "The AI entry. Always index 0, never collapsed into overflow." },
    {
      slot: "context-toolbar-ai-menu",
      note: "Popover the AI entry opens — where I4 ai-tools-menu is rendered.",
    },
    {
      slot: "context-toolbar-action",
      note: "One selection action. Icon-only by default, with its label in an sr-only span.",
    },
    {
      slot: "context-toolbar-overflow",
      note: "Trigger for everything past the cap. An affordance, not an action.",
    },
    {
      slot: "context-toolbar-overflow-menu",
      note: "The collapsed actions, in the order they were supplied.",
    },
  ],
  usage:
    "Reach for it when a canvas has a selection and there is a small set of verbs that only make sense while that selection exists — formatting a text run, cropping an image, filling a shape, trimming a clip. Set `selection` to the kind of thing selected: it names the toolbar for assistive technology and lands on `data-selection` for styling. Pass every action you have and let the component decide which ones fit. If the surface needs more than eight verbs, that is the signal to reach for I2 `property-inspector` instead — this bar is the shortcut, not the surface.",
  dos: [
    {
      text: "Let the AI entry lead. It is a slot on the component, so it sits first whatever order your actions arrive in.",
      example: <AiEntryFirst />,
    },
    {
      text: "Hand over the whole action list and let the cap collapse the tail into the overflow menu.",
      example: <OverflowCollapses />,
    },
    {
      text: "Set `placement` from wherever your host drew the bar, so menus and tooltips open away from the selection.",
      example: <FlippedBelowSelection />,
    },
  ],
  donts: [
    {
      text: "Don't hand-roll a flat row of every action you have — nine equal icon buttons with no names is the shape this component exists to prevent.",
      example: <EverythingInOneRow />,
    },
    {
      text: "Don't put the AI entry last, or demote it to just another action in the list. First is the one position people learn.",
      example: <AiEntryBuriedLast />,
    },
  ],
  pitfalls: [
    "Expecting the component to keep itself in the viewport. It measures nothing — a registry component owns no canvas and cannot know where your selection rectangle is. You position it and you decide the flip; `placement` records that decision, lands on `data-placement`, and makes the popover and tooltips open away from the selection. Never covering the selection is likewise the host's guarantee: leave room for the bar's height plus your offset before committing to a side.",
    "Assuming `maxActions` can widen the bar. It is clamped to eight, so passing twelve still draws eight buttons and collapses the rest. It can only make the bar tighter.",
    "Forgetting the AI entry counts toward the cap. With the default of eight you get the AI entry plus seven actions; the overflow trigger sits outside the count because it is an affordance rather than an action.",
    "Passing an icon with no meaningful `label`. Every action's label is its accessible name, rendered in an sr-only span and merely repeated by the tooltip — a tooltip alone is never a name, and an icon-only button without one is invisible to a screen reader.",
    "Reaching for an import of I4 `ai-tools-menu`. It is rendered through the `aiMenu` slot instead, so the dependency runs one way and the toolbar stays usable in hosts that have no AI menu to give it.",
  ],
};
