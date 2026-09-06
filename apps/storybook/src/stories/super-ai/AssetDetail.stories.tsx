import type { Meta, StoryObj } from "@storybook/react-vite";
import { Sparkles } from "lucide-react";
import * as React from "react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";

import { Button } from "@/components/ui/button";
import { AssetDetail } from "@/registry/super-ai/asset-detail";
import { ResultCard } from "@/registry/super-ai/result-card";
import { AssetDetailDocs } from "@/content/components/asset-detail.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const PROMPT = "A red bicycle leaning on a sunlit wall, shot on 35mm film";
const spanFor = (phrase: string) => {
  const start = PROMPT.indexOf(phrase);
  return { start, end: start + phrase.length };
};

function Media() {
  return (
    <div className="bg-foreground/10 flex aspect-video w-full items-center justify-center">
      <Sparkles aria-hidden className="text-foreground/40 size-10" />
    </div>
  );
}

const PARAMS = [
  { label: "Model", value: "Flux 1.1 Pro" },
  { label: "Seed", value: "4471", copyable: true },
  { label: "Sampler", value: "Euler a", copyable: true },
  { label: "Steps", value: "28" },
];

const meta: Meta<typeof AssetDetail> = {
  title: "Super AI/Asset Detail",
  component: AssetDetail,
  parameters: { layout: "centered", docs: { page: componentDocsPage(AssetDetailDocs) } },
  args: {
    open: true,
    media: <Media />,
    prompt: PROMPT,
    params: PARAMS,
    cost: { amount: 17 },
    onCopyPrompt: () => {},
    onRemix: () => {},
    onEdit: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof AssetDetail>;

/**
 * The spec's first bullet, asserted rather than described: a marked phrase is
 * a real `<button>` whose text is its own accessible name, so the string a
 * screen reader announces is byte-for-byte the string `onSpanSelect` hands
 * back — `"a sunlit wall"`, characters 25–38 of this prompt.
 *
 * **What the same click does not do, measured here: it does not arm Remix.**
 * The component holds no notion of a currently-selected phrase, so pressing
 * Remix immediately after clicking one emits `{ prompt: <the whole prompt> }`
 * — the phrase is not in it. That is the correct contract for the button (the
 * spec's second bullet is "Remix carries prompt and params into D1") and it is
 * why the play function asserts it, but `AssetDetailProps["onRemix"]` declares
 * a `span?: string` field the component never populates from anywhere. A host
 * that wants "selecting a phrase feeds Remix" has to hold the last
 * `onSpanSelect` itself and pass the phrase on. Recorded, not pinned: the
 * assertion below checks what Remix does carry, not that the span is missing.
 */
export const HighlightedSpans: Story = {
  args: {
    highlightedSpans: [spanFor("a sunlit wall"), spanFor("35mm film")],
    onSpanSelect: fn(),
    onRemix: fn(),
  },
  play: async ({ args }) => {
    const body = within(document.body);
    const phrase = body.getByRole("button", { name: "a sunlit wall" });

    // The name is the material. Nothing derives it from an id or a label
    // prop, so an off-by-one in the offsets would be audible as well as wrong.
    await expect(phrase).toHaveAccessibleName("a sunlit wall");
    await userEvent.click(phrase);
    await expect(args.onSpanSelect).toHaveBeenCalledWith("a sunlit wall", { start: 25, end: 38 });
    await expect(PROMPT.slice(25, 38)).toBe("a sunlit wall");

    // Remix, pressed straight afterwards, carries the whole prompt.
    await userEvent.click(body.getByRole("button", { name: "Remix" }));
    await expect(args.onRemix).toHaveBeenCalledWith({ prompt: PROMPT });
  },
};

/** A10's grid, with a missing value rendering as an em-dash. */
export const ParamsGrid: Story = {
  args: {
    params: [...PARAMS, { label: "Guidance" }],
  },
};

/** Copy prompt · Remix · Edit, always in that order. */
export const HandoffVerbs: Story = {};

/** Suggestions supplied by the caller. */
export const MoreLikeThis: Story = {
  args: {
    moreLikeThis: (
      <div className="grid grid-cols-3 gap-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="bg-foreground/10 aspect-square rounded" />
        ))}
      </div>
    ),
  },
};

