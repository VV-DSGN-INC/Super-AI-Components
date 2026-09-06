import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Bold, Highlighter, Italic, Link2 } from "lucide-react";
import { expect, userEvent, within } from "storybook/test";

import { ContextToolbar, type ContextToolbarAction } from "@/registry/super-ai/context-toolbar";
import { UnitInput } from "@/registry/super-ai/field-row";
import { ParameterPanel, ParameterSlider } from "@/registry/super-ai/parameter-panel";
import { PropertyInspector, PropertyRow, type PropertySection } from "@/registry/super-ai/property-inspector";
import { ResetAffordance } from "@/registry/super-ai/reset-affordance";
import { PropertyInspectorDocs } from "@/content/components/property-inspector.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const row = (label: string, unit: string, value: number) => (
  <PropertyRow key={label} label={label}>
    {(id) => <UnitInput id={id} unit={unit} defaultValue={value} />}
  </PropertyRow>
);

/**
 * One schema, keyed by element type. Selecting a different object is a lookup,
 * not a different panel.
 */
const SECTIONS: Record<string, PropertySection[]> = {
  text: [
    { id: "layout", label: "Layout", content: [row("Width", "px", 320), row("Height", "px", 64)] },
    { id: "typography", label: "Typography", content: [row("Size", "pt", 18), row("Leading", "%", 140)] },
    { id: "appearance", label: "Appearance", content: [row("Opacity", "%", 100)] },
  ],
  image: [
    { id: "layout", label: "Layout", content: [row("Width", "px", 640), row("Height", "px", 360)] },
    { id: "adjustments", label: "Adjustments", content: [row("Blur", "px", 0)] },
    { id: "appearance", label: "Appearance", content: [row("Opacity", "%", 100)] },
  ],
};

const SELECTION_LABELS: Record<string, string> = { text: "Heading", image: "Hero image" };

/**
 * The rail width the shipped demo uses. Not a design value this story
 * introduces — the panel has none of its own and stretches to its container.
 */
const Rail = ({ children }: { children: React.ReactNode }) => <div className="w-72">{children}</div>;

const meta: Meta<typeof PropertyInspector> = {
  title: "Super AI/Property Inspector",
  component: PropertyInspector,
  parameters: { layout: "centered", docs: { page: componentDocsPage(PropertyInspectorDocs) } },
  render: (args) => (
    <Rail>
      <PropertyInspector {...args} />
    </Rail>
  ),
};

export default meta;
type Story = StoryObj<typeof PropertyInspector>;

/**
 * The element type picks the variant. Switching selection also proves the
 * collapsed-state memory: collapse Layout on the text object, switch to the
 * image, switch back.
 */
export const PerElementType: Story = {
  args: { sections: SECTIONS, elementType: "text", selectionLabel: SELECTION_LABELS.text },
  render: function PerElementTypeStory(args) {
    const [type, setType] = useState<string>("text");
    return (
      <Rail>
        <div className="space-y-3">
          <div className="flex gap-1">
            {Object.keys(SECTIONS).map((key) => (
              <button
                key={key}
                type="button"
                aria-pressed={type === key}
                onClick={() => setType(key)}
                className="border-border data-[active=true]:bg-primary data-[active=true]:text-primary-foreground rounded-md border px-2 py-1 text-xs"
                data-active={type === key}
              >
                {SELECTION_LABELS[key]}
              </button>
            ))}
          </div>
          <PropertyInspector {...args} elementType={type} selectionLabel={SELECTION_LABELS[type]} />
        </div>
      </Rail>
    );
  },
  // The spec's third sentence — "sections remember collapsed state per element
  // type" — is the one behaviour this component owns outright, and the
  // description above has always claimed this story proves it. Until this play
  // function it demonstrated it by hand and proved nothing: the memory is a
  // `Record<elementType, Record<sectionId, boolean>>` kept inside the panel, so
  // a regression that flattened it to `Record<sectionId, boolean>` would look
  // identical on screen for as long as only one object was ever selected.
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const sectionState = (id: string) =>
      canvasElement.querySelector(`[data-section-id="${id}"]`)?.getAttribute("data-state");

    await expect(sectionState("layout")).toBe("open");
    await userEvent.click(canvas.getByRole("button", { name: "Layout" }));
    await expect(sectionState("layout")).toBe("closed");

    // Same section id, different element type: the collapse must not follow.
    await userEvent.click(canvas.getByRole("button", { name: "Hero image" }));
    await expect(sectionState("layout")).toBe("open");
    await expect(canvas.getByRole("button", { name: "Layout" })).toHaveAttribute("aria-expanded", "true");

    // …and it is still there on the way back, which is the half a
    // per-section map would get wrong.
    await userEvent.click(canvas.getByRole("button", { name: "Heading" }));
    await expect(sectionState("layout")).toBe("closed");
    await expect(canvas.getByRole("button", { name: "Typography" })).toHaveAttribute("aria-expanded", "true");
  },
};

