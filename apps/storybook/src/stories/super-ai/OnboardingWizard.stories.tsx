import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { Clapperboard, Megaphone, Mic, Users } from "lucide-react";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { Button } from "@/components/ui/button";
import {
  GenerationWizard,
  type GenerationWizardStep,
} from "@/registry/super-ai/generation-wizard";
import { OnboardingWizard, type OnboardingWizardStep } from "@/registry/super-ai/onboarding-wizard";
import { OnboardingWizardDocs } from "@/content/components/onboarding-wizard.docs";
import { componentDocsPage } from "@/lib/component-docs-page";
import { focusTreatmentSignature, settledFocusRing } from "@/lib/focus-ring";

const meta: Meta<typeof OnboardingWizard> = {
  title: "Super AI/Onboarding Wizard",
  component: OnboardingWizard,
  parameters: { layout: "centered", docs: { page: componentDocsPage(OnboardingWizardDocs) } },
};

export default meta;
type Story = StoryObj<typeof OnboardingWizard>;

const STEPS: OnboardingWizardStep[] = [
  {
    id: "role",
    title: "What do you make?",
    description: "This picks the templates and sample project you land in.",
    choices: [
      {
        value: "marketing",
        label: "Marketing video",
        description: "Ads, social cuts, product clips",
        icon: <Megaphone className="size-4" />,
      },
      {
        value: "film",
        label: "Film and story",
        description: "Scenes, shot lists, longer edits",
        icon: <Clapperboard className="size-4" />,
      },
      {
        value: "voice",
        label: "Voice and audio",
        description: "Narration, dubbing, podcasts",
        icon: <Mic className="size-4" />,
      },
      {
        value: "team",
        label: "Something for my team",
        description: "Shared brand kit and review flow",
        icon: <Users className="size-4" />,
      },
    ],
    effect: "Sets your default aspect ratio, template set, and the sample project we open first.",
  },
  {
    id: "volume",
    title: "How much do you expect to make?",
    choices: [
      { value: "few", label: "A few a month", description: "Starter credit pack" },
      { value: "weekly", label: "Something most weeks", description: "Batch queue turned on" },
      { value: "daily", label: "Every day", description: "Concurrency raised to 4 renders" },
    ],
    effect: "Picks your credit pack and whether the batch queue starts on.",
  },
  {
    id: "brand",
    title: "Bring your brand in",
    description: "Optional — you can add this later from Settings.",
    content: (
      <p className="text-foreground text-sm">
        Drop a logo and two brand colours here and every template picks them up.
      </p>
    ),
    effect: "Applies your palette to every generated title card.",
    panel: (
      <div className="flex flex-col gap-1">
        <p className="text-foreground text-sm font-medium">One brand kit, every template</p>
        <p className="text-foreground/70 text-xs">
          Brand kits are shared across the workspace, so nobody re-picks the same blue twice.
        </p>
      </div>
    ),
    panelSide: "end",
  },
];

/**
 * The question itself. Choice cards are a real `RadioGroup` named by the step
 * heading, so `aria-checked`, arrow keys and the roving tabindex arrive from
 * the platform rather than from click handlers on divs — which is the whole of
 * this component's third "don't".
 *
 * Started with one answer already given, because the pre-answered state is the
 * one a returning user meets and the one where a colour-only selection would
 * be undetectable. Selection is carried twice over: the radio's `aria-checked`
 * and the card's `data-state`, never by fill alone. The `effect` line under the
 * cards is the sentence that separates this from a survey.
 */
export const ChoiceCards: Story = {
  args: { steps: STEPS, defaultAnswers: { role: "marketing" } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const group = canvas.getByRole("radiogroup", { name: "What do you make?" });
    await expect(within(group).getByRole("radio", { name: /Marketing video/ })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    await expect(within(group).getByRole("radio", { name: /Film and story/ })).toHaveAttribute(
      "aria-checked",
      "false",
    );
    const effect = canvasElement.querySelector('[data-slot="onboarding-wizard-effect"]');
    await expect(effect).toHaveTextContent("Sets your default aspect ratio");
  },
};

/**
 * Position, total and how many remain — all three on a real `progressbar` and
 * in visible text, with the dot rail `aria-hidden` beside it.
 *
 * The dots are the picture of the progress and never the record of it, which
 * is why this story reads the numbers off `aria-valuetext` and the "1 to go"
 * counter rather than off dot fills. Started mid-flow so "how many remain" has
 * a value worth reading: a rail that only ever shows step one proves nothing
 * about the count it is supposed to carry.
 */
export const DotProgress: Story = {
  args: { steps: STEPS, defaultStep: "volume" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const progress = canvas.getByRole("progressbar", { name: "Setup progress: step 2 of 3" });
    await expect(progress).toHaveAttribute("aria-valuetext", "Step 2 of 3, 1 step remaining");
    await expect(canvas.getByText("1 to go")).toBeInTheDocument();
    await expect(canvasElement.querySelectorAll('[data-slot="onboarding-wizard-dot"]')).toHaveLength(3);
  },
};

/**
 * Skip on the **last** step, which is the one place this component deliberately
 * departs from E8 `generation-wizard`.
 *
 * E8's final step commits — it spends credits — so Skip disappears there and
 * the primary swaps to a verb. Nothing is spent here, so an unanswered
 * question is a valid outcome and the affordance survives to the end;
 * dropping it would make the final question the one question a user cannot get
 * past. Rendered on the last step so both halves are visible at once: Skip
 * still present, and the primary already reading "Finish setup".
 */
export const Skippable: Story = {
  args: { steps: STEPS, defaultStep: "brand" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const skip = canvas.getByRole("button", { name: "Skip" });
    await expect(skip).toHaveAttribute("data-slot", "onboarding-wizard-skip");
    await expect(canvas.getByRole("button", { name: "Finish setup" })).toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: "Back" })).not.toBeDisabled();
  },
};

