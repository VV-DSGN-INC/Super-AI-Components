import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { expect, screen, userEvent, waitFor, within } from "storybook/test";

import { Button } from "@/components/ui/button";
import { AccountMenu } from "@/registry/super-ai/account-menu";
import {
  WorkspaceSwitcher,
  type WorkspaceSwitcherWorkspace,
} from "@/registry/super-ai/workspace-switcher";
import { WorkspaceSwitcherDocs } from "@/content/components/workspace-switcher.docs";
import { componentDocsPage } from "@/lib/component-docs-page";
import { expectPerceptibleFocus } from "@/lib/focus-treatment";

const WORKSPACE_LIST = [
  { id: "acme", name: "Acme", plan: "Pro" },
  { id: "personal", name: "Personal", plan: "Free" },
];

const MULTI_PRODUCT = [
  { id: "acme-video", name: "Acme Video", plan: "Pro", description: "Video generation workspace" },
  { id: "acme-copy", name: "Acme Copy", plan: "Pro", description: "Marketing copy workspace" },
  { id: "personal", name: "Personal", plan: "Free", description: "Solo experiments" },
];

const meta: Meta<typeof WorkspaceSwitcher> = {
  title: "Super AI/Workspace Switcher",
  component: WorkspaceSwitcher,
  parameters: { layout: "centered", docs: { page: componentDocsPage(WorkspaceSwitcherDocs) } },
};

export default meta;
type Story = StoryObj<typeof WorkspaceSwitcher>;

export const WorkspaceList: Story = {
  args: {
    workspaces: WORKSPACE_LIST,
    currentId: "acme",
    onSelect: () => {},
    onCreate: () => {},
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: /Acme/ }));

    // The menu popup renders in a portal outside canvasElement, so assert
    // against the document via `screen` rather than the scoped canvas.
    const current = await screen.findByRole("menuitemradio", { name: /Acme/ });
    await expect(current).toHaveAttribute("aria-checked", "true");
  },
};

export const MultiProduct: Story = {
  args: {
    workspaces: MULTI_PRODUCT,
    currentId: "acme-video",
    onSelect: () => {},
    onCreate: () => {},
  },
};

export const WithPlanBadge: Story = {
  args: {
    workspaces: WORKSPACE_LIST,
    currentId: "acme",
    onSelect: () => {},
  },
};

/* -------------------------------------------------------------------------
 * Case stories — the situations this component meets in a product, as
 * opposed to the prop combinations above. See
 * docs/design-system/story-conventions.md.
 *
 * All eight apply and all eight are written, so there are no `case-skip`
 * lines. Worth saying rather than leaving the reader to count: this is a
 * directional trigger over a portaled popup that animates on open, it holds
 * its selection through a real controlled pair, both text slots under the
 * name are optional, the name itself is author-supplied, and B8
 * `account-menu` is a genuine near-twin one seat away in the same topbar.
 * Every one of the eight questions has an answer here that exists nowhere
 * else.
 *
 * Every story below that needs the menu open has to open it: the component
 * exposes no `open`/`defaultOpen`, so a click on the trigger is staging, not
 * an assertion. Without it a story gates the trigger and nothing else — which
 * is what `MultiProduct` above does today, and why the entity-row rendering
 * had never once been through axe. `WorkspaceList` does open its menu, but
 * over plain rows; `EmptyLabel` below is the first story in this file to put
 * an `EntityRow` menu in front of the gate.
 * ---------------------------------------------------------------------- */

/* Case-story fixtures. Names people really type into this field — a personal
 * space, a team, a standing piece of work — rather than invented brands. */
const TEAM_WORKSPACES: WorkspaceSwitcherWorkspace[] = [
  { id: "personal", name: "Personal", plan: "Free" },
  { id: "design", name: "Design team", plan: "Pro" },
  { id: "research", name: "Research", plan: "Pro" },
];

/** Opens the menu and returns its popup. Staging for the stories below. */
async function openMenu(canvasElement: HTMLElement) {
  await userEvent.click(canvasElement.querySelector<HTMLElement>("[data-slot='workspace-switcher-trigger']")!);
  return screen.findByRole("menu");
}