/* -------------------------------------------------------------------------
 * Case stories — the situations this lightbox meets in a product, as opposed
 * to the prop combinations above. See docs/design-system/story-conventions.md.
 *
 * All eight are true for this component, so there are no `case-skip` lines.
 * It is a two-column grid (RTL), a Base UI dialog that animates (ReducedMotion)
 * and traps focus (KeyboardOrder), it exposes an `open`/`onOpenChange` pair
 * (Controlled), every slot but `media` is optional (EmptyLabel), the prompt is
 * author-supplied (LongContent), and J6 `template-detail` is a near-twin built
 * on the same primitive (Boundary).
 *
 * Two mechanical facts shape every story below, both because this is a
 * portal:
 *
 * - `DialogContent` portals to the end of `document.body`, so nothing in the
 *   story canvas is an ancestor of the thing under test. `within(canvasElement)`
 *   finds none of it, a `<div dir="rtl">` wrapper never reaches it, and the
 *   375px wrapper of story-conventions.md fact 2 is a no-op — the popup is
 *   `position: fixed` and measures against the viewport.
 * - `AssetDetail` forwards no `className`. Every other portaled component with
 *   a `Mobile` story in this repo (`task-tray`, `shortcuts-sheet`) narrows
 *   itself through one; here there is no prop to narrow through, which is why
 *   `Mobile` reaches for the popup element directly and says so.
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

/**
 * Right-to-left, and the story that matters most for a component whose whole
 * shape is "media on one side, provenance on the other".
 *
 * It mirrors, and it mirrors for free: the layout is a bare
 * `md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]` with no physical direction
 * class anywhere in `asset-detail.tsx` — no `pl-`, `ml-`, `border-l` or
 * `text-left` — so the media column moves to the right and the rail to the
 * left, and A10's `<dl>` moves its labels and values with it. Measured in a
 * 896px popup: media 523→1032, rail 168→507, and the params grid's `<dt>`
 * 454→507 against its `<dd>` 168→438.
 *
 * The prompt survives the flip too, which was not a given. Each selectable
 * phrase is an `inline-block` button, and an inline-block is a *neutral* to
 * the bidi algorithm — the same shape that reorders `context-chips`' mention
 * labels. Here the surrounding text is Latin on both sides of every span, so
 * N1 resolves the neutrals to LTR and the sentence keeps its reading order:
 * "a sunlit wall" still paints left of "35mm film". Asserted below, because
 * the day a prompt arrives with Arabic before the first span is the day that
 * stops being true and nothing else would notice.
 *
 * **The one thing that does not mirror is not this component's to fix.** The
 * close X is `absolute top-2 right-2` in `components/ui/dialog.tsx`, so it
 * stays on the visual right — and here that is worse than it is elsewhere:
 * measured at 1012→1040 against a media column ending at 1032, it lands *on
 * the image* instead of in the empty corner the rail leaves it in LTR.
 * `shortcuts-sheet`'s RTL story already records the class; this is what it
 * costs a dialog whose widest column is a picture. Not swept, because the file
 * is vendored and shared by every dialog in the repo.
 */
export const RTL: Story = {
  args: {
    highlightedSpans: [spanFor("a sunlit wall"), spanFor("35mm film")],
    onSpanSelect: () => {},
  },
  render: (args) => (
    <RtlDocument>
      <AssetDetail {...args} />
    </RtlDocument>
  ),
  play: async () => {
    const popup = document.querySelector<HTMLElement>('[data-slot="asset-detail"]')!;
    const slot = (name: string) => popup.querySelector<HTMLElement>(`[data-slot="${name}"]`)!;
    const left = (el: HTMLElement) => el.getBoundingClientRect().left;

    // The document-level `dir` reached the portal. A wrapper would not have.
    await expect(getComputedStyle(popup).direction).toBe("rtl");

    // The media takes the right-hand column and the provenance rail the left.
    await expect(
      `media right of rail: ${left(slot("asset-detail-media")) > left(slot("asset-detail-rail"))}`,
    ).toBe("media right of rail: true");

    // A10's grid mirrors with it: label at the logical start, value after it.
    await expect(
      `label right of value: ${left(slot("stat-readout-label")) > left(slot("stat-readout-value"))}`,
    ).toBe("label right of value: true");

    // …and the prompt does not reorder around its own buttons.
    const spans = Array.from(popup.querySelectorAll<HTMLElement>('[data-slot="asset-detail-span"]'));
    await expect(`spans in reading order: ${left(spans[0]) < left(spans[1])}`).toBe(
      "spans in reading order: true",
    );
  },
};

