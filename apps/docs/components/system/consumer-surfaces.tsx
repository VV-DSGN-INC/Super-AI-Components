import * as React from "react";

import { InlineProse } from "@/components/component-docs";
import { CONSUMER_SURFACES } from "@/content/system/figures";
import { resolveFacts, type SystemFacts } from "@/lib/system-page";

/** What an agent in a consumer's repository meets, in retrieval order. */
export function ConsumerSurfaces({ facts }: { facts: SystemFacts }) {
  return (
    <ol className="grid gap-x-8 gap-y-8 md:grid-cols-3">
      {CONSUMER_SURFACES.map((surface, index) => (
        <li key={surface.id} className="space-y-2">
          <p className="font-medium">
            <span className="text-muted-foreground mr-2 tabular-nums">{index + 1}</span>
            {surface.label}
          </p>
          <p className="text-muted-foreground text-sm leading-6">{surface.when}</p>
          <p className="text-sm leading-6">
            <InlineProse text={resolveFacts(surface.what, facts)} />
          </p>
          <p className="text-sm leading-6">
            <InlineProse text={resolveFacts(surface.artifact, facts)} />
          </p>
        </li>
      ))}
    </ol>
  );
}
