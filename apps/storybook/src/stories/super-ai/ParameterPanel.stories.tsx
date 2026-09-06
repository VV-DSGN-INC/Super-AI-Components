import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, userEvent, within } from "storybook/test";

import { FieldRow, UnitInput } from "@/registry/super-ai/field-row";
import {
  ParameterPanel,
  ParameterSegmented,
  ParameterSlider,
  ParameterTabs,
} from "@/registry/super-ai/parameter-panel";
import { PropertyInspector, PropertyRow } from "@/registry/super-ai/property-inspector";
import { ResetAffordance } from "@/registry/super-ai/reset-affordance";
import { ParameterPanelDocs } from "@/content/components/parameter-panel.docs";
import { componentDocsPage } from "@/lib/component-docs-page";
import { measureContrastAgainstAncestor } from "@/lib/wcag-contrast";

const meta: Meta<typeof ParameterPanel> = {
  title: "Super AI/Parameter Panel",
  component: ParameterPanel,
  parameters: { layout: "centered", docs: { page: componentDocsPage(ParameterPanelDocs) } },
  decorators: [(Story) => <div className="w-80"><Story /></div>],
};

export default meta;
type Story = StoryObj<typeof ParameterPanel>;

/**
 * The row this component exists for: a slider whose ends are described in the
 * language of the effect, with the raw number still readable beside the track.
 * Guidance runs 0–20 in half-steps and has no unit, so the number field carries
 * a bare figure — the endpoints are what say which way is which.
 */
export const SliderUnit: Story = {
  render: (args) => (
    <ParameterPanel {...args}>
      <ParameterSlider
        label="Guidance"
        value={7}
        min={0}
        max={20}
        step={0.5}
        unit=""
        endpoints={["More creative", "More literal"]}
        onValueChange={() => {}}
      />
    </ParameterPanel>
  ),
};

/**
 * A parameter with a small closed set of answers takes a segmented control
 * rather than a slider, because the values are named rather than measured.
 * Note that it always holds one: pressing the active option is swallowed, so
 * there is no interaction that empties the row.
 */
export const Segmented: Story = {
  render: (args) => (
    <ParameterPanel {...args}>
      <ParameterSegmented
        label="Quality"
        options={[
          { value: "draft", label: "Draft" },
          { value: "standard", label: "Standard" },
          { value: "high", label: "High" },
        ]}
        defaultValue="standard"
        onValueChange={() => {}}
      />
    </ParameterPanel>
  ),
};

/**
 * Groups behind named tabs, for a panel that has outgrown one screenful. The
 * thing to notice is not the tabs but their contrast: `tabsListVariants` pairs
 * `text-muted-foreground` with `bg-muted`, which is 4.34:1 in this token set,
 * so the list rebinds `--muted-foreground` rather than restyling the triggers.
 * The play function measures the rendered ratio instead of trusting the class.
 */
export const Tabbed: Story = {
  render: () => (
    <ParameterTabs
      groups={[
        {
          value: "basic",
          label: "Basic",
          content: (
            <ParameterSlider
              label="Steps"
              value={20}
              min={1}
              max={50}
              endpoints={["Faster", "More detail"]}
              onValueChange={() => {}}
            />
          ),
        },
        {
          value: "advanced",
          label: "Advanced",
          content: (
            <ParameterSlider
              label="Seed"
              value={8}
              min={0}
              max={9999}
              description="Fixing the seed reproduces the same result across runs with identical settings."
              onValueChange={() => {}}
            />
          ),
        },
      ]}
    />
  ),
  play: async ({ canvasElement }) => {
    // ParameterTabs' TabsList takes tabsListVariants' `default` variant:
    // text-muted-foreground (cva base) on bg-muted (cva default variant) —
    // 4.34:1 in this token set, under the 4.5:1 minimum. A rebound
    // --muted-foreground on the list (below) is what should clear it.
    const list = canvasElement.querySelector<HTMLElement>('[data-slot="parameter-tabs-list"]');
    await expect(list, 'expected a [data-slot="parameter-tabs-list"] element').not.toBeNull();
    const ratio = measureContrastAgainstAncestor(list!);
    await expect(
      ratio,
      `parameter-tabs-list text/background contrast is ${ratio.toFixed(2)}:1, below the 4.5:1 minimum`,
    ).toBeGreaterThanOrEqual(4.5);
  },
};

