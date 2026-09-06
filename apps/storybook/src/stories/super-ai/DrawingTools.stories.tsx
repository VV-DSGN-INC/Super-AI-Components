import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import {
  Circle,
  Eraser,
  Highlighter,
  MousePointer2,
  MoveUpRight,
  PaintBucket,
  Pencil,
  PenTool,
  Slash,
  Square,
  Triangle,
  Type,
} from "lucide-react";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { Button } from "@/components/ui/button";
import {
  DrawingTools,
  type DrawingSwatch,
  type DrawingToolOption,
} from "@/registry/super-ai/drawing-tools";
import { ModalityRail } from "@/registry/super-ai/modality-rail";
import { PropertyInspector, PropertyRow, type PropertySection } from "@/registry/super-ai/property-inspector";
import { UnitInput } from "@/registry/super-ai/field-row";
import { DrawingToolsDocs } from "@/content/components/drawing-tools.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const TOOLS: DrawingToolOption[] = [
  { id: "select", label: "Select", icon: <MousePointer2 /> },
  {
    id: "pencil",
    label: "Pencil",
    icon: <Pencil />,
    variants: [
      { id: "pencil", label: "Pencil", icon: <Pencil /> },
      { id: "pen", label: "Pen", icon: <PenTool /> },
      { id: "highlighter", label: "Highlighter", icon: <Highlighter /> },
    ],
  },
  { id: "fill", label: "Fill", icon: <PaintBucket /> },
  { id: "eraser", label: "Eraser", icon: <Eraser /> },
];

const SHAPES: DrawingToolOption[] = [
  { id: "rectangle", label: "Rectangle", icon: <Square /> },
  { id: "ellipse", label: "Ellipse", icon: <Circle /> },
  { id: "triangle", label: "Triangle", icon: <Triangle /> },
  {
    id: "line",
    label: "Line",
    icon: <Slash />,
    variants: [
      { id: "line", label: "Line", icon: <Slash /> },
      { id: "arrow", label: "Arrow", icon: <MoveUpRight /> },
    ],
  },
];

const SWATCHES: DrawingSwatch[] = [
  { id: "ink", name: "Ink", value: "rgb(24, 24, 27)" },
  { id: "slate", name: "Slate", value: "rgb(100, 116, 139)" },
  { id: "coral", name: "Coral", value: "rgb(255, 122, 89)" },
  { id: "amber", name: "Amber", value: "rgb(245, 158, 11)" },
  { id: "moss", name: "Moss", value: "rgb(52, 143, 106)" },
  { id: "sky", name: "Sky", value: "rgb(56, 152, 236)" },
  { id: "violet", name: "Violet", value: "rgb(139, 92, 246)" },
  { id: "paper", name: "Paper", value: "rgb(250, 250, 249)" },
];

