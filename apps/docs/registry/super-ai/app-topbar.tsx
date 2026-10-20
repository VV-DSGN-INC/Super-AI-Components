import * as React from "react";
import { Redo2, Undo2, ZoomIn, ZoomOut } from "lucide-react";

import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ButtonGroup, ButtonGroupText } from "@/components/ui/button-group";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

/**
 * App Topbar — Breadcrumb + title + status + actions
 *
 * Spec: docs/design-system/component-specs.md#b7-app-topbar
 * States: document-context · editor-context · privacy-chip · saved-state
 *
 * One component, two configurations: document context leads with breadcrumb
 * + privacy; editor context leads with zoom + history. Also absorbs the
 * spec's old `chat-header` — a chat title bar is this with fewer slots
 * filled (just `title` + `actions`).
 */

/**
 * B7 is one row that never wraps (`h-12`), so what gives way when the bar is
 * narrow is a decision, and until these constants it was not one. Nothing
 * could collapse: `app-topbar-trailing` is `shrink-0`, the privacy `Badge` is
 * `shrink-0`, and the leading group absorbed the whole deficit. Measured at
 * 375px: every crumb rendered at zero width, and in O2 `chat-shell` the chip
 * painted over the saved-state text (chip 89..146, label from 136). A bar that
 * said "Private" about a document it could no longer name.
 *
 * Three rules now decide it, in order:
 *
 * 1. The document's name keeps a floor and truncates with an ellipsis inside
 *    it. Ancestor crumbs still shrink first, which is the right priority. The
 *    floor protects text, so an empty `title` gets none: E5's `EmptyLabel`
 *    story pins that an unnamed bar paints the title at zero width, and a
 *    4rem blank there would only push the privacy chip right for nothing.
 * 2. Below `@md` (28rem) of the bar's own width the saved-state line goes
 *    `sr-only`: still in the read order with its full text, no longer painted.
 *    It is the least load-bearing text in the row and the one a phone has no
 *    room for.
 * 3. Below the same rung, a path of three or more crumbs collapses to the
 *    first crumb, an ellipsis, and the current crumb. The middle crumbs and
 *    their separators go `display: none`, which takes them out of the
 *    accessibility tree and the tab order together, and the ellipsis is a
 *    ghost icon button (28px, the bar's own zoom and history size) that opens
 *    a menu listing them in path order: a link row for a crumb with an
 *    `href`, a disabled row for one without. A touch user taps it, a
 *    keyboard user tabs to it, a screen-reader user hears "Show hidden path"
 *    where the crumbs were. `sr-only` crumbs were the alternative and lose
 *    on all three counts: invisible tab stops or none at all, and no way for
 *    a pointer to reach an ancestor. Both forms of the path are in the DOM at
 *    every width and CSS picks one, so nothing is announced twice. The rule
 *    is depth-blind: a three-crumb path collapses into a one-row menu, because
 *    one rung is easier to hold than a rung per depth. The first crumb has no
 *    floor, so in a bar narrower still it is the next thing cut, and the
 *    current crumb's floor is the only floor.
 *
 * The second and third rules are container queries against the root
 * (`@container`), not viewport breakpoints, so a bar in a half-width pane
 * behaves like a phone and a wide pane in a narrow window does not. Same rule
 * J4 and C4 follow (D19). The variants have to sit on descendants: a container
 * query never resolves against the element that establishes it.
 */
const TITLE_FLOOR = "min-w-16";
const SAVED_COLLAPSES = "@max-md:sr-only";
const CRUMB_COLLAPSES = "@max-md:hidden";
const OVERFLOW_ITEM_SHOWS = "hidden @max-md:inline-flex";
const OVERFLOW_SEPARATOR_SHOWS = "hidden @max-md:block";

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
  /** Text-first status chip — never colour alone. Available in either context. */
  privacy?: AppTopbarPrivacy;
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

/**
 * The collapsed middle of the path: an ellipsis that opens a menu of the
 * crumbs the inline path is not painting. In the DOM at every width, painted
 * only below the rung (`OVERFLOW_ITEM_SHOWS`), and never rendered at all for a
 * path with no middle.
 */
function AppTopbarBreadcrumbOverflow({ crumbs }: { crumbs: AppTopbarCrumb[] }) {
  return (
    <>
      <BreadcrumbItem className={OVERFLOW_ITEM_SHOWS}>
        <DropdownMenu>
          <DropdownMenuTrigger
            data-slot="app-topbar-breadcrumb-overflow"
            aria-label="Show hidden path"
            render={<Button variant="ghost" size="icon-sm" />}
          >
            <BreadcrumbEllipsis />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            data-slot="app-topbar-breadcrumb-overflow-menu"
            align="start"
            className="w-56 motion-reduce:data-open:animate-none motion-reduce:data-closed:animate-none"
          >
            {crumbs.map((crumb, index) =>
              crumb.href ? (
                <DropdownMenuItem key={`${crumb.label}-${index}`} render={<a href={crumb.href} />}>
                  {crumb.label}
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem key={`${crumb.label}-${index}`} disabled>
                  {crumb.label}
                </DropdownMenuItem>
              ),
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </BreadcrumbItem>
      <BreadcrumbSeparator className={OVERFLOW_SEPARATOR_SHOWS} />
    </>
  );
}

function AppTopbarBreadcrumb({ crumbs }: { crumbs: AppTopbarCrumb[] }) {
  // Everything between the first crumb and the current one. Empty for a path
  // of one or two crumbs, which then has nothing to collapse.
  const hidden = crumbs.length > 2 ? crumbs.slice(1, -1) : [];
  return (
    <Breadcrumb data-slot="app-topbar-breadcrumb" className="min-w-0">
      <BreadcrumbList className="flex-nowrap">
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;
          const collapses = hidden.length > 0 && index > 0 && !isLast;
          return (
            <React.Fragment key={`${crumb.label}-${index}`}>
              {collapses && index === 1 ? <AppTopbarBreadcrumbOverflow crumbs={hidden} /> : null}
              <BreadcrumbItem
                className={cn("min-w-0", collapses && CRUMB_COLLAPSES, isLast && crumb.label && TITLE_FLOOR)}
              >
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
              {isLast ? null : <BreadcrumbSeparator className={cn(collapses && CRUMB_COLLAPSES)} />}
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
      className={cn("@container flex h-12 w-full items-center gap-3 border-b bg-background px-3", className)}
      {...props}
    >
      <div data-slot="app-topbar-leading" className="flex min-w-0 flex-1 items-center gap-3">
        {context === "document" ? (
          <>
            {breadcrumb?.length ? (
              <AppTopbarBreadcrumb crumbs={breadcrumb} />
            ) : (
              <span
                data-slot="app-topbar-title"
                className={cn("truncate text-sm font-medium", title && TITLE_FLOOR)}
              >
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
            <span
              data-slot="app-topbar-title"
              className={cn("truncate text-sm font-medium", title && TITLE_FLOOR)}
            >
              {title}
            </span>
          </>
        )}
        {privacy ? <AppTopbarPrivacyChip {...privacy} /> : null}
      </div>

      <div data-slot="app-topbar-trailing" className="flex shrink-0 items-center gap-3">
        {savedLabel ? (
          <span data-slot="app-topbar-saved" className={cn("text-muted-foreground text-xs", SAVED_COLLAPSES)}>
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