/**
 * Two reset scopes at once, which is the state that makes the panel a panel
 * rather than a stack of rows: the header reset clears everything underneath,
 * the row reset puts one value back. Both are the same A11 control at
 * different sizes, and both go `disabled` rather than disappearing when there
 * is nothing to undo — so the row never reflows as you drift off default.
 */
export const ResetAll: Story = {
  args: { title: "Sampling", modified: true },
  render: function ResetAllStory(args) {
    const [guidance, setGuidance] = useState(12);
    return (
      <ParameterPanel {...args} modified={guidance !== 7} onResetAll={() => setGuidance(7)}>
        <ParameterSlider
          label="Guidance"
          value={guidance}
          min={0}
          max={20}
          endpoints={["More creative", "More literal"]}
          onValueChange={setGuidance}
          reset={
            guidance !== 7 ? (
              <ResetAffordance state="modified" label="Reset guidance" onReset={() => setGuidance(7)} />
            ) : (
              <ResetAffordance state="default" label="Reset guidance" />
            )
          }
        />
      </ParameterPanel>
    );
  },
};

/**
 * The spec's second rule, rendered: the explanation of what a parameter does
 * is a slot, not a tooltip. It arrives as `FieldRow`'s hint, which means it is
 * always-visible text wired to both the thumb and the number field with
 * `aria-describedby` — reachable without hover, and reachable without sight.
 */
export const InlineEducation: Story = {
  render: (args) => (
    <ParameterPanel {...args}>
      <ParameterSlider
        label="Temperature"
        value={0.7}
        min={0}
        max={1}
        step={0.1}
        description="Controls how much the model varies its wording between runs. Higher values read as more creative, lower as more consistent."
        onValueChange={() => {}}
      />
    </ParameterPanel>
  ),
};

/* -------------------------------------------------------------------------
 * Case stories — the situations this panel meets in a product, as opposed to
 * the prop combinations above. See docs/design-system/story-conventions.md
 * for which of the eight apply and why the one that is missing is missing.
 *
 * Not written for this component, deliberately:
 *
 * // case-skip: ReducedMotion — nothing in the composed tree moves; the three transitions are a ring, a colour and vendored press chrome
 * Grepped rather than assumed: across `parameter-panel`, `field-row`,
 * `reset-affordance` and the two vendored primitives it composes there is no
 * `animate-*` at all, and exactly three `transition-*`.
 *
 * One belongs to this component — `transition-[box-shadow]` on the slider
 * thumb, which fades the `ring-3` in on hover and on press (never on keyboard
 * focus; `KeyboardOrder` measures why). The ring is painted outside the border
 * box, so the thumb neither moves nor changes size while it fades; that is the
 * same shape as A11's `transition-colors`, whose own skip line records why a
 * crossfade at a fixed position and a fixed size is not motion.
 *
 * The other two are `transition-all` on `ui/toggle.tsx` and on
 * `ui/tabs.tsx`'s trigger, and nothing geometric sits behind either: what
 * changes between states is a background, a text colour, a border colour and a
 * shadow. They are the vendored press-chrome posture CONTINUE.md §8 records
 * for the shared `Button`, which is a primitive-wide decision rather than
 * anything a case story here should branch.
 *
 * The thing a reader expects to animate is the thumb travelling to a new
 * value, and it does not: Base UI positions the thumb and the indicator with
 * `insetInlineStart` and transitions neither, so an arrow key or a `Reset all`
 * snaps the thumb rather than tweening it there. Since `vitest.config.ts`
 * already runs every story under `reducedMotion: "reduce"`, a ReducedMotion
 * story here would render pixel-identical to `SliderUnit` and imply a branch
 * that does not exist.
 * ---------------------------------------------------------------------- */

/**
 * A visible focus treatment, wherever the focused thing happens to draw it.
 * Note the limit, because it is the trap on this component: a static
 * `shadow-sm` reads as a ring here, so an element that carries one passes
 * whether it is focused or not. The slider thumb is exactly that case, and it
 * is filtered out of the walk below rather than measured with this.
 */
const hasRing = (el: Element) => {
  const style = getComputedStyle(el);
  return style.boxShadow !== "none" || style.outlineStyle !== "none";
};

