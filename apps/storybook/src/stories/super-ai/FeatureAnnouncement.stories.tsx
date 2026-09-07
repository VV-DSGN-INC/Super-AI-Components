import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { FeatureAnnouncement } from "@/registry/super-ai/feature-announcement";
import { PromoCard } from "@/registry/super-ai/promo-card";
import { FeatureAnnouncementDocs } from "@/content/components/feature-announcement.docs";
import { componentDocsPage } from "@/lib/component-docs-page";
import { focusTreatmentSignature, settledFocusRing } from "@/lib/focus-ring";

const meta: Meta<typeof FeatureAnnouncement> = {
  title: "Super AI/Feature Announcement",
  component: FeatureAnnouncement,
  parameters: { layout: "centered", docs: { page: componentDocsPage(FeatureAnnouncementDocs) } },
};

export default meta;
type Story = StoryObj<typeof FeatureAnnouncement>;

/** Loudest level: the product genuinely works differently now. */
export const Modal: Story = {
  args: {
    id: "agent-mode-launch",
    level: "modal",
    stage: "New",
    title: "Agent mode",
    description: "Hand the assistant a goal and it plans, runs, and reports back on its own.",
    ctaLabel: "Try agent mode",
    onCtaClick: () => {},
    onDismiss: () => {},
  },
};

/** Points at the control the feature lives on. */
export const Anchored: Story = {
  args: {
    id: "timeline-markers",
    level: "anchored",
    stage: "Beta",
    title: "Markers on the timeline",
    description: "Drop a marker with M and jump between them with the bracket keys.",
    ctaLabel: "Show me",
    anchorLabel: "Timeline",
    onCtaClick: () => {},
    onDismiss: () => {},
  },
};

/** Worth reading in the flow of a surface, not worth blocking. */
export const InlineCard: Story = {
  args: {
    id: "voice-library",
    level: "inline-card",
    stage: "Preview",
    title: "Shared voice library",
    description: "Voices you clone are now available to everyone in the workspace.",
    ctaLabel: "Open the library",
    onCtaClick: () => {},
    onDismiss: () => {},
  },
};

/** Quietest level: a tweak, a rename, a raised limit. */
export const DismissibleChip: Story = {
  args: {
    id: "export-limit-raised",
    level: "dismissible-chip",
    stage: "v2.4",
    title: "Exports now run up to 4K",
    ctaLabel: "Details",
    onCtaClick: () => {},
    onDismiss: () => {},
  },
};

/**
 * Stage badges set expectations. All four render as a word — never a bare
 * coloured dot — so the stage survives for colourblind and screen-reader users.
 */
export const StageBadge: Story = {
  args: {
    id: "stage-badges",
    level: "inline-card",
    title: "Stage badges",
    onDismiss: () => {},
  },
  render: (args) => (
    <div className="flex flex-col items-start gap-3">
      {["New", "Beta", "Preview", "v2.4"].map((stage) => (
        <FeatureAnnouncement
          {...args}
          key={stage}
          id={`stage-badges-${stage.toLowerCase()}`}
          stage={stage}
          title={`Shared voice library (${stage})`}
          description="The badge is the promise: what you can expect from this feature today."
        />
      ))}
    </div>
  ),
};

/* -------------------------------------------------------------------------
 * Case stories — the situations this component meets in a product, as opposed
 * to the five presentations above. See docs/design-system/story-conventions.md.
 *
 * All eight are true here, so there are no `case-skip` lines. That follows
 * from the shape: one component with five presentations, two of which are Base
 * UI portals (a dialog and a popover), a real `open`/`onOpenChange` controlled
 * pair *and* a second `dismissed`/`onDismiss` one, three optional text slots,
 * and near-twins in two directions (L2 `coach-mark` and L4 `whats-new` inside
 * the family, B5 `promo-card` outside it).
 *
 * Each story says which presentation it renders and why the fact lives there.
 * The declared-state stories above render each level once and open nothing,
 * which is how the two portals reached this wave unexercised: before this
 * block, no play function had tabbed inside the dialog, pressed Escape, or
 * read an animation back.
 * ---------------------------------------------------------------------- */

