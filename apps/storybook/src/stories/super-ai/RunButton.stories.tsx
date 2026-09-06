import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { Button } from "@/components/ui/button";
import { CostProvider } from "@/registry/super-ai/cost";
import { MemberGateRow } from "@/registry/super-ai/member-gate-row";
import { PaywallMessage } from "@/registry/super-ai/paywall-message";
import { RunButton, type RunButtonState } from "@/registry/super-ai/run-button";
import { RunButtonDocs } from "@/content/components/run-button.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const meta: Meta<typeof RunButton> = {
  title: "Super AI/Run Button",
  component: RunButton,
  parameters: { layout: "centered", docs: { page: componentDocsPage(RunButtonDocs) } },
};

export default meta;
type Story = StoryObj<typeof RunButton>;

/**
 * The resting state, and the only one that shows what the click will cost
 * before it happens. `CostChip` renders here, in `done` and in `failed` — the
 * three states where a run is available — so the price is beside the trigger
 * at every point a user can start one, which is the spec's "cost, trigger and
 * progress in one control" reduced to its smallest form.
 */
export const Idle: Story = {
  args: {
    state: "idle",
    cost: 4,
    onRun: () => {},
  },
};

/**
 * The estimate is still being computed, so there is nothing honest to charge
 * for yet: the cost chip is gone and an estimate line stands in its place.
 * The trigger is natively `disabled`, and Cancel does not exist yet, so for
 * the length of the estimate the component has **no reachable control at all**
 * — `KeyboardOrder` records what that costs a keyboard user.
 */
export const Estimating: Story = {
  args: {
    state: "estimating",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("button", { name: "Generate" })).toBeDisabled();
    await expect(canvas.getByRole("status")).toHaveTextContent("Estimating cost…");
  },
};

/**
 * The state the spec is strictest about, and both of its rules are visible
 * here. The progress fill is drawn *inside* the control rather than as a
 * separate bar — the frame paints `bg-muted`, the fill sits behind a
 * transparent ghost trigger, and the label reads through it — and Cancel takes
 * a seat beside the busy trigger, because a generation you cannot stop burns
 * credits and trust.
 *
 * Omit `progress` and the same fill goes indeterminate; the `progressbar` then
 * reports no percentage.
 */
export const Running: Story = {
  args: {
    state: "running",
    progress: 60,
    onCancel: () => {},
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // A generation you can't stop burns credits and trust — Cancel has to be reachable.
    const cancel = canvas.getByRole("button", { name: /cancel/i });
    await expect(cancel).not.toBeDisabled();
    await userEvent.click(cancel);
  },
};

/**
 * The run resolved, and the control stays where it was rather than handing off
 * to a toast or a result panel: the trigger relabels to "Run again" and the
 * cost chip comes back, so a second run is priced before it is started.
 *
 * Nothing announces the success. The live region empties on the way out of
 * `running`, so a screen-reader user hears the run start and never hears it
 * finish — only `failed` speaks, through its `role="alert"`.
 */
export const Done: Story = {
  args: {
    state: "done",
    cost: 4,
    onRun: () => {},
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("button", { name: "Run again" })).toBeInTheDocument();
  },
};

/**
 * The failure lands on the control that caused it rather than in a toast, so
 * the reason and the retry are one glance apart. `errorMessage` is real text
 * with `role="alert"` and an `aria-describedby` link from the trigger, and the
 * `AlertCircle` glyph doubles the signal — colour alone never carries it.
 *
 * `errorMessage` is optional, and `EmptyLabel` shows what "Try again" looks
 * like with no reason attached.
 */
export const Failed: Story = {
  args: {
    state: "failed",
    errorMessage: "The model timed out. No credits were charged.",
    onRun: () => {},
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // The failure reads even with colour removed — the icon and the text both carry it.
    await expect(canvas.getByRole("alert")).toHaveTextContent("The model timed out.");
    await expect(canvas.getByRole("button", { name: "Try again" })).toBeInTheDocument();
  },
};

