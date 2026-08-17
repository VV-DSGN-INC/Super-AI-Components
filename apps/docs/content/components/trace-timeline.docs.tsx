import type { ComponentDocs } from "@/lib/component-docs";
import {
  PositionedByStartTime,
  RetryAsSiblingRow,
  RetryReplacingFailedAttempt,
  StackedIgnoringStartTime,
} from "./trace-timeline.examples";

/**
 * Seeded from docs/design-system/component-specs.md#n4-trace-timeline.
 * Translate the spec's internal voice into consumer-facing guidance — do not
 * ship the seed text verbatim.
 *
 * No "use client" here: this module is plain data read by a Server
 * Component (component-docs.tsx), which destructures `docs.whatItIs`,
 * `docs.evidence`, etc. directly. Live examples live in the sibling
 * "trace-timeline.examples" client module and are referenced here as
 * zero-prop elements.
 */
export const TraceTimelineDocs: ComponentDocs = {
  whatItIs:
    "A waterfall view of an agent run's steps, tool calls, and LLM calls, positioned along a shared time axis instead of listed in a flat sequence. Each row expands in place to show the full detail of that call.",
  whyItMatters:
    "This is the view an engineer opens once a run has already gone wrong, and its entire value over a plain log is what a flat list hides: which calls actually overlapped. LangSmith, Vercel's AI SDK observability, and every agent debugger on the reference board place spans on a shared time axis rather than just an order, because \"what happened, and when\" is a question a bulleted step list can't answer.",
  evidence: ["LangSmith", "Vercel AI observability", "Agent debuggers"],
  anatomy: [
    { slot: "trace-timeline", note: "Root wrapper around the row list." },
    { slot: "trace-timeline-rows", note: "The list of spans, ordered by start time." },
    { slot: "trace-timeline-row", note: "One span: a Collapsible carrying its trigger and detail." },
    { slot: "trace-timeline-row-trigger", note: "The clickable row header — status, name, bar, duration." },
    { slot: "trace-timeline-row-name", note: "The span's own name." },
    {
      slot: "trace-timeline-row-attempt",
      note: '"Attempt N" badge, shown once a span shares retry lineage.',
    },
    {
      slot: "trace-timeline-row-status-text",
      note: "Visible status text for error/running rows — never colour alone.",
    },
    { slot: "trace-timeline-row-track", note: "The decorative axis a row's bar is positioned on." },
    { slot: "trace-timeline-row-bar", note: "Positioned by startMs/durationMs — the waterfall itself." },
    { slot: "trace-timeline-row-duration", note: "How long the call took." },
    { slot: "trace-timeline-row-detail", note: "The CollapsibleContent an open row expands into." },
  ],
  usage:
    "Reach for it once a run has more than a couple of steps and someone needs to reconstruct what actually happened, not just what was attempted. Feed it a flat `spans` array with `startMs`/`durationMs` in milliseconds from the start of the run — it derives the shared axis itself, so never pre-stack or pre-offset spans before handing them in. When a step retries, add the retry as a second span whose `retryOf` points at the id of the one it retried; never mutate or remove the failed attempt to make room for it. Pass `renderDetail` to fill an expanded row with the real per-run detail (I/O, tokens, cost) once that surface exists on your side — omit it and a minimal built-in summary is used instead. `renderDetail(span, retriedBy)`'s second argument is already resolved for you: `undefined` for a span nothing retried, or `{ id, name, status }` of whichever span retried it — no need to scan `spans` for a matching `retryOf` yourself.",
  dos: [
    {
      text: "Let a bar's position come from startMs/durationMs so two calls that actually overlapped visibly overlap.",
      example: <PositionedByStartTime />,
    },
    {
      text: "Add a retry as a new span with retryOf set — the failed attempt keeps its own row, error text and all.",
      example: <RetryAsSiblingRow />,
    },
  ],
  donts: [
    {
      text: "Don't lay every span out full-width in call order — that hides the one thing this view exists to show: concurrency.",
      example: <StackedIgnoringStartTime />,
    },
    {
      text: "Don't drop the failed attempt once a retry succeeds — the record of what actually happened is the point.",
      example: <RetryReplacingFailedAttempt />,
    },
  ],
  accessibility: {
    keyboard: [
      "One tab stop per span — the row trigger — plus whatever `renderDetail` puts inside the one open row. The bars, the axis and the duration are inert, so a forty-span trace is forty stops and nothing else.",
      "Enter and Space toggle a row. The trigger is a real `<button>` from Base UI's Collapsible, so that comes for free.",
      "Nothing else is bound. There is no arrow-key movement between rows, no Home/End, no Escape to collapse an open row and no expand-all — Tab is the only way through a long trace.",
      "Only one row can be open at a time, so opening a row closes whichever was open and removes that row's detail — and any tab stops inside it — from the page mid-traversal.",
    ],
    screenReader: [
      "Rows are `<li>` inside a `<ul>`, so the trace announces its length and each row its position in it.",
      "Every visible part of a trigger is `aria-hidden` — the status icon, the kind icon, the name, the attempt badge, the status text, the bar and the duration. The whole accessible name is one explicit `aria-label`: `\"<name>, Attempt <n>, <status>, <duration>\"`, with a failed span reading `Failed: <error>`. It is built that way because two adjacent spans with no text node between them fuse into `\"Attempt 2Succeeded\"`.",
      "That name is also the only place a succeeded row says so. `trace-timeline-row-status-text` is rendered for `error` and `running` only, so on screen \"succeeded\" is carried by the tick icon and the bar colour alone.",
      "Where a bar sits on the shared axis is announced to nobody. The track is `aria-hidden`, and the row's name carries duration but not start time — so the one thing this view exists to show, that two calls overlapped, is visual only. Start time is spoken in the built-in fallback detail, and only for the row that is open.",
      "Base UI gives each trigger `aria-expanded` and a `data-panel-open` attribute; the open row's body is a `role=\"group\"` named by a visually hidden `<h4>` reading \"<name> detail\".",
      "There is no live region anywhere in the component. A span moving from `running` to `ok`, a retry row appearing, a trace arriving after mount and the empty message being replaced are all silent. If your trace streams, announce it yourself.",
      "Durations are spoken through `formatDurationMs`, so \"380ms\" and \"2.4s\" rather than a raw millisecond count.",
    ],
    focus: [
      "Expanding a row keeps focus on its trigger, which stays mounted — so the normal open/close path never strands focus.",
      "Changing `expandedId` from outside while focus is inside the open row's detail unmounts that detail and drops focus to `<body>`.",
      "Triggers ship `focus-visible:ring-2 ring-ring`. Anything `renderDetail` returns brings its own focus styling, or your global one.",
      "Nothing scrolls a newly opened row into view, so opening a row near the bottom of a long trace expands its detail below the fold.",
    ],
  },
  pitfalls: [
    "Deriving the timeline's total span from array order or index instead of startMs + durationMs — the moment a call starts after an earlier one has already finished, index-based layout stops matching reality.",
    "Treating an errored row as done once it's red. The visible \"Failed: <reason>\" text is the real signal — colour alone fails anyone who can't see it.",
    "Wiring `renderDetail` to assume N5 `run-inspector`'s exact prop shape before that component exists — this component only ever hands back the row's own `TraceSpan` plus its resolved `retriedBy`; the richer per-run record N5 needs (I/O, tokens, cost, cache hit/miss) is still the host's to look up by `span.id`.",
    'Re-deriving "was this span retried, and how did it go" by scanning `spans` for a matching `retryOf` at the call site — `renderDetail`\'s second argument already is that answer, resolved once by the component itself.',
  ],
};
