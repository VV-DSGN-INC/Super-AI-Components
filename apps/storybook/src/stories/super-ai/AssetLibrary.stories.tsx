import type { Meta, StoryObj } from "@storybook/react-vite";
import { FolderPlus, Sparkles, Upload } from "lucide-react";
import * as React from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { Button } from "@/components/ui/button";
import { DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { AssetLibrary, type AssetLibraryItem } from "@/registry/super-ai/asset-library";
import { EmptyState } from "@/registry/super-ai/empty-state";
import { FilterChip } from "@/registry/super-ai/filter-bar";
import { GenerationGrid } from "@/registry/super-ai/generation-grid";
import { RecordList } from "@/registry/super-ai/record-list";
import { ResultCard } from "@/registry/super-ai/result-card";
import { AssetLibraryDocs } from "@/content/components/asset-library.docs";
import { componentDocsPage } from "@/lib/component-docs-page";
import { settledFocusRing } from "@/lib/focus-ring";

const FILES: AssetLibraryItem[] = [
  { id: "f1", name: "Brand kit.png", type: "Image", size: "2.4 MB", modified: "2 days ago" },
  { id: "f2", name: "Launch cut.mp4", type: "Video", size: "184 MB", modified: "Yesterday" },
  { id: "f3", name: "Hero scene.spline", type: "Scene", size: "9.1 MB", modified: "Last week" },
  { id: "f4", name: "Untitled export", type: "Image", modified: "Last week" },
];

const FOLDERS: AssetLibraryItem[] = [
  { id: "d1", name: "Campaign 2026", kind: "folder", itemCount: 24, modified: "Today" },
  { id: "d2", name: "Client handoff", kind: "folder", itemCount: 7, modified: "3 days ago" },
  { id: "d3", name: "Archive", kind: "folder", itemCount: 1, modified: "Last month" },
];

/** 83 characters — what an export dialog really produces, not filler. */
const LONG_NAME = "Campaign hero render — rooftop garden at golden hour, 4k, final colour pass v7.png";

const headerActions = (
  <span className="flex items-center gap-2">
    <Button size="sm" variant="outline">
      <FolderPlus aria-hidden />
      New folder
    </Button>
    <Button size="sm">
      <Upload aria-hidden />
      Upload
    </Button>
  </span>
);

const filters = (
  <>
    <FilterChip active>Images</FilterChip>
    <FilterChip>Video</FilterChip>
    <FilterChip>Scenes</FilterChip>
  </>
);

const rowActions = (item: AssetLibraryItem) => (
  <>
    <DropdownMenuItem>Rename</DropdownMenuItem>
    <DropdownMenuItem>Move to folder</DropdownMenuItem>
    {item.kind === "folder" ? null : <DropdownMenuItem>Download</DropdownMenuItem>}
    <DropdownMenuSeparator />
    <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
  </>
);

const meta: Meta<typeof AssetLibrary> = {
  title: "Super AI/Asset Library",
  component: AssetLibrary,
  parameters: { layout: "centered", docs: { page: componentDocsPage(AssetLibraryDocs) } },
  args: {
    title: "Assets",
    headerActions,
    filters,
    rowActions,
    onOpen: () => {},
  },
  decorators: [
    (Story) => (
      <div className="w-[52rem] max-w-full">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof AssetLibrary>;

/** Files only. Each row states its own type, size and modified date. */
export const File: Story = {
  args: { items: FILES },
};

/** Folders only — same table, same columns, item count where a size would be. */
export const Folder: Story = {
  args: { items: FOLDERS },
};

/** The state that proves the rule: one table, folders hoisted above files. */
export const Mixed: Story = {
  args: { items: [...FILES, ...FOLDERS] },
};

/**
 * L1 `empty-state` replaces the table — never the header, search or chips,
 * because whatever emptied the list has to stay reachable.
 */
export const Empty: Story = {
  args: {
    items: [],
    empty: (
      <EmptyState
        size="panel"
        title="No assets match those filters"
        description="Clear the search or a chip above to see the rest of the library."
        action={
          <Button size="sm" variant="outline">
            Clear filters
          </Button>
        }
      />
    ),
  },
};

/** Checkboxes replace the overflow menus, and the bulk bar reports the count. */
export const SelectionMode: Story = {
  args: {
    items: [...FILES, ...FOLDERS],
    selectionMode: true,
    selectedIds: ["d1", "f2"],
    onSelectionChange: () => {},
    bulkActions: (
      <>
        <Button size="sm" variant="outline">
          Move
        </Button>
        <Button size="sm" variant="outline">
          Download
        </Button>
        <Button size="sm" variant="outline">
          Delete
        </Button>
      </>
    ),
  },
};

/* -------------------------------------------------------------------------
 * Case stories — the situations a saved-work surface meets in a product, as
 * opposed to the prop combinations above. See
 * docs/design-system/story-conventions.md.
 *
 * All eight are true here, so there are no `case-skip` lines. That follows
 * from the shape: a table whose column order is directional, a row menu on a
 * Base UI popup that animates, four kinds of tab stop, three controlled
 * pairs, five optional text slots, an author-supplied file name in every row,
 * and two near-twins in the catalog.
 *
 * The component composes A12, A5, A8 and L1 and delegates almost everything
 * else to vendored primitives, so several of these stories are really about
 * `ui/table.tsx` and `ui/toggle-group.tsx` seen through J1. Where that is the
 * case the description says whose the defect is, because the fix is not this
 * file's to make.
 * ---------------------------------------------------------------------- */

/**
 * Right-to-left, in list view with the overflow menus live, so every
 * directional thing this component owns is on screen at once.
 *
 * **What mirrors, and what this story pins.** The table's column order
 * mirrors for free — Name paints at 480..832 and the actions column at 0..44
 * in an 832px canvas — because that is what a `<table>` does under `dir`.
 * Everything else in the chrome mirrors because the four physical classes
 * this file used to carry were swapped for their logical forms in this wave:
 * `text-left` → `text-start` on the item name, `left-2.5` → `start-2.5` on
 * the search glyph with `pl-8` → `ps-8` on the field it sits in,
 * `ml-auto` → `ms-auto` on the view switch, and `text-right` → `text-end` on
 * the actions cell. Each compiles to the identical declaration in LTR
 * (CONTINUE.md §8's sweep), and the glyph and its gutter had to move together
 * — swapping one alone would have put the icon on top of the text. The play
 * function reads the computed values back rather than trusting the classes,
 * so a future edit reaching for `pl-` again fails here.
 *
 * **What does not mirror is the view switch's own joinery, and it belongs to
 * `components/ui/toggle-group.tsx`.** The F wave measured this on F5
 * `compare-viewer`; J1 is the only other call site, because the physical
 * joins are gated on `data-spacing=0` and the registry's four other toggle
 * groups keep the default gap. Measured here under `dir="rtl"`: List (first
 * in the DOM, painting on the right at 33..67) carries its 10px radii on its
 * *left* corners and Grid (last, painting at 0..33) carries its own on the
 * *right* — both on the inner seam instead of the group's outer edge — while
 * Grid, now the outermost item, has `border-left-width: 0` and the seam at
 * x=33 stacks 1px against 1px. One logical-utility fix in the primitive
 * repairs both consumers; it is vendored, so it is recorded here, not swept.
 *
 * **And a fourth vendored primitive that does not mirror, found here.**
 * `components/ui/table.tsx` gives every `<th>` a physical `text-left`, while
 * the cells below it inherit `start`. Measured under `dir="rtl"` in the Name
 * column, which spans 480..832: the heading paints at 488..526 and the file
 * name it labels at 695..824 — **the column title and its own data on
 * opposite edges, 207px apart, in every column of every table in the
 * registry.** After `switch.tsx`, `button-group.tsx` and `toggle-group.tsx`,
 * this is the fourth instance of the same one-word fix in a vendored file.
 * Recorded, not asserted: pinning `text-align: left` would lock it in.
 */
export const RTL: Story = {
  args: { items: [...FILES, ...FOLDERS] },
  render: (args) => (
    <div dir="rtl">
      <AssetLibrary {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="asset-library"]')!;
    const left = (el: Element) => Math.round(el.getBoundingClientRect().left);

    // The table mirrors: Name is the rightmost column, actions the leftmost.
    const firstRow = root.querySelector<HTMLElement>('[data-slot="asset-library-row"]')!;
    const cells = Array.from(firstRow.querySelectorAll<HTMLElement>("td"));
    await expect(cells).toHaveLength(5);
    await expect(left(cells[0])).toBeGreaterThan(left(cells[cells.length - 1]));

    // The four swapped classes, read back as logical keywords rather than as
    // class names — this is what stops a `pl-`/`text-left` edit regressing.
    const name = firstRow.querySelector<HTMLElement>('[data-slot="asset-library-name"]')!;
    await expect(getComputedStyle(name).textAlign).toBe("start");
    await expect(getComputedStyle(cells[cells.length - 1]).textAlign).toBe("end");

    const search = root.querySelector<HTMLElement>('[data-slot="asset-library-search"]')!;
    const glyph = search.querySelector<SVGElement>("svg")!;
    const input = search.querySelector<HTMLInputElement>("input")!;
    // Glyph on the inline-start edge, which under RTL is the right one…
    await expect(left(glyph)).toBeGreaterThan(left(input) + input.getBoundingClientRect().width / 2);
    // …and the gutter that clears it moved with it.
    await expect(getComputedStyle(input).paddingInlineStart).toBe("32px");

    // `ms-auto` pushes the view switch to the inline-end of the filter bar,
    // which is the left under RTL — past the chips, not before them.
    const bar = root.querySelector<HTMLElement>('[data-slot="filter-bar"]')!;
    const group = bar.querySelector<HTMLElement>('[data-slot="asset-library-view-toggle"]')!;
    const chip = bar.querySelector<HTMLElement>('[data-slot="filter-chip"]')!;
    await expect(left(group)).toBeLessThan(left(chip));
  },
};

/**
 * `prefers-reduced-motion`, which every test in this project already runs
 * under (`vitest.config.ts` sets Playwright's `reducedMotion: "reduce"`).
 *
 * One thing in this component animates: the row's overflow menu, a Base UI
 * popup that zooms and slides in through `data-open:animate-in`. It shipped
 * without the restated pair — one of the three `DropdownMenuContent`s left in
 * the registry in that position, alongside `record-list` and
 * `selection-toolbar`, which belong to their own items — and this wave added
 * `motion-reduce:data-open:animate-none motion-reduce:data-closed:animate-none`
 * to it. The bare `motion-reduce:animate-none` would not have worked:
 * Tailwind v4 compiles both halves to one specificity and emits the plain
 * block first, so the `data-*` variant wins the source-order tie and the
 * popup animates anyway (story-conventions.md, mechanical fact 3). Measured
 * on the frame the popup is still opening: `animationName` reads `"none"`
 * where it read `"enter"` before the fix.
 *
 * **Three things move that this story deliberately does not suppress.** The
 * overflow trigger fades in on hover and focus (`transition-opacity`) — a
 * fade is a colour change, not motion, so it needs no branch, on the same
 * reading that left `reset-affordance`'s crossfade alone. The vendored
 * `TableRow` carries `transition-colors` for its hover tint, likewise. And
 * the vendored `Button` and `Toggle` both carry `transition-all` with an
 * `active:` translate, so every header action and both view buttons still
 * nudge a pixel when pressed under reduce — the primitive-wide posture
 * `CONTINUE.md` §8 records, not this component's to fix.
 */
export const ReducedMotion: Story = {
  args: { items: FILES.slice(0, 2) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Actions for Brand kit.png" }));
    const menu = await within(document.body).findByRole("menu");

    // Still opening — the attribute the animation is keyed off is on the
    // element, so this is the frame a bare `motion-reduce:animate-none`
    // fails to reach.
    await expect(menu).toHaveAttribute("data-open");
    await expect(`open animation=${getComputedStyle(menu).animationName}`).toBe("open animation=none");

    // The dismissal runs on every use of this menu and leaves nothing behind
    // to measure, so the closing half is asserted only as "it went away".
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(within(document.body).queryByRole("menu")).toBeNull());
  },
};

/**
 * The whole tab sequence of a library with header actions, filter chips and
 * four rows: **fifteen stops, and the arithmetic is worth writing down.**
 * Two header buttons, the search field, three A5 chips, then the view switch
 * as a *single* stop (a composite toggle group — Grid is `tabindex="-1"` and
 * arrow keys move between them), then two stops per row in DOM order, folders
 * first. The docs page says a row is "zero, one or two stops depending on
 * what you gave it"; this is that count with both given.
 *
 * Three claims beyond the order:
 *
 * 1. **Every stop paints a visible focus treatment**, checked with
 *    `settledFocusRing` rather than the older `boxShadow !== "none"` string —
 *    which cannot fail on this registry's controls, and would have been
 *    especially misleading here because the vendored `Toggle` fades its ring
 *    in through `transition-all`.
 * 2. **The overflow trigger is `opacity-0` until it is focused**, and the
 *    ring helper cannot see that: `isPainted` checks `visibility`, `display`,
 *    `clip-path` and size, not opacity, so a ring on a fully transparent
 *    button would pass. The story asserts the opacity separately — that is
 *    the actual claim behind "hidden by opacity, never by `display`, so it
 *    stays in the tab order".
 * 3. **Every per-row control has a distinct accessible name.** "Select
 *    {name}" and "Actions for {name}" both interpolate the item, so a
 *    fifty-row library offers fifty distinguishable names. This is the
 *    contract found broken four times elsewhere — `context-chips`,
 *    `property-inspector`, `result-card`, `stem-mixer` — and it holds here;
 *    the assertion is a `getByRole` per name, which throws on a duplicate.
 *
 * **Recorded, not asserted: focus is lost whenever the row's controls swap.**
 * Turning `selectionMode` on unmounts every overflow trigger and mounts
 * checkboxes; emptying the list replaces the table with L1 `empty-state`.
 * Whichever control had focus is gone and nothing restores it, so focus falls
 * to `<body>` and the next Tab restarts at the top of the page. The docs
 * module's focus notes carry both; pinning them would lock them in.
 */
export const KeyboardOrder: Story = {
  args: { items: [...FILES.slice(0, 2), ...FOLDERS.slice(0, 2)] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="asset-library"]')!;

    const stops = Array.from(
      root.querySelectorAll<HTMLElement>('button, a[href], input, [role="checkbox"]'),
    ).filter((el) => el.getAttribute("tabindex") !== "-1");
    const nameOf = (el: Element | null) =>
      el === null
        ? "nothing"
        : `stop#${stops.indexOf(el as HTMLElement)} ${el.getAttribute("data-slot") ?? el.tagName}`;

    // 2 header actions + search + 3 chips + 1 view switch + 4 rows × 2.
    await expect(stops).toHaveLength(15);
    // The view switch really is one stop, not two.
    await expect(root.querySelectorAll('[data-slot="asset-library-view-toggle"] button')).toHaveLength(2);

    // One lap, seeded from where focus actually lands, asserting each stop is
    // new — so the walk proves the sequence rather than counting hits inside
    // an allowance.
    await userEvent.tab();
    await waitFor(() => {
      if (!stops.includes(document.activeElement as HTMLElement)) {
        throw new Error(`focus never entered the library: ${nameOf(document.activeElement)}`);
      }
    });
    await expect(nameOf(document.activeElement)).toBe(nameOf(stops[0]));

    const seen = new Set<HTMLElement>();
    for (let i = 0; i < stops.length; i += 1) {
      if (i > 0) {
        const previous = document.activeElement as HTMLElement;
        await userEvent.tab();
        await waitFor(() => {
          if (document.activeElement === previous) throw new Error("focus has not moved yet");
        });
      }
      const focused = document.activeElement as HTMLElement;
      await expect(`${nameOf(focused)} repeat=${seen.has(focused)}`).toBe(`${nameOf(focused)} repeat=false`);
      await expect(nameOf(focused)).toBe(nameOf(stops[i]));
      await expect(`${nameOf(focused)} focusVisible=${focused.matches(":focus-visible")}`).toBe(
        `${nameOf(focused)} focusVisible=true`,
      );
      await settledFocusRing(focused, waitFor);

      // The one stop that is invisible until it is focused has to become
      // visible, which no ring check can tell you.
      if (focused.dataset.slot === "asset-library-row-actions") {
        await waitFor(() =>
          expect(`${nameOf(focused)} opacity=${getComputedStyle(focused).opacity}`).toBe(
            `${nameOf(focused)} opacity=1`,
          ),
        );
      }
      seen.add(focused);
    }
    await expect(seen.size).toBe(stops.length);

    // One more tab leaves the library. Nothing traps, nothing wraps.
    await userEvent.tab();
    await expect(root.contains(document.activeElement)).toBe(false);

    // Distinct names per row, both controls. `getByRole` throws on duplicates.
    for (const item of [...FOLDERS.slice(0, 2), ...FILES.slice(0, 2)]) {
      canvas.getByRole("button", { name: `Actions for ${item.name}` });
      canvas.getByRole("button", { name: item.name });
    }

    // Escape closes a row menu and hands focus back to the trigger it came
    // from — the docs page's last keyboard bullet, and the one piece of focus
    // management this surface does get right.
    const trigger = canvas.getByRole("button", { name: "Actions for Client handoff" });
    await userEvent.click(trigger);
    await within(document.body).findByRole("menu");
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(within(document.body).queryByRole("menu")).toBeNull());
    await waitFor(() => expect(document.activeElement).toBe(trigger));
  },
};

/**
 * Three controlled pairs, and they are not the same kind of controlled.
 *
 * **`selectedIds` / `onSelectionChange` is total.** The component derives a
 * `Set` from the prop on every render and `toggle` returns early without a
 * handler, so there is no internal copy to fall back on — a host that ignores
 * the callback gets checkboxes that never check, which is the docs page's
 * second "don't", proved here by holding the value back on purpose.
 *
 * **`search` and `view` are hybrid**, and that is the finding worth having.
 * Each keeps internal state that is used only while the prop is `undefined`,
 * and each guards its setter on the same condition — so while you control
 * them the internal copy is never written and cannot drift, and when you stop
 * controlling them the component falls back to whatever it last stored (for
 * `view`, `defaultView`, read once at mount). Nothing about the rendered
 * output tells the two modes apart, which is exactly why a host that fires
 * `onSearchChange` into a debounce and forgets to feed `search` back sees a
 * field that will not type.
 *
 * The play function drives all three from one host: interaction alone moves
 * none of them, each callback carries the whole next value rather than a
 * delta, a re-render with unchanged props holds everything fixed, and
 * applying the payloads moves the field, the switch, the checkbox and the
 * bulk bar's count together — the count is read from `selectedIds`, never
 * tracked separately.
 */
export const Controlled: Story = {
  render: () => <ControlledShell />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const field = () => canvas.getByRole("searchbox");
    const box = () => canvas.getAllByRole("checkbox")[1];

    // 1. Interaction alone moves nothing that is controlled.
    await userEvent.type(field(), "brand");
    await expect(field()).toHaveValue("");
    await userEvent.click(canvas.getByRole("button", { name: "Grid view" }));
    await expect(canvasElement.querySelector('[data-slot="asset-library-table"]')).not.toBeNull();
    await userEvent.click(box());
    await expect(box()).toHaveAttribute("aria-checked", "false");

    // 2. …but every callback fired. `view` and `selection` carry the whole
    //    next value; the search field cannot, and that is the sharp edge of a
    //    held-back controlled input — each keystroke reports `target.value`,
    //    which is the pinned "" plus one character, so five keystrokes report
    //    "b", "r", "a", "n", "d" and the host never sees the word.
    await expect(canvas.getByTestId("requested-search")).toHaveTextContent("d");
    await expect(canvas.getByTestId("requested-view")).toHaveTextContent("grid");
    await expect(canvas.getByTestId("requested-selection")).toHaveTextContent("d1");

    // 3. A re-render with unchanged props holds. Prove the re-render first.
    await expect(canvas.getByTestId("render-pass")).toHaveTextContent("1");
    await userEvent.click(canvas.getByRole("button", { name: "Re-render" }));
    await expect(canvas.getByTestId("render-pass")).toHaveTextContent("2");
    await expect(field()).toHaveValue("");
    await expect(box()).toHaveAttribute("aria-checked", "false");

    // 4. The payloads were sufficient to apply all three.
    await userEvent.click(canvas.getByRole("button", { name: "Apply" }));
    await waitFor(() => expect(field()).toHaveValue("d"));
    await expect(canvasElement.querySelector('[data-slot="asset-library-grid"]')).not.toBeNull();
    await waitFor(() => expect(canvas.getAllByRole("checkbox")[1]).toHaveAttribute("aria-checked", "true"));
    canvas.getByRole("toolbar", { name: "Bulk actions, 1 selected" });
  },
};

