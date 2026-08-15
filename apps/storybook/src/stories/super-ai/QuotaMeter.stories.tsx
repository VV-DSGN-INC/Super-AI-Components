import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";

import { CreditsIndicator } from "@/registry/super-ai/credits-indicator";
import { QuotaMeter } from "@/registry/super-ai/quota-meter";
import { QuotaMeterDocs } from "@/content/components/quota-meter.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const meta: Meta<typeof QuotaMeter> = {
  title: "Super AI/Quota Meter",
  component: QuotaMeter,
  parameters: { layout: "centered", docs: { page: componentDocsPage(QuotaMeterDocs) } },
  // The same width the shipped demo uses (components/demos/quota-meter-demo.tsx).
  // The meter is a full-width column; without a bounded parent the rows stretch
  // to the canvas and the label/value pair stops reading as a pair.
  decorators: [
    (Story) => (
      <div className="w-full max-w-sm">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof QuotaMeter>;

/**
 * Every resource comfortably inside its allowance. This is also the story that
 * pins the per-row accessible-name contract: each track is named by its own
 * row's label via `aria-labelledby`, which is the fix M3 took in the family O
 * round after every meter announced as an unnamed progressbar.
 */
export const Normal: Story = {
  args: {
    resources: [
      { label: "Messages", used: 1240, limit: 5000, resetsIn: "Resets in 12 days" },
      { label: "Image generations", used: 34, limit: 200, resetsIn: "Resets in 12 days" },
      { label: "Video minutes", used: 6, limit: 30, unit: "min", resetsIn: "Resets in 12 days" },
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // One track per resource, never one aggregate.
    const tracks = canvas.getAllByRole("progressbar");
    await expect(tracks).toHaveLength(3);

    // Each is named by its own row's visible label, and the names are distinct —
    // a refactor that dropped the useId suffix would give all three the same
    // name and still look identical.
    const names = tracks.map((t) => t.getAttribute("aria-labelledby"));
    await expect(new Set(names).size).toBe(3);

    await expect(canvas.getByRole("progressbar", { name: "Video minutes" })).toHaveAttribute(
      "aria-valuetext",
      "6 of 30 min used",
    );
  },
};

/**
 * One resource over `nearLimitAt` (0.8 by default), the rest still normal — the
 * mixed row is the point, because it is what an aggregate would have averaged
 * away.
 *
 * **This state is under-rendered by this gate.** `--warning` is defined in
 * `apps/docs/app/globals.css` but *not* in `apps/storybook/src/index.css`, and
 * Tailwind v4 emits no rule at all for an undefined utility rather than
 * failing. So under Storybook the amber bar renders unpainted and the amber
 * readout falls back to inherited text — axe measures the fallback, not the
 * shipped colour. In the docs app, where the token exists, that readout is
 * `text-warning` on the page background at roughly 2.2:1, under the 4.5:1
 * normal-text minimum. Recorded rather than repainted: the same bare
 * `text-warning` body text appears in `env-status`, `usage-dashboard` and
 * `data-views-shared`, so it is a registry-wide token decision, not a
 * one-component fix.
 */
export const NearLimit: Story = {
  args: {
    resources: [
      { label: "Messages", used: 4310, limit: 5000, resetsIn: "Resets in 3 days" },
      { label: "Image generations", used: 168, limit: 200, resetsIn: "Resets in 3 days" },
      { label: "Video minutes", used: 6, limit: 30, unit: "min", resetsIn: "Resets in 3 days" },
    ],
  },
};

/**
 * Past the allowance. The bar clamps at 100% and the numbers deliberately do
 * not, so the row reads `5,240 / 5,000` against a full bar — the overage is the
 * useful number. A consequence worth knowing: that row reports
 * `aria-valuenow="5240"` against `aria-valuemax="5000"`, so an assistive
 * technology computing its own percentage can announce over 100%.
 */
export const OverLimit: Story = {
  args: {
    resources: [
      { label: "Messages", used: 5240, limit: 5000, resetsIn: "Resets in 3 days" },
      { label: "Image generations", used: 200, limit: 200, resetsIn: "Resets in 3 days" },
      { label: "Video minutes", used: 22, limit: 30, unit: "min", resetsIn: "Resets in 3 days" },
    ],
  },
};

/**
 * The sidebar form, and the data `settings-shell` actually passes it. `compact`
 * is not just smaller type — it drops the reset line entirely, so a surface
 * using it has to carry the reset date somewhere else or lose it. Both rows
 * here supply `resetsIn`, and neither renders it.
 */
export const Compact: Story = {
  args: {
    compact: true,
    resources: [
      { label: "Generations", used: 820, limit: 1000, resetsIn: "Resets in 6 days" },
      { label: "MCP calls", used: 12400, limit: 50000, resetsIn: "Resets in 6 days" },
    ],
  },
};

/* -------------------------------------------------------------------------
 * Case stories — the situations this component meets in a product, as
 * opposed to the prop combinations above. See
 * docs/design-system/story-conventions.md for which of the eight apply and
 * why the three that are missing here are missing.
 *
 * Not written for this component, deliberately:
 *
 * // case-skip: ReducedMotion — no animation, and the one transition cannot run in a story
 * Nothing in the tree uses `animate-*`. The only motion is `transition-[width]`
 * on the bar, which fires when a consumer re-renders with a new `used` — a
 * story sets its width once from static args, so the transition never runs and
 * there is no reduced-motion branch to document. Guarding it would mean adding
 * `motion-reduce:transition-none`, which exists nowhere in this registry
 * against 45 `transition-*` usages; that is a repo-wide posture, not this
 * component's fix.
 *
 * // case-skip: KeyboardOrder — the tree contains no focusable element at all
 * Rows are divs and spans; `role="progressbar"` is not focusable and nothing
 * sets `tabIndex`. There are zero tab stops, so there is no sequence to show
 * and no focus ring to assert — the ring assertion would loop over an empty
 * set and pass vacuously.
 *
 * // case-skip: Controlled — there is no value to control
 * `QuotaMeterProps` exposes no `value`/`onChange` pair and no callback of any
 * kind. `resources` is render data, the threshold is derived from it by
 * `quotaState`, and the component holds no state of its own — nothing here can
 * be driven or held fixed by a parent.
 * ---------------------------------------------------------------------- */

/**
 * Right-to-left. Direction is load-bearing in three places and they do not all
 * flip the same way: the label/value pair swaps ends, the bar fills from the
 * right because the fill is a plain block inside the track, and the readout
 * does **not** flip — `quota-meter-value` sets `dir="ltr"` explicitly so
 * `4,310 / 5,000` keeps its numerator first instead of reordering around the
 * slash. A near-limit row is used so the state colouring is visible in the same
 * pass.
 */
export const RTL: Story = {
  render: (args) => (
    <div dir="rtl" className="w-full">
      <QuotaMeter {...args} />
    </div>
  ),
  args: {
    resources: [
      { label: "Messages", used: 4310, limit: 5000, resetsIn: "Resets in 3 days" },
      { label: "Video minutes", used: 6, limit: 30, unit: "min", resetsIn: "Resets in 3 days" },
    ],
  },
};

/**
 * The optional text slots emptied. `label` is required and is the row's
 * accessible name, so this is not the usual unlabeled-control case — what is
 * optional here is `unit` and `resetsIn`, and dropping them changes more than
 * the visuals. The reset line disappears, so the row is two elements rather
 * than three; and `aria-valuetext` degrades from `"6 of 30 min used"` to
 * `"6 of 30 used"`, which is the entire announcement for a bare number whose
 * meaning lived in the unit.
 */
export const EmptyLabel: Story = {
  args: {
    resources: [
      { label: "Messages", used: 1240, limit: 5000 },
      { label: "Video minutes", used: 6, limit: 30 },
    ],
  },
};

/**
 * A ~90-character resource label. The row is
 * `flex items-baseline justify-between gap-3` and neither span sets
 * `truncate`, `whitespace-nowrap` or `shrink-0`, so the component's answer to
 * long content is to **wrap, never truncate** — the label takes as many lines
 * as it needs and the row grows. The cost is visible here: with the label
 * consuming the row, the readout is squeezed and can itself break across lines
 * mid-pair, since nothing pins `4,310 / 5,000 runs` together.
 */
export const LongContent: Story = {
  args: {
    resources: [
      {
        label: "Scheduled workflow runs across every connected automation in this workspace",
        used: 4310,
        limit: 5000,
        unit: "runs",
        resetsIn: "Resets in 3 days",
      },
      { label: "Messages", used: 1240, limit: 5000, resetsIn: "Resets in 3 days" },
    ],
  },
};

/**
 * 375px. The meter is a column of full-width rows, so it does not overflow —
 * what narrow width actually costs is the label/value pair, which is the first
 * thing to wrap once a long resource name meets a five-digit readout. The
 * `MCP calls` row is the one to watch: at this width it is close to the point
 * where the pair stops fitting on one line.
 */
export const Mobile: Story = {
  render: (args) => (
    <div className="w-[375px] max-w-full">
      <QuotaMeter {...args} />
    </div>
  ),
  args: {
    resources: [
      { label: "Messages", used: 4310, limit: 5000, resetsIn: "Resets in 3 days" },
      { label: "MCP calls", used: 12400, limit: 50000, resetsIn: "Resets in 3 days" },
      { label: "Video minutes", used: 6, limit: 30, unit: "min", resetsIn: "Resets in 3 days" },
    ],
  },
};

/**
 * M3 beside M2 `credits-indicator`. Both report what is left of a paid
 * allowance and they are not interchangeable — the rule is what the user is
 * about to do:
 *
 * - **Credits indicator** is one balance, always on screen, living in the app
 *   chrome. It answers "can I afford the next action?" and is a control: it
 *   clicks through to plan management and can offer a top-up.
 * - **Quota meter** is several allowances, on a page the user navigated to. It
 *   answers "which limit am I going to hit, and when does it come back?" and is
 *   a readout — nothing in it is clickable.
 *
 * If there is one number, it belongs in the chrome as M2. If the answer needs
 * more than one row, it is M3, and the reset countdown is the reason to put it
 * on a page rather than in a pill.
 */
export const Boundary: Story = {
  render: () => (
    <div className="flex w-full flex-col gap-6">
      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">Credits indicator — one balance, in the chrome</p>
        <div>
          <CreditsIndicator balance={320} total={5000} form="ring" onManage={() => {}} />
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">Quota meter — several allowances, on a page</p>
        <QuotaMeter
          resources={[
            { label: "Messages", used: 4310, limit: 5000, resetsIn: "Resets in 3 days" },
            { label: "Image generations", used: 34, limit: 200, resetsIn: "Resets in 3 days" },
          ]}
        />
      </section>
    </div>
  ),
};
