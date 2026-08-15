import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { AccountMenu, type AccountMenuItem } from "@/registry/super-ai/account-menu";
import { WorkspaceSwitcher } from "@/registry/super-ai/workspace-switcher";
import { AccountMenuDocs } from "@/content/components/account-menu.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const SAMPLE_USER = { name: "Ada Lovelace", email: "ada@example.com" };

const meta: Meta<typeof AccountMenu> = {
  title: "Super AI/Account Menu",
  component: AccountMenu,
  parameters: { layout: "centered", docs: { page: componentDocsPage(AccountMenuDocs) } },
  args: {
    user: SAMPLE_USER,
    onThemeChange: () => {},
    onBackgroundChange: () => {},
    onSignOut: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof AccountMenu>;

export const ThemeRadio: Story = {
  args: {
    theme: "dark",
    background: "default",
  },
};

export const BackgroundSwatches: Story = {
  args: {
    theme: "light",
    background: "forest",
  },
};

export const ShortcutHints: Story = {
  args: {
    theme: "system",
    background: "default",
    items: [
      { label: "Settings", shortcut: ["⌘", ","] },
      { label: "Invite people", shortcut: ["⌘", "I"] },
    ],
    signOutShortcut: ["⇧", "⌘", "Q"],
  },
};

/* -------------------------------------------------------------------------
 * Case stories — the situations this component meets in a product, as
 * opposed to the prop combinations above. See
 * docs/design-system/story-conventions.md.
 *
 * Every one of them opens the menu in a play function, and that is the point
 * rather than a chore. `AccountMenu` owns its `DropdownMenu` internally and
 * exposes no `open`/`defaultOpen`, so a story with no play function renders a
 * 32px avatar and nothing else — which is what the three declared-state
 * stories above are, and it means axe had never seen this component's popup,
 * its submenu, its radio semantics or its identity block until this block
 * existed.
 *
 * **Two defects that first run found, and the reason no story here ends with
 * the Appearance submenu open.** Rendering it open fails axe's
 * `aria-required-children` twice, and only one of the two is ours:
 *
 * 1. *The parent popup gains a child it is not allowed to have.* Base UI's
 *    `FloatingPortal` renders `<span aria-owns={portalNode.id}>` at the
 *    portal's original DOM position to keep the portaled submenu in the
 *    accessibility tree — see `floating-ui-react/components/FloatingPortal.js`.
 *    For a nested menu that position is *inside* the parent `role="menu"`, and
 *    a bare span is not one of menu's permitted owned roles. Nothing in this
 *    repo can reach it, and it is not covered by `preview.tsx`'s
 *    `[data-base-ui-focus-guard]` exclusion, which is a different span. As far
 *    as this gate is concerned, **no Base UI submenu in the registry can be
 *    rendered open**, so this is worth more than one component.
 * 2. *The submenu contains a `radiogroup`, and that one is ours.* The
 *    background swatches are the standalone Radio primitive, which the spec
 *    asks for on purpose — a swatch's checked state has to be a ring, not the
 *    menu radio's filled indicator — but `radiogroup` is not a permitted owned
 *    role of `menu` either, so the swatches sit in the menu's tree as something
 *    a menu-mode screen reader has no handling for. Fixing it means either
 *    giving up the swatch rendering or moving Appearance out of the menu, both
 *    of which are the spec's decisions to revisit, not this file's.
 *
 * So the submenu is exercised — opened, measured, asserted in, closed — and the
 * a11y snapshot each story leaves behind is the root menu. That is a smaller
 * claim than "the submenu is accessible", and it is deliberately the true one;
 * silencing either violation would need the exclusion list to grow, which it
 * may not.
 *
 * Not written for this component, deliberately:
 *
 * // case-skip: EmptyLabel — every text slot is required or defaulted, and the one icon-only target is named unconditionally
 * `user.name`, `user.email` and `item.label` are required strings;
 * `signOutLabel` defaults to "Sign out". The optional slots are not text —
 * `avatarUrl` (falls back to initials), `item.icon`, `item.shortcut` and
 * `items` itself, whose absence drops a whole group rather than emptying a
 * label. The component's only icon-only tap target is the avatar trigger, and
 * it carries `aria-label={`Account menu for ${user.name}`}` on every render,
 * so its no-text form is not an edge case — it is the shipped form, in every
 * story in this file. The remaining way in is `label=""`, a caller error that
 * would ship an axe `aria-command-name` violation into a gate running at
 * `test: "error"`.
 * ---------------------------------------------------------------------- */

/** Product actions an account menu of this kind really carries. */
const ACCOUNT_ITEMS: AccountMenuItem[] = [
  { label: "Settings", shortcut: ["⌘", ","] },
  { label: "Invite people", shortcut: ["⌘", "I"] },
  { label: "Billing" },
];

/** The component's only tab stop, and the only handle the canvas has on it. */
function triggerFor(canvasElement: HTMLElement, name = SAMPLE_USER.name) {
  return within(canvasElement).getByRole("button", { name: `Account menu for ${name}` });
}

/**
 * Opens the menu the way a person does and hands back the popup. Every case
 * story needs it, because the component owns its own `open` state.
 */
async function openMenuFrom(canvasElement: HTMLElement, name = SAMPLE_USER.name) {
  await userEvent.click(triggerFor(canvasElement, name));
  return await within(document.body).findByRole("menu");
}

/**
 * Both popups portal to the end of `document.body`, so nothing below is scoped
 * to the story canvas. The submenu is found by the slot this component names
 * rather than by role: once it is open there are two `role="menu"` elements in
 * the document and a role query would be ambiguous.
 */
function appearancePopup() {
  return document.querySelector<HTMLElement>('[data-slot="account-menu-appearance-content"]');
}

async function openAppearance() {
  await userEvent.click(await within(document.body).findByRole("menuitem", { name: "Appearance" }));
  return await waitFor(() => {
    const popup = appearancePopup();
    if (!popup) throw new Error("the Appearance submenu never opened");
    return popup;
  });
}

/**
 * Closes the submenu and leaves the root menu up. Every story that opens the
 * submenu ends with this — see the block comment above for the two
 * `aria-required-children` violations an open submenu carries, one of them
 * Base UI's and unreachable from here.
 */
async function closeAppearance(menu: HTMLElement) {
  await userEvent.keyboard("{Escape}");
  await waitFor(() => expect(appearancePopup()).toBeNull());
  await expect(menu).toBeInTheDocument();
}

/**
 * Right-to-left — the only rendering that shows what this menu does and does
 * not mirror. The submenu is opened and closed inside the play function rather
 * than left up; see the block comment for why nothing here ends with it open.
 *
 * The usual `<div dir="rtl">` wrapper cannot work: the popup portals to the end
 * of `document.body`, so a wrapper in the canvas is never an ancestor of the
 * thing under test. `dir` goes on the document element instead, the same idiom
 * `shortcuts-sheet` uses.
 *
 * What mirrors correctly, because it is CSS following the DOM's direction: the
 * identity block, every row's label, the `Theme` and `Background` headings, and
 * the keycap hints, which move to the row's new logical end. The play function
 * measures that last one rather than reading it off a class — and measuring is
 * what showed that the class is not what does it. The hint slot was moved from
 * `ml-auto` to `ms-auto` while writing this story, on the principle that a
 * component should not name a physical side; running it both ways proved the
 * margin is inert either way, because the label's `flex-1` has already absorbed
 * the free space an `auto` margin would take. The swap stays as correctness
 * insurance, not as the reason this renders right.
 *
 * What does not mirror, all of it in `components/ui/dropdown-menu.tsx`, which
 * this component consumes and does not own — recorded, not fixed:
 *
 * - `DropdownMenuSubTrigger` renders a literal `ChevronRightIcon`, so the
 *   affordance points right in every locale.
 * - `DropdownMenuSubContent` asks for `side="right"` — a *physical* side, and
 *   the request is therefore direction-blind. Base UI maps only
 *   `inline-start`/`inline-end` through direction, and reads that direction
 *   from a `DirectionProvider` context defaulting to `"ltr"` that nothing in
 *   this repo mounts (`utils/useAnchorPositioning.js`), so `dir="rtl"` on the
 *   document cannot reach it. The submenu does land on the left in this story
 *   and on the right in every LTR story in this file; since the *request* is
 *   identical in both, what moved it is the positioner's collision fallback,
 *   not the reading direction. Where there is room on the right, that is where
 *   it opens.
 * - The radio indicator is `absolute right-2` — physically right, where the
 *   RTL label now starts.
 *
 * All three are shared by every menu in the registry, which is why the fix does
 * not belong in this file.
 */
export const RTL: Story = {
  args: { theme: "light", background: "default", items: ACCOUNT_ITEMS },
  render: (args) => (
    <RtlDocument>
      <AccountMenu {...args} />
    </RtlDocument>
  ),
  play: async ({ canvasElement }) => {
    const menu = await openMenuFrom(canvasElement);

    // The portal inherits `dir` from the document element rather than from the
    // canvas — worth pinning, because it is the reason this story is shaped the
    // way it is.
    await expect(getComputedStyle(menu).direction).toBe("rtl");

    // The shortcut hint sits at the row's logical end: visually left of its
    // label under RTL. Against `ml-auto` this reads the other way round.
    const settings = within(menu).getByRole("menuitem", { name: "Settings" });
    const label = within(settings).getByText("Settings");
    const hint = settings.querySelector<HTMLElement>('[data-slot="account-menu-shortcut"]');
    await expect(hint).not.toBeNull();
    await expect(
      `hint left of label: ${(hint as HTMLElement).getBoundingClientRect().left < label.getBoundingClientRect().left}`,
    ).toBe("hint left of label: true");

    // The submenu inherits the direction too — it portals to the same body.
    const submenu = await openAppearance();
    await expect(getComputedStyle(submenu).direction).toBe("rtl");
    await closeAppearance(menu);
  },
};

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
 * The reduced-motion branch, on both surfaces, and the reason it needs a story
 * at all is that the obvious remedy does nothing here.
 *
 * Both popups open with `data-open:animate-in zoom-in-95` and close with
 * `data-closed:animate-out`, neither of which reads the media feature. The
 * registry's usual one-class fix — a bare `motion-reduce:animate-none`, as
 * `task-tray` and `trace-timeline` use — is **inert** against them: Tailwind v4
 * wraps the data-attribute test in `:where(…)`, so both sides are a single
 * class of specificity and the tie falls to source order, and the plain
 * `motion-reduce:` block is emitted well before the `data-*` variants.
 * `animation: enter` wins, the class sits in the string doing nothing, and the
 * only way to notice is to read `animation-name` back. Restating the variant
 * (`motion-reduce:data-open:animate-none`) sorts after its counterpart and wins
 * the same tie. CONTINUE.md §9 lists this component among the 33 that needed
 * it; `shortcuts-sheet` was the only one that had it.
 *
 * `vitest.config.ts` emulates `prefers-reduced-motion: reduce` for every test,
 * so the assertions below are the rendered result rather than a class-name
 * check. Against the bare class they read `"enter"`.
 *
 * The submenu is checked separately because it carries its own copy of the
 * animation classes — fixing the parent popup does not reach it, and a nested
 * menu that zooms open on hover is the more disruptive of the two.
 */
export const ReducedMotion: Story = {
  args: { theme: "system", background: "default", items: ACCOUNT_ITEMS },
  play: async ({ canvasElement }) => {
    const menu = await openMenuFrom(canvasElement);
    await expect(menu).toHaveAttribute("data-open");
    await expect(getComputedStyle(menu).animationName).toBe("none");

    const submenu = await openAppearance();
    await expect(submenu).toHaveAttribute("data-open");
    await expect(getComputedStyle(submenu).animationName).toBe("none");
    await closeAppearance(menu);
  },
};

/**
 * The keyboard contract, and the shape of it is the finding: **this component
 * contributes exactly one tab stop to the page.** Everything inside the open
 * menu is a roving-tabindex row reached with arrow keys, which is correct for a
 * `role="menu"` and is why the exemplar's "tab until you leave the canvas" walk
 * is the wrong instrument here — tabbing at all dismisses the menu.
 *
 * What it pins:
 *
 * 1. The avatar trigger is the single tab stop, and it takes a real ring
 *    (`focus-visible:ring-2`).
 * 2. `ArrowDown` opens the menu and lands on the first row. From there one lap
 *    of `ArrowDown` visits every row exactly once and wraps to the first —
 *    Base UI's `loopFocus` default, asserted rather than assumed.
 * 3. Every row is visibly focused. The treatment is a filled row
 *    (`focus:bg-accent`, or `focus:bg-destructive/10` on sign-out), **not** a
 *    ring: `DropdownMenuItem` sets `outline-hidden`, which is a *transparent*
 *    2px outline, so the exemplar's `outlineStyle !== "none"` test would pass on
 *    a completely unstyled row. The fill is the treatment, so the fill is what
 *    is measured.
 * 4. Every row has a distinct accessible name — checked by looking each one up
 *    by name, which throws on a duplicate. The keycap hints are `aria-hidden`,
 *    so "Settings ⌘ ," is named "Settings"; without that, two rows sharing a
 *    label would still read apart and the duplicate would be invisible.
 * 5. `ArrowRight` enters the Appearance submenu and puts the ring on its first
 *    theme option; the key that leaves it returns the ring to the row that
 *    opened it, with the root menu still up.
 * 6. Escape closes the menu **and returns focus to the trigger** — Base UI
 *    restores it, and this asserts it rather than assuming it, because the
 *    alternative is a keyboard user landing on `document.body` and having to
 *    re-traverse the shell to get back to the avatar.
 *
 * The walk is one lap, not a budget, and each stop is read only once focus has
 * settled — see `settledStop`. Arrow-key movement inside a Base UI popup is not
 * the trailing-focus-guard race that `TaskTray` lost in CI, but it is still
 * asynchronous, and a budgeted walk would turn that into a flake the same way.
 */
export const KeyboardOrder: Story = {
  args: {
    theme: "light",
    background: "default",
    items: ACCOUNT_ITEMS,
    signOutShortcut: ["⇧", "⌘", "Q"],
  },
  play: async ({ canvasElement }) => {
    const body = within(document.body);
    const trigger = triggerFor(canvasElement);

    // One tab stop in the page — the avatar. The menu adds none, by design.
    const canvasStops = Array.from(
      canvasElement.querySelectorAll<HTMLElement>(
        'button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      ),
    );
    await expect(canvasStops).toEqual([trigger]);

    await userEvent.tab();
    await expect(document.activeElement).toBe(trigger);
    await expect(trigger.matches(":focus-visible")).toBe(true);
    const triggerStyle = getComputedStyle(trigger);
    await expect(
      `trigger ring=${triggerStyle.boxShadow !== "none" || triggerStyle.outlineStyle !== "none"}`,
    ).toBe("trigger ring=true");

    await userEvent.keyboard("{ArrowDown}");
    const menu = await body.findByRole("menu");
    const stops = Array.from(menu.querySelectorAll<HTMLElement>('[role="menuitem"]'));

    // Three product actions, the submenu trigger, and sign-out. The identity
    // block is not a row and must not become one.
    await expect(stops).toHaveLength(5);

    // Distinct accessible names, computed the way a screen reader would: a
    // duplicate makes `getByRole` throw rather than silently pass.
    for (const name of ["Settings", "Invite people", "Billing", "Appearance", "Sign out"]) {
      await expect(within(menu).getByRole("menuitem", { name })).toBeInTheDocument();
    }

    const nameOf = (el: Element | null) =>
      el === null
        ? "nothing"
        : `stop#${stops.indexOf(el as HTMLElement)} ${el.textContent?.trim().slice(0, 24) ?? ""}`;

    /**
     * The focused row, once Base UI has finished moving focus. Reading
     * `document.activeElement` the instant a key event resolves races the
     * popup's own focus management; settling first is what makes "one key, one
     * row" a provable step rather than a generous allowance.
     */
    const settledStop = async () => {
      await waitFor(() => {
        const active = document.activeElement;
        if (!stops.includes(active as HTMLElement)) {
          throw new Error(`focus is not on one of the menu's rows: ${nameOf(active)}`);
        }
      });
      return document.activeElement as HTMLElement;
    };

    const assertVisiblyFocused = async (el: HTMLElement) => {
      const id = nameOf(el);
      await expect(`${id} focusVisible=${el.matches(":focus-visible")}`).toBe(`${id} focusVisible=true`);
      // A row at rest paints nothing — `rgba(0, 0, 0, 0)` is what Chromium
      // reports for it. A focused row fills. See point 3 above for why this is
      // not the ring/outline test the other case stories use.
      const fill = getComputedStyle(el).backgroundColor;
      await expect(`${id} filled=${fill !== "rgba(0, 0, 0, 0)"}`).toBe(`${id} filled=true`);
    };

    const start = await settledStop();
    await assertVisiblyFocused(start);

    const seen = new Set<HTMLElement>([start]);
    for (let i = 1; i < stops.length; i += 1) {
      await userEvent.keyboard("{ArrowDown}");
      const focused = await settledStop();
      await expect(`${nameOf(focused)} repeat=${seen.has(focused)}`).toBe(`${nameOf(focused)} repeat=false`);
      await assertVisiblyFocused(focused);
      seen.add(focused);
    }
    await expect(seen.size).toBe(stops.length);

    // The lap closes: the row after the last is the first again.
    await userEvent.keyboard("{ArrowDown}");
    await expect(nameOf(await settledStop())).toBe(nameOf(start));

    // Into the submenu and back out, without losing the root menu.
    const appearance = within(menu).getByRole("menuitem", { name: "Appearance" });
    for (let i = 0; i < stops.length && document.activeElement !== appearance; i += 1) {
      await userEvent.keyboard("{ArrowDown}");
      await settledStop();
    }
    await expect(document.activeElement).toBe(appearance);

    await userEvent.keyboard("{ArrowRight}");
    const submenu = await waitFor(() => {
      const popup = appearancePopup();
      if (!popup) throw new Error("ArrowRight did not open the Appearance submenu");
      return popup;
    });
    await waitFor(() =>
      expect(document.activeElement).toBe(within(submenu).getByRole("menuitemradio", { name: "Light" })),
    );

    await userEvent.keyboard("{ArrowLeft}");
    await waitFor(() => expect(appearancePopup()).toBeNull());
    await waitFor(() => expect(document.activeElement).toBe(appearance));
    await expect(menu).toBeInTheDocument();

    // Escape dismisses, and the avatar gets the ring back.
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("menu")).toBeNull());
    await waitFor(() => expect(document.activeElement).toBe(trigger));
  },
};

/**
 * Both of this component's controlled pairs, driven by a parent that refuses to
 * apply them. `theme`/`onThemeChange` and `background`/`onBackgroundChange` are
 * the whole API surface for Appearance — the menu renders what it is told and
 * changes nothing itself — and the docs module's third pitfall exists because
 * that is the thing consumers get wrong.
 *
 * The parent below records every request and re-renders with the same values.
 * That separates the two halves a consumer has to trust: the callback fires
 * with the string the app needs in order to apply it, and the checked state
 * does not move on its own while the app says otherwise. Both halves are
 * checked twice, because the two pairs are two different primitives — the theme
 * options are real `menuitemradio` rows, the background swatches are the
 * standalone Radio primitive wearing colour, and a regression in one would be
 * invisible from the other.
 *
 * Neither click closes the menu, which is not incidental: Base UI's
 * `Menu.RadioItem` defaults `closeOnClick` to `false`, so a theme can be tried
 * and reverted without reopening the menu. That is what makes a submenu the
 * right home for this and a dialog the wrong one.
 *
 * The probe is read by test id rather than by role: `Menu.Root` is modal by
 * default, so the story canvas is not reachable by role while the menu is up.
 */
export const Controlled: Story = {
  render: () => <RejectingParent />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);

    await userEvent.click(triggerFor(canvasElement));
    const menu = await body.findByRole("menu");
    const submenu = await openAppearance();
    const sub = within(submenu);

    // The submenu's own names, all distinct — three themes and five swatches,
    // each looked up by the name it exposes.
    await expect(sub.getAllByRole("menuitemradio")).toHaveLength(3);
    await expect(sub.getAllByRole("radio")).toHaveLength(5);

    // Theme: the menu's radio rows.
    await expect(sub.getByRole("menuitemradio", { name: "Light" })).toHaveAttribute("aria-checked", "true");
    await userEvent.click(sub.getByRole("menuitemradio", { name: "Dark" }));
    await waitFor(() => expect(canvas.getByTestId("theme-change-calls")).toHaveTextContent("dark"));
    // …and nothing moved, because the parent never applied it.
    await expect(sub.getByRole("menuitemradio", { name: "Dark" })).toHaveAttribute("aria-checked", "false");
    await expect(sub.getByRole("menuitemradio", { name: "Light" })).toHaveAttribute("aria-checked", "true");

    // Background: the standalone Radio primitive, same contract.
    await expect(sub.getByRole("radio", { name: "Default" })).toHaveAttribute("aria-checked", "true");
    await userEvent.click(sub.getByRole("radio", { name: "Forest" }));
    await waitFor(() => expect(canvas.getByTestId("background-change-calls")).toHaveTextContent("forest"));
    await expect(sub.getByRole("radio", { name: "Forest" })).toHaveAttribute("aria-checked", "false");
    await expect(sub.getByRole("radio", { name: "Default" })).toHaveAttribute("aria-checked", "true");

    // Two requests, two callbacks, and the menu is still up on the values it
    // was given.
    await closeAppearance(menu);
  },
};

