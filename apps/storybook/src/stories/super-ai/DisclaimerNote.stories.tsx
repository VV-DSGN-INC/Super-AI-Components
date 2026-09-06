import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { DisclaimerNote } from "@/registry/super-ai/disclaimer-note";
import { RateLimitBanner } from "@/registry/super-ai/rate-limit-banner";
import { SafetyBlock } from "@/registry/super-ai/safety-block";
import { DisclaimerNoteDocs } from "@/content/components/disclaimer-note.docs";
import { componentDocsPage } from "@/lib/component-docs-page";
import { focusTreatmentSignature, settledFocusRing } from "@/lib/focus-ring";

const meta: Meta<typeof DisclaimerNote> = {
  title: "Super AI/Disclaimer Note",
  component: DisclaimerNote,
  parameters: { layout: "centered", docs: { page: componentDocsPage(DisclaimerNoteDocs) } },
};

export default meta;
type Story = StoryObj<typeof DisclaimerNote>;

/** ~110 characters of author-supplied copy — a product replacing the default sentence. */
const LONG_TEXT =
  "Answers are drawn from the uploaded transcripts and may misattribute a quote, so check the source before citing.";

/**
 * The same sentence carrying a sha256 digest. Realistic provenance copy, and the
 * only shape in this component that has no break opportunity in it.
 */
const DIGEST_TEXT =
  "Summary generated from digest 9f2c7e41b8a03d65fe1c92847b0dae53c1f68a27d940b3ec5178af62c30b9d41; not reviewed.";

/**
 * Under a composer: a centred row pinned to the bottom of the input, where every
 * product that ships one puts it. `justify-center` plus `text-center` is the only
 * variant that centres, and it is the reason this placement survives a wrap — a
 * second line stays visually attached to the input rather than starting a new
 * left-aligned block under it.
 *
 * Nothing here is conditional on having sent a message. The note is mounted with
 * the composer and stays for its lifetime, which is what "permanent" means in
 * the spec's first line.
 */
export const UnderComposer: Story = {
  args: { variant: "under-composer" },
  render: (args) => (
    <div className="w-80 rounded-lg border">
      <div className="text-muted-foreground px-3 py-2 text-sm">Message the assistant…</div>
      <DisclaimerNote {...args} />
    </div>
  ),
};

/**
 * Inside a card of generated content, as a footer separated by a rule. `border-t`
 * is the whole separation — there is no tint, no `bg-muted`, no second surface.
 * That is deliberate and it is the component's one contrast decision: painting a
 * muted strip here is what would push the copy toward `text-muted-foreground`,
 * which measures 4.34:1 against this token set's muted surfaces.
 *
 * This is also the placement where `link` earns its keep, because a card of
 * generated content is where someone actually stops to ask how it was made.
 */
export const InCard: Story = {
  args: {
    variant: "in-card",
    link: { label: "Learn how sources are used", href: "#" },
  },
  render: (args) => (
    <div className="w-80 rounded-lg border">
      <div className="p-3 text-sm">Generated summary of the uploaded report.</div>
      <DisclaimerNote {...args} />
    </div>
  ),
};

/**
 * Beside other metadata, at the end of a timestamp row. This is the only variant
 * that switches the cross axis to `items-center` and shrink-wraps its width, so
 * it sits on a line with siblings instead of claiming one.
 *
 * The name is a trap the docs module records and it is worth repeating here: this
 * is still a `<div>`. Dropping it inside a `<p>` is invalid nesting that the
 * parser repairs by splitting the paragraph, which reorders the reading order the
 * whole component depends on. Put it beside your prose, not inside it.
 */
export const Inline: Story = {
  args: { variant: "inline", children: "May be inaccurate." },
  render: (args) => (
    <div className="flex items-center gap-2 text-sm">
      <span>Response generated 2m ago</span>
      <span aria-hidden="true">·</span>
      <DisclaimerNote {...args} />
    </div>
  ),
};