/**
 * Right-to-left, with the menu open, because the trigger is only half of what
 * mirrors.
 *
 * **Correct without help:** both flex rows flip. On the trigger the avatar
 * moves to the right of the name; in the menu each row's avatar leads on the
 * right and the plan follows on the left, which is what a reader of an RTL
 * locale expects.
 *
 * **Fixed here:** the plan badge on the trigger used a physical `ml-auto`.
 * Under `dir="rtl"` a `margin-left: auto` absorbs the free space on the side
 * the badge is already against, so it stays welded to the name instead of
 * moving to the row's end; `ms-auto` compiles to the same declaration in LTR
 * and mirrors. It is inert at the trigger's shrink-wrapped width — nothing in
 * the public API gives the button spare width today — so this is a
 * correctness swap rather than a visible repair, and the width it starts
 * mattering at is the B1 sidebar's, where the switcher spans the rail.
 *
 * **Defect, recorded not fixed:** the checked indicator does not mirror. It
 * is `absolute right-2` inside a row padded `pr-8 pl-1.5`, all four physical,
 * in `components/ui/dropdown-menu.tsx` — a file this component consumes and
 * every menu in the repo shares. The geometry does not flip, so the check
 * that sits at the row's *end* in LTR sits at its *start* in RTL, and the
 * 32px gutter reserved for it follows it there. Nothing collides, which is
 * why nothing has caught it; the row simply changes which end its state
 * marker occupies depending on locale. The fix is `end-2` / `pe-8 ps-1.5` in
 * the primitive, not a patch here.
 *
 * A `<div dir="rtl">` wrapper cannot reach the menu — `DropdownMenuContent`
 * portals to the end of `document.body`, so the direction has to go on the
 * document element.
 */
export const RTL: Story = {
  args: {
    workspaces: TEAM_WORKSPACES,
    currentId: "design",
    onSelect: () => {},
    onCreate: () => {},
  },
  render: (args) => (
    <RtlDocument>
      <WorkspaceSwitcher {...args} />
    </RtlDocument>
  ),
  play: async ({ canvasElement }) => {
    const menu = await openMenu(canvasElement);
    const row = await within(menu).findByRole("menuitemradio", { name: /Design team/ });

    // The half that mirrors, and the half that must keep mirroring: the row's
    // avatar leads on the right, ahead of the name.
    const avatar = row.querySelector<HTMLElement>("[data-slot='workspace-switcher-avatar']")!;
    const name = within(row).getByText("Design team");
    await expect(avatar.getBoundingClientRect().left).toBeGreaterThan(
      name.getBoundingClientRect().left,
    );

    // The half of the indicator defect that survives fixing it: whichever end
    // the check takes, it sits in the row's reserved gutter and never over the
    // avatar. Asserting the *side* would pin the bug in place and turn red the
    // day `dropdown-menu.tsx` goes logical; asserting non-overlap holds either
    // way, and still catches a half-fix that moves the padding without the
    // indicator. Measured today at 8px clear.
    const indicator = row.querySelector<HTMLElement>(
      "[data-slot='dropdown-menu-radio-item-indicator']",
    )!;
    const check = indicator.getBoundingClientRect();
    const initials = avatar.getBoundingClientRect();
    await expect(check.right <= initials.left || check.left >= initials.right).toBe(true);
  },
};

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
 * The reduced-motion branch, and the one-class trap that makes it worth a
 * story. The popup opens with `data-open:animate-in fade-in-0 zoom-in-95` and
 * closes with `data-closed:animate-out`, neither of which reads the media
 * feature.
 *
 * The registry's usual remedy — a bare `motion-reduce:animate-none` beside
 * the `animate-*`, as `task-tray` and `trace-timeline` carry — **does nothing
 * against a Base UI popup, and does nothing quietly.** Both sides compile to
 * a single class of equal weight, so the tie falls to emission order, and
 * Tailwind emits the plain `motion-reduce:` block well before the `data-*`
 * variants. The class sits in the string, the popup keeps animating, and the
 * only way to notice is to read `animation-name` back. Restating the variant
 * on both halves sorts it after its counterpart and wins the same tie. Same
 * fix, same reason, as `shortcuts-sheet`.
 *
 * `vitest.config.ts` emulates `prefers-reduced-motion: reduce` for every
 * test, so the assertion below is the rendered result rather than a
 * class-name check: `animation-name` resolves to `none` while `data-open` is
 * still on the popup. Against the bare class it read `"enter"`.
 */
