import type { Meta, StoryObj } from "@storybook/react-vite";
import { Maximize2, Mic, Scissors, Sparkles, Wand2 } from "lucide-react";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { Button } from "@/components/ui/button";
import { ActionStack, type AssetAction } from "@/registry/super-ai/action-stack";
import { AiToolsMenu } from "@/registry/super-ai/ai-tools-menu";
import { ActionStackDocs } from "@/content/components/action-stack.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const VIDEO_ACTIONS: AssetAction[] = [
  {
    id: "extend",
    title: "Extend",
    description: "Add 4 seconds to the end",
    icon: <Scissors aria-hidden className="size-4" />,
    cost: { amount: 55 },
  },
  {
    id: "upscale",
    title: "Upscale",
    description: "To 4K, 24 fps",
    icon: <Maximize2 aria-hidden className="size-4" />,
    cost: { amount: 900, per: "min" },
  },
  {
    id: "restyle",
    title: "Restyle",
    description: "Apply a preset look",
    icon: <Wand2 aria-hidden className="size-4" />,
    cost: { amount: 17 },
  },
];

const IMAGE_ACTIONS: AssetAction[] = [
  { id: "variations", title: "Variations", description: "Four more like this", cost: { amount: 17 } },
  { id: "inpaint", title: "Inpaint", description: "Repaint a region", cost: { amount: 12 } },
];

/** The tier-gated hop, which is where the trailing slot carries two things at once. */
const LIP_SYNC: AssetAction = {
  id: "lipsync",
  title: "Use in Lip sync",
  description: "Available on Studio",
  icon: <Mic aria-hidden className="size-4" />,
  cost: { amount: 900, per: "min" },
  locked: true,
};

const meta: Meta<typeof ActionStack> = {
  title: "Super AI/Action Stack",
  component: ActionStack,
  parameters: { layout: "centered", docs: { page: componentDocsPage(ActionStackDocs) } },
  decorators: [
    (Story) => (
      <div className="w-96 max-w-full">
        <Story />
      </div>
    ),
  ],
  args: { onAction: () => {} },
};

export default meta;
type Story = StoryObj<typeof ActionStack>;

/** Hanging off a result card, behind the caller's own trigger. */
export const Menu: Story = {
  args: {
    actions: VIDEO_ACTIONS,
    presentation: "menu",
    trigger: <Button variant="outline">Use this result</Button>,
  },
};

/** As a panel in its own right. */
export const Inline: Story = {
  args: {
    actions: VIDEO_ACTIONS,
    presentation: "inline",
    className: "rounded-lg border p-1",
  },
};

/** Every row that bills carries its price — including the rate form. */
export const CostPerAction: Story = {
  args: {
    actions: IMAGE_ACTIONS,
    presentation: "inline",
    className: "rounded-lg border p-1",
  },
};

/** Locked rows stay visible with their cost, but cannot be chosen. */
export const LockedRows: Story = {
  args: {
    presentation: "inline",
    className: "rounded-lg border p-1",
    actions: [
      ...IMAGE_ACTIONS,
      {
        id: "lipsync",
        title: "Use in Lip sync",
        description: "Available on Studio",
        icon: <Mic aria-hidden className="size-4" />,
        cost: { amount: 120 },
        locked: true,
      },
    ],
  },
};

/**
 * A focus ring that is actually visible, rather than one that is merely not
 * the string "none".
 *
 * The wave's shared check is `boxShadow !== "none" || outlineStyle !== "none"`,
 * and CONTINUE.md §8 records that both halves have produced false positives:
 * a fully transparent zero-size shadow satisfies the first, and an `sr-only`
 * input's UA outline satisfies the second. This component supplies a third
 * instance of the decoy wave 1 measured on I4's menu row: A9's own
 * `focus-visible:outline-none` leaves `outline-width` reading `1px` while
 * `outline-style` reads `none`, so anything checking a width sees a treatment
 * that paints nothing. So the shadow layers are split apart and the first one
 * that is neither transparent nor zero-spread is returned, which is the ring a
 * person would actually see.
 */
