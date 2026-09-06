import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";

import { Button } from "@/components/ui/button";
import { AiDocBlock } from "@/registry/super-ai/ai-doc-block";
import {
  DiffReview,
  type DiffChange,
  type DiffChangeStatus,
  type DiffParagraph,
} from "@/registry/super-ai/diff-review";
import { DiffReviewDocs } from "@/content/components/diff-review.docs";
import { componentDocsPage } from "@/lib/component-docs-page";
import { focusTreatmentSignature, settledFocusRing } from "@/lib/focus-ring";

const paragraphs: DiffParagraph[] = [
  {
    id: "p1",
    segments: [
      { kind: "unchanged", text: "Teams can now " },
      { kind: "deleted", text: "utilise", changeId: "c1" },
      { kind: "inserted", text: "use", changeId: "c1" },
      { kind: "unchanged", text: " the export API to pull their own usage data" },
      { kind: "inserted", text: ", starting Monday", changeId: "c2" },
      { kind: "unchanged", text: "." },
    ],
  },
  {
    id: "p2",
    segments: [
      { kind: "unchanged", text: "It is " },
      { kind: "deleted", text: "very ", changeId: "c3" },
      { kind: "unchanged", text: "fast, and rate limits are documented " },
      { kind: "deleted", text: "in the appendix", changeId: "c4" },
      { kind: "inserted", text: "on the pricing page", changeId: "c4" },
      { kind: "unchanged", text: "." },
    ],
  },
];

const changes: DiffChange[] = [
  { id: "c1", rationale: "Plain English. Release notes are read in a hurry." },
  { id: "c2", rationale: "The launch date was missing, so every reader had to go and ask for it." },
  { id: "c3", rationale: "Intensifiers weaken a claim we can back with a number instead." },
  { id: "c4", rationale: "The appendix was retired last quarter; this link would have broken." },
];

/** Two resolved, two still pending — a review halfway through. */
const HALF_RESOLVED: DiffChange[] = [
  changes[0],
  { ...changes[1], status: "accepted" },
  changes[2],
  { ...changes[3], status: "rejected" },
];

/** One change the size of a sentence, which is what the docs page warns against. */
const LONG_PARAGRAPHS: DiffParagraph[] = [
  {
    id: "lp1",
    segments: [
      { kind: "unchanged", text: "Rate limits now apply per workspace rather than per key. " },
      {
        kind: "deleted",
        text: "If this affects you, you will have had an email from us at some point in the last fortnight explaining what to do",
        changeId: "lc1",
      },
      {
        kind: "inserted",
        text: "Workspaces over the old per-key ceiling were migrated on 3 March, and no key was throttled during the move",
        changeId: "lc1",
      },
      { kind: "unchanged", text: "." },
    ],
  },
];

const LONG_CHANGES: DiffChange[] = [
  {
    id: "lc1",
    rationale:
      "The original sentence told readers to go and find an email instead of telling them what happened, which is the one question they opened the changelog to answer.",
  },
];

const meta: Meta<typeof DiffReview> = {
  title: "Super AI/Diff Review",
  component: DiffReview,
  parameters: { layout: "centered", docs: { page: componentDocsPage(DiffReviewDocs) } },
  decorators: [
    (Story) => (
      <div className="w-[36rem] max-w-full">
        <Story />
      </div>
    ),
  ],
  args: {
    label: "Changelog entry",
    paragraphs,
    changes,
  },
};

export default meta;
type Story = StoryObj<typeof DiffReview>;

/**
 * The diff itself: a run of segments inside the paragraph, marked at word
 * level. Insertions and deletions are `ins`/`del` elements distinguished by
 * decoration shape, not hue, and each carries visually-hidden text naming it.
 * Read-only here — no handlers, so no verbs — and the reasons still show.
 */
export const WordLevel: Story = {};

/** One accept and one reject per change, each named for the change it resolves. */
export const PerChangeVerbs: Story = {
  args: {
    onAccept: () => {},
    onReject: () => {},
    changes: [
      changes[0],
      { ...changes[1], status: "accepted" as const },
      changes[2],
      { ...changes[3], status: "rejected" as const },
    ],
  },
};

