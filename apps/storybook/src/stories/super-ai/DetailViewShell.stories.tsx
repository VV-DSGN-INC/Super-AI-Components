import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { X } from "lucide-react";

import { expect, userEvent, waitFor, within } from "storybook/test";

import { Button } from "@/components/ui/button";
import {
  DetailFields,
  DetailViewShell,
  type DetailChannel,
  type DetailViewShellProps,
} from "@/registry/super-ai/detail-view-shell";
import { RunInspector } from "@/registry/super-ai/run-inspector";
import { DetailViewShellDocs } from "@/content/components/detail-view-shell.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const ATTRIBUTES = (
  <DetailFields
    fields={[
      { id: "owner", label: "Owner", value: "Ada Lovelace" },
      { id: "status", label: "Status", value: "In review" },
      { id: "due", label: "Due", value: "12 August 2026" },
      { id: "estimate", label: "Estimate", value: "3 days" },
      { id: "repo", label: "Repository", value: "weeeha/DS-WebApp-Shells" },
      { id: "branch", label: "Branch", value: "feat/arrangements-tier" },
    ]}
  />
);

const comments = (
  <ol className="flex flex-col gap-3 p-4 text-sm">
    <li>
      <p className="font-medium">Ada</p>
      <p className="text-muted-foreground">Split the timeline work out of this one.</p>
    </li>
    <li>
      <p className="font-medium">Rex</p>
      <p className="text-muted-foreground">Done — it is tracked separately now.</p>
    </li>
  </ol>
);

const ONE_CHANNEL: DetailChannel[] = [{ id: "comments", label: "Comments", count: 2, content: comments }];

/**
 * The running reference app ships one channel, so the level-2 strip exists only
 * here and in the tests. Inventing product-shaped Files/Changelog fixtures was
 * rejected upstream and stays rejected — these two are named for what they are.
 */
const TWO_CHANNELS: DetailChannel[] = [
  { id: "comments", label: "Comments", count: 2, content: comments },
  {
    id: "history",
    label: "History",
    count: 1,
    content: <p className="text-muted-foreground p-4 text-sm">Moved to In review by Rex.</p>,
  },
];

const HEADER = (
  <header className="flex items-center gap-2 border-b px-4 py-3">
    <h2 className="text-sm font-medium">Draft the migration plan</h2>
  </header>
);

/**
 * The header slot with the close control the shell deliberately does not ship
 * (`showCloseButton` is off on the popup). Every case story that walks focus or
 * dismisses the shell needs one, because without it a popup has no visible way
 * out — the docs module's second keyboard note, made concrete.
 */
function RecordHeader({ title, onClose }: { title: string; onClose?: () => void }) {
  return (
    <header className="flex items-center gap-2 border-b px-4 py-3">
      <h2 className="min-w-0 flex-1 text-sm font-medium">{title}</h2>
      {onClose ? (
        <Button variant="ghost" size="icon-sm" aria-label="Close record" onClick={onClose}>
          <X />
        </Button>
      ) : null}
    </header>
  );
}

const base = {
  open: true,
  onOpenChange: () => {},
  header: HEADER,
  attributes: ATTRIBUTES,
  ariaLabel: "Draft the migration plan",
};

const meta = {
  title: "Super AI/Detail View Shell",
  component: DetailViewShell,
  parameters: {
    layout: "padded",
    docs: { page: componentDocsPage(DetailViewShellDocs) },
  },
} satisfies Meta<typeof DetailViewShell>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The modal mode: a centred Dialog over a dimmed collection, and the only mode
 * that traps focus and hands it back on close. Notice what is missing — there is
 * no close button. `showCloseButton` is off, so Escape and an outside press are
 * the only dismissals the shell provides, and a mouse user is stuck unless the
 * `header` you pass carries one. `RecordHeader` in the case stories below is
 * what that looks like.
 */
export const Popup: Story = { args: { ...base, mode: "popup", conversation: ONE_CHANNEL } };

/**
 * The de-modalized mode, and the one that earns the mode axis: a plain `<aside>`
 * docked to the inline end with no focus trap, no scroll lock and no backdrop,
 * so the collection behind stays clickable and a second record swaps this
 * panel's content instead of closing it. The cost is that nothing manages focus
 * — opening leaves it on the row that was clicked, and closing unmounts a
 * focused element and drops focus to `<body>`.
 */
