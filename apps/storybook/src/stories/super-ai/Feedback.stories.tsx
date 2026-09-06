import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { ApprovalCard } from "@/registry/super-ai/approval-card";
import { Feedback, type FeedbackProps, type FeedbackState, type FeedbackValue } from "@/registry/super-ai/feedback";
import { FeedbackDocs } from "@/content/components/feedback.docs";
import { componentDocsPage } from "@/lib/component-docs-page";
import { focusTreatmentSignature, settledFocusRing } from "@/lib/focus-ring";

const meta: Meta<typeof Feedback> = {
  title: "Super AI/Feedback",
  component: Feedback,
  parameters: { layout: "centered", docs: { page: componentDocsPage(FeedbackDocs) } },
};

export default meta;
type Story = StoryObj<typeof Feedback>;

/**
 * Feedback is controlled — it owns none of the idle/rating/submitted sequence
 * itself. The play tests below need clicks to actually move it forward, so
 * this wrapper stands in for the persistence a real consumer would own.
 *
 * It deliberately owns `state` and `value` only, and leaves `reason` to the
 * component's own optional-controlled fallback, because that is the shape a
 * product actually writes: a host stores the rating, not every keystroke of
 * the free text. `Submitted` measures what that costs.
 */
function ControlledFeedback(props: FeedbackProps) {
  const [state, setState] = React.useState<FeedbackState>(props.state ?? "idle");
  const [value, setValue] = React.useState<FeedbackValue | undefined>(props.value);

  return (
    <Feedback
      {...props}
      state={state}
      value={value}
      onRate={(next) => {
        setValue(next);
        if (next === "down") setState("rating");
        props.onRate?.(next);
      }}
      onSubmit={(payload) => {
        setState("submitted");
        props.onSubmit?.(payload);
      }}
      onRatingCancel={() => {
        setState("idle");
        setValue(undefined);
        props.onRatingCancel?.();
      }}
      onUndo={() => {
        setState("idle");
        setValue(undefined);
        props.onUndo?.();
      }}
    />
  );
}

/**
 * Nothing rated yet, which is the state this control spends almost all of its
 * life in. Notice the asymmetry the spec is built on: the thumbs-up handler
 * calls `onSubmit` itself, so praise never reaches `rating` at all — the
 * popover exists on one of the two branches only.
 */
export const Idle: Story = {
  args: {
    onRate: () => {},
    onSubmit: () => {},
  },
  render: (args) => <ControlledFeedback {...args} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const up = canvas.getByRole("button", { name: "Helpful" });
    const down = canvas.getByRole("button", { name: "Not helpful" });
    await expect(up).toHaveAttribute("aria-pressed", "false");
    await expect(down).toHaveAttribute("aria-pressed", "false");

    // Positive feedback is one click straight to "submitted".
    await userEvent.click(up);
    await expect(await canvas.findByRole("status")).toHaveTextContent("Thanks for the feedback!");
  },
};

/**
 * The negative branch's one extra step. Worth noticing what it is *not*: the
 * ask is a popover rather than a form, nothing in it is required, and Send
 * fires with `reason` simply absent from the payload — so the question can be
 * ignored without stranding the rating that has already been given.
 */
export const Rating: Story = {
  args: {
    state: "rating",
    value: "down",
    onRate: () => {},
    onSubmit: () => {},
  },
  render: (args) => <ControlledFeedback {...args} />,
  play: async ({ canvasElement }) => {
    // The reason popover renders in a portal, outside canvasElement.
    const body = within(document.body);
    await expect(await body.findByText("What went wrong?")).toBeInTheDocument();

    // Named through Base UI's own `Popover.Title` wiring rather than an
    // `aria-label` — measured `aria-labelledby="base-ui-…"` pointing at the
    // heading. `CONTINUE.md` §8 records four popovers in this registry that
    // shipped as unnamed dialogs because nothing opened them; this one was
    // never in that set, and this assertion is what keeps it out.
    await expect(await body.findByRole("dialog", { name: "What went wrong?" })).toBeInTheDocument();

    // Free text never blocks submission.
    const send = await body.findByRole("button", { name: "Send feedback" });
    await userEvent.click(send);

    const canvas = within(canvasElement);
    await expect(await canvas.findByRole("status")).toHaveTextContent("Thanks for the feedback!");
  },
};

/**
 * Terminal, and the story that answers "can a rating be changed once it is
 * given". No: both thumbs go `disabled`, so the opposite thumb is not a
 * correction but an inert control, and the only route out is a full retraction
 * through Undo. Two things are worth noticing on the way through.
 *
 * The first is that `disabled` is not enough on its own to leave the tab
 * order here. Base UI keeps `tabindex="0"` on the natively-disabled trigger
 * (measured), which is the trap `story-conventions.md` records: a
 * `[tabindex]:not([tabindex="-1"])` query counts both thumbs as stops when
 * neither can be reached. Querying `button:not([disabled])` gives the true
 * answer — one stop, Undo.
 *
 * The second is what a retraction does *not* clear. `reason` is optionally
 * controlled, and this host leaves it to the component, so the free text lives
 * in internal state that no transition resets: rate down, type, send, undo,
 * rate down again, and the previous complaint is still sitting in the box.
 * Measured below. A host can only reach it by controlling `reason` outright.
 */
