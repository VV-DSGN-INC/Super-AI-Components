import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";

import { GenerationQueue } from "@/registry/super-ai/generation-queue";
import { RecordList } from "@/registry/super-ai/record-list";
import { RenderQueue, type RenderJob } from "@/registry/super-ai/render-queue";
import { RenderQueueDocs } from "@/content/components/render-queue.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const SPEC = { format: "MP4", codec: "H.264", resolution: "3840×2160", fps: 24 };

const JOBS: RenderJob[] = [
  {
    id: "1",
    name: "Opening titles",
    spec: { ...SPEC, resolution: "1280×720" },
    stage: "preview",
    state: "done",
    cost: { amount: 4 },
  },
  {
    id: "2",
    name: "Main cut",
    spec: SPEC,
    stage: "export",
    state: "streaming",
    progress: 62,
    cost: { amount: 900, per: "min" },
  },
  { id: "3", name: "Alt ending", spec: SPEC, stage: "export", state: "queued" },
  {
    id: "4",
    name: "Credits roll",
    spec: SPEC,
    stage: "export",
    state: "failed",
    cost: { amount: 55 },
    error: "Encoder ran out of memory",
  },
];

const meta: Meta<typeof RenderQueue> = {
  title: "Super AI/Render Queue",
  component: RenderQueue,
  parameters: { layout: "centered", docs: { page: componentDocsPage(RenderQueueDocs) } },
  decorators: [
    (Story) => (
      <div className="w-[52rem] max-w-full">
        <Story />
      </div>
    ),
  ],
  args: {
    jobs: JOBS,
    onRetry: () => {},
    onCancel: () => {},
    onDownload: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof RenderQueue>;

/** Every row carries the output spec it will be billed for. */
export const PerRowSpec: Story = {};

/** Only the rendering row has a bar; the number is per job. */
export const Progress: Story = {
  args: { jobs: JOBS.filter((j) => j.state === "streaming") },
};

/** A failed row keeps its spec and its error, and retries in place. */
export const Retry: Story = {
  args: { jobs: JOBS.filter((j) => j.state === "failed") },
};

/** Cancel reaches only work still in flight. */
export const Cancel: Story = {
  args: { jobs: JOBS.filter((j) => j.state === "queued" || j.state === "streaming") },
};

/** Download belongs to finished rows alone. */
export const Download: Story = {
  args: { jobs: JOBS.filter((j) => j.state === "done") },
};

/* -------------------------------------------------------------------------
 * Case stories — the situations this queue meets in a product, as opposed to
 * the prop combinations above. See docs/design-system/story-conventions.md.
 *
 * Seven of the eight are written. Not written for this component,
 * deliberately:
 *
 * // case-skip: Controlled — jobs is inbound render data; retry/cancel/download report an intent and carry no value
 * `jobs` is the queue a caller polls for and hands in; the component holds no
 * state of its own, offers no `value`/`onChange` pair, and exposes nothing a
 * user picks. The three callbacks fire with a job id so a host can act on one
 * row — the `onSelect`/`onRemove` shape the D/I wave skipped six times, not a
 * controlled value. The counter-argument was considered and rejected: yes, a
 * click leaves the row untouched until the host re-renders `jobs`, so all
 * three of the convention's assertions would technically pass, but they
 * degenerate to "this component is a pure function of its props", which is
 * true of most of the registry and is not the contract `Controlled` exists to
 * pin. Its nearest neighbour E6 `generation-queue` skips it on the same
 * reasoning, and two queues that differ only in whether they claim to be
 * controlled would be the more misleading outcome.
 * ---------------------------------------------------------------------- */

/**
 * Right-to-left, and the queue splits into two halves that disagree.
 *
 * **What mirrors correctly.** The action cluster is `justify-end`, a logical
 * end, so Cancel moves to the left of its cell (measured: control centre at
 * x=22 inside a cell centred at x=61). The progress fill grows from the
 * inline start, so its right edge meets the track's right edge and it eats
 * leftward. And the spec string does not scramble: "MP4 · H.264 · 3840×2160 ·
 * 24 fps" is Latin and digits joined by `·` neutrals, and a neutral between
 * two strong-LTR runs takes their direction, so the whole cell stays one
 * left-to-right run inside a right-aligned column. That is asserted below by
 * measuring the first three characters against the last six.
 *
 * **What does not.** `components/ui/table.tsx` styles `TableHead` with a
 * physical `text-left`, while `TableCell` inherits the document's start edge.
 * Measured here: every `th` computes `text-align: left` and every `td`
 * computes `start`, so under RTL the six column headings sit against the left
 * edge and their data sits against the right — the heading and the column it
 * names pull apart across the full width of the table. It is the
 * byte-identical `text-left` → `text-start` swap the §8 sweep already
 * sanctions, but it lives in a vendored primitive rather than in
 * `render-queue.tsx`, so it is recorded here rather than swept: fixing it once
 * repairs every table in the registry, and doing it from a case story would
 * fix one caller and hide the rest. Not asserted, so a fix upstream does not
 * fail this story.
 */
export const RTL: Story = {
  render: (args) => (
    <div dir="rtl">
      <RenderQueue {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector('[data-slot="render-queue"]') as HTMLElement;
    const r = (el: Element | null) => (el as HTMLElement).getBoundingClientRect();
    const mid = (el: Element | null) => r(el).left + r(el).width / 2;

    // 1. The trailing cluster is logical, so it lands on the left under RTL.
    const cancel = root.querySelector('[data-slot="render-queue-cancel"]')!;
    const actionsCell = cancel.closest("td")!;
    await expect(`cancel left of its cell: ${mid(cancel) < mid(actionsCell)}`).toBe(
      "cancel left of its cell: true",
    );

    // 2. The fill grows from the inline start — the right edge here.
    const track = root.querySelector('[data-slot="progress-track"]')!;
    const fill = root.querySelector('[data-slot="progress-indicator"]')!;
    await expect(Math.round(r(fill).right)).toBe(Math.round(r(track).right));
    await expect(r(fill).left).toBeGreaterThan(r(track).left);

    // 3. The spec keeps its own order: "MP4" is painted left of "24 fps",
    //    inside a cell that is itself right-aligned. Measured on the text
    //    node, because DOM order cannot show a bidi reordering.
    const specCell = root.querySelector('[data-slot="render-queue-spec"]') as HTMLElement;
    const text = specCell.firstChild as Text;
    const range = document.createRange();
    range.setStart(text, 0);
    range.setEnd(text, 3);
    const head = range.getBoundingClientRect();
    range.setStart(text, text.length - 6);
    range.setEnd(text, text.length);
    const tail = range.getBoundingClientRect();
    await expect(`format before fps: ${head.left < tail.left}`).toBe("format before fps: true");
  },
};

/**
 * `prefers-reduced-motion`, and this queue has exactly one thing of its own
 * that moves: the `streaming` row's `Loader2`, which spun on `animate-spin`
 * with no branch at all. Measured before this wave, `animation-name` read
 * `"spin"` under emulated reduce.
 *
 * Fixed in-wave as a mechanical repair — `motion-reduce:animate-none` beside
 * the `animate-*`, the first of the two sanctioned idioms and the shape
 * `task-tray` already ships on the identical lucide spinner. Suppressing it
 * costs nothing here, because the spinner was never the signal: the word
 * "Rendering" sits beside it in the same cell, which is the component's own
 * rule that state never rests on colour or motion.
 *
 * **Two things still move, and neither is patched from here.**
 *
 * - `components/ui/progress.tsx` gives its indicator `transition-all`, so the
 *   fill glides for 150ms on every poll tick. The `Progress` composite renders
 *   `ProgressTrack`/`ProgressIndicator` itself and forwards no class to
 *   either, so a call site cannot reach it the way `run-button` does — it
 *   composes the parts directly and owns its own `transition-[width]`. Six
 *   registry components use the composite; this is one decision for all of
 *   them.
 * - The vendored `Button`'s press nudge, which `CONTINUE.md` §8 records as a
 *   primitive-wide posture.
 *
 * **And a measurement worth carrying: transition assertions are vacuous in
 * this gate.** The vitest browser run injects a plain `<style>` — not from
 * `index.css` — carrying `*, ::before, ::after { transition-property: none;
 * transition-duration: 0s }`. Unlayered rules beat `@layer utilities`, so it
 * defeats every Tailwind `transition-*` class in the tree: measured here, the
 * untouched vendored `Button` (`transition-all`), `TableRow`
 * (`transition-colors`) and the progress indicator all compute
 * `transition-property: none`. A `ReducedMotion` play that asserts a
 * transition was suppressed therefore passes with or without the
 * `motion-reduce:` class. Animations are not affected, which is why the
 * spinner assertion below is a real one.
 */
export const ReducedMotion: Story = {
  args: { jobs: JOBS.filter((j) => j.state === "streaming" || j.state === "queued") },
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector('[data-slot="render-queue"]') as HTMLElement;
    const spinner = root.querySelector(".animate-spin") as SVGElement;

    // The branch, not merely its absence: the class is still on the element…
    // (read as an attribute — `className` on an SVG is an SVGAnimatedString.)
    await expect(spinner.getAttribute("class")).toContain("animate-spin");
    // …and reduce stops it, so the row's status is carried by the word alone.
    await expect(getComputedStyle(spinner).animationName).toBe("none");
    await expect(root.querySelector('[data-slot="render-queue-status"]')).toHaveTextContent("Rendering");
  },
};

/**
 * Tab traversal down a queue whose rows each offer a different control.
 *
 * The sequence is the contract: **one stop per row at most, and which control
 * it is depends on the row's state** — Download on `done`, Cancel on
 * `streaming` and `queued`, Retry on `failed`. The header is six plain cells
 * and contributes nothing, the rows are inert `<tr>`s, and there is no arrow
 * navigation, so document order is tab order.
 *
 * What the play pins is the naming contract the D/I wave found broken twice:
 * every per-row control carries its own row's name, so four buttons in a
 * column are four distinct destinations rather than four identical "Cancel"s.
 * It also walks the sequence and checks a visible focus treatment at each
 * stop.
 *
 * **Two gaps, described rather than pinned.**
 *
 * - **Focus is lost when a row resolves.** A finishing job unmounts its Cancel
 *   and mounts Download in its place; nothing moves focus, so a keyboard user
 *   who was on the Cancel of the second of three rows is dropped to `<body>`
 *   and the next Tab restarts at the top of the page. E6 `generation-queue`
 *   records the identical shape (`CONTINUE.md` §9), and this component's own
 *   docs module already carries it — with the sharper detail that it fires on
 *   a polling tick rather than on a keypress, so nothing the user did explains
 *   it. Behavioural, so it stays recorded.
 * - **The name is built from `job.name` alone.** Two exports of the same
 *   source at different specs — the case this component exists for — produce
 *   two buttons called "Cancel Main cut", and the spec that distinguishes the
 *   rows is exactly what the name omits. `EmptyLabel` renders the same
 *   collapse from the empty-string end and asserts it there.
 */
export const KeyboardOrder: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector('[data-slot="render-queue"]') as HTMLElement;

    // One control per row, chosen by state, in row order.
    const buttons = canvas.getAllByRole("button");
    await expect(buttons.map((b) => b.getAttribute("aria-label"))).toEqual([
      "Download Opening titles",
      "Cancel Main cut",
      "Cancel Alt ending",
      "Retry Credits roll",
    ]);

    // Each of the four rows contributes exactly one, so no row is silently
    // both cancellable and downloadable.
    for (const row of Array.from(root.querySelectorAll('[data-slot="render-queue-row"]'))) {
      await expect(row.querySelectorAll("button")).toHaveLength(1);
    }

    // The header is not a stop: six cells, none focusable.
    await expect(root.querySelectorAll("thead button, thead a[href]")).toHaveLength(0);

    // Walk the sequence. Every stop is visibly focused.
    await userEvent.tab();
    const seen: string[] = [];
    while (document.activeElement && root.contains(document.activeElement)) {
      const focused = document.activeElement as HTMLElement;
      seen.push(focused.getAttribute("aria-label") ?? "");
      await expect(focused.matches(":focus-visible")).toBe(true);
      const style = getComputedStyle(focused);
      await expect(style.boxShadow !== "none" || style.outlineStyle !== "none").toBe(true);
      await userEvent.tab();
    }
    await expect(seen).toEqual([
      "Download Opening titles",
      "Cancel Main cut",
      "Cancel Alt ending",
      "Retry Credits roll",
    ]);
  },
};

