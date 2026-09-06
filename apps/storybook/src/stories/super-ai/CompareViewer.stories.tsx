import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";

import { expect, userEvent, waitFor, within } from "storybook/test";

import { Button } from "@/components/ui/button";
import { CompareViewer, type CompareMode, type ComparePane } from "@/registry/super-ai/compare-viewer";
import { DiffReview, type DiffParagraph } from "@/registry/super-ai/diff-review";
import { CompareViewerDocs } from "@/content/components/compare-viewer.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

function Pane({ tone, caption }: { tone: string; caption: string }) {
  return (
    <div className={`flex h-56 w-full items-end p-3 ${tone}`}>
      <span className="bg-background text-foreground rounded px-2 py-1 text-xs">{caption}</span>
    </div>
  );
}

const PANES: ComparePane[] = [
  { id: "a", label: "Original", content: <Pane tone="bg-foreground/10" caption="1080p source" /> },
  {
    id: "b",
    label: "Upscaled 4x",
    content: <Pane tone="bg-foreground/25" caption="4K, Topaz v4" />,
  },
];

/** A third render: side mode numbers it, single mode can reach it, wipe cannot draw it. */
const THREE_PANES: ComparePane[] = [
  ...PANES,
  { id: "c", label: "Upscaled 2x", content: <Pane tone="bg-foreground/40" caption="2K, Proteus" /> },
];

const meta: Meta<typeof CompareViewer> = {
  title: "Super AI/Compare Viewer",
  component: CompareViewer,
  parameters: { layout: "centered", docs: { page: componentDocsPage(CompareViewerDocs) } },
  decorators: [
    (Story) => (
      <div className="w-[40rem] max-w-full">
        <Story />
      </div>
    ),
  ],
  args: {
    panes: PANES,
    onModeChange: () => {},
    syncKey: "upscale-run-4",
  },
};

export default meta;
type Story = StoryObj<typeof CompareViewer>;

/** The only mode with room for both captions — so the only one that shows them. */
export const Side: Story = {
  args: { mode: "side" },
};

/** One pane at a time. The label is gone; the number and the switcher remain. */
export const Single: Story = {
  args: { mode: "single", activePaneId: "b", onActivePaneChange: () => {} },
};

/** A wipe is a mode, not a separate before/after component. */
export const Wipe: Story = {
  args: { mode: "wipe", wipePosition: 45, onWipePositionChange: () => {} },
};

/* -------------------------------------------------------------------------
 * Case stories — the situations this viewer meets in a product, as opposed
 * to the three modes above. See docs/design-system/story-conventions.md.
 *
 * Seven of the eight are written. One is not:
 *
 * // case-skip: ReducedMotion — nothing in this component moves; the one thing that does belongs to a vendored primitive
 * `compare-viewer.tsx` carries no `animate-*` class and no transform. Its
 * only transition is `transition-[color,box-shadow]` on the wipe thumb,
 * which crossfades a border colour and a ring and moves nothing — the
 * `reset-affordance` case the convention records as not worth a story. The
 * two things that genuinely change position are direct manipulation rather
 * than animation: the resizable split is set straight onto the panels by
 * `react-resizable-panels` with no transition, and the wipe seam is a
 * `clipPath` recomputed per render. What is left is `toggleVariants`' base
 * `transition-all` on the three mode buttons, which is the same primitive-wide
 * press-and-ring chrome `CONTINUE.md` §8 records for the vendored `Button`
 * and is not this component's branch to add. `vitest.config.ts` already
 * emulates reduce for every test, so a story here would render identically
 * to `Side` and imply a branch that does not exist.
 * ---------------------------------------------------------------------- */

/**
 * A focus ring that is actually painted, settled.
 *
 * The house check — `boxShadow !== "none" || outlineStyle !== "none"` — is
 * satisfied by a shadow that paints nothing, and this component is where that
 * became impossible to miss. `toggleVariants` (like the vendored `Button`)
 * carries `transition-all` at 0.15s, so for the first 150ms after focus moves
 * the ring slot reads back `oklab(0 0 0 / 0) 0px 0px 0px 0px` — a transparent,
 * zero-size placeholder that is not the string `"none"`. Read immediately, the
 * house check passes on the *start frame of the transition* rather than on a
 * ring. Settled, the same element reads `oklab(0.708 0 0 / 0.5) 0px 0px 0px
 * 3px`.
 *
 * So this waits for a layer with both a non-transparent colour and a non-zero
 * length, and returns it. Extends the weakness recorded in `CONTINUE.md` §8
 * by the E/P wave (`sr-only` outlines, zero-size shadows) with the reason
 * those false positives are the *default* reading rather than an edge case.
 */
