import type { ComponentDocs } from "@/lib/component-docs";
import {
  KeyRenderedBack,
  OneGenericError,
  RequirementsBeforeDownload,
  SeparateFailures,
} from "./connection-manager.examples";

/**
 * Seeded from docs/design-system/component-specs.md (M7).
 *
 * No "use client" here: this module is plain data read by a Server Component
 * (component-docs.tsx), which destructures `docs.whatItIs`, `docs.evidence`,
 * etc. directly. Live examples that need handlers live in the
 * ./connection-manager.examples client sidecar and cross into this module as
 * zero-prop elements — see that file for why.
 */

export const ConnectionManagerDocs: ComponentDocs = {
  whatItIs:
    "The settings surface where a user connects the model providers a product will call on their behalf: paste an API key, test it, or download a model that runs locally instead. Each provider is one row that states its connection in words — not connected, connected, key rejected, provider unreachable — alongside a masked fingerprint of whatever key is stored and an explicit test-connection action.",
  whyItMatters:
    "It was added to the catalog per gaps.md T5 and decision D12: a trust surface whose absence is a defect rather than a scope decision. Bring-your-own-key is how most products let people use models they already pay for, and the moment a key stops working the interface has to answer one question correctly — is this my key, or is this them? Products that answer with a single generic connection error send users to revoke and regenerate credentials that were never the problem, which costs them time and rotates a working secret for nothing. The same row is the only honest place to state a local model's hardware requirements, because that has to happen before a multi-gigabyte download rather than after it.",
  evidence: [],
  anatomy: [
    { slot: "connection-manager", note: "The card holding every provider row." },
    {
      slot: "connection-manager-provider",
      note: "One provider. Carries data-status and data-kind so a host can style or query it.",
    },
    {
      slot: "connection-manager-result",
      note: "Live region holding the condition and its remedy; where a test result lands and is announced.",
    },
    {
      slot: "connection-manager-condition",
      note: "The row's state in words — the sentence that replaces a coloured dot.",
    },
    {
      slot: "connection-manager-remedy",
      note: "What to do about it. Different for every failure, by design.",
    },
    {
      slot: "connection-manager-key-field",
      note: "Labelled password field plus Save. Present only when there is a key to enter or replace.",
    },
    {
      slot: "connection-manager-key-input",
      note: "The write-only input itself: type=password, uncontrolled, cleared on save.",
    },
    {
      slot: "connection-manager-requirements",
      note: "Hardware requirements for a local model, rendered above the download button.",
    },
    {
      slot: "connection-manager-requirement",
      note: "One requirement, with data-met when the host can detect it.",
    },
    {
      slot: "connection-manager-blocked",
      note: "Stated reason the download is unavailable on this machine.",
    },
    {
      slot: "connection-manager-actions",
      note: "Test connection, Replace key, Download — whichever the row's state actually offers.",
    },
  ],
  usage:
    "Reach for it on a settings page where users supply their own provider credentials or opt into a local model. Pass a `providers` array and own the state: the component renders a row per provider and calls back, it never fetches, never stores, and never holds a key. `onSaveKey` receives the key exactly once and should hand back a masked `fingerprint`, not a value; `onTest` should set `testing` and then write the verdict back as the row's next `status`. Leave a freshly saved key at `not-set` with a fingerprint set — the row then reads as saved-but-untested until a test resolves it. It pairs with a runtime health view of the same providers (N7 `env-status`, not yet built): configuration and liveness are two surfaces over one set of facts, so give both the same provider identity and never let them disagree.",
  dos: [
    {
      text: "Keep a rejected key and an unreachable provider apart — they read differently, and only one of them asks the user to touch their credentials.",
      example: <SeparateFailures />,
    },
    {
      text: "State hardware requirements above the download button, and block the download when the machine cannot run the model.",
      example: <RequirementsBeforeDownload />,
    },
  ],
  donts: [
    {
      text: "Don't collapse both failures into one generic error — it sends people to regenerate a key that was working.",
      example: <OneGenericError />,
    },
    {
      text: "Don't render a stored key back to the page, not even read-only, truncated, or behind a reveal toggle. Show a fingerprint instead.",
      example: <KeyRenderedBack />,
    },
  ],
  pitfalls: [
    "Testing on save. Saving stores a credential; testing asks the provider a question. Fusing them means a save failure and a provider outage produce the same message, and the user cannot tell which happened.",
    "Looking for a `keyValue` prop. There isn't one, deliberately — the input is uncontrolled and is cleared the moment its value is handed to `onSaveKey`, so the component has nothing left to leak. Derive the fingerprint on your side and pass that back.",
    "Reaching for a tooltip to hold the key, the fingerprint, or the failure detail. A tooltip is not an accessible name and not a safe place for a secret; everything this component needs to say, it says on the row.",
    "Setting a freshly saved key to `valid`. Nothing has checked it yet. Leave the status at `not-set` with the fingerprint present, and the row states that it is untested — which is what makes the separate test action worth pressing.",
    "Styling the four conditions as coloured dots in a host theme. The words are the state; the icons are decorative and hidden from assistive tech, and the border treatment only marks the one failure that asks the user to act.",
  ],
};
