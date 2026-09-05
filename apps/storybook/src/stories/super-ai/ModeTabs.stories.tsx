import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { Clapperboard, MessageSquare, PenLine, Search, Sparkles, Users } from "lucide-react";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { Button } from "@/components/ui/button";
import { ChoiceChip, ChoiceChips } from "@/registry/super-ai/choice-chips";
import { ModeTabs } from "@/registry/super-ai/mode-tabs";
import { ModeTabsDocs } from "@/content/components/mode-tabs.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const meta: Meta<typeof ModeTabs> = {
  title: "Super AI/Mode Tabs",
  component: ModeTabs,
  parameters: { layout: "centered", docs: { page: componentDocsPage(ModeTabsDocs) } },
};

export default meta;
type Story = StoryObj<typeof ModeTabs>;

/** Manus's Design/Build, plus the Ask the spec pairs it with. */
const ASK_DESIGN_BUILD = [
  { value: "ask", label: "Ask", icon: <MessageSquare /> },
  { value: "design", label: "Design", icon: <PenLine /> },
  { value: "build", label: "Build", icon: <Sparkles /> },
];

/** Claude's Chat/Cowork. */
const CHAT_COWORK = [
  { value: "chat", label: "Chat", icon: <MessageSquare /> },
  { value: "cowork", label: "Cowork", icon: <Users /> },
];

/**
 * Five, the spec's ceiling — the same vocabulary the docs module's
 * `TooManyModes` don't uses, one short of the sixth that breaks it.
 */
const FIVE_MODES = [
  { value: "ask", label: "Ask", icon: <MessageSquare /> },
  { value: "design", label: "Design", icon: <PenLine /> },
  { value: "build", label: "Build", icon: <Sparkles /> },
  { value: "review", label: "Review", icon: <Search /> },
  { value: "ship", label: "Ship", icon: <Clapperboard /> },
];

/**
 * Two modes, no icons — the smallest thing the spec allows and the shape
 * Claude's Chat/Cowork ships as. Worth looking at because it is the variant
 * with no glyph to lean on: the whole affordance is the filled background on
 * the pressed trigger, so this is where the selected/unselected contrast has
 * to survive on its own.
 */
export const TextOnly: Story = {
  args: {
    modes: [
      { value: "chat", label: "Chat" },
      { value: "cowork", label: "Cowork" },
    ],
    defaultValue: "chat",
  },
};

/**
 * Icon plus visible label, which is the variant to reach for once the modes
 * have obvious glyphs and the row still has room. The icon is decorative on
 * purpose — it sits in an `aria-hidden` span and contributes nothing to the
 * accessible name, so what a screen reader hears here is byte-identical to
 * `TextOnly`. Three modes with `design` pre-selected is the docs page's own
 * `ValidModeCount` example, rendered at the size the catalog uses it.
 */
export const WithIcon: Story = {
  args: {
    modes: ASK_DESIGN_BUILD,
    variant: "with-icon",
    defaultValue: "design",
  },
};

/**
 * Icon-only triggers for a cramped surface — an embedded composer toolbar,
 * a node header. The label does not disappear, it goes `sr-only`, so the
 * tooltip repeats a name that already exists rather than being the only copy
 * of it. That is the difference between this and the docs page's
 * `TooltipOnlyLabel` don't, and it is the reason this variant is safe to use
 * at all. See `EmptyLabel` for the name and the tap target measured.
 */
export const WithTooltip: Story = {
  args: {
    modes: CHAT_COWORK,
    variant: "with-tooltip",
    defaultValue: "chat",
  },
};

/* -------------------------------------------------------------------------
 * Case stories — the situations this component meets in a product, as
 * opposed to the prop combinations above. See
 * docs/design-system/story-conventions.md for the eight and the rule for
 * deciding which are true.
 *
 * All eight are true here, so nothing is skipped. The component is
 * directional, animates through a Base UI tooltip, is a composite with a
 * roving tabindex, exposes a real `value`/`onValueChange` pair, has an
 * icon-only presentation with no visible label, takes author-supplied mode
 * labels, has to survive 375px at its own five-mode ceiling, and sits next
 * to a chip row built on the same primitive that means something else.
 * ---------------------------------------------------------------------- */

