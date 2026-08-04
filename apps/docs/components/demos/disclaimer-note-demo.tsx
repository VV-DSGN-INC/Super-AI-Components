"use client";

import { DisclaimerNote } from "@/registry/super-ai/disclaimer-note";

export default function DisclaimerNoteDemo() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-6">
      <div className="space-y-2">
        <p className="text-muted-foreground text-xs font-medium">Under composer</p>
        <div className="space-y-0 rounded-lg border">
          <div className="text-muted-foreground px-3 py-2 text-sm">Message the assistant…</div>
          <DisclaimerNote variant="under-composer" />
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-muted-foreground text-xs font-medium">In card</p>
        <div className="rounded-lg border">
          <div className="p-3 text-sm">Generated summary of the uploaded report.</div>
          <DisclaimerNote
            variant="in-card"
            link={{ label: "Learn how sources are used", href: "#" }}
          />
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-muted-foreground text-xs font-medium">Inline</p>
        <div className="flex items-center gap-2 text-sm">
          <span>Response generated 2m ago</span>
          <span aria-hidden="true">·</span>
          <DisclaimerNote variant="inline">May be inaccurate.</DisclaimerNote>
        </div>
      </div>
    </div>
  );
}
