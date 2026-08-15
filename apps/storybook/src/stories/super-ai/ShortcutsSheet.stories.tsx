import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { Button } from "@/components/ui/button";
import { Kbd, KbdGroup } from "@/registry/super-ai/kbd";
import { ShortcutsSheet, type ShortcutSection } from "@/registry/super-ai/shortcuts-sheet";
import { ShortcutsSheetDocs } from "@/content/components/shortcuts-sheet.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const meta: Meta<typeof ShortcutsSheet> = {
  title: "Super AI/Shortcuts Sheet",
  component: ShortcutsSheet,
  parameters: { layout: "centered", docs: { page: componentDocsPage(ShortcutsSheetDocs) } },
  // Every story except the two that open from a trigger renders the sheet
  // already open. `preview.tsx` runs axe at `test: "error"` per story, and a
  // closed Dialog renders nothing at all — a story that only shows a button
  // is a gate over an empty canvas.
  args: { open: true },
};

export default meta;
type Story = StoryObj<typeof ShortcutsSheet>;

/* Fixture sections. Bindings an assistant-plus-editor product of this kind
 * really ships — the composer keys Claude and ChatGPT use, the transport and
 * trim keys Descript and CapCut use — grouped under the app's own nouns,
 * which is what the spec means by "sections mirror the app's vocabulary".
 * `Show keyboard shortcuts` is in the list on purpose: the sheet documents
 * the key that opens it. */
const COMPOSER: ShortcutSection = {
  title: "Composer",
  shortcuts: [
    { label: "Send message", keys: ["⌘", "↵"] },
    { label: "New line", keys: ["⇧", "↵"] },
    { label: "Attach a file", keys: ["⌘", "⇧", "A"] },
    { label: "Stop generating", keys: ["Esc"] },
  ],
};

const THREADS: ShortcutSection = {
  title: "Threads",
  shortcuts: [
    { label: "New chat", keys: ["⌘", "N"] },
    { label: "Search chats", keys: ["⌘", "K"] },
    { label: "Toggle sidebar", keys: ["⌘", "B"] },
    { label: "Show keyboard shortcuts", keys: ["⌘", "/"] },
  ],
};

const TIMELINE: ShortcutSection = {
  title: "Timeline",
  shortcuts: [
    { label: "Play / pause", keys: ["Space"] },
    { label: "Split clip at playhead", keys: ["⌘", "⇧", "S"] },
    { label: "Undo", keys: ["⌘", "Z"] },
    { label: "Redo", keys: ["⌘", "⇧", "Z"] },
  ],
};

const VIEW: ShortcutSection = {
  title: "View",
  shortcuts: [
    { label: "Zoom in", keys: ["⌘", "="] },
    { label: "Zoom out", keys: ["⌘", "-"] },
    { label: "Fit to window", keys: ["⇧", "F"] },
    { label: "Toggle full screen", keys: ["⌃", "⌘", "F"] },
  ],
};

const SELECTION: ShortcutSection = {
  title: "Selection",
  shortcuts: [
    { label: "Select all", keys: ["⌘", "A"] },
    { label: "Duplicate", keys: ["⌘", "D"] },
    { label: "Group", keys: ["⌘", "G"] },
    { label: "Delete", keys: ["⌫"] },
  ],
};

const EXPORT: ShortcutSection = {
  title: "Export",
  shortcuts: [
    { label: "Export video", keys: ["⌘", "⇧", "E"] },
    { label: "Copy share link", keys: ["⌘", "⇧", "C"] },
    { label: "Save a version", keys: ["⌘", "S"] },
    { label: "Version history", keys: ["⌘", "Y"] },
  ],
};

