import type { Meta, StoryObj } from "@storybook/react-vite";
import { Clapperboard, Image as ImageIcon, Mic, Sparkles, Type, WandSparkles } from "lucide-react";
import * as React from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
// The one mechanism that moves the *breakpoint* rather than the box. A width
// wrapper cannot test this shell: B1's drawer swap keys on a viewport media
// query, so 375px of wrapper renders the desktop rail inside a narrow box and
// reports success. See story-conventions.md, mechanical fact 2, and `Mobile`.
import { page } from "@vitest/browser/context";

import { Button } from "@/components/ui/button";
import { HomeShell, type HomeShellProps } from "@/registry/super-ai/home-shell";
import { SidebarNav } from "@/registry/super-ai/sidebar-nav";
import { HomeShellDocs } from "@/content/components/home-shell.docs";
import { componentDocsPage } from "@/lib/component-docs-page";
import { focusTreatmentSignature, settledFocusRing } from "@/lib/focus-ring";

const NAV = (
  <SidebarNav
    activeId="home"
    sections={[
      {
        label: "Workspace",
        items: [
          { id: "home", label: "Home", icon: <Sparkles /> },
          { id: "projects", label: "Projects", icon: <Clapperboard />, count: 12 },
          { id: "assets", label: "Assets", icon: <ImageIcon /> },
        ],
      },
    ]}
  />
);

const SUGGESTIONS: HomeShellProps["suggestions"] = [
  { id: "s1", suggestion: "Draft a launch announcement", icon: <Type /> },
  { id: "s2", suggestion: "Turn the Q3 deck into a narrated video", icon: <Clapperboard /> },
  { id: "s3", suggestion: "Clean up the audio on this interview", icon: <Mic /> },
];

const FEATURES: HomeShellProps["features"] = [
  {
    id: "image",
    icon: <ImageIcon />,
    title: "Generate images",
    description: "From a prompt, a sketch or a reference frame.",
  },
  {
    id: "video",
    icon: <Clapperboard />,
    title: "Edit video",
    description: "Cut, caption and export without leaving the browser.",
  },
  {
    id: "voice",
    icon: <Mic />,
    title: "Clone a voice",
    description: "Thirty seconds of clean audio is enough.",
  },
  {
    id: "restyle",
    icon: <WandSparkles />,
    title: "Restyle a project",
    description: "Apply one look across every asset at once.",
  },
];

const RECENTS: HomeShellProps["recents"] = [
  { id: "r1", title: "Northwind brand audit", editedAgo: "Edited 19 hours ago" },
  { id: "r2", title: "Q3 launch film", durationLabel: "12:04", editedAgo: "Edited 2 days ago" },
  { id: "r3", title: "Pricing page hero", editedAgo: "Edited 4 days ago" },
  { id: "r4", title: "Onboarding voiceover", durationLabel: "03:41", editedAgo: "Edited last week" },
];

const RECOMMENDATIONS: HomeShellProps["recommendations"] = [
  {
    id: "digest",
    icon: <Sparkles />,
    title: "Turn new uploads into a Friday digest",
    description: "Watches a folder and writes the week up for you.",
    apps: ["Drive", "Slack"],
    steps: [
      "Watch the Northwind shared folder",
      "Summarise anything that lands in it",
      "Post the summary to #northwind every Friday",
    ],
    onDismiss: () => {},
    onTry: () => {},
  },
  {
    id: "subtitles",
    icon: <Clapperboard />,
    title: "Subtitle every export automatically",
    description: "Adds burned-in captions in the project's language.",
    apps: ["Projects"],
    steps: ["Detect the spoken language", "Generate captions", "Burn them into the export"],
    onDismiss: () => {},
    onTry: () => {},
  },
];

const FULL_ARGS: HomeShellProps = {
  title: "Northwind",
  headline: "Good afternoon",
  switcher: <div className="px-2 text-sm font-medium">Northwind</div>,
  nav: NAV,
  credits: { balance: 420, total: 1000, form: "ring", onManage: () => {} },
  omnibox: {
    models: [
      { value: "fast", label: "Fast" },
      { value: "quality", label: "Quality" },
    ],
    model: "fast",
    cost: 4,
  },
  suggestions: SUGGESTIONS,
  suggestionsOverflow: { href: "#", count: 12 },
  features: FEATURES,
  recents: RECENTS,
  recentsEmptyAction: <Button size="sm">New project</Button>,
  recommendations: RECOMMENDATIONS,
};