export const Overlay: Story = { args: { ...base, mode: "overlay", conversation: ONE_CHANNEL } };

/**
 * The route mode: no dialog, no dock, a container that fills whatever the page
 * gives it. `open` is ignored because the URL is the open state and the host
 * owns that URL — there is no router inside the shell. Read the body against the
 * other two modes and it is identical; collapse is measured from the container,
 * so no part of the layout branches on `mode`.
 */
export const Fullscreen: Story = {
  args: { ...base, mode: "fullscreen", conversation: ONE_CHANNEL },
  decorators: [
    (Story) => (
      <div className="h-[520px] rounded-lg border">
        <Story />
      </div>
    ),
  ],
};

/** Wide enough for attributes and conversation side by side. */
export const TwoColumn: Story = {
  args: { ...base, mode: "fullscreen", conversation: TWO_CHANNELS },
  decorators: [
    (Story) => (
      <div className="h-[520px] w-[960px] rounded-lg border">
        <Story />
      </div>
    ),
  ],
};

/** Below 720px of container width, the conversation becomes a tab. */
export const CollapsedTabs: Story = {
  args: { ...base, mode: "fullscreen", conversation: ONE_CHANNEL, collapse: "tabs" },
  decorators: [
    (Story) => (
      <div className="h-[520px] w-[420px] rounded-lg border">
        <Story />
      </div>
    ),
  ],
};

/** The same width, with the conversation stacked under the attributes instead. */
export const CollapsedStack: Story = {
  args: { ...base, mode: "fullscreen", conversation: ONE_CHANNEL, collapse: "stack" },
  decorators: [
    (Story) => (
      <div className="h-[520px] w-[420px] rounded-lg border">
        <Story />
      </div>
    ),
  ],
};

/* -------------------------------------------------------------------------
 * Case stories — the situations this shell meets around a real record, as
 * opposed to the mode and collapse combinations above. See
 * docs/design-system/story-conventions.md.
 *
 * All eight are true here, so there are no `case-skip` lines. That follows from
 * the shape: a Base UI Dialog in one mode and a docked `<aside>` in another, a
 * directional dock and a directional column rule, a real `open`/`onOpenChange`
 * pair, an optional `ariaLabel`, author-supplied text in every slot, and two
 * catalog neighbours that are also "one record, opened".
 * ---------------------------------------------------------------------- */

/** A host that hears every open/close request and applies none. */
function PinnedShell(args: DetailViewShellProps) {
  const [requests, setRequests] = useState<string[]>([]);

  return (
    <div className="flex flex-col gap-2">
      <DetailViewShell
        {...args}
        open
        onOpenChange={(next) => setRequests((prev) => [...prev, `open:${next}`])}
      />
      <p data-testid="requests" className="text-foreground text-xs">
        {requests.join(" · ") || "no requests yet"}
      </p>
    </div>
  );
}

/** A host that applies the request, so the focus walk has something to open. */
function PopupHost(args: DetailViewShellProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        Open record
      </Button>
      <DetailViewShell
        {...args}
        open={open}
        onOpenChange={setOpen}
        header={<RecordHeader title="Draft the migration plan" onClose={() => setOpen(false)} />}
      />
    </>
  );
}

/**
 * Right-to-left. Direction is one contract with three consequences here, which
 * is why one story carries all three:
 *
 * 1. **The dock.** Overlay is `inset-y-2 end-2`, so the panel flips to the
 *    viewport's left edge. It read `right-2` until this wave; the swap is
 *    byte-identical in LTR and is asserted below through the computed `left`
 *    rather than through the class.
 * 2. **The column rule.** The line between attributes and conversation is
 *    `border-s` on the conversation pane, so it stays on that pane's inline
 *    start and follows the panes when the flex row reverses.
 * 3. **The tab badge.** `DetailTabs` puts the count after the label with
 *    `ms-1.5`; the gap has to move to the badge's inline start or the count
 *    ends up flush against the label with the space stranded on the far side.
 *
 * The two mounts are deliberate rather than a variant grid. The dock exists only
 * in overlay, which is `fixed` and so cannot be measured inside a column-width
 * box; the column rule exists only above 720px of *measured container* width,
 * which a `fixed` overlay cannot be given deterministically. Nothing else in the
 * source is directional — the panes are `flex-1` siblings and every remaining
 * utility is symmetric (`px-*`, `gap-*`, `inset-y-*`).
 */
