import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";

import { Button } from "@/components/ui/button";
import { TtsComposer } from "@/registry/super-ai/tts-composer";
import { VoiceCloneRecorder, type VoiceCloneRecorderState } from "@/registry/super-ai/voice-clone-recorder";
import { VoiceCloneRecorderDocs } from "@/content/components/voice-clone-recorder.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const meta: Meta<typeof VoiceCloneRecorder> = {
  title: "Super AI/Voice Clone Recorder",
  component: VoiceCloneRecorder,
  parameters: { layout: "centered", docs: { page: componentDocsPage(VoiceCloneRecorderDocs) } },
};

export default meta;
type Story = StoryObj<typeof VoiceCloneRecorder>;

const SCRIPT = [
  "The quick brown fox jumps over the lazy dog near the riverbank.",
  "She sells seashells by the seashore every summer morning.",
];

const CONSENT_SENTENCE =
  "I have Jamie's explicit, informed permission to record this sample and create an AI clone of their voice.";

/**
 * The line to read, and one control to begin. Nothing is recording yet and
 * nothing has been captured, so this is the only state a speaker can leave
 * having left no sample behind.
 *
 * The script is a `string[]` here, which is what turns on the "Line 1 of 2"
 * counter above it — a single string renders the line alone. Either way it is
 * real text rather than an image, so a screen reader can read it out and the
 * speaker can copy it somewhere larger.
 */
export const PromptScript: Story = {
  args: {
    script: SCRIPT,
    currentLine: 0,
    state: "prompt-script",
    onStartRecording: () => {},
  },
};

/**
 * Recording, with the level meter the state exists for: proof that the
 * microphone is picking up sound before someone reads a whole script into a
 * dead input.
 *
 * Notice how much of that proof is text. The pulsing dot is `aria-hidden`, so
 * "Recording" carries the state, the elapsed time sits beside it as plain
 * text, and the meter's value is printed as "62%" next to the bar rather than
 * left to the fill alone. `level` and `elapsedLabel` both come from the
 * consumer's own audio analysis — this component never opens a microphone.
 */
export const LevelMetering: Story = {
  args: {
    script: SCRIPT,
    currentLine: 0,
    state: "level-metering",
    level: 62,
    elapsedLabel: "0:07",
    onStopRecording: () => {},
  },
};

/**
 * The take is captured and the speaker is judging it. Two ways out, weighted
 * evenly: discard and read again, or move on.
 *
 * "Use this take" is the one that looks like a commitment and is not one. It
 * fires `onAcceptTake`, which carries no payload and only advances to the
 * consent gate — a consumer who wires it straight to a clone call has removed
 * the reason this component exists. `takeUrl` would add a native audio player
 * here; this story passes only `takeSummary`, the lighter of the two shapes.
 */
export const Retake: Story = {
  args: {
    script: SCRIPT,
    currentLine: 0,
    state: "retake",
    takeSummary: "Take recorded — 7s",
    onRetake: () => {},
    onAcceptTake: () => {},
  },
};

/**
 * The gate. An `alertdialog` rather than inline content, because it has to
 * interrupt the flow instead of sitting beside it where it can be scrolled
 * past.
 *
 * Three things are load-bearing and all three are visible here: the checkbox
 * starts unchecked with no prop that could have pre-checked it, the confirm
 * button is genuinely `disabled` until it is ticked, and `speakerName` is what
 * turns the generic "this person" into "Jamie" in both the checkbox sentence
 * and the disclaimer. `onConsent` is the only callback in the component that
 * can mean "go ahead and clone this voice", and this button is the only place
 * it fires from.
 */
export const ConsentCapture: Story = {
  args: {
    script: SCRIPT,
    currentLine: 0,
    state: "consent-capture",
    speakerName: "Jamie",
    onConsent: () => {},
    onConsentCancel: () => {},
  },
};

/* -------------------------------------------------------------------------
 * Case stories — the situations this component meets in a product, as opposed
 * to the prop combinations above. See docs/design-system/story-conventions.md.
 *
 * All eight are written, which is a consequence of the component's shape
 * rather than a decision to fill the set: `state` is a controlled-only prop
 * with four values, one of them a portalled modal, so each of the eight lands
 * on a different state and measures something the others cannot see. Every
 * story below says which state it renders and why that is where the fact
 * lives.
 *
 * `component-specs.md` has no E10 section — the manifest anchor points at one
 * that has never existed, which `CONTINUE.md` §5 records. These stories are
 * written against the catalog row (E10, `RESTORED`), gaps.md §2 R7 ("consent
 * capture belongs in the flow, not in settings") and the shipped docs module.
 * They document what the component does; none of them proposes intent the
 * missing section would have had to supply.
 * ---------------------------------------------------------------------- */

