"use client";

import * as React from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { EntityRow } from "@/registry/super-ai/entity-row";

/**
 * Workspace Switcher — Avatar/logo + name dropdown
 *
 * Spec: docs/design-system/component-specs.md#b2-workspace-switcher
 * States: workspace-list · multi-product · with-plan-badge
 */

interface WorkspaceSwitcherWorkspace {
  id: string;
  name: string;
  /** Rendered on both the trigger (for the current workspace) and its row. */
  plan?: string;
  /** Presence of a description on ANY workspace switches the whole list into entity-row mode. */
  description?: string;
  icon?: React.ReactNode;
}

interface WorkspaceSwitcherProps extends Omit<React.ComponentProps<"div">, "onSelect"> {
  workspaces: WorkspaceSwitcherWorkspace[];
  currentId: string;
  onSelect: (id: string) => void;
  /** Omit to hide creation entirely — it never appears as a "+" on the trigger. */
  onCreate?: () => void;
  createLabel?: string;
}

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function WorkspaceSwitcherAvatar({
  name,
  icon,
  className,
}: {
  name: string;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      data-slot="workspace-switcher-avatar"
      aria-hidden="true"
      // text-muted-foreground on bg-muted is only 4.34:1 — under the 4.5:1
      // text needs. aria-hidden hides it from AT, but sighted users still
      // read these initials, so the contrast requirement is real. The
      // background stays bg-muted (unchanged tint); only the foreground
      // moves to text-foreground, which clears 4.5:1 with a wide margin
      // (~18:1) against the same bg-muted fill.
      className={cn(
        "bg-muted text-foreground flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-medium",
        className,
      )}
    >
      {icon ?? initials(name)}
    </span>
  );
}

function WorkspaceSwitcher({
  workspaces,
  currentId,
  onSelect,
  onCreate,
  createLabel = "Create workspace",
  className,
  ...props
}: WorkspaceSwitcherProps) {
  const current = workspaces.find((workspace) => workspace.id === currentId) ?? workspaces[0];
  // One list, two renderings: descriptions push every row through EntityRow so
  // the switcher never mixes plain rows with entity rows in the same menu.
  const hasDescriptions = workspaces.some((workspace) => workspace.description);

  return (
    <div data-slot="workspace-switcher" className={cn("inline-flex", className)} {...props}>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              data-slot="workspace-switcher-trigger"
              variant="outline"
              className="h-auto max-w-64 justify-start gap-2 px-2 py-1.5"
            />
          }
        >
          <WorkspaceSwitcherAvatar name={current?.name ?? ""} icon={current?.icon} />
          <span data-slot="workspace-switcher-trigger-name" className="truncate text-sm font-medium">
            {current?.name ?? "Select workspace"}
          </span>
          {current?.plan ? (
            // The cheapest upgrade prompt in the shell — always visible on the
            // trigger, not only inside the open menu.
            <span
              data-slot="workspace-switcher-plan-badge"
              // `ms-auto`, not `ml-auto`: the badge belongs at the trigger's
              // logical end. A physical `margin-left: auto` under `dir="rtl"`
              // absorbs the free space on the side the badge is already
              // against, so the badge stays welded to the name instead of
              // moving to the row's end. Compiles to the same declaration in
              // LTR. Inert at the trigger's shrink-wrapped width — see the
              // `RTL` story, which records where it starts mattering.
              className="bg-primary/10 text-primary ms-auto shrink-0 rounded-full px-1.5 py-0.5 text-[0.65rem] font-medium"
            >
              {current.plan}
            </span>
          ) : null}
        </DropdownMenuTrigger>

        {/* The variant is restated on both halves on purpose. A bare
            `motion-reduce:animate-none` is inert against a Base UI popup:
            it and `data-open:animate-in` compile to a single class each, so
            the tie falls to emission order and Tailwind emits the plain
            `motion-reduce:` block first. Matching the variant sorts after
            its counterpart and wins. Same fix as `shortcuts-sheet`; the
            `ReducedMotion` story reads `animation-name` back rather than
            trusting the class. */}
        <DropdownMenuContent className="w-72 motion-reduce:data-open:animate-none motion-reduce:data-closed:animate-none">
          <DropdownMenuRadioGroup
            value={currentId}
            onValueChange={(value) => onSelect(value as string)}
          >
            {workspaces.map((workspace) =>
              hasDescriptions ? (
                <DropdownMenuRadioItem
                  key={workspace.id}
                  value={workspace.id}
                  closeOnClick
                  data-slot="workspace-switcher-item"
                  className="p-0"
                >
                  <EntityRow
                    icon={<WorkspaceSwitcherAvatar name={workspace.name} icon={workspace.icon} />}
                    title={workspace.name}
                    description={workspace.description}
                    trailing={
                      workspace.plan ? (
                        <span className="text-muted-foreground text-xs">{workspace.plan}</span>
                      ) : undefined
                    }
                    className="min-h-0 py-1.5"
                  />
                </DropdownMenuRadioItem>
              ) : (
                <DropdownMenuRadioItem
                  key={workspace.id}
                  value={workspace.id}
                  closeOnClick
                  data-slot="workspace-switcher-item"
                >
                  <WorkspaceSwitcherAvatar name={workspace.name} icon={workspace.icon} />
                  <span className="flex-1 truncate">{workspace.name}</span>
                  {workspace.plan ? (
                    <span className="text-muted-foreground text-xs">{workspace.plan}</span>
                  ) : null}
                </DropdownMenuRadioItem>
              ),
            )}
          </DropdownMenuRadioGroup>

          {onCreate ? (
            <>
              {/* Creation always sits last, below a rule — never a "+" competing
                  with the trigger for the user's attention. */}
              <DropdownMenuSeparator data-slot="workspace-switcher-separator" />
              <DropdownMenuItem data-slot="workspace-switcher-create" onClick={onCreate}>
                <Plus aria-hidden />
                {createLabel}
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export { WorkspaceSwitcher };
export type { WorkspaceSwitcherProps, WorkspaceSwitcherWorkspace };
