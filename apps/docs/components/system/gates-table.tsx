import * as React from "react";

import { InlineProse } from "@/components/component-docs";
import type { GateRow } from "@/content/system/gates";

const CODE = "bg-muted text-foreground rounded px-1 py-0.5 font-mono text-xs";

/** The gate roster. A list and not a table: the cells hold sentences, and the
 *  two columns collapse to one on a narrow screen. */
export function GatesTable({ rows }: { rows: GateRow[] }) {
  return (
    <ol data-slot="system-gates" className="divide-y border-y wrap-anywhere">
      {rows.map((row, index) => (
        <li key={row.ciStep} className="grid gap-x-8 gap-y-2 py-4 md:grid-cols-[13rem_1fr]">
          <div className="space-y-1.5">
            <p className="font-medium">
              <span className="text-muted-foreground mr-2 tabular-nums">{index + 1}</span>
              {row.title}
            </p>
            <p>
              <code className={CODE}>{row.ciStep}</code>
            </p>
          </div>
          <div className="space-y-2 text-sm leading-6">
            <p>
              <InlineProse text={row.protects} />
            </p>
            <ul className="space-y-1">
              {row.checks.map((check) => (
                <li key={check.file}>
                  <code className={CODE}>{check.file}</code>{" "}
                  <span className="text-muted-foreground">
                    <InlineProse text={check.protects} />
                  </span>
                </li>
              ))}
            </ul>
            {row.ledgers?.length ? (
              <p>
                <span className="font-medium">Ratchets: </span>
                {row.ledgers.map((ledger, ledgerIndex) => (
                  <React.Fragment key={ledger}>
                    {ledgerIndex > 0 ? ", " : null}
                    <code className={CODE}>{ledger}</code>
                  </React.Fragment>
                ))}
              </p>
            ) : null}
            {row.blindSpot ? (
              <p role="note" className="border-l-2 pl-3">
                <span className="font-medium">Does not see: </span>
                <InlineProse text={row.blindSpot} />
              </p>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
