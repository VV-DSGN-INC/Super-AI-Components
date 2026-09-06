import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { Button } from "@/components/ui/button";
import { focusTreatmentSignature, settledFocusRing } from "@/lib/focus-ring";

import { ExploreGallery, type ExploreGalleryItem } from "@/registry/super-ai/explore-gallery";
import { RecentGrid } from "@/registry/super-ai/recent-grid";
import { ExploreGalleryDocs } from "@/content/components/explore-gallery.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

function Swatch({ tone }: { tone: "primary" | "secondary" | "muted" }) {
  return (
    <div
      className={
        tone === "primary"
          ? "bg-primary/25 size-full"
          : tone === "secondary"
            ? "bg-secondary size-full"
            : "bg-muted size-full"
      }
    />
  );
}

const ITEMS: ExploreGalleryItem[] = [
  {
    id: "1",
    title: "Neon city at dusk",
    aspectRatio: "3 / 4",
    type: "image",
    typeLabel: "Image",
    author: "@lumen",
    metric: "1.2k",
    prompt: "neon city at dusk, wet asphalt reflections, anamorphic",
    media: <Swatch tone="primary" />,
  },
  {
    id: "2",
    title: "Paper-cut forest",
    aspectRatio: "16 / 9",
    type: "image",
    typeLabel: "Image",
    author: "@fold",
    metric: "840",
    prompt: "layered paper-cut forest, warm rim light",
    media: <Swatch tone="secondary" />,
  },
  {
    id: "3",
    title: "Chrome jellyfish",
    aspectRatio: "1 / 1",
    type: "video",
    typeLabel: "Video",
    author: "@drift",
    metric: "3.4k",
    prompt: "chrome jellyfish drifting through black water, slow motion",
    media: <Swatch tone="muted" />,
  },
  {
    id: "4",
    title: "Brutalist greenhouse",
    aspectRatio: "4 / 5",
    type: "image",
    typeLabel: "Image",
    author: "@cass",
    metric: "612",
    prompt: "brutalist concrete greenhouse, overgrown, golden hour",
    media: <Swatch tone="secondary" />,
  },
  {
    id: "5",
    title: "Tide pool macro",
    aspectRatio: "3 / 2",
    type: "image",
    typeLabel: "Image",
    author: "@sable",
    metric: "298",
    prompt: "tide pool macro photography, iridescent shells",
    media: <Swatch tone="muted" />,
  },
];

const SORTS = [
  { value: "hot", label: "Hot" },
  { value: "new", label: "New" },
  { value: "top", label: "Top" },
];

const TYPES = [
  { value: "all", label: "All", count: 240 },
  { value: "image", label: "Images", count: 180 },
  { value: "video", label: "Video", count: 60 },
];

const meta: Meta<typeof ExploreGallery> = {
  title: "Super AI/Explore Gallery",
  component: ExploreGallery,
  parameters: { layout: "centered", docs: { page: componentDocsPage(ExploreGalleryDocs) } },
  decorators: [
    (Story) => (
      <div className="h-[34rem] w-[52rem] max-w-full">
        <Story />
      </div>
    ),
  ],
  args: { items: ITEMS, className: "h-full" },
};

export default meta;
type Story = StoryObj<typeof ExploreGallery>;

/** Axis one on its own: ordering the whole feed, removing nothing from it. */
export const SortTabs: Story = {
  args: { sorts: SORTS, defaultSort: "hot", dockedPrompt: false },
};

/** Axis two, alongside the first — two controls, two names, never merged. */
export const TypePills: Story = {
  args: { sorts: SORTS, types: TYPES, defaultType: "all", dockedPrompt: false },
};

/** The next page is a focusable button with a live count, not a scroll position. */
export const InfiniteScroll: Story = {
  args: {
    sorts: SORTS,
    types: TYPES,
    defaultType: "all",
    totalCount: 240,
    hasMore: true,
    dockedPrompt: false,
  },
};

/** The prompt bar lives above the feed, so a tile's Remix converts in place. */
export const DockedPrompt: Story = {
  args: { sorts: SORTS, types: TYPES, defaultType: "all", totalCount: 240, hasMore: true },
};

