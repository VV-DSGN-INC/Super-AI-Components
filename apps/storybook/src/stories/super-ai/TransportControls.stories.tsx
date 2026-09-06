import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";

import { Button } from "@/components/ui/button";
import { TimeRuler } from "@/registry/super-ai/time-ruler";
import { TrackList } from "@/registry/super-ai/track-list";
import { TransportControls } from "@/registry/super-ai/transport-controls";
import { TransportControlsDocs } from "@/content/components/transport-controls.docs";
import { componentDocsPage } from "@/lib/component-docs-page";
import { settledFocusRing } from "@/lib/focus-ring";

const meta: Meta<typeof TransportControls> = {
  title: "Super AI/Transport Controls",
  component: TransportControls,
  parameters: { layout: "centered", docs: { page: componentDocsPage(TransportControlsDocs) } },
};

export default meta;
type Story = StoryObj<typeof TransportControls>;

/** How many times a `fn()` arg has been called, without re-casting at each use. */
function callCount(spy: unknown) {
  return (spy as { mock: { calls: unknown[] } }).mock.calls.length;
}

/** Document order of every focusable this bar owns, which is also its tab order. */
function stopsOf(canvasElement: HTMLElement) {
  return Array.from(
    canvasElement.querySelectorAll<HTMLElement>(
      'button[data-slot^="transport-controls-"], [data-slot="transport-controls-timecode"], [data-slot="select-trigger"]',
    ),
  );
}

/**
 * The preview case: three buttons, an editable elapsed/total pair and a speed
 * picker. Nothing here is frame-aware — elapsed reads `0:12`, not
 * `00:00:12:00` — because a preview player has no frame to be accurate to and
 * a `:FF` field would be four characters of noise. This is also the state the
 * `frame-accurate` order is measured against: whatever else changes, these
 * three buttons keep this order and these positions.
 */
export const Simple: Story = {
  args: {
    variant: "simple",
    currentTime: 12,
    duration: 90,
    speed: 1,
    onPlayPause: () => {},
    onSeek: () => {},
    onSpeedChange: () => {},
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Icon-only controls carry real accessible names, not tooltips alone.
    await expect(canvas.getByRole("button", { name: "Play" })).toBeInTheDocument();
    // Elapsed is a field, not a caption — typing a timecode seeks.
    await expect(canvas.getByRole("textbox", { name: /elapsed time/i })).toHaveValue("0:12");
    await expect(canvas.queryByRole("button", { name: "Next frame" })).not.toBeInTheDocument();
  },
};

/**
 * The editing case, and the whole reason this is one component rather than
 * two. Four controls are appended — frame step either way, mark in, mark out —
 * the timecode grows a `:FF` field parsed against `fps`, and the in/out points
 * render as text beside the bar so a marked range survives a scrolled-away
 * ruler. Nothing that existed in `simple` moves: the assertion below is on the
 * *order*, because a product that graduates from previewing to editing
 * relocating play is the failure this component exists to prevent.
 */
export const FrameAccurate: Story = {
  args: {
    variant: "frame-accurate",
    currentTime: 12.5,
    duration: 90,
    fps: 24,
    speed: 1,
    inPoint: 2,
    outPoint: 30,
    onPlayPause: () => {},
    onSeek: () => {},
    onStepFrame: () => {},
    onSpeedChange: () => {},
    onMarkIn: () => {},
    onMarkOut: () => {},
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("textbox", { name: /elapsed time/i })).toHaveValue("00:00:12:12");
    await expect(canvas.getByRole("button", { name: "Mark in point" })).toBeInTheDocument();

    // The load-bearing rule: frame-accurate appends, so the three shared
    // buttons are still the first three, in the same order.
    const order = Array.from(
      canvasElement.querySelectorAll("button[data-slot^='transport-controls-']"),
    ).map((button) => button.getAttribute("data-slot"));
    await expect(order.slice(0, 3)).toEqual([
      "transport-controls-skip-back",
      "transport-controls-play",
      "transport-controls-skip-forward",
    ]);
  },
};

