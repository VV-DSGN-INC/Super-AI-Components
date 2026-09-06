import type { Meta, StoryObj } from "@storybook/react-vite";
import { CreditCard, Settings2, ShieldCheck } from "lucide-react";
import * as React from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { FieldRow, UnitInput } from "@/registry/super-ai/field-row";
import { SettingsDialog, type SettingsSectionData } from "@/registry/super-ai/settings-dialog";
import { SettingsDialogDocs } from "@/content/components/settings-dialog.docs";
import { componentDocsPage } from "@/lib/component-docs-page";
import { focusTreatmentSignature, settledFocusRing } from "@/lib/focus-ring";

const meta: Meta<typeof SettingsDialog> = {
  title: "Super AI/Settings Dialog",
  component: SettingsDialog,
  parameters: { layout: "centered", docs: { page: componentDocsPage(SettingsDialogDocs) } },
};

export default meta;
type Story = StoryObj<typeof SettingsDialog>;

const toggle =
  (initial: "on" | "off") =>
  ({ controlId, labelId, descriptionId }: { controlId: string; labelId: string; descriptionId: string }) => (
    <Switch
      id={controlId}
      aria-labelledby={labelId}
      aria-describedby={descriptionId}
      defaultChecked={initial === "on"}
    />
  );

const GENERAL: SettingsSectionData = {
  id: "general",
  label: "General",
  icon: <Settings2 />,
  rows: [
    {
      id: "autosave",
      label: "Autosave drafts",
      description: "Keeps a copy of every prompt while you type, recoverable for 30 days.",
      control: toggle("on"),
    },
    {
      id: "sounds",
      label: "Completion sounds",
      description: "Plays a chime when a long generation finishes in a background tab.",
      control: toggle("off"),
    },
  ],
};

const BILLING: SettingsSectionData = {
  id: "billing",
  label: "Billing",
  icon: <CreditCard />,
  tier: "Pro",
  rows: [
    {
      id: "invoices",
      label: "Email invoices",
      description: "Sends a PDF invoice to the workspace owner after every renewal.",
      control: toggle("on"),
    },
    {
      id: "seats",
      label: "Auto-add seats",
      description: "Buys a seat automatically when someone new joins, at the current rate.",
      control: toggle("off"),
    },
  ],
};

const PRIVACY: SettingsSectionData = {
  id: "privacy",
  label: "Privacy",
  icon: <ShieldCheck />,
  rows: [
    {
      id: "telemetry",
      label: "Share usage data",
      description: "Sends anonymised feature usage so the team can prioritise what to build.",
      control: toggle("off"),
    },
    {
      id: "history",
      label: "Clear generation history",
      description: "Deletes every stored prompt and render older than the retention window.",
      destructiveAction: { label: "Clear history" },
    },
    {
      id: "delete",
      label: "Delete workspace",
      description: "Removes every project, render and API key. This cannot be undone.",
      destructiveAction: { label: "Delete workspace" },
    },
  ],
};

/** What `Controlled`'s host was told, so its play can read the payloads back. */
const controlledCalls: { section: string[]; search: string[] } = { section: [], search: [] };

/**
 * The modal presentation: the same body as `FullPage`, framed by the vendored
 * Dialog and with no search field, because a modal has nowhere to put a result
 * you cannot deep-link to.
 *
 * What to notice is the nav on the left. It looks like page navigation and is
 * not: it is a real vertical `tablist` whose tabs are wired to the panels they
 * reveal, which is what lets entering a panel announce the section it belongs
 * to. Rendered open on mount, so the axe pass reaches the popup — the modal
 * body of every dialog in this registry is invisible to the gate until a story
 * opens it.
 */
export const Dialog: Story = {
  args: {
    variant: "dialog",
    open: true,
    title: "Settings",
    description: "Preferences for this workspace.",
    sections: [GENERAL, BILLING, PRIVACY],
  },
};

/**
 * The addressable presentation: the same row grid inline, plus settings search
 * and a stable `id` per section so "Settings → Billing" can be a URL.
 *
 * Search and the active section are held outside the component here, which is
 * how the variant is meant to be used — the URL owns both, and the component
 * only reports intent. Reading the hash back is still the app's job; nothing in
 * this file does it, and nothing in the component does either.
 */
export const FullPage: Story = {
  args: {
    variant: "full-page",
    title: "Settings",
    description: "Search every preference, or link straight to a section.",
    anchorPrefix: "settings",
    sections: [GENERAL, BILLING, PRIVACY],
  },
  render: (args) => {
    // Search and the active section are controlled so the URL can own them —
    // the story stands in for the app that would normally hold that state.
    function Harness() {
      const [search, setSearch] = React.useState("");
      const [sectionId, setSectionId] = React.useState("general");
      return (
        <SettingsDialog
          {...args}
          className="w-[44rem]"
          search={search}
          onSearchChange={setSearch}
          sectionId={sectionId}
          onSectionChange={setSectionId}
        />
      );
    }
    return <Harness />;
  },
};

/**
 * The row contract, on its own: label, description, one control. `description`
 * is a required string rather than an optional nicety, and this story is what
 * that decision looks like — the label names the switch, the line under it says
 * what flipping it costs you.
 *
 * The control column is the caller's. The component hands back `controlId`,
 * `labelId` and `descriptionId`; the Switch here is wired to all three, which
 * is the belt-and-braces the component expects rather than a decoration.
 */
export const ToggleRows: Story = {
  args: {
    variant: "full-page",
    title: "General",
    description: "Every row is a label, a description and one control.",
    sections: [GENERAL],
    className: "w-[36rem]",
  },
};

