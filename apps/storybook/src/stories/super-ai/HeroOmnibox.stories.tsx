import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { expect, userEvent, within } from "storybook/test";

import { Button } from "@/components/ui/button";
import { GenSettingsBar, GenSettingsItem } from "@/registry/super-ai/gen-settings-bar";
import { HeroOmnibox } from "@/registry/super-ai/hero-omnibox";
import { MediaPromptBar } from "@/registry/super-ai/media-prompt-bar";
import { SuggestionChip, SuggestionChips } from "@/registry/super-ai/suggestion-chips";
import { HeroOmniboxDocs } from "@/content/components/hero-omnibox.docs";
import { componentDocsPage } from "@/lib/component-docs-page";
import { expectPerceptibleFocus } from "@/lib/focus-treatment";

const MODES = [
  { value: "ask", label: "Ask" },
  { value: "build", label: "Build" },
];

const MODELS = [
  { value: "veo-3.1", label: "Veo 3.1" },
  { value: "sora-2", label: "Sora 2" },
];

const meta: Meta<typeof HeroOmnibox> = {
  title: "Super AI/Hero Omnibox",
  component: HeroOmnibox,
  parameters: { layout: "centered", docs: { page: componentDocsPage(HeroOmniboxDocs) } },
};

export default meta;
type Story = StoryObj<typeof HeroOmnibox>;

export const Idle: Story = {
  args: {
    state: "idle",
    modes: MODES,
    mode: "ask",
    models: MODELS,
    model: "veo-3.1",
    cost: 5,
    onSubmit: () => {},
  },
};

export const Focused: Story = {
  args: {
    ...Idle.args,
    state: "focused",
  },
};

export const Generating: Story = {
  args: {
    ...Idle.args,
    state: "generating",
    onStop: () => {},
  },
};

export const Locked: Story = {
  args: {
    state: "locked",
    modes: MODES,
    mode: "ask",
    lockedTitle: "You've hit your plan's limit",
    lockedDescription: "Upgrade to keep generating.",
    lockedCtaLabel: "Upgrade",
    onUnlock: () => {},
  },
};

/* -------------------------------------------------------------------------
 * Case stories — the situations this component meets in a product, as opposed
 * to the four declared states above. See
 * docs/design-system/story-conventions.md.
 *
 * Seven of the eight are written. The one that is not:
 *
 * // case-skip: ReducedMotion — measured: nothing in this tree animates under reduce, and the one popup that could is already held still
 * Two candidates and both are dead ends. The card's own `transition-colors`
 * crossfades a border and a ring colour — it moves nothing, which is the
 * `reset-affordance` case in mechanical fact 3, so suppressing it would
 * document no branch. The composed model `Select` is the interesting one:
 * `CONTINUE.md` §9 lists `hero-omnibox` among the 33 components whose popup
 * surface keyframe-animates and where the plain `motion-reduce:animate-none`
 * would be inert. That is not true at this call site. `SelectContent` defaults
 * to `alignItemWithTrigger`, so the popup renders `data-align-trigger="true"`
 * and the primitive's own `data-[align-trigger=true]:animate-none` already
 * beats `data-open:animate-in` on source order — opened under emulated reduce
 * its `animationName` reads back `"none"`. Adding the restated
 * `motion-reduce:data-open:animate-none` form here would be a class that
 * changes nothing, and a story asserting `"none"` would pass for a reason that
 * has nothing to do with the media feature. Left alone deliberately; §9's list
 * overcounts by this entry.
 * ---------------------------------------------------------------------- */

