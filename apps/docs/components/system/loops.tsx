import * as React from "react";

import { InlineProse } from "@/components/component-docs";
import { AUDIT_LOOP, BUILD_LOOP, REJECTION_EDGE } from "@/content/system/figures";
import { resolveFacts, type SystemFacts } from "@/lib/system-page";

/** The build loop as it runs, the edge that turns a rejection into a rule, and
 *  the audit loop drawn as what it is today: absent. */
export function Loops({ facts }: { facts: SystemFacts }) {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <p className="text-muted-foreground text-sm">Build loop</p>
        <ol className="grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
          {BUILD_LOOP.map((step, index) => (
            <li key={step.id} className="space-y-1">
              <p className="font-medium">
                <span className="text-muted-foreground mr-2 tabular-nums">{index + 1}</span>
                {step.label}
              </p>
              <p className="text-sm leading-6">
                <InlineProse text={resolveFacts(step.detail, facts)} />
              </p>
            </li>
          ))}
        </ol>
        <p role="note" className="border-l-2 pl-3 text-sm leading-6">
          <InlineProse text={resolveFacts(REJECTION_EDGE, facts)} />
        </p>
      </div>
      {/* A dashed hairline, not a dashed box: the figure frame is already the one
          container, and a box inside it would be a card in a card. */}
      <div className="space-y-2 border-t border-dashed pt-6">
        <p className="text-muted-foreground text-sm">{AUDIT_LOOP.label}</p>
        <p className="font-medium">{AUDIT_LOOP.status}</p>
        <p className="text-sm leading-6">
          <InlineProse text={resolveFacts(AUDIT_LOOP.detail, facts)} />
        </p>
      </div>
    </div>
  );
}