/**
 * Right-to-left, in `level-metering`, the only state with a real inline axis
 * to get wrong: a three-part status row, a label/value pair split by
 * `justify-between`, and a bar that fills from one end.
 *
 * `voice-clone-recorder.tsx` contains no physical inline utility at all — no
 * `pl-`, `ml-`, `border-l` or `text-left` — so there is nothing here for the
 * logical-property sweep in `CONTINUE.md` §8 to swap, and the row order, the
 * `justify-between` pair and `self-start` on the Stop button all mirror on
 * their own. The play function measures resolved geometry rather than reading
 * classes back, because a class list cannot tell you which way a flex line
 * actually laid out.
 *
 * The meter is the part worth measuring. Base UI's `Progress.Indicator` is the
 * one child whose fill direction is not decided by the flex row it sits in,
 * and this component cannot reach it: `components/ui/progress.tsx` renders the
 * track and the indicator internally with no prop to pass either a class. So
 * whatever the assertion below reports is the primitive's behaviour, not this
 * component's choice.
 *
 * What holds still, correctly: "62%" keeps its digits before the percent sign,
 * because the sign is a bidi terminator that attaches to the European number
 * rather than to the paragraph, and "0:07" holds for the same reason. Neither
 * needed a `dir="ltr"` island of the kind `context-chips` had to add.
 */
export const RTL: Story = {
  args: {
    script: SCRIPT,
    currentLine: 0,
    state: "level-metering",
    level: 62,
    elapsedLabel: "0:07",
    onStopRecording: () => {},
  },
  render: (args) => (
    <div dir="rtl">
      <VoiceCloneRecorder {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="voice-clone-recorder"]')!;
    await expect(getComputedStyle(root).direction).toBe("rtl");

    // The status row reverses: the dot leads in DOM order, so it paints
    // rightmost, and the elapsed time trails to its left.
    const status = root.querySelector<HTMLElement>('[data-slot="voice-clone-recorder-status"]')!;
    const dot = status.previousElementSibling as HTMLElement;
    const elapsed = root.querySelector<HTMLElement>('[data-slot="voice-clone-recorder-elapsed"]')!;
    await expect(
      `dot right of elapsed: ${dot.getBoundingClientRect().left > elapsed.getBoundingClientRect().left}`,
    ).toBe("dot right of elapsed: true");

    // …and so does the meter's header. "Input level" is first in DOM order and
    // ends up on the right; the numeric readout takes the left.
    const label = root.querySelector<HTMLElement>('[data-slot="progress-label"]')!;
    const value = root.querySelector<HTMLElement>('[data-slot="voice-clone-recorder-meter-value"]')!;
    await expect(
      `label right of value: ${label.getBoundingClientRect().left > value.getBoundingClientRect().left}`,
    ).toBe("label right of value: true");

    // The numbers keep their own order inside the mirrored rows.
    await expect(value).toHaveTextContent("62%");
    await expect(elapsed).toHaveTextContent("0:07");

    // Stop is `self-start`, which is the inline start — the right edge here.
    const stop = root.querySelector<HTMLElement>('[data-slot="voice-clone-recorder-stop"]')!;
    await expect(
      `stop flush right: ${Math.round(stop.getBoundingClientRect().right) === Math.round(root.getBoundingClientRect().right)}`,
    ).toBe("stop flush right: true");

    // Its icon leads the label, so the icon takes the right of the button.
    const icon = stop.querySelector("svg")!;
    await expect(
      `icon at the button's right: ${icon.getBoundingClientRect().left > stop.getBoundingClientRect().left + stop.getBoundingClientRect().width / 2}`,
    ).toBe("icon at the button's right: true");

    // The meter fills from the inline start, which is the right edge here.
    const track = root.querySelector<HTMLElement>('[data-slot="progress-track"]')!;
    const indicator = root.querySelector<HTMLElement>('[data-slot="progress-indicator"]')!;
    await expect(
      `meter fills from the right: ${Math.round(indicator.getBoundingClientRect().right) === Math.round(track.getBoundingClientRect().right)}`,
    ).toBe("meter fills from the right: true");
  },
};

