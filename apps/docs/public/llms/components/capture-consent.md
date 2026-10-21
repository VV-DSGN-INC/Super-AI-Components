# Capture Consent

> The consent gate that comes before an AI capture session (meeting notes, a call transcript, a recorded document) and the indicator that stays on screen while it runs. It tells the initiator who will be notified, keeps recording and sharing as two separate switches, confirms that the other people were told, shows what a decline costs the initiator, and says what is kept and deleted when capture stops.

Layer: component · Family: N · Install: `npx shadcn@latest add https://super-ai-components.vercel.app/r/capture-consent.json` · Contract: `components/super-ai/capture-consent.meta.json` (installed beside the component; version-locked to the code, so it outranks this page) · Docs: https://super-ai-components.vercel.app/components/capture-consent

## Why it matters

Meeting recorders such as Fireflies, Gong, Granola, Limitless, Notion and Zoom AI Companion all started capture first and explained afterwards, and Shape of AI's Consent pattern names that as the failure. The fix is structural: the callback that starts capture is reachable from the notice step only, so a consumer cannot wire a happy path that skips it. Bundling recording, sharing and training into one toggle is the dark pattern Shape of AI's Disclosure page names, so recording and sharing are separate switches here and training is not in this component at all.

## When to reach for it

Render one per capture surface and drive `state` from your own session. Put `form="bar"` on the surface that owns the capture and `form="compact"` in the topbar's privacy slot, so the indicator is on every surface while capturing. Pass `participants` so the notice names real people. Wire `onStartCapture` to whatever opens the microphone or the document tap, and treat it as the only trigger; move to `recording` when your capture actually starts, to `others-notified` when your notice is delivered, and to `declined` when a participant opts out. Pass `consequence` for the declined state in your product's terms, and `kept` and `deleted` for `ended`. If your product trains on captures, point to the control with `dataControlsName`; the setting itself belongs on its own surface.

## Variants

### form (default: `bar`)

- `bar`: The surface that owns the capture: it carries the notice, the two switches, Start and Stop, and the declined and ended explanations.
- `compact`: A topbar's privacy slot, where the indicator has to stay visible on every other surface. It is a passive chip that reports the state and cannot start or stop anything.

## Instead use

- **permission-prompt**: An agent asks before one side effect, such as writing a file or sending a message. Permission-prompt is a single approve-or-deny decision about an action; capture-consent covers a session that continues to record and has other people in it.
- **trust-dialog**: The question is whether to run third-party content, such as a folder or a plugin. Trust-dialog confirms that you trust a source; capture-consent is about telling people they are being recorded.
- **voice-clone-recorder**: The consent is about a person's likeness or voice being cloned. That consent stays in voice-clone-recorder, which carries its own gate for the clone itself.
- **rate-limit-banner**: You want a banner that counts down and clears itself. Capture-consent never auto-dismisses while recording is on.

## Do

- Name the people who will be told in the pre-notice, and leave Start disabled until the record switch is on.
- Keep the compact chip on screen for the whole capture, with the state in text.
- Say what a decline costs the initiator, and what stopping keeps and deletes.
- State the kept and deleted lines in the ended state in the product's own words.

## Don't

- Don't offer a one-click record button that starts capture without the notice step.
- Don't announce a recording with a toast that leaves while the recording continues.

## Anatomy

- `capture-consent`: Root wrapper; carries the declared state as data-state and the form as data-form.
- `capture-consent-status`: The one role=status element. It persists across states, so each change is announced politely. In the compact form it is the chip itself.
- `capture-consent-notice`: Pre-notice sentence naming who will be told. A chip cannot carry it, which is why the compact pre-notice is passive.
- `capture-consent-record`: Switch for recording. Starts off, with no prop to pre-set it.
- `capture-consent-share`: Separate switch for sharing notes. Neither switch implies the other.
- `capture-consent-start`: The only control that fires onStartCapture, disabled until the record switch is on.
- `capture-consent-notified`: Confirmation that the other participants were told.
- `capture-consent-stop`: Stops capture. Bar form only.
- `capture-consent-declined`: Who declined and what that means for the person who wanted to record.
- `capture-consent-ended`: What is kept and what is deleted after capture stops.

## Accessibility

**Keyboard**

- Bar form `pre-notice` has three tab stops: the record switch, the share switch, then Start capture. Start is a genuinely disabled button until the record switch is on, so it is skipped until then.
- `recording` and `others-notified` have two stops in the bar form: the share switch and Stop capture. `declined` and `ended` have none.
- The compact form has no tab stops at all; it is a status chip, not a control. Stopping is only available from the bar form.
- Space toggles a focused switch; Enter or Space activates the buttons. Escape does nothing, because nothing here is a popup.
- There is no `disabled` prop. The one disabled control is Start, derived from the record switch alone.

**Screen reader**

- One `role="status"` element persists across every state of a form and is the only live region, so a change from `pre-notice` to `recording` is announced politely as "Recording started" and `ended` as "Recording stopped". It is mounted before its text changes, which is what makes the announcement reliable.
- The group is labelled "Capture consent" and deliberately is not an `alert`, so nothing is announced assertively. Each switch is named by its visible text through `aria-labelledby`.
- Icons are `aria-hidden`; state is carried by text, never by colour or icon alone.
- `elapsedLabel` sits outside the live region and is never announced; announcing a ticking clock would drown the real changes.
- The declined consequence, the notified confirmation and the kept and deleted lines are plain text inside the group and are read in order; they are not in a live region, so only the status line announces the state change itself.

**Focus**

- Moving to `recording` unmounts the pre-notice step, including the Start button that had focus, so focus falls to the document body. Move it yourself in the handler that changes `state`, to the Stop button or back to the capture surface.
- Stopping from the bar unmounts the Stop button in the same way.

## Pitfalls

- Calling `onStartCapture` from a path that did not come through the pre-notice. The component cannot stop you from starting capture elsewhere in your own code; it only guarantees that its own controls fire the callback from one step.
- Moving to `recording` before your capture has started, or staying in `recording` after it stopped. The indicator renders the state you give it and cannot know the microphone's.
- Omitting `participants`. The notice falls back to "the other participants", which is a weaker promise than naming people.
- Omitting `kept` or `deleted` in `ended`. The state renders only the lines you pass, so an empty ended state says nothing about what happened to the capture.
- Putting a training switch beside this component. Training consent has its own surface; the pre-notice only names where it lives.

## Composition

- States: `pre-notice`, `recording`, `others-notified`, `declined`, `ended`
- Composes from this registry: nothing
- shadcn primitives: alert, badge, button, switch
- npm: lucide-react

## Evidence

Fireflies, Gong, Granola, Limitless, Notion, Zoom AI Companion
