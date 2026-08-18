import type { ComponentDocs } from "@/lib/component-docs";
import {
  ExcerptCarriesTheCard,
  IconOnlyPrivacy,
  PrivacyAndReachTogether,
  TitleFirstExcerptDemoted,
  TypeDrivesBadgeAndFacet,
} from "./artifact-grid.examples";

/**
 * Seeded from docs/design-system/component-specs.md#j4-artifact-grid.
 * Translate the spec's internal voice into consumer-facing guidance — do not
 * ship the seed text verbatim.
 *
 * No "use client" here: this module is plain data read by a Server
 * Component (component-docs.tsx), which destructures `docs.whatItIs`,
 * `docs.evidence`, etc. directly. If a Do/Don't needs a live example,
 * define a zero-prop component in a sibling "artifact-grid.examples.tsx"
 * client module ("use client" at the top of that file, not this one) and
 * reference it here as an element with no props, e.g.:
 *
 * // import { GoodExample } from "./artifact-grid.examples";
 * // dos: [{ text: "...", example: <GoodExample /> }]
 *
 * An inline handler on an element created in *this* file — e.g.
 * `<ArtifactGrid onSelect={() => {}} />` passed straight into `dos`/`donts` —
 * cannot be serialized across the server/client boundary and breaks the
 * static export.
 */
