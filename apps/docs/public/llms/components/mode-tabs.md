# Mode Tabs

> A small set of mutually exclusive modes — two to five — that change how the same prompt or workspace gets interpreted. Rendered as a segmented toggle group the user switches directly, in three presentations: text-only, icon-plus-label, or icon-only with a tooltip.

Layer: component · Family: D · Install: `npx shadcn@latest add https://super-ai-components.vercel.app/r/mode-tabs.json` · Contract: `components/super-ai/mode-tabs.meta.json` (installed beside the component; version-locked to the code, so it outranks this page) · Docs: https://super-ai-components.vercel.app/components/mode-tabs

## Why it matters

Every reference product that supports more than one way of working exposes the switch as a persistent row of tabs, not a buried menu setting — CapCut's Standard/Director, Claude's Chat/Cowork, Manus's Design/Build, Spellbook's Ask/Draft/Review. Mode changes the interpretation of the prompt, not the model that answers it; keeping this separate from a model picker (E2) keeps both decisions legible instead of collapsing them into one dropdown.

## When to reach for it

Reach for it whenever a surface offers two to five mutually exclusive interpretations of the same input — never as a stand-in for a model picker, and never past five options, where a select reads better than a crowded tab row. Use the default text-only variant when space allows; move to `with-icon` once the modes have obvious glyphs; reserve `with-tooltip` for tight spaces like an embedded composer toolbar, where every trigger still carries a real (sr-only) label so the tooltip is a hint, not the only name.

## Variants

Not yet recorded.

## Instead use

Not yet recorded.

## Do

- Keep the range at two to five modes — a segmented control past that point stops reading as a set of choices.
- Give every trigger a real accessible name even when it's icon-only, and let the tooltip repeat it rather than originate it.

## Don't

- Don't let a tooltip be the only place an icon-only tab's name lives — nothing is announced to assistive tech until the tooltip itself fires, and keyboard focus alone often never triggers it.
- Don't grow past five tabs — a sixth mode is the signal to switch to a select, not to squeeze in another trigger or start scrolling.

## Anatomy

- `mode-tabs`: Root wrapper; carries the active variant and any passthrough className.
- `mode-tabs-list`: The toggle group that owns single-selection semantics for the modes.
- `mode-tabs-item`: One mode's trigger — text-only, icon plus visible label, or icon-only with a tooltip, depending on variant.

## Accessibility

**Keyboard**

- One tab stop for the whole row, not one per mode. The underlying toggle group is a composite with a roving tabindex: Tab reaches the highlighted trigger, Left and Right move the highlight between modes and wrap at both ends, and the next Tab leaves the group entirely.
- Arrows move the highlight only — Enter and Space are what commit the mode, so someone can walk the row without changing the working context underneath it.
- Pressing the already-active mode reports an empty selection, which the component discards. The row can never land on "no mode", by keyboard or by mouse.
- `disabled` reaches every trigger and renders each as a real `disabled` button, so a disabled `ModeTabs` has no tab stop at all — the current mode stops being reachable rather than merely unclickable. Keep something else on the surface saying which mode is in force while you gate it.
- There is no Home/End jump and no number-key shortcut. The arrows are the only navigation the row has.

**Screen reader**

- `mode-tabs-list` is `role="group"` named by `label` (default "Mode"), and each trigger is a toggle button carrying `aria-pressed`. It does not announce as a tab list and not as a radio group, so mutual exclusivity is inferred from hearing exactly one "pressed" — nothing states it.
- `aria-orientation` is suppressed on purpose: `role="group"` does not permit the attribute at all, so the value the primitive would otherwise compute is an axe `aria-allowed-attr` failure regardless of what it says. Putting it back is a regression, not a preference.
- Every trigger has a real text name in all three variants. `with-tooltip` keeps `mode.label` as `sr-only` button content, so the accessible name survives even if the tooltip never fires — the tooltip repeats the name for sighted users rather than being the only copy of it.
- The icon in `with-icon` and `with-tooltip` sits inside an `aria-hidden` span and never contributes to the name. The name is `mode.label`, exactly, in every variant.
- Switching mode announces only the pressed state of the button just activated. Nothing announces what changed downstream, so if moving from Ask to Build rewrites the surface below, the live region belongs on that surface and not here.

**Focus**

- The roving tabindex is the only thing that moves focus, and it moves it inside the row. Nothing opens, nothing unmounts, and tabbing out lands wherever document order puts it.
- The focus ring comes from the shared toggle variant rather than from this component, so it matches every other toggle in the system and changes with it. There is nothing to supply and nothing to override here.

## Pitfalls

- ModeTabs doesn't clamp `modes.length` — the 2–5 range from the spec is the caller's responsibility to respect, not something the component enforces.
- The selected mode is a working context that the spec says must survive a reload, but ModeTabs only owns the click — persisting `value` across sessions (URL state, localStorage, a server-side setting) is the consuming app's job.

## Composition

- States: `text-only`, `with-icon`, `with-tooltip`
- Composes from this registry: nothing
- shadcn primitives: toggle-group, tooltip
- npm: none

## Evidence

CapCut, Claude, Manus, Spellbook
