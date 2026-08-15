import type { ComponentDocs } from "@/lib/component-docs";
import { DateSection } from "@/registry/super-ai/date-section";

/**
 * Seeded from docs/design-system/component-specs.md#a3-date-section.
 * Translate the spec's internal voice into consumer-facing guidance — do not
 * ship the seed text verbatim.
 *
 * No "use client" here: this module is plain data read by a Server Component
 * (component-docs.tsx). No examples sidecar either — this component takes one
 * string and some children, so every example below is static markup with no
 * handler to carry across the boundary.
 */
export const DateSectionDocs: ComponentDocs = {
  whatItIs:
    "The bucket header that groups a list by when — a small label above the rows it names, wrapping them in a real group rather than floating above them as a heading. That is the entire component: a `label` string, whatever children you put inside, and `role=\"group\"` with `aria-labelledby` pointing at the label. It does no date maths, no localization and no grouping; you decide which bucket a row belongs to and what that bucket is called.",
  whyItMatters:
    "Every list an AI product accumulates is ordered by recency — threads in Manus and Claude, generations in Midjourney, scenario runs in Make — and recency is the one axis people navigate from memory. Nobody remembers a thread title, but everybody remembers that they were working on it yesterday. A date bucket turns that memory into a place to look, at the cost of one line of 12px text, which is why all four of those products reach for it before they reach for search. The group semantics are the second half of the argument: because the rows sit inside a labelled group instead of after a heading, a screen reader announces the bucket name on entering the rows, so the temporal context travels with the items for everyone rather than only for people who can see the header above them.",
  evidence: ["Manus", "Claude", "Midjourney", "Make"],
  anatomy: [
    {
      slot: "date-section",
      note: 'The group wrapper. `role="group"` named by the label through `aria-labelledby`, so everything inside is announced as belonging to this bucket.',
    },
    {
      slot: "date-section-label",
      note: "The bucket name. Deliberately a `<p>`, not a heading — it names a group of rows, it does not open a document section.",
    },
  ],
  usage:
    "Reach for it whenever a list is ordered by time and long enough that a reader scans it rather than reads it: a thread sidebar, a generation history, a run log. Keep relative buckets while they still describe something — Today, Yesterday, Last 7 days — and switch to absolute labels (March 2026) only past the point where a relative phrase stops being useful; that crossover is a decision your grouping function makes once, in one place, not per render. Pass a single already-formatted string as `label`, ideally straight out of `Intl.DateTimeFormat`, and put the rows in as children so they end up inside the group rather than beside it. If what you need is a count beside the name, a collapse toggle or a view-all link, that is `section-header` — see the pitfalls below for why those are not options here.",
  dos: [
    {
      text: "Order buckets newest first and keep the relative ones at the top; an absolute month earns its place only once a relative phrase would stop describing anything.",
      example: (
        <div className="w-64 space-y-3">
          <DateSection label="Today">
            <p className="px-2 text-sm">Brand video script</p>
            <p className="px-2 text-sm">Rewrite the onboarding email</p>
          </DateSection>
          <DateSection label="Last 7 days">
            <p className="px-2 text-sm">Summarize the Q3 board deck</p>
          </DateSection>
          <DateSection label="March 2026">
            <p className="px-2 text-sm">Storyboard for the launch film</p>
          </DateSection>
        </div>
      ),
    },
    {
      text: "Pin the label from the call site if the list scrolls — the component does not do it for you, and a bucket name you have already scrolled past has stopped answering the question it exists for.",
      example: (
        <div className="h-32 w-64 overflow-y-auto">
          <DateSection
            label="Today"
            className="[&>[data-slot=date-section-label]]:bg-background [&>[data-slot=date-section-label]]:sticky [&>[data-slot=date-section-label]]:top-0"
          >
            <p className="px-2 text-sm">Brand video script</p>
            <p className="px-2 text-sm">Rewrite the onboarding email</p>
            <p className="px-2 text-sm">Logo explorations</p>
            <p className="px-2 text-sm">Summarize the Q3 board deck</p>
            <p className="px-2 text-sm">Draft release notes for 2.4</p>
            <p className="px-2 text-sm">Icon set audit</p>
          </DateSection>
        </div>
      ),
    },
  ],
  donts: [
    {
      text: "Do not use it for a non-temporal group such as Pinned or Starred, even when that group sits in the same list — those rows normally also appear under their real date, and this component claims the label names where its rows belong.",
      example: (
        <div className="w-64 space-y-3">
          <DateSection label="Pinned">
            <p className="px-2 text-sm">Brand video script</p>
          </DateSection>
          <DateSection label="Today">
            <p className="px-2 text-sm">Brand video script</p>
            <p className="px-2 text-sm">Rewrite the onboarding email</p>
          </DateSection>
        </div>
      ),
    },
    {
      text: "Do not fold a count into the label to stand in for the count slot: it becomes part of the group name every row is announced under, and it sits in the flow of the text rather than in a column that lines up bucket to bucket.",
      example: (
        <div className="w-64 space-y-3">
          <DateSection label="Today (12)">
            <p className="px-2 text-sm">Brand video script</p>
            <p className="px-2 text-sm">Rewrite the onboarding email</p>
          </DateSection>
          <DateSection label="Yesterday (3)">
            <p className="px-2 text-sm">Logo explorations</p>
          </DateSection>
        </div>
      ),
    },
  ],
  pitfalls: [
    "The catalog lists a count variant; the component does not implement one. There is no `count` prop and no count slot, so the only way to show one today is inside the `label` string — which folds it into the group's accessible name and gives up the tabular alignment a real count column would have. `section-header` has the implemented version.",
    "Same for the collapsible variant: there is no `collapsible`, `open`, `onOpenChange` or `defaultOpen`, no trigger button, no `aria-expanded` and no `data-state`. Nothing inside a date section can be folded away. `section-header` implements that contract, controlled pair included.",
    "The sticky behaviour the spec calls for is not implemented either: the label sets no `sticky`, no `top-0` and no surface of its own, so in a scroll container the bucket name leaves with its rows. You can retrofit it from the call site — the label is a direct child, so `[&>[data-slot=date-section-label]]:sticky` and friends reach it — but give it a background at the same time, or the rows will scroll underneath the text.",
    "`label` is typed as a required string and nothing guards an empty one. An empty label renders an empty paragraph that `aria-labelledby` still points at, so the group quietly loses its accessible name while keeping the label's vertical padding: a mystery gap in the list, with an unnamed group under it. Skip the bucket entirely rather than rendering it nameless.",
    "The label is `text-muted-foreground` and paints no background of its own, so it inherits whatever surface you drop it onto. On `bg-muted`, `bg-accent` or `bg-secondary` that lands at 4.34:1 and fails the contrast minimum — and the token gate cannot catch it, because the pairing happens in your container rather than in this file.",
    "The wrapper spreads `...props` after its own attributes, so passing a `data-slot` overwrites `date-section` and hides the fact that this is what rendered the group. Wrap it in your own element if you need a hook of your own, the way `thread-list` does.",
    "The label is a paragraph, not a heading, so date buckets do not appear in the heading outline a screen-reader user can jump between. That is deliberate — a sidebar full of `<h3>Today</h3>` pollutes the document outline of the page beside it — but it means bucket-to-bucket navigation is by group, not by heading.",
  ],
};
