import type { ComponentDocs } from "@/lib/component-docs";
import {
  GrantsWithoutRevoke,
  LedgerVisibleWhenEmpty,
  RevokeWiredOnEveryGrant,
  UnscopedUndatedGrants,
} from "./autonomy-selector.examples";

/**
 * Seeded from docs/design-system/component-specs.md#n9-autonomy-selector.
 * Translate the spec's internal voice into consumer-facing guidance — do not
 * ship the seed text verbatim.
 *
 * No "use client" here: this module is plain data read by a Server Component
 * (component-docs.tsx), which destructures `docs.whatItIs`, `docs.evidence`
 * and so on directly. The live examples need state (revoking a grant changes
 * the list), so they live in the ./autonomy-selector.examples client sidecar
 * and are referenced here as zero-prop elements.
 */
export const AutonomySelectorDocs: ComponentDocs = {
  whatItIs:
    "The standing-policy surface for an agent: one coarse dial with three levels — ask every time, auto-approve reads, full auto — sitting above the two lists that qualify it. Below the dial is the ledger of standing permissions already granted, each row revocable, and below that the tools that are never allowed regardless of level. It is the settings screen for how much the agent may do without asking, not the interrupt that asks.",
  whyItMatters:
    "Every agent product in the reference board ships the dial and then stops: Claude Code has permission modes and an auto mode, Cursor and GitHub Copilot both have an approve-everything switch, ChatGPT Workspace Agents has per-run autonomy. What almost none of them ship is the other half — the list of permissions you already handed out, with a way to take them back. A product that can create a permanent permission but cannot show you the ones you have already created is a one-way door, and that asymmetry is the reason this is a component rather than a radio group. The denial list is what makes the generous end of the dial safe to offer at all: because deny wins and takes no exceptions, full auto is a bounded promise instead of an open one.",
  evidence: ["Claude Code", "Cursor", "GitHub Copilot", "ChatGPT Workspace Agents"],
  anatomy: [
    {
      slot: "autonomy-selector",
      note: "Root column holding the level dial, the grant ledger and the denial list in that order.",
    },
    {
      slot: "autonomy-selector-level",
      note: "One level choice — its label plus the blast-radius sentence that says what changes if you pick it. Carries data-blocked when `locked` forbids raising to it.",
    },
    {
      slot: "autonomy-selector-grants",
      note: "The standing-permissions ledger, counted in its header. Always rendered; falls back to a line explaining that every action asks first.",
    },
    {
      slot: "autonomy-selector-denials",
      note: "The never-allowed list. Rendered only when there is something on it, and deliberately shaped unlike a grant — no trailing action, because deny is not revocable from here.",
    },
  ],
  usage:
    "Reach for it on a settings or trust screen, and anywhere a long-running agent session needs its policy visible while it runs — approval fatigue arrives during a run, not before it, so this is designed to be changed mid-flight. Leave the level uncontrolled with `defaultLevel` when the surface owns the setting; pass `level` and `onLevelChange` when it comes from your own store. Feed `grants` from wherever your Always allow decisions persist and wire `onRevoke` to delete one, and put anything policy forbids into `denials` rather than trying to express it as a missing grant. Use `locked` while a run is in flight: it blocks raising autonomy without ever blocking lowering it.",
  dos: [
    {
      text: "Render the ledger even when nobody has granted anything — the empty line is what tells a user no standing permission exists, and it is the state most of them are actually in.",
      example: <LedgerVisibleWhenEmpty />,
    },
    {
      text: "Wire onRevoke on every grant you show, so review and revoke are the same screen.",
      example: <RevokeWiredOnEveryGrant />,
    },
  ],
  donts: [
    {
      text: "Don't pass grants without onRevoke — the Revoke button only renders when the handler is there, so the ledger silently degrades into a list of permissions you can read but not withdraw.",
      example: <GrantsWithoutRevoke />,
    },
    {
      text: "Don't ship a grant with no scope and no date. An unscoped grant cannot be reviewed and an undated one cannot be audited, which leaves the row saying only that something, sometime, was allowed.",
      example: <UnscopedUndatedGrants />,
    },
  ],
  pitfalls: [
    "`locked` is not a disabled prop. It blocks raising the level and never blocks lowering it, so during a run the user can always tighten but not loosen — a safety control you cannot tighten during an incident is not one. If you want the whole control inert, this is not the prop, and it deliberately does not exist.",
    "Every Revoke button is labelled just \"Revoke\", whichever grant it belongs to. A screen-reader user moving through a ledger of five grants hears the same word five times, with only the reading order tying a button to its row. Keep `tool` values short and distinct, and treat per-row labelling as a known gap rather than something to patch by passing markup into the row.",
    "Grant text lands in EntityRow's title and description, and both truncate to a single line. A long tool identifier loses its tail exactly where the distinguishing part usually is, so prefer a short tool name with the detail in `scope`.",
    "The level is uncontrolled unless you pass `level`. If you do pass it, clicking a level will not move the selection on its own — the component calls `onLevelChange` and waits for you to feed the new value back, which is what lets a consumer refuse or confirm a raise before it takes effect.",
  ],
};
