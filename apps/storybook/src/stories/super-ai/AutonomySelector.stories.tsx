import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { expect, fn, userEvent, within } from "storybook/test";

import {
  AutonomySelector,
  type AutonomyDenial,
  type AutonomyGrant,
  type AutonomySelectorProps,
} from "@/registry/super-ai/autonomy-selector";
import { PermissionPrompt } from "@/registry/super-ai/permission-prompt";
import { AutonomySelectorDocs } from "@/content/components/autonomy-selector.docs";
import { Button } from "@/components/ui/button";
import { componentDocsPage } from "@/lib/component-docs-page";

const meta: Meta<typeof AutonomySelector> = {
  title: "Super AI/Autonomy Selector",
  component: AutonomySelector,
  parameters: { layout: "centered", docs: { page: componentDocsPage(AutonomySelectorDocs) } },
};

export default meta;
type Story = StoryObj<typeof AutonomySelector>;

// Same voice as the shipped demo: tools an agent in this system actually holds,
// scoped the way a grant is really scoped, aged the way a ledger really ages.
const GRANTS: AutonomyGrant[] = [
  { id: "g1", tool: "Search knowledge base", scope: "All indexed sources", granted: "3 days ago" },
  { id: "g2", tool: "Send email", scope: "Internal recipients only", granted: "yesterday" },
  { id: "g3", tool: "Create ticket", scope: "Service desk", granted: "2 hours ago" },
];

const DENIALS: AutonomyDenial[] = [
  { id: "d1", tool: "Delete records", reason: "Never automated" },
  { id: "d2", tool: "Approve payment", reason: "Requires two people" },
];

// The width the shipped demo uses. Not a new design value — the component is a
// settings column and has no intrinsic width of its own.
const Column = ({ children }: { children: React.ReactNode }) => (
  <div className="w-full max-w-md">{children}</div>
);

/**
 * The strictest level, and the one a product should ship as its default.
 * Nothing runs unattended, so the grant ledger below is empty — and it still
 * renders, because "no standing permissions" is a fact worth stating rather
 * than a section worth hiding.
 */
export const AskEveryTime: Story = {
  args: { defaultLevel: "ask" },
  render: (args) => (
    <Column>
      <AutonomySelector {...args} />
    </Column>
  ),
};

/**
 * The middle level: reads run alone, anything that writes or sends still asks.
 * This is the level the spec calls wrong the moment one read is expensive or
 * sensitive, which is what the denial list further down exists to correct.
 */
export const AutoApproveReads: Story = {
  args: { defaultLevel: "auto-reads", grants: GRANTS.slice(0, 2), onRevoke: fn() },
  render: (args) => (
    <Column>
      <AutonomySelector {...args} />
    </Column>
  ),
};

/**
 * Everything not on the deny list runs unattended. The deny list is not
 * decoration here: it is the only reason this level can be offered at all,
 * so full auto and a populated "Never allowed" section belong on screen
 * together.
 */
export const FullAuto: Story = {
  args: { defaultLevel: "full", grants: GRANTS.slice(0, 2), denials: DENIALS, onRevoke: fn() },
  render: (args) => (
    <Column>
      <AutonomySelector {...args} />
    </Column>
  ),
};

/**
 * The ledger, foregrounded — every "Always allow" the user ever clicked in a
 * permission prompt, with what it covers, how old it is, and a way out. This
 * is the half of the pattern the reference products mostly do not ship, and
 * the reason the component exists rather than a bare radio group.
 */
export const StandingGrants: Story = {
  args: { defaultLevel: "auto-reads", grants: GRANTS, onRevoke: fn() },
  render: (args) => (
    <Column>
      <AutonomySelector {...args} />
    </Column>
  ),
};

/**
 * The per-tool override beating the level, which is the whole point of having
 * both. The level here is auto-approve-reads, and "Read customer PII" is a
 * read — it still will not run, because deny wins and takes no allowlist
 * exceptions. Note the shape difference from a grant row: an icon instead of
 * an action, and nothing to click. Denials are not revocable from this
 * surface, and the asymmetry is deliberate.
 */