/** Collapsible groups over A6 rows — Appearance starts closed. */
export const GroupedSections: Story = {
  args: {
    elementType: "image",
    selectionLabel: SELECTION_LABELS.image,
    sections: {
      image: [SECTIONS.image[0], SECTIONS.image[1], { ...SECTIONS.image[2], defaultOpen: false }],
    },
  },
};

/**
 * Two scopes. The group reset on the section header clears the whole section;
 * the row reset at the end of each A6 row puts one value back.
 */
export const Reset: Story = {
  args: { elementType: "text", selectionLabel: SELECTION_LABELS.text },
  render: function ResetStory(args) {
    const [width, setWidth] = useState(480);
    const [height, setHeight] = useState(64);
    const layoutModified = width !== 320 || height !== 64;
    return (
      <Rail>
        <PropertyInspector
          {...args}
          sections={{
            text: [
              {
                id: "layout",
                label: "Layout",
                state: layoutModified ? "modified" : "default",
                onReset: () => {
                  setWidth(320);
                  setHeight(64);
                },
                content: (
                  <>
                    <PropertyRow
                      label="Width"
                      state={width !== 320 ? "modified" : "default"}
                      onReset={() => setWidth(320)}
                    >
                      {(id) => <UnitInput id={id} unit="px" value={width} onValueChange={setWidth} />}
                    </PropertyRow>
                    <PropertyRow
                      label="Height"
                      state={height !== 64 ? "modified" : "default"}
                      onReset={() => setHeight(64)}
                    >
                      {(id) => <UnitInput id={id} unit="px" value={height} onValueChange={setHeight} />}
                    </PropertyRow>
                  </>
                ),
              },
              SECTIONS.text[1],
            ],
          }}
        />
      </Rail>
    );
  },
};

/**
 * Nothing selected — the default view of a real editor. Canvas-level rows stay
 * editable rather than the panel going blank.
 */
export const Empty: Story = {
  args: {
    elementType: null,
    sections: SECTIONS,
    emptyContent: (
      <>
        <PropertyRow label="Canvas" hint="Canvas size stays editable with nothing selected.">
          {(id, describedBy) => (
            <UnitInput id={id} aria-describedby={describedBy} unit="px" defaultValue={1920} />
          )}
        </PropertyRow>
        <PropertyRow label="Grid">{(id) => <UnitInput id={id} unit="px" defaultValue={8} />}</PropertyRow>
      </>
    ),
  },
};

