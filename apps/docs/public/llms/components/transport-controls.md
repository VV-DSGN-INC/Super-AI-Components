# Transport Controls

> The playback bar for any timeline: skip back, play/pause, skip forward, an editable elapsed/total readout and a playback-speed picker, built on a button group. It ships as two variants of one component — `simple` for a preview player, and `frame-accurate`, which adds frame stepping, in/out marking and a frame-precise HH:MM:SS:FF timecode without moving a single existing button.

Layer: component · Family: H · Install: `npx shadcn@latest add https://super-ai-components.vercel.app/r/transport-controls.json` · Contract: `components/super-ai/transport-controls.meta.json` (installed beside the component; version-locked to the code, so it outranks this page) · Docs: https://super-ai-components.vercel.app/components/transport-controls

## Why it matters

Transport is the most muscle-memory-dependent control in an editor. CapCut, Descript, Topaz and Freepik all put the same three buttons in the same place, and people reach for them without looking — so the moment a product graduates from previewing to editing, the temptation is to slot frame step in beside play, which quietly relocates every control a user had already learned. One component with an append-only second variant is what makes that graduation free. The other half is the keyboard: transport you can only click is a preview surface, not an editing one, so every control here has a real accessible name, a declared shortcut, and a tab stop.

## When to reach for it

Reach for it wherever a timeline, clip or generated video can be played back. Start on `simple`; switch the same instance to `frame-accurate` when the surface becomes an editor rather than a preview — the props are identical, so it is a one-word change and nothing under the user's cursor moves. It is fully controlled: `playing`, `currentTime`, `speed` and the in/out points come from whatever owns the player, and the component reports intent through `onPlayPause`, `onSeek`, `onSkip`, `onStepFrame` and `onMarkIn`/`onMarkOut`. `onSkip` and `onStepFrame` are optional — leave them off and both fall back to `onSeek` with the arithmetic already done.

## Variants

Not yet recorded.

## Instead use

Not yet recorded.

## Do

- Let frame-accurate append. The three shared buttons stay exactly where simple put them, so muscle memory survives the upgrade.
- Keep elapsed editable — typing a timecode is the fastest way to reach an exact position, and the only precise one without a ruler.

## Don't

- Don't wedge frame step in beside play because it groups better. It relocates play, skip back and skip forward for everyone who already learned them.
- Don't render elapsed/total as a caption. A read-only readout leaves scrubbing as the only way to seek, which is exactly the precision the timecode exists to provide.

## Anatomy

- `transport-controls`: Labelled group wrapping the bar; owns the keyboard shortcuts.
- `transport-controls-skip-back`: Jump back by `skipBy` seconds. Shared by both variants.
- `transport-controls-play`: Play/pause. The only filled button, so the primary action reads at a glance.
- `transport-controls-skip-forward`: Jump forward by `skipBy` seconds. Shared by both variants.
- `transport-controls-step-back`: One frame back. Frame-accurate only, appended after the shared three.
- `transport-controls-step-forward`: One frame forward. Frame-accurate only.
- `transport-controls-mark-in`: Sets the in point at the playhead. Frame-accurate only.
- `transport-controls-mark-out`: Sets the out point at the playhead. Frame-accurate only.
- `transport-controls-timecode`: The elapsed readout — an input. Typing a timecode seeks.
- `transport-controls-duration`: Total length, beside elapsed inside the same joined field.
- `transport-controls-speed`: Playback-rate select, named so it is reachable without a tooltip.
- `transport-controls-range`: In/out points as text, so the marked range is never colour-only.
- `transport-controls-status`: Visually hidden live region announcing playing/paused.

## Accessibility

**Keyboard**