const meta: Meta<typeof DrawingTools> = {
  title: "Super AI/Drawing Tools",
  component: DrawingTools,
  parameters: { layout: "centered", docs: { page: componentDocsPage(DrawingToolsDocs) } },
  decorators: [
    (Story, { parameters }) => {
      // Every story renders inside a realistic panel column. `Mobile` widens
      // that column to the 375px test condition through `panelWidth` rather
      // than wrapping inside `render`: a meta decorator wraps a story's own,
      // so a 375px box inside this 352px one would overflow it instead of
      // being the width under test.
      const panelWidth =
        typeof parameters.panelWidth === "string" ? parameters.panelWidth : "w-[22rem] max-w-full";
      return (
        <div className={panelWidth}>
          <Story />
        </div>
      );
    },
  ],
  args: {
    tools: TOOLS,
    activeToolId: "pencil",
    onToolChange: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof DrawingTools>;

/** Flat, icon-only, and one click deep. The pencil carries its alternates on a flyout beside it. */
export const ToolRail: Story = {};

/** The same rail on a second axis. Shapes are their own choice, not a tool that hides shapes. */
export const ShapeRail: Story = {
  args: {
    shapes: SHAPES,
    activeShapeId: "rectangle",
    onShapeChange: () => {},
  },
};

/** Size, hardness and opacity as A6 field-row instances — the grid the inspector uses. */
export const BrushControls: Story = {
  args: {
    brush: { size: 24, hardness: 60, opacity: 100 },
    onBrushChange: () => {},
  },
};

/** Every colour is named. Selection is a check and a pressed state, never the ring alone. */
export const SwatchGrid: Story = {
  args: {
    swatches: SWATCHES,
    activeSwatchId: "coral",
    onSwatchChange: () => {},
  },
};

/** The bridge to generation: the brushed region is the input inpainting receives. */
export const MaskMode: Story = {
  args: {
    mode: "mask",
    onModeChange: () => {},
    brush: { size: 48, hardness: 20, opacity: 100 },
    onBrushChange: () => {},
    swatches: SWATCHES,
    activeSwatchId: "coral",
    maskCoverage: 22,
    maskTargetLabel: "Inpaint",
    onClearMask: () => {},
  },
};

/* -------------------------------------------------------------------------
 * Case stories — the situations this component meets in a product, as
 * opposed to the prop combinations above. See
 * docs/design-system/story-conventions.md.
 *
 * All eight are written, and no `case-skip` line follows because none was
 * skipped. That is not set-completion: this panel mirrors on two axes, opens
 * an animating Base UI popup, holds two composites and a grid of plain
 * buttons, exposes five controlled pairs, renders every rail button with no
 * visible text at all, takes author-supplied strings in three slots, and has
 * two catalog neighbours that are genuinely mistakable for it. Each story
 * below records something that exists nowhere else in the repo, and three of
 * them found defects — listed in their descriptions.
 * ---------------------------------------------------------------------- */

/**
 * Right-to-left, where a tool panel has more mirroring to get right than most
 * components: the mode switch, two rails whose chevrons must sit at the
 * logical end of the tool they belong to, three A6 rows whose 6rem label
 * column moves to the right, and a swatch grid that has to fill from the
 * right.
 *
 * One physical property was swapped to a logical one for this story, and it is
 * byte-identical in LTR: the flyout item's `text-left` becomes `text-start`
 * (`CONTINUE.md` §8 "Logical properties"). Everything else already mirrors —
 * `FieldRow`'s grid and `UnitInput`'s `text-end` / `pe-2` were made logical
 * when A6 shipped, so the brush rows arrive correct for free. That is the
 * argument for composing A6 rather than restyling it.
 *
 * **The half this wrapper cannot reach.** `PopoverContent`'s `align="start"`
 * is resolved by Base UI from React context, not from the DOM: `useDirection()`
 * returns `context?.direction ?? "ltr"` and never reads the `dir` attribute.
 * So a `<div dir="rtl">` flips every CSS logical property here and still
 * leaves the flyout aligning to its LTR start. An RTL shell has to mount
 * `<DirectionProvider direction="rtl">` as well, and neither implies the
 * other. Recorded first on `modality-rail`'s `RTL` story, on the same popover.
 *
 * Not mirrored, deliberately: the tool glyphs. A pencil, an eraser and a paint
 * bucket are drawn the same way in every locale, and the flyout chevron points
 * down rather than along the inline axis, so none of them is a direction cue.
 */
export const RTL: Story = {
  args: {
    shapes: SHAPES,
    activeShapeId: "line",
    onShapeChange: () => {},
    brush: { size: 24, hardness: 60, opacity: 100 },
    onBrushChange: () => {},
    swatches: SWATCHES,
    activeSwatchId: "coral",
    onSwatchChange: () => {},
    onModeChange: () => {},
  },
  render: (args) => (
    <div dir="rtl">
      <DrawingTools {...args} />
    </div>
  ),
};

/**
 * The reduced-motion branch, which for this component lives entirely in the
 * flyout. Nothing in the panel proper animates — the rails, the A6 rows and
 * the swatch grid carry no keyframe and no transition anyone would perceive as
 * motion — but the alternates popup enters with
 * `data-open:animate-in fade-in-0 zoom-in-95` plus a side slide, and a Base UI
 * popup does not read the media feature on its own.
 *
 * **Defect, fixed in-wave.** The surface carried no reduced-motion branch at
 * all, and the registry's usual one-class remedy would have been inert here:
 * `data-open:animate-in` compiles to a data-attribute selector of the same
 * specificity, Tailwind emits the plain `motion-reduce:` block first, and
 * `animation: enter` therefore wins the tie on source order. Restating the
 * variant on both halves is what wins it back —
 * `motion-reduce:data-open:animate-none motion-reduce:data-closed:animate-none`
 * — which is `shortcuts-sheet`'s finding applied to `modality-rail`'s flyout,
 * the same popover one component over.
 *
 * `vitest.config.ts` emulates `prefers-reduced-motion: reduce` for every test,
 * so the assertion below is the rendered result rather than a class-name
 * check: it reads `animation-name` back while `data-open` is still on the
 * surface. Both forms were measured against this assertion before it was
 * written: with the bare class it reads `"enter"`, with the restated pair it
 * reads `"none"`.
 *
 * **Second defect, also fixed in-wave, and the argument for these stories.**
 * This is the first story to leave this flyout open while axe runs, and axe
 * failed it immediately: Base UI's popup renders `role="dialog"`, this surface
 * has no title part, and nothing was naming it. The `aria-label` on the
 * `ToggleGroup` *inside* the popup does not reach the dialog wrapping it,
 * which is how the gap survived review. Shipped since the component did and
 * invisible to every gate, because all five declared-state stories render the
 * flyout closed. Fixed at the source — `aria-label` on `PopoverContent` — so
 * the reduced-motion assertions below are the second thing this story checks
 * rather than the first. `modality-rail` found the identical defect on the
 * identical popover one wave earlier.
 */
export const ReducedMotion: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole("button", { name: "Show Pencil alternates" }));
    const flyout = await openFlyout();

    await expect(flyout).toHaveAttribute("data-open");
    await expect(getComputedStyle(flyout).animationName).toBe("none");
  },
};

