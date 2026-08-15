import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";

import { RecordList } from "@/registry/super-ai/record-list";
import { SidebarNav } from "@/registry/super-ai/sidebar-nav";
import { ThreadList, ThreadListItem, ThreadListSection } from "@/registry/super-ai/thread-list";
import { ThreadListDocs } from "@/content/components/thread-list.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const meta: Meta<typeof ThreadList> = {
  title: "Super AI/Thread List",
  component: ThreadList,
  parameters: { layout: "centered", docs: { page: componentDocsPage(ThreadListDocs) } },
};

export default meta;
type Story = StoryObj<typeof ThreadList>;

/**
 * Titles this system really emits: a chat product names a thread from its
 * first message, so they read like the thing that was asked for.
 */
const TODAY = [
  { id: "t1", title: "Brand video script" },
  { id: "t2", title: "Logo explorations" },
  { id: "t3", title: "Sound effects brief" },
];

/** The width and chrome the shipped demo uses — a sidebar column, not a new design value. */
function Column({ children, ...props }: React.ComponentProps<"div">) {
  return (
    <div className="w-64 rounded-lg border p-2" {...props}>
      {children}
    </div>
  );
}

/**
 * A row's actions trigger, found structurally rather than by name. Every row's
 * trigger has the same accessible name (see `KeyboardOrder`), so a name lookup
 * would be ambiguous today *and* would break the moment that is fixed.
 */
function actionsTrigger(row: HTMLElement) {
  return within(row).getAllByRole("button")[1];
}

function rowsOf(canvasElement: HTMLElement) {
  return Array.from(canvasElement.querySelectorAll<HTMLElement>('[data-slot="thread-list-item"]'));
}

/* -------------------------------------------------------------------------
 * Declared states
 * ---------------------------------------------------------------------- */

/**
 * The thread that is open. `active` is a prop on the row, never internal
 * state — the row paints `bg-accent`, bolds its title and sets
 * `aria-current="page"`, and it does none of that on its own click. See
 * `Controlled` for what that costs a consumer.
 */
export const Active: Story = {
  render: () => (
    <Column>
      <ThreadList aria-label="Conversations">
        <ThreadListSection label="Today">
          {TODAY.map((t) => (
            <ThreadListItem key={t.id} id={t.id} title={t.title} active={t.id === "t1"} />
          ))}
        </ThreadListSection>
      </ThreadList>
    </Column>
  ),
};

/**
 * A thread with activity since you last opened it. The dot is not decoration:
 * it carries `aria-label="Unread"` inside the row button, so the row announces
 * as "Unread Brand video script" rather than relying on an 8px circle nobody
 * hears. Unread and active are independent — the open thread can still be
 * unread while a background run writes into it.
 */
export const Unread: Story = {
  render: () => (
    <Column>
      <ThreadList aria-label="Conversations">
        <ThreadListSection label="Today">
          <ThreadListItem id="t1" title="Brand video script" unread />
          <ThreadListItem id="t2" title="Logo explorations" />
          <ThreadListItem id="t3" title="Sound effects brief" />
        </ThreadListSection>
      </ThreadList>
    </Column>
  ),
};

/**
 * Pinned threads, in the shape the spec insists on: a section of their own
 * above the date buckets, not "Today" items wearing a badge. The pin icon in
 * the row is the reminder, the position is the promise — and only leaving the
 * date grouping keeps the promise, because the buckets re-bucket overnight.
 */
export const Pinned: Story = {
  render: () => (
    <Column>
      <ThreadList aria-label="Conversations">
        <ThreadListSection label="Pinned">
          <ThreadListItem id="p1" title="Brand video script" pinned />
        </ThreadListSection>
        <ThreadListSection label="Today">
          <ThreadListItem id="t2" title="Logo explorations" />
          <ThreadListItem id="t3" title="Sound effects brief" />
        </ThreadListSection>
        <ThreadListSection label="Yesterday">
          <ThreadListItem id="t4" title="Storyboard the 30-second cut" />
        </ThreadListSection>
      </ThreadList>
    </Column>
  ),
};

