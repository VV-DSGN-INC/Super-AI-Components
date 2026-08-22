"use client";

import { Tabs } from "@base-ui/react/tabs";
import { Search } from "lucide-react";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * Settings Dialog — Nav ‖ sections settings surface
 *
 * Spec: docs/design-system/component-specs.md#m1-settings-dialog
 * States: dialog · full-page · toggle-rows · destructive-rows · tier-badged-nav
 *
 * Three decisions from the spec are load-bearing and pinned by tests:
 *
 * 1. A row is label + description + control. `description` is a **required**
 *    string, not an optional nicety — a toggle with no description is a
 *    setting nobody changes.
 * 2. A destructive action renders as plain text in the control column. It is
 *    not expressible as arbitrary JSX: `destructiveAction` takes data and the
 *    component owns the rendering, so a filled `Button` cannot land beside
 *    benign toggles. This is also an a11y win — `text-destructive` on a
 *    translucent `bg-destructive/NN` measures 4.0:1, under the 4.5 minimum, so
 *    the text action carries no tint at all (see a11y-baseline.md).
 * 3. `dialog` and `full-page` share one row grid. Everything below
 *    `settings-dialog-panel` is produced by the same `SettingsRow`; the variant
 *    only changes the frame and whether search exists.
 *
 * On the base primitives:
 * - `Dialog` is the vendored one, for the `dialog` variant's frame.
 * - `Switch` is not imported here. The control column is a caller slot, so the
 *   switch (or select, or input) is supplied by the consumer and wired to the
 *   ids this component hands back.
 * - The section nav is **not** `components/ui/sidebar.tsx` and not B3
 *   `sidebar-nav`. Both model page navigation — `sidebar-nav` sets
 *   `aria-current="page"` and has no way to point at the panel it reveals.
 *   Selecting a settings section swaps a panel in place, which is
 *   tab semantics, so the nav is a real `tablist`/`tabpanel` pair with
 *   `aria-controls`/`aria-labelledby` wired by Base UI.
 * - Base UI's `Tabs` is used directly rather than `components/ui/tabs.tsx`,
 *   because that wrapper destructures `orientation` and only re-emits it as a
 *   `data-orientation` attribute — it never reaches `Tabs.Root`, so a vertical
 *   nav would keep horizontal arrow-key navigation and `aria-orientation`.
 *   Same class of dropped prop as `toggle-group`/`slider`; see CONTINUE.md §4.
 */

interface SettingsRowIds {
  /** Put this on the control: `id={controlId}`. */
  controlId: string;
  /** Point the control's `aria-labelledby` here — the row label carries the name. */
  labelId: string;
  /** Point the control's `aria-describedby` here — the row description. */
  descriptionId: string;
}

interface SettingsDestructiveActionData {
  /**
   * Self-describing on its own, e.g. "Delete account" rather than "Delete" —
   * it is the control's whole accessible name.
   */
  label: string;
  onAction?: () => void;
  disabled?: boolean;
}

interface SettingsRowBase {
  id: string;
  label: string;
  /**
   * Required on purpose. A toggle with no description is a setting nobody
   * changes: the label names the switch, the description says what flipping it
   * costs you.
   */
  description: string;
}

/**
 * A row carries exactly one of `control` (any caller-supplied control, wired to
 * the row's ids) or `destructiveAction` (data only — the component renders it
 * as text). The union is the enforcement: there is no way to hand a destructive
 * row a filled button.
 */
type SettingsRowData = SettingsRowBase &
  (
    | { control: (ids: SettingsRowIds) => React.ReactNode; destructiveAction?: never }
    | { destructiveAction: SettingsDestructiveActionData; control?: never }
  );

interface SettingsSectionData {
  id: string;
  label: string;
  /** Decorative — the label carries the accessible name. */
  icon?: React.ReactNode;
  /**
   * Plan tier this section belongs to, e.g. "Pro". Rendered as the word, never
   * as a colour or a bare dot.
   */
  tier?: string;
  rows: SettingsRowData[];
}

interface SettingsDialogProps extends Omit<React.ComponentProps<"div">, "title"> {
  sections: SettingsSectionData[];
  /**
   * `dialog` frames the same body in a modal; `full-page` renders it inline and
   * adds settings search. The row grid is identical either way.
   */
  variant?: "dialog" | "full-page";
  title?: string;
  description?: string;
  /** Controlled active section. */
  sectionId?: string;
  defaultSectionId?: string;
  onSectionChange?: (sectionId: string) => void;
  /**
   * Controlled search query. `full-page` only — a modal has nowhere to put a
   * result you cannot deep-link to.
   */
  search?: string;
  onSearchChange?: (search: string) => void;
  /**
   * Deep-link anchors are `#${anchorPrefix}-${section.id}`. Stable across
   * renders so a URL can address a section; pair it with `sectionId` so the app
   * can read the hash back into the active tab.
   */
  anchorPrefix?: string;
  /** `dialog` only. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** `dialog` only. Passed to Base UI's `render` prop, not `asChild`. */
  trigger?: React.ReactElement;
}

