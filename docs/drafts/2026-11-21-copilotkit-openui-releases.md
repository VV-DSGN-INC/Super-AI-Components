# Release research, checked 2026-11-21 (npm + GitHub only, no memory)

## 1. OpenUI (@openuidev/lang-core, @openuidev/react-lang)

Repo: https://github.com/thesysdev/openui (npm homepage openui.com). Both packages: 1.1.1, 2026-11-12.
Timeline: 0.3.2 (2026-10-08), 0.4.0/0.4.1 (10-10), 1.0.0 (10-12), 1.0.1, 1.0.2 (10-27), 1.1.0 (11-04), 1.1.1 (11-12).
Sources: https://github.com/thesysdev/openui/blob/main/packages/lang-core/CHANGELOG.md and packages/react-lang/CHANGELOG.md (also GitHub releases tagged @openuidev/react-lang@1.0.0 etc).
Migration guide: none found. No migrate/upgrade page in docs/content; CHANGELOG notes are the only guide.

Peer deps: zod "^3.25.0 || ^4.0.0" (unchanged from 0.3.2); react "_", react-dom "_", new optional react-native "*"; @modelcontextprotocol/sdk >=1.0.0. So no React or zod floor bump. react-lang 1.1.1 now depends on lang-core ^1.1.1, @openuidev/devtools, @openuidev/observability.