export const DeniedTools: Story = {
  args: {
    defaultLevel: "auto-reads",
    denials: [...DENIALS, { id: "d3", tool: "Read customer PII", reason: "Blocked by data policy" }],
  },
  render: (args) => (
    <Column>
      <AutonomySelector {...args} />
    </Column>
  ),
};

/**
 * A run is in flight. Raising autonomy is blocked — the levels above the
 * current one go dim and refuse the click — while lowering it stays available
 * at every level, including all the way back to ask-every-time. That
 * asymmetry is the component's one genuine piece of logic: a safety control
 * you cannot tighten during an incident is not a safety control.
 *
 * This is the disabled-shaped state, and it is deliberately not a `disabled`
 * prop. There is no way to make this component inert, by design.
 */
export const LockedMidRun: Story = {
  args: { defaultLevel: "auto-reads", locked: true, grants: GRANTS.slice(0, 2), onRevoke: fn() },
  render: (args) => (
    <Column>
      <AutonomySelector {...args} />
    </Column>
  ),
  play: async ({ canvasElement }) => {
    const levels = canvasElement.querySelectorAll('[data-slot="autonomy-selector-level"]');
    await expect(levels).toHaveLength(3);

    // Lower than current, and current itself, stay available…
    await expect(levels[0]).not.toHaveAttribute("data-blocked");
    await expect(levels[1]).not.toHaveAttribute("data-blocked");
    // …and only the level above the current one is refused.
    await expect(levels[2]).toHaveAttribute("data-blocked");
  },
};

/* -------------------------------------------------------------------------
 * Case stories — the situations this component meets in a product, as
 * opposed to the level/list combinations above. See
 * docs/design-system/story-conventions.md for which of the eight apply.
 *
 * Not written for this component, deliberately:
 *
 * // case-skip: ReducedMotion — nothing in the tree animates
 * There is no keyframe or transform anywhere in the component or its
 * composed children: the only motion-adjacent classes in reach are
 * `transition-colors` on EntityRow's hover (which this component never
 * triggers, since it passes no `onSelect` and its rows are non-interactive)
 * and `transition-all` on the Revoke Button. Neither is an animation, and
 * neither branches on `prefers-reduced-motion`, so a ReducedMotion story
 * would render identically to StandingGrants and imply coverage it does not
 * have.
 * ---------------------------------------------------------------------- */

/**
 * Right-to-left. Direction is load-bearing in three separate places here: the
 * radio must precede its label from the right, the Ban icon leading a denial
 * row must sit on the right while the Revoke button on a grant row swaps to
 * the left, and the middle dot joining a grant's scope and age has to read in
 * the new order. The blast-radius line under each level is the text most
 * likely to expose a hard-coded direction, so it is worth rendering rather
 * than assuming.
 */
export const RTL: Story = {
  render: () => (
    <div dir="rtl">
      <Column>
        <AutonomySelector
          defaultLevel="auto-reads"
          grants={GRANTS.slice(0, 2)}
          onRevoke={fn()}
          denials={DENIALS}
        />
      </Column>
    </div>
  ),
};

/**
 * Tab traversal, and the load-bearing fact is how few stops there are: the
 * three levels are a Base UI radio group with roving tabindex, so they are
 * *one* tab stop, not three — you tab to the group and arrow within it. Every
 * Revoke button after it is its own stop. A refactor that turned the levels
 * into three plain buttons would look identical and would quietly triple the
 * tab cost of reaching the ledger, so the count is pinned here.
 *
 * The ring assertion is bounded by the expected stop count rather than
 * looping until focus escapes, because a roving-tabindex group re-entered
 * from the end can hand focus back into itself.
 *
 * Defect recorded, not asserted: every Revoke button has the accessible name
 * "Revoke" and nothing else, so the three stops after the group are
 * indistinguishable to a screen reader — only reading order ties a button to
 * its grant. See the report and the docs module's pitfalls; it is not fixed
 * here because it needs an API decision, not a class.
 */
