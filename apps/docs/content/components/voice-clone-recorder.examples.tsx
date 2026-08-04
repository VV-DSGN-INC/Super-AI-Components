"use client";

import { Check } from "lucide-react";

import { VoiceCloneRecorder } from "@/registry/super-ai/voice-clone-recorder";

/**
 * Live examples for voice-clone-recorder.docs.tsx.
 *
 * This is a client sidecar, kept separate from the docs module on purpose:
 * component-docs.tsx (a Server Component) reads `docs.whatItIs`,
 * `docs.evidence`, etc. directly, so voice-clone-recorder.docs.tsx has to
 * stay plain server-evaluable data — it cannot carry "use client" itself.
 * Every example lives here instead and crosses into the docs module as a
 * zero-prop element (e.g. `<GateBehindCheckbox />`).
 *
 * The two "Don't" examples are static mockups, not the real component
 * misused — the real VoiceCloneRecorder structurally can't skip the consent
 * gate or fire onConsent from an unchecked box, so there is no "wrong" prop
 * combination to demonstrate. These illustrate what the anti-pattern would
 * look like if a team reimplemented the flow by hand instead of composing
 * this component.
 */

const SCRIPT = ["The quick brown fox jumps over the lazy dog near the riverbank."];

export function GateBehindCheckbox() {
  return (
    <VoiceCloneRecorder
      script={SCRIPT}
      state="consent-capture"
      speakerName="Jamie"
      onConsent={() => {}}
      onConsentCancel={() => {}}
    />
  );
}

export function AnnouncedMeterWithText() {
  return <VoiceCloneRecorder script={SCRIPT} state="level-metering" level={58} elapsedLabel="0:12" />;
}

export function SkipStraightToClone() {
  return (
    <div className="border-destructive/40 bg-destructive/5 flex flex-col gap-2 rounded-lg border p-3 text-sm">
      <div className="flex items-center gap-2">
        <span className="bg-primary text-primary-foreground rounded-md px-2.5 py-1 text-xs font-medium">
          <Check aria-hidden className="mr-1 inline size-3" />
          Use this take
        </span>
        <span aria-hidden className="text-muted-foreground">
          →
        </span>
        <span className="bg-secondary text-secondary-foreground rounded-md px-2.5 py-1 text-xs font-medium">
          Clone voice now
        </span>
      </div>
      <p className="text-muted-foreground text-xs">
        Wrong: a hand-rolled &quot;accept take&quot; handler that calls the cloning API directly. There is no
        step in between for the speaker to actually consent.
      </p>
    </div>
  );
}

export function ColorOnlyRecordingIndicator() {
  return (
    <div className="flex flex-col gap-2 rounded-lg border p-3 text-sm">
      <div className="flex items-center gap-2">
        <span aria-hidden className="bg-destructive size-2.5 rounded-full" />
      </div>
      <p className="text-muted-foreground text-xs">
        Wrong: a red dot with no accompanying text. Nothing here is announced to a screen reader, and a
        colourblind or low-vision user has no way to confirm recording is active.
      </p>
    </div>
  );
}
