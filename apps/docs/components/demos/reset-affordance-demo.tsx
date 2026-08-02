"use client";
import { useState } from "react";

import { FieldRow, UnitInput } from "@/registry/super-ai/field-row";
import { ResetAffordance } from "@/registry/super-ai/reset-affordance";

const DEFAULT_OPACITY = 100;

export default function ResetAffordanceDemo() {
  const [opacity, setOpacity] = useState(64);
  const modified = opacity !== DEFAULT_OPACITY;
  return (
    <div className="w-full max-w-xs">
      <FieldRow
        label="Opacity"
        reset={
          <ResetAffordance
            state={modified ? "modified" : "default"}
            label="Reset opacity"
            onReset={() => setOpacity(DEFAULT_OPACITY)}
          />
        }
      >
        {(id) => (
          <UnitInput id={id} unit="%" value={opacity} onValueChange={setOpacity} />
        )}
      </FieldRow>
    </div>
  );
}
