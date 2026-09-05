import type { Meta, StoryObj } from "@storybook/react-vite";
import { Eraser, Image as ImageIcon, Maximize2, RefreshCw, Sparkles, Trash2, Wand2 } from "lucide-react";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { Button } from "@/components/ui/button";
import { ActionStack } from "@/registry/super-ai/action-stack";
import { AiToolsMenu, type AiToolGroup, type ToolSelection } from "@/registry/super-ai/ai-tools-menu";
import { AiToolsMenuDocs } from "@/content/components/ai-tools-menu.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const SELECTION: ToolSelection = {
  label: "Hero shot, layer 3",
  type: "Image",
  icon: <ImageIcon aria-hidden className="size-4" />,
};

const EDIT: AiToolGroup = {
  id: "edit",
  label: "Edit this image",
  actions: [
    {
      id: "remove-bg",
      title: "Remove background",
      description: "Cut the subject out",
      icon: <Eraser aria-hidden className="size-4" />,
    },
    {
      id: "expand",
      title: "Magic expand",
      description: "Paint beyond the frame",
      icon: <Maximize2 aria-hidden className="size-4" />,
      cost: { amount: 17 },
    },
  ],
};

const GENERATE: AiToolGroup = {
  id: "generate",
  label: "Generate from it",
  actions: [
    {
      id: "variations",
      title: "Variations",
      description: "Four more like this",
      icon: <Sparkles aria-hidden className="size-4" />,
      cost: { amount: 55 },
    },
    {
      id: "restyle",
      title: "Restyle",
      description: "Available on Studio",
      icon: <Wand2 aria-hidden className="size-4" />,
      cost: { amount: 900, per: "min" },
      locked: true,
    },
  ],
};

const CAREFUL: AiToolGroup = {
  id: "careful",
  label: "Costly or irreversible",
  destructive: true,
  actions: [
    {
      id: "regenerate",
      title: "Regenerate from scratch",
      description: "Discards every edit on this layer",
      icon: <RefreshCw aria-hidden className="size-4" />,
      cost: { amount: 2400 },
    },
    {
      id: "clear",
      title: "Clear the layer",
      description: "Cannot be undone",
      icon: <Trash2 aria-hidden className="size-4" />,
    },
  ],
};

const meta: Meta<typeof AiToolsMenu> = {
  title: "Super AI/Ai Tools Menu",
  component: AiToolsMenu,
  parameters: { layout: "centered", docs: { page: componentDocsPage(AiToolsMenuDocs) } },
  decorators: [
    (Story) => (
      <div className="w-96 max-w-full">
        <Story />
      </div>
    ),
  ],
  args: { onAction: () => {}, presentation: "inline", className: "rounded-lg border p-1" },
};

export default meta;
type Story = StoryObj<typeof AiToolsMenu>;

/** Grouped by intent and scoped to the selected object — the selection is the prompt context. */
export const GroupedRows: Story = {
  args: { selection: SELECTION, groups: [EDIT, GENERATE] },
};

/** Each row carries a cost chip where the action spends, including the rate form. */
export const CostChips: Story = {
  args: { selection: SELECTION, groups: [GENERATE] },
};

/** Expensive or irreversible options below a rule, and never signalled by colour alone. */
export const DestructiveGroup: Story = {
  args: { selection: SELECTION, groups: [EDIT, CAREFUL] },
};

/* -------------------------------------------------------------------------
 * Case stories — the situations this component meets in a product, as
 * opposed to the prop combinations above. See
 * docs/design-system/story-conventions.md.
 *
 * This component has two presentations and they are two different keyboard
 * surfaces, so each case story below says which one it renders and why that
 * is the one where the fact lives. `menu` is a portaled Base UI popup with a
 * roving arrow walk; `inline` is a flat column of `<button>` rows in the page
 * flow. The declared-state stories above are all `inline`, which is why the
 * popup had never been opened under axe before this block existed.
 *
 * Not written for this component, deliberately:
 *
 * // case-skip: Controlled — onAction(id) reports a pick; there is no value or open state to hold
 * `AiToolsMenuProps` has no `value`/`onChange` pair and no `open`/
 * `onOpenChange` pair. `onAction` fires with the chosen action's id so a host
 * can run it elsewhere; nothing in this surface carries a selected state a
 * parent could hold, and `groups`/`selection` are inputs the host derives
 * from what is selected rather than state this component reports back. The
 * `DropdownMenu` in menu mode owns its own open state internally with no prop
 * to lift it, which is a real limit rather than a controlled pair — recorded
 * in the report, because a host that changes the selection behind an open
 * menu cannot close it. Same reasoning as `suggestion-chips`: a callback that
 * reports a pick is not a controlled API.
 * ---------------------------------------------------------------------- */

