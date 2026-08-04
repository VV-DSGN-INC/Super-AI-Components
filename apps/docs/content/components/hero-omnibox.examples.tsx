"use client";

import { ArrowUp, Paperclip } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { HeroOmnibox } from "@/registry/super-ai/hero-omnibox";

/**
 * Live examples for hero-omnibox.docs.tsx.
 *
 * This is a client sidecar, kept separate from the docs module on purpose:
 * component-docs.tsx (a Server Component) reads `docs.whatItIs`,
 * `docs.evidence`, etc. directly, so hero-omnibox.docs.tsx has to stay plain
 * server-evaluable data — it cannot carry "use client" itself. Every example
 * lives here instead and crosses into the docs module as a zero-prop
 * element (e.g. `<LockedInPlace />`), so handlers like `onUnlock` never have
 * to be serialized across the server/client boundary — they're created and
 * consumed entirely inside this client module.
 */

const MODELS = [
  { value: "veo-3.1", label: "Veo 3.1" },
  { value: "sora-2", label: "Sora 2" },
];

export function LockedInPlace() {
  return (
    <HeroOmnibox
      state="locked"
      lockedTitle="You've hit your plan's limit"
      lockedDescription="Upgrade to keep generating."
      lockedCtaLabel="Upgrade"
      onUnlock={() => {}}
    />
  );
}

export function FullyComposedField() {
  return (
    <HeroOmnibox
      modes={[
        { value: "ask", label: "Ask" },
        { value: "build", label: "Build" },
      ]}
      mode="build"
      models={MODELS}
      model="veo-3.1"
      cost={5}
      onSubmit={() => {}}
    />
  );
}

export function LockedAsSeparateBanner() {
  return (
    <div className="flex w-full max-w-2xl flex-col gap-2">
      <div className="rounded-lg border border-dashed p-3 text-sm">
        <p className="font-medium">You&apos;ve hit your plan&apos;s limit</p>
        <p className="text-muted-foreground text-xs">Upgrade to keep generating.</p>
      </div>
      <HeroOmnibox />
    </div>
  );
}

export function LockedByDisabling() {
  // Anti-pattern, hand-rolled on purpose: HeroOmnibox has no "disable the
  // field" escape hatch for `locked` — the only supported shape is swapping
  // in the paywall CTA. This mimics what disabling would look like instead.
  return (
    <div className="flex w-full max-w-2xl flex-col gap-2 rounded-2xl border bg-card p-2 opacity-50">
      <Textarea
        disabled
        placeholder="What can I help you with?"
        aria-label="What can I help you with?"
        className="min-h-20 resize-none border-none bg-transparent px-1 shadow-none"
      />
      <div className="flex items-center justify-between gap-2">
        <Button type="button" variant="ghost" size="icon-sm" aria-label="Attach file" disabled>
          <Paperclip aria-hidden />
        </Button>
        <Button type="button" size="icon-sm" aria-label="Send message" disabled>
          <ArrowUp aria-hidden />
        </Button>
      </div>
    </div>
  );
}
