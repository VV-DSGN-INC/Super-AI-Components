# Paywall Message

> The turn in an assistant conversation where a run was stopped because the plan does not cover it — a locked model, an exhausted quota, or a feature the account never had. It is a card that holds the work rather than an advert for the plan: the prompt and the model that would have been used stay on it verbatim, a greyed sample shows what was about to be produced, and the agent's own prose sits above and below it.

Layer: component · Family: M · Install: `npx shadcn@latest add https://super-ai-components.vercel.app/r/paywall-message.json` · Contract: `components/super-ai/paywall-message.meta.json` (installed beside the component; version-locked to the code, so it outranks this page) · Docs: https://super-ai-components.vercel.app/components/paywall-message

## Why it matters

Freepik's agent is the clearest evidence on the reference board that a paywall is a state of the conversation, not a screen you get sent to. Everything else an assistant does keeps your context; a paywall that throws it away charges you twice — once in money, once in retyping the prompt you had just finished writing. Holding the prompt and the model turns upgrading into resuming, so the user pays and the exact run continues. Wrapping the card in the agent's own explanation is what keeps it reading as a conversation rather than as an ad dropped into one.

## When to reach for it

Reach for it the moment a generation is refused for a plan reason, in the place the result would have appeared — inside the message stream, never as a modal or a toast. Pass the prompt as a plain string rather than formatted output: it is what `onUpgrade` hands back so the caller can re-run the exact work. Pick `state` for the gate that actually fired (`locked-model`, `quota-exhausted` or `feature-locked`), and leave affordability alone — wrap the surface in `CostProvider` and the shortfall line derives itself from the balance and the estimate, so this card cannot disagree with the run button about the same job. Titles, descriptions and the CTA label all have per-state defaults; override them only when your product's wording is genuinely different.

## Variants

Not yet recorded.

## Instead use

Not yet recorded.

## Do

- Keep the prompt and the model on the card, and wire `onUpgrade` to re-run the payload it hands you — upgrading should resume, not restart.
- Caption the greyed preview, so that it has not been produced yet survives for anyone who cannot see the dimming.

## Don't

- Don't drop the card in bare — an upgrade card with no explanation before or after it reads as an ad in the middle of a conversation.
- Don't explain the block and then discard the work — telling someone to re-enter their prompt after paying is the failure this component exists to prevent.

## Anatomy

- `paywall-message`: Root of the whole turn: prose, card, prose. Carries data-state.
- `paywall-message-before`: The agent's explanation, above the card. Required.
- `paywall-message-card`: The card itself, a named region labelled by its title.
- `paywall-message-title`: Which gate fired, in words, with a distinct icon per reason.
- `paywall-message-requirement`: The plan or entitlement needed, e.g. Pro. Text, never colour.
- `paywall-message-description`: Reassurance that nothing was charged, because nothing ran.
- `paywall-message-resume`: The held work — the block that makes upgrading a resume.
- `paywall-message-prompt`: The prompt, verbatim and at full strength. Never greyed.
- `paywall-message-model`: The model that would have been used, part of the resume.
- `paywall-message-preview`: Greyed sample of the output, under a visible caption.
- `paywall-message-cost`: The price via the shared formatter, plus the derived shortfall.
- `paywall-message-shortfall`: Need 900 credits, you have 120 — derived, never a prop.
- `paywall-message-actions`: Upgrade, and top-up when the cost contract offers one.
- `paywall-message-after`: The follow-on: what happens next, or what the agent can do meanwhile.

## Accessibility

**Keyboard**

- Between zero and two tab stops, and both are conditional. The upgrade button renders only when you pass `onUpgrade`; the top-up button only when the cost contract supplies `onTopUp` and money is genuinely what is missing. A `feature-locked` card with no `onUpgrade` has nothing to tab to at all.
- Both are native buttons, so Space and Enter activate them. Nothing else is bound — no Escape, no shortcut — because this is a turn in a message stream, not a dialog, and it is not supposed to be dismissible.
- The held prompt is text, not a field. There is no keyboard path to copy, edit or re-run it from inside the card; if the user needs one, render it yourself beside the CTA.

**Screen reader**

- The card is `role="group"` labelled by its own title, so it announces as a named group inside the stream rather than as an unlabelled block. It is deliberately not a live region: the surrounding turn already announces, so the card itself says nothing on arrival.
- The per-state icon is `aria-hidden`. Which gate fired is carried entirely by the title text — "You are out of credits" — which is why overriding `title` with something vaguer costs more than it looks.
- `requirement` renders as a bare badge with no prefix, so passing "Pro" announces as the single word "Pro" beside the title. Write something that survives on its own — "Pro plan" — if the tier name alone would not.
- The cost chip is passed `unit=""` because `formatCost` has already put the unit into the amount, so the span reads "900 credits/min" rather than a bare number — the empty unit stops A2 appending a second "credits". This note said the opposite until 2026-09-06, and the story now asserts what is announced. The derived shortfall line beside it repeats the unit, and only renders when a balance is known
- `before` and `after` are plain paragraphs outside the group, tied to it by reading order alone. That is the intent — the agent explains, then the card — but a user who jumps straight to the group gets the card without the explanation.
- The greyed preview is announced exactly like the prompt above it; the dimming carries nothing. Its visible "Would have produced" caption is the whole of the non-visual signal, which is why the caption is not optional.

**Focus**

- Nothing here moves focus, and nothing unmounts on its own — the card holds its shape until the caller replaces it. If `onUpgrade` swaps this turn for the resumed run, the focused button vanishes with it, so land focus on the new content yourself.
- Both buttons inherit the vendored `Button`'s `focus-visible` ring; this component adds no focus styling of its own.

## Pitfalls

- Passing affordability in. There is no insufficient or shortfall prop, on purpose: both are derived by useCost from the estimate and the balance in CostProvider. Choosing the quota-exhausted state declares which gate fired; it does not fabricate a shortfall line, so if no balance is in context nothing renders rather than a guess.
- Greying the prompt along with the preview. The preview is dimmed because it does not exist yet; the prompt does exist, and dimming it reads as though it has been thrown away — precisely the impression the card is trying to avoid.
- Reaching for text-muted-foreground when restyling the preview or the description. The resume block sits on a muted tint, and muted text on a muted surface measures 4.34:1 against a 4.5:1 minimum — use text-foreground/70, as this component and promo-card do.
- Treating top-up and upgrade as the same button. Top-up appears only when the cost contract supplies onTopUp and money is genuinely what is missing — the quota gate fired, or the contract derived a shortfall. On a locked model you can already afford, more credits buy nothing, so the card does not offer them.
- Rendering it as a modal or a toast. The constraint persists and the held work is the point — a message that dismisses itself takes the user's prompt with it.

## Composition

- States: `locked-model`, `quota-exhausted`, `feature-locked`
- Composes from this registry: cost, cost-chip
- shadcn primitives: badge, button, card
- npm: lucide-react

## Evidence

Freepik
