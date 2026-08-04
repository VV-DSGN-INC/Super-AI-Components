"use client";

import * as React from "react";

import {
  ApprovalCard,
  type ApprovalResolution,
  type ApprovalState,
} from "@/registry/super-ai/approval-card";

export default function ApprovalCardDemo() {
  const [state, setState] = React.useState<ApprovalState>("pending");
  const [resolution, setResolution] = React.useState<ApprovalResolution>();

  const resolve = (next: ApprovalResolution) => {
    setState("submitting");
    setResolution(next);
    // A real host would await its own request here; the timeout only stands in
    // for that round trip so the submitting state is visible.
    setTimeout(() => setState("resolved"), 700);
  };

  return (
    <div className="w-full max-w-md">
      <ApprovalCard
        title="Send the Q3 summary to the team"
        summary="Three paragraphs drafted from last quarter's metrics, ready to post in #general."
        detail={
          <p>
            Revenue grew 14% quarter over quarter, driven mostly by the self-serve tier. Churn held
            flat at 2.1%. The one number worth flagging is support volume, which rose 30% against a
            headcount that did not move.
          </p>
        }
        state={state}
        resolution={resolution}
        onConfirm={() => resolve("confirmed")}
        onEdit={() => resolve("edited")}
        onRegenerate={() => resolve("regenerated")}
        onSkip={() => resolve("skipped")}
        onUndo={() => {
          setState("pending");
          setResolution(undefined);
        }}
      />
    </div>
  );
}
