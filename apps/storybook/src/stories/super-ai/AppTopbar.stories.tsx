import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { Bold, Highlighter, Italic, Link2 } from "lucide-react";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { Button } from "@/components/ui/button";
import { AccountMenu } from "@/registry/super-ai/account-menu";
import { AppTopbar } from "@/registry/super-ai/app-topbar";
import { ContextToolbar, type ContextToolbarAction } from "@/registry/super-ai/context-toolbar";
import { SectionHeader } from "@/registry/super-ai/section-header";
import { AppTopbarDocs } from "@/content/components/app-topbar.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const meta: Meta<typeof AppTopbar> = {
  title: "Super AI/App Topbar",
  component: AppTopbar,
  parameters: { layout: "centered", docs: { page: componentDocsPage(AppTopbarDocs) } },
};

export default meta;
type Story = StoryObj<typeof AppTopbar>;

export const DocumentContext: Story = {
  args: {
    context: "document",
    title: "Q3 Roadmap",
    breadcrumb: [
      { label: "Projects", href: "#" },
      { label: "Marketing", href: "#" },
      { label: "Q3 Roadmap" },
    ],
    privacy: { label: "Private" },
    savedLabel: "Last saved 5 days ago",
  },
};

export const EditorContext: Story = {
  args: {
    context: "editor",
    title: "Untitled scene",
    zoomLabel: "100%",
    canUndo: true,
    canRedo: false,
  },
};

export const PrivacyChip: Story = {
  args: {
    context: "document",
    title: "Q3 Roadmap",
    breadcrumb: [{ label: "Projects", href: "#" }, { label: "Q3 Roadmap" }],
    privacy: { label: "Team" },
  },
};

export const SavedState: Story = {
  args: {
    context: "document",
    title: "Q3 Roadmap",
    breadcrumb: [{ label: "Projects", href: "#" }, { label: "Q3 Roadmap" }],
    savedLabel: "Last saved 5 days ago",
  },
};

/* -------------------------------------------------------------------------
 * Case stories — the situations this component meets in a product, as
 * opposed to the prop combinations above. See
 * docs/design-system/story-conventions.md for which of the eight apply.
 *
 * Not written for this component, deliberately:
 *
 * // case-skip: ReducedMotion — the bar declares no motion; the only movement in the tree is the shared Button primitive's 1px press
 * `app-topbar.tsx` contains no `animate-*`, no keyframe, no transform and no
 * `transition-*` anywhere. Two vendored primitives it composes carry timed
 * declarations: `BreadcrumbLink`'s `transition-colors` on hover, which is a
 * colour cross-fade that moves nothing (the `reset-affordance` precedent
 * this convention already records), and `Button`'s `transition-all` paired
 * with `active:not-aria-[haspopup]:translate-y-px` — a one-pixel press
 * depression that lasts only while the pointer is down. Suppressing the
 * latter would mean adding `motion-reduce:transition-none` to this
 * component's four zoom/history buttons alone, which does not document a
 * branch B7 owns; it makes one component's press feedback differ from every
 * other button in the registry. A story here would render identically to
 * `EditorContext`.
 * ---------------------------------------------------------------------- */

const CRUMBS = [
  { label: "Projects", href: "#" },
  { label: "Marketing", href: "#" },
  { label: "Q3 Roadmap" },
];

/**
 * B8 `account-menu` needs a host for its theme/background pair, so the
 * trailing slot is a component rather than an inline element. This is what
 * `actions` really carries in a shell: a share affordance and the account
 * entry, in that order.
 */
function TopbarActions() {
  const [theme, setTheme] = React.useState("system");
  const [background, setBackground] = React.useState("default");

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => {}}>
        Share
      </Button>
      <AccountMenu
        user={{ name: "Ada Lovelace", email: "ada@example.com" }}
        theme={theme}
        onThemeChange={setTheme}
        background={background}
        onBackgroundChange={setBackground}
        onSignOut={() => {}}
      />
    </>
  );
}

