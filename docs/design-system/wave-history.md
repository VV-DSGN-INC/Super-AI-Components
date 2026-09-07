# Wave history — what each wave of the case-story program found

Append-only. **Nothing here is current state.** `CONTINUE.md` §1 is current
state and §8 is the live backlog; this file is the record of how each wave
arrived at them, kept because the shape of the debt is the argument for the
program that cleared it.

Moved out of `CONTINUE.md` on 2026-09-07. It had grown to 2,728 lines carrying a
handoff, a rule book and a nine-wave ledger at once, and §1 rotted three weeks
behind §8 because §8 is where people entered the file. Splitting the ledger out
is what makes the handoff readable top to bottom again.

Each wave's findings are also summarised where they are actionable: source fixes
landed in the commits named below, and anything still open is in `CONTINUE.md`
§8 rather than here.

---

Three components (`suggestion-chips`, `generation-queue`, `empty-state`) were
given the case-story block defined in
[`story-conventions.md`](design-system/story-conventions.md). The convention was
adopted on the strength of what one afternoon of it turned up. Same provenance
rule as §8: each item was found by someone writing a story who could not write
it honestly without noticing.

**Fixed on the pilot branch:**

- **N10 `safety-block` shipped a 4.33:1 contrast failure.** Its root paints
  `bg-destructive/5` (#fef2f3) and the vendored `AlertDescription` child carries
  its own `text-muted-foreground` (#737373). This is the _cross-component_ shape
  `check:tokens` documents that it cannot see, and it had never been caught
  because the component has no story. Fixed with the house idiom — rebinding
  `[--muted-foreground:var(--accent-foreground)]` on the surface-painting root,
  which reaches the composed children a slot-level `className` cannot. Found by
  L1 `empty-state`'s `Boundary` story, which renders `safety-block` as a
  neighbour.

**Open, and the largest of the three:**

- **11 of the 25 shipped `contractExempt` components have no story file at
  all**, so they have never been rendered under axe: `slot-summary`,
  `citation-ref`, `answer-block`, `source-cards`, `credits-indicator`,
  `quota-meter`, `pricing-table`, `autonomy-selector`, `safety-block`,
  `escalation-handoff`, `task-tray`. The cause is mechanical:
  `check-contract.mts` does `if (item.contractExempt) { exempt++; continue; }`
  _before_ the story-existence assertion, so the exemption silently covers the
  story file too, not only the per-state and docs assertions it is documented to
  cover. `safety-block` is the proof this is not theoretical — one of the eleven,
  carrying a real contrast bug, for as long as it has shipped. **Requiring a
  story file (not per-state stories) from exempt items would be a small change
  to the gate and would put eleven components under axe for the first time.**

- **14 of the 17 components that animate ignore `prefers-reduced-motion`.**
  `motion-reduce:` appears in `citation-ref`, `task-tray` and `trace-timeline`
  only. The other fourteen — including `generation-queue` and `render-queue`,
  which are `task-tray`'s own near-twins and use the identical lucide spinner —
  write a bare `animate-spin`/`animate-pulse`. So the convention exists and was
  then lost, which makes this drift rather than an open question. Nothing in the
  pipeline sees it: `check:tokens` reads colour, and axe does not evaluate the
  media feature at all. The fix is one class per site — **but see the correction
  immediately below before applying it to a dialog, popover or sheet.**

- **Correction (2026-08-15): "one class per site" is wrong on a Base UI popup
  surface, and the earlier sentence should not be applied there.** The
  prescription above is written for the shape it was found in — a lucide
  spinner carrying a plain `animate-spin`. It does not hold where the animating
  element is a Base UI popup, and anyone who applied it to a dialog, popover or
  hover-card fixed nothing and has no way to tell. The mechanism, measured on
  `shortcuts-sheet` while writing its `ReducedMotion` story:

  `dialog`, `alert-dialog`, `popover`, `tooltip`, `hover-card`,
  `dropdown-menu` and `select` animate through `data-open:animate-in` /
  `data-closed:animate-out`. Tailwind v4 compiles that to
  `.data-open\:animate-in:where([data-open]:not([data-open=false]))` — the
  attribute test sits inside `:where()`, which contributes **no** specificity,
  so it and `.motion-reduce\:animate-none` are both a single class and the tie
  falls to source order. Tailwind emits the plain `motion-reduce:` block well
  before the `data-*` variants (offsets 112494 vs 124370 in the current docs
  CSS chunk), so `animation: enter` wins and `animation-name` reads back
  `"enter"` under emulated reduce. The remedy is to restate the variant on both
  halves — `motion-reduce:data-open:animate-none
motion-reduce:data-closed:animate-none` — which sorts _after_ its counterpart
  and wins the same tie. `sheet` is a third case: it animates by transition
  (`data-starting-style` / `data-ending-style`), so
  `motion-reduce:transition-none` is what suppresses it.

  **Surveyed, and the honest answer is that no shipped branch is inert today.**
  Every bare `motion-reduce:animate-none` in `registry/super-ai/` sits on a
  plain `animate-spin`/`animate-pulse`, where the same source order works in
  its favour: K6 `citation-ref` (`animate-pulse` on the marker, which is the
  hover-card _trigger_, not its surface), A8 `preview-tile` (skeleton),
  `task-tray` and `trace-timeline` (both lucide spinners). All four work.

  What the finding costs is the _remainder_ of the backlog above. These 33
  registry components render a keyframe-animating popup surface, none of them
  suppresses it, and each is a site where the plain remedy would be inert:
  `account-menu`, `action-stack`, `ai-tools-menu`, `asset-detail`,
  `asset-library`, `citation-ref`, `coach-mark`, `context-toolbar`,
  `detail-view-shell`, `docs-shell`, `drawing-tools`, `feature-announcement`,
  `feedback`, `hero-omnibox`, `inline-generate-popup`, `modality-rail`,
  `mode-tabs`, `model-picker`, `permission-prompt`, `recommendation-card`,
  `record-list`, `records-shell`, `selection-toolbar`, `settings-dialog`,
  `template-detail`, `thread-list`, `transport-controls`, `trust-dialog`,
  `tts-composer`, `usage-dashboard`, `voice-clone-recorder`, `whats-new`,
  `workspace-switcher`, plus `task-tray` on the transition path. Only
  `shortcuts-sheet` has the working form. Not fixed here — that is a follow-up
  wave, and the point of this entry is that the list is accurate before anyone
  starts it. The idiom is written up in
  [`story-conventions.md`](design-system/story-conventions.md), mechanical
  fact 3.

- **E6 `generation-queue` does not manage focus when a row resolves.** A row's
  Cancel button unmounts as it transitions to done/failed/cancelled, and nothing
  moves focus, so a keyboard user cancelling the second of three rows loses
  their place. Deliberately _not_ pinned by the `KeyboardOrder` play function —
  asserting the current behaviour would make the bug permanent. Recorded in that
  story's description.

The convention became a program on 2026-08-14: eight names (`Controlled`
joined), manifest-shape rules, and a retrofit —
`docs/superpowers/specs/2026-08-14-story-guarantees-retrofit-design.md` — and
a shrink-only ratchet on 2026-09-04 (§1).

### Wave 0 — the 25 `contractExempt` items (2026-08-15)

Two batches, one agent per component, every manifest edit made centrally (§3.2).
**Batch A** took the 11 with no story file — the largest of the pilot's three
open items above, now closed: all 11 were rendered under axe for the first time.
**Batch B** took the other 14, **every one of which exported `Default`**, the one
name the house rule forbids; all 14 are gone, each renamed to the state it was
actually rendering or split into the states it conflated. Each of the 25 got the
full fold-in — states normalized and declared, one story per declared state,
case stories, a docs module, the flag dropped. `contractExempt` reached zero
(§1).

What it found:

- **Fifteen declared states across the 25 name behaviour no component
  implements.** Ten of batch B's 14 needed real normalization before a single
  story per state could be written, and the retrofit turned into an audit of
  `catalog.md`'s states column — which is normative prose, not a hint. A7
  `gen-settings-bar` declares `inline · compact · node-docked` and implements
  none of the three; the last names the node builder **D9 cut**. Absent for the
  same reason: A5 `filter-bar`'s overflow count and clear-all, A3
  `date-section`'s with/without count and collapsible, L5 `shortcuts-sheet`'s
  `searchable` and its controls-primer variant, A2 `cost-chip`'s
  estimate/confirmed/insufficient, and K6 `citation-ref`'s "copy quote" (filed
  separately in §8). One is factually **wrong** rather than absent: A10
  `stat-readout`'s "inline rows" describes `columns={1}`, which sets
  `grid-cols-1` and therefore stacks label _above_ value — the inline form is
  `columns={2}`. B6 `thread-list`'s `running` is removed outright; the spec's
  status slot was never built. **The mechanism is the finding.** Nobody had ever
  written one story per declared state for these components, because an exempt
  component was not required to have a story at all — so nothing had ever
  compared the column to the code.

- **Two components ship colourless to consumers.** M6 `rate-limit-banner` paints
  `border-warning/40 bg-warning/5`, and P1 `data-views` paints
  `bg-warning text-warning-foreground` through `data-views-shared.tsx`. Neither
  declares `cssVars`, so `shadcn add` installs them without the token and the
  surface arrives unpainted in a consumer's app. This is a
  registry-is-the-product bug and it is **distinct from** the Storybook
  `--warning` gate hole recorded in §8 — the six components carrying
  `WARNING_CSS_VARS` are wrong only under the axe gate; these two are wrong
  wherever they are installed. Found by the audit of that hole, recorded beside
  it, not fixed.

- **A keyboard-help panel was unusable by keyboard.** L5 `shortcuts-sheet`'s
  section list scrolls once the sections pass its 80vh cap, and the scroll
  container was not focusable — axe `scrollable-region-focusable`, whose real
  consequence is that a keyboard user opens a 60-binding shortcuts panel and can
  read only the first screenful. **Fixed in-wave**, then corrected in review: the
  first fix put `tabIndex` and `aria-label` on a bare `<div>`, which is
  `role="generic"`, where ARIA prohibits `aria-label`. The tab stop was real and
  did clear the axe rule, but it arrived anonymous. It is now a `<section>` named
  for its contents, and the story asserts the name _through_ the role — the only
  form that catches the original failure.

- **A disabled filter chip can still be deleted.** A5 `filter-bar`'s
  `FilterChip` spreads `...props` onto its toggle button, so `disabled` reaches
  the toggle only; the remove button is a sibling built from `onRemove` alone and
  never sees it. A facet you cannot turn off, you can still delete — by mouse or
  by Tab. A caller has to withhold `onRemove` in the same breath. (Milder, same
  site: nothing in `filter-bar.tsx` styles the disabled path at all, and these
  are unstyled `<button>`s with explicit colour classes, so the UA greying never
  applies — a locked chip is pixel-identical to a live one.) Recorded in the
  `Disabled` story, **not fixed**: what `disabled` means on a composite chip is
  an API decision.

- **`kbd` renders chords backwards under RTL.** `KbdGroup` is a bare
  `inline-flex` with no direction pin, so `⌘ ⇧ Z` paints as `Z ⇧ ⌘` under
  `dir="rtl"` — _a different instruction that still looks correct_, which is the
  worst failure shape available, because nothing about it reads as broken. Found
  independently by two of the wave's agents. **Not fixed**: the pin belongs in
  the `kbd` primitive and is a behaviour change rather than a compile-identical
  swap. Full entry in §8, under logical properties.

**Two defects the wave's own review caught — the program's quality evidence, and
the reason a retrofit wave gets reviewed rather than merged on green.** Both were
`KeyboardOrder` play functions that pinned the exact defect their own JSDoc
documented: green today, **red the moment someone fixed it**. That is the one
move `story-conventions.md` forbids outright, and neither would have been caught
by any gate — a pinned bug passes.

- **M4 `pricing-table`** asserted which element each tab landed on. The same
  story records that its `role="radiogroup"` has no roving tabindex; implementing
  that gives the unchecked radio `tabindex="-1"`, the second tab skips it, and
  the test goes red on the fix. Rewritten on `autonomy-selector`'s shape, which
  asserts invariants that hold both today and under APG: the checked radio is
  tabbable, the controls outside the group are each independently tabbable, plus
  containment, ring and no-trap — with the expected stop count derived from live
  DOM `tabindex` rather than hardcoded.
- **A7 `gen-settings-bar`** asserted that Tab visits all five toolbar segments in
  DOM order — the exact traversal its `role="toolbar"` contradicts. Its JSDoc
  argued the pin was a _feature_ ("this story is what notices"), which is
  precisely the inversion the convention warns about. Rewritten on
  `choice-chips`' pattern, which carries the identical defect and asserts only
  that the stops exist and each shows a ring. `pricing-table`'s DOM-derived bound
  was considered and rejected for this shape: nothing here sets `tabindex` at
  all, so the derivation reduces to counting the buttons — the same claim wearing
  a disguise.

**What wave 0 closed from the list above:** the 11-with-no-story item, outright.
The reduced-motion backlog moved from three branching components to seven —
`choice-chips`, `preview-tile`, `pricing-table` and `shortcuts-sheet` gained
branches — and `shortcuts-sheet` is what produced the Base UI popup correction
recorded above. `generation-queue`'s focus-loss finding is untouched and stays
open. The remaining ~91 items are spec §3.2's family waves; the gate is §4.

### Wave 1 — families D and I (2026-09-05)

Eleven agents, one per item, each in its own worktree cut from `origin/main` and
fast-forwarded to the integration branch as step 0 of the brief (the base-commit
trap from §1, handled rather than re-hit). All eleven reached zero unmet
obligations: 88 case obligations and 28 descriptions resolved, the baseline
regenerated once at the end. Brief and integrator procedure:
[`superpowers/plans/2026-09-05-case-story-family-waves.md`](superpowers/plans/2026-09-05-case-story-family-waves.md).

**Skips versus writes.** 11 `case-skip` lines across six files (`quote-reply`
3, `property-inspector` 2, `context-chips` 2, `skill-menu` 2,
`media-prompt-bar` 1, `ai-tools-menu` 1) and five files with all eight written
(`reference-strip`, `mode-tabs`, `context-toolbar`, `tool-panel`,
`drawing-tools`). Every skip is one of three shapes: `Controlled` where no
value/onChange pair exists (six items — `onSelect`/`onRemove`/`onAction`
report an intent and carry no value), `ReducedMotion` where nothing moves or
only a colour crossfades (four), and `EmptyLabel` where the only optional text
slot is a defaulted label whose empty case would ship a `button-name` violation
into the gate (two). `Controlled` was skipped _against_ the steering on
`property-inspector`, correctly: its `onSectionOpenChange` fires after the
section has already moved, so it is half a controlled pair and a host cannot
refuse; the reasoning is in the skip block.

**Mechanical fixes landed in-wave (seven source files):**

- Reduced-motion pairs restated on Base UI popups, each measured
  (`animationName` "enter" → "none" under emulated reduce): `mode-tabs`
  (tooltip), `context-toolbar` (tooltip, menu, popover), `ai-tools-menu`
  (menu), `drawing-tools` (popover). Four more off §8's 33-item list.
- Logical-property swaps, byte-identical in LTR: `context-chips`
  (`pl-2`/`pr-1`/`pr-2`/`ml-0.5` → `ps`/`pe`/`ms`), `skill-menu` (`border-r` →
  `border-e`), `tool-panel` (`left-2.5` → `start-2.5`, `pl-8` → `ps-8`,
  `text-left` → `text-start`), `drawing-tools` (`text-left` → `text-start`).
  `left-` → `start-` is not one of the four swaps §8's sweep entry enumerates;
  it was taken because it meets that entry's own test, and because swapping
  only the gutter would have left icon and gutter on opposite sides.
- `aria-label` on two unnamed `PopoverContent`s (`context-toolbar`,
  `drawing-tools`) — the one fix outside §3.4's literal list, accepted because
  it is a one-attribute drift correction with an in-repo idiom
  (`modality-rail`) and the alternative was leaving the popover closed so the
  gate stayed quiet. §8 has the general finding.

**Recorded, never pinned** — every play function in the wave stops short of
the defect its description names:

- Focus lost on removal or dismissal: `quote-reply` and `context-chips` (the
  remove control is the only focusable a chip owns), `reference-strip` (the
  last enabled Move disables itself under the cursor), plus the two
  `media-prompt-bar` behaviours its docs module already carried.
- No visible focus treatment: `media-prompt-bar`'s two textareas
  (`border-none focus-visible:ring-0`, no container `focus-within`);
  `skill-menu`'s search field (`InputGroup` keys its ring off
  `has-[[data-slot=input-group-control]:focus-visible]`, but cmdk's input sets
  `data-slot="command-input"`, so the selector never matches); `ai-tools-menu`'s
  menu rows (§8).