function RejectingParent() {
  const [themeCalls, setThemeCalls] = React.useState<string[]>([]);
  const [backgroundCalls, setBackgroundCalls] = React.useState<string[]>([]);

  return (
    <>
      {/* Probes, not controls: the open menu is modal, so these are read by
          test id rather than by role. */}
      <output data-testid="theme-change-calls" className="sr-only">
        {themeCalls.join(",")}
      </output>
      <output data-testid="background-change-calls" className="sr-only">
        {backgroundCalls.join(",")}
      </output>
      <AccountMenu
        user={SAMPLE_USER}
        items={ACCOUNT_ITEMS}
        theme="light"
        onThemeChange={(value) => setThemeCalls((calls) => [...calls, value])}
        background="default"
        onBackgroundChange={(value) => setBackgroundCalls((calls) => [...calls, value])}
        onSignOut={() => {}}
      />
    </>
  );
}

/**
 * A long display name, a long address, and a ~90-character action label — the
 * three author-supplied slots, all under pressure at once, because the popup is
 * a fixed `w-64` and none of them can widen it.
 *
 * The component's answer is not one answer, and that is the fact this story
 * exists to record. **The identity block truncates**: name and email are
 * `truncate` inside a `min-w-0` column, so an SSO display name and a
 * long-domain address both end in an ellipsis and the block stays two lines.
 * **Rows wrap**: an item's label is a bare `flex-1` span with no `truncate` and
 * no `whitespace-nowrap`, so a long label runs to as many lines as it needs and
 * the row grows downward, with the keycaps staying vertically centred against
 * the block of text rather than aligning to its first line.
 *
 * That split is defensible — an email you cannot read in full is still
 * recognisable from its start, whereas a truncated action is a guess about what
 * activating it will do — but it is invisible from the types, and the trigger's
 * accessible name ("Account menu for …") grows without bound underneath it.
 * The play function measures both halves rather than describing them.
 */
