"use client";

import { Clapperboard, Film } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";
import { EmptyState } from "@/registry/super-ai/empty-state";
import { ModalityRail, type ModalityRailItemData } from "@/registry/super-ai/modality-rail";
import { PropertyInspector, type PropertyInspectorProps } from "@/registry/super-ai/property-inspector";
import { RenderQueue, type RenderJob } from "@/registry/super-ai/render-queue";
import { TimeRuler, TimeRulerPlayhead } from "@/registry/super-ai/time-ruler";
import { ToolPanel, type ToolPanelProps, type ToolPanelSection } from "@/registry/super-ai/tool-panel";
import { TrackLane, type TrackLaneProps } from "@/registry/super-ai/track-lane";
import {
  TranscriptEditor,
  type TranscriptEditorProps,
  type TranscriptSegment,
  type TranscriptSpeaker,
} from "@/registry/super-ai/transcript-editor";
import { TransportControls, type TransportControlsProps } from "@/registry/super-ai/transport-controls";

/**
 * Timeline Shell — timeline-dominant editor, a variant of O3 `studio-shell`
 *
 * Spec: docs/design-system/block-specs.md#o4-timeline-shell
 * Regions: rail · content-panel · preview · inspector · transport · tracks-ruler
 *
 * O4 is not a second editor. It is O3 with the bottom dock swapped: the same
 * rail → panel → stage → inspector skeleton, and where O3 puts a page strip
 * this puts a time ruler with a stack of tracks. Everything else about the two
 * should read the same way, which is why the rail, the panel and the inspector
 * take the same shape of props here as they do there.
 *
 * Four sentences from the spec drive the layout:
 *
 * 1. "Same regions as O3, but the bottom dock is a time ruler with tracks
 *    instead of a page strip. One shell, one variant flag." The flag is
 *    `variant`, and it changes exactly one region — `tracks-ruler`. Nothing
 *    else in the shell branches on it.
 * 2. "The transcript variant (H4) replaces the track stack entirely — both are
 *    views of the same edit-decision list." So the transcript is not a second
 *    dock beside the tracks; it is what the dock renders instead. And because
 *    the two are views of one list, both are wired to the *same* `currentTime`
 *    and the same `onSeek`: clicking a word in H4 moves the playhead the ruler
 *    draws.
 * 3. "Export is staged through F6: a cheap preview render precedes the
 *    expensive full export." F6 is mounted under the stage inside the `preview`
 *    region, always, so the two stages of a render are visible next to the
 *    thing they render. See the docs page for why it is there and not in the
 *    inspector.
 * 4. From O3, which O4 inherits: "The rail selects which tool panel is shown.
 *    It never changes the canvas." `onRailSelect` is forwarded and nothing
 *    else; the shell never re-derives the stage from it. And "the inspector is
 *    selection-driven and must ship an empty state" — I2 brings its own, so
 *    the shell does not fake one.
 *
 * There is deliberately **no topbar**. O3 gained one in the 2026-08-08 wireframe
 * reconciliation; O4's `Regions:` line and its `Filled by:` list were not
 * changed with it and name no B7. The manifest is the contract, so this shell
 * renders the six regions it declares and no seventh. See the report/docs.
 */

/**
 * H3's lane gutter is a fixed `w-40`, and the lane root draws a 1px border
 * outside it, so a lane's clip area starts exactly 10rem + 1px from the lane's
 * left edge. The ruler has no gutter of its own, so it is inset by that same
 * amount — otherwise second 0 on the ruler sits a gutter's width away from
 * second 0 in every lane, and the whole dock lies about where things are.
 *
 * Delete this the moment H3 exposes its gutter width (or a shared timeline
 * scroll context) rather than hardcoding it.
 */
const LANE_GUTTER = "w-[calc(10rem+1px)]";
/** Same offset, expressed as a left inset for the playhead overlay. */
const PLAYHEAD_INSET = "left-[calc(10rem+1px)]";

