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
| `KeyboardOrder` | it is focusable or contains focusables | the tab sequence, where focus returns on close or dismiss, and a visible focus treatment at every stop — play-asserted: the focused element matches `:focus-visible` and its computed style shows a ring or outline |
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
the gate (`apps/docs/scripts/lib/story-coverage.ts`) can parse
presence-or-annotated-absence. That comment is a block comment, so the line
carries the block's leading asterisk:

    * // case-skip: RTL — no directional layout, icons or motion

One line per skipped name: `case-skip: <StoryName> — <reason>`. **A skip is
the one part of this convention with no gate behind it:** `story-coverage`
checks that a reason exists, never that it is true. B6 `thread-list` carried
"nothing this component owns animates" while rendering two Base UI popups that
both animated, and it survived because the reasoning was plausible and the
component's family had no remaining debt to bring anyone back to the file. When
you skip, write the reason as something a reader can check — a grep you ran, a
property you read back — rather than a conclusion. The gate
allows an optional leading `*` rather than anchoring `//` to the start of the
line, requires the em dash, and treats a skip with nothing after the dash as
silence. The pilot files carry the pattern.

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

## Five mechanical facts about this repo

These decide the shape of the stories, and all five cost time to rediscover.

1. **Extra exports are legal.** `check-contract.mts` asserts *declared states
   ⊆ story exports*, never the reverse. Case stories cannot break the
   contract gate, and they do not need manifest entries.

2. **`Mobile` must be wrapper-constrained, not `parameters.viewport`.** Three
   things about that wrapper cost time in the D/I and E/P waves, so they are
   written down here rather than rediscovered:

   - A `layout: "centered"` in the meta wraps every story, so
     `canvasElement.firstElementChild` is the ~1200px centring div and **not**
     your 375px frame. An overflow assertion against it measures the wrapper and
     passes for the wrong reason. Give the frame a `data-testid` and measure
     that.
   - A wrapper constrains **width, not the breakpoint**. The gate's chromium is
     1200×900, so `sm:` and `md:` variants still apply inside a 375px box:
     `preset-grid` renders its four-column layout where a real phone gets three,
     and `generation-wizard` renders its desktop two-column grid throughout.
     Where that is true, say so in the description — the story proves the wide
     layout squeezed narrow does not scroll sideways, which is a different (and
     stronger) claim than the phone case.
   - Some defects **only** exist at narrow width, which is the whole reason the
     story is mandatory: `data-views`' kanban board had a keyboard-unreachable
     scroll container that nothing overflowed at desktop size, so no other story
     could have found it.

   The original reason for the rule still stands:
   `.storybook/main.ts` loads only `addon-docs`, `addon-a11y` and
   `addon-vitest`, and the gate runs headless chromium at its own size. A
   viewport parameter would render at desktop width in the run that gates.
   Use `<div className="w-[375px] max-w-full">`.

   - **There is one mechanism that does move the breakpoint, and the wrapper
     rule is not a substitute for it where a layout keys on a media query.**
     `page.viewport(375, 812)` from `@vitest/browser/context`, called at the top
     of a play function, resizes the test iframe itself. Probed 2026-09-06:
     `window.innerWidth` 1200 → 375, `matchMedia("(max-width: 767px)")` false →
     true, and a `hidden md:block` element goes from `display: block` to
     `display: none`. It does **not** leak — a second story in the same file
     reads 1200 again — so no cleanup is needed. Use it where the component
     under test swaps layout on a breakpoint rather than merely reflowing:
     family O's shells do, because B1 `app-sidebar`'s drawer swap keys on a
     viewport media query, and a width wrapper renders the desktop rail inside a
     375px box while reporting success. Everywhere else the wrapper is still the
     right tool, and it is what the shipped stories use — it constrains the box
     without pretending to be a phone.

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
   reading: `waitFor` until `document.activeElement` is one of the expected
   stops. Seed the walk from where focus *actually* landed, not from an assumed
   first element — a portal focuses its own first tabbable descendant on open,
   so a walk that records a stop only *after* a tab can never count the one it
   started on. Then walk exactly one lap, asserting each stop is new, and take
   one closing tab asserting focus returned to the start. That makes the budget
   provable rather than generous, because every settled tab moves by exactly one
   control. `TaskTray.stories.tsx` and `ShortcutsSheet.stories.tsx` in
   `apps/storybook/src/stories/super-ai/` both carry it — read either before
   writing a `KeyboardOrder` inside a portal.

   **Settle on departure, not on arrival.** The wait above — "until
   `document.activeElement` is one of the expected stops" — has a hole the
   D/I wave found on `ai-tools-menu`: when a key press has not applied yet,
   focus is still on the *previous* stop, which is itself an expected stop, so
   the wait returns immediately with a stale read and the lap appears to end
   one row early. It passed 13 warm runs and failed the first run against a
   cleared Storybook cache. The tightened form takes the previous stop and
   waits for focus to *leave* it before reading, so every press is provably
   one move; `AiToolsMenu.stories.tsx` carries it, and it is the form to reuse
   inside any portal from now on. `TaskTray` and `ShortcutsSheet` still use the
   arrival form and share the hole.

   The general lesson outlives the library: **a bounded "did we reach all N
   stops within M tabs" loop is environment-sensitive; asserting the cycle
   directly is not.** One infers the property from a count reached inside an
   allowance; the other states it.

