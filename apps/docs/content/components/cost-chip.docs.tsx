import type { ComponentDocs } from "@/lib/component-docs";

import { CostChip } from "@/registry/super-ai/cost-chip";

/**
 * Seeded from docs/design-system/component-specs.md#a2-cost-chip.
 * Translate the spec's internal voice into consumer-facing guidance — do not
 * ship the seed text verbatim.
 *
 * No "use client" here: this module is plain data read by a Server Component
 * (component-docs.tsx). No ./cost-chip.examples sidecar either — every
 * example below is static markup and the chip exposes no callbacks, so there
 * is nothing that needs the client boundary. The sidecar is optional; this
 * component does not earn one.
 */
export const CostChipDocs: ComponentDocs = {
  whatItIs:
    "A small pill that prices one action: a coin icon, a number, and the unit that number is counted in. The unit is a prop rather than a hardcoded word, because metered AI products bill in credits, GPU-minutes, tokens or money depending on the surface — and `amount` accepts a pre-formatted string, so the price can be rounded and grouped once, upstream, and printed identically everywhere it appears.",
  whyItMatters:
    "Quota pricing only works if the price is legible at the moment of choosing. ElevenLabs is the clearest instance of this exact form — the per-action chip sitting on the thing being priced — while Freepik and Tripo run the persistent balance ring and Playground states the price as a line above the action. Those are three different answers to the same question, and this component is the per-action one. It is also the smallest piece of a three-part contract: `credits-indicator` is what you have, this chip is what the next action costs, `run-button` is what you are about to spend. Six components in this registry render this chip rather than formatting a price of their own, which is what stops one job from being quoted two ways.",
  evidence: ["ElevenLabs", "Freepik", "Tripo", "Playground"],
  anatomy: [
    {
      slot: "cost-chip",
      note: "The pill. A span, not a control — it is decoration attached to something focusable, and it takes no focus of its own.",
    },
    {
      slot: "cost-chip-amount",
      note: 'The number and its unit, pinned dir="ltr" so a price keeps its digit order inside an RTL paragraph and the currency symbol or the slash in a rate does not migrate.',
    },
  ],
  usage:
    'Put it on the thing being priced — the model row, the skill in a menu, the action in a stack, the run control — where the price is read in the same glance as the choice. Pass `amount` and, when the price is not in credits, `unit` (it defaults to `"credits"`). For a rate, put the denominator in the unit: `unit="credits/min"`. For a price that some upstream formatter already rendered, pass the whole formatted string as `amount` and set `unit=""` so the chip prints it untouched. Reach for `credits-indicator` instead when the number is a balance rather than a price: the test is whether it would still be true with nothing selected.',
  dos: [
    {
      text: "Attach it to the thing it prices, in the same row, so choosing and pricing happen in one glance rather than one lookup.",
      example: (
        <div className="flex w-[260px] items-center gap-2 rounded-md border p-2">
          <span className="min-w-0 flex-1 truncate text-xs font-medium">Veo 3.1</span>
          <CostChip amount={20} />
        </div>
      ),
    },
    {
      text: 'Format the price once, upstream, and pass the result as `amount` with `unit=""` — then the chip, the run button and the paywall card cannot round the same number three different ways.',
      example: <CostChip amount="1,240 credits" unit="" />,
    },
  ],
  donts: [
    {
      text: "Don't use it for a balance. A running total belongs in the chrome and belongs to `credits-indicator`; putting it in a chip attaches it to whatever it happens to sit beside, and people read it as the price of that thing.",
      example: <CostChip amount={414} unit="credits left" />,
    },
    {
      text: "Don't hand it an unrounded number. The chip prints exactly what it is given, so a per-token price that was summed in floating point arrives on screen in full.",
      example: <CostChip amount={0.30000000000000004} />,
    },
  ],
  accessibility: {
    keyboard: [
      "Zero tab stops, always. The chip is a `<span>` with no role, no `tabIndex` and no handlers of its own, so Tab passes over it — which is correct, because it is decoration attached to something focusable rather than a control.",
      "It has no keys of its own and no disabled state. If the thing being priced is disabled, the price beside it does not change or dim; that is the caller's decision to render or not render.",
      "Spreading an `onClick` through `...props` makes the span clickable by mouse and by nothing else — a span takes no focus and fires on no key. If the price needs to be actionable, put it inside your own button rather than on the chip.",
    ],
    screenReader: [
      "The coin glyph is `aria-hidden`, so the announced text is exactly the amount and unit: \"20 credits\". Anything you pass as `children` is appended to that same text, which is why a qualifier like \"est.\" becomes part of the announced price.",
      "There is no association with the control the chip prices. Nothing here sets an `id` or an `aria-describedby`, so a screen-reader user tabbing to a Run button hears the button's name and not the price beside it — the price is only found by reading the surrounding text. Give the chip an `id` and point the control's `aria-describedby` at it when the price has to travel with the control.",
      "`dir=\"ltr\"` is pinned on the amount, so the digits, the currency symbol and the slash in a rate keep their order inside an RTL paragraph rather than migrating to the wrong end of the number.",
      "The chip has no live region. Changing `amount` — swapping models, or a rate updating — rewrites the text with nothing announced, so a price that moves while the user is deciding moves silently.",
      "There is no role and no state, so the spec's estimate/confirmed/insufficient distinctions reach assistive tech through your own copy or through `run-button`, never through this chip.",
    ],
  },
  pitfalls: [
    'The chip has one surface. There is no `state`, `tone` or `variant` prop, so it cannot render the spec\'s estimate, confirmed or insufficient distinctions — an estimate is marked by whatever you put in the trailing slot, and a shortfall is handed off to `run-button` (`state="insufficient-credits"`) or `paywall-message`, which own the shortfall line and the buy control. Do not paint an alarm colour on the chip through `className` to fill the gap; a red price and a neutral price for one job is exactly the disagreement this component exists to prevent.',
    'It spreads `...props` after its own attributes, so passing a `data-slot` of your own erases `cost-chip` and hides the fact that A2 is what rendered the price. Address it by its own slot in tests, and wrap it if you need a hook of your own — every composing component in this registry does exactly that.',
    'The text is interpolated as `{amount} {unit}` with no conditional, so `unit=""` leaves a trailing space in the text node. It is invisible on screen, and it fails an exact-string assertion on `"17"` — match with a regex or trim.',
    "Children render after the amount and carry no slot of their own. They inherit the chip's type size and join its accessible text, so a qualifier like `est.` becomes part of what a screen reader announces for the price — which is usually what you want, and always worth saying out loud.",
    "The chip never truncates and never shrinks. It is an inline-flex that grows to fit, so a long unit widens it, and inside a narrow container the text wraps and the full-round pill turns into a tall stadium. Keep units to the short nouns the system emits, and let the neighbour give way instead.",
  ],
};
