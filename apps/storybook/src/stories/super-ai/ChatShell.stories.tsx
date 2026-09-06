import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";

import { focusTreatmentSignature, settledFocusRing } from "@/lib/focus-ring";

import { ChatShell, type ChatShellProps } from "@/registry/super-ai/chat-shell";
import { NotebookShell } from "@/registry/super-ai/notebook-shell";
import { ChatShellDocs } from "@/content/components/chat-shell.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const THREAD_GROUPS = [
  {
    id: "today",
    label: "Today",
    threads: [
      { id: "brand-audit", title: "Brand audit for Northwind" },
      {
        id: "deck-export",
        title: "Export the Q3 deck",
        running: true,
        runningLabel: "Rendering slides",
      },
    ],
  },
  {
    id: "earlier",
    label: "Last 7 days",
    threads: [
      { id: "onboarding", title: "Onboarding email rewrite", pinned: true },
      { id: "pricing", title: "Pricing page copy", unread: true },
    ],
  },
];

const MESSAGES: ChatShellProps["messages"] = [
  {
    id: "m1",
    role: "user",
    content: "Audit Northwind's brand voice against the three competitors in the deck.",
  },
  {
    id: "m2",
    role: "assistant",
    content:
      "I read all four voice guides and pulled the overlap. Northwind is the only one that leads with reassurance rather than speed — that is the position worth defending. The summary is written up as an artifact below.",
    feedback: { state: "idle", onRate: () => {}, onSubmit: () => {} },
  },
];

const ARTIFACTS: ChatShellProps["artifacts"] = [
  {
    id: "brand-audit",
    label: "Brand audit for Northwind",
    items: [
      {
        id: "a1",
        excerpt:
          "Northwind is the only voice in the set that opens on reassurance. Competitors open on speed, which leaves the calm position uncontested.",
        type: "markdown",
        editedAgo: "Edited 4 minutes ago",
        visibility: "private",
      },
      {
        id: "a2",
        excerpt: "const TONE = ['reassuring', 'plain', 'unhurried'] // extracted from 41 sampled pages",
        type: "code",
        editedAgo: "Edited 9 minutes ago",
        viewCount: 3,
        visibility: "shared",
      },
    ],
  },
];

const FULL_ARGS: ChatShellProps = {
  title: "Brand audit for Northwind",
  topbar: { privacy: { label: "Private" }, savedLabel: "Saved just now" },
  switcher: <div className="px-2 text-sm font-medium">Northwind</div>,
  threadGroups: THREAD_GROUPS,
  activeThreadId: "brand-audit",
  onSelectThread: () => {},
  messages: MESSAGES,
  artifacts: ARTIFACTS,
  contextChips: [{ id: "c1", kind: "file", label: "brand-guide.pdf", onRemove: () => {} }],
  modes: [
    { value: "ask", label: "Ask" },
    { value: "build", label: "Build" },
  ],
  mode: "ask",
};