/* ------------------------------------------------------------------------- *
 * Case stories — the situations this bar meets in a product, as opposed to
 * the two prop combinations above. See
 * docs/design-system/story-conventions.md.
 *
 * All eight are written; nothing was skipped. The bar has directional layout
 * and directional glyphs, it opens an animating Base UI popup, it is nine tab
 * stops with six live key bindings, `playing` / `currentTime` are a
 * controlled pair, its group name is an optional text slot and every control
 * it paints is icon-only, its timecode is a value with no width bound, it is
 * a horizontal cluster that has to survive 375px, and two catalogue
 * neighbours own a playhead or a play button.
 * ------------------------------------------------------------------------- */

/**
 * Under `dir="rtl"`, and this is the story that shows the bar's worst
 * behaviour, because some of it mirrors and some of it does not.
 *
 * **The buttons reorder and their glyphs do not.** The root is a plain flex
 * row, so the cluster reverses: "Skip back" paints to the *right* of "Skip
 * forward", while `SkipBack` still draws a left-pointing glyph and
 * `ArrowRightToLine` still points right on Mark in. The leftmost button in
 * the bar is now the one whose icon points right. Whether a transport cluster
 * should mirror at all is an open question, and not one this story settles:
 * time runs one way regardless of reading order, which is the argument for
 * pinning transport LTR, and layout consistency is the argument against.
 * Mirroring the row while leaving the glyphs alone is the one combination
 * that is wrong under either answer. The keyboard sides with the glyphs and
 * not with the layout: `ArrowLeft` is bound to skip
 * *back*, which now sits on the right. Recorded, not fixed — this is the
 * API-shaped finding `CONTINUE.md` §8 already carries for D2
 * `reference-strip` and H5 `frame-strip`, and it is a decision, not a class.
 *
 * **The vendored `ButtonGroup` joins its children physically**, which is the
 * measurable half and is asserted below. `button-group.tsx` uses
 * `rounded-r-none`, `rounded-r-lg!` on the last child, and `rounded-l-none`
 * plus `border-l-0` on every child after the first. Under RTL the last DOM
 * child is the *leftmost* one, so the group's outer edge is what loses its
 * border and its rounding, while the seam in the middle gets both. Third
 * instance of this exact primitive-level defect after `switch.tsx` (wave 2)
 * and `toggle-group.tsx` (wave 3); vendored, so recorded rather than swept.
 */
export const RTL: Story = {
  render: (args) => (
    <div dir="rtl" className="flex">
      <TransportControls {...args} />
    </div>
  ),
  args: { ...FrameAccurate.args },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const skipBack = canvas.getByRole("button", { name: /skip back/i });
    const skipForward = canvas.getByRole("button", { name: /skip forward/i });
    const markOut = canvas.getByRole("button", { name: "Mark out point" });

    // 1. The row mirrors. The first DOM child paints right of the last.
    await expect(skipBack.getBoundingClientRect().left).toBeGreaterThan(
      markOut.getBoundingClientRect().left,
    );
    // …so the left-pointing glyph now sits to the right of the right-pointing
    // one. Nothing in the component reverses the icons to match.
    await expect(skipBack.getBoundingClientRect().left).toBeGreaterThan(
      skipForward.getBoundingClientRect().left,
    );
    await expect(skipBack.querySelector("svg")).toHaveClass("lucide-skip-back");

    // 2. The joined edges do not mirror. `markOut` is the last DOM child and
    //    therefore the group's visual *left* edge under RTL: it carries
    //    `border-l-0` and `rounded-l-none`, so the outer edge of the bar has
    //    neither a border nor a radius, and both land on the inner seam.
    const outer = getComputedStyle(markOut);
    await expect(outer.borderLeftWidth).toBe("0px");
    await expect(parseFloat(outer.borderRightWidth)).toBeGreaterThan(0);
    await expect(outer.borderTopLeftRadius).toBe("0px");
    await expect(parseFloat(outer.borderTopRightRadius)).toBeGreaterThan(0);

    // The first DOM child keeps the border and radius the outer edge lost, on
    // the side that now faces the middle of the group.
    const seam = getComputedStyle(skipBack);
    await expect(parseFloat(seam.borderLeftWidth)).toBeGreaterThan(0);
    await expect(parseFloat(seam.borderTopLeftRadius)).toBeGreaterThan(0);
  },
};