/* -------------------------------------------------------------------------
 * Declared states — one export per normalized state.
 *
 * The manifest's `states` are catalog free text copied from the spec's
 * ambitions rather than from this build: "sectioned · searchable · pinned
 * header · controls-primer variant". Two of those four do not exist in the
 * component.
 *
 * - `searchable` — there is no search input, no `query`/`onQueryChange`, and
 *   no filtering anywhere in shortcuts-sheet.tsx. `sections` is rendered
 *   whole. A `no-results` state cannot be declared over an API that cannot
 *   produce one, so it is not below; the gap is recorded in the docs module
 *   and in `Boundary`, which names the neighbour that *did* ship search.
 * - `controls-primer variant` — there is no `variant` prop. The spec's
 *   grouped input-method cards are a second rendering of the same data that
 *   this component does not have.
 *
 * `pinned header` is real but is a layout fact rather than a situation, so it
 * is normalized to the situation that produces it: `scrolling-list`. The two
 * ways the sheet is opened are the other genuine states, because they are the
 * component's only branch — `trigger` renders a DialogTrigger or nothing.
 *
 * Proposed: sectioned · scrolling-list · trigger-button · controlled-open.
 *
 * Shape rules (story-conventions.md §Manifest-shape rules): neither applies.
 * The component exposes no `disabled` — not its own prop, and not passed
 * through, since the only interactive descendant it owns is the Dialog's
 * close button and `trigger` is the caller's own element. And there is no
 * async lifecycle: `sections` is a plain prop, nothing is fetched, so there
 * is no loading-shaped or failure-shaped state to declare.
 * ---------------------------------------------------------------------- */

export const Sectioned: Story = {
  args: { sections: [COMPOSER, THREADS, TIMELINE] },
};

/**
 * More sections than fit. The sheet is `flex max-h-[80vh] flex-col` with the
 * header outside the scroll container, so the title holds still and only the
 * list moves — that is what the catalog's "pinned header" refers to.
 *
 * This story is also the one that found a real defect. Overflowing the cap
 * used to fail axe's `scrollable-region-focusable`: the list scrolled, held
 * nothing focusable, and had no tab stop, so a keyboard user could open a
 * sixty-binding sheet and read the first screenful only. The fix is the same
 * `tabIndex` + `aria-label` idiom the shell components already use, and it is
 * pinned by `KeyboardOrder` below.
 */
export const ScrollingList: Story = {
  args: { sections: [COMPOSER, THREADS, TIMELINE, VIEW, SELECTION, EXPORT] },
};

/**
 * Opened from the caller's own button. `trigger` is handed to Base UI's
 * `render` prop rather than Radix's `asChild`, so the open handler is merged
 * onto whatever element you pass — the play function opens it that way rather
 * than asserting a click, because that merge is the adaptation this file's
 * source comment exists to warn about.
 */
export const TriggerButton: Story = {
  args: {
    sections: [COMPOSER, THREADS],
    trigger: <Button variant="outline">Keyboard shortcuts</Button>,
  },
  // `open` is dropped rather than set to `undefined`: Storybook merges story
  // args over meta args and skips undefined values, so the meta's `open: true`
  // would survive and the sheet would be controlled-open with a trigger that
  // does nothing.
  render: ({ open: _open, ...args }) => <ShortcutsSheet {...args} />,
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("button", { name: "Keyboard shortcuts" }));
    await expect(await within(document.body).findByRole("dialog")).toBeInTheDocument();
  },
};

/**
 * The app owns `open`. This is the shape a global `⌘ /` handler needs: no
 * trigger element exists anywhere, the sheet is mounted with the state the
 * app holds, and `onOpenChange` is the only way it asks to close. See
 * `Controlled` below for what that costs if the app never applies the ask.
 */
export const ControlledOpen: Story = {
  args: { sections: [COMPOSER, THREADS, TIMELINE], onOpenChange: () => {} },
};

/* -------------------------------------------------------------------------
 * Case stories — the situations this component meets in a product, as
 * opposed to the prop combinations above. See
 * docs/design-system/story-conventions.md.
 *
 * Not written for this component, deliberately:
 *
 * // case-skip: EmptyLabel — every text slot is required or defaulted; there is no no-label rendering
 * `section.title` and `shortcut.label` are required strings, and the sheet's
 * own `title` defaults to "Keyboard Shortcuts". The only way to reach a
 * missing label is `title=""`, which ships a Dialog with no accessible name —
 * an axe failure in a gate that runs at `test: "error"`, and a caller error
 * that belongs in the docs page's donts, where it is. The one genuinely
 * emptiable slot is `keys: []`, which renders a label with nothing opposite
 * it; that is recorded as a pitfall rather than staged as a story, because it
 * documents an unbound action rather than a labelling failure.
 * ---------------------------------------------------------------------- */

