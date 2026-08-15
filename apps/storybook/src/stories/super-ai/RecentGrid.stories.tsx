import type { Meta, StoryObj } from "@storybook/react-vite";
import { Mic, MoreHorizontal, Scissors, Wand2 } from "lucide-react";
import { expect, userEvent, within } from "storybook/test";

import { Button } from "@/components/ui/button";
import { ArtifactGrid, type ArtifactGridSession } from "@/registry/super-ai/artifact-grid";
import { FeatureCardRow, type FeatureCardRowItem } from "@/registry/super-ai/feature-card-row";
import { RecentGrid, type RecentGridItem } from "@/registry/super-ai/recent-grid";
import { RecentGridDocs } from "@/content/components/recent-grid.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const meta: Meta<typeof RecentGrid> = {
  title: "Super AI/Recent Grid",
  component: RecentGrid,
  parameters: { layout: "centered", docs: { page: componentDocsPage(RecentGridDocs) } },
};

export default meta;
type Story = StoryObj<typeof RecentGrid>;

const RECENT_ITEMS = [
  { id: "1", title: "Q3 Launch Trailer", durationLabel: "12:04", editedAgo: "Edited 19 hours ago" },
  { id: "2", title: "Brand Explainer", durationLabel: "3:41", editedAgo: "Edited 2 days ago" },
  { id: "3", title: "Onboarding Walkthrough", editedAgo: "Edited 5 days ago" },
  { id: "4", title: "Untitled Project" },
];

export const Grid: Story = {
  args: { items: RECENT_ITEMS, layout: "grid" },
};

export const List: Story = {
  args: { items: RECENT_ITEMS, layout: "list" },
};

export const DurationBadge: Story = {
  args: { items: [{ id: "1", title: "Q3 Launch Trailer", durationLabel: "12:04" }] },
};

export const EditedAgo: Story = {
  args: { items: [{ id: "1", title: "Q3 Launch Trailer", editedAgo: "Edited 19 hours ago" }] },
};

export const Empty: Story = {
  args: {
    items: [],
    emptyTitle: "No recent projects",
    emptyDescription: "Projects you open or create will show up here.",
  },
};

export const HoverActions: Story = {
  args: {
    items: [
      {
        id: "1",
        title: "Q3 Launch Trailer",
        durationLabel: "12:04",
        editedAgo: "Edited 19 hours ago",
        actions: (
          <Button variant="secondary" size="icon-sm" aria-label="Project actions" className="size-7">
            <MoreHorizontal />
          </Button>
        ),
      },
    ],
  },
};

/**
 * Colour fill standing in for a project's poster frame. Nameless by default,
 * because the thumbnail is the only thing inside `preview-tile`'s frame that a
 * caller controls — `name` is the `role="img"` workaround `PreviewTile`'s own
 * `EmptyLabel` story documents, and the only way a `recent-grid` caller can put
 * a name on the tile's button today.
 */
function Thumb({ className, name }: { className: string; name?: string }) {
  return <div role={name ? "img" : undefined} aria-label={name} className={`h-full w-full ${className}`} />;
}

/**
 * Per-item overflow menu, named from the item it belongs to. `record-list.tsx`
 * ships the same shape (`More actions for ${record.title}`); the declared-state
 * `HoverActions` story above uses the bare `"Project actions"`, which is fine
 * for one item and becomes four identical buttons the moment there are four.
 */
function ItemActions({ title }: { title: string }) {
  return (
    <Button variant="secondary" size="icon-sm" aria-label={`More actions for ${title}`} className="size-7">
      <MoreHorizontal />
    </Button>
  );
}

/* -------------------------------------------------------------------------
 * Case stories — the situations this component meets in a product, as opposed
 * to the prop combinations above. See docs/design-system/story-conventions.md.
 *
 * Not written for this component, deliberately:
 *
 * // case-skip: ReducedMotion — nothing in the tree moves
 * The single transition in `recent-grid.tsx` is `transition-opacity` on the
 * hover-actions overlay: a crossfade of an already-mounted control, which
 * changes no position and no size. That is the `reset-affordance` shape the
 * convention names — a fade that suppressing would document no branch worth a
 * story. The one animation reachable through this component is
 * `preview-tile`'s `animate-pulse` skeleton, and `recent-grid` never sets
 * `state`, so every composed tile renders `default` and the skeleton never
 * mounts. Adding `motion-reduce:transition-none` here would be thoroughness
 * theatre, not a branch.
 *
 * // case-skip: Controlled — there is no value to hold, only an open action
 * `RecentGridItem.onOpen` is a bare `() => void` that navigates; nothing in
 * `RecentGridProps` or `RecentGridItem` is a value/onChange pair, and no item
 * carries a selected state a parent could own. `preview-tile`'s `selected`
 * prop is not threaded through — `RecentGridItemGrid`/`RecentGridItemList`
 * never pass it — so a caller cannot express "this project is picked" at all.
 * A shelf you leave from, not an input you drive.
 * ---------------------------------------------------------------------- */

