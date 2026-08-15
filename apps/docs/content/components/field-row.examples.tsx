"use client";

import { FieldRow, UnitInput } from "@/registry/super-ai/field-row";
import { ResetAffordance } from "@/registry/super-ai/reset-affordance";

/**
 * Live examples for field-row.docs.tsx.
 *
 * Everything here is a client sidecar rather than inline JSX in the docs
 * module, and for this component the reason is stronger than usual:
 * `FieldRow`'s `children` is a *render prop*, a function. A Server Component
 * cannot hand a function to a client component, so there is no version of a
 * FieldRow example that can live in the server-evaluable docs module at all.
 * Each example crosses the boundary as a zero-prop element instead.
 */

export function UnitAsSuffix() {
  return (
    <div className="w-80">
      <FieldRow label="Speed">{(id) => <UnitInput id={id} unit="×" defaultValue={1.5} step={0.1} />}</FieldRow>
    </div>
  );
}

export function HintWiredToControl() {
  return (
    <div className="w-80">
      <FieldRow label="Guidance" hint="Higher values follow the prompt more literally.">
        {(id, describedBy) => (
          <UnitInput id={id} aria-describedby={describedBy} unit="" defaultValue={7} step={0.5} />
        )}
      </FieldRow>
    </div>
  );
}

export function UnitInLabelText() {
  // The wrong way: the unit pushed into the label so the field is a bare
  // number. The row's label column is fixed at 6rem, so "Speed (x)" spends
  // that budget on punctuation, and the value stops being self-describing
  // the moment it is copied, read aloud, or shown in a summary elsewhere.
  return (
    <div className="w-80">
      <FieldRow label="Speed (x)">{(id) => <UnitInput id={id} unit="" defaultValue={1.5} step={0.1} />}</FieldRow>
    </div>
  );
}

export function HintNotWired() {
  // The wrong way: the hint renders, and the second render-prop argument is
  // dropped. Sighted users get the explanation; anyone on a screen reader
  // gets a number field called "Guidance" and nothing else. Nothing warns
  // you — the row cannot tell whether you used `describedBy`.
  return (
    <div className="w-80">
      <FieldRow label="Guidance" hint="Higher values follow the prompt more literally.">
        {(id) => <UnitInput id={id} unit="" defaultValue={7} step={0.5} />}
      </FieldRow>
    </div>
  );
}

export function ResetInTrailingSlot() {
  return (
    <div className="w-80 space-y-1">
      <FieldRow label="Opacity" reset={<ResetAffordance state="modified" onReset={() => {}} />}>
        {(id) => <UnitInput id={id} unit="%" defaultValue={80} />}
      </FieldRow>
      <FieldRow label="Strength" reset={<ResetAffordance state="default" onReset={() => {}} />}>
        {(id) => <UnitInput id={id} unit="%" defaultValue={100} />}
      </FieldRow>
    </div>
  );
}

export function ResetOutsideTheRow() {
  // The wrong way: a reset control placed after the row instead of in the
  // `reset` slot. It leaves the grid, so it no longer lines up with the
  // resets on the rows above and below, and it adds a line of height that
  // breaks the stack's rhythm — the two things the shared column grid exists
  // to prevent.
  return (
    <div className="w-80">
      <FieldRow label="Opacity">{(id) => <UnitInput id={id} unit="%" defaultValue={80} />}</FieldRow>
      <button type="button" className="text-muted-foreground hover:text-foreground mt-1 text-xs">
        Reset opacity
      </button>
    </div>
  );
}
