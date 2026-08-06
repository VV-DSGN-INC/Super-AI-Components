"use client";

import { Pause, Play } from "lucide-react";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { PreviewTile } from "@/registry/super-ai/preview-tile";

/**
 * Track List — music library rows.
 *
 * Spec: docs/design-system/component-specs.md#j7-track-list
 * States: artwork · tags · inline-waveform · bpm · musical-key · sparse-metadata
 *
 * Restored per gaps.md R5 — a recovered consolidation error, not a board
 * sample. No per-product screenshots were ever collected for it, which is why
 * the docs module ships `evidence: []` (the E9/E10 precedent) rather than
 * inventing products.
 *
 * Four rules do the work:
 *
 * 1. **BPM and key are the point, not decoration.** J1 `asset-library` carries
 *    generic metadata and cannot express either; for music those two fields are
 *    the facets people actually sort and filter by. They are columns here, and
 *    BPM is right-aligned and tabular so two rows can be compared without
 *    reading.
 * 2. **It is a table because the columns are comparable.** Family J is
 *    otherwise grid-shaped; a card grid hides the numbers you came to compare,
 *    so the row is the unit here.
 * 3. **The inline waveform is an audition affordance, not artwork.** Playing a
 *    row must not navigate away from the list, or comparing three takes costs
 *    three round trips. Playback is in-place state: this component owns no
 *    `<audio>` element and no timer — it takes `playingId`/`progress` and emits
 *    `onPlayToggle`. Whatever is actually sounding is yours.
 * 4. **Artwork, tags, BPM and key are all optional per row.** A generated stem
 *    has no cover art and a spoken clip has no key. Missing values render as an
 *    em-dash paired with an sr-only "Not set" — never a zero, never a blank.
 *
 * Accessibility: no nested interactives. A row that contains a play button
 * cannot itself be a button, so opening a track is a sibling control on the
 * title, and every play control is named for its track ("Play Midnight Drive")
 * rather than being the Nth bare "Play" on the page.
 */

interface Track {
  id: string;
  /** Used verbatim in every accessible name on the row ("Play Midnight Drive"). */
  title: string;
  artist?: string;
  /** Cover art — supply your own `<img alt="" />`. Absent art is a real state. */
  artwork?: React.ReactNode;
  tags?: string[];
  /**
   * Normalised amplitudes, 0–1, one per bar. Absent peaks render a flat strip:
   * a track can still be auditioned before it has been analysed.
   */
  peaks?: number[];
  bpm?: number;
  /** "F minor", "9A" — free text, because notation conventions differ. */
  musicalKey?: string;
}

interface TrackListProps extends Omit<React.ComponentProps<"div">, "onSelect"> {
  tracks: Track[];
  /** Accessible name for the table. */
  label?: string;
  /** The track currently sounding. In-place state — nothing here navigates. */
  playingId?: string | null;
  /** 0–100 playhead within the playing track. Drives the waveform fill only. */
  progress?: number;
  /** `playing` is the state being asked for, already toggled. */
  onPlayToggle?: (trackId: string, playing: boolean) => void;
  /** Opening a track. A separate control from play, and never the row itself. */
  onSelect?: (trackId: string) => void;
}

/**
 * A value that is absent on purpose. An em-dash on its own announces as
 * nothing useful, and an sr-only suffix would fuse with adjacent visible text,
 * so the visible half is hidden from the accessibility tree and the words are
 * carried separately.
 */
function NotSet() {
  return (
    <span data-slot="track-list-unset">
      <span aria-hidden="true">—</span>
      <span className="sr-only">Not set</span>
    </span>
  );
}

/**
 * Row-height audition strip. Deliberately not H6 `waveform-editor`: that is a
 * full editor with selection, zoom and regions, and this is a preview you scan
 * at 24px. Decorative — the play control carries the meaning.
 */