function paintedRingLayer(el: HTMLElement): string | null {
  const shadow = getComputedStyle(el).boxShadow;
  if (shadow === "none") return null;
  for (const layer of shadow.split(/,(?![^(]*\))/)) {
    const transparent = /\/\s*0\s*\)/.test(layer) || /rgba?\([^)]*,\s*0\s*\)/.test(layer);
    const lengths = (layer.match(/-?\d*\.?\d+px/g) ?? []).map(Number.parseFloat);
    if (!transparent && lengths.some((n) => n !== 0)) return layer.trim();
  }
  return null;
}

async function expectSettledRing(el: HTMLElement, label: string) {
  await expect(`${label} focusVisible=${el.matches(":focus-visible")}`).toBe(`${label} focusVisible=true`);
  await waitFor(() => {
    if (!paintedRingLayer(el)) {
      throw new Error(`${label} never painted a ring: ${getComputedStyle(el).boxShadow}`);
    }
  });
}

/**
 * Settle on departure, not on arrival — the form `ai-tools-menu` arrived at
 * after a key press read before it applied left focus on the previous stop
 * and the lap appeared to end early (`story-conventions.md`, fact 4). The
 * mode switch is a Base UI composite, so the same hazard applies outside a
 * portal: wait for focus to leave where it was, then read where it went.
 */
async function focusLeft(previous: Element | null) {
  await waitFor(() => {
    if (document.activeElement === previous) {
      throw new Error(`focus never left ${previous?.textContent?.trim() ?? "the previous stop"}`);
    }
  });
  return document.activeElement as HTMLElement;
}

/**
 * Right-to-left, in the two modes that have a direction: a side-by-side pair
 * and a wipe. Three of the four things that should mirror do not, and the one
 * that does is the surprise.
 *
 * **Mirrors correctly.** The pane order: `ResizablePanelGroup` is a flex row,
 * so pane 1 paints on the right and pane 2 on its left. And the splitter's
 * semantics follow the pixels — `aria-controls` points at the pane on the
 * *left* (the DOM-second one under RTL, pane 1 in LTR) and `aria-valuenow`
 * reports that pane's share, so a screen-reader user is told about the pane
 * the divider is visually growing. Both are asserted below.
 *
 * **Does not mirror, and each is recorded rather than pinned:**
 *
 * 1. *The mode switch travels the wrong way.* ArrowRight on "Side by side"
 *    — the rightmost item under RTL — moves focus to "Single", which paints
 *    to its left. Base UI's composite reads `useDirection()`, no
 *    `DirectionProvider` is mounted anywhere in this repo, and `dir` on a
 *    wrapper is invisible to React context. Measured here, same root cause
 *    `mode-tabs` and `account-menu` recorded in `CONTINUE.md` §8. The two
 *    keyboard controls in side view therefore disagree about RTL: the
 *    splitter mirrors, the toggle group does not.
 *
 * 2. *`toggle-group`'s seam classes are physical, and this component uses
 *    `spacing={0}`, which is the mode that turns them on.* Measured under
 *    `dir="rtl"`: the leftmost item ("Wipe") has `border-left-width: 0` — the
 *    group's outer left edge loses its border entirely — while "Side by
 *    side" and "Single" stack 1px each at their shared seam; and the two
 *    10px radii land on the inner corners (Side's top-left, Wipe's
 *    top-right) instead of the group's ends. In LTR the same three items
 *    measure flush. This is `components/ui/button-group.tsx`'s wave-2 finding
 *    in its sibling `components/ui/toggle-group.tsx` — one vendored fix, and
 *    the seam classes are gated on `data-spacing=0`, so the consumers it
 *    reaches are this component and `asset-library`; the four other registry
 *    toggle groups keep the default gap and never engage them.
 *
 * 3. *The wipe handle detaches from the seam it drags.* Base UI positions the
 *    thumb with `inset-inline-start`, which mirrors; the clip is
 *    `clipPath: inset(0 0 0 <position>%)`, whose fourth value is physically
 *    `left` and does not. At `wipePosition={25}` in a 640px frame the seam
 *    sits 160px from the left and the handle sits at 465px — opposite sides
 *    of the picture, and pressing ArrowRight then moves them apart rather
 *    than together (the slider requests 26, which walks the handle further
 *    left and the seam further right). `inset()` has no logical form, so this
 *    is a direction-aware value in JS rather than a class swap: recorded, not
 *    fixed here, and nothing below asserts it.
 *
 * **Why the pane badges were left physical.** `top-2 left-2` and `top-2
 * right-2` on the wipe numbers are exactly the byte-identical `start-`/`end-`
 * swap the sweep in §8 sanctions, and they are deliberately not swept: the
 * badges pair with the content today *because* both they and the clip are
 * physical, so under RTL number 2 still sits over pane 2's visible half.
 * Swapping the badges alone — the only half a class change can reach — would
 * put each number over the other pane's picture. The three modes share one
 * badge, so the side and single copies stayed physical with them rather than
 * leaving the file half-logical.
 */