/**
 * Right-to-left, with `dir` on the **document** rather than a wrapper: two of
 * the five presentations portal to the end of `document.body`, where a
 * wrapper's `dir` cannot reach them.
 *
 * One thing was wrong and is now fixed; two are right and are pinned so they
 * stay that way.
 *
 * - **The chip's padding was physical.** `py-1 pr-1 pl-2.5` gives the leading
 *   stage badge 10px and the trailing ✕ 4px in LTR, and swapped them under
 *   RTL — measured `padding-left: 10px` / `padding-right: 4px` in a
 *   right-to-left document, so the ✕ sat in the roomy gutter and the badge was
 *   jammed against the edge. `ps-2.5`/`pe-1` is byte-identical in LTR and is
 *   the swap `CONTINUE.md` §8 sanctions; every participant in this row is a
 *   class, so F5 `compare-viewer`'s "check what else decides the side" caveat
 *   does not bite here. The assertion reads the used padding back, so an edit
 *   reaching for `pr-` again fails here rather than silently.
 * - **The anchored popover's `align="start"` is direction-aware**, which is
 *   worth measuring rather than assuming: wave 1 recorded that no
 *   `DirectionProvider` is mounted anywhere, so Base UI composites never learn
 *   about RTL, and `account-menu` filed popup *side* resolution under the same
 *   cause. Popover alignment does not share it. Measured in a 900px frame with
 *   room on both sides — LTR puts the popup's left edge flush with the
 *   trigger's left (413/413), RTL puts its right edge flush with the trigger's
 *   right (787/787).
 * - **The card and the dialog mirror for free**, because neither contains a
 *   physical class: `CardAction` is grid-placed, and the dialog footer is
 *   `justify-end` on a row whose main axis reverses. Measured on the modal,
 *   which this story does not render because an open dialog would make
 *   everything beside it inert: the stage badge leads at 764px, the ✕ and the
 *   CTA both land at 392px, and `text-align` computes to `start`.
 */
export const RTL: Story = {
  args: {
    id: "timeline-markers",
    level: "anchored",
    stage: "Beta",
    title: "Markers on the timeline",
    description: "Drop a marker with M and jump between them with the bracket keys.",
    ctaLabel: "Show me",
    anchorLabel: "Timeline",
    onCtaClick: () => {},
    onDismiss: () => {},
  },
  render: (args) => (
    <RtlDocument>
      <div className="flex w-[900px] flex-col items-center gap-4">
        <FeatureAnnouncement {...args} />
        <FeatureAnnouncement
          id="export-limit-raised"
          level="dismissible-chip"
          stage="v2.4"
          title="Exports now run up to 4K"
          ctaLabel="Details"
          onCtaClick={() => {}}
          onDismiss={() => {}}
        />
      </div>
    </RtlDocument>
  ),
  play: async ({ canvasElement }) => {
    const body = within(document.body);

    // The chip: logical padding, read back as used values. Under RTL the
    // leading 10px has to be on the right, where the stage badge is.
    const chip = canvasElement.querySelector<HTMLElement>('[data-level="dismissible-chip"]')!;
    const chipStyle = getComputedStyle(chip);
    await expect(
      `dir=${chipStyle.direction} leading=${chipStyle.paddingRight} trailing=${chipStyle.paddingLeft}`,
    ).toBe("dir=rtl leading=10px trailing=4px");

    const badge = chip.querySelector<HTMLElement>('[data-slot="feature-announcement-stage"]')!;
    const dismiss = chip.querySelector<HTMLElement>('[data-slot="feature-announcement-dismiss"]')!;
    await expect(
      `badge right of dismiss: ${badge.getBoundingClientRect().left > dismiss.getBoundingClientRect().left}`,
    ).toBe("badge right of dismiss: true");

    // The popover: `dir` reaches the portal, and `align="start"` resolves to
    // the trigger's *right* edge in a right-to-left document.
    const popup = await body.findByRole("dialog", { name: "Markers on the timeline" });
    await expect(getComputedStyle(popup).direction).toBe("rtl");

    const trigger = canvasElement.querySelector<HTMLElement>('[data-slot="feature-announcement-anchor"]')!;
    await waitFor(() => {
      const popupBox = popup.getBoundingClientRect();
      const triggerBox = trigger.getBoundingClientRect();
      expect(`start-aligned to the trigger's right: ${Math.abs(popupBox.right - triggerBox.right) < 2}`).toBe(
        "start-aligned to the trigger's right: true",
      );
    });
  },
};