export const LongContent: Story = {
  args: {
    user: {
      name: "Alexandra Constantine-Whitfield",
      email: "alexandra.constantine-whitfield@research.example.com",
    },
    theme: "light",
    background: "default",
    items: [
      {
        label: "Download all your conversations, generated files and account data as a single archive",
        shortcut: ["⌘", "⇧", "E"],
      },
      { label: "Billing" },
    ],
  },
  play: async ({ canvasElement }) => {
    const menu = await openMenuFrom(canvasElement, "Alexandra Constantine-Whitfield");

    // Identity: clipped, so the rendered box is narrower than the text in it.
    const email = menu.querySelector<HTMLElement>('[data-slot="account-menu-email"]');
    await expect(email).not.toBeNull();
    const emailEl = email as HTMLElement;
    await expect(`email clipped=${emailEl.scrollWidth > emailEl.clientWidth}`).toBe("email clipped=true");

    // Rows: not clipped — they wrap, so the long row is taller than the short
    // one and the popup is still 256px wide.
    const rows = Array.from(menu.querySelectorAll<HTMLElement>('[data-slot="account-menu-item"]'));
    const [longRow, shortRow] = rows;
    await expect(`long row clipped=${longRow.scrollWidth > longRow.clientWidth}`).toBe(
      "long row clipped=false",
    );
    await expect(
      `long row taller=${longRow.getBoundingClientRect().height > shortRow.getBoundingClientRect().height}`,
    ).toBe("long row taller=true");
  },
};

