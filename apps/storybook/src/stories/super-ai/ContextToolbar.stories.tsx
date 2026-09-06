import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import {
  AlignLeft,
  Bold,
  Copy,
  Crop,
  Gauge,
  Highlighter,
  Italic,
  Link2,
  Lock,
  MessageSquare,
  Palette,
  Scissors,
  Square,
  Strikethrough,
  Trash2,
  Type,
  Underline,
  Volume2,
} from "lucide-react";

import { expect, userEvent, waitFor, within } from "storybook/test";

import { Button } from "@/components/ui/button";
import { ContextToolbar, type ContextToolbarAction } from "@/registry/super-ai/context-toolbar";
import { SelectionToolbar } from "@/registry/super-ai/selection-toolbar";
import { ContextToolbarDocs } from "@/content/components/context-toolbar.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const TEXT_ACTIONS: ContextToolbarAction[] = [
  { id: "bold", label: "Bold", icon: <Bold /> },
  { id: "italic", label: "Italic", icon: <Italic /> },
  { id: "underline", label: "Underline", icon: <Underline /> },
  { id: "link", label: "Link", icon: <Link2 /> },
  { id: "highlight", label: "Highlight", icon: <Highlighter /> },
];

const IMAGE_ACTIONS: ContextToolbarAction[] = [
  { id: "crop", label: "Crop", icon: <Crop /> },
  { id: "remove-bg", label: "Remove background", icon: <Scissors /> },
  { id: "duplicate", label: "Duplicate", icon: <Copy /> },
  { id: "delete", label: "Delete", icon: <Trash2 /> },
];

const SHAPE_ACTIONS: ContextToolbarAction[] = [
  { id: "fill", label: "Fill", icon: <Palette />, showLabel: true },
  { id: "border", label: "Border", icon: <Square /> },
  { id: "text", label: "Add text", icon: <Type /> },
  { id: "lock", label: "Lock", icon: <Lock /> },
];

const MEDIA_ACTIONS: ContextToolbarAction[] = [
  { id: "trim", label: "Trim", icon: <Scissors /> },
  { id: "volume", label: "Volume", icon: <Volume2 /> },
  { id: "speed", label: "Speed", icon: <Gauge /> },
  { id: "duplicate", label: "Duplicate", icon: <Copy /> },
];

/** Twelve verbs — four past the cap, on purpose. */
const OVERSTUFFED: ContextToolbarAction[] = [
  ...TEXT_ACTIONS,
  { id: "strike", label: "Strikethrough", icon: <Strikethrough /> },
  { id: "align", label: "Align left", icon: <AlignLeft /> },
  { id: "comment", label: "Comment", icon: <MessageSquare /> },
  { id: "crop", label: "Crop", icon: <Crop /> },
  { id: "fill", label: "Fill", icon: <Palette /> },
  { id: "duplicate", label: "Duplicate", icon: <Copy /> },
  { id: "delete", label: "Delete", icon: <Trash2 /> },
];

const AI_MENU = (
  <div className="flex flex-col gap-0.5 text-sm">
    <p className="px-2 py-1 text-xs">Where I4 ai-tools-menu is rendered</p>
    <span className="rounded-md px-2 py-1.5">Rewrite</span>
    <span className="rounded-md px-2 py-1.5">Shorten</span>
    <span className="rounded-md px-2 py-1.5">Translate</span>
  </div>
);

const meta: Meta<typeof ContextToolbar> = {
  title: "Super AI/Context Toolbar",
  component: ContextToolbar,
  parameters: { layout: "centered", docs: { page: componentDocsPage(ContextToolbarDocs) } },
  args: { onAction: () => {}, onAiSelect: () => {} },
};

export default meta;
type Story = StoryObj<typeof ContextToolbar>;

/** A text run: the AI entry first, then formatting. */
export const Text: Story = {
  args: { selection: "text", actions: TEXT_ACTIONS, aiMenu: AI_MENU },
};

