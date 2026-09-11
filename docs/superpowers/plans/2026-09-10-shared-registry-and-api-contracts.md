# Super AI Components — shared registry and API contracts implementation plan

> **Status 2026-09-11: re-scope before executing.** This document was written
> against `fa99246` (2026-06-30), which is **458 commits behind `main`** and had
> 18 registry `.tsx` files against today's 248 — so every count here, and the
> sizing of the work, describes a repo roughly one-fourteenth the current one.
> Two of the five findings it plans against were already fixed on `main` before
> it was written (SAI-01, the AI SDK 7 usage fields; SAI-03, the duplicated
> Storybook copies), which retires **SAI-R1 and SAI-R2** as written. A third
> (SAI-05) was fixed on 2026-09-11. What remains genuinely open is SAI-02, the
> Base UI vs Radix consumer contract, and SAI-04, the roving tabIndex — both of
> which `docs/CONTINUE.md` was already tracking. See the re-verification section
> at the top of
> [`ARCHITECTURE-REVIEW-2026-09-10.md`](../../../ARCHITECTURE-REVIEW-2026-09-10.md).

> **For agentic workers:** Use `superpowers:executing-plans` when available. Execute the checked steps in bounded changes. A later user's assignment determines whether to implement, commit or publish; this document grants no additional scope or delegation.

**Goal:** One canonical registry implementation, accurate dependency/consumer contracts, usable keyboard/delete interactions, and real checks across both workspaces.

**Architecture:** Canonical docs registry source with Storybook re-export bridges; environment-specific primitive adapters remain explicit and tested.

**Tech stack:** pnpm 11.1.0, Turbo 2.9.17, Next 16/React 19 docs, Storybook 9/Vite 7, Base UI 1.5, AI SDK 7, TypeScript, Vitest and Playwright.

**Spec:** [Shared registry and API contracts](../specs/2026-09-10-shared-registry-and-api-contracts-design.md). **Baseline evidence:** [Architecture review](../../../ARCHITECTURE-REVIEW-2026-09-10.md).

## Global constraints

- Verify current HEAD and uncommitted work against reviewed `fa9924651b2f40ad9fe1a35b38096b254d82d932`. Preserve `docs/superpowers/plans/2026-09-06-case-story-handoff.md` and review evidence.
- No broad dependency update, no AI SDK downgrade, no migration of sibling projects, no publishing. Keep registry item names, destination paths and existing consumer props unless this spec adds a compatible extension.
- Do not treat Turbo success as evidence a workspace participated: capture its task list and outputs. Run bare commands and preserve exit statuses.
- Paths below are repository-relative. Files marked **Create** do not exist merely because this plan names them. Snippets are contract examples to integrate with the actual files.
- Dependency/tool versions added for tests must be pinned to a compatible tested choice in the lockfile. The installed package type declarations are the authority for API adaptation; consult official docs for uncertain version behavior.
- Self-review each task's diff and record evidence. Commit only when explicitly part of the implementation assignment.

## Dependency order

`T1 → T2 → T3 → {T4, T5} → T6 → T7 → T8`. Braces indicate independent task boundaries, not authorization to start other agents. Keep canonical/bridge changes together. Do not expand registry distribution to the inherited AI Elements catalog while repairing these contracts.

## SAI-T1 — establish real Storybook unit/type coverage

**Covers:** SAI-R1/R6. **Modify:** `apps/storybook/package.json`, `pnpm-lock.yaml`, `apps/storybook/tsconfig.json`. **Create:** `apps/storybook/vitest.config.ts`, `apps/storybook/vitest.setup.ts`, `reviews/implementation/shared-contracts-progress.md`.

