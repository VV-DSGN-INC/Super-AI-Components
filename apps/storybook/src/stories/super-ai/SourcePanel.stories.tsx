import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { Button } from "@/components/ui/button";
import { GenerationQueue } from "@/registry/super-ai/generation-queue";
import { SourceCards } from "@/registry/super-ai/source-cards";
import { SourcePanel } from "@/registry/super-ai/source-panel";
import { SourcePanelDocs } from "@/content/components/source-panel.docs";
import { componentDocsPage } from "@/lib/component-docs-page";
import { focusTreatmentSignature, settledFocusRing } from "@/lib/focus-ring";

const meta: Meta<typeof SourcePanel> = {
  title: "Super AI/Source Panel",
  component: SourcePanel,
  parameters: { layout: "centered", docs: { page: componentDocsPage(SourcePanelDocs) } },
};

export default meta;
type Story = StoryObj<typeof SourcePanel>;

/**
 * Two sources still being read and one already citable — the shape of a panel
 * seconds after a drop. `parsing` is where every source starts, so it is the
 * only state a caller creates directly; the rest are reached by updating
 * `stage`. Notice that the finished row keeps its chunk count while its
 * neighbours are still moving: the list never blanks out to show progress, and
 * a source that is already usable stays usable.
 */
export const Parsing: Story = {
  args: {
    heading: "Sources",
    sources: [
      { id: "1", name: "Q3-report.pdf", meta: "PDF · 2.4 MB", stage: "parsing" },
      { id: "2", name: "annual-review-2024.pdf", meta: "PDF · 18 MB", stage: "parsing" },
      { id: "3", name: "pricing-policy.docx", meta: "Word · 310 KB", stage: "ready", chunkCount: 96 },
    ],
  },
};

/**
 * Stage two, and the reason the pipeline is spelled out rather than collapsed
 * into "Processing": chunking is where a PDF with no text layer or a transcript
 * with no speaker turns produces something unusable without ever erroring. Both
 * in-flight rows read "Chunking" and "Step 2 of 3" in the same two places every
 * other state uses, so the wait is diagnosable while it is still a wait.
 */
export const Chunking: Story = {
  args: {
    heading: "Sources",
    sources: [
      { id: "1", name: "Q3-report.pdf", meta: "PDF · 2.4 MB", stage: "chunking" },
      { id: "2", name: "kickoff-call.vtt", meta: "Transcript · 48 min", stage: "chunking" },
      { id: "3", name: "pricing-policy.docx", meta: "Word · 310 KB", stage: "ready", chunkCount: 96 },
    ],
  },
};

/**
 * The last stage before a source can be cited, and the slowest — embedding is
 * the one that bills, rate-limits and times out. It renders identically to the
 * two before it apart from its name, its icon shape and its step number, which
 * is the point: nothing about the chrome tells you a stage is expensive, only
 * the word does.
 */
export const Embedding: Story = {
  args: {
    heading: "Sources",
    sources: [
      { id: "1", name: "Q3-report.pdf", meta: "PDF · 2.4 MB", stage: "embedding" },
      { id: "2", name: "competitor-teardown.md", meta: "Markdown · 61 KB", stage: "embedding" },
      { id: "3", name: "pricing-policy.docx", meta: "Word · 310 KB", stage: "ready", chunkCount: 96 },
    ],
  },
};

/**
 * The terminal state worth reaching, and the only one carrying numbers. A ready
 * row drops its bar and gains `stat-readout`, so the count that decides how
 * well a source retrieves sits on the surface instead of behind a detail view.
 * The 1,284-versus-96 spread is the fact this state exists to expose: two
 * sources that both say "Ready" are not equally useful, and nothing else on the
 * row would tell you.
 */
export const Ready: Story = {
  args: {
    heading: "Sources",
    sources: [
      { id: "1", name: "Q3-report.pdf", meta: "PDF · 2.4 MB", stage: "ready", chunkCount: 1284 },
      {
        id: "2",
        name: "pricing-policy.docx",
        meta: "Word · 310 KB",
        stage: "ready",
        chunkCount: 96,
        stats: [{ label: "Indexed", value: "2 days ago" }],
      },
      { id: "3", name: "kickoff-call.vtt", meta: "Transcript · 48 min", stage: "ready", chunkCount: 412 },
    ],
  },
};

/**
 * Two sources dead at different stages, beside one that survived. This is the
 * state the whole component is arranged around: the error replaces `meta` as
 * the row's second line rather than hiding in a tooltip, Retry sits inside the
 * row it belongs to, and the two failures are visibly unrelated — a scanned PDF
 * and a timed-out embed need different responses from whoever is reading this.
 * A panel-level retry would have re-ingested the healthy row too.
 */