/**
 * Right-to-left, in both configurations, because they fail differently and
 * a topbar is the most direction-sensitive layout in the catalog.
 *
 * **What the component gets right, for free.** Nothing in `app-topbar.tsx`
 * is physically directional — `px-3`, `gap-3` and `border-b` are all either
 * logical or block-axis — so the two regions simply mirror: the breadcrumb
 * and privacy chip land at the right edge where reading now starts, and the
 * saved-state and actions land at the left. That is the one thing asserted
 * below, because it is the half that is correct and should stay correct.
 *
 * **Two defects, recorded rather than fixed. Both live in vendored
 * primitives this component only composes, and both are visible here.**
 *
 * 1. `BreadcrumbSeparator` draws a bare `ChevronRightIcon`
 *    (`components/ui/breadcrumb.tsx`). Its computed `transform` reads
 *    `none` in this story, so it does not mirror: under RTL the chevrons
 *    point back along the path they are meant to lead down, and the
 *    ancestor chain reads as though it ran the other way. The fix is
 *    `rtl:-scale-x-100` or an equivalent, which is exactly the
 *    icon-mirroring idiom `CONTINUE.md` §8 holds open as a decision (N11
 *    `escalation-handoff`'s `ArrowRight`, same shape): it appears nowhere
 *    in the registry and *is* a visible change, so it is not a
 *    compile-identical swap that can be taken in passing.
 *
 * 2. `ButtonGroup`'s seam styling is physical
 *    (`components/ui/button-group.tsx`): `rounded-r-none` on every child,
 *    `rounded-r-lg` back on the last, `rounded-l-none` + `border-l-0` on
 *    every child after the first. Flex reverses the children under RTL and
 *    the CSS does not follow. Measured on the zoom group in this story,
 *    where Zoom out paints rightmost at x=472 and Zoom in leftmost at
 *    x=394: the group's right outer corner is square
 *    (`border-top-right-radius: 0`) while the interior seam beside it is
 *    rounded to 8px, the left outer corner is square while *its* interior
 *    seam is rounded to 10px, and `border-left-width` is 0 on the leftmost
 *    child — so the group loses its outer left border and doubles the seam
 *    on the right. Every corner and every border is on the wrong side of
 *    the control it belongs to. The swap is `rounded-e-*` / `rounded-s-*` /
 *    `border-s-0`, which *is* byte-identical in LTR — but it belongs to the
 *    shadcn primitive shared by every button group in the registry, not to
 *    B7.
 *
 * Neither is asserted. Pinning "the chevron points the wrong way" would go
 * red the day someone fixes it.
 *
 * **A third thing this story found, which has nothing to do with
 * direction.** Showing two bars at once is what surfaced it: B7's root is a
 * bare `<header>`, so its landmark role is decided entirely by where the
 * caller puts it. Standing on its own — as in every other story in this
 * file — it maps to `banner`. Two of them in one document is an axe failure
 * on both `landmark-no-duplicate-banner` and `landmark-unique`, and the
 * component offers no remedy: there is no label prop, `aria-label` reaches
 * the header only through the props spread, and naming the landmarks would
 * not satisfy the duplicate-banner rule anyway. Inside the four shells that
 * actually compose it the question never arises, because `SidebarInset`
 * renders `<main>` and a `<header>` descended from `main` maps to no role at
 * all. That is the nesting reproduced below: each bar sits in an unnamed
 * `<section>`, a sectioning element that suppresses the banner mapping and,
 * being unnamed, contributes no landmark of its own. Worth knowing before
 * anyone puts a second B7 on a page that has no `<main>` around it.
 */
export const RTL: Story = {
  render: () => (
    <div dir="rtl" className="flex w-full max-w-lg flex-col gap-6">
      <section data-testid="rtl-document">
        <AppTopbar
          context="document"
          title="Q3 Roadmap"
          breadcrumb={CRUMBS}
          privacy={{ label: "Private" }}
          savedLabel="Last saved 5 days ago"
        />
      </section>
      <section data-testid="rtl-editor">
        <AppTopbar
          context="editor"
          title="Harbour at dawn"
          zoomLabel="100%"
          onZoomIn={() => {}}
          onZoomOut={() => {}}
          onUndo={() => {}}
          onRedo={() => {}}
          savedLabel="Saved just now"
        />
      </section>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const documentBar = canvas.getByTestId("rtl-document");

    const leading = documentBar.querySelector('[data-slot="app-topbar-leading"]');
    const trailing = documentBar.querySelector('[data-slot="app-topbar-trailing"]');

    // The regions swapped sides — the whole of the direction contract this
    // component owns, and the one part a future layout change could break
    // silently.
    await expect(leading).not.toBeNull();
    await expect(trailing).not.toBeNull();
    await expect(
      leading!.getBoundingClientRect().left > trailing!.getBoundingClientRect().left,
    ).toBe(true);
  },
};

