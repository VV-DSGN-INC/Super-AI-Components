import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";

import { ArtifactShell, type ArtifactShellProps } from "@/registry/super-ai/artifact-shell";
import { ArtifactShellDocs } from "@/content/components/artifact-shell.docs";
import { componentDocsPage } from "@/lib/component-docs-page";
import { focusTreatmentSignature, settledFocusRing } from "@/lib/focus-ring";
import { LibraryShell } from "@/registry/super-ai/library-shell";
import { SidebarNav } from "@/registry/super-ai/sidebar-nav";

const NAV = (
  <SidebarNav
    aria-label="Library"
    activeId="all"
    sections={[
      {
        label: "Library",
        items: [
          { id: "all", label: "All artifacts", count: 6 },
          { id: "shared", label: "Shared with me" },
          { id: "public", label: "Published" },
        ],
      },
    ]}
  />
);

const GROUPS: ArtifactShellProps["groups"] = [
  {
    id: "today",
    label: "Today",
    sessions: [
      {
        id: "brand-audit",
        label: "Brand audit for Northwind",
        items: [
          {
            id: "a1",
            excerpt:
              "Northwind is the only voice in the set that opens on reassurance. Competitors open on speed, which leaves the calm position uncontested.",
            type: "markdown",
            editedAgo: "Edited 4 minutes ago",
            visibility: "private",
          },
          {
            id: "a2",
            excerpt: "const TONE = ['reassuring', 'plain', 'unhurried'] // extracted from 41 sampled pages",
            type: "code",
            editedAgo: "Edited 9 minutes ago",
            viewCount: 3,
            visibility: "shared",
          },
        ],
      },
      {
        id: "pricing",
        label: "Pricing page copy",
        items: [
          {
            id: "a3",
            excerpt:
              "Three tiers. The middle one is the one we want people to pick, so it carries the annual saving and the word most people search for.",
            type: "markdown",
            editedAgo: "Edited 40 minutes ago",
            visibility: "private",
          },
        ],
      },
    ],
  },
  {
    id: "earlier",
    label: "Last 7 days",
    sessions: [
      {
        id: "onboarding",
        label: "Onboarding email rewrite",
        items: [
          {
            id: "a4",
            excerpt:
              "Welcome — you are three minutes from your first render. Everything below is optional; the one thing that matters is picking a starting point.",
            type: "html",
            editedAgo: "Edited Tuesday",
            viewCount: 128,
            visibility: "public",
          },
          {
            id: "a5",
            excerpt:
              "export function WelcomeCard({ name }: { name: string }) { return <Card>Hello {name}</Card> }",
            type: "react",
            editedAgo: "Edited Tuesday",
            visibility: "shared",
          },
          {
            id: "a6",
            excerpt:
              "Drop-off is concentrated in the second step, where we ask for a workspace name before showing anything worth naming.",
            type: "markdown",
            editedAgo: "Edited Monday",
            viewCount: 12,
            visibility: "private",
          },
        ],
      },
    ],
  },
];

const FULL_ARGS: ArtifactShellProps = {
  title: "Artifacts",
  switcher: <div className="px-2 text-sm font-medium">Northwind</div>,
  nav: NAV,
  groups: GROUPS,
  onOpenFilters: () => {},
};