- `mode-tabs`: Tab lands on the first mode, not the active one (as
  `modality-rail` records on the same primitive); five modes with icons measure
  422px in a 375px column with no overflow handling, so the fifth is off-column
  with nothing saying it exists.
- `context-chips`: mention labels reorder under RTL (`@teammate` paints
  `teammate@` — the `@` is a neutral with no Latin before it), fix is
  `dir="ltr"` on the label; no `title` on the `max-w-40` truncated label.
- `quote-reply`: `<cite>` interpolates a caller-supplied `anchor` with no
  `<bdi>` isolation, so a mixed-script anchor reorders around the `·`.
- `reference-strip`: inherits C3's three RTL findings (Embla `direction` never
  set, physical `-ml-4`/`pl-4` gutter, previous/next on the wrong sides);
  Embla's JS tween has no reduced-motion branch; the empty slot still carries
  `aria-pressed` from `preview-tile`'s default `selectMode="toggle"`.
- `property-inspector`: a long value scrolls inside the fixed `w-20`
  `UnitInput` and loses its leading digits — 1920000 reads as a smaller number,
  not a clipped one.
- `drawing-tools`: long alternate labels spill (`toggleVariants`' base
  `whitespace-nowrap` plus a fixed `h-8`, the B4 trap again).
- `ai-tools-menu`: no `open`/`onOpenChange`, so a host cannot close the menu
  when the selection changes behind it.