/**
 * Accept-all and reject-all, in their own region below a separator and outside
 * the change list — a stray click near one change cannot resolve the document.
 */
export const BulkVerbs: Story = {
  args: {
    onAccept: () => {},
    onReject: () => {},
    onAcceptAll: () => {},
    onRejectAll: () => {},
  },
};

/* -------------------------------------------------------------------------
 * Case stories — the situations this component meets in a product, as opposed
 * to the prop combinations above. See docs/design-system/story-conventions.md.
 *
 * Seven of the eight are written. The one that is not:
 *
 * // case-skip: ReducedMotion — grep -E "animate-|transition|duration-" diff-review.tsx returns nothing
 * There is no branch to document. Every visual state here is a class swap
 * that repaints on the frame it changes: a resolved change unmounts its
 * verbs, an accepted insertion becomes a plain span, a rejected deletion
 * returns `null`. The only motion under this component belongs to the
 * vendored `Button` — `transition-all` plus `active:not-aria-[haspopup]:
 * translate-y-px`, the press nudge — which is a primitive-wide posture
 * recorded in CONTINUE.md §8 and deliberately not patched per component. A
 * `ReducedMotion` story here would render identically to `BulkVerbs` and
 * imply coverage of a branch that does not exist.
 * ---------------------------------------------------------------------- */

/**
 * Right-to-left, and the finding is that the diff survives it — which is not
 * a given, because H4 `transcript-editor` fails the same test.
 *
 * The reason is structural. Segments here are **inline elements inside one
 * `<p>`**, so the Unicode bidi algorithm runs across the whole sentence and a
 * Latin run keeps its own order inside an RTL paragraph: `utilise` still
 * paints to the left of `use`, which is what makes a replacement readable.
 * H4's tokens are flex items, so bidi never runs across the sentence and the
 * main axis alone orders the words — an English transcript renders backwards
 * there. Word-level marks in prose are the shape that gets this right for
 * free.
 *
 * The chrome mirrors for free too, and the record of why is that
 * `diff-review.tsx` contains no physical direction class at all — no `pl-`,
 * `ml-`, `border-l`, `left-` or `text-left`, only symmetric padding, `gap-*`
 * and `justify-between`. So this wave swept nothing here; there was nothing
 * to swap.
 *
 * Neither channel that carries insert-versus-delete is directional: the
 * visually-hidden lead-in is words, and the on-screen mark is decoration
 * shape. Both are asserted below, because "never signalled by colour alone"
 * is the component's own claim and this is the only place it is measured.
 */
export const RTL: Story = {
  args: { onAccept: () => {}, onReject: () => {} },
  render: (args) => (
    <div dir="rtl">
      <DiffReview {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="diff-review"]')!;
    await expect(getComputedStyle(root).direction).toBe("rtl");

    const del = root.querySelector<HTMLElement>('del[data-change-id="c1"]')!;
    const ins = root.querySelector<HTMLElement>('ins[data-change-id="c1"]')!;

    // 1. Bidi ran. The deleted word still paints before the word replacing it,
    //    because both sit in one inline run rather than in two flex children.
    await expect(
      `del.left < ins.left: ${del.getBoundingClientRect().left < ins.getBoundingClientRect().left}`,
    ).toBe("del.left < ins.left: true");

    // 2. The chrome did mirror: the verbs move to the leading (left) edge
    //    while the summary keeps the trailing one.
    const row = root.querySelector<HTMLElement>('[data-slot="diff-review-change"]')!;
    const summary = row.querySelector<HTMLElement>('[data-slot="diff-review-change-summary"]')!;
    const verbs = row.querySelector<HTMLElement>('[data-slot="diff-review-change-verbs"]')!;
    await expect(
      `verbs.left < summary.left: ${verbs.getBoundingClientRect().left < summary.getBoundingClientRect().left}`,
    ).toBe("verbs.left < summary.left: true");

    // 3. What a changed run announces, and it is not a colour. Each is a real
    //    `ins`/`del` wrapping visually-hidden words, and the two differ by
    //    decoration shape so the distinction survives greyscale.
    await expect(ins.textContent).toContain("insertion start");
    await expect(ins.textContent).toContain("insertion end");
    await expect(del.textContent).toContain("deletion start");
    await expect(getComputedStyle(ins).textDecorationLine).toBe("underline");
    await expect(getComputedStyle(del).textDecorationLine).toBe("line-through");
  },
};

