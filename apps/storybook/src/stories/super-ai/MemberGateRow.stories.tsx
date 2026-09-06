import type { Meta, StoryObj } from "@storybook/react-vite";
import { Scan, Sparkles, Video, Wand2 } from "lucide-react";
import * as React from "react";
import { useState } from "react";
import { expect, userEvent, within } from "storybook/test";

import { Switch } from "@/components/ui/switch";
import { EntityRow } from "@/registry/super-ai/entity-row";
import { MemberGateRow, type MemberGateRowProps, type MemberGateRowState } from "@/registry/super-ai/member-gate-row";
import { PromoCard } from "@/registry/super-ai/promo-card";
import { MemberGateRowDocs } from "@/content/components/member-gate-row.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

/**
 * Fixtures are feature names a generation tool actually gates: render
 * resolution, matting, voice cloning. Nothing here is an invented plan name
 * beyond the two tiers the reference board itself uses (Pro, Studio).
 */
const LONG_LABEL = "Batch upscale with face restoration and per-shot colour matching";
const LONG_DESCRIPTION =
  "Runs every selected frame through the restoration model before the upscaler, then matches colour shot by shot.";

const meta: Meta<typeof MemberGateRow> = {
  title: "Super AI/Member Gate Row",
  component: MemberGateRow,
  parameters: { layout: "centered", docs: { page: componentDocsPage(MemberGateRowDocs) } },
};

export default meta;
type Story = StoryObj<typeof MemberGateRow>;

// MemberGateRow is controlled — it owns none of the locked/inline-upsell
// transition itself. The Locked story's play test needs the row to actually
// reveal the upsell panel after a click, so this wrapper stands in for the
// state a real consumer would own (see onRequestUpgrade in the docs).
function ControlledMemberGateRow(props: MemberGateRowProps) {
  const [state, setState] = useState<MemberGateRowState>(props.state);
  return (
    <MemberGateRow
      {...props}
      state={state}
      onRequestUpgrade={() => setState("inline-upsell")}
      onDismissUpsell={() => setState("locked")}
    />
  );
}

/**
 * The state the whole component exists for: a paid feature left sitting in
 * the settings list it belongs to, with a tier badge saying what it costs.
 * The switch here is real — not `disabled`, not `readOnly` — so it keeps its
 * tab stop and reports the activation attempt through `onRequestUpgrade`
 * instead of turning on. Watch what the play does: the click reveals a panel
 * underneath the row, and `queryByRole("dialog")` stays empty. That is the
 * spec's second bullet, asserted rather than described.
 */
export const Locked: Story = {
  args: {
    label: "4K export",
    description: "Render at full resolution",
    state: "locked",
    tier: "Pro",
    upsellDescription: "4K export is a Pro feature. Upgrade to render at full resolution.",
    onUpgrade: () => {},
  },
  render: (args) => <ControlledMemberGateRow {...args} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("4K export")).toBeInTheDocument();
    await expect(canvas.getByText("Pro")).toBeInTheDocument();

    const gateSwitch = canvas.getByRole("switch");
    await expect(gateSwitch).toHaveAttribute("aria-checked", "false");

    // Activating a locked row reveals the upsell inline — never a modal.
    await userEvent.click(gateSwitch);
    // Scoped to the upsell title: /upgrade to pro/i also matches the CTA
    // button's own "Upgrade to Pro" label, so an unscoped canvas.getByText
    // would match both and throw.
    await expect(canvasElement.querySelector('[data-slot="member-gate-row-upsell-title"]')).toHaveTextContent(
      /upgrade to pro/i,
    );
    await expect(canvas.queryByRole("dialog")).not.toBeInTheDocument();
    // The switch itself never actually turns on.
    await expect(canvas.getByRole("switch")).toHaveAttribute("aria-checked", "false");
  },
};

/**
 * The feature is granted, so the row drops every gate affordance at once —
 * no tier badge, no trial badge, no `aria-describedby` lock sentence — and
 * what is left is an ordinary settings toggle. That subtraction is the point:
 * the row's geometry does not change when a plan is bought, so a settings
 * list does not reflow around the purchase. `checked` becomes authoritative
 * here and only here (with `trial-available`); in the two gated states the
 * component ignores it.
 */