/**
 * Tab traversal across the whole bar, and where focus lands when a composed
 * menu closes.
 *
 * Three facts, none of them visible from the props table:
 *
 * 1. **The crumb you are on is not a tab stop.** `BreadcrumbPage` renders a
 *    `<span role="link" aria-disabled="true">` with no `href`, so a
 *    three-crumb path yields two stops, not three. Ancestors are
 *    navigable; the current page is announced and skipped.
 * 2. **Every control in the bar carries a distinct accessible name**, across
 *    two crumb links, a component-owned action and a composed child's
 *    trigger. Names the component itself supplies cannot collide — the
 *    editor buttons hardcode their `aria-label`s with no prop to override
 *    (checked in `EmptyLabel`) — but the consumer-supplied `actions` slot
 *    can collide with anything, and nothing in this repo gates that.
 *    `getByRole` throws on more than one match, which is what makes the
 *    lookups below a duplicate-name check rather than a presence check.
 * 3. **The bar does not trap.** Tabbing past the last action leaves it.
 *
 * The walk's budget is derived from the live DOM rather than hardcoded, so
 * it stays honest if the fixture changes. Order is deliberately *not*
 * asserted: nothing here sets `tabindex`, so an order assertion would only
 * restate document order — the same claim wearing a disguise
 * (`CONTINUE.md`'s note on `gen-settings-bar`).
 *
 * The last segment is the composed-child half. B8 `account-menu` is a Base
 * UI dropdown, so it portals out of the canvas and installs a focus trap;
 * its stops belong to B8's own story, not this one. What B7 is answerable
 * for is the return: when the menu closes, focus comes back to the trigger
 * *inside this bar*, not to the top of the document. Read after a settle
 * (`waitFor`) rather than straight after the keypress — mechanical fact 4.
 */
export const KeyboardOrder: Story = {
  render: () => (
    <div className="w-full max-w-lg">
      <AppTopbar
        context="document"
        title="Q3 Roadmap"
        breadcrumb={CRUMBS}
        privacy={{ label: "Private" }}
        savedLabel="Last saved 5 days ago"
        actions={<TopbarActions />}
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const bar = canvasElement.querySelector('[data-slot="app-topbar"]') as HTMLElement;

    // 1. The current-page crumb is present, is not a link target, and is not
    //    focusable. Two of three crumbs are navigable.
    const current = canvas.getByRole("link", { name: "Q3 Roadmap" });
    await expect(current).toHaveAttribute("aria-current", "page");
    await expect(current).not.toHaveAttribute("href");

    // 2. Distinct accessible names. getByRole throws on a duplicate, so each
    //    line below is the collision check for that name.
    for (const name of ["Projects", "Marketing"]) {
      await expect(canvas.getByRole("link", { name })).toHaveAttribute("href");
    }
    for (const name of ["Share", "Account menu for Ada Lovelace"]) {
      await expect(canvas.getByRole("button", { name })).toBeInTheDocument();
    }

    // Derived from the DOM, not hardcoded: whatever is actually reachable.
    const stops = Array.from(
      bar.querySelectorAll<HTMLElement>("a[href], button:not([disabled])"),
    );
    await expect(stops.length).toBeGreaterThan(0);

    const nameOf = (el: Element | null) =>
      el === null
        ? "nothing"
        : `stop#${stops.indexOf(el as HTMLElement)} ${el.tagName}[${el.getAttribute("aria-label") ?? el.textContent?.trim().slice(0, 24) ?? ""}]`;

    const seen = new Set<HTMLElement>();
    for (let i = 0; i < stops.length; i += 1) {
      await userEvent.tab();
      const focused = document.activeElement as HTMLElement;

      await expect(`${nameOf(focused)} inBar=${bar.contains(focused)}`).toBe(
        `${nameOf(focused)} inBar=true`,
      );
      await expect(`${nameOf(focused)} repeat=${seen.has(focused)}`).toBe(
        `${nameOf(focused)} repeat=false`,
      );

      // Every stop is visibly focused, not merely focusable.
      await expect(`${nameOf(focused)} focusVisible=${focused.matches(":focus-visible")}`).toBe(
        `${nameOf(focused)} focusVisible=true`,
      );
      const style = getComputedStyle(focused);
      await expect(
        `${nameOf(focused)} ring=${style.boxShadow !== "none" || style.outlineStyle !== "none"}`,
      ).toBe(`${nameOf(focused)} ring=true`);

      seen.add(focused);
    }
    await expect(seen.size).toBe(stops.length);

    // 3. No trap: the tab after the last control leaves the bar.
    await userEvent.tab();
    await expect(bar.contains(document.activeElement)).toBe(false);

    // The composed menu's return path. B8's internal traversal is B8's story;
    // what B7 owns is that focus comes back into this bar.
    const trigger = canvas.getByRole("button", { name: "Account menu for Ada Lovelace" });
    trigger.focus();
    await userEvent.keyboard("{Enter}");
    await within(document.body).findByRole("menu");

    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(within(document.body).queryByRole("menu")).toBeNull());
    await waitFor(() => expect(document.activeElement).toBe(trigger));
    await expect(bar.contains(document.activeElement)).toBe(true);
  },
};

