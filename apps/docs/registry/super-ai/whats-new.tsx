"use client";

import { Tabs as TabsPrimitive } from "@base-ui/react/tabs";
import { Sparkles } from "lucide-react";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

/**
 * Whats New — Changelog browser
 *
 * Spec: docs/design-system/component-specs.md#l4-whats-new
 * States: entry-list · entry-detail · unread · entry-cta
 */

interface WhatsNewEntryCta {
  label: string;
  /**
   * Runs in the app. There is deliberately no `href`: the CTA lands the user
   * *in* the feature (open the panel, switch the mode, start the flow) — it is
   * not a link out to a marketing page.
   */
  onAction: () => void;
}

interface WhatsNewEntry {
  id: string;
  title: string;
  /** Display date, e.g. "12 March 2026". Always rendered — in the list and in the detail. */
  date: string;
  /** Optional machine-readable date; renders the display date inside a <time>. */
  dateTime?: string;
  /** One line under the title in the detail pane. */
  summary?: string;
  /** Stage or version badge: "New", "Beta", "Preview", "v2.4". */
  stage?: string;
  /** Hero media — image, video, animation. This is what does the explaining. */
  media?: React.ReactNode;
  /** Long-form body under the summary. */
  body?: React.ReactNode;
  /**
   * Whether this entry is still unread *for the current user*. The host owns
   * this: the component never persists anything, it only reports reads
   * through `onEntryRead`.
   */
  unread?: boolean;
  cta?: WhatsNewEntryCta;
}

interface WhatsNewProps
  extends Omit<React.ComponentProps<"div">, "onSelect" | "title" | "defaultValue"> {
  entries: WhatsNewEntry[];
  /** Dialog heading. */
  title?: string;
  /** Optional line under the heading. */
  description?: string;
  /** Label on the built-in trigger, which also carries the unread badge. */
  triggerLabel?: string;
  /**
   * Replace the built-in trigger. Pass `null` for no trigger at all — the
   * right choice when the host opens the dialog itself via `open`.
   */
  trigger?: React.ReactElement | null;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Controlled selected entry id. */
  selectedId?: string;
  defaultSelectedId?: string;
  onSelect?: (id: string) => void;
  /**
   * Fired once per open session for each unread entry the user actually lands
   * on — including the one shown when the dialog opens. Clear that entry's
   * `unread` in response and the trigger badge drops by one.
   */
  onEntryRead?: (id: string) => void;
}

