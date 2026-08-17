import type { ComponentDocs } from "@/lib/component-docs";
import {
  CtaMatchesSurfaceVerb,
  ExamplePairShowsTheTransformation,
  GenericGetStartedCta,
  PageSizedStateInsideAGrid,
} from "./empty-state.examples";

/**
 * Seeded from docs/design-system/component-specs.md#l1-empty-state.
 *
 * No "use client" here: this module is plain data read by a Server Component
 * (component-docs.tsx). Live examples that need Button or GenerationGrid live
 * in the ./empty-state.examples client sidecar and are referenced here as
 * zero-prop elements — see that file for why.
 */

export const EmptyStateDocs: ComponentDocs = {
  whatItIs:
    "The nothing-here surface, in three sizes that share one component: a page takeover for a whole route, a panel state for a sidebar or pane, and an in-grid tile that occupies a single cell so the grid it sits in keeps its columns. It carries a decorative mark, a title, a line of explanation, a caller-supplied call to action, and — for generation tools — a before/after pair that shows what the surface will produce.",
  whyItMatters:
    "Empty is the default view, not an edge case. It is the first thing a new account sees on every surface at once, and NotebookLM makes the point plainly: three simultaneously-empty panes on first load, each of which has to teach a different action. That makes the empty state the highest-traffic screen in a product and the cheapest place to explain it — but only if each one speaks for the surface it replaces rather than repeating a house slogan. The example-pair form is the strongest version of that for a generation tool, because a picture of the transformation explains the product faster than any sentence about it.",
  evidence: ["NotebookLM"],
  anatomy: [
    {
      slot: "empty-state",
      note: "Root. Carries data-size (page | panel | in-grid) and the frame metrics for that size.",
    },
    {
      slot: "empty-state-header",
      note: "Groups the mark, title and description; left-aligned at in-grid size.",
    },
    {
      slot: "empty-state-media",
      note: "The decorative mark. Always aria-hidden, so it can never add to an accessible name.",
    },
    { slot: "empty-state-title", note: "The one sentence that says what is missing." },
    { slot: "empty-state-description", note: "How the surface gets filled — one line, not a paragraph." },
    {
      slot: "empty-state-example-pair",
      note: "Before to after. A content mode, available at any of the three sizes.",
    },
    {
      slot: "empty-state-example",
      note: "One half of the pair — a figure whose caption is also its accessible name.",
    },
    {
      slot: "empty-state-example-label",
      note: "The visible caption. Required, so the direction survives without the arrow.",
    },
    { slot: "empty-state-actions", note: "The caller's CTA and optional secondary action, in that order." },
  ],
  usage:
    'Reach for it any time a surface can legitimately have nothing in it — a route, a pane, or a grid with no results. Pick the size from the surface, not the message: size="page" replaces a whole route, size="panel" fits a sidebar or a pane, and size="in-grid" is a tile you hand to a grid\'s empty slot (F2 generation-grid takes it directly) so the column geometry never changes underneath the user. Write the action prop yourself with the verb that surface\'s primary control already uses, and add examplePair when the surface generates something, because a before/after does the explaining for you.',
  dos: [
    {
      text: 'Give the CTA the same verb as the primary action of the surface it replaces — an empty render panel says "Generate a render", not "Get started".',
      example: <CtaMatchesSurfaceVerb />,
    },
    {
      text: "Use the example pair on any generation surface: two captioned halves showing the input and what the tool turns it into.",
      example: <ExamplePairShowsTheTransformation />,
    },
  ],
  donts: [
    {
      text: "Don't ship one generic CTA everywhere — a verb that fits every surface teaches none of them what to do next.",
      example: <GenericGetStartedCta />,
    },
    {
      text: "Don't drop a page-sized state into a grid cell — the columns collapse around it and the surface stops looking like a grid at all.",
      example: <PageSizedStateInsideAGrid />,
    },
  ],
  accessibility: {
    keyboard: [
      "Zero tab stops of its own. Everything focusable on this surface is something you passed as `action` or `secondaryAction`, so an empty state with no CTA is unreachable by keyboard — which is correct, because there is nothing there to do.",
      "Tab order is `action` then `secondaryAction`, in the order they are rendered into the actions slot. Nothing reorders them, so pass them in the order you want them read.",
      "No keys are handled at all: no Escape, no Enter shortcut onto the CTA. An `in-grid` tile is a plain tile rather than a grid cell, so a grid's own arrow-key navigation does not reach it either.",
    ],
    screenReader: [
      "The title renders as a `div`, not a heading. A page-sized state therefore replaces a whole route with a document that has no heading at that level — pass a heading element as `title` whenever the state stands in for a route.",
      "The description is a `div` too, despite reading as a paragraph, so it announces as loose text with no paragraph boundary before or after it.",
      "`icon` is wrapped `aria-hidden`, so an illustration that renders words cannot leak them into the name of anything around it. The arrow between the two example halves is `aria-hidden` for the same reason: the direction is carried by the two labels and their order, never by the glyph.",
      'Each example half is a `figure` whose `aria-label` is its visible caption, so it announces as "Before" or "After" rather than as the caption concatenated onto whatever you put in `content`. The content is still reachable inside the figure, so an `<img>` you pass needs real `alt` and a decorative frame needs its own `aria-hidden` at the call site.',
      "Nothing here is a live region. Swapping a populated surface for an empty state — a filter that matched nothing, a list that just drained — announces absolutely nothing, so the live region has to live on the surface that changed rather than here.",
      "`data-size` is a styling hook and carries no semantics. `page`, `panel` and `in-grid` announce identically; the only thing that distinguishes them to a listener is what you wrote in the title.",
    ],
    focus: [
      "This component never moves focus. When it replaces content, whatever had focus in that content unmounts with it and focus falls to `<body>`, so the next Tab restarts from the top of the page. Move focus to the CTA yourself when the emptying is something the user just did.",
      "There is no focus style here either — the ring on your CTA is your button's. A caller-supplied `action` with no `focus-visible` treatment is invisible on focus, and this component will not supply one.",
    ],
  },
  pitfalls: [
    'Copying one empty state across surfaces and only changing the title. The CTA is the part that has to change: it is caller-supplied precisely so that a shared "Get started" button cannot become the default, and there is deliberately no ctaLabel prop to make that easy.',
    "Sizing by how much you have to say rather than by the surface. A long message does not make a panel state into a page state — an oversized empty state inside a grid or sidebar reflows everything around it, which is the specific failure the in-grid tile exists to prevent.",
    "Letting an illustration carry text. The mark passed to icon is rendered aria-hidden for exactly this reason; if you hand-roll decoration elsewhere in the layout and it renders words, they concatenate into the accessible name of whatever encloses them.",
    "Passing plain text as the title when the state replaces a whole route. The title renders as a div, so a page-level empty state leaves a document with no heading — pass a heading element as the title instead.",
    "Leaving the two halves of an example pair to be told apart by position or colour. Both labels are required and both render as visible text, so the direction of the transformation survives for someone who cannot see the arrow between them.",
  ],
};