- `simple` is five tab stops — skip back, play, skip forward, the elapsed field, the speed select. `frame-accurate` is nine: step back, step forward, mark in and mark out are appended after the shared three, never interleaved, so the first three stops are identical in both variants.
- Every control is a real `<button>` or a real field, so Enter and Space activate whichever one has focus without any of the shortcut machinery being involved.
- The root handles the editor shortcuts while focus is anywhere inside the group: Left and Right skip by `skipBy`, `,` and `.` step one frame, `I` and `O` mark in and out. Letter keys are case-insensitive, the frame-accurate four only fire in that variant, and Cmd, Ctrl or Alt suppresses all of them.
- The advertised `Space` shortcut never fires. The handler returns early for Space and Enter on a `<button>` so a focused button keeps its own activation, and the group's only other focusable children — the timecode field and the speed menu — both stand down as well. `aria-keyshortcuts="Space"` is announced on Play, but pressing Space only ever activates the button that has focus.
- The shortcuts are scoped to this group, not to the document. Focus in your player, your ruler or anywhere else on the page and none of them fire, so a global equivalent is yours to add — and the warning about double-firing only applies inside the bar.
- In the elapsed field: Enter commits, blur commits, Escape reverts the draft. Escape is `preventDefault`ed but not stopped from propagating, so a transport inside a dialog reverts the field and closes the dialog on the same keystroke.
- No control is ever `disabled`. Skip back at 0:00 and skip forward at the end are both live and clamp silently.

**Screen reader**

- The root is `role="group"` named by `aria-label`, defaulting to "Transport controls". Override it when a page carries more than one player, because nothing else distinguishes two bars.
- Every button has an explicit `aria-label` and every icon is `aria-hidden`, so the labels are the whole story: "Skip back 5 seconds" interpolates the real `skipBy`, and Play/Pause swaps between "Play" and "Pause" so the state is the name rather than the icon. The `title` attribute repeats the label plus its shortcut, but `aria-label` wins the name, so the tooltip is never the source of anything announced.
- `aria-keyshortcuts` is set on all seven buttons, which means the one shortcut the handler never fires — Space on Play — is also the one most confidently advertised.
- A visually hidden `role="status"` is mounted at all times and reads "Playing" or "Paused", so a play-state change announces however it was triggered. Nothing else does: skipping, frame stepping, marking in or out, and seeking by typed timecode all move `currentTime` in silence.
- The elapsed field is named "Elapsed time — type a timecode to seek", which is the only place that affordance is stated at all. Its value is the formatted timecode, so it reads as `0:07` or `00:00:07:12`.
- A timecode the parser rejects is thrown away on commit: the draft clears, the field snaps back to the current time, and nothing is announced. There is no `aria-invalid` and no error text, so a mistyped seek is indistinguishable from one that did nothing.
- The in/out readout is plain text inside the group, not a live region, so marking a point changes it silently. It renders only in `frame-accurate`, and only once one of the two points is set.

**Focus**

- Nothing mounts or unmounts under normal use, so focus is stable across play, pause, seek and speed change — the bar is the same nine elements throughout.
- Switching `variant` from `frame-accurate` to `simple` unmounts four buttons. Focus on one of them falls to `<body>`.
- Every focus ring comes from the vendored `Button`, `Input` and `Select`, so the bar inherits your primitives' focus styling rather than defining its own.
- The speed `Select` moves focus into its popup and returns it to the trigger on close. That is the primitive's behaviour, not this component's, and it is why the shortcut handler stands down inside `transport-controls-speed`.

## Pitfalls

- Assuming the component owns playback. It is controlled end to end: clicking Play calls `onPlayPause(true)` and nothing else. If the consumer never updates `playing`, the icon never changes.
- Forgetting `fps` in the frame-accurate variant. It drives both the `:FF` field and the value a typed HH:MM:SS:FF timecode parses to, so a bar left at the default 24 against a 25fps source will be a frame out on every seek.
- Wiring the shortcuts a second time at the app level. The bar already handles Space, the arrows, comma/period and I/O while focus is inside it, and deliberately stands down inside the timecode field and the speed menu so typing and menu navigation still work. A duplicate global listener will double-fire.
- Treating in/out as a colour on the ruler. The points also render as text beside the transport, which is what keeps the marked range legible when the ruler is scrolled out of view or colour is unavailable.

## Composition

- States: `simple`, `frame-accurate`
- Composes from this registry: nothing
- shadcn primitives: button, button-group, input, select
- npm: lucide-react

## Evidence

CapCut, Descript, Topaz, Freepik
