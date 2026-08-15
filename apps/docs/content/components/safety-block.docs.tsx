import type { ComponentDocs } from "@/lib/component-docs";

/**
 * Seeded from docs/design-system/component-specs.md#n10-safety-block.
 * Translate the spec's internal voice into consumer-facing guidance — do not
 * ship the seed text verbatim.
 *
 * No examples sidecar: every do and don't here is a copy decision or a prop
 * that is already rendered by a story, so a live example would only restate
 * the props table. `data-views` and `detail-view-shell` ship the same way.
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
    },
    {
      text: "Always pass `alternatives`. A refusal with an exit is a working guardrail; a refusal without one is the failure state, and it is the difference between a guardrail and a dead end.",
    },
  ],
  donts: [
    {
      text: "Don't write the refusal in the assistant's first person. This surface has to read as the system, and 'I can't help with that' is exactly the voice it exists to replace.",
    },
    {
      text: "Don't quote the fragment when the quote is itself the harm — omit it, or set `sensitive` so revealing it is a deliberate act. Never auto-reveal on hover.",
    },
  ],
  pitfalls: [
    "`alternatives` is optional in the type but mandatory in the spec. Nothing stops you shipping a block with no way forward, and the component will render it without complaint — the EmptyLabel story shows what that looks like so it is recognizable in review.",
    "The reveal is uncontrolled internal state. There is no `revealed`/`onReveal` pair, so you cannot lift it, restore it, or log that a user revealed blocked text — if that reveal is an auditable event in your product, this component cannot report it today.",
    "Activating 'Show blocked text' unmounts the button that was just focused, so keyboard focus drops to the document body and the reader loses their place. Focus is not moved onto the revealed quote.",
    "The root paints `bg-destructive/5` and rebinds `[--muted-foreground:var(--accent-foreground)]`. That rebind is load-bearing — the vendored AlertDescription carries its own muted text, which measures 4.33:1 against that surface. If you override the background, re-check contrast rather than assuming the rebind still fits.",
    "Under `dir=\"rtl\"` the quote rail stays on the left and the text stays left-aligned: the fragment uses physical left-side spacing and the Alert base sets `text-left`. Right-to-left products will need to correct this at the call site until the base moves to logical properties.",
    "It renders `role=\"note\"`, not `role=\"alert\"`. A refusal is not urgent, and an assertive live region would interrupt a screen-reader user mid-sentence every time a policy fires. Don't override the role to make it louder.",
  ],
};