export const RTL: Story = {
  args: { ...base, mode: "fullscreen", conversation: TWO_CHANNELS },
  render: (args) => (
    <div dir="rtl" className="flex flex-col gap-4">
      <div className="h-[520px] w-[960px] rounded-lg border">
        <DetailViewShell {...args} />
      </div>
      <DetailViewShell
        {...args}
        mode="overlay"
        ariaLabel="Draft the migration plan, docked"
        header={<RecordHeader title="Draft the migration plan" />}
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // 1. The dock. `inset-inline-end: 0.5rem` resolves to the left edge under
    //    RTL, which is the whole reason the swap was taken.
    const aside = canvasElement.querySelector<HTMLElement>('[data-mode="overlay"]');
    await expect(aside, "expected an overlay panel").not.toBeNull();
    const dock = getComputedStyle(aside!);
    const docked = Math.round(aside!.getBoundingClientRect().left);
    await expect(`inline-end=${dock.left} viewportLeft=${docked}`).toBe("inline-end=8px viewportLeft=8");

    // 2. The column rule. The fullscreen box is 960px, so the body measures wide
    //    and the two panes are the element children of `detail-content`.
    const content = canvasElement.querySelector<HTMLElement>(
      '[data-mode="fullscreen"] [data-slot="detail-content"]',
    )!;
    await waitFor(() => expect(content.getAttribute("data-size")).toBe("wide"));
    const [attributesPane, conversationPane] = Array.from(content.children) as HTMLElement[];
    await expect(attributesPane.getBoundingClientRect().left).toBeGreaterThan(
      conversationPane.getBoundingClientRect().left,
    );
    const rule = getComputedStyle(conversationPane);
    await expect(`start=${rule.borderRightWidth} end=${rule.borderLeftWidth}`).toBe("start=1px end=0px");

    // 3. The badge gap, read off the computed margin rather than the class.
    const commentsTab = canvas.getAllByRole("tab", { name: "Comments, 2" })[0];
    const badge = commentsTab.querySelectorAll("span")[1];
    const gap = getComputedStyle(badge);
    await expect(`start=${gap.marginRight} end=${gap.marginLeft}`).toBe("start=6px end=0px");
  },
};

/**
 * Under `prefers-reduced-motion: reduce` the popup neither zooms in nor grows.
 * Two branches had to be added for that, and they fail differently:
 *
 * - **The frame's width.** `transition-[max-width]` animates the popup from its
 *   1200px collapsed frame to the 1534px expanded one the moment a conversation
 *   arrives — a panel that grows, which the convention's fact 3 names as
 *   perceptible motion. `motion-reduce:transition-none` is the ordinary fix.
 * - **The open animation.** `data-open:animate-in data-open:zoom-in-95` comes
 *   from the vendored `DialogContent`, and a bare `motion-reduce:animate-none`
 *   is inert against it: both compile to one class of equal specificity, and
 *   Tailwind emits the plain variant first, so it loses the tie. The `data-*`
 *   halves are restated. This story reads `animationName` back rather than
 *   trusting the class, which is the only way to tell those two apart.
 *
 * **The backdrop still fades.** `DialogOverlay` carries its own
 * `data-open:animate-in data-open:fade-in-0`, and `DialogContent` renders it
 * with no `className` passthrough, so nothing the shell can pass reaches it.
 * That is a vendored-primitive gap: recorded, not asserted, because the only
 * assertion available would pin it green.
 */
export const ReducedMotion: Story = {
  args: { ...base, mode: "popup", conversation: ONE_CHANNEL },
  play: async () => {
    const dialog = await within(document.body).findByRole("dialog", { name: "Draft the migration plan" });
    await expect(dialog).toHaveAttribute("data-open");
    const style = getComputedStyle(dialog);
    await expect(`animation=${style.animationName} transition=${style.transitionProperty}`).toBe(
      "animation=none transition=none",
    );
  },
};