/**
 * `prefers-reduced-motion`. The bar itself never animates, and that half is
 * asserted rather than asserted-about: nothing in the rendered subtree
 * carries an `animate-*` class. Its only `transition-*` classes are the
 * vendored `Input`'s and `SelectTrigger`'s `transition-colors`, which
 * crossfades a border colour and moves nothing — the `reset-affordance`
 * qualifier in the convention's fact 3.
 *
 * The one surface that can move is the speed picker's `SelectContent`, a Base
 * UI popup carrying `data-open:animate-in data-open:zoom-in-95`. It is fixed
 * in-wave with the restated pair fact 3 requires, because a plain
 * `motion-reduce:animate-none` loses the specificity tie to `data-open:` on
 * source order, and because the classes live on the vendored primitive so
 * fixing one consumer fixes none of the others (the F wave's rule). The
 * registry has nine `SelectContent` call sites; this is the first to carry
 * the pair, and the remaining eight are in the same position.
 *
 * **Read the measurement below before copying this story.** The runner cannot
 * demonstrate that fix, and saying so is the point. `select.tsx` defaults
 * `alignItemWithTrigger` to `true` and then kills the animation outright with
 * `data-[align-trigger=true]:animate-none`, so in the aligned mode the popup
 * reads `animation-name: none` and `animation-duration: 0s` **with or without
 * reduced motion** — measured here, `data-align-trigger="true"`,
 * `data-side="bottom"`. An `animationName === "none"` assertion on a default
 * select popup is therefore vacuous, which is why this story checks the
 * mechanism (aligned mode, zero duration) and then checks for the suppression
 * classes separately. Those classes cover the branch the runner cannot reach:
 * Base UI drops back to unaligned positioning when the popup will not fit,
 * `data-align-trigger` flips to `false`, and `zoom-in-95` becomes real motion
 * — F4 `action-stack` measured that same variant as a 304px→320px growth
 * rather than a fade.
 */
export const ReducedMotion: Story = {
  args: { ...FrameAccurate.args },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const bar = canvasElement.querySelector<HTMLElement>('[data-slot="transport-controls"]')!;

    // The bar itself: no animation to suppress, stated as a check rather than
    // as a claim about the source.
    await expect(bar.querySelector('[class*="animate-"]')).toBeNull();

    // Base UI's select trigger is a `combobox`, not a `button`.
    await userEvent.click(canvas.getByRole("combobox", { name: "Playback speed" }));

    let found: HTMLElement | null = null;
    await waitFor(() => {
      found = document.querySelector<HTMLElement>('[data-slot="select-content"]');
      if (!found) throw new Error("speed popup never opened");
    });
    const surface = found as unknown as HTMLElement;
    await expect(surface).toHaveAttribute("data-open");

    // Why the popup is still: aligned mode, not reduced motion. Pinning the
    // mechanism keeps the next reader from mistaking this green for evidence
    // about `prefers-reduced-motion`.
    await expect(surface).toHaveAttribute("data-align-trigger", "true");
    const style = getComputedStyle(surface);
    await expect(style.animationName).toBe("none");
    await expect(style.animationDuration).toBe("0s");

    // And the branch the runner cannot reach: unaligned fallback, where
    // `zoom-in-95` does apply. Only the classes can be checked from here.
    await expect(surface).toHaveClass("motion-reduce:data-open:animate-none");
    await expect(surface).toHaveClass("motion-reduce:data-closed:animate-none");

    // The options are real content, so a reader can tell the popup rendered
    // rather than trusting a style read on an empty box.
    await expect(within(surface).getByRole("option", { name: "0.25×" })).toBeInTheDocument();
    await userEvent.keyboard("{Escape}");
  },
};