function visibleRing(el: Element): string {
  const shadow = getComputedStyle(el).boxShadow;
  if (shadow === "none" || shadow === "") return "none";
  const layers = shadow.split(/,(?![^(]*\))/);
  const painted = layers.find(
    (layer) => !layer.includes("rgba(0, 0, 0, 0)") && !/\b0px\s*$/.test(layer.trim()),
  );
  if (!painted) return "none";
  const spread = painted.trim().split(/\s+/).pop();
  return `${spread} spread, opaque`;
}

/* -------------------------------------------------------------------------
 * Case stories — the situations this component meets in a product, as
 * opposed to the prop combinations above. See
 * docs/design-system/story-conventions.md.
 *
 * This component is I4 `ai-tools-menu` with the selection taken away, which
 * the spec says on purpose ("visually identical to I4 … because conceptually
 * they are the same thing"). I4's case stories landed first, so the stories
 * below deliberately do **not** re-derive what that file settled — the row
 * mirroring, the LTR price island, the popup's reduced-motion tie-break and
 * the menu-mode arrow lap are cited there and measured here only where F4's
 * own shape changes the answer. What is F4's and not I4's: the two
 * presentations are two different keyboard surfaces and the *inline* one is
 * the flat list of `<button>` rows nobody has walked yet; the popup is a
 * fixed `w-80` while the inline column takes the caller's width; and the
 * locked row carries two things in its trailing slot — the price and the word
 * Locked — where I4's stories only ever render one.
 *
 * Not written for this component, deliberately:
 *
 * // case-skip: Controlled — onAction(id) reports a pick; no value and no open state exist to hold
 * `ActionStackProps` is `actions` · `onAction` · `trigger` · `presentation`,
 * with no `value`/`onChange` pair and no `open`/`onOpenChange` pair.
 * `onAction` fires with the chosen row's id so the host can run the next
 * generation somewhere else; the stack holds no selection of its own (no
 * `useState` in the file), and `actions` is an input the host derives from the
 * result's type rather than state this component reports back. The
 * `DropdownMenu` in menu mode owns its open state internally with no prop to
 * lift, which is a real limit rather than half a controlled pair — a host that
 * swaps `actions` behind an open menu cannot close it. I4 records the
 * identical limit against the identical primitive and skips for the identical
 * reason; the convention's three assertions have no subject on either.
 * ---------------------------------------------------------------------- */

/**
 * Right-to-left, inline, on the row this component has and I4's stories never
 * render: a locked one, whose trailing slot carries **two** things.
 *
 * The mirroring of the row itself is I4's finding, not re-derived here — A9
 * `entity-row` is `flex … text-start` with no physical side named, so the icon
 * leads at the right and the trailing slot moves to the visual left, and A2
 * `cost-chip` pins its amount `dir="ltr"` so "900 credits/min" stays a
 * left-to-right island rather than reordering into "min/credits 900". What is
 * new here is what happens *inside* the trailing slot when it holds a price
 * and the word Locked at once: that inner `flex … gap-2` mirrors too, so the
 * pair reverses against each other as well as moving as a block. Reading
 * order is unchanged — chip, then word — and the assertions measure it at both
 * levels: the trailing block against the title, and the pair against each
 * other.
 *
 * That is the right answer and it is worth pinning, because the two signals
 * are not interchangeable: the padlock is `aria-hidden`, so the word is the
 * only thing carrying "locked" to a screen reader, and it is also the only
 * part of the pair that is prose. A physical `ml-`/`pl-` anywhere in that
 * trailing group would leave the word stranded on the wrong side of the price
 * in exactly one of the two directions.
 *
 * Menu mode is not rendered. Its popup portals to the end of `document.body`,
 * so it needs the document-level `dir` idiom rather than a wrapper, and what
 * it would add is the shared dropdown chrome that `account-menu`'s RTL story
 * already records against `components/ui/dropdown-menu.tsx` — a file this
 * component consumes and does not own.
 */
