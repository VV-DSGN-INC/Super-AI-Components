import type { Meta, StoryObj } from "@storybook/react-vite";
import { Captions, Music, Scissors, Share2, Sparkles, Type as TypeTool } from "lucide-react";
import * as React from "react";
import { expect, fn, userEvent } from "storybook/test";

import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar, type AppSidebarProps } from "@/registry/super-ai/app-sidebar";
import { AppSidebarDocs } from "@/content/components/app-sidebar.docs";
import { componentDocsPage } from "@/lib/component-docs-page";
import { expectPerceptibleFocus } from "@/lib/focus-treatment";
import { ModalityRail } from "@/registry/super-ai/modality-rail";
import { SidebarNav } from "@/registry/super-ai/sidebar-nav";
import { WorkspaceSwitcher } from "@/registry/super-ai/workspace-switcher";
import { PromoCard } from "@/registry/super-ai/promo-card";

const WORKSPACES = [
  { id: "acme", name: "Acme", plan: "Pro" },
  { id: "personal", name: "Personal", plan: "Free" },
];

const NAV_SECTIONS = [
  {
    label: "Workspace",
    items: [
      { id: "chat", label: "Chat", count: 3 },
      { id: "library", label: "Library", tier: "Pro" },
      { id: "inbox", label: "Inbox", unread: true },
    ],
  },
];