export const Failed: Story = {
  args: {
    heading: "Sources",
    sources: [
      { id: "1", name: "Q3-report.pdf", meta: "PDF · 2.4 MB", stage: "ready", chunkCount: 1284 },
      {
        id: "2",
        name: "annual-review-2024.pdf",
        meta: "PDF · 18 MB",
        stage: "failed",
        errorMessage: "Parse failed — the file is a scan with no text layer",
      },
      {
        id: "3",
        name: "kickoff-call.vtt",
        meta: "Transcript · 48 min",
        stage: "failed",
        errorMessage: "Embedding request timed out",
      },
    ],
    onRetrySource: () => {},
  },
};

/**
 * No sources at all, which for a retrieval surface is a broken promise rather
 * than a blank slate — an assistant grounded in nothing. The panel hands this
 * to L1 `empty-state` at `size="panel"` instead of writing its own paragraph,
 * and the default copy names the three stages ahead so the first upload is not
 * a surprise. `emptyAction` is left caller-supplied on purpose: the verb for
 * adding a source belongs to the surface this panel sits in.
 */
export const Empty: Story = {
  args: {
    heading: "Sources",
    sources: [],
  },
};

/* -------------------------------------------------------------------------
 * Case stories — the situations this panel meets in a product, as opposed to
 * the prop combinations above. See docs/design-system/story-conventions.md.
 *
 * Seven of the eight are written. Not written for this component,
 * deliberately:
 *
 * // case-skip: Controlled — `sources` is inbound render data; `onRetrySource(id)` reports an intent and carries no value
 * `grep -nE "useState|useReducer|useRef" source-panel.tsx` returns nothing:
 * the component holds no state at all and is a pure function of `sources`.
 * There is no `value`/`onChange` pair or equivalent, and nothing a user picks
 * — the only callback is `onRetrySource`, which fires with a source id so a
 * host can re-enter that one row into the pipeline. That is the
 * `onSelect`/`onRemove` shape the D/I wave skipped six times, not a controlled
 * value. The counter-argument was considered and rejected on the grounds F6
 * `render-queue` rejected it: yes, clicking Retry leaves the row on `failed`
 * until the host re-renders `sources`, so all three of the convention's
 * assertions would pass — but they degenerate to "this component is a pure
 * function of its props", which is true of most of the registry and is not the
 * contract `Controlled` exists to pin. E6 `generation-queue`, this panel's
 * nearest twin, skips it on the identical reasoning.
 * ---------------------------------------------------------------------- */

/**
 * Right-to-left, and this panel mirrors cleanly — worth a story precisely
 * because so many of its neighbours do not.
 *
 * **What was wrong and is fixed in-wave.** The header's action wrapper carried
 * `ml-auto`, a physical margin. With a heading present, `justify-between`
 * already separates the pair, so the bug only surfaced on an action-only
 * header — where `margin-left: auto` under RTL pushes the control to the
 * *right*, the inline **start**, back on top of where a heading would sit.
 * Swapped to `ms-auto`, byte-identical in LTR (`margin-inline-start` resolves
 * to `margin-left`), and the second panel below is the action-only case that
 * proves it. Measured both ways in a 420px shell: with `ml-auto` the button
 * sat **343px** from the header's left edge, jammed against the inline start;
 * with `ms-auto` it sits at **0px**, the inline end. Asserted rather than
 * described, so the swap cannot silently regress — H3 `track-lane`'s pattern.
 *
 * **What mirrors on its own.** `entity-row` is a logical flex row, so the stage
 * icon moves to the right and the badge/Retry cluster to the left; the step
 * counter and its bar swap the same way. And the indeterminate fill cannot get
 * its direction wrong, because there is no direction in it: the call-site
 * override paints the indicator `w-full`, so it covers the track edge to edge
 * in either writing mode. A determinate bar is where a physical fill would
 * show, and this component never renders one.
 *
 * **What is not asserted, and why.** File names, sizes and error strings here
 * are Latin runs joined by neutrals (`·`, `—`), which take their direction from
 * the strong characters around them, so "Parse failed — the file is a scan…"
 * stays one left-to-right run inside a right-aligned row; measured below on the
 * text node, since DOM order cannot show a bidi reordering. A source named in
 * Hebrew beside one named in English is the case this panel has no answer for:
 * there is no per-row `lang`/`dir`, so every row takes the shell's direction —
 * H4 `transcript-editor`'s finding in a milder form. An API decision, recorded.
 */