/**
 * 375px, and the arithmetic is the story.
 *
 * The wrapper constrains where the trigger sits, not the popup: both popups
 * portal out of the canvas and are positioned against the viewport, so the
 * usual `w-[375px]` box cannot clip them and this component exposes no
 * `className` that reaches them. What it can constrain is the thing a shell
 * actually varies — the avatar's position in a narrow topbar.
 *
 * Neither popup is the source of horizontal scroll on its own: the menu is a
 * fixed `w-64` (256px) and the submenu a fixed `w-56` (224px), both comfortably
 * inside 375px, and the play function pins that — after opening the submenu to
 * measure it and closing it again, for the reason in the block comment.
 * **Side by side they are 480px**, which no phone has. A nested submenu is the
 * right shape for a pointer — it costs one hover — and on a 375px screen it is
 * a second panel with nowhere to go but on top of the first, which is what the
 * positioner's collision handling has to resolve at a real viewport width.
 * Worth knowing before reaching for a third level of nesting; there is nowhere
 * to put it.
 */
export const Mobile: Story = {
  args: { theme: "light", background: "default", items: ACCOUNT_ITEMS },
  render: (args) => (
    <div className="w-[375px] max-w-full">
      <AccountMenu {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const menu = await openMenuFrom(canvasElement);
    const submenu = await openAppearance();

    for (const [label, popup] of [
      ["menu", menu],
      ["submenu", submenu],
    ] as const) {
      const width = popup.getBoundingClientRect().width;
      await expect(`${label} fits 375: ${width <= 375} (${Math.round(width)}px)`).toBe(
        `${label} fits 375: true (${Math.round(width)}px)`,
      );
    }

    await closeAppearance(menu);
  },
};

/**
 * The two dropdowns that live in the same corner of the same shell, and the
 * rule is **which noun the menu is about**:
 *
 * - **Account menu** is about *you*. One per app: who is signed in, the
 *   preferences that follow you across every workspace (theme, background), and
 *   the way out. Its rows are actions, its last row is destructive, and nothing
 *   in it changes what you are looking at.
 * - **Workspace switcher** is about *which container you are working in*. Its
 *   rows are a selection among peers — real radio semantics, the current one
 *   checked — and picking one changes the content of the whole app. Creation
 *   sits last, below a rule, where sign-out sits in the other.
 *
 * If the rows are mutually exclusive and one of them is already true, it is a
 * switcher. If the rows are things to do and one of them signs you out, it is
 * the account menu. A workspace *setting* belongs in neither: it follows the
 * container, not the person, so it goes in the workspace's own settings.
 *
 * Both are rendered closed on purpose. `Menu.Root` is modal by default — the
 * click that opens the second is an outside press that dismisses the first — so
 * two open popups is a state this pairing cannot reach in a product either. The
 * comparison that matters at rest is the trigger anyway: an avatar with no
 * label, against a named button carrying the current workspace and its plan.
 */
export const Boundary: Story = {
  args: { theme: "light", background: "default", items: ACCOUNT_ITEMS },
  render: (args) => (
    <div className="flex w-full max-w-lg flex-col gap-6">
      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">
          Account menu — who you are, and the preferences that follow you
        </p>
        <AccountMenu {...args} />
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">
          Workspace switcher — which container you are working in
        </p>
        <WorkspaceSwitcher
          workspaces={[
            { id: "personal", name: "Personal", plan: "Free" },
            { id: "studio", name: "Studio", plan: "Pro" },
          ]}
          currentId="studio"
          onSelect={() => {}}
          onCreate={() => {}}
        />
      </section>
    </div>
  ),
};
