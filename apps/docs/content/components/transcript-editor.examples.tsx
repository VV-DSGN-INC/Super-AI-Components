"use client";

import {
  TranscriptEditor,
  type TranscriptSegment,
  type TranscriptSpeaker,
  type TranscriptToken,
} from "@/registry/super-ai/transcript-editor";

/**
 * Live examples for transcript-editor.docs.tsx.
 *
 * A client sidecar: the docs module is plain data read by a Server Component
 * and cannot carry "use client" or handler-bearing JSX.
 */

function words(text: string, from: number, prefix: string): TranscriptToken[] {
  return text.split(" ").map((word, index) => ({
    id: `${prefix}-${index}`,
    kind: "word" as const,
    text: word,
    start: from + index * 0.35,
    end: from + (index + 1) * 0.35,
  }));
}

const SPEAKERS: TranscriptSpeaker[] = [{ id: "sp-1", name: "Ada" }];
const UNRESOLVED: TranscriptSpeaker[] = [{ id: "sp-1", name: "Speaker 2" }];

const LINE = words("We cut the intro down to nine long seconds", 0, "w");

/** DO — a deletion is struck through, still in the flow, still restorable. */
export function StruckBeforeRemoved() {
  const segments: TranscriptSegment[] = [
    {
      id: "seg-1",
      speakerId: "sp-1",
      tokens: LINE.map((token) => (token.id === "w-7" ? { ...token, deleted: true } : token)),
    },
  ];
  return <TranscriptEditor segments={segments} speakers={SPEAKERS} />;
}

/** DON&apos;T — the same cut applied by dropping the tokens from the list. */
export function WordsQuietlyRemoved() {
  const segments: TranscriptSegment[] = [
    {
      id: "seg-1",
      speakerId: "sp-1",
      tokens: LINE.filter((token) => token.id !== "w-7"),
    },
  ];
  return <TranscriptEditor segments={segments} speakers={SPEAKERS} />;
}

/** DO — the speaker label is a field, so diarisation can be corrected here. */
export function SpeakerLabelsEditable() {
  const segments: TranscriptSegment[] = [
    { id: "seg-1", speakerId: "sp-1", tokens: words("Say that again for the room", 0, "s") },
  ];
  return <TranscriptEditor segments={segments} speakers={UNRESOLVED} />;
}

/** DON&apos;T — labels frozen, so a mis-diarised speaker stays mis-diarised. */
export function SpeakerLabelsFrozen() {
  const segments: TranscriptSegment[] = [
    { id: "seg-1", speakerId: "sp-1", tokens: words("Say that again for the room", 0, "s") },
  ];
  return <TranscriptEditor segments={segments} speakers={UNRESOLVED} editableSpeakers={false} />;
}