export const ReducedMotion: Story = {
  args: {
    workspaces: TEAM_WORKSPACES,
    currentId: "design",
    onSelect: () => {},
    onCreate: () => {},
  },
  play: async ({ canvasElement }) => {
    const menu = await openMenu(canvasElement);
    await expect(menu).toHaveAttribute("data-open");
    await expect(getComputedStyle(menu).animationName).toBe("none");
  },
};

/**
 * Keyboard traversal of the open menu, which is **not** a tab walk. This is a
 * composite widget: Base UI gives the popup a roving tabindex, so the menu is
 * one stop from the outside and the arrow keys move within it. Tabbing
 * through four workspaces would be the bug, not the contract.
 *
 * What it pins:
 *
 * 1. The trigger is reachable and opens on `Enter`.
 * 2. Arrow-down walks every row exactly once and wraps — three workspaces
 *    then the create action, in that order, which is the spec's "creation is
 *    always last" made mechanical rather than visual.
 * 3. Every stop is visibly focused. The treatment is a filled row
 *    (`focus:bg-accent`), not a ring: inside a popup padded `p-1` a 2px ring
 *    would be clipped by the popup's own edge, and a fill is what every menu
 *    implementation uses. The assertion checks `:focus-visible` and then that
 *    the row actually paints — an opaque background rather than the popup's
 *    own — so it fails if the fill is ever dropped for a ring that cannot be
 *    seen.
 * 4. `Escape` closes the menu **and returns focus to the trigger**. Without
 *    that half a keyboard user who opens the switcher lands back at the top
 *    of the document and has to re-traverse the shell to get home.
 *
 * The walk settles before every read. Focus inside a Base UI portal is moved
 * through `enqueueFocus`, which defers to a `requestAnimationFrame`, so
 * reading `document.activeElement` the instant a key event resolves is a race
 * against the library rather than a measurement of this component — and the
 * failure is silent, because an unsettled read counts a miss and the next key
 * steps over the row the redirect had just landed on. One lap with a settle
 * before each read makes the count provable instead of generous. See
 * `TaskTray.stories.tsx`, where the budgeted form reached six of seven stops
 * in CI while passing on every local run.
 */
