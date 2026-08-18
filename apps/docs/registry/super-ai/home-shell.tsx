"use client";

import { Compass, LayoutGrid, PanelsTopLeft } from "lucide-react";
import * as React from "react";

import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { AppSidebar } from "@/registry/super-ai/app-sidebar";
import { AppTopbar, type AppTopbarProps } from "@/registry/super-ai/app-topbar";
import { CreditsIndicator, type CreditsIndicatorProps } from "@/registry/super-ai/credits-indicator";
import { EmptyState } from "@/registry/super-ai/empty-state";
import { FeatureCardRow, type FeatureCardRowItem } from "@/registry/super-ai/feature-card-row";
import { HeroOmnibox, type HeroOmniboxProps } from "@/registry/super-ai/hero-omnibox";
import { RecentGrid, type RecentGridItem } from "@/registry/super-ai/recent-grid";
import { RecommendationCard, type RecommendationCardProps } from "@/registry/super-ai/recommendation-card";
import { SectionHeader } from "@/registry/super-ai/section-header";
import {
  SuggestionChip,
  SuggestionChips,
  SuggestionChipsOverflow,
} from "@/registry/super-ai/suggestion-chips";

/**
 * Home Shell — App Home / launcher
 *
 * Spec: docs/design-system/block-specs.md#o1-home-shell
 * Regions: sidebar · topbar · hero-omnibox · feature-cards · recents-grid
 *
 * A block owns arrangement and nothing else. Every region here is filled by an
 * already-shipped registry component that keeps its own props, its own state
 * model and its own accessibility contract. Three sentences from the spec do
 * all the work:
 *
 * 1. "The hero omnibox is above the fold and is the only emphasised element on
 *    the page. Everything else is a path back into existing work." So C1 is the
 *    first thing in the scrolling column, it gets the page's whole width budget
 *    and its vertical air, and every band below it is introduced by a small,
 *    quiet `SectionHeader` rather than by a competing call to action. The shell
 *    deliberately renders no primary button of its own.
 * 2. "Order is invariant across all five reference products: composer →
 *    starters → features → recents → inspiration." That order is hard-coded, not
 *    a prop. Starters (C2) sit inside the hero region because they belong to the
 *    composer — a starter chip fills the omnibox, it does not navigate. See
 *    `handleSelectSuggestion`.
 * 3. "The whole page is C4's empty state on day one. That is the version most
 *    new users actually see." Every region is mounted unconditionally, and each
 *    one falls to an empty affordance rather than disappearing. Where the
 *    composed component ships its own — C4 does — that one is used; where it
 *    does not — C3, and the inspiration band — L1 `empty-state` fills in.
 *
 * The spec's `Regions:` line names five, but its invariant order names six
 * bands. `starters` is folded into `hero-omnibox` (same affordance, and C2 is
 * useless anywhere else), and `inspiration` renders as a labelled section after
 * the recents region carrying `data-slot="home-shell-inspiration"` rather than
 * a sixth `data-region` the manifest does not declare.
 */

/**
 * `contain: layout` makes this element the containing block for its fixed
 * descendants. The vendored `Sidebar`'s desktop container is `fixed inset-y-0
 * h-svh`, correct when a shell owns the viewport and wrong in a docs preview,
 * a Storybook canvas or an app region, where it would pin itself to the
 * browser's left edge. Same fix as `chat-shell`; keeps the shell embeddable
 * without patching the primitive.
 */
const EMBEDDABLE_SHELL = "[contain:layout]";

/**
 * The other half of `EMBEDDABLE_SHELL`. Containment redirects where the
 * vendored sidebar's `fixed` box is anchored, but its `h-svh` still takes its
 * height from the viewport — so in any shell shorter than the window the
 * sidebar overhangs and everything it bottom-anchors (`sidebarPromo`,
 * `sidebarFooter`) falls below the visible edge. Clipped, not hidden: those
 * controls stayed in the tab order while being invisible.
 *
 * Targets `[data-slot=app-sidebar]`, not the vendored `sidebar-container`
 * default named at `components/ui/sidebar.tsx:230`: B1 renders
 * `<Sidebar data-slot="app-sidebar" ...>`, and `Sidebar` spreads that prop
 * onto the very div that also carries its own `data-slot="sidebar-container"`
 * — the spread lands after the default, so `app-sidebar` is what's actually
 * on the element at runtime. Verified in the browser (rendered `data-slot`
 * inspected directly): the vendored name never appears once B1 is in use.
 *
 * Overriding here rather than in the primitive: `components/ui` is vendored
 * and stays byte-identical to upstream.
 */
