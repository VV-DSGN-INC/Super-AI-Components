"use client";

import { ExternalLink, Loader2 } from "lucide-react";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { SectionHeader } from "@/registry/super-ai/section-header";

/**
 * Sidebar Nav — Sectioned icon+label nav
 *
 * Spec: docs/design-system/component-specs.md#b3-sidebar-nav
 * States: count-badge · tier-badge · unread-dot · running · pinned-group
 */

interface SidebarNavItemData {
  id: string;
  label: string;
  /** Leading icon. Decorative — the label carries the accessible name. */
  icon?: React.ReactNode;
  /** Trailing numeric badge, e.g. unseen count. */
  count?: number;
  /** Trailing tier badge (e.g. "Pro"). Shows what exists — the row itself never hides or dims. */
  tier?: string;
  /** Trailing unread dot. */
  unread?: boolean;
  /** Trailing running spinner, for rows tied to a background job. */
  running?: boolean;
  /** Trailing external-link glyph. Combine with `href` to navigate out of the app. */
  external?: boolean;
  href?: string;
}

interface SidebarNavSection {
  label: React.ReactNode;
  items: SidebarNavItemData[];
}

interface SidebarNavProps extends Omit<React.ComponentProps<"nav">, "onSelect"> {
  sections: SidebarNavSection[];
  /** Rendered above every section, outside the date/section grouping entirely. */
  pinned?: SidebarNavItemData[];
  activeId?: string;
  onSelect?: (id: string) => void;
}

function SidebarNavRow({
  item,
  active,
  onSelect,
}: {
  item: SidebarNavItemData;
  active: boolean;
  onSelect?: (id: string) => void;
}) {
  // Active is a filled row, never a left border — a border is a per-side decoration
  // that a collapsed (icon-only) rail has no room to render.
  const rowClassName = cn(
    "flex w-full min-w-0 items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
    "focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
    active
      ? "bg-accent text-accent-foreground font-medium"
      : "text-foreground hover:bg-accent/60 hover:text-accent-foreground",
  );

  const trailing = (
    <span className="ml-auto flex shrink-0 items-center gap-1.5">
      {item.count !== undefined ? (
        <Badge
          data-slot="sidebar-nav-count"
          variant="secondary"
          // text-foreground, not text-muted-foreground: bg-muted +
          // text-muted-foreground is 4.34:1, under 4.5:1 (see
          // docs/design-system/a11y-baseline.md).
          className="min-w-4 justify-center bg-muted text-foreground tabular-nums"
        >
          {item.count}
        </Badge>
      ) : null}
      {item.tier ? (
        <Badge data-slot="sidebar-nav-tier" variant="secondary">
          {item.tier}
        </Badge>
      ) : null}
      {item.unread ? (
        <span
          data-slot="sidebar-nav-unread"
          aria-label="Unread"
          className="bg-primary size-2 shrink-0 rounded-full"
        />
      ) : null}
      {item.running ? (
        <Loader2
          data-slot="sidebar-nav-running"
          aria-label="Running"
          className="text-muted-foreground size-3.5 shrink-0 animate-spin"
        />
      ) : null}
      {item.external ? (
        <ExternalLink aria-hidden className="text-muted-foreground size-3.5 shrink-0" />
      ) : null}
    </span>
  );

  const content = (
    <>
      {item.icon ? (
        <span aria-hidden className="text-muted-foreground shrink-0 [&_svg]:size-4">
          {item.icon}
        </span>
      ) : null}
      <span className="min-w-0 flex-1 truncate text-left">{item.label}</span>
      {trailing}
    </>
  );

  // Two explicit branches, not a dynamic tag: an external row navigates (anchor),
  // an internal row acts (button). Never nest one interactive element inside the other.
  if (item.href) {
    return (
      <a
        href={item.href}
        target={item.external ? "_blank" : undefined}
        rel={item.external ? "noopener noreferrer" : undefined}
        onClick={() => onSelect?.(item.id)}
        data-slot="sidebar-nav-item"
        data-active={active ? "true" : "false"}
        aria-current={active ? "page" : undefined}
        className={rowClassName}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onSelect?.(item.id)}
      data-slot="sidebar-nav-item"
      data-active={active ? "true" : "false"}
      aria-current={active ? "page" : undefined}
      className={rowClassName}
    >
      {content}
    </button>
  );
}

function SidebarNav({ sections, pinned, activeId, onSelect, className, ...props }: SidebarNavProps) {
  return (
    <nav
      data-slot="sidebar-nav"
      aria-label="Sidebar"
      className={cn("flex w-full flex-col gap-4", className)}
      {...props}
    >
      {pinned && pinned.length > 0 ? (
        <div data-slot="sidebar-nav-pinned" className="flex flex-col gap-0.5">
          {pinned.map((item) => (
            <SidebarNavRow key={item.id} item={item} active={item.id === activeId} onSelect={onSelect} />
          ))}
        </div>
      ) : null}
      {sections.map((section, index) => (
        <div key={index} data-slot="sidebar-nav-section" className="flex flex-col gap-0.5">
          <SectionHeader title={section.label} size="sm" className="px-2" />
          {section.items.map((item) => (
            <SidebarNavRow key={item.id} item={item} active={item.id === activeId} onSelect={onSelect} />
          ))}
        </div>
      ))}
    </nav>
  );
}

export { SidebarNav };
export type { SidebarNavItemData, SidebarNavProps, SidebarNavSection };
