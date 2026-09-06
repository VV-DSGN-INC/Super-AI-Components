import type { Meta, StoryObj } from "@storybook/react-vite";
import { Sparkles } from "lucide-react";
import * as React from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { Button } from "@/components/ui/button";
import { CoachMark } from "@/registry/super-ai/coach-mark";
import { FeatureAnnouncement } from "@/registry/super-ai/feature-announcement";
import { CoachMarkDocs } from "@/content/components/coach-mark.docs";
import { componentDocsPage } from "@/lib/component-docs-page";
import { focusTreatmentSignature, settledFocusRing } from "@/lib/focus-ring";

const meta: Meta<typeof CoachMark> = {
  title: "Super AI/Coach Mark",
  component: CoachMark,
  parameters: { layout: "centered", docs: { page: componentDocsPage(CoachMarkDocs) } },
  args: {
    onSkip: () => {},
    onNext: () => {},
    onBack: () => {},
    // Off in Storybook only. The real default is `true` — a coach-mark takes
    // focus so Skip is one Tab away — but the docs page renders every story at
    // once, and four marks fighting over focus makes the page unreadable.
    autoFocus: false,
  },
};

export default meta;
type Story = StoryObj<typeof CoachMark>;

/**
 * The default. Everything outside the cut-out dims; the anchored button keeps
 * its own colours and stays clickable.
 */
export const Spotlight: Story = {
  args: {
    title: "Generate when you are ready",
    description: "The cost is confirmed here before anything is spent.",
    step: 3,
    total: 4,
    side: "top",
    children: (
      <Button type="button">
        <Sparkles /> Generate
      </Button>
    ),
  },
};

/**
 * A tip that annotates without taking over the screen — no dim, same anatomy.
 * Reach for this when the tour is optional rather than a first-run walkthrough.
 */
export const NoSpotlight: Story = {
  args: {
    title: "Swap the model anytime",
    description: "Faster models cost less, and changing this between runs loses nothing.",
    spotlight: false,
    step: 2,
    total: 4,
    side: "bottom",
    children: (
      <Button variant="outline" type="button">
        Veo 3.1 Fast
      </Button>
    ),
  },
};

/**
 * The counter and Skip are structural, not optional: a single-step tip with no
 * Next and no Back still says how long it is and still offers a way out.
 */
export const StepCounter: Story = {
  args: {
    title: "One thing before you start",
    description: "Autosave is on. Nothing on this page needs a save button.",
    step: 1,
    total: 1,
    side: "bottom",
    onNext: undefined,
    onBack: undefined,
    children: (
      <Button variant="outline" type="button">
        Autosave
      </Button>
    ),
  },
};

/**
 * Placed above the anchor instead of below it. The arrow follows the popover
 * to whichever side it lands on, so the pointer never detaches from the target
 * when there is no room underneath.
 */
export const ArrowFlip: Story = {
  args: {
    title: "Your renders land here",
    description: "Finished clips appear in this tray. Nothing is lost if you navigate away.",
    step: 4,
    total: 4,
    side: "top",
    align: "start",
    children: (
      <Button variant="outline" type="button">
        Library
      </Button>
    ),
  },
};

/* -------------------------------------------------------------------------
 * Case stories — the situations this component meets in a product, as
 * opposed to the prop combinations above. See
 * docs/design-system/story-conventions.md.
 *
 * All eight are written; nothing is skipped. Two of them carry most of the
 * weight and are worth reading before the rest:
 *
 * - `RTL`, because `arrow-flip` is a declared state about direction and the
 *   popover resolves `side` and `align` through two *different* mechanisms,
 *   only one of which mirrors.
 * - `KeyboardOrder`, because a coach-mark interrupts: where focus goes when a
 *   step opens and where it is left when the step goes away is the whole
 *   keyboard story, and both ends of it are unusual here.
 *
 * Every case story below opens the popup, which is where this component's
 * facts live — the four declared-state stories above render it too, so unlike
 * the popovers wave 1 found unnamed (`context-toolbar`, `drawing-tools`) this
 * one has been rendered under axe since it shipped. Its name comes from
 * `PopoverTitle`, which is Base UI's `Popover.Title` and therefore wires
 * `aria-labelledby` on the popup itself; `EmptyLabel` measures that rather
 * than trusting it.
 * ---------------------------------------------------------------------- */

