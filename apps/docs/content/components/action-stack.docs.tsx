import type { ComponentDocs } from "@/lib/component-docs";
import {
  LockedRowsRemoved,
  LockedRowsStayVisible,
  NoPrices,
  PriceOnEveryRow,
} from "./action-stack.examples";

/**
 * Seeded from docs/design-system/component-specs.md#f4-action-stack.
 *
 * No "use client" here: plain data read by a Server Component. Live examples
 * live in ./action-stack.examples and cross over as zero-prop elements.
 */
export const ActionStackDocs: ComponentDocs = {
  whatItIs:
    "The list of places a finished result can go next — Extend, then Upscale, then Use in Lip sync — with each hop's price on its own row. It renders either as a dropdown from a trigger or as an inline list, and the row set is data you supply, so the same component serves video, image and audio results.",
  whyItMatters:
    "Cross-tool handoff is the signature interaction of this whole product category: ElevenLabs, Freepik, Topaz and CapCut all end a generation by offering the next one. It is also where money disappears. Chaining four operations is four charges, and a menu that lists the operations without their prices makes that invisible until the balance is gone — so every row carries its own cost, and the prices come from the same formatter the run button and the queue use, because three surfaces quoting three numbers for one action is the failure this registry keeps designing against. The other reason it is one component: I4 `ai-tools-menu` is visually identical to this on purpose, because conceptually the two are the same thing, and Wave 6 should reuse this shape rather than re-derive it.",
  evidence: ["ElevenLabs", "Freepik", "Topaz", "CapCut"],
  anatomy: [
    { slot: "action-stack", note: "The root. Carries `data-presentation` for menu or inline." },
    { slot: "action-stack-trigger", note: "Menu mode only. Renders your own element rather than wrapping it." },
    { slot: "action-stack-menu", note: "The dropdown surface in menu mode." },
    { slot: "action-stack-item", note: "One action, rendered as A9 `entity-row`. Carries `data-locked` when gated." },
    { slot: "cost-chip", note: "A2 in the row's trailing slot, with text from the shared cost formatter." },
    { slot: "action-stack-locked", note: "The word Locked, so the padlock is never the only signal." },
  ],
  usage:
    "Build the `actions` array from the asset's type — a video gets Extend and Upscale, an image gets Variations and Inpaint — rather than rendering a different component per media kind. Give every action that bills a `cost`; use `per` for rate-priced work (\"900 credits/min\") and it will render correctly. Mark tier-gated rows `locked` rather than filtering them out: they stay visible and keep their price, but cannot be chosen. Use `presentation=\"menu\"` with a `trigger` when the stack hangs off a result card, and `\"inline\"` when it is a panel in its own right.",
  dos: [
    {
      text: "Put a cost on every row that bills — the whole point is that a four-step chain is four charges.",
      example: <PriceOnEveryRow />,
    },
    {
      text: "Keep locked rows in the list with their price; an upgrade prompt needs a subject.",
      example: <LockedRowsStayVisible />,
    },
  ],
  donts: [
    {
      text: "Don't ship a stack with no prices — nothing distinguishes a cheap hop from an expensive one until the bill arrives.",
      example: <NoPrices />,
    },
    {
      text: "Don't filter out what the current plan can't do; the person never discovers the capability exists.",
      example: <LockedRowsRemoved />,
    },
  ],
  accessibility: {
    keyboard: [
      "In menu mode the closed stack is one tab stop — the trigger. Enter, Space or Down opens it; Up and Down walk the rows, typing a letter jumps to one, Enter or Space runs it, and Escape closes.",
      "A locked or disabled row stays in the arrow-key walk. It is a menu item marked `aria-disabled` rather than one removed from the list, so a keyboard user still meets the row they cannot run — which is the whole reason locked rows are kept on screen.",
      "In inline mode there is no arrow-key navigation: every actionable row is its own tab stop in a plain `role=\"group\"`. Eight actions is eight Tab presses, and no key skips the group.",
      "A locked or inline-disabled row is not a tab stop at all — it renders as a `div` rather than a button, so the keyboard passes over it entirely. Only the pointer and browse mode reach it.",
      "There is no Escape handling in inline mode and no shortcut to reach the stack; the trigger is whatever element you pass.",
    ],
    screenReader: [
      "Inline mode is a group named \"Actions for this result\" — a fixed string. Two stacks on one page announce as two identically named groups, so name the surface around them.",
      "In inline mode every actionable row is a `<button>` carrying `aria-pressed=\"false\"`, because the composed `entity-row` always emits that attribute. A one-shot action like Upscale therefore announces as an unpressed toggle button, which is wrong about what pressing it does.",
      "A row's name is the whole row read out: title, description, the formatted price and the word Locked, in that order. \"Upscale to 4K, adds detail without re-rendering, 400 credits\" is one long name, not a name plus a description.",
      "The padlock is `aria-hidden` and the coin glyph in the cost chip is too, so the visible word Locked and the formatted amount are what actually carry those states.",
      "A locked inline row carries no `aria-disabled`: `locked` never reaches `entity-row`'s `disabled` prop, so the only signal that it cannot be run is the literal word Locked in the trailing slot.",
      "Nothing announces that an action started. `onAction` fires and the menu closes; if the work is asynchronous, the live region belongs on the surface you hand the result to.",
    ],
    focus: [
      "In menu mode, choosing a row closes the menu and returns focus to the trigger, so a chained handoff leaves you where you started.",
      "In inline mode a row that disappears — because your handler removed the action, or the tier changed — takes focus with it, and nothing restores it. Focus falls to `<body>` and the next Tab restarts from the top of the page.",
      "Interactive rows carry a `focus-visible:ring-2` from `entity-row`. The menu trigger does not: it is your element, so its focus style is yours to supply.",
    ],
  },
  pitfalls: [
    "In menu mode the rows are deliberately not interactive themselves — the menu item is the control, and A9 rendering its own button inside one would nest two interactives and fail the a11y gate. If you fork this component, keep that split.",
    "`locked` and `disabled` both make a row unactionable but mean different things: `locked` is a tier fact worth showing an upgrade for, `disabled` is a temporary condition. Only `locked` gets the padlock and the word.",
    "The cost text is produced by `formatCost`, not by A2's own `{amount} {unit}` template — the formatted string is passed as the chip's `amount` with the unit suppressed. That is what lets the rate form render today, and it should be simplified once A2 takes a `Cost` directly.",
    "`trigger` is used as the trigger element itself, not wrapped. Pass a real button; passing a bare string gets one supplied for you, but passing a `<div>` gives you a trigger with no button semantics.",
    "A row with no `cost` renders no chip at all rather than a zero — which is correct for genuinely free actions, and a silent bug if you simply forgot to price it.",
  ],
};
