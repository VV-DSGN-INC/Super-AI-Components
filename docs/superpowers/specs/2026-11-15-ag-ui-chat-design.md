# AG-UI chat: registry components under an outside agent runtime

Status: design, awaiting Nick's approval. Branch `claude/copilotkit-spike` (local, not pushed). Spike write-up: `apps/docs/components/copilotkit-spike/FINDINGS.md`.

## TL;DR

Ship one new `registry:lib` item, `ag-ui-chat`, that turns AG-UI protocol messages into props for `chat-shell`, `permission-prompt` and `agent-presence`. It depends only on `@ag-ui/core`, so it works with CopilotKit or any other AG-UI client, and no consumer gets CopilotKit unless they install it themselves. Fix two `permission-prompt` gaps the spike found. Turn the spike page into a proper `/copilotkit` demo that drives the lib item through CopilotKit's headless hooks.

## 1. Decisions

### 1.1 Made with Nick

- 2026-11-13: CopilotKit is worth trying under Super-AI-Components; not for LifeOS (no Swift SDK) or MDS (no agent layer).
- 2026-11-15: approach B (section 6): a protocol-level lib item, with CopilotKit only in the docs demo.

### 1.2 Calls made in this spec (override any)

1. **The why is a showcase, not a consumer request.** Nick came to this exploring a tool someone mentioned. The goal is to prove the registry runs under an outside agent runtime through an open protocol, at a standard fit for the docs site. Stated to Nick on 2026-11-15 and not corrected.
2. **Scripted agent only in v1.** The demo keeps the spike's scripted agent (no model, no key, no cost). A model-backed AG-UI agent is a follow-up (section 11).
3. **No thread persistence.** A reload starts the conversation over.
4. **"Always allow" stays a one-time approval** in the demo, and the demo says so. A standing grant needs a store and a revoke path (N9), which is out of scope.
5. **The lib item is named `ag-ui-chat`** after the protocol, not the client, so the name stays true for non-CopilotKit consumers.
6. **`ag-ui-chat` imports nothing from other registry items.** `presenceFor` returns a local union of the four states it can produce (`needs-you`, `idle`, `acting`, `watching`). The test file, which is not shipped, imports `AgentPresenceState` from `agent-presence` and fails to compile if that union stops being assignable to it. So a consumer installs one file, and drift is still caught in this repo. The same rule applies to the turn type: it is shaped to fit `ChatShell`'s `messages` prop structurally, with a compile-time check in the test, not an import.

## 2. Measured state at baseline

- `lib/lib.manifest.ts` holds five `registry:lib` items. `generated-chat` is the precedent: the only item that needs `ai`, and consumers get `ai` only when they add it.
- A shipped lib item must have `registry/super-ai/<name>.tsx` and `<name>.test.tsx` (`scripts/check-contract.mts`). `gen-registry.mts` emits it with `dependencies: npm` and `registryDependencies: shadcn`.
- `@ag-ui/core` 1.0.2 has no dependencies of its own; `zod` (3.25 or 4) is a peer.
- The spike (commit `34622532`) proved the path end to end in the browser. Its files are under `apps/docs/components/copilotkit-spike/`, `app/api/copilotkit/[[...slug]]/route.ts` and `app/copilotkit/page.tsx`. 12 unit tests pass.
- `permission-prompt` (N8): Deny is an `AlertDialogCancel`; the other verbs go through `resolveWith`, which calls `onOpenChange(false)`. Pressing Escape closes the dialog without `onDeny`. `editedValues` is seeded from `args` once, at mount.
- MDS (`@weeeha/ui`) has no CopilotKit, AG-UI or `useChat` code, so there is no ownership overlap to settle (CLAUDE.md open decision).
- Homebrew's default `node` (26) and `node@22` fail to start on Nick's Mac (missing `libsimdjson.33.dylib`) as of 2026-11-15. `node@24` runs, and 24 is what this repo pins (`.nvmrc`, `ci.yml`). Run every local command with `PATH=/opt/homebrew/opt/node@24/bin:$PATH`; the spike's 12 tests pass that way. Fixing the default `node` is outside this work.

## 3. Goals

