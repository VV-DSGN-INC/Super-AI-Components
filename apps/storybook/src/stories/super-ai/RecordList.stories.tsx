import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";

import { RecordList, type RecordListItem } from "@/registry/super-ai/record-list";
import { TrackList } from "@/registry/super-ai/track-list";
import { RecordListDocs } from "@/content/components/record-list.docs";
import { componentDocsPage } from "@/lib/component-docs-page";
import { focusTreatmentSignature, settledFocusRing } from "@/lib/focus-ring";

const RECORDS: RecordListItem[] = [
  {
    id: "1",
    title: "Daily digest",
    apps: [{ name: "Gmail" }, { name: "Notion" }, { name: "Slack" }],
    lastRun: "Last run 4 min ago",
    meta: ["Marketing", "12 operations"],
    runState: "success",
    enabled: true,
    actions: [
      { id: "duplicate", label: "Duplicate" },
      { id: "history", label: "Run history" },
      { id: "delete", label: "Delete", destructive: true },
    ],
  },
  {
    id: "2",
    title: "Lead sync",
    apps: [{ name: "HubSpot" }, { name: "Google Sheets" }, { name: "Slack" }],
    lastRun: "Last run 2 h ago",
    meta: ["Sales"],
    runState: "failed",
    runLabel: "Last run failed — auth expired",
    enabled: true,
    actions: [
      { id: "duplicate", label: "Duplicate" },
      { id: "delete", label: "Delete", destructive: true },
    ],
  },
  {
    id: "3",
    title: "Invoice parser",
    apps: [
      { name: "Stripe" },
      { name: "Xero" },
      { name: "Dropbox" },
      { name: "Airtable" },
      { name: "Slack" },
    ],
    lastRun: "Running since 12:04",
    runState: "running",
    enabled: true,
    actions: [{ id: "stop", label: "Stop run", destructive: true }],
  },
  {
    id: "4",
    title: "Weekly recap",
    apps: [{ name: "Linear" }, { name: "Notion" }],
    draft: true,
    runState: "never",
    enabled: false,
    actions: [{ id: "duplicate", label: "Duplicate" }],
  },
];

