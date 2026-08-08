"use client";

import { PermissionPrompt } from "@/registry/super-ai/permission-prompt";

/**
 * Live examples for permission-prompt.docs.tsx.
 *
 * Client sidecar, kept separate from the docs module on purpose:
 * component-docs.tsx (a Server Component) reads `docs.whatItIs`,
 * `docs.evidence`, etc. directly, so permission-prompt.docs.tsx has to stay
 * plain server-evaluable data. Every example lives here and crosses into the
 * docs module as a zero-prop element (e.g. `<EqualWeightVerbs />`).
 *
 * The two "Do" examples force `open` so the dialog renders inline on the
 * docs page rather than needing a click — the same move trust-dialog's
 * examples use. The two "Don't" examples are static mockups, not the real
 * component misused: PermissionPrompt has no prop that subordinates
 * edit-first or renders a grant list, so there is no wrong prop combination
 * to demonstrate — these show what the anti-pattern looks like if a team
 * hand-rolled it instead.
 */

const ARGS = [
  { key: "to", value: "finance@acme.com" },
  { key: "subject", value: "Q3 invoice — ready for review" },
];

export function EqualWeightVerbs() {
  return (
    <PermissionPrompt
      open
      action="Send email to finance@acme.com"
      reason="The invoice PDF finished rendering."
      args={ARGS}
      onAllowOnce={() => {}}
      onAlwaysAllow={() => {}}
      onDeny={() => {}}
      onEditFirst={() => {}}
    />
  );
}

export function ArgumentsHiddenUntilExpanded() {
  return (
    <PermissionPrompt
      open
      action="Write to ~/.bashrc"
      reason="Adding the agent's tool directory to PATH so later steps can find it."
      args={[
        { key: "path", value: "~/.bashrc" },
        { key: "content", value: "export PATH=$PATH:/usr/local/bin/agent-tools" },
      ]}
      onAllowOnce={() => {}}
      onAlwaysAllow={() => {}}
      onDeny={() => {}}
      onEditFirst={() => {}}
    />
  );
}

export function SubordinateEditFirst() {
  return (
    <div className="flex flex-col gap-2 rounded-lg border p-3 text-sm">
      <div className="flex items-center gap-2">
        <span className="bg-primary text-primary-foreground w-fit rounded-md px-2.5 py-1 text-xs font-medium">
          Deny
        </span>
        <span className="bg-primary text-primary-foreground w-fit rounded-md px-2.5 py-1 text-xs font-medium">
          Allow once
        </span>
        <span className="text-primary text-xs underline underline-offset-2">edit first</span>
      </div>
      <p className="text-muted-foreground text-xs">
        Wrong: edit-first demoted to a text link beside two solid buttons. PermissionPrompt&apos;s own Edit
        first always renders the same Button variant and size as Allow once — a pinned test fails the moment
        either one changes.
      </p>
    </div>
  );
}

export function InlineGrantList() {
  return (
    <div className="flex flex-col gap-2 rounded-lg border p-3 text-sm">
      <span className="bg-primary text-primary-foreground w-fit rounded-md px-2.5 py-1 text-xs font-medium">
        Always allow
      </span>
      <div className="flex flex-col gap-1 rounded-md border p-2">
        <p className="text-foreground text-xs font-medium">Standing permissions</p>
        <p className="text-muted-foreground text-xs">Read ~/.ssh/config — granted just now · Revoke</p>
      </div>
      <p className="text-muted-foreground text-xs">
        Wrong: a grant list rendered inside the prompt itself. PermissionPrompt only calls `onAlwaysAllow` —
        reviewing and revoking standing grants is N9 `autonomy-selector`&apos;s job, not a list this component
        builds.
      </p>
    </div>
  );
}
