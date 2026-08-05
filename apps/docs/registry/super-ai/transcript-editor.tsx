"use client";

import {
  AudioLines,
  Film,
  Image as ImageIcon,
  type LucideIcon,
  Music,
  RotateCcw,
  Trash2,
} from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * Transcript Editor — edit media by editing text.
 *
 * Spec: docs/design-system/component-specs.md#h4-transcript-editor
 * States: word-select · speaker-labels · media-chips · strikethrough
 *
 * Three rules from the spec do the work:
 *
 * 1. "The transcript is a view of the same edit-decision list the timeline
 *    renders. Editing either updates the other." So this component owns *no*
 *    transcript state. Words and media arrive as tokens with ids and timings,
 *    selection is controlled, and every mutation leaves as an `onEdit` against
 *    the shared EDL. Whatever owns the list applies the edit, and the timeline
 *    and the transcript re-render from the same source. The reverse direction
 *    is `currentTime` in and `onSeek` out — the playhead marks the current
 *    token, and activating a token seeks the timeline to it.
 * 2. "Deleted words are struck through before removal, so a destructive edit is
 *    visible and reversible." `deleted` is a flag *on a token*, never a splice
 *    out of the array. A struck word stays in the DOM, stays reachable, and
 *    stays announced — its accessible name gains ", deleted" so the state is
 *    not carried by the line alone.
 * 3. "Speaker labels are editable and drive diarisation corrections." Renaming
 *    emits `{ type: "rename-speaker", speakerId, name }`. It carries the
 *    speaker id, not the segment id, so the host can apply one correction to
 *    every segment that speaker owns — which is the whole point of fixing
 *    diarisation from the transcript.
 *
 * Selection is a listbox, not a field of buttons. A transcript is hundreds of
 * words; one tab stop per word is unusable, so each segment is a
 * multi-selectable listbox with roving tabindex, arrow-key movement and
 * shift-extension. `aria-selected` means selection survives without colour.
 */

type TranscriptMediaKind = "image" | "video" | "audio" | "music";

interface TranscriptTokenBase {
  id: string;
  /** Seconds into the timeline. The same numbers the timeline lays out. */
  start: number;
  end: number;
  /**
   * Struck through, not gone. Deletion is a state on the token so the edit is
   * visible and reversible; removal from the list is a separate, later step
   * the host takes when it renders the final cut.
   */
  deleted?: boolean;
}

interface TranscriptWord extends TranscriptTokenBase {
  kind: "word";
  text: string;
}

interface TranscriptMedia extends TranscriptTokenBase {
  kind: "media";
  media: TranscriptMediaKind;
  /** Names the insert; becomes part of the chip's accessible name. */
  label: string;
}

/** A word or an inline media insert. Both are cuttable, so both are tokens. */
type TranscriptToken = TranscriptWord | TranscriptMedia;

interface TranscriptSegment {
  id: string;
  /** Points at a `TranscriptSpeaker`; a speaker may own many segments. */
  speakerId: string;
  tokens: TranscriptToken[];
}

interface TranscriptSpeaker {
  id: string;
  name: string;
}

/** Every mutation this component can express, as edits against the EDL. */
type TranscriptEdit =
  | { type: "delete"; tokenIds: string[] }
  | { type: "restore"; tokenIds: string[] }
  | { type: "rename-speaker"; speakerId: string; name: string };

interface TranscriptEditorProps extends React.ComponentProps<"div"> {
  segments: TranscriptSegment[];
  speakers: TranscriptSpeaker[];
  /** Controlled. Token ids; a run is a contiguous slice of the flow. */
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  /** The single edit channel. Nothing mutates locally. */
  onEdit?: (edit: TranscriptEdit) => void;
  /** Timeline playhead, in seconds. Marks the token it falls inside. */
  currentTime?: number;
  /** Activating a token seeks the timeline — the transcript drives playback. */
  onSeek?: (time: number, tokenId: string) => void;
  /** Set false where diarisation is locked (a published transcript, say). */
  editableSpeakers?: boolean;
}

const MEDIA: Record<TranscriptMediaKind, { icon: LucideIcon; noun: string }> = {
  image: { icon: ImageIcon, noun: "Image" },
  video: { icon: Film, noun: "Video" },
  audio: { icon: AudioLines, noun: "Audio" },
  music: { icon: Music, noun: "Music" },
};

