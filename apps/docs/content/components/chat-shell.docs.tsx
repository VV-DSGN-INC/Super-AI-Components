import type { ComponentDocs } from "@/lib/component-docs";
import {
  ArtifactsBehindTheirOwnTab,
  ArtifactsInsideTheStream,
  RunningJobCarriesAWord,
  RunningJobIsOnlyASpinner,
} from "./chat-shell.examples";

/**
 * Seeded from docs/design-system/block-specs.md — O2 `chat-shell`.
 *
 * No "use client" here: this module is plain data read by a Server Component
 * (component-docs.tsx), which destructures `docs.whatItIs`, `docs.evidence`
 * and the rest directly. Live examples live in the ./chat-shell.examples
 * client sidecar and arrive here as zero-prop elements.
 */
export const ChatShellDocs: ComponentDocs = {
  whatItIs:
    "The page shell for a chat or agent workspace: a thread list on the left that doubles as a job queue, a title bar, a scrolling conversation, the artifacts that conversation produced, and a composer pinned to the bottom. It is a block, not a component — it owns arrangement and nothing else. Every region is filled by something that already ships: eleven components from this registry, plus AI Elements' own conversation and message for the stream and its turns. Each of them keeps its own props, its own state model and its own accessibility contract.",
  whyItMatters:
    "Manus, Claude and ChatGPT converge on the same five regions in the same positions, which is the strongest signal on the reference board that this is an archetype rather than one product's layout. Two of its decisions are the ones worth copying. The sidebar is a job queue as well as a history, so work that is still running stays visible while you read something else — without that, a background task is invisible the moment you navigate away from it. And artifacts are cards inside the stream rather than a separate destination, so the conversation stays the index of everything it produced; splitting them apart is what turns a workspace back into a chat window with a downloads folder attached.",
  evidence: ["Manus", "Claude", "ChatGPT"],
  anatomy: [
    {
      slot: 'data-region="sidebar"',
      note: "B1 app-sidebar holding B6 thread-list, or L1 when there are no threads.",
    },
    {
      slot: 'data-region="topbar"',
      note: "The sidebar trigger plus B7 app-topbar, titled with the active conversation.",
    },
    {
      slot: 'data-region="message-stream"',
      note: "AI Elements' Conversation. role=log, named, its own tab stop, sticks to bottom.",
    },
    {
      slot: 'data-region="artifact-cards"',
      note: "J4 artifact-grid, nested inside the stream and always mounted.",
    },
    {
      slot: 'data-region="composer"',
      note: "D1 media-prompt-bar with D3 chips and D4 modes, N3 underneath.",
    },
    { slot: "chat-shell", note: "Root. Contains its own fixed descendants so the shell can be embedded." },
    {
      slot: "chat-shell-turn",
      note: "One turn — AI Elements' Message. Carries data-message-id and data-role.",
    },
    {
      slot: "chat-shell-thread-running",
      note: "The job-queue status line under a thread that is still working.",
    },
  ],
  usage:
    "Reach for it when the primary object of your product is a conversation that produces things. Everything is a prop or a slot: `threadGroups` fills the sidebar, `messages` fills the stream, `artifacts` fills the artifact region, and `composer` is forwarded whole to D1. Mark a thread `running` and the sidebar becomes a job queue — pass `runningLabel` so the status says what is actually happening rather than the generic word. Put a blocked run in `paywall` rather than opening a dialog: it renders as the final turn, which is what keeps monetization part of the conversation. The shell holds no conversation state of its own, so selection, feedback and composer value all stay wherever your data already lives.",
  dos: [
    {
      text: "Give a running job a visible label as well as a spinner, so the queue is readable without seeing motion.",
      example: <RunningJobCarriesAWord />,
    },
    {
      text: "Keep artifacts inside the stream, attached to the conversation that produced them.",
      example: <ArtifactsInsideTheStream />,
    },
  ],
  donts: [
    {
      text: "Don't let a spinner be the whole signal — a turning glyph has no accessible name and says nothing about what is running.",
      example: <RunningJobIsOnlyASpinner />,
    },
    {
      text: "Don't move artifacts to their own tab; the conversation stops being the index of its own output the moment you do.",
      example: <ArtifactsBehindTheirOwnTab />,
    },
  ],
  accessibility: {
    keyboard: [
      "The shell's own order is: sidebar trigger, `switcher`, one stop per thread row plus its actions trigger, `sidebarPromo` and `sidebarFooter`, the topbar's controls, the stream itself, then the composer. Everything inside those slots keeps the keyboard model of the component that fills it.",
      "Cmd/Ctrl+B toggles the sidebar from anywhere. That shortcut is registered on `window` by the vendored sidebar, so it fires while you are typing in the composer too — which is worth knowing before you bind Cmd+B to bold text in a rich composer.",
      "The stream carries `tabIndex={0}`, so it is a focusable scroll region: arrow keys, Page Up/Down and Home/End scroll the conversation once you tab into it. That is deliberate — it is what keeps a scrollable region reachable without a mouse.",
      "In the composer, Enter sends and Shift+Enter inserts a newline. D1 fixes that and the shell exposes no way to change it, so a product that wants Enter to break lines has to replace the composer.",
      "While `composer.generating` is set, D1 disables the textarea, the attach button and the settings row and leaves only Stop. A user tabbing into the composer mid-run finds exactly one control.",
      "Each thread's actions trigger is revealed by opacity, not `display:none`, so it stays a tab stop on every row. Renaming opens an input that takes focus, Enter commits, Escape cancels.",
      "The artifact region sits inside the scrolling stream, after every turn. Reaching it from the keyboard means tabbing through every turn's feedback controls first — there is no skip link and no separate tab stop for it.",
      "The shell does not render AI Elements' scroll-to-bottom button, so there is no control that jumps back to the newest turn after you scroll up; the stream re-pins itself only when a new turn arrives.",
    ],
    screenReader: [
      "The stream is `role=\"log\"` named \"Conversation\", so new turns are announced as they are appended. That behaviour comes from AI Elements rather than from anything the shell adds.",
      "`role=\"log\"` announces additions, not replacements. Changing `activeThreadId` swaps the entire conversation and a reader hears nothing — the most common surprise in this shell. Announce the switch yourself, from wherever your thread state lives.",
      "A running thread renders a `role=\"status\"` line under its row, so a job that starts while you are reading another thread announces itself using the words in `runningLabel`. The spinner beside it is `aria-hidden`, which is why the label has to say something — \"Running\" is the default and says the least.",
      "That is one live region per running thread. Ten running jobs is ten live regions, and a re-render that changes several at once queues several announcements.",
      "The artifact region is a `<section>` labelled by its own `<h2>`, so it is a landmark a reader can jump to; `artifactsLabel` is its name and `artifactsEmptyLabel` is what J4 says inside it on day one.",
      "The composer textarea is named from D1's `label`, which the shell fixes to \"Message\" unless you override it through `composer.label`. Attach is \"Attach a file\", submit is \"Send\".",
      "D1 owns an `sr-only` `role=\"status\"` that announces its generating label, so the start of a run is spoken — but only if you actually set `composer.generating`.",
      "The paywall renders as the last child of the log, so a blocked run is announced like any other turn arriving rather than as an interruption. That is the point of putting it in the stream instead of a dialog.",
      "The sidebar trigger is named \"Toggle Sidebar\" by the vendored primitive, and the thread list is named \"Conversations\" here. Neither is configurable through the shell.",
    ],
    focus: [
      "Switching threads moves no focus. Focus stays on the thread row you activated — usually right, and it also means the newly loaded conversation is several tabs away with nothing announcing that it arrived.",
      "Deleting the active thread unmounts the row that had focus and nothing restores it, so focus falls to `<body>` and the next Tab restarts at the top of the shell. Move focus in your `onDeleteThread`.",
      "Cmd/Ctrl+B while focus is inside the sidebar collapses it around the focused element. The rail keeps its controls mounted, so focus survives, but it lands on something now rendered as an icon.",
      "The stream is focusable and has no focus style of its own — it gets `tabIndex={0}` and no `focus-visible` class — so tabbing into the conversation shows only whatever outline your app provides. Everything else here uses the shared primitives' rings.",
    ],
  },
  pitfalls: [
    "AI Elements is written against Radix-flavoured shadcn and this registry is Base UI, so the vendored `message` needed two local `asChild` → `render=` edits to typecheck. Installing chat-shell through shadcn fetches AI Elements' file from its own registry, not this repo's patched copy — in a Base UI project, expect to make the same two edits.",
    "`use-stick-to-bottom` owns an element between the conversation root and its content, and sets no overflow on it. Without a `scrollClassName` the stream does not scroll at all, it just grows — and because that element is not yours, the region's accessible name and tab stop have to live on the conversation root instead.",
    "The vendored sidebar's desktop container is `fixed inset-y-0 h-svh`, which is right only when the shell owns the viewport. The root sets `contain: layout` so the shell stays embeddable in a panel, a preview or an app region — if you re-wrap or restyle the root, keep that containment or the sidebar will pin itself to the browser's left edge. The root also constrains that container to the shell's own height, which is what makes `sidebarPromo` and `sidebarFooter` usable in an embedded shell; before that they were bottom-anchored below the visible edge, invisible and still in the tab order.",
    "D1 is the media-generation omnibox, so it offers a negative-prompt field that a chat composer has no use for. The shell suppresses that control through a descendant variant on D1's own class list; a `composer.className` you pass is merged after the shell's, so overriding the same utility will bring the control back.",
    "The stream is the scroll container, which is why it carries `tabIndex={0}` and an accessible name. Moving the overflow onto an inner wrapper without moving those two with it fails axe's scrollable-region-focusable rule and strands keyboard users outside the conversation.",
    "J4's card grid keys its columns off its own container width (D19), not the viewport, so it already reads the stream's actual width and needs no override here — the shell renders it unadorned. If you fork this region, do not reintroduce a viewport-breakpoint override on the grid; that is the defect D19 fixed.",
    "Feedback, thread selection and composer value are all controlled. Rendering the shell with `messages` that never change and a `feedback` state that never moves produces a screenshot, not a workspace — wire the callbacks before demoing it.",
  ],
};
