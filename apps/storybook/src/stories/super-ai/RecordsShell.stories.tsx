import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { RecordsShell, type RecordsShellProps } from "@/registry/super-ai/records-shell";
import { RecordsShellDocs } from "@/content/components/records-shell.docs";
import { componentDocsPage } from "@/lib/component-docs-page";
import { focusTreatmentSignature, settledFocusRing } from "@/lib/focus-ring";
import { SidebarNav } from "@/registry/super-ai/sidebar-nav";

const FOLDERS: RecordsShellProps["folders"] = [
  { id: "marketing", name: "Marketing", count: 12, modified: "2 days ago" },
  { id: "revops", name: "Revenue ops", count: 5, modified: "Yesterday" },
  { id: "archive", name: "Archive", count: 41, modified: "3 months ago" },
];

const RECORDS: RecordsShellProps["records"] = [
  {
    id: "digest",
    title: "Daily briefing digest",
    apps: [{ name: "Gmail" }, { name: "Notion" }, { name: "Slack" }],
    runState: "success",
    lastRun: "Last run 4 min ago",
    meta: ["Marketing", "9 operations"],
    enabled: true,
    actions: [
      { id: "duplicate", label: "Duplicate" },
      { id: "delete", label: "Delete", destructive: true },
    ],
  },
  {
    id: "lead-sync",
    title: "Lead sync to CRM",
    apps: [{ name: "HubSpot" }, { name: "Google Sheets" }],
    runState: "failed",
    lastRun: "Last run 2 hours ago",
    meta: ["Revenue ops", "14 operations"],
    enabled: true,
    actions: [{ id: "logs", label: "View run log" }],
  },
  {
    id: "churn-watch",
    title: "Churn-risk watchlist",
    apps: [{ name: "Stripe" }, { name: "Linear" }, { name: "Intercom" }, { name: "Notion" }, { name: "Slack" }],
    runState: "running",
    lastRun: "Started 30 seconds ago",
    meta: ["Revenue ops"],
    enabled: true,
  },
  {
    id: "onboarding",
    title: "Onboarding follow-ups",
    apps: [{ name: "Intercom" }],
    runState: "never",
    draft: true,
    meta: ["Marketing"],
    enabled: false,
    actions: [{ id: "duplicate", label: "Duplicate" }],
  },
];

const FULL_ARGS: RecordsShellProps = {
  title: "Scenarios",
  switcher: <div className="px-2 text-sm font-medium">Northwind</div>,
  createLabel: "New scenario",
  onCreate: () => {},
  folders: FOLDERS,
  records: RECORDS,
  onEnabledChange: () => {},
  onOpenRecord: () => {},
  onOpenFolder: () => {},
  filters: [
    { id: "failing", label: "Failing", active: true, onToggle: () => {}, onRemove: () => {} },
    { id: "mine", label: "Owned by me", onToggle: () => {} },
  ],
  addFilterLabel: "filter",
  onAddFilter: () => {},
  onOpenFilters: () => {},
  sort: "recent",
  onSortChange: () => {},
};

