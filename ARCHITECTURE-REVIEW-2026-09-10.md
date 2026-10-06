# Super-AI-Components — architecture/code review and agent handoff

Review snapshot: **10 September 2026**. Baseline: `fa9924651b2f40ad9fe1a35b38096b254d82d932` on `feat/storybook-component-showcase`.

A pnpm/Turbo workspace with a Next.js documentation app, a nine-item shadcn registry, and a separate Storybook app. Preserve catalog-derived registry generation and consumer verification. Fix API compatibility and duplicated component ownership before growing the catalog.

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

| Check | Recorded result |
|---|---|
| `pnpm typecheck` | Failed with 18 Storybook diagnostics; docs typecheck passed |
| `pnpm lint` | Command passed; Storybook only printed `no lint` |
| `pnpm check:tokens` | Nine docs registry files checked; extra Storybook library excluded |
| `pnpm test` | 28 tests passed across nine docs registry test files |
| Focused interaction probes | Two desired-behavior assertions failed: radio arrow navigation and delete-dialog completion |
| Composition with existing Radix wrappers | Four TypeScript diagnostics after unifying React types; not a fresh registry install |

Local runtime: Node v26.0.0. CI specifies Node 24. No dependencies were installed or upgraded during the review. Results were recorded in the original review; packaging this handoff did not rerun those suites.

Production builds, fresh registry installation, deployed pages, the full Storybook browser surface, other browsers, and every nested worktree were not verified. The Radix result is a local composition check using wrappers from Minimal Design System; the copied log is evidence, not a standalone installer.

## Findings index

| ID | Priority | Finding | Status |
|---|---|---|---|
| SAI-01 | P1 | Super AI's Storybook API migrations are incomplete | Open at reviewed baseline |
| SAI-02 | P2 | Super AI's registry is incompatible with a Radix-based consumer | Open at reviewed baseline |
| SAI-03 | P2 | Super AI maintains duplicate components under unequal checks | Open at reviewed baseline |
| SAI-04 | P2 | Super AI's radio chips omit radio keyboard behavior | Open at reviewed baseline |
| SAI-05 | P2 | Super AI's delete confirmation does not finish while its row stays mounted | Open at reviewed baseline |

P1 means address before relying on the affected release/behavior. P2 means a concrete repair or architecture gap to schedule. Severity does not imply every consuming application triggers the issue. Reproduced defects, static contract gaps, and incomplete coverage are qualified in the findings below.

### SAI-01 — P1 — Super AI's Storybook API migrations are incomplete

The workspace declares AI SDK 7, but its Context components read top-level `usage.reasoningTokens` and `usage.cachedInputTokens`. The installed SDK puts these under `outputTokenDetails.reasoningTokens` and `inputTokenDetails.cacheReadTokens`. These accesses fail typechecking and would hide nonzero usage as absent if rendered without the type gate.

Other errors include Radix-style HoverCard delay props passed to Base UI, incompatible composed trigger props, obsolete `@ts-expect-error` directives, and a link shim type error. This is an integration problem spanning adapters, not just suppressions to remove.

Evidence: [declared SDK](<apps/storybook/package.json>) (reviewed line 18), [reasoning usage](<apps/storybook/src/components/ai-elements/context.tsx>) (reviewed line 319), [cache usage](<apps/storybook/src/components/ai-elements/context.tsx>) (reviewed line 359), [typecheck output](reviews/2026-09-10/evidence/super-checks-2026-09-10.log.txt).

**Repair:** select and document a supported dependency/API combination, then finish its adapters. Use the installed SDK types as the contract and exercise representative nonzero usage data.

**Acceptance:** the entire workspace typechecks; actual SDK-shaped usage displays correctly; hover, disclosure, and link behaviors work in Storybook.
### SAI-02 — P2 — Super AI's registry is incompatible with a Radix-based consumer

