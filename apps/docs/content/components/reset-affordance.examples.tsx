"use client";

import { useState } from "react";

import { FieldRow, UnitInput } from "@/registry/super-ai/field-row";
import { ResetAffordance } from "@/registry/super-ai/reset-affordance";

/**
 * Live examples for reset-affordance.docs.tsx.
 *
 * Client sidecar, kept separate from the docs module on purpose:
 * component-docs.tsx is a Server Component and reads `docs.whatItIs`,
 * `docs.usage` and so on directly, so reset-affordance.docs.tsx has to stay
 * plain server-evaluable data and cannot carry "use client" itself. Every
 * example that needs an `onReset` handler or local state lives here and
 * crosses into the docs module as a zero-prop element.
 */

const DEFAULT_OPACITY = 100;

export function DerivedFromStoredDefault() {
  const [opacity, setOpacity] = useState(64);
  // `state` is a comparison against the value you shipped as the default, not
  // a flag the component keeps. Clicking reset does not change `state` on its
  // own — this handler moves the value, and the next render recomputes it.
  const state = opacity === DEFAULT_OPACITY ? "default" : "modified";
  return (
    <div className="w-64">
      <FieldRow
        label="Opacity"
        reset={
          <ResetAffordance state={state} label="Reset opacity" onReset={() => setOpacity(DEFAULT_OPACITY)} />
        }
      >
        {(id) => <UnitInput id={id} unit="%" value={opacity} onValueChange={setOpacity} />}
      </FieldRow>
    </div>
  );
}

export function LabelledPerField() {
  // One `label` per field. Without them every reset in the inspector reports
  // the same accessible name, and a screen-reader element list reads as
  // "Reset, Reset, Reset" with nothing to tell them apart.
  return (
    <div className="w-64 space-y-2">
      <FieldRow
        label="Opacity"
        reset={<ResetAffordance state="modified" label="Reset opacity" onReset={() => {}} />}
      >
        {(id) => <UnitInput id={id} unit="%" defaultValue={64} />}
      </FieldRow>
      <FieldRow
        label="Blur"
        reset={<ResetAffordance state="modified" label="Reset blur" onReset={() => {}} />}
      >
        {(id) => <UnitInput id={id} unit="px" defaultValue={12} />}
      </FieldRow>
    </div>
  );
}

export function UnmountedAtDefault() {
  const [opacity, setOpacity] = useState(DEFAULT_OPACITY);
  const modified = opacity !== DEFAULT_OPACITY;
  // The wrong way: dropping the control out of the tree when there is nothing
  // to reset. Type in the field and the reset appears, widening the control
  // group and shifting the input left — every row in the inspector reflows
  // the moment any value changes. The component is disabled at
  // state="default" precisely so the slot keeps its width.
  return (
    <div className="w-64">
      <FieldRow
        label="Opacity"
        reset={
          modified ? (
            <ResetAffordance
              state="modified"
              label="Reset opacity"
              onReset={() => setOpacity(DEFAULT_OPACITY)}
            />
          ) : undefined
        }
      >
        {(id) => <UnitInput id={id} unit="%" value={opacity} onValueChange={setOpacity} />}
      </FieldRow>
    </div>
  );
}

export function DotUsedAsAControl() {
  // The wrong way: reaching for `collapsed` because the dot is smaller. It
  // renders a span with aria-hidden="true" — no role, no accessible name, no
  // click target and no tab stop. Next to a live field it looks like a
  // control and answers nothing. `collapsed` belongs on a folded-up group.
  return (
    <div className="w-64">
      <FieldRow label="Opacity" reset={<ResetAffordance state="modified" collapsed />}>
        {(id) => <UnitInput id={id} unit="%" defaultValue={64} />}
      </FieldRow>
    </div>
  );
}
