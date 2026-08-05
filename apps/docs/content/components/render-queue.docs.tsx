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
  pitfalls: [
    "Cancel appears only on queued and streaming rows, so a resolved job can never be cancelled by accident — but that is enforced here, not in your handler. A cancel button you add elsewhere has no such protection.",
    "`downloadUrl` is carried on the job but the component does not navigate to it; `onDownload` fires with the id and the choice of how to deliver the file stays yours.",
    "An empty `spec` object renders an empty cell rather than an error. That is deliberate for audio jobs with nothing but a format, and it is also exactly what an unaudited queue looks like — check it is intentional.",
    "Progress is only rendered while `state` is `streaming`; setting `progress` on a queued row does nothing, which usually means the state was not advanced.",
    "The cost column uses the shared `formatCost`, so a row here and a run button elsewhere cannot quote different numbers for the same job — provided both are handed the same `Cost`.",
  ],
};