/**
 * Renaming in place. There is no prop for this state — `renaming` is internal
 * and the only way in is the way a person takes it, so the play function opens
 * the row's actions menu and picks Rename.
 *
 * Two facts are pinned here, and both were expensive to get right in the
 * component. The input receives focus, which is not free: Base UI restores
 * focus to the menu trigger as the menu closes, and a naively-mounted input
 * would take a `blur` before it ever took a keystroke — the component defers
 * the swap to `onOpenChangeComplete` to avoid exactly that. And the input
 * opens seeded with the current title rather than empty, so Enter with no
 * typing is a no-op instead of a wipe.
 *
 * Defect recorded, not asserted: committing with Enter unmounts the input and
 * moves focus nowhere, so it lands on `document.body` and a keyboard user
 * loses their place in the list. Asserting that would make it permanent. It is
 * in the docs module's pitfalls and in this component's report.
 */
export const InlineRename: Story = {
  render: () => (
    <Column>
      <ThreadList aria-label="Conversations">
        <ThreadListSection label="Today">
          {TODAY.map((t) => (
            <ThreadListItem key={t.id} id={t.id} title={t.title} />
          ))}
        </ThreadListSection>
      </ThreadList>
    </Column>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);

    await userEvent.click(actionsTrigger(rowsOf(canvasElement)[1]));
    await userEvent.click(await body.findByRole("menuitem", { name: "Rename" }));

    const input = await canvas.findByRole("textbox", { name: "Thread title" });
    await expect(input).toHaveFocus();
    await expect(input).toHaveValue("Logo explorations");

    // The row is replaced wholesale, not decorated: the swap is addressable.
    await expect(rowsOf(canvasElement)[1]).toHaveAttribute("data-renaming");
  },
};

/**
 * Deleting asks first, and the question names the thread. A thread is usually
 * the only copy of what is in it, so the confirmation quotes the full title —
 * untruncated, wrapping if it must — which makes the dialog the one place in
 * this component where a long title is legible at all.
 *
 * Focus return is correct here and is asserted in `KeyboardOrder`: the dialog
 * is rendered `open`-controlled with no `AlertDialogTrigger`, so there is no
 * trigger element for Base UI to return to — it restores the
 * previously-focused node instead, which is the row's own actions button.
 * Worth knowing, because it is the opposite of what `InlineRename` does with
 * the same kind of dismissal.
 */
export const DeleteConfirm: Story = {
  render: () => (
    <Column>
      <ThreadList aria-label="Conversations">
        <ThreadListSection label="Today">
          <ThreadListItem id="t1" title="Storyboard the 30-second cut" />
          <ThreadListItem id="t2" title="Logo explorations" />
        </ThreadListSection>
      </ThreadList>
    </Column>
  ),
  play: async ({ canvasElement }) => {
    const body = within(document.body);

    await userEvent.click(actionsTrigger(rowsOf(canvasElement)[0]));
    await userEvent.click(await body.findByRole("menuitem", { name: "Delete" }));

    const dialog = await body.findByRole("alertdialog");
    await expect(dialog).toHaveTextContent("Delete this conversation?");
    // The title, in full, in the only place it is not truncated.
    await expect(dialog).toHaveTextContent("Storyboard the 30-second cut");
    await expect(within(dialog).getByRole("button", { name: "Delete" })).toBeInTheDocument();
    await expect(within(dialog).getByRole("button", { name: "Cancel" })).toBeInTheDocument();
  },
};

/**
 * A sidebar with no threads in it — first run, or a filter that matched
 * nothing. What renders is an empty `<nav>` and nothing else: this component
 * ships no empty affordance of its own, deliberately, because the right thing
 * to say depends on why the list is empty. Compose `empty-state` above it (or
 * in place of it) rather than expecting a row to appear.
 *
 * The `aria-label` still matters here. An unlabelled empty landmark is worse
 * than an unlabelled full one — there is no content to guess from.
 */
export const Empty: Story = {
  render: () => (
    <Column>
      <ThreadList aria-label="Conversations" />
    </Column>
  ),
};