/**
 * Right-to-left, and the story that matters most for a component whose whole
 * job is a two-column map. Each row is `flex justify-between`, so the label
 * moves to the right edge and the keycaps to the left — correct.
 *
 * Two things it renders that are worth looking at rather than reading:
 *
 * - `KbdGroup` is a plain `inline-flex` with no direction of its own, so a
 *   chord reverses with the container: `⌘ ⇧ Z` is painted `Z ⇧ ⌘`. Key
 *   chords are conventionally written modifier-first in every locale, so
 *   this is a defect — recorded, not fixed, because the fix belongs in
 *   `kbd.tsx` (A1) and this component only consumes it.
 * - The Dialog's close button is `absolute top-2 right-2`, a physical corner
 *   rather than a logical one, so it stays on the right and collides with
 *   the section headings' new start edge. That class lives in
 *   `components/ui/dialog.tsx` and is shared by every dialog in the repo.
 *
 * The usual `<div dir="rtl">` wrapper cannot work here: `DialogContent`
 * portals to the end of `document.body`, so a wrapper in the story canvas is
 * never an ancestor of the thing under test.
 */
export const RTL: Story = {
  args: { sections: [COMPOSER, TIMELINE] },
  render: (args) => (
    <RtlDocument>
      <ShortcutsSheet {...args} />
    </RtlDocument>
  ),
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
 * The reduced-motion branch, and a trap worth the whole story. `DialogContent`
 * opens with `data-open:animate-in zoom-in-95` and closes with
 * `data-closed:animate-out`, neither of which reads the media feature.
 *
 * The registry's usual one-class remedy — a bare `motion-reduce:animate-none`
 * beside the `animate-*`, as `task-tray` and `trace-timeline` use — **does
 * nothing here**, and does nothing quietly. `data-open:animate-in` compiles to
 * `.data-open\:animate-in[data-open]`, specificity 0-2-0; the media query adds
 * none, so `.motion-reduce\:animate-none` at 0-1-0 loses regardless of order.
 * The class sits in the string, the element keeps animating, and the only way
 * to notice is to read `animation-name` back. Matching the variant
 * (`motion-reduce:data-open:animate-none`) restores specificity and wins.
 * That applies to every Base UI popup in this repo, not just this one.
 *
 * `vitest.config.ts` emulates `prefers-reduced-motion: reduce` for every test,
 * so the assertion below is the rendered result rather than a class-name
 * check: the popup's computed `animation-name` resolves to `none` while
 * `data-open` is still on the element. Against the bare class it read
 * `"enter"`.
 *
 * Not covered, and visible in this story if you look at the page behind the
 * sheet: the backdrop still fades. `DialogOverlay`'s animation classes live in
 * `components/ui/dialog.tsx`, which this component does not own and cannot
 * reach through `className`.
 */
export const ReducedMotion: Story = {
  args: { sections: [COMPOSER, THREADS] },
  play: async () => {
    const sheet = await within(document.body).findByRole("dialog");
    await expect(sheet).toHaveAttribute("data-open");
    await expect(getComputedStyle(sheet).animationName).toBe("none");
  },
};

/**
 * The sharpest story in this file: a keyboard-shortcuts sheet that a keyboard
 * cannot operate is the worst failure the catalog can ship, so this one
 * checks the whole loop rather than a tab order.
 *
 * What it pins:
 *
 * 1. Opening from the trigger moves focus into the sheet.
 * 2. There are exactly **two** stops inside it, in this order: the scrolling
 *    list, then the close button. The list is a tab stop because it scrolls
 *    and holds nothing focusable — without it a keyboard user could open a
 *    sixty-binding sheet and never reach binding twenty-one. Everything else
 *    in the map is `<li>` and `pointer-events-none` keycaps, which is correct
 *    for a read-only reference and is why this walk terminates.
 * 3. Every stop is visibly focused: it matches `:focus-visible` and its
 *    computed style paints a ring or an outline. The list needs its own ring
 *    because a focused scroll container is otherwise indistinguishable from
 *    an unfocused one.
 * 4. Focus is trapped. Tabbing past the close button returns inside the
 *    sheet instead of leaking to the inert page behind it.
 * 5. Escape closes the sheet **and returns focus to the trigger**. Without
 *    that last half, a keyboard user who opens the sheet lands back at the
 *    top of the document and has to re-traverse the app to get home.
 *
 * The walk is bounded by the measured stop count. This is a modal Dialog:
 * the exemplar's `while (canvasElement.contains(activeElement))` loop would
 * never terminate here, because the trap guarantees the condition stays true
 * forever.
 */
export const KeyboardOrder: Story = {
  args: {
    sections: [COMPOSER, THREADS],
    trigger: <Button variant="outline">Keyboard shortcuts</Button>,
  },
  // Uncontrolled on purpose — Escape has to be able to actually close it.
  render: ({ open: _open, ...args }) => <ShortcutsSheet {...args} />,
  play: async ({ canvasElement }) => {
    const trigger = within(canvasElement).getByRole("button", { name: "Keyboard shortcuts" });
    await userEvent.click(trigger);

    const sheet = await within(document.body).findByRole("dialog");
    const stops = Array.from(
      sheet.querySelectorAll<HTMLElement>(
        'button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      ),
    );
    // The scroll region, then the close button — DOM order, since nothing
    // here sets a positive tabindex. A third entry means something in the map
    // became focusable, which is a different component.
    await expect(stops).toHaveLength(2);
    await expect(stops[0]).toHaveAttribute("data-slot", "shortcuts-list");
    await expect(stops[1]).toHaveAttribute("data-slot", "dialog-close");

    // The trap installs asynchronously — wait for it rather than tabbing from
    // wherever focus happens to be at mount.
    await waitFor(() => expect(sheet.contains(document.activeElement)).toBe(true));

    const seen = new Set<HTMLElement>();
    // The allowance above `stops.length` absorbs the popup container, which
    // the trap makes focusable but which is not a control.
    for (let i = 0; i < stops.length * 6 + 6 && seen.size < stops.length; i += 1) {
      await userEvent.tab();
      const focused = document.activeElement as HTMLElement;
      if (!stops.includes(focused)) continue;

      const id = focused.getAttribute("data-slot") ?? focused.tagName;
      await expect(`${id} focusVisible=${focused.matches(":focus-visible")}`).toBe(
        `${id} focusVisible=true`,
      );
      const style = getComputedStyle(focused);
      await expect(`${id} ring=${style.boxShadow !== "none" || style.outlineStyle !== "none"}`).toBe(
        `${id} ring=true`,
      );
      seen.add(focused);
    }
    await expect(seen.size).toBe(stops.length);

    // Trapped: one more tab past the last stop stays inside the sheet.
    await userEvent.tab();
    await expect(sheet.contains(document.activeElement)).toBe(true);

    // Escape dismisses, and the trigger gets the ring back.
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(within(document.body).queryByRole("dialog")).toBeNull());
    await waitFor(() => expect(document.activeElement).toBe(trigger));
  },
};

/**
 * `open` / `onOpenChange` is a real controlled pair, and this story is the
 * only place that fact is checked rather than asserted in prose.
 *
 * The parent below is deliberately a rejecting one: it records every request
 * and re-renders with `open` still `true`. That separates the two halves a
 * consumer has to trust — the callback fires with the boolean the app needs
 * to apply, and the sheet does not dismiss itself while the app says it is
 * open. Both of the component's own dismiss paths are exercised, Escape and
 * the close button, because Base UI routes them through the same handler and
 * a regression in either would be invisible from the other.
 *
 * The probe is read by test id, not by role: an open modal marks everything
 * outside the popup `aria-hidden`, so nothing in the story canvas has an
 * accessible role while the sheet is up.
 */
export const Controlled: Story = {
  args: { sections: [COMPOSER] },
  render: () => <RejectingParent />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);
    const sheet = await body.findByRole("dialog");

    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(canvas.getByTestId("open-change-calls")).toHaveTextContent("false"));
    await expect(sheet).toBeInTheDocument();

    await userEvent.click(await body.findByRole("button", { name: "Close" }));
    await waitFor(() =>
      expect(canvas.getByTestId("open-change-calls")).toHaveTextContent("false,false"),
    );

    // Two dismiss attempts, two callbacks, and the sheet is still on screen
    // because the parent never moved `open`.
    await expect(await body.findByRole("dialog")).toBeInTheDocument();
  },
};

