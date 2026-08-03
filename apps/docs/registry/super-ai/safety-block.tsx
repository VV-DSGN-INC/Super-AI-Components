"use client";

import { ShieldAlert } from "lucide-react";
import * as React from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SafetyBlockVariant = "input-blocked" | "output-blocked";

interface SafetyBlockProps extends Omit<React.ComponentProps<"div">, "title"> {
  /** Whether the request was stopped, or the answer was. These are different events. */
  variant: SafetyBlockVariant;
  /** The policy that fired. A block with no named source is indistinguishable from a bug. */
  policy: React.ReactNode;
  /** The span that triggered the block. Omit when quoting it is itself the harm. */
  fragment?: React.ReactNode;
  /** Blur `fragment` until the reader asks for it. Reveal is intent, never hover. */
  sensitive?: boolean;
  /** The compliant path. A refusal without an exit is the failure state, not the guardrail. */
  alternatives?: React.ReactNode;
}

// Copy differs per variant because the two events tell the user different things
// about what to do next: one is "rephrase", the other is "the answer exists but
// you are not getting it here".
const COPY: Record<SafetyBlockVariant, { title: string; body: string }> = {
  "input-blocked": {
    title: "Request blocked",
    body: "This request wasn't sent.",
  },
  "output-blocked": {
    title: "Response withheld",
    body: "The request ran, but the response can't be shown.",
  },
};

function SafetyBlock({
  variant,
  policy,
  fragment,
  sensitive = false,
  alternatives,
  className,
  ...props
}: SafetyBlockProps) {
  const [revealed, setRevealed] = React.useState(false);
  const copy = COPY[variant];

  return (
    <Alert
      // Not `alert`: this is not urgent, and an assertive live region would
      // interrupt a screen-reader user mid-sentence on every refusal.
      role="note"
      data-slot="safety-block"
      data-variant={variant}
      // The border and system icon are the point: a refusal delivered in the
      // assistant's own voice reads as the model being evasive rather than as a
      // policy firing. This must look like the system, not the assistant.
      className={cn("border-destructive/40 bg-destructive/5", className)}
      {...props}
    >
      <ShieldAlert className="text-destructive size-4" />
      <AlertTitle data-slot="safety-block-title">{copy.title}</AlertTitle>
      {/* AlertDescription is a plain block, so the parts must be stacked
          explicitly — the policy name running inline into the body copy reads
          as one sentence and buries the thing the user needs to see. */}
      <AlertDescription className="flex flex-col items-start gap-1.5">
        <span>{copy.body}</span>
        <span data-slot="safety-block-policy" className="text-foreground text-xs font-medium">
          {policy}
        </span>
        {fragment ? (
          <span className="flex flex-col gap-1">
            <span
              data-slot="safety-block-fragment"
              aria-hidden={sensitive && !revealed ? true : undefined}
              className={cn(
                "border-border border-l-2 pl-2 text-xs italic",
                sensitive && !revealed && "blur-xs select-none",
              )}
            >
              {fragment}
            </span>
            {sensitive && !revealed ? (
              <Button
                type="button"
                variant="link"
                size="sm"
                className="h-auto self-start p-0 text-xs"
                onClick={() => setRevealed(true)}
              >
                Show blocked text
              </Button>
            ) : null}
          </span>
        ) : null}
        {alternatives ? (
          <span data-slot="safety-block-alternatives" className="text-xs">
            {alternatives}
          </span>
        ) : null}
      </AlertDescription>
    </Alert>
  );
}

export { SafetyBlock };
export type { SafetyBlockProps, SafetyBlockVariant };