/* -------------------------------------------------------------------------
 * Case stories — the situations this component meets in a product, as opposed
 * to the prop combinations above. See docs/design-system/story-conventions.md.
 *
 * Not written for this component, deliberately:
 *
 * // case-skip: ReducedMotion — nothing this component owns animates
 * `thread-list.tsx` contains no `animate-*`, no `transition-*` and no
 * keyframe. The dropdown and the confirmation do animate, but that motion
 * belongs to the vendored `components/ui` popups (`data-open:animate-in`,
 * `data-closed:animate-out`) and is shared by every consumer of them; this
 * component neither adds it nor branches on the media feature. A story here
 * would render identically to `InlineRename` and imply coverage of a branch
 * that does not exist. The vendored popups' own missing `motion-reduce:` is
 * upstream of this component and is the drift CONTINUE.md §8 already tracks.
 *
 * // case-skip: EmptyLabel — `title` is required and is the row's only name
 * `ThreadListItemProps.title` is `string`, not `string | undefined`, and
 * `ThreadListSection` requires `label` the same way. There is no optional text
 * slot to empty. Passing `title=""` is reachable but is a caller error: it
 * ships a button with no accessible name straight into an axe gate running at
 * `test: "error"`. That belongs in the docs page's donts — where the
 * every-row-named-the-same example puts it — not in a story.
 * ---------------------------------------------------------------------- */

/**
 * Right-to-left. Direction is load-bearing in four places on one row: the
 * unread dot and pin lead, so they must sit at the right edge; the title
 * truncates, so the ellipsis must appear on the left; the actions trigger is
 * the trailing slot, so it must land at the logical end; and the menu is
 * anchored `align="start"`, which has to resolve to the right edge rather
 * than a hard-coded left.
 *
 * Nothing in the component reads `dir`: `flex` order, `truncate` and the
 * popup's logical `align` carry all four between them. That is exactly why
 * the story exists — a refactor to a physical `left`/`right` offset, or to a
 * hard-coded menu side, would look correct in this repo's default direction
 * and break only here.
 */
export const RTL: Story = {
  render: () => (
    <div dir="rtl">
      <Column>
        <ThreadList aria-label="Conversations">
          <ThreadListSection label="Pinned">
            <ThreadListItem id="p1" title="Brand video script" pinned />
          </ThreadListSection>
          <ThreadListSection label="Today">
            <ThreadListItem id="t2" title="Logo explorations" unread />
            <ThreadListItem id="t3" title="Storyboard the 30-second cut, with the alternate ending" />
          </ThreadListSection>
        </ThreadList>
      </Column>
    </div>
  ),
};

/**
 * The per-row control contract, walked once. Two stops per row and they are
 * not equivalent: the first is the row itself, whose accessible name is the
 * thread title, and the second is the actions trigger that holds rename, pin
 * and delete.
 *
 * The walk is followed by the other half of this story's remit — where focus
 * goes on dismiss. Cancelling the delete confirmation returns focus to the
 * row's actions button, which is right, and is worth pinning because the
 * dialog has no trigger element for Base UI to return to: it restores the
 * previously-focused node. Committing a rename does *not* do the equivalent
 * (see `InlineRename`), so this is the one dismissal path that can be
 * asserted rather than recorded.
 *
 * The non-obvious assertion is the opacity one. The trigger is `opacity-0`
 * until the row is hovered — it is a hover affordance by design — and only
 * `focus-visible:opacity-100` keeps it from being an invisible tab stop. That
 * class is one edit away from being lost in any restyle, and nothing else in
 * the pipeline can see it, so it is pinned here rather than described.
 *
 * **Defect recorded, not asserted:** every row's trigger is named "Thread
 * actions" and nothing more, so in a sidebar of ten threads a screen-reader
 * user meets ten identical buttons and only reading order ties one to its
 * thread. The near-twin `record-list` already solves this in the same
 * catalog — it names its overflow trigger `More actions for ${record.title}`
 * — so this is drift rather than an open question. It is *not* pinned below:
 * an assertion that three triggers share one name would have to be deleted to
 * fix the bug. What is asserted instead is the half that is right and must
 * stay right: the three row buttons carry three distinct names.
 */