export const Submitted: Story = {
  args: {
    state: "submitted",
    value: "up",
    onUndo: () => {},
  },
  render: (args) => <ControlledFeedback {...args} />,
  play: async ({ canvasElement }) => {
    const body = within(document.body);
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("status")).toHaveTextContent("Thanks for the feedback!");

    const up = canvas.getByRole("button", { name: "Helpful" });
    const down = canvas.getByRole("button", { name: "Not helpful" });
    await expect(up).toBeDisabled();
    await expect(down).toBeDisabled();

    // The rating cannot be flipped in place. The opposite thumb is still
    // present, still named and still carrying pressed state, and it takes no
    // pointer at all — `disabled:pointer-events-none` means a click cannot even
    // be dispatched at it, which is a stronger statement than the handler's own
    // `locked` early return.
    await expect(getComputedStyle(down).pointerEvents).toBe("none");
    await expect(down).toHaveAttribute("aria-pressed", "false");
    await expect(body.queryByRole("dialog")).toBeNull();

    // One real stop, whatever `tabindex` says.
    await expect(down).toHaveAttribute("tabindex", "0");
    const stops = Array.from(canvasElement.querySelectorAll<HTMLElement>("button:not([disabled])"));
    await expect(stops.map((button) => button.dataset.slot)).toEqual(["feedback-undo"]);

    // Retracting is always available — feedback that can't be undone is
    // feedback people stop giving.
    await userEvent.click(canvas.getByRole("button", { name: "Undo" }));
    await expect(up).not.toBeDisabled();

    // …and the reason the retracted rating carried is still there.
    await userEvent.click(down);
    const first = await body.findByRole("dialog");
    await userEvent.type(within(first).getByRole("textbox"), "Invented a CLI flag that does not exist");
    await userEvent.click(within(first).getByRole("button", { name: "Send feedback" }));
    await waitFor(() => expect(body.queryByRole("dialog")).toBeNull());

    await userEvent.click(canvas.getByRole("button", { name: "Undo" }));
    await userEvent.click(down);
    const second = await body.findByRole("dialog");
    await expect(within(second).getByRole("textbox")).toHaveValue("Invented a CLI flag that does not exist");

    // Leave nothing mid-dismissal for axe to measure at a transitional opacity.
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("dialog")).toBeNull());
  },
};

/* -------------------------------------------------------------------------
 * Case stories — the situations this control meets under a real response, as
 * opposed to the three states above. See
 * docs/design-system/story-conventions.md.
 *
 * All eight are true here, so there are no `case-skip` lines. The reason
 * popover animates (`data-open:animate-in`), so `ReducedMotion` has a branch
 * to document; the thumbs sit in a `ButtonGroup` whose joins are physical, so
 * `RTL` has geometry to measure; there are two stops at rest and five more
 * inside a portal, so `KeyboardOrder` has a walk; `reason`/`onReasonChange`
 * and `state` are genuine controlled pairs; every visible string is an
 * optional, defaulted prop, which covers `EmptyLabel` and `LongContent`; and
 * F7 `approval-card` is the near-twin `Boundary` is defined against — both
 * are a small decision about one AI artifact, taken in a `ButtonGroup`, ending
 * in an Undo.
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
 * Right-to-left, and the third reading of the vendored `button-group`'s
 * physical join: E8 `generation-wizard` measured it, K1 `ai-doc-block` narrowed
 * its severity, and this is the smallest possible case — two children, one
 * seam, four corners — which is what makes it legible.
 *
 * `buttonGroupVariants` joins horizontally with `rounded-r-none`,
 * `rounded-r-lg!`, `rounded-l-none` and `border-l-0`. All four name a physical
 * side, so under `dir="rtl"` — where the first DOM child paints on the right —
 * every one of them lands on the wrong edge. Measured here: **both of the
 * group's outer corners are square (0px) and both seam corners are rounded
 * (8px and 10px)**, which is the LTR shape inverted rather than mirrored.
 *
 * The border half of the same defect is invisible in this component, and that
 * narrows what K1 measured rather than repeating it. `border-l-0` does strip
 * the border from the group's outer left edge (read back as `0px` on the
 * thumbs-down), but both thumbs are `variant="ghost"`, so `buttonVariants`'
 * base `border-transparent` means the border that survives at the seam paints
 * `rgba(0, 0, 0, 0)`. The severity of this primitive's RTL defect therefore
 * depends on the variants a call site uses: on ghost children only the radii
 * are seen. One logical-utility fix in `components/ui/button-group.tsx` would
 * repair every consumer at once; it is vendored, so it is not swept here.
 *
 * The popover half is the good news, and it is the third component to confirm
 * it after K2 `inline-generate-popup` and K4 `selection-toolbar`:
 * floating-ui resolves `align="start"` against *computed* direction, so the
 * panel's right edge lines up with the trigger's right edge under RTL. That is
 * why this story sets `dir` on the document — a `<div dir="rtl">` never
 * reaches a portal, and the half that works would silently fail with one.
 * Nothing here relies on the `DirectionContext` that `CONTINUE.md` §8 records
 * as unmounted: there are no arrow keys and no `side` request.
 */