/**
 * Sets `dir` on the document element rather than on a wrapper.
 *
 * The popup is portaled to the end of `document.body`, so a `<div dir="rtl">`
 * in the canvas is never its ancestor and cannot reach it — the same idiom
 * `account-menu` and `shortcuts-sheet` use, for the same reason.
 */
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
 * Right-to-left, and the reason this story matters more here than in most
 * files: `arrow-flip` is a declared state about *direction*, and the popover
 * decides direction twice, by two different mechanisms, with two different
 * answers.
 *
 * **`align` mirrors.** Floating UI takes alignment from
 * `platform.isRTL(floating)`, which reads the *rendered* `direction` of the
 * popup — and the popup, portaled into `document.body`, inherits `rtl` from
 * the document element. Measured on the first mark below, anchor 648..717 and
 * `align="start"`: the popup paints 397..717, its **right** edge exactly on
 * the anchor's right. Run the same story with the document set to `ltr` and
 * the comparison the play asserts inverts — "start edge tracked: false" —
 * because the left edge is the one that tracks there. Nothing in this repo was
 * configured for that to work, which is worth knowing before anyone concludes
 * it has no RTL support at all.
 *
 * **`side` does not.** Base UI maps only `inline-start`/`inline-end` through
 * direction, and it reads that direction from a `DirectionContext` defaulting
 * to `"ltr"` that nothing in this repo mounts — wave 1's finding, reached here
 * from the positioner's other half. So a physical `side` is a physical
 * request in every locale: the second mark below asks for `side="right"` and
 * lands at 596..916 against an anchor at 483..584 — after the control for a
 * Latin reader, *before* it for an Arabic or Hebrew one, where "right" is
 * where the eye starts.
 *
 * **Recorded, not fixed: a host cannot express the logical side.**
 * `CoachMarkSide` is `"top" | "right" | "bottom" | "left"`, so `inline-end` is
 * a type error even though the positioner underneath accepts it and the
 * vendored `popover.tsx` already styles `data-[side=inline-end]`. Widening the
 * type would also need logical twins for the arrow's four `data-[side=…]`
 * offsets, which is an API decision rather than a class swap.
 *
 * What mirrors correctly, because it is CSS following the DOM: the footer
 * (counter on the right, controls on the left) and the dot rail, whose first
 * step is the rightmost dot. Both are measured below rather than read off a
 * class, since neither names a physical side.
 */
export const RTL: Story = {
  args: {
    title: "Your renders land here",
    description: "Finished clips appear in this tray. Nothing is lost if you navigate away.",
    step: 2,
    total: 4,
  },
  render: (args) => (
    <RtlDocument>
      <div className="flex items-start justify-center gap-16">
        <CoachMark {...args} side="bottom" align="start">
          <Button variant="outline" type="button">
            Library
          </Button>
        </CoachMark>
        <CoachMark
          {...args}
          title="Switch models here"
          description="Faster models cost less, and changing this between runs loses nothing."
          step={3}
          side="right"
          spotlight={false}
        >
          <Button variant="outline" type="button">
            Veo 3.1 Fast
          </Button>
        </CoachMark>
      </div>
    </RtlDocument>
  ),
  play: async ({ canvasElement }) => {
    const body = within(document.body);
    const [alignedRoot, sidedRoot] = Array.from(
      canvasElement.querySelectorAll<HTMLElement>('[data-slot="coach-mark"]'),
    );
    const anchorOf = (root: HTMLElement) =>
      root.querySelector<HTMLElement>('[data-slot="coach-mark-anchor"]')!.getBoundingClientRect();

    const aligned = await body.findByRole("dialog", { name: "Your renders land here" });
    const sided = await body.findByRole("dialog", { name: "Switch models here" });

    // The portal takes its direction from the document, not from the canvas.
    await expect(getComputedStyle(aligned).direction).toBe("rtl");

    // `align="start"` follows the reading direction: the popup's right edge is
    // the one that tracks the anchor. Stated as a comparison rather than a
    // pixel so the claim survives the positioner's own offsets.
    const anchorA = anchorOf(alignedRoot);
    const alignedRect = aligned.getBoundingClientRect();
    await expect(
      `start edge tracked: ${Math.abs(alignedRect.right - anchorA.right) < Math.abs(alignedRect.left - anchorA.left)}`,
    ).toBe("start edge tracked: true");

    // `side="right"` does not: still physically right of the anchor, which is
    // the reading-start side here.
    const anchorB = anchorOf(sidedRoot);
    await expect(sided).toHaveAttribute("data-side", "right");
    await expect(`opens right of anchor: ${sided.getBoundingClientRect().left >= anchorB.right}`).toBe(
      "opens right of anchor: true",
    );

    // The footer mirrors: the counter sits at the row's logical start, which
    // is the visual right, and the controls run away from it to the left.
    const counter = aligned.querySelector<HTMLElement>('[data-slot="coach-mark-step"]')!;
    const next = aligned.querySelector<HTMLElement>('[data-slot="coach-mark-next"]')!;
    await expect(
      `counter right of Next: ${counter.getBoundingClientRect().left > next.getBoundingClientRect().right}`,
    ).toBe("counter right of Next: true");

    // Progress runs right-to-left with the sentence: step 1 is the rightmost
    // dot, and the second dot is the lit one for step 2 of 4.
    const dots = Array.from(counter.querySelectorAll<HTMLElement>("span span"));
    await expect(dots).toHaveLength(4);
    await expect(dots.findIndex((dot) => dot.hasAttribute("data-active"))).toBe(1);
    await expect(
      `first dot rightmost: ${dots[0].getBoundingClientRect().left > dots[3].getBoundingClientRect().left}`,
    ).toBe("first dot rightmost: true");
  },
};

