import type { ComponentDocs } from "@/lib/component-docs";
import {
  FullyComposedField,
  LockedAsSeparateBanner,
  LockedByDisabling,
  LockedInPlace,
} from "./hero-omnibox.examples";

/**
 * Seeded from docs/design-system/component-specs.md#c1-hero-omnibox.
 * Translate the spec's internal voice into consumer-facing guidance — do not
 * ship the seed text verbatim.
 *
 * No "use client" here: this module is plain data read by a Server
 * Component (component-docs.tsx), which destructures `docs.whatItIs`,
 * `docs.evidence`, etc. directly. If a Do/Don't needs a live example,
 * define a zero-prop component in a sibling "hero-omnibox.examples.tsx"
 * client module ("use client" at the top of that file, not this one) and
 * reference it here as an element with no props, e.g.:
 *
 * // import { GoodExample } from "./hero-omnibox.examples";
 * // dos: [{ text: "...", example: <GoodExample /> }]
 *
 * An inline handler on an element created in *this* file — e.g.
 * `<HeroOmnibox onSelect={() => {}} />` passed straight into `dos`/`donts` —
 * cannot be serialized across the server/client boundary and breaks the
 * static export.
 */
export const HeroOmniboxDocs: ComponentDocs = {
  whatItIs:
    "The centred prompt that greets a user on an app's home screen — a large textarea in a card, with attach, model select, and submit built into the field itself. The whole card is clickable, not just the textarea inside it.",
  whyItMatters:
    "Five of five reference App Home screens open with exactly this shape — Descript, Zapier Copilot, CapCut, Manus, and Claude all lead with a centred composer rather than a dashboard or a list. It is the first interactive surface a new session sees, so its states carry weight beyond their own bounds: `locked` is the moment a paid feature gets explained, and `generating` is the first proof the product is actually doing something.",
  evidence: ["Descript", "Zapier Copilot", "CapCut", "Manus", "Claude"],
  anatomy: [
    { slot: "hero-omnibox", note: "Root card. Click anywhere on it that isn't a nested control to focus the field." },
    { slot: "hero-omnibox-modes", note: "Optional mode tabs — composes ModeTabs (D4), rendered inside the card, above the field." },
    { slot: "hero-omnibox-field", note: "Wraps the textarea and its toolbar. Absent entirely when `locked`." },
    { slot: "hero-omnibox-textarea", note: "The prompt input. Carries the accessible name, visible or not." },
    { slot: "hero-omnibox-toolbar", note: "The row beneath the textarea: attach, model, cost on the left; submit on the right." },
    { slot: "hero-omnibox-attach", note: "Icon-only attach button, inside the field." },
    { slot: "hero-omnibox-model", note: "Optional model select, inside the field." },
    { slot: "hero-omnibox-cost", note: "Optional cost chip (M2) — credits at the point of spend, not in a billing page." },
    { slot: "hero-omnibox-submit", note: "Icon-only send button. Replaced by hero-omnibox-stop while generating." },
    { slot: "hero-omnibox-stop", note: "Replaces submit during `generating` — a distinct control, not a disabled submit." },
    { slot: "hero-omnibox-paywall", note: "Replaces hero-omnibox-field entirely when `locked` — the gate, in place." },
    { slot: "hero-omnibox-unlock", note: "The paywall's CTA button." },
    { slot: "hero-omnibox-status", note: "Visually hidden live region that announces the generating state." },
  ],
  usage:
    "Reach for it as the anchor of an App Home screen — the first thing a user sees when they arrive with no session in progress yet. Drive its `state` prop from real product state (`idle` while empty, `focused` when the field has attention, `generating` while a request is in flight, `locked` once a plan limit is hit) rather than deriving it purely from DOM focus, since `generating` and `locked` are business states, not interaction states. Pass `modes`, `models`, and `cost` only when the surface actually has them — each is optional and the field lays out correctly without any of them.",
  dos: [
    {
      text: "Swap the textarea for the paywall CTA in place when locked — the composer itself stays the gate.",
      example: <LockedInPlace />,
    },
    {
      text: "Keep attach, model select, and cost together inside the field's toolbar, not stacked above the card.",
      example: <FullyComposedField />,
    },
  ],
  donts: [
    {
      text: "Don't render the paywall as a separate banner next to the composer — it reads as a dismissible ad, not a gate on the action itself.",
      example: <LockedAsSeparateBanner />,
    },
    {
      text: "Don't gate by disabling the textarea and buttons — a greyed-out field with no explanation reads as broken, not as an upsell.",
      example: <LockedByDisabling />,
    },
  ],
  pitfalls: [
    "Treating `generating` as a purely visual spinner state. Screen reader users need the live-region announcement — that's why hero-omnibox-status always renders, just invisible until there's something to say.",
    "Placing mode tabs, attach, or model select above the card instead of inside the field's toolbar — it breaks the 'whole card is the control' framing and drifts from the slot arrangement this component shares with D1.",
    "Burying the cost chip in a settings or billing surface instead of passing it as `cost` — the point of a spend indicator is that it sits where the spend happens.",
    "Deriving `generating` or `locked` from local UI state (like a hover or focus handler) instead of the actual request/plan state — these two states represent real backend conditions, not transient interaction.",
  ],
};
