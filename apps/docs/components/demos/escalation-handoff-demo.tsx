"use client";
import * as React from "react";

import {
  EscalationHandoff,
  type EscalationState,
  type EscalationTrigger,
} from "@/registry/super-ai/escalation-handoff";
import { Button } from "@/components/ui/button";

const TRIGGERS: EscalationTrigger[] = ["user", "budget-exhausted", "low-confidence", "policy"];
const STATES: EscalationState[] = ["preview", "queued", "accepted", "unavailable"];

export default function EscalationHandoffDemo() {
  const [trigger, setTrigger] = React.useState<EscalationTrigger>("low-confidence");
  const [state, setState] = React.useState<EscalationState>("preview");

  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <div className="flex flex-wrap gap-1">
        {TRIGGERS.map((t) => (
          <Button
            key={t}
            size="sm"
            variant={t === trigger ? "secondary" : "ghost"}
            onClick={() => setTrigger(t)}
          >
            {t}
          </Button>
        ))}
      </div>
      <div className="flex flex-wrap gap-1">
        {STATES.map((s) => (
          <Button key={s} size="sm" variant={s === state ? "secondary" : "ghost"} onClick={() => setState(s)}>
            {s}
          </Button>
        ))}
      </div>

      <EscalationHandoff
        trigger={trigger}
        state={state}
        availability="Support is back at 9:00 ET."
        packet={{
          summary: "Colleague asking whether a vendor NDA can be countersigned without legal review.",
          slots: [
            { label: "Vendor", value: "stated" },
            { label: "Contract type", value: "inferred" },
            { label: "Region", value: "retrieved" },
          ],
          attempted: ["Searched the contract playbook", "Checked the standing delegation matrix"],
          request: "Confirm whether the under-$50k exception applies here.",
        }}
        onSend={() => {}}
        onEditPacket={() => {}}
        onCancel={() => {}}
        onLeaveMessage={() => {}}
      />
    </div>
  );
}