/**
 * The marketing pane, which is a prop on a step rather than a second
 * component: same progressbar, same dots, same Skip, same primary, one extra
 * column.
 *
 * The pane is always rendered **after** the question in the DOM whichever side
 * it is drawn on — `panelSide` moves it with `order`, so reading and tab order
 * stay question-then-pitch. Its frame is `bg-muted`, which is why its copy uses
 * `text-foreground/70` rather than `text-muted-foreground`: that pairing
 * measures 4.34:1 in this token set, under the 4.5:1 minimum, and the docs
 * module's fifth pitfall is about exactly this call site.
 */
export const SplitPanel: Story = {
  args: { steps: STEPS, defaultStep: "brand" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const panel = canvasElement.querySelector('[data-slot="onboarding-wizard-panel"]');
    await expect(panel).toHaveTextContent("One brand kit, every template");
    await expect(canvas.getByRole("progressbar", { name: "Setup progress: step 3 of 3" })).toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: "Skip" })).toBeInTheDocument();

    // The question precedes the pane in the DOM on the side it is drawn on.
    const content = canvasElement.querySelector('[data-slot="onboarding-wizard-content"]')!;
    await expect(content.compareDocumentPosition(panel!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  },
};

/* -------------------------------------------------------------------------
 * Case stories — the situations this wizard meets in a product, as opposed to
 * the four regions above. See docs/design-system/story-conventions.md.
 *
 * All eight are written, so there are no `case-skip` lines to record. Two
 * things about the shape are worth stating before the stories, because both
 * decide how they are written:
 *
 * 1. **Nothing here is portalled.** The catalog names Card and Progress as the
 *    bases and the component mounts no dialog, popover or menu, so mechanical
 *    fact 4 does not apply: there are no focus guards to settle around, no
 *    `data-open:animate-in` pair to restate, and `document.activeElement` can
 *    be read straight after a `tab()`.
 * 2. **The choice group is a roving-tabindex composite**, so it is *one* tab
 *    stop and not one per card. Measured on the first step with nothing
 *    answered: `tabIndex` reads `0, -1, -1, -1` across the four radios, and it
 *    follows the selection once there is one. `KeyboardOrder` below therefore
 *    asserts one stop for the group and arrow travel inside it.
 * ---------------------------------------------------------------------- */

/**
 * Right-to-left. Everything this component positions itself mirrors, and the
 * one physical class it had was found here and swapped.
 *
 * Measured under `dir="rtl"` on the middle step, at the numbers asserted
 * below: the dot rail runs first-step-rightmost (dots at x=577, 547, 535), the
 * progress row puts its "Setup progress" label at the inline start and the
 * "1 to go" counter at the inline end, the footer puts Back at x=697 against
 * the forward pair at x=16, and inside a choice card the radio sits at the
 * card's right edge. All of that is `flex` and `justify-between` mirroring for
 * free.
 *
 * **The one class that did not mirror was the choice card's `text-left`**,
 * which computed `text-align: left` inside a card whose own `direction` was
 * `rtl` — so an Arabic label sat against the wrong edge of its own box. Swapped
 * to `text-start` in this wave: byte-identical in LTR, one of the four swaps
 * CONTINUE.md §8's sweep entry enumerates, and every participant in that
 * layout is a class, which is the test F5 `compare-viewer` established for when
 * a swap is safe. Asserted below so it cannot silently regress.
 *
 * **Recorded, not asserted: the vendored `ButtonGroup` around Skip and the
 * primary does not mirror.** `components/ui/button-group.tsx` joins children
 * with `rounded-r-none` / `rounded-r-lg!` / `rounded-l-none` / `border-l-0`,
 * all resolved against the viewport rather than the writing direction. E8
 * `generation-wizard` measured it first on an outline+filled pair; this is the
 * same defect on a ghost+filled pair, with the same numbers reversed: Skip
 * paints at 68..118 with its 10px radii on its *left* (the seam) and square
 * corners on its right (the group's outer edge), the primary is the mirror of
 * that, and `border-l-0` strips the border from the group's outer left edge
 * while two borders stack at the seam. Asserting today's values would pin them;
 * the fix is logical radius and border utilities in the vendored primitive,
 * where it repairs every `ButtonGroup` at once.
 */