const ZOOM_STEPS = [50, 75, 100, 150, 200];

/**
 * A host that owns the zoom ladder and the undo stack, which is the only way
 * this component can be driven — B7 holds no state at all.
 */
function ControlledEditorHost() {
  const [stepIndex, setStepIndex] = React.useState(2);
  const [requested, setRequested] = React.useState("nothing");
  const [renderPass, setRenderPass] = React.useState(0);
  const [undoDepth, setUndoDepth] = React.useState(0);

  return (
    <div className="flex w-full max-w-lg flex-col gap-3">
      <AppTopbar
        context="editor"
        title="Harbour at dawn"
        zoomLabel={`${ZOOM_STEPS[stepIndex]}%`}
        onZoomIn={() => setRequested("in")}
        onZoomOut={() => setRequested("out")}
        canUndo={undoDepth > 0}
        canRedo={false}
        onUndo={() => setUndoDepth((depth) => Math.max(depth - 1, 0))}
        savedLabel="Saved just now"
      />
      <p className="text-muted-foreground text-xs">
        Host state — last zoom request <span data-testid="requested">{requested}</span>, undo depth{" "}
        <span data-testid="undo-depth">{undoDepth}</span>, render pass{" "}
        <span data-testid="render-pass">{renderPass}</span>
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            setStepIndex((index) => {
              if (requested === "in") return Math.min(index + 1, ZOOM_STEPS.length - 1);
              if (requested === "out") return Math.max(index - 1, 0);
              return index;
            })
          }
        >
          Apply zoom request
        </Button>
        <Button variant="outline" size="sm" onClick={() => setUndoDepth((depth) => depth + 1)}>
          Record an edit
        </Button>
        <Button variant="outline" size="sm" onClick={() => setRenderPass((pass) => pass + 1)}>
          Re-render
        </Button>
      </div>
    </div>
  );
}

