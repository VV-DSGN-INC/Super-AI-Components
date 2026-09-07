import type { Meta, StoryObj } from "@storybook/react-vite";
import { useMemo, useState } from "react";
import { expect, userEvent, within } from "storybook/test";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ToolPanelDocs } from "@/content/components/tool-panel.docs";
import { componentDocsPage } from "@/lib/component-docs-page";
import { UnitInput } from "@/registry/super-ai/field-row";
import { PresetGrid } from "@/registry/super-ai/preset-grid";
import { PropertyInspector, PropertyRow } from "@/registry/super-ai/property-inspector";
import { ToolPanel, type ToolPanelProps, type ToolPanelSection } from "@/registry/super-ai/tool-panel";

// Thumbnail stand-in. preview-tile's frame is bg-muted (pre-Wave-1.5
// legacy — see a11y-baseline.md), so tile content is text-foreground, never
// text-muted-foreground, which measures 4.34:1 on that fill.
function Swatch({ label }: { label: string }) {
  return (
    // aria-hidden: a thumbnail is decoration. Without this the tile's
    // accessible name computes as "Dashed line Dashed line" — the swatch text
    // plus A8's overlay label — and every exact-name query misses.
    <span
      aria-hidden
      className="text-foreground flex h-full w-full items-center justify-center p-1 text-center text-[0.6rem]"
    >
      {label}
    </span>
  );
}

function withThumbnails(items: { id: string; label: string; state?: "loading" }[]) {
  return items.map((item) => ({ ...item, thumbnail: <Swatch label={item.label} />, onSelect: () => {} }));
}

const SHAPES = withThumbnails([
  { id: "circle", label: "Circle" },
  { id: "square", label: "Square" },
  { id: "triangle", label: "Triangle" },
  { id: "star", label: "Star" },
  { id: "arrow", label: "Arrow" },
  { id: "blob", label: "Blob" },
]);

const LINES = withThumbnails([
  { id: "solid", label: "Solid line" },
  { id: "dashed", label: "Dashed line" },
  { id: "curved", label: "Curved line" },
]);

const CURATED: ToolPanelSection[] = [
  {
    id: "recent",
    title: "Recently used",
    count: 3,
    action: (
      <a href="#recent" className="underline underline-offset-2">
        View all
      </a>
    ),
    items: SHAPES.slice(0, 3),
  },
  { id: "shapes", title: "Shapes", count: SHAPES.length, collapsible: true, items: SHAPES },
  { id: "lines", title: "Lines", count: LINES.length, collapsible: true, defaultOpen: false, items: LINES },
];

const PROMPT = (
  <form className="flex items-center gap-2" onSubmit={(event) => event.preventDefault()}>
    <Input aria-label="Describe an element to generate" placeholder="Describe an element…" />
    <Button type="submit" size="sm">
      Generate
    </Button>
  </form>
);

function PanelFrame(args: ToolPanelProps) {
  return (
    <div className="h-[30rem] w-72">
      <ToolPanel {...args} />
    </div>
  );
}

// The search field reports the query; the host filters. This wrapper is what
// a real consumer writes, and what the Search story exercises.
function SearchablePanel(args: ToolPanelProps) {
  const [query, setQuery] = useState("");

  const sections = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return args.sections;
    return args.sections
      .map((section) => ({
        ...section,
        items: section.items?.filter((i) => i.label.toLowerCase().includes(q)),
      }))
      .filter((section) => (section.items?.length ?? 0) > 0)
      .map((section) => ({ ...section, count: section.items?.length }));
  }, [args.sections, query]);

  return <PanelFrame {...args} sections={sections} searchValue={query} onSearchChange={setQuery} />;
}

const meta: Meta<typeof ToolPanel> = {
  title: "Super AI/Tool Panel",
  component: ToolPanel,
  parameters: { layout: "centered", docs: { page: componentDocsPage(ToolPanelDocs) } },
  render: (args) => <PanelFrame {...args} />,
};

export default meta;
type Story = StoryObj<typeof ToolPanel>;