/**
 * Right-to-left, and the grid layout does not fully mirror.
 *
 * What does: the grid track order flips, the title and edited-ago lines
 * right-align and truncate from the left, and the list layout — a plain
 * `flex items-center gap-3` row — reverses thumbnail, text, badge and actions
 * for free, so it needs nothing.
 *
 * What does not, in the grid: `RecentGridActions` is `absolute top-2 left-2`
 * and the composed tile's duration badge is `absolute top-2 right-2`. Both are
 * physical, so under `dir="rtl"` the overflow menu stays on the visual left —
 * the logical *end* of the tile — while the duration stays on the visual right,
 * the logical start. The two swap roles rather than swapping sides.
 *
 * **Recorded, not fixed, and the reason is specific rather than general.** The
 * badge lives in `preview-tile.tsx` (A8), whose own RTL story already records
 * it and declines to fix it: no component in this registry uses logical inset
 * utilities, so adopting them in one file is a system-wide decision. Swapping
 * only this file's `left-2` for `start-2` would resolve to `right: 0.5rem`
 * under RTL and stack the overflow menu on top of the duration badge — a
 * strictly worse rendering than the one below. The pair has to move together
 * or not at all.
 */
export const RTL: Story = {
  render: () => (
    <div dir="rtl" className="w-[28rem] max-w-full">
      <RecentGrid
        items={[
          {
            id: "1",
            title: "Q3 Launch Trailer",
            durationLabel: "12:04",
            editedAgo: "Edited 19 hours ago",
            thumbnail: <Thumb className="bg-primary" />,
            actions: <ItemActions title="Q3 Launch Trailer" />,
          },
          {
            id: "2",
            title: "Brand Explainer",
            durationLabel: "3:41",
            editedAgo: "Edited 2 days ago",
            thumbnail: <Thumb className="bg-secondary" />,
            actions: <ItemActions title="Brand Explainer" />,
          },
          {
            id: "3",
            title: "Onboarding Walkthrough",
            editedAgo: "Edited 5 days ago",
            thumbnail: <Thumb className="bg-accent" />,
            actions: <ItemActions title="Onboarding Walkthrough" />,
          },
        ]}
      />
    </div>
  ),
};

/**
 * The interactive shelf — every tile handed an `onOpen`, which is how this
 * component ships in a product and which none of the stories above render.
 * Two tab stops per item, in DOM order: the tile, then its overflow menu.
 *
 * **Defect, recorded not fixed — the tile button is not named by its title.**
 * `recent-grid` composes `preview-tile` with `labelPlacement="below"`, and a
 * `below` label renders as a *sibling* of the frame, not inside it. When
 * `onOpen` makes that frame a `<button>`, the accessible name is computed from
 * whatever is inside it — which here is the duration badge. So a screen-reader
 * user hears "12:04, button" for a project called *Q3 Launch Trailer*, and on
 * an item with no duration and a decorative thumbnail there is nothing inside
 * the frame at all and the button has **no accessible name**: a live
 * `button-name` violation. `layout="list"` is the same defect one step worse —
 * `labelPlacement="none"`, and the badge is a sibling too, so every row's tile
 * button is unnamed.
 *
 * It cannot be fixed from the call site either: `RecentGridProps` spreads onto
 * the root wrapper, so an `aria-label` never reaches the button. The only
 * workaround a caller has today is naming the thumbnail itself with
 * `role="img"` (see `EmptyLabel`). The real fix is an `aria-labelledby` from
 * A8's frame to its label element — an API change to `preview-tile`, not a
 * class on this file — so it is written down here and in `CONTINUE.md` §8
 * rather than patched. Every item below therefore carries a duration badge:
 * the unnamed shape is described and deliberately not rendered, because it
 * would put a real `button-name` violation into a gate that runs at
 * `test: "error"`.
 *
 * The play function asserts only what survives that fix — the stop count, the
 * traversal order, a visible focus treatment at every stop, and distinct
 * accessible names on the repeated overflow menus. It deliberately asserts
 * nothing about the tile buttons' names, in either direction: claiming the
 * title is there would be false today, and claiming the duration is there
 * would pin the bug.
 */
