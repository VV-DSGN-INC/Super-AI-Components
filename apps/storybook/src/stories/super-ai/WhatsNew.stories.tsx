import type { Meta, StoryObj } from "@storybook/react-vite";
import { Layers, Mic, PackageOpen } from "lucide-react";
import type { ReactNode } from "react";
import * as React from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { FeatureAnnouncement } from "@/registry/super-ai/feature-announcement";
import { WhatsNew, type WhatsNewEntry } from "@/registry/super-ai/whats-new";
import { WhatsNewDocs } from "@/content/components/whats-new.docs";
import { componentDocsPage } from "@/lib/component-docs-page";
import { focusTreatmentSignature, settledFocusRing } from "@/lib/focus-ring";

const meta: Meta<typeof WhatsNew> = {
  title: "Super AI/Whats New",
  component: WhatsNew,
  parameters: { layout: "centered", docs: { page: componentDocsPage(WhatsNewDocs) } },
};

export default meta;
type Story = StoryObj<typeof WhatsNew>;

function HeroMedia({ icon, caption }: { icon: ReactNode; caption: string }) {
  return (
    <div className="bg-muted text-foreground flex aspect-video w-full flex-col items-center justify-center gap-2">
      <span className="[&_svg]:size-8">{icon}</span>
      <span className="text-xs">{caption}</span>
    </div>
  );
}

const ENTRIES: WhatsNewEntry[] = [
  {
    id: "layers",
    title: "Layer groups",
    date: "12 March 2026",
    dateTime: "2026-03-12",
    stage: "New",
    summary: "Nest layers into a group and move, hide, or export them as one.",
    media: <HeroMedia icon={<Layers aria-hidden />} caption="Grouped layers in the canvas sidebar" />,
    body: "Select any two layers and press Cmd G. Groups nest, and a group carries its own opacity and blend mode.",
  },
  {
    id: "voices",
    title: "Custom voices",
    date: "28 February 2026",
    dateTime: "2026-02-28",
    stage: "Beta",
    summary: "Train a voice from a 30-second sample and reuse it across every project.",
    media: <HeroMedia icon={<Mic aria-hidden />} caption="Voice training from a short sample" />,
    body: "Voices are workspace-wide, so anyone on the team can narrate with them once you publish.",
  },
  {
    id: "batch",
    title: "Batch export",
    date: "14 February 2026",
    dateTime: "2026-02-14",
    summary: "Queue every variant in one pass instead of exporting them one at a time.",
    media: <HeroMedia icon={<PackageOpen aria-hidden />} caption="Six variants queued for export" />,
  },
];

/**
 * The left pane: every entry dated on its own row, newest first. The list is
 * the tablist that drives the panel beside it, so the row being read and the
 * panel being read are one selection rather than two columns that happen to
 * agree.
 *
 * The date on the row is what makes this state worth its own story. It is the
 * part the spec calls mandatory — a changelog without dates is marketing — and
 * putting it in the list means scanning the release history never costs a
 * click.
 */
export const EntryList: Story = {
  args: {
    entries: ENTRIES,
    defaultOpen: true,
    description: "Everything shipped in the last few releases.",
  },
};

/**
 * The right pane, opened on the second entry rather than the first so the
 * panel is visibly driven by the selection instead of merely showing the top
 * of the list.
 *
 * Read it top down: hero media, then the stage badge and date, then the
 * heading. The media leads because it explains the feature faster than the
 * copy does — that is the order on every reference board, and dropping it is
 * the pitfall the docs page ends on.
 */
export const EntryDetail: Story = {
  args: { entries: ENTRIES, defaultOpen: true, defaultSelectedId: "voices" },
};

/**
 * Unread is per-entry state the host owns, and the number of dots is what the
 * trigger badge counts. Left closed in the docs canvas on purpose: the badge is
 * this state's payoff, and every open story hides the trigger behind the
 * dialog.
 *
 * The claim worth checking is that the dot is never the whole signal, on either
 * surface. B3 `sidebar-nav`'s unread dot contributes nothing to its row's
 * accessible name, so there the state exists only for people who can see the
 * colour. Here both the badge and the dot carry a visually hidden word, and the
 * play measures the two computed names rather than reading the classes: the
 * trigger announces "What's new 2 unread", and an unread row announces "Layer
 * groups Unread 12 March 2026". That second name has a cost the docs page
 * already records — every row announces its date as well, so a long list is
 * slow to arrow through — but the state itself survives without colour.
 */
export const Unread: Story = {
  args: {
    entries: [{ ...ENTRIES[0], unread: true }, { ...ENTRIES[1], unread: true }, ENTRIES[2]],
    onEntryRead: () => {},
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Closed: the count and the word arrive together, so "2" is never a bare
    // number and the badge is never colour alone.
    const trigger = canvas.getByRole("button", { name: "What's new 2 unread" });

    // Open: the dot inside the row does the same job. Looking the row up by its
    // full name is the assertion — a dot contributing nothing would leave the
    // name at "Layer groups 12 March 2026" and this would throw.
    await userEvent.click(trigger);
    const dialog = await within(document.body).findByRole("dialog", { name: "What's new" });
    const row = within(dialog).getByRole("tab", { name: "Layer groups Unread 12 March 2026" });
    await expect(row.querySelector('[data-slot="whats-new-unread"]')).toBeInTheDocument();

    // …and a read row carries neither dot nor word, so the two are told apart
    // by more than a colour.
    const read = within(dialog).getByRole("tab", { name: "Batch export 14 February 2026" });
    await expect(read.querySelector('[data-slot="whats-new-unread"]')).toBeNull();
  },
};

