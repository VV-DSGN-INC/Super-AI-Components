import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";

import { EscalationHandoff, type EscalationPacket } from "@/registry/super-ai/escalation-handoff";
import { SafetyBlock } from "@/registry/super-ai/safety-block";
import { EscalationHandoffDocs } from "@/content/components/escalation-handoff.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const meta: Meta<typeof EscalationHandoff> = {
  title: "Super AI/Escalation Handoff",
  component: EscalationHandoff,
  parameters: { layout: "centered", docs: { page: componentDocsPage(EscalationHandoffDocs) } },
};

export default meta;
type Story = StoryObj<typeof EscalationHandoff>;

/**
 * One packet, reused across the state stories so the difference between them
 * is the state and nothing else. This is the shape the spec calls the
 * deliverable: summary, the resolved frame, what was already tried, and the
 * specific ask.
 */
const deliveryPacket: EscalationPacket = {
  summary: "The customer needs the delivery address changed on an order that has already left the warehouse.",
  slots: [
    { label: "Order", value: "4417-B" },
    { label: "Status", value: "In transit" },
    { label: "New address", value: "14 Bridge St, Leeds" },
    { label: "Dispatched", value: "12 Aug" },
  ],
  attempted: [
    "Checked whether the order was still editable — it left the warehouse on 12 Aug, so it is not.",
    "Looked for a courier redirect — not offered on this service after dispatch.",
  ],
  request: "Can someone with courier access try a redirect, or authorise a reship to the new address?",
};

/* -------------------------------------------------------------------------
 * Declared states.
 *
 * The manifest's `states` for N11 are a broken parse of one catalog cell:
 * "triggered (user · budget-exhausted · low-confidence · policy)" arrived as
 * four separate entries. Those four are the `trigger` prop — an axis, not
 * states — and `triggered` is the same situation the component ships as
 * `preview`. The real `EscalationState` union has four members, and there is
 * one story below for each. The four trigger strings are rendered across
 * them rather than in a grid of their own, because a trigger is a reason
 * attached to a state, not a state.
 * ---------------------------------------------------------------------- */

/**
 * The default state, and the one the spec argues is the component: the packet
 * is on screen *before* anything is sent. The user is the only one who knows
 * whether the summary is right, and it is their conversation being forwarded,
 * so this doubles as the privacy control. `budget-exhausted` is the trigger
 * here — the agent has been round this loop enough times to stop.
 */
export const PacketPreview: Story = {
  args: {
    trigger: "budget-exhausted",
    state: "preview",
    packet: deliveryPacket,
    onSend: () => {},
    onEditPacket: () => {},
    onCancel: () => {},
  },
};

/**
 * Sent, waiting. The loading-shaped state: an escalation has an async
 * lifecycle and this is its pending half. The wait estimate is the only new
 * information the state carries, and the footer is gone — a queued handoff
 * has no actions, which is itself worth seeing (see the docs page's pitfall
 * about `onCancel` disappearing here).
 */
export const Queued: Story = {
  args: {
    trigger: "user",
    state: "queued",
    packet: deliveryPacket,
    wait: "About 4 minutes.",
  },
};

/**
 * The same `queued` state with `wait` omitted — not a fifth state, a branch
 * inside this one. The component prints "We don't have a wait time yet."
 * rather than rendering nothing or inventing a number, which is the spec's
 * honesty rule applied to the case where the queue depth genuinely is not
 * known. This string renders nowhere else in the repo.
 */
export const QueuedWaitUnknown: Story = {
  args: {
    trigger: "low-confidence",
    state: "queued",
    packet: deliveryPacket,
  },
};

/**
 * A person picked it up. The only state that changes the card title — it
 * flips from "Handing this to a person" to "Someone's with you" — and, like
 * `queued`, it renders no footer.
 *
 * What it does *not* model is the return path the spec asks for: there is no
 * prop for resuming the conversation with state intact or closing it
 * explicitly. `accepted` is where this component stops and the host takes
 * over. Recorded rather than faked.
 */
export const Accepted: Story = {
  args: {
    trigger: "user",
    state: "accepted",
    packet: deliveryPacket,
  },
};

/**
 * The failure-shaped state, and the one the spec makes mandatory: nobody is
 * on. No fake "connecting you" at 3 a.m. — it states the closed door, gives
 * the window people are back, and offers the asynchronous path instead. The
 * footer returns here, but with a different primary action.
 */
export const Unavailable: Story = {
  args: {
    trigger: "policy",
    state: "unavailable",
    packet: deliveryPacket,
    availability: "The team is back at 9am on Monday.",
    onLeaveMessage: () => {},
    onEditPacket: () => {},
    onCancel: () => {},
  },
};