export const RTL: Story = {
  args: {
    actions: [...IMAGE_ACTIONS, LIP_SYNC],
    presentation: "inline",
    className: "rounded-lg border p-1",
  },
  render: (args) => (
    <div dir="rtl">
      <ActionStack {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const root = canvas.getByRole("group", { name: "Actions for this result" });
    await expect(getComputedStyle(root).direction).toBe("rtl");

    const locked = root.querySelector<HTMLElement>('[data-action-id="lipsync"]')!;
    await expect(locked).toHaveAttribute("data-locked");

    const box = (el: Element) => el.getBoundingClientRect();
    const title = locked.querySelector<HTMLElement>('[data-slot="entity-row-title"]')!;
    const trailing = locked.querySelector<HTMLElement>('[data-slot="entity-row-trailing"]')!;
    const chip = locked.querySelector<HTMLElement>('[data-slot="cost-chip"]')!;
    const word = locked.querySelector<HTMLElement>('[data-slot="action-stack-locked"]')!;

    // The block moves: the whole trailing slot sits left of the title, which
    // reads the other way round against a physical `ml-auto`.
    await expect(`trailing left of title: ${box(trailing).left < box(title).left}`).toBe(
      "trailing left of title: true",
    );

    // …and the pair inside it reverses with it. Chip first in the DOM, so
    // chip on the right, the word on its left — the LTR arrangement flipped,
    // not the block slid across with its contents left alone.
    await expect(`word left of chip: ${box(word).right <= box(chip).left}`).toBe(
      "word left of chip: true",
    );

    // The price itself does not mirror. I4's finding, asserted here because
    // this call site suppresses A2's own unit and passes the whole formatted
    // string as the amount, so the LTR island has to cover more of it.
    const amount = locked.querySelector<HTMLElement>('[data-slot="cost-chip-amount"]')!;
    await expect(getComputedStyle(amount).direction).toBe("ltr");
    await expect(amount).toHaveTextContent("900 credits/min");
  },
};

/**
 * The reduced-motion branch, in menu mode, because that is the only place
 * this component moves anything.
 *
 * This is the same popup family I4 already fixed, and it needed fixing again,
 * which is the part worth knowing: the animation classes live on the vendored
 * `components/ui/dropdown-menu.tsx`, but the suppression has to be restated at
 * each call site, so repairing one consumer of `DropdownMenuContent` repairs
 * none of the others. A bare `motion-reduce:animate-none` is **inert** on a
 * Base UI popup, since Tailwind v4 wraps the `data-*` test in `:where(…)` so
 * both sides carry one class of specificity and source order hands the win to
 * `animation: enter`.
 * `motion-reduce:data-open:animate-none` and its `data-closed` twin sort after
 * their counterparts and win the same tie — the `shortcuts-sheet` finding,
 * applied by I4 to this popup family and landed on `action-stack.tsx` in this
 * wave. The assertions read the computed values back rather than checking for
 * the class, because the class being present is exactly what was already true
 * while it did nothing.
 *
 * **Measured on this popup, with the class removed and restored:**
 *
 *     before   animation-name enter    width 304px
 *     after    animation-name none     width 320px
 *
 * The second column is the part worth having and is new to this wave: what
 * `data-open:animate-in` composes here is `zoom-in-95`, so while it runs the
 * popup is painted at 95% of the size it will settle at. A reader who needs
 * reduced motion was not merely seeing a fade — the surface was arriving
 * undersized and growing, which is the motion the setting exists to remove.
 * The exact pre-fix figure depends on how far the 100ms animation had
 * advanced when the frame was read; 304 is its start. The post-fix 320 is
 * stable, which is why it is the one asserted, and it is also why
 * `LongContent` can measure this popup's width at all.
 *
 * The closing half is not asserted, and the reason is a limit of the
 * instrument rather than a doubt about the class: by the time `data-closed`
 * is observable from a play function the popup has already left the document,
 * and `getComputedStyle` on a detached element returns empty strings for
 * everything. The departure itself is asserted instead. I4 asserts the open
 * half only, on the same primitive, for the same reason.
 *
 * Nothing in inline mode needs the same treatment. The only `transition-*` in
 * the tree is A9's `transition-colors` on an interactive row, which crossfades
 * a background and a text colour and moves nothing — the `reset-affordance`
 * case in story-conventions.md, where suppressing it would document a branch
 * nobody can perceive. The vendored `Button`'s one-pixel press nudge is
 * library-wide chrome outside `registry/super-ai/` and is recorded in
 * CONTINUE.md §8 rather than patched from a call site.
 */
export const ReducedMotion: Story = {
  args: {
    actions: VIDEO_ACTIONS,
    presentation: "menu",
    trigger: <Button variant="outline">Use this result</Button>,
  },
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("button", { name: "Use this result" }));
    const menu = await within(document.body).findByRole("menu");

    // Still opening — the attribute the animation is keyed off is on the
    // element, so this is the frame the bare class fails to reach.
    await expect(menu).toHaveAttribute("data-open");
    await expect(`open animation=${getComputedStyle(menu).animationName}`).toBe(
      "open animation=none",
    );

    // …and it is already full size on that same frame, rather than arriving at
    // the 95% `zoom-in-95` starts from and growing into place.
    await expect(`open width=${Math.round(menu.getBoundingClientRect().width)}`).toBe(
      "open width=320",
    );

    // The dismissal runs every time a caller uses this menu, and it leaves
    // nothing behind to measure — see the note above.
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(within(document.body).queryByRole("menu")).toBeNull());
    await expect(`popup still in the document=${menu.isConnected}`).toBe(
      "popup still in the document=false",
    );
  },
};