/**
 * The tab sequence, the focus treatment at every stop, and — because this is
 * the densest keyboard surface in family H — what each key actually does once
 * focus is inside the bar.
 *
 * Nine stops in `frame-accurate`, in document order, with nothing setting
 * `tabindex`: the seven transport buttons, the elapsed field, the speed
 * trigger. `simple` is the first three plus the last two. The two
 * `ButtonGroupSeparator`s are decoration and take no stop. Each stop is
 * checked with `settledFocusRing` rather than `boxShadow !== "none"` — the
 * vendored ring compiles to shadow layers that are present-but-transparent
 * when off, and the `Button` base's `transition-all` fades the real one in,
 * so the string check passes on a control painting nothing and an immediate
 * read fails on one that will paint.
 *
 * **The shortcut the component advertises loudest is the one it never
 * fires.** `aria-keyshortcuts="Space"` is on Play, and the root's handler
 * returns early for Space on a `<button>`, in the timecode field, and inside
 * the speed slot — which is every element that can hold focus in this group,
 * because the root `<div>` has no `tabIndex` and so can never be the event
 * target in a browser. (The unit suite reaches it by dispatching a synthetic
 * event straight at the root, which is why the gap survived to here.) So
 * Space activates whichever button has focus: on Play that happens to be
 * play/pause, and on Skip back it is a skip. The assertions below pin the
 * behaviour that exists — six bindings that fire, plus Space activating the
 * focused button — and record the gap rather than expecting the advertised
 * behaviour. The fix is a decision, either a `tabIndex` on the root or
 * dropping `Space` from `aria-keyshortcuts`, so it stays recorded.
 */
export const KeyboardOrder: Story = {
  args: {
    variant: "frame-accurate",
    currentTime: 8,
    duration: 90,
    fps: 24,
    skipBy: 5,
    speed: 1,
    inPoint: null,
    outPoint: null,
    onPlayPause: fn(),
    onSkip: fn(),
    onStepFrame: fn(),
    onSeek: fn(),
    onSpeedChange: fn(),
    onMarkIn: fn(),
    onMarkOut: fn(),
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const stops = stopsOf(canvasElement);
    await expect(stops.map((el) => el.getAttribute("data-slot"))).toEqual([
      "transport-controls-skip-back",
      "transport-controls-play",
      "transport-controls-skip-forward",
      "transport-controls-step-back",
      "transport-controls-step-forward",
      "transport-controls-mark-in",
      "transport-controls-mark-out",
      "transport-controls-timecode",
      "select-trigger",
    ]);

    // One lap of the whole bar. Every stop is reached in document order and
    // paints something a sighted user can see.
    await userEvent.tab();
    for (const stop of stops) {
      await expect(document.activeElement).toBe(stop);
      await expect(stop.matches(":focus-visible")).toBe(true);
      await settledFocusRing(stop, waitFor);
      await userEvent.tab();
    }
    // Nothing traps: the stop after the speed trigger is outside the bar.
    await expect(canvasElement.contains(document.activeElement)).toBe(false);

    // The six bindings that fire, driven from a real focused control rather
    // than a synthetic event on the root. `,` `.` `I` `O` exist only in this
    // variant — the simple one filters them out of the same table.
    const skipBack = canvas.getByRole("button", { name: /skip back/i });
    skipBack.focus();
    await userEvent.keyboard("{ArrowLeft}");
    await expect(args.onSkip).toHaveBeenLastCalledWith(-5);
    await userEvent.keyboard("{ArrowRight}");
    await expect(args.onSkip).toHaveBeenLastCalledWith(5);
    await userEvent.keyboard(",");
    await expect(args.onStepFrame).toHaveBeenLastCalledWith(-1);
    await userEvent.keyboard(".");
    await expect(args.onStepFrame).toHaveBeenLastCalledWith(1);
    await userEvent.keyboard("i");
    await expect(args.onMarkIn).toHaveBeenLastCalledWith(8);
    await userEvent.keyboard("o");
    await expect(args.onMarkOut).toHaveBeenLastCalledWith(8);

    // The seventh binding. Space on a focused Skip back activates Skip back:
    // the group shortcut never runs, so `onPlayPause` stays untouched.
    const skipsBeforeSpace = callCount(args.onSkip);
    await userEvent.keyboard(" ");
    await expect(callCount(args.onSkip)).toBe(skipsBeforeSpace + 1);
    await expect(args.onSkip).toHaveBeenLastCalledWith(-5);
    await expect(args.onPlayPause).not.toHaveBeenCalled();

    // Play/pause by keyboard therefore needs focus on Play itself, where it is
    // the button's own activation rather than the advertised shortcut.
    canvas.getByRole("button", { name: "Play" }).focus();
    await userEvent.keyboard(" ");
    await expect(args.onPlayPause).toHaveBeenCalledWith(true);

    // And the field keeps its own keys, which is why typing a timecode works
    // at all: arrows move the caret and `.` is a separator, not a frame step.
    // Nothing fires at all while focus is in there.
    const skipsBeforeField = callCount(args.onSkip);
    const stepsBeforeField = callCount(args.onStepFrame);
    canvas.getByRole("textbox", { name: /elapsed time/i }).focus();
    await userEvent.keyboard("{ArrowLeft}.");
    await expect(callCount(args.onSkip)).toBe(skipsBeforeField);
    await expect(callCount(args.onStepFrame)).toBe(stepsBeforeField);
  },
};