/**
 * A destructive setting sits in the same grid as a benign one, and its action
 * is plain text in the control column. `destructiveAction` takes data, not JSX,
 * so a filled `Button` cannot land beside the toggles and read as the panel's
 * primary action.
 *
 * **Measured, and the reason the labels read the way they do.** At rest the
 * action differs from the row label beside it in exactly one computed value:
 * colour, `oklch(0.577 0.245 27.325)` against the label's foreground. Same
 * `font-weight: 500`, same size, `text-decoration-line: none`, transparent
 * background. The underline arrives on hover and the ring on focus, so for a
 * sighted user at rest **colour alone separates this control from static
 * text** — WCAG 1.4.1's shape, on the affordance rather than on the meaning.
 * Two things stop it being a defect in what is *said*: the element is a real
 * `<button>`, so assistive tech announces it as one, and the type requires a
 * self-describing label ("Delete workspace", never "Delete"), so the word
 * carries the consequence. The play below asserts both of those and the
 * `aria-describedby` wiring; the rest-state treatment is recorded, not pinned,
 * because giving the text an underline or a border is a design decision.
 */
export const DestructiveRows: Story = {
  args: {
    variant: "full-page",
    title: "Privacy",
    description: "Destructive actions are text in the control column, never a filled button.",
    sections: [PRIVACY],
    className: "w-[36rem]",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const actions = Array.from(
      canvasElement.querySelectorAll<HTMLElement>('[data-slot="settings-dialog-destructive-action"]'),
    );
    await expect(actions).toHaveLength(2);

    // Each is a real button, named by the verb and its object — a duplicate or
    // a bare "Delete" would make this query throw rather than quietly pass.
    for (const name of ["Clear history", "Delete workspace"]) {
      await expect(canvas.getByRole("button", { name })).toBeInTheDocument();
    }

    // The row description reaches the button, which is where the consequence
    // is spelled out. The row *label* does not: it is an inert span beside it.
    for (const action of actions) {
      const describedBy = action.getAttribute("aria-describedby");
      const description = describedBy ? document.getElementById(describedBy) : null;
      await expect(description).not.toBeNull();
      await expect(description!.textContent?.length ?? 0).toBeGreaterThan(20);
      await expect(description!.dataset.slot).toBe("settings-dialog-row-description");
    }

    // No fill and no tint in any state — the whole point of taking data rather
    // than JSX. `text-destructive` over a `bg-destructive/NN` measures 4.0:1.
    for (const action of actions) {
      await expect(getComputedStyle(action).backgroundColor).toBe("rgba(0, 0, 0, 0)");
    }

    // A destructive row is marked in the DOM as well as by its control, so a
    // consumer styling the grid does not have to infer it from the label.
    const rows = Array.from(canvasElement.querySelectorAll<HTMLElement>('[data-slot="settings-dialog-row"]'));
    await expect(rows.map((row) => row.dataset.destructive)).toEqual([undefined, "true", "true"]);
  },
};

/**
 * The tier badge, and what makes it more than decoration: the word is part of
 * the tab's accessible name.
 *
 * Adjacent spans fuse with no separator when a name is computed from content —
 * "Billing" beside a "Pro" badge would announce as "BillingPro" — so the tab
 * states its name outright, space-joined, keeping the visible text a prefix of
 * it. Restyling the badge into a coloured dot would take it out of the name as
 * well as off the screen.
 */
export const TierBadgedNav: Story = {
  args: {
    variant: "full-page",
    title: "Settings",
    defaultSectionId: "billing",
    sections: [GENERAL, BILLING, PRIVACY],
    className: "w-[36rem]",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("tab", { name: "Billing Pro" })).toHaveAttribute("aria-selected", "true");
    // The visible text is still just "Billing" — the badge supplies the rest of
    // the name, and it does so as a word rather than as a colour.
    const tab = canvas.getByRole("tab", { name: "Billing Pro" });
    await expect(tab.querySelector("span.truncate")!.textContent).toBe("Billing");
    await expect(tab.querySelector('[data-slot="settings-dialog-tier"]')!.textContent).toBe("Pro");
  },
};

/* ---------------------------------------------------------------------------
 * Case stories — the situations this component meets in a product, as opposed
 * to the prop combinations above. All eight are written; nothing is skipped.
 * Why each is true here: the surface has directional layout (a bordered nav
 * column and a leading search glyph), the modal presentation animates, it is
 * full of focusables, it exposes three controlled pairs, three of its text
 * slots are optional and the rest are author-supplied, and the catalog holds a
 * near-twin the docs page already warns against (A6 `field-row`).
 * ------------------------------------------------------------------------ */

