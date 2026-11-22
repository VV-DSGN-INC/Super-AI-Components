# Decisions, 2026-11-21 (CopilotKit and OpenUI update)

Each line is a choice made without Nick, with its reason. Nick asked for recommended decisions without waiting. The agentic infra wave 1 decisions of the same day are on `build/agentic-infra-wave-1`.

1. "Update it to CopilotKit and to OpenUI" is read as: bring both runtimes the repo already integrates to their current releases, not move the registry components onto them. OpenUI is already on `main` at `0.3.2` (current `1.1.1`) and CopilotKit is already built on `feat/ag-ui-chat` at `1.87.0` (current `1.90.0`); a move of every component would push about 513 CopilotKit packages onto each `shadcn add` consumer, which the spike findings advise against.
2. The branch is cut from `feat/ag-ui-chat` `7ea238be`, not from `main`: that branch holds the CopilotKit spike, spec, plan and the `ag-ui-chat` build, already contains `origin/main`, and merges cleanly into it.
3. CopilotKit stays on 1.x (`1.90.0`): `2.0.0-rc.68` is a release candidate shipping about one rc a day, with no migration guide yet.
4. AG-UI moves to `1.0.5` exactly, because CopilotKit 1.90 pins `@ag-ui/client` 1.0.5 and mixed versions gave duplicate `Observable` types in the spike.
5. Version facts come from npm and the official changelogs read on 2026-11-21 (`docs/drafts/2026-11-21-copilotkit-openui-releases.md`), not from memory.
6. The product check (build, smoke, consumer install) is run by the controller rather than an executor, so its verdict is first-hand.
7. The CopilotKit runtime, core and shared packages are overridden to zod 4.4.3 in `pnpm-workspace.yaml`, with `@ag-ui/*` held at 1.0.5 and rxjs at 7.8.1. Without it the tree held two `@ag-ui/client` builds and the agent types stopped matching. The smoke drives `/copilotkit` end to end on this override. Remove it when the runtime accepts zod 4. Overrides do not reach consumers.
8. OpenUI 1.x errors are owned by the component: `Renderer` gets a no-op `onError` where the component already shows its failed state, rather than letting 1.x log to the console. No public prop was added.
9. The `onError` handlers own only parser errors (`source` `parser`), the kinds `failuresOf` already shows as the failed state; every other error is logged in the 1.x format. The fallback renderer logs every error, because the last good version should have none. Logging rather than rethrowing, because `Renderer` calls the handler from an effect and a throw there takes the page down.

## Postponed

- `format:check`: 18 files fail identically on `origin/main`; a format-only change, separate from this update.
- CopilotKit 2.0: wait for a release, not a release candidate.
- Removing the zod 4 override in `pnpm-workspace.yaml`, once the CopilotKit runtime accepts zod 4.
- A real model behind `/copilotkit` and a Safari pass: not run here.
- Push, PR and merge order (`feat/ag-ui-chat` first, this branch on top): Nick's call.