function ControlledShell() {
  const [playing, setPlaying] = React.useState(false);
  const [requested, setRequested] = React.useState<boolean | null>(null);
  const [seeked, setSeeked] = React.useState<number | null>(null);
  const [pass, setPass] = React.useState(1);

  return (
    <div className="flex flex-col items-start gap-4">
      <TransportControls
        variant="simple"
        playing={playing}
        currentTime={12}
        duration={90}
        speed={1}
        onPlayPause={setRequested}
        onSeek={setSeeked}
        onSpeedChange={() => {}}
      />

      <dl className="text-foreground grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs">
        <dt>playing prop</dt>
        <dd data-testid="applied">{String(playing)}</dd>
        <dt>last onPlayPause</dt>
        <dd data-testid="requested">{requested === null ? "—" : String(requested)}</dd>
        <dt>last onSeek</dt>
        <dd data-testid="seeked" className="tabular-nums">
          {seeked === null ? "—" : String(seeked)}
        </dd>
        <dt>host render pass</dt>
        <dd data-testid="render-pass" className="tabular-nums">
          {pass}
        </dd>
      </dl>

      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={() => setPass((n) => n + 1)}>
          Re-render
        </Button>
        <Button
          size="sm"
          disabled={requested === null}
          onClick={() => requested !== null && setPlaying(requested)}
        >
          Apply
        </Button>
      </div>
    </div>
  );
}

/**
 * `playing` and `currentTime` driven from outside, which is the whole
 * contract: this component renders a player, it does not own one. Clicking
 * Play calls `onPlayPause(true)` and changes nothing on screen — the icon,
 * the accessible name and `data-state` all stay paused until the host applies
 * the request. A host that forgets is left with a dead button, which is the
 * first pitfall in the docs module.
 *
 * The second half is the timecode, and it is the surprising one, because the
 * field *does* move while you type. `draft` is local state that exists only
 * between the first keystroke and the commit, so an external playhead update
 * never fights the characters someone is typing — but on Enter the draft is
 * dropped, `onSeek(45)` is reported, and the field snaps back to whatever
 * `currentTime` still says. A typed seek therefore looks like it failed until
 * the host applies it. Nothing announces the difference, and there is no
 * `aria-invalid`, so an unapplied seek and a rejected timecode are the same
 * experience — recorded here, asserted nowhere, because adding either an
 * announcement or an invalid state is a design decision.
 */
export const Controlled: Story = {
  render: () => <ControlledShell />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const play = () => canvas.getByRole("button", { name: /^(Play|Pause)$/ });
    const bar = canvasElement.querySelector<HTMLElement>('[data-slot="transport-controls"]')!;

    // 1. Interaction alone does not move the rendered value.
    await expect(play()).toHaveAccessibleName("Play");
    await userEvent.click(play());
    await expect(play()).toHaveAccessibleName("Play");
    await expect(bar).toHaveAttribute("data-state", "paused");

    // 2. …but the callback fired, carrying the state to move *to*.
    await expect(canvas.getByTestId("requested")).toHaveTextContent("true");
    await expect(canvas.getByTestId("applied")).toHaveTextContent("false");

    // 3. Re-rendering with an unchanged `playing` holds it fixed. The pass
    //    counter proves the re-render actually happened.
    await expect(canvas.getByTestId("render-pass")).toHaveTextContent("1");
    await userEvent.click(canvas.getByRole("button", { name: "Re-render" }));
    await expect(canvas.getByTestId("render-pass")).toHaveTextContent("2");
    await expect(play()).toHaveAccessibleName("Play");

    // 4. The payload was sufficient to apply the change.
    await userEvent.click(canvas.getByRole("button", { name: "Apply" }));
    await waitFor(() => expect(play()).toHaveAccessibleName("Pause"));
    await expect(bar).toHaveAttribute("data-state", "playing");

    // The timecode is controlled the same way, through a local draft. Typing
    // moves the field; committing reports the seek and reverts the field,
    // because `currentTime` never changed.
    const field = canvas.getByRole("textbox", { name: /elapsed time/i });
    await expect(field).toHaveValue("0:12");
    await userEvent.clear(field);
    await userEvent.type(field, "0:45");
    await expect(field).toHaveValue("0:45");
    await userEvent.keyboard("{Enter}");
    await expect(canvas.getByTestId("seeked")).toHaveTextContent("45");
    await expect(field).toHaveValue("0:12");
  },
};

