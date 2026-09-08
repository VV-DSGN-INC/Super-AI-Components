import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";

import { expect, userEvent, waitFor, within } from "storybook/test";

import { Button } from "@/components/ui/button";
import { AiDocBlock } from "@/registry/super-ai/ai-doc-block";
import { ApprovalCard } from "@/registry/super-ai/approval-card";
import { ApprovalCardDocs } from "@/content/components/approval-card.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const DETAIL = (
  <p>
    Revenue grew 14% quarter over quarter, driven mostly by the self-serve tier. Churn held flat at 2.1%. The
    one number worth flagging is support volume, which rose 30% against a headcount that did not move.
  </p>
);

const meta: Meta<typeof ApprovalCard> = {
  title: "Super AI/Approval Card",
  component: ApprovalCard,
  parameters: { layout: "centered", docs: { page: componentDocsPage(ApprovalCardDocs) } },
  decorators: [
    (Story) => (
      <div className="w-96 max-w-full">
        <Story />
      </div>
    ),
  ],
  args: {
    title: "Send the Q3 summary to the team",
    summary: "Three paragraphs drafted from last quarter's metrics, ready to post in #general.",
    onConfirm: () => {},
    onEdit: () => {},
    onRegenerate: () => {},
    onSkip: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof ApprovalCard>;

/**
 * The state the card exists for: an artifact held, nothing sent yet, and the
 * four verbs live. The detail is folded — that fold is the component's whole
 * argument, so the resting state is the one where a reader has to ask for the
 * text before they can approve it.
 */
export const Pending: Story = {
  args: {
    state: "pending",
    detail: DETAIL,
  },
};

/** Every verb locks while the decision is in flight, not just the one clicked. */
export const Submitting: Story = {
  args: { state: "submitting" },
};

/** Confirm and Skip are terminal, so the outcome keeps Undo for a window. */
export const Resolved: Story = {
  args: {
    state: "resolved",
    resolution: "confirmed",
    onUndo: () => {},
  },
};

/**
 * The handlers here are passed in reverse — Skip first, Confirm last — and the
 * card still renders Confirm · Edit · Regenerate · Skip. Order is a property
 * of the component, so it holds across every approval surface in the product.
 */
export const VerbOrder: Story = {
  args: {
    title: "Verb order is fixed by the component",
    summary: "Handlers were supplied in reverse order.",
    onSkip: () => {},
    onRegenerate: () => {},
    onEdit: () => {},
    onConfirm: () => {},
  },
};

/* -------------------------------------------------------------------------
 * Case stories — the situations an approval surface meets in a product, as
 * opposed to the three lifecycle states above. See
 * docs/design-system/story-conventions.md.
 *
 * All eight are true for this component, so there are no `case-skip` lines.
 * That follows from the shape: a card of author-supplied text, a real
 * `expanded`/`onExpandedChange` pair, five focus stops, two things that move,
 * a button group built from physical direction classes, and a near-twin (K1
 * `ai-doc-block`) that copied this component's verb rule rather than
 * composing it.
 * ---------------------------------------------------------------------- */

/**
 * Right-to-left. Reading order is the contract this component defends —
 * "four verbs, always in the same order" is meaningless if the order it
 * renders is the viewport's rather than the reader's — so under `dir="rtl"`
 * Confirm has to paint at the **right** edge and Skip at the left, with the
 * resolution row and its Undo mirroring the same way.
 *
 * The order mirrors for free, and the reason is worth recording:
 * `approval-card.tsx` contains no physical inline utility anywhere (no `pl-`,
 * `ml-`, `left-`, `border-l`, `text-left`), only `flex`, `gap-*` and
 * `items-start`. There is nothing here for the logical-property sweep in
 * `CONTINUE.md` §8 to swap.
 *
 * Two of the six glyphs are directional and do not mirror: `SkipForward`
 * keeps pointing right when "forward" is leftward, and `Undo2` keeps curving
 * left when "back" is rightward. Both are `aria-hidden` beside a visible word,
 * so nothing is misnamed and nothing is unreachable — this is the mild form of
 * the `reference-strip` / `frame-strip` finding in §8, where the direction had
 * reached the label and the callback payload as well. Recorded rather than
 * swapped: choosing a mirrored glyph set is a design decision across the
 * registry, not a class swap in one file.
 *
 * **What does not mirror is the vendored `ButtonGroup` that holds the verbs,**
 * and four children show the defect in a shape the two-child form E8
 * `generation-wizard` measured could not. `components/ui/button-group.tsx`
 * joins children with physical classes — `*:data-slot:rounded-r-none`,
 * `rounded-r-lg!`, `rounded-l-none`, `border-l-0` — resolved against the
 * viewport rather than the writing direction. Measured here under `dir="rtl"`,
 * reading the row as it paints (Confirm at the right, Skip at the left):
 *
 * - both **outer** edges are square — Confirm's right corner 0px, Skip's left
 *   corner 0px;
 * - both **seams** are rounded, and not even to the same value: 8px where
 *   Confirm meets Edit (the button's own radius) against 10px where Regenerate
 *   meets Skip (the group's `rounded-r-lg!` override);
 * - `border-l-0` strips the border from the group's outer *left* edge, which
 *   in RTL is Skip — the last verb, and one of the two terminal ones — while
 *   leaving two borders stacked at each of the three seams.
 *
 * A row built to read as one control reads instead as four that happen to
 * touch, with its outer edge open. In LTR the identical measurement is flush,
 * so nothing but an RTL story could have found it.
 *
 * Not asserted below: asserting today's radii would pin them. The fix is
 * logical radius and border utilities in the vendored primitive, where one
 * change repairs every `ButtonGroup` in the registry — not something a case
 * story on one consumer should sweep.
 */
export const RTL: Story = {
  render: (args) => (
    <div dir="rtl" className="flex w-full flex-col gap-4">
      <section data-testid="rtl-pending">
        <ApprovalCard {...args} state="pending" detail={DETAIL} />
      </section>
      <section data-testid="rtl-resolved">
        <ApprovalCard {...args} state="resolved" resolution="confirmed" onUndo={() => {}} />
      </section>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const pending = within(canvas.getByTestId("rtl-pending"));

    // Mirrored, not merely reordered in the DOM: the first verb paints at the
    // right edge and the last at the left, so reading order survives.
    const confirm = pending.getByRole("button", { name: "Confirm" });
    const skip = pending.getByRole("button", { name: "Skip" });
    await expect(confirm.getBoundingClientRect().left).toBeGreaterThan(skip.getBoundingClientRect().left);

    // The resolution row flips with it — the outcome wording leads and Undo
    // trails, rather than Undo jumping to the reading start.
    const resolved = canvas.getByTestId("rtl-resolved");
    const outcome = within(
      resolved.querySelector<HTMLElement>('[data-slot="approval-card-resolution"]')!,
    ).getByText("Confirmed");
    const undo = within(resolved).getByRole("button", { name: "Undo" });
    await expect(outcome.getBoundingClientRect().left).toBeGreaterThan(undo.getBoundingClientRect().left);
  },
};

/**
 * `prefers-reduced-motion`. Two things in this card move, and both were live
 * offenders until this wave — the chevron is the one `CONTINUE.md` §8 named at
 * `approval-card.tsx:162`, one of four rotating chevrons the E/P wave left for
 * the family that owns the file.
 *
 * Both fixed here as mechanical repairs (spec §3.4):
 *
 * - the expand chevron's `transition-transform` gains
 *   `motion-reduce:transition-none`, the `pricing-table` idiom E1
 *   `generation-panel` used on the identical shape. A 180° rotation is travel,
 *   not a colour crossfade, so it is the second sanctioned idiom in
 *   `story-conventions.md` fact 3 rather than the declined one;
 * - the Confirm spinner's `animate-spin` gains `motion-reduce:animate-none`.
 *   The plain one-class remedy is correct here because the spinner is a bare
 *   lucide glyph rather than a Base UI popup surface — nothing in this
 *   component portals, so the restated `data-open` form §8's correction
 *   describes does not apply.
 *
 * `vitest.config.ts` emulates reduce for every test, so the assertions read
 * `transitionProperty` and `animationName` back off the live elements rather
 * than trusting the class. Measured against the unfixed source, both read back
 * live: `"transform, translate, scale, rotate"` on the chevron and `"spin"` on
 * the spinner. (That first string is also why the rotation has to be read from
 * the standalone `rotate` property below — Tailwind v4 compiles `rotate-180`
 * to `rotate`, not to `transform`, and `transition-transform` covers both.)
 *
 * Not this component's branch, and left alone deliberately: the vendored
 * `Button` carries `transition-all` and a one-pixel `active:` press nudge, so
 * every control here still moves a pixel while pressed under reduce. §8 records
 * that as a primitive-wide posture, so no case story adds a class for it.
 */
export const ReducedMotion: Story = {
  render: (args) => (
    <div className="flex w-full flex-col gap-4">
      <section data-testid="rm-pending">
        <ApprovalCard {...args} state="pending" detail={DETAIL} />
      </section>
      <section data-testid="rm-submitting">
        <ApprovalCard {...args} state="submitting" />
      </section>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // 1. The chevron. It is the only thing in the pending card that travels.
    const expand = within(canvas.getByTestId("rm-pending")).getByRole("button", {
      name: "Show detail",
    });
    const chevron = expand.querySelector("svg")!;
    await expect(getComputedStyle(chevron).transitionProperty).toBe("none");

    // …and it still turns, so the affordance survives the suppressed tween.
    const restingRotate = getComputedStyle(chevron).rotate;
    await userEvent.click(expand);
    const rotated = within(canvas.getByTestId("rm-pending")).getByRole("button", {
      name: "Hide detail",
    });
    await expect(getComputedStyle(rotated.querySelector("svg")!).rotate).not.toBe(restingRotate);

    // 2. The submitting spinner, which is the only keyframe animation here.
    const spinner = canvas
      .getByTestId("rm-submitting")
      .querySelector<HTMLElement>('[data-slot="approval-card-confirm"] svg')!;
    await expect(getComputedStyle(spinner).animationName).toBe("none");
  },
};

/**
 * Five stops, in one order, and the order is the point: the expand toggle
 * comes **before** the verbs, so a keyboard user reaches "Show detail" on the
 * way to Confirm rather than past it. A card that put the verbs first would
 * let someone approve without ever passing the affordance that reveals what
 * they are approving.
 *
 * Two facts the walk pins that nothing else records:
 *
 * - **Expanding costs no stop.** The detail is a plain `div`, not a focusable
 *   panel, so the count is five whether the fold is open or shut — the
 *   opposite of E1 `generation-panel`, where opening a stage adds stops. The
 *   walk runs the full lap twice, once in each state.
 * - **Nothing traps.** One more Tab past Skip leaves the card entirely.
 *
 * **The convention's second half — "a visible focus treatment at every stop" —
 * is deliberately not asserted, because it cannot be honestly asserted here.**
 * Measured in the gate's chromium, on all five stops, in both laps:
 *
 * - `outline-style` is `none` (the vendored `Button` sets `outline-none`),
 *   with an `outline-width` of 3px that therefore paints nothing;
 * - `box-shadow` composes five layers and **every one of them is zero-size and
 *   fully transparent** — `rgba(0, 0, 0, 0) 0px 0px 0px 0px` four times and
 *   `oklab(0 0 0 / 0) 0px 0px 0px 0px` once — even though `--tw-ring-shadow`
 *   on the same element reads back a real ring, `0 0 0 calc(3px + 0px)
 *   color-mix(in oklab, oklch(0.708 0 0) 50%, transparent)`;
 * - `border-color` is byte-identical focused and unfocused, so
 *   `focus-visible:border-ring` changes nothing either.
 *
 * So the house check (`boxShadow !== "none" || outlineStyle !== "none"`) would
 * pass on every stop **and prove nothing** — the five-layer transparent string
 * is simply not the word "none". That is the false positive `CONTINUE.md` §8
 * records, measured here on a plain vendored `Button` rather than on an
 * `sr-only` input, which makes it a registry-wide question rather than a local
 * one: nothing in the tree carries its own ring, so this is every button in
 * `super-ai`. Whether the ring also fails to *paint* in a real browser is
 * unverified — a computed-style read is not a screenshot, and `color-mix()`
 * inside a registered custom property is exactly the shape where the two can
 * disagree. Asserting `ring=true` would pin a vacuous check; asserting
 * `ring=false` would pin a defect that may not exist. Recorded instead, and
 * `:focus-visible` — the half that is provable — is asserted at every stop.
 *
 * Recorded, not asserted, and already in the docs module: pressing Confirm
 * disables the button under the caret and drops focus to `<body>`; reaching
 * `resolved` unmounts the verb row without moving focus to the outcome; and
 * Undo, the one control with a countdown on it, is never focused when it
 * appears and unmounts silently when its window closes.
 */
export const KeyboardOrder: Story = {
  args: { state: "pending", detail: DETAIL },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const card = canvasElement.querySelector<HTMLElement>('[data-slot="approval-card"]')!;

    const nameOf = (el: Element | null) =>
      el === null ? "nothing" : `[${el.textContent?.trim().slice(0, 24) ?? ""}]`;

    const walk = async (expectedNames: string[]) => {
      const stops = Array.from(card.querySelectorAll<HTMLElement>("button"));
      await expect(stops.map((el) => el.textContent?.trim())).toEqual(expectedNames);

      const seen = new Set<HTMLElement>();
      for (const stop of stops) {
        await userEvent.tab();
        const focused = document.activeElement as HTMLElement;
        await expect(nameOf(focused)).toBe(nameOf(stop));
        await expect(`${nameOf(focused)} repeat=${seen.has(focused)}`).toBe(
          `${nameOf(focused)} repeat=false`,
        );
        await expect(`${nameOf(focused)} focusVisible=${focused.matches(":focus-visible")}`).toBe(
          `${nameOf(focused)} focusVisible=true`,
        );
        seen.add(focused);
      }

      // One more Tab leaves the card rather than cycling inside it.
      await userEvent.tab();
      await expect(card.contains(document.activeElement)).toBe(false);
    };

    // 1. Collapsed: the toggle, then the four verbs in their fixed order.
    await walk(["Show detail", "Confirm", "Edit", "Regenerate", "Skip"]);

    // 2. Expanded: the detail is not focusable, so the same five stops hold.
    await userEvent.click(canvas.getByRole("button", { name: "Show detail" }));
    await expect(canvasElement.querySelector('[data-slot="approval-card-detail"]')).not.toBeNull();
    (document.activeElement as HTMLElement | null)?.blur();
    await walk(["Hide detail", "Confirm", "Edit", "Regenerate", "Skip"]);
  },
};

/**
 * `expanded` / `onExpandedChange` is a real controlled pair, and this shell
 * holds it the hard way: the host records what the card asked for and applies
 * it only when told to.
 *
 * The reason it is worth controlling at all is the component's second rule —
 * detail is never auto-expanded. A host that persists "this reviewer always
 * opens the detail", or that collapses every card in a queue when one is
 * confirmed, needs the fold to be its state rather than the card's.
 *
 * What the play function proves, in order: clicking Show detail does not
 * render the detail; `aria-expanded` follows the **prop** rather than the
 * click, so the control does not announce a state the card is not in; the
 * callback still fires with the boolean a host needs to apply; a re-render
 * with an unchanged `expanded` leaves the fold shut; and applying the request
 * opens it.
 *
 * The `aria-expanded` step is the one most likely to regress. `isExpanded =
 * expanded ?? uncontrolledExpanded` is what keeps the attribute honest, and a
 * refactor that optimistically flips internal state before the host answers
 * would leave a screen reader told the detail is open while the DOM holds no
 * detail at all.
 */
export const Controlled: Story = {
  render: () => <ControlledShell />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const detailIsOpen = () => canvasElement.querySelector('[data-slot="approval-card-detail"]') !== null;

    await expect(detailIsOpen()).toBe(false);

    // 1. Interaction alone does not move the rendered value…
    const toggle = canvas.getByRole("button", { name: "Show detail" });
    await userEvent.click(toggle);
    await expect(detailIsOpen()).toBe(false);

    // 2. …and the control does not claim otherwise.
    await expect(canvas.getByRole("button", { name: "Show detail" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );

    // 3. The callback fired, with the boolean the host has to apply.
    await expect(canvas.getByTestId("requested")).toHaveTextContent("true");

    // 4. Re-render with an unchanged `expanded`. Prove the re-render first.
    await expect(canvas.getByTestId("render-pass")).toHaveTextContent("1");
    await userEvent.click(canvas.getByRole("button", { name: "Re-render" }));
    await expect(canvas.getByTestId("render-pass")).toHaveTextContent("2");
    await expect(detailIsOpen()).toBe(false);

    // 5. The payload was sufficient to apply the change.
    await userEvent.click(canvas.getByRole("button", { name: "Apply" }));
    await waitFor(() => expect(detailIsOpen()).toBe(true));
    await expect(canvas.getByRole("button", { name: "Hide detail" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  },
};

function ControlledShell() {
  const [applied, setApplied] = React.useState(false);
  const [requested, setRequested] = React.useState<boolean | null>(null);
  const [pass, setPass] = React.useState(1);

  return (
    <div className="flex w-full flex-col gap-4">
      <ApprovalCard
        title="Send the Q3 summary to the team"
        summary="Three paragraphs drafted from last quarter's metrics, ready to post in #general."
        detail={DETAIL}
        expanded={applied}
        onExpandedChange={setRequested}
        onConfirm={() => {}}
        onEdit={() => {}}
        onRegenerate={() => {}}
        onSkip={() => {}}
      />

      <div className="flex flex-col gap-3">
        <dl className="text-foreground grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs">
          <dt>expanded prop</dt>
          <dd data-testid="applied">{String(applied)}</dd>
          <dt>last onExpandedChange</dt>
          <dd data-testid="requested">{requested === null ? "—" : String(requested)}</dd>
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
            onClick={() => requested !== null && setApplied(requested)}
          >
            Apply
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Every optional slot emptied, one card at a time. None of them is a label
 * prop — the component hard-codes every accessible name it owns, from the
 * `VERBS` array through "Show detail" to "Undo" — so the usual icon-only
 * failure cannot happen here. What empties instead is the *content*, and each
 * of the three cases below loses something different.
 *
 * 1. **No `summary`, no `detail`.** The expand toggle is not disabled or
 *    empty, it is absent: the whole `CardContent` is conditional on `detail`.
 *    A card in this shape asks for a decision on a title alone, which is the
 *    thing this component was built to prevent — worth seeing rendered, since
 *    nothing in the API stops a caller reaching it.
 * 2. **No handlers at all.** The button group renders as an empty
 *    `role="group"` still labelled "Approval actions": a named region
 *    promising four verbs and containing none. The docs module calls this out
 *    as usually meaning the callbacks were forgotten; here it is measured at
 *    zero buttons.
 * 3. **An empty `title`.** The card keeps its shape and loses its identity.
 *    Nothing here is named by the title — it is a `div`, not a heading, and
 *    the only thing announced is the generic `role="status"` line, which reads
 *    "Awaiting your decision" for every card on screen. So an empty title
 *    makes a card anonymous rather than untitled, which is the sharper end of
 *    the "several cards are indistinguishable" note in the docs module.
 */
export const EmptyLabel: Story = {
  render: () => (
    <div className="flex w-full flex-col gap-4">
      <section data-testid="title-only">
        <ApprovalCard
          title="Send the Q3 summary to the team"
          onConfirm={() => {}}
          onEdit={() => {}}
          onRegenerate={() => {}}
          onSkip={() => {}}
        />
      </section>
      <section data-testid="no-handlers">
        <ApprovalCard
          title="Send the Q3 summary to the team"
          summary="No handlers were supplied, so no verb has anything to call."
        />
      </section>
      <section data-testid="no-title">
        <ApprovalCard title="" summary="" onConfirm={() => {}} onSkip={() => {}} />
      </section>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // 1. No detail, so no toggle at all — and the verbs are still named
    //    without it, because their names come from the fixed VERBS array.
    const titleOnly = within(canvas.getByTestId("title-only"));
    await expect(titleOnly.queryByRole("button", { name: /detail/i })).toBeNull();
    for (const name of ["Confirm", "Edit", "Regenerate", "Skip"]) {
      titleOnly.getByRole("button", { name });
    }

    // 2. A labelled group with nothing in it.
    const emptyGroup = within(canvas.getByTestId("no-handlers")).getByRole("group", {
      name: "Approval actions",
    });
    await expect(emptyGroup.querySelectorAll("button")).toHaveLength(0);

    // 3. An empty title leaves the status line as the card's only voice, and
    //    it says the same sentence every other pending card says.
    const untitled = canvas.getByTestId("no-title");
    await expect(untitled.querySelector('[data-slot="approval-card-title"]')!.textContent).toBe("");
    await expect(untitled.querySelector('[data-slot="approval-card-status"]')!.textContent).toBe(
      "Awaiting your decision",
    );
  },
};

/**
 * Roughly 90 characters in the title and again in the summary, which is where
 * the spec's word "truncated" turns out to mean something narrower than it
 * reads.
 *
 * **Nothing in this card truncates a string.** The title wraps, the summary
 * wraps, the detail wraps; there is no `truncate`, no `line-clamp` and no
 * ellipsis anywhere in the source. "Truncated detail with an explicit expand"
 * describes a *block* that is withheld, not text that is cut — and the
 * distinction is load-bearing, because a clipped string would be readable to a
 * screen reader while looking short to everyone else, which is the failure
 * mode the component's own comment rejects.
 *
 * The cost of that choice is visible here: a long title has no fold of its
 * own, so it grows the card before the reader has agreed to read anything. If
 * a title needs two lines it is probably a summary, and the summary slot is
 * the one with somewhere for it to go.
 *
 * The verb row is the exception and does not reflow at all — the vendored
 * `Button` is `whitespace-nowrap shrink-0` inside a `w-fit` group, so long
 * content pushes the card taller and never narrower.
 */
export const LongContent: Story = {
  args: {
    title: "Post the Q3 revenue summary to #general and pin it for the leadership review",
    summary:
      "Three paragraphs drafted from last quarter's metrics, including the support-volume figure flagged on Tuesday.",
    detail: DETAIL,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const card = canvasElement.querySelector<HTMLElement>('[data-slot="approval-card"]')!;
    const title = canvasElement.querySelector<HTMLElement>('[data-slot="approval-card-title"]')!;
    const summary = canvasElement.querySelector<HTMLElement>('[data-slot="approval-card-summary"]')!;

    // 1. Both wrap rather than truncating: more than one line, no ellipsis.
    for (const el of [title, summary]) {
      const style = getComputedStyle(el);
      await expect(style.textOverflow).toBe("clip");
      await expect(style.whiteSpace).toBe("normal");
      const lineHeight = Number.parseFloat(style.lineHeight);
      await expect(el.getBoundingClientRect().height).toBeGreaterThan(lineHeight * 1.5);
    }

    // 2. The card grows to hold them. `Card` is `overflow-hidden`, so anything
    //    it could not grow for would be clipped silently rather than scrolled.
    await expect(card.scrollHeight).toBe(card.clientHeight);

    // 3. Expanding adds a third block of wrapped prose, still with no scroll.
    await userEvent.click(canvas.getByRole("button", { name: "Show detail" }));
    const detail = canvasElement.querySelector<HTMLElement>('[data-slot="approval-card-detail"]')!;
    await expect(getComputedStyle(detail).whiteSpace).toBe("normal");
    await expect(card.scrollHeight).toBe(card.clientHeight);
  },
};

/**
 * 375px, with all four verbs and the detail fold — the widest arrangement the
 * component can be asked for.
 *
 * The row fits, and the margin is thinner than it looks. Measured here: the
 * card is 375px, `--card-spacing` takes 16px from either side, and the four
 * buttons — Confirm 89px, Edit 63px, Regenerate 109px, Skip 66px — come to
 * 326px of the 343px available. **17px spare, against a 63px shortest verb.**
 *
 * So "four verbs, always in the same order" is load-bearing on a phone for a
 * reason beyond muscle memory: there is no room for a fifth, and the component
 * would have no way to tell you so.
 *
 * **What would happen if it did not fit is the fact worth having.** `Card` is
 * `overflow-hidden` and the vendored `Button` is `whitespace-nowrap shrink-0`
 * inside a `w-fit` group, so an over-wide verb row does not scroll and does
 * not wrap — it is *clipped*, with no scrollbar and no affordance. On an
 * approval surface that means a terminal verb can silently leave the screen,
 * so the assertion below measures the group's right edge against the card's
 * rather than only checking that the page does not scroll sideways.
 * Localisation is the realistic way to reach it, and it does not take an
 * unusual language: German alone turns Confirm into "Bestätigen", Regenerate
 * into "Regenerieren" and Skip into "Überspringen", which is well past 17px
 * of slack before anything else changes.
 */
export const Mobile: Story = {
  render: (args) => (
    <div className="w-[375px] max-w-full" data-testid="viewport">
      <ApprovalCard {...args} state="pending" detail={DETAIL} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const viewport = canvas.getByTestId("viewport");
    const card = canvasElement.querySelector<HTMLElement>('[data-slot="approval-card"]')!;
    const verbs = canvas.getByRole("group", { name: "Approval actions" });

    // No horizontal scroll at 375px…
    await expect(viewport.scrollWidth).toBeLessThanOrEqual(viewport.clientWidth);

    // …and, more usefully, nothing is clipped by the card's overflow-hidden:
    // all four verbs sit inside its box, Skip included.
    await expect(verbs.getBoundingClientRect().right).toBeLessThanOrEqual(card.getBoundingClientRect().right);
    await expect(verbs.querySelectorAll("button")).toHaveLength(4);

    // Opening the fold changes the height and nothing else.
    await userEvent.click(canvas.getByRole("button", { name: "Show detail" }));
    await expect(canvasElement.querySelector('[data-slot="approval-card-detail"]')).not.toBeNull();
    await expect(viewport.scrollWidth).toBeLessThanOrEqual(viewport.clientWidth);
  },
};

/**
 * Against K1 `ai-doc-block`, the near-twin most likely to be rebuilt by
 * accident. Both hold a generated artifact behind four verbs in a fixed order,
 * both keep the verbs on screen while a request is in flight, and from a
 * screenshot they are the same idea.
 *
 * `CONTINUE.md` §8 records why K1 could not simply compose this component:
 * F7's root **is** a `Card` carrying its own title, summary and undo model, so
 * nesting it inside a document block would invert the relationship — the block
 * is the thing being approved, not a payload inside an approval surface — and
 * double the frame. K1 copied the *rule* (a fixed verb array the component
 * owns) rather than the component, which is the sanctioned form of that
 * decision and also the reason this boundary needs writing down.
 *
 * The choosing rule:
 *
 * - **F7 `approval-card`** when the artifact is *elsewhere*. Edit and
 *   Regenerate hand you back to it, which only makes sense if there is
 *   somewhere to be handed back to. It owns the card, the summary you decide
 *   on and the Undo window.
 * - **K1 `ai-doc-block`** when the artifact is *right there*, inline in a
 *   document. Its verbs are Keep · Edit · Regenerate · Discard and Edit opens
 *   the prose in place rather than sending you away, so it needs no summary
 *   and no fold.
 * - **N8 `permission-prompt`** when the decision is about a side effect rather
 *   than an artifact, and cannot wait. It is an alert dialog, so it interrupts
 *   — which is exactly why it cannot be shown beside these two, and why the
 *   test is whether the work can continue while the question stands. If it
 *   can, this card is the right shape.
 */
export const Boundary: Story = {
  render: () => (
    <div className="flex w-full max-w-2xl flex-col gap-6">
      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">
          F7 approval card — the artifact is elsewhere; Edit and Regenerate hand you back to it
        </p>
        <ApprovalCard
          title="Send the Q3 summary to the team"
          summary="Three paragraphs drafted from last quarter's metrics, ready to post in #general."
          detail={DETAIL}
          onConfirm={() => {}}
          onEdit={() => {}}
          onRegenerate={() => {}}
          onSkip={() => {}}
        />
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">
          K1 ai doc block — the artifact is inline; Edit opens it in place
        </p>
        <AiDocBlock
          label="AI generated"
          onKeep={() => {}}
          onEdit={() => {}}
          onRegenerate={() => {}}
          onDiscard={() => {}}
        >
          <p>
            Revenue grew 14% quarter over quarter, driven mostly by the self-serve tier. Churn held flat at
            2.1%.
          </p>
        </AiDocBlock>
      </section>
    </div>
  ),
};
