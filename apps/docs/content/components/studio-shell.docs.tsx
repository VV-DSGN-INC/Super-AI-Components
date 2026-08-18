import type { ComponentDocs } from "@/lib/component-docs";
import {
  InspectorGoesBlankWhenEmpty,
  InspectorStaysUsefulWhenEmpty,
  PresetsFlattenedIntoInsertTiles,
  PresetsKeepTheirChosenness,
} from "./studio-shell.examples";

/**
 * Seeded from docs/design-system/block-specs.md — O3 `studio-shell`.
 *
 * No "use client" here: this module is plain data read by a Server Component
 * (component-docs.tsx), which destructures `docs.whatItIs`, `docs.evidence` and
 * the rest directly. Live examples live in the ./studio-shell.examples client
 * sidecar and arrive here as zero-prop elements.
 */
export const StudioShellDocs: ComponentDocs = {
  whatItIs:
    "The page shell for a creative studio editor: a vertical modality rail on the far left, an editor topbar across the top, a tool panel, the canvas itself, a properties inspector on the right, and a strip of pages or frames along the bottom. It is a block, not a component — it owns arrangement and nothing else. Ten already-shipped components fill the six regions, and each keeps its own props, its own state model and its own accessibility contract.",
  whyItMatters:
    "Canva, Fotor, Simplified, Spline and Tripo all put the same six things in the same six places, which is what makes this an archetype rather than one product's layout. Two of its rules are the ones worth copying. The rail chooses which tool panel is shown and never touches the canvas — that single separation is what keeps a screen this dense legible, and it is enforced here by the data model rather than by discipline, because the panels are keyed by modality while the canvas is one node. And the inspector is selection-driven, so its empty state is not an edge case: nothing selected is the state the editor sits in most of the time, which is why the panel has to stay useful rather than going blank.",
  evidence: ["Canva", "Fotor", "Simplified", "Spline", "Tripo"],
  anatomy: [
    {
      slot: 'data-region="modality-rail"',
      note: "B4 modality-rail. Full height on the left; its pinned group holds settings and help.",
    },
    {
      slot: 'data-region="topbar"',
      note: "B7 app-topbar in editor context — zoom and history, then the document name.",
    },
    {
      slot: 'data-region="tool-panel"',
      note: "I1 tool-panel for the active modality, with E4 preset-grid and F1 result-card as sections and I5 drawing-tools pinned below it.",
    },
    {
      slot: 'data-region="canvas"',
      note: "The artboard, plus I3 context-toolbar floating over it while something is selected.",
    },
    {
      slot: 'data-region="inspector"',
      note: "I2 property-inspector, keyed to the same selection that drives I3.",
    },
    { slot: 'data-region="page-strip"', note: "H5 frame-strip — pages, artboards or frames." },
    { slot: "studio-shell", note: "Root. A flex row: rail, then everything else." },
    {
      slot: "studio-shell-canvas-surface",
      note: "The element that actually scrolls. Carries the canvas name and its tab stop.",
    },
    {
      slot: "studio-shell-canvas-toolbar",
      note: "Positions I3 at the top or bottom of the canvas per its own placement flag.",
    },
    { slot: "studio-shell-results", note: "The F1 grid inside the tool panel's results section." },
  ],
  usage:
    "Reach for it when the primary object of your product is a document someone edits — a design, a board, a scene, a model. Fill `modalities` with the rail, then key `toolPanels` by the same ids: each entry is I1's own props plus three shortcuts, `presets` for an E4 grid, `results` for F1 cards, and `drawing` for I5 pinned below the panel. The canvas is `children` and never varies with the rail, which is deliberate. One `selection` object drives both the floating toolbar and the inspector, so passing nothing renders the shell's true default view — empty inspector, no toolbar — which is what most users are looking at most of the time. `frames` fills the bottom strip; pass `onAddFrame` and the strip's own add tile becomes its empty state.",
  dos: [
    {
      text: "Let presets arrive as E4 so the chosen one stays a programmatic state, not a ring.",
      example: <PresetsKeepTheirChosenness />,
    },
    {
      text: "Keep document-level properties in the inspector's empty content, so nothing selected is still somewhere to work.",
      example: <InspectorStaysUsefulWhenEmpty />,
    },
  ],
  donts: [
    {
      text: "Don't flatten presets into the panel's insert tiles — they become one-shot actions and nothing records which style is in force.",
      example: <PresetsFlattenedIntoInsertTiles />,
    },
    {
      text: "Don't let the inspector go blank when nothing is selected; that is the state the editor spends most of its time in.",
      example: <InspectorGoesBlankWhenEmpty />,
    },
  ],
  accessibility: {
    keyboard: [
      "Tab order is DOM order, and the DOM order is the layout: rail, topbar, tool panel, drawing tools, the floating toolbar, the canvas, the page strip, then the inspector. The inspector is last, so reaching it from the rail means tabbing through every control in the middle three regions — in a full editor that is a long way, and the shell provides no skip link and no keyboard shortcut to jump between regions.",
      "Three of the six regions take a tab stop of their own before any control inside them: the tool panel's scrolling body, the canvas surface, and the inspector column. Each is a scroll container, so each carries `tabIndex={0}` and a name (axe `scrollable-region-focusable`) — that is deliberate, and it means an empty editor is still three tab stops even with nothing on screen to press.",
      "The canvas surface is a focus target, not an editor. It scrolls with the arrow keys once focused and does nothing else — whatever you render into `children` brings its own keyboard model, and the shell adds none.",
      "The floating toolbar exists only while `selection` is set, so selecting something inserts a run of tab stops into the middle of the order and clearing the selection removes them. The stop count of this shell is not stable across a session.",
      "The page strip is a carousel: its previous and next buttons are real controls, and Left/Right arrows scroll it from anywhere inside it. H5 positions those buttons at `left-2` / `right-2`, inside the strip's own box, so they read against the strip's own edge rather than the page-strip region's.",
      "Below the `md` breakpoint the three middle regions become one scrolling column. The three inner tab stops remain, so a narrow viewport does not shorten the run — it lengthens the scroll.",
    ],
    screenReader: [
      "The shell contributes almost no landmarks. Five of the six regions are plain `<div>`s carrying `data-region`, which is a test handle and nothing more; only the topbar is a landmark, because `app-topbar` renders a bare `<header>` and so maps to `banner`. If your page already has a banner, this shell adds a second one.",
      "The tool panel, the canvas and the inspector column are `role=\"group\"` with names — `\"<modality> tools\"`, `canvasLabel` (default \"Canvas\") and `inspectorLabel` (default \"Properties\"). Groups are not landmarks, so none of the three appears in a landmark list; they are heard when focus enters them, and not before.",
      "The panel's name is derived, not passed: it is `\"<active modality label> tools\"`. That is the only thing tying the rail to the panel for assistive tech, so a rail item with a vague label produces a vaguely named panel.",
      "The inspector's selection line is `role=\"status\"`, so changing what is selected announces the new element type or `selection.label`. That is the only automatic announcement in the whole shell.",
      "Nothing announces a modality change. Switching the rail swaps the entire tool panel and renames the group, and a change to a group's accessible name is not announced — a screen-reader user has to enter the panel to discover it is now a different panel.",
      "The canvas has no accessible content of its own. With nothing on it, the region contains the empty state's text; with something on it, whatever you render is the entire story — the shell has no description of the document, its size, or what is selected beyond the inspector's status line.",
      "The composed children carry their own semantics unchanged: the preset grid keeps its radiogroup/checkbox chosen-ness, the frame strip's tiles keep `aria-current`, the panel's toggle tiles keep `aria-pressed`. Flattening any of them into plain buttons is the one change here that silently deletes state from assistive tech.",
    ],
    focus: [
      "Clearing the selection unmounts the floating toolbar. If focus was on one of its actions, it falls to `<body>` and the next Tab restarts from the top of the page — move focus back to the canvas surface in whatever handler clears the selection.",
      "Switching modality replaces the tool panel's contents while the panel element itself stays mounted. Focus on a tile in the old panel is therefore lost the same way; focus on the panel's own scroll region survives, because that element is not the thing being replaced.",
      "The shell never moves focus of its own accord. Nothing pulls focus to the canvas after a generation, to the inspector after a selection, or to the panel after a rail change — every one of those is yours to do.",
      "All three region tab stops ship `focus-visible:ring-2`, so landing on a scroll container is visible. The controls inside them inherit whatever their own component provides, which for every composed child here is the design system's ring.",
    ],
  },
  pitfalls: [
    "The spec said five regions and listed five, but its own `Filled by:` line named B7 and the FigJam wireframe drew a topbar. The 2026-08-08 reconciliation ruled for the wireframe, so this shell has six regions. If you are working from an older copy of the spec, the topbar is the one that is missing.",
    "I3's `selection` is a closed union of four — text, image, shape, media — while I2's element types are open strings. Sharing one selection object between them therefore narrows the inspector's variant key to those four. If you need an inspector variant for something I3 has no toolbar flavour for (a frame, a group, a camera), you currently cannot express it. The source fix is to widen I3's `selection` to a string with the four as a documented default set.",
    "The canvas backdrop is `bg-muted`, and `text-muted-foreground` on `bg-muted` measures 4.34:1 against a 4.5 minimum. A `className` override cannot reach inside a composed child that sets its own muted text, so the shell rebinds `--muted-foreground` on the canvas element instead. If you restyle the canvas surface, move the rebinding with the background or the contrast failure comes back through whatever you drop on the canvas.",
    "I3 cannot measure a canvas it does not own, and neither can this shell. `toolbar.placement` decides which end of the canvas the bar is pinned to, not where the selection is. A product that tracks selection geometry should position I3 itself rather than accept the shell's approximation.",
    "React's div props carry a legacy `results?: number` attribute, which collides with the tool panel's F1 list. The passthrough omits it. If you add another prop to a tool panel entry, check it against `React.ComponentProps<\"div\">` first — the collision is a type error at the interface, not at the call site, so it reads as unrelated.",
    "Below the `md` breakpoint the three middle regions stack into one scrolling column rather than being hidden. That is a deliberate trade: a canvas that shares a scroll container with the panel and the inspector is worse than three columns, and much better than a region a narrow viewport cannot reach at all. A real mobile editor should replace the panel and the inspector with sheets.",
    "Everything is controlled. Rendering the shell with a fixed `selection`, a fixed `activeModalityId` and no callbacks produces a screenshot of an editor, not an editor — wire the rail, the frame strip and the preset grid before demoing it.",
  ],
};
