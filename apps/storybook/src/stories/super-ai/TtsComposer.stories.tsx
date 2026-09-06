import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { GenerationQueue } from "@/registry/super-ai/generation-queue";
import { TtsComposer, type TtsComposerProps } from "@/registry/super-ai/tts-composer";
import { TtsComposerDocs } from "@/content/components/tts-composer.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const meta: Meta<typeof TtsComposer> = {
  title: "Super AI/Tts Composer",
  component: TtsComposer,
  parameters: { layout: "centered", docs: { page: componentDocsPage(TtsComposerDocs) } },
};

export default meta;
type Story = StoryObj<typeof TtsComposer>;

const VOICE_OPTIONS = ["Bella — Warm", "Atlas — Deep", "Nova — Bright"];
const EMOTION_OPTIONS = ["Neutral", "Warm", "Excited", "Serious"];

/**
 * One segment picked for editing. Selection is the only thing that expands the
 * Voice / Emotion / Speed inspector, so it is what turns a flat list of takes
 * into an editable document — the other two segments keep their text and their
 * own controls, and only the settings grid moves.
 *
 * Read the trailing cluster left to right: status badge, Select, Play,
 * Regenerate, price. Every one of those is scoped to its own segment, which is
 * the whole premise of the component.
 */
export const SegmentSelect: Story = {
  args: {
    segments: [
      {
        id: "s1",
        text: "Welcome back to Signal Boost — the show about products people actually finish building.",
        voice: "Bella — Warm",
        emotion: "Warm",
        status: "ready",
        durationLabel: "0:05",
        regenerateCost: 2,
      },
      {
        id: "s2",
        text: "Today we're talking about the part of a design system nobody puts on the roadmap.",
        voice: "Bella — Warm",
        emotion: "Neutral",
        status: "ready",
        durationLabel: "0:04",
        regenerateCost: 2,
      },
      {
        id: "s3",
        text: "Our guest spent three years shipping the component library at a company you've used.",
        voice: "Atlas — Deep",
        emotion: "Excited",
        speed: 1.2,
        status: "idle",
        regenerateCost: 3,
      },
    ],
    selectedSegmentId: "s2",
    onSelectSegment: () => {},
    onSegmentTextChange: () => {},
    voiceOptions: VOICE_OPTIONS,
    emotionOptions: EMOTION_OPTIONS,
    onSegmentVoiceChange: () => {},
    onSegmentEmotionChange: () => {},
    onSegmentSpeedChange: () => {},
    onRegenerateSegment: () => {},
  },
};

/**
 * Three segments in three different places in the same generation loop: one
 * take already good, one in flight, one that came back wrong. Each carries its
 * own price, and there is no control anywhere that regenerates all three —
 * that absence is the design, not an omission (gaps.md R6: whole-script
 * regeneration wastes credits and discards good takes).
 *
 * Note what the failed segment keeps: its text, its voice and its price are
 * all still there, so retrying is one press rather than a re-authoring job.
 */
export const PerSegmentRegenerate: Story = {
  args: {
    segments: [
      {
        id: "s1",
        text: "Welcome back to Signal Boost.",
        voice: "Bella — Warm",
        status: "ready",
        durationLabel: "0:03",
        regenerateCost: 2,
      },
      {
        id: "s2",
        text: "Today we're talking about accessibility in design systems.",
        voice: "Bella — Warm",
        status: "generating",
        regenerateCost: 2,
      },
      {
        id: "s3",
        text: "Here's a take that came out wrong the first time.",
        voice: "Atlas — Deep",
        status: "failed",
        regenerateCost: 3,
      },
    ],
    onSelectSegment: () => {},
    onRegenerateSegment: () => {},
  },
};

/**
 * The transport running. `isPlayingScript` drives the header button and
 * `playingSegmentId` marks the segment currently audible — one field, whether
 * the transport or a single-segment preview started it, which is what keeps
 * the second segment showing Pause while the header does too.
 *
 * The pair is also what the visually hidden live region reads: "Playing script
 * — Segment 2". Stopping clears it to an empty string, and an empty string
 * announces nothing, so a screen-reader user hears the start of playback and
 * not the end of it.
 */
export const WholeScriptPlay: Story = {
  args: {
    segments: [
      { id: "s1", text: "Welcome back to Signal Boost.", voice: "Bella — Warm", status: "ready", durationLabel: "0:03" },
      {
        id: "s2",
        text: "Today we're talking about accessibility in design systems.",
        voice: "Bella — Warm",
        status: "ready",
        durationLabel: "0:05",
      },
      {
        id: "s3",
        text: "Our guest spent three years shipping the component library everyone uses.",
        voice: "Atlas — Deep",
        status: "ready",
        durationLabel: "0:07",
      },
    ],
    isPlayingScript: true,
    playingSegmentId: "s2",
    scriptDurationLabel: "0:15",
    onPlayScript: () => {},
    onPauseScript: () => {},
    onPlaySegment: () => {},
    onPauseSegment: () => {},
    onSelectSegment: () => {},
    onRegenerateSegment: () => {},
  },
};

