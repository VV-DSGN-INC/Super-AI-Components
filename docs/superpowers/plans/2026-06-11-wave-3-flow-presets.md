# Wave 3 — Flow Kit Modality Presets + Provider Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the Flow Kit's 10 modality node presets as registry items (thin compositions over Wave 2's flow L2), the demo app's provider layer (one adapter interface, a stub adapter, four real adapters, seven route handlers), and the Luxury Perfume demo upgrade (seed graph + fetch-based execute + persistence), each through the full definition of done (states · tokens clean · behavior test · demo page · catalog page · registry entry).

**Architecture:** Three concerns, three homes.
1. **Presets (registry items, L3):** `apps/docs/registry/super-ai/flow/<preset>.tsx` (install target `components/super-ai/flow/`). Each preset is a **thin React Flow node component** composing Wave 2's `ai-node` + `media-slot` + `node-prompt` + `model-bar` + `typed-handle` + `port-chip` + `run-button`. Per the master layer rule, presets are L3: they depend on flow L2 + L1 (AI Elements) + L0 (shadcn) **only — never on each other**. They contain zero data fetching and zero raw colors. `track-timeline` lives in its own file (`track-timeline.tsx`), consumed by `composition-node`.
2. **Provider layer (demo app, NOT registry items):** `apps/docs/lib/flow/adapters/*` + `apps/docs/app/api/generate/*/route.ts`. This is where all fetching lives. Components stay fetch-free; the demo's execute function calls these routes.
3. **Demo upgrade:** `apps/docs/lib/flow/seed-perfume.ts` + `apps/docs/lib/flow/fetch-execute.ts` + the `/flow` page switched from Wave 2's `stubExecute` to a route-backed execute with `localStorage` persistence and reset-to-seed.

**Tech Stack:** TypeScript · React 19 · Next.js App Router (route handlers for the provider layer) · Tailwind v4 (shadcn CSS variables) · `@xyflow/react` v12 · `ai` SDK v6 (AI Gateway image + llm) · `@fal-ai/client` (video) · Vitest + RTL (jsdom) · existing `gen-registry.mts` pipeline.

**Specs this plan implements:** [`docs/superpowers/specs/2026-06-11-flow-kit-design.md`](../specs/2026-06-11-flow-kit-design.md) §Provider layer, §Demo, §Build sequencing Phase C/D (presets + provider routes + seed graph) + component anatomy in [`docs/flow-kit-inventory.md`](../../flow-kit-inventory.md) §Group 3 (modality presets), the ElevenLabs audio-family subsection, and the `composition-node`/`track-timeline` deep spec. Conventions: master spec [`2026-06-10-super-ai-components-design.md`](2026-06-10-super-ai-components-design.md) §6 (API conventions) + §9 (dev workflow / DoD) + Wave 0 plan deviations.

**Coordination protocol (read first):**

1. This wave **continues on the Wave 2 worktree branch**. Wave 2 (`docs/superpowers/plans/2026-06-11-wave-2-flow-foundation.md`) runs in the worktree `../flow-kit-worktree` on branch `wave-2-flow-foundation`, cut from `wave-0-foundation`. Wave 3 work happens **on that same worktree, on the same branch, after all Wave 2 tasks (0–14) are complete and committed.** No new worktree, no new branch. Task 0 below verifies the Wave 2 end-state exists before anything else runs.
2. Wave 3 depends on Wave 2's flow L2 contracts being final:
   - `flow-types.ts` exports: `FLOW_STATUSES`, `FlowStatus` (`idle|queued|streaming|done|failed|locked`), `handleId(nodeId, dataType, dir)`, `parseHandleId`, `isValidFlowConnection`, `getHandleType`, `registerHandleType`, `NodeSize` (`sm|md|lg`), `NODE_WIDTH` (`{sm:280, md:320, lg:420}`).
   - `use-flow-runner.ts` exports: `useFlowRunner`, `RunnerNode` (`{id, data}`), `RunnerEdge` (`{id, source, target}`), `NodeOutput` (`Record<string, unknown>`), `UseFlowRunnerOptions` (`{nodes, edges, execute, onStatus}`); `execute` signature `(node, inputs, signal) => Promise<NodeOutput>`.
   - `ai-node.tsx` exports `AiNode` with props `{id, title, status, modelLabel?, runtime?, error?, selected?, size?, media?, footer?, children?, className?}` and slots rendering order media → children(body) → error → footer.
   - `media-slot.tsx` exports `MediaSlot` with props `{kind: "image"|"video"|"audio"|"text", status: FlowStatus, src?, alt?, aspect?, emptyText?, className?}`.
   - `model-bar.tsx` exports `ModelBar` with props `{segments, onChange, disabled?, className?}`; segment kinds include `model | aspect | resolution | duration | quality | toggle | percent`; `onChange` receives `{id, value}` patches; numeric segments accept `value: "auto"`.
   - `node-prompt.tsx` exports `NodePrompt` with props `{value, onChange, placeholder?, references?, onRemoveReference?, collapsed?, onExpand?, className?}`.
   - `run-button.tsx` exports `RunButton` with props `{status, onRun, onStop?, onRunFrom?, onRunSelection?, onRunAll?, cost?, className?}`.
   - `typed-handle.tsx` exports `TypedHandle` with props `{nodeId, dataType, type: "source"|"target", position?, top?, className?}`.
   - `port-chip.tsx` exports `PortChips` with props `{in?, out?, satisfied?, className?}`.
   - If any export differs at execution time, **read the actual Wave 2 source file first and adapt** — the behavioral contract in the tests is what must hold. Never re-create a Wave 2 file.
3. **Rebase onto `wave-0-foundation` at every group boundary** (`git fetch . wave-0-foundation && git rebase wave-0-foundation` from the worktree), same as Wave 2.
4. Merge to `main` happens only after Wave 0 merges, then Wave 2, then this wave (linear: 0 → 2 → 3).

---

## File structure (end state of Wave 3)

```
apps/docs/
├── registry/super-ai/flow/                          # NEW preset items (install target components/super-ai/flow/)
│   ├── text-node.tsx              text-node.test.tsx
│   ├── llm-node.tsx               llm-node.test.tsx
│   ├── image-node.tsx             image-node.test.tsx
│   ├── video-node.tsx             video-node.test.tsx
│   ├── tts-node.tsx               tts-node.test.tsx            # includes VoiceSelector row
│   ├── sfx-node.tsx               sfx-node.test.tsx
│   ├── music-node.tsx             music-node.test.tsx          # lyrics toggle → lyrics textarea
│   ├── composition-node.tsx       composition-node.test.tsx
│   ├── track-timeline.tsx         track-timeline.test.tsx      # separate file, view-only
│   ├── asset-output-node.tsx      asset-output-node.test.tsx
│   └── reference-node.tsx         reference-node.test.tsx      # image-input / style-reference variants
├── lib/flow/                                         # demo-app provider layer + glue (NOT registry items)
│   ├── adapters/
│   │   ├── types.ts                                  # GenerateAdapter, GenerateRequest, GenerateResult, GenerateError
│   │   ├── stub.ts                                   # deterministic placeholder adapter
│   │   ├── elevenlabs.ts                             # speech + sfx + music (real REST)
│   │   ├── gateway.ts                                # image + llm via Vercel AI Gateway (ai SDK)
│   │   └── fal.ts                                    # video via fal queue
│   ├── seed-perfume.ts                               # Luxury Perfume seed graph (nodes + edges)
│   └── fetch-execute.ts                              # browser execute() hitting /api/generate/*
├── app/api/generate/
│   ├── image/route.ts   video/route.ts   speech/route.ts
│   ├── sfx/route.ts     music/route.ts   llm/route.ts
│   └── status/route.ts                               # { providers: { speech: "stub"|"live", ... } }
├── components/demos/flow/                             # one demo per preset (client components)
│   ├── text-node-demo.tsx        llm-node-demo.tsx        image-node-demo.tsx
│   ├── video-node-demo.tsx       tts-node-demo.tsx        sfx-node-demo.tsx
│   ├── music-node-demo.tsx       composition-node-demo.tsx
│   └── asset-output-node-demo.tsx   reference-node-demo.tsx
├── app/components/[name]/                             # catalog pages pick up the 10 new presets
└── app/flow/                                          # demo upgraded: seed graph + fetch-execute + persistence
    └── flow-demo.tsx                                  # MODIFIED (Wave 2 created it; this wave swaps execute)
```

`gen-registry.mts` discovers items from its items array — each preset task appends one item following the file's existing shape (read it first; it is Wave 0's contract). All preset items declare `registryDependencies` on their Wave 2 flow siblings by `self()` URL (e.g. `self("ai-node")`) plus shadcn primitives, and npm `dependencies: ["@xyflow/react", "lucide-react"]`. The provider layer and demo glue are **not** registry items and are never added to `gen-registry.mts`.

---

## Conventions (binding for every task in this wave)

These are the master §6 + Wave 0 rules, restated because every preset and every reviewer depends on them. No code in this wave may violate one.

