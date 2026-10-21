"use client";

import { PrivateSessionChip, PrivateSessionNotice } from "@/registry/super-ai/private-session-notice";

/**
 * Live examples for private-session-notice.docs.tsx.
 *
 * Client sidecar: the docs module is server-read plain data, so every example
 * crosses into it as a zero-prop element.
 */

const STATEMENT =
  "This chat will not be saved to history or memory, and will not be used to train models. Your prompts, files and outputs stay out of personalisation.";

export function StatementBeforeFirstMessage() {
  return (
    <div className="w-80">
      <PrivateSessionNotice state="entering" statement={STATEMENT} />
    </div>
  );
}

export function ExitStatesRetention() {
  return (
    <div className="w-80">
      <PrivateSessionNotice
        state="exiting"
        statement={STATEMENT}
        retention={{ kind: "deleted-after", period: "30 days" }}
      />
    </div>
  );
}

export function ConnectorsNamedWithScope() {
  return (
    <div className="w-80">
      <PrivateSessionNotice
        state="connectors-reduced"
        statement={STATEMENT}
        connectors={[
          { name: "Calendar", scope: "off" },
          { name: "Drive", scope: "reduced", detail: "Read-only, no history" },
        ]}
      />
    </div>
  );
}

export function ChipInTopbar() {
  return (
    <div className="flex w-80 items-center justify-between rounded-lg border px-3 py-2">
      <span className="text-sm font-medium">Untitled chat</span>
      <PrivateSessionChip />
    </div>
  );
}

/** Wrong: the chip is left off while the header says nothing, so the mode is invisible past the first screen. */
export function ChipMissingAfterFirstMessage() {
  return (
    <div className="flex w-80 items-center justify-between rounded-lg border px-3 py-2">
      <span className="text-sm font-medium">Untitled chat</span>
      <span className="text-sm">Share</span>
    </div>
  );
}

/** Wrong: the statement is rewritten into a vague line that claims more than a host can enforce. */
export function OverclaimingCopy() {
  return (
    <div className="w-80">
      <PrivateSessionNotice
        state="entering"
        statement="Nothing you say here is ever stored, anywhere, by anyone."
      />
    </div>
  );
}

/** Wrong: the exit state leaves retention out, so the person cannot tell whether the chat survives. */
export function ExitWithoutOutcome() {
  return (
    <div className="w-80">
      <PrivateSessionNotice
        state="exiting"
        statement={STATEMENT}
        retention={{ kind: "deleted-now", detail: "Session closed." }}
      />
    </div>
  );
}
