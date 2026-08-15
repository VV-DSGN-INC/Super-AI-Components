"use client";

import { useState } from "react";

import type { Slot } from "@/registry/super-ai/slot-summary";
import { SlotSummary } from "@/registry/super-ai/slot-summary";

/**
 * Live examples for slot-summary.docs.tsx.
 *
 * Client sidecar, kept separate from the docs module on purpose:
 * component-docs.tsx (a Server Component) reads `docs.whatItIs`,
 * `docs.evidence`, etc. directly, so slot-summary.docs.tsx has to stay plain
 * server-evaluable data — it cannot carry "use client" itself. Every example
 * lives here and crosses into the docs module as a zero-prop element (e.g.
 * `<CorrectionEditsInPlace />`), so handlers like `onCorrect` and `onConfirm`
 * never have to serialize across the server/client boundary.
 */

/** The frame an assistant resolves before scheduling an outbound message. */
const BASE_SLOTS: Slot[] = [
  { id: "recipient", label: "Recipient", value: "design-team (14 people)", source: "retrieved", required: true },
  { id: "message", label: "Message", value: "Standup moves to 10:00 from Monday", source: "stated", required: true },
  { id: "send-at", label: "Send at", value: "Tomorrow, 9:00 AM", source: "inferred", confidence: "low" },
  { id: "channel", label: "Channel", value: "Email", source: "defaulted" },
];

export function CorrectionEditsInPlace() {
  const [slots, setSlots] = useState<Slot[]>(BASE_SLOTS);

  return (
    <SlotSummary
      slots={slots}
      // Right: the correction resolves on the slot it corrects. Nothing here
      // rewinds the conversation or re-asks for the three slots that were
      // already right.
      onCorrect={(id) =>
        setSlots((current) =>
          current.map((slot) =>
            slot.id === id
              ? { ...slot, value: "Monday, 8:30 AM", source: "stated", confidence: undefined }
              : slot,
          ),
        )
      }
      confirmLabel="Send to 14 people"
      onConfirm={() => {}}
      onCancel={() => {}}
    />
  );
}

export function MissingRequiredBlocksConfirm() {
  // Right: the slot that could not be filled is still a row, carrying its own
  // ask. Confirm stays blocked and the count says how many are outstanding.
  const slots: Slot[] = [
    { id: "recipient", label: "Recipient", source: "retrieved", required: true },
    { id: "message", label: "Message", value: "Standup moves to 10:00 from Monday", source: "stated", required: true },
    { id: "channel", label: "Channel", value: "Email", source: "defaulted" },
  ];

  return (
    <SlotSummary
      slots={slots}
      onCorrect={() => {}}
      confirmLabel="Send to 14 people"
      onConfirm={() => {}}
      onCancel={() => {}}
    />
  );
}

export function SilentlyDropsUnfilledSlot() {
  // Wrong: the recipient could not be resolved, so the caller filtered the row
  // out of `slots` entirely. The summary now looks complete, Confirm is live,
  // and the one thing the user needed to catch is the one thing not on screen.
  const slots: Slot[] = [
    { id: "message", label: "Message", value: "Standup moves to 10:00 from Monday", source: "stated", required: true },
    { id: "send-at", label: "Send at", value: "Tomorrow, 9:00 AM", source: "inferred" },
    { id: "channel", label: "Channel", value: "Email", source: "defaulted" },
  ];

  return (
    <SlotSummary slots={slots} onCorrect={() => {}} confirmLabel="Send" onConfirm={() => {}} onCancel={() => {}} />
  );
}

export function ConfirmSaysOk() {
  // Wrong: the button is the last thing between a resolved frame and a side
  // effect that reaches 14 inboxes, and it says nothing about what it will do.
  // `confirmLabel` defaults to "Confirm" precisely so that leaving it unset is
  // visible as a decision not yet made.
  return (
    <SlotSummary slots={BASE_SLOTS} onCorrect={() => {}} onConfirm={() => {}} onCancel={() => {}} />
  );
}