export const KeyboardOrder: Story = {
  render: () => (
    <Column>
      <ThreadList aria-label="Conversations">
        <ThreadListSection label="Today">
          {TODAY.map((t) => (
            <ThreadListItem key={t.id} id={t.id} title={t.title} />
          ))}
        </ThreadListSection>
      </ThreadList>
    </Column>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const rows = rowsOf(canvasElement);
    await expect(rows).toHaveLength(3);

    // Each row's own button is named by its own thread. This is what makes a
    // row addressable at all, and it is the half of the contract that holds.
    const selects = TODAY.map((t) => canvas.getByRole("button", { name: t.title }));
    await expect(new Set(selects).size).toBe(3);

    // Two stops per row, in DOM order: the row, then its actions trigger.
    // Nothing sets tabindex, so document order is the traversal.
    const stops = Array.from(canvasElement.querySelectorAll<HTMLElement>("button"));
    await expect(stops).toHaveLength(6);
    rows.forEach((row, i) => {
      expect(stops[i * 2]).toBe(selects[i]);
      expect(stops[i * 2 + 1]).toBe(actionsTrigger(row));
    });

    await userEvent.tab();
    for (let i = 0; i < stops.length; i++) {
      const focused = document.activeElement as HTMLElement;
      await expect(focused).toBe(stops[i]);
      await expect(focused.matches(":focus-visible")).toBe(true);
      const style = getComputedStyle(focused);
      await expect(style.boxShadow !== "none" || style.outlineStyle !== "none").toBe(true);
      // Odd stops are the actions triggers, which are invisible until hover.
      // Focus has to reveal them or a keyboard user is aiming at nothing.
      // Waited rather than read once: the Button base carries `transition-all`,
      // so the opacity read immediately after focus is still mid-fade at 0.
      if (i % 2 === 1) {
        await waitFor(() => expect(getComputedStyle(focused).opacity).toBe("1"));
      }
      await userEvent.tab();
    }

    // Nothing here traps: the stop after the last one is outside the list.
    await expect(canvasElement.contains(document.activeElement)).toBe(false);

    // Focus return on dismiss. Open the confirmation from the first row and
    // cancel it: focus belongs back on the control that opened it.
    const trigger = actionsTrigger(rows[0]);
    await userEvent.click(trigger);
    const body = within(document.body);
    await userEvent.click(await body.findByRole("menuitem", { name: "Delete" }));
    const dialog = await body.findByRole("alertdialog");
    await userEvent.click(within(dialog).getByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(document.activeElement).toBe(trigger));
  },
};

/**
 * A host that holds the selection and refuses to move it. This component has
 * no uncontrolled mode at all — `active` is a per-row boolean and clicking a
 * row changes nothing on its own — so "controlled" here is not a mode, it is
 * the only way it works, and a consumer who forgets to apply `onSelect` ships
 * a sidebar where no click ever opens anything.
 *
 * The render counter is what makes the last assertion mean something: the
 * host really re-rendered with an unchanged selection, so the row held
 * because `active` is a prop rather than because React skipped the work.
 *
 * `title`/`onRename` is the same pair in the same shape — the rename input
 * keeps a local draft, but the committed title is whatever you pass back.
 */
function PinnedSelection({ onSelect }: { onSelect: (id: string) => void }) {
  const [renders, setRenders] = React.useState(1);
  // The host pins the open thread to t1 and never applies what it is told.
  const activeId = "t1";
  return (
    <Column data-renders={renders}>
      <ThreadList aria-label="Conversations">
        <ThreadListSection label="Today">
          {TODAY.map((t) => (
            <ThreadListItem
              key={t.id}
              id={t.id}
              title={t.title}
              active={t.id === activeId}
              onSelect={(id) => {
                onSelect(id);
                setRenders((n) => n + 1);
              }}
            />
          ))}
        </ThreadListSection>
      </ThreadList>
    </Column>
  );
}

export const Controlled: StoryObj<typeof PinnedSelection> = {
  args: { onSelect: fn() },
  render: (args) => <PinnedSelection {...args} />,
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const first = canvas.getByRole("button", { name: "Brand video script" });
    const second = canvas.getByRole("button", { name: "Logo explorations" });

    await expect(first).toHaveAttribute("aria-current", "page");
    await expect(second).not.toHaveAttribute("aria-current");

    await userEvent.click(second);

    // The payload a consumer needs in order to apply the change.
    await expect(args.onSelect).toHaveBeenCalledWith("t2");

    // The prop wins: the click alone moved nothing…
    await expect(first).toHaveAttribute("aria-current", "page");
    await expect(second).not.toHaveAttribute("aria-current");

    // …and the host did re-render while holding it there.
    await expect(canvasElement.querySelector("[data-renders]")).toHaveAttribute("data-renders", "2");
  },
};

