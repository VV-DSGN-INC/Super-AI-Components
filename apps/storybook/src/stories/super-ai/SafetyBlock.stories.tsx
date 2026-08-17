import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";

import { EscalationHandoff } from "@/registry/super-ai/escalation-handoff";
import { SafetyBlock } from "@/registry/super-ai/safety-block";
import { SafetyBlockDocs } from "@/content/components/safety-block.docs";
import { componentDocsPage } from "@/lib/component-docs-page";
import { expectPerceptibleFocus } from "@/lib/focus-treatment";

const meta: Meta<typeof SafetyBlock> = {
  title: "Super AI/Safety Block",
  component: SafetyBlock,
  parameters: { layout: "centered", docs: { page: componentDocsPage(SafetyBlockDocs) } },
};

export default meta;
type Story = StoryObj<typeof SafetyBlock>;

/**
 * The request never left. `alternatives` is present here and in every other
 * state below, because the spec makes the compliant path mandatory even
 * though the prop is optional in the type.
 */
export const InputBlocked: Story = {
  args: {
    variant: "input-blocked",
    policy: "Clinical advice boundary",
    alternatives: "Clinical questions go to the medical information team.",
  },
};

/**
 * The request ran and the answer is being withheld. Same component, different
 * event: the user cannot fix this one by rewriting the prompt, so the copy
 * does not ask them to.
 */
export const OutputBlocked: Story = {
  args: {
    variant: "output-blocked",
    policy: "Member data — minimum necessary",
    alternatives: "Request access in the member records system.",
  },
};

/**
 * The triggering span, quoted. This is the state that turns a block from a
 * verdict into something actionable — the user can see which words did it.
 */
export const FragmentQuoted: Story = {
  args: {
    variant: "input-blocked",
    policy: "Clinical advice boundary",
    fragment: "what dosage should this patient take",
    alternatives: "Clinical questions go to the medical information team.",
  },
};

/**
 * The same quote, blurred until asked for. Reveal is intent — a button press,
 * never hover — because the whole point is that this text should not be
 * sitting on screen by default.
 */
export const SensitiveFragmentBlurred: Story = {
  args: {
    variant: "output-blocked",
    policy: "Member data — minimum necessary",
    fragment: "member MBR-000-0000",
    sensitive: true,
    alternatives: "Request access in the member records system.",
  },
};

/* -------------------------------------------------------------------------
 * Case stories — the situations this component meets in a product, as
 * opposed to the prop combinations above. See
 * docs/design-system/story-conventions.md for which of the eight apply and
 * why the two that are missing here are missing.
 *
 * Not written for this component, deliberately:
 *
 * // case-skip: ReducedMotion — nothing in the tree animates
 * The root is an Alert, the reveal is a state swap and the blur is a static
 * `blur-xs` filter. There is no transition, transform or keyframe anywhere in
 * the tree, so there is no reduced-motion branch to document — a story here
 * would render identically to `SensitiveFragmentBlurred` and imply coverage
 * that does not exist.
 *
 * // case-skip: Controlled — no value/onChange pair exists; the reveal is internal state
 * The only thing that moves is `revealed`, a `React.useState` with no `revealed`
 * prop and no `onReveal` callback anywhere in `SafetyBlockProps`. There is no
 * controlled pair to drive from outside and nothing for a parent to hold, so
 * the story the convention describes cannot be written. That this reveal is
 * unliftable and unloggable is a real gap rather than a design choice, and it
 * is recorded in the docs module's pitfalls.
 * ---------------------------------------------------------------------- */

/**
 * Right-to-left, and it surfaces two defects that are recorded rather than
 * fixed here.
 *
 * The quote rail stays on the **left** of the fragment: `safety-block.tsx`
 * spaces it with `border-l-2 pl-2`, which are physical properties and do not
 * flip. The body text also stays left-aligned, because the vendored Alert
 * base sets `text-left` rather than `text-start`.
 *
 * Neither is fixed in this retrofit. The correction is `border-s-2 ps-2` and
 * `text-start`, and logical properties appear **nowhere** in
 * `registry/super-ai` today — introducing the first ones is a system-wide
 * convention decision, and the `text-left` half lives in a vendored primitive
 * shared by every Alert consumer. Both are out of scope for a one-class
 * mechanical fix, so this story renders the flaw honestly instead of
 * asserting it away.
 */
export const RTL: Story = {
  render: (args) => (
    <div dir="rtl" className="w-full max-w-md">
      <SafetyBlock {...args} />
    </div>
  ),
  args: {
    variant: "input-blocked",
    policy: "Clinical advice boundary",
    fragment: "what dosage should this patient take",
    alternatives: "Clinical questions go to the medical information team.",
  },
};

/**
 * The keyboard path through a block that is hiding something. There is
 * exactly one tab stop — the reveal control — because `alternatives` here is
 * prose rather than a link, so every focusable in the tree belongs to the
 * component itself.
 *
 * The loop is bounded by that expected count rather than run until focus
 * escapes the canvas. The component does not trap focus, so an unbounded loop
 * would also terminate; bounding it makes the count itself an assertion, so a
 * refactor that quietly adds a second focusable fails here instead of passing
 * silently.
 *
 * **Recorded defect, deliberately not asserted:** activating the reveal
 * unmounts the button, and nothing moves focus onto the revealed quote, so
 * focus falls back to `document.body` and a keyboard reader loses their
 * place. Pinning that with a passing assertion would make the bug look
 * intended, so the play function stops at the ring check and the defect is
 * reported instead.
 */
