import type { ComponentDocs } from "@/lib/component-docs";
import {
  FooterThatAppearsLate,
  LockedKeepsTheShape,
  SameBoxEveryState,
  SelectModeWithHoverActions,
} from "./result-card.examples";

/**
 * Seeded from docs/design-system/component-specs.md#f1-result-card.
 *
 * No "use client" here: this module is plain data read by a Server Component
 * (component-docs.tsx), which destructures `docs.whatItIs`, `docs.evidence`
 * and the rest directly. Live examples that need interactivity live in the
 * ./result-card.examples client sidecar and are referenced here as zero-prop
 * elements.
 */
export const ResultCardDocs: ComponentDocs = {
  whatItIs:
    "One generated asset, wherever it appears — a fixed-aspect media frame with an optional prompt excerpt, badge and footer. The same card carries a result from the moment it is requested, through generating, to done, failed or locked; you change its `state`, never which component you render.",
  whyItMatters:
    "Generation is slow and results arrive out of order, so a gallery spends most of its life part-finished. If a card is a different size while it waits than it is once it resolves, every result that lands reflows the grid underneath the person reading it — they lose their place, and a click can land on the wrong asset. This card fixes its geometry once: the media box is a fixed aspect ratio, the footer reserves its height whether or not it has anything in it, and every state-specific treatment is drawn inside or over that box rather than added to it. Failure and paywalls get the same treatment for the same reason — a failed generation renders where the result would have been, with its retry inside the card, because a toast on the far side of the screen loses which of twenty tiles it was talking about.",
  evidence: ["Midjourney", "Freepik", "Playground", "getimg", "Runway"],
  anatomy: [
    {
      slot: "result-card",
      note: "The card. Carries `data-state`, so you can style or test against the lifecycle without reading props.",
    },
    {
      slot: "result-card-media",
      note: "The positioning context for everything drawn over the frame — progress, the select checkbox, hover actions.",
    },
    {
      slot: "preview-tile-frame",
      note: "A8 `preview-tile`'s fixed-aspect box. This is the element whose geometry never changes.",
    },
    {
      slot: "result-card-progress",
      note: "The streaming progress bar, pinned over the top of the frame so it contributes no layout.",
    },
    { slot: "result-card-select", note: "The select-mode checkbox. Present only when `selectable` is set." },
    {
      slot: "result-card-actions",
      note: "Hover actions, revealed on hover or keyboard focus. Suppressed whenever the checkbox is present.",
    },
    {
      slot: "result-card-retry",
      note: "Retry, rendered inside the failed treatment rather than anywhere else.",
    },
    {
      slot: "result-card-footer",
      note: "Actions, cost and provenance. Always rendered, with a reserved minimum height, even when empty.",
    },
    {
      slot: "result-card-status",
      note: "A visually hidden live region announcing each lifecycle transition.",
    },
  ],
  usage:
    "Render the card the moment a generation is requested, in `idle` or `queued`, so the slot exists at its final aspect ratio before any pixels do — then move it through `streaming` to `done`, `failed` or `locked` by updating `state`. Pass the media as children; the card treats it as opaque, so an image, a video, a waveform or a block of generated text all work without a variant. Put the prompt excerpt in `label` (it renders as an overlay, costing no layout) and cost, provenance and per-result actions in `footer`. Supply `onRetry` for failures and `lockedAction` for paywalled results. Leave `selectable` off for ordinary browsing; F2 `generation-grid` turns it on for every card at once when the user enters select mode.",
  dos: [
    {
      text: "Change `state` on one card rather than swapping components — the box is identical in every state, which is the whole point.",
      example: <SameBoxEveryState />,
    },
    {
      text: "Give `locked` the shape of what would have been made plus a CTA, never an empty box with a padlock.",
      example: <LockedKeepsTheShape />,
    },
  ],
  donts: [
    {
      text: "Don't render the footer conditionally outside the card — pass it as `footer` so its height is reserved whether or not there is anything to show.",
      example: <FooterThatAppearsLate />,
    },
    {
      text: "Don't leave hover actions live in select mode; the checkbox and the action button are two competing answers to what a click means.",
      example: <SelectModeWithHoverActions />,
    },
  ],
  pitfalls: [
    "`aspect` is what fixes the card's height, so a grid that mixes aspects will have rows of different heights no matter how stable each individual card is. Pick one aspect per grid, or accept a masonry layout deliberately.",
    'The card renders a `role="status"` region per instance. In a grid of twenty that is twenty live regions, and updating `progress` on every server tick makes each one announce again — throttle progress updates to every 5–10% rather than forwarding every event.',
    "`onSelect` means two different things depending on `selectable`: with it off, the tile itself becomes a button and reports `aria-pressed`; with it on, the tile stays inert and the checkbox is the only control. Passing `selectable` without `onSelect` gives you a checkbox that cannot be checked.",
    "The footer inherits `text-foreground`, not muted text, on purpose. Dropping a component in that sets its own muted foreground over a muted background reintroduces the 4.34:1 contrast failure this registry keeps hitting — A2 `cost-chip` currently still does exactly that.",
    "`progress` is ignored outside `streaming`. If your bar never appears, check the state before checking the number.",
  ],
};
