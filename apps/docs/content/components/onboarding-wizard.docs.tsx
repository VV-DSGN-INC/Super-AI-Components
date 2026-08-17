import type { ComponentDocs } from "@/lib/component-docs";
import {
  AnswersChangeTheProduct,
  ChoiceCardsAsDivs,
  ColourOnlyDots,
  SamePartsPlusAPane,
  SkipOnEveryStep,
  SurveyThatChangesNothing,
} from "./onboarding-wizard.examples";

/**
 * Seeded from docs/design-system/component-specs.md#l6-onboarding-wizard.
 *
 * No "use client" here: this module is plain data read by a Server Component
 * (component-docs.tsx), which destructures `docs.whatItIs`, `docs.evidence`,
 * etc. directly. Every live example is a zero-prop client component defined in
 * ./onboarding-wizard.examples, so nothing here has to serialize across the
 * server/client boundary.
 */
export const OnboardingWizardDocs: ComponentDocs = {
  whatItIs:
    "The first-run flow: one question per screen, answered with choice cards, tracked by a dot rail that says how many steps are left, and escapable at every single step. Steps carry an optional marketing pane, which is the whole of the split-panel variant — same steps, same dots, same Skip, one extra column.",
  whyItMatters:
    "Answers must change the product. A first-run question earns its screen only if answering it visibly moves something downstream — the segment defaults you land on, the templates in your picker, the sample project that opens, the credit pack you are offered. A survey that changes nothing is a tax: it is charged to every new user, at the exact moment they have the least patience and the least reason to trust you, and it buys them nothing. That is why every step here takes an `effect` — the sentence saying what this answer does — and why the honest fix for a step you cannot write an `effect` for is to delete the step, not to leave the field blank. ElevenLabs' role survey, Descript's and CapCut's setup flows, and Claude Cowork's intro all pay for their questions this way: each answer changes what you see the moment the flow ends.",
  evidence: ["ElevenLabs role survey", "Descript", "CapCut", "Claude Cowork intro"],
  anatomy: [
    { slot: "onboarding-wizard", note: "The card that frames the whole flow." },
    {
      slot: "onboarding-wizard-progress",
      note: "A real progressbar. Position, total and how many remain live in its accessible name and aria-valuetext, not only in the dots.",
    },
    { slot: "onboarding-wizard-progress-label", note: "The visible 'Setup progress: step N of M' text, which also names the progressbar." },
    { slot: "onboarding-wizard-dots", note: "The dot rail. Decorative and aria-hidden — it is the picture of the progress, never the record of it." },
    { slot: "onboarding-wizard-dot", note: "One dot per step, carrying data-state done / current / upcoming." },
    { slot: "onboarding-wizard-remaining", note: "Visible '3 to go' / 'Last step' counter — the number the flow is actually judged on." },
    { slot: "onboarding-wizard-content", note: "The question: choice cards, free-form content, and the effect line." },
    { slot: "onboarding-wizard-choices", note: "The radio group behind the choice cards." },
    { slot: "onboarding-wizard-choice", note: "One choice card: a label wrapping a real radio, with data-state selected / unselected." },
    { slot: "onboarding-wizard-effect", note: "What answering this question changes. The line that separates onboarding from a survey." },
    { slot: "onboarding-wizard-panel", note: "The marketing pane. Present only on steps that declare one; always after the question in reading order." },
    { slot: "onboarding-wizard-nav", note: "The footer: Back on one side, Skip and the primary on the other." },
    { slot: "onboarding-wizard-back", note: "Secondary. Disabled on the first step." },
    { slot: "onboarding-wizard-skip", note: "Present on every step, the last one included." },
    { slot: "onboarding-wizard-primary", note: "Reads 'Next' mid-flow and a finish verb on the last step." },
  ],
  usage:
    "Reach for it for the first run of a product whose defaults genuinely differ by who you are — a role that picks a template set, a volume that picks a credit pack, a team answer that turns sharing on. Give each step an `id`, a `title`, either `choices` (single-select cards) or free-form `content`, and an `effect` saying what the answer does. Read the answers back through `onAnswerChange`, or hold them yourself with `answers` and apply them as they arrive. Add `panel` to any step to make it split-panel; add `panelSide` to move the pane visually without changing reading order. Leave `step`/`defaultStep` uncontrolled for a self-contained flow, or drive position from a parent that is persisting progress across a reload. Do not reach for it for a settings page or a per-generation setup — settings are revisited, and a per-generation flow with a cost belongs in E8 generation-wizard, whose preview pane exists to show what a choice will spend.",
  dos: [
    {
      text: "State what each answer changes, on the same screen as the question — and cut any step you cannot write that sentence for.",
      example: <AnswersChangeTheProduct />,
    },
    {
      text: "Keep Skip on every step, including the last, so no single question is quietly mandatory.",
      example: <SkipOnEveryStep />,
    },
    {
      text: "Use the same steps, dots and nav when you add a marketing pane — split-panel is a prop on a step, not a second flow.",
      example: <SamePartsPlusAPane />,
    },
  ],
  donts: [
    {
      text: "Don't ask a question that changes nothing. A survey with no downstream effect is a tax charged to every new user at their least patient moment.",
      example: <SurveyThatChangesNothing />,
    },
    {
      text: "Don't let the dots be the whole of the progress — pair them with a real progressbar and a visible 'step N of M, 3 to go'.",
      example: <ColourOnlyDots />,
    },
    {
      text: "Don't build choice cards as divs with a click handler. They need radio semantics: a group, arrow keys, and aria-checked.",
      example: <ChoiceCardsAsDivs />,
    },
  ],
  accessibility: {
    keyboard: [
      "Four tab stops on a step with choices: the choice group, then Back, Skip and the primary. The group counts once, not once per card — it is a real radio group with a roving tabindex. Back is `disabled` on the first step, so the first step has one stop fewer than every step after it.",
      "Arrow keys inside the choice group also answer the question. Focus moves to the next card and that card is checked in the same keystroke, firing `onAnswerChange` — there is no way to browse the options from the keyboard without committing to each one you pass through. Home and End reach the first and last card.",
      "Space and Enter activate the footer buttons, which are native buttons. Nothing else is bound: Escape does not leave the flow, Enter does not advance a step, and there is no shortcut for Back or Skip.",
      "The step heading takes `tabIndex={-1}` so the wizard can move focus to it programmatically. It is not a tab stop — Tab from the progress row lands on the choice group, not on the title.",
      "Anything you pass as `content` brings its own keys. It is not wrapped in a `<form>`, so Enter in a text field submits nothing and the primary button stays the only way forward.",
    ],
    screenReader: [
      'The dot rail is `aria-hidden`, so position is carried by a real progressbar instead: `ProgressLabel` renders the visible "Setup progress: step 2 of 4" and names the bar, and `aria-valuetext` reads "Step 2 of 4, 2 steps remaining". A progressbar is not a live region, so moving between steps does not announce the new position — it is there to be found, not to interrupt.',
      "The choice group is `aria-labelledby` the step heading, so it announces under the question rather than as an unnamed group.",
      "Each card's radio is named by the entire `<label>` wrapping it, which folds `description` into the name: a card announces as \"Product designer Templates and defaults for design work, radio button, 1 of 4\", not as a name with a separate description. Keep descriptions to one short clause or every card's name becomes a paragraph.",
      "`icon` is `aria-hidden` and contributes nothing to a card's name — `label` and `description` carry all of it.",
      "The `effect` line is plain text under the choices, tied to nothing. It is read when a user walks the step, and is not re-announced when the answer changes.",
      "Skipping the last step ends the flow without moving to another step, so the heading never changes and nothing says setup is finished. Announce that yourself from `onFinish`.",
    ],
    focus: [
      "Every step change moves focus to the new step's heading, deliberately — focus is not left sitting on a nav button whose meaning just changed. It is skipped on mount, so the wizard never steals focus the instant it renders.",
      "That heading carries `outline-none` and no focus style of its own, so the move is silent for sighted keyboard users: a screen-reader user hears the new question, and everyone else watches focus disappear from the button they pressed.",
      "Nothing moves focus at the end. Both the primary and Skip finish the flow in place, leaving focus on a button inside a card your `onFinish` is presumably about to unmount — put focus wherever you send the user next.",
      "The footer buttons and the radios draw the vendored primitives' own `focus-visible` rings, so focus is visible everywhere except on the heading.",
    ],
  },
  pitfalls: [
    "Treating the four declared states as four variants to render one at a time. Choice cards, dot progress and skippability are all present at once in the default flow; split-panel is the only one that is a per-step choice, and even then it is the same machinery with one extra pane.",
    "Dropping Skip on the last step because that is what a commit-shaped wizard does. E8 generation-wizard is right to do it — its last step spends credits. Here it would make the final question the one question a user cannot get past, which is exactly where first-run flows get abandoned.",
    "Collecting answers and never applying them. `onAnswerChange` fires with the step id and value for a reason; if the only consumer is analytics, the flow is a survey wearing setup's clothes.",
    "Marking the dots as the progress and stopping there. The dot rail here is aria-hidden on purpose — the position, the total and the remaining count are on the progressbar and in visible text, and a build that moves the signal back into the dots has reintroduced a colour-only state.",
    "Reaching for `text-muted-foreground` inside the marketing pane. That pane's frame is `bg-muted`, and the pairing measures under the 4.5:1 minimum in this token set — use `text-foreground` or `text-foreground/70`, as the demo pane does.",
    "Putting the marketing pane before the question in the DOM to get it on the left. Use `panelSide: \"start\"`, which moves it visually and leaves the question first for keyboard and screen-reader order.",
  ],
};
