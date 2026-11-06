"use client";

import { AgentPresence, AgentPresenceRegion } from "@/registry/super-ai/agent-presence";

/** Scope read as a sentence, next to the state in words. */
export function ChipNamesItsScope() {
  return (
    <AgentPresence state="acting" scope="Can see and use this tab" onPause={() => {}} onTakeOver={() => {}} />
  );
}

/** The region and the chip share one state, so the outline always has its words. */
export function RegionWithChip() {
  return (
    <AgentPresenceRegion state="acting" className="flex w-80 flex-col gap-3 rounded-lg p-3">
      <AgentPresence
        state="acting"
        scope="Can see and use this tab"
        onPause={() => {}}
        onTakeOver={() => {}}
      />
      <p className="text-sm">Flight search results</p>
    </AgentPresenceRegion>
  );
}

/** Blocked work named in copy; the approval itself lives in a permission prompt. */
export function NeedsYouNamesTheApproval() {
  return (
    <AgentPresence
      state="needs-you"
      scope="Can see and use this tab"
      need="Approve sending the draft"
      onTakeOver={() => {}}
    />
  );
}

/** An outline with no chip: the cue is a colour and a line style, with no words. */
export function OutlineWithoutChip() {
  return (
    <AgentPresenceRegion state="acting" className="flex w-80 rounded-lg p-3">
      <p className="text-sm">Flight search results</p>
    </AgentPresenceRegion>
  );
}

/** A scope that names nothing the agent can reach. */
export function VagueScope() {
  return <AgentPresence state="acting" scope="Active" onPause={() => {}} />;
}
