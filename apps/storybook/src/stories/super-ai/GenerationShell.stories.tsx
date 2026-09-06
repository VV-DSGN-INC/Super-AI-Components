import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";

import { expect, userEvent, waitFor } from "storybook/test";

import { GenerationPanel } from "@/registry/super-ai/generation-panel";
import { GenerationShell, type GenerationShellProps } from "@/registry/super-ai/generation-shell";
import { ParameterSlider } from "@/registry/super-ai/parameter-panel";
import { RunButton } from "@/registry/super-ai/run-button";
import { GenerationShellDocs } from "@/content/components/generation-shell.docs";
import { componentDocsPage } from "@/lib/component-docs-page";
import { focusTreatmentSignature, hasVisibleFocusRing, settledFocusRing } from "@/lib/focus-ring";

const PRESETS = [
  { id: "cinematic", label: "Cinematic" },
  { id: "anime", label: "Anime" },
  { id: "claymation", label: "Claymation" },
  { id: "watercolour", label: "Watercolour" },
  { id: "noir", label: "Film noir" },
  { id: "isometric", label: "Isometric" },
];

const MODELS: GenerationShellProps["models"] = [
  {
    id: "veo",
    name: "Veo 3.1",
    group: "Text → video",
    description: "Best motion coherence. 8s at 1080p.",
    runtime: "cloud",
    price: 55,
    priceUnit: "credits",
    capabilities: ["1080p", "Audio"],
  },
  {
    id: "wan",
    name: "Wan 2.2",
    group: "Text → video",
    description: "Runs on your own GPU. Slower, free.",
    runtime: "local",
    hardware: "16 GB VRAM",
    capabilities: ["720p"],
  },
];

const PARAMETERS = (
  <ParameterSlider
    label="Motion"
    value={60}
    defaultValue={60}
    onValueChange={() => {}}
    endpoints={["Held still", "Constant movement"]}
    description="How much the camera and subject move over the clip."
  />
);

const EXAMPLE_PAIR: GenerationShellProps["examplePair"] = {
  before: {
    content: (
      <div className="bg-secondary text-secondary-foreground flex aspect-video items-center justify-center text-xs font-medium">
        Flat still
      </div>
    ),
    label: "Your photo",
  },
  after: {
    content: (
      <div className="bg-primary text-primary-foreground flex aspect-video items-center justify-center text-xs font-medium">
        8s of motion
      </div>
    ),
    label: "Generated clip",
  },
  caption: "A lighthouse at dusk, slow push in · Cinematic · Veo 3.1",
};

const RESULTS: GenerationShellProps["results"] = [
  { id: "r1", state: "done", label: "A lighthouse at dusk, slow push in" },
  { id: "r2", state: "done", label: "A lighthouse at dusk, static wide" },
  { id: "r3", state: "done", label: "A lighthouse at dawn" },
  { id: "r4", state: "done", label: "A lighthouse in fog" },
];

const FULL_ARGS: GenerationShellProps = {
  title: "Video generator",
  topbar: { privacy: { label: "Private" } },
  balance: 414,
  creditsTotal: 1000,
  credits: { onManage: () => {} },
  panel: {
    directions: "A lighthouse at dusk, slow push in",
    onDirectionsChange: () => {},
    directionsPlaceholder: "Describe the shot…",
  },
  presets: PRESETS,
  presetValue: "cinematic",
  onPresetChange: () => {},
  presetVisibleCount: 4,
  models: MODELS,
  modelId: "veo",
  onModelChange: () => {},
  parameters: PARAMETERS,
  onResetParameters: () => {},
  cost: 55,
  run: { state: "idle", onRun: () => {} },
  results: RESULTS,
  examplePair: EXAMPLE_PAIR,
};

