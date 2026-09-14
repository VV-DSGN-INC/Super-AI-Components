# Coach Mark

> One step of a product tour: a popover anchored to a real element, with a scrim that cuts a hole around that element so it stays fully lit while the rest of the screen dims. It always carries a step counter and a Skip control, and it always hands control back — it advances nothing on its own.

Layer: component · Family: L · Install: `npx shadcn@latest add https://super-ai-components.vercel.app/r/coach-mark.json` · Contract: `components/super-ai/coach-mark.meta.json` (installed beside the component; version-locked to the code, so it outranks this page) · Docs: https://super-ai-components.vercel.app/components/coach-mark

## Why it matters

Every onboarding surface on the reference board points at something specific. CapCut's yellow tips, Lovable's inline tooltips, Airtable's Omni introduction and Spline's first-run walkthrough all teach by highlighting one live control at a time rather than describing it in a modal. The cut-out is what makes that work: the moment the scrim covers the thing being explained, the user is reading a description of a button they can no longer see, and the tour becomes a slideshow. The counter and Skip matter for the opposite reason — a tour with no visible length and no exit is a hostage situation, and it is the single most common complaint about onboarding flows.

## When to reach for it

Wrap the element you want to teach and pass the copy, the position in the sequence, and the callbacks: `step`, `total` and `onSkip` are required, because a step that cannot say how long the tour is or let the user out is not a coach-mark. Reach for it when a single live control needs explaining in place; reach for a dialog instead when what you have to say is not about one element. Leave `spotlight` on when the tour should own the screen, and turn it off for a tip that annotates without taking over. Because the component is not modal, the anchored element stays clickable and stays announced to screen readers — dimming it, visually or programmatically, is the one thing this component exists to prevent.

There is no `<Tour>` component here, and there should never be one. A tour is a sequence of coach-marks over shared state: the host owns the array of steps, the current index, and whether the user has seen it before, and drives each mark with `open`, `step` and `total`. Rendering every mark and toggling `open` keeps the anchors stable; mounting them one at a time also works. If you find yourself wanting a manager component, what you actually want is a hook in your own app that owns the index.

## Variants

Not yet recorded.

## Instead use

Not yet recorded.

## Do

- Keep the anchored element at full strength — the cut-out is the component, not a decoration on it.
- Let the counter and Skip stand even on a one-step tip; they are structural, not optional trimmings.

## Don't

- Don't lay a full-bleed scrim over the anchor. Dimming what you point at turns a tour into a slideshow about an invisible button.
- Don't reduce progress to a row of dots, and never ship a step with no way out. Two greys are not a sentence, and a screen reader reads neither.

## Anatomy

- `coach-mark`: Root wrapper around the anchored element. Establishes the positioning context; adds no visual of its own.
- `coach-mark-anchor`: Empty, aria-hidden span laid over the anchor box. Positions the popover and nothing else — it is never a control.
- `coach-mark-scrim`: The dim. Painted outside the cut-out by a large shadow spread, so the anchor is never covered.
- `coach-mark-cutout`: Full-strength ring around the lit area, so the hole reads as deliberate rather than as a rendering gap.
- `coach-mark-content`: The popover itself — role=dialog, named by the title, and where focus lands when the step opens.
- `coach-mark-arrow`: Pointer back to the anchor. Carries data-side, so it follows the popover when it flips.
- `coach-mark-header`: Title and description.
- `coach-mark-title`: The step heading, and the accessible name of the dialog.
- `coach-mark-description`: Body copy explaining the anchored element.
- `coach-mark-footer`: Counter on one side, controls on the other.
- `coach-mark-step`: The mandatory counter. Text first; the dots beside it are decorative and aria-hidden.
- `coach-mark-skip`: The mandatory exit. Always rendered, always inside the popup where focus lands.
- `coach-mark-back`: Previous step. Suppressed on step 1 whether or not onBack is passed.
- `coach-mark-next`: Advance. Relabels to the finish label on the last step.

## Accessibility

**Keyboard**