function ControlledShell() {
  const items = [...FILES.slice(0, 2), ...FOLDERS.slice(0, 1)];
  const [applied, setApplied] = React.useState({
    search: "",
    view: "list" as "list" | "grid",
    selection: [] as string[],
  });
  const [requested, setRequested] = React.useState(applied);
  const [pass, setPass] = React.useState(1);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-4">
        <dl className="text-foreground grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs">
          <dt>last onSearchChange</dt>
          <dd data-testid="requested-search">{requested.search || "—"}</dd>
          <dt>last onViewChange</dt>
          <dd data-testid="requested-view">{requested.view}</dd>
          <dt>last onSelectionChange</dt>
          <dd data-testid="requested-selection">
            {requested.selection.length === 0 ? "—" : requested.selection.join(",")}
          </dd>
          <dt>host render pass</dt>
          <dd data-testid="render-pass" className="tabular-nums">
            {pass}
          </dd>
        </dl>
        <Button size="sm" variant="outline" onClick={() => setPass((p) => p + 1)}>
          Re-render
        </Button>
        <Button size="sm" variant="outline" onClick={() => setApplied(requested)}>
          Apply
        </Button>
      </div>

      <AssetLibrary
        title="Assets"
        items={items}
        search={applied.search}
        onSearchChange={(search) => setRequested((r) => ({ ...r, search }))}
        view={applied.view}
        onViewChange={(view) => setRequested((r) => ({ ...r, view }))}
        selectionMode
        selectedIds={applied.selection}
        onSelectionChange={(selection) => setRequested((r) => ({ ...r, selection }))}
        bulkActions={
          <Button size="sm" variant="outline">
            Delete
          </Button>
        }
      />
    </div>
  );
}

