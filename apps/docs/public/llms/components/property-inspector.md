# Property Inspector

> The panel beside a canvas that edits whatever is selected — width, type size, blur, opacity — grouped into collapsible sections. Every row is a `field-row` (A6) and every reset is a `reset-affordance` (A11), so an inspector lines up on the same label / control / unit / reset grid as the generation panels elsewhere in the system. What it shows is driven by the selected element's type, and it has a real view for the case where nothing is selected at all.

Layer: component · Family: I · Install: `npx shadcn@latest add https://super-ai-components.vercel.app/r/property-inspector.json` · Contract: `components/super-ai/property-inspector.meta.json` (installed beside the component; version-locked to the code, so it outranks this page) · Docs: https://super-ai-components.vercel.app/components/property-inspector

## Why it matters

CapCut, Canva, Spline and Tripo all ship this panel and converge on the same three decisions, which is why it is one component rather than one per editor. Content is selection-driven: there is a variant per element type, not a different panel per tool. There are two reset scopes, not one — a group reset on each section header and a row reset at the end of each row — because clearing a whole section is a different intent from putting one value back. And sections remember their collapsed state per element type, so a user who never wants to see Layout for text is not forced to re-collapse it every time they select an image.

## When to reach for it

Reach for it for any canvas, timeline or scene editor where selecting an object changes what can be edited. Key `sections` by element type and pass the selected type in — the variant is a data lookup, so a new element type is a new key rather than a new branch. Give every section an `onReset` when its rows can drift, and give every row one: the two scopes serve different intents and one does not stand in for the other. Give the empty state an `emptyContent` of canvas- or document-level rows; an inspector with nothing selected is the panel a user looks at most, not a gap to apologise for.

## Variants

Not yet recorded.

## Instead use

Not yet recorded.

## Do

- Ship both reset scopes — a group reset on the section header and a row reset at the end of every row.
- Keep something editable when nothing is selected — canvas size, grid, background — so the default view of the panel still does work.

## Don't

- Don't hand-roll the rows and leave the group reset as the only way back; putting one value right should not cost the rest of the section.
- Don't let the empty state be a shrug — a line that says there is nothing to show teaches the user nothing and wastes the panel.

## Anatomy

- `property-inspector`: Root region, labelled by its own title. Carries `data-element-type` for whatever is selected.
- `property-inspector-header`: The panel title plus the live selection summary.
- `property-inspector-selection`: What is selected, as a `role="status"` line — it is the only thing that names which variant you are looking at, so it announces rather than swapping silently.
- `property-inspector-sections`: The stack of sections for the current element type.
- `property-inspector-section`: One collapsible group, carrying `data-section-id` and `data-state` open/closed.
- `section-header`: A5, composed. Its trigger collapses the group; its action slot holds the group-scope reset.
- `property-inspector-section-rows`: The section's rows, unmounted while the group is collapsed.
- `field-row`: A6, composed — one per property. Keeps its own slot so the shared grid is visible in the DOM.
- `field-row-reset`: A6's trailing slot, permanently occupied by the row-scope `reset-affordance`.
- `reset-affordance`: A11, at `scope="group"` in a section header and `scope="row"` in every row. Degrades to `reset-affordance-dot` on a collapsed group.
- `property-inspector-empty`: Shown when nothing is selected: one line of guidance plus whatever stays editable.
- `property-inspector-empty-content`: Document- or canvas-level rows that survive an empty selection.

## Accessibility

**Keyboard**

- Each section is at least one tab stop: the `section-header` trigger, a native button carrying `aria-expanded`. A section with a group reset adds a second — but only while that reset is enabled, since `reset-affordance` renders `disabled` at `state="default"` and leaves the tab order there.
- Every `PropertyRow` reserves a row reset the same way: mounted at all times so the row never reflows, `disabled` until the value drifts. The panel's tab-stop count therefore grows as the user edits, which is the opposite of what a panel this static-looking suggests.
- The controls themselves are yours. `PropertyRow` hands your render function a `controlId` and a `describedBy` and enforces nothing — how many stops a row really has, and whether Enter commits a value, is decided by what you put in it.
- No arrow keys at panel level. Sections are independent buttons rather than an accordion with roving focus, so moving between them is Tab only; collapsing is Space or Enter on the trigger, and there is no Escape, no expand-all and no collapse-all.
- Collapsing a section unmounts its rows outright rather than hiding them, so every control inside leaves the tab order entirely — which is the behaviour you want, and also means a keyboard user cannot reach a value they can still see the reset dot for.

