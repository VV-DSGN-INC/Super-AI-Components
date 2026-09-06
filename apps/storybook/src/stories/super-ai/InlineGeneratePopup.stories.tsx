import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { AiDocBlock } from "@/registry/super-ai/ai-doc-block";
import { InlineGeneratePopup } from "@/registry/super-ai/inline-generate-popup";
import { InlineGeneratePopupDocs } from "@/content/components/inline-generate-popup.docs";
import { componentDocsPage } from "@/lib/component-docs-page";
import { focusTreatmentSignature, settledFocusRing } from "@/lib/focus-ring";

const meta: Meta<typeof InlineGeneratePopup> = {
  title: "Super AI/Inline Generate Popup",
  component: InlineGeneratePopup,
  parameters: { layout: "centered", docs: { page: componentDocsPage(InlineGeneratePopupDocs) } },
  args: {
    context: "Q3 revenue drivers",
    contextLabel: "Under",
    triggerLabel: "Ask AI on this line",
    onSubmit: () => {},
    onCancel: () => {},
    onCommit: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof InlineGeneratePopup>;

const PROMPT = "Three bullets on why churn moved";

/**
 * Waiting on a prompt. The heading it sits under is already on screen, so the
 * placeholder is four words rather than an instruction template.
 */
export const Idle: Story = {
  args: { state: "idle" },
};

/**
 * A run in flight: announced in a live region, interruptible by a real Cancel
 * button, and the prompt stays readable throughout.
 */
export const Generating: Story = {
  args: {
    state: "generating",
    defaultPrompt: PROMPT,
  },
};

/**
 * After a cancel. The prompt survived, nothing was committed, and the primary
 * button reads Try again — the state is legible as words, not as a faded frame.
 */
export const Cancelled: Story = {
  args: {
    state: "cancelled",
    defaultPrompt: PROMPT,
  },
};

/* -------------------------------------------------------------------------
 * Case stories — the situations this popup meets inside a real document, as
 * opposed to the three states above. See
 * docs/design-system/story-conventions.md.
 *
 * All eight are true for this component, so there are no `case-skip` lines.
 * It has one animation it owns (the run spinner), two tab stops and a focus
 * return, two genuine controlled pairs (`prompt`/`onPromptChange` and
 * `open`/`onOpenChange`), one optional text slot (`context`), three
 * author-supplied strings, and a near-twin it is defined against — K1
 * `ai-doc-block`, which is where its output is supposed to land.
 * ---------------------------------------------------------------------- */

/** Sets `dir` on the document, because a wrapper cannot reach a portal. */
function RtlDocument({ children }: { children: React.ReactNode }) {
  React.useLayoutEffect(() => {
    const previous = document.documentElement.dir;
    document.documentElement.dir = "rtl";
    return () => {
      document.documentElement.dir = previous;
    };
  }, []);
  return <>{children}</>;
}

/**
 * Right-to-left, with `dir` on the document element rather than on a wrapper:
 * the popup portals to the end of `<body>`, so a `<div dir="rtl">` around the
 * trigger never reaches it.
 *
 * Everything mirrors, and this story records why. The source names no physical
 * side anywhere — no `pl-`, `ml-`, `border-l` or `text-left` — only `gap-*`,
 * `justify-end` and `align="start"` on the positioner. The measurement that
 * matters is that last one: **Base UI's popover positioner resolves `start`
 * against the writing direction**, not against the viewport, so the popup's
 * *right* edge lines up with the trigger's right edge under RTL and its left
 * edge with the trigger's left edge under LTR. Measured at mid-viewport in both
 * directions, where neither read can be a collision shift: RTL popup 495..815
 * against trigger 685..815, LTR popup 385..705 against trigger 385..515.
 *
 * The story itself renders with no sizing wrapper, so `layout: "centered"`
 * under RTL puts the trigger flush against the viewport's right edge and the
 * panel lands 5px inside it — Base UI's collision padding. That is why the
 * assertions below are two relations rather than an edge match: the panel hangs
 * leftwards from the trigger and never crosses its right edge. Both invert
 * under LTR, and neither depends on the padding constant.
 *
 * That is worth pinning because it is *not* the behaviour of the Base UI
 * composites `CONTINUE.md` §8 records: those read `useDirection()` and fall
 * back to `"ltr"` with no `DirectionProvider` mounted. The positioner reads the
 * DOM instead, so this component needs no shell-level fix.
 */
export const RTL: Story = {
  args: { state: "cancelled", defaultPrompt: PROMPT },
  render: (args) => (
    <RtlDocument>
      <InlineGeneratePopup {...args} />
    </RtlDocument>
  ),
  play: async ({ canvasElement }) => {
    const body = within(document.body);
    const popup = await body.findByRole("dialog");
    const trigger = canvasElement.querySelector<HTMLElement>('[data-slot="inline-generate-popup-trigger"]')!;

    // The portal inherits direction from the document element, which is the
    // reason this story is shaped the way it is.
    await expect(getComputedStyle(popup).direction).toBe("rtl");

    // `align="start"` is the trigger's *right* edge here. Stated as two
    // relations rather than an edge match, so no collision-padding constant
    // leaks into the assertion: the panel hangs leftwards from the trigger and
    // never past its right edge. Under LTR both are false — the panel would
    // start at the trigger's left edge and run 190px past its right one.
    await expect(popup.closest("[data-align]")?.getAttribute("data-align")).toBe("start");
    const t = trigger.getBoundingClientRect();
    const p = popup.getBoundingClientRect();
    await expect(`hangsLeftwards=${p.left < t.left}`).toBe("hangsLeftwards=true");
    await expect(`staysWithinStartEdge=${p.right <= t.right + 1}`).toBe("staysWithinStartEdge=true");

    // The title's sparkle leads at the visual right, ahead of the heading.
    const title = popup.querySelector<HTMLElement>('[data-slot="inline-generate-popup-title"]')!;
    const sparkle = title.querySelector("svg")!;
    await expect(
      `sparkleLeads=${sparkle.getBoundingClientRect().right > title.getBoundingClientRect().right - 24}`,
    ).toBe("sparkleLeads=true");

    // So does the live region's cancelled glyph, for the same reason: a flex
    // row with a gap and no side named.
    const status = popup.querySelector<HTMLElement>('[data-slot="inline-generate-popup-status"]')!;
    const glyph = status.querySelector("svg")!;
    await expect(
      `glyphLeads=${glyph.getBoundingClientRect().right > status.getBoundingClientRect().right - 24}`,
    ).toBe("glyphLeads=true");

    // `justify-end` puts the primary button at the logical end, which is the
    // visual left. Against a `ml-auto` this would read the other way round.
    const actions = popup.querySelector<HTMLElement>('[data-slot="inline-generate-popup-actions"]')!;
    const retry = within(actions).getByRole("button", { name: "Try again" });
    await expect(
      `buttonAtVisualLeft=${retry.getBoundingClientRect().left - actions.getBoundingClientRect().left < 2}`,
    ).toBe("buttonAtVisualLeft=true");
  },
};

/**
 * The run spinner under `prefers-reduced-motion: reduce`, which
 * `vitest.config.ts` emulates for every story in this project.
 *
 * The spinner is the only thing in this component that moves, and it did not
 * branch: measured `animationName: "spin"` under emulated reduce before this
 * wave, `"none"` after `motion-reduce:animate-none` was added beside it. A
 * plain variant is enough here and that is worth saying, because the
 * convention's mechanical fact 3 records that the same class is *inert* on a
 * Base UI popup surface. It is inert there because the vendored
 * `PopoverContent` animates through `data-open:animate-in` /
 * `data-closed:animate-out`, which sort after the plain `motion-reduce:` block
 * and win the specificity tie. This component composes Base UI's `Popup`
 * directly with its own classes — it needed the positioner's `anchor` prop,
 * which the wrapper drops — so it carries no `data-*` animation to lose that
 * tie against, and the popup surface computes `animationName: "none"` open or
 * closed, with or without any suppression.
 *
 * The surface assertion below therefore cannot fail today. It is kept as a
 * regression guard on that composition choice: swapping this component onto
 * the vendored `PopoverContent` would start animating the panel and would need
 * the restated pair, and this story is where that would surface.
 */
export const ReducedMotion: Story = {
  args: { state: "generating", defaultPrompt: PROMPT },
  play: async () => {
    const body = within(document.body);
    const popup = await body.findByRole("dialog");
    await expect(window.matchMedia("(prefers-reduced-motion: reduce)").matches).toBe(true);

    const spinner = popup.querySelector<HTMLElement>(".animate-spin")!;
    await expect(`spinner=${getComputedStyle(spinner).animationName}`).toBe("spinner=none");

    // The regression guard described above, not a measurement of a fix.
    await expect(`panel=${getComputedStyle(popup).animationName}`).toBe("panel=none");

    // Suppressing the spin costs nothing legible: the run is announced in
    // words either way, which is what keeps the state readable when the only
    // moving part stops moving.
    const status = popup.querySelector<HTMLElement>('[data-slot="inline-generate-popup-status"]')!;
    await expect(status).toHaveTextContent("Generating…");
  },
};

/** Owns `state`, so the full idle → generating → cancelled arc is walkable. */
function RunHost() {
  const [state, setState] = React.useState<"idle" | "generating" | "cancelled">("idle");
  return (
    <InlineGeneratePopup
      state={state}
      context="Q3 revenue drivers"
      contextLabel="Under"
      triggerLabel="Ask AI on this line"
      defaultOpen={false}
      defaultPrompt={PROMPT}
      onSubmit={() => setState("generating")}
      onCancel={() => setState("cancelled")}
    />
  );
}

/**
 * The whole keyboard arc, driven by a host that owns `state` so the
 * transitions really happen: open from the trigger, walk the popup, send,
 * cancel, dismiss.
 *
 * Four things it pins.
 *
 * **The popup is not a focus trap, and tabbing out dismisses it.** Base UI's
 * popover is non-modal, so the tab after the last control leaves the panel
 * rather than wrapping inside — and the panel closes behind you, putting focus
 * on the trigger. So a keyboard user cannot walk past Generate and back in;
 * they get their request cancelled by a keystroke that looks like navigation.
 * That is Base UI's behaviour rather than this component's, and it is the
 * reason this story asserts a departure and a dismissal instead of a cycle the
 * way `ai-tools-menu`'s menu walk does. Worth knowing before writing a host
 * that keeps expensive state in the popup.
 *
 * **Cancelling does not lose focus, and it is not obvious that it shouldn't.**
 * The Cancel button is replaced by Try again, which is the shape wave 1 found
 * losing focus in four components. It survives here for a structural reason:
 * both buttons are the same element type in the same slot of one ternary, so
 * React reconciles them as one DOM node and relabels it in place. Asserted by
 * identity — the node focus is on after the cancel is the same node Cancel was.
 * An edit that gave the two branches different keys, or split them into two
 * slots, would drop focus to `<body>` and this assertion is what would catch it.
 *
 * **Focus comes back to the trigger on both dismissal routes.** Escape from
 * inside the panel and tabbing past the last control both end with the trigger
 * focused; measured on each. That holds only because there *is* a trigger. With
 * an `anchor` and no trigger there is nothing to restore to, focus falls to
 * `<body>` and the next Tab restarts from the top of the page — the docs
 * module's focus note carries that case, and it is why a host is told to take
 * focus in its own `onCommit`.
 *
 * **A ring at every stop, checked both ways.** `settledFocusRing` asks whether
 * anything is painted; the differential asks whether focus is what painted it.
 * They can disagree, so mechanical fact 5 now asks for both. `settledFocusRing`
 * runs on all five elements focus visits here and the differential on the two
 * where a baseline can be taken without a blur — the trigger before the first
 * tab, and the submit button read while focus is still on the prompt. Both are
 * needed on this component: the vendored `Button` fades its ring in over
 * ~150ms, measured on the relabelled Try again
 * (`oklab(0.708 0 0 / 0.0164) 0px 0px 0px 0.098px` on the frame the cancel
 * lands, `oklab(0.708 0 0 / 0.5) 0px 0px 0px 3px` once settled), so an
 * immediate read on any of them is a false negative.
 */
export const KeyboardOrder: Story = {
  render: () => <RunHost />,
  play: async ({ canvasElement }) => {
    const body = within(document.body);
    const trigger = within(canvasElement).getByRole("button", { name: "Ask AI on this line" });

    const triggerBefore = focusTreatmentSignature(trigger);
    await userEvent.tab();
    await expect(document.activeElement).toBe(trigger);
    await expect(trigger.matches(":focus-visible")).toBe(true);
    await settledFocusRing(trigger, waitFor);
    await expect(`triggerRingIsFromFocus=${focusTreatmentSignature(trigger) !== triggerBefore}`).toBe(
      "triggerRingIsFromFocus=true",
    );

    await userEvent.keyboard("{Enter}");
    const popup = await body.findByRole("dialog", { name: "Generate here" });

    /**
     * Settle on departure, not on arrival — `story-conventions.md` fact 4.
     * Reading `document.activeElement` straight after a tab inside a portal can
     * return the trailing focus guard, or the stop the guard has already
     * redirected to, depending on whether the frame has painted. Naming the
     * stop focus has to *leave* makes every press provably one move.
     */
    const settled = async (previous?: Element) => {
      await waitFor(() => {
        const active = document.activeElement;
        if (!active || active === document.body) throw new Error("focus is on <body>");
        if (previous && active === previous) {
          throw new Error(`focus has not left ${previous.tagName} yet`);
        }
      });
      return document.activeElement as HTMLElement;
    };

    // A portal focuses its own first tabbable on open, so the walk is seeded
    // from where focus actually landed rather than from an assumed first stop.
    const prompt = popup.querySelector<HTMLTextAreaElement>('[data-slot="inline-generate-popup-prompt"]')!;
    await waitFor(() => expect(document.activeElement).toBe(prompt));
    await expect(prompt.matches(":focus-visible")).toBe(true);
    await settledFocusRing(prompt, waitFor);

    // The stop count depends on the prompt, which is the docs page's keyboard
    // claim and is asserted here in both shapes. The query filters on
    // `:disabled` rather than on `[tabindex]:not([tabindex="-1"])` because Base
    // UI leaves `tabindex="0"` on a natively-disabled button — measured on this
    // very control, and the reason a tabindex query would count an inert stop.
    const stopSlots = () =>
      Array.from(popup.querySelectorAll<HTMLElement>("button:not(:disabled), textarea")).map(
        (el) => el.dataset.slot,
      );

    await userEvent.clear(prompt);
    const disabledSubmit = popup.querySelector<HTMLButtonElement>(
      '[data-slot="inline-generate-popup-submit"]',
    )!;
    await expect(disabledSubmit.disabled).toBe(true);
    await expect(disabledSubmit.getAttribute("tabindex")).toBe("0");
    await expect(stopSlots()).toEqual(["inline-generate-popup-prompt"]);

    await userEvent.type(prompt, PROMPT);
    await expect(stopSlots()).toEqual(["inline-generate-popup-prompt", "inline-generate-popup-submit"]);

    const submit = disabledSubmit;
    const submitBefore = focusTreatmentSignature(submit);
    await userEvent.tab();
    await expect(await settled(prompt)).toBe(submit);
    await expect(submit.matches(":focus-visible")).toBe(true);
    await settledFocusRing(submit, waitFor);
    await expect(`submitRingIsFromFocus=${focusTreatmentSignature(submit) !== submitBefore}`).toBe(
      "submitRingIsFromFocus=true",
    );

    // Non-modal: the next tab leaves the panel rather than wrapping inside it,
    // and the panel closes behind you — focus lands on the trigger, not on
    // whatever the portal put next in the document.
    await userEvent.tab();
    await expect(await settled(submit)).toBe(trigger);
    await waitFor(() => expect(body.queryByRole("dialog")).toBeNull());

    // Re-open for the run. Enter in the prompt sends, and the field stays
    // readable — `readOnly`, not `disabled` — so it keeps its stop, its
    // content and its focus through the run.
    await userEvent.keyboard("{Enter}");
    const reopened = await body.findByRole("dialog", { name: "Generate here" });
    const prompt2 = reopened.querySelector<HTMLTextAreaElement>(
      '[data-slot="inline-generate-popup-prompt"]',
    )!;
    await waitFor(() => expect(document.activeElement).toBe(prompt2));

    await userEvent.keyboard("{Enter}");
    const cancel = await waitFor(() => {
      const el = reopened.querySelector<HTMLElement>('[data-slot="inline-generate-popup-cancel"]');
      if (!el) throw new Error("Cancel has not rendered");
      return el;
    });
    await expect(prompt2.readOnly).toBe(true);
    await expect(document.activeElement).toBe(prompt2);

    await userEvent.tab();
    await expect(await settled(prompt2)).toBe(cancel);
    await settledFocusRing(cancel, waitFor);

    await userEvent.keyboard("{Enter}");
    const retry = await waitFor(() => {
      const el = reopened.querySelector<HTMLElement>('[data-slot="inline-generate-popup-submit"]');
      if (!el) throw new Error("Try again has not rendered");
      return el;
    });
    // The identity claim: one node, relabelled, still focused.
    await expect(retry).toBe(cancel);
    await expect(document.activeElement).toBe(retry);
    await expect(retry).toHaveTextContent("Try again");
    await expect(retry.matches(":focus-visible")).toBe(true);
    await settledFocusRing(retry, waitFor);

    // Dismissing from inside the panel puts focus back on the trigger, and the
    // wait for the panel to be gone is not optional: axe scans the moment this
    // play returns, and a surface still unmounting is measured mid-transition.
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("dialog")).toBeNull());
    await waitFor(() => expect(document.activeElement).toBe(trigger));
  },
};