/**
 * Sets `dir` on the document rather than on a wrapper `<div>`. That is not
 * belt-and-braces: the sibling `dialog` presentation portals its popup to the
 * end of `document.body`, so a wrapper in the story canvas is never an ancestor
 * of it, and floating-ui reads direction off *computed style* rather than off
 * React context. One idiom that works for both presentations beats two.
 *
 * Three physical classes were swapped in-wave for their logical forms, each
 * byte-identical in LTR, and each measured broken under RTL before the swap:
 *
 * - The nav's divider and gutter (`border-r pr-2` → `border-e pe-2`). The flex
 *   row mirrors on its own, so the nav moves to the right — and the border
 *   stayed on its *outer* edge, drawing a line down the outside of the surface
 *   instead of between the nav and the panel it divides. Now asserted on
 *   `borderLeftWidth`/`borderRightWidth` in both directions, the H3
 *   `track-lane` pattern, so the swap cannot silently regress.
 * - The nav item's `text-left` → `text-start`, which read `text-align: left`
 *   under RTL — every section name ragged against the wrong edge.
 * - The search glyph and the reserve cut for it (`left-2` → `start-2`,
 *   `pl-7` → `ps-7`), swapped as a pair because both halves are classes and
 *   nothing else decides that side. Unswapped, the glyph sat at 632..648 with
 *   the query text starting from the right — a leading icon at the trailing
 *   edge.
 *
 * **What the missing `DirectionProvider` costs this component: nothing.** The
 * nav is `orientation="vertical"`, so travel is Up and Down, and neither key
 * has a direction to get wrong. Asserted below rather than assumed — the same
 * result L4 `whats-new` reached on its own vertical composite, and the reason
 * this file needs no provider while `mode-tabs` and `selection-toolbar` do.
 *
 * Not fixed here, and shared: the vendored `DialogContent`'s close button is
 * `absolute top-2 right-2`, a physical corner in `components/ui/dialog.tsx`
 * that every dialog in the repo inherits (L5 `shortcuts-sheet` recorded it
 * first).
 */
export const RTL: Story = {
  args: {
    variant: "full-page",
    title: "Settings",
    description: "Search every preference, or link straight to a section.",
    sections: [GENERAL, BILLING, PRIVACY],
    search: "",
    className: "w-[36rem]",
  },
  render: (args) => (
    <RtlDocument>
      <SettingsDialog {...args} />
    </RtlDocument>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const nav = canvasElement.querySelector<HTMLElement>('[data-slot="settings-dialog-nav"]')!;
    const panel = canvasElement.querySelector<HTMLElement>('[data-slot="settings-dialog-panel"]')!;

    // The nav is the inline-start column, so under RTL it paints on the right.
    await expect(nav.getBoundingClientRect().left).toBeGreaterThan(panel.getBoundingClientRect().left);

    // The divider is between the two columns, not down the outside edge. Under
    // RTL that is the nav's *left* border; the LTR half of the claim is pinned
    // by every other story in this file rendering the mirror image.
    const navStyle = getComputedStyle(nav);
    await expect(`${navStyle.borderLeftWidth}/${navStyle.borderRightWidth}`).toBe("1px/0px");
    await expect(`${navStyle.paddingLeft}/${navStyle.paddingRight}`).toBe("8px/0px");

    // Section names sit against the reading edge. `text-align` computes to the
    // logical keyword rather than resolving to a side, so the assertion is on
    // `start` — which is the whole substance of the swap, since the same read
    // returned `left` before it. The Range below is the rendered half: the
    // painted text ends flush with the label's right edge.
    const tab = canvas.getAllByRole("tab")[0];
    await expect(getComputedStyle(tab).textAlign).toBe("start");
    const navLabel = tab.querySelector<HTMLElement>("span.truncate")!;
    const range = document.createRange();
    range.selectNodeContents(navLabel);
    await expect(Math.round(range.getBoundingClientRect().right)).toBe(
      Math.round(navLabel.getBoundingClientRect().right),
    );

    // The search glyph leads the field: it sits in the right-hand half, and the
    // padding reserved for it is on the same side.
    const search = canvasElement.querySelector<HTMLElement>('[data-slot="settings-dialog-search"]')!;
    const glyph = search.querySelector("svg")!.getBoundingClientRect();
    const input = search.querySelector("input")!;
    const field = input.getBoundingClientRect();
    await expect(glyph.left).toBeGreaterThan(field.left + field.width / 2);
    const inputStyle = getComputedStyle(input);
    await expect(`${inputStyle.paddingLeft}/${inputStyle.paddingRight}`).toBe("10px/28px");

    // The row grid mirrors on its own: text at the reading edge, control at the
    // far one. No swap was needed and none was made.
    const text = canvasElement
      .querySelector('[data-slot="settings-dialog-row-text"]')!
      .getBoundingClientRect();
    const control = canvasElement
      .querySelector('[data-slot="settings-dialog-row-control"]')!
      .getBoundingClientRect();
    await expect(text.left).toBeGreaterThan(control.left);

    // Vertical travel is direction-blind, which is why the absent
    // DirectionProvider costs this nav nothing.
    const tabs = canvas.getAllByRole("tab");
    (tabs[0] as HTMLElement).focus();
    await userEvent.keyboard("{ArrowDown}");
    await expect(document.activeElement).toBe(tabs[1]);
    await userEvent.keyboard("{ArrowUp}");
    await expect(document.activeElement).toBe(tabs[0]);
  },
};

/**
 * Sets `dir` on `<html>` for the life of the story and puts it back after.
 * A wrapper cannot reach a portal — `story-conventions.md`, mechanical fact 5.
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
 * The reduced-motion branch, and the one class this wave added to the
 * component. `vitest.config.ts` emulates `prefers-reduced-motion: reduce` for
 * every test, so both assertions below are the rendered result rather than a
 * class-name check.
 *
 * **Measured before the fix: the popup's `animation-name` read `"enter"`.**
 * `DialogContent` opens with `data-open:animate-in zoom-in-95`, and the bare
 * `motion-reduce:animate-none` the registry uses on spinners loses the
 * source-order tie to a data-attribute variant. Restating the variant on both
 * halves is what wins it, and the popup now reads `"none"`.
 *
 * The backdrop is asserted too and **nothing here fixes it**: `DialogContent`
 * renders `<DialogOverlay />` with no `className` threaded through, so no call
 * site can reach the scrim. The pair lives on the vendored `DialogOverlay`
 * since the K/L wave; this assertion is a regression guard on that central fix
 * rather than a claim about this component.
 *
 * What was deliberately *not* given a branch: the nav item's
 * `transition-colors`. It crossfades a text and background colour and moves
 * nothing, which is the qualifier in mechanical fact 3 — adding
 * `motion-reduce:transition-none` there would document no branch worth a story.
 * The `full-page` presentation animates nothing at all.
 */
