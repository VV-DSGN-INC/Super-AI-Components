import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import {
  AudioLines,
  Captions,
  Crop,
  Eraser,
  HelpCircle,
  Layers,
  Music,
  Palette,
  Pencil,
  Settings,
  Sparkles,
  Square,
  Type,
  Wand2,
} from "lucide-react";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { Button } from "@/components/ui/button";
import { ModalityRail } from "@/registry/super-ai/modality-rail";
import { ModeTabs } from "@/registry/super-ai/mode-tabs";
import { SidebarNav } from "@/registry/super-ai/sidebar-nav";
import { ModalityRailDocs } from "@/content/components/modality-rail.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const meta: Meta<typeof ModalityRail> = {
  title: "Super AI/Modality Rail",
  component: ModalityRail,
  parameters: { layout: "centered", docs: { page: componentDocsPage(ModalityRailDocs) } },
};

export default meta;
type Story = StoryObj<typeof ModalityRail>;

const TOOLS = [
  { id: "select", label: "Select", icon: <Square /> },
  { id: "draw", label: "Draw", icon: <Pencil /> },
  { id: "text", label: "Text", icon: <Type /> },
  { id: "layers", label: "Layers", icon: <Layers /> },
];

export const Active: Story = {
  args: {
    items: TOOLS,
    activeId: "draw",
  },
};

export const Overflow: Story = {
  args: {
    items: [
      ...TOOLS,
      { id: "audio", label: "Audio", icon: <Music /> },
      { id: "effects", label: "Effects", icon: <Wand2 /> },
    ],
    activeId: "select",
    maxVisible: 3,
  },
};

export const WithBadge: Story = {
  args: {
    items: [
      ...TOOLS,
      { id: "audio", label: "Audio", icon: <Music />, badge: "new" },
      { id: "upscale", label: "Upscale", icon: <Sparkles />, badge: "pro" },
    ],
    activeId: "draw",
  },
};

export const BottomPinned: Story = {
  args: {
    items: TOOLS,
    activeId: "select",
    pinned: [
      { id: "plugins", label: "Plugins", icon: <Wand2 /> },
      { id: "settings", label: "Settings", icon: <Settings /> },
    ],
  },
};

/* -------------------------------------------------------------------------
 * Case stories — the situations this component meets in a product, as
 * opposed to the prop combinations above. See
 * docs/design-system/story-conventions.md.
 *
 * Seven of the eight are true here: the rail is a direction-bearing edge
 * column, it opens two animating Base UI popups, it is a composite with a
 * roving tabindex, it is a controlled selection, its labels are
 * author-supplied, and two catalog neighbours are genuinely mistakable for
 * it. The eighth is not:
 *
 * // case-skip: EmptyLabel — `label` is required, and it is the item button's only accessible-name source
 * `ModalityRailItemData.label` is a required `string`, so there is no
 * optional text slot to empty. Reaching the no-label rendering means passing
 * `label=""`, and the button would then have nothing left: its icon lives
 * inside an `aria-hidden` wrapper, and the tooltip is a description rather
 * than a name — Base UI's tooltip never contributes to the trigger's
 * accessible name. That is an axe `button-name` violation in a gate running
 * at `test: "error"`, manufactured by the story rather than by the
 * component. The rail's own version of the risk — treating the tooltip as
 * the place an item's name lives — is already the docs module's first
 * pitfall, and `LongContent` below shows the case where it stops being
 * hypothetical.
 * ---------------------------------------------------------------------- */

