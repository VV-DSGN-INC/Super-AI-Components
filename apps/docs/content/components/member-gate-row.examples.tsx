"use client";

import { Video } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { MemberGateRow, type MemberGateRowState } from "@/registry/super-ai/member-gate-row";

/**
 * Live examples for member-gate-row.docs.tsx.
 *
 * This is a client sidecar, kept separate from the docs module on purpose:
 * component-docs.tsx (a Server Component) reads `docs.whatItIs`,
 * `docs.evidence`, etc. directly, so member-gate-row.docs.tsx has to stay
 * plain server-evaluable data — it cannot carry "use client" itself. Every
 * example with a handler (onCheckedChange, onRequestUpgrade, onUpgrade,
 * onDismissUpsell) lives here instead and crosses into the docs module as a
 * zero-prop element (e.g. `<RevealsInlineUpsell />`).
 */

export function StaysVisibleWithTierBadge() {
  return (
    <MemberGateRow
      icon={<Video className="size-4" aria-hidden />}
      label="4K export"
      state="locked"
      tier="Pro"
    />
  );
}

export function RevealsInlineUpsell() {
  const [state, setState] = useState<MemberGateRowState>("locked");
  return (
    <MemberGateRow
      icon={<Video className="size-4" aria-hidden />}
      label="4K export"
      state={state}
      tier="Pro"
      onRequestUpgrade={() => setState("inline-upsell")}
      upsellDescription="4K export is a Pro feature."
      onUpgrade={() => setState("unlocked")}
      onDismissUpsell={() => setState("locked")}
    />
  );
}

export function TrialAvailableIsDistinct() {
  const [checked, setChecked] = useState(false);
  return (
    <MemberGateRow
      label="Voice cloning"
      state="trial-available"
      trialLabel="Free trial ×1"
      checked={checked}
      onCheckedChange={setChecked}
    />
  );
}

export function HiddenBehindEmptyBox() {
  return (
    <div className="flex min-h-14 w-full items-center gap-3 rounded-lg border border-dashed px-3 py-2 text-sm">
      <span className="bg-muted flex size-8 shrink-0 items-center justify-center rounded-md text-lg">?</span>
      <span className="text-foreground/60 flex-1">Some features are only available on paid plans.</span>
    </div>
  );
}

export function PadlockIconOnlyLock() {
  return (
    <div className="flex min-h-14 w-full items-center gap-3 rounded-lg px-3 py-2 text-sm opacity-50">
      <Video className="size-4" aria-hidden />
      <span className="flex-1">4K export</span>
      <span aria-hidden className="text-base">
        🔒
      </span>
    </div>
  );
}

export function ColourOnlyDimming() {
  return (
    <div className="flex min-h-14 w-full items-center gap-3 rounded-lg px-3 py-2 text-sm opacity-40">
      <Video className="size-4" aria-hidden />
      <span className="flex-1">4K export</span>
      <Switch checked={false} disabled aria-label="4K export" />
    </div>
  );
}

export function TierBadgeShowsWhatExists() {
  return (
    <div className="flex min-h-14 w-full items-center gap-3 rounded-lg px-3 py-2 text-sm">
      <Video className="size-4" aria-hidden />
      <span className="flex-1">4K export</span>
      <Badge variant="secondary">Pro</Badge>
    </div>
  );
}