/* -------------------------------------------------------------------------
 * Case stories — the situations a community feed meets in a product, as
 * opposed to the four prop combinations above. See
 * docs/design-system/story-conventions.md.
 *
 * Seven of the eight are written. The one that is not:
 *
 * // case-skip: ReducedMotion — grepped the whole composed tree: no keyframes anywhere, and every transition is a colour or opacity crossfade that moves nothing
 * `grep -n "animate-\|transition-"` over `explore-gallery.tsx` and both
 * registry components it composes returns four hits and no `animate-*` at
 * all: `transition-opacity` on the tile action strip (`opacity-0` →
 * `opacity-100` under `group-focus-within`/`group-hover`),
 * `transition-colors` on a sort tab, `transition-colors` on
 * `media-prompt-bar`'s root, and `transition-colors motion-reduce:transition-none`
 * on `choice-chip`, which already carries its own branch. Nothing changes
 * position or size, so this is the `reset-affordance` case the convention's
 * mechanical fact 3 names — the qualifier "a transition a user would
 * perceive as motion" is the load-bearing half, and a fade does not clear
 * it; adding the class here would be adding it to look thorough. The two
 * `transition-all`s in the tree are on the vendored `Button` and `Badge`,
 * which `CONTINUE.md` §8 records as a primitive-wide posture no case story
 * fixes. `vitest.config.ts` already emulates reduce for every test, so a
 * story here would render pixel-identical to `DockedPrompt`.
 * ---------------------------------------------------------------------- */

/**
 * Right-to-left. Almost all of this component mirrors for free, and the
 * exceptions are the point of the story.
 *
 * **Mirrors on its own.** The masonry is CSS multi-column, which flows along
 * the inline axis, so column one becomes the *rightmost* and DOM order still
 * matches reading order: in the 832px frame below the first tile's right edge
 * lands on the list's right edge and every other column sits to its left. The
 * `w-fit` sort tablist hugs the same start edge, and the pill row and tile
 * meta row follow it too, none of them with any direction-aware code.
 *
 * **Fixed in-wave.** The facet count beside a type pill was `ml-1.5`, a
 * physical margin — `CONTINUE.md` §8's sweep table listed it and it is now
 * `ms-1.5`. It is byte-identical in LTR and the assertion below reads the
 * used margin back on both sides so the swap cannot silently regress, which
 * is H3 `track-lane`'s pattern.
 *
 * **What the swap buys, and what it costs.** Measured against the old class
 * with an Arabic facet label (`الكل`, count 240) in a 71px pill: the label run
 * is RTL so the count paints to its left, at 778–801, and `ml-1.5` put the 6px
 * at 772–778 — against the chip's own padding, with the digits touching the
 * label. `margin-inline-start` resolves to `margin-right` here, which is the
 * side the label is on, so the swap is what separates them. The cost is the
 * mixed-script case rendered below: with a Latin label the bidi algorithm
 * keeps "All 240" as one left-to-right run, and a logical margin still
 * resolves against the container's `direction`, so the gap moves to that
 * run's trailing edge. H4 `transcript-editor` recorded the same collision on
 * a second component, and there is likewise no API here separating the
 * chrome's direction from a label's language.
 *
 * **Recorded, not swept: the tile's two corners do not mirror.** The type
 * badge is `absolute top-2 left-2` and the action strip `absolute top-2
 * right-2`, so under RTL the badge stays on the visual left while the title
 * and author beneath it start on the right. Both participants are classes
 * and nothing else — no inline style, no JavaScript axis, no clip geometry —
 * decides that side, so it passes the F5/H3 test the sweep entry sets; it is
 * the same `right-2` → `end-2` the wave-1 agents added to that table for A8
 * `preview-tile`, here as a pair with `left-2` → `start-2`. Neither line is in
 * the table, so it is measured below and left for the sweep rather than taken
 * here.
 */
export const RTL: Story = {
  render: (args) => (
    <div dir="rtl" className="h-full">
      <ExploreGallery {...args} />
    </div>
  ),
  args: { sorts: SORTS, types: TYPES, defaultType: "all", totalCount: 240, hasMore: true },
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="explore-gallery"]')!;
    const slot = (name: string) => root.querySelector<HTMLElement>(`[data-slot="${name}"]`)!;

    // 1. The columns run right-to-left, so column one is the rightmost and
    //    the first tile is in it. Which tile lands in column two depends on
    //    how the balancer distributes heights, so the claim is about the
    //    first tile and the leftmost tile, not about an adjacent pair.
    const list = slot("explore-gallery-masonry");
    await expect(getComputedStyle(list).direction).toBe("rtl");
    const tiles = Array.from(root.querySelectorAll<HTMLElement>('[data-slot="explore-gallery-item"]'));
    await expect(tiles.length).toBeGreaterThan(1);
    await expect(Math.round(tiles[0].getBoundingClientRect().right)).toBe(
      Math.round(list.getBoundingClientRect().right),
    );
    const leftmost = Math.min(...tiles.map((t) => t.getBoundingClientRect().left));
    await expect(leftmost).toBeLessThan(tiles[0].getBoundingClientRect().left);

    // 2. The sort tablist is w-fit and hugs the start edge, which is now the
    //    right one.
    const tabs = slot("explore-gallery-sorts");
    await expect(Math.round(tabs.getBoundingClientRect().right)).toBe(
      Math.round(root.getBoundingClientRect().right),
    );

    // 3. The swap, read back as used values rather than as a class name.
    const count = root.querySelector<HTMLElement>('[data-slot="choice-chip"] span')!;
    const margins = getComputedStyle(count);
    await expect(`${margins.marginRight}/${margins.marginLeft}`).toBe("6px/0px");

    // 4. The corner pair that does not mirror. The badge is nominally
    //    top-start and the actions top-end; under RTL they are the wrong way
    //    round, and this records it without pinning it as correct.
    const badge = slot("explore-gallery-item-type").getBoundingClientRect();
    const actions = slot("explore-gallery-item-actions").getBoundingClientRect();
    const tile = tiles[0].getBoundingClientRect();
    const startSide = (r: DOMRect) => Math.round(tile.right - r.right);
    await expect(
      `badge-from-start=${startSide(badge) < 20} actions-from-start=${startSide(actions) < 20}`,
    ).toBe("badge-from-start=false actions-from-start=true");
  },
};

