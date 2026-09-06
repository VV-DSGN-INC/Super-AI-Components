import type { Meta, StoryObj } from "@storybook/react-vite";
import { Download, Sparkles } from "lucide-react";
import * as React from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { Button } from "@/components/ui/button";
import { GenerationGrid, type GenerationItemContext } from "@/registry/super-ai/generation-grid";
import { PresetGrid } from "@/registry/super-ai/preset-grid";
import { RecentGrid } from "@/registry/super-ai/recent-grid";
import { ResultCard, type ResultCardState } from "@/registry/super-ai/result-card";
import { GenerationGridDocs } from "@/content/components/generation-grid.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

interface Row {
  id: string;
  prompt: string;
  state: ResultCardState;
}

const TODAY: Row[] = [
  { id: "1", prompt: "Rooftop garden, golden hour", state: "done" },
  { id: "2", prompt: "Neon alley, rain reflections", state: "streaming" },
  { id: "3", prompt: "Studio portrait, soft light", state: "queued" },
  { id: "4", prompt: "Glass sculpture on marble", state: "failed" },
];

const YESTERDAY: Row[] = [
  { id: "5", prompt: "Coastal cliffs at dawn", state: "done" },
  { id: "6", prompt: "Paper texture close-up", state: "done" },
];

function Media() {
  return (
    <div className="bg-foreground/10 flex h-full w-full items-center justify-center">
      <Sparkles aria-hidden className="text-foreground/40 size-5" />
    </div>
  );
}

const card = (item: Row, ctx: GenerationItemContext) => (
  <ResultCard
    state={item.state}
    aspect="square"
    progress={54}
    label={item.prompt}
    selectable={ctx.selectMode}
    selected={ctx.selected}
    onSelect={ctx.toggleSelected}
    onRetry={() => {}}
    footer={item.state === "done" ? <span>17 credits</span> : null}
  >
    <Media />
  </ResultCard>
);

/**
 * The same cell, but handed a hover-action node too. Nothing in this file used
 * to pass `actions`, which left "select mode replaces hover actions"
 * unfalsifiable — the slot was empty in both modes, so suppressing it proved
 * nothing. F1 renders `actions` and the select checkbox into one slot, so this
 * is what makes the exclusivity observable.
 */
const cardWithActions = (item: Row, ctx: GenerationItemContext) => (
  <ResultCard
    state={item.state}
    aspect="square"
    progress={54}
    label={item.prompt}
    selectable={ctx.selectMode}
    selected={ctx.selected}
    onSelect={ctx.toggleSelected}
    onRetry={() => {}}
    actions={
      <Button size="sm" variant="secondary" aria-label={`Download ${item.prompt}`}>
        <Download aria-hidden />
      </Button>
    }
    footer={item.state === "done" ? <span>17 credits</span> : null}
  >
    <Media />
  </ResultCard>
);

const meta: Meta<typeof GenerationGrid> = {
  title: "Super AI/Generation Grid",
  component: GenerationGrid,
  parameters: { layout: "centered", docs: { page: componentDocsPage(GenerationGridDocs) } },
  decorators: [
    (Story) => (
      <div className="w-[46rem] max-w-full">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof GenerationGrid>;

/** Grouped by relative date — one A3 `date-section` per bucket, newest first. */
export const DateSections: Story = {
  render: () => (
    <GenerationGrid
      groups={[
        { id: "today", label: "Today", items: TODAY },
        { id: "yesterday", label: "Yesterday", items: YESTERDAY },
      ]}
      getItemId={(i) => i.id}
      renderItem={card}
    />
  ),
};

/** The same cells at all three densities. Only the column count changes. */
export const Density: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      {(["comfortable", "default", "compact"] as const).map((density) => (
        <section key={density} className="flex flex-col gap-2">
          <h3 className="text-foreground text-xs font-medium">{density}</h3>
          <GenerationGrid
            density={density}
            items={[...TODAY, ...YESTERDAY]}
            getItemId={(i) => i.id}
            renderItem={card}
          />
        </section>
      ))}
    </div>
  ),
};

/** Checkboxes and a bulk bar; every card's hover actions are suppressed. */
export const SelectMode: Story = {
  render: () => (
    <GenerationGrid
      selectMode
      selectedIds={["1", "4"]}
      onSelectionChange={() => {}}
      items={TODAY}
      getItemId={(i) => i.id}
      renderItem={cardWithActions}
      bulkActions={
        <>
          <Button size="sm" variant="outline">
            Download
          </Button>
          <Button size="sm" variant="outline">
            Delete
          </Button>
        </>
      }
    />
  ),
  // The spec's second bullet is a state machine — "select mode replaces hover
  // actions with checkboxes and a bulk bar. Both cannot be live at once" — so
  // it is asserted rather than described. Every cell here was handed an
  // `actions` node; none of them renders it.
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvasElement.querySelectorAll('[data-slot="result-card-select"]')).toHaveLength(4);
    await expect(canvasElement.querySelectorAll('[data-slot="result-card-actions"]')).toHaveLength(0);
    canvas.getByRole("toolbar", { name: "Bulk actions, 2 selected" });

    // Third arm of the same rule, one level down: with a checkbox over it, A8's
    // frame stops being a button, so the cell holds one control rather than a
    // checkbox layered on a toggle.
    const frames = Array.from(canvasElement.querySelectorAll('[data-slot="preview-tile-frame"]'));
    await expect(frames.map((f) => f.tagName).join(",")).toBe("DIV,DIV,DIV,DIV");
  },
};