/**
 * The reduced-motion branch — and this component needed a fix to have one.
 *
 * `PopoverContent` opens with `data-open:animate-in fade-in-0 zoom-in-95` and
 * closes with the `data-closed` twin, neither of which reads the media
 * feature. The registry's usual one-class remedy, a bare
 * `motion-reduce:animate-none`, is **inert on a Base UI popup**: Tailwind v4
 * wraps the data-attribute test in `:where(…)`, so both sides carry one class
 * of specificity, the tie falls to source order, and the plain
 * `motion-reduce:` block is emitted first. Measured on this component before
 * the fix, with `prefers-reduced-motion: reduce` emulated for every test by
 * `vitest.config.ts`: the open popup computed `animation-name: "enter"`. The
 * fix restates the variant on both halves at the call site
 * (`motion-reduce:data-open:animate-none` and its `data-closed` twin), which
 * sorts after its counterpart and wins the same tie — the `shortcuts-sheet`
 * finding, applied to a fourth popup family. That is why the assertion reads
 * `animation-name` back instead of checking for the class.
 *
 * **The fix has a second-order effect on dismissal, and it is an improvement.**
 * Before it, closing the step left the popup mounted for the length of the
 * `exit` animation, which is long enough for Base UI's focus guard to put
 * focus back inside a dialog that has already closed — measured in
 * `KeyboardOrder`, where the sequence is written down. With no exit animation
 * the popup unmounts on the same frame and there is nothing to land in.
 *
 * Nothing else in the tree moves. The scrim and the cut-out ring are painted
 * once and never transition; there is no spinner, no chevron and no slide.
 * The one exception is shared rather than owned: the vendored `Button`
 * carries `transition-all` and nudges a pixel on press in every locale and
 * every motion preference, which `CONTINUE.md` §8 records as a primitive-wide
 * posture rather than any one component's bug.
 */
export const ReducedMotion: Story = {
  args: {
    title: "Generate when you are ready",
    description: "The cost is confirmed here before anything is spent.",
    step: 3,
    total: 4,
    side: "top",
    children: (
      <Button type="button">
        <Sparkles /> Generate
      </Button>
    ),
  },
  play: async () => {
    const popup = await within(document.body).findByRole("dialog", {
      name: "Generate when you are ready",
    });

    // Still opening — the attribute the animation is keyed off is on the
    // element, so this is the frame a bare `motion-reduce:animate-none` fails
    // to reach.
    await expect(popup).toHaveAttribute("data-open");
    await expect(getComputedStyle(popup).animationName).toBe("none");

    // The dim is not animated in either direction, so suppressing the popup's
    // animation leaves nothing moving on screen.
    const scrim = document.querySelector<HTMLElement>('[data-slot="coach-mark-scrim"]')!;
    const scrimStyle = getComputedStyle(scrim);
    await expect(scrimStyle.animationName).toBe("none");
    await expect(scrimStyle.transitionDuration).toBe("0s");
  },
};

