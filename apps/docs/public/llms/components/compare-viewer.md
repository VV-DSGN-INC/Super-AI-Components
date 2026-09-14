# Compare Viewer

> Two or more renders of the same thing, shown together in one of three modes: side by side with a draggable divider, one at a time, or overlaid with a wipe handle. Every pane is numbered as well as labelled, and the number is what survives into the modes that have no room for a caption.

Layer: component · Family: F · Install: `npx shadcn@latest add https://super-ai-components.vercel.app/r/compare-viewer.json` · Contract: `components/super-ai/compare-viewer.meta.json` (installed beside the component; version-locked to the code, so it outranks this page) · Docs: https://super-ai-components.vercel.app/components/compare-viewer

## Why it matters

Upscalers, variant pickers and before/after comparisons all ask the same question — is this one actually better? — and they all fail the same two ways. The first is losing track of which pane is which: as soon as you go to a wipe or a single view there is nowhere to put two labels, so products drop them and leave the reader guessing. Numbering the panes fixes that, because a number is small enough to survive anywhere and stable enough to talk about ("two is sharper"). The second is treating the before/after slider as its own widget, which produces two comparison surfaces that behave differently and drift apart. Here a wipe is a mode, so there is one component and one mental model.

## When to reach for it

Pass `panes` in the order you want them numbered — first is 1, and in wipe mode the second is the one clipped over the top. Control `mode` yourself and update it from `onModeChange`. `wipePosition` is a prop, so it survives a trip out to side view and back; keep it in your own state rather than letting the component forget it. In single mode, supply `onActivePaneChange` as well as `activePaneId`, or the numbers have nothing to do and the reader cannot switch panes. Label panes by what differs — "Original" and "Upscaled 4x", not "A" and "B".

## Variants

Not yet recorded.

## Instead use

Not yet recorded.

## Do

- Label panes by the difference between them, not by their position — the numbers already carry position.
- Reach for `mode="wipe"` instead of building a separate before/after slider; it is the same comparison with the same state.

## Don't

- Don't label panes "Version A" and "Version B" — that is what the numbers are for, and it wastes the one place you could have said what changed.
- Don't use single mode without `onActivePaneChange`; the pane numbers stop being a control and the reader is stranded on one pane.

## Anatomy

- `compare-viewer`: The root. Carries `data-mode` and, when given, `data-sync-key`.
- `compare-viewer-modes`: The side / single / wipe switcher.
- `compare-viewer-pane-switcher`: Single mode only: the numbers, acting as the pane control.
- `compare-viewer-panes`: The frame holding the panes. A resizable group in side mode.
- `compare-viewer-pane`: One pane's content, exactly as you passed it.
- `compare-viewer-pane-number`: The pane's identity. Present in every mode.
- `compare-viewer-pane-label`: The caption. Side mode only — the one mode with room for it.
- `compare-viewer-wipe`: The wipe slider. Composes Base UI directly so its handle can be named.

## Accessibility

**Keyboard**

- The mode switch is one tab stop, not three: it is a composite toggle group, so arrow keys move between Side by side, Single and Wipe, and focus loops at the ends. Enter or Space activates.
- The pane-number switcher sitting right beside it is a plain row of buttons — one tab stop each, no arrow-key traversal. Two adjacent groups with two different keyboard models is a real inconsistency in this component, and the numbers are the ones that behave unusually.
- The wipe handle is a real slider: arrow keys nudge it, Home and End jump to 0 and 100, Page Up and Page Down take a larger step.
- Side mode's divider is the resizable primitive's handle. It is focusable and arrow keys resize the split, so the number of tab stops in side mode grows with the number of panes.
- Single mode renders no switcher at all unless `onActivePaneChange` is passed. Without it there is no keyboard route — and no route of any kind — to another pane.
- Nothing responds to Escape, and there is no shortcut for cycling modes. Reaching the wipe from side view means tabbing to the mode group and arrowing twice.

**Screen reader**

- The mode group is named "Comparison mode" and each item is named by its visible label. `aria-orientation` is explicitly set to undefined because the primitive renders `role="group"`, which does not support that attribute at any value.
- Each pane-switcher button is named "Show pane 2: Upscaled 4x" — the number and the label together — so the control means something without seeing which pane is on screen. That is why labelling panes by what differs matters more here than it looks: the label is announced every time the number is.
- `aria-pressed` marks the active pane button, so which pane is showing is in the tree rather than only in the ring.
- The pane number badges and the side-mode label chips are plain text floating over the frame. Neither is wired to the pane it sits on, so nothing labels a pane region and a reader moving through the content hears no boundary between pane 1 and pane 2 — the numbering that solves the sighted version of this problem does not solve the announced one.
- The wipe thumb is named "Wipe position" and its value announces as "50 percent". That naming is the reason this composes Base UI's slider directly instead of the vendored wrapper, whose thumbs cannot be named at all — keep both callbacks if you restyle the handle.
- In wipe mode both panes stay mounted and the top one is clipped with `clipPath`. Clipping hides nothing from assistive tech, so a reader hears both panes' content in full no matter where the handle sits. If your panes carry text, wipe mode announces all of it twice.
- Single mode is the exception: only the active pane is rendered, so the others are genuinely absent from the tree.
- Nothing announces a mode change. There is no live region, so switching between side, single and wipe is silent beyond the toggle's own pressed state.

**Focus**

- Changing mode unmounts controls. Going to single drops every pane but one and drops the resize handle; going to wipe drops the pane switcher. Whichever of those had focus is gone and nothing restores it, so focus falls to `<body>`.
- The pane switcher exists only in single mode with a handler, so entering that mode inserts tab stops into the middle of the toolbar row and leaving it removes them again.
- Every control carries a visible focus indicator: `focus-visible:ring-2` on the pane buttons, `focus-visible:ring-3` on the wipe thumb, and the shared toggle styling on the mode items.

## Pitfalls

- `syncKey` does not synchronise anything by itself. The component never owns the media you pass as `content`, so it cannot drive a zoom or a playhead it cannot see — the key is rendered as `data-sync-key` for whatever does own the media to read. Synchronising zoom, pan and playhead is still your job, and drifting clips make a comparison actively misleading.
- Wipe mode uses exactly the first two panes. A third pane is numbered and labelled in side mode but has nowhere to go in a wipe, so it simply is not drawn there.
- Both wipe panes stay mounted and the top one is clipped, which is what stops video restarting every time the handle moves — but it also means both are decoding at once. For heavy media that is a real cost.
- The wipe handle composes Base UI's slider directly rather than the vendored `ui/slider`, because that wrapper forwards neither `getAriaLabel` nor `getAriaValueText` and its thumbs end up with no accessible name. If you restyle the handle, keep the label.
- `activePaneId` falls back to the first pane when it matches nothing, so a stale id fails quietly rather than rendering an empty frame. That is friendlier in production and easy to miss in development.

## Composition

- States: `side`, `single`, `wipe`
- Composes from this registry: nothing
- shadcn primitives: resizable, toggle-group
- npm: none

## Evidence

Topaz Video AI, Freepik upscale, Playground compare, Midjourney variants
