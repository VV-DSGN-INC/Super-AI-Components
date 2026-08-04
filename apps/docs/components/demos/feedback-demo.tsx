"use client";
import { useState } from "react";

import { Feedback, type FeedbackState, type FeedbackValue } from "@/registry/super-ai/feedback";

// Local state stands in for whatever the consumer actually persists (a
// backend call, an analytics event). The component only renders the
// state/value/reason it's given — this wiring is what turns a thumbs-down
// into the "rating" ask, and a Send (or a one-click thumbs-up) into
// "submitted".
export default function FeedbackDemo() {
  const [state, setState] = useState<FeedbackState>("idle");
  const [value, setValue] = useState<FeedbackValue | undefined>(undefined);
  const [reason, setReason] = useState("");

  return (
    <Feedback
      state={state}
      value={value}
      reason={reason}
      onReasonChange={setReason}
      onRate={(next) => {
        setValue(next);
        if (next === "down") setState("rating");
      }}
      onSubmit={(payload) => {
        console.log("feedback submitted", payload);
        setState("submitted");
      }}
      onRatingCancel={() => {
        setState("idle");
        setValue(undefined);
      }}
      onUndo={() => {
        setState("idle");
        setValue(undefined);
        setReason("");
      }}
    />
  );
}
