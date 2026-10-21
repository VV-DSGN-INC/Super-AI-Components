# AI Label

> A small outlined chip that says what AI did to a piece of content: generated it, edited it, summarized it, wrote this message, or stopped replying at a handoff. The chip text is one word or two; the accessible name is the full sentence, with the model and the time folded in. A sixth form, `text-tint`, draws no chip at all and instead wraps AI-sourced prose in a reserved tint. The component also owns the glyph for "AI acted here", exported as `AI_LABEL_ICON`, so surfaces stop importing a sparkle icon of their own.

Layer: primitive · Family: A · Install: `npx shadcn@latest add https://super-ai-components.vercel.app/r/ai-label.json` · Contract: `components/super-ai/ai-label.meta.json` (installed beside the component; version-locked to the code, so it outranks this page) · Docs: https://super-ai-components.vercel.app/components/ai-label

## Why it matters

Disclosure only works when it is consistent. Character.ai, Intercom Fin, Productboard, Tactiq, TikTok, Zapier and Zoom each mark AI output somewhere, and each marks it differently, so a reader learns nothing that transfers. iA Writer shows the other half: a quiet tint on AI-sourced text that survives editing. Four components in this registry (`ai-doc-block`, `result-card`, `artifact-grid`, `escalation-handoff`) draw the same mark by hand today; this primitive is the one place the mark, its wording and its accessible name are decided.

## When to reach for it

Pick the variant by what happened to the content: `generated` for text or media the AI produced, `edited` when it changed something a person wrote, `summarized` for a condensation. Pass `by` and `at` when the product knows the model and the time, and `detail` for anything longer. Use `sender` beside the name on a message, comment or notification the AI wrote, and switch the AI's earlier turns to `after-handoff` once a person takes over, so the reader can see where the AI stopped. Wrap AI-sourced prose in `text-tint` when the text itself, not a block, is what needs marking. Override the chip text through `children` if your product says "Rewrote" instead of "Edited"; the shape and the accessible name stay. Reach for a plain Badge when the chip is a status unrelated to AI.

## Variants

### variant (default: `generated`)

- `generated`: The AI produced this content from nothing, such as a draft, an image or a reply you asked for.
- `edited`: A person wrote it and the AI changed it, so the reader knows the words are no longer only theirs.
- `summarized`: The content condenses something else, so the reader knows the original is longer and may differ.
- `sender`: The AI wrote this message, comment or notification, and it sits beside the author's name so it cannot be taken for a person.
- `after-handoff`: The AI's turns ended at a handoff to a person, and the earlier turns need to show where it stopped.
- `text-tint`: The text itself, inline in a paragraph, is what came from the AI, and a chip beside it would break the sentence.

## Instead use

- **disclaimer-note**: The point is a caveat about reliability (AI can make mistakes) rather than attributing an action that already happened.
- **cost-chip**: The chip would carry a number, such as a price in credits. This label holds one or two words and no figures.
- **citation-ref**: The pointer is to a source the content came from, not to the fact that AI produced it.

## Do

- Say what happened to the content. The default copy names the action, so a reader can tell a draft from a rewrite at a glance.
- Put `sender` beside the name, and switch the AI's earlier turns to `after-handoff` once a person takes over. The dashed border marks the stop without relying on colour.
- Wrap AI-sourced prose in `text-tint` and use the tint for nothing else.

## Don't

- Don't reduce the chip to a bare "AI". It says who, not what, and it reads as a brand badge.
- Don't put a caveat or a source in the chip. A reliability warning belongs to `disclaimer-note`, and a pointer to a source belongs to `citation-ref`; this chip only attributes an action.

## Anatomy

- `ai-label`: The chip, or the `text-tint` wrapper. A `role="note"` carrying the full-sentence `aria-label`; it is the tab stop only when `by`, `at` or `detail` gives the tooltip something to say.
- `ai-label-icon`: The shared AI glyph, `aria-hidden`. Not present on `text-tint`.
- `ai-label-text`: The one-or-two-word chip text. `children` replaces it.
- `ai-label-detail`: The tooltip body: the full sentence, then `detail` as plain text.

## Accessibility

**Keyboard**

- Zero tab stops on a bare chip. The chip is a `role="note"` span with nothing to activate.
- One tab stop when `by`, `at` or `detail` is set, because the tooltip then has something to show. Focusing the chip opens it; Escape closes it.
- The chip has no activation key. A link inside the tooltip cannot be reached by keyboard, so `detail` is text only; put any link to credentials on the surrounding surface.
- `text-tint` is never a tab stop.

**Screen reader**

- The chip is `role="note"` with an `aria-label` holding the full sentence, for example "Generated by AI, Claude, 3 minutes ago". The visible chip text ("Generated") is shorter on purpose and does not form the name.
- `text-tint` is a `role="group"` whose label announces before the prose: "Text written by AI". Reading the prose itself is unchanged.
- The glyph is `aria-hidden`.
- `detail` is announced only when the tooltip opens on focus. It is not part of the accessible name, so anything a reader must not miss belongs in `by` or `at`.
- Overriding the chip text through `children` does not change the name, so a chip reading "Rewrote" still announces "Edited by AI".
- There is no live region. A label that appears after the content streams in appears silently.

## Pitfalls

- `text-tint` is a wrapper treatment and is reserved. Applied to anything other than AI-sourced prose it stops meaning anything, and a second component that borrows it makes the signal unreadable.
- The tint passes contrast by itself, on the page background. Do not place it on a muted or accent surface to "quiet it down": it was measured without one, and a tinted surface behind it changes the result.
- `sender` must not be mistaken for a person. If the AI's name sits next to a human-looking avatar and no chip, the reader has nothing to tell them apart; keep the chip on every AI turn.
- The chip carries no model information on screen. If the product wants the model visible without hovering, put it in your own text beside the chip rather than stretching the chip beyond two words.
- Passing a `data-slot` of your own through the spread replaces `ai-label` and hides that this primitive drew the mark.

## Composition

- States: `generated`, `edited`, `summarized`, `sender`, `after-handoff`, `text-tint`
- Composes from this registry: nothing
- shadcn primitives: badge, tooltip
- npm: lucide-react

## Evidence

Character.ai, Intercom Fin, Productboard, Tactiq, TikTok, Zapier, Zoom, iA Writer