/**
 * Sets `dir` on the document element for the life of the story, because a
 * `<div dir="rtl">` cannot reach a Base UI portal. Restores the previous value
 * on unmount so the setting does not leak into the next story in the run.
 * `ShortcutsSheet.stories.tsx` carries the same helper.
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
 * The reduced-motion branch, on the modal, and a fix that had to be restated
 * to work at all.
 *
 * `DialogContent` opens with `data-open:animate-in fade-in-0 zoom-in-95` and
 * closes with `data-closed:animate-out`, none of which reads the media
 * feature. The registry's usual one-class remedy — a bare
 * `motion-reduce:animate-none` — is **inert on a Base UI popup**: Tailwind v4
 * wraps the data-attribute test in `:where(…)`, so both sides compile to a
 * single class of specificity and the tie falls to source order, which emits
 * the plain `motion-reduce:` block first and hands the win to
 * `animation: enter`. Measured here before the fix, with
 * `prefers-reduced-motion: reduce` emulated for every test by
 * `vitest.config.ts`: the popup's `animation-name` read `"enter"`. Restating
 * the variant on both halves at this component's own call site —
 * `motion-reduce:data-open:animate-none` and the `data-closed` twin — sorts
 * after its counterpart and wins the same tie, and the popup then read
 * `"none"`. That is `shortcuts-sheet`'s finding applied to this component's
 * two popups, and it is why the assertion reads `animation-name` back rather
 * than checking that a class is present.
 *
 * The `anchored` level carries the identical pair for the identical reason and
 * measured the same way, `"enter"` → `"none"`. `KeyboardOrder` opens that
 * popup and asserts it there, so both halves of the fix are pinned.
 *
 * **Not fixed, and not reachable from here: the backdrop.** `DialogOverlay` is
 * rendered inside `DialogContent` with no `className` threaded through
 * (`components/ui/dialog.tsx`), so its `data-open:animate-in fade-in-0` cannot
 * be suppressed at a call site — measured `animation-name: enter` with the
 * popup in the same story already reading `none`. Every dialog in the registry
 * is in that position; the repair is one line in the vendored primitive.
 */
export const ReducedMotion: Story = {
  args: {
    id: "agent-mode-launch",
    level: "modal",
    stage: "New",
    title: "Agent mode",
    description: "Hand the assistant a goal and it plans, runs, and reports back on its own.",
    ctaLabel: "Try agent mode",
    onCtaClick: () => {},
    onDismiss: () => {},
  },
  play: async () => {
    const popup = await within(document.body).findByRole("dialog", { name: "Agent mode" });

    // Still opening — the attribute the animation is keyed off is on the
    // element, so this is the frame a bare `motion-reduce:animate-none` fails
    // to reach.
    await expect(popup).toHaveAttribute("data-open");
    await expect(getComputedStyle(popup).animationName).toBe("none");
  },
};

/**
 * The keyboard contract, across the two surfaces that differ: levels that sit
 * in the page flow, and a level that opens a portal.
 *
 * What it pins:
 *
 * 1. **The page's tab order is dismiss then CTA on `inline-card`** — the ✕
 *    lives in `CardAction`, which is inside `CardHeader` and therefore ahead of
 *    the CTA in the DOM whatever the grid paints. The docs module's keyboard
 *    note says "`inline-card` and `dismissible-chip` are two stops each, CTA
 *    then dismiss in DOM order"; that is true of the chip, where the CTA really
 *    is the earlier sibling, and backwards for the card. Asserted here as
 *    measured, and reported as a docs correction rather than changed.
 * 2. **Every page stop paints a focus treatment that focus itself causes.**
 *    Both checks are taken, because they answer different questions: the
 *    differential (signature before, signature after) proves focus is what
 *    painted it, and `settledFocusRing` proves something is painted at all —
 *    necessary because the vendored `Button` carries `transition-all` and fades
 *    its ring in over ~250ms, so an immediate read is a false negative.
 * 3. **Opening the popover moves focus into it**, onto the ✕, which is its
 *    first tabbable descendant. The walk is seeded from where focus actually
 *    landed rather than from an assumed first element, so the stop it opened on
 *    is counted; each later read waits for focus to *leave* the stop it was on,
 *    rather than for focus to be on *some* expected stop — the weaker wait
 *    cannot see a press that has not applied yet, because the stale element is
 *    itself expected. That is `ai-tools-menu`'s finding, and it is what makes
 *    each press provably one move.
 * 4. **The popup is not a trap.** Two controls, then focus returns to the
 *    trigger and the page continues, which is correct for a non-modal popover
 *    and unlike the `modal` level, whose two stops cycle behind Base UI's focus
 *    guards.
 * 5. **Escape closes, dismisses, and returns focus to the trigger.** All three
 *    from one press, and `onDismiss(id)` fires exactly once with the
 *    announcement's id, because closing an overlay announcement *is* dismissing
 *    it. Each leg waits for the popup to be gone before moving on, so axe is
 *    never handed a surface mid-dismissal.
 *
 * **The defect this story found, recorded rather than pinned: tabbing past the
 * announcement dismisses it permanently.** Leg two measures it — open the
 * popover from the trigger, Tab twice, and the popup closes as focus leaves it,
 * which routes through the same `handleOpenChange(false)` as the ✕ and
 * therefore emits `onDismiss(id)`. A keyboard user traversing a page reaches
 * the trigger, opens nothing deliberately, tabs on, and has spent a dismissal
 * the component's whole contract says must never be re-shown. The two exits are
 * not equivalent: Escape and the ✕ are decisions, and a Tab is navigation. The
 * play asserts only that the popup closed and that focus is back on the
 * trigger; the dismissal it also emits is left unasserted, because pinning it
 * would pin the bug. The repair is a decision about which closes count —
 * `onOpenChange` without `onDismiss` for a focus-out close is the obvious shape
 * — so it stays recorded.
 *
 * The `modal` level's own trap is two stops, dismiss then CTA, wrapping through
 * the focus guards, with one difference worth naming: it is rendered without a
 * `DialogTrigger`, so **Escape leaves focus on `<body>`** rather than returning
 * it anywhere. Not asserted, for the same reason; the docs module already
 * records it, and the repair is a decision about what a triggerless dialog
 * should restore to.
 */