export const RTL: Story = {
  render: (args) => (
    <div dir="rtl" className="flex w-full max-w-3xl">
      <OnboardingWizard {...args} steps={STEPS} defaultStep="volume" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // The dot rail mirrors: step one paints rightmost, step three leftmost.
    const dots = Array.from(
      canvasElement.querySelectorAll<HTMLElement>('[data-slot="onboarding-wizard-dot"]'),
    );
    await expect(dots).toHaveLength(3);
    await expect(dots[0].getBoundingClientRect().left).toBeGreaterThan(
      dots[2].getBoundingClientRect().left,
    );

    // The progress row flips with it — label at the inline start (the right),
    // the "N to go" counter at the inline end.
    const label = canvasElement.querySelector<HTMLElement>(
      '[data-slot="onboarding-wizard-progress-label"]',
    )!;
    const remaining = canvasElement.querySelector<HTMLElement>(
      '[data-slot="onboarding-wizard-remaining"]',
    )!;
    await expect(label.getBoundingClientRect().left).toBeGreaterThan(
      remaining.getBoundingClientRect().left,
    );

    // …and so does the footer: Back trails the forward pair rather than
    // leading it.
    const back = canvas.getByRole("button", { name: "Back" });
    const forward = canvasElement.querySelector<HTMLElement>(
      '[data-slot="onboarding-wizard-nav-forward"]',
    )!;
    await expect(back.getBoundingClientRect().left).toBeGreaterThan(
      forward.getBoundingClientRect().left,
    );

    // The swapped class, pinned two ways. Chrome reports the computed keyword
    // rather than the used value, so `text-align` reads "start" here where the
    // `text-left` it replaced read "left" in this exact position — and the
    // measurement underneath is that the label's own text now paints against
    // the right edge of its box rather than the left.
    // Taken on the "Every day" card, whose label is much shorter than its own
    // description — so the label has real slack in its box and which edge it
    // hugs is unambiguous.
    const choices = Array.from(
      canvasElement.querySelectorAll<HTMLElement>('[data-slot="onboarding-wizard-choice"]'),
    );
    const choice = choices[choices.length - 1];
    await expect(getComputedStyle(choice).direction).toBe("rtl");
    await expect(getComputedStyle(choice).textAlign).toBe("start");

    const labelSpan = choice.querySelector<HTMLElement>("span.font-medium")!;
    const textRange = document.createRange();
    textRange.selectNodeContents(labelSpan);
    const box = labelSpan.getBoundingClientRect();
    const text = textRange.getBoundingClientRect();
    await expect(box.width - text.width).toBeGreaterThan(20);
    await expect(box.right - text.right).toBeLessThan(1);

    // The radio leads the card at the inline start, which is the right edge.
    const radio = choice.querySelector<HTMLElement>('[role="radio"]')!;
    const card = choice.getBoundingClientRect();
    await expect(radio.getBoundingClientRect().left).toBeGreaterThan(
      card.left + card.width / 2,
    );
  },
};

/**
 * The dot rail's `width` transition, which is this component's only motion and
 * had no reduced-motion branch until this wave.
 *
 * The current dot is a 24px bar and its neighbours are 6px, so every step
 * change grows one and shrinks another. Measured before the fix, under
 * Playwright's emulated `prefers-reduced-motion: reduce` (which
 * `vitest.config.ts` sets for every test in this project):
 * `transition-property: background-color, width` at `0.15s`. That is the
 * second idiom `story-conventions.md` fact 3 sanctions — a
 * `motion-reduce:transition-none` beside a transition a user perceives as
 * motion, as on `pricing-table`'s switch thumb and `run-button`'s fill — so it
 * landed in-wave, and the assertion below reads `0.15s` without it.
 *
 * **The colour half would not have earned the branch on its own.** A
 * `background-color` crossfade moves nothing, which is the reason
 * `reset-affordance` skips this story entirely; it is the width that makes the
 * rail motion.
 *
 * **Measured and worth knowing: the vendored `Progress` indicator's own
 * unbranched `transition-all` never paints here.** This flow's progress *is*
 * the dot rail, so `onboarding-wizard.tsx` suppresses the primitive's bar with
 * `[&>[data-slot=progress-track]]:hidden` — the track computes `display: none`
 * and the indicator inside it reads `0.15s` into nothing. So the registry-wide
 * gap on that primitive is real and inert at this call site, and no case story
 * should add a class for it.
 */
export const ReducedMotion: Story = {
  args: { steps: STEPS, defaultStep: "volume" },
  play: async ({ canvasElement }) => {
    const dots = Array.from(
      canvasElement.querySelectorAll<HTMLElement>('[data-slot="onboarding-wizard-dot"]'),
    );

    // The rail is still a rail: the current step is a long bar, not merely a
    // differently-coloured dot. Suppressing motion must not remove the one
    // distinction that survives a greyscale screenshot.
    const widths = dots.map((d) => Math.round(d.getBoundingClientRect().width));
    await expect(widths).toEqual([6, 24, 6]);

    // …and nothing animates getting there.
    for (const dot of dots) {
      await expect(getComputedStyle(dot).transitionProperty).toBe("none");
    }

    // The suppressed primitive track, which is where the registry-wide
    // unbranched transition lives. It paints nothing at this call site.
    const track = canvasElement.querySelector<HTMLElement>('[data-slot="progress-track"]')!;
    await expect(getComputedStyle(track).display).toBe("none");
  },
};