/**
 * The whole tab sequence, and the answer to the question `infinite-scroll`
 * raises: **yes, a keyboard user can reach page two — but only after every
 * control on page one.** Fourteen stops here, in this order:
 *
 * 1–4 the docked prompt (textarea, Attach, Add negative prompt, Create),
 * 5 the sort tablist — *one* stop, because Base UI's `Tabs` is a composite
 * with a roving index, 6–8 the three type pills, which are *three* stops
 * because A4 `choice-chips` ships `role="radiogroup"` with a `TODO: roving
 * tabIndex` and none, 9 the feed itself (`Tabs.Panel`, `tabIndex=0`),
 * 10–13 the two tiles' Open and Remix buttons, and 14 Load more.
 *
 * So the cost of reaching page two is linear in the page you already have:
 * two tiles put four stops in front of the button, and the docs module's
 * thirty-tile figure puts sixty. Load more is reachable, which is the spec's
 * fourth decision holding, and it is the only route — nothing binds a
 * shortcut to it.
 *
 * **Two exclusions from the focus-treatment check, both measured, neither
 * asserted in either direction.**
 *
 * - *The selected type pill paints the same treatment focused and
 *   unfocused.* `choice-chip` gives a selected chip a permanent
 *   `ring-ring border-ring ring-2` and its focus style is `focus-visible:ring-ring
 *   focus-visible:ring-2` — the same colour at the same width. Read back, the
 *   two `box-shadow` strings are byte-identical (`oklch(0.708 0 0) 0px 0px 0px
 *   2px`); only `outline-width` moves, from 3px to 1px, under an
 *   `outline-style: none` that paints neither. This is H6 `waveform-editor`'s
 *   "permanent shadow reading as a ring" in a shared component, so it reaches
 *   every `choice-chips` consumer, not only this feed.
 * - *The prompt textarea paints nothing, and here the differential is the
 *   weaker check.* `media-prompt-bar` sets `border-none
 *   focus-visible:ring-0`, which wave 1 recorded. What is new is the shape:
 *   focus does change the signature — one composed layer goes from
 *   `rgba(0, 0, 0, 0) 0px 0px 0px 0px` to `oklab(0.708 0 0 / 0.5) 0px 0px 0px
 *   0px`, so the colour arrives while the geometry stays at zero. So
 *   `focusTreatmentSignature` reports a change and `settledFocusRing`
 *   correctly reports no ring. The two checks are complements, not
 *   alternatives, and every other stop below is held to both.
 *
 * **Recorded and not asserted:** when the last page lands and `hasMore` flips
 * to false, Load more unmounts under the focus and focus falls to `<body>`.
 * The docs module carries it; asserting it would make it permanent. What is
 * asserted is the good half — while `hasMore` stays true the button keeps
 * focus across the re-render and the live region says so.
 */