/**
 * Search is wired, not implemented. The panel renders the field, reports the
 * query and stops — `SearchablePanel` above is the filtering a consumer has to
 * write, and it is in the story because leaving it out would make the field
 * look broken while the user types. Two things to notice: the reduced sections
 * come back in through `sections`, so a `render`-callback section the panel
 * cannot read is never the panel's to filter; and nothing here is a live
 * region, so the narrowing result set and the `empty` node both arrive in
 * silence.
 */
export const Search: Story = {
  args: {
    label: "Elements",
    sections: CURATED,
    searchable: true,
    searchLabel: "Search elements",
    searchPlaceholder: "Search elements",
    empty: <p className="text-foreground text-sm">Nothing matches that search.</p>,
  },
  render: (args) => <SearchablePanel {...args} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const search = canvas.getByRole("searchbox", { name: "Search elements" });

    await userEvent.type(search, "line");
    // The panel reports the query and the host narrows the sections.
    await expect(canvas.queryByText("Recently used")).not.toBeInTheDocument();
    await expect(canvas.getByText("Lines")).toBeInTheDocument();

    await userEvent.clear(search);
    await userEvent.type(search, "zzz");
    await expect(canvas.getByText("Nothing matches that search.")).toBeInTheDocument();
  },
};

/**
 * The panel with neither search nor tabs: a stack of A12 headings over A8
 * grids, which is the arrangement every product in the evidence list ships.
 * The load-bearing detail is that a collapsed section is *unmounted* rather
 * than hidden — its tiles are absent from the accessibility tree and from the
 * tab order until it opens, and the count in the heading is the only evidence
 * a closed section holds anything at all.
 */
export const CuratedSections: Story = {
  args: { label: "Elements", sections: CURATED },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Each heading is A12; "View all" is a link because it navigates.
    await expect(canvas.getByRole("link", { name: "View all" })).toBeInTheDocument();
    await expect(canvas.getByText("Recently used")).toBeInTheDocument();

    // A collapsed section renders none of its content.
    await expect(canvas.queryByRole("button", { name: "Dashed line" })).not.toBeInTheDocument();
    await userEvent.click(canvas.getByRole("button", { name: /Lines/ }));
    await expect(canvas.getByRole("button", { name: "Dashed line" })).toBeInTheDocument();
  },
};

/**
 * The state the component is named for. Everything above the dock is an asset
 * browser; the prompt is what makes the panel somewhere you *make* things. It
 * is asserted structurally rather than visually — the dock is not a descendant
 * of the scrolling body — because that is the claim that survives any scroll
 * position, any panel height and any number of sections.
 */
export const DockedPrompt: Story = {
  args: { label: "Elements", sections: CURATED, prompt: PROMPT },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const dock = canvasElement.querySelector('[data-slot="tool-panel-prompt"]')!;
    const body = canvasElement.querySelector('[data-slot="tool-panel-sections"]')!;

    await expect(
      canvas.getByRole("textbox", { name: "Describe an element to generate" }),
    ).toBeInTheDocument();
    // Pinned: a sibling of the scrolling body, so it cannot scroll away.
    await expect(body.contains(dock)).toBe(false);
  },
};

/**
 * Tabs carry genuinely different content types, not a second level of grouping
 * — sections already group. Base UI unmounts the inactive panel, so an
 * unopened tab's sections do not exist: a screen-reader search for a tool in
 * the other tab finds nothing, which is the price of the lazy contract that
 * makes an infinite library affordable. The uploads tab also carries a tile
 * still waiting on its thumbnail, which says "loading" in its accessible name
 * rather than by shimmer alone, and is not pickable while it waits.
 */
