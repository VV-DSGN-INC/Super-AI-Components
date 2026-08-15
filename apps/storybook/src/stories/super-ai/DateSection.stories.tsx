import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";

import { DateSection } from "@/registry/super-ai/date-section";
import { SectionHeader } from "@/registry/super-ai/section-header";
import { DateSectionDocs } from "@/content/components/date-section.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

/**
 * Fixtures are thread titles of the kind a sidebar built on this registry
 * actually holds — work someone started and named. No invented products, no
 * fabricated counts.
 */
const TODAY = ["Brand video script", "Rewrite the onboarding email"];
const YESTERDAY = ["Logo explorations"];
const LAST_WEEK = ["Summarize the Q3 board deck", "Draft release notes for 2.4"];
const OLDER = ["Storyboard for the launch film", "Icon set audit"];

/**
 * The row shape the docs demo already uses: plain text at the same inline
 * padding as the label, which is what makes the header and its rows read as
 * one column. No new value is introduced here.
 */
function rows(titles: string[]) {
  return titles.map((title) => (
    <p key={title} className="px-2 text-sm">
      {title}
    </p>
  ));
}

/**
 * Boundary's third panel. Wired for real rather than passed a bare
 * `collapsible`, because `section-header` does not contain the rows it labels
 * — the caller hides them. A header left announcing `aria-expanded=false` over
 * visible rows would be a lie in the one story whose job is telling the two
 * components apart.
 */
function CollapsibleTodayPanel() {
  const [open, setOpen] = React.useState(true);
  return (
    <div className="w-64">
      <SectionHeader title="Today" count={2} size="sm" collapsible open={open} onOpenChange={setOpen} />
      {open ? rows(TODAY) : null}
    </div>
  );
}

const meta: Meta<typeof DateSection> = {
  title: "Super AI/Date Section",
  component: DateSection,
  parameters: { layout: "centered", docs: { page: componentDocsPage(DateSectionDocs) } },
  args: { label: "Today" },
  render: (args) => (
    <div className="w-64">
      <DateSection {...args}>{rows(TODAY)}</DateSection>
    </div>
  ),
};

export default meta;
type Story = StoryObj<typeof DateSection>;

/**
 * A relative bucket — the form the spec puts first, and the one a sidebar
 * spends almost all of its time in. Relative labels win because they match how
 * people recall their own work: nobody remembers a thread title, everybody
 * remembers that it was yesterday.
 *
 * The group is what makes this more than a heading. `role="group"` plus
 * `aria-labelledby` means the bucket name is announced on entering the rows,
 * so "Today" belongs to the items rather than floating above them.
 *
 * Recorded, not fixed: the spec requires this header to be sticky within its
 * scroll container — "you must always be able to tell which bucket you are
 * reading" — and it is not. The label carries no `sticky`, no `top-0` and no
 * surface of its own, so on a list long enough for the rule to matter the
 * bucket name scrolls away with its rows. The docs page carries the call-site
 * workaround; the fix is a component change and so out of scope here.
 */
export const RelativeBucket: Story = {
  args: { label: "Today" },
};

/**
 * Past the relative window the label stops describing and starts dating.
 * "Older" is the honest fallback while a list is short; a month is what a list
 * long enough to scroll actually needs, because "older" stops narrowing
 * anything once half the history is in it.
 *
 * The component does none of that reasoning: it takes one already-formatted
 * string, runs no date maths and no localization. So the crossover between the
 * last relative bucket and the first absolute one is a decision your grouping
 * function makes once, and the only thing that reaches this component is its
 * result.
 */
export const AbsoluteDate: Story = {
  args: { label: "March 2026" },
  render: (args) => (
    <div className="w-64">
      <DateSection {...args}>{rows(OLDER)}</DateSection>
    </div>
  ),
};

/* -------------------------------------------------------------------------
 * Case stories — the situations this component meets in a product, as opposed
 * to the prop combinations above. See docs/design-system/story-conventions.md
 * for which of the eight apply.
 *
 * Not written for this component, deliberately:
 *
 * // case-skip: ReducedMotion — nothing in the tree animates
 * The registry entry is a div, a p and the children you pass. There is no
 * keyframe, transform or transition anywhere in it, and nothing appears,
 * collapses or reorders — the collapse affordance that would animate is not
 * implemented (see Controlled). A reduced-motion rendering would be pixel
 * identical to RelativeBucket.
 *
 * // case-skip: KeyboardOrder — the component contributes no focus stop
 * The group is a plain div with no tabindex, and the component adds no control
 * of its own. Every tab stop inside a date section belongs to the rows the
 * caller passes, so the traversal this story would assert would be the
 * caller's tab order, not this component's contract.
 *
 * // case-skip: Controlled — no open/onOpenChange pair exists to control
 * A collapsible bucket would be the obvious controlled story, and the manifest
 * declares `collapsible` as a state — but the shipped component has no
 * `collapsible`, `open`, `onOpenChange` or `defaultOpen`, no trigger button,
 * no `aria-expanded` and no `data-state`. `label` is a rendering input the
 * component never proposes a change to, so the convention's three assertions
 * (interaction does not move the value, the callback carries the payload, a
 * re-render with an unchanged value holds) have no subject. The collapse
 * contract, controlled pair included, lives in section-header (A12) — see
 * Boundary.
 * ---------------------------------------------------------------------- */

