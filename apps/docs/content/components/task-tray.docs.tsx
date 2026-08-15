import type { ComponentDocs } from "@/lib/component-docs";

/**
 * Seeded from docs/design-system/component-specs.md#n12-task-tray.
 * Translate the spec's internal voice into consumer-facing guidance — do not
 * ship the seed text verbatim.
 *
 * No "use client" here: this module is plain data read by a Server
 * Component (component-docs.tsx), which destructures `docs.whatItIs`,
 * `docs.evidence`, etc. directly. This component's live examples would each
 * need an open Sheet and its own state, so no `.examples.tsx` sidecar is
 * shipped — the dos and donts are stated rather than rendered.
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
    },
    {
      text: "Offer cancel on anything still live — work a user cannot stop keeps spending their budget and their trust.",
    },
    {
      text: "Keep the completion notification per-task and off by default, so the opt-in means something; a global toggle just makes every run shout.",
    },
  ],
  donts: [
    {
      text: "Don't render the tray inside the surface that started the task — it unmounts on navigation, which is precisely when the tray is the only thing still reporting.",
    },
    {
      text: "Don't sort or filter the array before passing it in expecting that order to survive; the component re-sorts by status and a task blocked on approval will move to the top.",
    },
    {
      text: "Don't use it as a notification feed. Rows are live work with controls attached, not a log of things that already happened.",
    },
  ],
  pitfalls: [
    "The panel is a portaled, modal Sheet. In tests, query it from `document.body` rather than the story or page canvas, and remember that a `dir` or width wrapper placed around the trigger does not reach the panel — set direction on the document and pass a width through `className` instead.",
    "Cancel and notify only render for `running` and `needs-input` rows. A done or failed row has no controls at all, so any layout that assumes a fixed trailing width per row will look ragged.",
    "Known gap: when several tasks are live at once, every cancel button carries the same accessible name (\"Cancel task\"), and every notify toggle the same pair of names. A screen-reader user listing the buttons hears the set with nothing to tell the rows apart. Titles are ReactNode, so labelling them per-row is a real change rather than a string interpolation — track it before shipping a tray that routinely holds more than one live task.",
    "The row and its controls are deliberately siblings, not nested. `EntityRow` renders a real `<button>` once it has `onSelect`, so putting the cancel and notify buttons in its `trailing` slot would nest interactive elements — invalid HTML, and a hydration error in React.",
    "Row status is presentational only; the component never polls or transitions anything on its own. Every change to `status`, and every consequence of `onCancelTask`, has to come back through the `tasks` prop.",
  ],
};
