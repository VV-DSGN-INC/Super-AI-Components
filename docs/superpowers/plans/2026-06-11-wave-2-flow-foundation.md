# Wave 2 — Flow Kit Foundation (flow L2 + runner) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the Flow Kit's foundation layer — `flow-types`, the 4 wiring + 6 anatomy components, and `useFlowRunner` — as registry items with tests, demos, and a working image→video chain demo page.

**Architecture:** Flow sources live at `apps/docs/registry/super-ai/flow/` (install target `components/super-ai/flow/`), classified flow-L2 per the wave spec: presets/chrome (waves 3–4) may depend on them; they depend only on L0 (shadcn), L1 (AI Elements via cross-registry URLs), and Wave 0's L2 primitives. All execution is headless (`use-flow-runner`); components are controlled, fetch-free, and token-clean (`check:tokens` passes).

**Tech Stack:** TypeScript · React 19 · Next.js App Router · Tailwind v4 (shadcn CSS variables) · `@xyflow/react` v12 · Vitest + RTL (jsdom) · existing `gen-registry.mts` pipeline.

**Specs this plan implements:** [`docs/superpowers/specs/2026-06-11-flow-kit-design.md`](../specs/2026-06-11-flow-kit-design.md) (wave spec) + component anatomy in [`docs/flow-kit-inventory.md`](../../flow-kit-inventory.md) §Group 1, §Group 2, §Deep specs. Conventions: master spec §6 + Wave 0 plan deviations.

**Coordination protocol (read first):**

1. Wave 0 is being executed by a parallel session on `wave-0-foundation` in the primary working tree. **All Wave 2 work happens in a dedicated worktree** (Task 0) cut from `wave-0-foundation`'s latest commit. Never edit files under `apps/docs/registry/super-ai/` outside `flow/`, never touch Wave 0's plan/scripts.
2. Rebase the worktree branch onto `wave-0-foundation` at every task boundary (`git fetch . wave-0-foundation && git rebase wave-0-foundation` from the worktree).
3. **Task 9 (`model-bar`) is gated** on Wave 0 Task 12 (`gen-settings-bar`) existing. Check `apps/docs/registry/super-ai/gen-settings-bar.tsx` after rebase; if absent, skip Task 9, continue with later tasks, return to it after the next rebase that brings it in.
4. Merging this wave to `main` happens only after Wave 0 merges.

---

## File structure (end state of Wave 2)

```
apps/docs/
├── registry/super-ai/flow/
│   ├── flow-types.ts              flow-types.test.ts        # type registry, statuses, tokens TS side
│   ├── flow-tokens.css                                      # --flow-* custom properties (light+dark)
│   ├── typed-handle.tsx           typed-handle.test.tsx
│   ├── typed-edge.tsx             typed-edge.test.tsx
│   ├── port-chip.tsx              port-chip.test.tsx
│   ├── connection-hint.tsx        connection-hint.test.tsx
│   ├── ai-node.tsx                ai-node.test.tsx          # includes NodeStatus badge subcomponent
│   ├── node-status.tsx            node-status.test.tsx
│   ├── media-slot.tsx             media-slot.test.tsx
│   ├── run-button.tsx             run-button.test.tsx
│   ├── model-bar.tsx              model-bar.test.tsx        # gated on Wave 0 gen-settings-bar
│   ├── node-prompt.tsx            node-prompt.test.tsx
│   └── use-flow-runner.ts         use-flow-runner.test.ts
├── components/demos/flow/                                    # one demo per item (client components)
├── app/components/[name]/                                    # catalog pages pick up new items
└── app/flow/page.tsx                                         # Wave 2 demo: image→video chain (stub exec)
```

`gen-registry.mts` discovers items from a manifest array — Task 1 extends it with the `flow/` directory and the `@xyflow/react` dependency declaration; AI Elements items are referenced by full URL in `registryDependencies`.

---

### Task 0: Worktree + branch setup

**Files:** none (git only)

- [ ] **Step 1: Create the worktree from the latest Wave 0 commit**

```bash
cd "/Users/nickv/ClaudeCode Projects/AI Components"
git worktree add ../flow-kit-worktree -b wave-2-flow-foundation wave-0-foundation
cd ../flow-kit-worktree && pnpm install
```

Expected: worktree at `../flow-kit-worktree`, branch `wave-2-flow-foundation`, install green.

- [ ] **Step 2: Verify the Wave 0 toolchain runs**

```bash
pnpm --filter docs test -- --run 2>/dev/null || pnpm test -- --run
pnpm check:tokens || node apps/docs/scripts/check-tokens.mjs
```

Expected: existing tests pass (or no tests yet — exit 0); tokens check exits 0. If `pnpm test` script names differ, read `apps/docs/package.json` scripts and use those — do not rename them.

- [ ] **Step 3: Commit marker**

```bash
git commit --allow-empty -m "chore(flow): open wave-2 branch from wave-0-foundation"
```

### Task 1: `flow-types` + tokens + registry plumbing

**Files:**
- Create: `apps/docs/registry/super-ai/flow/flow-types.ts`
- Create: `apps/docs/registry/super-ai/flow/flow-tokens.css`
- Test: `apps/docs/registry/super-ai/flow/flow-types.test.ts`
- Modify: `apps/docs/scripts/gen-registry.mts` (add flow items array — read the file first; follow its existing item-shape exactly)
- Modify: `apps/docs/app/globals.css` (one `@import` line for flow-tokens.css)
- Modify: `apps/docs/package.json` (+ `@xyflow/react@^12`)

- [ ] **Step 1: Write the failing test**

```ts
// apps/docs/registry/super-ai/flow/flow-types.test.ts
import { describe, expect, it } from "vitest"
import {
  FLOW_STATUSES, getHandleType, handleId, isValidFlowConnection,
  registerHandleType, type FlowStatus,
} from "./flow-types"

describe("handle type registry", () => {
  it("ships the four built-in types", () => {
    for (const t of ["text", "image", "video", "audio"])
      expect(getHandleType(t)?.cssVar).toBe(`--flow-${t}`)
  })
  it("registers custom types", () => {
    registerHandleType("style", { label: "Style" })
    expect(getHandleType("style")?.cssVar).toBe("--flow-style")
  })
  it("encodes and validates same-type connections from handle ids", () => {
    const a = handleId("node1", "image", "out")
    const b = handleId("node2", "image", "in")
    const c = handleId("node3", "audio", "in")
    expect(isValidFlowConnection({ sourceHandle: a, targetHandle: b })).toBe(true)
    expect(isValidFlowConnection({ sourceHandle: a, targetHandle: c })).toBe(false)
    expect(isValidFlowConnection({ sourceHandle: null, targetHandle: b })).toBe(false)
  })
  it("exposes the contract statuses", () => {
    const all: FlowStatus[] = ["idle", "queued", "streaming", "done", "failed", "locked"]
    expect(FLOW_STATUSES).toEqual(all)
  })
})
```

