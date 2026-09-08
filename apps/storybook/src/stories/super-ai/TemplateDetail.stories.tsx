import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import * as React from "react";
import { LayoutTemplate } from "lucide-react";

import { TemplateDetail, type TemplateDetailTemplate } from "@/registry/super-ai/template-detail";
import { TemplateDetailDocs } from "@/content/components/template-detail.docs";
import { componentDocsPage } from "@/lib/component-docs-page";
import { focusTreatmentSignature, settledFocusRing } from "@/lib/focus-ring";
import { Button } from "@/components/ui/button";

/**
 * Decorative stand-in art. `aria-hidden` so a thumbnail's accessible name stays
 * its preview label rather than "Cover Cover".
 */
function Art({ label }: { label: string }) {
  return (
    <div
      aria-hidden
      className="bg-foreground/10 text-foreground flex h-full w-full items-center justify-center gap-2 text-xs"
    >
      <LayoutTemplate aria-hidden className="size-4" />
      {label}
    </div>
  );
}

const PITCH: TemplateDetailTemplate = {
  id: "pitch",
  title: "Minimal pitch deck",
  description: "Twelve slides, one idea per slide. Built for a ten-minute room.",
  previews: [
    { id: "cover", label: "Cover", media: <Art label="Cover" /> },
    { id: "problem", label: "Problem", media: <Art label="Problem" /> },
    { id: "metrics", label: "Metrics", media: <Art label="Metrics" /> },
    { id: "ask", label: "Ask", media: <Art label="Ask" /> },
  ],
  options: [
    {
      id: "size",
      label: "Size",
      choices: [
        { value: "16-9", label: "16:9 widescreen" },
        { value: "4-3", label: "4:3 standard" },
      ],
    },
    {
      id: "length",
      label: "Slides",
      defaultValue: "12",
      hint: "Extra slides are added as blanks after the ask.",
      choices: [
        { value: "8", label: "8 slides" },
        { value: "12", label: "12 slides" },
        { value: "20", label: "20 slides" },
      ],
    },
  ],
  author: { id: "marta", name: "Marta Lin", meta: "148 templates" },
  thumbnail: <Art label="Pitch" />,
};

const REPORT: TemplateDetailTemplate = {
  id: "report",
  title: "Quarterly report",
  description: "A print-ready long-form layout with a numbers appendix.",
  previews: [
    { id: "cover", label: "Cover", media: <Art label="Report cover" /> },
    { id: "tables", label: "Tables", media: <Art label="Tables" /> },
  ],
  options: [
    {
      id: "size",
      label: "Paper",
      choices: [
        { value: "a4", label: "A4" },
        { value: "letter", label: "US Letter" },
      ],
    },
  ],
  author: { id: "dev", name: "Dev Okafor", meta: "31 templates" },
  thumbnail: <Art label="Report" />,
};

const POSTER: TemplateDetailTemplate = {
  id: "poster",
  title: "Event poster",
  description: "One loud headline, one date, one QR code.",
  previews: [{ id: "poster", label: "Poster", media: <Art label="Poster" /> }],
  options: [
    {
      id: "size",
      label: "Size",
      choices: [
        { value: "a2", label: "A2" },
        { value: "a1", label: "A1" },
      ],
    },
  ],
  author: { id: "marta", name: "Marta Lin", meta: "148 templates" },
  thumbnail: <Art label="Poster" />,
};

const POOL = [PITCH, REPORT, POSTER];

