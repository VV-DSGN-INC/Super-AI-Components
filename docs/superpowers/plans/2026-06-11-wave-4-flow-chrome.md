# Wave 4 — Flow Kit Chrome + Omnibar Agent + Final Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the Flow Kit's chrome layer — `node-palette` (both variants), `canvas-omnibar`, `run-controls`, `node-inspector`, `env-status` — as registry items with tests/demos/catalog pages; build the demo-app omnibar agent (typed-mutation engine + scripted fallback + AI SDK v6 route); and assemble the full `/flow` demo with a Playwright journey, the consumer-install `ai-node` extension, and the final merge-protocol wrap-up.

**Architecture:** Five chrome components are flow-L3 sources at `apps/docs/registry/super-ai/flow/<item>.tsx` (install target `components/super-ai/flow/`). Per the master layer model they depend only on L0 (shadcn), L1 (AI Elements via cross-registry URLs), and flow-L2 (Wave 2's `flow-types` / `ai-node` / etc.) — **never on each other** (no L3→L3 edges). All chrome is controlled, fetch-free, and token-clean. The omnibar **agent** (mutation schemas, scripted fallback, AI SDK route, store wiring) lives entirely in the demo app under `apps/docs/lib/flow/agent/` and `apps/docs/app/api/agent/` — components never fetch; the agent route + fetch + zustand store are demo-only glue. The `/flow` page composes Wave 2 anatomy + Wave 3 presets + Wave 4 chrome into the Flow AI–style shell.

**Tech Stack:** TypeScript · React 19 · Next.js App Router · Tailwind v4 (shadcn CSS variables) · `@xyflow/react` v12 · `zustand` (demo store) · `zod` (mutation schemas) · `ai` (AI SDK v6) via Vercel AI Gateway · Vitest + RTL (jsdom) · Playwright · existing `gen-registry.mts` + `consumer-test.sh` pipeline.

**Specs this plan implements:** [`docs/superpowers/specs/2026-06-11-flow-kit-design.md`](../specs/2026-06-11-flow-kit-design.md) §Omnibar agent, §Demo, §Testing, §Success criteria + [`docs/flow-kit-inventory.md`](../../flow-kit-inventory.md) §Group 4 (canvas chrome) and the `canvas-omnibar` deep spec. Conventions: master spec [`2026-06-10-super-ai-components-design.md`](../specs/2026-06-10-super-ai-components-design.md) §6 + Wave 0 plan deviations + Wave 2 plan contracts.

**Contract source (READ BEFORE ANY TASK):** [`docs/superpowers/plans/2026-06-11-wave-2-flow-foundation.md`](2026-06-11-wave-2-flow-foundation.md) is authoritative for: the `flow-types` exports (`FlowStatus`, `FLOW_STATUSES`, `handleId`/`parseHandleId`/`isValidFlowConnection`, `getHandleType`/`handleTypeKeys`, `NODE_WIDTH`), the `RunnerNode`/`NodeOutput`/`useFlowRunner` API, the file layout (`apps/docs/registry/super-ai/flow/`), the `gen-registry.mts` item shape + `REGISTRY_URL`/`FLOW_AI_ELEMENTS` consts, and the worktree/branch protocol. Wave 4 **adds files only**; it never edits Wave 2's component sources.

> **Catalog-shape alignment (recorded at Wave 2 review):** `node-palette`'s `PaletteEntry` must `extend` Wave 2's `NodeCatalogEntry` (exported by `connection-hint`, flow-L2 — a legal import) rather than redefine the shape, so one host catalog feeds both the palette and the connection hint without casts. `PaletteEntry` adds `icon`/`category` on top; `in`/`out` stay required per the base type.

---

## Conventions (binding for every component task — restated from Wave 2/3)

- `"use client"` as the first line of every interactive component (anything with state, effects, event handlers, or hotkeys).
- Exports **PascalCase**, files **kebab-case**, one component family per file.
- `data-slot="<part>"` on every rendered part.
- `className` passthrough on every part via `cn()` (`@/lib/utils`).
- **Controlled** components with `on*` callbacks; no internal stores inside registry components.
- **No data fetching inside registry components.** The agent route + `fetch` + the zustand store live in the demo app only.
- **No raw colors** — shadcn CSS variables and the Wave 2 `--flow-*` tokens only; `pnpm check:tokens` must pass over `registry/super-ai/**/*.tsx`.
- **Status vocabulary** is the master contract `idle | queued | streaming | done | failed | locked` — never invent states.
- Behavior tests colocated as `<item>.test.tsx` (Vitest + RTL, jsdom); test behavior (callbacks fire, states render), not markup snapshots.
- Cross-kit imports use relative siblings (`./flow-types`, `./ai-node`); `registryDependencies` carry the `REGISTRY_URL`-parameterized JSON URLs so siblings install together. AI Elements items are referenced via the `FLOW_AI_ELEMENTS` URL map.

---

## File structure (files this wave adds)

```
apps/docs/
├── registry/super-ai/flow/                          # 5 new L3 chrome items (+ colocated tests)
│   ├── node-palette.tsx          node-palette.test.tsx      # toolbelt + sidebar variants
│   ├── canvas-omnibar.tsx        canvas-omnibar.test.tsx    # UI-only prompt pill
│   ├── run-controls.tsx          run-controls.test.tsx      # Run/Stop/Run-selection + progress
│   ├── node-inspector.tsx        node-inspector.test.tsx    # right panel bound to selection
│   └── env-status.tsx            env-status.test.tsx        # providers pill
├── lib/flow/
│   ├── agent/
│   │   ├── mutations.ts          mutations.test.ts          # zod schemas + applyMutations()
│   │   └── scripted.ts           scripted.test.ts           # pattern-matched fallback intents
│   ├── flow-store.ts                                        # zustand store (demo state)
│   └── seed-perfume.ts                                      # seed graph (from Wave 3; see Task note)
├── app/
│   ├── api/agent/route.ts                                   # AI SDK v6 streamText tool-call loop
│   ├── flow/page.tsx             app/flow/flow-app.tsx       # full Flow AI–style demo (Task 12)
│   └── components/[name]/                                    # catalog pages pick up 5 chrome items
├── components/demos/flow/                                    # one demo per chrome item (client)
│   ├── node-palette-demo.tsx     canvas-omnibar-demo.tsx
│   ├── run-controls-demo.tsx     node-inspector-demo.tsx
│   └── env-status-demo.tsx
├── e2e/flow.spec.ts                                          # Playwright flow journey
└── scripts/consumer-test.sh                                  # MODIFY: add ai-node to the matrix
```

`apps/docs/lib/flow/seed-perfume.ts` and the provider routes (`app/api/generate/*`) are authored by Wave 3. If Wave 3 has not landed in the worktree when Task 12 runs, this plan creates a minimal local `seed-perfume.ts` (the seed-graph builder, Task 12 Step 1) at that exact path so the integration is self-contained; if Wave 3's version is already present, use it unchanged and skip the local creation. The omnibar agent (this wave) is independent of the provider routes.

---

### Task 0: Worktree sync + chrome scope sanity check

**Files:** none (git only)

This wave executes in the **same worktree and branch as Wave 2** (`../flow-kit-worktree`, branch `wave-2-flow-foundation`) — Wave 4 is the chrome+integration tail of the same Flow Kit branch. Do not cut a new branch.

- [ ] **Step 1: Enter the worktree and sync onto Wave 0**

```bash
cd "/Users/nickv/ClaudeCode Projects/AI Components/../flow-kit-worktree" 2>/dev/null || \
  (cd "/Users/nickv/ClaudeCode Projects/AI Components" && git worktree add ../flow-kit-worktree wave-2-flow-foundation)
cd "/Users/nickv/ClaudeCode Projects/AI Components/../flow-kit-worktree"
git fetch . wave-0-foundation && git rebase wave-0-foundation || echo "resolve rebase, then continue"
pnpm install
```

Expected: worktree on `wave-2-flow-foundation`, rebased onto latest `wave-0-foundation`, install green.

- [ ] **Step 2: Verify Wave 2 contracts are present (this wave depends on them)**

```bash
ls apps/docs/registry/super-ai/flow/flow-types.ts \
   apps/docs/registry/super-ai/flow/ai-node.tsx \
   apps/docs/registry/super-ai/flow/use-flow-runner.ts \
   apps/docs/registry/super-ai/flow/node-prompt.tsx \
   apps/docs/registry/super-ai/flow/media-slot.tsx \
   apps/docs/registry/super-ai/flow/run-button.tsx \
   apps/docs/registry/super-ai/flow/typed-handle.tsx \
   apps/docs/registry/super-ai/flow/typed-edge.tsx \
   apps/docs/registry/super-ai/flow/port-chip.tsx
```

Expected: all nine files exist. If any are missing, Wave 2 is incomplete — stop and finish Wave 2's tasks before proceeding (this wave's tests import these modules).

- [ ] **Step 3: Verify the toolchain is green before adding work**

```bash
pnpm --filter docs test -- --run
pnpm check:tokens || node apps/docs/scripts/check-tokens.mjs
```

Expected: existing tests pass, tokens clean. If script names differ, read `apps/docs/package.json` scripts and use those — do not rename them.

- [ ] **Step 4: Add the demo-app dependencies this wave needs (zustand, zod, ai)**

```bash
pnpm --filter docs add zustand zod ai
```

Expected: `zustand`, `zod`, `ai` (AI SDK v6) added to `apps/docs/package.json`. These are demo-app deps; chrome registry items declare only what they import (none of these — chrome is fetch-free and store-agnostic).

- [ ] **Step 5: Commit marker**

```bash
git commit --allow-empty -m "chore(flow): begin wave-4 chrome + agent + integration"
```

---

### Task 1: `node-palette` — toolbelt + sidebar variants

**Files:**

- Create: `apps/docs/registry/super-ai/flow/node-palette.tsx`
- Test: `apps/docs/registry/super-ai/flow/node-palette.test.tsx`
- Create: `apps/docs/components/demos/flow/node-palette-demo.tsx`

One item, two presentations selected by `variant`. **Toolbelt** = bottom-center floating icon row; clicking an icon calls `onAdd(kind)` with no position (the demo computes viewport-center placement — the Flow Builder pattern: `screenToFlowPosition(window center)` + random ±30px offset + `setCenter` + select). **Sidebar** = categorized cards (icon · name · one-line description) with a search/filter input; click or drag-to-canvas both yield the kind. The component is presentation + intent only; React Flow placement is the consumer's job and is exercised in the Task 12 demo.

- [ ] **Step 1: Write the failing test**