export const RTL: Story = {
  args: { state: "rating", value: "down", onRate: () => {}, onSubmit: () => {} },
  render: (args) => (
    <RtlDocument>
      <ControlledFeedback {...args} />
    </RtlDocument>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const group = canvasElement.querySelector<HTMLElement>('[data-slot="feedback-thumbs"]')!;
    const up = canvas.getByRole("button", { name: "Helpful" });
    const down = canvas.getByRole("button", { name: "Not helpful" });
    await expect(getComputedStyle(group).direction).toBe("rtl");

    // 1. The pair mirrors: the first DOM child paints to the right of the last.
    await expect(up.getBoundingClientRect().left).toBeGreaterThan(down.getBoundingClientRect().left);

    // 2. The join does not. Thumbs-up is now the group's right edge and
    //    thumbs-down its left, so the two radii that should be on the outside
    //    are on the seam and the two that should be square face outward.
    const right = getComputedStyle(up);
    const left = getComputedStyle(down);
    await expect(
      `outer tr=${right.borderTopRightRadius} tl=${left.borderTopLeftRadius}`,
    ).toBe("outer tr=0px tl=0px");
    await expect(parseFloat(right.borderTopLeftRadius)).toBeGreaterThan(0);
    await expect(parseFloat(left.borderTopRightRadius)).toBeGreaterThan(0);

    // 3. The border half is real and unseen: stripped from the outer edge,
    //    doubled at the seam, and transparent on both because these are ghost
    //    buttons carrying `buttonVariants`' base `border-transparent`.
    await expect(left.borderLeftWidth).toBe("0px");
    await expect(parseFloat(right.borderLeftWidth)).toBeGreaterThan(0);
    await expect(left.borderLeftColor).toBe("rgba(0, 0, 0, 0)");

    // 4. The popover mirrors, because the positioner reads computed direction.
    //    Stated as two relations rather than an edge match so no collision
    //    constant leaks in: the panel hangs leftwards from the trigger and
    //    never crosses its start (right) edge. Both invert under LTR.
    const popup = await within(document.body).findByRole("dialog", { name: "What went wrong?" });
    await expect(getComputedStyle(popup).direction).toBe("rtl");
    await expect(popup.closest("[data-align]")?.getAttribute("data-align")).toBe("start");
    await waitFor(() => {
      const panel = popup.getBoundingClientRect();
      const anchor = down.getBoundingClientRect();
      expect(`hangsLeftwards=${panel.left < anchor.left}`).toBe("hangsLeftwards=true");
      expect(`withinStartEdge=${panel.right <= anchor.right + 1}`).toBe("withinStartEdge=true");
    });
  },
};

/**
 * The reason popover under `prefers-reduced-motion: reduce`, which
 * `vitest.config.ts` emulates for every story in this project.
 *
 * This component's `PopoverContent` was the last one in the registry with no
 * restated reduced-motion pair, and the fix landed with this story. Grepped
 * after it: all eight `<PopoverContent` call sites now carry the pair.
 * The measurement is the point: with a bare `motion-reduce:animate-none` on
 * the popup the computed `animation-name` reads **`enter`**, and with
 * `motion-reduce:data-open:animate-none motion-reduce:data-closed:animate-none`
 * it reads **`none`**. Both were run here, in that order. The cause is the one
 * `story-conventions.md` mechanical fact 3 records — Tailwind v4 compiles the
 * plain variant and the `data-*` variant to a single class of specificity and
 * emits the plain block first, so the data-attribute rule wins the source-order
 * tie — and the consequence is that the suppression has to be restated at every
 * call site. Fixing one consumer fixes none of the others.
 *
 * Nothing else in this component needed a class. The reason chips carry
 * `transition-colors`, which crossfades a background and moves nothing, so
 * suppressing it would document no branch (the `reset-affordance` precedent).
 * The press nudge the thumbs inherit from `buttonVariants` — `transition-all`
 * plus `active:not-aria-[haspopup]:translate-y-px` — does move under reduce,
 * but it is a primitive-wide posture recorded in `CONTINUE.md` §8, not this
 * component's to fix. Worth noticing that it reaches the thumbs-up only:
 * `PopoverTrigger` gives the thumbs-down `aria-haspopup`, which the
 * `not-aria-[haspopup]` guard excludes, so the two halves of one control
 * already behave differently on press.
 */
export const ReducedMotion: Story = {
  args: { state: "rating", value: "down", onRate: () => {}, onSubmit: () => {} },
  render: (args) => <ControlledFeedback {...args} />,
  play: async ({ canvasElement }) => {
    const body = within(document.body);
    const popup = await body.findByRole("dialog", { name: "What went wrong?" });

    // Read the frame back rather than trusting the class: the class is present
    // in both the working and the broken form, and only the computed value
    // tells them apart.
    await expect(popup).toHaveAttribute("data-open");
    await expect(getComputedStyle(popup).animationName).toBe("none");

    // The chips crossfade a colour and hold their box, which is why no
    // `motion-reduce:transition-none` was added beside them: every property
    // `transition-colors` names is a paint, and none of them can move a chip.
    const chip = within(popup).getByRole("button", { name: "Inaccurate" });
    const transitioned = getComputedStyle(chip).transitionProperty.split(",").map((property) => property.trim());
    await expect(
      `moves=${transitioned.filter((property) => /^(all|transform|translate|scale|rotate|width|height|inset|top|left|right|bottom|margin|padding)/.test(property)).join("|") || "none"}`,
    ).toBe("moves=none");
    await expect(transitioned).toContain("background-color");

    // The asymmetry in the press nudge, stated as what each thumb carries.
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("button", { name: "Not helpful" })).toHaveAttribute("aria-haspopup", "dialog");
    await expect(canvas.getByRole("button", { name: "Helpful" })).not.toHaveAttribute("aria-haspopup");

    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("dialog")).toBeNull());
  },
};