export const KeyboardOrder: Story = {
  args: {
    workspaces: TEAM_WORKSPACES,
    currentId: "design",
    onSelect: () => {},
    onCreate: () => {},
  },
  play: async ({ canvasElement }) => {
    const trigger = canvasElement.querySelector<HTMLElement>(
      "[data-slot='workspace-switcher-trigger']",
    )!;

    await userEvent.tab();
    await expect(document.activeElement).toBe(trigger);
    await userEvent.keyboard("{Enter}");

    const menu = await screen.findByRole("menu");
    const stops = Array.from(
      menu.querySelectorAll<HTMLElement>("[role='menuitemradio'], [role='menuitem']"),
    );
    // Three workspaces, then creation. A fifth means something new landed in
    // the menu; a fourth in a different position means creation stopped being
    // last, which is the one ordering rule the spec states outright.
    await expect(stops).toHaveLength(4);
    // Identified by accessible name, not by text: the avatar is
    // `aria-hidden`, so its initials are in `textContent` and out of the
    // name — and a name lookup is also the check no gate performs, since
    // `getByRole` throws rather than picking one if two rows ever end up
    // named the same.
    const row = (name: RegExp) => within(menu).getByRole("menuitemradio", { name });
    await expect(stops[0]).toBe(row(/^Personal/));
    await expect(stops[1]).toBe(row(/^Design team/));
    await expect(stops[2]).toBe(row(/^Research/));
    await expect(stops[3]).toBe(within(menu).getByRole("menuitem", { name: "Create workspace" }));

    // Roving tabindex: exactly one row is tabbable, which is what makes the
    // menu a single stop from outside. Lose it and a five-workspace switcher
    // becomes five tab stops on the way past the sidebar.
    await expect(stops.filter((el) => el.getAttribute("tabindex") === "0")).toHaveLength(1);
    await expect(stops.filter((el) => el.getAttribute("tabindex") === "-1")).toHaveLength(3);

    // What a row paints when it is *not* focused. The fill assertion below is a
    // *change* from this value, and `expectPerceptibleFocus` refuses to judge a
    // fill without it — "paints a background" is true of plenty of elements
    // that show no focus treatment at all, which is exactly the vacuous shape
    // the helper exists to close. Read off the resting siblings, because the
    // row Base UI focuses on open has already changed by the time this runs.
    const restingBackgrounds = new Set(
      stops
        .filter((el) => el !== document.activeElement && !el.contains(document.activeElement))
        .map((el) => getComputedStyle(el).backgroundColor),
    );
    await expect([...restingBackgrounds]).toHaveLength(1);
    const [restingBackground] = restingBackgrounds;

    const nameOf = (el: Element | null) =>
      el === null
        ? "nothing"
        : `stop#${stops.indexOf(el as HTMLElement)} ${el.textContent?.trim().slice(0, 24) ?? ""}`;

    /**
     * The focused row, once the key press has actually been applied.
     *
     * The portal-settle idiom from `TaskTray.stories.tsx` is "wait until
     * `document.activeElement` is one of the expected stops" — and that
     * condition is *not sufficient here*, which is worth the extra paragraph
     * because it is the same bug wearing different clothes. A tab walk leaves
     * the stop set between stops (it lands on Base UI's focus guard), so
     * "is a stop" doubles as "has settled". Arrow navigation inside a
     * composite never leaves the set: read too early and the previous row is
     * still focused, still a stop, and the settle returns it. The walk then
     * compares row *n* against the expectation for row *n+1* — caught here as
     * a wrap-around that reported the last row instead of the first, in a run
     * whose timing happened to differ.
     *
     * So the wait is for focus to have *moved*, not merely to be somewhere
     * plausible. If it never moves, this times out and says so.
     */
    const settledStop = async (previous?: HTMLElement) => {
      await waitFor(() => {
        const active = document.activeElement;
        if (!stops.includes(active as HTMLElement)) {
          throw new Error(`focus is not on one of the menu's rows: ${nameOf(active)}`);
        }
        if (previous && active === previous) {
          throw new Error(`focus has not moved off ${nameOf(previous)} yet`);
        }
      });
      return document.activeElement as HTMLElement;
    };

    const assertVisiblyFocused = async (el: HTMLElement) => {
      const id = nameOf(el);
      await expect(`${id} focusVisible=${el.matches(":focus-visible")}`).toBe(
        `${id} focusVisible=true`,
      );
      // The row paints: a fill of its own, rather than showing the popup
      // through. `bg-accent` is the treatment; a background unchanged from the
      // resting one measured above means the focused row is indistinguishable
      // from its neighbours.
      await expectPerceptibleFocus(el, { label: id, restingBackground });
    };

    const start = await settledStop();
    await assertVisiblyFocused(start);

    // Exactly one lap: every settled arrow-down moves by one row, so
    // `stops.length - 1` presses visit the rest. `repeat` still earns its
    // place next to the settle — the settle proves focus left the row it was
    // on, this proves it did not land on one already visited.
    const seen = new Set<HTMLElement>([start]);
    let previous = start;
    for (let i = 1; i < stops.length; i += 1) {
      await userEvent.keyboard("{ArrowDown}");
      const focused = await settledStop(previous);
      await expect(`${nameOf(focused)} repeat=${seen.has(focused)}`).toBe(
        `${nameOf(focused)} repeat=false`,
      );
      await assertVisiblyFocused(focused);
      seen.add(focused);
      previous = focused;
    }
    await expect(seen.size).toBe(stops.length);

    // The lap closes rather than dead-ending on the create row.
    await userEvent.keyboard("{ArrowDown}");
    await expect(nameOf(await settledStop(previous))).toBe(nameOf(start));

    // Escape dismisses, and the trigger gets the ring back — visibly, not
    // only programmatically. Focus returning to an element that paints
    // nothing strands a keyboard user exactly as badly as focus going to the
    // top of the document.
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("menu")).toBeNull());
    await waitFor(() => expect(document.activeElement).toBe(trigger));
    await expect(trigger.matches(":focus-visible")).toBe(true);
    await expectPerceptibleFocus(trigger, { label: "trigger (after Escape)" });
  },
};

