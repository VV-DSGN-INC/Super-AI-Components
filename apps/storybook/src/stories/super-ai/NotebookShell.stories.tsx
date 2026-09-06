import type { Meta, StoryObj } from "@storybook/react-vite";
import { AudioLines, BookOpen, FileText, Network, Plus } from "lucide-react";
import * as React from "react";
import { expect, fn, userEvent, waitFor } from "storybook/test";

import { Button } from "@/components/ui/button";
import { NotebookShellDocs } from "@/content/components/notebook-shell.docs";
import { componentDocsPage } from "@/lib/component-docs-page";
import { hasVisibleFocusRing, settledFocusRing } from "@/lib/focus-ring";
import { DocsShell } from "@/registry/super-ai/docs-shell";
import { NotebookShell, type NotebookShellProps } from "@/registry/super-ai/notebook-shell";

const SOURCES: NotebookShellProps["sources"] = [
  { id: "q3-report", name: "Q3-report.pdf", meta: "PDF · 2.4 MB", stage: "ready", chunkCount: 184 },
  {
    id: "kickoff-call",
    name: "Kickoff call transcript",
    meta: "Transcript · 48 min",
    stage: "ready",
    chunkCount: 96,
  },
  { id: "pricing-page", name: "competitor-pricing.html", meta: "Web page", stage: "embedding" },
  {
    id: "contract",
    name: "master-agreement.docx",
    meta: "DOCX · 812 KB",
    stage: "failed",
    errorMessage: "Could not read the file — it looks password protected.",
  },
];

const MESSAGES: NotebookShellProps["messages"] = [
  {
    id: "m1",
    role: "user",
    content: "What did we actually commit to on pricing, and where is that written down?",
  },
  {
    id: "m2",
    role: "assistant",
    claims: [
      {
        id: "c1",
        text: "The commitment is a flat per-seat price held for the first twelve months.",
        citations: [
          {
            id: "x1",
            label: "1",
            sourceId: "q3-report",
            quote: "Per-seat pricing is fixed for the first four quarters of any new contract.",
          },
        ],
      },
      {
        id: "c2",
        text: "It was agreed verbally on the kickoff call two weeks before it reached the report.",
        citations: [
          {
            id: "x2",
            label: "2",
            sourceId: "kickoff-call",
            quote: "We will hold the seat price for a year — put that in writing before Q4.",
          },
        ],
      },
      { id: "c3", text: "Nothing in the uploaded set covers renewal pricing after year one." },
    ],
    retrievedUnused: 1,
  },
];

const OUTPUT_TYPES: NotebookShellProps["outputTypes"] = [
  {
    id: "audio",
    icon: <AudioLines aria-hidden />,
    title: "Audio Overview",
    description: "Two hosts talk through everything you have added.",
  },
  {
    id: "mind-map",
    icon: <Network aria-hidden />,
    title: "Mind Map",
    description: "How the sources connect to one another.",
  },
  {
    id: "briefing",
    icon: <FileText aria-hidden />,
    title: "Briefing Doc",
    description: "A one-page summary, cited throughout.",
  },
];

const OUTPUTS: NotebookShellProps["outputs"] = [
  {
    id: "o1",
    state: "done",
    aspect: "video",
    label: "Audio Overview · 11 min",
    badge: "Audio",
    footer: <span>Generated from 3 sources</span>,
  },
  {
    id: "o2",
    state: "streaming",
    aspect: "video",
    progress: 62,
    label: "Mind Map",
    badge: "Diagram",
  },
];

const ADD_SOURCE = (
  <Button type="button" size="sm" variant="outline">
    <Plus aria-hidden />
    Add source
  </Button>
);

const FULL_ARGS: NotebookShellProps = {
  sources: SOURCES,
  sourcesAction: ADD_SOURCE,
  sourcesEmptyAction: (
    <Button type="button" size="sm">
      Add source
    </Button>
  ),
  onRetrySource: () => {},
  messages: MESSAGES,
  contextChips: [{ id: "chip-1", kind: "file", label: "Q3-report.pdf", onRemove: () => {} }],
  outputTypes: OUTPUT_TYPES,
  outputs: OUTPUTS,
  onGenerateOutput: () => {},
};