/** An image: the verbs change, the anatomy does not. */
export const Image: Story = {
  args: { selection: "image", actions: IMAGE_ACTIONS, aiMenu: AI_MENU },
};

/** A shape, with the first label drawn rather than hidden. */
export const Shape: Story = {
  args: { selection: "shape", actions: SHAPE_ACTIONS, aiMenu: AI_MENU },
};

/** A clip on a timeline, flipped below the selection. */
export const Media: Story = {
  args: { selection: "media", placement: "below", actions: MEDIA_ACTIONS, aiMenu: AI_MENU },
};

/** Twelve actions supplied; eight buttons drawn, the rest behind the overflow menu. */
export const Overflow: Story = {
  args: { selection: "text", actions: OVERSTUFFED, aiMenu: AI_MENU },
};

/* -------------------------------------------------------------------------
 * Case stories — the situations this bar meets on a real canvas, as opposed
 * to the selection kinds above. See docs/design-system/story-conventions.md.
 *
 * All eight are true for this component, so there are no `case-skip` lines.
 * That is unusual and it follows from the shape: a floating bar of buttons
 * with author-supplied labels, three Base UI popup surfaces, a Base UI
 * composite for focus, a controlled `aiOpen` pair, and a near-twin (K4
 * `selection-toolbar`) that is built on it.
 * ---------------------------------------------------------------------- */

/**
 * Right-to-left. Order is the whole contract here — the AI entry is index 0
 * "always", the overflow trigger is last — so in an RTL document the AI
 * entry has to sit at the visual **right** edge and the overflow menu at the
 * left, with the separator between them following.
 *
 * It mirrors for free, and this story is the record of why: the source
 * contains no physical direction class at all (no `pl-`, `ml-`, `border-l`
 * or `text-left`), only `gap-*`, a symmetric `mx-0.5` on the separator, and
 * `align="start"` / `align="end"` on the popover and menu, which Base UI
 * resolves against the writing direction rather than the viewport. A future
 * edit reaching for `ml-auto` to push the overflow trigger over would break
 * this story and nothing else.
 */
export const RTL: Story = {
  render: (args) => (
    <div dir="rtl" className="flex">
      <ContextToolbar {...args} selection="text" actions={OVERSTUFFED} aiMenu={AI_MENU} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const ai = canvas.getByRole("button", { name: "AI tools" });
    const overflow = canvas.getByRole("button", { name: "More actions" });

    // Mirrored, not merely reordered in the DOM: the first child paints on
    // the right and the last on the left.
    await expect(ai.getBoundingClientRect().left).toBeGreaterThan(overflow.getBoundingClientRect().left);
  },
};

/**
 * `prefers-reduced-motion`. Three of this component's surfaces are Base UI
 * popups — the per-action tooltip, the AI popover and the overflow menu —
 * and every one of them animates in through `data-open:animate-in`.
 *
 * The bar itself never animated, which is exactly why this was easy to miss:
 * nothing in `context-toolbar.tsx` carried an `animate-*` class, so a
 * class-level audit saw a component with no motion. The motion is in the
 * popups it opens, and this component is named in `CONTINUE.md` §8's list of
 * 33 registry items in that position.
 *
 * Fixed in-wave as a mechanical repair, using the restated form that the
 * plain one-class remedy cannot replace on a Base UI popup:
 * `motion-reduce:data-open:animate-none motion-reduce:data-closed:animate-none`.
 * `vitest.config.ts` emulates reduce for every test, so the assertions below
 * read `animationName` off the live surfaces rather than checking for a
 * class — against the bare variant each of the three reads back `"enter"`.
 */
