"use client";

import { Check, Copy, Search, SlidersHorizontal } from "lucide-react";
import * as React from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/registry/super-ai/empty-state";
import { MemberGateRow, type MemberGateRowProps } from "@/registry/super-ai/member-gate-row";
import { PricingTable, type PricingTableProps } from "@/registry/super-ai/pricing-table";
import { QuotaMeter, type QuotaMeterResource } from "@/registry/super-ai/quota-meter";
import { SettingsDialog, type SettingsRowData } from "@/registry/super-ai/settings-dialog";
import { SidebarNav, type SidebarNavSection } from "@/registry/super-ai/sidebar-nav";

/**
 * Settings Shell — full-page settings
 *
 * Spec: docs/design-system/block-specs.md#o12-settings-shell
 * Regions: grouped-nav · breadcrumb · info-callout · setting-sections · code-block
 *
 * Five regions, not six: the spec's `Regions:` line reads "search + grouped
 * nav" as one thing, and it is one thing. Search is not chrome bolted onto the
 * nav — it is what the nav degrades into past about twenty settings, so the two
 * share a column and a region.
 *
 * Three sentences from the spec drive the arrangement:
 *
 * 1. "Settings search is mandatory past about twenty settings. Grouped nav
 *    alone stops scaling exactly where products stop caring." Search therefore
 *    ships in the default composition rather than behind a prop, and it is
 *    *global*: the match count lands on every nav row (B3's own `count` badge),
 *    not only on the section you happen to be reading. A search that can only
 *    find settings in the section you already opened is not the affordance the
 *    spec is asking for.
 * 2. "Tier badges in the nav are a paywall placement as much as a label." B3
 *    carries the badge, E7 carries the gated rows the badge is promising, and
 *    M4 carries the plan comparison the upgrade lands on — one mechanism across
 *    three components, which is why all three are composed rather than one
 *    generic "locked" style.
 * 3. "Sections are deep-linkable. 'Go to Settings → Workspace → MCP' has to be
 *    a URL." Every nav row is an `<a href="#settings-…">` with
 *    `aria-current="page"`, and M1's `anchorPrefix` puts the matching `id` on
 *    the section it reveals. This is the reason the page nav is B3 and not M1's
 *    own tablist — see SECTION_NAV_BELONGS_TO_THE_PAGE.
 *
 * The shell owns arrangement, a search field, a copy-ready code block and
 * nothing else. Everything else is M1, B3, E7, M3, M4, B8 and L1, each keeping
 * its own props, state model and accessibility contract.
 */

/**
 * M1's `full-page` variant bundles its own section nav — a real vertical
 * `tablist`, which is the right semantic for a dialog that swaps a panel in
 * place. O12 is not that: its sections are pages with URLs, and a tab cannot be
 * a URL or claim `aria-current="page"`. The spec names B3 in `Filled by:`
 * precisely because the page-level nav is B3's job, so M1's nav is suppressed
 * here rather than rendered twice.
 *
 * `hidden` and not `sr-only`: leaving it in the accessibility tree would give
 * every section two independent controls with the same name, one of which does
 * not update the URL. Delete this the moment M1 grows a real opt-out
 * (`nav={false}`, or a `chrome` prop on the full-page variant).
 */
const SECTION_NAV_BELONGS_TO_THE_PAGE = "[&_[data-slot=settings-dialog-nav]]:hidden";

/**
 * M1's `full-page` variant also renders its own search field, directly above
 * its nav. The spec puts search in the nav column, and M1 exposes no way to
 * render one without the other. The field is suppressed and the shell renders
 * its own in `grouped-nav` — but the *filtering* is still entirely M1's: the
 * shell only forwards `search`, and M1 decides which rows survive it and
 * renders its own per-section "nothing matched" line.
 *
 * Delete this alongside SECTION_NAV_BELONGS_TO_THE_PAGE when M1 can be asked
 * for its body without its chrome.
 */
const SEARCH_BELONGS_TO_THE_NAV_COLUMN = "[&_[data-slot=settings-dialog-search]]:hidden";