**Spec and docs drift found by writing stories:**

- `component-specs.md` D3 lists `resolved · resolving · unresolved`; the
  component and manifest have no `resolving` state. Same class as wave 0's
  "declared states name behaviour no component implements".
- D6 `skill-menu`'s spec says search filters titles _and_ descriptions;
  `CommandItem` gets `value={skill.id}` with the description as its only
  `keywords`, so a title-only skill is findable by nothing the user can see.
  `Search`'s play asserts only the honoured half.
- Three docs corrections made centrally in the integration commit:
  `skill-menu.docs.tsx`'s second "do" told callers to override `cost-chip`'s
  `text-muted-foreground`, which the chip stopped shipping in the A retrofit;
  `drawing-tools.docs.tsx`'s keyboard note counted ten stops where roving
  tabindex makes five; and a stale comment in `ai-tools-menu.tsx`'s `ToolCost`
  described the same deleted override.
- `choice-chips`' `Boundary` one-liner ("if a chip can be removed, it is a
  filter chip") is one line short — context chips are removable too.

**Idiom hardening.** `ai-tools-menu`'s `KeyboardOrder` passed 13 warm runs and
failed the first run against a cleared Storybook cache: a key press read before
it applied leaves focus on the _previous_ stop, which is itself an expected
stop, so the "settle until focus is on some expected stop" wait cannot see it.
The tightened form waits for focus to _leave_ the previous stop before reading.
Recorded in `story-conventions.md` fact 4; `TaskTray` and `ShortcutsSheet`
still use the arrival form.