/* -------------------------------------------------------------------------
 * Case stories — the situations this component meets in a product, as opposed
 * to the prop combinations above. All eight of story-conventions.md's names
 * are true here, so nothing is skipped.
 *
 * Note for anyone reaching for the spec: E9 has no section in
 * component-specs.md and never has. The manifest's `specAnchor` is a synthesised
 * dead link (CONTINUE.md §5 item 4). These stories are written against the
 * catalog.md E9 row, gaps.md §2 R6 and the shipped docs module instead.
 * ---------------------------------------------------------------------- */

/** A short script used wherever a story needs more than one row. */
const NARRATION: TtsComposerProps["segments"] = [
  {
    id: "s1",
    text: "Open the project you want to narrate and pick a voice for the whole script.",
    voice: "Bella — Warm",
    emotion: "Warm",
    status: "ready",
    durationLabel: "0:04",
    regenerateCost: 2,
  },
  {
    id: "s2",
    text: "Every line you add becomes its own segment, with its own voice and speed.",
    voice: "Atlas — Deep",
    emotion: "Neutral",
    speed: 1.4,
    status: "ready",
    durationLabel: "0:05",
    regenerateCost: 2,
  },
];

/**
 * Right-to-left. Most of the layout mirrors for free — the component carries no
 * physical padding, margin or border classes at all, `entity-row` already uses
 * `text-start`, and `UnitInput` already uses `text-end`/`pe-2` — so the header
 * transport, the row gutters and the speed field all follow the writing
 * direction without a swap.
 *
 * **Defect this story found, recorded rather than pinned: the row description
 * splits its speed unit from its number.** The description is one interpolated
 * string, `voice · emotion · 1.4×`, and `×` is a bidi neutral with a European
 * number on one side and the paragraph boundary on the other, so it resolves to
 * the paragraph direction and is laid out as its own right-to-left run. Measured
 * here: the `×` renders to the **left** of the first letter of the description,
 * at the far end of the line from the number it multiplies. A2 `cost-chip` has
 * the fix already — `dir="ltr"` on the amount-and-unit span — but applying it
 * here means splitting `meta` into nodes rather than a string, which is a
 * component change with a shape decision in it, not a class swap. Same class as
 * D3 `context-chips`' `@teammate` finding from wave 1.
 *
 * Also inherited and not fixable here: no `DirectionProvider` is mounted
 * anywhere in the app shell, so the Voice and Emotion `Select` popups resolve
 * their side from `useDirection()`'s `"ltr"` fallback regardless of this
 * wrapper (CONTINUE.md §8). That is a shell-level decision.
 */
