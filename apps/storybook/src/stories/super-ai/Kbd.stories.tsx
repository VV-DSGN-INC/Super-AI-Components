import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";

import { Kbd, KbdGroup } from "@/registry/super-ai/kbd";
import { KbdDocs } from "@/content/components/kbd.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const meta: Meta<typeof Kbd> = {
  title: "Super AI/Kbd",
  component: Kbd,
  parameters: { layout: "centered", docs: { page: componentDocsPage(KbdDocs) } },
};

export default meta;
type Story = StoryObj<typeof Kbd>;

/**
 * One key, on its own. The chip is `inline-flex h-5 min-w-5`, so a
 * single-character cap is square and a word-length one grows sideways from
 * the same baseline — a lone `Esc` in a composer hint and a lone `Esc` in a
 * cheatsheet row are the same element at the same size.
 */
export const Single: Story = {
  args: { children: "Esc" },
};

/**
 * Keys held together. `KbdGroup` supplies the row and the 4px gap; the `+`
 * between caps is a literal child, written by the caller.
 *
 * That is worth stating because the spec (`component-specs.md#a1-kbd`) reads
 * as though the component owns the joiner — "combo joins with a hairline `+`,
 * sequence joins with the word then". It does not: `Kbd` and `KbdGroup` take
 * no props beyond `className` and normal DOM attributes, so the distinction
 * the spec calls meaningful survives only if every caller writes it the same
 * way. Carried in the retrofit report as an API gap, not patched here.
 */
export const Combo: Story = {
  render: () => (
    <KbdGroup>
      <Kbd>⌘</Kbd>
      <span className="text-xs">+</span>
      <Kbd>⇧</Kbd>
      <span className="text-xs">+</span>
      <Kbd>Z</Kbd>
    </KbdGroup>
  ),
};

/**
 * Keys pressed one after the other. Identical markup to `Combo` apart from
 * the joiner word, which is the entire difference between "hold three keys"
 * and "press two keys in turn" — and the only thing telling them apart in the
 * rendered output.
 *
 * Because the joiner is caller-written text rather than a prop, nothing stops
 * a sequence from shipping with a `+`. The same gap as `Combo`, seen from the
 * side where it does real damage: a mis-joined combo is unreadable, a
 * mis-joined sequence is confidently wrong.
 */
export const Sequence: Story = {
  render: () => (
    <KbdGroup>
      <Kbd>G</Kbd>
      <span className="text-xs">then</span>
      <Kbd>L</Kbd>
    </KbdGroup>
  ),
};

/* -------------------------------------------------------------------------
 * Case stories — the situations this component meets in a product, as
 * opposed to the prop combinations above. See
 * docs/design-system/story-conventions.md for which of the eight apply.
 *
 * Not written for this component, deliberately:
 *
 * // case-skip: ReducedMotion — nothing in the tree animates
 * Both exports are a single element with a static class string: no
 * transition, transform, keyframe or `animate-*` utility anywhere in
 * kbd.tsx, and no state to animate between. A story here would render
 * identically to `Combo`.
 *
 * // case-skip: KeyboardOrder — the keycap is never a tab stop, by design
 * `<kbd>` is not a focusable element, the component sets no `tabindex`, and
 * it ships `pointer-events-none` precisely so that a shortcut hint inside a
 * menu row cannot intercept the row's own click. Both halves of that are
 * pinned in `Boundary`'s play — the arrangement where they are load-bearing
 * — because there is no tab sequence here to walk.
 *
 * // case-skip: Controlled — there is no value to control
 * The API is `React.ComponentProps<"kbd">` and `React.ComponentProps<"span">`
 * with a `className` merge. No `value`, no `onChange`, no selection, no
 * internal state of any kind: the caps render whatever children they are
 * given, every time. A `Controlled` story would drive a prop and assert the
 * prop rendered.
 * ---------------------------------------------------------------------- */

/**
 * Right-to-left, and this component gets it wrong.
 *
 * The row mirroring is correct — a shortcuts row should carry its keys on
 * the left in RTL. What is not correct is what happens inside the group.
 * `KbdGroup` is a bare `inline-flex` with no direction of its own, so its
 * children lay out from the right: measured on this story, `⌘` sits at x=74
 * and `Z` at x=0, meaning the chord authored as `⌘ + ⇧ + Z` is drawn `Z + ⇧
 * + ⌘`. The second row is worse, because it stays plausible: `G then L` is
 * rendered `L then G`, which is a different instruction that looks like a
 * correct one.
 *
 * Key order is a keyboard convention borrowed from the hardware, not a
 * phrase in the reading language, so it should not mirror with the text
 * around it.
 *
 * Recorded rather than fixed. The repair is a `dir="ltr"` pin on `KbdGroup`,
 * the same treatment `credits-indicator` gives its balance so digits keep
 * their order inside an RTL run — but that is a rendering change to a
 * primitive two shipped components consume (`account-menu`,
 * `shortcuts-sheet`), which puts it outside a story retrofit. Carried in the
 * report.
 */
