import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";

import { ContextChip, ContextChips } from "@/registry/super-ai/context-chips";
import type { Slot } from "@/registry/super-ai/slot-summary";
import { SlotSummary } from "@/registry/super-ai/slot-summary";
import { StatReadout } from "@/registry/super-ai/stat-readout";
import { SlotSummaryDocs } from "@/content/components/slot-summary.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const meta: Meta<typeof SlotSummary> = {
  title: "Super AI/Slot Summary",
  component: SlotSummary,
  parameters: { layout: "centered", docs: { page: componentDocsPage(SlotSummaryDocs) } },
};

export default meta;
type Story = StoryObj<typeof SlotSummary>;

/**
 * The frame an assistant resolves before scheduling an outbound message. Every
 * story below is a variation on it, so the same four parameters can be read
 * across states.
 */
const FRAME: Slot[] = [
  { id: "recipient", label: "Recipient", value: "design-team (14 people)", source: "retrieved", required: true },
  { id: "message", label: "Message", value: "Standup moves to 10:00 from Monday", source: "stated", required: true },
  { id: "send-at", label: "Send at", value: "Tomorrow, 9:00 AM", source: "inferred" },
  { id: "channel", label: "Channel", value: "Email", source: "defaulted" },
];

/**
 * The frame as it normally arrives, with no handlers wired — every parameter
 * shows how it was filled, and nothing else. `stated` is deliberately the only
 * unmarked source: the rows carrying a badge are the ones the user did not
 * supply, so the badges are the audit list. Without `onCorrect`, `onConfirm`
 * or `onCancel` the component is a pure read-back and renders no footer.
 */
export const MixedProvenance: Story = {
  args: { slots: FRAME },
};

/**
 * A value the model resolved but is not sure of. Confidence is a band rather
 * than a number — the flag says look at this one, not "0.62" — and it rides on
 * the slot it doubts rather than on the summary as a whole.
 */
export const LowConfidenceFlagged: Story = {
  args: {
    slots: FRAME.map((slot) => (slot.id === "send-at" ? { ...slot, confidence: "low" as const } : slot)),
  },
};

/**
 * With `onCorrect` supplied, every row grows its own fix. The correction
 * resolves on the slot it corrects and never rewinds the conversation, which
 * is what separates this from re-prompting: the three rows that were already
 * right are not re-asked.
 */
export const Correctable: Story = {
  args: { slots: FRAME, onCorrect: () => {} },
};

/**
 * A required parameter the system could not fill. It stays on screen as a row
 * with an ask rather than vanishing from the list, the confirm action is held
 * closed while it is outstanding, and the count beside it says how many are
 * left. This is also the component's disabled-shaped state: `disabled` is
 * derived from the empty required slots and passed down to the confirm
 * button — there is no prop that overrides it.
 */
export const MissingRequired: Story = {
  args: {
    slots: [
      { id: "recipient", label: "Recipient", source: "retrieved", required: true },
      { id: "message", label: "Message", value: "Standup moves to 10:00 from Monday", source: "stated", required: true },
      { id: "send-at", label: "Send at", source: "inferred" },
      { id: "channel", label: "Channel", value: "Email", source: "defaulted" },
    ],
    onCorrect: () => {},
    confirmLabel: "Send to 14 people",
    onConfirm: () => {},
    onCancel: () => {},
  },
};

/**
 * Every required parameter is filled, so the action opens. The confirm label
 * names the consequence rather than saying "Confirm" — this is the last beat
 * before a side effect that reaches fourteen inboxes, and the button is where
 * the user finds out how far it reaches.
 */
export const ConfirmReady: Story = {
  args: {
    slots: FRAME,
    onCorrect: () => {},
    confirmLabel: "Send to 14 people",
    onConfirm: () => {},
    onCancel: () => {},
  },
};

