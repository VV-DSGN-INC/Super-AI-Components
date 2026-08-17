import type { ComponentDocs } from "@/lib/component-docs";
import {
  EditorContextLeadsWithZoomAndHistory,
  PrivacyChipColorOnly,
  PrivacyChipWithIconAndLabel,
  SavedStateAsText,
  SavedStateIconOnly,
} from "./app-topbar.examples";

/**
 * Seeded from docs/design-system/component-specs.md#b7-app-topbar.
 * Translate the spec's internal voice into consumer-facing guidance — do not
 * ship the seed text verbatim.
 *
 * No "use client" here: this module is plain data read by a Server
 * Component (component-docs.tsx), which destructures `docs.whatItIs`,
 * `docs.evidence`, etc. directly. If a Do/Don't needs a live example,
 * define a zero-prop component in a sibling "app-topbar.examples.tsx"
 * client module ("use client" at the top of that file, not this one) and
 * reference it here as an element with no props, e.g.:
 *
 * // import { GoodThing } from "./app-topbar.examples";
 * // dos: [{ text: "...", example: <GoodThing /> }]
 *
 * An inline handler on an element created in *this* file — e.g.
 * `<AppTopbar onSelect={() => {}} />` passed straight into `dos`/`donts` —
 * cannot be serialized across the server/client boundary and breaks the
 * static export.
 */