const meta: Meta<typeof TemplateDetail> = {
  title: "Super AI/Template Detail",
  component: TemplateDetail,
  parameters: { layout: "centered", docs: { page: componentDocsPage(TemplateDetailDocs) } },
  args: {
    open: true,
    templates: POOL,
    onUseTemplate: () => {},
    onFollowChange: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof TemplateDetail>;

/** The preview at full size over a carousel of thumbnails; the current one carries aria-current. */
export const PreviewStrip: Story = {};

/** Size, length and language are chosen here, so the commit carries a configured template. */
export const OptionSelects: Story = {
  args: {
    templates: [
      {
        ...PITCH,
        options: [
          ...PITCH.options!,
          {
            id: "language",
            label: "Language",
            defaultValue: "en",
            choices: [
              { value: "en", label: "English" },
              { value: "de", label: "German" },
              { value: "ja", label: "Japanese" },
            ],
          },
        ],
      },
      REPORT,
      POSTER,
    ],
  },
};

/** The author is next to the work, and follow names them rather than repeating "Follow". */
export const AuthorFollow: Story = {
  args: {
    templates: [{ ...PITCH, author: { ...PITCH.author!, following: true } }, REPORT, POSTER],
  },
};

/** Picking a neighbour swaps the modal in place — the session never dead-ends. */
export const MoreLikeThis: Story = {
  args: {
    // Starts on the single-preview poster, so the row of neighbours is the
    // thing on screen — and it is uncontrolled, so clicking one really swaps.
    defaultTemplateId: "poster",
    onTemplateChange: () => {},
  },
};

/* -------------------------------------------------------------------------
 * Case stories — the situations this modal meets in a product, as opposed to
 * the prop combinations above. See docs/design-system/story-conventions.md.
 *
 * All eight are true for this component, so there are no `case-skip` lines.
 * It is a two-column grid with a chevroned carousel in it (RTL), a Base UI
 * dialog that animates (ReducedMotion) and traps focus (KeyboardOrder), it
 * exposes four controlled pairs (Controlled), every text slot but the title
 * and the preview labels is optional (EmptyLabel), all of them are
 * author-supplied (LongContent), and F3 `asset-detail` is the same primitive
 * pointed the other way in time (Boundary).
 *
 * Three mechanical facts shape every story below:
 *
 * - `DialogContent` portals to the end of `document.body`, so nothing in the
 *   story canvas is an ancestor of the thing under test: `within(canvasElement)`
 *   finds none of it and a `<div dir="rtl">` wrapper never reaches it. `RTL`
 *   therefore sets `dir` on the document.
 * - Unlike F3, this component *does* forward `className` to the popup, so the
 *   375px of `Mobile` arrives as a class rather than as an inline style.
 * - Under the emulated `prefers-reduced-motion: reduce` every test runs with,
 *   the popup no longer animates (see `ReducedMotion`), which is also what
 *   makes geometry reads here trustworthy — mid-`zoom-in-95` every box
 *   measures 95% of its real size.
 * ---------------------------------------------------------------------- */

/** Sets `dir` on the document, which is the only place a portal can read it. */
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

const popupOf = () => document.querySelector<HTMLElement>('[data-slot="template-detail"]')!;
const slot = (name: string) => popupOf().querySelector<HTMLElement>(`[data-slot="${name}"]`)!;
const allSlots = (name: string) =>
  Array.from(popupOf().querySelectorAll<HTMLElement>(`[data-slot="${name}"]`));
const left = (el: Element) => Math.round(el.getBoundingClientRect().left);

/**
 * Eight previews rather than four, so the strip overflows at the modal's own
 * width and its arrows are live. The default four fit, which leaves both arrows
 * natively `disabled` — see `KeyboardOrder`, where that is the point.
 */
const WIDE_STRIP: TemplateDetailTemplate = {
  ...PITCH,
  previews: [
    ...PITCH.previews!,
    { id: "team", label: "Team", media: <Art label="Team" /> },
    { id: "roadmap", label: "Roadmap", media: <Art label="Roadmap" /> },
    { id: "pricing", label: "Pricing", media: <Art label="Pricing" /> },
    { id: "appendix", label: "Appendix", media: <Art label="Appendix" /> },
  ],
};

/**
 * Right-to-left, which for this component is really two questions: does the
 * two-column modal mirror, and does the thumbnail strip inside it.
 *
 * **The modal mirrors, and most of it mirrors for free.** Measured in a 768px
 * popup: the preview column moves to the right (538→968) and the title, author
 * row and options to the left (title 232→518), the avatar sits at the rail's
 * right edge (486→518) with Follow at its left (232→293), the related tiles run
 * right to left (793→968 before 606→781), and the footer's Use button lands on
 * the left (232→370). The one class that decided a side by hand was `text-left`
 * on the thumbnail and related-tile buttons; both are `text-start` as of this
 * wave, which is byte-identical in LTR and is the swap CONTINUE.md §8
 * sanctions. The assertion below reads `text-align` back so it cannot silently
 * regress — H3 `track-lane`'s pattern.
 *
 * **The strip's contents mirror; its arrows do not, and under RTL they stop
 * working altogether.** The thumbnails are flex items, so `direction: rtl`
 * reverses them and preview 1 correctly sits at the right. The arrows keep
 * their physical sides — `left-1` and `right-1` at this call site,
 * `ChevronLeftIcon` and `ChevronRightIcon` in the vendored primitive — so
 * "Previous slide" sits at the far side of the strip from the preview it goes
 * back to. That much is a position problem. The measurement underneath it is
 * worse.
 *
 * **Both arrows are `disabled` in RTL while the strip is overflowing.**
 * Measured in this story's configuration, eight previews in a 430px strip: the
 * track's content is 768px against a 430px window, and Embla reports
 * `canScrollPrev` *and* `canScrollNext` false, so the vendored primitive
 * natively disables both buttons. The four previews past the fold — painted at
 * 504→580 down to 216→292, outside a preview column that ends at 538 — are
 * reachable by neither arrow, and `overflow-hidden` means they cannot be seen
 * either. **The LTR control is the same eight previews in the same 430px
 * strip**: content 752px, `next` enabled, the arrow steps one thumbnail. Only
 * `dir` differs.
 *
 * A second symptom of the same cause, from a different overflow: with the
 * four-preview pitch deck in a 375px popup, "Next slide" *is* enabled under RTL
 * and one press moves the track left by 17px — the wrong direction, since the
 * unseen thumbnails are to the left, and the wrong distance, against LTR's
 * clean 95px step of exactly one thumbnail.
 *
 * The cause is one thing: Embla is never told about direction, so it keeps an
 * LTR axis inside an RTL flex container. This is CONTINUE.md §8's rule that a
 * physical class is only safe to swap when every participant in the layout is a
 * class — here the other participant is JavaScript, so swapping `left-1` and
 * `right-1` would move two dead buttons. H5 `frame-strip` recorded the pairing;
 * J6 measures what it costs. Recorded, not asserted, and not swept: the repair
 * is Embla's `direction` option in the vendored `carousel.tsx`, shared by every
 * carousel in the registry.
 *
 * The close X is the other thing that does not move: `absolute top-2 right-2`
 * lives in `components/ui/dialog.tsx`, so under RTL it lands over the preview
 * column instead of in the rail's empty corner. F3 `asset-detail`'s RTL story
 * records the same class on the same file.
 */
export const RTL: Story = {
  args: { templates: [WIDE_STRIP, REPORT, POSTER] },
  render: (args) => (
    <RtlDocument>
      <TemplateDetail {...args} />
    </RtlDocument>
  ),
  play: async () => {
    const popup = popupOf();

    // The document-level `dir` reached the portal. A wrapper would not have.
    await expect(getComputedStyle(popup).direction).toBe("rtl");

    // The strip really does overflow in this configuration, which is what makes
    // the arrow state in the description a finding rather than an arrangement.
    const content = popup.querySelector<HTMLElement>('[data-slot="carousel-content"]')!;
    await expect(`strip overflows=${content.scrollWidth > content.clientWidth}`).toBe("strip overflows=true");

    // The preview column takes the right-hand side and the rail the left.
    await expect(
      `preview right of title: ${left(slot("template-detail-preview")) > left(slot("template-detail-title"))}`,
    ).toBe("preview right of title: true");

    // Author row mirrors with it: avatar at the logical start, Follow at the end.
    await expect(
      `avatar right of follow: ${left(slot("template-detail-avatar")) > left(slot("template-detail-follow"))}`,
    ).toBe("avatar right of follow: true");

    // The swap, read back rather than trusted: `text-start`, not `text-left`.
    for (const el of [allSlots("template-detail-thumb")[0], allSlots("template-detail-related-item")[0]]) {
      await expect(`${el.dataset.slot} textAlign=${getComputedStyle(el).textAlign}`).toBe(
        `${el.dataset.slot} textAlign=start`,
      );
    }

    // Thumbnails and related tiles both run right to left.
    const thumbs = allSlots("template-detail-thumb");
    await expect(`thumb 1 right of thumb 2: ${left(thumbs[0]) > left(thumbs[1])}`).toBe(
      "thumb 1 right of thumb 2: true",
    );
    const related = allSlots("template-detail-related-item");
    await expect(`related 1 right of related 2: ${left(related[0]) > left(related[1])}`).toBe(
      "related 1 right of related 2: true",
    );
  },
};

/**
 * The reduced-motion branch, and the fix this story is the reason for.
 *
 * `DialogContent` opens with `data-open:animate-in fade-in-0 zoom-in-95`,
 * neither half of which reads the media feature. Measured here before the fix,
 * with `vitest.config.ts` emulating `prefers-reduced-motion: reduce` for every
 * test, the popup's `animation-name` came back **`"enter"`** — the whole modal
 * zoomed. The registry's usual one-class remedy is inert on a Base UI popup
 * (story-conventions.md fact 3), so `template-detail.tsx` now restates the
 * variant on both halves; the assertion reads `animation-name` back rather than
 * checking for a class, because the class was already present and losing.
 *
 * **The option selects are deliberately not asserted here.** `select.tsx`
 * defaults `alignItemWithTrigger` to `true` and its popup carries
 * `data-[align-trigger=true]:animate-none`, so a default `SelectContent`
 * computes `animation-name: "none"` with or without any suppression — measured
 * open in this component, exactly as CONTINUE.md §8's H-wave entry describes.
 * An assertion there cannot fail and is not evidence of anything.
 *
 * Three things this story does not reach, all outside the component:
 *
 * - **The backdrop still fades.** `DialogOverlay`'s `data-open:animate-in
 *   fade-in-0` is inside `components/ui/dialog.tsx`, which renders the overlay
 *   itself and forwards no class from here.
 * - **The buttons still nudge on press** — the vendored `Button`'s
 *   `transition-all` plus `active:…translate-y-px`, recorded against the
 *   primitive in CONTINUE.md §8 rather than against any one component.
 * - **The thumbnail strip still animates its scroll.** Embla moves the track
 *   frame by frame in JavaScript rather than through a CSS transition, so no
 *   `motion-reduce:` variant can reach it: measured under emulated reduce, one
 *   press of "Next slide" left the track 1px from where it started on the next
 *   read and it took several more polls to reach its 95px destination. A
 *   reduced-motion user gets the slide animated regardless.
 */
export const ReducedMotion: Story = {
  play: async () => {
    const popup = await within(document.body).findByRole("dialog");
    // The attribute the animation is keyed off is on the element, so this is
    // the frame the bare `motion-reduce:animate-none` fails to reach.
    await expect(popup).toHaveAttribute("data-open");
    await expect(getComputedStyle(popup).animationName).toBe("none");
  },
};

/**
 * The keyboard contract of the modal, walked as one lap rather than counted
 * inside a budget.
 *
 * What it pins:
 *
 * 1. Opening from a trigger moves focus **into** the popup, and onto the first
 *    thumbnail — the first tabbable descendant, since nothing above it in the
 *    DOM is focusable. A keyboard user therefore meets the previews before the
 *    title, which is the reverse of the reading order.
 * 2. Eleven stops in DOM order, and the order is the finding: four thumbnails,
 *    Follow, the two option selects, two related tiles, the commit, and the
 *    close X last. The docs module's keyboard list says the same thing with one
 *    exception, below.
 * 3. Every stop matches `:focus-visible` and paints a settled treatment, via
 *    `settledFocusRing` — the vendored `Button` fades its ring in over ~250ms,
 *    so an immediate read is a false negative (story-conventions.md fact 5).
 *    One stop is also checked *differentially*: an absolute check answers "does
 *    this element paint a treatment", never "did focus cause it", so the first
 *    thumbnail's signature is compared focused against unfocused.
 * 4. Focus is trapped: the twelfth tab returns to the first thumbnail.
 * 5. Escape closes the modal **and returns focus to the trigger**.
 *
 * **The docs module's stop count is conditional and its condition is not the
 * one written down.** It says the arrows are stops "only when there is more
 * than one preview"; they are stops only when the strip actually *overflows*.
 * Four previews at `basis-24` fit inside a 768px modal, so both arrows are
 * natively `disabled` here and out of the tab order entirely — asserted below,
 * because a disabled arrow is the honest default rather than an edge case. The
 * same four previews in a 375px modal leave "Next slide" enabled, which is
 * where the count in the docs applies. Its worked example ("six previews, three
 * options and four related tiles is sixteen stops") is therefore fourteen at
 * any width where the strip fits.
 *
 * Two traps worth the comments at their query sites: Base UI leaves
 * `tabindex="0"` on a natively-`disabled` button, so a `[tabindex]` selector
 * would count the two arrows and expect thirteen stops; and inside a portal
 * `document.activeElement` cannot be read immediately after `tab()`, so the
 * walk settles on *departure* from the previous stop (story-conventions.md
 * fact 4).
 */
export const KeyboardOrder: Story = {
  render: function KeyboardOrderHarness(args) {
    const [open, setOpen] = React.useState(false);
    return (
      <>
        <Button variant="outline" onClick={() => setOpen(true)}>
          Open template
        </Button>
        <TemplateDetail {...args} open={open} onOpenChange={setOpen} />
      </>
    );
  },
  play: async ({ canvasElement }) => {
    const body = within(document.body);
    const trigger = within(canvasElement).getByRole("button", { name: "Open template" });

    await userEvent.tab();
    await expect(document.activeElement).toBe(trigger);
    await userEvent.keyboard("{Enter}");

    const popup = await body.findByRole("dialog");
    // Native `disabled` is what removes a control from the tab order; Base UI
    // leaves `tabindex="0"` on it, so this is the query that matches reality.
    const stops = Array.from(popup.querySelectorAll("button")).filter((b) => !b.disabled);
    const nameOf = (el: Element | null) =>
      el === null
        ? "nothing"
        : `stop#${stops.indexOf(el as HTMLButtonElement)} ${el.getAttribute("data-slot") ?? "?"}`;

    await expect(stops.map(nameOf)).toEqual([
      "stop#0 template-detail-thumb",
      "stop#1 template-detail-thumb",
      "stop#2 template-detail-thumb",
      "stop#3 template-detail-thumb",
      "stop#4 template-detail-follow",
      "stop#5 select-trigger",
      "stop#6 select-trigger",
      "stop#7 template-detail-related-item",
      "stop#8 template-detail-related-item",
      "stop#9 template-detail-use",
      "stop#10 dialog-close",
    ]);

    // Both arrows exist and neither is reachable: the strip does not overflow
    // at this width, so there is nothing for them to scroll.
    for (const name of ["previous", "next"] as const) {
      await expect(
        `${name} disabled=${(slot(`template-detail-strip-${name}`) as HTMLButtonElement).disabled}`,
      ).toBe(`${name} disabled=true`);
    }

    /**
     * The focused control, once the popup has finished moving focus off
     * `previous`. Settling on arrival returns immediately on a press that has
     * not applied yet, because the previous stop is itself an expected stop;
     * naming the stop focus has to leave makes every tab provably one move.
     */
    const settledStop = async (previous?: HTMLElement) => {
      await waitFor(() => {
        const active = document.activeElement;
        if (!stops.includes(active as HTMLButtonElement)) {
          throw new Error(`focus is not on one of the modal's controls: ${nameOf(active)}`);
        }
        if (previous && active === previous) {
          throw new Error(`focus has not moved off ${nameOf(previous)} yet`);
        }
      });
      return document.activeElement as HTMLElement;
    };

    const start = await settledStop();
    await expect(nameOf(start)).toBe("stop#0 template-detail-thumb");
    await expect(`${nameOf(start)} focusVisible=${start.matches(":focus-visible")}`).toBe(
      `${nameOf(start)} focusVisible=true`,
    );
    await settledFocusRing(start, waitFor);
    // "Did focus cause it", not "is something painted": the signature taken
    // while this thumbnail is focused must differ from the one taken after
    // focus has left it. Compared at the end of the lap, where blurring costs
    // nothing.
    const focusedSignature = focusTreatmentSignature(start);

    const seen = new Set<HTMLElement>([start]);
    let previous = start;
    for (let i = 1; i < stops.length; i += 1) {
      await userEvent.tab();
      const focused = await settledStop(previous);
      await expect(`${nameOf(focused)} repeat=${seen.has(focused)}`).toBe(`${nameOf(focused)} repeat=false`);
      await expect(`${nameOf(focused)} focusVisible=${focused.matches(":focus-visible")}`).toBe(
        `${nameOf(focused)} focusVisible=true`,
      );
      await settledFocusRing(focused, waitFor);
      seen.add(focused);
      previous = focused;
    }
    await expect(seen.size).toBe(stops.length);
    await expect(focusTreatmentSignature(start)).not.toBe(focusedSignature);

    // The lap closes inside the modal: the trap holds.
    await userEvent.tab();
    await expect(nameOf(await settledStop(previous))).toBe("stop#0 template-detail-thumb");

    // Escape dismisses, and the tile that opened it gets focus back.
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("dialog")).toBeNull());
    await waitFor(() => expect(document.activeElement).toBe(trigger));
  },
};