function ReducedMotionShell() {
  const [state, setState] = React.useState<VoiceCloneRecorderState>("level-metering");
  return (
    <VoiceCloneRecorder
      script={SCRIPT}
      state={state}
      level={62}
      elapsedLabel="0:07"
      speakerName="Jamie"
      takeSummary="Take recorded — 7s"
      onStopRecording={() => setState("retake")}
      onRetake={() => setState("level-metering")}
      onAcceptTake={() => setState("consent-capture")}
      onConsentCancel={() => setState("retake")}
      onConsent={() => {}}
    />
  );
}

/**
 * Both of this component's animations, in the order a user meets them, because
 * they live in two different states and the second is reachable only through
 * the first.
 *
 * **The recording dot** is a plain `animate-pulse` on an `aria-hidden` span —
 * the registry's ordinary shape, which takes the ordinary remedy of a bare
 * `motion-reduce:animate-none` beside it. Measured here before that class was
 * added, `animation-name` read `"pulse"` under emulated reduce; it reads
 * `"none"` now. Suppressing it costs nothing, because the dot was never the
 * signal: "Recording" is text in a `role="status"` region right beside it.
 *
 * **The consent dialog** is the harder half, and the reason this story walks
 * rather than renders. `AlertDialogContent` opens with
 * `data-open:animate-in fade-in-0 zoom-in-95`, and on a Base UI popup the bare
 * `motion-reduce:animate-none` is inert: Tailwind v4 wraps the data-attribute
 * test in `:where(…)`, so both sides compile to one class of specificity and
 * the tie falls to source order, which hands the win to `animation: enter`.
 * Restating the variant on both halves — `motion-reduce:data-open:animate-none`
 * and its `data-closed` twin — sorts after its counterpart and takes the same
 * tie. Measured as `"enter"` before, `"none"` after. That is the
 * `shortcuts-sheet` finding again; E10 was one of the 33 components
 * `CONTINUE.md` §9 lists as carrying an unsuppressed popup surface.
 *
 * **What still moves under reduce, and why it was left alone.** Two things,
 * both in vendored primitives this component cannot reach from a call site:
 *
 * - `ProgressIndicator` carries `transition-all`, so the bar eases between
 *   levels. This one is arguably right: the meter's movement *is* the data. A
 *   level meter frozen under reduce stops answering the only question it
 *   exists to answer, which is whether the microphone is hearing anything.
 *   Reduced motion asks decoration to stop, not a live readout to go stale.
 * - `AlertDialogOverlay` runs its own `data-open:animate-in fade-in-0`, and
 *   `AlertDialogContent` renders it internally with no way to pass a class
 *   through. Same primitive-wide posture as the vendored `Button`'s press
 *   nudge (`CONTINUE.md` §8): recorded, not patched from here.
 */
export const ReducedMotion: Story = {
  render: () => <ReducedMotionShell />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="voice-clone-recorder"]')!;

    // 1. The dot, while recording. The class is on the element; the computed
    //    value is what says whether it won.
    const dot = root.querySelector<HTMLElement>('[data-slot="voice-clone-recorder-status"]')!
      .previousElementSibling as HTMLElement;
    await expect(dot.className).toContain("animate-pulse");
    await expect(getComputedStyle(dot).animationName).toBe("none");

    // 2. Walk to the gate the way a consumer does: stop, then accept.
    await userEvent.click(canvas.getByRole("button", { name: "Stop recording" }));
    await userEvent.click(await canvas.findByRole("button", { name: "Use this take" }));

    // Found by the slot name this component gives the popup, not the
    // primitive's: `AlertDialogContent` spreads `...props` after its own
    // `data-slot="alert-dialog-content"`, so passing one replaces it and
    // `alert-dialog-content` never appears in the DOM here. Deliberate —
    // the docs module's anatomy names this slot — but it costs a search.
    const popup = await waitFor(() => {
      const el = document.querySelector<HTMLElement>('[data-slot="voice-clone-recorder-consent"]');
      if (!el) throw new Error("the consent dialog never opened");
      return el;
    });

    // 3. Still open — the attribute the animation is keyed off is on the
    //    element, so this is the frame the bare class fails to reach.
    await expect(popup).toHaveAttribute("data-open");
    await expect(getComputedStyle(popup).animationName).toBe("none");
  },
};