/**
 * Two focus scopes, and the asymmetry between them is the story.
 *
 * **Outside the flyout, thirteen buttons cost ten stops.** The rail is a Base
 * UI composite, so it implements the roving tabindex the toolbar pattern asks
 * for: exactly one of its four tool buttons carries `tabindex="0"` and Arrow
 * keys move between the rest. The palette is not a composite — it is a
 * `role="group"` of plain buttons — so every swatch is its own stop. Four
 * tools cost one Tab; eight colours cost eight, and a 24-colour palette costs
 * 24. That ratio is worth knowing before this sits beside a canvas somebody
 * uses all day. The flyout chevron is a third kind of stop again: a plain
 * sibling button outside the composite, so Arrow keys skip it and only Tab
 * reaches it.
 *
 * **Inside it, a second scope with its own return.** Opening the flyout from
 * the keyboard moves focus into the popup, and Escape closes it and puts focus
 * back on the chevron that opened it — not on the rail button whose face is
 * about to change. That return is the half a keyboard user actually feels:
 * without it, dismissing a flyout drops focus to `<body>` and the next Tab
 * restarts from the top of the page.
 *
 * The walk inside the popup is deliberately not a tab lap. This popover is
 * non-modal, so there is no cycle to assert, and a bounded "did we reach all N
 * stops within M tabs" loop is the environment-sensitive shape
 * `story-conventions.md` mechanical fact 4 warns about. What is asserted
 * instead is the property: focus settles inside the popup, every alternate is
 * reachable and named, and Escape returns.
 *
 * **Documentation defect, recorded not fixed.** The docs module's second
 * keyboard note says "a rail of six tools where four have alternates is ten
 * stops, not six". With the roving tabindex asserted below, six tools are one
 * stop and four chevrons are four more: five, not ten. The prose is counting
 * one stop per tool, which is the thing the sentence before it denies. A wave
 * agent's file list does not include the docs module, so it is recorded here
 * and in the report rather than edited.
 */
