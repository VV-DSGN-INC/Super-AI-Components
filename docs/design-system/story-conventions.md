# Story conventions — case stories

Normative for every component in the registry, not only the ones built from
here on — see [Scope today](#scope-today) for the retrofit that makes that
true. It supplements [`component-build-brief.md`](component-build-brief.md)
§Story; it does not replace it.

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

## The eight

Write only the ones that are **true for this component**. A story written to
complete the set is worse than a missing one — it reads as coverage and
proves nothing. Name them exactly as below, so audit greps and rendered
passes can find them.

| Story | Write it when | What it must show |
| --- | --- | --- |
| `RTL` | the component has directional layout, icons or motion | rendered under `dir="rtl"`, with chevrons, arrows and trailing slots mirrored |
| `ReducedMotion` | the component animates at all | the `prefers-reduced-motion` path — see the note below, which is specific to this repo |
| `KeyboardOrder` | it is focusable or contains focusables | the tab sequence, where focus returns on close or dismiss, and a visible focus treatment at every stop — play-asserted: the focused element matches `:focus-visible`, and `expectPerceptibleFocus` from `apps/storybook/src/lib/focus-treatment.ts` measures the treatment. Do **not** hand-roll the style test; see [The focus assertion](#the-focus-assertion) for the two ways the obvious one is vacuous |
| `Controlled` | it exposes a value/selection API (`value`/`onChange` or an equivalent controlled pair) | the component driven by external state, play-asserted: interaction alone does not move the rendered value, the change callback fires with the payload a consumer needs to apply it, and re-rendering with an unchanged `value` holds the component fixed. Without a play function this story is a screenshot of a prop and does not count |
| `EmptyLabel` | any text slot is optional | the no-label rendering, which is usually where icon-only tap targets fail |
| `LongContent` | any text slot is author-supplied | ~90 characters, plus the wrap/truncate/scroll decision the component actually makes |
| `Mobile` | always | 375px, no horizontal scroll — see the note below on how to constrain it |
| `Boundary` | a near-twin exists in the catalog | this component beside its neighbours, with the choosing rule in the description |

**Record the ones you skipped, and why**, in a comment above the case-story
block. The pilot files carry the pattern. "`ReducedMotion`: nothing in the
tree animates" is a useful sentence; silence is not, because the next reader
cannot tell a considered omission from an oversight.

Write each skip as its own line in that comment, in exactly this grammar, so
the eventual gate (spec §4) can parse presence-or-annotated-absence. That
comment is a block comment, so the line carries the block's leading asterisk:

    * // case-skip: RTL — no directional layout, icons or motion

One line per skipped name: `case-skip: <StoryName> — <reason>`. Every skip
line shipped today is that form — 48 of them across 24 story files, none of
them bare — so the gate should allow an optional leading `*` rather than
anchoring `//` to the start of the line. The pilot files carry the pattern.

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

## The focus assertion

`KeyboardOrder`'s "a visible focus treatment at every stop" is the one
must-show in the table that cannot be satisfied by looking. **Use
`expectPerceptibleFocus` from
[`apps/storybook/src/lib/focus-treatment.ts`](../../apps/storybook/src/lib/focus-treatment.ts).**
Do not write your own style test, and do not copy one out of a neighbouring
story — 35 files copied the same one and it proves nothing.

The idiom this replaces is

    style.boxShadow !== "none" || style.outlineStyle !== "none"

and **both halves are vacuous.** Wave 1 produced a live counterexample for
each, which is why this is a rule rather than a preference:

- **A zero-width ring is still a full box-shadow string.** Tailwind draws
  `ring-*` as a box-shadow, so `focus-visible:ring-0` computes to a coloured
  ring of zero width — measured on `hero-omnibox`'s prompt field as
  `oklab(0.708 0 0 / 0.5) 0px 0px 0px 0px` while genuinely `:focus-visible`.
  The field paints nothing at all and the assertion passed. Worse, the shadow
  list is five entries long on every `Button` in the registry whether or not
  any of them has width, so `boxShadow !== "none"` is true *at rest* — the
  first half could never fail on anything.
- **`outline-hidden` compiles to a transparent outline, not
  `outline-style: none`.** It emits `outline: 2px solid transparent`, so
  `outlineStyle !== "none"` passes on a completely unstyled element.
  `account-menu`'s `DropdownMenuItem` rows carry it.

Three treatments count, because three are what this registry actually ships,
and the helper accepts all three:

| form | where it is used | judged by |
| --- | --- | --- |
| `ring` | most controls — `focus-visible:ring-2` / `ring-3` | at least one box-shadow entry with non-zero blur or spread, in a colour that is not fully transparent |
| `outline` | `table-view`'s rows, `tabs` | `outline-style` not `none`, non-zero `outline-width`, non-transparent `outline-color` |
| `fill` | menu and popup rows (`focus:bg-accent`), because a ring inside a `p-1` popup is clipped — `workspace-switcher`, `account-menu` | `background-color` differing from the resting value **the caller passes in** as `restingBackground` |

The `fill` form needs that resting value and the helper will not judge one
without it. "Paints a non-transparent background" is true of most controls at
rest, so accepting it unconditionally would hand back exactly the escape hatch
this replaces. A fill is a *change*; measure what the row paints when it is not
focused — off a resting sibling, or off the element before focus reaches it.

Two more things the helper does that a hand-rolled check keeps getting wrong:

- **It settles before concluding.** `Button` carries `transition-all`, so the
  ring grows from `0px` and the first read after `userEvent.tab()` returns
  `0px 0px 0px 0px` on a control whose ring is perfectly fine. Every stop in
  all three pilot files reads zero on the first two samples.
- **It splits the shadow list on top-level commas only.** A single entry
  contains commas of its own (`rgba(0, 0, 0, 0.5) 0px 0px 0px 3px`), and the
  ring is the *fourth* of five entries in Tailwind's output — a regex run
  across the whole string can match lengths from one entry and a colour from
  another.

The `:focus-visible` match is a separate claim and stays on its own line
immediately above the call: the helper measures what is painted, not whether
the browser considers this a keyboard focus.

## Five mechanical facts about this repo

These decide the shape of the stories, and all five cost time to rediscover.

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
   not branch on its own. **Two idioms create the branch, and both are
   sanctioned:**

   - `motion-reduce:animate-none` beside an `animate-*` class.
   - `motion-reduce:transition-none` beside a `transition-*` **that a user
     would perceive as motion** — a thumb that slides, a panel that grows, a
     row that shifts position. Shipped precedent: `pricing-table` (switch
     track and thumb), `choice-chips`.

   The qualifier is load-bearing in the second case. A `transition-colors`
   that only crossfades a text colour moves nothing, so suppressing it
   documents no branch worth a story — `reset-affordance` is the recorded
   example, and its skip line says so. Add the class where something moves;
   do not add it to look thorough.

   Where the component doesn't branch, say so in the description rather than
   shipping a story that renders identically to `Running` and implies
   coverage.

   **`motion-reduce:animate-none` is inert on a Base UI popup surface — the
   variant has to be restated.** `dialog`, `alert-dialog`, `popover`,
   `tooltip`, `hover-card`, `dropdown-menu` and `select` all animate through
   `data-open:animate-in` / `data-closed:animate-out`. Tailwind v4 compiles
   both sides to a *single* class of specificity — the data-attribute test is
   wrapped in `:where(…)`, which contributes nothing — so the tie is broken by
   source order, and Tailwind emits the plain `motion-reduce:` block well
   before the `data-*` variants. `animation: enter` therefore wins and
   `animation-name` reads back `"enter"` under emulated reduce. The fix is to
   restate the variant on both halves:

       motion-reduce:data-open:animate-none motion-reduce:data-closed:animate-none

   which sorts *after* its counterpart and wins the same tie. Measured on
   `shortcuts-sheet`, whose `ReducedMotion` story reads `animationName` back
   rather than trusting the class. Nothing else in the registry is affected
   today: every other `motion-reduce:animate-none` sits on a plain
   `animate-spin` / `animate-pulse`, where the same source order works in its
   favour. `sheet` is a third case again — it animates by transition, so
   `motion-reduce:transition-none` is what suppresses it.

4. **Inside a Base UI portal — dialog, popover, sheet — you cannot read
   `document.activeElement` immediately after `userEvent.tab()`.** Tabbing off
   the last control lands on `FloatingFocusManager`'s trailing focus guard,
   whose `onFocus` re-enters the panel through `enqueueFocus` — and
   `enqueueFocus` schedules the `focus()` call in a `requestAnimationFrame`
   unless asked for `sync`. So the read returns *either* the guard *or* the
   control it redirects to, depending on whether the frame has painted.

   The failure this produces is silent. The guard is not one of the expected
   stops, so a walk that reads immediately counts that iteration as a miss, and
   the **next** tab steps over the control the redirect had just landed on. The
   count saturates one short, every lap, and widening the loop budget only buys
   more laps that skip the same stop. It cost a CI failure — `expected 6 to be
   7` — that had passed locally twice from a cleared cache, because whether the
   frame wins is environment-dependent.

   **The idiom, and reuse it rather than re-deriving it.** Settle before
   reading, then seed the walk from where focus *actually* landed, not from an
   assumed first element — a portal focuses its own first tabbable descendant
   on open, so a walk that records a stop only *after* a tab can never count
   the one it started on. Then walk exactly one lap, asserting each stop is
   new, and take one closing step asserting focus returned to the start. That
   makes the budget provable rather than generous, because every settled step
   moves by exactly one control.

   **What "settled" means depends on how focus is moving, and the weaker form
   is silently wrong for arrow keys.** Write the settle as *focus has moved*,
   which is correct for both:

   - **A TAB walk** may settle on "`document.activeElement` is one of the
     expected stops". That works only because the focus guard briefly takes
     focus *outside* the stop set, so "is a stop" doubles as "has settled".
     `TaskTray.stories.tsx` and `ShortcutsSheet.stories.tsx` carry this form —
     read either before writing a `KeyboardOrder` inside a portal.
   - **An ARROW walk never leaves the set.** Every candidate is a stop, before
     and after the key press, so a settle that only checks membership returns
     the *previous* row and the walk compares stop N against the expectation
     for stop N+1. `WorkspaceSwitcher.stories.tsx` caught this as a
     wrap-around that reported the last row instead of the first, in a run
     whose timing happened to differ; its `settledStop` takes the previous
     element and waits for `activeElement` to be a stop **and** not that one.
     Read it before writing a roving-tabindex walk.

   The general lesson outlives the library: **a bounded "did we reach all N
   stops within M tabs" loop is environment-sensitive; asserting the cycle
   directly is not.** One infers the property from a count reached inside an
   allowance; the other states it. The corollary is the same shape: a settle
   that asserts *where focus is* is weaker than one asserting *that focus
   moved*, and only the second is safe when the destination was already a
   legal place to be.

5. **A JS viewport read cannot be exercised by a CSS-width wrapper — so a
   declared state can satisfy the contract gate with a story that shows the
   wrong thing.** This is *not* the same rule as fact 2. Fact 2 says how to
   constrain `Mobile`: with a wrapper, because `parameters.viewport` does not
   resize the gate's browser. This one says what a wrapper still cannot buy
   you, and it matters because the whole program leans on `w-[375px]`.

   A wrapper sets a CSS width. It does not change `window.innerWidth`, and any
   component that branches in **JavaScript** on the real viewport is unmoved by
   it. `app-sidebar` is the shipped case: the vendored `Sidebar` swaps to a
   Sheet-based drawer via `useIsMobile`, which reads
   `matchMedia("(max-width: 767px)")` against the window. The gate's browser is
   1200px, so `app-sidebar`'s declared `mobile-drawer` state renders **the
   desktop panel** under `pnpm test:stories` — a declared state with a passing
   story that has never once rendered the thing it is named for. The same
   applies to anything `position: fixed`, which is measured against the
   viewport and leaves the wrapper's bounds entirely.

   **What to do instead: record the limit in the description, and do not fake
   it.** Do not reach for a `matchMedia` stub, a forced prop or a hand-built
   copy of the drawer to make the story look right — a story that renders a
   mock of the branch documents the mock. Say in the description which branch
   is unreachable from any story in the file and why, exactly as
   `AppSidebar.stories.tsx`'s `Mobile` does. The honest sentence is worth more
   than the screenshot, because the next reader's real question is "is this
   covered", and a faked story answers it wrongly.

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

## Manifest-shape rules

Two rules about `states`, enforced during manifest prep (`CONTINUE.md` §3.2)
and in review — deliberately not by `check:contract`, which cannot know
"async" or "disabled-capable" mechanically:

- A component that exposes `disabled` (its own prop, or passed through to an
  interactive primitive) declares a disabled-shaped state.
- A component with an async lifecycle declares its loading-shaped and
  failure-shaped states.

Both are about **shape, not name**: `running`, `generating`, `streaming`,
`failed` and `locked` all conform. The rule is that the shape exists in the
manifest, because a declared state is what forces a story through the gate.

## Non-goals

Two guarantee categories from the 2026-08 benchmark are declined, not
missing. Sizes catalogues (the comparison system's largest category) and
variant × intent grids market the optionality this system exists to remove —
the "no every-variant-at-once story" rule above is that posture, stated. A
future benchmark reader should find this paragraph and know the gap is
chosen.

## Scope today

- **Required for every component in the registry.** The retrofit that makes
  that true is the story-guarantees program
  (`docs/superpowers/specs/2026-08-14-story-guarantees-retrofit-design.md`);
  wave status lives in `CONTINUE.md`.
- **Not yet gated.** The gate (presence or `case-skip` annotation for each of
  the eight names) is the program's final step, landing only after every
  family wave — a red gate can never sit on `main`.