/**
 * The call-to-action is an action, not a link out: it lands the reader in the
 * feature the entry is about. `WhatsNewEntryCta` has no `href` by design — a
 * changelog that sends you to a marketing page has failed twice, once by not
 * explaining the feature and once by ejecting you from the product.
 *
 * It is `mt-auto self-start`, so it sinks to the bottom of the detail pane and
 * keeps its own width. Where that stops working is `LongContent`.
 */
export const EntryCta: Story = {
  args: {
    entries: [
      { ...ENTRIES[0], cta: { label: "Open the layers panel", onAction: () => {} } },
      { ...ENTRIES[1], cta: { label: "Train a voice", onAction: () => {} } },
      { ...ENTRIES[2], cta: { label: "Open export queue", onAction: () => {} } },
    ],
    defaultOpen: true,
  },
};

/* -------------------------------------------------------------------------
 * Case stories — the situations this component meets in a product, as opposed
 * to the prop combinations above. See docs/design-system/story-conventions.md.
 *
 * All eight are true here, so there are no `case-skip` lines. That follows from
 * the shape rather than from diligence: a portaled Base UI dialog (so it
 * animates, and a wrapper cannot reach it), two panes with a rule between them
 * (so it has a direction), a vertical tablist plus a scrollable panel plus a
 * close button (so it has an order), two real controlled pairs, author-supplied
 * titles and CTA labels inside fixed-width columns, and a near-twin one rung
 * down the same ladder in L3 `feature-announcement`.
 *
 * Every story here that opens the dialog also proves it is named. That is the
 * cheapest of this programme's recurring findings to check and the one four
 * components shipped without: a Base UI popup takes its name from a title
 * rendered inside it, and nothing renders that title until a story opens it.
 * ---------------------------------------------------------------------- */

/**
 * Sets `dir` on the document rather than on a wrapper, because `DialogContent`
 * portals to the end of `document.body` and a wrapper in the story canvas is
 * never an ancestor of the thing under test. `shortcuts-sheet` established this
 * for the same primitive.
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

function describe(el: Element | null) {
  if (el === null) return "nothing";
  const slot = el.getAttribute("data-slot") ?? el.tagName.toLowerCase();
  return `${slot}:${el.textContent?.trim().slice(0, 28) ?? ""}`;
}

/**
 * The focused element once Base UI has finished moving focus off `previous`.
 *
 * The entry list is a Base UI composite and its key handler calls `.focus()`
 * inside a `queueMicrotask`, so a read taken the instant a key event resolves
 * can return the row focus is *leaving*. Waiting for "focus is on some expected
 * stop" cannot see that, because focus was on an expected stop — the stale one.
 * This is the settle-on-departure form `ai-tools-menu` arrived at after a lap
 * that passed thirteen warm runs and failed the first cold one.
 */
async function settledStop(stops: HTMLElement[], previous?: HTMLElement) {
  await waitFor(() => {
    const active = document.activeElement as HTMLElement | null;
    if (!active || !stops.includes(active)) {
      throw new Error(`focus is not on an expected stop: ${describe(active)}`);
    }
    if (previous && active === previous) {
      throw new Error(`focus has not moved off ${describe(previous)} yet`);
    }
  });
  return document.activeElement as HTMLElement;
}

/**
 * Right-to-left, which for a two-pane dialog comes down to one pixel: the edge
 * the rule between the panes is drawn on.
 *
 * The panes mirror for free — they are flex children in DOM order, so the entry
 * list moves to the right and the detail pane to the left. The rule does not
 * mirror for free, and this story is why three classes in the source are
 * logical rather than physical:
 *
 * - the list's `border-e pe-2`, which draws the rule on the inner edge in both
 *   directions. As `border-r` it stayed on the visual left, which under RTL is
 *   the *outer* edge of the dialog — a rule sitting against the dialog's own
 *   border with nothing at all between the panes.
 * - the row's `text-start`, so the title and the date hang off the reading edge
 *   rather than off the left.
 * - the panel's `pe-1` scrollbar gutter.
 *
 * All three are byte-identical in LTR (`pe-2` and `pr-2` compile to the same
 * declaration in the shipped direction), which is what makes them a sweep
 * rather than a design change — CONTINUE.md §8, "Logical properties". The play
 * asserts the border side rather than the class, so re-physicalising it fails
 * here instead of shipping quietly; `track-lane` is the precedent for pinning a
 * swap that way.
 *
 * **A positive worth recording, because it is the exception.** Wave 1 found
 * that no `DirectionProvider` is mounted anywhere, so Base UI composites read
 * `useDirection()` as `"ltr"` and their arrow keys move in DOM order whatever
 * the document says. That defect cannot reach this component: the list is
 * `orientation="vertical"`, and `useCompositeRoot` consults `isRtl` only when
 * resolving the *horizontal* forward and backward keys. Down is down in both
 * directions, and the play measures it rather than assuming it.
 *
 * **Recorded, not fixed:** the dialog's close button is `absolute top-2
 * right-2`, a physical corner in `components/ui/dialog.tsx`. Under RTL it stays
 * on the right, which is now the entry list's outer edge, so it lands over the
 * list instead of over the empty end of the header. Every dialog in the repo
 * shares it — `shortcuts-sheet` records the same collision — and the class is
 * in a vendored file this component does not own.
 */
