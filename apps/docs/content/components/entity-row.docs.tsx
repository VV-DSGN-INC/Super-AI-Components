import type { ComponentDocs } from "@/lib/component-docs";
import {
  ChevronOnARowThatDoesNotNavigate,
  RowIsTheControl,
  RowWrapsAnotherControl,
  TrailingControlBorrowsTheTitle,
  TrailingControlHasNoName,
} from "./entity-row.examples";

/**
 * Seeded from docs/design-system/component-specs.md#a9-entity-row.
 * Translate the spec's internal voice into consumer-facing guidance — do not
 * ship the seed text verbatim.
 *
 * No "use client" here: this module is plain data read by a Server Component
 * (component-docs.tsx). The live examples live in ./entity-row.examples and
 * are referenced as zero-prop elements — see that file for why.
 */
export const EntityRowDocs: ComponentDocs = {
  whatItIs:
    "One line in a list of things: an optional icon, a title, an optional description, and a trailing slot that takes a badge, a chevron, a switch or a price without changing the row's shape. It is the smallest unit of every menu, connector list, provider list and queue in this registry — seventeen components compose it rather than drawing their own row.",
  whyItMatters:
    "After the card, this is the most repeated shape on the reference board: Manus skills, Freepik's AI tools, Zapier starters, Tripo's settings panes and Lovable connectors are all the same four slots at the same height. Centralising it is what stops a product from growing four subtly different list rows — and, more practically, it is where one accessibility decision gets made once for everyone. A row that paints itself rebinds `--muted-foreground` for its whole subtree, so a description or a price you pass into the trailing slot stays readable on the selected surface instead of landing at 4.34:1.",
  evidence: ["Manus", "Freepik", "Zapier", "Tripo", "Lovable"],
  anatomy: [
    {
      slot: "entity-row",
      note: "The row itself. A <button> with aria-pressed when you pass `onSelect`, a plain <div> otherwise — the same markup either way, one interactive and one not.",
    },
    {
      slot: "entity-row-icon",
      note: "Leading glyph, rendered only when `icon` is set. Decorative by convention: mark your own icon aria-hidden, the slot does not do it for you.",
    },
    { slot: "entity-row-title", note: "Required, truncates. This is the row's accessible name." },
    {
      slot: "entity-row-description",
      note: "Optional second line, truncates. Omitting it does not shorten the row — height is reserved either way.",
    },
    {
      slot: "entity-row-trailing",
      note: "Whatever sits at the end: a badge, a chevron, a switch, a cost chip. Never shrinks, so long titles give way first.",
    },
  ],
  usage:
    "Reach for it for any list where each line names a thing — a skill, a model, a connector, a sign-in provider, a queued job. Pass `onSelect` when picking the row is the action, and leave it off when the row is a container for a control that lives in `trailing`; those are the two shapes, and a row should never be both. `selected` is yours to hold: the row renders what you give it and never toggles itself, so a list keeps its selection in one place rather than in every row. Description is optional per row — mixing rows with and without one is expected and will not make the list look ragged.",
  dos: [
    {
      text: "Give the row exactly one control — either the row is clickable, or something in its trailing slot is.",
      example: <RowIsTheControl />,
    },
    {
      text: "Point an interactive trailing control at the row title for its name, by putting an id on the element you pass as `title`.",
      example: <TrailingControlBorrowsTheTitle />,
    },
  ],
  donts: [
    {
      text: "Don't pass onSelect and an interactive trailing control at the same time — that nests a button inside a button, doubles the tab stops and fails axe.",
      example: <RowWrapsAnotherControl />,
    },
    {
      text: "Don't drop a bare switch or button into the trailing slot and assume the row title names it — nothing connects them.",
      example: <TrailingControlHasNoName />,
    },
    {
      text: "Don't put a chevron on a row that toggles or picks rather than navigates — the arrow is a promise of a next screen.",
      example: <ChevronOnARowThatDoesNotNavigate />,
    },
  ],
  accessibility: {
    keyboard: [
      "With `onSelect` the row is one tab stop and a real `<button>`: Space and Enter both fire it. Without `onSelect` it is a `<div>` with no tab stop at all, and the only reachable thing is whatever you put in `trailing`.",
      "A list of rows is one tab stop per row. There is no roving tabindex and no arrow-key navigation, so twenty rows is twenty Tab presses and Up and Down do nothing.",
      "`disabled` behaves differently in the two shapes and only one of them is safe. An interactive row becomes `<button disabled>` and leaves the tab order. A non-interactive row gets `aria-disabled` and `pointer-events-none`, which stops the mouse and not the keyboard — a switch or button in `trailing` stays tabbable and stays activatable by Space on a row that looks disabled.",
      "No Escape, no Delete, no shortcut of any kind. Acting on a row from the keyboard means a control in `trailing`, and that control is a second tab stop.",
    ],
    screenReader: [
      "An interactive row announces as a toggle button, because it always renders `aria-pressed` — `true` or `false`, never absent. A row that navigates therefore reports a pressed state that nothing in the product toggles.",
      'The row\'s accessible name is computed from its contents, so title, description and any text in `trailing` are read as one string: a row titled "Anthropic" with the description "Checked 2 minutes ago" and a "Key invalid" badge announces as all three.',
      "The icon slot is not `aria-hidden` — it only carries a colour class. A lucide glyph hides itself, but any other node you pass adds its text to that name.",
      "A non-interactive row has no role. It is a bare `div`: not a list item, not a group, not announced as a unit. If the list matters, wrap the rows in your own `ul`/`li`.",
      "`aria-disabled` on a non-interactive row marks the row and nothing inside it, so descendant controls stay enabled to assistive tech. That is the same hole the keyboard note describes, seen from the other side.",
      "Nothing announces a selection change. `selected` flips `aria-pressed` and `data-state` with no live region, so a list whose selection moves from anywhere other than the row itself changes silently.",
    ],
    focus: [
      "Only the interactive shape ships a `focus-visible` ring. A non-interactive row's `trailing` control carries whatever focus style you gave it, and the row itself can never take focus.",
      "Nothing moves focus, and the row is a `<button>` in one branch and a `<div>` in the other — so toggling `onSelect` on a focused row swaps the element out from under the focus and drops it to `<body>`.",
    ],
  },
  pitfalls: [
    "Any row with `onSelect` renders aria-pressed, including one whose trailing chevron says it navigates. A screen reader will announce a pressed state that nothing in the product actually toggles. Until that is fixed, prefer a plain row plus your own link for navigation rows, or accept that the row reads as a toggle.",
    'The component spreads `...props` after its own attributes, so passing `data-slot` overwrites `data-slot="entity-row"` and makes the row invisible to every selector that looks for it. Address rows by a data attribute of your own (`data-action-id` is the pattern action-stack and ai-tools-menu use) rather than renaming the slot.',
    "`disabled` produces two different renderings: an interactive row becomes a real `<button disabled>`, a non-interactive one gets `aria-disabled`. Both dim to 50% opacity, which is a visual signal only — if the reason a row is unavailable matters, say it in the description rather than relying on the dimming.",
    "The row aligns its text with `text-start`, so the title and description follow `dir` along with the flex order. Anything you pass into `trailing` is your own markup and does not: physical classes there (`ml-*`, `text-left`, a `ChevronRight` glyph) will not mirror, so reach for the logical form or flip the icon at the call site.",
  ],
};