/**
 * The whole keyboard surface, and the arithmetic the docs page promises: **two
 * stops per pending change plus the bulk pair, and nothing at all in the
 * prose**. Two of the four changes are already resolved here, so the walk is
 * six stops rather than ten — that is the docs' "every change you resolve
 * removes its two stops", asserted here rather than only described.
 *
 * The document region is the interesting half. It contains no focusable node
 * of any kind, which is what lets each change be a plain `<p>` run instead of
 * a button that would then have to contain the accept and reject buttons.
 *
 * **The per-row naming contract holds here, and this is where it is checked.**
 * Six stops, six distinct names, every per-change one derived from that
 * change's own segments rather than being the third identical "Accept". The
 * contract has broken five times elsewhere in this registry, so a pass is
 * worth recording. One measured detail the docs page's quoted example does not
 * show: the accname algorithm puts a space between the visible "Accept" and
 * the `sr-only` suffix, so the announced name is `Accept : replace “utilise”
 * with “use”` while `textContent` reads `Accept: …`.
 *
 * **Recorded, not asserted — the derivation collides when two changes make the
 * same edit.** `describeChange` reads segment text and nothing else, so two
 * changes that each delete the word "very" in different sentences produce one
 * string between them. Measured on a fixture with exactly that shape: both
 * Accept buttons read `Accept: delete “very”`, identical. It is the shape the
 * J wave hit where two rows legitimately share a title, and the escape hatch
 * (`summary`) is the caller's and undocumented for this purpose. No assertion
 * pins it, because disambiguating it — by paragraph, by ordinal — is a design
 * decision.
 *
 * Both focus checks run at every stop, because mechanical fact 5 says they
 * answer different questions, and on these vendored `Button`s the two are not
 * equally strong. Measured on the first stop: resting `box-shadow: none`, so
 * the differential flips — but it flips on the transition's **first frame**,
 * where all five layers are still `rgba(0, 0, 0, 0) 0px 0px 0px 0px` and
 * nothing is painted. `settledFocusRing` is what proves the ring, waiting for
 * `oklab(0.708 0 0 / 0.22) 0px 0px 0px 1.35px` to arrive. So here the
 * differential only rules out a permanent shadow being mistaken for a ring;
 * it is `transition-all` that makes the absolute check the load-bearing one.
 */
export const KeyboardOrder: Story = {
  args: {
    changes: HALF_RESOLVED,
    onAccept: () => {},
    onReject: () => {},
    onAcceptAll: () => {},
    onRejectAll: () => {},
  },
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="diff-review"]')!;

    // 1. Nothing in the prose is focusable, by design.
    const prose = root.querySelector<HTMLElement>('[data-slot="diff-review-document"]')!;
    await expect(prose.querySelectorAll("button, a, input, select, textarea, [tabindex]")).toHaveLength(0);

    // 2. A resolved change contributes no stops — its verbs are replaced by a
    //    text span, so the tab order shortens as the review proceeds.
    const resolved = root.querySelectorAll(
      '[data-slot="diff-review-change"][data-status="accepted"], [data-slot="diff-review-change"][data-status="rejected"]',
    );
    await expect(resolved).toHaveLength(2);
    for (const li of resolved) await expect(li.querySelectorAll("button")).toHaveLength(0);

    // 3. Two pending changes × two verbs, then the bulk pair.
    const stops = Array.from(root.querySelectorAll<HTMLButtonElement>("button:not([disabled])"));
    await expect(stops).toHaveLength(6);

    const nameOf = (el: Element | null) =>
      el === null
        ? "nothing"
        : `${el.getAttribute("data-slot") ?? el.tagName.toLowerCase()}[${(el.textContent ?? "")
            .replace(/\s+/g, " ")
            .trim()}]`;

    // 4. The per-row naming contract: six stops, six distinct names.
    const names = stops.map((el) => nameOf(el));
    await expect(new Set(names).size).toBe(names.length);
    await expect(names[0]).toContain("Accept: replace");
    await expect(names[4]).toBe("diff-review-accept-all[Accept all changes]");

    // Resting signatures first, with nothing focused — so the walk can prove
    // focus is what painted each ring rather than a shadow that was always on.
    const resting = new Map(stops.map((el) => [el, focusTreatmentSignature(el)] as const));

    await userEvent.tab();
    for (const stop of stops) {
      await expect(nameOf(document.activeElement)).toBe(nameOf(stop));
      await expect(`${nameOf(stop)} focusVisible=${stop.matches(":focus-visible")}`).toBe(
        `${nameOf(stop)} focusVisible=true`,
      );
      await settledFocusRing(stop, waitFor);
      await waitFor(() => expect(focusTreatmentSignature(stop)).not.toBe(resting.get(stop)));
      await userEvent.tab();
    }

    // 5. Nothing traps: the stop after reject-all is outside the component.
    await expect(root.contains(document.activeElement)).toBe(false);
  },
};

