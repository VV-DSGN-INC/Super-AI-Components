import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { Slider as SliderPrimitive } from "@base-ui/react/slider";
import { Sparkles } from "lucide-react";
import { expect, userEvent, within } from "storybook/test";

import { EntityRow } from "@/registry/super-ai/entity-row";
import { FieldRow, UnitInput } from "@/registry/super-ai/field-row";
import { GenSettingsBar, GenSettingsItem } from "@/registry/super-ai/gen-settings-bar";
import { ResetAffordance } from "@/registry/super-ai/reset-affordance";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Switch } from "@/components/ui/switch";
import { FieldRowDocs } from "@/content/components/field-row.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

/**
 * Fixtures are parameters an image/video generation inspector in this system
 * really carries — strength, sampler, seed, position, upscale — with the
 * units the spec names (%, s, ×, px). Nothing here is an invented product or
 * a fabricated number.
 */

/** The width the shipped demo uses. Not a new design value — the row has none of its own. */
const Column = ({ children }: { children: React.ReactNode }) => <div className="w-80">{children}</div>;

/**
 * A slider + unit field sharing one control column, lifted from
 * `parameter-panel.tsx` (E3, the row's biggest consumer) rather than from the
 * vendored `components/ui/slider.tsx`. That wrapper does not forward
 * `getAriaLabel` to its Thumb, so a slider built on it renders with no
 * accessible name at all — see the comment in parameter-panel.tsx.
 *
 * Both controls answer to the same visible label on purpose: the `<label for>`
 * names the number field, and the thumb repeats the label because a Base UI
 * thumb is not a labelable element and `htmlFor` cannot reach it.
 */
function StrengthSlider({ controlId, describedBy }: { controlId: string; describedBy?: string }) {
  const [value, setValue] = React.useState(65);
  return (
    <div className="flex flex-1 items-center gap-3">
      <SliderPrimitive.Root
        value={value}
        min={0}
        max={100}
        step={1}
        onValueChange={(next) => setValue(next as number)}
        className="w-full"
      >
        <SliderPrimitive.Control className="relative flex w-full touch-none items-center select-none">
          <SliderPrimitive.Track className="bg-muted relative h-1 w-full grow overflow-hidden rounded-full select-none">
            <SliderPrimitive.Indicator className="bg-primary h-full select-none" />
          </SliderPrimitive.Track>
          <SliderPrimitive.Thumb
            aria-describedby={describedBy}
            getAriaLabel={() => "Strength"}
            getAriaValueText={() => `${value}%`}
            className="border-ring bg-background ring-ring/50 relative block size-3 shrink-0 rounded-full border shadow-sm select-none after:absolute after:-inset-2 hover:ring-3 focus-visible:ring-3 focus-visible:outline-hidden"
          />
        </SliderPrimitive.Control>
      </SliderPrimitive.Root>
      <UnitInput
        id={controlId}
        aria-describedby={describedBy}
        unit="%"
        value={value}
        onValueChange={setValue}
        className="shrink-0"
      />
    </div>
  );
}

const meta: Meta<typeof FieldRow> = {
  title: "Super AI/Field Row",
  component: FieldRow,
  parameters: { layout: "centered", docs: { page: componentDocsPage(FieldRowDocs) } },
  argTypes: { children: { control: false } },
  args: {
    label: "Opacity",
    children: (id: string) => <UnitInput id={id} unit="%" defaultValue={80} />,
  },
  render: (args) => (
    <Column>
      <FieldRow {...args} />
    </Column>
  ),
};

export default meta;
type Story = StoryObj<typeof FieldRow>;

/**
 * The flagship control kind, and the one the row was designed around: a
 * slider for coarse movement and a unit-suffixed number field for the exact
 * value, both in the control column, both set the same parameter. The unit
 * lives inside the field — "65 %" is one control, not a control plus a
 * caption — which is what keeps the row's second column a single width no
 * matter which parameter it holds.
 */
export const SliderUnit: Story = {
  args: {
    label: "Strength",
    children: (id, describedBy) => <StrengthSlider controlId={id} describedBy={describedBy} />,
  },
};