/**
 * A balance gate, and the point of it is the arithmetic. The trigger is
 * *replaced* rather than greyed out, and the shortfall spells both numbers, so
 * the user is told how far short they are instead of being refused. The docs
 * page's first don't is the same state built as a disabled button, which gives
 * them nothing to act on.
 *
 * Note what the component does not do: `insufficient-credits` arrives as a
 * prop. The cost contract (`registry/super-ai/cost.tsx`) exists to derive it
 * from an estimate and a balance, and this component predates the retrofit —
 * see `Controlled` for what that leaves unenforced.
 */
export const InsufficientCredits: Story = {
  args: {
    state: "insufficient-credits",
    cost: 6,
    balance: 2,
    onBuyCredits: () => {},
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/need 6 credits, you have 2/i)).toBeInTheDocument();
    await expect(canvas.queryByRole("button", { name: "Generate" })).not.toBeInTheDocument();
  },
};

/**
 * A plan gate, which is a different fact from an empty balance and needs a
 * different purchase: topping up will never unlock this, so the CTA is
 * "Upgrade to run" and not "Add credits". Collapsing the two into one disabled
 * state is the pitfall the docs page names, because it sells the wrong thing.
 */
export const Locked: Story = {
  args: {
    state: "locked",
    lockedReason: "Video generation is a Pro feature.",
    onUnlock: () => {},
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Same answer as hero-omnibox's locked state: the CTA replaces the
    // trigger in place, not a separate banner.
    await expect(canvas.queryByRole("button", { name: "Generate" })).not.toBeInTheDocument();
    await userEvent.click(canvas.getByRole("button", { name: "Upgrade to run" }));
  },
};

/* -------------------------------------------------------------------------
 * Case stories — the situations this control meets at the point of spend, as
 * opposed to the seven states above. See
 * docs/design-system/story-conventions.md.
 *
 * All eight are true for this component, so there are no `case-skip` lines.
 * Seven states on one control is what makes that so: it holds a value
 * (`Controlled`), it draws a fill that moves (`ReducedMotion`), it joins two
 * buttons into a group whose seam has a direction (`RTL`), four of its text
 * slots are optional (`EmptyLabel`) and three are author-supplied
 * (`LongContent`), and two of the seven states are monetization gates that
 * two other shipped components also claim (`Boundary`).
 * ---------------------------------------------------------------------- */

/**
 * The focus ring, measured the only way this environment can see it.
 *
 * Tailwind v4 draws the vendored `Button`'s ring by setting the **registered**
 * custom property `--tw-ring-shadow` under `:focus-visible`, and Chromium
 * reports `box-shadow` for such a value as the property's initial transparent
 * chain — so `getComputedStyle(el).boxShadow` never carries the ring itself.
 * That matters because the house assertion in the older case stories,
 * `boxShadow !== "none" || outlineStyle !== "none"`, is then true for *any*
 * element carrying a Tailwind shadow utility: measured here, a button written
 * `focus-visible:ring-0 outline-none` — no ring at all, the exact shape wave 1
 * recorded on `media-prompt-bar` — passes it.
 *
 * `--tw-ring-shadow` reads back `0 0 #0000` unfocused and
 * `0 0 0 calc(3px + 0px) color-mix(…)` focused, so the ring's width is
 * legible. `ring-0` yields `calc(0px + 0px)`, which this returns as 0.
 */