/**
 * `changes[].status` is the value and `onAccept`/`onReject` are the change
 * callbacks, so this component is controlled in the only way that matters:
 * pressing Accept moves nothing on its own. That is not obvious from the props
 * table, because there is no prop called `value` — the state lives inside an
 * array element, and a host that forgets to apply it ships a review where
 * every button looks broken.
 *
 * Four things in order, none of which a screenshot can show: the click leaves
 * both the prose and the change's `data-status` exactly where they were; `onAccept` still fires with the change id, which is the whole payload
 * a host needs; a re-render with an unchanged `changes` array holds it fixed;
 * and applying the status is what edits the prose — the deleted run
 * disappears, the inserted run demotes to ordinary text, the verbs become the
 * word "Accepted" and the live count drops by one.
 *
 * The host below applies on a separate button, which is what lets the first
 * three steps be proved at all — but it is not how a real one behaves, and the
 * difference is the component's sharpest edge.
 *
 * **Recorded, not asserted: a host that applies on the callback drops focus.**
 * Accept and Reject are unmounted by their own success. Measured against a
 * self-applying host on a two-change fixture, with Enter pressed on a focused
 * Accept: `document.activeElement` becomes `<body>`, and the tab order drops
 * from six stops to four in the same frame, so the next Tab restarts at the
 * top of the page while the polite count announces with no context. The bulk pair ends
 * the same way, by disabling itself once nothing is pending. The docs module's
 * focus list already carries this and asks callers to move focus to the next
 * pending change themselves; where focus *should* land is a design decision,
 * so nothing here makes the current answer permanent.
 */
export const Controlled: Story = {
  render: (args) => <ControlledShell onAccept={args.onAccept!} />,
  args: { onAccept: fn() },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="diff-review"]')!;
    const rowStatus = () =>
      root
        .querySelector('[data-slot="diff-review-change"][data-change-id="c1"]')!
        .getAttribute("data-status");
    const deletedRun = () => root.querySelector('del[data-change-id="c1"]');

    await expect(deletedRun()).not.toBeNull();
    await expect(rowStatus()).toBe("pending");

    // 1. Interaction alone does not move the rendered value. The name asked
    //    for here is the derived one, and it carries the space the accname
    //    algorithm inserts between the visible "Accept" and the `sr-only`
    //    suffix — which the docs page's quoted example does not show.
    await userEvent.click(canvas.getByRole("button", { name: "Accept : replace “utilise” with “use”" }));
    await expect(deletedRun()).not.toBeNull();
    await expect(rowStatus()).toBe("pending");

    // 2. …but the callback fired, with the id a host applies.
    await expect(args.onAccept).toHaveBeenCalledWith("c1");
    await expect(canvas.getByTestId("requested")).toHaveTextContent("c1");

    // 3. Re-render with an unchanged `changes`. Prove the re-render first.
    await expect(canvas.getByTestId("render-pass")).toHaveTextContent("1");
    await userEvent.click(canvas.getByRole("button", { name: "Re-render" }));
    await expect(canvas.getByTestId("render-pass")).toHaveTextContent("2");
    await expect(deletedRun()).not.toBeNull();
    await expect(rowStatus()).toBe("pending");

    // 4. Applying the status is what edits the prose: the deleted run goes and
    //    the inserted one stops being a mark.
    await userEvent.click(canvas.getByRole("button", { name: "Apply" }));
    await waitFor(() => expect(deletedRun()).toBeNull());
    await expect(rowStatus()).toBe("accepted");
    const applied = root.querySelector<HTMLElement>('[data-change-id="c1"][data-resolved]')!;
    await expect(applied.tagName.toLowerCase()).toBe("span");
    await expect(applied.getAttribute("data-kind")).toBe("unchanged");
    await expect(applied.textContent).toBe("use");

    // …and the two stops that change owned are gone with it.
    await expect(
      root.querySelector('[data-slot="diff-review-change"][data-change-id="c1"] button'),
    ).toBeNull();
    await expect(canvas.getByRole("status")).toHaveTextContent("3 of 4 changes awaiting review");
  },
};

