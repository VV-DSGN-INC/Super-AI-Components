import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  BookOpen,
  Gauge,
  Image as ImageIcon,
  Inbox,
  MessageSquare,
  Music,
  Settings,
  Sparkles,
  Type,
  Zap,
} from "lucide-react";
import * as React from "react";
import { expect, userEvent, within } from "storybook/test";

import { ModalityRail } from "@/registry/super-ai/modality-rail";
import { SidebarNav } from "@/registry/super-ai/sidebar-nav";
import type { SidebarNavProps } from "@/registry/super-ai/sidebar-nav";
import { ThreadList, ThreadListItem, ThreadListSection } from "@/registry/super-ai/thread-list";
import { SidebarNavDocs } from "@/content/components/sidebar-nav.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const meta: Meta<typeof SidebarNav> = {
  title: "Super AI/Sidebar Nav",
  component: SidebarNav,
  parameters: { layout: "centered", docs: { page: componentDocsPage(SidebarNavDocs) } },
};

export default meta;
type Story = StoryObj<typeof SidebarNav>;

export const CountBadge: Story = {
  args: {
    activeId: "chat",
    sections: [
      {
        label: "Workspace",
        items: [
          { id: "chat", label: "Chat", count: 3 },
          { id: "library", label: "Library" },
        ],
      },
    ],
  },
};

export const TierBadge: Story = {
  args: {
    activeId: "chat",
    sections: [
      {
        label: "Workspace",
        items: [
          { id: "chat", label: "Chat" },
          { id: "library", label: "Library", tier: "Pro" },
        ],
      },
    ],
  },
};

export const UnreadDot: Story = {
  args: {
    activeId: "chat",
    sections: [
      {
        label: "Workspace",
        items: [
          { id: "chat", label: "Chat" },
          { id: "inbox", label: "Inbox", unread: true },
        ],
      },
    ],
  },
};

export const Running: Story = {
  args: {
    activeId: "chat",
    sections: [
      {
        label: "Automations",
        items: [
          { id: "chat", label: "Chat" },
          { id: "runs", label: "Runs", running: true },
        ],
      },
    ],
  },
};

export const PinnedGroup: Story = {
  args: {
    activeId: "chat",
    pinned: [{ id: "home", label: "Home" }],
    sections: [
      {
        label: "Workspace",
        items: [
          { id: "chat", label: "Chat", count: 3 },
          { id: "library", label: "Library", tier: "Pro" },
        ],
      },
    ],
  },
};

/* -------------------------------------------------------------------------
 * Case stories — the situations this nav meets in a product, as opposed to
 * the trailing-slot combinations above. See
 * docs/design-system/story-conventions.md.
 *
 * Not written for this component, deliberately:
 *
 * // case-skip: EmptyLabel — label is required, and it is the row's only accessible-name source
 * `SidebarNavItemData.label` is a required `string`; `icon` is the optional
 * slot, and it renders inside an `aria-hidden` wrapper precisely so the
 * label carries the whole name. A row built with `label=""` would be an
 * unlabeled button or link — an axe `button-name`/`link-name` violation
 * shipped into a gate that runs at `test: "error"`. That failure mode
 * belongs in the docs page's donts, not in a story that asserts it renders.
 * ---------------------------------------------------------------------- */

/** The vendored `Sidebar`'s own `--sidebar-width` (16rem), not an invented number. */
const SIDEBAR_WIDTH = "w-64";

/** One realistic shell: a pinned action, a workspace group, an account group. */
const SHELL_SECTIONS: SidebarNavProps["sections"] = [
  {
    label: "Workspace",
    items: [
      { id: "chat", label: "Chat", icon: <MessageSquare />, count: 3 },
      { id: "inbox", label: "Inbox", icon: <Inbox />, unread: true },
      { id: "runs", label: "Runs", icon: <Zap />, running: true },
    ],
  },
  {
    label: "Account",
    items: [
      { id: "usage", label: "Usage", icon: <Gauge />, tier: "Pro" },
      { id: "settings", label: "Settings", icon: <Settings /> },
      { id: "docs", label: "Docs", icon: <BookOpen />, external: true, href: "#" },
    ],
  },
];

