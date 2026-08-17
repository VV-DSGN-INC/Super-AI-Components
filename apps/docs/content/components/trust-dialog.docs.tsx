import type { ComponentDocs } from "@/lib/component-docs";
import {
  AccountPickerAsSeparateStep,
  AccountPickerOnContinue,
  PreCheckedContinue,
  PreviewAboveWarning,
} from "./trust-dialog.examples";

/**
 * Seeded from docs/design-system/component-specs.md#n2-trust-dialog.
 * Translate the spec's internal voice into consumer-facing guidance — do not
 * ship the seed text verbatim.
 *
 * No "use client" here: this module is plain data read by a Server
 * Component (component-docs.tsx), which destructures `docs.whatItIs`,
 * `docs.evidence`, etc. directly. Live examples that need interactivity live
 * in the ./trust-dialog.examples client sidecar and get referenced here as
 * zero-prop elements — see that file for why.
 */
export const TrustDialogDocs: ComponentDocs = {
  whatItIs:
    "A modal gate for running content the user didn't author — a community template, a shared automation, a pasted script. It shows what's about to run, states plainly that it's third-party, and keeps the primary action disabled until a trust checkbox is ticked. When more than one place the content could execute exists, that choice rides on the same Continue control rather than a separate screen.",
  whyItMatters:
    "Running someone else's prompt or code has gone from an edge case to routine — templates, marketplace agents, shared workflows. v0's template-install dialog is the reference: it doesn't let a user skip past what a template does before running it, and it makes clear where that run is about to happen. Without a dedicated gate, teams tend to either skip confirmation entirely or bolt on a plain \"Are you sure?\" that carries none of the actual information a decision like this needs.",
  evidence: ["v0"],
  anatomy: [
    {
      slot: "trust-dialog",
      note: "The dialog surface itself — an AlertDialogContent with this component's identity.",
    },
    { slot: "trust-dialog-header", note: "Title and optional description, naming what's being reviewed." },
    { slot: "trust-dialog-preview", note: "What will run. Always rendered first — never behind a toggle." },
    {
      slot: "trust-dialog-warning",
      note: 'The third-party warning. role="note", since the dialog itself already owns the assertive announcement on open.',
    },
    { slot: "trust-dialog-checkbox-row", note: "The trust checkbox and its label, as one clickable row." },
    { slot: "trust-dialog-footer", note: "Cancel and the Continue control." },
    { slot: "trust-dialog-continue-group", note: "Continue plus the account picker, joined as one control." },
    {
      slot: "trust-dialog-continue",
      note: "The only control that can fire onContinue — disabled until the checkbox is checked.",
    },
    {
      slot: "trust-dialog-account-trigger",
      note: "The destination picker, rendered only when accounts are passed.",
    },
  ],
  usage:
    "Reach for it anywhere your product is about to execute content it didn't write — installing a template, running a shared automation, acting on an agent-suggested script. Pass `preview` with the actual thing that will run (a manifest, a command, a file list) rather than a generic description, and let the default warning copy stand unless you have something more specific to say about this particular content. Add `accounts` only when there's a real choice of where execution happens; a single destination doesn't need a picker riding on Continue.",
  dos: [
    {
      text: "Keep the preview visible above the warning, every time — the decision to trust something comes after seeing what it actually does, never before.",
      example: <PreviewAboveWarning />,
    },
    {
      text: "Attach the destination picker to Continue itself when more than one execution account exists, instead of a field or screen of its own.",
      example: <AccountPickerOnContinue />,
    },
  ],
  donts: [
    {
      text: "Don't wire Continue to run regardless of the checkbox — TrustDialog's own Continue reads its disabled state from the checkbox on every render, with no prop that starts it enabled.",
      example: <PreCheckedContinue />,
    },
    {
      text: "Don't move the account choice ahead of the review, as its own step — it belongs on Continue, decided at the same moment as the decision to run.",
      example: <AccountPickerAsSeparateStep />,
    },
  ],
  accessibility: {
    keyboard: [
      "The dialog traps focus. Tab cycles the trust checkbox, then Cancel, then Continue once it is enabled, then the account trigger when `accounts` is passed — three stops before the box is ticked, four after.",
      "Continue is genuinely `disabled` until then, so it is not merely dimmed: it is absent from the tab order, and ticking the checkbox inserts a new stop between Cancel and the picker.",
      "Space toggles the checkbox; Enter and Space activate Cancel and Continue; the account picker opens on Enter, Space or Down and takes arrow keys and type-ahead from there.",
      "Escape closes the dialog and fires `onOpenChange(false)` — it does not call `onCancel`, which is wired to the Cancel button's click alone. An outside press does not close it, which is the reason this is an alert dialog rather than a dialog.",
      "The preview is `max-h-40 overflow-auto` with no `tabIndex` and nothing focusable inside it. Any preview taller than 10rem — which is most real manifests, commands and file lists — cannot be scrolled from the keyboard at all, so the content the gate exists to make people read is mouse-only. Keep previews short, or wrap yours in a focusable, named scroll container before passing it in.",
    ],
    screenReader: [
      "Base UI gives the popup `role=\"alertdialog\"` labelled by the title, and described by the description only when you pass one — the preview and the warning are body content, not `aria-describedby` targets. Omit `description` and the dialog announces its title and then falls to the body.",
      "The warning is `role=\"note\"`, overriding the vendored Alert's `role=\"alert\"`, so opening the dialog announces once rather than twice over itself.",
      "The checkbox is named by the `<label>` that wraps it, so its accessible name is the whole `trustLabel` sentence and the entire bordered row is a click target for it.",
      "The account trigger is named `\"<accountLabel>: <account name>\"` — \"Run in: Production\" — so the destination is spoken as part of the control rather than only drawn inside it.",
      "Continue becoming enabled is announced as nothing. Ticking the box announces the checkbox's own state and no more; the button silently joins the tab order, with no live region to say the gate has opened.",
      "Pass `accounts` without `selectedAccountId` and the picker falls back to the first account: the trigger announces it as chosen and `onContinue` receives its id. Nothing distinguishes that default from a real choice, which on a safety gate is worth deciding deliberately.",
    ],
    focus: [
      "Opening moves focus into the popup and closing returns it to the trigger, inherited from Base UI rather than implemented here.",
      "Ticking the checkbox does not move focus to Continue. Focus stays on the checkbox and the newly enabled button is one Tab past Cancel — enabling and acting stay two deliberate steps.",
      "Continue is `disabled`, not `aria-disabled`, so a controlled `trusted` flipped back to false from outside while Continue has focus drops focus to `<body>` inside a focus-trapped dialog, and the next Tab restarts at the top of it.",
      "Every focus ring in the dialog comes from the vendored `Button`, `Checkbox` and `Select`; the component adds none of its own.",
    ],
  },
  pitfalls: [
    "Passing `defaultTrusted` (or a controlled `trusted` that starts `true`) as a shortcut for trusted users or internal tools. A gate that can start open isn't a gate — it's decoration.",
    'Softening the warning copy into reassurance ("this is probably fine") instead of naming what the content can actually do. The default text is deliberately plain; an override should stay specific, not friendlier.',
    "Passing a single-entry `accounts` array out of habit. A picker with nothing to pick isn't a decision — omit `accounts` entirely when there's only one place this can run.",
    "Treating `onContinue` as safe to call from anywhere once trust is granted once. It only fires from the Continue control in this dialog, on this render — there's no prop to remember a prior decision across runs.",
  ],
};