export const Tabs: Story = {
  args: {
    label: "Library",
    searchable: true,
    searchLabel: "Search library",
    tabsLabel: "Library categories",
    tabs: [
      { value: "elements", label: "Elements" },
      { value: "uploads", label: "Uploads" },
    ],
    sections: [
      { id: "shapes", title: "Shapes", tab: "elements", count: SHAPES.length, items: SHAPES },
      {
        id: "uploads",
        title: "Your uploads",
        tab: "uploads",
        count: 2,
        items: withThumbnails([
          { id: "logo", label: "logo.svg" },
          { id: "art", label: "cover-art.png", state: "loading" },
        ]),
      },
    ],
    prompt: PROMPT,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByRole("tab", { name: "Elements" })).toHaveAttribute("aria-selected", "true");
    await expect(canvas.queryByText("Your uploads")).not.toBeInTheDocument();

    await userEvent.click(canvas.getByRole("tab", { name: "Uploads" }));
    await expect(canvas.getByText("Your uploads")).toBeInTheDocument();
    // A tile still waiting on its thumbnail says so in text, not by shimmer
    // alone — and is not pickable.
    await expect(canvas.queryByRole("button", { name: /cover-art/ })).not.toBeInTheDocument();
    await expect(canvas.getByText(/loading/)).toBeInTheDocument();
  },
};

/* -------------------------------------------------------------------------
 * Case stories — the situations this panel meets in an editor, as opposed to
 * the prop combinations above. See docs/design-system/story-conventions.md.
 *
 * All eight are true here, so there is nothing to skip. The panel is almost
 * entirely composition, and that is exactly why these matter: every fact
 * below is about what A12 and A8 do *inside this frame*, which neither of
 * their own story files can say.
 * ---------------------------------------------------------------------- */

const LONG_TITLE =
  "Shapes, arrows and connectors from the starter library, sorted by how often you reach for them";
const LONG_LABEL = "Rounded rectangle, two-point corner radius, dashed one-pixel outline stroke, no shadow";

/**
 * Right-to-left. Three things in this frame are directional, and they are why
 * the search glyph and its gutter moved to `start-2.5` / `ps-8`: the glyph has
 * to sit at the inline start with the field's padding on the same side, or the
 * icon lands on top of the placeholder; the tile grid has to flow from the
 * right; and A12's action has to stay at the inline end, which it does because
 * `justify-between` is direction-aware for free.
 *
 * **Recorded, not fixed.** A8's badge is pinned `absolute top-2 right-2`, so
 * the "New" chip on the first tile holds the visual right in RTL while the
 * overlay label beneath it mirrors correctly. That physical class lives in
 * `preview-tile.tsx`, another component's file, so it is a gap rather than a
 * fix here — the swap to `end-2` is the same compile-identical shape as the
 * two this component took, and belongs with A8.
 */
