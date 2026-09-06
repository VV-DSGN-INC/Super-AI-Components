import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { Button } from "@/components/ui/button";
import { settledFocusRing } from "@/lib/focus-ring";

import { ArtifactGrid, type ArtifactGridSession } from "@/registry/super-ai/artifact-grid";
import { RecentGrid } from "@/registry/super-ai/recent-grid";
import { ArtifactGridDocs } from "@/content/components/artifact-grid.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const meta: Meta<typeof ArtifactGrid> = {
  title: "Super AI/Artifact Grid",
  component: ArtifactGrid,
  parameters: { layout: "centered", docs: { page: componentDocsPage(ArtifactGridDocs) } },
};

export default meta;
type Story = StoryObj<typeof ArtifactGrid>;

const SESSIONS: ArtifactGridSession[] = [
  {
    id: "pricing",
    label: "Pricing page rewrite",
    items: [
      {
        id: "a1",
        type: "document",
        title: "Untitled document",
        excerpt:
          "Three tiers, and the middle one is the default. Everything above it exists to make it look reasonable.",
        editedAgo: "Edited 2 hours ago",
        viewCount: 1204,
        visibility: "public",
        href: "#a1",
      },
      {
        id: "a2",
        type: "react",
        excerpt: "export function PricingTable({ plans }: PricingTableProps) { … }",
        editedAgo: "Edited yesterday",
        viewCount: 38,
        visibility: "shared",
        href: "#a2",
      },
      {
        id: "a3",
        type: "data-table",
        excerpt: "Plan · Seats · Monthly · Annual · Support SLA — the comparison grid, 5 columns by 4 rows.",
        editedAgo: "Edited yesterday",
        viewCount: 6,
        visibility: "private",
        href: "#a3",
      },
    ],
  },
  {
    id: "churn",
    label: "Churn analysis",
    items: [
      {
        id: "b1",
        type: "chart",
        excerpt: "Cohort retention by signup month, 2024 Q1 through Q4. Month-3 is where the cliff is.",
        editedAgo: "Edited 3 days ago",
        viewCount: 91,
        visibility: "shared",
        href: "#b1",
      },
    ],
  },
];

/** The badge and the facet row are two renders of the same `type` value. */
export const TypeBadge: Story = {
  args: { sessions: SESSIONS },
};

/**
 * A 1200px column — comfortably past 64rem/1024px, the old `lg` breakpoint
 * and the exact container threshold this grid now uses for its third
 * column. The width a standalone consumer with no sidebar actually gives
 * this grid. Proves the container-query switch resolves the same as the old
 * sm/lg viewport breakpoints once this box has room: three columns,
 * unchanged.
 *
 * (Not the bare, unwrapped default story: Storybook's centered layout
 * decorator is itself a shrink-to-fit flex row, and this element's own
 * `@container` containment stops that ancestor from sizing it off its
 * content — the box collapses to the width of the session label instead.
 * That is a real, general hazard for any consumer who places this grid
 * inside a shrink-to-fit ancestor, e.g. a bare `flex justify-center` wrapper,
 * not a defect introduced here; an explicit width sidesteps it, the same way
 * NarrowColumn anchors its own width instead of leaving it to the canvas.)
 */