/**
 * Right-to-left, and this panel is the place in the system where mirroring
 * splits in half inside a single control.
 *
 * **The paint mirrors, and mostly for free.** The header is
 * `justify-between`, A6's `grid-cols-[6rem_1fr]` resolves against the writing
 * direction, `UnitInput` was already written logically (`pe-2`, `text-end`),
 * and the endpoint pair is a `justify-between` flex row, so "More creative"
 * lands at the right edge and "More literal" at the left. The slider mirrors
 * too, and that one is not free-by-accident: Base UI positions both the
 * indicator and the thumb with `insetInlineStart`, a CSS logical property that
 * reads `dir` off the DOM, so the track fills from the right. No `rtl:`
 * utility and no physical class appears anywhere in `parameter-panel.tsx`.
 *
 * **Defect, recorded not fixed — the keys do not mirror, so the slider
 * disagrees with itself.** Base UI decides which arrow increments from
 * `useDirection()`, which returns `"ltr"` unless a `DirectionProvider` is
 * mounted above it; nothing in this repo mounts one and `dir="rtl"` on a
 * wrapper is invisible to React context (CONTINUE.md §8, first measured on
 * `mode-tabs`). Every composite here inherits it — the segmented group and the
 * tab list both walk in DOM order — but the slider is the sharp case, because
 * its two halves are wired to different sources: the paint reads `dir` off the
 * DOM and mirrors, the keys read React context and do not. So ArrowRight
 * still increases, and an increase now travels the thumb **leftward**. The
 * user presses right and the handle goes left, in the one control of the three
 * where that is unambiguous rather than merely surprising.
 *
 * The fix is one provider at the app shell, not this file. Asserted below:
 * only the mirroring that is already correct. The arrow claims in
 * `KeyboardOrder` are made in LTR, so nothing here pins the wrong behaviour.
 */
export const RTL: Story = {
  render: () => (
    <div dir="rtl">
      <ParameterPanel title="Sampling" modified onResetAll={() => {}}>
        <ParameterSlider
          label="Guidance"
          value={5}
          min={0}
          max={20}
          endpoints={["More creative", "More literal"]}
          onValueChange={() => {}}
          reset={<ResetAffordance state="modified" label="Reset guidance" onReset={() => {}} />}
        />
        <ParameterSegmented
          label="Quality"
          options={[
            { value: "draft", label: "Draft" },
            { value: "standard", label: "Standard" },
            { value: "high", label: "High" },
          ]}
          defaultValue="standard"
          onValueChange={() => {}}
        />
      </ParameterPanel>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const centre = (el: Element) => {
      const rect = el.getBoundingClientRect();
      return rect.left + rect.width / 2;
    };

    // A quarter of the way along a mirrored track puts the thumb in the right
    // half of the control, because `insetInlineStart` measures from the right.
    const control = canvasElement.querySelector<HTMLElement>('[data-slot="parameter-slider-thumb"]')!
      .parentElement!;
    const thumb = canvasElement.querySelector<HTMLElement>('[data-slot="parameter-slider-thumb"]')!;
    await expect(centre(thumb)).toBeGreaterThan(centre(control));

    // The plain-language ends swap with it: the low end reads first, from the
    // right. This is the pair the component exists to put on a slider, so it
    // is the pair that has to survive the mirror.
    const [low, high] = Array.from(
      canvasElement.querySelectorAll<HTMLElement>('[data-slot="parameter-slider-endpoints"] span'),
    );
    await expect(low).toHaveTextContent("More creative");
    await expect(centre(low)).toBeGreaterThan(centre(high));
  },
};