/**
 * The keyboard contract of **inline** mode, which is the surface I4's stories
 * do not walk and the one where this component's two presentations actually
 * diverge. The menu is beside it so the divergence is on screen rather than
 * asserted from memory.
 *
 * What it pins:
 *
 * 1. Inline is a flat tab walk, not a roving one. Every actionable row is its
 *    own tab stop inside a plain `role="group"`, so three actions is three Tab
 *    presses — the docs module's keyboard note, measured. There is no arrow
 *    handling and no `tabindex="-1"` anywhere in the group.
 * 2. **The locked row is not a stop at all.** Inline, `locked` withholds
 *    `onSelect`, so A9 renders a `div` rather than a `button` and the keyboard
 *    passes straight over it. This is the exact opposite of menu mode, where
 *    the same row is `aria-disabled` and stays in the arrow lap (I4 asserts
 *    that half). One component, one `locked` flag, two different answers to
 *    "can a keyboard user reach the thing they would be upgrading for" — and
 *    the docs module states both, so this asserts they stay stated correctly.
 * 3. Every inline stop shows a focus treatment that actually paints. A9 puts
 *    `focus-visible:ring-2` on its interactive branch, and each stop is
 *    measured for an opaque 2px shadow layer rather than for the shared
 *    check's `boxShadow !== "none"` — which CONTINUE.md §8 records as having
 *    produced false positives twice. This row carries the decoy wave 1 found
 *    on I4's menu row, from A9's own `focus-visible:outline-none` rather than
 *    from the vendored `outline-hidden`: `outline-width` reads 1px while
 *    `outline-style` reads none, so a width-based check reports a treatment on
 *    a row that has none. Both are asserted, in opposite directions, so a
 *    regression that swapped the real ring for the decoy would fail here
 *    rather than pass.
 * 4. The menu contributes exactly one stop to the page — the trigger —
 *    whatever the row count, and choosing a row with Enter closes the popup
 *    and returns focus to it. That return is what makes a chained handoff
 *    (Extend, then Upscale, then Lip sync) leave you where you started, and it
 *    is the docs module's first focus claim.
 *
 * **Recorded, not pinned, and shared with I4: a keyboard-focused row inside
 * the menu has no perceptible focus treatment.** `className="p-0
 * focus:bg-transparent"` on the `DropdownMenuItem` overrides the primitive's
 * `focus:bg-accent`, presumably so A9's composed `text-muted-foreground`
 * description is never left on an accent surface; what survives is
 * `focus:text-accent-foreground`, a text colour rather than an indicator, and
 * the focused and resting rows differ only as oklch 0.205 against 0.145.
 * `action-stack.tsx` carries the identical override on the identical row, so
 * CONTINUE.md §8 records it as **one decision for both** rather than two
 * bugs — which is why nothing below asserts a ring inside the popup, and why
 * this file does not change it unilaterally. I4's `KeyboardOrder` carries the
 * measurement.
 */