5. **A `box-shadow` string is not a focus ring.** `KeyboardOrder` must show a
   visible treatment at every stop, and the obvious predicate —
   `style.boxShadow !== "none" || style.outlineStyle !== "none"` — is wrong in
   both directions on this registry's own primitives. Four agents hit it
   independently across the D/I, E/P and F waves:

   - A Tailwind `ring-*` utility composes shadow *layers that are always
     present*, reading `rgba(0, 0, 0, 0) 0px 0px 0px 0px` when the ring is off.
     That is not the string `"none"`, so the check passes on an element painting
     nothing — measured on a plain vendored `Button` (five such layers) and on
     `detail-view-shell`'s close button.
   - `focus-visible:outline-none` leaves `outline-width` at its used value while
     `outline-style` reads `none`, so a width-based check reports a treatment on
     a row that has none — measured on A9 `entity-row`.
   - The vendored `Button` carries `transition-all`, so the ring **fades in**: the
     same element gives a transparent zero-size shadow on the frame focus lands
     and a real one ~250ms later. An immediate read is a false negative —
     measured on F1 `result-card`'s Retry.

   - **A treatment on an element that is not painted.** Base UI's slider puts a
     real `<input>` inside the thumb and clips it away with
     `position: fixed; clip-path: inset(50%)`. Focus lands on that input, the
     user agent paints its own `outline: auto 1px` on it, and an outline check
     reports a ring — while the thumb carrying `focus-visible:ring-3` never
     matches `:focus-visible`. Found on H2 `time-ruler` *after* the helper below
     had shipped, and independently on H7 `stem-mixer`; F5 `compare-viewer` is a
     third. All three components have handles that paint no ring at all.

   - **A permanent shadow reading as a ring.** This is the limit of the whole
     approach, found on H6 `waveform-editor`: an absolute check answers "does
     this element paint a treatment", never "did focus cause it", so a span
     carrying `shadow-sm` passes while focused and passes equally when it is
     not. Three of that component's slider spans are in exactly that position.
     Take `focusTreatmentSignature(el)` before and after focus and assert it
     *changed*.

     **Use both checks, because they answer different questions and can
     disagree.** `settledFocusRing` asks whether anything is painted; the
     differential asks whether focus is what painted it. Each catches what the
     other misses, measured both ways round:

     - J2 `filter-panel`'s selected chip has a permanent ring the same colour
       and width as its focus ring, so `settledFocusRing` passes and the
       differential correctly reports no change.
     - J3 `explore-gallery`'s composer textarea gains a *colour* on focus while
       its geometry stays zero — `rgba(0, 0, 0, 0) 0px 0px 0px 0px` to
       `oklab(0.708 0 0 / 0.5) 0px 0px 0px 0px` — so the differential reports a
       change and `settledFocusRing` correctly reports no ring.
     - K3 `diff-review`'s vendored `Button` rests at `box-shadow: none`, so the
       differential flips on the transition's *first frame*, where all five ring
       layers are still `rgba(0, 0, 0, 0) 0px 0px 0px 0px` and nothing is
       painted yet. `settledFocusRing` is what proves the ring actually arrives
       (`oklab(0.708 0 0 / 0.22) 0px 0px 0px 1.35px`). **So the differential is
       never a substitute:** on anything carrying `transition-all` it can report
       a change before there is anything to see, and all it rules out on its own
       is a permanent shadow.

     **The differential works inside a tab walk too**, which this rule used to
     deny: read the *next* stop's signature while focus is still on the previous
     one. No blur, so nothing disturbs the sequence. J5 `record-list` and J2
     `filter-panel` found that independently and both carry it.

   Use `settledFocusRing` from `@/lib/focus-ring`, which inspects the layers for
   non-zero alpha *and* non-zero geometry, ignores an element that is not
   painted, and waits for the treatment to settle; `ThreadList.stories.tsx` is
   the reference call site, and `WaveformEditor.stories.tsx` shows the
   differential beside it. It is additive: 63 story
   files still carry the inline string check and were not rewritten, so a
   "shows a ring" claim in an older file is weaker than it reads.

   Two smaller traps in the same area. Base UI leaves `tabindex="0"` on a
   natively-`disabled` button, so `[tabindex]:not([tabindex="-1"])` counts inert
   controls — query for buttons that are not disabled instead. And a wrapper
   cannot reach a portal, so an `RTL` story for a dialog needs `dir` on the
   document rather than on a `<div>`.

**A play function that leaves a popup mid-dismissal hands axe a moving
target.** The scan runs once your play returns, so an element still fading out
is measured at its transitional opacity — a destructive menu row caught that way
fails `color-contrast` against a story that passes on its own. It surfaced three
times in the H and J waves, always under full-suite load and never in isolation.
End any play that dismisses a popup by waiting for it to be gone
(`await waitFor(() => expect(body.queryByRole("menu")).toBeNull())`). That is
also an assertion worth having: choosing a destructive item should dismiss the
menu rather than stack a dialog on top of it. Suppressing the animation does not
help, because the frames where the element is still mounted and dimmed remain.

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
- **Gated as a ratchet since 2026-09-04.**
  `apps/docs/scripts/lib/story-coverage.test.ts` derives two obligations per
  item from the manifest — each of the eight names present or
  `case-skip`-annotated, and a JSDoc description above every declared-state
  export — and compares the unmet set with `story-coverage.baseline.json`,
  the debt committed at adoption. Both directions fail: a newly unmet
  obligation is a regression, and a resolved one still in the baseline must
  be locked in with `pnpm story-coverage:baseline` (from `apps/docs`), which
  refuses to grow the file. The family waves are therefore "shrink the
  baseline", not a prerequisite for the gate.