export const ReducedMotion: Story = {
  args: {
    variant: "dialog",
    open: true,
    title: "Settings",
    description: "Preferences for this workspace.",
    sections: [GENERAL, BILLING, PRIVACY],
  },
  play: async () => {
    const popup = await within(document.body).findByRole("dialog");
    await expect(popup).toHaveAttribute("data-open");
    await expect(getComputedStyle(popup).animationName).toBe("none");

    const overlay = document.querySelector('[data-slot="dialog-overlay"]')!;
    await expect(getComputedStyle(overlay).animationName).toBe("none");
  },
};

/**
 * The whole keyboard loop for the modal presentation, opened from its trigger
 * so focus return can be checked at the end.
 *
 * What it pins:
 *
 * 1. Opening moves focus into the popup and lands on the **active section
 *    tab** — the first tabbable inside.
 * 2. The nav is **one** stop, not one per section: a roving tabindex, so a
 *    twenty-section settings dialog costs a keyboard user one Tab, not twenty.
 * 3. After it, the open panel is its own stop (Base UI gives it `tabIndex=0`),
 *    then each row's control in order, then the close button — six stops for
 *    this section, and the lap closes back on the tab.
 * 4. Every stop is visibly focused, checked **both ways**, because the two
 *    checks answer different questions and disagree here. `settledFocusRing`
 *    waits for the treatment to arrive — the vendored `Button` and `Switch`
 *    fade theirs in over ~250ms, and an immediate read on the close button
 *    returns `rgba(0, 0, 0, 0) 0px 0px 0px 0px` on the frame focus lands. The
 *    differential reads the *next* stop's signature while focus is still on the
 *    previous one, so it proves focus is what painted the ring rather than a
 *    resting shadow, without a blur that would disturb the walk.
 * 5. Arrow keys move the highlight **without** switching the panel. This Base
 *    UI version defaults `activateOnFocus` to `false`, so Down then Enter is
 *    two deliberate steps — measured, because a test written against automatic
 *    activation would fail here for the right reason and be "fixed" the wrong
 *    way.
 * 6. Escape closes the dialog **and returns focus to the trigger**.
 *
 * The walk is one lap, not a budget: inside a Base UI portal, tabbing off the
 * last control lands on a focus guard whose redirect is scheduled in a frame,
 * so a read taken immediately is environment-dependent. This settles on
 * *departure* — waiting for focus to leave the previous stop — which is the
 * form `ai-tools-menu` arrived at after a green-locally/red-on-cold-cache
 * failure.
 *
 * `privacy` is the section under test on purpose: it is the only one whose
 * rows mix a switch with two destructive text actions, so the walk covers the
 * control shape that is easiest to leave unreachable.
 *
 * **One docs correction this story is the evidence for.** The docs module's
 * fourth focus note says the panel "sets `outline-none` without adding a ring,
 * so that tab stop is invisible when focused". It is not: the panel carries
 * `focus-visible:ring-2`, and the differential measures it arriving —
 * `none|none|oklch(0.922 0 0)` at rest against a `oklch(0.708 0 0) 0px 0px 0px
 * 2px` layer once focused. The sentence predates the ring and is corrected in
 * the wave report rather than here, since this file does not own that module.
 * The same note's neighbours check out: the nav is one stop, the close button
 * is the last, and manual activation is real.
 */