/**
 * Two controlled pairs driven from outside, chosen because they are the two a
 * host actually has a reason to hold: **which template is on screen** and
 * **what it is configured to**. (`open`/`onOpenChange` and
 * `previewId`/`onPreviewChange` are the same mechanism again; `open` is already
 * controlled in every story in this file.)
 *
 * The three assertions the convention asks for, for both pairs:
 *
 * - **Interaction alone does not move the rendered value.** Clicking a related
 *   tile leaves the modal on "Event poster", and choosing A1 leaves the size
 *   select reading "A2", because the parent holds both and never lowers them.
 * - **The callback carries what a consumer needs to apply it.**
 *   `onTemplateChange` gets the bare id, and `onOptionValuesChange` gets the
 *   **whole merged map** rather than the one key that changed — the component's
 *   stated guarantee that a commit can never be half-configured, seen from the
 *   host's side.
 * - **Re-rendering with unchanged values holds it fixed.** Every refusal
 *   re-renders this harness (the counter in the canvas is the evidence) and the
 *   popup element that comes out is the same DOM node, so focus and scroll
 *   position inside the modal survive a refused swap.
 *
 * **The finding is what controlling `templateId` does to the "never
 * dead-ends" guarantee.** Uncontrolled, picking a neighbour swaps the modal's
 * contents and `open` is structurally untouched. Controlled, the swap is the
 * host's to perform — and a host that logs `onTemplateChange` without applying
 * it gets a modal where every related tile is inert. Nothing in the component
 * distinguishes "observing the move" from "driving it", so the guarantee is
 * only as good as the handler, which is the one thing the API cannot hold.
 */