/**
 * The tab sequence, and the three facts about it that are invisible on screen.
 *
 * 1. **The choice group is one stop, not one per card.** It is a real
 *    roving-tabindex `RadioGroup`, so however many cards a step carries — three
 *    here, four on the first step — they contribute a single stop, and the
 *    arrows travel inside it. Started on the middle step so Back is live: four
 *    stops, group then Back then Skip then primary. On the *first* step there
 *    are three, because Back is `disabled` there — and Base UI leaves
 *    `tabindex="0"` on a natively-disabled button, so the count below is taken
 *    from buttons that are not disabled rather than from a `[tabindex]` query.
 * 2. **Every stop paints a treatment, checked two ways.** `settledFocusRing`
 *    asks whether anything is painted; the differential asks whether focus is
 *    what painted it. J2 and J3 measured them disagreeing in both directions,
 *    so both run here — the differential taken by reading the *next* stop's
 *    signature while focus is still on the previous one, which disturbs
 *    nothing.
 * 3. **Arrow keys answer the question.** ArrowDown/ArrowRight move to the next
 *    card *and* check it in the same keystroke, and ArrowUp from the first card
 *    wraps to the last. There is no way to browse the options from the keyboard
 *    without committing to each one you pass through, which is a real
 *    consequence for a survey step wired to an `onAnswerChange` that writes
 *    straight through.
 *
 * **Recorded, not asserted, twice over.**
 *
 * The docs module says "Home and End reach the first and last card". They do
 * not: measured from the third of four cards, `{Home}`, `{End}` and `{PageUp}`
 * each leave focus exactly where it was and check nothing. Base UI's radio
 * group binds the arrows and their wrapping and nothing else, so a keyboard
 * user's only route to the last option is to arrow through — and therefore
 * answer with — every option in between. Nothing below asserts the
 * non-movement, because that would pin the gap shut.
 *
 * And the step title takes focus on every step change while painting nothing:
 * `<h3 tabIndex={-1} className="outline-none">` *does* match `:focus-visible`
 * when the move lands — the browser is asking for an indicator and getting
 * `outlineStyle: "none"`, `boxShadow: "none"`. So a screen-reader user hears
 * the new question and a sighted keyboard user watches focus vanish from the
 * button they pressed. E8 `generation-wizard` carries the identical shape on
 * its own title; the fix is one decision for both, and a ring around a heading
 * is unusual enough chrome to be a design call rather than a sweep. Only the
 * `:focus-visible` half is asserted below — the half that stays true after a
 * fix.
 */
export const KeyboardOrder: Story = {
  args: { steps: STEPS, defaultStep: "volume" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="onboarding-wizard"]')!;
    const nameOf = (el: Element | null) =>
      el === null
        ? "nothing"
        : `${el.tagName.toLowerCase()}[${(el.getAttribute("data-slot") ?? el.textContent ?? "").trim().slice(0, 26)}]`;

    // 1. Three cards on this step, one stop. The roving tabindex is what makes
    //    that true, and the count of cards is irrelevant to it.
    const radios = canvas.getAllByRole("radio");
    await expect(radios).toHaveLength(3);
    await expect(radios.filter((r) => (r as HTMLElement).tabIndex === 0)).toHaveLength(1);

    // Buttons that can actually be reached. Back is enabled on this step, so
    // three — and the query is by `disabled`, not by tabindex, because Base UI
    // leaves tabindex="0" on a disabled button.
    const buttons = Array.from(root.querySelectorAll<HTMLButtonElement>("button")).filter(
      (b) => !b.disabled,
    );
    await expect(buttons).toHaveLength(3);

    // 2. One lap: the group (entered at its tabbable radio), then Back, Skip
    //    and the primary. Every tab moves by exactly one control.
    const expected = [
      radios.find((r) => (r as HTMLElement).tabIndex === 0)!,
      canvas.getByRole("button", { name: "Back" }),
      canvas.getByRole("button", { name: "Skip" }),
      canvas.getByRole("button", { name: "Next" }),
    ] as HTMLElement[];

    for (const stop of expected) {
      // The differential baseline, taken while focus is still elsewhere.
      const before = focusTreatmentSignature(stop);
      await userEvent.tab();
      await expect(nameOf(document.activeElement)).toBe(nameOf(stop));
      await expect(stop.matches(":focus-visible")).toBe(true);
      // Does it paint anything, and did focus cause it? Both questions.
      await settledFocusRing(stop, waitFor);
      await waitFor(() => expect(focusTreatmentSignature(stop)).not.toBe(before));
    }

    // …and one more tab leaves the wizard rather than cycling inside it.
    await userEvent.tab();
    await expect(root.contains(document.activeElement)).toBe(false);

    // 3. Arrows move and answer in one keystroke, and wrap at the ends.
    const idOf = () =>
      (document.activeElement as HTMLElement | null)
        ?.closest("[data-choice-id]")
        ?.getAttribute("data-choice-id") ?? "none";
    radios[0].focus();
    await userEvent.keyboard("{ArrowDown}");
    await expect(idOf()).toBe("weekly");
    await expect(canvas.getByRole("radio", { name: /Something most weeks/ })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    await userEvent.keyboard("{ArrowUp}");
    await expect(idOf()).toBe("few");
    await userEvent.keyboard("{ArrowUp}");
    await expect(idOf()).toBe("daily");

    // 4. A step change lands focus on the new question rather than leaving it
    //    on a button whose meaning just changed. The browser agrees that focus
    //    deserves an indicator — what is missing is left unasserted.
    await userEvent.click(canvas.getByRole("button", { name: "Next" }));
    const title = canvasElement.querySelector<HTMLElement>('[data-slot="card-title"] h3')!;
    await waitFor(() => expect(document.activeElement).toBe(title));
    await expect(title.matches(":focus-visible")).toBe(true);
  },
};