export const RTL: Story = {
  args: { entries: ENTRIES, defaultOpen: true },
  render: (args) => (
    <RtlDocument>
      <WhatsNew {...args} />
    </RtlDocument>
  ),
  play: async () => {
    const dialog = await within(document.body).findByRole("dialog", { name: "What's new" });
    await expect(getComputedStyle(dialog).direction).toBe("rtl");

    const list = dialog.querySelector<HTMLElement>('[data-slot="whats-new-list"]')!;
    const panel = dialog.querySelector<HTMLElement>('[data-slot="whats-new-detail"]:not([hidden])')!;

    // The list is now the right-hand pane…
    await expect(
      `list right of detail: ${list.getBoundingClientRect().left > panel.getBoundingClientRect().left}`,
    ).toBe("list right of detail: true");

    // …so the rule between them has to be on the list's left edge. Asserting
    // the side rather than the class is the point: `border-r` would put a width
    // on the right here and still read as "has a border".
    const listStyle = getComputedStyle(list);
    await expect(`inner ${listStyle.borderLeftWidth} / outer ${listStyle.borderRightWidth}`).toBe(
      "inner 1px / outer 0px",
    );

    // The row text hangs off the reading edge. Two reads, because neither is
    // enough on its own: Chrome reports the *keyword* for `text-align`, so
    // `start` and `left` are distinguishable there but the resolved side is
    // not, and a title short enough to leave slack in its box is the only
    // place the resolved side is visible. The range measures the painted text
    // rather than its box, which is `flex-1` and fills the row either way.
    const tabs = Array.from(dialog.querySelectorAll<HTMLElement>('[data-slot="whats-new-entry"]'));
    await expect(getComputedStyle(tabs[0]).textAlign).toBe("start");
    const title = tabs[0].querySelector<HTMLElement>(".truncate")!;
    const range = document.createRange();
    range.selectNodeContents(title);
    await expect(
      `title hugs the right edge: ${Math.round(title.getBoundingClientRect().right - range.getBoundingClientRect().right) <= 1}`,
    ).toBe("title hugs the right edge: true");

    // Down is still down: a vertical composite never reads the direction, so
    // the missing DirectionProvider costs this component nothing.
    tabs[0].focus();
    await settledStop(tabs);
    await userEvent.keyboard("{ArrowDown}");
    await expect(describe(await settledStop(tabs, tabs[0]))).toBe(describe(tabs[1]));
    await expect(tabs[1].getBoundingClientRect().top).toBeGreaterThan(tabs[0].getBoundingClientRect().top);

    // Recorded, not fixed: the shared close button keeps its physical corner,
    // so it lands over the entry list rather than over the header's slack.
    const close = dialog.querySelector<HTMLElement>('[data-slot="dialog-close"]')!;
    await expect(
      `close over list: ${close.getBoundingClientRect().left > list.getBoundingClientRect().left}`,
    ).toBe("close over list: true");
  },
};

/**
 * The reduced-motion branch, and the reason the component's own className
 * carries one variant twice.
 *
 * `DialogContent` opens with `data-open:animate-in fade-in-0 zoom-in-95` and
 * closes with `data-closed:animate-out`, neither of which reads the media
 * feature. The registry's usual one-class remedy — a bare
 * `motion-reduce:animate-none` — is inert on a Base UI popup: Tailwind v4 wraps
 * the data-attribute test in `:where(…)`, so both sides compile to the same
 * single-class specificity, the tie falls to source order, and the plain
 * `motion-reduce:` block is emitted first. `animation: enter` wins and the
 * class sits in the string doing nothing. Restating the variant on both halves
 * sorts after its counterpart and wins the same tie.
 *
 * `vitest.config.ts` emulates `prefers-reduced-motion: reduce` for every test,
 * so the assertion below is the rendered result rather than a class check: the
 * popup's computed `animation-name` resolves to `none` while `data-open` is
 * still on the element. Measured on this component before the fix, it read
 * `"enter"`.
 *
 * Two things this does **not** cover, both outside the className the component
 * can reach:
 *
 * - the backdrop still fades. `DialogOverlay`'s animation classes live in
 *   `components/ui/dialog.tsx` and take no className from here.
 * - the trigger still nudges a pixel on press. The vendored `Button` carries
 *   `transition-all` with `active:translate-y-px` and no branch, which is a
 *   primitive-wide posture recorded in §8 rather than this component's to fix.
 *
 * The entry rows' `transition-colors` is deliberately left alone. It crossfades
 * a background and a text colour and moves nothing, so suppressing it would
 * document a branch nobody can perceive — the `reset-affordance` case.
 */