/**
 * Holds `prompt` and `open` externally and refuses both, which is the only way
 * to tell a controlled pair from a component that merely reports.
 */
function ControlledHost() {
  const [prompt, setPrompt] = React.useState(PROMPT);
  const [requested, setRequested] = React.useState("—");
  const [closeRequests, setCloseRequests] = React.useState(0);
  const [committed, setCommitted] = React.useState<string[]>([]);
  const [result, setResult] = React.useState<string | undefined>(undefined);
  const [pass, setPass] = React.useState(1);
  return (
    <div className="flex flex-col items-start gap-2 text-sm">
      <InlineGeneratePopup
        state="idle"
        open
        onOpenChange={(next) => {
          if (!next) setCloseRequests((n) => n + 1);
        }}
        prompt={prompt}
        onPromptChange={setRequested}
        context="Q3 revenue drivers"
        contextLabel="Under"
        result={result}
        onCommit={(text) => setCommitted((c) => [...c, text])}
      />
      <button type="button" onClick={() => setPass((n) => n + 1)}>
        Re-render
      </button>
      <button type="button" onClick={() => setPrompt(requested)}>
        Apply
      </button>
      <button
        type="button"
        onClick={() => setResult("Revenue grew 14% quarter over quarter, led by self-serve.")}
      >
        Deliver result
      </button>
      <span data-testid="prompt">{prompt}</span>
      <span data-testid="requested">{requested}</span>
      <span data-testid="closeRequests">{closeRequests}</span>
      <span data-testid="committed">{committed.join("|") || "—"}</span>
      <span data-testid="pass">{pass}</span>
    </div>
  );
}

