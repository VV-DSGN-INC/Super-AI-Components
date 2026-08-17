import type { ComponentDocs } from "@/lib/component-docs";
import { LabelPlacementOverlayAndBelow, PickableAndInertTiles } from "./preview-tile.examples";

/**
 * Seeded from docs/design-system/component-specs.md#a8-preview-tile.
 * Translate the spec's internal voice into consumer-facing guidance — do not
 * ship the seed text verbatim.
 *
 * No "use client" here: this module is plain data read by a Server Component
 * (component-docs.tsx). The two dos hang on `onSelect`, so their live renders
 * live in the ./preview-tile.examples client sidecar and arrive here as
 * zero-prop elements.
 *
 * Two notes on what is deliberately absent.
 *
 * `evidence`: A8 is the only entry in its family with no Evidence line of its
 * own — the spec calls it "the load-bearing primitive" and cites products
 * against its consumers instead. The five below are lifted from those
 * consumers' Evidence lines (E4 preset-grid, C4 recent-grid, H5 frame-strip),
 * not invented for this page.
 *
 * `donts` carry no live example. The two that matter here are a control
 * nested inside an interactive frame, and toggle ARIA on a mutually-exclusive
 * grid — rendering either would ship the exact violation it warns against
 * onto this page. They stay prose; the dos carry the renders.
 */