/**
 * Every optional slot emptied — across three frames, because two of them
 * cannot coexist: selection mode suppresses the overflow trigger outright, so
 * a `rowActions` that returns nothing has to be shown while browsing.
 *
 * What renders correctly: a file with no `type` falls back to "File" and a
 * folder always reads "Folder", so the kind survives without the glyph; a
 * missing `size`, `itemCount` or `modified` renders an em-dash rather than a
 * zero or a blank, so unknown metadata reads as deliberate; `rowActions`
 * returning nothing for an item removes that row's trigger entirely, which is
 * how a read-only row costs no tab stop; and with no `empty` node the default
 * L1 `empty-state` appears, keeping the header, the search field and the
 * chips above it.
 *
 * `title=""` is the one that quietly loses information rather than failing:
 * A12 renders the empty title span and keeps the count beside it, so the
 * header becomes a bare number with nothing saying what is being counted.
 *
 * **Two collapses, measured and recorded rather than pinned.**
 *
 * 1. **An item with `name: ""` produces `aria-label="Select "`** — trimmed to
 *    "Select" by name computation, so two nameless items in one library are
 *    two identically-named checkboxes, and the overflow trigger beside it
 *    would be "Actions for". This is the empty-string class the D/I wave
 *    found on `context-chips` and `property-inspector`, reached through the
 *    interpolation rather than through a default. It renders here; the value
 *    is stated rather than asserted, because asserting it would lock it in.
 * 2. **`searchPlaceholder=""` deletes the search field's only accessible
 *    name, and is therefore not rendered here.** The `sr-only` `<label>`'s
 *    entire content is `searchPlaceholder` and the `Input` receives no
 *    `aria-label`, so an empty string leaves an empty label element and no
 *    other naming route — axe's `label` rule, a red gate. Same handling as
 *    H4's empty word token: documented, not rendered.
 *
 * **What cannot be emptied at all is the reason family O filed two gaps
 * against this component** (`CONTINUE.md` §8): there is no `viewSwitch={false}`
 * (O10) and no header-only mode (O7, which called it the biggest gap that
 * builder hit). Every frame here still draws the switch and the A12 header,
 * because a host that already owns that chrome has no way to ask for the table
 * alone. Both stay unbuilt — an API decision, not a story's to make.
 */
