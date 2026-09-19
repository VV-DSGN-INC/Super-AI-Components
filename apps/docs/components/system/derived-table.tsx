import * as React from "react";

import { InlineProse } from "@/components/component-docs";
import type { DerivedRow } from "@/content/system/derived";

const CODE = "bg-muted text-foreground rounded px-1 py-0.5 font-mono text-xs";

/** What is generated from what. A list, for the same reason GatesTable is. */
export function DerivedTable({ rows }: { rows: DerivedRow[] }) {
  return (
    <ul data-slot="system-derived" className="divide-y border-y [overflow-wrap:anywhere]">
      {rows.map((row) => (
        <li key={row.source} className="space-y-2 py-4 text-sm leading-6">
          <p>
            <InlineProse text={row.note} />
          </p>
          <dl className="grid gap-x-6 gap-y-1 md:grid-cols-[7rem_1fr]">
            <dt className="text-muted-foreground">Source</dt>
            <dd>
              <code className={CODE}>{row.source}</code>
            </dd>
            <dt className="text-muted-foreground">Output</dt>
            <dd className="space-y-1">
              {row.derived.map((path) => (
                <div key={path}>
                  <code className={CODE}>{path}</code>
                </div>
              ))}
              {row.committed ? null : <div className="text-muted-foreground">Not committed.</div>}
            </dd>
            <dt className="text-muted-foreground">Written by</dt>
            <dd>
              <code className={CODE}>{row.command}</code>
            </dd>
            <dt className="text-muted-foreground">Held by</dt>
            <dd>
              <code className={CODE}>{row.heldBy}</code>
            </dd>
          </dl>
        </li>
      ))}
    </ul>
  );
}