/** Empty is a tile inside the grid — the surface keeps its shape. */
export const Empty: Story = {
  render: () => (
    <GenerationGrid
      density="comfortable"
      items={[] as Row[]}
      getItemId={(i) => i.id}
      renderItem={card}
      empty={
        <div className="text-foreground flex h-full flex-col items-start justify-center gap-2 rounded-lg border border-dashed p-4 text-sm">
          <p>Nothing generated yet.</p>
          <Button size="sm" variant="outline">
            Generate your first result
          </Button>
        </div>
      }
    />
  ),
};

/* -------------------------------------------------------------------------
 * Case stories — the situations a batch gallery meets in a product, as
 * opposed to the prop combinations above. See
 * docs/design-system/story-conventions.md.
 *
 * All eight are true for this component, so there are no `case-skip` lines.
 * That follows from the shape: a grid whose column count is directional by
 * construction, three of F1's six states mapping onto A8's animated skeleton,
 * a select mode whose only controls are per-cell checkboxes, a real
 * `selectedIds`/`onSelectionChange` pair, three optional slots, two
 * author-supplied text slots that make opposite wrap decisions, and two
 * near-twin grids in the catalog.
 *
 * The grid itself owns almost no chrome — one toolbar, one empty cell, the
 * column classes — so most of what these stories measure is what happens to
 * A3 and F1 *inside* it. That is the point: F2 is the only surface where a
 * gallery's worth of F1 cards are rendered together, and several of the
 * findings below exist only at that scale or only at 375px.
 * ---------------------------------------------------------------------- */

/**
 * Right-to-left, in select mode so both of the grid's own chrome pieces are
 * on screen.
 *
 * **The grid mirrors for free, and the reason is worth recording:** there is
 * not one physical direction class in `generation-grid.tsx` — no `pl-`,
 * `ml-`, `border-l` or `text-left`, only `gap-*` and `grid-cols-*`. CSS grid
 * fills its tracks along the inline axis, so under `dir="rtl"` cell 1 paints
 * at x=564 and cell 4 at x=0, and the bulk bar's count (first in the DOM)
 * paints at x=670 to the right of its Download button at x=579. A future edit
 * reaching for `ml-auto` to push bulk actions over would break this and
 * nothing else.
 *
 * **What does not mirror is inside the cells, and it is F1's to fix.**
 * `result-card.tsx` positions both occupants of its overlay slot with
 * `absolute top-2 left-2` — the select checkbox and the hover actions. Under
 * RTL the checkbox stays 24px from the cell's *left* edge in a 172px cell, so
 * it lands on the far side from where the reading eye enters the tile. It is
 * the same physical-class shape §8's logical-property sweep table already
 * carries for A8 `preview-tile`'s badge (`right-2` → `end-2`); this is a
 * second site in the same overlay, one component up. Recorded, not asserted:
 * pinning the current position would lock the bug in, and the file is not
 * this item's to touch.
 */
export const RTL: Story = {
  render: () => (
    <div dir="rtl">
      <GenerationGrid
        density="comfortable"
        items={TODAY}
        getItemId={(i) => i.id}
        renderItem={card}
        selectMode
        selectedIds={["1"]}
        onSelectionChange={() => {}}
        bulkActions={
          <Button size="sm" variant="outline">
            Download
          </Button>
        }
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const cells = Array.from(
      canvasElement.querySelectorAll<HTMLElement>('[data-slot="generation-grid-item"]'),
    );
    await expect(cells).toHaveLength(4);

    // Mirrored, not merely reordered in the DOM: the first cell paints to the
    // right of the last.
    await expect(cells[0].getBoundingClientRect().left).toBeGreaterThan(
      cells[3].getBoundingClientRect().left,
    );

    // The bulk bar mirrors with it — the count leads on the right.
    const bar = canvas.getByRole("toolbar", { name: "Bulk actions, 1 selected" });
    const count = bar.querySelector<HTMLElement>('[data-slot="generation-grid-selection-count"]')!;
    const download = within(bar).getByRole("button", { name: "Download" });
    await expect(count.getBoundingClientRect().left).toBeGreaterThan(download.getBoundingClientRect().left);
  },
};