export const KeyboardOrder: Story = {
  render: () => (
    <Column>
      <AutonomySelector defaultLevel="auto-reads" grants={GRANTS.slice(0, 2)} onRevoke={fn()} />
    </Column>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const radios = canvas.getAllByRole("radio");
    await expect(radios).toHaveLength(3);

    // Roving tabindex: exactly one radio is reachable by Tab, and it is the
    // checked one. This is the assertion that catches the refactor above.
    const tabbable = radios.filter((r) => r.getAttribute("tabindex") !== "-1");
    await expect(tabbable).toHaveLength(1);
    await expect(tabbable[0]).toHaveAttribute("aria-checked", "true");

    // One stop for the group, then one per Revoke button.
    const expectedStops = 1 + canvas.getAllByRole("button", { name: "Revoke" }).length;
    await expect(expectedStops).toBe(3);

    await userEvent.tab();
    for (let i = 0; i < expectedStops; i++) {
      const focused = document.activeElement as HTMLElement;
      await expect(canvasElement.contains(focused)).toBe(true);
      await expect(focused.matches(":focus-visible")).toBe(true);
      const style = getComputedStyle(focused);
      await expect(style.boxShadow !== "none" || style.outlineStyle !== "none").toBe(true);
      await userEvent.tab();
    }

    // And the component does not trap: the stop after the last one is outside.
    await expect(canvasElement.contains(document.activeElement)).toBe(false);
  },
};

/**
 * A consumer that holds `level` itself and deliberately refuses the change.
 * The host below never applies what it is told — it pins `level` to
 * "ask" forever — which is the only way to see the controlled contract
 * actually hold rather than merely appear to.
 *
 * Three things are asserted, and all three are things a consumer depends on:
 * clicking a level does not move the rendered value on its own, the callback
 * arrives with the `AutonomyLevel` needed to apply it, and a real re-render
 * with an unchanged `level` leaves the selection where it was. The render
 * counter on the host is what makes the third assertion mean something — it
 * proves React re-rendered rather than skipped the work.
 *
 * Note the API shape: this component's controlled pair is
 * `level`/`onLevelChange`, not `value`/`onValueChange`.
 */
export const Controlled: Story = {
  args: { level: "ask", onLevelChange: fn() },
  render: (args) => <PinnedLevel level={args.level} onLevelChange={args.onLevelChange} />,
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const [ask, , full] = canvas.getAllByRole("radio");

    await expect(ask).toHaveAttribute("aria-checked", "true");
    await expect(full).toHaveAttribute("aria-checked", "false");

    await userEvent.click(full);

    // The payload a consumer needs in order to apply the change.
    await expect(args.onLevelChange).toHaveBeenCalledWith("full");

    // The prop wins: the click alone moved nothing.
    await expect(ask).toHaveAttribute("aria-checked", "true");
    await expect(full).toHaveAttribute("aria-checked", "false");

    // …and it held across a genuine re-render, not a skipped one.
    await expect(canvas.getByTestId("controlled-host")).toHaveAttribute("data-renders", "1");
    await expect(ask).toHaveAttribute("aria-checked", "true");
  },
};

/**
 * The host for `Controlled`. It calls the story's spy and then bumps an
 * unrelated counter, so every click forces a real re-render while `level`
 * stays exactly where it was.
 */
function PinnedLevel({ level, onLevelChange }: Pick<AutonomySelectorProps, "level" | "onLevelChange">) {
  const [renders, setRenders] = React.useState(0);

  return (
    <div data-testid="controlled-host" data-renders={renders} className="w-full max-w-md">
      <AutonomySelector
        level={level}
        onLevelChange={(next) => {
          onLevelChange?.(next);
          setRenders((n) => n + 1);
        }}
        grants={GRANTS.slice(0, 1)}
        onRevoke={fn()}
      />
    </div>
  );
}

/**
 * Grants and denials stripped back to their required fields — no scope, no
 * date, no reason. Every optional text slot in this component is an
 * accountability field, so emptying them is not a cosmetic edge case: the
 * ledger degrades into rows that say something was allowed, to some tool,
 * at some point, with a Revoke button as the only thing left to act on. A
 * denial with no reason is worse, because the user cannot tell a policy from
 * a bug.
 *
 * The rows stay the same height as their populated neighbours (EntityRow
 * holds a `min-h-14` for exactly this), so the missing information reads as
 * absent rather than as a broken layout — which is the honest rendering, and
 * also why this is easy to ship without noticing.
 */