const meta: Meta<typeof RecordList> = {
  title: "Super AI/Record List",
  component: RecordList,
  parameters: { layout: "centered", docs: { page: componentDocsPage(RecordListDocs) } },
  decorators: [
    (Story) => (
      <div className="w-[52rem] max-w-full">
        <Story />
      </div>
    ),
  ],
  args: {
    label: "Scenarios",
    records: RECORDS,
    onEnabledChange: () => {},
    onOpen: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof RecordList>;

/** What a record touches, read before its name. Marks are decorative; the app names are announced. */
export const AppIconCluster: Story = {
  args: { records: RECORDS, maxApps: 3 },
};

/** Folder, operation count and timing sit under the title — never in columns of their own. */
export const Metadata: Story = {
  args: { records: [RECORDS[0]] },
};

/** The primary control, in the row. Each switch is named after the record it enables. */
export const EnableToggle: Story = {
  args: { records: [RECORDS[0], RECORDS[3]] },
};

/** Icon shape and words together: OK, failed, running, never run. */
export const RunStatus: Story = {
  args: { records: RECORDS },
};

/** Everything that is not enabling. The row stays inert so the menu can live inside it. */
export const OverflowMenu: Story = {
  args: { records: [RECORDS[0]] },
};

/* -------------------------------------------------------------------------
 * Case stories — the situations this component meets in a product, as
 * opposed to the prop combinations above. See
 * docs/design-system/story-conventions.md for which of the eight apply.
 *
 * All eight are written. Nothing is skipped, and that is not thoroughness for
 * its own sake: this is a table of rows that each carry three controls and
 * four author-supplied text slots, so every one of the eight situations is a
 * situation it really meets. The two that would normally be arguable are not
 * here — `Controlled` because `enabled`/`onEnabledChange` is a real controlled
 * pair (the switch does not move on its own), and `ReducedMotion` because the
 * component animates in two places it owns, the `running` spinner and the
 * overflow popup, both of which were unbranched until this wave.
 * ---------------------------------------------------------------------- */

/**
 * Right-to-left. Three things mirror, one mirrors for a reason worth knowing,
 * and one is broken below this component.
 *
 * **The table mirrors for free.** Column order is the user agent's job, so the
 * record column lands at the right (measured 344–832 in an 832px table) and the
 * actions control at the left (8–59). Nothing in this component decides that,
 * which is why it is asserted rather than described: a future `dir`-blind
 * layout change here would be visible as a regression.
 *
 * **The app cluster mirrors because Tailwind v4 made it logical.**
 * `-space-x-1.5` reads as a physical utility and compiles to
 * `margin-inline-end: -6px` on every mark but the last, so under `dir="rtl"`
 * the first app sits furthest right and each later mark overlaps the one
 * before it from the left — the same fan, reflected. Measured: marks at
 * 312–336, 294–318, 276–300, `margin-inline-start` 0px and `margin-left` -6px,
 * which is `margin-inline-end` resolved for RTL. Worth measuring rather than
 * reading, because the class name says the opposite of what it does.
 *
 * **One class did need swapping**, in this wave: the title button carried
 * `text-left`, which under RTL aligns the record name to the edge it does not
 * belong to. Now `text-start` — byte-identical in LTR, the sanctioned swap from
 * `CONTINUE.md` §8 — and the play reads the resolved `text-align` back rather
 * than trusting the class.
 *
 * **The switch thumb does not mirror, and it is not this component's to fix.**
 * `components/ui/switch.tsx` moves the thumb with
 * `translate-x-[calc(100%-2px)]`, a physical axis, so a checked switch pushes
 * it right in both directions. Measured here on the first row, settled: the
 * track spans 133–165 and the thumb 162–178, so **13 of the thumb's 16px sit
 * outside the track they belong to**; in LTR the same pair reads track 655–687,
 * thumb 670–686, flush inside. That is E7 `member-gate-row`'s wave-2
 * measurement reproduced on a second component, and what J5 adds is
 * multiplication: `member-gate-row` renders one switch, a record list renders
 * one per row, so a ten-record list under RTL shows ten detached thumbs. The
 * numbers are recorded and not asserted, because the fix belongs to the
 * vendored file and an assertion on the broken geometry would have to be
 * deleted to make it.
 *
 * Also inherited rather than owned: `align="end"` on the overflow popup
 * resolves through Base UI's `useDirection()`, and no `DirectionProvider` is
 * mounted anywhere in this repo (wave 1, `CONTINUE.md` §8), so the popup side
 * never learns about RTL. The menu is left closed here — B8 `account-menu`
 * already records that root cause against the shared dropdown chrome.
 */
export const RTL: Story = {
  args: { records: RECORDS },
  render: (args) => (
    <div dir="rtl">
      <RecordList {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="record-list"]')!;
    await expect(getComputedStyle(root).direction).toBe("rtl");

    const row = root.querySelector<HTMLElement>('[data-record-id="1"]')!;
    const left = (el: Element) => el.getBoundingClientRect().left;
    const right = (el: Element) => el.getBoundingClientRect().right;

    // Columns reflect: the record is the rightmost cell, the actions the
    // leftmost. This is the reading order, not a coincidence of widths.
    const record = row.querySelector<HTMLElement>('[data-slot="record-list-record"]')!;
    const actions = row.querySelector<HTMLElement>('[data-slot="record-list-overflow"]')!;
    await expect(`record right of actions: ${left(record) > right(actions)}`).toBe(
      "record right of actions: true",
    );

    // The cluster fans the other way, and the negative margin that does it is
    // logical despite its name.
    const marks = Array.from(row.querySelectorAll<HTMLElement>('[data-slot="record-list-app"]'));
    await expect(marks).toHaveLength(3);
    const secondStyle = getComputedStyle(marks[1]);
    await expect(
      `inline-end ${secondStyle.marginInlineEnd} / inline-start ${secondStyle.marginInlineStart}`,
    ).toBe("inline-end -6px / inline-start 0px");
    await expect(`first mark rightmost: ${right(marks[0]) > right(marks[1])}`).toBe(
      "first mark rightmost: true",
    );
    // …and they still overlap, rather than merely reversing into a gap.
    await expect(`marks overlap: ${right(marks[1]) > left(marks[0])}`).toBe("marks overlap: true");

    // The swap, proved by the resolved value rather than the class list.
    const title = row.querySelector<HTMLElement>('[data-slot="record-list-title"]')!;
    await expect(getComputedStyle(title).textAlign).toBe("start");
  },
};

/**
 * The reduced-motion branch, in the two places this component owns motion.
 * Both were unbranched before this wave and both were fixed in it.
 *
 * **The `running` spinner.** `RUN_STATE_ICON.running` is a `Loader2` with
 * `animate-spin`, which does not read the media feature on its own, so a
 * record list of live scenarios span continuously for a reader who has asked
 * for stillness. `motion-reduce:animate-none` beside it is the registry's
 * one-class branch; the assertion reads `animation-name` back under the
 * emulated reduce `vitest.config.ts` forces, rather than checking the class.
 * The state survives the suppression because the icon was never the only
 * signal: RUN_STATE_TEXT puts the words beside it, which is asserted here too —
 * that is what stops `running` collapsing into `never run` when the spin stops.
 *
 * **The overflow popup.** `DropdownMenuContent` opens with
 * `data-open:animate-in fade-in-0 zoom-in-95` and closes with
 * `data-closed:animate-out`. A bare `motion-reduce:animate-none` is inert
 * against a Base UI popup: Tailwind v4 wraps the data-attribute test in
 * `:where(…)`, so both sides compile to one class of specificity and source
 * order hands the win to `animation: enter`. The variant has to be restated on
 * both halves at this call site. F4 `action-stack` stated the rule the whole
 * program had been circling — the animation classes live in the primitive, the
 * suppression has to be restated per consumer, **so fixing one consumer fixes
 * none of the others** — and record-list was one of the last three
 * `DropdownMenuContent` call sites still missing the pair.
 *
 * **What is still unbranched, and cannot be fixed from here.** The vendored
 * `Switch` slides its thumb with `transition-transform` and moves it with
 * `translate-x-[calc(100%-2px)]`. Measured under emulated reduce, the thumb's
 * `transition-property` reads `transform, translate, scale, rotate` at `0.15s`,
 * so it really does slide, once per row. A `className` on `<Switch>` reaches
 * the root's `transition-all` and never the thumb, whose class list is
 * hard-coded in `components/ui/switch.tsx`. E7 `member-gate-row` recorded the
 * same thing in wave 2 and declined to reach it with an arbitrary-variant
 * descendant selector that no other component in the registry uses; this file
 * declines for the same reason. It is a primitive-wide posture, like the
 * vendored `Button`'s press nudge, not a gap in J5.
 */
export const ReducedMotion: Story = {
  args: { records: RECORDS },
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="record-list"]')!;

    // The spinner: branched, and the words that make the branch safe.
    const running = root.querySelector<HTMLElement>(
      '[data-record-id="3"] [data-slot="record-list-run-status"]',
    )!;
    const spinner = running.querySelector<HTMLElement>("svg")!;
    await expect(getComputedStyle(spinner).animationName).toBe("none");
    await expect(running).toHaveTextContent("Running");
    // Every other state still says what it is, so a still icon is never the
    // only thing separating two rows.
    await expect(
      root.querySelector('[data-record-id="4"] [data-slot="record-list-run-status"]'),
    ).toHaveTextContent("Never run");

    // The popup: read back on the frame the bare class fails to reach, with
    // `data-open` still on the element the animation is keyed off.
    await userEvent.click(
      root.querySelector<HTMLElement>('[data-record-id="1"] [data-slot="record-list-overflow"] button')!,
    );
    const menu = await within(document.body).findByRole("menu");
    await expect(menu).toHaveAttribute("data-open");
    await expect(getComputedStyle(menu).animationName).toBe("none");
  },
};

