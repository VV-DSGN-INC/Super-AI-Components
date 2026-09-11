# Super-AI-Components — architecture/code review and agent handoff

Review snapshot: **10 September 2026**. Baseline: `fa9924651b2f40ad9fe1a35b38096b254d82d932` on `feat/storybook-component-showcase`.

A pnpm/Turbo workspace with a Next.js documentation app, a nine-item shadcn registry, and a separate Storybook app. Preserve catalog-derived registry generation and consumer verification. Fix API compatibility and duplicated component ownership before growing the catalog.

## Re-verification against `main`, 2026-09-11 — read this first

**The baseline above is stale by 458 commits.** `fa99246` is the 2026-06-30
commit `feat(storybook): add Storybook workspace showcasing all shadcn + AI
Elements`. It is an ancestor of `main`, not a fork, so everything it describes
has since been built on top of. At that commit the registry held **18** `.tsx`
files under `apps/docs/registry/super-ai/`; `main` holds **248**. Every count in
this document — "a nine-item shadcn registry", "all nine registry components",
"60 UI component files and 30 AI Elements files" — describes June, and the
repairs it proposes are sized for a repo roughly one-fourteenth the current one.

Two findings were fixed in those 458 commits. Two were real, still open, and
already recorded in `docs/CONTINUE.md` before this review was written. One was
real, new, and is now fixed. The re-verification was done by reading `main`; the
gate results below were run on `main` plus the SAI-05 fix.

| ID     | Status on `main` (2026-09-11)                                                                                                                                                                                                                                                               |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SAI-01 | **Fixed.** `apps/storybook/src/components/ai-elements/context.tsx` reads `usage?.outputTokenDetails.reasoningTokens` (line 268) and `usage?.inputTokenDetails.cacheReadTokens` (line 301) — the SDK 7 shape this finding asked for.                                                         |
| SAI-02 | **Open, and already tracked.** `shortcuts-sheet.tsx` still passes `DialogTrigger render=`, the README still says "Install (any shadcn app)". `CONTINUE.md` §5 records it as an open architectural question: no registry mechanism expresses "…but adapted".                                 |
| SAI-03 | **Fixed.** `apps/storybook/src/components/super-ai/` is empty — the eighteen duplicate copies are gone. Storybook's `package.json` now defines `lint`, `typecheck` and `test:stories`, and depends on `@storybook/addon-a11y`, against the no-op lint and missing addon this finding found. |
| SAI-04 | **Open, and already tracked.** `choice-chips.tsx` line 55 still carries the TODO. `CONTINUE.md` §8 records roving tabIndex for `choice-chips` / `preset-grid` / `gen-settings-bar` as a deliberate deferral, with the RTL, wraparound and disabled-item reasoning.                          |
| SAI-05 | **Fixed 2026-09-11**, this branch. See below.                                                                                                                                                                                                                                               |

SAI-05 was the one finding worth the review's price. The fix and its reasoning
are recorded in `CONTINUE.md` §8; briefly, `thread-list` was the only one of the
registry's four `AlertDialogAction` call sites that owned its dialog state
privately. `trust-dialog` and `permission-prompt` take `open`/`onOpenChange` and
hand the lifecycle to the consumer; `voice-clone-recorder` hardcodes `open` and
relies on the parent unmounting it. In those three, an action that does not close
is correct. In `thread-list` nothing else could close it.

Two corrections to this document's own method, for whoever reads it next:

1. **Its verification checklist omits the three gates that matter.** It lists
   `typecheck`, `lint`, `check:tokens`, `test`, `build:registry` and `build`, but
   not the Playwright smoke, the Storybook a11y run, or the consumer install
   test — which `CLAUDE.md` names as the three steps that actually exercise the
   product, and which CI runs last so any earlier failure hides them. The
   corrected list is in "Verification for the next agent" below.
2. **Its baseline verification is stale twice over.** "Failed with 18 Storybook
   diagnostics" and "Storybook only printed `no lint`" were true in June;
   `d05e029` lints 221 story files that had never been linted.

The spec and plan linked below inherit the nine-item framing and should be
re-scoped before anyone executes them.

### What the 2026-09-11 re-scan covered, and what it did not

