import type { ReactNode } from "react";

import type { ComponentDocs } from "@/lib/component-docs";
import { ThreadList, ThreadListItem, ThreadListSection } from "@/registry/super-ai/thread-list";

/**
 * Seeded from docs/design-system/component-specs.md#b6-thread-list.
 * Translate the spec's internal voice into consumer-facing guidance — do not
 * ship the seed text verbatim.
 *
 * No "use client" here: this module is plain data read by a Server Component
 * (component-docs.tsx), which destructures `docs.whatItIs`, `docs.evidence`,
 * etc. directly. The examples below pass only strings and booleans, so they
 * cross the server boundary intact and need no `.examples.tsx` sidecar —
 * `ThreadListItem` owns its rename and delete state internally, so an example
 * never has to hold any.
 */

/** The sidebar column the shipped demo uses. Not a new design value. */
function Column({ children }: { children: ReactNode }) {
  return <div className="w-64 rounded-lg border p-2">{children}</div>;
}

function PinnedAboveTheGroups() {
  return (
    <Column>
      <ThreadList aria-label="Conversations">
        <ThreadListSection label="Pinned">
          <ThreadListItem id="p1" title="Brand video script" pinned />
        </ThreadListSection>
        <ThreadListSection label="Today">
          <ThreadListItem id="t1" title="Logo explorations" />
          <ThreadListItem id="t2" title="Sound effects brief" />
        </ThreadListSection>
        <ThreadListSection label="Yesterday">
          <ThreadListItem id="t3" title="Storyboard the 30-second cut" />
        </ThreadListSection>
      </ThreadList>
    </Column>
  );
}

function PinnedLeftInsideItsDateGroup() {
  return (
    <Column>
      <ThreadList aria-label="Conversations">
        <ThreadListSection label="Today">
          <ThreadListItem id="t1" title="Logo explorations" />
          <ThreadListItem id="p1" title="Brand video script" pinned />
          <ThreadListItem id="t2" title="Sound effects brief" />
        </ThreadListSection>
        <ThreadListSection label="Yesterday">
          <ThreadListItem id="t3" title="Storyboard the 30-second cut" />
        </ThreadListSection>
      </ThreadList>
    </Column>
  );
}

function TitlesThatSurviveTruncation() {
  return (
    <Column>
      <ThreadList aria-label="Conversations">
        <ThreadListSection label="Today">
          <ThreadListItem id="t1" title="Trial limits in onboarding email" />
          <ThreadListItem id="t2" title="Nightly build failure" />
          <ThreadListItem id="t3" title="Support tickets, this week" />
        </ThreadListSection>
      </ThreadList>
    </Column>
  );
}

function EveryRowNamedTheSame() {
  return (
    <Column>
      <ThreadList aria-label="Conversations">
        <ThreadListSection label="Today">
          <ThreadListItem id="t1" title="New chat" />
          <ThreadListItem id="t2" title="New chat" />
          <ThreadListItem id="t3" title="New chat" />
        </ThreadListSection>
      </ThreadList>
    </Column>
  );
}

