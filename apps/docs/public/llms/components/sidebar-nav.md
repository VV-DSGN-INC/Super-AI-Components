# Sidebar Nav

> A sectioned nav for the primary sidebar: a flat list of icon+label rows grouped under section headers, with a trailing slot per row for a count, a tier badge, an unread dot, a running spinner, or an external-link glyph. A separate pinned group can sit above every section, outside the grouping entirely.

Layer: component · Family: B · Install: `npx shadcn@latest add https://super-ai-components.vercel.app/r/sidebar-nav.json` · Contract: `components/super-ai/sidebar-nav.meta.json` (installed beside the component; version-locked to the code, so it outranks this page) · Docs: https://super-ai-components.vercel.app/components/sidebar-nav

## Why it matters

It's the load-bearing list in every settings and app-shell sidebar on the reference board — Lovable's settings nav, Spline, Descript, and Manus all group their primary navigation this way, with badges doing double duty as status and as the shell's cheapest upgrade prompt. Because the trailing slot is shared across five different signals (count, tier, unread, running, external), one row shape carries the whole sidebar instead of five bespoke row components.

## When to reach for it

Reach for it for the primary, always-visible list in a sidebar — the set of destinations a user returns to constantly, as opposed to a one-off menu or a search result list. Group related destinations under a section, and reserve the pinned group for the handful of rows that should survive any amount of scrolling or reordering below them. Pass `activeId` and handle `onSelect` yourself — the component is controlled, the same as the switcher and the thread list.

## Variants

Not yet recorded.

## Instead use

Not yet recorded.

## Do

- Mark the active row with a filled background. A background survives when the rail collapses to icons; a border does not.
- Let a tier badge sit on the row and leave the row exactly as usable as any other — it's a signal, not a lock.
- Render section labels through section-header at its smallest size, so the sidebar never grows a second caption style of its own.

## Don't

- Don't mark active state with a left border. It's the first thing that disappears when the rail collapses to icon-only width, leaving no active indicator at all.
- Don't hide a tier-gated row behind opacity or remove it from the list to "protect" a paywall — the trailing tier badge is the gate; the row itself stays legible.

## Anatomy

- `sidebar-nav`: Root nav wrapper around the pinned group and every section.
- `sidebar-nav-pinned`: Rows pinned above the sections, outside the grouping entirely.
- `sidebar-nav-section`: One labeled group of rows.
- `section-header`: The section label, rendered at its smallest size — never a bespoke caption.
- `sidebar-nav-item`: One row. `data-active` reflects selection; filled background, never a border.
- `sidebar-nav-count`: Trailing numeric badge, e.g. an unseen-item count.
- `sidebar-nav-tier`: Trailing tier badge (e.g. "Pro"). The row stays visible either way.
- `sidebar-nav-unread`: Trailing unread dot. Colour only in practice — its `aria-label` sits on a bare span and is not reliably announced.
- `sidebar-nav-running`: Trailing spinner for a row tied to a background job.

## Accessibility

**Keyboard**

- Every row is its own tab stop. There is no roving tabindex and no arrow-key travel, so a sidebar with a pinned group and three sections of six is nineteen Tab presses before a keyboard user reaches the main content — and this component ships no skip link. If your shell is long, that is a skip link you owe the page.
- The activation keys differ by row type, because the element does. A row without `href` is a `<button>` and takes both Space and Enter; a row with `href` is an `<a>` and takes Enter only — Space scrolls the page. Two rows that look identical behave differently, and the only thing that decides it is whether you passed `href`.
- Section headers are not interactive here: `SidebarNav` renders `SectionHeader` without `collapsible`, so there is nothing to collapse and no stop for it. Sections cannot be shut from the keyboard or at all.
- Nothing responds to Escape, Home, End or Delete. A row with `external` opens a new tab on Enter (`target="_blank"`), which moves the user out of the app with no confirmation.

**Screen reader**

- The root is a `navigation` landmark named "Sidebar", overridable by passing `aria-label` — worth doing, because two of these on one page produce two landmarks a screen-reader user cannot tell apart.
- It is not a list. Rows are direct children of a `div`, so nothing announces "list, six items" and there is no position-in-set information. A user cannot tell how far down a section they are.
- Sections are not groups either. `SectionHeader` renders a plain `div` with no heading semantics, so the group label is read as loose text in reading order, is skipped entirely by heading navigation, and is not programmatically tied to the rows underneath it. Nothing associates "Workspace" with the four rows that belong to it.
- A row's accessible name is built from its contents: label, then the count badge, then the tier badge. "Inbox" with `count={3}` announces as "Inbox 3"; add `tier="Pro"` and it is "Inbox 3 Pro". The leading icon is wrapped `aria-hidden`, so it never contributes.
- **The unread dot and the running spinner may announce nothing.** The dot is a bare `<span aria-label="Unread" />`, and a `span` with no role maps to `generic` — an element ARIA prohibits naming, so the label is not guaranteed to be exposed. The spinner is a lucide `<svg aria-label="Running">` with no `role="img"`, which is the same shape one step less certain. Both signals are otherwise colour and motion alone. No test in this repo asserts either label is announced; if these states matter, put the word in the row's `label` or supply your own `count`/`tier` text.
- The external-link glyph is `aria-hidden` and nothing else says the row leaves the app, so a link that opens a new tab announces exactly like one that does not.
- `aria-current="page"` marks the active row on both branches — including the `<button>` branch, where "page" is a claim a button cannot really honour, since activating it navigates nothing on its own.
- There is no live region. A row gaining a count, flipping to `running`, or dropping its unread dot is announced as nothing at all; those states are only discovered by tabbing back over the row.

**Focus**

- Selecting a row never moves focus — `onSelect` fires and focus stays in the rail. The shell has to move it to whatever the row revealed, or a keyboard user picks a destination and is still standing in the nav.
- Nothing here unmounts a focused row in normal use, so focus is not dropped. Re-ordering `sections` between renders will move a focused row, but the row keeps focus because React keys it by `id`.
- Rows ship `focus-visible:ring-2` with no ring offset, so on the filled active row the ring sits flush against the fill.

## Pitfalls

- Treating the tier badge as a hide mechanism instead of a disclosure one. Sidebar tier badges are the cheapest paywall in the shell precisely because they show what exists rather than concealing it — hiding the row entirely removes the upsell along with the feature.
- Relying on the unread dot or the running spinner to carry state on their own. Both are colour and motion only, and the `aria-label`s the component puts on them sit on a bare `span` and a bare `svg` — elements with no role, which ARIA does not allow to be named — so those labels are not reliably announced. Treat both as decoration and put the state in the row's `label` or a `count` if it has to be perceivable.
- Forgetting the nav is controlled: selecting a row calls `onSelect` with the row's `id`, but `activeId` doesn't update itself. The consuming app owns the active id and must feed it back in.

## Composition

- States: `count-badge`, `tier-badge`, `unread-dot`, `running`, `pinned-group`
- Composes from this registry: section-header
- shadcn primitives: badge
- npm: lucide-react

## Evidence

Lovable, Spline, Descript, Manus