/**
 * The keyboard contract of `consent-capture`, which is the state where an
 * accessibility failure stops being cosmetic: a consent control that cannot be
 * reached or named from the keyboard is a consent that was never given.
 *
 * What it pins:
 *
 * 1. The dialog has an accessible name. Base UI renders the popup
 *    `role="alertdialog"` and takes its name from `AlertDialogTitle`, which
 *    this component always renders — so it is not in the class of unnamed
 *    popups the D/I wave found on bare `PopoverContent`s.
 * 2. Focus opens on the checkbox, and the checkbox's accessible name is the
 *    **whole sentence**, not "checkbox" or "I agree". That sentence names both
 *    the person and the act, which is the difference between this and a terms
 *    link.
 * 3. **While the box is unchecked the trap holds two stops, not three.** The
 *    confirm button is genuinely `disabled`, and disabled buttons are skipped,
 *    so a keyboard user goes checkbox → Back → checkbox and never meets the
 *    control they are being gated from. Ticking the box adds it as a third.
 *    Both laps are walked below, each as exactly one cycle, so the count is a
 *    proof rather than an allowance.
 * 4. Every stop draws a visible focus treatment — asserted as `:focus-visible`
 *    plus a computed ring or outline, not as the presence of a class.
 * 5. Escape reaches `onConsentCancel` and cannot be mistaken for consent — and
 *    the dialog **stays on screen**, because `open` is hard-coded `true` and
 *    `state` belongs to the host. Backing out is a request, like every other
 *    intent this component reports; what closes the gate is the host moving
 *    `state`. The docs module's keyboard note reads "Escape closes the consent
 *    dialog and routes to `onConsentCancel`", which is a shade off — measured
 *    here, Escape only routes. A host that ignores `onConsentCancel` keeps a
 *    modal it cannot dismiss.
 *
 * Each read waits for focus to *leave* the stop it was on rather than for
 * focus to be on *some* expected stop. Inside a portal the weaker wait returns
 * a stale read and reports a lap that never closed (`story-conventions.md`
 * fact 4, tightened by the D/I wave on `ai-tools-menu`).
 *
 * **Two gaps found here, recorded rather than pinned.**
 *
 * - *The gating is imperceptible to a screen-reader user.* Because the confirm
 *   button is `disabled` it is not in the tab sequence at all while the box is
 *   unchecked, and it carries no `aria-describedby` back to the checkbox. So
 *   the sequence is: read the sentence, tab, land on Back — with nothing
 *   saying that a confirm button exists or what would reveal it. The two-stop
 *   lap below is asserted because it is *true*, not because it is right; the
 *   remedy is a design choice (an `aria-describedby`, or an enabled button
 *   that explains its refusal) and belongs to whoever owns the gate shape that
 *   N2 `trust-dialog` shares with this one.
 * - *There is no focus return.* The dialog is rendered `open` with no
 *   `AlertDialogTrigger`, so on both the confirm and the cancel path there is
 *   no element to send focus back to and it falls to `<body>`. The docs module
 *   already records it. Nothing below asserts a destination on close, because
 *   the only assertion available would be the wrong one.
 */