const meta: Meta<typeof RecordsShell> = {
  title: "Super AI/Records Shell",
  component: RecordsShell,
  // A block is a page, so it gets the whole canvas rather than a centred box.
  // The `h-svh` wrapper is what the shell's `h-full` measures against — in a
  // real app that is the document, here it is the story frame.
  parameters: { layout: "fullscreen", docs: { page: componentDocsPage(RecordsShellDocs) } },
  decorators: [
    (Story) => (
      <div className="h-svh w-full">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof RecordsShell>;

/** The working shell: folders, four scenarios, one failing, one mid-run, one draft. */
export const Scenarios: Story = { args: FULL_ARGS };

/**
 * Day one. No folders, no records, nothing pinned in the rail — three empty
 * affordances at once, which is the version most new users actually see. The
 * header keeps its create button, because the empty state's CTA and the header's
 * are the same verb. Mandatory export for the block contract.
 */
export const Empty: Story = {
  args: {
    title: "Scenarios",
    switcher: <div className="px-2 text-sm font-medium">Northwind</div>,
    createLabel: "New scenario",
    onCreate: () => {},
  },
};

/**
 * Narrow viewport. Below the sidebar's 768px breakpoint the vendored Sidebar
 * swaps itself for a drawer, so the header trigger becomes the only way in, and
 * the folder table, the filter row and the record rows take the full width.
 * Mandatory export for the block contract — a shell is a layout, and layout is
 * what breaks.
 *
 * `globals.viewport.value` is the Storybook 9 API. `parameters.viewport
 * .defaultViewport` was removed in 9 and does nothing while looking configured.
 *
 * KNOWN LIMIT: this resizes the canvas in the Storybook UI only. The vitest
 * runner behind `pnpm test:stories` has no manager to resize an iframe, so this
 * story is rendered and axe-checked at the browser's default width. The narrow
 * layout is verified by hand, not by a gate.
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

/**
 * The operational read. Every row states how its last run went — succeeded,
 * failed, running, never — in an icon shape and in words, in the subtitle beside
 * the time. This is what separates the shell from a stored-asset list.
 */
export const RunStates: Story = {
  args: {
    ...FULL_ARGS,
    folders: [],
    filters: [{ id: "failing", label: "Failing", active: true, onToggle: () => {} }],
  },
};

/**
 * Rated. N1 sits at the foot of the record region, asking about the list rather
 * than any one record — J5 renders a single table with no per-row slot, so
 * per-record feedback is not reachable without forking it.
 */
export const Rated: Story = {
  args: {
    ...FULL_ARGS,
    feedback: { state: "idle", onRate: () => {}, onSubmit: () => {} },
  },
};

/**
 * The shell in a 600px frame — shorter than any viewport, which is the ordinary
 * embedded case and the one `SIDEBAR_FILLS_SHELL` exists for.
 *
 * **This is O10's replacement for `EmbeddedWithSidebarFooter`, and it takes a
 * different anchor because it has to.** O1 and O2 anchor that guard on
 * `[data-slot="app-sidebar-footer"]`: they forward a `sidebarFooter` prop to
 * B1's bottom-anchored slot, so a sidebar sized from the viewport instead of
 * the shell pushes the footer past the frame's bottom edge and the assertion
 * catches it. O10 forwards no `footer` and no `promo` — its spec has no
 * bottom-anchored region — so that anchor does not exist here. Rather than add
 * a prop the spec does not ask for, this story measures the thing the class
 * actually changes: the sidebar's own box. `[&_[data-slot=app-sidebar]]:h-full`
 * lands on the vendored `sidebar-container`, whose `fixed inset-y-0 h-svh`
 * would otherwise size it from the window; with the class it takes the shell's
 * height instead. Asserting the box is strictly stronger than asserting a
 * descendant of it, so the exemption is a substitution rather than a gap.
 *
 * Geometric, not a class check: a class assertion passes against a constant
 * that has been deleted from the `cn()` call and left declared.
 *
 * The frame is queried by `data-testid` rather than `canvasElement
 * .firstElementChild`, because the meta decorator already wraps every story in
 * its own `h-svh` div.
 *
 * Desktop-width only, and only there is there anything to claim: below 768px
 * the vendored Sidebar renders no rail until the trigger opens a sheet, and the
 * sheet takes its height from the viewport. See `Mobile`.
 */
export const EmbeddedShorterThanViewport: Story = {
  args: FULL_ARGS,
  render: (args) => (
    <div data-testid="embedded-frame" className="h-[600px] overflow-hidden">
      <RecordsShell {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const frame = canvasElement.querySelector<HTMLElement>('[data-testid="embedded-frame"]')!;
    const sidebar = canvasElement.querySelector<HTMLElement>('[data-slot="app-sidebar"]')!;

    const frameBox = frame.getBoundingClientRect();
    const sidebarBox = sidebar.getBoundingClientRect();

    await expect(frameBox.height).toBe(600);
    // The whole claim: the sidebar ends where the shell ends. Without
    // SIDEBAR_FILLS_SHELL it is `h-svh` and runs to the bottom of the window.
    await expect(sidebarBox.bottom).toBeLessThanOrEqual(frameBox.bottom + 1);
    await expect(sidebarBox.height).toBeGreaterThan(0);
    await expect(Math.round(sidebarBox.height)).toBe(600);

    // And the other half of the pair: `contain: layout` is what makes the
    // fixed box resolve against the shell rather than the browser's left edge.
    const shell = canvasElement.querySelector<HTMLElement>('[data-slot="records-shell"]')!;
    await expect(getComputedStyle(shell).contain).toContain("layout");
    await expect(sidebarBox.left).toBeGreaterThanOrEqual(shell.getBoundingClientRect().left - 1);
  },
};

/* ----------------------------------------------------------------------
 * Case stories — the situations this shell meets in a product, as opposed
 * to the prop combinations above. See docs/design-system/story-conventions.md.
 *
 * All eight are true here, so there is no `case-skip` line in this file. A
 * shell declares `regions` rather than `states`, so the exports above are the
 * arrangements a caller reaches; the eight below are the conditions that break
 * arrangements.
 *
 * Four of the eight found defects that are NOT asserted here, because they
 * live in components this shell composes or in a vendored primitive, and a
 * block reports rather than forks (block-build-brief.md): A5's chips carry the
 * only focus treatment the user agent supplies (`KeyboardOrder`), J1's folder
 * name overruns its column instead of truncating (`LongContent`), the vendored
 * sidebar neither mirrors under RTL (`RTL`) nor branches on reduced motion
 * (`ReducedMotion`), and four of the shell's own text slots turn into axe
 * failures when a caller empties them (`EmptyLabel`). Each story's description
 * carries the measurement.
 * ---------------------------------------------------------------------- */

/**
 * `dir` on the document rather than on a wrapper. The sort control is a Base UI
 * Select that portals its listbox out of the canvas, and Base UI reads
 * direction from computed style and from its own context — a wrapper reaches
 * neither (story-conventions.md, mechanical fact 5).
 */
function RtlDocument({ children }: { children: React.ReactNode }) {
  React.useLayoutEffect(() => {
    const previous = document.documentElement.dir;
    document.documentElement.dir = "rtl";
    return () => {
      document.documentElement.dir = previous;
    };
  }, []);
  return <>{children}</>;
}

/**
 * Right-to-left, and the two classes the shell writes for itself are the two it
 * had to fix. Both were `ml-auto` — the header's action group and the sort
 * control — and an auto margin sits on a *side*, so under RTL `margin-left`
 * lands on the main-**end** edge and stops pushing: the free space opens to the
 * left of the create button and the button packs against the heading instead of
 * against the far edge. Both are `ms-auto` now, and byte-identical in LTR as a
 * measurement rather than an assumption (N6 `usage-dashboard`'s lesson): the
 * whole LTR frame was read back with the swap reverted and with it applied and
 * every box matched to the sub-pixel — header `x=256..1200`, heading
 * `x=300..375.19`, count `x=383.19..391.86`, action group `x=1069.38..1192`
 * with `margin-left: 669.516px`, sort `x=1093.56..1188` with `margin-left:
 * 442.484px`. Under RTL the same two margins read `0px` on the left and the
 * same values on the right. This story pins the RTL half so the swap cannot
 * silently revert.
 *
 * J1's own chrome mirrors correctly and is asserted as the positive case: its
 * search glyph is `start-2.5` and its field `ps-8`, so at RTL the glyph sits at
 * `x=906..922` and the 32px of padding moves to the right.
 *
 * THREE THINGS THIS STORY CANNOT FIX, all measured at 1200px:
 *
 * 1. **The vendored sidebar does not mirror.** `components/ui/sidebar.tsx`
 *    splits itself into an in-flow `sidebar-gap` that follows direction and a
 *    `fixed` container positioned by `data-[side=left]:left-0` that does not.
 *    Measured here: the gap sits at `x=944..1200` while the sidebar paints at
 *    `x=0..256`, so a 256px blank strip runs down the start edge and the rail
 *    lies on top of the first 256px of the page — which is exactly where the
 *    sort control (`x=12..106`) and the header's action group (`x=8..131`) now
 *    are. O1 and O2 measured it independently; it reaches every B1 consumer and
 *    the repair is one logical-property pass on a vendored file.
 * 2. **A5 `filter-bar`'s chip is physically padded.** `filter-chip-toggle`
 *    carries `px-3 pr-1` and `filter-chip-remove` carries `mr-1`, so under RTL
 *    the 4px gap that should separate the remove button from the chip's end
 *    edge lands between the two buttons instead: the chip is `x=853..932`, the
 *    remove button `x=854..870` — 1px from the outer edge — and the toggle
 *    starts 4px later at `x=874`. Cosmetic, and A5's to fix.
 * 3. **`components/ui/table.tsx` gives every `<th>` a physical `text-left`**
 *    while the cells inherit `start`, so a column's heading and its data end up
 *    on opposite edges of the same box. The J wave measured it on J1 at 832px;
 *    both of this shell's tables carry it, measured here rather than restated —
 *    the folder table's Name column spans `x=603..932` with `text-align: left`
 *    on the `<th>` and `start` on the `<td>`, and the record table's Record
 *    column spans `x=392..932` the same way. That is 329px and 540px of empty
 *    run between a heading and the thing it heads. Vendored, so it is recorded
 *    rather than swept from a call site — and it is one swap that repairs every
 *    table in the registry.
 */
export const RTL: Story = {
  args: FULL_ARGS,
  decorators: [
    (Story) => (
      <RtlDocument>
        <Story />
      </RtlDocument>
    ),
  ],
  play: async ({ canvasElement }) => {
    await expect(document.documentElement.dir).toBe("rtl");

    const at = (selector: string) => canvasElement.querySelector<HTMLElement>(selector)!;
    const header = at('[data-region="header"]');
    const actions = header.querySelector<HTMLElement>("div.ms-auto")!;
    const sortWrap = at('[data-slot="records-shell-sort"]');

    // The swap, asserted from the direction it actually changes. `ms-auto` is
    // `margin-inline-start`, so under RTL the auto margin moves to the right
    // and keeps pushing; `ml-auto` would have pinned it to the left and
    // collapsed the push.
    for (const el of [actions, sortWrap]) {
      await expect(getComputedStyle(el).marginLeft).toBe("0px");
      await expect(parseFloat(getComputedStyle(el).marginRight)).toBeGreaterThan(100);
    }

    // And the geometry that buys: both groups sit at the row's visual left,
    // which under RTL is the end of the line.
    const headerBox = header.getBoundingClientRect();
    await expect(actions.getBoundingClientRect().left - headerBox.left).toBeLessThanOrEqual(12);
    const filterRowBox = at('[data-region="filter-sort"]').getBoundingClientRect();
    await expect(sortWrap.getBoundingClientRect().left - filterRowBox.left).toBeLessThanOrEqual(16);

    // The rest of the header mirrors with the flex row: the trigger is first in
    // DOM order, so under RTL it is the rightmost thing in the bar.
    const trigger = at('[data-slot="sidebar-trigger"]');
    const heading = header.querySelector<HTMLElement>("h1")!;
    await expect(headerBox.right - trigger.getBoundingClientRect().right).toBeLessThanOrEqual(12);
    await expect(heading.getBoundingClientRect().right).toBeLessThan(
      trigger.getBoundingClientRect().right,
    );

    // J1's search chrome is already logical, and this is the positive case:
    // the glyph moves to the start edge and the field's 32px of inline-start
    // padding moves with it.
    const search = at('[data-slot="asset-library-search"]');
    const glyph = search.querySelector<HTMLElement>("svg")!;
    const field = search.querySelector<HTMLInputElement>("input")!;
    await expect(getComputedStyle(field).paddingRight).toBe("32px");
    await expect(getComputedStyle(field).paddingLeft).toBe("10px");
    await expect(search.getBoundingClientRect().right - glyph.getBoundingClientRect().right)
      .toBeLessThanOrEqual(14);
  },
};

/**
 * Under `prefers-reduced-motion: reduce`, which `vitest.config.ts` emulates for
 * every test in this project. The shell animates nothing of its own — no
 * `animate-*` and no `transition-*` anywhere in `records-shell.tsx` — so what
 * this story documents is the motion its composed children own, and the answers
 * split three ways.
 *
 * BRANCHES, and is asserted below:
 *
 * - **J5's running spinner.** `animate-spin motion-reduce:animate-none` on a
 *   plain animation, which is the one place the bare variant works: the words
 *   "Running" stay put with the icon still, so `running` is still
 *   distinguishable from the other three run states.
 * - **J5's row overflow menu.** Base UI popup, so the variant is restated on
 *   both `data-open:` and `data-closed:` halves; a bare `motion-reduce:
 *   animate-none` loses the source-order tie (mechanical fact 3).
 * - **N1's reason popover**, the same restated pair on a different primitive.
 *
 * CANNOT FAIL, and is deliberately not asserted: **the sort listbox.**
 * `components/ui/select.tsx` defaults `alignItemWithTrigger` to `true` and the
 * popup carries `data-[align-trigger=true]:animate-none`, so it computes
 * `animation-name: none` with or without any reduced-motion class. Measured
 * here as `none`; an assertion on it would be green against a component with no
 * branch at all.
 *
 * DOES NOT BRANCH, and is deliberately not asserted: **the vendored sidebar.**
 * `sidebar-gap` carries `transition-[width] duration-200` and
 * `sidebar-container` carries `transition-[left,right,width] duration-200`,
 * both measured at `0.2s` with `matchMedia("(prefers-reduced-motion: reduce)")`
 * true. Pressing this shell's own header trigger therefore slides a 256px panel
 * across the page for 200ms for a user who asked for no motion. O1 measured the
 * same thing; asserting the duration would pin it. The repair is
 * `motion-reduce:transition-none` on both halves of a vendored file, which
 * fixes every shell at once. Note this is a live counter-example to the
 * narrowed wave-7 claim: `sheet.tsx` was the last surface *nothing could
 * reach*, not the last surface that animates.
 */
export const ReducedMotion: Story = {
  args: { ...FULL_ARGS, feedback: { state: "rating", value: "down", onRate: () => {} } },
  play: async ({ canvasElement }) => {
    // An assertion that could not fail is worse than none: prove the emulation
    // is on before reading anything back.
    await expect(window.matchMedia("(prefers-reduced-motion: reduce)").matches).toBe(true);
    const canvas = within(canvasElement);
    const body = within(document.body);

    // 1. J5's spinner — the one plain animation in the tree.
    const spinner = canvasElement.querySelector<HTMLElement>(
      '[data-run-state="running"] [data-slot="record-list-run-status"] svg',
    )!;
    await expect(spinner.classList.contains("animate-spin")).toBe(true);
    await expect(getComputedStyle(spinner).animationName).toBe("none");
    // The words are what carry `running` once the icon stops.
    await expect(canvas.getAllByText("Running").length).toBeGreaterThan(0);

    // 2. N1's reason popover, opened by the `rating` state rather than by a
    //    click, so the read is of the surface and not of the trigger.
    const popover = await waitFor(() => {
      const el = document.querySelector<HTMLElement>('[data-slot="feedback-reason"]');
      if (!el) throw new Error("feedback reason popover did not open");
      return el;
    });
    await expect(getComputedStyle(popover).animationName).toBe("none");

    // 3. J5's row overflow menu.
    await userEvent.click(
      canvas.getByRole("button", { name: "More actions for Daily briefing digest" }),
    );
    const menu = await waitFor(() => {
      const el = document.querySelector<HTMLElement>('[data-slot="dropdown-menu-content"]');
      if (!el) throw new Error("row overflow menu did not open");
      return el;
    });
    await expect(getComputedStyle(menu).animationName).toBe("none");

    // Wait the dismissal out, so axe never measures a half-faded popup — and
    // assert the menu closes rather than stacking under the popover.
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("menu")).toBeNull());
  },
};

/** A filled rail, so `KeyboardOrder` can walk the seam the rail actually makes. */
const NAV: React.ReactNode = (
  <SidebarNav
    activeId="scenarios"
    onSelect={() => {}}
    sections={[
      {
        label: "Workspace",
        items: [
          { id: "scenarios", label: "Scenarios" },
          { id: "connections", label: "Connections" },
        ],
      },
    ]}
  />
);

/**
 * The tab order across the shell's own seams, which is the only part of it the
 * shell decides. With a rail filled by B3 the cycle is 26 stops, measured; the
 * walk below asserts the ten seams the shell is responsible for and tabs
 * through the rest, so a reordering inside either list cannot silently pass.
 *
 * **The rail comes first, not the trigger** — and the docs module's keyboard
 * note has this backwards ("Tab order runs sidebar trigger → rail contents →
 * header actions"). `AppSidebar` is rendered before `SidebarInset` in
 * `records-shell.tsx`, so B3's rows are stops 1..n and the header trigger is
 * the stop after them. With `nav` unset — the shell's default, and what
 * `Scenarios` above renders — the rail holds an L1 empty state with nothing
 * focusable, so the trigger *is* first and the prose reads true by accident.
 * `app-sidebar-rail` is `tabIndex={-1}` in the vendored file, so the rail is a
 * pointer affordance and the trigger is the only keyboard route to collapsing.
 *
 * DEFECT, recorded not pinned: **three of the shell's own top-band stops paint
 * no design-system focus ring.** A5 `filter-bar` gives `filter-chip-toggle`,
 * `add-filter-chip` and `filters-button` no `focus-visible:` treatment at all,
 * so what a keyboard user sees is the user agent's `outline: auto 1px` — which
 * `settledFocusRing` correctly reports as *a* treatment, because it is one, and
 * which no other control in this shell relies on. Every other stop carries a
 * real ring: the trigger and the create button through the vendored `Button`,
 * the sort trigger through `focus-visible:ring-3`, and J1's and J5's names
 * through `focus-visible:ring-2`. The remove X inside an applied chip has a
 * ring while the chip it sits in does not, which is the shape that gives it
 * away. A5's to fix — a call-site `className` reaches `FilterBar`, not the
 * chips inside it.
 *
 * SECOND DEFECT, also recorded: **the scroll region's stop is invisible in the
 * docs and thin on screen.** `record-rows` is a `section` with `tabIndex={0}`,
 * so it is a stop in its own right, and the docs module says it "takes focus
 * without painting anything". Measured, it reads `outline-style: auto` at 1px —
 * the user agent's own ring, coloured by `index.css`'s base-layer
 * `outline-ring/50`. Thin, not absent, which is the fourth instance of that
 * correction in this wave.
 */
export const KeyboardOrder: Story = {
  args: { ...FULL_ARGS, nav: NAV },
  play: async ({ canvasElement }) => {
    const at = (selector: string) => canvasElement.querySelector<HTMLElement>(selector)!;

    // The seam, in DOM order. Each element is queried up front so the
    // differential can read its signature *before* focus arrives — no blur, so
    // nothing disturbs the sequence (J2/J5's form of mechanical fact 5).
    //
    // `houseRing` is the distinction the description draws: true where the
    // design system paints the treatment, false where only the user agent does.
    const stops: { el: HTMLElement; name: string; houseRing: boolean }[] = [
      { el: at('[data-slot="sidebar-nav-item"]'), name: "B3 rail — Scenarios", houseRing: true },
      { el: at('[data-slot="sidebar-trigger"]'), name: "sidebar trigger", houseRing: true },
      { el: at('[data-slot="filter-chip-toggle"]'), name: "A5 chip — Failing", houseRing: false },
      { el: at('[data-slot="filter-chip-remove"]'), name: "A5 chip remove", houseRing: true },
      { el: at('[data-slot="add-filter-chip"]'), name: "A5 add filter", houseRing: false },
      { el: at('[data-slot="filters-button"]'), name: "A5 filters button", houseRing: false },
      { el: at('[data-slot="records-shell-sort-trigger"]'), name: "sort", houseRing: true },
      { el: at('[data-region="record-rows"]'), name: "record region (scroll)", houseRing: false },
      { el: at('[data-slot="asset-library-name"]'), name: "J1 folder — Marketing", houseRing: true },
      { el: at('[data-slot="record-list-title"]'), name: "J5 record — first title", houseRing: true },
    ];

    let reached = 0;
    for (let press = 0; press < 30 && reached < stops.length; press += 1) {
      const target = stops[reached];
      const before = focusTreatmentSignature(target.el);
      await userEvent.tab();
      if (document.activeElement !== target.el) continue;

      // Both checks, because they answer different questions: one asks whether
      // anything is painted, the other whether focus is what painted it.
      await settledFocusRing(target.el, waitFor);
      if (target.houseRing) {
        await expect(focusTreatmentSignature(target.el)).not.toBe(before);
      }
      reached += 1;
    }

    // Named rather than counted, so a regression says which seam moved.
    await expect(stops.slice(reached).map((stop) => stop.name)).toEqual([]);
    // Focus ended on the last named seam, so every earlier one was reached
    // before it and in the order listed.
    await expect(document.activeElement).toBe(stops[stops.length - 1].el);

    // The rail is a pointer affordance only, which is why the trigger is the
    // sole keyboard route to collapsing the sidebar.
    await expect(at('[data-slot="app-sidebar-rail"]')).toHaveAttribute("tabindex", "-1");

    // The header create button is not in the list above because it sits after
    // the trigger and before the chips; asserting it here keeps the seam
    // complete without widening the walk.
    await expect(
      within(canvasElement).getByRole("button", { name: "New scenario" }),
    ).toBeInTheDocument();
  },
};

/**
 * `sort` is the shell's one controlled pair, and it is optional-controlled:
 * hand it a `sort` and the shell stops holding one of its own. The host below
 * pins it to `recent` and only records what it is asked for.
 *
 * Four things follow and all four are asserted. Choosing "Name" does not move
 * the rendered value; `onSortChange` fires with the option's `value` — `"name"`,
 * the string a host stores, not the visible label and not an index; the render
 * counter proves the host really did re-render with an unchanged `sort` in
 * between, so "held" is not "never re-rendered"; and applying the request moves
 * it, which is the only reason to report it rather than swallow it.
 *
 * The second half is the search field, which is a *fully* controlled pair
 * forwarded into J1 — and worth its own assertions because the field belongs to
 * J1 while the value belongs to the shell's caller. Typing is reported and
 * refused by the same route.
 *
 * Worth knowing: the trigger's visible text is the resolved *label* while its
 * accessible name is `sortLabel`. `SelectValue` renders the raw `value` unless
 * it is given children, so a shell that forgot to resolve the label would show
 * `recent` here; the shell resolves it from `sortOptions`, and this story is
 * where that stays true.
 */
function ControlledHost() {
  const [requested, setRequested] = React.useState<string | null>(null);
  const [applied, setApplied] = React.useState("recent");
  const [search, setSearch] = React.useState("Northwind");
  const [typed, setTyped] = React.useState<string | null>(null);
  const passes = React.useRef(0);
  passes.current += 1;

  return (
    <div className="h-svh w-full">
      <RecordsShell
        {...FULL_ARGS}
        sort={applied}
        onSortChange={setRequested}
        search={search}
        onSearchChange={setTyped}
        headerActions={
          <>
            <span data-testid="requested" className="sr-only">
              {requested ?? "none"}
            </span>
            <span data-testid="typed" className="sr-only">
              {typed ?? "none"}
            </span>
            <span data-testid="render-pass" className="sr-only">
              {passes.current}
            </span>
            <button
              type="button"
              data-testid="apply"
              className="rounded-md border px-2 py-1 text-xs"
              onClick={() => {
                if (requested) setApplied(requested);
                if (typed !== null) setSearch(typed);
              }}
            >
              Apply request
            </button>
          </>
        }
      />
    </div>
  );
}

export const Controlled: Story = {
  render: () => <ControlledHost />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);
    const trigger = canvasElement.querySelector<HTMLElement>(
      '[data-slot="records-shell-sort-trigger"]',
    )!;

    // The label is resolved, not the raw value.
    await expect(trigger).toHaveTextContent("Last run");
    await expect(trigger).toHaveAccessibleName("Sort by");
    const passBefore = Number(canvas.getByTestId("render-pass").textContent);

    // 1. Interaction alone does not move the rendered value.
    await userEvent.click(trigger);
    const option = await waitFor(() => body.getByRole("option", { name: "Name" }));

    // The listbox is named while it is open, and this assertion is the only
    // thing that keeps it named. Base UI puts `role="listbox"` on the `List`
    // inside the popup; every `SelectContent` in the registry was an unnamed
    // listbox until H1 opened one in a story, and this was the last but one
    // still unnamed. Measured here: axe 4.12 raises **nothing** on this popup
    // with the name stripped at runtime — the rule is configuration-dependent
    // (CONTINUE.md §8) and did not fire in this shape, so the gate would not
    // have caught a revert. An unnamed listbox is wrong either way.
    await expect(body.getByRole("listbox")).toHaveAccessibleName("Sort by");

    await userEvent.click(option);
    // Leave nothing mid-dismissal for axe, and prove choosing closes the popup.
    await waitFor(() => expect(body.queryByRole("listbox")).toBeNull());
    await expect(trigger).toHaveTextContent("Last run");

    // 2. The callback fired with the payload a host needs to apply it.
    await expect(canvas.getByTestId("requested")).toHaveTextContent("name");

    // 3. That report re-rendered the host with an unchanged `sort`, and the
    //    shell held. The counter is what makes "held" mean something.
    await expect(Number(canvas.getByTestId("render-pass").textContent)).toBeGreaterThan(passBefore);

    // 4. And the payload was sufficient to apply the change.
    await userEvent.click(canvas.getByTestId("apply"));
    await expect(trigger).toHaveTextContent("Name");

    // The search half. J1 renders the field; the shell's caller holds it.
    const field = canvasElement.querySelector<HTMLInputElement>('input[type="search"]')!;
    await expect(field).toHaveValue("Northwind");
    await userEvent.type(field, "!");
    await expect(field).toHaveValue("Northwind");
    await expect(canvas.getByTestId("typed")).toHaveTextContent("Northwind!");
  },
};