const meta: Meta<typeof ChatShell> = {
  title: "Super AI/Chat Shell",
  component: ChatShell,
  // A block is a page, so it gets the whole canvas rather than a centred box.
  // The `h-svh` wrapper is what the shell's `h-full` measures against — in a
  // real app that is the document, here it is the story frame.
  parameters: { layout: "fullscreen", docs: { page: componentDocsPage(ChatShellDocs) } },
  decorators: [
    (Story) => (
      <div className="h-svh w-full">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ChatShell>;

/** The working shell: history, a running job, a turn, its artifacts, a loaded composer. */
export const Conversation: Story = { args: FULL_ARGS };

/**
 * Day one. No threads, no turns, nothing produced — three empty affordances at
 * once, which is the version most new users actually see. Mandatory export for
 * the block contract.
 *
 * Writing this shell is what turned "three independent empties" from a
 * sentence into a requirement (`block-build-brief.md`, gate assertion 3), and
 * until this wave it was a sentence here too. The play measures it: all five
 * regions mounted, and three *different* components each rendering their own
 * empty affordance in their own region — L1 in the sidebar, L1 in the stream,
 * J4's own line in the artifact region. They are independent because they
 * empty independently: a returning user with history and no artifacts hits the
 * third alone, and the shell has to be able to say so without the other two.
 *
 * The artifact region is the one that has to be mounted rather than deferred.
 * It is the region a new user has never seen produce anything, so a region
 * that appeared only once it had contents could never teach that it exists.
 *
 * The play also pins the shape behind the stream's `scrollable-region-
 * focusable` exposure, because day one is when it is closest to firing: the
 * accessible name and the tab stop are on the `Conversation` root, and the
 * element that actually scrolls is a different one that
 * `use-stick-to-bottom` owns. `Boundary` has the measurement of what happens
 * when the two come apart.
 */
export const Empty: Story = {
  args: {
    switcher: <div className="px-2 text-sm font-medium">Northwind</div>,
    modes: [
      { value: "ask", label: "Ask" },
      { value: "build", label: "Build" },
    ],
    mode: "ask",
  },
  play: async ({ canvasElement }) => {
    const region = (id: string) => canvasElement.querySelector<HTMLElement>(`[data-region="${id}"]`)!;

    // Every region mounted, empty or not.
    for (const id of ["sidebar", "topbar", "message-stream", "artifact-cards", "composer"]) {
      await expect(`${id} mounted: ${region(id) !== null}`).toBe(`${id} mounted: true`);
    }

    // Three empty affordances, three owners, three regions.
    const sidebarEmpty = region("sidebar").querySelector<HTMLElement>('[data-slot="empty-state-title"]')!;
    const streamEmpty = region("message-stream").querySelector<HTMLElement>(
      '[data-slot="empty-state-title"]',
    )!;
    const artifactsEmpty = region("artifact-cards").querySelector<HTMLElement>(
      '[data-slot="artifact-grid-empty"]',
    )!;
    await expect(
      [sidebarEmpty.textContent, streamEmpty.textContent, artifactsEmpty.textContent].join(" | "),
    ).toBe(
      "No conversations yet | Start the conversation | Nothing yet. Anything this conversation produces collects here.",
    );

    // The artifact region is a named landmark on day one, not something that
    // arrives with its first card.
    const heading = document.getElementById(region("artifact-cards").getAttribute("aria-labelledby")!)!;
    await expect(heading.textContent).toBe("Artifacts");

    // The stream's name and tab stop are on the conversation root; the
    // overflow is on an element inside it.
    const stream = region("message-stream");
    await expect(stream).toHaveAttribute("tabindex", "0");
    await expect(stream).toHaveAttribute("aria-label", "Conversation");
    await expect(getComputedStyle(stream).overflowY).not.toBe("auto");
    const scroller = stream.querySelector<HTMLElement>(".overflow-y-auto")!;
    await expect(`overflow lives on a descendant: ${scroller !== stream}`).toBe(
      "overflow lives on a descendant: true",
    );
  },
};

/**
 * Narrow viewport. Below the sidebar's 768px breakpoint the vendored Sidebar
 * swaps itself for a drawer, so the topbar trigger becomes the only way in and
 * the stream, artifacts and composer take the full width. Mandatory export for
 * the block contract — a shell is a layout, and layout is what breaks.
 *
 * `globals.viewport.value` is the Storybook 9 API. `parameters.viewport
 * .defaultViewport` — which this story used first, and which reads like the
 * documented API in a lot of older material — was removed in 9 and does
 * nothing at all; a story carrying it renders at full width while looking
 * configured. `options` is declared explicitly rather than relying on a
 * built-in list, so the selection cannot silently resolve to nothing.
 *
 * KNOWN LIMIT: this resizes the canvas in the Storybook UI only. The vitest
 * runner has no manager to resize an iframe, so `pnpm test:stories` renders
 * and axe-checks this story at the browser's default width. See the friction
 * log in task-5-report.md — the responsive layout here is verified by hand,
 * not by a gate.
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

/** The sidebar as a job queue: two background runs visible from another thread. */
export const JobQueue: Story = {
  args: {
    ...FULL_ARGS,
    activeThreadId: "brand-audit",
    threadGroups: [
      {
        id: "today",
        label: "Today",
        threads: [
          { id: "brand-audit", title: "Brand audit for Northwind" },
          {
            id: "deck-export",
            title: "Export the Q3 deck",
            running: true,
            runningLabel: "Rendering slides",
          },
          {
            id: "transcripts",
            title: "Transcribe the customer calls",
            running: true,
            runningLabel: "Transcribing 12 of 40",
          },
        ],
      },
    ],
  },
};

/** M5 as the final turn: the run that did not happen, held open inside the stream. */
export const Paywalled: Story = {
  args: {
    ...FULL_ARGS,
    messages: [
      {
        id: "m1",
        role: "user",
        content: "Render the whole audit as a narrated 4K walkthrough.",
      },
    ],
    artifacts: [],
    paywall: {
      state: "quota-exhausted",
      prompt: "Render the whole audit as a narrated 4K walkthrough",
      model: "Veo 3.1",
      before: "You are out of credits for this billing period, so I stopped before spending anything.",
      after: "Everything up to the render is done — the audit itself is finished and saved.",
      onUpgrade: () => {},
    },
  },
};

/* -------------------------------------------------------------------------
 * Case stories — the situations this shell meets in a product, as opposed to
 * the region combinations above. See docs/design-system/story-conventions.md.
 *
 * All eight are written, so there are no `case-skip` lines. A shell declares
 * `regions` rather than `states`, so nothing above is a declared-state export
 * restating the types — but the eight below are still the only record of what
 * this arrangement does under direction, motion suppression, a keyboard, a
 * phone, an empty string and a host that refuses to move.
 * ---------------------------------------------------------------------- */

/**
 * The reduced-motion branch, and where it had to be added.
 *
 * This shell owns exactly one animation — the job-queue spinner beside a
 * running thread — and it shipped with a bare `animate-spin` and no branch.
 * `motion-reduce:animate-none` was added beside it in this wave (spec §3.4:
 * one class, an established idiom, no design decision in it). The assertion
 * was written first and watched fail against the unfixed source
 * (`animation-name: spin`), so this is a guard that has been seen red rather
 * than a class check that could never fail.
 *
 * What the branch is *for* is the second assertion. This shell's own docs say
 * a spinner must never be the whole signal; suppress the spin and all that is
 * left is `runningLabel`, so the word is what carries the fact that something
 * is still working.
 *
 * Everything else that animates here belongs to a composed component and is
 * reached rather than assumed: B6's actions menu and its delete confirmation
 * are opened from inside the shell, and all three surfaces — menu, alert
 * dialog panel, alert dialog backdrop — are read back. The backdrop is the
 * one worth reaching. It is unreachable from any call site
 * (`AlertDialogContent` renders `<AlertDialogOverlay />` with no `className`),
 * so it was fixed centrally in wave 7 after two agents disproved their own
 * steering; this is that fix measured from a consumer four levels above it
 * rather than from the component that reported it.
 *
 * **One surface in this shell was still animating under reduce, and it could
 * not be reached from this story.** B1's mobile drawer is a `Sheet`, and
 * `components/ui/sheet.tsx` carried no `motion-reduce:transition-none` on
 * either half. It exists only below the 768px media query, so `Mobile` is
 * where it was measured — and where the guard now lives. Fixed centrally in
 * both copies of the vendored file after this story reported it.
 */
export const ReducedMotion: Story = {
  args: FULL_ARGS,
  play: async ({ canvasElement }) => {
    const body = within(document.body);

    // 1. The shell's own branch.
    const spinners = Array.from(
      canvasElement.querySelectorAll<HTMLElement>('[data-slot="chat-shell-thread-running"] svg'),
    );
    await expect(spinners.length).toBeGreaterThan(0);
    for (const spinner of spinners) {
      await expect(getComputedStyle(spinner).animationName).toBe("none");
    }

    // 2. …and what survives it: the label, which is the whole reason the shell
    // renders a word beside the glyph rather than the glyph alone.
    const running = Array.from(
      canvasElement.querySelectorAll<HTMLElement>('[data-slot="chat-shell-thread-running"]'),
    );
    await expect(running.map((el) => el.textContent)).toEqual(["Rendering slides"]);

    // 3. The composed surfaces, opened rather than assumed.
    const trigger = canvasElement.querySelector<HTMLElement>(
      '[data-thread-id="brand-audit"] [data-slot="thread-list-item"] button:nth-of-type(2)',
    );
    await expect(trigger).not.toBeNull();
    await userEvent.click(trigger!);

    const menu = await body.findByRole("menu");
    await expect(menu).toHaveAttribute("data-open");
    await expect(getComputedStyle(menu).animationName).toBe("none");

    await userEvent.click(await body.findByRole("menuitem", { name: "Delete" }));
    const dialog = await body.findByRole("alertdialog");
    await waitFor(() => expect(dialog).toHaveAttribute("data-open"));
    await expect(getComputedStyle(dialog).animationName).toBe("none");

    const backdrop = document.querySelector<HTMLElement>('[data-slot="alert-dialog-overlay"]')!;
    await expect(getComputedStyle(backdrop).animationName).toBe("none");

    // Leave nothing mid-dismissal: axe scans the moment this returns, and a
    // destructive menu row caught fading out measures its own transitional
    // opacity as a contrast failure (story-conventions.md, the note after the
    // five facts). Suppressing the animation does not remove the frames in
    // which the row is still mounted and dimmed.
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("alertdialog")).toBeNull());
    await waitFor(() => expect(body.queryByRole("menu")).toBeNull());
  },
};

/**
 * Right-to-left. A shell is where direction stops being a per-component
 * question: five regions have to agree about which edge is the start, and
 * nothing in this file reads `dir` — flex order and logical utilities carry
 * all of it.
 *
 * `dir` on a wrapper is enough here, deliberately: this story opens no popup,
 * and the only portalled surfaces the shell can produce (B6's menu and its
 * confirmation, the mobile drawer) are exercised in `ReducedMotion` and
 * `Mobile`. An RTL story that opened one would need `dir` on the document
 * instead (`story-conventions.md`, mechanical fact 5's closing note).
 *
 * **Two classes were swapped in this wave** and are pinned below: the topbar
 * row's `pl-2` and the `pl-1` the shell passes to B7 both became `ps-`. Both
 * close the gap to the sidebar trigger, so both have to follow direction.
 * Byte-identity in LTR was measured rather than assumed — `8px/0px` and
 * `4px/12px` before the swap and after it — because the same swap is not free
 * on an ancestor whose descendants the user agent has an opinion about
 * (`usage-dashboard`, wave 7). The B7 half is the interesting one: its own
 * base is `px-3`, a logical *shorthand*, and the longhand still wins the
 * cascade, which is a property of Tailwind's emitted order and not something
 * a class list shows you.
 *
 * **Recorded, not fixed — the default disclaimer's full stop moves to the
 * wrong end.** N3 `disclaimer-note` measured this in wave 7: the trailing `.`
 * is a bidi neutral with nothing strong after it, so it takes the paragraph
 * level and paints at the far edge, giving `.AI can make mistakes. Check
 * important info`. Wave 7 also found that passing a `link` hides it, because
 * the link's Latin text makes the stop interior — **and this shell forwards no
 * `link`**. `disclaimer` is a bare `React.ReactNode` spliced in as N3's
 * children, so the one workaround that exists is unreachable through the
 * shell's API unless a caller rebuilds the anchor by hand. The measurement is
 * asserted here because it is the shell's own default rendering, and the fix
 * belongs to N3 or to a `link` passthrough — not to a story.
 *
 * **Recorded, not fixed — thread titles stay left-aligned.** B6's row button
 * carries `text-left`, so inside a mirrored sidebar every title hugs the wrong
 * edge. It is one byte-identical swap in `thread-list.tsx`, which is another
 * component's file.
 *
 * **Recorded, not fixed, and the serious one — the sidebar paints on the wrong
 * edge and covers the conversation.** The vendored sidebar splits itself into
 * an in-flow `sidebar-gap` that reserves the column and a `fixed`
 * `sidebar-container` that paints it. The gap follows direction because it is
 * in flow; the container is placed by `data-[side=left]:left-0`, which is
 * physical and does not. Measured in the play function: shell `0..1200`,
 * painted sidebar `0..256`, reserved column `944..1200`, stream `0..944` — so
 * 256px of blank space sits at the shell's start edge and the sidebar sits on
 * top of the first 256px of the conversation. This is not the shell's to fix:
 * `left-0` lives in `components/ui/sidebar.tsx`, which every B1 consumer
 * shares, and CONTINUE.md §8's standing rule for a byte-identical swap in a
 * vendored file is that it is not taken from a consumer. It is also not
 * confined to this shell — O1, O9, O10 and O11 compose B1 the same way.
 */
export const RTL: Story = {
  args: FULL_ARGS,
  render: (args) => (
    <div dir="rtl" className="h-full">
      <ChatShell {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const shell = canvasElement.querySelector<HTMLElement>('[data-slot="chat-shell"]')!;
    await expect(getComputedStyle(shell).direction).toBe("rtl");

    // The two swaps, in the frame they were made for. Compare with
    // `LongContent`, which reads the same two boxes back in LTR.
    const row = canvasElement.querySelector<HTMLElement>('[data-region="topbar"]')!;
    const bar = canvasElement.querySelector<HTMLElement>('[data-slot="app-topbar"]')!;
    const rowStyle = getComputedStyle(row);
    const barStyle = getComputedStyle(bar);
    await expect(
      `row ${rowStyle.paddingLeft}/${rowStyle.paddingRight} bar ${barStyle.paddingLeft}/${barStyle.paddingRight}`,
    ).toBe("row 0px/8px bar 12px/4px");

    // THE DEFECT, measured. The vendored sidebar splits itself in two: an
    // in-flow `sidebar-gap` that reserves the column, and a `fixed`
    // `sidebar-container` positioned by `data-[side=left]:left-0`. The gap
    // follows direction because it is in flow; `left-0` is physical and does
    // not. So the reserved column moves to the right edge and the painted
    // sidebar stays on the left, on top of the conversation. Recorded here as
    // the numbers rather than claimed correct — see this story's description.
    const sidebar = canvasElement.querySelector<HTMLElement>('[data-slot="app-sidebar"]')!;
    const shellBox = shell.getBoundingClientRect();
    const sidebarBox = sidebar.getBoundingClientRect();
    const stream = canvasElement.querySelector<HTMLElement>('[data-region="message-stream"]')!;
    const gapBox = canvasElement
      .querySelector<HTMLElement>('[data-slot="sidebar-gap"]')!
      .getBoundingClientRect();
    const streamBox = stream.getBoundingClientRect();
    await expect(
      [
        `shell ${Math.round(shellBox.left)}..${Math.round(shellBox.right)}`,
        `painted sidebar ${Math.round(sidebarBox.left)}..${Math.round(sidebarBox.right)}`,
        `reserved column ${Math.round(gapBox.left)}..${Math.round(gapBox.right)}`,
        `stream ${Math.round(streamBox.left)}..${Math.round(streamBox.right)}`,
      ].join(" | "),
    ).toBe("shell 0..1200 | painted sidebar 0..256 | reserved column 944..1200 | stream 0..944");
    // Said plainly: the sidebar covers the first 256px of the conversation and
    // 256px of the shell's own start edge is blank.
    await expect(
      `stream covered by sidebar: ${Math.round(Math.min(sidebarBox.right, streamBox.right) - Math.max(sidebarBox.left, streamBox.left))}px`,
    ).toBe("stream covered by sidebar: 256px");

    // The trigger leads the topbar row, so it sits at the right edge and the
    // `ps-2` gutter is what separates it from the shell's edge.
    const trigger = within(row).getByRole("button", { name: "Toggle Sidebar" });
    await expect(
      `trigger right of title: ${trigger.getBoundingClientRect().left > bar.getBoundingClientRect().left}`,
    ).toBe("trigger right of title: true");

    // N3's trailing full stop. Measured with a Range over the last character
    // rather than read off `textContent`, which is unchanged — what moves is
    // where the glyph paints, and that is the whole defect.
    const noteText = canvasElement.querySelector<HTMLElement>('[data-slot="disclaimer-note-text"]')!;
    const node = noteText.firstChild as Text;
    await expect(node.textContent).toBe("AI can make mistakes. Check important info.");
    const range = document.createRange();
    range.setStart(node, node.textContent!.length - 1);
    range.setEnd(node, node.textContent!.length);
    const stopBox = range.getBoundingClientRect();
    range.setStart(node, 0);
    range.setEnd(node, 1);
    const firstBox = range.getBoundingClientRect();
    await expect(`stop before first letter: ${stopBox.right <= firstBox.left}`).toBe(
      "stop before first letter: true",
    );

    // B6's row button pins its title to the physical left inside a mirrored
    // sidebar. Another component's file, so recorded rather than swept.
    const threadButton = canvasElement.querySelector<HTMLElement>('[data-slot="thread-list-item"] button')!;
    await expect(`thread title textAlign=${getComputedStyle(threadButton).textAlign}`).toBe(
      "thread title textAlign=left",
    );
  },
};

/**
 * A trimmed shell: two threads, one turn, no artifacts, a controlled composer
 * value so Send is enabled. Everything the keyboard walk needs and nothing it
 * doesn't — the walk is over the *shell's* order, not over each composed
 * component's internals, which each have their own story.
 */
const KEYBOARD_ARGS: ChatShellProps = {
  title: "Brand audit for Northwind",
  switcher: (
    <button type="button" className="px-2 text-sm font-medium">
      Northwind
    </button>
  ),
  sidebarFooter: (
    <button type="button" className="px-2 text-sm">
      Account
    </button>
  ),
  threadGroups: [
    {
      id: "today",
      label: "Today",
      threads: [
        { id: "brand-audit", title: "Brand audit for Northwind" },
        { id: "pricing", title: "Pricing page copy" },
      ],
    },
  ],
  activeThreadId: "brand-audit",
  messages: [{ id: "m1", role: "user", content: "Audit Northwind's brand voice." }],
  composer: { value: "Compare it against the three competitors", onValueChange: () => {} },
  modes: [
    { value: "ask", label: "Ask" },
    { value: "build", label: "Build" },
  ],
  mode: "ask",
};

/**
 * The shell's own tab order, walked once, and the docs sentence it contradicts.
 *
 * **The order is not the one `chat-shell.docs.tsx` states.** That page says the
 * sequence begins "sidebar trigger, `switcher`, one stop per thread row…". The
 * rendered sequence puts the sidebar trigger **seventh**, after the switcher,
 * both thread rows, both row menus and the sidebar footer — because the
 * trigger lives in the topbar row, and the topbar is a sibling *after*
 * `data-region="sidebar"` in the DOM. So the control that collapses the
 * sidebar is reachable only by tabbing through the whole sidebar first, and it
 * gets further away with every thread. Recorded here, asserted as measured,
 * and left for the docs module's owner: prose written from intent, contradicted
 * by rendering it — the same shape as the seven docs corrections in waves 6 and
 * 7. Cmd/Ctrl+B is the real escape hatch and is registered on `window`, which
 * is presumably why nobody noticed.
 *
 * **The composer's suppressed control is genuinely gone.** The shell hides D1's
 * negative-prompt toggle with a `display: none` descendant variant, and the
 * constant's docstring claims that removes it from the tab order rather than
 * merely hiding it. The walk is what proves it: twelve stops, none of them the
 * toggle.
 *
 * **Both focus checks, because they answer different questions.**
 * `settledFocusRing` asks whether anything is painted; the differential —
 * reading the *next* stop's signature while focus is still on the previous one,
 * so nothing disturbs the sequence — asks whether focus is what painted it.
 * `story-conventions.md`, mechanical fact 5.
 *
 * **Two stops are excluded from the ring check and nothing is pinned in either
 * direction**, which is the H2 `time-ruler` precedent: decline the helper
 * rather than manufacture green, and say so.
 *
 * - The message stream is `tabIndex={0}` with no `focus-visible` class of its
 *   own — its docs page already says this. It is the same shape as the
 *   unstyled `Tabs.Panel` that `tool-panel` filters out of its own walk.
 * - D1's composer textarea paints nothing either, which wave 1 recorded on
 *   `media-prompt-bar` itself (`border-none focus-visible:ring-0`, no
 *   container `focus-within`). Measured here from four levels up: outline
 *   `none/1px`, and every shadow layer zero-sized —
 *   `oklab(0.708 0 0 / 0.5) 0px 0px 0px 0px` is a colour with no geometry.
 *   That is the J3 `explore-gallery` shape, so the differential *would* report
 *   a change on it while `settledFocusRing` correctly reports no ring: a third
 *   independent instance of the two checks disagreeing, and the reason the
 *   convention asks for both. Neither is asserted on this stop.
 */
export const KeyboardOrder: Story = {
  args: KEYBOARD_ARGS,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const rows = Array.from(canvasElement.querySelectorAll<HTMLElement>('[data-slot="thread-list-item"]'));
    await expect(rows).toHaveLength(2);
    const menuTrigger = (row: HTMLElement) =>
      row.querySelector<HTMLElement>('[data-slot="dropdown-menu-trigger"]')!;
    const bySlot = (slot: string) => canvasElement.querySelector<HTMLElement>(`[data-slot="${slot}"]`)!;

    const stream = canvasElement.querySelector<HTMLElement>('[data-region="message-stream"]')!;

    const stops: [string, HTMLElement][] = [
      ["switcher", canvas.getByRole("button", { name: "Northwind" })],
      ["thread row 1", canvas.getByRole("button", { name: "Brand audit for Northwind" })],
      ["thread row 1 actions", menuTrigger(rows[0])],
      ["thread row 2", canvas.getByRole("button", { name: "Pricing page copy" })],
      ["thread row 2 actions", menuTrigger(rows[1])],
      ["sidebar footer", canvas.getByRole("button", { name: "Account" })],
      ["sidebar trigger", bySlot("sidebar-trigger")],
      ["message stream", stream],
      ["composer textarea", bySlot("media-prompt-bar-textarea")],
      ["composer attach", bySlot("media-prompt-bar-attach")],
      ["mode tabs", bySlot("mode-tabs-item")],
      ["composer submit", bySlot("media-prompt-bar-submit")],
    ];

    // The suppressed control. It is still mounted and still carries Base UI's
    // explicit `tabindex="0"` — the suppression is `display: none`, which is
    // what takes it out of the tab order and out of the accessibility tree.
    // The walk below is the proof: it never appears.
    const negativeToggle = bySlot("media-prompt-bar-negative-toggle");
    await expect(negativeToggle).not.toBeNull();
    await expect(getComputedStyle(negativeToggle).display).toBe("none");

    // The two stops with no focus treatment, excluded from the ring check so
    // that nothing is pinned in either direction. Both are recorded defects
    // this shell inherits rather than owns — see the description.
    const NO_RING = new Set<HTMLElement>([stream, bySlot("media-prompt-bar-textarea")]);

    const visited: HTMLElement[] = [];
    for (const [name, el] of stops) {
      // The differential's baseline, taken while focus is still on the
      // previous stop — no blur, so the sequence under test is undisturbed.
      const before = focusTreatmentSignature(el);
      await userEvent.tab();
      visited.push(document.activeElement as HTMLElement);
      await expect(`${name}: ${document.activeElement === el}`).toBe(`${name}: true`);
      await expect(`${name} focus-visible: ${el.matches(":focus-visible")}`).toBe(
        `${name} focus-visible: true`,
      );
      if (!NO_RING.has(el)) {
        await settledFocusRing(el, waitFor);
        await waitFor(() =>
          expect(`${name} ring caused by focus: ${focusTreatmentSignature(el) !== before}`).toBe(
            `${name} ring caused by focus: true`,
          ),
        );
      }
    }

    await expect(`negative toggle reached: ${visited.includes(negativeToggle)}`).toBe(
      "negative toggle reached: false",
    );

    // Nothing traps: the stop after the last is outside the shell.
    await userEvent.tab();
    await expect(canvasElement.contains(document.activeElement)).toBe(false);

    // Where focus returns on dismiss. B6's row menu has a real trigger, so
    // Base UI restores to it — the one dismissal path in this shell that can
    // be asserted rather than recorded. Deleting a thread cannot be: the row
    // that had focus unmounts and nothing restores it, which the docs page
    // records as the host's job.
    const trigger = menuTrigger(rows[0]);
    await userEvent.click(trigger);
    const body = within(document.body);
    await body.findByRole("menu");
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("menu")).toBeNull());
    await waitFor(() => expect(document.activeElement).toBe(trigger));
  },
};

