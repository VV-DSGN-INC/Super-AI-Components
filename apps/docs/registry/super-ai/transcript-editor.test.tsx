import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { TranscriptEditor, type TranscriptSegment, type TranscriptSpeaker } from "./transcript-editor";

const SPEAKERS: TranscriptSpeaker[] = [
  { id: "sp-1", name: "Ada" },
  { id: "sp-2", name: "Grace" },
];

const SEGMENTS: TranscriptSegment[] = [
  {
    id: "seg-1",
    speakerId: "sp-1",
    tokens: [
      { id: "w1", kind: "word", text: "We", start: 0, end: 0.4 },
      { id: "w2", kind: "word", text: "shipped", start: 0.4, end: 0.9 },
      { id: "w3", kind: "word", text: "the", start: 0.9, end: 1.1 },
      { id: "m1", kind: "media", media: "video", label: "skyline b-roll", start: 1.1, end: 3 },
      { id: "w4", kind: "word", text: "cut", start: 3, end: 3.4 },
    ],
  },
  {
    id: "seg-2",
    speakerId: "sp-2",
    tokens: [
      { id: "w5", kind: "word", text: "Twice", start: 62, end: 62.5 },
      { id: "w6", kind: "word", text: "over", start: 62.5, end: 63 },
    ],
  },
];

const withDeleted = (ids: string[]): TranscriptSegment[] =>
  SEGMENTS.map((segment) => ({
    ...segment,
    tokens: segment.tokens.map((token) => (ids.includes(token.id) ? { ...token, deleted: true } : token)),
  }));

