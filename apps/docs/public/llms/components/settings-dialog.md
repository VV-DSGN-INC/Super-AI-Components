# Settings Dialog

> A settings surface built from a section nav on the left and a panel of setting rows on the right. Every row is a label, a description and one control; the nav is a real tablist, so the section you pick is programmatically tied to the panel it reveals. It ships in two variants — a modal for quick preferences and a full page that adds settings search and deep-linkable sections — and both render the identical row grid.

Layer: component · Family: M · Install: `npx shadcn@latest add https://super-ai-components.vercel.app/r/settings-dialog.json` · Contract: `components/super-ai/settings-dialog.meta.json` (installed beside the component; version-locked to the code, so it outranks this page) · Docs: https://super-ai-components.vercel.app/components/settings-dialog

## Why it matters

Settings is where a product admits what it can be told to do, and it is usually the least designed screen in the app. The reference board splits cleanly: the Playground settings dialog is the modal case, Lovable's full-page settings the addressable one, and Spline and Descript sit between them with sectioned navs deep enough to need searching. Holding both to one row grid is what stops a product growing two visually different settings screens as its surface area grows — and pinning the description as a required field is what stops the grid degrading into a column of unexplained switches.

## When to reach for it

Reach for it whenever preferences outgrow a single popover and need grouping. Start with `variant="dialog"` — it is the cheaper surface and most products never need more. Move to `variant="full-page"` once a section list gets long enough that people hunt, or once you want to link someone straight to a setting: full-page adds the search field and gives each section a stable anchor id, and you pair it with the controlled `sectionId`/`onSectionChange` so the URL and the active tab stay in step. The control column is a slot: the component hands you `controlId`, `labelId` and `descriptionId`, and you render a Switch, Select or Input wired to them, so the control's accessible name is the row label and its description is the row description. Destructive settings are the exception — pass `destructiveAction` data instead of a control and the component renders it, so the treatment cannot drift.

## Variants

### variant (default: `dialog`)

- `dialog`: Choose dialog when settings are a brief detour from whatever the user was doing — they came in to flip a preference and expect to land back where they were, so nothing here needs a URL or a bookmark.
- `full-page`: Choose full-page when settings are a destination in their own right — a section list long enough that people search it, or somewhere support has to be able to link a user straight into.

## Instead use

- **settings-shell**: You need the whole settings destination, not just the row grid — a grouped nav, a breadcrumb, an account menu and a plan story. settings-dialog's full-page variant is the rows and search; settings-shell is what composes those into that page.

## Do

- Write a description for every row that says what changes — the label names the switch, the description says what flipping it costs.
- Let destructive settings render as text in the control column, in the same grid as everything else.

## Don't

- Don't ship a column of bare toggles. A toggle with no description is a setting nobody changes — and nobody can support.
- Don't put a filled destructive button beside benign toggles — it reads as the panel's primary action rather than its last resort.

## Anatomy

- `settings-dialog`: Root. The dialog popup, or the full-page container — `data-variant` says which.
- `settings-dialog-header`: Title and optional description; the dialog variant's is the Dialog header.
- `settings-dialog-search`: Settings search. Full-page only — it holds the query input and the result count.
- `settings-dialog-search-status`: Live count of matching settings, announced as a status.
- `settings-dialog-body`: The tablist-and-panel layout that both variants share.
- `settings-dialog-nav`: The section nav — a vertical tablist, not page navigation.
- `settings-dialog-nav-item`: One section tab; carries the tier badge and, while searching, its match count.
- `settings-dialog-tier`: Plan tier for the section, rendered as the word.
- `settings-dialog-nav-matches`: How many rows in that section match the current search.
- `settings-dialog-panel`: The tabpanel for the active section, labelled by its tab.
- `settings-dialog-section`: Deep-link target: its `id` is `${anchorPrefix}-${section.id}`.
- `settings-dialog-section-title`: The section's heading inside its panel.
- `settings-dialog-rows`: The row list for the section.
- `settings-dialog-empty`: Shown in place of the rows when a search matches nothing in this section.
- `settings-dialog-row`: The row grid: text column, control column. Identical in both variants.
- `settings-dialog-row-text`: The name-and-description column; the setting's name inside doubles as the control's accessible name.
- `settings-dialog-row-description`: What flipping the control actually costs you. Required.
- `settings-dialog-row-control`: The control column — one control, or one text action.
- `settings-dialog-destructive-action`: A destructive action as plain text. Never filled, never tinted.

## Accessibility

**Keyboard**