/**
 * Right-to-left. The row is `flex flex-row` and each trigger is an
 * `inline-flex` with the icon first in DOM order, so both axes mirror: the
 * modes read Ask → Design → Build from the right edge leftward, and each
 * icon sits to the right of its own label. For an ordered progression that
 * is the correct reading, and it comes for free — nothing physical reaches
 * this component. The toggle group's `first:rounded-l-lg` / `last:rounded-r-lg`
 * corner rules are gated behind `data-[spacing=0]` and the group ships at
 * the default spacing of 2, and the `has-data-[icon=inline-start]:pl-2`
 * padding hooks need a `data-icon` attribute `mode-tabs.tsx` never sets. So
 * there is no physical-to-logical class swap to make here.
 *
 * **Defect, recorded not fixed — the arrow keys do not mirror.** Base UI's
 * `CompositeRoot` decides which arrow advances from `useDirection()`, and
 * that hook returns `"ltr"` unless a `DirectionProvider` is mounted above it
 * (`internals/direction-context/DirectionContext.js`: `context?.direction ??
 * 'ltr'`). Nothing in this repo mounts one, and `dir="rtl"` on a wrapper is
 * invisible to React context. So in the row below ArrowRight still advances
 * to the next item in DOM order — which is painted to the *left* — and the
 * highlight walks backwards from the reader's point of view.
 *
 * The fix is a `DirectionProvider` at the app shell, or the primitive
 * reading `dir` off the DOM; neither is this component's file, and
 * `account-menu` has already recorded the same root cause for popup side
 * resolution. Deliberately unasserted: a play function pinning "ArrowRight
 * advances under RTL" would lock the wrong behaviour in, so `KeyboardOrder`
 * makes its arrow claims in LTR only.
 */
export const RTL: Story = {
  args: { modes: ASK_DESIGN_BUILD, variant: "with-icon", defaultValue: "design" },
  render: (args) => (
    <div dir="rtl" className="w-full">
      <ModeTabs {...args} />
    </div>
  ),
};

/**
 * The reduced-motion branch, which for this component is entirely the
 * tooltip. The triggers themselves carry `transition-all` from the shared
 * `toggleVariants`, but nothing in that transition moves: the pressed state
 * is a background fill, the hover state is a background and a text colour,
 * and the focus treatment is a ring. No transform, no size change, no
 * position change — so `motion-reduce:transition-none` there would document
 * no branch (the convention's `reset-affordance` precedent), and the class
 * lives in `components/ui/toggle.tsx`, which this component does not own.
 *
 * The tooltip is different: it enters with `data-open:animate-in fade-in-0
 * zoom-in-95` plus a side slide, and it is a Base UI popup, where the
 * registry's usual bare `motion-reduce:animate-none` is inert and inert
 * quietly — `data-open:animate-in` compiles to a data-attribute selector
 * that wins the tie on source order, the class sits in the string doing
 * nothing, and the only way to notice is to read `animation-name` back.
 *
 * **Fixed in-wave (mechanical).** `TooltipContent` in `mode-tabs.tsx` now
 * carries `motion-reduce:data-open:animate-none
 * motion-reduce:data-closed:animate-none`, the same pair `modality-rail.tsx`
 * already puts on the same primitive; `shortcuts-sheet` is where the
 * mechanism was measured. `vitest.config.ts` emulates
 * `prefers-reduced-motion: reduce` for every test, so the assertion below is
 * the rendered result rather than a class-name check — it reads
 * `animation-name` off the popup while `data-open` is still on it. Against
 * the bare class it read `"enter"`.
 */