/**
 * Two stops at rest, five more once the ask opens, and three different answers
 * to "where does focus go when this closes".
 *
 * **The clean path.** Escape returns focus to the thumbs-down, which is still
 * enabled in `rating`. Asserted below.
 *
 * **The path that loses it, recorded and deliberately not pinned.** Send moves
 * the host to `submitted`, and that same render disables the thumb the popover
 * would have restored focus to — so focus falls to `<body>` and the next Tab
 * restarts from the top of the page. Undo has the identical shape from the
 * other side: the confirmation row unmounts with the focused button inside it.
 * Both measured (`document.activeElement` reads `BODY` after each), both
 * already carried by the docs module's focus notes, and neither asserted here.
 * That is the focus-loss-on-dismissal shape wave 1 measured in four components
 * and pinned in none of them; the policy is the same here.
 *
 * **The path that spends the ask.** The popup is not a focus trap, and Base
 * UI's trailing guard closes it on `focusOut` — so tabbing past Send fires
 * `onOpenChange(false)`, which is wired straight to `onRatingCancel`. A Tab is
 * navigation, not a decision, and here it retracts the question the user was
 * part-way through answering. Fourth instance of the shape, and it sits between
 * the two severities already recorded: worse than K2 `inline-generate-popup`,
 * where the popup closes and nothing is lost, and better than L2 `coach-mark`
 * and L3 `feature-announcement`, where the same Tab ends a tour or spends a
 * dismissal permanently. Here the ask is retracted, the thumbs-down comes back
 * enabled, and the free text survives in internal state. The two assertions on
 * that leg are the part that is correct: the popup is provably gone, and focus
 * lands on the trigger rather than on `<body>`.
 *
 * On treatments, both checks mechanical fact 5 asks for are taken, and they
 * agree everywhere here. They do disagree about *what* is painted: the thumbs,
 * the textarea and Send take the shadcn ring (a `box-shadow` layer at
 * `outline-style: none`), while the three reason chips ship no `focus-visible`
 * class at all and fall back to the user agent's `outline: auto 1px`. Both are
 * visible; they are not the same treatment, which is what the docs module's
 * fourth focus note claims and this story measures.
 */