export const ReducedMotion: Story = {
  args: { entries: ENTRIES, defaultOpen: true },
  play: async () => {
    const dialog = await within(document.body).findByRole("dialog", { name: "What's new" });

    // Still opening — the attribute the animation is keyed off is on the
    // element, so this is the frame a bare `motion-reduce:animate-none` fails
    // to reach.
    await expect(dialog).toHaveAttribute("data-open");
    await expect(getComputedStyle(dialog).animationName).toBe("none");
  },
};

/**
 * The keyboard contract, and the story this wave's steering asked for: what the
 * list-to-detail transition does to focus.
 *
 * What it pins:
 *
 * 1. Closed, the component is exactly one tab stop — the trigger.
 * 2. Open, it is four in DOM order: the entry list (one roving stop however
 *    many entries there are), the scrollable detail pane, that entry's
 *    call-to-action, and the close button. The close button paints in the top
 *    corner and is last in the DOM, so it is the final stop rather than the
 *    first, which is the order the docs page claims.
 * 3. Focus is trapped: the tab after the close button is the first stop again.
 * 4. Every stop paints a visible treatment, and focus is what paints it. Both
 *    checks run, because they answer different questions: `settledFocusRing`
 *    asks whether anything is painted — and waits, because the CTA is a
 *    vendored `Button` whose ring fades in over `transition-all` — while the
 *    signature differential asks whether focus caused it, taken on the next
 *    stop while focus is still on the previous one so the walk is undisturbed.
 *
 *    **This is where the docs page is wrong, and the measurement is why.** Its
 *    focus notes say the scrollable detail pane "is a tab stop with no visible
 *    focus indicator: it carries `outline-none` and no replacement ring". The
 *    pane carries `focus-visible:ring-ring focus-visible:ring-2` and paints
 *    it — confirmed both ways round, since deleting those two classes makes the
 *    differential report "unchanged" and this story fail. The sentence appears
 *    to predate the ring. Correcting `whats-new.docs.tsx` is outside the files
 *    a wave agent may touch, so it is reported rather than edited.
 * 5. **The list-to-detail transition.** Arrowing moves focus and nothing else —
 *    `activateOnFocus` is left at Base UI's default of `false`, so `onSelect`
 *    never fires while a keyboard user browses. Enter commits, the pane changes,
 *    and focus stays on the tab, which is what a tablist is supposed to do and
 *    is asserted as correct rather than treated as a defect.
 * 6. Escape closes the dialog **and returns focus to the trigger**, so the
 *    reader lands back on the control they opened rather than at the top of the
 *    document.
 *
 * **Recorded, not pinned — the pane changes with nothing announcing it.**
 * Committing a different entry replaces the whole detail pane, and there is no
 * live region anywhere in the tree, so a screen-reader user learns the pane
 * moved only by tabbing into it. The play measures that the contents really did
 * change while focus stayed put, which is the mechanical half; supplying the
 * announcement is an API decision (a polite live region, or moving focus into
 * the panel and giving up the tablist convention) and belongs to whoever makes
 * that call.
 *
 * The walk is one lap rather than a budget. This is a modal dialog, so a "tab
 * until you leave the canvas" loop would never terminate, and each read waits
 * for focus to leave the stop it was on, which makes every press provably one
 * move.
 */