export const ReducedMotion: Story = {
  args: { modes: CHAT_COWORK, variant: "with-tooltip", defaultValue: "chat" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Zero delay comes from `TooltipProvider`'s own default, so the hover
    // opens it without a timer to wait out.
    await userEvent.hover(canvas.getByRole("button", { name: "Cowork" }));

    let tooltip: HTMLElement | null = null;
    await waitFor(() => {
      tooltip = document.querySelector<HTMLElement>('[data-slot="tooltip-content"]');
      if (!tooltip) throw new Error("the tooltip never opened");
    });

    const popup = tooltip as unknown as HTMLElement;
    await expect(popup).toHaveAttribute("data-open");
    await expect(getComputedStyle(popup).animationName).toBe("none");
  },
};

/**
 * A mode row is **one** tab stop, not one per mode, and that is the whole
 * story. `ToggleGroup` is a Base UI composite: exactly one trigger carries
 * `tabindex="0"` and the rest carry `-1`, arrows move the highlight between
 * them, and the next Tab leaves the group entirely. The two sentinel buttons
 * either side are there so "leaves the group" is a thing that can be
 * asserted rather than described.
 *
 * Four claims, all of them the component's contract rather than the
 * primitive's trivia:
 *
 * 1. **One stop for three modes**, and the invariant holds after the
 *    highlight moves — still exactly one tabbable trigger, just a different
 *    one. This is what keeps a five-mode row from costing a keyboard user
 *    five presses to get past it.
 * 2. **Arrows move the highlight and nothing else.** The pressed mode is
 *    unchanged after a full lap of the row, so someone can walk the modes
 *    without switching the working context underneath them. The docs
 *    module's keyboard section states this; here it is checked.
 * 3. **The row loops.** `loopFocus` defaults to `true` on the composite, so
 *    arrowing off the end lands back on the start. Walked as exactly one
 *    lap — three arrow presses for three modes, each stop new — rather than
 *    as a budgeted "did we reach them all in N tries", which is the
 *    environment-sensitive shape the convention warns about.
 * 4. **Enter commits**, and it commits the mode the highlight is actually
 *    on. That is the pair to claim 2: arrows are safe, Enter is the decision.
 *
 * Every stop is also checked to be genuinely focus-visible and to paint a
 * ring — `toggleVariants` sets `outline-none` and replaces it with
 * `focus-visible:ring-[3px]`, so a broken ring here leaves a keyboard user
 * with no cursor at all rather than with a default one.
 *
 * **Defect, recorded not fixed — Tab lands on the first mode, not the
 * active one.** The row below opens on `design`, and tabbing in puts focus
 * on `Ask`: Base UI's composite highlights index 0 until something moves it,
 * so a user tabbing into a row has to arrow across to reach the mode they
 * are already in. The APG radiogroup pattern puts the stop on the checked
 * option for exactly this reason; the toolbar pattern this primitive
 * implements does not, and `modality-rail` records the identical finding on
 * the identical primitive. Fixing it means driving `highlightedIndex` from
 * `value`, which is a change to the component's composite wiring rather than
 * to this story. So the assertions below say *how many* stops there are and
 * that focus is inside the group, never *which* trigger holds it — they
 * survive the fix instead of holding the bug in place.
 */