/**
 * A whole panel walked from the top, in LTR. The sequence is the fact worth
 * pinning, because none of the four counts a reader would guess is right:
 *
 * 1. **`Reset all`** — the panel header is a tab stop before any row is.
 * 2. **One stop for the tab list**, not one per tab: Base UI's roving
 *    tabindex, so the inactive trigger is `tabindex="-1"` and arrows move
 *    between them.
 * 3. **The tab panel itself**, which nobody predicts — see below.
 * 4. **Two stops per slider row**, the thumb and then the number field beside
 *    it, plus a third while its reset is enabled. A panel's stop count
 *    therefore *grows* as the user drifts values off their defaults, because
 *    A11 renders `disabled` at rest and the keyboard skips it.
 * 5. **One stop for the segmented row**, roving again, with the arrows wrapping
 *    at both ends — asserted at the end, along with what they do not do.
 *
 * **Recorded and not fixed — the slider thumb has no keyboard focus
 * indicator at all.** Base UI's thumb is a styled `<div>` wrapping a
 * `clip-path: inset(50%)` `input[type=range]`, and the focusable element is
 * the input. `focus-visible:ring-3` sits on the div, which is never itself
 * focused, so it never matches; the input's own UA `outline: auto` is clipped
 * away by the same `clip-path` that hides it. Measured rather than reasoned:
 * the div's computed `box-shadow` is byte-identical before and after focusing
 * the input — four transparent ring entries and the static `shadow-sm` — while
 * `hover:ring-3` and `active:ring-3` do land, because those match the div. So
 * the ring is there for a mouse and absent for a keyboard, on the one control
 * in this panel a keyboard user has to aim.
 *
 * It is not swept, for two reasons. The repair is `has-[:focus-visible]:ring-3`
 * (the idiom `ui/input-group.tsx` already uses), which changes what renders
 * rather than correcting drift; and the identical class string ships in the
 * vendored `ui/slider.tsx`, so this is a primitive-wide posture like the shared
 * `Button`'s press nudge rather than one component's bug. Fixing it here alone
 * would leave every other slider in the system dark.
 *
 * **Recorded and not fixed — step 3.** Base UI's `Tabs.Panel` takes a tabindex
 * of its own, so a tabbed parameter group puts a keyless stop in front of its
 * rows, and the vendored `ui/tabs.tsx` styles `TabsContent` `outline-none`
 * with no `focus-visible` ring replacing it — the unpaired-`outline-none`
 * shape the token gate exists to catch and cannot see in a vendored file. A
 * keyboard user lands there with nothing to tell them they have. `tool-panel`
 * found this first and its story carries the same filter.
 *
 * Both slots are excluded from the ring check below rather than asserted in
 * either direction, so fixing either does not break this story — pinning them
 * green is the one move the convention forbids.
 *
 * **Docs drift, found by asserting it.** The docs module's keyboard list says
 * the segmented row's "arrows move between options and select as they go".
 * They do not: arrowing moves focus and leaves the value alone until Space or
 * Enter, which is measured at the end of the play function below. That is the
 * safer of the two behaviours here — arrowing past an option must not silently
 * change the parameter a run is queued with — and it matches what the same
 * list already says about the tab group, so the sentence to correct is the
 * segmented one.
 *
 * **Recorded and not asserted — the reset that disables itself under the
 * cursor.** Pressing a row reset, or `Reset all`, returns the value to default
 * in the same render that disables the button, and a button disabled while
 * focused is blurred by the browser: focus lands on `<body>` and the next Tab
 * restarts from the top of the page. The docs module already carries it; I2
 * records the identical behaviour on the identical control.
 */
