# Disclaimer Note

> A short, permanent note that sits next to AI-generated output and says it can be wrong. It renders in three placements — directly under a composer, as a footer strip inside a card, and inline alongside other content — but carries the same non-negotiable property in all three: it never has a close button.

Layer: component · Family: N · Install: `npx shadcn@latest add https://super-ai-components.vercel.app/r/disclaimer-note.json` · Contract: `components/super-ai/disclaimer-note.meta.json` (installed beside the component; version-locked to the code, so it outranks this page) · Docs: https://super-ai-components.vercel.app/components/disclaimer-note

## Why it matters

Claude, NotebookLM, Manus, and Freepik all ship one, and it has moved from a convention to something closer to a regulatory expectation for products that generate content. A disclaimer that can be dismissed only has to be seen once, which defeats the reason it exists — the user needs it available every time they're deciding whether to trust an output, not just the first time.

## When to reach for it

Place it directly adjacent to the output it qualifies — under the composer that produces a response, as the last element inside a card of generated content, or inline beside a piece of AI-written text — never on a settings or about page where the user has to go looking for it. Pick the variant that matches where it physically sits: `under-composer` for a persistent row beneath an input, `in-card` for a footer separated from generated content by a rule, `inline` for a compact mention beside other metadata. Override the default copy with children when a product needs specific wording (e.g. naming the model), and only pass `link` when there's somewhere real to send the user — a support article or settings page, not a bare '#'.

## Variants

Not yet recorded.

## Instead use

Not yet recorded.

## Do

- Keep the message permanent and readable — full-contrast text, findable the tenth time as easily as the first.
- Separate it from the content above with a rule when it's inside a card, not a tinted background.

## Don't

- Don't style the disclaimer so faintly it can't be read — muted text on a muted or accent surface fails contrast in this token set (4.34:1 against a 4.5:1 minimum) and defeats the point of a trust surface.
- Don't bolt on a dismiss control — a disclaimer the user can close after one viewing isn't doing the job it exists for.

## Anatomy

- `disclaimer-note`: Root wrapper; carries the placement variant.
- `disclaimer-note-icon`: Small, decorative marker — never the only signal, always paired with text.
- `disclaimer-note-text`: The disclaimer copy itself, in full-contrast foreground text.
- `disclaimer-note-link`: Optional 'learn more'-style link; always carries its own discernible label.

## Accessibility

**Keyboard**

- Zero tab stops without `link`, exactly one with it. The note is a `<div>` of text; the only focusable thing it can ever contain is the optional anchor.
- The anchor is a plain `<a href>` with no `target` and no `rel`, so Enter follows it in the same tab and takes the user away from the output they were checking. If it should open a support article beside the work rather than instead of it, wrap or replace the link yourself.
- There is nothing to dismiss and no `Escape` handler, because there is no dismissal — that absence is the component's whole contract, not an omission.

**Screen reader**

- The note is an unlabelled `<div>` with no role and no live region, so it is announced as ordinary text at whatever point it sits in the reading order. Placement is therefore the entire accessibility design: under the composer it is read after the input, in a card it is read last, inline it is read wherever you put it.
- The default copy reads as a complete sentence on its own, which is what keeps it intelligible when the icon never renders and when it is heard out of visual context.
- The `Info` glyph is `aria-hidden`, so the icon contributes nothing to the announced text and the words carry the whole message — the same reason it is never the only signal on screen.
- Nothing associates the note with the output it qualifies. There is no `id` and no `aria-describedby` wiring, so a screen-reader user landing on a generated card is not told the card carries a disclaimer. Give the note an `id` and point the output container's `aria-describedby` at it when the qualification has to travel with the content.
- `link` needs discernible text of its own: someone pulling up a list of links hears only the label, never the sentence around it, so "Learn about AI limits" works and "here" does not.
- The `inline` variant is still a `<div>`, despite the name. Putting it inside a `<p>` is invalid nesting that browsers repair by splitting the paragraph, which reorders the very reading order this component depends on — place it as a sibling of your prose, not inside it.

**Focus**

- The link sets no `focus-visible` style of its own — it carries an underline and a hover colour and nothing else — so what it shows on focus is whatever your global styles provide, on top of the browser's own outline. It is not invisible, as this note said until 2026-09-06: measured here the user agent supplies `outline: auto 1px`, which this repo's global `outline-ring/50` recolours. But 1px is thin against the `ring-2` and `ring-3` the registry's own controls use, so it reads as a weaker stop rather than a missing one.

## Pitfalls

- Reaching for `text-muted-foreground` out of instinct because the copy is 'just a footnote'. In this token set it measures under the 4.5:1 minimum against `bg-muted`, `bg-accent`, and `bg-secondary` — use `text-foreground` and let size and placement carry the quietness instead.
- Adding state to make the note collapsible or auto-hiding after a timeout — both are dismissal in disguise and undo the 'permanent' requirement just as much as a close button would.
- Passing a `link` with generic text like 'here' or 'click this' — the link needs its own discernible name, since a screen reader user tabbing through links out of context will hear only the link text, not the sentence around it.

## Composition

- States: `under-composer`, `in-card`, `inline`
- Composes from this registry: nothing
- shadcn primitives: none
- npm: lucide-react

## Evidence

Manus, Claude, NotebookLM, Freepik