/**
 * A host that holds both of this shell's controlled pairs and refuses to move
 * either. `activeThreadId`/`onSelectThread` decides which conversation is
 * open; `mode`/`onModeChange` decides the working context. The shell owns no
 * conversation state at all, so "controlled" here is not a mode — a consumer
 * who forgets to apply either callback ships a workspace where no click ever
 * opens anything and no mode ever changes.
 *
 * The render counter is what makes the last assertion mean something: the host
 * really re-rendered with unchanged values, so the shell held because the props
 * held and not because React skipped the work.
 *
 * The two pairs are not equally safe, and that is the finding. Thread
 * selection has no internal state anywhere: `active` is a per-row boolean and
 * the row paints only what it is passed. `mode` is different — D4 `mode-tabs`
 * keeps an internal value and updates it on every press *whether or not* it is
 * controlled, then renders `valueProp ?? internal`. The rendered tab is
 * therefore correct here, but the component is carrying a second, divergent
 * value the whole time, and any host that later stops passing `mode` will find
 * the tabs jump to whatever the user last pressed rather than to the value the
 * host thought was current.
 */
function PinnedWorkspace({
  onSelectThread,
  onModeChange,
}: {
  onSelectThread: (id: string) => void;
  onModeChange: (mode: string) => void;
}) {
  const [renders, setRenders] = React.useState(1);
  const bump = () => setRenders((n) => n + 1);
  return (
    <div data-renders={renders} className="h-full">
      <ChatShell
        {...FULL_ARGS}
        // Pinned. Neither callback is ever applied.
        activeThreadId="brand-audit"
        mode="ask"
        onSelectThread={(id) => {
          onSelectThread(id);
          bump();
        }}
        onModeChange={(mode) => {
          onModeChange(mode);
          bump();
        }}
      />
    </div>
  );
}