- The section nav is one tab stop, not one per section: it is a real `tablist` with a roving tabindex. Because it is `orientation="vertical"`, **Up and Down** move between sections and Left and Right do nothing; Home and End jump to the first and last.
- Arrowing highlights a section without opening it. This Base UI version defaults `activateOnFocus` to `false`, so moving down the nav does not swap the panel until you press Enter or Space — a deliberate manual-activation tab set, and worth knowing before you write a test that expects the panel to follow the arrow key.
- After the nav, the open panel is its own tab stop (Base UI gives it `tabIndex=0`), then each row's control in order. Row controls are yours, so the stop count past the panel is whatever you rendered — a Switch is one, a Select is one, a destructive row's text action is one.
- In the `dialog` variant, Escape closes and Tab is trapped inside the popup. The close button is the last stop, because it renders after the body. `full-page` has no Escape and no trap: it is a page.
- `full-page` adds the search field as the first stop of the surface. It is `type="search"`, so browsers that offer a native clear affordance will offer it here.

**Screen reader**

- The nav is a `tablist` named "Settings sections", and each tab is wired to its panel by Base UI — so entering a panel announces the section it belongs to. This is the reason the nav is not `sidebar-nav`: a tab can say what it reveals, and `aria-current="page"` cannot.
- Each tab's name is set outright rather than left to its contents, because adjacent `span`s fuse with no separator — "Billing" beside a "Pro" badge computes as "BillingPro". The stated name is space-joined ("Billing Pro"), so the visible text stays a prefix of it.
- While searching, the match count is appended to that name — "Billing Pro 3 matching". It changes on every keystroke and is not a live region, so a focused tab whose name is churning is not reliably re-announced.
- A non-destructive row wires nothing for you. The `label` uses `htmlFor={controlId}`, which resolves only if your control actually carries `id={controlId}`; ignore the ids callback and the label points at nothing and your control has no accessible name at all. Setting `aria-labelledby={labelId}` and `aria-describedby={descriptionId}` is the belt-and-braces the component expects.
- A destructive row is the exception and works differently: the row label becomes an inert `span` associated with nothing, and the button's whole accessible name is the `label` you passed. "Delete" announces as "Delete" with no idea what of — which is why the type asks for "Delete account". Its description is wired (`aria-describedby` at the row description); its label is not.
- The search result count is `role="status"`, but it is mounted only while there is a query — a live region created at the moment it first has something to say is one screen readers routinely miss. `settings-shell` keeps its equivalent always mounted and empty when idle; this one does not.
- The tier badge is rendered as the word, never a colour or a dot, and the word is part of the tab's stated name. Restyling it into a dot removes it from the name too.
- Section icons and the search glyph are `aria-hidden`; the section title inside each panel is a real `h3`.

**Focus**

- Opening the `dialog` variant moves focus into the popup, landing on the active section tab — the first tabbable thing inside. Escape or the close button returns focus to whatever opened it.
- Switching sections does not move focus; it stays on the tab, and the panel is the next stop.
- Typing in the search field can unmount the control that a moment ago had focus — filter a section down to zero matches and its rows are replaced by the "nothing matched" line, dropping focus to `<body>`. In practice focus is usually in the search box, but a keyboard user who tabs into the panel and then edits the query will feel it.
- The panel itself is a tab stop after the tabs, which is what lets a keyboard user scroll a long section. It takes the same `focus-visible` ring as the tabs, the search field and the destructive action: nothing at rest, a 2px ring once focused.

## Pitfalls

- Treating the tier badge as decoration and restyling it into a coloured dot. The word is the signal — a colour alone does not survive a screen reader or a colourblind reader, and the tab's accessible name is built from that word.
- Forgetting the control column is yours to wire. If you render a Switch without `aria-labelledby={labelId}`, it has no accessible name at all — the row label is a sibling, not an ancestor, so nothing associates them for you.
- Expecting `full-page` to own the URL. It exposes stable section anchors and calls `onSectionChange`, but reading and writing the hash is the app's job; without that the deep links are addressable and never addressed.
- Reaching for A6 `field-row` for these rows. It is the right primitive for a compact inspector — a fixed narrow label with the control immediately beside it and the hint below — and the wrong one here, where the description sits under the label in a flexible text column and the control is pushed to the far edge. Two different grids that happen to share three ingredients.
- Assuming the search filters everything at once. It scores every section, but you still read results one panel at a time — the match counts on the nav are what tell you where the rest of them are.

## Composition

- States: `dialog`, `full-page`, `toggle-rows`, `destructive-rows`, `tier-badged-nav`
- Composes from this registry: nothing
- shadcn primitives: badge, dialog, input
- npm: lucide-react

## Evidence

Playground, Lovable, Spline, Descript