const SHELL_PINNED: SidebarNavProps["pinned"] = [{ id: "new", label: "New chat", icon: <Sparkles /> }];

/**
 * Right-to-left. Three things in a row are directional, and two of them were
 * physical properties until this story was written:
 *
 * - the trailing cluster (count, tier, unread, spinner, external glyph) is
 *   pushed to the far end by `ms-auto`, which was `ml-auto` — in RTL that
 *   pinned every badge to the *left*, on the same side as the icon;
 * - the label aligns with `text-start`, which was `text-left`;
 * - the section header is `justify-between`, which flows with direction on
 *   its own and needed nothing.
 *
 * Both swaps are byte-identical in LTR (`margin-inline-start`/`text-align:
 * start` resolve to left there), so nothing about the shipped rendering
 * changed — which is exactly what makes them mechanical rather than a
 * redesign.
 *
 * One thing is knowingly *not* mirrored: the external-link glyph is a lucide
 * arrow and still points up-and-right. Flipping it is a design call, not a
 * logical-property swap, so it is flagged here rather than fixed.
 */
export const RTL: Story = {
  args: { activeId: "chat", pinned: SHELL_PINNED, sections: SHELL_SECTIONS },
  render: (args) => (
    <div dir="rtl" className={SIDEBAR_WIDTH}>
      <SidebarNav {...args} />
    </div>
  ),
};

/**
 * The reduced-motion branch. This nav is where a running background job is
 * surfaced in the shell — `running` puts a lucide spinner in a row's
 * trailing slot — and that spinner shipped a bare `animate-spin`, making
 * `sidebar-nav` one of the fourteen animating components CONTINUE.md §9
 * records as having lost the convention. It now carries
 * `motion-reduce:animate-none`, the plain-spinner remedy that works here
 * (this is not a Base UI popup surface, so the source-order correction in
 * §9 does not apply).
 *
 * The assertion reads the computed `animation-name` back rather than
 * checking for the class, because `vitest.config.ts` emulates
 * `prefers-reduced-motion: reduce` for every test — so this is the rendered
 * behaviour, not a spelling check.
 *
 * The row's own `transition-colors` is deliberately left alone. It
 * crossfades a background and a text colour; nothing moves, nothing shifts
 * position, so suppressing it would document no branch worth a story. Same
 * call as `reset-affordance`.
 */
export const ReducedMotion: Story = {
  args: {
    activeId: "chat",
    sections: [
      {
        label: "Automations",
        items: [
          { id: "chat", label: "Chat" },
          { id: "runs", label: "Runs", running: true },
        ],
      },
    ],
  },
  play: async ({ canvasElement }) => {
    const spinner = canvasElement.querySelector('[data-slot="sidebar-nav-running"]');
    await expect(spinner).not.toBeNull();
    await expect(getComputedStyle(spinner as Element).animationName).toBe("none");
  },
};

/**
 * Tab traversal down the nav, and the highest-value story here because four
 * separate contracts only exist in this file.
 *
 * **Rows are two element types, chosen by `href`, never a dynamic tag.** A
 * row without `href` is a `<button type="button">` that calls `onSelect`; a
 * row with one is an `<a href>` that navigates, and `external` adds
 * `target="_blank"` plus `rel="noopener noreferrer"`. So a keyboard user
 * reaches "Docs" as a link and can open it in a new tab, while every other
 * row is an action.
 *
 * **The active row is marked with `aria-current="page"`**, not with the
 * `data-active` attribute alone — `data-active` is the styling hook and is
 * present on every row as `"true"`/`"false"`, so it announces nothing.
 * Exactly one row carries `aria-current`, which is what makes "you are
 * here" survive a screen reader.
 *
 * **There is no roving tabindex, and that is correct.** Nothing sets
 * `tabindex`, so document order is tab order and every row is its own stop.
 * A nav is a list of destinations, not a composite widget — arrow-key
 * navigation with a single tab stop is the `modality-rail` shape, and
 * borrowing it here would cost a keyboard user the ability to Tab straight
 * to the row they want.
 *
 * **Every row's accessible name is distinct, and the trailing marks fold
 * into it.** The unread dot and the running spinner carry `aria-label`s that
 * become part of the row's name, so "Inbox" and "Runs" announce their state
 * instead of relying on a coloured dot. Seven identically-named rows is the
 * failure this pins.
 */