const ringWidth = (el: Element) => {
  const shadow = getComputedStyle(el).getPropertyValue("--tw-ring-shadow").trim();
  const drawn = /calc\(([\d.]+)px/.exec(shadow);
  return drawn ? Number(drawn[1]) : 0;
};

/**
 * Right-to-left, and the control splits three ways: two of its directional
 * decisions are logical and mirror correctly, one is physical and does not.
 *
 * **Mirrors.** `run-button.tsx` contains no physical direction class at all —
 * only `gap-*`, `inset-0` and `items-start` — so Cancel lands to the visual
 * left of the busy trigger and the cost chip leads at the right. The chip's
 * amount is pinned `dir="ltr"` inside `cost-chip`, so "4 credits" does not
 * reorder into "credits 4".
 *
 * **The progress fill mirrors too, and by accident of a good primitive.** Base
 * UI's `Progress.Indicator` positions itself with `inset-inline-start`, so the
 * fill grows from the right edge under RTL — the direction the run is actually
 * read in. Nothing in this repo asked for that.
 *
 * **The seam does not mirror.** The vendored `ButtonGroup` joins its children
 * with physical classes — `rounded-r-none`, `rounded-r-lg`, `rounded-l-none`,
 * `border-l-0` — so under `dir="rtl"` the group is inside out: measured here,
 * the trigger frame keeps its rounded corners on the **inner** seam edge and
 * square corners on the outer one, Cancel does the same in reverse, and
 * `border-l-0` strips the group's outer border while doubling it at the seam.
 * That lives in `components/ui/button-group.tsx`, not in this component, and
 * the swap to `rounded-e-*` / `border-s-0` is a vendored-primitive change — so
 * it is recorded here and not asserted, because pinning it would make it
 * permanent.
 *
 * One more thing this story is the record of: `<ButtonGroup
 * data-slot="run-button-group">` **overwrites** the primitive's own
 * `data-slot="button-group"`, because `ButtonGroup` spreads `props` after its
 * default. Nothing breaks today — the group's seam rules key off its own
 * `className` — but the `in-data-[slot=button-group]:rounded-lg` corrections
 * that the `xs`, `sm`, `icon-xs` and `icon-sm` button sizes carry would
 * silently not apply if Cancel were ever resized to one of them.
 */
export const RTL: Story = {
  render: () => (
    <div dir="rtl" className="flex flex-col items-start gap-4">
      <RunButton state="running" progress={60} onCancel={() => {}} data-testid="rtl-running" />
      <RunButton state="idle" cost={4} onRun={() => {}} data-testid="rtl-idle" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const running = canvas.getByTestId("rtl-running");
    const idle = canvas.getByTestId("rtl-idle");
    const rect = (el: Element | null) => (el as HTMLElement).getBoundingClientRect();

    // 1. Mirrored, not merely reordered in the DOM: the trigger is the first
    //    child and paints on the right, Cancel follows it to the left.
    const frame = rect(running.querySelector('[data-slot="run-button-trigger-frame"]'));
    const cancel = rect(running.querySelector('[data-slot="run-button-cancel"]'));
    await expect(frame.left).toBeGreaterThan(cancel.left);

    // 2. The fill grows from the inline start, which under RTL is the right
    //    edge — Base UI positions it with `inset-inline-start`, so its far
    //    edge meets the track's far edge and it eats leftward.
    const track = rect(running.querySelector('[data-slot="run-button-progress-track"]'));
    const fill = rect(running.querySelector('[data-slot="run-button-progress-indicator"]'));
    await expect(Math.round(fill.right)).toBe(Math.round(track.right));
    await expect(fill.left).toBeGreaterThan(track.left);

    // 3. The cost chip leads, so it sits to the right of the trigger it prices.
    const chip = idle.querySelector('[data-slot="cost-chip"]') as HTMLElement;
    const trigger = rect(idle.querySelector('[data-slot="run-button-trigger"]'));
    await expect(rect(chip).left).toBeGreaterThan(trigger.left);

    // 4. …and the number inside it stays a number: "4 credits", not "credits 4".
    await expect(chip.querySelector('[data-slot="cost-chip-amount"]')).toHaveAttribute("dir", "ltr");
  },
};

/**
 * `prefers-reduced-motion`, and this component has exactly one moving part to
 * answer for: the progress fill. There is no spinner anywhere in
 * `run-button.tsx` — the busy state is carried by a width that grows across
 * the button — so `transition-[width]` on the indicator *is* the motion, and
 * measured before this wave it ran at 0.15s under emulated reduce with no
 * branch at all.
 *
 * Fixed in-wave as a mechanical repair: `motion-reduce:transition-none` beside
 * the transition, which is the second of the two sanctioned idioms (a panel
 * that grows, not a colour crossfade). The fill still lands on every value it
 * is given; it stops sliding there. `vitest.config.ts` emulates reduce for
 * every test, so the assertion reads `transition-property` back off the live
 * element rather than checking for a class.
 *
 * **Not branched, deliberately:** the vendored `Button` carries `transition-all`
 * and a one-pixel `active:` press nudge with no reduced-motion path, so both
 * the trigger and Cancel still move a pixel when pressed. That is
 * library-wide press chrome outside `registry/super-ai/` — `CONTINUE.md` §8
 * records it as a primitive-wide posture — and no case story adds a class for
 * it here.
 */
export const ReducedMotion: Story = {
  args: { state: "running", progress: 40, onCancel: () => {} },
  play: async ({ canvasElement }) => {
    const fill = canvasElement.querySelector('[data-slot="run-button-progress-indicator"]') as HTMLElement;

    // The branch, not just its absence: the transition is still declared…
    await expect(fill.className).toContain("transition-[width]");
    // …and reduce suppresses it, so the fill jumps to each value instead.
    await expect(getComputedStyle(fill).transitionProperty).toBe("none");
  },
};

/**
 * The one keyboard fact the spec actually turns on: **while a run is in
 * flight, the only control this component offers a keyboard is the one that
 * stops it.** The trigger goes natively `disabled` and drops out of the tab
 * order, so a Tab arriving from outside lands on Cancel — "running must expose
 * Cancel" is a keyboard claim before it is a visual one, and this is where it
 * is proved.
 *
 * The stop count is not asserted, on purpose. It is different in every state
 * and two of those differences are open questions rather than settled
 * behaviour:
 *
 * - **`estimating` has no tab stops at all.** The trigger is `disabled` and
 *   Cancel is not mounted yet, so a keyboard user who tabbed to the trigger
 *   and pressed Enter is left with focus on `<body>` for the length of the
 *   estimate, and the next Tab restarts from the top of the page. An
 *   `aria-disabled` busy trigger would keep the stop; that is a design change,
 *   so it is recorded rather than pinned.
 * - **Both busy transitions drop focus**, in the same way and for the same
 *   reason: starting a run disables the element that was just activated, and
 *   ending one unmounts Cancel out from under the focus it was holding.
 *   Nothing catches it at either end. `run-button.docs.tsx` already carries
 *   this under `accessibility.focus`, and E6 `generation-queue` has the
 *   identical finding on its own rows (`CONTINUE.md` §9), so it is one
 *   behaviour across family E rather than this component's alone.
 *
 * There is also no Escape handler anywhere: Escape does not cancel a run, and
 * tabbing to Cancel is the only keyboard route to stopping one.
 */
export const KeyboardOrder: Story = {
  render: () => (
    <div className="flex flex-col items-start gap-4">
      <button type="button" data-testid="upstream">
        upstream control
      </button>
      <RunButton state="running" progress={40} onCancel={() => {}} data-testid="kb-running" />
      <RunButton state="idle" cost={4} onRun={() => {}} data-testid="kb-idle" />
      <button type="button" data-testid="downstream">
        downstream control
      </button>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const running = canvas.getByTestId("kb-running");
    const idle = canvas.getByTestId("kb-idle");
    const cancel = running.querySelector('[data-slot="run-button-cancel"]') as HTMLElement;
    const busyTrigger = running.querySelector('[data-slot="run-button-trigger"]') as HTMLElement;
    const idleTrigger = idle.querySelector('[data-slot="run-button-trigger"]') as HTMLElement;

    const nameOf = (el: Element | null) =>
      el === null ? "nothing" : (el.getAttribute("data-testid") ?? el.getAttribute("data-slot") ?? el.tagName);

    // Unfocused, nothing draws a ring — so the assertions below are about a
    // treatment that arrives with focus, not one that is always painted.
    await expect(ringWidth(cancel)).toBe(0);
    await expect(ringWidth(idleTrigger)).toBe(0);

    const assertVisiblyFocused = async (el: HTMLElement) => {
      const id = nameOf(el);
      await expect(`${id} focusVisible=${el.matches(":focus-visible")}`).toBe(`${id} focusVisible=true`);
      await expect(`${id} ringWidth=${ringWidth(el) > 0}`).toBe(`${id} ringWidth=true`);
    };

    // 1. Arriving from outside, the first stop inside the running control is
    //    Cancel. The busy trigger is `disabled` and is stepped over.
    canvas.getByTestId("upstream").focus();
    await userEvent.tab();
    await expect(nameOf(document.activeElement)).toBe("run-button-cancel");
    await expect(busyTrigger).toBeDisabled();
    await assertVisiblyFocused(cancel);

    // 2. …and it is a real stop, not a decoration: Enter reaches onCancel.
    //    (Asserted through the DOM contract rather than a spy — every control
    //    here is a real `button`, so Space and Enter both activate.)
    await expect(cancel.tagName).toBe("BUTTON");
    await expect(cancel).toHaveAttribute("aria-label", "Cancel");

    // 3. The next Tab leaves the running control entirely — one stop, not two
    //    — and lands straight on the next component's live trigger. Straight,
    //    because `CostChip` is a `span`: pricing never adds a stop between the
    //    user and the button they came for.
    await userEvent.tab();
    await expect(nameOf(document.activeElement)).toBe("run-button-trigger");
    await expect(running.contains(document.activeElement)).toBe(false);
    await assertVisiblyFocused(idleTrigger);

    // 4. …and one Tab past that leaves the component, so a run button never
    //    holds focus longer than the controls it actually renders.
    await userEvent.tab();
    await expect(nameOf(document.activeElement)).toBe("downstream");
  },
};

/**
 * `state` is the held value and this component holds none of it: the file has
 * no `useState`, so every one of the seven states is whatever the host last
 * rendered. This shell drives it the hard way — it records what the control
 * asked for and applies it only when told to.
 *
 * In order: clicking Generate does not start anything; `onRun` still fires, so
 * the host has the signal it needs; a re-render with an unchanged `state`
 * leaves it idle; and applying the request is what produces the progressbar.
 * The last step is the one that separates this from a screenshot — an
 * optimistic "run started" rendered inside the component would have moved on
 * the first click, and no assertion afterwards could tell the two apart.
 *
 * `onRun`, `onCancel`, `onBuyCredits` and `onUnlock` all take no argument.
 * That is right for this shape — the host mounted the control, so it already
 * knows which job was requested — but it also means the callbacks carry no
 * evidence of *which* state the control was in when it was clicked.
 *
 * **What is not enforced, and it is the important one.** `insufficient-credits`
 * is accepted as a prop rather than derived. The registry ships a cost
 * contract (`registry/super-ai/cost.tsx`) whose whole purpose is that
 * `insufficient` and the shortfall are computed from one estimate and one
 * balance, so a run button and a paywall card cannot disagree about the same
 * job — and `CONTINUE.md` §5 records that this component and E7
 * `member-gate-row` are the two cost placements that still do not call
 * `useCost`. Until they do, a host can hand this control
 * `state="insufficient-credits"` with `cost={1}` and `balance={999}` and it
 * will render "Need 1 credits, you have 999" without complaint. Not asserted,
 * because the retrofit is meant to make it impossible.
 */
export const Controlled: Story = {
  render: () => <ControlledShell />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const runIsShowing = () => canvasElement.querySelector('[role="progressbar"]') !== null;

    await expect(runIsShowing()).toBe(false);

    // 1. Interaction alone does not move the rendered value.
    await userEvent.click(canvas.getByRole("button", { name: "Generate" }));
    await expect(runIsShowing()).toBe(false);
    await expect(canvas.getByRole("button", { name: "Generate" })).toBeInTheDocument();

    // 2. …but the callback fired, which is the whole payload a host needs here.
    await expect(canvas.getByTestId("requested")).toHaveTextContent("running");

    // 3. Re-render with an unchanged `state`. Prove the re-render first.
    await expect(canvas.getByTestId("render-pass")).toHaveTextContent("1");
    await userEvent.click(canvas.getByRole("button", { name: "Re-render" }));
    await expect(canvas.getByTestId("render-pass")).toHaveTextContent("2");
    await expect(runIsShowing()).toBe(false);

    // 4. Applying the request is what starts the run.
    await userEvent.click(canvas.getByRole("button", { name: "Apply" }));
    await waitFor(() => expect(runIsShowing()).toBe(true));

    // 5. And the same contract holds in the other direction: Cancel asks, it
    //    does not stop. The run is still on screen after the click.
    await userEvent.click(canvas.getByRole("button", { name: "Cancel" }));
    await expect(canvas.getByTestId("requested")).toHaveTextContent("failed");
    await expect(runIsShowing()).toBe(true);
  },
};