- [ ] **Step 2: Run to verify failure** — `pnpm --filter docs test -- --run flow-types` → FAIL (module not found).

- [ ] **Step 3: Implement `flow-types.ts`**

```ts
// apps/docs/registry/super-ai/flow/flow-types.ts
// Flow Kit shared contracts: handle-type registry, statuses, id codec.
// Status vocabulary is the master state contract — do not add states here.

export const FLOW_STATUSES = ["idle", "queued", "streaming", "done", "failed", "locked"] as const
export type FlowStatus = (typeof FLOW_STATUSES)[number]

export interface HandleTypeDef {
  label: string
  /** CSS custom property carrying the type color; defined in flow-tokens.css */
  cssVar: `--flow-${string}`
}

const registry = new Map<string, HandleTypeDef>(
  (["text", "image", "video", "audio"] as const).map((k) => [
    k,
    { label: k[0].toUpperCase() + k.slice(1), cssVar: `--flow-${k}` },
  ]),
)

export function registerHandleType(key: string, def: Partial<HandleTypeDef> & { label: string }) {
  registry.set(key, { label: def.label, cssVar: def.cssVar ?? `--flow-${key}` })
}
export const getHandleType = (key: string) => registry.get(key)
export const handleTypeKeys = () => [...registry.keys()]

/** Handle id codec: `{nodeId}:{dataType}:{in|out}` (Flow Builder pattern, direction added). */
export function handleId(nodeId: string, dataType: string, dir: "in" | "out") {
  return `${nodeId}:${dataType}:${dir}`
}
export function parseHandleId(id: string | null | undefined) {
  if (!id) return null
  const [nodeId, dataType, dir] = id.split(":")
  if (!nodeId || !dataType || (dir !== "in" && dir !== "out")) return null
  return { nodeId, dataType, dir } as const
}
export function isValidFlowConnection(c: {
  sourceHandle?: string | null
  targetHandle?: string | null
}) {
  const s = parseHandleId(c.sourceHandle)
  const t = parseHandleId(c.targetHandle)
  return !!s && !!t && s.dataType === t.dataType
}

export type NodeSize = "sm" | "md" | "lg"
export const NODE_WIDTH: Record<NodeSize, number> = { sm: 280, md: 320, lg: 420 }
```

- [ ] **Step 4: Create `flow-tokens.css`** (the ONLY place flow colors exist — components consume vars)

```css
/* apps/docs/registry/super-ai/flow/flow-tokens.css */
:root {
  --flow-text: var(--muted-foreground);
  --flow-image: oklch(0.62 0.19 259.8);
  --flow-video: oklch(0.61 0.22 292.7);
  --flow-audio: oklch(0.65 0.24 354.3);
  --flow-streaming: oklch(0.62 0.19 259.8);
  --flow-done: oklch(0.72 0.17 162.5);
  --flow-failed: var(--destructive);
  --flow-queued: var(--muted-foreground);
}
.dark {
  --flow-image: oklch(0.71 0.16 259.8);
  --flow-video: oklch(0.71 0.18 292.7);
  --flow-audio: oklch(0.73 0.19 354.3);
  --flow-done: oklch(0.77 0.15 162.5);
}
```

