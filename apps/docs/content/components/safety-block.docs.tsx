import type { ComponentDocs } from "@/lib/component-docs";
import {
  BlockWithAWayForward,
  FragmentQuotedInTheClear,
  RefusalInTheAssistantsVoice,
  VariantMatchesTheEvent,
} from "./safety-block.examples";

/**
 * Seeded from docs/design-system/component-specs.md#n10-safety-block.
 * Translate the spec's internal voice into consumer-facing guidance — do not
 * ship the seed text verbatim.
 *
 * No "use client" here: this module is plain data read by a Server Component
 * (component-docs.tsx), which destructures `docs.whatItIs`, `docs.evidence`
 * and so on directly. The live renders live in the ./safety-block.examples
 * client sidecar and arrive here as zero-prop elements — the copy decisions
 * this component is about are the kind you have to see side by side, and the
 * `sensitive` reveal needs client state to be usable rather than merely
 * visible.
 */
export const SafetyBlockDocs: ComponentDocs = {
  whatItIs:
    "A system-voiced notice that a policy stopped something. It comes in two variants because two different things can be stopped: `input-blocked` means the request was never sent, `output-blocked` means it ran and the answer is being withheld. Every block names the policy that fired; optionally it quotes the span that triggered it, blurs that quote until the reader asks for it, and points at the compliant path.",
  whyItMatters:
    "The failure mode this exists to prevent is a refusal delivered in the assistant's own voice. When the model says \"I can't help with that\", the user cannot tell whether a policy fired or the model is being evasive — and an evasive model reads as a broken product. A different container, a system icon and a named source make the difference legible at a glance, which is the entire reason this is a component and not a message bubble. AWS Bedrock Guardrails ships separate blocked-prompt and blocked-response messaging for the same reason: the two events tell the user different things about what to do next.",
  evidence: ["AWS Bedrock Guardrails", "ChatGPT", "Claude"],
  anatomy: [
    {
      slot: "safety-block",
      note: "The root notice. Paints a pale destructive surface and rebinds --muted-foreground so composed children stay legible on it.",
    },
    {
      slot: "safety-block-title",
      note: "The headline, chosen by variant — 'Request blocked' or 'Response withheld'. Not author-supplied, so the two events can never be described in the same words.",
    },
    {
      slot: "safety-block-policy",
      note: "The named policy that fired. Required, and rendered in foreground text so it reads as the source rather than as body copy.",
    },
    {
      slot: "safety-block-fragment",
      note: "The quoted span that triggered the block. Present only when you pass `fragment`; blurred and hidden from assistive tech while `sensitive` is set and unrevealed.",
    },
    {
      slot: "safety-block-alternatives",
      note: "The way forward — rephrase, narrow, or the surface that can answer. Present only when you pass `alternatives`.",
    },
  ],
  usage:
    "Reach for it the moment a policy — not an error, not a quota — stops a request or its answer. Pick the variant from what actually happened: if the request never left, `input-blocked`; if it ran and you are holding the response back, `output-blocked`. Name the policy in words the user could go and look up. Quote the triggering fragment when seeing it helps them fix the prompt, and set `sensitive` when the quote is the kind of thing that should not sit on screen in an open-plan office. If the thing blocking them is something a person could clear, you want `escalation-handoff` instead: this component's exit is the user rephrasing, not a human taking over.",
  dos: [
    {
      text: "Choose the variant from what actually happened — whether the request ran is the fact that decides what the user does next, and the two headlines are deliberately not interchangeable.",
      example: <VariantMatchesTheEvent />,
    },
    {
      text: "Always pass `alternatives`. A refusal with an exit is a working guardrail; a refusal without one is the failure state, and it is the difference between a guardrail and a dead end.",
      example: <BlockWithAWayForward />,
    },
  ],
  donts: [
    {
      text: "Don't write the refusal in the assistant's first person. This surface has to read as the system, and 'I can't help with that' is exactly the voice it exists to replace.",
      example: <RefusalInTheAssistantsVoice />,
    },
    {
      text: "Don't quote the fragment when the quote is itself the harm — omit it, or set `sensitive` so revealing it is a deliberate act. Never auto-reveal on hover.",
      example: <FragmentQuotedInTheClear />,
    },
  ],
  accessibility: {
    keyboard: [
      "Usually zero tab stops. Nothing in a block is focusable — the title, the policy name, the quote and the alternatives are all text, and `alternatives` is a node you supply, so any control in it is yours and counts as your stop.",
      'One tab stop exists in exactly one case: `sensitive` set and the quote not yet revealed puts a "Show blocked text" button in the flow. Space and Enter activate it, and it disappears the moment it is used — there is no way to hide the quote again from the keyboard, or at all.',
      "Nothing here dismisses. There is no Escape handler and no close control; the block stays until the surface that rendered it takes it away.",
    ],
    screenReader: [
      'The root is `role="note"`, not `role="alert"` — it deliberately overrides the vendored `Alert`\'s own role. That means a block arriving in place of a streaming response announces **nothing**. It is a considered trade (an assertive region would cut across a screen-reader user mid-sentence on every refusal), but it does put the announcement on you: the surface that swaps a response for a block is the thing that has to say so.',
      'The title is a `div`, not a heading. "Request blocked" and "Response withheld" carry the whole meaning of the component and are invisible to heading navigation, so a user skimming by headings passes straight over a refusal.',
      'The policy name is announced as bare text with nothing marking it as the policy. There is no "Policy:" prefix and no label — "Personal data policy" simply follows the body copy in reading order, so write a `policy` string that is self-describing on its own.',
      "While `sensitive` is set and unrevealed, the quote is `aria-hidden`: it is genuinely absent from the accessible tree, not merely blurred. The blur is a visual treatment and the `aria-hidden` is the real gate, so a screen-reader user gets the button and no quote — which is the intent, but it also means they cannot judge whether revealing is worth it.",
      "Revealing announces nothing. There is no live region, so the quote simply exists after the button is pressed and a screen-reader user has to go looking for it.",
      "The `ShieldAlert` glyph is the one icon in this component that is **not** marked `aria-hidden`, unlike the icons in most of this registry. It has no `title`, so it contributes no name, but it is not explicitly removed from the tree either.",
      '"Show blocked text" is a plain button with no `aria-expanded` and no `aria-controls`. It reads as an action, not as a disclosure, so nothing tells a screen-reader user that something is being hidden until they press it.',
    ],
    focus: [
      "Revealing the quote unmounts the button that had focus and nothing restores it, so focus falls to `<body>` and the next Tab restarts from the top of the page. Focus is not moved onto the revealed quote either, so the thing the user just asked for is not where they are standing.",
      "The reveal button is a vendored `Button` and ships a visible `focus-visible` ring. Anything you pass through `alternatives` inherits whatever focus style your app has.",
    ],
  },
  pitfalls: [
    "`alternatives` is optional in the type but mandatory in the spec. Nothing stops you shipping a block with no way forward, and the component will render it without complaint — the EmptyLabel story shows what that looks like so it is recognizable in review.",
    "The reveal is uncontrolled internal state. There is no `revealed`/`onReveal` pair, so you cannot lift it, restore it, or log that a user revealed blocked text — if that reveal is an auditable event in your product, this component cannot report it today.",
    "Activating 'Show blocked text' unmounts the button that was just focused, so keyboard focus drops to the document body and the reader loses their place. Focus is not moved onto the revealed quote.",
    "The root paints `bg-destructive/5` and rebinds `[--muted-foreground:var(--accent-foreground)]`. That rebind is load-bearing — the vendored AlertDescription carries its own muted text, which measures 4.33:1 against that surface. If you override the background, re-check contrast rather than assuming the rebind still fits.",
    'Under `dir="rtl"` the quote rail stays on the left and the text stays left-aligned: the fragment uses physical left-side spacing and the Alert base sets `text-left`. Right-to-left products will need to correct this at the call site until the base moves to logical properties.',
    'It renders `role="note"`, not `role="alert"`. A refusal is not urgent, and an assertive live region would interrupt a screen-reader user mid-sentence every time a policy fires. Don\'t override the role to make it louder.',
  ],
};