export const KeyboardOrder: Story = {
  render: () => (
    <ParameterPanel title="Sampling" modified onResetAll={() => {}}>
      <ParameterTabs
        groups={[
          {
            value: "basic",
            label: "Basic",
            content: (
              <>
                <ParameterSlider
                  label="Guidance"
                  value={12}
                  min={0}
                  max={20}
                  endpoints={["More creative", "More literal"]}
                  onValueChange={() => {}}
                  reset={<ResetAffordance state="modified" label="Reset guidance" onReset={() => {}} />}
                />
                <ParameterSegmented
                  label="Quality"
                  options={[
                    { value: "draft", label: "Draft" },
                    { value: "standard", label: "Standard" },
                    { value: "high", label: "High" },
                  ]}
                  defaultValue="standard"
                  onValueChange={() => {}}
                />
              </>
            ),
          },
          {
            value: "advanced",
            label: "Advanced",
            content: (
              <ParameterSlider label="Seed" value={8} min={0} max={9999} onValueChange={() => {}} />
            ),
          },
        ]}
      />
    </ParameterPanel>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const panel = canvasElement.querySelector<HTMLElement>('[data-slot="parameter-panel"]')!;

    // Roving tabindex in both composites: one tabbable trigger, one tabbable
    // option, whatever the option count.
    await expect(canvas.getAllByRole("tab").filter((t) => t.getAttribute("tabindex") !== "-1")).toHaveLength(1);
    const options = canvas.getAllByRole("button", { name: /Draft|Standard|High/ });
    await expect(options.filter((o) => o.getAttribute("tabindex") !== "-1")).toHaveLength(1);

    canvas.getByRole("button", { name: "Reset all" }).focus();

    const stops: string[] = [];
    const unringed: string[] = [];
    for (let i = 0; i < 12; i++) {
      const focused = document.activeElement as HTMLElement;
      if (!panel.contains(focused)) break;
      // Two of the stops are inputs the component never labels directly — the
      // thumb's hidden range input and the one inside `UnitInput` — so the
      // nearest named slot is what identifies a stop.
      const slot = focused.closest<HTMLElement>("[data-slot]")?.dataset.slot ?? focused.tagName.toLowerCase();
      stops.push(slot);

      // `UnitInput` draws its ring on the wrapper with `focus-within` rather
      // than on the `<input>`, so the ring may belong to an ancestor.
      const owner = hasRing(focused) ? focused : (focused.closest('[data-slot="unit-input"]') ?? focused);
      if (!(focused.matches(":focus-visible") && hasRing(owner))) unringed.push(slot);

      await userEvent.tab();
    }

    await expect(stops).toEqual([
      "reset-affordance",
      "tabs-trigger",
      "parameter-tabs-panel",
      "parameter-slider-thumb",
      "unit-input",
      "reset-affordance",
      "parameter-segmented-item",
    ]);

    // A stop nobody can see is the same as no focus order at all. The two
    // slots named in the description are filtered rather than asserted in
    // either direction; every other stop has to show its focus.
    const recorded = ["parameter-tabs-panel", "parameter-slider-thumb"];
    await expect(unringed.filter((slot) => !recorded.includes(slot))).toEqual([]);

    // Arrows move focus inside the segmented row and wrap at the ends, and
    // **selection does not follow focus** — the value changes only on Space or
    // Enter. Measured, because the docs module claims the opposite (see the
    // description); for a parameter this is the better of the two behaviours,
    // since arrowing past an option must not silently requeue a run.
    options[1].focus();
    await userEvent.keyboard("{ArrowRight}");
    await expect(document.activeElement).toBe(options[2]);
    await expect(options[1]).toHaveAttribute("aria-pressed", "true");
    await expect(options[2]).toHaveAttribute("aria-pressed", "false");

    await userEvent.keyboard("{Enter}");
    await expect(options[2]).toHaveAttribute("aria-pressed", "true");
    await expect(options[1]).toHaveAttribute("aria-pressed", "false");

    // The ends wrap, so there is no keyboard path out of the row and none
    // that leaves the parameter without a value.
    await userEvent.keyboard("{ArrowRight}");
    await expect(document.activeElement).toBe(options[0]);
  },
};

/** A host that hears every parameter change and applies none. */
function PinnedPanel() {
  const [requests, setRequests] = useState<string[]>([]);
  const log = (entry: string) => setRequests((prev) => [...prev, entry]);

  return (
    <div className="flex flex-col gap-2">
      <ParameterPanel title="Sampling">
        <ParameterTabs
          value="basic"
          onValueChange={(next) => log(`group:${next}`)}
          groups={[
            {
              value: "basic",
              label: "Basic",
              content: (
                <>
                  <ParameterSlider
                    label="Strength"
                    value={65}
                    unit="%"
                    endpoints={["More variable", "More literal"]}
                    onValueChange={(next) => log(`strength:${next}`)}
                  />
                  <ParameterSegmented
                    label="Quality"
                    options={[
                      { value: "draft", label: "Draft" },
                      { value: "standard", label: "Standard" },
                      { value: "high", label: "High" },
                    ]}
                    value="standard"
                    onValueChange={(next) => log(`quality:${next}`)}
                  />
                </>
              ),
            },
            {
              value: "advanced",
              label: "Advanced",
              content: (
                <ParameterSlider label="Seed" value={8} min={0} max={9999} onValueChange={() => {}} />
              ),
            },
          ]}
        />
      </ParameterPanel>
      <p data-testid="requests" className="text-foreground text-xs">
        {requests.join(" · ") || "no requests yet"}
      </p>
    </div>
  );
}

/**
 * Three controlled pairs in one panel, all pinned by a host that refuses
 * every change: the slider's `value`/`onValueChange`, the segmented row's, and
 * the tab group's. Each behaves the way a controlled control has to — the
 * interaction does not move the rendered value, and the callback carries the
 * whole next value rather than a delta, so a host can apply it without
 * reconstructing what the user did.
 *
 * The third clause is why the host logs into state: every rejected keystroke
 * and click re-renders the panel with the same `value`, and nothing may drift.
 * Two of the three hold outright, because `ParameterSlider` and
 * `ParameterTabs` keep no copy of the value at all.
 *
 * **Recorded, not asserted — `ParameterSegmented` keeps a second copy.** It
 * runs `const value = valueProp ?? internal` over a `useState`, and
 * `handleValueChange` calls `setInternal` before forwarding, unconditionally.
 * While `value` is supplied the prop wins and the row is correct, which is
 * what is asserted below. The copy is invisible until the host stops supplying
 * `value` — an uncommon but legal move, and the row will then show the last
 * *rejected* click rather than its `defaultValue`. Skipping the internal
 * setter whenever `valueProp !== undefined` is the fix; it is a behavioural
 * change, so it is recorded rather than swept.
 */