**Screen reader**

- The panel is deliberately not a landmark: no `role="region"`, because two inspectors on one page would collide on axe's `landmark-unique`. It is found by its `<h3>` title and by reading order, not by landmark navigation.
- The selection summary is `role="status"`, a polite live region, so changing what is selected announces the new selection label without stealing focus. It is the only announcement the component makes — the entire section stack being replaced underneath it is silent.
- The section trigger reports `aria-expanded` but there is no `aria-controls` tying it to the rows it opens, so the relationship is positional only.
- A collapsed section that has changes in it degrades the group reset to a dot, which is `aria-hidden`, and the component adds an `sr-only` "<section> modified" beside it. The fact survives as text; the control does not, so there is no way to reset a collapsed group without expanding it first.
- Every reset is named. Group scope reads "Reset Layout"; row scope defaults to "Reset <label>", which is exactly why `PropertyRow` builds that default — six rows all announcing as "Reset" is unusable. Both glyphs (↺ and the keyframed ◇) are `aria-hidden`, so `keyframed` announces identically to `modified`: the two states differ only in a character nobody hears.
- `field-row`'s `<label for>` reaches your control only if your render function applies the `controlId` it is given. Ignore it and the visible label is orphaned and the control is unnamed — the same trap `parameter-panel` documents at source. `hint` behaves the same way: it renders and gets an id, and is wired up only when you spread `describedBy` onto the control.
- The empty state's guidance is a plain paragraph. What names the state is the `role="status"` line reading `emptyTitle`; the body says what to do instead of repeating it, so an assistive-tech user gets the name once and the instruction once.

**Focus**

- Changing `elementType` replaces the whole section stack. If focus was on a section trigger, a group reset, or any control inside a row, that element unmounts and focus falls to `<body>` — so selecting a different object on the canvas silently sends the next Tab back to the top of the page. Restore focus in your selection handler if the panel is meant to be keyboard-driven.
- A reset that returns its row to `state="default"` becomes `disabled` in the same render, and a button disabled while focused is blurred by the browser: pressing a row reset drops focus to `<body>`. The group reset behaves the same way.
- Collapsing is safe by construction — focus is on the trigger, which survives — but a mouse click on a trigger while focus sits inside one of that section's rows loses it.
- The section trigger and both reset scopes draw their own `focus-visible:ring-2`. Anything you render inside a row brings its own, so a row built from bare elements is as visible on focus as you made it.

## Pitfalls

- Storing collapsed state per section instead of per element type. Collapsing Layout for a text object then silently collapses it for an image, and the user re-expands the same section all day. The inspector keys its memory `elementType -> sectionId`; a host that persists the state through `onSectionOpenChange` must key it the same way.
- Branching on element type at the call site instead of adding a key to `sections`. The moment one editor forks, the variants drift — different section order, different labels, different reset behaviour — and the panel stops being one component.
- Passing `data-slot` down to a composed `field-row`, `section-header` or `reset-affordance`. Each of those spreads `...props` after its own attributes, so a call-site `data-slot` silently erases theirs and every test and style keyed to the shared grid stops matching.
- Expecting to reset a collapsed group. A11 degrades a collapsed group's reset to a dot, so the change still signals but the control is gone until the section is expanded — deliberate, and the reason the dot is paired with screen-reader text rather than left to colour alone.
- Deriving a section's `state` from nothing. A group reset that is always enabled tells the user nothing about whether the section has drifted; compute it from the same defaults the row resets use.

## Composition

- States: `per-element-type`, `grouped-sections`, `reset`, `empty`
- Composes from this registry: field-row, reset-affordance, section-header
- shadcn primitives: none
- npm: none

## Evidence

CapCut, Canva, Spline, Tripo