/** A host that records what the wizard asks for and applies it only on demand. */
function ControlledShell() {
  const [step, setStep] = React.useState("role");
  const [answers, setAnswers] = React.useState<Record<string, string>>({});
  const [requestedStep, setRequestedStep] = React.useState<string | null>(null);
  const [requestedAnswer, setRequestedAnswer] = React.useState<string | null>(null);
  const [pass, setPass] = React.useState(1);

  return (
    <div className="flex w-full max-w-3xl flex-col gap-6">
      <OnboardingWizard
        steps={STEPS}
        step={step}
        answers={answers}
        onStepChange={setRequestedStep}
        onAnswerChange={(id, value) => setRequestedAnswer(`${id}=${value}`)}
      />
      <dl className="text-foreground grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs">
        <dt>step prop</dt>
        <dd data-testid="applied-step">{step}</dd>
        <dt>answers prop</dt>
        <dd data-testid="applied-answers">
          {Object.entries(answers)
            .map(([k, v]) => `${k}=${v}`)
            .join(", ") || "—"}
        </dd>
        <dt>last onStepChange</dt>
        <dd data-testid="requested-step">{requestedStep ?? "—"}</dd>
        <dt>last onAnswerChange</dt>
        <dd data-testid="requested-answer">{requestedAnswer ?? "—"}</dd>
        <dt>host render pass</dt>
        <dd data-testid="render-pass" className="tabular-nums">
          {pass}
        </dd>
      </dl>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={() => setPass((n) => n + 1)}>
          Re-render host
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            if (!requestedAnswer) return;
            const [id, value] = requestedAnswer.split("=");
            setAnswers((prev) => ({ ...prev, [id]: value }));
          }}
        >
          Apply requested answer
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            if (requestedStep) setStep(requestedStep);
          }}
        >
          Apply requested step
        </Button>
      </div>
    </div>
  );
}

/**
 * Two controlled pairs, not one — and the second is the whole difference
 * between this component and E8 `generation-wizard`.
 *
 * E8 owns a position and nothing else; each of its steps' fields are the
 * caller's own `content` node, so the wizard never sees a value. L6 owns the
 * answers too (`answers` / `defaultAnswers` / `onAnswerChange`), because
 * onboarding answers exist to be *applied* downstream and so have to leave the
 * component in one shape. This host holds both the hard way: it records what
 * the wizard asks for and applies it only when told to.
 *
 * What the play function proves, in order: clicking a card does not check it;
 * the callback still fires with `(stepId, value)`, which is what a host has to
 * apply; a host re-render with `answers` unchanged leaves the card unchecked;
 * applying finally checks it. Then the same four facts for the step half —
 * pressing Next does not advance, `onStepChange` fires with the id of the step
 * to move *to*, and applying it moves the flow.
 *
 * **The arrow keys are the part worth wiring up carefully.** Arrowing inside
 * the group requests an answer exactly as a click does, so a host that
 * handles clicks and forgets keys silently drops every keyboard answer — and
 * because arrows move *and* answer in one keystroke, a keyboard user walking
 * past three cards requests three answers, not one. Asserted below.
 *
 * **Recorded, not asserted:** the wizard focuses the step title on *any* change
 * of the active step, exempting only the very first render, so a host that
 * persists position across a page load and applies it a tick after mount yanks
 * focus into the wizard from wherever the user was. E8 carries the same
 * behaviour from the same code, and its `Controlled` story records it too.
 * Telling a user-driven change from a host-driven one is an API decision, not a
 * class swap.
 */
export const Controlled: Story = {
  render: () => <ControlledShell />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const checked = () =>
      canvas.getAllByRole("radio").map((r) => r.getAttribute("aria-checked")).join(",");

    await expect(checked()).toBe("false,false,false,false");

    // 1. Interaction alone does not move the rendered value…
    await userEvent.click(canvas.getByRole("radio", { name: /Film and story/ }));
    await expect(checked()).toBe("false,false,false,false");

    // 2. …but the callback fired with the payload a host has to apply.
    await expect(canvas.getByTestId("requested-answer")).toHaveTextContent("role=film");

    // 3. A host re-render with `answers` unchanged holds the group fixed.
    await userEvent.click(canvas.getByRole("button", { name: "Re-render host" }));
    await expect(canvas.getByTestId("render-pass")).toHaveTextContent("2");
    await expect(checked()).toBe("false,false,false,false");

    // 4. Applying the request is the only thing that checks it.
    await userEvent.click(canvas.getByRole("button", { name: "Apply requested answer" }));
    await waitFor(() =>
      expect(canvas.getByRole("radio", { name: /Film and story/ })).toHaveAttribute(
        "aria-checked",
        "true",
      ),
    );

    // 5. The keyboard route requests an answer exactly as a click does — and
    //    moving past a card is itself a request, not a browse.
    canvas.getAllByRole("radio")[3].focus();
    await userEvent.keyboard("{ArrowDown}");
    await expect(canvas.getByTestId("requested-answer")).toHaveTextContent("role=marketing");
    await expect(checked()).toBe("false,true,false,false");

    // 6. The step half of the contract, same shape: Next reports, it does not
    //    advance, and the id it reports is the destination.
    await userEvent.click(canvas.getByRole("button", { name: "Next" }));
    await expect(canvas.getByTestId("applied-step")).toHaveTextContent("role");
    await expect(canvas.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "1");
    await expect(canvas.getByTestId("requested-step")).toHaveTextContent("volume");

    await userEvent.click(canvas.getByRole("button", { name: "Apply requested step" }));
    await waitFor(() =>
      expect(canvas.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "2"),
    );
  },
};

const BARE_STEPS: OnboardingWizardStep[] = [
  {
    id: "role",
    title: "What do you make?",
    choices: [
      { value: "marketing", label: "Marketing video" },
      { value: "film", label: "Film and story" },
    ],
    effect: "Sets your default aspect ratio and the sample project we open first.",
  },
  {
    id: "volume",
    title: "How much do you expect to make?",
    choices: [
      { value: "few", label: "A few a month" },
      { value: "daily", label: "Every day" },
    ],
  },
];

