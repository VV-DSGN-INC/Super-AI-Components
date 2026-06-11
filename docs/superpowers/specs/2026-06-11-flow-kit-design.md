# Flow Kit — wave-level design spec (master waves 2–4)

_2026-06-11 · status: approved in session, pending spec review · child of [2026-06-10-super-ai-components-design.md](2026-06-10-super-ai-components-design.md) §Flow Kit / §11 waves 2–4 · component-level detail in [docs/flow-kit-inventory.md](../../flow-kit-inventory.md)_

## Summary

Ship the **Flow Kit** — 25 components + `useFlowRunner` — as registry items in the Super-AI-Components monorepo, plus a full Flows-style demo canvas in the docs app. The kit extends AI Elements' `canvas`/`node`/`edge` (L1) with the creation-tool layer: typed ports, run states, model/param bars, media slots, modality presets, palette, omnibar, inspector. This spec covers master waves 2–4 executed as one combined effort, per brainstorm decision.

## Decisions (locked in brainstorm, 2026-06-11)

| Decision     | Choice                                                                                              |
| ------------ | --------------------------------------------------------------------------------------------------- |
| Build target | Component kit + demo — the registry is the product                                                  |
| Scope        | All of F1–F3 (master waves 2, 3, 4 combined)                                                        |
| Demo realism | Stub-first; real providers activate per env key                                                     |
| Sequencing   | Flow Kit before Wave 1 (App Shell); requires **Wave 0 complete** (in flight on `wave-0-foundation`) |
| Execution    | Subagent-driven, wave-parallel, on a branch cut from Wave 0's result                                |

## Conformance to the master spec

This wave inherits, without restating: the L0–L4 layer model, the token/state/approval/cost contracts, API conventions (compound `Root/Item` style, controlled + uncontrolled, `on*` callbacks, no fetching, `className` via `cn()`, `data-slot` per part, kebab files / Pascal exports), registry mechanics (§7), dev workflow + per-component definition of done (§9), and the Wave 0 plan's recorded deviations (registry sources in `apps/docs/registry/super-ai/`, relative sibling imports, `REGISTRY_URL`-aware `gen-registry.mts`).

Flow-specific applications:

- **Layer mapping.** Master rule: L3 components never depend on each other; shared pieces get promoted. Applied: **wiring (4) + node anatomy (6) + `flow-types` + `useFlowRunner` are flow primitives (L2)**; the 10 modality presets and 5 chrome components are L3 and may depend on flow L2 + L1 + L0 only. No L3→L3 edges anywhere in the kit.
- **State contract.** The kit adopts the master vocabulary `idle | queued | streaming | done | failed | locked` verbatim. The inventory's `running` ⇒ `streaming`, `error` ⇒ `failed`. `locked` = entitlement-gated node (e.g. video generation on a free plan — the ElevenLabs pattern), rendered as CTA-replaced card per the contract.
- **Token contract.** The inventory's `--flow-*` type/execution colors (with light + dark values) are defined once in the docs app's `globals.css` and shipped to consumers via the `flow-types` registry item (`registry:lib` carrying a CSS fragment + TS). Component sources contain zero raw colors; `check:tokens` enforces.
- **Cost contract.** `run-button` accepts optional `cost` props rendered as a hover chip (the ElevenLabs Run-hover pattern); no credits system in the demo.
- **Shared engines.** `model-bar` is the node-docked presentation of the `gen-settings-bar` segment engine (L2, shipped in Wave 0) — one engine, two presentations; flow adds the `loop ∞ / Auto / percent / thinking ✨` segment types to that engine rather than forking it. `node-prompt` shares mention-chip machinery with `context-chips` when Wave 1 lands; until then it owns a minimal chip renderer behind the same props.
- **Sources layout:** `apps/docs/registry/super-ai/flow/<item>.tsx` + colocated `<item>.test.tsx`, install target `components/super-ai/flow/`; cross-kit imports (e.g. `../gen-settings-bar`) resolve identically pre- and post-install. The plan's first task verifies this mechanically with one probe item.

## Deviation from master defaults (flagged for review)

The master spec set `useFlowRunner` v1 = naive full-graph topological runs, "output caching later." **This wave upgrades caching to in-scope.** Rationale: the 2026-06-11 ElevenLabs Flows docs review established _partial generation_ (edit one node → only it + dirty downstream re-run) as the product's core economic behavior, not polish — every reference product meters generation. Cache = output hash keyed on (node data + upstream output ids); cheap to build into the runner now, disruptive to retrofit.

All other master defaults stand: plain names, no `flow-` prefix; edge color derives from source handle; `node-prompt` standalone; `track-timeline` view-only with per-track mute.

## `useFlowRunner` (flow L2, headless)