1. A consumer can run `npx shadcn add <registry>/r/ag-ui-chat.json`, wire it to any AG-UI client, and get a working chat with tool results, an approval gate and a presence chip, using only registry components.
2. `permission-prompt` can never be closed without its caller hearing an answer.
3. `permission-prompt` shows the final arguments of a call whose arguments arrived while it was open.
4. The docs site has a `/copilotkit` page that shows all of the above through CopilotKit, without CopilotKit's own UI or stylesheet.

## 4. Non-goals

- CopilotKit as a dependency of any registry item.
- Replacing or changing `generated-chat` or the `/generated-chat` AI SDK path.
- Thread persistence, multiple threads, or a thread list backed by the runtime.
- Standing grants for "Always allow".
- A model-backed agent (follow-up, section 11).
- LifeOS, MDS, Swift.

## 5. Anti-goals

- A consumer who does not add `ag-ui-chat` gets a new dependency. This includes `@ag-ui/core` leaking into a component item.
- Telemetry on in the deployed docs site.
- Any way to dismiss an approval gate that leaves the agent waiting with no answer.
- A second implementation of a registry component inside the demo (blocks compose; they do not implement).

## 6. Approaches

|                                | What ships                                                 | Trade-off                                                                                                                     |
| ------------------------------ | ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| A. Docs demo only              | A cleaned-up `/copilotkit` page and a wiring write-up      | Cheapest and zero consumer cost, but nothing is installable; consumers copy glue code.                                        |
| **B. AG-UI lib item (picked)** | `ag-ui-chat` on `@ag-ui/core`, CopilotKit only in the demo | Installable and runtime-neutral, light dependency. The consumer still writes the few lines that connect their client's hooks. |
| C. CopilotKit lib item         | A hook wrapping CopilotKit that returns `ChatShell` props  | Fastest for CopilotKit users, but every consumer who adds it gets about 513 packages and telemetry, tied to CopilotKit 1.x.   |

B was picked because it keeps the registry protocol-level, as `generated-chat` is message-format-level, and puts the heavy client choice in the consumer's hands.

## 7. Design

### 7.1 `ag-ui-chat` (`registry:lib`, `lib/ag-ui-chat.tsx`)

Manifest entry in `lib/lib.manifest.ts` (main session writes it, never a subagent): `shadcn: []`, `npm: ["@ag-ui/core"]`, `target: "lib/ag-ui-chat.tsx"`.

Grown from the spike's `adapter.ts`, with everything specific to the runs fixture removed. It exports:

- **`toTurns(messages)`**: folds AG-UI `Message[]` into the turns `ChatShell` renders. Consecutive agent messages in one reply become one assistant turn of ordered pieces (text or tool call); a tool result attaches to its call and draws no turn of its own; a new user message starts a new turn. Same behaviour the spike's tests pin.
- **`pendingToolCall(messages, isGated)`**: the newest tool call with no result yet whose name passes `isGated` (a predicate or a list of names). Replaces the spike's `pendingRetry`, which hard-coded one tool.
- **`presenceFor({ running, awaitingApproval, acting })`**: maps run state to an `AgentPresence` state. Awaiting approval is `needs-you` above everything else; not running is `idle`; running and `acting` is `acting`; otherwise `watching`. Which work counts as acting is app knowledge, so the caller passes a boolean rather than the lib reading agent state.
- **`useAnswerOnce(respond)`**: wraps a client's respond function so the first answer is sent and every later one is dropped. The spike needed this because a dialog can report more than one way of closing.
- The turn and piece types.

It imports no CopilotKit package and no `@ag-ui/client`. The header comment says which client hooks it was proven with (CopilotKit 1.87 headless) and shows the few lines that connect them.

### 7.2 `permission-prompt` fixes (N8)

1. **Every dismissal answers.** If the dialog closes by any path other than the four verbs (Escape today; anything Base UI adds later), `onDeny` fires, exactly once per opening. A verb that already answered does not also fire `onDeny`. Deny keeps its current meaning: safest, reports the refusal.
2. **Arguments follow the call until the human starts editing.** While the editor is closed, `editedValues` follow the latest `args`. Once the human opens Edit first, their edits win and later `args` changes do not overwrite them.