export const RTL: Story = {
  args: {
    segments: [
      { id: "s1", text: "افتح المشروع الذي تريد سرده.", voice: "Nova", emotion: "Warm", speed: 1.4, status: "ready", durationLabel: "0:04", regenerateCost: 2 },
      { id: "s2", text: "كل سطر تضيفه يصبح مقطعًا مستقلًا.", voice: "Nova", emotion: "Neutral", status: "idle", regenerateCost: 2 },
    ],
    selectedSegmentId: "s1",
    scriptDurationLabel: "0:09",
    voiceOptions: ["Nova", "Atlas"],
    emotionOptions: EMOTION_OPTIONS,
    onSelectSegment: () => {},
    onSegmentTextChange: () => {},
    onSegmentVoiceChange: () => {},
    onSegmentEmotionChange: () => {},
    onSegmentSpeedChange: () => {},
    onRegenerateSegment: () => {},
    onPlayScript: () => {},
  },
  render: (args) => (
    <div dir="rtl" className="w-[480px] max-w-full">
      <TtsComposer {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const description = canvasElement.querySelector<HTMLElement>('[data-slot="entity-row-description"]')!;
    await expect(getComputedStyle(description).direction).toBe("rtl");

    const text = description.firstChild as Text;
    await expect(text.textContent).toBe("Nova · Warm · 1.4×");

    const xOf = (start: number, end: number) => {
      const range = document.createRange();
      range.setStart(text, start);
      range.setEnd(text, end);
      return range.getBoundingClientRect().left;
    };
    // The `×` is the last character logically. If bidi kept it with its
    // number it would sit to the right of the first letter; it does not.
    const timesSign = xOf(text.length - 1, text.length);
    const firstLetter = xOf(0, 1);
    await expect(`× left of the description: ${timesSign < firstLetter}`).toBe("× left of the description: true");
  },
};

/**
 * Two things spin in this component and both are keyed off generation, not
 * decoration: the segment's status icon while a take is rendering, and the
 * arrows inside its own Regenerate button. Neither branched on
 * `prefers-reduced-motion` — measured before the fix, `animation-name` read
 * `"spin"` under emulated reduce — so both got the registry's one-class remedy,
 * `motion-reduce:animate-none`, at this component's call sites. That is the
 * §3.4 mechanical fix, and the assertions below read `animation-name` back
 * rather than trusting the class.
 *
 * The Voice select is opened here because a Base UI popup is where a bare
 * `motion-reduce:animate-none` normally goes inert (story-conventions.md fact
 * 3). It does not need the restated pair: the vendored `SelectContent` passes
 * `alignItemWithTrigger` and carries `data-[align-trigger=true]:animate-none`,
 * which already wins the same source-order tie, so the popup measures `"none"`
 * untouched. Recorded because the next reader will otherwise assume the
 * `context-toolbar`/`account-menu` fix is missing here.
 *
 * Nothing else moves. The slider thumb's `transition-[box-shadow]` crossfades a
 * ring and changes no position — the `reset-affordance` case in the convention,
 * where suppressing it would document a branch nobody can perceive. The press
 * nudge every vendored `Button` carries (`transition-all` plus
 * `active:translate-y-px`) is a primitive-wide posture recorded in CONTINUE.md
 * §8, not this component's to branch.
 */
export const ReducedMotion: Story = {
  args: {
    segments: [
      {
        id: "s1",
        text: "Every line you add becomes its own segment, with its own voice and speed.",
        voice: "Bella — Warm",
        emotion: "Warm",
        status: "generating",
        regenerateCost: 2,
      },
    ],
    selectedSegmentId: "s1",
    voiceOptions: VOICE_OPTIONS,
    emotionOptions: EMOTION_OPTIONS,
    onSelectSegment: () => {},
    onSegmentTextChange: () => {},
    onSegmentVoiceChange: () => {},
    onSegmentEmotionChange: () => {},
    onSegmentSpeedChange: () => {},
    onRegenerateSegment: () => {},
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // The status icon inside entity-row's icon slot.
    const statusIcon = canvasElement.querySelector<SVGElement>('[data-slot="entity-row-icon"] svg')!;
    await expect(getComputedStyle(statusIcon).animationName).toBe("none");

    // …and the arrows inside the Regenerate button, which spin off the same
    // status and were a separate class string.
    const regenerate = canvas.getByRole("button", { name: "Regenerate Segment 1" });
    await expect(getComputedStyle(regenerate.querySelector("svg")!).animationName).toBe("none");

    // The popup: a Base UI select, opened so the frame the bare class fails to
    // reach is the one measured.
    await userEvent.click(canvas.getByRole("combobox", { name: "Voice for Segment 1" }));
    await within(document.body).findByRole("listbox");
    const popup = document.body.querySelector<HTMLElement>('[data-slot="select-content"]')!;
    await expect(popup).toHaveAttribute("data-open");
    await expect(getComputedStyle(popup).animationName).toBe("none");
  },
};

/**
 * The tab sequence, walked live rather than statically — because the surprising
 * thing about this component's keyboard model is that the sequence rewrites
 * itself as you move through it. Focusing a segment's script `Textarea` calls
 * `onSelectSegment`, so tabbing off Regenerate onto the text field **expands
 * that segment** and adds up to five stops directly in front of the cursor,
 * while the previously selected segment collapses behind it. A host wired to
 * `onSelectSegment` is the ordinary case, so that is what this story renders.
 *
 * What the lap pins:
 *
 * 1. Nothing is selected on mount, so the first segment contributes four stops
 *    — Select, Play, Regenerate, script text — and the fifth tab has nowhere to
 *    go until the fourth one has created it.
 * 2. Every per-segment control carries a name distinct from its twin on the
 *    row above, and the lookups below are by exact accessible name, so a
 *    duplicate throws rather than passing quietly. That contract is the reason
 *    `segmentLabel` exists (see `EmptyLabel` for what happens without it), and
 *    it is the shape wave 1 found broken on I2 `property-inspector`.
 * 3. Disabled controls leave the sequence rather than sitting in it inert: the
 *    second segment is `idle`, so its Play is skipped, and its speed is 1, so
 *    its Reset is skipped. Both stop counts move under the user as generations
 *    land, which is the honest reading of "a segment is four tab stops".
 * 4. Every stop is `:focus-visible` and shows a ring — with two documented
 *    exceptions, below.
 *
 * **Two defects found here, recorded rather than pinned.**
 *
 * *The speed slider thumb has no keyboard focus treatment.* Base UI's
 * `Slider.Thumb` renders a `<div>` with a visually hidden `<input type="range">`
 * inside it, and the tab stop is the input — confirmed here, `getByRole("slider")`
 * resolves to `INPUT[type=range]`. The ring is `focus-visible:ring-3` on the
 * div, and a div containing a focused input never matches `:focus-visible`, so
 * the selector cannot fire. Measured focused against resting, the thumb's
 * computed `box-shadow` is byte-identical, and its four Tailwind ring slots are
 * transparent at `0px 0px 0px 0px` in both states — what is left is
 * `shadow-sm`, which is there when nothing is focused either. The browser's own
 * ring lands on the input, which is clipped to nothing, so it paints nothing.
 * E3 `parameter-panel`'s `ParameterSlider` carries the identical class string,
 * so this is one decision for two components — the shared `ParameterSlider`
 * promotion CONTINUE.md §5.11 already asks for — and the walk asserts
 * `:focus-visible` on the input and stops there. Same shape as D6
 * `skill-menu`'s ring selector that never matches.
 *
 * *The numeric speed field paints its ring on a wrapper, not on the stop.*
 * `UnitInput` puts `focus-within:ring-2` on the `<span>` around the `<input>`,
 * so the treatment is real and visible but does not belong to the focused
 * element. The check allows a `[data-slot="unit-input"]` ancestor for that one
 * stop rather than reporting a failure that a user would not see.
 */
export const KeyboardOrder: Story = {
  args: {
    segments: [
      {
        id: "s1",
        text: "Open the project you want to narrate and pick a voice for the whole script.",
        voice: "Bella — Warm",
        emotion: "Warm",
        speed: 1.4,
        status: "ready",
        durationLabel: "0:04",
        regenerateCost: 2,
      },
      {
        id: "s2",
        text: "Every line you add becomes its own segment, with its own voice and speed.",
        voice: "Atlas — Deep",
        emotion: "Neutral",
        status: "idle",
        regenerateCost: 2,
      },
    ],
    voiceOptions: VOICE_OPTIONS,
    emotionOptions: EMOTION_OPTIONS,
    onSegmentTextChange: () => {},
    onSegmentVoiceChange: () => {},
    onSegmentEmotionChange: () => {},
    onSegmentSpeedChange: () => {},
    onRegenerateSegment: () => {},
    onPlayScript: () => {},
    onPlaySegment: () => {},
  },
  render: (args) => <SelectionHost {...args} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Nothing is expanded yet: the settings group only exists for a selected
    // segment, and no segment is selected on mount.
    await expect(canvas.queryByRole("group", { name: /settings$/ })).toBeNull();

    /**
     * The stops, in order, each looked up by exact accessible name. The
     * lookups are thunks because six of them do not exist yet when the walk
     * starts — focusing a script field is what creates them.
     */
    const stops: Array<[string, () => HTMLElement]> = [
      ["Play script", () => canvas.getByRole("button", { name: "Play script" })],
      ["Select Segment 1", () => canvas.getByRole("button", { name: "Select Segment 1" })],
      ["Play Segment 1", () => canvas.getByRole("button", { name: "Play Segment 1" })],
      ["Regenerate Segment 1", () => canvas.getByRole("button", { name: "Regenerate Segment 1" })],
      ["Segment 1 script text", () => canvas.getByRole("textbox", { name: "Segment 1 script text" })],
      ["Voice for Segment 1", () => canvas.getByRole("combobox", { name: "Voice for Segment 1" })],
      ["Emotion for Segment 1", () => canvas.getByRole("combobox", { name: "Emotion for Segment 1" })],
      ["Speed for Segment 1", () => canvas.getByRole("slider", { name: "Speed for Segment 1" })],
      ["Speed for Segment 1 value", () => canvas.getByRole("spinbutton", { name: "Speed for Segment 1 value" })],
      ["Reset speed for Segment 1", () => canvas.getByRole("button", { name: "Reset speed for Segment 1" })],
      ["Select Segment 2", () => canvas.getByRole("button", { name: "Select Segment 2" })],
      // Play Segment 2 is `idle`, so it is disabled and not a stop.
      ["Regenerate Segment 2", () => canvas.getByRole("button", { name: "Regenerate Segment 2" })],
      ["Segment 2 script text", () => canvas.getByRole("textbox", { name: "Segment 2 script text" })],
      ["Voice for Segment 2", () => canvas.getByRole("combobox", { name: "Voice for Segment 2" })],
      ["Emotion for Segment 2", () => canvas.getByRole("combobox", { name: "Emotion for Segment 2" })],
      ["Speed for Segment 2", () => canvas.getByRole("slider", { name: "Speed for Segment 2" })],
      ["Speed for Segment 2 value", () => canvas.getByRole("spinbutton", { name: "Speed for Segment 2 value" })],
      // Reset speed for Segment 2 is at 1, so it is disabled and not a stop.
    ];

    // The slider thumb's treatment is measured focused-versus-resting rather
    // than as a boolean: the thumb ships `shadow-sm`, so a bare "is there a
    // box-shadow" check reports a ring that is really the resting shadow.
    let thumbFocused = "";
    let thumbResting = "";
    const thumbOf = (el: HTMLElement) => el.closest<HTMLElement>('[data-slot="tts-composer-speed-thumb"]')!;

    const ringed = (el: HTMLElement) => {
      // UnitInput paints its ring on the wrapper span, not on the input that
      // takes the focus. Allow that one ancestor rather than failing on a
      // treatment the user can see.
      const painted = el.closest<HTMLElement>('[data-slot="unit-input"]') ?? el;
      const style = getComputedStyle(painted);
      return style.boxShadow !== "none" || style.outlineStyle !== "none";
    };

    for (let i = 0; i < stops.length; i += 1) {
      const [name, find] = stops[i];
      const previous = document.activeElement;
      await userEvent.tab();
      // Settle on departure: wait for focus to leave the stop it was on, so
      // every tab is provably one move rather than a stale read.
      await waitFor(() => {
        if (document.activeElement === previous) throw new Error(`focus has not left ${name}'s predecessor yet`);
      });
      const expected = find();
      await expect(`stop ${i} is ${document.activeElement === expected ? name : "something else"}`).toBe(
        `stop ${i} is ${name}`,
      );
      await expect(`${name} focusVisible=${expected.matches(":focus-visible")}`).toBe(`${name} focusVisible=true`);

      // The slider thumb is the one stop with no ring. Recorded above, not
      // pinned in either direction: it is measured below instead.
      if (expected.getAttribute("type") === "range") {
        thumbFocused = getComputedStyle(thumbOf(expected)).boxShadow;
      } else {
        await expect(`${name} ring=${ringed(expected)}`).toBe(`${name} ring=true`);
      }
      if (name === "Speed for Segment 1 value") {
        thumbResting = getComputedStyle(
          canvasElement.querySelector<HTMLElement>('[data-slot="tts-composer-speed-thumb"]')!,
        ).boxShadow;
      }

      // Focusing a script field expands its own segment and collapses the
      // one before it — the tab order rewriting itself mid-walk.
      if (name === "Segment 1 script text") {
        await waitFor(() => expect(canvas.getByRole("group", { name: "Segment 1 settings" })).toBeInTheDocument());
      }
      if (name === "Segment 2 script text") {
        await waitFor(() => expect(canvas.getByRole("group", { name: "Segment 2 settings" })).toBeInTheDocument());
        await expect(canvas.queryByRole("group", { name: "Segment 1 settings" })).toBeNull();
      }
    }

    // The measurement behind the slider finding: the thumb paints exactly the
    // same box-shadow whether or not the input inside it holds focus, and its
    // ring slots are transparent in both. Both reads are asserted non-empty
    // first, so a branch that stops running fails rather than comparing two
    // empty strings and passing.
    await expect(`focused read: ${thumbFocused !== ""} resting read: ${thumbResting !== ""}`).toBe(
      "focused read: true resting read: true",
    );
    await expect(`thumb focused: ${thumbFocused}`).toBe(`thumb focused: ${thumbResting}`);
    await expect(`thumb ring slots transparent: ${thumbFocused.startsWith("rgba(0, 0, 0, 0) 0px 0px 0px 0px")}`).toBe(
      "thumb ring slots transparent: true",
    );

    // Disabled controls are present and out of the sequence, not absent.
    await expect(canvas.getByRole("button", { name: "Play Segment 2" })).toBeDisabled();
    await expect(canvas.getByRole("button", { name: "Reset speed for Segment 2" })).toBeDisabled();

    // One more tab leaves the component entirely.
    await userEvent.tab();
    await expect(canvasElement.contains(document.activeElement)).toBe(false);
  },
};