/* -------------------------------------------------------------------------
 * Case stories — the situations this component meets in a product, as
 * opposed to the prop combinations above. See
 * docs/design-system/story-conventions.md for which of the eight apply and
 * why the two that are missing here are missing.
 *
 * The two skips are unusually cheap to justify here, and the reason is
 * structural: this component composes nothing from `registry/super-ai/`,
 * imports no vendored primitive, and renders exactly `div > svg + span (+ a)`.
 * Its whole manifest entry lists no `base`, no `shadcn` and no `consumes`. So
 * a grep over one file really does see the whole rendered tree, which is the
 * condition that failed for B6 `thread-list`.
 *
 * Not written for this component, deliberately:
 *
 * // case-skip: ReducedMotion — nothing in the file or in the tree it renders can move
 * `grep -n "animate-\|transition-\|duration-" disclaimer-note.tsx` returns
 * nothing, and the reason that grep is sufficient here — where it was not
 * sufficient for `thread-list`, which skipped on the same grounds while
 * rendering two Base UI popups that both animated — is that this component's
 * whole import list is `lucide-react`'s `Info` and `cn`. There is no popup,
 * no vendored `Button`, no `SelectContent`: the rendered tree is a `div`, an
 * `svg`, a `span` and optionally an `a`, and the only interactive style in
 * the file is `hover:text-foreground/70`, a colour change with no transition
 * to suppress. Since `vitest.config.ts` already forces
 * `reducedMotion: "reduce"` on every test, a story here would render
 * pixel-identical to `InCard`.
 *
 * // case-skip: Controlled — nothing is held; every prop is a rendering input the caller owns outright
 * `grep -n "useState\|onChange\|value=" disclaimer-note.tsx` returns nothing.
 * `variant`, `children` and `link` are read straight through to markup, and
 * there is no callback of any kind — not even an intent-reporting one like
 * `quote-reply`'s `onRemove`, because there is no intent to report. The
 * absence is the contract rather than an omission: the spec's first line is
 * "permanent and non-dismissible", so a state a host could drive would be a
 * dismissal mechanism by another name. `KeyboardOrder` asserts the visible
 * half of that — no `button` renders in any variant.
 * ---------------------------------------------------------------------- */

/**
 * Right-to-left, and the interesting half is not the layout.
 *
 * **The layout mirrors, and cheaply.** `grep -n "pl-\|pr-\|ml-\|mr-\|border-l\|border-r\|text-left\|text-right"`
 * over `disclaimer-note.tsx` returns nothing: the row is `flex … gap-1.5`,
 * the padding is symmetric `px-`, the rule is `border-t` on the block axis
 * and `text-center` has no side. So the icon leads on the right, the text
 * column right-aligns and the link lands at the logical end of the sentence,
 * all without a single logical-property swap. Measured in the 320px card
 * below: the icon sits at 293..307 with the text at 13..287, and the same pair
 * in an identical LTR card measures 13..27 and 33..307 — the same 6px gap,
 * mirrored. Asserted below.
 *
 * **The sentence does not.** The default copy ends in a full stop, and a
 * trailing full stop is a bidi neutral with nothing strong after it, so UAX
 * #9 resolves it to the paragraph level rather than to the Latin run it
 * belongs to. Measured on the under-composer note below, whose text has no
 * link after it: the final "." paints at 24.6..28.1 while the opening "A" is
 * at 28.1..36.2 and the closing "o" of "info" is at 268.3..275.4. The stop is
 * on the *far left*, reading ".AI can make mistakes. Check important info".
 * The mid-sentence stop after "mistakes" is unaffected, because it has strong
 * LTR text on both sides; under LTR the same final character measures
 * 280.2..283.7, where it belongs. Adding a `link` also hides it, because the
 * link's own Latin text then follows the stop and makes it interior — which
 * is why the card above does not show the defect and the composer below does.
 *
 * Nothing is asserted about that, because asserting it would pin it. The fix
 * is `dir="auto"` (or a `<bdi>`) on the text span, which is a design decision
 * rather than a class swap: it says the copy's own language wins over the
 * shell's direction. That is H4 `transcript-editor`'s "no API separating the
 * chrome's direction from the content's language", reached from the other
 * side — and here it costs one character rather than a whole transcript, but
 * it is the character that ends the sentence.
 */