const meta: Meta<typeof HomeShell> = {
  title: "Super AI/Home Shell",
  component: HomeShell,
  // A block is a page, so it gets the whole canvas rather than a centred box.
  // The `h-svh` wrapper is what the shell's `h-full` measures against — in a
  // real app that is the document, here it is the story frame.
  parameters: { layout: "fullscreen", docs: { page: componentDocsPage(HomeShellDocs) } },
  decorators: [
    (Story) => (
      <div className="h-svh w-full">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof HomeShell>;

/** The loaded launcher: composer, starters, features, recents, inspiration — in that order. */
export const Launcher: Story = { args: FULL_ARGS };

/**
 * Day one, at its emptiest: nothing pinned, no features configured, no recents,
 * nothing recommended — four empty affordances at once, and the version most
 * new users actually see. Three of them are L1; the recents band is C4's own
 * in-grid tile, carrying the caller's verb rather than a generic one. The
 * starters stay, because a starter is product copy rather than user data, and
 * they are the only path out of an empty page. Mandatory export for the block
 * contract, and the story worth checking axe against — every empty affordance
 * in the shell is on screen at once here.
 */
export const Empty: Story = {
  args: {
    title: "Northwind",
    headline: "Let's make something",
    switcher: <div className="px-2 text-sm font-medium">Northwind</div>,
    credits: { balance: 1000, total: 1000, onManage: () => {}, onTopUp: () => {} },
    suggestions: SUGGESTIONS,
    recentsEmptyAction: <Button size="sm">New project</Button>,
  },
};

/** Day one for a configured product: the feature row is populated before anyone has made anything. */
export const FirstRun: Story = {
  args: {
    ...Empty.args,
    features: FEATURES,
  },
};

/**
 * Narrow viewport. Below the sidebar's 768px breakpoint the vendored Sidebar
 * swaps itself for a drawer, so the topbar trigger becomes the only way in and
 * every band takes the full width; C3's carousel and C2's chip row both become
 * horizontal scrollers. Mandatory export for the block contract — a shell is a
 * layout, and layout is what breaks.
 *
 * `globals.viewport.value` is the Storybook 9 API.
 * `parameters.viewport.defaultViewport` was removed in 9 and does nothing while
 * looking configured, so `options` is declared explicitly and the selection
 * cannot silently resolve to nothing.
 *
 * KNOWN LIMIT: this resizes the canvas in the Storybook UI only. The vitest
 * runner has no manager to resize an iframe, so `pnpm test:stories` renders and
 * axe-checks this story at the browser's default width. The narrow layout here
 * was verified by hand.
 */
export const Responsive: Story = {
  args: FULL_ARGS,
  parameters: {
    viewport: {
      options: {
        mobile: { name: "Mobile", styles: { width: "375px", height: "812px" }, type: "mobile" },
      },
    },
  },
  globals: { viewport: { value: "mobile" } },
};

/** Recents as a list rather than a grid — the same C4, one prop apart. */
export const RecentsAsList: Story = {
  args: { ...FULL_ARGS, recentsLayout: "list" },
};

/**
 * The composer mid-run. C1 owns the generating state, its announcement and its
 * stop control; the shell only stops emphasising anything else while it happens.
 */
export const Generating: Story = {
  args: {
    ...FULL_ARGS,
    promptValue: "Turn the Q3 deck into a narrated video",
    omnibox: { ...FULL_ARGS.omnibox, state: "generating", onStop: () => {} },
  },
};

/**
 * Out of credits. M2 goes to its `empty` state in the title bar and C1 goes to
 * `locked` — two components, each announcing the same fact in its own contract,
 * neither of them the shell's business.
 */
export const OutOfCredits: Story = {
  args: {
    ...FULL_ARGS,
    credits: { balance: 0, total: 1000, onManage: () => {} },
    omnibox: { ...FULL_ARGS.omnibox, state: "locked", onUnlock: () => {} },
  },
};

/**
 * The shell at 600px tall — shorter than any viewport, which is the ordinary
 * embedded case and the one that used to hide the sidebar's bottom slots.
 *
 * The assertion is geometric rather than a class check: the footer's box has
 * to sit inside the shell's box. A class assertion would pass against a
 * constant that had been deleted from the cn() call and left declared.
 *
 * The frame is queried by `data-testid`, not `canvasElement.firstElementChild`:
 * the meta decorator already wraps every story in its own `h-svh` div, so the
 * first child of the canvas is that wrapper, not this story's own frame.
 *
 * It is a desktop-width claim, and only there is there anything to claim. Below
 * 768px the vendored Sidebar renders no rail at all until the trigger opens a
 * sheet, and the sheet takes its height from the viewport rather than from the
 * shell — so `SIDEBAR_FILLS_SHELL`, the class this story exists to guard, has
 * nothing to apply to. See `Mobile`.
 */
export const EmbeddedWithSidebarFooter: Story = {
  args: FULL_ARGS,
  render: (args) => (
    <div data-testid="embedded-frame" className="h-[600px] overflow-hidden">
      <HomeShell {...args} sidebarFooter={<button type="button">Account</button>} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const shell = canvasElement.querySelector<HTMLElement>('[data-testid="embedded-frame"]')!;
    const footer = canvasElement.querySelector<HTMLElement>('[data-slot="app-sidebar-footer"]')!;

    const shellBox = shell.getBoundingClientRect();
    const footerBox = footer.getBoundingClientRect();

    await expect(footerBox.bottom).toBeLessThanOrEqual(shellBox.bottom + 1);
    await expect(footerBox.height).toBeGreaterThan(0);
  },
};

/* ----------------------------------------------------------------------
 * Case stories — the situations this shell meets in a product, as opposed
 * to the prop combinations above. See docs/design-system/story-conventions.md.
 *
 * All eight are true here, so there is no `case-skip` line in this file. A
 * shell declares `regions` rather than `states`, so the exports above are the
 * arrangements a caller reaches rather than a state machine; the eight below
 * are the conditions that break arrangements.
 *
 * Two of the eight found defects that are *not* asserted here, because they
 * live in components this block composes and a block reports rather than
 * forks (block-build-brief.md): the composer paints no focus treatment
 * (`KeyboardOrder`), and the vendored sidebar neither mirrors under RTL
 * (`RTL`) nor branches on reduced motion (`ReducedMotion`). Each story's
 * description carries the measurement.
 * ---------------------------------------------------------------------- */

/**
 * `dir` on the document rather than on a wrapper. Nothing this shell renders
 * is portalled at rest, but Base UI reads direction from computed style and
 * from its own context — a wrapper reaches neither reliably — so the document
 * is the honest place to put it (story-conventions.md, mechanical fact 5).
 */
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
 * Right-to-left, and the one region the shell writes markup for is the one it
 * had to fix. The topbar row is hand-written — B7 has no leading slot, so the
 * sidebar trigger is a sibling — and it carried the only two physical classes
 * in this file (`pl-2` on the row, `pl-1` on B7). Both are now `ps-`, the
 * sanctioned swap, and byte-identical here as a *measurement* rather than an
 * assumption (N6 `usage-dashboard`'s lesson): the whole LTR frame was read back
 * with the swap reverted and with it applied, and every box matched to the
 * sub-pixel — row `x=256..1200 padding 8px/0px`, trigger `x=264..292`, B7
 * `x=296..1200 padding 4px/12px`, its title `x=300..368.734375`, the credits
 * chip `x=1083.578125..1188`. Both classes sit on the element that consumes
 * them, which is the condition N6 found the exception to. This story pins the
 * RTL half, so the swap cannot silently revert.
 *
 * WHAT THIS STORY CANNOT FIX, measured at 1200px: **the vendored sidebar does
 * not mirror.** `components/ui/sidebar.tsx` splits itself in two — an in-flow
 * `sidebar-gap` that reserves the width, and a `fixed` container positioned by
 * `data-[side=left]:left-0`. The gap mirrors with the flex row and the fixed
 * container does not, so under RTL the gap sits at x=944..1200 while the
 * sidebar paints at x=0..256 — a 256px empty strip down the right edge and a
 * sidebar lying on top of the first 256px of page content, which starts at
 * x=0. The carousel's Previous arrow (x=32..60) is underneath it. Every shell
 * in family O inherits this, and it is a vendored file, so it is recorded here
 * rather than swept: the repair is one logical-property pass on
 * `sidebar-container` and `sidebar-gap`, and it fixes all thirteen at once.
 */
export const RTL: Story = {
  args: FULL_ARGS,
  decorators: [
    (Story) => (
      <RtlDocument>
        <Story />
      </RtlDocument>
    ),
  ],
  play: async ({ canvasElement }) => {
    await expect(document.documentElement.dir).toBe("rtl");

    const row = canvasElement.querySelector<HTMLElement>('[data-region="topbar"]')!;
    const topbar = canvasElement.querySelector<HTMLElement>('[data-slot="app-topbar"]')!;
    const trigger = canvasElement.querySelector<HTMLElement>('[data-slot="sidebar-trigger"]')!;

    // The swap, asserted from the direction it actually changes. `ps-2` puts
    // the 8px on the right under RTL; `pl-2` put it on the left, leaving the
    // trigger flush against the start edge and 8px of dead space at the end.
    await expect(getComputedStyle(row).paddingRight).toBe("8px");
    await expect(getComputedStyle(row).paddingLeft).toBe("0px");
    await expect(getComputedStyle(topbar).paddingRight).toBe("4px");

    // And the geometry that padding buys: the trigger is the first thing in
    // the row, so under RTL it sits at the row's right edge, inset by the 8px.
    const rowBox = row.getBoundingClientRect();
    const triggerBox = trigger.getBoundingClientRect();
    await expect(rowBox.right - triggerBox.right).toBeGreaterThanOrEqual(6);
    await expect(rowBox.right - triggerBox.right).toBeLessThanOrEqual(12);

    // The page column itself mirrors: the credits chip is B7's trailing slot,
    // so under RTL it is on the left of the row and the title is on the right.
    const credits = canvasElement.querySelector<HTMLElement>('[data-slot="credits-indicator"]')!;
    const title = canvasElement.querySelector<HTMLElement>('[data-slot="app-topbar-title"]')!;
    await expect(credits.getBoundingClientRect().left).toBeLessThan(title.getBoundingClientRect().left);
  },
};

/**
 * Under `prefers-reduced-motion: reduce`, which the gate emulates for every
 * test in this project. The shell animates nothing of its own — it has no
 * `animate-*` and no `transition-*` anywhere — so what this story documents is
 * the motion its composed children own, and the two answers are different.
 *
 * BRANCHES, and is asserted below: C5 `recommendation-card`'s dialog. It
 * carries the restated `motion-reduce:data-open:animate-none
 * motion-reduce:data-closed:animate-none` pair, and its backdrop is covered by
 * the central `DialogOverlay` fix (waves 6 and 7). Both read
 * `animation-name: none`; this is the regression guard for a shell that opens
 * that dialog. Checked rather than assumed, per the steering — it is fixed,
 * and no call-site class was added here.
 *
 * DOES NOT BRANCH, and is deliberately not asserted: the vendored sidebar.
 * `sidebar-gap` carries `transition-[width] duration-200` and
 * `sidebar-container` carries `transition-[left,right,width] duration-200`,
 * both measured at `0.2s` with `matchMedia("(prefers-reduced-motion: reduce)")`
 * true. So pressing the trigger in this shell's own topbar slides a 256px
 * panel across the page for 200ms for a user who asked for no motion. Asserting
 * that duration would pin the defect; the fix is `motion-reduce:transition-none`
 * on both halves of a vendored file, which repairs every shell at once and is
 * not a call-site change.
 */
export const ReducedMotion: Story = {
  args: FULL_ARGS,
  play: async ({ canvasElement }) => {
    // An assertion that could not fail is worse than none — H1's lesson. Prove
    // the emulation is on before reading anything back.
    await expect(window.matchMedia("(prefers-reduced-motion: reduce)").matches).toBe(true);

    const canvas = within(canvasElement);
    const body = within(document.body);
    await userEvent.click(canvas.getAllByRole("button", { name: "Try it" })[0]);

    const dialog = await waitFor(() => {
      const el = document.querySelector<HTMLElement>('[data-slot="recommendation-card-dialog"]');
      if (!el) throw new Error("recommendation dialog did not open");
      return el;
    });
    await expect(getComputedStyle(dialog).animationName).toBe("none");

    const backdrop = document.querySelector<HTMLElement>('[data-slot="dialog-overlay"]')!;
    await expect(getComputedStyle(backdrop).animationName).toBe("none");
    await expect(getComputedStyle(backdrop).opacity).toBe("1");

    // Wait the dismissal out so axe never measures a half-faded popup.
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("dialog")).toBeNull());
  },
};

/**
 * The tab order across the shell's own seams, which is the only part of it the
 * shell decides: B1's contents, then the trigger the shell had to render as a
 * sibling, then B7's trailing slot, then the composer, then C2's starters. The
 * bands below that are the composed components' own orders and are not walked
 * here.
 *
 * Two stops are worth knowing about and neither is obvious from the source.
 * `app-sidebar-rail` is `tabIndex={-1}` in the vendored file, so the rail is a
 * pointer affordance only and the trigger is the sole keyboard route to the
 * sidebar. And C2's row inserts a stop of its own: Base UI's ScrollArea
 * viewport is `role="presentation"` with `tabindex="0"`, so a keyboard user
 * lands on an unnamed element before reaching the first chip. It is how the
 * chip row satisfies `scrollable-region-focusable`, and it is asserted here so
 * the stop is recorded rather than discovered again.
 *
 * DEFECT, recorded not pinned: **the composer paints no focus treatment.**
 * `hero-omnibox-textarea` carries `border-none ... focus-visible:ring-0`, and
 * the card's `border-ring ring-3` is keyed on C1's `state="focused"` prop
 * rather than on `:focus-within` — so it paints only when a caller has already
 * declared the composer focused. Measured with both checks: `settledFocusRing`
 * throws on it, and the before/after signature does change (the textarea's own
 * border colour moves), which is exactly the disagreement the convention
 * describes — something changed, nothing is visible. The composer is the one
 * emphasised element on this page, so it is the worst stop in the shell to
 * lose. Left out of the ring check below, with the exclusion named, rather
 * than asserted either way.
 *
 * Why the recents band contributes no stops at all: C4's tiles are focusable
 * only when an item carries `onOpen`, and these fixtures pass none. Given one,
 * the band adds four buttons — and **all four are named**, which corrects a
 * standing note in `CONTINUE.md` §8. Measured on this shell: C4 grid layout
 * gives A8 `labelPlacement="below"` plus a `label`, which takes A8's
 * `aria-labelledby` branch and names the frame from the visible title; C4 list
 * layout passes `frameLabel`. Neither ships a nameless button, and neither
 * carries `aria-pressed`, because C4 passes `selectMode="open"`.
 */
export const KeyboardOrder: Story = {
  args: FULL_ARGS,
  play: async ({ canvasElement }) => {
    const at = (selector: string) => canvasElement.querySelector<HTMLElement>(selector)!;

    // The seam, in DOM order. Each entry is queried up front so the
    // differential can read its signature *before* focus arrives — no blur, so
    // nothing disturbs the sequence (J2/J5's form of mechanical fact 5).
    const stops: { el: HTMLElement; name: string; paintsRing: boolean }[] = [
      { el: at('[data-slot="sidebar-nav-item"]'), name: "sidebar nav — Home", paintsRing: true },
      { el: at('[data-slot="sidebar-trigger"]'), name: "sidebar trigger", paintsRing: true },
      { el: at('[data-slot="credits-indicator-trigger"]'), name: "credits (B7 trailing)", paintsRing: true },
      // The composer. paintsRing: false is the defect above, not a decision.
      { el: at('[data-slot="hero-omnibox-textarea"]'), name: "composer", paintsRing: false },
      { el: at('[data-slot="hero-omnibox-attach"]'), name: "attach", paintsRing: true },
      { el: at('[data-slot="scroll-area-viewport"]'), name: "C2 scroll viewport", paintsRing: true },
    ];

    // Three sidebar nav items and C1's model select sit between the stops
    // above; the walk tabs through them and only asserts at the named seams,
    // so a reordering of either group cannot silently pass.
    let reached = 0;
    for (let press = 0; press < 24 && reached < stops.length; press += 1) {
      const target = stops[reached];
      const before = focusTreatmentSignature(target.el);
      await userEvent.tab();
      if (document.activeElement !== target.el) continue;

      if (target.paintsRing) {
        // Both checks, because they answer different questions: one asks
        // whether anything is painted, the other whether focus painted it.
        await settledFocusRing(target.el, waitFor);
        await expect(focusTreatmentSignature(target.el)).not.toBe(before);
      }
      reached += 1;
    }
    // Named rather than counted, so a regression says which seam moved.
    const missed = stops.slice(reached).map((stop) => stop.name);
    await expect(missed).toEqual([]);

    // The order itself: focus ended on the last named seam, so every earlier
    // one was reached before it and in the order listed.
    await expect(document.activeElement).toBe(stops[stops.length - 1].el);
  },
};

/**
 * The composer's text belongs to the shell, not to C1, and this is why that is
 * a real controlled pair rather than a prop being forwarded. A starter chip has
 * to write into the composer — C2's contract is "chips are prompts, not
 * filters" — so the write has to pass through whoever holds the value.
 *
 * The host below holds `promptValue` fixed and only records what it is asked
 * for. Three things follow, and all three are asserted: clicking a chip does
 * not move the rendered text, `onPromptChange` fires with the chip's exact
 * string (which is the whole payload a host needs), and typing into the
 * textarea is refused the same way. The render counter proves the host really
 * did re-render in between, so "held" is not "never re-rendered".
 */
function ControlledHost() {
  const [requested, setRequested] = React.useState("");
  const [applied, setApplied] = React.useState("Storyboard the Northwind teaser");
  const passes = React.useRef(0);
  passes.current += 1;

  return (
    <div className="h-svh w-full">
      <HomeShell
        {...FULL_ARGS}
        promptValue={applied}
        onPromptChange={setRequested}
        headline={
          <span>
            Good afternoon
            <span data-testid="requested" className="sr-only">
              {requested}
            </span>
            <span data-testid="render-pass" className="sr-only">
              {passes.current}
            </span>
          </span>
        }
        topbar={{
          actions: (
            <Button size="sm" variant="outline" onClick={() => setApplied(requested)}>
              Apply request
            </Button>
          ),
        }}
      />
    </div>
  );
}

export const Controlled: Story = {
  render: () => <ControlledHost />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const composer = canvasElement.querySelector<HTMLTextAreaElement>(
      '[data-slot="hero-omnibox-textarea"]',
    )!;
    await expect(composer).toHaveValue("Storyboard the Northwind teaser");
    const passBefore = Number(canvas.getByTestId("render-pass").textContent);

    // 1. Interaction alone does not move the rendered value.
    await userEvent.click(canvas.getByRole("button", { name: "Clean up the audio on this interview" }));
    await expect(composer).toHaveValue("Storyboard the Northwind teaser");

    // 2. The callback fired with the payload a host needs to apply it — the
    //    chip's exact text, not an id and not a diff.
    await expect(canvas.getByTestId("requested")).toHaveTextContent(
      "Clean up the audio on this interview",
    );

    // 3. That report re-rendered the host with an unchanged `promptValue`, and
    //    the shell held. The counter is what makes "held" mean something.
    await expect(Number(canvas.getByTestId("render-pass").textContent)).toBeGreaterThan(passBefore);

    // 4. And the payload was sufficient to apply the change, which is the only
    //    reason to report it rather than swallow it.
    await userEvent.click(canvas.getByRole("button", { name: "Apply request" }));
    await expect(composer).toHaveValue("Clean up the audio on this interview");

    // Typing is refused by the same route, which is the half a reader would
    // not predict: C1 owns the textarea but not its value. `onValueChange`
    // lands on the shell's `writePrompt`, which writes nothing of its own
    // while `promptValue` is set and forwards instead — so a controlled host
    // holds both entrances, and the keystroke is still reported.
    await userEvent.type(composer, "!");
    await expect(composer).toHaveValue("Clean up the audio on this interview");
    await expect(canvas.getByTestId("requested")).toHaveTextContent(
      "Clean up the audio on this interview!",
    );
  },
};

/**
 * Every optional text slot emptied at once — `title`, `headline`, and the three
 * band labels. Nothing here fails axe, and that is the finding: **an empty
 * string deletes structure in silence.**
 *
 * Measured on this story. `featuresLabel=""`, `recentsLabel=""` and
 * `recommendationsLabel=""` reach `<section aria-label="">`, and a section with
 * an empty name is not a landmark at all — the count of `region` roles in the
 * page drops from four to two, and landmark navigation is the *only* structural
 * navigation this page has, because A12 `section-header` renders its title as a
 * `<span>` rather than a heading. `headline=""` is falsy, so the `h1` is not
 * rendered and the page has no heading of any level. `title=""` leaves B7's
 * title span in the DOM and empty.
 *
 * A caller passing `""` to hide a label is reaching for a visual tweak and
 * getting a structural deletion — the same shape wave 2 measured on P1
 * `data-views`' group headers and wave 5 on J4's sessions. The shell could
 * defend against it by falling back to its own defaults on an empty string
 * rather than only on `undefined`; that is an API decision, so it is recorded
 * rather than taken here.
 */
export const EmptyLabel: Story = {
  args: {
    ...FULL_ARGS,
    title: "",
    headline: "",
    featuresLabel: "",
    recentsLabel: "",
    recommendationsLabel: "",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // The `h1` is gone, not empty.
    await expect(canvasElement.querySelector('[data-slot="home-shell-headline"]')).toBeNull();
    await expect(canvasElement.querySelector("h1")).toBeNull();

    // B7's title survives as an empty box.
    const title = canvasElement.querySelector<HTMLElement>('[data-slot="app-topbar-title"]')!;
    await expect(title).toBeEmptyDOMElement();

    // Three bands keep their `<section>` and lose their landmark. The third is
    // the inspiration band, which is a `data-slot` rather than a declared
    // region — the manifest names five and the spec's order names six.
    for (const selector of [
      '[data-region="feature-cards"]',
      '[data-region="recents-grid"]',
      '[data-slot="home-shell-inspiration"]',
    ]) {
      const section = canvasElement.querySelector<HTMLElement>(selector)!;
      await expect(section.tagName).toBe("SECTION");
      await expect(section).toHaveAttribute("aria-label", "");
    }
    // Two named regions remain: the hero band, whose label is hard-coded by the
    // shell, and C3's own carousel region. Neither comes from a caller string.
    await expect(canvas.getAllByRole("region")).toHaveLength(2);
    await expect(canvas.getByRole("region", { name: "Start something new" })).toBeInTheDocument();
  },
};

/**
 * Author-supplied text at ~90 characters in the four slots that take it, and
 * three different decisions come back — which is the point of rendering them
 * together rather than one at a time.
 *
 * The headline wraps: `text-balance` over two lines at 672px, no clipping, and
 * the band below it moves down. B7's title truncates to one line with an
 * ellipsis, which is right for a title bar. A12 `section-header`'s title also
 * truncates — and carries no `title` attribute, so a band label long enough to
 * clip is unrecoverable for a mouse user and reads whole only to a screen
 * reader. That last one is C3/A12's to fix (the same missing-`title` shape
 * wave 1 recorded on D3 `context-chips`); the shell cannot reach it from a
 * call site.
 */
export const LongContent: Story = {
  args: {
    ...FULL_ARGS,
    headline: "Good afternoon — pick up the Northwind relaunch where you left it on Tuesday",
    title: "Northwind Studio — brand, video and voice for the 2026 relaunch programme",
    featuresLabel: "Popular features across every workspace you have access to this quarter",
    recents: [
      {
        id: "r1",
        title: "Northwind brand audit — every logo lockup, colour pair and type ramp reviewed",
        editedAgo: "Edited 19 hours ago",
      },
      ...RECENTS.slice(1),
    ],
  },
  play: async ({ canvasElement }) => {
    const headline = canvasElement.querySelector<HTMLElement>('[data-slot="home-shell-headline"]')!;
    const headlineStyle = getComputedStyle(headline);
    await expect(headlineStyle.whiteSpace).toBe("normal");
    await expect(headline.scrollWidth).toBeLessThanOrEqual(headline.clientWidth + 1);
    await expect(headline.getBoundingClientRect().height).toBeGreaterThan(
      parseFloat(headlineStyle.lineHeight) * 1.5,
    );

    const title = canvasElement.querySelector<HTMLElement>('[data-slot="app-topbar-title"]')!;
    const titleStyle = getComputedStyle(title);
    await expect(titleStyle.textOverflow).toBe("ellipsis");
    await expect(titleStyle.whiteSpace).toBe("nowrap");

    const bandLabel = Array.from(
      canvasElement.querySelectorAll<HTMLElement>('[data-slot="section-header-title"]'),
    ).find((el) => el.textContent?.startsWith("Popular features"))!;
    await expect(getComputedStyle(bandLabel).textOverflow).toBe("ellipsis");
    // Recorded, not repaired: nothing carries the full string to a pointer.
    await expect(bandLabel).not.toHaveAttribute("title");

    // Nothing above turned the page into a horizontal scroller.
    const column = canvasElement.querySelector<HTMLElement>('[data-slot="home-shell-page"]')!;
    await expect(column.scrollWidth).toBeLessThanOrEqual(column.clientWidth + 1);
  },
};

/**
 * 375×812, moved with `page.viewport` rather than with a width wrapper — and
 * for this shell that is the difference between a story and a lie. B1's drawer
 * swap keys on a viewport media query (`hidden ... md:block` on the desktop
 * branch), so a 375px wrapper renders the full desktop rail inside a narrow box
 * and reports success. Moving the real viewport shows what a phone gets:
 * `window.innerWidth` 375, and **no sidebar in the document at all** until the
 * topbar trigger opens it as a sheet.
 *
 * The shell holds: nothing scrolls sideways at page level (375/375 on the root,
 * the page column and the document), and every band takes the full width. What
 * scrolls is what should — C2's chip row (902px in 343) and C3's carousel
 * (1008px in 343), both by their own design. That 375/375 also closes O1's half
 * of `CONTINUE.md` §8's carousel-arrow entry: C3 pins its arrows inside its own
 * box now, so the 407px-in-a-375px-column this shell once measured is gone.
 *
 * Two things recorded here. **`data-slot="app-sidebar"` does not exist below
 * 768px.** The vendored `Sidebar` spreads B1's props onto the `Sheet` *root*,
 * which renders no element, and the panel that does render is
 * `data-slot="sidebar"`. So `SIDEBAR_FILLS_SHELL` — this shell's
 * `[&_[data-slot=app-sidebar]]:h-full` — cannot match on mobile. It is inert
 * rather than broken, because the sheet takes its own height, but any consumer
 * selector written against that slot silently stops matching at the breakpoint,
 * and so does this file's own `EmbeddedWithSidebarFooter` assertion. **And C3's
 * cards clip, in the shape that defeats its own truncation.** At 375px each
 * `feature-card-row-card` is 240px wide and `overflow: hidden`, but the
 * `entity-row` inside it lays out at 276px — the title and description spans
 * both run x=32..292 against a card ending at 256. They carry `truncate`, so
 * they have `text-overflow: ellipsis` and `white-space: nowrap` and it never
 * fires: the ellipsis needs a constrained box, and their containing block is
 * 36px too wide. What a reader gets is the card's hidden overflow cutting the
 * words off flat. Same shape J1 `asset-library` measured on a file name, one
 * level up, and it exists only at narrow width — no desktop story could reach
 * it. C3's to fix, so it is recorded, not asserted.
 */
export const Mobile: Story = {
  args: FULL_ARGS,
  play: async ({ canvasElement }) => {
    await page.viewport(375, 812);
    await waitFor(() => expect(window.innerWidth).toBe(375));
    // The breakpoint moved, not just the box — the claim a wrapper cannot make.
    await expect(window.matchMedia("(max-width: 767px)").matches).toBe(true);

    const shell = canvasElement.querySelector<HTMLElement>('[data-slot="home-shell"]')!;
    const column = canvasElement.querySelector<HTMLElement>('[data-slot="home-shell-page"]')!;
    await expect(shell.scrollWidth).toBeLessThanOrEqual(shell.clientWidth);
    await expect(column.scrollWidth).toBeLessThanOrEqual(column.clientWidth);
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(
      document.documentElement.clientWidth,
    );

    // Every region is still mounted — that is the block contract — but the
    // sidebar's is empty until the drawer is opened.
    for (const region of ["sidebar", "topbar", "hero-omnibox", "feature-cards", "recents-grid"]) {
      await expect(canvasElement.querySelector(`[data-region="${region}"]`)).not.toBeNull();
    }
    await expect(canvasElement.querySelector('[data-slot="app-sidebar"]')).toBeNull();
    await expect(canvasElement.querySelector('[data-slot="sidebar-nav"]')).toBeNull();

    // The trigger is the only route in, and it brings the nav with it.
    await userEvent.click(within(canvasElement).getByRole("button", { name: "Toggle Sidebar" }));
    const drawer = await waitFor(() => {
      const el = document.querySelector<HTMLElement>('[data-slot="sidebar"][data-mobile="true"]');
      if (!el) throw new Error("mobile sidebar sheet did not open");
      return el;
    });
    await expect(within(drawer).getByRole("button", { name: /Home/ })).toBeInTheDocument();

    // Leave nothing mid-dismissal for axe: the sheet stays open and settled.
    await waitFor(() => expect(getComputedStyle(drawer).animationName).toBe("none"));
  },
};

/**
 * O1's nearest twin is O2 `chat-shell`: both compose B1 and B7, both put a
 * composer on the page, and that is exactly why they get confused.
 *
 * The choosing rule is what the composer is *for*. In O1 it starts something
 * that does not exist yet, and everything under it — starters, features,
 * recents, inspiration — is a path back into work that does; the page has
 * nothing to scroll back through because the page *is* the history. In O2 it
 * continues something that already exists: the stream above it is the context,
 * the sidebar is a thread list rather than a nav, and the shell holds a
 * conversation. So — **nothing above the composer, O1; a transcript above the
 * composer, O2** — and the corollary people get wrong: a launcher never
 * navigates from its composer. A starter chip fills the field and stops
 * (`onSelectSuggestion` fires *after* the write), which is why wiring a chip to
 * submit is this component's first documented "don't".
 *
 * WHY THE NEIGHBOUR IS NOT RENDERED BESIDE IT, which is the harder half of the
 * same rule. Two family-O shells cannot share a document. Each one's
 * `SidebarInset` renders a `<main>`, so an O1 beside an O2 is two main
 * landmarks and axe fails the story outright on `landmark-no-duplicate-main`
 * — measured here on `div[data-slot="home-shell"] > main` before this story was
 * rewritten. Nothing at a call site can reach it: `SidebarInset` is vendored,
 * takes no `render` prop, and neither shell exposes the element. So the
 * boundary between these two is not a layout choice a page can hedge on. **A
 * shell is the page.** You pick one per route, and the way to compare them is
 * to open them one after the other, which is what this story does at full
 * bleed. Recorded rather than dodged: rendering both and suppressing the rule
 * would have been a widened exclusion, and inerting one would have traded a
 * duplicate landmark for focusable content inside `aria-hidden`.
 */
export const Boundary: Story = {
  args: {
    ...FULL_ARGS,
    title: "Northwind — home",
    recommendations: RECOMMENDATIONS.slice(0, 1),
  },
  play: async ({ canvasElement }) => {
    // The two facts that separate O1 from O2, asserted on the shell itself so
    // the choosing rule above is checkable rather than only stated.
    //
    // 1. Exactly one `main`. This is what makes "a shell is the page" a
    //    measurable claim rather than an aesthetic one.
    await expect(canvasElement.querySelectorAll("main")).toHaveLength(1);

    // 2. Nothing above the composer. The hero band is the first thing in the
    //    scrolling column — O2's stream would sit here instead.
    const column = canvasElement.querySelector<HTMLElement>('[data-slot="home-shell-page"]')!;
    await expect(column.firstElementChild).toHaveAttribute("data-region", "hero-omnibox");

    // 3. The starter chip fills rather than submits: the composer takes the
    //    text and the page does not change underneath it.
    const canvas = within(canvasElement);
    const composer = canvasElement.querySelector<HTMLTextAreaElement>(
      '[data-slot="hero-omnibox-textarea"]',
    )!;
    await expect(composer).toHaveValue("");
    await userEvent.click(canvas.getByRole("button", { name: "Draft a launch announcement" }));
    await expect(composer).toHaveValue("Draft a launch announcement");
    await expect(canvasElement.querySelector('[data-region="recents-grid"]')).not.toBeNull();
  },
};