/**
 * Right-to-left. The component itself has nothing to mirror: `space-y-1` is a
 * vertical rhythm, `px-2 py-1` is symmetric, and there is no icon, chevron or
 * trailing slot — the collapse affordance that would supply one is not
 * implemented. So this story is not about the layout flipping.
 *
 * It is about the label, because this is the one component in the catalog
 * whose entire content is a date, and dates are exactly where bidirectional
 * text bites. A bucket name in Arabic with a Latin numeral run reorders around
 * that run, so a label assembled in code — `${month} ${year}`, or a range
 * joined with a dash — will not read the way its author expects. Pass one
 * already-localized string out of `Intl.DateTimeFormat` and let the browser
 * place it.
 *
 * The rows stay in English on purpose: a mixed-direction list is the ordinary
 * case for a product with one interface language and many working languages,
 * not an exotic one.
 */
export const RTL: Story = {
  render: () => (
    <div dir="rtl" lang="ar" className="w-64 space-y-3">
      <DateSection label="اليوم">{rows(TODAY)}</DateSection>
      <DateSection label="أمس">{rows(YESTERDAY)}</DateSection>
      <DateSection label="مارس 2026">{rows(OLDER)}</DateSection>
    </div>
  ),
};

/**
 * The empty label. `label` is typed as a required string, so this case only
 * arrives at runtime — a bucket formatter returning an empty string for a row
 * whose timestamp did not parse — and nothing guards against it.
 *
 * What ships is worse than an unstyled header. The paragraph renders empty but
 * keeps its `py-1`, so the list gains an unexplained gap; and `aria-labelledby`
 * still points at that empty paragraph, so the group silently loses its
 * accessible name rather than falling back to anything. A screen-reader user
 * gets an unnamed group where a date should be.
 *
 * Recorded rather than asserted: pinning this with a passing assertion would
 * freeze it. The call-site rule is on the docs page — skip the bucket
 * entirely when it has no name.
 */
export const EmptyLabel: Story = {
  args: { label: "" },
  render: (args) => (
    <div className="w-64 space-y-3">
      <DateSection {...args}>{rows(TODAY)}</DateSection>
      <DateSection label="Yesterday">{rows(YESTERDAY)}</DateSection>
    </div>
  ),
};

/**
 * A ~90-character bucket label, which an archive view produces as soon as it
 * starts describing a range rather than naming a day.
 *
 * The component's answer is to wrap. The label sets no `truncate`, no
 * `line-clamp` and no `whitespace-nowrap`, so at sidebar width a long name
 * becomes four lines of 12px text and pushes its rows down the list. That is
 * defensible — a truncated date range tells you nothing — but it is the
 * opposite of what the near-twin does: `section-header` truncates its title.
 * If your bucket labels can grow, that difference is the choosing rule between
 * the two, and it is only visible here.
 */
export const LongContent: Story = {
  args: {
    label: "Older than 30 days — 4 January 2026 through 12 March 2026, archived and read-only",
  },
  render: (args) => (
    <div className="w-64">
      <DateSection {...args}>{rows(LAST_WEEK)}</DateSection>
    </div>
  ),
};

/**
 * 375px, with the whole grouped list rather than one bucket, because the thing
 * worth checking at this width is the seam between buckets.
 *
 * The useful fact here is a negative one: this component has no horizontal
 * overflow mode at all. It is a block-level group whose label wraps, so it
 * cannot produce a horizontal scroll on its own — anything that does at 375px
 * came from the rows you passed, not from the header. What it can get wrong is
 * alignment: the label's `px-2` is what lines the bucket name up with row
 * content at the same inset, and rows that set a different padding leave the
 * header visibly detached from the list it names.
 */
export const Mobile: Story = {
  render: () => (
    <div className="w-[375px] max-w-full space-y-3">
      <DateSection label="Today">{rows(TODAY)}</DateSection>
      <DateSection label="Yesterday">{rows(YESTERDAY)}</DateSection>
      <DateSection label="March 2026">{rows(OLDER)}</DateSection>
    </div>
  ),
};

/**
 * Date section beside section-header (A12), the non-temporal sibling. They
 * look nearly identical — a small label over a stack of rows — and the rule is
 * about what the label claims:
 *
 * - **Date section** wraps the rows it names. `role="group"` plus
 *   `aria-labelledby` says those rows live in this bucket, so reach for it
 *   when the label is a time and every row underneath genuinely belongs to it.
 * - **Section header** sits above a region it does not contain. It carries the
 *   count, the view-all link and the collapse trigger, and claims ownership of
 *   nothing — which is why it is right for Pinned, Shared or Templates, groups
 *   whose rows also appear somewhere else.
 *
 * Recorded gap, and the reason for the third panel: the manifest declares
 * `with/without count` and `collapsible` as this component's states and
 * neither is implemented — no count prop, no count slot, no trigger, no
 * `aria-expanded`. So a temporal bucket that needs a count or a fold has to be
 * a section-header today, and you give up the group semantics to get them.
 * That trade is the panel, not a recommendation.
 */
export const Boundary: Story = {
  render: () => (
    <div className="flex w-full max-w-lg flex-col gap-6">
      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">Date section — wraps the rows it names</p>
        <div className="w-64">
          <DateSection label="Today">{rows(TODAY)}</DateSection>
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">Section header — labels a region it does not contain</p>
        <div className="w-64">
          <SectionHeader
            title="Pinned"
            count={2}
            size="sm"
            action={
              <a href="#" className="underline">
                View all
              </a>
            }
          />
          {rows(LAST_WEEK)}
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">
          A temporal bucket that needs a count or a fold — section-header, at the cost of the group
        </p>
        <CollapsibleTodayPanel />
      </section>
    </div>
  ),
};