export const RTL: Story = {
  render: (args) => (
    <div dir="rtl" className="flex w-[420px] flex-col gap-6">
      <SourcePanel {...args} />
      <SourcePanel
        data-testid="action-only"
        action={
          <Button size="sm" variant="outline">
            إضافة مصدر
          </Button>
        }
        sources={[{ id: "a", name: "Q3-report.pdf", meta: "PDF · 2.4 MB", stage: "ready", chunkCount: 96 }]}
      />
    </div>
  ),
  args: {
    heading: "المصادر",
    sources: [
      { id: "1", name: "Q3-report.pdf", meta: "PDF · 2.4 MB", stage: "chunking" },
      {
        id: "2",
        name: "annual-review-2024.pdf",
        meta: "PDF · 18 MB",
        stage: "failed",
        errorMessage: "Parse failed — the file is a scan with no text layer",
      },
    ],
    onRetrySource: () => {},
  },
  play: async ({ canvasElement }) => {
    const r = (el: Element) => el.getBoundingClientRect();

    // 1. The swap. On an action-only header there is no `justify-between` gap
    //    to hide behind, so the auto margin alone decides the side: `ms-auto`
    //    puts the control at the inline end, which under RTL is the left edge.
    const actionOnly = canvasElement.querySelector('[data-testid="action-only"]')!;
    const header = actionOnly.querySelector('[data-slot="source-panel-header"]')!;
    const actionButton = header.querySelector("button")!;
    await expect(`action at inline end: ${Math.round(r(actionButton).left - r(header).left)}px`).toBe(
      "action at inline end: 0px",
    );

    // 2. The row mirrors: stage icon on the right, badge + Retry on the left.
    const failedRow = canvasElement.querySelector('[data-stage="failed"]')!;
    const icon = failedRow.querySelector('[data-slot="entity-row-icon"]')!;
    const trailing = failedRow.querySelector('[data-slot="entity-row-trailing"]')!;
    await expect(`trailing left of icon: ${r(trailing).right < r(icon).left}`).toBe(
      "trailing left of icon: true",
    );

    // 3. The bar row mirrors too — the step counter is `shrink-0` after a
    //    `flex-1` bar, so it lands on the left.
    const barRow = canvasElement.querySelector('[data-slot="source-panel-item-progress"]')!;
    const track = barRow.querySelector('[data-slot="progress-track"]')!;
    const step = barRow.lastElementChild!;
    await expect(`step counter left of track: ${r(step).right <= r(track).left}`).toBe(
      "step counter left of track: true",
    );

    // 4. The indeterminate fill covers the whole track, so there is no physical
    //    fill edge to mirror wrongly.
    const fill = barRow.querySelector('[data-slot="progress-indicator"]')!;
    await expect(Math.round(r(fill).width)).toBe(Math.round(r(track).width));

    // 5. No bidi scramble inside a Latin error string in an RTL row.
    const description = failedRow.querySelector('[data-slot="entity-row-description"]')!;
    const text = description.firstChild as Text;
    const range = document.createRange();
    range.setStart(text, 0);
    range.setEnd(text, 5);
    const head = range.getBoundingClientRect();
    range.setStart(text, text.length - 5);
    range.setEnd(text, text.length);
    const tail = range.getBoundingClientRect();
    await expect(`error reads left to right: ${head.left < tail.left}`).toBe(
      "error reads left to right: true",
    );
  },
};

/**
 * `prefers-reduced-motion`, and the state that decides whether this panel's
 * central claim survives its own animation being switched off.
 *
 * **The branch, added in-wave.** The indeterminate bar is painted by a
 * call-site override — the vendored `Progress` appends its own
 * Track/Indicator and hands out no className for either, so an arbitrary
 * descendant variant is the only way to reach the indicator. It carried
 * `animate-pulse` with no reduced-motion counterpart, the plain `animate-*`
 * shape spec §3.4 sanctions repairing, and the variant is now restated as
 * `[&_[data-slot=progress-indicator]]:motion-reduce:animate-none`. Asserted by
 * reading `animationName` back off the indicator rather than by trusting the
 * class: the arbitrary variant and the `motion-reduce` one compile to the same
 * specificity and the tie falls to source order — the mechanism
 * `shortcuts-sheet` measured on Base UI popups, reached here from a different
 * direction. Measured both ways under emulated reduce, so the assertion is not
 * one of the vacuous ones H1 `transport-controls` found: without the class,
 * `animationName` reads **`"pulse"`**; with it, **`"none"`**. Source order goes
 * the right way here, unlike on a Base UI popup, but only the read-back proves
 * that. Note the class sits on the Progress *root* — an arbitrary descendant
 * variant is a selector, so the indicator itself carries nothing but the
 * vendored `h-full bg-primary transition-all`, and a class check aimed at the
 * indicator finds nothing and looks like a missing fix.
 *
 * **The question this component was steered at: is motion the only signal?**
 * No, and the answer is structural rather than lucky. E4 `preset-grid`'s
 * loading and failed tiles became indistinguishable once their pulse stopped,
 * because both painted `bg-muted` and neither carried text. Here all five
 * states render their name as visible text in the same trailing badge, with a
 * distinct icon shape beside it, and each in-flight row adds "Step N of 3".
 * Suppressing the pulse removes decoration from a row that was already legible
 * without it — the component's own stated contract, that the bar is decoration
 * on top of the text and never a substitute. The play asserts the five badge
 * names are five distinct strings with the animation off, so H7 `stem-mixer`'s
 * counter-case holds here rather than `preset-grid`'s collapse.
 *
 * **What the suppression costs, recorded and not asserted.** With the pulse
 * off, the indicator is a static `w-full bg-primary` bar — measured at the
 * track's full width, so a solid 100% fill sits under a row that says "Step 1
 * of 3". A reduced-motion user gets a bar that reads as *complete* on a source
 * that has barely started. The honest fix is a different resting appearance for
 * an indeterminate bar (a partial width, or no fill at all), which is a design
 * decision rather than a one-class repair, so it stays recorded and the play
 * deliberately does not assert the full-width fill — pinning it would make the
 * repair fail this story. The stage text is what keeps the row correct in the
 * meantime, which is exactly the dependency worth naming.
 *
 * **Not patched from here.** `components/ui/progress.tsx` gives the indicator
 * `transition-all` with no reduced-motion branch — one decision for its eight
 * consumers, and unreachable from a call site for the same reason the pulse
 * needed an arbitrary variant. F6 `render-queue` also measured that the vitest
 * browser run injects an unlayered `transition-property: none` over everything,
 * so a transition assertion in this gate passes with or without the class. The
 * animation assertion below is a real one.
 */