The README offers installation into “any shadcn app.” However, `ShortcutsSheet` requires `DialogTrigger render`, and `ThreadList` requires `DropdownMenu onOpenChangeComplete` and `DropdownMenuTrigger render`. Those are Base UI wrapper contracts. Registry dependencies are bare names such as `dialog` and `dropdown-menu`, so the local Base UI wrappers are not included by these entries.

Composing the unchanged registry components with Minimal's existing Radix wrappers produced the expected missing-prop errors. React type duplication in the initial probe was removed before recording the final four diagnostics.

Evidence: [registry dependencies](<apps/docs/scripts/gen-registry.mts>) (reviewed line 31), [trigger requirement](<apps/docs/registry/super-ai/shortcuts-sheet.tsx>) (reviewed line 42), [composition result](reviews/2026-09-10/evidence/super-ai-radix-consumer.log.txt). Bare registry names identify built-in shadcn items; they do not bundle a project's own wrappers. [Official registry specification](https://ui.shadcn.com/docs/registry/registry-item-json).

**Repair:** explicitly support a Base UI consumer contract, or provide separate adapters for both bases. Verify the advertised consumer configurations; do not infer compatibility from the docs app working locally.
### SAI-03 — P2 — Super AI maintains duplicate components under unequal checks

All nine `apps/docs/registry/super-ai/*.tsx` component implementations are byte-identical to separate files under `apps/storybook/src/components/super-ai/`. Storybook imports its copies. A fix in the tested registry therefore need not reach the showcased component.

Storybook additionally contains 60 UI component files and 30 AI Elements files. Its lint script is a no-op; it defines no test or token-check task, and its Storybook configuration includes docs but no accessibility test addon. Root Turbo commands can succeed while excluding this code from those checks.

Evidence: [Storybook scripts](<apps/storybook/package.json>) (reviewed line 6), [registry test scope](<apps/docs/vitest.config.ts>) (reviewed line 12), [Storybook source import](<apps/storybook/src/stories/super-ai/ThreadList.stories.tsx>) (reviewed line 3).

**Repair:** make docs, registry emission, and Storybook consume one authored implementation, with explicit adapters where bases differ. Give every supported component surface real lint, type, behavior, and rendered checks. An interim copy-parity check can detect drift, but shared source removes the duplication.
### SAI-04 — P2 — Super AI's radio chips omit radio keyboard behavior

`ChoiceChips` declares a radio group and its children declare radios, but the component implements only clicks. A focused ArrowRight probe produced no selection callback. Every chip remains a separate tab stop. The source acknowledges this as a deferred TODO.

Evidence: [radio implementation](<apps/docs/registry/super-ai/choice-chips.tsx>) (reviewed line 53), [probe](reviews/2026-09-10/evidence/super-ai-behavior-probes.log.txt). The [W3C radio-group pattern](https://www.w3.org/WAI/ARIA/apg/patterns/radio/) defines arrow navigation and selection for ordinary radio groups.

**Repair:** use a radio-group primitive or implement the complete focus/keyboard contract, including disabled options and wraparound. Click-only tests cannot prove this behavior.
### SAI-05 — P2 — Super AI's delete confirmation does not finish while its row stays mounted

`AlertDialogAction` is a plain Button. Clicking Delete calls `onDelete`, but never changes the controlled `confirmingDelete` state. The dialog remains open after the callback, including after waiting for completion. If the consumer keeps the row mounted while persisting a deletion, the action stays available for repeated submission. Consumers that immediately unmount the row conceal this problem.

Evidence: [controlled dialog and action](<apps/docs/registry/super-ai/thread-list.tsx>) (reviewed line 185), [plain action wrapper](<apps/docs/components/ui/alert-dialog.tsx>) (reviewed line 125), [probe](reviews/2026-09-10/evidence/super-ai-behavior-probes.log.txt).

**Repair:** define completion and pending behavior. Either close on synchronous dispatch or expose a pending/success/error contract that prevents repeated actions and retains useful failure feedback.

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

```sh
pnpm typecheck
pnpm lint
pnpm check:tokens
pnpm test
pnpm build:registry
pnpm build
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