export const Controlled: StoryObj<typeof PinnedWorkspace> = {
  args: { onSelectThread: fn(), onModeChange: fn() },
  render: (args) => <PinnedWorkspace {...args} />,
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const open = canvas.getByRole("button", { name: "Brand audit for Northwind" });
    const other = canvas.getByRole("button", { name: "Onboarding email rewrite" });

    await expect(open).toHaveAttribute("aria-current", "page");
    await expect(other).not.toHaveAttribute("aria-current");

    await userEvent.click(other);
    // The payload a consumer needs in order to apply the change: the thread id,
    // which is all the shell knows and all a host's router needs.
    await expect(args.onSelectThread).toHaveBeenCalledWith("onboarding");
    // The prop wins — the click alone moved nothing.
    await expect(open).toHaveAttribute("aria-current", "page");
    await expect(other).not.toHaveAttribute("aria-current");

    const ask = canvas.getByRole("button", { name: "Ask" });
    const build = canvas.getByRole("button", { name: "Build" });
    await expect(ask).toHaveAttribute("aria-pressed", "true");

    await userEvent.click(build);
    await expect(args.onModeChange).toHaveBeenCalledWith("build");
    await expect(ask).toHaveAttribute("aria-pressed", "true");
    await expect(build).toHaveAttribute("aria-pressed", "false");

    // …and the host did re-render, twice, while holding both values fixed.
    await expect(canvasElement.querySelector("[data-renders]")).toHaveAttribute("data-renders", "3");
  },
};

