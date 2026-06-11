# Super-AI-Components — Design Specification

**Date:** 2026-06-10
**Repo:** https://github.com/weeeha/Super-AI-Components
**Status:** Approved design, pending final review

## 1. Overview

Super-AI-Components is a public shadcn registry of React components for building AI products. It is a **companion registry to Vercel's AI Elements** (the shadcn-based AI library at elements.ai-sdk.dev): AI Elements owns the conversation pane; Super-AI-Components builds everything around and beyond it — app shells, creative studios (writing, image, audio, video), generation surfaces, libraries, feedback/eval loops, observability, RAG management, and monetization UI.

> **Positioning:** AI Elements gives you the conversation. Super-AI-Components gives you the application.

The catalog was derived from a systematic decomposition of real AI products: ElevenLabs (Creative + Studio 3.0), Spline, Midjourney, Freepik/Flows-style node canvases, Topaz Video AI, Canva, getimg-style generation panels, and Sprig's AI survey agent. Every component traces back to observed product anatomy, not speculation.

## 2. Goals and audience

Three goals, in priority order:

1. **Public open-source registry** — anyone installs components via `npx shadcn add @super-ai/<name>`.
2. **Dogfooded toolkit** — used in the author's own AI projects.
3. **Portfolio piece** — the docs/demo site demonstrates design + engineering quality.

Success criteria: components install cleanly into a fresh shadcn app, inherit the host theme with zero configuration, compose with AI Elements without duplicating it, and pass the consumer install test in CI.

## 3. Relationship to AI Elements

**Decision: companion registry, not fork, not superset.**

- AI Elements components are referenced via **cross-registry dependencies**, never copied. Installing `@super-ai/chat-empty-state` may pull `@ai-elements/suggestion` automatically.
- We never rebuild what AI Elements ships (48 components as of June 2026: conversation, message, prompt-input, reasoning, tool, sources, canvas/node/edge, context, queue, task, plan, model-selector, voice inputs, etc.).
- Overlap audits are part of the component workflow: before building, check the AI Elements catalog; compose where possible.
- Contained risk: shadcn components are copied into consumer apps, so upstream API changes affect new installs only, never running apps.

## 4. Design principles (derived patterns)

Thirty-seven patterns observed across real AI products. These are binding design rules for the catalog.

### Generation and asset lifecycle
1. The model+params settings strip is universal — one primitive (`gen-settings-bar`), embedded everywhere (nodes, prompt bars, detail views).
3. Provenance travels with every asset — prompt, model, params, age follow the artifact (recipe card pattern).
7. Everything previews inline — waveforms in rows, frames in slots; no asset row without a glanceable preview.
8. Save-to-library is universal — every result component exposes save/favorite callbacks.
9. The asset lifecycle is the spine of creative AI apps: generate → result → library → referenced back into new prompts.
20. Failure is a first-class state, rendered inline where the result would have been — never only a toast.
34. Heavy media work is staged and visible: input → preview → export pipelines.

### Money
6. Credits surface at the point of spend — embeddable chips, not buried billing pages.
12. AI pricing is quota pricing — GPU-hours, concurrency, speed tiers, commercial terms; not seats.
13. Gate at the point of creation — the prompt bar itself becomes the paywall (`locked` state).
19. Cost disclosure has three forms: persistent ring, per-action chip, pre-action line.
30. Cost confirmation precedes commit — "Need 4 credits, you have 55" beside the Generate button.
33. Preview-before-commit economics — cheap samples (15s preview render) before expensive full runs.

### Selection and objects
4. Cross-tool handoff is the signature interaction — action stacks chain tools ("Extend → Upscale → Use in Lip sync").
21. AI actions attach to objects, not just chats — the selection is the prompt context.
22. Editor fields carry units — %, s, × suffixes in compact inputs paired with sliders.
28. Selection surfaces form a family: floating toolbar (quick) + inspector (deep) + AI tools menu (AI).
35. The four verbs of artifact approval: Confirm · Edit · Regenerate · Skip.
36. AI edits arrive as track changes with rationale — on any structured artifact, not just prose.
37. The composer is a context-assembly surface — selections become quotes, entities become chips, @-mentions resolve to references.

### Parameters and pickers
5. Parameters speak human — "More variable ↔ More stable", never raw floats.
25. Visual parameters get visual pickers — preview chips with selection rings, never dropdowns.
26. Media models are organized by task signature (text→video, image→video) with conditioning badges.
27. Local vs cloud is first-class UI — runtime pills and hardware requirements on model cards.
29. Parameters teach inline — one-line explanations under sliders.
31. AI enhancement is a module stack — named, purpose-tagged models toggled per feature.

