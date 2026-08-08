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
  pitfalls: [
    "AI Elements is written against Radix-flavoured shadcn and this registry is Base UI, so the vendored `message` needed two local `asChild` → `render=` edits to typecheck. Installing chat-shell through shadcn fetches AI Elements' file from its own registry, not this repo's patched copy — in a Base UI project, expect to make the same two edits.",
    "`use-stick-to-bottom` owns an element between the conversation root and its content, and sets no overflow on it. Without a `scrollClassName` the stream does not scroll at all, it just grows — and because that element is not yours, the region's accessible name and tab stop have to live on the conversation root instead.",
    "The vendored sidebar's desktop container is `fixed inset-y-0 h-svh`, which is right only when the shell owns the viewport. The root sets `contain: layout` so the shell stays embeddable in a panel, a preview or an app region — if you re-wrap or restyle the root, keep that containment or the sidebar will pin itself to the browser's left edge. The trade-off is that the sidebar keeps its full `h-svh` height and gets clipped to the shell's: anything the sidebar anchors to its bottom — `sidebarPromo` and `sidebarFooter` both — falls below the clip and is invisible whenever the shell is shorter than the viewport, which is the default embedded case. Fill those two slots only in a shell rendered at viewport height, or leave them empty until the sidebar primitive learns to measure its containing block instead of `svh`.",
    "D1 is the media-generation omnibox, so it offers a negative-prompt field that a chat composer has no use for. The shell suppresses that control through a descendant variant on D1's own class list; a `composer.className` you pass is merged after the shell's, so overriding the same utility will bring the control back.",
    "The stream is the scroll container, which is why it carries `tabIndex={0}` and an accessible name. Moving the overflow onto an inner wrapper without moving those two with it fails axe's scrollable-region-focusable rule and strands keyboard users outside the conversation.",
    "J4's card grid steps columns at viewport breakpoints, not container width, so inside a stream that is narrower than the window it over-columns and clamps the excerpt to nothing. The shell pins it to one column, then two — if you restyle the artifact region, restyle the inner grid, not the wrapper.",
    "Feedback, thread selection and composer value are all controlled. Rendering the shell with `messages` that never change and a `feedback` state that never moves produces a screenshot, not a workspace — wire the callbacks before demoing it.",
  ],
};