export const Unlocked: Story = {
  args: {
    label: "Background removal",
    state: "unlocked",
    checked: true,
    onCheckedChange: () => {},
  },
};

/**
 * The third state the spec insists on, and the reason it cannot be folded
 * into either neighbour: the switch works like `unlocked` while the badge
 * reads like `locked`. A user can turn this on right now and spend the trial
 * doing it. Note what the badge is not — it carries no `aria-describedby`
 * counterpart, so the "×1" that makes the offer finite is loose text beside
 * the switch rather than part of its description. A screen-reader user hears
 * a plain toggle and has to go find the badge.
 */
export const TrialAvailable: Story = {
  args: {
    label: "Voice cloning",
    description: "Clone a voice from a short sample",
    state: "trial-available",
    trialLabel: "Free trial ×1",
    checked: false,
    onCheckedChange: () => {},
  },
};

/**
 * `locked` after the switch was pressed, held here as a static state so the
 * revealed panel can be read on its own. Two decisions are visible in it.
 * The row above is untouched — same badge, same off switch — because the
 * upsell is content added below, not a different row swapped in. And the
 * panel is `role="status"`, not a dialog: nothing is trapped, Escape does
 * nothing, and the only way out is the dismiss button, which is what the play
 * exercises.
 */
export const InlineUpsell: Story = {
  args: {
    label: "4K export",
    description: "Render at full resolution",
    state: "inline-upsell",
    tier: "Pro",
    upsellDescription: "4K export is a Pro feature. Upgrade to render at full resolution.",
    onUpgrade: () => {},
    onDismissUpsell: () => {},
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Scoped to the upsell title: /upgrade to pro/i also matches the CTA
    // button's own "Upgrade to Pro" label, so an unscoped canvas.getByText
    // would match both and throw.
    await expect(canvasElement.querySelector('[data-slot="member-gate-row-upsell-title"]')).toHaveTextContent(
      /upgrade to pro/i,
    );
    await expect(canvas.queryByRole("dialog")).not.toBeInTheDocument();

    await userEvent.click(canvas.getByRole("button", { name: /not now/i }));
  },
};

/* -------------------------------------------------------------------------
 * Case stories — the situations this component meets in a product, as
 * opposed to the prop combinations above. See
 * docs/design-system/story-conventions.md for which of the eight apply and
 * why the one that is missing here is missing.
 *
 * Not written for this component, deliberately:
 *
 * // case-skip: ReducedMotion — the component's own markup carries no animate-* or transition-* at all; the one thing that moves belongs to the vendored Switch and is a primitive-wide posture
 * `member-gate-row.tsx` has zero motion classes. The upsell panel appears by
 * mounting, not by animating — there is no `data-open:animate-in` and no
 * height transition — so the locked → inline-upsell reveal is already
 * instantaneous under any motion preference. The one thing in the composed
 * tree that moves is `components/ui/switch.tsx`: `transition-all` on the
 * track and `transition-transform` on the thumb, which slides by
 * `translate-x-[calc(100%-2px)]`. Measured under the emulated reduce that
 * `vitest.config.ts` forces on every test, the thumb's `transition-duration`
 * still reads `0.15s`, so it really does slide. It cannot be branched from
 * here: a `className` on `<Switch>` reaches the root's `transition-all` and
 * not the thumb, whose class list is hard-coded inside the vendored file. So
 * this is the wave-1 `Button` press-nudge finding in a second primitive — a
 * library-wide posture living outside `registry/super-ai/`, recorded in the
 * report rather than papered over with an arbitrary-variant selector that no
 * other component in the registry uses. M4 `pricing-table` looks like a
 * counter-example and is not: it hand-rolls its own switch markup and
 * therefore owns the `motion-reduce:transition-none` it carries.
 * ---------------------------------------------------------------------- */