/**
 * The reduced-motion branch, and the fix this story is the reason for.
 *
 * `DialogContent` opens with `data-open:animate-in fade-in-0 zoom-in-95` and
 * closes with the `data-closed` twin, neither of which reads the media
 * feature. Measured here before the fix, with `vitest.config.ts` emulating
 * `prefers-reduced-motion: reduce` for every test, the popup's computed
 * `animation-name` read **`"enter"`** — the whole card zoomed in.
 *
 * The registry's usual one-class remedy is inert on a Base UI popup: Tailwind
 * v4 wraps the data-attribute test in `:where(…)`, so both halves carry the
 * same single-class specificity and the tie falls to source order, which emits
 * the plain `motion-reduce:` block first. Restating the variant on both halves
 * — `motion-reduce:data-open:animate-none` and its `data-closed` twin, added
 * to `asset-detail.tsx` in this wave — sorts after its counterpart and wins
 * the same tie. That is story-conventions.md fact 3 applied to the fifth popup
 * family; the assertion reads `animation-name` back rather than checking for
 * the class, because the class was present and losing.
 *
 * Two things this does not reach, both outside the component:
 *
 * - **The backdrop still fades.** `DialogOverlay`'s `data-open:animate-in
 *   fade-in-0` lives in `components/ui/dialog.tsx`, which `AssetDetail`
 *   neither owns nor can pass a class to — `DialogContent` renders the overlay
 *   itself and forwards nothing.
 * - **The three verbs still nudge on press.** The vendored `Button` carries
 *   `transition-all` plus `active:not-aria-[haspopup]:translate-y-px`, which
 *   is library-wide press chrome recorded against the primitive (CONTINUE.md
 *   §8) rather than a branch this component owns.
 */
export const ReducedMotion: Story = {
  play: async () => {
    const popup = await within(document.body).findByRole("dialog");
    // Still opening: the attribute the animation is keyed off is on the
    // element, so this is the frame the bare class fails to reach.
    await expect(popup).toHaveAttribute("data-open");
    await expect(getComputedStyle(popup).animationName).toBe("none");
  },
};

/**
 * A painted focus ring, or `"none"`.
 *
 * Two properties are checked rather than one, and each is checked for *size
 * and alpha* rather than for not being the string `"none"` — the weaker form
 * has produced a false positive elsewhere in this wave programme (a fully
 * transparent zero-size shadow is not the string "none"; CONTINUE.md §8).
 */
function paintedRing(el: HTMLElement) {
  const { boxShadow, outlineStyle, outlineWidth } = getComputedStyle(el);
  if (outlineStyle !== "none" && parseFloat(outlineWidth) > 0) return `outline ${outlineWidth}`;
  const layers = boxShadow.match(/(?:oklch|oklab|rgba?)\([^)]*\)(?:\s+-?[\d.]+px){3,4}/g) ?? [];
  const painted = layers.filter((layer) => {
    const slash = layer.match(/\/\s*([\d.]+)\s*\)/);
    const rgba = layer.match(/rgba\(\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+\s*,\s*([\d.]+)\s*\)/);
    const alpha = slash ? parseFloat(slash[1]) : rgba ? parseFloat(rgba[1]) : 1;
    if (alpha === 0) return false;
    return (layer.match(/-?[\d.]+px/g) ?? []).map(parseFloat).some((n) => n !== 0);
  });
  return painted.length > 0 ? painted.join(" + ") : "none";
}

/**
 * The ring once it has finished arriving.
 *
 * The vendored `Button` carries `transition-all`, so its focus ring
 * *animates*: read `box-shadow` on the frame the button takes focus and the
 * ring layer is `oklab(0 0 0 / 0) 0px 0px 0px 0px` — transparent and
 * zero-sized, the first frame of the transition. Measured on all four
 * Button-based stops in this dialog, which would report "no focus treatment"
 * on four controls that are painting one. Waiting is the difference between a
 * finding and an artefact.
 */
async function settledRing(el: HTMLElement) {
  let ring = "none";
  await waitFor(() => {
    ring = paintedRing(el);
    expect(`${ring}`).not.toBe("none");
  });
  return ring;
}