const meta: Meta<typeof ArtifactShell> = {
  title: "Super AI/Artifact Shell",
  component: ArtifactShell,
  // A block is a page, so it gets the whole canvas rather than a centred box.
  // The `h-svh` wrapper is what the shell's `h-full` measures against — in a
  // real app that is the document, here it is the story frame.
  parameters: { layout: "fullscreen", docs: { page: componentDocsPage(ArtifactShellDocs) } },
  decorators: [
    (Story) => (
      <div className="h-svh w-full">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ArtifactShell>;

/** The working index: two recency buckets, three sessions, five type facets. */
export const Index: Story = { args: FULL_ARGS };

/**
 * Day one. Nothing generated, nothing in the library — two empty affordances at
 * once, and the search field and facet row still mounted so both are
 * discoverable before there is anything to scope. Mandatory export for the
 * block contract.
 */
export const Empty: Story = {
  args: {
    title: "Artifacts",
    switcher: <div className="px-2 text-sm font-medium">Northwind</div>,
  },
};

/**
 * Narrow viewport. Below the sidebar's 768px breakpoint the vendored Sidebar
 * swaps itself for a drawer, so the header trigger becomes the only way in, the
 * facet row wraps, and the grid drops to a single column — which is the width at
 * which the excerpt reads best anyway. Mandatory export for the block contract:
 * a shell is a layout, and layout is what breaks.
 *
 * `globals.viewport.value` is the Storybook 9 API. `parameters.viewport
 * .defaultViewport` was removed in 9 and does nothing while looking configured.
 *
 * KNOWN LIMIT: this resizes the canvas in the Storybook UI only. The vitest
 * runner behind `test:stories` has no manager to resize an iframe, so this
 * story is rendered and axe-checked at the browser's default width like any
 * other. The narrow layout here is verified by hand, not by a gate.
 */
export const Responsive: Story = {
  args: FULL_ARGS,
  parameters: {
    viewport: {
      options: {
        mobile: { name: "Mobile", styles: { width: "375px", height: "812px" }, type: "mobile" },
      },
    },
  },
  globals: { viewport: { value: "mobile" } },
};

/** A type facet applied: the same `type` value that stamps J4's badges. */
export const Filtered: Story = { args: { ...FULL_ARGS, activeType: "markdown" } };

/**
 * Searched by what the artifacts say rather than what they are called — the
 * whole reason the card leads with its excerpt.
 */
export const Searched: Story = { args: { ...FULL_ARGS, defaultQuery: "reassurance" } };

/** Nothing matches. L1 in its emptied form, announced rather than silent. */
export const NoResults: Story = { args: { ...FULL_ARGS, defaultQuery: "quarterly forecast" } };

/**
 * K1 above the index: a passage that has just been generated, still holding its
 * Keep / Edit / Regenerate / Discard verbs and not yet filed under a bucket.
 */
export const WithDraft: Story = {
  args: {
    ...FULL_ARGS,
    draftLabel: "Just generated",
    draft: {
      label: "Generated from the brand audit",
      children: (
        <p>
          Northwind should lead every page with the calm claim and let the speed claim arrive second.
          Competitors have taken the fast lane and left the reassuring one open.
        </p>
      ),
      onKeep: () => {},
      onEdit: () => {},
      onRegenerate: () => {},
      onDiscard: () => {},
    },
  },
};

/* -------------------------------------------------------------------------
 * Case stories — the situations this index meets in a product, as opposed to
 * the region combinations above. See docs/design-system/story-conventions.md.
 *
 * All eight are written, so there are no `case-skip` lines. A shell declares
 * `regions` rather than `states`, so nothing above is a declared-state export
 * restating the types — but the eight below are still the only record of what
 * this arrangement does under direction, motion suppression, a keyboard, a
 * phone, an empty string and a host that refuses to move.
 * ---------------------------------------------------------------------- */

/**
 * The reduced-motion branch, and the one surface in this shell that has none.
 *
 * **This shell owns no animation of its own.** Nothing in `artifact-shell.tsx`
 * carries an `animate-*` or a `transition-*` class — grepped, not assumed — so
 * every moving thing here belongs to a composed component and is reached rather
 * than described.
 *
 * **What is reached and holds still: K1's streaming spinner.** `draft` is
 * `AiDocBlockProps`, so `state: "streaming"` is reachable through the shell's
 * public API, and K1 already carries `motion-reduce:animate-none` beside its
 * `animate-spin`. Asserted from four levels up rather than trusted from the
 * class list. The second assertion is what the branch is *for*: with the spin
 * suppressed the word "Streaming" is all that is left, which is why K1 renders
 * a word beside the glyph instead of the glyph alone.
 *
 * **What is reached and does not hold still — the vendored sidebar's collapse,
 * and it is a new finding.** `SidebarTrigger` collapses the rail by animating
 * two elements 256px wide down to zero: `sidebar-gap` carries
 * `transition-[width] duration-200` and the fixed `sidebar-container` carries
 * `transition-[left,right,width] duration-200`, neither with a
 * `motion-reduce:transition-none`. A quarter of the viewport sliding out is
 * motion by the convention's own test (fact 3) and not a colour crossfade, so
 * `transition-colors` is not the excuse here. Both durations are measured in
 * the play and neither is pinned as correct.
 *
 * It is **not fixed from here**: `components/ui/sidebar.tsx` is vendored and
 * shared by every B1 consumer, which is the same standing rule that left O2's
 * `left-0` finding recorded rather than swept. It is also not confined to this
 * shell — O1, O2, O10 and O11 all render the same trigger.
 *
 * **Not the sheet.** O2 recorded `components/ui/sheet.tsx` animating under
 * reduce, and it still does — re-grepped in this wave, still zero
 * `motion-reduce` occurrences in that file. It is only reachable below the
 * 768px media query, so it is measured in `Mobile` rather than here.
 *
 * **A5's chips are `transition-colors` and are deliberately left alone.** They
 * crossfade a background; nothing moves. That is the `reset-affordance`
 * precedent in fact 3 — adding the class there would document no branch.
 */
export const ReducedMotion: Story = {
  args: {
    ...FULL_ARGS,
    draftLabel: "Just generated",
    draft: {
      label: "Generated from the brand audit",
      state: "streaming",
      children: <p>Northwind should lead every page with the calm claim.</p>,
    },
  },
  play: async ({ canvasElement }) => {
    // 1. The one animation this shell can produce, suppressed.
    const spinner = canvasElement.querySelector<HTMLElement>('[data-slot="ai-doc-block-streaming"] svg')!;
    await expect(getComputedStyle(spinner).animationName).toBe("none");

    // 2. …and what survives it. The glyph is not the message.
    const streaming = canvasElement.querySelector<HTMLElement>('[data-slot="ai-doc-block-streaming"]')!;
    await expect(streaming.textContent).toBe("Streaming");

    // 3. The defect this story found, now fixed and guarded. Collapsing the
    // rail used to slide 256px of layout under `prefers-reduced-motion:
    // reduce`: `components/ui/sidebar.tsx` put `transition-[width]` on the
    // in-flow gap and `transition-[left,right,width]` on the fixed container
    // with no `motion-reduce` on either. O1 `home-shell` and O9 measured it
    // independently, and the integrator took it in both copies of the vendored
    // file, where every B1 consumer shares it.
    //
    // Read as `transition-property`, on both halves. The fix sets the property
    // list to `none` and leaves `0.2s` in place, so the duration is not the
    // value that moves — an earlier form of this assertion read the container's
    // duration only and would have passed after a revert.
    const gap = canvasElement.querySelector<HTMLElement>('[data-slot="sidebar-gap"]')!;
    const container = canvasElement.querySelector<HTMLElement>('[data-slot="app-sidebar"]')!;
    await expect(
      [
        `gap ${getComputedStyle(gap).transitionProperty}`,
        `container ${getComputedStyle(container).transitionProperty}`,
      ].join(" · "),
    ).toBe("gap none · container none");

    // And the distance it travels, so "motion, not a crossfade" is a number
    // rather than a reading of the class list. B1 collapses to an icon rail
    // rather than to nothing, so the travel is the difference of the two.
    const before = Math.round(gap.getBoundingClientRect().width);
    await userEvent.click(canvasElement.querySelector<HTMLElement>('[data-slot="sidebar-trigger"]')!);
    // The width is still moving on the frame after the click — the read below
    // settles it rather than pinning a mid-flight number, but the fact that it
    // has to settle at all is the defect stated as behaviour.
    await waitFor(() => expect(Math.round(gap.getBoundingClientRect().width)).toBe(48));
    await expect(`rail ${before}px → 48px, travel ${before - 48}px`).toBe("rail 256px → 48px, travel 208px");
  },
};

/**
 * Right-to-left. An index is where direction stops being a per-component
 * question: a rail, a facet row, a search field with a leading icon and a card
 * grid all have to agree about which edge is the start.
 *
 * `dir` on a wrapper is enough here, deliberately: this story opens no popup,
 * and the one portalled surface this shell can produce — B1's mobile drawer —
 * lives below the 768px query and is exercised in `Mobile`. An RTL story that
 * opened one would need `dir` on the document instead (fact 5's closing note).
 *
 * **Four classes were swapped in this wave, all in this shell's own source**
 * and all under `CONTINUE.md` §8's sanctioned physical→logical sweep: the
 * search field's `pl-8` → `ps-8`, its leading icon's `left-2.5` → `start-2.5`,
 * the facet count's `ml-1` → `ms-1`, and the Filters button's `ml-auto` →
 * `ms-auto`. The icon pair is the one that mattered: unswapped, the icon stayed
 * on the physical left while the query text began at the right, so the glyph sat
 * in dead space at the trailing end and the text ran into the start edge with no
 * gutter at all. `LongContent` reads the same four boxes back in LTR, and those
 * numbers were recorded from the *unswapped* source before the change and are
 * unchanged after it — byte-identity measured, per the `usage-dashboard`
 * precedent, not assumed.
 *
 * **Recorded, not fixed, and the serious one — the sidebar paints on the wrong
 * edge and covers the index.** O2 measured this on `chat-shell` in this same
 * wave and the mechanism is identical here, because the defect is in the
 * vendored primitive rather than in either shell: `components/ui/sidebar.tsx`
 * splits itself into an in-flow `sidebar-gap` that reserves the column and a
 * `fixed` `sidebar-container` that paints it, and the container is placed by
 * `data-[side=left]:left-0`, which is physical. The gap follows direction; the
 * paint does not. Measured below as the four boxes. This is the second
 * independent confirmation, from a shell that composes B1 through the same
 * `AppSidebar` prop surface, which is what makes it a primitive-level bug
 * rather than a call-site one.
 *
 * **Recorded, not fixed — J4's card grid is direction-clean and A3 is not
 * quite.** J4's excerpt already carries `text-start` (its own wave-5 swap) and
 * its title and edited-ago lines are `truncate`, which is direction-agnostic.
 * A3 `date-section`'s label is `px-2`, already logical. What is left is inside
 * `filter-bar.tsx`: `FilterChip`'s remove button is `mr-1` and its toggle takes
 * `pr-1` when removable. This shell passes no `onRemove`, so neither renders
 * here — the gap is real and simply out of reach from O9.
 */
export const RTL: Story = {
  args: FULL_ARGS,
  render: (args) => (
    <div dir="rtl" className="h-full">
      <ArtifactShell {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const shell = canvasElement.querySelector<HTMLElement>('[data-slot="artifact-shell"]')!;
    await expect(getComputedStyle(shell).direction).toBe("rtl");

    // The four swaps, in the frame they were made for. `LongContent` asserts
    // the LTR half with the same numbers the unswapped source produced.
    const field = canvasElement.querySelector<HTMLElement>('[data-slot="input"]')!;
    const icon = field.parentElement!.querySelector<HTMLElement>("svg")!;
    const count = canvasElement.querySelector<HTMLElement>('[data-slot="filter-chip"] span.tabular-nums')!;
    const filters = canvasElement.querySelector<HTMLElement>('[data-slot="filters-button"]')!;
    const fieldStyle = getComputedStyle(field);
    const iconStyle = getComputedStyle(icon);
    const countStyle = getComputedStyle(count);
    const filtersStyle = getComputedStyle(filters);
    await expect(
      [
        `field ${fieldStyle.paddingLeft}/${fieldStyle.paddingRight}`,
        `icon right ${iconStyle.right}`,
        `count ${countStyle.marginLeft}/${countStyle.marginRight}`,
        `filters margin-left ${filtersStyle.marginLeft}`,
      ].join(" · "),
    ).toBe("field 10px/32px · icon right 10px · count 0px/4px · filters margin-left 0px");

    // Said as geometry rather than as declarations: the glyph now leads the
    // field, the 32px gutter is on the same edge as the glyph, and the Filters
    // button is pushed to the row's end, which in RTL is its left edge.
    const fieldBox = field.getBoundingClientRect();
    const iconBox = icon.getBoundingClientRect();
    const bar = canvasElement.querySelector<HTMLElement>('[data-slot="filter-bar"]')!;
    await expect(
      [
        `icon leads the field: ${iconBox.right <= fieldBox.right && iconBox.right > fieldBox.right - 32}`,
        `filters pinned to end: ${Math.round(filters.getBoundingClientRect().left) === Math.round(bar.getBoundingClientRect().left)}`,
      ].join(" · "),
    ).toBe("icon leads the field: true · filters pinned to end: true");

    // THE DEFECT, measured. See this story's description; O2 found it first.
    const sidebar = canvasElement.querySelector<HTMLElement>('[data-slot="app-sidebar"]')!;
    const gap = canvasElement.querySelector<HTMLElement>('[data-slot="sidebar-gap"]')!;
    const grid = canvasElement.querySelector<HTMLElement>('[data-region="artifact-card-grid"]')!;
    const box = (el: HTMLElement) => {
      const r = el.getBoundingClientRect();
      return `${Math.round(r.left)}..${Math.round(r.right)}`;
    };
    await expect(
      [
        `shell ${box(shell)}`,
        `painted sidebar ${box(sidebar)}`,
        `reserved column ${box(gap)}`,
        `grid ${box(grid)}`,
      ].join(" | "),
    ).toBe("shell 0..1200 | painted sidebar 0..256 | reserved column 944..1200 | grid 0..944");

    // J4's excerpt aligns to the reading edge — its own swap, verified from a
    // consumer rather than taken on trust.
    const excerpt = canvasElement.querySelector<HTMLElement>('[data-slot="artifact-grid-excerpt"]')!;
    await expect(getComputedStyle(excerpt).textAlign).toBe("start");
  },
};

/**
 * ~90 characters in every author-supplied slot at once, because an index's
 * answer to length is not one decision but five, and they do not agree.
 *
 * The page title truncates, the date bucket wraps, the session header wraps,
 * the excerpt line-clamps to four, and the search placeholder is simply clipped
 * by the field. Only the excerpt is deliberate: it is the field the whole
 * component is built around — the spec's first rule is that auto-generated
 * titles are unreliable and the first lines are what identify an artifact — so
 * four lines of it is the identifying budget, and everything else is chrome
 * that may be lost.
 *
 * **The interesting one is the page title, and it is not a defect.** `title`
 * is `min-w-0 flex-1 truncate`, so at the gate's 1200px a 90-character heading
 * has 800px of inset to spread into and does not clip. It is *set up* to clip
 * and the sidebar is what decides when, so this story asserts the machinery
 * (`hidden/ellipsis/nowrap`) rather than an outcome, and says which of the two
 * it measured.
 *
 * **Recorded, not fixed — a truncated heading has no `title` attribute.** The
 * `<h1>` is `truncate` with nothing to recover the tail from: no `title`, no
 * tooltip. It is the same shape wave 1 found on D3 `context-chips` and, unlike
 * that one, the accessible name is lossy too, because a heading's name is its
 * text content and truncation is purely visual — so the whole string survives
 * for a screen reader and is unavailable to a sighted reader at narrow width.
 *
 * **The result count does not truncate and that is what keeps it honest.** It
 * is `shrink-0` beside a `flex-1` field, so a long placeholder eats the field
 * rather than the count. A `role="status"` that could be squeezed to an
 * ellipsis would announce fine and read as nothing.
 *
 * This story also carries the **LTR half of the four class swaps** made in this
 * wave. The four numbers below were recorded from the *unswapped* source before
 * the change and are asserted unchanged after it — that is the byte-identity
 * measurement `CONTINUE.md` §8 requires, not an assumption, because the same
 * swap is not free on an ancestor whose descendants the user agent has an
 * opinion about (`usage-dashboard`, wave 7). `RTL` asserts the mirror.
 */
export const LongContent: Story = {
  args: {
    ...FULL_ARGS,
    title: "Everything Northwind has generated since the brand audit started in March",
    searchPlaceholder: "Search by a phrase from the artifact itself rather than by the title it was given",
    draftLabel: "Just generated, and not filed under a bucket until you keep it",
    draft: {
      label: "Generated from the brand audit",
      children: <p>Northwind should lead every page with the calm claim.</p>,
      onKeep: () => {},
      onDiscard: () => {},
    },
    groups: [
      {
        id: "today",
        label: "Today, and the four working days before it that nobody has filed yet",
        sessions: [
          {
            id: "brand-audit",
            label: "Brand voice audit for Northwind against its three closest competitors",
            items: [
              {
                id: "a1",
                // Longer than the convention's ~90 characters, and deliberately:
                // this slot is prose rather than a label, so 90 characters
                // would not reach the clamp and the story would document
                // nothing. The clamp is the decision worth recording.
                excerpt:
                  "Northwind is the only voice in the set that opens on reassurance; every competitor opens on speed, which leaves the calm position uncontested and cheap to hold for as long as nobody else notices it is empty. Defending it costs nothing today and gets more expensive every quarter that a competitor tests the same line and finds it works.",
                type: "markdown",
                editedAgo: "Edited 4 minutes ago",
                visibility: "private",
              },
              {
                id: "a2",
                excerpt:
                  "const TONE = ['reassuring', 'plain', 'unhurried'] // extracted from 41 sampled pages",
                type: "code",
                editedAgo: "Edited 9 minutes ago",
              },
            ],
          },
        ],
      },
    ],
  },
  play: async ({ canvasElement }) => {
    const clipped = (el: HTMLElement) => el.scrollWidth > el.clientWidth;
    const q = (selector: string) => canvasElement.querySelector<HTMLElement>(selector)!;

    const title = q('[data-slot="artifact-shell-title"]');
    const bucket = q('[data-slot="date-section-label"]');
    const session = q('[data-slot="section-header-title"]');
    const excerpt = q('[data-slot="artifact-grid-excerpt"]');
    const count = q('[data-slot="artifact-shell-result-count"]');

    // Five slots, five answers.
    await expect(
      [
        `title clipped: ${clipped(title)}`,
        `bucket clipped: ${clipped(bucket)}`,
        `session clipped: ${clipped(session)}`,
        `count clipped: ${clipped(count)}`,
      ].join(" · "),
    ).toBe("title clipped: false · bucket clipped: false · session clipped: false · count clipped: false");

    // The title is machinery, not an outcome, at this width.
    const titleStyle = getComputedStyle(title);
    await expect(`${titleStyle.overflow}/${titleStyle.textOverflow}/${titleStyle.whiteSpace}`).toBe(
      "hidden/ellipsis/nowrap",
    );
    await expect(title.getAttribute("title")).toBeNull();

    // The excerpt clamps rather than truncating: four lines, and the fifth is
    // gone. `-webkit-line-clamp` is what J4 sets; the height is the consequence.
    const excerptStyle = getComputedStyle(excerpt);
    await expect(`${excerptStyle.webkitLineClamp}/${excerptStyle.overflow}`).toBe("4/hidden");
    await expect(`excerpt clamped: ${excerpt.scrollHeight > excerpt.clientHeight}`).toBe(
      "excerpt clamped: true",
    );

    // The bucket and session headings wrap instead — a Range over their
    // contents reports more than one line box.
    const lineBoxes = (el: HTMLElement) => {
      const range = document.createRange();
      range.selectNodeContents(el);
      return range.getClientRects().length;
    };
    await expect(`bucket lines: ${lineBoxes(bucket) > 1} · session lines: ${lineBoxes(session) > 1}`).toBe(
      "bucket lines: false · session lines: false",
    );

    // Nothing pushes the shell sideways.
    const shell = q('[data-slot="artifact-shell"]');
    await expect(`shell scrolls sideways: ${shell.scrollWidth > shell.clientWidth}`).toBe(
      "shell scrolls sideways: false",
    );

    // The LTR frame for the four swaps. Only the leading side of each is
    // pinned: the trailing side of an absolutely-positioned icon and of an
    // `auto` margin resolves to a used value that moves with the content, so
    // asserting it would be asserting the fixture rather than the swap.
    const field = q('[data-slot="input"]');
    const icon = field.parentElement!.querySelector<HTMLElement>("svg")!;
    const facetCount = q('[data-slot="filter-chip"] span.tabular-nums');
    const filters = q('[data-slot="filters-button"]');
    const fieldStyle = getComputedStyle(field);
    const iconStyle = getComputedStyle(icon);
    const facetStyle = getComputedStyle(facetCount);
    const filtersStyle = getComputedStyle(filters);
    await expect(
      [
        `field ${fieldStyle.paddingLeft}/${fieldStyle.paddingRight}`,
        `icon left ${iconStyle.left}`,
        `count ${facetStyle.marginLeft}/${facetStyle.marginRight}`,
        `filters margin-right ${filtersStyle.marginRight}`,
      ].join(" · "),
    ).toBe("field 32px/10px · icon left 10px · count 4px/0px · filters margin-right 0px");

    // …and the `auto` margin said as geometry: the button is pushed to the end
    // of the row, which in LTR is its right edge.
    const bar = q('[data-slot="filter-bar"]');
    await expect(
      `filters pinned to end: ${Math.round(filters.getBoundingClientRect().right) === Math.round(bar.getBoundingClientRect().right)}`,
    ).toBe("filters pinned to end: true");
  },
};

/**
 * A trimmed index: two nav rows, one bucket, one session, two artifacts of two
 * different types so the facet row has something to choose between. Everything
 * the keyboard walk needs and nothing it does not — the walk is over the
 * *shell's* order, not over each composed component's internals, which each
 * have their own story.
 *
 * The cards carry `onOpen`, which the file's other fixtures do not: without it
 * J4 renders the excerpt as plain text and the grid has no tab stops at all, so
 * the docs page's claim that "every card link is still its own stop" would be
 * untestable.
 */
const KEYBOARD_ARGS: ArtifactShellProps = {
  title: "Artifacts",
  switcher: (
    <button type="button" className="px-2 text-sm font-medium">
      Northwind
    </button>
  ),
  nav: (
    <SidebarNav
      aria-label="Library"
      activeId="all"
      sections={[
        {
          label: "Library",
          items: [
            { id: "all", label: "All artifacts", count: 2 },
            { id: "shared", label: "Shared with me" },
          ],
        },
      ]}
    />
  ),
  sidebarFooter: (
    <button type="button" className="px-2 text-sm">
      Account
    </button>
  ),
  onOpenFilters: () => {},
  groups: [
    {
      id: "today",
      label: "Today",
      sessions: [
        {
          id: "brand-audit",
          label: "Brand audit for Northwind",
          items: [
            {
              id: "a1",
              excerpt: "Northwind is the only voice in the set that opens on reassurance.",
              type: "markdown",
              editedAgo: "Edited 4 minutes ago",
              onOpen: () => {},
            },
            {
              id: "a2",
              excerpt: "const TONE = ['reassuring', 'plain', 'unhurried']",
              type: "code",
              editedAgo: "Edited 9 minutes ago",
              onOpen: () => {},
            },
          ],
        },
      ],
    },
  ],
};

/**
 * The shell's own tab order, walked once, and the docs sentence it confirms.
 *
 * **The order is the one `artifact-shell.docs.tsx` states**, which is worth
 * saying because the same check on O2 in this wave found the opposite: that
 * page claimed the sidebar trigger came first and it rendered seventh. Here the
 * page already says "the sidebar's slots come before all of that", and the
 * render agrees — eleven stops, sidebar first, trigger fifth, grid region
 * before the cards it contains.
 *
 * **Both focus checks, because they answer different questions.**
 * `settledFocusRing` asks whether anything is painted; the differential —
 * reading the *next* stop's signature while focus is still on the previous one,
 * so nothing disturbs the sequence — asks whether focus is what painted it.
 * `story-conventions.md`, mechanical fact 5.
 *
 * **Recorded, not fixed — the docs page overstates who owns the facet ring.**
 * `focus[2]` says "the grid region and the facet chips carry their own
 * `focus-visible` rings". The grid does: `focus-visible:ring-ring
 * focus-visible:ring-2` on the `<section>`. A5's `FilterChip` toggle carries no
 * focus class at all — its only `focus-visible:ring-2` is on the *remove*
 * button, which this shell never renders because it passes no `onRemove`. What
 * paints on a focused chip is the user agent's own `outline: auto`, which is a
 * treatment and satisfies the convention, but it is the browser's and not the
 * design system's: it does not follow `--ring`, does not survive a global
 * `outline-none` reset, and is the one stop on this walk whose ring nobody in
 * this repo chose. Asserted below as the two mechanisms rather than as one
 * boolean, so the difference cannot drift out of the record. The fix belongs in
 * `filter-bar.tsx`, which is another component's file.
 *
 * **A5's missing single-select mode is what the walk actually feels like.**
 * `CONTINUE.md` §8 records "A5 `filter-bar` has no single-select mode (O9)";
 * re-read in this wave and still true — `FilterChipProps` is `active` plus
 * `onRemove` and nothing else. The consequence is here rather than in the
 * source: the three facets are three independent `aria-pressed` toggles inside
 * a `role="group"`, so there is one Tab per chip with no roving tabindex, the
 * arrows do nothing, and nothing in the accessibility tree says that pressing
 * one un-presses the others. The shell enforces single-select in its own
 * handler — `Controlled` proves it does — and a screen reader is told none of
 * it. The docs page already carries this as a pitfall; the walk is the
 * measurement behind it.
 */
export const KeyboardOrder: Story = {
  args: KEYBOARD_ARGS,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const bySlot = (slot: string) => canvasElement.querySelector<HTMLElement>(`[data-slot="${slot}"]`)!;
    const chips = Array.from(canvasElement.querySelectorAll<HTMLElement>('[data-slot="filter-chip-toggle"]'));
    const cards = Array.from(
      canvasElement.querySelectorAll<HTMLElement>('[data-slot="artifact-grid-excerpt"] button'),
    );
    const grid = canvasElement.querySelector<HTMLElement>('[data-region="artifact-card-grid"]')!;
    const navItems = Array.from(
      canvasElement.querySelectorAll<HTMLElement>('[data-slot="sidebar-nav-item"]'),
    );

    const stops: [string, HTMLElement][] = [
      ["switcher", canvas.getByRole("button", { name: "Northwind" })],
      ["nav: All artifacts", navItems[0]],
      ["nav: Shared with me", navItems[1]],
      ["sidebar footer", canvas.getByRole("button", { name: "Account" })],
      ["sidebar trigger", bySlot("sidebar-trigger")],
      ["facet: All", chips[0]],
      ["facet: Markdown", chips[1]],
      ["facet: Code", chips[2]],
      ["Filters", bySlot("filters-button")],
      ["search field", bySlot("input")],
      ["grid region", grid],
      ["card 1", cards[0]],
      ["card 2", cards[1]],
    ];

    const visited: string[] = [];
    const painted: Record<string, string> = {};
    for (const [name, el] of stops) {
      // The differential's baseline, taken while focus is still on the
      // previous stop — no blur, so the sequence under test is undisturbed.
      const before = focusTreatmentSignature(el);
      await userEvent.tab();
      visited.push(document.activeElement === el ? name : `!! ${name}`);
      await expect(`${name} focus-visible: ${el.matches(":focus-visible")}`).toBe(
        `${name} focus-visible: true`,
      );
      await settledFocusRing(el, waitFor);
      await waitFor(() =>
        expect(`${name} ring caused by focus: ${focusTreatmentSignature(el) !== before}`).toBe(
          `${name} ring caused by focus: true`,
        ),
      );
      // Recorded while the stop is genuinely focused by the keyboard: a
      // programmatic `.focus()` afterwards does not re-enter `:focus-visible`
      // reliably, so the who-owns-the-ring assertion below is taken here.
      const style = getComputedStyle(el);
      painted[name] = `${style.outlineStyle}/${style.boxShadow === "none" ? "no-shadow" : "shadow"}`;
    }

    // The whole order in one string, so a reordering reads as a diff rather
    // than as a single boolean going false.
    await expect(visited.join(" → ")).toBe(stops.map(([name]) => name).join(" → "));

    // Who owns each ring. The grid paints a Tailwind `ring-*`, which is a
    // box-shadow and follows `--ring`. The chip paints the user agent's own
    // `outline: auto` and nothing else — a treatment, but not one this repo
    // chose. Both satisfy the convention; only one survives a reset.
    await expect(
      [`grid ${painted["grid region"]}`, `facet ${painted["facet: All"]}`, `card ${painted["card 1"]}`].join(
        " · ",
      ),
    ).toBe("grid none/shadow · facet auto/no-shadow · card none/shadow");

    // A5's chips are N independent toggles, not a single-select control. The
    // shell's handler is the only thing enforcing "one at a time", and no part
    // of it reaches the accessibility tree.
    const row = canvasElement.querySelector<HTMLElement>('[data-slot="filter-bar"]')!;
    await expect(
      [
        `row role ${row.getAttribute("role")}`,
        `chips ${chips.length}`,
        `pressed states ${chips.map((c) => c.getAttribute("aria-pressed")).join(",")}`,
        `roving tabindex ${chips.some((c) => c.getAttribute("tabindex") === "-1")}`,
      ].join(" · "),
    ).toBe("row role group · chips 3 · pressed states true,false,false · roving tabindex false");

    // Nothing traps: the stop after the last is outside the shell.
    await userEvent.tab();
    await expect(canvasElement.contains(document.activeElement)).toBe(false);
  },
};

/**
 * A host that holds both of this shell's controlled pairs and refuses to move
 * either. `activeType`/`onActiveTypeChange` scopes the index by type;
 * `query`/`onQueryChange` scopes it by text. A consumer who forgets to apply
 * either callback ships an index where no facet ever narrows anything and the
 * search field cannot be typed into.
 *
 * The render counter is what makes the last assertion mean something: the host
 * really re-rendered with unchanged values, so the shell held because the props
 * held and not because React skipped the work.
 *
 * **The two pairs are not equally safe, and that is the finding.** `query` is
 * clean — the field is `value={query}`, so a pinned host produces a field that
 * genuinely will not accept a character. `activeType` is clean at the shell
 * level too, and the risk is one level down: A5's `FilterChip` is a *display*
 * of `active`, with no internal state of its own, so this shell is the only
 * thing that knows a facet row is single-select. That is the flip side of §8's
 * "A5 `filter-bar` has no single-select mode (O9)" — the missing mode is why
 * the shell owns the invariant, and owning it is why a pinned `activeType`
 * holds every chip fixed at once rather than one of them.
 *
 * **And the derived facet counts move while the selection does not**, which is
 * the behaviour a consumer is most likely to misread as a bug. The counts
 * answer "how many would I get if I switched to this", so they are computed
 * against the *search* and never against the active facet: pinning
 * `activeType` freezes which chip is pressed and leaves every number free to
 * change under it. Asserted below by typing into the pinned search field —
 * the host applies `onQueryChange` for that one pair, so the counts do move.
 */
function PinnedIndex({
  onActiveTypeChange,
  onQueryChange,
}: {
  onActiveTypeChange: (type: string | null) => void;
  onQueryChange: (query: string) => void;
}) {
  const [renders, setRenders] = React.useState(1);
  return (
    <div data-renders={renders} className="h-full">
      <ArtifactShell
        {...FULL_ARGS}
        // Pinned. Neither callback is ever applied to either value.
        activeType="markdown"
        query=""
        onActiveTypeChange={(type) => {
          onActiveTypeChange(type);
          setRenders((n) => n + 1);
        }}
        onQueryChange={(query) => {
          onQueryChange(query);
          setRenders((n) => n + 1);
        }}
      />
    </div>
  );
}

export const Controlled: StoryObj<typeof PinnedIndex> = {
  args: { onActiveTypeChange: fn(), onQueryChange: fn() },
  render: (args) => <PinnedIndex {...args} />,
  play: async ({ args, canvasElement }) => {
    const chips = Array.from(canvasElement.querySelectorAll<HTMLElement>('[data-slot="filter-chip-toggle"]'));
    const field = canvasElement.querySelector<HTMLInputElement>('[data-slot="input"]')!;
    const count = canvasElement.querySelector<HTMLElement>('[data-slot="artifact-shell-result-count"]')!;
    const pressed = () => chips.map((c) => c.getAttribute("aria-pressed")).join(",");

    // All / Markdown / Code / HTML / React, with Markdown held pressed.
    await expect(`${chips.length} chips: ${pressed()}`).toBe("5 chips: false,true,false,false,false");

    // Pressing another facet reports the payload a consumer needs to apply the
    // change — the type string, which is the same value J4 stamps on its badge.
    await userEvent.click(chips[2]);
    await expect(args.onActiveTypeChange).toHaveBeenCalledWith("code");
    // …and the prop wins. The click alone moved nothing.
    await expect(pressed()).toBe("false,true,false,false,false");

    // Pressing the *pressed* facet reports `null`, which is how a host clears
    // the filter. Still nothing moves.
    await userEvent.click(chips[1]);
    await expect(args.onActiveTypeChange).toHaveBeenLastCalledWith(null);
    await expect(pressed()).toBe("false,true,false,false,false");

    // The search field is `value={query}`, so a pinned host produces a field
    // that will not take a character. The callback still carries every one.
    await userEvent.type(field, "calm");
    await expect(field.value).toBe("");
    await expect(args.onQueryChange).toHaveBeenLastCalledWith("m");
    // Four characters, four calls, none of them cumulative — which is the
    // detail a host that concatenates instead of replacing would get wrong.
    await expect((args.onQueryChange as ReturnType<typeof fn>).mock.calls.map((c) => c[0])).toEqual([
      "c",
      "a",
      "l",
      "m",
    ]);

    // The result count is unmoved too, because nothing was filtered.
    await expect(count.textContent).toBe("3 of 6 artifacts");

    // …and the host did re-render, six times, while holding both values fixed.
    await expect(canvasElement.querySelector("[data-renders]")).toHaveAttribute("data-renders", "7");
  },
};

/**
 * Seven of this shell's label props are optional and every one has a default,
 * so the empty string is reachable on all seven — and it lands in three
 * different ways. Three are rendered here; four are measured and described
 * rather than rendered, because they are red gates.
 *
 * **`searchLabel=""` unnames the search field and no gate says so.** The
 * `<label for>` is still there, still associated, and paints nothing, leaving
 * the placeholder as the field's only candidate name. That is K1's
 * `rePromptLabel` shape, reached from a second component.
 *
 * **What is rendered here is the case that passes, and the reason it passes is
 * the placeholder.** An earlier draft of this block claimed the divider between
 * silent and red was `<label for>` versus `aria-label`, on the strength of an
 * unrendered measurement. The integrator probed the gate directly with five
 * shapes and that is not what it does: an empty `<label for>` **with** a
 * placeholder is the only one of the five that passes. Empty `<label for>` with
 * no placeholder, no label at all, `aria-label=""`, and an empty `<label for>`
 * beside `placeholder=""` on a `type="search"` all fail `label` outright, with
 * axe naming all four candidate mechanisms in its output. So wave 6's original
 * reading holds: **the escape hatch is axe's `non-empty-placeholder` check**,
 * and O14 `auth-shell` reached the same conclusion independently on
 * `emailLabel=""`. This story renders the passing shape — `searchLabel=""` with
 * the default placeholder intact — which is exactly the configuration a real
 * caller reaches, and it is nameless to a screen reader while green to the
 * gate.
 *
 * **`filterLabel=""` and `gridLabel=""` unname a group and a landmark in
 * silence.** Neither is name-from-content, so `aria-label=""` leaves them
 * addressable by nothing. The grid one is the worse of the two: that
 * `<section>` is the shell's scroll container and its own tab stop, so a
 * keyboard user still lands on it and is told nothing about what they have
 * landed on. Both are asserted below as "still focusable, still scrollable,
 * no longer named".
 *
 * **Four are red gates, measured and then removed from the args rather than
 * shipped into the gate** — the way H4 `transcript-editor` and O2 handle
 * theirs. Each is quoted here with what axe actually said:
 *
 * - `title=""` → `empty-heading` on `h1[data-slot="artifact-shell-title"]`:
 *   "Element does not have text that is visible to screen readers". Worth
 *   naming because O2 measured `title=""` on `chat-shell` as *harmless*: B7
 *   renders it into a `<span>` and this shell renders it into the page's `<h1>`.
 *   Same prop name, opposite verdict, and the only difference is a tag.
 * - `draftLabel=""` → `empty-heading` on the draft `<h2>`, plus the quieter
 *   consequence axe cannot see: `aria-labelledby` now resolves to an empty
 *   string, so the draft section stops being a named region.
 * - `allLabel=""` → `button-name` on the "All" chip: "Element does not have
 *   inner text that is visible to screen readers". A5's `FilterChip` takes its
 *   name from its children and has no `aria-label` prop, so an empty string
 *   produces a nameless toggle — the sixth instance of §8's per-row naming
 *   class, reached through a shell prop rather than through a repeated row.
 * - `filtersLabel=""` → `button-name` on `[data-slot="filters-button"]`.
 *   A5 writes `children ?? "Filters"`, and `""` is not nullish, so the default
 *   is defeated rather than fallen through to — the same defaulting mistake as
 *   K1's `editLabel` and H7 `stem-mixer`'s `label`.
 */
export const EmptyLabel: Story = {
  args: {
    ...FULL_ARGS,
    searchLabel: "",
    filterLabel: "",
    gridLabel: "",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const field = canvasElement.querySelector<HTMLInputElement>('[data-slot="input"]')!;
    const label = canvasElement.querySelector<HTMLElement>(`label[for="${field.id}"]`)!;
    const row = canvasElement.querySelector<HTMLElement>('[data-slot="filter-bar"]')!;
    const grid = canvasElement.querySelector<HTMLElement>('[data-region="artifact-card-grid"]')!;

    // 1. The label element is still there, still associated, and paints
    //    nothing — leaving the placeholder as the field's only candidate name.
    await expect(
      [
        `label text "${label.textContent}"`,
        // 1px, not 0: the label is `sr-only`, so it was never visible to begin
        // with and its emptiness costs a sighted reader nothing. The whole loss
        // falls on the audience it was written for.
        `label height ${label.getBoundingClientRect().height}`,
        `for matches id ${label.getAttribute("for") === field.id}`,
        `placeholder "${field.getAttribute("placeholder")}"`,
      ].join(" · "),
    ).toBe(
      'label text "" · label height 1 · for matches id true · placeholder "Search by what an artifact says"',
    );

    // …and the two name computations disagree, which is the finding. axe is
    // green on this story; the field is addressable by neither the label's text
    // nor the placeholder's.
    await expect(canvas.queryByRole("searchbox", { name: "Search artifacts" })).toBeNull();
    await expect(canvas.queryByRole("searchbox", { name: "Search by what an artifact says" })).toBeNull();
    await expect(canvas.getAllByRole("searchbox")).toHaveLength(1);

    // 2. A group and a landmark, unnamed in silence. Neither role takes its
    //    name from its content, so nothing steps in.
    await expect(
      [
        `row role ${row.getAttribute("role")}`,
        `row label "${row.getAttribute("aria-label")}"`,
        `grid label "${grid.getAttribute("aria-label")}"`,
      ].join(" · "),
    ).toBe('row role group · row label "" · grid label ""');

    // 3. …and the grid is the one that matters: still a tab stop, still the
    //    scroll container, and now announcing nothing about what it holds. The
    //    three named regions that remain are J4's own session sections, which
    //    take their names from `aria-labelledby` and are unaffected — so the
    //    index still has landmarks, just not the one you land on.
    const named = canvas.queryAllByRole("region", { name: /./ });
    await expect(
      [
        `tabindex ${grid.getAttribute("tabindex")}`,
        `overflow ${getComputedStyle(grid).overflowY}`,
        `grid still named: ${named.includes(grid)}`,
        `other named regions ${named.length}`,
      ].join(" · "),
    ).toBe("tabindex 0 · overflow auto · grid still named: false · other named regions 3");
  },
};

/**
 * 375×812, and the width wrapper the other twelve waves used would have proved
 * nothing here.
 *
 * B1's drawer swap keys on a viewport media query — `useIsMobile` subscribes to
 * `matchMedia("(max-width: 767px)")` — so a `w-[375px]` box renders the desktop
 * rail inside it and reports success. `page.viewport(375, 812)` resizes the
 * test iframe itself. The story asserts the before-and-after on purpose: the
 * rail is present at the gate's 1200px and gone at 375px, which is the
 * difference between the two techniques stated as a measurement rather than as
 * advice.
 *
 * The import is dynamic, inside the play, and uses the `vitest/browser`
 * specifier rather than `@vitest/browser/context`. Both land on the same
 * module; the older one prints a deprecation warning on every run that loads
 * the file, and the module itself *throws on evaluation* outside Browser Mode,
 * so a top-level import would take every story in this file down in a built
 * Storybook. O6 `studio-shell` measured both halves of that in this wave.
 *
 * **The card grid is the reason a dated index survives a phone, and the
 * mechanism is J4's rather than this shell's.** `CONTINUE.md` §8 used to carry
 * "grid columns keyed off the viewport rather than the container" with O9 named
 * as one of the two originals; D19 converted J4 to `@container` with
 * `@[40rem]`/`@[64rem]` thresholds, this shell's hand-written override was
 * deleted, and the entry was closed on 2026-09-06. Re-verified here from the
 * consumer side: one column at 375 and — from `Boundary`, which runs after this
 * story — two at 1200 in a half-width pane, with no override anywhere in
 * `artifact-shell.tsx`. **The `block-build-brief.md` copy of that trap is now
 * stale**: it still says "J4 `artifact-grid` columns key off the viewport, not
 * the container … Affects O7, O8, O9".
 *
 * **Recorded, not fixed — the drawer animates under reduced motion.** O2 found
 * this on `chat-shell` in this wave and it is unchanged:
 * `components/ui/sheet.tsx` transitions the panel (`transition duration-200`)
 * and the backdrop (`transition-opacity duration-150`) with no
 * `motion-reduce:transition-none` on either, and the `side=left` panel's
 * starting style is a 40px translate — motion by the convention's own test, not
 * a colour crossfade. Re-grepped in this wave: still zero `motion-reduce`
 * occurrences in that file, so the steering that said it had been fixed was
 * wrong and checking was right. Both durations are measured below. The fix
 * belongs in the vendored file, which every sheet consumer shares, so it is not
 * taken from here.
 *
 * The resize does not leak: `Boundary` below reads 1200px back and its own
 * assertions depend on it.
 */
export const Mobile: Story = {
  args: FULL_ARGS,
  play: async ({ canvasElement }) => {
    const { page } = await import("vitest/browser");
    const railAt = () => canvasElement.querySelector('[data-slot="app-sidebar"]');
    const items = () => canvasElement.querySelector<HTMLElement>('[data-slot="artifact-grid-items"]')!;
    const columns = () => getComputedStyle(items()).gridTemplateColumns.split(" ").length;

    // Before: the desktop branch, at the width the gate renders everything at.
    await expect(
      `innerWidth ${window.innerWidth} · rail ${railAt() !== null} · narrow ${matchMedia("(max-width: 767px)").matches}`,
    ).toBe("innerWidth 1200 · rail true · narrow false");

    await page.viewport(375, 812);

    await waitFor(() =>
      expect(
        `innerWidth ${window.innerWidth} · rail ${railAt() !== null} · narrow ${matchMedia("(max-width: 767px)").matches}`,
      ).toBe("innerWidth 375 · rail false · narrow true"),
    );
    // The reserved column goes with it, which is what gives the index the full
    // width rather than 375 minus a rail.
    await expect(canvasElement.querySelector('[data-slot="sidebar-gap"]')).toBeNull();

    const shell = canvasElement.querySelector<HTMLElement>('[data-slot="artifact-shell"]')!;
    const grid = canvasElement.querySelector<HTMLElement>('[data-region="artifact-card-grid"]')!;
    const header = canvasElement.querySelector<HTMLElement>('[data-region="header"]')!;
    await expect(
      [
        `shell ${Math.round(shell.getBoundingClientRect().width)}`,
        `grid ${Math.round(grid.getBoundingClientRect().width)}`,
        `columns ${columns()}`,
      ].join(" · "),
    ).toBe("shell 375 · grid 375 · columns 1");

    // The facet row wraps rather than scrolling: A5's root is `flex-wrap`, so
    // five chips and a Filters button stack into rows and the header grows.
    const row = canvasElement.querySelector<HTMLElement>('[data-slot="filter-bar"]')!;
    await expect(
      [
        `wrap ${getComputedStyle(row).flexWrap}`,
        `row taller than one chip: ${row.getBoundingClientRect().height > 40}`,
        `header scrolls sideways: ${header.scrollWidth > header.clientWidth}`,
      ].join(" · "),
    ).toBe("wrap wrap · row taller than one chip: true · header scrolls sideways: false");

    // Nothing scrolls sideways — not the document, not the shell, not the grid.
    await expect(
      [
        `document ${document.documentElement.scrollWidth <= 375}`,
        `shell ${shell.scrollWidth <= shell.clientWidth}`,
        `grid ${grid.scrollWidth <= grid.clientWidth}`,
      ].join(" · "),
    ).toBe("document true · shell true · grid true");

    // The header trigger is the only way into the library nav now, so it had
    // better open something.
    const trigger = canvasElement.querySelector<HTMLElement>('[data-slot="sidebar-trigger"]')!;
    await userEvent.click(trigger);
    const drawer = await waitFor(() => {
      const el = document.querySelector<HTMLElement>('[data-slot="sidebar"][data-mobile="true"]');
      expect(el).not.toBeNull();
      return el!;
    });

    // The drawer's reduced-motion branch, guarded. `components/ui/sheet.tsx`
    // had none until this wave, and it was reachable only once the viewport had
    // actually moved — which is why seven waves of width-wrapper stories never
    // found it. O2 `chat-shell` reported it and the integrator fixed both
    // copies. Read as `transition-property`: the fix sets the list to `none`
    // and leaves `0.2s`/`0.15s` in place, so a duration check would still pass
    // after a revert.
    const backdrop = document.querySelector<HTMLElement>('[data-slot="sheet-overlay"]');
    await expect(
      `panel ${getComputedStyle(drawer).transitionProperty} · backdrop ${backdrop ? getComputedStyle(backdrop).transitionProperty : "missing"}`,
    ).toBe("panel none · backdrop none");

    // Let it settle before asserting anything about what is on screen, and
    // before the play returns — axe scans a fading panel at its transitional
    // opacity otherwise.
    await waitFor(() => expect(getComputedStyle(drawer).opacity).toBe("1"));
    await expect(within(drawer).getByRole("button", { name: /All artifacts/ })).toBeVisible();

    await userEvent.keyboard("{Escape}");
    await waitFor(() =>
      expect(document.querySelector('[data-slot="sidebar"][data-mobile="true"]')).toBeNull(),
    );
  },
};

/**
 * O7 `library-shell` above, O9 below. They are the catalogue's two index
 * shells: a persistent left column, a filter surface, a search field and a
 * grid of everything the product has made. They are not interchangeable, and
 * O7's own `Boundary` already points here for the answer — "neither is the
 * right answer for a list of *documents* — that is O9 `artifact-shell`."
 *
 * **The choosing rule is what the card leads with, and it follows from how a
 * person recognises the thing.** An image is recognised by looking at it, so
 * O7 leads with a thumbnail, offers a density control, and hands the reader
 * counted facets in a rail — you know which image you want before you start.
 * A document is not: the spec's first sentence for this shell is that
 * artifacts are mostly text and their auto-generated titles are unreliable, so
 * O9 leads with four clamped lines of the artifact's own prose, has no
 * thumbnail anywhere, and searches the excerpt rather than the name. **Pick O7
 * when the reader will know it on sight. Pick O9 when they will only know it by
 * reading it.**
 *
 * **The second tell is the grouping, and it is the one a refactor would
 * quietly lose.** Both bucket by date. Only O9 puts a *session* layer inside
 * the bucket, because the spec requires the artifact index and the conversation
 * history to stay linked — a card is one heading away from the chat that
 * produced it. O7 has no such layer, because a render has no conversation
 * behind it worth navigating to. Asserted below as nesting rather than
 * described: O9's session sections are descendants of its date buckets, O7 has
 * none at all.
 *
 * O2 `chat-shell` is the third point on the axis and is not rendered here: it
 * is where an artifact is *made*, with its cards inside the conversation. O9 is
 * where they are all kept once one session's worth is not enough. O2's own
 * `Boundary` says the same thing from the other side.
 *
 * Both are live, not screenshots, so axe sees two shells' worth of landmarks at
 * once — which is its own check, and the shape a product with a media library
 * and a document library in one app actually reaches.
 *
 * **Found by rendering them together, and the reason O7 is on top — two index
 * shells on one page break the heading outline, in one order and not the
 * other.** O9 gives the page an `<h1>` (its own `title`); O7's first heading is
 * K-family `filter-panel`'s hardcoded `<h3>`, with no `<h2>` between them
 * anywhere. Put O9 first and axe fails outright: `heading-order`, "Heading
 * levels should only increase by one", against
 * `h3[data-slot="filter-panel-title"]`. Measured in this wave, then the order
 * was flipped rather than the finding suppressed — a decrease is legal, so
 * h3-then-h1 is green and shows exactly the same two shells. The levels are
 * asserted below so the arrangement cannot be mistaken for a preference.
 *
 * **Neither component can be told otherwise, and that is the gap.** `title` on
 * this shell is a `React.ReactNode` rendered into a literal `<h1>`, and
 * `filter-panel` renders a literal `<h3>`; there is no heading-level prop on
 * either. So the *only* remedies available to a host embedding two of these are
 * to reorder them or to accept the violation. O2's `Boundary` renders two
 * shells and stays green for a reason worth naming: B7 `app-topbar` puts its
 * title in a `<span>`, so `chat-shell` contributes no heading at all. Level
 * hardcoding is the category — a shell that assumes it owns the page, met by a
 * panel that assumes it does not.
 *
 * This story also doubles as `Mobile`'s non-leak proof: it runs after the
 * resize and reads 1200px back.
 */
export const Boundary: Story = {
  args: FULL_ARGS,
  render: (args) => (
    // O7 first, O9 second, and the order is load-bearing rather than cosmetic
    // — see this story's description and the `heading-order` measurement in
    // the play.
    <div className="grid h-full grid-rows-2 gap-4 p-4">
      <div className="min-h-0 overflow-hidden rounded-lg border" data-testid="o7">
        <LibraryShell
          title="Library"
          facets={[
            {
              id: "type",
              label: "Type",
              facets: [
                { value: "image", label: "Image", count: 1284 },
                { value: "video", label: "Video", count: 96 },
              ],
            },
          ]}
          groups={[
            {
              id: "today",
              label: "Today",
              items: [
                {
                  id: "a1",
                  name: "Red bicycle, sunlit wall",
                  thumbnail: <div aria-hidden className="h-full w-full bg-primary/20" />,
                },
                {
                  id: "a2",
                  name: "Blue awning",
                  thumbnail: <div aria-hidden className="h-full w-full bg-secondary" />,
                },
              ],
            },
          ]}
        />
      </div>
      <div className="min-h-0 overflow-hidden rounded-lg border" data-testid="o9">
        <ArtifactShell {...args} />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const o9 = canvasElement.querySelector<HTMLElement>('[data-testid="o9"]')!;
    const o7 = canvasElement.querySelector<HTMLElement>('[data-testid="o7"]')!;

    // The viewport is back where this story's own assertions need it.
    await expect(window.innerWidth).toBe(1200);

    // Tell one: what the card leads with. O9 has excerpts and no thumbnails;
    // O7 has thumbnails and no excerpts.
    await expect(
      [
        `O9 excerpts ${o9.querySelectorAll('[data-slot="artifact-grid-excerpt"]').length}`,
        `O9 thumbnails ${o9.querySelectorAll('[data-slot="preview-tile-frame"]').length}`,
        `O7 excerpts ${o7.querySelectorAll('[data-slot="artifact-grid-excerpt"]').length}`,
        `O7 thumbnails ${o7.querySelectorAll('[data-slot="preview-tile-frame"]').length}`,
      ].join(" · "),
    ).toBe("O9 excerpts 6 · O9 thumbnails 0 · O7 excerpts 0 · O7 thumbnails 2");

    // Tell two: the session layer. O9 nests sessions inside date buckets; O7
    // buckets by date and stops there.
    const bucket = o9.querySelector<HTMLElement>('[data-slot="date-section"]')!;
    await expect(
      [
        `O9 sessions inside a bucket: ${bucket.querySelectorAll('[data-slot="artifact-grid-session"]').length > 0}`,
        `O7 sessions anywhere: ${o7.querySelectorAll('[data-slot="artifact-grid-session"]').length}`,
        `both bucket by date: ${o9.querySelectorAll('[data-slot="date-section"]').length > 0 && o7.querySelectorAll('[data-slot="date-section"]').length > 0}`,
      ].join(" · "),
    ).toBe("O9 sessions inside a bucket: true · O7 sessions anywhere: 0 · both bucket by date: true");

    // Tell three: O7 hands the reader counted facets and a density control;
    // O9 derives its facets from the artifacts and offers no density at all,
    // because four lines of prose is not a size preference.
    await expect(
      [
        `O7 facet counts ${o7.querySelectorAll('[data-slot="filter-panel-facet-count"]').length > 0}`,
        `O9 density control ${within(o9).queryAllByRole("radio").length}`,
      ].join(" · "),
    ).toBe("O7 facet counts true · O9 density control 0");

    // The heading outline, which is what decided the order these two are in.
    // O9 is the only one that claims the page; O7's first heading is three
    // levels down. Reversed, this is an axe `heading-order` failure — see the
    // description.
    const levels = (el: HTMLElement) =>
      Array.from(el.querySelectorAll("h1,h2,h3,h4,h5,h6"))
        .map((h) => h.tagName.toLowerCase())
        .join(",");
    await expect(`O7 ${levels(o7) || "none"} → O9 ${levels(o9) || "none"}`).toBe("O7 h3 → O9 h1");

    // And J4's container query, from the consumer side: the same grid that
    // gave one column at 375px gives two in a half-width pane, with no
    // override in `artifact-shell.tsx`. §8's viewport-columns entry, closed.
    const items = o9.querySelector<HTMLElement>('[data-slot="artifact-grid-items"]')!;
    await expect(
      `columns in a half-width shell: ${getComputedStyle(items).gridTemplateColumns.split(" ").length}`,
    ).toBe("columns in a half-width shell: 2");
  },
};

/* -------------------------------------------------------------------------
 * Beyond the eight: one open follow-up from CONTINUE.md §8, closed.
 * ---------------------------------------------------------------------- */

/**
 * The shell at 600px tall — shorter than any viewport, which is the ordinary
 * embedded case and the one that used to hide the sidebar's bottom slots.
 *
 * `CONTINUE.md` §8 records that this assertion existed only on `HomeShell` and
 * that "`chat-shell` and `artifact-shell` forward `sidebarFooter` to
 * `AppSidebar`'s `footer` prop identically to `HomeShell` and could reuse
 * `EmbeddedWithSidebarFooter` almost verbatim". O2 checked that claim for its
 * half in this wave; checked here for O9's, against all three sources, and it
 * holds: `home-shell.tsx`, `chat-shell.tsx` and `artifact-shell.tsx` all pass
 * `footer={sidebarFooter}` to `AppSidebar` unchanged, and all three roots carry
 * the same `EMBEDDABLE_SHELL` + `SIDEBAR_FILLS_SHELL` pair. So this is
 * `HomeShell`'s story with the component swapped and nothing else changed, and
 * the follow-up is now closed for two of the three shells it named — only
 * `docs-shell`'s `railFooter` and `records-shell`'s missing footer prop remain.
 *
 * The assertion is geometric rather than a class check: the footer's box has to
 * sit inside the shell's box. A class assertion would pass against a constant
 * that had been deleted from the `cn()` call and left declared — which is the
 * failure mode worth guarding, because `SIDEBAR_FILLS_SHELL` is the half of the
 * fix that nothing else would notice going missing.
 *
 * The frame is queried by `data-testid`, not `canvasElement.firstElementChild`:
 * the meta decorator already wraps every story in its own `h-svh` div, so the
 * first child of the canvas is that wrapper, not this story's frame.
 */
export const EmbeddedWithSidebarFooter: Story = {
  args: FULL_ARGS,
  render: (args) => (
    <div data-testid="embedded-frame" className="h-[600px] overflow-hidden">
      <ArtifactShell {...args} sidebarFooter={<button type="button">Account</button>} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const shell = canvasElement.querySelector<HTMLElement>('[data-testid="embedded-frame"]')!;
    const footer = canvasElement.querySelector<HTMLElement>('[data-slot="app-sidebar-footer"]')!;

    const shellBox = shell.getBoundingClientRect();
    const footerBox = footer.getBoundingClientRect();

    await expect(footerBox.bottom).toBeLessThanOrEqual(shellBox.bottom + 1);
    await expect(footerBox.height).toBeGreaterThan(0);
  },
};