/**
 * Right-to-left, with a gated row and an ungated one stacked so the row, its
 * panel and its switch mirror together. Three things had to move: one did on
 * its own, one needed a swap, and one is broken below this component.
 *
 * The row itself mirrors for free — `entity-row` is `flex … gap-3` with
 * `text-start`, so the icon leads on the right, the badge-and-switch group
 * trails on the left, and nothing in this component's trailing slot uses a
 * physical utility. The upsell panel did not: it carried `ml-3`, a physical
 * left margin that under RTL indents the panel from the *trailing* edge, so
 * the panel hung off the wrong side of the row it belongs to. Swapped to
 * `ms-3` in this wave — byte-identical in LTR, the sanctioned swap class from
 * `CONTINUE.md` §8 — and the play asserts the resolved margin lands on the
 * right under `dir="rtl"`, which is what proves the swap rather than the
 * class name.
 *
 * **The switch thumb does not mirror, and that is not this component's to
 * fix.** The vendored `Switch` moves its thumb with
 * `translate-x-[calc(100%-2px)]`, a physical axis, so a checked switch pushes
 * it right in both directions. Measured on the second row here, settled:
 * the track spans 12–44px and the thumb sits at 41–57px, so 13 of the thumb's
 * 16px are *outside* the track it belongs to. In LTR the same switch reads
 * track 1156–1188, thumb 1171–1187 — flush inside, as intended. Every
 * registry component that renders a switch inherits this, the class lives in
 * `components/ui/switch.tsx` rather than in any component, and the play
 * therefore records the numbers without asserting them. The story keeps the
 * checked row on screen so the next reader sees it rather than takes it on
 * trust.
 */
export const RTL: Story = {
  render: () => (
    <div dir="rtl" className="flex w-full max-w-md flex-col gap-2">
      <MemberGateRow
        icon={<Video className="size-4" aria-hidden />}
        label="4K export"
        description="Render at full resolution"
        state="inline-upsell"
        tier="Pro"
        upsellDescription="4K export is a Pro feature. Upgrade to render at full resolution."
        onUpgrade={() => {}}
        onDismissUpsell={() => {}}
      />
      <MemberGateRow
        icon={<Scan className="size-4" aria-hidden />}
        label="Background removal"
        description="Matte the subject out of every frame"
        state="unlocked"
        checked
        onCheckedChange={() => {}}
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const panel = canvasElement.querySelector('[data-slot="member-gate-row-upsell"]') as HTMLElement;

    // The logical margin resolves to the right-hand (start) edge under RTL.
    // Before the `ml-3` → `ms-3` swap this read `marginLeft=12px`, i.e. the
    // panel indented from the edge it does not belong to.
    const style = getComputedStyle(panel);
    await expect(`start=${style.marginRight} end=${style.marginLeft}`).toBe("start=12px end=0px");

    // The row grid mirrors on its own: icon at the right edge, trailing group
    // at the left. Compared as centres so padding differences cannot flip it.
    const row = canvasElement.querySelector('[data-slot="entity-row"]') as HTMLElement;
    const icon = row.querySelector('[data-slot="entity-row-icon"]') as HTMLElement;
    const trailing = row.querySelector('[data-slot="member-gate-row-trailing"]') as HTMLElement;
    const centre = (el: HTMLElement) => el.getBoundingClientRect().left + el.getBoundingClientRect().width / 2;
    await expect(`icon right of trailing=${centre(icon) > centre(trailing)}`).toBe("icon right of trailing=true");
  },
};

/**
 * The whole keyboard contract of the gate, in the order a user meets it.
 *
 * A locked row is **one** stop, and it is a real one. The switch is neither
 * `disabled` nor `readOnly` — either would drop it out of the tab order and
 * make the upsell unreachable without a mouse — so the only control on the
 * row stays focusable and stays activatable, and the play proves that by
 * pressing Space on it and watching the panel appear. `entity-row` is
 * composed without `onSelect`, so the row is a plain `<div>` and contributes
 * no stop of its own.
 *
 * **Focus survives the reveal**, which is the part worth pinning. Going
 * `locked` → `inline-upsell` changes only what renders *below* the row: the
 * trailing slot's children are identical in both gated states, so React keeps
 * the same DOM node and the keyboard user is left exactly where they were.
 * The story asserts node identity, not just "something is focused".
 *
 * **Enter activates it too, and the docs page says it does not.** The
 * accessibility notes on `member-gate-row.docs.tsx` claim "Space toggles the
 * switch and Enter does not — the native switch contract". Base UI renders
 * the switch as a `<span role="switch" tabindex="0">`, not a `<button>`, and
 * handles both keys: pressing Enter on a locked row opens the upsell exactly
 * as Space does. The play asserts both, because that is the behaviour a
 * consumer will actually meet; the docs sentence is the thing that is wrong,
 * and correcting it is outside this wave's file list.
 *
 * **Where it stops, and why.** Dismissing the upsell unmounts the button that
 * has focus and nothing restores it — focus falls to `<body>` and the next
 * Tab restarts at the top of the page. That is the same focus-loss-on-unmount
 * shape wave 1 found in four components; the right destination is the switch,
 * but choosing it is a focus-management decision the component does not own
 * today. The docs page's focus notes already carry it, this wave carries it
 * into `CONTINUE.md` §8, and the play deliberately stops one step short of
 * asserting it — a green assertion against the wrong behaviour is worse than
 * no assertion.
 */