/**
 * Both controlled pairs, driven by a host that refuses everything.
 *
 * `prompt`/`onPromptChange` behaves the way a controlled field should: typing
 * moves nothing, the callback carries the whole next value rather than a delta,
 * and a re-render with an unchanged `prompt` holds the field fixed. The host
 * applying the value is what moves it.
 *
 * `open`/`onOpenChange` is the interesting half, because the commit path uses
 * it. When `result` arrives the component fires `onCommit` once and then *asks*
 * to close — it does not close itself. A controlled host that ignores the
 * request keeps the popup open, which is the assertion below and is the
 * difference between a request and a side effect. Note the corollary: the popup
 * closing after a commit is the host's doing, so a host that controls `open`
 * and forgets to handle `false` gets a popup that never leaves the screen.
 *
 * `onCommit` fires exactly once for a given `result` even though the effect
 * re-runs on every render (the host's inline callbacks change identity each
 * pass); the component's `emitted` ref is what makes that true, and the count
 * asserted here is what would catch its removal.
 *
 * `state` is deliberately *not* a controlled pair. It is an input the host
 * drives from its own request, and `onSubmit`/`onCancel` report intent rather
 * than reporting a value back — same shape as `suggestion-chips`' `onSelect`.
 */
export const Controlled: Story = {
  render: () => <ControlledHost />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);
    const popup = await body.findByRole("dialog");
    const prompt = popup.querySelector<HTMLTextAreaElement>('[data-slot="inline-generate-popup-prompt"]')!;

    // 1. Interaction alone moves nothing.
    prompt.focus();
    await userEvent.type(prompt, "?");
    await expect(prompt.value).toBe(PROMPT);
    await expect(canvas.getByTestId("prompt")).toHaveTextContent(PROMPT);

    // 2. …and the callback carried the whole next value, not a delta, so a
    //    host can apply it without reconstructing anything. One character is
    //    typed on purpose: against a host that refuses, every keystroke
    //    reports `value + that one character`, so typing a phrase produces N
    //    requests that each overwrite the last rather than a growing string.
    //    That is correct for a controlled field and surprising the first time.
    await expect(canvas.getByTestId("requested")).toHaveTextContent(`${PROMPT}?`);

    // 3. A re-render with unchanged props holds it fixed. Prove the re-render
    //    happened first, or this asserts nothing.
    await expect(canvas.getByTestId("pass")).toHaveTextContent("1");
    await userEvent.click(canvas.getByRole("button", { name: "Re-render" }));
    await expect(canvas.getByTestId("pass")).toHaveTextContent("2");
    await expect(prompt.value).toBe(PROMPT);

    // 4. Applying is sufficient — the payload carried enough.
    await userEvent.click(canvas.getByRole("button", { name: "Apply" }));
    await waitFor(() => expect(prompt.value).toBe(`${PROMPT}?`));

    // 5. The commit hands the text over once and *asks* to close; the host
    //    refuses, so the popup is still on screen.
    await userEvent.click(canvas.getByRole("button", { name: "Deliver result" }));
    await waitFor(() =>
      expect(canvas.getByTestId("committed")).toHaveTextContent(
        "Revenue grew 14% quarter over quarter, led by self-serve.",
      ),
    );
    await expect(canvas.getByTestId("committed").textContent?.split("|")).toHaveLength(1);
    await expect(body.queryByRole("dialog")).not.toBeNull();
    await expect(Number(canvas.getByTestId("closeRequests").textContent)).toBeGreaterThan(0);
  },
};

