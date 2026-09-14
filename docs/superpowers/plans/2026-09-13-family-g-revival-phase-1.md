# Family G revival, phase 1 (spine) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Land the family G spine on `main`: two `registry:lib` contracts (`flow-types`, `use-flow-runner`) and five registry components (`node-status`, `typed-handle`, `typed-edge`, `connection-hint`, `ai-node`), ported from `origin/wave-2-flow-foundation` at `b414ac9` into today's five-file contract, with D23 recorded and every CI gate green.

**Architecture:** Nothing is rebased. Each parked file is copied out of the parked branch with `git show`, then edited into the current contract (registry-relative imports, `--flow-*` tokens shipped as manifest `cssVars`, scale-only type sizes, logical properties, E5/D1/F1 composition points left as slots). `@xyflow/react` is imported by exactly two registry files, `typed-handle.tsx` and `typed-edge.tsx`; a test pins that boundary. The two shared contracts ship as `registry:lib` items so every flow component reaches them through `consumes`, the same way E5 reaches `cost`.

**Tech Stack:** Next.js docs app (`apps/docs`), Storybook 9 (`apps/storybook`), vitest + jsdom + Testing Library, Tailwind v4, shadcn registry build, `@xyflow/react` 12.x (new), pnpm workspaces, turbo.

**Spec:** `docs/superpowers/specs/2026-09-13-family-g-revival-design.md` (approved 2026-09-13). Two deviations from the spec, both recorded in Task 4's spec amendment: `use-flow-runner` and `flow-types` ship as `registry:lib` contracts rather than as a component and a `files` entry (the repo's existing mechanism for exactly this, see `lib/lib.manifest.ts`), which makes the phase 1 catalog count 116 → 121 registry items plus two lib contracts; and `PortChips` folds into `connection-hint.tsx`, not `typed-handle.tsx`, because it is plain React and folding it into the react-flow file would drag the dependency into every chip consumer.

**Not in this plan (phase 2 and 3):** `modality-node` and the `ModalityDef` registry, A7 `GenSettingsSelect`, `flow-canvas`, `node-palette`, `canvas-toolbar`, `flow-shell`, the thirteen presets, and the A2 tooltip recipe. The speech/audio resolution (spec risk 6) is decided before any preset def is written.

## Global Constraints

Copied from the spec and the repo contracts. Every task's requirements include this section.

- Five files per component, all scaffolded by `cd apps/docs && pnpm new:component <name>`, never hand-created: `registry/super-ai/<name>.tsx`, `registry/super-ai/<name>.test.tsx`, `components/demos/<name>-demo.tsx`, `content/components/<name>.docs.tsx`, `apps/storybook/src/stories/super-ai/<Pascal>.stories.tsx`.
- `apps/docs/lib/catalog.manifest.ts` is edited only in Task 4 and Task 12 (the integrator steps). Component tasks never touch it.
- `@xyflow/react` may be imported only by `registry/super-ai/typed-handle.tsx` and `registry/super-ai/typed-edge.tsx` (and their tests, demos and stories). Task 2 adds the test that enforces this.
- No raw hex, no raw `oklch()`, no Tailwind palette class, no `text-muted-foreground` with `bg-muted`/`bg-accent`/`bg-secondary` in one class string in any `registry/super-ai/**/*.tsx` (`pnpm check:tokens`, blockers TOK-1..TOK-8). Flow colours are only ever `var(--flow-<type>)`.
- No arbitrary pixel type sizes (`text-[10px]`, `text-[11px]`) in ported code; use `text-xs`. LAY-1 is review severity, and the retrofit is where it is paid.
- No `transition-all` (MOT-2). No literal `infinite` animation class in registry sources (MOT-1); the streaming dash is the named theme animation `animate-flow-dash`.
- Logical properties only: `ps-`/`pe-`/`ms-`/`me-`/`start-`/`end-`, `rounded-s-`/`rounded-e-`. Geometry that react-flow owns (`Position.Left/Right`, `style.left/top`) is exempt.
- Registry files import siblings as `@/registry/super-ai/<name>`, never `./<name>`; shadcn rewrites the alias per file target, and a relative import breaks when `lib/` and `components/super-ai/` differ.
- User-facing strings are English at the call site (D22). No labels prop.
- No story export named `Default`, `Meta` or `Story`. Every declared state has a story export with a JSDoc description. Each of the eight case stories is either written or recorded as `// case-skip: <Name> — <checkable reason>` (the gate requires the em dash on that line).
- Docs module: `whatItIs` and `whyItMatters` each at least 10 characters, at least one `do`, one `don't`, one pitfall, one `keyboard` note and one `screenReader` note. Every `anatomy[].slot` and every backticked name in prose must match a `data-slot` in the component or its composed items, or a catalog item name.
- Commit after every task with the message given. Never commit to `main`. Attribution trailer on every commit: `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.
- Run per-item checks from `apps/docs`: `pnpm vitest run registry/super-ai/<name>.test.tsx`, `pnpm typecheck`, `pnpm check:tokens`. Run the full gate list from the repo root only in Task 12.

## File structure

| File                                                                        | Responsibility                                                | Task  |
| --------------------------------------------------------------------------- | ------------------------------------------------------------- | ----- |
| `apps/docs/package.json`, `apps/storybook/package.json`, `pnpm-lock.yaml`   | add `@xyflow/react`                                           | 1     |
| `apps/docs/lib/manifest-types.ts`                                           | `css?` field on `ManifestItem`                                | 1     |
| `apps/docs/scripts/lib/registry-extras.ts` + `.test.ts`                     | thread `css` into emitted items                               | 1     |
| `apps/docs/scripts/gen-registry.mts`                                        | emit `css` for super-ai items                                 | 1     |
| `apps/docs/app/globals.css`, `apps/storybook/src/index.css`                 | `--flow-*` tokens, `--animate-flow-dash`, keyframes           | 1     |
| `apps/docs/registry/super-ai/flow-types.ts` + `.test.ts`                    | statuses, ten handle types, id codec, node sizes (lib)        | 2     |
| `apps/docs/registry/super-ai/flow-boundary.test.ts`                         | pins the react-flow import boundary                           | 2     |
| `apps/docs/registry/super-ai/use-flow-runner.ts` + `.test.ts`               | headless runner (lib)                                         | 3     |
| `apps/docs/lib/lib.manifest.ts`                                             | two new lib entries                                           | 2, 3  |
| `apps/docs/lib/catalog.manifest.ts`                                         | G entries: five `planned` then `shipped`, cut entries removed | 4, 12 |
| `docs/design-system/decisions.md`, `catalog.md`, `component-specs.md`, spec | D23, unmark, split G3, three new spec sections, arithmetic    | 4     |
| `node-status` five files                                                    | status badge + ring map                                       | 5     |
| `typed-handle` five files                                                   | typed react-flow handle                                       | 6     |
| `typed-edge` five files                                                     | typed react-flow edge                                         | 7     |
| `connection-hint` five files (+ `PortChips`)                                | drop-on-canvas mini palette, port chips                       | 8     |
| `ai-node` five files                                                        | node card shell with slots and `menuPlacement`                | 9     |
| `apps/docs/registry/super-ai/run-button.tsx`, its story                     | E5 width stability in `running`                               | 10    |
| `apps/docs/content/components/cost-chip.docs.tsx`                           | A2 wording rule                                               | 11    |
| `apps/docs/lib/demos.generated.ts`, `docs.generated.ts`, `docs/CONTINUE.md` | wiring, §1/§8 notes, gates                                    | 12    |

---

### Task 1: Dependency, tokens and the `css` registry field

**Files:**

- Modify: `apps/docs/package.json` (dependencies), `apps/storybook/package.json` (dependencies), `pnpm-lock.yaml`
- Modify: `apps/docs/lib/manifest-types.ts:34-95` (add `css?`)
- Modify: `apps/docs/scripts/lib/registry-extras.ts` (thread `css`)
- Modify: `apps/docs/scripts/lib/registry-extras.test.ts` (append one test)
- Modify: `apps/docs/scripts/gen-registry.mts:245-256` (emit `css`)
- Modify: `apps/docs/app/globals.css` (`@theme inline` block, `:root`, `.dark`)
- Modify: `apps/storybook/src/index.css` (same three blocks)

**Interfaces:**

- Produces: `ManifestItem.css?: Record<string, Record<string, string> | string>` (shadcn registry item `css`), `FLOW_CSS_VARS: CssVars` and `FLOW_CSS: Record<string, unknown>` exported from `apps/docs/lib/flow-tokens.ts` for Task 4's manifest entries; the utility class `animate-flow-dash` and the custom properties `--flow-text`, `--flow-image`, `--flow-video`, `--flow-audio`, `--flow-speech`, `--flow-sound`, `--flow-3d`, `--flow-avatar`, `--flow-start-frame`, `--flow-end-frame`, `--flow-queued`, `--flow-streaming`, `--flow-done`, `--flow-failed`.

- [ ] **Step 1: Add the dependency to both workspaces**

Run from the repo root (network required, the lockfile changes):

```bash
pnpm --filter docs add @xyflow/react@^12.11.0
pnpm --filter storybook add @xyflow/react@^12.11.0
git diff --stat pnpm-lock.yaml apps/docs/package.json apps/storybook/package.json
```

Expected: both `package.json` files gain `"@xyflow/react": "^12.x.y"` under `dependencies`; the lockfile gains the package. If the workspace filter names differ, read `name` from each `package.json` and use those.

- [ ] **Step 2: Write the failing test for `css` threading**

Append to `apps/docs/scripts/lib/registry-extras.test.ts`, inside the existing top-level `describe` (or as a new one if the file has none):

```ts
it("threads a manifest css block into the emitted extras verbatim", () => {
  const item = {
    id: "G11",
    name: "node-status",
    title: "Node Status",
    description: "x",
    family: "G",
    layer: "component",
    status: "shipped",
    wave: 6,
    base: [],
    shadcn: [],
    consumes: ["flow-types"],
    npm: [],
    states: ["idle"],
    specAnchor: "component-specs.md#g11-node-status",
    cssVars: { theme: { "animate-flow-dash": "flow-dash 1s linear infinite" } },
    css: { "@keyframes flow-dash": { to: { "stroke-dashoffset": "-20" } } },
  } as const;
  const extras = deriveExtras([item as unknown as ManifestItem], (n) => `self:${n}`);
  expect(extras["node-status"].css).toEqual({
    "@keyframes flow-dash": { to: { "stroke-dashoffset": "-20" } },
  });
  expect(extras["node-status"].cssVars).toEqual({
    theme: { "animate-flow-dash": "flow-dash 1s linear infinite" },
  });
  expect(extras["node-status"].registryDependencies).toEqual(["self:flow-types"]);
});
```

Add `import type { ManifestItem } from "../../lib/manifest-types";` at the top if the file does not already import it.

- [ ] **Step 3: Run it to verify it fails**

Run: `cd apps/docs && pnpm vitest run scripts/lib/registry-extras.test.ts`
Expected: FAIL, `css` is `undefined` (typecheck of the test may also fail on the unknown `css` key, which is the same signal).

- [ ] **Step 4: Add the `css` field and thread it**

In `apps/docs/lib/manifest-types.ts`, after the `cssVars?: CssVars;` member of `ManifestItem`, add:

```ts
  /**
   * Registry-level CSS this component's code depends on that is not a custom
   * property: today only `@keyframes` blocks. Same shape as shadcn's registry
   * item `css` field (already emitted for the marketing tier from
   * marketing.css), threaded verbatim by deriveExtras(). A `@keyframes` can't
   * be a `cssVars` entry, and a named Tailwind animation without its keyframes
   * silently renders nothing, so an item that ships `--animate-*` in
   * `cssVars.theme` ships its keyframes here.
   */
  css?: Record<string, Record<string, string> | string>;
```

In `apps/docs/scripts/lib/registry-extras.ts`:

```ts
import type { CssVars, ManifestItem } from "../../lib/manifest-types";

export type Extras = Record<
  string,
  {
    dependencies?: string[];
    registryDependencies?: string[];
    cssVars?: CssVars;
    css?: ManifestItem["css"];
  }
>;

export function deriveExtras(items: ManifestItem[], self: (name: string) => string): Extras {
  const extras: Extras = {};

  for (const item of items) {
    if (item.status !== "shipped") continue;

    const registryDependencies = [...item.shadcn, ...(item.external ?? []), ...item.consumes.map(self)];
    const entry: Extras[string] = {};
    if (registryDependencies.length) entry.registryDependencies = registryDependencies;
    if (item.npm.length) entry.dependencies = item.npm;
    if (item.cssVars) entry.cssVars = item.cssVars;
    if (item.css) entry.css = item.css;
    if (Object.keys(entry).length) extras[item.name] = entry;
  }

  return extras;
}
```

In `apps/docs/scripts/gen-registry.mts`, extend the `Item` type and the `superAiItems` map:

```ts
type Item = {
  name: string;
  title: string;
  description: string;
  type?: "registry:component" | "registry:hook" | "registry:lib" | "registry:block";
  registryDependencies?: string[];
  dependencies?: string[];
  cssVars?: CssVars;
  css?: Record<string, Record<string, string> | string>;
};
```

and in `superAiItems`, after the `cssVars` spread:

```ts
  ...(i.cssVars ? { cssVars: i.cssVars } : {}),
  ...(i.css ? { css: i.css } : {}),
```

- [ ] **Step 5: Run the test to verify it passes, then typecheck**

Run: `cd apps/docs && pnpm vitest run scripts/lib/registry-extras.test.ts && pnpm typecheck`
Expected: PASS, typecheck clean.

- [ ] **Step 6: Create the token module the manifest will import**

Create `apps/docs/lib/flow-tokens.ts`:

```ts
import type { CssVars } from "./manifest-types";

/**
 * Family G colour and motion tokens, shipped to consumers as registry cssVars
 * (the same mechanism as WARNING_CSS_VARS in catalog.manifest.ts) so `npx
 * shadcn add typed-handle` installs the scale alongside the code. Values are
 * defined once here, mirrored by hand into app/globals.css and the Storybook
 * index.css (Task 1 step 7), and asserted equal by flow-types.test.ts.
 *
 * Grouping, from the FilmMaker port vocabulary (spec, Contracts): neutral for
 * text, blue for visual media, purple for anything audible, tan for identity
 * and geometry. Status colours reuse the type scale where the meaning matches
 * (streaming = image blue, done = a green not otherwise in the system).
 */
export const FLOW_CSS_VARS: CssVars = {
  theme: {
    "animate-flow-dash": "flow-dash 1s linear infinite",
  },
  light: {
    "flow-text": "var(--muted-foreground)",
    "flow-image": "oklch(0.62 0.19 259.8)",
    "flow-video": "oklch(0.61 0.22 292.7)",
    "flow-start-frame": "oklch(0.62 0.19 259.8)",
    "flow-end-frame": "oklch(0.62 0.19 259.8)",
    "flow-audio": "oklch(0.65 0.24 354.3)",
    "flow-speech": "oklch(0.65 0.24 354.3)",
    "flow-sound": "oklch(0.65 0.24 354.3)",
    "flow-3d": "oklch(0.7 0.1 70)",
    "flow-avatar": "oklch(0.7 0.1 70)",
    "flow-queued": "var(--muted-foreground)",
    "flow-streaming": "oklch(0.62 0.19 259.8)",
    "flow-done": "oklch(0.72 0.17 162.5)",
    "flow-failed": "var(--destructive)",
  },
  dark: {
    "flow-image": "oklch(0.71 0.16 259.8)",
    "flow-video": "oklch(0.71 0.18 292.7)",
    "flow-start-frame": "oklch(0.71 0.16 259.8)",
    "flow-end-frame": "oklch(0.71 0.16 259.8)",
    "flow-audio": "oklch(0.73 0.19 354.3)",
    "flow-speech": "oklch(0.73 0.19 354.3)",
    "flow-sound": "oklch(0.73 0.19 354.3)",
    "flow-3d": "oklch(0.78 0.09 72)",
    "flow-avatar": "oklch(0.78 0.09 72)",
    "flow-streaming": "oklch(0.71 0.16 259.8)",
    "flow-done": "oklch(0.77 0.15 162.5)",
  },
};

/** The one keyframe the family needs: the streaming edge dash. */
export const FLOW_CSS = {
  "@keyframes flow-dash": { to: { "stroke-dashoffset": "-20" } },
} as const;
```

- [ ] **Step 7: Mirror the tokens into both stylesheets**

In `apps/docs/app/globals.css`, inside the existing `@theme inline { … }` block, after the `--color-warning-foreground` line, add:

```css
--animate-flow-dash: flow-dash 1s linear infinite;
@keyframes flow-dash {
  to {
    stroke-dashoffset: -20;
  }
}
```

In the `:root { … }` block, after `--warning-foreground`, add:

```css
/* Family G. Port and edge colours keyed by data type, and the four status
     colours node-status paints. Consumers get these as registry cssVars
     (lib/flow-tokens.ts); this copy is for the docs app itself. */
--flow-text: var(--muted-foreground);
--flow-image: oklch(0.62 0.19 259.8);
--flow-video: oklch(0.61 0.22 292.7);
--flow-start-frame: oklch(0.62 0.19 259.8);
--flow-end-frame: oklch(0.62 0.19 259.8);
--flow-audio: oklch(0.65 0.24 354.3);
--flow-speech: oklch(0.65 0.24 354.3);
--flow-sound: oklch(0.65 0.24 354.3);
--flow-3d: oklch(0.7 0.1 70);
--flow-avatar: oklch(0.7 0.1 70);
--flow-queued: var(--muted-foreground);
--flow-streaming: oklch(0.62 0.19 259.8);
--flow-done: oklch(0.72 0.17 162.5);
--flow-failed: var(--destructive);
```

In the `.dark { … }` block, after `--warning-foreground`, add:

```css
--flow-image: oklch(0.71 0.16 259.8);
--flow-video: oklch(0.71 0.18 292.7);
--flow-start-frame: oklch(0.71 0.16 259.8);
--flow-end-frame: oklch(0.71 0.16 259.8);
--flow-audio: oklch(0.73 0.19 354.3);
--flow-speech: oklch(0.73 0.19 354.3);
--flow-sound: oklch(0.73 0.19 354.3);
--flow-3d: oklch(0.78 0.09 72);
--flow-avatar: oklch(0.78 0.09 72);
--flow-streaming: oklch(0.71 0.16 259.8);
--flow-done: oklch(0.77 0.15 162.5);
```

Make the identical three additions in `apps/storybook/src/index.css` (it carries its own `@theme inline`, `:root` and `.dark` blocks; find them with `grep -n "@theme inline\|^:root\|^\.dark" apps/storybook/src/index.css`).

- [ ] **Step 8: Verify the stylesheets still build and the gates are unaffected**

Run from the repo root: `pnpm --filter docs typecheck && pnpm --filter docs lint && cd apps/docs && pnpm check:tokens`
Expected: all clean. `check:tokens` scans `registry/super-ai/**/*.tsx` only; the `oklch()` literals above live in `lib/` and CSS and are outside its scope, the same as `WARNING_CSS_VARS`.

- [ ] **Step 9: Commit**

```bash
git add apps/docs/package.json apps/storybook/package.json pnpm-lock.yaml apps/docs/lib/manifest-types.ts apps/docs/lib/flow-tokens.ts apps/docs/scripts/lib/registry-extras.ts apps/docs/scripts/lib/registry-extras.test.ts apps/docs/scripts/gen-registry.mts apps/docs/app/globals.css apps/storybook/src/index.css
git commit -m "feat(flow): add @xyflow/react, the --flow-* token scale, and a css registry field