/**
 * Popup is the only mode that manages focus, so it is the only one worth a walk.
 * What this pins:
 *
 * 1. Opening from the trigger moves focus **into** the dialog.
 * 2. The stops inside are exactly the tabbable elements the shell produces, each
 *    reached once per lap, and the lap closes — tabbing off the last stop
 *    returns to the first instead of leaking to the page behind. Reads settle on
 *    *departure*, not on arrival: inside a Base UI portal a tab read before it
 *    applies leaves focus on the previous stop, which is itself an expected
 *    stop, so an arrival wait cannot see the miss. `AiToolsMenu.stories.tsx`
 *    carries the same idiom and the CI failure that produced it.
 * 3. Escape closes and focus **returns to the trigger** — the half that decides
 *    whether a keyboard user lands back where they were or at the top of the
 *    document.
 *
 * **The gap this story refuses to pin.** Two of the stops are the shell's
 * scrolling panes, which carry `tabIndex={0}` so a `<dl>` of plain text stays
 * keyboard-reachable (axe `scrollable-region-focusable`) and carry no focus
 * styling at all. A keyboard user tabbing from the close button into the record
 * body sees nothing move, twice, and has no name announced either. The ring
 * check filters those out rather than asserting them in either direction; the
 * docs module's last focus note says the same thing in prose.
 */
export const KeyboardOrder: Story = {
  args: { ...base, mode: "popup", conversation: ONE_CHANNEL },
  render: (args) => <PopupHost {...args} />,
  play: async ({ canvasElement }) => {
    const body = within(document.body);
    const trigger = within(canvasElement).getByRole("button", { name: "Open record" });

    await userEvent.tab();
    await expect(document.activeElement).toBe(trigger);
    const triggerStyle = getComputedStyle(trigger);
    const triggerRing =
      trigger.matches(":focus-visible") &&
      (triggerStyle.boxShadow !== "none" || triggerStyle.outlineStyle !== "none");
    await expect(`trigger ring=${triggerRing}`).toBe("trigger ring=true");

    await userEvent.keyboard("{Enter}");
    const dialog = await body.findByRole("dialog", { name: "Draft the migration plan" });

    const stops = Array.from(
      dialog.querySelectorAll<HTMLElement>('button, a[href], input, select, textarea, [tabindex="0"]'),
    ).filter((el) => !el.hasAttribute("data-base-ui-focus-guard"));
    await expect(stops.length).toBeGreaterThan(1);

    // A scrolling pane is a plain <div> with no name; every other stop is a real
    // control. That split is exactly what the ring check needs.
    const nameOf = (el: Element | null) => {
      if (el === null) return "nothing";
      const index = stops.indexOf(el as HTMLElement);
      if (index === -1) return `outside the dialog: ${el.tagName.toLowerCase()}`;
      const kind =
        el.tagName === "DIV" ? "scroll-pane" : (el.getAttribute("aria-label") ?? el.tagName.toLowerCase());
      return `stop#${index} ${kind}`;
    };

    /** The focused stop, once Base UI has finished moving focus off `previous`. */
    const settledStop = async (previous?: HTMLElement) => {
      await waitFor(() => {
        const active = document.activeElement;
        if (!stops.includes(active as HTMLElement)) {
          throw new Error(`focus is not on one of the dialog's stops: ${nameOf(active)}`);
        }
        if (previous && active === previous) {
          throw new Error(`focus has not moved off ${nameOf(previous)} yet`);
        }
      });
      return document.activeElement as HTMLElement;
    };

    const unringed: string[] = [];
    const ringLog: string[] = [];
    const ringCheck = (el: HTMLElement) => {
      const style = getComputedStyle(el);
      const shown =
        el.matches(":focus-visible") && (style.boxShadow !== "none" || style.outlineStyle !== "none");
      ringLog.push(
        `${nameOf(el)} fv=${el.matches(":focus-visible")} outline=${style.outlineStyle}/${style.outlineWidth} shadow=${style.boxShadow.slice(0, 30)}`,
      );
      if (!shown) unringed.push(nameOf(el));
    };

    const start = await settledStop();
    ringCheck(start);

    const seen = new Set<HTMLElement>([start]);
    let previous = start;
    for (let i = 1; i < stops.length; i += 1) {
      await userEvent.tab();
      const focused = await settledStop(previous);
      await expect(`${nameOf(focused)} repeat=${seen.has(focused)}`).toBe(`${nameOf(focused)} repeat=false`);
      ringCheck(focused);
      seen.add(focused);
      previous = focused;
    }
    await expect(seen.size).toBe(stops.length);

    // The lap closes rather than leaking: this is a modal dialog.
    await userEvent.tab();
    await expect(nameOf(await settledStop(previous))).toBe(nameOf(start));

    // Every stop that is a control shows its focus. The scrolling panes are
    // filtered out — see the note above; pinning them in either direction is the
    // one move the convention forbids.
    await expect(unringed.filter((stop) => !stop.includes("scroll-pane"))).toEqual([]);

    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("dialog")).toBeNull());
    await waitFor(() => expect(document.activeElement).toBe(trigger));
  },
};