/**
 * The five text slots a caller can empty without producing an axe failure,
 * emptied at once. Nothing here fails the gate, and that is the finding: **an
 * empty string deletes structure in silence, and deletes an accessible name in
 * silence too.**
 *
 * Measured on this story:
 *
 * - **`searchPlaceholder=""` leaves the search field with no accessible name at
 *   all, and axe raises nothing.** J1's only label is an `sr-only` `<label
 *   for>`, and emptying the placeholder empties the label with it. The element
 *   is still a `searchbox`; querying by role with a non-empty name finds none.
 *   The J wave recorded this same shape on J1 directly as "a red gate" — in
 *   this composition, on axe 4.12, it is not: the label element exists and is
 *   associated, and that is what the rule checks. Both are measurements, the
 *   defect is identical, and the second one is worse precisely because nothing
 *   catches it.
 * - **`recordsLabel=""` unnames the record table.** It reaches J5's `sr-only`
 *   `<caption>`, and a caption is the table's whole accessible name.
 * - **`foldersLabel=""` empties A12 `section-header`'s title span**, which is a
 *   `<span>` rather than a heading, so nothing announces the folder table's
 *   purpose and nothing fails.
 * - **`addFilterLabel=""` degrades a name rather than deleting it.** A5 builds
 *   `Add ${children}`, so the control announces as `"Add "` — present, useless,
 *   and invisible to every naming rule.
 *
 * NOT RENDERED HERE, BECAUSE RENDERING THEM FAILS THE BUILD. Four more slots
 * take an empty string and produce real axe violations, which makes them worth
 * naming and not worth pinning:
 *
 * - `createLabel=""` → the header button is left with an `aria-hidden` `Plus`
 *   and nothing else: `button-name`.
 * - `filtersLabel=""` → A5's `FiltersButton` renders `{children ?? "Filters"}`,
 *   and `""` is not nullish, so its default never fires: `button-name`.
 * - `sortLabel=""` → the trigger's `aria-label` and its `SelectValue` fallback
 *   are the same string: `button-name` on a `role="combobox"`.
 * - `title=""` → `empty-heading` on the `<h1>`, and the record region's
 *   `aria-labelledby` then points at an empty element, so the only landmark on
 *   the page stops having a name. O1 emptied the equivalent slot with no
 *   failure because B7 renders its title as a `<span>`; an `<h1>` is what makes
 *   this one red.
 *
 * The fix is one decision for all nine: fall back to the shell's defaults on an
 * empty string rather than only on `undefined`. That is an API decision, so it
 * is recorded rather than taken in-wave.
 */