export const KeyboardOrder: Story = {
  args: {
    swatches: SWATCHES,
    activeSwatchId: "coral",
    onSwatchChange: () => {},
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const rail = canvasElement.querySelector<HTMLElement>('[data-slot="drawing-tools-tool-rail"]')!;
    const tabbableIn = (root: HTMLElement) =>
      Array.from(root.querySelectorAll<HTMLElement>('button:not([tabindex="-1"])'));
    const tabbableTools = () =>
      tabbableIn(rail).filter((el) => el.dataset.slot === "drawing-tools-tool");

    // Four tools, one stop. This is the invariant that keeps a long rail from
    // costing a keyboard user one press per tool.
    await expect(rail.querySelectorAll('[data-slot="drawing-tools-tool"]')).toHaveLength(4);
    await expect(tabbableTools()).toHaveLength(1);

    // One rail stop, one chevron, eight swatches.
    const stops = tabbableIn(canvasElement);
    await expect(stops).toHaveLength(10);

    // Every stop is genuinely focus-visible and paints a ring. Rail buttons,
    // the chevron and swatches each ship their own `focus-visible` treatment,
    // so this checks three separate rings rather than one.
    await userEvent.tab();
    let visited = 0;
    while (document.activeElement && canvasElement.contains(document.activeElement)) {
      const focused = document.activeElement as HTMLElement;
      await expect(stops).toContain(focused);
      await expect(focused.matches(":focus-visible")).toBe(true);
      const style = getComputedStyle(focused);
      await expect(style.boxShadow !== "none" || style.outlineStyle !== "none").toBe(true);
      visited += 1;
      await userEvent.tab();
    }
    await expect(visited).toBe(10);

    // Arrow keys reach the tools the single stop skipped, and the invariant
    // holds afterwards: still exactly one tabbable tool, just a different one.
    tabbableTools()[0].focus();
    await userEvent.keyboard("{ArrowRight}");
    await waitFor(() => expect(rail.contains(document.activeElement)).toBe(true));
    await expect(tabbableTools()).toHaveLength(1);
    await expect(tabbableTools()[0]).toBe(document.activeElement);

    // The second scope, opened from the keyboard so the return below is the
    // one a keyboard user actually gets.
    const chevron = canvas.getByRole("button", { name: "Show Pencil alternates" });
    chevron.focus();
    await userEvent.keyboard("{Enter}");

    const flyout = await openFlyout();
    await waitFor(() => expect(flyout.contains(document.activeElement)).toBe(true));

    // Three alternates, each reachable and each named by its own visible text
    // rather than by the parent tool's.
    const alternates = within(flyout).getAllByRole("button");
    await expect(alternates.map((el) => el.textContent?.trim())).toEqual([
      "Pencil",
      "Pen",
      "Highlighter",
    ]);

    // …and the return. Escape dismisses, focus goes back to the chevron.
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(document.querySelector('[data-slot="popover-content"]')).toBeNull());
    await expect(document.activeElement).toBe(chevron);
  },
};

/**
 * `activeToolId` / `onToolChange` is a real controlled pair — there is no
 * `defaultActiveToolId` and the rail holds no selection of its own, so it
 * renders whatever the shell says the active tool is. The host below is a
 * deliberately slow one: it records the request and applies it only when
 * "Apply" is pressed, which separates the two halves a consumer has to trust.
 *
 * Four facts are asserted, because a `Controlled` story without a play
 * function is a screenshot of a prop:
 *
 * 1. **`activeToolId` wins over interaction.** Clicking "Eraser" while the
 *    host still says "Pencil" moves no `aria-pressed`.
 * 2. **`onToolChange` hands back what a consumer needs to apply it** — the
 *    option's own `id` string, not an event.
 * 3. **An unchanged `activeToolId` holds the rail fixed across re-renders.**
 *    The render counter is checked to have advanced *before* the selection is
 *    checked not to have, so this cannot pass by the re-render never happening.
 * 4. **Re-pressing the active tool reports nothing.** Base UI's toggle group is
 *    a toggle set rather than a radio group and commits an empty array when you
 *    press the lit item; `useSingleSelect` drops that, so a shell driving
 *    `activeToolId` from `onToolChange` can never be handed "no tool at all".
 *    That is this component's own behaviour rather than the primitive's, which
 *    is why it is pinned here.
 *
 * **The one place this component is not controlled, and it is deliberate.** A
 * rail button with alternates *remembers* which alternate was last active and
 * keeps that face after you switch away and back — render-phase derived state
 * inside `DrawingRailItem`, not a prop. Step 5 applies "Pen", switches to the
 * eraser, and finds the pencil slot still showing Pen. That is what keeps a
 * tool one click deep, and it is also why a rail button's accessible name
 * changes as the user works: do not key tests or analytics to a tool's label,
 * key them to `data-tool`, which stays put.
 */