/**
 * The per-row control contract, walked once — the thing this component is
 * cited for elsewhere in the repo and the thing that has been found broken
 * four times in components that are not.
 *
 * **Three stops per row, in DOM order: title, switch, overflow trigger.** The
 * `<tr>` contributes none of its own, which is the file header's whole
 * argument: a row that was itself a button would nest two controls inside a
 * control. The walk asserts the order rather than the count, because the count
 * is what a regression would keep.
 *
 * **Every one of those controls carries a distinct accessible name**, derived
 * from the record: `Daily digest`, `Enable Daily digest`, `More actions for
 * Daily digest`. That is asserted by looking each one up by name, so a
 * collapse throws instead of passing quietly. `CONTINUE.md` §8's repeated-name
 * table names this component and `slot-summary` as the two that already solve
 * what the rest of that table still has — `thread-list`'s identical "Thread
 * actions" per row, `reset-affordance`'s bare "Reset", `filter-bar`'s generic
 * "Remove filter", `stat-readout`'s "Copy" — so this is the assertion that
 * keeps a worked example working.
 *
 * **A visible focus treatment at every stop, proved as a difference.**
 * `settledFocusRing` waits for the ring rather than reading it on the frame
 * focus lands, because the vendored `Button` fades it in through
 * `transition-all`. But an absolute check answers "does this element paint a
 * treatment", never "did focus cause it" (H6 `waveform-editor`, wave 4), so
 * the resting signature of all three controls is taken *before* the walk
 * begins — measured `box-shadow: none` on each — and each stop is then asserted
 * to differ from its own baseline. Taking the baseline first is what makes the
 * differential available inside a tab walk, where blurring to sample it would
 * disturb the sequence under test.
 *
 * **A disabled toggle is a missing stop, not a skipped one.** `toggleDisabled`
 * puts Base UI's `tabindex="-1"` on the switch, so the second row here offers
 * one stop where the first offers three, and the row's *primary* control — the
 * one the spec says must be one keystroke from the list — is the one a keyboard
 * user cannot reach. The component's docs already call that deliberate; it is
 * asserted so the cost stays visible rather than implied.
 *
 * Finally, Escape from an open menu returns focus to the trigger that opened
 * it. That is Base UI's behaviour rather than this component's, and it is
 * asserted because the alternative — the row unmounting under the cursor — is
 * exactly what the docs' focus notes say happens when a Delete action fires.
 */