export const KeyboardOrder: Story = {
  args: {
    variant: "dialog",
    title: "Settings",
    description: "Preferences for this workspace.",
    defaultSectionId: "privacy",
    sections: [GENERAL, BILLING, PRIVACY],
    trigger: <Button variant="outline">Settings</Button>,
  },
  play: async ({ canvasElement }) => {
    const body = within(document.body);
    const trigger = within(canvasElement).getByRole("button", { name: "Settings" });

    await userEvent.tab();
    await expect(document.activeElement).toBe(trigger);
    await userEvent.keyboard("{Enter}");

    const popup = await body.findByRole("dialog");
    const nav = popup.querySelector<HTMLElement>('[data-slot="settings-dialog-nav"]')!;
    const panel = popup.querySelector<HTMLElement>('[data-slot="settings-dialog-panel"]')!;

    // Three sections, one tab stop. Base UI leaves tabindex="0" on a natively
    // disabled button, so the query is for the tabbable tab rather than for
    // anything carrying a tabindex.
    const tabs = Array.from(nav.querySelectorAll<HTMLElement>('[role="tab"]'));
    await expect(tabs).toHaveLength(3);
    const activeTab = tabs.filter((tab) => tab.tabIndex === 0);
    await expect(activeTab).toHaveLength(1);

    // Focus lands inside the popup, on that tab.
    await waitFor(() => expect(popup.contains(document.activeElement)).toBe(true));
    await expect(document.activeElement).toBe(activeTab[0]);

    const controls = Array.from(
      panel.querySelectorAll<HTMLElement>(
        '[data-slot="switch"], [data-slot="settings-dialog-destructive-action"]',
      ),
    );
    // One switch and two destructive text actions — the destructive rows are
    // stops like any other, which is the point of rendering them as buttons.
    await expect(controls).toHaveLength(3);

    const close = popup.querySelector<HTMLElement>('[data-slot="dialog-close"]')!;
    const stops = [activeTab[0], panel, ...controls, close];
    const name = (el: Element | null) =>
      el === null
        ? "nothing"
        : `stop#${stops.indexOf(el as HTMLElement)} ${el.getAttribute("data-slot") ?? el.getAttribute("role")}`;

    /**
     * The focused stop, once the browser has finished moving focus off
     * `previous`. Waiting only for "focus is on some stop" has a hole: when a
     * press has not applied yet focus is still on the previous stop, which is
     * itself expected, so the wait returns a stale read and the lap silently
     * ends one short.
     */
    const settledStop = async (previous?: HTMLElement) => {
      await waitFor(() => {
        const active = document.activeElement;
        if (!stops.includes(active as HTMLElement)) {
          throw new Error(`focus is not on one of the stops: ${name(active)}`);
        }
        if (previous && active === previous) {
          throw new Error(`focus has not left ${name(previous)} yet`);
        }
      });
      return document.activeElement as HTMLElement;
    };

    const start = await settledStop();
    await expect(name(start)).toBe(name(stops[0]));
    await settledFocusRing(start, waitFor);

    const seen = new Set<HTMLElement>([start]);
    let previous = start;
    for (let i = 1; i < stops.length; i += 1) {
      // Taken while focus is still on `previous`, so the comparison after the
      // tab shows that focus is what painted the treatment.
      const nextResting = focusTreatmentSignature(stops[i]);
      await userEvent.tab();
      const focused = await settledStop(previous);
      await expect(`${name(focused)} repeat=${seen.has(focused)}`).toBe(`${name(focused)} repeat=false`);
      await expect(`${name(focused)} focusVisible=${focused.matches(":focus-visible")}`).toBe(
        `${name(focused)} focusVisible=true`,
      );
      await settledFocusRing(focused, waitFor);
      await expect(`${name(focused)} changed=${focusTreatmentSignature(focused) !== nextResting}`).toBe(
        `${name(focused)} changed=true`,
      );
      seen.add(focused);
      previous = focused;
    }
    await expect(seen.size).toBe(stops.length);
    await expect(name(previous)).toBe(name(close));

    // The lap closes rather than leaking to the page behind: the stop after the
    // close button is the tab we started on.
    const startResting = focusTreatmentSignature(start);
    await userEvent.tab();
    await expect(name(await settledStop(previous))).toBe(name(start));
    await expect(focusTreatmentSignature(start)).not.toBe(startResting);

    // Manual activation: the arrow moves the highlight, the panel stays put,
    // and Enter is what commits.
    const shown = () =>
      popup
        .querySelector('[data-slot="settings-dialog-panel"] [data-slot="settings-dialog-section"]')
        ?.getAttribute("data-section-id");
    await expect(shown()).toBe("privacy");
    await userEvent.keyboard("{ArrowDown}");
    await waitFor(() => expect(document.activeElement).toBe(tabs[0]));
    await expect(shown()).toBe("privacy");
    await userEvent.keyboard("{Enter}");
    await waitFor(() => expect(shown()).toBe("general"));

    // Escape closes and hands focus back to what opened it.
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("dialog")).toBeNull());
    await expect(document.activeElement).toBe(trigger);
  },
};

/**
 * Both controlled pairs, driven in opposite directions in one surface, because
 * that is the honest shape of this component: a settings page holds the section
 * in the URL and the query in local state, and the two behave differently when
 * the host refuses.
 *
 * `sectionId` is **pinned** and never applied. Clicking "Billing" fires
 * `onSectionChange("billing")` and the rendered panel does not move — which is
 * what a host validating an unsaved change needs, and is invisible in an
 * uncontrolled story. The refusal survives a re-render: the handler bumps an
 * unrelated counter, so React re-renders with an unchanged `value` and the
 * component still shows General.
 *
 * `search` is **applied**, and the payload is the raw string the person typed —
 * not trimmed and not lowercased. The component does that internally for
 * matching; a consumer putting the query in a URL gets back exactly what was
 * entered.
 *
 * The third pair, `open`/`onOpenChange`, belongs to the `dialog` presentation
 * and is exercised by `KeyboardOrder`'s Escape.
 *
 * **Recorded, not asserted: a host-driven query change drops focus to
 * `<body>`.** Measured by putting focus on a row's Switch and then changing
 * `search` from outside the component — the shape a controlled query invites,
 * since the value lives in the URL and a back button or a restored deep link
 * changes it without anyone touching the field. Filtering the active section to
 * zero matches replaces its rows with the "nothing matched" line, and the
 * focused control goes with them: `document.activeElement` reads `BODY`
 * afterwards, so the next Tab restarts at the top of the document. The docs
 * module's third focus note describes this from the typing side and reasons
 * that focus is "usually in the search box"; that holds for typing and not for
 * a host-driven change. Nothing here asserts it, because the fix is focus
 * management inside the component.
 */
