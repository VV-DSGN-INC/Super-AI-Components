"use client";

import * as React from "react";
import { RunButton } from "@/registry/super-ai/flow/run-button";
import type { FlowStatus } from "@/registry/super-ai/flow/flow-types";

export default function RunButtonDemo() {
  const [status, setStatus] = React.useState<FlowStatus>("idle");

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Live idle/streaming demo with cost chip and scope menu */}
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">Idle · cost chip · scope menu</p>
        <RunButton
          status={status}
          onRun={() => setStatus("streaming")}
          onStop={() => setStatus("idle")}
          onRunFrom={() => {}}
          onRunAll={() => {}}
          cost={{ amount: 12, unit: "credits" }}
        />
      </div>

      {/* Locked — static example */}
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">Locked</p>
        <RunButton status="locked" onRun={() => {}} />
      </div>

      {/* Locked with cost — static example */}
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">Locked · cost chip</p>
        <RunButton status="locked" onRun={() => {}} cost={{ amount: 50, unit: "credits" }} />
      </div>
    </div>
  );
}