function InlineWaveform({ peaks, played }: { peaks?: number[]; played: number }) {
  if (!peaks?.length) {
    return (
      <span
        data-slot="track-list-waveform"
        data-peaks="none"
        aria-hidden="true"
        className="bg-foreground/15 block h-6 w-32 rounded-full"
      />
    );
  }
  return (
    <span data-slot="track-list-waveform" aria-hidden="true" className="flex h-6 w-32 items-center gap-px">
      {peaks.map((peak, index) => (
        <span
          key={index}
          data-slot="track-list-waveform-bar"
          className={cn(
            "min-h-0.5 flex-1 rounded-full",
            (index + 1) / peaks.length <= played ? "bg-primary" : "bg-foreground/25",
          )}
          style={{ height: `${Math.max(6, Math.min(100, peak * 100))}%` }}
        />
      ))}
    </span>
  );
}

function TrackList({
  tracks,
  label = "Tracks",
  playingId = null,
  progress,
  onPlayToggle,
  onSelect,
  className,
  ...props
}: TrackListProps) {
  return (
    <div data-slot="track-list" className={cn("w-full", className)} {...props}>
      <Table aria-label={label}>
        <TableHeader>
          <TableRow>
            <TableHead scope="col">
              <span className="sr-only">Artwork</span>
            </TableHead>
            <TableHead scope="col">Track</TableHead>
            <TableHead scope="col">Tags</TableHead>
            <TableHead scope="col">Preview</TableHead>
            {/* Right-aligned so two tempos line up digit for digit. That
                comparability is the whole argument for a table. */}
            <TableHead scope="col" className="text-right">
              BPM
            </TableHead>
            <TableHead scope="col">Key</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tracks.map((track) => {
            const playing = playingId === track.id;
            const played = playing ? Math.max(0, Math.min(100, progress ?? 0)) / 100 : 0;
            return (
              <TableRow
                key={track.id}
                data-slot="track-list-row"
                data-state={playing ? "playing" : "idle"}
                className="data-[state=playing]:bg-muted/50"
              >
                <TableCell data-slot="track-list-artwork" className="w-12">
                  <PreviewTile aspect="square" labelPlacement="none" className="w-10">
                    {track.artwork ?? (
                      <span className="text-foreground flex size-full items-center justify-center text-xs">
                        <NotSet />
                      </span>
                    )}
                  </PreviewTile>
                </TableCell>

                <TableCell>
                  <div className="flex flex-col items-start gap-0.5">
                    {onSelect ? (
                      // A sibling of the play button, never a wrapper around it:
                      // a row containing a control cannot itself be a control.
                      <Button
                        data-slot="track-list-title"
                        type="button"
                        variant="link"
                        size="sm"
                        className="text-foreground h-auto p-0 font-medium"
                        onClick={() => onSelect(track.id)}
                      >
                        {track.title}
                      </Button>
                    ) : (
                      <span data-slot="track-list-title" className="text-foreground font-medium">
                        {track.title}
                      </span>
                    )}
                    {track.artist ? (
                      <span data-slot="track-list-artist" className="text-foreground/70 text-xs">
                        {track.artist}
                      </span>
                    ) : null}
                  </div>
                </TableCell>

                <TableCell data-slot="track-list-tags">
                  {track.tags?.length ? (
                    <span className="flex flex-wrap items-center gap-1">
                      {track.tags.map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </span>
                  ) : (
                    <NotSet />
                  )}
                </TableCell>

                <TableCell>
                  <div className="flex items-center gap-2">
                    {onPlayToggle ? (
                      <Button
                        data-slot="track-list-play"
                        type="button"
                        size="icon-sm"
                        variant="ghost"
                        // Named for its track, and the icon changes shape as
                        // well as the label — the state never rests on colour.
                        aria-label={playing ? `Pause ${track.title}` : `Play ${track.title}`}
                        onClick={() => onPlayToggle(track.id, !playing)}
                      >
                        {playing ? <Pause aria-hidden /> : <Play aria-hidden />}
                      </Button>
                    ) : null}
                    <InlineWaveform peaks={track.peaks} played={played} />
                  </div>
                </TableCell>

                <TableCell data-slot="track-list-bpm" className="text-foreground text-right tabular-nums">
                  {typeof track.bpm === "number" ? track.bpm : <NotSet />}
                </TableCell>

                <TableCell data-slot="track-list-key" className="text-foreground">
                  {track.musicalKey ? track.musicalKey : <NotSet />}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

export { TrackList };
export type { Track, TrackListProps };