/**
 * Right-to-left, inline, where every part of the row is on screen at once.
 *
 * Three things mirror and one deliberately does not. The row is A9
 * `entity-row`, which is `flex … text-start` with no physical side named, so
 * the icon leads at the right and the trailing slot — cost chip, then the
 * word Locked — moves to the visual left. The selection header and the group
 * labels follow the same rule. What holds still is the price itself: A2
 * `cost-chip` marks its amount `dir="ltr"`, so "900 credits/min" stays a
 * left-to-right island inside a right-to-left row rather than being reordered
 * into "min/credits 900". The play function measures both, because reading
 * the classes cannot tell you which way a bidi run actually resolved.
 *
 * Menu mode is not rendered here. Its popup portals to the end of
 * `document.body`, so it needs the document-level `dir` idiom rather than a
 * wrapper, and what it would add is the shared dropdown chrome that
 * `account-menu`'s RTL story already records against
 * `components/ui/dropdown-menu.tsx` — a component this one consumes and does
 * not own.
 */
export const RTL: Story = {
  args: { selection: SELECTION, groups: [EDIT, GENERATE, CAREFUL] },
  render: (args) => (
    <div dir="rtl">
      <AiToolsMenu {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const root = canvas.getByRole("group", { name: "AI tools for Hero shot, layer 3" });
    await expect(getComputedStyle(root).direction).toBe("rtl");

    // The trailing slot sits at the row's logical end, which is the visual
    // left here. Against a physical `ml-auto` or `pl-` this reads the other
    // way round, which is the whole point of measuring it.
    const locked = root.querySelector<HTMLElement>("[data-locked]")!;
    const title = locked.querySelector<HTMLElement>('[data-slot="entity-row-title"]')!;
    const trailing = locked.querySelector<HTMLElement>('[data-slot="entity-row-trailing"]')!;
    await expect(
      `trailing left of title: ${trailing.getBoundingClientRect().left < title.getBoundingClientRect().left}`,
    ).toBe("trailing left of title: true");

    // …and the price inside it does not mirror. A2 pins the amount to LTR so
    // the number keeps leading its unit.
    const amount = locked.querySelector<HTMLElement>('[data-slot="cost-chip-amount"]')!;
    await expect(getComputedStyle(amount).direction).toBe("ltr");
    await expect(amount).toHaveTextContent("900 credits/min");
  },
};

/**
 * The reduced-motion branch, in menu mode, because that is the only place
 * this component moves anything.
 *
 * `DropdownMenuContent` opens with `data-open:animate-in fade-in-0 zoom-in-95`
 * and closes with `data-closed:animate-out`, none of which reads the media
 * feature. The registry's usual one-class remedy — a bare
 * `motion-reduce:animate-none` — is **inert on a Base UI popup**: Tailwind v4
 * wraps the data-attribute test in `:where(…)`, so both sides carry the same
 * single-class specificity and the tie falls to source order, which emits the
 * plain `motion-reduce:` block first and hands the win to `animation: enter`.
 * Measured here before the fix, the popup's computed `animation-name` read
 * `"enter"` under emulated reduce. Restating
 * the variant on both halves at this component's own call site
 * (`motion-reduce:data-open:animate-none`, and the `data-closed` twin) sorts
 * after its counterpart and wins the same tie. That is the `shortcuts-sheet`
 * finding applied to the third popup family, and it is why the assertion
 * below reads `animation-name` back rather than checking for the class.
 *
 * Nothing in inline mode needs the same treatment. The only `transition-*` in
 * the tree is `entity-row`'s `transition-colors` on an interactive row, which
 * crossfades a background and a text colour and moves nothing — the
 * `reset-affordance` case in story-conventions.md, where suppressing it would
 * document a branch nobody can perceive.
 *
 * Not covered, and shared with every other menu in the registry: the popup
 * still runs `duration-100` and the `slide-in-from-*` translate that
 * `data-open:animate-in` composes, both of which live in
 * `components/ui/dropdown-menu.tsx`. Suppressing the animation suppresses the
 * translate with it, which is why the single assertion is enough here.
 */
export const ReducedMotion: Story = {
  args: {
    selection: SELECTION,
    groups: [EDIT, GENERATE],
    presentation: "menu",
    className: "",
    trigger: <Button variant="outline">AI tools</Button>,
  },
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("button", { name: "AI tools" }));
    const menu = await within(document.body).findByRole("menu");

    // Still opening — the attribute the animation is keyed off is on the
    // element, so this is the frame the bare class fails to reach.
    await expect(menu).toHaveAttribute("data-open");
    await expect(getComputedStyle(menu).animationName).toBe("none");
  },
};