export const KeyboardOrder: Story = {
  args: {
    entries: [
      { ...ENTRIES[0], unread: true, cta: { label: "Open the layers panel", onAction: () => {} } },
      ENTRIES[1],
      ENTRIES[2],
    ],
  },
  play: async ({ canvasElement }) => {
    const body = within(document.body);
    const canvas = within(canvasElement);

    // Closed: one stop in the page.
    const trigger = canvas.getByRole("button", { name: "What's new 1 unread" });
    const closedStops = Array.from(
      canvasElement.querySelectorAll<HTMLElement>(
        'button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      ),
    );
    await expect(closedStops).toEqual([trigger]);

    await userEvent.tab();
    await expect(document.activeElement).toBe(trigger);
    await settledFocusRing(trigger, waitFor);
    await userEvent.keyboard("{Enter}");

    // The popup is named. A Base UI dialog takes its name from a title rendered
    // inside it, so nothing checks this until a story opens it.
    const dialog = await body.findByRole("dialog", { name: "What's new" });

    const tabs = Array.from(dialog.querySelectorAll<HTMLElement>('[data-slot="whats-new-entry"]'));
    const panelOf = () => dialog.querySelector<HTMLElement>('[data-slot="whats-new-detail"]:not([hidden])')!;
    const cta = dialog.querySelector<HTMLElement>('[data-slot="whats-new-cta"]')!;
    const close = dialog.querySelector<HTMLElement>('[data-slot="dialog-close"]')!;

    // Opening lands on the selected entry's tab — the first tabbable element
    // inside the popup — rather than on the popup itself.
    const stops = [tabs[0], panelOf(), cta, close];
    await settledStop(stops);
    await expect(describe(document.activeElement)).toBe(describe(tabs[0]));

    // One lap. Four stops, each new, each visibly focused. The signature of
    // the *next* stop is read while focus is still on the previous one, so the
    // differential costs the walk nothing: no blur, nothing disturbed. It
    // answers the question `settledFocusRing` cannot — whether focus is what
    // painted the treatment, rather than whether one is painted at all.
    const visited = [document.activeElement as HTMLElement];
    let previous = document.activeElement as HTMLElement;
    await settledFocusRing(previous, waitFor);
    for (let i = 1; i < stops.length; i += 1) {
      const restingSignature = focusTreatmentSignature(stops[i]);
      await userEvent.tab();
      const focused = await settledStop(stops, previous);
      await waitFor(() =>
        expect(
          `${describe(focused)} treatment ${focusTreatmentSignature(focused) === restingSignature ? "unchanged" : "changed"} on focus`,
        ).toBe(`${describe(focused)} treatment changed on focus`),
      );
      await expect(`${describe(focused)} repeat=${visited.includes(focused)}`).toBe(
        `${describe(focused)} repeat=false`,
      );
      await expect(`${describe(focused)} focusVisible=${focused.matches(":focus-visible")}`).toBe(
        `${describe(focused)} focusVisible=true`,
      );
      await settledFocusRing(focused, waitFor);
      visited.push(focused);
      previous = focused;
    }

    // All four, in DOM order — which is what puts the close button last
    // despite it painting in the top corner.
    await expect(visited.map(describe)).toEqual(stops.map(describe));

    // Trapped: the tab after the last stop is the first one again, not the
    // inert page behind the dialog.
    await userEvent.tab();
    await expect(describe(await settledStop(stops, previous))).toBe(describe(tabs[0]));

    // The list-to-detail transition. Arrowing moves focus and nothing else:
    // selection is manual, so the pane is still the first entry's.
    await userEvent.keyboard("{ArrowDown}");
    await settledStop(tabs, tabs[0]);
    await expect(document.activeElement).toBe(tabs[1]);
    await expect(tabs[0]).toHaveAttribute("aria-selected", "true");
    await expect(panelOf()).toHaveTextContent("Layer groups");

    // Enter commits. The pane really does change…
    await userEvent.keyboard("{Enter}");
    await waitFor(() => expect(tabs[1]).toHaveAttribute("aria-selected", "true"));
    await expect(panelOf()).toHaveTextContent("Custom voices");

    // …and focus stays on the tab, which is correct for a tablist. Nothing
    // announces the change: there is no live region in the tree, so the only
    // route to the new content is the next Tab.
    await expect(document.activeElement).toBe(tabs[1]);
    await expect(dialog.querySelector("[aria-live]")).toBeNull();

    // Escape dismisses, and the trigger gets focus back.
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("dialog")).toBeNull());
    await waitFor(() => expect(document.activeElement).toBe(trigger));
  },
};

/**
 * A host holding both controlled pairs, and refusing one of them.
 *
 * `open`/`onOpenChange` is applied, so the dialog opens and closes normally.
 * `selectedId`/`onSelect` is pinned: the host records what was asked for and
 * declines to move. That is a shape a real consumer needs — a changelog whose
 * selection is in the URL, or one that will not switch entries until a
 * confirmation resolves — and it is the half a story has to prove, because a
 * component that quietly ignored `selectedId` would look identical until
 * someone tried.
 *
 * The three things the convention asks for, in order:
 *
 * 1. Interaction alone does not move the rendered value. Clicking the second
 *    row leaves the pane on the first entry and leaves `aria-selected` where it
 *    was.
 * 2. The callback fires with the payload a host needs in order to apply it — a
 *    plain entry id, read back from the harness's own readout.
 * 3. Re-rendering with an unchanged value holds the component fixed. The
 *    re-render is not manufactured: reporting the selection is what re-renders
 *    the host, and the readout's counter proves the pass happened before the
 *    pane is checked again, so the assertion is not vacuous.
 *
 * The harness's own controls sit outside the dialog and are only used while it
 * is closed. An open Base UI dialog marks everything outside itself inert,
 * which is correct behaviour and would otherwise make the last step
 * untestable.
 */
