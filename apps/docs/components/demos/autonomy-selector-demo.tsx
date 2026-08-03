"use client";
import * as React from "react";

import { AutonomySelector, type AutonomyGrant } from "@/registry/super-ai/autonomy-selector";

const INITIAL: AutonomyGrant[] = [
  { id: "g1", tool: "Search knowledge base", scope: "All indexed sources", granted: "3 days ago" },
  { id: "g2", tool: "Send email", scope: "Internal recipients only", granted: "yesterday" },
  { id: "g3", tool: "Create ticket", scope: "Service desk", granted: "2 hours ago" },
];

export default function AutonomySelectorDemo() {
  const [grants, setGrants] = React.useState(INITIAL);

  return (
    <div className="w-full max-w-md">
      <AutonomySelector
        defaultLevel="auto-reads"
        grants={grants}
        onRevoke={(id) => setGrants((g) => g.filter((x) => x.id !== id))}
        denials={[
          { id: "d1", tool: "Delete records", reason: "Never automated" },
          { id: "d2", tool: "Approve payment", reason: "Requires two people" },
        ]}
      />
    </div>
  );
}
