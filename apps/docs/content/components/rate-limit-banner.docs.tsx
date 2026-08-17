import type { ComponentDocs } from "@/lib/component-docs";
import {
  CauseNamedCorrectly,
  CountdownWithAnEscapeHatch,
  NoEstimateAndNoOptIn,
  ProviderOutageBlamedOnTheUser,
} from "./rate-limit-banner.examples";

/**
 * Seeded from docs/design-system/component-specs.md#m6-rate-limit-banner.
 * Translate the spec's internal voice into consumer-facing guidance — do not
 * ship the seed text verbatim.
 *
 * No "use client" here: this module is plain data read by a Server Component
 * (component-docs.tsx). Live examples live in the ./rate-limit-banner.examples
 * client sidecar and cross over as zero-prop elements.
 */

export const RateLimitBannerDocs: ComponentDocs = {
  whatItIs:
    "An inline banner that sits above the composer while the user cannot send, and says exactly two things: which constraint they hit, and how long it lasts. It carries two causes with two different messages — your own plan's cap, and the provider being at capacity — plus a live countdown fed by the host and an opt-in to be told when the wait ends.",
  whyItMatters:
    "Claude's usage limits, Midjourney's queue caps and Freepik's concurrency ceilings are three unrelated products that all hit the same wall: the user is stopped, and the interface has to explain why without making them feel penalised. Collapsing the two causes into one \"rate limited\" string is what loses trust — telling someone they overspent their quota when the truth is the model is busy is a false accusation, and they will go looking for a plan upgrade that fixes nothing. A live countdown does the other half of the work: \"try again later\" turns a known number into a polling loop, and people poll far more often than the wait deserves.",
  evidence: ["Claude", "Midjourney", "Freepik"],
  anatomy: [
    { slot: "rate-limit-banner", note: "The inline frame. A note, not an alert — it persists, so it must not interrupt." },
    { slot: "rate-limit-banner-title", note: "The cause, in one line. Fixed per cause; not overridable." },
    { slot: "rate-limit-banner-body", note: "The de-blaming sentence — names what is not wrong." },
    { slot: "rate-limit-banner-resource", note: "What is constrained: the model, the quota, the queue." },
    { slot: "rate-limit-banner-countdown", note: "The live clock, and the reached-zero message that replaces it." },
    { slot: "rate-limit-banner-no-eta", note: "Shown instead when no estimate exists. Never 'try again later'." },
    { slot: "rate-limit-banner-notify", note: "The opt-in toggle. Label is stable; aria-pressed carries state." },
    { slot: "rate-limit-banner-notify-status", note: "Visible confirmation once the opt-in is taken." },
    { slot: "rate-limit-banner-action", note: "An escape hatch that isn't waiting: upgrade, switch model, queue it." },
    { slot: "rate-limit-banner-status", note: "Sr-only polite live region, deliberately coarse — see pitfalls." },
  ],
  usage:
    "Render it above the composer for as long as the user cannot send, and remove it when they can. Pick `cause` from what your backend actually told you: `your-limit` when the ceiling is on the account, `provider-capacity` when the upstream model is saturated — if you cannot tell the two apart, fix that upstream before shipping this, because guessing is worse than either message. The component holds no timer and fetches nothing: pass `remainingSeconds` and re-pass it each second from your own interval, so the countdown can never disagree with the reset your server knows about. When there is genuinely no estimate, omit `remainingSeconds` and pass `onNotifyMe` instead — the opt-in is what replaces a countdown, not a vaguer sentence.",
  dos: [
    {
      text: "Name the real cause — a saturated provider gets the provider's message, never the quota one.",
      example: <CauseNamedCorrectly />,
    },
    {
      text: "Pair the countdown with a way out that isn't waiting, so the wait is a choice rather than the only option.",
      example: <CountdownWithAnEscapeHatch />,
    },
  ],
  donts: [
    {
      text: "Don't report a provider outage as the user's own limit — it sends them to buy an upgrade that changes nothing.",
      example: <ProviderOutageBlamedOnTheUser />,
    },
    {
      text: "Don't ship a banner with neither a countdown nor an opt-in; that's \"try again later\" and it turns users into pollers.",
      example: <NoEstimateAndNoOptIn />,
    },
  ],
  accessibility: {
    keyboard: [
      "One tab stop when `onNotifyMe` is passed, plus whatever is focusable inside `action`. The frame, the title, the body, the resource line and the clock are all static — nothing else here takes focus.",
      "The opt-in is a real button, so Space and Enter both fire `onNotifyMe`. It never disables itself once taken, so a second press fires again; make the subscription request idempotent rather than expecting the button to guard it.",
      "There is no way to dismiss the banner from the keyboard, by Escape or otherwise. It is removed by the host when the constraint lifts, which is the whole point of it not being a toast.",
      "It renders above the composer, so it inserts a tab stop in front of the input. Shift+Tab out of the composer lands on Notify me before it reaches whatever is above the banner.",
    ],
    screenReader: [
      "The root is `role=\"note\"`, overriding the `role=\"alert\"` the vendored `Alert` defaults to. It is deliberately not a live region: the title, body, resource and countdown are read when the user navigates to them, never pushed.",
      "The one live region is `rate-limit-banner-status` — an sr-only `role=\"status\"` (polite) span carrying the title, a bucketed wait phrase (\"about 3 minutes left\") and, once taken, the opt-in confirmation. Its text only changes when the minute or hour bucket rolls over, so it speaks about once a minute rather than sixty times.",
      "The visible clock and the announced wait therefore disagree by design: a sighted user watches `2:34` tick down, a screen-reader user hears \"about 3 minutes left\" and then silence until the bucket changes.",
      "The clock's accessible name is set with `aria-label` on a plain `<span>`. A `<span>` carries no role, and naming a generic element is inconsistently supported — where it is ignored, `2:34` is announced as the raw digits rather than as \"2 minutes 34 seconds\".",
      "The opt-in keeps a fixed label and carries its state on `aria-pressed`, so it announces as \"Notify me when my limit resets, toggle button, pressed\" instead of renaming itself. The confirmation sentence beneath it is separate visible text, not a colour change on the button.",
      "The cause glyph is `aria-hidden`, so the difference between your own quota and the provider's capacity survives entirely in the title and body wording — which is why those strings are fixed per cause and not overridable.",
    ],
    focus: [
      "Nothing here moves focus. Mounting the banner does not pull focus off the composer, and taking the opt-in leaves focus on the button while the confirmation line appears below it.",
      "When the wait ends the host unmounts the banner. If focus was on the opt-in at that moment it falls to `<body>` — move focus to the composer as you remove it.",
      "The opt-in inherits the shared `Button` focus ring; anything you supply through `action` brings its own, so check it has one.",
    ],
  },
  pitfalls: [
    "Reaching for a toast. The constraint persists for minutes; a toast persists for seconds, so it is gone by the time the user retypes their prompt and they hit the same wall with no explanation on screen. This is an inline, persistent banner by design — if your shell only has a toast slot above the composer, that is the thing to fix.",
    "Wrapping a per-second value in a live region. The vendored Alert defaults to `role=\"alert\"`, which is assertive: a countdown inside it would interrupt a screen-reader user once a second for the whole wait. This component overrides the root to `role=\"note\"` and puts the only live region in an sr-only `role=\"status\"` span whose text is bucketed to whole minutes — so it speaks about once a minute, not sixty times. If you add your own ticking content to the banner, keep it out of that region.",
    "Starting an interval inside the component. It has none on purpose: a self-ticking countdown drifts from the host's real reset time, keeps running after the limit clears, and cannot be server-rendered without a hydration mismatch. Own the clock in the host and re-pass `remainingSeconds`.",
    "Treating the opt-in as uncontrolled. Clicking `onNotifyMe` does not flip `notifyEnabled` — the subscription is the host's, so the banner only reflects what the host says the subscription is once the request lands.",
    "Distinguishing the two causes by colour. They share one frame deliberately; the icon shape and the sentence carry the difference, which is what keeps it legible to colourblind and screen-reader users alike.",
  ],
};