/* -------------------------------------------------------------------------
 * Case stories — the situations this panel meets in a product, as opposed to
 * the prop combinations above. See docs/design-system/story-conventions.md
 * for which of the eight apply and why the two that are missing are missing.
 *
 * Not written for this component, deliberately:
 *
 * // case-skip: ReducedMotion — nothing in the composed tree moves; the one timed change is a colour crossfade
 * Grepped rather than assumed: across `property-inspector`, `field-row`,
 * `section-header` and `reset-affordance` there is exactly one `transition-*`
 * and no `animate-*` at all. The one is A11's `transition-colors`, a 150ms
 * hover fade between two text colours at a fixed position and a fixed size —
 * `reset-affordance`'s own skip line records why that is not motion, and
 * nothing about composing it here changes the answer.
 *
 * The thing a reader might expect to animate is the collapse, and it does not:
 * `PropertyInspectorSection` renders `{open ? rows : null}`, so a section snaps
 * open and shut with no height transition to suppress. That is a real design
 * decision (it is also why collapsing removes the rows from the tab order
 * outright), and it means there is no reduced-motion branch anywhere in the
 * panel for a story to document. `vitest.config.ts` already runs every story
 * under `reducedMotion: "reduce"`, so a ReducedMotion story here would render
 * pixel-identical to `GroupedSections` and imply coverage of a branch that
 * does not exist.
 *
 * // case-skip: Controlled — no value/onChange pair; the panel holds one piece of state and reports it without gating
 * There is no `value`/`onChange` and no equivalent. Read prop by prop:
 * `elementType`, `selectionLabel` and `sections` are rendering inputs the
 * canvas owns and the panel never proposes a change to — no callback exists
 * that could. The property values are not the panel's either: `PropertyRow`
 * hands your render function a `controlId` and holds nothing, so the
 * controlled pair a consumer actually wires is `UnitInput`'s
 * `value`/`onValueChange`, pinned in `FieldRow.stories.tsx`'s `Controlled`.
 * `state`/`onReset` repeat A11's shape — derived in, `() => void` out.
 *
 * That leaves the collapsed memory, which is the one thing the panel holds,
 * and it is uncontrolled by design: `onSectionOpenChange(elementType,
 * sectionId, open)` fires *after* `setOpenByType` has already moved the
 * section, so a host cannot refuse a collapse. The name reads like the second
 * half of A5's genuine `open`/`onOpenChange` pair and is not one — worth
 * knowing before you wire it expecting to gate. The payload is complete enough
 * to persist, and the way back in is `defaultOpen` on the per-type section
 * data rather than a prop on the panel. `PerElementType`'s play function pins
 * the memory itself; A5's controlled pair, which this panel drives as a
 * consumer, is pinned in `SectionHeader.stories.tsx`'s `Controlled`.
 * ---------------------------------------------------------------------- */

/** A visible focus treatment, wherever the focused thing happens to draw it. */
const hasRing = (el: Element) => {
  const style = getComputedStyle(el);
  return style.boxShadow !== "none" || style.outlineStyle !== "none";
};

/**
 * Right-to-left. Four trailing slots have to mirror and three of them are
 * free, which is the useful part of looking at this: the panel header is
 * `justify-between`, the section header is `justify-between`, and A6's
 * `grid-cols-[6rem_1fr]` resolves against the writing direction — so the
 * title moves to the right, the selection summary and both reset scopes land
 * at the logical end, and no `rtl:` utility appears anywhere in the component.
 * The fourth is inside `UnitInput`, where `pe-2`/`text-end` had to be written
 * logically for the unit suffix to follow the field; `field-row`'s own RTL
 * story records what that cost.
 *
 * Two absences are worth naming so nobody "fixes" them. `section-header`'s
 * collapsible trigger draws **no chevron** — the disclosure state is carried
 * by `aria-expanded` and by the rows appearing, so there is no arrow here to
 * point the wrong way. And A11's ↺ is a text character rather than an SVG,
 * left unmirrored on purpose (rotational reset marks conventionally are).
 *
 * The one thing that genuinely changes shape: the selection summary truncates
 * from the opposite end, because `truncate` follows the direction too.
 */