export const KeyboardOrder: Story = {
  args: {
    script: SCRIPT,
    state: "consent-capture",
    speakerName: "Jamie",
    onConsent: fn(),
    onConsentCancel: fn(),
  },
  play: async ({ args }) => {
    const body = within(document.body);

    // 1. A named alertdialog, not an anonymous popup.
    const dialog = await body.findByRole("alertdialog", { name: "Consent to clone this voice" });
    const scope = within(dialog);

    // 2. The checkbox is named by the sentence a person has to agree to.
    const checkbox = scope.getByRole("checkbox", { name: CONSENT_SENTENCE });
    const back = scope.getByRole("button", { name: "Back" });
    const confirm = scope.getByRole("button", { name: "Confirm & clone voice" });

    const nameOf = (el: Element | null) =>
      el === null
        ? "nothing"
        : `${el.getAttribute("role") ?? el.tagName.toLowerCase()} "${el.textContent?.trim().slice(0, 28) ?? ""}"`;

    /**
     * The focused element, once Base UI has finished moving focus off
     * `previous`. Reading `document.activeElement` the instant a key resolves
     * races the portal's own focus management, and waiting only for "focus is
     * on some expected stop" cannot see a press that has not applied yet,
     * because focus is still on a stop — the stale one.
     */
    const settled = async (stops: HTMLElement[], previous?: HTMLElement) => {
      await waitFor(() => {
        const active = document.activeElement;
        if (!stops.includes(active as HTMLElement)) {
          throw new Error(`focus is not on an expected stop: ${nameOf(active)}`);
        }
        if (previous && active === previous) {
          throw new Error(`focus has not moved off ${nameOf(previous)} yet`);
        }
      });
      return document.activeElement as HTMLElement;
    };

    const walk = async (stops: HTMLElement[]) => {
      const start = await settled(stops);
      const seen = new Set<HTMLElement>([start]);
      let previous = start;
      for (let i = 1; i < stops.length; i += 1) {
        await userEvent.tab();
        const focused = await settled(stops, previous);
        await expect(`${nameOf(focused)} repeat=${seen.has(focused)}`).toBe(
          `${nameOf(focused)} repeat=false`,
        );
        const style = getComputedStyle(focused);
        await expect(
          `${nameOf(focused)} focusVisible=${focused.matches(":focus-visible")} ring=${style.boxShadow !== "none" || style.outlineStyle !== "none"}`,
        ).toBe(`${nameOf(focused)} focusVisible=true ring=true`);
        seen.add(focused);
        previous = focused;
      }
      // The cycle closes: one more tab returns to where the lap began.
      await userEvent.tab();
      await expect(nameOf(await settled(stops, previous))).toBe(nameOf(start));
      return seen;
    };

    // 3a. Unchecked: the confirm button is disabled, so it is not a stop.
    await expect(confirm).toBeDisabled();
    await expect(await settled([checkbox])).toBe(checkbox);
    await expect((await walk([checkbox, back])).size).toBe(2);

    // 3b. Tick the box from the keyboard — Space, on the checkbox itself.
    await settled([checkbox]);
    await userEvent.keyboard(" ");
    await waitFor(() => expect(confirm).toBeEnabled());
    await expect((await walk([checkbox, back, confirm])).size).toBe(3);

    // 5. Escape asks the host to back out. It routes to onConsentCancel, never
    //    to onConsent — and the dialog stays, because `open` is not this
    //    component's to change.
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(args.onConsentCancel).toHaveBeenCalled());
    await expect(args.onConsent).not.toHaveBeenCalled();
    await expect(document.querySelector('[data-slot="voice-clone-recorder-consent"]')).not.toBeNull();
  },
};

const NEXT_STATE = {
  start: "level-metering",
  stop: "retake",
  retake: "level-metering",
  accept: "consent-capture",
} as const;