/**
 * `currentId` / `onSelect` is a real controlled pair, and this is the only
 * place that fact is checked rather than asserted in prose — the docs
 * module's third pitfall says the app owns `currentId`, and a consumer who
 * skips it ships a switcher that closes and changes nothing.
 *
 * The host below is deliberately a rejecting one: it records the request and
 * re-renders with `currentId` unmoved. That separates the three things a
 * consumer has to trust:
 *
 * 1. **Interaction alone does not move the rendered value.** Picking another
 *    workspace closes the menu and leaves the trigger reading the old one.
 * 2. **The callback hands back what is needed to apply it** — the workspace's
 *    `id`, the same string the host puts back into `currentId`.
 * 3. **An unchanged `currentId` holds it fixed across re-renders.** The
 *    counter is checked to have advanced before the trigger is checked not
 *    to have, so the assertion cannot pass by the re-render never happening.
 *
 * Then Apply feeds the payload back and both the trigger and the checked row
 * move together — the checked row being the half a caller cannot see without
 * reopening the menu, which is where a half-applied switch would hide.
 */
export const Controlled: Story = {
  args: {
    workspaces: TEAM_WORKSPACES,
    currentId: "personal",
    onSelect: () => {},
  },
  render: () => <RejectingHost />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const triggerName = canvasElement.querySelector<HTMLElement>(
      "[data-slot='workspace-switcher-trigger-name']",
    )!;
    await expect(triggerName).toHaveTextContent("Personal");

    const menu = await openMenu(canvasElement);
    await userEvent.click(await within(menu).findByRole("menuitemradio", { name: /Design team/ }));
    await waitFor(() => expect(screen.queryByRole("menu")).toBeNull());

    // 1. The menu closed and the context did not change.
    await expect(triggerName).toHaveTextContent("Personal");
    // 2. …but the callback fired, with the id the host needs.
    await expect(canvas.getByTestId("requested")).toHaveTextContent("design");

    // 3. Re-render with `currentId` unchanged. Prove the re-render happened
    //    before reading the trigger, so the check after it is not vacuous.
    await expect(canvas.getByTestId("render-pass")).toHaveTextContent("1");
    await userEvent.click(canvas.getByRole("button", { name: "Re-render" }));
    await expect(canvas.getByTestId("render-pass")).toHaveTextContent("2");
    await expect(triggerName).toHaveTextContent("Personal");

    // The payload was sufficient to apply the switch — trigger and checked
    // row both follow the prop.
    await userEvent.click(canvas.getByRole("button", { name: "Apply" }));
    await expect(triggerName).toHaveTextContent("Design team");

    const reopened = await openMenu(canvasElement);
    await expect(
      await within(reopened).findByRole("menuitemradio", { name: /Design team/ }),
    ).toHaveAttribute("aria-checked", "true");
    await expect(within(reopened).getByRole("menuitemradio", { name: /Personal/ })).toHaveAttribute(
      "aria-checked",
      "false",
    );
  },
};

function RejectingHost() {
  const [applied, setApplied] = React.useState("personal");
  const [requested, setRequested] = React.useState<string | null>(null);
  const [pass, setPass] = React.useState(1);

  return (
    <div className="flex w-full max-w-sm flex-col gap-4">
      <WorkspaceSwitcher
        workspaces={TEAM_WORKSPACES}
        currentId={applied}
        onSelect={setRequested}
      />

      <dl className="text-foreground grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs">
        <dt>currentId prop</dt>
        <dd data-testid="applied">{applied}</dd>
        <dt>last onSelect</dt>
        <dd data-testid="requested">{requested ?? "—"}</dd>
        <dt>host render pass</dt>
        <dd data-testid="render-pass" className="tabular-nums">
          {pass}
        </dd>
      </dl>

      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={() => setPass((n) => n + 1)}>
          Re-render
        </Button>
        <Button size="sm" disabled={!requested} onClick={() => requested && setApplied(requested)}>
          Apply
        </Button>
      </div>
    </div>
  );
}