export const ReducedMotion: Story = {
  args: {
    heading: "Sources",
    sources: [
      { id: "1", name: "Q3-report.pdf", meta: "PDF · 2.4 MB", stage: "parsing" },
      { id: "2", name: "kickoff-call.vtt", meta: "Transcript · 48 min", stage: "chunking" },
      { id: "3", name: "competitor-teardown.md", meta: "Markdown · 61 KB", stage: "embedding" },
      { id: "4", name: "pricing-policy.docx", meta: "Word · 310 KB", stage: "ready", chunkCount: 96 },
      {
        id: "5",
        name: "annual-review-2024.pdf",
        meta: "PDF · 18 MB",
        stage: "failed",
        errorMessage: "Parse failed — the file is a scan with no text layer",
      },
    ],
    onRetrySource: () => {},
  },
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector('[data-slot="source-panel"]') as HTMLElement;

    // The branch, not merely its absence: the pulse class is still on the
    // element, and reduce is what stops it.
    // The branch, not merely its absence. The class lives on the Progress
    // *root* — an arbitrary descendant variant is a selector, so the indicator
    // itself carries only the vendored `h-full bg-primary transition-all`.
    const indicators = Array.from(root.querySelectorAll('[data-slot="progress-indicator"]'));
    await expect(indicators).toHaveLength(3);
    for (const indicator of indicators) {
      const bar = indicator.closest('[data-slot="progress"]')!;
      await expect(bar.getAttribute("class")).toContain(
        "[&_[data-slot=progress-indicator]]:animate-pulse",
      );
      await expect(getComputedStyle(indicator).animationName).toBe("none");
    }

    // With the motion gone the stage is carried by text alone — five states,
    // five distinct words, in the same slot on every row.
    const badges = Array.from(root.querySelectorAll('[data-slot="source-panel-stage"]'));
    const names = badges.map((b) => b.textContent);
    await expect(names).toEqual(["Parsing", "Chunking", "Embedding", "Ready", "Failed"]);
    await expect(new Set(names).size).toBe(5);

    // …and each in-flight row still says where in the pipeline it is.
    const steps = Array.from(
      root.querySelectorAll('[data-slot="source-panel-item-progress"] > span'),
    ).map((s) => s.textContent);
    await expect(steps).toEqual(["Step 1 of 3", "Step 2 of 3", "Step 3 of 3"]);
  },
};

/**
 * The tab sequence, which for this panel is the shortest interesting one in the
 * registry: **the rows contribute nothing.** `entity-row` is rendered without
 * `onSelect`, so every row is a plain `<div>`; the progress bar is an indicator
 * and takes no focus; the stage is a `<span>`. The only stops the panel creates
 * are the caller's header action and one Retry per failed row — so the stop
 * count is a function of the data rather than of the layout, and a panel of
 * five parsing sources has exactly one stop, or none.
 *
 * What the play pins is the naming contract that has failed five times
 * elsewhere in this registry (`property-inspector`'s resets, `context-chips`'
 * empty label, `result-card`'s per-cell checkboxes, `render-queue`'s cancels,
 * `frame-strip`'s landmarks): each Retry is named from its own row's source, so
 * two failed rows offer two distinct destinations rather than two buttons
 * called "Retry". It holds here — J1 `asset-library` is the other positive —
 * and `EmptyLabel` below shows the one input that breaks it.
 *
 * Focus visibility is checked **both** ways at every stop, per the convention's
 * mechanical fact 5, because the two answer different questions:
 * `settledFocusRing` asks whether anything is painted (and waits, because the
 * vendored `Button` fades its ring in over ~250ms), and the differential
 * against a resting signature asks whether focus is what painted it. Both pass
 * on all three stops, which are all vendored `Button`s — the primitive that
 * behaves.
 *
 * **Recorded, not pinned:** a *successful* retry unmounts the button that was
 * just pressed. The row leaves `failed`, its Retry disappears, and focus drops
 * to `<body>` so the next Tab restarts from the top of the page. The docs
 * module already carries it, it is the shape E6 `generation-queue` and F6
 * `render-queue` both record, and it is behavioural — so the play stops at the
 * walk rather than asserting the loss.
 */
