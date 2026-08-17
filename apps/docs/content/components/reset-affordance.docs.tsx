import type { ComponentDocs } from "@/lib/component-docs";
import {
  DerivedFromStoredDefault,
  DotUsedAsAControl,
  LabelledPerField,
  UnmountedAtDefault,
} from "./reset-affordance.examples";

/**
 * Seeded from docs/design-system/component-specs.md#a11-reset-affordance.
 * Translate the spec's internal voice into consumer-facing guidance — do not
 * ship the seed text verbatim.
 *
 * No "use client" here: this module is plain data read by a Server Component
 * (components/component-docs.tsx), which destructures `docs.whatItIs`,
 * `docs.usage`, etc. directly. The interactive examples live in the
 * ./reset-affordance.examples client sidecar and are referenced here as
 * zero-prop elements — see that file for why.
 */
export const ResetAffordanceDocs: ComponentDocs = {
  whatItIs:
    'The small ↺ that sits at the end of an editable row and puts the value back where it started. Three situations share the one slot — the value is modified, the value is already at its default, or the value is keyframed and the reset clears the track — so the row never reflows when the state changes. Widen its `scope` to "group" and the same control moves onto a section header, where it clears every row beneath it; set `collapsed` and it degrades to a dot, so a folded-up section can still show that something inside it changed.',
  whyItMatters:
    "It is the difference between a value you can experiment with and a value you are stuck with. CapCut, Canva, Spline and Tripo all put a reset at the end of the inspector row, and the reason is the same everywhere: without a visible affordance, reset falls back to a context menu, a double-click gesture or a keyboard shortcut, and users stop touching the sliders because they cannot get back. Keeping the control mounted-but-disabled at its default is the second half of that — the eye learns one position for it, and the row does not jump the moment a value moves.",
  evidence: ["CapCut", "Canva", "Spline", "Tripo"],
  anatomy: [
    {
      slot: "reset-affordance",
      note: "The control itself — a `<button>` carrying the ↺ or ◇ glyph, its accessible name from `label`, and the current state on `data-state`. Present whenever `collapsed` is false.",
    },
    {
      slot: "reset-affordance-dot",
      note: 'The collapsed form: a 6px `<span aria-hidden="true">` that replaces the button entirely. Same `data-state`, but no role, no name and nothing to click.',
    },
  ],
  usage:
    'Reach for it wherever a value has a default worth returning to — a field row in an inspector, or a section header that owns a group of them. Row scope goes in `field-row`\'s `reset` slot; group scope goes on `section-header` with `scope="group"`, which renders the larger of the two sizes. Compute `state` yourself by comparing the live value against the default you shipped: pass "modified" when they differ, "default" when they match, and "keyframed" when the value is driven by an animation track rather than a single number. Give every instance a `label` naming its field, and reserve `collapsed` for a group that is actually folded shut.',
  dos: [
    {
      text: "Derive `state` from the value on every render — the control has no memory of its own and will never flip itself after a click.",
      example: <DerivedFromStoredDefault />,
    },
    {
      text: "Give each reset a `label` naming the field it belongs to, so a screen-reader user can tell eleven of them apart.",
      example: <LabelledPerField />,
    },
  ],
  donts: [
    {
      text: "Don't unmount the reset when there is nothing to reset — it stays mounted and disabled on purpose, and conditionally rendering it makes every row reflow the instant a value moves.",
      example: <UnmountedAtDefault />,
    },
    {
      text: "Don't use `collapsed` as a smaller reset. The dot is decorative markup, not a control: it has no role, no accessible name and no click target.",
      example: <DotUsedAsAControl />,
    },
  ],
  accessibility: {
    keyboard: [
      'One tab stop when `state` is "modified" or "keyframed", and zero when it is "default" — the control is genuinely `disabled` there, not merely dimmed, so it holds its position and leaves the tab order. An inspector of eleven rows with two edited values is two stops, not eleven.',
      "Zero tab stops when `collapsed`. That branch renders a `<span>`, so there is nothing to focus and nothing to press.",
      'It is a real `<button>`, so Space and Enter both fire `onReset`. There is no Escape, no Delete and no modifier variant — Alt-click to clear a whole section is not implemented; use `scope="group"` on the section header instead.',
      "Props spread onto the button, but only in the uncollapsed branch: the `collapsed` return happens before the spread, so a `tabIndex` or `onKeyDown` you attach silently disappears the moment the group folds.",
    ],
    screenReader: [
      'The button\'s entire accessible name is `label`, which defaults to "Reset". The glyph inside is `aria-hidden`, so nothing else contributes — eleven unlabelled resets in one inspector announce as eleven buttons called "Reset".',
      '"keyframed" and "modified" are indistinguishable to assistive tech. The glyph changes from ↺ to ◇ and `data-state` changes with it, but the name does not and there is no description, so a value driven by an animation track sounds exactly like one that was edited. Put the difference in `label` ("Clear Opacity keyframes") when it matters.',
      '"default" is the one state that does announce itself: the button is `disabled`, so it reads as unavailable, which is the intended way of saying there is nothing to reset.',
      'The collapsed dot is `aria-hidden="true"` with no role and no name, so the promise that a folded group still signals its changes holds for sighted users only. Carry that signal on the group\'s own trigger instead.',
      "Nothing announces that a reset happened. There is no live region and no busy state here — the only evidence is the field's value changing, which the field has to announce itself.",
    ],
    focus: [
      'Resetting moves `state` to "default", which disables the button the user is standing on, and a focused element that becomes disabled is blurred — focus falls to `<body>` and the next Tab restarts at the top of the page. This fires on every successful reset, which makes it the most likely accessibility failure in a long inspector; move focus to the field you just reset.',
      "Collapsing a group replaces the button with the inert dot, dropping focus the same way if it was there.",
      "The button carries its own `focus-visible:ring-2`. It is a bare `<button>`, not the shared `Button`, so it inherits nothing — a `className` that rewrites its ring classes removes the only visible focus indicator it has.",
    ],
  },
  pitfalls: [
    'The prop value is `state="default"` while the catalog calls that state `at-default` — the two names are for the same situation, and only the prop spelling is load-bearing in code. Nothing else in the API uses the word "default", so read it as "the value is at its default", not "the default rendering".',
    "The collapsed dot is `aria-hidden`, so the promise that a folded-up group still signals its changes holds for sighted users only. If assistive-technology users need that signal too, carry it on the group's own trigger — a count, or a suffix on the section title — rather than relying on the dot.",
    "Row scope renders a 20×20 target and group scope renders 24×24. On touch surfaces the row-scope control sits under the 24×24 minimum WCAG 2.2 asks for, so give the row itself some breathing room, or use group scope where a whole section can be cleared at once.",
    "`onReset` is a plain `() => void` and fires synchronously. There is no busy or pending affordance, so if your reset round-trips to a server, hold your own flag and pass `disabled` yourself while it is in flight.",
    "The `collapsed` branch returns before the prop spread, so anything you pass through — `id`, `title`, extra `data-*`, a click handler — is honoured on the button and silently dropped on the dot. Do not rely on a pass-through surviving the collapse.",
  ],
};