export const AppTopbarDocs: ComponentDocs = {
  whatItIs:
    "The single header that runs across the top of a shell — one component with two lead configurations. In document context it opens with a breadcrumb and a privacy chip; in editor context it opens with zoom controls and undo/redo history. Both configurations share the same title, saved-state, and trailing-actions slots, and a chat title bar is simply this with fewer of those slots filled.",
  whyItMatters:
    "LTX Studio, CapCut, Canva, Spline, Freepik, and Descript all put a single persistent bar across the top of the workspace, but what leads it depends entirely on what the surface below it is: a document surface needs to say where you are (breadcrumb) and who can see it (privacy); a canvas or timeline surface needs to say how you're viewing it (zoom) and whether you can back out of the last change (history). Modeling that as one component with a `context` switch — rather than two unrelated headers — keeps title, saved-state, and actions from drifting out of sync between the two.",
  evidence: ["LTX Studio", "CapCut", "Canva", "Spline", "Freepik", "Descript"],
  anatomy: [
    { slot: "app-topbar", note: "Root `<header>` landmark spanning the shell width." },
    { slot: "app-topbar-leading", note: "Context-specific lead group plus the privacy chip." },
    { slot: "app-topbar-breadcrumb", note: "Document context: path to the current document." },
    { slot: "app-topbar-zoom", note: "Editor context: zoom-out / level / zoom-in button group." },
    { slot: "app-topbar-history", note: "Editor context: undo / redo button group." },
    { slot: "app-topbar-title", note: "Document or scene name — shown when there's no breadcrumb, or alongside zoom/history." },
    { slot: "app-topbar-privacy", note: "Icon + text status chip. Available in either context." },
    { slot: "app-topbar-trailing", note: "Right-aligned group holding saved-state and actions." },
    { slot: "app-topbar-saved", note: "Saved-state as plain readable text, e.g. \"Last saved 5 days ago\"." },
    { slot: "app-topbar-actions", note: "Consumer-supplied trailing controls (share, export, presence, …)." },
  ],
  usage:
    "Reach for it as the one top bar for a shell and pick `context` based on what's underneath it: `document` for anything read top-to-bottom (docs, pages, notes) where breadcrumb + privacy matter most; `editor` for anything manipulated on a canvas or timeline (design files, video, 3D) where zoom + history matter most. Pass `savedLabel` as a finished sentence, not a timestamp to format — the component never guesses relative time for you. For a chat surface, use the same component with just `title` and `actions` filled in; don't reach for a separate chat-header component.",
  dos: [
    {
      text: "Render saved-state as a finished sentence — \"Last saved 5 days ago\" answers the question a status glyph only raises.",
      example: <SavedStateAsText />,
    },
    {
      text: "Let editor context lead with zoom + history instead of a breadcrumb — it's the same component, just the other configuration.",
      example: <EditorContextLeadsWithZoomAndHistory />,
    },
    {
      text: "Pair the privacy chip's icon with a visible label — the icon alone is decoration, the text is the signal.",
      example: <PrivacyChipWithIconAndLabel />,
    },
  ],
  donts: [
    {
      text: "Don't render saved-state as an icon-only indicator — a bare cloud glyph forces the user to hover or guess instead of just reading.",
      example: <SavedStateIconOnly />,
    },
    {
      text: "Don't signal privacy with a bare coloured dot — it disappears for colorblind users and screen readers alike.",
      example: <PrivacyChipColorOnly />,
    },
  ],
  accessibility: {
    keyboard: [
      "Document context has one tab stop per breadcrumb crumb that carries an `href`, and none otherwise. The final crumb is deliberately not a link, a crumb without `href` renders as plain text, and the title, privacy chip and saved-state line are never focusable.",
      "Editor context is always four tab stops before your `actions` — Zoom out, Zoom in, Undo, Redo — and they render whether or not you passed the matching handler. An editor topbar with no `onUndo` still presents an enabled, focusable Undo button that does nothing.",
      "`canUndo` and `canRedo` default to `true`, so `disabled` only appears when you say so. Omitting them is not the same as having no history.",
      "The button groups have no roving tabindex and no arrow-key navigation — they are `role=\"group\"` wrappers, so each control is its own stop.",
      "No shortcuts are bound. The zoom and history controls respond to Space and Enter as buttons and to nothing else; Cmd+Z is your app's job.",
    ],
    screenReader: [
      "The root is a `<header>`, which is a banner landmark only when it is not inside another landmark. Nested in a shell's `<main>` it is a generic container instead, and either way it carries no `aria-label` — two topbars on one page are indistinguishable.",
      "The breadcrumb is a `<nav aria-label=\"breadcrumb\">`; the final crumb announces as a disabled link with `aria-current=\"page\"`, and each separator is `role=\"presentation\"` so it is not read.",
      "In document context with a `breadcrumb`, the `title` prop renders nowhere at all — the last crumb's label is what appears. If the two ever differ, the name a screen reader hears is the crumb's, not the title's.",
      "Zoom and history are icon-only buttons named entirely by `aria-label` — \"Zoom out\", \"Zoom in\", \"Undo\", \"Redo\". Those strings are hard-coded and not localisable through this component.",
      "The zoom level is rendered as ordinary text between the two buttons, with no `aria-live` and no relationship to either. Pressing Zoom in changes the number silently, so a screen-reader user gets no feedback that the press did anything.",
      "The saved-state line is the same shape: plain text, no live region. \"Last saved 5 days ago\" becoming \"Saving…\" is a change nobody is told about.",
      "The privacy chip announces as its label text; its optional glyph is wrapped `aria-hidden`, which is what makes the visible word rather than the icon the actual signal.",
    ],
    focus: [
      "Switching `context` swaps the entire leading group. If focus was on Zoom in when the surface flips to document context, the button unmounts and focus falls to `<body>` — put the switch behind a navigation rather than a toggle in the bar itself.",
      "Disabling Undo when history empties removes it from the tab order under whoever was standing on it, dropping focus to `<body>` mid-edit.",
      "Every control inherits the shared button's `focus-visible` ring; the topbar adds no focus styling of its own.",
    ],
  },
  pitfalls: [
    "Building a second header component for editor surfaces instead of switching `context` — the whole point of B7 is that document and editor bars are one component, so title, saved-state, and actions stay wired the same way in both.",
    "Formatting `savedLabel` as a raw ISO timestamp or Date and letting the component render it verbatim — it renders exactly the string you pass, so compute the relative phrasing (\"5 days ago\") before handing it over.",
    "Disabling undo/redo by simply omitting `onUndo`/`onRedo` — the buttons still render enabled by default; pass `canUndo`/`canRedo` explicitly so the disabled state matches real history state.",
  ],
};