/**
 * Every optional text slot on this shell, emptied at once — and the three
 * different things that happen, which is the whole point of the story.
 *
 * **`disclaimer=""` deletes the disclaimer in silence.** N3 falls back with
 * `children ?? DEFAULT_TEXT`, and `""` is not nullish, so the sentence
 * disappears while its information icon stays mounted: a shell showing a
 * glyph with nothing to say. The note has no role and no name to lose, so
 * nothing in the pipeline can see it. Wave 7 recorded the same on N3 itself;
 * reached here through a shell prop that is the only way to set it.
 *
 * **`artifactsEmptyLabel=""` empties a live region in silence.** J4's empty
 * line is a `role="status"`, so an empty string leaves an announced element
 * with nothing to announce and an artifact region with no explanation of why
 * it is blank.
 *
 * **`title=""` is the harmless one**, and it is worth naming as harmless: B7's
 * title is not the accessible name of anything, so an empty title is a blank
 * strip in the topbar and nothing more.
 *
 * **`artifactsLabel=""` is a red gate, and it is not rendered here.** Setting
 * it fails axe `empty-heading` outright — "Headings should not be empty",
 * against `<h2 id="…" class="text-sm font-medium"></h2>` — because the shell
 * renders its region label as a heading and points `aria-labelledby` at it.
 * Measured, then removed from the args rather than shipped into the gate, the
 * way H4 `transcript-editor` handles its own red empty string. Two things make
 * it worth writing down. It is the *fourth* pair in this program's
 * one-red-one-silent family and the only one where the difference is a tag
 * name: J4's own session `label=""` was measured silent in wave 5, and the
 * only structural difference is that J4 renders its label into a `<span>`.
 * And the consequence axe catches by accident is not the one that matters —
 * `aria-labelledby` resolving to an empty string leaves the section with no
 * accessible name, so it stops being a landmark, and there is no rule for
 * that at all.
 *
 * **A query-shape trap found while measuring it**, worth having before the
 * next agent repeats it: `getByRole("region")` cannot see this. `aria-query`'s
 * element-role mapping keys on the *presence* of `aria-labelledby`, not on the
 * name it computes to, so testing-library keeps reporting an unnamed
 * `<section>` as a `region` while a browser maps it to `generic`.
 */