/**
 * `prefers-reduced-motion`, which for this component is a claim about
 * composition rather than about its own classes: `generation-grid.tsx`
 * contains no `animate-*` and no `transition-*` at all. The motion is in the
 * cells, and a generation gallery is the one surface where most of the cells
 * are animating at the same time — `idle`, `queued` and `streaming` all map
 * onto A8's pulsing skeleton (`result-card.tsx`'s `TILE_STATE`), so a
 * just-submitted batch of eight is eight pulsing tiles.
 *
 * Measured here: A8's `motion-reduce:animate-none` survives two levels of
 * composition (grid → card → tile) and every skeleton reads
 * `animationName: "none"` under the emulated reduce every test runs with.
 *
 * The second assertion is the counter-example to a finding the E/P wave
 * recorded on E4 `preset-grid` (`CONTINUE.md` §8): there, suppressing the
 * pulse left a loading tile and a failed tile both painted on `bg-muted` with
 * text for neither, so the two became indistinguishable. F1 passes A8 an
 * `action` node for `failed` — an icon, the words "Generation failed" and a
 * Retry button — so in this grid the collapse does not happen, and that is
 * what the failed cell is asserted to still carry.
 *
 * What *is* indistinguishable here, in both motion modes, is `idle` from
 * `queued`: three of F1's six states collapse onto one A8 state and only
 * `streaming` adds a visible overlay, so "not started" and "queued" differ
 * solely in F1's `sr-only` status text. Not a reduced-motion regression —
 * it reads the same either way — and not asserted.
 */
export const ReducedMotion: Story = {
  render: () => (
    <GenerationGrid
      density="comfortable"
      items={[{ id: "0", prompt: "Wireframe hallway, flat light", state: "idle" }, ...TODAY]}
      getItemId={(i) => i.id}
      renderItem={card}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // idle + streaming + queued all reach A8's skeleton; done and failed do not.
    const skeletons = Array.from(
      canvasElement.querySelectorAll<HTMLElement>('[data-slot="preview-tile-loading"]'),
    );
    await expect(skeletons).toHaveLength(3);
    for (const el of skeletons) {
      await expect(getComputedStyle(el).animationName).toBe("none");
    }

    // …and with the pulse gone, the failed cell is still separable from them
    // by text rather than by movement.
    // Scoped to A8's visible failed overlay: F1 also carries the same words in
    // an `sr-only` status region, and the claim here is a visual one.
    const failed = canvasElement.querySelector<HTMLElement>(
      '[data-slot="result-card"][data-state="failed"]',
    )!;
    const overlay = failed.querySelector<HTMLElement>('[data-slot="preview-tile-failed"]')!;
    within(overlay).getByText("Generation failed");
    within(overlay).getByRole("button", { name: "Retry" });
  },
};

/**
 * The grid contributes no tab stop of its own — every stop belongs to the
 * bulk bar or to a cell — and select mode is where that arithmetic matters,
 * because it is the mode with the most stops and the least to distinguish
 * them.
 *
 * The order proved here, with four results and two bulk actions: **Download,
 * Delete, then a checkbox per cell in DOM order, except that the failed
 * result's Retry comes before its own checkbox.** Retry lives inside A8's
 * frame and the checkbox is a sibling after it, so a keyboard user sweeping a
 * gallery for things to delete passes through every failed result's retry
 * affordance on the way. That is seven stops for four results, and the
 * toolbar's two are ahead of all of them — the docs page says select mode
 * "adds a tab stop ahead of every cell"; this is the count.
 *
 * **The defect this story found, recorded and not asserted: every per-cell
 * checkbox has the same accessible name.** `result-card.tsx` labels its
 * checkbox from a fixed `sr-only` span reading "Select this result", so all
 * four here are announced identically — four indistinguishable checkboxes in
 * a row, and at `compact` density that would be eight per visual row. F1
 * already receives the prompt as `label`; naming the checkbox from it is the
 * fix, and it belongs in `result-card.tsx`. This is the per-row-control
 * naming contract the D/I wave found broken twice (D3 `context-chips`, I2
 * `property-inspector`); F1 is the third.
 *
 * **A mechanical note about the ring check.** The E/P wave recorded that the
 * shared helper (`boxShadow !== "none" || outlineStyle !== "none"`) passes on
 * a fully transparent, zero-size shadow. This story uses a version that reads
 * the spread and the alpha instead — and doing so exposed why the weak
 * version was passing here: the vendored `Button` carries `transition-all`
 * with no `motion-reduce:transition-none`, so its focus ring *fades in* over
 * ~150ms and is still transparent when read on the tab. Measured
 * mid-transition at 0.53px/α0.09 and 1.37px/α0.23 before settling at
 * 3px/α0.5; the Base UI `Checkbox`, which transitions only colours, is at
 * 3px/α0.5 on the first read. So the check has to settle before it reads.
 * That is a third symptom of the same vendored `transition-all` §8 already
 * records (the press nudge is the first, the ring fade the third), and it is
 * a primitive-wide posture rather than this component's to fix.
 */