/**
 * The group's name blanked, which is the only text slot a caller supplies —
 * everything visible in this bar is generated from numbers. `aria-label`
 * defaults to "Transport controls", and a default parameter only fires on
 * `undefined`, so `aria-label={clip.name}` with an empty name passes an empty
 * string straight through and the group loses its accessible name. The docs
 * module asks callers to override that label precisely because a page with
 * two players has nothing else to tell the bars apart; blanking it is the
 * same failure reached from the other side, and no axe rule covers it,
 * because a name on `role="group"` is optional.
 *
 * The rest of the story is the good news, and it is worth stating because
 * this is where icon-only bars usually fail. All nine controls are named by
 * their own `aria-label` rather than by the group, so blanking the group
 * costs the bar its identity and none of its controls. The targets hold up
 * too: `size="icon"` is `size-8`, so each button measures 32×32 against WCAG
 * 2.2's 24×24 — unlike the 16×32 and 20×20 targets `CONTINUE.md` §8 records
 * for `drawing-tools` and `reset-affordance`.
 */
export const EmptyLabel: Story = {
  args: { ...FrameAccurate.args, "aria-label": "" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const bar = canvasElement.querySelector<HTMLElement>('[data-slot="transport-controls"]')!;

    // The group is unnamed — findable by nothing a screen-reader user can say.
    await expect(bar).toHaveAttribute("aria-label", "");
    await expect(canvas.queryByRole("group", { name: "Transport controls" })).toBeNull();

    // Every control survives it, and every name is distinct.
    const stops = stopsOf(canvasElement);
    await expect(stops).toHaveLength(9);
    const names = stops.map((el) => el.getAttribute("aria-label") ?? "");
    await expect(names.every((name) => name.length > 0)).toBe(true);
    await expect(new Set(names).size).toBe(9);

    // Icon-only, so the tap target is the whole story. `size-8` is 32×32,
    // which clears WCAG 2.2's 24×24 — asserted at the measured size rather
    // than at the threshold, so a later shrink to 24 shows up as a change.
    for (const button of canvasElement.querySelectorAll<HTMLElement>(
      'button[data-slot^="transport-controls-"]',
    )) {
      const box = button.getBoundingClientRect();
      await expect(box.width).toBe(32);
      await expect(box.height).toBe(32);
    }
  },
};

/**
 * The long case, which for this component is a long *value* rather than long
 * prose: the bar paints no author-supplied copy at all, so the only two
 * things that can grow are the timecode and the group's name.
 *
 * The timecode is the defect, and it is smaller and more general than it
 * first looks. Measured here: the value needs 113px inside a `w-28` field
 * whose content box is 110px, so it overflows by 3px and the field scrolls.
 * The interesting part is that `HH:MM:SS:FF` is a *fixed* eleven characters,
 * so this is not a long-content case at all — the frame-accurate field is
 * three pixels too narrow for every value it can ever hold, and the default
 * `FrameAccurate` story above is already clipping. Which end is cut depends
 * on the caret: at rest `scrollLeft` is 0 and the tail goes, with the caret
 * at the end `scrollLeft` is 3 and the head does. There is no `title` either
 * way. Related to I2 `property-inspector`'s `w-20` `UnitInput` finding in
 * `CONTINUE.md` §8, but a milder form of it — I2 loses leading digits
 * outright. Unfixed for the same reason: widening the field changes the bar
 * at every duration, so it is a layout decision rather than a drift
 * correction.
 *
 * The gate understates it. The vendored `Input` is `text-base` with
 * `md:text-sm`, and the runner is 1200px wide, so this 3px is the 14px
 * measurement; a real phone renders the same value at 16px and overflows
 * further.
 *
 * The group name is the half that holds. A ~90-character label survives whole
 * into the accessibility tree, because it is never painted.
 */