/**
 * Every optional slot empty at once, which is the shape of an unaudited queue
 * — and the component renders it without complaint, because each omission is
 * legitimate on its own.
 *
 * - **`spec: {}` renders a blank cell.** `formatSpec` joins the parts the
 *   caller supplied, so no parts means no summary. The docs page's third
 *   pitfall says this is deliberate for an audio job with nothing but a
 *   format; the rendered version shows what it costs, which is the audit
 *   column of an export queue reading as whitespace.
 * - **No `cost` renders an em-dash**, never a zero, so "we don't know" and
 *   "free" stay distinguishable.
 * - **A failed row with no `error`** says "Failed" and nothing else — the row
 *   keeps its Retry, so the offer to try again survives the loss of the reason
 *   to.
 * - **`name: ""` collapses the control's accessible name to the bare verb.**
 *   The label is `` `Cancel ${job.name}` ``, so an empty name leaves "Cancel",
 *   and two such rows leave two buttons that are indistinguishable to anyone
 *   navigating by name. Asserted below as the measurement it is, not as the
 *   contract: this is the same collapse `KeyboardOrder` describes for two jobs
 *   that legitimately share a name, and the fix is an API decision (fold the
 *   spec or the id into the label) rather than a class.
 */
export const EmptyLabel: Story = {
  args: {
    jobs: [
      { id: "1", name: "Ambience bed", spec: {}, stage: "export", state: "done" },
      { id: "2", name: "", spec: { format: "WAV" }, stage: "export", state: "queued" },
      { id: "3", name: "", spec: { format: "WAV" }, stage: "export", state: "streaming", progress: 12 },
      { id: "4", name: "Credits roll", spec: SPEC, stage: "export", state: "failed" },
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector('[data-slot="render-queue"]') as HTMLElement;

    // The audit column is empty text, not a placeholder or an error.
    const specs = root.querySelectorAll('[data-slot="render-queue-spec"]');
    await expect(specs[0]).toHaveTextContent("");

    // Absent cost is an em-dash on every row here; none of them priced one.
    const costs = Array.from(root.querySelectorAll('[data-slot="render-queue-cost"]'));
    await expect(costs.map((c) => c.textContent)).toEqual(["—", "—", "—", "—"]);

    // The failed row lost its reason and kept its offer.
    await expect(root.querySelector('[data-slot="render-queue-error"]')).toBeNull();
    await expect(canvas.getByRole("button", { name: "Retry Credits roll" })).toBeInTheDocument();

    // Two unnamed rows, one name between them — the label cannot see the row.
    await expect(canvas.getAllByRole("button", { name: "Cancel" })).toHaveLength(2);
  },
};

/**
 * A 72-character job name at the width this component ships at, and the answer
 * is not the one the spec's own rule predicts.
 *
 * Cells are `whitespace-nowrap` with `text-overflow: clip` and nothing
 * truncates, so a long name widens its column instead of wrapping: measured
 * here, the name cell takes 492px and the table grows to 1357px inside an
 * 832px container. **The spec column survives** — it ends at x=774, still
 * inside the box. What leaves the screen is everything after it: the cost cell
 * starts at x=1164 and the row's Cancel at x=1321, both several hundred pixels
 * past the right edge, reachable only by scrolling the table sideways.
 *
 * So the failure mode is the inverse of the obvious one. The rule is "a queue
 * showing only filenames cannot be audited before it bills you"; a long enough
 * filename does not hide the spec, it hides **the bill** — and the control
 * that would stop the job. The frame itself never scrolls (832 = 832); the
 * table's own `overflow-x-auto` container absorbs all of it, which is what
 * makes the loss quiet.
 *
 * The error string is the other author-supplied slot and it behaves: it sits
 * on one 16px line under the status, in a cell that is also `nowrap`, so a
 * long message widens the Status column rather than growing the row.
 */
export const LongContent: Story = {
  args: {
    jobs: [
      {
        id: "1",
        name: "Main cut — director approved, colour graded, 5.1 mix, delivery master v7",
        spec: SPEC,
        stage: "export",
        state: "streaming",
        progress: 62,
        cost: { amount: 900, per: "min" },
      },
      {
        id: "2",
        name: "Credits roll",
        spec: SPEC,
        stage: "export",
        state: "failed",
        cost: { amount: 55 },
        error: "Encoder ran out of memory after 41 minutes; nothing was charged",
      },
    ],
  },
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector('[data-slot="render-queue"]') as HTMLElement;
    const container = root.querySelector('[data-slot="table-container"]') as HTMLElement;
    const r = (el: Element | null) => (el as HTMLElement).getBoundingClientRect();

    // The name neither wraps nor truncates: it widens the table past its box.
    const nameCell = root.querySelector("tbody td") as HTMLElement;
    await expect(getComputedStyle(nameCell).whiteSpace).toBe("nowrap");
    await expect(container.scrollWidth).toBeGreaterThan(container.clientWidth);

    // The spec stays visible; the price and the control do not.
    const spec = root.querySelector('[data-slot="render-queue-spec"]')!;
    const cost = root.querySelector('[data-slot="render-queue-cost"]')!;
    const cancel = root.querySelector('[data-slot="render-queue-cancel"]')!;
    const edge = r(container).right;
    await expect(
      `spec visible: ${r(spec).right <= edge}, cost visible: ${r(cost).left <= edge}, cancel visible: ${r(cancel).left <= edge}`,
    ).toBe("spec visible: true, cost visible: false, cancel visible: false");
  },
};

