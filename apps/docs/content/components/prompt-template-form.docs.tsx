import type { ComponentDocs } from "@/lib/component-docs";
import {
  CarriedValueStaysEditable,
  DefaultPassedAsValue,
  ParameterAsBlank,
  RequiredMarkedInPlace,
} from "./prompt-template-form.examples";

/**
 * Seeded from docs/design-system/component-specs.md#d9-prompt-template-form.
 *
 * No "use client" here: this module is plain data read by a Server Component.
 * The live examples live in ./prompt-template-form.examples (client sidecar)
 * and are referenced as zero-prop elements.
 */
export const PromptTemplateFormDocs: ComponentDocs = {
  whatItIs:
    "A prompt written once with named blanks in it, and a form for filling them. Each blank is a typed variable (free text or a pick from a list) that can be required, carry a template default, or arrive pre-filled from an earlier step. Underneath sits a live preview of the assembled prompt, so the text a person reads is exactly the text that is sent.",
  whyItMatters:
    "Most people never learn to write a good prompt, and the ones who do keep retyping the same skeleton. A template turns the skeleton into the product's job and leaves the person only the parts that change. The preview keeps the template from becoming a black box: Coda, Copy.ai, Google, Jasper, Relay and Writer all expose some form of fill-in-the-blank prompt, and the ones people trust show what the blanks add up to. The marks matter as much as the blanks. A default the template chose, a value carried from the step before and a blank still waiting on an answer each need to read differently from something the person typed.",
  evidence: ["Coda", "Copy.ai", "Google", "Jasper", "Relay", "Writer"],
  anatomy: [
    { slot: "prompt-template-form", note: "Root. Carries `data-layout` with the active `layout`." },
    {
      slot: "prompt-template-form-step",
      note: "The 'Step 2 of 3' line. Renders only when a `step` is passed, for templates that sit inside a longer flow.",
    },
    {
      slot: "prompt-template-form-template",
      note: "The group holding every blank: the sentence in `inline`, the stack of field rows in `stacked`.",
    },
    {
      slot: "prompt-template-form-blank",
      note: "One blank. Carries `data-source` (default, carried, entered or empty) and `data-missing` while it is flagged, so state is addressable without reading text.",
    },
    {
      slot: "prompt-template-form-mark",
      note: "The text beside a blank saying where its value came from or that it is still needed: Default, From a step, Required, Still needed.",
    },
    {
      slot: "prompt-template-form-preview",
      note: "The labelled block under the form. Its child `prompt-template-form-preview-text` is the polite live region holding the assembled prompt.",
    },
    {
      slot: "prompt-template-form-run",
      note: "The run button. It is never disabled; pressing it with a required blank empty flags the blank instead.",
    },
    {
      slot: "prompt-template-form-blocked",
      note: "The '2 still needed' count beside the run button. Appears once missing blanks have been revealed.",
    },
  ],
  usage:
    "Reach for it when the same prompt shape is used again and again and only a few nouns change: a brief, a summary, a reply in a given tone. Pass `template` as an array in which a plain string is literal text and an object is a blank. Use `inline` when the template reads as one sentence and the blanks are short; use `stacked` when there are more than three or four blanks, when the values are long, or when the form sits in a narrow column. Put the template's own choices in a blank's `defaultValue` so they wear a Default mark, and put values from an earlier step in `defaultValues` or `values` with `carriedFrom` naming that step. Handle `onRun` to send the prompt it hands you.",
  dos: [
    {
      text: "Mark a required blank where it sits and let the run button refuse, rather than disabling the button or raising a toast. Pass `showMissing` when resuming a draft that should open with the gaps already visible.",
      example: <RequiredMarkedInPlace />,
    },
    {
      text: "In a multi-step flow, carry earlier answers forward with `carriedFrom` and leave them editable. The mark says where the value came from; the field says it is still the person's to change.",
      example: <CarriedValueStaysEditable />,
    },
  ],
  donts: [
    {
      text: "Do not deliver the template's own choice through `defaultValues`. It renders as something the person entered, with no Default mark. Use the blank's `defaultValue`.",
      example: <DefaultPassedAsValue />,
    },
    {
      text: "Do not make a generation setting a blank. Temperature, seed and length are parameters of the run, not words in the prompt; they belong in a parameter panel.",
      example: <ParameterAsBlank />,
    },
  ],
  accessibility: {
    keyboard: [
      "One tab stop per blank in source order, then the run button. Nothing in the preview is focusable. `layout` changes the visual arrangement only, so the tab order is identical in `inline` and `stacked`.",
      "A text blank takes typing. A select blank opens with Enter, Space or the arrow keys and moves with the arrows, as any Select does.",
      "The run button is never disabled, so it is always reachable. Pressing it with a required blank empty does not call `onRun`; it marks every empty required blank and moves focus to the first one.",
      "Enter in a text blank does not run the prompt. There is no form element and no submit shortcut, and Escape does nothing.",
    ],
    screenReader: [
      "Every blank is a labelled control named by its `label` alone. In `inline` the name comes from an `aria-label`, so the words around the blank are never part of it; in `stacked` the name comes from the field row's label element.",
      "Required blanks carry `aria-required`. A flagged blank carries `aria-invalid` and is described by its mark, so a screen reader gets the label, the invalid state and the description 'Still needed'. A default or carried blank is described the same way: 'Tone, Default'.",
      'The preview is `role="status"` with `aria-live="polite"`, named \'Prompt preview\'. It is atomic, so the whole assembled prompt is read again after each change; on a long template with a fast typist that is a lot of speech, and a screen reader may coalesce it.',
      "While a required blank is empty the preview shows its label in square brackets in place of a value. Run is blocked exactly then, so a prompt with brackets in it is never sent.",
      "The group around the blanks is named 'Prompt template'. The select's popup list is named '<label> choices'.",
      "Provenance is carried by text, not colour: Default, From Brief, Required and Still needed are words, and the flagged mark also has an icon marked `aria-hidden`.",
    ],
    focus: [
      "Focus moves once: on a refused run it lands on the first empty required blank. Nothing else moves focus, and editing a blank never steals it.",
      "Clearing a required blank flags it immediately without moving focus, so a person correcting their own text is not interrupted.",
    ],
  },
  pitfalls: [
    "`defaultValue` on a blank and `defaultValues` on the form are different things. The first is the template's choice and is marked Default until the person edits the blank. The second is initial state for the form, and a value there looks entered. Carrying a value in from an earlier step is the second case, and `carriedFrom` is what marks it.",
    "The Default and From marks clear on the first edit and do not come back. Setting a blank back to its default text leaves it marked as entered, because the person has made the choice by then.",
    "Controlled use means `values` is the whole truth: the form calls `onValuesChange` with the full next record and shows nothing new until you pass it back. A blank with no key in `values` falls back to its `defaultValue`, so removing a key restores the default and its mark.",
    "Whitespace is normalised in the prompt: runs of spaces collapse and the ends are trimmed. An optional blank left empty disappears from the sent text, and a sentence built around it can read oddly. Write templates so each optional blank can vanish.",
    "A blank's `id` keys the values record, so two blanks with the same id edit each other. Keep ids unique within a template.",
  ],
  variants: [
    {
      prop: "layout",
      default: "stacked",
      values: [
        {
          value: "inline",
          intent:
            "The template reads as one sentence and the blanks are a word or two each. The person sees the prompt as they fill it, at the cost of narrow controls.",
        },
        {
          value: "stacked",
          intent:
            "Four or more blanks, long values, or a narrow column. Each blank gets a labelled row of its own, which is easier to scan and to correct.",
        },
      ],
    },
  ],
  insteadUse: [
    {
      component: "slot-summary",
      when: "The system has already understood the request and you are reading its resolved values back before it acts. A prompt template asks the person for the values up front; slot-summary shows what was understood afterwards and lets them correct it.",
    },
    {
      component: "parameter-panel",
      when: "The inputs are generation settings such as temperature, length or seed. Those change how a run behaves, not what the prompt says, and they do not belong in the prompt text.",
    },
    {
      component: "generation-wizard",
      when: "The flow is a multi-step generate dialog with its own steps, review and submit. A multi-step template here is one form per step in a flow you own; the wizard supplies the steps themselves.",
    },
    {
      component: "onboarding-wizard",
      when: "The questions are a first-run survey whose answers shape the product, not a prompt that gets sent.",
    },
  ],
};
