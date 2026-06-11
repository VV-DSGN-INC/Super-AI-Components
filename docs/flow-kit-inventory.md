# Flow Kit — node canvas components for Super-AI-Components

_Inventory & spec draft · June 10, 2026 · derived from Flow Builder (Nick's repo), the "Flows" product screenshots (light, Higgsfield-style), and the "Flow AI" screenshots (dark, curated local-ComfyUI canvas)_

## Problem

Every AI creation tool is converging on the same surface: a node canvas where prompts, media, and models get wired together and run. Higgsfield Flows, Krea Nodes, Flora, Freepik Spaces, ComfyUI, OpenArt — all ship a variant of it, and every team builds it from scratch on top of React Flow.

Vercel AI Elements ships only the _display_ primitives — `Canvas` is a thin ReactFlow wrapper, `Node` is an untyped shadcn Card with boolean left/right handles. Everything that makes the surface a **creation tool** is missing: typed ports, run states, model/param bars, media previews, prompt editing inside nodes, composition timelines, palettes, inspectors. That layer is exactly the "studios, not chat" positioning agreed for Super-AI-Components — and nobody ships it as composable shadcn components today.

## What AI Elements already gives us

| AI Elements component                                           | What it is                                                                            | Why it's not enough                                                                      |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `canvas`                                                        | `<ReactFlow>` + Background, sane defaults (panOnScroll, selectionOnDrag, delete keys) | No run orchestration, no typed validation — fine as our base, re-export                  |
| `node` + slots (Header/Title/Description/Action/Content/Footer) | shadcn Card, `handles: {target, source}` booleans                                     | Handles untyped & unstyled; no status, no error state, no media slots, no run affordance |
| `edge`                                                          | Bezier `Temporary` (dashed) + `Animated` variants with floating anchors               | No type coloring, no per-type semantics                                                  |
| `connection`                                                    | Custom connection line                                                                | Fine — inherit                                                                           |
| `controls`, `panel`, `toolbar`                                  | Thin positioning wrappers                                                             | Chrome only; no palette, omnibar, run controls, inspector                                |

**Strategy: don't fork — extend.** Flow Kit components compose on top of AI Elements' `canvas`/`node`/`edge` namespaces (theirs stay the dependency), the same way the rest of Super-AI-Components builds on shadcn.

## Reference examples

**A. Flow Builder** (`/Users/nickv/ClaudeCode Projects/Flow Builder/`) — working implementation, May 2026. Proven patterns to lift directly: `TypedHandle` with same-type `isValidConnection` and handle-id encoding (`{nodeId}:{type}`), `BaseNode` status rings (running=blue ring, error=red ring + inline error banner), per-node Run + topological "Run all" executor, bottom-center icon palette that spawns nodes at viewport center pre-selected, localStorage graph persistence.

**B. "Flows" (light reference)** — media-first nodes: the generated image _is_ the card, prompt sits under it with `@Image 1`-style reference mention chips and reference thumbnails; a **params bar floats below each node** (model dropdown · aspect 16:9 · resolution 1K · duration 6s · mute · download · delete · ⋯); split Run button (`Run | ▾`); composition node = video preview + multitrack timeline (Video / Text to Speech tracks, time ruler, per-track mute, "+ Add audio track"); TTS node = waveform player + voice selector + script; bottom **omnibar** ("Add background music to the scene…") with a tool belt of canvas tools; edges colored by payload type.
A third screenshot (empty canvas state) adds: a consistent **empty-state convention** ("Your {audio/sound effect/music/generation} will appear here" + medium icon), the full **ElevenLabs audio family** — Text to Speech (Eleven Multilingual v2, voice persona row "Roger – Laid-Back, Casual, Resonant"), Sound Effects (Eleven SFX, params: loop ∞ Off · duration Auto · prompt influence 30%), Music (Eleven Music, lyrics toggle revealing a lyrics field, "leave blank to infer from prompt") — plus an **LLM node** (Gemini 3.5 Flash, "Generated text will appear here", footer: model · ✨ thinking Off · length Auto) and a model-less **Text node** (plain textarea, copy/delete footer only). Audio and text nodes are roughly half the width of image/video nodes.

**C. "Flow AI" (dark reference)** — a curated canvas over local ComfyUI + cloud partners: **left sidebar palette** of node cards (name + one-line description: Prompt, Image Input, Style Reference, Prompt Assist, Text Viewer, Image Gen, Video Gen, Upscale Video, Music, Asset Output) plus a documents list; **right inspector** (label field, options, "connected results go to…" explainer, Duplicate/Delete); top **run controls** (Run Flow / Stop Flow / Run Selection / Save / Workflow Setup); nodes show `IN`/`OUT` **port chips** (Prompt · Image · Style → Image), a status badge (`Idle`), a model + runtime line ("Z-Image Turbo · **Local**", "LTX 2.3 · Local"), and an empty-state slot ("Run node to see image output"); environment status pill ("ComfyUI offline") and credits; minimap.

**More examples worth stealing from**

| Product                | One pattern to steal                                                                          |
| ---------------------- | --------------------------------------------------------------------------------------------- |
| ComfyUI                | Queue semantics — nodes show queued vs running; partial re-runs reuse cached upstream outputs |
| n8n                    | Per-node output inspector after a run; error pin on the exact failing node                    |
| Higgsfield Flows       | The under-node params bar — params live with the node but outside the card                    |
| Krea Nodes             | Drag from an empty handle → palette opens filtered to compatible node types                   |
| Flora                  | Blocks feel like media cards, not tech nodes — prompt collapses once output exists            |
| Freepik Spaces (Weavy) | Omnibar prompt that _edits the graph_ ("add background music" inserts a music node wired in)  |
| tldraw computer        | Arbitrary data chips flowing along edges, visible mid-flight while running                    |
| Unreal Blueprints      | Exec vs data pin distinction — run-order edges styled differently from data edges             |

---

## The kit

Twenty-five components in four groups. Names follow the existing kit conventions (kebab-case, shadcn-registry-ready). Group 1 unblocks everything; chrome can trail.

### Group 1 — Wiring (foundation)

| Component         | What it is                                                                                                                     | Key states                                                         |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------ |
| `typed-handle`    | Colored, validated port. Type ∈ `text · image · video · audio` (extensible registry). Same-type connection validation built in | idle · compatible-highlight (while dragging) · connected · invalid |
| `typed-edge`      | Edge that inherits its color from the source handle type; animated variant while upstream node runs                            | idle · active (data flowing) · selected · invalid                  |
| `port-chip`       | Inline `IN`/`OUT` pill row labelling a node's ports (Flow AI pattern) — doubles as drop target on dense nodes                  | default · highlighted · satisfied                                  |
| `connection-hint` | Drag-from-handle affordance: dashed preview line + optional filtered mini-palette on drop into empty canvas (Krea pattern)     | dragging · valid-target · no-target                                |

### Group 2 — Node anatomy

| Component     | What it is                                                                                                                                                                   | Key states                                                   |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| `ai-node`     | The base creation card. Slots: header (title + model/runtime label + status), media, body, error, footer. Replaces hand-rolled `BaseNode`                                    | idle · queued · running · done · error · selected · disabled |
| `node-status` | Status badge/ring pair — badge in header ("Idle", "Running…"), ring on card edge. Single source of truth for status colors                                                   | idle · queued · running · done · error                       |
| `model-bar`   | The params strip docked under a node: model select · aspect ratio · resolution · duration · seed · mute · download · delete · overflow. Config-driven segments               | default · open (any popover) · disabled (while running)      |
| `run-button`  | Split button: primary Run + dropdown (Run from here · Run selection · Run all). Spinner while running, becomes Stop                                                          | idle · running (→ stop) · disabled · success-flash           |
| `media-slot`  | Aspect-locked preview area inside a node: image / video / audio-waveform variants, skeleton shimmer while generating, empty state ("Run node to see output")                 | empty · generating · loaded · failed                         |
| `node-prompt` | Prompt textarea inside a node with `@mention` reference chips resolving to upstream node outputs, reference thumbnails row, auto-collapse once output exists (Flora pattern) | editing · collapsed · with-references                        |

### Group 3 — Modality nodes (composed presets)

| Component           | Composition                                                                                                                                                                | Notes                                                                                                                              |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `text-node`         | ai-node(slim, no model) + plain textarea; text OUT                                                                                                                         | Static text block — copy/delete footer only, no Run (Flows "Text", Flow AI "Prompt" palette card)                                  |
| `llm-node`          | ai-node + generated-text slot + node-prompt + model-bar(model · thinking ✨ · length Auto); text/image IN, text OUT                                                        | Model-backed text step — scripts, rewrites, brief expansion (Flows "LLM" / Gemini 3.5 Flash)                                       |
| `image-node`        | ai-node + media-slot(image) + node-prompt + model-bar(model · aspect · resolution · quality); text/image IN, image OUT                                                     | Multi-image IN for combine ops ("person in @1 wearing @2")                                                                         |
| `video-node`        | ai-node + media-slot(video) + node-prompt + model-bar(model · aspect · resolution · duration · mute); image+text IN, video OUT                                             | Image-to-video is the default shape (both references)                                                                              |
| `tts-node`          | ai-node(slim) + media-slot(audio) + `voice-selector` + script area; text IN, audio OUT                                                                                     | Voice selector = avatar · name · style descriptors ("Roger – Laid-Back, Casual, Resonant"); shared with Audio kit's `tts-composer` |
| `sfx-node`          | ai-node(slim) + media-slot(audio) + node-prompt + model-bar(loop ∞ · duration Auto · prompt-influence %); text IN, audio OUT                                               | Eleven SFX shape — the params bar stress-test (toggle + auto + percent segments)                                                   |
| `music-node`        | ai-node(slim) + media-slot(audio) + lyrics toggle → lyrics field ("leave blank to infer from prompt") + node-prompt + model-bar(model · duration Auto); text IN, audio OUT | Eleven Music shape; pairs with omnibar "add background music"                                                                      |
| `composition-node`  | ai-node(wide) + media-slot(video) + `track-timeline`; video+audio IN                                                                                                       | `track-timeline`: time ruler, typed color-coded tracks, per-track mute, "+ add track"                                              |
| `asset-output-node` | ai-node + routing card ("results go to → Assets/…") + folder field                                                                                                         | Terminal sink (Flow AI pattern) — gives graphs an explicit end                                                                     |
| `reference-node`    | ai-node + asset picker (image-input / style-reference variants)                                                                                                            | Brings existing project assets onto the canvas                                                                                     |

**The audio family shares one skeleton** (Flows reference): slim width (`sm 280`), empty `media-slot(audio)` reading "Your {audio · sound effect · music} will appear here", which swaps to a waveform player row (play · duration · waveform · download) once generated. Adopt that empty-state copy convention across all media slots ("Your generation will appear here" for image/video, "Generated text will appear here" for llm). The differences between tts/sfx/music are pure configuration — one voice row, one lyrics toggle, different model-bar segments — which is the strongest evidence the `ai-node` + `model-bar` slot system is the right cut.

### Group 4 — Canvas chrome

| Component        | What it is                                                                                                                                                                                | Key states                                |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| `node-palette`   | Two variants: **toolbelt** (bottom-center icon row — Flows) and **sidebar** (cards with name + description, categorized — Flow AI). Click or drag to add; spawns node centered + selected | default · dragging-out · search/filtered  |
| `canvas-omnibar` | Bottom prompt bar that operates on the _graph_: "add background music to the scene" → inserts wired node. Includes attachment + submit; pairs with toolbelt                               | idle · focused · processing · error       |
| `run-controls`   | Toolbar cluster: Run Flow · Stop · Run Selection + progress ("3/7 nodes")                                                                                                                 | idle · running · partial-failure          |
| `node-inspector` | Right panel bound to selection: label, node-specific options, explainer slot, Duplicate/Delete. Empty state when nothing selected                                                         | empty · single-select · multi-select      |
| `env-status`     | Pill showing backend reachability ("ComfyUI offline" · "Local" · credits) — local-vs-cloud is a first-class signal (Flow AI)                                                              | online · offline · degraded · credits-low |

Out of scope here (already owned by other kits): top app bar, document switcher, share/presence (App Shell kit); the assets panel (its own kit); full video editor timeline (Composition kit, later).

---

## Deep specs — the five load-bearing components

### `typed-handle`

The foundation everything else keys off. Lift Flow Builder's implementation, generalize the type registry.

**Props**

| Prop             | Type                    | Default            | Description                                                                         |
| ---------------- | ----------------------- | ------------------ | ----------------------------------------------------------------------------------- |
| `dataType`       | `string` (registry key) | —                  | `text · image · video · audio` built in; apps register more (`style`, `mask`, `3d`) |
| `type`           | `"source" \| "target"`  | —                  | React Flow semantics                                                                |
| `position`       | `Position`              | left/right by type | —                                                                                   |
| `maxConnections` | `number`                | ∞                  | e.g. composition audio IN = 1                                                       |
| `label`          | `string?`               | —                  | Optional floating label on hover                                                    |

**Behavior** — handle id encodes the data type (`{nodeId}:{dataType}`, Flow Builder pattern) so validation works without a node lookup; `isValidConnection` = same registry type; while dragging, compatible handles scale up + glow, incompatible ones dim to 40%.

**Tokens** — one CSS var per type with light/dark values, registered globally:
`--flow-text: var(--muted-foreground)` · `--flow-image: 217 91% 60%` (blue-500) · `--flow-video: 258 90% 66%` (violet-500) · `--flow-audio: 330 81% 60%` (pink-500). 14px dot, 2px `--background` border (reads on both themes — Flow Builder hardcodes white, which breaks in dark).

**A11y** — `role="button"`, `aria-label="{dataType} {in|out}put port"`; keyboard connect: focus handle → Enter starts connection → arrow between compatible ports → Enter commits, Esc cancels.

### `ai-node`

**Anatomy** (top → bottom): header (title · model/runtime label · `node-status` badge) → `media-slot`? → body (prompt/options) → error banner (inline, `line-clamp-3`, full text on hover — Flow Builder) → footer (slot left · delete + `run-button` right). Width presets: `sm 260 · md 320 · lg 420` (composition).

**Props**

| Prop                             | Type                                                   | Default | Description                                      |
| -------------------------------- | ------------------------------------------------------ | ------- | ------------------------------------------------ |
| `status`                         | `"idle" \| "queued" \| "running" \| "done" \| "error"` | `idle`  | Drives ring, badge, run-button                   |
| `modelLabel`                     | `string?`                                              | —       | "Nano Banana 2", "LTX 2.3 · Local"               |
| `runtime`                        | `"local" \| "cloud"?`                                  | —       | Renders the `· Local` suffix + tooltip (Flow AI) |
| `error`                          | `string?`                                              | —       | Inline banner                                    |
| `onRun / onDelete / onDuplicate` | `fn?`                                                  | —       | Footer + context menu wiring                     |
| `selected`                       | `boolean`                                              | false   | From React Flow                                  |

**States** — idle: border `--border` · selected: 2px `--ring` + shadow-md · queued: pulsing dashed border · running: ring `--flow-running` (blue) + spinner in badge + model-bar disabled · done: brief ring flash then idle-with-output · error: ring + banner `--destructive`.

**A11y** — `role="group"` `aria-label="{title} node, {status}"`; status changes announced via `aria-live="polite"`; Delete key removes when selected (canvas default), banner text reachable by screen reader without hover.

### `model-bar`

The under-node params strip — the single most copied pattern across references, and pure UI (no provider logic).

**Props** — `segments: Segment[]` where `Segment = model-select | aspect-ratio | resolution | duration | quality | seed | toggle(icon, label?) | percent(icon, label?) | download | delete | menu`. Each segment is a small popover/select; the bar renders them with dividers, overflowing into `⋯` past ~6. Numeric segments support an `"Auto"` value state (duration/length in the references render "Auto", not a number). The ElevenLabs SFX bar is the canonical stress test: `loop ∞ Off · duration Auto · prompt-influence 30%` — toggle, auto-numeric, and percent in one bar; the LLM bar adds `✨ thinking Off`.

**States** — default (attached, floats 8px under card, follows node) · any-popover-open · disabled while parent runs. Selection in any segment writes to node data — the bar is controlled, storage-agnostic.

**Do / Don't** — ✅ keep it outside the card silhouette (params ≠ content — both references agree) · ❌ don't put Run here (Run lives on the node; Flows puts Run inside the card, params below — keep that separation).

### `composition-node` + `track-timeline`

`track-timeline` is the new primitive: time ruler (0:00–0:28 ticks) · typed tracks (color dot + tinted lane + clip block + per-track mute) · "+ add track" row. Tracks carry `dataType` so lane tinting reuses `--flow-*` tokens (Flow Builder's `Track` proves the tint pattern: `color` at ~12% alpha background, full color text).
Scope guard: **arrangement viewer, not an editor** — no clip trimming/splitting in v1; that's the future Composition kit. Empty state: "Connect video and audio nodes" with ghost tracks.

### `canvas-omnibar`

What separates this kit from a ComfyUI clone — the AI-native entry point (Flows: "Change the voice to something deeper…", "Add background music to the scene…").

**Props** — `placeholder`, `onSubmit(prompt, ctx)` where `ctx = {selection, graph}`; the consumer owns the LLM call that returns graph mutations; component handles input, processing state, and an inline result toast ("Added Music node → wired to Composition" with Undo).
**States** — idle · focused (suggestions: "Animate this image", "Add narration") · processing (input locked, shimmer) · error (inline, prompt preserved).
**A11y** — `role="search"` `aria-label="Edit flow with a prompt"`; ⌘K focuses from anywhere on canvas; results announced assertively.

---

## Cross-cutting states matrix

| State        | `ai-node`            | `typed-handle`               | `typed-edge`             | `run-controls`       |
| ------------ | -------------------- | ---------------------------- | ------------------------ | -------------------- |
| idle         | plain border         | type color dot               | type color 60%           | "Run Flow"           |
| queued       | dashed pulse         | —                            | —                        | progress "0/N"       |
| running      | blue ring + spinner  | —                            | animated dash flow       | "Stop" + "3/7"       |
| done         | output in media-slot | —                            | solid 100%               | success flash        |
| error        | red ring + banner    | —                            | red, error pin at target | "Partial — 1 failed" |
| selected     | ring + shadow        | scaled 1.2×                  | thicker stroke           | acts on selection    |
| drag-connect | —                    | compatible glow / others dim | dashed preview           | —                    |

## Token additions

```css
/* type colors — light & dark variants required (Flow AI is dark-first) */
--flow-text, --flow-image, --flow-video, --flow-audio
/* execution */
--flow-running (blue-500), --flow-queued (muted), --flow-done (emerald-500), --flow-error (--destructive)
/* surfaces */
--flow-canvas-bg (maps to --sidebar, AI Elements convention), --flow-node-w-sm/md/lg: 260/320/420px
```

Everything else inherits shadcn vars — the ElevenLabs/Spline light-dark lesson from the June 10 session applies: components bring **no own colors**, only tokens.

## Build order

1. **Wave F1 — wiring + anatomy (7):** `typed-handle` · `typed-edge` · `ai-node` · `node-status` · `media-slot` · `run-button` · `model-bar`. With these, a consumer + AI Elements `canvas` can assemble any node tool. Demo: rebuild Flow Builder's image→video chain in ~80 lines.
2. **Wave F2 — modality presets (10):** `text-node` · `llm-node` · `image-node` · `video-node` · `tts-node` · `sfx-node` · `music-node` · `composition-node`/`track-timeline` · `asset-output-node` · `reference-node`. Demo: recreate the Luxury Perfume flow from the screenshots, including the ElevenLabs audio bed (TTS + SFX + Music into composition).
3. **Wave F3 — chrome (5):** `node-palette` (both variants) · `canvas-omnibar` · `run-controls` · `node-inspector` · `env-status`. Demo: full Flow AI-style app shell.

Headless logic: ship `useFlowRunner` (topological execution, per-node status, cancellation — extracted from Flow Builder's `lib/executor.ts`) as an optional hook, UI-independent, so the components stay provider-agnostic and the executor is swappable (local ComfyUI vs cloud).

## Open questions

1. **Namespace** — AI Elements already owns `canvas`/`node`/`edge` names. Prefix ours `flow-*` (`flow-node`? collides conceptually with React Flow's FlowNode) or scope by registry (`@super-ai/flow`)? Leaning: registry scope + plain names.
2. **Edge identity** — derive edge color purely from source handle (simple) or allow per-edge override (Unreal-style exec pins later)?
3. **`node-prompt` mentions** — build on AI Elements `prompt-input` or standalone? Their component is chat-shaped; mention-chips-with-thumbnails may not fit it.
4. **Timeline depth** — is view-only `track-timeline` enough for v1, or is per-track volume (not just mute) table stakes?
5. **Queue semantics** — does `useFlowRunner` v1 need ComfyUI-style output caching (skip clean upstream nodes on re-run), or is naive full-graph topological run acceptable?