/**
 * The controlled pair, and the reason this component is controlled-only.
 *
 * B7 has no `useState` anywhere: `zoomLabel` is rendered verbatim and
 * `canUndo`/`canRedo` are read straight through. There is no uncontrolled
 * mode to fall back to, which makes the props table misleading in a way only
 * a play function can correct — `zoomLabel?: string` beside
 * `onZoomIn?: () => void` reads like a component that steps its own zoom.
 * It does not. All three of the convention's clauses are checked:
 *
 * 1. **Interaction alone does not move the rendered value.** Pressing Zoom
 *    in leaves "100%" exactly where it was; the host has to apply it. This
 *    is the assertion that goes red the day someone adds internal state.
 * 2. **The callback hands back what a consumer needs — barely.** `onZoomIn`
 *    and `onZoomOut` take *no arguments at all*, so the entire payload is
 *    which of the two fired. A host wanting a step size, a target level or
 *    a pointer anchor owns all of it, which is why the ladder lives in the
 *    host below. Worth naming as a limit rather than dressing up: this is
 *    the weakest of the three clauses here, and it is weak because the API
 *    is thin.
 * 3. **An unchanged `zoomLabel` holds the readout fixed across a
 *    re-render.** The counter is checked first, so the assertion cannot pass
 *    by the re-render never happening.
 *
 * The history half answers the docs module's third pitfall directly.
 * `canUndo`/`canRedo` default to `true`, so a host that expresses "nothing
 * to undo yet" by simply omitting `onUndo` ships an enabled Undo button on a
 * pristine document. Here the flags are derived from the host's stack, and
 * the button follows it in both directions. The default itself is recorded,
 * not asserted — defaulting it to `false` would be a defensible fix, and a
 * test that pins today's default would block it.
 */
export const Controlled: Story = {
  render: () => <ControlledEditorHost />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const zoomGroup = canvasElement.querySelector('[data-slot="app-topbar-zoom"]') as HTMLElement;
    const zoomReadout = () => zoomGroup.textContent?.trim();

    await expect(zoomReadout()).toBe("100%");

    // 1. Interaction alone does not move the rendered value.
    await userEvent.click(canvas.getByRole("button", { name: "Zoom in" }));
    await expect(zoomReadout()).toBe("100%");

    // 2. …but the callback fired, and which one fired is the whole payload.
    await expect(canvas.getByTestId("requested")).toHaveTextContent("in");
    await userEvent.click(canvas.getByRole("button", { name: "Zoom out" }));
    await expect(canvas.getByTestId("requested")).toHaveTextContent("out");

    // The host applies it, and only then does the readout move.
    await userEvent.click(canvas.getByRole("button", { name: "Zoom in" }));
    await userEvent.click(canvas.getByRole("button", { name: "Apply zoom request" }));
    await expect(zoomReadout()).toBe("150%");

    // 3. Re-render with an unchanged `zoomLabel`. Check the re-render really
    //    happened first, so the assertion after it is not vacuous.
    await expect(canvas.getByTestId("render-pass")).toHaveTextContent("0");
    await userEvent.click(canvas.getByRole("button", { name: "Re-render" }));
    await expect(canvas.getByTestId("render-pass")).toHaveTextContent("1");
    await expect(zoomReadout()).toBe("150%");

    // History, host-derived in both directions.
    const undo = canvas.getByRole("button", { name: "Undo" });
    await expect(undo).toBeDisabled();
    await userEvent.click(canvas.getByRole("button", { name: "Record an edit" }));
    await expect(undo).toBeEnabled();
    await userEvent.click(undo);
    await expect(canvas.getByTestId("undo-depth")).toHaveTextContent("0");
    await expect(undo).toBeDisabled();

    // Redo is held false by the host throughout — the flags are independent.
    await expect(canvas.getByRole("button", { name: "Redo" })).toBeDisabled();
  },
};

/**
 * Every optional slot emptied: the smallest bar the types allow. `title` is
 * the only required text, and in editor context it is the only text that
 * renders at all.
 *
 * What this exposes is specific to B7 rather than generic icon-only
 * anxiety. `zoomLabel` is the *only* readout of the current zoom level —
 * drop it and `ButtonGroupText` does not render, leaving two nudge buttons
 * with a gap between them. The user can change the zoom and has no way to
 * see what they changed it to. An icon-only chip is merely unlabelled; this
 * is a control whose value is invisible.
 *
 * The four buttons are `size="icon-sm"` — `size-7`, 28×28 CSS pixels, over
 * WCAG 2.2's 24×24 minimum (2.5.8, AA) and well under the 44×44 of 2.5.5.
 * Their only accessible names are `aria-label`s the component hardcodes,
 * with no prop to override them; the loop below checks that those four names
 * are actually distinct rather than assuming it, because nothing in this
 * repo gates duplicate accessible names and four icon-only controls in one
 * row is exactly where a collision would hide.
 *
 * Also visible: `canUndo`/`canRedo` default to `true`, so this bar — a bar
 * with no history behind it, since nothing was passed — offers a live Undo.
 * Recorded, not asserted; see `Controlled`.
 */