/**
 * `context` omitted — the one text slot that is genuinely optional, and the
 * only one that can be emptied without breaking a gate.
 *
 * With no `context` the description slot is not rendered at all and the dialog
 * carries no `aria-describedby`: it announces as "Generate here" and nothing
 * else, so a person who cannot see the heading above the caret has no way to
 * learn what they are writing under. That is the cost of the optional slot,
 * and it is why the docs page's first "do" is to pass it. `context=""` takes
 * the same branch as omitting it — a small positive worth recording, since the
 * empty-string class has produced a new failure shape in almost every wave.
 *
 * The other three text slots cannot be shown empty here, and the reasons
 * differ:
 *
 * - `title=""` renders `PopoverTitle` with nothing in it, so the dialog's
 *   `aria-labelledby` points at an empty element and the panel ships unnamed —
 *   an outright axe `aria-dialog-name` failure, which is a red gate rather
 *   than a story. The docs page already carries it as a pitfall.
 * - `triggerLabel=""` is the same failure one level out: `button-name` on the
 *   fallback trigger.
 * - `cancelledLabel=""` is *not* a gate failure, and is worse for it. The live
 *   region keeps its `Ban` glyph, which is `aria-hidden`, and loses its only
 *   sentence — measured: `textContent` `""` with one hidden `<svg>` left. What
 *   survives is the button relabelling itself to Try again, so the state is
 *   still legible, but the announcement the docs page promises is gone and no
 *   rule catches it. Recorded, not asserted, because it is a defect in a
 *   caller's hands rather than behaviour worth pinning.
 */
