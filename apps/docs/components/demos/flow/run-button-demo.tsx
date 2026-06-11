"use client"

import * as React from "react"
import { RunButton } from "@/registry/super-ai/flow/run-button"

export function RunButtonDemo() {
  const [status, setStatus] = React.useState<"idle" | "streaming">("idle")

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Idle with cost chip and scope menu */}
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">Idle · cost chip · scope menu</p>
        <RunButton
          status="idle"
          onRun={() => setStatus("streaming")}
          onRunFrom={() => alert("Run from here")}
          onRunAll={() => alert("Run all")}
          cost={{ amount: 12, unit: "credits" }}
        />
      </div>

      {/* Streaming with Stop */}
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">Streaming</p>
        <RunButton
          status="streaming"
          onRun={() => {}}
          onStop={() => setStatus("idle")}
        />
      </div>

      {/* Locked */}
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">Locked</p>
        <RunButton status="locked" onRun={() => {}} />
      </div>
    </div>
  )
}