/**
 * Every value this component renders comes from props — it holds no state of
 * its own at all — so a host that logs requests and refuses to apply them is
 * the whole test. Four independent controlled pairs are driven here, and each
 * has to behave the same way: the interaction moves nothing on screen, and the
 * callback carries what a host needs to apply it.
 *
 * The third clause is the one that catches drift, and the log is state, so
 * every refusal above re-renders the composer with unchanged props. Nothing
 * moves, because there is no second copy of any value to fall out of step.
 *
 * Two things worth reading off the request log rather than the screen:
 *
 * - **Focusing a script field is a selection request.** The `Textarea`'s
 *   `onFocus` calls `onSelectSegment`, so a host sees `select:s1` before it
 *   ever sees a text change. A host that treats selection as expensive will be
 *   surprised by that.
 * - **The transport callbacks carry no payload.** `onPlayScript` and
 *   `onPauseScript` take no argument, so which of the two fired is the entire
 *   message — correct for a toggle whose next value is implied, and worth
 *   naming because the per-segment callbacks all carry an id.
 */
export const Controlled: Story = {
  args: {
    segments: NARRATION,
    selectedSegmentId: "s2",
    voiceOptions: VOICE_OPTIONS,
    emotionOptions: EMOTION_OPTIONS,
    scriptDurationLabel: "0:09",
  },
  render: (args) => <RefusingHost {...args} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const log = () => canvas.getByTestId("requests");

    // Selection: reported, not applied.
    await userEvent.click(canvas.getByRole("button", { name: "Select Segment 1" }));
    await expect(canvas.getByRole("button", { name: "Select Segment 1" })).toHaveAttribute("aria-pressed", "false");
    await expect(canvas.getByRole("button", { name: "Select Segment 2" })).toHaveAttribute("aria-pressed", "true");
    await expect(canvas.getByRole("group", { name: "Segment 2 settings" })).toBeInTheDocument();
    await expect(canvas.queryByRole("group", { name: "Segment 1 settings" })).toBeNull();
    await expect(log()).toHaveTextContent("select:s1");

    // Script text: the whole next value, not the keystroke — and the field
    // does not move.
    const field = canvas.getByRole("textbox", { name: "Segment 1 script text" });
    const before = (field as HTMLTextAreaElement).value;
    await userEvent.type(field, "!");
    await expect(field).toHaveValue(before);
    await expect(log()).toHaveTextContent(`text:s1:${before}!`);

    // Whole-script transport: no payload, and the button keeps its label.
    await userEvent.click(canvas.getByRole("button", { name: "Play script" }));
    await expect(canvas.getByRole("button", { name: "Play script" })).toHaveAttribute("aria-pressed", "false");
    await expect(log()).toHaveTextContent("playScript");

    // Per-segment playback: an id, and the row keeps its Play label.
    await userEvent.click(canvas.getByRole("button", { name: "Play Segment 1" }));
    await expect(canvas.getByRole("button", { name: "Play Segment 1" })).toHaveAttribute("aria-pressed", "false");
    await expect(log()).toHaveTextContent("play:s1");

    // Four re-renders later, nothing has drifted.
    await expect(canvas.getByRole("button", { name: "Select Segment 2" })).toHaveAttribute("aria-pressed", "true");
    await expect(canvas.getByRole("textbox", { name: "Segment 1 script text" })).toHaveValue(before);
  },
};

