"use client";

import { CreditCard, Plug, Search, Server, SlidersHorizontal } from "lucide-react";

import { Input } from "@/components/ui/input";
import { MemberGateRow } from "@/registry/super-ai/member-gate-row";
import { SidebarNav } from "@/registry/super-ai/sidebar-nav";

/**
 * Live examples for settings-shell.docs.tsx.
 *
 * A client sidecar, kept separate from the docs module on purpose:
 * component-docs.tsx is a Server Component and reads `docs.whatItIs` and the
 * rest straight off the exported object, so the docs module has to stay plain
 * server-evaluable data. Every example here is a zero-prop component, so no
 * handler ever has to cross the server/client boundary.
 *
 * These are fragments of the nav column and one gated row, not whole shells:
 * four full settings pages stacked down a documentation page would teach
 * nothing the live preview at the top of the page has not already taught.
 */

const GROUPS = [
  {
    label: "Account",
    items: [
      { id: "general", label: "General", icon: <SlidersHorizontal aria-hidden /> },
      { id: "billing", label: "Billing", icon: <CreditCard aria-hidden /> },
    ],
  },
  {
    label: "Workspace",
    items: [{ id: "mcp", label: "MCP", icon: <Server aria-hidden />, tier: "Pro" }],
  },
];

function NavColumn({ children }: { children: React.ReactNode }) {
  return <div className="flex w-60 flex-col gap-3 rounded-lg border p-3">{children}</div>;
}

function SearchField({ label, value }: { label: string; value: string }) {
  return (
    <div className="relative">
      <Search aria-hidden className="text-muted-foreground pointer-events-none absolute top-2 left-2 size-4" />
      <Input type="search" aria-label={label} defaultValue={value} className="pl-7" readOnly />
    </div>
  );
}

/** Do — one search over every group, with the count on the row that holds the match. */
export function SearchSitsWithTheNav() {
  return (
    <NavColumn>
      <SearchField label="Search settings (example)" value="invoice" />
      <p role="status" className="text-muted-foreground text-xs">
        1 setting matches across 3 sections
      </p>
      <SidebarNav
        aria-label="Settings sections (example)"
        activeId="mcp"
        sections={[
          {
            label: "Account",
            items: [
              { id: "general", label: "General", icon: <SlidersHorizontal aria-hidden />, count: 0 },
              { id: "billing", label: "Billing", icon: <CreditCard aria-hidden />, count: 1 },
            ],
          },
          {
            label: "Workspace",
            items: [{ id: "mcp", label: "MCP", icon: <Server aria-hidden />, tier: "Pro", count: 0 }],
          },
        ]}
      />
    </NavColumn>
  );
}

/**
 * Don&apos;t — search buried in the panel, so it can only ever find settings in
 * the section you had already opened.
 */
export function SearchScopedToTheOpenSection() {
  return (
    <div className="flex w-full max-w-xl gap-3 rounded-lg border p-3">
      <SidebarNav aria-label="Settings sections (anti-example)" activeId="mcp" sections={GROUPS} />
      <div className="flex min-w-0 flex-1 flex-col gap-2 border-l pl-3">
        <SearchField label="Search this section (anti-example)" value="invoice" />
        <p className="text-muted-foreground text-sm">No settings in MCP match this search.</p>
      </div>
    </div>
  );
}

/** Do — the tier badge names a plan, and the row it promises is visible and gated. */
export function TierBadgePointsAtSomething() {
  return (
    <div className="flex w-full max-w-xl flex-col gap-3 rounded-lg border p-3">
      <SidebarNav aria-label="Settings sections (example)" activeId="mcp" sections={GROUPS} />
      <div className="border-t pt-3">
        <MemberGateRow
          icon={<Plug aria-hidden />}
          label="Remote MCP servers"
          description="Connect servers that run outside this machine, over HTTP."
          state="locked"
          tier="Pro"
        />
      </div>
    </div>
  );
}

/**
 * Don&apos;t — the gated feature is simply absent, so nobody can want it and the
 * badge in the nav promises something nothing on the page delivers.
 */
export function GatedFeatureHiddenUntilUpgrade() {
  return (
    <div className="flex w-full max-w-xl flex-col gap-3 rounded-lg border p-3">
      <SidebarNav aria-label="Settings sections (anti-example)" activeId="mcp" sections={GROUPS} />
      <div className="border-t pt-3">
        <p className="text-muted-foreground text-sm">
          Upgrade to Pro to see what else this workspace can connect.
        </p>
      </div>
    </div>
  );
}