function WhatsNew({
  entries,
  title = "What's new",
  description,
  triggerLabel = "What's new",
  trigger,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  selectedId: selectedIdProp,
  defaultSelectedId,
  onSelect,
  onEntryRead,
  className,
  ...props
}: WhatsNewProps) {
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen);
  const open = openProp ?? internalOpen;

  const firstId = entries[0]?.id;
  const [internalId, setInternalId] = React.useState<string | undefined>(
    defaultSelectedId ?? firstId,
  );
  const selectedId = selectedIdProp ?? internalId ?? firstId;

  const unreadCount = entries.reduce((n, entry) => (entry.unread ? n + 1 : n), 0);

  function handleOpenChange(next: boolean) {
    if (openProp === undefined) setInternalOpen(next);
    onOpenChange?.(next);
  }

  function handleValueChange(value: unknown) {
    const id = String(value);
    if (selectedIdProp === undefined) setInternalId(id);
    onSelect?.(id);
  }

  // Reading is reported from an effect, not from the click handler, because
  // the entry on screen when the dialog opens has been read too — a badge that
  // can never reach zero is worse than one that clears a beat early. The ref
  // makes it at-most-once per (open session, entry), so a host that sets state
  // in response can't drive a render loop.
  const reportedRef = React.useRef<Set<string>>(new Set());

  React.useEffect(() => {
    if (!open) {
      reportedRef.current = new Set();
      return;
    }
    if (!selectedId || reportedRef.current.has(selectedId)) return;
    reportedRef.current.add(selectedId);
    if (entries.find((entry) => entry.id === selectedId)?.unread) {
      onEntryRead?.(selectedId);
    }
  }, [open, selectedId, entries, onEntryRead]);

  const defaultTrigger = (
    <Button variant="outline" data-slot="whats-new-trigger">
      <Sparkles aria-hidden />
      {triggerLabel}
      {unreadCount > 0 ? (
        <Badge data-slot="whats-new-trigger-badge" className="min-w-4 justify-center tabular-nums">
          {unreadCount}
          {/* The badge is never colour-alone or count-alone: it names itself. */}
          <span className="sr-only"> unread</span>
        </Badge>
      ) : null}
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger === null ? null : <DialogTrigger render={trigger ?? defaultTrigger} />}
      <DialogContent
        data-slot="whats-new"
        className={cn("flex h-[30rem] max-h-[85vh] flex-col gap-3 sm:max-w-3xl", className)}
        {...props}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        {entries.length > 0 ? (
          // Base UI directly, not @/components/ui/tabs: that wrapper
          // destructures `orientation` and never forwards it, so the list would
          // render as a column while announcing itself horizontal and still
          // answering only to Left/Right. The two panes are a tablist and a
          // tabpanel — programmatically associated, not two loose divs — and
          // Base UI's Panel carries tabIndex={0}, which is what keeps the
          // scrollable detail pane keyboard-reachable.
          <TabsPrimitive.Root
            value={selectedId}
            onValueChange={handleValueChange}
            orientation="vertical"
            data-slot="whats-new-panes"
            className="flex min-h-0 flex-1 gap-4"
          >
            <TabsPrimitive.List
              data-slot="whats-new-list"
              aria-label="Updates"
              className="flex w-44 shrink-0 flex-col gap-0.5 overflow-y-auto border-r pr-2 sm:w-56"
            >
              {entries.map((entry) => {
                const selected = entry.id === selectedId;
                return (
                  <TabsPrimitive.Tab
                    key={entry.id}
                    value={entry.id}
                    data-slot="whats-new-entry"
                    className={cn(
                      "flex w-full shrink-0 flex-col items-start gap-0.5 rounded-md px-2 py-1.5 text-left transition-colors",
                      "focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
                      selected
                        ? "bg-accent text-accent-foreground"
                        : "text-foreground hover:bg-accent/60 hover:text-accent-foreground",
                    )}
                  >
                    <span className="flex w-full items-center gap-2">
                      <span
                        className={cn(
                          "min-w-0 flex-1 truncate text-sm",
                          entry.unread ? "font-semibold" : "font-medium",
                        )}
                      >
                        {entry.title}
                      </span>
                      {entry.unread ? (
                        <span
                          data-slot="whats-new-unread"
                          className="bg-primary size-2 shrink-0 rounded-full"
                        >
                          <span className="sr-only">Unread</span>
                        </span>
                      ) : null}
                    </span>
                    <span
                      data-slot="whats-new-entry-date"
                      className={cn(
                        "text-xs",
                        selected ? "text-accent-foreground" : "text-muted-foreground",
                      )}
                    >
                      {entry.dateTime ? <time dateTime={entry.dateTime}>{entry.date}</time> : entry.date}
                    </span>
                  </TabsPrimitive.Tab>
                );
              })}
            </TabsPrimitive.List>
            {entries.map((entry) => (
              <TabsPrimitive.Panel
                key={entry.id}
                value={entry.id}
                data-slot="whats-new-detail"
                className="flex min-w-0 flex-1 flex-col gap-3 overflow-y-auto pr-1 outline-none"
              >
                {entry.media ? (
                  <div
                    data-slot="whats-new-media"
                    className="bg-muted overflow-hidden rounded-lg [&>*]:block [&>*]:w-full"
                  >
                    {entry.media}
                  </div>
                ) : null}
                <div className="flex flex-wrap items-center gap-2">
                  {entry.stage ? (
                    <Badge data-slot="whats-new-stage" variant="secondary">
                      {entry.stage}
                    </Badge>
                  ) : null}
                  {/* text-foreground/70, not text-muted-foreground: the hero
                      media wrapper above is bg-muted, and muted-on-muted is
                      the 4.34:1 pairing this registry keeps failing. */}
                  <span data-slot="whats-new-date" className="text-foreground/70 text-xs">
                    {entry.dateTime ? <time dateTime={entry.dateTime}>{entry.date}</time> : entry.date}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <h3 data-slot="whats-new-title" className="font-heading text-base font-medium">
                    {entry.title}
                  </h3>
                  {entry.summary ? <p className="text-foreground text-sm">{entry.summary}</p> : null}
                </div>
                {entry.body ? (
                  <div data-slot="whats-new-body" className="text-foreground text-sm">
                    {entry.body}
                  </div>
                ) : null}
                {entry.cta ? (
                  <Button
                    type="button"
                    size="sm"
                    data-slot="whats-new-cta"
                    className="mt-auto self-start"
                    onClick={entry.cta.onAction}
                  >
                    {entry.cta.label}
                  </Button>
                ) : null}
              </TabsPrimitive.Panel>
            ))}
          </TabsPrimitive.Root>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

export { WhatsNew };
export type { WhatsNewEntry, WhatsNewEntryCta, WhatsNewProps };