/**
 * Every optional slot left out: no `emotion` and no `emotionOptions`, no
 * `voiceOptions`, no `durationLabel`, no `regenerateCost`, no
 * `scriptDurationLabel`. What is left is what a caller gets for free, and the
 * finding is how much of the inspector goes with them.
 *
 * - The Emotion row is not a disabled row, it is **no row**. `showEmotionRow`
 *   is false when neither the segment nor the caller supplies an emotion, so
 *   the settings grid silently changes height between segments in the same
 *   script — one with an emotion and one without do not line up.
 * - Voice degrades from a picker to inert text, so the expanded settings of a
 *   selected segment contain exactly two focusable controls (the speed slider
 *   and its numeric field) rather than four. Selecting a segment is still worth
 *   doing, but far less of it is reachable.
 * - No price anywhere. A regenerate control with no `regenerateCost` still
 *   works and still spends credits; the number is the only thing that made the
 *   spend visible before the press.
 *
 * **The hazard this story deliberately does not render:** `segmentLabel` is the
 * root of every per-row accessible name, and it is optional with a default.
 * Passing `() => ""` typechecks and produces "Select", "Play", "Regenerate" and
 * "script text" — non-empty names, so no axe `button-name` violation and no
 * gate anywhere sees it — repeated identically on every row of the script. That
 * is the duplicate-name shape wave 1 found on I2 `property-inspector`, reached
 * by a caller rather than by the component. It belongs in the docs page's
 * donts, not in an axe-gated render.
 */