export const RTL: Story = {
  render: (args) => (
    <div dir="rtl" className="flex flex-col gap-6">
      <CompareViewer {...args} mode="side" />
      <CompareViewer {...args} mode="wipe" wipePosition={25} onWipePositionChange={() => {}} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const [sideRoot] = Array.from(
      canvasElement.querySelectorAll<HTMLElement>('[data-slot="compare-viewer"]'),
    );
    const panes = Array.from(sideRoot.querySelectorAll<HTMLElement>('[data-slot="compare-viewer-pane"]'));

    // 1. The panes mirror: pane 1 paints to the right of pane 2.
    await expect(panes).toHaveLength(2);
    await expect(panes[0].getBoundingClientRect().left).toBeGreaterThan(
      panes[1].getBoundingClientRect().left,
    );

    // 2. …and the splitter's semantics mirror with them. `aria-controls`
    //    names the pane on the left, and `aria-valuenow` is that pane's share
    //    of the group — so the announced number describes what the eye sees,
    //    which is the half `toggle-group` above gets wrong.
    const separator = sideRoot.querySelector<HTMLElement>('[role="separator"]')!;
    const controlled = document.getElementById(separator.getAttribute("aria-controls")!);
    await expect(controlled).toBe(panes[1]);

    const group = sideRoot.querySelector<HTMLElement>('[data-slot="compare-viewer-panes"]')!;
    const share = (controlled!.getBoundingClientRect().width / group.getBoundingClientRect().width) * 100;
    await expect(Math.abs(share - Number(separator.getAttribute("aria-valuenow")))).toBeLessThan(2);
  },
};

/**
 * Side mode with three panes, which is where the keyboard model is at its
 * most surprising: **the number of tab stops grows with the number of
 * panes.** One stop for the whole mode switch — it is a Base UI composite, so
 * exactly one of the three buttons is tabbable and Left/Right travel between
 * them — and then one stop per divider. Two panes give two stops, three give
 * three, and a comparison of six renders would put five nameless dividers
 * between the mode switch and whatever follows the component.
 *
 * The divider is the part worth proving, because it is a control rather than
 * decoration: `role="separator"` with `aria-valuemin`/`max`/`now`, arrow keys
 * that move it 5% per press, and Home to collapse. That contract is
 * `react-resizable-panels`', not this component's, which is exactly why it is
 * asserted here — nothing else in the repo records it, and the docs page
 * claims it.
 *
 * **Two gaps, recorded, neither asserted.** The divider has no accessible
 * name: `ResizableHandle` renders no `aria-label` and there is no in-repo
 * idiom for naming one, so with three panes a screen-reader user meets two
 * stops that both announce as "separator" and a percentage, with nothing to
 * say which pair of panes each divides. And single mode without
 * `onActivePaneChange` has no keyboard route to another pane at all —
 * measured, the walk is one stop and then out of the component — which is the
 * component's own documented "don't", here as a fact rather than advice.
 */
