"use client";

import * as React from "react";

import {
  AgentPresence,
  AgentPresenceRegion,
  type AgentPresenceState,
} from "@/registry/super-ai/agent-presence";

/** The host owns the state; the chip's menu only asks for a change. */
export default function AgentPresenceDemo() {
  const [state, setState] = React.useState<AgentPresenceState>("acting");
  return (
    <AgentPresenceRegion state={state} className="flex w-full max-w-md flex-col gap-3 rounded-lg p-4">
      <AgentPresence
        state={state}
        scope="Can see and use this tab"
        need="Approve sending the draft"
        onPause={() => setState("paused")}
        onResume={() => setState("acting")}
        onTakeOver={() => setState("taken-over")}
        onOpenSteps={() => {}}
      />
      <p className="text-sm text-foreground">Flight search results</p>
    </AgentPresenceRegion>
  );
}