export const EmptyLabel: Story = {
  args: {
    segments: [
      {
        id: "s1",
        text: "Open the project you want to narrate and pick a voice for the whole script.",
        voice: "Bella — Warm",
        speed: 1.4,
        status: "ready",
      },
      {
        id: "s2",
        text: "Every line you add becomes its own segment, with its own voice and speed.",
        voice: "Atlas — Deep",
        status: "idle",
      },
    ],
    selectedSegmentId: "s1",
    onSelectSegment: () => {},
    onSegmentTextChange: () => {},
    onSegmentSpeedChange: () => {},
    onRegenerateSegment: () => {},
    onPlayScript: () => {},
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // No pickers at all — Voice is text, Emotion is gone.
    await expect(canvas.queryAllByRole("combobox")).toHaveLength(0);
    const settings = canvas.getByRole("group", { name: "Segment 1 settings" });
    await expect(within(settings).queryByText("Emotion")).toBeNull();
    await expect(within(settings).getByText("Voice")).toBeInTheDocument();

    // Two focusable controls left in the whole inspector, plus the reset.
    const focusable = settings.querySelectorAll('input, button:not([disabled]), [tabindex]:not([tabindex="-1"])');
    await expect(Array.from(focusable).map((el) => el.getAttribute("aria-label"))).toEqual([
      "Speed for Segment 1",
      "Speed for Segment 1 value",
      "Reset speed for Segment 1",
    ]);

    // Names still resolve, because segmentLabel has a default.
    await expect(canvas.getByRole("button", { name: "Select Segment 2" })).toBeInTheDocument();

    // Nothing is priced, and the header carries no runtime.
    await expect(canvasElement.querySelectorAll('[data-slot="cost-chip"]')).toHaveLength(0);
    await expect(canvasElement.querySelector('[data-slot="tts-composer-duration"]')).toBeNull();
  },
};