/**
 * A choice from a fixed list. The row hands out one `controlId` and a
 * `<select>` is a labelable element, so the visible label genuinely names it
 * — no `aria-label` needed, and no duplicated text to drift.
 *
 * This is the control kind where the 6rem label column earns its keep: the
 * select sizes to its longest option, so two of these stacked would
 * otherwise start at different x positions.
 */
export const Select: Story = {
  args: {
    label: "Sampler",
    children: (id) => (
      <NativeSelect id={id} defaultValue="dpmpp-2m">
        <NativeSelectOption value="euler-a">Euler a</NativeSelectOption>
        <NativeSelectOption value="dpmpp-2m">DPM++ 2M</NativeSelectOption>
        <NativeSelectOption value="ddim">DDIM</NativeSelectOption>
      </NativeSelect>
    ),
  },
};

/**
 * A boolean parameter. The switch is 32px wide against a 6rem label, so the
 * control column is almost entirely empty — which is the point of the shared
 * grid rather than an argument against it. A toggle row stacked between two
 * value rows still starts its control at the same x, and a stack of settings
 * reads as a column instead of as three unrelated widths.
 *
 * Worth knowing before you trust `controlId` here: Base UI's Switch is not a
 * labelable element. It renders a `<span role="switch">` next to a visually
 * hidden proxy `<input type="checkbox">`, and the id lands on the proxy. The
 * name still resolves — Base UI reads the proxy's `labels`, finds this row's
 * `<label>`, stamps a generated id onto it and points the visible switch at
 * it with `aria-labelledby` — but it arrives by a different route than in
 * `Select` above, and two nodes now answer to the text "Upscale". Query the
 * control by role and name, not by label text.
 */
export const Toggle: Story = {
  args: {
    label: "Upscale",
    children: (id) => <Switch id={id} defaultChecked />,
  },
};

/**
 * A colour parameter. The swatch is sized to the same `h-8`/`w-20` box the
 * unit field uses so the column does not jump between rows, and the hex is
 * the row's *value* — content the user picked — not a design token this
 * component introduces. The row itself paints no surface at all.
 */
export const Colour: Story = {
  args: {
    label: "Backdrop",
    children: (id) => (
      <input
        id={id}
        type="color"
        defaultValue="#6E56CF"
        className="border-input h-8 w-20 cursor-pointer rounded-md border bg-transparent"
      />
    ),
  },
};

/**
 * Two numbers on one row — the shape the row is worst at, and worth having on
 * screen for exactly that reason. `FieldRow` hands out a single `controlId`,
 * so only one of the two fields can be named by the visible label. Both get an
 * explicit `aria-label` here, which is what a correct caller has to do; the
 * label above them ends up as a caption with no programmatic relationship to
 * either.
 *
 * Recorded, not asserted: the honest fix is a group shape (`role="group"` +
 * `aria-labelledby` pointing at the label instead of `htmlFor`) that the row
 * does not currently offer. See the report.
 */
export const XyPair: Story = {
  args: {
    label: "Position",
    children: (id) => (
      <>
        <UnitInput id={id} aria-label="Position X" unit="px" defaultValue={0} />
        <UnitInput aria-label="Position Y" unit="px" defaultValue={0} />
      </>
    ),
  },
};

/**
 * The always-visible explanation line — E3's "inline education" slot, and
 * deliberately not a tooltip: an explanation you have to hover for is an
 * explanation most people never read. The row generates the hint's id and
 * hands it back as the render prop's second argument, so the same sentence is
 * both the visible caption and the control's accessible description.
 *
 * The hint sits outside the label/control grid, so it starts at the row's left
 * edge rather than under the control. That is the component's actual answer
 * and the reason a hint reads as belonging to the whole row.
 */
export const WithHint: Story = {
  args: {
    label: "Guidance",
    hint: "Higher values follow the prompt more literally.",
    children: (id, describedBy) => (
      <UnitInput id={id} aria-describedby={describedBy} unit="" defaultValue={7} step={0.5} />
    ),
  },
};