export const KeyboardOrder: Story = {
  render: () => <LoadMoreHost />,
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="explore-gallery"]')!;
    const canvas = within(canvasElement);
    const name = (el: Element | null) =>
      el === null
        ? "nothing"
        : `${el.getAttribute("data-slot")}[${(el.getAttribute("aria-label") ?? el.textContent ?? "").trim().slice(0, 22)}]`;

    // 1. The sequence itself, walked one Tab at a time from outside the
    //    component. Every entry is asserted by slot, so a re-order or a lost
    //    stop reads as a diff rather than as a count.
    (document.activeElement as HTMLElement | null)?.blur?.();
    const stops: HTMLElement[] = [];
    for (let i = 0; i < 20; i += 1) {
      const previous = document.activeElement;
      await userEvent.tab();
      await waitFor(() => expect(document.activeElement).not.toBe(previous));
      const active = document.activeElement as HTMLElement;
      if (!root.contains(active)) break;
      stops.push(active);
    }
    await expect(stops.map((s) => s.getAttribute("data-slot"))).toEqual([
      "media-prompt-bar-textarea",
      "media-prompt-bar-attach",
      "media-prompt-bar-negative-toggle",
      "media-prompt-bar-submit",
      "explore-gallery-sort",
      "choice-chip",
      "choice-chip",
      "choice-chip",
      "explore-gallery-feed",
      "explore-gallery-item-open",
      "explore-gallery-item-remix",
      "explore-gallery-item-open",
      "explore-gallery-item-remix",
      "explore-gallery-load-more",
    ]);

    // One stop for three sort tabs — the composite half of the contract that
    // the three separate pill stops above are the counter-example to.
    const tabList = root.querySelector<HTMLElement>('[data-slot="explore-gallery-sorts"]')!;
    await expect(tabList.querySelectorAll("button")).toHaveLength(3);
    await expect(
      Array.from(tabList.querySelectorAll<HTMLElement>("button")).filter((b) => b.tabIndex === 0),
    ).toHaveLength(1);

    // 2. A second lap, this time asserting the focus treatment at each stop.
    //    Indices 0 (the textarea) and 5 (the selected pill) are excluded — see
    //    this story's description; both are measured there, neither is
    //    asserted here.
    const excluded = new Set([0, 5]);
    (document.activeElement as HTMLElement | null)?.blur?.();
    const resting = stops.map((s) => focusTreatmentSignature(s));
    for (const [i, stop] of stops.entries()) {
      const previous = document.activeElement;
      await userEvent.tab();
      await waitFor(() => expect(document.activeElement).not.toBe(previous));
      await expect(name(document.activeElement)).toBe(name(stop));
      await expect(`${i} focusVisible=${stop.matches(":focus-visible")}`).toBe(`${i} focusVisible=true`);
      if (excluded.has(i)) continue;
      // Both halves: something is painted, *and* focus is what painted it.
      await settledFocusRing(stop, waitFor);
      await expect(`${name(stop)} caused=${focusTreatmentSignature(stop) !== resting[i]}`).toBe(
        `${name(stop)} caused=true`,
      );
    }

    // 3. Load more keeps focus while another page exists, and the live region
    //    is what says the page landed.
    const loadMore = canvas.getByRole("button", { name: "Load more" });
    await expect(document.activeElement).toBe(loadMore);
    const status = root.querySelector<HTMLElement>('[data-slot="explore-gallery-status"]')!;
    await expect(status.textContent).toBe("2 of 6 shown");
    await userEvent.keyboard("{Enter}");
    await waitFor(() => expect(status.textContent).toBe("4 of 6 shown"));
    await expect(document.activeElement).toBe(loadMore);
  },
};

/** A host that actually pages, so a keypress on Load more is visible. */
function LoadMoreHost() {
  const [count, setCount] = React.useState(2);
  return (
    <ExploreGallery
      className="h-full"
      items={ITEMS.slice(0, count)}
      sorts={SORTS}
      types={TYPES}
      defaultType="all"
      defaultSort="hot"
      totalCount={6}
      hasMore={count < 6}
      onLoadMore={() => setCount((n) => n + 2)}
      promptValue="a wet street at night"
      onPromptValueChange={() => {}}
    />
  );
}

/**
 * Three controlled pairs, held the hard way: the host records what the feed
 * asked for and applies it only when told to.
 *
 * The third pair is why this story earns its place. The docs module's fourth
 * pitfall says a host that controls `promptValue` and forgets to apply
 * `onPromptValueChange` gets a Remix button that appears to do nothing — this
 * is the only place that is measured. Remix fires `onPromptValueChange` with
 * the tile's prompt and the field stays empty until the host applies it,
 * which is correct controlled behaviour and also a foot-gun with no visible
 * symptom.
 *
 * The sort and type pairs are the same claim on the two axes the spec insists
 * stay separate: clicking a tab does not reorder, clicking a pill does not
 * filter, both callbacks still carry the value a consumer needs, and a
 * re-render with unchanged props (proved by the pass counter, not assumed)
 * leaves all three where they were.
 *
 * What is *not* controllable is worth naming beside it, because it is
 * `CONTINUE.md` §8's two entries against this component. The first: prompt,
 * sort tabs, type pills and feed sit under one root with no slots, so a host
 * that wants the feed without the prompt, or the controls without the feed,
 * has `dockedPrompt={false}` and nothing else — O8 mounted it feed-only and
 * hosted the rest itself. The second: J3, J4 and J5 are listed as having no
 * per-item slot. That is the half-true one — `ExploreGalleryItem.actions`
 * takes nodes *beside* Remix, so what is missing is a slot over the tile
 * body, not over the tile's controls.
 */
