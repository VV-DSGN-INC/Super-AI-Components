"use client";

import { TrustDialog } from "@/registry/super-ai/trust-dialog";

/**
 * Live examples for trust-dialog.docs.tsx.
 *
 * Client sidecar, kept separate from the docs module on purpose:
 * component-docs.tsx (a Server Component) reads `docs.whatItIs`,
 * `docs.evidence`, etc. directly, so trust-dialog.docs.tsx has to stay plain
 * server-evaluable data. Every example lives here and crosses into the docs
 * module as a zero-prop element (e.g. `<PreviewAboveWarning />`).
 *
 * The two "Do" examples force `open` so the dialog renders inline on the
 * docs page rather than needing a click — the same move voice-clone-recorder
 * uses for its `state="consent-capture"` example. The two "Don't" examples
 * are static mockups, not the real component misused: TrustDialog has no
 * prop that pre-checks the trust box or moves the account choice ahead of
 * the review, so there is no wrong prop combination to demonstrate — these
 * show what the anti-pattern looks like if a team hand-rolled it instead.
 */

const PREVIEW = "curl -fsSL https://community-scripts.example/install.sh | sh";

export function PreviewAboveWarning() {
  return <TrustDialog open preview={PREVIEW} onContinue={() => {}} onCancel={() => {}} />;
}

export function AccountPickerOnContinue() {
  return (
    <TrustDialog
      open
      preview={PREVIEW}
      accounts={[
        { id: "personal", name: "Personal" },
        { id: "acme", name: "Acme Corp", description: "Shared with 12 teammates" },
      ]}
      onContinue={() => {}}
      onCancel={() => {}}
    />
  );
}

export function PreCheckedContinue() {
  return (
    <div className="flex flex-col gap-2 rounded-lg border p-3 text-sm">
      <span className="bg-primary text-primary-foreground w-fit rounded-md px-2.5 py-1 text-xs font-medium">
        Continue
      </span>
      <p className="text-muted-foreground text-xs">
        Wrong: a Continue button wired to run immediately, with the trust checkbox added only as decoration.
        TrustDialog&apos;s own Continue has no prop that starts it enabled — it reads its disabled state from
        the checkbox every time.
      </p>
    </div>
  );
}

export function AccountPickerAsSeparateStep() {
  return (
    <div className="flex flex-col gap-2 rounded-lg border p-3 text-sm">
      <p className="text-foreground text-xs font-medium">Step 1 of 2 — choose where this runs</p>
      <span className="w-fit rounded-md border px-2.5 py-1 text-xs">Personal ▾</span>
      <p className="text-muted-foreground text-xs">
        Wrong: picking the execution account before the preview or warning are even shown. TrustDialog keeps
        the picker attached to Continue itself, decided at the same moment as the decision to run.
      </p>
    </div>
  );
}