/**
 * Every optional slot emptied at once: no step `description`, no `icon` and no
 * `description` on any choice, no `effect` on the second step, no `panel`
 * anywhere — plus `label=""` and `effectLabel=""`, the two defaulted strings
 * whose empty case is survivable.
 *
 * The branches are real, which is the first thing to check: with nothing
 * supplied there is no empty paragraph reserving vertical space and no
 * collapsed pane. A card stripped to its label is 46px tall and still named
 * "Marketing video" — the type's own comment calls that "a radio with padding",
 * and the measurement behind it is that the 16×16 radio dot is *not* the
 * target: the whole 364×46 `<label>` is, so an icon-less, description-less card
 * is still a comfortable tap target rather than a 16px dot.
 *
 * **The two emptied labels behave differently, and neither is an axe failure —
 * which is what makes them worth a story.** `effectLabel=""` renders the lead-in
 * as a bare `": "` before the effect sentence. `label=""` is the sharper one:
 * the visible progress text becomes `": step 1 of 2"` and, because the
 * progressbar is named from that same element, so does its accessible name. It
 * is not the `label=""` deletes-the-name shape J1 and J7 recorded; it is the
 * same class reached from the other side, where the default is defeated and the
 * name is corrupted rather than lost. Nothing below pins the corrupted string —
 * only the halves that survive a fix: the bar still has a name, and the
 * position is still in `aria-valuetext`.
 *
 * **The four button labels are deliberately not emptied.** `backLabel`,
 * `skipLabel`, `nextLabel` and `finishLabel` are all defaulted, and forcing the
 * empty case would ship an axe `button-name` violation into a gate running at
 * `test: "error"` — the reason E8, `quote-reply` and `suggestion-chips` all
 * record for the same decision.
 */
export const EmptyLabel: Story = {
  args: { steps: BARE_STEPS, label: "", effectLabel: "" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // No empty branches left behind: the content column is the group and the
    // effect line, and nothing else.
    await expect(canvasElement.querySelector('[data-slot="card-description"]')).toBeNull();
    await expect(canvasElement.querySelector('[data-slot="onboarding-wizard-panel"]')).toBeNull();
    const content = canvasElement.querySelector<HTMLElement>(
      '[data-slot="onboarding-wizard-content"]',
    )!;
    await expect(content.children).toHaveLength(2);

    // A card stripped to its label is still named, and the card — not the
    // 16px dot inside it — is the target.
    const card = canvasElement.querySelector<HTMLElement>('[data-slot="onboarding-wizard-choice"]')!;
    const radio = canvas.getByRole("radio", { name: "Marketing video" });
    await expect(card.contains(radio)).toBe(true);
    await expect(Math.round(radio.getBoundingClientRect().width)).toBe(16);
    await expect(card.getBoundingClientRect().height).toBeGreaterThan(40);
    await expect(card.getBoundingClientRect().width).toBeGreaterThan(300);

    // The empty flow label does not remove the position, only the words in
    // front of it. Asserting the survivable half, not the corrupted string.
    const bar = canvas.getByRole("progressbar");
    await expect(bar).toHaveAttribute("aria-valuetext", "Step 1 of 2, 1 step remaining");
    await expect(bar).toHaveAttribute("aria-valuenow", "1");
    await expect((bar.getAttribute("aria-labelledby") ?? "").length).toBeGreaterThan(0);

    // The second step has no `effect` at all, so the line is absent rather
    // than rendered empty.
    await userEvent.click(canvas.getByRole("button", { name: "Next" }));
    await waitFor(() =>
      expect(canvas.getByRole("radiogroup", { name: "How much do you expect to make?" })).toBeInTheDocument(),
    );
    await expect(canvasElement.querySelector('[data-slot="onboarding-wizard-effect"]')).toBeNull();
  },
};

const LONG_TITLE =
  "What kind of work do you expect to bring here in a normal week, so we can set your defaults?";
const LONG_STEPS: OnboardingWizardStep[] = [
  {
    id: "role",
    title: LONG_TITLE,
    description:
      "We use this to pick your starting templates, your default aspect ratio and the sample project we open first.",
    choices: [
      {
        value: "marketing",
        label: "Marketing video, social cuts and product clips for a small in-house team",
        description:
          "Ads, social cuts and product clips, with your brand kit applied to every generated title card.",
        icon: <Megaphone className="size-4" />,
      },
      {
        value: "film",
        label: "Film and story",
        description: "Scenes, shot lists, longer edits",
        icon: <Clapperboard className="size-4" />,
      },
    ],
    effect:
      "Sets your default aspect ratio, the template set in your picker, the credit pack you are offered and the sample project we open first.",
  },
  { ...STEPS[1] },
];

/**
 * Author-supplied copy in every text slot at once — a 92-character step title,
 * a 108-character description, a 72-character choice label with a 94-character
 * description of its own, a 143-character effect line and a 38-character flow
 * label.
 *
 * **Nothing in this component truncates, and that is a deliberate difference
 * from its sibling.** E8 `generation-wizard` wraps its step title in A12
 * `section-header`'s `truncate` span, so a long E8 title clips to one line with
 * an ellipsis and no `title` attribute to recover it. L6 puts the title in a
 * bare `<h3>` — `white-space: normal`, `text-overflow: clip` — so the string
 * arrives complete however long it is. For a first-run question that is the
 * right answer: a clipped question cannot be answered.
 *
 * **The honest measurement, though: the title does not wrap here.** At the
 * 736px this component gets inside its `max-w-3xl` card at the gate's width,
 * 92 characters still fit on one 22px line, and so does the 108-character
 * description. So this story proves the *rule* about the title — no clipping
 * mechanism exists to hit — rather than showing a wrapped one.
 *
 * The choice grid is where the wrapping is visible, and it is the measured
 * half. The 72-character label takes two lines against its neighbour's one and
 * its 94-character description takes two more, yet **both cards stay the same
 * height** (100px), because `sm:grid-cols-2` stretches the row — so long copy
 * on one card does not produce a ragged pair, and neither card scrolls
 * sideways. The effect line wraps to two lines under them.
 *
 * The progress row is the one place a long string competes for space:
 * `flex-nowrap` with the dot rail on `flex-1`, so a long `label` takes what it
 * needs and the rail absorbs the loss rather than the row wrapping or
 * overflowing. Worth knowing before writing one, because that flow label is
 * also read into the progressbar's accessible name in full, on every step.
 */
