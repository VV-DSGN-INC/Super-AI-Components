# Story conventions — case stories

Normative for every component built from now on. It supplements
[`component-build-brief.md`](component-build-brief.md) §Story; it does not
replace it.

## What this is for

Until this convention, every story in `super-ai` enumerated a prop
combination. That is a fourth copy of a fact the types, the manifest's
`states` and the docs page already carry — and it left the situations a
component actually meets in a product documented nowhere.

The pilot that established this convention (`suggestion-chips`,
`generation-queue`, `empty-state`) found three things in an afternoon that
no existing gate could see. They are recorded in `CONTINUE.md`; the shortest
one is that `safety-block` shipped a 4.33:1 contrast failure and had never
been rendered under axe, because it is `contractExempt` and therefore was
never required to have a story at all. A neighbour's `Boundary` story is what
finally rendered it.

So: **a case story earns its place by being the only place a fact exists.**
A story that restates the props table does not.

## The seven

Write only the ones that are **true for this component**. A story written to
complete the set is worse than a missing one — it reads as coverage and
proves nothing. Name them exactly as below, so audit greps and rendered
passes can find them.

| Story | Write it when | What it must show |
| --- | --- | --- |
| `RTL` | the component has directional layout, icons or motion | rendered under `dir="rtl"`, with chevrons, arrows and trailing slots mirrored |
| `ReducedMotion` | the component animates at all | the `prefers-reduced-motion` path — see the note below, which is specific to this repo |
| `KeyboardOrder` | it is focusable or contains focusables | the tab sequence, and where focus returns on close or dismiss |
| `EmptyLabel` | any text slot is optional | the no-label rendering, which is usually where icon-only tap targets fail |
| `LongContent` | any text slot is author-supplied | ~90 characters, plus the wrap/truncate/scroll decision the component actually makes |
| `Mobile` | always | 375px, no horizontal scroll — see the note below on how to constrain it |
| `Boundary` | a near-twin exists in the catalog | this component beside its neighbours, with the choosing rule in the description |

**Record the ones you skipped, and why**, in a comment above the case-story
block. The pilot files carry the pattern. "`ReducedMotion`: nothing in the
tree animates" is a useful sentence; silence is not, because the next reader
cannot tell a considered omission from an oversight.

## Rules

- **The description carries the judgment.** A story with no description is a
  screenshot. Use a JSDoc block above the export — Storybook's autodocs reads
  it, and it is already the house idiom in these files.
- **No story introduces a value the component doesn't already use.** No new
  token, radius, size or colour. The one sanctioned exception is the 375px
  wrapper on `Mobile`, which is a test condition rather than a design value.
- **Demo content must be something this system could really emit.** Prompts,
  filenames, model names, error strings. No invented company names, no
  fabricated metrics, no testimonial copy. This is the `unslop` rule applied
  to fixtures.
- **No "every variant at once" story.** A grid of all eight of something
  markets optionality the system exists to remove.

## Three mechanical facts about this repo

These decide the shape of the stories, and all three cost time to rediscover.

1. **Extra exports are legal.** `check-contract.mts` asserts *declared states
   ⊆ story exports*, never the reverse. Case stories cannot break the
   contract gate, and they do not need manifest entries.

2. **`Mobile` must be wrapper-constrained, not `parameters.viewport`.**
   `.storybook/main.ts` loads only `addon-docs`, `addon-a11y` and
   `addon-vitest`, and the gate runs headless chromium at its own size. A
   viewport parameter would render at desktop width in the run that gates.
   Use `<div className="w-[375px] max-w-full">`.

3. **`ReducedMotion` documents a branch, or it documents its absence.**
   `vitest.config.ts` sets Playwright's `reducedMotion: "reduce"` for every
   test, so the story only differs from its neighbour if the component
   actually branches on the media feature. Tailwind's `animate-spin` does
   not; `motion-reduce:animate-none` does. Where the component doesn't
   branch, say so in the description rather than shipping a story that
   renders identically to `Running` and implies coverage.

Because `preview.tsx` sets `a11y: { test: "error" }` as the default for every
story, each case story you add is axe-gated from the moment it exists. That
is most of the value: `Mobile` does not merely document 375px, it starts
failing the build at 375px.

## Play functions

Add one only where the component **owns** a behaviour: focus return on
dismiss, roving tabindex, type-ahead, escape handling, or a contract like
"every per-row control carries a distinct accessible name".

Do not add a play function that clicks a button and asserts the button was
clicked. That tests Storybook.

**Never assert behaviour you know to be wrong in order to get green.** If a
case story surfaces a defect, fix the component or record the gap in the
story description and in `CONTINUE.md` §8. Pinning a bug with a passing
assertion is worse than having no assertion.

## Scope today

- **Required** for every component built from now on, per
  `component-build-brief.md` §Story.
- **Not retrofitted** to the 128 already-shipped components. That work is
  sequenced with the `contractExempt` retrofit, since both are "bring old
  components up to a contract written after they shipped" and they touch the
  same files.
- **Not gated.** No lint rule requires `Mobile` yet, deliberately: automating
  a convention while it is still moving locks in its mistakes. Gate after the
  pattern has held across a wave.