**Steering that did not bind** — for the next wave's prompts: `quote-reply`
has no `border-l`/`pl-` quote bar (it is icon + `gap-2`), so the predicted swap
did not exist; `property-inspector` is not controlled; `context-toolbar` needed
no frame/group/camera variant; `tool-panel`'s tabs contrast concern does not
apply (`variant="line"`, `text-foreground/60` at TOK-8's floor). One agent also
reported a repo-root `pnpm lint` cache hit whose output named a sibling agent
worktree's paths; `turbo.json` configures no shared cache dir, so the mechanism
is unconfirmed — noted here rather than in §4 until it bites again.

### Wave 2 — families E and P (2026-09-05)

Eleven agents, same shape as wave 1. All eleven reached zero unmet obligations
and families E and P are complete, but only four reported: **the other seven
were killed by a session rate limit in the window between finishing their work
and verifying it.** That window is the interesting part, because the work was
not lost — and the recovery is worth writing down, since the next long wave will
hit the same wall.

**The salvage procedure.** A killed agent's worktree survives with its working
tree intact. Every one of the seven had fast-forwarded correctly (step 0 of the
brief) and left a complete, uncommitted tree. So:

1. `git -C <agent worktree> diff > patch` for each, then `git apply --check`
   every patch against the integration branch before applying any. All seven
   applied clean, because each wave agent writes only its own files.
2. Read every registry-source hunk before adopting it. Seven of the seven were
   the sanctioned shapes, so nothing needed rejecting — but the review is the
   point, not a formality: nobody had verified this code.
3. Run `pnpm story-coverage:report <the whole list>`. All seven printed zero
   unmet, which is what established the work was finished rather than
   abandoned mid-file — including the one whose last words were "now the story
   file, writing it in full".
4. Run the story files. **Five passed as delivered. The two that had never been
   run once both failed**, which is the lesson: an unverified story file is not
   evidence of anything, and the two failures were of completely different
   kinds (see below).
5. Commit as one reviewed change rather than seven forged agent commits, and
   say in the message that the verification was done centrally.

**What the two unverified files were hiding.**

- **P1 `data-views` had a real defect and two false assertions.** The defect:
  the kanban board's scroll container was a bare `<div class="overflow-x-auto">`
  with no keyboard access — axe `scrollable-region-focusable`, the same rule
  L5 `shortcuts-sheet` failed in wave 0, and with the same consequence, that a
  keyboard user reaches the first columns of a board and no further. It is
  invisible at desktop width because nothing overflows there; the `Mobile`
  story is the only reason it was found. Fixed with that wave-0 idiom exactly:
  a `<section>` rather than a `<div>` (a bare div is `role="generic"`, where
  ARIA prohibits `aria-label`, so the tab stop would arrive anonymous),
  `tabIndex={0}`, a name for its contents, and a focus ring.

  The two false assertions are the more useful half, because **both were
  written from reading the source rather than running it, and both read
  perfectly.** One asserted that a group with an empty label "still announces
  its count and its tone", reasoning correctly about `groupAccessibleName` and
  never noticing that `feed-view.tsx` guards the whole header on
  `section.label ?` so the function is never called. The other asserted that a
  long title wraps in a table cell and grows the row — true in principle, false
  at the width the gate runs, where the title column takes 974px of a 1200px
  table and absorbs it on one line. Both descriptions asserted the same wrong
  things in prose. Rewritten against measurements, with the measurements in the
  descriptions.

- **P2 `detail-view-shell` failed on its own debugging probes**, left behind
  mid-run: two `expect(...).toBe("PROBE")` calls whose whole purpose was to
  print measurements into a failure message. Deleting them restored the real
  assertions underneath, which pass. One probe was worth keeping the output of
  — the 4.34:1 badge contrast now recorded in §8.

**The general lesson, and it is not about rate limits.** A story file that has
never been executed is a draft, however good it looks; two of two unverified
files failed, and the failures were a live accessibility defect and two
confidently-argued untruths. The convention already says a story earns its place
by being the only place a fact exists — this wave adds that **a fact nobody ran
is not yet a fact.**

**Also worth carrying forward:** `layout: "centered"` in a meta wraps every
story, so `canvasElement.firstElementChild` is the ~1200px centring div rather
than the story's own frame — a `Mobile` overflow assertion against it measures
the wrapper and passes for the wrong reason. Give the frame a `data-testid`.
Found on E7 `member-gate-row`; it will bite the next `Mobile` author.

### Wave 3 — family F (2026-09-06)

Seven agents, seven items, all at zero unmet, and no rate-limit casualties —
the batch was deliberately smaller than the eleven that hit the session wall in
wave 2. Six of the seven wrote all eight case stories with no skips at all,
which is worth noting against the D/I wave's eleven `case-skip` lines: family F
is result surfaces, and a result surface genuinely meets every one of the eight
situations.

**Fixed in-wave:** reduced-motion branches on F3 `asset-detail`'s dialog (the
fifth popup family off §8's list), F6 `render-queue`'s streaming spinner, F7
`approval-card`'s chevron _and_ its Confirm spinner, and F4 `action-stack`'s
menu popup. F4's measurement is the one that generalises: suppressing the popup
animation changed `animation-name` from `enter` to `none` **and** the popup's
width from 304px to 320px, because `data-open:animate-in` composes `zoom-in-95`
— the popup was arriving at 95% and growing, so this is real motion rather than
a fade. That agent also stated the rule the whole program had been circling:
the animation classes live on the vendored primitive, but the suppression has
to be restated per call site, **so fixing one consumer fixes none of the
others.**

**Which is how a false skip surfaced.** Acting on that rule, the integrator
swept the registry for `DropdownMenuContent` call sites without the pair and
found four. Three belong to families J and K and were left to their waves. The
fourth was B6 `thread-list`, whose `ReducedMotion` skip read "nothing this
component owns animates", on the grounds that the motion belonged to the
vendored popups and was therefore upstream — a reasonable position when it was
written and wrong under the per-call-site rule, since the component renders both
a dropdown menu and a delete confirmation and both animated. **Family B had no
case-story debt at adoption, so no later wave was going to reopen that file.**
Both surfaces now carry the pair and the skip is a real story that reads
`animationName` back on each. A skip is the one part of this convention with no
gate behind it: `story-coverage` checks that a reason exists, never that it is
true.

**Two integrator fixes an agent correctly declined to make.** F1's agent found
that A8 `preview-tile` owns the badge at `right-2` while F1 `result-card` owns
the select checkbox and hover actions at `left-2`, so swapping either alone
stacks both occupants on one edge — and it may not edit A8. It wrote an RTL
assertion that fails on a half-swap and passes on a full one, then left both.
Done centrally, with all eight `preview-tile` consumers re-run. F5's agent
declined the _same_ swap for the opposite reason and was equally right: its wipe
clip is `clipPath: inset(...)`, physical with no logical form, so a class-only
swap would put each pane number over the other pane's picture. §8 carries the
rule the pair gives.

**A claim that was checked twice and not reproduced.** F6's report stated that
transition assertions are vacuous in this gate — that the browser runner injects
`*, ::before, ::after { transition-property: none }`, defeating every Tailwind
`transition-*`, so wave 2's `run-button` assertion would pass with or without
the fix it was written to prove. H5's report later refined it: the suppressor is
Playwright's animations-disabled CSS, left behind by the runner's
screenshot-on-failure, so it is present _only after an earlier story in the same
file has failed_ — which is exactly when a story is being written.

Two experiments, neither reproducing it. A plain vendored `Button` inside a
deliberately failing story computes `transition-property: all` at `0.15s`, and a
sweep of every stylesheet in the document finds one `transition-property: none`:
Tailwind's own `.transition-none` utility definition. Adding a second story
_after_ a deliberate failure in the same file — the exact condition H5 named —
the later story still reads `all` / `0.15s`, and no 185-character injected style
is present. F7's independent measurement (its unfixed chevron read
`transform, translate, scale, rotate`, suppressed `none`) agrees that the
suppression does real work.