/**
 * The keyboard contract, which for an interrupting surface is mostly a
 * question of where focus is put and where it is left.
 *
 * `autoFocus` is on here — the component's real default, switched off in this
 * file's meta only so the docs page does not have four marks fighting over
 * focus. It is what makes the step reachable at all: Base UI moves focus into
 * a popup only when a real interaction opened it, and a tour opens its steps
 * programmatically, so without this Skip would sit at the end of the document
 * for a keyboard user to find.
 *
 * What this pins:
 *
 * 1. Focus lands on the popup itself, not on a control — `tabindex="-1"`, so
 *    the title and the description are announced before Skip is reached. It
 *    paints no ring of its own, which the docs already say and which is the
 *    reason the ring assertions below start at the first *tab* stop rather
 *    than at the element focus actually starts on.
 * 2. Three stops in source order — Skip, Back, Next — each with a distinct
 *    accessible name and a focus treatment that *focus itself* caused. Both
 *    checks are taken, because they answer different questions: the vendored
 *    `Button` fades its ring in over 250ms, so an immediate read is a false
 *    negative, and a `ring-*` utility composes shadow layers that are present
 *    and transparent when the ring is off, so an absolute check alone cannot
 *    tell a ring from a permanent shadow.
 * 3. The anchored control keeps its own tab stop, and the positioning anchor
 *    is not one. That is the whole reason the trigger is an `aria-hidden`
 *    sibling span rather than a wrapper around `children` — a tour pointing at
 *    a button would otherwise nest one control inside another.
 * 4. Escape dismisses the step and leaves focus on `<body>`. `finalFocus` is
 *    deliberately off, because in a running tour the right destination is the
 *    next step rather than the anchor; the cost is that when the tour *ends*
 *    the next Tab restarts at the top of the document unless the host sends
 *    focus somewhere. The docs module carries that obligation, and this is the
 *    measurement behind it.
 *
 * **Defect found here, recorded rather than pinned: tabbing past the last
 * control ends the tour.** The docs module's keyboard notes say "Tab past Next
 * leaves the step and continues into the page — which is the point: the
 * control being pointed at has to stay usable while it is being explained."
 * Half of that holds. Measured in this story's own frame — three page controls
 * with the mark in the middle — the fourth Tab moves focus onto Base UI's
 * trigger focus guard, which calls `setOpen(false)` with reason `focusOut`
 * (`utils/popups/useTriggerFocusGuards.js`) and only then forwards focus to
 * the next tabbable after the trigger. Before: one dialog, spotlight painted.
 * After: no dialog, no spotlight, focus on "Open library". So the step closes,
 * the page goes undimmed, and the sentence explaining the control disappears
 * at the moment the user tabs toward it.
 *
 * Two further measurements make it worse rather than better. The guard
 * forwards to the tabbable *after* the trigger span, and the anchored control
 * precedes that span in the DOM — so forward-tabbing out of a step never lands
 * on the thing the step was pointing at. And with an exit animation still
 * running (this component's state before the reduced-motion fix above), the
 * popup outlives the close: the guard's loop for stepping over controls inside
 * the popup breaks on the last tabbable in the document and puts focus back on
 * **Skip**, inside a dialog that has already closed, where two more Tabs walk
 * Back and Next as if nothing had happened. The play function stops at Next;
 * asserting either outcome would pin behaviour the component's own
 * documentation contradicts.
 */
export const KeyboardOrder: Story = {
  args: {
    title: "Generate when you are ready",
    description: "The cost is confirmed here before anything is spent.",
    step: 2,
    total: 4,
    side: "top",
    autoFocus: true,
  },
  render: (args) => (
    <div className="flex flex-col items-start gap-4">
      <Button variant="outline" type="button">
        Render settings
      </Button>
      <CoachMark {...args}>
        <Button type="button">
          <Sparkles /> Generate
        </Button>
      </CoachMark>
      <Button variant="outline" type="button">
        Open library
      </Button>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const body = within(document.body);
    const popup = await body.findByRole("dialog", { name: "Generate when you are ready" });

    // Focus starts on the popup itself. Nothing is asserted about a ring on
    // it: it carries none, and the step appearing is the sighted signal.
    await waitFor(() => expect(document.activeElement).toBe(popup));
    await expect(popup).toHaveAttribute("tabindex", "-1");

    // The anchored control stays a tab stop; the positioning anchor never is.
    const anchor = canvasElement.querySelector<HTMLElement>('[data-slot="coach-mark-anchor"]')!;
    await expect(anchor).toHaveAttribute("aria-hidden", "true");
    await expect(anchor).toHaveAttribute("tabindex", "-1");
    const anchored = within(canvasElement).getByRole("button", { name: "Generate" });
    await expect(anchored.hasAttribute("disabled")).toBe(false);
    await expect(anchored.closest('[aria-hidden="true"]')).toBeNull();

    const stops = ["coach-mark-skip", "coach-mark-back", "coach-mark-next"].map(
      (slot) => popup.querySelector<HTMLElement>(`[data-slot="${slot}"]`)!,
    );
    const nameOf = (el: Element | null) =>
      el === null ? "nothing" : `stop#${stops.indexOf(el as HTMLElement)} ${el.textContent?.trim()}`;

    // Distinct names, computed the way a screen reader would: a duplicate
    // makes `getByRole` throw rather than passing quietly.
    for (const name of ["Skip tour", "Back", "Next"]) {
      await expect(within(popup).getByRole("button", { name })).toBeInTheDocument();
    }

    /**
     * Settle on departure, not on arrival. Inside a portal a key press read
     * before it has applied leaves focus on the *previous* stop, which is
     * itself an expected stop — so a wait for "focus is on some stop" returns
     * a stale read and the lap appears to end one control early. Naming the
     * stop focus has to leave makes every press provably one move.
     * `AiToolsMenu.stories.tsx` carries the same helper.
     */
    const settledStop = async (previous?: HTMLElement) => {
      await waitFor(() => {
        const active = document.activeElement as HTMLElement;
        if (!stops.includes(active)) {
          throw new Error(`focus is not on one of the step's controls: ${nameOf(active)}`);
        }
        if (previous && active === previous) {
          throw new Error(`focus has not moved off ${nameOf(previous)} yet`);
        }
      });
      return document.activeElement as HTMLElement;
    };

    let previous: HTMLElement | undefined;
    for (const expected of stops) {
      // Read the treatment while focus is still somewhere else, so the
      // comparison after the tab says focus caused it rather than that the
      // element paints something permanently.
      const resting = focusTreatmentSignature(expected);
      await userEvent.tab();
      const focused = await settledStop(previous);
      await expect(nameOf(focused)).toBe(nameOf(expected));
      await settledFocusRing(focused, waitFor);
      await waitFor(() =>
        expect(
          `${nameOf(focused)} treatment changed on focus: ${focusTreatmentSignature(focused) !== resting}`,
        ).toBe(`${nameOf(focused)} treatment changed on focus: true`),
      );
      previous = focused;
    }

    // Escape dismisses the step. Focus is deliberately not restored — the host
    // owns where a tour hands control back, and `<body>` is what it gets if
    // the host does nothing.
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("dialog")).toBeNull());
    await expect(document.activeElement).toBe(document.body);
  },
};

