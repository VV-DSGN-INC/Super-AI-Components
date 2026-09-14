# Generation Wizard

> A multi-step generate flow with three parts working together: a stepper that shows where you are and lets you jump back to anything you've already filled in, a live preview beside the current step that shows what your choices actually produce, and a navigation row where Back and Skip are secondary and only one action — the primary — moves you forward.

Layer: component · Family: E · Install: `npx shadcn@latest add https://super-ai-components.vercel.app/r/generation-wizard.json` · Contract: `components/super-ai/generation-wizard.meta.json` (installed beside the component; version-locked to the code, so it outranks this page) · Docs: https://super-ai-components.vercel.app/components/generation-wizard

## Why it matters

A generation flow with several independent settings (model, style, duration, voice) fails as a single long form because nothing shows the consequence of a choice until you've committed to all of them. Splitting it into steps only helps if each step's cost is visible before the next one — that's what the preview pane is for, and it's the difference between a wizard and a form that's merely been cut into pages. Descript's AI speaker setup, Tripo's model configuration, and Canva's magic flows all follow this shape: skippable steps, a visible in-progress result, and steps you can revisit without starting over.

## When to reach for it

Reach for it when a generation has more than one independent setting and getting one wrong is expensive enough that the user should see the result before moving on — not for a single-screen form, which doesn't need a stepper at all. Supply each step's own `content` (its fields) and `preview` (what those fields currently produce) separately; the component renders them side by side and swaps both together when the step changes. Leave `step`/`defaultStep` uncontrolled for a self-contained flow, or pass `step` and listen to `onStepChange` if a parent needs to drive or persist position.

## Variants

Not yet recorded.

## Instead use

Not yet recorded.

## Do

- Make every step's preview reflect that step's choices immediately, before the user commits to the next one.
- Keep completed steps clickable so revisiting an earlier choice never means cancelling and starting over.
- Drop Skip on the final step and swap the primary label for a commit verb — the last step ends the flow, it doesn't continue it.

## Don't

- Don't ship a wizard with no Back and no Skip — a step the user can't get past or out of is how the feature gets abandoned.
- Don't mark completed vs. upcoming steps by colour alone — pair it with a shape change (a check glyph, a filled vs. outline marker) and `aria-current`.

## Anatomy

- `generation-wizard`: Root wrapper around the stepper, the step body, and the nav row.
- `generation-wizard-stepper`: The ordered step list. Carries the programmatic 'Step X of Y' name.
- `generation-wizard-step`: One step: a button once completed, a non-interactive span while current or upcoming.
- `generation-wizard-step-connector`: The rule between two steps; fills in as steps complete.
- `generation-wizard-content`: The current step's own heading, description, and fields.
- `generation-wizard-preview`: The live consequence of the current step's choices — cost, a model summary, a thumbnail.
- `generation-wizard-nav`: The footer row: Back on one side, Skip and the primary action on the other.
- `generation-wizard-back`: Secondary. Disabled on the first step.
- `generation-wizard-skip`: Secondary. Present on every step except the last.
- `generation-wizard-primary`: The one action that advances. Reads 'Next' mid-flow, a commit verb ('Generate') on the last step.

## Accessibility

**Keyboard**

- The stepper is only as tabbable as it is complete: a completed step is a button, while the current and upcoming steps are `<span>`s. On step one the stepper has zero tab stops; on the last step it has all but one.
- It is an `<ol>` of buttons, not a tablist. There is no roving tabindex and the arrow keys do nothing — Tab is the only way across it.
- The nav row is Back, then Skip, then the primary action. Back is `disabled` on the first step and Skip is not rendered at all on the last, so the row is three stops mid-flow and two at either end.
- Nothing is bound to Enter or Escape at the wizard level. A step's own fields keep whatever keys they arrived with.

**Screen reader**

- The stepper's accessible name is "Step 2 of 4", and the same string is repeated as visible text beside the step title. The name changes as you advance, but a list's name changing is not announced — what users actually hear is the heading, via the focus move below.
- A completed step announces as "Completed: Model". The current step carries `aria-current="step"`; an upcoming step is a plain span with neither. The number and the check glyph are both `aria-hidden`, so position comes from the ordered list and from `aria-current`, never from the marker.
- There are no headings in this component. A12 `section-header` renders spans, so the step title — the very thing focus is moved to on every step change — announces as generic text, and heading navigation finds nothing in the wizard at all.
- On narrow viewports the step titles are `sr-only sm:not-sr-only` rather than hidden, so the stepper keeps its names at the breakpoint the labels disappear at.
- The preview pane is not a live region. Its whole point is that it changes as choices are made, and every one of those changes is silent — put an `aria-live` region inside your `preview` node when the number in it is the reason to stop.
- The primary action's label is the only signal that the last step commits rather than continues. "Generate" versus "Next" is the entire announcement; nothing describes what is about to be spent.

**Focus**

- Every step change moves focus to the new step's title, deliberately, so it never strands on a nav button that just changed meaning under the user's finger. That also covers the two cases that would otherwise drop focus to `<body>`: Back becoming `disabled` when you reach step one, and Skip unmounting when you reach the last step.
- The move fires on any change of the active step, including one a parent drives through the controlled `step` prop — so restoring a saved position steals focus. Only the initial mount is exempt.
- The target is a `<span tabIndex={-1}>` carrying `outline-none`. Screen-reader users get the step title read to them; sighted keyboard users get no visible indication of where focus went, and their next Tab starts from the step header rather than from the button they pressed.
- Clicking a completed step in the stepper therefore also moves focus forward, out of the stepper and into the step body.

## Pitfalls

- Treating the three declared states — stepper, preview pane, skip/back/primary nav — as variants to render one at a time. They're three regions of one composed wizard; a build that renders only one of them per 'state' has misread the spec.
- Wiring the primary button to always say "Next" and always call the same handler. The last step's primary action commits (spends credits, starts the render) rather than continuing, and needs its own label and handler.
- Building the stepper as free-jump tabs. Only completed steps are safe to jump back to — upcoming steps depend on choices not made yet, so they stay non-interactive until the user actually reaches them via Back, Skip, or the primary action.
- Reaching for `text-muted-foreground` inside the preview pane's `bg-muted` frame. That pairing measures under the 4.5:1 contrast minimum in this token set — use `text-foreground` or a pinned foreground step instead, as the component's own header text and step captions do — `text-foreground/60` is the measured floor (TOK-8): `/50` reads 3.7:1 in light mode.

## Composition

- States: `stepper`, `preview-pane`, `skip-back-primary`
- Composes from this registry: section-header
- shadcn primitives: button, button-group
- npm: lucide-react

## Evidence

Descript AI speaker flow, Tripo model setup, Canva magic flows