/* -------------------------------------------------------------------------
 * Case stories — the situations this component meets in a product, as opposed
 * to the prop combinations above. See docs/design-system/story-conventions.md
 * for which of the eight apply and why the two missing here are missing.
 *
 * Not written for this component, deliberately:
 *
 * // case-skip: ReducedMotion — nothing in the tree animates
 * The component has no `animate-*` class, no transform and no keyframe: it is
 * a list of rows, two Badges and three Buttons. There is no motion branch to
 * suppress, so a reduced-motion story would render identically to
 * `ConfirmReady` and imply coverage it does not have.
 *
 * // case-skip: EmptyLabel — `label` is required, and the optional text slot already has a state
 * `Slot.label` is not optional in the type, so there is no no-label rendering
 * to document. The one optional text slot is `value`, and emptying it is not
 * an edge case here — it is `MissingRequired` above, a declared state with its
 * own ask, its own blocked action and its own count.
 * ---------------------------------------------------------------------- */

/**
 * Right-to-left. Direction is load-bearing in three places: the fixed-width
 * label column has to sit at the right edge, each source badge has to follow
 * its value on the logical side rather than the visual one, and the trailing
 * correction button has to land at the logical end of the row. The value span
 * truncates, so its ellipsis must also fall at the logical end.
 */
export const RTL: Story = {
  render: (args) => (
    <div dir="rtl" className="w-full">
      <SlotSummary {...args} />
    </div>
  ),
  args: {
    slots: FRAME.map((slot) => (slot.id === "send-at" ? { ...slot, confidence: "low" as const } : slot)),
    onCorrect: () => {},
    confirmLabel: "Send to 14 people",
    onConfirm: () => {},
    onCancel: () => {},
  },
};

/**
 * Tab traversal across a complete frame. Two facts are pinned here.
 *
 * The first is that every per-row control carries a distinct accessible name.
 * The buttons all read "Change" on screen, so without the row name in the
 * label a screen-reader user gets four identical stops and no way to tell
 * which parameter each one edits.
 *
 * The second is the traversal itself: nothing sets `tabindex`, so document
 * order is tab order — four row controls, then confirm, then cancel — and
 * every stop shows a visible ring. The loop is bounded by the expected stop
 * count rather than running until focus leaves the canvas, so a regression
 * that adds or removes a stop fails on the count instead of quietly changing
 * how many assertions ran.
 */
export const KeyboardOrder: Story = {
  args: {
    slots: FRAME,
    onCorrect: () => {},
    confirmLabel: "Send to 14 people",
    onConfirm: () => {},
    onCancel: () => {},
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const rowControls = canvas.getAllByRole("button", { name: /^Change / });
    await expect(rowControls).toHaveLength(4);

    const names = rowControls.map((button) => button.getAttribute("aria-label"));
    await expect(new Set(names).size).toBe(4);

    // Four row controls, then Confirm, then Cancel.
    const EXPECTED_STOPS = 6;
    const visited: HTMLElement[] = [];

    for (let i = 0; i < EXPECTED_STOPS; i++) {
      await userEvent.tab();
      const focused = document.activeElement as HTMLElement | null;
      if (!focused || !canvasElement.contains(focused)) break;
      visited.push(focused);

      await expect(focused.matches(":focus-visible")).toBe(true);
      const style = getComputedStyle(focused);
      await expect(style.boxShadow !== "none" || style.outlineStyle !== "none").toBe(true);
    }

    await expect(visited).toHaveLength(EXPECTED_STOPS);
    await expect(visited[0]).toBe(rowControls[0]);
    await expect(visited[EXPECTED_STOPS - 2].textContent).toContain("Send to 14 people");
    await expect(visited[EXPECTED_STOPS - 1].textContent).toContain("Cancel");
  },
};

/**
 * The controlled pair. `slots` in, `onCorrect(id)` out: the component keeps no
 * copy of any value, so clicking a correction control reports which parameter
 * the user wants to change and then does nothing visible until the caller
 * hands back a new `slots`. The play function pins that — it clicks a row,
 * checks the callback fired with that row's id, and checks the rendered value
 * did not move. A future refactor that made the component edit its own state
 * would still look identical in every screenshot and would break the contract
 * this whole surface rests on, which is that what you see is what the caller
 * believes.
 */
const correctedIds: string[] = [];