/**
 * Right-to-left, where an edge column has more to get wrong than most
 * components: the rail moves to the right edge of the shell, its seam with
 * the canvas moves to its left, and every badge riding on an icon has to
 * cross with it.
 *
 * Three physical properties were swapped to logical ones for this story, all
 * byte-identical in LTR: the root's `border-r` → `border-e`, and both badge
 * marks' `-right-*` → `-end-*`. Rendered here, the seam is on the canvas side
 * and the "New" dot and Pro crown sit on the icon's leading corner.
 *
 * **The half this wrapper cannot reach, and the integration fact worth the
 * story.** The tooltip and the overflow popover now carry logical sides too
 * (`side="inline-end"` rather than `"right"`), so they are *able* to open
 * toward the canvas instead of off the outer edge of the screen — but Base UI
 * resolves that from React context, not from the DOM. `useDirection()`
 * returns `context?.direction ?? "ltr"` and never looks at the `dir`
 * attribute, so a `<div dir="rtl">` flips every CSS logical property here and
 * still leaves both popups opening right. An RTL shell has to mount
 * `<DirectionProvider direction="rtl">` as well, and neither one implies the
 * other. It is not staged here because a provider that changes nothing until
 * a popup is open would read as a demonstration and is not one.
 *
 * Not mirrored, deliberately: the tool glyphs. A pencil, a crop frame and a
 * type "T" are drawn the same way in every locale, and the overflow chevron
 * points down rather than along the inline axis, so none of them is a
 * direction cue.
 */
export const RTL: Story = {
  render: (args) => (
    <div dir="rtl" className="flex">
      <ModalityRail
        {...args}
        items={[
          ...TOOLS,
          { id: "audio", label: "Audio", icon: <Music />, badge: "new" },
          { id: "upscale", label: "Upscale", icon: <Sparkles />, badge: "pro" },
        ]}
        activeId="draw"
        maxVisible={5}
        pinned={[
          { id: "plugins", label: "Plugins", icon: <Wand2 /> },
          { id: "settings", label: "Settings", icon: <Settings /> },
        ]}
      />
    </div>
  ),
};

/**
 * The reduced-motion branch, which for this component lives entirely in the
 * two Base UI popups it opens: the per-item tooltip and the overflow
 * popover. Both enter with `data-open:animate-in fade-in-0 zoom-in-95` plus a
 * side-specific slide, and neither reads the media feature on its own.
 *
 * The registry's usual one-class remedy — a bare `motion-reduce:animate-none`
 * beside the `animate-*`, as `task-tray` and `citation-ref` use — is inert
 * here, and inert quietly: `data-open:animate-in` compiles to a
 * data-attribute selector that wins the tie on source order, the class sits
 * in the string doing nothing, and the only way to notice is to read
 * `animation-name` back. Restating the variant on both halves
 * (`motion-reduce:data-open:animate-none motion-reduce:data-closed:animate-none`)
 * sorts after its counterpart and wins. That is `shortcuts-sheet`'s finding,
 * applied to the second and third Base UI popups in the registry to need it.
 *
 * `vitest.config.ts` emulates `prefers-reduced-motion: reduce` for every
 * test, so the assertions below are the rendered result rather than a
 * class-name check. Both popups are opened and read while `data-open` is
 * still on them; against the bare class each read back `"enter"`.
 *
 * **What opening the popover found, and the argument for these stories.**
 * This is the first story in the repo to open the overflow popover, and axe
 * failed it immediately: Base UI's popup renders `role="dialog"`, this
 * surface has no title part, and nothing was giving it a name —
 * `aria-dialog-name`, shipped since Wave 2 and invisible to every gate
 * because the four declared-state stories all render the popover closed.
 * Fixed at the source (`aria-label={overflowLabel}` on `PopoverContent`), so
 * the assertions below are the second thing this story checks rather than
 * the first.
 */
export const ReducedMotion: Story = {
  args: {
    items: [
      ...TOOLS,
      { id: "audio", label: "Audio", icon: <Music /> },
      { id: "effects", label: "Effects", icon: <Wand2 /> },
    ],
    activeId: "draw",
    maxVisible: 3,
  },
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

    // The tooltip: one per item, opened on hover with the provider's zero
    // delay.
    await userEvent.hover(canvas.getByRole("button", { name: "Draw" }));
    const tooltip = await settledPopup("tooltip-content");
    await expect(tooltip).toHaveAttribute("data-open");
    await expect(getComputedStyle(tooltip).animationName).toBe("none");

    // The overflow popover, which is the surface a user actually watches
    // arrive — it is 192px of list sliding out of a 92px column.
    await userEvent.click(canvas.getByRole("button", { name: "More tools" }));
    const popover = await settledPopup("popover-content");
    await expect(popover).toHaveAttribute("data-open");
    await expect(getComputedStyle(popover).animationName).toBe("none");
  },
};