Family G phase 1, task 1. Tokens ship to consumers as cssVars plus a
@keyframes block through a new ManifestItem.css field, threaded by
deriveExtras and emitted by gen-registry the way the marketing tier
already emits css.

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

### Task 2: `flow-types` lib contract and the dependency-boundary test

**Files:**

- Create: `apps/docs/registry/super-ai/flow-types.tsx` (from parked `registry/super-ai/flow/flow-types.ts`)
- Create: `apps/docs/registry/super-ai/flow-types.test.tsx` (from parked `flow-types.test.ts`)
- Create: `apps/docs/registry/super-ai/flow-boundary.test.ts`
- Modify: `apps/docs/lib/lib.manifest.ts` (append one entry)

**Interfaces:**

- Produces (imported by every later task as `@/registry/super-ai/flow-types`): `FLOW_STATUSES`, `type FlowStatus = "idle" | "queued" | "streaming" | "done" | "failed" | "locked"`, `FLOW_HANDLE_TYPES` (the ten keys), `type HandleTypeKey`, `interface HandleTypeDef { label: string; cssVar: \`--flow-${string}\` }`, `registerHandleType(key, def)`, `getHandleType(key)`, `handleTypeKeys()`, `handleId(nodeId, dataType, dir)`, `parseHandleId(id)`, `isValidFlowConnection({ sourceHandle, targetHandle })`, `type NodeSize = "sm" | "md" | "lg"`, `NODE_WIDTH`.

- [ ] **Step 1: Copy the parked file and its test**

```bash
cd apps/docs
git show origin/wave-2-flow-foundation:apps/docs/registry/super-ai/flow/flow-types.ts > registry/super-ai/flow-types.tsx
git show origin/wave-2-flow-foundation:apps/docs/registry/super-ai/flow/flow-types.test.ts > registry/super-ai/flow-types.test.tsx
```

- [ ] **Step 2: Extend the test to the ten-type vocabulary and the token mirror**

In `flow-types.test.tsx`, replace the first `it("ships the four built-in types", …)` block with:

```ts
it("ships the ten built-in types, each with a --flow-* token", () => {
  expect(FLOW_HANDLE_TYPES).toEqual([
    "text",
    "image",
    "video",
    "audio",
    "speech",
    "sound",
    "3d",
    "avatar",
    "start-frame",
    "end-frame",
  ]);
  for (const t of FLOW_HANDLE_TYPES) expect(getHandleType(t)?.cssVar).toBe(`--flow-${t}`);
  expect(getHandleType("3d")?.label).toBe("3D");
  expect(getHandleType("start-frame")?.label).toBe("Start frame");
});
it("every built-in type has a light token in lib/flow-tokens.ts", () => {
  for (const t of FLOW_HANDLE_TYPES) expect(FLOW_CSS_VARS.light).toHaveProperty(`flow-${t}`);
});
it("accepts a key that starts with a digit (3d) without warning", () => {
  const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
  registerHandleType("3d", { label: "3D" });
  expect(warn).not.toHaveBeenCalled();
  warn.mockRestore();
});
```

and change the imports at the top of the test to:

```ts
import { describe, expect, it, vi } from "vitest";
import { FLOW_CSS_VARS } from "@/lib/flow-tokens";
import {
  FLOW_HANDLE_TYPES,
  FLOW_STATUSES,
  getHandleType,
  handleId,
  isValidFlowConnection,
  parseHandleId,
  registerHandleType,
  type FlowStatus,
} from "@/registry/super-ai/flow-types";
```

- [ ] **Step 3: Run it to verify it fails**

Run: `cd apps/docs && pnpm vitest run registry/super-ai/flow-types.test.tsx`
Expected: FAIL, `FLOW_HANDLE_TYPES` is not exported and six of the ten types are unregistered.

- [ ] **Step 4: Edit `flow-types.tsx` to the contract**

Replace the file header comment and the registry block. The final file:

```ts
// Family G shared contracts: status vocabulary, handle-type registry, handle-id
// codec, node sizes. Ships as a registry:lib (lib/flow-types) so every flow
// component reaches one copy through `consumes`.
//
// Status vocabulary is the master state contract; no component adds a state.

export const FLOW_STATUSES = ["idle", "queued", "streaming", "done", "failed", "locked"] as const;
export type FlowStatus = (typeof FLOW_STATUSES)[number];

export interface HandleTypeDef {
  label: string;
  /** CSS custom property carrying the type colour; shipped as registry cssVars (lib/flow-tokens.ts). */
  cssVar: `--flow-${string}`;
}

/**
 * The ten built-in data types (spec, Contracts). Grouping: neutral for text,
 * blue for visual media, purple for anything audible, tan for identity and
 * geometry. The colours live in the token scale, never here.
 */
export const FLOW_HANDLE_TYPES = [
  "text",
  "image",
  "video",
  "audio",
  "speech",
  "sound",
  "3d",
  "avatar",
  "start-frame",
  "end-frame",
] as const;
export type HandleTypeKey = (typeof FLOW_HANDLE_TYPES)[number];

const BUILT_IN_LABELS: Record<HandleTypeKey, string> = {
  text: "Text",
  image: "Image",
  video: "Video",
  audio: "Audio",
  speech: "Speech",
  sound: "Sound",
  "3d": "3D",
  avatar: "Avatar",
  "start-frame": "Start frame",
  "end-frame": "End frame",
};

const registry = new Map<string, HandleTypeDef>(
  FLOW_HANDLE_TYPES.map((k) => [k, { label: BUILT_IN_LABELS[k], cssVar: `--flow-${k}` }]),
);

/**
 * Register a custom handle type.
 *
 * `key` must match `/^[a-z0-9][a-z0-9-]*$/`:
 *   - No colons; they would break the handle-id codec (`{nodeId}:{dataType}:{dir}`).
 *   - No spaces; they would break the CSS custom-property name (`--flow-{key}`).
 *   - A leading digit is fine (`3d` is built in): custom-property names may start with one.
 *
 * Call at module scope (not inside a React effect) so server and client render identically.
 * Re-registering an existing key overwrites its definition.
 */
export function registerHandleType(key: string, def: Partial<HandleTypeDef> & { label: string }) {
  if (process.env.NODE_ENV !== "production" && !/^[a-z0-9][a-z0-9-]*$/.test(key)) {
    console.warn(`registerHandleType: invalid key "${key}", use lowercase letters, digits, hyphens`);
  }
  registry.set(key, { label: def.label, cssVar: def.cssVar ?? `--flow-${key}` });
}
export const getHandleType = (key: string) => registry.get(key);
export const handleTypeKeys = () => [...registry.keys()];

/** Handle id codec: `{nodeId}:{dataType}:{in|out}`. */
export function handleId(nodeId: string, dataType: string, dir: "in" | "out") {
  return `${nodeId}:${dataType}:${dir}`;
}
export function parseHandleId(id: string | null | undefined) {
  if (!id) return null;
  const parts = id.split(":");
  if (parts.length < 3) return null;
  const dir = parts.pop()!;
  const dataType = parts.pop()!;
  const nodeId = parts.join(":");
  if (!nodeId || !dataType || (dir !== "in" && dir !== "out")) return null;
  return { nodeId, dataType, dir } as { nodeId: string; dataType: string; dir: "in" | "out" };
}
/** Strict: same data type, out → in. The spec's risk 6 keeps this a pure string compare. */
export function isValidFlowConnection(c: { sourceHandle?: string | null; targetHandle?: string | null }) {
  const s = parseHandleId(c.sourceHandle);
  const t = parseHandleId(c.targetHandle);
  return !!s && !!t && s.dir === "out" && t.dir === "in" && s.dataType === t.dataType;
}

export type NodeSize = "sm" | "md" | "lg";
export const NODE_WIDTH: Record<NodeSize, number> = { sm: 280, md: 320, lg: 420 };
```

The parked test `rejects malformed and trailing-segment ids` asserts `parseHandleId("a:b:in:extra")` is `null`; with the codec above `"a:b:in:extra"` parses as dir `extra`, which is rejected. Keep the test as is.

- [ ] **Step 5: Run the tests to verify they pass**

Run: `cd apps/docs && pnpm vitest run registry/super-ai/flow-types.test.tsx`
Expected: PASS, 10 tests.

- [ ] **Step 6: Write the boundary test**

Create `apps/docs/registry/super-ai/flow-boundary.test.ts`:

```ts
// D23: @xyflow/react is confined to the two react-flow bindings. Every other
// family G file is plain React so it installs without the dependency. This
// test is the boundary; a new import elsewhere fails here before it fails a
// consumer.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const DIR = fileURLToPath(new URL(".", import.meta.url));
const ALLOWED = new Set(["typed-handle.tsx", "typed-edge.tsx"]);

describe("family G dependency boundary", () => {
  it("only typed-handle and typed-edge import @xyflow/react", () => {
    const offenders = readdirSync(DIR)
      .filter((f) => f.endsWith(".tsx") && !f.endsWith(".test.tsx") && !ALLOWED.has(f))
      .filter((f) => /from\s+["']@xyflow\/react/.test(readFileSync(join(DIR, f), "utf8")));
    expect(offenders).toEqual([]);
  });
});
```

Run: `cd apps/docs && pnpm vitest run registry/super-ai/flow-boundary.test.ts`
Expected: PASS (nothing imports it yet).

- [ ] **Step 7: Add the lib manifest entry**

In `apps/docs/lib/lib.manifest.ts`, append to `LIB_MANIFEST`:

```ts
  {
    name: "flow-types",
    title: "Flow contracts",
    description:
      "Family G's shared vocabulary: the six-status contract, the ten typed-port keys, the handle-id codec that decides which ports connect, and the three node widths.",
    status: "shipped",
    shadcn: [],
    npm: [],
    target: "lib/flow-types.ts",
  },
```

- [ ] **Step 8: Typecheck and contract-check**

Run: `cd apps/docs && pnpm typecheck && pnpm check:contract`
Expected: typecheck clean; `check:contract` reports no error for `flow-types` (the lib branch checks only that the file exists). Any pre-existing catalog error is out of scope here and is resolved in Task 4.

- [ ] **Step 9: Commit**

```bash
git add apps/docs/registry/super-ai/flow-types.tsx apps/docs/registry/super-ai/flow-types.test.tsx apps/docs/registry/super-ai/flow-boundary.test.ts apps/docs/lib/lib.manifest.ts
git commit -m "feat(flow): flow-types lib contract with ten typed ports, plus the react-flow boundary test

Ported from wave-2-flow-foundation b414ac9. Adds speech, sound, 3d,
avatar, start-frame and end-frame from the FilmMaker vocabulary; keeps
the codec a strict string compare (spec risk 6, option a).

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 3: `use-flow-runner` lib contract

**Files:**

- Create: `apps/docs/registry/super-ai/use-flow-runner.tsx` (from parked `flow/use-flow-runner.ts`)
- Create: `apps/docs/registry/super-ai/use-flow-runner.test.tsx` (from parked `flow/use-flow-runner.test.ts`)
- Modify: `apps/docs/lib/lib.manifest.ts` (append one entry)

**Interfaces:**

- Consumes: `FlowStatus` from Task 2.
- Produces: `useFlowRunner({ nodes, edges, execute, onStatus })` returning `{ statuses, errors, outputs, run, runNode, runFrom, runSelection, stop, markDirty, reset }`; types `RunnerNode`, `RunnerEdge`, `NodeOutput`, `UseFlowRunnerOptions`.

- [ ] **Step 1: Copy the parked hook and its test**

```bash
cd apps/docs
git show origin/wave-2-flow-foundation:apps/docs/registry/super-ai/flow/use-flow-runner.ts > registry/super-ai/use-flow-runner.tsx
git show origin/wave-2-flow-foundation:apps/docs/registry/super-ai/flow/use-flow-runner.test.ts > registry/super-ai/use-flow-runner.test.tsx
```

- [ ] **Step 2: Point the test at the registry path**

In `use-flow-runner.test.tsx`, change the import line to:

```ts
import { useFlowRunner, type NodeOutput, type RunnerNode } from "@/registry/super-ai/use-flow-runner";
```

- [ ] **Step 3: Run it to verify it fails**

Run: `cd apps/docs && pnpm vitest run registry/super-ai/use-flow-runner.test.tsx`
Expected: FAIL, the hook file still imports `./flow-types`, which does not exist at that path.

- [ ] **Step 4: Edit the hook's imports**

In `use-flow-runner.tsx`, replace line 3:

```ts
import type { FlowStatus } from "./flow-types";
```

with

```ts
import type { FlowStatus } from "@/registry/super-ai/flow-types";
```

Nothing else in the file changes; the abort hygiene, content-hash cache, cycle detection and scoped runs are the behaviour the spec ports verbatim.

- [ ] **Step 5: Run the tests to verify they pass**

Run: `cd apps/docs && pnpm vitest run registry/super-ai/use-flow-runner.test.tsx`
Expected: PASS, 9 tests, including `stop() mid-chain resets queued downstream to idle and discards the late result` and `re-runs downstream when upstream output content changes`.

- [ ] **Step 6: Add the lib manifest entry**

Append to `LIB_MANIFEST` in `apps/docs/lib/lib.manifest.ts`:

```ts
  {
    name: "use-flow-runner",
    title: "Flow runner",
    description:
      "Headless topological executor for a typed node graph: per-node status, a content-hash cache, cancellation, cycle detection and scoped runs. Executor-swappable; ships no UI.",
    status: "shipped",
    shadcn: [],
    npm: [],
    target: "lib/use-flow-runner.ts",
  },
```

- [ ] **Step 7: Typecheck and commit**

Run: `cd apps/docs && pnpm typecheck && pnpm lint`
Expected: clean.

```bash
git add apps/docs/registry/super-ai/use-flow-runner.tsx apps/docs/registry/super-ai/use-flow-runner.test.tsx apps/docs/lib/lib.manifest.ts
git commit -m "feat(flow): use-flow-runner lib contract, ported with its nine tests

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 4: Integrator prep: manifest, D23, catalog, specs, scaffolds

This task is the integrator's (CONTINUE.md §3.2 and §3.3). It edits the one shared file and the rule book, then scaffolds the five components so Tasks 5 to 9 only fill files.

**Files:**

- Modify: `apps/docs/lib/catalog.manifest.ts` (family G block, around line 872)
- Modify: `docs/design-system/decisions.md` (append D23 after D22)
- Modify: `docs/design-system/catalog.md:3`, `:107-111`, `:280`, `:289`, `:291`
- Modify: `docs/design-system/component-specs.md:636-750`
- Modify: `docs/superpowers/specs/2026-09-13-family-g-revival-design.md` (two amendments)
- Create (by scaffolder): the 25 files for `node-status`, `typed-handle`, `typed-edge`, `connection-hint`, `ai-node`

**Interfaces:**

