import type { ComponentDocs } from "@/lib/component-docs";
import {
  CancelOnLiveWork,
  NotificationFeed,
  NotifyIsPerTask,
  PreSortedOrderIsLost,
  RowsNavigateBack,
} from "./task-tray.examples";

/**
 * Seeded from docs/design-system/component-specs.md#n12-task-tray.
 * Translate the spec's internal voice into consumer-facing guidance — do not
 * ship the seed text verbatim.
 *
 * No "use client" here: this module is plain data read by a Server
 * Component (component-docs.tsx), which destructures `docs.whatItIs`,
 * `docs.evidence`, etc. directly. Every live example needs handlers and its
 * own task state, so they live in the ./task-tray.examples client sidecar and
 * arrive here as zero-prop elements. Because the tray is a modal Sheet, each
 * one is a trigger button that opens the real panel rather than an inline
 * render of a surface that only exists on top of the page.
 */
export const TaskTrayDocs: ComponentDocs = {
  whatItIs:
    "A slide-over panel listing background work that keeps running after you leave the screen that started it. Each row names one task, shows whether it is running, waiting on you, done or failed, and links back to the surface that owns it. Rows that are still live also carry their own cancel button and their own opt-in for a completion notification.",
  whyItMatters:
    "Once an assistant can start work that outlives a view, the work becomes invisible — and invisible work that has silently stopped waiting for an approval is the worst case, because nothing is on screen to say so. That is why `needs-input` sorts above everything else here and why the panel is app-shell chrome rather than something nested in the surface that spawned the task. GitHub Copilot's coding agent and background sessions, ChatGPT's Workspace Agents, Microsoft Copilot Tasks and Manus all converged on the same slide-over, which is what moved this from a single observation to a shipped component.",
  evidence: ["GitHub Copilot", "ChatGPT Workspace Agents", "Microsoft Copilot Tasks", "Manus"],
  anatomy: [
    {
      slot: "task-tray",
      note: "The slide-over panel itself. It is a Sheet, so it renders in a portal at the end of the document and traps focus while open.",
    },
    {
      slot: "sheet-header",
      note: 'Holds the "Tasks" title and the one-line summary beneath it, which switches to "N waiting on you" as soon as any task needs input.',
    },
    {
      slot: "entity-row",
      note: "One task. Carries data-task-id and data-status, which is how you address a specific row — the row does not take a data-slot of its own.",
    },
    {
      slot: "entity-row-icon",
      note: "The status mark: a spinner while running, a check when done, an alert for needs-input and failed. Failed and needs-input are also tinted, but shape carries the meaning.",
    },
    {
      slot: "entity-row-description",
      note: "Where the task came from, prefixed by a visually-hidden status word so assistive tech hears the state without relying on the icon.",
    },
    {
      slot: "sheet-close",
      note: "The panel's own dismiss button, rendered last and therefore the final stop in the focus ring.",
    },
  ],
  usage:
    "Mount it once, in the app shell, next to whatever badge or button opens it — not inside the editor, thread or upload flow that happened to start the task. Pass the full `tasks` array on every render and let the component sort it; ordering is its decision, not yours, because `needs-input` has to reach the top no matter when it arrived. Wire `onOpenTask` for every task you list, since a row that cannot navigate back to its own surface turns the tray into a notification list. Add `onCancelTask` unless the work genuinely cannot be stopped, and add `onNotifyChange` if you want users to opt into a completion ping for the one run out of five they actually care about.",
  dos: [
    {
      text: "Give every task an onOpenTask target, so each row is a way back to the surface that owns the work rather than a status line you can only read.",
      example: <RowsNavigateBack />,
    },
    {
      text: "Offer cancel on anything still live — work a user cannot stop keeps spending their budget and their trust.",
      example: <CancelOnLiveWork />,
    },
    {
      text: "Keep the completion notification per-task and off by default, so the opt-in means something; a global toggle just makes every run shout.",
      example: <NotifyIsPerTask />,
    },
  ],
  donts: [
    {
      text: "Don't render the tray inside the surface that started the task — it unmounts on navigation, which is precisely when the tray is the only thing still reporting.",
    },
    {
      text: "Don't sort or filter the array before passing it in expecting that order to survive; the component re-sorts by status and a task blocked on approval will move to the top.",
      example: <PreSortedOrderIsLost />,
    },
    {
      text: "Don't use it as a notification feed. Rows are live work with controls attached, not a log of things that already happened.",
      example: <NotificationFeed />,
    },
  ],
  accessibility: {
    keyboard: [
      "Escape closes the panel and Tab is trapped inside it while it is open — the tray is a modal Base UI dialog, so the page behind it is inert and cannot be reached until it closes.",
      "A row's stop count depends on its status, not on its position. A `running` or `needs-input` row is up to three stops — the row itself, the notify toggle, the cancel button — while a `done` or `failed` row is one, or zero if you passed no `onOpenTask`. Five live tasks is fifteen stops before the close button, which is rendered last and is therefore the final stop in the ring.",
      "Every control is a real button, so Space and Enter activate all of them. There is no Delete or Backspace shortcut for cancelling a task, no arrow-key movement between rows, and no keyboard route to reorder or dismiss one.",
      "Nothing here is ever `disabled`. Controls are absent rather than inert, so the tab order changes shape as tasks move through their statuses rather than staying fixed and greying out.",
    ],
    screenReader: [
      "The panel announces as a dialog named \"Tasks\", described by the line beneath it — which reads \"3 waiting on you\" as soon as anything needs input, and otherwise explains that the work keeps running after you navigate away.",
      "Each row's status reaches assistive tech as a visually hidden word at the front of the description (\"Needs input. Brief editor\"), never from the icon: the spinner, tick and alert glyphs are all `aria-hidden` by lucide's default, and the destructive tint on a failed row is invisible to a screen reader.",
      "Known gap, and the one worth knowing before you ship: the row controls are not named per task. Every cancel button is \"Cancel task\" and every notify toggle is \"Notify me when done\" / \"Stop notifying when done\", so a tray holding three live tasks presents three identical cancel buttons in a screen reader's element list with nothing to tell them apart. Only the row buttons themselves are distinguishable, by title.",
      "The notify control carries `aria-pressed`, so it announces as a toggle that is pressed or not — but its name changes with its state as well, which means it reads as, for example, \"Stop notifying when done, pressed\". Cancel is a plain action button with no state.",
      "Nothing announces a change of status. The description line's \"N waiting on you\" is `SheetDescription`, not a live region, so a task moving to `needs-input` while the tray is open re-sorts the list to the top and says nothing. If that transition matters, own the announcement outside the tray.",
      "The list is a plain `<ul>`, so it announces with a count — of everything, since the tray never filters. `data-task-id` and `data-status` are test handles and are not exposed to assistive tech.",
    ],
    focus: [
      "Opening the tray moves focus into the panel and closing it returns focus to the trigger, both handled by the underlying dialog. That much is safe.",
      "Inside it is not. Cancelling a task removes its controls the moment your state comes back — the cancel button that was just pressed unmounts, and focus falls to the panel with nothing focused, so the next Tab restarts at the top of the tray. The same happens when a running task finishes on its own under a focused control.",
      "The sort is by status, so a task changing status moves. Rows are keyed by `task.id`, so focus follows the row rather than the position — but the row it is on can jump to the top of the list mid-read, with nothing announced.",
      "Every control is the vendored `Button`, so the whole panel has the design system's `focus-visible:ring-3` without any work at the call site.",
    ],
  },
  pitfalls: [
    "The panel is a portaled, modal Sheet. In tests, query it from `document.body` rather than the story or page canvas, and remember that a `dir` or width wrapper placed around the trigger does not reach the panel — set direction on the document and pass a width through `className` instead.",
    "Cancel and notify only render for `running` and `needs-input` rows. A done or failed row has no controls at all, so any layout that assumes a fixed trailing width per row will look ragged.",
    "Known gap: when several tasks are live at once, every cancel button carries the same accessible name (\"Cancel task\"), and every notify toggle the same pair of names. A screen-reader user listing the buttons hears the set with nothing to tell the rows apart. Titles are ReactNode, so labelling them per-row is a real change rather than a string interpolation — track it before shipping a tray that routinely holds more than one live task.",
    "The row and its controls are deliberately siblings, not nested. `EntityRow` renders a real `<button>` once it has `onSelect`, so putting the cancel and notify buttons in its `trailing` slot would nest interactive elements — invalid HTML, and a hydration error in React.",
    "Row status is presentational only; the component never polls or transitions anything on its own. Every change to `status`, and every consequence of `onCancelTask`, has to come back through the `tasks` prop.",
  ],
};