- [ ] **Step 5: Wire into app + registry + deps**
  - `apps/docs/app/globals.css`: add `@import "../registry/super-ai/flow/flow-tokens.css";` next to existing imports.
  - `pnpm --filter docs add @xyflow/react`
  - `apps/docs/scripts/gen-registry.mts`: read the file; append flow items following its existing shape. `flow-types` = `type: "registry:lib"`, files `[flow/flow-types.ts, flow/flow-tokens.css]`, no registryDependencies. Add a `FLOW_AI_ELEMENTS` const mapping `canvas|node|edge|connection|controls|panel|toolbar` → `https://registry.ai-sdk.dev/{name}.json` (verify exact URL base from https://ai-sdk.dev/elements/overview#installation if reachable; otherwise leave the const with this value — the consumer-install test in Wave 4 validates it).

- [ ] **Step 6: Tests + tokens green** — `pnpm --filter docs test -- --run flow-types` PASS · `pnpm check:tokens` PASS (raw oklch lives in the css token file; confirm the script scopes to `*.tsx` or whitelists token css — read `check-tokens.mjs`; if it scans css too, add `flow-tokens.css` to its allowlist array, which exists for `globals.css`).

- [ ] **Step 7: Registry builds** — `pnpm gen:registry || pnpm --filter docs gen:registry` then `npx shadcn build` per Wave 0 scripts (use the exact script names from root `package.json`). Expected: `public/r/flow-types.json` exists.

- [ ] **Step 8: Commit** — `git add -A && git commit -m "feat(flow): flow-types registry item — type registry, statuses, tokens"`

### Task 2: `typed-handle`

**Files:**
- Create: `apps/docs/registry/super-ai/flow/typed-handle.tsx`
- Test: `apps/docs/registry/super-ai/flow/typed-handle.test.tsx`
- Create: `apps/docs/components/demos/flow/typed-handle-demo.tsx`

- [ ] **Step 1: Failing test**

```tsx
// apps/docs/registry/super-ai/flow/typed-handle.test.tsx
import { render, screen } from "@testing-library/react"
import { ReactFlowProvider } from "@xyflow/react"
import { describe, expect, it } from "vitest"
import { TypedHandle } from "./typed-handle"

const wrap = (ui: React.ReactNode) => render(<ReactFlowProvider>{ui}</ReactFlowProvider>)

describe("TypedHandle", () => {
  it("renders a port with type color var and aria label", () => {
    wrap(<TypedHandle nodeId="n1" dataType="image" type="target" />)
    const port = screen.getByLabelText("Image input port")
    expect(port).toHaveStyle({ background: "var(--flow-image)" })
    expect(port).toHaveAttribute("data-slot", "typed-handle")
  })
  it("encodes node id, type and direction in the handle id", () => {
    wrap(<TypedHandle nodeId="n1" dataType="audio" type="source" />)
    expect(document.querySelector('[data-handleid="n1:audio:out"]')).toBeTruthy()
  })
})
```

Note: `Handle` outside `<ReactFlow>` needs the provider; if `@xyflow/react` warns about missing node context in jsdom, mock per their testing docs — add a `vi.mock` ONLY if the provider alone is insufficient (try provider first).

- [ ] **Step 2: Run** → FAIL (component missing).

- [ ] **Step 3: Implement**

```tsx
// apps/docs/registry/super-ai/flow/typed-handle.tsx
"use client"
import { Handle, Position, type HandleProps } from "@xyflow/react"
import { cn } from "@/lib/utils"
import { getHandleType, handleId, isValidFlowConnection } from "./flow-types"

export interface TypedHandleProps
  extends Omit<HandleProps, "type" | "position" | "id" | "isValidConnection"> {
  nodeId: string
  dataType: string
  type: "source" | "target"
  position?: Position
  /** vertical offset when stacking multiple ports on one side */
  top?: number
  className?: string
}

export function TypedHandle({
  nodeId, dataType, type, position, top, className, style, ...rest
}: TypedHandleProps) {
  const def = getHandleType(dataType)
  const dir = type === "source" ? "out" : "in"
  return (
    <Handle
      id={handleId(nodeId, dataType, dir)}
      type={type}
      position={position ?? (type === "source" ? Position.Right : Position.Left)}
      isValidConnection={isValidFlowConnection}
      aria-label={`${def?.label ?? dataType} ${dir === "in" ? "input" : "output"} port`}
      data-slot="typed-handle"
      data-flow-type={dataType}
      className={cn(
        "size-3.5 rounded-full border-2 border-background transition-transform",
        "data-[flow-compatible=true]:scale-125",
        className,
      )}
      style={{ background: `var(${def?.cssVar ?? "--flow-text"})`, ...(top != null && { top }), ...style }}
      {...rest}
    />
  )
}
```

- [ ] **Step 4: Run tests** → PASS. `pnpm check:tokens` → PASS (no raw colors).

- [ ] **Step 5: Demo component** (used by the catalog page; keep it minimal — two nodes with ports inside a 200px `<ReactFlow>` canvas showing a valid and an invalid drag).

```tsx
// apps/docs/components/demos/flow/typed-handle-demo.tsx
"use client"
import { Background, ReactFlow, type Node, type NodeProps } from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import { TypedHandle } from "@/registry/super-ai/flow/typed-handle"

function DemoNode({ id }: NodeProps) {
  return (
    <div className="rounded-md border bg-card p-3 text-xs">
      ports
      <TypedHandle nodeId={id} dataType="image" type="target" top={10} />
      <TypedHandle nodeId={id} dataType="audio" type="target" top={28} />
      <TypedHandle nodeId={id} dataType="image" type="source" />
    </div>
  )
}
const nodes: Node[] = [
  { id: "a", position: { x: 20, y: 40 }, data: {}, type: "demo" },
  { id: "b", position: { x: 220, y: 80 }, data: {}, type: "demo" },
]
export default function TypedHandleDemo() {
  return (
    <div className="h-52 rounded-lg border">
      <ReactFlow defaultNodes={nodes} nodeTypes={{ demo: DemoNode }} fitView proOptions={{ hideAttribution: true }}>
        <Background />
      </ReactFlow>
    </div>
  )
}
```

- [ ] **Step 6: Register** — add `typed-handle` to `gen-registry.mts` (`registryDependencies: ["<REGISTRY_URL>/r/flow-types.json"]`, npm `dependencies: ["@xyflow/react"]`). Rebuild registry, expect `public/r/typed-handle.json`.

- [ ] **Step 7: Commit** — `git commit -m "feat(flow): typed-handle — colored validated port"`

### Task 3: `typed-edge`

**Files:**
- Create: `apps/docs/registry/super-ai/flow/typed-edge.tsx`
- Test: `apps/docs/registry/super-ai/flow/typed-edge.test.tsx`
- Create: `apps/docs/components/demos/flow/typed-edge-demo.tsx`

- [ ] **Step 1: Failing test**

```tsx
// apps/docs/registry/super-ai/flow/typed-edge.test.tsx
import { describe, expect, it } from "vitest"
import { edgeColorFromHandle, typedEdgeStyle } from "./typed-edge"

describe("typed-edge helpers", () => {
  it("derives stroke color from the source handle id", () => {
    expect(edgeColorFromHandle("n1:video:out")).toBe("var(--flow-video)")
    expect(edgeColorFromHandle("garbage")).toBe("var(--flow-text)")
  })
  it("streaming edges get the dash animation class", () => {
    expect(typedEdgeStyle({ sourceHandle: "n1:image:out", streaming: true }).className).toContain("animate")
  })
})
```

- [ ] **Step 2: Run** → FAIL. **Step 3: Implement** — `TypedEdge` as a React Flow custom edge (`BaseEdge` + `getBezierPath`), exporting pure helpers tested above:

```tsx
// apps/docs/registry/super-ai/flow/typed-edge.tsx
"use client"
import { BaseEdge, getBezierPath, type EdgeProps } from "@xyflow/react"
import { cn } from "@/lib/utils"
import { parseHandleId } from "./flow-types"

export function edgeColorFromHandle(sourceHandle?: string | null) {
  const parsed = parseHandleId(sourceHandle)
  return `var(--flow-${parsed?.dataType ?? "text"})`
}
export function typedEdgeStyle(opts: { sourceHandle?: string | null; streaming?: boolean; selected?: boolean }) {
  return {
    stroke: edgeColorFromHandle(opts.sourceHandle),
    className: cn(
      "transition-[stroke-width]",
      opts.streaming && "[stroke-dasharray:6_4] animate-[dash_1s_linear_infinite]",
      opts.selected ? "[stroke-width:2.5]" : "[stroke-width:1.5]",
    ),
  }
}

export type TypedEdgeProps = EdgeProps & { data?: { streaming?: boolean } }
export function TypedEdge(props: TypedEdgeProps) {
  const [path] = getBezierPath(props)
  const { stroke, className } = typedEdgeStyle({
    sourceHandle: props.sourceHandleId, streaming: props.data?.streaming, selected: props.selected,
  })
  return <BaseEdge id={props.id} path={path} className={className} style={{ stroke }} />
}
```

Add the `dash` keyframes once to `flow-tokens.css`: `@keyframes dash { to { stroke-dashoffset: -20; } }`.

- [ ] **Step 4: Tests pass.** **Step 5: Demo** (two connected node pairs, one edge `data.streaming=true`). **Step 6: Register** (deps: flow-types; npm: @xyflow/react) + rebuild. **Step 7: Commit** `feat(flow): typed-edge — source-typed colored edge`.

### Task 4: `port-chip`

**Files:** create `port-chip.tsx`, test, demo (same dir pattern).

- [ ] **Step 1: Failing test**

```tsx
// apps/docs/registry/super-ai/flow/port-chip.test.tsx
import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { PortChips } from "./port-chip"

describe("PortChips", () => {
  it("renders IN and OUT rows with one chip per port", () => {
    render(<PortChips in={["text", "image"]} out={["video"]} />)
    expect(screen.getByText("IN").parentElement?.querySelectorAll("[data-slot=port-chip]")).toHaveLength(2)
    expect(screen.getByText("OUT").parentElement?.querySelectorAll("[data-slot=port-chip]")).toHaveLength(1)
    expect(screen.getByText("Video")).toBeInTheDocument()
  })
  it("marks satisfied ports", () => {
    render(<PortChips in={["text"]} satisfied={["text"]} />)
    expect(screen.getByText("Text").closest("[data-slot=port-chip]")).toHaveAttribute("data-satisfied", "true")
  })
})
```

- [ ] **Step 2 → 4: Implement to green.** Chips: rounded pill, dot colored `var(--flow-<type>)`, label from `getHandleType`, muted until `data-satisfied`. Rows hidden when prop omitted. Component:

```tsx
// apps/docs/registry/super-ai/flow/port-chip.tsx
import { cn } from "@/lib/utils"
import { getHandleType } from "./flow-types"

function Row({ label, types, satisfied }: { label: "IN" | "OUT"; types: string[]; satisfied?: string[] }) {
  if (!types.length) return null
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] font-medium text-muted-foreground">{label}</span>
      {types.map((t) => {
        const ok = satisfied?.includes(t) ?? false
        return (
          <span key={t} data-slot="port-chip" data-satisfied={ok}
            className={cn("inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px]",
              ok ? "border-transparent bg-secondary" : "opacity-70")}>
            <span aria-hidden className="size-1.5 rounded-full" style={{ background: `var(${getHandleType(t)?.cssVar ?? "--flow-text"})` }} />
            {getHandleType(t)?.label ?? t}
          </span>
        )
      })}
    </div>
  )
}
export interface PortChipsProps { in?: string[]; out?: string[]; satisfied?: string[]; className?: string }
export function PortChips({ in: ins = [], out = [], satisfied, className }: PortChipsProps) {
  return (
    <div data-slot="port-chips" className={cn("flex flex-col gap-1", className)}>
      <Row label="IN" types={ins} satisfied={satisfied} />
      <Row label="OUT" types={out} satisfied={satisfied} />
    </div>
  )
}
```

- [ ] **Step 5–7:** demo, register (deps flow-types), rebuild, commit `feat(flow): port-chip`.

### Task 5: `node-status`

**Files:** create `node-status.tsx`, test, demo.

- [ ] **Step 1: Failing test**

```tsx
// apps/docs/registry/super-ai/flow/node-status.test.tsx
import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { NodeStatusBadge, statusRingClass } from "./node-status"

describe("node-status", () => {
  it("announces status politely", () => {
    render(<NodeStatusBadge status="streaming" />)
    const badge = screen.getByText("Running")
    expect(badge.closest("[data-slot=node-status]")).toHaveAttribute("aria-live", "polite")
  })
  it("maps statuses to ring classes; idle gets none", () => {
    expect(statusRingClass("idle")).toBe("")
    expect(statusRingClass("streaming")).toContain("ring-2")
    expect(statusRingClass("failed")).toContain("ring-2")
  })
  it("locked renders lock label", () => {
    render(<NodeStatusBadge status="locked" />)
    expect(screen.getByText("Upgrade to run")).toBeInTheDocument()
  })
})
```

- [ ] **Step 2 → 4: Implement.** Labels: idle→`Idle`, queued→`Queued`, streaming→`Running`, done→`Done`, failed→`Failed`, locked→`Upgrade to run` (UI copy may say Running while the contract state stays `streaming`). `statusRingClass(status)` returns `""` (idle/done) · `ring-2 ring-[var(--flow-queued)]/40` (queued) · `ring-2 ring-[var(--flow-streaming)]/50` (streaming) · `ring-2 ring-[var(--flow-failed)]/60` (failed) · `ring-2 ring-[var(--flow-queued)]/40` (locked). Badge = dot + label, spinner (`animate-spin` lucide `Loader2`) when streaming.
- [ ] **Step 5–7:** demo (all six states in a row), register, commit `feat(flow): node-status badge + ring map`.

### Task 6: `media-slot`

**Files:** create `media-slot.tsx`, test, demo.

- [ ] **Step 1: Failing test**

```tsx
// apps/docs/registry/super-ai/flow/media-slot.test.tsx
import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { MediaSlot } from "./media-slot"

describe("MediaSlot", () => {
  it("empty state copy follows the convention", () => {
    render(<MediaSlot kind="audio" status="idle" />)
    expect(screen.getByText("Your audio will appear here")).toBeInTheDocument()
  })
  it("streaming shows shimmer", () => {
    render(<MediaSlot kind="image" status="streaming" />)
    expect(document.querySelector("[data-slot=media-slot][data-status=streaming] [data-shimmer]")).toBeTruthy()
  })
  it("renders image output", () => {
    render(<MediaSlot kind="image" status="done" src="/x.png" alt="result" />)
    expect(screen.getByAltText("result")).toHaveAttribute("src", "/x.png")
  })
  it("video kind uses generation copy", () => {
    render(<MediaSlot kind="video" status="idle" />)
    expect(screen.getByText("Your generation will appear here")).toBeInTheDocument()
  })
})
```

- [ ] **Step 2 → 4: Implement.** Props: `kind: "image" | "video" | "audio" | "text"`, `status: FlowStatus`, `src?`, `alt?`, `aspect?: "video" | "square" | "auto"` (default `video`; audio renders a compact waveform-player row: play button placeholder, duration, `<audio>` when src). Empty copy map: image/video→`Your generation will appear here`, audio→`Your audio will appear here`, text→`Generated text will appear here` (callers override via `emptyText` prop — sfx/music need their specific strings). Shimmer = absolutely-positioned `animate-pulse bg-muted` layer with `data-shimmer`. Failed → muted slot + small `Failed` text (the node banner carries the message).
- [ ] **Step 5–7:** demo (image empty/streaming/done + audio done), register, commit `feat(flow): media-slot`.

### Task 7: `run-button`

**Files:** create `run-button.tsx`, test, demo.

- [ ] **Step 1: Failing test**

```tsx
// apps/docs/registry/super-ai/flow/run-button.test.tsx
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { RunButton } from "./run-button"

describe("RunButton", () => {
  it("fires onRun, and shows Stop while streaming", async () => {
    const onRun = vi.fn(); const onStop = vi.fn()
    const { rerender } = render(<RunButton status="idle" onRun={onRun} onStop={onStop} />)
    await userEvent.click(screen.getByRole("button", { name: "Run" }))
    expect(onRun).toHaveBeenCalledOnce()
    rerender(<RunButton status="streaming" onRun={onRun} onStop={onStop} />)
    await userEvent.click(screen.getByRole("button", { name: "Stop" }))
    expect(onStop).toHaveBeenCalledOnce()
  })
  it("locked disables and relabels", () => {
    render(<RunButton status="locked" onRun={() => {}} />)
    expect(screen.getByRole("button", { name: "Upgrade to run" })).toBeDisabled()
  })
  it("renders scope menu items when handlers provided", async () => {
    const onRunFrom = vi.fn()
    render(<RunButton status="idle" onRun={() => {}} onRunFrom={onRunFrom} />)
    await userEvent.click(screen.getByRole("button", { name: "Run options" }))
    await userEvent.click(await screen.findByText("Run from here"))
    expect(onRunFrom).toHaveBeenCalledOnce()
  })
  it("shows cost chip on hover via title", () => {
    render(<RunButton status="idle" onRun={() => {}} cost={{ amount: 12, unit: "credits" }} />)
    expect(screen.getByRole("button", { name: "Run" })).toHaveAttribute("title", "~12 credits")
  })
})
```

- [ ] **Step 2 → 4: Implement.** Split button: primary (shadcn `Button` size sm, `Play`/`Loader2`/`Square` icon per status) + optional `DropdownMenu` trigger (`aria-label="Run options"`, `ChevronDown`) rendered only when any of `onRunFrom/onRunSelection/onRunAll` present; menu items `Run from here` / `Run selection` / `Run all`. `status="streaming"` → primary becomes Stop (calls `onStop`). `queued` → disabled `Queued…`. `cost` prop → `title={`~${amount} ${unit}`}` (cost-contract chip presentation).
- [ ] **Step 5–7:** demo, register (registryDependencies: shadcn `button`, `dropdown-menu` + flow-types), commit `feat(flow): run-button split control`.

### Task 8: `ai-node`

**Files:** create `ai-node.tsx`, test, demo.

- [ ] **Step 1: Failing test**

```tsx
// apps/docs/registry/super-ai/flow/ai-node.test.tsx
import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { AiNode } from "./ai-node"

describe("AiNode", () => {
  it("renders title, model label, runtime suffix and status group semantics", () => {
    render(
      <AiNode id="n1" title="Video" modelLabel="LTX 2.3" runtime="local" status="idle" size="md">
        body
      </AiNode>,
    )
    const node = screen.getByRole("group", { name: "Video node, idle" })
    expect(node).toHaveStyle({ width: "320px" })
    expect(screen.getByText("LTX 2.3 · Local")).toBeInTheDocument()
  })
  it("failed shows inline error banner", () => {
    render(<AiNode id="n1" title="Image" status="failed" error="Provider exploded">x</AiNode>)
    expect(screen.getByText("Provider exploded")).toBeInTheDocument()
  })
  it("selected applies ring, slots render in order", () => {
    render(
      <AiNode id="n1" title="T" status="idle" selected
        media={<div data-testid="media" />} footer={<div data-testid="footer" />}>
        <div data-testid="body" />
      </AiNode>,
    )
    const order = ["media", "body", "footer"].map((t) => screen.getByTestId(t))
    expect(order[0].compareDocumentPosition(order[1]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(order[1].compareDocumentPosition(order[2]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })
})
```

- [ ] **Step 2 → 4: Implement.**

```tsx
// apps/docs/registry/super-ai/flow/ai-node.tsx
"use client"
import { cn } from "@/lib/utils"
import { AlertCircle } from "lucide-react"
import { NODE_WIDTH, type FlowStatus, type NodeSize } from "./flow-types"
import { NodeStatusBadge, statusRingClass } from "./node-status"

export interface AiNodeProps {
  id: string
  title: string
  status: FlowStatus
  modelLabel?: string
  runtime?: "local" | "cloud"
  error?: string
  selected?: boolean
  size?: NodeSize
  media?: React.ReactNode
  footer?: React.ReactNode
  children?: React.ReactNode
  className?: string
}

export function AiNode({
  id, title, status, modelLabel, runtime, error, selected, size = "md",
  media, footer, children, className,
}: AiNodeProps) {
  return (
    <div
      role="group"
      aria-label={`${title} node, ${status}`}
      data-slot="ai-node"
      data-status={status}
      className={cn(
        "rounded-xl border bg-card text-card-foreground shadow-sm transition",
        selected && "ring-2 ring-ring shadow-md",
        !selected && statusRingClass(status),
        className,
      )}
      style={{ width: NODE_WIDTH[size] }}
    >
      <div data-slot="ai-node-header" className="flex items-center justify-between gap-2 px-3 pt-2 text-[11px] text-muted-foreground">
        <span className="font-medium">{title}</span>
        <span className="flex items-center gap-2">
          {modelLabel && (
            <span>{modelLabel}{runtime === "local" ? " · Local" : ""}</span>
          )}
          <NodeStatusBadge status={status} compact />
        </span>
      </div>
      {media && <div data-slot="ai-node-media" className="px-3 pt-2">{media}</div>}
      {children && <div data-slot="ai-node-body" className="px-3 py-2">{children}</div>}
      {status === "failed" && error && (
        <div data-slot="ai-node-error" className="mx-3 mb-2 flex items-start gap-1.5 rounded-md bg-destructive/10 px-2 py-1.5 text-[11px] text-destructive">
          <AlertCircle aria-hidden className="mt-0.5 size-3 shrink-0" />
          <span className="line-clamp-3">{error}</span>
        </div>
      )}
      {footer && (
        <div data-slot="ai-node-footer" className="flex items-center justify-between gap-2 border-t px-3 py-2">
          {footer}
        </div>
      )}
    </div>
  )
}
```

(`NodeStatusBadge` gains a `compact` boolean prop in this task — dot+spinner only, no label, `title` tooltip carries the label; update `node-status.tsx` + one test assertion accordingly.)

- [ ] **Step 5–7:** demo (six statuses grid), register (deps: flow-types, node-status), commit `feat(flow): ai-node base card`.

### Task 9: `model-bar` — GATED on Wave 0 `gen-settings-bar`

**Pre-check:** after rebase, `test -f apps/docs/registry/super-ai/gen-settings-bar.tsx || (echo SKIP && exit 0)` — if absent, move on and return later.

**Files:**
- Create: `apps/docs/registry/super-ai/flow/model-bar.tsx`, test, demo
- Modify: `apps/docs/registry/super-ai/gen-settings-bar.tsx` — ONLY if its segment union lacks needed kinds; extend additively (new segment kinds: `toggle`, `percent`, plus `"auto"` value support on numeric segments). Read its API first; mirror its naming exactly.

- [ ] **Step 1: Failing test**

```tsx
// apps/docs/registry/super-ai/flow/model-bar.test.tsx
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { ModelBar } from "./model-bar"

const segments = [
  { kind: "model" as const, id: "model", value: "eleven-sfx", options: [{ value: "eleven-sfx", label: "Eleven SFX" }] },
  { kind: "toggle" as const, id: "loop", label: "Loop", value: false },
  { kind: "duration" as const, id: "duration", value: "auto" as const, options: [4, 6, 8] },
  { kind: "percent" as const, id: "influence", label: "Prompt influence", value: 30 },
]

describe("ModelBar", () => {
  it("renders the SFX stress-test bar", () => {
    render(<ModelBar segments={segments} onChange={() => {}} />)
    expect(screen.getByText("Eleven SFX")).toBeInTheDocument()
    expect(screen.getByText("Auto")).toBeInTheDocument()
    expect(screen.getByText("30%")).toBeInTheDocument()
  })
  it("emits patch on toggle", async () => {
    const onChange = vi.fn()
    render(<ModelBar segments={segments} onChange={onChange} />)
    await userEvent.click(screen.getByRole("switch", { name: "Loop" }))
    expect(onChange).toHaveBeenCalledWith({ id: "loop", value: true })
  })
  it("disabled while parent streams", () => {
    render(<ModelBar segments={segments} onChange={() => {}} disabled />)
    expect(screen.getByRole("toolbar")).toHaveAttribute("aria-disabled", "true")
  })
})
```

- [ ] **Step 2 → 4: Implement** as the node-docked presentation of the gen-settings-bar engine: `ModelBar` renders `role="toolbar"` pill strip (border, rounded-lg, bg-card, divider between segments, overflow `⋯` menu past 6 segments) and delegates each segment to the shared engine's segment renderer if exported; if the engine exports only a composed bar, extract its segment renderer into `gen-settings-bar.tsx` as a named export (`SettingsSegment`) and use it from both — additive refactor, keep its tests green (`pnpm --filter docs test -- --run gen-settings-bar` must pass unchanged).
- [ ] **Step 5–7:** demo = the four reference bars (image: model·16:9·1K·quality / video: model·16:9·720p·4s·mute / sfx: loop·auto·30% / llm: model·thinking·auto), register (registryDependencies: gen-settings-bar, flow-types, shadcn dropdown-menu/select/switch), commit `feat(flow): model-bar — node-docked settings strip`.

### Task 10: `node-prompt`

**Files:** create `node-prompt.tsx`, test, demo.

- [ ] **Step 1: Failing test**

```tsx
// apps/docs/registry/super-ai/flow/node-prompt.test.tsx
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { NodePrompt } from "./node-prompt"

describe("NodePrompt", () => {
  it("controlled value + onChange", async () => {
    const onChange = vi.fn()
    render(<NodePrompt value="a cat" onChange={onChange} placeholder="Describe the image…" />)
    await userEvent.type(screen.getByPlaceholderText("Describe the image…"), "!")
    expect(onChange).toHaveBeenLastCalledWith("a cat!")
  })
  it("renders reference chips with type dot and remove", async () => {
    const onRemove = vi.fn()
    render(
      <NodePrompt value="" onChange={() => {}}
        references={[{ id: "r1", label: "@Image 1", dataType: "image", thumbnailUrl: "/t.png" }]}
        onRemoveReference={onRemove} />,
    )
    await userEvent.click(screen.getByRole("button", { name: "Remove @Image 1" }))
    expect(onRemove).toHaveBeenCalledWith("r1")
  })
  it("collapses to summary when collapsed", () => {
    render(<NodePrompt value="long prompt text here" onChange={() => {}} collapsed />)
    expect(screen.queryByRole("textbox")).toBeNull()
    expect(screen.getByText("long prompt text here")).toBeInTheDocument()
  })
})
```

- [ ] **Step 2 → 4: Implement.** Textarea (auto-rows 3, text-xs, focus ring) + chip row above when `references` non-empty (chip = thumbnail 16px rounded if `thumbnailUrl`, type dot, label, × button `aria-label="Remove {label}"`). `collapsed` renders a one-line truncated text button (Flora pattern) — clicking it calls `onExpand?.()`. Standalone — no AI Elements prompt-input dependency (per master decision).
- [ ] **Step 5–7:** demo, register, commit `feat(flow): node-prompt with reference chips`.

### Task 11: `connection-hint`

**Files:** create `connection-hint.tsx`, test, demo.

- [ ] **Step 1: Failing test** — pure-logic first: `compatibleTargets(dataType, nodeCatalog)` filters a catalog of node descriptors to those with a matching `in` type; component renders the floating mini-palette listing them.

```tsx
// apps/docs/registry/super-ai/flow/connection-hint.test.tsx
import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import userEvent from "@testing-library/user-event"
import { compatibleTargets, ConnectionHint } from "./connection-hint"

const catalog = [
  { kind: "video-node", label: "Video", in: ["image", "text"], out: ["video"] },
  { kind: "tts-node", label: "Text to Speech", in: ["text"], out: ["audio"] },
]

describe("connection-hint", () => {
  it("filters catalog by compatible input type", () => {
    expect(compatibleTargets("image", catalog).map((c) => c.kind)).toEqual(["video-node"])
  })
  it("renders options and fires onPick", async () => {
    const onPick = vi.fn()
    render(<ConnectionHint dataType="text" catalog={catalog} position={{ x: 10, y: 10 }} onPick={onPick} />)
    await userEvent.click(screen.getByText("Text to Speech"))
    expect(onPick).toHaveBeenCalledWith("tts-node")
  })
})
```

- [ ] **Step 2 → 4: Implement** (absolute-positioned card at `position`, heading `Add compatible node`, button list; Esc → `onDismiss`). The drag-end wiring (`onConnectEnd` with no target → show hint) is demo/app-level glue, documented in the component JSDoc and exercised in the Wave 2 demo page.
- [ ] **Step 5–7:** demo, register, commit `feat(flow): connection-hint mini palette`.

### Task 12: `use-flow-runner`

**Files:**
- Create: `apps/docs/registry/super-ai/flow/use-flow-runner.ts`
- Test: `apps/docs/registry/super-ai/flow/use-flow-runner.test.ts`

- [ ] **Step 1: Failing tests** (the heart of the wave — write all of them first)

```ts
// apps/docs/registry/super-ai/flow/use-flow-runner.test.ts
import { act, renderHook, waitFor } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { useFlowRunner, type RunnerNode } from "./use-flow-runner"

const node = (id: string, data: Record<string, unknown> = {}): RunnerNode => ({ id, data })
const edge = (s: string, t: string) => ({ id: `${s}-${t}`, source: s, target: t })

function setup(opts?: Partial<Parameters<typeof useFlowRunner>[0]>) {
  const order: string[] = []
  const execute = vi.fn(async (n: RunnerNode) => { order.push(n.id); return { url: `out-${n.id}` } })
  const statuses: Array<[string, string]> = []
  const hook = renderHook(() =>
    useFlowRunner({
      nodes: [node("a"), node("b"), node("c")],
      edges: [edge("a", "b"), edge("b", "c")],
      execute,
      onStatus: (id, s) => statuses.push([id, s]),
      ...opts,
    }),
  )
  return { hook, order, execute, statuses }
}

describe("useFlowRunner", () => {
  it("runs in topological order and reports contract statuses", async () => {
    const { hook, order, statuses } = setup()
    await act(() => hook.result.current.run())
    expect(order).toEqual(["a", "b", "c"])
    expect(statuses.filter(([id]) => id === "b").map(([, s]) => s)).toEqual(["queued", "streaming", "done"])
  })
  it("caches clean nodes; re-run only executes dirtied + downstream", async () => {
    const { hook, order, execute } = setup()
    await act(() => hook.result.current.run())
    execute.mockClear(); order.length = 0
    act(() => hook.result.current.markDirty("b"))
    await act(() => hook.result.current.run())
    expect(order).toEqual(["b", "c"])                       // a served from cache
    expect(execute).toHaveBeenCalledTimes(2)
  })
  it("feeds upstream outputs as inputs", async () => {
    const { hook, execute } = setup()
    await act(() => hook.result.current.run())
    const callForC = execute.mock.calls.find(([n]) => n.id === "c")!
    expect(callForC[1]).toEqual({ b: { url: "out-b" } })
  })
  it("branch-local failure: independent branches still finish", async () => {
    const execute = vi.fn(async (n: RunnerNode) => {
      if (n.id === "b") throw new Error("boom")
      return { url: n.id }
    })
    const statuses: Array<[string, string]> = []
    const hook = renderHook(() =>
      useFlowRunner({
        nodes: [node("a"), node("b"), node("c"), node("x")],   // a→b→c, x independent
        edges: [edge("a", "b"), edge("b", "c")],
        execute, onStatus: (id, s) => statuses.push([id, s]),
      }),
    )
    await act(() => hook.result.current.run())
    expect(statuses).toContainEqual(["b", "failed"])
    expect(statuses).not.toContainEqual(["c", "streaming"])    // downstream skipped
    expect(statuses).toContainEqual(["x", "done"])             // sibling branch ran
    expect(hook.result.current.errors.b?.message).toBe("boom")
  })
  it("stop() aborts in-flight executes", async () => {
    let abortSeen = false
    const execute = vi.fn((n: RunnerNode, _i: unknown, signal: AbortSignal) =>
      new Promise((resolve, reject) => {
        signal.addEventListener("abort", () => { abortSeen = true; reject(new DOMException("aborted", "AbortError")) })
      }))
    const hook = renderHook(() =>
      useFlowRunner({ nodes: [node("a")], edges: [], execute, onStatus: () => {} }),
    )
    act(() => { void hook.result.current.run() })
    await waitFor(() => expect(execute).toHaveBeenCalled())
    act(() => hook.result.current.stop())
    await waitFor(() => expect(abortSeen).toBe(true))
  })
  it("runFrom(id) dirties id + downstream then runs", async () => {
    const { hook, order } = setup()
    await act(() => hook.result.current.run())
    order.length = 0
    await act(() => hook.result.current.runFrom("b"))
    expect(order).toEqual(["b", "c"])
  })
})
```

- [ ] **Step 2: Run** → FAIL. **Step 3: Implement**

```ts
// apps/docs/registry/super-ai/flow/use-flow-runner.ts
"use client"
import { useCallback, useRef, useState } from "react"
import type { FlowStatus } from "./flow-types"

export interface RunnerNode { id: string; data: Record<string, unknown> }
export interface RunnerEdge { id: string; source: string; target: string }
export type NodeOutput = Record<string, unknown>

export interface UseFlowRunnerOptions {
  nodes: RunnerNode[]
  edges: RunnerEdge[]
  execute: (node: RunnerNode, inputs: Record<string, NodeOutput>, signal: AbortSignal) => Promise<NodeOutput>
  onStatus?: (nodeId: string, status: FlowStatus) => void
}

function topoOrder(nodes: RunnerNode[], edges: RunnerEdge[]): string[] {
  const indeg = new Map(nodes.map((n) => [n.id, 0]))
  for (const e of edges) indeg.set(e.target, (indeg.get(e.target) ?? 0) + 1)
  const queue = nodes.filter((n) => !indeg.get(n.id)).map((n) => n.id)
  const out: string[] = []
  while (queue.length) {
    const id = queue.shift()!
    out.push(id)
    for (const e of edges) if (e.source === id) {
      const d = indeg.get(e.target)! - 1
      indeg.set(e.target, d)
      if (d === 0) queue.push(e.target)
    }
  }
  return out
}
const downstreamOf = (ids: string[], edges: RunnerEdge[]) => {
  const seen = new Set(ids)
  let grew = true
  while (grew) {
    grew = false
    for (const e of edges) if (seen.has(e.source) && !seen.has(e.target)) { seen.add(e.target); grew = true }
  }
  return seen
}
const cacheKey = (node: RunnerNode, upstreamOutputIds: string[]) =>
  JSON.stringify([node.data, upstreamOutputIds])

export function useFlowRunner({ nodes, edges, execute, onStatus }: UseFlowRunnerOptions) {
  const cache = useRef(new Map<string, { key: string; output: NodeOutput }>())
  const dirty = useRef(new Set<string>())
  const controller = useRef<AbortController | null>(null)
  const [statuses, setStatuses] = useState<Record<string, FlowStatus>>({})
  const [errors, setErrors] = useState<Record<string, Error>>({})
  const [outputs, setOutputs] = useState<Record<string, NodeOutput>>({})

  const setStatus = useCallback((id: string, s: FlowStatus) => {
    setStatuses((prev) => ({ ...prev, [id]: s }))
    onStatus?.(id, s)
  }, [onStatus])

  const runScope = useCallback(async (scope: Set<string> | null) => {
    controller.current?.abort()
    const ctl = new AbortController()
    controller.current = ctl
    setErrors({})
    const order = topoOrder(nodes, edges).filter((id) => !scope || scope.has(id))
    const failedBranch = new Set<string>()
    const runOutputs = new Map<string, NodeOutput>(
      [...cache.current.entries()].map(([id, v]) => [id, v.output]),
    )
    for (const id of order) if (!failedBranch.has(id)) setStatus(id, "queued")
    for (const id of order) {
      if (ctl.signal.aborted) break
      if (failedBranch.has(id)) { setStatus(id, "idle"); continue }
      const node = nodes.find((n) => n.id === id)!
      const upstream = edges.filter((e) => e.target === id)
      const inputs: Record<string, NodeOutput> = {}
      for (const e of upstream) {
        const out = runOutputs.get(e.source)
        if (out) inputs[e.source] = out
      }
      const key = cacheKey(node, upstream.map((e) => String(runOutputs.get(e.source)?.url ?? e.source)))
      const cached = cache.current.get(id)
      if (cached && cached.key === key && !dirty.current.has(id)) {
        runOutputs.set(id, cached.output)
        setStatus(id, "done")
        continue
      }
      setStatus(id, "streaming")
      try {
        const output = await execute(node, inputs, ctl.signal)
        cache.current.set(id, { key, output })
        dirty.current.delete(id)
        runOutputs.set(id, output)
        setOutputs((prev) => ({ ...prev, [id]: output }))
        setStatus(id, "done")
      } catch (err) {
        if (ctl.signal.aborted) { setStatus(id, "idle"); break }
        setErrors((prev) => ({ ...prev, [id]: err as Error }))
        setStatus(id, "failed")
        for (const d of downstreamOf([id], edges)) if (d !== id) failedBranch.add(d)
      }
    }
  }, [nodes, edges, execute, setStatus])

  const markDirty = useCallback((id: string) => {
    for (const d of downstreamOf([id], edges)) dirty.current.add(d)
  }, [edges])

  return {
    statuses, errors, outputs,
    run: () => runScope(null),
    runNode: (id: string) => { dirty.current.add(id); return runScope(new Set([id])) },
    runFrom: (id: string) => { markDirty(id); return runScope(downstreamOf([id], edges)) },
    runSelection: (ids: string[]) => { ids.forEach((i) => dirty.current.add(i)); return runScope(new Set(ids)) },
    stop: () => controller.current?.abort(),
    markDirty,
  }
}
```

- [ ] **Step 4: Run all runner tests** → PASS. Fix genuine logic mismatches in implementation, never weaken assertions.
- [ ] **Step 5: Register** (`type: "registry:hook"` if gen-registry supports it, else `registry:lib`; deps flow-types) + rebuild. **Step 6: Commit** `feat(flow): use-flow-runner — topological executor with dirty-tracking cache`.

### Task 13: Wave 2 demo page — image→video chain

**Files:**
- Create: `apps/docs/app/flow/page.tsx` (server shell) + `apps/docs/app/flow/flow-demo.tsx` (client)
- Create: `apps/docs/lib/flow/stub-execute.ts`

- [ ] **Step 1: Stub executor** (no API routes in this wave)

```ts
// apps/docs/lib/flow/stub-execute.ts
import type { NodeOutput, RunnerNode } from "@/registry/super-ai/flow/use-flow-runner"

const STUBS: Record<string, NodeOutput> = {
  image: { url: "/stubs/image-1.webp", kind: "image" },
  video: { url: "/stubs/video-1.mp4", kind: "video" },
}
export async function stubExecute(node: RunnerNode, _inputs: unknown, signal: AbortSignal): Promise<NodeOutput> {
  await new Promise((res, rej) => {
    const t = setTimeout(res, 800 + Math.random() * 1200)
    signal.addEventListener("abort", () => { clearTimeout(t); rej(new DOMException("aborted", "AbortError")) })
  })
  const kind = String(node.data.kind ?? "image")
  if (node.data.failPlease) throw new Error("Stub failure (demo)")
  return STUBS[kind] ?? STUBS.image
}
```

Add two small placeholder assets under `apps/docs/public/stubs/` (any committed webp + short mp4; generate the webp with ImageMagick `magick -size 640x360 gradient:gray60-gray80 image-1.webp`, mp4 may be a 1-second black clip via ffmpeg if available — otherwise copy any small public-domain file and note its origin in a `public/stubs/README.md`).

- [ ] **Step 2: Demo page** — two `image` nodes + one `video` node wired with `TypedEdge`, custom node component composing `AiNode` + `MediaSlot` + `NodePrompt` + `RunButton` + `PortChips`, `useFlowRunner` with `stubExecute`, statuses flowing into node props, `connection-hint` on dangling connection end. This page is the Wave 2 acceptance artifact — image nodes run, video runs after, edit an image prompt and only it + video re-run (cache demo).
- [ ] **Step 3: Manual verify** — `pnpm dev`, open `/flow`: run all → statuses animate queued→streaming→done; toggle a node's `failPlease` via inspector-less hack (checkbox in node body, demo-only) → failed banner + downstream skipped.
- [ ] **Step 4: Commit** `feat(flow): wave-2 demo — image→video chain on stubs`.

### Task 14: Catalog pages + wave wrap-up

**Files:**
- Create: `apps/docs/app/components/[name]` entries for the 11 new items following the Wave 0 Task 14 pattern exactly (read one existing page first; copy its structure: live demo import, install command with `REGISTRY_URL`, props table, states showcase).
- Modify: catalog index page — add a "Flow Kit" group listing the 11 items.

- [ ] **Step 1:** Pages for: flow-types (doc-only, no demo), typed-handle, typed-edge, port-chip, connection-hint, node-status, media-slot, run-button, ai-node, model-bar (if built), node-prompt, use-flow-runner (doc-only, code examples).
- [ ] **Step 2:** Full gate: `pnpm lint && pnpm typecheck && pnpm check:tokens && pnpm --filter docs test -- --run && <registry build script>` — all green.
- [ ] **Step 3:** Commit `docs(flow): catalog pages for flow L2`. Push branch; do NOT merge — Wave 0 must merge first (coordination protocol).

---

## Dispatcher notes (subagent-driven execution)

| Group | Tasks | Parallel? |
|---|---|---|
| G0 | 0, 1 | sequential — everything depends on flow-types |
| G1 | 2, 3, 4 (wiring) | parallel after G0 |
| G2 | 5 → 8 (node-status then ai-node), 6, 7, 10, 11 | 6/7/10/11 parallel after G0; 8 after 5 |
| G3 | 9 (model-bar) | when Wave 0 Task 12 lands; parallelizable with G2 |
| G4 | 12 (runner) | parallel with G1/G2 after G0 |
| G5 | 13, 14 | sequential, after all above |

Each subagent receives: this plan's task text (self-contained), plus paths to the wave spec, inventory, and master spec §6 conventions. Subagents work ONLY in the worktree. Rebase onto `wave-0-foundation` between groups.

## Self-review checklist (run before dispatch)

- Spec coverage: F1 wiring 4 ✓ anatomy 6 ✓ runner ✓ tokens/`flow-types` ✓ demo chain ✓ catalog pages ✓ — F2/F3/providers/omnibar/perfume demo are waves 3–4 plans.
- No placeholders: every code step carries real code; gen-registry edits say "follow existing shape" because the file is Wave 0's contract — agents read it first (explicitly instructed).
- Type consistency: `FlowStatus` six-state union used by node-status/ai-node/run-button/media-slot/runner; `handleId` codec shared by typed-handle/typed-edge/flow-types tests; `RunnerNode/NodeOutput` shared by runner/stub-execute.