export const KeyboardOrder: Story = {
  args: { mode: "side", panes: THREE_PANES },
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="compare-viewer"]')!;
    const modes = Array.from(root.querySelectorAll<HTMLElement>('[data-slot^="compare-viewer-mode-"]'));
    const separators = Array.from(root.querySelectorAll<HTMLElement>('[role="separator"]'));
    await expect(modes).toHaveLength(3);
    await expect(separators).toHaveLength(2);

    // 1. The mode switch is one tab stop, not three.
    await expect(modes.filter((el) => el.tabIndex === 0)).toHaveLength(1);

    const bodyBefore = document.activeElement;
    await userEvent.tab();
    await expect(await focusLeft(bodyBefore)).toBe(modes[0]);
    await expectSettledRing(modes[0], "mode#0");

    // 2. Arrow travel: one item per press, no repeats, and it wraps at both
    //    ends — so the lap is provable rather than counted in an allowance.
    const seen = new Set<HTMLElement>([modes[0]]);
    for (let i = 1; i < modes.length; i += 1) {
      const previous = document.activeElement;
      await userEvent.keyboard("{ArrowRight}");
      const focused = await focusLeft(previous);
      const name = focused.textContent?.trim() ?? "";
      await expect(`${name} repeat=${seen.has(focused)}`).toBe(`${name} repeat=false`);
      await expectSettledRing(focused, `mode ${name}`);
      seen.add(focused);
    }
    await userEvent.keyboard("{ArrowRight}");
    await expect(await focusLeft(modes[2])).toBe(modes[0]);
    await userEvent.keyboard("{ArrowLeft}");
    await expect(await focusLeft(modes[0])).toBe(modes[2]);

    // 3. Arrows move focus only. Nothing is pressed until Enter or Space, so
    //    a keyboard user can read the three modes without switching mode.
    await expect(modes.map((m) => m.getAttribute("aria-pressed"))).toEqual(["true", "false", "false"]);

    // 4. Then one stop per divider, each with a ring of its own.
    for (const [i, separator] of separators.entries()) {
      const previous = document.activeElement;
      await userEvent.tab();
      await expect(await focusLeft(previous)).toBe(separator);
      await expectSettledRing(separator, `separator#${i}`);
    }

    // 5. The divider's own contract, on the first of the two.
    const separator = separators[0];
    const valueNow = () => Number(separator.getAttribute("aria-valuenow"));
    const settledAt = async (expected: number) => {
      await waitFor(() => {
        if (Math.abs(valueNow() - expected) > 1e-6) {
          throw new Error(`aria-valuenow settled at ${valueNow()}, expected ${expected}`);
        }
      });
    };
    separator.focus();
    const start = valueNow();
    await userEvent.keyboard("{ArrowRight}");
    await settledAt(start + 5);
    await userEvent.keyboard("{ArrowLeft}");
    await settledAt(start);

    // Home collapses the pane it controls; ten presses back is 50%, which is
    // the same 5% step asserted across the whole range rather than once.
    await userEvent.keyboard("{Home}");
    await settledAt(0);
    for (let i = 0; i < 10; i += 1) await userEvent.keyboard("{ArrowRight}");
    await settledAt(50);

    // 6. One more Tab leaves the component: three stops, no more.
    separators[1].focus();
    await userEvent.tab();
    await expect(root.contains(document.activeElement)).toBe(false);
  },
};