export const EmptyLabel: Story = {
  render: () => (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-2" data-testid="selecting">
        <p className="text-foreground text-xs font-medium">
          selection mode — an empty name reaches the checkbox
        </p>
        <AssetLibrary
          title=""
          selectionMode
          selectedIds={[]}
          onSelectionChange={() => {}}
          items={[
            { id: "bare", name: "", kind: "folder" },
            { id: "sparse", name: "Untitled export" },
          ]}
        />
      </section>

      <section className="flex flex-col gap-2" data-testid="browsing">
        <p className="text-foreground text-xs font-medium">browsing — one row is given no actions</p>
        <AssetLibrary
          title="Assets"
          rowActions={(item) => (item.id === "sparse" ? null : <DropdownMenuItem>Rename</DropdownMenuItem>)}
          items={[
            { id: "named", name: "Campaign 2026", kind: "folder" },
            { id: "sparse", name: "Untitled export" },
          ]}
        />
      </section>

      <section className="flex flex-col gap-2" data-testid="nothing">
        <p className="text-foreground text-xs font-medium">no empty node — L1&apos;s default</p>
        <AssetLibrary title="Assets" items={[]} />
      </section>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const selecting = canvas.getByTestId("selecting");
    const rows = Array.from(selecting.querySelectorAll<HTMLElement>('[data-slot="asset-library-row"]'));
    const text = (row: HTMLElement) => Array.from(row.querySelectorAll("td")).map((cell) => cell.textContent);

    // Folder first, then the file. Both fall back rather than blanking.
    await expect(text(rows[0])).toEqual(["", "", "Folder", "—", "—", ""]);
    await expect(text(rows[1])).toEqual(["", "Untitled export", "File", "—", "—", ""]);

    // An empty title leaves the count with nothing to count.
    await expect(selecting.querySelector('[data-slot="section-header-title"]')).toHaveTextContent("");
    await expect(selecting.querySelector('[data-slot="section-header-count"]')).toHaveTextContent("2");

    // `rowActions` returning nothing removes the trigger for that row only —
    // which is also why a read-only row costs no tab stop.
    const browsing = canvas.getByTestId("browsing");
    const browsingRows = Array.from(
      browsing.querySelectorAll<HTMLElement>('[data-slot="asset-library-row"]'),
    );
    await expect(browsingRows[0].querySelector('[data-slot="asset-library-row-actions"]')).not.toBeNull();
    await expect(browsingRows[1].querySelector('[data-slot="asset-library-row-actions"]')).toBeNull();

    // With no `empty` node, L1's default replaces the table and nothing else:
    // the header, the field and the view switch are all still above it.
    const nothing = canvas.getByTestId("nothing");
    within(nothing).getByText("Nothing here yet");
    await expect(nothing.querySelector('[data-slot="asset-library-table"]')).toBeNull();
    await expect(nothing.querySelector('[data-slot="asset-library-search"]')).not.toBeNull();
    await expect(nothing.querySelector('[data-slot="asset-library-view-toggle"]')).not.toBeNull();
  },
};