export const RTL: Story = {
  render: () => (
    <div dir="rtl" className="flex w-80 flex-col gap-4">
      <div className="rounded-lg border" data-testid="card">
        <div className="p-3 text-sm">ملخص من التقرير المرفوع.</div>
        <DisclaimerNote variant="in-card" link={{ label: "Learn how sources are used", href: "#" }} />
      </div>
      <div className="rounded-lg border">
        <div className="text-muted-foreground px-3 py-2 text-sm">راسل المساعد…</div>
        <DisclaimerNote variant="under-composer" />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const card = canvas.getByTestId("card");
    const icon = card.querySelector<HTMLElement>('[data-slot="disclaimer-note-icon"]')!;
    const text = card.querySelector<HTMLElement>('[data-slot="disclaimer-note-text"]')!;
    const link = card.querySelector<HTMLElement>('[data-slot="disclaimer-note-link"]')!;

    // The icon leads, which under RTL means it is the rightmost thing in the row.
    await expect(icon.getBoundingClientRect().left).toBeGreaterThanOrEqual(
      text.getBoundingClientRect().right,
    );

    // The link wraps onto its own line and right-aligns with the text column's
    // inline start, rather than staying pinned to the physical left.
    const textBox = text.getBoundingClientRect();
    const linkBox = link.getBoundingClientRect();
    await expect(Math.abs(linkBox.right - textBox.right)).toBeLessThan(1);
    await expect(linkBox.top).toBeGreaterThan(textBox.top);
  },
};

/**
 * The whole keyboard surface, which is zero stops or one.
 *
 * Without `link` the note contains nothing focusable at all — it is a `<div>`
 * of text with an `aria-hidden` glyph, so a keyboard user passes over it
 * entirely and the screen-reader route is reading order, not tabbing. With
 * `link` it is exactly one stop, and there is no return-focus behaviour to
 * document because there is nothing to close.
 *
 * **The absence of a dismiss control is asserted, not assumed.** The spec's
 * first line is "permanent and non-dismissible", and the file's own comment
 * says the state was left out on purpose. This story queries every variant for
 * a `button` and expects none, so a future close affordance fails here rather
 * than in review.
 *
 * **There is a ring, and it belongs to the browser.** The component sets no
 * `focus-visible` utility — `grep -n "focus"` over the file finds only
 * `hover:text-foreground/70` — so the treatment measured here is the user
 * agent's own `:focus-visible` outline, `auto 1px`, recoloured by this repo's
 * base layer (`* { outline-ring/50 }`) to `oklab(0.708 0 0 / 0.5)`. Both
 * checks are run below and both agree, which is worth having because they
 * answer different questions: `settledFocusRing` proves something is painted,
 * and the differential proves focus is what painted it (`none|none|…` →
 * `auto/1px/oklab(0.708 0 0 / 0.5)|none|…`).
 *
 * Two things follow that a consumer needs. It is 1px, where this registry's
 * own focus utilities are `ring-2` (75 occurrences across
 * `registry/super-ai/`) or `ring-3` (11) — so the one focusable element in
 * the component is thinner than anything the library rings itself. And it
 * survives only as long as the host's reset leaves the UA outline alone: a
 * global `outline: none` deletes it with nothing in the component to fall
 * back on. The docs module's focus bullet says the ring is "whatever your
 * global styles provide" and that with none the link is "invisible when
 * focused" — right about the component, incomplete about the browser, which
 * supplies one unless a reset takes it away.
 */
export const KeyboardOrder: Story = {
  render: () => (
    <div className="flex w-80 flex-col gap-4">
      <div className="rounded-lg border" data-testid="plain">
        <div className="p-3 text-sm">Generated summary of the uploaded report.</div>
        <DisclaimerNote variant="in-card" />
      </div>
      <div className="rounded-lg border" data-testid="linked">
        <div className="p-3 text-sm">Generated summary of the quarterly transcripts.</div>
        <DisclaimerNote variant="in-card" link={{ label: "Learn how sources are used", href: "#" }} />
      </div>
      <DisclaimerNote variant="under-composer" />
      <DisclaimerNote variant="inline">May be inaccurate.</DisclaimerNote>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const notes = Array.from(canvasElement.querySelectorAll<HTMLElement>('[data-slot="disclaimer-note"]'));
    await expect(notes).toHaveLength(4);

    // Non-dismissible, asserted across every variant rendered here.
    for (const note of notes) {
      await expect(note.querySelectorAll("button")).toHaveLength(0);
    }

    // Three of the four hold no tab stop of any kind.
    const focusableIn = (el: HTMLElement) =>
      el.querySelectorAll('a[href], button:not(:disabled), input, [tabindex]:not([tabindex="-1"])');
    const plainNote = canvas
      .getByTestId("plain")
      .querySelector<HTMLElement>('[data-slot="disclaimer-note"]')!;
    await expect(focusableIn(plainNote)).toHaveLength(0);

    const linked = canvas.getByTestId("linked");
    const link = within(linked).getByRole("link", { name: "Learn how sources are used" });
    await expect(focusableIn(linked.querySelector('[data-slot="disclaimer-note"]')!)).toHaveLength(1);

    // The differential baseline, taken before anything is focused.
    const resting = focusTreatmentSignature(link);

    await userEvent.tab();
    await expect(document.activeElement).toBe(link);
    await expect(link.matches(":focus-visible")).toBe(true);

    // "Is anything painted" and "did focus paint it" — both, because either
    // alone has produced a wrong answer on this registry's own controls.
    await settledFocusRing(link, waitFor);
    await waitFor(() => expect(focusTreatmentSignature(link)).not.toBe(resting));

    // One stop, then out of the component entirely. Nothing here traps or
    // returns focus, because nothing here opens or closes.
    await userEvent.tab();
    await expect(linked.contains(document.activeElement)).toBe(false);
  },
};

