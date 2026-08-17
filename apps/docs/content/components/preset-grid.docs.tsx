import type { ComponentDocs } from "@/lib/component-docs";
import {
  ColorOnlyPaletteSwatches,
  MultiSelectEnvironments,
  NamedPaletteSwatches,
  SeeMoreTileInGrid,
  ShowMoreLinkBelowGrid,
} from "./preset-grid.examples";

/**
 * Seeded from docs/design-system/component-specs.md#e4-preset-grid.
 * Translate the spec's internal voice into consumer-facing guidance — do not
 * ship the seed text verbatim.
 *
 * No "use client" here: this module is plain data read by a Server
 * Component (component-docs.tsx), which destructures `docs.whatItIs`,
 * `docs.evidence`, etc. directly. Live examples that need interactivity
 * live in the ./preset-grid.examples client sidecar and get referenced here
 * as zero-prop elements — see that file for why.
 */
export const PresetGridDocs: ComponentDocs = {
  whatItIs:
    "A grid of labelled thumbnail tiles a user picks a preset from directly — a visual style, a colour palette, a filter, or an environment — built on the same preview-tile (A8) frame as every other picker in the system. One component, driven by a different `items` array per content type, rather than four separate grids.",
  whyItMatters:
    "Visual parameters get visual pickers, never dropdowns — Midjourney's style browser, CapCut's filter grid, Freepik's environment picker, Simplified's filter set and Fotor's text-effect grid all show the option instead of naming it in a list. Because the four content types are the same interaction with different content, preset-grid absorbs all of them into one component instead of drifting into four near-identical ones over time.",
  evidence: ["Midjourney", "CapCut", "Freepik", "Simplified", "Fotor"],
  anatomy: [
    { slot: "preset-grid", note: "Root — the radiogroup (single-select) or group (multi-select) and the CSS grid live on the same element." },
    { slot: "preset-grid-tile", note: "One option: a role=\"radio\"/\"checkbox\" button wrapping a preview-tile (A8) for the frame, ring, badge and overlay label." },
    { slot: "preset-grid-swatch", note: "`palette` content only — the colour fill inside a tile. Decorative and aria-hidden; the tile's own label carries the accessible name." },
    { slot: "preset-grid-see-more", note: "The overflow affordance — a tile in the grid, in the same role container, never a link rendered below it." },
  ],
  usage:
    "Reach for it for any set of visual presets a user chooses directly rather than by name: styles, palettes, filters, environments. Pass `content` so palette items render their colour as the tile fill instead of a `thumbnail`. Default is single-select (`role=\"radiogroup\"`); pass `multiple` when presets can combine, like stacking an environment with a mood — that switches every tile to `role=\"checkbox\"` and `value`/`onValueChange` to an array. Set `visibleCount` to cap how many tiles show before the rest collapse behind the see-more tile.",
  dos: [
    {
      text: "Give every palette item a real, descriptive label (\"Sunset orange\"), not just a colour — that label is the only thing that tells a screen-reader or colourblind user which swatch is which.",
      example: <NamedPaletteSwatches />,
    },
    {
      text: "Pass `multiple` when presets can combine instead of faking multi-select on top of a single radiogroup — the whole group's role switches with it, not just the visual ring.",
      example: <MultiSelectEnvironments />,
    },
    {
      text: "Let `visibleCount` collapse the rest behind a see-more tile that lives inside the grid, so revealing more presets never reflows what's already on screen.",
      example: <SeeMoreTileInGrid />,
    },
  ],
  donts: [
    {
      text: "Don't render a palette swatch with no visible label — colour alone conveys nothing to assistive tech and nothing to a colourblind user either.",
      example: <ColorOnlyPaletteSwatches />,
    },
    {
      text: "Don't put a \"Show more\" link below the grid — a separate element outside the grid's own layout reflows everything beneath it when it expands, instead of just adding cells in place.",
      example: <ShowMoreLinkBelowGrid />,
    },
  ],
  accessibility: {
    keyboard: [
      "Every tile is its own tab stop. There is no roving tabindex — the source says so, and names A4 `choice-chips` as carrying the same accepted gap — so a twelve-preset grid is twelve stops, plus one more for the see-more tile.",
      'Arrow keys do nothing. The tiles carry `role="radio"` (or `role="checkbox"` under `multiple`), which is exactly the role a keyboard user expects to arrow through; here Tab is the only way between them, and Home and End do not work either.',
      "Space and Enter select, because each tile is a native `<button>` underneath its role. In single-select a tile can only ever be turned on — pressing the already-checked tile re-selects it — while under `multiple` the same press toggles it off.",
      'There is no `disabled` anywhere in the API. Every tile is focusable and activatable including one whose `state` is `"loading"` or `"failed"`, so a preset that is still resolving is picked exactly as easily as one that finished.',
    ],
    screenReader: [
      'The root is `role="radiogroup"`, or `role="group"` under `multiple`, and it has no accessible name. Nothing in the component supplies one — pass `aria-label` or `aria-labelledby` yourself. Props you spread land on that root, so this is the one name you can set from outside.',
      'A tile\'s name is read from its whole button subtree in DOM order: any text inside the `thumbnail` you passed, then the `badge`, then the overlay label. A badge reading "New" therefore announces before the preset name — "New Sunset orange, radio button" — which is the reverse of how it is read visually.',
      'For `content="palette"` the swatch is `aria-hidden` and `label` is literally the only thing an assistive-tech user gets. "Sunset orange" is a name; "Palette 3" is not, and there is no second chance at it.',
      'The see-more tile is a plain `<button>` sitting inside the radiogroup rather than a radio. Its name comes from `seeMoreLabel` plus an `sr-only` count — "See more — 8 more" — but a radiogroup\'s only expected children are radios, so it is a non-radio member of a set whose size assistive tech is trying to report.',
      "`loading` and `failed` are invisible here. `preview-tile` sets no `aria-busy` and adds no text for either, so all three states announce identically and only the ring and the fill distinguish them.",
    ],
    focus: [
      "Expanding the grid destroys the control that expanded it. Pressing see-more takes the hidden count to zero, the tile unmounts, and nothing restores focus — so focus falls to `<body>` and the next Tab restarts from the top of the page, at the moment the user has just revealed eight more options. Move focus to the first newly-revealed tile inside your own handler if that matters.",
      "Nothing else is lost across the expand: already-visible tiles keep their key and position, so React reuses their DOM nodes and a focus ring anywhere else in the grid survives.",
      "Both the tiles and the see-more tile draw their own `focus-visible:ring-2`, so focus is visible here without any global style.",
    ],
  },
  pitfalls: [
    "Wiring a tile's own onClick straight into preview-tile's `onSelect` prop — that renders preview-tile's internal Frame as a second, nested interactive button with `aria-pressed` toggle semantics, the wrong ARIA for a radio or checkbox. preset-grid deliberately renders preview-tile without `onSelect` and wraps it in its own single `role=\"radio\"`/`role=\"checkbox\"` button instead.",
    "Passing `multiple` without also reading `value` as an array — a consumer that keeps treating `onValueChange`'s payload as a single string will see every tile after the first look permanently selected or never update at all.",
    "Leaving `color` off a palette item and expecting the thumbnail slot to fall back to something visible — palette content ignores `thumbnail` entirely, so a missing `color` renders an empty tile with only the label visible.",
  ],
};