/**
 * All three of this component's moving parts — the mode, the visible pane and
 * the wipe position — are controlled, and it holds *nothing*: there is no
 * `useState` in the file. That is unusual enough to be worth proving, and it
 * has a consequence a host meets on its first day. Measured: with
 * `onModeChange` omitted, clicking "Wipe" leaves `data-mode="side"` and
 * `aria-pressed` untouched, so a viewer wired up without handlers is not
 * partly controlled, it is inert. The shell below holds the state the hard
 * way — recording what the viewer asked for and applying it only when told —
 * which is the same fact with the host present.
 *
 * What it proves, in order: a click does not move the rendered mode; the
 * callback still fires with the payload a host needs; a re-render with
 * unchanged props holds the viewer fixed; applying the request moves it; and
 * the wipe slider behaves the same way — ArrowRight asks for 41 and the seam
 * stays at 40 until the host agrees.
 *
 * Then the spec's first rule, which is an accessibility claim in disguise:
 * **"panes are numbered as well as labelled; in wipe or single view the label
 * disappears, the number persists."** Driving all three modes over the same
 * three panes shows it holds — and shows its one exception. Side numbers 1,
 * 2, 3. Single drops every pane but one, and the numbers become the switcher,
 * so all three are still on screen and pane 3 is still reachable. Wipe draws
 * the first two panes and nothing else: **pane 3 has no number, no label and
 * no representation of any kind.** The docs page records that wipe uses
 * exactly two panes; what the numbering rule adds is that the identity a
 * reader was told to rely on is the thing that disappears, so a three-way
 * comparison cannot be discussed in wipe view at all.
 *
 * `syncKey` is asserted here too, as an attribute and nothing more: it is
 * rendered as `data-sync-key` for whatever owns the media to read. The spec's
 * "zoom, pan and playhead are synchronised" is not implemented in this
 * component and cannot be — it never sees the media — so the guarantee is the
 * host's, and this is the only place that gap is visible next to the props it
 * sits beside.
 */
export const Controlled: Story = {
  render: () => <ControlledShell />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const root = () => canvasElement.querySelector<HTMLElement>('[data-slot="compare-viewer"]')!;
    const paneNumbers = (scope: string) =>
      Array.from(
        root().querySelectorAll<HTMLElement>(`${scope} [data-slot="compare-viewer-pane-number"]`),
      ).map((n) => n.textContent);

    await expect(root()).toHaveAttribute("data-mode", "side");
    await expect(root()).toHaveAttribute("data-sync-key", "upscale-run-4");

    // 1. Side: three panes, numbered in the order they were given.
    await expect(paneNumbers('[data-slot="compare-viewer-panes"]')).toEqual(["1", "2", "3"]);

    // 2. Interaction alone does not move the rendered mode. The callback is
    //    waited on first, so "it did not move" is a claim about a click that
    //    has provably landed rather than one that has not happened yet.
    await userEvent.click(canvas.getByRole("button", { name: "Single" }));
    await waitFor(() => expect(canvas.getByTestId("requested")).toHaveTextContent("single"));
    await expect(root()).toHaveAttribute("data-mode", "side");

    // 3. A re-render with the same props still does not move it.
    await expect(canvas.getByTestId("render-pass")).toHaveTextContent("1");
    await userEvent.click(canvas.getByRole("button", { name: "Re-render" }));
    await expect(canvas.getByTestId("render-pass")).toHaveTextContent("2");
    await expect(root()).toHaveAttribute("data-mode", "side");

    // 4. Applying it moves the viewer. Single draws one pane, and the three
    //    numbers survive as the switcher — including pane 3's.
    await userEvent.click(canvas.getByRole("button", { name: "Apply" }));
    await waitFor(() => expect(root()).toHaveAttribute("data-mode", "single"));
    await expect(root().querySelectorAll('[data-slot="compare-viewer-pane"]')).toHaveLength(1);
    await expect(paneNumbers('[data-slot="compare-viewer-pane-switcher"]')).toEqual(["1", "2", "3"]);
    canvas.getByRole("button", { name: "Show pane 3: Upscaled 2x" });

    // 5. Wipe: two panes, two numbers. Pane 3 is not drawn, not numbered and
    //    not named anywhere — the one hole in "the number persists".
    await userEvent.click(canvas.getByRole("button", { name: "Wipe" }));
    await waitFor(() => expect(canvas.getByTestId("requested")).toHaveTextContent("wipe"));
    await userEvent.click(canvas.getByRole("button", { name: "Apply" }));
    await waitFor(() => expect(root()).toHaveAttribute("data-mode", "wipe"));
    await expect(paneNumbers('[data-slot="compare-viewer-panes"]')).toEqual(["1", "2"]);
    await expect(within(root()).queryByText("Upscaled 2x")).toBeNull();

    // 6. The wipe handle is controlled the same way: it asks, it does not act.
    const slider = canvas.getByRole("slider", { name: "Wipe position" });
    slider.focus();
    await userEvent.keyboard("{ArrowRight}");
    await waitFor(() => expect(canvas.getByTestId("wipe-requested")).toHaveTextContent("41"));
    await expect(slider).toHaveAttribute("aria-valuenow", "40");
    await expect(
      getComputedStyle(root().querySelectorAll<HTMLElement>('[data-slot="compare-viewer-pane"]')[1]).clipPath,
    ).toBe("inset(0px 0px 0px 40%)");
  },
};