export const KeyboardOrder: Story = {
  args: {
    variant: "output-blocked",
    policy: "Member data — minimum necessary",
    fragment: "member MBR-000-0000",
    sensitive: true,
    alternatives: "Request access in the member records system.",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // role="note", not role="alert": a refusal is not urgent, and an
    // assertive live region would interrupt a screen-reader user mid-sentence
    // every time a policy fires.
    await expect(canvas.getByRole("note")).toBeInTheDocument();

    const stops = canvas.getAllByRole("button");
    await expect(stops).toHaveLength(1);
    await expect(stops[0]).toHaveAccessibleName("Show blocked text");

    // The blocked text is hidden from assistive tech, not merely blurred, so
    // the visual and the accessibility tree agree while it is unrevealed.
    await expect(canvas.getByText("member MBR-000-0000")).toHaveAttribute("aria-hidden", "true");

    for (let i = 0; i < stops.length; i++) {
      await userEvent.tab();
      const focused = document.activeElement as HTMLElement;
      await expect(canvasElement.contains(focused)).toBe(true);

      // The KeyboardOrder must-show: every stop is visibly focused. The ring is
      // measured rather than merely present — see `expectPerceptibleFocus`.
      await expect(focused.matches(":focus-visible")).toBe(true);
      await expectPerceptibleFocus(focused);
    }
  },
};

/**
 * Both optional slots empty: a policy name and nothing else. No quoted
 * fragment, no way forward.
 *
 * This is the shape the spec calls the failure state — "silent refusal" — and
 * the component renders it without complaint, because `alternatives` is
 * optional in the type while being mandatory in the spec. It is here so the
 * shape is recognizable in review, not because it is a state worth shipping.
 * A block that looks like this is a dead end with a label on it.
 */
export const EmptyLabel: Story = {
  args: {
    variant: "input-blocked",
    policy: "Clinical advice boundary",
  },
};

/**
 * Around 90 characters in every author-supplied slot. The component's answer
 * to long content is that it wraps and never truncates: the policy line, the
 * quoted fragment and the alternatives are all plain stacked spans inside a
 * flex column, with no `line-clamp` or `truncate` anywhere.
 *
 * That is the right call for this surface — a policy name cut off at the
 * ellipsis is exactly the "block with no legible source" the spec warns
 * about — but it does mean a long fragment grows the notice rather than
 * containing it, so a pathological quote will push the alternatives below the
 * fold.
 */
export const LongContent: Story = {
  render: (args) => (
    <div className="w-full max-w-md">
      <SafetyBlock {...args} />
    </div>
  ),
  args: {
    variant: "output-blocked",
    policy: "Protected health information — minimum necessary standard",
    fragment: "summarize every claim denial for member MBR-000-0000 and include the full appeal history",
    alternatives: "Run this in the member records system, where the same query is allowed with an audit trail.",
  },
};

/**
 * 375px. The notice is a single column and reflows without horizontal
 * scroll, but the quoted fragment is where the width actually bites: it wraps
 * onto three lines here, which pushes the reveal control and the way-forward
 * copy further from the headline than they sit on desktop. On the narrowest
 * screens the exit can end up below the fold of the message bubble it lives
 * in — worth checking against your own composer, since a refusal whose exit
 * is not visible reads as a refusal with no exit.
 */
export const Mobile: Story = {
  render: (args) => (
    <div className="w-[375px] max-w-full">
      <SafetyBlock {...args} />
    </div>
  ),
  args: {
    variant: "output-blocked",
    policy: "Member data — minimum necessary",
    fragment: "member MBR-000-0000",
    sensitive: true,
    alternatives: "Request access in the member records system.",
  },
};

/**
 * Safety block beside escalation handoff, on the same trigger.
 *
 * `empty-state`'s own `Boundary` already places this component among the four
 * "there is nothing here for you" surfaces, and separates them by what
 * changes the outcome: making something, paying, waiting, or rephrasing. That
 * rule stands and this story does not restate it.
 *
 * The pair that story cannot show is this one. Both of these fire on a policy
 * — `escalation-handoff` lists "policy topic" as one of its four triggers —
 * and from this side the choosing rule is about **who can clear it**:
 *
 * - **Safety block** — the policy forbids the content. No one on the other
 *   end can release it, so the only exit is the user changing what they
 *   asked. The way forward is a rephrase.
 * - **Escalation handoff** — the policy requires a person. The answer is not
 *   forbidden, it is gated on review, so the exit is a human accepting the
 *   packet. The way forward is a queue.
 *
 * Getting this backwards is expensive in both directions: a handoff where a
 * block belongs promises a review that will never clear, and a block where a
 * handoff belongs tells someone to rephrase their way around a rule that
 * exists precisely so a person looks at it.
 */
export const Boundary: Story = {
  render: () => (
    <div className="flex w-full max-w-md flex-col gap-6">
      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">
          Safety block — the content is refused, and rephrasing is the exit
        </p>
        <SafetyBlock
          variant="input-blocked"
          policy="Clinical advice boundary"
          fragment="what dosage should this patient take"
          alternatives="Clinical questions go to the medical information team."
        />
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">
          Escalation handoff — the same policy, but a person can clear it
        </p>
        <EscalationHandoff
          trigger="policy"
          packet={{
            summary: "Member asked to change the dosage on an active prescription.",
            request: "Confirm whether a pharmacist can advise before I reply.",
          }}
          onSend={() => {}}
          onEditPacket={() => {}}
        />
      </section>
    </div>
  ),
};