function ControlledShell() {
  const [applied, setApplied] = React.useState<VoiceCloneRecorderState>("prompt-script");
  const [requested, setRequested] = React.useState<keyof typeof NEXT_STATE | null>(null);
  const [pass, setPass] = React.useState(1);
  const [consentedAt, setConsentedAt] = React.useState<string | null>(null);

  return (
    <div className="flex items-start gap-6">
      <VoiceCloneRecorder
        script={SCRIPT}
        state={applied}
        level={62}
        elapsedLabel="0:07"
        speakerName="Jamie"
        takeSummary="Take recorded — 7s"
        onStartRecording={() => setRequested("start")}
        onStopRecording={() => setRequested("stop")}
        onRetake={() => setRequested("retake")}
        onAcceptTake={() => setRequested("accept")}
        // Applied on the spot rather than recorded: while the gate is open the
        // host's own controls sit behind a modal and cannot be reached, so a
        // deferring host would have no way to close it. See the description.
        onConsentCancel={() => {
          setRequested(null);
          setApplied("retake");
        }}
        onConsent={(info) => setConsentedAt(info.consentedAt)}
      />

      <div className="flex flex-col gap-4 py-1">
        <dl className="text-foreground grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs">
          <dt>state prop</dt>
          <dd data-testid="applied">{applied}</dd>
          <dt>last intent</dt>
          <dd data-testid="requested">{requested ?? "—"}</dd>
          <dt>host render pass</dt>
          <dd data-testid="render-pass" className="tabular-nums">
            {pass}
          </dd>
          <dt>onConsent payload</dt>
          <dd data-testid="consented">{consentedAt === null ? "—" : "consentedAt received"}</dd>
        </dl>

        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setPass((n) => n + 1)}>
            Re-render
          </Button>
          <Button
            size="sm"
            disabled={requested === null}
            onClick={() => {
              if (requested !== null) setApplied(NEXT_STATE[requested]);
              setRequested(null);
            }}
          >
            Apply
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * `state` is a controlled pair with no uncontrolled half: the component holds
 * no flow state at all, so every transition is the host's to make. The shell
 * here holds it the hard way — recording what the recorder asked for and
 * applying it only when told to — because that is the only arrangement that
 * can tell "the component moved itself" apart from "the host moved it".
 *
 * What that proves, in order: pressing Start does not leave `prompt-script`; a
 * re-render with an unchanged `state` leaves it there too; and applying the
 * request is what moves it.
 *
 * **The change callbacks carry no payload, and here that is the design rather
 * than a gap.** `onStartRecording`, `onStopRecording`, `onRetake` and
 * `onAcceptTake` are all `() => void`: what a host needs to know is *which
 * control was pressed*, and the callback's identity already is that. The one
 * callback that carries data is `onConsent`, and what it carries is a
 * timestamp — the moment the box was ticked and confirmed, which is the record
 * a consent needs to be worth anything afterwards.
 *
 * **And the half a host deliberately cannot drive.** There is no `consented`
 * or `defaultConsented` prop, so the checkbox is unreachable from outside; and
 * because the parent unmounts the dialog whenever `state` leaves
 * `consent-capture`, leaving and re-entering the gate resets it. The walk
 * below does exactly that and finds the box unchecked and confirm disabled the
 * second time. That is the difference from N2 `trust-dialog`, which took this
 * component's gate shape and made its checkbox optionally controlled —
 * defensible for trusting a template, wrong for consenting to a clone of a
 * person.
 *
 * **One thing writing this story found.** While `consent-capture` is rendered
 * the dialog is modal, so everything outside it — including this shell's own
 * Apply button — is unreachable. A host that defers applying intents therefore
 * *has* to apply the cancel intent from inside `onConsentCancel` rather than
 * queueing it, or the gate can never be closed. Worth knowing before wiring
 * this into a reducer that batches.
 */
export const Controlled: Story = {
  render: () => <ControlledShell />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const stateIs = (value: string) => expect(canvas.getByTestId("applied")).toHaveTextContent(value);
    const apply = () => userEvent.click(canvas.getByRole("button", { name: "Apply" }));
    const gate = async () => within(await within(document.body).findByRole("alertdialog"));
    const gateClosed = () =>
      waitFor(() => expect(document.querySelector('[data-slot="voice-clone-recorder-consent"]')).toBeNull());

    await stateIs("prompt-script");

    // 1. Interaction alone does not move the rendered value.
    await userEvent.click(canvas.getByRole("button", { name: "Start recording" }));
    await stateIs("prompt-script");

    // 2. …but the intent was reported, and its identity is the payload.
    await expect(canvas.getByTestId("requested")).toHaveTextContent("start");

    // 3. A re-render with an unchanged `state` holds it fixed. Prove the
    //    re-render happened first, or the assertion proves nothing.
    await expect(canvas.getByTestId("render-pass")).toHaveTextContent("1");
    await userEvent.click(canvas.getByRole("button", { name: "Re-render" }));
    await expect(canvas.getByTestId("render-pass")).toHaveTextContent("2");
    await stateIs("prompt-script");

    // 4. Applying the request is what moves it.
    await apply();
    await stateIs("level-metering");

    // 5. Walk to the gate.
    await userEvent.click(canvas.getByRole("button", { name: "Stop recording" }));
    await apply();
    await stateIs("retake");
    await userEvent.click(canvas.getByRole("button", { name: "Use this take" }));
    await apply();
    await stateIs("consent-capture");

    // 6. Tick, confirm, and read the one payload in the component.
    const first = await gate();
    await expect(first.getByRole("button", { name: "Confirm & clone voice" })).toBeDisabled();
    await userEvent.click(first.getByRole("checkbox", { name: CONSENT_SENTENCE }));
    await userEvent.click(first.getByRole("button", { name: "Confirm & clone voice" }));
    await expect(canvas.getByTestId("consented")).toHaveTextContent("consentedAt received");

    // 7. Back out — applied on the spot, since the host is unreachable behind
    //    the modal — then walk in again. The tick did not survive.
    await userEvent.click(first.getByRole("button", { name: "Back" }));
    await gateClosed();
    await stateIs("retake");

    await userEvent.click(canvas.getByRole("button", { name: "Use this take" }));
    await apply();
    const second = await gate();
    await expect(second.getByRole("checkbox", { name: CONSENT_SENTENCE })).not.toBeChecked();
    await expect(second.getByRole("button", { name: "Confirm & clone voice" })).toBeDisabled();

    // Leave the canvas with no modal over it.
    await userEvent.click(second.getByRole("button", { name: "Back" }));
    await gateClosed();
  },
};