export const KeyboardOrder: Story = {
  args: {
    id: "timeline-markers",
    level: "anchored",
    stage: "Beta",
    title: "Markers on the timeline",
    ctaLabel: "Show me",
    anchorLabel: "Timeline",
    defaultOpen: false,
    onCtaClick: () => {},
  },
  render: function Render(args) {
    const [dismissed, setDismissed] = React.useState<string[]>([]);
    return (
      <div className="flex w-[420px] flex-col items-start gap-4">
        <p data-testid="dismissed">{dismissed.join(",") || "none"}</p>
        <FeatureAnnouncement
          id="voice-library"
          level="inline-card"
          stage="Preview"
          title="Shared voice library"
          description="Voices you clone are now available to everyone in the workspace."
          ctaLabel="Open the library"
          onCtaClick={() => {}}
          onDismiss={(id) => setDismissed((current) => [...current, id])}
        />
        <FeatureAnnouncement {...args} onDismiss={(id) => setDismissed((current) => [...current, id])} />
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const body = within(document.body);
    const dismissLog = canvasElement.querySelector<HTMLElement>('[data-testid="dismissed"]')!;

    // 1. The page's three stops, in DOM order. Query for buttons that are not
    //    disabled rather than `[tabindex]`, which counts inert controls.
    const pageStops = Array.from(canvasElement.querySelectorAll<HTMLButtonElement>("button:not([disabled])"));
    await expect(pageStops.map((button) => button.dataset.slot)).toEqual([
      "feature-announcement-dismiss",
      "feature-announcement-cta",
      "feature-announcement-anchor",
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
    }

    const trigger = pageStops[2];

    /**
     * The focused control inside the popup, once Base UI has finished moving
     * focus off `previous`. Reading `document.activeElement` immediately after
     * a tab inside a portal returns either the trailing focus guard or the
     * control it redirects to, depending on whether the frame has painted — and
     * waiting only for "focus is on some expected stop" cannot see a press that
     * has not applied yet, because the previous stop is expected too. Naming
     * the stop focus has to leave makes every tab provably one move.
     */
    const settledStop = async (stops: HTMLButtonElement[], previous?: HTMLButtonElement) => {
      const nameOf = (el: Element | null) =>
        el === null ? "nothing" : `stop#${stops.indexOf(el as HTMLButtonElement)}`;
      await waitFor(() => {
        const active = document.activeElement;
        if (!stops.includes(active as HTMLButtonElement)) {
          throw new Error(`focus is not on one of the popup's controls: ${nameOf(active)}`);
        }
        if (previous && active === previous) {
          throw new Error(`focus has not moved off ${nameOf(previous)} yet`);
        }
      });
      return document.activeElement as HTMLButtonElement;
    };

    const openFromTrigger = async () => {
      await userEvent.keyboard("{Enter}");
      const popup = await body.findByRole("dialog", { name: "Markers on the timeline" });
      return {
        popup,
        controls: Array.from(popup.querySelectorAll<HTMLButtonElement>("button:not([disabled])")),
      };
    };

    // 2. Leg one — open, walk the popup's two controls, leave by Escape.
    await expect(document.activeElement).toBe(trigger);
    const first = await openFromTrigger();

    // The second half of the reduced-motion fix — the popover's restated
    // `motion-reduce:data-*:animate-none` pair, read back on the frame a bare
    // class fails to reach. `ReducedMotion` pins the dialog's half.
    await expect(first.popup).toHaveAttribute("data-open");
    await expect(getComputedStyle(first.popup).animationName).toBe("none");

    await expect(first.controls.map((button) => button.dataset.slot)).toEqual([
      "feature-announcement-dismiss",
      "feature-announcement-cta",
    ]);

    // Focus entered on the ✕ — seed the walk from where it actually landed.
    const entered = await settledStop(first.controls);
    await expect(entered).toBe(first.controls[0]);
    await expect(entered.matches(":focus-visible")).toBe(true);
    await settledFocusRing(entered, waitFor);

    await userEvent.tab();
    const second = await settledStop(first.controls, entered);
    await expect(second).toBe(first.controls[1]);
    await expect(second.matches(":focus-visible")).toBe(true);
    await settledFocusRing(second, waitFor);

    // Escape: closed, dismissed once, focus back on the control the popup
    // pointed at. Wait for the popup to be gone rather than leaving axe a
    // surface mid-dismissal.
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("dialog")).toBeNull());
    await waitFor(() => expect(document.activeElement).toBe(trigger));
    await expect(dismissLog.textContent).toBe("timeline-markers");

    // 3. Leg two — the popup is not a trap. Tabbing off the last control moves
    //    focus back to the trigger and the popup closes behind it.
    //
    //    That close *also* emits `onDismiss(id)` a second time, which is the
    //    defect this story's description records: a Tab is navigation, not a
    //    decision, and it spends a dismissal the component promises never to
    //    re-show. Deliberately not asserted — the two assertions below are the
    //    part that is correct.
    const reopened = await openFromTrigger();
    const reentered = await settledStop(reopened.controls);
    await userEvent.tab();
    await settledStop(reopened.controls, reentered);
    await userEvent.tab();
    await waitFor(() => expect(document.activeElement).toBe(trigger));
    await waitFor(() => expect(body.queryByRole("dialog")).toBeNull());
  },
};