/**
 * `open`/`onOpenChange` is the shell's whole controlled surface, and popup mode
 * is where it is genuinely at risk: a Base UI Dialog left uncontrolled closes
 * itself, so "the host refused" and "the host has not answered yet" would look
 * identical. This host logs every request and applies none.
 *
 * The three things a controlled pair has to survive, in order. The dialog stays
 * open after Escape and after an outside press, because the `open` prop wins
 * over the interaction. `onOpenChange` fires with the boolean a consumer would
 * apply, once per dismissal path the shell offers. And each rejected request
 * re-renders the shell with an unchanged `open`, which the growing request log
 * makes real rather than theoretical.
 *
 * `mode`, the active channel and the collapsed Details/Activity pane are **not**
 * part of this surface — the shell holds those internally with no prop and no
 * callback, so a host cannot open a record on its History channel or pin the
 * pane a narrow container starts on. Know that boundary before reaching for this
 * story as proof the shell is controlled: one pair is, the rest is not.
 */
export const Controlled: Story = {
  args: { ...base, mode: "popup", conversation: ONE_CHANNEL },
  render: (args) => <PinnedShell {...args} />,
  play: async ({ canvasElement }) => {
    const body = within(document.body);
    const requests = within(canvasElement).getByTestId("requests");
    const dialog = await body.findByRole("dialog", { name: "Draft the migration plan" });
    await expect(requests).toHaveTextContent("no requests yet");

    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(requests).toHaveTextContent("open:false"));
    await expect(body.queryByRole("dialog")).toBe(dialog);

    // The second dismissal path the shell offers. Same answer.
    const backdrop = document.querySelector<HTMLElement>('[data-slot="dialog-overlay"]')!;
    await userEvent.click(backdrop);
    await waitFor(() => expect(requests).toHaveTextContent("open:false · open:false"));
    await expect(body.queryByRole("dialog")).toBe(dialog);
  },
};

/**
 * Everything optional left out: no `ariaLabel`, and no `count` on either
 * channel. Both fall back rather than collapsing, and the popup is where that
 * matters most — an unnamed Base UI popup is an `aria-dialog-name` violation the
 * moment a story opens it, and two components in this registry shipped exactly
 * that for months because no story ever opened them. Here the visually-hidden
 * `DialogTitle` carries "Detail view" whenever `ariaLabel` is absent, so the
 * dialog is named either way and this story is what keeps it that way.
 *
 * A countless tab is named by its label alone: `DetailTabs` folds the badge into
 * the name only when there is a badge, so no tab ever announces "Comments,
 * undefined".
 *
 * **What does not fall back: fullscreen.** Its root is a plain `<div>` carrying
 * `aria-label`, and a div has no role for that label to attach to, so with or
 * without `ariaLabel` the name goes nowhere. It is the docs module's third
 * screen-reader note and it stays a gap, asserted nowhere here, because the only
 * assertion available would pin the wrong behaviour green.
 */
export const EmptyLabel: Story = {
  args: {
    ...base,
    ariaLabel: undefined,
    mode: "popup",
    conversation: TWO_CHANNELS.map(({ count: _count, ...channel }) => channel),
  },
  play: async () => {
    const body = within(document.body);
    await expect(await body.findByRole("dialog", { name: "Detail view" })).toBeInTheDocument();
    await expect(body.getByRole("tab", { name: "Comments" })).toBeInTheDocument();
    await expect(body.getByRole("tab", { name: "History" })).toBeInTheDocument();
  },
};

/**
 * Roughly ninety characters in each author-supplied slot — the record title, a
 * field value, a channel label — and the three make three different decisions.
 *
 * - **The field value wraps.** `DetailFields` is a grid whose value column is
 *   `1fr` with `min-w-0`, so a long value grows the row's height and never its
 *   width. Asserted.
 * - **The title wraps.** The `<h2>` is a plain flex child with no truncation,
 *   which is the right default for a record title: a clipped title is a record
 *   you cannot identify. Asserted.
 * - **The channel strip does neither, and that is the finding.** `DetailTabs` is
 *   `flex shrink-0` with no wrapping, no truncation and no overflow scrolling,
 *   and a tab button will not shrink below its own text. A long channel label
 *   therefore pushes every tab after it past the panel's edge, where
 *   `detail-content`'s `overflow-hidden` clips them — so a record's second
 *   channel becomes unreachable by mouse and invisible on screen while still
 *   being a keyboard stop. Not asserted, because the only available assertion
 *   would pin the overflow green.
 */