/**
 * 375px, and the whole table is off-column: six `nowrap` columns measure
 * 789px inside a 375px frame, so 414px of every row — from partway through
 * the spec (its cell ends at x=397, already past the 375px edge) to the
 * control at the end — is reachable only by scrolling the table sideways.
 * The frame itself does not scroll horizontally (375 = 375); the vendored
 * `Table`'s own `overflow-x-auto` container takes all of it, which is the
 * component's real answer to narrow width and is documented nowhere else.
 *
 * **The gap this width exposes, and it is a live axe failure.** That
 * container is a bare `<div class="relative w-full overflow-x-auto">` in
 * `components/ui/table.tsx`: no `tabIndex`, no role, no name. It passes
 * `scrollable-region-focusable` here only because the row buttons inside it
 * are focusable — and the buttons are optional. Measured: rendering this same
 * 375px queue with `jobs` and **no** handlers fails the a11y gate outright
 * ("Scrollable region must have keyboard access", on `.overflow-x-auto`),
 * because a read-only queue contains nothing focusable at all. A keyboard user
 * then reaches the first three columns of the job list and no further.
 *
 * That is the P1 `data-views` finding a second time — invisible at desktop
 * width, only reachable through `Mobile` — but one level down, in a vendored
 * primitive every table in the registry shares, so it is recorded rather than
 * fixed from here. The wave-0 idiom is the shape of the repair: a `<section>`
 * rather than a div, `tabIndex={0}`, a name, and a focus ring.
 */