- [ ] Record branch, revision, runtime versions and current dirty files. Read package scripts, CI and the original typecheck log. List each diagnostic by underlying contract rather than just its line number.
- [ ] Run `pnpm --filter docs typecheck`, `pnpm --filter storybook typecheck` and `pnpm --filter docs test`. Keep the two workspace results separate. Revalidate the historical 18 diagnostics; do not assume all remain.
- [ ] Add a Storybook `test` script running Vitest in jsdom with Testing Library, cleanup and the same `@`/Next-shim aliases as Vite. Include `src/**/*.test.{ts,tsx}`; fail on no tests. Match compatible test package versions already used by docs where possible.
- [ ] Install test-only dependencies in the workspace that uses them. Include Vitest config/setup in lint/type scopes as appropriate; do not accidentally typecheck built Storybook output.
- [ ] Add one real typed adapter fixture in T2's target test file immediately, so the harness is not left with placeholder tests. Confirm it fails for the reviewed contract and can run without a Next server.

**Checkpoint:** the harness executes an actual behavior test, and the baseline identifies which workspace is red.

## SAI-T2 — finish SDK, Base UI, rendering and shim adaptations

**Covers:** SAI-R1. **Modify:** `apps/storybook/src/components/ai-elements/{context,inline-citation,prompt-input,plan,reasoning,confirmation,tool}.tsx`, `apps/storybook/src/shims/next-link.tsx`; the `ui/hover-card.tsx` wrapper only if its declared contract needs adjustment. **Create:** `_context-usage.ts` and `_context-usage.test.ts` beside `context.tsx`, component adapter tests, and `src/shims/next-link.test.tsx`.

- [ ] Write a typed SDK fixture without casts:

```ts
const usage = {
  inputTokens: 30,
  inputTokenDetails: {
    noCacheTokens: 20,
    cacheReadTokens: 7,
    cacheWriteTokens: 3,
  },
  outputTokens: 12,
  outputTokenDetails: { textTokens: 8, reasoningTokens: 4 },
  totalTokens: 42,
} satisfies LanguageModelUsage;
expect(readUsageDetails(usage).reasoning).toBe(4);
expect(readUsageDetails(usage).cacheRead).toBe(7);
```

- [ ] Add undefined, known-zero and partial-unknown cases using the actual required SDK structure. Assert no double-counted reasoning, no invented token count and no displayed `$0.00` for unknown price/model data.
- [ ] Implement `readUsageDetails` as the direct mapping in the spec. Translate those values to TokenLens's installed input shape at one boundary. Preserve existing child overrides in usage display slots.
- [ ] Replace root `openDelay`/`closeDelay` misuse by trigger `delay`/`closeDelay` mapping. Inspect all affected consumers, not just the first type error. Add browser cases to T7 for hover delay and focus access.
- [ ] Correct Plan's receiving render/children type and Streamdown direction typing. Exercise ordinary text, render props where supported, `ltr` and `rtl`. Do not replace incompatible values with `any`.
- [ ] Remove obsolete error suppressions only after verifying each underlying access against the installed type. Run typecheck between categories to isolate remaining failures.
- [ ] Define the shim props as `Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & { href: string | { pathname?: string }; ... }`. Test string and pathname output, missing pathname fallback, children/ref forwarding and removal of `prefetch`, `replace`, `scroll` from rendered attributes.
- [ ] Run `pnpm --filter storybook test`, both typechecks and the Storybook build. Expect zero type diagnostics in the supported lockfile state. A build without typecheck does not satisfy this task.

**Checkpoint:** SAI-01 is closed by typed input/rendering evidence, not suppressed diagnostics.

## SAI-T3 — replace duplicate implementations with canonical bridges

**Covers:** SAI-R2. **Modify:** the nine catalog-matched `apps/storybook/src/components/super-ai/*.tsx` files, Storybook `tsconfig.json`, `vite.config.ts`, `vitest.config.ts`, `turbo.json`. **Create:** `apps/docs/scripts/registry-contract.mts` and `apps/docs/registry/super-ai/registry-contract.test.ts`. **Read:** `apps/docs/lib/catalog.ts` and `scripts/gen-registry.mts`.