So the transition assertions written in waves 2 and 3 stand, and this entry
records the conditions actually tested rather than declaring the reports wrong:
two agents saw something on their own machines that a third measurement could
not reproduce, and if it resurfaces the thing to capture is the injected
`<style>` element itself alongside the failing story that preceded it.

### Wave 4 — family H (2026-09-06)

Seven agents, seven items, all at zero unmet. Six wrote all eight case stories
with no skips; the seventh skipped only `ReducedMotion`, and wrote its reason as
a grep it had run rather than an argument — which is the shape the convention
started asking for after wave 3's false skip.

**This wave found more that no gate can see than any before it**, and the reason
is worth naming: family H is timelines, faders and waveforms, so almost
everything it does is a direct-manipulation surface with a keyboard story
underneath. Four components turned out to have handles that paint no focus ring
at all, and four docs pages promised one — see §8. Nothing in the registry could
have caught that, because the ring is present in the source; it is simply on the
element that never receives focus.

**The wave audited the tooling this program itself introduced.** Wave 3 shipped
`focus-ring.ts` after four agents independently found the old ring predicate
could not fail. Wave 4 found two more holes in it, one of them fundamental:

- H2 `time-ruler` measured a false positive on the clipped `<input>` Base UI
  focuses, which still carries the user agent's outline. Its agent noticed,
  **declined to use the helper rather than manufacture the green it exists to
  prevent**, and explained the absence in the story. Fixed with an `isPainted`
  guard the same day; H7 `stem-mixer` reported the identical shape independently
  while the fix was being written.
