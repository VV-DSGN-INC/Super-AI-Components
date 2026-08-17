import type { ComponentDocs } from "@/lib/component-docs";
import {
  ColourOnlyDimming,
  HiddenBehindEmptyBox,
  PadlockIconOnlyLock,
  RevealsInlineUpsell,
  StaysVisibleWithTierBadge,
  TierBadgeShowsWhatExists,
  TrialAvailableIsDistinct,
} from "./member-gate-row.examples";

/**
 * Seeded from docs/design-system/component-specs.md#e7-member-gate-row.
 * Translate the spec's internal voice into consumer-facing guidance — do not
 * ship the seed text verbatim.
 *
 * No "use client" here: this module is plain data read by a Server
 * Component (component-docs.tsx), which destructures `docs.whatItIs`,
 * `docs.evidence`, etc. directly. Live examples that need interactivity live
 * in the ./member-gate-row.examples client sidecar and get referenced here
 * as zero-prop elements — see that file for why.
 */
export const MemberGateRowDocs: ComponentDocs = {
  whatItIs:
    "A single settings row for a feature that's gated behind a plan, a trial, or nothing at all. It composes A9 entity-row for the icon/title/description grid and fills the trailing slot with a tier badge and a switch, so a locked, trialable, and unlocked feature all render as the same row shape at three points in its lifecycle.",
  whyItMatters:
    "Every product on the reference board keeps its paid features in the settings list rather than pulling them out into a separate 'upgrade' page — Tripo's members-only rows, Lovable's tier badges, Spline Pro features, and CapCut's crown marks are all a row the user was already scanning, with one trailing element telling them what it costs. That's also why this pattern can't wait for a monetization-focused wave: it ships wherever settings ship, alongside `run-button`'s insufficient-credits state and `promo-card` in the sidebar, because a settings screen with silently-missing rows looks like a bug, not a paywall.",
  evidence: ["Tripo members-only rows", "Lovable tier badges", "Spline Pro features", "CapCut crown marks"],
  anatomy: [
    { slot: "member-gate-row", note: "Root wrapper. Carries data-state for locked/unlocked/trial-available/inline-upsell." },
    { slot: "member-gate-row-trailing", note: "Groups the tier or trial badge with the switch so they move as one unit." },
    { slot: "member-gate-row-tier-badge", note: "Shown whenever the row is gated (locked or its inline-upsell) — e.g. \"Pro\"." },
    { slot: "member-gate-row-trial-badge", note: "Shown only in trial-available — e.g. \"Free trial ×1\"." },
    { slot: "member-gate-row-upsell", note: "The inline panel revealed under a locked row — never a dialog." },
    { slot: "member-gate-row-upsell-cta", note: "The upgrade action inside the revealed panel." },
    { slot: "member-gate-row-upsell-dismiss", note: "Collapses the panel back to locked without upgrading." },
  ],
  usage:
    "Reach for it for any feature toggle that a plan, trial, or credit balance gates — anywhere you'd otherwise render an entity-row with a plain switch. The component is fully controlled: you own `state` and move it from locked to inline-upsell in response to `onRequestUpgrade`, the same way promo-card's caller owns `dismissed`. Use `trial-available` instead of `locked` the moment a feature has a real, usable trial rather than being purely aspirational — the two read identically to a user unless the badge and the switch's behaviour actually differ.",
  dos: [
    {
      text: "Keep a locked feature's row in the list with its tier badge, exactly where the unlocked row would be — never remove or hide it.",
      example: <StaysVisibleWithTierBadge />,
    },
    {
      text: "Reveal the upgrade pitch inline, under the row that triggered it, and let the user dismiss it back to locked without navigating away.",
      example: <RevealsInlineUpsell />,
    },
    {
      text: "Give a real, working trial its own trial-available state and badge — don't leave it looking locked until the user has already spent it.",
      example: <TrialAvailableIsDistinct />,
    },
    {
      text: "Let a tier badge do the talking, in text, the same way sidebar-nav's tier badges do — it shows what exists rather than hiding it.",
      example: <TierBadgeShowsWhatExists />,
    },
  ],
  donts: [
    {
      text: "Don't remove a gated row from the list, or swap it for a generic placeholder — that hides the feature instead of selling it.",
      example: <HiddenBehindEmptyBox />,
    },
    {
      text: "Don't convey \"locked\" with a padlock glyph alone — it has no accessible name of its own and disappears for anyone not looking right at it.",
      example: <PadlockIconOnlyLock />,
    },
    {
      text: "Don't rely on opacity or a disabled control to say \"locked\" — dimming alone reads as broken, not gated, and a disabled switch loses its accessible state along with its interactivity.",
      example: <ColourOnlyDimming />,
    },
  ],
  accessibility: {
    keyboard: [
      "One tab stop in `locked`, `unlocked` and `trial-available`: the switch. `inline-upsell` is three — the switch, the upgrade CTA, then the dismiss button. The row itself is never focusable, because `entity-row` is composed without `onSelect` and stays a plain div.",
      "Space toggles the switch and Enter does not — the native switch contract, and it applies to the gated switch too.",
      "A locked switch is deliberately neither `disabled` nor `readOnly`. It keeps its tab stop and stays activatable so the attempt can be reported; either attribute would swallow the press before `onRequestUpgrade` fires and would also drop the row's state out of the accessibility tree.",
      "Escape does nothing to the inline upsell. Collapsing it means tabbing to the dismiss button — the panel is revealed content, not a dialog, so it has no dismiss key.",
      "The tier and trial badges are static text in every state. The switch is the only thing the keyboard can reach in the trailing slot.",
    ],
    screenReader: [
      "The switch is named by `aria-labelledby` pointing at the row's own title, so it announces as \"{label}, switch, off\". The title is wrapped in a span carrying a generated id, which means a non-string `label` still resolves — the name is computed from that element's text content rather than from a `typeof children === \"string\"` check, so the failure that bites A5 `filter-bar` cannot happen here.",
      "While gated, the switch also carries `aria-describedby` onto an sr-only sentence: \"Locked — requires {tier}. Activating opens upgrade options.\" That sentence, not the badge and not the dimming, is what makes locked programmatic, and it is why a padlock glyph or an opacity change is not enough.",
      "`trial-available` has no equivalent description. \"Free trial ×1\" is loose text in the trailing slot, outside the switch's name and description, so a screen-reader user hears an ordinary switch and has to find the badge separately.",
      "A gated switch always reports `aria-checked=\"false\"` and never changes. Activating it announces no state change at all — what announces is the upsell panel, which is `role=\"status\"` and therefore read when it appears.",
      "The tier badge repeats the tier already inside the lock description, so a gated row says \"Pro\" twice. Cheap redundancy rather than a defect, but do not add a third copy.",
    ],
    focus: [
      "Revealing the upsell moves focus nowhere. Focus stays on the switch that was activated and the panel is announced through its `role=\"status\"` — right for a status region, but it does mean the CTA is two Tabs away rather than under the cursor.",
      "Dismissing the upsell unmounts both of its buttons. If focus was on the dismiss button — which it is, for anyone who got there by keyboard — nothing restores it, so focus falls to `<body>` and the next Tab restarts from the top of the page. Move focus back to the switch inside your `onDismissUpsell`.",
      "The switch ships the vendored primitive's `focus-visible` ring and the two upsell buttons ship the standard Button ring, so nothing here depends on a focus style you have to supply.",
    ],
  },
  pitfalls: [
    "Opening a modal or navigating to a billing page from onRequestUpgrade. The spec is explicit that toggling a locked row reveals an inline upsell — wire it to flip `state` to inline-upsell in place, the same row stays mounted.",
    "Forgetting the switch in a locked row is still a real, focusable control — it has to stay clickable so it can report the activation attempt. Don't reach for the native `disabled` attribute or Base UI's `readOnly` switch prop; either one silently swallows the click before `onRequestUpgrade` ever fires.",
    "Treating `checked` as authoritative in a locked row. The row always renders its switch off regardless of what's passed in — the boolean only matters once `state` is `unlocked` or `trial-available`.",
    "Pairing text-muted-foreground with the upsell panel's bg-muted/30 surface for the description copy. Use text-foreground/70, the same fix promo-card uses on its own tinted surfaces — the muted/muted pairing measures under 4.5:1.",
  ],
};
