import * as React from "react";

import { InlineProse } from "@/components/component-docs";
import { HARNESS_PARTS } from "@/content/system/figures";
import { resolveFacts, type SystemFacts } from "@/lib/system-page";

/** The four parts of the harness, each with what this repository puts in it. */
export function HarnessParts({ facts }: { facts: SystemFacts }) {
  return (
    <ol className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
      {HARNESS_PARTS.map((part, index) => (
        <li key={part.id} className="space-y-2 border-t pt-3">
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            <span className="tabular-nums">{index + 1}</span> · {part.label}
          </p>
          <p className="font-medium">{part.job}</p>
          <ul className="space-y-1.5 text-sm leading-6">
            {part.items.map((item) => (
              <li key={item}>
                <InlineProse text={resolveFacts(item, facts)} />
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ol>
  );
}