export const EmptyLabel: Story = {
  args: {
    ...FULL_ARGS,
    recordsLabel: "",
    foldersLabel: "",
    searchPlaceholder: "",
    addFilterLabel: "",
    feedback: { state: "idle", onRate: () => {}, onSubmit: () => {} },
    feedbackCaption: "",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // The search box exists and has no name. Both halves matter: the first
    // proves the field is still there, the second that nothing announces it.
    await expect(canvas.getAllByRole("searchbox")).toHaveLength(1);
    await expect(canvas.queryAllByRole("searchbox", { name: /\S/ })).toHaveLength(0);
    const field = canvasElement.querySelector<HTMLInputElement>('input[type="search"]')!;
    const label = canvasElement.querySelector<HTMLElement>(`label[for="${field.id}"]`)!;
    await expect(label).toBeInTheDocument();
    await expect(label).toBeEmptyDOMElement();

    // The record table loses its caption, and with it its name.
    await expect(canvasElement.querySelector("caption")).toBeEmptyDOMElement();
    await expect(canvas.queryAllByRole("table", { name: /\S/ })).toHaveLength(0);

    // A12's title span survives as an empty box — it is a span, so there is no
    // heading rule to catch it.
    await expect(
      canvasElement.querySelector<HTMLElement>('[data-slot="section-header-title"]'),
    ).toBeEmptyDOMElement();

    // The one slot that degrades instead of disappearing.
    await expect(canvasElement.querySelector('[data-slot="add-filter-chip"]')).toHaveAttribute(
      "aria-label",
      "Add ",
    );

    // `title` is untouched here, so the record region keeps the name that makes
    // it a landmark — the contrast with the four slots named in the docstring.
    await expect(canvas.getAllByRole("region", { name: "Scenarios" })).toHaveLength(1);
  },
};