/**
 * An 83-character file name, the kind an export dialog really produces, and
 * **the truncation this component draws does not work when the name is
 * openable.** That is the finding. Isolating it took the same name in all
 * three variants, one per library at this canvas width:
 *
 * - `href` → an `<a>`: the name clips at the cell edge with an ellipsis,
 *   552px of text inside a 421px box (measured 8..453 in a cell ending at
 *   461).
 * - no `href`, no `onOpen` → a `<span>`: the same, 541 into 421.
 * - `onOpen` → a `<button>`: **no clipping at all.** The element measures
 *   8..584 in the same 461px cell — 123px of file name painted across the
 *   Type column — and `scrollWidth === clientWidth === 552`, so `truncate`
 *   never engages.
 *
 * The cause is that a `<button>`'s `width: auto` is shrink-to-fit even at
 * `display: flex`, so the `min-w-0` chain that constrains the link and the
 * span stops at it and the truncate box is sized by its own text. The `<td>`
 * cannot save it either: its `max-w-64` is advisory under `table-layout:
 * auto` and the column measured 455–461px against that 256px cap. A width
 * class on the interactive variants is the likely fix, but it is a layout
 * change rather than one of the three shapes §3.4 sanctions, so it is
 * recorded here and left. **Its worst instance is `Mobile`**, where the same
 * shrink-to-fit is what makes a 375px grid scroll sideways.
 *
 * Two smaller things this width also shows: the truncated name carries no
 * `title` attribute, so there is no hover route to the full string in any
 * variant (the same gap D3 `context-chips` records); and `ui/table.tsx` sets
 * `whitespace-nowrap` on every cell, so a long Type or Modified value widens
 * its column instead of wrapping — which at this width is absorbed, and at
 * 375px is what the scroll container is for.
 */