export const ArtifactGridDocs: ComponentDocs = {
  whatItIs:
    "A grid of the documents and artifacts an assistant produced, grouped under the session that produced them. Each card leads with an excerpt of the artifact's actual content, tagged with a type badge, and closes with a footer that pairs who can see it with how many have. The same type value that labels a card also builds the facet row above the grid.",
  whyItMatters:
    "Claude Artifacts and the Manus Library are the reference implementations, and both make the same bet: people re-find an artifact by recognising what it said, not by reading what it was called. Titles here are usually model-generated and interchangeable — a library of nine cards all reading \"Untitled document\" is a library you have to open nine times. The first lines of the content are reliable, so those get the headline slot. Grouping by session preserves the other half of recall: you rarely remember the artifact, but you remember the conversation you were having when it appeared.",
  evidence: ["Claude Artifacts", "Manus Library"],
  anatomy: [
    { slot: "artifact-grid", note: "Root wrapper holding the facet row and every session group." },
    {
      slot: "artifact-grid-filters",
      note: "The type facet row, built from the same item.type values the badges render. Suppressed when every visible artifact shares one type.",
    },
    {
      slot: "artifact-grid-session",
      note: "One session group — a labelled region wrapping a section-header (A12) and the cards it produced.",
    },
    { slot: "artifact-grid-items", note: "The responsive card grid inside a session." },
    { slot: "artifact-grid-card", note: "One artifact. Carries data-artifact-id and data-artifact-type." },
    { slot: "artifact-grid-type", note: "The type badge. Its text is derived from item.type, never passed separately." },
    {
      slot: "artifact-grid-excerpt",
      note: "The load-bearing field: the largest text on the card and the accessible name of its link.",
    },
    {
      slot: "artifact-grid-title",
      note: "The optional, deliberately secondary title line. Small and quiet, because it is usually auto-generated.",
    },
    { slot: "artifact-grid-edited-ago", note: "Recency text. Omitted entirely when the item has none." },
    { slot: "artifact-grid-footer", note: "Where privacy and reach sit together." },
    {
      slot: "artifact-grid-privacy",
      note: "Icon plus a visible word (Private / Shared / Public), with data-visibility for styling.",
    },
    { slot: "artifact-grid-view-count", note: "Reach, rendered with its unit — \"1,204 views\", not a bare number." },
    { slot: "artifact-grid-empty", note: "role=\"status\" message shown when a filter empties the view." },
  ],
  usage:
    "Reach for it for any \"your artifacts\", \"library\" or \"documents\" surface where the items are text the assistant wrote — docs, code, tables, charts-as-data. Pass `sessions`, each with a label and its items; only `id`, `type` and `excerpt` are required per item. The facet row appears on its own once more than one type is present, and `activeType` / `onActiveTypeChange` let you lift filtering into a URL or a shared filter bar. Set `collapsibleSessions` when a long archive needs folding down. This is not the component for thumbnail-first content — if the item is an image, a video or a 3D scene, use a grid built on preview-tile instead.",
  dos: [
    {
      text: "Let the excerpt carry the card — largest text, top of the reading order, and the accessible name of the link.",
      example: <ExcerptCarriesTheCard />,
    },
    {
      text: "Drive the badge and the filter facet from one `type` value, so a card and its facet can never disagree.",
      example: <TypeDrivesBadgeAndFacet />,
    },
    {
      text: "Keep privacy and view count together in the footer — \"who can see this, and how many have\" is one question.",
      example: <PrivacyAndReachTogether />,
    },
  ],
  donts: [
    {
      text: "Don't give an auto-generated title the headline slot and demote the excerpt to grey supporting text — that is the exact failure this card exists to fix.",
      example: <TitleFirstExcerptDemoted />,
    },
    {
      text: "Don't ship the privacy state as a bare tinted padlock. With no accessible name and only colour separating private from public, a screen reader announces nothing and a colour-blind user sees two identical cards.",
      example: <IconOnlyPrivacy />,
    },
  ],
  accessibility: {
    keyboard: [
      "Each card is exactly one tab stop — the excerpt's link or button — and zero when the item has neither `href` nor `onOpen`. Nothing else on the card is focusable, so a 24-artifact index is 24 Tab presses with no way to skip a session.",
      "`href` wins over `onOpen`: pass both and the handler is silently dropped, leaving a link where you expected a button.",
      "The facet row declares `role=\"radiogroup\"` and now behaves like one: A4 `choice-chips` implements the roving tabindex the ARIA radio pattern expects, so seven types plus \"All\" is a single Tab press before the first card, and Left/Right move between facets rather than doing nothing.",
      "With `collapsibleSessions`, each session header is one more tab stop, activated with Space or Enter. There is no expand-all and no key that collapses every session at once.",
      "Nothing in the grid responds to arrow keys, Home, End, or Delete. It is a list of independent links, not a grid widget.",
    ],
    screenReader: [
      "Each session is a `<section>` named by its label, so sessions are navigable as regions. The section header itself is not a heading element, so heading navigation skips the whole index — regions are the only structure on offer.",
      "The card link's accessible name is exactly the excerpt, by design: the stretched pseudo-element keeps the badge, the recency line, the privacy word and the view count out of it. The cost is that a links-list pass hears only excerpts — nothing tells the reader which artifact is Public, and privacy is reachable only by reading each card in browse mode.",
      "`line-clamp-4` clips the excerpt visually and not in the accessible tree, so a long first paragraph becomes a very long link name that is read in full.",
      "The type badge, the recency line and the footer are plain text with no roles. The privacy word and the view unit are real visible text — never `sr-only` suffixes — because adjacent text concatenates without a separator.",
      "A facet chip's name fuses its count in: \"Markdown 3, radio button, not checked\". The \"All\" chip has no count, so it announces as a bare word beside numbered siblings.",
      "The empty message carries `role=\"status\"`, but it is mounted at the same moment its text appears rather than sitting in the DOM beforehand — the opposite of the always-mounted pattern this registry uses elsewhere. Treat its announcement as unreliable and put a stable live region on the surface if the count matters.",
      "Collapsing a session announces only through the trigger's `aria-expanded`; there is no `aria-controls` tying it to the cards it hides.",
    ],
    focus: [
      "The focus ring traces the excerpt link, not the card, because the click target is a stretched pseudo-element while the focusable box is the text. On a short excerpt the ring is a small rectangle inside a large card, which reads as \"nothing is focused\" at a glance.",
      "Changing a facet or collapsing a session unmounts cards, but focus is on the chip or the trigger in both cases, so nothing is stranded.",
      "Filtering the grid to nothing replaces every card with the empty message and moves focus nowhere. The reader is left on the chip with no indication anything below changed.",
    ],
  },
  pitfalls: [
    "Rebuilding this on preview-tile (A8) to make it match the other grids. It is deliberately not an A8 consumer: A8 exists to fix a media frame around a thumbnail, and here the excerpt is the content, so the frame would be an empty box above the only field anyone reads. The test suite pins this — leave it text-first.",
    "Adding a `typeLabel` prop so a caller can restyle one badge. The badge and the facet are two renders of one value; the moment they can drift, a card reads \"Spreadsheet\" while its facet says \"Table\" and the filter silently returns nothing.",
    "Wrapping the whole card in an anchor to make it clickable. Everything inside then fuses into one accessible name — badge, title, excerpt, edited-ago, privacy word and view count read as a single run-on string. The card uses a stretched pseudo-element on the excerpt link instead, so the whole surface is clickable while the link's name stays exactly the excerpt.",
    "Giving the privacy state an `sr-only` suffix next to a visible glyph. Screen readers concatenate adjacent text with no separator, so a visible \"1,204\" beside an sr-only \" views\" can announce as \"1,204views\". Both the privacy word and the view unit are real visible text here for that reason.",
    "Sorting the grid by title. Titles are the least reliable field on the card; recency and session order are what people actually navigate by.",
    "Leaving empty session groups on screen after a filter runs. Sessions with no surviving items are dropped, and a fully empty view announces itself through a role=\"status\" message rather than silently blanking.",
  ],
};