export const KeyboardOrder: Story = {
  args: { actions: [...VIDEO_ACTIONS, LIP_SYNC] },
  render: (args) => (
    <div className="flex w-full flex-col gap-6">
      <ActionStack {...args} presentation="inline" className="rounded-lg border p-1" />
      <ActionStack {...args} presentation="menu" trigger={<Button variant="outline">Use this result</Button>} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const body = within(document.body);
    const group = within(canvasElement).getByRole("group", { name: "Actions for this result" });

    // Three actionable rows, four actions. The locked one renders, and is not
    // a button.
    const rows = Array.from(group.querySelectorAll<HTMLElement>("[data-action-id]"));
    await expect(rows).toHaveLength(4);
    const lockedRow = group.querySelector<HTMLElement>('[data-action-id="lipsync"]')!;
    await expect(lockedRow.tagName).toBe("DIV");

    const stops = Array.from(group.querySelectorAll<HTMLElement>("button"));
    await expect(stops.map((row) => row.getAttribute("data-action-id"))).toEqual([
      "extend",
      "upscale",
      "restyle",
    ]);
    // No roving tabindex: a flat group, every stop reachable by Tab alone.
    await expect(group.querySelector('[tabindex="-1"]')).toBeNull();

    const nameOf = (el: Element | null) =>
      el === null ? "nothing" : (el.getAttribute("data-action-id") ?? el.textContent?.trim() ?? "?");

    for (const [index, row] of stops.entries()) {
      await userEvent.tab();
      await expect(`stop ${index}: ${nameOf(document.activeElement)}`).toBe(
        `stop ${index}: ${nameOf(row)}`,
      );
      await expect(row.matches(":focus-visible")).toBe(true);
      // A real ring, not the decoy: A9's `focus-visible:ring-2` paints an
      // opaque 2px layer, while its `focus-visible:outline-none` on the same
      // row leaves `outline-width` reading 1px at `outline-style: none`.
      await expect(`${nameOf(row)} ring=${visibleRing(row)}`).toBe(
        `${nameOf(row)} ring=2px spread, opaque`,
      );
      await expect(`${nameOf(row)} outline=${getComputedStyle(row).outlineStyle}`).toBe(
        `${nameOf(row)} outline=none`,
      );
    }

    // The tab after the last row leaves the group entirely: the locked row is
    // skipped rather than reached and refused, and the next stop is the menu's
    // trigger — which is the whole of the menu's contribution to the page.
    const trigger = within(canvasElement).getByRole("button", { name: "Use this result" });
    await userEvent.tab();
    await expect(`after last row: ${nameOf(document.activeElement)}`).toBe(
      `after last row: Use this result`,
    );
    await expect(document.activeElement).toBe(trigger);

    // Opening it adds no tab stops: the rows are a roving arrow walk, which is
    // correct for `role="menu"` and is I4's story to tell.
    await userEvent.keyboard("{ArrowDown}");
    const menu = await body.findByRole("menu");
    const items = Array.from(menu.querySelectorAll<HTMLElement>('[role="menuitem"]'));
    await expect(items).toHaveLength(4);

    // Here the locked row *is* reachable — marked rather than removed, the
    // opposite of the inline answer above.
    const lockedItem = within(menu).getByRole("menuitem", { name: /Use in Lip sync/ });
    await expect(lockedItem).toHaveAttribute("aria-disabled", "true");

    // Choosing a row closes the menu and hands focus back to the trigger, so
    // the next hop in the chain starts from where the last one did.
    await waitFor(() => expect(items).toContain(document.activeElement));
    await userEvent.keyboard("{Enter}");
    await waitFor(() => expect(body.queryByRole("menu")).toBeNull());
    await waitFor(() => expect(document.activeElement).toBe(trigger));
  },
};

/**
 * Everything optional left out: no row `description`, no row `icon`, and no
 * `trigger`. `title` is the one required string, so every row still has a
 * name — this is not an unlabelled-control story, it is the story of what a
 * caller loses by omission, and the losses are not all cosmetic.
 *
 * - **The fallback trigger is an unstyled `<button>`.** With no `trigger`
 *   passed, the component supplies `<button type="button">Use this
 *   result</button>` with no class at all, so Tailwind's preflight leaves it
 *   transparent, borderless and unpadded: text that happens to be clickable.
 *   The docs module says the trigger's focus style is yours to supply, which
 *   is true and is also the point: when you supply nothing, the measurement
 *   below is what you get — transparent, borderless, unpadded, and focused
 *   with `outline: auto` from the user agent rather than with the `ring-2`
 *   every other focusable in this component paints for itself. So the fallback
 *   is reachable and announced, and has no resting affordance at all. The
 *   declared-state `Menu` story never shows this, because it always passes a
 *   `Button`.
 * - **A row with no description keeps its height.** A9 sets `min-h-14`, so a
 *   description-less row matches one that has a description and a mixed list
 *   does not go ragged. Worth seeing beside the stories above rather than
 *   inferred from the class.
 * - **A row with no icon loses its only non-text signal.** On the locked row
 *   that would matter — except the padlock is not the icon slot: it replaces
 *   it, so `locked` re-supplies what omitting `icon` took away. The word
 *   Locked is doing the semantic work either way, since the padlock is
 *   `aria-hidden`.
 */