export const KeyboardOrder: Story = {
  args: { activeId: "chat", pinned: SHELL_PINNED, sections: SHELL_SECTIONS },
  render: (args) => (
    <div className={SIDEBAR_WIDTH}>
      <SidebarNav {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Six actions and one link — the split is `href`, not a variant prop.
    const buttons = canvas.getAllByRole("button");
    await expect(buttons).toHaveLength(6);
    const docs = canvas.getByRole("link", { name: "Docs" });
    await expect(docs).toHaveAttribute("target", "_blank");
    await expect(docs).toHaveAttribute("rel", "noopener noreferrer");

    // Exactly one row says "you are here", and it is the active one.
    const current = canvasElement.querySelectorAll('[aria-current="page"]');
    await expect(current).toHaveLength(1);
    await expect(current[0]).toHaveAccessibleName("Chat 3");

    // Distinct names, with the trailing marks contributing their own.
    await expect(canvas.getByRole("button", { name: "Inbox Unread" })).toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: "Runs Running" })).toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: "Usage Pro" })).toBeInTheDocument();

    const rows = Array.from(canvasElement.querySelectorAll<HTMLElement>('[data-slot="sidebar-nav-item"]'));
    await expect(rows).toHaveLength(7);
    const names = rows.map((row) => row.textContent);
    await expect(new Set(names).size).toBe(7);

    // One stop per row, in document order, each visibly focused. Nothing
    // traps focus here, so the walk terminates by leaving the canvas.
    const visited: HTMLElement[] = [];
    await userEvent.tab();
    while (document.activeElement && canvasElement.contains(document.activeElement)) {
      const focused = document.activeElement as HTMLElement;
      await expect(focused.matches(":focus-visible")).toBe(true);
      const style = getComputedStyle(focused);
      await expect(style.boxShadow !== "none" || style.outlineStyle !== "none").toBe(true);
      visited.push(focused);
      await userEvent.tab();
    }
    await expect(visited).toEqual(rows);
  },
};

/** Host that owns `activeId`, so the nav has to be fed its own selection back. */
function ControlledHost() {
  const [activeId, setActiveId] = React.useState("chat");
  const [pending, setPending] = React.useState<string | null>(null);
  const [renders, setRenders] = React.useState(0);

  return (
    <div className={`${SIDEBAR_WIDTH} flex flex-col gap-3`}>
      <SidebarNav activeId={activeId} sections={SHELL_SECTIONS} onSelect={setPending} />
      <p className="text-muted-foreground text-xs">Pending: {pending ?? "none"}</p>
      <p className="text-muted-foreground text-xs">Renders: {renders}</p>
      <button
        type="button"
        onClick={() => pending && setActiveId(pending)}
        className="focus-visible:ring-ring rounded-md border px-2 py-1 text-xs focus-visible:ring-2 focus-visible:outline-none"
      >
        Apply pending selection
      </button>
      <button
        type="button"
        onClick={() => setRenders((n) => n + 1)}
        className="focus-visible:ring-ring rounded-md border px-2 py-1 text-xs focus-visible:ring-2 focus-visible:outline-none"
      >
        Re-render host
      </button>
    </div>
  );
}

/**
 * The controlled pair, driven by a host that owns the active id. This is the
 * docs page's third pitfall made runnable — "selecting a row calls
 * `onSelect`, but `activeId` doesn't update itself" — and it is asserted
 * rather than shown, because a `Controlled` story without a play function is
 * a screenshot of a prop.
 *
 * Three facts:
 *
 * 1. **`activeId` is the only source of selection.** The component holds no
 *    internal state at all — `active={item.id === activeId}` is computed on
 *    every render — so clicking "Inbox" while the host still says `chat`
 *    moves `aria-current` nowhere. Unlike a `defaultValue`-style component,
 *    there is no uncontrolled mode to fall back into.
 * 2. **`onSelect` hands back the row's `id` string**, not an event and not
 *    the label, which is exactly the payload a router or a host reducer
 *    needs. Applying that payload as the new `activeId` is what finally
 *    moves the selection.
 * 3. **An unchanged `activeId` holds the row fixed across re-renders.** The
 *    host bumps an unrelated counter; the assertion checks the counter
 *    actually advanced before checking the selection did not, so it cannot
 *    pass by the re-render never happening.
 */