export const KeyboardOrder: Story = {
  args: {
    heading: "Sources",
    action: (
      <Button size="sm" variant="outline">
        Add source
      </Button>
    ),
    sources: [
      { id: "1", name: "Q3-report.pdf", meta: "PDF · 2.4 MB", stage: "parsing" },
      {
        id: "2",
        name: "annual-review-2024.pdf",
        meta: "PDF · 18 MB",
        stage: "failed",
        errorMessage: "Parse failed — the file is a scan with no text layer",
      },
      { id: "3", name: "pricing-policy.docx", meta: "Word · 310 KB", stage: "ready", chunkCount: 96 },
      {
        id: "4",
        name: "kickoff-call.vtt",
        meta: "Transcript · 48 min",
        stage: "failed",
        errorMessage: "Embedding request timed out",
      },
    ],
    onRetrySource: () => {},
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector('[data-slot="source-panel"]') as HTMLElement;

    // 1. Four rows, none of them a control: every `entity-row` is a div, so a
    //    row cannot be reached or activated from the keyboard at all.
    const rows = Array.from(root.querySelectorAll('[data-slot="entity-row"]'));
    await expect(rows).toHaveLength(4);
    await expect(rows.map((row) => row.tagName)).toEqual(["DIV", "DIV", "DIV", "DIV"]);

    // 2. The bar is an indicator, not a control.
    const bar = root.querySelector('[role="progressbar"]')!;
    await expect(bar.hasAttribute("tabindex")).toBe(false);

    // 3. Every stop the panel offers, in document order, each named after its
    //    own source. Base UI leaves tabindex on natively-disabled buttons, so
    //    query for buttons that are not disabled rather than by tabindex.
    const stops = Array.from(root.querySelectorAll<HTMLElement>("button:not(:disabled)"));
    const name = (el: Element | null) =>
      el ? (el.getAttribute("aria-label") ?? el.textContent ?? "") : "none";
    await expect(stops.map(name)).toEqual([
      "Add source",
      "Retry annual-review-2024.pdf",
      "Retry kickoff-call.vtt",
    ]);
    await expect(new Set(stops.map(name)).size).toBe(3);

    // 4. Walk the lap. Each press is provably one move — wait for focus to
    //    leave the previous stop before reading, never for it to arrive.
    (document.activeElement as HTMLElement | null)?.blur?.();
    const resting = stops.map((s) => focusTreatmentSignature(s));
    for (const [i, stop] of stops.entries()) {
      const previous = document.activeElement;
      await userEvent.tab();
      await waitFor(() => expect(document.activeElement).not.toBe(previous));
      await expect(name(document.activeElement)).toBe(name(stop));
      await expect(`${i} focusVisible=${stop.matches(":focus-visible")}`).toBe(`${i} focusVisible=true`);
      // Both halves: something is painted, *and* focus is what painted it.
      await settledFocusRing(stop, waitFor);
      await expect(`${name(stop)} caused=${focusTreatmentSignature(stop) !== resting[i]}`).toBe(
        `${name(stop)} caused=true`,
      );
    }

    // 5. One more tab leaves the panel — no trap, no wrap.
    const last = document.activeElement;
    await userEvent.tab();
    await waitFor(() => expect(document.activeElement).not.toBe(last));
    await expect(root.contains(document.activeElement)).toBe(false);

    // 6. Retry activates from the keyboard, and is the only thing here that
    //    does. Pressing it moves nothing on screen: the host owns `stage`.
    const retry = canvas.getByRole("button", { name: "Retry kickoff-call.vtt" });
    retry.focus();
    await userEvent.keyboard("{Enter}");
    await expect(canvas.getByRole("button", { name: "Retry kickoff-call.vtt" })).toBe(retry);
  },
};

