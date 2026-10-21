import * as React from "react";
import { Redo2, Undo2, ZoomIn, ZoomOut } from "lucide-react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ButtonGroup, ButtonGroupText } from "@/components/ui/button-group";
import { cn } from "@/lib/utils";

/**
 * App Topbar — Breadcrumb + title + status + actions
 *
 * Spec: docs/design-system/component-specs.md#b7-app-topbar
 * States: document-context · editor-context · privacy-chip · saved-state · private-session
 *
 * One component, two configurations: document context leads with breadcrumb
 * + privacy; editor context leads with zoom + history. Also absorbs the
 * spec's old `chat-header` — a chat title bar is this with fewer slots
 * filled (just `title` + `actions`).
 *
 * The privacy slot has a vocabulary, and it is not this file's. A private
 * session is N15's `PrivateSessionChip`; capture in progress is N13
 * `capture-consent` in its `compact` form. The host passes either, or both in
 * a fragment, as an element; this component imports neither, because L3 items
 * never depend on each other (D3). The `{ label, icon }` object stays for the
 * document's own visibility word ("Team", "Private").
 */

interface AppTopbarCrumb {
  label: string;
  href?: string;
}

interface AppTopbarPrivacy {
  label: string;
  /** Optional glyph alongside the label. Never the only signal — the label text always renders. */
  icon?: React.ReactNode;
}

interface AppTopbarProps extends Omit<React.ComponentProps<"header">, "title"> {
  /** Which lead configuration to render: breadcrumb+privacy, or zoom+history. */
  context: "document" | "editor";
  /** Document or file name. Renders as the trailing breadcrumb crumb in document context, or beside zoom/history in editor context. */
  title: string;
  /** Document context only — omit to fall back to a plain title. */
  breadcrumb?: AppTopbarCrumb[];
  /**
   * The privacy slot, in either context. An element renders as given: N15's
   * `PrivateSessionChip`, N13's `compact` capture-consent chip, or both in a
   * fragment. The `{ label, icon }` object draws this bar's own text-first
   * chip for the document's visibility. Never colour alone, in either form.
   */
  privacy?: AppTopbarPrivacy | React.ReactElement;
  /** Rendered verbatim as text, e.g. "Last saved 5 days ago" — a cloud glyph only raises the question this answers. */
  savedLabel?: string;
  /** Editor context — current zoom, shown as text between the in/out controls. */
  zoomLabel?: string;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  /** Trailing custom controls (share, export, presence, …). */
  actions?: React.ReactNode;
}

function AppTopbarPrivacyChip({ label, icon }: AppTopbarPrivacy) {
  return (
    <Badge data-slot="app-topbar-privacy" variant="secondary" className="gap-1">
      {icon ? (
        <span aria-hidden="true" className="[&>svg]:size-3">
          {icon}
        </span>
      ) : null}
      {label}
    </Badge>
  );
}

function AppTopbarBreadcrumb({ crumbs }: { crumbs: AppTopbarCrumb[] }) {
  return (
    <Breadcrumb data-slot="app-topbar-breadcrumb" className="min-w-0">
      <BreadcrumbList className="flex-nowrap">
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;
          return (
            <React.Fragment key={`${crumb.label}-${index}`}>
              <BreadcrumbItem className="min-w-0">
                {isLast ? (
                  <BreadcrumbPage className="truncate">{crumb.label}</BreadcrumbPage>
                ) : crumb.href ? (
                  <BreadcrumbLink href={crumb.href} className="truncate">
                    {crumb.label}
                  </BreadcrumbLink>
                ) : (
                  <span className="truncate">{crumb.label}</span>
                )}
              </BreadcrumbItem>
              {isLast ? null : <BreadcrumbSeparator />}
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

function AppTopbar({
  context,
  title,
  breadcrumb,
  privacy,
  savedLabel,
  zoomLabel,
  onZoomIn,
  onZoomOut,
  onUndo,
  onRedo,
  canUndo = true,
  canRedo = true,
  actions,
  className,
  ...props
}: AppTopbarProps) {
  return (
    <header
      data-slot="app-topbar"
      className={cn("flex h-12 w-full items-center gap-3 border-b bg-background px-3", className)}
      {...props}
    >
      <div data-slot="app-topbar-leading" className="flex min-w-0 flex-1 items-center gap-3">
        {context === "document" ? (
          <>
            {breadcrumb?.length ? (
              <AppTopbarBreadcrumb crumbs={breadcrumb} />
            ) : (
              <span data-slot="app-topbar-title" className="truncate text-sm font-medium">
                {title}
              </span>
            )}
          </>
        ) : (
          <>
            <ButtonGroup data-slot="app-topbar-zoom">
              <Button variant="outline" size="icon-sm" aria-label="Zoom out" onClick={onZoomOut}>
                <ZoomOut />
              </Button>
              {zoomLabel ? <ButtonGroupText className="h-7 px-2 text-xs">{zoomLabel}</ButtonGroupText> : null}
              <Button variant="outline" size="icon-sm" aria-label="Zoom in" onClick={onZoomIn}>
                <ZoomIn />
              </Button>
            </ButtonGroup>
            <ButtonGroup data-slot="app-topbar-history">
              <Button variant="outline" size="icon-sm" aria-label="Undo" onClick={onUndo} disabled={!canUndo}>
                <Undo2 />
              </Button>
              <Button variant="outline" size="icon-sm" aria-label="Redo" onClick={onRedo} disabled={!canRedo}>
                <Redo2 />
              </Button>
            </ButtonGroup>
            <span data-slot="app-topbar-title" className="truncate text-sm font-medium">
              {title}
            </span>
          </>
        )}
        {React.isValidElement(privacy) ? privacy : null}
        {privacy && !React.isValidElement(privacy) ? <AppTopbarPrivacyChip {...privacy} /> : null}
      </div>

      <div data-slot="app-topbar-trailing" className="flex shrink-0 items-center gap-3">
        {savedLabel ? (
          <span data-slot="app-topbar-saved" className="text-muted-foreground text-xs">
            {savedLabel}
          </span>
        ) : null}
        {actions ? (
          <div data-slot="app-topbar-actions" className="flex items-center gap-2">
            {actions}
          </div>
        ) : null}
      </div>
    </header>
  );
}

export { AppTopbar };
export type { AppTopbarProps, AppTopbarCrumb, AppTopbarPrivacy };