export const Controlled: Story = {
  render: () => <ControlledHost />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const chat = canvas.getByRole("button", { name: "Chat 3" });
    const inbox = canvas.getByRole("button", { name: "Inbox Unread" });
    await expect(chat).toHaveAttribute("aria-current", "page");

    // 1. Interaction alone does not move the rendered selection…
    await userEvent.click(inbox);
    await expect(chat).toHaveAttribute("aria-current", "page");
    await expect(inbox).not.toHaveAttribute("aria-current");

    // 2. …but onSelect reported the row's id, which is what a host applies.
    await expect(canvas.getByText("Pending: inbox")).toBeInTheDocument();

    // 3. Re-rendering with an unchanged activeId holds the selection.
    await userEvent.click(canvas.getByRole("button", { name: "Re-render host" }));
    await expect(canvas.getByText("Renders: 1")).toBeInTheDocument();
    await expect(chat).toHaveAttribute("aria-current", "page");

    // Feeding the payload back is the only thing that moves it.
    await userEvent.click(canvas.getByRole("button", { name: "Apply pending selection" }));
    await expect(inbox).toHaveAttribute("aria-current", "page");
    await expect(chat).not.toHaveAttribute("aria-current");
  },
};

/**
 * A 90-character row label at the system's own sidebar width. Nav labels are
 * author-supplied — a saved automation or a pinned project carries whatever
 * name someone typed — so this is not a hypothetical.
 *
 * The component's answer is truncation, not wrapping: the label is
 * `min-w-0 flex-1 truncate` and the trailing cluster is `shrink-0`, so the
 * label loses its tail and the count badge survives. The alternative — a
 * label that wraps to three lines, or one that shoves the badge out of the
 * rail — is what both assertions below rule out.
 */