/**
 * The optional slots emptied, which for this component is one situation
 * rather than two — and it is the one the docs module's usage note warns
 * about, rendered.
 *
 * `plan` and `description` are the only optional text this component draws.
 * Emptying `plan` is quiet: no badge on the trigger, no trailing text on the
 * row, and the name still carries the accessible name, so there is no
 * unlabelled target to find. Emptying `description` is not quiet, because it
 * is not a per-row switch: **one** workspace carrying a description pushes
 * **every** row through `EntityRow`, and the rows that have nothing to put
 * there render a title alone in a layout built for two lines.
 *
 * `EntityRow` has a defence against exactly that — a `min-h-14` whose comment
 * says it exists "so a menu of mixed rows never looks ragged" — and this
 * component overrides it with `min-h-0 py-1.5`, correctly, because 56px menu
 * rows would make a five-workspace menu taller than the viewport. The two
 * decisions are both right and they cancel: a mixed list is ragged. That is
 * the argument for the docs module's "pick one shape for your data up front",
 * and this is where it is visible instead of asserted.
 *
 * Recorded, not fixed: the raggedness is the honest rendering of mixed data,
 * not a bug to paper over. A component that faked a description would be
 * worse.
 */
export const EmptyLabel: Story = {
  args: {
    workspaces: [
      { id: "personal", name: "Personal" },
      { id: "design", name: "Design team", description: "Shared drafts, review queue and specs" },
      { id: "research", name: "Research" },
    ],
    currentId: "personal",
    onSelect: () => {},
    onCreate: () => {},
  },
  play: async ({ canvasElement }) => {
    const menu = await openMenu(canvasElement);

    // No plan anywhere, so no badge on the trigger — and the name is still
    // the trigger's accessible name.
    await expect(
      canvasElement.querySelector("[data-slot='workspace-switcher-plan-badge']"),
    ).toBeNull();

    // One description switched all three rows into entity-row rendering.
    const rows = within(menu).getAllByRole("menuitemradio");
    await expect(rows).toHaveLength(3);
    for (const row of rows) {
      await expect(row.querySelector("[data-slot='entity-row']")).not.toBeNull();
    }
    // …and the two without one are shorter than the one with, which is the
    // raggedness the description above is about.
    const described = rows[1].getBoundingClientRect().height;
    await expect(rows[0].getBoundingClientRect().height).toBeLessThan(described);
    await expect(rows[2].getBoundingClientRect().height).toBeLessThan(described);
  },
};

/**
 * An 85-character workspace name, which is what arrives the first time a team
 * names a workspace after the work rather than after itself.
 *
 * The answer is truncation at both sizes, and they are two different caps.
 * The trigger is `max-w-64` with `truncate` on the name, so the topbar can
 * never be widened by a workspace name — the ellipsis lands at 256px however
 * long the name is. The menu is a fixed `w-72`, four rem wider, with
 * `truncate` on the row name, so the same name is cut at a different point in
 * the two places it appears. Neither wraps, which is the right call for a
 * control that has to hold a fixed slot in a shell.
 *
 * The cost is that two long names sharing a prefix are indistinguishable on
 * the trigger, and the menu is the only place they can be told apart — which
 * is the argument for the `description` slot rather than for longer names.
 * In entity-row mode the same truncation applies twice over, to the title and
 * to the description, from `EntityRow`'s own `truncate`.
 */
export const LongContent: Story = {
  args: {
    workspaces: [
      {
        id: "brand-refresh",
        name: "Marketing — Q3 brand refresh, localisation, support handover, and the archive cleanup",
        plan: "Pro",
      },
      { id: "personal", name: "Personal", plan: "Free" },
    ],
    currentId: "brand-refresh",
    onSelect: () => {},
    onCreate: () => {},
  },
  play: async ({ canvasElement }) => {
    const triggerName = canvasElement.querySelector<HTMLElement>(
      "[data-slot='workspace-switcher-trigger-name']",
    )!;
    // Truncated, not wrapped: the box is narrower than its content and the
    // trigger is one line tall.
    await expect(triggerName.scrollWidth).toBeGreaterThan(triggerName.clientWidth);

    const menu = await openMenu(canvasElement);
    const row = await within(menu).findByRole("menuitemradio", { name: /brand refresh/ });
    const rowName = within(row).getByText(/^Marketing — Q3/);
    await expect(rowName.scrollWidth).toBeGreaterThan(rowName.clientWidth);
    // Two different caps: the menu is wider than the trigger's 256px.
    await expect(rowName.clientWidth).toBeGreaterThan(triggerName.clientWidth);
  },
};