interface SettingsShellCallout {
  title?: React.ReactNode;
  /** What this section's settings actually reach. The callout's whole job. */
  description: React.ReactNode;
  /** `destructive` for a section that can break something — "Danger zone". */
  variant?: "default" | "destructive";
}

interface SettingsShellCode {
  /** Names the block: "MCP server configuration", "Environment variables". */
  label: string;
  /** The snippet, already formatted. This registry ships UI, not a formatter. */
  value: string;
  /** Shown beside the label, e.g. "json". Decorative — the label carries the name. */
  language?: string;
  /** Overrides the copy button's accessible name. Must name what is copied. */
  copyLabel?: string;
}

/**
 * An E7 row. `label` and `description` are narrowed to `string` because settings
 * search has to be able to read them — a gated feature that search cannot find
 * is exactly the twenty-settings failure the spec is about.
 */
type SettingsShellGatedFeature = Omit<MemberGateRowProps, "label" | "description" | "id"> & {
  id: string;
  label: string;
  description?: string;
};

interface SettingsShellSection {
  id: string;
  label: string;
  /** Nav group heading — "Account", "Workspace", "Billing". B3 groups on it. */
  group: string;
  /** Decorative leading glyph. The label carries the accessible name. */
  icon?: React.ReactNode;
  /** Plan tier, rendered as the word in B3's badge. Never a colour or a dot. */
  tier?: string;
  /** M1 rows: label + required description + one control, or a destructive action. */
  rows?: SettingsRowData[];
  /** Fills the `info-callout` region while this section is active. */
  callout?: SettingsShellCallout;
  /** E7 rows: the features this section's tier badge is promising. */
  gated?: SettingsShellGatedFeature[];
  gatedLabel?: React.ReactNode;
  /** M4, for the section where the upgrade actually happens. */
  pricing?: PricingTableProps;
  /** Fills the `code-block` region while this section is active. */
  code?: SettingsShellCode;
}

interface SettingsShellProps extends Omit<React.ComponentProps<"div">, "title"> {
  /** Page title, forwarded to M1's own header so there is one h2, not two. */
  title?: string;
  description?: string;
  sections?: SettingsShellSection[];

  /** Controlled active section. Omit for uncontrolled. */
  sectionId?: string;
  defaultSectionId?: string;
  onSectionChange?: (sectionId: string) => void;

  /** Controlled search query. Omit for uncontrolled — the field still works. */
  search?: string;
  defaultSearch?: string;
  onSearchChange?: (search: string) => void;
  searchLabel?: string;
  searchPlaceholder?: string;

  /**
   * Deep-link anchors are `#${anchorPrefix}-${section.id}`, on both the nav row
   * and the section it reveals. Keep it stable: it is the URL.
   */
  anchorPrefix?: string;

  /** M3 in the nav column, compact. The paywall's evidence, beside its badges. */
  usage?: QuotaMeterResource[];
  usageLabel?: React.ReactNode;

  /** B8 account menu, or anything else that belongs beside the breadcrumb. */
  accountMenu?: React.ReactNode;

  /** First breadcrumb crumb. */
  rootLabel?: string;
  rootHref?: string;
  navLabel?: string;
  contentLabel?: string;

  /** Shown in `info-callout` when the active section declares none. */
  calloutFallback?: SettingsShellCallout;
  /** Replaces the default L1 when there are no sections at all. */
  empty?: React.ReactNode;
  /** Replaces the default L1 in the nav column when there are no sections. */
  navEmpty?: React.ReactNode;
  codeEmptyLabel?: React.ReactNode;
  codeFallbackLabel?: React.ReactNode;
}

/** Case-insensitive substring match over the text a reader can actually see. */
function matchesQuery(haystack: (string | undefined)[], query: string) {
  if (!query) return true;
  return haystack.some((text) => text?.toLowerCase().includes(query));
}

/**
 * The registry has no copy-ready code block — `run-inspector` keeps one
 * privately for its JSON panes and nothing exposes it. Recreated here to the
 * same shape rather than restyling a component that was never meant to be
 * reused; see the docs page for the recommended source fix.
 *
 * `aria-label` deliberately does not flip to "Copied": a focused button whose
 * accessible name changes is not reliably re-announced without a live region,
 * so the visible word is sighted confirmation and the name stays stable.
 */