export const EmptyLabel: Story = {
  args: {
    actions: [
      { id: "variations", title: "Variations", cost: { amount: 17 } },
      { id: "inpaint", title: "Inpaint" },
      { id: "lipsync", title: "Use in Lip sync", cost: { amount: 120 }, locked: true },
    ],
  },
  render: (args) => (
    <div className="flex w-full flex-col gap-6">
      <ActionStack {...args} presentation="inline" className="rounded-lg border p-1" />
      <ActionStack {...args} presentation="menu" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const group = canvas.getByRole("group", { name: "Actions for this result" });

    // Named by the title alone — the description was the only other text.
    await expect(within(group).getByRole("button", { name: "Variations 17 credits" })).toBeInTheDocument();
    const bare = group.querySelector<HTMLElement>('[data-action-id="inpaint"]')!;
    await expect(bare.querySelector('[data-slot="entity-row-description"]')).toBeNull();
    await expect(getComputedStyle(bare).minHeight).toBe("56px");

    // The locked row still carries the word, and still has an icon: the
    // padlock replaces the slot rather than filling it.
    const locked = group.querySelector<HTMLElement>('[data-action-id="lipsync"]')!;
    await expect(locked.querySelector('[data-slot="entity-row-icon"]')).not.toBeNull();
    await expect(locked).toHaveTextContent("Locked");

    // The supplied trigger: named, but wearing nothing.
    const trigger = canvas.getByRole("button", { name: "Use this result" });
    const style = getComputedStyle(trigger);
    await expect(
      `bg=${style.backgroundColor} border=${style.borderTopWidth} padding=${style.paddingInlineStart}`,
    ).toBe("bg=rgba(0, 0, 0, 0) border=0px padding=0px");

    // Focused, it is not invisible — but what it has is the user agent's own
    // outline, not the ring the rest of this component paints for itself.
    trigger.focus();
    const focused = getComputedStyle(trigger);
    await expect(
      `fv=${trigger.matches(":focus-visible")} outline=${focused.outlineStyle} ring=${visibleRing(trigger)}`,
    ).toBe("fv=true outline=auto ring=none");
  },
};

/**
 * A ~90 character action title in **menu** mode, which is the tighter of the
 * two surfaces and the one I4's `LongContent` does not measure.
 *
 * The popup is a fixed `w-80` — 320px whatever the trigger's width, because
 * this call site overrides the primitive's `w-(--anchor-width)` — so a long
 * title has less room here than in an inline column the caller sized, and
 * the row's answer is a single clipped line. A9 puts `truncate` on both
 * `entity-row-title` and `entity-row-description` and the trailing slot is
 * `shrink-0`, so the price holds its width and the prose gives way. Nothing
 * reveals the rest: no tooltip, no wrap, no second line, so two rows that
 * differ only after the ellipsis are two rows a user cannot tell apart — and
 * a stack whose rows come from a tool registry rather than a hand-written
 * array is exactly where that happens.
 *
 * The locked row carries the long string on purpose. Its trailing slot is the
 * widest this component can produce — a rate-form price *and* the word
 * Locked — so it is where the text column is squeezed hardest, and it is also
 * the row whose description ("Available on Studio", or the reason) a caller
 * most wants read.
 */
