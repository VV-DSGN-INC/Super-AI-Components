"use client";

import { Lock } from "lucide-react";
import * as React from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { formatCost, type Cost } from "@/registry/super-ai/cost";
import { CostChip } from "@/registry/super-ai/cost-chip";
import { EntityRow } from "@/registry/super-ai/entity-row";

/**
 * Action Stack — where a finished result goes next.
 *
 * Spec: docs/design-system/component-specs.md#f4-action-stack
 * States: menu · inline · cost-per-action · locked-rows
 *
 * "Cross-tool handoff is the signature interaction" of this category —
 * Extend, then Upscale, then Use in Lip sync — and each hop costs money. So
 * every row carries its own price: "chaining is where credits vanish
 * fastest", and a stack that shows the actions without the prices is how
 * someone spends a month's credits in four clicks.
 *
 * The row set is data, not code. Which actions appear depends on the asset
 * type, which is why this takes an `actions` array rather than growing a
 * variant per media kind.
 *
 * "Visually identical to I4 `ai-tools-menu` on purpose, because conceptually
 * they are the same thing" — so I4 in Wave 6 should reuse this shape rather
 * than re-derive it.
 */

interface AssetAction {
  id: string;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  /** Per row. Chaining is where credits vanish fastest. */
  cost?: Cost;
  disabled?: boolean;
  /** A tier fact, not an affordability fact. Locked rows are not actionable. */
  locked?: boolean;
}

interface ActionStackProps extends Omit<React.ComponentProps<"div">, "onSelect"> {
  actions: AssetAction[];
  onAction?: (id: string) => void;
  /** Required by `presentation="menu"`. */
  trigger?: React.ReactNode;
  presentation?: "menu" | "inline";
}

/**
 * The trailing slot: A2 `cost-chip`, per the spec's "rows are A9 with A2 in
 * the trailing slot".
 *
 * The chip's text comes from `formatCost` rather than from the chip's own
 * `{amount} {unit}` template, so rounding, grouping and pluralisation are
 * decided in exactly one place for every surface that shows a price. A2 was
 * specced to take a `Cost` directly, but that retrofit has not landed, so the
 * formatted string is passed as its `amount` and the unit suppressed — which
 * also means the rate form ("900 credits/min") renders correctly here today.
 */
function ActionCost({ cost }: { cost: Cost }) {
  // No data-slot override: A2 spreads `...props` after its own attributes, so
  // passing one would erase `cost-chip` and hide that A2 is what renders this.
  //
  // `text-foreground` is a call-site contrast fix, not a style preference. A2
  // sets `text-muted-foreground` on its own `bg-muted`, which measures 4.34:1
  // against a 4.5 minimum — a11y-baseline.md records it, and A2 is exempt from
  // the gate only under its own story name, so composing it here would fail
  // this component's stories. tailwind-merge swaps the foreground token and
  // leaves the chip otherwise untouched. Remove this when A2's retrofit lands.
  return <CostChip amount={formatCost(cost)} unit="" className="text-foreground" />;
}

function ActionRow({
  action,
  onAction,
  interactive,
}: {
  action: AssetAction;
  onAction?: (id: string) => void;
  /**
   * False inside a menu: `DropdownMenuItem` is already the interactive
   * element, and A9 renders a `<button>` when given `onSelect`, which would
   * nest one interactive inside another and fail axe. Same fix `skill-menu`
   * applies inside a `CommandItem`.
   */
  interactive: boolean;
}) {
  const actionable = !action.locked && !action.disabled;
  return (
    <EntityRow
      data-slot="action-stack-item"
      data-locked={action.locked ? "" : undefined}
      icon={action.locked ? <Lock aria-hidden className="size-4" /> : action.icon}
      title={action.title}
      description={action.description}
      disabled={action.disabled}
      trailing={
        <span className="flex items-center gap-2">
          {action.cost ? <ActionCost cost={action.cost} /> : null}
          {/* Never the padlock alone: the word is what carries the state to a
              screen reader and to anyone who cannot see the icon. */}
          {action.locked ? (
            <span data-slot="action-stack-locked" className="text-foreground text-xs">
              Locked
            </span>
          ) : null}
        </span>
      }
      {...(interactive && actionable ? { onSelect: () => onAction?.(action.id) } : {})}
    />
  );
}

function ActionStack({
  actions,
  onAction,
  trigger,
  presentation = "menu",
  className,
  ...props
}: ActionStackProps) {
  if (presentation === "inline") {
    return (
      <div
        data-slot="action-stack"
        data-presentation="inline"
        role="group"
        aria-label="Actions for this result"
        className={cn("flex flex-col", className)}
        {...props}
      >
        {actions.map((action) => (
          <ActionRow key={action.id} action={action} onAction={onAction} interactive />
        ))}
      </div>
    );
  }

  return (
    <div
      data-slot="action-stack"
      data-presentation="menu"
      className={cn(className)}
      {...props}
    >
      <DropdownMenu>
        <DropdownMenuTrigger
          data-slot="action-stack-trigger"
          // `render` rather than children, so the caller's own button becomes
          // the trigger instead of being wrapped in a second one.
          render={
            React.isValidElement(trigger) ? (
              trigger
            ) : (
              <button type="button">{trigger ?? "Use this result"}</button>
            )
          }
        />
        <DropdownMenuContent data-slot="action-stack-menu" className="w-80">
          {actions.map((action) => {
            const actionable = !action.locked && !action.disabled;
            return (
              <DropdownMenuItem
                key={action.id}
                // A locked row stays in the list — you need to see what you
                // would be getting — but it cannot be chosen.
                disabled={!actionable}
                onClick={actionable ? () => onAction?.(action.id) : undefined}
                className="p-0 focus:bg-transparent"
              >
                <ActionRow action={action} interactive={false} />
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export { ActionStack };
export type { ActionStackProps, AssetAction };
