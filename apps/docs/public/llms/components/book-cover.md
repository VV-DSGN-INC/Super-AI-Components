# Book Cover

> A cover for a bounded body of knowledge — a docs set, a template pack, a source collection. A portrait face with a spine edge, a title, and optional stripe, icon, illustration or cloth texture. It is presentational: it carries no AI-interface semantics, and this page would rather say so than dress it up.

Layer: component · Family: Q · Install: `npx shadcn@latest add https://super-ai-components.vercel.app/r/book-cover.json` · Contract: `components/super-ai/book-cover.meta.json` (installed beside the component; version-locked to the code, so it outranks this page) · Docs: https://super-ai-components.vercel.app/components/book-cover

## Why it matters

A library that renders everything as the same card makes a reference document and a generated image look like the same kind of object. The cover is the cheapest way to say 'this is something you read', which is a different promise from 'this is something you made'. Read from Vercel's Geist, where it opens marketing and docs landing pages.

## When to reach for it

Use it in a grid or shelf where the reader is choosing what to open, and set headingLevel so the titles land correctly in your page outline. Pick the tone for contrast against the surface behind it, never to encode a category — three tones cannot carry a taxonomy, and a reader who learns that ink means one thing will be wrong the first time you add a fourth kind. Wrap it in your own link; it will not become interactive on its own.

## Variants

### variant (default: `plain`)

- `plain`: The cover stands alone, or sits among covers whose titles already tell them apart. Nothing on the face competes with the title, which is the only part a screen reader gets.
- `stripe`: Covers sit together on a shelf and the titles alone do not group them, so a category band earns its place. On a cover shown by itself the band says nothing.
- `illustrated`: You have a decorative picture that helps a reader recognise the collection at a glance. The slot is hidden from assistive tech, so anything the picture says that the title does not belongs in a labelled element of your own.

### tone (default: `paper`)

- `paper`: The shelf sits on the page background and the covers should read as objects on it without adding weight. The safe pick for a mixed shelf.
- `ink`: The shelf sits on a light surface and the covers need to hold strong contrast against it. Chosen for what is behind the shelf, never to mark what kind of document is on the cover.
- `muted`: The shelf sits on a card, where a paper face would share the card's own surface and disappear into it, and ink would be too heavy. Contrast again, never classification.

## Instead use

- **preview-tile**: The user is choosing among things the system generated (images, videos, drafts) rather than choosing what to read. preview-tile is the selectable frame for an output and carries a selection ring; a cover promises a document and has no selected state.
- **artifact-grid**: The set is the documents an assistant produced, and a reader finds them by the session that made them. artifact-grid groups them under that session; a shelf of covers drops the provenance.

## Do

- Set headingLevel to whatever your page outline actually needs. A shelf under an h2 wants h3 titles.
- Use the stripe when covers sit together and need a quick category cue beyond the title.
- Reach for tone to hold contrast against the surface behind the shelf, not to classify what is on the cover.

## Don't

- Do not put a sentence in the title. It is a heading in a 3:4 face — it will wrap until the cover is nothing but text.
- Do not use textured as emphasis. It is a binding cue; on every cover in a shelf it becomes noise, and it says nothing about the one it is on.

## Anatomy

- `book-cover`: Carries the width variables and hugs the face. Deliberately not a query container — see the width pitfall below.
- `book-cover-face`: The cover. Holds the 3:4 ratio, the asymmetric radius and the resolved width.
- `book-cover-spine`: The binding edge on the left. Decorative, and aria-hidden.
- `book-cover-stripe`: The category band, on variant='stripe'. Decorative, and aria-hidden.
- `book-cover-illustration`: Fills the face behind the title, on variant='illustrated'. Decorative, and aria-hidden.
- `book-cover-icon`: Sits above the title. Decorative, and aria-hidden.
- `book-cover-title`: A real heading, at the level you set. The component's entire semantic contribution.

## Accessibility

**Keyboard**

- Zero tab stops. Nothing in the cover is focusable, by design: the focus ring belongs to whatever link or button wraps it, and a cover that took focus itself would put two stops on one target in every grid.
- No activation keys, and no disabled prop. There is nothing to activate and nothing to disable.

**Screen reader**

- The title is a real heading element at the level you pass, defaulting to h3. That is deliberate and it is the whole point: a grid of ten covers announces as ten headings, which is a navigable list. Rendering the title as styled text would make the same grid announce as nothing.
- Every decorative part — spine, stripe, icon, illustration, texture — carries aria-hidden and announces as nothing.
- The illustration is hidden unconditionally, even when you pass one that carries meaning. The component cannot tell the difference, so it assumes decoration. If your illustration says something the title does not, render a labelled element of your own beside the cover rather than relying on this slot.
- headingLevel is not validated against your page. Passing h2 inside a section already headed by an h2 produces a flat, wrong outline that no test here will catch.

## Pitfalls

- Encoding a taxonomy in tone. Three token-bound surfaces cannot carry a category system, and the first time you need a fourth kind the mapping breaks for every reader who learned it.
- Expecting Geist's color and textColor. They do not exist here. This registry's token gate fails the build on raw hex, so a prop whose purpose is to accept one would be a defect; tone is the three-value replacement.
- Expecting the responsive width object to work with no container. The rungs are container queries against your shelf or grid, so you have to mark that ancestor @container yourself. Without one the rungs never match and every cover renders at its base width — no error, just the small size everywhere.
- Reading width as viewport-responsive. A cover in a 300px sidebar resolves to its small width even on a wide screen. That is the intent, and it will look wrong if you were expecting breakpoints.
- Using it for generated artifacts. A cover says 'a thing you read'. On an image or a video result it makes a false promise about what opening it will do.

## Composition

- States: `plain`, `stripe`, `illustrated`, `textured`, `tone`
- Composes from this registry: nothing
- shadcn primitives: none
- npm: none

## Evidence

Vercel Geist — the Book component, positioned there as decorative chrome for marketing pages, documentation landing covers and changelog heroes., No reference-board sighting. Family Q carries no board evidence and does not claim any (see decisions.md D20).