- H6 `waveform-editor` went further and named the limit of the approach: an
  absolute check asks whether an element paints a treatment, never whether focus
  caused it, so a span carrying a permanent `shadow-sm` passes either way. Three
  of its slider spans are exactly that. `focusTreatmentSignature` now exists for
  the before/after differential, and `story-conventions.md` fact 5 says which
  tool to reach for: the differential where an element can be focused directly,
  `settledFocusRing` inside a tab walk where blurring to take a baseline would
  disturb the sequence under test.

The general lesson is the same one wave 2 recorded about unverified stories,
pointed at the harness instead of the components: **a checker written to catch a
class of defect is itself in that class until something measures it.** Three
waves used the old predicate before anyone read what it computed, and one wave
used the replacement before anyone found what it still missed.

**One claim was true and one was not, and the difference was checkability.**
H1's report said a whole class of reduced-motion assertions cannot fail because
`select.tsx` kills the popup animation by default — it named the file, the prop
and the class, all three checked out, and two already-merged stories were
audited against it. H5's report refined F6's transition claim into a specific
condition (the suppressor appears only after an earlier story in the same file
has failed); that condition was tested directly and did not reproduce, and §9's
wave 3 entry now records what was tested rather than declaring the reports
wrong. Both reports were written with the same confidence. Only one named
something a reader could go and read.

**The gate failed twice during integration, and both failures were real.** Worth
writing down, because the reflex on an intermittent gate is to re-run it.

The first run failed on B8 `account-menu`'s `KeyboardOrder`, a file this wave
did not touch: the closing wrap read `stop#4 Sign out` where it expected
`stop#0 Settings`. That is the settle-on-_arrival_ hole exactly — wave 1 found
it on `ai-tools-menu`, wave 3 wrote it into mechanical fact 4, and this file
predates both. A key that has not applied yet leaves focus on the previous row,
which is itself a row, so an arrival-only wait returns a stale read and the lap
looks like it never wrapped. Hardened to settle on departure, and the three
other files still on the arrival form went with it: `recommendation-card`,
`shortcuts-sheet` and `task-tray` — wave 1 had already recorded the last two as
holding the hole. Four files, 48 tests, green twice.

The second run failed somewhere else entirely: axe's `aria-input-field-name` on
a Base UI listbox, from H1 `transport-controls`' `ReducedMotion` story opening
the speed select. **Every `SelectContent` in the registry was unnamed**, and the
failure is intermittent only because axe has to run while the popup is open —
which is why eight call sites shipped that way. §8 has the four now named and
the four left to their waves.

So neither failure was flakiness in the ordinary sense. One was a test that
could not reliably observe what it asserted, the other a defect that could only
be seen in a window a story had just learned to open. Both were found because a
full run with a cleared cache was run twice rather than once.

**A postscript on those two gate failures: there were four, and the last one
took three attempts to fix.** Worth the space, because every wrong turn was
plausible.

The unnamed select listbox was fixed three times before it was fixed. The first
attempt put `aria-label` on `<SelectContent>` — the wrapper spreads its props
onto Base UI's `Popup`, and `role="listbox"` is on the `List` inside it, so the
attribute landed one element away from the thing axe reads. A probe that dumped
every `[role="listbox"]` and its name is what showed that; the story had been
passing four runs in five, so nothing else would have.

The second attempt forwarded the name to the `List` in
`apps/docs/components/ui/select.tsx`, and the gate kept failing. **The storybook
workspace has its own copy of every vendored primitive**, and its Vite alias
sends `@/components/ui/*` there, so the gate had never seen the fix. That is
now §8's own entry: 39 primitives in one copy, 60 in the other, identical today
apart from `"use client"` and formatting, synced by hand, and unchecked. The
third attempt patched both and the probe read the name back.

The lesson is not about selects. **Four runs in five is what a defect looks like
when the thing that reveals it is a race**, and a story that passes is not
evidence the thing it asserts is true — the same sentence wave 2 wrote about
stories nobody had run, reached from the other direction. Both full-suite runs
after the real fix were green, and so were the two before it, which is exactly
why the fix had to be confirmed with a probe rather than a passing run.

### Wave 5 — family J (2026-09-06)