export const KeyboardOrder: Story = {
  args: { onRate: () => {}, onSubmit: () => {} },
  render: (args) => <ControlledFeedback {...args} />,
  play: async ({ canvasElement }) => {
    const body = within(document.body);

    // 1. Two stops in the page, in DOM order. Query for enabled buttons rather
    //    than `[tabindex]`: Base UI leaves `tabindex="0"` on a natively
    //    disabled trigger, which `Submitted` measures.
    const pageStops = Array.from(canvasElement.querySelectorAll<HTMLButtonElement>("button:not([disabled])"));
    await expect(pageStops.map((button) => button.dataset.slot)).toEqual([
      "feedback-thumb-up",
      "feedback-thumb-down",
    ]);

    for (const stop of pageStops) {
      const before = focusTreatmentSignature(stop);
      await userEvent.tab();
      await expect(document.activeElement).toBe(stop);
      await expect(stop.matches(":focus-visible")).toBe(true);
      // Something is painted…
      await settledFocusRing(stop, waitFor);
      // …and focus is what painted it.
      await waitFor(() => expect(focusTreatmentSignature(stop)).not.toBe(before));
      // …and it is the house ring rather than the browser's outline.
      await expect(getComputedStyle(stop).outlineStyle).toBe("none");
    }

    const down = pageStops[1];
    await expect(document.activeElement).toBe(down);

    /**
     * The focused control inside the popup, once Base UI has finished moving
     * focus off `previous`. Reading `document.activeElement` straight after a
     * tab inside a portal returns either the trailing focus guard or the
     * control it redirects to, depending on whether the frame has painted —
     * and waiting only for "focus is on some expected stop" cannot see a press
     * that has not applied yet, because the previous stop is expected too.
     * Naming the stop focus has to leave makes every tab provably one move.
     */
    const settledStop = async (stops: HTMLElement[], previous?: HTMLElement) => {
      const nameOf = (el: Element | null) =>
        el === null ? "nothing" : `stop#${stops.indexOf(el as HTMLElement)} ${el.getAttribute("data-slot")}`;
      await waitFor(() => {
        const active = document.activeElement;
        if (!stops.includes(active as HTMLElement)) {
          throw new Error(`focus is not on one of the popup's controls: ${nameOf(active)}`);
        }
        if (previous && active === previous) {
          throw new Error(`focus has not moved off ${nameOf(previous)} yet`);
        }
      });
      return document.activeElement as HTMLElement;
    };

    const openFromThumb = async () => {
      await userEvent.keyboard("{Enter}");
      const popup = await body.findByRole("dialog", { name: "What went wrong?" });
      return {
        popup,
        controls: Array.from(
          popup.querySelectorAll<HTMLElement>("button:not([disabled]), textarea:not([disabled])"),
        ),
      };
    };

    // 2. The ask adds five stops: three presets, the free-text field, Send.
    const first = await openFromThumb();
    await expect(first.controls.map((el) => el.dataset.slot)).toEqual([
      "feedback-reason-chip",
      "feedback-reason-chip",
      "feedback-reason-chip",
      "feedback-reason-input",
      "feedback-reason-submit",
    ]);

    // Focus entered on the first preset — seed the walk from where it actually
    // landed, not from an assumed first element.
    const entered = await settledStop(first.controls);
    await expect(entered).toBe(first.controls[0]);

    // Unfocused baselines for every stop the walk has not reached yet, taken
    // while focus is still on the first one. That is how the differential
    // works inside a tab walk: no blur, so nothing disturbs the sequence under
    // test. The first stop has no baseline — focus arrived with the popup —
    // so `settledFocusRing` carries that one on its own.
    const baseline = new Map(first.controls.slice(1).map((el) => [el, focusTreatmentSignature(el)]));

    const seen = new Set<HTMLElement>([entered]);
    let previous = entered;
    for (let i = 0; i < first.controls.length; i += 1) {
      if (i > 0) {
        await userEvent.tab();
        previous = await settledStop(first.controls, previous);
      }
      const stop = previous;
      await expect(`${stop.dataset.slot}#${i} repeat=${i > 0 && seen.has(stop)}`).toBe(
        `${stop.dataset.slot}#${i} repeat=false`,
      );
      await expect(stop.matches(":focus-visible")).toBe(true);
      // Something is painted…
      await settledFocusRing(stop, waitFor);
      // …and, for every stop that has a baseline, focus is what painted it.
      const before = baseline.get(stop);
      if (before !== undefined) {
        await waitFor(() => expect(focusTreatmentSignature(stop)).not.toBe(before));
      }
      seen.add(stop);

      // Which treatment, not merely whether there is one. The chips have no
      // `focus-visible` class of their own; everything else takes the ring.
      const style = getComputedStyle(stop);
      const kind = stop.dataset.slot === "feedback-reason-chip" ? "ua-outline" : "ring";
      await expect(`${stop.dataset.slot} ${kind} outline=${style.outlineStyle !== "none"}`).toBe(
        `${stop.dataset.slot} ${kind} outline=${kind === "ua-outline"}`,
      );
    }
    await expect(seen.size).toBe(first.controls.length);

    // 3. Tabbing off Send leaves the popup, and the popup closes behind it —
    //    which also fires `onRatingCancel` and spends the ask. That side of it
    //    is the defect the description records and is deliberately not
    //    asserted; these two lines are the part that is correct.
    await userEvent.tab();
    await waitFor(() => expect(body.queryByRole("dialog")).toBeNull());
    await waitFor(() => expect(document.activeElement).toBe(down));

    // 4. Escape is the clean path: closed, and the trigger has focus back.
    const reopened = await openFromThumb();
    await settledStop(reopened.controls);
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("dialog")).toBeNull());
    await waitFor(() => expect(document.activeElement).toBe(down));
  },
};

const PINNED_REASON = "Cited a changelog entry that does not exist";

/**
 * A host that refuses every change, which is the only way to tell a controlled
 * component from one that merely reports what it already did.
 *
 * Two pairs are under test and they fail differently when a consumer forgets
 * them. `state` is controlled outright, with no internal fallback: Send fires
 * `onSubmit` with the payload, and because this host never moves `state` the
 * popover is still open at the end of the play. That is the docs module's first
 * pitfall rendered — recording a rating without advancing the state leaves the
 * UI stuck on the ask. `reason`/`onReasonChange` is the optionally-controlled
 * half: supply `reason` and the component stops holding its own copy, so typing
 * moves nothing on screen and the callback carries the *whole next string* a
 * consumer needs to apply, not a delta.
 *
 * The third clause is proved without a spare button. Every callback appends to
 * this host's log, so each keystroke re-renders `Feedback` with an unchanged
 * `reason` — and the field still reads the pinned string after all of them.
 */