export const Controlled: Story = {
  args: {
    templateId: "poster",
    optionValues: { size: "a2" },
    onTemplateChange: fn(),
    onOptionValuesChange: fn(),
  },
  render: function ControlledHarness({ onTemplateChange, onOptionValuesChange, ...args }) {
    const [refusals, setRefusals] = React.useState(0);
    return (
      <>
        <output data-testid="refusals" className="text-foreground text-sm">
          {refusals}
        </output>
        <TemplateDetail
          {...args}
          onTemplateChange={(id) => {
            setRefusals((n) => n + 1);
            onTemplateChange?.(id);
          }}
          onOptionValuesChange={(values) => {
            setRefusals((n) => n + 1);
            onOptionValuesChange?.(values);
          }}
        />
      </>
    );
  },
  play: async ({ args, canvasElement }) => {
    const body = within(document.body);
    const refusals = within(canvasElement).getByTestId("refusals");
    const before = popupOf();

    // A related tile asks for a swap; the modal does not perform it.
    const tile = allSlots("template-detail-related-item").find((el) => el.dataset.templateId === "report")!;
    await userEvent.click(tile);
    await waitFor(() => expect(refusals).toHaveTextContent("1"));
    await expect(args.onTemplateChange).toHaveBeenLastCalledWith("report");
    await expect(slot("template-detail-title")).toHaveTextContent("Event poster");
    await expect(slot("template-detail-status")).toHaveTextContent("Showing Event poster");

    // An option asks for a value; the trigger does not move.
    const trigger = within(popupOf()).getByRole("combobox");
    await expect(trigger).toHaveTextContent("A2");
    await userEvent.click(trigger);
    await userEvent.click(await body.findByRole("option", { name: "A1" }));
    await waitFor(() => expect(refusals).toHaveTextContent("2"));
    // The whole map, not the single key: a commit is never half-configured.
    await expect(args.onOptionValuesChange).toHaveBeenLastCalledWith({ size: "a1" });
    await waitFor(() => expect(trigger).toHaveTextContent("A2"));

    // Two refusals, two re-renders with the values unchanged, same popup node.
    await expect(popupOf()).toBe(before);
  },
};