/**
 * Author-supplied text at ~90 characters in every slot that takes it, and four
 * different decisions come back — which is why they are rendered together
 * rather than one at a time. Measured at 1200px:
 *
 * - **The page heading truncates.** 778px of list name in a 745px box, ellipsis
 *   fired. It is `min-w-0 truncate` in a flex row whose action group is
 *   `shrink-0`, so the `<h1>` yields first and the create button never leaves
 *   the bar. It carries no `title` attribute, so the full name is unrecoverable
 *   for a pointer user — the same missing-`title` shape wave 1 recorded on D3
 *   `context-chips` and O1 on A12.
 * - **J5's record title truncates, at whatever width the table gives it.**
 *   678px of title inside a 524px button, ellipsis fired, also with no `title`.
 *   Worth knowing why that number is not 320: the cell declares `max-w-xs`, and
 *   under `table-layout: auto` a cell's max-width is advisory, so the column is
 *   as wide as the table can afford and no wider. The truncation is real; the
 *   declared bound is not what produces it.
 * - **J1's folder name does not truncate — it overruns the next column.** The
 *   name is a `<button>` whose `width: auto` is shrink-to-fit even at `display:
 *   flex`, so the inner `truncate` span is never constrained: the button is
 *   563px wide inside a 485px cell — 78px of folder name across the Type
 *   column — and reports `scrollWidth === clientWidth`, so nothing sees it as
 *   overflowing. This is J1's own defect, measured by the J wave at 832px and
 *   confirmed here one composition up; asserted below as what it is, not as
 *   what it should be.
 * - **A long filter label makes a wide chip and wraps the row.** A5 sets no
 *   max-width on a chip, so a 61-character label produces a 438px chip; the
 *   `flex-wrap` on `filter-bar` is what keeps it from pushing the sort control
 *   off the end. The shell's own feedback caption behaves the same way — its
 *   row is `flex-wrap`, so a long question moves N1's thumbs to a second line
 *   rather than squeezing them.
 *
 * Nothing above turns the page into a horizontal scroller: both table
 * containers report `920/920` and the record region `944/944`.
 */