/**
 * Every optional text slot emptied at once, which is what an unaudited panel
 * fed from a real ingestion queue looks like — and the component renders it
 * without a single axe failure, which is the finding rather than the relief.
 *
 * - **`heading` and `action` both absent removes the header entirely.** The
 *   panel becomes a bare list with no label of its own. That follows from the
 *   API, and the docs module already says the heading is a `<p>` and invisible
 *   to heading navigation either way — but it means a page carrying two of
 *   these has two unlabelled lists and no way to tell them apart.
 * - **`meta` absent leaves the row one line.** `entity-row`'s `min-h-14` holds
 *   the height at 56px, so a mixed list does not go ragged; the composed
 *   guarantee working as intended, asserted below.
 * - **A failed row with no `errorMessage` falls back to `meta`.** The row says
 *   "Failed" and then, as its second line, the file size. The reason is gone
 *   and the offer to retry remains — F6 `render-queue`'s shape exactly.
 * - **`retryText=""` leaves an icon-only button** and it stays named, because
 *   the name comes from `retryLabel` rather than from the label text. The tap
 *   target shrinks to the icon plus the button's own padding and stays over
 *   WCAG 2.2's 24×24, unlike I5 `drawing-tools`' chevron. Asserted.
 * - **`name: ""` is the one that actually breaks something, and no gate sees
 *   it.** The retry label defaults to `` `Retry ${source.name}` ``, so an empty
 *   name yields the bare string `"Retry "` on every such row — and the
 *   accessible-name computation trims it to "Retry", which is non-empty, so
 *   `button-name` passes and two indistinguishable buttons ship. The same
 *   substitution names the progress bar `": Parsing"`, which is precisely the
 *   guarantee the component's own source comment claims to provide: "a panel of
 *   four in-flight sources is not four identical 'Loading' bars". That
 *   guarantee is conditional on `name`, and nothing enforces the condition.
 *   Asserted below as the measurement it is, never as the contract — the fix is
 *   an API decision (fall back to the id, or refuse an empty name), and this is
 *   the ninth member of the registry's empty-string class.
 */
export const EmptyLabel: Story = {
  render: (args) => (
    <div className="w-[420px]">
      <SourcePanel {...args} />
    </div>
  ),
  args: {
    retryText: "",
    sources: [
      { id: "1", name: "Q3-report.pdf", stage: "ready", chunkCount: 96 },
      { id: "2", name: "", stage: "parsing" },
      { id: "3", name: "", stage: "failed" },
      { id: "4", name: "kickoff-call.vtt", meta: "Transcript · 48 min", stage: "failed" },
    ],
    onRetrySource: () => {},
  },
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector('[data-slot="source-panel"]') as HTMLElement;

    // No heading and no action, so the header element is never rendered.
    await expect(root.querySelector('[data-slot="source-panel-header"]')).toBeNull();

    // A row with no `meta` renders no description slot and keeps its height.
    const ready = root.querySelector('[data-stage="ready"]')!;
    await expect(ready.querySelector('[data-slot="entity-row-description"]')).toBeNull();
    const readyRow = ready.querySelector('[data-slot="entity-row"]')!;
    await expect(Math.round(readyRow.getBoundingClientRect().height)).toBe(56);

    // A failed row with no error message keeps its Retry and loses its reason.
    const failures = Array.from(root.querySelectorAll('[data-stage="failed"]'));
    const named = failures[1]!;
    await expect(named.querySelector('[data-slot="entity-row-description"]')!.textContent).toBe(
      "Transcript · 48 min",
    );

    // `retryText=""` — icon only, still named, still a real target.
    const retry = named.querySelector<HTMLElement>('[data-slot="source-panel-retry"]')!;
    await expect(retry.textContent).toBe("");
    await expect(retry.getAttribute("aria-label")).toBe("Retry kickoff-call.vtt");
    const box = retry.getBoundingClientRect();
    await expect(`retry target ${box.width >= 24 && box.height >= 24}`).toBe("retry target true");

    // The collapse. Measured, not endorsed: the name survives the gate and
    // stops distinguishing anything.
    await expect(
      failures[0]!.querySelector('[data-slot="source-panel-retry"]')!.getAttribute("aria-label"),
    ).toBe("Retry ");
    await expect(root.querySelector('[role="progressbar"]')!.getAttribute("aria-label")).toBe(
      ": Parsing",
    );
  },
};

/**
 * Author-supplied text at the length a real ingestion queue produces: an export
 * filename nobody chose by hand, and an error string carrying a provider's own
 * wording. Every text slot in this panel comes from outside it.
 *
 * **The decision the component makes is truncate, on one line, with no
 * escape.** `entity-row` gives both its title and its description `truncate`,
 * so an 81-character filename is clipped at the row's width and neither slot
 * carries a `title` attribute — no hover, no wrap, no expansion — and the root
 * is `max-w-md`, so the clip happens well before the page runs out of room.
 * Measured below on both slots.
 *
 * **The sharp version is on a failed row, where the description *is* the
 * error.** The second line of a failed row is the only place the reason for a
 * failure appears, and it is the slot carrying the truncation — so the longer
 * and more specific an error message is, the less of it a sighted user can
 * read. "Embedding failed after 3 attempts…" clips before it reaches the part
 * naming what happened. That is I2 `property-inspector`'s shape (a value that
 * loses its leading digits) applied to prose, and the fix is a layout decision
 * — a second line, a `title`, or a disclosure — so it is recorded, not swept.
 *
 * **One asymmetry worth naming.** The row's visually-hidden `role="status"`
 * carries the *whole* untruncated string, name and error together, so a screen
 * reader gets what the screen cannot show. Assistive tech is better served here
 * than a sighted user is, which is an unusual direction for a defect and easy
 * to miss when only one of the two is checked.
 */
