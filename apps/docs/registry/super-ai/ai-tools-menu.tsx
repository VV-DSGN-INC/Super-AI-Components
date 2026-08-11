"use client";

import { Lock } from "lucide-react";
import * as React from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { formatCost, type Cost } from "@/registry/super-ai/cost";
import { CostChip } from "@/registry/super-ai/cost-chip";
import { EntityRow } from "@/registry/super-ai/entity-row";

/**
 * AI Tools Menu — the AI actions that attach to a selected object.
 *
 * Spec: docs/design-system/component-specs.md#i4-ai-tools-menu
 * States: grouped-rows · cost-chips · destructive-group
 *
 * "AI actions attach to objects, not only to chats. The selection is the
 * prompt context." That sentence is the whole component. What is selected is
 * not decoration in a header — it is the input the actions run against, so
 * this surface names it and takes its accessible name from it, and the host
 * derives the row set from it.
 *
 * F4 `action-stack` is "visually identical to I4 on purpose, because
 * conceptually they are the same thing", and I4 is to reuse that shape rather
 * than re-derive it. So this file deliberately mirrors F4:
 *
 * - the row is A9 `entity-row` with A2 `cost-chip` in the trailing slot;
 * - `presentation="menu" | "inline"`, `trigger`, `onAction(id)` and the
 *   `id`/`title`/`description`/`icon`/`cost`/`disabled`/`locked` action shape
 *   are named exactly as F4 names them;
 * - locked rows stay visible, keep their price, and are not actionable;
 * - inside a menu the row is never given `onSelect`, because A9 renders a
 *   `<button>` when it has one and the `DropdownMenuItem` is already the
 *   control.
 *
 * It mirrors F4 rather than composing it because it cannot compose it: F4's
 * root owns the `DropdownMenu`, so N groups would mean N dropdowns instead of
 * one menu with rules between the groups — and F4 has no grouping, no rule
 * and no selection context. The right consolidation is to lift the shared row
 * out of both, not to nest one inside the other.
 *
 * Two deliberate divergences from F4, both explained at their call sites: the
 * row keeps A9's own `data-slot`, and destructive is never signalled by colour.
 */

interface AiToolAction {
  id: string;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  /** Per row, "where the action spends". Omit for genuinely free actions. */
  cost?: Cost;
  disabled?: boolean;
  /** A tier fact, not an affordability fact. Locked rows are not actionable. */
  locked?: boolean;
}

interface AiToolGroup {
  id: string;
  /** The intent — "Edit", "Generate", "Clean up". Grouped by intent. */
  label?: string;
  actions: AiToolAction[];
  /**
   * "Expensive or destructive options below a rule." Groups flagged this way
   * are moved below every ordinary group, so the rule above them is
   * structural rather than something each caller has to remember to order
   * correctly.
   */
  destructive?: boolean;
}

/**
 * What the actions will run against. The selection is the prompt context, so
 * it is stated on the surface rather than inferred from whatever happens to be
 * highlighted behind the menu.
 */
interface ToolSelection {
  /** The object itself — "Hero image", "3 layers", "Paragraph 4". */
  label: string;
  /** Its kind — "Image", "Text frame". Drives which groups the host passes. */
  type?: string;
  icon?: React.ReactNode;
}

interface AiToolsMenuProps extends Omit<React.ComponentProps<"div">, "onSelect"> {
  /** Grouped by intent. Destructive groups sink below the rule regardless of order. */
  groups: AiToolGroup[];
  selection?: ToolSelection;
  onAction?: (id: string) => void;
  /** Required by `presentation="menu"`. */
  trigger?: React.ReactNode;
  presentation?: "menu" | "inline";
}

/**
 * The trailing slot: A2 `cost-chip`, built exactly as F4 builds it.
 *
 * Text comes from `formatCost`, not from A2's own `{amount} {unit}` template,
 * so rounding, grouping and pluralisation are decided in one place for every
 * surface that quotes a price — and the rate form ("900 credits/min") renders
 * correctly here today.
 */