type TimelineShellVariant = "tracks" | "transcript";

/**
 * One lane. Everything H3 owns stays H3's — including `muted`, `soloed`,
 * `locked` and their handlers — and the shell only takes over the three props
 * that have to agree across the whole dock (scale, selection, trimming).
 */
interface TimelineShellTrack extends Omit<
  TrackLaneProps,
  "duration" | "pixelsPerSecond" | "selectedClipId" | "onSelectClip" | "onTrimClip"
> {
  id: string;
}

interface TimelineShellProps extends Omit<React.ComponentProps<"div">, "onSelect"> {
  /** Which dock the shell shows. The one variant flag; it changes one region. */
  variant?: TimelineShellVariant;

  /** B4 tools. Same prop shape as O3 — the rail is an invariant of both shells. */
  railItems?: ModalityRailItemData[];
  /** B4's pinned group: settings, help. Never merged into `railItems`. */
  railPinned?: ModalityRailItemData[];
  activeRailId?: string;
  /** Switches the panel. It must never be wired to the stage — see the docblock. */
  onRailSelect?: (id: string) => void;

  /**
   * I1, the content panel beside the stage. Forwarded whole; `sections`
   * defaults to empty so a panel with nothing in it falls to L1 rather than
   * disappearing.
   */
  panel?: Omit<ToolPanelProps, "sections"> & { sections?: ToolPanelSection[] };

  /** The player surface — a `<video>`, a canvas, a compare viewer. */
  preview?: React.ReactNode;
  /** Replaces the default L1 shown when there is nothing to play. */
  previewEmpty?: React.ReactNode;
  previewLabel?: string;

  /** F6 export jobs, preview stage and export stage in the one queue. */
  renderJobs?: RenderJob[];
  onRetryJob?: (id: string) => void;
  onCancelJob?: (id: string) => void;
  onDownloadJob?: (id: string) => void;
  renderQueueLabel?: string;
  /** Replaces the default L1 shown when nothing has been queued. */
  renderQueueEmpty?: React.ReactNode;

  /** I2. Selection-driven, and it brings its own empty state. */
  inspector?: PropertyInspectorProps;
  inspectorLabel?: string;

  /**
   * H1. The shell owns the clock — `currentTime`, `duration`, `onSeek` and the
   * in/out range are shared with H2, so they are shell props rather than
   * transport props and cannot drift apart.
   */
  transport?: Omit<TransportControlsProps, "currentTime" | "duration" | "onSeek" | "inPoint" | "outPoint">;

  /** Total length in seconds. The ruler and every lane measure against it. */
  duration?: number;
  /** Playhead, in seconds. Controlled — the host owns the player. */
  currentTime?: number;
  onSeek?: (seconds: number) => void;
  /**
   * Pixels per second. The single number the ruler and every lane share: pass
   * it to one and not the other and a clip stops sitting under its own
   * timecode.
   */
  zoom?: number;
  /** Snap increment in seconds — a frame, a beat, a second. */
  snap?: number;
  inPoint?: number;
  outPoint?: number;
  onRangeChange?: (range: { in: number; out: number }) => void;

  /** H3 lanes, top to bottom. Empty renders L1 in the dock. */
  tracks?: TimelineShellTrack[];
  selectedClipId?: string | null;
  onSelectClip?: (clipId: string) => void;
  onTrimClip?: (clipId: string, edge: "start" | "end", delta: number) => void;
  tracksEmpty?: React.ReactNode;
  tracksLabel?: string;

  /**
   * H4, for `variant="transcript"`. Its `currentTime` and `onSeek` are supplied
   * by the shell, because the transcript and the timeline are two views of one
   * edit-decision list and must never disagree about where the playhead is.
   */
  transcript?: Omit<TranscriptEditorProps, "currentTime" | "onSeek" | "segments" | "speakers"> & {
    segments?: TranscriptSegment[];
    speakers?: TranscriptSpeaker[];
  };
  transcriptLabel?: string;
}