export const EmptyLabel: Story = {
  args: { state: "cancelled", context: undefined, defaultPrompt: PROMPT },
  play: async () => {
    const body = within(document.body);
    const popup = await body.findByRole("dialog");

    // The name survives; the description is simply absent.
    await expect(popup).toHaveAccessibleName("Generate here");
    await expect(popup.getAttribute("aria-describedby")).toBeNull();
    await expect(popup.querySelector('[data-slot="inline-generate-popup-context"]')).toBeNull();

    // The live region still carries the state in words, which is the part the
    // component owns and the part a caller cannot accidentally delete by
    // leaving `context` off.
    const status = popup.querySelector<HTMLElement>('[data-slot="inline-generate-popup-status"]')!;
    await expect(status).toHaveTextContent("Cancelled. Nothing was inserted.");
    await expect(within(popup).getByRole("button", { name: "Try again" })).toBeInTheDocument();
  },
};

const LONG_CONTEXT = "Q3 revenue drivers, churn, and the support-volume number worth flagging";
const LONG_PROMPT = "Three bullets on why churn moved, then one sentence naming the support-volume risk";

/**
 * Author-supplied text at roughly 90 characters in all three slots at once.
 *
 * The popup is a fixed `w-80`, so every decision here is a vertical one: the
 * heading wraps to two lines, the context line wraps to two, and the prompt
 * field grows rather than scrolling — `field-sizing: content` is in the
 * vendored `Textarea`, and the measurement that proves it is
 * `scrollHeight === clientHeight` on a field holding more than one line. The
 * panel gets taller (196px → 254px) and never scrolls sideways.
 *
 * Growing is the right decision for this surface and worth stating: the prompt
 * is the thing you are about to send, so a field that hides half of it behind
 * a scrollbar would make you check your own request by scrolling a 56px box.
 * The cost is that the panel is unbounded — a pasted paragraph makes it as tall
 * as the paragraph, and there is no `max-h` anywhere in this component.
 *
 * **Defect found here, recorded rather than fixed.** The title's `Sparkles`
 * carries `size-3.5` inside a `flex` row and no `shrink-0`, so a heading that
 * wraps squashes it: measured 14×14 with the default title, 7.8×14 with this
 * one — a 14px-tall icon 7.8px wide, its aspect broken rather than merely
 * small. The in-repo idiom exists (`buttonVariants` carries
 * `[&_svg]:shrink-0` for exactly this), but adding a class to a layout is not
 * one of the three mechanical fixes the wave brief sanctions, so it is
 * reported instead. Nothing below asserts the squashed width, which would pin
 * the bug.
 */