/**
 * The A11 trailing slot filled — the addition that, per the spec, is what
 * makes a row feel bound to a value rather than merely displaying one. Note
 * what the reset does at rest: `ResetAffordance` at `state="default"` stays
 * mounted and goes disabled instead of unmounting, so the control never
 * shifts sideways when a value returns to its default. Both rows below are
 * the same width.
 */
export const WithReset: Story = {
  render: () => (
    <Column>
      <div className="space-y-3">
        <FieldRow label="Opacity" reset={<ResetAffordance state="modified" onReset={() => {}} />}>
          {(id) => <UnitInput id={id} unit="%" defaultValue={80} />}
        </FieldRow>
        <FieldRow label="Strength" reset={<ResetAffordance state="default" onReset={() => {}} />}>
          {(id) => <UnitInput id={id} unit="%" defaultValue={100} />}
        </FieldRow>
      </div>
    </Column>
  ),
};

/**
 * The disabled-shaped state, and it is not a prop on this component. The root
 * is a plain `div`, so there is nothing to disable — you disable the control
 * you passed in, and the reset beside it.
 *
 * Defect recorded, not asserted: the label does not dim with the control,
 * because the row has no way to know the control went inert. A row that is
 * genuinely unavailable reads as a live label attached to a dead field until
 * the caller dims the label too. Fixing it means adding a `disabled` prop to
 * `FieldRow`, which is an API change — see the report.
 */
export const Disabled: Story = {
  render: () => (
    <Column>
      <div className="space-y-3">
        <FieldRow
          label="Seed"
          hint="Locked while a render is in flight."
          reset={<ResetAffordance state="default" onReset={() => {}} />}
        >
          {(id, describedBy) => (
            <UnitInput id={id} aria-describedby={describedBy} unit="" defaultValue={284913} disabled />
          )}
        </FieldRow>
        <FieldRow label="Sampler">
          {(id) => (
            <NativeSelect id={id} defaultValue="dpmpp-2m" disabled>
              <NativeSelectOption value="dpmpp-2m">DPM++ 2M</NativeSelectOption>
            </NativeSelect>
          )}
        </FieldRow>
      </div>
    </Column>
  ),
};

/* -------------------------------------------------------------------------
 * Case stories — the situations this row meets in a product, as opposed to
 * the control kinds above. See docs/design-system/story-conventions.md for
 * which of the eight apply and why the two that are missing are missing.
 *
 * Not written for this component, deliberately:
 *
 * // case-skip: ReducedMotion — nothing in the tree animates
 * `FieldRow` is a grid, a `<label>` and a `<p>`; `UnitInput` is a bordered
 * span with a `focus-within` ring. There is no keyframe, transform or
 * transition anywhere in either, so there is no reduced-motion branch to
 * document — a story here would render identically to `WithReset` and imply
 * coverage it does not have. Motion that appears in a row comes from the
 * control the caller passed in, and belongs to that control's story.
 *
 * // case-skip: EmptyLabel — label is required and is the control's only accessible-name source
 * `label` is a required `string` with no icon-only mode to fall back on, and
 * the whole component exists to attach it to a control. Rendering `label=""`
 * would ship an unlabeled form field into an axe gate running at
 * `test: "error"`. The genuinely optional text slot is `hint`, and its absent
 * form is already the base rendering of every state above; its present form
 * is `WithHint`.
 * ---------------------------------------------------------------------- */

/** A visible focus treatment, wherever this component happens to draw it. */
const hasRing = (el: Element) => {
  const style = getComputedStyle(el);
  return style.boxShadow !== "none" || style.outlineStyle !== "none";
};

/**
 * Right-to-left. Direction is load-bearing in three places here and only one
 * of them is free: the label/control grid mirrors on its own (grid columns
 * follow the writing direction), but the unit suffix inside the field and the
 * number's alignment are both inside `UnitInput` and had to be logical rather
 * than physical to follow it — `pe-2`/`text-end`, not `pr-2`/`text-right`.
 * Before that fix the unit sat flush against the field's left border in RTL
 * while the number pinned itself to the far edge, and no gate could see it.
 *
 * The reset slot mirrors with the flex row, so it lands at the logical end of
 * the control column rather than the visual right.
 */