export const Controlled: Story = {
  args: {
    variant: "full-page",
    title: "Settings",
    sections: [GENERAL, BILLING, PRIVACY],
    className: "w-[36rem]",
  },
  render: (args) => {
    function Harness() {
      const [search, setSearch] = React.useState("");
      const [, forceRender] = React.useReducer((n: number) => n + 1, 0);
      return (
        <SettingsDialog
          {...args}
          // Pinned: the host is told, and declines to move.
          sectionId="general"
          onSectionChange={(next) => {
            controlledCalls.section.push(next);
            forceRender();
          }}
          search={search}
          onSearchChange={(next) => {
            controlledCalls.search.push(next);
            setSearch(next);
          }}
        />
      );
    }
    return <Harness />;
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    controlledCalls.section.length = 0;
    controlledCalls.search.length = 0;

    const shown = () =>
      canvasElement
        .querySelector('[data-slot="settings-dialog-panel"] [data-slot="settings-dialog-section"]')
        ?.getAttribute("data-section-id");
    await expect(shown()).toBe("general");

    // Interaction alone does not move the rendered value.
    await userEvent.click(canvas.getByRole("tab", { name: "Billing Pro" }));
    await waitFor(() => expect(controlledCalls.section).toEqual(["billing"]));
    await expect(shown()).toBe("general");
    await expect(canvas.getByRole("tab", { name: "General" })).toHaveAttribute("aria-selected", "true");

    // …and re-rendering with an unchanged `value` holds it there.
    await userEvent.click(canvas.getByRole("tab", { name: "Privacy" }));
    await waitFor(() => expect(controlledCalls.section).toEqual(["billing", "privacy"]));
    await expect(shown()).toBe("general");

    // The other pair, applied. The payload is what was typed, verbatim.
    const field = canvas.getByRole("searchbox", { name: "Search settings" });
    await userEvent.click(field);
    await userEvent.keyboard("  Invoice");
    await waitFor(() => expect(field).toHaveValue("  Invoice"));
    await expect(controlledCalls.search.at(-1)).toBe("  Invoice");

    // Applied means the surface actually filters: the match count lands on the
    // section holding the row, and the section being read says so itself.
    await waitFor(() =>
      expect(canvas.getByRole("tab", { name: "Billing Pro 1 matching" })).toBeInTheDocument(),
    );
    await expect(
      canvasElement.querySelector('[data-slot="settings-dialog-search-status"]')?.textContent,
    ).toContain("1 setting matches");
    await expect(canvasElement.querySelector('[data-slot="settings-dialog-empty"]')?.textContent).toBe(
      "No settings in General match this search.",
    );
  },
};

/**
 * Every optional text slot left out at once: no header `description`, no
 * section `icon`, no `tier`, and `title` defaulted. This is the shape a small
 * product actually ships before it has plans or iconography, and the thing to
 * check is that nothing loses a name on the way.
 *
 * It holds. A tab with neither icon nor badge is still named from its label, a
 * destructive action is still named by its own `label` rather than by the row
 * label beside it, and the header renders one heading and no empty paragraph.
 *
 * **Two collapses this story documents rather than renders**, both in the
 * empty-string class this program keeps finding:
 *
 * - `description: ""` on a row is accepted. The type says the field is
 *   required — "a toggle with no description is a setting nobody changes" — and
 *   an empty string defeats that with no gate behind it: the paragraph renders
 *   at 336×0 px and the control's `aria-describedby` resolves to nothing. One
 *   row here carries it, so the rendering is real; nothing asserts it, because
 *   the honest fix is a component change.
 * - `label: ""` on a benign row is worse and is **not** rendered. The `<label>`
 *   goes empty, the Switch's `aria-labelledby` points at it, and the control
 *   ends up with no accessible name at all — `aria-toggle-field-name`, a red
 *   gate. Same for `destructiveAction.label: ""`, which is `button-name`. H4
 *   `transcript-editor` took the same decision for the same reason.
 */
export const EmptyLabel: Story = {
  args: {
    variant: "full-page",
    sections: [
      {
        id: "general",
        label: "General",
        rows: [
          {
            id: "autosave",
            label: "Autosave drafts",
            description: "Keeps a copy of every prompt while you type, recoverable for 30 days.",
            control: toggle("on"),
          },
          {
            id: "sounds",
            label: "Completion sounds",
            // Accepted, and it should not be — see the description above.
            description: "",
            control: toggle("off"),
          },
        ],
      },
      {
        id: "privacy",
        label: "Privacy",
        rows: [
          {
            id: "delete",
            label: "Delete workspace",
            description: "Removes every project, render and API key. This cannot be undone.",
            destructiveAction: { label: "Delete workspace" },
          },
        ],
      },
    ],
    className: "w-[36rem]",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // `title` defaults, and no empty description paragraph is left behind.
    const header = canvasElement.querySelector('[data-slot="settings-dialog-header"]')!;
    await expect(header.textContent).toBe("Settings");
    await expect(header.querySelectorAll("p")).toHaveLength(0);

    // A tab with no icon and no tier is still named, and named from its label
    // alone rather than from a stray separator.
    const tabs = canvas.getAllByRole("tab");
    await expect(tabs.map((tab) => tab.getAttribute("aria-label"))).toEqual(["General", "Privacy"]);
    await expect(tabs[0].querySelector("svg")).toBeNull();
    await expect(tabs[0].querySelector('[data-slot="settings-dialog-tier"]')).toBeNull();

    // The destructive action's name is its own label, which is why the type
    // asks for a self-describing one: the row label is an inert span.
    await userEvent.click(canvas.getByRole("tab", { name: "Privacy" }));
    await waitFor(() => expect(canvas.getByRole("button", { name: "Delete workspace" })).toBeInTheDocument());
    const destructiveRow = canvas
      .getByRole("button", { name: "Delete workspace" })
      .closest('[data-slot="settings-dialog-row"]')!;
    const label = destructiveRow.querySelector('[data-slot="settings-dialog-row-label"]')!;
    await expect(label.tagName).toBe("SPAN");
    await expect(label.hasAttribute("for")).toBe(false);
  },
};