export const RTL: Story = {
  render: () => (
    <div dir="rtl">
      <Rail>
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
                  <>
                    <PropertyRow label="Width" state="modified" onReset={() => {}}>
                      {(id) => <UnitInput id={id} unit="px" defaultValue={640} />}
                    </PropertyRow>
                    <PropertyRow label="Height" onReset={() => {}}>
                      {(id) => <UnitInput id={id} unit="px" defaultValue={360} />}
                    </PropertyRow>
                  </>
                ),
              },
              {
                id: "adjustments",
                label: "Adjustments",
                state: "keyframed",
                defaultOpen: false,
                content: (
                  <PropertyRow label="Blur" state="keyframed" onReset={() => {}}>
                    {(id) => <UnitInput id={id} unit="px" defaultValue={12} />}
                  </PropertyRow>
                ),
              },
            ],
          }}
        />
      </Rail>
    </div>
  ),
};

/**
 * Tab traversal down a whole panel, and it pins the contract this component
 * exists to add on top of A11: **every reset in the panel announces which
 * thing it resets.** `reset-affordance` alone defaults its label to the bare
 * word "Reset", and A11's own `EmptyLabel` story records what six of those in
 * one inspector sound like. `PropertyRow` defaults `resetLabel` to
 * `Reset <label>` and `PropertyInspectorSection` names the group reset
 * `Reset <section>`, so the panel below announces four distinct controls where
 * the primitive would have announced four identical ones. Nothing else catches
 * this — axe has no rule against duplicate accessible names.
 *
 * The stop count is the other fact, and it is not the one a static panel
 * suggests. Eight stops for three sections and four rows, because two things
 * remove themselves: a reset at `state="default"` stays mounted and goes
 * `disabled` (so the row never reflows, and the keyboard never lands on a dead
 * control), and a collapsed section unmounts its rows outright rather than
 * hiding them. Editing a value therefore *adds* tab stops as you go.
 *
 * Recorded, not asserted — the docs module carries both: pressing a row reset
 * returns the row to default, which disables the button under the focus that
 * pressed it and drops focus to `<body>`; and changing `elementType` unmounts
 * the whole section stack, doing the same. Asserting either would pin
 * behaviour the panel should not keep.
 */
export const KeyboardOrder: Story = {
  render: () => (
    <Rail>
      <PropertyInspector
        elementType="text"
        selectionLabel="Heading"
        sections={{
          text: [
            {
              id: "layout",
              label: "Layout",
              state: "modified",
              onReset: () => {},
              content: (
                <>
                  <PropertyRow label="Width" state="modified" onReset={() => {}}>
                    {(id) => <UnitInput id={id} unit="px" defaultValue={480} />}
                  </PropertyRow>
                  <PropertyRow label="Height" onReset={() => {}}>
                    {(id) => <UnitInput id={id} unit="px" defaultValue={64} />}
                  </PropertyRow>
                </>
              ),
            },
            {
              id: "typography",
              label: "Typography",
              content: (
                <PropertyRow label="Size">
                  {(id) => <UnitInput id={id} unit="pt" defaultValue={18} />}
                </PropertyRow>
              ),
            },
            {
              id: "appearance",
              label: "Appearance",
              state: "modified",
              onReset: () => {},
              defaultOpen: false,
              content: (
                <PropertyRow label="Opacity" state="modified" onReset={() => {}}>
                  {(id) => <UnitInput id={id} unit="%" defaultValue={64} />}
                </PropertyRow>
              ),
            },
          ],
        }}
      />
    </Rail>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Every reset in the panel, at both scopes, carries its own name.
    const resets = Array.from(canvasElement.querySelectorAll<HTMLElement>('[data-slot="reset-affordance"]'));
    const names = resets.map((el) => el.getAttribute("aria-label"));
    await expect(names).toEqual(["Reset Layout", "Reset Width", "Reset Height", "Reset Size"]);
    await expect(new Set(names).size).toBe(names.length);

    // The collapsed group keeps its signal without keeping its control: the
    // dot is aria-hidden, so the panel states the same fact in text.
    await expect(canvasElement.querySelector('[data-section-id="appearance"]')).toHaveAttribute(
      "data-state",
      "closed",
    );
    await expect(canvas.getByText("Appearance modified")).toBeInTheDocument();
    // …and its row left the tab order entirely, not just the viewport.
    await expect(canvas.queryByRole("button", { name: "Reset Opacity" })).not.toBeInTheDocument();

    const expected = [
      canvas.getByRole("button", { name: "Layout" }),
      canvas.getByRole("button", { name: "Reset Layout" }),
      canvas.getByLabelText("Width"),
      canvas.getByRole("button", { name: "Reset Width" }),
      canvas.getByLabelText("Height"),
      // "Reset Height" and "Reset Size" are at default, so disabled, so skipped.
      canvas.getByRole("button", { name: "Typography" }),
      canvas.getByLabelText("Size"),
      canvas.getByRole("button", { name: "Appearance" }),
    ];

    for (const stop of expected) {
      await userEvent.tab();
      const focused = document.activeElement as HTMLElement;
      await expect(focused).toBe(stop);
      await expect(focused.matches(":focus-visible")).toBe(true);

      // `UnitInput` puts `outline-none` on the `<input>` and draws the ring on
      // its wrapper via `focus-within`, so the ring belongs to the focused
      // element or to that wrapper.
      const ringOwner = hasRing(focused) ? focused : focused.closest('[data-slot="unit-input"]');
      await expect(ringOwner).not.toBeNull();
      await expect(hasRing(ringOwner as HTMLElement)).toBe(true);
    }

    // The panel does not trap: the stop after the last one is outside it.
    await userEvent.tab();
    await expect(canvasElement.contains(document.activeElement)).toBe(false);
  },
};