/**
 * `retake` with every optional prop left out — no `takeUrl`, no `takeSummary`,
 * no overridden labels — which is what a consumer ships the first time they
 * wire `onStopRecording` to a state change and forget that stopping has to
 * hand a take back with it.
 *
 * **The two controls survive intact, which is the answer to the icon-only
 * worry.** `retakeLabel` and `acceptLabel` default to real words, so Retake
 * and Use this take are never a bare `RotateCcw` and a bare `Check`; both
 * glyphs are `aria-hidden` and contribute nothing to either name. The same
 * holds for Start and Stop in the other two states. This component has no
 * icon-only control anywhere.
 *
 * **What does collapse is the thing being reviewed.** With neither `takeUrl`
 * nor `takeSummary`, the playback region renders as an empty box: no player,
 * no summary, no empty-state message, and nothing to distinguish it from a
 * take that exists. The buttons still offer to keep or discard something the
 * speaker cannot hear. The docs module lists this as a pitfall; the assertion
 * below is what makes it visible.
 *
 * **And a hole the defaults do not cover.** A default applies only to
 * `undefined`, so `retakeLabel=""` produces a genuinely unnamed button and
 * nothing in the component refuses it. Not rendered here, because rendering it
 * would ship an axe `button-name` violation into a gate that runs at
 * `test: "error"` — the same reason `quote-reply` and `suggestion-chips` give
 * for their own skips. Recorded instead.
 *
 * Omitting `speakerName` has a comparable cost one state further on: every
 * consent string degrades from "Jamie" to "this person", in the checkbox
 * sentence and the disclaimer both. Not rendered here because it lives behind
 * the modal, and `voice-clone-recorder.test.tsx` already pins the named form.
 */
export const EmptyLabel: Story = {
  args: {
    script: SCRIPT,
    state: "retake",
    onRetake: () => {},
    onAcceptTake: () => {},
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Named by their own text, with the glyph contributing nothing.
    await expect(canvas.getByRole("button", { name: "Retake" })).toHaveAccessibleName("Retake");
    await expect(canvas.getByRole("button", { name: "Use this take" })).toHaveAccessibleName("Use this take");

    // The review region is present and holds nothing to review.
    const playback = canvasElement.querySelector<HTMLElement>('[data-slot="voice-clone-recorder-playback"]')!;
    await expect(`playback children=${playback.children.length} text="${playback.textContent}"`).toBe(
      'playback children=0 text=""',
    );
  },
};

/**
 * A ~90-character script line, which is the length a real prompt reaches as
 * soon as it stops being a pangram and starts asking the speaker to do
 * something — pace, pause, change intonation. `script` is the one required
 * author-supplied string in the component, so it is the slot that decides
 * whether long content stays readable.
 *
 * It wraps. The line is a `<p>` with `leading-relaxed` and no `truncate`, no
 * `line-clamp` and no fixed height, inside a `max-w-md` column, so a long line
 * becomes two and pushes the Start button down rather than losing its ending.
 * That is the right call for this slot for a reason specific to this
 * component: the text is not a label, it is the thing the speaker reads aloud,
 * so an ellipsis would not be a cosmetic loss — it would be a sample recorded
 * from half a sentence.
 *
 * The counter above it holds its shape at any length, since it is generated
 * from the array rather than author-supplied.
 */
export const LongContent: Story = {
  args: {
    script: [
      "Please read this line at a natural pace, then pause for a moment before you begin the next.",
      "Six thick slabs of quartz gave the judge a moment of pause before he finally spoke again.",
    ],
    currentLine: 0,
    state: "prompt-script",
    onStartRecording: () => {},
  },
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="voice-clone-recorder"]')!;
    const script = root.querySelector<HTMLElement>('[data-slot="voice-clone-recorder-script"]')!;
    const line = script.querySelector<HTMLElement>("p:last-of-type")!;
    const lineHeight = parseFloat(getComputedStyle(line).lineHeight);

    // Wrapped, not clipped: more than one line box, and nothing hidden.
    await expect(
      `lines=${Math.round(line.scrollHeight / lineHeight) > 1} clipped=${line.scrollWidth > line.clientWidth}`,
    ).toBe("lines=true clipped=false");
    await expect(`root overflows=${root.scrollWidth > root.clientWidth}`).toBe("root overflows=false");

    // The counter is generated, so it is the one string here that cannot grow.
    await expect(script).toHaveTextContent("Line 1 of 2");
  },
};