/**
 * The keyboard contract of a modal lightbox, walked as one lap rather than
 * counted inside a budget.
 *
 * What it pins:
 *
 * 1. Opening from a trigger moves focus **into** the popup, and onto the
 *    first selectable phrase rather than a heading — the heading is `sr-only`,
 *    so there is nothing else for it to land on. That is the docs module's
 *    focus note, and it is the reason the prompt is the first thing a keyboard
 *    user meets: the spec's editable-material claim is true of the tab order
 *    too, not only of the mouse.
 * 2. Eight stops, in DOM order: two spans, Copy prompt, Remix, Edit, the two
 *    `copyable` parameters' copy buttons, then the close X. The docs module's
 *    keyboard list says exactly this, and this is the only place it is
 *    checked.
 * 3. Every stop matches `:focus-visible` and paints a ring — see
 *    `settledRing` for why the naive read of that is a false negative here.
 * 4. Focus is trapped: the ninth tab returns to the first span rather than
 *    leaking to the inert page behind.
 * 5. Escape closes the dialog **and returns focus to the trigger**, which is
 *    the grid tile the result was opened from. Without that half, a keyboard
 *    user who opens a lightbox lands back at the top of the document.
 *
 * **A trap worth the comment at the query.** Base UI leaves `tabindex="0"` on
 * a natively-`disabled` button, so the usual
 * `[tabindex]:not([tabindex="-1"])` half of a focusable-element selector
 * matches the three verbs even when they are inert — the walk would then
 * expect eleven stops and find eight. Native `disabled` still wins, so the
 * honest query here is "buttons that are not disabled".
 */
export const KeyboardOrder: Story = {
  args: {
    highlightedSpans: [spanFor("a sunlit wall"), spanFor("35mm film")],
    onSpanSelect: () => {},
  },
  render: function KeyboardOrderHarness(args) {
    const [open, setOpen] = React.useState(false);
    return (
      <>
        <Button variant="outline" onClick={() => setOpen(true)}>
          Open result
        </Button>
        <AssetDetail {...args} open={open} onOpenChange={setOpen} />
      </>
    );
  },
  play: async ({ canvasElement }) => {
    const body = within(document.body);
    const trigger = within(canvasElement).getByRole("button", { name: "Open result" });

    await userEvent.tab();
    await expect(document.activeElement).toBe(trigger);
    await userEvent.keyboard("{Enter}");

    const popup = await body.findByRole("dialog");
    const stops = Array.from(popup.querySelectorAll("button")).filter((b) => !b.disabled);
    const nameOf = (el: Element | null) =>
      el === null
        ? "nothing"
        : `stop#${stops.indexOf(el as HTMLButtonElement)} ${(el.getAttribute("aria-label") ?? el.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 18)}`;

    await expect(stops.map((s) => nameOf(s))).toEqual([
      "stop#0 a sunlit wall",
      "stop#1 35mm film",
      "stop#2 Copy prompt",
      "stop#3 Remix",
      "stop#4 Edit",
      "stop#5 Copy",
      "stop#6 Copy",
      "stop#7 Close",
    ]);

    /**
     * The focused control, once the popup has finished moving focus off
     * `previous`.
     *
     * Settle on departure, not on arrival: waiting only for "focus is on some
     * expected stop" returns immediately on a press that has not applied yet,
     * because the previous stop is itself an expected stop. That form passed
     * thirteen warm runs on `ai-tools-menu` and failed the first cold one
     * (story-conventions.md fact 4). Naming the stop focus has to leave makes
     * every tab provably one move, which is what turns the lap into a proof.
     */
    const settledStop = async (previous?: HTMLElement) => {
      await waitFor(() => {
        const active = document.activeElement;
        if (!stops.includes(active as HTMLButtonElement)) {
          throw new Error(`focus is not on one of the dialog's controls: ${nameOf(active)}`);
        }
        if (previous && active === previous) {
          throw new Error(`focus has not moved off ${nameOf(previous)} yet`);
        }
      });
      return document.activeElement as HTMLElement;
    };

    // Focus starts on the first selectable phrase, not on the popup.
    const start = await settledStop();
    await expect(nameOf(start)).toBe("stop#0 a sunlit wall");

    const seen = new Set<HTMLElement>([start]);
    await expect(`${nameOf(start)} focusVisible=${start.matches(":focus-visible")}`).toBe(
      `${nameOf(start)} focusVisible=true`,
    );
    await settledRing(start);

    let previous = start;
    for (let i = 1; i < stops.length; i += 1) {
      await userEvent.tab();
      const focused = await settledStop(previous);
      await expect(`${nameOf(focused)} repeat=${seen.has(focused)}`).toBe(`${nameOf(focused)} repeat=false`);
      await expect(`${nameOf(focused)} focusVisible=${focused.matches(":focus-visible")}`).toBe(
        `${nameOf(focused)} focusVisible=true`,
      );
      await settledRing(focused);
      seen.add(focused);
      previous = focused;
    }
    await expect(seen.size).toBe(stops.length);

    // The lap closes inside the dialog: the trap holds.
    await userEvent.tab();
    await expect(nameOf(await settledStop(previous))).toBe("stop#0 a sunlit wall");

    // Escape dismisses, and the tile that opened it gets focus back.
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("dialog")).toBeNull());
    await waitFor(() => expect(document.activeElement).toBe(trigger));
  },
};

