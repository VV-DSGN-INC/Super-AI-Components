import type { ComponentDocs } from "@/lib/component-docs";
import {
  LockedWhileRunning,
  SegmentsFollowTheModel,
  SegmentsRepeatTheirOwnLabels,
  StripUsedToNarrowAList,
} from "./gen-settings-bar.examples";

/**
 * Seeded from docs/design-system/component-specs.md#a7-gen-settings-bar.
 * Translate the spec's internal voice into consumer-facing guidance — do not
 * ship the seed text verbatim.
 *
 * No "use client" here: this module is plain data read by a Server
 * Component (component-docs.tsx), which destructures `docs.whatItIs`,
 * `docs.evidence`, etc. directly. The live renders live in the
 * ./gen-settings-bar.examples client sidecar and are referenced here as
 * zero-prop elements.
 */
export const GenSettingsBarDocs: ComponentDocs = {
  whatItIs:
    "The one-line strip of generation parameters that sits with the prompt — model, aspect, resolution, duration, batch — where each segment shows its current value and opens the control that changes it. It is a real toolbar of buttons, not a form: the strip renders the values you hand it and reports the intent to change one, and a single flag on the bar locks every segment at once while a run is in flight.",
  whyItMatters:
    "In a generation product the settings are not a preferences screen you visit — they are read on every single run, because they decide what comes out and what it costs. CapCut, Freepik, ElevenLabs Flows, Playground and Tripo all converged on the same answer: put the parameters on one line beside the prompt, as values rather than labels, so the whole configuration is legible in a glance and reachable in a click. Keeping them visible is also what makes cost honest — changing a segment is what re-estimates the price, which is why a cost readout belongs inside this strip rather than somewhere else on the page.",
  evidence: ["CapCut", "Freepik", "ElevenLabs Flows", "Playground", "Tripo"],
  anatomy: [
    {
      slot: "gen-settings-bar",
      note: 'The strip. Renders role="toolbar", so give it an aria-label naming what it configures — "Generation settings" — because nothing inside it names the group. Carries data-disabled while the bar is locked, which is what to style against.',
    },
    {
      slot: "gen-settings-item",
      note: "One segment. A real button whose children are the current value — that text is also its entire accessible name. It reads `disabled` from the bar through context, and takes its own `disabled` to override that either way.",
    },
  ],
  usage:
    "Reach for it wherever a run is about to be launched and its parameters must stay visible while the prompt is being written: under a composer, along the top of a generation panel, in the settings slot of `media-prompt-bar`. Compose it from `GenSettingsItem`s you place yourself — the bar only supplies the strip and the shared lock. Which segments exist is a decision about the selected model, not about the surface: an image model has no duration, so it gets no duration segment. When a parameter needs a label, a hint or a reset beside it, it has outgrown this strip and belongs in a `field-row` inside a panel; when the control narrows a list already on screen, you want `filter-bar` instead.",
  dos: [
    {
      text: "Lock the whole strip with the bar's `disabled` while a run is in flight, instead of disabling each segment — the bar shares one flag through context, so five segments cannot drift out of step with each other.",
      example: <LockedWhileRunning />,
    },
    {
      text: "Let the selected model decide which segments exist, and drop the ones it does not have rather than leaving a dead segment on the strip.",
      example: <SegmentsFollowTheModel />,
    },
  ],
  donts: [
    {
      text: "Don't use it to narrow something already on screen. A segment here changes the next run, not the current view — a strip whose clicks filter a library is a `filter-bar` wearing the wrong component.",
      example: <StripUsedToNarrowAList />,
    },
    {
      text: "Don't prefix each segment with the parameter it sets. The value names itself, the strip has no room for both, and nothing here truncates — the labels just push the bar past the edge of whatever holds it.",
      example: <SegmentsRepeatTheirOwnLabels />,
    },
  ],
  accessibility: {
    keyboard: [
      'Every segment is its own tab stop. The bar renders role="toolbar" but has not implemented the roving tabindex that role promises — there is a TODO in the source — so crossing a five-segment strip costs five Tabs, and Left/Right do nothing.',
      "Segments are real buttons, so Space and Enter open whatever control the segment fronts. There is no Escape handler here; dismissing that control is the control's own business.",
      "`disabled` on the bar reaches every segment through context and removes all of them from the tab order at once, which is what makes it safe to lock the strip during a run. A segment opts back in with `disabled={false}` on itself — omitting the prop falls through to the bar's value.",
    ],
    screenReader: [
      'The bar announces as a toolbar with no name unless you give it one — nothing inside it says what is being configured. Pass an `aria-label` such as "Generation settings", and note that the announced role then promises arrow-key navigation this component does not have.',
      'A segment\'s accessible name is its children and nothing else, so the value is the name: a segment reads "1080p", never "Resolution, 1080p". An icon-only segment ships an unlabeled button unless you add an `aria-label`.',
      'Changing a parameter rewrites a button\'s own label under the user. The bar owns no live region, so nothing announces "resolution is now 1080p" — and a name that changes while its element still holds focus is not reliably re-announced.',
      "`data-disabled` on the bar is a styling hook only. The programmatic state lives on the segments' own `disabled` attributes; the toolbar element itself carries no `aria-disabled`.",
    ],
    focus: [
      "Locking the bar mid-run disables the segment that currently has focus, so focus falls to `<body>` and the next Tab restarts from the top of the page. If a run can start while the strip has focus, move focus to the control that started it.",
      "Each segment ships its own `focus-visible` ring. The bar is not focusable and has none.",
    ],
  },
  pitfalls: [
    'The bar announces role="toolbar" but does not yet implement the arrow-key roving tabindex that role promises — see the TODO in the source. Today every segment is its own tab stop, so a keyboard user pays one Tab per segment to cross the strip and arrow keys do nothing. Keep the strip to the five or six segments the pattern was drawn for until that lands.',
    'There is no value API. `GenSettingsItem` is a plain button: the value it shows is its `children`, and `onClick` hands you a MouseEvent rather than a new value, so each segment needs its own handler and the values are owned entirely upstream. Nothing here can report "resolution changed to 1080p" generically — the catalog naming Select and Toggle-group as the base describes the controls you open, not what this component ships.',
    "`disabled` travels through React context, so a segment inside a disabled bar is disabled even though nothing in its own JSX says so. To keep one segment live during a run, pass `disabled={false}` on it explicitly — leaving it off falls through to the bar's value.",
    "Nothing wraps, truncates or scrolls. The strip is an inline-flex that grows to fit, so a long model name widens it until it overruns its parent; in a composer's settings slot the caller owns the decision about what gives, and the honest fix is usually a shorter label rather than a wider bar.",
    "A segment's children are its only accessible name, so an icon-only segment ships an unlabeled button unless you give it an aria-label. It is also the smallest target the strip produces: the padding is tuned for a text value at 12px, so an icon alone measures about 30×22 CSS pixels, under the 24×24 minimum WCAG 2.2 asks for. Sitting among other controls is the exception that criterion allows — but pad it yourself before making an icon-only segment a primary affordance.",
    'Values that open with a symbol read differently right-to-left. A batch count written as "×3" starts with a bidi-neutral character, which takes the paragraph direction and swaps to the far side of the digit, so it renders as "3×" in an RTL locale. The component never sees the value and cannot fix it — wrap such a value in dir="ltr", or write it as words.',
    "The strip paints a tinted surface and sets its own foreground because muted text on a muted fill does not clear 4.5:1 in this token set. If you override `className` with a background of your own, you are changing the pairing the component solved for — rebind the token rather than restyling the segments, because composed children carry their own muted classes and a slot-level override cannot reach them.",
  ],
};
