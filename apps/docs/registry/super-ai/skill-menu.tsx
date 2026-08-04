"use client";

import { Bot, PenLine } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { CostChip } from "@/registry/super-ai/cost-chip";
import { EntityRow } from "@/registry/super-ai/entity-row";

/**
 * Skill Menu — Select-with-preview menu of agent skills
 *
 * Spec: docs/design-system/component-specs.md#d6-skill-menu
 * States: search · hover-preview · new-skill-footer
 *
 * Rows compose A9 `entity-row` for icon/title/description/trailing chrome —
 * per D13, "Rows are A9" — while `ui/command.tsx` (cmdk) owns the search
 * idiom, the roving "active" item, and keyboard navigation. `entity-row` is
 * rendered *without* `onSelect` so it stays a plain `<div>`: `CommandItem`
 * is already the interactive `role="option"` element, and a `<button>`
 * nested inside it would trip axe's `nested-interactive` rule.
 */

interface SkillMenuItem {
  id: string;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  /** Per-action cost (e.g. credits). Rendered via cost-chip when present. */
  cost?: number | string;
  costUnit?: string;
  /**
   * The differentiator per the spec: "A skill you cannot see the output of
   * is a name, not a choice." Shown in the preview pane while this skill is
   * the active row — active follows both mouse hover and keyboard arrow
   * navigation (cmdk drives both through the same "active value" state), so
   * the preview is never mouse-only.
   */
  preview?: React.ReactNode;
}

interface SkillMenuProps
  extends Omit<React.ComponentProps<typeof Command>, "children" | "value" | "onValueChange" | "label"> {
  skills?: SkillMenuItem[];
  onSelectSkill?: (skill: SkillMenuItem) => void;
  searchLabel?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  previewEmptyMessage?: string;
  onCreateSkill?: () => void;
  onGenerateSkill?: () => void;
  createLabel?: string;
  generateLabel?: string;
}

function SkillMenu({
  skills = [],
  onSelectSkill,
  searchLabel = "Search skills",
  searchPlaceholder = "Search skills...",
  emptyMessage = "No skills found.",
  previewEmptyMessage = "Hover or select a skill to see what it produces.",
  onCreateSkill,
  onGenerateSkill,
  createLabel = "Create your own",
  generateLabel = "Have the agent build it",
  className,
  ...props
}: SkillMenuProps) {
  const [selectedId, setSelectedId] = React.useState<string | undefined>(skills[0]?.id);

  // Keep the active (previewed) skill valid as the list changes underneath
  // it — e.g. `skills` arrives after mount, or the active skill is filtered
  // or removed. Falls back to the first item, mirroring cmdk's own
  // select-first-item default. Derived during render rather than synced in an
  // effect: an effect here would render once with a stale id and then again
  // with the corrected one, which is what react-hooks/set-state-in-effect
  // exists to prevent.
  const activeId = skills.some((skill) => skill.id === selectedId) ? selectedId : skills[0]?.id;

  const activeSkill = skills.find((skill) => skill.id === activeId);

  return (
    // `label` (not `aria-label`) is the correct way to name a cmdk root: it
    // fills the visually-hidden <label> that CommandInput's
    // aria-labelledby already points to. Passing aria-label to CommandInput
    // instead would lose to that (empty, unlabelled) aria-labelledby in
    // accessible-name computation — the "search input needs a real label"
    // requirement, gotten wrong the easy way.
    <Command
      data-slot="skill-menu"
      label={searchLabel}
      value={activeId}
      onValueChange={setSelectedId}
      className={cn(
        "flex w-full max-w-3xl flex-row rounded-xl border bg-popover p-0 text-popover-foreground",
        className,
      )}
      {...props}
    >
      <div className="flex w-72 shrink-0 flex-col border-r">
        <CommandInput placeholder={searchPlaceholder} />
        <CommandList aria-label={searchLabel}>
          <CommandEmpty>{emptyMessage}</CommandEmpty>
          {skills.map((skill) => (
            <CommandItem
              key={skill.id}
              value={skill.id}
              keywords={skill.description ? [skill.description] : undefined}
              onSelect={() => onSelectSkill?.(skill)}
              // Neutralises CommandItem's default `data-selected:bg-muted`:
              // entity-row's icon/description spans keep their own
              // `text-muted-foreground` regardless of this ancestor's
              // state, so a muted *background* here would repeat the
              // documented text-muted-foreground-on-bg-muted failure. A
              // ring reads as "active" without touching any background or
              // text colour, so it can't collide with entity-row's own
              // token choices.
              className="rounded-lg p-0 data-selected:bg-transparent data-selected:ring-1 data-selected:ring-ring"
            >
              <EntityRow
                icon={skill.icon}
                title={skill.title}
                description={skill.description}
                trailing={
                  skill.cost != null ? (
                    <CostChip amount={skill.cost} unit={skill.costUnit} className="text-foreground" />
                  ) : undefined
                }
                className="w-full"
              />
            </CommandItem>
          ))}
        </CommandList>
        <CommandSeparator />
        <div data-slot="skill-menu-footer" className="flex items-center gap-1 p-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCreateSkill}
            className="flex-1 justify-start gap-2"
          >
            <PenLine aria-hidden className="size-4" />
            {createLabel}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onGenerateSkill}
            className="flex-1 justify-start gap-2"
          >
            <Bot aria-hidden className="size-4" />
            {generateLabel}
          </Button>
        </div>
      </div>
      <div data-slot="skill-menu-preview" className="min-w-0 flex-1 p-4">
        {activeSkill?.preview ?? <p className="text-muted-foreground text-sm">{previewEmptyMessage}</p>}
      </div>
    </Command>
  );
}

export { SkillMenu };
export type { SkillMenuItem, SkillMenuProps };