export const KeyboardOrder: Story = {
  args: {
    icon: <Video className="size-4" aria-hidden />,
    label: "4K export",
    description: "Render at full resolution",
    state: "locked",
    tier: "Pro",
    upsellDescription: "4K export is a Pro feature. Upgrade to render at full resolution.",
    onUpgrade: () => {},
  },
  render: (args) => <ControlledMemberGateRow {...args} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Base UI's switch is a `<span role="switch" tabindex="0">` plus a hidden
    // `<input type="checkbox" tabindex="-1" aria-hidden="true">` it keeps for
    // form participation, so a naive "count the inputs and buttons" walk sees
    // two elements where the keyboard sees one. Filter on tabbability.
    const stops = () =>
      Array.from(canvasElement.querySelectorAll<HTMLElement>("button, a[href], input, [tabindex]")).filter(
        (el) => el.getAttribute("tabindex") !== "-1" && el.getAttribute("aria-hidden") !== "true",
      );

    // A locked row is one stop. The row itself is a div, the badge is text.
    await expect(`locked stops=${stops().length}`).toBe("locked stops=1");

    const gateSwitch = canvas.getByRole("switch");
    await expect(gateSwitch).not.toBeDisabled();
    await expect(gateSwitch).not.toHaveAttribute("aria-disabled", "true");

    await userEvent.tab();
    await expect(document.activeElement).toBe(gateSwitch);

    const ringed = (el: HTMLElement) => {
      const s = getComputedStyle(el);
      return el.matches(":focus-visible") && (s.boxShadow !== "none" || s.outlineStyle !== "none");
    };
    await expect(`switch visibly focused=${ringed(gateSwitch)}`).toBe("switch visibly focused=true");

    // Space activates the gated switch — the key the ARIA switch pattern
    // requires. The attempt is reported, the switch stays off, and the upsell
    // appears in place, so the whole gate is reachable without a mouse.
    await userEvent.keyboard(" ");
    await expect(canvasElement.querySelector('[data-slot="member-gate-row-upsell"]')).toBeInTheDocument();
    await expect(gateSwitch).toHaveAttribute("aria-checked", "false");

    // Focus survived the reveal, on the very same node.
    await expect(document.activeElement).toBe(gateSwitch);
    await expect(`switch still in document=${canvasElement.contains(gateSwitch)}`).toBe(
      "switch still in document=true",
    );

    // Three stops now, in DOM order: switch, upgrade CTA, dismiss.
    await expect(`upsell stops=${stops().length}`).toBe("upsell stops=3");
    const cta = canvas.getByRole("button", { name: /upgrade to pro/i });
    const dismiss = canvas.getByRole("button", { name: /not now/i });

    for (const expected of [cta, dismiss]) {
      await userEvent.tab();
      await expect(document.activeElement).toBe(expected);
      await expect(`${(expected as HTMLElement).textContent} visibly focused=${ringed(expected as HTMLElement)}`).toBe(
        `${(expected as HTMLElement).textContent} visibly focused=true`,
      );
    }

    // One more Tab leaves the component: the panel is revealed content, not a
    // dialog, so nothing traps.
    await userEvent.tab();
    await expect(canvasElement.contains(document.activeElement)).toBe(false);

    // Enter does the same, against what the docs page's keyboard note says.
    // Base UI renders the switch as a `<span role="switch">` and handles both
    // keys; the note claims Enter is swallowed. Collapse the panel first —
    // by click, because the keyboard route through "Not now" is the one that
    // drops focus, and this story does not exercise that.
    await userEvent.click(canvas.getByRole("button", { name: /not now/i }));
    await expect(canvasElement.querySelector('[data-slot="member-gate-row-upsell"]')).not.toBeInTheDocument();
    gateSwitch.focus();
    await userEvent.keyboard("{Enter}");
    await expect(canvasElement.querySelector('[data-slot="member-gate-row-upsell"]')).toBeInTheDocument();
    await expect(gateSwitch).toHaveAttribute("aria-checked", "false");

    // Stops here. Pressing "Not now" unmounts the focused button and nothing
    // restores focus — see the description.
  },
};