/**
 * The rail is not one tab stop per tool, and that is the whole story.
 *
 * Each `ToggleGroup` is a Base UI composite, so it implements the roving
 * tabindex the ARIA toolbar pattern asks for: exactly one item inside it
 * carries `tabindex="0"` and the rest carry `-1`, with Arrow keys moving
 * between them. The rail below is seven buttons — four tools, the chevron,
 * two pinned rows — and **three** tab stops: the middle group, the chevron,
 * the pinned group. That ratio is what keeps a fourteen-tool rail from
 * costing a keyboard user fourteen presses to get past it, and it is the
 * invariant asserted below, restated after an Arrow press so it reads as a
 * property of the group rather than of its initial render.
 *
 * Asserting the count rather than the order is deliberate. Which item holds
 * the `0` is a fact about Base UI's composite (it highlights index 0 until
 * something moves it), not a fact about this component, and pinning it here
 * would make a future change to it read as a modality-rail regression.
 *
 * **Defect, recorded not fixed — the rail arrows sideways.** A vertical rail
 * should move on Up/Down, and this one moves on Left/Right: `ArrowDown` is a
 * no-op and `ArrowRight` advances. The cause is one line up the stack.
 * `components/ui/toggle-group.tsx` destructures `orientation` out of its
 * props and spends it on `data-orientation` and the `data-vertical:flex-col`
 * styling, then never forwards it to Base UI's primitive — so `CompositeRoot`
 * keeps its default horizontal axis while the column is laid out vertically.
 * `modality-rail.tsx` passes `orientation="vertical"` and is told nothing.
 * The fix belongs in that shared shadcn primitive, which every toggle group
 * in the registry consumes, so it is not a change fourteen concurrent
 * retrofits should each be making; the assertion below is written to survive
 * it rather than to hold it in place.
 *
 * **Second thing worth knowing, also not fixed:** the tab stop is the *first*
 * item, not the *active* one. A keyboard user tabbing into a rail whose
 * active tool is "Layers" lands on "Select" and has to arrow across to reach
 * where they already are. The APG radiogroup pattern puts the stop on the
 * checked option for exactly this reason; the toolbar pattern this primitive
 * implements does not, and the rail is a single-select control wearing a
 * multi-select primitive (see the `handleValueChange` comment in
 * `modality-rail.tsx`). Fixing it means driving `highlightedIndex` from
 * `activeId`, which is a change to the component's composite wiring rather
 * than to this story.
 */