/* -------------------------------------------------------------------------
 * Case stories — the situations this component meets in a product, as
 * opposed to the prop combinations above. See
 * docs/design-system/story-conventions.md.
 *
 * Not written for this component, deliberately:
 *
 * // case-skip: ReducedMotion — nothing in the tree animates
 * There is no `animate-*` class, transform or keyframe anywhere in
 * `escalation-handoff`, `section-header` or `stat-readout`. The only motion
 * in the rendered tree is the vendored Button's `transition-all` and its
 * `active:translate-y-px`, neither authored here and neither branching on
 * the media feature. Because `vitest.config.ts` already runs every test at
 * `reducedMotion: "reduce"`, a ReducedMotion story would render pixel-identical
 * to `PacketPreview` and imply a branch that does not exist.
 * ---------------------------------------------------------------------- */

/**
 * Right-to-left. The card's own layout mirrors correctly — the header icon
 * leads from the right, the footer buttons reverse, and `stat-readout`'s
 * label/value pairs flip — because all of it is flex and logical properties.
 *
 * **Recorded gap:** the "Already tried" bullets use `lucide-react`'s
 * `ArrowRight`, which still points right (→) under `dir="rtl"`, against the
 * reading direction. It is a marker, so nothing is unusable and axe is
 * silent, but the convention's RTL rule asks for arrows to mirror.
 *
 * It is not fixed here, and the reason is not that this retrofit leaves
 * registry sources alone — it does change them where a fix is mechanical.
 * The reason is that no sanctioned fix exists yet: `rtl:` appears nowhere in
 * `registry/super-ai` today, so `rtl:-scale-x-100` would be this system's
 * first direction-aware idiom, and it is the same open decision as the
 * physical-versus-logical properties several neighbours are waiting on
 * (`CONTINUE.md` §8). Adopting it in one icon, in one component, would set
 * the convention by accident. No assertion below claims the arrow mirrors.
 */
export const RTL: Story = {
  render: (args) => (
    <div dir="rtl" className="w-full">
      <EscalationHandoff {...args} />
    </div>
  ),
  args: {
    trigger: "budget-exhausted",
    state: "preview",
    packet: deliveryPacket,
    onSend: () => {},
    onEditPacket: () => {},
    onCancel: () => {},
  },
};

/**
 * Tab traversal across the footer. Three actions, in DOM order, and the
 * load-bearing fact is the last one: this card does **not** trap focus.
 * It is a card in the transcript, not a dialog — unlike `permission-prompt`,
 * its nearest interactive neighbour, which is a real modal and does trap.
 * A future refactor that wrapped this in a focus scope would look identical
 * and would silently strand keyboard users in a card they cannot leave.
 *
 * The ring loop is bounded by the expected stop count rather than run until
 * focus escapes, so a regression that *did* introduce a trap fails on the
 * final assertion instead of hanging the run.
 */
export const KeyboardOrder: Story = {
  args: {
    trigger: "budget-exhausted",
    state: "preview",
    packet: deliveryPacket,
    onSend: () => {},
    onEditPacket: () => {},
    onCancel: () => {},
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const buttons = canvas.getAllByRole("button");
    await expect(buttons).toHaveLength(3);
    await expect(buttons[0]).toHaveAccessibleName("Send to a person");
    await expect(buttons[1]).toHaveAccessibleName("Edit what's shared");
    await expect(buttons[2]).toHaveAccessibleName("Keep trying here");

    // Bounded by the known stop count — see the description. Every stop must
    // be visibly focused, which is the KeyboardOrder must-show.
    for (const expected of buttons) {
      await userEvent.tab();
      const focused = document.activeElement as HTMLElement;
      await expect(focused).toBe(expected);
      await expect(focused.matches(":focus-visible")).toBe(true);
      const style = getComputedStyle(focused);
      await expect(style.boxShadow !== "none" || style.outlineStyle !== "none").toBe(true);
    }

    // One more tab leaves the card entirely. This is the no-trap assertion.
    await userEvent.tab();
    await expect(buttons).not.toContain(document.activeElement);
  },
};

const onSendSpy = fn();

/**
 * The controlled pair. `state` is host-owned and the component holds no state
 * of its own — there is no `useState` anywhere in the file — so pressing
 * "Send to a person" reports the intent and changes nothing on screen. The
 * host advances `state` to `queued`, or the card sits in `preview` forever.
 *
 * Worth knowing: `onSend` carries no payload, deliberately. The host already
 * owns the packet it passed in, so there is nothing for the component to hand
 * back; the callback is a signal, not a value. That is why the assertion
 * below checks the *rendered* state rather than a callback argument.
 */
