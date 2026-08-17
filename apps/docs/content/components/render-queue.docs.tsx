import type { ComponentDocs } from "@/lib/component-docs";
import {
  FailedKeepsItsSpec,
  FailedWithoutContext,
  FilenamesOnly,
  RowsCarryTheirSpec,
} from "./render-queue.examples";

/**
 * Seeded from docs/design-system/component-specs.md#f6-render-queue.
 * Plain data read by a Server Component; examples live in the client sidecar.
 */
export const RenderQueueDocs: ComponentDocs = {
  whatItIs:
    "A table of staged render jobs, each row carrying the output spec it will produce — format, codec, resolution, frame rate — alongside its stage, live progress, price, and the one action that applies to it: cancel while in flight, retry when failed, download when done.",
  whyItMatters:
    "Rendering is the point where a project turns into a bill, and the size of that bill is set by settings a person chose several screens ago. A queue that lists filenames and a spinner cannot be checked before it charges you: there is no way to notice that the export you queued is 4K when you meant 1080p until the money is spent. So the spec is a column, not a tooltip. The same reasoning separates preview from export as a visible stage — a 15-second preview costs almost nothing and an export costs real money, and collapsing the two into one list of \"jobs\" hides the only distinction that matters. Failed rows keep their spec for the same reason: a failure that discards your settings turns a retry into a rebuild.",
  evidence: ["Topaz Video AI", "CapCut export queue", "Descript"],
  anatomy: [
    { slot: "render-queue", note: "The table wrapper." },
    { slot: "render-queue-row", note: "One job. Carries `data-state` for queued, streaming, done or failed." },
    { slot: "render-queue-stage", note: "Preview or Export — different economics, so a visible label." },
    { slot: "render-queue-spec", note: "Format, codec, resolution and fps. Present in every state, failures included." },
    { slot: "render-queue-status", note: "An icon and the state in words, so nothing rests on colour." },
    { slot: "render-queue-progress", note: "Per-row progressbar while rendering." },
    { slot: "render-queue-error", note: "Why a failed row failed." },
    { slot: "render-queue-cost", note: "The price, from the shared formatter. An em-dash when there is none." },
    { slot: "render-queue-retry", note: "Failed rows only, in place." },
    { slot: "render-queue-cancel", note: "Queued and streaming rows only." },
    { slot: "render-queue-download", note: "Done rows only." },
  ],
  usage:
    "Give every job a real `spec` — the parts you omit are simply left out of the summary, so a row with an empty spec silently becomes an unauditable one. Set `stage` honestly: previews and exports belong in the same queue precisely so their costs can be compared. Drive `state` and `progress` from your own polling; the component holds no timers. Supply only the handlers you want offered — omit `onCancel` and no row gets a cancel button — and when you handle `onRetry`, re-queue the existing job rather than creating a new one, so its spec survives.",
  dos: [
    {
      text: "Give every row its full output spec, so the queue can be audited before it bills.",
      example: <RowsCarryTheirSpec />,
    },
    {
      text: "Keep a failed row's spec and error, and offer retry in the row itself.",
      example: <FailedKeepsItsSpec />,
    },
  ],
  donts: [
    {
      text: "Don't list filenames alone — nobody can tell a 720p preview from a 4K export until the charge lands.",
      example: <FilenamesOnly />,
    },
    {
      text: "Don't drop the settings when a job fails; retrying then means rebuilding the job from memory.",
      example: <FailedWithoutContext />,
    },
  ],
  accessibility: {
    keyboard: [
      "At most one tab stop per row, and only when you supply the matching handler: Retry on failed, Cancel on queued and streaming, Download on done. The three are mutually exclusive by state, so a ten-job queue is somewhere between zero and ten stops.",
      "Because the control is chosen by state, the tab order rearranges itself underneath a keyboard user as jobs progress — a row that had Cancel loses it and gains Download the moment it finishes.",
      "Every control is a real button, so Space and Enter both activate. There is no Escape to cancel, no Delete on a row, and no keyboard route to `downloadUrl`: the component never navigates to it, `onDownload` just fires with the id.",
      "The table has no sortable columns, no row selection and no arrow-key navigation. The header is six plain cells and none of them is focusable.",
    ],
    screenReader: [
      "The table has no `<caption>` and no `aria-label`, so it announces as an unnamed table. J5 `record-list` names its own through an sr-only caption; this one does not, so two queues on one page are indistinguishable in a screen reader's table list.",
      "The columns are Job, Stage, Output, Status, Cost and an sr-only \"Actions\", so in table mode a spec cell is announced as \"Output, MP4 · H.264 · 3840×2160 · 24 fps\" — the separator and the `×` come through as whatever the AT makes of them.",
      "Status is an `aria-hidden` icon plus the state in words, and the stage is a text badge, so neither rests on colour.",
      "The progress bar is a real `progressbar` named \"<job> progress\" by an sr-only label, with a value when you pass `progress` and indeterminate when you do not. A progressbar is not a live region, so its value is silent until the user navigates to it — the right default when there are ten of them.",
      "There is no live region anywhere in the component. A job moving from Rendering to Done or Failed announces nothing, and the row's only button changes from Cancel to Download in silence.",
      "A job with no cost renders a bare em-dash as real text, so it is announced as whatever the AT calls that character rather than hidden behind an sr-only \"No cost\" — which is how J5 handles its empty apps cell. An empty `spec` object announces as a blank cell for the same reason.",
      "`jobs={[]}` renders the header row and nothing else. There is no empty state and no announcement that the queue is empty.",
    ],
    focus: [
      "A finishing job unmounts its Cancel button and mounts Download in its place. If focus was on Cancel it falls to `<body>` and the next Tab restarts at the top of the page — and this fires on your polling interval rather than on a keypress, which makes it the hardest version of this bug to notice.",
      "Retrying does the same in reverse: the Retry button is replaced by Cancel as the job re-enters flight. Nothing here restores focus, so move it in your handler if your poll is fast enough to matter.",
      "All three controls are the shared `Button` and carry a visible focus ring.",
    ],
  },
  pitfalls: [
    "Cancel appears only on queued and streaming rows, so a resolved job can never be cancelled by accident — but that is enforced here, not in your handler. A cancel button you add elsewhere has no such protection.",
    "`downloadUrl` is carried on the job but the component does not navigate to it; `onDownload` fires with the id and the choice of how to deliver the file stays yours.",
    "An empty `spec` object renders an empty cell rather than an error. That is deliberate for audio jobs with nothing but a format, and it is also exactly what an unaudited queue looks like — check it is intentional.",
    "Progress is only rendered while `state` is `streaming`; setting `progress` on a queued row does nothing, which usually means the state was not advanced.",
    "The cost column uses the shared `formatCost`, so a row here and a run button elsewhere cannot quote different numbers for the same job — provided both are handed the same `Cost`.",
  ],
};
