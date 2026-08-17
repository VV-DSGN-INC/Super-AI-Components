import type { ComponentDocs } from "@/lib/component-docs";
import {
  ProviderRowIsJustTheBrand,
  ProviderRowNamesTheAction,
  UnavailableProviderIsJustDimmed,
  UnavailableProviderSaysWhy,
} from "./auth-shell.examples";

/**
 * Seeded from docs/design-system/block-specs.md — O14 `auth-shell`.
 *
 * No "use client" here: this module is plain data read by a Server Component
 * (component-docs.tsx), which destructures `docs.whatItIs`, `docs.evidence`
 * and the rest directly. Live examples live in the ./auth-shell.examples
 * client sidecar and arrive here as zero-prop elements.
 */
export const AuthShellDocs: ComponentDocs = {
  whatItIs:
    "The page shell for signing in and signing up: a pitch pane beside a card that holds a list of identity providers, an email form underneath them, and the terms and privacy links. It is a block, so it owns arrangement and nothing else. The split layout is L6 onboarding-wizard's own split-panel variant, the provider rows are A9 entity-row, and an unconfigured provider list falls to L1 empty-state. There is no auth logic anywhere in it — no SDK, no session, no redirect. Providers and copy are props, and picking a row raises an event.",
  whyItMatters:
    "Tripo is the reference here, and it is the one archetype on the board with no AI content in it at all — which is exactly why it is easy to leave until last and then rebuild badly, three times, in three products. Two of its decisions are the ones worth copying. The first is that the marketing pane is not a separate design: it is the same split layout as first-run onboarding, so the screen that asks for an account and the screen that sets one up read as one family rather than two teams. The second is that terms and privacy are part of the component. A legal line that is a slot someone has to remember to fill is a legal line that ships empty, so it is a declared region with real link props, mounted whether or not you pass anything.",
  evidence: ["Tripo"],
  anatomy: [
    {
      slot: 'data-region="marketing-panel"',
      note: "The pitch pane, inside L6's own panel slot. Rebinds --muted-foreground, because L6 paints that pane bg-muted.",
    },
    {
      slot: 'data-region="provider-rows"',
      note: "A9 entity-row per provider, in a named group. L1 when nothing is configured.",
    },
    {
      slot: 'data-region="email-fallback"',
      note: "An or divider, a labelled email field and its submit. Replaceable whole via emailFallback.",
    },
    {
      slot: 'data-region="legal-footer"',
      note: "Terms and privacy, always mounted, at foreground contrast rather than muted.",
    },
    {
      slot: "auth-shell",
      note: "Root. Centres the card, scrolls when the viewport is short, carries data-mode.",
    },
    {
      slot: "auth-shell-email-form",
      note: "The form. Submits are always prevented; the shell never navigates.",
    },
    { slot: "auth-shell-email-submit", note: "The email primary action. Relabel it with emailSubmitLabel." },
    {
      slot: "auth-shell-mode-switch",
      note: "Sign in to sign up and back. Rendered only when onModeChange is given.",
    },
    { slot: "auth-shell-legal", note: "The default legal sentence, replaceable whole via legal." },
  ],
  usage:
    "Reach for it for the sign-in and sign-up screens of any product, AI or not. Everything is a prop: `providers` fills the rows, `marketing` fills the pitch pane, `title` and `description` carry your own copy, and `mode` picks between the sign-in and sign-up defaults. Wire `onSelectProvider` to whatever your identity stack wants — the shell will not redirect, will not post the form, and holds no session of its own; the only state it keeps is the email field, and passing `email` takes even that back. Give every provider a `disabledReason` rather than relying on `disabled` alone, and pass your real `terms` and `privacy` routes before you ship, because the defaults are placeholders. If your product has one identity route and no others, leave `providers` empty: the region stays mounted, shows L1, and the email form below it is still the whole screen.",
  dos: [
    {
      text: "Title each provider row with the action, so the row's accessible name says what pressing it does.",
      example: <ProviderRowNamesTheAction />,
    },
    {
      text: "Give an unavailable provider a written reason, so the state survives without seeing the dimming.",
      example: <UnavailableProviderSaysWhy />,
    },
  ],
  donts: [
    {
      text: 'Don\'t label a row with the vendor alone — a button named "Google" announces a brand, not an action.',
      example: <ProviderRowIsJustTheBrand />,
    },
    {
      text: "Don't let dimming be the whole signal for an unavailable provider; it leaves a dead row with no explanation.",
      example: <UnavailableProviderIsJustDimmed />,
    },
  ],
  accessibility: {
    keyboard: [
      "Tab order follows reading order, not the visual split: the providers first, one stop each, then the email field, its submit, the mode switch when `onModeChange` is given, then the terms and privacy links. The pitch pane comes last whichever side `marketingSide` puts it on, because L6 renders it after the question and moves it with `order`.",
      "L6's Back, Skip and primary buttons are suppressed with `display: none`, which removes them from the tab order as well as from the screen. That is the whole point of the suppression — but it is CSS, so a `className` that fights those two utilities puts three dead controls back into the tab order.",
      "A provider marked `disabled` is a real `<button disabled>` — the shell always hands A9 a handler so it takes its button branch — so Tab skips it entirely, and its written reason is reachable only in a screen reader's browse mode.",
      "Enter in the email field submits the form: the shell prevents the default and calls `onEmailSubmit`. The field is `required`, so an empty Enter raises the browser's own validation bubble rather than anything the component draws.",
      "The provider list is a `role=\"group\"`, not a listbox or a radiogroup, so arrow keys do nothing and there is no roving focus. Ten providers is ten tab stops before the email field.",
      "Nothing responds to Escape. There is no dismissable surface here.",
    ],
    screenReader: [
      "The provider list is a named group — `providersLabel`, defaulting to \"Sign-in providers\" or \"Sign-up providers\" from `mode`.",
      "Each row's accessible name is everything A9 puts inside the button: the title, the description and the trailing slot together. \"Continue with Google, you@northwind.com, Last used\" is one name. Titling a row with the vendor alone gives you a button named \"Google\", which announces a brand rather than an action.",
      "A9 does not `aria-hidden` its icon slot. A provider mark that carries a `<title>`, an `alt`, or an `aria-label` is therefore prepended to that same name — pass genuinely decorative markup, or hide it yourself.",
      "A disabled provider's `disabledReason` is inside the same button, so \"unavailable\" is spoken as words alongside the disabled state rather than signalled by dimming. A9 truncates the description to one line visually; the full string is still in the accessible name.",
      "The email field has a real `<label>` wired with `htmlFor`, plus `type=\"email\"` and `autoComplete=\"email\"`.",
      "The heading is L6's `<h3>`. On a page whose only content is this shell, the main heading announces at level three with no h1 or h2 above it, so heading navigation lands mid-outline. Give the page its own h1 if that matters to you.",
      "L6's progress bar is suppressed along with the nav, so nothing announces a step count — which is correct here, since there is only one step.",
      "The legal links are plain anchors named by `terms.label` and `privacy.label`, painted at foreground contrast rather than muted, because that is the one line on the screen that has to stay readable.",
      "Nothing announces the outcome of picking a provider or submitting an address. There is no live region anywhere in the shell, so an async handler needs its own status message.",
    ],
    focus: [
      "L6 moves focus to its heading when the step id changes. This shell has one step whose id never changes, so that never fires: the shell steals no focus on mount and moves none of its own.",
      "Switching mode re-renders the same tree with different copy. The mode-switch button stays mounted and keeps focus, but its label flips under the user — \"Create an account\" becomes \"Sign in\" — with nothing announcing the change and no focus move to the new heading.",
      "Provider rows, the email field, the submit and the mode switch all carry the shared primitives' `focus-visible` ring. The two legal links carry none of their own, so they fall back to whatever outline your app provides.",
    ],
  },
  pitfalls: [
    "L6 is a wizard, so it always draws a progress rail and a Back / Skip / primary footer. This screen has one step and nothing to skip, so the shell suppresses both with a descendant variant on L6's root — `display:none`, which takes those three controls out of the tab order and the accessibility tree as well as off the screen. If you pass a `className` that fights those two utilities, three dead buttons come back. The real fix belongs in L6: a `progress={false}` / `nav={false}` opt-out so a single-step split-panel surface can compose it without an override at all.",
    "L6 paints its panel `bg-muted`, and this token set's muted foreground measures 4.34:1 against that surface — under the 4.5:1 minimum. Anything you drop into `marketing` brings its own `text-muted-foreground` with it, and styling this shell's slots cannot reach inside a component you passed in. The marketing region therefore rebinds `--muted-foreground` to the plain foreground for its whole subtree. Keep that rebind if you re-wrap the pane, and do not re-add `text-muted-foreground` to anything you put in it expecting it to be quiet.",
    "The vendored field separator paints its `or` chip `bg-background` so it can sit over the rule — which is the wrong token inside a card. In light mode `--card` and `--background` are the same value and the bug is invisible; in dark mode they diverge and the chip renders as a darker notch across the divider. The shell repaints it `bg-card` through a descendant variant, so check that override survives if you replace the divider.",
    "A9 renders a `<div>` when it is given no `onSelect`, and a div cannot carry a disabled control's semantics. The shell therefore always hands A9 a handler, even for a provider you marked `disabled`, so the row is a real `<button disabled>`. If you build provider rows yourself, do the same — an inert-looking div with no handler is still in the reading order and announces nothing about being unavailable.",
    'A9 truncates its description to a single line, so a long `disabledReason` — the sentence that is the whole reason the disabled row is legible — clips to an ellipsis on a phone. Keep it to about four words ("Ask an admin to enable SAML"), or put the long version somewhere that wraps.',
    "The card is centred with an auto margin rather than `items-center`, because a flex item taller than its scrolling parent puts its own overflow above the scroll origin, where nothing can reach it. On a 375px viewport that silently eats the heading. If you re-wrap or re-centre the root, use auto margins, not centre alignment.",
    "`terms` and `privacy` default to `/terms` and `/privacy`. Those are placeholders that keep the region honest in Storybook, not routes that exist in your app. Replace them, or replace the whole line with `legal`.",
    "The chrome suppression is CSS, and jsdom computes no stylesheet — so in unit tests `getByRole('button', { name: 'Back' })` still finds L6's hidden nav buttons. Assert against the shell's own regions and slots instead of trying to prove absence by role; the browser a11y gate is what actually sees the suppression.",
    "lucide ships no brand marks, so there is no Google or GitHub glyph to reach for. Provider icons are yours to supply through `provider.icon`; whatever you pass is decorative, because the row title is the accessible name.",
    "Everything except the email field is controlled. Rendering the shell with `providers` and no `onSelectProvider`, or with `mode` and no `onModeChange`, produces a screenshot rather than a screen — the mode switch does not even render without a handler to call.",
  ],
};