// AppSidebar expects a SidebarProvider ancestor — that's mechanics the
// consumer's shell owns (see the component's own docs), not something the
// component bundles itself. Every story supplies it, with `defaultOpen`
// standing in for the shell decision between expanded and icon-rail.
function AppSidebarShell({ defaultOpen, ...args }: AppSidebarProps & { defaultOpen: boolean }) {
  return (
    <div className="h-96 w-full max-w-sm overflow-hidden rounded-lg border">
      <SidebarProvider defaultOpen={defaultOpen}>
        <AppSidebar {...args} />
        <SidebarInset className="flex items-center gap-2 p-3">
          <SidebarTrigger />
          <p className="text-muted-foreground text-sm">Main content</p>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}

const meta: Meta<typeof AppSidebar> = {
  title: "Super AI/App Sidebar",
  component: AppSidebar,
  parameters: { layout: "centered", docs: { page: componentDocsPage(AppSidebarDocs) } },
};

export default meta;
type Story = StoryObj<typeof AppSidebar>;

const FULL_ARGS: AppSidebarProps = {
  switcher: <WorkspaceSwitcher workspaces={WORKSPACES} currentId="acme" onSelect={() => {}} />,
  nav: <SidebarNav sections={NAV_SECTIONS} activeId="chat" />,
  promo: (
    <PromoCard
      flavour="upgrade"
      title="Upgrade to Pro"
      ctaLabel="Upgrade"
      onCtaClick={() => {}}
      onDismiss={() => {}}
    />
  ),
  footer: <div className="text-muted-foreground px-2 text-xs">nick@acme.com</div>,
};

export const Expanded: Story = {
  args: FULL_ARGS,
  render: (args) => <AppSidebarShell {...args} defaultOpen />,
};

export const IconRail: Story = {
  args: FULL_ARGS,
  render: (args) => <AppSidebarShell {...args} defaultOpen={false} />,
};

export const MobileDrawer: Story = {
  args: {
    switcher: <WorkspaceSwitcher workspaces={WORKSPACES} currentId="acme" onSelect={() => {}} />,
    nav: <SidebarNav sections={NAV_SECTIONS} activeId="chat" />,
  },
  render: (args) => <AppSidebarShell {...args} defaultOpen />,
  parameters: {
    // Below the sidebar's mobile breakpoint (768px) the vendored Sidebar
    // swaps to a Sheet-based drawer automatically, gated on the real browser
    // viewport width — resize the canvas below that width (or preview on a
    // narrow viewport) and use the trigger above to open it.
    viewport: { defaultViewport: "mobile1" },
  },
};

/* -------------------------------------------------------------------------
 * Case stories — the situations this component meets in a product, as opposed
 * to the prop combinations above. See docs/design-system/story-conventions.md.
 *
 * Not written for this component, deliberately:
 *
 * // case-skip: ReducedMotion — the collapse motion belongs to the vendored Sidebar, and only half of it is reachable from here
 * `app-sidebar.tsx` carries no `animate-*`, no `transition-*` and no keyframe
 * of its own. What a user perceives as motion when the sidebar collapses is
 * two elements of `components/ui/sidebar.tsx` moving together:
 * `sidebar-gap`'s `transition-[width]`, which slides the main content's edge,
 * and the sidebar container's `transition-[left,right,width]`, which moves the
 * panel. Only the second is reachable from this component — `className` lands
 * on the container — so adding `motion-reduce:transition-none` here would snap
 * the panel while the gap kept sliding the content for 200ms. That is a worse
 * artifact than the coordinated slide it replaces, so the one-class fix is
 * recorded for the vendored file rather than half-applied here.
 * ---------------------------------------------------------------------- */

/**
 * Right-to-left, and the trap is `side`. The vendored Sidebar positions its
 * fixed panel with physical offsets — `data-[side=left]:left-0`,
 * `data-[side=right]:right-0` — while the gap element that reserves the
 * panel's space is an ordinary flex child and so follows the writing
 * direction. Leave `side` at its `left` default in an RTL locale and the two
 * come apart: the gap moves to the inline start (visually right) while the
 * panel stays pinned to the physical left, over the main content.
 *
 * So the correct RTL shell passes `side="right"`, as here. That is the whole
 * finding: `side` names a physical edge, not a logical one, and nothing in
 * this repo's default direction can show that.
 *
 * The composed children need no equivalent prop, and that contrast is the
 * lesson: the switcher's avatar leads at the right edge with its plan badge
 * trailing at the left, purely because flex order follows `dir`. Placement
 * that comes from flow mirrors for free; placement that comes from a physical
 * offset has to be told.
 */
export const RTL: Story = {
  args: { ...FULL_ARGS, side: "right" },
  render: (args) => (
    <div dir="rtl">
      <AppSidebarShell {...args} defaultOpen />
    </div>
  ),
};

/**
 * The arrangement, read back as tab order. This component's entire job is the
 * order of four slots, and tab order is the only place that order is
 * observable at runtime: switcher, then every nav row, then the promo's two
 * controls. Nothing sets a positive tabindex, so document order is the
 * traversal, and a slot reordered by accident shows up here and nowhere else.
 *
 * The load-bearing stop is the one that is missing. `SidebarRail` — the
 * drag-strip along the panel's edge that this component always renders —
 * carries `tabIndex={-1}`, so the sidebar contains no collapse control a
 * keyboard user can reach. The route is `SidebarTrigger`, which lives outside
 * the sidebar in the consumer's own inset (plus the provider's Cmd/Ctrl-B
 * shortcut). That is the right call rather than a gap: the rail duplicates the
 * trigger's action, and making it tabbable would add a second stop with the
 * same name for the same effect. It is asserted here because an arrangement
 * whose only keyboard affordance sits in someone else's markup is exactly the
 * kind of thing a consumer drops.
 *
 * **Defect recorded, not asserted:** the rail and the trigger both take the
 * accessible name "Toggle Sidebar", so a screen-reader user browsing controls
 * meets it twice with no way to tell which is which. Both names live in the
 * vendored `components/ui/sidebar.tsx`, upstream of this component; the fix is
 * to name the rail for what it is (a resize handle) rather than for the action
 * it duplicates. Nothing below pins the duplication, because an assertion that
 * two controls share a name would have to be deleted to fix it.
 */
export const KeyboardOrder: Story = {
  args: FULL_ARGS,
  render: (args) => <AppSidebarShell {...args} defaultOpen />,
  play: async ({ canvasElement }) => {
    // The desktop wrapper keeps `data-slot="sidebar"`; the panel inside it is
    // relabelled `app-sidebar`, because AppSidebar's own data-slot is spread
    // onto the container after the vendored one.
    const panel = canvasElement.querySelector<HTMLElement>('[data-slot="app-sidebar"]')!;
    const rail = canvasElement.querySelector<HTMLElement>('[data-slot="app-sidebar-rail"]')!;
    const trigger = canvasElement.querySelector<HTMLElement>('[data-slot="sidebar-trigger"]')!;

    // Slot order, spelled out per slot rather than by accessible name: two nav
    // rows carry trailing badges and one carries only a dot, so names alone
    // cannot identify a stop here.
    const expected = [
      panel.querySelector<HTMLElement>('[data-slot="workspace-switcher-trigger"]')!,
      ...Array.from(panel.querySelectorAll<HTMLElement>('[data-slot="sidebar-nav-item"]')),
      panel.querySelector<HTMLElement>('[data-slot="promo-card-dismiss"]')!,
      panel.querySelector<HTMLElement>('[data-slot="promo-card-cta"]')!,
      // …and the shell's own toggle, which is outside the panel.
      trigger,
    ];
    await expect(expected.every(Boolean)).toBe(true);

    const nameOf = (el: Element | null) =>
      el === null
        ? "nothing"
        : `stop#${expected.indexOf(el as HTMLElement)} ${el.getAttribute("data-slot") ?? el.tagName}`;

    // Every tabbable control in the panel, in document order, is exactly the
    // slot sequence above — no more, no fewer, and the rail is not among them.
    const tabbable = Array.from(panel.querySelectorAll<HTMLElement>("button, a[href]")).filter(
      (el) => el.tabIndex >= 0,
    );
    await expect(tabbable.map(nameOf)).toEqual(expected.slice(0, -1).map(nameOf));
    await expect(rail.tabIndex).toBe(-1);

    // The walk: one control per tab, in that order, each one visibly focused.
    await userEvent.tab();
    for (const stop of expected) {
      const focused = document.activeElement as HTMLElement;
      await expect(nameOf(focused)).toBe(nameOf(stop));
      await expect(`${nameOf(focused)} focusVisible=${focused.matches(":focus-visible")}`).toBe(
        `${nameOf(focused)} focusVisible=true`,
      );
      // The treatment is measured rather than merely present — see
      // `expectPerceptibleFocus`.
      await expectPerceptibleFocus(focused, { label: nameOf(focused) });
      await userEvent.tab();
    }

    // Nothing here traps: the stop after the shell's toggle is outside it.
    await expect(canvasElement.contains(document.activeElement)).toBe(false);
  },
};

/**
 * The shell holds the width; the component only reacts to it. `open` /
 * `onOpenChange` is a real controlled pair, and the thing worth knowing is
 * that it is not on this component — it is on the `SidebarProvider` a
 * consumer's shell already owns. AppSidebar has no width prop at all, which
 * is the spec's first bullet ("owns arrangement, not sidebar mechanics")
 * stated as an API fact.
 *
 * The host below is a rejecting one: it records every request and re-renders
 * without applying any of them. That separates the two halves a consumer has
 * to trust — the callback carries the boolean needed to apply the change, and
 * the rendered width stays where the prop puts it until the prop moves. A
 * consumer who wires `open` and forgets `onOpenChange` ships a sidebar whose
 * toggle is inert, and this is the story that says so out loud.
 */
function PinnedWidthShell({
  onOpenChange,
  ...args
}: AppSidebarProps & { onOpenChange: (open: boolean) => void }) {
  const [renders, setRenders] = React.useState(1);
  return (
    <div className="h-96 w-full max-w-sm overflow-hidden rounded-lg border" data-renders={renders}>
      <SidebarProvider
        open={false}
        onOpenChange={(next) => {
          onOpenChange(next);
          setRenders((count) => count + 1);
        }}
      >
        <AppSidebar {...args} />
        <SidebarInset className="flex items-center gap-2 p-3">
          <SidebarTrigger />
          <p className="text-muted-foreground text-sm">Main content</p>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}

export const Controlled: StoryObj<typeof PinnedWidthShell> = {
  args: { ...FULL_ARGS, onOpenChange: fn() },
  render: (args) => <PinnedWidthShell {...args} />,
  play: async ({ args, canvasElement }) => {
    const sidebar = canvasElement.querySelector<HTMLElement>('[data-slot="sidebar"]')!;
    await expect(sidebar.dataset.state).toBe("collapsed");
    await expect(sidebar.dataset.collapsible).toBe("icon");

    // Queried by slot, not by name: the rail carries the same accessible name
    // as the trigger (see KeyboardOrder), so "Toggle Sidebar" matches two
    // controls in this shell.
    const trigger = canvasElement.querySelector<HTMLElement>('[data-slot="sidebar-trigger"]')!;
    await userEvent.click(trigger);

    // The payload a consumer needs in order to apply the change…
    await expect(args.onOpenChange).toHaveBeenCalledWith(true);

    // …the click alone moved nothing…
    await expect(sidebar.dataset.state).toBe("collapsed");

    // …and the host really did re-render while holding it there, so the width
    // held because the prop says so and not because React skipped the work.
    await expect(canvasElement.querySelector("[data-renders]")).toHaveAttribute("data-renders", "2");
  },
};

/**
 * The slots this shell does without. Every slot is a `ReactNode` and every one
 * is optional, so "no label" here means the arrangement with its text-bearing
 * slots left out — there are no text props of this component's own to empty.
 * The docs shell is exactly this shape minus the footer.
 *
 * Two things are only visible here. An omitted slot removes its wrapper
 * outright rather than rendering an empty padded box, which is why the docs
 * page's second don't can say "omit the prop" and mean it. And the padding
 * above the nav lived in the switcher's `SidebarHeader`, so without a switcher
 * the first section header sits flush against the panel's top edge —
 * `SidebarContent` contributes no padding of its own. A shell that drops the
 * switcher needs to put that breathing room back.
 *
 * Dropping *every* slot is legal too and is the one arrangement to avoid: the
 * nav wrapper is unconditional, so an AppSidebar with nothing in it still
 * renders the full 16rem panel, empty, with the pointer-only rail as its
 * only control.
 */
export const EmptyLabel: Story = {
  args: {
    nav: <SidebarNav sections={NAV_SECTIONS} activeId="chat" />,
    footer: <div className="text-muted-foreground px-2 text-xs">nick@acme.com</div>,
  },
  render: (args) => <AppSidebarShell {...args} defaultOpen />,
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('[data-slot="app-sidebar-switcher"]')).toBeNull();
    await expect(canvasElement.querySelector('[data-slot="app-sidebar-promo"]')).toBeNull();
    await expect(canvasElement.querySelector('[data-slot="app-sidebar-footer"]')).not.toBeNull();
  },
};