export const RTL: Story = {
  render: () => (
    <div dir="rtl" className="w-full">
      <ul className="w-full">
        <li className="flex items-center justify-between border-b py-2 text-sm last:border-0">
          <span>Redo the last edit</span>
          <KbdGroup>
            <Kbd>⌘</Kbd>
            <span className="text-xs">+</span>
            <Kbd>⇧</Kbd>
            <span className="text-xs">+</span>
            <Kbd>Z</Kbd>
          </KbdGroup>
        </li>
        <li className="flex items-center justify-between border-b py-2 text-sm last:border-0">
          <span>Go to library</span>
          <KbdGroup>
            <Kbd>G</Kbd>
            <span className="text-xs">then</span>
            <Kbd>L</Kbd>
          </KbdGroup>
        </li>
      </ul>
    </div>
  ),
};

/**
 * A keycap with no children. `min-w-5 h-5` means it does not collapse — it
 * renders as a 20px blank tile, indistinguishable from a key whose glyph
 * failed to load.
 *
 * This is a real caller failure rather than a hypothetical. Both consumers
 * map a `string[]` straight onto caps — `shortcuts-sheet` renders
 * `keys.map((key) => <Kbd>{key}</Kbd>)`, `account-menu` does the same for
 * its shortcut hints — so a platform-conditional key that resolves to an
 * empty string ships a blank tile with no error anywhere. The component has
 * no guard and takes no position; filtering falsy keys is the caller's job.
 */
export const EmptyLabel: Story = {
  render: () => (
    <ul className="w-64">
      <li className="flex items-center justify-between border-b py-2 text-sm">
        <span>New chat</span>
        <KbdGroup>
          <Kbd />
          <span className="text-xs">+</span>
          <Kbd>N</Kbd>
        </KbdGroup>
      </li>
      <li className="flex items-center justify-between py-2 text-sm">
        <span>New chat, key resolved</span>
        <KbdGroup>
          <Kbd>⌘</Kbd>
          <span className="text-xs">+</span>
          <Kbd>N</Kbd>
        </KbdGroup>
      </li>
    </ul>
  ),
};

/**
 * The longest content this component can honestly be given. The convention's
 * ~90 characters is not reachable with real fixtures — a keycap carries a key
 * name, and the longest ones a keyboard has are two words (`Right Arrow`,
 * `Page Down`, `Caps Lock`) — so the ceiling here is a full-word cap inside a
 * four-key chord, beside a label long enough to compete with it for the row.
 *
 * Given room, the decision is to grow: no `max-w`, no `truncate`, no
 * ellipsis. Measured on this story, the `Right Arrow` cap lays out at 93px
 * wide and 20px tall with no overflow in either axis, while its neighbours
 * stay square at 21px — one component, one baseline, two very different
 * widths.
 *
 * The qualifier is "given room", and it is not decoration. `h-5` is a fixed
 * height and there is no `whitespace-nowrap`, so a cap that gets squeezed
 * below its label width wraps inside a box that cannot get taller. `Mobile`
 * is that story, with the numbers.
 */
export const LongContent: Story = {
  render: () => (
    <ul className="w-full max-w-md">
      <li className="flex items-center justify-between border-b py-2 text-sm">
        <span>Move the playhead to the next marker</span>
        <KbdGroup>
          <Kbd>⌃</Kbd>
          <span className="text-xs">+</span>
          <Kbd>⌥</Kbd>
          <span className="text-xs">+</span>
          <Kbd>⇧</Kbd>
          <span className="text-xs">+</span>
          <Kbd>Right Arrow</Kbd>
        </KbdGroup>
      </li>
    </ul>
  ),
};

/**
 * 375px, in the arrangement this primitive actually ships in: a
 * `shortcuts-sheet` row — `flex items-center justify-between`, label on one
 * side, `KbdGroup` on the other.
 *
 * No horizontal scroll, and the way it avoids one is the finding. The row is
 * flex and both sides shrink, so the chord is squeezed rather than pushed
 * off-screen: measured here, the third row stays at 343px with nothing to
 * scroll, and its `Right Arrow` cap comes in at 84px instead of the 93px it
 * takes in `LongContent`. The 9px comes out of the text, which wraps to a
 * second line — and `h-5` does not grow with it. The cap renders 20px tall
 * around 25px of content, so the second line is drawn outside the border the
 * keycap just drew.
 *
 * That is the component paying for a fixed height with an overflow, and the
 * trade is not free either way: `whitespace-nowrap` would stop the wrap and
 * hand back a row that scrolls horizontally instead. Which of the two a
 * keycap should do is a decision about the primitive, not about this story,
 * so it is recorded rather than patched. Carried in the report.
 */