/**
 * `open` / `onOpenChange` driven from outside, which is the only state this
 * component has — and the reason it is worth a story is that a lightbox is
 * exactly where a host wants to refuse a dismissal: an unsaved remix, a
 * confirmation, a route change that has not resolved yet.
 *
 * The three assertions the convention asks for, all present here:
 *
 * - **Interaction alone does not move the rendered value.** Escape and the
 *   close X both leave the dialog on screen, because the parent holds `open`
 *   at `true` and never lowers it. Base UI's dialog is fully controlled: it
 *   asks, it does not act.
 * - **The change callback fires with the payload a consumer needs.**
 *   `onOpenChange(false)` — the *requested* value, so `setOpen(next)` is the
 *   whole of a host that wants the default behaviour back.
 * - **Re-rendering with an unchanged `open` holds it fixed.** Each refusal
 *   re-renders this harness (the counter in the canvas is the evidence) with
 *   `open` still `true`, and the popup element that comes out is the same DOM
 *   node — no remount, so focus and scroll position inside the dialog survive
 *   a refused dismissal.
 *
 * Note what is *not* controllable: nothing else. `highlightedSpans` are
 * rendering input, the verbs report intents, and there is no selected-phrase
 * state for a host to hold (see `HighlightedSpans`). `open` is the whole API.
 */
export const Controlled: Story = {
  args: {
    highlightedSpans: [spanFor("a sunlit wall")],
    onSpanSelect: () => {},
    onOpenChange: fn(),
  },
  render: function ControlledHarness({ onOpenChange, ...args }) {
    const [refusals, setRefusals] = React.useState(0);
    return (
      <>
        <output data-testid="refusals" className="text-foreground text-sm">
          {refusals}
        </output>
        <AssetDetail
          {...args}
          open
          onOpenChange={(next) => {
            setRefusals((n) => n + 1);
            onOpenChange?.(next);
          }}
        />
      </>
    );
  },
  play: async ({ args, canvasElement }) => {
    const body = within(document.body);
    const refusals = within(canvasElement).getByTestId("refusals");
    const before = document.querySelector('[data-slot="asset-detail"]')!;

    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(refusals).toHaveTextContent("1"));
    await expect(args.onOpenChange).toHaveBeenLastCalledWith(false);

    await userEvent.click(body.getByRole("button", { name: "Close" }));
    await waitFor(() => expect(refusals).toHaveTextContent("2"));
    await expect(args.onOpenChange).toHaveBeenLastCalledWith(false);

    // Two refused dismissals, two re-renders with `open` unchanged, and the
    // same popup node throughout.
    await expect(body.getByRole("dialog")).toBe(before);
  },
};

/**
 * Everything the rail can carry, left out. `media` is the only required slot,
 * so this is what the component looks like when a host has a picture and
 * nothing that made it — and it is a more common state than it sounds, because
 * provenance is what arrives late.
 *
 * Three things this renders that are worth seeing rather than reading:
 *
 * - **`prompt=""` is not an empty prompt, it is no prompt.** The whole block
 *   is guarded on the string's truthiness, so an empty one takes its `Prompt`
 *   heading with it and leaves no trace that a prompt slot exists — and the
 *   `highlightedSpans` passed alongside it render nothing rather than
 *   erroring. A caller who blanks the prompt to hide it gets what they wanted;
 *   a caller whose prompt failed to load gets a lightbox that never mentions
 *   one.
 * - **The three verbs stay, disabled.** That is the contract the docs module
 *   states — a lightbox missing Remix entirely would read as a different
 *   component — and it is why the empty case is three greyed buttons rather
 *   than an empty rail.
 * - **Which leaves exactly one tab stop: the close X**, and focus lands
 *   straight on it. A dialog whose only reachable control is the one that
 *   dismisses it announces nothing about the result it is showing, because
 *   the dialog's name is the fixed `sr-only` "Result detail" in every
 *   instance. The name never says *which* result; here there is nothing else
 *   left to say it either.
 */