export const Controlled: Story = {
  render: () => <ControlledHost />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="explore-gallery"]')!;
    const textarea = root.querySelector<HTMLTextAreaElement>('[data-slot="media-prompt-bar-textarea"]')!;

    await expect(root.dataset.sort).toBe("hot");
    await expect(root.dataset.type).toBe("all");
    await expect(textarea.value).toBe("");

    // Pills are addressed by position, not by accessible name: the facet
    // count is a bare `<span>` separated only by a margin, so the name
    // computes as "Video60" rather than "Video 60" — see `EmptyLabel`.
    const pills = Array.from(root.querySelectorAll<HTMLElement>('[data-slot="choice-chip"]'));

    // 1. Interaction alone moves nothing on any of the three axes.
    await userEvent.click(canvas.getByRole("tab", { name: "Top" }));
    await expect(root.dataset.sort).toBe("hot");
    await userEvent.click(pills[2]);
    await expect(root.dataset.type).toBe("all");
    await expect(pills[0]).toHaveAttribute("aria-checked", "true");
    await expect(pills[2]).toHaveAttribute("aria-checked", "false");
    await userEvent.click(canvas.getByRole("button", { name: "Remix: Neon city at dusk" }));
    await expect(textarea.value).toBe("");

    // 2. …and every callback fired with the payload a host has to apply.
    await expect(canvas.getByTestId("sort")).toHaveTextContent("top");
    await expect(canvas.getByTestId("type")).toHaveTextContent("video");
    await expect(canvas.getByTestId("prompt")).toHaveTextContent(
      "neon city at dusk, wet asphalt reflections, anamorphic",
    );

    // 3. A re-render with unchanged props holds all three fixed. Prove the
    //    re-render happened first, or this asserts nothing.
    await expect(canvas.getByTestId("pass")).toHaveTextContent("1");
    await userEvent.click(canvas.getByRole("button", { name: "Re-render" }));
    await expect(canvas.getByTestId("pass")).toHaveTextContent("2");
    await expect(root.dataset.sort).toBe("hot");
    await expect(root.dataset.type).toBe("all");
    await expect(textarea.value).toBe("");

    // 4. Applying the requests is sufficient — the payloads carried enough.
    await userEvent.click(canvas.getByRole("button", { name: "Apply" }));
    await waitFor(() => expect(root.dataset.sort).toBe("top"));
    await expect(root.dataset.type).toBe("video");
    await expect(textarea.value).toBe("neon city at dusk, wet asphalt reflections, anamorphic");
  },
};

