"use client";
import * as React from "react";

import { AutonomySelector, type AutonomyGrant } from "@/registry/super-ai/autonomy-selector";

/**
 * Live examples for autonomy-selector.docs.tsx. Client-side because revoking a
 * grant has to actually remove the row — a do/don't pair about revocation is
 * not worth much if the button does nothing.
 *
 * Every export takes zero props: the docs module references them as
 * `<Example />` and cannot pass anything across the server boundary.
 */

const GRANTS: AutonomyGrant[] = [
  { id: "g1", tool: "Search knowledge base", scope: "All indexed sources", granted: "3 days ago" },
  { id: "g2", tool: "Send email", scope: "Internal recipients only", granted: "yesterday" },
];

export function LedgerVisibleWhenEmpty() {
  return (
    <div className="w-full max-w-md">
      <AutonomySelector defaultLevel="ask" onRevoke={() => {}} />
    </div>
  );
}

export function RevokeWiredOnEveryGrant() {
  const [grants, setGrants] = React.useState(GRANTS);

  return (
    <div className="w-full max-w-md">
      <AutonomySelector
        defaultLevel="auto-reads"
        grants={grants}
        onRevoke={(id) => setGrants((g) => g.filter((x) => x.id !== id))}
      />
    </div>
  );
}

export function GrantsWithoutRevoke() {
  return (
    <div className="w-full max-w-md">
      <AutonomySelector defaultLevel="auto-reads" grants={GRANTS} />
    </div>
  );
}

export function UnscopedUndatedGrants() {
  return (
    <div className="w-full max-w-md">
      <AutonomySelector
        defaultLevel="auto-reads"
        grants={[{ id: "g1", tool: "Send email" }, { id: "g2", tool: "Create ticket" }]}
        onRevoke={() => {}}
      />
    </div>
  );
}