function ToolCost({ cost }: { cost: Cost }) {
  // No data-slot override: A2 spreads `...props` after its own attributes, so
  // passing one would erase `cost-chip` and hide that A2 is what renders this.
  //
  // `text-foreground` is a call-site contrast fix, not a style preference. A2
  // sets `text-muted-foreground` on its own `bg-muted` — 4.34:1 against a 4.5
  // minimum — and is exempt from the a11y gate only under its own story name,
  // so composing it unmodified would fail this component's stories.
  // tailwind-merge swaps the foreground token and leaves the chip otherwise
  // intact. Remove this when A2's `Cost` retrofit lands.
  return <CostChip amount={formatCost(cost)} unit="" />;
}

function ToolRow({
  action,
  destructive,
  onAction,
  interactive,
}: {
  action: AiToolAction;
  destructive?: boolean;
  onAction?: (id: string) => void;
  /**
   * False inside a menu: `DropdownMenuItem` is already the interactive
   * element, and A9 renders a `<button>` when given `onSelect`, which would
   * nest one interactive inside another and fail axe. The same split F4
   * makes, and the same fix `skill-menu` applies inside a `CommandItem`.
   */
  interactive: boolean;
}) {
  const actionable = !action.locked && !action.disabled;
  return (
    <EntityRow
      // Divergence from F4, which renames this slot to `action-stack-item`. A
      // `data-slot` passed to a registry component *replaces* its own, and the
      // house rule is not to erase a composed component's slot — keeping it is
      // what makes the composition visible in the DOM. The row is identified
      // by `data-tool-action` instead and stays an `entity-row`.
      data-tool-action={action.id}
      data-locked={action.locked ? "" : undefined}
      data-destructive={destructive ? "" : undefined}
      icon={action.locked ? <Lock aria-hidden className="size-4" /> : action.icon}
      title={action.title}
      description={action.description}
      disabled={action.disabled}
      trailing={
        <span className="flex items-center gap-2">
          {action.cost ? <ToolCost cost={action.cost} /> : null}
          {/* Never the padlock alone: the word is what carries the state to a
              screen reader and to anyone who cannot see the icon. */}
          {action.locked ? (
            <span data-slot="ai-tools-menu-locked" className="text-foreground text-xs">
              Locked
            </span>
          ) : null}
        </span>
      }
      {...(interactive && actionable ? { onSelect: () => onAction?.(action.id) } : {})}
    />
  );
}

/**
 * The selection, stated. Also the source of the surface's accessible name, so
 * "AI tools" alone is never what gets announced when three objects on a canvas
 * each have their own menu.
 */
function SelectionHeader({ selection }: { selection: ToolSelection }) {
  return (
    <div
      data-slot="ai-tools-menu-selection"
      className="flex items-center gap-2 px-3 py-2"
      // Context, not a choice — so it is not a menu item, and the same words
      // reach assistive tech through the surface's aria-label instead of being
      // read twice.
      aria-hidden
    >
      {selection.icon ? (
        <span className="text-muted-foreground shrink-0">{selection.icon}</span>
      ) : null}
      <span className="flex min-w-0 flex-col">
        <span className="text-muted-foreground text-[11px] tracking-wide uppercase">
          {selection.type ? `Selected ${selection.type}` : "Selected"}
        </span>
        <span className="text-foreground truncate text-sm font-medium">{selection.label}</span>
      </span>
    </div>
  );
}

/** "AI tools for Hero image" — one phrasing, used by both presentations. */
function surfaceLabel(selection?: ToolSelection): string {
  return selection ? `AI tools for ${selection.label}` : "AI tools";
}

/**
 * Expensive and destructive groups sink to the bottom. Stable within each
 * half, so the caller's ordering is otherwise preserved.
 */
function orderGroups(groups: AiToolGroup[]): AiToolGroup[] {
  return [...groups.filter((g) => !g.destructive), ...groups.filter((g) => g.destructive)];
}

function GroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      data-slot="ai-tools-menu-group-label"
      // The group carries the same words as its `aria-label`, so the visible
      // heading is the sighted half of one label rather than a second reading
      // of it — and it stays out of the menu's child structure.
      aria-hidden
      className="text-muted-foreground px-3 pt-2 pb-1 text-xs font-medium"
    >
      {children}
    </div>
  );
}