export const LongContent: Story = {
  args: {
    title:
      "Everything the overnight render farm produced for the campaign, newest first, including the failed passes",
    items: [
      {
        id: "long-open",
        name: LONG_NAME,
        type: "Image sequence rendered from the scene file",
        size: "2.4 MB",
        modified: "2 days ago",
      },
      { id: "long-link", name: LONG_NAME, href: "#asset", type: "Image", modified: "2 days ago" },
      ...FILES.slice(0, 2),
    ],
  },
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="asset-library"]')!;
    const rows = Array.from(root.querySelectorAll<HTMLElement>('[data-slot="asset-library-row"]'));
    const nameIn = (row: HTMLElement) => row.querySelector<HTMLElement>('[data-slot="asset-library-name"]')!;
    const inner = (row: HTMLElement) => nameIn(row).querySelector<HTMLElement>(".truncate")!;

    // The link variant is the one that behaves: clipped, and inside its cell.
    const link = rows[1];
    await expect(nameIn(link).tagName).toBe("A");
    await expect(inner(link).scrollWidth).toBeGreaterThan(inner(link).clientWidth);
    await expect(nameIn(link).getBoundingClientRect().right).toBeLessThanOrEqual(
      link.querySelector<HTMLElement>("td:nth-child(1)")!.getBoundingClientRect().right,
    );

    // No hover route to the full name in any variant.
    await expect(inner(link).getAttribute("title")).toBeNull();
    await expect(inner(rows[0]).getAttribute("title")).toBeNull();

    // A12's title truncates rather than pushing the count off the row.
    const title = root.querySelector<HTMLElement>('[data-slot="section-header-title"]')!;
    const count = root.querySelector<HTMLElement>('[data-slot="section-header-count"]')!;
    await expect(title.scrollWidth).toBeGreaterThan(title.clientWidth);
    await expect(count.getBoundingClientRect().left).toBeGreaterThan(title.getBoundingClientRect().left);

    // The vendored cell is `whitespace-nowrap`, so a long Type value widens
    // its column instead of wrapping — nothing is clipped, the table is.
    const type = rows[0].querySelector<HTMLElement>('[data-slot="asset-library-type"]')!;
    await expect(getComputedStyle(type).whiteSpace).toBe("nowrap");
    await expect(type.scrollWidth).toBe(type.clientWidth);
  },
};