/**
 * The host holds `open` and refuses every request to close, which is the shape
 * a real tour has: the step array, the index and the seen-flag all live
 * outside this component, and `open` is how the host says which step is
 * showing.
 *
 * Three things are asserted, and the third is the one a consumer needs:
 *
 * - Interaction alone moves nothing. Skip and Escape both reach
 *   `onOpenChange(false)`, and with `open` pinned the popup and the spotlight
 *   stay exactly as they were.
 * - The callbacks carry what a host needs to act. Skip fires `onSkip` *and*
 *   `onOpenChange(false)`, in that order — Escape fires only the latter, which
 *   is why a tour that records "user bailed out" in `onSkip` alone misses
 *   every Escape. The docs module says this; the log below is the measurement.
 * - Re-rendering with an unchanged `open` holds the component fixed. Every
 *   event here appends to React state, so the component re-renders on each
 *   one with the same `open` and does not reopen, re-animate or re-take focus.
 *
 * `step` and `total` are the other half of the same split and are checked with
 * it: clicking Next fires `onNext` and changes nothing on screen. A step that
 * looks frozen is a host that is not advancing its index — the intended
 * division of labour, and the reason there is no `<Tour>` component here.
 */
export const Controlled: Story = {
  args: {
    title: "Generate when you are ready",
    description: "The cost is confirmed here before anything is spent.",
    step: 2,
    total: 5,
    side: "top",
  },
  render: (args) => {
    function Host() {
      const [log, setLog] = React.useState<string[]>([]);
      const record = (event: string) => setLog((entries) => [...entries, event]);
      return (
        <div className="flex flex-col items-start gap-4">
          <CoachMark
            {...args}
            open
            onSkip={() => record("onSkip")}
            onNext={() => record("onNext")}
            onOpenChange={(next) => record(`onOpenChange(${next})`)}
          >
            <Button type="button">
              <Sparkles /> Generate
            </Button>
          </CoachMark>
          <p data-testid="host-log" className="text-xs">
            {log.length === 0 ? "no events yet" : log.join(" · ")}
          </p>
        </div>
      );
    }
    return <Host />;
  },
  play: async ({ canvasElement }) => {
    const body = within(document.body);
    const canvas = within(canvasElement);
    const popup = await body.findByRole("dialog", { name: "Generate when you are ready" });
    const counter = popup.querySelector<HTMLElement>('[data-slot="coach-mark-step"]')!;
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="coach-mark"]')!;

    await expect(counter).toHaveTextContent("Step 2 of 5");
    await expect(root).toHaveAttribute("data-state", "open");

    // Next reports the intent and moves nothing: the position in the sequence
    // is the host's to change.
    await userEvent.click(within(popup).getByRole("button", { name: "Next" }));
    await waitFor(() => expect(canvas.getByTestId("host-log")).toHaveTextContent("onNext"));
    await expect(counter).toHaveTextContent("Step 2 of 5");

    // Skip reports both, in the order a host has to handle them, and the step
    // survives because the host did not lower `open`.
    await userEvent.click(within(popup).getByRole("button", { name: "Skip tour" }));
    await waitFor(() =>
      expect(canvas.getByTestId("host-log")).toHaveTextContent("onNext · onSkip · onOpenChange(false)"),
    );

    // Escape asks the same question without claiming the user skipped.
    await userEvent.keyboard("{Escape}");
    await waitFor(() =>
      expect(canvas.getByTestId("host-log")).toHaveTextContent(
        "onNext · onSkip · onOpenChange(false) · onOpenChange(false)",
      ),
    );

    // Several re-renders later, with `open` unchanged throughout: same popup
    // element, still open, spotlight still painted.
    await expect(body.getByRole("dialog", { name: "Generate when you are ready" })).toBe(popup);
    await expect(root).toHaveAttribute("data-state", "open");
    await expect(document.querySelector('[data-slot="coach-mark-scrim"]')).not.toBeNull();
  },
};

