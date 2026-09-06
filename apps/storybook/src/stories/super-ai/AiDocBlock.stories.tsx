import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { Button } from "@/components/ui/button";
import { AiDocBlock } from "@/registry/super-ai/ai-doc-block";
import { ApprovalCard } from "@/registry/super-ai/approval-card";
import { AiDocBlockDocs } from "@/content/components/ai-doc-block.docs";
import { componentDocsPage } from "@/lib/component-docs-page";
import { focusTreatmentSignature, settledFocusRing } from "@/lib/focus-ring";

const DRAFT =
  "Revenue grew 14% quarter over quarter, driven mostly by the self-serve tier. Churn held flat at 2.1%. The number worth flagging is support volume, which rose 30% against a headcount that did not move.";

const meta: Meta<typeof AiDocBlock> = {
  title: "Super AI/Ai Doc Block",
  component: AiDocBlock,
  parameters: { layout: "centered", docs: { page: componentDocsPage(AiDocBlockDocs) } },
  decorators: [
    (Story) => (
      // Prose either side, because the whole claim of this component is that it
      // is a node in a document rather than a layer over one.
      <article className="text-foreground flex w-lg max-w-full flex-col gap-3 text-sm">
        <p>Here is where the quarter landed, ahead of Thursday&apos;s review.</p>
        <Story />
        <p>The rest of the document carries on below, exactly where it was.</p>
      </article>
    ),
  ],
  args: {
    label: "AI generated",
    children: <p>{DRAFT}</p>,
    onKeep: () => {},
    onEdit: () => {},
    onRegenerate: () => {},
    onDiscard: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof AiDocBlock>;

/**
 * Text still arriving. Announced through a live region, drawn with the word
 * "Streaming" rather than a tint, and the four verbs stay on screen disabled
 * so the footer does not resize when generation lands.
 */
export const Streaming: Story = {
  args: {
    state: "streaming",
    children: <p>Revenue grew 14% quarter over quarter, driven mostly by the self-serve</p>,
  },
};

/** The prose swaps for a labelled textarea in place. Keep commits the edit. */
export const Editable: Story = {
  args: {
    state: "editable",
    value: DRAFT,
  },
};

/**
 * The re-prompt affordance replaces the verb row inside the same block, so
 * "Regenerate" never names two controls at once and the block never moves.
 */
export const RePromptable: Story = {
  args: {
    state: "re-promptable",
    prompt: "Cut it to two sentences and lead with support volume.",
    onRePrompt: () => {},
    onRePromptCancel: () => {},
  },
};

/**
 * The handlers here are supplied in reverse — Discard first, Keep last — and
 * the block still renders Keep · Edit · Regenerate · Discard. Order belongs to
 * the component, the same rule F7 `approval-card` applies to its own verbs.
 */
export const ApprovalVerbs: Story = {
  args: {
    state: "approval-verbs",
    onDiscard: () => {},
    onRegenerate: () => {},
    onEdit: () => {},
    onKeep: () => {},
  },
};

/* -------------------------------------------------------------------------
 * Case stories — the situations a generated passage meets inside a real
 * document, as opposed to the four lifecycle states above. See
 * docs/design-system/story-conventions.md.
 *
 * All eight are true here, so there are no `case-skip` lines. That follows
 * from the shape: author-supplied prose and four author-supplied label props,
 * two genuine controlled pairs (`value`/`onValueChange` and
 * `prompt`/`onPromptChange`), between zero and five focus stops depending on
 * state, one keyframe animation, a verb row built out of a vendored
 * `ButtonGroup` that resolves its corners against the viewport, and a
 * near-twin — F7 `approval-card`, whose own `Boundary` already states this
 * pair's rule from the other side.
 * ---------------------------------------------------------------------- */

/** 72 and 180 characters, used wherever a slot is shown holding real prose. */
const LONG_LABEL = "Drafted by Claude Sonnet 4.5 from the Q3 metrics workbook on 4 September";
const LONG_VALUE =
  "Revenue grew 14% quarter over quarter, driven mostly by the self-serve tier, while churn held flat at 2.1% and support volume rose 30% against a headcount that did not move at all.";

/**
 * Right-to-left. The verb order is this component's contract — the same
 * contract F7 `approval-card` defends — so under `dir="rtl"` Keep has to paint
 * at the **right** edge and Discard at the left, with the attribution row and
 * the re-prompt row mirroring the same way.
 *
 * All three rows mirror for free, and the reason is worth recording:
 * `ai-doc-block.tsx` contains no physical inline utility anywhere. Grepped
 * over the source for `pl-`, `pr-`, `ml-`, `mr-`, `left-`, `right-`,
 * `border-l`, `border-r` and `text-left`: no match. Every row is `flex`,
 * `gap-*` and `items-center`, so there is nothing here for the logical-property
 * sweep in `CONTINUE.md` §8 to swap.
 *
 * One of the four glyphs is directional and does not mirror: `RotateCcw` keeps
 * curving anticlockwise. It is `aria-hidden` beside the visible word
 * "Regenerate", so nothing is misnamed and nothing is unreachable — the mild
 * form of the `reference-strip` / `frame-strip` finding in §8, where the
 * direction had reached the label and the callback payload too.
 *
 * **What does not mirror is the vendored `ButtonGroup`, and this is the second
 * measurement of it on a four-child row** — F7's `RTL` was the first, and the
 * two agree. `components/ui/button-group.tsx` joins children with
 * `*:data-slot:rounded-r-none`, `rounded-r-lg!`, `rounded-l-none` and
 * `border-l-0`, all resolved against the viewport rather than the writing
 * direction. Measured here in a 420px frame, reading the row as it paints
 * (Keep rightmost at 333–404, Discard leftmost at 76–161):
 *
 * - both **outer** corners are square — Keep's right 0px, Discard's left 0px;
 * - both extreme **seams** are rounded, and not to the same value: 8px where
 *   Keep meets Edit (the button's own radius) against 10px where Regenerate
 *   meets Discard (the group's `rounded-r-lg!` override);
 * - `border-l-0` strips the left border from every child after the first, so
 *   the group's outer edge under RTL — Discard, one of the two terminal verbs
 *   — reads `border-left-width: 0px`.
 *
 * The same four measurements in LTR are flush: Keep 8px on its outer left,
 * Discard 10px on its outer right, both seams square, and the one bordered
 * outer edge is Keep's.
 *
 * **One refinement F7's entry does not carry.** The missing outer border costs
 * nothing *visible* on this component, because Keep and Discard are
 * `variant="default"` and therefore `border-transparent` — measured
 * `rgba(0, 0, 0, 0)` against Edit and Regenerate's `oklch(0.922 0 0)`. It is
 * the radii that are seen. Worth knowing before the vendored fix is judged by
 * eye on this consumer.
 *
 * Not asserted below: pinning today's radii would pin the defect. The repair
 * is logical radius and border utilities in the vendored primitive, where one
 * change fixes every `ButtonGroup` in the registry.
 */
export const RTL: Story = {
  render: (args) => (
    <div dir="rtl" className="flex w-full flex-col gap-4">
      <section data-testid="rtl-verbs">
        <AiDocBlock {...args} state="approval-verbs" />
      </section>
      <section data-testid="rtl-reprompt">
        <AiDocBlock
          {...args}
          state="re-promptable"
          prompt="Cut it to two sentences and lead with support volume."
          onRePrompt={() => {}}
          onRePromptCancel={() => {}}
        />
      </section>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const verbs = within(canvas.getByTestId("rtl-verbs"));

    // 1. Mirrored, not merely reordered in the DOM: the first verb paints at
    //    the reading start, which under RTL is the right edge.
    const keep = verbs.getByRole("button", { name: "Keep" });
    const discard = verbs.getByRole("button", { name: "Discard" });
    await expect(keep.getBoundingClientRect().left).toBeGreaterThan(discard.getBoundingClientRect().left);

    // 2. The attribution row flips with it — the sparkle leads at the right,
    //    the words follow leftward.
    const header = canvas
      .getByTestId("rtl-verbs")
      .querySelector<HTMLElement>('[data-slot="ai-doc-block-header"]')!;
    const spark = header.querySelector("svg")!;
    const label = header.querySelector<HTMLElement>('[data-slot="ai-doc-block-label"]')!;
    await expect(spark.getBoundingClientRect().left).toBeGreaterThan(label.getBoundingClientRect().left);

    // 3. So does the re-prompt row: its primary action leads and Cancel
    //    trails, rather than Cancel jumping to the reading start.
    const reprompt = within(canvas.getByTestId("rtl-reprompt"));
    const submit = reprompt.getByRole("button", { name: "Regenerate" });
    const cancel = reprompt.getByRole("button", { name: "Cancel" });
    await expect(submit.getBoundingClientRect().left).toBeGreaterThan(cancel.getBoundingClientRect().left);
  },
};

/**
 * `prefers-reduced-motion`. Exactly one thing in this component animates — the
 * `Loader2` beside the word "Streaming" — and it was a live offender until
 * this wave. Fixed here as a mechanical repair (spec §3.4):
 * `motion-reduce:animate-none` beside the `animate-spin`, which is the plain
 * one-class form rather than the restated `data-open` pair, because nothing
 * here portals: the spinner is a bare lucide glyph in the card's own header,
 * not a Base UI popup surface.
 *
 * `vitest.config.ts` emulates reduce for every test, so the assertion reads
 * `animationName` back off the live element rather than trusting the class.
 * Measured against the unfixed source it read `"spin"`; it now reads `"none"`.
 *
 * **The reason suppressing it is safe is the component's own design rule, and
 * it is asserted below.** The spec's second decision — streaming is drawn in
 * words as well as shape — is what makes a frozen spinner harmless: the word
 * "Streaming" and the `role="status"` sentence both survive, so a
 * reduced-motion reader loses the motion and none of the meaning. That is the
 * opposite of E4 `preset-grid`, where §8 records that suppressing the pulse
 * left loading and failed tiles indistinguishable because neither carried text.
 *
 * Two things still move under reduce and are deliberately left alone. The
 * vendored `Button` carries `transition-all` and
 * `active:not-aria-[haspopup]:translate-y-px`, so every verb nudges a pixel
 * while pressed — §8 records that as a primitive-wide posture, not any one
 * component's. And the vendored `Textarea`'s `transition-colors` only
 * crossfades a border colour, which is `story-conventions.md` fact 3's
 * explicitly declined case: nothing travels, so suppressing it would document
 * no branch.
 */
export const ReducedMotion: Story = {
  args: {
    state: "streaming",
    children: <p>Revenue grew 14% quarter over quarter, driven mostly by the self-serve</p>,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const indicator = canvasElement.querySelector<HTMLElement>('[data-slot="ai-doc-block-streaming"]')!;

    // 1. The keyframe animation is off, read back rather than assumed.
    await expect(getComputedStyle(indicator.querySelector("svg")!).animationName).toBe("none");

    // 2. …and the state is still legible, because it was never the spin that
    //    carried it. Both channels survive the suppression.
    await expect(indicator).toHaveTextContent("Streaming");
    await expect(canvasElement.querySelector('[data-slot="ai-doc-block-status"]')!.textContent).toContain(
      "Generating this block",
    );

    // 3. The content slot says the same thing to a machine.
    await expect(canvasElement.querySelector('[data-slot="ai-doc-block-content"]')).toHaveAttribute(
      "aria-busy",
      "true",
    );

    // The verbs are present and inert — the footer holds its size, which is
    // the structural rule streaming exists to respect.
    await expect(canvas.getAllByRole("button")).toHaveLength(4);
  },
};

/**
 * The tab sequence, in each of the four states — and the fact worth having is
 * that the count is different in all four, because the component swaps what is
 * inside the block rather than adding to it.
 *
 * All four are rendered in one column and walked in **one continuous lap**,
 * which is what makes the streaming claim provable: the walk starts from
 * `<body>`, and if the first Tab lands on the *second* card's Keep then the
 * first card contributed nothing, without having to trust an attribute.
 * Twelve stops, and every Tab moves by exactly one control.
 *
 * - **`streaming` has no stops at all.** Every verb is natively `disabled`, so
 *   a keyboard user goes from the paragraph above straight to the one below.
 * - **`approval-verbs` is four**, one per supplied handler, in the fixed
 *   order. `ButtonGroup` is a plain `role="group"`, so this is four Tab
 *   presses and the arrow keys do nothing — no roving tabindex.
 * - **`editable` is five**: the textarea comes first, because the content slot
 *   precedes the verb row in the DOM as well as on screen.
 * - **`re-promptable` is three**: the instruction field, its Regenerate, and
 *   Cancel. The four verbs are gone, not disabled, so Keep and Discard are
 *   unreachable while an instruction is being written.
 *
 * **The disabled-verb trap, measured here.** `story-conventions.md` warns that
 * Base UI leaves `tabindex="0"` on a natively-disabled button, and this
 * component is an instance: all four streaming verbs read `disabled` *and*
 * `tabindex="0"`, so a `[tabindex]:not([tabindex="-1"])` query would count
 * four inert controls. `button:not([disabled])` is what the walk queries, and
 * it returns zero. Calling `.focus()` on one is also a no-op — measured.
 *
 * **A visible focus treatment at every stop, proved as a difference.** Both
 * checks are used, because they answer different questions: `settledFocusRing`
 * waits out the vendored `Button`'s `transition-all` fade and asks whether
 * anything is painted, while the signature differential asks whether focus is
 * what painted it. Resting signatures are taken before the walk begins —
 * measured `box-shadow: none` on every stop — and each stop is then asserted
 * to differ from its own baseline. Both pass everywhere here: the verbs settle
 * to `oklab(0.708 0 0 / 0.5) 0px 0px 0px 3px` with `border-color` moving to
 * `oklch(0.708 0 0)`, and the two textareas do the same. That is worth stating
 * because it is not the default: §9's wave 1 found `media-prompt-bar`'s
 * textareas painting nothing at all, so the vendored `Textarea` having a real
 * ring is a property of *this* call site not overriding it, not of the
 * primitive being safe.
 *
 * **Recorded, not asserted — the block loses focus on every state change it
 * asks for.** Measured with a host that flips `state` in `onRegenerate`, the
 * way the docs module tells callers to: focus is on the Regenerate button, the
 * verb row unmounts, and `document.activeElement` is `<body>`. The next Tab
 * restarts from the top of the page, in the middle of a document the user was
 * editing. Cancel is the mirror. The docs module already carries these notes;
 * this is the measurement behind them, and nothing below pins it.
 */
export const KeyboardOrder: Story = {
  render: (args) => (
    <div className="flex w-full flex-col gap-4">
      <section data-testid="ko-streaming">
        <AiDocBlock {...args} state="streaming" />
      </section>
      <section data-testid="ko-verbs">
        <AiDocBlock {...args} state="approval-verbs" />
      </section>
      <section data-testid="ko-editable">
        <AiDocBlock {...args} state="editable" value="Revenue grew 14%." />
      </section>
      <section data-testid="ko-reprompt">
        <AiDocBlock
          {...args}
          state="re-promptable"
          prompt="Lead with support volume."
          onRePrompt={() => {}}
          onRePromptCancel={() => {}}
        />
      </section>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const cardIn = (id: string) =>
      canvas.getByTestId(id).querySelector<HTMLElement>('[data-slot="ai-doc-block"]')!;

    // The slots repeat across cards — two of them own a "Keep" — so the label
    // carries the enclosing section as well, or a lap that focused the wrong
    // card's identically-named verb would read as correct.
    const nameOf = (el: Element | null) =>
      el === null
        ? "nothing"
        : `${el.closest("[data-testid]")?.getAttribute("data-testid") ?? "outside"}/${el.getAttribute("data-slot") ?? el.tagName.toLowerCase()}`;

    // 1. streaming — four verbs on screen, and the trap that makes counting
    //    them by tabindex wrong. All four are natively disabled *and* carry
    //    tabindex="0", so `[tabindex]:not([tabindex="-1"])` would find four
    //    controls that cannot be reached; `button:not([disabled])` finds none.
    const streaming = cardIn("ko-streaming");
    const inert = Array.from(streaming.querySelectorAll<HTMLElement>("button"));
    await expect(inert).toHaveLength(4);
    for (const el of inert) {
      await expect(el).toBeDisabled();
      await expect(el).toHaveAttribute("tabindex", "0");
    }
    await expect(streaming.querySelectorAll("button:not([disabled])")).toHaveLength(0);
    inert[0].focus();
    await expect(document.activeElement).not.toBe(inert[0]);

    // 2. One continuous lap over all four cards, from `<body>`. The first Tab
    //    landing on the second card's Keep is the streaming claim: that card
    //    contributes no stop.
    const verbs = within(canvas.getByTestId("ko-verbs"));
    const editable = within(canvas.getByTestId("ko-editable"));
    const rePrompt = within(canvas.getByTestId("ko-reprompt"));

    await expect(rePrompt.queryByRole("button", { name: "Keep" })).toBeNull();

    const expected: HTMLElement[] = [
      verbs.getByRole("button", { name: "Keep" }),
      verbs.getByRole("button", { name: "Edit" }),
      verbs.getByRole("button", { name: "Regenerate" }),
      verbs.getByRole("button", { name: "Discard" }),
      editable.getByRole("textbox", { name: "Edit generated text" }),
      editable.getByRole("button", { name: "Keep" }),
      editable.getByRole("button", { name: "Edit" }),
      editable.getByRole("button", { name: "Regenerate" }),
      editable.getByRole("button", { name: "Discard" }),
      rePrompt.getByRole("textbox", { name: "What should change?" }),
      rePrompt.getByRole("button", { name: "Regenerate" }),
      rePrompt.getByRole("button", { name: "Cancel" }),
    ];

    // Resting signatures, before anything is focused — box-shadow `none` on
    // every stop, which is what makes each post-focus read a difference rather
    // than an absolute.
    const resting = new Map(expected.map((el) => [el, focusTreatmentSignature(el)]));

    for (const stop of expected) {
      await userEvent.tab();
      await expect(nameOf(document.activeElement)).toBe(nameOf(stop));
      await expect(streaming.contains(document.activeElement)).toBe(false);
      await expect(stop.matches(":focus-visible")).toBe(true);
      await settledFocusRing(stop, waitFor);
      // …and the treatment is one focus caused, not one the element always
      // paints.
      await waitFor(() => expect(focusTreatmentSignature(stop)).not.toBe(resting.get(stop)));
    }

    // 3. Nothing traps: one more Tab leaves the last block.
    await userEvent.tab();
    await expect(cardIn("ko-reprompt").contains(document.activeElement)).toBe(false);
  },
};

/**
 * Both text fields are strictly controlled, and this shell holds them the hard
 * way: the host records what the block asked for and applies it only when told
 * to.
 *
 * There is no internal state anywhere in the component — `value={value ?? ""}`
 * and `value={prompt ?? ""}` go straight to the DOM — so a caller who reads
 * `onValueChange` but never feeds the result back gets a field that cannot be
 * typed into at all. The docs module's last pitfall asks for the pair and says
 * why; the first assertion below is what half-wiring it looks like.
 *
 * What the play function proves, in order: typing does not move the rendered
 * value; the callback still fires with the whole next string, which is the
 * payload a host has to apply; a re-render with an unchanged `value` leaves
 * the field exactly where it was; and applying the request moves it.
 *
 * **One keystroke is asserted, and the reason is a fact about strictly
 * controlled fields worth writing down.** Because every `onChange` computes
 * its payload from the *prop*, a run of typing against a host that has not
 * applied anything yet produces a payload that is the prop plus one character,
 * every time — measured in an earlier pass of this story, typing
 * `" Churn flat."` into a field holding `"Revenue grew 14%."` and reading back
 * `"Revenue grew 14%.."`: the prop, plus the final full stop, and nothing
 * else. Eleven characters went nowhere. A host that debounces
 * `onValueChange`, or drops one payload, does not lose a keystroke: it loses
 * everything typed since the last one it applied.
 *
 * **The re-prompt half carries a sharper fact.** `onRePrompt` is called with
 * `prompt ?? ""` — the *prop*, never anything the field holds — so a host that
 * renders the field but ignores `onPromptChange` submits an empty instruction,
 * and the block has no guard against it: Regenerate is not disabled on an
 * empty prompt. Both halves are asserted: the submit payload equals the prop,
 * and pressing Regenerate with an empty prompt still calls the handler.
 * Recorded rather than fixed — whether an empty instruction should be
 * submittable is a design decision, not drift.
 */
export const Controlled: Story = {
  render: () => <ControlledShell />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const editor = canvas.getByRole("textbox", { name: "Edit the Q3 summary block" });

    // 1. Interaction alone does not move the rendered value.
    await expect(editor).toHaveValue("Revenue grew 14%");
    await userEvent.type(editor, ".");
    await expect(editor).toHaveValue("Revenue grew 14%");

    // 2. The callback still fired, with the whole next string rather than a
    //    delta — which is what a host needs in order to apply it.
    await expect(canvas.getByTestId("requested")).toHaveTextContent("Revenue grew 14%.");

    // 3. A re-render with an unchanged `value` holds the field fixed. Prove
    //    the re-render happened first.
    await expect(canvas.getByTestId("render-pass")).toHaveTextContent("1");
    await userEvent.click(canvas.getByRole("button", { name: "Re-render" }));
    await expect(canvas.getByTestId("render-pass")).toHaveTextContent("2");
    await expect(editor).toHaveValue("Revenue grew 14%");

    // 4. The payload was sufficient to apply the change.
    await userEvent.click(canvas.getByRole("button", { name: "Apply" }));
    await waitFor(() => expect(editor).toHaveValue("Revenue grew 14%."));

    // 5. The instruction field behaves the same way…
    const prompt = canvas.getByRole("textbox", { name: "What should change?" });
    await expect(prompt).toHaveValue("");
    await userEvent.type(prompt, "Shorter");
    await expect(prompt).toHaveValue("");

    // 6. …and Regenerate submits the *prop*, not what was typed. With no
    //    `onPromptChange` applied, that is the empty string — and nothing
    //    stops it being submitted.
    const onRePrompt = canvas.getByTestId("reprompt-payload");
    await userEvent.click(canvas.getByRole("button", { name: "Regenerate" }));
    await expect(onRePrompt).toHaveTextContent("submitted:''");
  },
};

function ControlledShell() {
  const [applied, setApplied] = React.useState("Revenue grew 14%");
  const [requested, setRequested] = React.useState<string | null>(null);
  const [submitted, setSubmitted] = React.useState<string | null>(null);
  const [pass, setPass] = React.useState(1);

  return (
    <div className="flex w-full flex-col gap-4">
      <AiDocBlock
        state="editable"
        label="AI generated"
        editLabel="Edit the Q3 summary block"
        value={applied}
        onValueChange={setRequested}
        onKeep={() => {}}
      />

      <AiDocBlock
        state="re-promptable"
        label="AI generated"
        prompt=""
        onPromptChange={() => {}}
        onRePrompt={(next) => setSubmitted(next)}
      >
        <p>{DRAFT}</p>
      </AiDocBlock>

      <div className="flex flex-col gap-3">
        <dl className="text-foreground grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs">
          <dt>value prop</dt>
          <dd data-testid="applied">{applied}</dd>
          <dt>last onValueChange</dt>
          <dd data-testid="requested">{requested === null ? "—" : requested}</dd>
          <dt>last onRePrompt</dt>
          <dd data-testid="reprompt-payload">{submitted === null ? "—" : `submitted:'${submitted}'`}</dd>
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
 * Four label props are optional and all four have defaults, so the empty
 * string is reachable on every one of them — and it lands differently each
 * time. Two are rendered here; the third is documented rather than rendered,
 * for a measured reason.
 *
 * 1. **`label=""` deletes the attribution and nothing complains.** The
 *    component's fourth design rule is that text, never colour, is what marks
 *    a passage as generated — its own pitfall list says a border does not
 *    survive a high-contrast theme or an export. An empty `label` removes that
 *    text and leaves the frame, which is exactly the state the rule exists to
 *    forbid, reached through the public API. Measured asymmetry, asserted
 *    below: a sighted reader is left with a sparkle and no words, while the
 *    `sr-only` `role="status"` line still says the block is generated. So the
 *    two audiences disagree about whether this passage is attributed, and axe
 *    raises nothing — the span is not a control.
 * 2. **`rePromptLabel=""` unnames the instruction field and no gate says so.**
 *    The `<label>` renders with no text and zero height, so the field's only
 *    remaining candidate is its `placeholder` — the precise failure the
 *    component's own source comment rejects ("A real label, not a
 *    placeholder"), reached by supplying an empty string rather than by
 *    writing the wrong markup. **The two name computations in this repo
 *    disagree about the result, which is the finding.** Measured both ways in
 *    this file: axe raises nothing on this field, while
 *    `dom-accessibility-api` — what `getByRole(…, { name })` uses, and the
 *    implementation of the accessible-name spec these stories query through —
 *    computes an empty name, asserted below by failing to find the field under
 *    either candidate. So the a11y gate is green on a field that testing
 *    cannot address by name. The only structural difference between this field
 *    and case 3, which axe fails outright, is that this one carries a
 *    placeholder. New shape for §8's empty-string class: silent *because* a
 *    fallback happened to exist on one field and not the next.
 * 3. **`editLabel=""` is a red gate, so it is described instead of rendered.**
 *    It renders `aria-label=""` on the edit textarea, which has no placeholder
 *    to fall back to, and axe fails it outright: "Form elements must have
 *    labels (label) — aria-label attribute does not exist or is empty."
 *    Measured in this file before the story was cut down. Same shape as H4
 *    `transcript-editor`'s empty word token and H7 `stem-mixer`'s `label=""`:
 *    a default parameter that an empty string defeats rather than falls back
 *    through.
 *
 * A fourth case is not a label at all and is worth seeing beside them:
 * **supplying no handlers** leaves an empty `role="group"` still named
 * "Generated block actions" — a named region promising four verbs and
 * containing none. F7 `approval-card` measured the identical shape, which
 * makes it a property of the shared verb-row rule rather than of either
 * component.
 */
export const EmptyLabel: Story = {
  render: (args) => (
    <div className="flex w-full flex-col gap-4">
      <section data-testid="el-nolabel">
        <AiDocBlock {...args} state="approval-verbs" label="" />
      </section>
      <section data-testid="el-noprompt-label">
        <AiDocBlock {...args} state="re-promptable" prompt="" rePromptLabel="" onRePrompt={() => {}} />
      </section>
      <section data-testid="el-nohandlers">
        <AiDocBlock
          state="approval-verbs"
          label="AI generated"
          onKeep={undefined}
          onEdit={undefined}
          onRegenerate={undefined}
          onDiscard={undefined}
        >
          <p>{DRAFT}</p>
        </AiDocBlock>
      </section>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // 1. The attribution is gone for one audience and intact for the other.
    const noLabel = canvas.getByTestId("el-nolabel");
    await expect(noLabel.querySelector('[data-slot="ai-doc-block-label"]')!.textContent).toBe("");
    await expect(noLabel.querySelector('[data-slot="ai-doc-block-status"]')!.textContent).toContain(
      "generated",
    );

    // 2. The instruction field loses its name. The label element is still
    //    there, still associated, and paints nothing…
    const noPromptLabel = canvas.getByTestId("el-noprompt-label");
    const emptyLabel = noPromptLabel.querySelector<HTMLElement>('[data-slot="label"]')!;
    const field = noPromptLabel.querySelector<HTMLElement>('[data-slot="ai-doc-block-prompt"]')!;
    await expect(emptyLabel.textContent).toBe("");
    await expect(emptyLabel.getAttribute("for")).toBe(field.id);
    await expect(emptyLabel.getBoundingClientRect().height).toBe(0);

    // …leaving the placeholder as the field's only candidate name. axe accepts
    // that and stays silent (this story is axe-gated and green); the name
    // computation testing-library uses does not, and the field is addressable
    // by neither the label's text nor the placeholder's.
    await expect(field.getAttribute("placeholder")).toBe("Make it shorter and drop the second example.");
    const named = within(noPromptLabel);
    await expect(named.queryByRole("textbox", { name: "What should change?" })).toBeNull();
    await expect(
      named.queryByRole("textbox", { name: "Make it shorter and drop the second example." }),
    ).toBeNull();
    await expect(named.getAllByRole("textbox")).toHaveLength(1);

    // 3. A labelled group with nothing in it.
    const emptyGroup = within(canvas.getByTestId("el-nohandlers")).getByRole("group", {
      name: "Generated block actions",
    });
    await expect(emptyGroup.querySelectorAll("button")).toHaveLength(0);
  },
};

/**
 * A 72-character attribution line, and a paragraph of real length in each of
 * the two fields — which is where the vendored `Textarea`'s floor turns out to
 * hide the first two lines of everything anyone types.
 *
 * **`min-h-16` absorbs two wrapped lines before the field grows at all.** The
 * §9 wave-1 finding, measured here at the component's own width (480px, 14px
 * type, 20px line box): `"Short."` and a 76-character value that wraps onto a
 * second line render at **exactly the same 64px**, because two lines plus
 * padding come to 58px and the floor is 64. The third line is the first one
 * that costs height — the 180-character value below measures 78px. So the
 * field looks identically empty whether it holds six characters or seventy,
 * and `field-sizing-content` means it never scrolls: `scrollHeight` equals
 * `clientHeight` in all three cases, so nothing is ever hidden, only
 * unheralded. The re-prompt field overrides the floor to `min-h-12` (48px) and
 * has the same shape one line lower.
 *
 * **The attribution line wraps rather than truncating, and the streaming
 * indicator survives it.** The header is `flex` with the default `nowrap`, so
 * a 72-character label was the case worth measuring: it takes two lines
 * (374px wide, 32px tall), the "Streaming" pair stays beside it on one line,
 * and the header's `scrollWidth` equals its `clientWidth` — nothing is clipped
 * and nothing overflows. There is no `truncate` and no `title` anywhere in
 * this component, which is the right call for an attribution that has to
 * survive an export, but it does mean a long label grows the block before the
 * reader has agreed to read anything.
 *
 * The prose itself has no fold: `Card` is `overflow-hidden`, so anything the
 * card could not grow for would be clipped silently rather than scrolled.
 * Asserted below that it does grow — `scrollHeight` equals `clientHeight` with
 * a 180-character paragraph in the content slot.
 */
export const LongContent: Story = {
  render: (args) => (
    <div className="flex w-full flex-col gap-4">
      <section data-testid="lc-label">
        <AiDocBlock {...args} state="streaming" label={LONG_LABEL} />
      </section>
      <section data-testid="lc-short">
        <AiDocBlock {...args} state="editable" value="Short." />
      </section>
      <section data-testid="lc-two">
        <AiDocBlock
          {...args}
          state="editable"
          value="Revenue grew 14% quarter over quarter, driven mostly by the self-serve tier."
        />
      </section>
      <section data-testid="lc-three">
        <AiDocBlock {...args} state="editable" value={LONG_VALUE} />
      </section>
      <section data-testid="lc-prose">
        <AiDocBlock {...args} state="approval-verbs">
          <p>{LONG_VALUE}</p>
        </AiDocBlock>
      </section>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const editorIn = (id: string) =>
      canvas.getByTestId(id).querySelector<HTMLElement>('[data-slot="ai-doc-block-editor"]')!;

    // 1. The floor hides the first two lines: six characters and seventy-four
    //    render at the same height.
    const short = editorIn("lc-short");
    const two = editorIn("lc-two");
    const three = editorIn("lc-three");
    await expect(getComputedStyle(short).minHeight).toBe("64px");
    await expect(Math.round(two.getBoundingClientRect().height)).toBe(
      Math.round(short.getBoundingClientRect().height),
    );

    // 2. The third line is the first that costs anything.
    await expect(three.getBoundingClientRect().height).toBeGreaterThan(two.getBoundingClientRect().height);

    // 3. Nothing scrolls inside any of them — `field-sizing-content` grows the
    //    box instead, so long text is unheralded rather than hidden.
    for (const el of [short, two, three]) {
      await expect(el.scrollHeight).toBe(el.clientHeight);
    }

    // 4. A long attribution wraps and does not clip; the streaming pair holds
    //    its place beside it in the same nowrap row.
    const header = canvas
      .getByTestId("lc-label")
      .querySelector<HTMLElement>('[data-slot="ai-doc-block-header"]')!;
    const label = header.querySelector<HTMLElement>('[data-slot="ai-doc-block-label"]')!;
    await expect(getComputedStyle(label).textOverflow).toBe("clip");
    await expect(getComputedStyle(label).whiteSpace).toBe("normal");
    await expect(label.getBoundingClientRect().height).toBeGreaterThan(
      Number.parseFloat(getComputedStyle(label).lineHeight) * 1.5,
    );
    await expect(header.scrollWidth).toBeLessThanOrEqual(header.clientWidth);
    await expect(header.querySelector('[data-slot="ai-doc-block-streaming"]')).toHaveTextContent("Streaming");

    // 5. The card grows for the prose rather than clipping it.
    const card = canvas.getByTestId("lc-prose").querySelector<HTMLElement>('[data-slot="ai-doc-block"]')!;
    await expect(card.scrollHeight).toBe(card.clientHeight);
  },
};

/**
 * 375px, in the two arrangements that fill the row: four verbs, and the
 * re-prompt affordance that replaces them.
 *
 * **The verb row fits with 15px to spare, and that number is the story.**
 * Measured here: the card is 375px, `--card-spacing` takes 16px from either
 * side, and Keep 71px · Edit 63px · Regenerate 109px · Discard 86px come to
 * 328px of the 343px available. Fifteen pixels, against a 63px shortest verb.
 * So "four verbs, always in the same order" is load-bearing on a phone for a
 * reason beyond muscle memory — there is no room for a fifth, and the
 * component has no way to tell a caller so.
 *
 * **What happens if it does not fit is the fact worth having.** `Card` is
 * `overflow-hidden` and the vendored `Button` is `whitespace-nowrap shrink-0`
 * inside a `w-fit` group, so an over-wide verb row does not scroll and does
 * not wrap — it is *clipped*, with no scrollbar and no affordance. On a block
 * whose verbs include Discard, that means a terminal verb can leave the screen
 * silently. The assertion below therefore measures the group's trailing edge
 * against the card's rather than only checking that the page does not scroll
 * sideways. Localisation reaches it without anything unusual: German turns
 * Keep into "Beibehalten", Regenerate into "Neu generieren" and Discard into
 * "Verwerfen", which is well past 15px of slack.
 *
 * **The wrapper constrains width, not the breakpoint** (`story-conventions.md`
 * fact 2), and here that is not merely a caveat — it changes a measurement.
 * The vendored `Textarea` carries `md:text-sm`, and the gate's chromium is
 * 1200px wide, so the field renders at 14px inside this 375px box where a real
 * phone would give it 16px. Every height in `LongContent` is therefore the
 * desktop-typography one, and the same instruction takes *more* lines on an
 * actual phone than it does here.
 */
export const Mobile: Story = {
  render: (args) => (
    <div className="flex w-full flex-col gap-4">
      <div className="w-[375px] max-w-full" data-testid="viewport-verbs">
        <AiDocBlock {...args} state="approval-verbs" />
      </div>
      <div className="w-[375px] max-w-full" data-testid="viewport-reprompt">
        <AiDocBlock
          {...args}
          state="re-promptable"
          prompt="Cut it to two sentences and lead with support volume."
          onRePrompt={() => {}}
          onRePromptCancel={() => {}}
        />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const verbsFrame = canvas.getByTestId("viewport-verbs");
    const card = verbsFrame.querySelector<HTMLElement>('[data-slot="ai-doc-block"]')!;
    const group = verbsFrame.querySelector<HTMLElement>('[data-slot="ai-doc-block-verbs"]')!;

    // 1. No horizontal scroll at 375px — measured on the frame, not on the
    //    meta decorator's centring column.
    await expect(verbsFrame.scrollWidth).toBeLessThanOrEqual(verbsFrame.clientWidth);

    // 2. …and, more usefully, nothing is clipped by the card's
    //    overflow-hidden: all four verbs sit inside its box, Discard included.
    await expect(group.getBoundingClientRect().right).toBeLessThanOrEqual(card.getBoundingClientRect().right);
    await expect(group.querySelectorAll("button")).toHaveLength(4);
    await expect(group.scrollWidth).toBe(group.clientWidth);

    // 3. The re-prompt arrangement is the wider one per control and still
    //    fits, because the field is full-width and the two buttons wrap into
    //    a plain flex row rather than a joined group.
    const rePromptFrame = canvas.getByTestId("viewport-reprompt");
    await expect(rePromptFrame.scrollWidth).toBeLessThanOrEqual(rePromptFrame.clientWidth);
    const rePromptCard = rePromptFrame.querySelector<HTMLElement>('[data-slot="ai-doc-block"]')!;
    await expect(rePromptCard.scrollWidth).toBe(rePromptCard.clientWidth);
  },
};

/**
 * Against F7 `approval-card`, the near-twin most likely to be rebuilt by
 * accident. Both hold a generated artifact behind four verbs in a fixed order,
 * both keep the verbs on screen while the decision is pending, and from a
 * screenshot they are the same idea. F7's own `Boundary` renders this pair
 * from the other side; this is the same rule stated from here, so a reader
 * arriving at either file finds it.
 *
 * `CONTINUE.md` §8 and this component's file header record why K1 could not
 * simply compose F7: F7's root **is** a `Card` carrying its own title, summary,
 * detail fold and undo model, so nesting it inside a document block would
 * invert the relationship — the block is the thing being approved, not a
 * payload inside an approval surface — and it would draw two frames. K1 copies
 * the *rule* (a fixed verb array the component owns, iterated as-is) rather
 * than the component, and renames the verbs to suit prose: you Keep a
 * paragraph, you do not Confirm it.
 *
 * The choosing rule:
 *
 * - **K1 `ai-doc-block`** when the artifact is *right there*, inline in a
 *   document the user already owns. Edit opens the prose in place, so it needs
 *   no summary and no fold — the thing you are deciding about is the thing you
 *   are reading.
 * - **F7 `approval-card`** when the artifact is *elsewhere*. Edit and
 *   Regenerate hand you back to it, which only makes sense if there is
 *   somewhere to be handed back to, and the summary plus the fold exist
 *   because you cannot see the artifact from here.
 * - **K2 `inline-generate-popup`** when there is no artifact yet. It is
 *   anchored to the caret and it generates without committing; its output
 *   arrives as one of these blocks. It is a popover with nothing to show until
 *   it is opened, so it is named rather than rendered beside the two resting
 *   surfaces here.
 *
 * The tell, in one line: if the passage would survive a save with the chrome
 * stripped off, it is a doc block; if the chrome *is* the thing on screen, it
 * is an approval card.
 */
export const Boundary: Story = {
  render: () => (
    <div className="flex w-full flex-col gap-6">
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

      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">
          F7 approval card — the artifact is elsewhere; Edit and Regenerate hand you back to it
        </p>
        <ApprovalCard
          title="Send the Q3 summary to the team"
          summary="Three paragraphs drafted from last quarter's metrics, ready to post in #general."
          detail={
            <p>
              Revenue grew 14% quarter over quarter, driven mostly by the self-serve tier. Churn held flat at
              2.1%.
            </p>
          }
          onConfirm={() => {}}
          onEdit={() => {}}
          onRegenerate={() => {}}
          onSkip={() => {}}
        />
      </section>
    </div>
  ),
};