/**
 * The optional text slot emptied, which is the one input shape that silently
 * deletes the component's reason for existing.
 *
 * `children` is optional and falls back with `children ?? DEFAULT_TEXT`. `??`
 * is nullish, so `""` is not a missing value — it is a value, and it wins.
 * The result is rendered beside the defaulted note and asserted: the emptied
 * one still draws its `border-t`, still shows the `Info` glyph, and measures
 * 318×33 against the defaulted note's 318×33.5. Half a pixel of difference,
 * and a `textContent` of `""`. Visually it reads as a designed footer; to a
 * screen reader it is nothing at all, because the only other thing in the box
 * is `aria-hidden`. A disclaimer that announces nothing has failed in the
 * exact way this component exists to prevent, and no gate sees it: axe raises
 * nothing on an empty `<div>`.
 *
 * **The sibling case is the opposite, and it was measured rather than
 * assumed.** `link={{ label: "", href: "#" }}` renders an `<a href>` with no
 * text and fails axe `link-name` outright — run in this file against the real
 * gate before it was removed, reported as "Element is in tab order and does
 * not have accessible text". It is therefore documented here instead of
 * rendered, the same call `suggestion-chips` and `quote-reply` record. Two
 * empty strings, one component: one is a red gate, the other is silent. That
 * is K1 `ai-doc-block`'s finding on a third component, and it says again why
 * the a11y gate is a floor rather than a check.
 *
 * The fix for the `children` half is small in edit size (`||` for `??`, or a
 * trim-and-fall-back) and still a behaviour decision, because an empty string
 * could reasonably be read as "this product supplies its own note elsewhere".
 * So it is recorded rather than swept.
 */
export const EmptyLabel: Story = {
  render: () => (
    <div className="flex w-80 flex-col gap-4">
      <div className="rounded-lg border" data-testid="defaulted">
        <div className="p-3 text-sm">Generated summary of the uploaded report.</div>
        <DisclaimerNote variant="in-card" />
      </div>
      <div className="rounded-lg border" data-testid="emptied">
        <div className="p-3 text-sm">Generated summary of the uploaded report.</div>
        <DisclaimerNote variant="in-card">{""}</DisclaimerNote>
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const noteIn = (id: string) =>
      canvas.getByTestId(id).querySelector<HTMLElement>('[data-slot="disclaimer-note"]')!;

    // Omitted: the default sentence lands.
    await expect(noteIn("defaulted").textContent).toBe("AI can make mistakes. Check important info.");

    // Emptied: the box survives and the message does not.
    const emptied = noteIn("emptied");
    await expect(emptied.textContent).toBe("");
    await expect(emptied.querySelector('[data-slot="disclaimer-note-icon"]')).toHaveAttribute(
      "aria-hidden",
      "true",
    );
    const span = emptied.querySelector<HTMLElement>('[data-slot="disclaimer-note-text"]')!;
    await expect(span.getBoundingClientRect().width).toBe(0);
    await expect(emptied.getBoundingClientRect().height).toBeGreaterThan(24);

    // Within half a pixel of the note that says something: the box is not what
    // is missing.
    const emptyBox = emptied.getBoundingClientRect();
    const fullBox = noteIn("defaulted").getBoundingClientRect();
    await expect(Math.abs(emptyBox.height - fullBox.height)).toBeLessThan(1);
  },
};