- **`"use client"`** as the first line of every interactive component (all presets render React Flow handles / inputs / callbacks → all are client; `track-timeline` too).
- **Exports PascalCase, files kebab-case**, one component family per file (`text-node.tsx` → `export function TextNode`).
- **`data-slot` attribute on every part** the component renders (root + each meaningful subpart).
- **`className` passthrough via `cn()`** (`import { cn } from "@/lib/utils"`).
- **Controlled props + `on*` callbacks.** Presets read their state from `data` (React Flow node data) and emit changes through `data.on*` handlers supplied by the host. No internal persistence.
- **NO data fetching inside registry components.** Fetch lives only in `apps/docs/lib/flow/*` and the route handlers. A preset that needs generation calls `data.onRun?.()` and the host wires it to the runner.
- **NO raw colors in any `.tsx`.** Use `var(--flow-*)` (from Wave 2's `flow-tokens.css`) and shadcn CSS variables only. `check:tokens` fails the build on raw hex / `oklch(` / Tailwind palette classes. The provider layer is `.ts` (no JSX/colors) so it is out of the token scanner's `*.tsx` scope, but keep it color-free regardless.
- **Tests colocated** as `<name>.test.tsx` next to the source, Vitest + RTL, **behavior tests** (ports rendered with correct types, correct model-bar segments, empty-state copy, status passthrough, callbacks fire) — never markup snapshots.
- **Status vocabulary is exactly `idle | queued | streaming | done | failed | locked`.** Presets pass `status` straight through to `AiNode`; they never invent states.
- **React Flow node component shape.** Each preset is a custom node: it receives React Flow's `NodeProps` (`{id, data, selected}`), reads typed fields off `data`, and renders `AiNode` + handles. `data` is typed per preset via an exported `<Preset>Data` interface. The host registers presets in `nodeTypes`.

---

### Task 0: Verify Wave 2 end-state (no new branch)

**Files:** none (git + filesystem checks only)

- [ ] **Step 1: Confirm you are on the Wave 2 worktree/branch**

```bash
cd "/Users/nickv/ClaudeCode Projects/AI Components/../flow-kit-worktree"
git branch --show-current   # expect: wave-2-flow-foundation
git log --oneline -1        # expect Wave 2's last commit ("docs(flow): catalog pages for flow L2" or later)
```

If the worktree does not exist or the branch is wrong, STOP — Wave 2 has not completed; this wave cannot start. Do not create a new worktree.

- [ ] **Step 2: Confirm the Wave 2 flow L2 contracts exist**

```bash
ls apps/docs/registry/super-ai/flow/{flow-types.ts,ai-node.tsx,media-slot.tsx,model-bar.tsx,node-prompt.tsx,run-button.tsx,typed-handle.tsx,port-chip.tsx,use-flow-runner.ts}
```

Expected: every file present. If `model-bar.tsx` is missing (it was gated on Wave 0's `gen-settings-bar` in Wave 2), STOP and resolve Wave 2 Task 9 first — `llm-node`, `image-node`, `video-node`, `sfx-node`, `music-node` all depend on `ModelBar`.

- [ ] **Step 3: Rebase + green baseline**

```bash
git fetch . wave-0-foundation && git rebase wave-0-foundation
pnpm install
pnpm --filter docs test -- --run
pnpm check:tokens
```

Expected: rebase clean, install green, existing Wave 2 tests pass, tokens clean. Use the exact script names from `apps/docs/package.json` if these differ (read it; do not rename scripts).

- [ ] **Step 4: Commit marker**

```bash
git commit --allow-empty -m "chore(flow): begin wave-3 presets + provider layer"
```

---

### Task 1: Provider adapter interface + error normalization

**Files:**
- Create: `apps/docs/lib/flow/adapters/types.ts`

This task defines the shared types every adapter and route imports. It has no test of its own (pure types + a tiny error helper exercised by Task 2's stub test).

- [ ] **Step 1: Implement `types.ts`**

```ts
// apps/docs/lib/flow/adapters/types.ts
// Provider layer contract (demo app only — registry components never fetch).
// One interface, six kinds; routes pick the real adapter when its env key is present, else the stub.

export type GenerateKind = "image" | "video" | "speech" | "sfx" | "music" | "llm";

/** Request shape sent from the browser execute() to a /api/generate/<kind> route. */
export interface GenerateRequest {
  kind: GenerateKind;
  /** Primary text: prompt for media, script for speech, lyrics-or-prompt for music, user text for llm. */
  prompt: string;
  /** Resolved upstream outputs keyed by source node id (urls/text the node depends on). */
  inputs?: Record<string, { url?: string; text?: string; kind?: string }>;
  /** Node settings copied from model-bar / node data (voiceId, duration, aspect, loop, promptInfluence, lyrics, model, …). */
  options?: Record<string, unknown>;
}

/** Normalized success result returned to the browser; drives media-slot + node output. */
export interface GenerateResult {
  kind: GenerateKind;
  /** Object URL or remote URL of the produced media; omitted for text/llm. */
  url?: string;
  /** Text payload for llm/text-producing nodes. */
  text?: string;
  /** Which provider served this result, for the env-status pill. */
  provider: "stub" | "live";
}

/** Normalized error — every adapter funnels failures into this; routes return it as JSON with the right status. */
export interface GenerateError {
  code: string;
  message: string;
}

export interface GenerateAdapter {
  kind: GenerateKind;
  generate(req: GenerateRequest, signal: AbortSignal): Promise<GenerateResult>;
}

/** Normalize any thrown value into { code, message }. Reused by every adapter + route. */
export function toGenerateError(err: unknown, fallbackCode = "provider_error"): GenerateError {
  if (err instanceof DOMException && err.name === "AbortError") {
    return { code: "aborted", message: "Generation was cancelled." };
  }
  if (err instanceof Error) return { code: fallbackCode, message: err.message };
  return { code: fallbackCode, message: String(err) };
}

/** True when an upstream fetch Response is not ok; builds a normalized error from it. */
export async function errorFromResponse(res: Response, code: string): Promise<GenerateError> {
  let detail = "";
  try {
    detail = await res.text();
  } catch {
    /* ignore */
  }
  return { code, message: `${res.status} ${res.statusText}${detail ? ` — ${detail.slice(0, 200)}` : ""}` };
}
```

- [ ] **Step 2: Typecheck** — `pnpm --filter docs typecheck` → PASS (no unused/loose types).
- [ ] **Step 3: Commit** — `git add -A && git commit -m "feat(flow): provider adapter interface + error normalization"`

---

### Task 2: Stub adapter + bundled placeholder media

**Files:**
- Create: `apps/docs/lib/flow/adapters/stub.ts`
- Create: `apps/docs/lib/flow/adapters/stub.test.ts`
- Create: `apps/docs/public/stubs/` assets (see Step 4) + `apps/docs/public/stubs/README.md`

- [ ] **Step 1: Write the failing test**

```ts
// apps/docs/lib/flow/adapters/stub.test.ts
import { describe, expect, it, vi } from "vitest";
import { stubAdapter } from "./stub";

const req = (kind: Parameters<typeof stubAdapter.generate>[0]["kind"], extra = {}) => ({
  kind,
  prompt: "a cat",
  ...extra,
});

describe("stubAdapter", () => {
  it("returns deterministic placeholder media per kind tagged provider:stub", async () => {
    vi.useFakeTimers();
    const p = stubAdapter.generate(req("image"), new AbortController().signal);
    await vi.runAllTimersAsync();
    const out = await p;
    expect(out).toMatchObject({ kind: "image", url: "/stubs/image-1.webp", provider: "stub" });
    vi.useRealTimers();
  });

  it("returns text for llm without a url", async () => {
    vi.useFakeTimers();
    const p = stubAdapter.generate(req("llm"), new AbortController().signal);
    await vi.runAllTimersAsync();
    const out = await p;
    expect(out.url).toBeUndefined();
    expect(out.text).toContain("a cat");
    vi.useRealTimers();
  });

  it("honors the scripted failure flag", async () => {
    vi.useFakeTimers();
    const p = stubAdapter.generate(req("image", { options: { failPlease: true } }), new AbortController().signal);
    const assertion = expect(p).rejects.toThrow(/stub failure/i);
    await vi.runAllTimersAsync();
    await assertion;
    vi.useRealTimers();
  });

  it("rejects with AbortError when the signal aborts mid-flight", async () => {
    const ctl = new AbortController();
    const p = stubAdapter.generate(req("video"), ctl.signal);
    ctl.abort();
    await expect(p).rejects.toMatchObject({ name: "AbortError" });
  });
});
```

- [ ] **Step 2: Run to verify failure** — `pnpm --filter docs test -- --run stub` → FAIL (module not found).

- [ ] **Step 3: Implement `stub.ts`**

```ts
// apps/docs/lib/flow/adapters/stub.ts
// Deterministic, zero-key adapter: bundled placeholder media, 800–2500ms latency,
// AbortSignal-aware, scripted failure via options.failPlease. Default for every route.
import type { GenerateAdapter, GenerateKind, GenerateRequest, GenerateResult } from "./types";

const MEDIA: Partial<Record<GenerateKind, { url: string }>> = {
  image: { url: "/stubs/image-1.webp" },
  video: { url: "/stubs/video-1.mp4" },
  speech: { url: "/stubs/speech-1.mp3" },
  sfx: { url: "/stubs/sfx-1.mp3" },
  music: { url: "/stubs/music-1.mp3" },
};

function wait(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) return reject(new DOMException("aborted", "AbortError"));
    const t = setTimeout(resolve, ms);
    signal.addEventListener("abort", () => {
      clearTimeout(t);
      reject(new DOMException("aborted", "AbortError"));
    });
  });
}

export const stubAdapter: GenerateAdapter & { kind: "stub" } = {
  kind: "stub" as never,
  async generate(req: GenerateRequest, signal: AbortSignal): Promise<GenerateResult> {
    await wait(800 + Math.random() * 1700, signal);
    if (req.options?.failPlease) throw new Error("Stub failure (demo).");
    if (req.kind === "llm") {
      return { kind: "llm", text: `Stubbed text for: ${req.prompt}`, provider: "stub" };
    }
    const media = MEDIA[req.kind];
    return { kind: req.kind, url: media?.url ?? MEDIA.image!.url, provider: "stub" };
  },
};
```

(The `kind: "stub"` cast keeps the adapter shape uniform; routes never read `stubAdapter.kind`, they call `generate`.)

- [ ] **Step 4: Bundle placeholder assets** under `apps/docs/public/stubs/`:
  - `image-1.webp` — generate with ImageMagick: `magick -size 640x360 gradient:gray60-gray80 apps/docs/public/stubs/image-1.webp`.
  - `video-1.mp4` — 1-second clip via ffmpeg if available: `ffmpeg -f lavfi -i color=c=gray:s=640x360:d=1 -pix_fmt yuv420p apps/docs/public/stubs/video-1.mp4`.
  - `speech-1.mp3`, `sfx-1.mp3`, `music-1.mp3` — 1-second silence via ffmpeg: `ffmpeg -f lavfi -i anullsrc=r=44100:cl=mono -t 1 apps/docs/public/stubs/speech-1.mp3` (repeat for sfx/music).
  - If neither tool is available, copy any small committed public-domain file to each name and record its origin in `apps/docs/public/stubs/README.md` (one line per file: filename → source/license).

- [ ] **Step 5: Tests green** — `pnpm --filter docs test -- --run stub` → PASS.
- [ ] **Step 6: Commit** — `git add -A && git commit -m "feat(flow): stub generate adapter + placeholder media"`

---

### Task 3: Status route + ElevenLabs speech adapter + speech route

**Files:**
- Create: `apps/docs/lib/flow/adapters/elevenlabs.ts` (speech only in this task; sfx/music added in Task 4 — same file, additive)
- Create: `apps/docs/app/api/generate/status/route.ts`
- Create: `apps/docs/app/api/generate/speech/route.ts`
- Create: `apps/docs/lib/flow/adapters/elevenlabs.test.ts`
- Create: `apps/docs/app/api/generate/status/route.test.ts`

This task ships the **complete** real-adapter + route pattern once, in full, so Task 4's other adapters/routes mirror it with shared helpers (no "similar to Task 3" — Task 4 repeats its code).

- [ ] **Step 1: Write the failing tests**

```ts
// apps/docs/lib/flow/adapters/elevenlabs.test.ts
import { afterEach, describe, expect, it, vi } from "vitest";
import { elevenSpeechAdapter } from "./elevenlabs";

afterEach(() => vi.unstubAllGlobals());

describe("elevenSpeechAdapter", () => {
  it("POSTs to /v1/text-to-speech/{voice_id} with text + model_id and returns an object url", async () => {
    const fetchMock = vi.fn(async () =>
      new Response(new Blob([new Uint8Array([1, 2, 3])], { type: "audio/mpeg" }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("URL", { ...URL, createObjectURL: vi.fn(() => "blob:fake") });

    const out = await elevenSpeechAdapter("k").generate(
      { kind: "speech", prompt: "Hello there", options: { voiceId: "Roger", modelId: "eleven_multilingual_v2" } },
      new AbortController().signal,
    );

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.elevenlabs.io/v1/text-to-speech/Roger");
    expect(init.method).toBe("POST");
    expect(init.headers["xi-api-key"]).toBe("k");
    expect(JSON.parse(init.body)).toMatchObject({ text: "Hello there", model_id: "eleven_multilingual_v2" });
    expect(out).toMatchObject({ kind: "speech", url: "blob:fake", provider: "live" });
  });

  it("normalizes a non-ok response into a thrown Error with status text", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("nope", { status: 401, statusText: "Unauthorized" })));
    await expect(
      elevenSpeechAdapter("k").generate({ kind: "speech", prompt: "x" }, new AbortController().signal),
    ).rejects.toThrow(/401/);
  });
});
```

```ts
// apps/docs/app/api/generate/status/route.test.ts
import { afterEach, describe, expect, it } from "vitest";
import { GET } from "./route";

const KEYS = ["ELEVENLABS_API_KEY", "AI_GATEWAY_API_KEY", "FAL_KEY"];
afterEach(() => KEYS.forEach((k) => delete process.env[k]));

describe("GET /api/generate/status", () => {
  it("reports stub for every provider when no keys are set", async () => {
    const body = await (await GET()).json();
    expect(body.providers).toEqual({
      image: "stub", video: "stub", speech: "stub", sfx: "stub", music: "stub", llm: "stub",
    });
  });
  it("flips ElevenLabs-backed providers to live when ELEVENLABS_API_KEY is present", async () => {
    process.env.ELEVENLABS_API_KEY = "x";
    const body = await (await GET()).json();
    expect(body.providers).toMatchObject({ speech: "live", sfx: "live", music: "live", image: "stub" });
  });
});
```

- [ ] **Step 2: Run to verify failure** — `pnpm --filter docs test -- --run elevenlabs status` → FAIL.

- [ ] **Step 3: Implement `elevenlabs.ts` (speech) with the shared audio helper**

```ts
// apps/docs/lib/flow/adapters/elevenlabs.ts
// Real ElevenLabs adapters. Activated when ELEVENLABS_API_KEY is present (route decides).
// Endpoints verified 2026-06-11 against https://elevenlabs.io/docs/api-reference:
//   speech: POST /v1/text-to-speech/{voice_id}
//   sfx:    POST /v1/sound-generation
//   music:  POST /v1/music
import type { GenerateAdapter, GenerateRequest, GenerateResult } from "./types";
import { errorFromResponse } from "./types";

const BASE = "https://api.elevenlabs.io";
const DEFAULT_VOICE = "JBFqnCBsd6RMkjVDRZzb"; // ElevenLabs sample voice id ("Roger"); override via options.voiceId

/** POST JSON to ElevenLabs, expect an audio body, return a browser object URL. */
async function postAudio(
  apiKey: string,
  path: string,
  body: Record<string, unknown>,
  signal: AbortSignal,
  errCode: string,
): Promise<string> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "xi-api-key": apiKey, "content-type": "application/json", accept: "audio/mpeg" },
    body: JSON.stringify(body),
    signal,
  });
  if (!res.ok) {
    const e = await errorFromResponse(res, errCode);
    throw new Error(e.message);
  }
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

export function elevenSpeechAdapter(apiKey: string): GenerateAdapter {
  return {
    kind: "speech",
    async generate(req: GenerateRequest, signal: AbortSignal): Promise<GenerateResult> {
      const voiceId = String(req.options?.voiceId ?? DEFAULT_VOICE);
      const url = await postAudio(
        apiKey,
        `/v1/text-to-speech/${voiceId}`,
        {
          text: req.prompt,
          model_id: String(req.options?.modelId ?? "eleven_multilingual_v2"),
          ...(req.options?.voiceSettings ? { voice_settings: req.options.voiceSettings } : {}),
        },
        signal,
        "elevenlabs_speech_error",
      );
      return { kind: "speech", url, provider: "live" };
    },
  };
}
```

- [ ] **Step 4: Implement the status route**

```ts
// apps/docs/app/api/generate/status/route.ts
import { NextResponse } from "next/server";

type Provider = "stub" | "live";
const live = (v: string | undefined): Provider => (v ? "live" : "stub");

/** GET /api/generate/status → which provider serves each kind, for the env-status pill. */
export function GET() {
  const eleven = live(process.env.ELEVENLABS_API_KEY);
  const gateway = live(process.env.AI_GATEWAY_API_KEY);
  const fal = live(process.env.FAL_KEY);
  return NextResponse.json({
    providers: {
      image: gateway,
      video: fal,
      speech: eleven,
      sfx: eleven,
      music: eleven,
      llm: gateway,
    },
  });
}
```

- [ ] **Step 5: Implement the speech route (real adapter when keyed, else stub) with the shared route helper**

Create the shared route runner inline in this file; Task 4's routes import it.

```ts
// apps/docs/lib/flow/adapters/run-route.ts
import { NextResponse } from "next/server";
import { stubAdapter } from "./stub";
import { toGenerateError, type GenerateAdapter, type GenerateRequest } from "./types";

/**
 * Shared route body: parse the request, pick the real adapter if `real` is provided
 * (i.e. its env key was present) else the stub, run with the request's AbortSignal,
 * and normalize failures to { code, message } with the right HTTP status.
 */
export async function runGenerateRoute(
  request: Request,
  real: GenerateAdapter | null,
): Promise<Response> {
  let body: GenerateRequest;
  try {
    body = (await request.json()) as GenerateRequest;
  } catch {
    return NextResponse.json({ code: "bad_request", message: "Invalid JSON body." }, { status: 400 });
  }
  const adapter = real ?? stubAdapter;
  try {
    const result = await adapter.generate(body, request.signal);
    return NextResponse.json(result);
  } catch (err) {
    const e = toGenerateError(err);
    const status = e.code === "aborted" ? 499 : 502;
    return NextResponse.json(e, { status });
  }
}
```

```ts
// apps/docs/app/api/generate/speech/route.ts
import { elevenSpeechAdapter } from "@/lib/flow/adapters/elevenlabs";
import { runGenerateRoute } from "@/lib/flow/adapters/run-route";

export async function POST(request: Request) {
  const key = process.env.ELEVENLABS_API_KEY;
  return runGenerateRoute(request, key ? elevenSpeechAdapter(key) : null);
}
```

- [ ] **Step 6: Tests green** — `pnpm --filter docs test -- --run elevenlabs status` → PASS. `pnpm --filter docs typecheck` → PASS.
- [ ] **Step 7: Commit** — `git add -A && git commit -m "feat(flow): status route + ElevenLabs speech adapter + speech route"`

---

### Task 4: Remaining adapters + routes (sfx, music, image, llm, video)

**Files:**
- Modify: `apps/docs/lib/flow/adapters/elevenlabs.ts` (add `elevenSfxAdapter`, `elevenMusicAdapter` — reuse `postAudio`)
- Create: `apps/docs/lib/flow/adapters/gateway.ts` (image + llm via `ai` SDK)
- Create: `apps/docs/lib/flow/adapters/fal.ts` (video via fal queue)
- Create: `apps/docs/app/api/generate/{sfx,music,image,llm,video}/route.ts`
- Create: `apps/docs/lib/flow/adapters/gateway.test.ts`, `apps/docs/lib/flow/adapters/fal.test.ts`
- Add to `apps/docs/lib/flow/adapters/elevenlabs.test.ts`: sfx + music cases

Install deps first: `pnpm --filter docs add ai @fal-ai/client`.

- [ ] **Step 1: Write the failing tests**

Append to `elevenlabs.test.ts`:

```ts
describe("elevenSfxAdapter", () => {
  it("POSTs to /v1/sound-generation with text, duration_seconds, prompt_influence, loop", async () => {
    const fetchMock = vi.fn(async () => new Response(new Blob([new Uint8Array([1])], { type: "audio/mpeg" })));
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("URL", { ...URL, createObjectURL: vi.fn(() => "blob:sfx") });
    const out = await elevenSfxAdapter("k").generate(
      { kind: "sfx", prompt: "rain on a window", options: { durationSeconds: "auto", promptInfluence: 0.3, loop: true } },
      new AbortController().signal,
    );
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.elevenlabs.io/v1/sound-generation");
    expect(JSON.parse(init.body)).toMatchObject({ text: "rain on a window", prompt_influence: 0.3, loop: true });
    // "auto" duration is omitted (let the model choose), not sent as a string
    expect(JSON.parse(init.body).duration_seconds).toBeUndefined();
    expect(out).toMatchObject({ kind: "sfx", url: "blob:sfx", provider: "live" });
  });
});

describe("elevenMusicAdapter", () => {
  it("POSTs to /v1/music with prompt + music_length_ms", async () => {
    const fetchMock = vi.fn(async () => new Response(new Blob([new Uint8Array([1])], { type: "audio/mpeg" })));
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("URL", { ...URL, createObjectURL: vi.fn(() => "blob:music") });
    const out = await elevenMusicAdapter("k").generate(
      { kind: "music", prompt: "lofi for a perfume ad", options: { lengthMs: 12000 } },
      new AbortController().signal,
    );
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.elevenlabs.io/v1/music");
    expect(JSON.parse(init.body)).toMatchObject({ prompt: "lofi for a perfume ad", music_length_ms: 12000 });
    expect(out).toMatchObject({ kind: "music", provider: "live" });
  });
});
```

```ts
// apps/docs/lib/flow/adapters/gateway.test.ts
import { afterEach, describe, expect, it, vi } from "vitest";

const generateText = vi.fn();
const generateImage = vi.fn();
vi.mock("ai", () => ({ generateText, generateImage }));

afterEach(() => vi.clearAllMocks());

describe("gateway adapters", () => {
  it("llm adapter calls generateText with the provider/model string and returns text", async () => {
    generateText.mockResolvedValue({ text: "expanded brief" });
    const { gatewayLlmAdapter } = await import("./gateway");
    const out = await gatewayLlmAdapter().generate(
      { kind: "llm", prompt: "expand this", options: { model: "google/gemini-2.5-flash" } },
      new AbortController().signal,
    );
    expect(generateText).toHaveBeenCalledWith(
      expect.objectContaining({ model: "google/gemini-2.5-flash", prompt: "expand this" }),
    );
    expect(out).toMatchObject({ kind: "llm", text: "expanded brief", provider: "live" });
  });

  it("image adapter calls generateImage and returns a data url", async () => {
    generateImage.mockResolvedValue({ image: { base64: "aGk=", mediaType: "image/png" } });
    const { gatewayImageAdapter } = await import("./gateway");
    const out = await gatewayImageAdapter().generate(
      { kind: "image", prompt: "a perfume bottle", options: { model: "openai/gpt-image-1" } },
      new AbortController().signal,
    );
    expect(generateImage).toHaveBeenCalledWith(
      expect.objectContaining({ model: "openai/gpt-image-1", prompt: "a perfume bottle" }),
    );
    expect(out.url).toBe("data:image/png;base64,aGk=");
    expect(out.provider).toBe("live");
  });
});
```

```ts
// apps/docs/lib/flow/adapters/fal.test.ts
import { afterEach, describe, expect, it, vi } from "vitest";

const subscribe = vi.fn();
const config = vi.fn();
vi.mock("@fal-ai/client", () => ({ fal: { subscribe, config } }));

afterEach(() => vi.clearAllMocks());

describe("falVideoAdapter", () => {
  it("subscribes to the configured model with prompt + image url and returns the video url", async () => {
    subscribe.mockResolvedValue({ data: { video: { url: "https://fal/out.mp4" } } });
    const { falVideoAdapter } = await import("./fal");
    const out = await falVideoAdapter("fk").generate(
      {
        kind: "video",
        prompt: "animate this",
        inputs: { img1: { url: "https://x/in.png", kind: "image" } },
        options: { model: "fal-ai/ltx-video", duration: 4 },
      },
      new AbortController().signal,
    );
    const [model, opts] = subscribe.mock.calls[0];
    expect(model).toBe("fal-ai/ltx-video");
    expect(opts.input).toMatchObject({ prompt: "animate this", image_url: "https://x/in.png" });
    expect(out).toMatchObject({ kind: "video", url: "https://fal/out.mp4", provider: "live" });
  });
});
```

- [ ] **Step 2: Run to verify failure** — `pnpm --filter docs test -- --run elevenlabs gateway fal` → FAIL.

- [ ] **Step 3: Implement the sfx + music adapters** (append to `elevenlabs.ts`, reusing `postAudio`)

```ts
// append to apps/docs/lib/flow/adapters/elevenlabs.ts
export function elevenSfxAdapter(apiKey: string): GenerateAdapter {
  return {
    kind: "sfx",
    async generate(req: GenerateRequest, signal: AbortSignal): Promise<GenerateResult> {
      const dur = req.options?.durationSeconds;
      const url = await postAudio(
        apiKey,
        "/v1/sound-generation",
        {
          text: req.prompt,
          // "auto" → omit so the model chooses length; a number → pass through
          ...(typeof dur === "number" ? { duration_seconds: dur } : {}),
          ...(req.options?.promptInfluence != null ? { prompt_influence: req.options.promptInfluence } : {}),
          ...(req.options?.loop != null ? { loop: req.options.loop } : {}),
        },
        signal,
        "elevenlabs_sfx_error",
      );
      return { kind: "sfx", url, provider: "live" };
    },
  };
}

export function elevenMusicAdapter(apiKey: string): GenerateAdapter {
  return {
    kind: "music",
    async generate(req: GenerateRequest, signal: AbortSignal): Promise<GenerateResult> {
      const url = await postAudio(
        apiKey,
        "/v1/music",
        {
          prompt: req.prompt,
          ...(req.options?.lengthMs != null ? { music_length_ms: req.options.lengthMs } : {}),
        },
        signal,
        "elevenlabs_music_error",
      );
      return { kind: "music", url, provider: "live" };
    },
  };
}
```

- [ ] **Step 4: Implement `gateway.ts`** (image + llm via the `ai` SDK; gateway resolves `provider/model` strings when `AI_GATEWAY_API_KEY` is set)

```ts
// apps/docs/lib/flow/adapters/gateway.ts
// Vercel AI Gateway adapters: image + llm via the `ai` SDK using "provider/model" strings.
// The gateway is selected implicitly by the ai SDK when AI_GATEWAY_API_KEY is present.
import { generateImage, generateText } from "ai";
import type { GenerateAdapter, GenerateRequest, GenerateResult } from "./types";

export function gatewayLlmAdapter(): GenerateAdapter {
  return {
    kind: "llm",
    async generate(req: GenerateRequest, signal: AbortSignal): Promise<GenerateResult> {
      const model = String(req.options?.model ?? "google/gemini-2.5-flash");
      const upstream = Object.values(req.inputs ?? {})
        .map((i) => i.text)
        .filter(Boolean)
        .join("\n");
      const prompt = upstream ? `${upstream}\n\n${req.prompt}` : req.prompt;
      const { text } = await generateText({ model, prompt, abortSignal: signal });
      return { kind: "llm", text, provider: "live" };
    },
  };
}

export function gatewayImageAdapter(): GenerateAdapter {
  return {
    kind: "image",
    async generate(req: GenerateRequest, signal: AbortSignal): Promise<GenerateResult> {
      const model = String(req.options?.model ?? "openai/gpt-image-1");
      const { image } = await generateImage({ model, prompt: req.prompt, abortSignal: signal });
      const mediaType = (image as { mediaType?: string }).mediaType ?? "image/png";
      return { kind: "image", url: `data:${mediaType};base64,${image.base64}`, provider: "live" };
    },
  };
}
```

- [ ] **Step 5: Implement `fal.ts`** (video via the fal queue client)

```ts
// apps/docs/lib/flow/adapters/fal.ts
// fal video adapter: submits to the fal queue (queue.fal.run) via @fal-ai/client.
// Image-to-video is the default shape — the first upstream image url becomes image_url.
import { fal } from "@fal-ai/client";
import type { GenerateAdapter, GenerateRequest, GenerateResult } from "./types";

export function falVideoAdapter(apiKey: string): GenerateAdapter {
  fal.config({ credentials: apiKey });
  return {
    kind: "video",
    async generate(req: GenerateRequest, signal: AbortSignal): Promise<GenerateResult> {
      const model = String(req.options?.model ?? "fal-ai/ltx-video");
      const imageUrl = Object.values(req.inputs ?? {}).find((i) => i.kind === "image")?.url;
      const result = (await fal.subscribe(model, {
        input: {
          prompt: req.prompt,
          ...(imageUrl ? { image_url: imageUrl } : {}),
          ...(req.options?.duration != null ? { duration: req.options.duration } : {}),
        },
        abortSignal: signal,
      })) as { data?: { video?: { url?: string } } };
      const url = result.data?.video?.url;
      if (!url) throw new Error("fal returned no video url.");
      return { kind: "video", url, provider: "live" };
    },
  };
}
```

- [ ] **Step 6: Implement the five routes** (each picks real-when-keyed else stub, via the shared `runGenerateRoute`)

```ts
// apps/docs/app/api/generate/sfx/route.ts
import { elevenSfxAdapter } from "@/lib/flow/adapters/elevenlabs";
import { runGenerateRoute } from "@/lib/flow/adapters/run-route";
export async function POST(request: Request) {
  const key = process.env.ELEVENLABS_API_KEY;
  return runGenerateRoute(request, key ? elevenSfxAdapter(key) : null);
}
```

```ts
// apps/docs/app/api/generate/music/route.ts
import { elevenMusicAdapter } from "@/lib/flow/adapters/elevenlabs";
import { runGenerateRoute } from "@/lib/flow/adapters/run-route";
export async function POST(request: Request) {
  const key = process.env.ELEVENLABS_API_KEY;
  return runGenerateRoute(request, key ? elevenMusicAdapter(key) : null);
}
```

```ts
// apps/docs/app/api/generate/image/route.ts
import { gatewayImageAdapter } from "@/lib/flow/adapters/gateway";
import { runGenerateRoute } from "@/lib/flow/adapters/run-route";
export async function POST(request: Request) {
  const key = process.env.AI_GATEWAY_API_KEY;
  return runGenerateRoute(request, key ? gatewayImageAdapter() : null);
}
```

```ts
// apps/docs/app/api/generate/llm/route.ts
import { gatewayLlmAdapter } from "@/lib/flow/adapters/gateway";
import { runGenerateRoute } from "@/lib/flow/adapters/run-route";
export async function POST(request: Request) {
  const key = process.env.AI_GATEWAY_API_KEY;
  return runGenerateRoute(request, key ? gatewayLlmAdapter() : null);
}
```

```ts
// apps/docs/app/api/generate/video/route.ts
import { falVideoAdapter } from "@/lib/flow/adapters/fal";
import { runGenerateRoute } from "@/lib/flow/adapters/run-route";
export async function POST(request: Request) {
  const key = process.env.FAL_KEY;
  return runGenerateRoute(request, key ? falVideoAdapter(key) : null);
}
```

- [ ] **Step 7: Tests + typecheck green** — `pnpm --filter docs test -- --run elevenlabs gateway fal && pnpm --filter docs typecheck` → PASS.
- [ ] **Step 8: Commit** — `git add -A && git commit -m "feat(flow): sfx/music/image/llm/video adapters + routes"`

---

> **Presets begin here (Tasks 5–14).** Each is a thin React Flow node (~50–90 lines) composing Wave 2 L2. Pattern for every preset task: write failing test → run expect FAIL → implement → run expect PASS → demo → register in `gen-registry.mts` → rebuild registry → commit. All presets are mutually independent and parallelizable after Tasks 1–4 (which they do not actually depend on — they depend only on Wave 2 L2 — but the dispatcher groups them after the provider layer for reviewer cohesion; see Dispatcher notes). Read `gen-registry.mts` once before the first registration and follow its exact item shape.

---

### Task 5: `text-node` preset

**Files:** create `text-node.tsx`, `text-node.test.tsx`, `components/demos/flow/text-node-demo.tsx`.

Composition (inventory §Group 3): `ai-node(slim, no model)` + plain textarea; **text OUT only**; copy/delete footer; **no Run** (static block).

- [ ] **Step 1: Failing test**

```tsx
// apps/docs/registry/super-ai/flow/text-node.test.tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ReactFlowProvider } from "@xyflow/react";
import { describe, expect, it, vi } from "vitest";
import { TextNode } from "./text-node";

const wrap = (ui: React.ReactNode) => render(<ReactFlowProvider>{ui}</ReactFlowProvider>);
const props = (data = {}) => ({ id: "n1", data: { value: "", ...data }, selected: false }) as never;

describe("TextNode", () => {
  it("renders an editable textarea and a single text OUT port, no run button", () => {
    wrap(<TextNode {...props({ value: "brief copy" })} />);
    expect(screen.getByRole("textbox")).toHaveValue("brief copy");
    expect(document.querySelector('[data-handleid="n1:text:out"]')).toBeTruthy();
    expect(document.querySelector('[data-handleid$=":in"]')).toBeNull();
    expect(screen.queryByRole("button", { name: "Run" })).toBeNull();
  });
  it("emits onChange through node data", async () => {
    const onChange = vi.fn();
    wrap(<TextNode {...props({ value: "a", onChange })} />);
    await userEvent.type(screen.getByRole("textbox"), "b");
    expect(onChange).toHaveBeenLastCalledWith("ab");
  });
});
```

- [ ] **Step 2: Run** → FAIL. **Step 3: Implement**

```tsx
// apps/docs/registry/super-ai/flow/text-node.tsx
"use client";
import { Position, type NodeProps } from "@xyflow/react";
import { cn } from "@/lib/utils";
import { AiNode } from "./ai-node";
import { TypedHandle } from "./typed-handle";

export interface TextNodeData {
  value: string;
  onChange?: (value: string) => void;
}

export function TextNode({ id, data, selected }: NodeProps & { data: TextNodeData }) {
  return (
    <AiNode id={id} title="Text" status="idle" selected={selected} size="sm" data-slot="text-node">
      <textarea
        data-slot="text-node-input"
        value={data.value}
        onChange={(e) => data.onChange?.(e.target.value)}
        placeholder="Write text…"
        className={cn(
          "min-h-16 w-full resize-none rounded-md border bg-transparent px-2 py-1.5 text-xs",
          "focus-visible:ring-ring outline-none focus-visible:ring-2",
        )}
      />
      <TypedHandle nodeId={id} dataType="text" type="source" position={Position.Right} />
    </AiNode>
  );
}
```

- [ ] **Step 4: Run** → PASS. `pnpm check:tokens` → PASS.
- [ ] **Step 5: Demo**

```tsx
// apps/docs/components/demos/flow/text-node-demo.tsx
"use client";
import { Background, ReactFlow, type Node } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { TextNode } from "@/registry/super-ai/flow/text-node";

const nodes: Node[] = [{ id: "t", type: "text", position: { x: 40, y: 30 }, data: { value: "A luxury perfume, golden hour" } }];
export default function TextNodeDemo() {
  return (
    <div className="h-56 rounded-lg border">
      <ReactFlow defaultNodes={nodes} nodeTypes={{ text: TextNode }} fitView proOptions={{ hideAttribution: true }}>
        <Background />
      </ReactFlow>
    </div>
  );
}
```

- [ ] **Step 6: Register** — append to `gen-registry.mts`: `text-node`, `registryDependencies: [self("ai-node"), self("typed-handle"), self("flow-types")]`, `dependencies: ["@xyflow/react"]`. Rebuild registry; expect `public/r/text-node.json`.
- [ ] **Step 7: Commit** — `git add -A && git commit -m "feat(flow): text-node preset"`

---

### Task 6: `llm-node` preset

**Files:** create `llm-node.tsx`, `llm-node.test.tsx`, `components/demos/flow/llm-node-demo.tsx`.

Composition: `ai-node` + generated-text `media-slot(kind=text)` + `node-prompt` + `model-bar(model · thinking ✨ · length Auto)`; **text/image IN, text OUT**.

- [ ] **Step 1: Failing test**

```tsx
// apps/docs/registry/super-ai/flow/llm-node.test.tsx
import { render, screen } from "@testing-library/react";
import { ReactFlowProvider } from "@xyflow/react";
import { describe, expect, it } from "vitest";
import { LlmNode } from "./llm-node";

const wrap = (ui: React.ReactNode) => render(<ReactFlowProvider>{ui}</ReactFlowProvider>);
const props = (data = {}, selected = false) =>
  ({ id: "n1", data: { prompt: "", status: "idle", model: "Gemini 3.5 Flash", ...data }, selected }) as never;

describe("LlmNode", () => {
  it("renders text IN, image IN and text OUT ports", () => {
    wrap(<LlmNode {...props()} />);
    expect(document.querySelector('[data-handleid="n1:text:in"]')).toBeTruthy();
    expect(document.querySelector('[data-handleid="n1:image:in"]')).toBeTruthy();
    expect(document.querySelector('[data-handleid="n1:text:out"]')).toBeTruthy();
  });
  it("shows the LLM empty-state copy and model-bar segments (model · thinking · length)", () => {
    wrap(<LlmNode {...props()} />);
    expect(screen.getByText("Generated text will appear here")).toBeInTheDocument();
    expect(screen.getByText("Gemini 3.5 Flash")).toBeInTheDocument();
    expect(screen.getByText(/thinking/i)).toBeInTheDocument();
    expect(screen.getByText("Auto")).toBeInTheDocument();
  });
  it("passes status through to the node group label", () => {
    wrap(<LlmNode {...props({ status: "streaming" })} />);
    expect(screen.getByRole("group", { name: "LLM node, streaming" })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run** → FAIL. **Step 3: Implement**

```tsx
// apps/docs/registry/super-ai/flow/llm-node.tsx
"use client";
import { Position, type NodeProps } from "@xyflow/react";
import type { FlowStatus } from "./flow-types";
import { AiNode } from "./ai-node";
import { MediaSlot } from "./media-slot";
import { ModelBar } from "./model-bar";
import { NodePrompt } from "./node-prompt";
import { RunButton } from "./run-button";
import { TypedHandle } from "./typed-handle";

export interface LlmNodeData {
  prompt: string;
  status: FlowStatus;
  model?: string;
  text?: string;
  thinking?: boolean;
  length?: number | "auto";
  onPromptChange?: (value: string) => void;
  onSettingChange?: (patch: { id: string; value: unknown }) => void;
  onRun?: () => void;
  onStop?: () => void;
}

export function LlmNode({ id, data, selected }: NodeProps & { data: LlmNodeData }) {
  return (
    <AiNode
      id={id}
      title="LLM"
      status={data.status}
      modelLabel={data.model}
      selected={selected}
      size="md"
      data-slot="llm-node"
      media={<MediaSlot kind="text" status={data.status} emptyText="Generated text will appear here" />}
      footer={<RunButton status={data.status} onRun={() => data.onRun?.()} onStop={() => data.onStop?.()} />}
    >
      <NodePrompt value={data.prompt} onChange={(v) => data.onPromptChange?.(v)} placeholder="Instructions…" />
      <ModelBar
        className="mt-2"
        disabled={data.status === "streaming"}
        onChange={(patch) => data.onSettingChange?.(patch)}
        segments={[
          { kind: "model", id: "model", value: data.model ?? "Gemini 3.5 Flash", options: [{ value: data.model ?? "Gemini 3.5 Flash", label: data.model ?? "Gemini 3.5 Flash" }] },
          { kind: "toggle", id: "thinking", label: "Thinking", value: data.thinking ?? false },
          { kind: "duration", id: "length", value: data.length ?? "auto", options: [256, 512, 1024] },
        ]}
      />
      <TypedHandle nodeId={id} dataType="text" type="target" position={Position.Left} top={28} />
      <TypedHandle nodeId={id} dataType="image" type="target" position={Position.Left} top={52} />
      <TypedHandle nodeId={id} dataType="text" type="source" position={Position.Right} />
    </AiNode>
  );
}
```

(The `length` segment reuses the `duration` segment kind — it renders "Auto" for `"auto"` and a number otherwise, matching the model-bar contract. If Wave 2's `ModelBar` exposes a distinct `length` kind, use it; read the source.)

- [ ] **Step 4: Run** → PASS. tokens PASS.
- [ ] **Step 5: Demo** (one `llm` node in a 240px canvas, `data` with `status:"idle"`, mirrors `text-node-demo` structure with `nodeTypes={{ llm: LlmNode }}`).
- [ ] **Step 6: Register** — `llm-node`, `registryDependencies: [self("ai-node"), self("media-slot"), self("model-bar"), self("node-prompt"), self("run-button"), self("typed-handle"), self("flow-types")]`, `dependencies: ["@xyflow/react"]`. Rebuild.
- [ ] **Step 7: Commit** — `git add -A && git commit -m "feat(flow): llm-node preset"`

---

### Task 7: `image-node` preset

**Files:** create `image-node.tsx`, `image-node.test.tsx`, `components/demos/flow/image-node-demo.tsx`.

Composition: `ai-node` + `media-slot(image)` + `node-prompt` + `model-bar(model · aspect · resolution · quality)`; **text/image IN (multi-image for combine), image OUT**. The combine case = multiple image IN ports; expose via a `maxImageInputs` data field defaulting to 1.

- [ ] **Step 1: Failing test**

```tsx
// apps/docs/registry/super-ai/flow/image-node.test.tsx
import { render, screen } from "@testing-library/react";
import { ReactFlowProvider } from "@xyflow/react";
import { describe, expect, it } from "vitest";
import { ImageNode } from "./image-node";

const wrap = (ui: React.ReactNode) => render(<ReactFlowProvider>{ui}</ReactFlowProvider>);
const props = (data = {}) =>
  ({ id: "n1", data: { prompt: "", status: "idle", model: "Nano Banana 2", ...data }, selected: false }) as never;

describe("ImageNode", () => {
  it("renders model-bar segments model · aspect · resolution · quality and image OUT", () => {
    wrap(<ImageNode {...props()} />);
    expect(screen.getByText("Nano Banana 2")).toBeInTheDocument();
    expect(screen.getByText("16:9")).toBeInTheDocument();
    expect(screen.getByText("1K")).toBeInTheDocument();
    expect(document.querySelector('[data-handleid="n1:image:out"]')).toBeTruthy();
  });
  it("renders N image IN ports for combine ops", () => {
    wrap(<ImageNode {...props({ maxImageInputs: 2 })} />);
    expect(document.querySelector('[data-handleid="n1:image:in"]')).toBeTruthy();
    expect(document.querySelectorAll('[data-flow-type="image"][data-handlepos="left"]').length).toBe(2);
  });
  it("shows generation empty-state copy", () => {
    wrap(<ImageNode {...props()} />);
    expect(screen.getByText("Your generation will appear here")).toBeInTheDocument();
  });
});
```

(`data-handlepos` is React Flow's own attribute on `Handle`; if the version renders a different attribute, assert on `[data-flow-type="image"]` count plus the encoded ids `n1:image:in` / `n1:image:in#2` — see implementation. Read the rendered DOM in the first run and adjust the selector, keeping the "two image inputs" assertion.)

- [ ] **Step 2: Run** → FAIL. **Step 3: Implement**

```tsx
// apps/docs/registry/super-ai/flow/image-node.tsx
"use client";
import { Position, type NodeProps } from "@xyflow/react";
import type { FlowStatus } from "./flow-types";
import { AiNode } from "./ai-node";
import { MediaSlot } from "./media-slot";
import { ModelBar } from "./model-bar";
import { NodePrompt } from "./node-prompt";
import { RunButton } from "./run-button";
import { TypedHandle } from "./typed-handle";

export interface ImageNodeData {
  prompt: string;
  status: FlowStatus;
  model?: string;
  src?: string;
  aspect?: string;
  resolution?: string;
  quality?: string;
  maxImageInputs?: number;
  onPromptChange?: (value: string) => void;
  onSettingChange?: (patch: { id: string; value: unknown }) => void;
  onRun?: () => void;
  onStop?: () => void;
}

export function ImageNode({ id, data, selected }: NodeProps & { data: ImageNodeData }) {
  const imageInputs = Math.max(1, data.maxImageInputs ?? 1);
  return (
    <AiNode
      id={id}
      title="Image"
      status={data.status}
      modelLabel={data.model}
      selected={selected}
      size="md"
      data-slot="image-node"
      media={<MediaSlot kind="image" status={data.status} src={data.src} alt="Generated image" emptyText="Your generation will appear here" />}
      footer={<RunButton status={data.status} onRun={() => data.onRun?.()} onStop={() => data.onStop?.()} />}
    >
      <NodePrompt value={data.prompt} onChange={(v) => data.onPromptChange?.(v)} placeholder="Describe the image…" />
      <ModelBar
        className="mt-2"
        disabled={data.status === "streaming"}
        onChange={(patch) => data.onSettingChange?.(patch)}
        segments={[
          { kind: "model", id: "model", value: data.model ?? "Nano Banana 2", options: [{ value: data.model ?? "Nano Banana 2", label: data.model ?? "Nano Banana 2" }] },
          { kind: "aspect", id: "aspect", value: data.aspect ?? "16:9", options: ["1:1", "16:9", "9:16"] },
          { kind: "resolution", id: "resolution", value: data.resolution ?? "1K", options: ["1K", "2K"] },
          { kind: "quality", id: "quality", value: data.quality ?? "Standard", options: ["Standard", "High"] },
        ]}
      />
      {Array.from({ length: imageInputs }).map((_, i) => (
        <TypedHandle key={i} nodeId={id} dataType="image" type="target" position={Position.Left} top={28 + i * 22} />
      ))}
      <TypedHandle nodeId={id} dataType="text" type="target" position={Position.Left} top={28 + imageInputs * 22} />
      <TypedHandle nodeId={id} dataType="image" type="source" position={Position.Right} />
    </AiNode>
  );
}
```

(Note: multiple `image` IN handles share the same encoded `handleId` `n1:image:in`. If the runner/host needs to distinguish them, Wave 2's `TypedHandle` supports an `id` override; pass an index suffix at the host level. For the preset's own contract — render N typed image targets — this is sufficient and the test asserts on the rendered count.)

- [ ] **Step 4: Run** → PASS. tokens PASS.
- [ ] **Step 5: Demo** (`image` node, `data.status:"done"`, `src:"/stubs/image-1.webp"`, `maxImageInputs:2`).
- [ ] **Step 6: Register** — `image-node`, deps `[self("ai-node"), self("media-slot"), self("model-bar"), self("node-prompt"), self("run-button"), self("typed-handle"), self("flow-types")]`, npm `["@xyflow/react"]`. Rebuild.
- [ ] **Step 7: Commit** — `git add -A && git commit -m "feat(flow): image-node preset"`

---

### Task 8: `video-node` preset

**Files:** create `video-node.tsx`, `video-node.test.tsx`, `components/demos/flow/video-node-demo.tsx`.

Composition: `ai-node` + `media-slot(video)` + `node-prompt` + `model-bar(model · aspect · resolution · duration · mute)`; **image+text IN, video OUT**.

- [ ] **Step 1: Failing test**

```tsx
// apps/docs/registry/super-ai/flow/video-node.test.tsx
import { render, screen } from "@testing-library/react";
import { ReactFlowProvider } from "@xyflow/react";
import { describe, expect, it } from "vitest";
import { VideoNode } from "./video-node";

const wrap = (ui: React.ReactNode) => render(<ReactFlowProvider>{ui}</ReactFlowProvider>);
const props = (data = {}) =>
  ({ id: "n1", data: { prompt: "", status: "idle", model: "LTX 2.3", runtime: "local", ...data }, selected: false }) as never;

describe("VideoNode", () => {
  it("renders image IN, text IN and video OUT", () => {
    wrap(<VideoNode {...props()} />);
    expect(document.querySelector('[data-handleid="n1:image:in"]')).toBeTruthy();
    expect(document.querySelector('[data-handleid="n1:text:in"]')).toBeTruthy();
    expect(document.querySelector('[data-handleid="n1:video:out"]')).toBeTruthy();
  });
  it("renders the video model-bar (model · aspect · resolution · duration · mute) and runtime suffix", () => {
    wrap(<VideoNode {...props()} />);
    expect(screen.getByText("LTX 2.3 · Local")).toBeInTheDocument();
    expect(screen.getByText("720p")).toBeInTheDocument();
    expect(screen.getByText("4s")).toBeInTheDocument();
  });
  it("locked status shows the upgrade label (entitlement gate)", () => {
    wrap(<VideoNode {...props({ status: "locked" })} />);
    expect(screen.getByText("Upgrade to run")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run** → FAIL. **Step 3: Implement**

```tsx
// apps/docs/registry/super-ai/flow/video-node.tsx
"use client";
import { Position, type NodeProps } from "@xyflow/react";
import type { FlowStatus } from "./flow-types";
import { AiNode } from "./ai-node";
import { MediaSlot } from "./media-slot";
import { ModelBar } from "./model-bar";
import { NodePrompt } from "./node-prompt";
import { RunButton } from "./run-button";
import { TypedHandle } from "./typed-handle";

export interface VideoNodeData {
  prompt: string;
  status: FlowStatus;
  model?: string;
  runtime?: "local" | "cloud";
  src?: string;
  aspect?: string;
  resolution?: string;
  duration?: number | "auto";
  mute?: boolean;
  onPromptChange?: (value: string) => void;
  onSettingChange?: (patch: { id: string; value: unknown }) => void;
  onRun?: () => void;
  onStop?: () => void;
}

export function VideoNode({ id, data, selected }: NodeProps & { data: VideoNodeData }) {
  return (
    <AiNode
      id={id}
      title="Video"
      status={data.status}
      modelLabel={data.model}
      runtime={data.runtime}
      selected={selected}
      size="md"
      data-slot="video-node"
      media={<MediaSlot kind="video" status={data.status} src={data.src} emptyText="Your generation will appear here" />}
      footer={<RunButton status={data.status} onRun={() => data.onRun?.()} onStop={() => data.onStop?.()} />}
    >
      <NodePrompt value={data.prompt} onChange={(v) => data.onPromptChange?.(v)} placeholder="Describe the motion…" />
      <ModelBar
        className="mt-2"
        disabled={data.status === "streaming"}
        onChange={(patch) => data.onSettingChange?.(patch)}
        segments={[
          { kind: "model", id: "model", value: data.model ?? "LTX 2.3", options: [{ value: data.model ?? "LTX 2.3", label: data.model ?? "LTX 2.3" }] },
          { kind: "aspect", id: "aspect", value: data.aspect ?? "16:9", options: ["1:1", "16:9", "9:16"] },
          { kind: "resolution", id: "resolution", value: data.resolution ?? "720p", options: ["480p", "720p", "1080p"] },
          { kind: "duration", id: "duration", value: data.duration ?? 4, options: [4, 6, 8] },
          { kind: "toggle", id: "mute", label: "Mute", value: data.mute ?? false },
        ]}
      />
      <TypedHandle nodeId={id} dataType="image" type="target" position={Position.Left} top={28} />
      <TypedHandle nodeId={id} dataType="text" type="target" position={Position.Left} top={52} />
      <TypedHandle nodeId={id} dataType="video" type="source" position={Position.Right} />
    </AiNode>
  );
}
```

- [ ] **Step 4: Run** → PASS. tokens PASS.
- [ ] **Step 5: Demo** (`video` node, `data.status:"idle"`).
- [ ] **Step 6: Register** — `video-node`, deps `[self("ai-node"), self("media-slot"), self("model-bar"), self("node-prompt"), self("run-button"), self("typed-handle"), self("flow-types")]`, npm `["@xyflow/react"]`. Rebuild.
- [ ] **Step 7: Commit** — `git add -A && git commit -m "feat(flow): video-node preset"`

---

### Task 9: `tts-node` preset (with voice selector)

**Files:** create `tts-node.tsx`, `tts-node.test.tsx`, `components/demos/flow/tts-node-demo.tsx`.

Composition: `ai-node(slim)` + `media-slot(audio)` + **`VoiceSelector` row** (avatar dot · name · style descriptors, e.g. "Roger – Laid-Back, Casual, Resonant") + script `node-prompt`; **text IN, audio OUT**.

- [ ] **Step 1: Failing test**

```tsx
// apps/docs/registry/super-ai/flow/tts-node.test.tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ReactFlowProvider } from "@xyflow/react";
import { describe, expect, it, vi } from "vitest";
import { TtsNode } from "./tts-node";

const wrap = (ui: React.ReactNode) => render(<ReactFlowProvider>{ui}</ReactFlowProvider>);
const voice = { id: "roger", name: "Roger", descriptors: ["Laid-Back", "Casual", "Resonant"] };
const props = (data = {}) =>
  ({ id: "n1", data: { script: "", status: "idle", model: "Eleven Multilingual v2", voice, ...data }, selected: false }) as never;

describe("TtsNode", () => {
  it("renders the voice row with name and descriptors", () => {
    wrap(<TtsNode {...props()} />);
    expect(screen.getByText("Roger")).toBeInTheDocument();
    expect(screen.getByText("Laid-Back, Casual, Resonant")).toBeInTheDocument();
  });
  it("renders audio empty-state copy and text IN / audio OUT ports", () => {
    wrap(<TtsNode {...props()} />);
    expect(screen.getByText("Your audio will appear here")).toBeInTheDocument();
    expect(document.querySelector('[data-handleid="n1:text:in"]')).toBeTruthy();
    expect(document.querySelector('[data-handleid="n1:audio:out"]')).toBeTruthy();
  });
  it("fires onVoiceClick when the voice row is activated", async () => {
    const onVoiceClick = vi.fn();
    wrap(<TtsNode {...props({ onVoiceClick })} />);
    await userEvent.click(screen.getByRole("button", { name: /change voice/i }));
    expect(onVoiceClick).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 2: Run** → FAIL. **Step 3: Implement**

```tsx
// apps/docs/registry/super-ai/flow/tts-node.tsx
"use client";
import { Position, type NodeProps } from "@xyflow/react";
import { cn } from "@/lib/utils";
import type { FlowStatus } from "./flow-types";
import { AiNode } from "./ai-node";
import { MediaSlot } from "./media-slot";
import { NodePrompt } from "./node-prompt";
import { RunButton } from "./run-button";
import { TypedHandle } from "./typed-handle";

export interface Voice {
  id: string;
  name: string;
  descriptors: string[];
}
export interface TtsNodeData {
  script: string;
  status: FlowStatus;
  model?: string;
  voice: Voice;
  src?: string;
  onScriptChange?: (value: string) => void;
  onVoiceClick?: () => void;
  onRun?: () => void;
  onStop?: () => void;
}

function VoiceSelector({ voice, onClick }: { voice: Voice; onClick?: () => void }) {
  return (
    <button
      type="button"
      data-slot="voice-selector"
      aria-label="Change voice"
      onClick={onClick}
      className={cn("flex w-full items-center gap-2 rounded-md border px-2 py-1.5 text-left text-xs", "hover:bg-accent")}
    >
      <span aria-hidden data-slot="voice-avatar" className="size-5 shrink-0 rounded-full" style={{ background: "var(--flow-audio)" }} />
      <span className="flex min-w-0 flex-col">
        <span className="font-medium">{voice.name}</span>
        <span className="text-muted-foreground truncate">{voice.descriptors.join(", ")}</span>
      </span>
    </button>
  );
}

export function TtsNode({ id, data, selected }: NodeProps & { data: TtsNodeData }) {
  return (
    <AiNode
      id={id}
      title="Text to Speech"
      status={data.status}
      modelLabel={data.model}
      selected={selected}
      size="sm"
      data-slot="tts-node"
      media={<MediaSlot kind="audio" status={data.status} src={data.src} emptyText="Your audio will appear here" />}
      footer={<RunButton status={data.status} onRun={() => data.onRun?.()} onStop={() => data.onStop?.()} />}
    >
      <VoiceSelector voice={data.voice} onClick={data.onVoiceClick} />
      <NodePrompt className="mt-2" value={data.script} onChange={(v) => data.onScriptChange?.(v)} placeholder="Script to speak…" />
      <TypedHandle nodeId={id} dataType="text" type="target" position={Position.Left} />
      <TypedHandle nodeId={id} dataType="audio" type="source" position={Position.Right} />
    </AiNode>
  );
}
```

- [ ] **Step 4: Run** → PASS. tokens PASS (avatar uses `var(--flow-audio)`, no raw color).
- [ ] **Step 5: Demo** (`tts` node with the Roger voice, `status:"idle"`).
- [ ] **Step 6: Register** — `tts-node`, deps `[self("ai-node"), self("media-slot"), self("node-prompt"), self("run-button"), self("typed-handle"), self("flow-types")]`, npm `["@xyflow/react"]`. Rebuild.
- [ ] **Step 7: Commit** — `git add -A && git commit -m "feat(flow): tts-node preset with voice selector"`

---

### Task 10: `sfx-node` preset

**Files:** create `sfx-node.tsx`, `sfx-node.test.tsx`, `components/demos/flow/sfx-node-demo.tsx`.

Composition: `ai-node(slim)` + `media-slot(audio)` + `node-prompt` + `model-bar(loop ∞ · duration "auto" · prompt-influence %)`; **text IN, audio OUT**. This is the model-bar stress test (toggle + auto-numeric + percent).

- [ ] **Step 1: Failing test**

```tsx
// apps/docs/registry/super-ai/flow/sfx-node.test.tsx
import { render, screen } from "@testing-library/react";
import { ReactFlowProvider } from "@xyflow/react";
import { describe, expect, it } from "vitest";
import { SfxNode } from "./sfx-node";

const wrap = (ui: React.ReactNode) => render(<ReactFlowProvider>{ui}</ReactFlowProvider>);
const props = (data = {}) =>
  ({ id: "n1", data: { prompt: "", status: "idle", model: "Eleven SFX", loop: false, duration: "auto", promptInfluence: 30, ...data }, selected: false }) as never;

describe("SfxNode", () => {
  it("renders loop toggle, Auto duration, and percent influence segments", () => {
    wrap(<SfxNode {...props()} />);
    expect(screen.getByRole("switch", { name: "Loop" })).toBeInTheDocument();
    expect(screen.getByText("Auto")).toBeInTheDocument();
    expect(screen.getByText("30%")).toBeInTheDocument();
  });
  it("renders text IN and audio OUT plus empty-state copy", () => {
    wrap(<SfxNode {...props()} />);
    expect(screen.getByText("Your audio will appear here")).toBeInTheDocument();
    expect(document.querySelector('[data-handleid="n1:text:in"]')).toBeTruthy();
    expect(document.querySelector('[data-handleid="n1:audio:out"]')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run** → FAIL. **Step 3: Implement**

```tsx
// apps/docs/registry/super-ai/flow/sfx-node.tsx
"use client";
import { Position, type NodeProps } from "@xyflow/react";
import type { FlowStatus } from "./flow-types";
import { AiNode } from "./ai-node";
import { MediaSlot } from "./media-slot";
import { ModelBar } from "./model-bar";
import { NodePrompt } from "./node-prompt";
import { RunButton } from "./run-button";
import { TypedHandle } from "./typed-handle";

export interface SfxNodeData {
  prompt: string;
  status: FlowStatus;
  model?: string;
  src?: string;
  loop?: boolean;
  duration?: number | "auto";
  promptInfluence?: number;
  onPromptChange?: (value: string) => void;
  onSettingChange?: (patch: { id: string; value: unknown }) => void;
  onRun?: () => void;
  onStop?: () => void;
}

export function SfxNode({ id, data, selected }: NodeProps & { data: SfxNodeData }) {
  return (
    <AiNode
      id={id}
      title="Sound Effects"
      status={data.status}
      modelLabel={data.model}
      selected={selected}
      size="sm"
      data-slot="sfx-node"
      media={<MediaSlot kind="audio" status={data.status} src={data.src} emptyText="Your sound effect will appear here" />}
      footer={<RunButton status={data.status} onRun={() => data.onRun?.()} onStop={() => data.onStop?.()} />}
    >
      <NodePrompt value={data.prompt} onChange={(v) => data.onPromptChange?.(v)} placeholder="Describe the sound…" />
      <ModelBar
        className="mt-2"
        disabled={data.status === "streaming"}
        onChange={(patch) => data.onSettingChange?.(patch)}
        segments={[
          { kind: "toggle", id: "loop", label: "Loop", value: data.loop ?? false },
          { kind: "duration", id: "duration", value: data.duration ?? "auto", options: [2, 5, 10] },
          { kind: "percent", id: "promptInfluence", label: "Prompt influence", value: data.promptInfluence ?? 30 },
        ]}
      />
      <TypedHandle nodeId={id} dataType="text" type="target" position={Position.Left} />
      <TypedHandle nodeId={id} dataType="audio" type="source" position={Position.Right} />
    </AiNode>
  );
}
```

(Note: the test asserts `Your audio will appear here` from the audio empty-state, but this preset passes `emptyText="Your sound effect will appear here"`. **Correct the test to assert the SFX-specific copy** — the inventory's audio-family convention gives each member its own string ("Your {audio · sound effect · music} will appear here"). Update the test's expected text to `"Your sound effect will appear here"` before implementing; the failing-first run still fails on the missing module.)

- [ ] **Step 4: Run** → PASS. tokens PASS.
- [ ] **Step 5: Demo** (`sfx` node, `status:"idle"`).
- [ ] **Step 6: Register** — `sfx-node`, deps `[self("ai-node"), self("media-slot"), self("model-bar"), self("node-prompt"), self("run-button"), self("typed-handle"), self("flow-types")]`, npm `["@xyflow/react"]`. Rebuild.
- [ ] **Step 7: Commit** — `git add -A && git commit -m "feat(flow): sfx-node preset"`

---

### Task 11: `music-node` preset (lyrics toggle)

**Files:** create `music-node.tsx`, `music-node.test.tsx`, `components/demos/flow/music-node-demo.tsx`.

Composition: `ai-node(slim)` + `media-slot(audio)` + **lyrics toggle → lyrics textarea** (placeholder "Add your lyrics here or leave blank to infer from prompt") + `node-prompt` + `model-bar(model · duration "auto")`; **text IN, audio OUT**.

- [ ] **Step 1: Failing test**

```tsx
// apps/docs/registry/super-ai/flow/music-node.test.tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ReactFlowProvider } from "@xyflow/react";
import { describe, expect, it, vi } from "vitest";
import { MusicNode } from "./music-node";

const wrap = (ui: React.ReactNode) => render(<ReactFlowProvider>{ui}</ReactFlowProvider>);
const props = (data = {}) =>
  ({ id: "n1", data: { prompt: "", lyrics: "", status: "idle", model: "Eleven Music", showLyrics: false, ...data }, selected: false }) as never;

describe("MusicNode", () => {
  it("hides the lyrics field until the lyrics toggle is on", () => {
    wrap(<MusicNode {...props()} />);
    expect(screen.queryByPlaceholderText(/Add your lyrics here/)).toBeNull();
  });
  it("reveals the lyrics textarea with the inference placeholder when toggled", async () => {
    const onToggleLyrics = vi.fn();
    wrap(<MusicNode {...props({ onToggleLyrics })} />);
    await userEvent.click(screen.getByRole("switch", { name: /lyrics/i }));
    expect(onToggleLyrics).toHaveBeenCalledWith(true);
  });
  it("shows the lyrics textarea when showLyrics is true", () => {
    wrap(<MusicNode {...props({ showLyrics: true })} />);
    expect(
      screen.getByPlaceholderText("Add your lyrics here or leave blank to infer from prompt"),
    ).toBeInTheDocument();
  });
  it("renders music empty-state copy, text IN and audio OUT", () => {
    wrap(<MusicNode {...props()} />);
    expect(screen.getByText("Your music will appear here")).toBeInTheDocument();
    expect(document.querySelector('[data-handleid="n1:text:in"]')).toBeTruthy();
    expect(document.querySelector('[data-handleid="n1:audio:out"]')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run** → FAIL. **Step 3: Implement**

```tsx
// apps/docs/registry/super-ai/flow/music-node.tsx
"use client";
import { Position, type NodeProps } from "@xyflow/react";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import type { FlowStatus } from "./flow-types";
import { AiNode } from "./ai-node";
import { MediaSlot } from "./media-slot";
import { ModelBar } from "./model-bar";
import { NodePrompt } from "./node-prompt";
import { RunButton } from "./run-button";
import { TypedHandle } from "./typed-handle";

export interface MusicNodeData {
  prompt: string;
  lyrics: string;
  status: FlowStatus;
  model?: string;
  src?: string;
  showLyrics?: boolean;
  duration?: number | "auto";
  onPromptChange?: (value: string) => void;
  onLyricsChange?: (value: string) => void;
  onToggleLyrics?: (value: boolean) => void;
  onSettingChange?: (patch: { id: string; value: unknown }) => void;
  onRun?: () => void;
  onStop?: () => void;
}

export function MusicNode({ id, data, selected }: NodeProps & { data: MusicNodeData }) {
  return (
    <AiNode
      id={id}
      title="Music"
      status={data.status}
      modelLabel={data.model}
      selected={selected}
      size="sm"
      data-slot="music-node"
      media={<MediaSlot kind="audio" status={data.status} src={data.src} emptyText="Your music will appear here" />}
      footer={<RunButton status={data.status} onRun={() => data.onRun?.()} onStop={() => data.onStop?.()} />}
    >
      <NodePrompt value={data.prompt} onChange={(v) => data.onPromptChange?.(v)} placeholder="Describe the track…" />
      <label data-slot="music-lyrics-toggle" className="mt-2 flex items-center justify-between text-xs">
        <span>Lyrics</span>
        <Switch aria-label="Lyrics" checked={data.showLyrics ?? false} onCheckedChange={(v) => data.onToggleLyrics?.(v)} />
      </label>
      {data.showLyrics ? (
        <textarea
          data-slot="music-lyrics-input"
          value={data.lyrics}
          onChange={(e) => data.onLyricsChange?.(e.target.value)}
          placeholder="Add your lyrics here or leave blank to infer from prompt"
          className={cn("mt-1 min-h-16 w-full resize-none rounded-md border bg-transparent px-2 py-1.5 text-xs", "focus-visible:ring-ring outline-none focus-visible:ring-2")}
        />
      ) : null}
      <ModelBar
        className="mt-2"
        disabled={data.status === "streaming"}
        onChange={(patch) => data.onSettingChange?.(patch)}
        segments={[
          { kind: "model", id: "model", value: data.model ?? "Eleven Music", options: [{ value: data.model ?? "Eleven Music", label: data.model ?? "Eleven Music" }] },
          { kind: "duration", id: "duration", value: data.duration ?? "auto", options: [10, 20, 30] },
        ]}
      />
      <TypedHandle nodeId={id} dataType="text" type="target" position={Position.Left} />
      <TypedHandle nodeId={id} dataType="audio" type="source" position={Position.Right} />
    </AiNode>
  );
}
```

(Uses shadcn `Switch` from `@/components/ui/switch`. If it is not yet installed in the docs app, run `pnpm --filter docs dlx shadcn@latest add switch` before implementing — Wave 2's `model-bar` already needs it for the toggle segment, so it should be present; confirm.)

- [ ] **Step 4: Run** → PASS. tokens PASS.
- [ ] **Step 5: Demo** (`music` node, `showLyrics:false`, `status:"idle"`).
- [ ] **Step 6: Register** — `music-node`, deps `[self("ai-node"), self("media-slot"), self("model-bar"), self("node-prompt"), self("run-button"), self("typed-handle"), self("flow-types"), "switch"]`, npm `["@xyflow/react"]`. Rebuild.
- [ ] **Step 7: Commit** — `git add -A && git commit -m "feat(flow): music-node preset with lyrics toggle"`

---

### Task 12: `track-timeline` + `composition-node` presets

**Files:** create `track-timeline.tsx`, `track-timeline.test.tsx`, `composition-node.tsx`, `composition-node.test.tsx`, `components/demos/flow/composition-node-demo.tsx`.

`track-timeline` (separate file, **view-only**): time ruler 0:00–0:28 ticks, typed color-coded tracks (lane tint via `var(--flow-<type>)`), per-track mute toggle, "+ Add audio track" row. `composition-node`: `ai-node(wide/lg)` + `media-slot(video)` + `track-timeline`; **video+audio IN** (multiple audio).

- [ ] **Step 1: Failing tests**

```tsx
// apps/docs/registry/super-ai/flow/track-timeline.test.tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TrackTimeline } from "./track-timeline";

const tracks = [
  { id: "v", label: "Video", dataType: "video", muted: false },
  { id: "a1", label: "Text to Speech", dataType: "audio", muted: true },
];

describe("TrackTimeline", () => {
  it("renders a time ruler ending at 0:28 and one lane per track tinted by type", () => {
    render(<TrackTimeline tracks={tracks} durationSeconds={28} />);
    expect(screen.getByText("0:00")).toBeInTheDocument();
    expect(screen.getByText("0:28")).toBeInTheDocument();
    const lanes = document.querySelectorAll("[data-slot=track-lane]");
    expect(lanes).toHaveLength(2);
    expect(lanes[0].getAttribute("style")).toContain("--flow-video");
  });
  it("fires onToggleMute for a track and onAddTrack for the add row", async () => {
    const onToggleMute = vi.fn();
    const onAddTrack = vi.fn();
    render(<TrackTimeline tracks={tracks} durationSeconds={28} onToggleMute={onToggleMute} onAddTrack={onAddTrack} />);
    await userEvent.click(screen.getByRole("button", { name: "Mute Video" }));
    await userEvent.click(screen.getByRole("button", { name: "Add audio track" }));
    expect(onToggleMute).toHaveBeenCalledWith("v");
    expect(onAddTrack).toHaveBeenCalledOnce();
  });
  it("shows the empty state when there are no tracks", () => {
    render(<TrackTimeline tracks={[]} durationSeconds={28} />);
    expect(screen.getByText("Connect video and audio nodes")).toBeInTheDocument();
  });
});
```

```tsx
// apps/docs/registry/super-ai/flow/composition-node.test.tsx
import { render, screen } from "@testing-library/react";
import { ReactFlowProvider } from "@xyflow/react";
import { describe, expect, it } from "vitest";
import { CompositionNode } from "./composition-node";

const wrap = (ui: React.ReactNode) => render(<ReactFlowProvider>{ui}</ReactFlowProvider>);
const props = (data = {}) =>
  ({
    id: "n1",
    data: { status: "idle", durationSeconds: 28, tracks: [{ id: "v", label: "Video", dataType: "video", muted: false }], ...data },
    selected: false,
  }) as never;

describe("CompositionNode", () => {
  it("uses the wide (lg) width and renders the timeline tracks", () => {
    wrap(<CompositionNode {...props()} />);
    expect(screen.getByRole("group", { name: "Composition node, idle" })).toHaveStyle({ width: "420px" });
    expect(document.querySelector("[data-slot=track-lane]")).toBeTruthy();
  });
  it("renders video IN and audio IN ports", () => {
    wrap(<CompositionNode {...props()} />);
    expect(document.querySelector('[data-handleid="n1:video:in"]')).toBeTruthy();
    expect(document.querySelector('[data-handleid="n1:audio:in"]')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run** → FAIL. **Step 3: Implement `track-timeline.tsx`**

```tsx
// apps/docs/registry/super-ai/flow/track-timeline.tsx
"use client";
import { Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";
import { getHandleType } from "./flow-types";

export interface Track {
  id: string;
  label: string;
  dataType: string;
  muted?: boolean;
}
export interface TrackTimelineProps {
  tracks: Track[];
  durationSeconds: number;
  onToggleMute?: (trackId: string) => void;
  onAddTrack?: () => void;
  className?: string;
}

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

export function TrackTimeline({ tracks, durationSeconds, onToggleMute, onAddTrack, className }: TrackTimelineProps) {
  const ticks = Array.from({ length: 5 }, (_, i) => Math.round((durationSeconds / 4) * i));
  return (
    <div data-slot="track-timeline" className={cn("flex flex-col gap-1", className)}>
      <div data-slot="track-ruler" className="text-muted-foreground flex justify-between px-1 text-[10px]">
        {ticks.map((t, i) => (
          <span key={i}>{fmt(t)}</span>
        ))}
      </div>
      {tracks.length === 0 ? (
        <p data-slot="track-empty" className="text-muted-foreground rounded-md border border-dashed px-2 py-3 text-center text-xs">
          Connect video and audio nodes
        </p>
      ) : (
        tracks.map((track) => {
          const cssVar = getHandleType(track.dataType)?.cssVar ?? "--flow-text";
          return (
            <div
              key={track.id}
              data-slot="track-lane"
              data-flow-type={track.dataType}
              className="flex items-center gap-2 rounded-md border px-2 py-1"
              style={{ background: `color-mix(in oklch, var(${cssVar}) 12%, transparent)` }}
            >
              <span aria-hidden className="size-1.5 shrink-0 rounded-full" style={{ background: `var(${cssVar})` }} />
              <span className="flex-1 truncate text-[11px]" style={{ color: `var(${cssVar})` }}>
                {track.label}
              </span>
              <button
                type="button"
                aria-label={`${track.muted ? "Unmute" : "Mute"} ${track.label}`}
                data-slot="track-mute"
                onClick={() => onToggleMute?.(track.id)}
                className="text-muted-foreground hover:text-foreground"
              >
                {track.muted ? <VolumeX className="size-3.5" /> : <Volume2 className="size-3.5" />}
              </button>
            </div>
          );
        })
      )}
      <button
        type="button"
        aria-label="Add audio track"
        data-slot="track-add"
        onClick={() => onAddTrack?.()}
        className="text-muted-foreground hover:text-foreground rounded-md border border-dashed px-2 py-1 text-left text-[11px]"
      >
        + Add audio track
      </button>
    </div>
  );
}
```

(Lane tint uses `color-mix(in oklch, var(--flow-*) 12%, transparent)` — a CSS function over a token, **not a raw color** — so `check:tokens` passes. The mute label flips Mute/Unmute by state; the test asserts on `"Mute Video"` for an unmuted track.)

- [ ] **Step 4: Implement `composition-node.tsx`**

```tsx
// apps/docs/registry/super-ai/flow/composition-node.tsx
"use client";
import { Position, type NodeProps } from "@xyflow/react";
import type { FlowStatus } from "./flow-types";
import { AiNode } from "./ai-node";
import { MediaSlot } from "./media-slot";
import { TypedHandle } from "./typed-handle";
import { TrackTimeline, type Track } from "./track-timeline";

export interface CompositionNodeData {
  status: FlowStatus;
  durationSeconds: number;
  tracks: Track[];
  src?: string;
  onToggleMute?: (trackId: string) => void;
  onAddTrack?: () => void;
}

export function CompositionNode({ id, data, selected }: NodeProps & { data: CompositionNodeData }) {
  return (
    <AiNode
      id={id}
      title="Composition"
      status={data.status}
      selected={selected}
      size="lg"
      data-slot="composition-node"
      media={<MediaSlot kind="video" status={data.status} src={data.src} emptyText="Your generation will appear here" />}
    >
      <TrackTimeline
        tracks={data.tracks}
        durationSeconds={data.durationSeconds}
        onToggleMute={data.onToggleMute}
        onAddTrack={data.onAddTrack}
      />
      <TypedHandle nodeId={id} dataType="video" type="target" position={Position.Left} top={28} />
      <TypedHandle nodeId={id} dataType="audio" type="target" position={Position.Left} top={52} />
    </AiNode>
  );
}
```

- [ ] **Step 5: Run both** → PASS. tokens PASS.
- [ ] **Step 6: Demo** (one `composition` node with a video track + two audio tracks; `status:"done"`, `src:"/stubs/video-1.mp4"`).
- [ ] **Step 7: Register both** —
  - `track-timeline`: `registryDependencies: [self("flow-types")]`, npm `["lucide-react"]`.
  - `composition-node`: `registryDependencies: [self("ai-node"), self("media-slot"), self("typed-handle"), self("track-timeline"), self("flow-types")]`, npm `["@xyflow/react"]`.
  Rebuild; expect `public/r/track-timeline.json` + `public/r/composition-node.json`.
- [ ] **Step 8: Commit** — `git add -A && git commit -m "feat(flow): track-timeline + composition-node presets"`

---

### Task 13: `asset-output-node` preset

**Files:** create `asset-output-node.tsx`, `asset-output-node.test.tsx`, `components/demos/flow/asset-output-node-demo.tsx`.

Composition: `ai-node` + routing card ("results go to → Assets/…") + folder text field; terminal sink; **any-type IN, no OUT**.

- [ ] **Step 1: Failing test**

```tsx
// apps/docs/registry/super-ai/flow/asset-output-node.test.tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ReactFlowProvider } from "@xyflow/react";
import { describe, expect, it, vi } from "vitest";
import { AssetOutputNode } from "./asset-output-node";

const wrap = (ui: React.ReactNode) => render(<ReactFlowProvider>{ui}</ReactFlowProvider>);
const props = (data = {}) => ({ id: "n1", data: { folder: "Perfume Ad", status: "idle", ...data }, selected: false }) as never;

describe("AssetOutputNode", () => {
  it("renders the routing explainer and a folder field, with an IN port and no OUT", () => {
    wrap(<AssetOutputNode {...props()} />);
    expect(screen.getByText(/results go to/i)).toBeInTheDocument();
    expect(screen.getByLabelText("Destination folder")).toHaveValue("Perfume Ad");
    expect(document.querySelector('[data-handleid$=":in"]')).toBeTruthy();
    expect(document.querySelector('[data-handleid$=":out"]')).toBeNull();
  });
  it("emits onFolderChange", async () => {
    const onFolderChange = vi.fn();
    wrap(<AssetOutputNode {...props({ folder: "A", onFolderChange })} />);
    await userEvent.type(screen.getByLabelText("Destination folder"), "B");
    expect(onFolderChange).toHaveBeenLastCalledWith("AB");
  });
});
```

- [ ] **Step 2: Run** → FAIL. **Step 3: Implement**

```tsx
// apps/docs/registry/super-ai/flow/asset-output-node.tsx
"use client";
import { FolderInput } from "lucide-react";
import { Position, type NodeProps } from "@xyflow/react";
import { cn } from "@/lib/utils";
import type { FlowStatus } from "./flow-types";
import { AiNode } from "./ai-node";
import { TypedHandle } from "./typed-handle";

export interface AssetOutputNodeData {
  folder: string;
  status: FlowStatus;
  /** Which data type this sink accepts; defaults to "video". */
  accepts?: string;
  onFolderChange?: (value: string) => void;
}

export function AssetOutputNode({ id, data, selected }: NodeProps & { data: AssetOutputNodeData }) {
  return (
    <AiNode id={id} title="Asset Output" status={data.status} selected={selected} size="sm" data-slot="asset-output-node">
      <div data-slot="asset-output-routing" className="text-muted-foreground flex items-center gap-1.5 text-[11px]">
        <FolderInput aria-hidden className="size-3.5 shrink-0" />
        <span>results go to → Assets/{data.folder || "…"}</span>
      </div>
      <label data-slot="asset-output-folder" className="mt-2 flex flex-col gap-1 text-[11px]">
        <span className="sr-only">Destination folder</span>
        <input
          aria-label="Destination folder"
          value={data.folder}
          onChange={(e) => data.onFolderChange?.(e.target.value)}
          placeholder="Folder name"
          className={cn("w-full rounded-md border bg-transparent px-2 py-1 text-xs", "focus-visible:ring-ring outline-none focus-visible:ring-2")}
        />
      </label>
      <TypedHandle nodeId={id} dataType={data.accepts ?? "video"} type="target" position={Position.Left} />
    </AiNode>
  );
}
```

- [ ] **Step 4: Run** → PASS. tokens PASS.
- [ ] **Step 5: Demo** (`asset-output` node, `folder:"Perfume Ad"`).
- [ ] **Step 6: Register** — `asset-output-node`, deps `[self("ai-node"), self("typed-handle"), self("flow-types")]`, npm `["@xyflow/react", "lucide-react"]`. Rebuild.
- [ ] **Step 7: Commit** — `git add -A && git commit -m "feat(flow): asset-output-node preset"`

---

### Task 14: `reference-node` preset (image-input / style-reference variants)

**Files:** create `reference-node.tsx`, `reference-node.test.tsx`, `components/demos/flow/reference-node-demo.tsx`.

Composition: `ai-node` + asset picker (file input + URL field) via a `variant` prop (`"image-input" | "style-reference"`); demo-level picker; **no IN, image OUT** (image-input) / **style OUT** (style-reference). The `style` type is a custom handle type — register it lazily in the preset module so `getHandleType("style")` resolves.

- [ ] **Step 1: Failing test**

```tsx
// apps/docs/registry/super-ai/flow/reference-node.test.tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ReactFlowProvider } from "@xyflow/react";
import { describe, expect, it, vi } from "vitest";
import { ReferenceNode } from "./reference-node";

const wrap = (ui: React.ReactNode) => render(<ReactFlowProvider>{ui}</ReactFlowProvider>);
const props = (data = {}) => ({ id: "n1", data: { variant: "image-input", status: "idle", url: "", ...data }, selected: false }) as never;

describe("ReferenceNode", () => {
  it("image-input variant titles correctly and exposes an image OUT port", () => {
    wrap(<ReferenceNode {...props()} />);
    expect(screen.getByRole("group", { name: "Image Input node, idle" })).toBeInTheDocument();
    expect(document.querySelector('[data-handleid="n1:image:out"]')).toBeTruthy();
  });
  it("style-reference variant exposes a style OUT port", () => {
    wrap(<ReferenceNode {...props({ variant: "style-reference" })} />);
    expect(screen.getByRole("group", { name: "Style Reference node, idle" })).toBeInTheDocument();
    expect(document.querySelector('[data-handleid="n1:style:out"]')).toBeTruthy();
  });
  it("provides a file input and a URL field; URL changes emit onUrlChange", async () => {
    const onUrlChange = vi.fn();
    wrap(<ReferenceNode {...props({ onUrlChange })} />);
    expect(screen.getByLabelText("Upload asset")).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText("Asset URL"), "h");
    expect(onUrlChange).toHaveBeenLastCalledWith("h");
  });
});
```

- [ ] **Step 2: Run** → FAIL. **Step 3: Implement**

```tsx
// apps/docs/registry/super-ai/flow/reference-node.tsx
"use client";
import { Position, type NodeProps } from "@xyflow/react";
import { cn } from "@/lib/utils";
import { getHandleType, registerHandleType, type FlowStatus } from "./flow-types";
import { AiNode } from "./ai-node";
import { MediaSlot } from "./media-slot";
import { TypedHandle } from "./typed-handle";

// Register the custom "style" handle type once on module load (idempotent).
if (!getHandleType("style")) registerHandleType("style", { label: "Style" });

export type ReferenceVariant = "image-input" | "style-reference";
export interface ReferenceNodeData {
  variant: ReferenceVariant;
  status: FlowStatus;
  url: string;
  src?: string;
  onUrlChange?: (value: string) => void;
  onFileSelect?: (file: File) => void;
}

const META: Record<ReferenceVariant, { title: string; outType: string }> = {
  "image-input": { title: "Image Input", outType: "image" },
  "style-reference": { title: "Style Reference", outType: "style" },
};

export function ReferenceNode({ id, data, selected }: NodeProps & { data: ReferenceNodeData }) {
  const meta = META[data.variant];
  return (
    <AiNode
      id={id}
      title={meta.title}
      status={data.status}
      selected={selected}
      size="sm"
      data-slot="reference-node"
      media={<MediaSlot kind="image" status={data.src ? "done" : "idle"} src={data.src} alt={meta.title} emptyText="Pick an asset" />}
    >
      <label data-slot="reference-upload" className="mt-1 block text-[11px]">
        <span className="sr-only">Upload asset</span>
        <input
          type="file"
          aria-label="Upload asset"
          accept="image/*"
          onChange={(e) => e.target.files?.[0] && data.onFileSelect?.(e.target.files[0])}
          className="block w-full text-[11px] file:mr-2 file:rounded file:border file:bg-transparent file:px-2 file:py-0.5"
        />
      </label>
      <input
        aria-label="Asset URL"
        value={data.url}
        onChange={(e) => data.onUrlChange?.(e.target.value)}
        placeholder="…or paste an image URL"
        className={cn("mt-1 w-full rounded-md border bg-transparent px-2 py-1 text-xs", "focus-visible:ring-ring outline-none focus-visible:ring-2")}
      />
      <TypedHandle nodeId={id} dataType={meta.outType} type="source" position={Position.Right} />
    </AiNode>
  );
}
```

(A `--flow-style` token is not defined in Wave 2's `flow-tokens.css`; `getHandleType("style")?.cssVar` returns `--flow-style`, and `TypedHandle` falls back to `var(--flow-style)` which resolves to nothing → the port still renders with the default border. This is acceptable for the demo-level reference node; do **not** add a raw color. If a visible style color is wanted later, add `--flow-style` to `flow-tokens.css` in a follow-up — out of scope here.)

- [ ] **Step 4: Run** → PASS. tokens PASS.
- [ ] **Step 5: Demo** (two `reference` nodes side by side: one `image-input`, one `style-reference`).
- [ ] **Step 6: Register** — `reference-node`, deps `[self("ai-node"), self("media-slot"), self("typed-handle"), self("flow-types")]`, npm `["@xyflow/react"]`. Rebuild.
- [ ] **Step 7: Commit** — `git add -A && git commit -m "feat(flow): reference-node preset"`

---

### Task 15: Seed graph + fetch-based execute

**Files:**
- Create: `apps/docs/lib/flow/seed-perfume.ts`
- Create: `apps/docs/lib/flow/fetch-execute.ts`
- Create: `apps/docs/lib/flow/fetch-execute.test.ts`

- [ ] **Step 1: Failing test for `fetch-execute`**

```ts
// apps/docs/lib/flow/fetch-execute.test.ts
import { afterEach, describe, expect, it, vi } from "vitest";
import { createFetchExecute } from "./fetch-execute";
import type { RunnerNode } from "@/registry/super-ai/flow/use-flow-runner";

afterEach(() => vi.unstubAllGlobals());
const node = (id: string, data: Record<string, unknown>): RunnerNode => ({ id, data });

describe("createFetchExecute", () => {
  it("POSTs to the kind's route with prompt + inputs and returns { url } from the result", async () => {
    const fetchMock = vi.fn(async () => Response.json({ kind: "image", url: "blob:x", provider: "stub" }));
    vi.stubGlobal("fetch", fetchMock);
    const execute = createFetchExecute();
    const out = await execute(
      node("n1", { kind: "image", prompt: "a bottle" }),
      { up: { url: "blob:up", kind: "image" } },
      new AbortController().signal,
    );
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/generate/image");
    expect(JSON.parse(init.body)).toMatchObject({ kind: "image", prompt: "a bottle", inputs: { up: { url: "blob:up" } } });
    expect(out).toMatchObject({ url: "blob:x", kind: "image" });
  });
  it("throws a normalized error when the route returns an error body", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ code: "elevenlabs_speech_error", message: "401" }, { status: 502 })));
    const execute = createFetchExecute();
    await expect(
      execute(node("n1", { kind: "speech", prompt: "x" }), {}, new AbortController().signal),
    ).rejects.toThrow(/401/);
  });
  it("passes the AbortSignal through to fetch", async () => {
    const fetchMock = vi.fn(async () => Response.json({ kind: "image", url: "u", provider: "stub" }));
    vi.stubGlobal("fetch", fetchMock);
    const ctl = new AbortController();
    await createFetchExecute()(node("n1", { kind: "image", prompt: "p" }), {}, ctl.signal);
    expect(fetchMock.mock.calls[0][1].signal).toBe(ctl.signal);
  });
});
```

- [ ] **Step 2: Run** → FAIL. **Step 3: Implement `fetch-execute.ts`**

```ts
// apps/docs/lib/flow/fetch-execute.ts
// Browser-side execute() for useFlowRunner: maps a node to its /api/generate/<kind> route,
// forwards prompt + resolved upstream inputs + node options, passes the AbortSignal, and
// normalizes the result into NodeOutput. The ONLY place the demo touches the network.
import type { NodeOutput, RunnerNode } from "@/registry/super-ai/flow/use-flow-runner";

type Inputs = Record<string, { url?: string; text?: string; kind?: string }>;

export function createFetchExecute() {
  return async function fetchExecute(node: RunnerNode, inputs: Inputs, signal: AbortSignal): Promise<NodeOutput> {
    const kind = String(node.data.kind ?? "image");
    const prompt = String(node.data.prompt ?? node.data.script ?? node.data.lyrics ?? "");
    const res = await fetch(`/api/generate/${kind}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ kind, prompt, inputs, options: node.data.options ?? node.data }),
      signal,
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body?.message ?? `Generation failed (${res.status}).`);
    return { url: body.url, text: body.text, kind: body.kind, provider: body.provider };
  };
}
```

- [ ] **Step 4: Implement `seed-perfume.ts`** (the Luxury Perfume graph)

```ts
// apps/docs/lib/flow/seed-perfume.ts
// The seeded Luxury Perfume graph for the /flow demo. Node `type` keys match the
// nodeTypes registered on the canvas; `data.kind` selects the /api/generate route.
import type { Edge, Node } from "@xyflow/react";

export interface SeedGraph {
  nodes: Node[];
  edges: Edge[];
}

const roger = { id: "roger", name: "Roger", descriptors: ["Laid-Back", "Casual", "Resonant"] };

export function seedPerfumeGraph(): SeedGraph {
  const nodes: Node[] = [
    { id: "img-a", type: "image", position: { x: 0, y: 0 }, data: { kind: "image", status: "idle", model: "Nano Banana 2", prompt: "A crystal perfume bottle on marble, golden hour" } },
    { id: "img-b", type: "image", position: { x: 0, y: 220 }, data: { kind: "image", status: "idle", model: "Nano Banana 2", prompt: "Soft silk fabric backdrop, warm tones" } },
    { id: "combine", type: "image", position: { x: 360, y: 110 }, data: { kind: "image", status: "idle", model: "Nano Banana 2", maxImageInputs: 2, prompt: "Bottle from @1 resting on fabric from @2" } },
    { id: "video", type: "video", position: { x: 720, y: 110 }, data: { kind: "video", status: "idle", model: "LTX 2.3", runtime: "local", prompt: "Slow dolly-in on the bottle, light glints" } },
    { id: "script", type: "text", position: { x: 0, y: 460 }, data: { value: "Discover the new signature scent." } },
    { id: "tts", type: "tts", position: { x: 360, y: 460 }, data: { kind: "speech", status: "idle", model: "Eleven Multilingual v2", voice: roger, script: "Discover the new signature scent." } },
    { id: "sfx", type: "sfx", position: { x: 360, y: 660 }, data: { kind: "sfx", status: "idle", model: "Eleven SFX", loop: false, duration: "auto", promptInfluence: 30, prompt: "A soft glass chime and gentle ambience" } },
    { id: "music", type: "music", position: { x: 360, y: 860 }, data: { kind: "music", status: "idle", model: "Eleven Music", showLyrics: false, duration: "auto", prompt: "Warm cinematic lo-fi bed, elegant" } },
    { id: "comp", type: "composition", position: { x: 1080, y: 360 }, data: { status: "idle", durationSeconds: 28, tracks: [
      { id: "t-video", label: "Video", dataType: "video", muted: false },
      { id: "t-tts", label: "Text to Speech", dataType: "audio", muted: false },
      { id: "t-sfx", label: "Sound Effects", dataType: "audio", muted: false },
      { id: "t-music", label: "Music", dataType: "audio", muted: false },
    ] } },
  ];
  const edges: Edge[] = [
    { id: "e-a-combine", source: "img-a", target: "combine", sourceHandle: "img-a:image:out", targetHandle: "combine:image:in" },
    { id: "e-b-combine", source: "img-b", target: "combine", sourceHandle: "img-b:image:out", targetHandle: "combine:image:in" },
    { id: "e-combine-video", source: "combine", target: "video", sourceHandle: "combine:image:out", targetHandle: "video:image:in" },
    { id: "e-script-tts", source: "script", target: "tts", sourceHandle: "script:text:out", targetHandle: "tts:text:in" },
    { id: "e-video-comp", source: "video", target: "comp", sourceHandle: "video:video:out", targetHandle: "comp:video:in" },
    { id: "e-tts-comp", source: "tts", target: "comp", sourceHandle: "tts:audio:out", targetHandle: "comp:audio:in" },
    { id: "e-sfx-comp", source: "sfx", target: "comp", sourceHandle: "sfx:audio:out", targetHandle: "comp:audio:in" },
    { id: "e-music-comp", source: "music", target: "comp", sourceHandle: "music:audio:out", targetHandle: "comp:audio:in" },
  ];
  return { nodes, edges };
}
```

- [ ] **Step 5: Run** — `pnpm --filter docs test -- --run fetch-execute` → PASS. `pnpm --filter docs typecheck` → PASS.
- [ ] **Step 6: Commit** — `git add -A && git commit -m "feat(flow): perfume seed graph + fetch-based execute"`

---

### Task 16: `/flow` demo upgrade (route-backed execute + persistence + reset)

**Files:**
- Modify: `apps/docs/app/flow/flow-demo.tsx` (Wave 2 created it with `stubExecute`; this wave swaps in the seed graph, `createFetchExecute`, persistence, and reset)
- Modify (if needed): `apps/docs/app/flow/page.tsx` (server shell — only if it must pass anything new; otherwise unchanged)

This task wires the presets + provider routes into the existing Wave 2 demo. Read `flow-demo.tsx` first; preserve its working canvas setup (`ReactFlow`, `TypedEdge`, `useFlowRunner` wiring) and change only the four things below.

- [ ] **Step 1: Register the 10 presets in `nodeTypes`**

In `flow-demo.tsx`, import all ten presets and map them: `const nodeTypes = { text: TextNode, llm: LlmNode, image: ImageNode, video: VideoNode, tts: TtsNode, sfx: SfxNode, music: MusicNode, composition: CompositionNode, "asset-output": AssetOutputNode, reference: ReferenceNode }`. Map edges to the Wave 2 `TypedEdge`: `const edgeTypes = { typed: TypedEdge }` (and default new edges to `type: "typed"`).

- [ ] **Step 2: Seed from `seedPerfumeGraph()` with localStorage persistence**

```tsx
// inside flow-demo.tsx (client component)
import { seedPerfumeGraph } from "@/lib/flow/seed-perfume";
import { createFetchExecute } from "@/lib/flow/fetch-execute";

const STORAGE_KEY = "flow-kit-demo";

function loadGraph() {
  if (typeof window === "undefined") return seedPerfumeGraph();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ReturnType<typeof seedPerfumeGraph>) : seedPerfumeGraph();
  } catch {
    return seedPerfumeGraph();
  }
}
```

- Initialize `useNodesState` / `useEdgesState` (React Flow) from `loadGraph()`.
- In a `useEffect` keyed on `[nodes, edges]`, write `window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ nodes, edges }))` (strip non-serializable handlers first — persist only `id/type/position/data` scalar fields; re-attach `on*` handlers from a `withHandlers(node)` mapper at render time, since functions don't survive JSON).
- A **Reset to seed** button: `setNodes(seedPerfumeGraph().nodes); setEdges(seedPerfumeGraph().edges); window.localStorage.removeItem(STORAGE_KEY)`.

- [ ] **Step 3: Swap execute from `stubExecute` to `createFetchExecute()`**

Replace the Wave 2 `useFlowRunner({ ..., execute: stubExecute })` with `execute: createFetchExecute()`. Keep the existing `onStatus` wiring that writes `status` back into each node's `data` (so presets re-render through `streaming → done/failed`). The runner already passes its `AbortController` signal into `execute`; `createFetchExecute` forwards it to `fetch` (Task 15 test proves this) — so the runner's `stop()` cancels in-flight route calls.

- [ ] **Step 4: Wire node `data.on*` handlers to the runner**

Each preset reads `data.onRun` / `data.onStop` / `data.onPromptChange` / `data.onSettingChange` etc. In the `withHandlers` mapper, inject:
- `onRun: () => runner.runFrom(node.id)` (run this node + downstream; dirty-tracking cache skips clean upstream — the partial-generation behavior from the spec).
- `onStop: () => runner.stop()`.
- `onPromptChange / onScriptChange / onLyricsChange / onFolderChange / onUrlChange`: `(v) => updateNodeData(node.id, { <field>: v })` and `markDirty(node.id)`.
- `onSettingChange: (patch) => updateNodeData(node.id, { [patch.id]: patch.value })` and `markDirty(node.id)`.
- `onToggleLyrics: (v) => updateNodeData(node.id, { showLyrics: v })`.
- `onToggleMute / onAddTrack` for the composition node: update its `tracks` array in `data`.

(`updateNodeData` is React Flow's `useReactFlow().updateNodeData` or a `setNodes` map; `markDirty` comes from the Wave 2 runner.)

- [ ] **Step 5: Manual verify** — `pnpm --filter docs dev`, open `/flow`:
  - The perfume graph renders: 2 image nodes → combine (2 image IN) → video; text → tts; sfx; music; all four into composition (video + 3 audio tracks).
  - **Run all** (or run the composition node) → upstream nodes run in topological order, statuses animate `queued → streaming → done`, media slots fill from `/stubs/*` (no keys → stub provider).
  - Edit an image prompt → only that image + its downstream (combine, video, composition) re-run (cache demo); independent audio branch untouched.
  - Toggle a node's failure (demo-only checkbox writing `data.options.failPlease = true`, or a node whose route returns the scripted failure) → `failed` banner on that node, downstream skipped, sibling branches still finish.
  - Reload the page → graph persists from `localStorage`. Click **Reset to seed** → returns to the seeded perfume graph.

- [ ] **Step 6: Commit** — `git add -A && git commit -m "feat(flow): /flow demo — perfume graph on real routes + persistence + reset"`

---

### Task 17: Catalog pages + final gate

**Files:**
- Create: `apps/docs/app/components/[name]` entries (or `lib/catalog.ts` additions + demo wiring) for the 10 presets, following Wave 0's Task 14 pattern exactly. Read one existing component page first; copy its structure (live demo import, install command with `REGISTRY_URL`, props table, states showcase).
- Modify: catalog index — add the 10 presets under the existing "Flow Kit" group (created in Wave 2 Task 14).

- [ ] **Step 1: Add the 10 presets to the catalog list/registry of demos**

Extend `apps/docs/lib/catalog.ts` (or whatever Wave 0/Wave 2 used) with: `text-node`, `llm-node`, `image-node`, `video-node`, `tts-node`, `sfx-node`, `music-node`, `composition-node`, `track-timeline`, `asset-output-node`, `reference-node`. Map each to its demo from `components/demos/flow/`. `track-timeline` has no React Flow wrapper demo — give it a plain demo rendering `<TrackTimeline tracks={…} durationSeconds={28} />` inside a bordered box (it is the one preset that renders standalone without `ReactFlowProvider`).

- [ ] **Step 2: Per-preset catalog pages** render: title, live demo (in a min-height bordered canvas box), install command `npx shadcn@latest add ${REGISTRY_URL}/r/<name>.json`, a short props table (the `<Preset>Data` fields), and a one-line composition note ("composes ai-node + media-slot + model-bar + node-prompt + typed-handle"). Match the existing page component's structure; do not invent a new layout.

- [ ] **Step 3: Full gate** — run every check, all green:

```bash
pnpm lint
pnpm typecheck
pnpm check:tokens
pnpm --filter docs test -- --run
pnpm build:registry   # or the exact Wave 0 script name; expect public/r/*.json for all 10 presets + track-timeline
pnpm --filter docs build
```

Expected: lint clean, no type errors, tokens clean (every preset uses only `var(--flow-*)` + shadcn vars + `color-mix` over tokens), all Vitest suites pass (presets + provider adapters + fetch-execute), registry build emits `public/r/{text-node,llm-node,image-node,video-node,tts-node,sfx-node,music-node,composition-node,track-timeline,asset-output-node,reference-node}.json`, Next build statically generates all new catalog pages.

- [ ] **Step 4: Commit** — `git add -A && git commit -m "docs(flow): catalog pages for the 10 modality presets + provider layer"`. Push the branch; do NOT merge — Wave 0 then Wave 2 must merge first (coordination protocol).

---

## Dispatcher notes (subagent-driven execution)

Presets are mutually independent (no L3→L3 edges) and depend only on Wave 2 L2 → maximally parallel. The provider layer is independent of the presets and parallelizes with them. Demo + catalog are last (they consume everything).

| Group | Tasks | Parallel? |
|---|---|---|
| G0 | 0 | sequential — verifies the Wave 2 end-state before anything runs |
| G1 (provider) | 1 → 2 → 3 → 4 | sequential within the group (2 needs 1's types; 3 needs 2's stub + the shared `run-route`; 4 reuses 3's `postAudio` + `runGenerateRoute`). Runs in parallel with G2. |
| G2 (presets) | 5, 6, 7, 8, 9, 10, 11, 12, 13, 14 | all parallel after G0. Each is self-contained; only requirement is reading `gen-registry.mts` before registering (serialize the registry-file edits, or have each agent append its one item and let the integration step reconcile — prefer one agent owning `gen-registry.mts` edits if conflicts arise). Task 12 produces two items (track-timeline + composition-node) in one task. |
| G3 (demo glue) | 15 | after G1 (needs the routes) and after G2 (needs the preset node types referenced by the seed graph's `type` keys — though the seed graph only uses string keys, the demo in G4 needs the components). 15 itself only needs the routes (G1) + Wave 2 runner; can start once G1 done. |
| G4 (assembly) | 16 → 17 | sequential, last. 16 wires presets (G2) + routes (G1) + seed/execute (G15) into `/flow`; 17 adds catalog pages and runs the full gate. |

Each subagent receives: this plan's task text (self-contained), plus paths to the wave spec, the inventory (§Group 3 + audio-family + composition deep spec), the Wave 2 plan (for the L2 contracts), and master spec §6. Subagents work ONLY in the `../flow-kit-worktree` worktree on `wave-2-flow-foundation`. Rebase onto `wave-0-foundation` between groups.

## Self-review checklist (run before dispatch)

- **Spec coverage — presets:** all 10 of inventory §Group 3 present — text ✓ llm ✓ image (multi-image IN) ✓ video ✓ tts (voice row: avatar · name · descriptors) ✓ sfx (loop · auto · percent model-bar) ✓ music (lyrics toggle → lyrics textarea, exact placeholder) ✓ composition + track-timeline (separate file, view-only ruler 0:00–0:28 · color-coded typed tracks · per-track mute · + add audio track) ✓ asset-output (routing card + folder field) ✓ reference (image-input/style-reference variants, file + URL picker) ✓.
- **Spec coverage — provider layer:** `GenerateAdapter` interface ✓ stub (deterministic media, 800–2500ms, AbortSignal, scripted failure) ✓ elevenlabs speech+sfx+music (exact endpoints: `/v1/text-to-speech/{voice_id}`, `/v1/sound-generation`, `/v1/music`) ✓ gateway image+llm (`generateImage`/`generateText`, `provider/model` strings) ✓ fal video (`queue.fal.run` via `@fal-ai/client`) ✓ six generate routes choosing real-when-keyed else stub ✓ status route returning `{ providers: { … } }` ✓ error normalization `{ code, message }` ✓. Complete code given for types, stub, status route, AND one real adapter+route (elevenlabs speech); the rest also carry complete code, sharing `postAudio` + `runGenerateRoute` defined once in Task 3 (no "similar to Task N").
- **Spec coverage — demo:** seed-perfume graph (2 image → combine multi-image → video; text → tts; sfx; music; composition ← video + 3 audio) ✓ fetch-execute hitting routes with AbortSignal passthrough ✓ localStorage key `flow-kit-demo` ✓ reset-to-seed ✓. Catalog pages for the 10 presets following Wave 0's pattern ✓ full gate ✓.
- **No placeholders:** every code step carries real code; no `TBD`/`TODO`/"similar to". `gen-registry.mts` edits say "follow existing shape / read first" because that file is Wave 0's contract — agents read it before appending, exactly as Wave 2 did.
- **Type consistency with Wave 2 contracts:** `FlowStatus` six-state union (`idle|queued|streaming|done|failed|locked`) used by every preset's `status` and passed straight to `AiNode`; `handleId` codec `{nodeId}:{dataType}:{in|out}` matches every `data-handleid` assertion and the seed graph's `sourceHandle/targetHandle`; `RunnerNode`/`NodeOutput` from the Wave 2 runner used by `fetch-execute` + `seed-perfume`; `AiNode`/`MediaSlot`/`ModelBar`/`NodePrompt`/`RunButton`/`TypedHandle`/`PortChips` props consumed exactly as Wave 2 exports them (each preset task notes "read the source and adapt if an export differs").
- **Conventions enforced everywhere:** `"use client"` on all presets + track-timeline; PascalCase exports / kebab files; `data-slot` on every part; `cn()` className passthrough; controlled props + `on*` callbacks; NO fetch in any registry component (fetch only in `lib/flow/*` + routes); NO raw colors in `.tsx` (`var(--flow-*)`, shadcn vars, `color-mix` over tokens only — `check:tokens` enforces); colocated `*.test.tsx` behavior tests; status vocabulary exact.
- **Layer rule:** presets depend only on flow L2 + L1 + L0; no preset imports another preset (verified per task's `registryDependencies` — all point at Wave 2 siblings, never at another Task-5–14 item). `track-timeline` is L2-shaped (consumed by `composition-node`) but ships as its own registry item per the inventory; `composition-node` depends on it by URL — the one intra-preset dependency, and it is anatomy→preset, not preset→preset.
