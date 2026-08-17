import type { ComponentDocs } from "@/lib/component-docs";
import {
  BareToggleNoDescription,
  DescribedToggleRow,
  DestructiveAsText,
  FilledDestructiveButtonBesideToggles,
} from "./settings-dialog.examples";

/**
 * Seeded from docs/design-system/component-specs.md#m1-settings-dialog.
 *
 * No "use client" here: this module is plain data read by a Server Component
 * (component-docs.tsx), which destructures `docs.whatItIs`, `docs.evidence`,
 * etc. directly. Live examples that need a handler live in the
 * ./settings-dialog.examples client sidecar and cross into this module as
 * zero-prop elements.
 */
export const SettingsDialogDocs: ComponentDocs = {
  whatItIs:
    "A settings surface built from a section nav on the left and a panel of setting rows on the right. Every row is a label, a description and one control; the nav is a real tablist, so the section you pick is programmatically tied to the panel it reveals. It ships in two variants — a modal for quick preferences and a full page that adds settings search and deep-linkable sections — and both render the identical row grid.",
  whyItMatters:
    "Settings is where a product admits what it can be told to do, and it is usually the least designed screen in the app. The reference board splits cleanly: the Playground settings dialog is the modal case, Lovable's full-page settings the addressable one, and Spline and Descript sit between them with sectioned navs deep enough to need searching. Holding both to one row grid is what stops a product growing two visually different settings screens as its surface area grows — and pinning the description as a required field is what stops the grid degrading into a column of unexplained switches.",
  evidence: ["Playground", "Lovable", "Spline", "Descript"],
  anatomy: [
    {
      slot: "settings-dialog",
      note: "Root. The dialog popup, or the full-page container — `data-variant` says which.",
    },
    {
      slot: "settings-dialog-header",
      note: "Title and optional description; the dialog variant's is the Dialog header.",
    },
    {
      slot: "settings-dialog-search",
      note: "Settings search. Full-page only — it holds the query input and the result count.",
    },
    {
      slot: "settings-dialog-search-status",
      note: "Live count of matching settings, announced as a status.",
    },
    { slot: "settings-dialog-body", note: "The tablist-and-panel layout that both variants share." },
    { slot: "settings-dialog-nav", note: "The section nav — a vertical tablist, not page navigation." },
    {
      slot: "settings-dialog-nav-item",
      note: "One section tab; carries the tier badge and, while searching, its match count.",
    },
    { slot: "settings-dialog-tier", note: "Plan tier for the section, rendered as the word." },
    { slot: "settings-dialog-nav-matches", note: "How many rows in that section match the current search." },
    { slot: "settings-dialog-panel", note: "The tabpanel for the active section, labelled by its tab." },
    {
      slot: "settings-dialog-section",
      note: "Deep-link target: its `id` is `${anchorPrefix}-${section.id}`.",
    },
    {
      slot: "settings-dialog-section-title",
      note: "The section's heading inside its panel.",
    },
    {
      slot: "settings-dialog-rows",
      note: "The row list for the section.",
    },
    {
      slot: "settings-dialog-empty",
      note: "Shown in place of the rows when a search matches nothing in this section.",
    },
    {
      slot: "settings-dialog-row",
      note: "The row grid: text column, control column. Identical in both variants.",
    },
    { slot: "settings-dialog-row-label", note: "The setting's name; also the control's accessible name." },
    {
      slot: "settings-dialog-row-description",
      note: "What flipping the control actually costs you. Required.",
    },
    { slot: "settings-dialog-row-control", note: "The control column — one control, or one text action." },
    {
      slot: "settings-dialog-destructive-action",
      note: "A destructive action as plain text. Never filled, never tinted.",
    },
  ],
  usage:
    'Reach for it whenever preferences outgrow a single popover and need grouping. Start with `variant="dialog"` — it is the cheaper surface and most products never need more. Move to `variant="full-page"` once a section list gets long enough that people hunt, or once you want to link someone straight to a setting: full-page adds the search field and gives each section a stable anchor id, and you pair it with the controlled `sectionId`/`onSectionChange` so the URL and the active tab stay in step. The control column is a slot: the component hands you `controlId`, `labelId` and `descriptionId`, and you render a Switch, Select or Input wired to them, so the control\'s accessible name is the row label and its description is the row description. Destructive settings are the exception — pass `destructiveAction` data instead of a control and the component renders it, so the treatment cannot drift.',
  dos: [
    {
      text: "Write a description for every row that says what changes — the label names the switch, the description says what flipping it costs.",
      example: <DescribedToggleRow />,
    },
    {
      text: "Let destructive settings render as text in the control column, in the same grid as everything else.",
      example: <DestructiveAsText />,
    },
  ],
  donts: [
    {
      text: "Don't ship a column of bare toggles. A toggle with no description is a setting nobody changes — and nobody can support.",
      example: <BareToggleNoDescription />,
    },
    {
      text: "Don't put a filled destructive button beside benign toggles — it reads as the panel's primary action rather than its last resort.",
      example: <FilledDestructiveButtonBesideToggles />,
    },
  ],
  accessibility: {
    keyboard: [
      'The section nav is one tab stop, not one per section: it is a real `tablist` with a roving tabindex. Because it is `orientation="vertical"`, **Up and Down** move between sections and Left and Right do nothing; Home and End jump to the first and last.',
      "Arrowing highlights a section without opening it. This Base UI version defaults `activateOnFocus` to `false`, so moving down the nav does not swap the panel until you press Enter or Space — a deliberate manual-activation tab set, and worth knowing before you write a test that expects the panel to follow the arrow key.",
      "After the nav, the open panel is its own tab stop (Base UI gives it `tabIndex=0`), then each row's control in order. Row controls are yours, so the stop count past the panel is whatever you rendered — a Switch is one, a Select is one, a destructive row's text action is one.",
      "In the `dialog` variant, Escape closes and Tab is trapped inside the popup. The close button is the last stop, because it renders after the body. `full-page` has no Escape and no trap: it is a page.",
      '`full-page` adds the search field as the first stop of the surface. It is `type="search"`, so browsers that offer a native clear affordance will offer it here.',
    ],
    screenReader: [
      'The nav is a `tablist` named "Settings sections", and each tab is wired to its panel by Base UI — so entering a panel announces the section it belongs to. This is the reason the nav is not `sidebar-nav`: a tab can say what it reveals, and `aria-current="page"` cannot.',
      'Each tab\'s name is set outright rather than left to its contents, because adjacent `span`s fuse with no separator — "Billing" beside a "Pro" badge computes as "BillingPro". The stated name is space-joined ("Billing Pro"), so the visible text stays a prefix of it.',
      'While searching, the match count is appended to that name — "Billing Pro 3 matching". It changes on every keystroke and is not a live region, so a focused tab whose name is churning is not reliably re-announced.',
      "A non-destructive row wires nothing for you. The `label` uses `htmlFor={controlId}`, which resolves only if your control actually carries `id={controlId}`; ignore the ids callback and the label points at nothing and your control has no accessible name at all. Setting `aria-labelledby={labelId}` and `aria-describedby={descriptionId}` is the belt-and-braces the component expects.",
      'A destructive row is the exception and works differently: the row label becomes an inert `span` associated with nothing, and the button\'s whole accessible name is the `label` you passed. "Delete" announces as "Delete" with no idea what of — which is why the type asks for "Delete account". Its description is wired (`aria-describedby` at the row description); its label is not.',
      'The search result count is `role="status"`, but it is mounted only while there is a query — a live region created at the moment it first has something to say is one screen readers routinely miss. `settings-shell` keeps its equivalent always mounted and empty when idle; this one does not.',
      "The tier badge is rendered as the word, never a colour or a dot, and the word is part of the tab's stated name. Restyling it into a dot removes it from the name too.",
      "Section icons and the search glyph are `aria-hidden`; the section title inside each panel is a real `h3`.",
    ],
    focus: [
      "Opening the `dialog` variant moves focus into the popup, landing on the active section tab — the first tabbable thing inside. Escape or the close button returns focus to whatever opened it.",
      "Switching sections does not move focus; it stays on the tab, and the panel is the next stop.",
      'Typing in the search field can unmount the control that a moment ago had focus — filter a section down to zero matches and its rows are replaced by the "nothing matched" line, dropping focus to `<body>`. In practice focus is usually in the search box, but a keyboard user who tabs into the panel and then edits the query will feel it.',
      "The panel is focusable and sets `outline-none` without adding a ring, so that tab stop is invisible when focused. Every other control here — the tabs, the search field, the destructive action — ships a visible `focus-visible` ring.",
    ],
  },
  pitfalls: [
    "Treating the tier badge as decoration and restyling it into a coloured dot. The word is the signal — a colour alone does not survive a screen reader or a colourblind reader, and the tab's accessible name is built from that word.",
    "Forgetting the control column is yours to wire. If you render a Switch without `aria-labelledby={labelId}`, it has no accessible name at all — the row label is a sibling, not an ancestor, so nothing associates them for you.",
    "Expecting `full-page` to own the URL. It exposes stable section anchors and calls `onSectionChange`, but reading and writing the hash is the app's job; without that the deep links are addressable and never addressed.",
    "Reaching for A6 `field-row` for these rows. It is the right primitive for a compact inspector — a fixed narrow label with the control immediately beside it and the hint below — and the wrong one here, where the description sits under the label in a flexible text column and the control is pushed to the far edge. Two different grids that happen to share three ingredients.",
    "Assuming the search filters everything at once. It scores every section, but you still read results one panel at a time — the match counts on the nav are what tell you where the rest of them are.",
  ],
};