export const LongContent: Story = {
  render: (args) => (
    <div className="w-[420px]">
      <SourcePanel {...args} />
    </div>
  ),
  args: {
    heading: "Sources in this notebook, including everything imported from the shared drive",
    sources: [
      {
        id: "1",
        name: "2024-Q3-consolidated-financial-review-forward-guidance-appendix-B-final-v7.pdf",
        meta: "PDF · 18.4 MB · imported from the shared drive on 12 March",
        stage: "ready",
        chunkCount: 4210,
      },
      {
        id: "2",
        name: "all-hands-2024-03-12-recording-transcript-auto-generated.vtt",
        meta: "Transcript · 92 min",
        stage: "failed",
        errorMessage:
          "Embedding failed after 3 attempts — the provider returned 429 on every chunk past 1,200",
      },
    ],
    onRetrySource: () => {},
  },
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector('[data-slot="source-panel"]') as HTMLElement;

    // The panel absorbs the length rather than passing it on: nothing scrolls
    // sideways, at either level that could.
    await expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth);
    for (const row of Array.from(root.querySelectorAll<HTMLElement>('[data-slot="entity-row"]'))) {
      await expect(row.scrollWidth).toBeLessThanOrEqual(row.clientWidth);
    }

    // The long name is clipped, and there is nothing to recover it with.
    const title = root.querySelector<HTMLElement>('[data-slot="entity-row-title"]')!;
    await expect(`title clipped: ${title.scrollWidth > title.clientWidth}`).toBe("title clipped: true");
    await expect(title.getAttribute("title")).toBeNull();

    // On the failed row, the clipped slot is the error message itself.
    const failedRow = root.querySelector('[data-stage="failed"]')!;
    const error = failedRow.querySelector<HTMLElement>('[data-slot="entity-row-description"]')!;
    await expect(error.textContent).toContain("Embedding failed after 3 attempts");
    await expect(`error clipped: ${error.scrollWidth > error.clientWidth}`).toBe("error clipped: true");
    await expect(error.getAttribute("title")).toBeNull();

    // …while the hidden status region carries the whole thing.
    const status = failedRow.querySelector('[data-slot="source-panel-item-status"]')!;
    await expect(status.textContent).toBe(
      "all-hands-2024-03-12-recording-transcript-auto-generated.vtt: Failed, " +
        "Embedding failed after 3 attempts — the provider returned 429 on every chunk past 1,200",
    );
  },
};

/**
 * 375px, and the first width at which the frame is decided by the viewport
 * rather than by the component — the root is `max-w-md` (448px), so every story
 * above renders at its own preferred width and this one does not.
 *
 * The wrapper constrains width, not the breakpoint, and here that distinction
 * costs nothing: `grep -nE "sm:|md:|lg:"` over `source-panel.tsx` and the three
 * components it composes returns nothing, so unlike E4 `preset-grid` there is
 * no desktop layout squeezed narrow — the phone case and the narrow-sidebar
 * case are the same rendering.
 *
 * The row's arithmetic is what makes or breaks it. The trailing cluster is
 * `shrink-0` — a stage badge plus, on a failed row, a Retry — and the title
 * column is `min-w-0 flex-1`, so the name absorbs whatever the cluster takes.
 * The failed row's cluster is the widest, leaving the name a little under half
 * the row: enough for a short filename, and not enough for the exported-report
 * names `LongContent` uses. That combination is the thing to know before
 * putting this in a phone-width sidebar.
 *
 * The `stat-readout` under a ready row stays two columns at this width
 * (`grid-cols-[auto_1fr]`, no breakpoint), which is right — a label and a
 * number are both short, and stacking them would double the row height for
 * nothing.
 */