/**
 * Everything optional, left out — and the sharp case is the author, because
 * `name` is the one required string that has somewhere to collapse *to*.
 *
 * `template-detail.tsx` splits the follow button deliberately: a visible
 * `aria-hidden` "Follow" beside an `sr-only` "Follow Marta Lin", so the control
 * announces whose follow it is rather than joining the page's other bare
 * "Follow"s. With `name: ""` that sr-only string is `"Follow "`, the trailing
 * space is trimmed, and **the accessible name is exactly "Follow"** — the
 * indistinguishable control the split exists to avoid, produced by the one
 * input the component treats as required-and-non-empty. The avatar collapses
 * with it: its fallback is `name.slice(0, 1)`, so the circle renders empty
 * rather than falling back to anything.
 *
 * The other absences are quieter and all correct: no `description` removes the
 * `DialogDescription` entirely, no `meta` removes the line under the name, no
 * `hint` removes A6's `<p>` — and a single preview removes the whole thumbnail
 * strip, taking the two arrows with it.
 *
 * **Two collapses are described rather than rendered, because rendering them
 * would fail the gate outright** (the H4 `transcript-editor` precedent):
 *
 * - `preview.label = ""` leaves a thumbnail button whose only content is
 *   `media`, which callers are told to pass as decorative — an unnamed
 *   `<button>` and a red `button-name`. The type marks `label` required and
 *   its comment says why; the empty string is the hole in that.
 * - `template.title = ""` empties the element the popup's `aria-labelledby`
 *   points at, which is `aria-dialog-name`, red for the same reason L3
 *   `feature-announcement` was.
 */
