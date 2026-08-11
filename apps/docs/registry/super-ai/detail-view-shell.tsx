"use client";

import { useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";
import { DetailTabs, type DetailTabItem } from "@/registry/super-ai/detail-tabs";
import { useContainerWidth } from "@/registry/super-ai/use-container-width";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import type { DetailMode } from "@/registry/super-ai/use-view-mode";

/* ─────────────────────────────────────────────────────────────────────────────
   DetailViewShell — the chrome around any record detail.

   Branches on `mode` into one of three primitives and renders what it is told.
   It deliberately owns NO routing: the page decides when a mode change means
   navigate(). That single restraint is what lets one shell serve every entity.
   ─────────────────────────────────────────────────────────────────────────── */

export interface DetailChannel {
  id: string;
  label: string;
  /** Tab badge; also folded into the accessible name. */
  count?: number;
  content: ReactNode;
}

export interface DetailViewShellProps {
  /** Ignored in fullscreen, where the route is the open state. */
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: DetailMode;
  header: ReactNode;
  /** Left column — what the record IS. */
  attributes: ReactNode;
  /** Right column — what HAPPENED to it. Omit for a one-column detail view. */
  conversation?: DetailChannel[];
  /** What the conversation does when there is no room for two columns. */
  collapse?: "tabs" | "stack";
  ariaLabel?: string;
  className?: string;
}

/** Two columns need roughly 320px each plus gutters. */
const TWO_COLUMN_THRESHOLD = 720;

const POPUP_HEIGHT = "h-[min(888px,90vh)]";
const POPUP_COLLAPSED = "sm:max-w-[1200px]";
const POPUP_EXPANDED = "sm:max-w-[1534px]";

/* ─────────────────────────────────────────────────────────────────────────────
   Overlay geometry.

   Upstream every utility here carried a `data-[side=right]:` prefix, and that
   prefix was load-bearing *there*: it existed to out-specify shadcn's own
   `data-[side=right]:inset-y-0 / right-0 / h-full / sm:max-w-sm`, which compile
   to `.class[data-side=right]` and beat a bare `.class` outright — silently,
   because tailwind-merge only dedupes classes whose modifier sets match, so an
   overridden utility stays in the class list looking like it applied.

   That war is over. Overlay mode is now a plain `<aside>` with no competing
   Sheet styles and no `data-side` attribute at all, so the prefixes would match
   nothing and the panel would render unpositioned. They are dropped, and this
   note stays as the record of why they were ever there — anyone reinstating a
   Sheet here has to reinstate them too.
   ─────────────────────────────────────────────────────────────────────────── */
const OVERLAY_INSET = "inset-y-2 right-2 h-auto rounded-lg";
/* Overlay mode only earns its keep while the board behind stays usable — that
   is the whole reason it is de-modalized. So the width is capped by what the
   viewport can actually spare, not just by a share of it.

   `100vw - 540px` reserves the 232px sidebar, the 8px float, and ~300px of
   live board column. `min()` lets the percentage lead on a large display and
   the reservation take over on a laptop, so one rule covers both:

     1280px  min(832, 740) =  740  → 300px of board still visible
     1512px  min(983, 972) =  972  → 300px
     1680px  min(1092,1140)= 1092  → 348px (unchanged from what shipped)
     1920px  min(1248,1380)= 1248  → 432px

   The old `min-w-[1100px]` did the opposite: on a 1280px laptop it claimed
   more than the viewport had to give, leaving ~180px of board — fullscreen
   with extra steps. Minimums here are floors the viewport can still afford.

   Below ~1180px the three-column overlay genuinely does not fit; the floor
   stops it collapsing into nonsense, but popup or fullscreen is the honest
   mode at that size. */
const OVERLAY_COLLAPSED = "w-[55vw] min-w-[520px] sm:max-w-[820px]";
const OVERLAY_EXPANDED = "w-[min(65vw,100vw_-_540px)] min-w-[640px] sm:max-w-[1320px]";

export function DetailViewShell({
  open,
  onOpenChange,
  mode,
  header,
  attributes,
  conversation,
  collapse = "tabs",
  ariaLabel,
  className,
}: DetailViewShellProps) {
  const channels = conversation ?? [];
  const hasConversation = channels.length > 0;

  const [contentRef, size] = useContainerWidth<HTMLDivElement>(TWO_COLUMN_THRESHOLD);
  const [channelId, setChannelId] = useState<string | undefined>(undefined);
  const [pane, setPane] = useState<"details" | "activity">("details");

  // Fall back rather than store a corrected value: the channel list can change
  // between renders, and writing during render would loop.
  const activeChannelId = channels.some((c) => c.id === channelId) ? (channelId as string) : channels[0]?.id;
  const activeChannel = channels.find((c) => c.id === activeChannelId);

  const collapsed = size === "narrow";
  const totalCount = channels.reduce((sum, c) => sum + (c.count ?? 0), 0);

  /* `showExpanded` used to mean "a rail is present". It now means "there is a
     conversation" — a record with one earns the wider frame in popup and
     overlay. The measured collapse is a separate question: the wider frame does
     NOT imply two columns, because overlay's floor sits below the threshold. */
  const showExpanded = hasConversation;

  const conversationPane = (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      {channels.length > 1 ? (
        <DetailTabs
          items={channels.map(({ id, label, count }): DetailTabItem => ({ id, label, count }))}
          activeId={activeChannelId as string}
          onSelect={setChannelId}
          ariaLabel="Conversation channel"
        />
      ) : null}
      <div tabIndex={0} className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        {activeChannel?.content}
      </div>
    </div>
  );

  /* tabIndex on a scrollable pane, not a decoration: a region that
     scrolls but contains no focusable element is unreachable by keyboard,
     and axe fails it (scrollable-region-focusable). An attributes list is
     exactly that case — a <dl> of plain text that overflows. */
  const attributesPane = (
    <div tabIndex={0} className="flex min-w-0 flex-1 flex-col overflow-y-auto">
      {attributes}
    </div>
  );

  let panes: ReactNode;
  if (!hasConversation) {
    panes = attributesPane;
  } else if (!collapsed) {
    panes = (
      <>
        {attributesPane}
        <div className="flex min-h-0 min-w-0 flex-1 border-l">{conversationPane}</div>
      </>
    );
  } else if (collapse === "tabs") {
    panes = (
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <DetailTabs
          items={[
            { id: "details", label: "Details" },
            {
              id: "activity",
              label: "Activity",
              count: totalCount === 0 ? undefined : totalCount,
            },
          ]}
          activeId={pane}
          onSelect={(id) => setPane(id as "details" | "activity")}
          ariaLabel="Detail section"
        />
        {pane === "details" ? attributesPane : conversationPane}
      </div>
    );
  } else {
    panes = (
      <div tabIndex={0} className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto">
        {attributes}
        <div className="flex min-h-0 flex-col border-t">
          {/* No tab names this pane when stacked, so it needs a heading. */}
          <h2 className="text-muted-foreground px-4 pt-4 text-xs font-medium tracking-wide uppercase">
            {activeChannel?.label ?? "Activity"}
          </h2>
          {conversationPane}
        </div>
      </div>
    );
  }

  const inner = (
    <div
      ref={contentRef}
      data-slot="detail-content"
      data-size={size}
      className="flex min-h-0 flex-1 overflow-hidden"
    >
      {panes}
    </div>
  );

  if (mode === "popup") {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          showCloseButton={false}
          aria-label={ariaLabel}
          className={cn(
            "flex w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden p-0 transition-[max-width] duration-200 ease-out",
            POPUP_HEIGHT,
            showExpanded ? POPUP_EXPANDED : POPUP_COLLAPSED,
            className,
          )}
        >
          <DialogTitle className="sr-only">{ariaLabel ?? "Detail view"}</DialogTitle>
          <DialogDescription className="sr-only">
            Switch how this opens using the controls in the header.
          </DialogDescription>
          {header}
          {inner}
        </DialogContent>
      </Dialog>
    );
  }

  if (mode === "overlay") {
    /* A plain docked panel, not a Sheet. This is the one deliberate deviation
       from the implementation this component was ported from, and the reason
       is worth stating.

       Upstream this was a Radix Sheet with three overrides whose combined
       effect was to switch off everything that makes a Sheet a dialog:
       `modal={false}` released the scroll-lock and the dim, a transparent
       `overlayClassName` let clicks reach the collection, and two prevented
       outside-close handlers stopped a click away from closing it. All three
       served one goal — the collection behind stays live, so clicking a second
       record SWAPS this panel's content instead of closing it.

       None of those three props exist on this repo's Sheet, which is Base UI
       rather than Radix and renders its own backdrop with no className
       passthrough. Rebuilding "a dialog with its dialog-ness disabled" on top
       of whichever primitive a consumer happens to have installed is exactly
       the kind of thing that breaks silently on the next shadcn bump.

       So overlay mode is what it always behaviourally was: an aside docked to
       the right, with no focus trap (correct — the collection is still
       operable), no scroll lock, no backdrop, and Escape to close. Popup mode
       is still a real Dialog, because popup genuinely is modal. */
    if (!open) return null;
    return (
      <aside
        data-slot="detail-view-shell"
        data-mode="overlay"
        aria-label={ariaLabel ?? "Detail view"}
        onKeyDown={(event) => {
          if (event.key !== "Escape") return;
          event.stopPropagation();
          onOpenChange(false);
        }}
        className={cn(
          "bg-popover text-popover-foreground fixed z-50 flex flex-col gap-0 border shadow-lg",
          OVERLAY_INSET,
          showExpanded ? OVERLAY_EXPANDED : OVERLAY_COLLAPSED,
          className,
        )}
      >
        {header}
        {inner}
      </aside>
    );
  }

  // fullscreen — the route page hosts this inline; the shell just fills it.
  if (!open) return null;
  return (
    <div
      data-slot="detail-view-shell"
      data-mode="fullscreen"
      aria-label={ariaLabel}
      className={cn("bg-background flex h-full flex-col", className)}
    >
      {header}
      {inner}
    </div>
  );
}

/* The public surface of this item. `DetailFields` is not imported by the shell
   — it is what a consumer renders *into* the `attributes` slot, and it ships
   here because a two-column detail body without a field list is half a
   component. Same reasoning for the width hook: the 720px collapse is the
   shell's contract, and a consumer composing its own body needs the same
   measurement rather than a second, subtly different one.

   Import-then-export, not `export … from`: shadcn rewrites the
   `@/registry/super-ai/…` prefix on import declarations only, so a re-export
   ships a path that resolves to nothing in a consumer. See the same note in
   data-views.tsx. */
import { DetailFields } from "@/registry/super-ai/detail-fields";
import { useContainerWidth as useContainerWidthImpl } from "@/registry/super-ai/use-container-width";
import type { DetailField, DetailFieldsProps } from "@/registry/super-ai/detail-fields";
import type { DetailTabsProps } from "@/registry/super-ai/detail-tabs";
import type { ContainerSize } from "@/registry/super-ai/use-container-width";

export { DetailFields, DetailTabs, useContainerWidthImpl as useContainerWidth };
export type { ContainerSize, DetailField, DetailFieldsProps, DetailTabItem, DetailTabsProps };
