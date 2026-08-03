"use client";

import { ArrowRight, UserRound } from "lucide-react";
import * as React from "react";

import { SectionHeader } from "./section-header";
import { StatReadout, type StatReadoutItem } from "./stat-readout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type EscalationTrigger = "user" | "budget-exhausted" | "low-confidence" | "policy";
type EscalationState = "preview" | "queued" | "accepted" | "unavailable";

interface EscalationPacket {
  /** What the receiving human reads first. */
  summary: React.ReactNode;
  /** The resolved frame. Slot values with their sources — the Dialog contract's audit surface. */
  slots?: StatReadoutItem[];
  /** What the agent already tried, so the human does not repeat it. */
  attempted?: React.ReactNode[];
  /** The specific unblock being asked for. An escalation without an ask is a forward. */
  request?: React.ReactNode;
}

interface EscalationHandoffProps extends Omit<React.ComponentProps<"div">, "title"> {
  trigger: EscalationTrigger;
  state?: EscalationState;
  packet: EscalationPacket;
  /** Wait estimate for `queued`. Absent means unknown — say so rather than inventing one. */
  wait?: React.ReactNode;
  /** For `unavailable`: when people are actually back. Never fake "connecting you". */
  availability?: React.ReactNode;
  onSend?: () => void;
  /** The packet is the user's conversation. They are the one who knows if it is wrong. */
  onEditPacket?: () => void;
  onCancel?: () => void;
  /** The asynchronous path when nobody is on. */
  onLeaveMessage?: () => void;
}

// Four triggers, four messages. They are not interchangeable: "I asked for a
// person" and "policy requires a person" are different facts about the
// conversation, and flattening them into one string is how an escalation starts
// feeling like the product giving up.
const TRIGGER_COPY: Record<EscalationTrigger, string> = {
  user: "You asked to speak to someone.",
  "budget-exhausted": "We've gone back and forth on this a few times, so I'm bringing in a person.",
  "low-confidence": "I'm not confident enough about this one to act on it. Passing it to a person.",
  policy: "This needs a person to review before anything happens.",
};

function EscalationHandoff({
  trigger,
  state = "preview",
  packet,
  wait,
  availability,
  onSend,
  onEditPacket,
  onCancel,
  onLeaveMessage,
  className,
  ...props
}: EscalationHandoffProps) {
  return (
    <Card
      data-slot="escalation-handoff"
      data-trigger={trigger}
      data-state={state}
      className={cn("gap-4", className)}
      {...props}
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <UserRound className="size-4" />
          {state === "accepted" ? "Someone's with you" : "Handing this to a person"}
        </CardTitle>
        <p data-slot="escalation-handoff-reason" className="text-muted-foreground text-sm">
          {TRIGGER_COPY[trigger]}
        </p>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {state === "unavailable" ? (
          <p data-slot="escalation-handoff-availability" className="text-sm">
            {/* Honesty is the whole state. A queue that never drains is worse
                than a closed door, because the user waits in it. */}
            No one is available right now.
            {availability ? <> {availability}</> : null}
          </p>
        ) : null}

        {state === "queued" ? (
          <p data-slot="escalation-handoff-wait" className="text-sm">
            You&apos;re in the queue. {wait ?? "We don't have a wait time yet."}
          </p>
        ) : null}

        {/* The packet is visible before it is sent — it is the user's
            conversation being forwarded, which makes this the privacy control
            as much as the accuracy one. */}
        <section data-slot="escalation-handoff-packet" className="flex flex-col gap-2">
          <SectionHeader title="What they'll see" />
          <p className="text-sm">{packet.summary}</p>

          {packet.slots && packet.slots.length > 0 ? <StatReadout items={packet.slots} /> : null}

          {packet.attempted && packet.attempted.length > 0 ? (
            <div className="flex flex-col gap-1">
              <p className="text-muted-foreground text-xs font-medium">Already tried</p>
              <ul className="text-muted-foreground flex flex-col gap-0.5 text-xs">
                {packet.attempted.map((item, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <ArrowRight className="mt-0.5 size-3 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {packet.request ? (
            <p data-slot="escalation-handoff-request" className="text-sm font-medium">
              {packet.request}
            </p>
          ) : null}
        </section>
      </CardContent>

      {state === "preview" || state === "unavailable" ? (
        <CardFooter className="gap-2">
          {state === "preview" && onSend ? (
            <Button type="button" onClick={onSend}>
              Send to a person
            </Button>
          ) : null}
          {state === "unavailable" && onLeaveMessage ? (
            <Button type="button" onClick={onLeaveMessage}>
              Leave it for them
            </Button>
          ) : null}
          {onEditPacket ? (
            <Button type="button" variant="outline" onClick={onEditPacket}>
              Edit what&apos;s shared
            </Button>
          ) : null}
          {onCancel ? (
            <Button type="button" variant="ghost" onClick={onCancel}>
              Keep trying here
            </Button>
          ) : null}
        </CardFooter>
      ) : null}
    </Card>
  );
}

export { EscalationHandoff, TRIGGER_COPY };
export type { EscalationHandoffProps, EscalationPacket, EscalationState, EscalationTrigger };