export const LongContent: Story = {
  args: {
    state: "idle",
    title: "Generate a paragraph here, under the heading you are already writing beneath",
    context: LONG_CONTEXT,
    defaultPrompt: LONG_PROMPT,
  },
  play: async () => {
    const body = within(document.body);
    const popup = await body.findByRole("dialog");

    // Fixed width, no sideways scroll anywhere in the panel.
    await expect(`panelWidth=${Math.round(popup.getBoundingClientRect().width)}`).toBe("panelWidth=320");
    await expect(`panelScrollsX=${popup.scrollWidth > popup.clientWidth}`).toBe("panelScrollsX=false");

    // The heading and the context line wrap rather than truncate — both are
    // taller than one line of their own type scale.
    const title = popup.querySelector<HTMLElement>('[data-slot="inline-generate-popup-title"]')!;
    const context = popup.querySelector<HTMLElement>('[data-slot="inline-generate-popup-context"]')!;
    await expect(`titleWraps=${title.getBoundingClientRect().height > 24}`).toBe("titleWraps=true");
    await expect(`contextWraps=${context.getBoundingClientRect().height > 20}`).toBe("contextWraps=true");

    // The prompt grows to fit instead of scrolling inside itself.
    const prompt = popup.querySelector<HTMLTextAreaElement>('[data-slot="inline-generate-popup-prompt"]')!;
    await expect(getComputedStyle(prompt).getPropertyValue("field-sizing")).toBe("content");
    await expect(`promptScrollsY=${prompt.scrollHeight > prompt.clientHeight}`).toBe("promptScrollsY=false");
  },
};