/**
 * Author-supplied strings in a 256px column, where the shell gives three
 * different answers at once and none of them is the component's own decision.
 * The switcher trigger truncates to a single line (`max-w-64` + `truncate`),
 * every nav row truncates the same way, and the promo card wraps instead —
 * its title and description are the only text in the panel allowed more than
 * one line.
 *
 * Read as an arrangement that is the point: the two slots at the top are
 * identity and destinations, where a clipped tail still leaves a usable row,
 * and the slot near the bottom is a sentence that has to be read to work. The
 * cost is that the switcher's plan badge is what survives truncation of a long
 * workspace name, so "Free" can end up more legible than the workspace it
 * describes.
 */
export const LongContent: Story = {
  args: {
    switcher: (
      <WorkspaceSwitcher
        workspaces={[
          { id: "personal", name: "Personal — research, drafts and scratch files", plan: "Free" },
          { id: "acme", name: "Acme", plan: "Pro" },
        ]}
        currentId="personal"
        onSelect={() => {}}
      />
    ),
    nav: (
      <SidebarNav
        activeId="renders"
        sections={[
          {
            label: "Workspace",
            items: [
              { id: "chat", label: "Chat", count: 3 },
              {
                id: "renders",
                label: "Renders awaiting review before Friday's cut, including the alternate ending",
              },
              { id: "shared", label: "Shared with me by everyone on the render team", unread: true },
            ],
          },
        ]}
      />
    ),
    promo: (
      <PromoCard
        flavour="upgrade"
        title="Upgrade to Pro to keep long renders running after this month's included minutes"
        description="Queued jobs keep their place instead of being dropped at the limit."
        ctaLabel="Upgrade"
        onCtaClick={() => {}}
        onDismiss={() => {}}
      />
    ),
    footer: <div className="text-muted-foreground px-2 text-xs">nick@acme.com</div>,
  },
  render: (args) => <AppSidebarShell {...args} defaultOpen />,
};

