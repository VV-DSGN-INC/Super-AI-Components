---
name: unslop
description: Anti-slop audit for AI-generated UI, portable across projects. Use BEFORE designing/building any new screen, component, or page (constraints first), and AGAIN before calling it done (audit + fix). Also use when reviewing UI, when something "looks AI-generated", or when the user says slop, generic, or template-y.
---

# Unslop

Slop is the absence of decisions — an unguided model emits the statistical
median of its training data: indigo gradients, Inter, three-card grids,
glassmorphism, `#8884d8` charts, "Elevate Your Workflow". Four root causes:
**statistical gravity** (most-copied snippet wins), **decoration faking
hierarchy**, **fabrication pressure** (invented stats/testimonials/data), and
**per-emission amnesia** (values drift, components duplicate across
generations). Counter all four: decide once in the project's system, ban the
named defaults, require provenance, audit with counts — not vibes.

Origin research (12 lenses, ~110 indicators, ~40 sources):
`upstream-design-system/docs/superpowers/specs/2026-08-11-anti-slop-rules.md`.

## Phase 0 — This repo's bindings

`super-ai-components` is governed by contracts in `docs/design-system/` —
`component-build-brief.md` is the law, `packages/ds-rules` (`rulecheck.mjs`,
run via `pnpm check:tokens`) is the token gate, `a11y-baseline.md` the
measured posture. Unslop complements the gate: the gate owns every
grep-expressible blocker in the records; warning-severity records (CPY-2,
COL-6) and `review`/`judgment` records (LAY-1) surface only in this skill's
full-detector run — CI's `check:tokens` and the write-time hook both filter
to `--severity blocker`; this skill owns the `unchecked` list (TOK-6 →
`pnpm test:stories`, `judgment` rules), the rendered passes, and
fix-as-substitution. Known trap that is also an unslop rule: never pair
`text-muted-foreground` with `bg-muted`/`bg-accent`/`bg-secondary`.
Phase 2 here means the full CI gate order in `ci.yml`.
Taxonomy + fix ladder: Phases 1 to 3 below. This repo's decisions on top of
them, each with its rule: `docs/design-system/anti-slop.md`.

**Mechanical audit.** Phase 2's detector here is the full records run, not
the blocker-only gate:

    node packages/ds-rules/rulecheck.mjs --json

Violations are findings; apply each record's own `fix`. Then work the
`unchecked` list: TOK-6 discharges via `pnpm test:stories`; `judgment`-method
rules are the reading work of the rendered passes.

<!-- unslop-core:start unslop@2.1.0 sha256:c029038b95be619e -->
<!-- Generated from unslop:unslop (weeeha/unslop) by its scripts/sync.mjs. Edit that skill, not this block; this repo's own rules go in Phase 0 above. -->
<!-- prettier-ignore-start -->
## Phase 1: Constraints while generating

Every rule carries a **tier**, which says whether you may disagree with it:

- **Floor** (a repo detector's `blocker`): never waivable. Correctness,
  access, honesty, and the named defaults no admired product breaks on
  purpose. A hit is fixed.
- **Reflex** (`review` / `warning`): a default a model falls into. Waivable
  on the record, in a comment at the hit:
  `unslop-waive <RULE> · <guard evidence> · <reason>`. The evidence is what
  makes this hit not a hit here (the modal scrim sits over the real page);
  the reason is about this screen and shares a word with it. A reason that
  is boilerplate, or reused word for word on another waiver, is not a
  waiver. The same rule waived three times is a house style: write it into
  Phase 0 and drop the waivers.
- **Finish**: craft detail invisible at arm's length. Reported and
  answered, never blocking.

The bans below are Floor unless marked (R). A repo's Phase 0 may move a
rule between tiers with a reason; it may not delete one.

1. **Effects.** No gradient text (`bg-clip-text`) (EFF-1), no gradients on controls
   or text (R) (EFF-2), no indigo→violet gradient anywhere (EFF-3), no glassmorphism without real
   underlying content (R) (EFF-4), no blurred orbs / spotlights / grain layers (EFF-5), no colored
   or glowing shadows (EFF-6), no pure #000/#fff pairs (R) (EFF-7). A shadow has an offset and a
   blur; a hard block shadow (`4px 4px 0`) belongs only to a world that chose
   neobrutalism (R) (EFF-8). No blob or `clip-path` shape standing in for a real
   cut-out of the subject (R) (EFF-9). No cream-paper default (cream page, thin
   serif, italic accent, pill buttons) picked because nothing else was
   decided (R) (EFF-10). Secondary text on a coloured surface is tinted from that
   surface, never a neutral grey (EFF-11).
2. **Type.** Only the project's declared families and scale; no new fonts,
   ad-hoc sizes (TYP-1), or blanket `tracking-tight` (R) (TYP-2); no italic-serif accent
   words (R) (TYP-3); hierarchy = size/weight, never decoration (TYP-4). **No eyebrow**:
   short inert type before a heading, in any geometry (stacked label, pill,
   ordinal, category tag over a card, TRUSTED BY over logos); delete it and
   read the section, and if nothing was lost but a name for what comes next
   it was an eyebrow (TYP-5). A `<figcaption>`, `<th>`, `<label>`, byline, `<time>`
   or a unit after its figure is not one. **No tracked-caps label**: text at
   15px or under set uppercase, small-caps, or letter-spaced past 0.03em; a
   wordmark excepted (TYP-6). **Readable text**: no text under 12px (TYP-7); headings in
   outline order (no h1 to h3) and each level a visible size or weight step
   from the next, never a flat scale (TYP-8); body measure 75ch at most (R) (TYP-9), body
   leading 1.4 or more (R) (TYP-10), no justified or all-caps running text (R) (TYP-11),
   display type 6rem at most and tracking no tighter than -0.04em (R) (TYP-12).
   Monospace only for code, data and measurement, never as a "technical"
   costume (R) (TYP-13).
3. **Layout.** Container nesting ≤1 (no cards in cards) (LAY-1); separation ladder:
   spacing → hairline → surface tint → card (LAY-2); radii and gaps only from the
   project's scale (LAY-3, LAY-16, LAY-17); no exactly-3-equal-cards reflex (R) (LAY-4); no identical
   stat-card strips (R) (LAY-5); no bento mosaic where every cell is the same size
   (R) (LAY-6); no hero-metric block (big number, small label, supporting stats)
   standing in for a headline (R) (LAY-7); no section numbers (01 / 02 / 03) unless
   the order is information (R) (LAY-8); no modal for a task that neither interrupts
   nor needs locked focus (R) (LAY-9); the screen's most important element visibly
   dominant (LAY-10). **Breathing room**: more space above a heading than below it (LAY-11);
   text and cards never touch the screen edge (a 16px gutter at 375 at
   least) (R) (LAY-12); padding inside a bordered or filled box from the spacing scale,
   never cramped against its text (R) (LAY-13). **No default
   dashboard shell** (R): sidebar + top bar + four stat cards + chart +
   table, chosen before anyone named the screen's job and the one decision
   the user makes on it; if the job is "spot the failing job and retry it",
   the failing jobs are the page and the stat row is a footnote (R) (LAY-14). **Layout
   does not move on state change**: hover, focus and selection may change
   colour/shadow/ring/opacity, never padding, gap, size, border-width or
   type; space for anything conditional is reserved at rest (disclosure
   components are the declared exception) (LAY-15).
4. **Components.** Compose from the project's library (search before
   creating; no V2 duplicates) (CMP-1); no colored left-border accent strips (R) (CMP-2); no
   icon in a tinted rounded tile above a heading (CMP-3); no "✨ AI-powered" badge
   theater (CMP-4); unlabeled sparkle icons never (CMP-5). **Every control does
   something**: a form that prints "Sent" with no request behind it is an
   invented outcome (validate, post nowhere, say "Nothing was sent; this
   form is not connected yet"); a nav link to nowhere and a button with no
   handler ship labelled "Coming soon" or not at all (CMP-6). **One filled control
   per view**: the primary action is filled, every other control is
   outlined or plain, so the way forward is the one solid shape (R) (CMP-7).
5. **Icons.** One library, one weight, 2–3 sizes (ICO-1); zero emoji in chrome (R) (ICO-2).
6. **Motion.** Only on state change; no idle loops (MOT-1, MOT-8), scroll-reveal, marquee,
   typewriter, parallax (MOT-2); never `transition: all` (MOT-3); transform/opacity only (MOT-4);
   `prefers-reduced-motion` guard whenever keyframes exist (R) (MOT-5). **Nothing
   hidden at rest**: a reveal class that sets `opacity: 0` or
   `visibility: hidden` until a script runs ships blank when the script
   fails; hide only under a `.js` class, or animate from visible with
   `@starting-style` (R) (MOT-6). A `setInterval` or animation-frame loop runs only
   while its view is visible: gate it on `document.hidden` or the view's
   own active flag (R) (MOT-7).
7. **Copy.** Verb + object labels (never "Get Started"/"Learn More") (CPY-1); banned
   register: elevate/unlock/empower/seamless/effortless/supercharge (CPY-2),
   "not just X, it's Y" (CPY-3), exclamation marks in microcopy (CPY-4), aphoristic cadence
   (a run of two- or three-word fragments, "Fast. Simple. Yours.", standing
   in for a sentence) (R) (CPY-5), cheerleading ("You've got this", "Great job!")
   and celebration overlays (confetti, trophies) for a routine action,
   where the interface should report the result (R) (CPY-6); zero fabricated
   numbers, names, quotes, logos, or demo data no real system could emit (CPY-7).
   **No template punctuation**: meta strings joined with middle dots
   (`A · B · C`) (CPY-8), an arrow glued to link or button text (`Learn more →`) (CPY-9),
   a decorative status dot before a label (CPY-10); one dot in a byline, or a dot
   that marks a live state, is legal. **No filler people**: John Doe,
   johndoe@example.com, "Sarah Chen updated a document, 2 hours ago"; an
   empty cell stays empty or carries an honest placeholder (`Your name`,
   `email@example.com`) (CPY-11).
8. **Charts.** Project palette only (never `#8884d8`/`#82ca9d`) (CHT-1); linear/step
   interpolation (CHT-2); no gradient area fills (CHT-3); flat marks (CHT-4); units visible (CHT-5); bars
   zero-based (CHT-6); <4 data points is a stat, not a chart (CHT-7). **The title is the
   question the chart answers** ("Failed jobs per hour, last 24h"), never
   "Overview" or "Performance" (CHT-8); a delta ("+12% this week") only with a
   real, named comparison period behind it (CHT-9). **One channel, one
   variable**: colour, length, position and size each encode one thing; a
   ring whose colour is the status and whose length is the progress makes
   the reader decode two scales at once (R) (CHT-10).
9. **States & a11y.** Empty/loading/error/populated all designed (STA-1); anything
   that fetches also gets an honest offline/stale tell, never fallback or
   mock data rendered as live (STA-2); visible focus on everything interactive (STA-3); AA
   contrast on the actual surface, in every theme the project ships (STA-4); a
   surface that keeps its colour in both themes takes text roles that keep
   theirs too, or its text inverts against it (STA-5). **Never colour alone**: a
   state or reading carried by colour (overdue, failed, done, over budget)
   also carries a word, an icon, a shape or a position (STA-6). **Themes flip
   tokens, not components**: dark mode is the same component reading
   flipped roles, never a forked dark variant (R) (STA-7). Semantic elements (no
   onClick divs) (STA-8); accessible names on icon buttons (STA-9); the page loads with no
   broken image (STA-10) and no uncaught script error (STA-11).
   **Chrome states count too**: every collapsed/compact/truncating mode a
   component declares is designed and checked, and truncation is decided for
   the tree, not per leaf (STA-12).
10. **Responsive.** Verify at 375px: no horizontal scroll (RSP-1), ≥24px tap targets
    (44px in sticky bars) (RSP-2), no hover-only actions (RSP-3), tables get a small-screen
    strategy (RSP-4), `dvh` not `vh` for shells (RSP-5).

## Phase 2: Audit before "done"

Audit what you changed. Older code that already breaks a rule is its own
scoped task; do not sweep it uninvited. The hook is advisory: the agent still
runs this Phase in full before calling work done, and a silent hook is not a
clean audit.

**Mechanical first.** If the project has a rule detector or token gate
(Phase 0 names it), run it and apply each hit's own `fix` rather than
inventing one. Do not re-grep what a gate already owns: greps run from
memory go stale, and two of this skill's own greps once sat broken for weeks
that way. Then work the detector's `unchecked` list, the rules no script can
run. They are reported so they cannot be forgotten, and most of them
discharge in the rendered passes below.

**Without a detector**, run the registry's grep list over the changed files
(expect zero, exceptions justified), over the same roots the project's gate
scans if it has one; a grep list that disagrees with the gate's scope is where
a violation survives. The list is `<skill-dir>/rules/core.json`: every
`pattern` and `co-occur` rule in it carries the Tailwind class and the
plain-CSS spelling, because a repo without Tailwind writes only the second.
`node <skill-dir>/scripts/rules.mjs check <files>` runs it.
Before trusting a zero, run the same list over
`<skill-dir>/fixtures/grep/classic-slop.html`, the smoke file for the grep list
a repo without a detector runs: a pattern that comes back empty there is
broken, not clean. The fixtures cover every rule in `rules/core.json`, some of
them in per-rule files, and `node <skill-dir>/scripts/rules.mjs selftest`
proves each rule against its own fixture.

**Second detector, any repo.** Impeccable's CLI (`pbakaus/impeccable`) runs
62 fixed rules with no model and no key, and catches tells a grep cannot
see: Inter as the primary font, a purple palette, an icon tile or kicker
above a heading, nested cards, a zero-offset glow, a flat type scale, a
skipped heading level. Run both modes; each sees rules the other misses (on
the fixture, the file scan caught the font, glow and nested cards and the
URL scan caught the kicker):

    DO_NOT_TRACK=1 npx --yes impeccable@4.8.0 detect --json <changed files>
    DO_NOT_TRACK=1 npx --yes impeccable@4.8.0 detect --json <dev-server url>

Exit 2 is findings, 1 is a target it could not scan. Read each hit as the
unslop rule it matches; the tier comes from this skill, not from
Impeccable. It has no rules for render behaviour (layout moving on a state,
motion at rest, tap targets, overflow) or honesty (invented numbers, filler
people, dead controls), so a clean Impeccable run discharges nothing in
this skill. Run only `detect`: `impeccable install` adds edit hooks, a
downloaded engine and `.impeccable/` files to the repo. Move the pin to a
newer version only after that version still flags the fixture.

**Render tier.** `node <skill-dir>/scripts/render.mjs <url|file ...>`
opens the changed screens in headless Chrome over the DevTools protocol
(nothing to install beyond Chrome; `CHROME_PATH` overrides the binary) at
375 and 1280 and measures what the passes below used to eyeball:
horizontal overflow and elements spilling past the 375 screen · controls
whose computed style does not change under a forced `:focus-visible` ·
**state stability** (every visible element's box at rest, then under a
forced `:hover` and `:focus` on each control; a box that moved or grew is
the finding, the control that triggered it is named) · **motion at rest**
(`document.getAnimations()` on the idle page, minus the loaders Phase 0
sanctions) · text contrast read from the pixels behind the glyphs, so a
surface painted by a pseudo-element, an absolute layer or an image counts
as the eye sees it · tap targets under 24px at 375 · **readable text**:
text under 12px, running text over 80ch a line or justified, leading under
1.35, text within 16px of the screen edge at 375, a skipped heading level
or a heading no bigger or heavier than body text · an image that loaded
nothing · an uncaught script error on load. `--shots <dir>` writes the
screenshots the chrome-states and squint passes read; `--allow-move` and
`--allow-motion` take the selectors Phase 0 names (disclosure components,
skeletons); `--scheme dark` reruns under the other theme. Reflex checks
(measure, leading, edge) report WARN and Floor checks FAIL; exit 1 on any
FAIL.
`--selftest` runs it against its own slop and clean fixtures: a check that
has not caught its planted positive proves nothing, and a clean run is
read only after the selftest passed.

Rendered passes, after the render tier: **squint** (one thing dominant, no
identical section anatomy) · **counts** (font sizes ≤7, radii/shadows ⊆
project scale, ≤1 saturated accent per viewport (LAY-18); browser surfaces themed,
since selection colour, caret, scrollbar and tabular numerals left at
browser defaults are the cheapest tell a page was assembled) (STA-13) ·
**contrast** in every theme the project ships (the script runs one scheme
at a time) · **chrome states** (render every collapsed/compact/truncating
mode; a clipped focus ring still passes the DOM, so this pass is a
screenshot or it did not happen) · **hostile fixtures** (plausible, never
random: the worst real day (everything overdue, nothing done),
which is the screen to design for rather than the demo's good day, 3×
strings, a one-letter name, a count of exactly 1, a missing
optional field, diacritics, empty, error, offline, mixed-sign data, 200%
zoom, labels 40% longer as a translation makes them, one unbroken
40-character token such as a URL or email, a right-to-left run, a number
and date in another locale's format) (STA-14) · **ratchet** (distinct radii/shadows/sizes did not grow vs. before
the change) (LAY-19).

**Fresh-eyes review.** Last step of Phase 2: hand the evidence (the diff, the
`rules.mjs --json` report, the `render.mjs --json` report, the screenshots
directory, Phase 0, `unslop.config.json`, the path of `rules/core.json` and the
path of this SKILL.md, plugin or vendored copy) to the `unslop-reviewer` agent.
Its Floor findings are fixed before the report; its Reflex findings are fixed
or waived with evidence. `reviewer: false` in `unslop.config.json` skips it.

## Phase 3: Fix ladder

Never fix by bare deletion: slop is a **faked decision**. Find the job the
decoration was doing and do it with the system's device. A repo's Phase 0
may add rows, and where one names the same violation as a row here, the
repo's row wins.

| Violation | Substitute |
|---|---|
| Gradient fill/text | Flat token; emphasis via size/weight/position; one accent word max |
| Glass/glow/orbs | Delete layer; separate via spacing → hairline → tint → card |
| Colored/new shadow | Project elevation token; focus → focus ring; attention → hierarchy |
| Raw hex/px | The project's token (match by usage); none fits → propose it, don't inline |
| Off-scale value | Snap to the project's nearest scale step |
| New font/size/weight | Nearest declared style; emphasis = weight step, not new size |
| Emoji/icon leak | Project icon set at its sizes, or nothing |
| Loops/scroll FX | Bind to real state change or render static; named transitions, ease-out |
| Copy register | Verb + object; unprovable adjective/number → delete the claim |
| Chart defaults | Project palette, plain line, linear/step, add unit, direct labels |
| Contrast fail | Move UP the text ramp or lighten surface; never a one-off darker hex |
| Nested cards | Dissolve inner boundaries down the ladder, keep content |
| 3-card reflex/stat strip | Rank content; dominant cell for the answering item, rest → row/table |
| Happy-path only | Empty = sentence + creating action; loading = matched skeleton; error = cause + retry |
| Mock data shown as live | Honest offline/stale tell; never a silent fallback |
| Layout moves on a state | Reserve the space at rest (`invisible`/`opacity-0`, or the same border in `transparent`); put the signal on colour/shadow/ring/opacity |
| Collapsed state loses content | Design the collapsed mode as its own state; icons keep their labels as tooltips/accessible names |
| Indicator clipped by an ancestor | Draw it on the ancestor that owns the boundary, or lift the clip one level |
| 375px fails | Mobile-first bases, `dvh`, padded hit areas, kebab menus, table strategy |
| Duplicate component | Delete new one; extend existing via its variant props |
| Ratchet growth | Converge onto existing steps; new steps enter via the token system only |
| Eyebrow / tracked-caps label | Delete it and read the section; a lost fact becomes the heading, a caption or a `<th>`; labels in the body face a step smaller, sentence case, untracked |
| Fake send / dead control | Validate, post nowhere, say so on screen; a link with no destination is removed or labelled "Coming soon" |
| Default dashboard shell | Name the screen's job and its one decision; the deciding list or table is the page, the stat row a footnote or gone |
| Template punctuation | Line breaks, columns, hairlines; a verb as the link label; a dot only where a state is live |
| Hidden at rest | Visible by default; hide under a `.js` class only, or animate from visible with `@starting-style` |
| Filler people / data | Empty cell, or an honest placeholder that names what goes there; a feed shows real events or does not ship |
| Long measure / tight leading / tiny text | `max-width` in `ch` on the text block; leading and sizes from the type scale's own steps |
| Skipped heading / flat scale | Re-level headings to the page outline; each level one scale step or one weight step from the next |
| Text or card on the screen edge / cramped box | Gutter and padding from the spacing scale; more space above a heading than below |
| Hard block shadow / blob mask | The project's elevation token; a real cut-out asset of the subject, or a plain rectangle |
| Cream-paper default | Name the product's world in Phase 0 and take the palette and type from it; without one, the system's neutral tokens |
| Hero metric / section numbers | The real headline leads; a number earns size only as the answer to the screen's question; ordinals only where order is information |
| Aphoristic cadence | One plain sentence with a verb that says what the thing does |
| Broken image / script error | Fix the path or the error; an image that may be missing gets a sized placeholder and alt text |
| Colour-only state | Add the word, icon, shape or position; the colour stays as reinforcement |
| Two variables on one channel | Give the second variable its own channel: position, length or a label |
| Cheerleading / celebration | State the result plainly with the next small action; a celebration becomes the result plus Undo |
| Second filled control | Demote it to outlined or plain; one filled control per view |
| Loop running while hidden | Gate the interval or frame loop on visibility or the view's active flag |
| Forked dark variant / fixed surface with flipping text | One component reading roles; a surface that keeps its colour reads roles that do not invert |

Report as: violation → tier → rule area → fix applied, or the waiver with
its evidence. Each PASS names what was checked ("RSP-1 PASS: render tier,
375 and 1280, 0 overflow"); a fabricated pass is itself slop. Re-run Phase
2 until clean.
<!-- prettier-ignore-end -->
<!-- unslop-core:end -->