/**
 * Right-to-left. The card itself mirrors cleanly and that is worth seeing
 * rather than assuming: it carries no physical padding of its own (`p-2`, and
 * `px-1` on the field), the toolbar's `justify-between` is direction-aware, so
 * attach/model/cost move to the right edge and send to the left. Two details
 * that survive the flip on purpose — the send glyph is an `ArrowUp`, vertical
 * and therefore never mirror-wrong, and `cost-chip` pins its amount to
 * `dir="ltr"` so "5 credits" does not reorder inside an RTL line.
 *
 * **Defect, recorded not fixed.** The model select is the one thing that does
 * not flip. Measured under `dir="rtl"`: the trigger computes `padding-left:
 * 10px` / `padding-right: 8px` — the wider inline-start padding lands on the
 * visual left — and the value inside it computes `text-align: left`, so the
 * model name is left-aligned in a right-to-left control. Both come from
 * `components/ui/select.tsx`'s physical `pr-2 pl-2.5` and `text-left`, a
 * shared shadcn primitive under every select in the registry. Swapping those
 * for logical properties is a registry-wide change, not something one
 * component's story retrofit should land, so it is written down here rather
 * than fixed. Nothing in `hero-omnibox.tsx` itself needs a swap.
 */
export const RTL: Story = {
  args: { ...Idle.args },
  render: (args) => (
    <div dir="rtl" className="w-full">
      <HeroOmnibox {...args} />
    </div>
  ),
};

/**
 * Tab traversal. Two laps, because this component's tab order changes shape
 * with its content: send is `disabled` while the field is empty, so an empty
 * composer is four stops and ends on the model select, and the same composer
 * with a prompt in it is five and ends on send. A keyboard user who tabs to
 * the end of an empty omnibox never meets the control the whole surface is
 * for. Both laps are asserted, so neither can drift unnoticed.
 *
 * **Defect, recorded not fixed: the prompt field paints no focus indicator.**
 * `hero-omnibox.tsx` overrides the base `Textarea` with `border-none` and
 * `focus-visible:ring-0`, so the field's ring is present in colour and zero in
 * width — measured `oklab(0.708 0 0 / 0.5) 0px 0px 0px 0px` while focused and
 * genuinely `:focus-visible`. The card's visible focus treatment
 * (`border-ring ring-3`) hangs off `state === "focused"`, which is a prop the
 * consumer drives, not `:focus-within`, so in `idle` — the state a page
 * actually mounts in — tabbing into the composer shows nothing at all. The
 * play function asserts the ring on the four framed controls and deliberately
 * asserts nothing either way about the textarea: pinning the current
 * behaviour would make the fix a test failure. The likely fix is
 * `focus-within` on the card rather than a ring on a borderless field, which
 * is a visual decision for one integrator.
 *
 * The ring check is `expectPerceptibleFocus`, which is where this file's own
 * hand-rolled version ended up: the measurement that found the textarea — a
 * zero-width ring is still a full box-shadow *string*, so `boxShadow !==
 * "none"` cannot tell 3px from 0px — is now the shared helper's, along with
 * the settle it also needed (`Button` carries `transition-all`, so reading
 * `getComputedStyle` the instant `tab()` resolves returns the pre-transition
 * `0px` ring and fails for a reason that has nothing to do with the
 * component).
 */
export const KeyboardOrder: Story = {
  args: { ...Idle.args },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector('[data-slot="hero-omnibox"]') as HTMLElement;
    const slotOf = (el: Element | null) =>
      el === null ? "nothing" : (el.getAttribute("data-slot") ?? el.tagName.toLowerCase());

    const walk = async () => {
      (document.activeElement as HTMLElement | null)?.blur();
      const stops: string[] = [];
      for (let lap = 0; lap < 8; lap += 1) {
        await userEvent.tab();
        const focused = document.activeElement as HTMLElement | null;
        if (!focused || !root.contains(focused)) break;
        const id = slotOf(focused);
        stops.push(id);
        await expect(`${id} focusVisible=${focused.matches(":focus-visible")}`).toBe(
          `${id} focusVisible=true`,
        );
        // The field is the recorded exception — see the description.
        if (focused.tagName !== "TEXTAREA") {
          await expectPerceptibleFocus(focused, { label: id });
        }
      }
      return stops;
    };

    await expect(await walk()).toEqual([
      "mode-tabs-item",
      "hero-omnibox-textarea",
      "hero-omnibox-attach",
      "select-trigger",
    ]);

    const field = canvas.getByRole("textbox", { name: "What can I help you with?" });
    field.focus();
    await userEvent.paste("Summarize the attached earnings call");
    await expect(canvas.getByRole("button", { name: "Send message" })).toBeEnabled();

    await expect(await walk()).toEqual([
      "mode-tabs-item",
      "hero-omnibox-textarea",
      "hero-omnibox-attach",
      "select-trigger",
      "hero-omnibox-submit",
    ]);
  },
};