- Step 1 is two tab stops inside the popup — Skip, then Next — and later steps are three, because Back is suppressed on the first step whether or not `onBack` is passed. Omitting `onNext` drops it to one: Skip is the only control that always exists.
- Escape closes the step, because the popover dismisses by default. It does **not** call `onSkip` — only the Skip button does. A tour that records "user bailed out" in `onSkip` will miss every Escape; do that bookkeeping in `onOpenChange` instead.
- Nothing is trapped, but Tab past Next does not do what this note used to claim. It ends the tour: Base UI's trigger focus guard closes the popup on `focusOut` before forwarding, so the step is dismissed and the spotlight goes with it. The guard also forwards to the tabbable *after* the anchor, so forward-tabbing never lands on the control being pointed at — the opposite of the intent. Measured in the KeyboardOrder story, which stops at Next rather than taking the convention's closing tab, because that tab is the defect
- The anchored element keeps its own tab stop. The positioning anchor is an `aria-hidden`, `tabIndex={-1}` span laid over the anchor box and never wrapped around your children, so a tour pointing at a button leaves that button focusable and activatable, and never nests one control inside another.
- The dot rail is decorative and unreachable; the counter beside it is plain text, so there is nothing to tab to in the footer's left half.

**Screen reader**

- The popup is a dialog named by `title` and described by `description` when you pass one. `title` is required for exactly that reason — a step without one announces as an unlabelled dialog.
- The counter is a real sentence inside the popup, so "Step 2 of 5" is announced with the step. The dots are `aria-hidden`, and past eight steps they are not rendered at all while the sentence stays.
- The scrim, the cut-out ring and the anchor span are all `aria-hidden`, so the spotlight contributes nothing to what is announced — the visual and the semantics say the same thing, which is that one specific element is the subject.
- The component is not modal and not `modal="trap-focus"`, both of which would mark everything outside the popup `aria-hidden` — including the element the step points at. The trade-off is real: a reader browsing the page rather than following focus reaches the step only in DOM order, at the end of the body where it is portaled.
- Nothing announces the step count changing. Advancing unmounts one dialog and mounts the next, with no live region tying them together; the new dialog's name and counter are announced when focus lands in it.
- `skipLabel`, `nextLabel`, `backLabel` and `finishLabel` are the buttons' entire names. "Next" and "Done" are fine inside a named dialog and thin if your reader is navigating by button list.

**Focus**

- Focus is moved into the step when it opens — onto the popup element itself, not onto a button, so the title and description are announced before Skip is reached, and Skip is one Tab away. That is `autoFocus`, on by default; the underlying primitive would move nothing, because a tour opens its steps programmatically rather than by a real interaction.
- Focus is deliberately not restored on close. In a running tour the right destination is the next step, so when the tour ends or is skipped the host must send focus somewhere itself — otherwise it falls to `<body>` and the next Tab restarts at the top of the document.
- The primitive's default restore would have targeted the anchor span, which is `aria-hidden`. That is why the restore is turned off rather than left alone, and why re-enabling it is not the fix.
- The popup is focused programmatically and carries no visible ring of its own, so the first thing a sighted keyboard user sees is the step appearing, not an outline. The three buttons all use the shared button `focus-visible` ring.

## Pitfalls

- The scrim is a very large shadow spread, so any ancestor with `overflow: hidden` clips it and the dim stops at that edge. If a tour step lives inside a scroll container or a card that clips, either move the coach-mark up the tree or accept a scoped dim — there is no measurement to fix it with.
- The same applies to stacking contexts: an ancestor with its own `transform`, `filter` or `z-index` traps the scrim inside it, and page chrome painted above that context stays undimmed. Anchor tours to elements in the main document flow where you can.
- `step` and `total` describe where a step sits; they do not move it. Clicking Next fires `onNext` and changes nothing on screen. If a step appears frozen, the host is not updating its index — that is the intended split, not a bug.
- Focus moves into the step when it opens and is deliberately not restored on close, because in a running tour the right destination is the next step, not the previous anchor. The host must send focus somewhere sensible when the tour ends or is skipped, or a keyboard user is left at the top of the document.
- Passing an interactive element as the anchor is normal and safe — the anchor span is a sibling of your children, not a wrapper around them, so a tour pointing at a button never nests one control inside another. Do not wrap the children in your own trigger to 'help'.
- Dismissal is not persisted here. A coach-mark shown again on every visit is the most-hated pattern in this family; the host owns the seen-flag, exactly as it owns the index.

## Composition

- States: `spotlight`, `no-spotlight`, `step-counter`, `arrow-flip`
- Composes from this registry: nothing
- shadcn primitives: button, popover
- npm: none

## Evidence

CapCut, Lovable, Airtable Omni, Spline