export const LongContent: Story = {
  args: {
    ...FULL_ARGS,
    title:
      "Scenarios that touch the Northwind billing pipeline and every downstream report it feeds each morning",
    folders: [
      {
        id: "marketing",
        name: "Marketing — campaign automations, newsletter sends and every UTM rewrite rule",
        count: 12,
        modified: "2 days ago",
      },
      ...FOLDERS!.slice(1),
    ],
    records: [
      {
        ...RECORDS![0],
        title:
          "Daily briefing digest — Gmail, Notion and Slack rolled into one 7am summary for the leadership channel",
      },
      ...RECORDS!.slice(1),
    ],
    filters: [
      {
        id: "failing",
        label: "Failing in the last 24 hours across every connected workspace",
        active: true,
        onToggle: () => {},
        onRemove: () => {},
      },
    ],
    feedback: { state: "idle", onRate: () => {}, onSubmit: () => {} },
    feedbackCaption:
      "Is this list telling you what you need to know about the automations you own right now?",
  },
  play: async ({ canvasElement }) => {
    const at = (selector: string) => canvasElement.querySelector<HTMLElement>(selector)!;

    // 1. The heading truncates rather than wrapping, the ellipsis actually
    //    fires, and nothing carries the full string to a pointer.
    const heading = at('[data-region="header"] h1');
    const headingStyle = getComputedStyle(heading);
    await expect(headingStyle.whiteSpace).toBe("nowrap");
    await expect(headingStyle.textOverflow).toBe("ellipsis");
    await expect(heading.scrollWidth).toBeGreaterThan(heading.clientWidth);
    await expect(heading).not.toHaveAttribute("title");
    // It yields before the action group does — the create button keeps its size
    // and stays inside the bar rather than being pushed off the end.
    const actions = at('[data-region="header"] div.ms-auto');
    await expect(actions.scrollWidth).toBeLessThanOrEqual(actions.clientWidth + 1);
    await expect(actions.getBoundingClientRect().right).toBeLessThanOrEqual(
      at('[data-region="header"]').getBoundingClientRect().right + 1,
    );

    // 2. J5's title clips, and the ellipsis actually fires.
    const recordTitle = at('[data-slot="record-list-title"]');
    await expect(getComputedStyle(recordTitle).textOverflow).toBe("ellipsis");
    await expect(recordTitle.scrollWidth).toBeGreaterThan(recordTitle.clientWidth);
    await expect(recordTitle).not.toHaveAttribute("title");

    // 3. J1's folder name does not. Asserted as measured, with the defect named
    //    in the description rather than pinned as correct: the button overruns
    //    its own cell and reports no overflow while doing it.
    const folderName = at('[data-slot="asset-library-name"]');
    const cell = folderName.closest("td")!;
    await expect(folderName.scrollWidth).toBe(folderName.clientWidth);
    await expect(folderName.getBoundingClientRect().width).toBeGreaterThan(
      cell.getBoundingClientRect().width,
    );

    // 4. The chip is wide and the row wraps rather than overflowing. Same for
    //    the feedback caption's row, which is the shell's own markup.
    const bar = at('[data-slot="filter-bar"]');
    await expect(getComputedStyle(bar).flexWrap).toBe("wrap");
    const row = at('[data-region="filter-sort"]');
    await expect(row.scrollWidth).toBeLessThanOrEqual(row.clientWidth + 1);
    const feedbackRow = at('[data-slot="records-shell-feedback"]');
    await expect(getComputedStyle(feedbackRow).flexWrap).toBe("wrap");
    await expect(feedbackRow.scrollWidth).toBeLessThanOrEqual(feedbackRow.clientWidth + 1);

    // Nothing here made the page scroll sideways.
    const region = at('[data-region="record-rows"]');
    await expect(region.scrollWidth).toBeLessThanOrEqual(region.clientWidth + 1);
    for (const container of canvasElement.querySelectorAll<HTMLElement>(
      '[data-slot="table-container"]',
    )) {
      await expect(container.scrollWidth).toBeLessThanOrEqual(container.clientWidth + 1);
    }
  },
};