export const EmptyLabel: Story = {
  args: {
    ...FULL_ARGS,
    title: "",
    artifacts: [],
    artifactsEmptyLabel: "",
    disclaimer: "",
  },
  play: async ({ canvasElement }) => {
    const noteText = canvasElement.querySelector<HTMLElement>('[data-slot="disclaimer-note-text"]')!;
    const topbarTitle = canvasElement.querySelector<HTMLElement>('[data-slot="app-topbar-title"]')!;
    const gridEmpty = canvasElement.querySelector<HTMLElement>('[data-slot="artifact-grid-empty"]')!;

    // The disclaimer is deleted rather than defaulted, and its icon survives.
    await expect(noteText.textContent).toBe("");
    await expect(canvasElement.querySelector('[data-slot="disclaimer-note-icon"]')).not.toBeNull();

    // The empty-state line is an announced element with nothing to announce.
    await expect(gridEmpty).toHaveAttribute("role", "status");
    await expect(gridEmpty.textContent).toBe("");

    // The harmless one: no accessible name anywhere depends on it.
    await expect(topbarTitle.textContent).toBe("");

    // The region the shell owns keeps its heading and stays a landmark — this
    // is the control for the `artifactsLabel=""` case described above, which
    // is deliberately not rendered.
    const section = canvasElement.querySelector<HTMLElement>('[data-region="artifact-cards"]')!;
    const heading = document.getElementById(section.getAttribute("aria-labelledby")!)!;
    await expect(heading.textContent).toBe("Artifacts");
  },
};

/**
 * ~90 characters in every author-supplied slot at once, because a shell's
 * answer to length is not one decision but five, and they do not agree.
 *
 * The title truncates, the thread row truncates, the context chip truncates,
 * the message wraps, and J4's excerpt line-clamps. Only the last two keep the
 * whole string on screen. That is the right split — a conversation is prose
 * and chrome is not — but it means every identifying label in this shell is
 * lossy, and generated titles put the distinguishing part at the end.
 *
 * **Recorded, not fixed — a truncated chip has no `title`.** D3's label is
 * `max-w-40 truncate` with no `title` attribute and no tooltip, so a long
 * filename's tail is unavailable to a sighted user by any means. Wave 1 found
 * it on `context-chips`; the shell is where it bites, because a chat composer
 * is where long filenames actually arrive. Truncation is visual only, so the
 * accessible name still carries the whole string — the inversion is that a
 * screen-reader user can tell two references apart and a sighted one cannot.
 *
 * This story also carries the **LTR half of the two class swaps** made in this
 * wave: `8px/0px` and `4px/12px`, the same numbers the unswapped source
 * produced. `RTL` asserts the mirror. Byte-identity is a measurement here, not
 * an assumption — the swap that is free on one element is not free on an
 * ancestor (`usage-dashboard`, wave 7).
 */
export const LongContent: Story = {
  args: {
    ...FULL_ARGS,
    title: "Brand voice audit for Northwind against its three closest competitors",
    threadGroups: [
      {
        id: "today",
        label: "Today",
        threads: [
          {
            id: "brand-audit",
            title: "Brand voice audit for Northwind against its three closest competitors",
          },
        ],
      },
    ],
    contextChips: [
      {
        id: "c1",
        kind: "file",
        label: "northwind-brand-guide-2026-final-reviewed-with-legal-annotations.pdf",
        onRemove: () => {},
      },
    ],
    messages: [
      {
        id: "m1",
        role: "user",
        content:
          "Read all four voice guides and tell me which position is uncontested, then say what defending it would cost us in tone.",
      },
    ],
    artifacts: [
      {
        id: "brand-audit",
        label: "Brand audit for Northwind",
        items: [
          {
            id: "a1",
            excerpt:
              "Northwind is the only voice in the set that opens on reassurance; every competitor opens on speed, which leaves the calm position uncontested and cheap to hold.",
            type: "markdown",
            editedAgo: "Edited 4 minutes ago",
          },
        ],
      },
    ],
  },
  play: async ({ canvasElement }) => {
    const clipped = (el: HTMLElement) => el.scrollWidth > el.clientWidth;

    const title = canvasElement.querySelector<HTMLElement>('[data-slot="app-topbar-title"]')!;
    const threadTitle = canvasElement.querySelector<HTMLElement>(
      '[data-slot="thread-list-item"] button span.truncate',
    )!;
    const chipLabel = canvasElement.querySelector<HTMLElement>('[data-slot="context-chip"] span.truncate')!;
    const turn = canvasElement.querySelector<HTMLElement>('[data-slot="chat-shell-turn-body"]')!;

    await expect(
      [
        `title clipped: ${clipped(title)}`,
        `thread clipped: ${clipped(threadTitle)}`,
        `chip clipped: ${clipped(chipLabel)}`,
        `turn clipped: ${clipped(turn)}`,
      ].join(" · "),
    ).toBe("title clipped: false · thread clipped: true · chip clipped: true · turn clipped: false");

    // The topbar title is not clipped at the gate's 1200px — a 70-character
    // title fits a 944px strip — but it is *set up* to clip, and the sidebar
    // is what decides when. Asserted as machinery rather than as an outcome,
    // so the story says which of the two it measured.
    const titleStyle = getComputedStyle(title);
    await expect(`${titleStyle.overflow}/${titleStyle.textOverflow}/${titleStyle.whiteSpace}`).toBe(
      "hidden/ellipsis/nowrap",
    );

    // The turn wraps instead: a Range over its contents reports more than one
    // line box. (`getClientRects()` on the block itself returns its border box
    // and would answer a different question.)
    const turnRange = document.createRange();
    turnRange.selectNodeContents(turn);
    await expect(`turn line boxes: ${turnRange.getClientRects().length > 1}`).toBe("turn line boxes: true");

    // The tail of a truncated chip is unavailable to a sighted user — no
    // `title`, no tooltip — while the accessible name keeps the whole string.
    await expect(chipLabel.getAttribute("title")).toBeNull();
    await expect(chipLabel.closest("[data-slot='context-chip']")!.textContent).toContain(
      "legal-annotations.pdf",
    );

    // Nothing pushes the shell sideways.
    const shell = canvasElement.querySelector<HTMLElement>('[data-slot="chat-shell"]')!;
    await expect(`shell scrolls sideways: ${shell.scrollWidth > shell.clientWidth}`).toBe(
      "shell scrolls sideways: false",
    );

    // The LTR frame for the two `pl-` → `ps-` swaps.
    const row = canvasElement.querySelector<HTMLElement>('[data-region="topbar"]')!;
    const bar = canvasElement.querySelector<HTMLElement>('[data-slot="app-topbar"]')!;
    const rowStyle = getComputedStyle(row);
    const barStyle = getComputedStyle(bar);
    await expect(
      `row ${rowStyle.paddingLeft}/${rowStyle.paddingRight} bar ${barStyle.paddingLeft}/${barStyle.paddingRight}`,
    ).toBe("row 8px/0px bar 4px/12px");
  },
};