export const ReducedMotion: Story = {
  args: { selection: "text", actions: OVERSTUFFED, aiMenu: AI_MENU },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const settledPopup = async (slot: string) => {
      let popup: HTMLElement | null = null;
      await waitFor(() => {
        popup = document.querySelector<HTMLElement>(`[data-slot="${slot}"]`);
        if (!popup) throw new Error(`${slot} never opened`);
      });
      return popup as unknown as HTMLElement;
    };

    // 1. The tooltip. Every icon-only action has one, and the provider's
    //    delay is 0, so hovering is enough.
    const bold = canvas.getByRole("button", { name: "Bold" });
    await userEvent.hover(bold);
    const tooltip = await settledPopup("tooltip-content");
    await expect(tooltip).toHaveAttribute("data-open");
    await expect(getComputedStyle(tooltip).animationName).toBe("none");
    await userEvent.unhover(bold);

    // 2. The overflow menu — the surface with the largest travel, since it
    //    zooms out of a 28px trigger into a 224px list.
    await userEvent.click(canvas.getByRole("button", { name: "More actions" }));
    const menu = await settledPopup("context-toolbar-overflow-menu");
    await expect(menu).toHaveAttribute("data-open");
    await expect(getComputedStyle(menu).animationName).toBe("none");
    await userEvent.keyboard("{Escape}");

    // 3. The AI popover, which is where I4 renders.
    await userEvent.click(canvas.getByRole("button", { name: "AI tools" }));
    const popover = await settledPopup("context-toolbar-ai-menu");
    await expect(popover).toHaveAttribute("data-open");
    await expect(getComputedStyle(popover).animationName).toBe("none");
  },
};

/**
 * The bar is a **toolbar**, not a row of buttons, and this is the only place
 * that difference is proved. `Toolbar.Root` is a Base UI composite, so:
 *
 * - the whole bar is one tab stop — exactly one button is tabbable at a
 *   time, and a second Tab leaves the bar entirely rather than stepping to
 *   the next action;
 * - Left and Right travel along it and wrap at both ends;
 * - the roving index is where the focus ring appears, so "a visible focus
 *   treatment at every stop" is an assertion about arrow travel here, not
 *   about tabbing.
 *
 * The overflow menu is the other half: it opens on Enter and, on Escape,
 * returns focus to the trigger it came from rather than dropping it on
 * `<body>`. That return is what makes the collapsed actions reachable
 * without a mouse, and it is the assertion most likely to regress if the
 * trigger is ever re-wrapped.
 *
 * `maxActions: 4` rather than the twelve-action bar above, so the lap is
 * five stops and each Right can be asserted to move by exactly one.
 */
