"use client";

import * as React from "react";

import { CaptureConsent } from "@/registry/super-ai/capture-consent";

/** Pre-notice names the people who will be told before anything can start. */
export function NoticeBeforeStart() {
  return <CaptureConsent state="pre-notice" participants={["Priya", "Marcus"]} />;
}

/** A persistent chip for the topbar, with the verb in text. */
export function PersistentChip() {
  return <CaptureConsent form="compact" state="recording" />;
}

/** Declined spells out what it costs the person who wanted to record. */
export function DeclinedWithConsequence() {
  return (
    <CaptureConsent
      state="declined"
      declinedBy={["Marcus"]}
      consequence="Notes for this call stay off. You can still take your own."
    />
  );
}

/** Ended says what is kept and what is gone. */
export function EndedWithKeptAndDeleted() {
  return <CaptureConsent state="ended" kept="Summary and action items" deleted="Audio and transcript" />;
}

/** The anti-pattern: Start is armed and the notice is gone, so consent is a click away from skipped. */
export function StartWithoutNotice() {
  return (
    <div className="border-border text-foreground flex items-center justify-between gap-3 rounded-lg border p-3 text-sm">
      <span>Meeting notes</span>
      <button type="button" className="bg-primary text-primary-foreground rounded-md px-3 py-1.5 text-sm">
        Record now
      </button>
    </div>
  );
}

/** The anti-pattern: a toast that disappears while the recording does not. */
export function ToastThatLeaves() {
  const [open, setOpen] = React.useState(true);
  return open ? (
    <div className="border-border text-foreground flex items-center justify-between gap-3 rounded-lg border p-3 text-sm">
      <span>Recording started</span>
      <button type="button" className="underline" onClick={() => setOpen(false)}>
        Dismiss
      </button>
    </div>
  ) : (
    <p className="text-foreground text-sm">Still recording, and nothing on screen says so.</p>
  );
}