Seven agents, seven items, all at zero unmet. Family J is libraries, grids and
filter rails, so most of what it found is about tables, names and layout under
pressure — §8 has those. What distinguishes the wave is that **three of the
things it corrected were written in this file by earlier waves**, and each was
caught by an agent that had been told to cite an entry and read it first.

- J4 `artifact-grid` was told to cite §8's "grid columns keyed off the viewport"
  bullet and not fix it. That bullet described a defect D19 had already removed
  in August, with J4 itself as the pilot and C4 converting after; both files
  carry container queries and four stories already assert the thresholds. It is
  the second stale §8 entry a wave agent has caught, after the carousel one.
- J2 `filter-panel` found a hole in `focusTreatmentSignature`, added one wave
  earlier: it read `outline-width`, which flips 3px to 1px on focus on Base UI's
  controls while `outline-style` stays `none`, so the signature reported a
  change on all fourteen of that component's stops including one painting
  nothing new.
- J6 `template-detail` measured its own unnamed listbox open under the gate and
  axe raised nothing, where H1 `transport-controls` had failed outright on the
  same rule a wave earlier. §8's entry now says "fails axe in at least one
  shape" and carries both measurements, neither of which explains the other.

**And the wave settled how the two focus checks relate, which two waves had got
wrong in opposite directions.** Wave 4 introduced the differential and this file
said to prefer it. J3 `explore-gallery` then measured a composer textarea whose
focus moves a shadow layer from transparent to coloured _while its geometry
stays zero_ — so the differential reports a change and `settledFocusRing`
correctly reports no ring. J2's selected chip is the mirror image: a permanent
ring identical in colour and width to its focus ring, where the absolute check
passes and the differential correctly reports nothing. They answer different
questions. `story-conventions.md` fact 5 now says to use both and carries both
measurements; it also drops the claim that the differential cannot work inside a
tab walk, which J5 `record-list` and J2 disproved independently by reading the
_next_ stop's signature while focus is still on the previous one.

The pattern across three waves is worth naming, because it is the argument for
the whole retrofit. **Every one of these corrections came from an agent
measuring something it had been handed as settled.** The instructions said cite,
not verify, and the citation was wrong four times out of four attempts to check.
A note in a file is not evidence; the thing that made these findable was that
writing a story forces you to render the claim.

### Wave 6 — families K and L (2026-09-06)

Nine agents, nine items, all at zero unmet, and the last reduced-motion holdouts
closed: K4 `selection-toolbar` carried the final unrestated `DropdownMenuContent`
in the registry, and the integrator closed the dialog backdrop that no call site
could reach. §8 has what the wave found in the components.

**What is worth reading twice is how much of it was correction.** Five written
claims were wrong, and every one was caught by an agent that had been handed the
claim as background:

- L4 `whats-new`'s docs said its detail pane carries no focus ring. It carries
  one and paints it — **the first correction in this program that made a
  component look better than its documentation**, and it was verified in the
  source before the text was changed.
- L3 `feature-announcement`'s docs said its card and chip are both
  CTA-then-dismiss. The chip is; the card is reversed, because its action slot
  sits inside the header.
- L6 `onboarding-wizard`'s docs said Home and End reach the first and last
  choice card. Neither is bound, nor is PageUp, so arrowing is the only route to
  a later option — and arrowing _answers the question_ with every card it
  passes.
- K3 `diff-review`'s docs quoted a button name without the space the
  accessible-name computation inserts before a hidden suffix.
- L2 `coach-mark`'s docs said Tab past Next continues into the page so the
  control being pointed at stays usable. It ends the tour instead.

**And this file's own right-to-left entry was narrowed for the third time**,
which is worth stating plainly because the first two versions were also written
here with confidence. Wave 1 said Base UI composites never learn about
direction. Wave 5 split that into positioning-works and keyboard-does-not. Wave
6 shows the real split is neither: `align` reads rendered direction and mirrors,
while `side` reads the same missing React context the arrow keys do. Three
measurements, each narrowing the last, none of which required new tooling —
only rendering the claim.

**The sharpest single finding is about the gate itself.** K1 `ai-doc-block` has
two textareas. Giving both an empty label produces a red gate on one and silence
on the other, and the only structural difference is that the silent one has a
placeholder to fall back on. The gate is a floor, not a check: whether it
catches this defect depends on an unrelated property of the field the defect
lands on. That is the argument for case stories in one sentence, and it took
six waves and a component with two nearly identical fields to say it this
cleanly.

### Wave 7 — families M and N (2026-09-06)

Twelve agents, twelve items, all at zero unmet. Baseline **219 → 104**, and the
description-only debt reaches **zero** — every declared-state export in the
registry now carries a JSDoc description. What is left is family O's 13 shells
and nothing else.

**The wave's defining moment is that two agents disproved their own steering.**
Both were told, in the prompt, that the dialog backdrop had been fixed centrally
in wave 6 and that they should not add a branch for it. Both fixed their panels,
measured the backdrop anyway, and found it still reading `animation-name: enter`
under emulated reduce. The wave-6 fix went into `components/ui/dialog.tsx`;
`components/ui/alert-dialog.tsx` is a separate file with the identical
unreachable overlay, and it had been missed. N2 `trust-dialog` said so in as many
words — "your steering was wrong about the backdrop, and this is the finding to
carry" — which is the behaviour the brief asks for and the first time an agent
has contradicted a _current-wave_ instruction rather than an old written claim.
Fixed centrally in both copies, and the regression guard in
`TrustDialog.stories.tsx` was verified to fail on a reverted class before it was
kept, because a guard that has never been seen red is not a guard.