function ControlledHost() {
  const [applied, setApplied] = React.useState({ sort: "hot", type: "all", prompt: "" });
  const [requested, setRequested] = React.useState({ sort: "—", type: "—", prompt: "—" });
  const [pass, setPass] = React.useState(1);

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="min-h-0 flex-1">
        <ExploreGallery
          className="h-full"
          items={ITEMS.slice(0, 3)}
          sorts={SORTS}
          types={TYPES}
          sort={applied.sort}
          onSortChange={(sort) => setRequested((r) => ({ ...r, sort }))}
          type={applied.type}
          onTypeChange={(type) => setRequested((r) => ({ ...r, type }))}
          promptValue={applied.prompt}
          onPromptValueChange={(prompt) => setRequested((r) => ({ ...r, prompt }))}
        />
      </div>
      <div className="flex shrink-0 items-end justify-between gap-4">
        <dl className="text-foreground grid grid-cols-[auto_1fr] gap-x-3 text-xs">
          <dt>last onSortChange</dt>
          <dd data-testid="sort">{requested.sort}</dd>
          <dt>last onTypeChange</dt>
          <dd data-testid="type">{requested.type}</dd>
          <dt>last onPromptValueChange</dt>
          <dd data-testid="prompt" className="truncate">
            {requested.prompt}
          </dd>
          <dt>host render pass</dt>
          <dd data-testid="pass" className="tabular-nums">
            {pass}
          </dd>
        </dl>
        <div className="flex shrink-0 gap-2">
          <Button size="sm" variant="outline" onClick={() => setPass((n) => n + 1)}>
            Re-render
          </Button>
          <Button
            size="sm"
            onClick={() =>
              setApplied({
                sort: requested.sort === "—" ? "hot" : requested.sort,
                type: requested.type === "—" ? "all" : requested.type,
                prompt: requested.prompt === "—" ? "" : requested.prompt,
              })
            }
          >
            Apply
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Everything optional left out, plus the empty string in six of the places a
 * caller can put one — three on the component (`openLabel`, `remixLabel`,
 * `feedLabel`) and three on an item (`typeLabel`, `author`, `metric`). `title`
 * is the only required field on an item, and it carries the whole tile when
 * the rest is missing.
 *
 * What holds: a tile with nothing but `id`, `title` and `media` renders a
 * media box and a title, and its open button is still named, because
 * `openLabel=""` degrades the name from "Open Neon city at dusk" to the title
 * alone rather than to nothing. A facet `count: 0` is rendered rather than
 * hidden — the guard is `=== undefined`, so an empty facet says so.
 *
 * What does not, and neither is gate-visible:
 *
 * - **`typeLabel=""` deletes the badge instead of falling back to `type`.**
 *   `badgeLabel = item.typeLabel ?? item.type` treats `""` as a value, so an
 *   item that passes `type: "image"` and an empty display label gets no badge
 *   at all — while `data-type="image"` stays on the tile, so it still filters
 *   and the pill count still includes it. That is the one collapse with a
 *   fallback to lose; `author=""` and `metric=""` also vanish, but they have
 *   nothing to fall back to. Third instance of the shape after H7
 *   `stem-mixer`'s `label=""` and P1 `data-views`' empty group label.
 * - **`remixLabel=""` ships an 18×24px button with no visible content**, named
 *   `": Paper-cut forest"` — the interpolation leaves the colon behind. It
 *   passes `button-name` because the name is non-empty, and WCAG 2.2's
 *   24×24 minimum is axe's experimental `target-size`, which is off. So
 *   nothing catches it in either direction. Measured below, not repaired: the
 *   default is `"Remix"` and choosing a fallback is an API decision.
 * - **`feedLabel=""` leaves `role="region"` with `aria-label=""`.** Asserted
 *   below as the unnamed region it is.
 * - **A facet count has no textual separator from its label.** The count is a
 *   bare `<span>` set off by a margin, and a margin is not whitespace, so the
 *   accessible name of a type pill computes as `"All0"` — and, on the fixture
 *   the other stories use, `"Images180"` and `"Video60"`. Third instance of
 *   the shape H4 `transcript-editor` found (`gap-x-1` in place of a space,
 *   giving `"Sothesecondpass"`). Recorded here rather than asserted, so a fix
 *   does not have to come back and delete a test; every story in this file
 *   addresses pills by position for the same reason.
 */
export const EmptyLabel: Story = {
  args: {
    items: [
      { id: "1", title: "Neon city at dusk", media: <Swatch tone="primary" /> },
      {
        id: "2",
        title: "Paper-cut forest",
        type: "image",
        typeLabel: "",
        author: "",
        metric: "",
        prompt: "layered paper-cut forest, warm rim light",
        media: <Swatch tone="secondary" />,
      },
    ],
    types: [{ value: "all", label: "All", count: 0 }],
    defaultType: "all",
    openLabel: "",
    remixLabel: "",
    feedLabel: "",
    dockedPrompt: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="explore-gallery"]')!;

    // 1. The title is the last line of defence, and it holds.
    canvas.getByRole("button", { name: "Neon city at dusk" });
    canvas.getByRole("button", { name: "Paper-cut forest" });

    // 2. A zero facet count is rendered, not hidden — the guard is
    //    `=== undefined`, so an empty facet says so rather than vanishing.
    const pill = root.querySelector<HTMLElement>('[data-slot="choice-chip"]')!;
    await expect(pill).toHaveAttribute("role", "radio");
    await expect(pill.querySelector("span")?.textContent).toBe("0");

    // 3. Every empty-string slot collapses the element rather than falling
    //    back — including the badge, whose `type` would have named it.
    await expect(root.querySelector('[data-slot="explore-gallery-item-type"]')).toBeNull();
    await expect(root.querySelector('[data-slot="explore-gallery-item-author"]')).toBeNull();
    await expect(root.querySelector('[data-slot="explore-gallery-item-metric"]')).toBeNull();
    const tile = root.querySelectorAll<HTMLElement>('[data-slot="explore-gallery-item"]')[1];
    await expect(tile.dataset.type).toBe("image");

    // 4. The Remix control survives as a named, invisible, undersized target.
    //    Recorded, not endorsed: repairing it means choosing a fallback for an
    //    empty `remixLabel`, which is an API decision, so the measurement is
    //    written down here and the assertion will fail when someone makes it.
    const remix = root.querySelector<HTMLElement>('[data-slot="explore-gallery-item-remix"]')!;
    await expect(remix).toHaveAttribute("aria-label", ": Paper-cut forest");
    await expect(remix.textContent).toBe("");
    const box = remix.getBoundingClientRect();
    await expect(`${Math.round(box.width)}x${Math.round(box.height)} under24=${box.width < 24}`).toBe(
      "18x24 under24=true",
    );

    // 5. The feed region is left unnamed rather than defaulted.
    const feed = root.querySelector<HTMLElement>('[data-slot="explore-gallery-feed"]')!;
    await expect(feed).toHaveAttribute("role", "region");
    await expect(feed).toHaveAttribute("aria-label", "");
  },
};