export const EmptyLabel: Story = {
  render: () => <AssetDetail open media={<Media />} prompt="" highlightedSpans={[{ start: 0, end: 4 }]} />,
  play: async () => {
    const popup = document.querySelector<HTMLElement>('[data-slot="asset-detail"]')!;

    // No prompt block, no heading, no spans.
    await expect(popup.querySelector('[data-slot="asset-detail-prompt"]')).toBeNull();
    await expect(popup.querySelectorAll('[data-slot="asset-detail-span"]')).toHaveLength(0);
    await expect(Array.from(popup.querySelectorAll("h3")).map((h) => h.textContent)).toEqual([]);

    // The set of three survives, inert.
    const verbs = within(popup).getByRole("group", { name: "Result actions" });
    for (const name of ["Copy prompt", "Remix", "Edit"]) {
      await expect(within(verbs).getByRole("button", { name })).toBeDisabled();
    }

    // One stop, and it is the way out.
    const stops = Array.from(popup.querySelectorAll("button")).filter((b) => !b.disabled);
    await expect(stops.map((s) => s.getAttribute("aria-label") ?? s.textContent?.trim())).toEqual(["Close"]);
    await waitFor(() => expect(document.activeElement).toBe(stops[0]));

    // The name it is left with is the same one every other instance has.
    await expect(within(document.body).getByRole("dialog")).toHaveAccessibleName("Result detail");
  },
};

const LONG_PROMPT =
  "A weathered red touring bicycle propped against a sunlit ochre wall in late afternoon, shot on 35mm film with visible grain";
const LONG_PHRASE = "propped against a sunlit ochre wall in late afternoon";

/**
 * A 123-character prompt with a 53-character phrase marked inside it, and a
 * negative prompt long enough to be the kind of thing a real settings panel
 * emits. Both are author-supplied, and the rail is the narrow column.
 *
 * The prose wraps rather than truncating or scrolling — three lines here,
 * nothing clipped, no horizontal overflow — which is the right decision for a
 * sentence you are being asked to read and reuse. A10 does the same with the
 * value: the negative prompt takes three lines of the `1fr` column and the
 * label column holds its width.
 *
 * **The finding is what a long *phrase* does to the sentence around it.** A
 * selectable span is a `<button>`, which is `inline-block`, and an
 * inline-block cannot break across line boxes. Measured here: the 53-character
 * phrase shrink-to-fits to 338px in a 339px rail and takes a whole line of its
 * own, so the prompt renders as a line of prose, a block, then a line of
 * prose. Past roughly this length the highlight stops reading as a highlighted
 * phrase and starts reading as a quoted excerpt, and a phrase longer than the
 * rail wraps *inside* its own box — measured at three lines for a
 * 111-character span — which is a paragraph with a button around it. Nothing
 * overflows in either case, so no gate would see it; the ceiling is editorial,
 * and the component has no opinion about it.
 */
