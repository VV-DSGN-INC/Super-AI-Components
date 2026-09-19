import * as React from "react";

import { GATE_ROWS } from "@/content/system/gates";
import type { SystemFacts } from "@/lib/system-page";

const CODE = "bg-muted text-foreground rounded px-1 py-0.5 font-mono text-xs";

/** The roster in the order it runs. Driven by GATE_ROWS alone, so it cannot
 *  show a pipeline other than the one gates.test.ts holds to ci.yml. `facts` is
 *  accepted because every figure shares one signature. */
export function CiPipeline(_props: { facts: SystemFacts }) {
  return (
    <ol className="divide-y">
      {GATE_ROWS.map((row, index) => (
        <li
          key={row.ciStep}
          className="grid grid-cols-[2rem_1fr] gap-x-2 gap-y-1 py-2.5 sm:grid-cols-[2rem_1fr_auto]"
        >
          <span className="text-muted-foreground tabular-nums">{index + 1}</span>
          <div className="space-y-1">
            <p className="font-medium">{row.title}</p>
            <p>
              <code className={CODE}>{row.ciStep}</code>
            </p>
          </div>
          <p className="col-start-2 text-sm sm:col-start-3 sm:text-right">
            <span className="text-muted-foreground">{row.kind}</span>
            {row.product ? (
              <span className="ml-2 rounded border px-1.5 py-0.5 text-xs">exercises the product</span>
            ) : null}
          </p>
        </li>
      ))}
    </ol>
  );
}
