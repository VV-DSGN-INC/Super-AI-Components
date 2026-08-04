"use client";

import { DisclaimerNote } from "@/registry/super-ai/disclaimer-note";

/**
 * Live examples for disclaimer-note.docs.tsx.
 *
 * Client sidecar, kept separate from the docs module on purpose:
 * component-docs.tsx (a Server Component) reads `docs.whatItIs`,
 * `docs.evidence`, etc. directly, so disclaimer-note.docs.tsx has to stay
 * plain server-evaluable data — it cannot carry "use client" itself, because
 * Next.js turns "use client" exports into opaque client references, and a
 * plain object read through one of those comes back with every field
 * undefined. Every example lives here instead and crosses into the docs
 * module as a zero-prop element (e.g. `<PermanentInCard />`).
 */

export function PermanentInCard() {
  return (
    <div className="w-72 rounded-lg border">
      <div className="p-3 text-sm">Generated summary of the uploaded report.</div>
      <DisclaimerNote variant="in-card" link={{ label: "Learn how sources are used", href: "#" }} />
    </div>
  );
}

export function ReadableUnderComposer() {
  return (
    <div className="w-72 rounded-lg border">
      <div className="text-muted-foreground px-3 py-2 text-sm">Message the assistant…</div>
      <DisclaimerNote variant="under-composer" />
    </div>
  );
}

export function FaintUnreadableText() {
  return (
    <div className="w-72 rounded-lg border p-3">
      <p className="text-sm">Generated response.</p>
      {/* Don't: text-muted-foreground on bg-muted is a 4.34:1 measured pairing
          in this token set — under the 4.5:1 minimum, and exactly the trap
          disclaimer text falls into by instinct ("it's just a footnote"). */}
      <p className="bg-muted text-muted-foreground mt-2 rounded px-2 py-1 text-xs">
        AI can make mistakes. Check important info.
      </p>
    </div>
  );
}

export function DismissibleWithCloseButton() {
  return (
    <div className="flex w-72 items-start justify-between gap-2 rounded-lg border p-3 text-xs">
      <span>AI can make mistakes. Check important info.</span>
      {/* Don't: a close control turns a permanent disclosure into one the
          user can make disappear after seeing it once. */}
      <button type="button" aria-label="Dismiss" className="text-muted-foreground shrink-0">
        ×
      </button>
    </div>
  );
}