/**
 * 375×812, moved with `page.viewport` rather than with a width wrapper — and
 * for a family O shell that is the difference between a story and a decoration.
 * B1's drawer swap keys on a viewport media query, so a 375px wrapper renders
 * the full desktop rail inside a narrow box and reports success. Moving the
 * real viewport shows what a phone gets: `window.innerWidth` 375,
 * `(max-width: 767px)` true, and **no `[data-slot="app-sidebar"]` in the
 * document at all** until the header trigger opens it as a sheet.
 *
 * The shell holds at page level: 375/375 on the root, on all four regions and
 * on the document. What does not hold is inside one of them.
 *
 * **The record table becomes a horizontal scroller and the folder table does
 * not.** J5's four columns need 392px in a 351px container — 41px of overflow,
 * absorbed by the vendored `Table`'s own `overflow-x-auto` wrapper, so the page
 * stays put and the Enabled and Actions columns move off-screen. J1's five
 * columns fit in the same 351px because its cells are short strings. That is
 * the honest shape of this shell on a phone: the primary control — the enable
 * toggle, the whole reason the spec puts it in the row — is behind a sideways
 * scroll. It is reachable by keyboard, because the row's own controls are tab
 * stops and focusing one scrolls it into view, so this is a pointer-and-glance
 * problem rather than an unreachable one. The fix is a narrow layout in J5
 * (a stacked card below `sm`), which is J5's to make.
 *
 * **The drawer no longer animates under reduced motion**, and this is the story
 * that can see it: `sheet.tsx` was fixed centrally in this wave after O2 caught
 * it, and the guard reads `transition-property` rather than duration, because
 * the fix does not change the duration — 0.2s stays 0.2s after a revert.
 */
