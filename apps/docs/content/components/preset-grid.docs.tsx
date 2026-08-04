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
  pitfalls: [
    "Wiring a tile's own onClick straight into preview-tile's `onSelect` prop — that renders preview-tile's internal Frame as a second, nested interactive button with `aria-pressed` toggle semantics, the wrong ARIA for a radio or checkbox. preset-grid deliberately renders preview-tile without `onSelect` and wraps it in its own single `role=\"radio\"`/`role=\"checkbox\"` button instead.",
    "Passing `multiple` without also reading `value` as an array — a consumer that keeps treating `onValueChange`'s payload as a single string will see every tile after the first look permanently selected or never update at all.",
    "Leaving `color` off a palette item and expecting the thumbnail slot to fall back to something visible — palette content ignores `thumbnail` entirely, so a missing `color` renders an empty tile with only the label visible.",
  ],
};