Re-running the five findings at 248 files would only re-test the five. What was
actually worth doing was checking each finding's **class** across the current
registry, on the theory that a defect found once is usually a defect found
several times. Three classes were swept; all three came back clean apart from
the one fix.

- **The SAI-05 shape** — a dialog whose open state is private, driven by an
  action that closes nothing. All four `AlertDialogAction` call sites in the
  registry were read. `trust-dialog` and `permission-prompt` expose
  `open`/`onOpenChange`; `voice-clone-recorder` hardcodes `open` and is
  unmounted by its parent. `thread-list` was the only one with neither, and is
  fixed. No second instance.
- **The SAI-01 shape** — usage fields read at a path the installed SDK no longer
  uses. Every `usage.*` access under `apps/storybook/src/components/ai-elements/`
  now resolves to `outputTokenDetails` / `inputTokenDetails` or to a top-level
  field that still exists. No stale reads left.
- **Gate baselines** — `a11y-exclusions.baseline.json` (5 entries) and
  `story-coverage.baseline.json` are byte-identical to `main`. Neither grew,
  which is the rule that matters: adding a file to silence a failure defeats the
  gate.

Not covered, and not claimed: a fresh `shadcn add` into a Radix consumer
(SAI-02's actual reproduction), the deployed pages, other browsers, and the
sibling worktrees. SAI-02 is unchanged and stays open on the strength of the
original review's evidence plus the unchanged source, not a new reproduction.

## Detailed update documents

- [Shared registry and API contracts specification](docs/superpowers/specs/2026-09-10-shared-registry-and-api-contracts-design.md) defines the proposed behavior, architecture, compatibility and acceptance criteria.
- [Shared registry and API contracts implementation plan](docs/superpowers/plans/2026-09-10-shared-registry-and-api-contracts.md) breaks the specification into ordered, testable tasks for a future agent.

These are proposed updates, not implemented repairs. This review and its evidence remain the historical baseline.

## How to use this document

This is a self-contained handoff for a future agent. No previous conversation or sibling project review is required to understand the findings. All findings refer to the baseline above; their status is **open at that revision**, not a claim about a later checkout.

Before acting, read the repository's current `AGENTS.md`/`CLAUDE.md`, record the current branch/revision and working-tree state, and compare each cited implementation with the reviewed baseline. Reproduce relevant findings on the intended checkout. Other worktrees may already contain repairs; do not blindly duplicate or overwrite them. Keep the current user's assignment as the authority for implementation scope.

The review itself made no product-source changes. The checkout had one existing untracked document: `docs/superpowers/plans/2026-09-06-case-story-handoff.md`. It was preserved. This follow-up adds only this document and evidence snapshots. No fixes, commits, or publication are implied by writing the handoff.

Paths and links inside this file are repository-relative so the document travels with the project. Line numbers describe the reviewed revision and may move. Original logs/probe snapshots may contain historical absolute machine paths; port examples to the current checkout before execution.

## Baseline verification

| Check                                    | Recorded result                                                                             |
| ---------------------------------------- | ------------------------------------------------------------------------------------------- |
| `pnpm typecheck`                         | Failed with 18 Storybook diagnostics; docs typecheck passed                                 |
| `pnpm lint`                              | Command passed; Storybook only printed `no lint`                                            |
| `pnpm check:tokens`                      | Nine docs registry files checked; extra Storybook library excluded                          |
| `pnpm test`                              | 28 tests passed across nine docs registry test files                                        |
| Focused interaction probes               | Two desired-behavior assertions failed: radio arrow navigation and delete-dialog completion |
| Composition with existing Radix wrappers | Four TypeScript diagnostics after unifying React types; not a fresh registry install        |

Local runtime: Node v26.0.0. CI specifies Node 24. No dependencies were installed or upgraded during the review. Results were recorded in the original review; packaging this handoff did not rerun those suites.

Production builds, fresh registry installation, deployed pages, the full Storybook browser surface, other browsers, and every nested worktree were not verified. The Radix result is a local composition check using wrappers from Minimal Design System; the copied log is evidence, not a standalone installer.

## Findings index

| ID     | Priority | Finding                                                                    | Status at baseline `fa99246` | Status on `main` 2026-09-11                   |
| ------ | -------- | -------------------------------------------------------------------------- | ---------------------------- | --------------------------------------------- |
| SAI-01 | P1       | Super AI's Storybook API migrations are incomplete                         | Open at reviewed baseline    | **Fixed** before this review was written      |
| SAI-02 | P2       | Super AI's registry is incompatible with a Radix-based consumer            | Open at reviewed baseline    | **Open**, already tracked in `CONTINUE.md` §5 |
| SAI-03 | P2       | Super AI maintains duplicate components under unequal checks               | Open at reviewed baseline    | **Fixed** before this review was written      |
| SAI-04 | P2       | Super AI's radio chips omit radio keyboard behavior                        | Open at reviewed baseline    | **Open**, already tracked in `CONTINUE.md` §8 |
| SAI-05 | P2       | Super AI's delete confirmation does not finish while its row stays mounted | Open at reviewed baseline    | **Fixed 2026-09-11**                          |

P1 means address before relying on the affected release/behavior. P2 means a concrete repair or architecture gap to schedule. Severity does not imply every consuming application triggers the issue. Reproduced defects, static contract gaps, and incomplete coverage are qualified in the findings below.

### SAI-01 — P1 — Super AI's Storybook API migrations are incomplete

The workspace declares AI SDK 7, but its Context components read top-level `usage.reasoningTokens` and `usage.cachedInputTokens`. The installed SDK puts these under `outputTokenDetails.reasoningTokens` and `inputTokenDetails.cacheReadTokens`. These accesses fail typechecking and would hide nonzero usage as absent if rendered without the type gate.

Other errors include Radix-style HoverCard delay props passed to Base UI, incompatible composed trigger props, obsolete `@ts-expect-error` directives, and a link shim type error. This is an integration problem spanning adapters, not just suppressions to remove.

Evidence: [declared SDK](apps/storybook/package.json) (reviewed line 18), [reasoning usage](apps/storybook/src/components/ai-elements/context.tsx) (reviewed line 319), [cache usage](apps/storybook/src/components/ai-elements/context.tsx) (reviewed line 359), [typecheck output](reviews/2026-09-10/evidence/super-checks-2026-09-10.log.txt).

**Repair:** select and document a supported dependency/API combination, then finish its adapters. Use the installed SDK types as the contract and exercise representative nonzero usage data.

**Acceptance:** the entire workspace typechecks; actual SDK-shaped usage displays correctly; hover, disclosure, and link behaviors work in Storybook.

### SAI-02 — P2 — Super AI's registry is incompatible with a Radix-based consumer

The README offers installation into “any shadcn app.” However, `ShortcutsSheet` requires `DialogTrigger render`, and `ThreadList` requires `DropdownMenu onOpenChangeComplete` and `DropdownMenuTrigger render`. Those are Base UI wrapper contracts. Registry dependencies are bare names such as `dialog` and `dropdown-menu`, so the local Base UI wrappers are not included by these entries.

Composing the unchanged registry components with Minimal's existing Radix wrappers produced the expected missing-prop errors. React type duplication in the initial probe was removed before recording the final four diagnostics.

Evidence: [registry dependencies](apps/docs/scripts/gen-registry.mts) (reviewed line 31), [trigger requirement](apps/docs/registry/super-ai/shortcuts-sheet.tsx) (reviewed line 42), [composition result](reviews/2026-09-10/evidence/super-ai-radix-consumer.log.txt). Bare registry names identify built-in shadcn items; they do not bundle a project's own wrappers. [Official registry specification](https://ui.shadcn.com/docs/registry/registry-item-json).

**Repair:** explicitly support a Base UI consumer contract, or provide separate adapters for both bases. Verify the advertised consumer configurations; do not infer compatibility from the docs app working locally.

### SAI-03 — P2 — Super AI maintains duplicate components under unequal checks

All nine `apps/docs/registry/super-ai/*.tsx` component implementations are byte-identical to separate files under `apps/storybook/src/components/super-ai/`. Storybook imports its copies. A fix in the tested registry therefore need not reach the showcased component.

Storybook additionally contains 60 UI component files and 30 AI Elements files. Its lint script is a no-op; it defines no test or token-check task, and its Storybook configuration includes docs but no accessibility test addon. Root Turbo commands can succeed while excluding this code from those checks.

Evidence: [Storybook scripts](apps/storybook/package.json) (reviewed line 6), [registry test scope](apps/docs/vitest.config.ts) (reviewed line 12), [Storybook source import](apps/storybook/src/stories/super-ai/ThreadList.stories.tsx) (reviewed line 3).

**Repair:** make docs, registry emission, and Storybook consume one authored implementation, with explicit adapters where bases differ. Give every supported component surface real lint, type, behavior, and rendered checks. An interim copy-parity check can detect drift, but shared source removes the duplication.

### SAI-04 — P2 — Super AI's radio chips omit radio keyboard behavior

`ChoiceChips` declares a radio group and its children declare radios, but the component implements only clicks. A focused ArrowRight probe produced no selection callback. Every chip remains a separate tab stop. The source acknowledges this as a deferred TODO.

Evidence: [radio implementation](apps/docs/registry/super-ai/choice-chips.tsx) (reviewed line 53), [probe](reviews/2026-09-10/evidence/super-ai-behavior-probes.log.txt). The [W3C radio-group pattern](https://www.w3.org/WAI/ARIA/apg/patterns/radio/) defines arrow navigation and selection for ordinary radio groups.

**Repair:** use a radio-group primitive or implement the complete focus/keyboard contract, including disabled options and wraparound. Click-only tests cannot prove this behavior.

### SAI-05 — P2 — Super AI's delete confirmation does not finish while its row stays mounted

`AlertDialogAction` is a plain Button. Clicking Delete calls `onDelete`, but never changes the controlled `confirmingDelete` state. The dialog remains open after the callback, including after waiting for completion. If the consumer keeps the row mounted while persisting a deletion, the action stays available for repeated submission. Consumers that immediately unmount the row conceal this problem.

Evidence: [controlled dialog and action](apps/docs/registry/super-ai/thread-list.tsx) (reviewed line 185), [plain action wrapper](apps/docs/components/ui/alert-dialog.tsx) (reviewed line 125), [probe](reviews/2026-09-10/evidence/super-ai-behavior-probes.log.txt).

**Repair:** define completion and pending behavior. Either close on synchronous dispatch or expose a pending/success/error contract that prevents repeated actions and retains useful failure feedback.

**Resolved 2026-09-11 — closed on synchronous dispatch, the first of the two
options.** The action now clears `confirmingDelete` before calling `onDelete`.
The pending/error contract was not built: it would add public API to a shipped
registry component, and no consumer has asked for it. If one needs the row to
survive a failed delete, the answer is to lift the state, and that is recorded
in the source comment.

Reproduced on `main` before fixing, by reading the four `AlertDialogAction` call
sites in the registry rather than only this one — which is what turned the
finding from a defect into a rule. The same "action closes nothing" shape is
**correct** in `trust-dialog` and `permission-prompt`, which take
`open`/`onOpenChange` and hand the lifecycle to the consumer, and in
`voice-clone-recorder`, which hardcodes `open` and lets the parent unmount it.
`thread-list` was the only call site that owned the state privately, so it was
the only one where nothing could close it.

Two things this finding got right that are worth keeping. First, its "consumers
that immediately unmount the row conceal this problem" is exactly why the
existing test suite missed it — the pre-existing `delete requires confirmation,
then fires onDelete` test asserts the callback and stops. The regression test
added alongside the fix keeps the row mounted on purpose. Second, the probe was
run against unchanged code and failed, which is the only reason this was
distinguishable from the three call sites where the same shape is intentional.

One mechanical detail for whoever touches this next: assert the **dialog** is
gone before asserting the row is reachable. Base UI marks the page inert behind
an open modal, so a regression fails both assertions, and the row one names the
wrong cause. Focus after confirming now returns to the row's actions button,
the same as cancelling; `thread-list.docs.tsx` records what that means for a
consumer that removes the row.

## Architecture and existing debt

- `apps/docs/registry/super-ai/` contains the nine registry components and their behavior tests. `apps/docs/lib/catalog` supplies the registry catalog; `apps/docs/scripts/gen-registry.mts` emits its definition.
- `apps/docs/components/ui/` supplies Base UI wrappers to the local documentation app.
- `apps/storybook/src/components/super-ai/` contains separate copies of all nine registry implementations; they were byte-identical at the reviewed revision. Storybook imports its own copies.
- Storybook also holds 60 UI component files and 30 AI Elements files. Its lint task is a no-op and it defines no test or token-check task.
- A root Turbo command can succeed while only the docs registry was checked. Keep validation scope visible.

Recommended target: one authored implementation per component, consumed by docs, Storybook, and registry generation. Keep any required Radix/Base UI adapters explicit. A copy-parity check can be transitional; shared source removes the duplication. This proposal does not require merging repositories or replacing all primitives.

## Suggested repair sequence

1. Reproduce SAI-01 with installed dependencies and inspect the actual AI SDK and Base UI types. Choose a supported API combination, then complete adapters rather than hiding errors.
2. Resolve SAI-02 by documenting/supporting the intended consumer base or implementing separate adapters. Test every advertised consumer configuration.
3. Fix radio keyboard behavior and define delete pending/completion behavior (SAI-04 and SAI-05), with focused tests.
4. Remove duplicate ownership (SAI-03) and make docs, Storybook, and registry emission consume one source. Add meaningful checks for the additional Storybook component surfaces.
5. Run consumer installation and rendered verification after the affected contracts are coherent. Inspect scripts before running them: the existing consumer script rebuilds the local registry and scaffolds a temporary app.

## Verification for the next agent

Run applicable checks from the repository root, adapting only after inspecting the current scripts. Preserve their real exit statuses. Commands below are a repair verification checklist, not a claim that all were executed in the original review.

Run these from the repository root, in `ci.yml`'s order. CI stops at the first
failure, so one red gate hides every gate behind it — and the last three are the
ones that actually exercise the product.

```sh
pnpm lint
pnpm format:check
pnpm typecheck
pnpm check:tokens
pnpm check:contract
pnpm test
pnpm build:registry
pnpm build
```

Then the three this document originally omitted. Rebuild before the smoke run:
`playwright.config.ts` runs `pnpm start`, and `next start` serves the _prebuilt_
output, so editing source without rebuilding tests a stale app.

```sh
cd apps/docs && pnpm exec playwright test
cd apps/storybook && pnpm test:stories
./scripts/linux-gate.sh
apps/docs/scripts/consumer-test.sh
```

- Both apps typecheck with the declared dependencies; real nonzero SDK-shaped reasoning and cache usage render correctly.
- The registry installs and composes in each advertised consumer configuration. Prove supported bases rather than relying only on the docs app.
- Arrow keys, tab entry/exit, disabled choices, and wraparound follow the chosen radio-group contract.
- A confirmed deletion has defined success/pending/error behavior and cannot be submitted repeatedly while pending.
- Docs and Storybook demonstrate the same authored registry implementations; meaningful checks cover every supported surface.
- Use the repository's browser and consumer checks where relevant: `pnpm --filter docs exec playwright test` and `apps/docs/scripts/consumer-test.sh`. Inspect their current configuration and preserve existing work/output.
- Report exact commands, exit statuses, coverage, consumer setup, and remaining errors. A no-op lint task or skipped workspace is not validation.

## Evidence bundled with this handoff

- [super-checks-2026-09-10.log](reviews/2026-09-10/evidence/super-checks-2026-09-10.log.txt)
- [super-ai-behavior-probes.log](reviews/2026-09-10/evidence/super-ai-behavior-probes.log.txt)
- [super-ai-radix-consumer.log](reviews/2026-09-10/evidence/super-ai-radix-consumer.log.txt)
- [super-ai-behavior-probes.test.tsx](reviews/2026-09-10/evidence/super-ai-behavior-probes.test.tsx.txt)

[Evidence manifest](reviews/2026-09-10/evidence/manifest.json) records the baseline and SHA-256 hashes. Logs and probe sources have `.txt` suffixes so they remain review records and are not accidentally discovered as source tests or lint inputs. The focused behavior probes intentionally failed expected-behavior assertions against unchanged code. Treat them as reproduction examples, not passing regression tests or already-installed test coverage.

## Expected repair handoff

For each finding you handle, report the finding ID, reproduction result on the current revision, root cause, change made, verification command and outcome, and any residual limitation. If a finding is already fixed or does not apply to the intended supported contract, cite the source/test evidence and mark that status explicitly. Keep open design choices separate from automatic checks. Avoid closing a finding based only on a clean build, a renamed exemption, or an unrelated passing test.
