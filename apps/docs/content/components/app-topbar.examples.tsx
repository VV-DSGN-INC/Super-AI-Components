"use client";

import { Cloud, Lock } from "lucide-react";

import { AppTopbar } from "@/registry/super-ai/app-topbar";
import { CaptureConsent } from "@/registry/super-ai/capture-consent";
import { PrivateSessionChip } from "@/registry/super-ai/private-session-notice";

/**
 * Live examples for app-topbar.docs.tsx.
 *
 * Kept separate from the docs module on purpose: component-docs.tsx (a
 * Server Component) reads `docs.whatItIs`, `docs.evidence`, etc. directly,
 * so app-topbar.docs.tsx has to stay plain server-evaluable data and cannot
 * itself carry "use client". Every live example lives here and crosses into
 * the docs module as a zero-prop element (e.g. `<SavedStateAsText />`).
 */

export function SavedStateAsText() {
  return (
    <AppTopbar
      context="document"
      title="Q3 Roadmap"
      breadcrumb={[{ label: "Projects" }, { label: "Q3 Roadmap" }]}
      savedLabel="Last saved 5 days ago"
    />
  );
}

export function EditorContextLeadsWithZoomAndHistory() {
  return <AppTopbar context="editor" title="Untitled scene" zoomLabel="100%" />;
}

export function SavedStateIconOnly() {
  return (
    <div className="flex h-12 w-full items-center justify-between gap-3 border-b bg-background px-3 text-sm">
      <span className="font-medium">Q3 Roadmap</span>
      {/* Anti-pattern: a cloud glyph only raises the question "saved when?" —
          it never answers it the way text does. */}
      <Cloud aria-label="Saved" className="text-muted-foreground size-4" />
    </div>
  );
}

export function PrivacyChipColorOnly() {
  return (
    <div className="flex h-12 w-full items-center gap-3 border-b bg-background px-3 text-sm">
      <span className="font-medium">Q3 Roadmap</span>
      {/* Anti-pattern: a bare coloured dot with no label — invisible to
          colorblind users and screen readers alike. */}
      <span aria-hidden="true" className="bg-primary size-2.5 rounded-full" />
    </div>
  );
}

export function PrivacyChipWithIconAndLabel() {
  return (
    <AppTopbar
      context="document"
      title="Q3 Roadmap"
      breadcrumb={[{ label: "Projects" }, { label: "Q3 Roadmap" }]}
      privacy={{ label: "Private", icon: <Lock /> }}
    />
  );
}

/**
 * The privacy slot's vocabulary comes from N15 and N13, not from this bar.
 * The host hands N15's `PrivateSessionChip` in as an element, with N13's
 * `compact` recording chip beside it in a fragment while capture runs.
 */
export function PrivacySlotFromPrivateSession() {
  return (
    <AppTopbar
      context="document"
      title="Q3 Roadmap"
      breadcrumb={[{ label: "Projects" }, { label: "Q3 Roadmap" }]}
      privacy={
        <>
          <PrivateSessionChip state="active" />
          <CaptureConsent form="compact" state="recording" />
        </>
      }
    />
  );
}