/**
 * Author-supplied copy at ~110 characters, and the decision the component makes
 * is that it makes none: there is no `truncate`, no `line-clamp`, no
 * `overflow`, no max width anywhere in the file. Long copy wraps, and wraps
 * without limit, in all three placements. That is the right default for a
 * disclaimer — a truncated legal note is worse than a tall one — but it means
 * length is entirely the caller's problem, and the three variants fail
 * differently when it is not managed.
 *
 * `under-composer` centres every wrapped line, so a long note becomes a
 * centred paragraph that grows the composer's footprint downward. `in-card`
 * wraps flush inside its `px-3`. `inline` is the one that changes character:
 * it shrink-wraps its width, so at short lengths it sits on a metadata row as
 * intended — 125px wide for "May be inaccurate." — and past roughly one line's
 * worth it fills the row instead, measured here at 276×49.5, three lines tall,
 * with the timestamp beside it aligned to the centre of that block. "Inline
 * beside other metadata" stops being true at a length nothing warns you about.
 *
 * **One shape genuinely breaks, and it is realistic copy.** The text span is a
 * flex child with no `min-w-0`, so its `min-width: auto` resolves to its
 * longest word. Prose always has break opportunities and so always fits; a
 * sha256 digest has none. Rendered here at the same width as its neighbours:
 * the digest's text box measures 447px inside a 318px card, and the note's own
 * `scrollWidth` reads 479 against a `clientWidth` of 318 — 161px of real
 * horizontal scroll, produced by the component's own chrome rather than by a
 * container it was dropped into. `min-w-0` on the span plus a wrap rule would
 * fix it, and `Mobile` keeps the digest out so its no-scroll assertion means
 * what it says. Nothing is asserted about the overflow here, because asserting
 * it would pin it.
 */
export const LongContent: Story = {
  render: () => (
    <div className="flex w-80 flex-col gap-4">
      <div className="rounded-lg border" data-testid="under">
        <div className="text-muted-foreground px-3 py-2 text-sm">Message the assistant…</div>
        <DisclaimerNote variant="under-composer">{LONG_TEXT}</DisclaimerNote>
      </div>

      <div className="rounded-lg border" data-testid="card">
        <div className="p-3 text-sm">Generated summary of the quarterly transcripts.</div>
        <DisclaimerNote variant="in-card" link={{ label: "Learn how sources are used", href: "#" }}>
          {LONG_TEXT}
        </DisclaimerNote>
      </div>

      <div className="flex items-center gap-2 text-sm" data-testid="inline">
        <span>2m ago</span>
        <span aria-hidden="true">·</span>
        <DisclaimerNote variant="inline">{LONG_TEXT}</DisclaimerNote>
      </div>

      <div className="rounded-lg border" data-testid="digest">
        <div className="p-3 text-sm">Generated summary of the quarterly transcripts.</div>
        <DisclaimerNote variant="in-card">{DIGEST_TEXT}</DisclaimerNote>
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const noteIn = (id: string) =>
      canvas.getByTestId(id).querySelector<HTMLElement>('[data-slot="disclaimer-note"]')!;

    // Prose wraps rather than truncating: more than one line tall, and every
    // character still in the box.
    for (const id of ["under", "card", "inline"]) {
      const note = noteIn(id);
      const span = note.querySelector<HTMLElement>('[data-slot="disclaimer-note-text"]')!;
      await expect(span.getBoundingClientRect().height).toBeGreaterThan(20);
      await expect(span.scrollWidth).toBeLessThanOrEqual(span.clientWidth);
      await expect(note.textContent).toContain("check the source before citing");
    }

    // The centring is what makes a wrapped note stay attached to the composer.
    await expect(getComputedStyle(noteIn("under")).textAlign).toBe("center");

    // Nothing clips: no variant sets an overflow or a clamp.
    for (const id of ["under", "card", "inline", "digest"]) {
      const style = getComputedStyle(noteIn(id));
      await expect(style.overflowX).toBe("visible");
      await expect(style.webkitLineClamp).toBe("none");
    }
  },
};

