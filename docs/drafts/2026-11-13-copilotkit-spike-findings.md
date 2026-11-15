# CopilotKit spike: findings

2026-11-13, branch `claude/copilotkit-spike`. Exploration only, not planned for release.

## TL;DR

CopilotKit's headless hooks can drive the registry components with no CopilotKit UI and no CopilotKit stylesheet. It handles the agent connection, streaming, tool calls and the approval pause. It costs about 513 packages and has telemetry on by default, and it would be a second agent runtime next to the AI SDK. That only pays off if AG-UI agents (LangGraph, CrewAI, Mastra and similar) need to drive these components. The spike also turned up one real bug in `permission-prompt` that applies to any runtime.

## What was built

- `scripted-agent.ts`: an AG-UI agent with no model and no key. It replays the `/generated-chat` fixture story ("what failed overnight"): read the runs, list the timed-out ones, then ask before retrying them, because retrying spends credits.
- `app/api/copilotkit/[[...slug]]/route.ts`: CopilotKit's runtime serving that agent.
- `copilotkit-demo.tsx`: `useAgent`, `useRenderTool` and `useHumanInTheLoop` driving `ChatShell`, `EntityRow`, `PermissionPrompt`, `AgentPresence` and `SuggestionChips`.
- `adapter.ts`: maps AG-UI messages to `ChatShell` turns and picks the `AgentPresence` state.
- Page at `/copilotkit` (not indexed). 12 unit tests across the agent and the adapter.

## Seen working in the browser

- Text streams in word by word.
- The read tool's result renders as `EntityRow`s.
- The retry call pauses the agent and opens `PermissionPrompt`.
- "Edit first" with one run id retries only that run and reports its cost.
- Escape counts as a deny (the spike adds this; see below).
- The presence chip goes from "needs you" to "idle".
- No console errors.

## Gaps found in our components

1. **Escape closes `permission-prompt` without calling `onDeny`.** An agent waiting on the answer never gets one. The spike works around it with `onOpenChange(false)` treated as a deny. Worth fixing in the component whatever runtime is used.
2. **`editedValues` is read from `args` once, at mount.** If the prompt mounts while the tool arguments are still streaming, the edit fields keep the partial values. The spike mounts the prompt only once `respond` exists (the arguments are complete). Any streaming runtime runs into the same thing.
3. **"Always allow" has nowhere to store a grant.** The spike treats it as a one-time approval. A standing grant needs a store and a way to revoke it (N9).

## Cost

- `@copilotkit/react-core` and `@copilotkit/runtime` 1.87.0 added about 513 packages; the lockfile grew by about 5,200 lines.
- Pins needed for a clean typecheck: `@ag-ui/client` and `@ag-ui/core` 1.0.2, `rxjs` 7.8.1. Mixed versions gave duplicate `Observable` types.
- Telemetry is on by default. Switched off here with `COPILOTKIT_TELEMETRY_DISABLED` and `DO_NOT_TRACK` in the git-ignored `apps/docs/.env.development.local`. `@scarf/scarf` (install analytics) was blocked in `pnpm-workspace.yaml`.
- A runtime clones agents and skips class field initializers, so agent config has to live outside the class (see `STEP_MS`).

## How it fits the projects

- **Super-AI-Components:** possible later, as a headless runtime under the registry, if AG-UI agents become a real need. Shipping it through `shadcn add` would put the full dependency weight on every consumer, so a docs-only adapter or a separate optional package is the safer shape.
- **LifeOS:** no fit today. The mobile app is a SwiftUI template and CopilotKit has no Swift SDK.
- **Minimal Design System:** no fit. It has no agent layer.

## Not checked

Safari, a real model, a production build, bundle size, the Storybook a11y gate, thread persistence across reloads. `format:check` fails on 19 files that are also failing on `main`, which was not confirmed.