export const KeyboardOrder: Story = {
  args: {
    records: [RECORDS[0], { ...RECORDS[3], toggleDisabled: true, actions: undefined }],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="record-list"]')!;

    // Distinct names, computed the way a screen reader would: a duplicate makes
    // `getByRole` throw rather than silently pass.
    const title = canvas.getByRole("button", { name: "Daily digest" });
    const toggle = canvas.getByRole("switch", { name: "Enable Daily digest" });
    const trigger = canvas.getByRole("button", { name: "More actions for Daily digest" });
    const draftToggle = canvas.getByRole("switch", { name: "Enable Weekly recap" });
    await expect(new Set([title, toggle, trigger, draftToggle]).size).toBe(4);

    // The disabled toggle is out of the tab order entirely, so the second row
    // contributes its title and nothing else.
    await expect(draftToggle).toHaveAttribute("tabindex", "-1");
    const expected = [title, toggle, trigger, canvas.getByRole("button", { name: "Weekly recap" })];

    // Resting signatures, before anything is focused. `box-shadow: none` on all
    // three — which is what makes the post-focus read a difference rather than
    // an absolute.
    const resting = new Map(expected.map((el) => [el, focusTreatmentSignature(el)]));

    const nameOf = (el: Element | null) =>
      el === null ? "nothing" : `${el.tagName.toLowerCase()}[${el.getAttribute("data-slot") ?? "trigger"}]`;

    await userEvent.tab();
    for (const stop of expected) {
      await expect(nameOf(document.activeElement)).toBe(nameOf(stop));
      await expect(stop.matches(":focus-visible")).toBe(true);
      await settledFocusRing(stop, waitFor);
      // …and the treatment is one focus caused, not one the element always paints.
      await waitFor(() => expect(focusTreatmentSignature(stop)).not.toBe(resting.get(stop)));
      await userEvent.tab();
    }

    // Nothing traps: the stop after the last row is outside the list.
    await expect(canvasElement.contains(document.activeElement)).toBe(false);

    // Focus return on dismiss.
    await userEvent.click(trigger);
    const body = within(document.body);
    await body.findByRole("menu");
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("menu")).toBeNull());
    await waitFor(() => expect(document.activeElement).toBe(trigger));
  },
};