export const LongContent: Story = {
  args: {
    activeId: "digest",
    sections: [
      {
        label: "Automations",
        items: [
          { id: "digest", label: "Weekly competitor digest, drafted Monday and sent after review", count: 4 },
          { id: "runs", label: "Runs" },
        ],
      },
    ],
  },
  render: (args) => (
    <div className={SIDEBAR_WIDTH}>
      <SidebarNav {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const row = canvasElement.querySelector<HTMLElement>('[data-slot="sidebar-nav-item"]');
    await expect(row).not.toBeNull();

    // No icon on this row, so the label span is the row's first element.
    const label = row!.firstElementChild as HTMLElement;
    await expect(label.scrollWidth).toBeGreaterThan(label.clientWidth);

    // …and the row itself does not overflow, so the badge stays reachable.
    await expect(row!.scrollWidth).toBeLessThanOrEqual(row!.clientWidth);
  },
};

/**
 * 375px, the width a sidebar gets when it opens as a mobile drawer. Every
 * trailing signal is present at once here — count, tier, unread, spinner,
 * external glyph — because that is the state most likely to push a row past
 * the edge, and the row's only defence is `truncate` on the label plus
 * `shrink-0` on the cluster.
 *
 * Wrapper-constrained rather than `parameters.viewport`: the addon set here
 * is docs, a11y and vitest only, so a viewport parameter would render at
 * desktop width in the run that actually gates.
 */
export const Mobile: Story = {
  args: { activeId: "chat", pinned: SHELL_PINNED, sections: SHELL_SECTIONS },
  render: (args) => (
    <div className="w-[375px] max-w-full">
      <SidebarNav {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const nav = canvasElement.querySelector<HTMLElement>('[data-slot="sidebar-nav"]');
    await expect(nav).not.toBeNull();
    await expect(nav!.scrollWidth).toBeLessThanOrEqual(nav!.clientWidth);
  },
};

/**
 * The three lists that compete for the same sidebar slot. They look alike —
 * a column of rows with a trailing mark — and the rule is about what the set
 * of rows *is*:
 *
 * - **Sidebar nav** is a fixed set of destinations, authored by the product.
 *   The list is the same length tomorrow; a row is a place, and the trailing
 *   slot reports what is waiting there.
 * - **Thread list** is a growing set of user-created records. The list has
 *   no fixed length, it groups by date rather than by topic, and every row
 *   owns rename / pin / delete — which is why each row carries a second
 *   control and a per-row menu name.
 * - **Modality rail** is a tool switcher, not a list at all: a 92px column
 *   of icon-over-label targets with tooltips, where the badge slot
 *   advertises features you have not bought.
 *
 * If rows can be renamed or deleted, it is a thread list. If the column is
 * icon-first and fixed-width, it is a modality rail. If neither, it is this.
 *
 * `app-sidebar` (B1) is the fourth name in this neighbourhood and is not a
 * fourth option: it owns arrangement only — switcher, nav, promo, footer —
 * and takes whichever of these three you picked as its `nav` slot. It is
 * described rather than rendered here because it requires a
 * `SidebarProvider` shell and paints a fixed-position column, which would
 * swallow the comparison.
 *
 * One finding this arrangement surfaces, and the reason each nav below is
 * labelled: `SidebarNav` defaults to `aria-label="Sidebar"`, so a shell that
 * renders two of them (primary plus footer, say) ships two `<nav>`
 * landmarks with the same accessible name — axe's `landmark-unique` shape.
 * The default is overridable because `{...props}` spreads *after* it, and
 * the assertion below pins that ordering rather than trusting it.
 */
export const Boundary: Story = {
  render: () => (
    <div className="flex w-full max-w-3xl items-start gap-6">
      <section className={`flex ${SIDEBAR_WIDTH} shrink-0 flex-col gap-2`}>
        <p className="text-foreground text-xs font-medium">Sidebar nav — fixed destinations</p>
        <SidebarNav
          aria-label="Destinations"
          activeId="chat"
          sections={[
            {
              label: "Workspace",
              items: [
                { id: "chat", label: "Chat", icon: <MessageSquare />, count: 3 },
                { id: "inbox", label: "Inbox", icon: <Inbox />, unread: true },
                { id: "usage", label: "Usage", icon: <Gauge />, tier: "Pro" },
              ],
            },
          ]}
        />
      </section>

      <section className={`flex ${SIDEBAR_WIDTH} shrink-0 flex-col gap-2`}>
        <p className="text-foreground text-xs font-medium">Thread list — records the user made</p>
        <ThreadList aria-label="Conversations">
          <ThreadListSection label="Today">
            <ThreadListItem id="t1" title="Rewrite the onboarding email" active />
            <ThreadListItem id="t2" title="Summarize the Q3 planning doc" unread />
          </ThreadListSection>
          <ThreadListSection label="Yesterday">
            <ThreadListItem id="t3" title="Draft release notes for 2.4" />
          </ThreadListSection>
        </ThreadList>
      </section>

      <section className="flex shrink-0 flex-col gap-2">
        <p className="text-foreground text-xs font-medium">Modality rail — tools</p>
        <ModalityRail
          activeId="image"
          items={[
            { id: "image", label: "Image", icon: <ImageIcon /> },
            { id: "video", label: "Video", icon: <Sparkles />, badge: "new" },
            { id: "audio", label: "Audio", icon: <Music /> },
            { id: "text", label: "Text", icon: <Type /> },
          ]}
        />
      </section>
    </div>
  ),
  play: async ({ canvasElement }) => {
    // The default label is overridable — `{...props}` spreads after it.
    const nav = canvasElement.querySelector('[data-slot="sidebar-nav"]');
    await expect(nav).toHaveAttribute("aria-label", "Destinations");

    // …and the two nav landmarks in this canvas are named apart, which is
    // what a shell rendering both has to arrange for itself.
    const labels = Array.from(canvasElement.querySelectorAll("nav")).map((el) => el.getAttribute("aria-label"));
    await expect(labels).toHaveLength(2);
    await expect(new Set(labels).size).toBe(2);
  },
};
