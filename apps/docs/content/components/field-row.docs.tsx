import type { ComponentDocs } from "@/lib/component-docs";
import {
  HintNotWired,
  HintWiredToControl,
  ResetInTrailingSlot,
  ResetOutsideTheRow,
  UnitAsSuffix,
  UnitInLabelText,
} from "./field-row.examples";

/**
 * Seeded from docs/design-system/component-specs.md#a6-field-row.
 * Translate the spec's internal voice into consumer-facing guidance — do not
 * ship the seed text verbatim.
 *
 * No "use client" here: this module is plain data read by a Server
 * Component (component-docs.tsx). Every live example lives in the
 * ./field-row.examples client sidecar, because FieldRow takes its children
 * as a render prop and a function cannot cross the server/client boundary.
 */
export const FieldRowDocs: ComponentDocs = {
  whatItIs:
    "One labelled parameter on a shared column grid: a label, whatever control sets the value, and an optional reset beside it, with an optional explanation line underneath. It ships no control of its own — the control column is a render prop that hands you the id to put on your control and the id of the hint to describe it with. The one control it does ship is UnitInput, a number field that carries its unit inside the box.",
  whyItMatters:
    "Every inspector in this system is a stack of these, so the grid is the reason a panel reads as one thing rather than a pile of controls: labels line up, values line up, resets line up, whatever each row happens to hold. CapCut, Canva, Spline and Tripo all ship the same row, and after preview-tile it is the most reused primitive in the catalog — parameter-panel and property-inspector are both built from it. The render prop is what buys that: because the row never owns the control, a slider row and a switch row and a colour row are the same component and cannot drift apart.",
  evidence: ["CapCut", "Canva", "Spline", "Tripo"],
  anatomy: [
    { slot: "field-row", note: "Root. Stacks the label/control grid over the optional hint line." },
    {
      slot: "field-row-label",
      note: "The visible label, in a fixed 6rem column. A real <label for>, pointed at the id the render prop hands you.",
    },
    {
      slot: "field-row-control",
      note: "The control column. Holds whatever your render prop returns, then the reset slot.",
    },
    {
      slot: "field-row-reset",
      note: "Trailing slot, present only when `reset` is passed — normally a reset-affordance (A11).",
    },
    {
      slot: "field-row-hint",
      note: "The explanation line under the row. Its id arrives as the render prop's second argument; wire it with aria-describedby.",
    },
    { slot: "unit-input", note: "UnitInput's border box. It owns the focus ring, via focus-within." },
    { slot: "unit-input-unit", note: "The unit suffix inside that box — %, s, ×, px. Decorative text, not a label." },
  ],
  usage:
    "Reach for it whenever a surface sets a named parameter: a generation panel, a properties inspector, a settings group. Give it a label and a function for children — you get back `(controlId, describedBy)`, and your job is to put `controlId` on the control so the visible label really names it, and `describedBy` on the same control when you passed a `hint`. For a numeric parameter use the `UnitInput` it ships so the unit reads as a suffix rather than as separate text. Add `reset` once a row is bound to a value a user can move away from. Stack rows directly — do not wrap each one in its own card — because the shared column grid only pays off when the rows are siblings.",
  dos: [
    {
      text: "Carry the unit inside the field with UnitInput, so the number is self-describing wherever it is read.",
      example: <UnitAsSuffix />,
    },
    {
      text: "Apply both render-prop arguments: `controlId` on the control, and `describedBy` on it too whenever you passed a hint.",
      example: <HintWiredToControl />,
    },
    {
      text: "Put the reset in the `reset` slot so it lands in the row's grid and lines up with every other row's reset.",
      example: <ResetInTrailingSlot />,
    },
  ],
  donts: [
    {
      text: "Don't spell the unit into the label text — the label column is fixed at 6rem and the value stops being self-describing the moment it leaves the row.",
      example: <UnitInLabelText />,
    },
    {
      text: "Don't render a hint and drop `describedBy` — the explanation becomes sighted-only, and nothing in the row can detect it.",
      example: <HintNotWired />,
    },
    {
      text: "Don't hang the reset off the bottom of the row instead of using the slot; it leaves the grid and adds a line of height the stack's rhythm depends on not having.",
      example: <ResetOutsideTheRow />,
    },
  ],
  accessibility: {
    keyboard: [
      "The row is zero tab stops of its own — it is a `<div>`, a `<label>` and a `<p>`. Every stop it has comes from whatever your render prop returns, plus one more when you pass `reset`.",
      "`UnitInput` is one stop and a native number spinner: Up and Down step the value. The visible spinner buttons are removed (`[appearance:textfield]` plus the webkit override), so the arrow keys are the only stepper and a mouse user has no increment control at all.",
      "A `reset-affordance` in the `reset` slot is `disabled` while the row sits at its default, so it is not tabbable. The row's tab-stop count changes as the value changes.",
      "There is no `disabled` on the row. Disabling is something you do to the control you passed in, so the label keeps its full opacity and anything in the `reset` slot stays live unless you disable that too.",
    ],
    screenReader: [
      "`<label for>` plus the id from the render prop is the entire naming story. Return a control without applying `controlId` and the label points at nothing: the control ships unnamed and the label text is announced as loose text beside it.",
      "The hint is a plain `<p>` with an id, and nothing wires it for you. `describedBy` is the render prop's second argument and applying it is yours to do, so an unwired hint is sighted-only — and no gate can see the omission.",
      '`UnitInput`\'s suffix is a sibling `<span>` of the input, not part of its name or its value. The field announces as a spin button reading "0.5", never "0.5 seconds", so put the unit in the label too when the bare number is ambiguous.',
      "One `controlId` per row, and no group role around the control column. A two-control row — an x/y pair, a slider beside its number field — can name only one of the two, and there is no group name to say the pair belongs together.",
      "Nothing here announces a value change. The row owns no live region, so a reset that moves a value from 1.5 back to 1.0 is silent beyond whatever the control itself reports.",
    ],
    focus: [
      "`UnitInput` draws its ring on the wrapper with `focus-within:ring-2` while the input itself sets `outline-none`. Restyle `unit-input`'s className without keeping `focus-within:ring-2` and the field has no focus indicator at all.",
      "Pressing a `reset-affordance` in the `reset` slot returns the row to default — which is the state that disables that same button. Focus is dropped from the now-disabled element and falls to `<body>`, so the next Tab restarts from the top of the page.",
      "Clicking the visible label moves focus to the control. Clicking the unit suffix does not; it is inert text, and the gap is marked as a TODO in the source.",
      "Whatever the render prop returns brings its own focus style. The row supplies none.",
    ],
  },
  pitfalls: [
    "The row hands out exactly one `controlId`, so a two-control row — an x/y pair, a slider plus its number field — can only associate the visible label with one of them. Give every extra control its own `aria-label`; the row has no group-label shape to express the relationship for you.",
    "`<label for>` only reaches a labelable element, and some controls are not one even though they look like it. Base UI's Switch renders a span with role=\"switch\" beside a visually hidden proxy input, and it is the proxy that takes your `controlId` — it still works, because Base UI finds the label through that proxy and points the visible switch at it, but two nodes now answer to the label text, so query such a control by role and name rather than by label. A control with no proxy at all, like a Base UI slider thumb, gets nothing: name it yourself with `getAriaLabel`, which is what parameter-panel.tsx does.",
    "The row exposes the control's id and the hint's id, never the label's. A control that can only be named with `aria-labelledby` has nothing to point at, so the label text has to be repeated as a string — and a repeated string is one that can drift.",
    "There is no `disabled` prop on the row. The root is a div, so disabling is something you do to the control you passed in — which means the label does not dim with it. If a whole row should read as unavailable, dim the label yourself.",
    "`UnitInput` reports through two callbacks and they are not the same: `onValueChange` gives you a number and only fires when the field parses to one, while `onChange` gives you the raw event and fires every time. Clearing the field is a change with no value, so a consumer listening only to `onValueChange` never learns the field was emptied.",
    "The unit suffix is inert text. Clicking it does not focus the field the way clicking the label does — a known gap, marked in the source.",
  ],
};