export const LongContent: Story = {
  args: { steps: LONG_STEPS, label: "First-run setup for your new workspace" },
  play: async ({ canvasElement }) => {
    const title = canvasElement.querySelector<HTMLElement>('[data-slot="card-title"] h3')!;
    const style = getComputedStyle(title);

    // The question is never clipped — the opposite of E8's title, which
    // truncates. At this width 92 characters still fit on one line, so what is
    // pinned here is the absence of a clipping mechanism rather than a wrap.
    await expect(style.whiteSpace).toBe("normal");
    await expect(style.textOverflow).toBe("clip");
    await expect(title.scrollWidth).toBe(title.clientWidth);
    await expect(title.textContent).toBe(LONG_TITLE);

    // Both cards keep the same height even though one carries four lines of
    // copy and the other two, and neither overflows its own box.
    const cards = Array.from(
      canvasElement.querySelectorAll<HTMLElement>('[data-slot="onboarding-wizard-choice"]'),
    );
    await expect(cards).toHaveLength(2);
    await expect(Math.round(cards[0].getBoundingClientRect().height)).toBe(
      Math.round(cards[1].getBoundingClientRect().height),
    );
    for (const card of cards) {
      await expect(card.scrollWidth).toBe(card.clientWidth);
    }

    // The long label really is wrapping, not being clipped: two lines against
    // its neighbour's one.
    const labels = cards.map((c) => c.querySelector<HTMLElement>("span.font-medium")!);
    await expect(labels[0].getBoundingClientRect().height).toBeGreaterThan(
      labels[1].getBoundingClientRect().height,
    );

    // The progress row absorbs a long flow label without wrapping or
    // overflowing, and that label is the progressbar's name.
    const progress = canvasElement.querySelector<HTMLElement>(
      '[data-slot="onboarding-wizard-progress"]',
    )!;
    await expect(getComputedStyle(progress).flexWrap).toBe("nowrap");
    await expect(progress.scrollWidth).toBe(progress.clientWidth);
    within(canvasElement).getByRole("progressbar", {
      name: "First-run setup for your new workspace: step 1 of 2",
    });

    const root = canvasElement.querySelector<HTMLElement>('[data-slot="onboarding-wizard"]')!;
    await expect(root.scrollWidth).toBe(root.clientWidth);
  },
};

/**
 * 375px, on both of this component's layout branches — and the honest reading
 * is narrower than it looks.
 *
 * Every adaptation here is keyed to the **viewport**: the choice grid is
 * `sm:grid-cols-2` and the split is `md:grid-cols-2`. A wrapper constrains
 * width, not the breakpoint, and the gate runs headless chromium at 1200×900,
 * so what renders inside these 375px boxes is the **widest** branch on both
 * counts. Measured: the panel step resolves to two live 159.5px tracks rather
 * than stacking, exactly as E8's does. A real phone gets the other branch,
 * which this story structurally cannot show.
 *
 * That makes it the stronger claim rather than the phone one: the desktop
 * layout squeezed to phone width still does not scroll sideways. It survives
 * because nothing in the tree is fixed-width — the root is `w-full max-w-3xl`,
 * the content column is `min-w-0`, both grids divide whatever they are given,
 * and the footer is `justify-between` around two auto-width groups.
 *
 * Both branches are rendered because they fail differently. The question step
 * is the denser one — four cards, each an icon plus two lines, in two columns
 * — while the panel step is where the `md:` split produces a 160px marketing
 * column that has to hold a heading and a sentence. **The progress row is the
 * line most at risk in either**: it is `flex-nowrap`, so it cannot relieve
 * pressure by wrapping, and it is asserted separately below.
 */
export const Mobile: Story = {
  render: (args) => (
    <div className="flex flex-col gap-6">
      <div className="w-[375px] max-w-full" data-testid="question-viewport">
        <OnboardingWizard {...args} steps={STEPS} defaultStep="role" />
      </div>
      <div className="w-[375px] max-w-full" data-testid="panel-viewport">
        <OnboardingWizard {...args} steps={STEPS} defaultStep="brand" />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    for (const testId of ["question-viewport", "panel-viewport"]) {
      const viewport = canvas.getByTestId(testId);
      await expect(viewport.scrollWidth).toBeLessThanOrEqual(viewport.clientWidth);

      const root = viewport.querySelector<HTMLElement>('[data-slot="onboarding-wizard"]')!;
      await expect(root.getBoundingClientRect().width).toBeLessThanOrEqual(375);
      await expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth);

      // The row that cannot wrap its way out of trouble.
      const progress = root.querySelector<HTMLElement>('[data-slot="onboarding-wizard-progress"]')!;
      await expect(getComputedStyle(progress).flexWrap).toBe("nowrap");
      await expect(progress.scrollWidth).toBeLessThanOrEqual(progress.clientWidth);

      // The footer is the densest line: Back on one side, Skip and the primary
      // joined on the other.
      const nav = root.querySelector<HTMLElement>('[data-slot="onboarding-wizard-nav"]')!;
      await expect(nav.scrollWidth).toBeLessThanOrEqual(nav.clientWidth);
    }

    // The split really is still split at 375px — the `md:` branch applies,
    // which is the wide layout under test rather than the phone one.
    const panelRoot = canvas
      .getByTestId("panel-viewport")
      .querySelector<HTMLElement>('[data-slot="onboarding-wizard"]')!;
    const cardContent = panelRoot.querySelector<HTMLElement>('[data-slot="card-content"]')!;
    await expect(getComputedStyle(cardContent).gridTemplateColumns.split(" ")).toHaveLength(2);
    const pane = panelRoot.querySelector<HTMLElement>('[data-slot="onboarding-wizard-panel"]')!;
    await expect(pane.getBoundingClientRect().width).toBeLessThan(200);
    await expect(pane.scrollWidth).toBeLessThanOrEqual(pane.clientWidth);

    // Nothing pushed the page itself sideways either.
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(
      document.documentElement.clientWidth,
    );
  },
};