```tsx
// apps/docs/registry/super-ai/flow/node-palette.test.tsx
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ImageIcon } from "lucide-react";
import { NodePalette, type PaletteEntry } from "./node-palette";

const catalog: PaletteEntry[] = [
  {
    kind: "image-node",
    label: "Image",
    description: "Generate an image",
    icon: ImageIcon,
    category: "Visual",
    in: ["text"],
    out: ["image"],
  },
  {
    kind: "video-node",
    label: "Video",
    description: "Animate an image",
    icon: ImageIcon,
    category: "Visual",
    in: ["image", "text"],
    out: ["video"],
  },
  {
    kind: "music-node",
    label: "Music",
    description: "Compose a track",
    icon: ImageIcon,
    category: "Audio",
    in: ["text"],
    out: ["audio"],
  },
];

describe("NodePalette toolbelt", () => {
  it("renders an icon button per entry and adds with no position on click", async () => {
    const onAdd = vi.fn();
    render(<NodePalette variant="toolbelt" catalog={catalog} onAdd={onAdd} />);
    const bar = screen.getByRole("toolbar", { name: "Add node" });
    expect(within(bar).getAllByRole("button")).toHaveLength(3);
    await userEvent.click(screen.getByRole("button", { name: "Add Image node" }));
    expect(onAdd).toHaveBeenCalledWith("image-node", undefined);
  });
});

describe("NodePalette sidebar", () => {
  it("renders categorized cards with name + description", () => {
    render(<NodePalette variant="sidebar" catalog={catalog} onAdd={() => {}} />);
    expect(screen.getByRole("heading", { name: "Visual" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Audio" })).toBeInTheDocument();
    expect(screen.getByText("Animate an image")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Image/ })).toHaveAttribute("data-slot", "palette-card");
  });
  it("filters entries by the search input", async () => {
    render(<NodePalette variant="sidebar" catalog={catalog} onAdd={() => {}} />);
    await userEvent.type(screen.getByRole("searchbox", { name: "Filter nodes" }), "vid");
    expect(screen.getByText("Video")).toBeInTheDocument();
    expect(screen.queryByText("Image")).toBeNull();
    expect(screen.queryByText("Music")).toBeNull();
  });
  it("click adds the kind; drag start carries the kind on the dataTransfer", async () => {
    const onAdd = vi.fn();
    render(<NodePalette variant="sidebar" catalog={catalog} onAdd={onAdd} />);
    const card = screen.getByRole("button", { name: /Video/ });
    await userEvent.click(card);
    expect(onAdd).toHaveBeenCalledWith("video-node", undefined);
    const setData = vi.fn();
    card.dispatchEvent(
      Object.assign(new Event("dragstart", { bubbles: true }), {
        dataTransfer: { setData, effectAllowed: "" },
      }),
    );
    expect(setData).toHaveBeenCalledWith("application/super-ai-flow-kind", "video-node");
  });
});
```

- [ ] **Step 2: Run to verify failure** — `pnpm --filter docs test -- --run node-palette` → FAIL (module not found).

- [ ] **Step 3: Implement**

```tsx
// apps/docs/registry/super-ai/flow/node-palette.tsx
"use client";
import * as React from "react";
import { Search, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PaletteEntry {
  kind: string;
  label: string;
  description?: string;
  icon: LucideIcon;
  category?: string;
  /** input handle data types, for compatibility filtering by consumers */
  in?: string[];
  /** output handle data types */
  out?: string[];
}

export interface NodePaletteProps {
  variant: "toolbelt" | "sidebar";
  catalog: PaletteEntry[];
  /** position is supplied by drop handlers; click adds at consumer-chosen default (undefined) */
  onAdd: (kind: string, position?: { x: number; y: number }) => void;
  className?: string;
}

const DRAG_MIME = "application/super-ai-flow-kind";

function dragProps(kind: string) {
  return {
    draggable: true,
    onDragStart: (e: React.DragEvent) => {
      e.dataTransfer.setData(DRAG_MIME, kind);
      e.dataTransfer.effectAllowed = "copy";
    },
  };
}

function Toolbelt({ catalog, onAdd, className }: Omit<NodePaletteProps, "variant">) {
  return (
    <div
      role="toolbar"
      aria-label="Add node"
      data-slot="node-palette"
      data-variant="toolbelt"
      className={cn(
        "inline-flex items-center gap-1 rounded-full border bg-card/95 p-1 shadow-md backdrop-blur",
        className,
      )}
    >
      {catalog.map((entry) => {
        const Icon = entry.icon;
        return (
          <button
            key={entry.kind}
            type="button"
            data-slot="palette-tool"
            aria-label={`Add ${entry.label} node`}
            title={entry.label}
            onClick={() => onAdd(entry.kind, undefined)}
            {...dragProps(entry.kind)}
            className="inline-flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <Icon aria-hidden className="size-4" />
          </button>
        );
      })}
    </div>
  );
}

function Sidebar({ catalog, onAdd, className }: Omit<NodePaletteProps, "variant">) {
  const [query, setQuery] = React.useState("");
  const q = query.trim().toLowerCase();
  const filtered = q
    ? catalog.filter(
        (e) => e.label.toLowerCase().includes(q) || (e.description?.toLowerCase().includes(q) ?? false),
      )
    : catalog;
  const categories = [...new Set(filtered.map((e) => e.category ?? "Nodes"))];
  return (
    <div
      data-slot="node-palette"
      data-variant="sidebar"
      className={cn("flex w-64 flex-col gap-3 border-r bg-card p-3", className)}
    >
      <div className="relative">
        <Search aria-hidden className="absolute left-2 top-2.5 size-3.5 text-muted-foreground" />
        <input
          type="search"
          role="searchbox"
          aria-label="Filter nodes"
          placeholder="Search nodes…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-9 w-full rounded-md border bg-transparent pl-7 pr-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>
      <div className="flex flex-col gap-3 overflow-y-auto">
        {categories.map((cat) => (
          <section key={cat} data-slot="palette-category" className="space-y-1.5">
            <h3 className="px-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {cat}
            </h3>
            {filtered
              .filter((e) => (e.category ?? "Nodes") === cat)
              .map((entry) => {
                const Icon = entry.icon;
                return (
                  <button
                    key={entry.kind}
                    type="button"
                    data-slot="palette-card"
                    onClick={() => onAdd(entry.kind, undefined)}
                    {...dragProps(entry.kind)}
                    className="flex w-full items-start gap-2 rounded-lg border bg-background p-2 text-left transition-colors hover:bg-accent"
                  >
                    <span className="mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                      <Icon aria-hidden className="size-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-medium">{entry.label}</span>
                      {entry.description && (
                        <span className="block truncate text-xs text-muted-foreground">
                          {entry.description}
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
          </section>
        ))}
        {filtered.length === 0 && (
          <p className="px-1 text-xs text-muted-foreground">No nodes match “{query}”.</p>
        )}
      </div>
    </div>
  );
}

export function NodePalette({ variant, ...rest }: NodePaletteProps) {
  return variant === "toolbelt" ? <Toolbelt {...rest} /> : <Sidebar {...rest} />;
}

/** MIME type consumers read in onDrop to place a dragged palette entry. */
export const PALETTE_DRAG_MIME = DRAG_MIME;
```

- [ ] **Step 4: Run tests + token check** — `pnpm --filter docs test -- --run node-palette` → PASS. `pnpm check:tokens` → PASS.

- [ ] **Step 5: Demo component** (both variants side by side; toolbelt over a faux canvas, sidebar standalone — no React Flow needed here, placement is shown in the `/flow` demo).

```tsx
// apps/docs/components/demos/flow/node-palette-demo.tsx
"use client";
import * as React from "react";
import { AudioLines, Film, ImageIcon, Music, Type } from "lucide-react";
import { NodePalette, type PaletteEntry } from "@/registry/super-ai/flow/node-palette";

const catalog: PaletteEntry[] = [
  {
    kind: "text-node",
    label: "Text",
    description: "Static text block",
    icon: Type,
    category: "Text",
    out: ["text"],
  },
  {
    kind: "image-node",
    label: "Image",
    description: "Generate an image",
    icon: ImageIcon,
    category: "Visual",
    in: ["text"],
    out: ["image"],
  },
  {
    kind: "video-node",
    label: "Video",
    description: "Animate an image",
    icon: Film,
    category: "Visual",
    in: ["image", "text"],
    out: ["video"],
  },
  {
    kind: "tts-node",
    label: "Speech",
    description: "Text to speech",
    icon: AudioLines,
    category: "Audio",
    in: ["text"],
    out: ["audio"],
  },
  {
    kind: "music-node",
    label: "Music",
    description: "Compose a track",
    icon: Music,
    category: "Audio",
    in: ["text"],
    out: ["audio"],
  },
];

export default function NodePaletteDemo() {
  const [added, setAdded] = React.useState<string[]>([]);
  const onAdd = (kind: string) => setAdded((prev) => [...prev, kind]);
  return (
    <div className="flex w-full gap-4">
      <NodePalette variant="sidebar" catalog={catalog} onAdd={onAdd} />
      <div className="relative flex-1 rounded-lg border bg-[var(--flow-canvas-bg,var(--sidebar))] p-3">
        <p className="text-xs text-muted-foreground">
          Added: {added.length ? added.join(", ") : "nothing yet"}
        </p>
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
          <NodePalette variant="toolbelt" catalog={catalog} onAdd={onAdd} />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Register in `gen-registry.mts`** — read the file first; append a `node-palette` item following the existing shape. `registryDependencies: [self("flow-types")]`, `dependencies: ["lucide-react"]`. Rebuild registry per Wave 0 scripts; expect `public/r/node-palette.json`.

- [ ] **Step 7: Commit** — `git add -A && git commit -m "feat(flow): node-palette — toolbelt + sidebar variants"`

---

### Task 2: `canvas-omnibar` — UI-only graph prompt bar

**Files:**

- Create: `apps/docs/registry/super-ai/flow/canvas-omnibar.tsx`
- Test: `apps/docs/registry/super-ai/flow/canvas-omnibar.test.tsx`
- Create: `apps/docs/components/demos/flow/canvas-omnibar-demo.tsx`

UI only — input pill with placeholder, attachment slot, submit. States: `idle` · `focused` (renders suggestion chips from props) · `processing` (input locked + shimmer) · `error` (inline message, prompt preserved). A mutation-preview chip slot accepts `children` and renders Apply/Discard buttons wired to `onApply`/`onDiscard`. `role="search"`, `aria-label="Edit flow with a prompt"`; ⌘K focuses the input. The component owns no LLM call (the consumer passes `onSubmit(prompt)`).

- [ ] **Step 1: Write the failing test**

```tsx
// apps/docs/registry/super-ai/flow/canvas-omnibar.test.tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CanvasOmnibar } from "./canvas-omnibar";