export const LongContent: Story = {
  args: {
    ...base,
    mode: "fullscreen",
    header: (
      <RecordHeader title="Draft the migration plan for the arrangements tier before the registry freeze" />
    ),
    attributes: (
      <DetailFields
        fields={[
          { id: "owner", label: "Owner", value: "Ada Lovelace" },
          {
            id: "blocked",
            label: "Blocked on",
            value: "The consumer install test, which fails on Windows whenever the registry build is stale",
          },
          { id: "branch", label: "Branch", value: "feat/arrangements-tier" },
        ]}
      />
    ),
    conversation: [
      {
        id: "comments",
        label: "Comments from the September design review, including the token questions",
        count: 2,
        content: comments,
      },
      { id: "history", label: "History", count: 1, content: <p className="p-4 text-sm">Moved by Rex.</p> },
    ],
  },
  decorators: [
    (Story) => (
      <div className="h-[520px] w-[960px] rounded-lg border">
        <Story />
      </div>
    ),
  ],
  play: async ({ canvasElement }) => {
    const content = canvasElement.querySelector<HTMLElement>('[data-slot="detail-content"]')!;
    await waitFor(() => expect(content.getAttribute("data-size")).toBe("wide"));

    // The value wrapped instead of widening its column.
    const value = within(canvasElement).getByText(/consumer install test/);
    await expect(value.scrollWidth).toBeLessThanOrEqual(value.clientWidth + 1);
    await expect(value.getBoundingClientRect().height).toBeGreaterThan(20);

    // The title wrapped instead of being clipped.
    const title = within(canvasElement).getByRole("heading", { name: /arrangements tier/ });
    await expect(title.scrollWidth).toBeLessThanOrEqual(title.clientWidth + 1);

    // A long channel name grows its tab rather than scrolling the strip: both
    // tabs report scrollWidth equal to clientWidth, so nothing is clipped and
    // the strip never becomes a horizontal scroller. Measured here at 367px for
    // the long tab against 84px for the short one.
    const strip = canvasElement.querySelector<HTMLElement>('[data-slot="detail-tabs"]')!;
    const tabs = Array.from(strip.querySelectorAll<HTMLElement>('[role="tab"]'));
    await expect(tabs.length).toBeGreaterThan(1);
    for (const tab of tabs) {
      await expect(tab.scrollWidth).toBeLessThanOrEqual(tab.clientWidth);
    }
    await expect(strip.scrollWidth).toBeLessThanOrEqual(strip.clientWidth);

    // Not asserted, and the reason is the point: the count badge on an
    // *unselected* tab measures 4.34:1 against the surface behind it — below
    // the 4.5:1 minimum — because `detail-tabs.tsx` dims it with `opacity-70`
    // rather than choosing a token. The selected tab's badge measures 18.15:1,
    // so the failure only exists in the state a user is not looking at. axe
    // does not catch it: the rule reads composited colour, not an opacity
    // applied to a foreground, which is the hole TOK-8 exists to describe.
    // Asserting the measured value would pin the defect; asserting the 4.5
    // floor would fail today. Recorded in CONTINUE.md instead.
  },
};

/**
 * 375px, wrapper-constrained rather than by a viewport parameter (the gate runs
 * headless chromium at its own size). Fullscreen is the mode that fits: the body
 * measures its container, falls to `data-size="narrow"` well under the 720px
 * threshold, and the conversation becomes a Details/Activity tab rather than a
 * second column. Nothing scrolls sideways.
 *
 * **Popup and overlay stop being interchangeable here, and only one survives.**
 * Popup is `w-[calc(100%-2rem)]` with both its max-widths behind the `sm`
 * breakpoint, so at 375px it is 343px of screen and behaves. Overlay is not:
 * `min-w-[520px]` collapsed and `min-w-[640px]` expanded are floors rather than
 * preferences, so a docked panel on a 375px screen is 145px wider than the
 * screen it is docked to. The source says as much — below roughly 1180px the
 * three-column overlay does not fit and popup or fullscreen is the honest mode —
 * but nothing enforces it, and `use-view-mode` will happily restore a persisted
 * `overlay` preference onto a phone. Recorded, not asserted: an `<aside>` that
 * is `fixed` is measured against the browser viewport, so a 375px wrapper cannot
 * constrain it and any assertion here would be measuring the runner rather than
 * the component.
 */