/**
 * 375×812, and the width wrapper the other twelve waves used would have proved
 * nothing here.
 *
 * B1's drawer swap keys on a viewport media query — `useIsMobile` subscribes to
 * `matchMedia("(max-width: 767px)")` — so a `w-[375px]` box renders the desktop
 * rail inside it and reports success. `page.viewport(375, 812)` resizes the
 * test iframe itself, which moves `window.innerWidth`, flips the media query
 * and makes React re-render into the other branch. The story asserts the
 * before-and-after on purpose: the rail is present at the gate's 1200px and
 * absent at 375px, which is the difference between the two techniques stated
 * as a measurement rather than as advice.
 *
 * `@vitest/browser/context` is imported *inside* the play rather than at the
 * top of the file. Its real module throws on evaluation outside Browser Mode
 * ("vitest/browser can be imported only inside the Browser Mode") — Vitest
 * swaps in a virtual module, and nothing else does. A static import would
 * therefore blank this story's canvas in the Storybook UI and in
 * `storybook build`'s output, where no such swap happens. A dynamic import is
 * resolved by the same plugin under the gate and is simply never reached
 * anywhere else.
 *
 * What the narrow layout is: no rail, no reserved column, the stream and
 * composer at full width, and the topbar trigger as the only way into the
 * history. The drawer is opened and closed here, so the trigger is proved to
 * be that way in rather than assumed to be, and the play does not return with
 * a sheet mid-dismissal for axe to scan.
 *
 * **This story found the last registry surface still animating under reduced
 * motion, and it is now fixed and guarded here.** `components/ui/sheet.tsx` put
 * `transition duration-200` on the panel and `transition-opacity duration-150`
 * on the backdrop with no `motion-reduce:transition-none` on either, and the
 * `side=left` panel's starting style is `translate-x-[-2.5rem]` — a 40px slide,
 * which is motion by the convention's own test rather than a colour crossfade.
 * It went unfound because nothing could reach this surface before: the drawer
 * branch requires a real viewport media query, so every width-wrapper story in
 * seven waves rendered the desktop rail instead. The fix belongs in the
 * vendored file, which every sheet consumer shares, so the integrator took it
 * in both copies; the play below asserts `transition-property: none` on both
 * halves, which is the value the fix changes.
 *
 * The resize does not leak: `LongContent` above and `Boundary` below both read
 * 1200px back, and `LongContent`'s own assertions depend on it.
 */
export const Mobile: Story = {
  args: FULL_ARGS,
  play: async ({ canvasElement }) => {
    const { page } = await import("vitest/browser");
    const body = within(document.body);
    const railAt = () => canvasElement.querySelector('[data-slot="app-sidebar"]');

    // Before: the desktop branch, at the width the gate renders everything at.
    await expect(
      `innerWidth ${window.innerWidth} · rail ${railAt() !== null} · narrow ${matchMedia("(max-width: 767px)").matches}`,
    ).toBe("innerWidth 1200 · rail true · narrow false");

    await page.viewport(375, 812);

    await waitFor(() =>
      expect(
        `innerWidth ${window.innerWidth} · rail ${railAt() !== null} · narrow ${matchMedia("(max-width: 767px)").matches}`,
      ).toBe("innerWidth 375 · rail false · narrow true"),
    );
    // The reserved column goes with it, which is what gives the stream the
    // full width rather than 375 minus a rail.
    await expect(canvasElement.querySelector('[data-slot="sidebar-gap"]')).toBeNull();

    const shell = canvasElement.querySelector<HTMLElement>('[data-slot="chat-shell"]')!;
    const stream = canvasElement.querySelector<HTMLElement>('[data-region="message-stream"]')!;
    const composer = canvasElement.querySelector<HTMLElement>('[data-region="composer"]')!;
    await expect(
      [
        `shell ${Math.round(shell.getBoundingClientRect().width)}`,
        `stream ${Math.round(stream.getBoundingClientRect().width)}`,
        `composer ${Math.round(composer.getBoundingClientRect().width)}`,
      ].join(" · "),
    ).toBe("shell 375 · stream 375 · composer 375");

    // Nothing scrolls sideways — not the document, not the shell, not the
    // stream that holds the artifact cards.
    await expect(
      [
        `document ${document.documentElement.scrollWidth <= 375}`,
        `shell ${shell.scrollWidth <= shell.clientWidth}`,
        `stream ${stream.scrollWidth <= stream.clientWidth}`,
      ].join(" · "),
    ).toBe("document true · shell true · stream true");

    // The topbar trigger is the only way into the history now, so it had
    // better open something.
    const trigger = canvasElement.querySelector<HTMLElement>('[data-slot="sidebar-trigger"]')!;
    await userEvent.click(trigger);
    const drawer = await waitFor(() => {
      const el = document.querySelector<HTMLElement>('[data-slot="sidebar"][data-mobile="true"]');
      expect(el).not.toBeNull();
      return el!;
    });
    // The fix this story found, guarded. The drawer used to fade and slide in
    // under `prefers-reduced-motion: reduce` — `components/ui/sheet.tsx`
    // transitioned the panel and its backdrop with no
    // `motion-reduce:transition-none` on either, and the side=left panel's
    // starting style is a 40px translate, so it was motion by the convention's
    // own test rather than a colour crossfade. Reachable only once the viewport
    // has actually moved, which is why seven waves missed it.
    //
    // Read as `transition-property`, not `transition-duration`: the fix sets
    // the property list to `none` and leaves `0.2s`/`0.15s` in place, so a
    // duration check would keep passing after a revert and prove nothing. This
    // form was watched fail on a reverted class before it was kept.
    const backdrop = document.querySelector<HTMLElement>('[data-slot="sheet-overlay"]');
    await expect(
      `panel ${getComputedStyle(drawer).transitionProperty} · backdrop ${backdrop ? getComputedStyle(backdrop).transitionProperty : "missing"}`,
    ).toBe("panel none · backdrop none");

    // Let it settle before asserting anything about what is on screen, and
    // before the play returns — axe scans a fading panel at its transitional
    // opacity otherwise.
    const drawerRow = within(drawer).getByRole("button", { name: "Brand audit for Northwind" });
    await waitFor(() => expect(getComputedStyle(drawer).opacity).toBe("1"));
    await expect(drawerRow).toBeVisible();

    await userEvent.keyboard("{Escape}");
    await waitFor(() =>
      expect(document.querySelector('[data-slot="sidebar"][data-mobile="true"]')).toBeNull(),
    );
  },
};

