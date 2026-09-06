import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";

import { settledFocusRing } from "@/lib/focus-ring";

import { Button } from "@/components/ui/button";
import {
  TranscriptEditor,
  type TranscriptSegment,
  type TranscriptSpeaker,
  type TranscriptToken,
} from "@/registry/super-ai/transcript-editor";
import { TtsComposer } from "@/registry/super-ai/tts-composer";
import { WaveformEditor } from "@/registry/super-ai/waveform-editor";
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

/* -------------------------------------------------------------------------
 * Case stories — the situations this component meets in a product, as
 * opposed to the prop combinations above. See
 * docs/design-system/story-conventions.md.
 *
 * Seven of the eight are written. The one that is not:
 *
 * // case-skip: ReducedMotion — grep for animate-/transition-/duration- in transcript-editor.tsx returns nothing
 * Selection, strike-through and the playhead mark are all class swaps that
 * repaint on the frame they change. The only motion anywhere under this
 * component comes from two vendored primitives — `ui/button.tsx`'s
 * `transition-all` plus `active:not-aria-[haspopup]:translate-y-px` (the
 * press nudge, a primitive-wide posture recorded in CONTINUE.md §8 and
 * deliberately not patched per component) and `ui/input.tsx`'s
 * `transition-colors`, which crossfades a border colour and moves nothing.
 * Neither is this component's to branch on, so a `ReducedMotion` story here
 * would render identically to `WordSelect` and imply coverage it has not got.
 * ---------------------------------------------------------------------- */

const root = (canvasElement: HTMLElement) =>
  canvasElement.querySelector<HTMLElement>('[data-slot="transcript-editor"]')!;

const tokenAt = (canvasElement: HTMLElement, id: string) =>
  root(canvasElement).querySelector<HTMLElement>(`[data-token-id="${id}"]`)!;

const slotOf = (canvasElement: HTMLElement, name: string) =>
  root(canvasElement).querySelector<HTMLElement>(`[data-slot="${name}"]`)!;

/** Left edge, rounded — every geometry assertion below compares two of these. */
const leftOf = (el: Element) => Math.round(el.getBoundingClientRect().left);

/**
 * Right-to-left, and the interesting half is not the chrome.
 *
 * The chrome mirrors, and one class had to be swapped to make it. The
 * toolbar's status text was `ml-auto`, a physical margin: measured under
 * `dir="rtl"` it left 220px of dead space against the logical end and sat at
 * 233→476 inside a toolbar spanning 13→659, because in an RTL flex row the
 * free space is on the left and `margin-left: auto` pushes the item *away*
 * from it. `ms-auto` is `margin-inline-start`, byte-identical in LTR and the
 * sanctioned swap (CONTINUE.md §8, "Logical properties"); after it the status
 * sits at 13→70, flush against the edge it is flush against in LTR. Asserted
 * below. Everything else was already logical: Delete leads at 579→659, the
 * speaker field takes the logical start at 483→659 with its timecode after it
 * at 449→475, and the word flow reads right to left.
 *
 * **Two things do not mirror, and both are recorded rather than asserted.**
 *
 * The arrow keys are direction-blind. `handleKeyDown` maps ArrowRight to
 * `index + 1` in the flat token order with no reference to `dir`, so under
 * RTL ArrowRight moves focus to the token painted to the *left* — measured
 * here, a-1 at 598→626 to a-2 at 565→594. It is the `mode-tabs` finding from
 * wave 1 reached from the other side: there a Base UI composite read a
 * `useDirection()` no `DirectionProvider` had ever set, here a hand-rolled
 * handler never asks. The repair is the same shell-level decision either way,
 * so nothing here pins the current behaviour.
 *
 * And a Latin transcript comes out backwards. Every token is a flex item, not
 * inline text, so the bidi algorithm never runs across the sentence: the flex
 * main axis alone decides the order, and "We cut the" paints as 630→659,
 * 598→626, 565→594. For an Arabic or Hebrew transcript that is exactly right.
 * For an English transcript inside an RTL product shell it is not, and the
 * component offers no way to say the chrome is RTL while the transcript's own
 * language is not — an API decision (a per-transcript `dir`), not a class swap.
 */