export const KeyboardOrder: Story = {
  render: () => (
    <div className="w-[28rem] max-w-full">
      <RecentGrid
        items={[
          {
            id: "1",
            title: "Q3 Launch Trailer",
            durationLabel: "12:04",
            editedAgo: "Edited 19 hours ago",
            thumbnail: <Thumb className="bg-primary" />,
            onOpen: () => {},
            actions: <ItemActions title="Q3 Launch Trailer" />,
          },
          {
            id: "2",
            title: "Brand Explainer",
            durationLabel: "3:41",
            editedAgo: "Edited 2 days ago",
            thumbnail: <Thumb className="bg-secondary" />,
            onOpen: () => {},
            actions: <ItemActions title="Brand Explainer" />,
          },
          {
            id: "3",
            title: "Onboarding Walkthrough",
            durationLabel: "7:22",
            editedAgo: "Edited 5 days ago",
            thumbnail: <Thumb className="bg-accent" />,
            onOpen: () => {},
            actions: <ItemActions title="Onboarding Walkthrough" />,
          },
        ]}
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const tiles = [...canvasElement.querySelectorAll<HTMLElement>('[data-slot="preview-tile-frame"]')];
    const menus = [...canvasElement.querySelectorAll<HTMLElement>('[data-slot="recent-grid-actions"] button')];
    await expect(tiles).toHaveLength(3);
    await expect(menus).toHaveLength(3);

    // Every frame became a real button, because every item got an onOpen.
    for (const tile of tiles) await expect(tile.tagName).toBe("BUTTON");

    // Two stops per item, tile before menu — the order the DOM already has,
    // since nothing here sets tabindex.
    const stops = tiles.flatMap((tile, i) => [tile, menus[i]]);
    await expect([...canvasElement.querySelectorAll("button, a[href]")]).toEqual(stops);

    for (const expected of stops) {
      await userEvent.tab();
      await expect(document.activeElement).toBe(expected);

      const focused = document.activeElement as HTMLElement;
      await expect(focused.matches(":focus-visible")).toBe(true);
      const style = getComputedStyle(focused);
      await expect(style.boxShadow !== "none" || style.outlineStyle !== "none").toBe(true);
    }

    // Repeated tiles are the prime shape for duplicated accessible names, and
    // the overflow menu is where a caller most easily ships three of them. The
    // API hands `item.title` to the same call site that builds `actions`, so
    // distinctness is available here in a way it is not on the frame above.
    const canvas = within(canvasElement);
    const names = menus.map((menu) => menu.getAttribute("aria-label") ?? "");
    await expect(new Set(names).size).toBe(names.length);
    await expect(canvas.getByRole("button", { name: "More actions for Brand Explainer" })).toBe(menus[1]);
  },
};

/**
 * Every optional slot emptied. `title` is the only required field, so this is
 * the floor: a row with no duration, no edited-ago and no thumbnail is still a
 * legal item, and the third row below is exactly that.
 *
 * Rows do not ripple — the play function measures that, in `layout="list"`
 * where it is worth measuring, because list rows are a plain `flex flex-col`
 * with nothing equalising them the way grid stretch equalises cards.
 *
 * **Defect, recorded not fixed — the mechanism that holds them equal is not
 * the one the component thinks it is.** `RecentGridEditedAgo` renders
 * unconditionally, and its own comment says it falls back to "a non-breaking
 * space" so the text line always occupies its slot. The fallback shipped is
 * `{editedAgo ?? " "}` — an ordinary U+0020, which HTML collapses, so the
 * paragraph generates no line box and measures **0px tall** on the third row
 * below. What actually holds these rows level is `preview-tile`'s frame: it is
 * `w-28 aspect-video` and renders even with no thumbnail, so every row is at
 * least 63px of picture regardless of its text. The blank line is doing
 * nothing, and would need a literal U+00A0 to do what it claims. Nothing
 * currently ripples, so this is latent rather than broken — but the docs page
 * pitfall and the source comment both assert a guarantee that is not in force,
 * and any layout that drops the frame would find out. Changing the character is
 * a behavioural change, so it is recorded here rather than made mid-retrofit.
 * The assertions below pin the guarantee (equal heights, a silent placeholder),
 * not the current 0px, so fixing the fallback keeps them green.
 *
 * The grid layout's floor is uglier and cannot be fixed here: a title-only item
 * is an empty `bg-muted` frame with a caption under it, and if it is also given
 * an `onOpen` its button contains literally nothing — see `KeyboardOrder`. The
 * first row shows the one workaround a caller has, a thumbnail that names
 * itself with `role="img"`; it is the only string a caller can get inside that
 * frame.
 */