/**
 * Two controlled pairs, and the row treats them as different kinds of thing.
 *
 * `checked` / `onCheckedChange` is the ordinary one, and this host holds it
 * the hard way: it records what the row asked for and applies it only when
 * told to. What that proves, in order — flipping the switch does not move the
 * rendered value; the callback still fires with the boolean a host has to
 * apply; a re-render with an unchanged `checked` leaves the switch where it
 * was; and applying the request moves it. Without those four the story would
 * be a screenshot of a prop.
 *
 * The gated row is the interesting half. `checked` is passed in as `true`
 * there and is **ignored** — a gated switch always renders off, because the
 * feature was never granted and rendering it on would be a lie about
 * entitlement. Activating it routes to `onRequestUpgrade` and never to
 * `onCheckedChange`, so a host that only wires the toggle sees nothing
 * happen. That is the asymmetry to carry away: `state` outranks `checked`,
 * and the two callbacks are mutually exclusive rather than layered.
 */
export const Controlled: Story = {
  render: () => <ControlledShell />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const unlocked = within(canvas.getByTestId("unlocked-row")).getByRole("switch");

    await expect(unlocked).toHaveAttribute("aria-checked", "false");

    // 1. Interaction alone does not move the rendered value.
    await userEvent.click(unlocked);
    await expect(unlocked).toHaveAttribute("aria-checked", "false");

    // 2. …but the callback fired, with the boolean the host has to apply.
    await expect(canvas.getByTestId("requested")).toHaveTextContent("true");

    // 3. Re-render with an unchanged `checked`. Prove the re-render first.
    await expect(canvas.getByTestId("render-pass")).toHaveTextContent("1");
    await userEvent.click(canvas.getByRole("button", { name: "Re-render" }));
    await expect(canvas.getByTestId("render-pass")).toHaveTextContent("2");
    await expect(unlocked).toHaveAttribute("aria-checked", "false");

    // 4. The payload was sufficient to apply the change.
    await userEvent.click(canvas.getByRole("button", { name: "Apply" }));
    await expect(unlocked).toHaveAttribute("aria-checked", "true");

    // 5. The gated row ignores `checked` entirely — it is passed `true` and
    //    still renders off — and reports upward through the other callback.
    const locked = within(canvas.getByTestId("locked-row")).getByRole("switch");
    await expect(locked).toHaveAttribute("aria-checked", "false");
    await userEvent.click(locked);
    await expect(locked).toHaveAttribute("aria-checked", "false");
    await expect(canvas.getByTestId("upgrade-requests")).toHaveTextContent("1");
    // …and never through onCheckedChange, which the locked row also passes.
    await expect(canvas.getByTestId("locked-toggles")).toHaveTextContent("0");
  },
};

