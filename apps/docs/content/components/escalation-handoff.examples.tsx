"use client";

import { EscalationHandoff } from "@/registry/super-ai/escalation-handoff";

/**
 * Live examples for escalation-handoff.docs.tsx.
 *
 * A client sidecar, kept separate from the docs module on purpose:
 * component-docs.tsx is a Server Component and reads `docs.whatItIs`,
 * `docs.evidence` and friends directly, so the docs module has to stay plain
 * server-evaluable data and cannot carry "use client" itself. Every rendering
 * of this card that shows anything worth looking at needs a handler — the
 * footer only renders the buttons whose callbacks exist — and a handler cannot
 * cross the server/client boundary, which is why these live here and arrive in
 * the docs module as zero-prop elements.
 */

const PACKET_SLOTS = [
  { label: "Order", value: "#48120" },
  { label: "Placed", value: "3 days ago" },
  { label: "Refund window", value: "Closed 1 day ago" },
];

export function RequestNamesTheUnblock() {
  return (
    <EscalationHandoff
      trigger="policy"
      state="preview"
      packet={{
        summary: "Customer wants a refund on order #48120, one day outside the refund window.",
        slots: PACKET_SLOTS,
        attempted: ["Checked the refund window", "Offered store credit — declined"],
        // The ask, not the problem: the human knows what to decide before
        // they finish reading.
        request: "Please approve a one-day exception, or tell them no in your own words.",
      }}
      onSend={() => {}}
      onEditPacket={() => {}}
    />
  );
}

export function PacketIsEditableBeforePreviewTravels() {
  return (
    <EscalationHandoff
      trigger="user"
      state="preview"
      packet={{
        summary: "Customer asked to speak to someone about a duplicate charge.",
        slots: [
          { label: "Charged", value: "£29.00 ×2" },
          { label: "Card", value: "•••• 6411" },
        ],
        request: "Confirm the duplicate and reverse one of the two charges.",
      }}
      // The packet is the user's own conversation being forwarded, so the
      // edit control is the privacy control as much as the accuracy one.
      onEditPacket={() => {}}
      onSend={() => {}}
      onCancel={() => {}}
    />
  );
}

export function UnavailableIsHonest() {
  return (
    <EscalationHandoff
      trigger="low-confidence"
      state="unavailable"
      // A real window, and a real asynchronous path out — not a queue that
      // will not drain until morning.
      availability="People are back at 9am on Monday."
      packet={{
        summary: "Customer's invoice does not match the plan they think they are on.",
        slots: [{ label: "Plan", value: "Team, annual" }],
        request: "Work out which plan they were actually billed for and correct it.",
      }}
      onLeaveMessage={() => {}}
      onCancel={() => {}}
    />
  );
}

export function FakeQueueNobodyWillAnswer() {
  // The wrong way: a queued handoff at 3 a.m., with an invented wait time to
  // make the wait look bounded. `queued` renders no footer at all, so there is
  // no cancel and no edit — the user is left in a queue with no way out of it
  // and no one at the other end.
  return (
    <EscalationHandoff
      trigger="budget-exhausted"
      state="queued"
      wait="Someone will be with you in about 2 minutes."
      packet={{
        summary: "Customer cannot upload a file over 2GB.",
        request: "Raise their upload limit, or say why it cannot be raised.",
      }}
      onCancel={() => {}}
      onEditPacket={() => {}}
    />
  );
}

export function SummaryRestatesTheReason() {
  // The wrong way: the summary repeats the trigger copy the card already
  // printed above it. The reason is for the user; the packet is a briefing for
  // the person receiving it, and repeating one inside the other costs the
  // human the only paragraph they will actually read.
  return (
    <EscalationHandoff
      trigger="low-confidence"
      state="preview"
      packet={{
        summary: "I'm not confident enough about this one to act on it, so I'm passing it to a person.",
        request: "Take a look.",
      }}
      onSend={() => {}}
    />
  );
}

export function AcceptedIsADeadEnd() {
  // The wrong way: `accepted` with nothing decided about what follows. The
  // card renders no footer in this state, so there is no way back to the
  // agent and no statement of what happens next — the thread simply stops.
  return (
    <EscalationHandoff
      trigger="user"
      state="accepted"
      packet={{
        summary: "Customer asked to speak to someone about a duplicate charge.",
        request: "Confirm the duplicate and reverse one of the two charges.",
      }}
      onCancel={() => {}}
    />
  );
}