/**
 * The keyboard contract of the menu presentation, which is the one a product
 * actually opens from a context toolbar — I3 `context-toolbar`'s AI entry
 * always opens this.
 *
 * What it pins:
 *
 * 1. The component contributes exactly one tab stop to the page: the trigger.
 *    Everything inside the popup is a roving-tabindex row reached with arrow
 *    keys, which is correct for a `role="menu"` and is why the exemplar's
 *    "tab until you leave the canvas" walk is the wrong instrument here.
 * 2. `ArrowDown` opens the menu and one lap of `ArrowDown` visits every row
 *    exactly once and wraps to the first. The walk is a lap, not a budget, and
 *    each read waits for focus to leave the row it was on rather than for
 *    focus to be on *some* row — the weaker wait passed thirteen runs here and
 *    failed the first one against a cleared Storybook cache, reading the
 *    previous row back and reporting a lap that never closed. See
 *    `settledStop`.
 * 3. **The locked row stays in the walk.** It is `aria-disabled`, not removed,
 *    so the capability you would be upgrading for is reachable from the
 *    keyboard rather than invisible to it. That is the claim in the docs
 *    module's keyboard notes and it is only true because Base UI keeps
 *    disabled menu items focusable; a primitive swap that dropped them would
 *    silently delete a row from this walk.
 * 4. Every row has a distinct accessible name, checked by looking each one up
 *    by name so a duplicate throws rather than passing quietly.
 * 5. The walk crosses the rule between the safe group and the destructive one
 *    without an extra stop. That is correct menu behaviour and it is also the
 *    gap the docs module names: the rule and the group heading are both
 *    `aria-hidden` chrome, so position is a sighted signal. Asserted here so
 *    that the day it stops being true is a visible change rather than a
 *    silent one.
 * 6. Escape closes the menu **and returns focus to the trigger** — the AI
 *    entry on the toolbar, which is where the next selection is made.
 *
 * **Defect this story found, recorded rather than pinned: a keyboard-focused
 * row in menu mode has no perceptible focus treatment.** Measured here, the
 * focused row and a resting row differ in exactly one computed value:
 *
 *     focused   background rgba(0, 0, 0, 0)   outline none   box-shadow none   title oklch(0.205 0 0)
 *     resting   background rgba(0, 0, 0, 0)   outline none   box-shadow none   title oklch(0.145 0 0)
 *
 * Two near-black greys on the same popover surface. `DropdownMenuItem`
 * normally paints `focus:bg-accent`, which is the treatment `account-menu`
 * measures its own walk against; this component overrides it with
 * `focus:bg-transparent` so A9's composed `text-muted-foreground` description
 * is never left sitting on an accent surface. What survives the override is
 * `focus:text-accent-foreground` on the item's descendants, and that is a text
 * colour, not a focus indicator.
 *
 * The measurement is worth taking rather than reading off the class list,
 * because `outline-hidden` leaves a decoy behind. `outline-style` reads `none`
 * on the focused row and on the resting one, while `outline-width` reads `1px`
 * focused against `3px` resting — a difference that paints nothing, since the
 * style is `none` either way. Anything checking a width, or checking that the
 * classes are present, would report a treatment here. The walk below asserts
 * `:focus-visible` and stops there, because the honest alternative is an
 * assertion that expects the wrong thing.
 *
 * F4 `action-stack` carries the identical override on the identical row, so
 * this is one decision for both — the shared row the docs module's last
 * pitfall already asks for, not a change to this file.
 */