/**
 * ~90-character labels and a description well past that, in both places a
 * caller supplies text. The two make opposite decisions, and only one of them
 * is written down anywhere else.
 *
 * The **row** wraps. `settings-dialog-row-text` is `min-w-0` inside a
 * `grid-cols-[1fr_auto]` row, so a long label grows the row downwards and the
 * control stays pinned to the far edge; measured in a 36rem surface, nothing
 * scrolls sideways and nothing is clipped.
 *
 * The **nav** truncates. The column is a fixed `w-44` and the label span is
 * `truncate`, so "General and workspace defaults" paints 212px of text into
 * 127px. The accessible name is unaffected — the tab states its name outright,
 * so a screen reader still gets the whole thing, asserted below. **A sighted
 * mouse user gets nothing**: there is no `title` on the truncated span, so the
 * full name is unreachable without opening the section. Recorded, not fixed —
 * D3 `context-chips` carries the identical shape from wave 1, and a `title`
 * attribute is a component change rather than a class swap.
 *
 * One knock-on worth seeing: the per-section empty line interpolates the
 * section label, so a long name makes "No settings in … match this search."
 * long too.
 */
export const LongContent: Story = {
  args: {
    variant: "full-page",
    title: "Settings",
    sections: [
      {
        id: "general",
        label: "General and workspace defaults",
        icon: <Settings2 />,
        rows: [
          {
            id: "retry",
            label: "Automatically retry failed renders on the fastest available provider node",
            description:
              "When a render fails on the assigned worker, the job is re-queued once on whichever provider node reports the lowest latency, and the retry is billed at the same rate as the first attempt.",
            control: toggle("on"),
          },
          {
            id: "sounds",
            label: "Completion sounds",
            description: "Plays a chime when a long generation finishes in a background tab.",
            control: toggle("off"),
          },
        ],
      },
      BILLING,
    ],
    className: "w-[36rem]",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // The row text column wraps rather than clipping or scrolling.
    const label = canvasElement.querySelector<HTMLElement>('[data-slot="settings-dialog-row-label"]')!;
    const description = canvasElement.querySelector<HTMLElement>(
      '[data-slot="settings-dialog-row-description"]',
    )!;
    await expect(label.scrollWidth).toBe(label.clientWidth);
    await expect(description.scrollWidth).toBe(description.clientWidth);
    await expect(label.getBoundingClientRect().height).toBeGreaterThan(20);

    // The control stays on the far edge no matter how tall the text gets.
    const row = canvasElement.querySelector('[data-slot="settings-dialog-row"]')!;
    const control = canvasElement.querySelector('[data-slot="settings-dialog-row-control"]')!;
    await expect(Math.round(control.getBoundingClientRect().right)).toBe(
      Math.round(row.getBoundingClientRect().right),
    );

    // The nav truncates, and the name survives it.
    const tab = canvas.getByRole("tab", { name: "General and workspace defaults" });
    const navLabel = tab.querySelector<HTMLElement>("span.truncate")!;
    await expect(navLabel.scrollWidth).toBeGreaterThan(navLabel.clientWidth);
    await expect(navLabel.textContent).toBe("General and workspace defaults");
  },
};

/**
 * 375px, wrapper-constrained rather than by `parameters.viewport`, and measured
 * on the frame's own `data-testid` — the meta's `layout: "centered"` wraps every
 * story in a ~1200px centring div, so an overflow assertion against
 * `canvasElement.firstElementChild` measures that instead and passes for the
 * wrong reason.
 *
 * The surface does not scroll sideways. What it does instead is the finding:
 * **the nav takes 176 of the 375 px** — the `w-44` column is fixed and has no
 * narrow-width branch — leaving 183px for the panel, of which the text column
 * gets 135 and the control 32. Every row description in this catalog is a
 * sentence, so at phone width a two-line description becomes five lines. The
 * `full-page` variant is a desktop layout squeezed narrow; it survives, and it
 * is not a phone design.
 *
 * The `dialog` presentation cannot be shown here at all, which is worth
 * stating rather than leaving as an absence: it portals to `document.body` and
 * sizes itself from the viewport (`max-w-[calc(100%-2rem)]`), so no wrapper
 * reaches it and the gate's 1200px chromium renders it 1168px wide. At a real
 * 375px viewport its `sm:max-w-2xl` never applies and the same 176px nav has to
 * share 343px — the case this story cannot reach and the reason the number
 * above is worth having.
 */
export const Mobile: Story = {
  args: {
    variant: "full-page",
    title: "Settings",
    description: "Search every preference, or link straight to a section.",
    sections: [GENERAL, BILLING, PRIVACY],
  },
  render: (args) => {
    function Harness() {
      const [search, setSearch] = React.useState("");
      return (
        <div data-testid="mobile-frame" className="w-[375px] max-w-full">
          <SettingsDialog {...args} search={search} onSearchChange={setSearch} className="w-full" />
        </div>
      );
    }
    return <Harness />;
  },
  play: async ({ canvasElement }) => {
    const frame = within(canvasElement).getByTestId("mobile-frame");
    await expect(frame.scrollWidth).toBe(frame.clientWidth);
    await expect(document.documentElement.scrollWidth).toBe(document.documentElement.clientWidth);

    const nav = canvasElement.querySelector('[data-slot="settings-dialog-nav"]')!;
    const panel = canvasElement.querySelector('[data-slot="settings-dialog-panel"]')!;
    const navWidth = Math.round(nav.getBoundingClientRect().width);
    const panelWidth = Math.round(panel.getBoundingClientRect().width);
    // The number the description is about: navigation is nearly half the phone.
    await expect(`${navWidth}+${panelWidth} of ${frame.clientWidth}`).toBe("176+183 of 375");
    await expect(navWidth).toBeGreaterThan(panelWidth * 0.9);

    // Everything still fits inside the frame — no row spills past its edge.
    const right = frame.getBoundingClientRect().right;
    for (const row of canvasElement.querySelectorAll('[data-slot="settings-dialog-row"]')) {
      await expect(Math.round(row.getBoundingClientRect().right)).toBeLessThanOrEqual(Math.round(right));
    }
  },
};

