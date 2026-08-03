"use client";
import { CitationRef } from "@/registry/super-ai/citation-ref";

export default function CitationRefDemo() {
  return (
    <p className="max-w-md text-sm">
      Out-of-network imaging requires prior authorization
      <CitationRef
        label="1"
        source="Benefits policy 2026 · §4.2"
        quote="Imaging performed outside the network requires prior authorization except in emergencies."
        onJumpToSource={() => {}}
      />{" "}
      and the exception threshold is reviewed annually
      <CitationRef label="2" state="loading" />, though the regional addendum is no longer reachable
      <CitationRef label="3" state="unresolved" />.
    </p>
  );
}
