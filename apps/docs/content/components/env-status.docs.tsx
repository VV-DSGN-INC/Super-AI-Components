import type { ComponentDocs } from "@/lib/component-docs";
import {
  ColouredDotsOnly,
  FourRemedies,
  OneGenericError,
  SharedProviderIdentity,
} from "./env-status.examples";

/**
 * Seeded from docs/design-system/component-specs.md#n7-env-status.
 * Translate the spec's internal voice into consumer-facing guidance — do not
 * ship the seed text verbatim.
 *
 * No "use client" here: this module is plain data read by a Server
 * Component (component-docs.tsx), which destructures `docs.whatItIs`,
 * `docs.evidence`, etc. directly. Live examples that need handlers live in
 * the ./env-status.examples client sidecar and cross into this module as
 * zero-prop elements — see that file for why.
 */
export const EnvStatusDocs: ComponentDocs = {
  whatItIs:
    "A read-only list of the model providers a product is configured to use, each row stating in words whether it can actually be reached right now: ok, degraded, key invalid, or not running. It is restricted to reachability — it never renders a balance, a quota, or a spend figure.",
  whyItMatters:
    "This was restored to the catalog per decision D12 after an earlier consolidation dropped it, because a run can fail with a full balance when a key has simply expired, and a balance widget will never say so — reachability and spend are different facts and this is the surface for the first one. Four states exist because they carry four different remedies: degraded means wait, key invalid means go fix a credential, not running means start something locally. Collapsing them into a single red dot tells someone that something is wrong and nothing about what to do about it, which is the exact failure this component exists to prevent. It is the runtime counterpart to M7 connection-manager's configuration view — same providers, two surfaces — so the two must never be able to disagree about a provider's identity.",
  evidence: [],
  anatomy: [
    { slot: "env-status", note: "The list holding every provider row." },
    {
      slot: "env-status-provider",
      note: "One provider. Carries data-state so a host can style or query it.",
    },
    {
      slot: "env-status-badge",
      note: "The short word in entity-row's trailing slot — Ok, Degraded, Key invalid, Not running.",
    },
    {
      slot: "env-status-result",
      note: "The live region holding the condition and its remedy, below the row.",
    },
    {
      slot: "env-status-condition",
      note: "The row's state in words — the sentence that replaces a coloured dot.",
    },
    {
      slot: "env-status-remedy",
      note: "What to do about it. Different for every state, by design.",
    },
  ],
  usage:
    "Reach for it wherever a product needs to answer 'can I actually call this provider right now' — a settings page, a pre-flight check before a run, or a status panel alongside usage. Pass a `providers` array and own the polling: the component is a pure render of whatever state you hand it, it never fetches and holds no timer. Give each provider the same `id` and `name` a host also passes to M7 connection-manager, so the two surfaces read off one shared list rather than inventing separate labels for the same connection. Pair it with M2 credits-indicator when spend is also relevant — reachability and spend are two different facts and neither substitutes for the other.",
  dos: [
    {
      text: "Give every state its own remedy in words — wait, fix a credential, or start something locally are three different instructions, not three colours of the same dot.",
      example: <FourRemedies />,
    },
    {
      text: "Use the same id and name a host passes to connection-manager for the same provider, so configuration and liveness never disagree about what a row refers to.",
      example: <SharedProviderIdentity />,
    },
  ],
  donts: [
    {
      text: 'Don\'t collapse every failure into one generic "Error" label — it tells a user something is wrong and nothing about what to do next.',
      example: <OneGenericError />,
    },
    {
      text: "Don't rely on coloured dots alone. A colourblind user or a screen reader gets nothing from colour — the condition has to be stated in words on every row.",
      example: <ColouredDotsOnly />,
    },
  ],
  accessibility: {
    keyboard: [
      "Zero tab stops. Every row composes `entity-row` without `onSelect`, so each renders as a `div`, and the badge is text — there is not one focusable element in the whole component.",
      'That is right for a read-only report, but it means the remedies are instructions rather than actions. "Replace the key for this provider in Connections" cannot be followed from here, so the control that follows it has to live outside this component and be reachable on its own.',
      "No keys are handled. Arrow keys do not move between providers: the list is a plain `ul`, not a composite.",
    ],
    screenReader: [
      'Providers are a real `ul`/`li`, so the list announces with its item count. The `label` above it — "Provider status" by default — is a plain `span` that is not wired to the list, so the list itself has no accessible name.',
      "A row reads in slot order: the provider name, then `checkedAt` if you passed it, then the badge word. The status icon is `aria-hidden`, so nothing is carried by the glyph or by its colour.",
      'Every row carries its own `role="status"` live region holding the condition sentence and the remedy sentence. `role="status"` is implicitly atomic, so any change re-reads both sentences in full rather than only the part that moved.',
      "That is one live region per provider. A panel polling eight providers has eight regions competing to announce, and one refresh that changes three of them queues three complete two-sentence announcements.",
      'The badge word and the opening of the condition sentence are the same string — "Key invalid", then "Key invalid. The provider answered and rejected this request\'s credentials." — so every failing row is announced twice over. That is the price of the badge being readable on its own, not a defect, but it is what a listener hears.',
      "The four states are distinguished by words in three places (badge, condition, remedy) and by colour in none that carries meaning. Drop any of the three and the distinction falls back onto the border tint, which is exactly the failure this component was restored to prevent.",
    ],
  },
  pitfalls: [
    "Rendering a balance or credit count on this component. Reachability and spend are different facts — a run can fail with a full balance when a key has expired — and this surface answers only the first question. Pair with M2 credits-indicator for the second.",
    "Treating key-invalid and not-running as interchangeable failures. One asks the user to touch a credential; the other asks them to start a local process. Sharing copy between them sends people to fix the wrong thing.",
    "Inventing a different id or name for a provider than the one connection-manager uses for its configuration row. The two components are two surfaces over one set of facts and must describe the same provider identically.",
    "Polling or fetching inside this component. It renders whatever state a host hands it and holds no timer of its own — the same rule other live-state components in this registry (rate-limit-banner, quota-meter) already follow.",
  ],
};