```ts
const runner = useFlowRunner({
  nodes, edges,
  execute: (node, inputs, signal) => Promise<NodeOutput>,   // consumer-supplied
  onStatus: (nodeId, status) => void,                        // contract states
})
runner.run() · runner.runNode(id) · runner.runFrom(id) · runner.runSelection(ids) · runner.stop()
```

Topological order; dirty-tracking cache (above); AbortController fan-out on `stop`; branch-local failure (a failed node halts only its downstream, independent branches finish); status events drive `node-status` and `run-controls` progress ("3/7 · 1 failed").

## Provider layer (demo app only — components never fetch)

Six routes in the docs app, one interface:

```ts
interface GenerateAdapter {
  kind: "image" | "video" | "speech" | "sfx" | "music" | "llm";
  generate(req: GenerateRequest, signal: AbortSignal): Promise<GenerateResult>;
}
```

- **Stub adapter (default, zero keys):** 800–2500 ms simulated latency, deterministic bundled placeholder media, scripted failure mode behind a flag for demoing `failed` states.
- **Real adapters per env key:** `ELEVENLABS_API_KEY` → speech/sfx/music · `AI_GATEWAY_API_KEY` → image + llm (gateway `"provider/model"` strings) · `FAL_KEY` → video. `GET /api/generate/status` feeds the `env-status` pill (stub vs live providers).
- Errors normalize to `{ code, message }` → node `failed` state with inline banner.

## Omnibar agent (demo wiring; `canvas-omnibar` itself is UI-only)

AI SDK v6 tool-call loop returning typed graph mutations (`addNode | updateNode | connectNodes | removeNode`), validated against the handle-type registry before apply. Permission modes per the ElevenLabs Flows Agent: `approve-each` (default — mutations preview as a chip with Apply/Discard) and `auto-run`. No LLM key → scripted fallback matching canned intents ("add background music", "add narration", "animate this image") so the omnibar always demonstrates.

## Demo

`apps/docs` route `/flow`: seeded Luxury Perfume graph (2 images → combine → video; text → tts; sfx + music → composition with video + 3 audio tracks), both palette variants, omnibar, inspector, run-controls, env-status, minimap, light/dark, localStorage persistence (`flow-kit-demo`), reset-to-seed. Per-component doc pages follow the Wave 0 catalog pattern (live demo, install command, props, states showcase).

## Testing (per master §9 + DoD)

- **Vitest behavior tests, colocated:** handle-type validation matrix · runner topology/cache-hits/cancellation/branch-failure · model-bar segment value states (incl. Auto/percent/toggles) · omnibar mutation validation · composition track rendering.
- **Playwright:** docs-pages smoke (render, no console errors) + one flow journey: palette-add → typed connect → run-all on stubs → composition shows tracks → one failure path renders banner.
- **CI additions ride the existing pipeline** (lint → typecheck → tokens → test → registry build → consumer install test → smoke); the consumer install test gains one flow item (`ai-node`) to prove the AI Elements cross-registry chain resolves.

## Non-goals (v1)

Real-time collaboration & comments · template gallery/sharing scopes · credits/billing UI · timeline editing (view-only + mute) · lipsync & upscale nodes (v2 candidates) · API flow execution · mobile layout.

## Success criteria

1. Zero keys: `/flow` runs the perfume graph end-to-end on stubs.
2. Consumer install test: `npx shadcn add <url>/r/ai-node.json` into a fresh Next app compiles, with AI Elements deps auto-resolved.
3. All 25 components: DoD complete (states · tokens clean · behavior test · demo page · doc entry · registry entry).
4. Adding `ELEVENLABS_API_KEY` alone makes tts/sfx/music generate real audio, no code changes.
5. CI fully green including the flow Playwright journey.

## Build sequencing (input to the implementation plan)

0. **Gate:** Wave 0 merged (branch `wave-0-foundation`, in flight in a parallel session — its files are not touched by this wave; flow work branches from its result).
1. **Phase A — sequential, one agent:** `flow-types` (type registry + tokens + CSS) · `gen-settings-bar` segment-type extensions · AI Elements cross-registry dependency wiring + `@xyflow/react` dep + layout probe item.
2. **Phase B — parallel:** flow L2 — wiring (4) + anatomy (6) + `useFlowRunner`, grouped ~7 agent tasks by cohesion (typed-handle/typed-edge/port-chip together; ai-node/node-status together; runner alone).
3. **Phase C — parallel:** L3 presets (10) · L3 chrome (5) · provider routes + omnibar agent + seed graph (3). Depends only on Phase B.
4. **Phase D — integration agent:** `/flow` demo assembly, doc pages, Playwright journey, states-matrix QA pass, consumer install test extension.

Each agent's contract: this spec + its inventory entry + the master conventions. The integration agent owns cross-component consistency.