export const LongContent: Story = {
  args: {
    prompt: LONG_PROMPT,
    highlightedSpans: [
      {
        start: LONG_PROMPT.indexOf(LONG_PHRASE),
        end: LONG_PROMPT.indexOf(LONG_PHRASE) + LONG_PHRASE.length,
      },
    ],
    onSpanSelect: () => {},
    params: [
      { label: "Model", value: "Flux 1.1 Pro" },
      { label: "Negative prompt", value: "blurry, low contrast, oversaturated, watermark, text overlay" },
      { label: "Seed", value: "4471", copyable: true },
    ],
  },
  play: async () => {
    const popup = document.querySelector<HTMLElement>('[data-slot="asset-detail"]')!;
    const prompt = popup.querySelector<HTMLElement>('[data-slot="asset-detail-prompt"]')!;
    const span = popup.querySelector<HTMLElement>('[data-slot="asset-detail-span"]')!;
    const rail = popup.querySelector<HTMLElement>('[data-slot="asset-detail-rail"]')!;
    const negative = popup.querySelectorAll<HTMLElement>('[data-slot="stat-readout-value"]')[1];
    const lines = (el: HTMLElement) =>
      Math.round(el.scrollHeight / parseFloat(getComputedStyle(el).lineHeight));

    // Wrapped, not clipped, in the prose and in A10's value column alike.
    await expect(`prompt lines=${lines(prompt)} clipped=${prompt.scrollWidth > prompt.clientWidth}`).toBe(
      "prompt lines=3 clipped=false",
    );
    await expect(
      `negative lines=${lines(negative)} clipped=${negative.scrollWidth > negative.clientWidth}`,
    ).toBe("negative lines=3 clipped=false");
    await expect(prompt).toHaveTextContent(LONG_PROMPT);

    // The phrase takes a line of its own: it starts below the text before it
    // rather than continuing that line, because an inline-block cannot break.
    const lead = document.createRange();
    lead.selectNode(prompt.firstChild!);
    await expect(
      `phrase starts a new line: ${span.getBoundingClientRect().top > lead.getBoundingClientRect().top}`,
    ).toBe("phrase starts a new line: true");
    await expect(`phrase display=${getComputedStyle(span).display}`).toBe("phrase display=inline-block");

    // …and nothing scrolls sideways to make room for it.
    await expect(`rail overflows=${rail.scrollWidth > rail.clientWidth}`).toBe("rail overflows=false");
    await expect(`popup overflows=${popup.scrollWidth > popup.clientWidth}`).toBe("popup overflows=false");
  },
};

/**
 * Narrows the popup itself, because there is no prop to narrow it through.
 * The marker rides in the `media` slot so the effect reaches this instance's
 * dialog rather than whichever one is first in `document.body` — the docs page
 * renders every story on it at once.
 */
function NarrowDialog({ children }: { children: React.ReactNode }) {
  const marker = React.useRef<HTMLSpanElement>(null);
  React.useLayoutEffect(() => {
    const popup = marker.current?.closest<HTMLElement>('[data-slot="asset-detail"]');
    if (!popup) return;
    popup.style.width = "375px";
    popup.style.maxWidth = "375px";
  });
  return (
    <>
      <span ref={marker} hidden />
      {children}
    </>
  );
}

/**
 * 375px — and the mechanism is the story's first fact, because the usual one
 * does not work twice over. The popup is portaled out of the canvas *and*
 * `position: fixed`, so story-conventions.md fact 2's wrapper is not an
 * ancestor and would not constrain it if it were; and unlike `task-tray` and
 * `shortcuts-sheet`, which narrow themselves through a forwarded `className`,
 * `AssetDetail` accepts no class at all. Its width is `sm:max-w-4xl` and
 * `max-w-[calc(100%-2rem)]`, full stop. So the 375px arrives as an inline
 * width set on the popup element — the same sanctioned test condition, put
 * where a wrapper cannot reach — and the gap it exposes is real: **a consumer
 * cannot make this lightbox narrower or wider than the registry decided.**
 *
 * What that renders is the *squeezed desktop* case rather than the phone case,
 * and the difference is worth being precise about. The gate's chromium is
 * 1200×900, so `md:` still matches inside a 375px box: the two-column grid
 * stays, at 196px of media against a 131px rail. A real 375px viewport gets
 * the single-column stack instead. The claim this story keeps true is
 * therefore the stronger one — the two-column layout at a third of its
 * intended width still does not scroll sideways, and neither does the document
 * behind it.
 *
 * What gives instead is the verb row: `flex-wrap` puts Copy prompt, Remix and
 * Edit on three separate lines in a 131px rail, so the set of three costs
 * 100px of vertical space in the state where there is least of it. The prompt
 * and A10's grid absorb the width by wrapping; the verbs are the only thing in
 * the rail that changes shape.
 */