const CONTROLLED_PROMPT = "Summarize the attached earnings call and list every open commitment";

/**
 * The controlled pair, driven by a host that owns the draft. This is the
 * shape a home screen actually needs: a suggestion chip, a deep link or a
 * restored session writes the prompt, so the composer cannot be the only
 * place the text lives.
 *
 * Four facts, all asserted, because a `Controlled` story without a play
 * function is a screenshot of a prop:
 *
 * 1. **`value` wins over typing.** `hero-omnibox.tsx` reads
 *    `value ?? internalValue` on every render, so while the prop is present a
 *    keystroke moves nothing on screen.
 * 2. **`onValueChange` hands back the whole next string**, not a diff and not
 *    an event — the exact thing the host has to store to apply the edit.
 * 3. **An unchanged `value` holds the field fixed across re-renders.** The
 *    host bumps an unrelated counter; the assertion checks the counter really
 *    advanced before checking the text did not, so it cannot pass by the
 *    re-render never happening.
 * 4. **Submit reports the host's value, not the keystrokes it ignored.**
 *    `handleSubmit` sends `currentValue`, which is the same `value ??
 *    internal` read — so a host that drops changes on the floor sends the old
 *    prompt rather than the visible one.
 *
 * The corollary is the trap worth knowing, and it follows from the same line:
 * send's `disabled` is computed from that controlled value too. A host that
 * holds `value=""` and never applies what `onValueChange` reports ships a
 * field that looks typeable, shows nothing as you type, and can never enable
 * its own send button.
 *
 * One mechanical note on the play function: it sets the caret explicitly
 * before typing. A controlled field that refuses input has React restoring
 * the DOM value after every keystroke, which leaves the caret position the
 * one genuinely unstable thing in the test — so it is pinned rather than
 * assumed.
 */
export const Controlled: Story = {
  render: () => <ControlledHost />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole("textbox", { name: "What can I help you with?" });
    await expect(field).toHaveValue(CONTROLLED_PROMPT);

    // 1. Interaction alone does not move the rendered value.
    (field as HTMLTextAreaElement).focus();
    (field as HTMLTextAreaElement).setSelectionRange(CONTROLLED_PROMPT.length, CONTROLLED_PROMPT.length);
    await userEvent.keyboard("?");
    await expect(field).toHaveValue(CONTROLLED_PROMPT);

    // 2. …but the callback fired, carrying the whole next string.
    await expect(canvas.getByTestId("requested")).toHaveTextContent(`${CONTROLLED_PROMPT}?`);

    // 3. Re-render with an unchanged `value`. Prove the re-render happened
    //    first, so the assertion after it is not vacuous.
    await expect(canvas.getByTestId("render-pass")).toHaveTextContent("1");
    await userEvent.click(canvas.getByRole("button", { name: "Re-render" }));
    await expect(canvas.getByTestId("render-pass")).toHaveTextContent("2");
    await expect(field).toHaveValue(CONTROLLED_PROMPT);

    // 4. Send carries the host's value, not the ignored keystroke.
    await userEvent.click(canvas.getByRole("button", { name: "Send message" }));
    await expect(canvas.getByTestId("submitted")).toHaveTextContent(CONTROLLED_PROMPT);

    // The reported payload was sufficient to apply the edit — the whole point
    // of reporting it rather than swallowing it.
    await userEvent.click(canvas.getByRole("button", { name: "Apply" }));
    await expect(field).toHaveValue(`${CONTROLLED_PROMPT}?`);
  },
};

