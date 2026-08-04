"use client";

import { Textarea } from "@/components/ui/textarea";
import { QuoteReply } from "@/registry/super-ai/quote-reply";

/**
 * Live examples for quote-reply.docs.tsx.
 *
 * This is a client sidecar, kept separate from the docs module on purpose:
 * component-docs.tsx (a Server Component) reads `docs.whatItIs`,
 * `docs.evidence`, etc. directly, so quote-reply.docs.tsx has to stay plain
 * server-evaluable data — it cannot carry "use client" itself, because
 * Next.js turns "use client" exports into opaque client references, and a
 * plain object read through one of those comes back with every field
 * undefined. Every example lives here instead and crosses into the docs
 * module as a zero-prop element (e.g. `<AnchorIndependentOfExcerpt />`), so a
 * prop like `onRemove` never has to be serialized across the server/client
 * boundary — it's created and consumed entirely inside this client module.
 */

export function AnchorIndependentOfExcerpt() {
  return (
    <QuoteReply
      source="text-range"
      excerpt="the negative prompt should stay in sync with the reference strip"
      anchor="¶4"
      onRemove={() => {}}
    />
  );
}

export function QuoteSiblingToDraft() {
  return (
    <div className="flex w-72 flex-col gap-2 rounded-lg border p-2">
      <QuoteReply
        source="timeline-range"
        excerpt="so that's the part we want to cut"
        anchor="0:42–0:51"
        onRemove={() => {}}
      />
      <Textarea placeholder="Reply to this moment…" defaultValue="Can we tighten this section?" />
    </div>
  );
}

export function OverlongExcerpt() {
  return (
    <QuoteReply
      source="text-range"
      excerpt="the model needs the negative prompt to stay in sync with the reference strip at all times, otherwise the render drifts from what the team actually approved in the last review pass and someone has to catch it after the fact"
      anchor="¶4"
      onRemove={() => {}}
    />
  );
}

export function VagueAnchor() {
  return <QuoteReply source="table-cell" excerpt="$42,300" anchor="here" onRemove={() => {}} />;
}