export const EmptyLabel: Story = {
  render: () => (
    <div className="w-full max-w-lg">
      <AppTopbar context="editor" title="Untitled scene" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // getByRole throws on more than one match, so each line is the
    // duplicate-name check for that name, not just a presence check.
    for (const name of ["Zoom out", "Zoom in", "Undo", "Redo"]) {
      await expect(canvas.getByRole("button", { name })).toBeInTheDocument();
    }
    await expect(canvas.getAllByRole("button")).toHaveLength(4);

    // Nothing reports the zoom level: the readout is the omitted slot.
    const zoomGroup = canvasElement.querySelector('[data-slot="app-topbar-zoom"]') as HTMLElement;
    await expect(zoomGroup.textContent?.trim()).toBe("");
  },
};

/**
 * A ~90-character document title, in the slot that really receives one: the
 * trailing crumb of the breadcrumb.
 *
 * The component's answer is `truncate` on every crumb plus `flex-nowrap` on
 * the list, inside a leading region that is `min-w-0 flex-1`. So the path
 * never wraps to a second line — it cannot, in a bar with a fixed `h-12` —
 * and it never scrolls. It shrinks, and **it shrinks everything at once, in
 * proportion**. All three crumbs are flex items with `min-w-0` and an auto
 * basis, so flex takes the same fraction off each: measured in this 512px
 * box, "Projects" renders at 18px of its natural 53, "Marketing" at 23 of
 * 64, and the long title at 187 of 535 — every crumb kept to about 35% of
 * itself. The two ancestors would each have fitted whole in a sliver of the
 * space the title is holding, and they are cut anyway.
 *
 * The thing to notice is what *does not* happen: shadcn ships
 * `BreadcrumbEllipsis` for exactly this, and B7 does not use it. There is no
 * "Projects / … / Q3 Roadm…" collapse, no priority order, no rule that the
 * page you are on should survive at the expense of its ancestors. Three
 * proportionally-clipped crumbs is the shipped behaviour, and it is a
 * composition gap rather than a decision — recorded here because this story
 * is the only place it is visible.
 *
 * The other half of the row is the asymmetry: `app-topbar-trailing` is
 * `shrink-0` and the privacy `Badge` is `shrink-0` and `whitespace-nowrap`,
 * so a long saved-state string never truncates. Whatever the trailing side
 * costs is taken from the title, never the other way round.
 */
export const LongContent: Story = {
  render: () => (
    <div className="w-full max-w-lg">
      <AppTopbar
        context="document"
        title="Q3 Roadmap — marketing launch plan, channel budgets and open owner questions"
        breadcrumb={[
          { label: "Projects", href: "#" },
          { label: "Marketing", href: "#" },
          { label: "Q3 Roadmap — marketing launch plan, channel budgets and open owner questions" },
        ]}
        privacy={{ label: "Private" }}
        savedLabel="Last saved 5 days ago"
      />
    </div>
  ),
};

/**
 * 375px, carrying what a real shell hands it: a three-crumb path, a privacy
 * chip, a saved-state string and two trailing actions.
 *
 * **Nothing collapses, because there is no rule that could.** The component
 * has no breakpoint, no `hidden sm:*`, no priority-plus overflow and no
 * mobile branch of any kind — the two contexts are the only configurations
 * it has. What decides the outcome is one pair of classes:
 * `app-topbar-leading` is `min-w-0 flex-1` and `app-topbar-trailing` is
 * `shrink-0`. So the trailing side wins every contest. The saved-state text
 * and both action buttons keep their full width at 375px, the privacy
 * `Badge` keeps its own (`shrink-0` again), and the breadcrumb — the one
 * thing that says which document this is — absorbs the entire deficit.
 *
 * **Measured, and it is worse than "cramped".** The trailing group takes
 * 235 of the bar's 375px and the leading group is left with 104, of which
 * the privacy chip alone is 58. What remains for the path is about 34px,
 * and that is entirely its two chevron separators: all three crumbs render
 * at **zero width**. The bar at 375px shows two chevrons and the word
 * "Private", and nowhere on it does the document's name appear. A chip
 * reporting who can see a document the bar can no longer name is the sharp
 * end of `shrink-0` on the wrong side of the row.
 *
 * **Nothing becomes unreachable, though.** The cut is `truncate`, which is
 * `overflow: hidden` and not `display: none`: the ancestor crumbs keep their
 * full accessible names, keep their `href`s and keep their place in the tab
 * order, so a keyboard or screen-reader user loses nothing a sighted pointer
 * user does not. Both halves are asserted below — no horizontal scroll, and
 * the first crumb still reachable by name on the first tab.
 */