export const Controlled: Story = {
  render: () => <ControlledHost />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);

    // The `open` pair, applied: the host is what opens the dialog.
    await userEvent.click(canvas.getByRole("button", { name: "What's new" }));
    await expect(canvas.getByTestId("open-prop")).toHaveTextContent("true");
    const dialog = await body.findByRole("dialog", { name: "What's new" });

    const rowFor = (name: string) => within(dialog).getByRole("tab", { name: new RegExp(name) });
    const panel = () => dialog.querySelector<HTMLElement>('[data-slot="whats-new-detail"]:not([hidden])')!;

    await expect(panel()).toHaveTextContent("Layer groups");

    // 1. Interaction alone does not move the rendered value.
    await userEvent.click(rowFor("Custom voices"));
    await expect(rowFor("Layer groups")).toHaveAttribute("aria-selected", "true");
    await expect(rowFor("Custom voices")).toHaveAttribute("aria-selected", "false");
    await expect(panel()).toHaveTextContent("Layer groups");

    // 2. The callback fired, with the id a host needs to apply it.
    await expect(canvas.getByTestId("requested")).toHaveTextContent("voices");

    // 3. That report re-rendered the host with an unchanged `selectedId`, and
    //    the component held. The counter proves the pass happened.
    const passAfterFirst = Number(canvas.getByTestId("render-pass").textContent);
    await expect(passAfterFirst).toBeGreaterThan(1);
    await userEvent.click(rowFor("Batch export"));
    await expect(canvas.getByTestId("requested")).toHaveTextContent("batch");
    await expect(Number(canvas.getByTestId("render-pass").textContent)).toBeGreaterThan(passAfterFirst);
    await expect(panel()).toHaveTextContent("Layer groups");

    // The `open` pair the other way round, and the dismissal waited out so axe
    // never measures a half-faded popup.
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("dialog")).toBeNull());
    await expect(canvas.getByTestId("open-prop")).toHaveTextContent("false");

    // The payload was sufficient to apply the change — the whole point of
    // reporting it rather than swallowing it.
    await userEvent.click(canvas.getByRole("button", { name: "Apply last request" }));
    await userEvent.click(canvas.getByRole("button", { name: "What's new" }));
    const reopened = await body.findByRole("dialog", { name: "What's new" });
    await expect(
      reopened.querySelector<HTMLElement>('[data-slot="whats-new-detail"]:not([hidden])'),
    ).toHaveTextContent("Batch export");
  },
};

function ControlledHost() {
  const [open, setOpen] = React.useState(false);
  const [applied, setApplied] = React.useState("layers");
  const [requested, setRequested] = React.useState<string | null>(null);
  const passRef = React.useRef(0);
  passRef.current += 1;

  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <WhatsNew
        entries={ENTRIES}
        open={open}
        onOpenChange={setOpen}
        selectedId={applied}
        onSelect={setRequested}
      />

      <dl className="text-foreground grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs">
        <dt>open prop</dt>
        <dd data-testid="open-prop">{String(open)}</dd>
        <dt>selectedId prop</dt>
        <dd data-testid="applied">{applied}</dd>
        <dt>last onSelect</dt>
        <dd data-testid="requested">{requested ?? "—"}</dd>
        <dt>host render pass</dt>
        <dd data-testid="render-pass" className="tabular-nums">
          {passRef.current}
        </dd>
      </dl>

      <button
        type="button"
        className="border-border text-foreground self-start rounded-md border px-2 py-1 text-xs"
        onClick={() => requested && setApplied(requested)}
      >
        Apply last request
      </button>
    </div>
  );
}

/**
 * Everything optional left out, on both surfaces at once.
 *
 * On the trigger, `triggerLabel=""` is the empty-string collapse this registry
 * keeps finding, in a shape that trips no gate: the button still has an
 * accessible name, because the unread badge supplies one. It announces as "2
 * unread" — a control that names its own count and never says what it opens.
 * The name is also *conditional on unread work existing*: with every entry read
 * the badge is not rendered at all, the icon is `aria-hidden`, and the same
 * call site ships a nameless button. Measured rather than reasoned — the same
 * args with one read entry fail axe outright on `button-name` — so this story
 * renders the shape that survives and records the one that does not, rather
 * than pushing a known failure into the gate. H4 `transcript-editor` set that
 * precedent.
 *
 * In the entries, `summary`, `stage`, `body` and `media` are all optional and
 * all gone, which leaves the detail pane holding a date and a heading. The
 * media is the omission that matters: the docs page's last pitfall is dropping
 * it because the copy explains well enough, and with the copy gone too the pane
 * is two lines where the reference boards have a picture. The pane keeps its
 * full height regardless — `flex-1` on the panel — so nothing in the layout
 * signals that anything is missing.
 *
 * `description` is omitted as well, so the dialog header collapses to its title
 * with no line under it. That one is the intended optional case rather than a
 * defect, and it is here so the two kinds of omission sit side by side.
 */