/**
 * 375px, wrapper-constrained (`parameters.viewport` would render at desktop
 * width in the run that gates — story-conventions.md, mechanical fact 2).
 * Two frames, both asserted, and a third measurement in this description.
 *
 * **List at 375px.** The frame itself does not scroll: five columns of
 * `whitespace-nowrap` cells overflow by 24px (399 into 375) and
 * `ui/table.tsx`'s own `overflow-x-auto` container absorbs it. **That
 * container is a bare `div` with no `tabIndex`, no role and no name** — the
 * `scrollable-region-focusable` shape after L5 `shortcuts-sheet`, P1
 * `data-views` and F6 `render-queue`, and shared by every table in the
 * registry. It does not fail axe *here* only because the rows contain
 * focusables; a read-only library at this width — no `onOpen`, no
 * `rowActions` — is F6's failure exactly, which is why this frame keeps both.
 * Size and Modified stay unreachable from the keyboard either way. Vendored,
 * so recorded rather than fixed.
 *
 * **Grid at 375px.** The wrapper constrains width and not the breakpoint, so
 * the gate's 1200px chromium still matches `lg:` and the grid renders
 * **five** columns where a real phone gets two: 62px tiles, inside which A8's
 * square frame is 62px and the meta line is one truncated fragment. The
 * assertion is that it does not scroll sideways — which holds *because* this
 * frame's names are plain text.
 *
 * **The measurement that is not asserted:** hand the same grid an `onOpen`
 * and it scrolls. The name becomes a `<button>`, whose shrink-to-fit width
 * ignores the 26px flex slot it sits in (measured 313..420 for a 62px tile),
 * and the frame goes to 420 in 375 — 445 in 375 with selection mode's
 * checkbox alongside. `LongContent` has the mechanism; this is where it costs
 * a phone user horizontal page scroll, and pinning it here would lock it in.
 */