export const KeyboardOrder: Story = {
  args: { modes: ASK_DESIGN_BUILD, variant: "with-icon", defaultValue: "design" },
  render: (args) => (
    <div className="flex items-center gap-3">
      <Button variant="outline" size="sm">
        Before
      </Button>
      <ModeTabs {...args} />
      <Button variant="outline" size="sm">
        After
      </Button>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const list = canvasElement.querySelector<HTMLElement>('[data-slot="mode-tabs-list"]')!;
    const tabbableIn = (root: HTMLElement) =>
      Array.from(root.querySelectorAll<HTMLElement>('button:not([tabindex="-1"])'));
    const pressed = () =>
      canvas
        .getAllByRole("button")
        .filter((b) => b.getAttribute("aria-pressed") === "true")
        .map((b) => b.textContent?.trim());
    const nameOf = (el: Element | null) => el?.textContent?.trim() ?? "nothing";

    const assertVisiblyFocused = async (el: HTMLElement) => {
      const id = nameOf(el);
      await expect(`${id} focusVisible=${el.matches(":focus-visible")}`).toBe(`${id} focusVisible=true`);
      const style = getComputedStyle(el);
      await expect(`${id} ring=${style.boxShadow !== "none" || style.outlineStyle !== "none"}`).toBe(
        `${id} ring=true`,
      );
    };

    // 1. Three modes, one stop.
    await expect(list.querySelectorAll("button")).toHaveLength(3);
    await expect(tabbableIn(list)).toHaveLength(1);
    await expect(pressed()).toEqual(["Design"]);

    // Tab in from the control before the row.
    canvas.getByRole("button", { name: "Before" }).focus();
    await userEvent.tab();
    const start = document.activeElement as HTMLElement;
    await expect(list.contains(start)).toBe(true);
    await assertVisiblyFocused(start);

    // 2 + 3. Exactly one lap: three presses for three modes, every stop new,
    // and the third lands back where it began because the composite loops.
    const seen = new Set<HTMLElement>([start]);
    for (let i = 1; i < 3; i += 1) {
      await userEvent.keyboard("{ArrowRight}");
      const focused = document.activeElement as HTMLElement;
      await expect(`${nameOf(focused)} inList=${list.contains(focused)}`).toBe(
        `${nameOf(focused)} inList=true`,
      );
      await expect(`${nameOf(focused)} repeat=${seen.has(focused)}`).toBe(`${nameOf(focused)} repeat=false`);
      await assertVisiblyFocused(focused);
      // The roving invariant, restated after the move.
      await expect(tabbableIn(list)).toHaveLength(1);
      await expect(tabbableIn(list)[0]).toBe(focused);
      seen.add(focused);
    }
    await expect(seen.size).toBe(3);
    await userEvent.keyboard("{ArrowRight}");
    await expect(nameOf(document.activeElement)).toBe(nameOf(start));

    // 2, restated: a whole lap of the row changed no mode.
    await expect(pressed()).toEqual(["Design"]);

    // 4. Enter commits the highlighted mode — read off where focus actually
    // is, not off an assumed first item.
    const committed = nameOf(document.activeElement);
    await userEvent.keyboard("{Enter}");
    await waitFor(() => expect(pressed()).toEqual([committed]));

    // …and the next Tab leaves the group entirely.
    await userEvent.tab();
    await waitFor(() => expect(document.activeElement).toBe(canvas.getByRole("button", { name: "After" })));
  },
};

/**
 * `value` / `onValueChange` is a real controlled pair — `value` wins over
 * the internal state on every render (`valueProp ?? internal`) — and this is
 * the only place that is checked rather than asserted in prose. It matters
 * more here than for most controlled components because the spec says the
 * selected mode "must survive a reload": an app that persists mode to a URL
 * or a server setting drives this component from that store, so the store
 * has to be the thing that decides what is lit.
 *
 * The host below is deliberately a slow one. It records the request and only
 * applies it when "Apply" is pressed, which separates the two halves a
 * consumer has to trust:
 *
 * 1. **`value` wins over interaction.** Clicking Cowork while the host still
 *    says `chat` moves no `aria-pressed`.
 * 2. **`onValueChange` hands back the payload needed to apply it** — the
 *    mode's own `value` string, not an event and not an array. The array is
 *    the primitive's shape; unwrapping it is this component's job.
 * 3. **An unchanged `value` holds the row fixed across re-renders.** The
 *    render counter is checked to have advanced *before* the selection is
 *    checked not to have, so the assertion cannot pass by the re-render
 *    never happening.
 * 4. **Re-pressing the active mode reports nothing.** Base UI's toggle group
 *    is a multi-select toggle set, not a radio group, and commits an empty
 *    array when you press the lit item; `handleValueChange` drops that. A
 *    shell driving `value` from `onValueChange` can therefore never be
 *    handed "no mode", which is what makes a mode safe to persist. That is
 *    the component's own behaviour rather than the primitive's, which is why
 *    it is pinned here.
 */