function ControlledShell() {
  const [mode, setMode] = React.useState<CompareMode>("side");
  const [requested, setRequested] = React.useState<CompareMode | null>(null);
  const [wipeRequested, setWipeRequested] = React.useState<number | null>(null);
  const [pass, setPass] = React.useState(1);

  return (
    <div className="flex flex-col gap-4">
      <CompareViewer
        panes={THREE_PANES}
        syncKey="upscale-run-4"
        mode={mode}
        onModeChange={setRequested}
        activePaneId="c"
        onActivePaneChange={() => {}}
        wipePosition={40}
        onWipePositionChange={setWipeRequested}
      />

      <div className="flex flex-wrap items-end justify-between gap-4">
        <dl className="text-foreground grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs">
          <dt>mode prop</dt>
          <dd data-testid="applied">{mode}</dd>
          <dt>last onModeChange</dt>
          <dd data-testid="requested">{requested ?? "—"}</dd>
          <dt>last onWipePositionChange</dt>
          <dd data-testid="wipe-requested" className="tabular-nums">
            {wipeRequested === null ? "—" : wipeRequested}
          </dd>
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
            onClick={() => requested !== null && setMode(requested)}
          >
            Apply
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Both panes labelled `""`, which is the state a caller reaches by rendering
 * a filename that has not arrived yet — and the state the numbering rule was
 * written for. It holds: the number is the pane's identity, so the two panes
 * stay tellable apart with no captions at all, and the switcher's two buttons
 * still resolve to two *different* accessible names because the number is in
 * the name rather than only in the badge. That is the assertion below, and it
 * is the whole argument for `aria-label={`Show pane ${i + 1}: ${label}`}`
 * over a label-only name, which would collapse both buttons to "Show pane".
 *
 * Two cosmetic defects, recorded and not asserted, because both would be
 * pinned by an assertion that expects them:
 *
 * - The side-mode caption is not guarded. An empty label still renders its
 *   chip — measured 18×6px with a 1px border and an opaque background —
 *   so a pane with no caption gets a small blank pill sitting over its
 *   picture instead of nothing.
 * - The accessible name keeps its separator: "Show pane 1: " with a trailing
 *   colon and nothing after it. Harmless to a sighted user, read aloud to
 *   everyone else, and the same empty-string class as `context-chips`' bare
 *   "Remove" and `property-inspector`'s duplicate "Reset" names in
 *   `CONTINUE.md` §8.
 */
export const EmptyLabel: Story = {
  args: {
    mode: "single",
    activePaneId: "b",
    onActivePaneChange: () => {},
    panes: [
      { id: "a", label: "", content: <Pane tone="bg-foreground/10" caption="1080p source" /> },
      { id: "b", label: "", content: <Pane tone="bg-foreground/25" caption="4K, Topaz v4" /> },
    ],
  },
  play: async ({ canvasElement }) => {
    const switcher = canvasElement.querySelector<HTMLElement>('[data-slot="compare-viewer-pane-switcher"]')!;
    const buttons = Array.from(switcher.querySelectorAll<HTMLElement>("button"));
    await expect(buttons).toHaveLength(2);

    // Two panes, no captions, and still two distinct accessible names — the
    // number is what survives, in the tree as well as on screen.
    const names = buttons.map((b) => b.getAttribute("aria-label"));
    await expect(new Set(names).size).toBe(2);
    for (const name of names) await expect(name).toMatch(/^Show pane [12]:/);

    // The visible identity survives too: the drawn pane keeps its number.
    const badge = canvasElement.querySelector<HTMLElement>(
      '[data-slot="compare-viewer-pane"] [data-slot="compare-viewer-pane-number"]',
    );
    await expect(badge).toHaveTextContent("2");
  },
};

/**
 * Two captions of about ninety characters, in the mode that draws them and
 * the mode that does not.
 *
 * In side view the chip **wraps and never truncates**: `whitespace` is
 * `normal`, there is no `text-overflow` and no `max-w`, so the caption grows
 * downward inside its pane — measured two lines at 640px and four at 375px,
 * covering the top of the picture it is captioning. That is a deliberate
 * trade the other direction from B4's `whitespace-nowrap` traps: nothing
 * spills out of the pane and nothing is silently cut, at the cost of the
 * caption eating the render. There is no `title`, but there is no need for
 * one, because nothing is elided.
 *
 * In single view the caption is not drawn at all — the chip is side-mode
 * only — and the entire ninety characters land in the switcher button's
 * accessible name, uncapped: "Show pane 2: Upscaled to 4K with Topaz Video AI
 * v4 using the Proteus model at 200 percent". So the long label survives in
 * exactly one place, and it is the one a sighted user cannot read. Both
 * halves are asserted below.
 */
export const LongContent: Story = {
  render: (args) => {
    const long: ComparePane[] = [
      {
        id: "a",
        label: "Original 1080p ProRes master straight off the camera card, ungraded",
        content: <Pane tone="bg-foreground/10" caption="1080p source" />,
      },
      {
        id: "b",
        label: "Upscaled to 4K with Topaz Video AI v4 using the Proteus model at 200 percent",
        content: <Pane tone="bg-foreground/25" caption="4K, Topaz v4" />,
      },
    ];
    return (
      <div className="flex flex-col gap-6">
        <CompareViewer {...args} mode="side" panes={long} />
        <CompareViewer {...args} mode="single" activePaneId="b" onActivePaneChange={() => {}} panes={long} />
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const [sideRoot, singleRoot] = Array.from(
      canvasElement.querySelectorAll<HTMLElement>('[data-slot="compare-viewer"]'),
    );

    // 1. Side: wraps, does not truncate, and stays inside its own pane.
    const chips = Array.from(
      sideRoot.querySelectorAll<HTMLElement>('[data-slot="compare-viewer-pane-label"]'),
    );
    await expect(chips).toHaveLength(2);
    const panes = Array.from(sideRoot.querySelectorAll<HTMLElement>('[data-slot="compare-viewer-pane"]'));
    for (const [i, chip] of chips.entries()) {
      const style = getComputedStyle(chip);
      await expect(`chip#${i} whiteSpace=${style.whiteSpace}`).toBe(`chip#${i} whiteSpace=normal`);
      await expect(`chip#${i} textOverflow=${style.textOverflow}`).toBe(`chip#${i} textOverflow=clip`);
      // Two lines rather than one: taller than its own line box.
      await expect(chip.getBoundingClientRect().height).toBeGreaterThan(
        Number.parseFloat(style.lineHeight) * 1.5,
      );
      await expect(chip.getBoundingClientRect().right).toBeLessThanOrEqual(
        panes[i].getBoundingClientRect().right + 1,
      );
    }

    // 2. Single: no chip anywhere, and the whole caption in the button name.
    await expect(singleRoot.querySelectorAll('[data-slot="compare-viewer-pane-label"]')).toHaveLength(0);
    canvas.getByRole("button", {
      name: "Show pane 2: Upscaled to 4K with Topaz Video AI v4 using the Proteus model at 200 percent",
    });
  },
};

/**
 * 375px, in side mode — the mode a phone is least suited to, and the reason
 * `single` exists.
 *
 * It fits: nothing scrolls sideways, the three mode buttons take 195 of the
 * 375, and each pane gets 186px. Since the component carries no `sm:`/`md:`
 * variants at all, the wrapper is a faithful phone test rather than the
 * squeezed-desktop case the convention warns about for `preset-grid` and
 * `generation-wizard`.
 *
 * What does not survive the width is touch, and neither part is asserted
 * because both are measurements of a gap rather than of a contract:
 *
 * - **The divider is a 1px line with a 4px hit area.** `ResizableHandle` is
 *   `w-px` with an `after:w-1` overlay and `touch-action: none`, so on a
 *   phone the only way to change a 186px/186px split is a four-pixel-wide
 *   drag, and there is no tap, double-tap or long-press alternative. A
 *   keyboard has a better route to this control than a finger does.
 * - **The pane-number switcher is 20×24 per button.** Under WCAG 2.2's
 *   24×24 minimum on width; the 4px `gap-1` puts the two centres exactly
 *   24px apart, so the spacing exception is met with zero margin and a
 *   third pane would not change that. Axe's `target-size` is experimental
 *   and off, so no gate sees it. Same shape as `reset-affordance`'s 20×20
 *   row target in `CONTINUE.md` §8.
 */
export const Mobile: Story = {
  args: { mode: "side" },
  render: (args) => (
    <div className="w-[375px] max-w-full" data-testid="viewport">
      <CompareViewer {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const viewport = canvas.getByTestId("viewport");
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="compare-viewer"]')!;

    // The 375px frame, not the meta's centring wrapper.
    await expect(Math.round(viewport.getBoundingClientRect().width)).toBe(375);
    await expect(viewport.scrollWidth).toBeLessThanOrEqual(viewport.clientWidth);
    await expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth);

    // The mode switch keeps its three labels at this width — it is 195px, so
    // the `flex-wrap` on the toolbar row never has to engage with two panes.
    const modes = root.querySelector<HTMLElement>('[data-slot="compare-viewer-modes"]')!;
    await expect(modes.getBoundingClientRect().width).toBeLessThan(375);

    // Both panes are still drawn, and both captions still fit.
    const panes = Array.from(root.querySelectorAll<HTMLElement>('[data-slot="compare-viewer-pane"]'));
    await expect(panes).toHaveLength(2);
    for (const pane of panes) {
      await expect(pane.getBoundingClientRect().width).toBeGreaterThan(150);
    }
    await expect(root.querySelectorAll('[data-slot="compare-viewer-pane-label"]')).toHaveLength(2);
  },
};

const DIFF_PARAGRAPHS: DiffParagraph[] = [
  {
    id: "p1",
    segments: [
      { kind: "unchanged", text: "Exported at " },
      { kind: "deleted", text: "1080p", changeId: "c1" },
      { kind: "inserted", text: "2160p", changeId: "c1" },
      { kind: "unchanged", text: " using the Proteus model." },
    ],
  },
];

/**
 * Against K3 `diff-review`, the component a builder reaches for when the
 * question is "what changed" and the wrong one about half the time.
 *
 * The rule is whether the difference can be **enumerated**:
 *
 * - **Compare viewer** when it cannot. Two renders of the same frame differ
 *   in a way no list can hold — sharpness, artefacts, a face that survived
 *   the upscale — so the only honest answer is to put them where an eye can
 *   do the comparing, and the component's whole job is keeping track of which
 *   pane is which while it does. There is nothing to accept or reject: the
 *   output of a comparison here is a decision the user makes elsewhere.
 * - **Diff review** when it can. A rewrite arrives as a countable set of
 *   edits, each with a rationale and its own accept and reject, and showing
 *   the two versions side by side instead would make the reader re-find the
 *   changes the model already knows about.
 *
 * The catalog's third neighbour is F2 `generation-grid`, and it is not a twin:
 * a grid shows many candidates at once with no pairing between them. The
 * moment two of its tiles are worth putting against each other, that is this
 * component — which is also why `wipePosition` is a prop rather than internal
 * state, so a grid can hand a pair over and take the comparison back.
 */
export const Boundary: Story = {
  render: (args) => (
    <div className="flex w-full flex-col gap-6">
      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">
          F5 compare viewer — a difference you can only see
        </p>
        <CompareViewer {...args} mode="wipe" wipePosition={45} onWipePositionChange={() => {}} />
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">K3 diff review — a difference you can enumerate</p>
        <DiffReview
          label="Render notes"
          paragraphs={DIFF_PARAGRAPHS}
          changes={[{ id: "c1", rationale: "The upscale ran, so the stated output resolution was stale." }]}
          onAccept={() => {}}
          onReject={() => {}}
        />
      </section>
    </div>
  ),
};