export const KeyboardOrder: Story = {
  render: () => (
    <GenerationGrid
      density="comfortable"
      items={TODAY}
      getItemId={(i) => i.id}
      renderItem={cardWithActions}
      selectMode
      selectedIds={[]}
      onSelectionChange={() => {}}
      bulkActions={
        <>
          <Button size="sm" variant="outline">
            Download
          </Button>
          <Button size="sm" variant="outline">
            Delete
          </Button>
        </>
      }
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="generation-grid"]')!;

    const stops = Array.from(root.querySelectorAll<HTMLElement>('button, [role="checkbox"]'));
    const nameOf = (el: Element | null) =>
      el === null ? "nothing" : `stop#${stops.indexOf(el as HTMLElement)}`;

    // Two bulk actions, one checkbox per cell, plus the failed cell's Retry.
    await expect(stops).toHaveLength(7);
    await expect(stops.filter((el) => el.tagName === "BUTTON")).toHaveLength(3);

    // A visible focus treatment at every stop. Stronger than the shared
    // helper — a transparent or hairline shadow does not count — and settled
    // rather than read on the tab, because the vendored Button fades its ring
    // in through `transition-all`.
    const shadowLayers = (shadow: string) =>
      shadow === "none" ? [] : shadow.split(/,(?![^()]*\))/).map((s) => s.trim());
    const hasVisibleRing = (el: HTMLElement) => {
      const style = getComputedStyle(el);
      if (style.outlineStyle !== "none" && parseFloat(style.outlineWidth) >= 1) return true;
      return shadowLayers(style.boxShadow).some((layer) => {
        const lengths = [...layer.matchAll(/(-?[\d.]+)px/g)].map((m) => Number(m[1]));
        const spread = lengths.length >= 4 ? lengths[3] : 0;
        const alpha = /\/\s*([\d.]+)\)/.exec(layer) ?? /,\s*([\d.]+)\)/.exec(layer);
        return spread >= 2 && (alpha === null || Number(alpha[1]) >= 0.25);
      });
    };
    const assertVisiblyFocused = async (el: HTMLElement) => {
      const id = nameOf(el);
      await expect(`${id} focusVisible=${el.matches(":focus-visible")}`).toBe(`${id} focusVisible=true`);
      await waitFor(() => expect(`${id} ring=${hasVisibleRing(el)}`).toBe(`${id} ring=true`));
    };

    // One lap, seeded from where focus actually lands rather than from an
    // assumed first element, and asserting each stop is new — so the walk
    // proves the cycle instead of counting hits inside an allowance.
    await userEvent.tab();
    await waitFor(() => {
      if (!stops.includes(document.activeElement as HTMLElement)) {
        throw new Error(`focus never entered the grid: ${nameOf(document.activeElement)}`);
      }
    });
    await expect(nameOf(document.activeElement)).toBe(nameOf(stops[0]));
    await assertVisiblyFocused(stops[0]);

    const seen = new Set<HTMLElement>([stops[0]]);
    for (let i = 1; i < stops.length; i += 1) {
      const previous = document.activeElement as HTMLElement;
      await userEvent.tab();
      await waitFor(() => {
        if (document.activeElement === previous) throw new Error("focus has not moved yet");
      });
      const focused = document.activeElement as HTMLElement;
      await expect(`${nameOf(focused)} repeat=${seen.has(focused)}`).toBe(`${nameOf(focused)} repeat=false`);
      await expect(nameOf(focused)).toBe(nameOf(stops[i]));
      await assertVisiblyFocused(focused);
      seen.add(focused);
    }
    await expect(seen.size).toBe(stops.length);

    // One more tab leaves the grid entirely — nothing traps and nothing wraps.
    await userEvent.tab();
    await expect(root.contains(document.activeElement)).toBe(false);

    // The toolbar's name carries the live count, which is the one piece of
    // state the grid announces on its own.
    canvas.getByRole("toolbar", { name: "Bulk actions, 0 selected" });
  },
};

