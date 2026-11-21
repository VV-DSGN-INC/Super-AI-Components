# Decisions, 2026-11-21 (CopilotKit and OpenUI update)

Each line is a choice made without Nick, with its reason. Nick asked for recommended decisions without waiting. The agentic infra wave 1 decisions of the same day are on `build/agentic-infra-wave-1`.

1. "Update it to CopilotKit and to OpenUI" is read as: bring both runtimes the repo already integrates to their current releases, not move the registry components onto them. OpenUI is already on `main` at `0.3.2` (current `1.1.1`) and CopilotKit is already built on `feat/ag-ui-chat` at `1.87.0` (current `1.90.0`); a move of every component would push about 513 CopilotKit packages onto each `shadcn add` consumer, which the spike findings advise against.
2. The branch is cut from `feat/ag-ui-chat` `7ea238be`, not from `main`: that branch holds the CopilotKit spike, spec, plan and the `ag-ui-chat` build, already contains `origin/main`, and merges cleanly into it.
3. CopilotKit stays on 1.x (`1.90.0`): `2.0.0-rc.68` is a release candidate shipping about one rc a day, with no migration guide yet.
4. AG-UI moves to `1.0.5` exactly, because CopilotKit 1.90 pins `@ag-ui/client` 1.0.5 and mixed versions gave duplicate `Observable` types in the spike.
5. Version facts come from npm and the official changelogs read on 2026-11-21 (`docs/drafts/2026-11-21-copilotkit-openui-releases.md`), not from memory.
6. The product check (build, smoke, consumer install) is run by the controller rather than an executor, so its verdict is first-hand.