/**
 * Everything optional left out, plus the one text slot a caller can empty
 * without meaning to.
 *
 * `description` is genuinely optional and its absence is clean: the popup
 * keeps its accessible name from `title` — Base UI's `Popover.Title` wires
 * `aria-labelledby` on the popup, so the name is real rather than a promise in
 * a docs table — and drops `aria-describedby` rather than pointing at an
 * element that is not there.
 *
 * `stepLabel` is the hole. It exists for localisation, it is the *only*
 * carrier of "how much is left" for anyone not looking at the dots — the dots
 * are `aria-hidden` decoration by design — and a function returning an empty
 * string leaves a footer where progress is dots and nothing else. That is the
 * component's own documented don't ("Don't reduce progress to a row of dots"),
 * reachable through a supported prop, with no axe rule to catch it: an empty
 * `<p>` violates nothing. Measured below rather than argued. It is the next
 * shape in the empty-string class `CONTINUE.md` §8 has been collecting since
 * wave 1, and the first where the emptied string is computed rather than
 * passed.
 *
 * Not rendered, because it would fail the gate rather than document anything:
 * `title=""` is legal to the type and leaves the popup with an empty
 * `aria-labelledby` target, which is `aria-dialog-name` — a red axe rule. The
 * component's own doc comment calls `title` required for exactly this reason,
 * and the type cannot express "non-empty".
 */
export const EmptyLabel: Story = {
  args: {
    title: "Autosave is on",
    description: undefined,
    step: 2,
    total: 4,
    side: "bottom",
    stepLabel: () => "",
    children: (
      <Button variant="outline" type="button">
        Autosave
      </Button>
    ),
  },
  play: async () => {
    const popup = await within(document.body).findByRole("dialog", { name: "Autosave is on" });

    // The name survives the missing description; the description reference is
    // dropped rather than left dangling.
    await expect(popup).toHaveAttribute("aria-labelledby");
    await expect(popup.hasAttribute("aria-describedby")).toBe(false);
    await expect(popup.querySelector('[data-slot="coach-mark-description"]')).toBeNull();

    // Progress is now dots only, and the dots are hidden from assistive tech —
    // so nothing announces where the user is in the tour.
    const counter = popup.querySelector<HTMLElement>('[data-slot="coach-mark-step"]')!;
    const dotRail = counter.querySelector<HTMLElement>("span")!;
    await expect(counter.textContent).toBe("");
    await expect(dotRail).toHaveAttribute("aria-hidden", "true");
    await expect(dotRail.querySelectorAll("span")).toHaveLength(4);

    // Skip is still there and still named: it defaults rather than collapsing,
    // which is what keeps this story out of `button-name`.
    await expect(within(popup).getByRole("button", { name: "Skip tour" })).toBeInTheDocument();
  },
};

/**
 * Author-supplied text at the length a real tour reaches: a title that is a
 * sentence, a description that explains a control rather than naming it, and
 * localised labels longer than the English defaults.
 *
 * For the prose the decision is to wrap, never to truncate or scroll. The
 * popup is `w-80`, so the width is fixed at 320px and the height is what
 * gives — correct here, because a coach-mark that clipped its own explanation
 * would be pointing at a control it then refused to describe.
 *
 * Two things this story is the only record of:
 *
 * - **The footer wraps before the labels are long at all.** "Step 2 of 12"
 *   plus Skip, Back and Next already exceeds the popup's 288px inner width
 *   with the *default* English labels, so the counter and the controls land on
 *   separate rows. `flex-wrap` on the footer is what makes that a wrap rather
 *   than an overflow, and it is asserted below so a future `flex-nowrap` is a
 *   visible change.
 * - **Past eight steps the dots stop rendering and the sentence carries
 *   alone.** `MAX_PROGRESS_DOTS` is 8 in the source; twelve steps is the case
 *   on the other side of it, and it is the strongest argument for the counter
 *   being text: at this length the visual channel is simply gone.
 *
 * **Defect this story found, recorded rather than pinned: translated button
 * labels leave the popup.** The footer wraps, but the control row inside it is
 * `flex items-center gap-1.5` with no `flex-wrap`, so three buttons are laid
 * out on one line whatever they measure. With the labels rendered here — the
 * kind of length German or French gives you — they total 348px (151 + 105 + 81
 * plus gaps) inside a 288px content box, and the popup reports
 * `scrollWidth 365` against `clientWidth 320` with `overflow-x: visible`: the
 * buttons paint outside the popover's own rounded box, on top of whatever is
 * behind it. No gate sees it — it is not an axe rule and the popup is
 * portaled, so it does not make the document scroll. The one-class repair is
 * `flex-wrap` on that row, which is not one of the mechanical fixes a case
 * story may land (`spec §3.4`), so it is recorded here and in the report
 * instead. The assertions below deliberately stop at the wrap that does work.
 */
