import type { ComponentDocs } from "@/lib/component-docs";
import {
  ComposedRowsNotRebuilt,
  CostChipOverrideOnHighlight,
  MouseOnlyPreviewTrap,
  NestedInteractiveRow,
} from "./skill-menu.examples";

/**
 * Seeded from docs/design-system/component-specs.md#d6-skill-menu.
 * Translate the spec's internal voice into consumer-facing guidance — do not
 * ship the seed text verbatim.
 *
 * No "use client" here: this module is plain data read by a Server
 * Component (component-docs.tsx), which destructures `docs.whatItIs`,
 * `docs.evidence`, etc. directly. If a Do/Don't needs a live example,
 * define a zero-prop component in a sibling "skill-menu.examples.tsx"
 * client module ("use client" at the top of that file, not this one) and
 * reference it here as an element with no props, e.g.:
 *
 * // import { GoodThing } from "./skill-menu.examples";
 * // dos: [{ text: "...", example: <GoodThing /> }]
 *
 * An inline handler on an element created in *this* file — e.g.
 * `<SkillMenu onSelectSkill={() => {}} />` passed straight into
 * `dos`/`donts` — cannot be serialized across the server/client boundary
 * and breaks the static export.
 */
export const SkillMenuDocs: ComponentDocs = {
  whatItIs:
    "A two-pane, searchable menu of agent skills: a filterable list of rows on the left and a live preview of that skill's output on the right, closed out by a footer offering the two ways a new skill gets made — author it yourself, or hand it to the agent.",
  whyItMatters:
    "Freepik's skills menu, Manus's plugin list, Claude's own skills picker, and Zapier's action list all pair the list with a preview, because a skill entry without one is just a name — there's no way to tell what selecting it will actually produce until after you've already committed to the click. Surfacing the output ahead of that click turns the picker into a comparison tool instead of a guess, and it's why the preview — not the list itself — is the part of this component that earns its keep.",
  evidence: ["Freepik skills menu", "Manus plugins", "Claude skills", "Zapier actions"],
  anatomy: [
    { slot: "skill-menu", note: "Root: the two-pane frame around the searchable list and the preview." },
    {
      slot: "command-input",
      note: "The search box (cmdk) — matches a query against each row's `id` and its description, not against the visible title.",
    },
    {
      slot: "command-item",
      note: "One filterable, keyboard-navigable row; owns selection and the 'active' (previewed) state.",
    },
    {
      slot: "entity-row",
      note: "Composed unmodified for each row's icon, title and description chrome — rows are entity-row (A9), not a rebuilt list item.",
    },
    {
      slot: "cost-chip",
      note: "Optional per-action cost, rendered in entity-row's trailing slot only for skills that declare one.",
    },
    {
      slot: "skill-menu-preview",
      note: "The live output preview for whichever row is currently active — the differentiator the spec calls out.",
    },
    {
      slot: "skill-menu-footer",
      note: "The two authoring verbs, always present: create it yourself, or have the agent create it.",
    },
  ],
  usage:
    "Reach for it wherever a product lets someone pick from a library of pre-built skills, plugins or actions instead of typing a raw prompt — the moment there's more than a handful of options, search plus a preview beats a static list every time. Pass `skills` as plain data (`id`, `title`, optional `description`, `icon`, `cost`, and a `preview` node); the component owns filtering, the active/previewed row, and keyboard navigation. Wire `onSelectSkill` to actually apply the pick, and `onCreateSkill` / `onGenerateSkill` to the two authoring flows the footer always offers.",
  dos: [
    {
      text: "Compose entity-row for every row's icon, title and description — rows are entity-row per the design system, not a rebuilt list item.",
      example: <ComposedRowsNotRebuilt />,
    },
    {
      text: "When a skill carries a cost, render it through cost-chip with the same text-foreground override used elsewhere in the registry — cost-chip's own default text-muted-foreground-on-bg-muted styling doesn't clear the contrast minimum.",
      example: <CostChipOverrideOnHighlight />,
    },
  ],
  donts: [
    {
      text: "Don't gate the preview behind :hover only — a keyboard user tabbing or arrowing through the list would never see it, and neither would a switch-control user.",
      example: <MouseOnlyPreviewTrap />,
    },
    {
      text: "Don't nest a focusable control inside a row — the row itself is already the interactive option; a nested button doubles the tab stop and breaks screen-reader navigation.",
      example: <NestedInteractiveRow />,
    },
  ],
  accessibility: {
    keyboard: [
      "Three tab stops, and the list is not one of them: the search input, then the two footer buttons. Focus never leaves the input while you browse — cmdk drives the list through `aria-activedescendant`, so the rows are navigated without being focused.",
      "From the input, Arrow Down and Arrow Up move the active row, Home and End jump to the first and last, and Enter selects. The preview follows the active row, so arrow keys and hover reach the same state — the preview is genuinely not mouse-only.",
      "Escape does nothing. cmdk only handles Escape inside its dialog wrapper, and this composes `Command` directly, so if you put the menu in a popover of your own you own the dismissal key.",
      "The preview pane cannot be reached from the list at all. Anything focusable you render into `preview` comes after the two footer buttons in DOM order, so tabbing to it means tabbing past the whole footer.",
      'Nothing in the list is a real tab stop, which is the point: composing `entity-row` without `onSelect` keeps rows as plain `div`s, because a nested `button` inside a `role="option"` would be a doubled stop and an axe `nested-interactive` failure.',
    ],
    screenReader: [
      "The search field is a `combobox` wired to the list, and its name comes from the root's `label` prop — cmdk renders a visually hidden `<label>` that the input's own `aria-labelledby` already points at, which is why passing `aria-label` to the input instead loses and leaves the field unnamed.",
      'The list is a `listbox`, named here with the same string as the input (`searchLabel`, "Search skills" by default). Input and listbox therefore announce identically, which is redundant rather than wrong — a distinct name for the list would read better.',
      "Each row is an `option` whose name is computed from its contents: `entity-row`'s title and description and, when present, the cost chip's \"6 credits\". Adjacent `span`s fuse with no separator, so a title and description announce as one run of text rather than as two fields.",
      "**Filtering does not search the title.** `CommandItem` is given `value={skill.id}`, and cmdk scores against `value` plus `keywords` — which here is the description only. Typing a skill's visible name filters it out unless that name happens to appear in its `id`. Give every skill an `id` that contains the words a user would type, or the search box is a name-hider rather than a name-finder.",
      "**The preview is announced as nothing.** It swaps as the active row changes, but it is a plain `div` — no live region, and no `aria-describedby` from the option to it. A screen-reader user arrowing the list hears option names and never the output preview, which is the feature this component exists for. If the preview matters to your audience, put its gist in `description` too.",
      '"No skills found." is rendered by cmdk\'s `Empty`, which carries `role="presentation"`. It is not a status and not a live region, so filtering down to nothing is silent — the listbox simply reports no options.',
      "The active row is marked with a ring rather than a background, deliberately: `entity-row`'s icon and description keep their own `text-muted-foreground` whatever the parent paints, so a muted or accent fill would repeat the documented 4.34:1 pairing. The ring carries no meaning of its own — `aria-selected` on the option is what announces the state.",
      "Footer buttons are named by their labels and their icons are `aria-hidden`.",
    ],
    focus: [
      "Selecting a skill fires `onSelectSkill` and leaves focus in the search input. Nothing moves focus to the preview or out of the menu, so the host decides what happens next.",
      "When `skills` changes underneath the menu — an async load, or a filter that removes the active row — the active id falls back to the first item, and because that is derived during render rather than synced in an effect there is no flash of a stale selection. No focus moves, because focus was never in the list.",
      "The search input has **no visible focus ring**. cmdk's input carries `outline-hidden`, and the `InputGroup` frame around it keys its ring off a `data-slot=\"input-group-control\"` that cmdk's input does not set — so the first and most important tab stop in this component shows nothing when focused. The footer buttons are vendored `Button`s and do ship rings.",
    ],
  },
  pitfalls: [
    "entity-row's icon and description spans keep their own text-muted-foreground no matter what background the parent draws behind them. Marking the active row with a bg-muted/bg-accent/bg-secondary highlight repeats the exact 4.34:1 failure already documented for entity-row itself — mark the active row with a ring instead of a background, the way this component does.",
    "cmdk's built-in fix for icon colour on a selected item only reaches a literal direct-child <svg> of the row. Composing entity-row (which wraps its icon in its own span) puts the icon two levels too deep for that rule to ever apply — don't rely on it.",
    "Passing aria-label straight to the search input loses to the aria-labelledby cmdk always sets on it, which points at an internal hidden label. Name the whole menu through the root's label prop instead of the input's aria-label, or the search field ends up with no accessible name at all.",
  ],
};
