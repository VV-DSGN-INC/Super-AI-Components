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

### 2.3 The dependency graph moves the pixels

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

Pinning measurements before aligning these means pinning them twice.

### 2.4 Everything else, with counts

| area              | measured                                                                                                                                                                                                                                                                                                                                                                                             |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Production drift  | all 133 items served, **69 differ** from `main`'s build                                                                                                                                                                                                                                                                                                                                              |
| Docs truth        | `README.md` says a 99-item catalog and "wave 0 ships 7 primitives"; `docs/design-system/README.md` carries four different totals (99 / 109 / 110 / 86+14), none of them 116; `CONTINUE.md` §1 is dated 2026-08-15 and names PR #29 while its own body runs to 2026-09-06 and HEAD is PR #45; §5.7 and §5.8 contradict §1; `CLAUDE.md:102` still claims the sibling repo has no token-gate equivalent |
| Hook bug          | `.claude/hooks/session-baselines.sh:26` — `grep -c` exits 1 on zero matches, so the `echo "?"` fallback also fires and every session start prints a stray `?` line                                                                                                                                                                                                                                   |
| Ungated tooling   | `pnpm reconcile:deps` exits 1 today on 4 drifts, all documented intent or `files:`-bundled submodules, and runs in no gate; its `RELEVANT` regex never sees `npm:` deps such as recharts. `a11y:baseline` is referenced by no current doc. `gen-manifest.mts` is invoked by nothing                                                                                                                  |
| Dead spec anchors | E9 `tts-composer` and E10 `voice-clone-recorder` carry `specAnchor` values pointing at headings that have never existed; nothing resolves an anchor                                                                                                                                                                                                                                                  |
| Storybook lint    | `apps/storybook`'s lint script is `echo "no lint"`, so 221 story files, roughly 83,000 lines, are never linted                                                                                                                                                                                                                                                                                       |
| Prettier          | **630 files** are not prettier-clean. The repo-wide format is hook-denied because `check-contract.mts:189` matches guidance fields with a single-line quoted-string regex that re-wrapping breaks                                                                                                                                                                                                    |
| Duplication       | `EMBEDDABLE_SHELL` and `SIDEBAR_FILLS_SHELL` byte-identical in 5 shells each; `usePrefersReducedMotion` copied into 4 marketing files; `matchesQuery`, `formatTimecode`, `clamp` and `initials` each defined 3 times with differing signatures; 18 duplicated names across 36 files                                                                                                                  |
| RTL               | 44 files use physical-direction utilities, against 35 already on logical ones                                                                                                                                                                                                                                                                                                                        |
| Motion            | 25 files carry `animate-`/`transition-` with no reduced-motion branch, against 53 that have one. Only one is a keyframe animation: `generation-queue.tsx:117`                                                                                                                                                                                                                                        |
| Keys              | 19 index-key sites, of which 5 key consumer-supplied arrays                                                                                                                                                                                                                                                                                                                                          |
| Keyboard          | 3 components ship Tab-per-item with a TODO for the APG roving-tabIndex pattern: `choice-chips`, `preset-grid`, `gen-settings-bar`                                                                                                                                                                                                                                                                    |
| Strings           | 29 files ship literal `aria-label` text, 6 ship literal placeholders                                                                                                                                                                                                                                                                                                                                 |
| Dependencies      | `@xyflow/react` plus 14 vendored files exist only for the D9-cut node-builder family; `apps/storybook`'s `tsx` and `date-fns` are unreferenced; `@types/node@20` against Node 24 in `.nvmrc` and CI; `tools/ds-architecture` sits outside the workspace globs so its own tests cannot run                                                                                                            |

Clean, and worth recording as clean: no `any`, no `@ts-ignore`, no skipped or
`.only` tests, no raw colour literals in registry source, no render-time global
access, no `Math.random`/`Date.now` id generation, and 133 of 133 test files
assert.

## 3. Decisions

Three were taken with Nick on 2026-09-06. The two that change component or story
contracts want decision records; `decisions.md` ends at D20, and the
2026-09-04 ladder review earmarked a D21 for its stage 08 — **confirm the number
is free before writing, and take the next two if it is not.**

### D21 · A case story asserts relationships, never absolute pixels

The 173 absolute pins become the greater/less/`toBeCloseTo` idioms the suite
already uses more than 500 times. A story may assert that a label is clipped,
that one edge precedes another, that a value sits inside a tolerance. It may not
assert that something is 73 pixels wide.

**Why:** an absolute pixel value encodes the authoring machine's fonts and
scrollbars, and this repo authors on macOS and gates on Linux. The precision was
never real. The cost is a small loss of specificity where a number was genuinely
the point, which §4's wave 0 handles case by case rather than mechanically.

This is a change to `story-conventions.md`, which is what stops wave 3
reintroducing the problem.

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

Four steps, in order, because each moves what the next measures:

1. **Align the dependency graph.** One Tailwind version, one Vite major
   (`@vitejs/plugin-react` to `^6`), `@types/node` to 24 to match `.nvmrc` and
   CI. Drop `apps/storybook`'s unreferenced `tsx` and `date-fns`. Remove
   `@xyflow/react` and its 14 vendored files, which serve only the D9-cut family
   and are excluded from the a11y gate. Bring `tools/ds-architecture` inside the
   workspace globs or record why it stays out.
2. **Self-host the fonts.** Replace the `fonts.googleapis.com` import at
   `apps/storybook/src/index.css:4` with a vendored Geist, so the gate stops
   depending on the network and on runner font resolution.
3. **Establish the Linux reference locally.** `playwright@1.60.0` is what the
   lockfile resolves, so `mcr.microsoft.com/playwright:v1.60.0-noble` reproduces
   the runner. Docker runs on the build machine. Every measurement in step 4 is
   taken there, not on the host.
4. **Convert the pins.** 58 files, fanned out roughly eight ways by family. Each
   agent converts its files to D21's idiom and watches each rewritten assertion
   fail against a deliberately broken value before keeping it — the repo's
   existing record-don't-pin discipline, which is what makes a guard mean
   something.

Then write D21 into `story-conventions.md`.

**Exit gate:** all eleven CI steps green on GitHub, and the same eleven green in
the Linux container locally. The consumer install test running at all is the
signal that matters.

### Wave 1 — deploy

Production serves 133 items and 69 of them differ from `main`. Every source fix
the case-story program produced is undeployed.

**This needs the `weeeha` GitHub account and cannot be done for you.** The only
account in `gh auth` is `nickvpegbo`, which has `push: false` on this repo.
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
- **Prettier, last in the wave.** First make `check-contract.mts`'s guidance
  matching parse-based rather than a single-line regex, then reformat the 630
  files in one commit that changes nothing else, then remove the hook's denial.

**Exit gate:** `pnpm format:check` clean, `check:contract` green with the new
rules, root `pnpm lint` covering storybook, all eleven CI steps green.

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