export const LongContent: Story = {
  args: {
    title: "Every render you start is queued here until the model has capacity",
    description:
      "Queued jobs keep their place if you close the tab, and credits are only spent once a render actually starts.",
    step: 2,
    total: 12,
    side: "bottom",
    skipLabel: "Skip the walkthrough",
    nextLabel: "Next step",
    backLabel: "Previous step",
    children: (
      <Button variant="outline" type="button">
        Render queue
      </Button>
    ),
  },
  play: async () => {
    const popup = await within(document.body).findByRole("dialog", {
      name: "Every render you start is queued here until the model has capacity",
    });

    // The prose wraps and the box does not grow: width is fixed at `w-80`,
    // height is what gives.
    await expect(popup.getBoundingClientRect().width).toBe(320);
    const title = popup.querySelector<HTMLElement>('[data-slot="coach-mark-title"]')!;
    const titleStyle = getComputedStyle(title);
    await expect(
      `title wrapped: ${title.getBoundingClientRect().height > parseFloat(titleStyle.lineHeight) * 1.5}`,
    ).toBe("title wrapped: true");
    await expect(`title clipped: ${title.scrollWidth > title.clientWidth}`).toBe("title clipped: false");

    // The footer wraps: the counter is on its own row above the controls.
    const counter = popup.querySelector<HTMLElement>('[data-slot="coach-mark-step"]')!;
    const footer = popup.querySelector<HTMLElement>('[data-slot="coach-mark-footer"]')!;
    const skip = popup.querySelector<HTMLElement>('[data-slot="coach-mark-skip"]')!;
    await expect(getComputedStyle(footer).flexWrap).toBe("wrap");
    await expect(
      `counter above controls: ${counter.getBoundingClientRect().bottom <= skip.getBoundingClientRect().top}`,
    ).toBe("counter above controls: true");

    // Twelve steps is past MAX_PROGRESS_DOTS, so the sentence is all there is.
    await expect(counter).toHaveTextContent("Step 2 of 12");
    await expect(counter.querySelector("span")).toBeNull();
  },
};

/**
 * 375px, wrapper-constrained rather than `parameters.viewport` — the gate runs
 * headless chromium at its own size, so a viewport parameter would render at
 * desktop width in the run that actually gates.
 *
 * **Read what this can and cannot prove, because the popup is portaled.** The
 * frame below constrains the anchored control and the spotlight, which live in
 * the canvas; it cannot constrain the popup, which is positioned against the
 * *viewport* from the end of `document.body`. So the assertions split in two:
 * the frame is measured for real, and the popup is measured for the only thing
 * a 1200px gate can honestly say about it — that its own width fits inside a
 * phone. A real 375px viewport would additionally exercise the positioner's
 * collision handling, which nothing here reaches.
 *
 * The width is the whole question at this size: `w-80` is 320px against a
 * 375px screen, which leaves room for the collision margins and is the reason
 * this popup needs no narrow variant. The part that would break first if it
 * were wider is the footer, and that wraps rather than overflowing —
 * `LongContent` measures the wrap.
 */
export const Mobile: Story = {
  args: {
    title: "Your renders land here",
    description: "Finished clips appear in this tray. Nothing is lost if you navigate away.",
    step: 3,
    total: 4,
    side: "bottom",
  },
  render: (args) => (
    <div data-testid="coach-mark-mobile-frame" className="w-[375px] max-w-full">
      <CoachMark {...args}>
        <Button variant="outline" type="button">
          Library
        </Button>
      </CoachMark>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const frame = within(canvasElement).getByTestId("coach-mark-mobile-frame");
    const popup = await within(document.body).findByRole("dialog", {
      name: "Your renders land here",
    });

    // The frame itself, and the document with it.
    await expect(`frame scrolls sideways: ${frame.scrollWidth > frame.clientWidth}`).toBe(
      "frame scrolls sideways: false",
    );
    await expect(
      `document scrolls sideways: ${document.documentElement.scrollWidth > document.documentElement.clientWidth}`,
    ).toBe("document scrolls sideways: false");

    // The spotlight is a shadow spread, so it adds no layout at any width —
    // worth pinning here, since a scrim implemented as a sized overlay is
    // exactly what would make a phone scroll sideways.
    const scrim = document.querySelector<HTMLElement>('[data-slot="coach-mark-scrim"]')!;
    await expect(`scrim wider than frame: ${scrim.getBoundingClientRect().width > frame.clientWidth}`).toBe(
      "scrim wider than frame: false",
    );

    // The popup fits a phone on its own measurements, which is as much as a
    // 1200px gate can claim.
    await expect(`popup fits 375: ${popup.getBoundingClientRect().width <= 375}`).toBe(
      "popup fits 375: true",
    );
    await expect(`popup scrolls sideways: ${popup.scrollWidth > popup.clientWidth}`).toBe(
      "popup scrolls sideways: false",
    );
  },
};