export const LongContent: Story = {
  args: {
    variant: "frame-accurate",
    currentTime: 10062,
    duration: 10800,
    fps: 25,
    speed: 1,
    "aria-label":
      "Transport controls — interview cut 3, 25fps ProRes master, awaiting client review pass",
    onPlayPause: () => {},
    onSeek: () => {},
    onStepFrame: () => {},
    onSpeedChange: () => {},
    onMarkIn: () => {},
    onMarkOut: () => {},
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole("textbox", { name: /elapsed/i }) as HTMLInputElement;
    await expect(field).toHaveValue("02:47:42:00");

    // Fixed width, unbounded value: the timecode does not fit, and the field
    // scrolls rather than growing, truncating, or offering a title.
    // Eleven characters is the whole format, not a long instance of it, so
    // this overflow is the frame-accurate variant's permanent condition.
    await expect(field.value).toHaveLength(11);
    await expect(field.scrollWidth).toBeGreaterThan(field.clientWidth);
    await expect(field).not.toHaveAttribute("title");

    // Which end is clipped follows the caret. At rest the head is visible and
    // the tail is cut; with the caret at the end it is the other way round.
    await expect(field.scrollLeft).toBe(0);
    field.focus();
    field.setSelectionRange(field.value.length, field.value.length);
    await expect(field.scrollLeft).toBeGreaterThan(0);
    field.blur();

    // The total sits in a `ButtonGroupText`, which has no width of its own, so
    // the same 11 characters are fully legible there. Only the editable half
    // clips, which is the half someone has to read back after typing.
    const total = canvasElement.querySelector<HTMLElement>(
      '[data-slot="transport-controls-duration"]',
    )!;
    await expect(total).toHaveTextContent("03:00:00:00");
    await expect(total.scrollWidth).toBeLessThanOrEqual(total.clientWidth + 1);

    // The one author-supplied text slot survives at length.
    const bar = canvasElement.querySelector<HTMLElement>('[data-slot="transport-controls"]')!;
    await expect(bar.getAttribute("aria-label")!.length).toBeGreaterThan(85);
    await expect(canvas.getByRole("group", { name: /interview cut 3/ })).toBe(bar);
  },
};

/**
 * 375px, and the measurement is the story. The frame-accurate bar's four
 * flow children total 732px unwrapped — a 226px seven-button cluster that
 * cannot shrink, the timecode field beside its total, the speed picker, and
 * the in/out readout — so at 375px the root's `flex-wrap` puts **every one of
 * them on its own row**. Nothing scrolls sideways, which is the guarantee
 * asserted below and a real one, because the cluster is `w-fit` with
 * `shrink-0` children and would overflow rather than compress if the root
 * ever lost `flex-wrap`.
 *
 * A four-row transport bar is the finding, not the fix. Every surface that
 * pins this to the bottom of a phone viewport has to budget four rows of
 * height for a control that is one row on a desktop, and the in/out readout —
 * the least important of the four — takes a full row of its own. Recorded
 * rather than fixed: a narrow layout for this bar is a design decision, and
 * the spec says nothing about one.
 *
 * The gate understates it, in the direction fact 2 warns about. A wrapper
 * constrains width, not the breakpoint, and the runner's chromium is 1200px
 * wide, so the vendored `Input`'s `md:text-sm` still applies here while a
 * real 375px phone gets `text-base` and a wider timecode than the 732px
 * measured.
 */