export const KeyboardOrder: Story = {
  args: { selection: "text", actions: TEXT_ACTIONS, maxActions: 4, aiMenu: AI_MENU },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const toolbar = canvas.getByRole("toolbar", { name: "Text selection actions" });

    // The AI entry + 3 actions + the overflow trigger. The cap is four
    // buttons of actions; the overflow trigger sits outside the count.
    const stops = Array.from(toolbar.querySelectorAll<HTMLElement>("button"));
    await expect(stops).toHaveLength(5);

    const nameOf = (el: Element | null) =>
      el === null
        ? "nothing"
        : `stop#${stops.indexOf(el as HTMLElement)} [${el.textContent?.trim().slice(0, 24) ?? ""}]`;

    const assertVisiblyFocused = async (el: HTMLElement) => {
      const id = nameOf(el);
      await expect(`${id} focusVisible=${el.matches(":focus-visible")}`).toBe(`${id} focusVisible=true`);
      const style = getComputedStyle(el);
      await expect(`${id} ring=${style.boxShadow !== "none" || style.outlineStyle !== "none"}`).toBe(
        `${id} ring=true`,
      );
    };

    // 1. One tab stop. A composite has one tabbable descendant, not five.
    await expect(stops.filter((el) => el.tabIndex === 0)).toHaveLength(1);

    await userEvent.tab();
    await waitFor(() => {
      if (!stops.includes(document.activeElement as HTMLElement)) {
        throw new Error(`focus never entered the bar: ${nameOf(document.activeElement)}`);
      }
    });
    const start = document.activeElement as HTMLElement;
    await expect(nameOf(start)).toBe(nameOf(stops[0]));
    await assertVisiblyFocused(start);

    // 2. Arrow travel, one control per press, no repeats — so the lap is
    //    provable rather than counted inside an allowance.
    const seen = new Set<HTMLElement>([start]);
    for (let i = 1; i < stops.length; i += 1) {
      await userEvent.keyboard("{ArrowRight}");
      const focused = document.activeElement as HTMLElement;
      await expect(`${nameOf(focused)} repeat=${seen.has(focused)}`).toBe(`${nameOf(focused)} repeat=false`);
      await assertVisiblyFocused(focused);
      seen.add(focused);
    }
    await expect(seen.size).toBe(stops.length);

    // 3. …and it wraps at the end rather than stopping dead.
    await userEvent.keyboard("{ArrowRight}");
    await expect(nameOf(document.activeElement)).toBe(nameOf(stops[0]));

    // 4. Tab leaves the whole bar. That is the fact a row of loose buttons
    //    would not have: five buttons, one stop.
    await userEvent.tab();
    await expect(toolbar.contains(document.activeElement)).toBe(false);

    // 5. The overflow menu returns focus to its trigger on Escape.
    const overflow = canvas.getByRole("button", { name: "More actions" });
    overflow.focus();
    await userEvent.keyboard("{Enter}");
    await waitFor(() => {
      if (!document.querySelector('[data-slot="context-toolbar-overflow-menu"]')) {
        throw new Error("the overflow menu never opened");
      }
    });
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(document.activeElement).toBe(overflow));
  },
};

/**
 * `aiOpen` / `onAiOpenChange` is a real controlled pair, and this shell
 * holds it the hard way: the host records what the toolbar asked for and
 * applies it only when told to.
 *
 * What that proves, in order: clicking the AI entry does not open the
 * popover on its own; the callback still fires with the boolean a host needs
 * to apply; a re-render with an unchanged `aiOpen` leaves the popover shut;
 * and applying the request opens it. The last step matters because the
 * popover is a portal — an uncontrolled Base UI popover would have opened on
 * the first click, and no assertion afterwards could tell the two apart.
 *
 * Note what is *not* controlled: the overflow menu and the tooltips hold
 * their own open state, so a host that mirrors this bar into its own state
 * machine drives the AI surface and nothing else.
 */
export const Controlled: Story = {
  render: () => <ControlledShell />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const ai = canvas.getByRole("button", { name: "AI tools" });
    const menuIsOpen = () => document.querySelector('[data-slot="context-toolbar-ai-menu"]') !== null;

    await expect(menuIsOpen()).toBe(false);

    // 1. Interaction alone does not move the rendered value.
    await userEvent.click(ai);
    await expect(menuIsOpen()).toBe(false);

    // 2. …but the callback fired, with the boolean the host has to apply.
    await expect(canvas.getByTestId("requested")).toHaveTextContent("true");

    // 3. Re-render with an unchanged `aiOpen`. Prove the re-render first.
    await expect(canvas.getByTestId("render-pass")).toHaveTextContent("1");
    await userEvent.click(canvas.getByRole("button", { name: "Re-render" }));
    await expect(canvas.getByTestId("render-pass")).toHaveTextContent("2");
    await expect(menuIsOpen()).toBe(false);

    // 4. The payload was sufficient to apply the change.
    await userEvent.click(canvas.getByRole("button", { name: "Apply" }));
    await waitFor(() => expect(menuIsOpen()).toBe(true));
  },
};

