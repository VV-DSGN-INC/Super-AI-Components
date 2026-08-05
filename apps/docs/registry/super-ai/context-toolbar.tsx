"use client";

import { Toolbar } from "@base-ui/react/toolbar";
import { MoreHorizontal, Sparkles } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/**
 * Context Toolbar — the actions that belong to the current selection.
 *
 * Spec: docs/design-system/component-specs.md#i3-context-toolbar
 * States: text · image · shape · media · overflow
 *
 * Three rules from the spec carry the weight, and each is enforced here
 * rather than left to the call site:
 *
 * 1. "Six to eight actions maximum. Past that it competes with the
 *    inspector." `maxActions` is clamped to {@link MAX_TOOLBAR_ACTIONS}, so a
 *    caller who passes twenty actions gets eight buttons and an overflow menu,
 *    not a twenty-button bar. The cap is the component's, not the caller's.
 * 2. "The AI entry is always first and always opens I4." It is a slot on this
 *    component, not a row in `actions`, so it lands at index 0 whatever order
 *    the actions arrived in — the same rule F7 `approval-card` uses for its
 *    four verbs. It is also never eligible for overflow.
 * 3. "Flips above or below the selection to stay in the viewport, and never
 *    covers the selection." A registry component does not own the canvas, so
 *    it cannot measure anything: `placement` and the matching `data-placement`
 *    express the decision, and the host that knows where the selection is
 *    makes it. See the pitfalls in the guidance module.
 */

/**
 * The hard ceiling from the spec's first bullet, including the AI entry and
 * excluding the overflow trigger (an affordance, not an action).
 */
const MAX_TOOLBAR_ACTIONS = 8;

type ContextToolbarSelection = "text" | "image" | "shape" | "media";
type ContextToolbarPlacement = "above" | "below";

/**
 * Default accessible names. A floating toolbar with no name is just "toolbar"
 * to a screen reader, and there may be several on a canvas — naming it after
 * what is selected is the only thing that tells them apart.
 */
const SELECTION_LABEL: Record<ContextToolbarSelection, string> = {
  text: "Text selection actions",
  image: "Image selection actions",
  shape: "Shape selection actions",
  media: "Media selection actions",
};

interface ContextToolbarAction {
  id: string;
  /**
   * Always the accessible name, whether or not it is drawn. Icon-only actions
   * render it in an sr-only span *and* a tooltip — never the tooltip alone,
   * which is not a name (see `modality-rail`).
   */
  label: string;
  icon?: React.ReactNode;
  /** Draw the label beside the icon instead of hiding it. */
  showLabel?: boolean;
  disabled?: boolean;
}

interface ContextToolbarProps extends Omit<React.ComponentProps<"div">, "onSelect"> {
  /** What is selected. Drives the default accessible name and `data-selection`. */
  selection?: ContextToolbarSelection;
  /** Order is preserved, except that nothing can displace the AI entry. */
  actions?: ContextToolbarAction[];
  onAction?: (id: string) => void;
  /** Overrides the selection-derived accessible name. */
  label?: string;
  aiLabel?: string;
  aiIcon?: React.ReactNode;
  /**
   * I4 `ai-tools-menu` goes here. Passing it turns the AI entry into a popover
   * trigger; leaving it off falls back to `onAiSelect` so a host can open its
   * own surface. This is a slot rather than an import because I4 is a sibling
   * component and the dependency would only run one way.
   */
  aiMenu?: React.ReactNode;
  aiOpen?: boolean;
  onAiOpenChange?: (open: boolean) => void;
  /** Fires when the AI entry is activated and no `aiMenu` is supplied. */
  onAiSelect?: () => void;
  /**
   * Buttons in the bar, counting the AI entry. Clamped to 1…8: the spec's cap
   * is a property of the component, so passing a larger number does nothing.
   */
  maxActions?: number;
  overflowLabel?: string;
  /**
   * Which side of the selection the toolbar is drawn on. The component does
   * **not** measure the viewport — see the guidance module.
   */
  placement?: ContextToolbarPlacement;
}

/**
 * Icons arrive from the caller, so they are wrapped in an aria-hidden span
 * here rather than trusted to carry `aria-hidden` themselves. Otherwise a
 * lucide icon's title would end up doubling the button's name.
 */
function ActionIcon({ children }: { children: React.ReactNode }) {
  return (
    <span aria-hidden="true" className="flex items-center [&_svg]:size-4">
      {children}
    </span>
  );
}