export const Mobile: Story = {
  render: (args) => (
    <div className="w-[375px] max-w-full" data-testid="viewport">
      <TransportControls {...args} />
    </div>
  ),
  args: { ...FrameAccurate.args },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // The frame, not `canvasElement.firstElementChild` — `layout: "centered"`
    // wraps every story, so that would measure the ~1200px centring div.
    const frame = canvas.getByTestId("viewport");
    await expect(frame.scrollWidth).toBeLessThanOrEqual(frame.clientWidth);

    const bar = canvasElement.querySelector<HTMLElement>('[data-slot="transport-controls"]')!;
    await expect(bar.getBoundingClientRect().width).toBeLessThanOrEqual(375);

    // It fits by wrapping, not by shrinking: the transport cluster is one
    // unbroken row of seven and is narrower than the frame on its own.
    const cluster = canvas
      .getByRole("button", { name: /skip back/i })
      .closest<HTMLElement>('[data-slot="button-group"]')!;
    await expect(cluster.querySelectorAll("button")).toHaveLength(7);
    await expect(cluster.getBoundingClientRect().width).toBeLessThanOrEqual(375);

    // Flow children only — the sr-only status region is absolutely positioned
    // and would otherwise read as a fifth row.
    const children = Array.from(
      canvasElement.querySelectorAll<HTMLElement>('[data-slot="transport-controls"] > *'),
    ).filter((el) => getComputedStyle(el).position !== "absolute");
    await expect(children).toHaveLength(4);

    // 732px of content in a 375px frame: each child takes a row of its own.
    const unwrapped = children.reduce((total, el) => total + el.getBoundingClientRect().width, 0);
    await expect(unwrapped).toBeGreaterThan(700);
    const rowTops = new Set(children.map((el) => Math.round(el.getBoundingClientRect().top)));
    await expect(rowTops.size).toBe(4);
  },
};

const AUDITION_TRACKS = [
  {
    id: "stem-1",
    title: "Draft score — main theme",
    artist: "Generated",
    bpm: 96,
    musicalKey: "F minor",
  },
  {
    id: "stem-2",
    title: "Draft score — alt, sparser",
    artist: "Generated",
    bpm: 96,
    musicalKey: "F minor",
  },
];

/**
 * Two neighbours own something this bar owns, and the choosing rule is what
 * each of them knows about the playhead.
 *
 * - **H1 transport controls** moves the playhead in *named, discrete* steps —
 *   five seconds, one frame — and lets you type an exact timecode. Reach for
 *   it when the user already knows where they want to be. Its Play is named
 *   bare "Play", because a bar owns exactly one player.
 * - **H2 `time-ruler`** moves the same playhead *continuously, by position*.
 *   Reach for it when the user is looking for something rather than going to
 *   it. The two are complements rather than alternatives: they share the
 *   playhead value and both carry `inPoint` / `outPoint`, so an editor mounts
 *   both against one piece of state and H1's Mark in sets the points H2
 *   draws. Choosing between them usually means the problem is mis-stated.
 * - **J7 `track-list`** has a play button too, and it is not transport. It
 *   auditions one row of many in place, which is why its control is named
 *   "Play Draft score — main theme" rather than "Play", and why it carries no
 *   timecode, no speed and no seek. One player and precision is H1; one
 *   player and position is H2; many candidates and a quick listen is J7.
 */
export const Boundary: Story = {
  render: () => (
    <div className="flex w-full max-w-2xl flex-col gap-6">
      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">
          H1 transport controls — named jumps and a typed timecode
        </p>
        <TransportControls
          variant="frame-accurate"
          aria-label="Transport controls for interview cut 3"
          currentTime={12.5}
          duration={90}
          inPoint={2}
          outPoint={30}
          onPlayPause={() => {}}
          onSeek={() => {}}
          onStepFrame={() => {}}
          onSpeedChange={() => {}}
          onMarkIn={() => {}}
          onMarkOut={() => {}}
        />
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">
          H2 time ruler — the same playhead, moved by position
        </p>
        <TimeRuler duration={90} zoom={6} playhead={12.5} inPoint={2} outPoint={30} />
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">
          J7 track list — a play control per row, named for its row
        </p>
        <TrackList
          tracks={AUDITION_TRACKS}
          label="Draft stems"
          playingId={null}
          onPlayToggle={() => {}}
        />
      </section>
    </div>
  ),
};