export const KeyboardOrder: Story = {
  args: {
    items: [
      ...TOOLS,
      { id: "audio", label: "Audio", icon: <Music /> },
      { id: "effects", label: "Effects", icon: <Wand2 /> },
    ],
    activeId: "layers",
    maxVisible: 4,
    pinned: [
      { id: "plugins", label: "Plugins", icon: <Wand2 /> },
      { id: "help", label: "Help", icon: <HelpCircle /> },
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Seven real buttons: four visible tools, the chevron, two pinned.
    const buttons = canvas.getAllByRole("button");
    await expect(buttons).toHaveLength(7);

    // Every one of them is named, and no two share a name. A rail is where
    // that goes wrong — repeated icon controls, a chevron whose `aria-label`
    // duplicates its own visible text, and a pinned group assembled from a
    // second array that nothing stops a caller reusing ids across. No gate
    // catches a duplicate accessible name; screen-reader users are the ones
    // who find it, on a list of seven identical-sounding buttons.
    const names = buttons.map((b) => b.textContent?.replace(/\s+/g, " ").trim() ?? "");
    await expect(names.filter(Boolean)).toHaveLength(7);
    await expect(new Set(names).size).toBe(7);

    const groups = Array.from(canvasElement.querySelectorAll<HTMLElement>('[data-slot="toggle-group"]'));
    await expect(groups).toHaveLength(2);

    const tabbableIn = (root: HTMLElement) =>
      Array.from(root.querySelectorAll<HTMLElement>('button:not([tabindex="-1"])'));

    // One stop per composite, before anything has moved.
    for (const group of groups) {
      await expect(tabbableIn(group)).toHaveLength(1);
    }

    const stops = tabbableIn(canvasElement);
    await expect(stops).toHaveLength(3);

    // Every stop is genuinely focus-visible and paints a ring — the rail's
    // items suppress the outline in favour of one, so an unpainted ring
    // would leave a keyboard user with no cursor at all.
    await userEvent.tab();
    let visited = 0;
    while (document.activeElement && canvasElement.contains(document.activeElement)) {
      const focused = document.activeElement as HTMLElement;
      await expect(stops).toContain(focused);
      await expect(focused.matches(":focus-visible")).toBe(true);
      const style = getComputedStyle(focused);
      await expect(style.boxShadow !== "none" || style.outlineStyle !== "none").toBe(true);
      visited += 1;
      await userEvent.tab();
    }
    await expect(visited).toBe(3);

    // Arrow keys reach the tools the single stop skipped, and the invariant
    // holds after the move: still exactly one tabbable item per group, just
    // a different one.
    //
    // Both keys are pressed on purpose, and the story description has the
    // reason: exactly one of them is live today and the other is live after
    // the orientation defect is fixed, and a composite ignores the key that
    // is off its axis. So "Down then Right" advances by exactly one item in
    // either world, and this assertion survives the fix instead of pinning
    // the bug.
    const tools = groups[0];
    tabbableIn(tools)[0].focus();
    await userEvent.keyboard("{ArrowDown}{ArrowRight}");
    await waitFor(() => expect(document.activeElement).toBe(canvas.getByRole("button", { name: "Draw" })));
    await expect(tools.contains(document.activeElement)).toBe(true);
    await expect(tabbableIn(tools)).toHaveLength(1);
    await expect(tabbableIn(tools)[0]).toBe(document.activeElement);
  },
};

/**
 * `activeId` / `onSelect` is a real controlled pair — there is no
 * `defaultActiveId` and no internal state, so the rail renders whatever the
 * shell says the active tool is and nothing else. The host below is a
 * deliberately slow one: it records the request and only applies it when
 * "Apply" is pressed, which separates the two halves a consumer has to
 * trust.
 *
 * Four facts, all asserted, because a `Controlled` story without a play
 * function is a screenshot of a prop:
 *
 * 1. **`activeId` wins over interaction.** Clicking "Text" while the host
 *    still says "Draw" moves no `aria-pressed`.
 * 2. **`onSelect` hands back the payload a consumer needs to apply it** —
 *    the item's own `id` string, not an event.
 * 3. **An unchanged `activeId` holds the rail fixed across re-renders.** The
 *    counter is checked to have advanced before the selection is checked not
 *    to have, so the assertion cannot pass by the re-render never happening.
 * 4. **Re-pressing the active tool reports nothing.** Base UI's toggle group
 *    is a toggle, not a radio, and commits an empty array when you press the
 *    lit item; `handleValueChange` drops that, so a shell driving `activeId`
 *    from `onSelect` can never be handed "no tool selected". That is the
 *    component's own behaviour rather than the primitive's, which is why it
 *    is pinned here.
 */
export const Controlled: Story = {
  render: () => <ControlledShell />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const draw = canvas.getByRole("button", { name: "Draw" });
    const text = canvas.getByRole("button", { name: "Text" });
    await expect(draw).toHaveAttribute("aria-pressed", "true");

    // 1. Interaction alone does not move the rendered value.
    await userEvent.click(text);
    await expect(draw).toHaveAttribute("aria-pressed", "true");
    await expect(text).toHaveAttribute("aria-pressed", "false");

    // 2. …but the callback fired, with the id the host needs.
    await expect(canvas.getByTestId("requested")).toHaveTextContent("text");

    // 3. Re-render with an unchanged `activeId`. Prove the re-render first.
    await expect(canvas.getByTestId("render-pass")).toHaveTextContent("1");
    await userEvent.click(canvas.getByRole("button", { name: "Re-render" }));
    await expect(canvas.getByTestId("render-pass")).toHaveTextContent("2");
    await expect(draw).toHaveAttribute("aria-pressed", "true");
    await expect(text).toHaveAttribute("aria-pressed", "false");

    // The payload was sufficient to apply the change.
    await userEvent.click(canvas.getByRole("button", { name: "Apply" }));
    await expect(text).toHaveAttribute("aria-pressed", "true");
    await expect(draw).toHaveAttribute("aria-pressed", "false");

    // 4. Pressing the now-active tool again reports nothing, so the shell is
    //    never asked to deselect every tool.
    await userEvent.click(canvas.getByTestId("clear-request"));
    await expect(canvas.getByTestId("requested")).toHaveTextContent("—");
    await userEvent.click(text);
    await expect(canvas.getByTestId("requested")).toHaveTextContent("—");
    await expect(text).toHaveAttribute("aria-pressed", "true");
  },
};