export const Mobile: Story = {
  render: (args) => (
    <div data-testid="mobile-frame" className="w-[375px] max-w-full">
      <RenderQueue {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const frame = canvasElement.querySelector('[data-testid="mobile-frame"]') as HTMLElement;
    const container = frame.querySelector('[data-slot="table-container"]') as HTMLElement;

    // Measure the frame, not the `layout: "centered"` wrapper above it.
    await expect(frame.clientWidth).toBe(375);
    await expect(frame.scrollWidth).toBe(frame.clientWidth);

    // The table absorbs the overflow instead of the page.
    await expect(container.scrollWidth).toBeGreaterThan(container.clientWidth);

    // …and the only reason that scroll region is keyboard-reachable is the
    // per-row controls inside it. Take the handlers away and there are none.
    await expect(container.querySelectorAll("button").length).toBeGreaterThan(0);
  },
};

/**
 * Three lists of rows that each carry a status and a per-row control. They are
 * built from the same parts and answer to different things:
 *
 * - **Render queue** — jobs that cost money, and the row is an *invoice line*.
 *   Every row carries the output spec it will be billed for, because the price
 *   was set by settings chosen several screens ago and a filename plus a
 *   spinner cannot be checked before it charges you. Preview and export sit in
 *   one list so their costs can be compared.
 * - **Generation queue** — slots in one batch you just started. Rows are
 *   interchangeable outputs of a single request, so there is one heading and
 *   one batch progress number, and the whole queue disappears when the batch
 *   resolves. Nothing is priced per row.
 * - **Record list** — durable things that *run*: they exist before you open
 *   the page and after you leave it, so the primary control is the enable
 *   toggle rather than cancel, and the row's history is a subtitle. It also
 *   names its own table through a caption, which this one does not.
 *
 * The deciding questions, in order: does the row have a price and a spec
 * (render queue); does the row stop existing when this batch finishes
 * (generation queue); otherwise it is a record and belongs in J5.
 */
export const Boundary: Story = {
  render: () => (
    <div className="flex w-full max-w-4xl flex-col gap-8">
      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">
          Render queue — jobs that carry a spec and a price
        </p>
        <RenderQueue
          jobs={[
            {
              id: "1",
              name: "Main cut",
              spec: SPEC,
              stage: "export",
              state: "streaming",
              progress: 62,
              cost: { amount: 900, per: "min" },
            },
            {
              id: "2",
              name: "Opening titles",
              spec: { ...SPEC, resolution: "1280×720" },
              stage: "preview",
              state: "done",
              cost: { amount: 4 },
            },
          ]}
          onCancel={() => {}}
          onDownload={() => {}}
        />
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">
          Generation queue — slots in one batch, priced once or not at all
        </p>
        <GenerationQueue
          heading="Generating 2 images"
          items={[
            {
              id: "1",
              title: "Rooftop garden, golden hour",
              description: "Image · 4:5",
              state: "running",
              progress: 24,
            },
            {
              id: "2",
              title: "Studio portrait, soft light",
              description: "Image · 1:1",
              state: "queued",
            },
          ]}
          onCancelItem={() => {}}
          onCancelAll={() => {}}
        />
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">
          Record list — things that outlive the page; the toggle is the control
        </p>
        <RecordList
          label="Scenarios"
          records={[
            {
              id: "1",
              title: "Nightly render sweep",
              apps: [{ name: "Frame.io" }, { name: "Slack" }],
              lastRun: "Last run 4 min ago",
              runState: "success",
              enabled: true,
            },
            {
              id: "2",
              title: "Proxy transcode",
              apps: [{ name: "Dropbox" }],
              lastRun: "Last run 2 h ago",
              runState: "failed",
              enabled: false,
            },
          ]}
          onEnabledChange={() => {}}
        />
      </section>
    </div>
  ),
};