Breaking in 1.0.0 (PR #1348):

- Upgrade lang-core, react-lang and the server that builds the system prompt together. A 1.0 prompt teaches bare action steps (`@ToAssistant("Hi")` without `Action([...])`) that a 0.x client does not run.
- react-ui 0.18 needs react-lang >=1.0.0 <2.0.0. server 0.3+ uses lang-core 1.0. vue/svelte/angular-lang stay on 0.4 and need lang-core ^0.4.
- Removed exports: BUILTINS, BUILTIN_NAMES, LAZY_BUILTINS, isBuiltin, BuiltinDef, ACTION_NAMES, isASTNode, isRuntimeExpr, CallNode, RuntimeExprNode, Statement, Token, toNumber.
- `ActionStep` union gains `{type:"custom_action"; name; params}`, so exhaustive switches need a new case.
- Entry rule: with no `root` statement and no statement calling the root component, nothing renders (0.x rendered the first component). Cut-off output without root renders blank, not a partial tree. While streaming, a program with `root` written last shows nothing until that line arrives; write root first.
- `@Name(...)` for a non-builtin (e.g. `@Card(...)`) now evaluates to null with `unknown-function`, not a component call.
- Action slots are JSON Schema $refs (`ActionExpression`); single steps evaluate to one-step plans.
  New (non-breaking): defineAction, defineFunction, createLibrary({functions, actions}), library.extend(), parseMessage/buildMessage, `action()` helper, `builtinFunctions` prompt option, StreamParser.push/set/getResult take a `complete` flag (pass true when the stream ends, else a trailing `$name` is not declared).
  No rename found for Renderer, createLibrary, defineComponent; they are still the API. 0.4.0 only added optional Renderer slots (content, query loading, error, retry).

Breaking in 1.1.0 (PR #1480): QueryManager implementations must add `evaluateStatements`; new `query-cycle` error; failed fetches retry only via @Run, refresh interval or invalidate; @Round/@Abs/@Floor/@Ceil now map over lists (upgrade clients before server); parse results must be treated as immutable.
1.0.2: React Native entry now renders RN primitives. 1.1.1: Renderer without `onError` logs one console.error instead of per-error console.warn.
Not confirmed: whether the repo's code uses custom prompts or hand-written root-last programs (check against the entry-rule break); the lang-core 0.3.2 to 0.4.0 diff beyond the react-lang notes.

## 2. CopilotKit

Latest 1.90.0 (2026-11-20). Dist-tag next = 2.0.0-rc.68 (2026-11-20, rc.60 was 11-17, so roughly one rc a day). Source: npm dist-tags, https://github.com/CopilotKit/CopilotKit/releases.
2.0 is NOT GA: no 2.0.0 on npm, only rc builds; branch `2.0.0` last commit 2026-11-20. No migration guide found in the repo tree. A docs version picker forwarding /v2 to "the 2.0 docs" was added in the 1.87-1.90 window (PR #8503).
1.87.0 to 1.90.0 is 382 commits. Peer deps identical at 1.87.0 and 1.90.0 for react-core (react ^18||^19, zod >=3.25, maplibre-gl ^5) and runtime (no change).
Breaking / behaviour changes:

- 1.88.0 (release notes: "one breaking change to thread naming"; PR https://github.com/CopilotKit/CopilotKit/pull/8377): the runtime never runs your agent to name a thread. `generateThreadNames: true` (default) now uses the first user message cut to 8 words, with no model call; set `{ model: "openai/gpt-5-mini", apiKey? }` for model titles; false disables. New type ThreadNameGenerationConfig. Matters only if you use Intelligence threads.
- AG-UI pin moved: react-core and runtime 1.87.0 depend on @ag-ui/client 1.0.2; 1.90.0 pins 1.0.5 exactly (core 1.0.5 too). Your AbstractAgent subclass therefore gets the 1.0.4 and 1.0.5 breaks below. Pin your own @ag-ui/client to the same version to avoid duplicates.
- CORS: runtime now echoes requested headers on credentialed preflights only for an explicitly allowed origin, and omits Allow-Headers when none requested (commits in 1.88 to 1.89 range). Could matter if the route sets credentialed CORS.
- 1.88: new runAgentInThread export, server-side agent runs via Intelligence. 1.89: agent display names separate from agent IDs (PR #4775), MCP Apps ui/update-model-context (opt-in), virtualized chat list changes. 1.87.1 and bumps: @ag-ui/a2ui-middleware 0.0.16 for A2UI 1.0 Direct JSON.
- No rename of CopilotRuntime, route handler or react-core hooks found in commit titles. I did not read the diff of the catch-all route handler, so "no change" there is unverified.
  Telemetry (1.90.0 notes: framework-level telemetry added to runtime; sends CopilotKit version to Intelligence gateway): opt-out env vars unchanged: COPILOTKIT_TELEMETRY_DISABLED=true or 1, or DO_NOT_TRACK=true or 1. Source: packages/shared/src/telemetry/telemetry-disabled.ts on main. Not confirmed: whether the new 1.90 framework telemetry also honours it (assume yes, test with network capture).

## 3. AG-UI (@ag-ui/client, @ag-ui/core)

Repo: https://github.com/ag-ui-protocol/ag-ui, release tags release/<date>. 1.0.2 (2026-10-05), 1.0.3 (10-16), 1.0.4 (11-05), 1.0.5 (11-17). core moves in lockstep.

- 1.0.3: maintenance, no breaks.
- 1.0.4 BREAKING (release/2026-11-05): `threadId` is now a lazy accessor on AbstractAgent; subclasses declaring or overriding `threadId` as a field fail with TS2610, assign it in the constructor. threadId no longer an own property (missing from Object.keys, spread, JSON.stringify until read). `zod` moved from dependency to required peer ^3.25.18 || ^4.0.0, so install zod. `AbstractAgent.middlewares` is now protected. Tool-result ordering and re-pairing changed. Emitted messages are read-only.
- 1.0.5 BREAKING (release/2026-11-17): event enforcement rejects missing, non-string or inherited union discriminators; compactEvents ordering and reasoning-delta compaction changed. Also fixes clone() to copy resolvingPeerCeiling.
  Action for an AbstractAgent subclass: check for a `threadId` field, fix with constructor assignment; make sure every emitted event has a string `type`.

## Verified here (2026-11-21, branch build/copilotkit-openui-update)

Run by the controller from the repo root on `eb6bf5b1`, after a fresh `pnpm build`. Machine load was 26 to 51 throughout.

| step                           | result                                                                                                      |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| lint                           | pass                                                                                                        |
| format:check                   | fail, 18 files, all failing identically on `origin/main`; none touched here                                 |
| typecheck                      | pass                                                                                                        |
| check:tokens, check:contract   | pass (run on `7c13ab81`; the later fix touches no tokens or contracts)                                      |
| test                           | pass, docs 210 files and 2675 tests                                                                         |
| build:registry, build          | pass                                                                                                        |
| Playwright smoke               | pass, 169 of 169, including `/copilotkit` approve and Escape and every `/generated-chat` and `/openui` case |
| Storybook a11y and interaction | pass, 154 files and 1700 tests (run on `7c13ab81`; the fix touches no stories)                              |
| consumer install               | pass                                                                                                        |

The first smoke run on `7c13ab81` failed 3 tests: OpenUI 1.x `Renderer` writes every error to `console.error` unless `onError` is passed, and the failed-version demos render an unknown component on purpose. `eb6bf5b1` passes a no-op `onError` where the component owns its failed state, and a unit test now catches the log without Playwright.

Not checked: Safari, a real model behind `/copilotkit`, the zod 4 override under any CopilotKit path the smoke does not drive.