export const EmptyLabel: Story = {
  render: () => (
    <Column>
      <AutonomySelector
        defaultLevel="auto-reads"
        grants={[
          { id: "g1", tool: "Send email" },
          { id: "g2", tool: "Create ticket" },
        ]}
        onRevoke={fn()}
        denials={[{ id: "d1", tool: "Delete records" }]}
      />
    </Column>
  ),
};

/**
 * A ~90-character tool name and a scope of similar length. Both land in
 * EntityRow's title and description, and both `truncate` — one line, ellipsis,
 * no wrap and no tooltip. That is the component's real answer to long content,
 * and it costs more here than in most rows: the tail of a tool identifier is
 * usually the part that distinguishes it, and with every Revoke button sharing
 * one accessible name, the truncated title is the only thing telling two
 * grants apart. Prefer a short `tool` and put the detail in `scope`.
 */
export const LongContent: Story = {
  render: () => (
    <Column>
      <AutonomySelector
        defaultLevel="auto-reads"
        grants={[
          {
            id: "g1",
            tool: "Search knowledge base across every indexed source and archived space",
            scope: "All indexed sources, archived spaces, and the read-only mirror of the retired wiki",
            granted: "3 days ago",
          },
          ...GRANTS.slice(1, 2),
        ]}
        onRevoke={fn()}
      />
    </Column>
  ),
};

/**
 * 375px. The level rows hold up — the blast-radius line wraps under its label
 * and the radio stays put — but the ledger is where the width goes: each grant
 * row keeps its Revoke button at full size (`shrink-0`) and gives the
 * remaining space to the title and scope, so the truncation from LongContent
 * starts biting at ordinary lengths. "Internal recipients only" is a short
 * scope and it is already close.
 */
export const Mobile: Story = {
  render: () => (
    <div className="w-[375px] max-w-full">
      <AutonomySelector
        defaultLevel="auto-reads"
        grants={GRANTS}
        onRevoke={fn()}
        denials={DENIALS}
      />
    </div>
  ),
};

/**
 * Beside its near-twin, N8 permission-prompt. They are both about permission
 * and they are not interchangeable — the rule is *when* they appear and *what
 * survives them*:
 *
 * - **Permission prompt** is an interrupt. The agent has paused on one call,
 *   it asks about that call, and the answer dies with it — unless the user
 *   picks "Always allow", which writes a grant and is the only doorway
 *   between the two components.
 * - **Autonomy selector** is standing policy. It is always available, it is
 *   changeable mid-run, and it owns the ledger of every grant those prompts
 *   created plus the deny list no prompt can override.
 *
 * So: a question about something happening right now is N8. A setting, or any
 * view of what was decided earlier, is N9. If you are reaching for a list of
 * previous approvals inside a prompt, that is this component instead. The
 * prompt is rendered closed here, as its trigger, because "appears when the
 * agent pauses" is precisely the difference being drawn.
 */
export const Boundary: Story = {
  render: () => (
    <div className="flex w-full max-w-md flex-col gap-6">
      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">
          Permission prompt — interrupts, asks about one call
        </p>
        <PermissionPrompt
          open={false}
          action="Send email to finance@example.com"
          reason="The invoice PDF finished rendering and this recipient is on the approved list."
          args={[
            { key: "to", value: "finance@example.com" },
            { key: "subject", value: "Q3 invoice — ready for review" },
          ]}
          trigger={<Button variant="outline">Agent paused — review this call</Button>}
          onAllowOnce={fn()}
          onAlwaysAllow={fn()}
          onDeny={fn()}
          onEditFirst={fn()}
        />
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">
          Autonomy selector — standing policy, and the ledger of what was already allowed
        </p>
        <AutonomySelector
          defaultLevel="auto-reads"
          grants={GRANTS.slice(0, 2)}
          onRevoke={fn()}
          denials={DENIALS}
        />
      </section>
    </div>
  ),
};