const SIDEBAR_FILLS_SHELL = "[&_[data-slot=app-sidebar]]:h-full";

interface HomeShellSuggestion {
  id: string;
  /** The chip's text, and the exact string handed to the composer. */
  suggestion: string;
  /** Decorative leading glyph — the chip's accessible name is always `suggestion`. */
  icon?: React.ReactNode;
  /** Leading thumbnail, e.g. a template preview. Wins over `icon`. */
  thumbnail?: React.ReactNode;
}

interface HomeShellSuggestionsOverflow {
  /** Where the rest of the starters live. C2 has no button form of this on purpose. */
  href: string;
  count?: number;
  label?: React.ReactNode;
}

/** C5 in the inspiration band. `steps` and `onDismiss` stay required — they are C5's contract. */
type HomeShellRecommendation = RecommendationCardProps & { id: string };

interface HomeShellProps extends Omit<React.ComponentProps<"div">, "title"> {
  /** B2 workspace switcher, or anything else that belongs above the sidebar nav. */
  switcher?: React.ReactNode;
  /** B3 `sidebar-nav`, B6 `thread-list`, or any nav this product already has. */
  nav?: React.ReactNode;
  /** Replaces the default L1 shown when `nav` is omitted. */
  navEmpty?: React.ReactNode;
  /** B5 promo or any ambient sidebar CTA. */
  sidebarPromo?: React.ReactNode;
  /** B8 account menu. Sits at the bottom of the sidebar, above the rail. */
  sidebarFooter?: React.ReactNode;
  /** Starts the sidebar collapsed — the shell's half of B1's width contract. */
  defaultSidebarOpen?: boolean;

  /** Workspace or product name, shown in B7. */
  title?: string;
  /** The rest of B7 — breadcrumb, privacy chip, saved label, trailing actions. */
  topbar?: Omit<AppTopbarProps, "context" | "title">;
  /** M2, rendered in B7's trailing slot: the app-level ring of the cost contract. */
  credits?: CreditsIndicatorProps;

  /** Optional page heading above the omnibox ("Good afternoon"). Renders as the page's `h1`. */
  headline?: React.ReactNode;
  /** C1, forwarded whole. The value is the shell's, because a starter chip writes to it. */
  omnibox?: Omit<HeroOmniboxProps, "value" | "onValueChange">;
  /** Controls the composer's text. Omit and the shell keeps it internally. */
  promptValue?: string;
  onPromptChange?: (value: string) => void;
  /** C2 starters. Selecting one fills the composer — it never submits and never navigates. */
  suggestions?: HomeShellSuggestion[];
  /** Fires after the composer has been filled, with the chip's text. */
  onSelectSuggestion?: (suggestion: string) => void;
  /** The starters that did not fit, resolved as a real link rather than a clipped chip. */
  suggestionsOverflow?: HomeShellSuggestionsOverflow;

  featuresLabel?: string;
  /** C3 cards. Empty falls to L1 — C3 has no empty affordance of its own. */
  features?: FeatureCardRowItem[];
  /** "View all" — a link, per A5's contract. */
  featuresAction?: React.ReactNode;
  featuresEmpty?: React.ReactNode;

  recentsLabel?: string;
  /** C4 items. Empty renders C4's own in-grid empty tile, which is the day-one page. */
  recents?: RecentGridItem[];
  recentsLayout?: "grid" | "list";
  recentsAction?: React.ReactNode;
  recentsEmptyTitle?: string;
  recentsEmptyDescription?: string;
  /** CTA inside C4's empty tile. Use the verb of the surface it replaces ("New project"). */
  recentsEmptyAction?: React.ReactNode;

  recommendationsLabel?: string;
  /** C5 cards. Empty falls to L1. */
  recommendations?: HomeShellRecommendation[];
  recommendationsEmpty?: React.ReactNode;
}

