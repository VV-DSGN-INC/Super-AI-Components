import type { ComponentDocs } from "@/lib/component-docs";
import {
  CacheAsSeparateBadgeMockup,
  CacheBesideCost,
  CopyableRawInput,
  ErrorTabWithRetryLineage,
  UncopyableJsonMockup,
} from "./run-inspector.examples";

/**
 * Seeded from docs/design-system/component-specs.md#n5-run-inspector.
 * Translate the spec's internal voice into consumer-facing guidance — do not
 * ship the seed text verbatim.
 *
 * No "use client" here: this module is plain data read by a Server
 * Component (component-docs.tsx), which destructures `docs.whatItIs`,
 * `docs.evidence`, etc. directly. Live examples live in the sibling
 * "run-inspector.examples" client module and are referenced here as
 * zero-prop elements.
 */
export const RunInspectorDocs: ComponentDocs = {
  whatItIs:
    'The span detail an engineer opens from a trace: the raw input and output of one step of an agent run, its cost and cache status, and — when it failed — what was retried and whether the retry worked. It\'s what turns "the run failed" into a bug report someone can act on.',
  whyItMatters:
    "A pretty-printed payload that can't leave the page isn't a debugging tool, it's a screenshot. This is the surface every tracing product converges on for exactly that reason: LangSmith and Vercel's AI SDK observability both pair a readable I/O view with a raw copy path, because the point of opening a span is usually to paste its exact input into a bug report or a retry, not to admire the formatting.",
  evidence: ["Tracing tools"],
  anatomy: [
    { slot: "run-inspector", note: "Root wrapper around the tab set." },
    { slot: "run-inspector-tabs", note: "The tab list — Input, Output, Metadata, Error." },
    { slot: "run-inspector-input-panel", note: "Raw request payload, pretty-printed and copyable." },
    { slot: "run-inspector-output-panel", note: "Raw response payload, pretty-printed and copyable." },
    { slot: "run-inspector-metadata-panel", note: "Model, latency, tokens, cost, and cache hit/miss." },
    { slot: "run-inspector-error-panel", note: "The error, if any, plus what was retried and how it went." },
  ],
  usage:
    "Reach for it wherever a host already has the richer per-run record a trace row's own TraceSpan doesn't carry — I/O, tokens, cost, cache hit/miss. Pass `input` (always) and `output` (once the run has one); both render pretty-printed with a Copy control that carries the exact JSON shown, never a summarized version. Put `cacheHit` next to `cost` in `metadata` rather than surfacing it anywhere else — cache state is usually the biggest lever on spend, and this component keeps it in the same glance as the number it affects. For the error tab, pass `retriedAttempt` when this run itself retried an earlier one, and `retriedBy` when a later run retried this one — both accept `{ id, name, status }`, the same shape N4 `trace-timeline` exports as `TraceSpanRetryOutcome`, so a host already driving N4's `renderDetail(span, retriedBy)` callback can hand `retriedBy` straight through.",
  dos: [
    {
      text: "Always pair a pretty-printed input/output block with a copy control that carries the exact JSON, not a paraphrase.",
      example: <CopyableRawInput />,
    },
    {
      text: "Put cache hit/miss inside the same cost row, not a separate badge somewhere else on the panel.",
      example: <CacheBesideCost />,
    },
    {
      text: "State the retry outcome in visible text on the error tab — what was retried, and whether it worked.",
      example: <ErrorTabWithRetryLineage />,
    },
  ],
  donts: [
    {
      text: "Don't ship a pretty-printed payload with no copy affordance — uncopyable JSON can't go in a bug report, which is the entire point of this tab.",
      example: <UncopyableJsonMockup />,
    },
    {
      text: "Don't put cache status on a row of its own, away from cost — it's the biggest lever on spend and belongs beside the number it moves.",
      example: <CacheAsSeparateBadgeMockup />,
    },
  ],
  accessibility: {
    keyboard: [
      "Three tab stops on the Input and Output tabs, two on Metadata and Error: the tab list is one stop whatever the tab count (roving tabindex), the open panel is a second because Base UI gives it `tabIndex=0`, and the Copy button is a third — present only when there is a payload to copy.",
      "Arrow Left and Right move the highlight along the tab list and wrap at the ends. They do **not** switch the panel: this Base UI version defaults `activateOnFocus` to `false`, so arrowing highlights a tab and Enter or Space activates it. Home and End jump to the first and last tab.",
      "The `pre` holding the JSON scrolls at `max-h-80` and is not focusable, and nothing inside it is either. A payload longer than the box cannot be scrolled from the keyboard — the panel's own tab stop sits outside the scroll container, so it scrolls nothing. Compare `settings-shell`, which puts `tabIndex={0}` on its equivalent `pre` for exactly this reason.",
      "There is no Escape handler and no shortcut for copying. Copy is reachable only by Tab.",
    ],
    screenReader: [
      'The tab list is a real `tablist` named "Run detail" by default (`tabsLabel`), with each panel wired to its tab by Base UI, so a panel announces its section name when entered.',
      'The Error tab changes its own name when there is an error: the visible word "Error" goes `aria-hidden` and an `sr-only` "Error, this run failed" takes over, so the red dot is never the only carrier of that fact. With no error it is plainly "Error".',
      "Metadata is a description list — `Model`, `Latency`, `Tokens in`, `Tokens out`, `Cost` — so each label and value announce as a pair. Cache state rides inside the Cost value rather than as its own term, which is the point of the layout but does mean it is announced as part of the cost row, not as a row of its own.",
      'The Copy button\'s accessible name is pinned by `aria-label` to "Copy input JSON" / "Copy output JSON" and deliberately does not flip to "Copied" — a focused button\'s name change is not reliably re-announced. The trade is that for the 1.5 seconds the visible word reads "Copied", the visible label is no longer contained in the accessible name.',
      "Nothing announces that a copy happened. There is no live region on this control, so the confirmation is sighted-only; if the clipboard write rejects, or `navigator.clipboard` is absent, the button simply never changes and nothing reports the failure.",
      "Switching tabs is silent beyond the panel's own name. The payload itself is plain text in a `pre` with no role, so a large JSON body is read as an undifferentiated run of characters.",
    ],
    focus: [
      "Activating a tab leaves focus on the tab, as it should — the panel swaps beneath it and is reached with the next Tab.",
      "Nothing unmounts a focused control in normal use: the Copy button disappears only if `output` goes from defined to `undefined`, which is a backwards transition for a run.",
      "The tabs and the Copy button ship visible `focus-visible` rings from the vendored primitives. The panel does not: `TabsContent` sets `outline-none` and adds no ring, so the second tab stop in this component is invisible when focused.",
    ],
  },
  pitfalls: [
    "Copying a formatted summary instead of the raw payload. RunInspector's copy control always serializes the actual `input`/`output` value with JSON.stringify(value, null, 2) — never a display-only string a caller constructed separately, which could drift from what's on screen.",
    "Inferring the error tab's retry outcome from `error` alone. A run can have `retriedBy` set with no `error` of its own (it succeeded, but only after a prior attempt failed) — pass the retry props explicitly rather than trying to derive them.",
    "Wiring a vertical tab list through the vendored `ui/tabs.tsx` wrapper and expecting vertical arrow-key navigation or `aria-orientation=\"vertical\"` — that wrapper re-emits `orientation` only as `data-orientation`, so a vertical rail built from it silently keeps horizontal keyboard behavior. RunInspector sidesteps this by staying on the wrapper's horizontal default; a vertical layout needs Base UI's Tabs composed directly.",
    "Building `retriedAttempt` by re-deriving it from a full span list at every render instead of a single lookup by `span.retryOf` — the same one-line cost N4's own `computeRetriedBy` was written to avoid paying repeatedly for the forward direction.",
  ],
};