/**
 * A host that holds `enabled` and refuses one of the two changes it is asked
 * for. This is the component's primary control under external state, and the
 * refusal is the point: an automation list is the surface where "turn this
 * off" can legitimately fail — a run in flight, a permission the caller does
 * not have, a server that says no.
 *
 * The pair is real. `checked={record.enabled ?? false}` is passed straight to
 * the vendored `Switch` with no internal copy, so the switch has no
 * uncontrolled mode at all: interaction reports an intent and moves nothing.
 * Measured — clicking a switch whose `enabled` the host holds fixed leaves
 * `aria-checked` where it was, and the render counter proves the host really
 * re-rendered rather than React skipping the work.
 *
 * The payload is the other half. `onEnabledChange(id, enabled)` carries both
 * the record and the state being asked for, which is what a host needs to
 * apply it — asserted with the exact arguments, because an `onChange` that
 * omits the row identity is the shape that forces every consumer to close over
 * one handler per row.
 *
 * **What a host cannot reach**, and it belongs in the same story: the overflow
 * menu owns its open state internally with no `open`/`onOpenChange` pair, so a
 * host that removes a record while its menu is open cannot close the menu
 * first. Same limit I4 `ai-tools-menu` records on the same primitive.
 */
function EnabledHost({ onEnabledChange }: { onEnabledChange: (id: string, enabled: boolean) => void }) {
  const [enabled, setEnabled] = React.useState<Record<string, boolean>>({ "1": true, "2": true });
  const [renders, setRenders] = React.useState(1);
  return (
    <div className="w-[52rem] max-w-full" data-renders={renders}>
      <RecordList
        label="Scenarios"
        records={[RECORDS[0], RECORDS[1]].map((record) => ({
          ...record,
          enabled: enabled[record.id],
        }))}
        onEnabledChange={(id, next) => {
          onEnabledChange(id, next);
          setRenders((n) => n + 1);
          // Record 2's last run failed on an expired token, so the host holds
          // it off until the connection is repaired. Record 1 it applies.
          if (id !== "2") setEnabled((prev) => ({ ...prev, [id]: next }));
        }}
      />
    </div>
  );
}

export const Controlled: StoryObj<typeof EnabledHost> = {
  args: { onEnabledChange: fn() },
  render: (args) => <EnabledHost {...args} />,
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const host = canvasElement.querySelector<HTMLElement>("[data-renders]")!;
    const applied = canvas.getByRole("switch", { name: "Enable Daily digest" });
    const refused = canvas.getByRole("switch", { name: "Enable Lead sync" });
    await expect(applied).toHaveAttribute("aria-checked", "true");
    await expect(refused).toHaveAttribute("aria-checked", "true");

    // Applied: the host writes the value back and the switch follows it.
    await userEvent.click(applied);
    await expect(args.onEnabledChange).toHaveBeenCalledWith("1", false);
    await waitFor(() => expect(applied).toHaveAttribute("aria-checked", "false"));

    // Refused: the callback fires with the record and the state asked for, the
    // host re-renders, and the switch does not move.
    await userEvent.click(refused);
    await expect(args.onEnabledChange).toHaveBeenCalledWith("2", false);
    await waitFor(() => expect(host).toHaveAttribute("data-renders", "3"));
    await expect(refused).toHaveAttribute("aria-checked", "true");
  },
};