const meta: Meta<typeof GenerationShell> = {
  title: "Super AI/Generation Shell",
  component: GenerationShell,
  // A block is a page, so it gets the whole canvas rather than a centred box.
  // The `h-svh` wrapper is what the shell's `h-full` measures against — in a
  // real app that is the document, here it is the story frame.
  parameters: { layout: "fullscreen", docs: { page: componentDocsPage(GenerationShellDocs) } },
  decorators: [
    (Story) => (
      <div className="h-svh w-full">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof GenerationShell>;

/** The working tool: a configured panel, a quoted price, and four results. */
export const Tool: Story = { args: FULL_ARGS };

/**
 * Day one. Nothing generated, so the whole right pane is L1's before → after
 * pair — the version most new users actually see, and the only thing on screen
 * that says what this tool does. Mandatory export for the block contract.
 *
 * The play measures the override that makes it readable. F2 keeps its columns
 * when it is empty and puts the empty affordance in the first cell, which is
 * right for a library and wrong for the one pane that has to teach the tool: at
 * 1200px the grid is four tracks of 180px, so an unwidened before → after pair
 * would be 180px across. `EMPTY_SPANS_THE_CANVAS` widens only that cell
 * (`grid-column: 1 / -1`, measured 768px against a 768px grid) and leaves the
 * tracks alone, so a resolved grid is untouched. That override exists because
 * **F2 has no full-width empty mode** — still true, re-checked against
 * `generation-grid.tsx` this wave, and the only reason this pane works.
 */
export const Empty: Story = {
  args: {
    ...FULL_ARGS,
    panel: { directions: "", onDirectionsChange: () => {}, directionsPlaceholder: "Describe the shot…" },
    presetValue: undefined,
    results: [],
  },
  play: async ({ canvasElement }) => {
    const shell = shellRoot(canvasElement);
    const grid = shell.querySelector<HTMLElement>('[data-slot="generation-grid-grid"]')!;
    const cell = shell.querySelector<HTMLElement>('[data-slot="generation-grid-empty"]')!;

    // The grid still columns — the override widens the cell, not the layout.
    await expect(getComputedStyle(grid).gridTemplateColumns.split(" ")).toHaveLength(4);
    await expect(getComputedStyle(cell).gridColumn).toBe("1 / -1");
    await expect(Math.round(cell.getBoundingClientRect().width)).toBe(
      Math.round(grid.getBoundingClientRect().width),
    );

    // And it is L1 at page size carrying the pair, not a caption.
    const empty = shell.querySelector<HTMLElement>('[data-slot="empty-state"]')!;
    await expect(empty.getAttribute("data-size")).toBe("page");
    await expect(empty.textContent).toContain("Flat still");
  },
};

/**
 * Narrow viewport. The two panes stack, and the config column stays
 * height-bounded so cost + Generate is still pinned below its own scroll
 * rather than falling to the bottom of the page. Mandatory export for the
 * block contract — a shell is a layout, and layout is what breaks.
 *
 * `globals.viewport.value` is the Storybook 9 API;
 * `parameters.viewport.defaultViewport` was removed in 9 and does nothing
 * while looking configured. `options` is declared explicitly so the selection
 * cannot silently resolve to nothing.
 *
 * KNOWN LIMIT: this resizes the canvas in the Storybook UI only. The vitest
 * runner behind `pnpm test:stories` has no manager to resize an iframe, so it
 * renders and axe-checks this story at the browser's default width.
 *
 * That limit is now covered elsewhere rather than merely admitted: `Mobile`
 * below calls `page.viewport(375, 812)`, which resizes the iframe itself and
 * therefore moves the media queries this shell's layout keys on. This story
 * stays because the block contract requires the export and because it is what a
 * reader browsing Storybook reaches for; `Mobile` is what holds the claim.
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

/** A run in flight: E5 draws its progress and offers Cancel, results stream into F2. */
export const Generating: Story = {
  args: {
    ...FULL_ARGS,
    run: { state: "running", progress: 62, runningLabel: "Generating…", onCancel: () => {} },
    results: [
      { id: "r1", state: "streaming", progress: 62, label: "A lighthouse at dusk, slow push in" },
      { id: "r2", state: "queued", label: "A lighthouse at dusk, static wide" },
      { id: "r3", state: "queued", label: "A lighthouse at dawn" },
      { id: "r4", state: "queued", label: "A lighthouse in fog" },
    ],
  },
};

/**
 * The handoff the cost contract exists for: A2 still quotes the price, M2 shows
 * the balance that cannot cover it, and E5 swaps Generate for Add credits with
 * the shortfall spelled out from the same two numbers.
 */
export const InsufficientCredits: Story = {
  args: {
    ...FULL_ARGS,
    balance: 12,
    run: { state: "insufficient-credits", onBuyCredits: () => {} },
    results: [],
  },
};

/** Select mode: F1's hover actions give way to checkboxes and F2's bulk bar. */
export const SelectMode: Story = {
  args: {
    ...FULL_ARGS,
    selectMode: true,
    selectedResultIds: ["r1", "r2"],
    onSelectionChange: () => {},
    bulkActions: <span className="text-foreground text-xs">Download · Delete</span>,
  },
};

/* ---------------------------------------------------------------------------
 * Case stories — the situations this shell meets as a product, as opposed to
 * the configurations above. See docs/design-system/story-conventions.md.
 *
 * All eight are true, so there are no `case-skip` lines. That follows from the
 * shape rather than from diligence: a full-page layout with a left/right split
 * (RTL), two composed reduced-motion branches (ReducedMotion), twelve tab stops
 * across five composed components (KeyboardOrder), four value/onChange pairs and
 * no state of its own (Controlled), five optional text slots (EmptyLabel), five
 * author-supplied ones (LongContent), a breakpoint it actually swaps on
 * (Mobile), and the component it is most often mistaken for sitting one layer
 * below it (Boundary).
 *
 * Nothing here opens the model picker's popup. E2's `SelectContent` is one of
 * the two left in the registry with no `aria-label` (CONTINUE.md §8, M/N wave),
 * so its listbox is unnamed and opening it puts an `aria-input-field-name`
 * failure into this file for a defect that belongs to E2's.
 * ------------------------------------------------------------------------- */

/** The prompt a video tool actually receives — 83 characters, author-supplied. */
const LONG_PROMPT = "A lighthouse at dusk, slow push in, gulls circling, fog rolling off the black water";

/** Puts `dir` on the document, not on a wrapper. A shell is the page, and the
 *  wrapper form cannot reach a portal (story-conventions.md, fact 5). */
function rtlDocument(Story: React.ComponentType) {
  React.useEffect(() => {
    document.documentElement.setAttribute("dir", "rtl");
    return () => document.documentElement.removeAttribute("dir");
  }, []);
  return <Story />;
}

const region = (root: HTMLElement, id: string) => root.querySelector<HTMLElement>(`[data-region="${id}"]`)!;

const shellRoot = (canvasElement: HTMLElement) =>
  canvasElement.querySelector<HTMLElement>('[data-slot="generation-shell"]')!;

/**
 * Right-to-left, on the document rather than on a wrapper.
 *
 * The layout mirrors for free and this story is the record of why: the shell's
 * own source contains no physical direction class at all — the split is
 * `md:flex-row` plus `justify-between`, both of which resolve against the
 * writing direction. Measured at 1200px: the config panel moves from x=16..400
 * to x=800..1184 and the canvas from x=416..1184 to x=16..784, and inside the
 * pinned row the price moves to the trailing edge (1069..1160) with Generate at
 * the leading one (816..899). A2 pins its own digits `dir="ltr"`, so "55
 * credits" keeps its order inside the mirrored run.
 *
 * Two composed defects survive here, both belonging to other files:
 *
 * - The vendored `components/ui/select.tsx` gives `SelectValue` a physical
 *   `text-left`, so E2's trigger reads `text-align: left` inside a right-aligned
 *   panel. Sixth file in the vendored `text-left` collection (CONTINUE.md §8,
 *   M/N wave) and the first measurement of it inside a shell.
 * - M2's Top up control keeps its divider on its physical left (`border-l pl-1.5
 *   -mr-1`), so under RTL the rule falls on the pill's outer edge and the two
 *   controls have no separator between them. Recorded on M2's own `RTL` story;
 *   this fixture passes `onTopUp` so the shell renders the configuration where
 *   it bites — a tool that quotes a price wants a top-up route beside the
 *   balance. Neither is asserted, because neither is this file's to repair.
 */
export const RTL: Story = {
  args: { ...FULL_ARGS, credits: { onManage: () => {}, onTopUp: () => {} } },
  decorators: [rtlDocument],
  play: async ({ canvasElement }) => {
    const shell = shellRoot(canvasElement);
    await expect(getComputedStyle(shell).direction).toBe("rtl");

    // Mirrored, not merely reordered: config is DOM-first and paints right.
    const config = region(shell, "config-panel").getBoundingClientRect();
    const canvas = region(shell, "result-canvas").getBoundingClientRect();
    await expect(config.left).toBeGreaterThan(canvas.right);

    // The one row the spec refuses to let come apart, mirrored as a unit.
    const chip = shell.querySelector<HTMLElement>('[data-slot="cost-chip"]')!;
    const generate = shell.querySelector<HTMLElement>('[data-slot="run-button-trigger"]')!;
    await expect(chip.getBoundingClientRect().left).toBeGreaterThan(generate.getBoundingClientRect().right);
    const costRow = region(shell, "cost-generate").getBoundingClientRect();
    await expect(chip.getBoundingClientRect().right).toBeLessThanOrEqual(Math.ceil(costRow.right));

    // Digits do not mirror: A2 pins the amount `dir="ltr"` itself.
    const amount = shell.querySelector<HTMLElement>('[data-slot="cost-chip-amount"]')!;
    await expect(getComputedStyle(amount).direction).toBe("ltr");
  },
};

/**
 * `prefers-reduced-motion: reduce`, which `vitest.config.ts` emulates for every
 * test in this project.
 *
 * The shell animates nothing itself. Two of its composed children do, and both
 * already branch, so this story is a regression guard on the branch rather than
 * a report of a missing one: E1's stage chevron (`transition-transform
 * motion-reduce:transition-none`) and E5's progress fill (`transition-[width]
 * motion-reduce:transition-none`). Both read `transition-property: none` here;
 * against the bare classes each reads `transform` and `width`.
 *
 * The percentage still arrives — E5's fill is width-driven, so suppressing the
 * glide snaps it to each value instead of removing it. That is the distinction
 * K5 `source-panel` failed: there, stopping an indeterminate pulse left a solid
 * 100% bar under "Step 1 of 3" and a stalled import read as finished.
 *
 * E4's collapse does not reach here either, and that is worth recording because
 * the ingredients are present. A8 paints `loading` and `failed` on the same
 * `bg-muted`, and F2's grid is full of A8 tiles — but F1 gives every state a
 * text status (`role="status"`, "Queued" / "Generating, 62%" / "Generation
 * failed") and draws visible words plus an icon in `failed`, so suppressing the
 * pulse removes a signal that was never the only one. E4 passes A8 no `action`
 * node, which is exactly the difference.
 *
 * Not covered: E2's popup, which carries the restated
 * `motion-reduce:data-open:animate-none` pair. Opening it would fail axe on the
 * unnamed listbox, so the pair is checked by E2's own story.
 */
export const ReducedMotion: Story = {
  args: {
    ...FULL_ARGS,
    run: { state: "running", progress: 62, runningLabel: "Generating…", onCancel: () => {} },
    results: [
      { id: "r1", state: "streaming", progress: 62, label: "A lighthouse at dusk, slow push in" },
      { id: "r2", state: "queued", label: "A lighthouse at dusk, static wide" },
    ],
  },
  play: async ({ canvasElement }) => {
    const shell = shellRoot(canvasElement);

    // E1's stage chevron — the branch the E/P wave added to this component.
    const chevron = shell.querySelector<HTMLElement>(
      '[data-slot="generation-panel-section-trigger"] .transition-transform',
    )!;
    await expect(getComputedStyle(chevron).transitionProperty).toBe("none");

    // E5's progress fill, inside the pinned row.
    const fill = shell.querySelector<HTMLElement>('[data-slot="run-button-progress-indicator"]')!;
    await expect(getComputedStyle(fill).transitionProperty).toBe("none");

    // The value survives the suppression: the fill still has width, and the
    // percentage is still announced.
    await expect(fill.getBoundingClientRect().width).toBeGreaterThan(0);
    const statuses = Array.from(shell.querySelectorAll('[data-slot="result-card-status"]'));
    await expect(statuses.map((el) => el.textContent)).toEqual(["Generating, 62%", "Queued"]);
  },
};

/**
 * The whole tab order, in one lap, with the treatment read at every stop.
 *
 * The shell binds no keys and owns exactly one focusable — the canvas — so the
 * only fact it can prove is the sequence, and the sequence is the fact its docs
 * page asserts: topbar trailing, then every open stage of the config panel, then
 * the pinned cost row, then the canvas. Twelve stops here with two presets and
 * no see-more tile; the shipped `Tool` args reach fifteen. There is no skip
 * link, so the canvas — and therefore the first result — is behind every control
 * in the panel, which is the cost of the layout and the reason the assertion is
 * an ordered list rather than a set.
 *
 * The ring is checked twice at each stop, because the two checks answer
 * different questions (story-conventions.md, fact 5): `settledFocusRing` for
 * "something is painted", and a signature differential read on the *next* stop
 * while focus is still on the previous one — no blur, so the walk is undisturbed
 * — for "focus is what painted it".
 *
 * Two stops are exempted, and neither exemption hides a shell defect:
 *
 * - **The slider thumb paints nothing.** Base UI puts a real `<input>` inside
 *   the thumb and clips it away (`position: fixed; clip-path: inset(50%)`);
 *   focus lands there, `focus-visible:ring-3` sits on the thumb wrapper, which
 *   therefore never matches `:focus-visible`. Measured here: the focused input
 *   is 10×10 and fully clipped, and its only treatment is the user agent's
 *   `outline: auto 1px`. CONTINUE.md §8 lists four components in this position
 *   (F5, H2, H6, H7); **E3 `parameter-panel` is a fifth and the first that is a
 *   component rather than an editor**, so every shell composing a parameter row
 *   inherits it. Recorded, not asserted — choosing which element carries the
 *   ring is a design call.
 * - **The unit input's ring is on its wrapper.** `field-row`'s `UnitInput` rings
 *   the `[data-slot="unit-input"]` span with `focus-within:ring-2` while the
 *   `<input>` itself is `outline-none`, so the focused element reads bare and
 *   the treatment is one level up. That is the in-repo idiom §8 recommends for
 *   the slider case, already shipped one component over; the check follows it
 *   rather than reporting a false negative.
 *
 * The canvas does paint, and thinly: `outline: auto 1px` recoloured by the
 * repo's global `outline-ring/50`, against ring-2 and ring-3 everywhere else in
 * the shell. Its docs bullet — "no `focus-visible` style of its own, so tabbing
 * into it shows whatever the browser's default outline provides" — is accurate,
 * which is not what the equivalent bullet turned out to be on N3 or M1.
 */
export const KeyboardOrder: Story = {
  args: {
    ...FULL_ARGS,
    presets: PRESETS.slice(0, 2),
    presetVisibleCount: undefined,
    results: RESULTS.slice(0, 2),
  },
  play: async ({ canvasElement }) => {
    const shell = shellRoot(canvasElement);

    const at = (selector: string, index = 0) =>
      Array.from(shell.querySelectorAll<HTMLElement>(selector))[index];

    // The documented order, spelled out rather than derived from a query, so a
    // reordering edit fails here instead of silently redefining "correct".
    const stops: Array<[string, HTMLElement]> = [
      ["credits (M2)", at('[data-slot="credits-indicator-trigger"]')],
      ["Directions stage", at('[data-slot="generation-panel-section-trigger"]', 0)],
      ["directions textarea", at('[data-slot="generation-panel-directions-textarea"]')],
      ["Presets stage", at('[data-slot="generation-panel-section-trigger"]', 1)],
      ["preset tile 1", at('[data-slot="preset-grid-tile"]', 0)],
      ["preset tile 2", at('[data-slot="preset-grid-tile"]', 1)],
      ["Settings stage", at('[data-slot="generation-panel-section-trigger"]', 2)],
      ["model trigger (E2)", at('[data-slot="model-picker-trigger"]')],
      ["slider thumb input", shell.querySelector<HTMLElement>('[data-slot="parameter-slider-thumb"] input')!],
      ["unit input", shell.querySelector<HTMLElement>('[data-slot="unit-input"] input')!],
      ["Generate (E5)", at('[data-slot="run-button-trigger"]')],
      ["result canvas", region(shell, "result-canvas")],
    ];
    await expect(stops.every(([, el]) => el instanceof HTMLElement)).toBe(true);

    // Where a stop's treatment is painted by an ancestor rather than by itself.
    const painter = (el: HTMLElement) => el.closest<HTMLElement>('[data-slot="unit-input"]') ?? el;
    // The clipped slider input: no element in that subtree paints on focus.
    const exempt = (name: string) => name === "slider thumb input";

    await userEvent.tab();
    await waitFor(() => expect(document.activeElement).toBe(stops[0][1]));

    for (let i = 0; i < stops.length; i += 1) {
      const [name, el] = stops[i];
      await waitFor(() => expect(document.activeElement).toBe(el));

      if (!exempt(name)) {
        await settledFocusRing(painter(el), waitFor);
      }

      const next = stops[i + 1];
      if (!next) break;
      // Differential, taken before the move: focus is still on `el`, so this is
      // the unfocused signature of the stop we are about to reach.
      const before = focusTreatmentSignature(painter(next[1]));
      await userEvent.tab();
      await waitFor(() => expect(document.activeElement).toBe(next[1]));
      if (!exempt(next[0])) {
        await waitFor(() =>
          expect(`${next[0]} changed=${focusTreatmentSignature(painter(next[1])) !== before}`).toBe(
            `${next[0]} changed=true`,
          ),
        );
      }
    }

    // The exempted stop, measured rather than waved past.
    const thumbInput = stops[8][1];
    await expect(hasVisibleFocusRing(thumbInput)).toBe(false);
    await expect(getComputedStyle(thumbInput).clipPath).toBe("inset(50%)");

    // One more tab leaves the shell: the canvas is the last stop, and the four
    // result cards inside it are not focusable without `onOpenResult`.
    await userEvent.tab();
    await expect(shell.contains(document.activeElement)).toBe(false);
  },
};

/**
 * The shell holds no state, and this is the only place that claim is tested
 * rather than asserted in prose.
 *
 * Every selection in a generation tool belongs to the host: the preset, the
 * model, the directions, the result selection. The shell forwards four
 * value/onChange pairs and keeps none of them, so a host that records a request
 * and refuses to apply it should see nothing move. The story drives two of the
 * four — E4's preset radiogroup and F2's per-result selection — because they are
 * the two whose children hold internal state of their own and could therefore
 * move without permission. (E2's is a `SelectContent` this file will not open,
 * and E1's directions is a plain controlled `<textarea>`.)
 *
 * What it proves, in order: clicking an unselected preset leaves `aria-checked`
 * exactly where it was; the callback still fires with the id a host needs;
 * re-rendering with the same `presetValue` holds it; and applying the request
 * moves it. Then the same for `selectedResultIds` — F2 derives its `Set` from
 * the prop, so a checkbox click the host declines must leave the checkbox
 * unchecked *and* F2's own selection count reading "1 selected" rather than the
 * two the click asked for.
 *
 * E4 is genuinely controlled and that is worth stating, because its *other*
 * piece of state is not: the see-more expansion lives in a `useState` with no
 * prop and no callback, is one-way, and never resets, so a host swapping
 * `presets` on a mounted grid carries the old expansion in and `visibleCount` is
 * ignored from then on. Four components in this registry hold a fold a host
 * cannot reach (E4, E1, J4, J2); this shell composes two of them.
 */
export const Controlled: Story = {
  render: function ControlledHost(args) {
    const [requestedPreset, setRequestedPreset] = React.useState<string | undefined>();
    const [requestedIds, setRequestedIds] = React.useState<string[] | undefined>();
    const [applied, setApplied] = React.useState(false);
    const [tick, setTick] = React.useState(0);

    return (
      <div className="flex h-full flex-col">
        <div className="flex shrink-0 items-center gap-2 border-b p-2 text-xs">
          <button type="button" data-testid="rerender" onClick={() => setTick((t) => t + 1)}>
            Re-render ({tick})
          </button>
          <button type="button" data-testid="apply" onClick={() => setApplied(true)}>
            Apply the request
          </button>
          <span data-testid="requested-preset">{requestedPreset ?? "none"}</span>
          <span data-testid="requested-ids">{requestedIds?.join(",") ?? "none"}</span>
        </div>
        <div className="min-h-0 flex-1">
          <GenerationShell
            {...args}
            presetValue={applied ? requestedPreset : "cinematic"}
            onPresetChange={(value) => setRequestedPreset(value as string)}
            selectMode
            selectedResultIds={applied ? (requestedIds ?? ["r1"]) : ["r1"]}
            onSelectionChange={setRequestedIds}
          />
        </div>
      </div>
    );
  },
  args: {
    ...FULL_ARGS,
    presets: PRESETS.slice(0, 2),
    presetVisibleCount: undefined,
    results: RESULTS.slice(0, 2),
    bulkActions: <span className="text-foreground text-xs">Download · Delete</span>,
  },
  play: async ({ canvasElement }) => {
    const shell = shellRoot(canvasElement);
    const tiles = Array.from(shell.querySelectorAll<HTMLElement>('[data-slot="preset-grid-tile"]'));
    const checked = () => tiles.map((t) => t.getAttribute("aria-checked"));
    const requested = (id: string) =>
      canvasElement.querySelector<HTMLElement>(`[data-testid="${id}"]`)!.textContent;

    await expect(checked()).toEqual(["true", "false"]);

    // 1. Interaction alone does not move the rendered value.
    await userEvent.click(tiles[1]);
    await expect(requested("requested-preset")).toBe("anime");
    await expect(checked()).toEqual(["true", "false"]);

    // 2. Re-rendering with an unchanged `presetValue` holds it there.
    await userEvent.click(canvasElement.querySelector<HTMLElement>('[data-testid="rerender"]')!);
    await expect(checked()).toEqual(["true", "false"]);

    // 3. F2's selection is the same contract, and its own derived Set does not
    //    drift: the count E4 renders comes from the prop, not from the click.
    const box = shell.querySelectorAll<HTMLElement>('[data-slot="result-card-select"] [role="checkbox"]')[1];
    await userEvent.click(box);
    await expect(requested("requested-ids")).toBe("r1,r2");
    await expect(box.getAttribute("aria-checked")).toBe("false");
    await expect(shell.querySelector('[data-slot="generation-grid-selection-count"]')!.textContent).toBe(
      "1 selected",
    );

    // 4. Applying both requests is what moves them.
    await userEvent.click(canvasElement.querySelector<HTMLElement>('[data-testid="apply"]')!);
    await waitFor(() => expect(checked()).toEqual(["false", "true"]));
    await expect(shell.querySelector('[data-slot="generation-grid-selection-count"]')!.textContent).toBe(
      "2 selected",
    );
  },
};

/**
 * Every optional text slot emptied at once — the half that fails silently.
 *
 * `resultsLabel=""` is the one worth the story. The canvas keeps its
 * `tabIndex={0}`, so `scrollable-region-focusable` is satisfied and axe raises
 * nothing, but a `<section>` with an empty `aria-label` is not exposed as a
 * region — so the pane stops being a landmark and the only way to jump to the
 * results disappears without a single rule firing. Same shape as J4
 * `artifact-grid`'s empty session label, reached from a different prop. Pass
 * `undefined` to get the "Results" default; `""` is the one value that deletes
 * the landmark.
 *
 * `title=""` collapses B7's title to a 0×0 span. The shell is a single-purpose
 * tool, so the title *is* the product name; emptying it leaves a topbar holding
 * only a privacy chip and the balance, with nothing saying what the page is.
 * `emptyTitle=""` and `emptyDescription=""` leave L1 as an icon plus the example
 * pair, which is the one case where the emptiness is defensible — the pair is
 * what teaches the tool, and the words are the caption on it.
 *
 * NOT RENDERED, because rendering them would put a red gate in this file for
 * defects that belong to E4 and E5. Both were rendered once to find out which
 * rule fires, then taken back out: a preset item with `label: ""` produces a
 * 79×79 `<button role="radio">` with no accessible name and `run={{ label: "" }}`
 * produces a 22×32 Generate button with none, and axe 4.12 raises `button-name`
 * for both — including the radio, where `aria-toggle-field-name` would have been
 * the plausible guess. The shell forwards both strings untouched and has no
 * fallback of its own, which is the point: five optional text slots, three that
 * degrade quietly and two that fail the build, and nothing in the type tells
 * them apart. Same one-red-one-silent split K1, N2 and N3 each hit from a
 * different prop.
 */
export const EmptyLabel: Story = {
  args: {
    ...FULL_ARGS,
    title: "",
    resultsLabel: "",
    emptyTitle: "",
    emptyDescription: "",
    results: [],
  },
  play: async ({ canvasElement }) => {
    const shell = shellRoot(canvasElement);
    const canvas = region(shell, "result-canvas");

    // Still reachable, still scrollable, no longer a landmark.
    await expect(canvas.tabIndex).toBe(0);
    await expect(canvas.getAttribute("aria-label")).toBe("");
    await expect(canvas.matches("section[aria-label='']")).toBe(true);

    // The title is present in the DOM and paints nothing.
    const title = shell.querySelector<HTMLElement>('[data-slot="app-topbar-title"]')!;
    await expect(title.textContent).toBe("");
    await expect(title.getBoundingClientRect().width).toBe(0);

    // L1 keeps the one thing that teaches the tool.
    const empty = shell.querySelector<HTMLElement>('[data-slot="empty-state"]')!;
    await expect(empty.textContent).toContain("Flat still");
    await expect(empty.textContent).toContain("8s of motion");
  },
};

/**
 * An 83-character prompt in every author-supplied slot, and the shell gives it
 * three different answers.
 *
 * **Truncates.** B7's title is `truncate` inside a `min-w-0 flex-1` lead and A8's
 * overlay label under each result is `nowrap` + `ellipsis` at the tile's own
 * width, so a long prompt never changes a card's geometry — which is F1's whole
 * promise, and the reason the two cards here measure the same width. Note what
 * the title assertion is and is not: at 1200px an 83-character title paints
 * 517px into a lead with room to spare, so the ellipsis is the *declared*
 * behaviour here rather than an observed truncation. `Mobile` is where it fires.
 *
 * **Wraps.** E1's directions textarea and L1's description are ordinary flowing
 * text in a bounded column, which is the right answer for prose nobody scans in
 * a row.
 *
 * **Neither, and this is the finding.** E5's Generate label does not wrap (the
 * vendored `Button` is `whitespace-nowrap`) and cannot shrink (the shell passes
 * `shrink-0` so the price chip cannot squeeze it), so the button just grows.
 * Measured at 1200px: with the default 8-character "Generate" the button is
 * 83px wide; with this 83-character label it paints x=40..579, inside a
 * `cost-generate` row ending at x=384 and an E1 `Card` that is `overflow: hidden`
 * and ends at x=400. So 179px of the label is clipped — no ellipsis, no wrap, no
 * scrollbar. The row's own `flex-wrap` cannot save it: it puts the button on its
 * own line and the button is still wider than the column. Those two widths give
 * about 6.1px per character, so a fixed `md:w-96` config column caps its own
 * Generate label near **fifty characters** — a localisation ceiling nothing in
 * the type or the docs states, and one German or Finnish verb phrase can reach.
 *
 * Recorded, not repaired. Each available fix — dropping `shrink-0`, adding
 * `min-w-0` with a truncate, capping the label — changes what the button looks
 * like at every length, so it is a design decision rather than drift. The play
 * asserts the two answers that are right and the mechanism that makes the third
 * invisible; it does not pin the overflow as correct.
 */
export const LongContent: Story = {
  args: {
    ...FULL_ARGS,
    title: LONG_PROMPT,
    panel: {
      directions: LONG_PROMPT,
      onDirectionsChange: () => {},
      directionsPlaceholder: "Describe the shot…",
    },
    presets: [{ id: "cinematic", label: LONG_PROMPT }],
    presetValue: "cinematic",
    presetVisibleCount: undefined,
    results: [
      { id: "r1", state: "done", label: LONG_PROMPT },
      { id: "r2", state: "done", label: LONG_PROMPT },
    ],
    run: { state: "idle", onRun: () => {}, label: LONG_PROMPT },
  },
  play: async ({ canvasElement }) => {
    const shell = shellRoot(canvasElement);

    // 1. The title truncates rather than growing the bar.
    const title = shell.querySelector<HTMLElement>('[data-slot="app-topbar-title"]')!;
    const titleStyle = getComputedStyle(title);
    await expect(`${titleStyle.textOverflow}/${titleStyle.whiteSpace}`).toBe("ellipsis/nowrap");
    const topbar = region(shell, "topbar").getBoundingClientRect();
    await expect(title.getBoundingClientRect().right).toBeLessThanOrEqual(Math.ceil(topbar.right));

    // 2. Result cards keep identical geometry, which is F1's whole promise.
    const cards = Array.from(shell.querySelectorAll<HTMLElement>('[data-slot="result-card"]'));
    await expect(cards).toHaveLength(2);
    const widths = cards.map((c) => Math.round(c.getBoundingClientRect().width));
    await expect(widths[0]).toBe(widths[1]);
    const overlay = shell.querySelector<HTMLElement>('[data-slot="preview-tile-label"]')!;
    const overlayStyle = getComputedStyle(overlay);
    await expect(`${overlayStyle.textOverflow}/${overlayStyle.whiteSpace}`).toBe("ellipsis/nowrap");

    // 3. The canvas itself never scrolls sideways, however long a prompt gets.
    const canvas = region(shell, "result-canvas");
    await expect(canvas.scrollWidth).toBeLessThanOrEqual(canvas.clientWidth);

    // 4. The Generate label. Measured, not pinned: the numbers are in the
    //    description, and the only assertion here is the mechanism that makes
    //    the overflow invisible rather than scrollable.
    const panel = shell.querySelector<HTMLElement>('[data-slot="generation-panel"]')!;
    await expect(getComputedStyle(panel).overflowX).toBe("hidden");
  },
};

/**
 * A real 375×812 viewport, not a 375px box.
 *
 * `page.viewport()` from `vitest/browser` resizes the test iframe
 * itself, and for this shell that is the difference between a story and a
 * decoration. Measured in this play: `window.innerWidth` 1200 → 375,
 * `(min-width: 768px)` true → false. Under the width wrapper every other wave
 * used, the shell would have rendered its **desktop** layout inside a narrow
 * box: `md:flex-row` still matching, E4's `sm:grid-cols-4` still matching, four
 * preset tiles where a phone gets three. Here the panes stack (`flex-direction:
 * column`), E4 falls to three columns of 95.7px, and F2 falls to a single 343px
 * column. It does not leak — the next story reads 1200 again — so there is no
 * cleanup.
 *
 * What that buys, beyond the layout being real:
 *
 * - **The spec's one hard guarantee holds at phone size.** "Generate pinned to
 *   the bottom of the panel so it never requires scrolling" is *conditional* in
 *   E1 — the E/P wave measured that an unconstrained `generation-panel` lets
 *   `h-full` resolve to `auto`, `overflow-y-auto` never engages, and the card
 *   grows to 740px with Generate 140px below a phone fold. This shell is the
 *   composition that closes it: `basis-1/2` stacked gives the panel a height to
 *   scroll within, so at 375×812 the config column occupies y=64..430 and
 *   Generate sits at y=382..414, inside the first screen with 398px to spare.
 *   The condition E1 cannot enforce is enforced by the layout that composes it.
 * - **No horizontal scroll anywhere**, region by region rather than at the
 *   document, because the shell root is `overflow-hidden` and would hide it.
 *
 * Two narrowings worth recording. F2's bulk bar was measured overflowing at
 * 375px in the F wave (432px of content in a 373px box); with a modest
 * `bulkActions` node it does not here — 341px of content in a 341px box — so
 * that finding is a function of what a host passes, not of the grid. And F5's
 * carousel-arrow class of defect does not reach this shell at all: nothing in
 * O6 composes a `Carousel`.
 */
export const Mobile: Story = {
  args: FULL_ARGS,
  play: async ({ canvasElement }) => {
    // `vitest/browser`, not `@vitest/browser/context`: vitest 4.1 deprecated
    // the latter and prints a notice for it once per file per run. Two wave-8
    // agents flagged it independently and the convention was corrected rather
    // than kept for consistency's sake.
    const { page } = await import("vitest/browser");
    await page.viewport(375, 812);

    const shell = shellRoot(canvasElement);
    await waitFor(() => expect(window.innerWidth).toBe(375));
    await expect(window.matchMedia("(min-width: 768px)").matches).toBe(false);

    // 1. The breakpoint actually moved, which a width wrapper cannot do.
    const panes = region(shell, "config-panel").parentElement!;
    await waitFor(() => expect(getComputedStyle(panes).flexDirection).toBe("column"));
    const presetGrid = shell.querySelector<HTMLElement>('[data-slot="preset-grid"]')!;
    await expect(getComputedStyle(presetGrid).gridTemplateColumns.split(" ")).toHaveLength(3);
    const resultGrid = shell.querySelector<HTMLElement>('[data-slot="generation-grid-grid"]')!;
    await expect(getComputedStyle(resultGrid).gridTemplateColumns.split(" ")).toHaveLength(1);

    // 2. Generate is still above the fold, because the shell bounds the panel's
    //    height — E1 alone does not guarantee this.
    const generate = shell
      .querySelector<HTMLElement>('[data-slot="run-button-trigger"]')!
      .getBoundingClientRect();
    await expect(generate.bottom).toBeLessThanOrEqual(812);
    const config = region(shell, "config-panel").getBoundingClientRect();
    await expect(Math.round(config.height)).toBeLessThan(812);
    await expect(generate.bottom).toBeLessThanOrEqual(Math.ceil(config.bottom));

    // 3. Nothing scrolls sideways. Measured per region: the shell root is
    //    `overflow-hidden`, so a document-level check would pass on a clip.
    const overflowing = ["topbar", "config-panel", "cost-generate", "result-canvas"]
      .map((id) => [id, region(shell, id)] as const)
      .filter(([, el]) => el.scrollWidth > el.clientWidth)
      .map(([id, el]) => `${id} ${el.scrollWidth}>${el.clientWidth}`);
    await expect(overflowing).toEqual([]);

    // 4. The title truncation LongContent could only declare at 1200px.
    const title = shell.querySelector<HTMLElement>('[data-slot="app-topbar-title"]')!;
    await expect(title.getBoundingClientRect().right).toBeLessThanOrEqual(375);
  },
};

/**
 * O6 beside E1 `generation-panel`, which is the near-twin that actually causes
 * mistakes: E1 *is* the left column of this shell, and it ships a cost +
 * Generate footer of its own.
 *
 * **The choosing rule.** E1 is a column; O6 is a page. Reach for E1 when your
 * product already has a page and needs a configuration panel inside it — and
 * then own the canvas, the topbar and the balance yourself. Reach for O6 when
 * the tool *is* the page. The failure mode this pairing exists to prevent is the
 * one the block brief names: taking E1 because it looks like most of the job,
 * then hand-rolling a results pane beside it, which is a forked shell that
 * passes every gate.
 *
 * **What the two do with the price, which is the visible difference.** E1's
 * `cost` prop renders A2 as a *sibling* of its `generate` slot, so the chip
 * lands in the footer but inside no region marker. O6 leaves `cost` unset and
 * fills the slot with one element carrying `data-region="cost-generate"` holding
 * both A2 and E5, so the price and the button that spends it are one addressable
 * thing. The play asserts exactly that: the shell's chip has a `cost-generate`
 * ancestor and the bare panel's chip has none. Using both — which nothing stops
 * you doing — is two chips quoting the same number, and it is the docs page's
 * first pitfall.
 *
 * **Why the neighbour here is a component rather than another block.** The
 * block-level twin is O7 `library-shell`: a grid of A8 tiles beside a column, so
 * from a screenshot the two pages are the same. The rule there is what the grid
 * *is* — O6's canvas holds this session's output and empties when you leave,
 * O7's holds everything you have ever made and is the reason you came. That one
 * is stated rather than rendered, and the reason was measured rather than
 * assumed: two shells mounted side by side fail axe three times over —
 * `landmark-no-duplicate-banner` on the second B7 `<header>`, and
 * `landmark-unique` twice, once for the pair of banners and once for the pair of
 * regions both named "Results". Two shells on one page is not a surface any
 * product has, so the story would be documenting Storybook. It is worth knowing
 * anyway: **a shell is a page, and nothing in the type system says so** — a docs
 * layout that renders two block previews on one route inherits all three
 * failures, and the only escape hatch is `resultsLabel` for one of them.
 */
export const Boundary: Story = {
  render: (args) => (
    <div className="flex h-full flex-col gap-4 p-4 lg:flex-row">
      <div className="min-h-0 flex-1 overflow-hidden rounded-lg border" data-testid="shell">
        <GenerationShell {...args} />
      </div>
      <div className="min-h-0 w-96 shrink-0" data-testid="panel">
        <GenerationPanel
          directions="A lighthouse at dusk, slow push in"
          onDirectionsChange={() => {}}
          cost={55}
          costUnit="credits"
          generate={<RunButton state="idle" onRun={() => {}} />}
        />
      </div>
    </div>
  ),
  args: { ...FULL_ARGS, presets: PRESETS.slice(0, 2), presetVisibleCount: undefined },
  play: async ({ canvasElement }) => {
    const shell = shellRoot(canvasElement);
    const panel = canvasElement.querySelector<HTMLElement>('[data-testid="panel"]')!;

    // `Mobile` ran before this story and resized the iframe. Confirming the
    // reset here is what makes that story's "it does not leak" claim checkable
    // from inside the suite rather than taken from the convention.
    await expect(window.matchMedia("(min-width: 768px)").matches).toBe(true);

    // The shell's price is inside the region; the bare panel's is not.
    const shellChip = shell.querySelector<HTMLElement>('[data-slot="cost-chip"]')!;
    await expect(shellChip.closest('[data-region="cost-generate"]')).not.toBeNull();

    const panelChip = panel.querySelector<HTMLElement>('[data-slot="cost-chip"]')!;
    await expect(panelChip.closest('[data-region="cost-generate"]')).toBeNull();
    await expect(panelChip.closest('[data-slot="generation-panel-cost"]')).not.toBeNull();

    // Both put the price in the same pinned footer — the difference is the
    // marker, not the placement, which is why it is easy to get wrong.
    await expect(shellChip.closest('[data-slot="generation-panel-generate"]')).not.toBeNull();
    await expect(panelChip.closest('[data-slot="generation-panel-generate"]')).not.toBeNull();

    // A page has regions; a column has none.
    await expect(shell.querySelectorAll("[data-region]")).toHaveLength(4);
    await expect(panel.querySelectorAll("[data-region]")).toHaveLength(0);
  },
};
