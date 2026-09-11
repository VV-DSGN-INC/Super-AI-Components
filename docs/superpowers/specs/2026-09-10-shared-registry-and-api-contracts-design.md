# Super AI Components — shared registry and API contracts specification

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

Date: 10 September 2026. Status: **proposed; implementation and release verification remain future work**.

Baseline: `fa9924651b2f40ad9fe1a35b38096b254d82d932`, branch `feat/storybook-component-showcase`. Read the [review](../../../ARCHITECTURE-REVIEW-2026-09-10.md), then the [implementation plan](../plans/2026-09-10-shared-registry-and-api-contracts.md). Preserve the pre-existing `2026-09-06-case-story-handoff.md` plan and any concurrent edits.

## Intended outcome

The documented registry components, the code demonstrated in Storybook, and the code installed in a supported consumer should be the same implementation. The Storybook workspace must typecheck against its declared dependencies and participate in real quality checks. ChoiceChips must work from a keyboard, and thread deletion must have explicit completion and failure behavior.

This is an architecture and contract repair. It does not add model inference, a persistence backend, authentication, a new design language, automatic Radix compatibility, or a public npm component package. It does not migrate Minimal Design System to Base UI. Super AI's present supported primitive family is Base UI; the two projects have different contracts.

## Baseline and priorities

The review recorded 18 TypeScript diagnostics in Storybook, 28 passing docs tests, duplicated implementations for the registry's nine catalog items, a no-op Storybook lint script, and no Storybook test/token scripts. Those are dated observations; derive current counts on the target checkout. A green root Turbo command can skip a workspace that lacks the named script.

| Requirement | Review findings | Result required                                                                |
| ----------- | --------------- | ------------------------------------------------------------------------------ |
| SAI-R1      | SAI-01          | Current SDK/Base UI/Streamdown contracts compile and render correctly          |
| SAI-R2      | SAI-03          | One canonical registry implementation with tested environment adapters         |
| SAI-R3      | SAI-02          | Explicit Base UI support contract and deterministic installed-consumer proof   |
| SAI-R4      | SAI-04          | Radio-group keyboard semantics with controlled/uncontrolled parity             |
| SAI-R5      | SAI-05          | Delete completion, failure, retry and focus behavior while a row stays mounted |
| SAI-R6      | SAI-03          | Both workspaces actually execute quality gates; caches include shared inputs   |

## Architectural options and chosen boundary

| Option                                                                       | Benefit                                              | Cost                                                                   | Decision               |
| ---------------------------------------------------------------------------- | ---------------------------------------------------- | ---------------------------------------------------------------------- | ---------------------- |
| Keep copies and compare them                                                 | Lowest immediate change                              | Every fix still needs duplicated edits and can diverge                 | Reject as steady state |
| Keep registry source canonical; Storybook bridges import it                  | Preserves registry emission and current import sites | Requires explicit aliases and cross-workspace cache inputs             | Recommended now        |
| Extract published/shared packages for components and every primitive wrapper | Strong package boundaries                            | Large migration before the actual interaction/API defects are repaired | Defer                  |

`apps/docs/registry/super-ai/` remains the canonical authoring home. The corresponding nine files in `apps/storybook/src/components/super-ai/` become small re-export bridges. Storybook-only demos remain in Storybook. Each bridge uses a dedicated `@super-ai/registry/<name>` alias mapped to the canonical directory in TypeScript, Vite and unit tests. Preserve existing Storybook import paths so stories do not need mass rewrites.

Canonical files continue to use relative imports for sibling registry components and `@/components/ui/*` / `@/lib/utils` for consumer adapters. In docs those aliases resolve to docs wrappers; in Storybook they resolve to Storybook wrappers. This is an intentional adapter boundary, not proof that arbitrary wrappers are compatible. Typechecks and behavior tests must exercise both hosts. Published registry payloads must contain canonical source only, with no workspace alias or bridge import.

Catalog membership remains derived from `apps/docs/lib/catalog.ts`. Add a contract test that every catalog item has canonical source, a bridge and emitted payload, that no implementation body exists in a bridge, and that every non-test sibling import has a corresponding emitted registry dependency. Do not create another manually maintained item list in the installer or test runner.

## SAI-R1: repair upstream API adaptations without silencing types

The target is the checked-in lockfile's current API contracts. Do not downgrade AI SDK 7 to conceal migration failures or add broad casts/suppressions.

