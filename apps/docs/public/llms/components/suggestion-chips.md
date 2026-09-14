# Suggestion Chips

> A horizontal row of tap-to-fill prompt chips — the empty-state or below-composer starters that turn a blank input into a menu of things to try. It composes AI Elements' Suggestions/Suggestion directly rather than shipping its own button, and adds only what that primitive is missing: an optional leading icon or thumbnail per chip, and a real link for whatever doesn't fit the row.

Layer: component · Family: C · Install: `npx shadcn@latest add https://super-ai-components.vercel.app/r/suggestion-chips.json` · Contract: `components/super-ai/suggestion-chips.meta.json` (installed beside the component; version-locked to the code, so it outranks this page) · Docs: https://super-ai-components.vercel.app/components/suggestion-chips

## Why it matters

It's the fastest way a product teaches what it can do without a tour or an empty state full of prose — Descript, CapCut, Manus, Claude and Zapier all open a fresh session with a row of these instead of a blank box. Because it composes the AI Elements primitive instead of forking it, this is the cleanest example in the catalog of what the L1 boundary is for: the chip's click behaviour, its cursor, its type="button" safety rail all live upstream, shared with every other AI Elements consumer, while this repo only adds the product-specific decoration on top.

## When to reach for it

Reach for it above or below a composer when there's a short list of things worth suggesting up front — an empty-thread prompt menu, or task starters after a mode switch. Compose it from `SuggestionChip`s you place directly, the same way `ContextChips`/`ContextChip` work: `SuggestionChips` only supplies the scroll row, each `SuggestionChip` carries its own `suggestion` text and `onSelect`. When you have more suggestions than comfortably fit, stop the list short and append a `SuggestionChipsOverflow` pointing at wherever the rest live, instead of letting the row keep going.

## Variants

Not yet recorded.

## Instead use

Not yet recorded.

## Do

- Wire onSelect to fill the composer's draft text, and nothing else — the chip that ships is a shortcut to typing, not a shortcut to sending.
- Cap the row yourself and end it with SuggestionChipsOverflow once suggestions stop fitting comfortably.

## Don't

- Don't pack more SuggestionChips into a row than fit and skip the overflow link — the row's scrollbar is hidden by design, so the overflow is invisible, not just inconvenient.
- Don't call onSelect a submit handler in disguise — sending the message immediately removes the one thing a suggestion chip offers over a preset button: a chance to edit first.

## Anatomy

- `suggestion-chips`: Root wrapper around the AI Elements Suggestions scroll row.
- `suggestion-chip-icon`: Decorative leading icon on a chip — present only when SuggestionChip gets an `icon`.
- `suggestion-chip-thumbnail`: Decorative leading thumbnail — present only when SuggestionChip gets a `thumbnail`; wins over `icon`.
- `suggestion-chips-overflow`: The overflow link, when the row can't show every suggestion — a real <a>, not another chip.

## Accessibility

**Keyboard**

- Every chip is one tab stop, and the overflow link is one more. There is no roving tabindex and no arrow-key movement between chips — Left and Right do nothing, because the row is a flex line of independent buttons rather than a toolbar or a listbox.
- A row that overflows quietly adds a tab stop of its own. The scroll viewport underneath takes `tabIndex={0}` as soon as it can scroll (Base UI's answer to axe `scrollable-region-focusable`), so a capped row and an overflowing row do not have the same stop count.
- Chips are real buttons — Space and Enter both fire `onSelect`. The overflow is a real `<a href>`, so it takes Enter only; Space scrolls the page instead. That difference is the point: one fills the composer, the other navigates away.
- `disabled` passes straight through to the underlying button and removes that chip from the tab order entirely. There is no disabled state on the overflow link, which is an `<a>` and cannot have one.

**Screen reader**

- A chip's accessible name is its `suggestion` text and nothing else — the leading icon or thumbnail is wrapped in an `aria-hidden` span on purpose. An icon-only chip with empty `suggestion` text therefore ships an unlabeled button, which is the one way to break this component.
- The row has no group semantics: it is a `<div>` with no role, no label and no list markup, so nothing announces how many suggestions there are or that these buttons belong together. If the set needs naming, wrap it yourself.
- The overflow announces as a link, not as another chip, which is exactly the distinction a user needs — the chips write into the composer, the link leaves the surface. Its name is your `children`, falling back to "N more" from `count` and then to "See more".
- The scroll viewport is `role="presentation"` and focusable, so when the row overflows there is a tab stop with no role and no name between the surrounding content and the first chip.
- Nothing announces the result of picking a chip. The composer's text changes and the component has no live region, so put the announcement on the composer — otherwise the only feedback is silence.
- The row's scrollbar is rendered `hidden`, so there is no visual or programmatic indication that more suggestions exist beyond the edge. That is precisely why overflow has to resolve to the link rather than to more scrolling.

**Focus**

- The component never moves focus. Whether focus survives a selection depends entirely on your handler: replacing or unmounting the row once a suggestion is taken — the common pattern for an empty-state chip row — drops focus to `<body>` and the next Tab restarts at the top of the page. Move focus to the composer instead, which is where the user was heading anyway.
- Both the chips and the overflow link ship the design system's `focus-visible:ring-3`, the link because its classes are derived from `buttonVariants` rather than hand-written. Nothing here inherits your global focus style.

## Pitfalls

- The chip itself carries no data-slot of its own — it's AI Elements' vendored Button, unmodified. Passing a data-slot down through SuggestionChip would silently overwrite Button's own data-slot="button" (it spreads ...props after that attribute), so this component deliberately doesn't forward one. Address a specific chip by its accessible name/role in tests, not a selector.
- SuggestionChips doesn't compute overflow for you — there's no maxVisible prop and no ResizeObserver watching the row's width. You decide how many SuggestionChips to render and append SuggestionChipsOverflow yourself, the same manual-count pattern as ContextChipOverflow.
- The leading icon/thumbnail is always aria-hidden — the chip's accessible name comes from `suggestion` alone. An icon-only chip with placeholder or empty suggestion text ships an unlabeled button.

## Composition

- States: `plain`, `with-icon`, `with-thumbnail`, `overflow-link`
- Composes from this registry: nothing
- shadcn primitives: button, scroll-area
- npm: none

## Evidence

Descript, CapCut, Manus, Claude, Zapier