function ControlledShell() {
  const [applied, setApplied] = React.useState<RunButtonState>("idle");
  const [requested, setRequested] = React.useState<RunButtonState | null>(null);
  const [pass, setPass] = React.useState(1);

  return (
    <div className="flex items-start gap-6">
      <RunButton
        state={applied}
        cost={4}
        progress={45}
        onRun={() => setRequested("running")}
        onCancel={() => setRequested("failed")}
      />

      <div className="flex flex-col gap-4 py-1">
        <dl className="text-foreground grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs">
          <dt>state prop</dt>
          <dd data-testid="applied">{applied}</dd>
          <dt>last request</dt>
          <dd data-testid="requested">{requested ?? "—"}</dd>
          <dt>host render pass</dt>
          <dd data-testid="render-pass" className="tabular-nums">
            {pass}
          </dd>
        </dl>

        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setPass((n) => n + 1)}>
            Re-render
          </Button>
          <Button size="sm" disabled={requested === null} onClick={() => requested && setApplied(requested)}>
            Apply
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Every optional text slot omitted at once — and the point is that four of the
 * seven states degrade **quietly**, with no gate anywhere to notice.
 *
 * - `failed` with no `errorMessage` renders "Try again" and nothing else. No
 *   `role="alert"` mounts, so nothing is announced, and the trigger's
 *   `aria-describedby` is dropped: the retry is offered with the reason
 *   deleted.
 * - `insufficient-credits` with no `balance` falls all the way back to "Not
 *   enough credits" — note that supplying `cost` alone is not enough, both
 *   numbers are needed. That string is the docs page's own first pitfall
 *   rendered by the component's default path: the state without its arithmetic
 *   is a refusal.
 * - `locked` with no `lockedReason` is a bare "Upgrade to run", which is the
 *   upsell without the feature it is selling.
 * - `idle` with no `cost` simply has no chip. The trigger looks finished and
 *   says nothing about spending anything.
 *
 * What is deliberately *not* here is `label=""`. Every button label on this
 * component is defaulted, so the only way to reach an unnamed control is for a
 * caller to override one with an empty string — which would ship an axe
 * `button-name` violation into a gate running at `test: "error"`. That case
 * belongs in the docs page's donts, the same call `suggestion-chips` and
 * `quote-reply` record for their own labels.
 */
export const EmptyLabel: Story = {
  render: () => (
    <div className="flex flex-col items-start gap-4">
      <RunButton state="failed" onRun={() => {}} data-testid="bare-failed" />
      <RunButton state="insufficient-credits" cost={6} onBuyCredits={() => {}} data-testid="bare-short" />
      <RunButton state="locked" onUnlock={() => {}} data-testid="bare-locked" />
      <RunButton state="idle" onRun={() => {}} data-testid="bare-idle" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // A failure with no reason: nothing announced, nothing described.
    const failed = canvas.getByTestId("bare-failed");
    await expect(failed.querySelector('[role="alert"]')).toBeNull();
    await expect(failed.querySelector('[data-slot="run-button-trigger"]')).not.toHaveAttribute("aria-describedby");
    await expect(within(failed).getByRole("button")).toHaveAccessibleName("Try again");

    // A shortfall with no arithmetic: `cost` alone does not rescue it.
    await expect(canvas.getByTestId("bare-short")).toHaveTextContent("Not enough credits");

    // A gate with no reason, and a price with no chip.
    await expect(canvas.getByTestId("bare-locked").querySelector('[data-slot="run-button-locked-reason"]')).toBeNull();
    await expect(canvas.getByTestId("bare-idle").querySelector('[data-slot="cost-chip"]')).toBeNull();

    // Every control is still named — which is why none of the above trips a gate.
    for (const name of ["Try again", "Add credits", "Upgrade to run", "Generate"]) {
      canvas.getByRole("button", { name });
    }
  },
};

/**
 * A 90-character run label and a 90-character failure reason, and the control
 * gives them two different answers.
 *
 * The **trigger never wraps and never truncates**. The vendored `Button` is
 * `whitespace-nowrap` with no `text-overflow`, so a long verb simply widens
 * the button — measured here past 375px, from a control that is 88px wide with
 * its default label — and the cost chip beside it is pushed along with it. The
 * row that holds the two has `flex-nowrap`, so nothing folds. That is the B4
 * trap in family E's clothing, and the argument for keeping run labels short
 * rather than descriptive.
 *
 * The **error text wraps**, because it is a `span` in the root's `flex-col`
 * with no nowrap of its own. So the half of this control that is author-prose
 * behaves, and the half that is a button does not — worth knowing before
 * putting a sentence in `label`.
 */
export const LongContent: Story = {
  render: () => (
    <div className="flex flex-col items-start gap-4">
      <RunButton
        state="idle"
        cost={4}
        label="Upscale every selected frame to 4K and re-render the whole sequence at the new model settings"
        onRun={() => {}}
        data-testid="long-label"
      />
      <div className="w-[24rem] max-w-full">
        <RunButton
          state="failed"
          cost={4}
          errorMessage="The model timed out after 60 seconds while decoding frame 214. No credits were charged."
          onRun={() => {}}
          data-testid="long-error"
        />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas
      .getByTestId("long-label")
      .querySelector('[data-slot="run-button-trigger"]') as HTMLElement;
    const style = getComputedStyle(trigger);

    // One line, no ellipsis, and wider than a phone.
    await expect(style.whiteSpace).toBe("nowrap");
    await expect(style.textOverflow).toBe("clip");
    await expect(trigger.getBoundingClientRect().width).toBeGreaterThan(375);

    // The row it sits in does not fold either — the chip goes with it.
    const controls = canvas
      .getByTestId("long-label")
      .querySelector('[data-slot="run-button-controls"]') as HTMLElement;
    await expect(getComputedStyle(controls).flexWrap).toBe("nowrap");

    // The failure reason takes the opposite answer: it wraps to a second line.
    const error = canvas.getByTestId("long-error").querySelector('[data-slot="run-button-error"]') as HTMLElement;
    await expect(getComputedStyle(error).whiteSpace).toBe("normal");
    await expect(error.getBoundingClientRect().height).toBeGreaterThan(
      Number.parseFloat(getComputedStyle(error).lineHeight),
    );
  },
};

/**
 * 375px, showing the three states that put two things side by side or spend
 * two lines — the only ones where the width is in question. The other four are
 * a single button.
 *
 * All three fit, and the reason is that every gate here is a **short CTA plus
 * a number**, not a sentence: the shortfall row measures about 300px of the
 * 375 available, and the busy control with Cancel beside it about 150px.
 * Nothing in this component scrolls, so the fit is structural rather than
 * managed — which is exactly why `LongContent` is the story that breaks it.
 * A run label of any length at all is what puts this control off a phone.
 *
 * The failure reason is the one part that adapts: it wraps to a second line
 * inside the column rather than widening it.
 */
export const Mobile: Story = {
  render: () => (
    <div className="w-[375px] max-w-full" data-testid="viewport">
      <div className="flex flex-col items-start gap-4">
        <RunButton state="running" progress={45} onCancel={() => {}} data-testid="m-running" />
        <RunButton state="insufficient-credits" cost={6} balance={2} onBuyCredits={() => {}} data-testid="m-short" />
        <RunButton
          state="failed"
          cost={4}
          errorMessage="The model timed out after 60 seconds. No credits were charged."
          onRun={() => {}}
          data-testid="m-failed"
        />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const viewport = canvas.getByTestId("viewport");

    // No horizontal scroll at 375px, and no scroll container hiding one.
    await expect(viewport.scrollWidth).toBeLessThanOrEqual(viewport.clientWidth);

    for (const id of ["m-running", "m-short", "m-failed"]) {
      const width = canvas.getByTestId(id).getBoundingClientRect().width;
      await expect(`${id} fits=${width <= 375}`).toBe(`${id} fits=true`);
    }

    // The reason wraps rather than pushing the column wider.
    const error = canvas.getByTestId("m-failed").querySelector('[data-slot="run-button-error"]') as HTMLElement;
    await expect(error.getBoundingClientRect().height).toBeGreaterThan(
      Number.parseFloat(getComputedStyle(error).lineHeight),
    );
  },
};

/**
 * Three shipped components claim "you cannot run this yet", and from a
 * screenshot they overlap badly. The rule is **where the user is standing
 * relative to the spend**:
 *
 * - **E5 run button** — at the trigger, in the second before the money leaves.
 *   The gate replaces the control in place, so there is never a live-looking
 *   button next to a notice saying it is not. Both of its gates are one line
 *   and one CTA, because the user is mid-task.
 * - **E7 member gate row** — in a feature list, long before any spend. The
 *   feature stays visible with a tier badge, because hiding paid features
 *   hides the reason to pay, and the switch reveals the upsell inline rather
 *   than opening a modal.
 * - **M5 paywall message** — after the attempt, inside the conversation. It is
 *   the only one of the three that **holds the work**: the prompt and model
 *   are kept so that upgrading resumes the exact job instead of asking for it
 *   again.
 *
 * So: if the user has already asked and you had to stop, that is M5. If they
 * are browsing what a plan includes, that is E7. If their finger is on the
 * button, it is this one. And the number in all three should come from the
 * same estimate — M5 already derives affordability through the cost contract,
 * which is the retrofit E5 is still waiting on (`CONTINUE.md` §5).
 */
export const Boundary: Story = {
  render: () => (
    <div className="flex w-full max-w-lg flex-col gap-6">
      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">E5 run button — at the trigger, mid-task</p>
        <RunButton state="insufficient-credits" cost={6} balance={2} onBuyCredits={() => {}} />
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">E7 member gate row — in a feature list, before the spend</p>
        <MemberGateRow
          label="4K export"
          description="Render at full resolution"
          state="locked"
          tier="Pro"
          onRequestUpgrade={() => {}}
        />
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">M5 paywall message — after the attempt, holding the work</p>
        <CostProvider balance={2} onTopUp={() => {}}>
          <PaywallMessage
            state="quota-exhausted"
            prompt="A slow dolly across a rain-lit Tokyo alley at night, neon reflections in the puddles"
            model="Veo 3.1"
            requirement="Pro"
            cost={{ amount: 6 }}
            before="You are out of credits for this cycle, so I stopped before starting the render."
            onUpgrade={() => {}}
          />
        </CostProvider>
      </section>
    </div>
  ),
};