export const EmptyLabel: Story = {
  args: {
    templates: [
      {
        id: "blank",
        title: "Blank canvas",
        previews: [{ id: "blank", label: "Empty artboard", media: <Art label="Blank" /> }],
        options: [
          {
            id: "size",
            label: "Size",
            choices: [
              { value: "a4", label: "A4" },
              { value: "a3", label: "A3" },
            ],
          },
        ],
        author: { id: "anon", name: "" },
        thumbnail: <Art label="Blank" />,
      },
      REPORT,
      POSTER,
    ],
  },
  play: async () => {
    const popup = popupOf();

    // The per-author name is gone; what is left is the bare word.
    await expect(slot("template-detail-follow")).toHaveAccessibleName("Follow");
    await expect(slot("template-detail-avatar")).toHaveTextContent("");

    // The optional slots leave nothing behind rather than an empty box.
    for (const name of [
      "template-detail-description",
      "template-detail-author-meta",
      "field-row-hint",
      "template-detail-strip",
    ]) {
      await expect(`${name} rendered=${popup.querySelector(`[data-slot="${name}"]`) !== null}`).toBe(
        `${name} rendered=false`,
      );
    }

    // The modal still says which template it is, which is the floor.
    await expect(await within(document.body).findByRole("dialog")).toHaveAccessibleName("Blank canvas");
  },
};

const LONG_TITLE = "Investor-ready quarterly business review deck with a numbers appendix and speaker notes";
const LONG_PREVIEW_LABEL = "Cover slide carrying the company mark, the reporting period and the presenter";
const LONG_RELATED_TITLE = "Board update one-pager with the same cover treatment and a single metrics table";