/**
 * 375px, and the finding is that it changes nothing. The drawer this
 * component's third width refers to is chosen by `useIsMobile`, which reads
 * the browser viewport through `matchMedia("(max-width: 767px)")` — not the
 * width of whatever box the shell was dropped into. Constrain the shell to a
 * phone's width, as here, and you still get the desktop panel; the drawer
 * arrives only when the viewport itself is narrow. That is the docs page's
 * second pitfall, rendered.
 *
 * The panel is also `position: fixed`, so it is measured against the viewport
 * rather than this frame and leaves the frame's bounds entirely. Both facts
 * point the same way: this component's widths answer to the window, and a
 * preview pane, a split view or a 375px wrapper cannot rehearse them.
 *
 * A consequence for this repo: the gate's browser is 1200px wide and
 * `parameters.viewport` does not resize it, so the `MobileDrawer` state above
 * renders the desktop panel under `pnpm test:stories` too. The drawer is
 * unreachable from any story in this file, which is recorded rather than
 * worked around.
 */
export const Mobile: Story = {
  args: FULL_ARGS,
  render: (args) => (
    <div data-mobile-frame="375" className="w-[375px] max-w-full">
      <AppSidebarShell {...args} defaultOpen />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const frame = canvasElement.querySelector<HTMLElement>("[data-mobile-frame]")!;
    await expect(frame.scrollWidth).toBeLessThanOrEqual(frame.clientWidth);

    // Still the desktop panel: a narrow container does not open the drawer.
    await expect(canvasElement.querySelector('[data-slot="app-sidebar"]')).not.toBeNull();
    await expect(document.body.querySelector('[role="dialog"]')).toBeNull();
  },
};