export const Controlled: Story = {
  render: () => <PinnedPanel />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const log = canvas.getByTestId("requests");

    // A slider step: the callback carries the whole next value, the rendered
    // value does not move, and neither does the number field beside it.
    const slider = canvas.getByRole("slider", { name: "Strength" }) as HTMLInputElement;
    slider.focus();
    await userEvent.keyboard("{ArrowRight}");
    await expect(log).toHaveTextContent("strength:66");
    await expect(slider.value).toBe("65");
    await expect(slider).toHaveAttribute("aria-valuetext", "65%");
    await expect(canvas.getByLabelText("Strength value")).toHaveValue(65);

    // A segmented choice: reported, refused, and the row still shows the
    // host's value.
    await userEvent.click(canvas.getByRole("button", { name: "High" }));
    await expect(log).toHaveTextContent("quality:high");
    await expect(canvas.getByRole("button", { name: "Standard" })).toHaveAttribute("aria-pressed", "true");
    await expect(canvas.getByRole("button", { name: "High" })).toHaveAttribute("aria-pressed", "false");

    // A tab: same shape one level up. The group the host pinned is still the
    // group on screen.
    await userEvent.click(canvas.getByRole("tab", { name: "Advanced" }));
    await expect(log).toHaveTextContent("group:advanced");
    await expect(canvas.getByRole("tab", { name: "Basic" })).toHaveAttribute("aria-selected", "true");
  },
};

/**
 * What omitting the optional labels costs, in the three places this panel lets
 * you omit them.
 *
 * `title` is the mild one: omit it and the header keeps its shape, holding an
 * empty span so the reset stays at the logical end. What goes with it is the
 * only name the panel had — `Reset all` then announces on its own, and two
 * parameter panels on one generation surface announce as two identical
 * buttons. `resetAllLabel` is the hook, and this story passes it.
 *
 * **The row resets are the real cost, and this is I2's collision one step
 * worse.** `PropertyRow` at least defaults its reset name to `Reset <label>`;
 * `ParameterSlider` takes the reset as a *node*, so it derives nothing at all
 * and `ResetAffordance`'s own default is the bare word "Reset". Two rows that
 * both let the caller drop the label announce as two identical controls — and
 * unlike I2, they collide even though the rows are named differently, because
 * the row label never reaches the button. Steps below passes `label` and is
 * the only one of the three a screen-reader user can address. There is no API
 * hook that would make the default right, which is why this is a recorded gap
 * rather than a class swap: `ParameterSlider` would have to grow a
 * `resetLabel`, or derive the name when it is handed a bare affordance.
 *
 * The third omission is `unit`, and it behaves: an empty unit makes
 * `getAriaValueText` announce the bare figure, which is correct for a
 * unitless parameter and is what the assertion below fixes in place.
 */
export const EmptyLabel: Story = {
  render: () => (
    <ParameterPanel modified onResetAll={() => {}} resetAllLabel="Reset sampling">
      <ParameterSlider
        label="Guidance"
        value={12}
        min={0}
        max={20}
        onValueChange={() => {}}
        reset={<ResetAffordance state="modified" onReset={() => {}} />}
      />
      <ParameterSlider
        label="Clip skip"
        value={2}
        min={1}
        max={4}
        onValueChange={() => {}}
        reset={<ResetAffordance state="modified" onReset={() => {}} />}
      />
      <ParameterSlider
        label="Steps"
        value={40}
        min={1}
        max={50}
        onValueChange={() => {}}
        reset={<ResetAffordance state="modified" label="Reset steps" onReset={() => {}} />}
      />
    </ParameterPanel>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // No title, so no heading — the header is still there for the reset.
    await expect(canvas.queryByRole("heading")).not.toBeInTheDocument();

    // Every reset is named, so nothing here ships a `button-name` violation
    // into the a11y gate…
    const names = Array.from(
      canvasElement.querySelectorAll<HTMLElement>('[data-slot="reset-affordance"]'),
    ).map((el) => el.getAttribute("aria-label"));
    await expect(names.every((name) => Boolean(name))).toBe(true);

    // …and the two that name what they reset are the two a screen-reader user
    // can address. The pair that collides is described above rather than
    // asserted: pinning it green in either direction is the forbidden move.
    await expect(canvas.getAllByRole("button", { name: "Reset steps" })).toHaveLength(1);
    await expect(canvas.getAllByRole("button", { name: "Reset sampling" })).toHaveLength(1);

    // A unitless parameter speaks its bare number, which is the right answer
    // for one — `unit="%"` would make the same thumb say "12%".
    await expect(canvas.getByRole("slider", { name: "Guidance" })).toHaveAttribute("aria-valuetext", "12");
  },
};