/**
 * Everything optional left out, on a list a host has just started populating.
 * Five slots go quiet, and only one of them looks like a gap on screen.
 *
 * - **`label=""` deletes the table's name.** The prop defaults to "Records", so
 *   an empty string is not the default path — it renders an empty `<caption>`,
 *   and the table announces as an unnamed table. The docs module says the
 *   caption is where `label` lands; this is what passing nothing through it
 *   costs.
 * - **`title=""` collapses two accessible names at once.** Both are derived
 *   from the title, so the switch announces as "Enable" and the cluster as
 *   "Apps in" — a generic verb and a preposition. Two untitled records give two
 *   identically named switches, which is the same empty-string name collapse
 *   the case-story program has already found in D3 `context-chips`, I2
 *   `property-inspector`, H4 `transcript-editor` and H7 `stem-mixer`. It does
 *   not fail the a11y gate: the trailing space is trimmed away, so the name is
 *   short and useless rather than absent, and axe only tests for absent.
 * - **An untitled record also renders an empty title element.** With no `href`
 *   and no `onOpen` it is a `<span>` with no text, so nothing on the row says
 *   which record it is — the switch is still operable and still anonymous.
 * - **`apps: []` is the one omission handled deliberately**, and it is the
 *   contrast worth having in the same story: an em-dash for sighted readers and
 *   an sr-only "No apps" behind it, rather than an empty cell that could equally
 *   mean "not loaded yet".
 * - **No `runState`, `lastRun`, `draft` or `meta` removes the subtitle
 *   element entirely** rather than leaving an empty line, so rows without state
 *   are shorter rather than ragged. And no `actions` renders no trigger at all,
 *   which the docs already flag as easy to mistake for a forgotten prop.
 */
export const EmptyLabel: Story = {
  args: {
    label: "",
    onOpen: undefined,
    records: [
      { id: "e1", title: "", apps: [{ name: "Gmail" }], enabled: false },
      { id: "e2", title: "Untitled scenario", apps: [], enabled: false },
    ],
  },
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="record-list"]')!;

    // The caption is present and empty: the name was not defaulted, it was lost.
    const caption = root.querySelector<HTMLElement>("caption")!;
    await expect(caption.textContent).toBe("");

    // Both names collapse to the fixed half of the template.
    const untitled = within(canvasElement).getByRole("switch", { name: "Enable" });
    await expect(untitled).toBeInTheDocument();
    await expect(root.querySelector('[data-slot="record-list-apps"]')).toHaveAttribute(
      "aria-label",
      "Apps in ",
    );

    // …and nothing else on that row names it either.
    const titles = Array.from(root.querySelectorAll<HTMLElement>('[data-slot="record-list-title"]'));
    await expect(`${titles[0].tagName} ${JSON.stringify(titles[0].textContent)}`).toBe('SPAN ""');

    // The one omission that is handled on purpose.
    const empty = root.querySelector<HTMLElement>('[data-slot="record-list-apps-empty"]')!;
    await expect(empty).toHaveTextContent("No apps");

    // No state, no subtitle element; no actions, no trigger.
    await expect(root.querySelector('[data-slot="record-list-subtitle"]')).toBeNull();
    await expect(root.querySelectorAll('[data-slot="record-list-overflow"] button')).toHaveLength(0);
  },
};

/**
 * A ~90 character title with a matching failure string and a two-part folder
 * path underneath — what a record list looks like once the records are named
 * by the people who built them rather than by a fixture.
 *
 * **The title clips and the subtitle wraps**, which is the decision this
 * component actually makes and it is a split one. `truncate` on the title keeps
 * every row the same shape so a list of forty scans as a list; the subtitle is
 * `flex-wrap`, so a long `runLabel` plus two meta fragments take a second line
 * and the row grows. Measured at 832px: the title needs 588px in a 507px box
 * and clips; the subtitle occupies two lines at its full 507px with nothing
 * cut. The table itself does not widen — the whole overflow is absorbed inside
 * the cell.
 *
 * **The clipped title has no way back.** There is no `title` attribute, no
 * tooltip and no second line, so two records whose names differ only after the
 * ellipsis are two rows a user cannot tell apart, and the accessible name of
 * the row's own control keeps the full string while the visible text does not.
 * Wave 1 recorded the same shape on D3 `context-chips`' truncated label.
 * Described rather than asserted: the fix is a prop or a tooltip decision, not
 * a class.
 *
 * **`max-w-xs` on the record cell does nothing.** It reads as the guard that
 * bounds the title at 320px; measured, the cell is 523px wide, because
 * `table-layout: auto` resolves cell widths from the table algorithm and
 * ignores `max-width`. So the truncation point is whatever the table hands the
 * column, and it moves with the other three columns' content — which is why
 * the assertion below is about *that* the title clips and the table does not
 * grow, and not about where the ellipsis lands.
 */
