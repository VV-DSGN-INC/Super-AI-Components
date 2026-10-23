import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";

import { settledFocusRing } from "@/lib/focus-ring";
import { CaptureConsent } from "@/registry/super-ai/capture-consent";
import { RateLimitBanner } from "@/registry/super-ai/rate-limit-banner";
import { VoiceCloneRecorder } from "@/registry/super-ai/voice-clone-recorder";
import { CaptureConsentDocs } from "@/content/components/capture-consent.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const meta: Meta<typeof CaptureConsent> = {
  title: "Super AI/Capture Consent",
  component: CaptureConsent,
  parameters: { layout: "centered", docs: { page: componentDocsPage(CaptureConsentDocs) } },
};

export default meta;
type Story = StoryObj<typeof CaptureConsent>;

const PEOPLE = ["Priya", "Marcus", "Dana"];

/**
 * The gate. Before anything records, the surface names who will be told, and
 * the two choices are separate switches that both start off. Start capture is
 * genuinely `disabled` until the record switch is on; sharing never unlocks it.
 *
 * `onStartCapture` is handed to this step and to nothing else in the
 * component, so a consumer who wires only the happy-path callbacks cannot reach
 * it from `recording` or from the compact chip. The play function walks the
 * gate: disabled, sharing alone does not arm it, recording does, and the
 * callback carries the sharing choice.
 */
export const PreNotice: Story = {
  args: { state: "pre-notice", form: "bar", participants: PEOPLE, onStartCapture: fn() },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const start = canvas.getByRole("button", { name: "Start capture" });
    await expect(start).toBeDisabled();
    await userEvent.click(canvas.getByRole("switch", { name: "Share notes with participants" }));
    await expect(start).toBeDisabled();
    await userEvent.click(canvas.getByRole("switch", { name: "Record this session" }));
    await expect(start).toBeEnabled();
    await userEvent.click(start);
    await expect(args.onStartCapture).toHaveBeenCalledTimes(1);
    await expect(args.onStartCapture).toHaveBeenCalledWith(expect.objectContaining({ sharing: true }));
  },
};

/**
 * Capture is on. The indicator is a persistent `role="status"`, not a toast: it
 * has no dismiss control and no timer, and the polite announcement
 * ("Recording started") comes from the same element that stays on screen.
 *
 * Sharing is its own switch here as well, controlled by the caller, and
 * stopping is the one control the bar form adds. The elapsed time is visible
 * text outside the live region, so it does not announce every second.
 */
export const Recording: Story = {
  args: {
    state: "recording",
    form: "bar",
    elapsedLabel: "12:04",
    sharing: false,
    onSharingChange: fn(),
    onStopCapture: fn(),
  },
};

/**
 * The notice reached the other people. Same indicator, one added line that says
 * who was told, because the initiator needs to know the consent step is not
 * only theirs.
 */
export const OthersNotified: Story = {
  args: {
    state: "others-notified",
    form: "bar",
    participants: PEOPLE,
    elapsedLabel: "12:04",
    sharing: true,
    onSharingChange: fn(),
    onStopCapture: fn(),
  },
};

/**
 * A participant opted out, and the initiator is told what that costs them
 * rather than only that it happened. No control is offered: the decline is not
 * the initiator's to override, so the state has nothing to click.
 */
export const Declined: Story = {
  args: {
    state: "declined",
    form: "bar",
    declinedBy: ["Marcus"],
    consequence: "Notes for this call stay off. You can still take your own.",
  },
};

/**
 * Capture stopped, and the surface says what is kept and what is deleted. The
 * two lines are props because the component cannot know a product's retention;
 * pass both, or the state says nothing about what happened to the capture.
 */
export const Ended: Story = {
  args: {
    state: "ended",
    form: "bar",
    kept: "Summary and action items",
    deleted: "Audio and transcript",
  },
};

/**
 * The `compact` form, as a topbar's privacy slot renders it: a passive chip
 * whose text carries the state. A chip cannot carry the notice or hold
 * switches, so it has no controls at all and no way to start or stop capture;
 * those stay on the `bar` form.
 */