/**
 * What omitting the optional labels costs, in the two places this panel lets
 * you omit them.
 *
 * `selectionLabel` falls back to `elementType`, and `elementType` is an open
 * string the caller invents — so the panel's `role="status"` line, the only
 * announcement it makes and the only thing naming which variant you are
 * looking at, reads out whatever key the schema happened to be stored under.
 * "shape" is a developer's word for a lookup key, not a name for the thing on
 * the canvas. (`CONTINUE.md` §8 records the same open string from the other
 * side: I3's `selection` is a closed four-member union and I2's is not.)
 *
 * `resetLabel` is the second, and it is where the `Reset <label>` default
 * stops being enough. The default is built from the *row* label and knows
 * nothing about the section above it, so a property that legitimately appears
 * in more than one group — opacity under Fill, Stroke and Shadow is the
 * ordinary case, not a contrived one — produces identical accessible names
 * again, one level up from the problem A11 has. Shadow below passes
 * `resetLabel` and is the only one of the three a screen-reader user can tell
 * apart. That is the fix; the docs do not currently say when you need it.
 */
export const EmptyLabel: Story = {
  render: () => (
    <Rail>
      <PropertyInspector
        elementType="shape"
        sections={{
          shape: [
            {
              id: "fill",
              label: "Fill",
              content: (
                <PropertyRow label="Opacity" state="modified" onReset={() => {}}>
                  {(id) => <UnitInput id={id} unit="%" defaultValue={80} />}
                </PropertyRow>
              ),
            },
            {
              id: "stroke",
              label: "Stroke",
              content: (
                <PropertyRow label="Opacity" state="modified" onReset={() => {}}>
                  {(id) => <UnitInput id={id} unit="%" defaultValue={100} />}
                </PropertyRow>
              ),
            },
            {
              id: "shadow",
              label: "Shadow",
              content: (
                <PropertyRow
                  label="Opacity"
                  state="modified"
                  resetLabel="Reset shadow opacity"
                  onReset={() => {}}
                >
                  {(id) => <UnitInput id={id} unit="%" defaultValue={35} />}
                </PropertyRow>
              ),
            },
          ],
        }}
      />
    </Rail>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // With no `selectionLabel`, the lookup key is what gets announced.
    await expect(canvas.getByRole("status")).toHaveTextContent("shape");

    // Two rows, one name between them — the default cannot see the section.
    await expect(canvas.getAllByRole("button", { name: "Reset Opacity" })).toHaveLength(2);

    // And the row that names itself is the one that is usable.
    await expect(canvas.getByRole("button", { name: "Reset shadow opacity" })).toBeInTheDocument();
  },
};