export const Controlled: Story = {
  render: () => <ControlledHost />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const chat = canvas.getByRole("button", { name: "Chat" });
    const cowork = canvas.getByRole("button", { name: "Cowork" });
    await expect(chat).toHaveAttribute("aria-pressed", "true");

    // 1. Interaction alone does not move the rendered value.
    await userEvent.click(cowork);
    await expect(chat).toHaveAttribute("aria-pressed", "true");
    await expect(cowork).toHaveAttribute("aria-pressed", "false");

    // 2. …but the callback fired, with the string the host needs.
    await expect(canvas.getByTestId("requested")).toHaveTextContent("cowork");

    // 3. Re-render with an unchanged `value`. Prove the re-render first.
    await expect(canvas.getByTestId("render-pass")).toHaveTextContent("1");
    await userEvent.click(canvas.getByRole("button", { name: "Re-render" }));
    await expect(canvas.getByTestId("render-pass")).toHaveTextContent("2");
    await expect(chat).toHaveAttribute("aria-pressed", "true");
    await expect(cowork).toHaveAttribute("aria-pressed", "false");

    // The payload was sufficient to apply the change.
    await userEvent.click(canvas.getByRole("button", { name: "Apply" }));
    await expect(cowork).toHaveAttribute("aria-pressed", "true");
    await expect(chat).toHaveAttribute("aria-pressed", "false");

    // 4. Pressing the now-active mode again reports nothing, so the store is
    //    never asked to persist "no mode".
    await userEvent.click(canvas.getByTestId("clear-request"));
    await expect(canvas.getByTestId("requested")).toHaveTextContent("—");
    await userEvent.click(cowork);
    await expect(canvas.getByTestId("requested")).toHaveTextContent("—");
    await expect(cowork).toHaveAttribute("aria-pressed", "true");
  },
};