- [ ] Derive item names from `CATALOG_ITEMS`, compare source pairs and review differences before replacing anything. Preserve a current intentional difference by moving it into canonical behavior or a named Storybook demo; do not discard it through an automated overwrite.
- [ ] Add a failing contract test that checks canonical file/bridge existence, exact re-export-only bridge shape and unique catalog membership. Exclude `.test.tsx` from item discovery.
- [ ] Add `@super-ai/registry/*` resolution to the three Storybook configurations, pointing to `../docs/registry/super-ai/*`. Continue mapping `@/*` to Storybook `src`. Ensure Vite serves the canonical workspace path through its workspace-root allowance and resolves a single React/ReactDOM copy.
- [ ] Replace each duplicate with a bridge, for example:

```tsx
export { ChoiceChip, ChoiceChips } from "@super-ai/registry/choice-chips";
```

- [ ] Preserve every previously exported public symbol, including exported types where present. Relative sibling imports in canonical source must continue to resolve canonical files. Published source must never import the bridge alias.
- [ ] Add a Storybook-host shared-component test importing a bridge and checking real behavior with Storybook wrappers. Keep docs tests importing canonical source, so both adapter hosts remain exercised.
- [ ] Extend Turbo inputs for Storybook typecheck/test/lint/build to include canonical source and catalog; preserve `$TURBO_DEFAULT$`. Add `storybook-static/**` to that workspace's build outputs. Use package-qualified task names consistent with the existing workspace name `storybook`.
- [ ] Run both tests/typechecks, build registry, and build both hosts. Confirm payload contents are canonical and contain no `@super-ai/registry` import. Do not rename the canonical directory or distribution target.

**Checkpoint:** editing canonical ChoiceChips changes the docs, Storybook bridge rendering and emitted payload without copying source.

## SAI-T4 — implement ChoiceChips keyboard and ownership contracts

**Covers:** SAI-R4. **Modify:** `apps/docs/registry/super-ai/choice-chips.tsx`, its `.test.tsx`, and the corresponding Storybook story. **Create:** a focused Storybook-host parity test if not covered by T3.

- [ ] Add failing tests for Tab entry/exit, four arrow keys with wrapping, Space, disabled skips, all-disabled groups, reorder/removal, nested-group isolation and no selection. Test controlled and uncontrolled versions.

```tsx
render(
  <ChoiceChips aria-label="Quality" defaultValue="balanced">
    <ChoiceChip value="fast">Fast</ChoiceChip>
    <ChoiceChip value="balanced">Balanced</ChoiceChip>
    <ChoiceChip value="best">Best</ChoiceChip>
  </ChoiceChips>,
);
await user.tab();
expect(screen.getByRole("radio", { name: "Balanced" })).toHaveFocus();
await user.keyboard("{ArrowRight}");
expect(screen.getByRole("radio", { name: "Best" })).toHaveAttribute("aria-checked", "true");
```

- [ ] Add event tests: callback once per changed value, no callback for reselecting current value, preventDefault cancellation, disabled clicks ignored, controlled state not visually changed unless parent updates.
- [ ] Implement a group-scoped collection of value/ref/disabled registrations with symmetric cleanup. Resolve current DOM order for navigation and compute the one tabbable enabled chip. Refs must compose with consumer refs.
- [ ] Compose consumer handlers first; run internal actions only if not prevented. For controlled mode do not update hidden internal state as a side effect of selection. Put protected ARIA/tabIndex after ordinary prop spreading.
- [ ] In a real browser, check forward/backward Tab and arrows in light/dark, RTL text, wrapped chips and a chip dynamically disabled/removed. Add those checks to T7's suite; jsdom alone does not prove focus layout behavior.
- [ ] Run docs tests and Storybook bridge tests; build the registry to ensure sibling/dependency metadata remains valid.

**Checkpoint:** SAI-04 closes only with keyboard behavior and preserved consumer ownership, not merely `role="radio"` markup.