export const Mobile: Story = {
  render: (args) => (
    <div data-testid="mobile-frame" className="w-[375px] max-w-full">
      <SourcePanel {...args} />
    </div>
  ),
  args: {
    heading: "Sources",
    action: (
      <Button size="sm" variant="outline">
        Add
      </Button>
    ),
    sources: [
      { id: "1", name: "Q3-report.pdf", meta: "PDF · 2.4 MB", stage: "chunking" },
      { id: "2", name: "pricing-policy.docx", meta: "Word · 310 KB", stage: "ready", chunkCount: 1284 },
      {
        id: "3",
        name: "annual-review-2024.pdf",
        meta: "PDF · 18 MB",
        stage: "failed",
        errorMessage: "Parse failed — the file is a scan with no text layer",
      },
    ],
    onRetrySource: () => {},
  },
  play: async ({ canvasElement }) => {
    // Measure the 375px frame, never `canvasElement.firstElementChild` — the
    // meta's `layout: "centered"` wraps every story in a ~1200px div, and an
    // overflow check against that passes for the wrong reason.
    const frame = canvasElement.querySelector<HTMLElement>('[data-testid="mobile-frame"]')!;
    await expect(Math.round(frame.getBoundingClientRect().width)).toBe(375);
    await expect(frame.scrollWidth).toBeLessThanOrEqual(frame.clientWidth);

    const root = frame.querySelector<HTMLElement>('[data-slot="source-panel"]')!;
    await expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth);

    // Every visible part of every row fits, including the bar row and the
    // stats row. The `sr-only` status span is excluded on purpose: it is a
    // 1×1 clipped box, so it always "overflows" and measuring it would fail
    // this assertion for a reason that has nothing to do with layout.
    for (const el of Array.from(
      root.querySelectorAll<HTMLElement>(
        '[data-slot="source-panel-item"] > *:not([data-slot="source-panel-item-status"])',
      ),
    )) {
      await expect(el.scrollWidth).toBeLessThanOrEqual(el.clientWidth);
    }

    // The failed row carries the widest trailing cluster; the name takes what
    // is left, and `min-w-0` is what lets it.
    const failedRow = root.querySelector('[data-stage="failed"]')!;
    const trailing = failedRow.querySelector<HTMLElement>('[data-slot="entity-row-trailing"]')!;
    const title = failedRow.querySelector<HTMLElement>('[data-slot="entity-row-title"]')!;
    await expect(trailing.getBoundingClientRect().width).toBeGreaterThan(0);
    await expect(title.getBoundingClientRect().width).toBeGreaterThan(0);

    // Two columns, not stacked, at 375px.
    const stats = root.querySelector<HTMLElement>('[data-slot="stat-readout"]')!;
    await expect(getComputedStyle(stats).gridTemplateColumns.split(" ")).toHaveLength(2);
  },
};

/**
 * Three lists of things with a state per row, and the rule is not what they
 * look like — it is what a row is accountable for and how long it lives.
 *
 * - **Source panel** — the library. A row is a thing the product now *owns*: it
 *   arrives once, moves through a fixed pipeline, and then stays, citable,
 *   until someone removes it. The terminal state is the point, which is why
 *   `ready` carries a chunk count instead of disappearing. If a row still
 *   matters tomorrow, it belongs here.
 * - **Generation queue** — the batch. Rows are interchangeable outputs of one
 *   request you just made; the queue exists to be emptied, carries a single
 *   heading and one progress number for the whole batch, and vanishes when the
 *   batch resolves. Nothing in it is a durable object.
 * - **Source cards** — the receipt. Rows are the sources *this one answer*
 *   retrieved, scored against that question and gone with it. It answers "where
 *   did this come from", never "what do we have"; the same document can appear
 *   in it a hundred times and still occupy one row of the panel above.
 *
 * The deciding questions, in order: does the row outlive the request that
 * created it (source panel); is it scoped to one answer (source cards);
 * otherwise generation queue.
 *
 * The panel and the cards are two ends of one mechanism — K6 `citation-ref`'s
 * jump-to-source is meant to travel from a card back to a panel row — and
 * `CONTINUE.md` §8 records that this panel stamps no per-source id, so that
 * jump has to find its row positionally. Rendering the pair side by side is
 * where that gap is easiest to see: nothing in either list keys to the other.
 */
export const Boundary: Story = {
  render: () => (
    <div className="flex w-full max-w-2xl flex-col gap-8">
      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">
          Source panel — the library; a row outlives the request that made it
        </p>
        <SourcePanel
          heading="Sources"
          sources={[
            { id: "1", name: "Q3-report.pdf", meta: "PDF · 2.4 MB", stage: "embedding" },
            { id: "2", name: "pricing-policy.docx", meta: "Word · 310 KB", stage: "ready", chunkCount: 96 },
          ]}
          onRetrySource={() => {}}
        />
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">
          Generation queue — the batch; the list exists to be emptied
        </p>
        <GenerationQueue
          heading="Generating 2 images"
          items={[
            {
              id: "1",
              title: "Rooftop garden, golden hour",
              description: "Image · 4:5",
              state: "running",
              progress: 24,
            },
            { id: "2", title: "Studio portrait, soft light", description: "Image · 1:1", state: "queued" },
          ]}
          onCancelItem={() => {}}
        />
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">
          Source cards — the receipt; scoped to one answer and gone with it
        </p>
        <SourceCards
          sources={[
            {
              id: "pricing-policy",
              title: "pricing-policy.docx",
              snippet:
                "Discounts above 20% require sign-off from the deal desk, and the approval is recorded against the opportunity.",
              relevance: "high",
              used: true,
            },
            {
              id: "q3-report",
              title: "Q3-report.pdf",
              snippet:
                "Net revenue retention held at 112% for the quarter, with the enterprise segment contributing most of the expansion.",
              relevance: "medium",
            },
          ]}
        />
      </section>
    </div>
  ),
};