function TimelineShell({
  variant = "tracks",

  railItems = [],
  railPinned,
  activeRailId,
  onRailSelect,

  panel,

  preview,
  previewEmpty,
  previewLabel = "Preview",

  renderJobs = [],
  onRetryJob,
  onCancelJob,
  onDownloadJob,
  renderQueueLabel = "Render queue",
  renderQueueEmpty,

  inspector,
  inspectorLabel = "Inspector",

  transport,
  duration = 0,
  currentTime = 0,
  onSeek,
  zoom = 40,
  snap,
  inPoint,
  outPoint,
  onRangeChange,

  tracks = [],
  selectedClipId,
  onSelectClip,
  onTrimClip,
  tracksEmpty,
  tracksLabel = "Timeline tracks",

  transcript,
  transcriptLabel = "Transcript",

  className,
  ...props
}: TimelineShellProps) {
  const queueLabelId = React.useId();
  const { sections: panelSections = [], ...panelRest } = panel ?? {};
  const {
    segments: transcriptSegments = [],
    speakers: transcriptSpeakers = [],
    ...transcriptRest
  } = transcript ?? {};

  return (
    <div
      data-slot="timeline-shell"
      data-variant={variant}
      className={cn("bg-background text-foreground flex h-full min-h-0 w-full overflow-hidden", className)}
      {...props}
    >
      {/* B4 carries the region marker itself. `data-region` on a composed
          component is house idiom (a `data-slot` would not be), and putting it
          here rather than on a wrapper means the assertion that the region
          exists and the assertion that B4 fills it are the same element. */}
      <ModalityRail
        data-region="rail"
        items={railItems}
        pinned={railPinned}
        activeId={activeRailId}
        onSelect={onRailSelect}
        className="h-full"
      />

      <div data-region="content-panel" className="hidden w-72 shrink-0 p-2 md:block">
        <ToolPanel
          label="Tools"
          empty={
            <EmptyState
              size="panel"
              title="Nothing in this tool"
              description="Pick another tool from the rail, or search for what you need."
            />
          }
          {...panelRest}
          sections={panelSections}
          className={cn("h-full", panelRest.className)}
        />
      </div>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div data-region="preview" className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden p-2">
          {/* The stage. A slot, not a component: no catalog component owns
              "the thing being edited", and O3's canvas region is the same
              shape. L1 stands in until the caller has something to play. */}
          <div
            data-slot="timeline-shell-stage"
            // Named, because "the thing you are looking at" and "the queue that
            // renders it" are two surfaces stacked in one region and only one
            // of them has a heading of its own.
            role="group"
            aria-label={previewLabel}
            className="bg-card flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-lg border"
          >
            {preview ?? previewEmpty ?? (
              <EmptyState
                size="page"
                title="Nothing on the timeline yet"
                description="Add a clip from the panel on the left, and it will play here."
                icon={<Film />}
              />
            )}
          </div>

          {/* F6 under the stage, always mounted: a preview render and a full
              export are two stages of one job, and both produce what plays
              above. Scrollable, so it is focusable and named. */}
          <section
            data-slot="timeline-shell-render-queue"
            aria-labelledby={queueLabelId}
            tabIndex={0}
            className="focus-visible:ring-ring max-h-44 shrink-0 overflow-y-auto rounded-lg border p-2 focus-visible:ring-2 focus-visible:outline-none"
          >
            <h2 id={queueLabelId} className="px-1 text-sm font-medium">
              {renderQueueLabel}
            </h2>
            {renderJobs.length > 0 ? (
              <RenderQueue
                jobs={renderJobs}
                onRetry={onRetryJob}
                onCancel={onCancelJob}
                onDownload={onDownloadJob}
              />
            ) : (
              (renderQueueEmpty ?? (
                <EmptyState
                  size="panel"
                  title="Nothing queued"
                  description="Render a preview first — it costs a fraction of a full export."
                  icon={<Clapperboard />}
                />
              ))
            )}
          </section>
        </div>

        <div
          data-region="transport"
          className="bg-background flex shrink-0 items-center gap-2 border-t px-2 py-1.5"
        >
          <TransportControls
            currentTime={currentTime}
            duration={duration}
            onSeek={onSeek}
            inPoint={inPoint ?? null}
            outPoint={outPoint ?? null}
            {...transport}
            // cn last: a bare className after the spread would swallow a
            // caller's `transport.className`.
            className={cn("min-w-0", transport?.className)}
          />
        </div>

        <div data-region="tracks-ruler" className="bg-background shrink-0 border-t">
          {variant === "transcript" ? (
            // "The transcript variant replaces the track stack entirely." The
            // ruler goes with it — a ruler with no lanes beneath it labels
            // nothing — but the region stays mounted either way.
            <div
              data-slot="timeline-shell-transcript"
              role="group"
              aria-label={transcriptLabel}
              tabIndex={0}
              className="focus-visible:ring-ring max-h-64 overflow-y-auto p-2 focus-visible:ring-2 focus-visible:outline-none"
            >
              <TranscriptEditor
                segments={transcriptSegments}
                speakers={transcriptSpeakers}
                currentTime={currentTime}
                onSeek={(time) => onSeek?.(time)}
                {...transcriptRest}
                className={cn("border-0 p-0", transcriptRest.className)}
              />
            </div>
          ) : (
            <div
              data-slot="timeline-shell-tracks"
              role="group"
              aria-label={tracksLabel}
              tabIndex={0}
              className="focus-visible:ring-ring relative flex max-h-64 flex-col gap-1 overflow-y-auto p-2 focus-visible:ring-2 focus-visible:outline-none"
            >
              <div className="flex items-end">
                {/* Aligns second 0 on the ruler with second 0 in every lane. */}
                <div aria-hidden="true" className={cn("shrink-0", LANE_GUTTER)} />
                <div className="min-w-0 flex-1 overflow-hidden">
                  <TimeRuler
                    duration={duration}
                    zoom={zoom}
                    playhead={currentTime}
                    onPlayheadChange={onSeek}
                    snap={snap}
                    inPoint={inPoint}
                    outPoint={outPoint}
                    onRangeChange={onRangeChange}
                  />
                </div>
              </div>

              {tracks.length > 0
                ? tracks.map(({ id, ...track }) => (
                    <TrackLane
                      key={id}
                      id={id}
                      duration={duration}
                      pixelsPerSecond={zoom}
                      selectedClipId={selectedClipId}
                      onSelectClip={onSelectClip}
                      onTrimClip={onTrimClip}
                      {...track}
                    />
                  ))
                : (tracksEmpty ?? (
                    <EmptyState
                      size="panel"
                      title="No tracks yet"
                      description="Drop a clip here, or add one from the panel, to start the edit."
                    />
                  ))}

              {/* H2 exports the playhead on its own precisely so a shell can do
                  this: "the playhead spans every track" is not something the
                  ruler can do from inside its own box. Same `time` and `zoom`
                  the ruler took, so the two can never disagree. */}
              <div
                aria-hidden="true"
                className={cn("pointer-events-none absolute inset-y-2 right-2", PLAYHEAD_INSET)}
              >
                <TimeRulerPlayhead time={currentTime} zoom={zoom} />
              </div>
            </div>
          )}
        </div>
      </div>

      <div
        data-region="inspector"
        role="group"
        aria-label={inspectorLabel}
        tabIndex={0}
        className="focus-visible:ring-ring hidden w-80 shrink-0 overflow-y-auto border-l p-3 focus-visible:ring-2 focus-visible:outline-none lg:block"
      >
        <PropertyInspector {...inspector} />
      </div>
    </div>
  );
}

export { TimelineShell };
export type { TimelineShellProps, TimelineShellTrack, TimelineShellVariant };