/**
 * 375px, and the honest note first: only the trigger is wrapper-constrained.
 * `DropdownMenuContent` portals to the end of `document.body` and positions
 * itself against the viewport, so no ancestor in the story canvas reaches it.
 * The play function measures both halves against 375 instead, which is the
 * fact that actually matters — a switcher whose menu is wider than the phone
 * it opens on is the failure this story exists to prevent.
 *
 * Both fit, and neither by accident: the trigger's `max-w-64` caps it at
 * 256px however long the workspace name is (see `LongContent`), and the menu
 * is a fixed `w-72`, 288px, which leaves 87px of room at this width. The
 * `w-72` is what makes it safe — the popup's own default is
 * `w-(--anchor-width)`, and a trigger-width menu in a full-width mobile
 * topbar would be a menu the width of the screen.
 */
export const Mobile: Story = {
  args: {
    workspaces: TEAM_WORKSPACES,
    currentId: "design",
    onSelect: () => {},
    onCreate: () => {},
  },
  render: (args) => (
    <div className="w-[375px] max-w-full">
      <WorkspaceSwitcher {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const trigger = canvasElement.querySelector<HTMLElement>(
      "[data-slot='workspace-switcher-trigger']",
    )!;
    await expect(trigger.getBoundingClientRect().width).toBeLessThanOrEqual(375);

    const menu = await openMenu(canvasElement);
    await expect(menu.getBoundingClientRect().width).toBeLessThanOrEqual(375);
  },
};

/**
 * The two dropdowns that live in the same topbar, drawn the same way, doing
 * opposite jobs. Both are an avatar plus a menu; the rule is **what the menu
 * is about**:
 *
 * - **Workspace switcher** changes what everything else on the screen is
 *   showing. Its rows are a radio group — exactly one checked, always — and
 *   the choice is context that persists until it is changed again. The one
 *   action it carries, creating a workspace, is separated below a rule
 *   precisely so it cannot be mistaken for another row of the list.
 * - **`account-menu` (B8)** acts on you, not on the workspace: profile,
 *   settings, sign out. It is a list of actions with nothing checked, and
 *   each row is done the moment it is picked. Its own radio group — theme —
 *   is a preference, and it is deliberately a level down in a submenu rather
 *   than a peer of the actions.
 *
 * The one-line test: **if picking a row changes what the rest of the screen
 * is about, it is the switcher; if it changes something about you, it is the
 * account menu.** A "Settings" row belongs in the account menu even when the
 * settings are the workspace's, because the user got there by asking about
 * their own tools.
 *
 * Both are rendered closed, which is not a shortcut. Neither exposes an
 * `open` prop, so only one can be opened at a time and it is opened by a
 * click; and a popup portals to the end of `document.body` and positions over
 * the canvas rather than beside it, so an open menu covers its neighbour
 * instead of standing next to it. The only arrangement that shows both is the
 * one a product actually ships — two triggers, one topbar — and the whole
 * point of this comparison is that the difference has to be legible *before*
 * either is opened, which is exactly the reader's problem.
 */
export const Boundary: Story = {
  args: {
    workspaces: TEAM_WORKSPACES,
    currentId: "design",
    onSelect: () => {},
    onCreate: () => {},
  },
  render: (args) => (
    <div className="flex w-full max-w-lg flex-col gap-6">
      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">
          Workspace switcher — changes what you are looking at
        </p>
        <WorkspaceSwitcher {...args} />
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">
          Account menu — changes something about you
        </p>
        <AccountMenu
          user={{ name: "Ada Lovelace", email: "ada@example.com" }}
          items={[{ label: "Settings", shortcut: ["⌘", ","] }]}
          theme="system"
          onThemeChange={() => {}}
          background="default"
          onBackgroundChange={() => {}}
          onSignOut={() => {}}
        />
      </section>
    </div>
  ),
};