function ControlledHost() {
  const [applied, setApplied] = React.useState(CONTROLLED_PROMPT);
  const [requested, setRequested] = React.useState<string | null>(null);
  const [submitted, setSubmitted] = React.useState<string | null>(null);
  const [pass, setPass] = React.useState(1);
  return (
    <div className="flex w-full max-w-2xl flex-col gap-4">
      <HeroOmnibox
        state="idle"
        value={applied}
        onValueChange={setRequested}
        modes={MODES}
        mode="ask"
        models={MODELS}
        model="veo-3.1"
        cost={5}
        onSubmit={setSubmitted}
      />

      <dl className="text-foreground grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs">
        <dt>value prop</dt>
        <dd data-testid="applied">{applied}</dd>
        <dt>last onValueChange</dt>
        <dd data-testid="requested">{requested ?? "—"}</dd>
        <dt>last onSubmit</dt>
        <dd data-testid="submitted">{submitted ?? "—"}</dd>
        <dt>host render pass</dt>
        <dd data-testid="render-pass" className="tabular-nums">
          {pass}
        </dd>
      </dl>

      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={() => setPass((n) => n + 1)}>
          Re-render
        </Button>
        <Button size="sm" disabled={!requested} onClick={() => requested && setApplied(requested)}>
          Apply
        </Button>
      </div>
    </div>
  );
}

/**
 * The composer stripped to its optional slots being absent: no modes, no
 * models, no cost, and `placeholder=""`.
 *
 * The point is what is left. This component's accessible name and its visible
 * prompt come from two different props — `label` renders into an `sr-only`
 * `<label>` and an `aria-label`, `placeholder` is the only thing a sighted
 * user ever reads. Empty the placeholder and the box is still perfectly named
 * to a screen reader and completely unexplained to everyone else: a blank
 * card with two icon buttons in the corner. axe passes it, which is exactly
 * why it needs a rendered story rather than a lint rule.
 *
 * The toolbar is the other half. With every optional slot dropped it holds
 * one attach button and one send button, both icon-only and both carrying
 * their own `aria-label` defaults — so the tap targets stay named, and the
 * failure is confined to the visible affordance.
 */
export const EmptyLabel: Story = {
  args: { state: "idle", placeholder: "", onSubmit: () => {} },
};

/**
 * What a long prompt does to the box, measured rather than guessed — and the
 * answer has a threshold in it, which is why both sides of it are rendered.
 *
 * The field is the base `Textarea`'s `field-sizing-content` under a
 * `min-h-20` floor with no `max-h` anywhere. So: it never truncates and it
 * never scrolls, it grows. Below the floor growth is invisible — at 672px the
 * card absorbs the convention's ~90 characters and 287 characters alike
 * without changing height at all, both still exactly 80px. Past it the field
 * and the card grow together and do not stop: 855 characters measured 196px
 * of field inside a 290px card, with `scrollHeight === clientHeight`
 * throughout.
 *
 * **Gap, recorded not fixed:** unbounded is a real choice with a real cost.
 * A pasted transcript pushes the toolbar — attach, model, cost and send —
 * down the page ahead of itself, and on a short viewport the send button ends
 * up below the fold of the surface that exists to reach it. A `max-h` with
 * the field scrolling inside it is the usual answer; adding one is a layout
 * decision that belongs with the integrator, and it would change the fact
 * this story records, so it is written down rather than applied.
 */
export const LongContent: Story = {
  render: () => (
    <div className="flex w-full max-w-2xl flex-col gap-6">
      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">
          ~90 characters — under the floor, the card does not move
        </p>
        <HeroOmnibox
          state="idle"
          value="Summarize the attached earnings call and list every commitment with an owner"
          onValueChange={() => {}}
          models={MODELS}
          model="veo-3.1"
          cost={5}
          onSubmit={() => {}}
        />
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">
          A real paste — past the floor, the field and the card grow together
        </p>
        <HeroOmnibox
          state="idle"
          value="Summarize the attached earnings call and list every commitment someone made, with the owner and the date they gave for it. Then draft a follow-up note to the operations team covering the three items that slipped, quote the exact figures from the transcript rather than rounding them, and flag anything that needs a decision before Friday's review."
          onValueChange={() => {}}
          models={MODELS}
          model="veo-3.1"
          cost={5}
          onSubmit={() => {}}
        />
      </section>
    </div>
  ),
};

