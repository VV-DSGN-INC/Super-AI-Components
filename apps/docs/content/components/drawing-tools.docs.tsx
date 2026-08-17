import type { ComponentDocs } from "@/lib/component-docs";
import {
  CategoriesInsteadOfTools,
  MaskFeedsGeneration,
  OneClickToolRail,
  SwatchesNamedByTheirValue,
} from "./drawing-tools.examples";

/**
 * Seeded from docs/design-system/component-specs.md#i5-drawing-tools.
 *
 * No "use client" here: this module is plain data read by a Server Component
 * (component-docs.tsx). Live examples live in the ./drawing-tools.examples
 * client sidecar and are referenced here as zero-prop elements.
 */
export const DrawingToolsDocs: ComponentDocs = {
  whatItIs:
    "The drawing side of an editor canvas: a tool rail, an optional shape rail, brush controls, a colour palette, and a mask mode. Rails are flat toggle-groups; a tool with alternates gets a small flyout beside it rather than a menu inside it. This component also covers what the catalog calls brush-controls — size, hardness and opacity ship here, not as a separate item.",
  whyItMatters:
    "Canva's draw tools, Fotor and Playground's mask brush all converge on the same layout, and they converge for a reason: drawing is a high-frequency, low-patience interaction. Every extra click between wanting the eraser and having the eraser is paid hundreds of times in a session, so the rail is flat and switching a tool is one click, always. Alternates still need somewhere to live, so they get a flyout hung off a sibling trigger — a picker, not a second level of menu. The second thing this pattern earns is the mask: in Playground and every inpainting product after it, brushing a region is how generation gets its input. That makes mask mode the bridge between an editor and a model, and the reason this is an AI component rather than a paint palette. Size, hardness and opacity are A6 field-row instances by way of E3's parameter slider, so the brush and the property inspector are the same grid rather than two grids that merely resemble each other.",
  evidence: ["Canva draw tools", "Fotor", "Playground mask brush"],
  anatomy: [
    { slot: "drawing-tools", note: "The root. Carries `data-mode`, which is `draw` or `mask`." },
    {
      slot: "drawing-tools-modes",
      note: "The draw/mask switch. Rendered only when you pass `onModeChange`.",
    },
    { slot: "drawing-tools-tool-rail", note: "The tool toggle-group, labelled by `toolRailLabel`." },
    {
      slot: "drawing-tools-tool",
      note: "One rail button. Icon-only on screen; the label ships as visually-hidden button content, never as a tooltip alone.",
    },
    {
      slot: "drawing-tools-tool-group",
      note: "Wraps a tool that has alternates, so the button and its flyout trigger are siblings rather than nested.",
    },
    {
      slot: "drawing-tools-flyout-trigger",
      note: "The chevron that opens the alternates. Present only where alternates exist.",
    },
    {
      slot: "drawing-tools-flyout",
      note: "The alternates, one flat list. Nothing inside it opens a further level.",
    },
    { slot: "drawing-tools-flyout-item", note: "One alternate — icon plus a visible label." },
    { slot: "drawing-tools-shape-rail", note: "The shape rail. The same rail on a second axis." },
    {
      slot: "drawing-tools-brush",
      note: "Size, hardness and opacity. Three A6 rows — look for `field-row` inside if you are checking that the grid really is shared.",
    },
    { slot: "drawing-tools-swatch-grid", note: "The palette. Suppressed while mask mode is on." },
    {
      slot: "drawing-tools-swatch",
      note: "One colour. Named, and marked with a check when selected, so selection is never carried by colour alone.",
    },
    { slot: "drawing-tools-mask", note: "The mask panel. Present only in mask mode." },
    {
      slot: "drawing-tools-mask-target",
      note: "Names what the mask is input to — `maskTargetLabel`, e.g. Inpaint.",
    },
    {
      slot: "drawing-tools-mask-status",
      note: "A live region reporting coverage, and instructing when nothing is brushed yet.",
    },
    { slot: "drawing-tools-mask-clear", note: "Clears the mask. Rendered only with `onClearMask`." },
  ],
  usage:
    'Reach for this whenever a canvas needs a brush — freehand drawing, annotation, or an inpainting mask. It is fully controlled: hold `activeToolId`, `activeShapeId`, `brush`, `activeSwatchId` and `mode` in your own state and update them from the callbacks, or nothing moves. Give every tool a real `label`; the buttons are icon-only and that label is the accessible name. Put alternates of one tool in its `variants` — a pen beside a pencil — and keep genuinely different tools at the top level, because the rail is what makes them one click away. For mask mode, pass `mode="mask"`, report `maskCoverage` from whatever owns the canvas, and set `maskTargetLabel` to the thing that will consume the mask, so the panel says what the brushing is for. Brush controls come from A6, so a property inspector sitting next to this panel lines up with it for free.',
  dos: [
    {
      text: "Keep the rail flat and put alternates on a flyout beside the tool, so every tool stays one click away.",
      example: <OneClickToolRail />,
    },
    {
      text: "Name what the mask feeds. Mask mode is the handoff to generation, and the panel should say so before anything has been brushed.",
      example: <MaskFeedsGeneration />,
    },
  ],
  donts: [
    {
      text: "Don't make the rail a set of categories with the real tools one flyout down — that is the nested menu the rail exists to replace, and it doubles the cost of every switch.",
      example: <CategoriesInsteadOfTools />,
    },
    {
      text: "Don't name a swatch after its own colour value. The name is the only thing anyone who cannot see the fill has, and repeating the fill back says nothing.",
      example: <SwatchesNamedByTheirValue />,
    },
  ],
  accessibility: {
    keyboard: [
      "Each rail is one tab stop, not one per tool. The underlying toggle group is a composite: Tab reaches the active button, Left and Right move between the rest, and focus wraps at both ends.",
      "A tool with `variants` adds a second tab stop. Its chevron is a plain sibling button rather than a member of the composite, so the arrow keys skip it and only Tab reaches it — a rail of six tools where four have alternates is ten stops, not six.",
      "Space and Enter commit a rail button. Escape and an outside click close a flyout, and choosing an alternate closes it too; nothing else is bound.",
      "The brush section is six tab stops, not three. Every `ParameterSlider` is a slider thumb plus a number field: arrow keys step the thumb by `step`, Home and End jump to `min` and `max`, and the field takes typed values.",
      'Every swatch is its own tab stop. The grid is a `role="group"` of plain buttons with no roving tabindex, so a 24-colour palette costs 24 Tab presses and the arrow keys do nothing inside it.',
      "There are no tool shortcuts — no B for brush, no E for eraser, no bracket keys for size. Every change goes through Tab and Enter, which is worth knowing before this sits beside a canvas people use all day.",
      "There is no `disabled` prop anywhere on this component. A panel that should be inert while a generation runs has to be unmounted or blocked by you.",
    ],
    screenReader: [
      "Rail buttons announce as toggle buttons with `aria-pressed`, named by the visually-hidden `label`. The icon is `aria-hidden`, so a tool given no `label` announces as an unnamed button.",
      'A rail button\'s name changes as the user works: once an alternate is chosen the button becomes that alternate and reports its label, so the same physical control announces as "Pen" and later as "Pencil".',
      'The chevron is named "Show <tool> alternates" from the parent tool\'s label, and the flyout is a group named "<tool> alternates". Both names come from the parent, so they keep pointing at the tool family even after the face changes.',
      'Every toggle group here passes `aria-orientation={undefined}`. The vendored wrapper writes that attribute onto a `role="group"`, which does not support it, and axe fails it as `aria-allowed-attr` — carry the line with you if you lift a rail out of this component.',
      "A swatch announces its `name`, never its fill, and reports `aria-pressed`. The palette therefore announces as a set of independent toggles even though only one can be active — the selection rule is visual (a ring and a check), not programmatic.",
      'Each slider thumb carries its row\'s label and speaks a formatted value ("70%", not "70"). The `endpoints` strings are `aria-hidden` and never announced, so anything they say has to survive in `description` too.',
      'The mask panel\'s status is a `role="status"` live region — the only thing here that announces on its own. It reads the coverage and the sentence naming what the mask feeds, in full, on every change.',
      "Nothing else announces. Switching tool, shape, colour or mode changes only `aria-pressed`, so a listener hears the new state of the control they pressed and nothing about what happened to the canvas.",
    ],
    focus: [
      "Choosing an alternate closes the flyout and focus returns to the chevron that opened it, not to the rail button whose face just changed. The next Left arrow does nothing, because focus is no longer inside the composite.",
      "Switching to mask mode unmounts the swatch grid. If focus was on a swatch it falls to `<body>` and the next Tab restarts from the top of the page — move focus to the mode switch yourself if you drive `mode` from anywhere but that control.",
      "Rail buttons, the chevron, swatches and the mask's Clear button each ship their own `focus-visible` ring. Flyout items take theirs from the shared toggle styles and the slider thumb from `ParameterSlider`, so the three treatments are not identical.",
    ],
  },
  pitfalls: [
    "Looking for `brush-controls`? It is here. Size, hardness and opacity were absorbed into this component rather than shipping as their own item, because a brush-size slider with no brush is not a pattern. Pass `brush` and the section appears; omit it and it does not render.",
    "The rail button becomes whichever alternate was last chosen, and keeps that face after you switch away and back. That is deliberate — it is what keeps a tool one click deep — but it means the button's accessible name changes as the user works. Do not key tests or analytics to the parent tool's label; key them to `data-tool`, which stays put.",
    "The component is controlled all the way down. Pass `activeToolId` without storing what `onToolChange` hands back and the rail will look like it is ignoring clicks. Related: Base UI's toggle group is a toggle set rather than a radio group, and this component deliberately drops the empty commit it emits when you press the already-active item, so a rail can never land on no tool at all.",
    "Swatch `value` is a raw CSS colour applied as an inline style, and it is the one thing in this component that is not a design token. That is correct — a user palette is content, not chrome — but it puts swatch colours outside the token gate and outside theming, and contrast against them is your problem if you place anything on top.",
    'The vendored `ToggleGroup` renders `role="group"` carrying an `aria-orientation` attribute that the role does not support, and axe fails it as `aria-allowed-attr`. Every group in here passes `aria-orientation={undefined}` to suppress it. If you add another toggle-group to this component, or lift a rail out of it, carry that line with you.',
    'The mask status is a `role="status"` live region, so coverage changes are announced. Do not update `maskCoverage` on every brush tick or the whole stroke gets narrated — debounce it to stroke end.',
  ],
};