/**
 * Beside its nearest neighbour, O13 `notebook-shell`. Both are a conversation
 * with a composer, both keep what the conversation produced on the same page,
 * and they are not interchangeable.
 *
 * **The choosing rule is where the output lives, and it follows from where the
 * input came from.** In O2 the artifacts are cards *inside* the stream, so the
 * conversation is the index of everything it made and history is the only
 * navigation the page needs. In O13 the outputs are a third pane driven by a
 * menu of types, because the notebook is grounded in sources the user supplied
 * first — the left pane is the input and the right pane is a menu, and the
 * chat is what connects them. Pick O2 when the conversation is the product.
 * Pick O13 when the user brings a corpus and the answers have to cite it.
 * O9 `artifact-shell` is the third point on the same axis and is not rendered
 * here: it is the index O2's cards open *into*, a separate destination for
 * when there are more artifacts than one session's worth.
 *
 * The structural difference is asserted rather than described, because it is
 * the part a refactor would quietly lose: O2's artifact region is a
 * *descendant* of its message stream and O13's outputs pane is a *sibling* of
 * its chat pane. Move either one and the shell has become the other.
 *
 * Both are live, not screenshots, so axe sees two shells' worth of landmarks
 * at once — which is its own check: `landmark-unique` is a rule H5
 * `frame-strip` tripped by rendering two of itself, and two different shells on
 * one page is the shape a real product with an embedded assistant reaches.
 * Nothing fires; two shells coexist.
 *
 * **Found while writing this, and belonging to O13 — the latent
 * `scrollable-region-focusable` failure is real and now measured.** O2's block
 * brief predicted it for "any stream genuinely empty of controls": AI
 * Elements' `Conversation` carries the region's tab stop and accessible name,
 * while the element that actually scrolls is one `use-stick-to-bottom` owns
 * inside it. Rendering O13 here with a single plain user turn failed axe
 * outright — `div[data-region="chat"] > .overflow-y-auto.h-full`, "Scrollable
 * region must have keyboard access" — because that inner element scrolled with
 * no focusable descendant. The fixture now carries a grounded answer, whose K6
 * citations are focusable, which is both what O13 is *for* and the reason the
 * defect stays latent in practice. It is the fifth instance of this shape in
 * the registry after `shortcuts-sheet`, the `data-views` kanban, the vendored
 * table and `run-inspector`. O2 is in the same position and survives for the
 * same reason: its stream holds N1's thumbs and J4's cards.
 */
export const Boundary: Story = {
  args: FULL_ARGS,
  render: (args) => (
    <div className="flex h-full w-full">
      <div className="h-full w-1/2 border-e" data-testid="o2">
        <ChatShell {...args} />
      </div>
      <div className="h-full w-1/2" data-testid="o13">
        <NotebookShell
          sources={[
            {
              id: "q3-report",
              name: "Q3-report.pdf",
              meta: "PDF · 2.4 MB",
              stage: "ready",
              chunkCount: 184,
            },
          ]}
          messages={[
            {
              id: "m1",
              role: "user",
              content: "What did we commit to on pricing, and where is that written down?",
            },
            // A grounded answer, not a plain turn, and deliberately: see the
            // note in this story's description about O13's chat pane.
            {
              id: "m2",
              role: "assistant",
              claims: [
                {
                  id: "c1",
                  text: "The commitment is a flat per-seat price held for the first twelve months.",
                  citations: [
                    {
                      id: "x1",
                      label: "1",
                      sourceId: "q3-report",
                      quote: "Per-seat pricing is fixed for the first four quarters of any new contract.",
                    },
                  ],
                },
              ],
            },
          ]}
          outputTypes={[
            {
              id: "audio",
              title: "Audio Overview",
              description: "Two hosts talk through everything you have added.",
            },
          ]}
        />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const o2 = canvasElement.querySelector<HTMLElement>('[data-testid="o2"]')!;
    const o13 = canvasElement.querySelector<HTMLElement>('[data-testid="o13"]')!;

    const stream = o2.querySelector<HTMLElement>('[data-region="message-stream"]')!;
    const artifacts = o2.querySelector<HTMLElement>('[data-region="artifact-cards"]')!;
    const chat = o13.querySelector<HTMLElement>('[data-region="chat"]')!;
    const outputs = o13.querySelector<HTMLElement>('[data-region="studio-outputs"]')!;

    await expect(
      [
        `O2 artifacts inside the stream: ${stream.contains(artifacts)}`,
        `O13 outputs inside the chat: ${chat.contains(outputs)}`,
      ].join(" · "),
    ).toBe("O2 artifacts inside the stream: true · O13 outputs inside the chat: false");

    // Both shells put a composer at the bottom of their conversation, which is
    // the thing they genuinely share and the reason they get confused.
    await expect(o2.querySelector('[data-region="composer"]')).not.toBeNull();
    await expect(o13.querySelector('[data-region="composer"]')).not.toBeNull();

    // And the viewport is back where the file's other stories expect it.
    await expect(window.innerWidth).toBe(1200);
  },
};

/* -------------------------------------------------------------------------
 * Beyond the eight: one open follow-up from CONTINUE.md §8, closed.
 * ---------------------------------------------------------------------- */

/**
 * The shell at 600px tall — shorter than any viewport, which is the ordinary
 * embedded case and the one that used to hide the sidebar's bottom slots.
 *
 * `CONTINUE.md` §8 records that this assertion existed only on `HomeShell` and
 * that `chat-shell` "forwards `sidebarFooter` to `AppSidebar`'s `footer` prop
 * identically to `HomeShell` and could reuse `EmbeddedWithSidebarFooter` almost
 * verbatim". Checked against both sources in this wave, and it is still true:
 * both pass `footer={sidebarFooter}` to `AppSidebar` unchanged, and both roots
 * carry the same `EMBEDDABLE_SHELL` + `SIDEBAR_FILLS_SHELL` pair. So this is
 * `HomeShell`'s story with the component swapped and nothing else changed.
 *
 * The assertion is geometric rather than a class check: the footer's box has
 * to sit inside the shell's box. A class assertion would pass against a
 * constant that had been deleted from the `cn()` call and left declared —
 * which is the failure mode worth guarding, because `SIDEBAR_FILLS_SHELL` is
 * the half of the fix that nothing else would notice going missing.
 *
 * The frame is queried by `data-testid`, not `canvasElement.firstElementChild`:
 * the meta decorator already wraps every story in its own `h-svh` div, so the
 * first child of the canvas is that wrapper, not this story's frame.
 */
export const EmbeddedWithSidebarFooter: Story = {
  args: FULL_ARGS,
  render: (args) => (
    <div data-testid="embedded-frame" className="h-[600px] overflow-hidden">
      <ChatShell {...args} sidebarFooter={<button type="button">Account</button>} />
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