/**
 * 375px. The frame is a wrapper rather than `parameters.viewport`, because the
 * gate's chromium runs at its own size and a viewport parameter would render
 * this at desktop width in the run that gates.
 *
 * There is a second thing to say about the wrapper here, and it is the reason
 * this story measures what it measures: **the popup is portaled to `<body>`, so
 * the 375px frame does not contain it.** The frame constrains the line the
 * caret sits on; the panel escapes it. What keeps the panel on a phone is that
 * `w-80` is 320px — 55px narrower than the narrowest device this system
 * targets — plus Base UI's collision padding, measured here at 5px from the
 * viewport edge. So the story proves the panel fits a phone-width column and
 * cannot prove anything about a phone-width *viewport*, which the gate does not
 * run at.
 *
 * The one thing that is genuinely narrow-sensitive is the live region's
 * sentence: "Cancelled. Nothing was inserted." is 32 characters at `text-xs`
 * inside 300px of content box, and it fits on one line with room to spare. A
 * longer `cancelledLabel` wraps and makes the panel taller, which is fine; what
 * would not be fine is a caller reaching for `truncate` on it.
 */
export const Mobile: Story = {
  args: { state: "cancelled", defaultPrompt: PROMPT },
  render: (args) => (
    <div data-testid="mobile-frame" className="w-[375px] max-w-full">
      <p className="text-foreground text-sm font-medium">Q3 revenue drivers</p>
      <InlineGeneratePopup {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const body = within(document.body);
    const popup = await body.findByRole("dialog");

    // Measure the frame, not `canvasElement.firstElementChild` — `layout:
    // "centered"` wraps every story in a ~1200px centring div, and an overflow
    // assertion against that measures the wrapper and passes for the wrong
    // reason.
    const frame = canvasElement.querySelector<HTMLElement>('[data-testid="mobile-frame"]')!;
    await expect(`frameScrollsX=${frame.scrollWidth > frame.clientWidth}`).toBe("frameScrollsX=false");

    await expect(popup.getBoundingClientRect().width).toBeLessThanOrEqual(375);
    await expect(`panelScrollsX=${popup.scrollWidth > popup.clientWidth}`).toBe("panelScrollsX=false");

    // Nothing inside the panel is the thing that overflows either — the
    // actions row and the live region are the two candidates.
    for (const slot of ["inline-generate-popup-actions", "inline-generate-popup-status"]) {
      const el = popup.querySelector<HTMLElement>(`[data-slot="${slot}"]`)!;
      await expect(`${slot} scrollsX=${el.scrollWidth > el.clientWidth}`).toBe(`${slot} scrollsX=false`);
    }

    // The cancelled sentence stays on one line at this width.
    const status = popup.querySelector<HTMLElement>('[data-slot="inline-generate-popup-status"]')!;
    await expect(status.getBoundingClientRect().height).toBeLessThanOrEqual(20);
  },
};

/**
 * K2 beside K1 `ai-doc-block`, which is the twin it is defined against — the
 * docs page's first "don't" is drawing the result inside this popover, and this
 * is that sentence rendered.
 *
 * **The choosing rule is where the text has to survive to.** Use the popup
 * while there is no text yet: it is a request you might abandon, it is anchored
 * to the caret so the insertion point is unambiguous, and a popover is exactly
 * the right weight for something that can be dismissed by clicking away. Use K1
 * the moment text exists: a document node has to survive save, reload and
 * export, and a layer over the document cannot promise that. The handoff
 * between them is `onCommit` — a callback rather than an import, so the
 * dependency runs one way and this popup stays usable in hosts whose document
 * nodes are their own.
 *
 * The tell that you have chosen wrong is verbs. This popup has one button and
 * it says Generate; the moment you want Keep, Edit, Regenerate and Discard on
 * the same surface, you wanted K1. Note that the two overlap on one control and
 * differ on it: both take a prompt, but K1's re-prompt replaces content that is
 * already in the document and keeps the block in place, while K2's produces
 * content that does not exist yet.
 */
export const Boundary: Story = {
  render: () => (
    <div className="flex items-start gap-6">
      <div className="flex w-80 flex-col gap-2 text-sm">
        <p className="text-muted-foreground text-xs">K2 — nothing written yet</p>
        <p className="text-foreground font-medium">Q3 revenue drivers</p>
        <InlineGeneratePopup
          state="idle"
          context="Q3 revenue drivers"
          contextLabel="Under"
          triggerLabel="Ask AI on this line"
          defaultPrompt={PROMPT}
          onSubmit={() => {}}
        />
      </div>
      <div className="flex w-80 flex-col gap-2 text-sm">
        <p className="text-muted-foreground text-xs">K1 — the answer, now a document node</p>
        <AiDocBlock
          label="AI generated"
          onKeep={() => {}}
          onEdit={() => {}}
          onRegenerate={() => {}}
          onDiscard={() => {}}
        >
          <p>
            Churn moved on three things: a pricing change in July, a slower onboarding queue, and support
            volume that rose 30% against flat headcount.
          </p>
        </AiDocBlock>
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const body = within(document.body);
    const popup = await body.findByRole("dialog");
    const block = canvasElement.querySelector<HTMLElement>('[data-slot="ai-doc-block"]')!;

    // The split, stated as a measurement: the popup draws no generated text
    // and offers one verb; the block draws the text and offers four.
    await expect(popup).not.toHaveTextContent("Churn moved on three things");
    await expect(block).toHaveTextContent("Churn moved on three things");

    const popupVerbs = within(popup)
      .getAllByRole("button")
      .map((b) => b.textContent?.trim());
    await expect(popupVerbs).toEqual(["Generate"]);

    for (const verb of ["Keep", "Edit", "Regenerate", "Discard"]) {
      await expect(within(block).getByRole("button", { name: verb })).toBeInTheDocument();
    }
  },
};