export const EmptyLabel: Story = {
  args: {
    triggerLabel: "",
    entries: [
      { id: "layers", title: "Layer groups", date: "12 March 2026", dateTime: "2026-03-12", unread: true },
      {
        id: "voices",
        title: "Custom voices",
        date: "28 February 2026",
        dateTime: "2026-02-28",
        unread: true,
      },
      { id: "batch", title: "Batch export", date: "14 February 2026", dateTime: "2026-02-14" },
    ],
    onEntryRead: () => {},
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // The label is gone and the badge is the whole name.
    const trigger = canvas.getByRole("button", { name: "2 unread" });
    await expect(trigger.querySelector('[data-slot="whats-new-trigger-badge"]')).toBeInTheDocument();

    await userEvent.click(trigger);
    const dialog = await within(document.body).findByRole("dialog", { name: "What's new" });

    // No line under the heading, and nothing in the pane but a date and a
    // heading: no media, no stage badge, no summary, no body, no CTA.
    await expect(dialog.querySelector('[data-slot="dialog-description"]')).toBeNull();
    const panel = dialog.querySelector<HTMLElement>('[data-slot="whats-new-detail"]:not([hidden])')!;
    for (const slot of ["whats-new-media", "whats-new-stage", "whats-new-body", "whats-new-cta"]) {
      await expect(`${slot}: ${panel.querySelector(`[data-slot="${slot}"]`) === null}`).toBe(`${slot}: true`);
    }
    await expect(panel.querySelector('[data-slot="whats-new-title"]')).toHaveTextContent("Layer groups");

    // The pane keeps its full height anyway, so the emptiness reads as a
    // design rather than as a gap.
    await expect(panel.getBoundingClientRect().height).toBeGreaterThan(200);
  },
};

/**
 * A ~90 character entry title and a call-to-action label to match — what a
 * changelog looks like the first time an entry is written by whoever shipped
 * the feature rather than by whoever owns the surface.
 *
 * Three different answers in one component, which is the finding:
 *
 * - **The row clips.** The list is a fixed `w-44 sm:w-56` and the title is
 *   `truncate`, so a long title becomes one clipped line with no `title`
 *   attribute and no tooltip. Two entries differing only after the ellipsis are
 *   two rows a reader cannot tell apart without opening both.
 * - **The pane wraps.** The detail `<h3>` has no truncation, so the same string
 *   renders in full over several lines. That is the right call, and it means
 *   the list is not a preview of the pane: the only way to read an entry's
 *   title is to select it.
 * - **The call-to-action does neither.** It is a vendored `Button`, so it is
 *   `whitespace-nowrap` and `shrink-0`, and `self-start` lets it size to its
 *   content. A long label grows past the pane's width, and because the pane is
 *   `overflow-y-auto` — which computes `overflow-x` to `auto` rather than
 *   `visible` — the detail pane scrolls sideways. Measured at the default
 *   dialog width: the button is 602px inside a 496px pane, so the whole pane,
 *   media and heading included, is dragged 110px wider by the label on one
 *   button. The crossing point is around 75 characters there, and every label
 *   in `EntryCta` is well under it — at the 375px width `Mobile` renders, where
 *   the pane keeps about a hundred pixels, none of them would be.
 *
 * This wave's steering expected the title and the CTA to compete for one row.
 * They do not, because the CTA lives in the detail pane rather than in the
 * list. The competition is with the pane's width instead, and the CTA wins it.
 */
export const LongContent: Story = {
  args: {
    defaultOpen: true,
    entries: [
      {
        ...ENTRIES[0],
        title: "Layer groups, nested masks and per-group blend modes, now across the whole canvas",
        cta: {
          label: "Open the layers panel and show me the new grouping controls, nested masks and blend modes",
          onAction: () => {},
        },
      },
      ENTRIES[1],
    ],
  },
  play: async () => {
    const dialog = await within(document.body).findByRole("dialog", { name: "What's new" });
    const row = dialog.querySelector<HTMLElement>('[data-slot="whats-new-entry"]')!;
    const rowTitle = row.querySelector<HTMLElement>(".truncate")!;
    const panel = dialog.querySelector<HTMLElement>('[data-slot="whats-new-detail"]:not([hidden])')!;
    const heading = panel.querySelector<HTMLElement>('[data-slot="whats-new-title"]')!;
    const cta = panel.querySelector<HTMLElement>('[data-slot="whats-new-cta"]')!;

    const lines = (el: HTMLElement) =>
      Math.round(el.scrollHeight / parseFloat(getComputedStyle(el).lineHeight));

    // The row: one clipped line, and nothing reveals the rest of it.
    await expect(
      `row clipped=${rowTitle.scrollWidth > rowTitle.clientWidth} lines=${lines(rowTitle)} title=${row.hasAttribute("title")}`,
    ).toBe("row clipped=true lines=1 title=false");

    // The pane: the same string, wrapped in full.
    await expect(`heading lines>1: ${lines(heading) > 1}`).toBe("heading lines>1: true");
    await expect(`heading clipped: ${heading.scrollWidth > heading.clientWidth}`).toBe(
      "heading clipped: false",
    );

    // The CTA: neither. It takes the width it asks for — nothing clipped it —
    // and the pane is the thing that gives.
    await expect(`cta nowrap: ${getComputedStyle(cta).whiteSpace}`).toBe("cta nowrap: nowrap");
    await expect(`cta clipped: ${cta.scrollWidth > cta.clientWidth}`).toBe("cta clipped: false");
    await expect(`cta wider than pane: ${cta.getBoundingClientRect().width > panel.clientWidth}`).toBe(
      "cta wider than pane: true",
    );

    // …and because a `overflow-y: auto` box computes its other axis to `auto`
    // rather than `visible`, what the pane does about it is scroll sideways.
    await expect(`pane overflow-x: ${getComputedStyle(panel).overflowX}`).toBe("pane overflow-x: auto");
    await expect(`pane scrolls sideways: ${panel.scrollWidth > panel.clientWidth}`).toBe(
      "pane scrolls sideways: true",
    );
  },
};

