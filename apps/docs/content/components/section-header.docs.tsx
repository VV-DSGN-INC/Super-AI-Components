import type { ComponentDocs } from "@/lib/component-docs";
import {
  ChildrenSilentlyDropped,
  CollapseDrivesThePanel,
  CollapseWithNoVisibleChange,
  LabelledGroup,
} from "./section-header.examples";

/**
 * Seeded from docs/design-system/component-specs.md#a12-section-header.
 * Translate the spec's internal voice into consumer-facing guidance — do not
 * ship the seed text verbatim.
 *
 * No "use client" here: this module is plain data read by a Server Component
 * (component-docs.tsx). The live renders live in ./section-header.examples,
 * which is the client sidecar — two of them need real disclosure state.
 */
export const SectionHeaderDocs: ComponentDocs = {
  whatItIs:
    "One header row for a group of things: a title, an optional count beside it, an optional trailing action, and an optional collapse toggle — all on a single baseline, so a rail of stacked groups reads as one rhythm rather than five hand-built rows. It renders the header line and nothing else. Whatever sits underneath is yours; the component never wraps it.",
  whyItMatters:
    "Every tool panel on the reference board is a stack of these — CapCut, Canva, Fotor, Simplified and Spline all organise dense side panels the same way, because a panel with fifteen controls is unusable until the controls are grouped and the groups can be shut. Building each header by hand is how a panel ends up with five different title sizes and three different places the count sits. Pulling it into one component makes the rhythm a property of the system instead of a thing each screen has to remember.",
  evidence: ["CapCut", "Canva", "Fotor", "Simplified", "Spline"],
  anatomy: [
    {
      slot: "section-header",
      note: 'The row itself. Carries data-state="open" | "closed" when collapsible, and nothing at all when it is not — read that attribute rather than tracking the disclosure a second time yourself.',
    },
    {
      slot: "section-header-title",
      note: "The title text. Carries truncate, so it is the slot that gives way when the row runs out of width.",
    },
    {
      slot: "section-header-count",
      note: "The count, in tabular-nums so it does not jitter as it changes. Present only when you pass count; count={0} still renders, only undefined omits it.",
    },
    {
      slot: "section-header-trigger",
      note: "The disclosure button, present only with collapsible. A real button with aria-expanded, wrapping the title and count so both are part of its accessible name.",
    },
    {
      slot: "section-header-action",
      note: "The trailing slot. shrink-0, so it keeps its full width while the title truncates around it.",
    },
  ],
  usage:
    'Reach for it wherever a screen has more than one group of the same kind of thing — a filter rail, a property inspector, a library page split into sections, a recents strip with a "View all". Pass `title`, add `count` when the number is worth knowing at a glance, and use `size="sm"` for dense rails and the default for page-level groups. For the collapsible variant, hold `open` in your own state and drive both the header and the panel from it: the header owns the toggle, you own what the toggle reveals. If what you need is a time bucket around a list — Today, Yesterday, Last week — reach for `date-section` instead; it wraps its rows and this does not.',
  dos: [
    {
      text: 'Give the header an `id` and point your group wrapper at it with role="group" and aria-labelledby — the header renders a div, so this is the only thing that ties the rows to their title for a screen reader.',
      example: <LabelledGroup />,
    },
    {
      text: "Hold `open` yourself and render the panel from the same state, so the collapse has a visible consequence — and put a signal in `action` for what the collapsed section is still doing.",
      example: <CollapseDrivesThePanel />,
    },
  ],
  donts: [
    {
      text: "Don't pass the panel as children — the header discards them silently, with no warning and no error. Put your content after the header as a sibling.",
      example: <ChildrenSilentlyDropped />,
    },
    {
      text: "Don't set `collapsible` and wire nothing to it. The trigger ships no chevron and the header does not own the panel, so a toggle with no consumer is a focusable control that visibly does nothing.",
      example: <CollapseWithNoVisibleChange />,
    },
  ],
  accessibility: {
    keyboard: [
      'Without `collapsible` the header is zero tab stops — it is a `div` of text. Whatever you put in `action` brings its own stops; a "View all" link is one, a button group is however many buttons it holds.',
      "With `collapsible` it is one stop: the trigger wraps the title and the count, so they are a single control rather than two. Space and Enter toggle it.",
      "No other key does anything. There is no Escape to close a section, no arrow-key travel between a rail of headers, and no Home/End — a sidebar of eight collapsible sections is eight independent Tab stops.",
      "`open` without `onOpenChange` leaves a focusable trigger that cannot be operated: it takes Tab, it takes Enter, and controlled mode never touches internal state, so nothing happens.",
    ],
    screenReader: [
      'The trigger\'s accessible name is computed from its contents, which are the title and the count in adjacent `span`s with no whitespace between them. "Layers" plus `count={12}` announces as one run — the same name-fusion `settings-dialog` documents for its own nav rows. Put a separator in the title if the join reads badly.',
      '`aria-expanded` is on the trigger and reflects the current state correctly, so "collapsed" / "expanded" is announced. There is no `aria-controls`: nothing points at the panel, because the header does not own the panel. A screen-reader user is told the state of something without being told what.',
      'The root is a plain `div` with no heading semantics at all — no `h1`–`h6`, no `role="heading"`, no `aria-level`. Section titles do not appear in the document outline and heading navigation skips every one of them. Labelling your group with `role="group"` and `aria-labelledby` pointed at the header is the workaround the rest of this registry uses.',
      '`count` is announced as a bare number with nothing saying what it counts. `12` beside "Layers" reads as "Layers 12", which is usually enough; `count={0}` still renders, so an empty group announces "Layers 0" rather than falling silent.',
      "The header ships no chevron and no icon of any kind, so there is nothing decorative to hide — and nothing visual that conveys the collapsed state either. That state reaches assistive tech through `aria-expanded` and sighted users through `data-state` only if you style it, which means a header you drop in unstyled tells a screen-reader user more than it tells everyone else.",
    ],
    focus: [
      "Toggling never moves focus: the trigger stays mounted in both states and keeps it. Whether the panel you reveal is reachable from there is your composition's problem — the header does not put focus into it.",
      "The trigger ships `focus-visible:ring-2` with no ring offset, so on a painted or bordered row the ring sits flush against the edge of the control.",
      "`action` inherits your global focus style. Nothing in the header styles it.",
    ],
  },
  pitfalls: [
    'It is not a heading. The root is a plain div — no h1–h6, no role="heading", no aria-level — so nothing here lands in the document outline and screen-reader heading navigation skips every section on the page. Until that changes, label the group yourself with role="group" + aria-labelledby, the way tool-panel, filter-panel and asset-library already do.',
    '`children` never renders. The prop is accepted by the type (the root spreads the rest of ComponentProps<"div">), but the root already has explicit JSX children and those win, so anything you nest inside disappears. There is a unit test pinning this as intended behaviour, not a bug — it just isn\'t discoverable from the types.',
    '`size="sm"` paints the whole row text-muted-foreground, count included. On a bg-muted, bg-accent or bg-secondary panel that lands at roughly 4.34:1 against a 4.5:1 minimum. Rebind the variable on the surface — [--muted-foreground:var(--accent-foreground)] — rather than restyling the header, because the count carries its own muted class and a class on the header cannot reach it.',
    "The title truncates and the action does not. section-header-title is truncate and section-header-action is shrink-0, so a wide action eats the row and the title loses characters to pay for it. Keep the action short — two or three words is the budget.",
    "Passing `open` without `onOpenChange` makes the trigger inert: it renders, it takes focus, and clicking it changes nothing, because controlled mode never touches internal state. `defaultOpen` is also ignored the moment `open` is present.",
    'The written contract for `action` is "a link, never a button — it navigates, it does not act", and real screens keep stretching it: asset-library puts Upload and New folder buttons there, filter-panel puts inert text. Prefer a link. If you put a control there, make it one that still makes sense when the section is collapsed.',
  ],
};