/**
 * The controlled pair, driven from outside, on the loudest level — where
 * getting it wrong means a dialog a host cannot keep open.
 *
 * `open` is held at `true` for the life of the story, so clicking the ✕ has to
 * report and change nothing:
 *
 * - `onOpenChange(false)` fires with the value a consumer would apply, and
 *   `onDismiss(id)` fires alongside it with the announcement's id — the pair a
 *   host needs to both close the surface and record *which* announcement went
 *   away. Two callbacks rather than one because they are two decisions: the
 *   modal and anchored levels route Escape, the backdrop and the ✕ through the
 *   same handler, so all three exits emit the same dismissal.
 * - The dialog stays open. Nothing inside the component moves the rendered
 *   value, which is what "controlled" has to mean and what an uncontrolled
 *   fallback would quietly break.
 * - Re-rendering with `open` unchanged holds it fixed. The button below bumps a
 *   counter so React re-renders the subtree with the same prop; a component
 *   that had latched internal state on the click would close on that pass.
 *
 * There is a **second** controlled pair in this API, and it is the one that
 * decides whether an announcement ever comes back: `dismissed` /
 * `onDismiss(id)`. The component writes nothing — no localStorage, no cookie,
 * no request — so a host that does not persist the id and feed `dismissed`
 * back in re-shows the announcement on the next load. `KeyboardOrder` exercises
 * that half; this story deliberately does not, so the `open` pair is proven on
 * its own.
 */