export const Compact: Story = {
  args: { state: "recording", form: "compact" },
  render: (args) => (
    <div className="border-border flex w-[360px] max-w-full items-center justify-between rounded-lg border px-3 py-2">
      <span className="text-foreground text-sm font-medium">Weekly sync</span>
      <CaptureConsent {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("status")).toHaveTextContent("Recording started");
    await expect(canvas.queryByRole("button")).toBeNull();
  },
};

/* -------------------------------------------------------------------------
 * Case stories — see docs/design-system/story-conventions.md.
 *
 * // case-skip: EmptyLabel — no text slot is optional in a way that can leave a control unlabeled; `participants` falls back to "the other participants" and every switch and button carries fixed text (grep `aria-label` and `sr-only` in capture-consent.tsx: only the group label and the "started" suffix)
 * ---------------------------------------------------------------------- */

/**
 * Right-to-left, in the pre-notice, the state with real inline layout: each
 * switch row is a label and a control split by `justify-between`, and the
 * status line leads with an icon. The play function measures resolved
 * geometry: the label is rightmost and its switch sits at the left, and the
 * status icon leads on the right.
 */
export const RTL: Story = {
  args: { state: "pre-notice", form: "bar", participants: PEOPLE },
  render: (args) => (
    <div dir="rtl">
      <CaptureConsent {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="capture-consent"]')!;
    await expect(getComputedStyle(root).direction).toBe("rtl");
    const record = within(root).getByRole("switch", { name: "Record this session" });
    const label = within(root).getByText("Record this session");
    await expect(record.getBoundingClientRect().left < label.getBoundingClientRect().left).toBe(true);
    const status = root.querySelector<HTMLElement>('[data-slot="capture-consent-status"]')!;
    const icon = status.parentElement!.querySelector("svg")!;
    await expect(icon.getBoundingClientRect().left > status.getBoundingClientRect().left).toBe(true);
  },
};

/**
 * The switches are the only things in this component that move. The vendored
 * `Switch` slides its thumb with `transition-transform` and carries
 * `transition-all` on the track, with no reduced-motion branch of its own, so
 * the component restates `motion-reduce:transition-none` on the root and on the
 * thumb through a descendant selector. The play function reads the computed
 * `transition-property` of both back, rather than trusting the class, and the
 * run emulates `prefers-reduced-motion: reduce`.
 *
 * Nothing else animates: the recording indicator is a static icon and text,
 * never a pulse.
 */
export const ReducedMotion: Story = {
  args: { state: "pre-notice", form: "bar", participants: PEOPLE },
  play: async ({ canvasElement }) => {
    const record = within(canvasElement).getByRole("switch", { name: "Record this session" });
    const thumb = record.querySelector<HTMLElement>('[data-slot="switch-thumb"]')!;
    await expect(getComputedStyle(record).transitionProperty).toBe("none");
    await expect(getComputedStyle(thumb).transitionProperty).toBe("none");
  },
};

/**
 * Tab order of the pre-notice: record switch, share switch, then Start capture
 * only once it is armed. The first lap skips Start because it is a genuinely
 * disabled button; the second, after the record switch is on, walks all three
 * as exactly one cycle. Every stop is `:focus-visible` and paints a settled
 * ring.
 */
export const KeyboardOrder: Story = {
  args: { state: "pre-notice", form: "bar", participants: PEOPLE },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const record = canvas.getByRole("switch", { name: "Record this session" });
    const share = canvas.getByRole("switch", { name: "Share notes with participants" });
    const start = canvas.getByRole("button", { name: "Start capture" });

    await userEvent.tab();
    await waitFor(() => expect(document.activeElement).toBe(record));
    await expect(record.matches(":focus-visible")).toBe(true);
    await settledFocusRing(record, waitFor);

    await userEvent.tab();
    await waitFor(() => expect(document.activeElement).toBe(share));
    await settledFocusRing(share, waitFor);

    // Disabled Start is not a stop: the next tab leaves the component.
    await userEvent.tab();
    await waitFor(() => expect(document.activeElement).not.toBe(share));
    await expect(document.activeElement).not.toBe(start);

    await userEvent.click(record);
    await expect(start).toBeEnabled();
    record.focus();
    await userEvent.tab();
    await waitFor(() => expect(document.activeElement).toBe(share));
    await userEvent.tab();
    await waitFor(() => expect(document.activeElement).toBe(start));
    await expect(start.matches(":focus-visible")).toBe(true);
    await settledFocusRing(start, waitFor);
  },
};