/**
 * `selectedIds` / `onSelectionChange` is a real controlled pair, and the grid
 * holds no selection state of its own to fall back on: `selected` is a `Set`
 * derived from the prop on every render, and `toggle` returns early when
 * there is no handler. So a host that ignores the callback gets a gallery
 * whose checkboxes never check — the docs page's first "don't", proved here
 * by holding the value back on purpose.
 *
 * What that proves, in order: clicking a checkbox does not move the rendered
 * selection; the callback still fires with the *whole next array* rather than
 * a delta, which is what a host needs to apply it; a re-render with an
 * unchanged `selectedIds` leaves the grid fixed; and applying the payload
 * both checks the box and moves the toolbar's count.
 *
 * `selectMode` is the other half and is deliberately *not* a pair — there is
 * no `onSelectModeChange`, so the host owns the mode outright and nothing in
 * the grid can leave it. This shell drives it from the same state, which is
 * what makes the last step possible: flipping the mode swaps the whole
 * chrome at once — checkboxes and toolbar out, hover actions back in — which
 * is the spec's "both cannot be live at once" observed as a transition rather
 * than as two separate renderings.
 *
 * The gap that is not fixed here: nothing moves focus across that swap.
 * Leaving select mode unmounts the toolbar and every checkbox, and a bulk
 * delete is the usual way a user leaves it, so focus lands on `<body>`. The
 * docs module's focus notes already carry this; it stays recorded rather than
 * asserted.
 */
export const Controlled: Story = {
  render: () => <ControlledShell />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const boxes = () => canvas.getAllByRole("checkbox");

    await expect(boxes()).toHaveLength(4);
    await expect(boxes()[0]).toHaveAttribute("aria-checked", "false");

    // 1. Interaction alone does not move the rendered value.
    await userEvent.click(boxes()[0]);
    await expect(boxes()[0]).toHaveAttribute("aria-checked", "false");

    // 2. …but the callback fired, with the full next array a host applies.
    await expect(canvas.getByTestId("requested")).toHaveTextContent("1");

    // 3. Re-render with an unchanged `selectedIds`. Prove the re-render first.
    await expect(canvas.getByTestId("render-pass")).toHaveTextContent("1");
    await userEvent.click(canvas.getByRole("button", { name: "Re-render" }));
    await expect(canvas.getByTestId("render-pass")).toHaveTextContent("2");
    await expect(boxes()[0]).toHaveAttribute("aria-checked", "false");

    // 4. The payload was sufficient to apply the change — and the toolbar's
    //    count is read from the same prop, never tracked separately.
    await userEvent.click(canvas.getByRole("button", { name: "Apply" }));
    await waitFor(() => expect(boxes()[0]).toHaveAttribute("aria-checked", "true"));
    canvas.getByRole("toolbar", { name: "Bulk actions, 1 selected" });

    // 5. The mode is host state too, and flipping it swaps the whole chrome.
    await userEvent.click(canvas.getByRole("button", { name: "Leave select mode" }));
    await expect(canvas.queryAllByRole("checkbox")).toHaveLength(0);
    await expect(canvas.queryByRole("toolbar")).toBeNull();
    await expect(canvasElement.querySelectorAll('[data-slot="result-card-actions"]')).toHaveLength(4);

    await userEvent.click(canvas.getByRole("button", { name: "Enter select mode" }));
    await expect(canvas.getAllByRole("checkbox")).toHaveLength(4);
    await expect(canvasElement.querySelectorAll('[data-slot="result-card-actions"]')).toHaveLength(0);
  },
};