function ControlledShell({ onAccept }: { onAccept: (changeId: string) => void }) {
  const [applied, setApplied] = React.useState<Record<string, DiffChangeStatus>>({});
  const [requested, setRequested] = React.useState<string | null>(null);
  const [pass, setPass] = React.useState(1);

  const held = React.useMemo(
    () => changes.map((change) => (applied[change.id] ? { ...change, status: applied[change.id] } : change)),
    [applied],
  );

  return (
    <div className="flex flex-col gap-4">
      <DiffReview
        label="Changelog entry"
        paragraphs={paragraphs}
        changes={held}
        onAccept={(id) => {
          setRequested(id);
          onAccept(id);
        }}
        onReject={() => {}}
      />

      <div className="flex flex-wrap items-end justify-between gap-4">
        <dl className="text-foreground grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs">
          <dt>applied statuses</dt>
          <dd data-testid="applied">
            {Object.keys(applied).length === 0 ? "none" : Object.keys(applied).join(", ")}
          </dd>
          <dt>last onAccept</dt>
          <dd data-testid="requested">{requested ?? "—"}</dd>
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
            disabled={requested === null}
            onClick={() => requested !== null && setApplied((prev) => ({ ...prev, [requested]: "accepted" }))}
          >
            Apply
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Three optional text slots emptied at once — `label`, `summary` and the
 * rationale — and the finding is that **the prose channel is the only one
 * that survives, and none of the three collapses is a gate failure**.
 *
 * What is asserted: both changed runs still announce themselves. The
 * visually-hidden "insertion start"/"deletion start" lead-in and the
 * decoration shape live in the component, not in any prop, so a caller cannot
 * empty them and a reader is never left with colour as the only signal. That
 * is the guarantee worth pinning here.
 *
 * What is **measured and recorded, not asserted**, because each fix is a
 * design decision:
 *
 * - `label=""` is not the default. `label = "Suggested edits"` is a default
 *   parameter, which only fires on `undefined`, so an empty string renders an
 *   empty heading span: the header's whole text measures
 *   `"4 of 4 changes awaiting review"` and the frame no longer says what is
 *   being reviewed. Same shape as J7 and H7's `label=""`; no axe rule covers
 *   it, because the root carries no role the label would have named.
 * - `summary=""` is worse than `summary` missing. The fallback is `??`, so an
 *   empty string wins over `describeChange`: measured, the eight verbs here
 *   carry six names, because the two empty-summary changes contribute
 *   `Accept:` and `Reject:` twice each — the anonymous verb this component was
 *   built to avoid, reached through its own escape hatch. `button-name` passes
 *   throughout, because "Accept" is still text.
 * - `rationale=""` defeats the one rule this component exists for. The type
 *   makes it required, and `""` is a valid `ReactNode`, so the slot renders
 *   with `textContent` of `""` and the change ships unexplained.
 */
export const EmptyLabel: Story = {
  args: {
    label: "",
    onAccept: () => {},
    onReject: () => {},
    changes: [
      { id: "c1", rationale: "", summary: "" },
      { id: "c2", rationale: changes[1].rationale },
      { id: "c3", rationale: "", summary: "" },
      { id: "c4", rationale: changes[3].rationale },
    ],
  },
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="diff-review"]')!;

    // The guarantee: what a changed run announces comes from the component,
    // so no prop can empty it.
    const ins = root.querySelector<HTMLElement>('ins[data-change-id="c1"]')!;
    const del = root.querySelector<HTMLElement>('del[data-change-id="c1"]')!;
    await expect(ins.textContent).toBe("insertion start use insertion end");
    await expect(del.textContent).toBe("deletion start utilise deletion end");
    await expect(getComputedStyle(ins).textDecorationLine).toBe("underline");
    await expect(getComputedStyle(del).textDecorationLine).toBe("line-through");

    // Every verb still resolves to a non-empty name, which is exactly why the
    // collapse above is invisible to the gate rather than caught by it.
    const verbs = Array.from(root.querySelectorAll<HTMLButtonElement>("button"));
    await expect(verbs).toHaveLength(8);
    for (const verb of verbs) {
      await expect(`${verb.dataset.slot} named=${(verb.textContent ?? "").trim().length > 0}`).toBe(
        `${verb.dataset.slot} named=true`,
      );
    }
  },
};

