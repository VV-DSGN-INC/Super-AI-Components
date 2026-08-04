"use client";

import * as React from "react";
import { ChevronDown, Crown } from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/**
 * Modality Rail — Vertical icon+label tool switcher for editors
 *
 * Spec: docs/design-system/component-specs.md#b4-modality-rail
 * States: active · overflow · with-badge · bottom-pinned
 */

interface ModalityRailItemData {
  id: string;
  label: string;
  icon: React.ReactNode;
  /**
   * "new" renders a dot mark, "pro" renders a crown mark. Both carry a
   * visually-hidden name of their own baked into the button's accessible
   * name — never a tooltip-only announcement.
   */
  badge?: "new" | "pro";
}

interface ModalityRailProps extends Omit<React.ComponentProps<"div">, "onSelect"> {
  items: ModalityRailItemData[];
  /**
   * Settings, plugins, help — rendered as a separate group below the
   * scrollable middle. Never merge these into `items`; the pinned group
   * must survive independently of however much the middle grows.
   */
  pinned?: ModalityRailItemData[];
  activeId?: string;
  onSelect?: (id: string) => void;
  /** Items beyond this count collapse behind the overflow chevron instead of a scrollbar. */
  maxVisible?: number;
  overflowLabel?: string;
}

/**
 * The visual dot/crown mark only — always rendered inside an aria-hidden icon
 * wrapper, so it carries no text of its own. The badge's discernible name
 * (" New" / " Pro") is appended by the caller as a sibling of the icon
 * wrapper, outside the aria-hidden subtree, so it survives into the button's
 * accessible name instead of being swallowed by it.
 */
function ModalityRailBadge({ type }: { type: "new" | "pro" }) {
  if (type === "pro") {
    return (
      <span
        data-slot="modality-rail-badge"
        data-badge="pro"
        className="bg-primary text-primary-foreground absolute -top-1 -right-1.5 flex size-3.5 items-center justify-center rounded-full"
      >
        <Crown aria-hidden="true" className="size-2.5" />
      </span>
    );
  }
  return (
    <span
      data-slot="modality-rail-badge"
      data-badge="new"
      className="border-background bg-primary absolute -top-0.5 -right-0.5 size-2.5 rounded-full border-2"
    />
  );
}

function ModalityRailButton({
  item,
  layout = "stacked",
}: {
  item: ModalityRailItemData;
  /** "stacked" for the 92px column, "row" for the overflow popover list. */
  layout?: "stacked" | "row";
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <ToggleGroupItem
            value={item.id}
            data-slot="modality-rail-item"
            className={cn(
              "text-foreground hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring relative flex rounded-lg focus-visible:ring-2 focus-visible:outline-none",
              layout === "stacked"
                ? "w-full flex-col items-center gap-1 px-2 py-2.5 text-center"
                : "w-full items-center gap-2 px-2 py-1.5 text-left",
            )}
          />
        }
      >
        <span
          aria-hidden="true"
          className={cn(
            "relative flex items-center justify-center [&_svg]:size-full",
            layout === "stacked" ? "size-5" : "size-4 shrink-0",
          )}
        >
          {item.icon}
          {item.badge ? <ModalityRailBadge type={item.badge} /> : null}
        </span>
        <span className={cn("truncate", layout === "stacked" ? "w-full text-[11px] leading-tight" : "flex-1 text-sm")}>
          {item.label}
        </span>
        {item.badge ? <span className="sr-only">{item.badge === "pro" ? " Pro" : " New"}</span> : null}
      </TooltipTrigger>
      <TooltipContent side="right">{item.label}</TooltipContent>
    </Tooltip>
  );
}

function ModalityRail({
  items,
  pinned,
  activeId,
  onSelect,
  maxVisible = 6,
  overflowLabel = "More tools",
  className,
  ...props
}: ModalityRailProps) {
  const [overflowOpen, setOverflowOpen] = React.useState(false);
  const visibleItems = items.slice(0, maxVisible);
  const overflowItems = items.slice(maxVisible);
  const hasOverflow = overflowItems.length > 0;
  const value = React.useMemo(() => (activeId ? [activeId] : []), [activeId]);

  // Controlled by activeId: only forward a change when a *new* item is
  // pressed. Base UI's toggle group reports an empty array when the user
  // clicks the already-active item (it's a toggle, not a radio) — ignoring
  // that keeps the rail from ever landing on "nothing selected".
  const handleValueChange = React.useCallback(
    (next: string[]) => {
      const [id] = next;
      if (id) onSelect?.(id);
    },
    [onSelect],
  );

  return (
    <TooltipProvider>
      <div
        data-slot="modality-rail"
        className={cn("bg-background flex w-[92px] shrink-0 flex-col justify-between border-r", className)}
        {...props}
      >
        <div data-slot="modality-rail-scroll" className="flex flex-col items-stretch gap-1 p-1.5">
          <ToggleGroup
            orientation="vertical"
            // The underlying primitive renders role="group", which per the ARIA
            // spec (and axe's aria-allowed-attr rule) does not support
            // aria-orientation at all — the attribute name itself is invalid on
            // this role, independent of its value. Suppress it explicitly
            // rather than relying on the primitive's default.
            aria-orientation={undefined}
            value={value}
            onValueChange={handleValueChange}
            className="flex w-full flex-col gap-1"
          >
            {visibleItems.map((item) => (
              <ModalityRailButton key={item.id} item={item} />
            ))}
          </ToggleGroup>

          {hasOverflow ? (
            <Popover open={overflowOpen} onOpenChange={setOverflowOpen}>
              <PopoverTrigger
                render={
                  <button
                    type="button"
                    data-slot="modality-rail-overflow"
                    aria-label={overflowLabel}
                    className="text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring flex w-full flex-col items-center gap-0.5 rounded-lg px-2 py-2 text-center focus-visible:ring-2 focus-visible:outline-none"
                  />
                }
              >
                <ChevronDown aria-hidden="true" className="size-4" />
                <span className="text-[11px] leading-tight">{overflowLabel}</span>
              </PopoverTrigger>
              <PopoverContent side="right" align="start" className="w-48 gap-1 p-1">
                <ToggleGroup
                  orientation="vertical"
                  aria-orientation={undefined}
                  value={value}
                  onValueChange={(next) => {
                    handleValueChange(next);
                    if (next[0]) setOverflowOpen(false);
                  }}
                  className="flex w-full flex-col gap-0.5"
                >
                  {overflowItems.map((item) => (
                    <ModalityRailButton key={item.id} item={item} layout="row" />
                  ))}
                </ToggleGroup>
              </PopoverContent>
            </Popover>
          ) : null}
        </div>

        {pinned && pinned.length > 0 ? (
          <div data-slot="modality-rail-pinned" className="flex flex-col items-stretch gap-1 p-1.5">
            <Separator />
            <ToggleGroup
              orientation="vertical"
              aria-orientation={undefined}
              value={value}
              onValueChange={handleValueChange}
              className="flex w-full flex-col gap-1 pt-1"
            >
              {pinned.map((item) => (
                <ModalityRailButton key={item.id} item={item} />
              ))}
            </ToggleGroup>
          </div>
        ) : null}
      </div>
    </TooltipProvider>
  );
}

export { ModalityRail };
export type { ModalityRailItemData, ModalityRailProps };