/**
 * ~90 characters in each of the three author-supplied slots, at the rail width
 * these ship at. The panel's answers differ per slot and only this story shows
 * them together:
 *
 * - **The selection summary truncates.** It is `min-w-0 truncate` and shares a
 *   baseline with the title, so a long name loses its tail rather than pushing
 *   the panel wider — and since it is also the `role="status"` announcement,
 *   the full name is still spoken. Truncated visually, complete to assistive
 *   tech, which is the right way round.
 * - **The section label truncates too**, with the group reset `shrink-0`
 *   beside it; `section-header`'s own `LongContent` records that priority.
 * - **The row label wraps.** A6's label column is a hard `6rem`, so a long
 *   property name wraps inside 96px and drives the row's height while the
 *   control stays on one line.
 *
 * The fourth is the one nothing else in the system documents: a long *value*
 * has nowhere to go. `UnitInput` is a fixed `w-20` with `text-end`, so a
 * canvas-scale number scrolls inside its own field and the leading digits are
 * the ones that go — a width of 1920000 reads as a smaller number rather than
 * as a clipped one. Values that big belong in a canvas-level row, not a
 * per-object one.
 */
export const LongContent: Story = {
  render: () => (
    <Rail>
      <PropertyInspector
        elementType="image"
        selectionLabel="Hero image — exported at 2× from the campaign master, revision 14"
        sections={{
          image: [
            {
              id: "adjustments",
              label: "Adjustments and colour grading applied before export",
              state: "modified",
              onReset: () => {},
              content: (
                <>
                  <PropertyRow
                    label="Shadow softness across the generated matte edge"
                    state="modified"
                    onReset={() => {}}
                  >
                    {(id) => <UnitInput id={id} unit="px" defaultValue={12} />}
                  </PropertyRow>
                  <PropertyRow label="Width" state="modified" onReset={() => {}}>
                    {(id) => <UnitInput id={id} unit="px" defaultValue={1920000} />}
                  </PropertyRow>
                </>
              ),
            },
          ],
        }}
      />
    </Rail>
  ),
};

/**
 * 375px. The panel is a rail on a desktop editor and full width on a phone,
 * and the width it is worst at is the one it gets here — but it holds: A6's
 * fixed `6rem` label column plus an 80px unit field plus a 20px reset leaves
 * slack at 375, and nothing scrolls sideways. `field-row`'s own `Mobile` makes
 * the same measurement for the row in isolation.
 *
 * What this width exposes is the target, not the layout, and it is A11's
 * finding multiplied by this component: row scope renders `size-5` — 20×20
 * with no padding, against WCAG 2.2's 24×24 minimum — and an inspector is
 * where that control stops being one button and becomes one per row, each a
 * thumb's width from a number field it must not be confused with. Group scope
 * (`size-6`) is exactly 24. Recorded there, repeated here because this is the
 * surface that ships a column of them.
 */
export const Mobile: Story = {
  render: () => (
    <div className="w-[375px] max-w-full">
      <PropertyInspector
        elementType="text"
        selectionLabel="Heading"
        sections={{
          text: [
            {
              id: "layout",
              label: "Layout",
              state: "modified",
              onReset: () => {},
              content: (
                <>
                  <PropertyRow label="Width" state="modified" onReset={() => {}}>
                    {(id) => <UnitInput id={id} unit="px" defaultValue={480} />}
                  </PropertyRow>
                  <PropertyRow label="Height" onReset={() => {}}>
                    {(id) => <UnitInput id={id} unit="px" defaultValue={64} />}
                  </PropertyRow>
                </>
              ),
            },
            {
              id: "typography",
              label: "Typography",
              content: (
                <PropertyRow label="Size" hint="Applies to the whole text object.">
                  {(id, describedBy) => (
                    <UnitInput id={id} aria-describedby={describedBy} unit="pt" defaultValue={18} />
                  )}
                </PropertyRow>
              ),
            },
          ],
        }}
      />
    </div>
  ),
};