export const RTL: Story = {
  render: () => (
    <div dir="rtl">
      <Column>
        <div className="space-y-3">
          <FieldRow
            label="Strength"
            hint="Higher values follow the prompt more literally."
            reset={<ResetAffordance state="modified" onReset={() => {}} />}
          >
            {(id, describedBy) => (
              <UnitInput id={id} aria-describedby={describedBy} unit="%" defaultValue={65} />
            )}
          </FieldRow>
          <FieldRow label="Sampler">
            {(id) => (
              <NativeSelect id={id} defaultValue="dpmpp-2m">
                <NativeSelectOption value="euler-a">Euler a</NativeSelectOption>
                <NativeSelectOption value="dpmpp-2m">DPM++ 2M</NativeSelectOption>
              </NativeSelect>
            )}
          </FieldRow>
        </div>
      </Column>
    </div>
  ),
};

/**
 * Tab traversal across a stack of rows, and it pins the two facts a settings
 * column depends on.
 *
 * First, the label really reaches the control. A number field and a `<select>`
 * are both found by their visible label text alone, which is only possible if
 * `controlId` landed on a labelable element — the assertion that catches a
 * refactor swapping a control for a div with a role. The switch is asserted by
 * role and name instead, and deliberately: Base UI puts the id on a hidden
 * proxy input and routes the name to the visible switch itself, so *two* nodes
 * match the label text and a `getByLabelText` here fails on ambiguity rather
 * than on absence. See the `Toggle` story.
 *
 * Second, the stop count. A row at its default value has *one* stop, not two:
 * `ResetAffordance` stays mounted and goes disabled rather than unmounting, so
 * it holds its place in the grid without costing a tab. Three rows, four stops.
 *
 * The ring check has to allow for where the focus treatment is drawn.
 * `UnitInput` puts `outline-none` on the `<input>` and the ring on its
 * `[data-slot="unit-input"]` wrapper via `focus-within` — the standard
 * input-group shape — so the ring belongs to the focused element *or* to that
 * wrapper. The select and the switch draw their own.
 */
export const KeyboardOrder: Story = {
  render: () => (
    <Column>
      <div className="space-y-3">
        <FieldRow label="Strength" reset={<ResetAffordance state="modified" onReset={() => {}} />}>
          {(id) => <UnitInput id={id} unit="%" defaultValue={65} />}
        </FieldRow>
        <FieldRow label="Sampler" reset={<ResetAffordance state="default" onReset={() => {}} />}>
          {(id) => (
            <NativeSelect id={id} defaultValue="dpmpp-2m">
              <NativeSelectOption value="euler-a">Euler a</NativeSelectOption>
              <NativeSelectOption value="dpmpp-2m">DPM++ 2M</NativeSelectOption>
            </NativeSelect>
          )}
        </FieldRow>
        <FieldRow label="Upscale">{(id) => <Switch id={id} defaultChecked />}</FieldRow>
      </div>
    </Column>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // The label-to-control association, per control kind. Each of these
    // resolves only because `controlId` reached a labelable element.
    await expect(canvas.getByLabelText("Strength")).toHaveAttribute("type", "number");
    await expect(canvas.getByLabelText("Sampler").tagName).toBe("SELECT");
    await expect(canvas.getByRole("switch", { name: "Upscale" })).toBeInTheDocument();

    // The at-default reset holds its place in the grid and costs no tab stop.
    const resets = canvas.getAllByRole("button", { name: "Reset" });
    await expect(resets).toHaveLength(2);
    await expect(resets[0]).toBeEnabled();
    await expect(resets[1]).toBeDisabled();

    // Three rows, four stops: input, its reset, the select, the switch.
    const expectedStops = 4;

    await userEvent.tab();
    for (let i = 0; i < expectedStops; i++) {
      const focused = document.activeElement as HTMLElement;
      await expect(canvasElement.contains(focused)).toBe(true);
      await expect(focused.matches(":focus-visible")).toBe(true);

      const ringOwner = hasRing(focused) ? focused : focused.closest('[data-slot="unit-input"]');
      await expect(ringOwner).not.toBeNull();
      await expect(hasRing(ringOwner as HTMLElement)).toBe(true);

      await userEvent.tab();
    }

    // And the row stack does not trap: the stop after the last one is outside.
    await expect(canvasElement.contains(document.activeElement)).toBe(false);
  },
};