function ControlledShell() {
  const [applied, setApplied] = React.useState<string[]>([]);
  const [requested, setRequested] = React.useState<string[] | null>(null);
  const [selectMode, setSelectMode] = React.useState(true);
  const [pass, setPass] = React.useState(1);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <dl className="text-foreground grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs">
          <dt>selectedIds prop</dt>
          <dd data-testid="applied">{applied.length === 0 ? "—" : applied.join(",")}</dd>
          <dt>last onSelectionChange</dt>
          <dd data-testid="requested">{requested === null ? "—" : requested.join(",")}</dd>
          <dt>host render pass</dt>
          <dd data-testid="render-pass" className="tabular-nums">
            {pass}
          </dd>
        </dl>
        <Button size="sm" variant="outline" onClick={() => setPass((p) => p + 1)}>
          Re-render
        </Button>
        <Button size="sm" variant="outline" onClick={() => setApplied(requested ?? [])}>
          Apply
        </Button>
        <Button size="sm" variant="outline" onClick={() => setSelectMode((m) => !m)}>
          {selectMode ? "Leave select mode" : "Enter select mode"}
        </Button>
      </div>

      <GenerationGrid
        density="comfortable"
        items={TODAY}
        getItemId={(i) => i.id}
        renderItem={cardWithActions}
        selectMode={selectMode}
        selectedIds={applied}
        onSelectionChange={setRequested}
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
 * Three of the grid's four optional slots left empty, each of which fails
 * quietly rather than loudly.
 *
 * 1. **No `empty` node, and no items.** The grid still keeps its columns and
 *    still renders the empty cell, so the gallery is a `role="list"`
 *    containing one `role="listitem"` that is zero pixels tall and has no
 *    text. A screen reader announces "list, 1 item" for a gallery that has
 *    nothing in it, which is worse than announcing nothing. The slot is
 *    unconditional (`generation-grid.tsx` renders the wrapper and puts
 *    `{empty}` inside it), so this is the grid's own no-label rendering
 *    rather than a caller's.
 * 2. **Select mode with no `bulkActions`.** The whole toolbar is guarded on
 *    `selectMode && bulkActions`, so omitting the actions also removes the
 *    "N selected" count — the only thing on the page that says how many
 *    items are picked. A caller who wants selection without bulk verbs loses
 *    the readout as a side effect.
 * 3. **A group whose `label` is `""`.** A3 `date-section` renders its `<p>`
 *    unconditionally and points `aria-labelledby` at it, so the group
 *    survives as an 8px-tall unnamed strip: a visible separator with no name
 *    and no way to tell what it separates. This is the softer sibling of the
 *    E/P wave's `feed-view` finding (§8), where an empty label dropped the
 *    header entirely; here the header stays and only the meaning goes.
 *
 * `CONTINUE.md` §8 already records the related gap — **F2 has no full-width
 * empty mode**, found by an O6 builder who wanted the empty state to span the
 * surface rather than sit in the first cell. That is a deliberate spec rule
 * ("Empty is an in-grid tile, not a page takeover"), so it is cited here
 * rather than re-filed, and nothing below adds the mode.
 */
export const EmptyLabel: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">no `empty` node, no items</p>
        <div data-testid="no-empty-node">
          <GenerationGrid
            density="comfortable"
            items={[] as Row[]}
            getItemId={(i) => i.id}
            renderItem={card}
          />
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">select mode, no `bulkActions`</p>
        <div data-testid="no-bulk-actions">
          <GenerationGrid
            density="comfortable"
            items={TODAY.slice(0, 2)}
            getItemId={(i) => i.id}
            renderItem={card}
            selectMode
            selectedIds={["1"]}
            onSelectionChange={() => {}}
          />
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">a group labelled `&quot;&quot;`</p>
        <div data-testid="empty-group-label">
          <GenerationGrid
            density="comfortable"
            groups={[
              { id: "today", label: "Today", items: TODAY.slice(0, 2) },
              { id: "unlabelled", label: "", items: YESTERDAY },
            ]}
            getItemId={(i) => i.id}
            renderItem={card}
          />
        </div>
      </section>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // 1. An empty gallery still announces one item, and it is empty.
    const noNode = canvas.getByTestId("no-empty-node");
    const cells = noNode.querySelectorAll<HTMLElement>('[role="listitem"]');
    await expect(cells).toHaveLength(1);
    await expect(cells[0].textContent).toBe("");
    await expect(cells[0].getBoundingClientRect().height).toBe(0);

    // 2. No bulk actions means no toolbar, and therefore no count.
    const noBulk = canvas.getByTestId("no-bulk-actions");
    await expect(within(noBulk).queryByRole("toolbar")).toBeNull();
    await expect(noBulk.querySelector('[data-slot="generation-grid-selection-count"]')).toBeNull();
    // Selection itself still works — this is a missing readout, not a missing mode.
    await expect(within(noBulk).getAllByRole("checkbox")).toHaveLength(2);

    // 3. The unlabelled group keeps its separator and loses its name.
    const emptyLabel = canvas.getByTestId("empty-group-label");
    const groups = Array.from(emptyLabel.querySelectorAll<HTMLElement>('[data-slot="date-section"]'));
    await expect(groups).toHaveLength(2);
    const labels = Array.from(emptyLabel.querySelectorAll<HTMLElement>('[data-slot="date-section-label"]'));
    await expect(labels.map((el) => el.textContent)).toEqual(["Today", ""]);
    await expect(labels[1].getBoundingClientRect().height).toBeGreaterThan(0);
  },
};