/**
 * Sharing is a controlled pair while capturing: `sharing` and
 * `onSharingChange`. Interaction alone does not move the switch; the change
 * callback fires with the next value, and the switch follows only when the
 * caller re-renders with it. The play function pins both halves, then checks
 * that a re-render with an unchanged value holds the switch fixed.
 */
export const Controlled: Story = {
  args: { state: "recording", form: "bar", sharing: false, onSharingChange: fn() },
  play: async ({ canvasElement, args }) => {
    const share = within(canvasElement).getByRole("switch", { name: "Share notes with participants" });
    await expect(share).not.toBeChecked();
    await userEvent.click(share);
    await expect(args.onSharingChange).toHaveBeenCalledWith(true);
    await expect(share).not.toBeChecked();
  },
};

/**
 * Author-supplied text is the participant list, the consequence and the kept
 * and deleted lines. Long names and a ninety-character consequence wrap inside
 * the card instead of widening it; nothing truncates, because a notice that
 * cuts off who was told defeats its purpose.
 */
export const LongContent: Story = {
  args: {
    state: "declined",
    form: "bar",
    declinedBy: ["Alexandra Konstantinopoulou-Whitfield", "Maximilian Oyelaran-Fitzgerald"],
    consequence:
      "Notes for this call stay off, and the transcript that was already captured is deleted for everyone.",
  },
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="capture-consent"]')!;
    const text = canvasElement.querySelector<HTMLElement>('[data-slot="capture-consent-declined"]')!;
    await expect(text.getBoundingClientRect().right <= root.getBoundingClientRect().right).toBe(true);
    await expect(text.getBoundingClientRect().height > 40).toBe(true);
  },
};

/**
 * 375px, pre-notice with three names. This wrapper constrains width, not the
 * breakpoint, and the component has no breakpoint variants, so the claim is the
 * simple one: the card and its switch rows stay inside the frame.
 */
export const Mobile: Story = {
  args: { state: "pre-notice", form: "bar", participants: ["Priya Raman", "Marcus Hale", "Dana Okafor"] },
  render: (args) => (
    <div data-testid="frame" className="w-[375px] max-w-full">
      <CaptureConsent {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const frame = within(canvasElement).getByTestId("frame");
    const card = canvasElement.querySelector<HTMLElement>('[data-slot="alert"]')!;
    await expect(card.getBoundingClientRect().right <= frame.getBoundingClientRect().right + 1).toBe(true);
    await expect(frame.getBoundingClientRect().width).toBeLessThanOrEqual(375);
  },
};

/**
 * The choosing rule, beside the neighbours that render inline.
 *
 * - Capture-consent: a session records over time and has other people in it.
 *   It starts behind a notice and stays on screen until it stops.
 * - Voice-clone-recorder: one person's voice sample, with a consent gate for
 *   the clone itself. Likeness and voice stay there.
 * - Rate-limit-banner: a banner that counts down and clears when the wait
 *   ends. Capture-consent never auto-dismisses while recording is on.
 * - Permission-prompt (an agent asks before one side effect) and trust-dialog
 *   (confirm running third-party content) are modal dialogs, so they are named
 *   here rather than rendered over this story.
 */
export const Boundary: Story = {
  render: () => (
    <div className="flex w-full max-w-md flex-col gap-6">
      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">
          Capture consent: a session records and other people are in it
        </p>
        <CaptureConsent form="bar" state="recording" elapsedLabel="12:04" />
      </section>
      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">
          Voice clone recorder: one person&apos;s voice becomes a model
        </p>
        <VoiceCloneRecorder script="The quick brown fox jumps over the lazy dog." state="prompt-script" />
      </section>
      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">
          Rate limit banner: a wait that counts down and clears
        </p>
        <RateLimitBanner cause="your-limit" resource="Image generations" remainingSeconds={420} />
      </section>
    </div>
  ),
};