/**
 * Eighty to ninety characters in each of the four author-supplied slots, and
 * the component answers in three different ways.
 *
 * - **A tile title and author truncate.** They sit in a `min-w-0 flex-1`
 *   column with `truncate`, so the meta row keeps its one-line height and the
 *   tile keeps the geometry the masonry packing depends on. There is no
 *   `title` attribute, so the full string is unreachable by hover — the same
 *   gap D3 `context-chips` records.
 * - **A sort label neither wraps nor truncates.** `Tabs.List` is `w-fit` and
 *   each tab is `whitespace-nowrap`, so the tablist grows with the label and
 *   nothing bounds it: one 83-character sort plus a three-character one
 *   measures 650px, against 375 for a phone column. A third long sort clears
 *   this story's own 832px frame, and there is no scroll container to catch
 *   it — the B4 shape (`whitespace-nowrap` under a fixed height) reached from
 *   the width side.
 * - **A type pill wraps.** `choice-chip` sets no `whitespace` rule and
 *   `ChoiceChips` is `flex-wrap`, so the same length grows the pill's height
 *   rather than the row's width. Two composed controls, opposite answers,
 *   which is a second reason the spec keeps the two axes as two controls.
 *
 * The fifth slot belongs to a composed component and is cited rather than
 * re-measured: `media-prompt-bar`'s textarea is `field-sizing-content
 * min-h-16`, and wave 1 measured that the floor absorbs two wrapped lines
 * before the field grows at all.
 */
export const LongContent: Story = {
  args: {
    items: [
      {
        ...ITEMS[0],
        title:
          "Neon city at dusk with wet asphalt reflections, shot on an anamorphic lens and graded warm",
        author: "@a-very-long-community-handle-that-will-not-fit-inside-a-tile-meta-row-at-any-width",
      },
      ITEMS[1],
    ],
    sorts: [
      {
        value: "hot",
        label: "Hot right now across every model, every community collection and every public remix",
      },
      { value: "new", label: "New" },
    ],
    defaultSort: "hot",
    types: [
      {
        value: "all",
        label: "Everything anyone has shared publicly, including drafts, remixes and derived works",
        count: 240,
      },
      { value: "video", label: "Video", count: 60 },
    ],
    defaultType: "all",
    dockedPrompt: false,
  },
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="explore-gallery"]')!;
    const slot = (name: string) => root.querySelector<HTMLElement>(`[data-slot="${name}"]`)!;

    // 1. Title and author truncate, and neither carries the full string.
    const title = slot("explore-gallery-item-title");
    const author = slot("explore-gallery-item-author");
    for (const el of [title, author]) {
      const style = getComputedStyle(el);
      await expect(`${style.textOverflow}/${style.whiteSpace}`).toBe("ellipsis/nowrap");
      await expect(el.scrollWidth).toBeGreaterThan(el.clientWidth);
      await expect(el.getAttribute("title")).toBeNull();
    }

    // 2. The sort tab does neither — nothing clips it, and the tablist grows
    //    to fit. 522px for one long label and one short one, against 375.
    const tab = root.querySelector<HTMLElement>('[data-slot="explore-gallery-sort"]')!;
    await expect(getComputedStyle(tab).whiteSpace).toBe("nowrap");
    await expect(getComputedStyle(tab).textOverflow).toBe("clip");
    await expect(tab.scrollWidth).toBeLessThanOrEqual(tab.clientWidth + 1);
    await expect(slot("explore-gallery-sorts").getBoundingClientRect().width).toBeGreaterThan(375);

    // 3. The type pill wraps instead, so the row grows down rather than out.
    const chip = root.querySelector<HTMLElement>('[data-slot="choice-chip"]')!;
    await expect(getComputedStyle(chip).whiteSpace).toBe("normal");
    await expect(chip.getBoundingClientRect().height).toBeGreaterThan(
      tab.getBoundingClientRect().height,
    );
    await expect(chip.getBoundingClientRect().width).toBeLessThanOrEqual(
      root.getBoundingClientRect().width,
    );
  },
};

/**
 * 375px, and the first thing to say is what this story does **not** prove.
 *
 * The gate's chromium is 1200×900 and the frame below is a wrapper, so
 * `sm:columns-2` and `lg:columns-3` both still match: the masonry renders
 * **three** columns of about 114px inside a 375px box, where a real phone
 * gets one. So the claim here is the stronger, stranger one — the desktop
 * three-column layout squeezed into a phone's width still does not scroll
 * sideways, on the frame or on the component's own root. The convention's
 * mechanical fact 2 is why the wrapper is used anyway, and why the frame
 * rather than the centring decorator is what gets measured.
 *
 * What is genuinely narrow-only and holds: the pill row wraps to fill the
 * width instead of overflowing, the `w-fit` sort tablist still fits at 164px,
 * and `media-prompt-bar`'s toolbar is `flex-wrap`, so the Attach / negative /
 * Create row stacks rather than pushing the bar wider than its column.
 *
 * A three-column masonry at 114px per column is the case the spec's own
 * layout argument breaks down in — tiles that narrow carry no surprise —
 * which is a reason for a host to force `layout="rows"` on small screens, and
 * the component has no breakpoint of its own to do it with.
 *
 * That is not a quirk of the harness. `sm:columns-2 lg:columns-3` are viewport
 * media queries, so the same three columns land in any 375px *container* on a
 * desktop page — a feed beside a sidebar, or in a modal. `CONTINUE.md` §8
 * records "grid columns keyed off the viewport rather than the container" for
 * J4 `artifact-grid` and C4 `recent-grid`; this is a third instance, and it is
 * not on that list.
 */