function RejectingParent() {
  const [calls, setCalls] = React.useState<string[]>([]);

  return (
    <>
      {/* A probe, not a control: the open sheet inerts everything out here,
          so this is read by test id rather than by role. */}
      <output data-testid="open-change-calls" className="sr-only">
        {calls.join(",")}
      </output>
      <ShortcutsSheet
        open
        sections={[COMPOSER]}
        onOpenChange={(next) => setCalls((c) => [...c, String(next)])}
      />
    </>
  );
}

/**
 * A ~90 character action name, which is what happens the first time a
 * shortcuts sheet is generated from a command registry rather than written by
 * hand. The row is `flex items-center justify-between` with a bare `<span>`
 * and no `truncate`, `min-w-0` or `shrink-0` anywhere, so the answer is: the
 * label wraps to as many lines as it needs, the row grows, and the keycaps
 * stay vertically centred against the block of text rather than aligning to
 * its first line.
 *
 * The section heading is author-supplied too and behaves the same way. Worth
 * seeing next to a short row, because the wrap is what breaks the scanline
 * that makes a two-column map readable at all — the argument for keeping
 * labels to a verb and a noun lives here rather than in the prose.
 */
export const LongContent: Story = {
  args: {
    sections: [
      {
        title: "Transcript editing and correction",
        shortcuts: [
          {
            label: "Correct the selected word and apply the same fix everywhere it appears",
            keys: ["⌘", "⇧", "R"],
          },
          { label: "Play / pause", keys: ["Space"] },
        ],
      },
      COMPOSER,
    ],
  },
};