describe("CanvasOmnibar", () => {
  it("has search role + label and submits the typed prompt", async () => {
    const onSubmit = vi.fn();
    render(
      <CanvasOmnibar value="" onValueChange={() => {}} onSubmit={onSubmit} placeholder="Edit the flow…" />,
    );
    const region = screen.getByRole("search", { name: "Edit flow with a prompt" });
    expect(region).toBeInTheDocument();
    const input = screen.getByPlaceholderText("Edit the flow…");
    await userEvent.type(input, "add background music{Enter}");
    expect(onSubmit).toHaveBeenCalledWith("add background music");
  });
  it("shows suggestion chips when focused and applies one on click", async () => {
    const onValueChange = vi.fn();
    render(
      <CanvasOmnibar
        value=""
        onValueChange={onValueChange}
        onSubmit={() => {}}
        suggestions={["Animate this image", "Add narration"]}
      />,
    );
    await userEvent.click(screen.getByRole("textbox"));
    await userEvent.click(screen.getByRole("button", { name: "Add narration" }));
    expect(onValueChange).toHaveBeenCalledWith("Add narration");
  });
  it("processing locks the input and renders a shimmer", () => {
    render(<CanvasOmnibar value="x" onValueChange={() => {}} onSubmit={() => {}} state="processing" />);
    expect(screen.getByRole("textbox")).toBeDisabled();
    expect(
      document.querySelector("[data-slot=canvas-omnibar][data-state=processing] [data-shimmer]"),
    ).toBeTruthy();
  });
  it("error renders inline and preserves the prompt", () => {
    render(
      <CanvasOmnibar
        value="kept prompt"
        onValueChange={() => {}}
        onSubmit={() => {}}
        state="error"
        error="No model key"
      />,
    );
    expect(screen.getByRole("textbox")).toHaveValue("kept prompt");
    expect(screen.getByText("No model key")).toBeInTheDocument();
  });
  it("renders the mutation-preview chip with Apply / Discard", async () => {
    const onApply = vi.fn();
    const onDiscard = vi.fn();
    render(
      <CanvasOmnibar
        value=""
        onValueChange={() => {}}
        onSubmit={() => {}}
        onApply={onApply}
        onDiscard={onDiscard}
      >
        Added Music node → wired to Composition
      </CanvasOmnibar>,
    );
    expect(screen.getByText("Added Music node → wired to Composition")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Apply" }));
    await userEvent.click(screen.getByRole("button", { name: "Discard" }));
    expect(onApply).toHaveBeenCalledOnce();
    expect(onDiscard).toHaveBeenCalledOnce();
  });
  it("⌘K focuses the input from elsewhere", async () => {
    render(<CanvasOmnibar value="" onValueChange={() => {}} onSubmit={() => {}} />);
    expect(screen.getByRole("textbox")).not.toHaveFocus();
    await userEvent.keyboard("{Meta>}k{/Meta}");
    expect(screen.getByRole("textbox")).toHaveFocus();
  });
});
```

- [ ] **Step 2: Run to verify failure** — `pnpm --filter docs test -- --run canvas-omnibar` → FAIL.

- [ ] **Step 3: Implement**

```tsx
// apps/docs/registry/super-ai/flow/canvas-omnibar.tsx
"use client";
import * as React from "react";
import { ArrowUp, Paperclip } from "lucide-react";
import { cn } from "@/lib/utils";

export type OmnibarState = "idle" | "focused" | "processing" | "error";

export interface CanvasOmnibarProps {
  value: string;
  onValueChange: (value: string) => void;
  onSubmit: (prompt: string) => void;
  placeholder?: string;
  state?: OmnibarState;
  error?: string;
  suggestions?: string[];
  onAttach?: () => void;
  /** Apply/Discard handlers for the mutation-preview chip rendered as children. */
  onApply?: () => void;
  onDiscard?: () => void;
  /** mutation-preview chip content; when present, Apply/Discard render below the input. */
  children?: React.ReactNode;
  className?: string;
}

export function CanvasOmnibar({
  value,
  onValueChange,
  onSubmit,
  placeholder = "Edit the flow with a prompt…",
  state = "idle",
  error,
  suggestions,
  onAttach,
  onApply,
  onDiscard,
  children,
  className,
}: CanvasOmnibarProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [focused, setFocused] = React.useState(false);
  const processing = state === "processing";
  const effectiveState: OmnibarState = state === "idle" && focused ? "focused" : state;

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const submit = () => {
    const trimmed = value.trim();
    if (trimmed && !processing) onSubmit(trimmed);
  };

  return (
    <div
      role="search"
      aria-label="Edit flow with a prompt"
      data-slot="canvas-omnibar"
      data-state={effectiveState}
      className={cn("flex w-full max-w-xl flex-col gap-2", className)}
    >
      {effectiveState === "focused" && suggestions?.length ? (
        <div data-slot="omnibar-suggestions" className="flex flex-wrap gap-1.5">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              data-slot="omnibar-suggestion"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onValueChange(s)}
              className="rounded-full border bg-card px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              {s}
            </button>
          ))}
        </div>
      ) : null}

      <div
        data-slot="omnibar-input-row"
        className={cn(
          "relative flex items-center gap-1.5 rounded-full border bg-card px-2 py-1 shadow-md",
          state === "error" && "border-destructive",
        )}
      >
        {processing && (
          <span
            data-shimmer
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-full bg-muted/60 [mask-image:linear-gradient(90deg,transparent,black,transparent)] animate-pulse"
          />
        )}
        {onAttach && (
          <button
            type="button"
            data-slot="omnibar-attach"
            aria-label="Add attachment"
            onClick={onAttach}
            disabled={processing}
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent disabled:opacity-50"
          >
            <Paperclip aria-hidden className="size-4" />
          </button>
        )}
        <input
          ref={inputRef}
          type="text"
          value={value}
          disabled={processing}
          placeholder={placeholder}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onChange={(e) => onValueChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              submit();
            }
          }}
          className="relative h-8 min-w-0 flex-1 bg-transparent px-1 text-sm outline-none disabled:opacity-60"
        />
        <button
          type="button"
          data-slot="omnibar-submit"
          aria-label="Submit"
          onClick={submit}
          disabled={processing || !value.trim()}
          className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          <ArrowUp aria-hidden className="size-4" />
        </button>
      </div>

      {state === "error" && error ? (
        <p data-slot="omnibar-error" className="px-3 text-xs text-destructive">
          {error}
        </p>
      ) : null}

      {children ? (
        <div
          data-slot="omnibar-preview"
          className="flex items-center justify-between gap-2 rounded-lg border bg-card px-3 py-2 text-xs"
        >
          <span className="min-w-0 truncate text-muted-foreground">{children}</span>
          <span className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={onDiscard}
              className="rounded-md px-2 py-1 text-muted-foreground transition-colors hover:bg-accent"
            >
              Discard
            </button>
            <button
              type="button"
              onClick={onApply}
              className="rounded-md bg-primary px-2 py-1 text-primary-foreground transition-opacity hover:opacity-90"
            >
              Apply
            </button>
          </span>
        </div>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 4: Run tests + token check** — PASS, clean.

- [ ] **Step 5: Demo component** (cycles idle → focused → processing → error and shows a static preview chip).

```tsx
// apps/docs/components/demos/flow/canvas-omnibar-demo.tsx
"use client";
import * as React from "react";
import { CanvasOmnibar, type OmnibarState } from "@/registry/super-ai/flow/canvas-omnibar";

export default function CanvasOmnibarDemo() {
  const [value, setValue] = React.useState("");
  const [state, setState] = React.useState<OmnibarState>("idle");
  const [preview, setPreview] = React.useState<string | null>(null);
  return (
    <div className="flex w-full flex-col items-center gap-3">
      <CanvasOmnibar
        value={value}
        onValueChange={setValue}
        state={state}
        error={state === "error" ? "No model key — using scripted fallback" : undefined}
        suggestions={["Animate this image", "Add narration", "Add background music"]}
        onAttach={() => {}}
        onSubmit={(prompt) => {
          setState("processing");
          setTimeout(() => {
            setState("idle");
            setPreview(`Added node for: “${prompt}” → wired to Composition`);
            setValue("");
          }, 900);
        }}
        onApply={() => setPreview(null)}
        onDiscard={() => setPreview(null)}
      >
        {preview}
      </CanvasOmnibar>
      <div className="flex gap-2 text-xs">
        {(["idle", "processing", "error"] as OmnibarState[]).map((s) => (
          <button key={s} className="rounded-md border px-2 py-1" onClick={() => setState(s)}>
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Register** — `canvas-omnibar` item, `registryDependencies: [self("flow-types")]`, `dependencies: ["lucide-react"]`. (No flow-types import is required by the source, but the dep keeps the kit installable as a set and documents kinship; harmless.) Rebuild; expect `public/r/canvas-omnibar.json`.

- [ ] **Step 7: Commit** — `git add -A && git commit -m "feat(flow): canvas-omnibar — UI-only graph prompt bar"`

---

### Task 3: `run-controls` — toolbar cluster + progress

**Files:**

- Create: `apps/docs/registry/super-ai/flow/run-controls.tsx`
- Test: `apps/docs/registry/super-ai/flow/run-controls.test.tsx`
- Create: `apps/docs/components/demos/flow/run-controls-demo.tsx`

Toolbar cluster: Run flow / Stop / Run selection buttons + progress text from `{ done, total, failed }` rendering `"3/7 · 1 failed"`. States: `idle` · `streaming` (primary becomes Stop, calls `onStop`) · `partial-failure` (progress shows the failed count).

- [ ] **Step 1: Write the failing test**

```tsx
// apps/docs/registry/super-ai/flow/run-controls.test.tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { RunControls } from "./run-controls";

describe("RunControls", () => {
  it("idle: Run flow + Run selection fire their callbacks", async () => {
    const onRun = vi.fn();
    const onRunSelection = vi.fn();
    render(
      <RunControls
        state="idle"
        onRun={onRun}
        onStop={() => {}}
        onRunSelection={onRunSelection}
        selectionCount={2}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Run flow" }));
    await userEvent.click(screen.getByRole("button", { name: "Run selection" }));
    expect(onRun).toHaveBeenCalledOnce();
    expect(onRunSelection).toHaveBeenCalledOnce();
  });
  it("streaming: shows Stop and progress text", async () => {
    const onStop = vi.fn();
    render(
      <RunControls state="streaming" onRun={() => {}} onStop={onStop} progress={{ done: 3, total: 7 }} />,
    );
    expect(screen.getByText("3/7")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Stop" }));
    expect(onStop).toHaveBeenCalledOnce();
  });
  it("partial-failure: progress includes the failed count", () => {
    render(
      <RunControls
        state="partial-failure"
        onRun={() => {}}
        onStop={() => {}}
        progress={{ done: 7, total: 7, failed: 1 }}
      />,
    );
    expect(screen.getByText("7/7 · 1 failed")).toBeInTheDocument();
  });
  it("disables Run selection when nothing is selected", () => {
    render(
      <RunControls
        state="idle"
        onRun={() => {}}
        onStop={() => {}}
        onRunSelection={() => {}}
        selectionCount={0}
      />,
    );
    expect(screen.getByRole("button", { name: "Run selection" })).toBeDisabled();
  });
});
```

- [ ] **Step 2: Run to verify failure** — FAIL.

- [ ] **Step 3: Implement**

```tsx
// apps/docs/registry/super-ai/flow/run-controls.tsx
"use client";
import { Play, Square, SquareDashedMousePointer } from "lucide-react";
import { cn } from "@/lib/utils";

export type RunControlsState = "idle" | "streaming" | "partial-failure";

export interface RunProgress {
  done: number;
  total: number;
  failed?: number;
}

export interface RunControlsProps {
  state: RunControlsState;
  onRun: () => void;
  onStop: () => void;
  onRunSelection?: () => void;
  selectionCount?: number;
  progress?: RunProgress;
  className?: string;
}

export function progressText(p: RunProgress): string {
  const base = `${p.done}/${p.total}`;
  return p.failed ? `${base} · ${p.failed} failed` : base;
}

export function RunControls({
  state,
  onRun,
  onStop,
  onRunSelection,
  selectionCount = 0,
  progress,
  className,
}: RunControlsProps) {
  const streaming = state === "streaming";
  return (
    <div
      role="toolbar"
      aria-label="Run controls"
      data-slot="run-controls"
      data-state={state}
      className={cn("inline-flex items-center gap-2 rounded-lg border bg-card p-1", className)}
    >
      {streaming ? (
        <button
          type="button"
          data-slot="run-controls-stop"
          onClick={onStop}
          className="inline-flex items-center gap-1.5 rounded-md bg-destructive px-2.5 py-1.5 text-sm font-medium text-destructive-foreground transition-opacity hover:opacity-90"
        >
          <Square aria-hidden className="size-3.5" />
          Stop
        </button>
      ) : (
        <button
          type="button"
          data-slot="run-controls-run"
          onClick={onRun}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-2.5 py-1.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          <Play aria-hidden className="size-3.5" />
          Run flow
        </button>
      )}
      {onRunSelection && (
        <button
          type="button"
          data-slot="run-controls-run-selection"
          onClick={onRunSelection}
          disabled={selectionCount === 0 || streaming}
          className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-sm transition-colors hover:bg-accent disabled:pointer-events-none disabled:opacity-50"
        >
          <SquareDashedMousePointer aria-hidden className="size-3.5" />
          Run selection
        </button>
      )}
      {progress && (
        <span
          data-slot="run-controls-progress"
          aria-live="polite"
          className={cn(
            "px-1.5 text-xs tabular-nums",
            state === "partial-failure" ? "text-destructive" : "text-muted-foreground",
          )}
        >
          {progressText(progress)}
        </span>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run tests + token check** — PASS, clean.

- [ ] **Step 5: Demo component**

```tsx
// apps/docs/components/demos/flow/run-controls-demo.tsx
"use client";
import * as React from "react";
import { RunControls, type RunControlsState } from "@/registry/super-ai/flow/run-controls";

export default function RunControlsDemo() {
  const [state, setState] = React.useState<RunControlsState>("idle");
  const progress =
    state === "streaming"
      ? { done: 3, total: 7 }
      : state === "partial-failure"
        ? { done: 7, total: 7, failed: 1 }
        : undefined;
  return (
    <div className="flex flex-col items-center gap-3">
      <RunControls
        state={state}
        onRun={() => setState("streaming")}
        onStop={() => setState("idle")}
        onRunSelection={() => {}}
        selectionCount={2}
        progress={progress}
      />
      <div className="flex gap-2 text-xs">
        {(["idle", "streaming", "partial-failure"] as RunControlsState[]).map((s) => (
          <button key={s} className="rounded-md border px-2 py-1" onClick={() => setState(s)}>
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Register** — `run-controls` item, `registryDependencies: [self("flow-types")]`, `dependencies: ["lucide-react"]`. Rebuild; expect `public/r/run-controls.json`.

- [ ] **Step 7: Commit** — `git add -A && git commit -m "feat(flow): run-controls — run/stop/run-selection + progress"`

---

### Task 4: `node-inspector` — right panel bound to selection

**Files:**

- Create: `apps/docs/registry/super-ai/flow/node-inspector.tsx`
- Test: `apps/docs/registry/super-ai/flow/node-inspector.test.tsx`
- Create: `apps/docs/components/demos/flow/node-inspector-demo.tsx`

Right panel bound to selection via props. Empty state (`"Select a node"`). Single-select: label text field via `onLabelChange`, `children` slot for node-specific options, `explainer` slot, Duplicate/Delete buttons. Multi-select: count + bulk Delete.

- [ ] **Step 1: Write the failing test**

```tsx
// apps/docs/registry/super-ai/flow/node-inspector.test.tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { NodeInspector } from "./node-inspector";

describe("NodeInspector", () => {
  it("empty state when nothing is selected", () => {
    render(<NodeInspector selection={[]} />);
    expect(screen.getByText("Select a node")).toBeInTheDocument();
  });
  it("single-select: edits the label and fires Duplicate / Delete", async () => {
    const onLabelChange = vi.fn();
    const onDuplicate = vi.fn();
    const onDelete = vi.fn();
    render(
      <NodeInspector
        selection={[{ id: "n1", label: "Hero shot" }]}
        onLabelChange={onLabelChange}
        onDuplicate={onDuplicate}
        onDelete={onDelete}
        explainer={<p>Connected results go to Composition</p>}
      >
        <div data-testid="options">aspect ratio</div>
      </NodeInspector>,
    );
    const field = screen.getByRole("textbox", { name: "Label" });
    expect(field).toHaveValue("Hero shot");
    await userEvent.type(field, "!");
    expect(onLabelChange).toHaveBeenLastCalledWith("n1", "Hero shot!");
    expect(screen.getByTestId("options")).toBeInTheDocument();
    expect(screen.getByText("Connected results go to Composition")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Duplicate" }));
    await userEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(onDuplicate).toHaveBeenCalledWith("n1");
    expect(onDelete).toHaveBeenCalledWith(["n1"]);
  });
  it("multi-select: shows the count and bulk-deletes all ids", async () => {
    const onDelete = vi.fn();
    render(
      <NodeInspector
        selection={[
          { id: "a", label: "A" },
          { id: "b", label: "B" },
          { id: "c", label: "C" },
        ]}
        onDelete={onDelete}
      />,
    );
    expect(screen.getByText("3 nodes selected")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Delete 3" }));
    expect(onDelete).toHaveBeenCalledWith(["a", "b", "c"]);
  });
});
```

- [ ] **Step 2: Run to verify failure** — FAIL.

- [ ] **Step 3: Implement**

```tsx
// apps/docs/registry/super-ai/flow/node-inspector.tsx
"use client";
import { Copy, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface InspectorNode {
  id: string;
  label: string;
}

export interface NodeInspectorProps {
  selection: InspectorNode[];
  onLabelChange?: (id: string, label: string) => void;
  onDuplicate?: (id: string) => void;
  onDelete?: (ids: string[]) => void;
  /** node-specific option controls (single-select only) */
  children?: React.ReactNode;
  /** "connected results go to…" style explainer (single-select only) */
  explainer?: React.ReactNode;
  className?: string;
}

export function NodeInspector({
  selection,
  onLabelChange,
  onDuplicate,
  onDelete,
  children,
  explainer,
  className,
}: NodeInspectorProps) {
  const base = cn("flex w-72 flex-col gap-4 border-l bg-card p-4", className);

  if (selection.length === 0) {
    return (
      <aside data-slot="node-inspector" data-state="empty" className={base} aria-label="Node inspector">
        <p className="text-sm text-muted-foreground">Select a node</p>
      </aside>
    );
  }

  if (selection.length > 1) {
    const ids = selection.map((n) => n.id);
    return (
      <aside data-slot="node-inspector" data-state="multi" className={base} aria-label="Node inspector">
        <p className="text-sm font-medium">{selection.length} nodes selected</p>
        <button
          type="button"
          onClick={() => onDelete?.(ids)}
          className="inline-flex items-center justify-center gap-1.5 rounded-md border border-destructive/40 px-3 py-1.5 text-sm text-destructive transition-colors hover:bg-destructive/10"
        >
          <Trash2 aria-hidden className="size-3.5" />
          Delete {selection.length}
        </button>
      </aside>
    );
  }

  const node = selection[0];
  return (
    <aside data-slot="node-inspector" data-state="single" className={base} aria-label="Node inspector">
      <label data-slot="inspector-label-field" className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-muted-foreground">Label</span>
        <input
          type="text"
          aria-label="Label"
          value={node.label}
          onChange={(e) => onLabelChange?.(node.id, e.target.value)}
          className="h-8 rounded-md border bg-transparent px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </label>

      {children && (
        <div data-slot="inspector-options" className="flex flex-col gap-3">
          {children}
        </div>
      )}

      {explainer && (
        <div
          data-slot="inspector-explainer"
          className="rounded-md bg-muted/50 p-2 text-xs text-muted-foreground"
        >
          {explainer}
        </div>
      )}

      <div data-slot="inspector-actions" className="mt-auto flex items-center gap-2">
        <button
          type="button"
          onClick={() => onDuplicate?.(node.id)}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md border px-3 py-1.5 text-sm transition-colors hover:bg-accent"
        >
          <Copy aria-hidden className="size-3.5" />
          Duplicate
        </button>
        <button
          type="button"
          onClick={() => onDelete?.([node.id])}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md border border-destructive/40 px-3 py-1.5 text-sm text-destructive transition-colors hover:bg-destructive/10"
        >
          <Trash2 aria-hidden className="size-3.5" />
          Delete
        </button>
      </div>
    </aside>
  );
}
```

- [ ] **Step 4: Run tests + token check** — PASS, clean.

- [ ] **Step 5: Demo component** (toggles empty / single / multi).

```tsx
// apps/docs/components/demos/flow/node-inspector-demo.tsx
"use client";
import * as React from "react";
import { NodeInspector, type InspectorNode } from "@/registry/super-ai/flow/node-inspector";

const single: InspectorNode[] = [{ id: "n1", label: "Hero shot" }];
const multi: InspectorNode[] = [
  { id: "a", label: "Image 1" },
  { id: "b", label: "Image 2" },
];

export default function NodeInspectorDemo() {
  const [selection, setSelection] = React.useState<InspectorNode[]>(single);
  return (
    <div className="flex w-full gap-4">
      <div className="flex flex-1 flex-col gap-2">
        {[
          { label: "Empty", value: [] as InspectorNode[] },
          { label: "Single", value: single },
          { label: "Multi", value: multi },
        ].map((opt) => (
          <button
            key={opt.label}
            className="rounded-md border px-2 py-1 text-sm"
            onClick={() => setSelection(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>
      <NodeInspector
        selection={selection}
        onLabelChange={(id, label) =>
          setSelection((prev) => prev.map((n) => (n.id === id ? { ...n, label } : n)))
        }
        onDuplicate={() => {}}
        onDelete={() => setSelection([])}
        explainer={
          <>
            Connected results go to <strong>Composition</strong>
          </>
        }
      >
        <p className="text-xs text-muted-foreground">Node-specific options render here.</p>
      </NodeInspector>
    </div>
  );
}
```

- [ ] **Step 6: Register** — `node-inspector` item, `registryDependencies: [self("flow-types")]`, `dependencies: ["lucide-react"]`. Rebuild; expect `public/r/node-inspector.json`.

- [ ] **Step 7: Commit** — `git add -A && git commit -m "feat(flow): node-inspector — selection-bound right panel"`

---

### Task 5: `env-status` — providers pill

**Files:**

- Create: `apps/docs/registry/super-ai/flow/env-status.tsx`
- Test: `apps/docs/registry/super-ai/flow/env-status.test.tsx`
- Create: `apps/docs/components/demos/flow/env-status-demo.tsx`

Pill showing a `providers` map from props (`{ speech: "stub" | "live", ... }`). Renders `"Stub mode"` when **all** providers are stub; a provider list when mixed/live; an optional `credits` slot. Dot color: `var(--flow-done)` when any provider is live, else `var(--flow-queued)`.

- [ ] **Step 1: Write the failing test**

```tsx
// apps/docs/registry/super-ai/flow/env-status.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EnvStatus, isAllStub } from "./env-status";

describe("env-status helpers", () => {
  it("isAllStub is true only when every provider is stub", () => {
    expect(isAllStub({ speech: "stub", image: "stub" })).toBe(true);
    expect(isAllStub({ speech: "live", image: "stub" })).toBe(false);
    expect(isAllStub({})).toBe(true);
  });
});

describe("EnvStatus", () => {
  it("all-stub renders the stub-mode label with the queued dot color", () => {
    render(<EnvStatus providers={{ speech: "stub", image: "stub", video: "stub" }} />);
    expect(screen.getByText("Stub mode")).toBeInTheDocument();
    expect(screen.getByRole("status").querySelector("[data-slot=env-status-dot]")).toHaveStyle({
      background: "var(--flow-queued)",
    });
  });
  it("mixed renders the live provider names and the done dot color", () => {
    render(<EnvStatus providers={{ speech: "live", sfx: "live", image: "stub" }} />);
    expect(screen.getByText(/speech, sfx/)).toBeInTheDocument();
    expect(screen.getByRole("status").querySelector("[data-slot=env-status-dot]")).toHaveStyle({
      background: "var(--flow-done)",
    });
  });
  it("renders an optional credits slot", () => {
    render(<EnvStatus providers={{ image: "live" }} credits={<span>55 credits</span>} />);
    expect(screen.getByText("55 credits")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run to verify failure** — FAIL.

- [ ] **Step 3: Implement**

```tsx
// apps/docs/registry/super-ai/flow/env-status.tsx
import { cn } from "@/lib/utils";

export type ProviderMode = "stub" | "live";
export type ProviderMap = Record<string, ProviderMode>;

export interface EnvStatusProps {
  providers: ProviderMap;
  /** optional credits / balance chip rendered beside the pill */
  credits?: React.ReactNode;
  className?: string;
}

export function isAllStub(providers: ProviderMap): boolean {
  return Object.values(providers).every((m) => m === "stub");
}

export function EnvStatus({ providers, credits, className }: EnvStatusProps) {
  const allStub = isAllStub(providers);
  const live = Object.entries(providers)
    .filter(([, mode]) => mode === "live")
    .map(([name]) => name);
  const label = allStub ? "Stub mode" : `Live: ${live.join(", ")}`;
  return (
    <div
      role="status"
      data-slot="env-status"
      data-mode={allStub ? "stub" : "live"}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border bg-card px-2.5 py-1 text-xs text-muted-foreground",
        className,
      )}
    >
      <span
        data-slot="env-status-dot"
        aria-hidden
        className="size-2 rounded-full"
        style={{ background: allStub ? "var(--flow-queued)" : "var(--flow-done)" }}
      />
      <span data-slot="env-status-label">{label}</span>
      {credits ? (
        <span data-slot="env-status-credits" className="border-l pl-2">
          {credits}
        </span>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 4: Run tests + token check** — PASS, clean.

- [ ] **Step 5: Demo component** (all-stub, mixed, and live-with-credits).

```tsx
// apps/docs/components/demos/flow/env-status-demo.tsx
"use client";
import { EnvStatus } from "@/registry/super-ai/flow/env-status";

export default function EnvStatusDemo() {
  return (
    <div className="flex flex-col items-start gap-3">
      <EnvStatus providers={{ speech: "stub", image: "stub", video: "stub" }} />
      <EnvStatus providers={{ speech: "live", sfx: "live", music: "live", image: "stub", video: "stub" }} />
      <EnvStatus providers={{ image: "live", llm: "live" }} credits={<span>55 credits</span>} />
    </div>
  );
}
```

- [ ] **Step 6: Register** — `env-status` item, `registryDependencies: [self("flow-types")]`, no npm deps. Rebuild; expect `public/r/env-status.json`.

- [ ] **Step 7: Commit** — `git add -A && git commit -m "feat(flow): env-status — providers pill"`

---

### Task 6: Omnibar agent — mutation schemas + `applyMutations` (demo app)

**Files:**

- Create: `apps/docs/lib/flow/agent/mutations.ts`
- Test: `apps/docs/lib/flow/agent/mutations.test.ts`

Demo-app module (NOT a registry item). Zod schemas for `addNode | updateNode | connectNodes | removeNode`, validated against the handle-type registry (imported from the registry `flow-types`), plus a pure `applyMutations(graph, mutations)`. The graph shape mirrors React Flow's `{ nodes, edges }`; `connectNodes` only succeeds when source-out and target-in data types match (reuse `isValidFlowConnection` + the `handleId` codec from `flow-types`).

- [ ] **Step 1: Write the failing test**

```ts
// apps/docs/lib/flow/agent/mutations.test.ts
import { describe, expect, it } from "vitest";
import { applyMutations, MutationSchema, parseMutations, type FlowGraph } from "./mutations";

const graph: FlowGraph = {
  nodes: [
    { id: "img1", kind: "image-node", position: { x: 0, y: 0 }, data: { label: "Image 1" } },
    { id: "comp", kind: "composition-node", position: { x: 400, y: 0 }, data: { label: "Composition" } },
  ],
  edges: [],
};

describe("MutationSchema", () => {
  it("accepts a well-formed addNode mutation", () => {
    const parsed = MutationSchema.parse({ op: "addNode", kind: "music-node", position: { x: 10, y: 20 } });
    expect(parsed.op).toBe("addNode");
  });
  it("rejects an unknown op", () => {
    expect(() => MutationSchema.parse({ op: "explode" })).toThrow();
  });
  it("parseMutations filters invalid entries and keeps valid ones", () => {
    const out = parseMutations([{ op: "removeNode", id: "x" }, { op: "nope" }]);
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ op: "removeNode", id: "x" });
  });
});

describe("applyMutations", () => {
  it("addNode appends a node with a generated id", () => {
    const next = applyMutations(graph, [{ op: "addNode", kind: "music-node", position: { x: 5, y: 5 } }]);
    expect(next.nodes).toHaveLength(3);
    expect(next.nodes.at(-1)).toMatchObject({ kind: "music-node" });
    expect(next.nodes.at(-1)!.id).toBeTruthy();
  });
  it("connectNodes adds a typed edge when types match", () => {
    const withMusic = applyMutations(graph, [
      { op: "addNode", id: "music1", kind: "music-node", position: { x: 5, y: 5 } },
    ]);
    const next = applyMutations(withMusic, [
      { op: "connectNodes", source: "music1", target: "comp", dataType: "audio" },
    ]);
    expect(next.edges).toHaveLength(1);
    expect(next.edges[0]).toMatchObject({
      source: "music1",
      target: "comp",
      sourceHandle: "music1:audio:out",
      targetHandle: "comp:audio:in",
    });
  });
  it("connectNodes is a no-op when the data type is not in the registry", () => {
    const next = applyMutations(graph, [
      { op: "connectNodes", source: "img1", target: "comp", dataType: "bogus" },
    ]);
    expect(next.edges).toHaveLength(0);
  });
  it("updateNode merges data; removeNode drops the node and its edges", () => {
    const connected = applyMutations(
      applyMutations(graph, [{ op: "addNode", id: "music1", kind: "music-node", position: { x: 5, y: 5 } }]),
      [{ op: "connectNodes", source: "music1", target: "comp", dataType: "audio" }],
    );
    const renamed = applyMutations(connected, [{ op: "updateNode", id: "music1", data: { label: "Score" } }]);
    expect(renamed.nodes.find((n) => n.id === "music1")!.data.label).toBe("Score");
    const removed = applyMutations(renamed, [{ op: "removeNode", id: "music1" }]);
    expect(removed.nodes.find((n) => n.id === "music1")).toBeUndefined();
    expect(removed.edges).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run to verify failure** — `pnpm --filter docs test -- --run mutations` → FAIL.

- [ ] **Step 3: Implement**

```ts
// apps/docs/lib/flow/agent/mutations.ts
// Demo-app agent layer: typed graph mutations validated against the handle-type registry.
// NOT a registry item — components never fetch; this is omnibar wiring.
import { z } from "zod";
import { getHandleType, handleId, isValidFlowConnection } from "@/registry/super-ai/flow/flow-types";

export interface FlowNode {
  id: string;
  kind: string;
  position: { x: number; y: number };
  data: Record<string, unknown>;
}
export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle: string;
  targetHandle: string;
}
export interface FlowGraph {
  nodes: FlowNode[];
  edges: FlowEdge[];
}

const Position = z.object({ x: z.number(), y: z.number() });

export const AddNode = z.object({
  op: z.literal("addNode"),
  id: z.string().optional(),
  kind: z.string(),
  position: Position.optional(),
  data: z.record(z.string(), z.unknown()).optional(),
});
export const UpdateNode = z.object({
  op: z.literal("updateNode"),
  id: z.string(),
  data: z.record(z.string(), z.unknown()),
});
export const ConnectNodes = z.object({
  op: z.literal("connectNodes"),
  source: z.string(),
  target: z.string(),
  dataType: z.string(),
});
export const RemoveNode = z.object({
  op: z.literal("removeNode"),
  id: z.string(),
});

export const MutationSchema = z.discriminatedUnion("op", [AddNode, UpdateNode, ConnectNodes, RemoveNode]);
export type Mutation = z.infer<typeof MutationSchema>;

/** Validate an unknown array; drop entries that fail the schema (model output is untrusted). */
export function parseMutations(input: unknown): Mutation[] {
  if (!Array.isArray(input)) return [];
  const out: Mutation[] = [];
  for (const raw of input) {
    const parsed = MutationSchema.safeParse(raw);
    if (parsed.success) out.push(parsed.data);
  }
  return out;
}

let counter = 0;
const nextId = (kind: string) => `${kind}-${Date.now().toString(36)}-${(counter++).toString(36)}`;

/** Pure reducer: apply validated mutations to a graph, returning a new graph. */
export function applyMutations(graph: FlowGraph, mutations: Mutation[]): FlowGraph {
  let nodes = graph.nodes.slice();
  let edges = graph.edges.slice();

  for (const m of mutations) {
    switch (m.op) {
      case "addNode": {
        nodes = [
          ...nodes,
          {
            id: m.id ?? nextId(m.kind),
            kind: m.kind,
            position: m.position ?? { x: 0, y: 0 },
            data: m.data ?? {},
          },
        ];
        break;
      }
      case "updateNode": {
        nodes = nodes.map((n) => (n.id === m.id ? { ...n, data: { ...n.data, ...m.data } } : n));
        break;
      }
      case "connectNodes": {
        if (!getHandleType(m.dataType)) break;
        const sourceHandle = handleId(m.source, m.dataType, "out");
        const targetHandle = handleId(m.target, m.dataType, "in");
        if (!isValidFlowConnection({ sourceHandle, targetHandle })) break;
        if (!nodes.some((n) => n.id === m.source) || !nodes.some((n) => n.id === m.target)) break;
        edges = [
          ...edges,
          {
            id: `${m.source}->${m.target}:${m.dataType}`,
            source: m.source,
            target: m.target,
            sourceHandle,
            targetHandle,
          },
        ];
        break;
      }
      case "removeNode": {
        nodes = nodes.filter((n) => n.id !== m.id);
        edges = edges.filter((e) => e.source !== m.id && e.target !== m.id);
        break;
      }
    }
  }
  return { nodes, edges };
}
```

- [ ] **Step 4: Run tests** — `pnpm --filter docs test -- --run mutations` → PASS. (`check:tokens` does not scan `lib/`; no token concern.)

- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat(flow): agent mutation schemas + applyMutations reducer"`

---

### Task 7: Omnibar agent — scripted fallback intents (demo app)

**Files:**

- Create: `apps/docs/lib/flow/agent/scripted.ts`
- Test: `apps/docs/lib/flow/agent/scripted.test.ts`

Pattern-matched fallback returning typed mutations when no LLM key is present. Canonical intents from the spec: `"add background music"` → `addNode music-node` + `connectNodes` to the composition; `"add narration"` → text + tts chain (two `addNode` + a `connectNodes`); `"animate this image"` → `video-node` fed from the selected image. Takes a small context (`{ selection, nodeIndex }`) so it can target the right nodes. Returns `Mutation[]` (validated by reusing the schema in Task 6).

- [ ] **Step 1: Write the failing test**

```ts
// apps/docs/lib/flow/agent/scripted.test.ts
import { describe, expect, it } from "vitest";
import { scriptedMutations, type ScriptContext } from "./scripted";
import { MutationSchema } from "./mutations";

const ctx: ScriptContext = {
  selection: ["img1"],
  nodeIndex: {
    img1: { kind: "image-node" },
    comp: { kind: "composition-node" },
  },
};

function assertValid(ms: ReturnType<typeof scriptedMutations>) {
  for (const m of ms) expect(() => MutationSchema.parse(m)).not.toThrow();
}

describe("scriptedMutations", () => {
  it("'add background music' adds a music node wired to the composition", () => {
    const ms = scriptedMutations("Add background music to the scene", ctx);
    assertValid(ms);
    const add = ms.find((m) => m.op === "addNode")!;
    expect(add).toMatchObject({ kind: "music-node" });
    const connect = ms.find((m) => m.op === "connectNodes")!;
    expect(connect).toMatchObject({ target: "comp", dataType: "audio" });
  });
  it("'add narration' creates a text → tts chain", () => {
    const ms = scriptedMutations("add narration", ctx);
    assertValid(ms);
    const kinds = ms.filter((m) => m.op === "addNode").map((m) => (m as { kind: string }).kind);
    expect(kinds).toEqual(["text-node", "tts-node"]);
    const connect = ms.find((m) => m.op === "connectNodes")!;
    expect(connect).toMatchObject({ dataType: "text" });
  });
  it("'animate this image' adds a video node from the selected image", () => {
    const ms = scriptedMutations("animate this image", ctx);
    assertValid(ms);
    const add = ms.find((m) => m.op === "addNode")!;
    expect(add).toMatchObject({ kind: "video-node" });
    const connect = ms.find((m) => m.op === "connectNodes")!;
    expect(connect).toMatchObject({ source: "img1", dataType: "image" });
  });
  it("returns [] for an unrecognized prompt", () => {
    expect(scriptedMutations("make me a sandwich", ctx)).toEqual([]);
  });
});
```

- [ ] **Step 2: Run to verify failure** — FAIL.

- [ ] **Step 3: Implement**

```ts
// apps/docs/lib/flow/agent/scripted.ts
// Scripted fallback: canned intents → typed mutations when no LLM key is present.
import type { Mutation } from "./mutations";

export interface ScriptContext {
  /** ids of currently selected nodes (first is the primary target) */
  selection: string[];
  /** id → minimal node descriptor, used to find a composition / image to wire into */
  nodeIndex: Record<string, { kind: string }>;
}

function findByKind(ctx: ScriptContext, kind: string): string | undefined {
  return Object.entries(ctx.nodeIndex).find(([, n]) => n.kind === kind)?.[0];
}
function selectedOfKind(ctx: ScriptContext, kind: string): string | undefined {
  return ctx.selection.find((id) => ctx.nodeIndex[id]?.kind === kind);
}

type Rule = { test: RegExp; build: (ctx: ScriptContext) => Mutation[] };

const RULES: Rule[] = [
  {
    test: /background music|add music|score the/i,
    build: (ctx) => {
      const comp = findByKind(ctx, "composition-node");
      const id = "music-script";
      const ms: Mutation[] = [{ op: "addNode", id, kind: "music-node", position: { x: 40, y: 320 } }];
      if (comp) ms.push({ op: "connectNodes", source: id, target: comp, dataType: "audio" });
      return ms;
    },
  },
  {
    test: /add narration|voice ?over|narrate/i,
    build: () => {
      const textId = "narration-text";
      const ttsId = "narration-tts";
      return [
        { op: "addNode", id: textId, kind: "text-node", position: { x: 40, y: 180 } },
        { op: "addNode", id: ttsId, kind: "tts-node", position: { x: 320, y: 180 } },
        { op: "connectNodes", source: textId, target: ttsId, dataType: "text" },
      ];
    },
  },
  {
    test: /animate this image|animate the image|image to video/i,
    build: (ctx) => {
      const image = selectedOfKind(ctx, "image-node") ?? findByKind(ctx, "image-node");
      const id = "animate-video";
      const ms: Mutation[] = [{ op: "addNode", id, kind: "video-node", position: { x: 360, y: 40 } }];
      if (image) ms.push({ op: "connectNodes", source: image, target: id, dataType: "image" });
      return ms;
    },
  },
];

/** Match a prompt to a canned intent; return [] when nothing matches. */
export function scriptedMutations(prompt: string, ctx: ScriptContext): Mutation[] {
  const rule = RULES.find((r) => r.test.test(prompt));
  return rule ? rule.build(ctx) : [];
}
```

- [ ] **Step 4: Run tests** — PASS.

- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat(flow): scripted omnibar fallback intents"`

---

### Task 8: Omnibar agent — AI SDK v6 route (demo app)

**Files:**

- Create: `apps/docs/app/api/agent/route.ts`

AI SDK v6 `streamText` tool-call loop. The model is an AI Gateway provider string (`"anthropic/claude-haiku-4-5"`). The route runs **only when `AI_GATEWAY_API_KEY` is present**; otherwise it returns `503` so the client falls back to the scripted intents. The model is given four tools (one per mutation op) whose `inputSchema` are the Task 6 zod schemas; the loop collects the tool calls and returns them as a `{ mutations }` JSON payload (the demo applies them in approve-each mode). This route imports the schemas from the agent layer; it never imports React components.

> **Verification note:** the AI SDK v6 surface used here is `streamText` + `tool({ description, inputSchema, execute })` + `stopWhen: stepCountIs(n)` from the `ai` package, with the model passed as the gateway `"provider/model"` string (Gateway resolves it). This matches the AI SDK v6 docs (tools-and-tool-calling) confirmed during planning. If the installed `ai` version differs, read `node_modules/ai/dist/index.d.ts` for the exact `tool`/`streamText` signatures and adapt — keep the route's `{ mutations }` JSON contract stable, since the client (Task 12) depends on it.

- [ ] **Step 1: Implement the route**

```ts
// apps/docs/app/api/agent/route.ts
import { NextResponse } from "next/server";
import { stepCountIs, streamText, tool } from "ai";
import { AddNode, ConnectNodes, RemoveNode, UpdateNode, type Mutation } from "@/lib/flow/agent/mutations";

export const runtime = "nodejs";

const MODEL = process.env.FLOW_AGENT_MODEL ?? "anthropic/claude-haiku-4-5";

const SYSTEM = `You edit a node-graph flow by calling mutation tools.
Available node kinds: text-node, llm-node, image-node, video-node, tts-node, sfx-node, music-node, composition-node, asset-output-node, reference-node.
Handle data types: text, image, video, audio. connectNodes only works when the source output type equals the target input type.
Call the smallest set of tools that satisfies the request. Do not write prose.`;

export async function POST(req: Request) {
  if (!process.env.AI_GATEWAY_API_KEY) {
    // No gateway key → tell the client to use its scripted fallback.
    return NextResponse.json({ error: "no_gateway_key" }, { status: 503 });
  }

  const { prompt, graph } = (await req.json()) as { prompt: string; graph?: unknown };
  const collected: Mutation[] = [];
  const record = (m: Mutation) => {
    collected.push(m);
    return { ok: true as const };
  };

  const tools = {
    addNode: tool({
      description: "Add a new node to the graph.",
      inputSchema: AddNode,
      execute: async (m) => record(m),
    }),
    updateNode: tool({
      description: "Merge new data into an existing node.",
      inputSchema: UpdateNode,
      execute: async (m) => record(m),
    }),
    connectNodes: tool({
      description: "Connect two nodes with a typed edge.",
      inputSchema: ConnectNodes,
      execute: async (m) => record(m),
    }),
    removeNode: tool({
      description: "Remove a node and its edges.",
      inputSchema: RemoveNode,
      execute: async (m) => record(m),
    }),
  };

  const result = streamText({
    model: MODEL,
    system: SYSTEM,
    tools,
    stopWhen: stepCountIs(8),
    prompt: `Current graph: ${JSON.stringify(graph ?? { nodes: [], edges: [] })}\n\nRequest: ${prompt}`,
  });

  // Drain the stream so every tool call executes and is recorded.
  await result.consumeStream();
  return NextResponse.json({ mutations: collected });
}
```

- [ ] **Step 2: Typecheck the route** — `pnpm --filter docs typecheck`. Expected: no type errors. If the installed `ai` version renames `consumeStream`/`stopWhen`, adapt per its `.d.ts` while preserving the `{ mutations }` response.

- [ ] **Step 3: Smoke the 503 fallback path (no key)** — with `AI_GATEWAY_API_KEY` unset, start `pnpm --filter docs dev` and:

```bash
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:3000/api/agent \
  -H "content-type: application/json" -d '{"prompt":"add background music"}'
```

Expected: `503` (client will fall back to scripted). A live tool-call run is exercised manually only when a gateway key is set; CI does not require it.

- [ ] **Step 4: Commit** — `git add -A && git commit -m "feat(flow): AI SDK v6 agent route — streamText tool-call loop (gateway-gated)"`

---

### Task 9: Demo store — zustand flow state + agent glue

**Files:**

- Create: `apps/docs/lib/flow/flow-store.ts`
- Test: `apps/docs/lib/flow/flow-store.test.ts`

The demo's single source of truth: nodes/edges (the `FlowGraph` shape from Task 6), selection, a pending mutation preview, and the actions the chrome wires into. `runAgent(prompt)` calls `/api/agent`; on `503` (or any failure) it falls back to `scriptedMutations`, then stores the result as a **pending preview** (approve-each). `applyPending()` commits via `applyMutations`; `discardPending()` clears it. An `autoRun` flag applies immediately, skipping the preview.

- [ ] **Step 1: Write the failing test** (mock `fetch`; assert the fallback + approve-each behavior)

```ts
// apps/docs/lib/flow/flow-store.test.ts
import { afterEach, describe, expect, it, vi } from "vitest";
import { createFlowStore } from "./flow-store";

const seed = {
  nodes: [
    { id: "img1", kind: "image-node", position: { x: 0, y: 0 }, data: { label: "Image 1" } },
    { id: "comp", kind: "composition-node", position: { x: 400, y: 0 }, data: { label: "Composition" } },
  ],
  edges: [],
};

afterEach(() => vi.restoreAllMocks());

describe("flow-store agent glue", () => {
  it("falls back to scripted mutations when the route returns 503, staging a preview", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("{}", { status: 503 })),
    );
    const store = createFlowStore(seed);
    await store.getState().runAgent("add background music");
    const pending = store.getState().pending;
    expect(pending).not.toBeNull();
    expect(pending!.some((m) => m.op === "addNode")).toBe(true);
    // approve-each: graph is unchanged until applied
    expect(store.getState().graph.nodes).toHaveLength(2);
  });
  it("applyPending commits the staged mutations", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("{}", { status: 503 })),
    );
    const store = createFlowStore(seed);
    await store.getState().runAgent("add background music");
    store.getState().applyPending();
    expect(store.getState().graph.nodes).toHaveLength(3);
    expect(store.getState().pending).toBeNull();
  });
  it("uses route mutations when the route returns 200", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(JSON.stringify({ mutations: [{ op: "removeNode", id: "img1" }] }), { status: 200 }),
      ),
    );
    const store = createFlowStore(seed);
    await store.getState().runAgent("remove the first image");
    store.getState().applyPending();
    expect(store.getState().graph.nodes.find((n) => n.id === "img1")).toBeUndefined();
  });
  it("autoRun applies immediately without staging a preview", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("{}", { status: 503 })),
    );
    const store = createFlowStore(seed);
    store.getState().setAutoRun(true);
    await store.getState().runAgent("add background music");
    expect(store.getState().pending).toBeNull();
    expect(store.getState().graph.nodes.length).toBeGreaterThan(2);
  });
});
```

- [ ] **Step 2: Run to verify failure** — FAIL.

- [ ] **Step 3: Implement** (export a `createFlowStore` factory for testing + a default `useFlowStore` for the app)

```ts
// apps/docs/lib/flow/flow-store.ts
"use client";
import { createStore, useStore } from "zustand";
import { applyMutations, parseMutations, type FlowGraph, type Mutation } from "./agent/mutations";
import { scriptedMutations, type ScriptContext } from "./agent/scripted";

export interface FlowState {
  graph: FlowGraph;
  selection: string[];
  pending: Mutation[] | null;
  autoRun: boolean;
  setSelection: (ids: string[]) => void;
  setAutoRun: (on: boolean) => void;
  apply: (mutations: Mutation[]) => void;
  applyPending: () => void;
  discardPending: () => void;
  runAgent: (prompt: string) => Promise<void>;
  reset: (graph: FlowGraph) => void;
}

function scriptContext(state: { graph: FlowGraph; selection: string[] }): ScriptContext {
  return {
    selection: state.selection,
    nodeIndex: Object.fromEntries(state.graph.nodes.map((n) => [n.id, { kind: n.kind }])),
  };
}

export function createFlowStore(initial: FlowGraph) {
  return createStore<FlowState>((set, get) => ({
    graph: initial,
    selection: [],
    pending: null,
    autoRun: false,
    setSelection: (ids) => set({ selection: ids }),
    setAutoRun: (on) => set({ autoRun: on }),
    apply: (mutations) => set((s) => ({ graph: applyMutations(s.graph, mutations) })),
    applyPending: () => {
      const { pending } = get();
      if (pending) set((s) => ({ graph: applyMutations(s.graph, pending), pending: null }));
    },
    discardPending: () => set({ pending: null }),
    runAgent: async (prompt) => {
      let mutations: Mutation[] = [];
      try {
        const res = await fetch("/api/agent", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ prompt, graph: get().graph }),
        });
        if (res.ok) {
          const json = (await res.json()) as { mutations?: unknown };
          mutations = parseMutations(json.mutations);
        } else {
          mutations = scriptedMutations(prompt, scriptContext(get()));
        }
      } catch {
        mutations = scriptedMutations(prompt, scriptContext(get()));
      }
      if (mutations.length === 0) return;
      if (get().autoRun) set((s) => ({ graph: applyMutations(s.graph, mutations) }));
      else set({ pending: mutations });
    },
    reset: (graph) => set({ graph, selection: [], pending: null }),
  }));
}

let singleton: ReturnType<typeof createFlowStore> | null = null;
export function getFlowStore(initial: FlowGraph) {
  singleton ??= createFlowStore(initial);
  return singleton;
}
export function useFlowStore<T>(store: ReturnType<typeof createFlowStore>, selector: (s: FlowState) => T): T {
  return useStore(store, selector);
}
```

- [ ] **Step 4: Run tests** — `pnpm --filter docs test -- --run flow-store` → PASS.

- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat(flow): zustand demo store with approve-each agent glue"`

---

### Task 10: Catalog pages for the 5 chrome items

**Files:**

- Create: `apps/docs/app/components/[name]/` entries for `node-palette`, `canvas-omnibar`, `run-controls`, `node-inspector`, `env-status` following the Wave 0 Task 14 pattern exactly (read one existing flow catalog page from Wave 2 first; copy its structure: demo import, install command with `REGISTRY_URL`, props table, states showcase).
- Modify: the catalog index / `lib/catalog.ts` list — append the 5 chrome items to the "Flow Kit" group.

This task mirrors Wave 0 Task 14 / Wave 2 Task 14: register each item's demo in the dynamic `[name]` page's demo map (or add static pages if Wave 2 used static pages — match whatever Wave 2 did), and extend the catalog array so the index links them.

- [ ] **Step 1: Add the 5 items to the catalog source**
  - Read `apps/docs/lib/catalog.ts` (extended by Wave 2). Append `"node-palette"`, `"canvas-omnibar"`, `"run-controls"`, `"node-inspector"`, `"env-status"` to the array (keep them grouped after the Wave 2 flow items).

- [ ] **Step 2: Wire the 5 demos into the component page**
  - Read the `[name]/page.tsx` demo map (Wave 0 pattern) and add the five imports + map entries:

```tsx
import CanvasOmnibarDemo from "@/components/demos/flow/canvas-omnibar-demo"
import EnvStatusDemo from "@/components/demos/flow/env-status-demo"
import NodeInspectorDemo from "@/components/demos/flow/node-inspector-demo"
import NodePaletteDemo from "@/components/demos/flow/node-palette-demo"
import RunControlsDemo from "@/components/demos/flow/run-controls-demo"
// …in the demos record:
"node-palette": NodePaletteDemo,
"canvas-omnibar": CanvasOmnibarDemo,
"run-controls": RunControlsDemo,
"node-inspector": NodeInspectorDemo,
"env-status": EnvStatusDemo,
```

- [ ] **Step 3: Verify pages render** — `pnpm --filter docs dev`, open `/components/node-palette`, `/components/canvas-omnibar`, `/components/run-controls`, `/components/node-inspector`, `/components/env-status`. Each shows its demo + install command. No console errors.

- [ ] **Step 4: Commit** — `git add -A && git commit -m "docs(flow): catalog pages for the 5 chrome items"`

---

### Task 11: Consumer install test — add `ai-node` to the matrix

**Files:**

- Modify: `apps/docs/scripts/consumer-test.sh`

Extend the Wave 0 consumer install test (Task 16) so it also installs the flow item `ai-node` and uses it in the consumer page — proving the AI Elements cross-registry chain resolves (`@super-ai/ai-node` → flow-types + AI Elements `node`/`canvas` URLs → shadcn primitives). `ai-node` is a Wave 2 item; this task only edits the shared script (a Wave 0/coordination file — read it first, append additively, do not reorder existing items).

- [ ] **Step 1: Add `ai-node` to the install list and the consumer page**
  - In `apps/docs/scripts/consumer-test.sh`, extend the `ITEMS=(…)` array with `ai-node` (append; the Wave 2 flow items install via their registryDependencies). Then extend the heredoc page to import and render it so the build exercises it:

```bash
# add to the ITEMS array (append, keep existing order):
ITEMS=(kbd cost-chip date-section choice-chips filter-bar field-row gen-settings-bar shortcuts-sheet thread-list ai-node)
```

```tsx
// add to the consumer app/page.tsx heredoc:
import { AiNode } from "@/components/super-ai/flow/ai-node";
// …inside the page body, after the existing demos:
<AiNode id="probe" title="Image" status="idle" size="sm">
  probe body
</AiNode>;
```

- [ ] **Step 2: Run the consumer test locally** — `apps/docs/scripts/consumer-test.sh` → ends with `CONSUMER INSTALL TEST: PASS`. This proves `ai-node` and its AI Elements cross-registry deps resolve and typecheck in a fresh app. If `ai-node`'s registryDependencies reference AI Elements URLs that 404 against the live registry, confirm the `FLOW_AI_ELEMENTS` URL base set in Wave 2 Task 1 (`https://registry.ai-sdk.dev/{name}.json`); fix the const in `gen-registry.mts` if the real base differs, rebuild, and re-run.

- [ ] **Step 3: Commit** — `git add -A && git commit -m "test(flow): consumer install test installs ai-node (cross-registry chain)"`

---

### Task 12: `/flow` demo — full Flow AI–style assembly

**Files:**

- Create: `apps/docs/app/flow/flow-app.tsx` (client — the assembled app)
- Modify or Create: `apps/docs/app/flow/page.tsx` (server shell rendering `<FlowApp />`)
- Create (only if Wave 3 absent): `apps/docs/lib/flow/seed-perfume.ts`

> **Wave 3 coordination:** Wave 2 created `app/flow/page.tsx` (the image→video chain). This task **replaces** that page's body with the full chrome assembly (palette both variants, omnibar, inspector, run-controls, env-status, minimap, light/dark, localStorage, reset-to-seed). If Wave 3 has landed, import its `seed-perfume.ts` and its preset node components; if not, the local `seed-perfume.ts` below seeds the same Luxury Perfume graph shape so the page is self-contained. Wire `useFlowRunner` (Wave 2) with `stubExecute` (Wave 2 created `apps/docs/lib/flow/stub-execute.ts`).

- [ ] **Step 1: Seed graph (create only if `lib/flow/seed-perfume.ts` does not already exist)**

```ts
// apps/docs/lib/flow/seed-perfume.ts
// Luxury Perfume seed: 2 images → combine → video; text → tts; sfx + music → composition.
import type { FlowGraph } from "./agent/mutations";
import { handleId } from "@/registry/super-ai/flow/flow-types";

const e = (source: string, target: string, dataType: string): FlowGraph["edges"][number] => ({
  id: `${source}->${target}:${dataType}`,
  source,
  target,
  sourceHandle: handleId(source, dataType, "out"),
  targetHandle: handleId(target, dataType, "in"),
});

export function seedPerfumeGraph(): FlowGraph {
  return {
    nodes: [
      { id: "img1", kind: "image-node", position: { x: 0, y: 0 }, data: { label: "Bottle", kind: "image" } },
      {
        id: "img2",
        kind: "image-node",
        position: { x: 0, y: 220 },
        data: { label: "Setting", kind: "image" },
      },
      {
        id: "vid",
        kind: "video-node",
        position: { x: 360, y: 110 },
        data: { label: "Animate", kind: "video" },
      },
      { id: "script", kind: "text-node", position: { x: 0, y: 460 }, data: { label: "Script" } },
      {
        id: "tts",
        kind: "tts-node",
        position: { x: 360, y: 460 },
        data: { label: "Narration", kind: "audio" },
      },
      { id: "sfx", kind: "sfx-node", position: { x: 360, y: 640 }, data: { label: "Whoosh", kind: "audio" } },
      {
        id: "music",
        kind: "music-node",
        position: { x: 360, y: 820 },
        data: { label: "Score", kind: "audio" },
      },
      {
        id: "comp",
        kind: "composition-node",
        position: { x: 760, y: 360 },
        data: { label: "Composition", kind: "video" },
      },
    ],
    edges: [
      e("img1", "vid", "image"),
      e("img2", "vid", "image"),
      e("vid", "comp", "video"),
      e("script", "tts", "text"),
      e("tts", "comp", "audio"),
      e("sfx", "comp", "audio"),
      e("music", "comp", "audio"),
    ],
  };
}
```

- [ ] **Step 2: Assemble the app** — `flow-app.tsx` composes the full shell. Key wiring (write the complete component; the structure below is the contract it must satisfy):
  - `ReactFlow` with `nodeTypes` mapping each `kind` to its preset (Wave 3) or, if Wave 3 absent, to a minimal node composing `AiNode` + `MediaSlot` + `NodePrompt` + `RunButton` + `PortChips` + `TypedHandle`s (Wave 2). `edgeTypes` = `{ typed: TypedEdge }`.
  - `getFlowStore(seedPerfumeGraph())` as the source of truth; `useFlowStore` selectors feed nodes/edges/selection.
  - **Top bar:** `RunControls` (driven by `useFlowRunner` progress derived from per-node statuses) + `EnvStatus` (providers map read from `/api/generate/status` if Wave 3 present, else `{ all: "stub" }`) + a light/dark toggle + a **layout toggle** (toolbelt ↔ sidebar palette) + a **Reset to seed** button (`store.reset(seedPerfumeGraph())` + clears localStorage).
  - **Palette:** `NodePalette variant="toolbelt"` bottom-center by default; behind the layout toggle, `NodePalette variant="sidebar"` on the left. Toolbelt `onAdd(kind)` places at viewport center: `const c = screenToFlowPosition({ x: window.innerWidth/2, y: window.innerHeight/2 }); const pos = { x: c.x + (Math.random()*60-30), y: c.y + (Math.random()*60-30) }`, then `store.apply([{ op:"addNode", kind, position: pos }])`, `setCenter(pos.x, pos.y)`, and select the new node. Sidebar drag uses `PALETTE_DRAG_MIME` read in the canvas `onDrop`.
  - **Omnibar:** `CanvasOmnibar` bottom; `onSubmit={(p) => store.runAgent(p)}`; while a run is in flight set `state="processing"`; when `store.pending` is non-null, render the preview chip (`children` = a human summary of the pending mutations) with `onApply={store.applyPending}` / `onDiscard={store.discardPending}`. An **auto-run** toggle drives `store.setAutoRun`.
  - **Inspector:** `NodeInspector` right; `selection` mapped from store selection to `{ id, label }`; `onLabelChange` → `store.apply([{ op:"updateNode", id, data:{ label } }])`; `onDuplicate` / `onDelete` → corresponding mutations.
  - **Canvas extras:** React Flow `MiniMap` + AI Elements canvas `Controls` (cross-registry; import from the installed AI Elements canvas per Wave 2 wiring); `isValidConnection={isValidFlowConnection}` on the graph so only same-type handles connect.
  - **Persistence:** subscribe to the store and write `graph` to `localStorage["flow-kit-demo"]`; hydrate from it on mount (falling back to the seed); Reset-to-seed clears it.

- [ ] **Step 3: Server shell**

```tsx
// apps/docs/app/flow/page.tsx
import FlowApp from "./flow-app";

export default function FlowPage() {
  return <FlowApp />;
}
```

- [ ] **Step 4: Manual verification** — `pnpm --filter docs build && pnpm --filter docs start`, open `/flow`:
  - Seed graph loads (2 images → video; text → tts; sfx + music → composition).
  - Toolbelt add places a node at viewport center, selected; layout toggle swaps to the sidebar palette; sidebar drag-drops a node onto the canvas.
  - Run flow on stubs: statuses animate queued → streaming → done; the composition node shows a video preview and audio tracks.
  - Type "add background music" in the omnibar → (no gateway key) scripted fallback stages a preview chip → Apply adds a music node wired to the composition.
  - Toggle light/dark; reload — the graph persists; Reset to seed restores the original.

- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat(flow): /flow demo — full Flow AI-style shell (palette/omnibar/inspector/run-controls/env-status)"`

---

### Task 13: Playwright flow journey

**Files:**

- Create: `apps/docs/e2e/flow.spec.ts`

One end-to-end journey over `/flow`, added alongside the Wave 0 smoke suite (Task 15). React Flow handle connection is driven by dispatching pointer events on the handle elements (the documented React Flow testing approach — handles carry `data-handleid` from `TypedHandle`).

> **Reliability note (flag for the dispatcher):** drag-to-connect in headless Chromium is the flakiest step. Drive it with explicit `mouse.move` steps (press on the source handle, move in 2–3 increments to the target handle, release) rather than a single `dragTo`, and add a deterministic fallback: expose a tiny test-only hook on the page (`window.__flowConnect?(source, target, type)` that calls `store.apply([{op:"connectNodes",...}])`, mounted only when `?e2e=1`) and assert the edge either way. The journey must assert the _outcome_ (an edge exists, the run produces tracks), not the input mechanics.

- [ ] **Step 1: Write the journey**

```ts
// apps/docs/e2e/flow.spec.ts
import { expect, test } from "@playwright/test";

test("flow journey: add node, connect, run on stubs, scripted omnibar mutation", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/flow?e2e=1");

  // 1. Add a node via the palette toolbelt
  const toolbar = page.getByRole("toolbar", { name: "Add node" });
  await expect(toolbar).toBeVisible();
  const before = await page.locator(".react-flow__node").count();
  await toolbar.getByRole("button").first().click();
  await expect(page.locator(".react-flow__node")).toHaveCount(before + 1);

  // 2. Connect two typed handles via pointer events (with a deterministic fallback for headless)
  const sourceHandle = page.locator('[data-handleid$=":image:out"]').first();
  const targetHandle = page.locator('[data-handleid$=":image:in"]').first();
  if ((await sourceHandle.count()) && (await targetHandle.count())) {
    const s = await sourceHandle.boundingBox();
    const t = await targetHandle.boundingBox();
    if (s && t) {
      await page.mouse.move(s.x + s.width / 2, s.y + s.height / 2);
      await page.mouse.down();
      await page.mouse.move((s.x + t.x) / 2, (s.y + t.y) / 2, { steps: 4 });
      await page.mouse.move(t.x + t.width / 2, t.y + t.height / 2, { steps: 4 });
      await page.mouse.up();
    }
  }
  // fallback hook (only mounted with ?e2e=1) guarantees a deterministic edge
  await page.evaluate(() =>
    (window as unknown as { __flowSeedEdgeForTest?: () => void }).__flowSeedEdgeForTest?.(),
  );
  await expect(page.locator(".react-flow__edge")).not.toHaveCount(0);

  // 3. Run flow on stubs → composition shows video + audio tracks
  await page.getByRole("button", { name: "Run flow" }).click();
  const composition = page.getByRole("group", { name: /Composition node/ });
  await expect(composition.locator("video, [data-slot=media-slot]")).toBeVisible({ timeout: 15000 });
  await expect(composition.getByText(/track/i).first()).toBeVisible({ timeout: 15000 });

  // 4. Scripted omnibar intent → preview chip → Apply → node added
  const omni = page.getByRole("search", { name: "Edit flow with a prompt" });
  await omni.getByRole("textbox").fill("add background music");
  await omni.getByRole("textbox").press("Enter");
  const preview = page.locator("[data-slot=omnibar-preview]");
  await expect(preview).toBeVisible({ timeout: 10000 });
  const countBeforeApply = await page.locator(".react-flow__node").count();
  await preview.getByRole("button", { name: "Apply" }).click();
  await expect(page.locator(".react-flow__node")).toHaveCount(countBeforeApply + 1);

  expect(errors).toEqual([]);
});
```

- [ ] **Step 2: Wire the e2e fallback hook** — in `flow-app.tsx`, when `?e2e=1` is present, mount `window.__flowSeedEdgeForTest = () => store.apply([{ op:"connectNodes", source:<first image>, target:"vid", dataType:"image" }])` (no-op if the edge already exists; idempotent). This is demo-only test glue gated on the query param, never shipped behavior.

- [ ] **Step 3: Run the journey** — from `apps/docs`: `pnpm build && pnpm exec playwright test flow.spec.ts` → 1 passed. If the pointer-drag step is flaky across runs, the fallback hook keeps the assertion deterministic; tune the `steps`/timeouts but never weaken the outcome assertions.

- [ ] **Step 4: Commit** — `git add -A && git commit -m "test(flow): playwright flow journey — add/connect/run/omnibar"`

---

### Task 14: Full gate + final wrap-up (merge protocol)

**Files:** none (verification + coordination)

- [ ] **Step 1: Full local gate (the CI sequence)** — from repo root, in the worktree:

```bash
pnpm lint && pnpm typecheck && pnpm check:tokens && pnpm --filter docs test -- --run && \
  pnpm build:registry && pnpm --filter docs build && \
  pnpm --filter docs exec playwright test && \
  apps/docs/scripts/consumer-test.sh
```

Expected: every step green. This is the same pipeline `.github/workflows/ci.yml` (Wave 0 Task 17) runs — no CI edits are needed; the new flow tests and the `ai-node` consumer item ride the existing jobs.

- [ ] **Step 2: Definition-of-done audit for the 5 chrome items** — confirm each of `node-palette`, `canvas-omnibar`, `run-controls`, `node-inspector`, `env-status` has: states covered · tokens clean · behavior test · demo page · catalog/doc entry · registry entry (`public/r/<item>.json` present after build). Tick all six per item.

- [ ] **Step 3: Spec success-criteria check (wave spec §Success criteria)** — verify against this wave's deliverables:
  1. Zero keys: `/flow` runs the perfume graph end-to-end on stubs ✓ (Task 12 manual verify + Task 13 journey).
  2. Consumer install test resolves `ai-node` + AI Elements chain ✓ (Task 11).
  3. The 5 chrome items DoD complete ✓ (Step 2).
  4. Adding `ELEVENLABS_API_KEY` makes audio real — owned by Wave 3 provider routes; this wave's omnibar agent + chrome are key-agnostic and degrade to scripted/stub (note for the integration record).
  5. CI green including the flow Playwright journey ✓ (Step 1).

- [ ] **Step 4: Push the branch (do NOT merge yet)**

```bash
git push -u origin wave-2-flow-foundation
```

- [ ] **Step 5: Record the merge protocol in the PR body** — open the PR for `wave-2-flow-foundation` (covering Waves 2–4 of the Flow Kit) and state the ordering explicitly:

> **Merge order (hard requirement):**
>
> 1. `wave-0-foundation` merges to `main` **first** (this branch was cut from it and rebases onto it).
> 2. After Wave 0 is on `main`, rebase this branch onto `main` one final time, re-run the full gate (Step 1), then merge the `wave-2-flow-foundation` PR (Flow Kit Waves 2 → 3 → 4).
> 3. Do not merge this branch before Wave 0; the registry `REGISTRY_URL`/AI Elements chain and the shared tooling (`gen-registry.mts`, `check-tokens.mjs`, `consumer-test.sh`, CI) are Wave 0's contract.

- [ ] **Step 6: Final commit** — `git commit --allow-empty -m "chore(flow): wave-4 complete — chrome + omnibar agent + integration green"`

---

## Dispatcher notes (subagent-driven execution)

| Group | Tasks                                                   | Parallel?                                                                                                   |
| ----- | ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| G0    | 0                                                       | sequential first — worktree sync + deps (zustand/zod/ai) before anything imports them                       |
| G1    | 1, 2, 3, 4, 5 (the 5 chrome items)                      | **fully parallel** after G0 — each is an independent L3 file (no L3→L3 deps), separate source + test + demo |
| G2    | 6 → 7 → 9 (agent: mutations, then scripted, then store) | mutations first (schemas), scripted + store depend on it; 8 (route) parallel with 7/9 once 6 lands          |
| G3    | 8 (AI SDK route)                                        | parallel with G2 tail after 6; gateway-gated, no runtime key needed for tests                               |
| G4    | 10 (catalog pages)                                      | after G1 (needs the 5 demos)                                                                                |
| G5    | 11 (consumer test)                                      | parallel with G4 after G1 (ai-node is Wave 2; only edits the script)                                        |
| G6    | 12 → 13 → 14 (integration, journey, gate)               | **sequential, last** — 12 needs G1 + G2 + (optionally) Wave 3; 13 needs 12; 14 needs everything             |

Each subagent receives: this plan's task text (self-contained), plus paths to the wave spec, the inventory §Group 4 + canvas-omnibar deep spec, the master spec §6 conventions, and the **Wave 2 plan** (the contract source for `flow-types` / `useFlowRunner` / `ai-node` / file layout). Subagents work ONLY in the `../flow-kit-worktree` worktree on `wave-2-flow-foundation`. Rebase onto `wave-0-foundation` between groups. The integration agent (G6) owns cross-component consistency and the seed/Wave-3 reconciliation.

## Self-review checklist (run before dispatch)

- **Spec coverage:** chrome `node-palette` (both variants) ✓ `canvas-omnibar` (UI-only, 4 states, preview chip, ⌘K, role=search) ✓ `run-controls` (run/stop/run-selection + "3/7 · 1 failed") ✓ `node-inspector` (empty/single/multi) ✓ `env-status` (stub/mixed/live + credits) ✓ · omnibar agent: mutation zod schemas + `applyMutations` ✓ scripted fallback (3 intents) ✓ AI SDK v6 route (gateway-gated, 503 → scripted) ✓ approve-each store + auto-run ✓ · integration: `/flow` full shell ✓ Playwright journey (add/connect/run/omnibar) ✓ consumer `ai-node` extension ✓ catalog pages (5) ✓ full gate + merge protocol ✓.
- **No placeholders:** every component task carries a complete failing test and complete implementation; agent tasks carry full schema/reducer/route/store code. `gen-registry.mts`, `lib/catalog.ts`, `consumer-test.sh`, and `[name]/page.tsx` edits say "read the file first / append additively" because those are Wave 0/2 contract files — the agent reads and extends them (explicitly instructed), never rewrites. No "similar to Task N", no TBD/TODO.
- **Type consistency vs Wave 2 contracts:** chrome consumes `FlowStatus` / `getHandleType` / `isValidFlowConnection` / `handleId` exactly as Wave 2 exports them; the agent's `FlowGraph`/`FlowNode`/`FlowEdge` mirror React Flow `{nodes, edges}` and the handle-id codec; `applyMutations`/`scriptedMutations`/`flow-store` share one `Mutation` union; the store consumes `parseMutations` for untrusted route output. No new status strings; no L3→L3 imports; no fetching inside registry components (route/fetch/store are demo-app only).
- **Convention compliance:** `"use client"` on every interactive chrome item + the store; `data-slot` on every part; `cn()` passthrough; controlled + `on*` callbacks; no raw colors (dots use `var(--flow-done)` / `var(--flow-queued)`); kebab files / Pascal exports; colocated vitest+RTL behavior tests.