export const RTL: Story = {
  args: { selectedIds: ["a-1"], currentTime: 2.0 },
  render: (args) => (
    <div dir="rtl">
      <TranscriptEditor {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const el = root(canvasElement);
    await expect(getComputedStyle(el).direction).toBe("rtl");

    // The toolbar: Delete leads at the logical start, the status is pinned to
    // the logical end. That is the `ms-auto` swap, and the assertion that
    // would have failed before it.
    const toolbar = slotOf(canvasElement, "transcript-editor-toolbar");
    const [del, restore] = Array.from(toolbar.querySelectorAll("button"));
    const status = slotOf(canvasElement, "transcript-editor-status");
    await expect(`Delete right of Restore: ${leftOf(del) > leftOf(restore)}`).toBe(
      "Delete right of Restore: true",
    );
    await expect(`status flush to the logical end: ${leftOf(status) === leftOf(toolbar)}`).toBe(
      "status flush to the logical end: true",
    );

    // The speaker row: field at the logical start, timecode after it.
    const field = el.querySelector<HTMLInputElement>("input")!;
    const timecode = slotOf(canvasElement, "transcript-editor-timecode");
    await expect(`field right of timecode: ${leftOf(field) > leftOf(timecode)}`).toBe(
      "field right of timecode: true",
    );

    // …and the flow itself reads right to left, token by token, chip included.
    const flow = ["a-0", "a-1", "a-2"].map((id) => leftOf(tokenAt(canvasElement, id)));
    await expect(`descending: ${flow[0] > flow[1] && flow[1] > flow[2]}`).toBe("descending: true");
    await expect(`chip left of the words before it: ${leftOf(tokenAt(canvasElement, "m1")) < flow[2]}`).toBe(
      "chip left of the words before it: true",
    );
  },
};

/**
 * The whole keyboard surface, and the reason the flow is a listbox rather
 * than a field of buttons: **six tab stops for twenty-eight tokens.** Two
 * toolbar buttons, then per segment one speaker field and exactly one way in
 * to the words — the roving stop, which is the first *selected* token in that
 * segment and its first token otherwise. Both halves are asserted, because
 * the roving rule is what makes tabbing back in land where you left off.
 *
 * Restore is a stop here only because the selection contains a struck token;
 * with nothing struck selected it is `disabled` and drops out of the order
 * entirely, which is why the fixture strikes `a-5`.
 *
 * Every stop is checked with `settledFocusRing` rather than
 * `boxShadow !== "none"`, and on this component the difference is not
 * academic. A focused word token reads `outline-style: none` with
 * `outline-width: 1px` — the `focus-visible:outline-none` false positive of
 * mechanical fact 5 — while its real treatment is a shadow layer,
 * `oklch(0.708 0 0) 0px 0px 0px 2px`, which the string check would have
 * credited to the outline instead. The two toolbar buttons are the other
 * shape: on the frame focus lands, all five of their shadow layers are
 * transparent and zero-sized, and the real `oklab(0.708 0 0 / 0.5) 0px 0px
 * 0px 3px` arrives only once `transition-all` has run, so an immediate read
 * fails on a control that does paint a ring.
 *
 * **Recorded, not asserted: pressing Delete drops focus on the floor.**
 * Striking the selection empties `strikeable` on the next render, which
 * disables the button that was just pressed, and `document.activeElement`
 * becomes `<body>` — measured against a host that really applies the edit.
 * The docs module's focus list already carries it and asks callers to move
 * focus back from their `onEdit` handler. Where focus *should* go (the struck
 * run? Restore?) is a design decision, so no assertion here makes the current
 * answer permanent.
 */
export const KeyboardOrder: Story = {
  args: { segments: struck(["a-5"]), selectedIds: ["a-4", "a-5"] },
  play: async ({ canvasElement }) => {
    const el = root(canvasElement);

    // One way in per segment, and it is the first selected token — not the
    // first token — so tabbing back lands on the run you were working on.
    const roving = Array.from(el.querySelectorAll<HTMLElement>('[data-token-id][tabindex="0"]'));
    await expect(roving.map((r) => r.getAttribute("data-token-id"))).toEqual(["a-4", "c-0"]);
    await expect(el.querySelectorAll("[data-token-id]")).toHaveLength(28);

    const name = (node: Element | null) =>
      node === null ? "nothing" : `${node.tagName.toLowerCase()}[${node.getAttribute("data-slot") ?? ""}]`;

    const expectedStops = [
      "button[button]", // Delete
      "button[button]", // Restore — a stop only because a struck token is selected
      "input[input]", // Ada
      "span[transcript-editor-word]", // the roving stop, a-4
      "input[input]", // Speaker 2
      "span[transcript-editor-word]", // the roving stop, c-0
    ];

    await userEvent.tab();
    await waitFor(() => {
      if (!el.contains(document.activeElement)) {
        throw new Error(`focus never entered the editor: ${name(document.activeElement)}`);
      }
    });

    for (let i = 0; i < expectedStops.length; i += 1) {
      const focused = document.activeElement as HTMLElement;
      await expect(`stop ${i}: ${name(focused)}`).toBe(`stop ${i}: ${expectedStops[i]}`);
      await expect(`stop ${i}: focusVisible=${focused.matches(":focus-visible")}`).toBe(
        `stop ${i}: focusVisible=true`,
      );
      await settledFocusRing(focused, waitFor);
      await userEvent.tab();
    }

    // Nothing traps: the stop after the last token is outside the editor.
    await expect(el.contains(document.activeElement)).toBe(false);

    // Inside the flow the arrows move token by token and cross segment
    // boundaries — b-4 is the last token of Ada's turn, c-0 the first of
    // Speaker 2's, and they live in two different listboxes.
    tokenAt(canvasElement, "b-4").focus();
    await userEvent.keyboard("{ArrowRight}");
    const crossed = document.activeElement as HTMLElement;
    await expect(crossed.getAttribute("data-token-id")).toBe("c-0");
    await expect(crossed.closest('[role="listbox"]')!.getAttribute("aria-label")).toBe(
      "Transcript, Speaker 2",
    );
    // Arrow movement calls `.focus()`, and `:focus-visible` survives it — so
    // the ring the walk above proved is the ring an arrowing user actually sees.
    await expect(`arrowed focusVisible=${crossed.matches(":focus-visible")}`).toBe(
      "arrowed focusVisible=true",
    );
    await settledFocusRing(crossed, waitFor);

    // The flow ends rather than wrapping: ArrowRight on the last token of the
    // last segment is a no-op, which is what keeps Tab the way out.
    tokenAt(canvasElement, "d-5").focus();
    await userEvent.keyboard("{ArrowRight}");
    await expect((document.activeElement as HTMLElement).getAttribute("data-token-id")).toBe("d-5");
  },
};

/**
 * The host holds the transcript and refuses to move it, which is the only
 * mode this component has. `segments`, `speakers` and `selectedIds` are all
 * props and there is no internal fallback anywhere, so "controlled" is not a
 * variant here, it is the contract — and a consumer who wires the callbacks
 * to nothing ships a transcript that looks interactive and edits nothing.
 *
 * Four things in order, and the last two are what a screenshot cannot show:
 * clicking a word does not select it; `onSelectionChange` still fires with
 * the id array a host applies verbatim; a re-render with an unchanged
 * `selectedIds` leaves the selection where it was; and applying the request
 * moves it. Then the same proof for the destructive channel — Delete emits
 * `{ type: "delete", tokenIds }` and strikes nothing through until the host
 * says so, which is the spec's "editing either updates the other" read from
 * the transcript's side.
 *
 * Worth noticing in the readout: `onSeek` fires on the same click that
 * requests the selection. A host that applies one and not the other gets a
 * playhead sitting on a word the transcript does not show as selected.
 */
export const Controlled: Story = {
  render: () => <ControlledShell />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const isSelected = (id: string) => tokenAt(canvasElement, id).getAttribute("aria-selected");

    await expect(isSelected("a-1")).toBe("true");
    await expect(isSelected("a-5")).toBe("false");

    // 1. Interaction alone does not move the rendered value.
    await userEvent.click(tokenAt(canvasElement, "a-5"));
    await expect(isSelected("a-5")).toBe("false");
    await expect(isSelected("a-1")).toBe("true");

    // 2. …but the callback fired, with the payload a host applies verbatim.
    await expect(canvas.getByTestId("requested")).toHaveTextContent("a-5");
    await expect(canvas.getByTestId("seeked")).toHaveTextContent("a-5");

    // 3. Re-render with an unchanged `selectedIds`. Prove the re-render first.
    await expect(canvas.getByTestId("render-pass")).toHaveTextContent("1");
    await userEvent.click(canvas.getByRole("button", { name: "Re-render" }));
    await expect(canvas.getByTestId("render-pass")).toHaveTextContent("2");
    await expect(isSelected("a-5")).toBe("false");
    await expect(isSelected("a-1")).toBe("true");

    // 4. The payload was sufficient to apply the change.
    await userEvent.click(canvas.getByRole("button", { name: "Apply selection" }));
    await waitFor(() => expect(isSelected("a-5")).toBe("true"));
    await expect(isSelected("a-1")).toBe("false");

    // 5. The same contract on the destructive channel: Delete asks, it does
    //    not cut. `deleted` is a flag the host sets on a token it still owns.
    const struckCount = () => canvasElement.querySelectorAll('[data-deleted="true"]').length;
    await expect(struckCount()).toBe(0);
    await userEvent.click(canvas.getByRole("button", { name: "Delete" }));
    await expect(struckCount()).toBe(0);
    await expect(canvas.getByTestId("edit")).toHaveTextContent("delete a-5");

    await userEvent.click(canvas.getByRole("button", { name: "Apply edit" }));
    await waitFor(() => expect(struckCount()).toBe(1));
    // Struck, not spliced: the token is still in the flow, still selected, and
    // its name now says so out loud rather than leaving it to the line.
    await expect(tokenAt(canvasElement, "a-5").getAttribute("aria-label")).toBe("to, deleted");
    await expect(isSelected("a-5")).toBe("true");
  },
};