export const Controlled: Story = {
  render: function ControlledRender() {
    const [log, setLog] = React.useState<string[]>([]);
    return (
      <div className="flex flex-col items-start gap-3">
        <pre data-testid="log" className="text-xs">
          {log.join("\n") || "no calls"}
        </pre>
        <Feedback
          state="rating"
          value="down"
          reason={PINNED_REASON}
          onReasonChange={(next) => setLog((calls) => [...calls, `reason:${next}`])}
          onRate={(next) => setLog((calls) => [...calls, `rate:${next}`])}
          onSubmit={(payload) =>
            setLog((calls) => [...calls, `submit:${payload.value}:${payload.reason ?? "(none)"}`])
          }
          onRatingCancel={() => setLog((calls) => [...calls, "cancel"])}
        />
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const body = within(document.body);
    const log = canvasElement.querySelector<HTMLElement>('[data-testid="log"]')!;
    const popup = await body.findByRole("dialog", { name: "What went wrong?" });
    const field = within(popup).getByRole("textbox") as HTMLTextAreaElement;
    await expect(field).toHaveValue(PINNED_REASON);

    // 1. Typing moves nothing rendered…
    await userEvent.type(field, "xy");
    await expect(field).toHaveValue(PINNED_REASON);

    // …and every keystroke re-rendered the component with the same `reason`,
    // which is the "unchanged value holds it fixed" half.
    await expect(log.textContent).toContain(`reason:${PINNED_REASON}x`);
    await expect(log.textContent).toContain(`reason:${PINNED_REASON}y`);

    // 2. A preset is the same callback with a different payload: the chip
    //    hands over its exact text and cannot press itself.
    const inaccurate = within(popup).getByRole("button", { name: "Inaccurate" });
    await userEvent.click(inaccurate);
    await expect(field).toHaveValue(PINNED_REASON);
    await expect(inaccurate).toHaveAttribute("aria-pressed", "false");
    await expect(log.textContent).toContain("reason:Inaccurate");

    // 3. Send reports, and `state` is controlled outright — so a host that
    //    records the rating and forgets to advance leaves the ask on screen.
    await userEvent.click(within(popup).getByRole("button", { name: "Send feedback" }));
    await expect(log.textContent).toContain(`submit:down:${PINNED_REASON}`);
    await expect(await body.findByRole("dialog", { name: "What went wrong?" })).toBeInTheDocument();
  },
};

/**
 * Every visible string here is an optional prop with a default, so the
 * no-label rendering is a real call site rather than a hypothetical. Two of
 * them are rendered and two are described, because the described pair are red
 * gates and this story would fail the build rather than document anything.
 *
 * **Rendered.** `label=""` empties the thumbs group's only name: the pair keeps
 * `role="group"` and loses the question it was asking, so a screen-reader user
 * meets two toggles named "Helpful" and "Not helpful" with nothing saying what
 * they are about. No axe rule covers a nameless group — this is the third
 * instance of the shape J7 and H7 measured, where a defaulted label defeats its
 * own default. `reasonOptions={[]}` removes the preset row entirely, which is
 * the spec's "every chip is optional" taken to its limit: with no presets at
 * all, Send still fires and the rating still lands.
 *
 * **Described, not rendered, and measured before it was described.** A story
 * passing all three of `upLabel=""`, `downLabel=""` and `reasonPlaceholder=""`
 * was rendered once under this gate and deleted: axe 4.12 raised `button-name`
 * on both thumbs (the glyphs are `aria-hidden`, so there is no text to fall
 * back on) and `label` on the textarea. The textarea's is the one worth
 * knowing, because it is not obvious from the prop name: `reasonPlaceholder` is
 * both the placeholder and the field's `aria-label`, so one empty string
 * removes the only name and the only visible hint together. It is also the
 * counter-case to K1 `ai-doc-block`'s pair, where a second field survived the
 * same empty string because it had a placeholder to fall back on — here the
 * placeholder *is* the name, so there is nothing behind it.
 */
export const EmptyLabel: Story = {
  args: {
    state: "rating",
    value: "down",
    label: "",
    reasonOptions: [],
    onRate: () => {},
    onSubmit: () => {},
  },
  render: (args) => <ControlledFeedback {...args} />,
  play: async ({ canvasElement }) => {
    const body = within(document.body);
    const group = canvasElement.querySelector<HTMLElement>('[data-slot="feedback-thumbs"]')!;

    // The group survives; its name does not.
    await expect(group).toHaveAttribute("role", "group");
    await expect(group.getAttribute("aria-label")).toBe("");

    // The thumbs keep their own names, which is the only reason this story can
    // exist at all: the empty-label variant of them fails axe `button-name`.
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("button", { name: "Helpful" })).toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: "Not helpful" })).toBeInTheDocument();

    // No presets, and submission is untouched by their absence.
    const popup = await body.findByRole("dialog", { name: "What went wrong?" });
    await expect(popup.querySelector('[data-slot="feedback-reason-options"]')).toBeNull();
    await expect(within(popup).getAllByRole("button")).toHaveLength(1);
    await userEvent.click(within(popup).getByRole("button", { name: "Send feedback" }));
    await expect(await within(canvasElement).findByRole("status")).toHaveTextContent(
      "Thanks for the feedback!",
    );
  },
};

const LONG_TITLE = "What went wrong with this answer? Tell us as much or as little as you like.";
const LONG_PLACEHOLDER = "Optional. What did the model get wrong, and what were you expecting instead?";
const LONG_OPTIONS = [
  "It invented a function signature that does not exist anywhere in the SDK we are using",
  "Ignored the constraint in my prompt",
  "Too long",
];
const LONG_CONFIRMATION =
  "Thanks. A reviewer will read this alongside the response you rated, usually within a day.";