function SettingsDestructiveAction({ className, ...props }: React.ComponentProps<"button">) {
  return (
    <button
      type="button"
      data-slot="settings-dialog-destructive-action"
      className={cn(
        // Plain text, no fill and no tint in any state. A filled button beside
        // benign toggles reads as the primary action of the whole panel, and
        // `text-destructive` over a `bg-destructive/NN` tint is 4.0:1 — under
        // the 4.5 minimum. Hover is an underline; focus is a ring.
        "text-destructive rounded-sm text-sm font-medium underline-offset-4",
        "hover:underline focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
        "disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

function SettingsRow({ row }: { row: SettingsRowData }) {
  const uid = React.useId();
  const controlId = `${uid}-control`;
  const labelId = `${uid}-label`;
  const descriptionId = `${uid}-description`;
  const destructive = row.destructiveAction;

  const labelProps = {
    id: labelId,
    "data-slot": "settings-dialog-row-label",
    className: "block text-sm font-medium text-foreground",
  } as const;

  return (
    <div
      data-slot="settings-dialog-row"
      data-row-id={row.id}
      data-destructive={destructive ? "true" : undefined}
      className="grid grid-cols-[1fr_auto] items-start gap-4 border-b py-3 last:border-b-0"
    >
      <div data-slot="settings-dialog-row-text" className="min-w-0 space-y-0.5">
        {destructive ? (
          <span {...labelProps}>{row.label}</span>
        ) : (
          // `htmlFor` makes the label text click-to-toggle in a browser;
          // consumers are also told to set `aria-labelledby={labelId}` so the
          // name resolves identically for axe and for tests.
          <label {...labelProps} htmlFor={controlId}>
            {row.label}
          </label>
        )}
        <p
          id={descriptionId}
          data-slot="settings-dialog-row-description"
          className="text-muted-foreground text-sm"
        >
          {row.description}
        </p>
      </div>
      <div
        data-slot="settings-dialog-row-control"
        className="flex shrink-0 items-center justify-end gap-2 pt-0.5"
      >
        {destructive ? (
          <SettingsDestructiveAction
            onClick={destructive.onAction}
            disabled={destructive.disabled}
            aria-describedby={descriptionId}
          >
            {destructive.label}
          </SettingsDestructiveAction>
        ) : (
          row.control?.({ controlId, labelId, descriptionId })
        )}
      </div>
    </div>
  );
}

function matchesQuery(row: SettingsRowData, query: string) {
  if (!query) return true;
  return row.label.toLowerCase().includes(query) || row.description.toLowerCase().includes(query);
}

function SettingsDialog({
  sections,
  variant = "dialog",
  title = "Settings",
  description,
  sectionId,
  defaultSectionId,
  onSectionChange,
  search,
  onSearchChange,
  anchorPrefix = "settings",
  open,
  onOpenChange,
  trigger,
  className,
  ...props
}: SettingsDialogProps) {
  const searchId = React.useId();
  const fullPage = variant === "full-page";
  const query = fullPage ? (search ?? "").trim().toLowerCase() : "";
  const searching = query.length > 0;

  const filtered = sections.map((section) => ({
    section,
    rows: section.rows.filter((row) => matchesQuery(row, query)),
  }));
  const totalMatches = filtered.reduce((sum, entry) => sum + entry.rows.length, 0);

  const rootValue = sectionId ?? undefined;
  const rootDefaultValue = defaultSectionId ?? sections[0]?.id;

  const body = (
    <Tabs.Root
      // Vertical for real, not just visually: Base UI owns aria-orientation and
      // the arrow-key axis from this prop.
      orientation="vertical"
      value={rootValue}
      defaultValue={rootValue === undefined ? rootDefaultValue : undefined}
      onValueChange={(next) => onSectionChange?.(String(next))}
      data-slot="settings-dialog-body"
      className="flex min-h-0 flex-1 gap-4"
    >
      <Tabs.List
        data-slot="settings-dialog-nav"
        aria-label="Settings sections"
        className="flex w-44 shrink-0 flex-col gap-0.5 border-r pr-2"
      >
        {filtered.map(({ section, rows }) => (
          <Tabs.Tab
            key={section.id}
            value={section.id}
            data-slot="settings-dialog-nav-item"
            data-section-id={section.id}
            // Named outright, because name-from-content fuses adjacent spans
            // with no separator: "Billing" + "Pro" computes as "BillingPro".
            // Space-joined so the visible text stays a prefix of the name.
            aria-label={[
              section.label,
              section.tier,
              searching && rows.length > 0 ? `${rows.length} matching` : null,
            ]
              .filter(Boolean)
              .join(" ")}
            className={cn(
              "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-foreground transition-colors",
              "hover:bg-accent hover:text-accent-foreground",
              "focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
              "data-active:bg-accent data-active:font-medium data-active:text-accent-foreground",
            )}
          >
            {section.icon ? (
              <span aria-hidden className="shrink-0 [&_svg]:size-4">
                {section.icon}
              </span>
            ) : null}
            <span className="min-w-0 flex-1 truncate">{section.label}</span>
            {section.tier ? (
              // The word carries the tier. A colour or a dot would not survive
              // a screen reader or a colourblind reader.
              <Badge data-slot="settings-dialog-tier" variant="secondary">
                {section.tier}
              </Badge>
            ) : null}
            {searching && rows.length > 0 ? (
              <Badge data-slot="settings-dialog-nav-matches" variant="secondary" className="tabular-nums">
                {rows.length}
              </Badge>
            ) : null}
          </Tabs.Tab>
        ))}
      </Tabs.List>

      {filtered.map(({ section, rows }) => (
        <Tabs.Panel
          key={section.id}
          value={section.id}
          data-slot="settings-dialog-panel"
          className="focus-visible:ring-ring min-w-0 flex-1 overflow-y-auto focus-visible:ring-2 focus-visible:outline-none"
        >
          <div
            // Deep-link target. Stable across renders, so `#settings-billing`
            // addresses this section; the app reads the hash back into
            // `sectionId`. A plain div, not a <section> — the tabpanel already
            // is the region, and a nested named landmark buys nothing.
            id={`${anchorPrefix}-${section.id}`}
            data-slot="settings-dialog-section"
            data-section-id={section.id}
          >
            <h3 data-slot="settings-dialog-section-title" className="text-foreground text-sm font-semibold">
              {section.label}
            </h3>
            <div data-slot="settings-dialog-rows" className="mt-1">
              {rows.length > 0 ? (
                rows.map((row) => <SettingsRow key={row.id} row={row} />)
              ) : (
                <p data-slot="settings-dialog-empty" className="text-muted-foreground py-3 text-sm">
                  No settings in {section.label} match this search.
                </p>
              )}
            </div>
          </div>
        </Tabs.Panel>
      ))}
    </Tabs.Root>
  );

  const searchField = fullPage ? (
    <div data-slot="settings-dialog-search" className="space-y-1">
      <label htmlFor={searchId} className="sr-only">
        Search settings
      </label>
      <div className="relative">
        <Search
          aria-hidden
          className="text-muted-foreground pointer-events-none absolute top-2 left-2 size-4"
        />
        <Input
          id={searchId}
          type="search"
          value={search ?? ""}
          placeholder="Search settings"
          onChange={(event) => onSearchChange?.(event.target.value)}
          className="pl-7"
        />
      </div>
      {searching ? (
        <p role="status" data-slot="settings-dialog-search-status" className="text-muted-foreground text-xs">
          {totalMatches} {totalMatches === 1 ? "setting matches" : "settings match"} “{search?.trim()}”
        </p>
      ) : null}
    </div>
  ) : null;

  if (fullPage) {
    return (
      <div
        data-slot="settings-dialog"
        data-variant="full-page"
        className={cn("flex w-full flex-col gap-4", className)}
        {...props}
      >
        <div data-slot="settings-dialog-header" className="flex flex-col gap-1">
          <h2 className="font-heading text-base leading-none font-medium">{title}</h2>
          {description ? <p className="text-muted-foreground text-sm">{description}</p> : null}
        </div>
        {searchField}
        {body}
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger ? <DialogTrigger render={trigger} /> : null}
      {/* Overriding a vendored ui/ primitive's data-slot is house idiom. */}
      <DialogContent
        data-slot="settings-dialog"
        data-variant="dialog"
        className={cn("flex max-h-[80vh] flex-col gap-4 sm:max-w-2xl", className)}
        {...props}
      >
        <DialogHeader data-slot="settings-dialog-header">
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        {body}
      </DialogContent>
    </Dialog>
  );
}

export { SettingsDialog, SettingsDestructiveAction };
export type {
  SettingsDestructiveActionData,
  SettingsDialogProps,
  SettingsRowData,
  SettingsRowIds,
  SettingsSectionData,
};