export const Mobile: Story = {
  args: FULL_ARGS,
  play: async ({ canvasElement }) => {
    // Dynamic, inside the play: `vitest/browser` throws on evaluation outside
    // Browser Mode, so a top-level import takes the whole story file down in a
    // built Storybook. See the wave brief §2b.
    const { page } = await import("vitest/browser");
    await page.viewport(375, 812);

    // The breakpoint really moved — the claim a width wrapper cannot make.
    await waitFor(() => expect(window.innerWidth).toBe(375));
    await expect(window.matchMedia("(max-width: 767px)").matches).toBe(true);
    await waitFor(() =>
      expect(canvasElement.querySelector('[data-slot="app-sidebar"]')).toBeNull(),
    );

    // Every region is still mounted — that is the block contract — and none of
    // them scrolls sideways.
    const shell = canvasElement.querySelector<HTMLElement>('[data-slot="records-shell"]')!;
    for (const id of ["sidebar", "header", "filter-sort", "record-rows"]) {
      const region = canvasElement.querySelector<HTMLElement>(`[data-region="${id}"]`);
      await expect(region).not.toBeNull();
    }
    for (const el of [shell, document.documentElement]) {
      await expect(el.scrollWidth).toBeLessThanOrEqual(el.clientWidth);
    }
    for (const id of ["header", "filter-sort", "record-rows"]) {
      const region = canvasElement.querySelector<HTMLElement>(`[data-region="${id}"]`)!;
      await expect(region.scrollWidth).toBeLessThanOrEqual(region.clientWidth);
      await expect(Math.round(region.getBoundingClientRect().width)).toBe(375);
    }

    // The record table is a sideways scroller and the folder table is not.
    // Measured, and named in the description as J5's gap rather than pinned as
    // the right answer.
    const containers = Array.from(
      canvasElement.querySelectorAll<HTMLElement>('[data-slot="table-container"]'),
    );
    await expect(containers).toHaveLength(2);
    await expect(containers[0].scrollWidth).toBe(containers[0].clientWidth);
    await expect(containers[1].scrollWidth).toBeGreaterThan(containers[1].clientWidth);
    await expect(getComputedStyle(containers[1]).overflowX).toBe("auto");

    // The trigger is the only route to the rail, and it brings the nav with it.
    await userEvent.click(within(canvasElement).getByRole("button", { name: "Toggle Sidebar" }));
    const drawer = await waitFor(() => {
      const el = document.querySelector<HTMLElement>('[data-slot="sidebar"][data-mobile="true"]');
      if (!el) throw new Error("mobile drawer did not open");
      return el;
    });
    const overlay = document.querySelector<HTMLElement>('[data-slot="sheet-overlay"]')!;

    // The central `sheet.tsx` fix, guarded on the property list rather than the
    // duration: the duration is unchanged by the fix and would pass a revert.
    await expect(getComputedStyle(drawer).transitionProperty).toBe("none");
    await expect(getComputedStyle(overlay).transitionProperty).toBe("none");

    // Leave nothing mid-transition for axe: the drawer stays open and settled.
    await waitFor(() => expect(getComputedStyle(drawer).animationName).toBe("none"));
  },
};

/**
 * O10's nearest twin is O7 `library-shell`, and the spec says so in one line:
 * "Distinct from O7 because the objects are runnable rather than stored — the
 * same list layout would mislead."
 *
 * The choosing rule is what the objects *do* when you are not looking. **A
 * record runs; an asset sits.** Everything else follows from that. O10 puts an
 * enable toggle in every row, because the first question you arrive with is "is
 * this on?"; it puts the run status in the subtitle beside the timestamp,
 * because "last run failed" and "two hours ago" are one sentence; and it has no
 * grid view, no thumbnails and no bulk-selection mode, because every affordance
 * that makes a wall of images pleasant makes a list of live automations
 * ambiguous. O7 is the mirror image: a dense grid you scan by recognition,
 * counted facets so a filter is not a gamble, a lightbox that opens on
 * provenance, and select mode with a bulk bar — none of which answers whether
 * anything is running.
 *
 * The tell in one sentence: **a switch in the row means the object executes; a
 * thumbnail means it does not.** The second tell is the empty state — O10's
 * says "records are the things this workspace runs", because a list you cannot
 * yet see still has to tell you what would go in it.
 *
 * WHY THE NEIGHBOUR IS NOT RENDERED BESIDE IT. Two family O shells cannot share
 * a document: this one's `SidebarInset` renders a `<main>`, and a second shell
 * in the same canvas is a duplicate landmark that axe fails outright
 * (`landmark-no-duplicate-main`, measured by O1 and O6 in this wave). Nothing
 * at a call site can reach it — `SidebarInset` is vendored and takes no
 * `render` prop — and the two ways round it are worse than the problem:
 * suppressing the rule per story widens the a11y exclusion, and `inert`ing one
 * shell trades a duplicate landmark for focusable content inside `aria-hidden`.
 * So the boundary is not a layout a page can hedge on. **A shell is the page.**
 * You pick one per route, and the way to compare them is to open them one after
 * the other, which is what this story does at full bleed with the tells
 * asserted on the shell itself.
 */
export const Boundary: Story = {
  args: { ...FULL_ARGS, title: "Northwind — scenarios" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // 1. Exactly one `main`. This is what makes "a shell is the page" a
    //    measurable claim rather than an aesthetic one.
    await expect(canvasElement.querySelectorAll("main")).toHaveLength(1);

    // 2. Every record carries the switch, and every switch is named after the
    //    record it enables — the affordance O7 has no equivalent of.
    const toggles = canvasElement.querySelectorAll('[data-slot="record-list-toggle"]');
    await expect(toggles).toHaveLength(RECORDS!.length);
    const names = Array.from(toggles).map((el) => el.getAttribute("aria-label"));
    await expect(new Set(names).size).toBe(RECORDS!.length);
    await expect(names).toContain("Enable Daily briefing digest");

    // 3. Run status is in the subtitle, in words, beside the time.
    const status = canvasElement.querySelector<HTMLElement>(
      '[data-run-state="failed"] [data-slot="record-list-run-status"]',
    )!;
    await expect(status).toHaveTextContent("Last run failed");
    await expect(status.closest('[data-slot="record-list-subtitle"]')).toHaveTextContent(
      "Last run 2 hours ago",
    );

    // 4. No grid, no thumbnails, no bulk selection. J1's view switch is
    //    suppressed with `display: none`, which is what takes it out of the tab
    //    order and the accessibility tree rather than merely hiding it.
    const viewToggle = canvasElement.querySelector<HTMLElement>(
      '[data-slot="asset-library-view-toggle"]',
    )!;
    await expect(getComputedStyle(viewToggle).display).toBe("none");
    await expect(canvasElement.querySelector('[data-slot="asset-library-grid"]')).toBeNull();
    await expect(canvas.queryAllByRole("checkbox")).toHaveLength(0);

    // 5. Folders sit above the records in one scroll container, which is J1's
    //    own "one table" ordering rule applied a level up.
    const region = canvasElement.querySelector<HTMLElement>('[data-region="record-rows"]')!;
    await expect(region.firstElementChild).toHaveAttribute("data-slot", "asset-library");
  },
};