- Produces: manifest entries with these exact `states` (later tasks' story exports are derived from them with `statePascal`): `node-status` → `idle · queued · streaming · done · failed · locked · compact`; `typed-handle` → `input · output · stacked · compatible · unregistered-type`; `typed-edge` → `type-coloured · selected · streaming`; `connection-hint` → `with-matches · no-matches · chips`; `ai-node` → `idle · queued · streaming · done · failed · locked · selected · menu-floating`.

- [ ] **Step 1: Rewrite the family G block in the manifest**

Open `apps/docs/lib/catalog.manifest.ts`. Add at the top, after the `manifest-types` import:

```ts
import { FLOW_CSS, FLOW_CSS_VARS } from "./flow-tokens";
```

Replace the entries for `G1` through `G9` and the `G-useFlowRunner` entry (find them with `grep -n 'family: "G"' lib/catalog.manifest.ts`) with this block, in this order:

```ts
  // Family G, revived by D23 (2026-09-13). Phase 1 ships the spine; G1, G7 and
  // G8 are phase 2 (planned); G4, G5, G6 and G9 dissolved into D1, F1, A7 and
  // I2 and stay cut as a record. useFlowRunner and flow-types are
  // registry:lib contracts in lib.manifest.ts, not catalog items.
  {
    id: "G1",
    name: "flow-canvas",
    title: "Flow Canvas",
    description: "Pan/zoom node surface: the react-flow adapter with typed nodes and edges registered.",
    family: "G",
    layer: "component",
    status: "planned",
    wave: 7,
    base: [],
    shadcn: [],
    consumes: [],
    npm: [],
    states: ["empty", "populated", "selecting", "connecting", "running"],
    specAnchor: "component-specs.md#g1-flow-canvas",
  },
  {
    id: "G2",
    name: "ai-node",
    title: "AI Node",
    description: "One node card: header with status, media and body slots, a footer or floating settings menu, and the locked and failed states.",
    family: "G",
    layer: "component",
    status: "building",
    wave: 6,
    base: ["card"],
    shadcn: [],
    consumes: ["flow-types", "node-status"],
    npm: ["lucide-react"],
    states: ["idle", "queued", "streaming", "done", "failed", "locked", "selected", "menu-floating"],
    specAnchor: "component-specs.md#g2-ai-node",
    cssVars: FLOW_CSS_VARS,
  },
  {
    id: "G3",
    name: "typed-handle",
    title: "Typed Handle",
    description: "A react-flow port that encodes its data type in the handle id, paints the type colour, and refuses connections of another type.",
    family: "G",
    layer: "component",
    status: "building",
    wave: 6,
    base: [],
    shadcn: [],
    consumes: ["flow-types"],
    npm: ["@xyflow/react"],
    states: ["input", "output", "stacked", "compatible", "unregistered-type"],
    specAnchor: "component-specs.md#g3-typed-handle",
    cssVars: FLOW_CSS_VARS,
  },
  {
    id: "G4",
    name: "node-prompt",
    title: "Node Prompt",
    description: "Dissolved by D23 into D1 media-prompt-bar, presentation node-embedded.",
    family: "G",
    layer: "component",
    status: "cut",
    wave: 5,
    base: ["textarea"],
    shadcn: [],
    consumes: [],
    npm: [],
    states: [],
    specAnchor: "component-specs.md#g4-node-prompt",
  },
  {
    id: "G5",
    name: "node-result",
    title: "Node Result",
    description: "Dissolved by D23 into F1 result-card.",
    family: "G",
    layer: "component",
    status: "cut",
    wave: 5,
    base: [],
    shadcn: [],
    consumes: [],
    npm: [],
    states: [],
    specAnchor: "component-specs.md#g5-node-result-new",
  },
  {
    id: "G6",
    name: "model-bar",
    title: "Model Bar",
    description: "Dissolved by D23 into A7 gen-settings-bar and model-picker.",
    family: "G",
    layer: "component",
    status: "cut",
    wave: 5,
    base: ["button-group"],
    shadcn: [],
    consumes: [],
    npm: [],
    states: [],
    specAnchor: "component-specs.md#g6-model-bar",
  },
  {
    id: "G7",
    name: "node-palette",
    title: "Node Palette",
    description: "Add-node catalog: grouped, searchable, as a popover or a docked rail, reading the modality registry.",
    family: "G",
    layer: "component",
    status: "planned",
    wave: 7,
    base: ["command", "popover"],
    shadcn: [],
    consumes: [],
    npm: [],
    states: ["grouped", "searchable", "popover", "docked-rail", "drag-to-canvas", "insert-on-edge"],
    specAnchor: "component-specs.md#g7-node-palette",
  },
  {
    id: "G8",
    name: "canvas-toolbar",
    title: "Canvas Toolbar",
    description: "Floating tool dock and view controls for the canvas; controlled, no react-flow import.",
    family: "G",
    layer: "component",
    status: "planned",
    wave: 7,
    base: ["button-group"],
    shadcn: [],
    consumes: [],
    npm: [],
    states: ["select", "pan", "comment", "add-by-type", "zoom", "fit", "undo-redo"],
    specAnchor: "component-specs.md#g8-canvas-toolbar-new",
  },
  {
    id: "G9",
    name: "node-inspector",
    title: "Node Inspector",
    description: "Dissolved by D23 into I2 property-inspector.",
    family: "G",
    layer: "component",
    status: "cut",
    wave: 5,
    base: [],
    shadcn: [],
    consumes: [],
    npm: [],
    states: [],
    specAnchor: "component-specs.md#g9-node-inspector",
  },
  {
    id: "G10",
    name: "typed-edge",
    title: "Typed Edge",
    description: "A react-flow edge whose stroke colour derives from its source port's type, thicker when selected, dashed and moving while streaming.",
    family: "G",
    layer: "component",
    status: "building",
    wave: 6,
    base: [],
    shadcn: [],
    consumes: ["flow-types"],
    npm: ["@xyflow/react"],
    states: ["type-coloured", "selected", "streaming"],
    specAnchor: "component-specs.md#g10-typed-edge",
    cssVars: FLOW_CSS_VARS,
    css: FLOW_CSS,
  },
  {
    id: "G11",
    name: "node-status",
    title: "Node Status",
    description: "The badge and ring map for the six-status contract: a dot or spinner, a label, and the class a node card paints for each status.",
    family: "G",
    layer: "component",
    status: "building",
    wave: 6,
    base: [],
    shadcn: [],
    consumes: ["flow-types"],
    npm: ["lucide-react"],
    states: ["idle", "queued", "streaming", "done", "failed", "locked", "compact"],
    specAnchor: "component-specs.md#g11-node-status",
    cssVars: FLOW_CSS_VARS,
  },
  {
    id: "G12",
    name: "connection-hint",
    title: "Connection Hint",
    description: "The mini palette shown when a connection is dropped on empty canvas, and the port chips that list what a node accepts and emits.",
    family: "G",
    layer: "component",
    status: "building",
    wave: 6,
    base: [],
    shadcn: [],
    consumes: ["flow-types"],
    npm: [],
    states: ["with-matches", "no-matches", "chips"],
    specAnchor: "component-specs.md#g12-connection-hint",
    cssVars: FLOW_CSS_VARS,
  },
```

Then find the `O5` entry (`grep -n 'name: "flow-shell"'`) and change its `status` from `"cut"` to `"planned"`, its `wave` to `7`, and its `description` to `"The node builder screen: flow-canvas, node-palette, property-inspector and canvas-toolbar composed."`.

- [ ] **Step 2: Append D23 to decisions.md**

Find the D22 section (`grep -n "^### D22" docs/design-system/decisions.md`) and the next heading after it that does not start with `### D` (`awk 'NR>N && /^#{2,3} / && !/^### D/ {print NR": "$0; exit}' docs/design-system/decisions.md`, with `N` the D22 line). Insert this block immediately before that heading:

```markdown
### D23 · Family G revived, six items dissolved — 2026-09-13

Reverses D9. The node builder ships. Starting point, as D9 instructed:
`wave-2-flow-foundation` at `b414ac9`, ported file by file into fresh scaffolds,
never rebased. Design: `docs/superpowers/specs/2026-09-13-family-g-revival-design.md`.

Six G items do not return because shipped components now own their ground:
`run-button` → E5, G4 `node-prompt` → D1 (`node-embedded`), G6 `model-bar` → A7 +
`model-picker`, G5 `node-result` → F1, G9 `node-inspector` → I2, and the FilmMaker
`CostTooltip` → A2. F3 (model-bar vs gen-settings-bar drift) is retired for good.

The catalog's family G consolidation ("the spec's 10 modality node presets become
demo recipes on G2, not registry items") is reversed. Thirteen modality presets
ship as registry items in phase 3, each a `ModalityDef` record over one
`modality-node` implementation.

`@xyflow/react` is confined to `typed-handle`, `typed-edge` and `flow-canvas`
(`registry/super-ai/flow-boundary.test.ts`). `flow-types` and `use-flow-runner`
ship as `registry:lib` contracts, the mechanism `cost` already uses, so they are
not catalog items and every flow component reaches them through `consumes`.

Phase 1 (this record) restores the family to scope at **8 G items + O5**: five
shipped (`ai-node`, `typed-handle`, `typed-edge`, `node-status`, `connection-hint`),
three planned for phase 2 (`flow-canvas`, `node-palette`, `canvas-toolbar`) plus
`flow-shell`. Catalog 116 → 125 in scope. Provenance from D9 stands: some G designs
are Helene's; the FilmMaker PR #6 surface work is Helen's; the parked engine is this
repo's own.
```

- [ ] **Step 3: Update catalog.md**

Line 3: replace the bold opener with

```markdown
**123 active items: 12 primitives · 97 components · 14 blocks.** Family G (canvas & nodes) and
O5 `flow-shell` were cut 2026-07-31 (D9) and **revived 2026-09-13** (D23): five G items shipped in
phase 1, three planned, four dissolved into shipped components, and `useFlowRunner` reshaped as a
`registry:lib` contract. Eight components
```

(keep the rest of that paragraph as it is, so it continues "were **restored 2026-08-02** (D12) …").

Lines 107 to 111: replace the G section header and blockquote with

```markdown
## G · Canvas & nodes — REVIVED 2026-09-13

> Cut 2026-07-31 ([decisions.md](decisions.md) D9), revived by D23. G4, G5, G6 and G9 are
> **dissolved** into D1, F1, A7 and I2 and stay in the table as a record. G10 to G12 were built in
> wave 2 and named here for the first time. `useFlowRunner` ships as a `registry:lib` contract.
> Some of the designs are Helene's; provenance is recorded in D9 and D23.
```

In the existing G table, replace the `G3` row with the first line below and append the other three rows after `G9`:

```markdown
| G3 | `typed-handle` | A port | input · output · stacked · compatible · unregistered-type | — (react-flow) |
| G10 | `typed-edge` `NEW` | The line between ports | type-coloured · selected · streaming | — (react-flow) |
| G11 | `node-status` `NEW` | Status badge and ring map | idle · queued · streaming · done · failed · locked · compact | — |
| G12 | `connection-hint` `NEW` | Drop-on-canvas mini palette, port chips | with-matches · no-matches · chips | — |
```

Delete the line `**Consolidation:** the spec's 10 modality node presets become demo recipes on G2, not registry items.` and replace it with `**Consolidation reversed (D23):** the modality presets ship as registry items in phase 3.`

Line 280 (the totals G row): replace with

```markdown
| G — Canvas & nodes | 8 (5 shipped + 3 planned; ~~0 · cut (D9)~~ revived D23) |
```

Line 289: `| O — Blocks (L4)                     | 14 (O5 restored by D23)                                              |`

Line 291: `| **Total registry items**            | **125** (116 before D23, 113 after D16, 107 before it, 99 before D12, 110 before D9) |`

- [ ] **Step 4: Update component-specs.md**

Replace lines 638 to 639 (the CUT banner under `# G · Canvas & nodes`) with:

```markdown
> **Cut 2026-07-31 (D9), revived 2026-09-13 (D23).** Phase 1 ships G2, G3, G10, G11 and G12;
> G1, G7 and G8 are phase 2; G4, G5, G6 and G9 are dissolved into D1, F1, A7 and I2 and kept as a
> record. Design: `docs/superpowers/specs/2026-09-13-family-g-revival-design.md`.
```

Change the heading `## G3 \`typed-handle\` + \`typed-edge\``to`## G3 \`typed-handle\`` and replace its body with:

```markdown
**Base:** react-flow `Handle` · **States:** input · output · stacked · compatible · unregistered-type

- The handle id is the codec `{nodeId}:{dataType}:{in|out}` from `flow-types`; validation is a
  string compare and is not overridable per handle.
- The port colour is `var(--flow-<type>)`. An unregistered type falls back to `--flow-text` and a
  descriptive accessible name, so a typo is visible rather than invisible.
- Invalid connections are rejected at drag time, not accepted then failed at run time.

**Evidence:** Freepik Flows, ElevenLabs Flows, OpenAI Agent Builder.
```

Under each of G4, G5, G6 and G9, insert as the first line of the body: `> **Dissolved (D23)** into ` followed by `D1 \`media-prompt-bar\` (presentation \`node-embedded\`).`, `F1 \`result-card\`.`, `A7 \`gen-settings-bar\` + \`model-picker\`.`, `I2 \`property-inspector\`.` respectively.

After the G9 section and before `## \`useFlowRunner\` — headless hook`, insert:

```markdown
## G10 `typed-edge` `NEW`

**Base:** react-flow `BaseEdge` · **States:** type-coloured · selected · streaming

- Stroke colour derives from the SOURCE handle id. Deriving from the target would change colour
  mid-drag.
- `stroke` and `stroke-width` are inline styles on purpose: Tailwind v4 emits utilities inside
  cascade layers, which lose to react-flow's unlayered stylesheet.
- The streaming dash is the named animation `animate-flow-dash`, gated behind `motion-safe`.

**Evidence:** Freepik Flows, ElevenLabs Flows.

## G11 `node-status` `NEW`

**States:** idle · queued · streaming · done · failed · locked · compact

- The only place a `FlowStatus` becomes a glyph. `streaming` renders as "Running": copy may diverge
  from the contract word, the union never does.
- `statusRingClass` is the ring a node card paints per status; `idle` and `done` paint none.
- `compact` hides the label with `sr-only` and adds a `title`, so a zoomed-out canvas keeps the
  announcement.

**Evidence:** ElevenLabs Flows, Freepik Flows status dots.

## G12 `connection-hint` `NEW`

**States:** with-matches · no-matches · chips

- Shown when a connection is dropped on empty canvas; lists the node kinds whose inputs accept the
  dragged type, and adds one on pick. Focus lands on the first option; Escape dismisses.
- `PortChips` lists a node's IN and OUT types with `data-satisfied` per chip, for palettes and
  inspectors.

**Evidence:** OpenAI Agent Builder, Freepik Flows.
```

In the `useFlowRunner` section, replace the first line `**No UI.** …` with `**No UI. Ships as the \`registry:lib\` contract \`use-flow-runner\` (D23).\*\* Topological execution, per-node status, cancellation, content-hash cache, cycle detection, scoped runs. Executor-swappable.`and delete the bullet`v1 does naive full-graph topological runs; output caching is deferred.`

- [ ] **Step 5: Amend the design spec**

In `docs/superpowers/specs/2026-09-13-family-g-revival-design.md`:

1. In the TL;DR, replace `**24 new registry items**, catalog **116 → 140**` with `**23 new registry items plus two \`registry:lib\` contracts**, catalog **116 → 139\*\*`.
2. In "Three tiers, one boundary", replace the sentence beginning `\`flow-types.ts\` and \`flow-tokens.css\` are shipped as registry \`files\``with:`\`flow-types\` and \`use-flow-runner\` ship as \`registry:lib\` contracts (\`lib/lib.manifest.ts\`, the mechanism \`cost\` uses); every flow component declares \`consumes: ["flow-types"]\`. The token scale ships as manifest \`cssVars\`, and the one keyframe as a manifest \`css\` block (\`lib/flow-tokens.ts\`).`
3. In the Phase 1 table, change the `typed-handle` notes to `ships alone; \`PortChips\` lives in \`connection-hint\` so chips never pull react-flow`and the`connection-hint`notes to`the hint while a connection is being dragged, plus \`PortChips\``. Change `useFlowRunner`'s `catalog`cell to`lib`.
4. In D23's text, replace `Catalog: 116 → 140 (12 primitives · 112 components · 14 blocks · 2 records).` with `Catalog: 116 → 139 (12 primitives · 111 components · 14 blocks · 2 records), plus two lib contracts.`

- [ ] **Step 6: Scaffold the five components**

```bash
cd apps/docs
for n in node-status typed-handle typed-edge connection-hint ai-node; do pnpm new:component "$n"; done
git status --short | wc -l
```

Expected: 25 new files (five per item), the scaffolder's closing line for each. It refuses if a file exists; none should.

- [ ] **Step 7: Verify the contract gate's catalog arithmetic**

Run: `cd apps/docs && pnpm gen:wiring && pnpm check:contract 2>&1 | grep -v "missing\|story file has no export\|docs module is missing" ; echo "exit=$?"`

Expected: no `catalog.md` lines (family G totals 8, O totals 14, total 125 all reconcile). The suppressed lines are the five `building` items' unfilled files, which Tasks 5 to 9 fill.

- [ ] **Step 8: Commit**

```bash
git add apps/docs/lib/catalog.manifest.ts docs/design-system/decisions.md docs/design-system/catalog.md docs/design-system/component-specs.md docs/superpowers/specs/2026-09-13-family-g-revival-design.md apps/docs/registry/super-ai apps/docs/components/demos apps/docs/content/components apps/storybook/src/stories/super-ai apps/docs/lib/demos.generated.ts apps/docs/lib/docs.generated.ts
git commit -m "docs(D23): revive family G, dissolve four items, scaffold the phase 1 spine

Reverses D9 on the record. Manifest: G2, G3, G10, G11, G12 building;
G1, G7, G8, O5 planned; G4, G5, G6, G9 cut as dissolved. Catalog totals
116 -> 125 in scope. Five scaffolds with deliberately failing tests.

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 5: `node-status`

**Files:**

- Modify (scaffolded): `apps/docs/registry/super-ai/node-status.tsx`, `node-status.test.tsx`, `apps/docs/components/demos/node-status-demo.tsx`, `apps/docs/content/components/node-status.docs.tsx`, `apps/storybook/src/stories/super-ai/NodeStatus.stories.tsx`
- Source: parked `registry/super-ai/flow/node-status.tsx` and `.test.tsx`

**Interfaces:**

- Consumes: `FlowStatus` (Task 2).
- Produces: `NodeStatusBadge({ status, compact?, ...span props })`, `statusRingClass(status): string`, `STATUS_LABEL: Record<FlowStatus, string>`. Slots: `node-status`, `node-status-dot`, `node-status-spinner`, `node-status-label`. Task 9 imports all three exports.

- [ ] **Step 1: Replace the scaffolded test with the ported one, extended**

Overwrite `apps/docs/registry/super-ai/node-status.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { NodeStatusBadge, STATUS_LABEL, statusRingClass } from "@/registry/super-ai/node-status";
import { FLOW_STATUSES } from "@/registry/super-ai/flow-types";

describe("NodeStatusBadge", () => {
  it("renders every contract status with a label and a data-status attribute", () => {
    for (const status of FLOW_STATUSES) {
      const { unmount } = render(<NodeStatusBadge status={status} />);
      const badge = screen.getByText(STATUS_LABEL[status]).closest("[data-slot=node-status]");
      expect(badge).toHaveAttribute("data-status", status);
      unmount();
    }
  });
  it("announces status politely", () => {
    render(<NodeStatusBadge status="streaming" />);
    const badge = screen.getByText("Running");
    expect(badge.closest("[data-slot=node-status]")).toHaveAttribute("aria-live", "polite");
  });
  it("streaming renders a motion-safe spinner, every other status a dot", () => {
    const { rerender } = render(<NodeStatusBadge status="streaming" />);
    expect(document.querySelector("[data-slot=node-status-spinner]")).toHaveClass("motion-safe:animate-spin");
    rerender(<NodeStatusBadge status="done" />);
    expect(document.querySelector("[data-slot=node-status-spinner]")).toBeNull();
    expect(document.querySelector("[data-slot=node-status-dot]")).toBeInTheDocument();
  });
  it("maps statuses to ring classes; idle and done get none", () => {
    expect(statusRingClass("idle")).toBe("");
    expect(statusRingClass("done")).toBe("");
    expect(statusRingClass("streaming")).toContain("ring-2");
    expect(statusRingClass("failed")).toContain("ring-2");
  });
  it("locked renders the upgrade label", () => {
    render(<NodeStatusBadge status="locked" />);
    expect(screen.getByText("Upgrade to run")).toBeInTheDocument();
  });
  it("compact hides the label with sr-only and puts a title on the wrapper", () => {
    render(<NodeStatusBadge status="locked" compact />);
    const label = screen.getByText("Upgrade to run");
    expect(label).toHaveClass("sr-only");
    expect(screen.getByTitle("Upgrade to run")).toHaveAttribute("data-slot", "node-status");
  });
  it("passes className through", () => {
    render(<NodeStatusBadge status="idle" className="test-class" />);
    expect(document.querySelector('[data-slot="node-status"]')!.className).toContain("test-class");
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd apps/docs && pnpm vitest run registry/super-ai/node-status.test.tsx`
Expected: FAIL, `NodeStatusBadge` is not exported by the scaffold.

- [ ] **Step 3: Write the component**

Overwrite `apps/docs/registry/super-ai/node-status.tsx`:

```tsx
import * as React from "react";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import type { FlowStatus } from "@/registry/super-ai/flow-types";

/**
 * Node Status — The badge and ring map for the six-status contract
 *
 * Spec: docs/design-system/component-specs.md#g11-node-status
 * States: idle · queued · streaming · done · failed · locked · compact
 *
 * UI copy may diverge from the contract word (streaming renders as
 * "Running"); the FlowStatus union in flow-types stays the master vocabulary.
 */
export const STATUS_LABEL: Record<FlowStatus, string> = {
  idle: "Idle",
  queued: "Queued",
  streaming: "Running",
  done: "Done",
  failed: "Failed",
  locked: "Upgrade to run",
};

/** Full literal class strings so Tailwind can statically extract them. */
const STATUS_RING: Record<FlowStatus, string> = {
  idle: "",
  queued: "ring-2 ring-[var(--flow-queued)]/40",
  streaming: "ring-2 ring-[var(--flow-streaming)]/50",
  done: "",
  failed: "ring-2 ring-[var(--flow-failed)]/60",
  locked: "ring-2 ring-[var(--flow-queued)]/40",
};

const STATUS_DOT: Record<FlowStatus, string> = {
  idle: "bg-[var(--flow-queued)]",
  queued: "bg-[var(--flow-queued)]",
  streaming: "bg-[var(--flow-streaming)]",
  done: "bg-[var(--flow-done)]",
  failed: "bg-[var(--flow-failed)]",
  locked: "bg-[var(--flow-queued)]",
};

/** The ring a node card paints for a status; `idle` and `done` paint none. */
export function statusRingClass(status: FlowStatus): string {
  return STATUS_RING[status];
}

export interface NodeStatusBadgeProps extends React.ComponentProps<"span"> {
  status: FlowStatus;
  /** Dot or spinner only; the label is visually hidden (sr-only) with a `title` tooltip. */
  compact?: boolean;
}

export function NodeStatusBadge({ status, compact, className, ...props }: NodeStatusBadgeProps) {
  const label = STATUS_LABEL[status];
  return (
    <span
      data-slot="node-status"
      data-status={status}
      aria-live="polite"
      title={compact ? label : undefined}
      className={cn("inline-flex items-center gap-1", className)}
      {...props}
    >
      {status === "streaming" ? (
        <Loader2
          aria-hidden
          data-slot="node-status-spinner"
          className="size-3 text-[var(--flow-streaming)] motion-safe:animate-spin"
        />
      ) : (
        <span
          aria-hidden
          data-slot="node-status-dot"
          className={cn("size-1.5 rounded-full", STATUS_DOT[status])}
        />
      )}
      <span
        data-slot="node-status-label"
        className={cn("text-muted-foreground text-xs", compact && "sr-only")}
      >
        {label}
      </span>
    </span>
  );
}
```

Changes from the parked file: registry import path; `text-[10px]` → `text-xs` (LAY-1); `animate-spin` → `motion-safe:animate-spin`; the "// apps/docs/…" path comment replaced by the house header.

- [ ] **Step 4: Run the tests, then the per-item gates**

Run: `cd apps/docs && pnpm vitest run registry/super-ai/node-status.test.tsx && pnpm typecheck && pnpm check:tokens`
Expected: PASS, 7 tests; typecheck and tokens clean.

- [ ] **Step 5: Write the demo**

Overwrite `apps/docs/components/demos/node-status-demo.tsx`:

```tsx
import { FLOW_STATUSES } from "@/registry/super-ai/flow-types";
import { NodeStatusBadge } from "@/registry/super-ai/node-status";

export default function NodeStatusDemo() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-4">
        {FLOW_STATUSES.map((status) => (
          <NodeStatusBadge key={status} status={status} />
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-4">
        {FLOW_STATUSES.map((status) => (
          <NodeStatusBadge key={status} status={status} compact />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Write the docs module**

Overwrite `apps/docs/content/components/node-status.docs.tsx`:

```tsx
import type { ComponentDocs } from "@/lib/component-docs";

import { NodeStatusBadge } from "@/registry/super-ai/node-status";

/**
 * Seeded from docs/design-system/component-specs.md#g11-node-status.
 * No "use client": plain data read by a Server Component. The examples are
 * static markup with no handlers, so no .examples sidecar is needed.
 */
export const NodeStatusDocs: ComponentDocs = {
  whatItIs:
    'A small inline badge that turns one of the six flow statuses into a dot or a spinner plus a word, and a helper that returns the ring a node card paints for the same status. It is the only place in the registry where a status becomes a glyph, so a node, a palette row and an inspector header all agree on what "queued" looks like.',
  whyItMatters:
    'A node canvas is read at a distance. ElevenLabs Flows and Freepik Flows both mark a running node with a dot and a ring rather than a sentence, because at 60% zoom a sentence is unreadable and a colour is not. Keeping the map in one component means the status vocabulary in flow-types has exactly one rendering, which is what lets the runner report `streaming` and the UI say "Running" without the two drifting.',
  evidence: ["ElevenLabs Flows", "Freepik Flows"],
  anatomy: [
    {
      slot: "node-status",
      note: "The inline wrapper. Carries data-status, the polite live region, and the title in compact mode.",
    },
    {
      slot: "node-status-dot",
      note: "A 6px dot painted with the status colour; rendered for every status except streaming.",
    },
    {
      slot: "node-status-spinner",
      note: "The streaming spinner. Motion-safe: it holds still under prefers-reduced-motion.",
    },
    {
      slot: "node-status-label",
      note: "The word. Visually hidden in compact mode, never removed, so the announcement survives.",
    },
  ],
  usage:
    "Render it wherever a node's run state has to be read: the card header (ai-node does this for you), a palette row, an inspector heading. Pass the status straight from the runner; never translate it first. Use `compact` inside dense chrome and rely on the title for the sighted hover. Use `statusRingClass` on the container that should glow, not on the badge.",
  dos: [
    {
      text: "Pass the runner's status unchanged; the badge owns the wording.",
      example: <NodeStatusBadge status="streaming" />,
    },
    {
      text: "Use compact in a header and let the title carry the word.",
      example: <NodeStatusBadge status="queued" compact />,
    },
  ],
  donts: [
    {
      text: "Don't add a seventh status by passing a string the union does not know; the map has no fallback branch and TypeScript rejects it for a reason.",
      example: <NodeStatusBadge status="failed" />,
    },
  ],
  accessibility: {
    keyboard: [
      "Zero tab stops. The badge is a span with no role and no handlers; it decorates the node that has focus rather than taking focus itself.",
    ],
    screenReader: [
      'The wrapper is aria-live="polite", so a status change is announced without stealing focus. The dot and spinner are aria-hidden; only the label is read.',
      "In compact mode the label is sr-only, not removed. The title attribute is for sighted hover and is not what a screen reader announces.",
    ],
  },
  pitfalls: [
    "The ring helper returns an empty string for idle and done on purpose. If a card always shows a ring, the caller is passing selected styling through the same class list; keep the two separate as ai-node does.",
    "The ring classes use an opacity modifier on a CSS variable (ring-[var(--flow-failed)]/60). That works because the variable resolves to an oklch colour; a consumer who overrides --flow-failed with a non-colour value gets no ring and no error.",
  ],
};
```

- [ ] **Step 7: Write the story**

Overwrite `apps/storybook/src/stories/super-ai/NodeStatus.stories.tsx`:

```tsx
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";

import { NodeStatusBadge } from "@/registry/super-ai/node-status";
import { NodeStatusDocs } from "@/content/components/node-status.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const meta: Meta<typeof NodeStatusBadge> = {
  title: "Super AI/Node Status",
  component: NodeStatusBadge,
  parameters: { layout: "centered", docs: { page: componentDocsPage(NodeStatusDocs) } },
};

export default meta;
type Story = StoryObj<typeof NodeStatusBadge>;

/** The resting state: a neutral dot and the word. No ring is painted for it. */
export const Idle: Story = { args: { status: "idle" } };

/** Waiting for an upstream node. Same neutral dot as idle; the ring on the card is what says "soon". */
export const Queued: Story = { args: { status: "queued" } };

/** The only status with motion. The word is "Running", not "streaming": copy may diverge from the contract, the union never does. */
export const Streaming: Story = { args: { status: "streaming" } };

/** Finished. Green is the one colour this family adds beyond the type scale. */
export const Done: Story = { args: { status: "done" } };

/** Failed, painted with --destructive through --flow-failed. The card shows the error text; the badge only marks it. */
export const Failed: Story = { args: { status: "failed" } };

/** A plan gate. The label reads "Upgrade to run" because the node is not broken, it is unavailable. */
export const Locked: Story = { args: { status: "locked" } };

/** Header density: the dot alone, the label sr-only, the word in a title. */
export const Compact: Story = { args: { status: "streaming", compact: true } };

/*
 * Case stories.
 * // case-skip: RTL — an inline-flex of a dot and a word with no directional icon; `gap-1` is the only spacing
 * // case-skip: KeyboardOrder — a span with no role, no tabIndex and no handlers; grep confirms zero focusables
 * // case-skip: Controlled — no value/onChange pair; status is a display prop
 * // case-skip: EmptyLabel — the label is derived from the status union and is never optional
 * // case-skip: LongContent — labels are the six fixed words in STATUS_LABEL, none author-supplied
 * // case-skip: Boundary — `grep -l "status" registry/super-ai/*.tsx` finds env-status and run-inspector; both describe a service or a span, neither a graph node
 */

/** The spinner is `motion-safe:animate-spin`, so under prefers-reduced-motion it renders as a still glyph and the status is still legible from the word. */
export const ReducedMotion: Story = {
  args: { status: "streaming" },
  play: async ({ canvasElement }) => {
    const spinner = canvasElement.querySelector("[data-slot=node-status-spinner]");
    await expect(spinner).toHaveClass("motion-safe:animate-spin");
  },
};

/** 375px frame, six badges in a row: they wrap rather than scroll, because the wrapper is inline-flex and the row is flex-wrap. */
export const Mobile: Story = {
  render: () => (
    <div data-testid="frame" className="w-[375px] overflow-hidden">
      <div className="flex flex-wrap items-center gap-3">
        {(["idle", "queued", "streaming", "done", "failed", "locked"] as const).map((s) => (
          <NodeStatusBadge key={s} status={s} />
        ))}
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const frame = within(canvasElement).getByTestId("frame");
    await expect(frame.scrollWidth).toBeLessThanOrEqual(frame.clientWidth);
  },
};
```

- [ ] **Step 8: Run the story coverage report and the item gates**

Run: `cd apps/docs && pnpm typecheck && pnpm check:tokens && pnpm check:contract 2>&1 | grep "node-status" ; echo "(no node-status lines above means clean)"`
Expected: no `node-status` lines. (`story-coverage:report` only reads shipped items; it runs in Task 12.)

- [ ] **Step 9: Commit**

```bash
git add apps/docs/registry/super-ai/node-status.tsx apps/docs/registry/super-ai/node-status.test.tsx apps/docs/components/demos/node-status-demo.tsx apps/docs/content/components/node-status.docs.tsx apps/storybook/src/stories/super-ai/NodeStatus.stories.tsx
git commit -m "feat(node-status): G11, the status badge and ring map, ported to contract

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 6: `typed-handle`

**Files:**

- Modify (scaffolded): `apps/docs/registry/super-ai/typed-handle.tsx`, `typed-handle.test.tsx`, `apps/docs/components/demos/typed-handle-demo.tsx`, `apps/docs/content/components/typed-handle.docs.tsx`, `apps/storybook/src/stories/super-ai/TypedHandle.stories.tsx`
- Source: parked `flow/typed-handle.tsx`, `.test.tsx`, `components/demos/flow/typed-handle-demo.tsx`

**Interfaces:**

- Consumes: `getHandleType`, `handleId`, `isValidFlowConnection` (Task 2).
- Produces: `TypedHandle({ nodeId?, dataType, type: "source" | "target", position?, top?, className?, style?, ...HandleProps })`. Slot `typed-handle`; attributes `data-flow-type`, `data-flow-compatible`.

- [ ] **Step 1: Replace the scaffolded test**

Overwrite `apps/docs/registry/super-ai/typed-handle.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { ReactFlowProvider } from "@xyflow/react";
import { describe, expect, it } from "vitest";
import { TypedHandle } from "@/registry/super-ai/typed-handle";

const wrap = (ui: React.ReactNode) => render(<ReactFlowProvider>{ui}</ReactFlowProvider>);

describe("TypedHandle", () => {
  it("renders a port with the type colour var and an accessible name", () => {
    wrap(<TypedHandle nodeId="n1" dataType="image" type="target" />);
    const port = screen.getByLabelText("Image input port");
    expect(port).toHaveStyle({ background: "var(--flow-image)" });
    expect(port).toHaveAttribute("data-slot", "typed-handle");
    expect(port).toHaveAttribute("data-flow-type", "image");
    expect(port).toHaveAttribute("data-handlepos", "left");
  });
  it("encodes node id, type and direction in the handle id", () => {
    wrap(<TypedHandle nodeId="n1" dataType="audio" type="source" />);
    expect(document.querySelector('[data-handleid="n1:audio:out"]')).toBeTruthy();
  });
  it("knows the ten built-in types, including the ones that start with a digit", () => {
    wrap(<TypedHandle nodeId="n1" dataType="3d" type="source" />);
    expect(screen.getByLabelText("3D output port")).toHaveStyle({ background: "var(--flow-3d)" });
  });
  it("an unregistered type falls back to --flow-text and a descriptive name", () => {
    wrap(<TypedHandle nodeId="n1" dataType="mask" type="target" />);
    expect(screen.getByLabelText("mask input port")).toHaveStyle({ background: "var(--flow-text)" });
  });
  it("stacks by top offset and passes className through", () => {
    wrap(<TypedHandle nodeId="n1" dataType="text" type="target" top={28} className="test-class" />);
    const port = screen.getByLabelText("Text input port");
    expect(port).toHaveStyle({ top: "28px" });
    expect(port.className).toContain("test-class");
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd apps/docs && pnpm vitest run registry/super-ai/typed-handle.test.tsx`
Expected: FAIL, `TypedHandle` not exported.

- [ ] **Step 3: Write the component**

Overwrite `apps/docs/registry/super-ai/typed-handle.tsx`:

```tsx
"use client";
import { Handle, Position, useNodeId, type HandleProps } from "@xyflow/react";

import { cn } from "@/lib/utils";
import { getHandleType, handleId, isValidFlowConnection } from "@/registry/super-ai/flow-types";

/**
 * Typed Handle — A react-flow port that encodes its data type in the handle id
 *
 * Spec: docs/design-system/component-specs.md#g3-typed-handle
 * States: input · output · stacked · compatible · unregistered-type
 *
 * Handle ids follow `{nodeId}:{dataType}:{in|out}` (flow-types). Same-type,
 * out→in validation is built in and not overridable per handle; to extend it,
 * AND your validator with `isValidFlowConnection` at the canvas.
 *
 * `data-flow-compatible="true"` is the hook for drag-state highlighting; the
 * canvas sets it from react-flow's `useConnection()`. Overriding
 * `style.background` breaks type-colour semantics: register a type through
 * `registerHandleType` instead.
 */
export interface TypedHandleProps extends Omit<
  HandleProps,
  "type" | "position" | "id" | "isValidConnection"
> {
  /**
   * The react-flow node id that owns this handle. Optional inside a node
   * context (read from `useNodeId()`); pass it in tests, stories and demos.
   */
  nodeId?: string;
  dataType: string;
  type: "source" | "target";
  position?: Position;
  /** Vertical offset in px when stacking several ports on one side. Canvas geometry, not layout. */
  top?: number;
  className?: string;
}

export function TypedHandle({
  nodeId,
  dataType,
  type,
  position,
  top,
  className,
  style,
  ...rest
}: TypedHandleProps) {
  const contextNodeId = useNodeId();
  const nid = nodeId ?? contextNodeId ?? "";
  if (process.env.NODE_ENV !== "production" && nid === "") {
    console.warn("TypedHandle: no nodeId available, the handle id codec will be invalid");
  }
  const def = getHandleType(dataType);
  const dir = type === "source" ? "out" : "in";
  return (
    <Handle
      id={handleId(nid, dataType, dir)}
      type={type}
      position={position ?? (type === "source" ? Position.Right : Position.Left)}
      isValidConnection={isValidFlowConnection}
      aria-label={`${def?.label ?? dataType} ${dir === "in" ? "input" : "output"} port`}
      data-slot="typed-handle"
      data-flow-type={dataType}
      className={cn(
        "border-background size-3.5 rounded-full border-2 transition-transform",
        "data-[flow-compatible=true]:scale-125",
        className,
      )}
      style={{ background: `var(${def?.cssVar ?? "--flow-text"})`, ...(top != null && { top }), ...style }}
      {...rest}
    />
  );
}
```

- [ ] **Step 4: Run the tests and gates**

Run: `cd apps/docs && pnpm vitest run registry/super-ai/typed-handle.test.tsx registry/super-ai/flow-boundary.test.ts && pnpm typecheck && pnpm check:tokens`
Expected: PASS (5 + 1 tests). The boundary test still passes because `typed-handle.tsx` is allowed.

- [ ] **Step 5: Write the demo**

Overwrite `apps/docs/components/demos/typed-handle-demo.tsx`:

```tsx
"use client";
import { Background, ReactFlow, type Node, type NodeProps } from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { TypedHandle } from "@/registry/super-ai/typed-handle";

function DemoNode({ id }: NodeProps) {
  return (
    <div className="bg-card rounded-md border p-3 text-xs">
      ports
      <TypedHandle nodeId={id} dataType="image" type="target" top={10} />
      <TypedHandle nodeId={id} dataType="audio" type="target" top={28} />
      <TypedHandle nodeId={id} dataType="image" type="source" />
    </div>
  );
}
const nodes: Node[] = [
  { id: "a", position: { x: 20, y: 40 }, data: {}, type: "demo" },
  { id: "b", position: { x: 220, y: 80 }, data: {}, type: "demo" },
];
const nodeTypes = { demo: DemoNode };

export default function TypedHandleDemo() {
  return (
    <div className="h-52 rounded-lg border">
      <ReactFlow
        defaultNodes={nodes}
        defaultEdges={[]}
        nodeTypes={nodeTypes}
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Background />
      </ReactFlow>
    </div>
  );
}
```

- [ ] **Step 6: Write the docs module**

Overwrite `apps/docs/content/components/typed-handle.docs.tsx`:

```tsx
import type { ComponentDocs } from "@/lib/component-docs";

/**
 * Seeded from docs/design-system/component-specs.md#g3-typed-handle.
 * No live examples: a handle only renders inside a react-flow node, and the
 * docs page's demo already shows one. No .examples sidecar.
 */
export const TypedHandleDocs: ComponentDocs = {
  whatItIs:
    "A react-flow port that carries its data type in the handle id, paints the type's colour from the flow token scale, and refuses to connect to a port of another type or the same direction. It is the one component in the family that talks to react-flow's Handle directly.",
  whyItMatters:
    "Every node canvas on the reference board (Freepik Flows, ElevenLabs Flows, OpenAI Agent Builder) colours ports by type and rejects a bad drag before it lands, rather than accepting it and failing at run time. Encoding the type into the id is what makes that a string compare instead of a lookup, and it is why the edge that follows can colour itself from the source id alone.",
  evidence: ["Freepik Flows", "ElevenLabs Flows", "OpenAI Agent Builder"],
  anatomy: [
    {
      slot: "typed-handle",
      note: "The port: a 14px circle with a background-coloured border, react-flow's Handle underneath. Carries data-flow-type and, while a compatible drag is in progress, data-flow-compatible.",
    },
  ],
  usage:
    "Render one per port inside a react-flow node component. Give it `dataType` and `type`; inside a node context it reads the node id itself, and in a story or test you pass `nodeId`. Stack several on one side with `top`. Register a type that is not one of the ten built in with `registerHandleType` from flow-types before rendering, so it gets a label and a colour token.",
  dos: [
    {
      text: "Let position default: targets on the left, sources on the right, which is what every reference canvas does.",
    },
    { text: "Register custom types once at module scope, so server and client render the same colour." },
  ],
  donts: [
    {
      text: "Don't set `style.background` to recolour a port. The colour is the type's identity; change the token or register a type.",
    },
    {
      text: "Don't pass `id` or `isValidConnection` through; both are owned by the codec and the prop types omit them for that reason.",
    },
  ],
  accessibility: {
    keyboard: [
      "The port is not a tab stop. React-flow's Handle renders a div; connecting by keyboard is react-flow's own accessibility mode on the canvas, not a per-port control.",
    ],
    screenReader: [
      'Each port has an accessible name of the form "Image input port" or "Audio output port", built from the registered label and the direction. An unregistered type reads its raw key so the omission is audible.',
    ],
  },
  pitfalls: [
    'Outside a react-flow node context and without `nodeId`, the handle id is ":image:in" and a development warning is logged. Tests and stories must pass `nodeId`.',
    "`top` is a pixel offset inside the node, which is canvas geometry rather than layout; it is not mirrored for RTL, and should not be.",
    "The compatible scale-up is a `transition-transform`, not a keyframe, so it needs no reduced-motion story; but it only fires when the canvas sets data-flow-compatible from `useConnection()`, which flow-canvas does in phase 2.",
  ],
};
```

- [ ] **Step 7: Write the story**

Overwrite `apps/storybook/src/stories/super-ai/TypedHandle.stories.tsx`:

```tsx
import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { Background, ReactFlow, type Node, type NodeProps } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { expect, within } from "storybook/test";

import { TypedHandle, type TypedHandleProps } from "@/registry/super-ai/typed-handle";
import { TypedHandleDocs } from "@/content/components/typed-handle.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

/** One node on a tiny canvas; `ports` decides what the node renders. */
function Canvas({ ports, width = 320 }: { ports: Omit<TypedHandleProps, "nodeId">[]; width?: number }) {
  const DemoNode = ({ id }: NodeProps) => (
    <div className="bg-card rounded-md border px-4 py-3 text-xs">
      Video
      {ports.map((p, i) => (
        <TypedHandle key={i} nodeId={id} {...p} />
      ))}
    </div>
  );
  const nodeTypes = React.useMemo(() => ({ demo: DemoNode }), []); // eslint-disable-line react-hooks/exhaustive-deps
  const nodes: Node[] = [{ id: "n1", position: { x: 80, y: 40 }, data: {}, type: "demo" }];
  return (
    <div data-testid="frame" style={{ width }} className="h-40 overflow-hidden rounded-lg border">
      <ReactFlow
        defaultNodes={nodes}
        defaultEdges={[]}
        nodeTypes={nodeTypes}
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Background />
      </ReactFlow>
    </div>
  );
}

const meta: Meta<typeof TypedHandle> = {
  title: "Super AI/Typed Handle",
  component: TypedHandle,
  parameters: { layout: "centered", docs: { page: componentDocsPage(TypedHandleDocs) } },
};

export default meta;
type Story = StoryObj<typeof TypedHandle>;

/** A target port on the left, painted with --flow-image. The accessible name is "Image input port". */
export const Input: Story = { render: () => <Canvas ports={[{ dataType: "image", type: "target" }]} /> };

/** A source port on the right. Sources default to Position.Right, targets to Position.Left. */
export const Output: Story = { render: () => <Canvas ports={[{ dataType: "video", type: "source" }]} /> };

/** Three inputs stacked by `top`. The offset is canvas geometry, so it is not mirrored for RTL. */
export const Stacked: Story = {
  render: () => (
    <Canvas
      ports={[
        { dataType: "text", type: "target", top: 8 },
        { dataType: "image", type: "target", top: 24 },
        { dataType: "speech", type: "target", top: 40 },
        { dataType: "video", type: "source" },
      ]}
    />
  ),
};

/** The drag-state highlight: data-flow-compatible="true" scales the port up. flow-canvas sets it from useConnection(); here it is passed through. */
export const Compatible: Story = {
  render: () => (
    <Canvas
      ports={[
        { dataType: "image", type: "target", "data-flow-compatible": "true" } as Omit<
          TypedHandleProps,
          "nodeId"
        >,
      ]}
    />
  ),
};

/** A type nobody registered. It falls back to --flow-text and reads its raw key, so the omission is visible and audible. */
export const UnregisteredType: Story = {
  render: () => <Canvas ports={[{ dataType: "mask", type: "target" }]} />,
};

/*
 * Case stories.
 * // case-skip: RTL — port sides are canvas geometry owned by react-flow `Position`, not text direction; there is no directional icon or text
 * // case-skip: ReducedMotion — the only motion is a `transition-transform` on the compatible scale-up; no keyframe animation in the file
 * // case-skip: KeyboardOrder — react-flow's `Handle` renders a non-focusable div; keyboard connection is the canvas's a11y mode, not a per-port control
 * // case-skip: Controlled — no value/onChange pair
 * // case-skip: EmptyLabel — no text slot; the accessible name is derived from the type
 * // case-skip: LongContent — no author-supplied text; the longest built-in label is "Start frame"
 * // case-skip: Boundary — `grep -l "Handle" registry/super-ai/*.tsx` finds no other port component
 */

/** 375px frame: the canvas is a fixed-height box that clips rather than scrolls, so a narrow viewport never scrolls sideways. */
export const Mobile: Story = {
  render: () => (
    <Canvas
      width={375}
      ports={[
        { dataType: "image", type: "target" },
        { dataType: "video", type: "source" },
      ]}
    />
  ),
  play: async ({ canvasElement }) => {
    const frame = within(canvasElement).getByTestId("frame");
    await expect(frame.scrollWidth).toBeLessThanOrEqual(frame.clientWidth);
  },
};
```

- [ ] **Step 8: Gates and commit**

Run: `cd apps/docs && pnpm typecheck && pnpm check:tokens && pnpm check:contract 2>&1 | grep "typed-handle"; echo "(no typed-handle lines means clean)"`

```bash
git add apps/docs/registry/super-ai/typed-handle.tsx apps/docs/registry/super-ai/typed-handle.test.tsx apps/docs/components/demos/typed-handle-demo.tsx apps/docs/content/components/typed-handle.docs.tsx apps/storybook/src/stories/super-ai/TypedHandle.stories.tsx
git commit -m "feat(typed-handle): G3, the typed react-flow port, ported to contract

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 7: `typed-edge`

**Files:**

- Modify (scaffolded): `apps/docs/registry/super-ai/typed-edge.tsx`, `typed-edge.test.tsx`, `apps/docs/components/demos/typed-edge-demo.tsx`, `apps/docs/content/components/typed-edge.docs.tsx`, `apps/storybook/src/stories/super-ai/TypedEdge.stories.tsx`
- Source: parked `flow/typed-edge.tsx`, `.test.tsx`, `components/demos/flow/typed-edge-demo.tsx`

**Interfaces:**

- Consumes: `parseHandleId`, `handleId` (Task 2); the `animate-flow-dash` theme animation (Task 1).
- Produces: `TypedEdge` (a react-flow edge component for `edgeTypes: { typed: TypedEdge }`), `typedEdgeStyle({ sourceHandle, streaming, selected })`, `edgeColorFromHandle(sourceHandle)`, `type TypedEdgeType`. Slot `typed-edge`.

- [ ] **Step 1: Replace the scaffolded test**

Overwrite `apps/docs/registry/super-ai/typed-edge.test.tsx` with the parked test, with two edits: the import becomes `import { edgeColorFromHandle, typedEdgeStyle, TypedEdge } from "@/registry/super-ai/typed-edge";` and the streaming assertion becomes:

```ts
it("streaming edges get the named, motion-safe dash animation", () => {
  const result = typedEdgeStyle({ sourceHandle: "n1:image:out", streaming: true });
  expect(result.className).toContain("motion-safe:animate-flow-dash");
  expect(result.className).not.toContain("infinite");
});
```

Append one more test at the end of the first `describe`:

```ts
  it("passes className through on the path", () => {
    const { container } = render(
      <svg>
        <TypedEdge id="e" sourceX={0} sourceY={0} targetX={10} targetY={10} sourcePosition={Position.Right} targetPosition={Position.Left} sourceHandleId="a:text:out" source="a" target="b" type="typed" animated={false} deletable selectable interactionWidth={20} data={{}} style={{}} className="test-class" />
      </svg>,
    );
    expect(container.querySelector("[data-slot='typed-edge']")?.getAttribute("class")).toContain("test-class");
  });
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd apps/docs && pnpm vitest run registry/super-ai/typed-edge.test.tsx`
Expected: FAIL, `TypedEdge` not exported.

- [ ] **Step 3: Write the component**

Overwrite `apps/docs/registry/super-ai/typed-edge.tsx`:

```tsx
"use client";
import { BaseEdge, getBezierPath, type Edge, type EdgeProps } from "@xyflow/react";

import { cn } from "@/lib/utils";
import { parseHandleId } from "@/registry/super-ai/flow-types";

/**
 * Typed Edge — A react-flow edge coloured by its source port's type
 *
 * Spec: docs/design-system/component-specs.md#g10-typed-edge
 * States: type-coloured · selected · streaming
 */

/** Edge stroke colour for a source handle id; falls back to --flow-text so a registered-but-untokened type degrades visibly. */
export function edgeColorFromHandle(sourceHandle?: string | null) {
  const parsed = parseHandleId(sourceHandle);
  return `var(--flow-${parsed?.dataType ?? "text"}, var(--flow-text))`;
}

// stroke/strokeWidth are inline styles on purpose: Tailwind v4 emits utilities
// inside cascade layers, which lose to react-flow's unlayered stylesheet. The
// streaming dash is the named theme animation (lib/flow-tokens.ts), gated
// behind motion-safe.
export function typedEdgeStyle(opts: {
  sourceHandle?: string | null;
  streaming?: boolean;
  selected?: boolean;
}) {
  return {
    style: {
      stroke: edgeColorFromHandle(opts.sourceHandle),
      strokeWidth: opts.selected ? 2.5 : 1.5,
    } satisfies React.CSSProperties,
    className: cn(
      "transition-[stroke-width]",
      opts.streaming && "[stroke-dasharray:6_4] motion-safe:animate-flow-dash",
    ),
  };
}

export type TypedEdgeType = Edge<{ streaming?: boolean }, "typed">;

export function TypedEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  sourceHandleId,
  selected,
  data,
  style,
  markerEnd,
  markerStart,
  className,
}: EdgeProps<TypedEdgeType> & { className?: string }) {
  const [path] = getBezierPath({ sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition });
  const typedStyle = typedEdgeStyle({ sourceHandle: sourceHandleId, streaming: data?.streaming, selected });
  // Per-edge style spreads first so the typed stroke and width win: colour and
  // width are owned by the type system. Markers, opacity and filters pass through.
  return (
    <BaseEdge
      id={id}
      path={path}
      className={cn(typedStyle.className, className)}
      style={{ ...style, ...typedStyle.style }}
      markerEnd={markerEnd}
      markerStart={markerStart}
      data-slot="typed-edge"
    />
  );
}
```

Drop the parked `@deprecated TypedEdgeProps` alias; nothing on `main` consumed it.

- [ ] **Step 4: Run the tests and gates**

Run: `cd apps/docs && pnpm vitest run registry/super-ai/typed-edge.test.tsx registry/super-ai/flow-boundary.test.ts && pnpm typecheck && pnpm check:tokens`
Expected: PASS (6 + 1). If `BaseEdge` rejects `data-slot` in its prop type on the installed react-flow version, spread it as `{...({ "data-slot": "typed-edge" } as Record<string, string>)}` and keep the test.

- [ ] **Step 5: Write the demo**

Overwrite `apps/docs/components/demos/typed-edge-demo.tsx` with the parked demo, changing the two imports to `@/registry/super-ai/typed-edge` and `@/registry/super-ai/flow-types`, and the node's classes to `bg-card rounded-md border px-4 py-3 text-xs`.

- [ ] **Step 6: Write the docs module**

Overwrite `apps/docs/content/components/typed-edge.docs.tsx`:

```tsx
import type { ComponentDocs } from "@/lib/component-docs";

/** Seeded from docs/design-system/component-specs.md#g10-typed-edge. No sidecar: an edge renders only on a canvas. */
export const TypedEdgeDocs: ComponentDocs = {
  whatItIs:
    "A react-flow edge component that colours its stroke from the data type encoded in its source handle id, draws thicker while selected, and dashes and moves while the upstream node is streaming. It reads nothing from node state; the id is enough.",
  whyItMatters:
    "On Freepik Flows and ElevenLabs Flows the running path is visible from the edges before you read any badge: the lines move. Deriving colour from the source rather than the target is deliberate, because a drag in progress has no target yet and the colour must not change mid-drag.",
  evidence: ["Freepik Flows", "ElevenLabs Flows"],
  anatomy: [
    {
      slot: "typed-edge",
      note: "The path. Stroke and width are inline styles so they beat react-flow's unlayered CSS; the dash and its motion are classes.",
    },
  ],
  usage:
    'Register it once on the canvas as `edgeTypes: { typed: TypedEdge }` and give edges `type: "typed"`. Set `data.streaming` from the runner\'s per-node status for edges leaving a streaming node. Use `typedEdgeStyle` directly if you render a custom edge and only want the colour and width rules.',
  dos: [
    {
      text: "Feed `data.streaming` from useFlowRunner's statuses so the moving dash means a real run, never decoration.",
    },
    { text: "Keep the source handle id in the codec form; the colour is parsed from it." },
  ],
  donts: [
    {
      text: "Don't set `style.stroke` per edge to recolour it; the type owns the colour and the per-edge style is spread first so it loses.",
    },
  ],
  accessibility: {
    keyboard: [
      "The edge is an SVG path with no tab stop of its own; selecting and deleting edges by keyboard is react-flow's canvas behaviour.",
    ],
    screenReader: [
      'Nothing is announced by the edge itself. The connection is described by the two ports\' accessible names ("Image output port" to "Image input port"), and the run state by the node-status badge on the upstream node.',
    ],
  },
  pitfalls: [
    "The dash animation is the theme animation animate-flow-dash and needs its keyframes installed; the registry ships them as a css block with this item. A consumer who strips the css field gets a static dash.",
    "Width changes are a `transition-[stroke-width]`, deliberately not the transition-all shorthand; adding properties there is a MOT-2 blocker.",
    "`selected` comes from react-flow's edge state; it is not a prop you set on the edge object.",
  ],
};
```

- [ ] **Step 7: Write the story**

Overwrite `apps/storybook/src/stories/super-ai/TypedEdge.stories.tsx`:

```tsx
import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { Background, Handle, Position, ReactFlow, type EdgeTypes, type NodeProps } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { expect, within } from "storybook/test";

import { handleId } from "@/registry/super-ai/flow-types";
import { TypedEdge } from "@/registry/super-ai/typed-edge";
import { TypedEdgeDocs } from "@/content/components/typed-edge.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

function DemoNode({ id }: NodeProps) {
  return (
    <div className="bg-card rounded-md border px-4 py-3 text-xs">
      {id}
      <Handle type="target" position={Position.Left} id={handleId(id, "image", "in")} />
      <Handle type="source" position={Position.Right} id={handleId(id, "image", "out")} />
    </div>
  );
}
const nodeTypes = { demo: DemoNode };
const edgeTypes: EdgeTypes = { typed: TypedEdge };
const nodes = [
  { id: "n1", type: "demo", position: { x: 20, y: 40 }, data: {} },
  { id: "n2", type: "demo", position: { x: 220, y: 40 }, data: {} },
];
const edge = (opts: { selected?: boolean; streaming?: boolean }) => [
  {
    id: "e1",
    source: "n1",
    target: "n2",
    sourceHandle: handleId("n1", "image", "out"),
    targetHandle: handleId("n2", "image", "in"),
    type: "typed",
    selected: opts.selected,
    data: { streaming: opts.streaming ?? false },
  },
];

function Canvas({
  selected,
  streaming,
  width = 360,
}: {
  selected?: boolean;
  streaming?: boolean;
  width?: number;
}) {
  return (
    <div data-testid="frame" style={{ width }} className="h-40 overflow-hidden rounded-lg border">
      <ReactFlow
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultNodes={nodes}
        defaultEdges={edge({ selected, streaming })}
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Background />
      </ReactFlow>
    </div>
  );
}

const meta: Meta<typeof TypedEdge> = {
  title: "Super AI/Typed Edge",
  component: TypedEdge,
  parameters: { layout: "centered", docs: { page: componentDocsPage(TypedEdgeDocs) } },
};

export default meta;
type Story = StoryObj<typeof TypedEdge>;

/** An image edge at rest: stroke from --flow-image, 1.5px. The colour comes from the source handle id alone. */
export const TypeColoured: Story = { render: () => <Canvas /> };

/** Selected: 2.5px. Width changes transition; colour does not change with selection. */
export const Selected: Story = { render: () => <Canvas selected /> };

/** Streaming: dashed and moving. `data.streaming` is set from the runner's status for the upstream node. */
export const Streaming: Story = { render: () => <Canvas streaming /> };

/*
 * Case stories.
 * // case-skip: RTL — an SVG path between two canvas positions; direction is geometry, not text
 * // case-skip: KeyboardOrder — the path is not focusable; edge selection by keyboard is react-flow's canvas behaviour
 * // case-skip: Controlled — no value/onChange pair
 * // case-skip: EmptyLabel — no text slot
 * // case-skip: LongContent — no text slot
 * // case-skip: Boundary — `grep -l "BaseEdge\|getBezierPath" registry/super-ai/*.tsx` finds no other edge component
 */

/** The dash animation is `motion-safe:animate-flow-dash`: under prefers-reduced-motion the edge is dashed but still. */
export const ReducedMotion: Story = {
  render: () => <Canvas streaming />,
  play: async ({ canvasElement }) => {
    const path = canvasElement.querySelector("[data-slot=typed-edge]");
    await expect(path?.getAttribute("class") ?? "").toContain("motion-safe:animate-flow-dash");
  },
};

/** 375px frame: the canvas clips inside its box; no horizontal scroll at phone width. */
export const Mobile: Story = {
  render: () => <Canvas width={375} streaming />,
  play: async ({ canvasElement }) => {
    const frame = within(canvasElement).getByTestId("frame");
    await expect(frame.scrollWidth).toBeLessThanOrEqual(frame.clientWidth);
  },
};
```

- [ ] **Step 8: Gates and commit**

Run: `cd apps/docs && pnpm typecheck && pnpm check:tokens && pnpm check:contract 2>&1 | grep "typed-edge"; echo "(no typed-edge lines means clean)"`

```bash
git add apps/docs/registry/super-ai/typed-edge.tsx apps/docs/registry/super-ai/typed-edge.test.tsx apps/docs/components/demos/typed-edge-demo.tsx apps/docs/content/components/typed-edge.docs.tsx apps/storybook/src/stories/super-ai/TypedEdge.stories.tsx
git commit -m "feat(typed-edge): G10, the type-coloured react-flow edge, ported to contract

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 8: `connection-hint` (with `PortChips`)

**Files:**

- Modify (scaffolded): `apps/docs/registry/super-ai/connection-hint.tsx`, `connection-hint.test.tsx`, `apps/docs/components/demos/connection-hint-demo.tsx`, `apps/docs/content/components/connection-hint.docs.tsx`, `apps/storybook/src/stories/super-ai/ConnectionHint.stories.tsx`
- Source: parked `flow/connection-hint.tsx`, `flow/port-chip.tsx`, both tests, `components/demos/flow/connection-hint-demo.tsx`

**Interfaces:**

- Consumes: `getHandleType` (Task 2).
- Produces: `ConnectionHint({ dataType, catalog, position, onPick, onDismiss?, ...div props })`, `compatibleTargets(dataType, catalog)`, `interface NodeCatalogEntry { kind; label; description?; in: string[]; out: string[] }`, `PortChips({ in?, out?, satisfied?, ...div props })`. Slots: `connection-hint`, `connection-hint-option`, `port-chips`, `port-chip`.

- [ ] **Step 1: Replace the scaffolded test**

Overwrite `apps/docs/registry/super-ai/connection-hint.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { compatibleTargets, ConnectionHint, PortChips } from "@/registry/super-ai/connection-hint";

const catalog = [
  { kind: "video-node", label: "Video", in: ["image", "text"], out: ["video"] },
  { kind: "tts-node", label: "Text to Speech", in: ["text"], out: ["speech"] },
];

describe("ConnectionHint", () => {
  it("filters the catalog by compatible input type", () => {
    expect(compatibleTargets("image", catalog).map((c) => c.kind)).toEqual(["video-node"]);
  });
  it("renders options, focuses the first, and fires onPick", async () => {
    const onPick = vi.fn();
    render(<ConnectionHint dataType="text" catalog={catalog} position={{ x: 10, y: 10 }} onPick={onPick} />);
    expect(screen.getByRole("button", { name: "Video" })).toHaveFocus();
    await userEvent.click(screen.getByText("Text to Speech"));
    expect(onPick).toHaveBeenCalledWith("tts-node");
  });
  it("is a dialog labelled by its heading", () => {
    render(<ConnectionHint dataType="text" catalog={catalog} position={{ x: 0, y: 0 }} onPick={() => {}} />);
    expect(screen.getByRole("dialog", { name: "Add compatible node" })).toBeInTheDocument();
  });
  it("dismisses on Escape", async () => {
    const onDismiss = vi.fn();
    render(
      <ConnectionHint
        dataType="text"
        catalog={catalog}
        position={{ x: 0, y: 0 }}
        onPick={() => {}}
        onDismiss={onDismiss}
      />,
    );
    await userEvent.keyboard("{Escape}");
    expect(onDismiss).toHaveBeenCalledOnce();
  });
  it("shows the empty state when nothing is compatible", () => {
    render(<ConnectionHint dataType="3d" catalog={catalog} position={{ x: 0, y: 0 }} onPick={() => {}} />);
    expect(screen.getByText("No compatible nodes")).toBeInTheDocument();
  });
  it("passes className through", () => {
    render(
      <ConnectionHint
        dataType="text"
        catalog={catalog}
        position={{ x: 0, y: 0 }}
        onPick={() => {}}
        className="test-class"
      />,
    );
    expect(document.querySelector('[data-slot="connection-hint"]')!.className).toContain("test-class");
  });
});

describe("PortChips", () => {
  it("renders IN and OUT rows with one chip per port", () => {
    render(<PortChips in={["text", "image"]} out={["video"]} />);
    expect(screen.getByText("IN").parentElement?.querySelectorAll("[data-slot=port-chip]")).toHaveLength(2);
    expect(screen.getByText("OUT").parentElement?.querySelectorAll("[data-slot=port-chip]")).toHaveLength(1);
    expect(screen.getByText("Video")).toBeInTheDocument();
  });
  it("marks satisfied ports, and unsatisfied ones as false rather than absent", () => {
    render(<PortChips in={["text", "image"]} satisfied={["text"]} />);
    expect(screen.getByText("Text").closest("[data-slot=port-chip]")).toHaveAttribute(
      "data-satisfied",
      "true",
    );
    expect(screen.getByText("Image").closest("[data-slot=port-chip]")).toHaveAttribute(
      "data-satisfied",
      "false",
    );
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd apps/docs && pnpm vitest run registry/super-ai/connection-hint.test.tsx`
Expected: FAIL, exports missing.

- [ ] **Step 3: Write the component**

Overwrite `apps/docs/registry/super-ai/connection-hint.tsx`:

```tsx
"use client";
import * as React from "react";

import { cn } from "@/lib/utils";
import { getHandleType } from "@/registry/super-ai/flow-types";

/**
 * Connection Hint — The mini palette shown when a connection is dropped on empty canvas, plus PortChips
 *
 * Spec: docs/design-system/component-specs.md#g12-connection-hint
 * States: with-matches · no-matches · chips
 */

export interface NodeCatalogEntry {
  kind: string;
  label: string;
  description?: string;
  in: string[];
  out: string[];
}

export function compatibleTargets(dataType: string, catalog: NodeCatalogEntry[]): NodeCatalogEntry[] {
  return catalog.filter((entry) => entry.in.includes(dataType));
}

function TypeDot({ type }: { type: string }) {
  return (
    <span
      aria-hidden
      className="size-1.5 rounded-full"
      style={{ background: `var(${getHandleType(type)?.cssVar ?? "--flow-text"})` }}
    />
  );
}

export interface ConnectionHintProps extends Omit<React.ComponentProps<"div">, "children"> {
  dataType: string;
  catalog: NodeCatalogEntry[];
  /** Canvas coordinates of the drop; the host container must be positioned. */
  position: { x: number; y: number };
  onPick: (kind: string) => void;
  onDismiss?: () => void;
}

/**
 * The host wires react-flow's `onConnectEnd` to render this at the event
 * position when the connection was not dropped on a valid target. Focus lands
 * on the first option on mount; Escape calls `onDismiss` so the host unmounts it.
 */
export function ConnectionHint({
  dataType,
  catalog,
  position,
  onPick,
  onDismiss,
  className,
  style,
  ...props
}: ConnectionHintProps) {
  const matches = compatibleTargets(dataType, catalog);
  const headingId = React.useId();

  React.useEffect(() => {
    if (!onDismiss) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== "Escape" || e.defaultPrevented) return;
      e.preventDefault();
      onDismiss!();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onDismiss]);

  return (
    <div
      role="dialog"
      aria-labelledby={headingId}
      data-slot="connection-hint"
      className={cn("bg-popover absolute z-50 min-w-40 rounded-lg border p-2 shadow-md", className)}
      style={{ left: position.x, top: position.y, ...style }}
      {...props}
    >
      <p id={headingId} className="text-muted-foreground mb-1.5 px-1 text-xs">
        Add compatible node
      </p>
      {matches.length === 0 ? (
        <p className="text-muted-foreground px-1 text-xs">No compatible nodes</p>
      ) : (
        matches.map((entry, i) => (
          <button
            key={entry.kind}
            type="button"
            autoFocus={i === 0}
            data-slot="connection-hint-option"
            onClick={() => onPick(entry.kind)}
            className="hover:bg-accent focus-visible:ring-ring flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm focus-visible:ring-2 focus-visible:outline-none"
          >
            <span className="flex items-center gap-0.5">
              {entry.in.map((t) => (
                <TypeDot key={t} type={t} />
              ))}
            </span>
            {entry.label}
          </button>
        ))
      )}
    </div>
  );
}

function ChipRow({
  label,
  types,
  satisfied,
}: {
  label: "IN" | "OUT";
  types: string[];
  satisfied?: string[];
}) {
  if (!types.length) return null;
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-muted-foreground text-xs font-medium">{label}</span>
      {types.map((t) => {
        const def = getHandleType(t);
        const ok = satisfied?.includes(t) ?? false;
        return (
          <span
            key={t}
            data-slot="port-chip"
            data-satisfied={ok}
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-xs",
              ok ? "bg-secondary border-transparent" : "opacity-70",
            )}
          >
            <TypeDot type={t} />
            {def?.label ?? t}
          </span>
        );
      })}
    </div>
  );
}

export interface PortChipsProps extends Omit<React.ComponentProps<"div">, "children"> {
  in?: string[];
  out?: string[];
  /** Types whose ports are currently connected; every chip carries data-satisfied="true" or "false". */
  satisfied?: string[];
}

/** IN / OUT chips for a node kind, for palettes and inspectors. Select satisfied chips with `[data-satisfied="true"]`. */
export function PortChips({ in: ins = [], out = [], satisfied, className, ...props }: PortChipsProps) {
  return (
    <div data-slot="port-chips" className={cn("flex flex-col gap-1", className)} {...props}>
      <ChipRow label="IN" types={ins} satisfied={satisfied} />
      <ChipRow label="OUT" types={out} satisfied={satisfied} />
    </div>
  );
}
```

Changes from the parked files: registry import; `min-w-[160px]` → `min-w-40`; `text-[10px]` → `text-xs`; the option's `focus-visible:outline-none` now pairs with `focus-visible:ring-2 focus-visible:ring-ring` (STA-3); `opacity-70` on an unsatisfied chip is a whole-element opacity, outside TOK-8's text-opacity pattern.

- [ ] **Step 4: Run the tests and gates**

Run: `cd apps/docs && pnpm vitest run registry/super-ai/connection-hint.test.tsx && pnpm typecheck && pnpm check:tokens`
Expected: PASS, 8 tests.

- [ ] **Step 5: Write the demo**

Overwrite `apps/docs/components/demos/connection-hint-demo.tsx` with the parked demo, changing the import to `@/registry/super-ai/connection-hint` and adding `PortChips` to that import, the two catalog `out` values for `tts-node` to `["speech"]`, and appending inside the outer `flex` div, after the two hint columns:

```tsx
<div>
  <p className="text-muted-foreground mb-2 text-xs font-medium">Port chips</p>
  <PortChips in={["image", "text"]} out={["video"]} satisfied={["image"]} />
</div>
```

- [ ] **Step 6: Write the docs module**

Overwrite `apps/docs/content/components/connection-hint.docs.tsx`:

```tsx
import type { ComponentDocs } from "@/lib/component-docs";

import { PortChips } from "@/registry/super-ai/connection-hint";

/** Seeded from docs/design-system/component-specs.md#g12-connection-hint. PortChips examples are static; the hint itself needs a positioned host, so its example is the demo. */
export const ConnectionHintDocs: ComponentDocs = {
  whatItIs:
    "Two small pieces of the connect gesture. The hint is a positioned mini palette that appears when a connection is dropped on empty canvas, listing the node kinds whose inputs accept the dragged type and adding one on pick. The port chips list a node kind's IN and OUT types, with a satisfied mark per chip, for palettes and inspectors.",
  whyItMatters:
    "OpenAI Agent Builder and Freepik Flows both turn a dropped-on-nothing drag into an offer rather than a failure: the most common way a new user learns what connects to what. Filtering by the handle-type registry means the offer is always true, because it is computed from the same vocabulary the ports enforce.",
  evidence: ["OpenAI Agent Builder", "Freepik Flows"],
  anatomy: [
    {
      slot: "connection-hint",
      note: "A dialog, absolutely positioned at the drop point inside a positioned host. Labelled by its heading.",
    },
    {
      slot: "connection-hint-option",
      note: "One button per compatible kind: its input-type dots, then the label. The first one takes focus on mount.",
    },
    { slot: "port-chips", note: "The IN and OUT rows." },
    {
      slot: "port-chip",
      note: "One type: a dot in the type colour and the registered label. data-satisfied is always present, true or false.",
    },
  ],
  usage:
    "Render the hint from react-flow's onConnectEnd when the drop had no valid target, inside a container with position relative, and unmount it from onPick and onDismiss. Pass the same catalog the palette uses so both offer the same kinds. Use PortChips wherever a kind is described rather than instantiated: a palette row, an inspector header, an empty node.",
  dos: [
    {
      text: "Give every chip a verdict: pass `satisfied` so connected ports read as filled and the rest as open.",
      example: <PortChips in={["image", "text"]} out={["video"]} satisfied={["image"]} />,
    },
  ],
  donts: [
    {
      text: "Don't render chips for a type nobody registered; it falls back to the raw key and the neutral colour, which reads as a bug.",
      example: <PortChips in={["mask"]} />,
    },
  ],
  accessibility: {
    keyboard: [
      "Focus lands on the first option when the hint mounts. Tab moves through the options in catalog order; Escape calls onDismiss. There is no focus trap, because the hint is transient and the canvas behind it stays live.",
      "The chips are decoration with zero tab stops.",
    ],
    screenReader: [
      'The hint is a dialog named "Add compatible node". Each option is a button named by its label; the type dots are aria-hidden.',
      'The empty state is plain text, "No compatible nodes", inside the same dialog, so the announcement still explains why nothing is offered.',
    ],
    focus: [
      "On pick or dismiss the host unmounts the hint; focus returns to wherever the host puts it, which for flow-canvas is the canvas pane. The hint does not manage return focus itself.",
    ],
  },
  pitfalls: [
    "position is in the host's coordinate space and the host must be positioned. A static host places the hint relative to the page.",
    "The Escape listener is on document, so it fires for any Escape while the hint is mounted; unmount promptly from onDismiss or the next Escape is swallowed.",
    "autoFocus on the first option means mounting the hint moves focus. Only mount it on a real drop.",
  ],
};
```

- [ ] **Step 7: Write the story**

Overwrite `apps/storybook/src/stories/super-ai/ConnectionHint.stories.tsx`:

```tsx
import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { expect, userEvent, within } from "storybook/test";

import { ConnectionHint, PortChips, type NodeCatalogEntry } from "@/registry/super-ai/connection-hint";
import { ConnectionHintDocs } from "@/content/components/connection-hint.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const catalog: NodeCatalogEntry[] = [
  {
    kind: "video-generation",
    label: "Video Generation",
    in: ["speech", "audio", "image", "text"],
    out: ["video"],
  },
  { kind: "image-generation", label: "Image Generation", in: ["image", "text"], out: ["image"] },
  { kind: "text-to-speech", label: "Text to Speech", in: ["text"], out: ["speech"] },
  { kind: "lip-sync", label: "Lip Sync", in: ["avatar", "audio", "text"], out: ["video"] },
];

function Host({
  dataType,
  width = 320,
  children,
}: {
  dataType: string;
  width?: number;
  children?: React.ReactNode;
}) {
  return (
    <div
      data-testid="frame"
      style={{ width }}
      className="bg-muted/30 relative h-56 overflow-hidden rounded-lg border"
    >
      {children ?? (
        <ConnectionHint
          dataType={dataType}
          catalog={catalog}
          position={{ x: 16, y: 16 }}
          onPick={() => {}}
          onDismiss={() => {}}
        />
      )}
    </div>
  );
}

const meta: Meta<typeof ConnectionHint> = {
  title: "Super AI/Connection Hint",
  component: ConnectionHint,
  parameters: { layout: "centered", docs: { page: componentDocsPage(ConnectionHintDocs) } },
};

export default meta;
type Story = StoryObj<typeof ConnectionHint>;

/** Dropped an image output on empty canvas: every kind with an image input is offered, first one focused. */
export const WithMatches: Story = { render: () => <Host dataType="image" /> };

/** Dropped a 3D output: nothing in this catalog accepts it, and the dialog says so instead of vanishing. */
export const NoMatches: Story = { render: () => <Host dataType="3d" /> };

/** The chips: IN and OUT rows for a kind, with image satisfied and text open. */
export const Chips: Story = {
  name: "Port Chips",
  render: () => (
    <Host dataType="image">
      <div className="p-4">
        <PortChips in={["image", "text"]} out={["video"]} satisfied={["image"]} />
      </div>
    </Host>
  ),
};

/*
 * Case stories.
 * // case-skip: RTL — the hint is placed by canvas x/y; inside it, rows are flex with the dots leading, which mirror under dir="rtl" with no physical utilities in the file (grep -E "\b(pl|pr|ml|mr|left|right)-" finds none)
 * // case-skip: ReducedMotion — nothing in the tree animates; the file has no transition or animate utility
 * // case-skip: Controlled — no value/onChange pair; onPick is an event, not a value
 * // case-skip: EmptyLabel — labels come from the catalog entries and are required by the type
 * // case-skip: Boundary — the complete path is G7 node-palette, planned for phase 2; the choosing rule lands with it
 */

/** Tab order: first option is focused on mount, Tab walks the rest in catalog order, and the focused option shows the ring. Escape calls onDismiss. */
export const KeyboardOrder: Story = {
  render: () => <Host dataType="text" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const options = canvas.getAllByRole("button");
    await expect(options[0]).toHaveFocus();
    await userEvent.tab();
    await expect(options[1]).toHaveFocus();
    await expect(options[1].matches(":focus-visible")).toBe(true);
    const shadow = getComputedStyle(options[1]).boxShadow;
    await expect(shadow === "none").toBe(false);
  },
};

/** A ~90-character label: the option wraps onto a second line rather than truncating, because the kind name is what the user is choosing by. */
export const LongContent: Story = {
  render: () => (
    <Host dataType="text">
      <ConnectionHint
        dataType="text"
        catalog={[
          {
            kind: "long",
            label:
              "Text to Speech with a voice cloned from the reference audio attached to the upstream node",
            in: ["text"],
            out: ["speech"],
          },
        ]}
        position={{ x: 16, y: 16 }}
        onPick={() => {}}
      />
    </Host>
  ),
};

/** 375px host: the dialog is min-w-40 and grows to its content; the host clips, so nothing scrolls sideways. */
export const Mobile: Story = {
  render: () => <Host dataType="text" width={375} />,
  play: async ({ canvasElement }) => {
    const frame = within(canvasElement).getByTestId("frame");
    await expect(frame.scrollWidth).toBeLessThanOrEqual(frame.clientWidth);
  },
};
```

The declared state is `chips`, not `port-chips`, because `statePascal("port-chips")` would be `PortChips`, which collides with the component import in this file. The export `Chips` carries `name: "Port Chips"` for the sidebar.

- [ ] **Step 8: Gates and commit**

Run: `cd apps/docs && pnpm typecheck && pnpm check:tokens && pnpm check:contract 2>&1 | grep "connection-hint"; echo "(no connection-hint lines means clean)"`

```bash
git add apps/docs/registry/super-ai/connection-hint.tsx apps/docs/registry/super-ai/connection-hint.test.tsx apps/docs/components/demos/connection-hint-demo.tsx apps/docs/content/components/connection-hint.docs.tsx apps/storybook/src/stories/super-ai/ConnectionHint.stories.tsx
git commit -m "feat(connection-hint): G12, the drop-on-canvas hint and port chips, ported to contract

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 9: `ai-node`

**Files:**

- Modify (scaffolded): `apps/docs/registry/super-ai/ai-node.tsx`, `ai-node.test.tsx`, `apps/docs/components/demos/ai-node-demo.tsx`, `apps/docs/content/components/ai-node.docs.tsx`, `apps/storybook/src/stories/super-ai/AiNode.stories.tsx`
- Source: parked `flow/ai-node.tsx`, `.test.tsx`, `components/demos/flow/ai-node-demo.tsx`

**Interfaces:**

- Consumes: `NODE_WIDTH`, `FlowStatus`, `NodeSize` (Task 2); `NodeStatusBadge`, `statusRingClass`, `STATUS_LABEL` (Task 5).
- Produces: `AiNode({ id, title, status, modelLabel?, runtime?, error?, selected?, size?, media?, footer?, menuPlacement?, lockedCta?, children?, ...div props })`. Slots: `ai-node`, `ai-node-header`, `ai-node-media`, `ai-node-body`, `ai-node-error`, `ai-node-footer`, `ai-node-menu`, `ai-node-locked`, `ai-node-frame`. Phase 2's `modality-node` renders through this.

- [ ] **Step 1: Replace the scaffolded test**

Overwrite `apps/docs/registry/super-ai/ai-node.test.tsx` with the parked test, changing the import to `import { AiNode } from "@/registry/super-ai/ai-node";` and appending two tests inside the `describe`:

```tsx
it("docked menu placement renders the footer inside the card", () => {
  render(
    <AiNode id="n1" title="Video" status="idle" footer={<span data-testid="footer" />}>
      x
    </AiNode>,
  );
  const group = screen.getByRole("group");
  expect(group.querySelector("[data-slot=ai-node-footer]")).toContainElement(screen.getByTestId("footer"));
  expect(document.querySelector("[data-slot=ai-node-menu]")).toBeNull();
});
it("floating menu placement renders the footer as a pill below the card, outside the group", () => {
  render(
    <AiNode
      id="n1"
      title="Video"
      status="idle"
      menuPlacement="floating"
      footer={<span data-testid="footer" />}
    >
      x
    </AiNode>,
  );
  const group = screen.getByRole("group");
  const menu = document.querySelector("[data-slot=ai-node-menu]");
  expect(menu).toContainElement(screen.getByTestId("footer"));
  expect(group).not.toContainElement(menu as HTMLElement);
  expect(group.querySelector("[data-slot=ai-node-footer]")).toBeNull();
  expect(menu?.parentElement).toHaveAttribute("data-slot", "ai-node-frame");
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd apps/docs && pnpm vitest run registry/super-ai/ai-node.test.tsx`
Expected: FAIL, `AiNode` not exported.

- [ ] **Step 3: Write the component**

Overwrite `apps/docs/registry/super-ai/ai-node.tsx`:

```tsx
"use client";
import * as React from "react";
import { AlertCircle, Lock } from "lucide-react";

import { cn } from "@/lib/utils";
import { NODE_WIDTH, type FlowStatus, type NodeSize } from "@/registry/super-ai/flow-types";
import { NodeStatusBadge, STATUS_LABEL, statusRingClass } from "@/registry/super-ai/node-status";

/**
 * AI Node — One node card: header, media and body slots, footer or floating menu
 *
 * Spec: docs/design-system/component-specs.md#g2-ai-node
 * States: idle · queued · streaming · done · failed · locked · selected · menu-floating
 *
 * Props-as-slots rather than compound parts is deliberate: slot order is a
 * tested contract, and modality-node (phase 2) composes this API directly,
 * putting D1 media-prompt-bar in the body, F1 result-card in media and E5
 * run-button plus A7 gen-settings-bar in the footer.
 */
export interface AiNodeProps extends Omit<React.ComponentProps<"div">, "title"> {
  id: string;
  /** Node title shown in the header and used for the accessible name. */
  title: string;
  status: FlowStatus;
  modelLabel?: string;
  runtime?: "local" | "cloud";
  error?: string;
  selected?: boolean;
  size?: NodeSize;
  media?: React.ReactNode;
  footer?: React.ReactNode;
  /**
   * Where the footer renders. `docked` keeps it inside the card under a
   * border; `floating` renders it as a pill below the card, outside the group,
   * which is the FilmMaker settings-pill placement.
   */
  menuPlacement?: "docked" | "floating";
  children?: React.ReactNode;
  /** Content rendered inside the locked block in place of the body. */
  lockedCta?: React.ReactNode;
}

export function AiNode({
  id,
  title,
  status,
  modelLabel,
  runtime,
  error,
  selected,
  size = "md",
  media,
  footer,
  menuPlacement = "docked",
  children,
  lockedCta,
  className,
  style,
  ...props
}: AiNodeProps) {
  const isLocked = status === "locked";
  const floating = menuPlacement === "floating" && footer != null;

  const card = (
    <div
      role="group"
      aria-label={`${title} node, ${STATUS_LABEL[status]}`}
      data-slot="ai-node"
      data-status={status}
      data-node-id={id}
      className={cn(
        "bg-card text-card-foreground rounded-xl border shadow-sm transition-shadow",
        selected && "ring-ring shadow-md ring-2",
        !selected && statusRingClass(status),
        className,
      )}
      style={{ width: NODE_WIDTH[size], ...style }}
      {...props}
    >
      <div
        data-slot="ai-node-header"
        className="text-muted-foreground flex items-center justify-between gap-2 px-3 pt-2 text-xs"
      >
        <span className="font-medium">{title}</span>
        <span className="flex items-center gap-2">
          {modelLabel && (
            <span>
              {modelLabel}
              {runtime === "local" ? " · Local" : ""}
            </span>
          )}
          <NodeStatusBadge status={status} compact />
        </span>
      </div>
      {isLocked ? (
        <div
          data-slot="ai-node-locked"
          className="text-muted-foreground flex flex-col items-center justify-center py-6 text-center"
        >
          <Lock aria-hidden className="mb-2 size-4" />
          {lockedCta ?? <span className="text-xs">Upgrade to unlock this node</span>}
        </div>
      ) : (
        <>
          {media && (
            <div data-slot="ai-node-media" className="px-3 pt-2">
              {media}
            </div>
          )}
          {children && (
            <div data-slot="ai-node-body" className="px-3 py-2">
              {children}
            </div>
          )}
        </>
      )}
      {status === "failed" && (
        <div
          data-slot="ai-node-error"
          className="bg-destructive/10 text-destructive mx-3 mb-2 flex items-start gap-1.5 rounded-md px-2 py-1.5 text-xs"
        >
          <AlertCircle aria-hidden className="mt-0.5 size-3 shrink-0" />
          <span className="line-clamp-3">{error ?? "Generation failed"}</span>
        </div>
      )}
      {footer && !floating && (
        <div
          data-slot="ai-node-footer"
          className="flex items-center justify-between gap-2 border-t px-3 py-2"
        >
          {footer}
        </div>
      )}
    </div>
  );

  if (!floating) return card;
  return (
    <div data-slot="ai-node-frame" className="inline-flex flex-col items-center gap-2">
      {card}
      <div
        data-slot="ai-node-menu"
        className="bg-card text-card-foreground flex items-center gap-2 rounded-full border px-2 py-1 shadow-sm"
      >
        {footer}
      </div>
    </div>
  );
}
```

Changes from the parked file: registry imports; `text-[11px]` → `text-xs`; `transition` → `transition-shadow`; `menuPlacement` and the frame/menu slots are new; `bg-card` with `text-muted-foreground` in the header is not a muted surface (TOK-4/TOK-6 pair only `bg-muted`, `bg-accent`, `bg-secondary`).

- [ ] **Step 4: Run the tests and gates**

Run: `cd apps/docs && pnpm vitest run registry/super-ai/ai-node.test.tsx registry/super-ai/flow-boundary.test.ts && pnpm typecheck && pnpm check:tokens`
Expected: PASS, 10 + 1 tests.

- [ ] **Step 5: Write the demo**

Overwrite `apps/docs/components/demos/ai-node-demo.tsx` with the parked demo, changing the import to `@/registry/super-ai/ai-node`, the footer text class from `text-[11px] text-muted-foreground` to `text-muted-foreground text-xs`, the `MediaPlaceholder` class to `bg-muted aspect-video w-full rounded-md`, and adding one more card at the end of the grid:

```tsx
<AiNode
  id="demo-floating"
  title="Speech"
  modelLabel="Eleven v3"
  runtime="cloud"
  status="done"
  size="sm"
  menuPlacement="floating"
  footer={<span className="text-muted-foreground text-xs">Eleven v3 · Download · Delete</span>}
>
  <MediaPlaceholder />
</AiNode>
```

- [ ] **Step 6: Write the docs module**

Overwrite `apps/docs/content/components/ai-node.docs.tsx`:

```tsx
import type { ComponentDocs } from "@/lib/component-docs";

import { AiNode } from "@/registry/super-ai/ai-node";

/** Seeded from docs/design-system/component-specs.md#g2-ai-node. Static examples only; no sidecar. */
export const AiNodeDocs: ComponentDocs = {
  whatItIs:
    "The card every node on the canvas is made of: a header with the title, model label and status badge, a media slot, a body slot, an optional footer that can dock inside the card or float below it as a pill, and two whole-card states, locked and failed, that replace or annotate the body. It is one component with slots, not ten presets.",
  whyItMatters:
    "ElevenLabs Flows and Freepik Flows ship one node shell and fill it per modality, and the recut that produced this catalog took Flow Kit from twenty-five items to nine plus a hook on exactly that observation. The shell owns status, selection, locking and failure so that thirteen modality presets cannot each draw a slightly different error banner.",
  evidence: ["ElevenLabs Flows", "Freepik Flows"],
  anatomy: [
    {
      slot: "ai-node",
      note: 'The card: a group named "<title> node, <status>", with data-status and data-node-id. Width comes from size, never from content.',
    },
    {
      slot: "ai-node-header",
      note: "Title, model label with the Local suffix, and a compact node-status badge.",
    },
    { slot: "ai-node-media", note: "The result. Phase 2's modality-node puts result-card here." },
    { slot: "ai-node-body", note: "The controls. Phase 2 puts media-prompt-bar (node-embedded) here." },
    { slot: "ai-node-error", note: "The failed banner, three lines max, painted from --destructive at 10%." },
    {
      slot: "ai-node-footer",
      note: "The docked footer under a border: run-button and gen-settings-bar in phase 2.",
    },
    {
      slot: "ai-node-menu",
      note: "The same footer as a floating pill below the card when menuPlacement is floating.",
    },
    {
      slot: "ai-node-frame",
      note: "The wrapper that stacks card and pill in floating placement. Only present then.",
    },
    {
      slot: "ai-node-locked",
      note: "Replaces media and body when status is locked; lockedCta replaces its copy.",
    },
  ],
  usage:
    'Use it as the shell for any node component; do not draw a node card of your own. Pass `status` straight from useFlowRunner, `selected` from the canvas, and fill the slots with shipped components: media-prompt-bar for the prompt, result-card for the result, run-button and gen-settings-bar in the footer. Pick `menuPlacement="floating"` when the settings pill should read as attached to the canvas rather than inside the card, which is the FilmMaker placement. Give it the size the modality needs; width is not content-driven.',
  dos: [
    {
      text: "Let the shell own failure: pass `error` and the banner appears under the body with the status ring.",
      example: (
        <AiNode
          id="doc-failed"
          title="Image"
          modelLabel="Flux 1.1"
          status="failed"
          size="sm"
          error="Provider rate limit exceeded, retry in 30 seconds."
        >
          <div className="bg-muted aspect-video w-full rounded-md" />
        </AiNode>
      ),
    },
  ],
  donts: [
    {
      text: "Don't render a footer and a floating menu from two different sources; there is one `footer` prop and `menuPlacement` only moves it.",
      example: (
        <AiNode
          id="doc-floating"
          title="Speech"
          status="done"
          size="sm"
          menuPlacement="floating"
          footer={<span className="text-muted-foreground text-xs">Eleven v3</span>}
        >
          <div className="bg-muted h-8 w-full rounded-md" />
        </AiNode>
      ),
    },
  ],
  accessibility: {
    keyboard: [
      "The card itself is not focusable and has no keys. Every tab stop inside a node belongs to slot content: the run button, the prompt, the settings bar. Selection by keyboard is the canvas's job.",
    ],
    screenReader: [
      'The card is a group whose name is the title plus the status word, so arriving on it reads "Video node, Running". The header\'s badge is aria-live polite, so a status change is announced once.',
      'The locked block replaces the body entirely; a locked node announces its title, the status "Upgrade to run", and then the lock copy or the lockedCta you pass.',
    ],
  },
  pitfalls: [
    "selected and the status ring share the same ring slot; selected wins and hides the status ring on purpose, because a selected node is being looked at and its badge still shows the status.",
    "In floating placement the group no longer contains the footer. A test that looks for the run button inside the group finds nothing; query the ai-node-frame instead.",
    "Width is fixed by size (280, 320 or 420). A footer wider than that overflows; the phase 1 story RunButtonInFooter measures E5 at sm and records the result in CONTINUE.md §8.",
  ],
};
```

- [ ] **Step 7: Write the story**

Overwrite `apps/storybook/src/stories/super-ai/AiNode.stories.tsx`:

```tsx
import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { expect, within } from "storybook/test";

import { AiNode } from "@/registry/super-ai/ai-node";
import { RunButton } from "@/registry/super-ai/run-button";
import { AiNodeDocs } from "@/content/components/ai-node.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const Media = () => <div className="bg-muted aspect-video w-full rounded-md" />;
const base = {
  id: "n1",
  title: "Video",
  modelLabel: "Veo 3.1 Fast",
  runtime: "cloud" as const,
  size: "sm" as const,
};

const meta: Meta<typeof AiNode> = {
  title: "Super AI/AI Node",
  component: AiNode,
  parameters: { layout: "centered", docs: { page: componentDocsPage(AiNodeDocs) } },
  args: { ...base, children: <Media /> },
};

export default meta;
type Story = StoryObj<typeof AiNode>;

/** At rest: no ring, a neutral dot in the header, the body showing an empty result. */
export const Idle: Story = { args: { status: "idle" } };

/** Waiting on an upstream node: the queued ring at 40%, nothing else moves. */
export const Queued: Story = { args: { status: "queued" } };

/** Running: the streaming ring and the header spinner. The badge word is "Running". */
export const Streaming: Story = { args: { status: "streaming" } };

/** Finished: no ring, a green dot. The result now lives in media, in phase 2 as result-card. */
export const Done: Story = { args: { status: "done", media: <Media />, children: undefined } };

/** Failed: the destructive ring, and the error banner under the body clamped to three lines. */
export const Failed: Story = {
  args: { status: "failed", error: "Provider rate limit exceeded, retry in 30 seconds." },
};

/** Locked: media and body are replaced by the lock block; pass lockedCta to say what unlocks it. */
export const Locked: Story = {
  args: { status: "locked", lockedCta: <span className="text-xs">Available on the Pro plan.</span> },
};

/** Selected: the ring token wins over the status ring, so a selected running node shows one ring, not two. */
export const Selected: Story = { args: { status: "streaming", selected: true } };

/** The FilmMaker placement: the footer as a pill below the card, outside the group, inside ai-node-frame. */
export const MenuFloating: Story = {
  args: {
    status: "done",
    menuPlacement: "floating",
    footer: <span className="text-muted-foreground text-xs">Veo 3.1 Fast · 16:9 · 720p</span>,
  },
};

/*
 * Case stories.
 * // case-skip: ReducedMotion — the only animation in the tree is node-status's spinner, which carries its own ReducedMotion story
 * // case-skip: KeyboardOrder — the card owns no focusables; every tab stop is slot content and carries its own story (see RunButtonInFooter for E5)
 * // case-skip: Controlled — no value/onChange pair; status and selected are display props
 * // case-skip: Boundary — `grep -l "role=\"group\"" registry/super-ai/*.tsx` finds no other card that names itself by status; result-card is the result, not the node
 */

/** Under dir="rtl" the header's title and badge swap ends and the error banner's icon leads from the right; padding is symmetric so nothing else moves. */
export const RTL: Story = {
  args: { status: "failed", error: "Provider rate limit exceeded, retry in 30 seconds." },
  render: (args) => (
    <div dir="rtl">
      <AiNode {...args} />
    </div>
  ),
};

/** No model label: the header holds only the title and the badge, with the gap intact. */
export const EmptyLabel: Story = { args: { status: "idle", modelLabel: undefined } };

/** A ~90-character title and error: the title stays on one line by the header's flex, the error clamps at three lines. */
export const LongContent: Story = {
  args: {
    status: "failed",
    title: "Video generation from the storyboard frames with the reference audio attached upstream",
    error:
      "The provider rejected the request because the reference image exceeds the maximum resolution accepted by the selected model version.",
  },
};

/** 375px frame with a sm (280px) node: fits with room; md (320px) also fits; lg (420px) is the size that does not, and is not for phones. */
export const Mobile: Story = {
  args: { status: "streaming" },
  render: (args) => (
    <div data-testid="frame" className="w-[375px] overflow-hidden">
      <AiNode {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const frame = within(canvasElement).getByTestId("frame");
    await expect(frame.scrollWidth).toBeLessThanOrEqual(frame.clientWidth);
  },
};

/**
 * Spec risk 1, measured: E5 run-button in the docked footer of a sm (280px) node.
 * The play asserts the footer does not overflow its card. If this assertion
 * fails, do not loosen it: replace the play with a description that records
 * the measured overflow, and add the §8 entry from Task 12 step 6.
 */
export const RunButtonInFooter: Story = {
  args: { status: "idle", footer: <RunButton state="idle" cost={4} onRun={() => {}} /> },
  play: async ({ canvasElement }) => {
    const footer = canvasElement.querySelector("[data-slot=ai-node-footer]") as HTMLElement;
    await expect(footer.scrollWidth).toBeLessThanOrEqual(footer.clientWidth);
  },
};
```

- [ ] **Step 8: Gates and commit**

Run: `cd apps/docs && pnpm typecheck && pnpm check:tokens && pnpm check:contract 2>&1 | grep "ai-node"; echo "(no ai-node lines means clean)"`

```bash
git add apps/docs/registry/super-ai/ai-node.tsx apps/docs/registry/super-ai/ai-node.test.tsx apps/docs/components/demos/ai-node-demo.tsx apps/docs/content/components/ai-node.docs.tsx apps/storybook/src/stories/super-ai/AiNode.stories.tsx
git commit -m "feat(ai-node): G2, the node card shell with docked or floating menu, ported to contract

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 10: E5 `run-button` keeps its width while running

**Files:**

- Modify: `apps/docs/registry/super-ai/run-button.tsx:200-213` (the label span)
- Modify: `apps/docs/registry/super-ai/run-button.test.tsx` (append one test)
- Modify: `apps/storybook/src/stories/super-ai/RunButton.stories.tsx` (append one story)

**Interfaces:**

- Consumes: nothing new. Produces: no API change; the trigger's rendered width is the same in `idle` and `running`.

- [ ] **Step 1: Write the failing test**

Append to the main `describe` in `apps/docs/registry/super-ai/run-button.test.tsx` (read the file's existing render helper and reuse it; the snippet below assumes a plain `render`):

```tsx
it("running stacks the idle and running labels so the trigger keeps its width", () => {
  const { rerender } = render(<RunButton state="idle" onRun={() => {}} />);
  const label = () => document.querySelector("[data-slot=run-button-label]") as HTMLElement;
  expect(label().querySelector("[data-slot=run-button-label-running]")).toHaveAttribute(
    "aria-hidden",
    "true",
  );
  expect(screen.getByRole("button", { name: "Generate" })).toBeInTheDocument();
  rerender(<RunButton state="running" onRun={() => {}} onCancel={() => {}} />);
  expect(label().querySelector("[data-slot=run-button-label-idle]")).toHaveAttribute("aria-hidden", "true");
  expect(label().querySelector("[data-slot=run-button-label-idle]")).toHaveClass("invisible");
  expect(screen.getByRole("button", { name: "Generating…" })).toBeInTheDocument();
});
```

If the default `label` in the file is not "Generate", use the file's default in the `name` matcher.

- [ ] **Step 2: Run it to verify it fails**

Run: `cd apps/docs && pnpm vitest run registry/super-ai/run-button.test.tsx`
Expected: FAIL, `run-button-label-running` does not exist.

- [ ] **Step 3: Replace the label span**

In `apps/docs/registry/super-ai/run-button.tsx`, replace the block

```tsx
<span data-slot="run-button-label" className="inline-flex items-center gap-1.5">
  {state === "done" ? <Check aria-hidden /> : null}
  {state === "failed" ? <AlertCircle aria-hidden /> : null}
  {state === "done" ? doneLabel : state === "failed" ? failedLabel : isRunning ? runningLabel : label}
</span>
```

with

```tsx
{
  /* Both labels are always in the DOM, stacked in one grid cell,
                    so the trigger is as wide as the wider of the two in every
                    state and never jumps when a run starts (spec: E5 width
                    stability). The inactive one is invisible and aria-hidden,
                    which keeps the accessible name equal to the visible text. */
}
<span data-slot="run-button-label" className="inline-grid items-center *:[grid-area:1/1]">
  <span
    data-slot="run-button-label-idle"
    aria-hidden={isRunning || undefined}
    className={cn("inline-flex items-center gap-1.5", isRunning && "invisible")}
  >
    {state === "done" ? <Check aria-hidden /> : null}
    {state === "failed" ? <AlertCircle aria-hidden /> : null}
    {state === "done" ? doneLabel : state === "failed" ? failedLabel : label}
  </span>
  <span
    data-slot="run-button-label-running"
    aria-hidden={!isRunning || undefined}
    className={cn("inline-flex items-center gap-1.5", !isRunning && "invisible")}
  >
    {runningLabel}
  </span>
</span>;
```

- [ ] **Step 4: Run the whole E5 suite and the gates**

Run: `cd apps/docs && pnpm vitest run registry/super-ai/run-button.test.tsx && pnpm typecheck && pnpm check:tokens && pnpm check:citations 2>/dev/null || tsx scripts/check-citations.mts`
Expected: PASS; every pre-existing E5 test still passes (accessible names are unchanged because the hidden span is aria-hidden). If `check-citations` flags the two new slot names as unreachable from the E5 docs module, they are not cited there, so it will not.

- [ ] **Step 5: Add the width story**

Append to `apps/storybook/src/stories/super-ai/RunButton.stories.tsx`:

```tsx
/**
 * Width stability, measured. The trigger's width in idle equals its width in
 * running, because both labels are stacked in one grid cell. The cancel
 * button that appears beside it is a separate control and is meant to widen
 * the group; only the trigger must hold still.
 */
export const RunningKeepsWidth: Story = {
  render: function Render() {
    const [state, setState] = React.useState<RunButtonState>("idle");
    return (
      <div className="flex flex-col items-start gap-3">
        <RunButton
          state={state}
          cost={4}
          onRun={() => setState("running")}
          onCancel={() => setState("idle")}
        />
        <button
          type="button"
          data-testid="toggle"
          className="text-xs underline"
          onClick={() => setState((s) => (s === "idle" ? "running" : "idle"))}
        >
          toggle
        </button>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = () => canvas.getByRole("button", { name: /Generate|Generating/ });
    const idleWidth = trigger().getBoundingClientRect().width;
    await userEvent.click(canvas.getByTestId("toggle"));
    await waitFor(() => expect(canvas.getByRole("button", { name: "Generating…" })).toBeInTheDocument());
    const runningWidth = trigger().getBoundingClientRect().width;
    await expect(Math.abs(runningWidth - idleWidth)).toBeLessThan(1);
  },
};
```

The file already imports `React`, `expect`, `userEvent`, `waitFor`, `within` and `RunButtonState`.

- [ ] **Step 6: Commit**

```bash
git add apps/docs/registry/super-ai/run-button.tsx apps/docs/registry/super-ai/run-button.test.tsx apps/storybook/src/stories/super-ai/RunButton.stories.tsx
git commit -m "fix(run-button): keep the trigger's width while running

Both labels stay in the DOM, stacked in one grid cell, the inactive one
invisible and aria-hidden. Adopted from the FilmMaker run button (spec,
changes to shipped items).

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 11: A2 `cost-chip` wording rule

**Files:**

- Modify: `apps/docs/content/components/cost-chip.docs.tsx` (`dos`, `pitfalls`)

- [ ] **Step 1: Add the rule as a do and a pitfall**

In `apps/docs/content/components/cost-chip.docs.tsx`, append to `dos`:

```tsx
    {
      text: "State the number, even when it is zero. A free run prints \"0 credits\"; never swap the number for a word like free, cheap or some, because the chip is a price and a word is a claim.",
      example: <CostChip amount={0} />,
    },
```

and append to `pitfalls`:

```ts
    "There is no free variant. A zero renders as \"0 credits\", which is deliberate: the FilmMaker run-cost spec ruled that the number is stated and never replaced by a word, and this registry keeps that rule. If a surface needs to say free, it says it beside the chip, not instead of it.",
```

- [ ] **Step 2: Verify the citation gate and commit**

Run: `cd apps/docs && tsx scripts/check-citations.mts 2>&1 | grep "cost-chip"; echo "(no cost-chip lines means clean)"`

```bash
git add apps/docs/content/components/cost-chip.docs.tsx
git commit -m "docs(cost-chip): state the number, never a word; zero renders as 0 credits

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 12: Integrate, run every gate, record, open the PR

This is the integrator's task (CONTINUE.md §3.5 and §3.6). Run from the repo root unless a step says otherwise.

**Files:**

- Modify: `apps/docs/lib/catalog.manifest.ts` (five statuses → `shipped`, deps reconciled)
- Modify: `apps/docs/lib/demos.generated.ts`, `apps/docs/lib/docs.generated.ts` (regenerated)
- Modify: `apps/docs/scripts/lib/story-coverage.baseline.json` (only if it shrinks)
- Modify: `docs/CONTINUE.md` §1 and §8

- [ ] **Step 1: Reconcile declared dependencies against real imports**

```bash
cd apps/docs
for n in node-status typed-handle typed-edge connection-hint ai-node; do
  printf "%-18s " "$n"
  grep -h 'from "' registry/super-ai/$n.tsx | sed 's/.*from "//;s/".*//' \
    | grep -E '^@/components/ui/|^@/registry/super-ai/|lucide-react|^@base-ui|^@xyflow' | sort -u | tr '\n' ' '; echo
done
```

Expected, and what the manifest must say (`shadcn` / `consumes` / `npm`):

- `node-status`: `[]` / `["flow-types"]` / `["lucide-react"]`
- `typed-handle`: `[]` / `["flow-types"]` / `["@xyflow/react"]`
- `typed-edge`: `[]` / `["flow-types"]` / `["@xyflow/react"]`
- `connection-hint`: `[]` / `["flow-types"]` / `[]`
- `ai-node`: `[]` / `["flow-types", "node-status"]` / `["lucide-react"]`

Set them in `lib/catalog.manifest.ts` if they differ, then flip the five `status: "building"` to `"shipped"`. Then:

```bash
pnpm reconcile:deps
pnpm gen:wiring
pnpm check:contract
pnpm story-coverage:report node-status typed-handle typed-edge connection-hint ai-node
```

Expected: `reconcile:deps` reports no drift; `check:contract` exits 0; the coverage report lists 5 items with 0 unmet obligations and exits 0.

- [ ] **Step 2: Shrink the story-coverage baseline if it can shrink**

```bash
cd apps/docs && pnpm story-coverage:baseline
```

Expected: either "wrote N unmet obligation(s)" with N ≤ the previous count, or "refusing to grow" (which means a new item has an unmet obligation; fix the story, never hand-edit the JSON).

- [ ] **Step 3: Run the CI gate list, in ci.yml order, from the repo root**

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm format:check || (pnpm format && pnpm format:check)
pnpm typecheck
pnpm check:tokens
pnpm check:contract
pnpm test
pnpm build:registry
pnpm build
```

Expected: every command exits 0. `format:check` may need one `pnpm format` pass for the new files; commit the result in step 7. `pnpm test` runs the docs vitest suite including `flow-boundary.test.ts`.

- [ ] **Step 4: Playwright smoke, Storybook a11y and interaction, consumer install**

```bash
cd apps/docs && pnpm exec playwright test
cd ../storybook && rm -rf node_modules/.cache/storybook && pnpm test:stories
cd ../docs && ./scripts/consumer-test.sh
```

Expected: all three green. `test:stories` runs every play function above, including `RunningKeepsWidth`, `KeyboardOrder` on the hint, and `RunButtonInFooter`. The consumer test installs every registry item into a fresh app, which is where `@xyflow/react` arriving as a dependency of `typed-handle` and the `css` keyframes block landing in the consumer's stylesheet are proven. If the Storybook gate is red on Linux-only pixel pins, run `./scripts/linux-gate.sh` from the root, which is the CI image.

- [ ] **Step 5: Extend the consumer test's stylesheet assertions**

In `apps/docs/scripts/consumer-test.sh`, after the `--color-warning` check, add:

```bash
if ! grep -qF -e "--flow-image" "$GLOBAL_CSS"; then
  echo "CONSUMER INSTALL TEST: FAIL — $GLOBAL_CSS is missing --flow-image (typed-handle's cssVars did not install)" >&2
  exit 1
fi
echo "  found --flow-image in $GLOBAL_CSS"
if ! grep -qF -e "flow-dash" "$GLOBAL_CSS"; then
  echo "CONSUMER INSTALL TEST: FAIL — $GLOBAL_CSS is missing @keyframes flow-dash (typed-edge's css block did not install)" >&2
  exit 1
fi
echo "  found flow-dash keyframes in $GLOBAL_CSS"
```

Re-run `./scripts/consumer-test.sh` and expect PASS with both new "found" lines.

- [ ] **Step 6: Record the outcome in CONTINUE.md**

In `docs/CONTINUE.md` §1 (`## 1. Where things stand`), add at the top of the section:

```markdown
**2026-09-13, family G phase 1 (D23).** The spine is on main: `flow-types` and
`use-flow-runner` as lib contracts, `node-status`, `typed-handle`, `typed-edge`,
`connection-hint`, `ai-node` as G11, G3, G10, G12, G2. `@xyflow/react` is a
dependency of exactly two registry files, pinned by
`registry/super-ai/flow-boundary.test.ts`. Catalog 116 → 125 in scope (5 shipped,
4 planned for phase 2). Next: phase 2 (`modality-node`, `flow-canvas`,
`node-palette`, `canvas-toolbar`, `flow-shell`) and phase 3 (13 modality presets)
run in parallel off this; plan them from
`docs/superpowers/specs/2026-09-13-family-g-revival-design.md`.
```

In §8, add an entry with the measured result of `RunButtonInFooter`. If the play passed:

```markdown
- **E5 `run-button` in a 280px node footer: fits.** Measured by
  `AiNode.stories.tsx` `RunButtonInFooter` on 2026-09-13 (footer scrollWidth ≤
  clientWidth with `cost={4}`). Spec risk 1 closed; no compact size needed for
  phase 2.
```

If it failed and the story now records the overflow instead:

```markdown
- **E5 `run-button` overflows a 280px node footer.** Measured by
  `AiNode.stories.tsx` `RunButtonInFooter` on 2026-09-13: with `cost={4}` the
  footer's scrollWidth exceeds its clientWidth by <N>px. Spec risk 1, open. Phase 2
  docks E5 in the footer at `md` and above only until E5 gains a compact
  configuration (reported here rather than forked, per block-build-brief).
```

- [ ] **Step 7: Commit, push the branch, open the PR**

```bash
git add -A
git commit -m "feat(family-g): phase 1 spine shipped, gates green, D23 recorded

Five components (G2, G3, G10, G11, G12) and two lib contracts on main.
Consumer test now asserts the --flow-* scale and the flow-dash keyframes
install. CONTINUE §1 and §8 updated with the E5 footer measurement.

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
git remote -v   # must be VV-DSGN-INC/Super-AI-Components
git push -u origin HEAD
gh pr create --base main --title "feat(family-g): phase 1 spine, reversing D9" --body "$(cat <<'EOF'
## Summary
- D23 reverses D9: family G is back in scope; four items dissolve into shipped components (E5, D1/A7, F1, I2) rather than returning
- Ports the wave-2 spine from `wave-2-flow-foundation` at `b414ac9` into the five-file contract: `node-status`, `typed-handle`, `typed-edge`, `connection-hint`, `ai-node`, plus `flow-types` and `use-flow-runner` as `registry:lib` contracts
- `@xyflow/react` confined to two files, pinned by `flow-boundary.test.ts`; the `--flow-*` scale and the `flow-dash` keyframes ship as registry `cssVars`/`css` and are asserted by the consumer test
- E5 `run-button` keeps its width while running; A2 `cost-chip` guidance states the number rule

Spec: `docs/superpowers/specs/2026-09-13-family-g-revival-design.md`. Plan: `docs/superpowers/plans/2026-09-13-family-g-revival-phase-1.md`.

## Test plan
- [ ] All twelve CI gates green
- [ ] `./scripts/consumer-test.sh` finds `--flow-image` and `flow-dash` in the consumer stylesheet
- [ ] `RunButtonInFooter` outcome recorded in CONTINUE §8

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

Do not merge, do not deploy; both are Nick's call (CLAUDE.md, deploys are manual and need the `weeeha` account).