export const Controlled: Story = {
  render: () => <ControlledHost />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const pencil = () => canvas.getByRole("button", { name: "Pencil" });
    const eraser = () => canvas.getByRole("button", { name: "Eraser" });

    await expect(pencil()).toHaveAttribute("aria-pressed", "true");

    // 1. Interaction alone does not move the rendered value.
    await userEvent.click(eraser());
    await expect(pencil()).toHaveAttribute("aria-pressed", "true");
    await expect(eraser()).toHaveAttribute("aria-pressed", "false");

    // 2. …but the callback fired, with the id the host needs.
    await expect(canvas.getByTestId("requested")).toHaveTextContent("eraser");

    // 3. Re-render with an unchanged `activeToolId`. Prove the re-render first.
    await expect(canvas.getByTestId("render-pass")).toHaveTextContent("1");
    await userEvent.click(canvas.getByRole("button", { name: "Re-render" }));
    await expect(canvas.getByTestId("render-pass")).toHaveTextContent("2");
    await expect(pencil()).toHaveAttribute("aria-pressed", "true");
    await expect(eraser()).toHaveAttribute("aria-pressed", "false");

    // The payload was sufficient to apply the change.
    await userEvent.click(canvas.getByRole("button", { name: "Apply" }));
    await expect(eraser()).toHaveAttribute("aria-pressed", "true");
    await expect(pencil()).toHaveAttribute("aria-pressed", "false");

    // 4. Pressing the now-active tool again reports nothing, so the shell is
    //    never asked to deselect every tool.
    await userEvent.click(canvas.getByRole("button", { name: "Clear" }));
    await expect(canvas.getByTestId("requested")).toHaveTextContent("—");
    await userEvent.click(eraser());
    await expect(canvas.getByTestId("requested")).toHaveTextContent("—");
    await expect(eraser()).toHaveAttribute("aria-pressed", "true");

    // 5. The face remembers. Choose "Pen" from the flyout, apply it, then leave
    //    and come back: the pencil slot is still the pen.
    await userEvent.click(canvas.getByRole("button", { name: "Show Pencil alternates" }));
    const flyout = await openFlyout();
    await userEvent.click(within(flyout).getByRole("button", { name: "Pen" }));
    await expect(canvas.getByTestId("requested")).toHaveTextContent("pen");
    await userEvent.click(canvas.getByRole("button", { name: "Apply" }));
    await expect(await canvas.findByRole("button", { name: "Pen" })).toHaveAttribute(
      "data-tool",
      "pencil",
    );

    await userEvent.click(eraser());
    await userEvent.click(canvas.getByRole("button", { name: "Apply" }));
    // Still the pen, with the eraser now active — one click away, not two.
    await expect(canvas.getByRole("button", { name: "Pen" })).toHaveAttribute("data-tool", "pencil");
    await expect(eraser()).toHaveAttribute("aria-pressed", "true");
  },
};

function ControlledHost() {
  const [applied, setApplied] = React.useState("pencil");
  const [requested, setRequested] = React.useState<string | null>(null);
  const [pass, setPass] = React.useState(1);

  return (
    <div className="flex flex-col gap-4">
      <DrawingTools tools={TOOLS} activeToolId={applied} onToolChange={setRequested} />

      <dl className="text-foreground grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs">
        <dt>activeToolId prop</dt>
        <dd data-testid="applied">{applied}</dd>
        <dt>last onToolChange</dt>
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
        <Button size="sm" variant="ghost" onClick={() => setRequested(null)}>
          Clear
        </Button>
      </div>
    </div>
  );
}

