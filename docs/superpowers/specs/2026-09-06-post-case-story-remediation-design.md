# Post-case-story remediation — design

**Written 2026-09-06, at commit `24d4140`** (the merge of PR #45, which closed the
case-story program). Everything numbered here was measured in a worktree at that
commit, not read out of a document. Where a count contradicts a doc, the doc is
what is wrong; §4's wave 2 fixes the docs.

---

## 1. Why this exists

The case-story program finished and left the build broken.

`main` is red. [CI run 34067225668](https://github.com/VV-DSGN-INC/Super-AI-Components/actions/runs/34067225668)
fails at **Storybook a11y + interaction**, which is step 10 of 11 — so the
**consumer install test has not run on `main` since the program landed**. That is
the one gate this repo calls the product-proving test, and it is currently
hidden behind a failure it has nothing to do with. This is the exact failure mode
`CONTINUE.md` §1 warns about, arriving from the other direction: not a gate
missing from a written list, but a gate that runs and stops everything behind it.

Ten remediation items came out of the review that followed. Three decisions
shrink them to nine and reorder them; the rest is sequencing.

## 2. What was measured

### 2.1 The red gate

Ten story files fail, eleven stories in total: `ActionStack/Mobile`,
`AssetDetail/LongContent`, `DocsShell/RTL`, `DocsShell/LongContent`,
`PermissionPrompt/Mobile`, `RecordList/LongContent`, `RecordsShell/Mobile`,
`ResultCard/Mobile`, `StudioShell/LongContent`, `TrackList/LongContent`,
`TranscriptEditor/LongContent`. 121 of 131 files pass.

Every failure is an absolute pixel value written on macOS and read on Linux. Two
magnitudes, two causes:

| delta   | example                                              | cause                                               |
| ------- | ---------------------------------------------------- | --------------------------------------------------- |
| 1px     | `retry=74x28` against `retry=73x28`                  | font rasterization                                  |
| 16–28px | `53/472` against `53/444`; `width=321` against `301` | classic scrollbars against macOS overlay scrollbars |

The handoff records "all eleven gates passed at `e501c4b`". That was true, on a
Mac. **The gate has never been portable and nothing said so.**

### 2.2 The blast radius, and why the fix is a conversion

173 absolute numeric `toBe` assertions live in 58 of the 116 super-ai story
files. The largest single file holds 17 (`TimeRuler.stories.tsx`); the median
file holds two or three.

The important number is the other one. Across 74 story files the suite already
contains **242 `toBeGreaterThan`, 193 `toBeLessThanOrEqual`, 68 `toBeLessThan`,
22 `toBeGreaterThanOrEqual` and 3 `toBeCloseTo`**. The relationship idiom is the
house style and the absolute pin is the deviation, so this is a conversion to an
existing convention rather than the invention of a new one.

### 2.3 The dependency graph — a hypothesis that did not survive

This is why the dependency work has to precede the pin work rather than run
beside it.

- **Two Tailwind copies resolve.** `tailwindcss@4.3.0` is the direct devDependency
  in both apps; `tailwindcss@4.3.2` arrives in `apps/storybook` through
  `@tailwindcss/vite@4.3.2`. Tailwind emits the CSS the measurements measure.
- **Two Vite majors resolve.** `apps/docs` and `packages/ds-rules` run
  `vitest@4.1.8` against `vite@8.0.16`; `apps/storybook` runs the same vitest
  against `vite@7.3.6`, because it pins `vite ^7.0.0` and
  `@vitejs/plugin-react ^5.0.0` where docs pins `^6.0.2`.
- **The gate downloads its own fonts.** `apps/storybook/src/index.css:4` imports
  Geist and Geist Mono from `fonts.googleapis.com` at test time. The docs app
  self-hosts through `next/font`. So the a11y gate depends on the network and on
  whatever the runner resolves, while the thing it is meant to mirror does not.
  No `@fontsource*` package exists in the lockfile today.

The heading above was a hypothesis and wave 0 tested it. **The dependency
alignment moved nothing**: collapsing two Tailwind copies, two Vite majors and
two `@vitejs/plugin-react` majors onto one each left the container failure set
and every sampled value byte-identical. The hygiene is worth having and the
duplicate Tailwind was a real finding, but the sequencing argument this section
made — that deps must precede the conversion or measurements get pinned twice —
**does not hold and is withdrawn.** The font import, three bullets up, is what
was actually moving them.

### 2.4 What the runner image actually proved

`playwright@1.60.0` is what the lockfile resolves, so `mcr.microsoft.com/playwright:v1.60.0-noble`
is the runner. It was run against a clean `git archive` of `24d4140`, twice.

**Run 1, image as shipped.** 11 test files failed against GitHub's 10. Three sampled
measurements, next to the value the story pins and the value GitHub produced:

| measurement                | macOS (pinned) | GitHub amd64 | container arm64 |
| -------------------------- | -------------- | ------------ | --------------- |
| `retry` button width       | 73px           | 74px         | 68px            |
| preset label `scrollWidth` | 444px          | 472px        | 411px           |
| url token width            | 301px          | 321px        | 284px           |

Three machines, three answers, and the pinned one is a fourth environment's.
`fc-list` reports **zero Geist faces installed** on the runner, so the only
source of the family is the `fonts.googleapis.com` import at test time.

**Run 2, with 198 Geist faces installed system-wide and fontconfig rebuilt.**
Identical: same 11 files, and 68 / 411 / 284 again, byte for byte.

**That run was an invalid experiment, and wave 0 proved it by doing the real
thing.** fontconfig-registered woff2 is not what Chromium matches for a CSS
`font-family`, so the page kept rendering in the fallback throughout run 2 —
the font was installed and unused. Replacing the `fonts.googleapis.com` import
with `@fontsource-variable` `@font-face` declarations takes the suite from
**11 failing files to 5**, stable across two full serialized runs, and moves
the sampled url-token width from 284 to 303 against a pinned 301. So the gate's
dependence on the network was not cosmetic: it was most of the failure.

What survives is narrower than §2.4 first claimed and still decides D21. Six
assertions remain red with the correct font loaded, and the residue is
rasterization and scrollbars, which no vendoring can remove: macOS CoreText and
Linux FreeType do not agree to the pixel, and a classic scrollbar takes ~16px
off a `clientWidth` that an overlay scrollbar does not. **A text-metric or
scrollbar-derived pixel value is still not portable.** It is simply that far
fewer assertions depended on one than the first measurement suggested.

Two further findings from running it, both about trusting instruments:

- **A wrong font import fails silently.** `@fontsource-variable` declares the
  family as `"Geist Variable"`, not `"Geist"`; a stack naming only the latter
  matches nothing and falls through to the system sans with no error. Verify a
  font by checking that its faces load and measure differently, not by reading
  the import.
- **A partial run does not look like a failure.** Docker gives `/dev/shm` 64MB
  by default, Chromium dies on it mid-suite, and vitest then reports only the
  files it reached — `2 failed | 31 passed (131)` reads as an improvement on
  `11 failed | 120 passed (131)`. `scripts/linux-gate.sh` now sets
  `--shm-size=1g`, serializes files so it survives a shared Docker VM, and
  exits 3 whenever fewer files ran than were discovered.

It also means the container is the only honest verification of this gate, and
one caveat travels with it: this host runs arm64 under colima, while
`ubuntu-latest` is amd64. It reproduces the failure _class_, not GitHub's exact
numbers. It is a fast pre-push check, not a substitute for CI.

### 2.5 Everything else, with counts

| area              | measured                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Production drift  | all 133 items served, **69 differ** from `main`'s build                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| Docs truth        | `README.md` says a 99-item catalog and "wave 0 ships 7 primitives"; `docs/design-system/README.md` carries four different totals (99 / 109 / 110 / 86+14), none of them 116; `CONTINUE.md` §1 is dated 2026-08-15 and names PR #29 while its own body runs to 2026-09-06 and HEAD is PR #45; §5.7 and §5.8 contradict §1; `CLAUDE.md:102` still claims the sibling repo has no token-gate equivalent                                                                                                                            |
| Hook bug          | `.claude/hooks/session-baselines.sh:26` — `grep -c` exits 1 on zero matches, so the `echo "?"` fallback also fires and every session start prints a stray `?` line                                                                                                                                                                                                                                                                                                                                                              |
| Ungated tooling   | `pnpm reconcile:deps` exits 1 today on 4 drifts, all documented intent or `files:`-bundled submodules, and runs in no gate; its `RELEVANT` regex never sees `npm:` deps such as recharts. `a11y:baseline` is referenced by no current doc. `gen-manifest.mts` is invoked by nothing                                                                                                                                                                                                                                             |
| Dead spec anchors | E9 `tts-composer` and E10 `voice-clone-recorder` carry `specAnchor` values pointing at headings that have never existed; nothing resolves an anchor                                                                                                                                                                                                                                                                                                                                                                             |
| Storybook lint    | `apps/storybook`'s lint script is `echo "no lint"`, so 221 story files, roughly 83,000 lines, are never linted                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Prettier          | **630 files** are not prettier-clean. The hook denies a repo-wide format on the grounds that `check-contract.mts:189`'s guidance regexes do not survive re-wrapping. **Measured, and false:** formatting all 531 source files leaves `check:tokens`, `lint` and `typecheck` green, because `\s*` spans newlines and prettier never splits a string literal. The only breakage is that prettier reformats the two files `gen-wiring.mts` emits, so they stop byte-matching their generator. Prettier-ignoring those two fixes it |
| Duplication       | `EMBEDDABLE_SHELL` and `SIDEBAR_FILLS_SHELL` byte-identical in 5 shells each; `usePrefersReducedMotion` copied into 4 marketing files; `matchesQuery`, `formatTimecode`, `clamp` and `initials` each defined 3 times with differing signatures; 18 duplicated names across 36 files                                                                                                                                                                                                                                             |
| RTL               | 44 files use physical-direction utilities, against 35 already on logical ones                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Motion            | 25 files carry `animate-`/`transition-` with no reduced-motion branch, against 53 that have one. Only one is a keyframe animation: `generation-queue.tsx:117`                                                                                                                                                                                                                                                                                                                                                                   |
| Keys              | 19 index-key sites, of which 5 key consumer-supplied arrays                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Keyboard          | 3 components ship Tab-per-item with a TODO for the APG roving-tabIndex pattern: `choice-chips`, `preset-grid`, `gen-settings-bar`                                                                                                                                                                                                                                                                                                                                                                                               |
| Strings           | 29 files ship literal `aria-label` text, 6 ship literal placeholders                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| Dependencies      | `@xyflow/react` plus 14 vendored files exist only for the D9-cut node-builder family; `apps/storybook`'s `tsx` and `date-fns` are unreferenced; `@types/node@20` against Node 24 in `.nvmrc` and CI; `tools/ds-architecture` sits outside the workspace globs so its own tests cannot run                                                                                                                                                                                                                                       |

Clean, and worth recording as clean: no `any`, no `@ts-ignore`, no skipped or
`.only` tests, no raw colour literals in registry source, no render-time global
access, no `Math.random`/`Date.now` id generation, and 133 of 133 test files
assert.

## 3. Decisions

Three were taken with Nick on 2026-09-06. The two that change component or story
contracts want decision records; `decisions.md` ends at D20, and the
2026-09-04 ladder review earmarked a D21 for its stage 08 — **confirm the number
is free before writing, and take the next two if it is not.**

### D21 · A case story may pin a number its own classes dictate, never one the browser derives

Two kinds of number appear in these stories and only one of them travels.

**Dictated, and still pinnable.** A computed style that a Tailwind class sets —
`minHeight` of `"56px"`, `paddingLeft` of `"10px"` — a width the class fixes, such
as `modality-rail`'s 92, or a viewport the test itself moved, such as
`window.innerWidth` after `page.viewport(375, 812)`. These are the component's own
declarations read back. They are stable everywhere and pinning them is the point.

**Derived, and never pinnable.** Anything the browser computes from text: an
intrinsic button width, a `scrollWidth` over ellipsised text, the box of a
content-sized token. Anything a scrollbar participates in: the `clientWidth` of a
scrollable container, and every relationship that then depends on it.

**Why:** §2.4 measured the same three values four ways across three machines,
and installing the missing font changed nothing. The precision was never real.

**The half that matters most is the second one.** Several of the eleven failures
are _already_ relationship assertions — `scrollWidth` equal to `clientWidth`, a
verb `inside=true`, `bpm visible: true` — and they fail because a 16px scrollbar
moved the container underneath them. So converting absolute pins to relationships
is necessary and **not sufficient**: a relationship anchored to a derived
quantity is just as unportable. Where a scrollbar is the variable, the assertion
has to be rewritten to measure something the scrollbar does not move, or the
story has to stop asserting it.

This is a change to `story-conventions.md`, which is what stops wave 3
reintroducing the problem, and it is why wave 0's conversion is done per site
with a measurement rather than by pattern-matching on `toBe`.

### D22 · Registry components ship English strings; a labels API is deferred

29 components hardcode `aria-label` text and 6 hardcode placeholders. Giving all
of them a labels prop is a public API change across already-published items, and
nobody has asked for translation. Record the position, document it, and revisit
when a consumer needs it.

**Why:** an unspecced prop shape shipped across 29 published components cannot
easily be walked back, and the registry has no deprecation mechanism.

### Execution · fan out per wave

One agent per item in its own git worktree, with the manifest prepared centrally
and integration done centrally, exactly as the last eight waves ran. The two
standing traps apply and are not restated in agent prompts: check the worktree's
base commit, and **commit before dispatching.**

## 4. The four waves

Each wave states its exit gate. A wave is not done because its diff looks right.

### Wave 0 — unblock CI

**Nothing else in this program can be verified until this is green**, because the
consumer test sits behind the failing step.

Five steps, in order, because each moves what the next measures:

1. **Make the container run a one-command script.** Every measurement from here
   is taken in `mcr.microsoft.com/playwright:v1.60.0-noble`, never on the host.
   This is step one rather than step three because nothing after it can be
   judged from a Mac.
2. **Align the dependency graph.** One Tailwind version, one Vite major
   (`@vitejs/plugin-react` to `^6`), `@types/node` to 24 to match `.nvmrc` and
   CI. Drop `apps/storybook`'s unreferenced `tsx` and `date-fns`. Remove
   `@xyflow/react` and its 14 vendored files, which serve only the D9-cut family
   and are excluded from the a11y gate. Bring `tools/ds-architecture` inside the
   workspace globs or record why it stays out. Re-run the container and record
   the new failure set before touching a single story: Tailwind emits the CSS
   these assertions measure, so this step can move them.
3. **Self-host the fonts.** Replace the `fonts.googleapis.com` import at
   `apps/storybook/src/index.css:4` with a vendored Geist. §2.4 records what this
   actually does: **11 failing files to 5**. It is the single largest fix in the
   wave, and the earlier claim that it changes nothing came from an invalid
   experiment. Verify the family loads rather than assuming the import resolved.
4. **Convert the assertions**, per D21, in the 58 files that carry a derived
   pixel value — including the ones already written as relationships, which fail
   for the scrollbar reason and need re-anchoring rather than re-phrasing. Fanned
   out roughly eight ways by family. Each agent works against the container, and
   watches each rewritten assertion fail on a deliberately broken value before
   keeping it.
5. **Write D21 into `story-conventions.md`** and add the container script to the
   documented pre-push routine, so the next Mac-authored story is measured on
   Linux before it lands.

**Exit gate:** all eleven CI steps green on GitHub, and the same eleven green in
the Linux container locally. The consumer install test running at all is the
signal that matters.

### Wave 1 — deploy

Production serves 133 items and 69 of them differ from `main`. Every source fix
the case-story program produced is undeployed.

**This needs the `weeeha` GitHub account and cannot be done for you.** The only
account in `gh auth` is a work account, which has `push: false` on this repo.
Deploys are manual from `apps/docs` and nothing ships on merge.

**Exit gate:** a fetched registry item matches the local build byte for byte, and
the preview link is in hand.

### Wave 2 — gates and truth

Four independent items plus D22's paperwork. All touch docs, config or scripts
rather than registry sources, so they parallelize cleanly against each other but
must be ordered against wave 3.

- **Docs truth pass.** `README.md`, `docs/design-system/README.md`,
  `CONTINUE.md` §1/§5.7/§5.8, `CLAUDE.md:102`, and the
  `session-baselines.sh:26` `grep -c` bug. At 2,723 lines `CONTINUE.md` should
  lose its per-wave ledgers to a separate history file, or it rots again the
  same way.
- **Harden the ungated tooling.** Teach `reconcile-deps.mts` the manifest's
  `files` field so its four current drifts resolve honestly, extend it to `npm:`
  deps, and chain it into `check:contract`. Resolve `specAnchor` values so E9 and
  E10's dead links fail rather than sit. Decide whether `gen-manifest.mts`
  survives.
- **Turn on Storybook lint.** Replace `echo "no lint"` with a real eslint config.
  Expect findings across 221 files; this is why it follows wave 0, which is
  rewriting 58 of them.
- **Prettier, last in the wave.** Prettier-ignore the two `gen-wiring.mts`
  outputs, format the 630 files in one commit that changes nothing else, retire
  the hook's denial, and add `format:check` to CI. The prerequisite this bullet
  used to carry — rewriting the guidance matching — does not exist: §2.5 records
  the measurement.

**Exit gate:** `pnpm format:check` clean, `check:contract` green with the new
rules, root `pnpm lint` covering storybook, and all **twelve** CI steps green
once `format:check` joins them.

### Wave 3 — registry sweeps

The only wave that touches shipped component source, and the natural fan-out.
Absorbs the six items the case-story handoff left open.

- Promote the duplicated helpers. `EMBEDDABLE_SHELL` and `SIDEBAR_FILLS_SHELL`
  are the clearest: byte-identical in five shells. `usePrefersReducedMotion`,
  `matchesQuery`, `formatTimecode`, `clamp` and `initials` follow. Note the
  manifest is the one shared file and only the integrator writes it.
- Physical-direction utilities to logical, in the 44 files that still use them,
  minus the timeline and calendar pixel canvases where they are deliberate.
- Reduced-motion branches for the 25 unguarded files, starting with
  `generation-queue.tsx:117`, the only keyframe animation among them.
- Stable keys at the five sites that key consumer-supplied arrays.
- Roving tabIndex for `choice-chips`, `preset-grid` and `gen-settings-bar`.
- The handoff's six: `hover-card.tsx`'s missing branch, `model-picker`'s unnamed
  listbox, the vendored sidebar's RTL mirroring, the tooltip that eats an
  Escape, the `matchesQuery` divergence, and the notebook chat pane's scroll
  container.

**Exit gate:** all eleven CI steps green, and the storybook suite run once from a
cleared cache with the 6007 dev server down.

## 5. Out of scope, deliberately

- **Single-source tokens**, the 2026-09-04 ladder review's task 2. Already
  classified architectural, forces the deferred `--warning` value decision, and
  wants its own brainstorm.
- The `ds-open-problems` deferred items: aria claim proof, the pitfalls' positive
  tails, a palette-derived contrast floor.
- Family P re-sampling, and D12's warning that J, K and N are not closed.
- Ten registry source files have no sibling test, mostly the `data-views`
  family, which `data-views.test.tsx` covers indirectly. Recorded, not scheduled.

## 6. Risks

- **Wave 0 step 1 can itself move pixels.** Aligning Tailwind is the point, but
  it means the storybook suite may fail differently before step 4 starts. Run the
  suite in the container after step 1 and record the new failure set before
  converting anything.
- **Deleting `@xyflow/react` removes 14 vendored files.** Recoverable from git,
  and D9 cut the family they serve, but say so in the PR body.
- **Prettier's 630-file commit will conflict with any concurrent source work.**
  It is scheduled last inside wave 2 for that reason, and wave 3 must not start
  until it lands.
- **Wave 3's helper promotion changes the manifest**, which no agent may write.
  The integrator prepares it centrally before dispatch, as in every prior wave.