/**
 * A consumer that holds the value itself and refuses to apply the change. The
 * host below pins `value` to 65 forever, which is the only way to see the
 * controlled contract hold rather than merely appear to.
 *
 * The controlled pair lives on `UnitInput`, not on `FieldRow` — the row is a
 * layout slot and owns no value at all. Three things are asserted, and all
 * three are things a consumer depends on: typing does not move the rendered
 * value on its own, the callback arrives as a `number` rather than as a change
 * event (the two are different callbacks on this component and wiring the
 * wrong one is the easy mistake), and a real re-render with an unchanged
 * `value` leaves the field where it was. The render counter is what makes the
 * third assertion mean something — it proves React re-rendered rather than
 * skipped the work.
 *
 * Defect recorded, not asserted: `onValueChange` fires only when the field
 * parses to a number, so clearing it is silent. A consumer holding state this
 * way never learns the field was emptied. See the report.
 */
export const Controlled: Story = {
  render: () => <PinnedValue />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByLabelText("Strength");
    const host = canvas.getByTestId("controlled-host");

    await expect(input).toHaveValue(65);
    await expect(host).toHaveAttribute("data-payload", "none");

    await userEvent.type(input, "9");

    // The payload a consumer needs in order to apply the change — a number,
    // not the raw event `onChange` would have handed over.
    await expect(host.getAttribute("data-payload")).toMatch(/^number:/);

    // The prop wins: typing alone moved nothing…
    await expect(input).toHaveValue(65);
    // …and it held across a genuine re-render, not a skipped one.
    await expect(host).toHaveAttribute("data-renders", "1");
    await expect(input).toHaveValue(65);
  },
};

/**
 * The host for `Controlled`. It records the payload's runtime type and bumps
 * an unrelated counter, so every accepted keystroke forces a real re-render
 * while `value` stays exactly where it was.
 */
function PinnedValue() {
  const [renders, setRenders] = React.useState(0);
  const [payload, setPayload] = React.useState("none");

  return (
    <div data-testid="controlled-host" data-renders={renders} data-payload={payload} className="w-80">
      <FieldRow label="Strength" reset={<ResetAffordance state="modified" onReset={() => {}} />}>
        {(id) => (
          <UnitInput
            id={id}
            unit="%"
            value={65}
            onValueChange={(next) => {
              setPayload(`${typeof next}:${next}`);
              setRenders((n) => n + 1);
            }}
          />
        )}
      </FieldRow>
    </div>
  );
}

/**
 * A ~90-character label and a hint of similar length. The two slots answer
 * long content in opposite ways, and only this story shows it: the label
 * column is a hard `6rem`, so a long label wraps inside 96px and drives the
 * whole row's height while the control stays one line, vertically centred
 * against a paragraph of label. The hint has the full row width and wraps
 * across two lines at most.
 *
 * The practical rule that falls out: labels are two or three words, and
 * anything that needs a sentence goes in `hint`. A stack of rows with one
 * long label is not merely ugly, it breaks the vertical rhythm the shared
 * grid exists to produce.
 */
export const LongContent: Story = {
  render: () => (
    <Column>
      <div className="space-y-3">
        <FieldRow
          label="Prompt adherence weighting applied to every sampling step during the second refinement pass"
          hint="Raising this past the midpoint tends to flatten composition variety across a batch."
          reset={<ResetAffordance state="modified" onReset={() => {}} />}
        >
          {(id, describedBy) => (
            <UnitInput id={id} aria-describedby={describedBy} unit="%" defaultValue={65} />
          )}
        </FieldRow>
        <FieldRow label="Steps">{(id) => <UnitInput id={id} unit="" defaultValue={30} />}</FieldRow>
      </div>
    </Column>
  ),
};