/**
 * Every author-supplied string at roughly ninety characters, in one modal, so
 * the wrap-or-truncate decision is visible where it is actually made rather
 * than component by component.
 *
 * **The title wraps and the labels truncate, and that split is the right one.**
 * The `DialogTitle` is the modal's accessible name and the only place the
 * template is identified in full, so it takes three lines rather than clipping;
 * the accessible name is the whole string either way, asserted below. Every
 * label *around* it is `truncate` — A8's overlay label on a thumbnail, A8's
 * `below` label on a related tile, and the author's name — because those sit in
 * fixed-width frames where a wrap would push the grid out of alignment.
 *
 * **What that costs is worth naming: two related tiles whose titles share a
 * long prefix are indistinguishable.** The tile's accessible name comes from
 * the same node, so the *name* is complete for a screen reader; it is the
 * sighted reader who gets "Board update one-pager with the sam…" twice with no
 * tooltip and no `title` attribute. A8 owns that decision, and J6 is where a
 * long template title meets it.
 *
 * **The option row does not fit, and it takes the modal with it — the finding
 * of this story.** A6 `field-row` puts its control in a `flex` box and
 * `template-detail` gives the select `w-full`, and neither carries `min-w-0`,
 * so a flex item's automatic minimum size is its content: the select grows to
 * its longest choice label instead of shrinking to its column. Measured at the
 * modal's natural width with "16:9 widescreen for projectors and video calls"
 * as one choice — the popup is 768px wide and its content **912px**, the
 * options block 446px inside a 286px column, and the trigger 336px wide with
 * nothing clipped. **The whole modal scrolls sideways**, which is the one thing
 * a dialog cannot do gracefully, and it happens at the default size rather than
 * only when squeezed. Nothing in the API lets a caller give an option more
 * width. Recorded, not asserted and not swept: the repair is a `min-w-0` in A6
 * `field-row` or at this call site, which is a layout decision across every
 * consumer of that row rather than a class this wave may sweep.
 */
export const LongContent: Story = {
  args: {
    templates: [
      {
        id: "qbr",
        title: LONG_TITLE,
        description:
          "A print-ready long-form deck with an appendix of tables, sized for a forty-minute review and a leave-behind.",
        previews: [
          { id: "cover", label: LONG_PREVIEW_LABEL, media: <Art label="Cover" /> },
          { id: "tables", label: "Tables", media: <Art label="Tables" /> },
        ],
        options: [
          {
            id: "size",
            label: "Slide aspect ratio",
            choices: [
              { value: "16-9", label: "16:9 widescreen for projectors and video calls" },
              { value: "4-3", label: "4:3 standard" },
            ],
          },
        ],
        author: {
          id: "marta",
          name: "Marta Lin and the Presentation Systems team",
          meta: "148 templates, mostly long-form reporting layouts",
        },
        thumbnail: <Art label="QBR" />,
      },
      { ...REPORT, id: "board", title: LONG_RELATED_TITLE },
      POSTER,
    ],
  },
  play: async () => {
    const clipped = (el: HTMLElement) => el.scrollWidth > el.clientWidth;
    const lines = (el: HTMLElement) =>
      Math.round(el.scrollHeight / parseFloat(getComputedStyle(el).lineHeight));

    // The title takes the space it needs and keeps the whole string.
    const title = slot("template-detail-title");
    await expect(`title lines=${lines(title)} clipped=${clipped(title)}`).toBe("title lines=3 clipped=false");
    await expect(await within(document.body).findByRole("dialog")).toHaveAccessibleName(LONG_TITLE);

    // The labels around it clip instead, in their fixed frames.
    const authorName = slot("template-detail-author-name");
    await expect(`author clipped=${clipped(authorName)}`).toBe("author clipped=true");
    const thumbLabel = allSlots("template-detail-thumb")[0].querySelector<HTMLElement>(
      '[data-slot="preview-tile-label"]',
    )!;
    await expect(`thumb label clipped=${clipped(thumbLabel)}`).toBe("thumb label clipped=true");
    const relatedLabel = allSlots("template-detail-related-item")[0].querySelector<HTMLElement>(
      '[data-slot="preview-tile-label"]',
    )!;
    await expect(`related label clipped=${clipped(relatedLabel)}`).toBe("related label clipped=true");
    // …but the full string is still the tile's accessible name.
    await expect(allSlots("template-detail-related-item")[0]).toHaveTextContent(LONG_RELATED_TITLE);

    // The preview column absorbs its share by wrapping and clipping; the
    // sideways scroll above comes from the option row alone, which is why this
    // half is asserted and that half is only described.
    const preview = slot("template-detail-preview");
    await expect(`preview overflows=${clipped(preview)}`).toBe("preview overflows=false");
  },
};

