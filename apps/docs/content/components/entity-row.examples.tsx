"use client";

import * as React from "react";
import { Bot, ChevronRight, Plug, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { EntityRow } from "@/registry/super-ai/entity-row";

/**
 * Live examples for entity-row.docs.tsx.
 *
 * A client sidecar, kept separate from the docs module on purpose:
 * component-docs.tsx is a Server Component and reads `docs.whatItIs`,
 * `docs.evidence` and the rest straight off the exported object, so the docs
 * module has to stay plain server-evaluable data. Every example here is a
 * zero-prop component, so a handler like `onSelect` — and `useId`, which is a
 * hook and cannot run on the server — never has to cross the boundary.
 */

function RowFrame({ children }: { children: React.ReactNode }) {
  return <div className="bg-card w-72 rounded-lg border p-2">{children}</div>;
}

/**
 * Do — one control per row. The row is the control, so picking it is a single
 * tab stop and a single click target.
 */
export function RowIsTheControl() {
  return (
    <RowFrame>
      <EntityRow
        icon={<Sparkles aria-hidden className="size-4" />}
        title="Summarize"
        description="Condense a long document"
        trailing={<span className="text-muted-foreground text-xs">4 credits</span>}
        selected
        onSelect={() => {}}
      />
    </RowFrame>
  );
}

/**
 * Do not — a hand-rolled row with a button inside a button. This is what
 * `onSelect` plus an interactive `trailing` compiles to: two nested widgets,
 * two tab stops for one row, and axe&apos;s nested-interactive rule. Rendered
 * here as plain markup rather than as a real EntityRow, so the documentation
 * page does not itself ship the violation it is warning about.
 */
export function RowWrapsAnotherControl() {
  return (
    <RowFrame>
      <div className="flex min-h-14 w-full items-center gap-3 rounded-lg border px-3 py-2 text-left">
        <Sparkles aria-hidden className="text-muted-foreground size-4 shrink-0" />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm font-medium">Summarize</span>
          <span className="text-muted-foreground truncate text-xs">Condense a long document</span>
        </span>
        <button type="button" className="rounded border px-2 py-0.5 text-xs">
          Run
        </button>
      </div>
    </RowFrame>
  );
}

/**
 * Do — the trailing control borrows the row title as its name, by way of an id
 * the caller injects into `title`. This is exactly what member-gate-row does.
 */
export function TrailingControlBorrowsTheTitle() {
  const titleId = React.useId();
  return (
    <RowFrame>
      <EntityRow
        icon={<Plug aria-hidden className="size-4" />}
        title={<span id={titleId}>Slack</span>}
        description="Post run summaries to a channel"
        trailing={<Switch aria-labelledby={titleId} defaultChecked />}
      />
    </RowFrame>
  );
}

/**
 * Do not — an unlabelled switch. The row reads &quot;Slack&quot; to a sighted
 * user and announces an anonymous toggle to everyone else; entity-row gives
 * the trailing slot no name of its own.
 */
export function TrailingControlHasNoName() {
  return (
    <RowFrame>
      <EntityRow
        icon={<Plug aria-hidden className="size-4" />}
        title="Slack"
        description="Post run summaries to a channel"
        trailing={<Switch defaultChecked />}
      />
    </RowFrame>
  );
}

/**
 * Do not — a chevron on a row that toggles. The glyph promises somewhere to
 * go; this row only turns something on, and the arrow is the only thing that
 * says otherwise.
 */
export function ChevronOnARowThatDoesNotNavigate() {
  return (
    <RowFrame>
      <EntityRow
        icon={<Bot aria-hidden className="size-4" />}
        title="Fine-tune a model"
        description="Train on your own examples"
        trailing={
          <span className="flex items-center gap-2">
            <Badge variant="secondary">Pro</Badge>
            <ChevronRight aria-hidden className="text-muted-foreground size-4" />
          </span>
        }
        selected
        onSelect={() => {}}
      />
    </RowFrame>
  );
}