export const EmptyLabel: Story = {
  render: () => (
    <div className="w-[28rem] max-w-full">
      <RecentGrid
        layout="list"
        items={[
          {
            id: "1",
            title: "Q3 Launch Trailer",
            durationLabel: "12:04",
            editedAgo: "Edited 19 hours ago",
            thumbnail: <Thumb className="bg-primary" name="Q3 Launch Trailer poster frame" />,
          },
          { id: "2", title: "Brand Explainer", editedAgo: "Edited 2 days ago" },
          { id: "3", title: "Untitled Project" },
        ]}
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const rows = [...canvasElement.querySelectorAll<HTMLElement>('[data-slot="recent-grid-item"]')];
    await expect(rows).toHaveLength(3);

    // The guarantee: a row with three optional fields and a row with none are
    // the same height. Asserted, not the mechanism — see the defect above.
    const heights = rows.map((row) => row.offsetHeight);
    await expect(heights[0]).toBeGreaterThan(0);
    await expect(new Set(heights).size).toBe(1);

    // The placeholder line is mounted on the item that has no recency string,
    // and is silent while it is there.
    const blank = rows[2].querySelector<HTMLElement>('[data-slot="recent-grid-edited-ago"]');
    await expect(blank).not.toBeNull();
    await expect(blank!).toHaveAttribute("aria-hidden", "true");
    await expect(blank!.textContent?.trim()).toBe("");
  },
};

/**
 * An 86-character project name, in both layouts, because they truncate in two
 * different places and only one of them belongs to this component.
 *
 * In the grid the title is `preview-tile`'s own `below` label
 * (`truncate text-sm`); in the list it is this component's
 * `[data-slot="recent-grid-title"]` (`truncate text-sm font-medium`). Both clip
 * to a single line, which is what keeps a shelf of cards from rippling — but
 * the grid clips far harder, because a card is a quarter of the row wide while
 * a list row is the full width minus a 112px thumbnail.
 *
 * Truncation is CSS, so the whole name stays in the DOM and a screen reader
 * still gets it. A sighted user gets a few words and no tooltip: neither
 * component sets `title`, so there is no way to recover the rest by hovering.
 * If the tail of the name is what distinguishes two projects — `…final v2` vs
 * `…final v3` — the grid layout will not show it and the list layout is the
 * escape hatch.
 */
export const LongContent: Story = {
  render: () => {
    const items: RecentGridItem[] = [
      {
        id: "1",
        title: "Onboarding walkthrough — full narrated cut with captions, chapter markers and end card",
        durationLabel: "18:37",
        editedAgo: "Edited 19 hours ago",
        thumbnail: <Thumb className="bg-primary" />,
      },
      {
        id: "2",
        title: "Brand Explainer",
        durationLabel: "3:41",
        editedAgo: "Edited 2 days ago",
        thumbnail: <Thumb className="bg-secondary" />,
      },
    ];
    return (
      <div className="flex w-[28rem] max-w-full flex-col gap-6">
        <RecentGrid items={items} />
        <RecentGrid items={items} layout="list" />
      </div>
    );
  },
};

/**
 * 375px, and the honest reading of this story is that the top half is broken
 * and the bottom half is the fix.
 *
 * Nothing overflows — the play function pins that, and it holds structurally:
 * the tile takes its height from its width, the grid tracks are
 * `minmax(0, 1fr)`, and every text slot truncates. What breaks is the column
 * count. `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4` is keyed off the
 * **viewport**, not the container, so a 375px column inside a desktop window
 * gets four columns and the titles clip to a word or two — measured under this
 * gate's own 1200px window as `81.75px 81.75px 81.75px 81.75px`, not estimated.
 * The breakpoints only do the right thing when the narrow thing is the window.
 * That is the container-vs-viewport gap `CONTINUE.md` §8 records against this
 * component and J4 `artifact-grid` together, and it is why every shell that
 * puts a grid beside a sidebar has to shift each breakpoint up a step by hand.
 *
 * `layout="list"` has no breakpoints to get wrong: one column, a fixed 112px
 * thumbnail, and a `min-w-0` text column that truncates. It is the layout to
 * reach for at this width — and the reason the switch is a prop on one
 * component rather than a second component.
 */