export const PreviewTileDocs: ComponentDocs = {
  whatItIs:
    "The fixed-aspect frame every picker, grid and strip is built out of: one aspect-ratio box, a children slot for whatever it holds, an optional label and badge, and a selection ring. It never knows what is inside it — image, video, colour swatch, text card or a 3D viewport all arrive through the same slot — and it carries four content states — showing its content, loading, locked, failed — that swap what fills the frame without ever changing the frame itself.",
  whyItMatters:
    "It is the reason a grid of results never jumps. Selection is a ring rather than a border, so choosing a tile adds no layout; loading, locked and failed replace the contents rather than the box, so a cell is exactly as tall while it waits as it is once it resolves. Thirteen components in this registry import it — preset-grid, recent-grid, frame-strip, tool-panel and result-card among them — which is what makes a Midjourney-style preset picker, a Descript project shelf and a CapCut frame strip the same component with different content, rather than three grids that drift apart.",
  evidence: ["Midjourney", "CapCut", "Freepik", "Descript", "Canva"],
  anatomy: [
    {
      slot: "preview-tile",
      note: 'The outer wrapper, and where every prop you spread lands. Carries data-state, mirroring the state prop ("default" for a tile showing its content, then "loading" | "locked" | "failed") — style against that attribute rather than re-deriving the state.',
    },
    {
      slot: "preview-tile-frame",
      note: "The aspect-ratio box itself, and the only thing that can be interactive. It renders as a <button> when you pass onSelect and as an inert <div> otherwise; the selection ring is drawn on it either way.",
    },
    {
      slot: "preview-tile-loading",
      note: "The skeleton that fills the frame while the content is on its way. Pulses, and stops pulsing under prefers-reduced-motion.",
    },
    {
      slot: "preview-tile-locked",
      note: "The scrim over content the viewer cannot have yet. The children stay rendered underneath it — a locked tile shows the shape of what would have been made, never an empty box.",
    },
    {
      slot: "preview-tile-failed",
      note: "Replaces the content when a generation fails. Hosts whatever you passed as action, usually a retry control.",
    },
    {
      slot: "preview-tile-badge",
      note: "Top-corner overlay for a duration, a tier mark or a queue position. Absolutely positioned, so it costs the frame no layout.",
    },
    {
      slot: "preview-tile-label",
      note: "The caption, rendered either inside the frame (overlay) or under it (below). Truncates to one line in both placements.",
    },
  ],
  usage:
    'Reach for it whenever a picture needs a fixed frame in a set: a preset grid, a project shelf, a frame strip, a results grid. Choose the placement by density — `overlay` keeps a dense grid reading as a grid, `below` is for a title under a thumbnail, `none` for strips where the picture is the whole label. Pass `onSelect` only when the picture itself is the control; leave it off and the tile is an inert div that still draws a selection ring, which is what you want when a parent element owns the click. Drive the four states from your own request lifecycle rather than swapping the tile out: `state="loading"` while it is generating, `failed` with a retry in `action`, `locked` with the upsell in `action`. If you find yourself adding metadata under the picture, you have outgrown this component — use `recent-grid` for saved projects or `result-card` for one generated asset.',
  dos: [
    {
      text: "Pass onSelect only to the tiles that are actually the control, and let the rest stay inert — an unclickable tile that is still a button is a tab stop that does nothing.",
      example: <PickableAndInertTiles />,
    },
    {
      text: "Move the caption with labelPlacement instead of rendering your own text under the tile — the component owns the truncation, and a caption it does not own is what makes one cell taller than its neighbours.",
      example: <LabelPlacementOverlayAndBelow />,
    },
  ],
  donts: [
    {
      text: "Don't pass a button in `action` while the frame is also interactive. `action` renders inside the frame, so an interactive tile plus a Retry or Upgrade button nests one control inside another — invalid markup that axe fails outright. Drop `onSelect` in those states, as `result-card` does: a failed or locked result is something you retry or unlock, not something you pick.",
    },
    {
      text: 'Don\'t use `onSelect` for a grid where exactly one tile can be chosen. The interactive frame announces itself with `aria-pressed`, which is toggle-button semantics — right for a filter you switch on and off, wrong for a set of alternatives. `preset-grid` keeps the tile inert and wraps it in its own `role="radio"` button for this reason, and the ring still draws.',
    },
    {
      text: "Don't treat `locked` as a lock. It paints a scrim and shows your CTA; it does not disable anything, so a locked tile with an `onSelect` still takes focus and still fires. Withhold the handler yourself.",
    },
  ],
  accessibility: {
    keyboard: [
      "Zero tab stops or one, decided entirely by `onSelect`: pass it and the frame renders as a `<button>`, leave it off and the frame is an inert `<div>` that still draws the selection ring. Nothing else in the tile is ever focusable.",
      "As a native button it takes Space and Enter. Nothing else is bound — no arrow keys, no Delete, no Escape — because a tile knows nothing about the set it sits in. Roving focus, if you want it, belongs to the grid around it.",
      "There is no `disabled` prop and `state` does not gate the click. `locked` paints a scrim and `failed` replaces the content, but an interactive tile in either state still takes focus and still fires `onSelect`. Withhold the handler instead.",
      "Anything you pass as `action` renders inside the frame. With `onSelect` also set, that is a control nested inside a control — a Retry or Upgrade button becomes a tab stop inside a button, which is invalid markup and behaves unpredictably on activation.",
    ],
    screenReader: [
      "Nothing you spread reaches the frame. `aria-label`, `id`, `role` and `title` all land on the outer wrapper while the button is one level down, so the frame cannot be named from the call site. Its name is computed from its subtree instead: the children you render, then the badge, then the overlay label.",
      'That makes `labelPlacement` load-bearing for naming, not just for layout. `overlay` puts the label inside the frame so it names the button; `below` puts it outside, so an interactive tile with `labelPlacement="below"` is a button named only by whatever its children expose, and `"none"` over a decorative fill leaves it unnamed outright. Give the picture its own name — an `<img alt>`, or `role="img"` plus a label — whenever the caption sits below.',
      "An interactive frame announces `aria-pressed`, which is toggle-button semantics: right for a filter you switch on and off, wrong for a grid where exactly one tile can be chosen. That is why `preset-grid` keeps the frame inert and wraps it in its own radio.",
      "`loading` announces nothing at all. There is no `aria-busy` and no live region, and the skeleton is a bare div, so a tile that is generating is indistinguishable from one that resolved to nothing. Put the wait into text outside the tile.",
      "`locked` and `failed` are announced only through whatever you put in `action`. The scrim, the blur and the dimming carry nothing, so the words have to be in `action` itself.",
      "The overlay label is visually truncated with `truncate`, not shortened — the full text stays in the DOM and is read in full, which is worth knowing before you pass an eighty-character prompt as a label.",
    ],
    focus: [
      "The focus ring and the selection ring are the same declaration: `ring-ring ring-2`. On a tile that is already `selected`, taking focus therefore changes nothing visible — the ring is already drawn, in the same colour and the same width. In a grid, a keyboard user can see where focus is on every tile except the one they have chosen.",
      "The `focus-visible` ring is applied only on the interactive branch, so an inert tile has no focus styling — correct, since it never takes focus.",
      "Nothing here moves focus, but the component does unmount things underneath it. Switching an interactive tile to `failed` replaces its children while the button keeps focus (safe), and removing `onSelect` mid-life turns the focused button into a div, which drops focus to `<body>`.",
    ],
  },
  pitfalls: [
    'Props spread onto the outer wrapper, not the frame. An `aria-label`, `id` or `title` you pass lands on the div around the tile, while the button is one level down — so you cannot name a tile from the outside. With `labelPlacement="none"` and a decorative fill, that leaves an unnamed button; give the picture itself a name (`role="img"` plus a label, or an `<img alt>`) and the frame inherits it.',
    "`loading` replaces the children but announces nothing — no `aria-busy`, no live region. To a screen reader a tile that is generating is indistinguishable from one that finished empty, so if the wait matters, put the status in text outside the tile.",
    "`selected` draws the ring whether or not the tile is interactive. That is deliberate — it is what lets a parent own the click and the tile own the appearance — but it also means a ring is not proof anything is focusable, which is worth knowing when you are debugging a grid that looks selectable and is not.",
    'The badge is pinned to the frame\'s top-right with physical classes, so under `dir="rtl"` it stays visually top-right instead of mirroring to the logical end. Nothing in this registry uses logical inset utilities yet, so a right-to-left layout will want a call-site override.',
    "`failed` paints its own text colour — `text-foreground`, on the slot that wraps `action` — so it needs no correcting at the call site. If you inherited an override that puts the colour back, delete it rather than keeping it: `result-card` and `frame-strip` both dropped theirs when the component adopted the colour. The one colour it deliberately is not is `text-destructive`, which as body text on this frame's muted fill measures 4.34:1, under the 4.5:1 minimum — the contrast pairing this system keeps re-introducing. Put the colour on an icon inside `action` if you want the failure to read as red.",
    "`locked`, unlike `failed`, still inherits the surrounding text colour rather than painting its own, so its scrim shows your CTA in whatever colour the tile was nested in. On a surface that is not already `text-foreground` — an inverted card, a coloured panel — set the colour on what you pass to `action`.",
  ],
};