/** The generation parameters E3 owns, held by the host as E3 requires. */
function GenerationParameters() {
  const [strength, setStrength] = useState(65);
  const [steps, setSteps] = useState(30);
  return (
    <ParameterPanel
      title="Parameters"
      modified={strength !== 65 || steps !== 30}
      onResetAll={() => {
        setStrength(65);
        setSteps(30);
      }}
    >
      <ParameterSlider
        label="Strength"
        value={strength}
        unit="%"
        endpoints={["More variable", "More literal"]}
        onValueChange={setStrength}
        reset={
          <ResetAffordance
            state={strength === 65 ? "default" : "modified"}
            label="Reset strength"
            onReset={() => setStrength(65)}
          />
        }
      />
      <ParameterSlider
        label="Steps"
        value={steps}
        min={10}
        max={60}
        onValueChange={setSteps}
        reset={
          <ResetAffordance
            state={steps === 30 ? "default" : "modified"}
            label="Reset steps"
            onReset={() => setSteps(30)}
          />
        }
      />
    </ParameterPanel>
  );
}

const TEXT_ACTIONS: ContextToolbarAction[] = [
  { id: "bold", label: "Bold", icon: <Bold /> },
  { id: "italic", label: "Italic", icon: <Italic /> },
  { id: "link", label: "Link", icon: <Link2 /> },
  { id: "highlight", label: "Highlight", icon: <Highlighter /> },
];

/**
 * The three surfaces that edit a selection, and the rule is what drives their
 * content:
 *
 * - **Property inspector (I2)** is driven by **what is selected**. Its section
 *   list is a lookup on element type, so selecting a different object changes
 *   the panel, and it has a real view for the case where nothing is selected
 *   at all. Two reset scopes, one per section and one per row.
 * - **Parameter panel (E3)** is driven by **the model**. Nothing is selected
 *   and nothing can be; it configures the run that has not happened yet, it
 *   has no empty state because it is never irrelevant, and its single group
 *   reset sits on the panel header rather than one per section. The rows are
 *   literally the same A6 rows with the same A11 resets, which is exactly why
 *   these two get mixed up.
 * - **Context toolbar (I3)** is driven by the selection too, and is the one
 *   this component is specced against: "six to eight actions maximum, past
 *   that it competes with the inspector". It holds verbs, floats over the
 *   canvas, and is capped.
 *
 * So: if the user is **typing or dragging a value**, it belongs in I2. If they
 * are **pressing a verb**, it belongs in I3 until there are more than eight of
 * them, at which point the cap sends the surplus back to I2. And if the panel
 * would show the same thing with nothing selected, it was never an inspector —
 * it is E3.
 */
export const Boundary: Story = {
  render: () => (
    <div className="flex w-full max-w-md flex-col gap-6">
      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">
          Property inspector — driven by the selection, two reset scopes
        </p>
        <Rail>
          <PropertyInspector
            elementType="text"
            selectionLabel="Heading"
            sections={{
              text: [
                {
                  id: "typography",
                  label: "Typography",
                  state: "modified",
                  onReset: () => {},
                  content: (
                    <>
                      <PropertyRow label="Size" state="modified" onReset={() => {}}>
                        {(id) => <UnitInput id={id} unit="pt" defaultValue={24} />}
                      </PropertyRow>
                      <PropertyRow label="Leading" onReset={() => {}}>
                        {(id) => <UnitInput id={id} unit="%" defaultValue={140} />}
                      </PropertyRow>
                    </>
                  ),
                },
              ],
            }}
          />
        </Rail>
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">
          Parameter panel — same rows, driven by the model, one reset scope
        </p>
        <Rail>
          <GenerationParameters />
        </Rail>
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">
          Context toolbar — the selection&rsquo;s verbs, capped at eight
        </p>
        <ContextToolbar selection="text" actions={TEXT_ACTIONS} onAction={() => {}} />
      </section>
    </div>
  ),
};