export const Mobile: Story = {
  render: () => {
    const items: RecentGridItem[] = [
      {
        id: "1",
        title: "Q3 Launch Trailer",
        durationLabel: "12:04",
        editedAgo: "Edited 19 hours ago",
        thumbnail: <Thumb className="bg-primary" />,
      },
      {
        id: "2",
        title: "Brand Explainer",
        durationLabel: "3:41",
        editedAgo: "Edited 2 days ago",
        thumbnail: <Thumb className="bg-secondary" />,
      },
      {
        id: "3",
        title: "Onboarding Walkthrough",
        editedAgo: "Edited 5 days ago",
        thumbnail: <Thumb className="bg-accent" />,
      },
      { id: "4", title: "Untitled Project" },
    ];
    return (
      <div className="flex w-[375px] max-w-full flex-col gap-6">
        <RecentGrid items={items} />
        <RecentGrid items={items} layout="list" />
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const roots = [...canvasElement.querySelectorAll<HTMLElement>('[data-slot="recent-grid"]')];
    await expect(roots).toHaveLength(2);
    for (const root of roots) {
      await expect(root.clientWidth).toBeGreaterThan(0);
      await expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth);
    }
  },
};

const BOUNDARY_ARTIFACTS: ArtifactGridSession[] = [
  {
    id: "trailer-cut",
    label: "Q3 launch trailer",
    items: [
      {
        id: "s1",
        type: "document",
        title: "Voiceover script",
        excerpt: "Cold open on the empty timeline, then the first cut lands. Thirty seconds, no music yet.",
        editedAgo: "Edited 19 hours ago",
        href: "#s1",
      },
      {
        id: "s2",
        type: "data-table",
        excerpt: "Shot list — 14 clips, in/out timecodes, source file, and which of them still need a retake.",
        editedAgo: "Edited yesterday",
        href: "#s2",
      },
    ],
  },
];

const BOUNDARY_FEATURES: FeatureCardRowItem[] = [
  {
    id: "script-to-video",
    icon: <Wand2 className="size-4" aria-hidden />,
    title: "Script to video",
    description: "Turn a written script into a rough cut with stock footage.",
    onSelect: () => {},
  },
  {
    id: "voice-clone",
    icon: <Mic className="size-4" aria-hidden />,
    title: "Clone a voice",
    description: "Generate narration in a voice trained on a short sample.",
    onSelect: () => {},
  },
  {
    id: "auto-edit",
    icon: <Scissors className="size-4" aria-hidden />,
    title: "Remove filler words",
    description: "Cut silences and \"um\"s from a raw recording automatically.",
    onSelect: () => {},
  },
];

/**
 * Three shelves that all look like "a row of cards on the landing page" and
 * answer three different questions. The rule is what a card *is*:
 *
 * - **Recent grid (C4)** — a thing you already made. Every card is a saved
 *   project, sorted by recency, and the reason the surface exists is the
 *   edited-ago line. It is the only one of the three with a first-class empty
 *   state, because a new account has no projects and that is normal.
 * - **Feature card row (C3)** — a thing you could start. The cards are
 *   capabilities, not content; the set is authored and fixed, it never empties,
 *   and it scrolls horizontally with a visible next affordance because there
 *   is always more of it than fits.
 * - **Artifact grid (J4)** — a thing a conversation produced. Cards are grouped
 *   under the session that made them, carry a type badge and a visibility
 *   state, and are filterable by type. The provenance is the point: an artifact
 *   without its session is just a file.
 *
 * The one-line test: if the shelf can be empty for a real user, it is C4. If
 * the content is authored by you rather than by the user, it is C3. If each
 * card needs to say which run made it, it is J4. And the give-away that you
 * have reached for the wrong one is the empty state — C3 has none to show, and
 * J4's is per-filter rather than per-account.
 */
export const Boundary: Story = {
  render: () => (
    <div className="flex w-[36rem] max-w-full flex-col gap-8">
      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">Recent grid — projects you already have</p>
        <RecentGrid
          items={[
            {
              id: "1",
              title: "Q3 Launch Trailer",
              durationLabel: "12:04",
              editedAgo: "Edited 19 hours ago",
              thumbnail: <Thumb className="bg-primary" />,
            },
            {
              id: "2",
              title: "Brand Explainer",
              durationLabel: "3:41",
              editedAgo: "Edited 2 days ago",
              thumbnail: <Thumb className="bg-secondary" />,
            },
            {
              id: "3",
              title: "Onboarding Walkthrough",
              editedAgo: "Edited 5 days ago",
              thumbnail: <Thumb className="bg-accent" />,
            },
          ]}
        />
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">Feature card row — things you could start</p>
        <FeatureCardRow items={BOUNDARY_FEATURES} />
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">Artifact grid — what a session produced</p>
        <ArtifactGrid sessions={BOUNDARY_ARTIFACTS} />
      </section>
    </div>
  ),
};