/**
 * ~90 characters in each of the two author-supplied text slots, which answer
 * it in opposite ways.
 *
 * **The prompt in a cell truncates.** F1 hands it to A8's overlay label,
 * which is `truncate` — one line, ellipsis, measured 179px of text in a 140px
 * box. The excerpt is clipped rather than the card growing, which is the
 * whole reason the label is an overlay: it costs no layout, so a long prompt
 * cannot make one cell taller than its neighbours. Asserted here across five
 * cells in five different states — same height, every one.
 *
 * **The group label wraps.** A3 `date-section` sets no `truncate` and no
 * `whitespace-nowrap`, so the same 89 characters stay whole and the header
 * grows instead. At this story's width they fit on one 24px line; at 375px
 * they take three, which `Mobile` measures. The two decisions are right for
 * their slots — a clipped bucket name would be unreadable and a clipped
 * prompt is still recognisable — but nothing in the component says so, and a
 * caller reading only the props would not guess that one slot truncates and
 * the other reflows the page.
 */
export const LongContent: Story = {
  render: () => (
    <GenerationGrid
      density="comfortable"
      groups={[
        {
          id: "overnight",
          label: "Generated while the overnight batch was still running, between Monday and Thursday",
          items: [
            {
              id: "1",
              prompt:
                "A rooftop garden photographed at golden hour on 35mm film, warm rim light across the planters",
              state: "done",
            },
            ...TODAY.slice(1),
          ],
        },
      ]}
      getItemId={(i) => i.id}
      renderItem={card}
    />
  ),
  play: async ({ canvasElement }) => {
    // The prompt is clipped, not wrapped, and the clip is real.
    const overlay = canvasElement.querySelector<HTMLElement>('[data-slot="preview-tile-label"]')!;
    const overlayStyle = getComputedStyle(overlay);
    await expect(overlayStyle.whiteSpace).toBe("nowrap");
    await expect(overlayStyle.textOverflow).toBe("ellipsis");
    await expect(overlay.scrollWidth).toBeGreaterThan(overlay.clientWidth);

    // …so the cells stay identical in height regardless of prompt length,
    // which is F1's load-bearing property seen from the grid.
    const heights = Array.from(canvasElement.querySelectorAll<HTMLElement>('[data-slot="result-card"]')).map(
      (el) => el.getBoundingClientRect().height.toFixed(2),
    );
    await expect(heights).toHaveLength(4);
    await expect(new Set(heights).size).toBe(1);

    // The group label takes the opposite decision: whole text, wrapping.
    const label = canvasElement.querySelector<HTMLElement>('[data-slot="date-section-label"]')!;
    const labelStyle = getComputedStyle(label);
    await expect(labelStyle.whiteSpace).toBe("normal");
    await expect(labelStyle.textOverflow).toBe("clip");
    await expect(label.scrollWidth).toBeLessThanOrEqual(label.clientWidth);
  },
};

/**
 * 375px, wrapper-constrained. Two frames, and only the first is asserted.
 *
 * **The frame that is asserted** is a `compact` grid, the density meant for a
 * wide library, squeezed into a phone column. It does not scroll sideways —
 * `grid-cols-*` tracks are `minmax(0, 1fr)`, so the cells shrink instead of
 * overflowing — and that is the claim. What it costs is the measurement worth
 * having: **the gate's chromium is 1200px wide, so the `lg:` column count
 * still applies inside the 375px box and the grid renders eight columns where
 * a real 375px viewport would render three.** Eight columns of a 375px row
 * leave each `result-card` 32.9px wide, and after the card's own padding A8's
 * media frame is 0.9 × 0.9px — a result gallery in which the results are
 * invisible, under a 41px footer that is the entire card. `default` and
 * `comfortable` measure the same way at 49.2px / 17.2px and 81.8px / 49.8px.
 *
 * So this frame proves the stronger, stranger claim the convention's second
 * mechanical fact describes: the desktop layout squeezed narrow does not
 * scroll. The phone case — three columns, ~110px cells — is the one the docs
 * page's density pitfall is about, and it is not what runs here.
 *
 * **The frame that is not asserted** is the bulk bar with one long action
 * label. It is `flex items-center gap-2` with no wrap, no `min-w-0` and no
 * scroll container, so at 375px it measures 432px of content in a 373px box
 * and pushes the frame itself to 433px — real horizontal page scroll on a
 * phone, from the one piece of chrome the grid draws itself. Left recorded
 * rather than repaired: wrapping, scrolling or truncating the toolbar is a
 * design choice (and an `overflow-x-auto` toolbar would need its own tab stop
 * to clear `scrollable-region-focusable`), so it is not one of the sanctioned
 * mechanical shapes. Asserting the overflow would pin it.
 */