/**
 * Author-supplied strings at ~90 characters, and the component makes two
 * different decisions about them.
 *
 * Inside the popover it wraps, and it can afford to: `PopoverContent` is a
 * fixed `w-72`, so the title, the presets and the field all have a known box
 * to wrap into. Measured at 288px wide with no internal scroll: a 75-character
 * title takes two lines, and an 85-character preset chip grows to two lines at
 * 268px rather than pushing the panel sideways, because the chips are flex
 * items with no `whitespace-nowrap`. That is the opposite of the B4 trap, where
 * a fixed height plus a nowrap base spills the label out of the control.
 *
 * The confirmation row makes no decision at all, which is the finding. It is a
 * bare `flex items-center gap-2` with no maximum width, so unconstrained — as
 * here — it grows to whatever the string needs on one line. Constrained, it
 * wraps and stays inside its column, which `Mobile` measures at 375px. Same
 * conditional-guarantee shape as E1 `generation-panel`'s footer: correct in the
 * layout the component is normally given, and silently different in the one
 * nobody checked.
 *
 * One consequence of a long placeholder is worth naming because it is not
 * visual. `reasonPlaceholder` is also the textarea's `aria-label`, so the whole
 * hint becomes the accessible name a screen reader reads out every time the
 * field takes focus, asserted below against the full 76-character string. There
 * is no separate label prop to shorten it with.
 */
export const LongContent: Story = {
  render: () => (
    <div className="flex flex-col items-start gap-8">
      <ControlledFeedback
        state="rating"
        value="down"
        reasonTitle={LONG_TITLE}
        reasonPlaceholder={LONG_PLACEHOLDER}
        reasonOptions={LONG_OPTIONS}
        onRate={() => {}}
        onSubmit={() => {}}
      />
      <ControlledFeedback state="submitted" value="down" submittedLabel={LONG_CONFIRMATION} onUndo={() => {}} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const body = within(document.body);
    const popup = await body.findByRole("dialog", { name: LONG_TITLE });

    // The panel holds its width and nothing scrolls inside it.
    await expect(popup.clientWidth).toBe(popup.scrollWidth);
    const panel = popup.getBoundingClientRect();
    await expect(Math.round(panel.width)).toBe(288);

    // The title wraps rather than truncating or widening the panel.
    const title = popup.querySelector<HTMLElement>('[data-slot="popover-title"]')!;
    const titleLines = title.getBoundingClientRect().height / parseFloat(getComputedStyle(title).lineHeight);
    await expect(`titleWraps=${titleLines > 1.5}`).toBe("titleWraps=true");

    // So does the long preset, inside the panel's content box.
    const chips = Array.from(popup.querySelectorAll<HTMLElement>('[data-slot="feedback-reason-chip"]'));
    const longChip = chips[0].getBoundingClientRect();
    const shortChip = chips[2].getBoundingClientRect();
    await expect(`chipWithinPanel=${longChip.right <= panel.right}`).toBe("chipWithinPanel=true");
    await expect(`chipGrewTaller=${longChip.height > shortChip.height}`).toBe("chipGrewTaller=true");

    // The placeholder is the field's accessible name, at full length.
    const field = within(popup).getByRole("textbox");
    await expect(field).toHaveAccessibleName(LONG_PLACEHOLDER);

    // The confirmation row has no width of its own: unconstrained it runs on
    // one line, wider than the popover it sits under.
    const row = canvasElement.querySelector<HTMLElement>('[data-slot="feedback-submitted"]')!;
    const rowBox = row.getBoundingClientRect();
    const rowLines = rowBox.height / parseFloat(getComputedStyle(row).lineHeight);
    await expect(`rowOnOneLine=${rowLines < 1.5}`).toBe("rowOnOneLine=true");
    await expect(`rowWiderThanPanel=${rowBox.width > panel.width}`).toBe("rowWiderThanPanel=true");
  },
};

/**
 * 375px, with the ask open — the state that has something to overflow.
 *
 * The frame is a wrapper with its own `data-testid` rather than a viewport
 * parameter, and it is measured directly: `layout: "centered"` in the meta
 * wraps every story, so `canvasElement.firstElementChild` is the ~1200px
 * centring div and an overflow assertion against it would pass for the wrong
 * reason. Measured 1200px here, which is the trap stated as a number.
 *
 * Nothing scrolls sideways. The thumbs are a 56px pair of 28×28 targets, above
 * WCAG 2.2's 24×24 floor with no reliance on the spacing exception — unlike the
 * two rails `CONTINUE.md` §8 records — and the popover is a fixed 288px, so it
 * fits a 375px column with 87px to spare. The long confirmation string that
 * runs on one line in `LongContent` wraps here and stays inside the frame,
 * which is the conditional half of that finding closed from the other side.
 *
 * One thing this story cannot see, per mechanical fact 2: a wrapper constrains
 * width, not the breakpoint. The gate's chromium is 1200px wide, so the
 * textarea's `md:text-sm` applies and it renders at 14px — measured — where a
 * real 375px phone gets the `text-base` 16px that keeps iOS Safari from zooming
 * on focus. So what is proved here is the desktop type size squeezed into a
 * phone-width column, and the phone's own rendering of the field is a size this
 * gate cannot reach.
 */
