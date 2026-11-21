# CopilotKit and OpenUI update Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. One task, one commit.

**Goal:** bring the two agent runtimes this repo already integrates to their current releases: OpenUI from `0.3.2` to `1.1.1`, and CopilotKit from `1.87.0` to `1.90.0` with AG-UI from `1.0.2` to `1.0.5`.

**Reading of the ask:** Nick wrote "we at least need to update it to copilot kit and to openui". OpenUI is already wired into `main` (`/openui`, `generated-body`, `generated-chat`), and CopilotKit is wired on `feat/ag-ui-chat` (the `ag-ui-chat` lib item and the `/copilotkit` demo). This plan updates both in place. It does not move other registry components onto either runtime: the CopilotKit spike measured about 513 packages per install, and the registry ships through `shadcn add`. See `docs/decisions-2026-11-21.md`.

**Base:** branch `build/copilotkit-openui-update`, cut from `feat/ag-ui-chat` `7ea238be`, which already contains `origin/main` `4ef49d2e`.

**Release notes:** `docs/drafts/2026-11-21-copilotkit-openui-releases.md` (read from the official changelogs on 2026-11-21).

## Global Constraints

- pnpm only. `pnpm install` from the repo root after a `package.json` change, and commit `pnpm-lock.yaml` with it.
- Stay on CopilotKit 1.x: `2.0.0-rc.68` is a release candidate, not a release.
- Upgrade `@openuidev/lang-core` and `@openuidev/react-lang` together, to the same version.
- `generated-body` is a registry item whose npm dependency reaches consumers: after the bump, `pnpm build:registry` and check the emitted `generated-body.json` names the new range.
- Derived files are regenerated, never hand-edited: `pnpm --filter docs openui:emit`, `pnpm --filter docs contract:emit` if a `.meta.json` changes.
- Telemetry stays off: `COPILOTKIT_TELEMETRY_DISABLED` and `DO_NOT_TRACK` are set wherever the runtime runs, and `@scarf/scarf` stays blocked in `pnpm-workspace.yaml`.
- If an upgrade breaks something that cannot be fixed in the task's scope, revert that task's version bump, keep the branch building, and report what broke.
- No push, no PR, no deploy, no publish.

### Task 1: OpenUI 0.3.2 to 1.1.1

**Files:** `apps/docs/package.json`, `pnpm-lock.yaml`, and whatever of these the upgrade breaks: `apps/docs/components/openui/*`, `apps/docs/components/generated-chat/*`, `apps/docs/components/demos/generated-body-demo.tsx`, `apps/docs/registry/super-ai/generated-body.tsx`, `apps/docs/scripts/lib/openui-catalog.ts`, `apps/docs/public/openui/catalog.json` (derived).

1. Bump both packages to `^1.1.1`; install.
2. Fix each 1.0 break that applies: removed exports (`BUILTINS`, `isBuiltin`, `ACTION_NAMES` and others), programs with no `root` statement (they now render blank), a `root` written last (blank while streaming), `@Card(...)`-style calls that now evaluate to null, and the action-step prompt format. Fixture programs in tests and in `fixtures.ts` / `programs.ts` must still render what they rendered before; do not weaken an assertion to pass.
3. Regenerate `public/openui/catalog.json` with `openui:emit`, then `pnpm build:registry`.
4. Checks: `cd apps/docs && pnpm exec tsc --noEmit -p .`, `pnpm exec vitest run components/openui components/generated-chat registry/super-ai/generated-body.test.tsx scripts/lib/openui-catalog.test.ts scripts/lib/registry-extras.test.ts`, then `pnpm test` from the root.
5. Commit: `chore(deps): OpenUI 1.1.1, with the fixes its 1.0 break needs`

### Task 2: CopilotKit 1.90.0 and AG-UI 1.0.5

**Files:** `apps/docs/package.json`, `pnpm-lock.yaml`, `apps/docs/components/copilotkit/*`, `apps/docs/registry/super-ai/ag-ui-chat.tsx` and its test, `apps/docs/app/api/copilotkit/[[...slug]]/route.ts`.

1. Bump `@copilotkit/react-core` and `@copilotkit/runtime` to `^1.90.0`, `@ag-ui/client` and `@ag-ui/core` to `1.0.5` (1.90 pins client 1.0.5 exactly; mixed versions gave duplicate `Observable` types in the spike). Keep `rxjs` deduplicated.
2. Fix each break that applies: `threadId` is an accessor on `AbstractAgent` from 1.0.4 (a subclass field fails TS2610), `middlewares` is protected, events without a string `type` are rejected from 1.0.5, `compactEvents` ordering changed, thread naming changed in CopilotKit 1.88.
3. Confirm telemetry: the `telemetry-off` module still sets both switches, and its test passes.
4. Checks: `cd apps/docs && pnpm exec tsc --noEmit -p .`, `pnpm exec vitest run components/copilotkit registry/super-ai/ag-ui-chat.test.tsx registry/super-ai/permission-prompt.test.tsx`, then `pnpm test` from the root.
5. Commit: `chore(deps): CopilotKit 1.90.0 and AG-UI 1.0.5`

### Task 3: Prove it in the product

Controller-run, no executor. From the root: `pnpm lint`, `pnpm typecheck`, `pnpm check:tokens`, `pnpm check:contract`, `pnpm test`, `pnpm build:registry`, `pnpm build`, then the Playwright smoke (after the build) for `/openui`, `/generated-chat` and `/copilotkit`, then `apps/docs/scripts/consumer-test.sh`. Record each result in `docs/drafts/2026-11-21-copilotkit-openui-releases.md` under "Verified here". Commit: `docs: record what the runtime update was checked against`