### Layout and shell
2. Announcements come in three sizes (modal, anchored popover, inline card) plus a changelog variant.
11. Announcement heroes can embed live components.
17. Modality tool panels share one anatomy: search → curated/explore → history → docked prompt box.
18. The agent moved into the workspace — docked copilot panels, not just standalone chat apps.
24. Pro tools earn keyboard UI — shortcuts cheatsheet and keycap chips are table stakes.
32. Compare is a workspace mode — labeled panes, view-mode toggles, synced transport.

### Finding and sharing
10. Filter bars are a shared primitive — category chips, add-filter chips, filter button.
14. Date is the universal grouper — threads, generations, inboxes.
15. Two galleries, two jobs — personal archive (dense, faceted) vs community explore (masonry, trending).
16. Filtering has a scale ladder — chips for libraries, faceted rail with saved searches for power archives.
23. Access is a matrix, not a toggle — separate scopes (workspace/public), each with levels.

## 5. Catalog

Three tiers: **primitives** (shared DNA), **components** (leaf installables), **blocks** (composed templates). Stretch items marked `*` ship last within their wave.

### Primitives (7)

| Name | One-liner |
|---|---|
| `field-row` | Label + control row: slider with unit-input (%, s, ×), select, toggle, color; the inspector DNA |
| `choice-chips` | Ring-selected chip group; numeric, text, and preview-content variants |
| `filter-bar` | Category chips + add-filter chip + filters button |
| `gen-settings-bar` | Compact model · aspect · resolution · duration · batch strip |
| `date-section` | Date-grouped section headers for lists and grids |
| `kbd` | Keycap chip |
| `cost-chip` | Per-action credit cost ("17 credits", "900 credits/min") |

### App Shell & Navigation (13)

| Name | One-liner |
|---|---|
| `app-sidebar` | Assembled product sidebar on shadcn sidebar: switcher top, nav, promo, footer links |
| `workspace-switcher` | Avatar/logo + name dropdown; workspace and multi-product variants with description rows |
| `sidebar-nav` | Sectioned icon+label nav: badges, dots, pinned groups, overflow item |
| `promo-card` | Sidebar CTA card (upgrade / invite variants) |
| `thread-list` | Date-grouped conversations: pin, inline rename, delete-confirm, active/unread |
| `thread-search` | ⌘K dialog across threads and messages |
| `chat-header` | Title, model badge, share trigger, panel toggles |
| `chat-empty-state` | Welcome hero with suggestion chips (composes `@ai-elements/suggestion`) |
| `share-dialog` | People search, invite row, scoped access matrix, copy link; conversation + project flavors |
| `feature-announcement` | Modal / popover / inline-card / changelog variants; version + stage badges; dual CTA |
| `shortcuts-sheet` | Sectioned shortcuts cheatsheet built on `kbd` |
| `agent-panel` | Docked copilot: header + modes (Create/Plan), empty state, history; composes AI Elements conversation |
| `credits-indicator` | Persistent credits ring/counter for top bars |

### Composer & context (3)

| Name | One-liner |
|---|---|
| `media-prompt-bar` | The media-gen omnibox: mode tabs, typed ref slots (start/end frame, refs), preset chips, negative prompt, settings strip, credits, @-mentions, `locked` state; floating + docked variants |
| `quote-reply` | Select content → Reply → quoted context block in composer |
| `context-chips` | Removable entity/range/file reference chips in the composer |

### Writing kit (6)

| Name | One-liner |
|---|---|
| `selection-toolbar` | The ✨ menu on selected text: improve, shorten, expand, tone |
| `inline-suggestion` | Ghost-text completion with Tab-to-accept |
| `diff-review` | Inline accept/reject track changes with per-change rationale slot |
| `rewrite-panel` | N alternative rewrites side-by-side |
| `outline-builder` | AI outline with drag-reorder and expand-section |
| `tone-selector` | Tone/length chips |

### Image kit (7)

| Name | One-liner |
|---|---|
| `generation-grid` | Batch gallery with date sections, vary/upscale/save actions, failed cards |
| `generation-queue` | Pending slots with progress shimmer |
| `generation-detail` | Lightbox: media viewer + metadata rail (prompt, model, specs) + handoff action stack |
| `style-picker` | Style preset chips with thumbnails |
| `palette-picker` | Palette chips of color-dot previews |
| `brush-controls` | Tool toggles, size slider, swatch grid, custom color |
| `inpaint-canvas`* | Brush-mask editor over an image |

### Video kit (8)

