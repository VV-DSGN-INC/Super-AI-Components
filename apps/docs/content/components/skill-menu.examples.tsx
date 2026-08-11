"use client";

import { Sparkles, Wand2 } from "lucide-react";

import { CostChip } from "@/registry/super-ai/cost-chip";
import { EntityRow } from "@/registry/super-ai/entity-row";
import { SkillMenu, type SkillMenuItem } from "@/registry/super-ai/skill-menu";

/**
 * Live examples for skill-menu.docs.tsx.
 *
 * This is a client sidecar, kept separate from the docs module on purpose:
 * component-docs.tsx (a Server Component) reads `docs.whatItIs`,
 * `docs.evidence`, etc. directly, so skill-menu.docs.tsx has to stay plain
 * server-evaluable data — it cannot carry "use client" itself. Every example
 * lives here instead and crosses into the docs module as a zero-prop
 * element (e.g. `<ComposedRowsNotRebuilt />`), so a handler like
 * `onSelectSkill` never has to be serialized across the server/client
 * boundary — it's created and consumed entirely inside this client module.
 */

const SAMPLE_SKILLS: SkillMenuItem[] = [
  {
    id: "remove-bg",
    title: "Remove background",
    description: "Cut a subject out onto a transparent background",
    icon: <Wand2 aria-hidden />,
    preview: (
      <div className="bg-muted flex h-32 items-center justify-center rounded-md text-sm">
        Preview: cutout result
      </div>
    ),
  },
  {
    id: "upscale",
    title: "Upscale",
    description: "Increase resolution up to 4x without softening edges",
    icon: <Sparkles aria-hidden />,
    cost: 3,
    preview: (
      <div className="bg-muted flex h-32 items-center justify-center rounded-md text-sm">
        Preview: upscaled result
      </div>
    ),
  },
];

export function ComposedRowsNotRebuilt() {
  return <SkillMenu skills={SAMPLE_SKILLS} />;
}

export function CostChipOverrideOnHighlight() {
  return (
    <EntityRow
      icon={<Sparkles aria-hidden />}
      title="Upscale"
      description="Increase resolution up to 4x without softening edges"
      trailing={<CostChip amount={3} />}
    />
  );
}

/**
 * The anti-pattern: the preview exists only inside a `group-hover:block`
 * rule, so a keyboard user tabbing or arrowing through the list — or a
 * mouse-less switch-control user — can never see it, no matter how long
 * they navigate. Contrast with SkillMenu's real implementation, where cmdk
 * drives the same "active" row from pointer hover and arrow-key navigation
 * alike, so the preview is never gated behind a pointer.
 */
export function MouseOnlyPreviewTrap() {
  return (
    <div className="group/demo relative w-64 rounded-lg border p-2">
      <p className="text-sm font-medium">Remove background</p>
      <p className="text-muted-foreground text-xs">Cut a subject out onto a transparent background</p>
      <div className="bg-popover absolute top-0 left-full ml-2 hidden w-40 rounded-md border p-2 text-xs group-hover/demo:block">
        Preview: cutout result
      </div>
    </div>
  );
}

/**
 * The anti-pattern: a `<button>` nested inside a `role="option"` row. The
 * row is already the interactive control — cmdk drives it via keyboard and
 * click — so a focusable child doubles the tab stop and trips axe's
 * nested-interactive rule.
 */
export function NestedInteractiveRow() {
  return (
    <div
      role="option"
      aria-selected={false}
      className="flex items-center justify-between rounded-lg border p-2 text-sm"
    >
      Upscale
      <button type="button" className="rounded border px-2 py-0.5 text-xs">
        Run
      </button>
    </div>
  );
}
