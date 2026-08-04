"use client";
import * as React from "react";

import { SlotSummary, type Slot } from "@/registry/super-ai/slot-summary";

const INITIAL: Slot[] = [
  { id: "who", label: "Member", value: "A. Okonkwo", source: "stated" },
  { id: "plan", label: "Plan", value: "PPO Gold", source: "retrieved" },
  { id: "date", label: "Service date", value: "14 March", source: "inferred", confidence: "low" },
  { id: "region", label: "Region", value: "Northeast", source: "defaulted" },
  { id: "auth", label: "Authorization", source: "stated", required: true },
];

export default function SlotSummaryDemo() {
  const [slots, setSlots] = React.useState(INITIAL);

  return (
    <div className="w-full max-w-lg">
      <SlotSummary
        slots={slots}
        confirmLabel="Submit this claim"
        onConfirm={() => {}}
        onCancel={() => setSlots(INITIAL)}
        // Correcting one slot patches that slot. Nothing else resets — that is
        // the Dialog contract's correction-without-restart obligation.
        onCorrect={(id) =>
          setSlots((current) =>
            current.map((s) =>
              s.id === id
                ? {
                    ...s,
                    value: s.value == null ? "PA-88213" : "corrected",
                    source: "stated",
                    confidence: undefined,
                  }
                : s,
            ),
          )
        }
      />
    </div>
  );
}