export const RTL: Story = {
  args: {
    label: "Elements",
    sections: [
      {
        id: "shapes",
        title: "Shapes",
        count: SHAPES.length,
        action: (
          <a href="#shapes" className="underline underline-offset-2">
            View all
          </a>
        ),
        items: [{ ...SHAPES[0], badge: <span className="text-[0.6rem]">New</span> }, ...SHAPES.slice(1, 4)],
      },
    ],
    searchable: true,
    searchLabel: "Search elements",
    searchPlaceholder: "Search elements",
    prompt: PROMPT,
  },
  render: (args) => (
    <div dir="rtl">
      <PanelFrame {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const search = canvas.getByRole("searchbox", { name: "Search elements" });
    const glyph = canvasElement.querySelector<HTMLElement>('[data-slot="tool-panel-search"] svg')!;

    // The pair, measured rather than asserted from the class names: the gutter
    // opens on the right in RTL and the glyph sits in it. This is the whole
    // point of the `start-2.5` / `ps-8` swap, and without it the icon would
    // paint over the placeholder.
    const style = getComputedStyle(search);
    await expect(parseFloat(style.paddingRight)).toBeGreaterThan(parseFloat(style.paddingLeft));

    const field = search.getBoundingClientRect();
    const icon = glyph.getBoundingClientRect();
    await expect(icon.right).toBeLessThanOrEqual(field.right);
    await expect(icon.left).toBeGreaterThan((field.left + field.right) / 2);

    // A12's action mirrors for free: `justify-between` puts it at the inline
    // end, which is the visual left here.
    const action = canvasElement.querySelector<HTMLElement>('[data-slot="section-header-action"]')!;
    const title = canvasElement.querySelector<HTMLElement>('[data-slot="section-header-title"]')!;
    await expect(action.getBoundingClientRect().left).toBeLessThan(title.getBoundingClientRect().left);
  },
};

/**
 * Reduced motion. The panel adds no animation of its own — the one keyframe
 * animation anywhere in the tree is A8's loading skeleton, which already
 * carries `motion-reduce:animate-none`. The story earns its place as a claim
 * about the *composition*: the panel renders a loading tile as a first-class
 * item state, so a reduced-motion user browsing a library whose thumbnails are
 * still arriving is a real situation, and nothing else checks that the branch
 * survives being composed.
 *
 * The assertion reads `animationName` back rather than trusting the class,
 * which is the `shortcuts-sheet` precedent, and it sweeps the whole panel — so
 * a future addition that animates without a branch fails here.
 *
 * The vendored `TabsTrigger` transitions on activation and is deliberately
 * left alone: it crossfades a text colour and fades the underline's opacity in
 * place. Nothing changes position, which is the qualifier the convention puts
 * on the `motion-reduce:transition-none` idiom.
 */
export const ReducedMotion: Story = {
  args: {
    label: "Uploads",
    sections: [
      {
        id: "uploads",
        title: "Your uploads",
        count: 3,
        items: withThumbnails([
          { id: "logo", label: "logo.svg" },
          { id: "art", label: "cover-art.png", state: "loading" },
          { id: "banner", label: "banner-2x.png", state: "loading" },
        ]),
      },
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const skeletons = canvasElement.querySelectorAll<HTMLElement>('[data-slot="preview-tile-loading"]');
    await expect(skeletons).toHaveLength(2);

    // The class is `animate-pulse motion-reduce:animate-none`; under the
    // emulated reduce this project always sets, the second has to win.
    for (const skeleton of skeletons) {
      await expect(getComputedStyle(skeleton).animationName).toBe("none");
    }

    // …and nothing else in the panel animates at all.
    const panel = canvasElement.querySelector<HTMLElement>('[data-slot="tool-panel"]')!;
    const moving = [...panel.querySelectorAll<HTMLElement>("*")].filter(
      (el) => getComputedStyle(el).animationName !== "none",
    );
    await expect(moving).toHaveLength(0);

    // The tiles that are still loading say so, so the suppressed shimmer takes
    // no information with it.
    await expect(canvas.getAllByText(/loading/)).toHaveLength(2);
  },
};

/**
 * Tab traversal through a panel carrying every optional region at once. The
 * stop count is a function of the data, so the sequence is what is worth
 * pinning rather than the number:
 *
 * 1. the search field; 2. **one** stop for the whole tab list — Base UI's
 * roving tabindex, so the inactive trigger is `tabindex="-1"` and arrows move
 * between them; 3. the scrolling body itself, which takes `tabIndex={0}`
 * because it is the element that scrolls and a keyboard otherwise cannot reach
 * a panel whose tiles all fit above the fold; 4. **the active tab panel**, see
 * below; 5. one stop per tile that has an `onSelect`; and last 6. the docked
 * prompt, a sibling of the scroll region and therefore always the final stop,
 * never scrolled out from under focus.
 *
 * Step 3 is deliberate and surprises people. Step 5 is the one with a cost: a
 * twelve-tile section is twelve stops with no way to skip past it, and the
 * count changes underneath the user as thumbnails arrive, because a loading
 * tile renders as an inert `<div>`.
 *
 * **Found here, recorded and not fixed — step 4.** Base UI's `Tabs.Panel`
 * takes a tabindex of its own, so a tabbed panel has *two* keyless stops in
 * front of its sections rather than one, and the second shows nothing: the
 * vendored `ui/tabs.tsx` styles `TabsContent` `outline-none` with no
 * `focus-visible` ring replacing it, which is the unpaired-`outline-none`
 * shape the token gate exists to catch and does not see in a vendored file.
 * The result is a stop a keyboard user lands on with no indication they have.
 * Neither the fix nor its location is mechanical — a ring on the panel, or no
 * tabindex at all given the scrolling body already carries one — so it is a
 * gap, and the assertion below is written so that fixing it does not break
 * this story. The docs module's keyboard list does not mention this stop
 * either, and should.
 */
export const KeyboardOrder: Story = {
  args: {
    label: "Elements",
    searchable: true,
    searchLabel: "Search elements",
    tabsLabel: "Library categories",
    tabs: [
      { value: "elements", label: "Elements" },
      { value: "uploads", label: "Uploads" },
    ],
    sections: [{ id: "shapes", title: "Shapes", tab: "elements", count: 2, items: SHAPES.slice(0, 2) }],
    prompt: PROMPT,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const panel = canvasElement.querySelector<HTMLElement>('[data-slot="tool-panel"]')!;

    // One stop for the list, not one per trigger. That is what roving
    // tabindex means, and it is the only reason a ten-category panel stays
    // navigable.
    const triggers = canvas.getAllByRole("tab");
    await expect(triggers.filter((t) => t.getAttribute("tabindex") !== "-1")).toHaveLength(1);

    canvas.getByRole("searchbox", { name: "Search elements" }).focus();

    const stops: string[] = [];
    const unringed: string[] = [];
    for (let i = 0; i < 12; i++) {
      const focused = document.activeElement as HTMLElement;
      if (!panel.contains(focused)) break;
      const slot = focused.getAttribute("data-slot") ?? focused.tagName.toLowerCase();
      stops.push(slot);

      const style = getComputedStyle(focused);
      const seen =
        focused.matches(":focus-visible") && (style.boxShadow !== "none" || style.outlineStyle !== "none");
      if (!seen) unringed.push(slot);

      await userEvent.tab();
    }

    // The whole lap, in order. `tool-panel-tab-panel` is the one nobody
    // predicts — see the note above.
    await expect(stops).toEqual([
      "input",
      "tabs-trigger",
      "tool-panel-sections",
      "tool-panel-tab-panel",
      "tool-panel-item",
      "tool-panel-item",
      "input",
      "button",
    ]);

    // Every stop shows that it has focus; a ring nobody can see is the same as
    // having no focus order at all. `tool-panel-tab-panel` is filtered out
    // rather than asserted either way: it currently has no ring, that is the
    // recorded gap above, and pinning it green — in either direction — is the
    // one move the convention forbids. Every other stop must show one.
    await expect(unringed.filter((slot) => slot !== "tool-panel-tab-panel")).toEqual([]);

    // Arrows move inside the list rather than leaving it — the other half of
    // the roving-tabindex contract.
    triggers[0].focus();
    await userEvent.keyboard("{ArrowRight}");
    await expect(document.activeElement).toBe(triggers[1]);
    await userEvent.keyboard("{ArrowLeft}");
    await expect(document.activeElement).toBe(triggers[0]);
  },
};

// A host that hears every request and applies none. Both controlled pairs are
// pinned, and the request log is real state — so each rejected interaction
// still re-renders the panel with an unchanged value, which is the third thing
// a controlled component has to survive.
function PinnedPanel(args: ToolPanelProps) {
  const [requests, setRequests] = useState<string[]>([]);

  return (
    <div className="flex flex-col gap-2">
      <PanelFrame
        {...args}
        activeTab="elements"
        searchValue="line"
        onTabChange={(value) => setRequests((prev) => [...prev, `tab:${value}`])}
        onSearchChange={(value) => setRequests((prev) => [...prev, `search:${value}`])}
      />
      <p data-testid="requests" className="text-foreground text-xs">
        {requests.join(" · ") || "no requests yet"}
      </p>
    </div>
  );
}

/**
 * Both controlled pairs at once, pinned. `searchValue`/`onSearchChange` and
 * `activeTab`/`onTabChange` are independent, and each behaves the way a
 * controlled input has to: the interaction does not move the rendered value,
 * and the callback carries the whole next value rather than a delta, so a host
 * can apply it without reconstructing what the user did.
 *
 * The third clause is the one that catches real bugs, and it is why the host
 * here logs every request into state: each rejected click and keystroke
 * re-renders the panel with `activeTab` and `searchValue` unchanged, and the
 * panel must not drift. It does not — `currentTab` reads `activeTab ??
 * internalTab` and the internal setter is skipped entirely whenever
 * `activeTab` is supplied, so there is no second copy of the value to fall out
 * of step with the host's.
 */
export const Controlled: Story = {
  args: {
    label: "Library",
    searchable: true,
    searchLabel: "Search library",
    tabsLabel: "Library categories",
    tabs: [
      { value: "elements", label: "Elements" },
      { value: "uploads", label: "Uploads" },
    ],
    sections: [
      { id: "lines", title: "Lines", tab: "elements", count: LINES.length, items: LINES },
      {
        id: "uploads",
        title: "Your uploads",
        tab: "uploads",
        count: 1,
        items: withThumbnails([{ id: "logo", label: "logo.svg" }]),
      },
    ],
  },
  render: (args) => <PinnedPanel {...args} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole("tab", { name: "Uploads" }));
    // Held: the host refused, so the panel stays where the host put it.
    await expect(canvas.getByRole("tab", { name: "Elements" })).toHaveAttribute("aria-selected", "true");
    await expect(canvas.queryByText("Your uploads")).not.toBeInTheDocument();
    // …and reported, with the value a host would apply.
    await expect(canvas.getByTestId("requests")).toHaveTextContent("tab:uploads");

    const search = canvas.getByRole("searchbox", { name: "Search library" });
    await expect(search).toHaveValue("line");
    await userEvent.type(search, "s");
    await expect(search).toHaveValue("line");
    // The whole next value, not the keystroke.
    await expect(canvas.getByTestId("requests")).toHaveTextContent("search:lines");

    // Two re-renders later — the log is state — nothing has drifted.
    await expect(canvas.getByRole("tab", { name: "Elements" })).toHaveAttribute("aria-selected", "true");
  },
};