function formatTimecode(seconds: number) {
  const total = Math.max(0, Math.floor(seconds));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

function TranscriptEditor({
  segments,
  speakers,
  selectedIds = [],
  onSelectionChange,
  onEdit,
  currentTime,
  onSeek,
  editableSpeakers = true,
  className,
  ...props
}: TranscriptEditorProps) {
  const rootRef = React.useRef<HTMLDivElement>(null);
  /**
   * Where a shift-extension measures from. Not transcript state — it is the
   * caret, and it never leaves this component.
   */
  const anchorRef = React.useRef<string | null>(null);

  const tokens = React.useMemo(() => segments.flatMap((s) => s.tokens), [segments]);
  const order = React.useMemo(() => tokens.map((t) => t.id), [tokens]);
  const selected = React.useMemo(() => new Set(selectedIds), [selectedIds]);

  const selectedTokens = tokens.filter((t) => selected.has(t.id));
  const strikeable = selectedTokens.filter((t) => !t.deleted).map((t) => t.id);
  const restorable = selectedTokens.filter((t) => t.deleted).map((t) => t.id);
  const deletedCount = tokens.filter((t) => t.deleted).length;

  const currentId =
    currentTime == null
      ? null
      : (tokens.find((t) => currentTime >= t.start && currentTime < t.end)?.id ?? null);

  const status = [
    selectedIds.length === 0 ? "Nothing selected" : `${selectedIds.length} selected`,
    deletedCount > 0 ? `${deletedCount} struck through, still restorable` : null,
  ]
    .filter(Boolean)
    .join(". ");

  function rangeBetween(from: string, to: string) {
    const a = order.indexOf(from);
    const b = order.indexOf(to);
    if (a < 0 || b < 0) return [to];
    return order.slice(Math.min(a, b), Math.max(a, b) + 1);
  }

  function focusToken(id: string) {
    rootRef.current?.querySelector<HTMLElement>(`[data-token-id="${id}"]`)?.focus();
  }

  function activate(token: TranscriptToken, extend: boolean) {
    if (extend && anchorRef.current) {
      onSelectionChange?.(rangeBetween(anchorRef.current, token.id));
    } else {
      anchorRef.current = token.id;
      onSelectionChange?.([token.id]);
    }
    // The transcript is a transport control as much as an editor.
    onSeek?.(token.start, token.id);
  }

  function handleKeyDown(event: React.KeyboardEvent, token: TranscriptToken) {
    const index = order.indexOf(token.id);

    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      const next = tokens[index + (event.key === "ArrowRight" ? 1 : -1)];
      if (!next) return;
      event.preventDefault();
      if (event.shiftKey) {
        const anchor = anchorRef.current ?? token.id;
        anchorRef.current = anchor;
        onSelectionChange?.(rangeBetween(anchor, next.id));
      } else {
        anchorRef.current = next.id;
        onSelectionChange?.([next.id]);
        onSeek?.(next.start, next.id);
      }
      focusToken(next.id);
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      activate(token, event.shiftKey);
      return;
    }

    if (event.key === "Backspace" || event.key === "Delete") {
      // Keyboard parity with the toolbar. Deleting strikes through rather than
      // removing, so this key is safe to press.
      const targets = (selected.has(token.id) ? selectedTokens : [token]).filter((t) => !t.deleted);
      if (targets.length === 0) return;
      event.preventDefault();
      onEdit?.({ type: "delete", tokenIds: targets.map((t) => t.id) });
    }
  }

  return (
    <div
      ref={rootRef}
      data-slot="transcript-editor"
      className={cn("bg-background flex flex-col gap-3 rounded-lg border p-3", className)}
      {...props}
    >
      <div data-slot="transcript-editor-toolbar" className="flex flex-wrap items-center gap-2 border-b pb-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={strikeable.length === 0}
          onClick={() => onEdit?.({ type: "delete", tokenIds: strikeable })}
        >
          <Trash2 aria-hidden />
          Delete
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={restorable.length === 0}
          onClick={() => onEdit?.({ type: "restore", tokenIds: restorable })}
        >
          <RotateCcw aria-hidden />
          Restore
        </Button>
        {/* Selection and pending deletions are announced, not just drawn. */}
        <p data-slot="transcript-editor-status" role="status" className="text-foreground ml-auto text-xs">
          {status}
        </p>
      </div>

      {segments.map((segment) => {
        const name = speakers.find((s) => s.id === segment.speakerId)?.name ?? "Unknown speaker";
        const segmentStart = segment.tokens[0]?.start ?? 0;
        // One tab stop per segment: the first selected token, else the first.
        const rovingId = segment.tokens.find((t) => selected.has(t.id))?.id ?? segment.tokens[0]?.id;

        return (
          <div
            key={segment.id}
            data-slot="transcript-editor-segment"
            data-speaker-id={segment.speakerId}
            className="flex flex-col gap-1"
          >
            <div data-slot="transcript-editor-speaker" className="flex items-center gap-2">
              {editableSpeakers ? (
                <Input
                  value={name}
                  // Unique per segment, so two segments by the same speaker are
                  // separately addressable — and both still emit the speaker
                  // id, so one correction fixes every segment.
                  aria-label={`Speaker name at ${formatTimecode(segmentStart)}`}
                  onChange={(event) =>
                    onEdit?.({
                      type: "rename-speaker",
                      speakerId: segment.speakerId,
                      name: event.target.value,
                    })
                  }
                  className="h-7 w-44 text-sm font-medium"
                />
              ) : (
                <span className="text-foreground text-sm font-medium">{name}</span>
              )}
              <span
                data-slot="transcript-editor-timecode"
                className="text-muted-foreground text-xs tabular-nums"
              >
                {formatTimecode(segmentStart)}
              </span>
            </div>

            <div
              data-slot="transcript-editor-text"
              role="listbox"
              aria-multiselectable={true}
              aria-label={`Transcript, ${name}`}
              className="text-foreground flex flex-wrap items-baseline gap-x-1 gap-y-1 text-sm leading-7"
            >
              {segment.tokens.map((token) => {
                const isSelected = selected.has(token.id);
                const isCurrent = token.id === currentId;
                // The struck-through state is spelled into the accessible name
                // rather than left to the line, which sighted users get and
                // nobody else does. Name-from-contents would concatenate an
                // sr-only suffix without a separator ("cut(deleted)"), so the
                // name is set explicitly — and always contains the visible
                // text, so speech input still matches.
                const label =
                  token.kind === "media"
                    ? `${MEDIA[token.media].noun}: ${token.label}${token.deleted ? ", deleted" : ""}`
                    : token.deleted
                      ? `${token.text}, deleted`
                      : undefined;
                const shared = {
                  "data-token-id": token.id,
                  "data-deleted": token.deleted ? "true" : undefined,
                  role: "option",
                  "aria-label": label,
                  "aria-selected": isSelected,
                  "aria-current": isCurrent ? ("true" as const) : undefined,
                  tabIndex: token.id === rovingId ? 0 : -1,
                  onClick: (event: React.MouseEvent) => activate(token, event.shiftKey),
                  onKeyDown: (event: React.KeyboardEvent) => handleKeyDown(event, token),
                };
                // Selected beats current beats deleted, so muted text never
                // lands on a muted surface.
                const tone = isSelected
                  ? "bg-primary text-primary-foreground"
                  : isCurrent
                    ? "bg-accent text-accent-foreground font-medium"
                    : token.deleted
                      ? "text-muted-foreground"
                      : null;
                const focusRing =
                  "focus-visible:ring-ring cursor-pointer focus-visible:ring-2 focus-visible:outline-none";

                if (token.kind === "media") {
                  const Icon = MEDIA[token.media].icon;
                  return (
                    <span
                      key={token.id}
                      data-slot="transcript-editor-media-chip"
                      data-media={token.media}
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs",
                        focusRing,
                        tone ?? "bg-secondary text-secondary-foreground",
                        token.deleted && "line-through",
                      )}
                      {...shared}
                    >
                      {/* A chip is a non-text element in a text flow. The icon
                          is decorative; `aria-label` above says which kind. */}
                      <Icon aria-hidden className="size-3" />
                      {token.label}
                    </span>
                  );
                }

                return (
                  <span
                    key={token.id}
                    data-slot="transcript-editor-word"
                    className={cn("rounded px-1", focusRing, tone, token.deleted && "line-through")}
                    {...shared}
                  >
                    {token.text}
                  </span>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export { formatTimecode, TranscriptEditor };
export type {
  TranscriptEdit,
  TranscriptEditorProps,
  TranscriptMedia,
  TranscriptMediaKind,
  TranscriptSegment,
  TranscriptSpeaker,
  TranscriptToken,
  TranscriptWord,
};
