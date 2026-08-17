import type { ComponentDocs } from "@/lib/component-docs";
import {
  SpeakerLabelsEditable,
  SpeakerLabelsFrozen,
  StruckBeforeRemoved,
  WordsQuietlyRemoved,
} from "./transcript-editor.examples";

/**
 * Seeded from docs/design-system/component-specs.md#h4-transcript-editor.
 *
 * No "use client" here: this module is plain data read by a Server Component
 * (component-docs.tsx). Live examples live in the
 * ./transcript-editor.examples client sidecar and are referenced here as
 * zero-prop elements — see that file for why.
 */

export const TranscriptEditorDocs: ComponentDocs = {
  whatItIs:
    "A transcript you can cut with. Words and inline media arrive as timed tokens, a run of them is selectable like text, and deleting a run strikes it through rather than removing it. It renders the same edit-decision list a timeline renders, so it is a second view of one cut, not a second copy of it.",
  whyItMatters:
    "Descript made text-based editing the fastest way to cut spoken video, and CapCut and Premiere have both shipped their own version since — at which point it stopped being one product's trick and became something an AI media tool is expected to have. It works because speech is already indexed by time: if the transcript and the timeline read the same list, deleting a sentence is a cut and moving the playhead is a reading position. The component earns its place by refusing to own that list, which is the only way the two views cannot drift apart.",
  evidence: ["Descript", "CapCut", "Premiere"],
  anatomy: [
    { slot: "transcript-editor", note: "Root frame around the toolbar and every speaker segment." },
    {
      slot: "transcript-editor-toolbar",
      note: "Delete and Restore, both acting on the current selection.",
    },
    {
      slot: "transcript-editor-status",
      note: "Live region: how much is selected, and how much is struck through but recoverable.",
    },
    { slot: "transcript-editor-segment", note: "One speaker turn; carries the speaker id." },
    {
      slot: "transcript-editor-speaker",
      note: "The editable speaker label. Editing it emits a diarisation correction.",
    },
    { slot: "transcript-editor-timecode", note: "Where the segment starts on the timeline." },
    {
      slot: "transcript-editor-text",
      note: "The word flow itself: a multi-selectable listbox with roving tab order.",
    },
    { slot: "transcript-editor-word", note: "One word token. Selectable, seekable, strikeable." },
    {
      slot: "transcript-editor-media-chip",
      note: "An inline b-roll, music, or image insert, named so it survives without sight of the icon.",
    },
  ],
  usage:
    "Reach for it whenever spoken media is being cut and a transcript already exists — podcasts, interviews, screen recordings, anything with an ASR pass behind it. Hold the token list in the same state that feeds your timeline and pass it down: the editor is fully controlled, rendering `segments`, `speakers` and `selectedIds`, and handing back `onSelectionChange`, `onSeek` and a single `onEdit` union of delete, restore and rename-speaker. Apply those edits once, in one place, and the transcript and the timeline cannot disagree. Feed `currentTime` in from playback and the current word marks itself; activating any token calls `onSeek` with that token's start.",
  dos: [
    {
      text: "Strike a deletion through and leave it in the flow — a cut you can see is a cut you can undo.",
      example: <StruckBeforeRemoved />,
    },
    {
      text: "Leave speaker labels editable wherever diarisation is a guess, and apply the rename to every segment that speaker owns.",
      example: <SpeakerLabelsEditable />,
    },
  ],
  donts: [
    {
      text: "Don't apply a delete by dropping tokens from the list — the edit becomes invisible, unreviewable, and impossible to reverse from the transcript.",
      example: <WordsQuietlyRemoved />,
    },
    {
      text: 'Don\'t freeze the labels next to a machine-guessed speaker. A transcript stuck on "Speaker 2" is a correction the product refused to accept.',
      example: <SpeakerLabelsFrozen />,
    },
  ],
  accessibility: {
    keyboard: [
      "Tab stops are per segment, not per word: two toolbar buttons, then per segment one speaker-name `<input>` (when `editableSpeakers`) and one stop into the word flow. Twelve segments and a thousand words is twenty-six stops.",
      "Inside the flow, Left and Right move token by token across the whole transcript and cross segment boundaries — arrowing off the last word of one turn lands inside the next speaker's listbox. Shift with either arrow extends the selection from the anchor.",
      "Enter and Space select the focused token and call `onSeek` with its start. So does an unshifted arrow move, which means arrowing through a transcript scrubs the player on every single keypress.",
      "Backspace and Delete strike through — the whole selection if the focused token is part of it, otherwise just that token — and always as an `onEdit({ type: \"delete\" })` rather than a local mutation. Pressing either on an already-struck token does nothing and reports nothing.",
      "Restoring has no key. Restore is the toolbar button only, acting on whatever in the current selection is already deleted.",
      "Up, Down, Home, End, Page Up and Page Down do nothing in the flow — they scroll the page. There is no jump to the start of a segment and no jump to the token under the playhead.",
      "Selection is controlled with no internal fallback. Skip `onSelectionChange` and the arrows still move focus, but `selectedIds` stays empty, the roving `tabIndex={0}` snaps back to each segment's first token, and Delete can only ever reach one token at a time.",
    ],
    screenReader: [
      "Each segment's word flow is `role=\"listbox\"` with `aria-multiselectable`, named `\"Transcript, <speaker name>\"`; every token is `role=\"option\"` with `aria-selected`, so selection survives without colour.",
      "Because arrow movement crosses segments, focus routinely moves from one listbox into a different one. Screen readers re-announce the list on each crossing, so a transcript with many short turns is noisier to arrow through than one with long ones.",
      "The token under the playhead carries `aria-current=\"true\"` and nothing else. There is no live region tracking it, so a screen-reader user following playback has no announcement that the current word moved.",
      "A word's name is its own text, except when deleted, where it is set explicitly to `\"<text>, deleted\"` — the strike-through is never left to the line. A media chip is always named explicitly, `\"Video: skyline b-roll\"`, with its icon `aria-hidden`; add a media kind without adding its noun to the kind map and the chip announces as a bare label with no clue what it is.",
      "The toolbar's `role=\"status\"` is mounted at all times and its text changes — \"3 selected\", plus \". 2 struck through, still restorable\" once anything is deleted. That is the only thing announcing an edit: `onEdit` is silent by itself, so a host that drops the callback produces no change and no announcement.",
      "Each speaker field is named `\"Speaker name at 0:12\"` from its own segment's start, so two turns by the same speaker are separately addressable — even though renaming either emits the same `speakerId` and corrects both.",
      "The speaker field fires `onEdit` on every keystroke and its value comes straight back from `speakers`. A host that does not apply the rename leaves a controlled input whose value never changes, which reads to a screen reader as typing that does not register.",
    ],
    focus: [
      "Arrow movement calls `.focus()` on the target token, so real DOM focus moves rather than `aria-activedescendant`. Tab out and back and you land on the roving token: the first selected token in that segment, or its first token when nothing there is selected.",
      "Pressing Delete in the toolbar strikes the selection through, which empties `strikeable` on the next render and disables the button you just pressed — focus drops to `<body>` mid-edit. Restore does the same in reverse. Move focus back into the flow from your `onEdit` handler.",
      "Every token ships `focus-visible:ring-2 ring-ring`; the toolbar buttons and the speaker inputs take the vendored primitives' rings.",
      "The component provides no scroll container of its own — it grows to its content — so whoever wraps it owns scrolling a focused token into view beyond what the browser does by default.",
    ],
  },
  pitfalls: [
    "Letting the component hold the transcript. It deliberately holds none: selection, deletions and speaker names are all props, and every change leaves as `onEdit`. Mirroring the list into local state to make it feel snappier is how the timeline and the transcript drift apart within a session, which is the exact failure this pattern exists to prevent.",
    "Treating `deleted` as a removal instruction. It marks a token struck through; flattening those tokens out of the array is a separate, later step, taken when you render or export the final cut. Do it early and Restore has nothing left to restore.",
    "Rendering the words as buttons. A transcript is hundreds of tokens and one tab stop per word makes the surface unusable by keyboard, so the flow is a listbox with roving tab order, arrow-key movement and shift-extension — one stop per segment. Re-wrapping tokens in interactive elements breaks that and creates a nested-interactive accessibility failure at the same time.",
    'Assuming a media chip announces itself. An inline insert is a non-text element in a text flow, so its accessible name carries the kind as well as the label ("Video: skyline b-roll"). Extend the token model with new media kinds and you have to extend the naming with them, or screen-reader users get a bare label with no clue what it is.',
    "Expecting a rename to be scoped to the segment you typed in. It carries the speaker id, because a diarisation fix that only corrected one turn would be worse than none — apply it to every segment that speaker owns.",
  ],
};