export const Mobile: Story = {
  render: (args) => (
    <div className="w-[375px] max-w-full" data-testid="viewport">
      <ExploreGallery {...args} />
    </div>
  ),
  args: {
    className: undefined,
    sorts: SORTS,
    types: TYPES,
    defaultType: "all",
    totalCount: 240,
    hasMore: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const frame = canvas.getByTestId("viewport");
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="explore-gallery"]')!;
    const slot = (name: string) => root.querySelector<HTMLElement>(`[data-slot="${name}"]`)!;

    // Measure the 375px frame, not the decorator — a `layout: "centered"`
    // meta makes `canvasElement.firstElementChild` the centring wrapper.
    await expect(frame.getBoundingClientRect().width).toBe(375);
    await expect(frame.scrollWidth).toBeLessThanOrEqual(frame.clientWidth);
    await expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth);

    // The breakpoint fact this story exists to state out loud.
    const list = slot("explore-gallery-masonry");
    await expect(getComputedStyle(list).columnCount).toBe("3");
    const tile = root.querySelector<HTMLElement>('[data-slot="explore-gallery-item"]')!;
    await expect(tile.getBoundingClientRect().width).toBeLessThan(120);

    // Nothing in the chrome is wider than the column it sits in.
    for (const name of ["explore-gallery-sorts", "explore-gallery-types", "explore-gallery-prompt"]) {
      await expect(slot(name).getBoundingClientRect().width).toBeLessThanOrEqual(375);
    }
  },
};

/**
 * Against C4 `recent-grid`, the near-twin this component's own pitfalls warn
 * about by name. Both are grids of thumbnail cards with a title, a hover
 * action strip and an open control, and from a screenshot they are the same
 * component.
 *
 * The rule is **whose work it is, and therefore whether the frame is fixed**:
 *
 * - **Explore gallery** is other people's finished work, browsed for
 *   surprise. Heights vary per item, so it owns its own tile and cannot
 *   compose A8 `preview-tile`; it carries a sort axis, a type axis and a
 *   docked prompt, because the point of the surface is to convert a browse
 *   into a generation without a navigation step.
 * - **Recent grid** is your own projects, returned to on purpose. It composes
 *   A8, so every card is one aspect ratio and the grid never reflows; it has
 *   no filter axes and a first-class empty tile, because a private list is
 *   usually short and often zero-length.
 *
 * So: unequal heights and a reason to prompt → J3. Equal frames and a reason
 * to resume → C4. Reaching for A8 inside J3 turns it into C4, which is the
 * second pitfall on this component's docs page.
 *
 * The third neighbour is J4 `artifact-grid`, which is not rendered here
 * because it is not a thumbnail surface at all: its excerpt *is* the content
 * and the card carries no media box, so nothing about it reads as this
 * component from a screenshot.
 *
 * One thing this pairing makes visible that neither component documents: two
 * explore galleries without `sorts` on one page are two `role="region"`
 * landmarks both named "Community feed", which is H5 `frame-strip`'s
 * `landmark-unique` shape. The gallery in this story carries `sorts`, so its
 * feed is a `tabpanel` and the question does not arise — that is the escape
 * hatch, and nothing in the component or its docs says a caller needs one.
 */
export const Boundary: Story = {
  render: () => (
    <div className="flex w-full flex-col gap-6">
      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">
          J3 explore gallery — other people&apos;s work, unequal heights, a prompt above the feed
        </p>
        <div className="h-[22rem]">
          <ExploreGallery
            className="h-full"
            items={ITEMS.slice(0, 4)}
            sorts={SORTS}
            defaultSort="hot"
            totalCount={240}
          />
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">
          C4 recent grid — your own projects, one fixed frame, no filter axes
        </p>
        <RecentGrid
          items={ITEMS.slice(0, 4).map((item) => ({
            id: item.id,
            title: item.title,
            thumbnail: item.media,
            editedAgo: "Edited 19 hours ago",
          }))}
        />
      </section>
    </div>
  ),
};