**The most useful single finding is a negative against a rule this program has
leaned on for six waves.** `text-left` → `text-start` has been treated as a
free, byte-identical swap in every wave since the first. N6 `usage-dashboard`
measured it centring all four table headings in LTR: the class sat on a `<tr>`
and the alignment was consumed by `<th>`s, and Chrome's user-agent
`th { text-align: -internal-center }` defers to an inherited value only when
that value is not the initial `start`. The swap is free on the element that
paints the text and not on an ancestor the user agent has an opinion about. It
was caught by the agent's own RTL assertion, before it shipped, which is the
case for writing the assertion before making the change rather than after.

**Two more docs focus bullets were wrong, both in the same direction** — a note
claiming a control has no visible focus treatment when it has one. N3
`disclaimer-note`'s element takes the user agent's own outline, recoloured by
this repo's global `outline-ring/50`: thin against the registry's ring-2, not
absent. M1 `settings-dialog`'s panel has carried `focus-visible:ring-2` since
before this program began, verified in the source at the commit before the wave.
That is seven docs corrections across waves 6 and 7, and the pattern in them is
consistent: prose written from reading a class list, contradicted by rendering
it.

**Two lists in this file were stale and were re-derived rather than edited.**
N6 flagged that the "unnamed `SelectContent`" list no longer matched the
registry; a `grep` across `registry/super-ai` after the wave gives
`model-picker` and `records-shell`, and N6's own correction was itself one item
stale, because `trust-dialog` had been named in a sibling worktree it could not
see. The reduced-motion half of that list should not be kept at all: no call
site passes `alignItemWithTrigger={false}`, so the five call sites without the
pair are already suppressed and listing them invites a fix that changes nothing.
Both figures in this file are now derivations, with the command that produces
them written down beside the answer.

**And the integrator found a flake in landed work by running the suite cold.**
L4 `whats-new`'s `KeyboardOrder` passed on every warm run — three repeats of the
wave's files, three full suites — and failed deterministically the first time
the Storybook cache was cleared: it read the detail pane once after waiting on
`aria-selected`, and the `hidden` attribute moves between the two Base UI tab
panels a tick later. Agents are already told to run their own file from a
cleared cache; the integrator was not, and a warm cache had been hiding this
since wave 6. Clearing
`apps/storybook/node_modules/.cache/storybook` and running `test:stories` once
per wave is now part of integration — with the dev server down, per the trap in
§4.

### Wave 8 — family O (2026-09-06) — the last one

Thirteen shells, thirteen agents, all at zero unmet. **Baseline 104 → 0.** Every
one of the 116 registry items now carries the eight case names or an annotated
skip, and every declared-state export carries a JSDoc description. The ratchet
file is an empty list, which turns it from a debt ledger into a plain
regression guard: any obligation that goes unmet from here is a new failure with
nothing to hide behind.

**One line of tooling changed what the wave could see.** The block brief had
said since family O shipped that the mandatory `Responsive` story proves nothing
mechanically — the viewport addon contributes only `initialGlobals`, all
resizing happens in Storybook's manager, and the vitest runner has no manager —
and its proposed fix was a second vitest project pinned to a mobile viewport,
which would have doubled a 1,300-test suite. `page.viewport(375, 812)` from
`vitest/browser`, called inside a play, does the same job in one line and does
not leak into the next story. What it found: the mobile drawer every sidebar
swaps to had never been suppressed under reduced motion, `modality-rail` is
92px at every width so a rail-based shell has no narrow layout to swap into, and
a claim recorded as _conditional_ in wave 2 (E1's "Generate never scrolls away")
turned out to hold in this composition after all. Seven waves of width-wrapper
`Mobile` stories could not have reached any of it.

**Three agents corrected the instruction they were given, and none of them acted
alone.** The import path in the convention was wrong twice over —
`@vitest/browser/context` is deprecated, and `vitest/browser` throws on
evaluation outside Browser Mode, so a top-level import breaks the whole story
file in a built Storybook. Three agents used a dynamic in-play import for that
reason and said so; three used a static one, and one of those verified
`storybook build` exits 0, which is true and a different claim, because the
throw happens at evaluation time in the browser. Both halves were needed to see
the whole thing.

**The wave's own steering was wrong four times and the agents caught all four.**
`pricing-table` is not a table and never touches the vendored `text-left` that
was cited at it. §8's citation-jump entry says the jump has to find rows
positionally; the paraphrase handed to O13 said it "cannot be built", and O13
built a story that measures it. The `scrollable-region-focusable` instance count
in one prompt was off by one, and the agent cited no number rather than pick
between two contradicting sources. And a merge-base artifact produced two more
apparent corrections that were true of what the agent had and false of the
branch — **batch 2 was dispatched while the updated brief and a vendored fix were
still uncommitted**, which is now written into the brief's step 0 as a rule:
commit before dispatching.

**Eleven docs modules said a control paints no focus treatment when it paints
the user agent's outline.** Every family O docs module had one. Together with
waves 6 and 7 that is eighteen corrections to written claims across three waves,
and the distribution is worth reading: almost all of them are prose written from
reading a class list, contradicted the first time someone rendered it. The two
exceptions are the sharper kind — a documented tab order that was backwards in
two shells, because the topbar is a DOM sibling after the sidebar and nobody had
walked it.

**What the program leaves open** is in §8: the vendored sidebar's RTL mirroring,
the tooltip that eats an Escape, `hover-card.tsx`'s missing branch, the
`matchesQuery` divergence, `model-picker`'s unnamed listbox, and the notebook
chat pane that cannot take the standard scroll-container repair. Each is
recorded with a measurement, and none of them is a case story's to fix.