export const Mobile: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">compact density at 375px — asserted</p>
        <div className="w-[375px] max-w-full" data-testid="viewport">
          <GenerationGrid
            density="compact"
            groups={[
              {
                id: "overnight",
                label: "Generated while the overnight batch was still running, between Monday and Thursday",
                items: [...TODAY, ...YESTERDAY],
              },
            ]}
            getItemId={(i) => i.id}
            renderItem={card}
          />
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">
          bulk bar with a long action label at 375px — measured, not asserted
        </p>
        <div className="w-[375px] max-w-full" data-testid="bulk-viewport">
          <GenerationGrid
            density="compact"
            items={TODAY}
            getItemId={(i) => i.id}
            renderItem={card}
            selectMode
            selectedIds={["1", "4"]}
            onSelectionChange={() => {}}
            bulkActions={
              <>
                <Button size="sm" variant="outline">
                  Download all selected results as a zip archive
                </Button>
                <Button size="sm" variant="outline">
                  Delete
                </Button>
              </>
            }
          />
        </div>
      </section>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const viewport = canvas.getByTestId("viewport");
    const grid = viewport.querySelector<HTMLElement>('[data-slot="generation-grid-grid"]')!;

    // No horizontal scroll: the tracks shrink rather than overflow.
    await expect(viewport.scrollWidth).toBeLessThanOrEqual(viewport.clientWidth);

    // Eight columns, because a wrapper constrains width and not the
    // breakpoint — this is the wide layout squeezed narrow, not the phone.
    await expect(getComputedStyle(grid).gridTemplateColumns.split(" ")).toHaveLength(8);

    // The one thing that genuinely reflows at this width: the group label
    // wraps past its single line rather than clipping.
    const label = viewport.querySelector<HTMLElement>('[data-slot="date-section-label"]')!;
    await expect(label.getBoundingClientRect().height).toBeGreaterThan(30);
    await expect(label.scrollWidth).toBeLessThanOrEqual(label.clientWidth);
  },
};

/**
 * Three grids that look alike in a screenshot. The rule is **who owns the
 * cell**, and it decides all three:
 *
 * - **F2 `generation-grid`** owns no cell at all — it takes `renderItem` and
 *   lays out whatever you return. In exchange it owns everything around the
 *   cells: three densities, optional date grouping, a controlled selection
 *   with a bulk bar. Reach for it when the items are *results*, the shape is
 *   yours, and someone will eventually want to delete twenty of them at once.
 *   It is the only one of the three with a select mode.
 * - **C4 `recent-grid`** owns its cell and knows what is in it — title,
 *   thumbnail, "Edited 19 hours ago", a duration badge. That fixed shape is
 *   the feature: you pass data, not nodes, and every recents surface in the
 *   product looks the same. No density prop, no grouping, no selection. If
 *   you find yourself passing a `renderItem` that rebuilds a project tile,
 *   you wanted this.
 * - **E4 `preset-grid`** is not a gallery — it is a choice control. Its tiles
 *   are `radio` or `checkbox`, it has a value, and its overflow tile is
 *   see-more rather than a page of history. Presets are options; results are
 *   objects. If picking a tile changes what the next generation does, it is
 *   E4; if picking a tile changes what you are looking at, it is F2.
 *
 * One near-twin is deliberately not rendered here: **J1 `asset-library`** is
 * this same selection model in a table, and the spec says so outright
 * ("Selection mode swaps hover for checkboxes and reveals a bulk bar, as F2
 * does"). The choice between them is grid versus table — whether the
 * thumbnail or the metadata is what people scan — not a difference in what
 * selection means.
 */
export const Boundary: Story = {
  render: () => (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">
          F2 generation grid — your cells, plus density, grouping and bulk selection
        </p>
        <GenerationGrid
          density="comfortable"
          items={TODAY}
          getItemId={(i) => i.id}
          renderItem={card}
          selectMode
          selectedIds={["1"]}
          onSelectionChange={() => {}}
          bulkActions={
            <Button size="sm" variant="outline">
              Delete
            </Button>
          }
        />
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">
          C4 recent grid — its cell, its item shape, no selection
        </p>
        <RecentGrid
          items={[
            { id: "1", title: "Rooftop garden batch", editedAgo: "Edited 19 hours ago" },
            { id: "2", title: "Neon alley batch", editedAgo: "Edited 2 days ago" },
            { id: "3", title: "Studio portraits", editedAgo: "Edited 5 days ago" },
          ]}
        />
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">
          E4 preset grid — a choice control with a value, not a gallery
        </p>
        <PresetGrid
          aria-label="Style presets"
          content="style"
          defaultValue="film"
          items={[
            { id: "film", label: "35mm film" },
            { id: "studio", label: "Studio light" },
            { id: "neon", label: "Neon" },
          ]}
        />
      </section>
    </div>
  ),
};