export const LongContent: Story = {
  args: {
    records: [
      {
        ...RECORDS[0],
        title: "Sync every closed-won opportunity into the quarterly revenue sheet and notify the owner",
        runState: "failed",
        runLabel: "Last run failed — the Google Sheets token expired 3 days ago, reconnect required",
        meta: ["Revenue operations / Quarterly reporting / EMEA", "148 operations"],
      },
    ],
  },
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="record-list"]')!;
    const container = root.querySelector<HTMLElement>('[data-slot="table-container"]')!;
    const title = root.querySelector<HTMLElement>('[data-slot="record-list-title"]')!;
    const subtitle = root.querySelector<HTMLElement>('[data-slot="record-list-subtitle"]')!;

    // One clipped line, by ellipsis rather than by overflow.
    await expect(`title clipped=${title.scrollWidth > title.clientWidth}`).toBe("title clipped=true");
    await expect(getComputedStyle(title).whiteSpace).toBe("nowrap");
    await expect(getComputedStyle(title).textOverflow).toBe("ellipsis");

    // The subtitle takes the other decision: it wraps, and keeps every word.
    const lines = Math.round(subtitle.scrollHeight / parseFloat(getComputedStyle(subtitle).lineHeight));
    await expect(`subtitle lines=${lines} clipped=${subtitle.scrollWidth > subtitle.clientWidth}`).toBe(
      "subtitle lines=2 clipped=false",
    );

    // And the table absorbs all of it rather than widening under the cell.
    await expect(`table overflows=${container.scrollWidth > container.clientWidth}`).toBe(
      "table overflows=false",
    );
  },
};

/**
 * 375px, where the four columns stop fitting and the component's answer is
 * somebody else's scroll container.
 *
 * Measured inside a 375px frame: the frame itself does not scroll sideways
 * (375/375), and the vendored `Table`'s own `overflow-x-auto` div takes the
 * whole 52px of overflow (427/375). Column edges land at 0–202 (record),
 * 202–314 (apps), 314–383 (enabled) and 383–427 (actions), so **the enable
 * toggle is still on screen at 322–354 and the overflow trigger, at 391–419, is
 * entirely past the edge.** That split is the interesting part: the spec's
 * first rule is that the enable toggle sits in the row, one keystroke from the
 * list, and at phone width that rule holds by 21px while everything filed
 * behind the menu — duplicate, run history, delete — needs a sideways scroll
 * nobody signals.
 *
 * The frame is measured through a `data-testid` rather than
 * `canvasElement.firstElementChild`, which is the meta's `layout: "centered"`
 * wrapper at ~1200px and would pass this assertion for the wrong reason (wave
 * 2, E7).
 *
 * **The scroll container is a live gap, and this is its third appearance.**
 * `components/ui/table.tsx` wraps every table in a bare
 * `<div class="relative w-full overflow-x-auto">`: no `tabIndex`, no role, no
 * name. It passes axe's `scrollable-region-focusable` here only because the row
 * controls inside it are focusable — asserted below, because that is the load
 * the guarantee is resting on. F6 `render-queue` measured the same container
 * failing outright at this width with a read-only queue, after L5
 * `shortcuts-sheet` and P1 `data-views`' kanban board.
 *
 * What J5 adds is that **all three of its focusables are optional through the
 * public API, one of them per row.** A record with no `href` and no `onOpen`
 * has a `<span>` for a title; `toggleDisabled` puts `tabindex="-1"` on the
 * switch (measured in `KeyboardOrder`); a record with no `actions` renders no
 * trigger. A list of read-only, paused records is therefore a scroll container
 * with nothing focusable inside it, reached entirely through documented props.
 * Recorded rather than rendered: the story that shows it is a red gate, and the
 * repair is the wave-0 idiom in a vendored file — a `<section>`, `tabIndex={0}`,
 * a name and a focus ring.
 */