export const FullWidth: Story = {
  args: { sessions: SESSIONS },
  render: (args) => (
    <div className="w-[1200px] max-w-full">
      <ArtifactGrid {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const items = canvasElement.querySelector<HTMLElement>('[data-slot="artifact-grid-items"]')!;
    const columns = getComputedStyle(items).gridTemplateColumns.split(" ").length;
    await expect(columns).toBe(3);
  },
};

/**
 * 600px — inside [448px, 640px), the band where Tailwind's *named*
 * container rung (`@md`, 28rem/448px) and the old viewport rung it stands
 * in for (`sm`, 40rem/640px) disagree. Below the real 640px threshold, so
 * this must stay at one column. A regression back to the named `@md` rung
 * would show two here instead — this story exists to catch exactly that,
 * not to exercise a state the component itself declares.
 */
export const JustBelowTwoColumns: Story = {
  args: { sessions: SESSIONS },
  render: (args) => (
    <div className="w-[600px] max-w-full">
      <ArtifactGrid {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const items = canvasElement.querySelector<HTMLElement>('[data-slot="artifact-grid-items"]')!;
    const columns = getComputedStyle(items).gridTemplateColumns.split(" ").length;
    await expect(columns).toBe(1);
  },
};

/**
 * 950px — inside [896px, 1024px), the same kind of gap one rung up:
 * Tailwind's named `@4xl` (56rem/896px) versus the old `lg` (64rem/1024px)
 * it stands in for. Below the real 1024px threshold, so this must stay at
 * two columns. A regression back to the named `@4xl` rung would show three
 * here instead.
 */
export const JustBelowThreeColumns: Story = {
  args: { sessions: SESSIONS },
  render: (args) => (
    <div className="w-[950px] max-w-full">
      <ArtifactGrid {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const items = canvasElement.querySelector<HTMLElement>('[data-slot="artifact-grid-items"]')!;
    const columns = getComputedStyle(items).gridTemplateColumns.split(" ").length;
    await expect(columns).toBe(2);
  },
};

/**
 * The grid in a 420px column, which is what every shell with a sidebar gives
 * it. Keyed to the viewport it would step to two columns here purely because
 * the *window* is wide, and the excerpt — the field the component is built
 * around — clamps to nothing. Keyed to its own container it stays at one.
 *
 * chat-shell and artifact-shell both carried descendant-variant overrides to
 * force this by hand before the grid measured itself.
 */
export const NarrowColumn: Story = {
  args: { sessions: SESSIONS },
  render: (args) => (
    <div className="w-[420px] max-w-full">
      <ArtifactGrid {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const items = canvasElement.querySelector<HTMLElement>('[data-slot="artifact-grid-items"]')!;
    const columns = getComputedStyle(items).gridTemplateColumns.split(" ").length;
    await expect(columns).toBe(1);
  },
};

/** The excerpt is the largest text and the accessible name of the card's link. */
export const Excerpt: Story = {
  args: {
    sessions: [
      {
        id: "s",
        label: "Pricing page rewrite",
        items: [
          {
            id: "a1",
            type: "document",
            title: "Untitled document",
            excerpt:
              "Three tiers, and the middle one is the default. Everything above it exists to make it look reasonable, and everything below it exists to make it look generous.",
            href: "#excerpt",
          },
        ],
      },
    ],
  },
};

/**
 * Recency in the words a person would use, which is the only date the card
 * carries — there is no absolute timestamp anywhere, on the card or in a
 * `title` attribute.
 *
 * Two things to notice. The card here has no footer at all: it is drawn only
 * when `visibility` or `viewCount` is present, so recency sits directly under
 * the excerpt rather than beside reach. And this field is guarded on
 * truthiness, so `editedAgo=""` renders no line rather than an empty one —
 * `viewCount` beside it is guarded on `!== undefined`, so a zero there does
 * render. `EmptyLabel` below measures both halves of that split.
 */
export const EditedAgo: Story = {
  args: {
    sessions: [
      {
        id: "s",
        label: "Pricing page rewrite",
        items: [
          {
            id: "a1",
            type: "document",
            excerpt: "Three tiers, and the middle one is the default.",
            editedAgo: "Edited 2 hours ago",
            href: "#edited",
          },
        ],
      },
    ],
  },
};

/** Reach carries its unit — "1,204 views", never a bare number. */
export const ViewCount: Story = {
  args: {
    sessions: [
      {
        id: "s",
        label: "Churn analysis",
        items: [
          {
            id: "b1",
            type: "chart",
            excerpt: "Cohort retention by signup month. Month-3 is where the cliff is.",
            viewCount: 1204,
            href: "#views",
          },
        ],
      },
    ],
  },
};

/** Each visibility gets its own icon shape and its own visible word. */
export const PrivacyIcon: Story = {
  args: {
    sessions: [
      {
        id: "s",
        label: "Shared workspace",
        items: [
          {
            id: "p1",
            type: "document",
            excerpt: "Draft messaging for the launch announcement.",
            visibility: "private",
            viewCount: 1,
            href: "#private",
          },
          {
            id: "p2",
            type: "document",
            excerpt: "Reviewed messaging, circulated to the marketing channel.",
            visibility: "shared",
            viewCount: 38,
            href: "#shared",
          },
          {
            id: "p3",
            type: "document",
            excerpt: "Published announcement, live on the changelog.",
            visibility: "public",
            viewCount: 1204,
            href: "#public",
          },
        ],
      },
    ],
  },
};

/* -------------------------------------------------------------------------
 * Case stories — the situations this grid meets in a library surface, as
 * opposed to the five field renderings above. See
 * docs/design-system/story-conventions.md.
 *
 * Seven of the eight are written. The one that is not:
 *
 * // case-skip: ReducedMotion — `grep -nE "animate-|transition-" artifact-grid.tsx` returns nothing, and the two matches in the composed tree are a colour crossfade that already branches and a vendored class the registry has decided not to touch
 * The grep is the reason rather than a conclusion, so here is what it
 * returns. `artifact-grid.tsx`: no `animate-*`, no `transition-*`, no
 * `duration-*`, no `ease-*` — the component owns no motion at all.
 * `section-header.tsx` (composed): the same, and collapsing a session is
 * conditional rendering (`{open ? … : null}`), so the cards vanish on the
 * frame rather than sliding. `choice-chips.tsx:72`: `transition-colors
 * motion-reduce:transition-none` — already branched at its own call site, and
 * `transition-colors` crossfades a colour without moving anything, which
 * mechanical fact 3 names as the case where suppression documents no branch
 * worth a story (`reset-affordance` is the recorded precedent).
 * `components/ui/badge.tsx:8`: `transition-all` on a vendored primitive, the
 * registry-wide posture CONTINUE.md §8 records for the vendored `Button` —
 * and the type badge is not interactive, so nothing it could transition ever
 * changes. Since `vitest.config.ts` forces `reducedMotion: "reduce"` on every
 * test, a story here would render pixel-identical to `TypeBadge` and imply a
 * branch that does not exist.
 * ---------------------------------------------------------------------- */

/** Two documents in one session, so the facet count reads more than 1. */
const RTL_SESSIONS: ArtifactGridSession[] = [
  {
    id: "launch",
    label: "Launch messaging",
    items: [
      {
        id: "r1",
        type: "document",
        title: "Untitled document",
        excerpt: "Draft messaging for the launch announcement, second pass.",
        editedAgo: "Edited 2 hours ago",
        viewCount: 1204,
        visibility: "public",
        href: "#r1",
      },
      {
        id: "r2",
        type: "document",
        excerpt: "Reviewed messaging, circulated to the marketing channel.",
        editedAgo: "Edited yesterday",
        viewCount: 38,
        visibility: "shared",
        // No `href`: this is the branch that renders the excerpt as a button,
        // and that button carries the only text-alignment class in the
        // component.
        onOpen: () => {},
      },
      {
        id: "r3",
        type: "react",
        excerpt: "export function PricingTable({ plans }: PricingTableProps) { … }",
        editedAgo: "Edited 3 days ago",
        viewCount: 6,
        visibility: "private",
        href: "#r3",
      },
    ],
  },
];

/**
 * Right-to-left, and the grid mirrors — but only because two physical classes
 * were swapped for their logical forms in this wave. Both are pinned below, so
 * a revert fails a test rather than shipping quietly.
 *
 * The facet count was `ml-1.5`. The gap belongs *between* the label and the
 * count, and in an RTL chip the count paints to the label's left, so a
 * physical left margin moves the gap to the chip's outer edge and closes the
 * one it exists to open. It is `ms-1.5` now, and this is the sweep entry
 * CONTINUE.md §8 lists at `artifact-grid.tsx:272`. The don't-swap rule from
 * waves 3 and 4 is satisfied because the class is the only participant: the
 * chip is a plain inline `button` with a symmetric `px-3`, no flex, no
 * absolute positioning and no inline style, so nothing else decides that side.
 * The excerpt button was `text-left` and is `text-start`, on the same test.
 *
 * What this story does **not** claim is that the content is right in RTL. The
 * excerpt has no `dir` and no bidi isolation, and a code artifact is mostly
 * neutral characters — the React card here is `export function PricingTable({
 * plans }: PricingTableProps) { … }` in an RTL paragraph, where the braces,
 * colon and parentheses reorder around the Latin runs. `code`, `html`, `react`
 * and `svg` are four of the five hand-written type labels, so a code excerpt
 * is a first-class case rather than an edge one. Whether the excerpt carries
 * the artifact's direction or the shell's is an API question — the same shape
 * as D3 `context-chips`' mention labels — so it is recorded here and asserted
 * nowhere.
 */
export const RTL: Story = {
  args: { sessions: RTL_SESSIONS },
  render: (args) => (
    <div dir="rtl" className="w-[560px] max-w-full">
      <ArtifactGrid {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // The chrome mirrors: "All" is the first chip in the DOM, so it paints
    // furthest right.
    const all = canvas.getByRole("radio", { name: "All" });
    const documents = canvas.getByRole("radio", { name: "Document2" });
    await expect(all.getBoundingClientRect().left).toBeGreaterThan(documents.getBoundingClientRect().left);

    // Swap 1, pinned. `ms-1.5` resolves to the right in RTL; `ml-1.5` would
    // have kept 6px on the left, which is the chip's outer edge here.
    const count = documents.querySelector<HTMLElement>("span.tabular-nums")!;
    const countStyle = getComputedStyle(count);
    await expect(countStyle.marginRight).toBe("6px");
    await expect(countStyle.marginLeft).toBe("0px");

    // Swap 2, pinned. The excerpt button is the only text-alignment class in
    // the component, and it now follows the reading direction. Chromium
    // reports `text-align` as the keyword rather than resolving it, so the
    // read is the pin: `text-start` computes to "start" and `text-left` — what
    // this was — computes to "left".
    const opener = canvas.getByRole("button", {
      name: "Reviewed messaging, circulated to the marketing channel.",
    });
    await expect(getComputedStyle(opener).textAlign).toBe("start");

    // The footer is `justify-between` with no physical class, so privacy and
    // reach trade sides for free: privacy is the first child and paints right.
    const footer = canvasElement.querySelector<HTMLElement>('[data-slot="artifact-grid-footer"]')!;
    const privacy = footer.querySelector<HTMLElement>('[data-slot="artifact-grid-privacy"]')!;
    const views = footer.querySelector<HTMLElement>('[data-slot="artifact-grid-view-count"]')!;
    await expect(privacy.getBoundingClientRect().left).toBeGreaterThan(views.getBoundingClientRect().left);

    // No directional glyph anywhere in the card: the privacy icons are a
    // padlock, a pair of people and a globe, and reach is an eye. Three cards
    // with a privacy icon and three with an eye is the whole icon inventory,
    // so there is no arrow or chevron here that would need mirroring — and the
    // session header has no chevron either, which is its own finding: with
    // `collapsibleSessions` the only cue that a session is folded is that its
    // cards are gone.
    await expect(canvasElement.querySelectorAll("svg")).toHaveLength(6);
  },
};

/**
 * Every stop in the grid, walked once, and the walk is the finding: this
 * surface is flat. Eleven stops here — five facet chips, then per session a
 * header trigger and one link per card — and each is reached with Tab and only
 * with Tab. Nothing responds to an arrow key, Home, End or Escape.
 *
 * Five of those eleven are a deviation the composed primitive owns and this
 * story records rather than endorses. `choice-chips` declares
 * `role="radiogroup"` but gives every chip its own tab stop instead of the
 * roving tabindex the ARIA radio pattern expects — there is a `TODO` saying so
 * at `choice-chips.tsx:55`. A seven-type library therefore costs eight Tab
 * presses before the first card. The order below is asserted as it ships; if
 * `choice-chips` gains roving tabindex this story fails, which is the point.
 *
 * The ring is `settledFocusRing`, not the `boxShadow !== "none"` string check
 * 63 older files still carry: Tailwind's `ring-*` composes shadow layers that
 * are present-but-transparent when the ring is off, so the string check cannot
 * fail. Every stop here does paint one — chips, section triggers and excerpt
 * links each carry their own `focus-visible:ring-2`.
 *
 * The chip names below are the wave's other finding, and the component's own
 * docs page warns against exactly it. The facet `<ChoiceChip>` in
 * `artifact-grid.tsx` renders `artifactTypeLabel(type)` and the count span as
 * two adjacent nodes with no separator between them — the margin
 * that opens the visible gap is `ms-1.5`, invisible to name computation — so
 * the accessible name is `"Document1"`, not `"Document 1"`. Measured by the
 * queries in this file: `getByRole("radio", { name: "Document 1" })` finds
 * nothing and `"Document1"` finds the chip. The docs module's screen-reader
 * note writes it as `"Markdown 3"`, and its fourth pitfall is the general
 * version of the same bug ("a visible 1,204 beside an sr-only ' views' can
 * announce as 1,204views"), which is why the view count is one text node. The
 * fix belongs in the component and is not a class swap, so it is recorded, and
 * the assertion below states what ships rather than what should.
 *
 * What a keyboard user cannot do is recorded, not asserted, because each fix
 * is a design decision: there is no skip link past a session, so a
 * 24-artifact index is 24 Tab presses; a card with neither `href` nor `onOpen`
 * is not focusable at all, so an index of read-only cards has no keyboard
 * route into any of them; and the collapse trigger has `aria-expanded` but no
 * `aria-controls`, so nothing ties it to the cards it hides.
 */
export const KeyboardOrder: Story = {
  args: { sessions: SESSIONS, collapsibleSessions: true },
  render: (args) => (
    <div className="w-[900px] max-w-full">
      <ArtifactGrid {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    // Built from the DOM in document order rather than hand-listed, so the
    // assertion is about the sequence and not about my reading of the fixture.
    const chips = Array.from(canvasElement.querySelectorAll<HTMLElement>('[role="radio"]'));
    const sections = Array.from(
      canvasElement.querySelectorAll<HTMLElement>('[data-slot="artifact-grid-session"]'),
    );
    const stops: HTMLElement[] = [...chips];
    for (const section of sections) {
      stops.push(section.querySelector<HTMLElement>('[data-slot="section-header-trigger"]')!);
      stops.push(...Array.from(section.querySelectorAll<HTMLElement>('[data-slot="artifact-grid-card"] a')));
    }

    // Five chips: "All" plus one per type, each fusing its count into its own
    // name with no separator. Written out rather than normalised, because the
    // missing space is the defect the description records.
    await expect(chips.map((c) => c.textContent)).toEqual([
      "All",
      "Document1",
      "React1",
      "Data table1",
      "Chart1",
    ]);
    await expect(stops).toHaveLength(11);

    stops[0].focus();
    for (let i = 0; i < stops.length; i++) {
      const focused = document.activeElement as HTMLElement;
      await expect(focused).toBe(stops[i]);
      await expect(focused.matches(":focus-visible")).toBe(true);
      await settledFocusRing(focused, waitFor);
      await userEvent.tab();
    }

    // Nothing traps: the stop after the last card is outside the grid.
    await expect(canvasElement.contains(document.activeElement)).toBe(false);

    // Collapsing a session removes its cards from the tab order entirely, and
    // focus stays on the trigger that did it — nothing is stranded, which is
    // the one focus guarantee this component actually makes.
    const trigger = stops[5];
    trigger.focus();
    await userEvent.keyboard("{Enter}");
    await waitFor(() => expect(trigger.getAttribute("aria-expanded")).toBe("false"));
    await expect(document.activeElement).toBe(trigger);
    await expect(canvasElement.querySelectorAll('[data-slot="artifact-grid-card"] a')).toHaveLength(1);
  },
};

/**
 * `activeType` / `onActiveTypeChange` is a real controlled pair, and the shell
 * below holds it the hard way: it records what the grid asked for and applies
 * it only when told to.
 *
 * In order: clicking a facet does not filter the grid on its own; the callback
 * still fires with the payload a host needs; a re-render with an unchanged
 * `activeType` leaves the filter where it was; and applying the request
 * filters. The payload is the part worth watching — the "All" chip carries an
 * internal `__all__` sentinel, and the component translates it to `null`
 * before a host ever sees it, so a consumer keeping this in a URL never has to
 * know the sentinel exists.
 *
 * Note what is *not* controlled, because it is the gap E1 `generation-panel`
 * and I2 `property-inspector` were found to have: with `collapsibleSessions`,
 * which sessions are folded is internal state with no prop and no callback. A
 * host cannot restore a saved fold, cannot collapse everything from its own
 * toolbar, and cannot read what the user did. Recorded, not asserted.
 */
export const Controlled: Story = {
  render: () => <ControlledShell />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const cardCount = () => canvasElement.querySelectorAll('[data-slot="artifact-grid-card"]').length;

    // One react artifact in the fixture, and it is the only card drawn.
    await expect(cardCount()).toBe(1);
    await expect(canvas.getByRole("radio", { name: "React1" })).toBeChecked();

    // 1. Interaction alone does not move the rendered value.
    await userEvent.click(canvas.getByRole("radio", { name: "Document1" }));
    await expect(cardCount()).toBe(1);
    await expect(canvas.getByRole("radio", { name: "React1" })).toBeChecked();
    await expect(canvas.getByRole("radio", { name: "Document1" })).not.toBeChecked();

    // 2. …but the callback fired, with the type string a host has to apply.
    await expect(canvas.getByTestId("requested")).toHaveTextContent("document");

    // 3. Re-render with an unchanged `activeType`. Prove the re-render first.
    await expect(canvas.getByTestId("render-pass")).toHaveTextContent("1");
    await userEvent.click(canvas.getByRole("button", { name: "Re-render" }));
    await expect(canvas.getByTestId("render-pass")).toHaveTextContent("2");
    await expect(cardCount()).toBe(1);
    await expect(canvas.getByRole("radio", { name: "React1" })).toBeChecked();

    // 4. The payload was sufficient to apply the change.
    await userEvent.click(canvas.getByRole("button", { name: "Apply" }));
    await waitFor(() => expect(canvas.getByRole("radio", { name: "Document1" })).toBeChecked());
    await expect(cardCount()).toBe(1);
    await expect(canvas.getByText("Untitled document")).toBeInTheDocument();

    // 5. "All" reports `null`, not the internal sentinel.
    await userEvent.click(canvas.getByRole("radio", { name: "All" }));
    await expect(canvas.getByTestId("requested")).toHaveTextContent("null");
    await userEvent.click(canvas.getByRole("button", { name: "Apply" }));
    await waitFor(() => expect(cardCount()).toBe(4));
  },
};

function ControlledShell() {
  const [applied, setApplied] = React.useState<string | null>("react");
  const [requested, setRequested] = React.useState<string | null | undefined>(undefined);
  const [pass, setPass] = React.useState(1);

  return (
    <div className="flex w-[720px] max-w-full flex-col gap-4">
      <ArtifactGrid sessions={SESSIONS} activeType={applied} onActiveTypeChange={setRequested} />

      <div className="flex items-end justify-between gap-4 border-t pt-4">
        <dl className="text-foreground grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs">
          <dt>activeType prop</dt>
          <dd data-testid="applied">{applied === null ? "null" : applied}</dd>
          <dt>last onActiveTypeChange</dt>
          <dd data-testid="requested">
            {requested === undefined ? "—" : requested === null ? "null" : requested}
          </dd>
          <dt>host render pass</dt>
          <dd data-testid="render-pass" className="tabular-nums">
            {pass}
          </dd>
        </dl>

        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setPass((n) => n + 1)}>
            Re-render
          </Button>
          <Button
            size="sm"
            disabled={requested === undefined}
            onClick={() => requested !== undefined && setApplied(requested)}
          >
            Apply
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Everything optional left out, which on this card is most of it: no title, no
 * recency, no privacy, no reach, and — on the third card — no `href` and no
 * `onOpen` either.
 *
 * The empty-string cases are where it gets interesting, because this component
 * guards two adjacent fields two different ways. `title` and `editedAgo` are
 * truthiness-guarded, so `""` renders nothing at all and reads as absent — the
 * behaviour H7 `stem-mixer` and D3 `context-chips` were found *not* to have.
 * `viewCount` is guarded on `!== undefined`, so a genuine zero survives and
 * renders "0 views", which is right for a count and would be wrong for a
 * label. Both halves are asserted.
 *
 * Three empty strings are documented here rather than rendered. `allLabel=""`
 * leaves the `<ChoiceChip value={ALL}>` in `artifact-grid.tsx` a `role="radio"`
 * with no accessible name —
 * measured, not assumed: rendered once as a throwaway story, it fails axe with
 * "Buttons must have discernible text (button-name)" on the chip, so it cannot
 * ship into a gate running at `test: "error"`. `excerpt: ""` with an `href`
 * leaves an unnamed link the same way. A session `label` of `""` is subtler
 * and is not an axe failure at all: `section aria-labelledby` pointing at an
 * empty span produces a region with no name, so the session quietly stops
 * being a landmark and the only structure this index offers disappears. That
 * is the P1 `data-views` shape — a caller passing `""` to hide a heading gets
 * a structural loss rather than a visual tweak.
 *
 * The third card is the one to look at. With neither `href` nor `onOpen` the
 * excerpt is plain text, so the card has zero tab stops and nothing about it
 * looks different from the two above — a keyboard user finds out by tabbing
 * past it.
 */
export const EmptyLabel: Story = {
  args: {
    sessions: [
      {
        id: "bare",
        label: "Brand audit",
        items: [
          {
            id: "e1",
            type: "markdown",
            title: "",
            editedAgo: "",
            excerpt: "Every claim on the pricing page, with the source that supports it.",
            href: "#e1",
          },
          {
            id: "e2",
            type: "markdown",
            excerpt: "Competitor teardown, five products, one table per section.",
            viewCount: 0,
            href: "#e2",
          },
          {
            id: "e3",
            type: "markdown",
            excerpt: "Notes from the audit call. Not linked anywhere yet.",
          },
        ],
      },
    ],
  },
  render: (args) => (
    <div className="w-[900px] max-w-full">
      <ArtifactGrid {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const cards = Array.from(canvasElement.querySelectorAll<HTMLElement>('[data-slot="artifact-grid-card"]'));

    // One type across the whole fixture, so the facet row suppresses itself —
    // a one-facet filter is not a choice.
    await expect(canvasElement.querySelector('[data-slot="artifact-grid-filters"]')).toBeNull();

    // `title=""` and `editedAgo=""` read as absent, not as empty lines.
    await expect(cards[0].querySelector('[data-slot="artifact-grid-title"]')).toBeNull();
    await expect(cards[0].querySelector('[data-slot="artifact-grid-edited-ago"]')).toBeNull();

    // No visibility and no view count means no footer at all.
    await expect(cards[0].querySelector('[data-slot="artifact-grid-footer"]')).toBeNull();

    // …but `viewCount: 0` is a value, so it survives its guard and renders with
    // its unit.
    await expect(cards[1].querySelector('[data-slot="artifact-grid-footer"]')).not.toBeNull();
    await expect(canvas.getByText("0 views")).toBeInTheDocument();

    // The type badge never collapses: it is derived from `type`, which is
    // required, so there is no route to an unnamed badge.
    for (const card of cards) {
      await expect(card.querySelector('[data-slot="artifact-grid-type"]')!.textContent).toBe("Markdown");
    }

    // Card three is inert. Two links in a three-card grid, and nothing visible
    // distinguishes the one you cannot reach.
    await expect(cards[2].querySelectorAll("a, button")).toHaveLength(0);
    await expect(canvas.getAllByRole("link")).toHaveLength(2);
  },
};

/**
 * A long excerpt and a long title in one card, plus the third competitor that
 * pair usually hides: a long `type`.
 *
 * The excerpt is `line-clamp-4`, so it clips visually and not in the
 * accessible tree — the link's name is the whole string, which is the tradeoff
 * the docs module already records. The title is `truncate` with no `title`
 * attribute, so the clipped half is unrecoverable by hover or by keyboard, the
 * gap D3 `context-chips` was found to have on its own truncated label.
 *
 * The finding is the header row. The badge is `shrink-0` and the title is
 * `min-w-0 truncate`, so the badge wins every contest between them — a
 * consumer passing a verbose `type` (the value is free-form, and an unknown
 * type is title-cased rather than rejected) squeezes the title toward zero
 * while the badge keeps every pixel it asks for. Measured below. The excerpt
 * is unaffected because it sits on its own row, so "long excerpt versus long
 * title" turns out not to be the competition here — "long type versus title"
 * is.
 */
export const LongContent: Story = {
  args: {
    sessions: [
      {
        id: "long",
        label: "Quarterly pricing and packaging review, and the annual toggle experiment",
        items: [
          {
            id: "l1",
            type: "document",
            title: "Pricing page rewrite, third pass with the annual toggle and enterprise tier",
            // A whole first paragraph, which is what an excerpt of a document
            // actually is — the field is defined as the opening lines of the
            // content, not a summary someone wrote to fit.
            excerpt:
              "Three tiers, and the middle one is the default. Everything above it exists to make it look reasonable, and everything below it exists to make it look generous. The annual toggle sits above the cards rather than inside them, because a per-card toggle asks the same question three times and gets three chances to be misread. Discounts are shown as the monthly figure people will actually be charged.",
            editedAgo: "Edited 2 hours ago",
            viewCount: 1204,
            visibility: "public",
            href: "#l1",
          },
          {
            id: "l2",
            // Free-form: an unknown type is title-cased, never rejected, so a
            // consumer's own vocabulary lands in the badge at whatever length
            // it happens to be.
            type: "interactive-comparison-table",
            // Identical to the card above, so the only variable between the
            // two headers is the badge.
            title: "Pricing page rewrite, third pass with the annual toggle and enterprise tier",
            excerpt: "Plan · Seats · Monthly · Annual · Support SLA — the comparison grid.",
            editedAgo: "Edited yesterday",
            viewCount: 6,
            visibility: "private",
            href: "#l2",
          },
        ],
      },
    ],
  },
  // 420px, the column `chat-shell` and `artifact-shell` actually hand this
  // grid — the same width `NarrowColumn` above uses, and the width where the
  // header row is a scarce enough resource for the badge/title contest to be
  // visible. At 560px both titles fit outright and the story proves nothing.
  render: (args) => (
    <div className="w-[420px] max-w-full">
      <ArtifactGrid {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const cards = Array.from(canvasElement.querySelectorAll<HTMLElement>('[data-slot="artifact-grid-card"]'));

    // The excerpt clips at four lines…
    const excerpt = cards[0].querySelector<HTMLElement>('[data-slot="artifact-grid-excerpt"]')!;
    await expect(excerpt.scrollHeight).toBeGreaterThan(excerpt.clientHeight);

    // …and the link's accessible name is the whole thing anyway.
    await expect(
      canvas.getByRole("link", {
        name: /Three tiers, and the middle one is the default\..*actually be charged\./,
      }),
    ).toBeInTheDocument();

    // The title truncates, and there is no `title` attribute to recover it.
    const titleOf = (card: HTMLElement) =>
      card.querySelector<HTMLElement>('[data-slot="artifact-grid-title"]')!;
    await expect(titleOf(cards[0]).scrollWidth).toBeGreaterThan(titleOf(cards[0]).clientWidth);
    await expect(titleOf(cards[0]).getAttribute("title")).toBeNull();

    // The badge is `shrink-0`, so a verbose type takes its width out of the
    // title's. Both cards carry the same title string, and card two's is
    // narrower by exactly what its badge is wider: the header row is a fixed
    // budget and the badge spends first.
    const badgeOf = (card: HTMLElement) =>
      card.querySelector<HTMLElement>('[data-slot="artifact-grid-type"]')!;
    await expect(badgeOf(cards[1]).clientWidth).toBeGreaterThan(badgeOf(cards[0]).clientWidth);
    await expect(titleOf(cards[1]).clientWidth).toBeLessThan(titleOf(cards[0]).clientWidth);

    // Nothing escapes the card: the badge is `overflow-hidden whitespace-nowrap`
    // and the header row does not scroll.
    for (const card of cards) {
      await expect(card.scrollWidth).toBeLessThanOrEqual(card.clientWidth);
    }

    // The session label truncates too, so a long session name never pushes its
    // count off the header.
    const sessionTitle = canvasElement.querySelector<HTMLElement>('[data-slot="section-header-title"]')!;
    await expect(sessionTitle.scrollWidth).toBeGreaterThan(sessionTitle.clientWidth);
  },
};

/**
 * 375px, and for this component the wrapper is a real test condition rather
 * than a width-only one — the exception to mechanical fact 2, not a
 * contradiction of it. The gate's chromium runs at 1200px, so a `sm:` or `md:`
 * variant still fires inside a 375px box; this grid has none. Its columns are
 * `@[40rem]` / `@[64rem]` container queries resolved against the wrapper
 * directly above the grid (D19), so the frame below is what the grid measures
 * itself against, and one column here is the phone answer rather than the
 * squeezed-desktop one.
 *
 * The facet row is what could still overflow, since five chips at `px-3` is
 * wider than a phone. It is `flex flex-wrap`, so it stacks instead — asserted
 * by measuring the row against a single chip.
 *
 * One correction while this file was open: CONTINUE.md §8 still lists "grid
 * columns keyed off the viewport rather than the container: J4 `artifact-grid`
 * and C4 `recent-grid`" as an open composition gap. It is closed. D19 made
 * this component the pilot for the fix on 2026-08-18 and records that C4
 * converted after it; both files carry `@container` wrappers and arbitrary-value
 * container queries today, and `FullWidth` / `NarrowColumn` / the two
 * `JustBelow…` stories above already assert the thresholds. The §8 entry
 * describes the defect that decision removed.
 */
export const Mobile: Story = {
  args: { sessions: SESSIONS },
  render: (args) => (
    <div className="w-[375px] max-w-full" data-testid="viewport">
      <ArtifactGrid {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const viewport = canvas.getByTestId("viewport");

    // Measure the frame, not `canvasElement.firstElementChild` — the meta's
    // `layout: "centered"` wraps every story in its own ~1200px div, and an
    // overflow assertion against that passes for the wrong reason.
    await expect(viewport.getBoundingClientRect().width).toBe(375);
    await expect(viewport.scrollWidth).toBeLessThanOrEqual(viewport.clientWidth);

    // One column, from the container query rather than the viewport.
    const items = canvasElement.querySelector<HTMLElement>('[data-slot="artifact-grid-items"]')!;
    await expect(getComputedStyle(items).gridTemplateColumns.split(" ")).toHaveLength(1);

    // Cards fit, and the excerpt is the field that has to survive the squeeze.
    for (const card of canvasElement.querySelectorAll<HTMLElement>('[data-slot="artifact-grid-card"]')) {
      await expect(card.scrollWidth).toBeLessThanOrEqual(card.clientWidth);
    }

    // The facet row wrapped rather than overflowed: it is taller than one chip.
    const filters = canvasElement.querySelector<HTMLElement>('[data-slot="artifact-grid-filters"]')!;
    const chip = canvasElement.querySelector<HTMLElement>('[role="radio"]')!;
    await expect(filters.getBoundingClientRect().height).toBeGreaterThan(chip.getBoundingClientRect().height);
    await expect(filters.scrollWidth).toBeLessThanOrEqual(filters.clientWidth);
  },
};

/**
 * Against C4 `recent-grid`, the near-twin most likely to be reached for by
 * accident: both are grids of cards for work the user made earlier, both carry
 * an "Edited N ago" line, and from a screenshot at a distance they are the
 * same component.
 *
 * The rule is what the item leaves behind:
 *
 * - **Recent grid** is built on A8 `preview-tile`. The item has a picture of
 *   itself — a render, a frame, a colour — so the thumbnail is the recognition
 *   cue and the title is the caption under it. Use it when there is something
 *   to look at.
 * - **Artifact grid** is deliberately *not* an A8 consumer, and this is the
 *   one boundary the spec states outright. The item is text the assistant
 *   wrote, so the excerpt is both the recognition cue and the accessible name
 *   of the link, and a thumbnail frame would be an empty box above the only
 *   field anyone reads. The pair below is that sentence rendered: the recent
 *   grid's tiles have nothing to show, because a markdown document has no
 *   picture.
 *
 * Two further neighbours, for completeness. J1 `asset-library` is the same
 * content one level up — search, filters, folders, a list/grid switch and
 * selection mode — so it is a file manager and this is a reading list; reach
 * for J1 the moment a user needs to *find* something rather than recognise it.
 * J5 `record-list` sits beside both in the catalog and is not a neighbour at
 * all: its rows are things that run, and its primary control is an enable
 * toggle.
 */
export const Boundary: Story = {
  render: () => (
    <div className="flex w-full max-w-3xl flex-col gap-8">
      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">
          J4 artifact grid — the excerpt is the content, and the link&apos;s name
        </p>
        <ArtifactGrid
          filterable={false}
          sessions={[
            {
              id: "b-artifacts",
              label: "Brand audit",
              items: [
                {
                  id: "ba1",
                  type: "markdown",
                  excerpt: "Every claim on the pricing page, with the source that supports it.",
                  editedAgo: "Edited 2 hours ago",
                  href: "#ba1",
                },
                {
                  id: "ba2",
                  type: "markdown",
                  excerpt: "Competitor teardown, five products, one table per section.",
                  editedAgo: "Edited yesterday",
                  href: "#ba2",
                },
              ],
            },
          ]}
        />
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">
          C4 recent grid — a preview-tile frame, and the title is its caption
        </p>
        <RecentGrid
          items={[
            {
              id: "rg1",
              title: "Every claim on the pricing page",
              editedAgo: "Edited 2 hours ago",
              onOpen: () => {},
            },
            {
              id: "rg2",
              title: "Competitor teardown",
              editedAgo: "Edited yesterday",
              onOpen: () => {},
            },
          ]}
        />
      </section>
    </div>
  ),
};