/**
 * Two boundaries, one story, because this component sits on both.
 *
 * **Against itself.** `dialog` and `full-page` are one component in two
 * presentations rather than two components, and the rule for choosing is
 * cheapness first: start with `dialog`, and move to `full-page` only when a
 * section list gets long enough that people hunt for a setting, or when you
 * want to link someone straight to one. The variant changes the frame and
 * whether search exists; it does not change a row. P2 `detail-view-shell` is
 * the same shape one layer up, and took the same decision.
 *
 * **Against A6 `field-row`**, the near-twin the docs page already warns about.
 * They share three ingredients — a label, a hint, a control — and lay them out
 * differently enough that swapping one for the other reads as a different
 * product. Measured below: A6 puts the label in a fixed `6rem` column with the
 * control immediately beside it and the hint under the whole row; M1 gives the
 * label a flexible column, puts the description under it, and pushes the
 * control to the far edge. The choosing rule follows from that: A6 for a
 * compact inspector where a column of controls must align, M1 for a settings
 * page where the description is the point.
 *
 * **The composition gap, recorded and unchanged.** O12 `settings-shell` fills
 * itself with M1's `full-page` variant and has to suppress two things M1
 * renders unconditionally: the section nav (the page's sections are URLs, so
 * the nav is B3's job) and the search field (the spec puts search in the nav
 * column). Both are hidden with `[&_[data-slot=…]]:hidden` at the call site,
 * and the shell's own constants say to delete them the moment M1 grows a
 * `chrome`/`nav={false}` opt-out. Worse, M1's `matchesQuery` is private, so
 * the shell reimplemented the predicate to count matches per section — two
 * copies of one matching rule, already differing in shape. Neither an opt-out
 * nor an export is added here; both are API decisions.
 */
export const Boundary: Story = {
  args: {
    variant: "full-page",
    title: "Settings",
    sections: [GENERAL, BILLING],
    className: "w-[26rem]",
  },
  render: (args) => (
    <div className="flex w-full flex-col gap-6">
      <section className="flex flex-col gap-2">
        <h3 className="text-foreground text-xs font-medium">
          M1 settings dialog — a description per row, the control at the far edge
        </h3>
        <SettingsDialog {...args} />
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="text-foreground text-xs font-medium">
          A6 field row — a fixed label column, the control beside it
        </h3>
        <div className="w-[26rem] space-y-3">
          <FieldRow label="Steps" hint="More steps, slower render.">
            {(controlId, describedBy) => (
              <UnitInput id={controlId} aria-describedby={describedBy} unit="steps" defaultValue={28} />
            )}
          </FieldRow>
          <FieldRow label="Guidance" hint="How closely the render follows the prompt.">
            {(controlId, describedBy) => (
              <UnitInput id={controlId} aria-describedby={describedBy} unit="cfg" defaultValue={7} />
            )}
          </FieldRow>
        </div>
      </section>
    </div>
  ),
  play: async ({ canvasElement }) => {
    // The two grids, measured rather than described: A6 pins the label column,
    // M1 lets it flex and pins the control instead.
    const settingsRow = canvasElement.querySelector<HTMLElement>('[data-slot="settings-dialog-row"]')!;
    const fieldRowGrid = canvasElement.querySelector<HTMLElement>('[data-slot="field-row"] > div')!;
    await expect(getComputedStyle(fieldRowGrid).gridTemplateColumns.startsWith("96px ")).toBe(true);

    // M1's is the mirror image: the *control* column is the fixed one (auto,
    // sized to the switch) and the text column takes what is left.
    const settingsColumns = getComputedStyle(settingsRow).gridTemplateColumns.split(" ").map(parseFloat);
    await expect(settingsColumns).toHaveLength(2);
    const control = canvasElement.querySelector('[data-slot="settings-dialog-row-control"]')!;
    await expect(Math.round(settingsColumns[1])).toBe(Math.round(control.getBoundingClientRect().width));
    await expect(Math.round(settingsColumns[0] + settingsColumns[1] + 16)).toBe(
      Math.round(settingsRow.getBoundingClientRect().width),
    );
    await expect(settingsColumns[0]).toBeGreaterThan(96);

    // A6's hint sits under the whole row; M1's description sits under the label
    // inside the text column, which is why the two cannot be swapped.
    const settingsDescription = canvasElement.querySelector('[data-slot="settings-dialog-row-description"]')!;
    await expect(settingsDescription.closest('[data-slot="settings-dialog-row-text"]')).not.toBeNull();
    const hint = canvasElement.querySelector('[data-slot="field-row-hint"]')!;
    await expect(hint.closest('[data-slot="field-row-control"]')).toBeNull();
  },
};