function ControlledShell() {
  const [applied, setApplied] = React.useState(false);
  const [requested, setRequested] = React.useState<boolean | null>(null);
  const [pass, setPass] = React.useState(1);

  return (
    <div className="flex items-start gap-4">
      <ContextToolbar
        selection="text"
        actions={TEXT_ACTIONS}
        onAction={() => {}}
        aiMenu={AI_MENU}
        aiOpen={applied}
        onAiOpenChange={setRequested}
      />

      <div className="flex flex-col gap-4 py-1">
        <dl className="text-foreground grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs">
          <dt>aiOpen prop</dt>
          <dd data-testid="applied">{String(applied)}</dd>
          <dt>last onAiOpenChange</dt>
          <dd data-testid="requested">{requested === null ? "—" : String(requested)}</dd>
          <dt>host render pass</dt>
          <dd data-testid="render-pass" className="tabular-nums">
            {pass}
          </dd>
        </dl>

        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setPass((n) => n + 1)}>
            Re-render
          </Button>
          <Button
            size="sm"
            disabled={requested === null}
            onClick={() => requested !== null && setApplied(requested)}
          >
            Apply
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Every action drawn without its text — which is the **default** rendering,
 * since `showLabel` is opt-in. So this is not an edge case for this
 * component, it is the shape it ships in, and the only story where the
 * accessible names are proved rather than assumed.
 *
 * Three things are load-bearing and none of them is visible on screen:
 *
 * - Each action's `label` is in the DOM in an `sr-only` span. The tooltip
 *   repeats it and never supplies it — the assertions below resolve every
 *   name with no tooltip open anywhere in the document, which is what
 *   separates this from a tooltip-only naming failure.
 * - The overflow trigger draws only a `MoreHorizontal` glyph and is named
 *   the same way, by `overflowLabel`.
 * - `label` on the bar is optional too, and omitting it does not leave the
 *   toolbar nameless: `selection` derives it, so several bars on one canvas
 *   are still told apart.
 */
export const EmptyLabel: Story = {
  args: { selection: "image", actions: [...IMAGE_ACTIONS, ...TEXT_ACTIONS], maxActions: 4 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // No `label` was passed; the name came from `selection`.
    canvas.getByRole("toolbar", { name: "Image selection actions" });

    // Nothing has been hovered, so no tooltip exists in the document…
    await expect(document.querySelector('[data-slot="tooltip-content"]')).toBeNull();

    // …and every icon-only target is still named.
    for (const name of ["Crop", "Remove background", "Duplicate", "More actions"]) {
      canvas.getByRole("button", { name });
    }
  },
};

/**
 * A 90-character action label, and the component gives it two different
 * answers depending on where it lands.
 *
 * In the bar, a `showLabel` action does not truncate and does not wrap:
 * `Toolbar.Root` is `w-fit` and the buttons are `whitespace-nowrap`, so the
 * bar simply grows until it is wider than the canvas it was meant to float
 * over. That is the cost of drawing labels, and the argument for `showLabel`
 * being opt-in rather than the default.
 *
 * In the overflow menu the same length of string wraps instead, inside a
 * fixed `w-56` surface. So the collapsed half of a long-labelled action list
 * stays readable while the visible half runs off the edge — a reason to let
 * long verbs overflow rather than promoting them into the bar.
 */
export const LongContent: Story = {
  render: (args) => (
    <ContextToolbar
      {...args}
      selection="shape"
      maxActions={2}
      aiLabel="Generate a variation of this shape"
      actions={[
        {
          id: "match-style",
          label: "Match the style of the selected frame and recolour every child shape",
          icon: <Palette />,
          showLabel: true,
        },
        {
          id: "distribute",
          label: "Distribute the selected shapes evenly along the horizontal axis",
          icon: <AlignLeft />,
        },
        { id: "lock", label: "Lock", icon: <Lock /> },
      ]}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const drawn = canvas.getByRole("button", {
      name: "Match the style of the selected frame and recolour every child shape",
    });

    // One line, full width — no ellipsis and no second row.
    const style = getComputedStyle(drawn);
    await expect(style.whiteSpace).toBe("nowrap");
    await expect(style.textOverflow).toBe("clip");

    // The same length of string in the menu wraps instead of extending it.
    await userEvent.click(canvas.getByRole("button", { name: "More actions" }));
    const menu = await waitFor(() => {
      const el = document.querySelector<HTMLElement>('[data-slot="context-toolbar-overflow-menu"]');
      if (!el) throw new Error("the overflow menu never opened");
      return el;
    });
    const item = within(menu).getByRole("menuitem", {
      name: "Distribute the selected shapes evenly along the horizontal axis",
    });
    await expect(item.getBoundingClientRect().height).toBeGreaterThan(drawn.getBoundingClientRect().height);
  },
};

/**
 * 375px, with the bar at its ceiling: the AI entry, seven actions and the
 * overflow trigger.
 *
 * It fits, and the cap is why. Eight icon-sized targets plus a labelled AI
 * entry is close to the width of a phone, so the spec's "six to eight
 * actions maximum" is not only an attention argument — it is the reason this
 * component can float over a phone canvas at all. A ninth action does not
 * widen the bar, because it collapses into the menu instead.
 *
 * What breaks the fit is `showLabel`, and `LongContent` above is that story.
 * Nothing here scrolls: `Toolbar.Root` is `w-fit` with no scroll container,
 * so a bar too wide for its host overflows rather than clipping.
 */
export const Mobile: Story = {
  render: (args) => (
    <div className="w-[375px] max-w-full" data-testid="viewport">
      <ContextToolbar {...args} selection="text" actions={OVERSTUFFED} aiMenu={AI_MENU} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const viewport = canvas.getByTestId("viewport");
    const toolbar = canvas.getByRole("toolbar", { name: "Text selection actions" });

    // Eight buttons plus the overflow affordance, which sits outside the cap.
    await expect(toolbar.querySelectorAll("button")).toHaveLength(9);

    // No horizontal scroll at 375px, and the bar itself is the thing that
    // has to fit — it is `w-fit`, so it would overflow rather than shrink.
    await expect(toolbar.getBoundingClientRect().width).toBeLessThanOrEqual(375);
    await expect(viewport.scrollWidth).toBeLessThanOrEqual(viewport.clientWidth);
  },
};

/**
 * Against K4 `selection-toolbar`, the near-twin most likely to be rebuilt by
 * accident: both are floating bars that appear beside a selection, both lead
 * with a Sparkles entry, and from a screenshot they are the same component.
 *
 * The rule is what the bar knows:
 *
 * - **Context toolbar** knows nothing about the verbs. You pass `actions`
 *   for the kind of thing selected, it enforces the cap and the AI-first
 *   rule, and every action is a flat `{ id, label }` row behind one
 *   `onAction`. Use it when the vocabulary is yours.
 * - **Selection toolbar** is this component with the writing vocabulary
 *   already in it — Improve, Shorten, Expand, a tone submenu and a custom
 *   prompt — and it returns a typed `onIntent` rather than an id. Its `base`
 *   is `i3`, so choosing it is not a fork.
 *
 * So: if your verbs need popups of their own, or you are writing "Improve"
 * for the second time, you want K4. If more than eight verbs apply to the
 * selection you want neither — that is I2 `property-inspector`, and it is
 * the boundary the spec's cap draws ("past that it competes with the
 * inspector").
 */
export const Boundary: Story = {
  render: () => (
    <div className="flex w-full max-w-2xl flex-col gap-6">
      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">
          I3 context toolbar — verbs you supply, one flat onAction
        </p>
        <ContextToolbar selection="image" actions={IMAGE_ACTIONS} onAction={() => {}} aiMenu={AI_MENU} />
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">
          K4 selection toolbar — the writing vocabulary, built on I3
        </p>
        <SelectionToolbar
          selectionText="The model timed out before the second pass finished."
          onIntent={() => {}}
        />
      </section>
    </div>
  ),
};