Both ship with tests and a case story each (`story-conventions.md`). The declared states (`allow-once`, `always-allow`, `deny`, `edit-first`) do not change. The a11y and story-coverage baselines may not grow.

### 7.3 The `/copilotkit` demo

- Moves out of `components/copilotkit-spike/` into a demo folder named for what it is, following the `/generated-chat` layout. Every "SPIKE" label goes.
- Keeps the scripted runs agent, the runtime route at `/api/copilotkit` and the `retry_runs` approval story, now built on `ag-ui-chat` imported from the registry.
- CopilotKit packages stay in `apps/docs/package.json` only, with the spike's pins (`@ag-ui/client` and `@ag-ui/core` 1.0.2, `rxjs` 7.8.1) unless a newer matched set typechecks.
- Telemetry is off wherever the docs site runs, including a Vercel deploy, not only through the git-ignored local env file.
- The page says plainly that the agent is scripted and no model is called, and that "Always allow" approves once.
- `robots: { index: false }` stays until Nick decides to list it.

### 7.4 Tests

- `ag-ui-chat.test.tsx`: the spike's adapter tests, generalized, plus `pendingToolCall` with a predicate and a list, `useAnswerOnce`, and the two compile-time checks from call 6.
- The consumer install test installs everything at once, so it cannot catch a lib item that secretly needs a sibling. Add a check (in the test or the contract gate) that `ag-ui-chat.tsx` imports only `@ag-ui/core` and React.
- `permission-prompt` tests for both fixes.
- The scripted agent's tests move with the demo.
- A Playwright smoke for `/copilotkit`: ask, approve an edited call, and check Escape reports a deny.
- The consumer install test covers `ag-ui-chat` like any lib item.

## 8. Constraints

- The CLAUDE.md map and the contracts it points at, especially: lib manifest hand-maintained by the main session; file plus test pair for a lib item; `pnpm build:registry` after any registry change; no `text-muted-foreground` on muted surfaces; never grow an a11y or story-coverage baseline.
- CI gate order from `ci.yml`. A red consumer test is a shipping bug.
- Branch per task, never push to `main`. Pushing and any deploy wait for Nick's yes, with repo (VV-DSGN-INC/Super-AI-Components) and branch named out loud. Deploys are manual from `apps/docs` with the `weeeha` account.
- Prose in the page and PR: no em dashes, no exclamation marks.

## 9. Success criteria

- `npx shadcn add .../r/ag-ui-chat.json` into a fresh app installs one file and `@ag-ui/core`, and nothing else.
- All twelve CI steps pass.
- On `/copilotkit` in Chrome and Safari: text streams, the read tool's rows render, the gate opens, an edited approval retries only the chosen runs, Escape reports a deny, the presence chip moves through needs you, acting and idle, and the console is clean.
- CopilotKit telemetry is off in every process that serves `/api/copilotkit`, local or deployed. Telemetry is sent by the runtime on the server, so a browser network panel cannot see it; the check is that the runtime's own gate (`isTelemetryDisabled()` in `@copilotkit/runtime`'s telemetry client, which reads `COPILOTKIT_TELEMETRY_DISABLED` and `DO_NOT_TRACK` at call time) returns true, pinned by a unit test.

## 10. Left to the builder

- Exact export names beyond those above, and whether the hook lives in the same file (the contract allows one file per lib item, so it does unless that breaks a gate).
- The demo folder name and its nav placement, following `/generated-chat`.
- How telemetry is switched off for deploys (env in the Vercel project, `next.config.ts`, or the runtime's own option), as long as section 9's telemetry check passes.
- The `@ag-ui/core` version range in the emitted registry item.

## 11. Follow-ups, not in this work

- A model-backed AG-UI agent behind the same page (the repo's `/generated-chat` model path and AI Gateway are the starting point; no paid Google AI).
- Thread persistence through the runtime.
- Standing grants with a revoke surface (N9).

## Changelog

- 2026-11-15: first draft.
- 2026-11-15: after the builder check. Added call 6 (no sibling imports, compile-time drift checks) and the import-only test; recorded that `node@24` runs while the default `node` is broken.
- 2026-11-15: while planning. The telemetry success check moved from the browser network panel to the runtime's own gate, because CopilotKit sends telemetry from the server.