/**
 * 375px. The label column does not shrink — `6rem` is a fixed track, not a
 * fraction — so a quarter of the width is spent on labels before the control
 * gets any, and what is left is 267px minus the gap. That is enough for the
 * unit field (80px) and comfortable for a slider, and it is why the fixed
 * track is the right call at this width: a proportional label column would
 * squeeze labels into wrapping exactly when the screen can least afford the
 * height.
 *
 * The row that gets tight first is the pair, where two 80px fields plus a
 * reset have to share the control column.
 */
export const Mobile: Story = {
  render: () => (
    <div className="w-[375px] max-w-full">
      <div className="space-y-3">
        <FieldRow label="Strength" reset={<ResetAffordance state="modified" onReset={() => {}} />}>
          {(id) => <StrengthSlider controlId={id} />}
        </FieldRow>
        <FieldRow label="Sampler">
          {(id) => (
            <NativeSelect id={id} defaultValue="dpmpp-2m">
              <NativeSelectOption value="euler-a">Euler a</NativeSelectOption>
              <NativeSelectOption value="dpmpp-2m">DPM++ 2M</NativeSelectOption>
            </NativeSelect>
          )}
        </FieldRow>
        <FieldRow label="Position" reset={<ResetAffordance state="modified" onReset={() => {}} />}>
          {(id) => (
            <>
              <UnitInput id={id} aria-label="Position X" unit="px" defaultValue={0} />
              <UnitInput aria-label="Position Y" unit="px" defaultValue={0} />
            </>
          )}
        </FieldRow>
      </div>
    </div>
  ),
};

/**
 * Beside the two rows it gets confused with. All three are a label-ish thing
 * next to a control-ish thing, and the rule is what a change to them means:
 *
 * - **Field row (A6)** sets one named parameter and expects to be stacked. It
 *   spends a fixed column on the label precisely so the row above and the row
 *   below line up with it. Reach for it in an inspector.
 * - **Gen settings bar (A7)** also sets parameters, but as a docked strip
 *   beside a composer: no label column, segments derived from the chosen
 *   model, sized to be glanced at rather than read down. Same job, opposite
 *   geometry.
 * - **Entity row (A9)** names a thing — an icon, a title, a description and a
 *   trailing slot. You pick it or open it; you do not set it to a value.
 *
 * So: if you are reading a column of labels top to bottom, it is A6. If the
 * controls sit shoulder to shoulder next to a Run button, it is A7. If the
 * left-hand text is the *subject* rather than the name of a setting, it is A9
 * — and note the giveaway, that A9's trailing slot can hold a switch, which is
 * where the two rows look most alike and are still not interchangeable.
 */
export const Boundary: Story = {
  render: () => (
    <div className="flex w-full max-w-md flex-col gap-6">
      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">Field row — sets one parameter, built to stack</p>
        <div className="space-y-3">
          <FieldRow label="Strength" reset={<ResetAffordance state="modified" onReset={() => {}} />}>
            {(id) => <UnitInput id={id} unit="%" defaultValue={65} />}
          </FieldRow>
          <FieldRow label="Upscale">{(id) => <Switch id={id} defaultChecked />}</FieldRow>
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">
          Gen settings bar — the same parameters as a docked strip, no label column
        </p>
        <GenSettingsBar>
          <GenSettingsItem>DPM++ 2M</GenSettingsItem>
          <GenSettingsItem>16:9</GenSettingsItem>
          <GenSettingsItem>1080p</GenSettingsItem>
          <GenSettingsItem>4 images</GenSettingsItem>
        </GenSettingsBar>
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">Entity row — names a thing, does not set it</p>
        <EntityRow
          icon={<Sparkles className="size-4" />}
          title="Upscale and refine"
          description="Runs a second pass at 2× before saving"
          trailing={<Switch aria-label="Enable upscale and refine" defaultChecked />}
        />
      </section>
    </div>
  ),
};