/**
 * A 113-character deleted run replaced by a 106-character one, with a
 * 160-character rationale beside it — the longest thing this component can be
 * handed that is still a single change.
 *
 * The layout decision is **wrap, everywhere, with no truncation anywhere**.
 * The change row is `flex-wrap` with `min-w-0 flex-1` on the text column, so a
 * long rationale pushes the verbs onto their own line rather than off the
 * card; the prose wraps as prose; and the long `<ins>` breaks across lines
 * while keeping its underline on every fragment, which is what makes the mark
 * survive a passage-sized edit. Truncating either would be the wrong answer —
 * a clipped rationale is an unexplained change, which is the failure this
 * component exists to prevent.
 *
 * The cost is on the accessible name, and it is worth knowing before you emit
 * a change this size. `describeChange` is derived rather than authored, which
 * is what stops eight buttons announcing as "Accept" — but it has no cap, so
 * this one change gives its Accept button a 245-character name that a
 * screen-reader user hears in full before reaching Reject. That is the
 * measured argument for the docs page's own "don't emit one paragraph-sized
 * change": the segment-level rule is about what the verbs end up called, not
 * only about re-reading.
 */
export const LongContent: Story = {
  args: {
    label: "Rate limits, March release",
    paragraphs: LONG_PARAGRAPHS,
    changes: LONG_CHANGES,
    onAccept: () => {},
    onReject: () => {},
  },
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="diff-review"]')!;

    // 1. Nothing scrolls sideways and nothing is clipped.
    await expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth);
    const rationale = root.querySelector<HTMLElement>('[data-slot="diff-review-rationale"]')!;
    await expect(getComputedStyle(rationale).textOverflow).toBe("clip");
    await expect(rationale.scrollWidth).toBeLessThanOrEqual(rationale.clientWidth);

    // 2. The rationale wrapped rather than pushing the verbs off the card.
    //    It is a flex item, so it is blockified and `getClientRects()` returns
    //    one box however many lines it holds — measure the box against the
    //    line height instead.
    const row = root.querySelector<HTMLElement>('[data-slot="diff-review-change"]')!;
    const verbs = row.querySelector<HTMLElement>('[data-slot="diff-review-change-verbs"]')!;
    const lineHeight = parseFloat(getComputedStyle(rationale).lineHeight);
    await expect(rationale.getBoundingClientRect().height).toBeGreaterThan(lineHeight * 2);
    await expect(verbs.getBoundingClientRect().right).toBeLessThanOrEqual(
      Math.ceil(row.getBoundingClientRect().right),
    );

    // 3. The long insertion breaks across lines and keeps its mark on each.
    const ins = root.querySelector<HTMLElement>('ins[data-change-id="lc1"]')!;
    await expect(ins.getClientRects().length).toBeGreaterThan(1);
    await expect(getComputedStyle(ins).textDecorationLine).toBe("underline");

    // 4. The derived name carries the whole run — the property that keeps the
    //    verbs distinct, and the reason a passage-sized change is expensive.
    const accept = root.querySelector<HTMLElement>('[data-slot="diff-review-accept"]')!;
    const name = (accept.textContent ?? "").replace(/\s+/g, " ").trim();
    await expect(name).toContain("no key was throttled during the move");
    await expect(name.length).toBeGreaterThan(200);
  },
};

