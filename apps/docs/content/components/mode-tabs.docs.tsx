import type { ComponentDocs } from "@/lib/component-docs";
import { TooManyModes, TooltipNotOnlyName, TooltipOnlyLabel, ValidModeCount } from "./mode-tabs.examples";

/**
 * Seeded from docs/design-system/component-specs.md#d4-mode-tabs.
 * Translate the spec's internal voice into consumer-facing guidance — do not
 * ship the seed text verbatim.
 *
 * No "use client" here: this module is plain data read by a Server
 * Component (component-docs.tsx), which destructures `docs.whatItIs`,
 * `docs.evidence`, etc. directly. Live examples that need interactivity live
 * in the ./mode-tabs.examples client sidecar and get referenced here as
 * zero-prop elements — see that file for why.
 */

export const ModeTabsDocs: ComponentDocs = {
  whatItIs:
    "A small set of mutually exclusive modes — two to five — that change how the same prompt or workspace gets interpreted. Rendered as a segmented toggle group the user switches directly, in three presentations: text-only, icon-plus-label, or icon-only with a tooltip.",
  whyItMatters:
    "Every reference product that supports more than one way of working exposes the switch as a persistent row of tabs, not a buried menu setting — CapCut's Standard/Director, Claude's Chat/Cowork, Manus's Design/Build, Spellbook's Ask/Draft/Review. Mode changes the interpretation of the prompt, not the model that answers it; keeping this separate from a model picker (E2) keeps both decisions legible instead of collapsing them into one dropdown.",
  evidence: ["CapCut", "Claude", "Manus", "Spellbook"],
  anatomy: [
    { slot: "mode-tabs", note: "Root wrapper; carries the active variant and any passthrough className." },
    { slot: "mode-tabs-list", note: "The toggle group that owns single-selection semantics for the modes." },
    {
      slot: "mode-tabs-item",
      note: "One mode's trigger — text-only, icon plus visible label, or icon-only with a tooltip, depending on variant.",
    },
  ],
  usage:
    "Reach for it whenever a surface offers two to five mutually exclusive interpretations of the same input — never as a stand-in for a model picker, and never past five options, where a select reads better than a crowded tab row. Use the default text-only variant when space allows; move to `with-icon` once the modes have obvious glyphs; reserve `with-tooltip` for tight spaces like an embedded composer toolbar, where every trigger still carries a real (sr-only) label so the tooltip is a hint, not the only name.",
  dos: [
    {
      text: "Keep the range at two to five modes — a segmented control past that point stops reading as a set of choices.",
      example: <ValidModeCount />,
    },
    {
      text: "Give every trigger a real accessible name even when it's icon-only, and let the tooltip repeat it rather than originate it.",
      example: <TooltipNotOnlyName />,
    },
  ],
  donts: [
    {
      text: "Don't let a tooltip be the only place an icon-only tab's name lives — nothing is announced to assistive tech until the tooltip itself fires, and keyboard focus alone often never triggers it.",
      example: <TooltipOnlyLabel />,
    },
    {
      text: "Don't grow past five tabs — a sixth mode is the signal to switch to a select, not to squeeze in another trigger or start scrolling.",
      example: <TooManyModes />,
    },
  ],
  accessibility: {
    keyboard: [
      "One tab stop for the whole row, not one per mode. The underlying toggle group is a composite with a roving tabindex: Tab reaches the highlighted trigger, Left and Right move the highlight between modes and wrap at both ends, and the next Tab leaves the group entirely.",
      "Arrows move the highlight only — Enter and Space are what commit the mode, so someone can walk the row without changing the working context underneath it.",
      "Pressing the already-active mode reports an empty selection, which the component discards. The row can never land on \"no mode\", by keyboard or by mouse.",
      "`disabled` reaches every trigger and renders each as a real `disabled` button, so a disabled `ModeTabs` has no tab stop at all — the current mode stops being reachable rather than merely unclickable. Keep something else on the surface saying which mode is in force while you gate it.",
      "There is no Home/End jump and no number-key shortcut. The arrows are the only navigation the row has.",
    ],
    screenReader: [
      "`mode-tabs-list` is `role=\"group\"` named by `label` (default \"Mode\"), and each trigger is a toggle button carrying `aria-pressed`. It does not announce as a tab list and not as a radio group, so mutual exclusivity is inferred from hearing exactly one \"pressed\" — nothing states it.",
      "`aria-orientation` is suppressed on purpose: `role=\"group\"` does not permit the attribute at all, so the value the primitive would otherwise compute is an axe `aria-allowed-attr` failure regardless of what it says. Putting it back is a regression, not a preference.",
      "Every trigger has a real text name in all three variants. `with-tooltip` keeps `mode.label` as `sr-only` button content, so the accessible name survives even if the tooltip never fires — the tooltip repeats the name for sighted users rather than being the only copy of it.",
      "The icon in `with-icon` and `with-tooltip` sits inside an `aria-hidden` span and never contributes to the name. The name is `mode.label`, exactly, in every variant.",
      "Switching mode announces only the pressed state of the button just activated. Nothing announces what changed downstream, so if moving from Ask to Build rewrites the surface below, the live region belongs on that surface and not here.",
    ],
    focus: [
      "The roving tabindex is the only thing that moves focus, and it moves it inside the row. Nothing opens, nothing unmounts, and tabbing out lands wherever document order puts it.",
      "The focus ring comes from the shared toggle variant rather than from this component, so it matches every other toggle in the system and changes with it. There is nothing to supply and nothing to override here.",
    ],
  },
  pitfalls: [
    "ModeTabs doesn't clamp `modes.length` — the 2–5 range from the spec is the caller's responsibility to respect, not something the component enforces.",
    "The selected mode is a working context that the spec says must survive a reload, but ModeTabs only owns the click — persisting `value` across sessions (URL state, localStorage, a server-side setting) is the consuming app's job.",
  ],
};