export const LongContent: Story = {
  args: {
    presentation: "menu",
    trigger: <Button variant="outline">Use this result</Button>,
    actions: [
      {
        id: "upscale",
        title: "Upscale to 4K and re-grade the whole clip at the original frame rate",
        description: "Re-renders every frame from the source, not from this preview",
        icon: <Maximize2 aria-hidden className="size-4" />,
        cost: { amount: 900, per: "min" },
      },
      {
        id: "lipsync",
        title: "Use in Lip sync with the original dialogue track and speaker timing",
        description: "Available on Studio — the clip is re-timed to the voice, so it is billed per minute",
        icon: <Mic aria-hidden className="size-4" />,
        cost: { amount: 900, per: "min" },
        locked: true,
      },
    ],
  },
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("button", { name: "Use this result" }));
    const menu = await within(document.body).findByRole("menu");

    // 320px regardless of the trigger, which is narrower than the inline
    // column the declared-state stories render into.
    await expect(`popup width=${Math.round(menu.getBoundingClientRect().width)}`).toBe(
      "popup width=320",
    );

    const row = menu.querySelector<HTMLElement>('[data-action-id="lipsync"]')!;
    const clipped = (slot: string) => {
      const el = row.querySelector<HTMLElement>(`[data-slot="${slot}"]`)!;
      const lines = Math.round(el.scrollHeight / parseFloat(getComputedStyle(el).lineHeight));
      return `${slot} clipped=${el.scrollWidth > el.clientWidth} lines=${lines}`;
    };
    await expect(clipped("entity-row-title")).toBe("entity-row-title clipped=true lines=1");
    await expect(clipped("entity-row-description")).toBe("entity-row-description clipped=true lines=1");

    // The price is what does not give: `shrink-0`, so the rate form renders in
    // full while the prose behind it is cut.
    const chip = row.querySelector<HTMLElement>('[data-slot="cost-chip"]')!;
    await expect(`chip clipped=${chip.scrollWidth > chip.clientWidth}`).toBe("chip clipped=false");
    await expect(row).toHaveTextContent("900 credits/min");

    // And the popup does not solve it by growing sideways.
    await expect(`popup overflows=${menu.scrollWidth > menu.clientWidth}`).toBe(
      "popup overflows=false",
    );
  },
};

/**
 * 375px, inline, which is where this row is under most pressure: an icon, two
 * lines of prose and a price on one line, and the price does not shrink.
 *
 * The locked row is the worst case the component can produce, because its
 * trailing slot holds the rate-form price *and* the word Locked. Measured in
 * this frame: of a 365px row the pair takes 172px and the prose is left 129px,
 * so the trailing slot is wider than the title and description it sits beside.
 * That is the right trade — the price is the number the row exists to show,
 * and truncating prose beats a column that scrolls sideways — but it is a
 * narrow margin arrived at silently, and it is what would break if A9 lost its
 * `min-w-0`. The assertions state the split in figures rather than only
 * asserting "no scroll", because "no scroll" stays true right up until the
 * title has no room left at all.
 *
 * Menu mode is not measured here. Its popup is a fixed 320px that portals to
 * `document.body`, so it clears 375 by construction and would be measured
 * against the viewport rather than against this frame; `LongContent` renders
 * it instead. The frame carries a `data-testid` because `layout: "centered"`
 * wraps every story in a ~1200px centring div, and an overflow assertion
 * against `canvasElement.firstElementChild` measures that wrapper and passes
 * for the wrong reason.
 */