/**
 * ~90 characters in each author-supplied text slot, at the width these panels
 * ship at. Four slots, four different answers, and only this story has them
 * together:
 *
 * - **The row label wraps.** A6's label column is a hard `6rem`, so a long
 *   parameter name wraps inside 96px and drives the row to 60px tall while the
 *   control beside it stays on one line.
 * - **The description wraps as a paragraph**, which is the slot that is meant
 *   to hold a sentence, and the one place in this component where long text is
 *   the design rather than an accident.
 * - **The endpoint pair runs together.** Two long strings in a
 *   `justify-between` row have neither truncation nor a gap floor, so each
 *   wraps to two lines, takes exactly half the 184px control column, and butts
 *   against the other with nothing between them: measured at 92px and 92px,
 *   touching at the seam. The pair is `aria-hidden`, so nothing announces the
 *   run-together either. Endpoints are meant to be two or three words — "More
 *   variable ↔ More literal" — and nothing enforces that.
 * - **A segmented option does not wrap, so the panel overflows.**
 *   `toggleVariants` sets `whitespace-nowrap` on a fixed `h-8`, so two real
 *   sampler names widen the `w-fit` group to 266px inside a 184px column and
 *   push the panel to a 374px scroll width in a 320px rail. The B4 trap again,
 *   recorded on `drawing-tools` in wave 1; the panel does not clip, scroll or
 *   truncate it, it simply gets wider than its host.
 *
 * The fifth is not a text slot at all, and it is the one this shares with its
 * twin while neither documents it anywhere else: **a long *value* has nowhere
 * to go.** `UnitInput` is a fixed
 * `w-20` with `text-end`, so a real 32-bit seed scrolls inside its own field
 * and the leading digits are the ones that leave: 4294967295 measures 85.7px
 * of text in a 54px content box, so roughly the first four digits sit outside
 * the field and it reads as a smaller number rather than as a clipped one. I2
 * records the same shape for canvas dimensions; on a parameter panel it is the
 * ordinary case, because seeds are genuinely that wide.
 */
export const LongContent: Story = {
  render: () => (
    <ParameterPanel title="Sampling and conditioning, advanced controls" modified onResetAll={() => {}}>
      <ParameterSlider
        label="Classifier-free guidance scale"
        value={7}
        min={0}
        max={20}
        step={0.5}
        endpoints={["Follows the prompt loosely", "Follows the prompt literally"]}
        description="Higher values hold the render closer to the prompt wording and lower values let the model reinterpret it."
        onValueChange={() => {}}
      />
      <ParameterSlider label="Seed" value={4294967295} min={0} max={4294967295} onValueChange={() => {}} />
      <ParameterSegmented
        label="Sampler"
        options={[
          { value: "euler", label: "Euler ancestral" },
          { value: "dpm", label: "DPM++ 2M Karras" },
        ]}
        defaultValue="dpm"
        onValueChange={() => {}}
      />
    </ParameterPanel>
  ),
};

/**
 * 375px. A parameter panel is a desktop rail and a full-width sheet on a
 * phone, and the narrow case is the one it has to survive without a
 * horizontal scrollbar — A6's fixed `6rem` label column plus an 80px number
 * field plus a 20px reset leaves slack at this width, and the segmented row
 * fits beside its label as long as the options stay short.
 *
 * What the width exposes is the target rather than the layout, and it is A11's
 * finding multiplied by this component: a row reset renders `size-5` — 20×20
 * with no padding, against WCAG 2.2's 24×24 minimum — and a parameter panel is
 * where that stops being one button and becomes one per row, each a thumb's
 * width from a number field it must not be confused with. Group scope
 * (`size-6`) is exactly 24. Axe's `target-size` rule is experimental and off,
 * so no gate sees it.
 */