/**
 * 375px. The usual `<div className="w-[375px]">` wrapper is a no-op twice
 * over — the sheet portals out of the canvas, and it is `position: fixed`, so
 * it measures against the viewport rather than any ancestor. Width has to
 * arrive through `className`, which this component forwards to
 * `DialogContent`; tailwind-merge resolves it against the dialog's own
 * `sm:max-w-sm` and this component's `sm:max-w-md`.
 *
 * This is the width the two-column layout is under most pressure at: a
 * three-key chord and a full sentence of label share one line, and because
 * the label wraps rather than truncates (see `LongContent`) the row grows
 * downward instead of clipping. Nothing overflows horizontally, which is the
 * thing this story is here to keep true.
 */
export const Mobile: Story = {
  args: {
    sections: [COMPOSER, TIMELINE],
    className: "w-[375px] max-w-full",
  },
};

/**
 * The three ways this system renders a key binding, and the rule is about
 * **how much the reader already knows**:
 *
 * - **`kbd` (A1)** is one binding inline in a sentence, next to the thing it
 *   operates. Use it when the reader is already looking at the right control
 *   and only needs the key.
 * - **Shortcuts sheet** is the whole map, read-only, opened on demand and
 *   dismissed. Nothing in it is actionable — it answers "what can I press?",
 *   never "change this".
 * - **Settings dialog** looks almost identical — a modal with titled
 *   sections and label-plus-control rows — and is the opposite kind of
 *   surface: every row changes something, and it survives being reopened
 *   because state persists.
 *
 * If a row does something when you activate it, it belongs in settings. If
 * the user needs the key while doing the task, it belongs inline as a `kbd`.
 *
 * The comparison also shows the gap: `settings-dialog` ships the search this
 * component's spec asks for (`search` / `onSearchChange`, `full-page` only),
 * and shortcuts-sheet has no equivalent. At 60+ bindings that is the
 * difference between a reference and a wall, which is why it is called out
 * in the docs module rather than left to the manifest.
 *
 * Rendering note, and the reason only two of the three are live here. The
 * sheet is a portaled modal: it lands on top of whatever shares the canvas
 * rather than beside it, and Base UI marks everything outside the popup
 * `aria-hidden` while it is open. `settings-dialog`'s `full-page` variant
 * carries a search input and a control per row, all of which would then sit
 * focusable inside an `aria-hidden` subtree — an `aria-hidden-focus`
 * violation manufactured by the story rather than by either component. It is
 * described above instead. `kbd` renders live because a keycap is not
 * focusable, and it is the primitive every row in the sheet is built from,
 * so the comparison is one element against the same element multiplied.
 */
export const Boundary: Story = {
  args: { sections: [COMPOSER, THREADS] },
  render: (args) => (
    <div className="flex w-full max-w-lg flex-col gap-6">
      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">
          kbd — one binding, inline, where the reader already is
        </p>
        <p className="text-sm">
          Press{" "}
          <KbdGroup>
            <Kbd>⌘</Kbd>
            <Kbd>↵</Kbd>
          </KbdGroup>{" "}
          to send, or{" "}
          <KbdGroup>
            <Kbd>⇧</Kbd>
            <Kbd>↵</Kbd>
          </KbdGroup>{" "}
          for a new line.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">
          Shortcuts sheet — the whole map, read-only, over everything
        </p>
        <ShortcutsSheet {...args} />
      </section>
    </div>
  ),
};