function ContextToolbarButton({
  action,
  onAction,
  side,
}: {
  action: ContextToolbarAction;
  onAction?: (id: string) => void;
  side: "top" | "bottom";
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Toolbar.Button
            data-slot="context-toolbar-action"
            data-action-id={action.id}
            disabled={action.disabled}
            onClick={() => onAction?.(action.id)}
            render={<Button variant="ghost" size={action.showLabel ? "sm" : "icon-sm"} />}
          />
        }
      >
        {action.icon ? <ActionIcon>{action.icon}</ActionIcon> : null}
        {/* The name is in the DOM either way. The tooltip repeats it; it never
            supplies it. */}
        <span className={action.showLabel ? undefined : "sr-only"}>{action.label}</span>
      </TooltipTrigger>
      <TooltipContent side={side}>{action.label}</TooltipContent>
    </Tooltip>
  );
}

function ContextToolbar({
  selection = "text",
  actions = [],
  onAction,
  label,
  aiLabel = "AI tools",
  aiIcon,
  aiMenu,
  aiOpen,
  onAiOpenChange,
  onAiSelect,
  maxActions = MAX_TOOLBAR_ACTIONS,
  overflowLabel = "More actions",
  placement = "above",
  className,
  children,
  ...props
}: ContextToolbarProps) {
  // The cap bites here, not at the call site. `Math.min` against the spec's
  // ceiling is the whole enforcement: a caller cannot opt out of it, only
  // choose a tighter bar.
  const cap = Math.max(1, Math.min(maxActions, MAX_TOOLBAR_ACTIONS));
  // The AI entry occupies one of the slots, because the user counts buttons,
  // not "actions other than the AI one".
  const budget = cap - 1;
  const visibleActions = actions.slice(0, budget);
  const overflowActions = actions.slice(budget);

  // The popover and the tooltips open away from the selection: a toolbar drawn
  // above the selection must open its menus upward, or the menu lands on top
  // of the thing the toolbar was careful not to cover.
  const side = placement === "above" ? "top" : "bottom";

  const aiButton = (
    <Toolbar.Button
      data-slot="context-toolbar-ai"
      onClick={aiMenu ? undefined : onAiSelect}
      render={<Button variant="default" size="sm" />}
    >
      <ActionIcon>{aiIcon ?? <Sparkles />}</ActionIcon>
      {aiLabel}
    </Toolbar.Button>
  );

  return (
    <TooltipProvider>
      <Toolbar.Root
        data-slot="context-toolbar"
        data-selection={selection}
        data-placement={placement}
        data-overflow-count={overflowActions.length || undefined}
        aria-label={label ?? SELECTION_LABEL[selection]}
        className={cn(
          "bg-popover text-popover-foreground flex w-fit items-center gap-0.5 rounded-lg border p-1 shadow-md",
          className,
        )}
        {...props}
      >
        {/* Index 0, always. Never sliced into overflow. */}
        {aiMenu ? (
          <Popover open={aiOpen} onOpenChange={onAiOpenChange}>
            <PopoverTrigger render={aiButton} />
            <PopoverContent
              data-slot="context-toolbar-ai-menu"
              side={side}
              align="start"
              className="w-auto min-w-64 p-1"
            >
              {aiMenu}
            </PopoverContent>
          </Popover>
        ) : (
          aiButton
        )}

        {visibleActions.length > 0 ? (
          <Separator orientation="vertical" className="mx-0.5 h-5" />
        ) : null}

        {visibleActions.map((action) => (
          <ContextToolbarButton key={action.id} action={action} onAction={onAction} side={side} />
        ))}

        {children}

        {overflowActions.length > 0 ? (
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger
                render={
                  <DropdownMenuTrigger
                    render={
                      <Toolbar.Button
                        data-slot="context-toolbar-overflow"
                        render={<Button variant="ghost" size="icon-sm" />}
                      />
                    }
                  />
                }
              >
                <ActionIcon>
                  <MoreHorizontal />
                </ActionIcon>
                <span className="sr-only">{overflowLabel}</span>
              </TooltipTrigger>
              <TooltipContent side={side}>{overflowLabel}</TooltipContent>
            </Tooltip>
            <DropdownMenuContent
              data-slot="context-toolbar-overflow-menu"
              side={side}
              align="end"
              className="w-56"
            >
              {overflowActions.map((action) => (
                <DropdownMenuItem
                  key={action.id}
                  data-action-id={action.id}
                  disabled={action.disabled}
                  onClick={() => onAction?.(action.id)}
                >
                  {action.icon ? <ActionIcon>{action.icon}</ActionIcon> : null}
                  {action.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </Toolbar.Root>
    </TooltipProvider>
  );
}

export { ContextToolbar, MAX_TOOLBAR_ACTIONS };
export type {
  ContextToolbarAction,
  ContextToolbarPlacement,
  ContextToolbarProps,
  ContextToolbarSelection,
};