/**
 * Every optional text slot omitted: no `label`, no `searchLabel`, no section
 * `count`, no `action`. What remains is what the panel names itself, and the
 * finding is that the scrolling body falls back to the literal string
 * `"Tools"` — a generic name a screen-reader user meets as the name of the
 * region they are standing in. An editor with an elements panel and an effects
 * panel mounted at once announces both as "Tools"; pass `label` per panel.
 *
 * A section's name shrinks with it. `aria-labelledby` points at the whole
 * header row, so a section with a count and a "View all" is named "Shapes 24
 * View all" while this one is named exactly "Shapes" — a reason to keep the
 * action short, since it lands inside the group's name either way.
 *
 * The icon-only tap target this story usually catches cannot be built here:
 * `ToolPanelItem.label` and `ToolPanelTab.label` are both required, and A8
 * renders the tile's label as the overlay that names its button. Passing `""`
 * with an icon would typecheck and ship a nameless control, but that is a
 * caller error, and rendering it would put an axe `button-name` violation into
 * a gate that runs at `test: "error"`. It belongs in the docs page's donts.
 */
export const EmptyLabel: Story = {
  args: {
    searchable: true,
    sections: [
      { id: "shapes", title: "Shapes", items: SHAPES.slice(0, 3) },
      { id: "lines", title: "Lines", items: LINES },
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // The defaults, not names the caller chose.
    await expect(canvas.getByRole("group", { name: "Tools" })).toBeInTheDocument();
    await expect(canvas.getByRole("searchbox", { name: "Search tools" })).toBeInTheDocument();

    // Exact-name matching: with no count and no action, the group's name is
    // the bare title.
    await expect(canvas.getByRole("group", { name: "Shapes" })).toBeInTheDocument();
    await expect(canvas.getByRole("group", { name: "Lines" })).toBeInTheDocument();

    // Stripping the optional text takes nothing from the tiles, because a
    // tile's label is not optional.
    await expect(canvas.getByRole("button", { name: "Circle" })).toBeInTheDocument();
  },
};

/**
 * A 94-character section title over an 86-character tile label, in a 288px
 * panel. Both truncate, and they lose different things.
 *
 * A12's title span is `truncate` inside a `min-w-0` flex child while the
 * action is `shrink-0`, so the title is what gives way and "View all" survives
 * at full width — the right trade, since the action is the only way out of a
 * section whose name you cannot read. A8's overlay label truncates too, and
 * that one is unrecoverable: no tooltip, no `title` attribute, no wrap, so a
 * long element name is simply gone at every width the panel is ever given.
 *
 * The consolation, asserted below, is that the truncation is visual only. The
 * section's accessible name comes from `aria-labelledby` pointing at the whole
 * header row, so a screen reader still gets the entire title while the eye
 * gets an ellipsis.
 */
export const LongContent: Story = {
  args: {
    label: "Elements",
    sections: [
      {
        id: "shapes",
        title: LONG_TITLE,
        count: 2,
        action: (
          <a href="#shapes" className="underline underline-offset-2">
            View all
          </a>
        ),
        items: [
          { ...SHAPES[0], id: "rounded", label: LONG_LABEL, thumbnail: <Swatch label="Rounded rectangle" /> },
          SHAPES[1],
        ],
      },
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const title = canvasElement.querySelector<HTMLElement>('[data-slot="section-header-title"]')!;
    await expect(title.scrollWidth).toBeGreaterThan(title.clientWidth);

    // The action keeps its full width while the title gives way.
    const action = canvasElement.querySelector<HTMLElement>('[data-slot="section-header-action"]')!;
    await expect(action.scrollWidth).toBe(action.clientWidth);

    // Clipped on screen, whole in the accessibility tree.
    await expect(canvas.getByRole("group", { name: new RegExp(LONG_TITLE) })).toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: LONG_LABEL })).toBeInTheDocument();
  },
};