function HomeShell({
  switcher,
  nav,
  navEmpty,
  sidebarPromo,
  sidebarFooter,
  defaultSidebarOpen = true,

  title = "Home",
  topbar,
  credits,

  headline,
  omnibox,
  promptValue,
  onPromptChange,
  suggestions = [],
  onSelectSuggestion,
  suggestionsOverflow,

  featuresLabel = "Popular features",
  features = [],
  featuresAction,
  featuresEmpty,

  recentsLabel = "Recents",
  recents = [],
  recentsLayout = "grid",
  recentsAction,
  recentsEmptyTitle,
  recentsEmptyDescription,
  recentsEmptyAction,

  recommendationsLabel = "Recommended for you",
  recommendations = [],
  recommendationsEmpty,

  className,
  ...props
}: HomeShellProps) {
  const [internalPrompt, setInternalPrompt] = React.useState("");
  const prompt = promptValue ?? internalPrompt;

  const writePrompt = React.useCallback(
    (next: string) => {
      if (promptValue === undefined) setInternalPrompt(next);
      onPromptChange?.(next);
    },
    [promptValue, onPromptChange],
  );

  /**
   * C2's whole contract: "Chips are prompts, not filters — `onSelect` exists to
   * fill the composer, never to submit or navigate." The shell holds the
   * composer's value precisely so that can be true here without the consumer
   * having to wire it, and `onSelectSuggestion` fires *after* the write, so a
   * consumer who wants submit-on-click opts into it rather than getting it.
   */
  const handleSelectSuggestion = React.useCallback(
    (suggestion: string) => {
      writePrompt(suggestion);
      onSelectSuggestion?.(suggestion);
    },
    [writePrompt, onSelectSuggestion],
  );

  return (
    <SidebarProvider
      // Overriding a vendored ui/ primitive's slot is house idiom — nothing
      // keys on `sidebar-wrapper`, and the block needs one addressable root.
      data-slot="home-shell"
      defaultOpen={defaultSidebarOpen}
      className={cn(
        "bg-background text-foreground h-full min-h-0 w-full overflow-hidden",
        EMBEDDABLE_SHELL,
        SIDEBAR_FILLS_SHELL,
        className,
      )}
      {...props}
    >
      {/* display:contents — the region marker has to be addressable without
          inserting a box between the flex row and B1's own gap/container pair,
          which is what positions the sidebar. */}
      <div data-region="sidebar" className="contents">
        <AppSidebar
          switcher={switcher}
          nav={
            nav ??
            navEmpty ?? (
              <EmptyState
                size="panel"
                title="Nothing pinned yet"
                description="Projects you pin show up here for one-click access."
                icon={<PanelsTopLeft />}
              />
            )
          }
          promo={sidebarPromo}
          footer={sidebarFooter}
        />
      </div>

      <SidebarInset className="min-w-0 overflow-hidden">
        {/* B7 has no leading slot, so the sidebar trigger is a sibling and the
            topbar's own bottom border moves out to this row — otherwise the
            trigger sits above the rule the header draws. */}
        <div
          data-region="topbar"
          className="bg-background flex h-12 shrink-0 items-center gap-1 border-b pl-2"
        >
          <SidebarTrigger />
          <AppTopbar
            context="document"
            title={title}
            {...topbar}
            // Spread first, then merge: a bare `actions` after the spread would
            // silently drop a caller's own trailing controls, and a bare
            // className would swallow `topbar.className`.
            actions={
              topbar?.actions || credits ? (
                <>
                  {topbar?.actions}
                  {credits ? <CreditsIndicator {...credits} /> : null}
                </>
              ) : undefined
            }
            className={cn("h-11 min-w-0 flex-1 border-b-0 pl-1", topbar?.className)}
          />
        </div>

        {/* The page column. It scrolls, but it always contains the omnibox —
            a focusable control in every one of C1's four states, including
            `locked` — so it needs no tab stop of its own and axe's
            scrollable-region-focusable rule has nothing to fire on. */}
        <div
          data-slot="home-shell-page"
          className="flex min-h-0 flex-1 flex-col gap-10 overflow-y-auto px-4 pb-12 sm:px-6"
        >
          {/* 1 + 2 — composer, then starters. The only emphasised thing on the
              page, and the only band that gets this much vertical air. */}
          <section
            data-region="hero-omnibox"
            aria-label="Start something new"
            className="flex w-full flex-col items-center gap-4 pt-10 sm:pt-16"
          >
            {headline ? (
              <h1
                data-slot="home-shell-headline"
                className="w-full max-w-2xl text-2xl font-semibold text-balance sm:text-3xl"
              >
                {headline}
              </h1>
            ) : null}

            <HeroOmnibox
              {...omnibox}
              value={prompt}
              onValueChange={writePrompt}
              className={cn("w-full max-w-2xl", omnibox?.className)}
            />

            {suggestions.length > 0 || suggestionsOverflow ? (
              <div data-slot="home-shell-starters" className="w-full max-w-2xl">
                <SuggestionChips>
                  {suggestions.map((item) => (
                    <SuggestionChip
                      key={item.id}
                      suggestion={item.suggestion}
                      icon={item.icon}
                      thumbnail={item.thumbnail}
                      onSelect={handleSelectSuggestion}
                    />
                  ))}
                  {suggestionsOverflow ? (
                    <SuggestionChipsOverflow
                      href={suggestionsOverflow.href}
                      count={suggestionsOverflow.count}
                    >
                      {suggestionsOverflow.label}
                    </SuggestionChipsOverflow>
                  ) : null}
                </SuggestionChips>
              </div>
            ) : null}
          </section>

          {/* 3 — features. C3 has no empty affordance, so L1 covers day one
              rather than leaving an empty carousel with two dead arrows. */}
          <section
            data-region="feature-cards"
            aria-label={featuresLabel}
            className="mx-auto flex w-full max-w-5xl flex-col gap-2"
          >
            <SectionHeader size="sm" title={featuresLabel} action={featuresAction} />
            {features.length > 0 ? (
              <FeatureCardRow items={features} />
            ) : (
              (featuresEmpty ?? (
                <EmptyState
                  size="panel"
                  title="No features to show"
                  description="Starting points for this workspace will appear here."
                  icon={<LayoutGrid />}
                />
              ))
            )}
          </section>

          {/* 4 — recents. C4 owns its own empty tile, and that tile *is* the
              day-one page, so the shell forwards to it rather than replacing
              it with an L1 of its own. */}
          <section
            data-region="recents-grid"
            aria-label={recentsLabel}
            className="mx-auto flex w-full max-w-5xl flex-col gap-2"
          >
            <SectionHeader
              size="sm"
              title={recentsLabel}
              count={recents.length > 0 ? recents.length : undefined}
              action={recentsAction}
            />
            <RecentGrid
              items={recents}
              layout={recentsLayout}
              emptyTitle={recentsEmptyTitle}
              emptyDescription={recentsEmptyDescription}
              emptyAction={recentsEmptyAction}
            />
          </section>

          {/* 5 — inspiration. Last, always, and never mistaken for the primary
              path: C5 is a suggestion you can audit before committing to. */}
          <section
            data-slot="home-shell-inspiration"
            aria-label={recommendationsLabel}
            className="mx-auto flex w-full max-w-5xl flex-col gap-2"
          >
            <SectionHeader size="sm" title={recommendationsLabel} />
            {recommendations.length > 0 ? (
              <div
                data-slot="home-shell-recommendations"
                className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
              >
                {recommendations.map(({ id, ...recommendation }) => (
                  <RecommendationCard
                    key={id}
                    id={id}
                    {...recommendation}
                    className={cn("max-w-none", recommendation.className)}
                  />
                ))}
              </div>
            ) : (
              (recommendationsEmpty ?? (
                <EmptyState
                  size="panel"
                  title="Nothing recommended yet"
                  description="Once you have made a few things, suggestions worth trying show up here."
                  icon={<Compass />}
                />
              ))
            )}
          </section>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

export { HomeShell };
export type {
  HomeShellProps,
  HomeShellRecommendation,
  HomeShellSuggestion,
  HomeShellSuggestionsOverflow,
};