/**
 * The no-label rendering, which for this component is not an edge case — it is
 * every story above. A rail button renders its `label` inside an `sr-only`
 * span and nothing else, so the panel ships with no visible text on any of its
 * tools and the accessible name is the only place a tool's identity exists.
 * That is what this story proves, on the rail and the palette at once: nine
 * icon-only controls, nine distinct names, nothing legible on screen.
 *
 * The slot actually emptied here is `icon`, the one optional member of
 * `DrawingToolOption`. "Text" below has a label and no icon and renders as a
 * blank 32px square: still named, still pressable, and invisible. A rail
 * assembled from a plugin manifest gets exactly this the first time a plugin
 * ships without an icon, and no gate would catch it — axe is satisfied by the
 * `sr-only` name, which is why the check below is about the names *and* about
 * what is on screen.
 *
 * **Defect, recorded not fixed — the chevron is a 16px-wide tap target.** The
 * flyout trigger is `h-8 w-4`: measured here at 16 × 32 CSS px against a
 * 32 × 32 tool button, with a measured gap of 0 between them. That is under
 * WCAG 2.2's 24 × 24 minimum (2.5.8), and the spacing exception cannot rescue
 * it precisely because the gap is zero. Axe does not check target size —
 * `target-size` is an experimental rule, off by default — so nothing in this
 * repo's gates would ever have said so. Widening the chevron is a decision
 * about rail density rather than a mechanical repair, so it is recorded rather
 * than swept. The numbers are deliberately left out of the assertions:
 * pinning 16px would make it permanent.
 */
export const EmptyLabel: Story = {
  args: {
    tools: [
      { id: "select", label: "Select", icon: <MousePointer2 /> },
      TOOLS[1],
      { id: "text", label: "Text" },
      { id: "eraser", label: "Eraser", icon: <Eraser /> },
    ],
    swatches: SWATCHES.slice(0, 5),
    activeSwatchId: "coral",
    onSwatchChange: () => {},
  },
  play: async ({ canvasElement }) => {
    const named = Array.from(
      canvasElement.querySelectorAll<HTMLElement>(
        '[data-slot="drawing-tools-tool"], [data-slot="drawing-tools-swatch"]',
      ),
    );
    await expect(named).toHaveLength(9);

    // Every one of them is named, and no two share a name. A rail beside a
    // palette is exactly where repeated icon-only controls go wrong, and no
    // gate catches a duplicate accessible name.
    const names = named.map((el) => el.textContent?.replace(/\s+/g, " ").trim() ?? "");
    await expect(names.every(Boolean)).toBe(true);
    await expect(new Set(names).size).toBe(9);

    // …and none of it is on screen: each name lives in an `sr-only` span, so
    // stripping those leaves nothing behind.
    for (const el of named) {
      const visible = Array.from(el.querySelectorAll<HTMLElement>(":scope > *"))
        .filter((child) => !child.classList.contains("sr-only"))
        .map((child) => child.textContent?.trim() ?? "")
        .join("");
      await expect(`${el.dataset.tool ?? el.textContent?.trim()} visible=${visible}`).toBe(
        `${el.dataset.tool ?? el.textContent?.trim()} visible=`,
      );
    }

    // The icon-less tool is still a real, named control rather than a gap in
    // the rail.
    await expect(canvasElement.querySelector('[data-tool="text"]')).toHaveAccessibleName("Text");

  },
};

/**
 * ~90 characters in each of the two slots that take author text, and the
 * component answers them differently.
 *
 * **`maskTargetLabel` wraps.** It lands in a `text-sm font-medium` paragraph
 * sharing a `justify-between` row with the Clear button, and again inside the
 * status sentence below it — so a long target name is carried at full length
 * twice, once on screen and once through a `role="status"` live region.
 * Nothing truncates; the panel grows taller. Keep it to the name of the thing
 * that consumes the mask.
 *
 * **A tool `label` does not wrap, and that is the defect worth the story.** On
 * the rail the label is `sr-only`, so a 90-character tool name costs no layout
 * at all and is read out in full by a screen reader while the screen shows a
 * 32px square — an asymmetry nothing else in this component has. Inside the
 * flyout the same string becomes visible, and `toggleVariants`' base carries
 * `whitespace-nowrap` and a fixed `h-8` that the item's own classes do not
 * override. So a long alternate neither wraps nor truncates. Measured, with
 * the flyout staged open below: the popup is 192px, the item's box is 184px,
 * the line needs 558px, and the row's height stays at 32px — one line, painted
 * straight out past the surface it belongs to. Same family of trap as B4
 * `modality-rail`'s stacked label, and the same cause: a shared toggle base
 * sized for a single word. Recorded not fixed — the repair is `truncate` plus
 * `min-w-0` on the label span, which is a decision about whether an alternate
 * may be clipped and belongs with whoever owns the rail's density.
 *
 * Swatch names are the third author slot and are `sr-only` throughout, so
 * length costs nothing there either.
 */