export const ThreadListDocs: ComponentDocs = {
  whatItIs:
    "The conversation sidebar: past threads bucketed by when you last touched them, each row a button that opens the thread and carries its own actions menu for rename, pin and delete. Renaming happens in place — the row becomes a text input rather than opening a dialog — and deleting routes through a confirmation, because a thread is the only copy of the work in it.",
  whyItMatters:
    "It is the entire history surface of a chat product, and the only navigation most people ever use in one. Claude, ChatGPT, Manus and Descript all landed on the same three-part shape — date buckets, a pinned tier above them, and per-row rename/delete behind a hover menu — which is why this is a component rather than a per-product layout. Manus pushes it furthest: its sidebar doubles as a job queue, so a row can be a thread you are reading and a task that is still running at the same time.",
  evidence: ["Manus", "Claude", "ChatGPT", "Descript"],
  anatomy: [
    {
      slot: "thread-list",
      note: "The list root. It renders a <nav>, so it is a landmark — give it an aria-label, because a product with this component almost always has a second nav on screen.",
    },
    {
      slot: "date-section",
      note: 'One date bucket. ThreadListSection deliberately renders date-section rather than a slot of its own, so address a bucket with [data-slot="date-section"].',
    },
    {
      slot: "thread-list-item",
      note: "One row. Carries data-active when it is the open thread and data-renaming while the title is being edited in place — the row's markup is completely different in that second case.",
    },
    {
      slot: "thread-unread",
      note: "The leading dot on a thread with activity you have not seen. It is part of the row button's accessible name, so an unread row announces as “Unread ‹title›”.",
    },
  ],
  usage:
    "Compose it the way you would a list: `ThreadList` is the nav, each `ThreadListSection` is one date bucket with its own label, and each `ThreadListItem` is a row you hand `id` and `title`. Selection is fully controlled — the row does not track which thread is open, so pass `active` on the row whose `id` matches your route and apply `onSelect` yourself. Same for the title: `onRename` reports the new text, and the row keeps showing whatever `title` you pass until you persist it. Give pinned threads their own section above the date buckets rather than a flag inside one.",
  dos: [
    {
      text: "Lift pinned threads out of the date buckets entirely and render them in their own section above the first one — a pin is a promise of a fixed position, and only leaving the grouping keeps it.",
      example: <PinnedAboveTheGroups />,
    },
    {
      text: "Keep generated titles short enough to read at sidebar width. The row truncates to a single line with no tooltip and no wrap, so the tail of a long title is simply unavailable until you open the thread.",
      example: <TitlesThatSurviveTruncation />,
    },
    {
      text: "Persist every call `onRename` makes, including the one that arrives on blur. The input commits when it loses focus as well as on Enter, and a handler wired only to the Enter path drops the rename of anyone who clicked away — the most common bug this component ships into.",
    },
  ],
  donts: [
    {
      text: "Don't leave a pinned thread inside its date bucket wearing a pin icon. It still moves as the buckets re-bucket overnight, so the pin advertises a position the list does not keep.",
      example: <PinnedLeftInsideItsDateGroup />,
    },
    {
      text: "Don't let the list fill with the same generated placeholder. The title is the only thing that distinguishes one row from another to a screen reader, because every row's actions button carries an identical name.",
      example: <EveryRowNamedTheSame />,
    },
    {
      text: "Don't reach for this when the rows are the product's own destinations rather than the user's content. If nobody can rename or delete a row, you want `sidebar-nav`; if the rows need columns of metadata, you want `record-list`.",
    },
  ],
  accessibility: {
    keyboard: [
      "Every row is two tab stops, always: the thread button and its actions button. The actions button is hidden with `opacity-0` rather than removed, so it is in the tab order whether or not it is visible — a twenty-thread sidebar is forty stops, and there is no roving tabindex, no arrow-key movement between rows and no Home/End.",
      "The actions menu is a real menu once opened: arrows move through Rename, Pin and Delete, typeahead jumps, Enter activates, Escape closes and hands focus back to the trigger.",
      "While a row is renaming it is not a row at all — its markup is replaced by a single text input. Enter commits, Escape reverts, and blur commits any change, which is why a handler wired only to Enter drops the rename of anyone who tabbed or clicked away.",
      "That Escape handler does not call `stopPropagation`, so cancelling a rename inside a dialog, sheet or popover also closes the surface the list is sitting in. Worth checking wherever this list is nested.",
      "Delete opens a modal confirmation: Tab is trapped in it, Escape cancels, and there is no way to delete a thread from the keyboard without passing through it. Nothing is bound to Delete or Backspace on a row.",
      "Nothing in the row is ever `disabled`. A thread you should not be able to open is a thread you should not render.",
    ],
    screenReader: [
      "The root renders a `<nav>` and therefore a navigation landmark — with no name of its own. Pass `aria-label`, because a product that has this component almost always has a second nav on screen and two unnamed navigation landmarks are indistinguishable in a landmark list.",
      "Each date bucket is `role=\"group\"` labelled by its visible date text, so \"Today\" and \"Yesterday\" are announced as groups. There is no list markup inside them, though, so nothing announces how many threads a bucket holds.",
      "A row's name is built from content: the title, plus \"Unread\" when the dot is present. That dot is a `<span aria-label=\"Unread\">` with no role — browsers currently fold it into the button's name, giving \"Unread <title>\", but ARIA does not permit `aria-label` on a generic element, so it is not a guaranteed carrier. It also puts the state first, so a run of unread threads all begin with the same word.",
      "The pinned state is not announced at all. It renders as a `Pin` glyph that is `aria-hidden`, so a pinned row and an unpinned one are indistinguishable to assistive tech — and because the menu item only reads \"Unpin\" once opened, the state is discoverable only by opening the menu.",
      "The open thread carries `aria-current=\"page\"`, so \"which conversation am I in\" is answerable without seeing the highlight.",
      "Each actions button is named `\"Thread actions for <title>\"`, so the menus are distinguishable — but only as far as the titles are. A sidebar of threads all called \"New chat\" is a column of identical buttons, which is the real accessibility argument for generating distinct titles.",
      "The rename input is labelled with the constant string \"Thread title\". Only one row can be renaming at a time, so that is unambiguous in practice, but it does not say which thread is being renamed.",
      "Nothing announces the result of anything. Renaming, pinning, unpinning and deleting all complete with no live region, so a screen-reader user gets no confirmation that a thread was renamed or that it is gone.",
    ],
    focus: [
      "Leaving rename mode drops focus. Enter and Escape both unmount the input and nothing restores focus, so it falls to `<body>` and the next Tab restarts from the top of the page. Move focus back to the row yourself after you persist the title — this is the component's sharpest keyboard defect.",
      "Cancelling the delete confirmation returns focus to the row's actions button, which is correct. Confirming does not have anywhere safe to land: the row is removed by your handler, so the element focus was returning to no longer exists.",
      "The actions button is invisible unless the row is hovered, the button matches `:focus-visible`, its menu is open, or the pointer is coarse. Focus restored programmatically that does not match `:focus-visible` therefore parks focus on a control nobody can see — keep all four reveals if you restyle the row.",
      "The thread button is the one control here with no focus ring of its own — its class list carries hover styles and nothing for `focus-visible`, so it inherits whatever you have globally. The actions button, the rename input and the confirmation's buttons all bring the design system's ring with them, which means the most-used control in the list is the only one that can end up invisible on focus.",
    ],
  },
  pitfalls: [
    "Rename and delete-confirm are internal state with no prop to force them. There is no `renaming` prop, no `open` prop on the confirmation and no imperative handle — to reach either state in a test, open the row's actions menu and choose the item, the same way a person does.",
    "The two resolve differently, and only one of them is safe. Cancelling the delete confirmation puts focus back on the row's actions button, as it should. Committing a rename does not: the input unmounts and focus falls to the document body, so a keyboard user who presses Enter loses their place in the list entirely. Move focus back to the row yourself after you persist the new title.",
    'Every row\'s actions button is named "Thread actions for <title>", so the name is only as useful as the title you pass — a sidebar of threads all called "New chat" is still a list of identical buttons to a screen-reader user, which is the real reason the row title is worth keeping short and distinct. It used to be a constant "Thread actions" for every row; if you query it in a test, match the interpolated name.',
    "That actions button is invisible until the row is hovered, the button is focused, or the pointer is coarse. If you restyle the row, keep all three reveals: dropping the focus-visible one leaves keyboard users tabbing onto a control they cannot see, and dropping the coarse-pointer one takes rename, pin and delete away from touch entirely.",
    "Nothing in the shipped component shows a thread as running. The pattern's reference products put a spinner in the row for agent work that outlives the view, but there is no status slot here yet — surface that state with `task-tray` or `sidebar-nav` beside this list rather than expecting the row to carry it.",
  ],
};