For context usage, introduce a pure adapter in `apps/storybook/src/components/ai-elements/_context-usage.ts`:

```ts
type UsageDetails = {
  input: number | undefined;
  output: number | undefined;
  reasoning: number | undefined;
  cacheRead: number | undefined;
  cacheWrite: number | undefined;
  total: number | undefined;
};
function readUsageDetails(usage?: LanguageModelUsage): UsageDetails;
```

Map reasoning from `outputTokenDetails.reasoningTokens`, cache reads from `inputTokenDetails.cacheReadTokens`, cache writes from `inputTokenDetails.cacheWriteTokens`, and aggregate fields directly. Missing data remains unknown; zero is a known value. Reasoning/cache detail rows may remain hidden when undefined or zero, consistent with their optional-detail purpose. Do not fabricate `$0.00` when pricing is unavailable: show a known token count and omit the price or mark it unavailable. The cost adapter must deliberately map to the installed TokenLens input shape; do not spread an SDK object and assume the two schemas match. Do not add reasoning to total output a second time.

Move preview-card timing from the root to its trigger and rename the opening setting to `delay` at that boundary. Base UI's current [Preview Card API](https://base-ui.com/react/components/preview-card) places `delay` and `closeDelay` on the trigger. Test hover and keyboard focus, including each AI component using the wrapper. Preserve public component-specific timing props if already exposed by mapping them internally.

Repair Plan render/state typing and Streamdown direction propagation with the receiving component's actual types. Narrow `dir` to supported values or omit it when unsupported, preserving `ltr`, `rtl` and `auto` where the installed component accepts them. Remove stale `@ts-expect-error` only after its protected operation is valid; any remaining suppression must cover a demonstrated upstream mismatch and have a focused test.

The Next Link shim must omit native `href` before redefining its string/object union. Support a string URL and the shim's documented `{ pathname?: string }` object without claiming full Next navigation/query behavior. Strip Next-only props from the DOM. This is a Storybook adapter, not a replacement router.

## SAI-R3: installation has one explicit support contract

For this release, support shadcn consumers initialized with Base UI, React 19 and the tested Tailwind 4 setup. Document the exact CLI version, primitive version and fixture configuration used by verification. Radix-backed wrappers are not covered; do not claim “any shadcn app.” Switching an existing application's primitive family is a separate migration and must not be hidden in the install command.

