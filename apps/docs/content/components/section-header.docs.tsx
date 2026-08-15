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
      text: "Give the header an `id` and point your group wrapper at it with role=\"group\" and aria-labelledby — the header renders a div, so this is the only thing that ties the rows to their title for a screen reader.",
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
  pitfalls: [
    "It is not a heading. The root is a plain div — no h1–h6, no role=\"heading\", no aria-level — so nothing here lands in the document outline and screen-reader heading navigation skips every section on the page. Until that changes, label the group yourself with role=\"group\" + aria-labelledby, the way tool-panel, filter-panel and asset-library already do.",
    "`children` never renders. The prop is accepted by the type (the root spreads the rest of ComponentProps<\"div\">), but the root already has explicit JSX children and those win, so anything you nest inside disappears. There is a unit test pinning this as intended behaviour, not a bug — it just isn't discoverable from the types.",
    "`size=\"sm\"` paints the whole row text-muted-foreground, count included. On a bg-muted, bg-accent or bg-secondary panel that lands at roughly 4.34:1 against a 4.5:1 minimum. Rebind the variable on the surface — [--muted-foreground:var(--accent-foreground)] — rather than restyling the header, because the count carries its own muted class and a class on the header cannot reach it.",
    "The title truncates and the action does not. section-header-title is truncate and section-header-action is shrink-0, so a wide action eats the row and the title loses characters to pay for it. Keep the action short — two or three words is the budget.",
    "Passing `open` without `onOpenChange` makes the trigger inert: it renders, it takes focus, and clicking it changes nothing, because controlled mode never touches internal state. `defaultOpen` is also ignored the moment `open` is present.",
    "The written contract for `action` is \"a link, never a button — it navigates, it does not act\", and real screens keep stretching it: asset-library puts Upload and New folder buttons there, filter-panel puts inert text. Prefer a link. If you put a control there, make it one that still makes sense when the section is collapsed.",
  ],
};
