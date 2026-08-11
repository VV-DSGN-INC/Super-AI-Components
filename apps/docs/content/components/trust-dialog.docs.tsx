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
  pitfalls: [
    "Passing `defaultTrusted` (or a controlled `trusted` that starts `true`) as a shortcut for trusted users or internal tools. A gate that can start open isn't a gate — it's decoration.",
    'Softening the warning copy into reassurance ("this is probably fine") instead of naming what the content can actually do. The default text is deliberately plain; an override should stay specific, not friendlier.',
    "Passing a single-entry `accounts` array out of habit. A picker with nothing to pick isn't a decision — omit `accounts` entirely when there's only one place this can run.",
    "Treating `onContinue` as safe to call from anywhere once trust is granted once. It only fires from the Continue control in this dialog, on this render — there's no prop to remember a prior decision across runs.",
  ],
};