export const Mobile: Story = {
  render: () => (
    <div className="w-[375px] max-w-full">
      <ul className="px-4">
        <li className="flex items-center justify-between border-b py-2 text-sm">
          <span>Focus the composer</span>
          <KbdGroup>
            <Kbd>/</Kbd>
          </KbdGroup>
        </li>
        <li className="flex items-center justify-between border-b py-2 text-sm">
          <span>Toggle the sources panel</span>
          <KbdGroup>
            <Kbd>⌘</Kbd>
            <span className="text-xs">+</span>
            <Kbd>⇧</Kbd>
            <span className="text-xs">+</span>
            <Kbd>S</Kbd>
          </KbdGroup>
        </li>
        <li className="flex items-center justify-between py-2 text-sm">
          <span>Move the playhead to the next marker</span>
          <KbdGroup>
            <Kbd>⌥</Kbd>
            <span className="text-xs">+</span>
            <Kbd>Right Arrow</Kbd>
          </KbdGroup>
        </li>
      </ul>
    </div>
  ),
};

/**
 * The same keycap in its two shipped postures, and the rule for telling them
 * apart. This is the one boundary A1 actually has: not which chip to reach
 * for, but what you owe the chip once you have reached for it.
 *
 * - **Hint** — the shortcut sits beside a control that already performs the
 *   action. `account-menu` wraps the group in `aria-hidden="true"`, because
 *   the row is already named "New chat" and folding the keys into that name
 *   would make a screen reader announce a chord nobody needs to hear to use
 *   the row.
 * - **Reference** — the shortcut *is* the content. `shortcuts-sheet` hides
 *   nothing, because the keys are the only thing the row is telling anyone.
 *
 * The test: remove the keycap. If the row still does its job, it was a hint
 * and belongs behind `aria-hidden`. If the row now says nothing, it was
 * reference content and hiding it empties the page.
 *
 * These are the two postures rendered directly rather than renders of B8 and
 * L5 themselves: one is a dropdown and the other a dialog, and neither shows
 * a row without being opened first.
 */
export const Boundary: Story = {
  render: () => (
    <div className="flex w-full max-w-md flex-col gap-6">
      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">
          Hint — the row does the work, the keys are decoration
        </p>
        <button
          type="button"
          className="focus-visible:ring-ring flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm focus-visible:ring-2 focus-visible:outline-none"
        >
          <span>New chat</span>
          <KbdGroup aria-hidden="true" className="ml-auto">
            <Kbd>⌘</Kbd>
            <Kbd>N</Kbd>
          </KbdGroup>
        </button>
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">Reference — the keys are the content</p>
        <ul>
          <li className="flex items-center justify-between border-b py-2 text-sm">
            <span>New chat</span>
            <KbdGroup>
              <Kbd>⌘</Kbd>
              <span className="text-xs">+</span>
              <Kbd>N</Kbd>
            </KbdGroup>
          </li>
          <li className="flex items-center justify-between py-2 text-sm">
            <span>Go to library</span>
            <KbdGroup>
              <Kbd>G</Kbd>
              <span className="text-xs">then</span>
              <Kbd>L</Kbd>
            </KbdGroup>
          </li>
        </ul>
      </section>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // The hint posture buys exactly one thing: the row's accessible name is
    // the label alone. aria-hidden content is excluded from name-from-content,
    // so dropping the attribute would silently rename this row
    // "New chat ⌘ N" — visually identical, audibly wrong.
    const row = canvas.getByRole("button", { name: "New chat" });

    const groups = canvasElement.querySelectorAll('[data-slot="kbd-group"]');
    await expect(groups[0]).toHaveAttribute("aria-hidden", "true");
    await expect(groups[1]).not.toHaveAttribute("aria-hidden");

    // `pointer-events-none` is why a hint can live inside a button at all:
    // the cap is removed from hit-testing, so a click landing on the keys
    // still reaches the row. Probed rather than asserted on the class string,
    // because hit-testing is the behaviour and the class is only how it is
    // currently spelled.
    const cap = groups[0].querySelector('[data-slot="kbd"]') as HTMLElement;
    const box = cap.getBoundingClientRect();
    const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
    await expect(cap.contains(hit)).toBe(false);
    await expect(row.contains(hit)).toBe(true);

    // …and the keycap adds no tab stop in either posture. Bounded by the
    // expected count rather than tabbed until focus leaves, so this fails on
    // a stop gained as well as one lost.
    const stops = canvasElement.querySelectorAll("button, a[href], [tabindex]");
    await expect(stops).toHaveLength(1);
    await userEvent.tab();
    await expect(document.activeElement).toBe(row);
  },
};
