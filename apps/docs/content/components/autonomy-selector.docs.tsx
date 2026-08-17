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
  accessibility: {
    keyboard: [
      "The dial is one tab stop, not three. It is a real radio group, so arrow keys move between the levels and select as they go, and Space selects the focused one — which means arrowing through the dial changes the policy on every keypress, not on commit.",
      "Each level card is a `<label>` wrapping its radio, so clicking anywhere on the blast-radius sentence selects it. There is no separate keyboard route to the card; the radio is the control.",
      "A level blocked by `locked` renders as a disabled radio, so it cannot be activated. Lowering is never blocked — the guard only refuses moves that raise the rank — which is the property that makes this safe to leave on screen during a run.",
      "After the dial, one tab stop per Revoke button. Five grants is five stops, and there is no Delete or Backspace shortcut: revoking from the keyboard means tabbing to the row's button.",
      "The denial list has no controls at all. It is deliberately zero tab stops, because deny is not revocable from here.",
    ],
    screenReader: [
      "Each level's accessible name is the label and its blast-radius sentence together, because both sit inside the `<label>` the radio is in — \"Full auto, Everything not on the deny list runs unattended.\" The consequence is announced at the moment of choosing, which is the reason it is written as a sentence rather than a tooltip.",
      "The radio group itself has no accessible name, and there is no way to give it one: `...props` spreads onto the root `<div>`, not onto the group, so an `aria-label` you pass lands on the wrong element. It announces as an unlabelled radio group with three options.",
      "Every Revoke button is named just \"Revoke\", whichever grant it belongs to. A ledger of five grants is five identical buttons with only reading order tying each to its row — keep `tool` values short and distinct, and treat per-row labelling as a known gap rather than something to patch by passing markup into A9.",
      "A grant's scope and date are joined with a middot into A9's description, so they are announced as part of the row's text but are not associated with the Revoke button beside them.",
      "\"Standing permissions\" and \"Never allowed\" are rendered by A12 as plain spans inside a div, not as heading elements, so neither appears in a heading list. The two `<section>` wrappers have no accessible name either, so they are not exposed as regions — the counts and the words are visible structure only.",
      "A9 does not `aria-hidden` its icon slot, so the Ban glyph on a denial row will contribute to that row's text if the icon you swap in carries a title or a label.",
      "Nothing announces a revoke. The row simply disappears; there is no live region, so the only feedback is the list being shorter next time you read it.",
      "Nothing announces `locked` either. The blocked levels dim and disable, and no message says a run is in flight — put that sentence on the surface around this component.",
    ],
    focus: [
      "Revoking unmounts the button that had focus and nothing restores it, so focus falls to `<body>` and the next Tab restarts at the top of the page. Move focus inside your `onRevoke` — to the next grant's Revoke button, or to the section header when the list empties.",
      "Revoking the last grant replaces the whole list with the empty line, with the same result.",
      "Raising `locked` while focus sits on a level that becomes blocked disables the element under focus, which drops focus to `<body>` in most browsers. If you lock mid-run, lock before the user can be in the dial, or move focus yourself.",
      "The radios carry the vendored `focus-visible:ring-3`; the level card around them shows nothing on focus, so the indicator is a small circle at the start of a full-width row rather than an outline on the option. Revoke uses the shared button ring.",
    ],
  },
  pitfalls: [
    "`locked` is not a disabled prop. It blocks raising the level and never blocks lowering it, so during a run the user can always tighten but not loosen — a safety control you cannot tighten during an incident is not one. If you want the whole control inert, this is not the prop, and it deliberately does not exist.",
    "Every Revoke button is labelled just \"Revoke\", whichever grant it belongs to. A screen-reader user moving through a ledger of five grants hears the same word five times, with only the reading order tying a button to its row. Keep `tool` values short and distinct, and treat per-row labelling as a known gap rather than something to patch by passing markup into the row.",
    "Grant text lands in EntityRow's title and description, and both truncate to a single line. A long tool identifier loses its tail exactly where the distinguishing part usually is, so prefer a short tool name with the detail in `scope`.",
    "The level is uncontrolled unless you pass `level`. If you do pass it, clicking a level will not move the selection on its own — the component calls `onLevelChange` and waits for you to feed the new value back, which is what lets a consumer refuse or confirm a raise before it takes effect.",
  ],
};