function ControlledHost() {
  const [applied, setApplied] = React.useState("chat");
  const [requested, setRequested] = React.useState<string | null>(null);
  const [pass, setPass] = React.useState(1);

  return (
    <div className="flex items-start gap-6">
      <ModeTabs
        modes={[
          { value: "chat", label: "Chat" },
          { value: "cowork", label: "Cowork" },
        ]}
        value={applied}
        onValueChange={setRequested}
      />

      <div className="flex flex-col gap-4">
        <dl className="text-foreground grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs">
          <dt>value prop</dt>
          <dd data-testid="applied">{applied}</dd>
          <dt>last onValueChange</dt>
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
          <Button size="sm" disabled={!requested} onClick={() => requested && setApplied(requested)}>
            Apply
          </Button>
          <Button size="sm" variant="ghost" data-testid="clear-request" onClick={() => setRequested(null)}>
            Clear
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * The no-visible-label rendering, which for this component is the
 * `with-tooltip` variant: the icon is `aria-hidden`, the label is `sr-only`,
 * and nothing readable is left on screen. This is the shape that usually
 * ships broken, so two things are measured rather than described.
 *
 * **The name exists before the tooltip does.** The assertions below query by
 * accessible name with no tooltip open anywhere in the document — the
 * `sr-only` span is doing the work, and the tooltip is a sighted-user hint
 * layered on top. The docs page's `TooltipOnlyLabel` don't is the same
 * markup without that span, and it announces nothing until a hover a
 * keyboard user never performs.
 *
 * **The tap target is 32px on its short axis**, from the shared toggle's
 * `h-8 min-w-8`. That clears WCAG 2.2 AA 2.5.8 (24×24) and is under AAA
 * 2.5.5 (44×44). It is the system-wide toggle size rather than anything this
 * component chose, so it is recorded here rather than fixed here; the number
 * is asserted so that a future size change has to come past this story.
 *
 * There is no truly empty slot to render: `mode.label` is a required string
 * and the group's own `label` defaults to "Mode". `label=""` would ship an
 * unnamed button — a caller error, and an axe `button-name` violation in a
 * gate running at `test: "error"` — so it belongs in the docs page's donts,
 * where it is.
 */
export const EmptyLabel: Story = {
  args: { modes: CHAT_COWORK, variant: "with-tooltip", defaultValue: "chat" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Nothing has been hovered or focused, so no tooltip exists yet.
    await expect(document.querySelector('[data-slot="tooltip-content"]')).toBeNull();

    for (const label of ["Chat", "Cowork"]) {
      const trigger = canvas.getByRole("button", { name: label });

      // The name comes from real button content, not from the popup.
      await expect(trigger).toHaveAccessibleName(label);
      await expect(trigger.querySelector("span.sr-only")).toHaveTextContent(label);
      // …and nothing of it is visible: the only painted child is the icon,
      // which is hidden from the accessibility tree.
      await expect(trigger.querySelector('[aria-hidden="true"]')).toBeInTheDocument();

      const box = trigger.getBoundingClientRect();
      await expect(`${label} target ${Math.round(box.width)}×${Math.round(box.height)}`).toBe(
        `${label} target ${Math.round(box.width)}×32`,
      );
      await expect(box.width).toBeGreaterThanOrEqual(32);
    }
  },
};

/**
 * An 88-character mode label — the shape that arrives the first time a mode
 * row is built from a workflow config's `displayName` instead of from a
 * hand-picked verb.
 *
 * The component's answer, visible here and stated nowhere else: it does not
 * wrap, does not truncate and does not scroll. `toggleVariants` sets
 * `whitespace-nowrap` and nothing sets `truncate`, `min-w-0` or a max width,
 * and the group is `w-fit`, so the trigger grows to fit its label and takes
 * the whole row with it. The two assertions below are that answer measured:
 * the full string survives into the accessible name (nothing is clipped out
 * of it), and the long trigger is exactly as tall as the short one beside it
 * (nothing wrapped).
 *
 * That is the right answer for a segmented control — a mode you cannot read
 * is worse than a row that is too wide — and it is also the reason the
 * spec's "two to five modes" is really "two to five *short* modes". One
 * sentence-length label costs more horizontal room than three real ones, and
 * `Mobile` is where that bill arrives.
 */
export const LongContent: Story = {
  args: {
    modes: [
      { value: "ask", label: "Ask", icon: <MessageSquare /> },
      {
        value: "storyboard",
        label: "Storyboard the whole sequence and hold every shot until the full board has been approved",
        icon: <PenLine />,
      },
      { value: "build", label: "Build", icon: <Sparkles /> },
    ],
    variant: "with-icon",
    defaultValue: "storyboard",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const long = canvas.getByRole("button", {
      name: "Storyboard the whole sequence and hold every shot until the full board has been approved",
    });
    const short = canvas.getByRole("button", { name: "Ask" });

    // Nothing is clipped out of the name — no ellipsis, no character budget.
    await expect(long.textContent?.trim()).toHaveLength(88);

    // …and nothing wrapped: one line, the same height as its short neighbour.
    await expect(Math.round(long.getBoundingClientRect().height)).toBe(
      Math.round(short.getBoundingClientRect().height),
    );
  },
};

/**
 * 375px, at the spec's own ceiling of five modes.
 *
 * **Defect, recorded not fixed — the row does not fit, and says nothing
 * about it.** Measured in this story's own browser: the five `with-icon`
 * triggers come to 422px inside a 375px column. The root is `cn(className)`
 * with no overflow handling, the group is `w-fit`, and every trigger is
 * `shrink-0 whitespace-nowrap`, so there is no scroll container, no wrap and
 * no shrink — `Ship` is simply outside the column, with nothing on screen
 * saying a fifth mode exists. A control whose documented maximum does not
 * survive a phone is a real gap, and not a one-class one: the choices are a
 * hidden-scrollbar row (what `suggestion-chips` does, and it needs an
 * overflow affordance to go with it), dropping to `with-tooltip` below a
 * breakpoint, or holding the cap lower on small screens. That is a design
 * decision, so it is recorded here and left to the catalog rather than swept
 * in a story wave.
 *
 * The same five modes text-only measure 312px and do fit, and the 110px
 * difference is exactly the five icons and their gaps. That is the practical
 * guidance until the gap is closed: on a surface that reaches 375px, either
 * stay text-only or stay under five.
 *
 * The assertions below are the part that must stay true whichever way the
 * gap is closed: all five modes exist, each keeps its full accessible name,
 * and none of them has been collapsed to a zero-width sliver. Deliberately
 * absent is any assertion about the row's width against the column's — the
 * convention's `Mobile` must-show is "no horizontal scroll", and pinning the
 * measurement that violates it would make fixing it a test failure.
 */
export const Mobile: Story = {
  args: { modes: FIVE_MODES, variant: "with-icon", defaultValue: "design" },
  render: (args) => (
    <div className="w-[375px] max-w-full">
      <ModeTabs {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    for (const mode of FIVE_MODES) {
      const trigger = canvas.getByRole("button", { name: mode.label });
      await expect(trigger).toHaveAccessibleName(mode.label);
      const box = trigger.getBoundingClientRect();
      await expect(`${mode.label} width=${box.width > 32}`).toBe(`${mode.label} width=true`);
    }
  },
};

/**
 * The two segmented rows in this catalog that look alike and mean opposite
 * things. Both are built on the same toggle group, both are a strip of
 * small pressable options with one lit, and the rule is about **what the
 * selection is a property of**:
 *
 * - **Mode tabs (D4)** change how the same input is interpreted. The
 *   selection is a property of the *workspace* — the spec calls it a working
 *   context and says it must survive a reload — so it belongs in the URL or
 *   in a saved setting, and it stays put while the user sends ten different
 *   prompts.
 * - **Choice chips (A4)** set a parameter of the *next run*. The selection
 *   is a property of the request, it is expected to change between runs, and
 *   nobody persists it across a session boundary.
 *
 * If it would be strange for the value to still be there tomorrow morning,
 * it is a chip, not a mode. The mechanical tell is the same one: a chip row
 * is `role="radiogroup"` with `role="radio"` children — it announces mutual
 * exclusivity — while a mode row is `role="group"` with `aria-pressed`
 * toggle buttons and leaves exclusivity to be inferred from hearing exactly
 * one "pressed". That gap is recorded in the docs module's screen-reader
 * notes; the comparison is what makes it obvious.
 *
 * Two neighbours are described rather than rendered:
 *
 * - **`model-picker` (E2)** is the one people actually confuse this with. A
 *   mode changes the interpretation of the prompt; a model changes who
 *   answers it. Collapsing them into one control is how "Director mode" ends
 *   up meaning "the expensive model", and neither decision stays legible.
 *   It is a Select rather than a segmented row, so it is a different shape
 *   on screen and adds nothing to a side-by-side.
 * - **`gen-settings-bar` (A7)** is a strip of parameter controls — model,
 *   aspect, resolution — and is the surface a choice chip's sibling lives
 *   on. A mode row is not a settings bar with two entries.
 */
export const Boundary: Story = {
  render: () => (
    <div className="flex w-full max-w-lg flex-col gap-6">
      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">
          Mode tabs — how the prompt is read, and it survives a reload
        </p>
        <ModeTabs modes={ASK_DESIGN_BUILD} variant="with-icon" defaultValue="design" />
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">
          Choice chips — a parameter of the next run, expected to change
        </p>
        <ChoiceChips defaultValue="16:9">
          <ChoiceChip value="1:1">1:1</ChoiceChip>
          <ChoiceChip value="4:5">4:5</ChoiceChip>
          <ChoiceChip value="16:9">16:9</ChoiceChip>
        </ChoiceChips>
      </section>
    </div>
  ),
};