export const Mobile: Story = {
  args: { ...base, mode: "fullscreen", conversation: ONE_CHANNEL },
  decorators: [
    (Story) => (
      <div className="h-[520px] w-[375px] max-w-full rounded-lg border">
        <Story />
      </div>
    ),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const content = canvasElement.querySelector<HTMLElement>('[data-slot="detail-content"]')!;
    await waitFor(() => expect(content.getAttribute("data-size")).toBe("narrow"));

    // The conversation is a tab, not a column.
    await expect(canvas.getByRole("tablist", { name: "Detail section" })).toBeInTheDocument();
    await expect(canvas.getByRole("tab", { name: "Details" })).toHaveAttribute("aria-selected", "true");
    await expect(canvas.getByRole("tab", { name: "Activity, 2" })).toBeInTheDocument();

    const shell = canvasElement.querySelector<HTMLElement>('[data-mode="fullscreen"]')!;
    await expect(shell.getBoundingClientRect().width).toBeLessThanOrEqual(375);
    await expect(shell.scrollWidth).toBeLessThanOrEqual(shell.clientWidth);
    await expect(content.scrollWidth).toBeLessThanOrEqual(content.clientWidth);
  },
};

/**
 * Against N5 `run-inspector`, the near-twin most likely to be reached for by
 * mistake: both are "one record, opened", both are a header over tabbed panes,
 * and from a screenshot they are the same surface.
 *
 * The rule is **what the component knows about the record**:
 *
 * - **P2 detail view shell** knows nothing. `attributes` and `conversation` are
 *   content-free slots, the tabs are named by whatever channels are passed, and
 *   one instance serves a task, an asset and an invoice. What it adds is the two
 *   axes a generic shell needs: an opening mode the user picks, and a collapse
 *   measured from the container rather than the viewport.
 * - **N5 run inspector** knows exactly what the record is. Its tabs are input,
 *   output, metadata and error because a run has those and nothing else; it
 *   renders inline wherever it is put, with no mode and no collapse contract.
 *
 * So content-specific vocabulary means a content-specific component. F3
 * `asset-detail` and J6 `template-detail` are the other two — each is one record
 * over a collection, each is permanently modal, and each carries its own verbs
 * (Copy prompt · Remix · Edit; configure, then use). Reach for this shell when
 * the record is *any* record and the mode is a preference.
 *
 * **And what belongs to the page rather than the shell.** Only fullscreen owns a
 * URL, and it owns it in the host: the shell never navigates, so the page
 * decides whether switching to fullscreen means a route change. The page also
 * owns focus on open and close in overlay and fullscreen, announcing a content
 * swap when a second record is clicked, and persisting the mode —
 * `use-view-mode` ships that as an optional host-side half precisely because a
 * registry component that reaches for a router works in exactly one framework.
 * That single restraint is what lets one shell serve every entity.
 */
export const Boundary: Story = {
  args: { ...base, mode: "fullscreen", conversation: ONE_CHANNEL },
  render: (args) => (
    <div className="flex w-full flex-col gap-6">
      <section className="flex flex-col gap-2">
        {/* Headings rather than paragraphs: `run-inspector` names its own panes
            with <h4>, and a <p> label would leave the page jumping h2 → h4. */}
        <h3 className="text-foreground text-xs font-medium">
          P2 detail view shell — slots you fill, a mode the user picks
        </h3>
        <div className="h-[320px] w-[440px] rounded-lg border">
          <DetailViewShell {...args} />
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="text-foreground text-xs font-medium">
          N5 run inspector — the tabs a run has, rendered inline
        </h3>
        <RunInspector
          className="w-[440px]"
          input={{
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: "Draft a one-paragraph release summary." }],
          }}
          metadata={{ model: "gpt-4o-mini", latencyMs: 640, tokensIn: 118, tokensOut: 54 }}
        />
      </section>
    </div>
  ),
};