export const Mobile: Story = {
  args: {
    highlightedSpans: [spanFor("a sunlit wall")],
    onSpanSelect: () => {},
  },
  render: (args) => (
    <AssetDetail
      {...args}
      media={
        <NarrowDialog>
          <Media />
        </NarrowDialog>
      }
    />
  ),
  play: async () => {
    const popup = document.querySelector<HTMLElement>('[data-slot="asset-detail"]')!;
    const media = popup.querySelector<HTMLElement>('[data-slot="asset-detail-media"]')!;
    const rail = popup.querySelector<HTMLElement>('[data-slot="asset-detail-rail"]')!;
    const grid = media.parentElement!;

    await expect(`popup width=${Math.round(popup.getBoundingClientRect().width)}`).toBe("popup width=375");

    // Nothing scrolls sideways: not the popup, not the rail, not the page.
    await expect(`popup overflows=${popup.scrollWidth > popup.clientWidth}`).toBe("popup overflows=false");
    await expect(`rail overflows=${rail.scrollWidth > rail.clientWidth}`).toBe("rail overflows=false");
    await expect(
      `document overflows=${document.documentElement.scrollWidth > document.documentElement.clientWidth}`,
    ).toBe("document overflows=false");

    // Still two columns, which is what makes this the squeezed-desktop claim.
    await expect(getComputedStyle(grid).gridTemplateColumns.split(" ")).toHaveLength(2);

    // The verbs are what reflow: three rows, not one.
    const verbs = Array.from(popup.querySelectorAll<HTMLElement>('[data-slot="asset-detail-verbs"] button'));
    const rows = new Set(verbs.map((v) => Math.round(v.getBoundingClientRect().top)));
    await expect(`verb rows=${rows.size}`).toBe("verb rows=3");
  },
};

/**
 * F3 beside F1 `result-card` — the same result, before and after it is opened
 * — with the twins it is genuinely confusable with described rather than
 * rendered, for a mechanical reason given at the end.
 *
 * The pair on screen is the easy half of the rule, and it is about **what the
 * surface is for**:
 *
 * - **Result card** is the result *in a collection*. It carries state (idle,
 *   streaming, done, failed, locked), a badge and hover actions, because its
 *   job is to be one of forty and still tell you which one it is.
 * - **Asset detail** is the result *on its own*, and nothing in it is about
 *   looking at the picture. The rail exists so the thing can be done again:
 *   the prompt as editable material, the seed and sampler that make it
 *   reproducible, and three verbs that hand it to another tool.
 *
 * The harder half is the two dialogs that look like this one:
 *
 * - **J6 `template-detail`** is the same primitive, the same "more like this"
 *   footer and the same two-column shape, pointed the other way in time. It
 *   opens a *template* to configure before running it — option selects, an
 *   author to follow, a "use this" commit. F3 opens a *result* to reuse after
 *   running it. If the modal's controls change what will be generated, it is
 *   J6; if they hand what was already generated somewhere else, it is F3.
 * - **P2 `detail-view-shell`** knows nothing about what it holds: slots the
 *   host fills, tabs named by whatever is passed, an opening mode the user
 *   picks. Content-specific vocabulary — prompt, seed, sampler, Remix — is the
 *   sign you want a content-specific component. P2's own `Boundary` story says
 *   the same thing from the other side.
 * - **F4 `action-stack`** is the pitfall the docs module already carries: F3's
 *   three verbs are fixed and always all three, so a result that needs a
 *   different action set needs F4, not a fourth button here.
 *
 * **Why only F1 is live.** This dialog is a portaled modal — it lands on top
 * of whatever shares the canvas rather than beside it, and Base UI marks
 * everything outside the popup `aria-hidden` while it is open. J6 and P2's
 * popup mode are modal too, so a second one would either be hidden by this one
 * or hide it, and either way every control inside the hidden half becomes a
 * focusable element in an `aria-hidden` subtree: an `aria-hidden-focus`
 * violation manufactured by the story rather than by either component. That is
 * `shortcuts-sheet`'s reasoning applied to a second dialog family. F1 renders
 * because a `result-card` with no `onSelect`, no `onRetry` and no `actions`
 * holds nothing focusable, so it can sit in the hidden canvas honestly.
 */
export const Boundary: Story = {
  args: {
    highlightedSpans: [spanFor("a sunlit wall"), spanFor("35mm film")],
    onSpanSelect: () => {},
    moreLikeThis: (
      <div className="grid grid-cols-3 gap-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="bg-foreground/10 aspect-square rounded" />
        ))}
      </div>
    ),
  },
  render: (args) => (
    <div className="flex w-full max-w-xs flex-col gap-2">
      <p className="text-foreground text-xs font-medium">
        F1 result card — the result in the grid, one of forty
      </p>
      <ResultCard state="done" aspect="video" label="A red bicycle leaning on a sunlit wall" badge="Image">
        <Media />
      </ResultCard>
      <AssetDetail {...args} />
    </div>
  ),
};