/**
 * 375px, in `level-metering` — the state carrying the most furniture on a
 * single inline axis: a three-part status row, a label/value pair split across
 * the full width, and a meter that spans it.
 *
 * The component sets `max-w-md` (448px), so at this width the wrapper is what
 * constrains it and every row has to fold or fit on its own. They fit: the
 * status row keeps "Recording" and the elapsed time on one line, and the meter
 * header keeps its label and its percentage on one line — so the numeric
 * readout the meter's accessibility depends on is never the thing that wraps
 * away.
 *
 * `consent-capture` is deliberately not the state rendered here, for a
 * mechanical reason rather than an editorial one: the dialog portals to the
 * end of `document.body`, so a 375px wrapper cannot reach it, and its own
 * widths (`max-w-xs`, `sm:max-w-sm`) are viewport-driven while the gate runs
 * headless chromium at its own size. That is the neighbour of the trap
 * `story-conventions.md` fact 2 records about `parameters.viewport`, and it
 * leaves a narrow-viewport pass over the consent dialog as a gap this story
 * cannot close. The vendored `AlertDialogFooter` is where it would bite:
 * `flex-col-reverse` below `sm`, which paints confirm above Back while Back
 * stays first in the tab order.
 */
export const Mobile: Story = {
  args: {
    script: SCRIPT,
    currentLine: 0,
    state: "level-metering",
    level: 62,
    elapsedLabel: "0:07",
    onStopRecording: () => {},
  },
  render: (args) => (
    <div className="w-[375px] max-w-full">
      <VoiceCloneRecorder {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="voice-clone-recorder"]')!;
    await expect(`root overflows=${root.scrollWidth > root.clientWidth}`).toBe("root overflows=false");
    await expect(`root width=${Math.round(root.getBoundingClientRect().width)}`).toBe("root width=375");

    const oneLine = (el: HTMLElement) => {
      const lineHeight = parseFloat(getComputedStyle(el).lineHeight);
      return `${Math.round(el.scrollHeight / lineHeight)} line, overflow=${el.scrollWidth > el.clientWidth}`;
    };

    // "Recording" and the elapsed time stay together on one line.
    const statusRow = root.querySelector<HTMLElement>(
      '[data-slot="voice-clone-recorder-status"]',
    )!.parentElement!;
    await expect(oneLine(statusRow)).toBe("1 line, overflow=false");

    // …and so do the meter's label and its numeric readout.
    const meterHeader = root.querySelector<HTMLElement>('[data-slot="progress-label"]')!.parentElement!;
    await expect(oneLine(meterHeader)).toBe("1 line, overflow=false");
  },
};

/**
 * E10 beside E9 `tts-composer`, the other voice component in family E, because
 * "voice" is where the catalog's two rows read closest and the rule that
 * separates them is not about how they look.
 *
 * - **Voice clone recorder** takes a voice *from a person*. Its input is a
 *   human being reading aloud, its output is a model of them, and the reason
 *   it is a guided flow rather than an upload field is that the consent has to
 *   be captured next to the recording it belongs to — gaps.md §2 R7's
 *   restoration note, which is why this component came back after being cut.
 * - **TTS composer** uses a voice that already exists. Its input is a script,
 *   the voice is a setting on a segment, and there is no consent step anywhere
 *   in it, because the permission question was settled before that voice
 *   entered the picker.
 *
 * So: if the person is in the room, it is E10. If the voice is already in the
 * product, it is E9.
 *
 * Two closer neighbours are described rather than rendered, because each is a
 * modal that would portal on top of this one and mark the rest of the canvas
 * `aria-hidden` — a comparison the story would manufacture rather than show.
 * Both share this component's exact gate shape (`alert-dialog` + `checkbox` +
 * a disabled confirm), and N2 says so in its own source:
 *
 * - **N2 `trust-dialog`** gates on trusting *content someone else wrote*
 *   before it runs. Its checkbox is optionally controlled, which is right for
 *   a template and wrong for a person.
 * - **N8 `permission-prompt`** gates on an *agent's* next side effect, and
 *   weights its options equally rather than making one of them the gate.
 *
 * The rule across all three: E10 is the one where what is being consented to
 * is a person rather than an action.
 */
export const Boundary: Story = {
  render: () => (
    <div className="flex w-full flex-col gap-6">
      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">
          Voice clone recorder — a person reads aloud, and consents to being cloned
        </p>
        <VoiceCloneRecorder
          script={SCRIPT}
          currentLine={0}
          state="prompt-script"
          onStartRecording={() => {}}
        />
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">
          TTS composer — a script spoken by a voice that already exists
        </p>
        <TtsComposer
          segments={[
            {
              id: "s1",
              text: "Welcome back to Signal Boost — the show about products people actually finish building.",
              voice: "Bella — Warm",
              status: "ready",
              durationLabel: "0:05",
              regenerateCost: 2,
            },
          ]}
          onSelectSegment={() => {}}
          onRegenerateSegment={() => {}}
        />
      </section>
    </div>
  ),
};