/**
 * 375px, applied as a class — this component forwards `className` to the popup,
 * so unlike F3 `asset-detail` the width does not have to arrive as an inline
 * style. It is still the sanctioned test condition of story-conventions.md
 * fact 2 rather than a design value.
 *
 * **What this renders is the squeezed desktop, not the phone, and the
 * difference matters more here than usual.** The gate's chromium is 1200×900,
 * so `md:` still matches inside a 375px box and the modal keeps its two-column
 * grid — 194px of preview against a 129px rail — where a real 375px viewport
 * gets a single 343px column. Same for the related row, which stays at
 * `sm:grid-cols-4`. Both are asserted, so a reader knows which claim the rest
 * of the story is making.
 *
 * **The carousel arrows are the thing worth measuring, and they pass.** The
 * vendored `Carousel` positions them at `-left-12` / `-right-12`, outside the
 * component's own box — CONTINUE.md §8 records that D2 `reference-strip`
 * composes it that way and puts 96px of arrow outside a 375px column. J6 is in
 * the other group, with C3 `feature-card-row` and H5 `frame-strip`: `left-1`
 * and `right-1` at this call site pull both arrows inside, and the assertion
 * below is that neither crosses the popup's edge. The cost of that choice is
 * the arrows *overlap* the strip instead: measured here, "Previous slide" at
 * 433→461 sits over the first thumbnail's 429→505, taking 28px of a 76px tile,
 * and "Next slide" does the same at the other end. They are vertically centred,
 * so A8's label band along the bottom of each tile stays readable.
 *
 * **The modal's own body scrolls sideways at this width — 485px of content in
 * 375px — and it is the same defect `LongContent` measures**: the option
 * column's select cannot shrink below its content because nothing in the chain
 * carries `min-w-0`. At 129px of column it takes 256px, so the finding is not
 * specific to long labels; "16:9 widescreen" is enough. What is asserted here
 * is the half that is genuinely fine — the document behind the modal does not
 * scroll, and neither does the preview column.
 */
export const Mobile: Story = {
  args: { className: "w-[375px] max-w-[375px] sm:max-w-[375px]" },
  play: async () => {
    const popup = popupOf();
    const box = (el: Element) => el.getBoundingClientRect();

    await expect(`popup width=${Math.round(box(popup).width)}`).toBe("popup width=375");

    // Still the wide layout, squeezed: two columns, and four related tiles.
    const grid = slot("template-detail-preview").parentElement!.parentElement!;
    await expect(getComputedStyle(grid).gridTemplateColumns.split(" ")).toHaveLength(2);
    const relatedGrid = allSlots("template-detail-related-item")[0].parentElement!;
    await expect(getComputedStyle(relatedGrid).gridTemplateColumns.split(" ")).toHaveLength(4);

    // Both arrows are inside the popup: the call-site override, read back.
    for (const name of ["previous", "next"] as const) {
      const arrow = box(slot(`template-detail-strip-${name}`));
      await expect(`${name} inside=${arrow.left >= box(popup).left && arrow.right <= box(popup).right}`).toBe(
        `${name} inside=true`,
      );
    }

    // The page behind the modal does not scroll sideways, and neither does the
    // preview column. (The modal's own body does — see the description.)
    await expect(
      `document overflows=${document.documentElement.scrollWidth > document.documentElement.clientWidth}`,
    ).toBe("document overflows=false");
    const preview = slot("template-detail-preview");
    await expect(`preview overflows=${preview.scrollWidth > preview.clientWidth}`).toBe(
      "preview overflows=false",
    );
  },
};

/**
 * Four surfaces that look like this one in a screenshot. The rule is **what the
 * modal's controls do to the thing it is showing**, and it separates all four:
 *
 * - **J6 `template-detail`** configures something that has not been made yet.
 *   Its controls decide what the next generation *will* be — option selects
 *   whose values ride out on the commit, an author to follow, a row of
 *   neighbours to leave for. If the modal ends in "make this", it is J6.
 * - **F3 `asset-detail`** opens a result that already exists. Same primitive,
 *   same two-column shape, same "more like this" footer, pointed the other way
 *   in time: prompt, seed and sampler as provenance, and three verbs that hand
 *   the finished thing to another tool. If the modal's controls hand off what
 *   was already generated, it is F3. F3's own `Boundary` states this rule from
 *   its side; they agree.
 * - **P2 `detail-view-shell`** knows nothing about what it holds — slots the
 *   host fills, tabs named by whatever is passed, an opening mode the user
 *   picks. Content-specific vocabulary, which for J6 means *template*,
 *   *option*, *author*, *use*, is the sign you want a content-specific
 *   component instead.
 * - **J3 `explore-gallery` / J4 `artifact-grid`** are the surfaces this modal
 *   opens *from*. A grid answers "which one"; this answers "this one, set up
 *   how". The give-away that a grid has been asked to do J6's job is a tile
 *   that has grown a select.
 *
 * **Why nothing is rendered beside it.** This is a portaled modal: Base UI
 * marks everything outside the popup `aria-hidden` while it is open, and all
 * four neighbours are either modal dialogs themselves or grids full of
 * focusable tiles. Either way the canvas would hold focusable elements inside
 * an `aria-hidden` subtree — an `aria-hidden-focus` violation manufactured by
 * the story rather than by any component. F3 reached the same conclusion for
 * the same reason and could render one inert card; here the honest neighbours
 * are all interactive, so the rule is written rather than staged.
 */
export const Boundary: Story = {};