export const Mobile: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">list at 375px</p>
        <div className="w-[375px] max-w-full" data-testid="list-viewport">
          <AssetLibrary
            title="Assets"
            items={[...FILES, ...FOLDERS]}
            filters={filters}
            rowActions={rowActions}
            onOpen={() => {}}
          />
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">grid at 375px</p>
        <div className="w-[375px] max-w-full" data-testid="grid-viewport">
          <AssetLibrary title="Assets" view="grid" items={[...FILES, ...FOLDERS]} rowActions={rowActions} />
        </div>
      </section>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const listViewport = canvas.getByTestId("list-viewport");
    await expect(listViewport.scrollWidth).toBeLessThanOrEqual(listViewport.clientWidth);

    // The table's own container is what scrolls, and it is not reachable.
    const container = listViewport.querySelector<HTMLElement>('[data-slot="table-container"]')!;
    await expect(container.scrollWidth).toBeGreaterThan(container.clientWidth);
    await expect(container.getAttribute("tabindex")).toBeNull();
    // It clears the axe rule only through its rows' controls.
    await expect(container.querySelectorAll('button:not([tabindex="-1"]), a[href]').length).toBeGreaterThan(
      0,
    );

    const gridViewport = canvas.getByTestId("grid-viewport");
    await expect(gridViewport.scrollWidth).toBeLessThanOrEqual(gridViewport.clientWidth);

    // Five columns at 375px, because a wrapper is not a breakpoint.
    const grid = gridViewport.querySelector<HTMLElement>('[data-slot="asset-library-grid"]')!;
    await expect(getComputedStyle(grid).gridTemplateColumns.split(" ")).toHaveLength(5);
  },
};

/**
 * Three surfaces that are all "a list of things you made". The rule is
 * **what a row is**, and it decides all three:
 *
 * - **J1 `asset-library`** — a row is a *file or folder*. It is the only one
 *   of the three that puts both kinds in one table, and the only one whose
 *   rows have no primary control at all: the name opens it, everything else
 *   is behind the overflow menu, and selection mode replaces that menu with
 *   checkboxes and a bulk bar. Reach for it when people are browsing and
 *   organising, and when "delete these twelve" is a thing they will want.
 * - **J5 `record-list`** — a row is a *thing that runs*. The enable switch
 *   sits in the row because it is the point, the app-icon cluster says what
 *   the record touches, and last-run state lives in the subtitle. There is no
 *   selection model and no folders: you are not filing automations, you are
 *   turning them on. If the row has an on/off, it is J5.
 * - **F2 `generation-grid`** — the same selection model as J1, over cells you
 *   render yourself. The spec makes the relation explicit ("selection mode
 *   swaps hover for checkboxes and reveals a bulk bar, as F2 does"), so the
 *   choice between them is not about what selection means — it is grid versus
 *   table, which is whether the thumbnail or the metadata is what people
 *   scan. Results get the grid; a file manager gets the table.
 *
 * J1 also has the switch that makes the first two of those one component:
 * flip it to grid and it renders A8 tiles, which is close enough to F2 to be
 * worth saying that F2 still owns the cell and J1 does not.
 */
export const Boundary: Story = {
  render: () => (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">
          J1 asset library — files and folders in one table, actions behind the row menu
        </p>
        <AssetLibrary
          title="Assets"
          items={[...FILES.slice(0, 2), ...FOLDERS.slice(0, 1)]}
          rowActions={rowActions}
          onOpen={() => {}}
        />
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">
          J5 record list — a row is something that runs, and the switch is the point
        </p>
        <RecordList
          label="Scenarios"
          records={[
            {
              id: "r1",
              title: "Sync briefs to the render queue",
              lastRun: "Last run 4 min ago",
              runState: "success",
              enabled: true,
            },
            {
              id: "r2",
              title: "Archive exports older than 90 days",
              lastRun: "Last run failed",
              runState: "failed",
              enabled: false,
            },
          ]}
          onEnabledChange={() => {}}
        />
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">
          F2 generation grid — the same selection model, over cells you render
        </p>
        <GenerationGrid
          density="comfortable"
          items={[
            { id: "g1", prompt: "Rooftop garden, golden hour" },
            { id: "g2", prompt: "Neon alley, rain reflections" },
            { id: "g3", prompt: "Studio portrait, soft light" },
          ]}
          getItemId={(item) => item.id}
          renderItem={(item, ctx) => (
            <ResultCard
              state="done"
              aspect="square"
              label={item.prompt}
              selectable={ctx.selectMode}
              selected={ctx.selected}
              onSelect={ctx.toggleSelected}
            >
              <div className="bg-foreground/10 flex h-full w-full items-center justify-center">
                <Sparkles aria-hidden className="text-foreground/40 size-5" />
              </div>
            </ResultCard>
          )}
          selectMode
          selectedIds={["g1"]}
          onSelectionChange={() => {}}
          bulkActions={
            <Button size="sm" variant="outline">
              Delete
            </Button>
          }
        />
      </section>
    </div>
  ),
};