function AiToolsMenu({
  groups,
  selection,
  onAction,
  trigger,
  presentation = "menu",
  className,
  ...props
}: AiToolsMenuProps) {
  const ordered = orderGroups(groups);

  if (presentation === "inline") {
    return (
      <div
        data-slot="ai-tools-menu"
        data-presentation="inline"
        role="group"
        aria-label={surfaceLabel(selection)}
        className={cn("flex flex-col", className)}
        {...props}
      >
        {selection ? <SelectionHeader selection={selection} /> : null}
        {ordered.map((group, index) => (
          <React.Fragment key={group.id}>
            {/* The rule. Drawn between every group, which is what guarantees
                the destructive group — sorted last — always sits below one. */}
            {index > 0 || selection ? (
              <div
                data-slot="ai-tools-menu-rule"
                role="separator"
                className="bg-border my-1 h-px w-full"
              />
            ) : null}
            <div
              data-slot="ai-tools-menu-group"
              data-destructive={group.destructive ? "" : undefined}
              role="group"
              aria-label={group.label}
              className="flex flex-col"
            >
              {group.label ? <GroupLabel>{group.label}</GroupLabel> : null}
              {group.actions.map((action) => (
                <ToolRow
                  key={action.id}
                  action={action}
                  destructive={group.destructive}
                  onAction={onAction}
                  interactive
                />
              ))}
            </div>
          </React.Fragment>
        ))}
      </div>
    );
  }

  return (
    <div data-slot="ai-tools-menu" data-presentation="menu" className={cn(className)} {...props}>
      <DropdownMenu>
        <DropdownMenuTrigger
          data-slot="ai-tools-menu-trigger"
          // `render` rather than children, so the caller's own button becomes
          // the trigger instead of being wrapped in a second one.
          render={
            React.isValidElement(trigger) ? (
              trigger
            ) : (
              <button type="button">{trigger ?? "AI tools"}</button>
            )
          }
        />
        <DropdownMenuContent
          data-slot="ai-tools-menu-content"
          aria-label={surfaceLabel(selection)}
          // Base UI labels the popup from its trigger, and `aria-labelledby`
          // beats `aria-label` — so three objects on one canvas would all
          // announce the trigger's word. Clearing it lets the selection name
          // the menu, which is the point of the component.
          aria-labelledby={undefined}
          className="w-80"
        >
          {selection ? <SelectionHeader selection={selection} /> : null}
          {ordered.map((group, index) => (
            <React.Fragment key={group.id}>
              {index > 0 || selection ? <DropdownMenuSeparator /> : null}
              <div
                data-slot="ai-tools-menu-group"
                data-destructive={group.destructive ? "" : undefined}
                role="group"
                aria-label={group.label}
              >
                {group.label ? <GroupLabel>{group.label}</GroupLabel> : null}
                {group.actions.map((action) => {
                  const actionable = !action.locked && !action.disabled;
                  return (
                    <DropdownMenuItem
                      key={action.id}
                      // A locked row stays in the list — you need to see what
                      // you would be getting — but it cannot be chosen.
                      disabled={!actionable}
                      onClick={actionable ? () => onAction?.(action.id) : undefined}
                      // Deliberately NOT `variant="destructive"`: that paints
                      // `text-destructive` (4.0:1 on its own) and, on focus, a
                      // translucent `bg-destructive/10` behind it. Destructive
                      // is carried by position below the rule, by the group
                      // label, by the row's own icon and by `data-destructive`
                      // — never by colour, which the a11y baseline forbids as
                      // a sole signal in any case.
                      className="p-0 focus:bg-transparent"
                    >
                      <ToolRow
                        action={action}
                        destructive={group.destructive}
                        interactive={false}
                      />
                    </DropdownMenuItem>
                  );
                })}
              </div>
            </React.Fragment>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export { AiToolsMenu };
export type { AiToolAction, AiToolGroup, AiToolsMenuProps, ToolSelection };