/**
 * 375px, with every region the panel has: search, tabs, a three-column grid
 * and the docked prompt. The grid is what decides this width. Three A8 tiles
 * across 375px measure 111px each, and after the overlay label's `px-2` that
 * leaves about 95px of text at `text-xs` — one short word. "Triangle" fits;
 * "Speech bubble with tail", which is what an element in a real library is
 * actually called, clips, and A8's overlay has no tooltip to recover it. Both
 * are asserted, so the threshold is a measurement rather than an impression.
 * `columns` is a panel-level prop precisely so a host can drop to two here.
 *
 * Two overflow risks are measured rather than eyeballed. The prompt is a flex
 * row whose `Input` carries `min-w-0`, so it shrinks instead of pushing the
 * button out. And the scrolling body sets only `overflow-y`, which leaves
 * `overflow-x` computing to `auto` — a section that overflowed sideways would
 * scroll here rather than clip, and silently.
 */
export const Mobile: Story = {
  args: {
    label: "Elements",
    searchable: true,
    searchLabel: "Search elements",
    tabsLabel: "Library categories",
    tabs: [
      { value: "elements", label: "Elements" },
      { value: "uploads", label: "Uploads" },
    ],
    sections: [
      {
        id: "shapes",
        title: "Shapes",
        tab: "elements",
        count: SHAPES.length + 1,
        items: [...SHAPES, ...withThumbnails([{ id: "callout", label: "Speech bubble with tail" }])],
      },
    ],
    prompt: PROMPT,
  },
  render: (args) => (
    <div className="w-[375px] max-w-full">
      <div className="h-[30rem]">
        <ToolPanel {...args} />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const panel = canvasElement.querySelector<HTMLElement>('[data-slot="tool-panel"]')!;
    const body = canvasElement.querySelector<HTMLElement>('[data-slot="tool-panel-sections"]')!;
    const dock = canvasElement.querySelector<HTMLElement>('[data-slot="tool-panel-prompt"]')!;
    const wrapper = panel.parentElement!.parentElement!;

    await expect(wrapper.clientWidth).toBe(375);
    await expect(wrapper.scrollWidth).toBeLessThanOrEqual(wrapper.clientWidth);
    await expect(panel.scrollWidth).toBeLessThanOrEqual(panel.clientWidth);
    await expect(body.scrollWidth).toBeLessThanOrEqual(body.clientWidth);
    await expect(dock.scrollWidth).toBeLessThanOrEqual(dock.clientWidth);

    // The measurement the description turns on, and the reason `columns` is a
    // prop: three tiles across 375px, and the one label longer than a single
    // short word is the one that clips.
    const cell = canvasElement.querySelector<HTMLElement>('[data-slot="preview-tile-frame"]')!;
    await expect(cell.clientWidth).toBe(111);

    const labels = [...canvasElement.querySelectorAll<HTMLElement>('[data-slot="preview-tile-label"]')];
    const clipped = labels.filter((el) => el.scrollWidth > el.clientWidth).map((el) => el.textContent);
    await expect(clipped).toEqual(["Speech bubble with tail"]);
  },
};