/**
 * A ~90-character title in a 256px column. The row's answer is `truncate`:
 * one line, ellipsis, no wrap, no `title` attribute and so no tooltip — the
 * tail is unavailable until you open the thread or open the confirmation,
 * which is the only surface that shows the whole string.
 *
 * That costs more here than in most lists, because a generated thread title
 * puts the distinguishing part at the end: two threads about the same
 * onboarding email truncate to identical visible text. The inversion is worth
 * noticing — truncation is visual only, so the row button's accessible name is
 * still the whole string and a screen-reader user can tell them apart while a
 * sighted user cannot. Length is a legibility problem here, not an a11y one.
 */
export const LongContent: Story = {
  render: () => (
    <Column>
      <ThreadList aria-label="Conversations">
        <ThreadListSection label="Today">
          <ThreadListItem
            id="t1"
            title="Rewrite the onboarding email so it explains the trial limits before it asks for a card"
          />
          <ThreadListItem id="t2" title="Logo explorations" />
        </ThreadListSection>
      </ThreadList>
    </Column>
  ),
};

/**
 * 375px, where this list is a drawer rather than a rail. The load-bearing
 * fact is not the width — it is that rename, pin and delete live behind a
 * control revealed on hover, and there is no hover on a touch screen. The
 * component's answer is `pointer-coarse:opacity-100` on the trigger, which
 * makes every row's menu permanently visible on touch.
 *
 * The gate cannot exercise that: headless chromium reports a fine pointer, so
 * the media query never matches here and the triggers render invisible below
 * exactly as they do on desktop. The class itself is therefore asserted
 * directly — it is the one thing standing between a touch user and a sidebar
 * whose every action is unreachable, and nothing else in the pipeline sees it.
 */
export const Mobile: Story = {
  render: () => (
    <div className="w-[375px] max-w-full">
      <div className="rounded-lg border p-2">
        <ThreadList aria-label="Conversations">
          <ThreadListSection label="Pinned">
            <ThreadListItem id="p1" title="Brand video script" pinned />
          </ThreadListSection>
          <ThreadListSection label="Today">
            <ThreadListItem id="t2" title="Logo explorations" unread />
            <ThreadListItem id="t3" title="Sound effects brief" />
          </ThreadListSection>
        </ThreadList>
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    for (const row of rowsOf(canvasElement)) {
      await expect(actionsTrigger(row).className).toContain("pointer-coarse:opacity-100");
    }
  },
};

/**
 * Three row lists that look alike in a sidebar and are not interchangeable.
 * The rule is about who owns a row:
 *
 * - **Thread list** — the *user's* content. Rows appear because someone
 *   started a conversation, are grouped by when they were last touched, and
 *   can be renamed, pinned and deleted by the person looking at them.
 * - **Sidebar nav** — the *product's* destinations. The set of rows is fixed
 *   by the app; nobody renames "Library". It carries what a destination needs
 *   instead: counts, tier badges, and the running spinner for a section with
 *   a job in it — which is the spinner B6's spec asks for and this component
 *   does not have.
 * - **Record list** — rows with *attributes*. Once a row needs metadata, a
 *   run state and an enable toggle it wants columns, and a table is the
 *   honest shape for it.
 *
 * If a row can be renamed by the person reading it, it is a thread. If the
 * product decides the set of rows, it is nav. If the rows need columns, it is
 * a record list.
 */
export const Boundary: Story = {
  render: () => (
    <div className="flex w-full max-w-3xl flex-col gap-6">
      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">Thread list — the user&apos;s conversations</p>
        <Column>
          <ThreadList aria-label="Conversations">
            <ThreadListSection label="Today">
              <ThreadListItem id="t1" title="Brand video script" active />
              <ThreadListItem id="t2" title="Logo explorations" />
            </ThreadListSection>
          </ThreadList>
        </Column>
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">Sidebar nav — the product&apos;s destinations</p>
        <Column>
          <SidebarNav
            activeId="library"
            sections={[
              {
                label: "Workspace",
                items: [
                  { id: "library", label: "Library" },
                  { id: "renders", label: "Renders", running: true },
                  { id: "shared", label: "Shared with me", count: 3 },
                ],
              },
            ]}
          />
        </Column>
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">Record list — rows that need columns</p>
        <RecordList
          label="Automations"
          records={[
            {
              id: "r1",
              title: "Weekly render digest",
              lastRun: "Last run 4 min ago",
              runState: "success",
              enabled: true,
            },
            {
              id: "r2",
              title: "Transcribe new uploads",
              lastRun: "Last run 2 days ago",
              runState: "failed",
              enabled: false,
            },
          ]}
        />
      </section>
    </div>
  ),
};