export const Controlled: Story = {
  args: {
    trigger: "budget-exhausted",
    state: "preview",
    packet: deliveryPacket,
    onSend: onSendSpy,
    onEditPacket: () => {},
  },
  play: async ({ canvasElement }) => {
    onSendSpy.mockClear();
    const canvas = within(canvasElement);
    const card = canvasElement.querySelector('[data-slot="escalation-handoff"]');

    await expect(card).toHaveAttribute("data-state", "preview");

    const send = canvas.getByRole("button", { name: "Send to a person" });
    await userEvent.click(send);

    // The callback fires…
    await expect(onSendSpy).toHaveBeenCalledTimes(1);
    // …and interaction alone does not move the rendered value.
    await expect(card).toHaveAttribute("data-state", "preview");

    // Re-rendering with an unchanged `state` holds it fixed.
    await userEvent.click(send);
    await expect(onSendSpy).toHaveBeenCalledTimes(2);
    await expect(card).toHaveAttribute("data-state", "preview");
  },
};

/**
 * The floor of the packet: `summary` is the only required field, so this is
 * what a handoff looks like when `slots`, `attempted` and `request` are all
 * absent. Two things show up only here. The "What they'll see" heading still
 * renders, so the section never collapses to a bare sentence. And the missing
 * `request` is the spec's own anti-pattern made visible — an escalation with
 * no ask is a forward, and the receiving human is left to infer what they are
 * being asked to do.
 */
export const EmptyLabel: Story = {
  args: {
    trigger: "low-confidence",
    state: "preview",
    packet: {
      summary: "The customer is asking for a refund on an order I cannot verify was delivered.",
    },
    onSend: () => {},
    onCancel: () => {},
  },
};

/**
 * Author-supplied text at length. Every text slot here is a model-written
 * string, so none of it has a length bound. The card's answer is to wrap:
 * the summary, the ask and each "Already tried" line are plain paragraphs and
 * list items in a fixed-width card, so long content grows the card downward
 * and never truncates or scrolls. Nothing is hidden — the failure mode is a
 * tall card, not a lost sentence.
 */
export const LongContent: Story = {
  args: {
    trigger: "policy",
    state: "preview",
    packet: {
      summary:
        "The customer was charged twice for the same annual renewal and is asking for the duplicate payment to be refunded to the original card.",
      slots: [
        { label: "Order", value: "4417-B" },
        { label: "Charged", value: "2 × 11 Aug" },
      ],
      attempted: [
        "Confirmed both charges are on the same subscription and the same card, taken four minutes apart on 11 Aug.",
      ],
      request:
        "Can someone with refund permissions reverse the second charge and confirm the renewal date has not moved as a result?",
    },
    onSend: () => {},
    onEditPacket: () => {},
    onCancel: () => {},
  },
};

/**
 * 375px. The card is the full column width on a phone and everything in it
 * is a single column already, with one exception: `stat-readout` defaults to
 * two columns, so the resolved frame stays two-up at this width and its
 * values wrap inside their cells rather than the grid dropping to one column.
 * The footer's three buttons are the tightest row — they stay on one line at
 * 375px, and a fourth action would be the thing that breaks it.
 */
export const Mobile: Story = {
  render: (args) => (
    <div className="w-[375px] max-w-full">
      <EscalationHandoff {...args} />
    </div>
  ),
  args: {
    trigger: "budget-exhausted",
    state: "preview",
    packet: deliveryPacket,
    onSend: () => {},
    onEditPacket: () => {},
    onCancel: () => {},
  },
};

/**
 * Beside its nearest twin. Three components in this catalog render "the agent
 * stopped", and they look alike enough to be picked wrongly. The rule is
 * **who unblocks it**:
 *
 * - **Escalation handoff** — another *human* unblocks it. The work continues,
 *   somewhere else, and the packet is what travels.
 * - **Safety block** (N10) — *nobody* unblocks it here. The request or the
 *   answer was stopped by policy; there is no queue and no wait, and offering
 *   one would be a lie.
 * - **Permission prompt** (N8) — the *user* unblocks it, by saying yes. It is
 *   a modal that traps focus, which is why it is described here rather than
 *   rendered beside these two.
 *
 * The trap is the `policy` trigger, shown here: a policy-triggered escalation
 * and a policy safety block start from the same event. Use the handoff when a
 * person can still act on it, and the block when the answer is no.
 */
export const Boundary: Story = {
  render: () => (
    <div className="flex w-full max-w-lg flex-col gap-6">
      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">Escalation handoff — a person takes it from here</p>
        <EscalationHandoff
          trigger="policy"
          state="preview"
          packet={{
            summary: "The customer is asking to close the account and delete their order history.",
            attempted: ["Confirmed the account is theirs and that both requests are in scope."],
            request: "Can someone authorised to action a deletion take this one?",
          }}
          onSend={() => {}}
          onCancel={() => {}}
        />
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">Safety block — the answer is no</p>
        <SafetyBlock
          variant="input-blocked"
          policy="Card numbers cannot be shared in chat."
          alternatives="Update the card from the billing page instead."
        />
      </section>
    </div>
  ),
};
