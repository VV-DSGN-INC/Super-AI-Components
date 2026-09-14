# Context Toolbar

> The small floating bar that appears beside whatever is currently selected on a canvas, offering the handful of actions that apply to it. It leads with an AI entry, carries at most eight buttons, and folds everything past that into an overflow menu. It is a toolbar in the ARIA sense — one tab stop, arrow keys to travel along it — not a row of loose buttons.

Layer: component · Family: I · Install: `npx shadcn@latest add https://super-ai-components.vercel.app/r/context-toolbar.json` · Contract: `components/super-ai/context-toolbar.meta.json` (installed beside the component; version-locked to the code, so it outranks this page) · Docs: https://super-ai-components.vercel.app/components/context-toolbar

## Why it matters

Selection surfaces are a family: Canva, Fotor, Spline and Notion all put the same bar in the same place, and people arrive already knowing how it behaves. The cap is what keeps it a bar rather than a second inspector — past eight actions it stops being the fast path and starts competing with the panel it was meant to shortcut. Leading with AI is what makes the selection itself the prompt context: the object you picked is the input, so the AI entry belongs where the eye lands first, not tucked behind an overflow menu.

## When to reach for it

Reach for it when a canvas has a selection and there is a small set of verbs that only make sense while that selection exists — formatting a text run, cropping an image, filling a shape, trimming a clip. Set `selection` to the kind of thing selected: it names the toolbar for assistive technology and lands on `data-selection` for styling. Pass every action you have and let the component decide which ones fit. If the surface needs more than eight verbs, that is the signal to reach for I2 `property-inspector` instead — this bar is the shortcut, not the surface.

## Variants

Not yet recorded.

## Instead use

Not yet recorded.

## Do

- Let the AI entry lead. It is a slot on the component, so it sits first whatever order your actions arrive in.
- Hand over the whole action list and let the cap collapse the tail into the overflow menu.
- Set `placement` from wherever your host drew the bar, so menus and tooltips open away from the selection.

## Don't

- Don't hand-roll a flat row of every action you have — nine equal icon buttons with no names is the shape this component exists to prevent.
- Don't put the AI entry last, or demote it to just another action in the list. First is the one position people learn.

## Anatomy

- `context-toolbar`: The floating frame. Carries data-selection, data-placement and data-overflow-count.
- `context-toolbar-ai`: The AI entry. Always index 0, never collapsed into overflow.
- `context-toolbar-ai-menu`: Popover the AI entry opens — where I4 ai-tools-menu is rendered.
- `context-toolbar-action`: One selection action. Icon-only by default, with its label in an sr-only span.
- `context-toolbar-overflow`: Trigger for everything past the cap. An affordance, not an action.
- `context-toolbar-overflow-menu`: The collapsed actions, in the order they were supplied.

## Accessibility

**Keyboard**

- The whole bar is one tab stop. `Toolbar.Root` is a Base UI composite, so it manages a roving tabindex over its buttons: Tab enters at whichever button was last focused, and Tab again leaves the bar entirely.
- Left and Right travel along the bar and wrap at both ends. The orientation is horizontal, so Up and Down do nothing — and Home and End are not enabled, so there is no jump to the first or last action.
- A disabled action stays in the travel order. It reports `aria-disabled="true"` rather than the native attribute, deliberately: a keyboard user arrowing along the bar still meets it and learns the action exists, and `onAction` does not fire.
- The AI entry with an `aiMenu` is a popover trigger — Space or Enter opens it, Escape closes it and returns focus to the entry. The overflow trigger opens a menu with its own Up/Down travel and its own Escape.
- Anything you pass as `children` renders inside the bar but is **not** a composite item, so a bare `<button>` there keeps its own `tabIndex` of 0 and becomes a second tab stop — quietly breaking the one-tab-stop contract the rest of the bar keeps. Pass actions through `actions` instead.

**Screen reader**

- The bar announces as a toolbar named for what is selected — "Image selection actions" and so on — so several bars on one canvas are told apart. `label` overrides that name; nothing removes it.
- Every action's name is in the DOM either way: `showLabel` decides whether the label is drawn or carried in an `sr-only` span, and the tooltip only ever repeats it. A tooltip is never the source of a name here, which is why an action with an icon and no `label` is invisible to a screen reader rather than merely unlabelled.
- Caller-supplied icons are wrapped in an `aria-hidden` span by the component rather than trusted to hide themselves, so a lucide icon carrying a title cannot double the button's name.
- The overflow trigger is named by an `sr-only` "More actions" (or your `overflowLabel`); the collapsed actions become menu items keeping their labels and order.
- Nothing announces that the selection changed. `selection` swaps the toolbar's accessible name silently, and `placement` lands on a data attribute only — so a screen-reader user who selects a different object hears nothing until they navigate back to the bar.
- The AI entry's popover is not described to assistive tech by this component: `aiMenu` is whatever you pass, so its name, its roles and its focus behaviour are I4's contract rather than the toolbar's.

**Focus**

- The component never moves focus to itself when it appears. The host draws it beside a selection, and a keyboard user has to Tab to it from wherever they are — so put it early in the DOM near the selection, not at the end of the canvas.
- When the selection is cleared and the host unmounts the bar, a focused action goes with it and focus falls to `<body>`. Return focus to the canvas yourself when you tear the toolbar down.
- Every button is the vendored `Button`, so all of them carry its `focus-visible` ring. The composite means only one of them is tabbable at a time — the ring appears where the roving index currently sits.

## Pitfalls

- Expecting the component to keep itself in the viewport. It measures nothing — a registry component owns no canvas and cannot know where your selection rectangle is. You position it and you decide the flip; `placement` records that decision, lands on `data-placement`, and makes the popover and tooltips open away from the selection. Never covering the selection is likewise the host's guarantee: leave room for the bar's height plus your offset before committing to a side.
- Assuming `maxActions` can widen the bar. It is clamped to eight, so passing twelve still draws eight buttons and collapses the rest. It can only make the bar tighter.
- Forgetting the AI entry counts toward the cap. With the default of eight you get the AI entry plus seven actions; the overflow trigger sits outside the count because it is an affordance rather than an action.
- Passing an icon with no meaningful `label`. Every action's label is its accessible name, rendered in an sr-only span and merely repeated by the tooltip — a tooltip alone is never a name, and an icon-only button without one is invisible to a screen reader.
- Reaching for an import of I4 `ai-tools-menu`. It is rendered through the `aiMenu` slot instead, so the dependency runs one way and the toolbar stays usable in hosts that have no AI menu to give it.

## Composition

- States: `text`, `image`, `shape`, `media`, `overflow`
- Composes from this registry: nothing
- shadcn primitives: button, dropdown-menu, popover, separator, tooltip
- npm: lucide-react

## Evidence

Canva, Fotor, Spline, Notion