/**
 * The three surfaces in the catalog that put a grid of pickable tiles in a
 * column beside a canvas. They are confusable by sight and are told apart by
 * what a click leaves behind:
 *
 * - **Tool panel (I1)** — a click *inserts*. It acts and leaves nothing
 *   selected: the tiles are plain buttons, `onSelect` is per item, and
 *   `selected` is passed only for the rare tile that is genuinely a toggle.
 *   The docked prompt is the giveaway — this panel makes things.
 * - **Preset grid (E4)** — a click *sets a parameter that stays*. It is a
 *   `radiogroup` (or a checkbox group with `multiple`), one tile holds the
 *   selection, and the value round-trips through `value`/`onValueChange`. If
 *   exactly one tile must stay lit, it is not a tool panel.
 * - **Property inspector (I2)** — the other panel beside the canvas. It offers
 *   no library at all; its content is driven by `elementType`, so it edits what
 *   is already selected and has an empty state for when nothing is.
 *
 * The rule in one line: inserting is I1, choosing is E4, editing is I2. A tool
 * panel that starts remembering which tile you picked has become a preset
 * grid, and should be one.
 */
export const Boundary: Story = {
  render: () => (
    <div className="flex w-full max-w-4xl flex-wrap items-start gap-6">
      <section className="flex w-64 flex-col gap-2">
        <p className="text-foreground text-xs font-medium">Tool panel — a click inserts</p>
        <div className="h-72">
          <ToolPanel
            label="Elements"
            sections={[{ id: "shapes", title: "Shapes", count: SHAPES.length, items: SHAPES }]}
            prompt={PROMPT}
          />
        </div>
      </section>

      <section className="flex w-64 flex-col gap-2">
        <p className="text-foreground text-xs font-medium">Preset grid — a click sets a value that stays</p>
        <PresetGrid
          aria-label="Style presets"
          content="style"
          defaultValue="cinematic"
          items={[
            { id: "cinematic", label: "Cinematic", thumbnail: <Swatch label="Cinematic" /> },
            { id: "flat", label: "Flat vector", thumbnail: <Swatch label="Flat vector" /> },
            { id: "isometric", label: "Isometric", thumbnail: <Swatch label="Isometric" /> },
          ]}
        />
      </section>

      <section className="flex w-64 flex-col gap-2">
        <p className="text-foreground text-xs font-medium">Property inspector — edits what is selected</p>
        <PropertyInspector
          elementType="shape"
          selectionLabel="Rounded rectangle"
          sections={{
            shape: [
              {
                id: "layout",
                label: "Layout",
                content: [
                  <PropertyRow key="Width" label="Width">
                    {(id) => <UnitInput id={id} unit="px" defaultValue={320} />}
                  </PropertyRow>,
                  <PropertyRow key="Height" label="Height">
                    {(id) => <UnitInput id={id} unit="px" defaultValue={180} />}
                  </PropertyRow>,
                ],
              },
            ],
          }}
        />
      </section>
    </div>
  ),
};