/**
 * 375px. This component has no responsive branch at all — `grep -n "sm:\|md:\|lg:"`
 * over `disclaimer-note.tsx` returns nothing — so unlike `preset-grid` and
 * `generation-wizard`, whose wrappers squeeze a desktop layout, the 375px box
 * here is the phone case exactly. A frame `data-testid` is what gets measured
 * rather than `canvasElement.firstElementChild`, which `layout: "centered"`
 * makes ~1200px wide.
 *
 * All three placements are rendered together because the note's whole job is
 * to survive being dropped somewhere, and none of them scrolls sideways with
 * ordinary copy.
 *
 * **The tap target is the finding, and it is stated rather than asserted.**
 * The link is the only pointer target the component ever has, and it is an
 * inline `<a>` at `text-xs`/`leading-snug` with no padding of its own, so each
 * of its line boxes is 15.75px tall. At this width the label wraps and the
 * union box measures 312.4×31.5, which is two lines of 15.75 rather than one
 * comfortable target: fine across, and each strip well under WCAG 2.2's 24×24
 * down. The spacing exception cannot rescue it either, since the sentence
 * continues directly above and below it. It joins A11 `reset-affordance`'s
 * 20×20 row target and I5 `drawing-tools`' 16×32 chevron; axe's `target-size`
 * rule is experimental and off, so no gate in this repo sees any of the three.
 * Padding an inline link inside flowing text is a typographic decision, not a
 * class swap, so it is recorded here rather than fixed.
 */
export const Mobile: Story = {
  render: () => (
    <div className="flex w-[375px] max-w-full flex-col gap-4" data-testid="viewport">
      <div className="rounded-lg border">
        <div className="text-muted-foreground px-3 py-2 text-sm">Message the assistant…</div>
        <DisclaimerNote variant="under-composer" />
      </div>

      <div className="rounded-lg border">
        <div className="p-3 text-sm">Generated summary of the quarterly transcripts.</div>
        <DisclaimerNote variant="in-card" link={{ label: "Learn how sources are used", href: "#" }} />
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span>2m ago</span>
        <span aria-hidden="true">·</span>
        <DisclaimerNote variant="inline">May be inaccurate.</DisclaimerNote>
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const viewport = canvas.getByTestId("viewport");

    // The frame, not `canvasElement.firstElementChild` — `layout: "centered"`
    // wraps every story, and measuring the centring div passes for the wrong
    // reason (story-conventions.md, mechanical fact 2).
    await expect(viewport.scrollWidth).toBeLessThanOrEqual(viewport.clientWidth);

    for (const note of Array.from(
      canvasElement.querySelectorAll<HTMLElement>('[data-slot="disclaimer-note"]'),
    )) {
      await expect(note.scrollWidth).toBeLessThanOrEqual(note.clientWidth);
    }

    // The inline variant shrink-wraps, so it shares its row rather than
    // claiming it — the property that makes the variant worth having.
    const inline = canvasElement.querySelector<HTMLElement>('[data-variant="inline"]')!;
    await expect(inline.getBoundingClientRect().width).toBeLessThan(200);
  },
};

/**
 * Three ways the system speaks over the assistant's shoulder, and the choosing
 * rule is one question: **did something happen?**
 *
 * - **Disclaimer note** — nothing happened. It is true before the first
 *   message and true after the thousandth, it never changes, and it has no
 *   action because there is no action: the user is being told how to read
 *   everything around it. That is why it cannot be dismissed, and why it is
 *   the only one of the three that is not an `Alert`.
 * - **Safety block** — a specific request or response was stopped, by a named
 *   policy, and there is a compliant path out. It replaces the output it is
 *   standing in for.
 * - **Rate limit banner** — a specific attempt cannot run *yet*. It carries a
 *   number that counts down and it disappears when the number reaches zero.
 *
 * So: permanent and unconditional, triggered and terminal, or temporary and
 * self-resolving. Reaching for an `Alert` to say "AI can make mistakes" is the
 * mistake this comparison exists to prevent — an alert that never goes away
 * teaches people to stop reading alerts.
 *
 * `citation-ref` is the near-twin on a different axis and is left out here on
 * purpose: it also qualifies generated text, but it runs from a claim back to
 * its source and is placed by the model, whereas all three of these are the
 * product speaking about its own output.
 */
export const Boundary: Story = {
  render: () => (
    <div className="flex w-full max-w-md flex-col gap-8">
      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">
          Disclaimer note — always true, no action, cannot be closed
        </p>
        <div className="rounded-lg border">
          <div className="p-3 text-sm">Generated summary of the quarterly transcripts.</div>
          <DisclaimerNote variant="in-card" link={{ label: "Learn how sources are used", href: "#" }} />
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">
          Safety block — this one request stopped, by a named policy
        </p>
        <SafetyBlock
          variant="output-blocked"
          policy="Personal data policy"
          alternatives="Ask for the summary without the participant names."
        />
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">
          Rate limit banner — not yet, and here is the number
        </p>
        <RateLimitBanner cause="provider-capacity" resource="Long-context summaries" remainingSeconds={95} />
      </section>
    </div>
  ),
};