| Name | One-liner |
|---|---|
| `storyboard` | Scene/shot cards with per-shot prompts |
| `shot-controls` | Camera motion/angle/duration chips |
| `video-gen-card` | Generation progress with frame previews |
| `transcript-editor` | Edit video by editing text |
| `frame-picker` | Keyframe/thumbnail strip selector |
| `timeline-editor`* | Multi-track timeline: ruler, filmstrip/waveform/text tracks, playhead, in/out ranges, per-track mute |
| `enhancement-stack` | Toggleable AI post-processing modules with per-module params and purpose-tagged models |
| `render-queue` | Staged jobs: inputs → preview renders → exports, spec-carrying rows |

### Audio kit (6)

| Name | One-liner |
|---|---|
| `tts-composer` | Script editor with per-segment voice + emotion tags |
| `music-brief` | Genre/mood/tempo/duration controls |
| `waveform-editor` | Editor-grade waveform: regions, scrub, zoom |
| `stem-mixer` | Track lanes with mute/solo/volume |
| `track-list` | Library table: artwork, tags, inline waveform, BPM; compact results variant with favorite |
| `voice-clone-recorder`* | Guided sample recording |

### Media shared (2)

| Name | One-liner |
|---|---|
| `compare-viewer` | Labeled numbered panes, side/single/wipe modes, synced zoom/transport; absorbs before/after slider |
| `transport-controls` | Play/skip/speed/elapsed; frame-accurate variant with timecode, frame-step, in/out |

### Flow Kit (25 + 1 hook)

The node-canvas creation surface, built on top of AI Elements' `canvas`/`node`/`edge` (extended, never forked). **Detailed component specs live in the companion document [`docs/flow-kit-inventory.md`](../../flow-kit-inventory.md)** — props, states matrix, deep specs for the five load-bearing components, and reference decompositions (Flow Builder repo, Flows light reference, Flow AI dark reference).

| Group | Items |
|---|---|
| Wiring (4) | `typed-handle` · `typed-edge` · `port-chip` · `connection-hint` |
| Node anatomy (6) | `ai-node` · `node-status` · `model-bar` · `run-button` · `media-slot` · `node-prompt` |
| Modality presets (10) | `text-node` · `llm-node` · `image-node` · `video-node` · `tts-node` · `sfx-node` · `music-node` · `composition-node` + `track-timeline` · `asset-output-node` · `reference-node` |
| Canvas chrome (5) | `node-palette` · `canvas-omnibar` · `run-controls` · `node-inspector` · `env-status` |
| Headless (1) | `useFlowRunner` — topological execution, per-node status, cancellation; UI-independent, executor-swappable |

Integration notes: `model-bar` is the node-docked presentation of the `gen-settings-bar` segment engine (one engine, two presentations). `tts-node` shares the voice row with `tts-composer`; `node-prompt` shares mention-chip machinery with `context-chips`. `env-status` complements `credits-indicator` (reachability vs spend).

Decisions on the inventory's open questions (defaults, revisitable at wave planning): registry-scoped plain names under `@super-ai` (no `flow-` prefix); edge color derives from source handle in v1; `node-prompt` is standalone rather than built on AI Elements' chat-shaped `prompt-input`; `track-timeline` ships view-only with per-track mute; `useFlowRunner` v1 does naive full-graph topological runs (output caching later).

### Model & object tooling (5)

| Name | One-liner |
|---|---|
| `model-card` | Sample-output hero, runtime + conditioning badges, requirements footer; grouped by task signature |
| `parameter-panel` | Generation params: plain-language slider endpoints, inline education, picker rows, reset |
| `property-inspector` | Object styling rows (font, size, alignment, color, animation) on `field-row` |
| `ai-tools-menu` | Object-scoped AI actions: icon + title + description rows |
| `context-toolbar` | Selection-following floating toolbar; type-specific variants with embedded AI actions |

### Feedback & evals (6)

| Name | One-liner |
|---|---|
| `feedback` | Thumbs + reason popover + submitted state |
| `model-compare` | Side-by-side responses, synced scroll, vote bar |
| `response-diff` | Word-level diff of two responses |
| `review-queue` | Human-in-the-loop queue: list + detail + verbs |
| `approval-card` | Single-artifact approval: Confirm/Edit/Regenerate/Skip + truncated detail |
| `eval-board` | Score cards + pass/fail matrix |

### Agent observability (5)

| Name | One-liner |
|---|---|
| `trace-timeline` | Waterfall of steps/tool calls/LLM calls |
| `run-inspector` | Span detail: I/O, tokens, cost, errors |
| `usage-dashboard` | Aggregate cost/token/latency cards |
| `memory-viewer` | Browse/edit agent memory with provenance |
| `agent-board` | Multi-agent fleet status grid |

