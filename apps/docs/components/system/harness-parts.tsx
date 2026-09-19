import * as React from "react";

import { InlineProse } from "@/components/component-docs";
import { HARNESS_PARTS } from "@/content/system/figures";
import { resolveFacts, type SystemFacts } from "@/lib/system-page";

/** The four parts of the harness, each with what this repository puts in it.
 *  Each cell is titled the way a roster row is: a muted number, then the name
 *  at the medium weight. The definition is the muted line. The specifics, which
 *  are the point, stay in the foreground colour. */
export function HarnessParts({ facts }: { facts: SystemFacts }) {
  return (
    <ol className="grid gap-x-8 gap-y-8 sm:grid-cols-2">
      {HARNESS_PARTS.map((part, index) => (
        <li key={part.id} className="space-y-2">
          <p className="font-medium">
            <span className="text-muted-foreground mr-2 tabular-nums">{index + 1}</span>
            {part.label}
          </p>
          <p className="text-muted-foreground text-sm leading-6">{part.job}</p>
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