/**
 * A script segment far past the length anyone drafts by hand, beside a voice
 * preset name long enough to overrun the row. The two long slots resolve
 * differently, and only this story says so:
 *
 * - **The script text grows.** `Textarea` ships `field-sizing-content` with a
 *   `min-h-16` floor, so a long segment makes its own row taller rather than
 *   scrolling inside a fixed box. That is the right answer for an editable
 *   field and it means a long script is a long page, with no internal scroll to
 *   get lost in.
 * - **The row summary truncates and loses what it cut.** `entity-row` marks its
 *   title and its description `truncate`, and this component passes the
 *   `voice · emotion · speed` string straight in, so a long voice name is
 *   clipped with no `title` attribute and no other rendering of the same fact.
 *   The selected segment can still read its voice out of the Voice picker; an
 *   unselected one cannot read it anywhere. Recorded, not fixed — the same
 *   missing-`title` finding wave 1 recorded on D3 `context-chips`.
 */
export const LongContent: Story = {
  args: {
    segments: [
      {
        id: "s1",
        text: "Open the project you want to narrate, pick a voice for the whole script, and then adjust any segment that comes back reading faster or flatter than the rest of the take.",
        voice: "Bella — Warm and unhurried, mid-Atlantic",
        emotion: "Warm",
        status: "ready",
        durationLabel: "0:11",
        regenerateCost: 4,
      },
    ],
    onSelectSegment: () => {},
    onSegmentTextChange: () => {},
    onRegenerateSegment: () => {},
  },
  render: (args) => (
    <div className="w-[520px] max-w-full">
      <TtsComposer {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // The field grew past its floor rather than scrolling inside it.
    const field = canvas.getByRole("textbox", { name: "Segment 1 script text" });
    await expect(`textarea grew past min-h-16: ${field.clientHeight > 64}`).toBe("textarea grew past min-h-16: true");
    await expect(`textarea scrolls internally: ${field.scrollHeight > field.clientHeight + 1}`).toBe(
      "textarea scrolls internally: false",
    );

    // The summary clipped, and kept no way to recover what it clipped.
    const description = canvasElement.querySelector<HTMLElement>('[data-slot="entity-row-description"]')!;
    await expect(`description truncated: ${description.scrollWidth > description.clientWidth}`).toBe(
      "description truncated: true",
    );
    await expect(description).not.toHaveAttribute("title");
  },
};

/**
 * 375px, with the trailing cluster a real script actually carries: a status
 * badge, three icon buttons and a price, all `shrink-0`. `entity-row` gives the
 * title and description `min-w-0 flex-1`, so they collapse first and the row
 * holds — measured here, the composer does not scroll sideways.
 *
 * What it costs is the summary. At this width the `voice · emotion · speed`
 * description is clipped to a few characters while the trailing controls keep
 * their full footprint, so on a phone the row reads as five controls attached
 * to a title, and the voice a segment is using is effectively invisible until
 * you select it. That is the honest tradeoff of a `shrink-0` action cluster,
 * and it is the strongest argument for the `LongContent` finding above being
 * worth fixing.
 *
 * The settings grid holds at this width too: `field-row`'s `6rem` label column
 * plus the speed slider and its `w-20` numeric field fit inside 375px with room
 * left, so nothing about the inspector is phone-hostile.
 */
export const Mobile: Story = {
  args: {
    segments: NARRATION,
    selectedSegmentId: "s2",
    scriptDurationLabel: "0:09",
    voiceOptions: VOICE_OPTIONS,
    emotionOptions: EMOTION_OPTIONS,
    onSelectSegment: () => {},
    onSegmentTextChange: () => {},
    onSegmentVoiceChange: () => {},
    onSegmentEmotionChange: () => {},
    onSegmentSpeedChange: () => {},
    onRegenerateSegment: () => {},
    onPlayScript: () => {},
  },
  render: (args) => (
    <div className="w-[375px] max-w-full">
      <TtsComposer {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="tts-composer"]')!;
    await expect(`composer scrolls sideways: ${root.scrollWidth > root.clientWidth}`).toBe(
      "composer scrolls sideways: false",
    );

    // The row holds by collapsing its summary, not by shrinking its controls.
    const description = canvasElement.querySelector<HTMLElement>('[data-slot="entity-row-description"]')!;
    await expect(`description clipped at 375px: ${description.scrollWidth > description.clientWidth}`).toBe(
      "description clipped at 375px: true",
    );

    // Every tap target clears WCAG 2.2's 24×24 floor: `icon-sm` is 28×28.
    const actions = canvasElement.querySelectorAll<HTMLElement>('[data-slot="tts-composer-segment-actions"] button');
    const undersized = Array.from(actions).filter(
      (el) => el.getBoundingClientRect().width < 24 || el.getBoundingClientRect().height < 24,
    );
    await expect(`undersized targets: ${undersized.length}`).toBe("undersized targets: 0");
  },
};

/**
 * Beside E6 `generation-queue`, the component it is most often mistaken for.
 * Both are a vertical list of A9 rows with a per-row status badge and per-row
 * buttons, and they are not interchangeable. The rule is about what the list
 * *is*:
 *
 * - **A generation queue is work in flight.** Its rows are jobs the user
 *   already committed to; they arrive, progress and leave. The only per-row
 *   verbs are Cancel and Retry, and a row has no content to edit because the
 *   content is the thing being produced.
 * - **A TTS composer is a document.** Its rows are the script, and they persist
 *   whether or not anything is generating. Each row owns editable text and its
 *   own voice, emotion and speed, and its per-row verb is Regenerate — priced,
 *   because it spends credits the user has not committed yet.
 *
 * The test: if deleting a row would lose authored content, it is a composer
 * segment. If deleting a row only abandons a job, it is a queue slot. A queue
 * that grew a text field is a composer with the wrong name; a composer that
 * grew a "regenerate all" is neither, which is what gaps.md R6 restored this
 * component to prevent.
 */
export const Boundary: Story = {
  render: () => (
    <div className="flex w-full max-w-xl flex-col gap-8">
      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">Tts composer — the script, edited per segment</p>
        <TtsComposer
          segments={NARRATION}
          selectedSegmentId="s2"
          voiceOptions={VOICE_OPTIONS}
          emotionOptions={EMOTION_OPTIONS}
          scriptDurationLabel="0:09"
          onSelectSegment={() => {}}
          onSegmentTextChange={() => {}}
          onSegmentVoiceChange={() => {}}
          onSegmentEmotionChange={() => {}}
          onSegmentSpeedChange={() => {}}
          onRegenerateSegment={() => {}}
          onPlayScript={() => {}}
        />
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">Generation queue — the work, cancelled or retried</p>
        <GenerationQueue
          heading="Rendering 3 segments"
          items={[
            { id: "q1", title: "Segment 1", state: "done" },
            { id: "q2", title: "Segment 2", state: "running", progress: 62 },
            { id: "q3", title: "Segment 3", state: "failed", errorMessage: "Voice model timed out" },
          ]}
          onCancelItem={() => {}}
          onRetryItem={() => {}}
        />
      </section>
    </div>
  ),
};

/* -------------------------------------------------------------------------
 * Hosts for the two play-asserted stories. Both live here rather than in the
 * component: it holds no state of its own, which is the fact `Controlled`
 * exists to prove.
 * ---------------------------------------------------------------------- */

/** Applies selection, so `KeyboardOrder` walks the tab order a product has. */
function SelectionHost(props: TtsComposerProps) {
  const [selected, setSelected] = React.useState<string | undefined>(undefined);
  return <TtsComposer {...props} selectedSegmentId={selected} onSelectSegment={setSelected} />;
}

/** Records every request and applies none of them. */
function RefusingHost(props: TtsComposerProps) {
  const [requests, setRequests] = React.useState<string[]>([]);
  const record = (entry: string) => setRequests((prev) => [...prev, entry]);
  return (
    <div className="flex flex-col gap-3">
      <TtsComposer
        {...props}
        onSelectSegment={(id) => record(`select:${id}`)}
        onSegmentTextChange={(id, text) => record(`text:${id}:${text}`)}
        onPlaySegment={(id) => record(`play:${id}`)}
        onPauseSegment={(id) => record(`pause:${id}`)}
        onPlayScript={() => record("playScript")}
        onPauseScript={() => record("pauseScript")}
        onRegenerateSegment={(id) => record(`regenerate:${id}`)}
        onSegmentVoiceChange={(id, voice) => record(`voice:${id}:${voice}`)}
        onSegmentEmotionChange={(id, emotion) => record(`emotion:${id}:${emotion}`)}
        onSegmentSpeedChange={(id, speed) => record(`speed:${id}:${speed}`)}
      />
      <p data-testid="requests" className="text-muted-foreground text-xs">
        {requests.join(" ")}
      </p>
    </div>
  );
}