### RAG & knowledge (4)

| Name | One-liner |
|---|---|
| `ingestion-dropzone` | Upload with per-file pipeline status (parsing → chunking → embedding → ready/failed) |
| `knowledge-base` | Document flavor of `asset-library` with ingestion-status columns |
| `retrieval-inspector` | Query → ranked chunks with scores |
| `chunk-highlighter`* | Source doc with chunk boundaries highlighted |

### Library & discovery (3)

| Name | One-liner |
|---|---|
| `asset-library` | Header actions, search, filter chips, list/grid toggle, folder+file table, row menus |
| `filter-panel` | Faceted rail: checkbox groups, see-more, collapsible sections, saved searches |
| `explore-gallery` | Masonry community feed with sort tabs and type pills |

### Monetization (4)

| Name | One-liner |
|---|---|
| `pricing-table` | Billing toggle + plan cards: anchor pricing, quota/concurrency feature rows with emphasis and info tooltips |
| `quota-meter` | Plan usage + reset countdown |
| `credit-balance` | Balance + top-up |
| `rate-limit-banner` | Cooldown countdown |

### Blocks (4)

| Name | One-liner |
|---|---|
| `app-shell` | Chat-app frame: sidebar + main + inspector panel, mobile drawer |
| `studio-shell` | Creative-studio frame: top bar, modality rail, tool panel, canvas, agent dock, timeline slot |
| `generation-panel` | SD-style side panel: mode tabs, model, prompts, params, batch, credits line, Generate |
| `tool-panel` | Modality panel recipe: search + curated/history lists + docked prompt box |

**Totals: 7 primitives + 72 components + 25 Flow Kit items + 4 blocks + 1 headless hook = 109 registry items.**

## 6. Architecture

### Consistency approach

Chosen approach: **primitives + contracts + automated checks** (over framework-izing or convention-only). Consumers copy clean, readable code; consistency is enforced by structure and CI, not abstraction.

### Layer model

- **L0** — shadcn/ui primitives via `registryDependencies`
- **L1** — AI Elements via cross-registry dependencies; composed, never copied
- **L2** — the 7 Super-AI primitives
- **L3** — the 73 components; may depend on L0–L2, **never on each other**. If two L3 components need the same piece, promote it to L2.
- **L4** — blocks; may compose anything

### Contracts