function ControlledShell() {
  const [applied, setApplied] = React.useState("draw");
  const [requested, setRequested] = React.useState<string | null>(null);
  const [pass, setPass] = React.useState(1);

  return (
    <div className="flex items-start gap-4">
      <ModalityRail items={TOOLS} activeId={applied} onSelect={setRequested} />

      <div className="flex flex-col gap-4 py-2">
        <dl className="text-foreground grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs">
          <dt>activeId prop</dt>
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
          <Button size="sm" variant="ghost" data-testid="clear-request" onClick={() => setRequested(null)}>
            Clear
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Author-supplied labels in a column that cannot widen, which is where the
 * docs module's first pitfall stops being hypothetical.
 *
 * The item label is `truncate` inside `w-full`, so the column's answer is:
 * clip at roughly eleven characters and add an ellipsis. It never wraps and
 * the rail never grows. "Background removal" reads "Background…"; the
 * 82-character string below — the shape that actually arrives when a rail is
 * built from a plugin manifest's `displayName` rather than from a hand-picked
 * noun — reads the same eleven characters as every other long one. At that
 * point the tooltip is not a supplement to the label, it is the only place
 * the name exists, and a touch user has no hover to get it. Keep rail labels
 * to a single short word; the component cannot enforce it.
 *
 * **Defect, recorded not fixed:** `overflowLabel` does not get the same
 * treatment. Its span carries no `truncate`, no `min-w-0` and no
 * `break-words`, so a long overflow label wraps to as many centred lines as
 * it needs — visible below — and a single long token would push past the
 * 92px column instead of clipping. The two text slots in one component
 * answering long content two different ways is the bug; making them agree is
 * a visual decision for one integrator rather than fourteen concurrent
 * retrofits.
 *
 * The popover rows are the one place there is room: `flex-1 truncate` at
 * `text-sm` in a 192px surface, so an overflowed tool shows far more of its
 * name than a visible one does. Open the chevron to see it.
 */
export const LongContent: Story = {
  args: {
    items: [
      { id: "select", label: "Select", icon: <Square /> },
      {
        id: "background",
        label: "Background removal and sky replacement, including hair matting and edge refinement",
        icon: <Eraser />,
      },
      { id: "captions", label: "Auto captions", icon: <Captions /> },
      { id: "colour", label: "Colour grading", icon: <Palette /> },
      { id: "audio", label: "Audio ducking", icon: <AudioLines /> },
    ],
    activeId: "background",
    maxVisible: 3,
    overflowLabel: "More editing tools",
  },
};

/**
 * 375px, and the arithmetic is the point: the rail is a fixed 92px, so on a
 * phone it is a quarter of the viewport spent on chrome before the canvas
 * gets any. Nothing scrolls horizontally — `w-[92px] shrink-0` holds and the
 * canvas takes the remainder — but "fits" and "is the right component" are
 * different claims. At this width most shells drop the rail for D4
 * `mode-tabs` along the bottom edge and keep the 283px for the artwork; see
 * `Boundary`.
 *
 * The mobile-specific consequence of keeping it: `maxVisible` has to come
 * down, so more tools move behind the chevron — and the chevron gives no
 * sign that one of them is the *active* one. With `activeId` pointing at an
 * overflowed tool, nothing in the rail is pressed and the only feedback that
 * a tool is selected at all has disappeared. Worth knowing before choosing a
 * `maxVisible` under about four.
 */
export const Mobile: Story = {
  render: (args) => (
    <div className="w-[375px] max-w-full">
      <div className="flex h-64 items-stretch">
        <ModalityRail
          {...args}
          items={[
            ...TOOLS,
            { id: "crop", label: "Crop", icon: <Crop /> },
            { id: "audio", label: "Audio", icon: <Music /> },
            { id: "effects", label: "Effects", icon: <Wand2 /> },
            { id: "upscale", label: "Upscale", icon: <Sparkles />, badge: "pro" },
          ]}
          activeId="draw"
          maxVisible={4}
          pinned={[{ id: "settings", label: "Settings", icon: <Settings /> }]}
        />
        <div className="text-muted-foreground flex flex-1 items-center justify-center text-xs">
          Canvas — 283px
        </div>
      </div>
    </div>
  ),
};

/**
 * Three switchers that all live in the left third of a shell and are not
 * interchangeable. The rule is about **what the choice changes**:
 *
 * - **Modality rail (B4)** changes what your next gesture does to the canvas
 *   you are already looking at. Pick "Draw" and the canvas stays; the
 *   pointer changes. It is the tool, and it is why the column is icon-first
 *   and can run to fourteen entries with an overflow.
 * - **`mode-tabs` (D4)** changes how the same surface interprets the *same*
 *   input — Ask versus Design versus Build over one composer. Two to five
 *   options, words not glyphs, horizontal, no overflow: past five it is not
 *   a mode set any more and the spec sends you to a select.
 * - **`sidebar-nav` (B3)** changes what you are looking at. Pick "Library"
 *   and the canvas is replaced. It is sectioned, it carries counts, tier
 *   badges and running spinners, and its rows are destinations rather than
 *   states.
 *
 * The one-line test: if the choice replaces the canvas it is navigation; if
 * it changes what a click on the canvas does it is the rail; if it changes
 * what the composer *means* and there are five or fewer of them, it is mode
 * tabs. The seam that gets crossed most often is the third one — a rail
 * whose items are "Chat / Image / Video" is a mode set that has been drawn as
 * tools, and it should be `mode-tabs`.
 *
 * Both neighbours share this component's `activeId` / `onSelect` shape, and
 * `sidebar-nav` also ships a `pinned` group, so swapping between them is a
 * rename rather than a rewrite once the choice is made.
 */
export const Boundary: Story = {
  render: () => (
    <div className="flex w-full max-w-2xl flex-col gap-6">
      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">
          Modality rail — changes what the next gesture does
        </p>
        <div className="flex h-56 items-stretch">
          <ModalityRail
            items={[
              ...TOOLS,
              { id: "crop", label: "Crop", icon: <Crop /> },
              { id: "effects", label: "Effects", icon: <Wand2 /> },
            ]}
            activeId="draw"
            maxVisible={5}
            pinned={[{ id: "settings", label: "Settings", icon: <Settings /> }]}
          />
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">Mode tabs — changes what the composer means</p>
        <ModeTabs
          label="Mode"
          defaultValue="design"
          modes={[
            { value: "ask", label: "Ask" },
            { value: "design", label: "Design" },
            { value: "build", label: "Build" },
          ]}
        />
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">Sidebar nav — changes what you are looking at</p>
        <SidebarNav
          className="w-56"
          activeId="projects"
          sections={[
            {
              label: "Workspace",
              items: [
                { id: "projects", label: "Projects" },
                { id: "library", label: "Library", count: 12 },
                { id: "renders", label: "Renders", running: true },
              ],
            },
          ]}
        />
      </section>
    </div>
  ),
};