## SAI-T5 — make delete completion, dismissal and retry explicit

**Covers:** SAI-R5. **Modify:** `apps/docs/registry/super-ai/thread-list.tsx`, `thread-list.test.tsx`, corresponding Storybook story and docs examples.

- [ ] Extend the existing successful-delete test to assert the dialog closes while the row remains rendered. This must fail against the reviewed baseline.
- [ ] Add deferred tests for resolve, reject, duplicate confirmation, dismissal while pending, rejection after dismissal, retry, absent callback, unmount and item-ID change. Ensure the parent fixture deliberately keeps the row mounted except in the unmount scenario.
- [ ] Extend `onDelete` to accept a promise and add `onDeleteError`. Use one request ID and pending state per row. Wrap sync throw/async rejection in the same path; finally releases pending state even if reporting fails.
- [ ] Disable confirm while pending, display “Deleting…”, allow Cancel/Escape dismissal, and prohibit a second delete until settlement. Omit Delete without a handler.
- [ ] On success close an open dialog explicitly; do not require a parent unmount. On failure show generic retry text. A dismissed dialog stays dismissed and exposes a row live error plus a retry-confirmation action.
- [ ] Restore focus to the Thread actions trigger on ordinary close if it still exists. Do not refocus after already-dismissed settlement. Guard unmount/changed-ID settlement and document the parent's focus duty when removing the row.
- [ ] Preserve the existing deferred rename behavior and verify rename/pin/select tests still pass. This task does not redesign those operations.
- [ ] Run both host tests and browser interaction checks. Assert dialog visibility and focus, not only handler invocation.

**Checkpoint:** SAI-05 is closed in both synchronous and asynchronous parent integrations, with no automatic modal reopening.

## SAI-T6 — prove the explicit Base UI installation path

**Covers:** SAI-R3 and emission portion of SAI-R2. **Modify:** `apps/docs/scripts/gen-registry.mts`, `apps/docs/scripts/consumer-test.sh`, `apps/docs/package.json`, `README.md`, `apps/docs/README.md`, `apps/docs/app/components/[name]/page.tsx`. **Create:** `apps/docs/scripts/lib/create-registry.mts`, `apps/docs/scripts/test-consumer.mts`, `apps/docs/tests/consumer-base/` fixture and registry-generation tests.

- [ ] Extract `createRegistry(baseUrl: string)` without filesystem/environment access. Pass explicit output paths at the writer boundary. Test trailing-slash normalization, unique names, sibling dependencies, existing production default and source contents.
- [ ] Keep `build:registry` behavior for the normal docs build. Add an isolated generation path that writes registry JSON and emitted `r/` assets only beneath a newly created temporary directory. Copy/stage canonical source there for the pinned shadcn build; do not patch tracked production files and restore them later.
- [ ] Commit a minimal Next/React/Tailwind consumer fixture with explicit Base UI `components.json`, exact tool versions and a lockfile. It contains no installed Super AI source initially. Use the checked-in shadcn version; remove `@latest`, scaffold defaults and unpinned server tooling from the test path.
- [ ] Serve the temporary registry on an available local port and install all names derived from the catalog. Import/render every item in a fixture page; include keyboard ChoiceChips and ThreadList confirmation flows, not just leaf imports.
- [ ] Run the fixture's typecheck/build and browser smoke. Assert Base UI dependencies were installed and no duplicate React runtime resolves. Record fetched primitive payload hashes/version information when the upstream registry is involved.
- [ ] Verify production files and their hashes did not change during the smoke run. Test that production-mode generated JSON contains no localhost or workspace paths. Cleanup server/process/temp files in `finally`; retain logs on failure in a task-owned output directory.
- [ ] Replace `consumer-test.sh` with a thin compatibility entry point to the new `test:consumer` script, so CI and local runs use one implementation.
- [ ] Update installation language, including the per-component install snippet in `app/components/[name]/page.tsx`, to name Base UI and the tested CLI version. Explain that existing Radix consumers require a separate adaptation; do not automatically overwrite their primitive family.

