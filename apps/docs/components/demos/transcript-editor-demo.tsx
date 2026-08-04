"use client";

import * as React from "react";

import {
  TranscriptEditor,
  type TranscriptEdit,
  type TranscriptSegment,
  type TranscriptSpeaker,
  type TranscriptToken,
} from "@/registry/super-ai/transcript-editor";

/** Turns a line into evenly-timed word tokens, the way an ASR pass would. */
function words(text: string, from: number, prefix: string): TranscriptToken[] {
  return text.split(" ").map((word, index) => ({
    id: `${prefix}-${index}`,
    kind: "word" as const,
    text: word,
    start: from + index * 0.35,
    end: from + (index + 1) * 0.35,
  }));
}

const SPEAKERS: TranscriptSpeaker[] = [
  { id: "sp-1", name: "Ada" },
  { id: "sp-2", name: "Speaker 2" },
];

const SEGMENTS: TranscriptSegment[] = [
  {
    id: "seg-1",
    speakerId: "sp-1",
    tokens: [
      ...words("We cut the intro down to nine seconds", 0, "a"),
      { id: "m1", kind: "media", media: "video", label: "skyline b-roll", start: 2.8, end: 5.2 },
      ...words("and honestly it still lands", 5.2, "b"),
    ],
  },
  {
    id: "seg-2",
    speakerId: "sp-2",
    tokens: [
      ...words("Every filler word is still in here", 7.3, "c"),
      { id: "m2", kind: "media", media: "music", label: "bed, low", start: 9.8, end: 12 },
      ...words("just struck out rather than gone", 12, "d"),
    ],
  },
];

export default function TranscriptEditorDemo() {
  const [speakers, setSpeakers] = React.useState(SPEAKERS);
  const [segments, setSegments] = React.useState(SEGMENTS);
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [currentTime, setCurrentTime] = React.useState(0.5);

  // The host owns the edit-decision list. Everything the editor emits is
  // applied here, and a timeline reading the same state would move with it.
  function applyEdit(edit: TranscriptEdit) {
    if (edit.type === "rename-speaker") {
      setSpeakers((prev) =>
        prev.map((speaker) => (speaker.id === edit.speakerId ? { ...speaker, name: edit.name } : speaker)),
      );
      return;
    }
    const deleted = edit.type === "delete";
    setSegments((prev) =>
      prev.map((segment) => ({
        ...segment,
        tokens: segment.tokens.map((token) =>
          edit.tokenIds.includes(token.id) ? { ...token, deleted } : token,
        ),
      })),
    );
  }

  return (
    <div className="w-full max-w-2xl">
      <TranscriptEditor
        segments={segments}
        speakers={speakers}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        onEdit={applyEdit}
        currentTime={currentTime}
        onSeek={(time) => setCurrentTime(time)}
      />
    </div>
  );
}