/**
 * 375px, with every optional slot populated — mode tabs, attach, model select
 * and the cost chip all at once, which is the widest this toolbar gets.
 *
 * It fits, and the play function is what keeps that true: the toolbar is
 * `flex items-center justify-between` with no `flex-wrap`, and its children
 * are a `w-fit` select and a `whitespace-nowrap` chip, so there is no
 * mechanism here for gracefully running out of room. Measured at 375px the
 * card's `scrollWidth` equals its `clientWidth` exactly. The margin is real
 * but it is finite, and it is spent by content this component does not
 * control — a four-word model name or a five-digit credit balance is what
 * would push the row into overflow rather than into a second line.
 */
export const Mobile: Story = {
  args: { ...Idle.args },
  render: (args) => (
    <div className="w-[375px] max-w-full">
      <HeroOmnibox {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector('[data-slot="hero-omnibox"]') as HTMLElement;
    await expect(`overflow=${root.scrollWidth > root.clientWidth}`).toBe("overflow=false");
  },
};

/**
 * The two composers, side by side. They share a base (`Textarea` in a card
 * with the controls inside the field), a slot arrangement, and — the reason
 * they get confused — the same locked-in-place paywall convention, so telling
 * them apart on looks does not work. The rule is about **where the surface
 * sits in the session**:
 *
 * - **C1 `hero-omnibox`** is where a session *starts*. Nothing has been
 *   generated yet, so it asks an open question, offers mode tabs to pick what
 *   kind of work this is, and its answer is a conversation. One field, and
 *   the model select is the only parameter it will admit to.
 * - **D1 `media-prompt-bar`** is where a session *continues*. There is
 *   already a canvas, a timeline or a node behind it, so it carries the
 *   things a re-run needs: a reference strip, a negative prompt, an embedded
 *   settings bar, and three presentations for the three places it docks.
 *
 * The one-line test: if the user has not made anything yet, it is the hero
 * omnibox; if the prompt has to describe a *change* to something on screen,
 * it is the media prompt bar. Both gate in place rather than beside — that
 * shared convention is the thing to keep, not the thing to choose by.
 *
 * C2 `suggestion-chips` is in the first section on purpose and is **not** a
 * third option. It is what a hero omnibox is normally paired with: a click on
 * a chip fills this field and the user still has to send. If you are choosing
 * between the chips and the composer you have misread the relationship —
 * they ship together.
 */
export const Boundary: Story = {
  render: () => (
    <div className="flex w-full max-w-2xl flex-col gap-8">
      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">
          C1 hero omnibox — starts a session, with C2 suggestion chips beneath it
        </p>
        <HeroOmnibox
          state="idle"
          modes={MODES}
          mode="ask"
          models={MODELS}
          model="veo-3.1"
          cost={5}
          onSubmit={() => {}}
        />
        <SuggestionChips>
          <SuggestionChip suggestion="Summarize this document" onSelect={() => {}} />
          <SuggestionChip suggestion="Draft a reply" onSelect={() => {}} />
        </SuggestionChips>
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">
          D1 media prompt bar — continues one, next to work that already exists
        </p>
        <MediaPromptBar
          presentation="docked"
          cost={5}
          settings={
            <GenSettingsBar aria-label="Generation settings">
              <GenSettingsItem>Veo 3.1 Fast</GenSettingsItem>
              <GenSettingsItem>16:9</GenSettingsItem>
              <GenSettingsItem>720p</GenSettingsItem>
            </GenSettingsBar>
          }
          onSubmit={() => {}}
        />
      </section>
    </div>
  ),
};