describe("TranscriptEditor", () => {
  it("renders the word-select state", async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    render(
      <TranscriptEditor
        segments={SEGMENTS}
        speakers={SPEAKERS}
        selectedIds={["w2"]}
        onSelectionChange={onSelectionChange}
      />,
    );

    // Real semantics: a multi-selectable listbox of options, so selection is
    // programmatic rather than carried by colour.
    const flow = screen.getByRole("listbox", { name: "Transcript, Ada" });
    expect(flow).toHaveAttribute("aria-multiselectable", "true");
    expect(screen.getByRole("option", { name: "shipped" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("option", { name: "the" })).toHaveAttribute("aria-selected", "false");

    await user.click(within(flow).getByRole("option", { name: "the" }));
    expect(onSelectionChange).toHaveBeenCalledWith(["w3"]);
  });

  it("selects a contiguous run of words with a shift-click", async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    render(
      <TranscriptEditor segments={SEGMENTS} speakers={SPEAKERS} onSelectionChange={onSelectionChange} />,
    );

    await user.click(screen.getByRole("option", { name: "We" }));
    await user.keyboard("{Shift>}");
    await user.click(screen.getByRole("option", { name: "the" }));
    await user.keyboard("{/Shift}");

    expect(onSelectionChange).toHaveBeenLastCalledWith(["w1", "w2", "w3"]);
  });

  it("moves and extends the selection from the keyboard", async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    render(
      <TranscriptEditor segments={SEGMENTS} speakers={SPEAKERS} onSelectionChange={onSelectionChange} />,
    );

    screen.getByRole("option", { name: "We" }).focus();
    await user.keyboard("{ArrowRight}");
    expect(onSelectionChange).toHaveBeenLastCalledWith(["w2"]);

    await user.keyboard("{Shift>}{ArrowRight}{/Shift}");
    expect(onSelectionChange).toHaveBeenLastCalledWith(["w2", "w3"]);
  });

  it("renders the speaker-labels state", async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    render(<TranscriptEditor segments={SEGMENTS} speakers={SPEAKERS} onEdit={onEdit} />);

    const label = screen.getByLabelText("Speaker name at 0:00");
    expect(label).toHaveValue("Ada");
    expect(screen.getByLabelText("Speaker name at 1:02")).toHaveValue("Grace");

    await user.type(label, "m");
    expect(onEdit).toHaveBeenCalledWith({
      type: "rename-speaker",
      speakerId: "sp-1",
      name: "Adam",
    });
  });

  it("emits a speaker rename against the speaker id, not the segment", async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    // The same speaker across two segments: a diarisation correction has to be
    // applicable to every segment they own, so the edit carries the speaker id.
    const segments: TranscriptSegment[] = [
      SEGMENTS[0],
      {
        id: "seg-3",
        speakerId: "sp-1",
        tokens: [{ id: "w7", kind: "word", text: "Again", start: 90, end: 90.5 }],
      },
    ];
    render(<TranscriptEditor segments={segments} speakers={SPEAKERS} onEdit={onEdit} />);

    await user.type(screen.getByLabelText("Speaker name at 1:30"), "!");
    expect(onEdit).toHaveBeenLastCalledWith({
      type: "rename-speaker",
      speakerId: "sp-1",
      name: "Ada!",
    });
  });

  it("renders the media-chips state", async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    render(
      <TranscriptEditor segments={SEGMENTS} speakers={SPEAKERS} onSelectionChange={onSelectionChange} />,
    );

    // An inline non-text element in a text flow still has to say what it is.
    const chip = screen.getByRole("option", { name: "Video: skyline b-roll" });
    expect(chip).toHaveAttribute("data-slot", "transcript-editor-media-chip");
    expect(chip).toHaveAttribute("data-media", "video");

    // It is a token like any other, so it is selectable and cuttable.
    await user.click(chip);
    expect(onSelectionChange).toHaveBeenCalledWith(["m1"]);
  });

  it("renders the strikethrough state", () => {
    render(<TranscriptEditor segments={withDeleted(["w4", "m1"])} speakers={SPEAKERS} selectedIds={[]} />);

    // Struck through, not removed: still in the DOM, still an option, and the
    // deletion is announced rather than left to the line.
    const word = screen.getByRole("option", { name: "cut, deleted" });
    expect(word).toHaveAttribute("data-slot", "transcript-editor-word");
    expect(word).toHaveAttribute("data-deleted", "true");
    expect(word.className).toContain("line-through");

    expect(screen.getByRole("option", { name: "Video: skyline b-roll, deleted" })).toBeVisible();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Nothing selected. 2 struck through, still restorable",
    );
  });

  it("deletes by marking, not by removing, and restores what it marked", async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    const { rerender } = render(
      <TranscriptEditor segments={SEGMENTS} speakers={SPEAKERS} selectedIds={["w2", "w3"]} onEdit={onEdit} />,
    );

    await user.click(screen.getByRole("button", { name: "Delete" }));
    expect(onEdit).toHaveBeenCalledWith({ type: "delete", tokenIds: ["w2", "w3"] });
    // The edit went out; nothing changed here, because the list is not ours.
    expect(screen.getByRole("option", { name: "shipped" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Restore" })).toBeDisabled();

    rerender(
      <TranscriptEditor
        segments={withDeleted(["w2", "w3"])}
        speakers={SPEAKERS}
        selectedIds={["w2", "w3"]}
        onEdit={onEdit}
      />,
    );

    expect(screen.getByRole("option", { name: "shipped, deleted" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Restore" }));
    expect(onEdit).toHaveBeenLastCalledWith({ type: "restore", tokenIds: ["w2", "w3"] });
  });

  it("is a view of the edit-decision list, so it holds no state of its own", async () => {
    const user = userEvent.setup();
    render(<TranscriptEditor segments={SEGMENTS} speakers={SPEAKERS} selectedIds={["w1"]} />);

    // No onSelectionChange: nothing to apply the edit, so nothing moves.
    await user.click(screen.getByRole("option", { name: "the" }));
    expect(screen.getByRole("option", { name: "We" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("option", { name: "the" })).toHaveAttribute("aria-selected", "false");
  });

  it("tracks the timeline playhead and seeks it back", async () => {
    const user = userEvent.setup();
    const onSeek = vi.fn();
    render(<TranscriptEditor segments={SEGMENTS} speakers={SPEAKERS} currentTime={0.5} onSeek={onSeek} />);

    // Timeline to transcript.
    expect(screen.getByRole("option", { name: "shipped" })).toHaveAttribute("aria-current", "true");
    expect(screen.getByRole("option", { name: "the" })).not.toHaveAttribute("aria-current");

    // Transcript back to timeline, with the token's own start time.
    await user.click(screen.getByRole("option", { name: "the" }));
    expect(onSeek).toHaveBeenCalledWith(0.9, "w3");
  });

  it("passes className through", () => {
    render(<TranscriptEditor segments={SEGMENTS} speakers={SPEAKERS} className="test-class" />);
    expect(document.querySelector('[data-slot="transcript-editor"]')!.className).toContain("test-class");
  });
});