export const Mobile: Story = {
  render: () => (
    <div className="w-[375px] max-w-full" data-testid="viewport">
      <ParameterPanel title="Sampling" modified onResetAll={() => {}}>
        <ParameterSlider
          label="Guidance"
          value={12}
          min={0}
          max={20}
          endpoints={["More creative", "More literal"]}
          onValueChange={() => {}}
          reset={<ResetAffordance state="modified" label="Reset guidance" onReset={() => {}} />}
        />
        <ParameterSegmented
          label="Quality"
          options={[
            { value: "draft", label: "Draft" },
            { value: "standard", label: "Standard" },
            { value: "high", label: "High" },
          ]}
          defaultValue="standard"
          onValueChange={() => {}}
        />
      </ParameterPanel>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const viewport = canvas.getByTestId("viewport");
    await expect(viewport.scrollWidth).toBeLessThanOrEqual(viewport.clientWidth);

    // The two scopes, measured rather than read off the class names: the
    // header reset is exactly the 24px WCAG 2.2 floor and the row reset is
    // under it. Both numbers are stated in the description.
    const group = canvasElement.querySelector<HTMLElement>(
      '[data-slot="parameter-panel-header"] [data-slot="reset-affordance"]',
    )!;
    const row = canvasElement.querySelector<HTMLElement>(
      '[data-slot="field-row-reset"] [data-slot="reset-affordance"]',
    )!;
    await expect(group.getBoundingClientRect().width).toBe(24);
    await expect(row.getBoundingClientRect().width).toBe(20);
  },
};

/**
 * The two panels built from the same rows, which is exactly why they get mixed
 * up: A6 `field-row` underneath, A11 `reset-affordance` at the end, the same
 * label column, the same number fields. What separates them is what drives the
 * content.
 *
 * - **Parameter panel (E3)** is driven by **the model**. Nothing is selected
 *   and nothing can be — it configures a run that has not happened yet, so it
 *   has no empty state, because it is never irrelevant. One reset scope, on
 *   the panel header. Its sliders carry plain-language ends and an inline
 *   explanation, because the user is choosing a value they cannot see the
 *   effect of yet.
 * - **Property inspector (I2)** is driven by **the selection**. Its sections
 *   are a lookup on element type, so selecting a different object changes the
 *   panel, and it has a real view for nothing-selected. Two reset scopes, one
 *   per section and one per row. Its rows carry no endpoints, because the
 *   effect of a width is on the canvas in front of you.
 * - **A bare `field-row` (A6)** is the floor. One or two settings with no
 *   heading and no reset is a row, not a panel; reach for E3 once a slider
 *   needs endpoints or a group needs a reset.
 *
 * So: if the panel would show the same thing with nothing selected, it was
 * never an inspector — it is E3. I2's own `Boundary` states the rule from the
 * other side, and adds the third surface, I3 `context-toolbar`, for the case
 * where the user is pressing a verb rather than setting a value.
 */
export const Boundary: Story = {
  render: () => (
    <div className="flex w-full max-w-md flex-col gap-6">
      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">
          Parameter panel — driven by the model, one reset scope, ends in words
        </p>
        <div className="w-72">
          <ParameterPanel title="Sampling" modified onResetAll={() => {}}>
            <ParameterSlider
              label="Strength"
              value={65}
              unit="%"
              endpoints={["More variable", "More literal"]}
              onValueChange={() => {}}
              reset={<ResetAffordance state="modified" label="Reset strength" onReset={() => {}} />}
            />
          </ParameterPanel>
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">
          Property inspector — same rows, driven by the selection, two reset scopes
        </p>
        <div className="w-72">
          <PropertyInspector
            elementType="image"
            selectionLabel="Hero image"
            sections={{
              image: [
                {
                  id: "layout",
                  label: "Layout",
                  state: "modified",
                  onReset: () => {},
                  content: (
                    <PropertyRow label="Width" state="modified" onReset={() => {}}>
                      {(id) => <UnitInput id={id} unit="px" defaultValue={640} />}
                    </PropertyRow>
                  ),
                },
              ],
            }}
          />
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">
          Field row — one setting, no heading, no reset: still a row
        </p>
        <div className="w-72">
          <FieldRow label="Upscale">
            {(id) => <UnitInput id={id} unit="×" defaultValue={2} />}
          </FieldRow>
        </div>
      </section>
    </div>
  ),
};
