"use client";

import { Globe, Building2 } from "lucide-react";

import { EntityRow } from "@/registry/super-ai/entity-row";

/**
 * Live examples for auth-shell.docs.tsx.
 *
 * A client sidecar, kept separate from the docs module on purpose:
 * component-docs.tsx is a Server Component and reads `docs.whatItIs`,
 * `docs.evidence` and the rest straight off the exported object, so the docs
 * module has to stay plain server-evaluable data. Every example here is a
 * zero-prop component, so a handler like `onSelect` never has to cross the
 * server/client boundary.
 *
 * These are provider rows rather than whole shells: four full sign-in pages
 * stacked down a documentation page would teach nothing the live preview at
 * the top of the page does not already teach.
 */

function RowFrame({ children }: { children: React.ReactNode }) {
  return <div className="bg-card w-72 rounded-lg border p-2">{children}</div>;
}

/** Do — the row title is the action, which is also the whole accessible name of the button. */
export function ProviderRowNamesTheAction() {
  return (
    <RowFrame>
      <EntityRow
        icon={<Globe className="size-4" />}
        title="Continue with Google"
        description="ada@northwind.com"
        trailing={<span className="text-foreground text-xs">Last used</span>}
        onSelect={() => {}}
        className="border-border border"
      />
    </RowFrame>
  );
}

/** Do not — a brand name is not an instruction. */
export function ProviderRowIsJustTheBrand() {
  return (
    <RowFrame>
      <EntityRow
        icon={<Globe className="size-4" />}
        title="Google"
        onSelect={() => {}}
        className="border-border border"
      />
    </RowFrame>
  );
}

/** Do — an unavailable provider says why, in words, and is really disabled. */
export function UnavailableProviderSaysWhy() {
  return (
    <RowFrame>
      <EntityRow
        icon={<Building2 className="size-4" />}
        title="Continue with Northwind SSO"
        description="Ask an admin to enable SAML"
        disabled
        onSelect={() => {}}
        className="border-border border"
      />
    </RowFrame>
  );
}

/** Do not — dimming is the whole signal, so the row is a dead end with no explanation. */
export function UnavailableProviderIsJustDimmed() {
  return (
    <RowFrame>
      <EntityRow
        icon={<Building2 className="size-4" />}
        title="Continue with Northwind SSO"
        disabled
        onSelect={() => {}}
        className="border-border border"
      />
    </RowFrame>
  );
}