const BOUNDARY_GENERATION_STEPS: GenerationWizardStep[] = [
  {
    id: "model",
    title: "Choose model",
    content: <p className="text-foreground text-sm">Fast · 2 credits per clip</p>,
    preview: <p className="text-foreground text-center text-sm">Fast model, 2 credits</p>,
  },
  {
    id: "review",
    title: "Review",
    content: <p className="text-foreground text-sm">Fast model · Cinematic · 1 clip</p>,
    preview: <p className="text-foreground text-center text-sm">3 credits</p>,
  },
];

// L6's own last step has to carry a question here, because the point being
// compared is what the *final* step does — E8 commits on it, L6 still lets you
// walk away from it.
const BOUNDARY_ONBOARDING_STEPS: OnboardingWizardStep[] = [
  {
    id: "role",
    title: "What do you make?",
    choices: [
      { value: "marketing", label: "Marketing video" },
      { value: "film", label: "Film and story" },
    ],
    effect: "Sets your default aspect ratio and the sample project we open first.",
  },
  {
    id: "volume",
    title: "How much do you expect to make?",
    choices: [
      { value: "few", label: "A few a month" },
      { value: "daily", label: "Every day" },
    ],
    effect: "Picks your credit pack and whether the batch queue starts on.",
  },
];

/**
 * Against E8 `generation-wizard`, which is not a lookalike but a declared
 * relative: `onboarding-wizard.tsx` says in its own header that it is built on
 * E8's step machinery — `steps[]`, a controlled/uncontrolled `step`,
 * `onStepChange`, and a Back / Skip / primary footer — so that two multi-step
 * contracts in one registry cannot drift apart. E8's `Boundary` states the same
 * rule from its side.
 *
 * Three differences decide which you want, and all three follow from what the
 * last step means. Rendered here on each component's last step, where the
 * difference is visible rather than argued.
 *
 * - **E8's last step commits.** It spends credits, so Skip disappears there and
 *   the primary swaps to a verb. Its preview pane exists to make that spend
 *   legible one step early.
 * - **L6's last step is only the last question.** Skip survives onto it,
 *   because an unanswered onboarding question is a valid outcome and nothing is
 *   being spent — so skipping it finishes setup rather than trapping the user
 *   on the one question they cannot get past.
 * - **E8 holds no answers; L6 does.** Every E8 step's fields are the caller's
 *   `content` node, so the wizard never sees a value. L6 owns `answers` /
 *   `onAnswerChange`, because onboarding answers exist to be applied.
 *
 * So: a flow ending in a spend, with fields you own — E8. A flow ending in a
 * profile, asked as single-select questions — L6. L2 `coach-mark` is the third
 * neighbour and the one to reach for when the questions are really a tour: it
 * points at the product's own UI from a popover instead of taking the screen,
 * and its step counter and Skip are required props for the same reason L6's are
 * unconditional.
 *
 * **Neither belongs inside a surface that already draws progress and a
 * footer.** L6's progress rail and Back/Skip row are unconditional, which is
 * why O14's single-step sign-in had to suppress three dead buttons —
 * CONTINUE.md §8 records it as a wanted `progress={false}` / `nav={false}`, and
 * this wave did not add either. E8 has the identical absence.
 */
export const Boundary: Story = {
  render: () => (
    <div className="flex w-full max-w-3xl flex-col gap-8">
      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">
          E8 generation wizard — your fields, a per-step preview, a last step that spends
        </p>
        <GenerationWizard steps={BOUNDARY_GENERATION_STEPS} defaultStep="review" />
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">
          L6 onboarding wizard — its choice cards, its answers, a last step you may still skip
        </p>
        <OnboardingWizard steps={BOUNDARY_ONBOARDING_STEPS} defaultStep="volume" />
      </section>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // The difference, asserted rather than described: on its last step E8 has
    // no Skip and a committing verb; L6 keeps Skip and finishes.
    const skips = canvas.getAllByRole("button", { name: "Skip" });
    await expect(skips).toHaveLength(1);
    await expect(skips[0].closest('[data-slot="onboarding-wizard"]')).not.toBeNull();

    canvas.getByRole("button", { name: "Generate" });
    canvas.getByRole("button", { name: "Finish setup" });

    // And the answers half: only L6 renders a question the wizard itself owns
    // and holds a value for.
    const groups = canvas.getAllByRole("radiogroup");
    await expect(groups).toHaveLength(1);
    await expect(groups[0].closest('[data-slot="onboarding-wizard"]')).not.toBeNull();
  },
};