/**
 * 375px, and the one story where the frame cannot be a wrapper: `DialogContent`
 * is `fixed` and portaled, so a `<div className="w-[375px]">` in the canvas
 * never constrains it. The width goes through the component's own `className`,
 * which is where it reaches the dialog surface — the same sanctioned
 * test-condition exception the wrapper normally carries, applied at the only
 * place that works here.
 *
 * The finding is the split. The entry list is `w-44 sm:w-56` and `shrink-0`,
 * and nothing anywhere in the component stacks the panes or narrows the list on
 * a small screen — so the list takes its fixed width out of 375px and the
 * detail pane, the half that does the explaining, gets what is left. Under the
 * gate's 1200×900 chromium the `sm:` variant applies, and the measurement is
 * 223px of list against 103px of pane; a real phone gets the `w-44` branch,
 * 48px narrower, which leaves the pane about 151. Neither is enough for hero
 * media, and 103px is narrower than the entry titles beside it. That gap
 * between what the gate renders and what a phone renders is mechanical fact 2
 * in the convention, and it is why the assertion below is written as a ratio
 * rather than as a pixel count.
 *
 * What does hold: nothing scrolls sideways. The pane is `min-w-0 flex-1`, the
 * row title truncates and the media is `w-full`, so the dialog squeezes rather
 * than overflowing.
 */
export const Mobile: Story = {
  args: {
    entries: ENTRIES,
    defaultOpen: true,
    className: "w-[375px] max-w-full sm:max-w-[375px]",
  },
  play: async () => {
    const dialog = await within(document.body).findByRole("dialog", { name: "What's new" });
    await expect(`dialog width: ${Math.round(dialog.getBoundingClientRect().width)}`).toBe(
      "dialog width: 375",
    );
    await expect(`overflows: ${dialog.scrollWidth > dialog.clientWidth}`).toBe("overflows: false");

    const list = dialog.querySelector<HTMLElement>('[data-slot="whats-new-list"]')!;
    const panel = dialog.querySelector<HTMLElement>('[data-slot="whats-new-detail"]:not([hidden])')!;

    // The fixed-width list takes more than twice what is left for the pane it
    // feeds. Written as a ratio rather than as pixels because the `sm:` branch
    // the gate renders and the `w-44` branch a phone renders differ by 48px.
    await expect(`list more than double the pane: ${list.clientWidth > panel.clientWidth * 2}`).toBe(
      "list more than double the pane: true",
    );

    // Nothing inside the pane overflows it either — the media and the copy
    // squeeze into whatever is left.
    await expect(`pane overflows: ${panel.scrollWidth > panel.clientWidth}`).toBe("pane overflows: false");
  },
};

/**
 * L4 beside L3 `feature-announcement`, its neighbour one rung down the same
 * ladder — the docs page calls this one L3's escalation target, so the two are
 * chosen between rather than used together.
 *
 * The rule is about how many things there are to say, and for how long:
 *
 * - **Feature announcement** carries one piece of news and expects to be
 *   dismissed. Its identity is an `id`, its lifecycle is "shown until
 *   dismissed, then never again", and it escalates by loudness — modal,
 *   anchored, inline card, chip.
 * - **What's new** carries the history and expects to be returned to. Every
 *   entry is dated, the list is permanent, and the trigger's unread badge is
 *   its entire interruption budget: it never appears in front of anything.
 *
 * So if you can name the one thing and it stops being news once read, it is L3.
 * If the answer is "several things, and someone who was away last month needs
 * all of them", it is L4. What is rendered here is the closed trigger rather
 * than the open dialog, because the trigger *is* the comparison: an
 * announcement takes space on the surface, a changelog takes a badge.
 *
 * Both are rendered unopened for the same reason — an open Base UI dialog marks
 * everything outside itself inert, so a side-by-side with the dialog open would
 * be a picture of one component and a hidden neighbour.
 */
export const Boundary: Story = {
  render: () => (
    <div className="flex w-full max-w-xl flex-col gap-6">
      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">
          Feature announcement — one piece of news, dismissed once read
        </p>
        <FeatureAnnouncement
          id="layer-groups"
          level="inline-card"
          stage="New"
          title="Layer groups"
          description="Nest layers into a group and move, hide, or export them as one."
          ctaLabel="Open the layers panel"
          onCtaClick={() => {}}
          onDismiss={() => {}}
        />
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">
          What&apos;s new — the dated history, returned to, and never in the way
        </p>
        <WhatsNew
          entries={[{ ...ENTRIES[0], unread: true }, { ...ENTRIES[1], unread: true }, ENTRIES[2]]}
          onEntryRead={() => {}}
        />
      </section>
    </div>
  ),
};