export const Mobile: Story = {
  render: () => (
    <div className="w-[375px] max-w-full">
      <AppTopbar
        context="document"
        title="Q3 Roadmap"
        breadcrumb={CRUMBS}
        privacy={{ label: "Private" }}
        savedLabel="Last saved 5 days ago"
        actions={<TopbarActions />}
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const bar = canvasElement.querySelector('[data-slot="app-topbar"]') as HTMLElement;

    // The bar fits its 375px box rather than pushing the page sideways.
    await expect(`scrollWidth=${bar.scrollWidth} clientWidth=${bar.clientWidth}`).toBe(
      `scrollWidth=${bar.clientWidth} clientWidth=${bar.clientWidth}`,
    );

    // Truncation is visual only: the path is still named and still reachable.
    const projects = canvas.getByRole("link", { name: "Projects" });
    await userEvent.tab();
    await expect(document.activeElement).toBe(projects);

    // The collapse itself is measured in the description, not asserted: every
    // crumb renders at zero width today, and any fix that gives the path back
    // some width would turn an assertion of that into a failure.
  },
};

const TEXT_SELECTION_ACTIONS: ContextToolbarAction[] = [
  { id: "bold", label: "Bold", icon: <Bold /> },
  { id: "italic", label: "Italic", icon: <Italic /> },
  { id: "link", label: "Link", icon: <Link2 /> },
  { id: "highlight", label: "Highlight", icon: <Highlighter /> },
];

/**
 * The three horizontal strips of chrome, side by side. They look alike — a
 * title or a row of small controls, laid out left to right — and the rule
 * that separates them is not what they contain but **what they speak for,
 * and how long they live**:
 *
 * - **App topbar (B7)** — speaks for the whole surface. Where you are, who
 *   can see it, whether it saved. It is there before you select anything and
 *   still there after; it is the one bar per shell, and `context` is how a
 *   document surface and an editor surface share it instead of forking into
 *   two headers that drift apart.
 * - **Context toolbar (I3)** — speaks for the current selection. It appears
 *   when something is selected, carries verbs that act on that thing, and
 *   disappears when the selection does. Its actions are transient by
 *   definition, which is why they are capped at eight and why it is drawn
 *   near the selection rather than at the top of the window.
 * - **Section header (A12)** — speaks for one group of content. It sits
 *   inside the scroll region and scrolls away with the group it names, so
 *   its title is a heading, not a location, and its action is a link ("View
 *   all"), not a verb.
 *
 * The short test is scope, then lifetime. If it describes the document, it
 * is the topbar. If it describes what you just selected, it is a context
 * toolbar. If it describes a list below it and scrolls out of view with
 * that list, it is a section header. A "chat header" is none of these — it
 * is B7 with fewer slots filled, and the catalog dropped it for that reason.
 */
export const Boundary: Story = {
  render: () => (
    <div className="flex w-full max-w-lg flex-col gap-6">
      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">
          App topbar — speaks for the whole surface, always there
        </p>
        <AppTopbar
          context="document"
          title="Q3 Roadmap"
          breadcrumb={CRUMBS}
          privacy={{ label: "Private" }}
          savedLabel="Last saved 5 days ago"
        />
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">
          Context toolbar — speaks for the selection, gone when it is
        </p>
        <ContextToolbar
          selection="text"
          actions={TEXT_SELECTION_ACTIONS}
          onAction={() => {}}
          onAiSelect={() => {}}
        />
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">
          Section header — speaks for one group, scrolls away with it
        </p>
        <SectionHeader
          title="Recents"
          count={12}
          action={
            <a href="#" className="underline underline-offset-2">
              View all
            </a>
          }
        />
      </section>
    </div>
  ),
};