function ControlledShell() {
  const [applied, setApplied] = React.useState<string[]>(["a-1"]);
  const [requested, setRequested] = React.useState<string[] | null>(null);
  const [segments, setSegments] = React.useState(SEGMENTS);
  const [edit, setEdit] = React.useState<{ type: string; tokenIds?: string[] } | null>(null);
  const [seeked, setSeeked] = React.useState<string | null>(null);
  const [pass, setPass] = React.useState(1);

  return (
    <div className="flex flex-col gap-4">
      <TranscriptEditor
        segments={segments}
        speakers={SPEAKERS}
        selectedIds={applied}
        onSelectionChange={setRequested}
        onEdit={setEdit}
        onSeek={(_time, tokenId) => setSeeked(tokenId)}
      />

      <div className="flex flex-wrap items-end gap-6">
        <dl className="text-foreground grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs">
          <dt>selectedIds prop</dt>
          <dd data-testid="applied">{applied.join(", ") || "—"}</dd>
          <dt>last onSelectionChange</dt>
          <dd data-testid="requested">{requested === null ? "—" : requested.join(", ")}</dd>
          <dt>last onSeek token</dt>
          <dd data-testid="seeked">{seeked ?? "—"}</dd>
          <dt>last onEdit</dt>
          <dd data-testid="edit">
            {edit === null ? "—" : `${edit.type} ${edit.tokenIds?.join(", ") ?? ""}`.trim()}
          </dd>
          <dt>host render pass</dt>
          <dd data-testid="render-pass" className="tabular-nums">
            {pass}
          </dd>
        </dl>

        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => setPass((n) => n + 1)}>
            Re-render
          </Button>
          <Button
            size="sm"
            disabled={requested === null}
            onClick={() => requested !== null && setApplied(requested)}
          >
            Apply selection
          </Button>
          <Button
            size="sm"
            disabled={edit === null}
            onClick={() =>
              edit !== null &&
              setSegments((prev) =>
                prev.map((segment) => ({
                  ...segment,
                  tokens: segment.tokens.map((token) =>
                    edit.tokenIds?.includes(token.id) ? { ...token, deleted: true } : token,
                  ),
                })),
              )
            }
          >
            Apply edit
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * The optional text slots emptied at once, because a transcript really does
 * produce them: a media insert can arrive before anyone names it, and
 * diarisation hands over speakers with no name and segments pointing at a
 * speaker who is not in the list.
 *
 * What holds, and is asserted: a media chip keeps its kind. The name is built
 * as `"<noun>: <label>"`, so an unnamed image still announces "Image:" and
 * the icon keeps the chip a real target — 30×18 with the label gone. And a
 * `speakerId` pointing at nobody falls back to "Unknown speaker", so a
 * dangling reference stays legible.
 *
 * **Three gaps, measured and recorded rather than pinned.**
 *
 * An *empty* speaker name is not a missing one. `speakers.find(…)?.name ??
 * "Unknown speaker"` is a nullish fallback and `""` is not nullish, so the
 * empty name survives into everywhere it is interpolated: the listbox is left
 * named `"Transcript, "`, separator and all. Same class as the E/P wave's
 * `data-views` finding — a caller passing `""` to hide a heading gets a data
 * loss rather than a visual tweak.
 *
 * The "Unknown speaker" fallback is a display string that leaks into an edit.
 * It is handed to the `Input` as its `value`, so the field for the dangling
 * segment comes pre-filled with the literal words "Unknown speaker" — a host
 * applying `rename-speaker` from the first keystroke stores the placeholder.
 *
 * **And the fourth empty slot is not rendered here, because rendering it
 * fails the build.** A word token with `text: ""` — what an ASR pass emits
 * where it heard something and could not spell it — produces
 * `<span role="option" aria-selected="false" tabindex="-1">` with no
 * `aria-label` and no contents. Measured: axe fails it as
 * `aria-toggle-field-name` ("Element does not have text that is visible to
 * screen readers"), which `preview.tsx`'s `a11y: { test: "error" }` turns
 * into a red gate, and its box measures 8×0 — a selectable arrow stop nobody
 * can see or hear. That the story cannot exist is the sharpest statement of
 * the defect available, so it is left out rather than excluded or silenced:
 * the media chip's explicit naming is exactly the fallback the word case is
 * missing, two lines away from the `, deleted` suffix that already exists.
 * A naming fallback is a design decision about what an unspellable token
 * should announce, so it is recorded rather than swept in-wave.
 */
export const EmptyLabel: Story = {
  args: {
    speakers: [{ id: "sp-1", name: "" }],
    segments: [
      {
        id: "seg-empty",
        speakerId: "sp-1",
        tokens: [
          ...words("Every filler word is still in here", 0, "e"),
          { id: "unnamed", kind: "media", media: "image", label: "", start: 2.8, end: 4 },
        ],
      },
      {
        id: "seg-dangling",
        speakerId: "sp-gone",
        tokens: words("just struck out rather than gone", 6, "g"),
      },
    ],
    selectedIds: [],
  },
  play: async ({ canvasElement }) => {
    const el = root(canvasElement);
    const size = (node: HTMLElement) => {
      const box = node.getBoundingClientRect();
      return `${Math.round(box.width)}x${Math.round(box.height)}`;
    };

    // Holds: the chip keeps its kind and stays a visible target with no label.
    const chip = tokenAt(canvasElement, "unnamed");
    await expect(chip.getAttribute("aria-label")).toBe("Image: ");
    await expect(`chip size ${size(chip)}`).toBe("chip size 30x18");

    // Holds: a speakerId pointing at nobody is legible.
    const lists = Array.from(el.querySelectorAll('[role="listbox"]'));
    await expect(lists[1].getAttribute("aria-label")).toBe("Transcript, Unknown speaker");

    // Recorded: an empty name is not a missing one, so the listbox keeps the
    // separator and loses the speaker. Phrased as a readout rather than as an
    // expectation, so the day it is fixed the diff reads as a fix.
    await expect(`empty speaker gives: ${JSON.stringify(lists[0].getAttribute("aria-label"))}`).toBe(
      'empty speaker gives: "Transcript, "',
    );

    // Recorded: the display fallback is what the edit field is seeded with.
    const fields = Array.from(el.querySelectorAll<HTMLInputElement>("input"));
    await expect(`fields: ${fields.map((f) => JSON.stringify(f.value)).join(" / ")}`).toBe(
      'fields: "" / "Unknown speaker"',
    );
  },
};

/** ~106 characters of ordinary post-production talk, split as an ASR pass would. */
const LONG_LINE =
  "So the second pass came back at four hundred and eighty frames and the client wanted it under three hundred";

/** A speaker label after somebody corrects diarisation by hand — 40 characters. */
const LONG_SPEAKER = "Amara Osei (cinematographer, second unit)";

/**
 * Every author-supplied slot at once — the sentence, the speaker label, the
 * media chip's name, and a single token long enough to matter — because this
 * is a component where text *is* the interface and each slot decides
 * differently.
 *
 * **The word flow wraps and never truncates.** 106 characters take two lines
 * inside the 646px flow, nothing is clipped, and nothing scrolls sideways.
 * That is the right answer for a transcript: a truncated word is a word you
 * cannot select, and selection is the whole editing model.
 *
 * **The spaces between the words are not spaces.** They are `gap-x-1` on the
 * flex row, so the flow holds no whitespace text nodes at all and its
 * `textContent` reads
 * `"Sothesecondpasscamebackatfourhundred…"` — measured, and asserted below as
 * a readout so a fix reads as a fix. The words themselves are all present and
 * in order, which is what the assertion above it proves. What is lost is
 * everything that reads the DOM as prose rather than as tokens: a mouse-drag
 * selection copied out of the transcript comes back with the words run
 * together, and so does anything scraping the rendered page. Restoring it is
 * a rendering decision — a real space between tokens instead of a gap, which
 * changes what a click near a word boundary hits — so it is recorded, not
 * swept.
 *
 * **A single token cannot break, and that is the constraint worth knowing.**
 * Every token is a flex item with `min-width: auto`, so it can never render
 * narrower than its own min-content width — and min-content for a spoken URL
 * is the whole URL, because Chromium offers no break opportunity inside one.
 * Measured here: `huggingface.co/black-forest-labs/FLUX.1-dev` is 301px on a
 * single 28px line and the filename chip is 347px on a line of its own. Both
 * fit at 646px. Neither has room to spare at 375px, where the flow is 349px
 * wide (measured in `Mobile`) — so a filename two characters longer than this
 * one pushes the card sideways, and the component has no scroll container of
 * its own to absorb it. F3 `asset-detail` found the neighbouring shape from
 * the other direction: there a selectable phrase is an `inline-block` inside
 * running prose and takes a new line; here every token is already its own
 * flex item, so there is no line to continue and the same unbreakability
 * shows up as width rather than as a line break.
 *
 * **The speaker field is the one slot that clips, and it clips silently.**
 * `w-44` is a fixed 176px whatever the name is: measured, this 40-character
 * label needs 307px in a 174px content box, with no `title`, no wrap and no
 * growth. A reader who wants the rest has to put a caret in the field and
 * scroll it. The label survives in the *data* — asserted, because that is the
 * half that has to stay true — but not on screen, and a diarisation
 * correction reading "Amara Osei (cinematog" is a correction nobody can
 * check. Recorded rather than swept: a width is a design decision.
 */
export const LongContent: Story = {
  args: {
    speakers: [{ id: "sp-1", name: LONG_SPEAKER }],
    segments: [
      {
        id: "seg-long",
        speakerId: "sp-1",
        tokens: [
          ...words(LONG_LINE, 0, "L"),
          {
            id: "file",
            kind: "media",
            media: "video",
            label: "studio_floor_wide_take04_handheld_prores422hq.mov",
            start: 38,
            end: 43,
          },
          {
            id: "url",
            kind: "word",
            text: "huggingface.co/black-forest-labs/FLUX.1-dev",
            start: 43,
            end: 44.5,
          },
        ],
      },
    ],
    selectedIds: [],
  },
  play: async ({ canvasElement }) => {
    const el = root(canvasElement);
    const flow = slotOf(canvasElement, "transcript-editor-text");
    const lineHeight = Math.round(parseFloat(getComputedStyle(flow).lineHeight));
    const lineCount = (node: HTMLElement) => Math.round(node.getBoundingClientRect().height / lineHeight);

    // The sentence wraps across lines and is all still there.
    const rows = new Set(
      Array.from(el.querySelectorAll<HTMLElement>('[data-token-id^="L-"]')).map((t) =>
        Math.round(t.getBoundingClientRect().top),
      ),
    );
    await expect(`sentence lines: ${rows.size}`).toBe("sentence lines: 2");
    // All 20 words, in order. Joined with a space by this assertion and by
    // nothing else — see the description: the gaps between them are
    // `gap-x-1`, not whitespace.
    const spoken = Array.from(el.querySelectorAll<HTMLElement>('[data-token-id^="L-"]'))
      .map((t) => t.textContent)
      .join(" ");
    await expect(spoken).toBe(LONG_LINE);
    await expect(`separator in textContent: ${JSON.stringify(flow.textContent!.slice(2, 5))}`).toBe(
      'separator in textContent: "the"',
    );

    // Nothing clips and nothing scrolls sideways, at any level.
    await expect(`flow overflows: ${flow.scrollWidth > flow.clientWidth}`).toBe("flow overflows: false");
    await expect(`card overflows: ${el.scrollWidth > el.clientWidth}`).toBe("card overflows: false");

    // Each oversize token takes a whole line of its own rather than wrapping
    // inside itself — a flex item cannot break, and neither the slashes in a
    // URL nor the underscores in a filename are break opportunities.
    const url = tokenAt(canvasElement, "url");
    const file = tokenAt(canvasElement, "file");
    await expect(`url lines=${lineCount(url)} width=${Math.round(url.getBoundingClientRect().width)}`).toBe(
      "url lines=1 width=301",
    );
    await expect(`chip width=${Math.round(file.getBoundingClientRect().width)}`).toBe("chip width=347");

    // The speaker label is intact in the data even though the field cannot
    // show it. That is the half that must stay true; the clipping described
    // above it is recorded, not asserted.
    const field = el.querySelector<HTMLInputElement>("input")!;
    await expect(field.value).toBe(LONG_SPEAKER);
  },
};

/**
 * 375px, wrapper-constrained rather than `parameters.viewport` (mechanical
 * fact 2), and measured on the frame itself rather than on the meta's
 * `layout: "centered"` wrapper.
 *
 * Nothing scrolls sideways: the toolbar is `flex-wrap`, so Delete, Restore
 * and the status line rewrap instead of pushing, and the word flow was
 * already a wrapping flex row. The card is 373px and its flow 349px, which is
 * the number `LongContent` is measured against — a 48-character filename chip
 * is 347px, so a phone has two pixels of headroom on the widest single token
 * that fixture contains and no scroll container to fall back on.
 *
 * The narrow case is also where the component's shape is most obviously
 * right: 28 tokens across two speakers reflow into a column and the tab order
 * does not grow at all, because the stops are per segment while the wrap is
 * per token. Five here — Delete, two speaker fields, two roving tokens — with
 * Restore out of the order because nothing struck is selected; `KeyboardOrder`
 * has the same five plus Restore. A transcript built out of buttons would
 * have had 28 stops at this width.
 */
export const Mobile: Story = {
  args: { selectedIds: ["a-1", "a-2", "a-3"], currentTime: 2.0 },
  render: (args) => (
    <div className="w-[375px] max-w-full" data-testid="viewport">
      <TranscriptEditor {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const viewport = within(canvasElement).getByTestId("viewport");
    const el = root(canvasElement);
    const flow = slotOf(canvasElement, "transcript-editor-text");

    await expect(`frame width: ${Math.round(viewport.getBoundingClientRect().width)}`).toBe(
      "frame width: 375",
    );
    await expect(`viewport overflows: ${viewport.scrollWidth > viewport.clientWidth}`).toBe(
      "viewport overflows: false",
    );
    await expect(`card overflows: ${el.scrollWidth > el.clientWidth}`).toBe("card overflows: false");
    await expect(`flow width: ${flow.clientWidth}`).toBe("flow width: 349");

    // Five tab stops for 28 tokens — the count is per segment, so it does not
    // change with the width. Restore is disabled here (nothing struck is
    // selected), which is the only difference from `KeyboardOrder`'s six.
    const stops = el.querySelectorAll(
      'button:not([disabled]), input:not([disabled]), [data-token-id][tabindex="0"]',
    );
    await expect(stops).toHaveLength(5);
    await expect(el.querySelectorAll("[data-token-id]")).toHaveLength(28);
  },
};

/**
 * Three components in this catalog put a block of text beside a transport,
 * and from a screenshot two of them are this one. The rule is **what the
 * selection is made of.**
 *
 * - **H4 transcript editor** selects *tokens* — ids out of a list somebody
 *   else owns. The text is a view of an edit-decision list that exists
 *   because the media already exists, and deleting a run is a cut. Reach for
 *   it when there is an ASR pass behind the words.
 * - **E9 tts-composer** selects a *segment*, and its text is the source
 *   rather than a view: nothing has been recorded yet, and each segment is
 *   independently regenerable at its own price. The giveaway is direction —
 *   if editing the words is how the audio gets *made* it is E9, if editing
 *   the words is how the audio gets *cut* it is H4. Speaker labels against
 *   voice pickers is the same distinction one layer down: diarisation is a
 *   guess about a recording, a voice is a choice about a synthesis.
 * - **H6 waveform-editor** selects a *sample range* — two numbers, not a set
 *   of ids. Anything below the word (a plosive, a click, the breath between
 *   two words) has no token to select, so it cannot be reached from here at
 *   all. That is the boundary rather than a gap: H4 cuts what was said, H6
 *   cuts what was heard.
 *
 * A task that needs both — trim the breath *and* drop the sentence — composes
 * them over one edit-decision list rather than merging them into one
 * component.
 */
export const Boundary: Story = {
  render: () => (
    <div className="flex w-full max-w-2xl flex-col gap-6">
      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">
          H4 transcript editor — selects tokens out of a list the host owns
        </p>
        <TranscriptEditor
          segments={SEGMENTS}
          speakers={SPEAKERS}
          selectedIds={["a-1", "a-2", "a-3"]}
          currentTime={2.0}
          onSelectionChange={fn()}
          onEdit={fn()}
          onSeek={fn()}
        />
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">
          E9 tts composer — selects a segment, and the text is the source
        </p>
        <TtsComposer
          segments={[
            {
              id: "s1",
              text: "We cut the intro down to nine seconds and honestly it still lands.",
              voice: "Bella — Warm",
              emotion: "Warm",
              status: "ready",
              durationLabel: "0:05",
              regenerateCost: 2,
            },
            {
              id: "s2",
              text: "Every filler word is still in here, just struck out rather than gone.",
              voice: "Atlas — Deep",
              emotion: "Neutral",
              status: "idle",
              regenerateCost: 2,
            },
          ]}
          selectedSegmentId="s2"
          onSelectSegment={fn()}
          onSegmentTextChange={fn()}
          onRegenerateSegment={fn()}
        />
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">
          H6 waveform editor — selects a sample range, below the word
        </p>
        <WaveformEditor
          peaks={Array.from({ length: 256 }, (_, i) => {
            const t = i / 256;
            const breath = t > 0.42 && t < 0.52 ? 0.08 : 1;
            return Math.abs(Math.sin(t * 26)) * (0.35 + 0.6 * Math.sin(Math.PI * t)) * breath;
          })}
          sampleCount={131_072}
          sampleRate={44_100}
          label="Interview take 3"
          view={{ start: 0, end: 131_072 }}
          region={{ start: 54_000, end: 68_500, label: "Breath" }}
          playhead={54_000}
          onRegionChange={fn()}
          onScrub={fn()}
          onViewChange={fn()}
        />
      </section>
    </div>
  ),
};
