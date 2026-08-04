"use client";

import { Ban } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { GenSettingsBar, GenSettingsItem } from "@/registry/super-ai/gen-settings-bar";
import { MediaPromptBar } from "@/registry/super-ai/media-prompt-bar";

/**
 * Live examples for media-prompt-bar.docs.tsx.
 *
 * This is a client sidecar, kept separate from the docs module on purpose:
 * component-docs.tsx (a Server Component) reads `docs.whatItIs`,
 * `docs.evidence`, etc. directly, so media-prompt-bar.docs.tsx has to stay
 * plain server-evaluable data — it cannot carry "use client" itself. Every
 * example lives here instead and crosses into the docs module as a
 * zero-prop element (e.g. `<LockedInPlace />`), so handlers like `onUnlock`
 * never have to be serialized across the server/client boundary — they're
 * created and consumed entirely inside this client module.
 */

function DemoSettings() {
  return (
    <GenSettingsBar aria-label="Generation settings">
      <GenSettingsItem>Veo 3.1 Fast</GenSettingsItem>
      <GenSettingsItem>16:9</GenSettingsItem>
      <GenSettingsItem>720p</GenSettingsItem>
    </GenSettingsBar>
  );
}

export function LockedInPlace() {
  return (
    <MediaPromptBar
      locked
      lockedTitle="You've hit your plan's limit"
      lockedDescription="Upgrade to keep generating."
      lockedCtaLabel="Upgrade"
      onUnlock={() => {}}
    />
  );
}

export function FloatingPresentation() {
  return <MediaPromptBar presentation="floating" settings={<DemoSettings />} cost={5} onSubmit={() => {}} />;
}

export function LockedAsSeparateBanner() {
  // Anti-pattern, hand-rolled on purpose: MediaPromptBar has no "banner
  // beside the bar" escape hatch for `locked` — the only supported shape is
  // swapping in the paywall CTA. This mimics what the banner would look
  // like instead, mounted as a sibling rather than in place.
  return (
    <div className="flex w-full flex-col gap-2">
      <div className="rounded-lg border border-dashed p-3 text-sm">
        <p className="font-medium">You&apos;ve hit your plan&apos;s limit</p>
        <p className="text-muted-foreground text-xs">Upgrade to keep generating.</p>
      </div>
      <MediaPromptBar settings={<DemoSettings />} cost={5} />
    </div>
  );
}

export function NodeEmbeddedWithNegativePromptAttempt() {
  // Anti-pattern, hand-rolled on purpose: passing `negativePrompt` while
  // `presentation="node-embedded"` is forced closed by the real component —
  // there is no prop combination that reproduces this. This mimics the
  // cramped result of keeping the toggle in a canvas-sized card anyway.
  return (
    <div className="flex max-w-sm flex-col gap-2 rounded-lg border bg-card p-2 text-sm">
      <Textarea
        aria-label="Prompt"
        placeholder="Describe what you want to generate…"
        className="min-h-16 resize-none border-none bg-transparent px-1 shadow-none"
      />
      <div className="flex flex-col gap-1 rounded-md border border-dashed p-2">
        <label className="text-foreground text-xs font-medium">Negative prompt</label>
        <Textarea
          aria-label="Negative prompt"
          placeholder="What to avoid…"
          className="min-h-12 resize-none border-none bg-transparent px-1 shadow-none"
        />
      </div>
      <div className="flex items-center justify-between gap-2">
        <Button type="button" variant="ghost" size="sm" disabled>
          <Ban aria-hidden className="size-3.5" />
          Add negative prompt
        </Button>
        <Button type="button" size="sm" disabled>
          Generate
        </Button>
      </div>
    </div>
  );
}