export const Controlled: Story = {
  args: {
    id: "agent-mode-launch",
    level: "modal",
    stage: "New",
    title: "Agent mode",
    description: "Hand the assistant a goal and it plans, runs, and reports back on its own.",
    ctaLabel: "Try agent mode",
    onCtaClick: () => {},
  },
  render: function Render(args) {
    const [log, setLog] = React.useState<string[]>([]);
    const [, forceRender] = React.useReducer((count: number) => count + 1, 0);
    return (
      <div className="flex flex-col items-start gap-3">
        <p data-testid="log">{log.join(" ") || "none"}</p>
        <button type="button" data-testid="rerender" onClick={forceRender}>
          Re-render with open unchanged
        </button>
        <FeatureAnnouncement
          {...args}
          open
          onOpenChange={(next) => setLog((current) => [...current, `openChange:${next}`])}
          onDismiss={(id) => setLog((current) => [...current, `dismiss:${id}`])}
        />
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const body = within(document.body);
    const dialog = await body.findByRole("dialog", { name: "Agent mode" });

    await userEvent.click(within(dialog).getByRole("button", { name: /^Dismiss announcement:/ }));

    // Both callbacks fired, with the payload a consumer needs to apply them.
    await waitFor(() =>
      expect(canvasElement.querySelector('[data-testid="log"]')).toHaveTextContent(
        "openChange:false dismiss:agent-mode-launch",
      ),
    );

    // …and the rendered value did not move. The dialog is still the one the
    // host asked for, not a replacement.
    await expect(body.getByRole("dialog", { name: "Agent mode" })).toBe(dialog);

    // A re-render with an unchanged `open` holds it there.
    await userEvent.click(canvasElement.querySelector<HTMLElement>('[data-testid="rerender"]')!);
    await expect(body.getByRole("dialog", { name: "Agent mode" })).toBe(dialog);
  },
};

/**
 * Everything optional emptied on the two quietest levels, which is where the
 * collapse is invisible rather than loud: `title=""`, `stage=""`, no
 * description, no CTA.
 *
 * What survives is a bare ✕ in a 46×32 pill, and a card whose header is an
 * empty line above a close button. Neither is an axe failure — measured clean
 * under this gate — and that is what makes it the bad case: the announcement
 * still occupies the page, still costs a click, and the only thing a screen
 * reader can read out is the dismiss control, whose name has collapsed to
 * `"Dismiss announcement: "`, colon and nothing after it. J4 `artifact-grid`'s
 * empty session label is the same shape from the other side — silent to the
 * gate, and worse for it.
 *
 * `stage=""` is the one that behaves: the badge is guarded on a truthy string,
 * so an empty stage renders no badge rather than an empty one. Asserted below,
 * because "no badge" and "an empty badge" look identical in a screenshot.
 *
 * **Three shapes are red gates and are therefore described rather than
 * rendered**, each measured once against axe 4.12 in this file's own harness:
 *
 * - `dismissLabel=""` — `aria-label` is set from `dismissLabel ?? default`, and
 *   `""` is not nullish, so it defeats the default and the ✕ becomes a button
 *   whose only child is an `aria-hidden` glyph. `button-name`.
 * - `anchorLabel=""` — the same mechanism on the `anchored` level's fallback
 *   trigger, which then renders a 22px button with no text. `button-name`.
 * - `title=""` on `modal` — the headline is the `DialogTitle`, so an empty one
 *   leaves the dialog with no accessible name. `aria-dialog-name`, plus a
 *   second violation on the empty title element itself.
 *
 * All three are the H7/J1 `label=""` class: a default parameter an empty string
 * walks straight past. A guard that rejected `""` as well as `undefined` would
 * fix the first two; the third wants a `title` the type can hold to being
 * non-empty, which it cannot express today.
 */
export const EmptyLabel: Story = {
  args: { id: "empty-title-chip", level: "dismissible-chip", title: "", stage: "" },
  render: (args) => (
    <div className="flex flex-col items-start gap-3">
      <FeatureAnnouncement {...args} onDismiss={() => {}} />
      <FeatureAnnouncement {...args} id="empty-title-card" level="inline-card" onDismiss={() => {}} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const chip = canvasElement.querySelector<HTMLElement>('[data-level="dismissible-chip"]')!;

    // Nothing readable is left in the chip but the control that removes it.
    await expect(chip.textContent?.trim()).toBe("");
    await expect(chip.querySelector('[data-slot="feature-announcement-stage"]')).toBeNull();

    const dismiss = chip.querySelector<HTMLElement>('[data-slot="feature-announcement-dismiss"]')!;
    await expect(dismiss.getAttribute("aria-label")).toBe("Dismiss announcement: ");

    // The pill is still a real object on the page — it has not collapsed to
    // nothing, which is what would make it easy to spot.
    const box = chip.getBoundingClientRect();
    await expect(`${Math.round(box.width)}x${Math.round(box.height)}`).toBe("46x32");

    // The card keeps its whole frame for an announcement with no content.
    const card = canvasElement.querySelector<HTMLElement>('[data-level="inline-card"]')!;
    await expect(card.textContent?.trim()).toBe("");
    await expect(card.getBoundingClientRect().height).toBeGreaterThan(40);
  },
};

/**
 * Author-supplied text at ~90 characters in both slots, on the two levels that
 * answer it differently — and the difference is the point, because those levels
 * are one prop apart.
 *
 * - **`inline-card` wraps.** The title runs to three lines (66px of text) and
 *   nothing is clipped; the card grows to 206px and keeps every word. That is
 *   the right answer for a surface sitting in the flow of a page.
 * - **`dismissible-chip` truncates, and hard.** It is `w-fit max-w-md`, so it
 *   stops at 448px and the two `truncate` spans share what is left after the
 *   badge, the CTA and the ✕: the title gets 150px of a 490px string, roughly
 *   its first four words. The description is clipped as well. Nothing
 *   overflows, which is what the chip is protecting.
 *
 * **The gap this leaves, recorded rather than pinned: there is no way to read
 * the rest.** The truncated span carries no `title` attribute and no tooltip,
 * so a chip whose headline runs past about twenty characters shows an ellipsis
 * and nothing else — `context-chips`' `max-w-40` label is the same shape,
 * already in `CONTINUE.md` §8. An escalation route exists in principle (a
 * headline this long is the signal to move up a level, and past the card to L4
 * `whats-new`), but nothing in the component says so, so the assertions measure
 * the clipping without claiming it is recoverable.
 */
export const LongContent: Story = {
  args: {
    id: "voice-library",
    stage: "Preview",
    title: "Shared voice library, now with per-workspace permissions and full audit history",
    description:
      "Voices you clone are available to everyone in the workspace, and every use is recorded against the person who made it.",
    ctaLabel: "Open the library",
    onCtaClick: () => {},
    onDismiss: () => {},
  },
  render: (args) => (
    <div className="flex flex-col items-start gap-4">
      <FeatureAnnouncement {...args} level="inline-card" />
      <FeatureAnnouncement {...args} id="export-limit-raised" level="dismissible-chip" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const card = canvasElement.querySelector<HTMLElement>('[data-level="inline-card"]')!;
    const cardTitle = card.querySelector<HTMLElement>('[data-slot="feature-announcement-title"]')!;

    // The card wraps: more than one line tall, nothing clipped sideways.
    await expect(cardTitle.getBoundingClientRect().height).toBeGreaterThan(40);
    await expect(`card title clipped=${cardTitle.scrollWidth > cardTitle.clientWidth}`).toBe(
      "card title clipped=false",
    );
    await expect(`card overflows=${card.scrollWidth > card.clientWidth}`).toBe("card overflows=false");

    const chip = canvasElement.querySelector<HTMLElement>('[data-level="dismissible-chip"]')!;
    const chipTitle = chip.querySelector<HTMLElement>('[data-slot="feature-announcement-title"]')!;
    const chipDescription = chip.querySelector<HTMLElement>(
      '[data-slot="feature-announcement-description"]',
    )!;

    // The chip truncates instead, and neither grows past its cap nor spills.
    await expect(`chip capped=${Math.round(chip.getBoundingClientRect().width) === 448}`).toBe(
      "chip capped=true",
    );
    await expect(`chip overflows=${chip.scrollWidth > chip.clientWidth}`).toBe("chip overflows=false");
    await expect(`chip title clipped=${chipTitle.scrollWidth > chipTitle.clientWidth}`).toBe(
      "chip title clipped=true",
    );
    await expect(
      `chip description clipped=${chipDescription.scrollWidth > chipDescription.clientWidth}`,
    ).toBe("chip description clipped=true");

    // How much is lost: under a third of the headline is on screen.
    await expect(`title shows under a third=${chipTitle.clientWidth < chipTitle.scrollWidth / 3}`).toBe(
      "title shows under a third=true",
    );
  },
};

/**
 * 375px, on the two levels that live in a page's flow. The modal and the
 * anchored popup portal to `document.body` and are sized against the viewport,
 * so a wrapper cannot constrain them and this story does not pretend to measure
 * them. (Measured with the modal open inside the frame below: the dialog is not
 * a descendant of the frame, renders 448px wide, and the gate's chromium
 * reports a 1200px viewport. At a real 375px it is the dialog's own
 * `max-w-[calc(100%-2rem)]` that would apply.)
 *
 * The card is `w-full max-w-md`, so it shrinks to the column and holds at 375.
 * The short chip is 330px and fits.
 *
 * **A defect this story found, recorded rather than pinned: a chip with a long
 * headline does not fit a phone.** The chip is `w-fit max-w-md` and its title
 * carries `truncate`, which sets `white-space: nowrap` — so its min-content
 * width is the whole untruncated string, and `fit-content` resolves to that
 * (capped at 448px) rather than to the 375px available. Measured in the frame
 * below: the third announcement renders 440px wide and the frame reports
 * `scrollWidth` 440 against `clientWidth` 375, which is 65px of sideways scroll
 * on the presentation whose entire job is to be the quiet, unobtrusive option.
 * The card above it, carrying a headline of similar length, sits at exactly
 * 375. The repair is a `max-w-full` or a `min-w-0`, and choosing which is a
 * layout decision, so that chip is rendered unasserted while the two that do
 * fit are pinned.
 */
export const Mobile: Story = {
  args: { onDismiss: () => {} },
  render: (args) => (
    <div data-testid="frame" className="flex w-[375px] max-w-full flex-col items-start gap-3">
      <FeatureAnnouncement
        {...args}
        id="voice-library"
        level="inline-card"
        stage="Preview"
        title="Shared voice library, now with per-workspace permissions"
        description="Voices you clone are now available to everyone in the workspace."
        ctaLabel="Open the library"
        onCtaClick={() => {}}
      />
      <FeatureAnnouncement
        {...args}
        id="export-limit-raised"
        level="dismissible-chip"
        stage="v2.4"
        title="Exports now run up to 4K"
        ctaLabel="Details"
        onCtaClick={() => {}}
      />
      <FeatureAnnouncement
        {...args}
        id="agent-mode-launch"
        level="dismissible-chip"
        stage="New"
        title="Agent mode plans, runs and reports back on its own"
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const card = canvasElement.querySelector<HTMLElement>('[data-level="inline-card"]')!;
    await expect(`card=${Math.round(card.getBoundingClientRect().width)}px`).toBe("card=375px");
    await expect(`card overflows=${card.scrollWidth > card.clientWidth}`).toBe("card overflows=false");

    const shortChip = canvasElement.querySelector<HTMLElement>(
      '[data-announcement-id="export-limit-raised"]',
    )!;
    await expect(`short chip fits=${shortChip.getBoundingClientRect().width <= 375}`).toBe(
      "short chip fits=true",
    );
    await expect(`short chip overflows=${shortChip.scrollWidth > shortChip.clientWidth}`).toBe(
      "short chip overflows=false",
    );
  },
};

/**
 * Why five presentations are one component, and where the component stops.
 *
 * **Inward.** `level` is not a style prop — it is how loud the news is, and the
 * four levels are one word apart so that downgrading a modal to a chip costs an
 * edit rather than a rewrite. The content props are identical across all four
 * (`title`, `description`, `stage`, `media`, `ctaLabel`); the dismissal
 * contract is identical (`onDismiss(id)`, whether it came from the ✕, Escape or
 * the backdrop); the dismiss control's accessible name is built the same way in
 * each. Split them into four components and the wrong escalation becomes the
 * cheap option, because changing your mind would mean changing your import. The
 * fifth presentation, `stage-badge`, is those same levels with a stage set — a
 * declared state rather than a `level`, because the badge is orthogonal to
 * loudness. The two rendered below are the quiet end of the ladder: the same
 * news twice, one prop apart.
 *
 * **Outward, inside family L.** Two neighbours are close enough to reach for by
 * mistake, and neither is rendered here because both are portals — an open
 * dialog marks everything outside itself inert, so a side-by-side would be
 * manufactured rather than shown.
 *
 * - **L2 `coach-mark`** is also a popover pointing at a control, and the rule
 *   is ordinal: a coach-mark is one step of a sequence, so `step`, `total` and
 *   `onSkip` are required props and a tour owns the index. This component's
 *   `anchored` level is self-contained — no counter, no next, nothing after it
 *   — and it says a control *exists* rather than teaching you to use it now.
 * - **L4 `whats-new`** is the escalation target in the other direction: when
 *   one announcement has more to say than a card can hold, the answer is a
 *   changelog with dates and per-entry unread state, not a louder `level`.
 *
 * **Outward, across families.** B5 `promo-card` is the ambient sibling and is
 * rendered below because it sits in the page flow. The short rule: a promo
 * sells a capability the user does not have yet; an announcement reports a
 * change that already happened. `PromoCard.stories.tsx`'s own `Boundary`
 * carries the full three-way rule against C5 `recommendation-card` as well, so
 * it is not restated here.
 */
export const Boundary: Story = {
  render: () => (
    <div className="flex w-full max-w-lg flex-col gap-6">
      <section className="flex flex-col items-start gap-2">
        <p className="text-xs font-medium text-foreground">
          Inline card — news worth reading in the flow of a surface
        </p>
        <FeatureAnnouncement
          id="voice-library"
          level="inline-card"
          stage="Preview"
          title="Shared voice library"
          description="Voices you clone are now available to everyone in the workspace."
          ctaLabel="Open the library"
          onCtaClick={() => {}}
          onDismiss={() => {}}
        />
      </section>

      <section className="flex flex-col items-start gap-2">
        <p className="text-xs font-medium text-foreground">
          Dismissible chip — the same news one level quieter
        </p>
        <FeatureAnnouncement
          id="voice-library-chip"
          level="dismissible-chip"
          stage="Preview"
          title="Shared voice library"
          ctaLabel="Open it"
          onCtaClick={() => {}}
          onDismiss={() => {}}
        />
      </section>

      <section className="flex flex-col items-start gap-2">
        <p className="text-xs font-medium text-foreground">
          Promo card — sells a capability you do not have yet
        </p>
        <PromoCard
          flavour="upgrade"
          title="Upgrade to Pro"
          description="Unlock unlimited generations and priority rendering."
          ctaLabel="Upgrade"
          onCtaClick={() => {}}
          onDismiss={() => {}}
        />
      </section>
    </div>
  ),
};