/**
 * The shell beside the thing that goes inside it. `app-sidebar`,
 * `sidebar-nav` (B3) and `modality-rail` (B4) are neighbours in the catalog
 * and are read as alternatives, which they never are:
 *
 * - **App sidebar** is the container. It owns which slots exist and in what
 *   order — switcher, nav, promo, footer — and nothing else. It is on the
 *   left below, with `sidebar-nav` filling its nav slot.
 * - **Sidebar nav** is one filling for that slot: the product's destinations
 *   as a labelled, sectioned list, with counts, tier badges and unread dots.
 *   It is a `<nav>` and no more; it has no idea it is in a sidebar.
 * - **Modality rail** is the other filling, for a studio shell: a 92px column
 *   of icon-over-label tools, one active at a time, with an overflow popover
 *   and a bottom-pinned group. It replaces the nav slot's contents, not the
 *   sidebar.
 *
 * So the choice is never "app-sidebar or sidebar-nav". It is: does this
 * product navigate by destination or by tool? The answer picks what goes in
 * the nav slot, and app-sidebar is the same component either way. The two
 * panels below sit side by side to be compared, not because a shell renders
 * both: B1's spec says the studio shell "swaps nav for B4", so the rail goes
 * where the list is, inside the same container.
 *
 * The shell is rendered `collapsible="none"` here so it sits in the page flow
 * next to its neighbour; at its usual `icon` setting the panel is fixed to the
 * viewport and the comparison cannot be seen side by side.
 */
export const Boundary: Story = {
  render: () => (
    <div className="flex w-full items-start gap-6">
      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">App sidebar — the container</p>
        <div className="h-80 w-64 overflow-hidden rounded-lg border">
          <SidebarProvider defaultOpen>
            <AppSidebar
              collapsible="none"
              switcher={<WorkspaceSwitcher workspaces={WORKSPACES} currentId="acme" onSelect={() => {}} />}
              nav={<SidebarNav sections={NAV_SECTIONS} activeId="chat" />}
              footer={<div className="text-muted-foreground px-2 text-xs">nick@acme.com</div>}
            />
          </SidebarProvider>
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">Modality rail — the studio shell&apos;s nav</p>
        <div className="h-80 overflow-hidden rounded-lg border">
          <ModalityRail
            activeId="edit"
            onSelect={() => {}}
            items={[
              { id: "edit", label: "Edit", icon: <Scissors /> },
              { id: "text", label: "Text", icon: <TypeTool /> },
              { id: "audio", label: "Audio", icon: <Music /> },
              { id: "captions", label: "Captions", icon: <Captions />, badge: "new" },
              { id: "effects", label: "Effects", icon: <Sparkles />, badge: "pro" },
            ]}
            pinned={[{ id: "export", label: "Export", icon: <Share2 /> }]}
          />
        </div>
      </section>
    </div>
  ),
};