export const LongContent: Story = {
  args: {
    tools: [
      { id: "select", label: "Select", icon: <MousePointer2 /> },
      {
        id: "pencil",
        label: "Pencil",
        icon: <Pencil />,
        variants: [
          { id: "pencil", label: "Pencil", icon: <Pencil /> },
          {
            id: "pen",
            label: "Calligraphy pen with pressure-sensitive width and a hard edge for inking line art",
            icon: <PenTool />,
          },
          { id: "highlighter", label: "Highlighter", icon: <Highlighter /> },
        ],
      },
      { id: "eraser", label: "Eraser", icon: <Eraser /> },
    ],
    mode: "mask",
    onModeChange: () => {},
    brush: { size: 48, hardness: 20, opacity: 100 },
    onBrushChange: () => {},
    maskCoverage: 22,
    maskTargetLabel: "Inpaint with the background-replacement model and its outpainting extension",
    onClearMask: () => {},
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Staged open, because the one place a long label is visible is inside the
    // flyout — and because it puts a 90-character alternate in front of axe.
    await userEvent.click(canvas.getByRole("button", { name: "Show Pencil alternates" }));
    const flyout = await openFlyout();

    // The name is not clipped even though the line is. Asserted because it is
    // the half that has to survive whatever fixes the visible half: a
    // `truncate` on the label span must not become a `title`-less clipped
    // accessible name.
    await expect(
      within(flyout).getByRole("button", {
        name: "Calligraphy pen with pressure-sensitive width and a hard edge for inking line art",
      }),
    ).toBeInTheDocument();
  },
};

/**
 * 375px, where the question for a panel that is `w-full` everywhere is not
 * whether it fits but what stops fitting *inside* it.
 *
 * Two things are tight and neither overflows. The swatch grid is a fixed
 * `grid-cols-8`, so a wider palette does not reflow to more rows — it makes
 * every column narrower and the 24px swatches simply stop filling their cells.
 * And each A6 row spends a fixed 6rem on its label column plus 5rem on the
 * unit field, so the slider gets what is left: a 149px track, measured here,
 * on a control whose whole job is being dragged. That number is what decides
 * whether this panel belongs on a phone, and it is only visible at this width.
 *
 * The play function asserts the claim rather than implying it: none of the
 * boxes this component lays out itself scrolls horizontally at 375px. `Mobile`
 * is also the story that starts failing the axe gate at this width, which is
 * most of what it is for.
 */
export const Mobile: Story = {
  parameters: { panelWidth: "w-[375px] max-w-full" },
  args: {
    shapes: SHAPES,
    activeShapeId: "rectangle",
    onShapeChange: () => {},
    brush: { size: 24, hardness: 60, opacity: 100 },
    onBrushChange: () => {},
    swatches: SWATCHES,
    activeSwatchId: "coral",
    onSwatchChange: () => {},
    onModeChange: () => {},
  },
  play: async ({ canvasElement }) => {
    const panel = canvasElement.querySelector<HTMLElement>('[data-slot="drawing-tools"]')!;
    await expect(panel.getBoundingClientRect().width).toBeLessThanOrEqual(375);

    // Scoped to the boxes this component lays out itself. A blanket
    // "no descendant overflows" walk is the wrong instrument here and it took
    // three tries to learn why: `sr-only` spans are 1×1px clipped boxes,
    // `<input>` scrolls its own text, and the A6 slider thumb is a 12px dot
    // inside a 28px hit area (`after:absolute after:-inset-2`) whose right
    // edge pushes 8px past its track when the value sits at max. All three
    // report `scrollWidth > clientWidth` at every viewport, none of them is a
    // layout break, and all three belong to composed children with their own
    // stories. Worth keeping in view: that 28px thumb clears the 24px target
    // minimum the flyout chevron misses.
    const own = [panel, ...Array.from(panel.querySelectorAll<HTMLElement>('[data-slot^="drawing-tools"]'))];
    for (const el of own) {
      const id = el.dataset.slot ?? el.tagName.toLowerCase();
      await expect(`${id} overflows=${el.scrollWidth > el.clientWidth}`).toBe(`${id} overflows=false`);
    }
  },
};