export const Mobile: Story = {
  args: { state: "rating", value: "down", onRate: () => {}, onSubmit: () => {} },
  render: (args) => (
    <div data-testid="frame" className="w-[375px] max-w-full">
      <div className="flex flex-col items-start gap-8">
        <ControlledFeedback {...args} />
        <ControlledFeedback state="submitted" value="down" submittedLabel={LONG_CONFIRMATION} onUndo={() => {}} />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const body = within(document.body);
    const frame = canvasElement.querySelector<HTMLElement>('[data-testid="frame"]')!;

    // The centring div, named so the next reader does not measure it by
    // accident.
    await expect(Math.round((canvasElement.firstElementChild as HTMLElement).clientWidth)).toBeGreaterThan(375);
    await expect(frame.clientWidth).toBe(375);
    await expect(frame.scrollWidth).toBe(frame.clientWidth);

    // Tap targets clear 24×24 without leaning on the spacing exception.
    const up = canvasElement.querySelector<HTMLElement>('[data-slot="feedback-thumb-up"]')!;
    const thumb = up.getBoundingClientRect();
    await expect(`thumb=${Math.round(thumb.width)}x${Math.round(thumb.height)}`).toBe("thumb=28x28");

    // The portalled panel is not inside the frame, so it is measured against
    // the frame's width rather than its scroll box.
    const popup = await body.findByRole("dialog", { name: "What went wrong?" });
    const anchor = canvasElement.querySelector<HTMLElement>('[data-slot="feedback-thumb-down"]')!;
    await waitFor(() =>
      expect(Math.abs(popup.getBoundingClientRect().left - anchor.getBoundingClientRect().left)).toBeLessThan(2),
    );
    await expect(`panelFits=${popup.getBoundingClientRect().width <= frame.clientWidth}`).toBe("panelFits=true");
    await expect(popup.clientWidth).toBe(popup.scrollWidth);

    // The confirmation wraps rather than widening the column.
    const row = canvasElement.querySelector<HTMLElement>('[data-slot="feedback-submitted"]')!;
    const rowBox = row.getBoundingClientRect();
    await expect(`rowWraps=${rowBox.height / parseFloat(getComputedStyle(row).lineHeight) > 1.5}`).toBe(
      "rowWraps=true",
    );
    await expect(`rowWithinFrame=${Math.round(rowBox.width) <= frame.clientWidth}`).toBe("rowWithinFrame=true");

    // The breakpoint the wrapper cannot move.
    await expect(getComputedStyle(within(popup).getByRole("textbox")).fontSize).toBe("14px");
  },
};

/**
 * Beside F7 `approval-card`, the catalog's other small binary decision about a
 * single AI artifact. They look alike from a distance — two or four buttons in
 * a `ButtonGroup`, one terminal state, an Undo — and the rule that separates
 * them is not reversibility, because both are reversible.
 *
 * **The rule: does the artifact wait for you?** An approval card is a gate. The
 * summary it holds is not sent, run or published until a verb is pressed, so
 * the four verbs are commands, they are always all four, and their order is
 * fixed by the component so the muscle memory holds. Feedback is a signal.
 * The response it sits under has already been delivered; the two thumbs are
 * `aria-pressed` toggles that change nothing downstream, and a user who never
 * touches them has lost nothing.
 *
 * Two practical consequences of that. Praise is one click here and there is no
 * one-click verb there, because a gate that can be cleared by accident is not a
 * gate. And Undo means different things: retracting an opinion, against
 * recalling an action that has already run, which is why `approval-card` bounds
 * its Undo with a window and this component leaves it up permanently.
 *
 * If you are choosing: put an approval card where a human decision is a
 * precondition, and feedback where the work is finished and you want to know
 * how it went. Using feedback as a gate loses the artifact; using an approval
 * card to collect an opinion asks four questions where one was wanted.
 */
export const Boundary: Story = {
  render: () => (
    <div className="flex w-full max-w-3xl flex-col items-start gap-6">
      <div className="flex flex-col items-start gap-2">
        <p className="text-sm text-muted-foreground">A response that has already been delivered.</p>
        <ControlledFeedback onRate={() => {}} onSubmit={() => {}} />
      </div>
      <div className="w-96 max-w-full">
        <ApprovalCard
          title="Send the Q3 summary to the team"
          summary="Three paragraphs drafted from last quarter's metrics, ready to post in #general."
          state="pending"
          onConfirm={() => {}}
          onEdit={() => {}}
          onRegenerate={() => {}}
          onSkip={() => {}}
        />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Feedback's controls are toggles: they carry pressed state and gate
    // nothing.
    for (const name of ["Helpful", "Not helpful"]) {
      await expect(canvas.getByRole("button", { name })).toHaveAttribute("aria-pressed", "false");
    }

    // The approval card's are commands: no pressed state, and a fixed order
    // that belongs to the component rather than to the call site.
    const verbs = ["Confirm", "Edit", "Regenerate", "Skip"].map((name) =>
      canvas.getByRole("button", { name }),
    );
    for (const verb of verbs) {
      await expect(verb).not.toHaveAttribute("aria-pressed");
    }
    const lefts = verbs.map((verb) => verb.getBoundingClientRect().left);
    await expect(`verbsInOrder=${lefts.every((left, i) => i === 0 || left > lefts[i - 1])}`).toBe(
      "verbsInOrder=true",
    );
  },
};