export const Controlled: Story = {
  args: {
    slots: FRAME,
    onCorrect: (id: string) => {
      correctedIds.push(id);
    },
    confirmLabel: "Send to 14 people",
    onConfirm: () => {},
    onCancel: () => {},
  },
  play: async ({ canvasElement }) => {
    correctedIds.length = 0;
    const canvas = within(canvasElement);

    const before = canvas.getByText("Tomorrow, 9:00 AM");
    await userEvent.click(canvas.getByRole("button", { name: "Change Send at" }));

    // The callback carries the payload a caller needs to apply the edit...
    await expect(correctedIds).toEqual(["send-at"]);

    // ...and re-rendering with an unchanged `slots` holds the row fixed: the
    // same node, with the same text, is still on screen.
    await expect(canvas.getByText("Tomorrow, 9:00 AM")).toBe(before);
  },
};

/**
 * A 90-character message, which is ordinary for this slot — a message body is
 * whatever the user dictated. The row's answer is truncation, not wrapping:
 * the label column is fixed at `w-32` and does not shrink, and the value span
 * is `truncate` inside a `min-w-0 flex-1` container, so a long value loses its
 * tail to an ellipsis while the source badge and the correction control keep
 * their positions. The full text is not recoverable from this surface, which
 * is the argument for the correction control being on the row rather than the
 * value being expandable.
 */
export const LongContent: Story = {
  args: {
    slots: FRAME.map((slot) =>
      slot.id === "message"
        ? {
            ...slot,
            value: "Standup moves to 10:00 from Monday, and the design review shifts to Thursday afternoon",
          }
        : slot,
    ),
    onCorrect: () => {},
    confirmLabel: "Send to 14 people",
    onConfirm: () => {},
    onCancel: () => {},
  },
};

/**
 * 375px. This is the width where the row layout is under real pressure: a
 * 128px label column that will not shrink, a value, a source badge and a
 * correction control all on one line. The value truncates rather than
 * wrapping the row, so the summary stays one parameter per line and the page
 * does not scroll sideways — but the amount of value actually legible on a
 * phone is short enough that the badge, not the text, is doing most of the
 * work here.
 */
export const Mobile: Story = {
  render: (args) => (
    <div className="w-[375px] max-w-full">
      <SlotSummary {...args} />
    </div>
  ),
  args: {
    slots: FRAME.map((slot) => (slot.id === "send-at" ? { ...slot, confidence: "low" as const } : slot)),
    onCorrect: () => {},
    confirmLabel: "Send to 14 people",
    onConfirm: () => {},
    onCancel: () => {},
  },
};

/**
 * Three surfaces that all render a stack of label/value rows and mean entirely
 * different things. The rule is about who is accountable for the value being
 * right:
 *
 * - **Slot summary** shows task state the *system* resolved. Every row needs a
 *   source mark, a correction affordance and a missing state, because the user
 *   is being asked to vouch for values they may not have supplied.
 * - **Context chips** point at references the *user* attached. There is
 *   nothing to audit — the user knows what they attached — so a chip carries a
 *   remove control instead of a correction control, and no provenance.
 * - **Stat readout** is read-only key/value metadata: seed, sampler,
 *   dimensions. Nobody is accountable because nothing is being decided. The
 *   moment a readout grows a source mark and an edit control, it has become a
 *   slot summary.
 *
 * If the rows have no provenance, it is not a slot summary. If there is no
 * action waiting on the values being right, it is a readout.
 */
export const Boundary: Story = {
  render: () => (
    <div className="flex w-full max-w-xl flex-col gap-6">
      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">Slot summary — what the system resolved, before it acts</p>
        <SlotSummary slots={FRAME} onCorrect={() => {}} confirmLabel="Send to 14 people" onConfirm={() => {}} />
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">Context chips — what the user attached</p>
        <ContextChips>
          <ContextChip kind="file" label="standup-notes.md" onRemove={() => {}} />
          <ContextChip kind="mention" label="design-team" onRemove={() => {}} />
        </ContextChips>
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">Stat readout — metadata nobody has to approve</p>
        <StatReadout
          items={[
            { label: "Model", value: "claude-sonnet-4-5" },
            { label: "Seed", value: "482913", copyable: true },
            { label: "Latency", value: "1.4s" },
          ]}
        />
      </section>
    </div>
  ),
};