export const Mobile: Story = {
  args: {
    actions: [...VIDEO_ACTIONS, LIP_SYNC],
    presentation: "inline",
    className: "rounded-lg border p-1",
  },
  render: (args) => (
    <div data-testid="mobile-frame" className="w-[375px] max-w-full">
      <ActionStack {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const frame = within(canvasElement).getByTestId("mobile-frame");
    await expect(`frame width=${Math.round(frame.getBoundingClientRect().width)}`).toBe(
      "frame width=375",
    );
    await expect(`frame overflows=${frame.scrollWidth > frame.clientWidth}`).toBe(
      "frame overflows=false",
    );

    const root = frame.querySelector<HTMLElement>('[data-slot="action-stack"]')!;
    await expect(`root overflows=${root.scrollWidth > root.clientWidth}`).toBe(
      "root overflows=false",
    );

    const locked = root.querySelector<HTMLElement>('[data-action-id="lipsync"]')!;
    const width = (el: Element) => Math.round(el.getBoundingClientRect().width);
    const textColumn = locked.querySelector<HTMLElement>('[data-slot="entity-row-title"]')!
      .parentElement!;
    const trailing = locked.querySelector<HTMLElement>('[data-slot="entity-row-trailing"]')!;

    // The trailing slot wins the width fight, and the prose column takes what
    // is left rather than pushing the row wider.
    // Measured: a 365px row gives 172px to the price-and-Locked pair and
    // leaves the prose 129px, the rest going to the padlock, the gaps and the
    // row padding. The trailing slot wins outright, and the prose column takes
    // what is left rather than pushing the row wider.
    await expect(
      `row=${width(locked)} text=${width(textColumn)} trailing=${width(trailing)}`,
    ).toBe("row=365 text=129 trailing=172");

    // The price still renders in full — it is the number the row exists to
    // show, and `shrink-0` is what keeps it.
    const chip = locked.querySelector<HTMLElement>('[data-slot="cost-chip"]')!;
    await expect(`chip clipped=${chip.scrollWidth > chip.clientWidth}`).toBe("chip clipped=false");
    await expect(chip).toHaveTextContent("900 credits/min");
  },
};

/**
 * F4 beside I4 `ai-tools-menu`, which the spec calls "visually identical to I4
 * on purpose". Same A9 rows, same A2 chips, same `locked` behaviour, same
 * two presentations — so the choosing rule cannot be about appearance. It is
 * about **what the actions are attached to**, and this is the F side of it:
 *
 * - **Action stack** attaches to a *finished result*. The result is the thing
 *   you are already looking at, so there is nothing for the surface to name:
 *   one flat list of what to do next, a constant accessible name ("Actions for
 *   this result"), and an order the host chose because it is the order of the
 *   chain — Extend, then Upscale, then Lip sync.
 * - **AI tools menu** attaches to a *selected object*. The selection is the
 *   prompt context, so it is named on the surface and gives the surface its
 *   accessible name, the rows are grouped by intent, and the expensive or
 *   irreversible group sinks below a rule whatever order it was declared in.
 *
 * The test: if the surface has to say what it is acting on, it is I4. If the
 * answer is always "this, the thing that just finished", it is F4. A grouping
 * appearing in an action stack is the signal you have the wrong one — groups
 * exist to separate kinds of intent against one object, and a finished result
 * has one intent, which is "what next".
 *
 * The third neighbour is inside this family and is described rather than
 * rendered, because the rule is not close: F7 `approval-card` also ends a
 * generation with a row of verbs, but its four — Confirm, Edit, Regenerate,
 * Skip — are fixed, always in that order, and decide the fate of the artifact
 * in front of you. F4's rows are data, vary by asset type, and each starts a
 * new billed piece of work. A decision about this result is F7; a next result
 * from this one is F4.
 *
 * Both are rendered inline. In menu mode each is a portaled popup that would
 * land on top of the other rather than beside it, and an open Base UI menu
 * marks everything outside itself `aria-hidden` — a comparison the story would
 * have manufactured rather than shown.
 */
export const Boundary: Story = {
  render: () => (
    <div className="flex w-full flex-col gap-6">
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
              id: "extend",
              title: "Extend",
              description: "Add 4 seconds to the end",
              icon: <Scissors aria-hidden className="size-4" />,
              cost: { amount: 55 },
            },
            {
              id: "upscale",
              title: "Upscale",
              description: "To 4K, 24 fps",
              icon: <Maximize2 aria-hidden className="size-4" />,
              cost: { amount: 900, per: "min" },
            },
            LIP_SYNC,
          ]}
        />
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">
          AI tools menu — actions on the selected object, grouped by intent
        </p>
        <AiToolsMenu
          presentation="inline"
          className="rounded-lg border p-1"
          onAction={() => {}}
          selection={{
            label: "Hero shot, layer 3",
            type: "Image",
            icon: <Sparkles aria-hidden className="size-4" />,
          }}
          groups={[
            {
              id: "edit",
              label: "Edit this image",
              actions: [
                {
                  id: "expand",
                  title: "Magic expand",
                  description: "Paint beyond the frame",
                  icon: <Maximize2 aria-hidden className="size-4" />,
                  cost: { amount: 17 },
                },
              ],
            },
            {
              id: "careful",
              label: "Costly or irreversible",
              destructive: true,
              actions: [
                {
                  id: "regenerate",
                  title: "Regenerate from scratch",
                  description: "Discards every edit on this layer",
                  icon: <Wand2 aria-hidden className="size-4" />,
                  cost: { amount: 2400 },
                },
              ],
            },
          ]}
        />
      </section>
    </div>
  ),
};