export const KeyboardOrder: Story = {
  args: {
    selection: SELECTION,
    groups: [EDIT, GENERATE, CAREFUL],
    presentation: "menu",
    className: "",
    trigger: <Button variant="outline">AI tools</Button>,
  },
  play: async ({ canvasElement }) => {
    const body = within(document.body);
    const trigger = within(canvasElement).getByRole("button", { name: "AI tools" });

    // One tab stop in the page. The menu adds none, by design.
    const canvasStops = Array.from(
      canvasElement.querySelectorAll<HTMLElement>(
        'button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      ),
    );
    await expect(canvasStops).toEqual([trigger]);

    await userEvent.tab();
    await expect(document.activeElement).toBe(trigger);
    await expect(trigger.matches(":focus-visible")).toBe(true);
    const triggerStyle = getComputedStyle(trigger);
    await expect(
      `trigger ring=${triggerStyle.boxShadow !== "none" || triggerStyle.outlineStyle !== "none"}`,
    ).toBe("trigger ring=true");

    await userEvent.keyboard("{ArrowDown}");
    const menu = await body.findByRole("menu", { name: "AI tools for Hero shot, layer 3" });
    const stops = Array.from(menu.querySelectorAll<HTMLElement>('[role="menuitem"]'));

    // Six actions across three groups. The selection header and the three
    // group headings are chrome and must not become rows.
    await expect(stops).toHaveLength(6);

    // The locked row is still one of them, marked rather than removed.
    const restyle = within(menu).getByRole("menuitem", { name: /Restyle/ });
    await expect(restyle).toHaveAttribute("aria-disabled", "true");
    await expect(stops).toContain(restyle);

    // Distinct accessible names, computed the way a screen reader would: a
    // duplicate makes `getByRole` throw rather than silently pass.
    for (const name of [
      /Remove background/,
      /Magic expand/,
      /Variations/,
      /Restyle/,
      /Regenerate from scratch/,
      /Clear the layer/,
    ]) {
      await expect(within(menu).getByRole("menuitem", { name })).toBeInTheDocument();
    }

    const nameOf = (el: Element | null) =>
      el === null
        ? "nothing"
        : `stop#${stops.indexOf(el as HTMLElement)} ${el.textContent?.trim().slice(0, 24) ?? ""}`;

    /**
     * The focused row, once Base UI has finished moving focus off `previous`.
     *
     * Reading `document.activeElement` the instant a key event resolves races
     * the popup's own focus management — `TaskTray.stories.tsx` records the
     * general shape, and this story reproduced its own instance: on a cold
     * Storybook cache the closing `ArrowDown` was read before it had been
     * applied, so the lap appeared to end on the last row instead of wrapping
     * to the first. Waiting only for "focus is on some row" cannot see that,
     * because focus *was* on a row — the stale one.
     *
     * So the wait names the row focus has to leave. Each key press then either
     * moves by exactly one row or fails, which is what makes the lap a proof
     * rather than an allowance.
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

    const start = await settledStop();
    await expect(`${nameOf(start)} focusVisible=${start.matches(":focus-visible")}`).toBe(
      `${nameOf(start)} focusVisible=true`,
    );

    const seen = new Set<HTMLElement>([start]);
    let previous = start;
    for (let i = 1; i < stops.length; i += 1) {
      await userEvent.keyboard("{ArrowDown}");
      const focused = await settledStop(previous);
      await expect(`${nameOf(focused)} repeat=${seen.has(focused)}`).toBe(`${nameOf(focused)} repeat=false`);
      await expect(`${nameOf(focused)} focusVisible=${focused.matches(":focus-visible")}`).toBe(
        `${nameOf(focused)} focusVisible=true`,
      );
      seen.add(focused);
      previous = focused;
    }
    await expect(seen.size).toBe(stops.length);

    // The lap closes: the row after the last is the first again.
    await userEvent.keyboard("{ArrowDown}");
    await expect(nameOf(await settledStop(previous))).toBe(nameOf(start));

    // The rule between groups is not a stop. The row before the first
    // destructive action is the last generate-group action, with nothing
    // between them — which is what makes the crossing invisible to a keyboard
    // user, and why the group's name is the only thing that says otherwise.
    const groupOf = (row: HTMLElement) =>
      row.closest<HTMLElement>('[data-slot="ai-tools-menu-group"]')!.getAttribute("aria-label");
    const firstDestructive = stops.findIndex((row) => row.querySelector("[data-destructive]"));
    await expect(firstDestructive).toBeGreaterThan(0);
    await expect(groupOf(stops[firstDestructive - 1])).toBe("Generate from it");
    await expect(groupOf(stops[firstDestructive])).toBe("Costly or irreversible");

    // Escape dismisses, and the trigger gets the ring back.
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("menu")).toBeNull());
    await waitFor(() => expect(document.activeElement).toBe(trigger));
  },
};

/**
 * Everything optional left out: no `selection`, no group `label`, no row
 * `description`. Every title still renders, because `title` is the one
 * required string — so this is not an unlabelled-control story, it is the
 * story of what a caller loses by omission.
 *
 * Three things go quiet at once, and none of them is visible as a gap:
 *
 * - The surface's accessible name falls back to the bare "AI tools". Three
 *   objects on one canvas would then announce identically, which is the exact
 *   failure the component's selection-derived name exists to prevent.
 * - A group with actions and no `label` renders `role="group"` with no
 *   accessible name. It still divides the list visually — the rule is drawn
 *   between groups regardless — but it announces as an unlabelled boundary,
 *   and on a destructive group that label was the only non-positional signal
 *   there was.
 * - A row with no `description` keeps its height. A9 sets `min-h-14` so a
 *   description-less row matches one that has a description, which is what
 *   stops a mixed list looking ragged and is worth seeing beside the stories
 *   above.
 */
export const EmptyLabel: Story = {
  args: {
    groups: [
      {
        id: "edit",
        actions: [
          { id: "remove-bg", title: "Remove background", icon: <Eraser aria-hidden className="size-4" /> },
          {
            id: "expand",
            title: "Magic expand",
            icon: <Maximize2 aria-hidden className="size-4" />,
            cost: { amount: 17 },
          },
        ],
      },
      {
        id: "careful",
        destructive: true,
        actions: [{ id: "clear", title: "Clear the layer", icon: <Trash2 aria-hidden className="size-4" /> }],
      },
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // The generic name, which is the cost of omitting `selection`.
    await expect(canvas.getByRole("group", { name: "AI tools" })).toBeInTheDocument();
    // And the unnamed group inside it: present, dividing, announcing nothing.
    const unnamed = canvasElement.querySelector<HTMLElement>(
      '[data-slot="ai-tools-menu-group"][data-destructive]',
    )!;
    await expect(unnamed.hasAttribute("aria-label")).toBe(false);
    await expect(unnamed.previousElementSibling).toHaveAttribute("role", "separator");
  },
};

/**
 * A ~90 character action title and a description of its own beside a cost
 * chip — what happens the first time the row set is generated from a tool
 * registry instead of written by hand.
 *
 * The answer is a single clipped line each. A9 sets `truncate` on both
 * `entity-row-title` and `entity-row-description`, and the trailing slot is
 * `shrink-0`, so the chip holds its width and the text gives way. Nothing in
 * the row reveals the rest of the string: there is no tooltip, no wrap and no
 * second line, so a title that only differs after the ellipsis is two rows a
 * user cannot tell apart.
 *
 * The expensive row is the one carrying the long string on purpose. A
 * 2,400-credit action is the one where "which of these two did I click?"
 * matters most, and its chip is also the widest, so it is where the title has
 * least room to begin with.
 */
export const LongContent: Story = {
  args: {
    selection: {
      label: "Storyboard frame 12, background plate, second revision",
      type: "Image",
      icon: <ImageIcon aria-hidden className="size-4" />,
    },
    groups: [
      EDIT,
      {
        id: "careful",
        label: "Costly or irreversible",
        destructive: true,
        actions: [
          {
            id: "regenerate",
            title:
              "Regenerate this whole layer from scratch at the original prompt, seed and sampler settings",
            description: "Discards every edit made on this layer since it was created, including masks",
            icon: <RefreshCw aria-hidden className="size-4" />,
            cost: { amount: 2400 },
          },
        ],
      },
    ],
  },
  play: async ({ canvasElement }) => {
    const row = canvasElement.querySelector<HTMLElement>('[data-tool-action="regenerate"]')!;
    const clipped = (slot: string) => {
      const el = row.querySelector<HTMLElement>(`[data-slot="${slot}"]`)!;
      // One line, clipped: the box never grew to fit, and it never wrapped.
      return `${slot} clipped=${el.scrollWidth > el.clientWidth} lines=${Math.round(el.scrollHeight / parseFloat(getComputedStyle(el).lineHeight))}`;
    };
    await expect(clipped("entity-row-title")).toBe("entity-row-title clipped=true lines=1");
    await expect(clipped("entity-row-description")).toBe("entity-row-description clipped=true lines=1");
  },
};

/**
 * 375px, inline, which is the width this component is under most pressure at:
 * the row is carrying an icon, two lines of text and a cost chip on one line,
 * and the chip does not shrink.
 *
 * The row's answer is truncation rather than overflow, so the column does not
 * scroll sideways — asserted below, because "it fits" is the claim this story
 * exists to keep true and a regression in A9's `min-w-0` would break it
 * silently. Menu mode is not the interesting case at this width: the popup is
 * a fixed `w-80` (320px), so it clears 375 by design and would measure the
 * dropdown's width rather than the row's behaviour.
 */
export const Mobile: Story = {
  args: { selection: SELECTION, groups: [EDIT, GENERATE, CAREFUL] },
  render: (args) => (
    <div className="w-[375px] max-w-full">
      <AiToolsMenu {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="ai-tools-menu"]')!;
    await expect(`overflows=${root.scrollWidth > root.clientWidth}`).toBe("overflows=false");

    const titleOf = (id: string) =>
      root.querySelector<HTMLElement>(`[data-tool-action="${id}"] [data-slot="entity-row-title"]`)!;

    // The widest price in the set — the rate form — renders in full. It is
    // `shrink-0`, so nothing squeezes it.
    const widestChip = root.querySelector<HTMLElement>(
      '[data-tool-action="restyle"] [data-slot="cost-chip"]',
    )!;
    await expect(`chip clipped=${widestChip.scrollWidth > widestChip.clientWidth}`).toBe(
      "chip clipped=false",
    );

    // What gives instead is the text column, and by more than half: the row
    // carrying that chip hands over the width rather than overflowing. Every
    // title here still fits inside what is left, which is the claim — the
    // clipping starts at the lengths `LongContent` renders, not at this one.
    await expect(
      `text column halved=${titleOf("restyle").clientWidth < titleOf("clear").clientWidth / 2}`,
    ).toBe("text column halved=true");
    await expect(`title clipped=${titleOf("restyle").scrollWidth > titleOf("restyle").clientWidth}`).toBe(
      "title clipped=false",
    );
  },
};

/**
 * I4 beside F4 `action-stack`, which the spec calls "visually identical to I4
 * on purpose". They are the same rows, the same prop names and the same
 * locked behaviour, so the rule cannot be about appearance — it is about
 * **what the actions are attached to**:
 *
 * - **AI tools menu** attaches to a *selected object*. The selection is the
 *   prompt context, so the surface names it and takes its accessible name
 *   from it, and the host derives the row set from the object's type. Rows
 *   are grouped by intent, and the expensive or irreversible group sinks
 *   below a rule whatever order it was declared in.
 * - **Action stack** attaches to a *finished result*. There is nothing to
 *   name — the result is the thing you are looking at — so it is one flat
 *   list of what to do next, and its accessible name is the constant
 *   "Actions for this result".
 *
 * If the surface has to say what it is acting on, it is I4. If the answer is
 * always "this, the thing that just finished", it is F4. A third neighbour,
 * D6 `skill-menu`, shares the same A9 row and A2 chip again but chooses a
 * *capability* rather than an action on an object, and announces itself with
 * a search field — the one boundary here you can settle by looking, which is
 * why it is described rather than rendered.
 *
 * Both are rendered inline. In menu mode each is a portaled popup that would
 * land on top of the other rather than beside it, and an open Base UI menu
 * marks everything outside itself `aria-hidden` — a comparison the story
 * would have manufactured rather than shown.
 */
export const Boundary: Story = {
  render: () => (
    <div className="flex w-full flex-col gap-6">
      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">
          AI tools menu — actions on the selected object, grouped by intent
        </p>
        <AiToolsMenu
          presentation="inline"
          className="rounded-lg border p-1"
          selection={SELECTION}
          groups={[EDIT, CAREFUL]}
          onAction={() => {}}
        />
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">
          Action stack — what to do next with the result you are looking at
        </p>
        <ActionStack
          presentation="inline"
          className="rounded-lg border p-1"
          onAction={() => {}}
          actions={[
            {
              id: "upscale",
              title: "Upscale to 4K",
              description: "Same frame, four times the pixels",
              icon: <Maximize2 aria-hidden className="size-4" />,
              cost: { amount: 40 },
            },
            {
              id: "variations",
              title: "Variations",
              description: "Four more like this",
              icon: <Sparkles aria-hidden className="size-4" />,
              cost: { amount: 55 },
            },
            {
              id: "lip-sync",
              title: "Use in Lip sync",
              description: "Available on Studio",
              icon: <Wand2 aria-hidden className="size-4" />,
              cost: { amount: 900, per: "min" },
              locked: true,
            },
          ]}
        />
      </section>
    </div>
  ),
};