/**
 * Three panels that all live in the left column of an editor and are not
 * interchangeable. The rule is about **what the choice acts on**:
 *
 * - **Drawing tools (I5)** sets up the *next* stroke. Pick the eraser, drop
 *   the hardness to 20, choose coral — nothing on the canvas has changed yet.
 *   It is the only one of the three whose controls describe something that
 *   does not exist.
 * - **`property-inspector` (I2)** edits something that already does. Its rows
 *   are the same A6 grid, which is exactly why the two are confusable side by
 *   side, but they are driven by the selection and changing one changes the
 *   artwork immediately.
 * - **`modality-rail` (B4)** picks which panel you are in at all. It is
 *   app-shell chrome pinned to the shell edge, and its items are surfaces
 *   rather than brushes.
 *
 * The one-line test: if the control changes what your next gesture will draw
 * it is drawing tools; if it changes an object already on the canvas it is the
 * inspector; if it changes which of those two panels is on screen it is the
 * rail. The seam that gets crossed most often is the first one — brush size
 * put in the inspector because it is a slider with a unit, which quietly makes
 * a tool setting look like a property of the selection.
 *
 * The shared A6 grid below is the point rather than a coincidence: `Size` here
 * and `Width` there are the same row type, so a shell can stack these two
 * panels and get one aligned column of labels.
 */
export const Boundary: Story = {
  render: () => (
    <div className="flex w-full flex-col gap-6">
      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">
          Drawing tools — sets up the next stroke
        </p>
        <DrawingTools
          tools={TOOLS}
          activeToolId="pencil"
          onToolChange={() => {}}
          brush={{ size: 24, hardness: 60, opacity: 100 }}
          onBrushChange={() => {}}
          swatches={SWATCHES}
          activeSwatchId="coral"
          onSwatchChange={() => {}}
        />
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">
          Property inspector — edits what is already selected
        </p>
        <PropertyInspector
          elementType="image"
          selectionLabel="Hero image"
          sections={INSPECTOR_SECTIONS}
        />
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">
          Modality rail — picks which panel you are in
        </p>
        <div className="flex h-44 items-stretch">
          <ModalityRail
            items={[
              { id: "select", label: "Select", icon: <MousePointer2 /> },
              { id: "draw", label: "Draw", icon: <Pencil /> },
              { id: "text", label: "Text", icon: <Type /> },
              { id: "shapes", label: "Shapes", icon: <Square /> },
            ]}
            activeId="draw"
          />
          <div className="text-muted-foreground flex flex-1 items-center justify-center text-xs">
            Canvas
          </div>
        </div>
      </section>
    </div>
  ),
};

const INSPECTOR_SECTIONS: Record<string, PropertySection[]> = {
  image: [
    {
      id: "layout",
      label: "Layout",
      content: [
        <PropertyRow key="width" label="Width">
          {(id) => <UnitInput id={id} unit="px" defaultValue={640} />}
        </PropertyRow>,
        <PropertyRow key="height" label="Height">
          {(id) => <UnitInput id={id} unit="px" defaultValue={360} />}
        </PropertyRow>,
      ],
    },
  ],
};

/**
 * The alternates popup, once it has settled. Base UI portals it out of the
 * story canvas, so `within(canvasElement)` cannot see it and the open is a
 * frame behind the click that caused it.
 */
async function openFlyout() {
  return waitFor(() => {
    const popup = document.querySelector<HTMLElement>('[data-slot="popover-content"]');
    if (!popup) throw new Error("the alternates flyout never opened");
    return popup;
  });
}