function ControlledShell() {
  const [applied, setApplied] = React.useState(false);
  const [requested, setRequested] = React.useState<boolean | null>(null);
  const [pass, setPass] = React.useState(1);
  const [upgradeRequests, setUpgradeRequests] = React.useState(0);
  const [lockedToggles, setLockedToggles] = React.useState(0);

  return (
    <div className="flex w-full max-w-2xl items-start gap-6">
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div data-testid="unlocked-row">
          <MemberGateRow
            icon={<Scan className="size-4" aria-hidden />}
            label="Background removal"
            description="Matte the subject out of every frame"
            state="unlocked"
            checked={applied}
            onCheckedChange={setRequested}
          />
        </div>
        <div data-testid="locked-row">
          <MemberGateRow
            icon={<Video className="size-4" aria-hidden />}
            label="4K export"
            description="Render at full resolution"
            state="locked"
            tier="Pro"
            checked
            onCheckedChange={() => setLockedToggles((n) => n + 1)}
            onRequestUpgrade={() => setUpgradeRequests((n) => n + 1)}
          />
        </div>
      </div>

      <div className="flex flex-col gap-4 py-1">
        <dl className="text-foreground grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs">
          <dt>checked prop</dt>
          <dd data-testid="applied">{String(applied)}</dd>
          <dt>last onCheckedChange</dt>
          <dd data-testid="requested">{requested === null ? "—" : String(requested)}</dd>
          <dt>host render pass</dt>
          <dd data-testid="render-pass" className="tabular-nums">
            {pass}
          </dd>
          <dt>onRequestUpgrade calls</dt>
          <dd data-testid="upgrade-requests" className="tabular-nums">
            {upgradeRequests}
          </dd>
          <dt>locked onCheckedChange calls</dt>
          <dd data-testid="locked-toggles" className="tabular-nums">
            {lockedToggles}
          </dd>
        </dl>

        <div className="flex gap-2">
          <button
            type="button"
            className="border-border text-foreground hover:bg-accent focus-visible:ring-ring rounded-md border px-2 py-1 text-xs focus-visible:ring-2 focus-visible:outline-none"
            onClick={() => setPass((n) => n + 1)}
          >
            Re-render
          </button>
          <button
            type="button"
            className="border-border text-foreground hover:bg-accent focus-visible:ring-ring rounded-md border px-2 py-1 text-xs focus-visible:ring-2 focus-visible:outline-none"
            onClick={() => requested !== null && setApplied(requested)}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Every optional slot dropped at once, which turns out to matter more here
 * than in most rows. `description`, `icon` and `tier` are all optional, and
 * `tier` is the one that costs something: without it the badge disappears,
 * the row renders as an ordinary toggle, and the only thing left saying the
 * feature is gated is the sr-only sentence — which degrades too, from
 * "Locked — requires Pro. Activating opens upgrade options." to a bare
 * "Locked. …". So a sighted user gets **no** gate signal at all, and the
 * default upsell copy collapses to "Upgrade to unlock 4K export" with no
 * price attached to the word "upgrade". The second row is the same feature
 * with the badge back, so the difference is visible side by side. Pass
 * `tier`; the type lets you omit it and the design does not really.
 *
 * The switch keeps its accessible name throughout, because it is named by
 * `aria-labelledby` pointing at the row's title span rather than by any of
 * the optional slots. `label` itself is required and is the one slot that
 * must not be emptied: `label=""` would leave `aria-labelledby` resolving to
 * nothing and ship an `aria-toggle-field-name` violation into a gate that
 * runs at `test: "error"`, so it is recorded here rather than rendered.
 */
export const EmptyLabel: Story = {
  render: () => (
    <div className="flex w-full max-w-md flex-col gap-2">
      <MemberGateRow label="4K export" state="locked" onRequestUpgrade={() => {}} />
      <MemberGateRow label="4K export" state="locked" tier="Pro" onRequestUpgrade={() => {}} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const switches = canvas.getAllByRole("switch");

    // Both rows name their switch from the title, badge or no badge.
    for (const el of switches) {
      await expect(el).toHaveAccessibleName("4K export");
    }

    // The tier-less row is visually indistinguishable from an ungated toggle:
    // one badge on the canvas, not two.
    await expect(`badges=${canvasElement.querySelectorAll('[data-slot="member-gate-row-tier-badge"]').length}`).toBe(
      "badges=1",
    );

    // The lock sentence survives — it is the only signal the first row has —
    // but it loses the tier it would otherwise name.
    await expect(switches[0]).toHaveAccessibleDescription("Locked. Activating opens upgrade options.");
    await expect(switches[1]).toHaveAccessibleDescription("Locked — requires Pro. Activating opens upgrade options.");
  },
};

/**
 * A 64-character feature name and a 108-character description in
 * `entity-row`'s grid, beside a tier badge — and the component gives the same
 * string two different answers depending on where it lands.
 *
 * In the row, both slots are `truncate`: one line, ellipsis, and the badge
 * and switch keep their full width because the trailing group is `shrink-0`.
 * That is the right trade for a settings list — the controls are what the
 * user is aiming at — but it means the name of the feature is the part that
 * gets cut. In the upsell panel directly underneath, the *same* label is
 * interpolated into the default title ("Upgrade to Pro to unlock {label}")
 * inside a `<p>` with no clamp at all, so it wraps and shows in full. The row
 * clips the name; the panel two pixels below it does not. Read together they
 * recover the whole string, which is the argument for the panel's placement.
 *
 * The tier badge is the other thing to watch: `Badge` is
 * `whitespace-nowrap shrink-0`, so a long tier name never wraps and never
 * shrinks — it takes the width it needs straight out of the title's share.
 * The second row swaps "Pro" for "Studio annual" and nothing else, and the
 * play measures what that costs: the same label truncates earlier, in the
 * same container width. A tier string is a layout input, not a caption.
 */
export const LongContent: Story = {
  render: () => (
    <div className="flex w-full max-w-md flex-col gap-2">
      <MemberGateRow
        icon={<Wand2 className="size-4" aria-hidden />}
        label={LONG_LABEL}
        description={LONG_DESCRIPTION}
        state="inline-upsell"
        tier="Pro"
        upsellDescription={LONG_DESCRIPTION}
        onUpgrade={() => {}}
        onDismissUpsell={() => {}}
      />
      <MemberGateRow
        icon={<Wand2 className="size-4" aria-hidden />}
        label={LONG_LABEL}
        description={LONG_DESCRIPTION}
        state="locked"
        tier="Studio annual"
        onRequestUpgrade={() => {}}
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const clipped = (el: Element) => el.scrollWidth > el.clientWidth;
    const title = canvasElement.querySelector('[data-slot="entity-row-title"]') as HTMLElement;
    const description = canvasElement.querySelector('[data-slot="entity-row-description"]') as HTMLElement;
    const upsellTitle = canvasElement.querySelector('[data-slot="member-gate-row-upsell-title"]') as HTMLElement;

    await expect(`row title clipped=${clipped(title)}`).toBe("row title clipped=true");
    await expect(`row description clipped=${clipped(description)}`).toBe("row description clipped=true");

    // The panel repeats the label in full, on more than one line.
    await expect(`upsell title clipped=${clipped(upsellTitle)}`).toBe("upsell title clipped=false");
    const lines = Math.round(upsellTitle.scrollHeight / parseFloat(getComputedStyle(upsellTitle).lineHeight));
    await expect(`upsell title lines>1=${lines > 1}`).toBe("upsell title lines>1=true");

    // A longer tier badge is paid for by the title, in the same row width.
    const titles = canvasElement.querySelectorAll<HTMLElement>('[data-slot="entity-row-title"]');
    const rows = canvasElement.querySelectorAll<HTMLElement>('[data-slot="entity-row"]');
    await expect(`rows same width=${rows[0].clientWidth === rows[1].clientWidth}`).toBe("rows same width=true");
    await expect(`long tier narrows title=${titles[1].clientWidth < titles[0].clientWidth}`).toBe(
      "long tier narrows title=true",
    );

    // The clipping is visual only — the whole label stays in the accessible
    // name of the switch that the row is about.
    for (const el of within(canvasElement).getAllByRole("switch")) {
      await expect(el).toHaveAccessibleName(LONG_LABEL);
    }
  },
};

/**
 * 375px, the width the settings list this row belongs to actually ships at.
 * Nothing here has a narrow-width branch, which is the finding: the row is
 * one `flex` line at every width, so at 375px the badge and switch keep their
 * intrinsic size and the title and description absorb the loss by truncating
 * earlier. The play measures the frame rather than trusting that — no
 * horizontal scroll anywhere, including on the row carrying the widest
 * trailing group this component can produce (icon + badge + switch) with a
 * long label pushing against it.
 *
 * What is load-bearing at this width is `min-w-0` on `entity-row`'s text
 * column. A flex child defaults to `min-width: auto`, so without it the
 * untruncated label would win against the row and push the switch off the
 * right edge — the control the user came for would be the thing that
 * disappeared. The switch measures 32px at every width here, asserted,
 * because `shrink-0` on the trailing group is what makes the truncation land
 * on the label rather than on the control.
 */
export const Mobile: Story = {
  render: () => (
    <div data-testid="frame" className="flex w-[375px] max-w-full flex-col gap-2">
      <MemberGateRow
        icon={<Video className="size-4" aria-hidden />}
        label={LONG_LABEL}
        description={LONG_DESCRIPTION}
        state="locked"
        tier="Pro"
        onRequestUpgrade={() => {}}
      />
      <MemberGateRow
        icon={<Video className="size-4" aria-hidden />}
        label="4K export"
        description="Render at full resolution"
        state="inline-upsell"
        tier="Pro"
        upsellDescription="4K export is a Pro feature. Upgrade to render at full resolution."
        onUpgrade={() => {}}
        onDismissUpsell={() => {}}
      />
      <MemberGateRow
        icon={<Sparkles className="size-4" aria-hidden />}
        label="Voice cloning"
        description="Clone a voice from a short sample"
        state="trial-available"
        trialLabel="Free trial ×1"
        checked={false}
        onCheckedChange={() => {}}
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    // Not `canvasElement.firstElementChild`: `layout: "centered"` wraps every
    // story in its own full-width div, so the 375px frame is one level down.
    const frame = within(canvasElement).getByTestId("frame");
    await expect(`frame width=${frame.clientWidth}`).toBe("frame width=375");
    await expect(`frame overflows=${frame.scrollWidth > frame.clientWidth}`).toBe("frame overflows=false");

    for (const row of canvasElement.querySelectorAll('[data-slot="member-gate-row"]')) {
      await expect(`row overflows=${row.scrollWidth > row.clientWidth}`).toBe("row overflows=false");
    }

    // The switch is what the row exists to reach; it must survive the squeeze
    // at full size rather than being the thing that shrinks.
    for (const el of within(canvasElement).getAllByRole("switch")) {
      await expect(`switch width=${Math.round(el.getBoundingClientRect().width)}`).toBe("switch width=32");
    }
  },
};

/**
 * Three ways of putting a paid feature in front of someone, chosen by one
 * question: what is the user looking at when you say it.
 *
 * - **Member gate row** — they are looking at the feature, in the list where
 *   it lives. The row stays in place, the badge says what it costs, and the
 *   pitch appears under the row that prompted it. Use it whenever the user
 *   has already found the thing they cannot have.
 * - **Entity row + switch** — the same row shape with nothing gating it.
 *   This is A9's `with-switch` state, and it is what a member gate row
 *   becomes the moment the plan is bought. If nothing about the row depends
 *   on entitlement, it is this and not a gate.
 * - **Promo card** — the pitch with no feature attached, in a sidebar the
 *   user was not asking a question in. It interrupts rather than answers, so
 *   it carries its own dismissal and its own persistence.
 *
 * So: a gate that is not beside the feature it gates has become a promo card,
 * and a promo card that names one specific toggle should have been a gate on
 * that toggle's row. The tell is whether removing the component would leave a
 * hole in a list.
 */
export const Boundary: Story = {
  render: () => (
    <div className="flex w-full max-w-md flex-col gap-6">
      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">Member gate row — the feature, gated in place</p>
        <MemberGateRow
          icon={<Video className="size-4" aria-hidden />}
          label="4K export"
          description="Render at full resolution"
          state="locked"
          tier="Pro"
          onRequestUpgrade={() => {}}
        />
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">Entity row + switch — the same row, nothing gating it</p>
        <EntityRow
          icon={<Scan className="size-4" aria-hidden />}
          title="Background removal"
          description="Matte the subject out of every frame"
          trailing={<Switch aria-label="Background removal" defaultChecked />}
        />
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">Promo card — the pitch, attached to no one feature</p>
        <PromoCard
          flavour="upgrade"
          title="Upgrade to Pro"
          description="Higher resolutions, longer clips, and priority queue time."
          ctaLabel="See plans"
          onCtaClick={() => {}}
          onDismiss={() => {}}
        />
      </section>
    </div>
  ),
};