/**
 * 375px, with everything wired: four pending changes, both per-change verbs
 * and both bulk verbs. Nothing here is breakpoint-conditional — the component
 * carries no `sm:`/`md:` class at all — so this is a true narrow render rather
 * than the desktop layout squeezed, which mechanical fact 2 warns is what a
 * width-only wrapper usually gives you.
 *
 * Two rows are the ones under pressure, and `flex-wrap` is what saves both.
 * Measured inside the card's 341px content box: the bulk region holds a 96px
 * "Whole document" label plus 155px and 151px buttons, which is 402px of
 * content, so the label takes a line of its own and the two buttons keep one
 * between them — 52px tall, `scrollWidth` equal to `clientWidth`. There is no
 * headroom left in that row, so the assertion below is the one that would
 * catch a future rename (`Accept all changes in this document`) turning into
 * horizontal scroll. F2 `generation-grid`'s bulk bar is the shape that failed
 * exactly here.
 */
export const Mobile: Story = {
  args: {
    onAccept: () => {},
    onReject: () => {},
    onAcceptAll: () => {},
    onRejectAll: () => {},
  },
  render: (args) => (
    <div className="w-[375px] max-w-full" data-testid="viewport">
      <DiffReview {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const viewport = canvas.getByTestId("viewport");
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="diff-review"]')!;

    // The frame, not `canvasElement.firstElementChild` — a `layout: "centered"`
    // meta wraps every story in a ~1200px centring div, and measuring that
    // passes for the wrong reason.
    await expect(viewport.getBoundingClientRect().width).toBe(375);
    await expect(viewport.scrollWidth).toBeLessThanOrEqual(viewport.clientWidth);
    await expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth);

    // The two rows that wrap rather than overflow.
    for (const slot of ["diff-review-change", "diff-review-bulk"]) {
      const el = canvasElement.querySelector<HTMLElement>(`[data-slot="${slot}"]`)!;
      await expect(`${slot} overflows=${el.scrollWidth > el.clientWidth}`).toBe(`${slot} overflows=false`);
    }
  },
};

/**
 * Against K1 `ai-doc-block`, the neighbour this is most often built as by
 * mistake — both put approval verbs on generated prose inside a document, and
 * in a screenshot the two look like one component with a different verb set.
 *
 * The choosing rule is **whose prose it is**:
 *
 * - **K1 `ai-doc-block`** is a passage the model wrote. There is nothing to
 *   compare it against, so the unit of approval is the whole block — Keep,
 *   Edit, Regenerate, Discard — and no rationale is required, because the
 *   prompt is the reason.
 * - **K3 `diff-review`** is a passage *you* wrote that the model has argued
 *   with. The unit of approval is one edit, each carries the argument for
 *   itself, and the marks are word-level so you can see what is actually in
 *   dispute.
 *
 * So: whole-cloth output is K1, and a rewrite of existing text is K3 — which
 * is why K4 `selection-toolbar`'s spec says a rewrite returns as a K3 diff
 * rather than silently replacing the selection. Reaching for K1 to show a
 * rewrite is what produces the "here is your new paragraph, hope you like it"
 * interaction the whole family is arranged to avoid.
 */
export const Boundary: Story = {
  render: () => (
    <div className="flex w-full flex-col gap-6">
      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">
          K3 diff review — your prose, one argument per edit
        </p>
        <DiffReview
          label="Changelog entry"
          paragraphs={paragraphs}
          changes={changes}
          onAccept={() => {}}
          onReject={() => {}}
        />
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">
          K1 AI doc block — the model&apos;s prose, approved as one passage
        </p>
        <AiDocBlock
          label="AI generated"
          onKeep={() => {}}
          onEdit={() => {}}
          onRegenerate={() => {}}
          onDiscard={() => {}}
        >
          <p>
            Rate limits now apply per workspace rather than per key. Workspaces over the old per-key ceiling
            were migrated on 3 March, and no key was throttled during the move.
          </p>
        </AiDocBlock>
      </section>
    </div>
  ),
};