**Checkpoint:** SAI-02 has a truthful support statement and a real installed-consumer result. Source-alias compilation is insufficient.

## SAI-T7 — activate both workspace gates and verify caching

**Covers:** SAI-R6. **Modify:** both workspace manifests, root scripts as needed, `turbo.json`, `.github/workflows/ci.yml`, `pnpm-lock.yaml`, docs token script. **Create:** `apps/storybook/eslint.config.mjs`, shared token scanner/fixtures under root `scripts/`, `apps/storybook/playwright.config.ts` and browser specs under `apps/storybook/tests/browser/`.

- [ ] Replace `echo "no lint"` with ESLint covering Storybook TypeScript/React hooks. Ignore generated output, evidence `.txt`, node_modules and worktrees; do not blanket-ignore UI or AI Elements source. Keep Next-only lint rules in docs.
- [ ] Extract the existing token rules into shared pure scanning code. Docs scans canonical registry implementation; Storybook scans its owned `ui` and `ai-elements` implementations. Exclude stories/tests/bridges explicitly and fail on zero files in any expected source family.
- [ ] Add fixture tests for raw hex, palette utilities, compliant semantic utilities, attribute-selector hex, unreadable files and zero scope. If current source fails, fix semantic violations in affected implementation; do not create a blanket exemption baseline.
- [ ] Add `test:browser` in Storybook using the built static host and Playwright/axe. Tag all registry stories and changed AI adapter stories, derive the test inventory from Storybook's built index, and assert catalog-to-story coverage is complete.
- [ ] Run those stories in light/dark and execute ChoiceChips keyboard, mounted-row delete, retry/dismissal and preview-card hover/focus scenarios. Fail on page errors. Report untouched inherited catalog accessibility as outside this initial suite's coverage.
- [ ] Wire typecheck/lint/test/check:tokens/build, docs browser tests, new Storybook browser tests and `test:consumer` into CI. Use one defined command per test path; do not maintain an alternate shell checklist that silently skips workspaces.
- [ ] Inspect `pnpm exec turbo run typecheck lint test check:tokens --dry=json` and verify docs and Storybook both have tasks. Run the real commands uncached for proof.
- [ ] In an isolated temporary copy, change one canonical file and verify Storybook task hashes/cache miss. Restore the copy, build twice and verify cache reuse/restoration includes `storybook-static`. Never edit live source as a failure control without preserving the exact prior contents.

**Checkpoint:** SAI-03 is closed when real checks cover both hosts and cache behavior follows canonical-source changes.

## SAI-T8 — integration and release-ready handoff

**Covers:** all requirements. **Modify:** progress ledger, support documentation and changed component examples.

- [ ] From a clean dependency installation on the supported runtime, run the final commands:

```sh
pnpm typecheck
pnpm lint
pnpm test
pnpm check:tokens
pnpm build:registry
pnpm build
pnpm --filter docs exec playwright test
pnpm --filter storybook test:browser
pnpm --filter docs test:consumer
```

- [ ] Confirm the existing docs Playwright configuration still targets its intended app and the new Storybook script starts its own appropriate host. Do not accidentally test a stale server from another checkout.
- [ ] Check generated registry diff and hashes against canonical source. Review all changed consumer docs for support claims and all Storybook bridges for remaining implementation bodies.
- [ ] Open representative docs/Storybook flows at the tested revision and review keyboard focus, pending/error copy and light/dark presentation. Record browser, URL and captures in the implementation ledger.
- [ ] Produce a SAI-01–SAI-05 handoff with current evidence, exact dependency/consumer setup, API additions, remaining limitations and unimplemented follow-ups. Keep the original review immutable as a dated baseline.

**Done:** all SAI-R1–R6 acceptance criteria have current evidence; no dependency errors are suppressed to reach green; no release/publication has happened unless separately requested.
