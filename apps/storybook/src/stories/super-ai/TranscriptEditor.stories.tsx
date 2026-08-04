import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  TranscriptEditor,
  type TranscriptSegment,
  type TranscriptSpeaker,
  type TranscriptToken,
} from "@/registry/super-ai/transcript-editor";
import { TranscriptEditorDocs } from "@/content/components/transcript-editor.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

/** Evenly-timed word tokens, the way an ASR pass would hand them over. */
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

const struck = (ids: string[]): TranscriptSegment[] =>
  SEGMENTS.map((segment) => ({
    ...segment,
    tokens: segment.tokens.map((token) => (ids.includes(token.id) ? { ...token, deleted: true } : token)),
  }));

const meta: Meta<typeof TranscriptEditor> = {
  title: "Super AI/Transcript Editor",
  component: TranscriptEditor,
  parameters: { layout: "centered", docs: { page: componentDocsPage(TranscriptEditorDocs) } },
  decorators: [
    (Story) => (
      <div className="w-[42rem] max-w-full">
        <Story />
      </div>
    ),
  ],
  args: {
    segments: SEGMENTS,
    speakers: SPEAKERS,
    onSelectionChange: () => {},
    onEdit: () => {},
    onSeek: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof TranscriptEditor>;

/** A run of words is one selection, and the playhead marks where it is. */
export const WordSelect: Story = {
  args: { selectedIds: ["a-1", "a-2", "a-3"], currentTime: 2.0 },
};

/** The label is a field, because diarisation is a guess worth correcting. */
export const SpeakerLabels: Story = {
  args: { selectedIds: [] },
};

/** Inline inserts are tokens too — named, selectable, and cuttable. */
export const MediaChips: Story = {
  args: { selectedIds: ["m1"] },
};

/** Deleted words are struck through before removal, so the cut is reversible. */
export const Strikethrough: Story = {
  args: { segments: struck(["a-4", "a-5", "a-6", "m2"]), selectedIds: ["a-4", "a-5", "a-6"] },
};