The official [shadcn CLI v4 guidance](https://ui.shadcn.com/docs/changelog/2026-03-cli-v4) exposes explicit base selection. Use the checked-in tool version and a committed consumer fixture; do not depend on `@latest` scaffolding or changing CLI defaults in CI. The fixture's `components.json` must explicitly select a supported Base UI style. Keep library source out of the fixture until the install step so it tests registry installation.

Refactor registry generation into a pure `createRegistry(baseUrl)` plus explicit output writing. The existing production default stays unchanged. A consumer test builds a private temporary registry with a localhost base, starts a task-owned local server, installs every catalog item through the pinned CLI, typechecks/builds, and runs a compact browser scenario using installed components. The test must not rewrite the repository's production `registry.json` or `public/r/` with localhost references.

Validate generated JSON before installation: source contents match canonical files; dependencies resolve; no workspace paths, localhost URL in production-mode output, missing item or duplicate item. Record production-mode and test-mode artifacts separately. The fixture is deterministic for tooling and project setup; record any upstream registry component content hashes fetched during the run rather than claiming the external registry is immutable.

## SAI-R4: ChoiceChips follows radio-group interaction

Keep the existing `ChoiceChips` / `ChoiceChip` API and button-based DOM to avoid a breaking native-input migration. Implement roving focus with a group-owned registry of chip value, DOM ref and disabled state. Use DOM order when navigating; source registration order alone can become stale after reordering. Each registry belongs to one group so nested groups do not interfere.

The group needs an accessible name from its caller. One enabled chip is in the tab order: the selected enabled chip, otherwise the first enabled chip. All other chips use `tabIndex=-1`. If the selected chip becomes disabled or disappears, the first enabled chip becomes the entry point without silently changing the controlled value. If none are enabled, none is tabbable.

ArrowRight/ArrowDown move focus and selection to the next enabled chip; ArrowLeft/ArrowUp move to the previous, wrapping at either end. Space selects the focused chip. Native button Enter/click also select it. Handlers prevent page scrolling for handled arrow/Space keys. Horizontal keys follow this documented DOM-order behavior in both text directions; do not add an untested implicit RTL reversal. This implements the non-toolbar [W3C radio group pattern](https://www.w3.org/WAI/ARIA/apg/patterns/radio/); toolbar behavior is out of scope.

Controlled mode treats `value !== undefined` as ownership and only notifies `onValueChange`; uncontrolled mode also updates internal selection. Notify once per actual value change. Consumer `onKeyDown`/`onClick` runs first; `defaultPrevented` cancels the internal action. Disabled chips cannot be selected by any path. Internal role, checked state and tab index must not be overwritten by a trailing props spread. Preserve standard ref and event composition.

## SAI-R5: delete is a visible asynchronous operation

Extend `ThreadListItemProps.onDelete` to `(id: string) => void | Promise<void>`. Existing synchronous callbacks remain valid. The component owns confirmation/pending/failure state but does not own the parent's row collection.

When `onDelete` is absent, omit the Delete menu item. Confirming calls it once, keeps the dialog open while pending, disables the confirm action and shows “Deleting…”. Success closes the dialog even if the row remains mounted. Failure leaves a retryable generic error. The component does not optimistically remove a row or claim an undo operation it cannot provide.

Cancel/Escape may close the dialog while pending; closing does not cancel the already-issued callback. The row remains pending and cannot start another deletion. If settlement fails after dismissal, expose a row-associated live error with a “Retry delete” action that reopens confirmation; do not reopen a modal unexpectedly. If settlement succeeds after dismissal, clear pending/error state without moving focus. Add optional `onDeleteError?: (error: unknown, id: string) => void` for application reporting; never render arbitrary exception text.

On ordinary close while the row remains, focus returns to the Thread actions trigger. If the parent removes the row, the parent owns moving focus to the next valid list target. Late settlement after unmount performs no state/focus operation. Use a request identity/mounted guard; changing an item's `id` while a request is pending must not apply an old result to the new item. Document stable list keys.

## SAI-R6: checks cover the source actually demonstrated

Replace Storybook's no-op lint with a real TypeScript/React hooks lint configuration. Add a jsdom Vitest project for adapters and shared components. Add a token scan for Storybook-owned UI and AI source while scanning canonical registry source once. Exclude tests, stories, generated output and bridge-only modules explicitly; fail if an expected source family scans zero files. Raw palette/hex checks are contract checks, not a complete accessibility audit.

Add a browser suite for all registry component stories and the changed AI adapter stories, with light/dark axe checks plus the specified keyboard/delete/hover interactions. Derive registry stories from an explicit story metadata tag associated with catalog membership; fail when a catalog item has no covered story. Broader audits of untouched inherited UI can remain a separately reported backlog; do not call this initial suite whole-catalog certification.

Root scripts and CI must demonstrate both workspaces participating. Make a deliberate violating fixture prove lint/token/type checks fail. Test scripts must fail for zero discovered tests. Extend Turbo task inputs for Storybook to include canonical registry source, the catalog and shared scripts; its build outputs must include `storybook-static/**`. Using `$TURBO_DEFAULT$` with `$TURBO_ROOT$` preserves normal hashing while adding cross-package files ([Turborepo configuration reference](https://github.com/vercel/turborepo/blob/main/apps/docs/content/docs/reference/configuration.mdx)). Verify a canonical-source edit invalidates the Storybook cache and a cache hit restores the built Storybook.

## Delivery and acceptance

| Milestone                       | Tasks          | Completion evidence                                                            |
| ------------------------------- | -------------- | ------------------------------------------------------------------------------ |
| Supported APIs and test harness | SAI-T1, SAI-T2 | Both typechecks pass; typed usage/adapter fixtures pass                        |
| Shared source                   | SAI-T3         | Bridges only; both hosts render canonical components; payload contract passes  |
| Component interaction           | SAI-T4, SAI-T5 | Browser and unit tests for keyboard/delete lifecycle                           |
| Consumer and gates              | SAI-T6, SAI-T7 | Pinned install/build/browser proof; gates execute both workspaces; cache proof |
| Final handoff                   | SAI-T8         | Current evidence for all six requirements and truthful support documentation   |

The implementation handoff must list API additions, exact supported consumer setup, source revision, commands and results, browser coverage limits and remaining decisions. Do not close a compatibility finding using a local alias-only demo. Preserve historical evidence and avoid publishing temporary artifacts. Changes can be delivered separately, but each source/bridge/registry change must land coherently so a half-migrated checkout does not emit the wrong implementation.