function SettingsShellCopyButton({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = React.useState(false);
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  React.useEffect(() => () => clearTimeout(timeoutRef.current), []);

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      data-slot="settings-shell-code-copy"
      aria-label={label}
      onClick={() => {
        void navigator.clipboard?.writeText(value).then(() => {
          setCopied(true);
          clearTimeout(timeoutRef.current);
          timeoutRef.current = setTimeout(() => setCopied(false), 1500);
        });
      }}
    >
      {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
      {copied ? "Copied" : "Copy"}
    </Button>
  );
}

function SettingsShell({
  title = "Settings",
  description,
  sections = [],

  sectionId,
  defaultSectionId,
  onSectionChange,

  search,
  defaultSearch = "",
  onSearchChange,
  searchLabel = "Search settings",
  searchPlaceholder = "Search settings",

  anchorPrefix = "settings",

  usage = [],
  usageLabel = "Usage this period",

  accountMenu,

  rootLabel = "Settings",
  rootHref,
  navLabel = "Settings sections",
  contentLabel = "Settings content",

  calloutFallback,
  empty,
  navEmpty,
  codeEmptyLabel = "This section has nothing to copy.",
  codeFallbackLabel = "Configuration",

  className,
  ...props
}: SettingsShellProps) {
  const searchId = React.useId();
  const codeLabelId = React.useId();
  const gatedLabelId = React.useId();

  const [uncontrolledSection, setUncontrolledSection] = React.useState(
    () => defaultSectionId ?? sections[0]?.id,
  );
  const [uncontrolledSearch, setUncontrolledSearch] = React.useState(defaultSearch);

  const activeId = sectionId ?? uncontrolledSection ?? sections[0]?.id;
  const searchValue = search ?? uncontrolledSearch;
  const query = searchValue.trim().toLowerCase();
  const searching = query.length > 0;

  const selectSection = (next: string) => {
    if (sectionId === undefined) setUncontrolledSection(next);
    onSectionChange?.(next);
  };

  const changeSearch = (next: string) => {
    if (search === undefined) setUncontrolledSearch(next);
    onSearchChange?.(next);
  };

  const active = sections.find((section) => section.id === activeId) ?? sections[0];

  /**
   * Search is global, so the count has to be per section and visible from every
   * section — B3's `count` badge is the same affordance M1's own (suppressed)
   * nav renders, so nothing is lost by moving the nav out.
   */
  const matchesIn = (section: SettingsShellSection) =>
    (section.rows ?? []).filter((row) => matchesQuery([row.label, row.description], query)).length +
    (section.gated ?? []).filter((gate) => matchesQuery([gate.label, gate.description], query)).length;

  const totalMatches = sections.reduce((sum, section) => sum + matchesIn(section), 0);

  // Grouped in declaration order: a settings nav that reorders itself between
  // renders is a nav you cannot learn.
  const navSections: SidebarNavSection[] = [];
  const groupIndex = new Map<string, number>();
  for (const section of sections) {
    let index = groupIndex.get(section.group);
    if (index === undefined) {
      index = navSections.length;
      groupIndex.set(section.group, index);
      navSections.push({ label: section.group, items: [] });
    }
    navSections[index].items.push({
      id: section.id,
      label: section.label,
      icon: section.icon,
      tier: section.tier,
      count: searching ? matchesIn(section) : undefined,
      // The row *is* the deep link. B3 renders an anchor when `href` is set and
      // still reports the selection, so one control both navigates and updates
      // the page.
      href: `#${anchorPrefix}-${section.id}`,
    });
  }

  const gatedRows = (active?.gated ?? []).filter((gate) =>
    matchesQuery([gate.label, gate.description], query),
  );
  const callout = active?.callout ?? calloutFallback;
  const code = active?.code;

  return (
    <div
      data-slot="settings-shell"
      className={cn("bg-background text-foreground flex h-full min-h-0 w-full flex-col", className)}
      {...props}
    >
      <div
        data-slot="settings-shell-header"
        className="flex shrink-0 items-center justify-between gap-3 border-b px-4 py-2.5"
      >
        {/* The vendored Breadcrumb, which already ships the nav landmark, the
            separators and `aria-current="page"` on the leaf. */}
        <Breadcrumb data-region="breadcrumb" className="min-w-0">
          <BreadcrumbList>
            <BreadcrumbItem>
              {rootHref ? (
                <BreadcrumbLink href={rootHref}>{rootLabel}</BreadcrumbLink>
              ) : (
                <span>{rootLabel}</span>
              )}
            </BreadcrumbItem>
            {active ? (
              <>
                <BreadcrumbSeparator />
                {/* The group is a heading, not a destination — there is no page
                    behind it, so it is text rather than a dead link. */}
                <BreadcrumbItem>
                  <span>{active.group}</span>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{active.label}</BreadcrumbPage>
                </BreadcrumbItem>
              </>
            ) : null}
          </BreadcrumbList>
        </Breadcrumb>
        {accountMenu}
      </div>

      {/* Below `md` the nav stops being a column and becomes a capped band
          above the content: a fixed 15rem rail leaves 135px of content on a
          375px viewport, which is not a settings page, it is a nav with a
          margin. */}
      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        {/* Search and grouped nav are one region because they are one
            affordance. Unpainted on purpose: a `bg-muted` column would put
            every composed child's `text-muted-foreground` at 4.34:1, and a
            slot-level override cannot reach inside B3 or M3. */}
        <div
          data-region="grouped-nav"
          className="flex max-h-64 w-full shrink-0 flex-col gap-4 overflow-y-auto border-b p-3 md:max-h-none md:w-60 md:border-r md:border-b-0"
        >
          <div className="flex flex-col gap-1">
            <label htmlFor={searchId} className="sr-only">
              {searchLabel}
            </label>
            <div className="relative">
              <Search
                aria-hidden
                className="text-muted-foreground pointer-events-none absolute top-2 left-2 size-4"
              />
              <Input
                id={searchId}
                type="search"
                data-slot="settings-shell-search"
                value={searchValue}
                placeholder={searchPlaceholder}
                onChange={(event) => changeSearch(event.target.value)}
                className="pl-7"
              />
            </div>
            {/* Always mounted, empty when idle: a live region created at the
                moment it has something to say is a live region screen readers
                routinely miss. */}
            <p
              role="status"
              data-slot="settings-shell-search-status"
              className="text-muted-foreground min-h-4 text-xs"
            >
              {searching
                ? `${totalMatches} ${totalMatches === 1 ? "setting matches" : "settings match"} across ${sections.length} ${sections.length === 1 ? "section" : "sections"}`
                : null}
            </p>
          </div>

          {navSections.length > 0
            ? // B3, not a hand-rolled list: the tier badge, the match count,
              // `aria-current="page"` and the anchor/button split are all its.
              <SidebarNav
                aria-label={navLabel}
                sections={navSections}
                activeId={activeId}
                onSelect={selectSection}
              />
            : (navEmpty ?? (
                <EmptyState
                  size="panel"
                  title="No settings yet"
                  description="Sections appear here as your product grows them."
                />
              ))}

          {usage.length > 0 ? (
            <div data-slot="settings-shell-usage" className="mt-auto flex flex-col gap-2 border-t pt-3">
              <h3 className="text-xs font-medium">{usageLabel}</h3>
              {/* M3's own sidebar variant, not a retuned copy of it. */}
              <QuotaMeter resources={usage} compact />
            </div>
          ) : null}
        </div>

        {/* The scroll container, so it carries the tab stop and the name that
            axe's scrollable-region-focusable rule asks for — on day one it has
            no focusable content of its own to inherit them from. */}
        <div
          data-slot="settings-shell-content"
          tabIndex={0}
          aria-label={contentLabel}
          className="flex min-w-0 flex-1 flex-col gap-6 overflow-y-auto p-4"
        >
          {/* Always mounted. A callout that appears from nowhere on one section
              in nine cannot teach that the scope of a setting is a thing worth
              reading. */}
          <div data-region="info-callout">
            {callout ? (
              <Alert variant={callout.variant} data-slot="settings-shell-callout">
                <SlidersHorizontal aria-hidden />
                {callout.title ? <AlertTitle>{callout.title}</AlertTitle> : null}
                <AlertDescription>{callout.description}</AlertDescription>
              </Alert>
            ) : (
              <Alert data-slot="settings-shell-callout">
                <SlidersHorizontal aria-hidden />
                <AlertDescription>
                  These settings apply to everyone in this workspace.
                </AlertDescription>
              </Alert>
            )}
          </div>

          <div data-region="setting-sections" className="flex flex-col gap-8">
            {sections.length > 0 ? (
              <>
                {/* M1's full-page variant. The shell forwards the query and M1
                    does the filtering, keeps the row grid, keeps the required
                    description, keeps destructive actions as plain text, and
                    keeps the deep-link anchor on the section it reveals. */}
                <SettingsDialog
                  variant="full-page"
                  title={title}
                  description={description}
                  sections={sections.map((section) => ({
                    id: section.id,
                    label: section.label,
                    icon: section.icon,
                    tier: section.tier,
                    rows: section.rows ?? [],
                  }))}
                  sectionId={activeId}
                  onSectionChange={selectSection}
                  search={searchValue}
                  onSearchChange={changeSearch}
                  anchorPrefix={anchorPrefix}
                  className={cn(SECTION_NAV_BELONGS_TO_THE_PAGE, SEARCH_BELONGS_TO_THE_NAV_COLUMN)}
                />

                {gatedRows.length > 0 ? (
                  <section
                    data-slot="settings-shell-gated"
                    aria-labelledby={gatedLabelId}
                    className="flex flex-col gap-3 border-t pt-6"
                  >
                    <h3 id={gatedLabelId} className="text-sm font-semibold">
                      {active?.gatedLabel ?? "Included with your plan"}
                    </h3>
                    {/* E7, one row per gated feature: the tier badge in the nav
                        is a promise, and these are what it promised. */}
                    {gatedRows.map(({ id, ...gate }) => (
                      <MemberGateRow key={id} data-feature-id={id} {...gate} />
                    ))}
                  </section>
                ) : null}

                {active?.pricing ? (
                  <section data-slot="settings-shell-pricing" className="border-t pt-6">
                    {/* M4 — the upgrade the tier badges point at, on the page
                        rather than behind a modal. */}
                    <PricingTable {...active.pricing} />
                  </section>
                ) : null}
              </>
            ) : (
              (empty ?? (
                <EmptyState
                  size="page"
                  title="Nothing to configure yet"
                  description="Settings sections show up here as features are switched on for this workspace."
                  icon={<SlidersHorizontal />}
                />
              ))
            )}
          </div>

          {/* Lovable's settings is the reference implementation "including tier
              badges and copy-ready configuration blocks" — the block is part of
              the archetype, so the region is always mounted and says so when
              the active section has nothing to copy. */}
          <section
            data-region="code-block"
            aria-labelledby={codeLabelId}
            className="flex flex-col gap-2 border-t pt-6"
          >
            <div className="flex items-center justify-between gap-2">
              <h3 id={codeLabelId} className="text-sm font-medium">
                {code?.label ?? codeFallbackLabel}
                {code?.language ? (
                  <span data-slot="settings-shell-code-language" className="ml-2 text-xs font-normal">
                    {code.language}
                  </span>
                ) : null}
              </h3>
              {code ? (
                <SettingsShellCopyButton
                  label={code.copyLabel ?? `Copy ${code.label}`}
                  value={code.value}
                />
              ) : null}
            </div>
            {code ? (
              // Focusable because it scrolls (axe scrollable-region-focusable),
              // and `text-foreground` rather than muted because the frame is
              // `bg-muted` — that pairing measures 4.34:1.
              <pre
                data-slot="settings-shell-code"
                tabIndex={0}
                className="bg-muted text-foreground max-h-72 overflow-auto rounded-md border p-3 font-mono text-xs whitespace-pre-wrap"
              >
                <code>{code.value}</code>
              </pre>
            ) : (
              <p className="text-muted-foreground text-sm">{codeEmptyLabel}</p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

export { SettingsShell };
export type {
  SettingsShellCallout,
  SettingsShellCode,
  SettingsShellGatedFeature,
  SettingsShellProps,
  SettingsShellSection,
};