- **Token contract:** styling uses shadcn CSS variables exclusively (`--background`, `--primary`, etc.). No raw hex/oklch, no arbitrary Tailwind color values inside components. Kit-scoped semantic tokens (the Flow Kit's `--flow-*` type and execution colors) are defined once, centrally, with light and dark values, and consumed as variables. Enforced by `check:tokens`.
- **State contract:** every generation-aware component implements `idle | queued | streaming | done | failed | locked` with shared visual conventions (shimmer while streaming, inline failed card, CTA-replaced locked state).
- **Approval contract:** artifact approval surfaces expose Confirm/Edit/Regenerate/Skip callbacks.
- **Cost contract:** components that trigger spend accept optional cost props rendering as chip (per action), line (pre-commit), or defer to the app-level ring.

### API conventions

- Compound components: `ThreadList.Root`, `ThreadList.Item`, … (AI Elements style).
- Controlled and uncontrolled modes for stateful components.
- All behavior surfaced as `on*` callbacks; **no data fetching inside components**. Optional thin AI SDK v6 adapter helpers where high-value.
- `className` passthrough on every part via `cn()`; `data-slot` attributes on parts.
- Accessibility: keyboard + ARIA via underlying shadcn/Radix primitives; focus management specified per component.
- Files kebab-case, exports PascalCase, one component family per file.

## 7. Registry mechanics

- Registry definition in `packages/registry/registry.json`; `shadcn build` emits static item JSON into `apps/docs/public/r/`.
- Served from the docs deployment: `https://<docs-domain>/r/{name}.json`. Namespace alias for consumers: `@super-ai`.
- Cross-registry dependencies reference AI Elements item URLs so the shadcn CLI resolves the full chain (`@super-ai` item → `@ai-elements` item → shadcn primitive).
- Every item declares: `dependencies` (npm), `registryDependencies` (L0/L1/L2), `type` (`registry:component` / `registry:block` / `registry:lib`).

## 8. Repository structure

```
super-ai-components/
├── packages/
│   └── registry/
│       ├── src/primitives/            # L2
│       ├── src/components/<kit>/      # L3, one file per component
│       ├── src/flow/                  # Flow Kit (wiring, anatomy, presets, chrome, useFlowRunner)
│       ├── src/blocks/                # L4
│       └── registry.json
├── apps/
│   └── docs/                          # Next.js: docs, live demos, /r/*.json
├── docs/superpowers/specs/            # design specs (this file)
├── .github/workflows/ci.yml
├── turbo.json
└── pnpm-workspace.yaml
```

Stack: TypeScript, React 19, Tailwind v4 (CSS variables mode), Next.js (App Router) for docs, pnpm + Turborepo, ESLint (flat) + Prettier.

## 9. Dev workflow

- **Run:** `pnpm dev` — the docs site is the workbench; every component has a demo page developed against with hot reload.
- **Test:** `pnpm test` — Vitest + React Testing Library (jsdom), colocated `*.test.tsx`. Behavior tests for stateful components (verbs fire, rename commits, locked blocks submit); no markup-snapshot theater. Playwright smoke suite over docs pages (render + no console errors).
- **Consumer install test (CI):** scaffold a fresh Next.js app, run `npx shadcn add` against the built registry artifacts, typecheck and build it. This is the product-proving test.
- **Checks:** `pnpm lint`, `pnpm typecheck`, `pnpm check:tokens` (fails on raw colors).
- **Build:** `pnpm build:registry` (shadcn build → static JSON) + `pnpm build` (turbo).
- **CI (GitHub Actions):** lint → typecheck → test → build registry → consumer install test → Playwright smoke. Vercel deploys docs+registry: preview per PR, production on `main`.
- **Definition of done per component:** states covered · tokens clean · behavior test · demo page · doc entry · registry entry.

## 10. Docs site

Next.js app on Vercel. Per-component pages: live demo, install command, props table, states showcase, composition notes (which AI Elements/shadcn pieces it builds on). Catalog index grouped by kit; public roadmap page listing unshipped waves. Functional and clean at launch; a distinctive visual brand pass is a later, separate design effort.

## 11. Implementation sequencing

One spec (this document); one implementation plan per wave.

| Wave | Scope |
|---|---|
| 0 — Foundation | Repo, tooling, CI, registry pipeline, all 7 primitives, two pilot components end-to-end (`shortcuts-sheet`, `thread-list`), docs shell |
| 1 — App Shell & Nav | Remaining App Shell kit + composer/context trio + `app-shell` block |
| 2 — Flow Kit F1 | Wiring + node anatomy (7 items) + `useFlowRunner`; demo: rebuild Flow Builder's image→video chain on the registry |
| 3 — Flow Kit F2 | The 10 modality node presets; demo: the full reference flow incl. TTS + SFX + Music into composition |
| 4 — Flow Kit F3 | Canvas chrome (palette, omnibar, run-controls, inspector, env-status); demo: Flow AI-style shell |
| 5 — Writing | Writing kit |
| 6 — Image | Image kit + `media-prompt-bar` + `generation-panel` block + `model-card`, `parameter-panel` |
| 7 — Feedback & Evals | Feedback kit + `compare-viewer` |
| 8 — Audio | Audio kit + `transport-controls` |
| 9 — Video | Video kit + `studio-shell` and `tool-panel` blocks + `context-toolbar`, `property-inspector`, `ai-tools-menu` |
| 10 — Observability | Observability kit |
| 11 — RAG & Library | RAG kit + `asset-library`, `filter-panel`, `explore-gallery` |
| 12 — Monetization | Monetization kit (note: `credits-indicator` ships in Wave 1 with the shell) |

Flow Kit placement rationale: it has a working reference implementation (Flow Builder) to lift from, the strongest differentiation story, and its own detailed spec — lowest risk, highest momentum. Reorderable at review.

Stretch items (`*`) ship last within their wave and may slip to a cleanup wave without blocking.

## 12. Non-goals

- No fork or re-implementation of AI Elements components.
- No data fetching, auth, or billing logic — UI only, callbacks out.
- No npm package distribution; registry only.
- No canvas/graph engine — `gen-node` rides on AI Elements' canvas suite.
- No full design-canvas editor (layers panel, transform engine); `context-toolbar`/`property-inspector` target hosts that already have an editing surface.
- Docs-site visual branding is deferred to a dedicated design pass after Wave 1.

## 13. Risks

- **Upstream drift:** AI Elements evolves quickly (48 components and growing). Mitigation: composition via cross-registry deps, overlap audit in each wave plan, contained blast radius (copy-and-own).
- **Catalog breadth:** 84 items is ambitious. Mitigation: per-wave shipping, public roadmap, DoD checklist keeping every shipped item complete.
- **Heavy components** (`timeline-editor`, `inpaint-canvas`): flagged stretch; prototyped behind their wave before commitment.