export const Mobile: Story = {
  args: { records: RECORDS },
  render: (args) => (
    <div data-testid="record-list-frame" className="w-[375px] max-w-full">
      <RecordList {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const frame = canvasElement.querySelector<HTMLElement>('[data-testid="record-list-frame"]')!;
    const root = frame.querySelector<HTMLElement>('[data-slot="record-list"]')!;
    const container = root.querySelector<HTMLElement>('[data-slot="table-container"]')!;

    // The column does not scroll; the table inside it does.
    await expect(`frame overflows=${frame.scrollWidth > frame.clientWidth}`).toBe("frame overflows=false");
    await expect(`table overflows=${container.scrollWidth > container.clientWidth}`).toBe(
      "table overflows=true",
    );

    // The primary control clears the visible edge. This is the spec's first
    // rule at the width it is most at risk.
    const edge = container.getBoundingClientRect().right;
    const toggle = root.querySelector<HTMLElement>('[data-record-id="1"] [data-slot="record-list-toggle"]')!;
    await expect(`toggle on screen=${toggle.getBoundingClientRect().right <= edge}`).toBe(
      "toggle on screen=true",
    );

    // And the only reason the scroll container passes `scrollable-region-focusable`
    // is what these rows happen to contain.
    const tabbable = Array.from(
      container.querySelectorAll<HTMLElement>("button, a[href], [tabindex]"),
    ).filter((el) => el.getAttribute("tabindex") !== "-1");
    await expect(`tabbable inside scroll container=${tabbable.length > 0}`).toBe(
      "tabbable inside scroll container=true",
    );
  },
};

/**
 * J5 beside J7 `track-list`, its only real near-twin: same family, same
 * `Table`, same shape of row. The rule cannot be about appearance, so it is
 * about **what the columns are for**.
 *
 * - **Record list** is a list of things that *run*. The question a reader
 *   brings is "which of these is on, and did the last one work", so the enable
 *   toggle is the primary control and sits in the row, and last-run and draft
 *   live in the subtitle because "Last run failed" and "4 min ago" are one
 *   sentence about one event. The columns are not comparable: nobody sorts
 *   scenarios by app cluster.
 * - **Track list** is a list of things you *compare*. BPM and key are columns
 *   precisely because they are the facets people sort and filter by, and the
 *   inline waveform is there so auditioning three takes does not cost three
 *   round trips. Nothing in it is on or off.
 *
 * The test: if the row has a state a reader wants to change from the list, it
 * is J5. If the row has numbers a reader wants to line up against the row
 * below, it is J7.
 *
 * Two neighbours are described rather than rendered, because the boundary with
 * each is settled by looking. **J1 `asset-library`** is the same catalog of
 * things but grid-shaped and generically-typed — it carries neither a run state
 * nor comparable numerals, which is the D12 error J7 reverses. **B6
 * `thread-list`** is a sidebar of conversations you *navigate*: its rows are
 * the primary control, where a record-list row is deliberately inert so a
 * switch and a menu can live inside it.
 */
export const Boundary: Story = {
  render: () => (
    <div className="flex w-full flex-col gap-8">
      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">
          Record list — things that run, with the on/off switch in the row
        </p>
        <RecordList
          label="Scenarios"
          records={[RECORDS[0], RECORDS[1]]}
          onEnabledChange={() => {}}
          onOpen={() => {}}
        />
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">
          Track list — things you compare, with the numbers as columns
        </p>
        <TrackList
          label="Renders"
          tracks={[
            {
              id: "t1",
              title: "Ambient pad, take 3",
              artist: "Stable Audio 2.0",
              tags: ["pad", "loopable"],
              peaks: [0.2, 0.5, 0.8, 0.6, 0.9, 0.4, 0.7, 0.3],
              bpm: 92,
              musicalKey: "F minor",
            },
            {
              id: "t2",
              title: "Voiceover, line 12",
              artist: "ElevenLabs v2",
              peaks: [0.6, 0.3, 0.7, 0.5, 0.4, 0.8, 0.2, 0.5],
            },
          ]}
          onPlayToggle={() => {}}
          onSelect={() => {}}
        />
      </section>
    </div>
  ),
};