/**
 * L2 beside L3 `feature-announcement` at its `anchored` level — the near-twin
 * that matters, because at a glance they are the same object: a popover
 * pinned to a control, with a title, a line of copy and a way out.
 *
 * The rule is **what the surface is about**:
 *
 * - **Coach mark** is about *the user's position in a sequence*. It carries a
 *   step counter and a Skip because it is step N of a tour someone has to be
 *   able to leave, and it dims everything except the control it points at, so
 *   the answer to "what am I looking at" is unambiguous. It advances nothing
 *   on its own; the host owns the index.
 * - **Feature announcement** is about *one piece of news*, and its state is
 *   per-announcement rather than per-position: an id, a stage badge, a
 *   dismissal the host persists so it never returns. There is no sequence, so
 *   there is nothing to count, and it never dims the page — the feature stays
 *   usable while it is being announced.
 *
 * If the copy would read "…and then", it is a coach mark. If it would read
 * "this is new", it is an announcement. L6 `onboarding-wizard` is the third
 * neighbour and settles by looking: it is a card that owns the screen and asks
 * questions, rather than pointing at a control that is already there. L1
 * `empty-state` is the fourth and is not really adjacent — it replaces content
 * that does not exist yet, rather than annotating content that does.
 *
 * **What this pairing measures, and no other story can:** the spotlight dims
 * the announcement beside it for a sighted reader and is invisible to axe. The
 * dim is a `box-shadow` spread, and the contrast rule reads background
 * colours — a shadow is not one. So a tour that spotlights one control has
 * pushed the rest of the page's text somewhere no gate in this repo looks.
 */
export const Boundary: Story = {
  args: {
    title: "Generate when you are ready",
    description: "The cost is confirmed here before anything is spent.",
    step: 3,
    total: 4,
    side: "bottom",
  },
  render: (args) => (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col items-start gap-2">
        <p className="text-foreground text-xs font-medium">
          Coach mark — step 3 of a tour, pointing at the control it explains
        </p>
        <CoachMark {...args}>
          <Button type="button">
            <Sparkles /> Generate
          </Button>
        </CoachMark>
      </section>

      <section className="flex flex-col items-start gap-2">
        <p className="text-foreground text-xs font-medium">
          Feature announcement — one piece of news about the control it points at
        </p>
        <FeatureAnnouncement
          id="upscale-4k"
          level="anchored"
          stage="Beta"
          title="Upscale now runs at 4K"
          description="Finished renders can be upscaled without re-running the model."
          anchorLabel="Upscale"
          onDismiss={() => {}}
        />
      </section>
    </div>
  ),
  play: async () => {
    const body = within(document.body);
    const step = await body.findByRole("dialog", { name: "Generate when you are ready" });
    const news = await body.findByRole("dialog", { name: "Upscale now runs at 4K" });

    // Both are popovers, and Base UI gives both `role="dialog"` — which is why
    // both have to be named, and are.
    await expect(step).not.toBe(news);

    // Only one of them counts steps, and only one of them dims the page.
    await expect(step.querySelector('[data-slot="coach-mark-step"]')).toHaveTextContent("Step 3 of 4");
    await expect(news.querySelector('[data-slot="coach-mark-step"]')).toBeNull();

    // The dim lives entirely in a property no contrast rule reads: the scrim
    // paints nothing as a background and everything as a shadow.
    const scrim = document.querySelector<HTMLElement>('[data-slot="coach-mark-scrim"]')!;
    const scrimStyle = getComputedStyle(scrim);
    await expect(scrimStyle.backgroundColor).toBe("rgba(0, 0, 0, 0)");
    await expect(`dim is a shadow: ${scrimStyle.boxShadow.includes("9999px")}`).toBe("dim is a shadow: true");
    await expect(parseFloat(scrimStyle.opacity)).toBeLessThan(1);
  },
};