const meta: Meta<typeof NotebookShell> = {
  title: "Super AI/Notebook Shell",
  component: NotebookShell,
  // A block is a page, so it gets the whole canvas rather than a centred box.
  // The `h-svh` wrapper is what the shell's `h-full` measures against — in a
  // real app that is the document, here it is the story frame.
  parameters: { layout: "fullscreen", docs: { page: componentDocsPage(NotebookShellDocs) } },
  decorators: [
    (Story) => (
      <div className="h-svh w-full">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof NotebookShell>;

/** The working notebook: four sources, a cited answer, two outputs in the studio. */
export const Grounded: Story = { args: FULL_ARGS };

/**
 * Day one, and the reason this block has an empty contract at all: no sources,
 * no conversation, nothing generated — three L1s on screen at the same time.
 * The studio still shows its menu, because a menu of things you could make is
 * the one part of an empty notebook that is worth reading. Mandatory export for
 * the block contract.
 */
export const Empty: Story = {
  args: {
    sourcesAction: ADD_SOURCE,
    sourcesEmptyAction: (
      <Button type="button" size="sm">
        Add source
      </Button>
    ),
    outputTypes: OUTPUT_TYPES,
    onGenerateOutput: () => {},
  },
};

/**
 * Narrow viewport. Three columns are unusable well before the phone
 * breakpoint, so below `lg` the panes stack in reading order — sources, the
 * conversation about them, then what it produced — and the scroll moves from
 * the panes to the shell root. Mandatory export for the block contract; a
 * shell is a layout, and layout is what breaks.
 *
 * `globals.viewport.value` is the Storybook 9 API. `parameters.viewport
 * .defaultViewport` was removed in 9 and does nothing while looking
 * configured, and `options` is declared explicitly so the selection cannot
 * silently resolve to nothing.
 *
 * KNOWN LIMIT: this resizes the canvas in the Storybook UI only. The vitest
 * runner behind `test:stories` has no manager to resize an iframe, so it
 * renders and axe-checks this story at the browser's default width. The narrow
 * layout is verified by hand, not by a gate.
 */
export const Responsive: Story = {
  args: FULL_ARGS,
  parameters: {
    viewport: {
      options: {
        mobile: { name: "Mobile", styles: { width: "375px", height: "812px" }, type: "mobile" },
      },
    },
  },
  globals: { viewport: { value: "mobile" } },
};

/**
 * Geometric proof for `OUTPUT_TYPES_IN_PANE`'s vertical override
 * (notebook-shell.tsx): the studio pane is a fixed twenty rem (`lg:w-80`),
 * and C3's own arrows are top-anchored by default — inside that width they
 * still land on the first card, over its icon or thumbnail, because the
 * card is the full width of the pane. Top-anchoring keeps C3's own arrows
 * off the title, but this shell wants them off the cards entirely, above
 * the row on its header line — a placement C3's own top-anchored default
 * does not provide, the reason this shell repositions them at all. The
 * override moves them there and marks its `top` important to survive C3's
 * own `!top-2`; without that `!`, C3's importance wins over this selector's
 * higher specificity and the arrows end up back inside the row, over the
 * first card's icon — the same "arrows over a card" failure the header-line
 * placement exists to avoid. See that constant's docstring for the full
 * mechanism.
 */
export const ArrowsClearTheRow: Story = {
  args: FULL_ARGS,
  play: async ({ canvasElement }) => {
    const row = canvasElement.querySelector<HTMLElement>('[data-slot="feature-card-row"]')!;
    const prev = canvasElement.querySelector<HTMLElement>(
      '[data-slot="feature-card-row-previous"]',
    )!;
    const next = canvasElement.querySelector<HTMLElement>('[data-slot="feature-card-row-next"]')!;
    const pane = canvasElement.querySelector<HTMLElement>('[data-region="studio-outputs"]')!;

    const rowBox = row.getBoundingClientRect();
    const prevBox = prev.getBoundingClientRect();
    const nextBox = next.getBoundingClientRect();
    const paneBox = pane.getBoundingClientRect();

    // Above the row's header line, never over the cards.
    await expect(prevBox.bottom).toBeLessThanOrEqual(rowBox.top + 1);
    await expect(nextBox.bottom).toBeLessThanOrEqual(rowBox.top + 1);

    // Inside the pane — not clipped at its twenty-rem width.
    await expect(prevBox.left).toBeGreaterThanOrEqual(paneBox.left);
    await expect(nextBox.right).toBeLessThanOrEqual(paneBox.right);
  },
};

/**
 * Sources mid-ingest. The pipeline is the status — a source being embedded says
 * so by name, and a failed one is retryable in place without touching the other
 * three.
 */
export const Ingesting: Story = {
  args: {
    ...FULL_ARGS,
    sources: [
      { id: "q3-report", name: "Q3-report.pdf", meta: "PDF · 2.4 MB", stage: "parsing" },
      { id: "kickoff-call", name: "Kickoff call transcript", meta: "Transcript", stage: "chunking" },
      { id: "pricing-page", name: "competitor-pricing.html", meta: "Web page", stage: "embedding" },
      {
        id: "contract",
        name: "master-agreement.docx",
        meta: "DOCX · 812 KB",
        stage: "failed",
        errorMessage: "Could not read the file — it looks password protected.",
      },
    ],
    messages: [],
    outputs: [],
  },
};

/**
 * A citation pointing at a document the panel does not have. It still renders,
 * and it still says it is broken — silently dropping the marker is how an
 * answer stops being auditable.
 */
export const UnresolvedCitation: Story = {
  args: {
    ...FULL_ARGS,
    outputs: [],
    messages: [
      {
        id: "m1",
        role: "assistant",
        claims: [
          {
            id: "c1",
            text: "Headcount doubled between the second and third quarter.",
            citations: [{ id: "x1", label: "4", sourceId: "headcount-sheet" }],
          },
        ],
      },
    ],
  },
};

/* -------------------------------------------------------------------------
 * Case stories — the situations this shell meets, as opposed to the props it
 * takes. `story-conventions.md`, "The eight".
 *
 * All eight are written, so there are no `case-skip` lines. A shell declares
 * `regions` rather than `states`, so none of the exports above is a
 * declared-state story and none of them needs a description obligation; these
 * eight are the whole of this file's coverage debt.
 * ---------------------------------------------------------------------- */

/**
 * Right-to-left. Three panes side by side is a directional layout in the
 * strongest sense — the pane order *is* the reading order — so the flex row
 * mirrors and sources ends up on the right, the studio on the left, and the
 * conversation between them exactly as in LTR.
 *
 * **Fixed in this wave.** The two dividers did not mirror with the panes. They
 * were `lg:border-r` on the sources pane and `lg:border-l` on the studio pane,
 * so under RTL both painted on the shell's *outer* edges and the panes ran
 * together with nothing between them — measured before the change as
 * `sources 0px/1px/0px/0px · studio 0px/0px/0px/1px` in both directions. They
 * are `lg:border-e` and `lg:border-s` now, which `CONTINUE.md` §8's
 * logical-properties sweep sanctions on the ground that the swap is
 * byte-identical in LTR. That is a measurement here, not an assumption
 * (wave 7's `usage-dashboard` found a `text-left` swap that was not): the LTR
 * frame reads `0px/1px/0px/0px` and `0px/0px/0px/1px` before and after the
 * change, unchanged to the pixel, while RTL now puts each border on the edge
 * its neighbouring pane is on. This story asserts the RTL half; `Grounded`
 * and `ArrowsClearTheRow` hold the LTR half by rendering at all.
 *
 * **Two things are wrong under RTL and are recorded rather than asserted**,
 * because pinning them would make them permanent:
 *
 * 1. **N3 `disclaimer-note`'s trailing full stop lands at the wrong end.** Its
 *    default text is one Latin run terminated by a period, and a trailing
 *    neutral takes the paragraph direction, so the stop paints to the *left*
 *    of the sentence's first character: measured here at x 481..484 with "AI"
 *    at 484..495 and "info" at 710..731. Wave 7 found this on N3 itself and
 *    noted it disappears when a link follows the text; this shell passes no
 *    `link`, so the shipped default is the failing case. The fix belongs in
 *    N3 — a `<bdi>` or a `dir` pin on the text span — not here.
 * 2. **The studio's carousel arrows stay physically right.** They are placed
 *    by `OUTPUT_TYPES_IN_PANE`'s `right-9`/`right-0`, which a logical swap
 *    would move to the left under RTL. Deliberately not swept: the vendored
 *    `carousel.tsx` never passes Embla a `direction`, and neither C3
 *    `feature-card-row` nor this shell can reach it, so the *track* does not
 *    mirror — the cards still run left to right. Moving only the arrows would
 *    put previous/next at the far end of a row that has not moved. Same
 *    finding wave 1 recorded on D2 `reference-strip`, which composes the same
 *    primitive; it is one fix in the primitive, not three at call sites.
 *
 * `dir` is on a wrapper rather than the document because nothing here is
 * portalled. Opening K6's hover card would need `dir` on the document instead
 * (`story-conventions.md`, mechanical fact 5) — which is also why this story
 * does not open one.
 */
export const RTL: Story = {
  args: { ...FULL_ARGS, outputs: [] },
  render: (args) => (
    <div dir="rtl" className="h-full w-full">
      <NotebookShell {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const el = (id: string) => canvasElement.querySelector<HTMLElement>(`[data-region="${id}"]`)!;
    const sources = el("sources");
    const chat = el("chat");
    const studio = el("studio-outputs");
    const box = (e: HTMLElement) => e.getBoundingClientRect();

    // Reading order mirrored: the first pane in the DOM is the rightmost.
    await expect(
      [
        `sources right of chat: ${box(sources).left > box(chat).left}`,
        `chat right of studio: ${box(chat).left > box(studio).left}`,
      ].join(" · "),
    ).toBe("sources right of chat: true · chat right of studio: true");

    // Each divider sits between its two panes rather than on an outer edge.
    const s = getComputedStyle(sources);
    const t = getComputedStyle(studio);
    await expect(
      [
        `sources ${s.borderLeftWidth}/${s.borderRightWidth}`,
        `studio ${t.borderLeftWidth}/${t.borderRightWidth}`,
      ].join(" · "),
    ).toBe("sources 1px/0px · studio 0px/1px");
    await expect(Math.round(box(sources).left)).toBe(Math.round(box(chat).right));
    await expect(Math.round(box(studio).right)).toBe(Math.round(box(chat).left));
  },
};

/**
 * Reduced motion. Two things in this shell move, and only one of them is CSS.
 *
 * The CSS half branches, and this story reads the branch back rather than
 * trusting the class: K5's ingest bar (`animate-pulse` +
 * `motion-reduce:animate-none` on `progress-indicator`) and K6's in-flight
 * citation marker both report `animation-name: none` under the emulated
 * `prefers-reduced-motion: reduce` that `vitest.config.ts` sets for every
 * test. Neither is a Base UI popup surface, so the restated-variant idiom
 * (`story-conventions.md`, mechanical fact 3) does not apply here — the plain
 * form is the working form on a bare `animate-pulse`.
 *
 * **The other half does not branch, and it is the one the user sees most.**
 * The chat pane is AI Elements' `Conversation`, which passes
 * `initial="smooth" resize="smooth"` to `use-stick-to-bottom`; that library
 * animates `scrollTop` itself with a spring (`damping: 0.7`,
 * `stiffness: 0.05`, stepped in a `requestAnimationFrame` loop) and contains
 * no `matchMedia` and no `prefers-reduced-motion` anywhere in its shipped
 * source — grepped at 1.1.6. It even overrides CSS `scroll-behavior` on the
 * element it owns, so a `motion-reduce:` class could not reach it either.
 * Every arriving answer therefore glides the pane, for everyone. Not
 * asserted: the fix is upstream (`behavior: "instant"` under the media query,
 * chosen in `conversation.tsx`, which is a vendored file this story does not
 * own), and asserting today's behaviour would make it permanent. Same shape
 * as wave 1's finding that Embla's JS tween ignores the media feature.
 */
export const ReducedMotion: Story = {
  args: {
    ...FULL_ARGS,
    outputs: [],
    sources: [
      SOURCES![0],
      { id: "pricing-page", name: "competitor-pricing.html", meta: "Web page", stage: "embedding" },
    ],
    messages: [
      {
        id: "m1",
        role: "assistant",
        claims: [
          {
            id: "c1",
            text: "The commitment is a flat per-seat price held for the first twelve months.",
            citations: [{ id: "x1", label: "1", sourceId: "q3-report", state: "loading" }],
          },
        ],
      },
    ],
  },
  play: async ({ canvasElement }) => {
    const bar = canvasElement.querySelector<HTMLElement>('[data-slot="progress-indicator"]')!;
    const marker = canvasElement.querySelector<HTMLElement>('[data-slot="citation-ref"]')!;
    await expect(
      [
        `reduce ${window.matchMedia("(prefers-reduced-motion: reduce)").matches}`,
        `ingest ${getComputedStyle(bar).animationName}`,
        `marker ${getComputedStyle(marker).animationName}`,
      ].join(" · "),
    ).toBe("reduce true · ingest none · marker none");
  },
};

/**
 * Everything a Tab can land on, as a selector. `:not([disabled])` is on *both*
 * halves deliberately: Base UI leaves `tabindex="0"` on a natively-disabled
 * button, so the `[tabindex]` clause would otherwise re-admit the inert
 * controls the `button` clause just excluded.
 */
const TAB_STOP = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"]):not([disabled])',
].join(", ");

/**
 * Stops with a recorded, unfixed focus-treatment defect — named rather than
 * asserted, so a fix upstream cannot turn this story red.
 */
const KNOWN_UNRINGED = ["media-prompt-bar-textarea"];

/**
 * Anything focusable, in the order a keyboard reaches it. Three of the stops
 * are the panes themselves: each pane scrolls independently above `lg`, so
 * each carries `tabIndex={0}` and a name, and a keyboard user pages a pane by
 * landing on it and pressing the arrow keys.
 *
 * The sequence is derived from the live DOM rather than hardcoded, and it is
 * re-derived at every step, so what the walk asserts is "each Tab moves to the
 * next focusable in document order, as the document is at that moment" —
 * nothing skipped, nothing extra, and no count that a later change could
 * satisfy by accident. Two details the derivation has to get right, both traps
 * this repo has already paid for: `:not([disabled])` on both halves of the
 * selector, because Base UI leaves `tabindex="0"` on a natively-disabled
 * button; and a client-rect filter, which is what makes D1's negative-prompt
 * toggle absent rather than merely invisible — the point of suppressing it
 * with `display: none` instead of a visual hide.
 *
 * **Re-deriving is not defensive, it is the finding.** The tab order changes
 * while you are walking it. On arrival the studio carousel offers a Next arrow
 * and a disabled Previous; tabbing onto the second and third output cards
 * scrolls the row to its end, which enables Previous and disables Next. So the
 * walk is fourteen stops long both times and they are not the same fourteen —
 * the last stop a keyboard user reaches is Previous, and Next, the arrow that
 * was live when they arrived, is never reachable by Tab at all. Nothing here
 * is broken: a carousel arrow is inert at the end of its track. It is the cost
 * of composing a horizontal row into a twenty-rem pane, where three cards
 * means the track is always at one end or the other.
 *
 * Every stop is read with `settledFocusRing` rather than a `box-shadow`
 * string, and the three panes are why that matters. They carry no
 * `focus-visible` utility of their own and they still paint: the user agent's
 * own `outline: auto 1px`, recoloured by this repo's global
 * `* { outline-ring/50 }` to `oklab(0.708 0 0 / 0.5)`. **That contradicts this
 * component's own docs module**, which says tabbing into a pane "shows
 * nothing" — the fourth correction of that exact shape in this program, after
 * L4 `whats-new`, N3 `disclaimer-note` and M1 `settings-dialog`, and the
 * argument for rendering a claim instead of reading a class list. The note was
 * presumably reaching for "thin": 1px against the registry's 2px rings.
 *
 * **One stop paints nothing, and it is recorded rather than pinned.** D1's
 * prompt textarea carries `border-none focus-visible:ring-0`. On focus its
 * ring layer gains a colour at zero geometry (`rgba(0, 0, 0, 0) 0px 0px 0px
 * 0px` becomes `oklab(0.708 0 0 / 0.5) 0px 0px 0px 0px`) and its
 * `border-color` moves from `oklch(0.922 0 0)` to `oklch(0.708 0 0)` while
 * `border-style` stays `none` and `border-width` stays `0px` — so neither
 * change puts a pixel on screen. Wave 1 recorded it on D1 itself and it is
 * unfixed. It is also a clean demonstration of why `story-conventions.md`
 * fact 5 asks for both checks: the *differential* reports `changed: true` here
 * — the J3 `explore-gallery` shape — while `settledFocusRing` correctly
 * reports no ring. `KNOWN_UNRINGED` names it, so a fix in D1 leaves this story
 * green while any *other* stop losing its ring turns it red.
 */
export const KeyboardOrder: Story = {
  args: FULL_ARGS,
  play: async ({ canvasElement }) => {
    const shell = canvasElement.querySelector<HTMLElement>('[data-slot="notebook-shell"]')!;
    // The vendored `Button` stamps `data-slot="button"`, which names nothing on
    // its own when the control is caller-supplied — so a bare button is
    // identified by its text instead.
    const label = (el: Element) => {
      const slot =
        el.getAttribute("data-region") ?? el.getAttribute("data-slot") ?? el.tagName.toLowerCase();
      return slot === "button" ? `button:${(el.textContent ?? "").trim()}` : slot;
    };
    const liveStops = () =>
      Array.from(shell.querySelectorAll<HTMLElement>(TAB_STOP)).filter(
        (el) => el.getClientRects().length > 0,
      );

    // What a keyboard user meets on arrival, before anything has moved.
    await expect(liveStops().map(label).join(" → ")).toBe(
      [
        "sources",
        "button:Add source",
        "source-panel-retry",
        "chat",
        "citation-ref",
        "citation-ref",
        "context-chip-remove",
        "media-prompt-bar-textarea",
        "media-prompt-bar-attach",
        "studio-outputs",
        "entity-row",
        "entity-row",
        "entity-row",
        "feature-card-row-next",
      ].join(" → "),
    );

    (document.activeElement as HTMLElement | null)?.blur();
    const visited: string[] = [];
    let previous: HTMLElement | null = null;
    for (let i = 0; i < 20; i += 1) {
      await userEvent.tab();
      // Settle on departure: a press that has not applied yet leaves focus on
      // the previous stop, which is itself an expected stop, so waiting for
      // "focus is somewhere expected" would read stale (fact 4).
      if (previous) await waitFor(() => expect(document.activeElement).not.toBe(previous));
      const active = document.activeElement as HTMLElement;
      if (!shell.contains(active)) break;

      const live = liveStops();
      await expect(`${label(active)} at ${live.indexOf(active)}`).toBe(
        `${label(active)} at ${previous ? live.indexOf(previous) + 1 : 0}`,
      );
      visited.push(label(active));
      if (!KNOWN_UNRINGED.includes(label(active))) await settledFocusRing(active, waitFor);
      previous = active;
    }

    // Fourteen stops walked — but not the fourteen that were there on arrival.
    await expect(visited.join(" → ")).toBe(
      [
        "sources",
        "button:Add source",
        "source-panel-retry",
        "chat",
        "citation-ref",
        "citation-ref",
        "context-chip-remove",
        "media-prompt-bar-textarea",
        "media-prompt-bar-attach",
        "studio-outputs",
        "entity-row",
        "entity-row",
        "entity-row",
        "feature-card-row-previous",
      ].join(" → "),
    );

    // The arrows swapped places under the walk: Next was the live one when the
    // user arrived, Previous is the live one by the time they reach it.
    const arrow = (slot: string) =>
      shell.querySelector<HTMLButtonElement>(`[data-slot="feature-card-row-${slot}"]`)!;
    await expect(
      `previous ${arrow("previous").disabled} · next ${arrow("next").disabled}`,
    ).toBe("previous false · next true");

    // Focus left the shell rather than wrapping: nothing here traps it.
    await expect(shell.contains(document.activeElement)).toBe(false);
  },
};


const PINNED_QUESTION = "Which clause caps the renewal uplift?";

/**
 * A host that holds the composer's value and refuses to move it. The render
 * counter is what makes the last assertion mean anything: the host really did
 * re-render, with `value` unchanged, so the field held because the prop held
 * and not because React skipped the work.
 */
function PinnedComposer({ onValueChange }: { onValueChange: (value: string) => void }) {
  const [renders, setRenders] = React.useState(1);
  return (
    <div data-renders={renders} className="h-full">
      <NotebookShell
        {...FULL_ARGS}
        composer={{
          value: PINNED_QUESTION,
          onValueChange: (value) => {
            onValueChange(value);
            setRenders((n) => n + 1);
          },
        }}
      />
    </div>
  );
}

/**
 * The shell has exactly one controlled pair, and it is not its own: `composer`
 * forwards `value`/`onValueChange` straight through to D1 `media-prompt-bar`.
 * Everything else this shell takes is data (`sources`, `messages`, `outputs`)
 * or an intent (`onGenerateOutput`, `onRetrySource`, `onJumpToSource`), so a
 * host drives the notebook by replacing the arrays it passes rather than by
 * answering a change event.
 *
 * The story asserts the three things that make "controlled" a claim rather
 * than a prop: typing does not move the rendered value, the callback carries
 * the whole next value a consumer would apply, and a re-render with an
 * unchanged `value` leaves the field where it was.
 *
 * **Two things are recorded and not asserted.**
 *
 * D1 keeps an internal value *while it is controlled*: `handleChange` calls
 * `setInternalValue` unconditionally and the field renders `value ??
 * internalValue`. The rendered text is therefore correct here, and the
 * component is carrying a second, divergent value the whole time — a host that
 * later stops passing `value` gets whatever the user last typed instead of the
 * value it thought was current. O2 `chat-shell` found the identical shape in
 * D4 `mode-tabs`, so this is a family trait of the composer primitives rather
 * than one component's slip. Not asserted, because the assertion would go red
 * the day D1 stops tracking while controlled, which is the fix.
 *
 * And the one piece of state the shell genuinely owns — which source a
 * citation last jumped to — has no controlled pair at all. `onJumpToSource`
 * fires *after* the left pane has already scrolled and the status region has
 * already been written, so a host can observe the jump and cannot drive it,
 * refuse it, or restore it after a re-mount. That is the same half-a-pair
 * shape wave 1 declined to call controlled on `property-inspector`.
 */
export const Controlled: StoryObj<typeof PinnedComposer> = {
  args: { onValueChange: fn() },
  render: (args) => <PinnedComposer {...args} />,
  play: async ({ args, canvasElement }) => {
    const field = canvasElement.querySelector<HTMLTextAreaElement>(
      '[data-slot="media-prompt-bar-textarea"]',
    )!;
    await expect(field.value).toBe(PINNED_QUESTION);

    // Type at a known caret rather than wherever a click would land it, so the
    // payload asserted below is the one the keypress actually produced.
    field.focus();
    field.setSelectionRange(field.value.length, field.value.length);
    await userEvent.keyboard("?");

    // The payload a consumer needs in order to apply the change: the whole
    // next value, not a delta.
    await expect(args.onValueChange).toHaveBeenCalledWith(`${PINNED_QUESTION}?`);
    // The prop wins — the keypress alone moved nothing.
    await expect(field.value).toBe(PINNED_QUESTION);
    // …and the host did re-render while holding the value fixed.
    await expect(canvasElement.querySelector("[data-renders]")).toHaveAttribute("data-renders", "2");
  },
};

/**
 * Every pane label this shell will accept as empty, emptied — and the two
 * different things that happen, which is the whole point of the story.
 *
 * `sourcesLabel` and `chatLabel` **degrade in silence**. Each is the
 * `aria-label` of a pane that scrolls and carries a tab stop, so an empty
 * string leaves a focusable scroll container with no accessible name: a
 * keyboard user lands somewhere that announces nothing. Nothing in the
 * pipeline sees it. Axe's `scrollable-region-focusable` is satisfied — the
 * element is focusable, which is the half of it that rule checks — and there
 * is no rule at all for "focusable region without a name". This story renders
 * that state and passes, which is the finding rather than a pass.
 *
 * `studioLabel` and `outputTypesLabel` **are caught, and are not rendered
 * here**. Either one blanked fails axe `empty-heading` — "Headings should not
 * be empty" — because the shell renders those two labels as headings and
 * points `aria-labelledby` at them. Measured, then kept out of the args rather
 * than shipped into the gate, the same way O2 `chat-shell` handled its
 * `artifactsLabel`.
 *
 * **The asymmetry is not a design decision; it is which tag the label landed
 * in.** K5 `source-panel` guards its own heading and renders a paragraph
 * rather than a heading element besides, so it cannot produce an empty
 * heading; the shell guards neither of the two it renders itself. That is the
 * fifth pair in this program's one-red-one-silent family, and the consequence
 * axe catches is again not the one that matters: an `aria-labelledby`
 * resolving to an empty string leaves the section with no accessible name, and
 * it is the empty heading — not the nameless landmark — that fires.
 *
 * Guarding the two headings in the shell would close it, and that is left
 * alone here: it changes what `aria-labelledby` points at, which is a
 * structural change rather than one of the mechanical fixes this wave lands.
 */
export const EmptyLabel: Story = {
  args: { ...FULL_ARGS, sourcesLabel: "", chatLabel: "" },
  play: async ({ canvasElement }) => {
    const sources = canvasElement.querySelector<HTMLElement>('[data-region="sources"]')!;
    const chat = canvasElement.querySelector<HTMLElement>('[data-region="chat"]')!;

    // K5 guards its own label, so nothing empty is rendered in its place — the
    // add-source control keeps the header row alive on its own.
    await expect(canvasElement.querySelector('[data-slot="source-panel-heading"]')).toBeNull();
    await expect(canvasElement.querySelector('[data-slot="source-panel-header"]')).not.toBeNull();

    // Two scrolling tab stops, both nameless, both still reachable.
    await expect(
      [
        `sources name "${sources.getAttribute("aria-label")}" tabindex ${sources.getAttribute("tabindex")} overflow ${getComputedStyle(sources).overflowY}`,
        `chat name "${chat.getAttribute("aria-label")}" role ${chat.getAttribute("role")} tabindex ${chat.getAttribute("tabindex")}`,
      ].join(" · "),
    ).toBe('sources name "" tabindex 0 overflow auto · chat name "" role log tabindex 0');
  },
};

const LONG_SOURCE_NAME =
  "Q3-2026-pricing-and-renewal-terms-final-reviewed-by-legal-and-finance-countersigned.pdf";
const LONG_CLAIM =
  "The per-seat commitment is held flat for the first twelve months of any new contract, and the renewal uplift is capped at the list price of the tier the account was on when it signed.";
const LONG_OUTPUT_LABEL =
  "Audio Overview of the pricing commitment, the renewal terms and every clause the legal review flagged";

/**
 * Author-supplied text at the length real documents have. Every text slot in
 * this shell is caller-supplied, and the shell makes two different decisions
 * about them.
 *
 * **Prose wraps.** A claim is the answer, so K7 lets it run to as many lines as
 * it needs and the middle pane grows downward. Nothing is clipped and nothing
 * scrolls sideways.
 *
 * **Everything that names a thing truncates**, because all three live in a
 * fixed-width column: K5's source title inside the twenty-rem left pane, D3's
 * context chip at its own `max-w-40`, and F1's result label under a card. All
 * three are `white-space: nowrap` with `text-overflow: ellipsis`, which is the
 * right call for a pane — a wrapping filename would push the ingest status off
 * its row.
 *
 * **None of the three carries a `title`, so the truncated text is
 * unrecoverable** — no tooltip, and nothing in the accessible name either,
 * since each is its own element's only text. Two of these are long filenames,
 * where the distinguishing part is usually at the end: `…-v3.pdf` and
 * `…-v4.pdf` render identically. Wave 1 recorded this on D3 `context-chips`;
 * K5 and F1 are the same shape, found here because a shell is where all three
 * appear at once. Recorded rather than fixed: the fix is a prop or an
 * attribute on three other components, and this story asserts only that the
 * truncation happens, so adding the `title` later leaves it green.
 */
export const LongContent: Story = {
  args: {
    ...FULL_ARGS,
    sources: [
      { id: "q3-report", name: LONG_SOURCE_NAME, meta: "PDF · 2.4 MB", stage: "ready", chunkCount: 184 },
      SOURCES![1],
    ],
    contextChips: [{ id: "chip-1", kind: "file", label: LONG_SOURCE_NAME, onRemove: () => {} }],
    messages: [
      {
        id: "m1",
        role: "assistant",
        claims: [
          {
            id: "c1",
            text: LONG_CLAIM,
            citations: [
              { id: "x1", label: "1", sourceId: "q3-report", quote: LONG_CLAIM },
            ],
          },
        ],
      },
    ],
    outputs: [
      { id: "o1", state: "done", aspect: "video", label: LONG_OUTPUT_LABEL, badge: "Audio" },
    ],
  },
  play: async ({ canvasElement }) => {
    const q = (selector: string) => canvasElement.querySelector<HTMLElement>(selector)!;

    const truncated = (el: HTMLElement) => {
      const style = getComputedStyle(el);
      return `${el.scrollWidth > el.clientWidth}/${style.whiteSpace}/${style.textOverflow}`;
    };
    await expect(
      [
        `source ${truncated(q('[data-slot="source-panel-item"] [data-slot="entity-row-title"]'))}`,
        `chip ${truncated(q('[data-slot="context-chip"] span.truncate'))}`,
        `output ${truncated(q('[data-slot="result-card"] [data-slot="preview-tile-label"]'))}`,
      ].join(" · "),
    ).toBe("source true/nowrap/ellipsis · chip true/nowrap/ellipsis · output true/nowrap/ellipsis");

    // The claim wraps instead: more than one line tall, and no clipping.
    const claim = q('[data-slot="answer-block-claim"]');
    const lineHeight = parseFloat(getComputedStyle(claim).lineHeight);
    await expect(
      `wrapped ${claim.clientHeight > lineHeight} · clipped ${claim.scrollWidth > claim.clientWidth}`,
    ).toBe("wrapped true · clipped false");

    // Nothing anywhere scrolls sideways, which is what truncation buys.
    const sideways = (el: HTMLElement) => el.scrollWidth > el.clientWidth;
    await expect(
      [
        `root ${sideways(q('[data-slot="notebook-shell"]'))}`,
        `sources ${sideways(q('[data-region="sources"]'))}`,
        `studio ${sideways(q('[data-region="studio-outputs"]'))}`,
      ].join(" · "),
    ).toBe("root false · sources false · studio false");
  },
};

/**
 * A real 375-pixel viewport, not a 375-pixel box. This shell is the case that
 * makes the difference matter: the stack is keyed on `lg`, so a width wrapper
 * inside the gate's 1200px chromium would still render three columns — in a
 * 375px box — and report success. `page.viewport(375, 812)` from
 * `@vitest/browser/context` moves the viewport itself, so the media query
 * flips and the layout under test is the one a phone gets
 * (`story-conventions.md`, mechanical fact 2). The before/after pair in the
 * play is there to prove the move happened rather than to decorate it.
 *
 * What the narrow layout does: the three panes stack in reading order —
 * sources, the conversation about them, then what it produced — each at the
 * full width, and the scroll container moves from the panes to the shell root.
 * The panes keep their tab stops even though they no longer scroll
 * individually, so a phone user meets three Tab stops that do nothing; the
 * docs module says so and it is true here.
 *
 * The viewport does not leak into the next story — measured in this wave, and
 * O2 `chat-shell`'s `Boundary` asserts the 1200px default explicitly after
 * its own `Mobile` runs.
 */
export const Mobile: Story = {
  args: FULL_ARGS,
  play: async ({ canvasElement }) => {
    const { page } = await import("@vitest/browser/context");
    const q = (selector: string) => canvasElement.querySelector<HTMLElement>(selector)!;
    const root = q('[data-slot="notebook-shell"]');
    const sources = q('[data-region="sources"]');
    const chat = q('[data-region="chat"]');
    const studio = q('[data-region="studio-outputs"]');

    // Before: the desktop branch, at the width the gate renders everything at.
    await expect(
      `innerWidth ${window.innerWidth} · lg ${window.matchMedia("(min-width: 1024px)").matches}`,
    ).toBe("innerWidth 1200 · lg true");

    await page.viewport(375, 812);
    await waitFor(async () => {
      await expect(
        `innerWidth ${window.innerWidth} · lg ${window.matchMedia("(min-width: 1024px)").matches}`,
      ).toBe("innerWidth 375 · lg false");
    });

    // Stacked in reading order, each pane the full width.
    const top = (el: HTMLElement) => el.getBoundingClientRect().top;
    const width = (el: HTMLElement) => Math.round(el.getBoundingClientRect().width);
    await waitFor(async () => {
      await expect(
        [
          `order ${top(sources) < top(chat) && top(chat) < top(studio)}`,
          `widths ${[sources, chat, studio].map(width).join("/")}`,
        ].join(" · "),
      ).toBe("order true · widths 375/375/375");
    });

    // The scroll moved from the panes to the root, and nothing scrolls sideways.
    await expect(
      [
        `root ${getComputedStyle(root).overflowY}`,
        `sources ${getComputedStyle(sources).overflowY}`,
        `sideways ${root.scrollWidth > root.clientWidth}`,
        `document ${document.documentElement.scrollWidth > document.documentElement.clientWidth}`,
      ].join(" · "),
    ).toBe("root auto · sources visible · sideways false · document false");
  },
};

/**
 * O13 beside O11 `docs-shell`, which is the twin worth rendering because the
 * obvious one is already rendered elsewhere: O2 `chat-shell`'s own `Boundary`
 * puts O2 and O13 side by side and asserts the structural difference between
 * them, so repeating that pair here would add a second copy of one fact rather
 * than a new one.
 *
 * **The choosing rule.** All three put documents on the left and a reading
 * surface in the middle, and the question that separates them is who wrote the
 * corpus. O11's corpus is authored and fixed: the left rail is a `nav`, and
 * choosing a row *replaces* the middle column, which is the document. O13's
 * corpus is uploaded by the user and never opened: the left pane is a list of
 * ingest states, the middle column is a conversation, and the only route from
 * one to the other is a citation pointing backwards. Pick O11 when the reader
 * navigates a corpus someone else wrote. Pick O13 when the reader brought the
 * corpus and the answers have to cite it. Pick O2 when there is no corpus and
 * the conversation is the product.
 *
 * The tell asserted here is the composer. O11 has no `composer` region at all
 * — a documentation page takes no input — and O13's is a sibling of its chat
 * pane. A docs shell that grew a composer would have become a notebook.
 *
 * **This is also where the chat pane's `scrollable-region-focusable` exposure
 * gets its second measurement, and the fixtures are chosen for it.** O2 found
 * it from the outside: `use-stick-to-bottom` owns the element that scrolls,
 * `Conversation` owns the tab stop and the accessible name, and the two are
 * different elements, so a stream that overflows with no focusable descendant
 * fails axe outright. Re-measured here rather than taken on trust: fourteen
 * plain turns in a shell of this height gives `scrollHeight 1484` against
 * `clientHeight 743` with zero focusables inside the scroller, and axe reports
 * "Scrollable region must have keyboard access" against
 * `div[data-region="chat"] > .overflow-y-auto.h-full`. That state is
 * deliberately **not** rendered by any story in this file: it is a red gate,
 * and shipping it would be shipping a broken build rather than documenting a
 * defect. What is rendered instead is a grounded answer, whose K6 markers are
 * buttons — and the play asserts that those buttons are the *only* thing
 * keeping the region legal, so simplifying the fixture to plain turns turns
 * this story red for a reason its message will explain.
 *
 * **The repair idiom in this repo does not reach it, which is why nothing is
 * fixed here.** `shortcuts-sheet`'s answer — a `section` with `tabIndex`, an
 * `aria-label` and a focus ring around the scroll container — needs an element
 * you own. `StickToBottom.Content` renders the scrolling div itself and
 * accepts exactly one prop for it, `scrollClassName`, so a class is the only
 * thing that can be put on it; `tabIndex` and `aria-label` cannot. The fix is
 * upstream in AI Elements or in `use-stick-to-bottom`, and O2 is in the same
 * position for the same reason. It stays latent in practice because a grounded
 * notebook answer always carries citations — but "the fixture happens to have
 * a control in it" is not an accessibility guarantee.
 */
export const Boundary: Story = {
  args: FULL_ARGS,
  render: (args) => (
    <div className="flex h-full w-full">
      <div className="h-full w-1/2 border-e" data-testid="o13">
        <NotebookShell {...args} />
      </div>
      <div className="h-full w-1/2" data-testid="o11">
        <DocsShell
          areas={[{ id: "registry", label: "Registry", icon: <BookOpen aria-hidden /> }]}
          activeAreaId="registry"
          navSections={[
            {
              label: "Blocks",
              items: [
                { id: "notebook-shell", label: "Notebook shell" },
                { id: "chat-shell", label: "Chat shell" },
              ],
            },
          ]}
          activePageId="notebook-shell"
          title="Notebook shell"
          lede="Three panes: the sources you uploaded, a conversation about them, and what it produced."
          sections={[
            {
              id: "install",
              title: "Installation",
              body: <p>Run the add command and pick the registry item by name.</p>,
            },
          ]}
        />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const o13 = canvasElement.querySelector<HTMLElement>('[data-testid="o13"]')!;
    const o11 = canvasElement.querySelector<HTMLElement>('[data-testid="o11"]')!;

    // The tell: one takes input, the other does not.
    await expect(
      [
        `o13 composer ${o13.querySelector('[data-region="composer"]') !== null}`,
        `o11 composer ${o11.querySelector('[data-region="composer"]') !== null}`,
        `o11 nav ${o11.querySelector('[data-region="doc-nav"]') !== null}`,
      ].join(" · "),
    ).toBe("o13 composer true · o11 composer false · o11 nav true");

    // O13's left pane is cited, not navigated: the middle pane holds citation
    // buttons and the left pane holds no selectable row at all.
    await expect(
      [
        `citations ${o13.querySelectorAll('[data-slot="citation-ref"]').length}`,
        `sources ${o13.querySelectorAll('[data-slot="source-panel-item"]').length}`,
      ].join(" · "),
    ).toBe("citations 2 · sources 4");

    // What keeps this stream legal under `scrollable-region-focusable`: the
    // scroller is not the named, focusable element, so its only qualification
    // is the focusable content the caller happened to supply.
    const chat = o13.querySelector<HTMLElement>('[data-region="chat"]')!;
    const scroller = chat.querySelector<HTMLElement>(".overflow-y-auto")!;
    const focusables = Array.from(scroller.querySelectorAll<HTMLElement>(TAB_STOP));
    await expect(
      [
        `scroller is the named element ${scroller === chat}`,
        `scroller focusable ${scroller.tabIndex >= 0}`,
        `focusables ${focusables.length}`,
        `all citations ${focusables.every((el) => el.dataset.slot === "citation-ref")}`,
      ].join(" · "),
    ).toBe(
      "scroller is the named element false · scroller focusable false · focusables 2 · all citations true",
    );
  },
};

/* -------------------------------------------------------------------------
 * Beyond the eight: the mechanism the spec calls "two ends of one mechanism",
 * and the `CONTINUE.md` §8 entry that names it.
 * ---------------------------------------------------------------------- */

/**
 * The citation jump, measured end to end: pressing a marker in the middle pane
 * scrolls the matching row into view in the left pane and names the
 * destination in a live region. It is the sentence the spec leads with —
 * "citations in the middle pane resolve into the left pane, two ends of one
 * mechanism, not two features" — and until now nothing rendered it.
 *
 * **`CONTINUE.md` §8's K5 entry is accurate and still open**, checked rather
 * than cited: `source-panel.tsx` stamps `data-slot="source-panel-item"` and
 * `data-stage` on its rows and nothing that identifies the source, so the
 * shell finds the destination by index into the `sources` array it passed in.
 * A `data-source-id` on the row would make it an attribute lookup. Nothing is
 * added here — the fix belongs in K5.
 *
 * The assertion is deliberately written so that it holds under either
 * implementation: the row that gets scrolled is identified by the text it
 * renders, not by its index, so K5 growing an id and this shell switching to
 * it would leave this story green. `scrollIntoView` is intercepted for the
 * length of the click and restored, because the row it is called on is the
 * only observable the positional lookup produces.
 *
 * The marker is clicked programmatically rather than through a pointer, which
 * is what keeps K6's hover card out of it: the card opens on hover and on
 * focus, and a play that ends with a popup mid-open hands axe a moving target
 * (`story-conventions.md`, "Play functions"). The jump is a click handler, so
 * a click is the whole of the behaviour under test.
 */
export const CitationJump: Story = {
  args: { ...FULL_ARGS, onJumpToSource: fn() },
  play: async ({ args, canvasElement }) => {
    const marker = canvasElement.querySelectorAll<HTMLButtonElement>('[data-slot="citation-ref"]')[1];
    const status = canvasElement.querySelector<HTMLElement>(
      '[data-slot="notebook-shell-jump-status"]',
    )!;
    await expect(status.textContent).toBe("");

    const scrolled: Element[] = [];
    const original = Element.prototype.scrollIntoView;
    Element.prototype.scrollIntoView = function scrollIntoViewSpy(this: Element, ...rest) {
      scrolled.push(this);
      return original.apply(this, rest as Parameters<Element["scrollIntoView"]>);
    };
    try {
      marker.click();
    } finally {
      Element.prototype.scrollIntoView = original;
    }

    // The row that moved is the one the citation names, and it is a K5 row
    // rather than anything this shell drew.
    await expect(scrolled.length).toBe(1);
    await expect(scrolled[0]).toHaveAttribute("data-slot", "source-panel-item");
    await expect(scrolled[0].textContent).toContain("Kickoff call transcript");

    // A scroll nobody is watching is not an answer: the destination is named.
    await waitFor(async () => {
      await expect(status.textContent).toBe("Showing Kickoff call transcript in Sources");
    });
    await expect(args.onJumpToSource).toHaveBeenCalledWith("kickoff-call");
  },
};
