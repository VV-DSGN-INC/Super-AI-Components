# Marketing Mini-Components Wave 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build 15 marketing mini-components (rebuilt from scratch, Magic UI as behavioral reference only) as a new `Marketing` tier: source of truth + tests in `apps/docs/registry/marketing/`, docs pages, installable registry items, and a new Storybook section.

**Architecture:** Components follow the Super AI idiom (named exports, `data-slot` contract, `cn()`, shadcn tokens only in TSX). Signature palettes and all keyframes live in one shared `marketing.css` (duplicated to both apps, sliced per-item into the registry by marker comments). CSS-first animation; `motion` v12 only where JS orchestration is required. Every animated component honors `prefers-reduced-motion` by rendering final state — which is also the deterministic branch tests use.

**Tech Stack:** React 19, Tailwind v4, motion@12, canvas-confetti, cva, vitest 4 + Testing Library (jsdom), shadcn registry (`shadcn build`), Storybook 9, turbo/pnpm workspace.

**Spec:** `docs/superpowers/specs/2026-07-31-marketing-mini-components-design.md`

---

## File Map

**Created (docs app — source of truth):**

| Path | Responsibility |
| --- | --- |
| `apps/docs/app/marketing.css` | All marketing keyframes, structural classes, palette custom props, reduced-motion gates. Marker comments (`/* == <name> == */`) delimit per-item slices for the registry generator. |
| `apps/docs/registry/marketing/<name>.tsx` ×15 | Component source of truth |
| `apps/docs/registry/marketing/<name>.test.tsx` ×15 | Co-located vitest tests |
| `apps/docs/components/demos/<name>-demo.tsx` ×15 | Docs page demo (also read as the code tab) |
| `apps/docs/lib/marketing-catalog.ts` | `MarketingItem` type + `MARKETING_ITEMS` list (grows one entry per component task) |

**Created (storybook app — showcase copies):**

| Path | Responsibility |
| --- | --- |
| `apps/storybook/src/marketing.css` | Verbatim copy of `apps/docs/app/marketing.css` |
| `apps/storybook/src/components/marketing/<name>.tsx` ×15 | Verbatim copy of registry component |
| `apps/storybook/src/components/marketing/demos/<name>-demo.tsx` ×15 | Verbatim copy of demo |
| `apps/storybook/src/stories/marketing/<Name>.stories.tsx` ×15 | Story: `Marketing/<Group>/<Name>` |

**Modified:**

| Path | Change |
| --- | --- |
| `apps/docs/package.json` | + `motion`, `canvas-confetti`, `@types/canvas-confetti` |
| `apps/storybook/package.json` | + `canvas-confetti`, `@types/canvas-confetti` (motion already present) |
| `apps/docs/app/globals.css` | `@import "../app/marketing.css"` → actually `@import "./marketing.css";` after the existing imports |
| `apps/storybook/src/index.css` | `@import "./marketing.css";` after the existing imports |
| `apps/docs/lib/catalog.ts` | untouched — marketing gets its own module to keep the Super AI catalog clean |
| `apps/docs/components/docs-nav.tsx` | Render `Marketing · <Group>` sidebar groups from `MARKETING_ITEMS` |
| `apps/docs/app/components/[name]/page.tsx` | Route over super-ai + marketing names; `marketingDemos` map (one entry per component task) |
| `apps/docs/scripts/gen-registry.mts` | Second pass over `MARKETING_ITEMS`; item-level `css` support (sliced from marketing.css); marketing extras (npm deps) |
| `apps/docs/scripts/check-tokens.mjs` | Glob widens to `registry/{super-ai,marketing}` |
| `apps/docs/vitest.setup.ts` | + `IntersectionObserver` stub (same `??=` shim pattern) |
| `apps/storybook/.storybook/preview.tsx` | `storySort.order` + `"Marketing"` |

**Component build order** (easiest first to prove the pattern): dot-pattern → pulsating-button → ripple-button → rainbow-button → marquee → orbiting-circles → border-beam → aurora-text → bento-grid → number-ticker → typing-animation → text-animate → terminal → hero-video-dialog → confetti.

**Conventions used by every component task (read once, applies 15×):**

1. TDD: write `registry/marketing/<name>.test.tsx` first, watch it fail, then implement `registry/marketing/<name>.tsx` until green.
2. Run tests from `apps/docs`: `pnpm --filter docs test -- run registry/marketing/<name>.test.tsx` (or `cd apps/docs && pnpm vitest run registry/marketing/<name>.test.tsx`).
3. Wiring per component (shown in full in each task): entry appended to `MARKETING_ITEMS`; demo file; import + entry in `page.tsx` `marketingDemos`; extras in `gen-registry.mts` **only if** the item has npm deps.
4. Copies: `cp` the component and demo into the storybook app (exact commands in each task), then create the story file.
5. Gate before each commit: `pnpm --filter docs typecheck && pnpm --filter storybook typecheck && pnpm --filter docs check:tokens && pnpm --filter docs test`.
6. Commit message pattern: `feat(marketing): <name> — component, tests, demo, story, registry entry`.
7. **Copy + story template** — where a task says "Copy + story (`<Title path>`, `<File>.stories.tsx`, same pattern)", instantiate exactly this with the task's values (`<name>` kebab, `<Name>` Pascal, `<Group>`, `<Title>`):

```bash
cp apps/docs/registry/marketing/<name>.tsx apps/storybook/src/components/marketing/<name>.tsx
sed 's|@/registry/marketing/|@/components/marketing/|' apps/docs/components/demos/<name>-demo.tsx > apps/storybook/src/components/marketing/demos/<name>-demo.tsx
```

`apps/storybook/src/stories/marketing/<Name>.stories.tsx`:

```tsx
import type { Meta, StoryObj } from "@storybook/react-vite";

import <Name>Demo from "@/components/marketing/demos/<name>-demo";

const meta: Meta<typeof <Name>Demo> = {
  title: "Marketing/<Group>/<Title>",
  component: <Name>Demo,
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof <Name>Demo>;

export const Default: Story = {};
```

And the `page.tsx` wiring always means: add `import <Name>Demo from "@/components/demos/<name>-demo";` with the other demo imports, plus the `"<name>": <Name>Demo,` entry inside `marketingDemos`.

---

### Task 1: Dependencies

**Files:**
- Modify: `apps/docs/package.json`
- Modify: `apps/storybook/package.json`

- [ ] **Step 1.1: Install new deps**

```bash
cd "$(git rev-parse --show-toplevel)"
pnpm --filter docs add motion canvas-confetti
pnpm --filter docs add -D @types/canvas-confetti
pnpm --filter storybook add canvas-confetti
pnpm --filter storybook add -D @types/canvas-confetti
```

- [ ] **Step 1.2: Verify versions landed**

Run: `grep -E '"(motion|canvas-confetti)"' apps/docs/package.json apps/storybook/package.json`
Expected: `motion` (^12.x) in docs dependencies; `canvas-confetti` in both; `@types/canvas-confetti` in both devDependencies. (`apps/storybook` already has `motion@^12` — do not add it again.)

- [ ] **Step 1.3: Commit**

```bash
git add apps/docs/package.json apps/storybook/package.json pnpm-lock.yaml
git commit -m "chore(marketing): add motion + canvas-confetti deps for wave 1"
```

---

### Task 2: marketing.css (palette, keyframes, reduced-motion gates)

**Files:**
- Create: `apps/docs/app/marketing.css`
- Create: `apps/storybook/src/marketing.css` (copy)
- Modify: `apps/docs/app/globals.css` (add import line)
- Modify: `apps/storybook/src/index.css` (add import line)

The `/* == <name> == */` markers are load-bearing: Task 6's generator slices this file into
per-registry-item `css` payloads by those markers, and `== shared ==` ships with every item.
The palette block is **the designer knob** — defaults derive from the theme's `--chart-*`
variables so light/dark both work with zero raw color values; Nick can retune the mapping
in one place later without touching any TSX.

- [ ] **Step 2.1: Create `apps/docs/app/marketing.css`** with exactly:

```css
/* Marketing components — shared stylesheet.
   Sliced into per-registry-item css by scripts/gen-registry.mts using the
   `== name ==` markers. `== shared ==` ships with every marketing item. */

/* == shared == */
:root {
  --marketing-rainbow-1: var(--chart-1);
  --marketing-rainbow-2: var(--chart-2);
  --marketing-rainbow-3: var(--chart-3);
  --marketing-rainbow-4: var(--chart-4);
  --marketing-rainbow-5: var(--chart-5);
  --marketing-aurora-1: var(--chart-1);
  --marketing-aurora-2: var(--chart-2);
  --marketing-aurora-3: var(--chart-4);
  --marketing-aurora-4: var(--chart-5);
  --marketing-beam-from: var(--chart-2);
  --marketing-beam-to: var(--chart-5);
  --marketing-pulse-color: var(--primary);
  --marketing-ripple-color: var(--primary);
}

/* == marquee == */
@keyframes marketing-marquee {
  from { transform: translateX(0); }
  to { transform: translateX(calc(-100% - var(--marketing-marquee-gap, 1rem))); }
}
@keyframes marketing-marquee-vertical {
  from { transform: translateY(0); }
  to { transform: translateY(calc(-100% - var(--marketing-marquee-gap, 1rem))); }
}
.marketing-marquee-track {
  animation: marketing-marquee var(--marketing-marquee-duration, 40s) linear infinite;
}
.marketing-marquee-track[data-orientation="vertical"] {
  animation-name: marketing-marquee-vertical;
}
.marketing-marquee-track[data-reverse="true"] {
  animation-direction: reverse;
}
[data-slot="marquee"][data-pause-on-hover="true"]:hover .marketing-marquee-track {
  animation-play-state: paused;
}
@media (prefers-reduced-motion: reduce) {
  .marketing-marquee-track { animation: none; }
}

/* == orbiting-circles == */
@keyframes marketing-orbit {
  from {
    transform: rotate(calc(var(--marketing-orbit-angle, 0) * 1deg))
      translateY(calc(var(--marketing-orbit-radius, 80) * 1px))
      rotate(calc(var(--marketing-orbit-angle, 0) * -1deg));
  }
  to {
    transform: rotate(calc(var(--marketing-orbit-angle, 0) * 1deg + 360deg))
      translateY(calc(var(--marketing-orbit-radius, 80) * 1px))
      rotate(calc(var(--marketing-orbit-angle, 0) * -1deg - 360deg));
  }
}
.marketing-orbit-item {
  animation: marketing-orbit calc(var(--marketing-orbit-duration, 20) * 1s) linear infinite;
  animation-delay: calc(var(--marketing-orbit-delay, 0) * 1s);
}
.marketing-orbit-item[data-reverse="true"] { animation-direction: reverse; }
@media (prefers-reduced-motion: reduce) {
  .marketing-orbit-item { animation: none; }
}

/* == border-beam == */
@keyframes marketing-border-beam { to { offset-distance: 100%; } }
.marketing-border-beam {
  offset-path: rect(0 auto auto 0 round var(--marketing-beam-radius, 12px));
  background: linear-gradient(
    to left,
    var(--marketing-beam-from),
    var(--marketing-beam-to),
    transparent
  );
  animation: marketing-border-beam calc(var(--marketing-beam-duration, 6) * 1s) linear infinite;
  animation-delay: calc(var(--marketing-beam-delay, 0) * 1s);
}
@media (prefers-reduced-motion: reduce) {
  .marketing-border-beam { display: none; }
}

/* == aurora-text == */
@keyframes marketing-aurora {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}
.marketing-aurora-text {
  background-image: linear-gradient(
    90deg,
    var(--marketing-aurora-1),
    var(--marketing-aurora-2),
    var(--marketing-aurora-3),
    var(--marketing-aurora-4),
    var(--marketing-aurora-1)
  );
  background-size: 200% auto;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  animation: marketing-aurora calc(var(--marketing-aurora-duration, 8) * 1s) ease-in-out infinite;
}
@media (prefers-reduced-motion: reduce) {
  .marketing-aurora-text { animation: none; }
}

/* == rainbow-button == */
@keyframes marketing-rainbow {
  from { background-position: 0 0, 0% 0; }
  to { background-position: 0 0, 200% 0; }
}
.marketing-rainbow-button {
  border: 2px solid transparent;
  background:
    linear-gradient(var(--primary), var(--primary)) padding-box,
    linear-gradient(
        90deg,
        var(--marketing-rainbow-1),
        var(--marketing-rainbow-2),
        var(--marketing-rainbow-3),
        var(--marketing-rainbow-4),
        var(--marketing-rainbow-5),
        var(--marketing-rainbow-1)
      )
      border-box;
  background-size: 100% 100%, 200% 100%;
  animation: marketing-rainbow var(--marketing-rainbow-speed, 3s) linear infinite;
}
.marketing-rainbow-button[data-variant="outline"] {
  background:
    linear-gradient(var(--background), var(--background)) padding-box,
    linear-gradient(
        90deg,
        var(--marketing-rainbow-1),
        var(--marketing-rainbow-2),
        var(--marketing-rainbow-3),
        var(--marketing-rainbow-4),
        var(--marketing-rainbow-5),
        var(--marketing-rainbow-1)
      )
      border-box;
  background-size: 100% 100%, 200% 100%;
}
.marketing-rainbow-glow {
  background: linear-gradient(
    90deg,
    var(--marketing-rainbow-1),
    var(--marketing-rainbow-2),
    var(--marketing-rainbow-3),
    var(--marketing-rainbow-4),
    var(--marketing-rainbow-5),
    var(--marketing-rainbow-1)
  );
  background-size: 200% 100%;
  animation: marketing-rainbow var(--marketing-rainbow-speed, 3s) linear infinite;
  filter: blur(0.75rem);
  opacity: 0.5;
}
@media (prefers-reduced-motion: reduce) {
  .marketing-rainbow-button, .marketing-rainbow-glow { animation: none; }
}

/* == pulsating-button == */
@keyframes marketing-pulse {
  from { transform: scale(1); opacity: 0.6; }
  to { transform: scale(1.35); opacity: 0; }
}
.marketing-pulse-halo {
  background: var(--marketing-pulse-color);
  animation: marketing-pulse calc(var(--marketing-pulse-duration, 1.5) * 1s) ease-out infinite;
}
@media (prefers-reduced-motion: reduce) {
  .marketing-pulse-halo { display: none; }
}

/* == ripple-button == */
@keyframes marketing-ripple {
  to { transform: scale(4); opacity: 0; }
}
.marketing-ripple {
  position: absolute;
  border-radius: 9999px;
  background: var(--marketing-ripple-color);
  opacity: 0.3;
  transform: scale(0);
  animation: marketing-ripple 0.6s ease-out forwards;
  pointer-events: none;
}

/* == dot-pattern == */
.marketing-dot-fade {
  mask-image: radial-gradient(ellipse at center, black 30%, transparent 70%);
  -webkit-mask-image: radial-gradient(ellipse at center, black 30%, transparent 70%);
}
```

- [ ] **Step 2.2: Import it in `apps/docs/app/globals.css`** — directly after the existing top `@import` lines, add:

```css
@import "./marketing.css";
```

- [ ] **Step 2.3: Copy to storybook and import**

```bash
cp apps/docs/app/marketing.css apps/storybook/src/marketing.css
```

In `apps/storybook/src/index.css`, after the existing `@import` lines, add:

```css
@import "./marketing.css";
```

- [ ] **Step 2.4: Verify both apps still build their CSS**

Run: `pnpm --filter docs typecheck && pnpm --filter storybook typecheck && pnpm --filter storybook build`
Expected: green (typecheck unaffected; storybook build proves the Vite/Tailwind pipeline accepts the file).

- [ ] **Step 2.5: Commit**

```bash
git add apps/docs/app/marketing.css apps/docs/app/globals.css apps/storybook/src/marketing.css apps/storybook/src/index.css
git commit -m "feat(marketing): shared marketing.css — palette knobs, keyframes, reduced-motion gates"
```

---

### Task 3: Marketing catalog module + docs nav + component page routing

**Files:**
- Create: `apps/docs/lib/marketing-catalog.ts`
- Modify: `apps/docs/components/docs-nav.tsx`
- Modify: `apps/docs/app/components/[name]/page.tsx`
- Modify: `apps/docs/vitest.setup.ts`

- [ ] **Step 3.1: Create `apps/docs/lib/marketing-catalog.ts`**

```ts
export interface MarketingItem {
  name: string;
  title: string;
  description: string;
  group: "Layout" | "Text" | "Buttons" | "Effects";
}

// Grows one entry per component task (Tasks 6–20). Order within a group = sidebar order.
export const MARKETING_ITEMS: MarketingItem[] = [];

export const MARKETING_GROUPS = ["Layout", "Text", "Buttons", "Effects"] as const;
export const MARKETING = MARKETING_ITEMS.map((i) => i.name);
export type MarketingName = string;
```

Note: `MarketingName` stays `string` (not a literal union) because the list grows across
15 tasks; the page routes guard with `MARKETING.includes(name)` at runtime and
`generateStaticParams` enumerates from the list, so type-level exhaustiveness adds nothing
here. This intentionally differs from `CatalogName` — do not "fix" it.

- [ ] **Step 3.2: Add the Marketing groups to `apps/docs/components/docs-nav.tsx`**

Replace the entire file with:

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { CATALOG_ITEMS } from "@/lib/catalog";
import { MARKETING_GROUPS, MARKETING_ITEMS } from "@/lib/marketing-catalog";

const GROUPS = ["Primitives", "Components"] as const;

function NavList({ items, pathname }: { items: { name: string; title: string }[]; pathname: string }) {
  return (
    <ul className="space-y-0.5">
      {items.map((item) => {
        const href = `/components/${item.name}`;
        const isActive = pathname === href;
        return (
          <li key={item.name}>
            <Link
              href={href}
              className={`block rounded-md px-2 py-1.5 text-sm transition-colors ${
                isActive
                  ? "bg-accent text-accent-foreground font-medium"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              {item.title}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function DocsNav() {
  const pathname = usePathname();

  return (
    <nav className="space-y-6">
      {GROUPS.map((group) => (
        <div key={group}>
          <p className="text-muted-foreground mb-1 px-2 text-xs font-semibold uppercase tracking-wider">
            {group}
          </p>
          <NavList items={CATALOG_ITEMS.filter((i) => i.group === group)} pathname={pathname} />
        </div>
      ))}
      {MARKETING_GROUPS.map((group) => {
        const items = MARKETING_ITEMS.filter((i) => i.group === group);
        if (items.length === 0) return null;
        return (
          <div key={group}>
            <p className="text-muted-foreground mb-1 px-2 text-xs font-semibold uppercase tracking-wider">
              Marketing · {group}
            </p>
            <NavList items={items} pathname={pathname} />
          </div>
        );
      })}
    </nav>
  );
}
```

- [ ] **Step 3.3: Route marketing names in `apps/docs/app/components/[name]/page.tsx`**

Three surgical edits (existing super-ai code untouched):

After the existing `CATALOG` import add:

```tsx
import { MARKETING, MARKETING_ITEMS, type MarketingName } from "@/lib/marketing-catalog";
```

After the existing `demos` record add:

```tsx
// Grows one entry per component task (Tasks 6–20).
const marketingDemos: Record<MarketingName, React.ComponentType> = {};
```

Replace the `generateStaticParams` body and the page's guard/lookup so both catalogs route:

```tsx
export function generateStaticParams() {
  return [...CATALOG, ...MARKETING].map((name) => ({ name }));
}
```

```tsx
  const { name } = await params;
  const isMarketing = MARKETING.includes(name);
  if (!CATALOG.includes(name as CatalogName) && !isMarketing) notFound();

  const item = isMarketing
    ? MARKETING_ITEMS.find((i) => i.name === name)!
    : CATALOG_ITEMS.find((i) => i.name === name)!;
  const Demo = isMarketing ? marketingDemos[name] : demos[name as CatalogName];
```

(The rest of the page — demo source read, `PreviewTabs`, install snippet — already works
for both because demos live in the same `components/demos/` dir and install URLs are flat.)

- [ ] **Step 3.4: Add IntersectionObserver stub to `apps/docs/vitest.setup.ts`** (same `??=` shim pattern as the existing stubs; motion's `useInView` needs it). Append:

```ts
class IntersectionObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}
globalThis.IntersectionObserver ??=
  IntersectionObserverStub as unknown as typeof IntersectionObserver;
```

- [ ] **Step 3.5: Verify**

Run: `pnpm --filter docs typecheck && pnpm --filter docs test && pnpm --filter docs build`
Expected: green; docs site builds with empty marketing catalog (sidebar unchanged, no new routes yet).

- [ ] **Step 3.6: Commit**

```bash
git add apps/docs/lib/marketing-catalog.ts apps/docs/components/docs-nav.tsx "apps/docs/app/components/[name]/page.tsx" apps/docs/vitest.setup.ts
git commit -m "feat(marketing): catalog module, sidebar groups, page routing (empty list)"
```

---

### Task 4: Registry generator — marketing pass + per-item css slices

**Files:**
- Modify: `apps/docs/scripts/gen-registry.mts`

- [ ] **Step 4.1: Extend the generator.** Replace the file's content below the existing `extras` block (keep imports, `REGISTRY_URL`, `self`, `file`, `Item`, super-ai `extras` exactly as they are) with:

```ts
// ---------------------------------------------------------------------------
// Marketing tier — registry/marketing/*.tsx, css sliced from app/marketing.css
// ---------------------------------------------------------------------------
import { readFileSync } from "node:fs";
import { MARKETING_ITEMS } from "../lib/marketing-catalog";

const marketingFile = (name: string) => ({
  path: `registry/marketing/${name}.tsx`,
  type: "registry:component",
  target: `components/marketing/${name}.tsx`,
});

// npm deps per marketing item (only items that need them)
const marketingExtras: Record<string, { dependencies?: string[] }> = {
  "number-ticker": { dependencies: ["motion"] },
  "text-animate": { dependencies: ["motion"] },
  terminal: { dependencies: ["motion"] },
  "hero-video-dialog": { dependencies: ["motion"] },
  confetti: { dependencies: ["canvas-confetti"] },
  "rainbow-button": { dependencies: ["class-variance-authority"] },
};

// Slice app/marketing.css into named blocks by `/* == name == */` markers.
// `shared` is prepended to every item that has its own block; items without a
// block (pure-token components) ship no css.
const marketingCssSource = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "../app/marketing.css"),
  "utf8",
);
const cssBlocks = new Map<string, string>();
const marker = /\/\*\s*==\s*([\w-]+)\s*==\s*\*\//g;
{
  const indices: { name: string; start: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = marker.exec(marketingCssSource))) indices.push({ name: m[1], start: m.index });
  indices.forEach((entry, i) => {
    const end = i + 1 < indices.length ? indices[i + 1].start : marketingCssSource.length;
    cssBlocks.set(entry.name, marketingCssSource.slice(entry.start, end).trim());
  });
}
const sharedCss = cssBlocks.get("shared") ?? "";
const marketingCss = (name: string) => {
  const own = cssBlocks.get(name);
  return own ? [sharedCss, own].join("\n\n") : undefined;
};

const marketingItems = MARKETING_ITEMS.map((i) => ({
  name: i.name,
  type: "registry:component" as const,
  title: i.title,
  description: i.description,
  dependencies: marketingExtras[i.name]?.dependencies ?? [],
  registryDependencies: [],
  files: [marketingFile(i.name)],
  ...(marketingCss(i.name) ? { css: marketingCss(i.name) } : {}),
}));
```

Then change the final `registry` object and dupe-check to cover both tiers:

```ts
const superAiItems = items.map((i) => ({
  name: i.name,
  type: i.type ?? "registry:component",
  title: i.title,
  description: i.description,
  dependencies: i.dependencies ?? [],
  registryDependencies: i.registryDependencies ?? [],
  files: [file(i.name)],
}));

const allItems = [...superAiItems, ...marketingItems];
const allNames = allItems.map((i) => i.name);
const allDupes = allNames.filter((n, i) => allNames.indexOf(n) !== i);
if (allDupes.length) throw new Error(`Duplicate item names: ${allDupes.join(", ")}`);

const registry = {
  $schema: "https://ui.shadcn.com/schema/registry.json",
  name: "super-ai",
  homepage: REGISTRY_URL,
  items: allItems,
};
```

(Delete the old `names`/`dupes` block and the old inline `items.map` inside `registry` —
they're replaced by the above. Keep the trailing `writeFileSync`/`console.log`, but update
the log line to `` console.log(`registry.json — ${allItems.length} items (base: ${REGISTRY_URL})`); ``.)

Note on the shadcn schema: item-level `css` in the v4 registry-item schema is an
**object** keyed by at-rule/selector in some CLI versions and a plain string in others.
`shadcn build` (v4.11, pinned here) validates items — if it rejects the string form,
convert `marketingCss()` output to the object form `{ "@layer components": { ... } }`
mechanically at that point. Verification step 4.2 catches this immediately.

- [ ] **Step 4.2: Verify generation + registry build**

Run: `pnpm --filter docs build:registry`
Expected: `registry.json — 9 items` (marketing list still empty), `shadcn build` exits 0, `apps/docs/public/r/*.json` regenerated with 9 files.

- [ ] **Step 4.3: Widen the token lint.** In `apps/docs/scripts/check-tokens.mjs`, change the glob line to:

```js
const FILES = globSync("registry/{super-ai,marketing}/**/*.tsx", {
  exclude: (f) => f.includes(".test."),
});
```

Run: `pnpm --filter docs check:tokens`
Expected: `check:tokens — 9 file(s) clean.` (marketing dir doesn't exist yet — glob yields super-ai only).

- [ ] **Step 4.4: Commit**

```bash
git add apps/docs/scripts/gen-registry.mts apps/docs/scripts/check-tokens.mjs
git commit -m "feat(marketing): registry generator marketing pass with css slices; widen token lint"
```

---

### Task 5: Storybook section registration

**Files:**
- Modify: `apps/storybook/.storybook/preview.tsx`

- [ ] **Step 5.1:** In `preview.tsx`, change the `storySort` order to:

```ts
order: ["Overview", "Super AI", "AI Elements", "shadcn/ui", "Marketing"],
```

- [ ] **Step 5.2: Verify + commit**

Run: `pnpm --filter storybook typecheck`
Expected: green.

```bash
git add apps/storybook/.storybook/preview.tsx
git commit -m "feat(marketing): storybook Marketing section in sort order"
```

---

### Task 6: dot-pattern (Effects)

**Files:**
- Test: `apps/docs/registry/marketing/dot-pattern.test.tsx`
- Create: `apps/docs/registry/marketing/dot-pattern.tsx`
- Create: `apps/docs/components/demos/dot-pattern-demo.tsx`
- Copy: `apps/storybook/src/components/marketing/dot-pattern.tsx`, `.../demos/dot-pattern-demo.tsx`
- Create: `apps/storybook/src/stories/marketing/DotPattern.stories.tsx`
- Modify: `apps/docs/lib/marketing-catalog.ts`, `apps/docs/app/components/[name]/page.tsx`

- [ ] **Step 6.1: Write the failing test** — `apps/docs/registry/marketing/dot-pattern.test.tsx`:

```tsx
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DotPattern } from "./dot-pattern";

describe("DotPattern", () => {
  it("renders an aria-hidden svg with the data-slot contract", () => {
    const { container } = render(<DotPattern />);
    const svg = container.querySelector('[data-slot="dot-pattern"]');
    expect(svg).not.toBeNull();
    expect(svg).toHaveAttribute("aria-hidden", "true");
  });
  it("applies pattern geometry from props", () => {
    const { container } = render(<DotPattern size={24} radius={2} />);
    expect(container.querySelector("pattern")).toHaveAttribute("width", "24");
    expect(container.querySelector("circle")).toHaveAttribute("r", "2");
  });
  it("merges className and toggles the fade mask class", () => {
    const { container } = render(<DotPattern fade className="opacity-50" />);
    const svg = container.querySelector('[data-slot="dot-pattern"]')!;
    expect(svg.classList.contains("marketing-dot-fade")).toBe(true);
    expect(svg.classList.contains("opacity-50")).toBe(true);
  });
});
```

- [ ] **Step 6.2: Run to verify it fails**

Run: `cd apps/docs && pnpm vitest run registry/marketing/dot-pattern.test.tsx`
Expected: FAIL — cannot resolve `./dot-pattern`.

- [ ] **Step 6.3: Implement** — `apps/docs/registry/marketing/dot-pattern.tsx`:

```tsx
import * as React from "react";

import { cn } from "@/lib/utils";

interface DotPatternProps extends React.ComponentProps<"svg"> {
  /** Distance between dot centers, px. */
  size?: number;
  /** Dot radius, px. */
  radius?: number;
  /** Pattern origin offset, px. */
  x?: number;
  y?: number;
  /** Fade the pattern radially from the center. */
  fade?: boolean;
}

function DotPattern({
  size = 16,
  radius = 1,
  x = 0,
  y = 0,
  fade = false,
  className,
  ...props
}: DotPatternProps) {
  const id = React.useId();
  return (
    <svg
      aria-hidden="true"
      data-slot="dot-pattern"
      className={cn(
        "text-muted-foreground/40 pointer-events-none absolute inset-0 size-full",
        fade && "marketing-dot-fade",
        className,
      )}
      {...props}
    >
      <defs>
        <pattern id={id} width={size} height={size} patternUnits="userSpaceOnUse" x={x} y={y}>
          <circle cx={radius} cy={radius} r={radius} fill="currentColor" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}

export { DotPattern };
export type { DotPatternProps };
```

- [ ] **Step 6.4: Run test to verify it passes**

Run: `cd apps/docs && pnpm vitest run registry/marketing/dot-pattern.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 6.5: Wire catalog, page, demo, storybook.**

Append to `MARKETING_ITEMS` in `apps/docs/lib/marketing-catalog.ts`:

```ts
  {
    name: "dot-pattern",
    title: "Dot Pattern",
    description: "SVG dot grid backdrop with optional radial fade.",
    group: "Effects",
  },
```

Create `apps/docs/components/demos/dot-pattern-demo.tsx`:

```tsx
import { DotPattern } from "@/registry/marketing/dot-pattern";
export default function DotPatternDemo() {
  return (
    <div className="bg-background relative flex h-64 w-full items-center justify-center overflow-hidden rounded-xl border">
      <DotPattern fade />
      <p className="z-10 text-2xl font-semibold">Backdrops that behave</p>
    </div>
  );
}
```

In `apps/docs/app/components/[name]/page.tsx` add the import and the `marketingDemos` entry:

```tsx
import DotPatternDemo from "@/components/demos/dot-pattern-demo";
```

```tsx
const marketingDemos: Record<MarketingName, React.ComponentType> = {
  "dot-pattern": DotPatternDemo,
};
```

Copy to storybook (first component task creates the dirs):

```bash
mkdir -p apps/storybook/src/components/marketing/demos apps/storybook/src/stories/marketing
cp apps/docs/registry/marketing/dot-pattern.tsx apps/storybook/src/components/marketing/dot-pattern.tsx
sed 's|@/registry/marketing/|@/components/marketing/|' apps/docs/components/demos/dot-pattern-demo.tsx > apps/storybook/src/components/marketing/demos/dot-pattern-demo.tsx
```

Create `apps/storybook/src/stories/marketing/DotPattern.stories.tsx`:

```tsx
import type { Meta, StoryObj } from "@storybook/react-vite";

import DotPatternDemo from "@/components/marketing/demos/dot-pattern-demo";

const meta: Meta<typeof DotPatternDemo> = {
  title: "Marketing/Effects/Dot Pattern",
  component: DotPatternDemo,
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof DotPatternDemo>;

export const Default: Story = {};
```

- [ ] **Step 6.6: Gate + commit**

Run: `pnpm --filter docs typecheck && pnpm --filter storybook typecheck && pnpm --filter docs check:tokens && pnpm --filter docs test`
Expected: all green; check:tokens now reports 10 files clean.

```bash
git add apps/docs/registry/marketing/dot-pattern.tsx apps/docs/registry/marketing/dot-pattern.test.tsx apps/docs/components/demos/dot-pattern-demo.tsx apps/docs/lib/marketing-catalog.ts "apps/docs/app/components/[name]/page.tsx" apps/storybook/src/components/marketing apps/storybook/src/stories/marketing
git commit -m "feat(marketing): dot-pattern — component, tests, demo, story, registry entry"
```

---

### Task 7: pulsating-button (Buttons)

**Files:** same shape as Task 6 with name `pulsating-button` / `PulsatingButton` / story `Marketing/Buttons/Pulsating Button`.

- [ ] **Step 7.1: Write the failing test** — `apps/docs/registry/marketing/pulsating-button.test.tsx`:

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PulsatingButton } from "./pulsating-button";

describe("PulsatingButton", () => {
  it("renders children in a button with the data-slot contract", () => {
    render(<PulsatingButton>Claim access</PulsatingButton>);
    const button = screen.getByRole("button", { name: "Claim access" });
    expect(button).toHaveAttribute("data-slot", "pulsating-button");
  });
  it("renders an aria-hidden halo and exposes the duration knob", () => {
    render(<PulsatingButton duration={2}>Go</PulsatingButton>);
    const button = screen.getByRole("button");
    const halo = button.querySelector('[data-slot="pulsating-button-halo"]')!;
    expect(halo).toHaveAttribute("aria-hidden", "true");
    expect(button.style.getPropertyValue("--marketing-pulse-duration")).toBe("2");
  });
  it("merges className and forwards onClick", () => {
    const onClick = vi.fn();
    render(
      <PulsatingButton className="w-full" onClick={onClick}>
        Go
      </PulsatingButton>,
    );
    const button = screen.getByRole("button");
    expect(button.classList.contains("w-full")).toBe(true);
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 7.2: Run to verify it fails** (same command shape as 6.2). Expected: FAIL — cannot resolve `./pulsating-button`.

- [ ] **Step 7.3: Implement** — `apps/docs/registry/marketing/pulsating-button.tsx`:

```tsx
"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

interface PulsatingButtonProps extends React.ComponentProps<"button"> {
  /** Halo pulse duration in seconds. */
  duration?: number;
}

function PulsatingButton({
  duration = 1.5,
  className,
  children,
  style,
  ...props
}: PulsatingButtonProps) {
  return (
    <button
      data-slot="pulsating-button"
      style={{ "--marketing-pulse-duration": duration, ...style } as React.CSSProperties}
      className={cn(
        "bg-primary text-primary-foreground relative inline-flex cursor-pointer items-center justify-center rounded-lg px-4 py-2 text-sm font-medium",
        className,
      )}
      {...props}
    >
      <span className="relative z-10">{children}</span>
      <span
        data-slot="pulsating-button-halo"
        aria-hidden="true"
        className="marketing-pulse-halo absolute inset-0 rounded-[inherit]"
      />
    </button>
  );
}

export { PulsatingButton };
export type { PulsatingButtonProps };
```

- [ ] **Step 7.4: Run test to verify it passes.** Expected: PASS (3 tests).

- [ ] **Step 7.5: Wire.** Catalog entry:

```ts
  {
    name: "pulsating-button",
    title: "Pulsating Button",
    description: "Primary button with a soft expanding pulse halo.",
    group: "Buttons",
  },
```

Demo `apps/docs/components/demos/pulsating-button-demo.tsx`:

```tsx
import { PulsatingButton } from "@/registry/marketing/pulsating-button";
export default function PulsatingButtonDemo() {
  return <PulsatingButton>Claim early access</PulsatingButton>;
}
```

`page.tsx`: `import PulsatingButtonDemo from "@/components/demos/pulsating-button-demo";` and entry `"pulsating-button": PulsatingButtonDemo,`.

Copy + story:

```bash
cp apps/docs/registry/marketing/pulsating-button.tsx apps/storybook/src/components/marketing/pulsating-button.tsx
sed 's|@/registry/marketing/|@/components/marketing/|' apps/docs/components/demos/pulsating-button-demo.tsx > apps/storybook/src/components/marketing/demos/pulsating-button-demo.tsx
```

`apps/storybook/src/stories/marketing/PulsatingButton.stories.tsx` — same story pattern as Task 6 with `PulsatingButtonDemo`, title `Marketing/Buttons/Pulsating Button`:

```tsx
import type { Meta, StoryObj } from "@storybook/react-vite";

import PulsatingButtonDemo from "@/components/marketing/demos/pulsating-button-demo";

const meta: Meta<typeof PulsatingButtonDemo> = {
  title: "Marketing/Buttons/Pulsating Button",
  component: PulsatingButtonDemo,
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof PulsatingButtonDemo>;

export const Default: Story = {};
```

- [ ] **Step 7.6: Gate + commit** (gate command from Conventions; commit files analogous to 6.6)

```bash
git commit -m "feat(marketing): pulsating-button — component, tests, demo, story, registry entry"
```

---

### Task 8: ripple-button (Buttons)

- [ ] **Step 8.1: Write the failing test** — `apps/docs/registry/marketing/ripple-button.test.tsx`:

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RippleButton } from "./ripple-button";

const originalMatchMedia = window.matchMedia;
function stubReducedMotion(matches: boolean) {
  window.matchMedia = ((query: string) => ({
    matches: query === "(prefers-reduced-motion: reduce)" ? matches : false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

describe("RippleButton", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    window.matchMedia = originalMatchMedia;
  });

  it("spawns a ripple at the click point and removes it after its lifetime", () => {
    stubReducedMotion(false);
    render(<RippleButton>Go</RippleButton>);
    const button = screen.getByRole("button", { name: "Go" });
    fireEvent.click(button, { clientX: 10, clientY: 10 });
    expect(button.querySelectorAll('[data-slot="ripple-button-ripple"]')).toHaveLength(1);
    vi.advanceTimersByTime(700);
    expect(button.querySelectorAll('[data-slot="ripple-button-ripple"]')).toHaveLength(0);
  });

  it("does not spawn ripples under prefers-reduced-motion but still fires onClick", () => {
    stubReducedMotion(true);
    const onClick = vi.fn();
    render(<RippleButton onClick={onClick}>Go</RippleButton>);
    const button = screen.getByRole("button");
    fireEvent.click(button);
    expect(button.querySelectorAll('[data-slot="ripple-button-ripple"]')).toHaveLength(0);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("exposes the data-slot contract and merges className", () => {
    stubReducedMotion(false);
    render(<RippleButton className="w-40">Go</RippleButton>);
    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("data-slot", "ripple-button");
    expect(button.classList.contains("w-40")).toBe(true);
  });
});
```

- [ ] **Step 8.2: Run to verify it fails.** Expected: FAIL — cannot resolve `./ripple-button`.

- [ ] **Step 8.3: Implement** — `apps/docs/registry/marketing/ripple-button.tsx`:

```tsx
"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

interface Ripple {
  id: number;
  x: number;
  y: number;
  size: number;
}

interface RippleButtonProps extends React.ComponentProps<"button"> {
  /** Ripple lifetime in ms — keep in sync with the marketing-ripple keyframe (600ms). */
  rippleDuration?: number;
}

function RippleButton({
  rippleDuration = 600,
  className,
  children,
  onClick,
  ...props
}: RippleButtonProps) {
  const [ripples, setRipples] = React.useState<Ripple[]>([]);
  const nextId = React.useRef(0);
  const reducedMotion = React.useRef(false);
  React.useEffect(() => {
    reducedMotion.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  const spawnRipple = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (reducedMotion.current) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const ripple: Ripple = {
      id: nextId.current++,
      x: event.clientX - rect.left - size / 2,
      y: event.clientY - rect.top - size / 2,
      size,
    };
    setRipples((prev) => [...prev, ripple]);
    window.setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== ripple.id));
    }, rippleDuration);
  };

  return (
    <button
      data-slot="ripple-button"
      className={cn(
        "bg-primary text-primary-foreground relative inline-flex cursor-pointer items-center justify-center overflow-hidden rounded-lg px-4 py-2 text-sm font-medium",
        className,
      )}
      onClick={(event) => {
        spawnRipple(event);
        onClick?.(event);
      }}
      {...props}
    >
      <span className="relative z-10">{children}</span>
      {ripples.map((r) => (
        <span
          key={r.id}
          data-slot="ripple-button-ripple"
          aria-hidden="true"
          className="marketing-ripple"
          style={{ left: r.x, top: r.y, width: r.size, height: r.size }}
        />
      ))}
    </button>
  );
}

export { RippleButton };
export type { RippleButtonProps };
```

Why a ref (not state) for reduced motion: it's read inside an event handler only — no
re-render needed when it's set, and reading it in the handler always sees the current value.

- [ ] **Step 8.4: Run test to verify it passes.** Expected: PASS (3 tests).

- [ ] **Step 8.5: Wire.** Catalog entry:

```ts
  {
    name: "ripple-button",
    title: "Ripple Button",
    description: "Button that ripples out from the click point.",
    group: "Buttons",
  },
```

Demo `apps/docs/components/demos/ripple-button-demo.tsx`:

```tsx
import { RippleButton } from "@/registry/marketing/ripple-button";
export default function RippleButtonDemo() {
  return <RippleButton>Get started</RippleButton>;
}
```

`page.tsx`: `import RippleButtonDemo from "@/components/demos/ripple-button-demo";` and `"ripple-button": RippleButtonDemo,`. Copy + story (`Marketing/Buttons/Ripple Button`, file `RippleButton.stories.tsx`) — same pattern as Task 7's story with `RippleButtonDemo`.

- [ ] **Step 8.6: Gate + commit**

```bash
git commit -m "feat(marketing): ripple-button — component, tests, demo, story, registry entry"
```

---

### Task 9: rainbow-button (Buttons)

- [ ] **Step 9.1: Write the failing test** — `apps/docs/registry/marketing/rainbow-button.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RainbowButton } from "./rainbow-button";

describe("RainbowButton", () => {
  it("renders children with slot, default variant, and glow", () => {
    render(<RainbowButton>Get access</RainbowButton>);
    const button = screen.getByRole("button", { name: "Get access" });
    expect(button).toHaveAttribute("data-slot", "rainbow-button");
    expect(button).toHaveAttribute("data-variant", "default");
    const glow = button.parentElement!.querySelector('[data-slot="rainbow-button-glow"]')!;
    expect(glow).toHaveAttribute("aria-hidden", "true");
  });
  it("applies variant and size classes via cva", () => {
    render(
      <RainbowButton variant="outline" size="sm">
        Pricing
      </RainbowButton>,
    );
    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("data-variant", "outline");
    expect(button.classList.contains("h-8")).toBe(true);
  });
  it("exposes the speed knob and merges className", () => {
    render(
      <RainbowButton speed="5s" className="uppercase">
        Go
      </RainbowButton>,
    );
    const button = screen.getByRole("button");
    expect(button.style.getPropertyValue("--marketing-rainbow-speed")).toBe("5s");
    expect(button.classList.contains("uppercase")).toBe(true);
  });
});
```

- [ ] **Step 9.2: Run to verify it fails.** Expected: FAIL — cannot resolve `./rainbow-button`.

- [ ] **Step 9.3: Implement** — `apps/docs/registry/marketing/rainbow-button.tsx`:

```tsx
"use client";

import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const rainbowButtonVariants = cva(
  "marketing-rainbow-button relative inline-flex cursor-pointer items-center justify-center gap-2 font-medium whitespace-nowrap transition-transform focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "text-primary-foreground",
        outline: "text-foreground",
      },
      size: {
        sm: "h-8 rounded-md px-3 text-xs",
        default: "h-10 rounded-lg px-5 text-sm",
        lg: "h-12 rounded-xl px-7 text-base",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

interface RainbowButtonProps
  extends React.ComponentProps<"button">,
    VariantProps<typeof rainbowButtonVariants> {
  /** Gradient sweep duration, e.g. "3s". */
  speed?: string;
}

function RainbowButton({
  variant,
  size,
  speed = "3s",
  className,
  children,
  style,
  ...props
}: RainbowButtonProps) {
  return (
    <span data-slot="rainbow-button-wrap" className="relative inline-flex">
      <span
        data-slot="rainbow-button-glow"
        aria-hidden="true"
        className="marketing-rainbow-glow absolute inset-0.5 rounded-lg"
      />
      <button
        data-slot="rainbow-button"
        data-variant={variant ?? "default"}
        style={{ "--marketing-rainbow-speed": speed, ...style } as React.CSSProperties}
        className={cn(rainbowButtonVariants({ variant, size }), className)}
        {...props}
      >
        {children}
      </button>
    </span>
  );
}

export { RainbowButton, rainbowButtonVariants };
export type { RainbowButtonProps };
```

(The glow uses a fixed `rounded-lg` — behind a 12px blur the radius difference across
sizes is imperceptible, and it avoids threading the size variant into a second element.)

- [ ] **Step 9.4: Run test to verify it passes.** Expected: PASS (3 tests).

- [ ] **Step 9.5: Wire.** Catalog entry:

```ts
  {
    name: "rainbow-button",
    title: "Rainbow Button",
    description: "CTA with an animated five-stop gradient border and glow.",
    group: "Buttons",
  },
```

Demo `apps/docs/components/demos/rainbow-button-demo.tsx`:

```tsx
import { RainbowButton } from "@/registry/marketing/rainbow-button";
export default function RainbowButtonDemo() {
  return (
    <div className="flex items-center gap-4">
      <RainbowButton>Get unlimited access</RainbowButton>
      <RainbowButton variant="outline" size="sm">
        View pricing
      </RainbowButton>
    </div>
  );
}
```

`page.tsx`: import + `"rainbow-button": RainbowButtonDemo,`. Copy + story
(`Marketing/Buttons/Rainbow Button`, `RainbowButton.stories.tsx`, same pattern).
`gen-registry.mts` already carries `rainbow-button → class-variance-authority` in
`marketingExtras` (Task 4).

- [ ] **Step 9.6: Gate + commit**

```bash
git commit -m "feat(marketing): rainbow-button — component, tests, demo, story, registry entry"
```

---

### Task 10: marquee (Layout)

- [ ] **Step 10.1: Write the failing test** — `apps/docs/registry/marketing/marquee.test.tsx`:

```tsx
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Marquee } from "./marquee";

describe("Marquee", () => {
  it("duplicates content into aria-hidden clone tracks for the loop", () => {
    const { container } = render(
      <Marquee>
        <span>Acme</span>
      </Marquee>,
    );
    const tracks = container.querySelectorAll('[data-slot="marquee-track"]');
    expect(tracks).toHaveLength(4);
    expect(tracks[0]).not.toHaveAttribute("aria-hidden");
    [...tracks].slice(1).forEach((t) => expect(t).toHaveAttribute("aria-hidden", "true"));
  });
  it("reflects direction, reverse, and pause-on-hover in the DOM contract", () => {
    const { container } = render(
      <Marquee vertical reverse pauseOnHover repeat={2}>
        <span>Acme</span>
      </Marquee>,
    );
    const root = container.querySelector('[data-slot="marquee"]')!;
    expect(root).toHaveAttribute("data-pause-on-hover", "true");
    const tracks = container.querySelectorAll('[data-slot="marquee-track"]');
    expect(tracks).toHaveLength(2);
    expect(tracks[0]).toHaveAttribute("data-orientation", "vertical");
    expect(tracks[0]).toHaveAttribute("data-reverse", "true");
  });
  it("exposes duration and gap knobs as CSS custom properties", () => {
    const { container } = render(
      <Marquee duration={30} gap="2rem">
        <span>Acme</span>
      </Marquee>,
    );
    const root = container.querySelector<HTMLElement>('[data-slot="marquee"]')!;
    expect(root.style.getPropertyValue("--marketing-marquee-duration")).toBe("30s");
    expect(root.style.getPropertyValue("--marketing-marquee-gap")).toBe("2rem");
  });
});
```

- [ ] **Step 10.2: Run to verify it fails.** Expected: FAIL — cannot resolve `./marquee`.

- [ ] **Step 10.3: Implement** — `apps/docs/registry/marketing/marquee.tsx`:

```tsx
import * as React from "react";

import { cn } from "@/lib/utils";

interface MarqueeProps extends React.ComponentProps<"div"> {
  /** Scroll vertically instead of horizontally. */
  vertical?: boolean;
  /** Reverse the scroll direction. */
  reverse?: boolean;
  /** Pause the animation while hovered. */
  pauseOnHover?: boolean;
  /** How many copies of the content make up the loop. */
  repeat?: number;
  /** Seconds per loop. */
  duration?: number;
  /** Gap between items and copies (any CSS length). */
  gap?: string;
}

function Marquee({
  vertical = false,
  reverse = false,
  pauseOnHover = false,
  repeat = 4,
  duration = 40,
  gap = "1rem",
  className,
  children,
  style,
  ...props
}: MarqueeProps) {
  return (
    <div
      data-slot="marquee"
      data-pause-on-hover={pauseOnHover}
      style={
        {
          "--marketing-marquee-duration": `${duration}s`,
          "--marketing-marquee-gap": gap,
          ...style,
        } as React.CSSProperties
      }
      className={cn(
        "flex overflow-hidden [gap:var(--marketing-marquee-gap)]",
        vertical ? "h-full flex-col" : "w-full flex-row",
        className,
      )}
      {...props}
    >
      {Array.from({ length: repeat }, (_, i) => (
        <div
          key={i}
          aria-hidden={i > 0 || undefined}
          data-slot="marquee-track"
          data-orientation={vertical ? "vertical" : "horizontal"}
          data-reverse={reverse}
          className={cn(
            "marketing-marquee-track flex shrink-0 justify-around [gap:var(--marketing-marquee-gap)]",
            vertical && "flex-col",
          )}
        >
          {children}
        </div>
      ))}
    </div>
  );
}

export { Marquee };
export type { MarqueeProps };
```

- [ ] **Step 10.4: Run test to verify it passes.** Expected: PASS (3 tests).

- [ ] **Step 10.5: Wire.** Catalog entry:

```ts
  {
    name: "marquee",
    title: "Marquee",
    description: "Infinite scroller for logos and testimonials.",
    group: "Layout",
  },
```

Demo `apps/docs/components/demos/marquee-demo.tsx` (placeholder marks, not real logos):

```tsx
import { Marquee } from "@/registry/marketing/marquee";

const brands = ["Acme", "Northwind", "Umbrella", "Initech", "Globex", "Hooli"];

export default function MarqueeDemo() {
  return (
    <div className="w-full max-w-xl">
      <Marquee pauseOnHover duration={30}>
        {brands.map((brand) => (
          <span
            key={brand}
            className="text-muted-foreground flex items-center gap-2 text-lg font-semibold"
          >
            <span className="bg-muted size-6 rounded-md" aria-hidden="true" />
            {brand}
          </span>
        ))}
      </Marquee>
    </div>
  );
}
```

`page.tsx`: import + `marquee: MarqueeDemo,`. Copy + story (`Marketing/Layout/Marquee`,
`Marquee.stories.tsx`, same pattern).

- [ ] **Step 10.6: Gate + commit**

```bash
git commit -m "feat(marketing): marquee — component, tests, demo, story, registry entry"
```

---

### Task 11: orbiting-circles (Effects)

- [ ] **Step 11.1: Write the failing test** — `apps/docs/registry/marketing/orbiting-circles.test.tsx`:

```tsx
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { OrbitingCircles } from "./orbiting-circles";

describe("OrbitingCircles", () => {
  it("distributes children evenly around the orbit", () => {
    const { container } = render(
      <OrbitingCircles>
        <i>a</i>
        <i>b</i>
        <i>c</i>
      </OrbitingCircles>,
    );
    const items = container.querySelectorAll<HTMLElement>('[data-slot="orbiting-circles-item"]');
    expect(items).toHaveLength(3);
    expect(items[0].style.getPropertyValue("--marketing-orbit-angle")).toBe("0");
    expect(items[1].style.getPropertyValue("--marketing-orbit-angle")).toBe("120");
    expect(items[2].style.getPropertyValue("--marketing-orbit-angle")).toBe("240");
  });
  it("exposes radius/duration knobs and the path ring toggle", () => {
    const { container } = render(
      <OrbitingCircles radius={100} duration={30} path={false}>
        <i>a</i>
      </OrbitingCircles>,
    );
    const root = container.querySelector<HTMLElement>('[data-slot="orbiting-circles"]')!;
    expect(root.style.getPropertyValue("--marketing-orbit-radius")).toBe("100");
    expect(root.style.getPropertyValue("--marketing-orbit-duration")).toBe("30");
    expect(container.querySelector('[data-slot="orbiting-circles-path"]')).toBeNull();
  });
  it("marks reversed orbits on each item", () => {
    const { container } = render(
      <OrbitingCircles reverse>
        <i>a</i>
      </OrbitingCircles>,
    );
    const item = container.querySelector('[data-slot="orbiting-circles-item"]')!;
    expect(item).toHaveAttribute("data-reverse", "true");
  });
});
```

- [ ] **Step 11.2: Run to verify it fails.** Expected: FAIL — cannot resolve `./orbiting-circles`.

- [ ] **Step 11.3: Implement** — `apps/docs/registry/marketing/orbiting-circles.tsx`:

```tsx
import * as React from "react";

import { cn } from "@/lib/utils";

interface OrbitingCirclesProps extends React.ComponentProps<"div"> {
  /** Orbit radius in px. */
  radius?: number;
  /** Seconds per revolution. */
  duration?: number;
  /** Reverse orbit direction. */
  reverse?: boolean;
  /** Show the dashed orbit path ring. */
  path?: boolean;
  /** Size of each orbiting item in px. */
  iconSize?: number;
}

function OrbitingCircles({
  radius = 80,
  duration = 20,
  reverse = false,
  path = true,
  iconSize = 32,
  className,
  children,
  style,
  ...props
}: OrbitingCirclesProps) {
  const items = React.Children.toArray(children);
  return (
    <div
      data-slot="orbiting-circles"
      style={
        {
          "--marketing-orbit-radius": radius,
          "--marketing-orbit-duration": duration,
          ...style,
        } as React.CSSProperties
      }
      className={cn(
        "pointer-events-none absolute inset-0 flex items-center justify-center",
        className,
      )}
      {...props}
    >
      {path && (
        <svg
          aria-hidden="true"
          data-slot="orbiting-circles-path"
          className="pointer-events-none absolute inset-0 size-full"
        >
          <circle
            className="stroke-border fill-none"
            cx="50%"
            cy="50%"
            r={radius}
            strokeDasharray="4 4"
          />
        </svg>
      )}
      {items.map((child, i) => (
        <span
          key={i}
          data-slot="orbiting-circles-item"
          data-reverse={reverse}
          className="marketing-orbit-item absolute flex items-center justify-center"
          style={
            {
              width: iconSize,
              height: iconSize,
              "--marketing-orbit-angle": (360 / items.length) * i,
            } as React.CSSProperties
          }
        >
          {child}
        </span>
      ))}
    </div>
  );
}

export { OrbitingCircles };
export type { OrbitingCirclesProps };
```

- [ ] **Step 11.4: Run test to verify it passes.** Expected: PASS (3 tests).

- [ ] **Step 11.5: Wire.** Catalog entry:

```ts
  {
    name: "orbiting-circles",
    title: "Orbiting Circles",
    description: "Icons orbiting a center on a dashed path.",
    group: "Effects",
  },
```

Demo `apps/docs/components/demos/orbiting-circles-demo.tsx`:

```tsx
import { Bot, Cpu, Database, Globe, Sparkles } from "lucide-react";

import { OrbitingCircles } from "@/registry/marketing/orbiting-circles";

const icons = [Bot, Cpu, Database, Globe, Sparkles];

export default function OrbitingCirclesDemo() {
  return (
    <div className="relative flex h-72 w-72 items-center justify-center">
      <span className="text-lg font-semibold">Core</span>
      <OrbitingCircles radius={110}>
        {icons.map((Icon, i) => (
          <span
            key={i}
            className="bg-muted text-muted-foreground flex size-8 items-center justify-center rounded-full border"
          >
            <Icon className="size-4" />
          </span>
        ))}
      </OrbitingCircles>
    </div>
  );
}
```

`page.tsx`: import + `"orbiting-circles": OrbitingCirclesDemo,`. Copy + story
(`Marketing/Effects/Orbiting Circles`, `OrbitingCircles.stories.tsx`, same pattern).

- [ ] **Step 11.6: Gate + commit**

```bash
git commit -m "feat(marketing): orbiting-circles — component, tests, demo, story, registry entry"
```

---

### Task 12: border-beam (Effects)

- [ ] **Step 12.1: Write the failing test** — `apps/docs/registry/marketing/border-beam.test.tsx`:

```tsx
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BorderBeam } from "./border-beam";

describe("BorderBeam", () => {
  it("renders an aria-hidden beam with the data-slot contract", () => {
    const { container } = render(<BorderBeam />);
    const beam = container.querySelector('[data-slot="border-beam"]')!;
    expect(beam).toHaveAttribute("aria-hidden", "true");
    expect(beam.classList.contains("marketing-border-beam")).toBe(true);
  });
  it("exposes size, timing, and radius knobs", () => {
    const { container } = render(<BorderBeam size={96} duration={10} delay={2} borderRadius={16} />);
    const beam = container.querySelector<HTMLElement>('[data-slot="border-beam"]')!;
    expect(beam.style.width).toBe("96px");
    expect(beam.style.getPropertyValue("--marketing-beam-duration")).toBe("10");
    expect(beam.style.getPropertyValue("--marketing-beam-delay")).toBe("2");
    expect(beam.style.getPropertyValue("--marketing-beam-radius")).toBe("16px");
  });
  it("merges className", () => {
    const { container } = render(<BorderBeam className="opacity-80" />);
    const beam = container.querySelector('[data-slot="border-beam"]')!;
    expect(beam.classList.contains("opacity-80")).toBe(true);
  });
});
```

- [ ] **Step 12.2: Run to verify it fails.** Expected: FAIL — cannot resolve `./border-beam`.

- [ ] **Step 12.3: Implement** — `apps/docs/registry/marketing/border-beam.tsx`:

```tsx
import * as React from "react";

import { cn } from "@/lib/utils";

interface BorderBeamProps extends React.ComponentProps<"span"> {
  /** Beam length in px. */
  size?: number;
  /** Seconds per lap. */
  duration?: number;
  /** Start delay in seconds. */
  delay?: number;
  /** Radius of the traced path in px — match the parent's border radius. */
  borderRadius?: number;
}

/** Place inside a `position: relative` container with `overflow-hidden`. */
function BorderBeam({
  size = 64,
  duration = 6,
  delay = 0,
  borderRadius = 12,
  className,
  style,
  ...props
}: BorderBeamProps) {
  return (
    <span
      aria-hidden="true"
      data-slot="border-beam"
      style={
        {
          width: size,
          height: 2,
          "--marketing-beam-duration": duration,
          "--marketing-beam-delay": delay,
          "--marketing-beam-radius": `${borderRadius}px`,
          ...style,
        } as React.CSSProperties
      }
      className={cn("marketing-border-beam pointer-events-none absolute", className)}
      {...props}
    />
  );
}

export { BorderBeam };
export type { BorderBeamProps };
```

- [ ] **Step 12.4: Run test to verify it passes.** Expected: PASS (3 tests).

- [ ] **Step 12.5: Wire.** Catalog entry:

```ts
  {
    name: "border-beam",
    title: "Border Beam",
    description: "A light beam tracing a container's border.",
    group: "Effects",
  },
```

Demo `apps/docs/components/demos/border-beam-demo.tsx`:

```tsx
import { BorderBeam } from "@/registry/marketing/border-beam";
export default function BorderBeamDemo() {
  return (
    <div className="bg-background relative w-80 overflow-hidden rounded-xl border p-6">
      <h3 className="text-lg font-semibold">Pro plan</h3>
      <p className="text-muted-foreground mt-1 text-sm">
        Everything in Free, plus the parts you actually came for.
      </p>
      <BorderBeam />
    </div>
  );
}
```

`page.tsx`: import + `"border-beam": BorderBeamDemo,`. Copy + story
(`Marketing/Effects/Border Beam`, `BorderBeam.stories.tsx`, same pattern).

- [ ] **Step 12.6: Gate + commit**

```bash
git commit -m "feat(marketing): border-beam — component, tests, demo, story, registry entry"
```

---

### Task 13: aurora-text (Text)

- [ ] **Step 13.1: Write the failing test** — `apps/docs/registry/marketing/aurora-text.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AuroraText } from "./aurora-text";

describe("AuroraText", () => {
  it("renders text with the data-slot contract and aurora class", () => {
    render(<AuroraText>beautiful</AuroraText>);
    const el = screen.getByText("beautiful");
    expect(el).toHaveAttribute("data-slot", "aurora-text");
    expect(el.classList.contains("marketing-aurora-text")).toBe(true);
  });
  it("exposes the duration knob and merges className", () => {
    render(
      <AuroraText duration={12} className="font-bold">
        glow
      </AuroraText>,
    );
    const el = screen.getByText("glow");
    expect(el.style.getPropertyValue("--marketing-aurora-duration")).toBe("12");
    expect(el.classList.contains("font-bold")).toBe(true);
  });
});
```

- [ ] **Step 13.2: Run to verify it fails.** Expected: FAIL — cannot resolve `./aurora-text`.

- [ ] **Step 13.3: Implement** — `apps/docs/registry/marketing/aurora-text.tsx`:

```tsx
import * as React from "react";

import { cn } from "@/lib/utils";

interface AuroraTextProps extends React.ComponentProps<"span"> {
  /** Seconds per gradient drift cycle. */
  duration?: number;
}

function AuroraText({ duration = 8, className, children, style, ...props }: AuroraTextProps) {
  return (
    <span
      data-slot="aurora-text"
      style={{ "--marketing-aurora-duration": duration, ...style } as React.CSSProperties}
      className={cn("marketing-aurora-text", className)}
      {...props}
    >
      {children}
    </span>
  );
}

export { AuroraText };
export type { AuroraTextProps };
```

- [ ] **Step 13.4: Run test to verify it passes.** Expected: PASS (2 tests).

- [ ] **Step 13.5: Wire.** Catalog entry:

```ts
  {
    name: "aurora-text",
    title: "Aurora Text",
    description: "Gradient text with slowly drifting aurora hues.",
    group: "Text",
  },
```

Demo `apps/docs/components/demos/aurora-text-demo.tsx`:

```tsx
import { AuroraText } from "@/registry/marketing/aurora-text";
export default function AuroraTextDemo() {
  return (
    <h2 className="text-4xl font-bold tracking-tight">
      Ship <AuroraText>beautiful</AuroraText> release pages
    </h2>
  );
}
```

`page.tsx`: import + `"aurora-text": AuroraTextDemo,`. Copy + story
(`Marketing/Text/Aurora Text`, `AuroraText.stories.tsx`, same pattern).

- [ ] **Step 13.6: Gate + commit**

```bash
git commit -m "feat(marketing): aurora-text — component, tests, demo, story, registry entry"
```

---

### Task 14: bento-grid (Layout)

- [ ] **Step 14.1: Write the failing test** — `apps/docs/registry/marketing/bento-grid.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BentoCard, BentoGrid } from "./bento-grid";

describe("BentoGrid", () => {
  it("renders a grid with the data-slot contract and merged className", () => {
    const { container } = render(
      <BentoGrid className="grid-cols-2">
        <div>child</div>
      </BentoGrid>,
    );
    const grid = container.querySelector('[data-slot="bento-grid"]')!;
    expect(grid.classList.contains("grid")).toBe(true);
    expect(grid.classList.contains("grid-cols-2")).toBe(true);
  });
});

describe("BentoCard", () => {
  it("renders name, description, CTA link, and optional background", () => {
    render(
      <BentoCard
        name="Realtime sync"
        description="Every device, same state."
        cta="See how"
        href="/sync"
        background={<div data-testid="bg" />}
      />,
    );
    expect(screen.getByText("Realtime sync")).toBeInTheDocument();
    expect(screen.getByText("Every device, same state.")).toBeInTheDocument();
    const link = screen.getByRole("link", { name: /See how/ });
    expect(link).toHaveAttribute("href", "/sync");
    expect(screen.getByTestId("bg")).toBeInTheDocument();
  });
  it("exposes the card slot and renders an icon node when given", () => {
    const { container } = render(
      <BentoCard name="X" description="Y" icon={<svg data-testid="icon" />} />,
    );
    expect(container.querySelector('[data-slot="bento-card"]')).not.toBeNull();
    expect(container.querySelector('[data-slot="bento-card-icon"]')).not.toBeNull();
  });
});
```

- [ ] **Step 14.2: Run to verify it fails.** Expected: FAIL — cannot resolve `./bento-grid`.

- [ ] **Step 14.3: Implement** — `apps/docs/registry/marketing/bento-grid.tsx`:

```tsx
import { ArrowRight } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

interface BentoGridProps extends React.ComponentProps<"div"> {}

function BentoGrid({ className, children, ...props }: BentoGridProps) {
  return (
    <div
      data-slot="bento-grid"
      className={cn("grid w-full auto-rows-[14rem] grid-cols-3 gap-4", className)}
      {...props}
    >
      {children}
    </div>
  );
}

interface BentoCardProps extends React.ComponentProps<"div"> {
  name: string;
  description: string;
  /** CTA label revealed on hover. */
  cta?: string;
  href?: string;
  icon?: React.ReactNode;
  /** Decorative layer behind the content (pattern, chart, image…). */
  background?: React.ReactNode;
}

function BentoCard({
  name,
  description,
  cta = "Learn more",
  href = "#",
  icon,
  background,
  className,
  ...props
}: BentoCardProps) {
  return (
    <div
      data-slot="bento-card"
      className={cn(
        "group bg-background relative flex flex-col justify-end overflow-hidden rounded-xl border",
        className,
      )}
      {...props}
    >
      {background && (
        <div data-slot="bento-card-background" aria-hidden="true" className="absolute inset-0">
          {background}
        </div>
      )}
      <div className="z-10 flex flex-col gap-1 p-5 transition-all duration-300 group-hover:-translate-y-8">
        {icon && (
          <div data-slot="bento-card-icon" className="text-muted-foreground mb-2 [&>svg]:size-8">
            {icon}
          </div>
        )}
        <h3 className="text-lg font-semibold">{name}</h3>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
      <div
        data-slot="bento-card-cta"
        className="absolute bottom-0 z-10 flex w-full translate-y-2 items-center p-5 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100"
      >
        <a href={href} className="text-primary inline-flex items-center gap-1 text-sm font-medium">
          {cta}
          <ArrowRight className="size-4" aria-hidden="true" />
        </a>
      </div>
      <div
        aria-hidden="true"
        className="group-hover:bg-muted/40 pointer-events-none absolute inset-0 transition-colors duration-300"
      />
    </div>
  );
}

export { BentoCard, BentoGrid };
export type { BentoCardProps, BentoGridProps };
```

- [ ] **Step 14.4: Run test to verify it passes.** Expected: PASS (3 tests).

- [ ] **Step 14.5: Wire.** Catalog entry:

```ts
  {
    name: "bento-grid",
    title: "Bento Grid",
    description: "Feature grid of cards with hover-revealed CTAs.",
    group: "Layout",
  },
```

Add to `marketingExtras` in `apps/docs/scripts/gen-registry.mts`:

```ts
  "bento-grid": { dependencies: ["lucide-react"] },
```

Demo `apps/docs/components/demos/bento-grid-demo.tsx` (shows cross-component composition
with `DotPattern`):

```tsx
import { Cpu, Layers, Zap } from "lucide-react";

import { BentoCard, BentoGrid } from "@/registry/marketing/bento-grid";
import { DotPattern } from "@/registry/marketing/dot-pattern";

export default function BentoGridDemo() {
  return (
    <BentoGrid className="max-w-2xl">
      <BentoCard
        className="col-span-2"
        name="Batteries included"
        description="Auth, billing, and analytics wired on day one."
        icon={<Layers />}
        background={<DotPattern fade />}
      />
      <BentoCard name="Fast by default" description="Edge-rendered, everywhere." icon={<Zap />} />
      <BentoCard name="Own your stack" description="Eject anything, anytime." icon={<Cpu />} />
      <BentoCard
        className="col-span-2"
        name="Scales quietly"
        description="From side project to seed round without a rewrite."
        icon={<Layers />}
      />
    </BentoGrid>
  );
}
```

`page.tsx`: import + `"bento-grid": BentoGridDemo,`. Copy + story
(`Marketing/Layout/Bento Grid`, `BentoGrid.stories.tsx`, same pattern; use
`parameters: { layout: "padded" }` for this one — the grid wants width).

- [ ] **Step 14.6: Gate + commit**

```bash
git commit -m "feat(marketing): bento-grid — component, tests, demo, story, registry entry"
```

---

### Task 15: number-ticker (Text)

- [ ] **Step 15.1: Write the failing test** — `apps/docs/registry/marketing/number-ticker.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { NumberTicker } from "./number-ticker";

const originalMatchMedia = window.matchMedia;
function stubReducedMotion(matches: boolean) {
  window.matchMedia = ((query: string) => ({
    matches: query === "(prefers-reduced-motion: reduce)" ? matches : false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}
afterEach(() => {
  window.matchMedia = originalMatchMedia;
});

describe("NumberTicker", () => {
  it("renders the formatted start value with the data-slot contract", () => {
    stubReducedMotion(false);
    render(<NumberTicker value={500} startValue={100} />);
    const el = screen.getByText("100");
    expect(el).toHaveAttribute("data-slot", "number-ticker");
    expect(el.classList.contains("tabular-nums")).toBe(true);
  });
  it("renders the exact formatted final value under prefers-reduced-motion", () => {
    stubReducedMotion(true);
    render(<NumberTicker value={1234.56} decimalPlaces={1} />);
    expect(screen.getByText("1,234.6")).toBeInTheDocument();
  });
  it("respects decimalPlaces in the initial render", () => {
    stubReducedMotion(false);
    render(<NumberTicker value={10} startValue={0} decimalPlaces={2} />);
    expect(screen.getByText("0.00")).toBeInTheDocument();
  });
});
```

- [ ] **Step 15.2: Run to verify it fails.** Expected: FAIL — cannot resolve `./number-ticker`.

- [ ] **Step 15.3: Implement** — `apps/docs/registry/marketing/number-ticker.tsx`:

```tsx
"use client";

import { useInView, useMotionValue, useReducedMotion, useSpring } from "motion/react";
import * as React from "react";

import { cn } from "@/lib/utils";

interface NumberTickerProps extends React.ComponentProps<"span"> {
  /** Final value counted to when the ticker enters the viewport. */
  value: number;
  startValue?: number;
  decimalPlaces?: number;
  /** Delay before counting starts, seconds. */
  delay?: number;
}

function NumberTicker({
  value,
  startValue = 0,
  decimalPlaces = 0,
  delay = 0,
  className,
  ...props
}: NumberTickerProps) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(startValue);
  const spring = useSpring(motionValue, { damping: 60, stiffness: 100 });
  const isInView = useInView(ref, { once: true });
  const reducedMotion = useReducedMotion();

  const format = React.useCallback(
    (latest: number) =>
      new Intl.NumberFormat("en-US", {
        minimumFractionDigits: decimalPlaces,
        maximumFractionDigits: decimalPlaces,
      }).format(latest),
    [decimalPlaces],
  );

  // Reduced motion renders the final value instantly and never waits for the
  // viewport — this is also the deterministic branch tests rely on.
  React.useEffect(() => {
    if (reducedMotion) {
      if (ref.current) ref.current.textContent = format(value);
      return;
    }
    if (!isInView) return;
    const timeout = window.setTimeout(() => motionValue.set(value), delay * 1000);
    return () => window.clearTimeout(timeout);
  }, [isInView, reducedMotion, motionValue, value, delay, format]);

  React.useEffect(
    () =>
      spring.on("change", (latest: number) => {
        if (ref.current) ref.current.textContent = format(latest);
      }),
    [spring, format],
  );

  return (
    <span ref={ref} data-slot="number-ticker" className={cn("tabular-nums", className)} {...props}>
      {format(startValue)}
    </span>
  );
}

export { NumberTicker };
export type { NumberTickerProps };
```

- [ ] **Step 15.4: Run test to verify it passes.** Expected: PASS (3 tests).

- [ ] **Step 15.5: Wire.** Catalog entry:

```ts
  {
    name: "number-ticker",
    title: "Number Ticker",
    description: "Counts a stat up (or down) when it scrolls into view.",
    group: "Text",
  },
```

Demo `apps/docs/components/demos/number-ticker-demo.tsx`:

```tsx
import { NumberTicker } from "@/registry/marketing/number-ticker";

export default function NumberTickerDemo() {
  return (
    <div className="flex gap-10 text-center">
      <div>
        <p className="text-4xl font-bold">
          <NumberTicker value={12400} />+
        </p>
        <p className="text-muted-foreground mt-1 text-sm">deploys/day</p>
      </div>
      <div>
        <p className="text-4xl font-bold">
          <NumberTicker value={99.98} decimalPlaces={2} />%
        </p>
        <p className="text-muted-foreground mt-1 text-sm">uptime</p>
      </div>
      <div>
        <p className="text-4xl font-bold">
          <NumberTicker value={38} />
          ms
        </p>
        <p className="text-muted-foreground mt-1 text-sm">p99 latency</p>
      </div>
    </div>
  );
}
```

`page.tsx`: import + `"number-ticker": NumberTickerDemo,`. Copy + story
(`Marketing/Text/Number Ticker`, `NumberTicker.stories.tsx`, same pattern).
(`number-ticker → motion` is already in `marketingExtras` from Task 4.)

- [ ] **Step 15.6: Gate + commit**

```bash
git commit -m "feat(marketing): number-ticker — component, tests, demo, story, registry entry"
```

---

### Task 16: typing-animation (Text)

- [ ] **Step 16.1: Write the failing test** — `apps/docs/registry/marketing/typing-animation.test.tsx`:

```tsx
import { render } from "@testing-library/react";
import { act } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TypingAnimation } from "./typing-animation";

const originalMatchMedia = window.matchMedia;
function stubReducedMotion(matches: boolean) {
  window.matchMedia = ((query: string) => ({
    matches: query === "(prefers-reduced-motion: reduce)" ? matches : false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

describe("TypingAnimation", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    window.matchMedia = originalMatchMedia;
  });

  const visibleText = (container: HTMLElement) =>
    container.querySelector('[data-slot="typing-animation-visible"]')!.textContent;

  it("types the text character by character", () => {
    stubReducedMotion(false);
    const { container } = render(<TypingAnimation duration={50}>Ship</TypingAnimation>);
    expect(visibleText(container)).toBe("");
    act(() => vi.advanceTimersByTime(100));
    expect(visibleText(container)).toBe("Sh");
    act(() => vi.advanceTimersByTime(100));
    expect(visibleText(container)).toBe("Ship");
  });

  it("exposes the full text to assistive tech from the start", () => {
    stubReducedMotion(false);
    const { container } = render(<TypingAnimation>Ship faster</TypingAnimation>);
    const root = container.querySelector('[data-slot="typing-animation"]')!;
    expect(root).toHaveAttribute("aria-label", "Ship faster");
  });

  it("renders the full text instantly under prefers-reduced-motion", () => {
    stubReducedMotion(true);
    const { container } = render(<TypingAnimation>Ship faster</TypingAnimation>);
    expect(visibleText(container)).toBe("Ship faster");
  });

  it("shows the caret only while typing", () => {
    stubReducedMotion(false);
    const { container } = render(
      <TypingAnimation duration={50} showCursor>
        Hi
      </TypingAnimation>,
    );
    expect(container.querySelector('[data-slot="typing-animation-cursor"]')).not.toBeNull();
    act(() => vi.advanceTimersByTime(200));
    expect(container.querySelector('[data-slot="typing-animation-cursor"]')).toBeNull();
  });
});
```

- [ ] **Step 16.2: Run to verify it fails.** Expected: FAIL — cannot resolve `./typing-animation`.

- [ ] **Step 16.3: Implement** — `apps/docs/registry/marketing/typing-animation.tsx`:

```tsx
"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

interface TypingAnimationProps extends React.ComponentProps<"span"> {
  children: string;
  /** ms per character. */
  duration?: number;
  /** Delay before typing starts, ms. */
  delay?: number;
  /** Show a blinking caret while typing. */
  showCursor?: boolean;
}

function TypingAnimation({
  children,
  duration = 60,
  delay = 0,
  showCursor = false,
  className,
  ...props
}: TypingAnimationProps) {
  const [visibleChars, setVisibleChars] = React.useState(0);
  const done = visibleChars >= children.length;

  React.useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisibleChars(children.length);
      return;
    }
    setVisibleChars(0);
    let interval: number | undefined;
    const start = window.setTimeout(() => {
      interval = window.setInterval(() => {
        setVisibleChars((prev) => {
          if (prev >= children.length) {
            if (interval) window.clearInterval(interval);
            return prev;
          }
          return prev + 1;
        });
      }, duration);
    }, delay);
    return () => {
      window.clearTimeout(start);
      if (interval) window.clearInterval(interval);
    };
  }, [children, duration, delay]);

  return (
    <span
      data-slot="typing-animation"
      aria-label={children}
      className={cn("whitespace-pre-wrap", className)}
      {...props}
    >
      <span aria-hidden="true" data-slot="typing-animation-visible">
        {children.slice(0, visibleChars)}
        {showCursor && !done && (
          <span data-slot="typing-animation-cursor" className="animate-pulse">
            |
          </span>
        )}
      </span>
    </span>
  );
}

export { TypingAnimation };
export type { TypingAnimationProps };
```

(The visible text is `aria-hidden` inside an `aria-label`ed root: assistive tech reads the
complete sentence immediately instead of hearing it re-announced letter by letter.)

- [ ] **Step 16.4: Run test to verify it passes.** Expected: PASS (4 tests).

- [ ] **Step 16.5: Wire.** Catalog entry:

```ts
  {
    name: "typing-animation",
    title: "Typing Animation",
    description: "Typewriter text with an optional caret.",
    group: "Text",
  },
```

Demo `apps/docs/components/demos/typing-animation-demo.tsx`:

```tsx
import { TypingAnimation } from "@/registry/marketing/typing-animation";
export default function TypingAnimationDemo() {
  return (
    <h2 className="text-3xl font-semibold tracking-tight">
      <TypingAnimation showCursor>Type less. Ship more.</TypingAnimation>
    </h2>
  );
}
```

`page.tsx`: import + `"typing-animation": TypingAnimationDemo,`. Copy + story
(`Marketing/Text/Typing Animation`, `TypingAnimation.stories.tsx`, same pattern).

- [ ] **Step 16.6: Gate + commit**

```bash
git commit -m "feat(marketing): typing-animation — component, tests, demo, story, registry entry"
```

---

### Task 17: text-animate (Text)

- [ ] **Step 17.1: Write the failing test** — `apps/docs/registry/marketing/text-animate.test.tsx`:

```tsx
import { render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { TextAnimate } from "./text-animate";

const originalMatchMedia = window.matchMedia;
function stubReducedMotion(matches: boolean) {
  window.matchMedia = ((query: string) => ({
    matches: query === "(prefers-reduced-motion: reduce)" ? matches : false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}
afterEach(() => {
  window.matchMedia = originalMatchMedia;
});

describe("TextAnimate", () => {
  it("splits into word segments hidden from assistive tech, labeled on the root", () => {
    stubReducedMotion(false);
    const { container } = render(<TextAnimate by="word">Ship it now</TextAnimate>);
    const root = container.querySelector('[data-slot="text-animate"]')!;
    expect(root).toHaveAttribute("aria-label", "Ship it now");
    const segments = container.querySelectorAll('[data-slot="text-animate-segment"]');
    expect(segments).toHaveLength(5); // words + whitespace segments
    segments.forEach((s) => expect(s).toHaveAttribute("aria-hidden", "true"));
    expect(root.textContent).toBe("Ship it now");
  });
  it("splits by character when asked", () => {
    stubReducedMotion(false);
    const { container } = render(<TextAnimate by="character">Hey</TextAnimate>);
    expect(container.querySelectorAll('[data-slot="text-animate-segment"]')).toHaveLength(3);
  });
  it("renders a plain span with full text under prefers-reduced-motion", () => {
    stubReducedMotion(true);
    const { container } = render(<TextAnimate>Ship it now</TextAnimate>);
    const root = container.querySelector('[data-slot="text-animate"]')!;
    expect(root.textContent).toBe("Ship it now");
    expect(container.querySelectorAll('[data-slot="text-animate-segment"]')).toHaveLength(0);
  });
});
```

- [ ] **Step 17.2: Run to verify it fails.** Expected: FAIL — cannot resolve `./text-animate`.

- [ ] **Step 17.3: Implement** — `apps/docs/registry/marketing/text-animate.tsx`:

```tsx
"use client";

import {
  motion,
  useReducedMotion,
  type HTMLMotionProps,
  type Variants,
} from "motion/react";
import * as React from "react";

import { cn } from "@/lib/utils";

type AnimationPreset = "fadeIn" | "blurIn" | "blurInUp" | "slideUp" | "scaleUp";
type SplitBy = "character" | "word";

const presets: Record<AnimationPreset, Variants> = {
  fadeIn: { hidden: { opacity: 0 }, show: { opacity: 1 } },
  blurIn: {
    hidden: { opacity: 0, filter: "blur(10px)" },
    show: { opacity: 1, filter: "blur(0px)" },
  },
  blurInUp: {
    hidden: { opacity: 0, filter: "blur(10px)", y: 20 },
    show: { opacity: 1, filter: "blur(0px)", y: 0 },
  },
  slideUp: { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } },
  scaleUp: { hidden: { opacity: 0, scale: 0.5 }, show: { opacity: 1, scale: 1 } },
};

interface TextAnimateProps extends Omit<HTMLMotionProps<"span">, "children"> {
  children: string;
  animation?: AnimationPreset;
  by?: SplitBy;
  /** Seconds between segment starts. */
  stagger?: number;
  /** Delay before the first segment, seconds. */
  delay?: number;
  /** Animate when entering the viewport (else on mount). */
  startOnView?: boolean;
}

function TextAnimate({
  children,
  animation = "fadeIn",
  by = "word",
  stagger = 0.05,
  delay = 0,
  startOnView = true,
  className,
  ...props
}: TextAnimateProps) {
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    return (
      <span
        data-slot="text-animate"
        className={cn(className)}
        {...(props as React.ComponentProps<"span">)}
      >
        {children}
      </span>
    );
  }

  const segments = by === "character" ? Array.from(children) : children.split(/(\s+)/);
  return (
    <motion.span
      data-slot="text-animate"
      aria-label={children}
      className={cn("inline-block", className)}
      initial="hidden"
      {...(startOnView
        ? { whileInView: "show", viewport: { once: true } }
        : { animate: "show" })}
      transition={{ staggerChildren: stagger, delayChildren: delay }}
      {...props}
    >
      {segments.map((segment, i) => (
        <motion.span
          key={i}
          aria-hidden="true"
          data-slot="text-animate-segment"
          className="inline-block whitespace-pre"
          variants={presets[animation]}
        >
          {segment}
        </motion.span>
      ))}
    </motion.span>
  );
}

export { TextAnimate };
export type { TextAnimateProps };
```

(Props extend `HTMLMotionProps<"span">` because the animated root is a `motion.span`;
the reduced-motion branch renders a plain span, hence the narrowing cast there.)

- [ ] **Step 17.4: Run test to verify it passes.** Expected: PASS (3 tests).

- [ ] **Step 17.5: Wire.** Catalog entry:

```ts
  {
    name: "text-animate",
    title: "Text Animate",
    description: "Staggered text entrances — blur, slide, scale — by word or character.",
    group: "Text",
  },
```

Demo `apps/docs/components/demos/text-animate-demo.tsx`:

```tsx
import { TextAnimate } from "@/registry/marketing/text-animate";
export default function TextAnimateDemo() {
  return (
    <h2 className="text-3xl font-semibold tracking-tight">
      <TextAnimate animation="blurInUp" by="word" startOnView={false}>
        Make your launch feel launched.
      </TextAnimate>
    </h2>
  );
}
```

`page.tsx`: import + `"text-animate": TextAnimateDemo,`. Copy + story
(`Marketing/Text/Text Animate`, `TextAnimate.stories.tsx`, same pattern).
(`text-animate → motion` already in `marketingExtras` from Task 4.)

- [ ] **Step 17.6: Gate + commit**

```bash
git commit -m "feat(marketing): text-animate — component, tests, demo, story, registry entry"
```

---

### Task 18: terminal (Layout)

- [ ] **Step 18.1: Write the failing test** — `apps/docs/registry/marketing/terminal.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { act } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AnimatedSpan, Terminal, TerminalTyping } from "./terminal";

const originalMatchMedia = window.matchMedia;
function stubReducedMotion(matches: boolean) {
  window.matchMedia = ((query: string) => ({
    matches: query === "(prefers-reduced-motion: reduce)" ? matches : false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

describe("Terminal", () => {
  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  it("renders window chrome with title and children in a pre block", () => {
    stubReducedMotion(false);
    const { container } = render(
      <Terminal title="zsh">
        <AnimatedSpan>$ pnpm dev</AnimatedSpan>
      </Terminal>,
    );
    expect(screen.getByText("zsh")).toBeInTheDocument();
    expect(container.querySelector('[data-slot="terminal-body"]')?.tagName).toBe("PRE");
    expect(screen.getByText("$ pnpm dev")).toBeInTheDocument();
  });

  describe("TerminalTyping", () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => {
      vi.useRealTimers();
      window.matchMedia = originalMatchMedia;
    });

    it("types its line over time and instantly under reduced motion", () => {
      stubReducedMotion(false);
      const { container, unmount } = render(
        <TerminalTyping duration={50}>$ npx create</TerminalTyping>,
      );
      const visible = () =>
        container.querySelector('[data-slot="terminal-typing"]')!.textContent;
      expect(visible()).toBe("");
      act(() => vi.advanceTimersByTime(50 * 12 + 50));
      expect(visible()).toBe("$ npx create");
      unmount();

      stubReducedMotion(true);
      const { container: c2 } = render(<TerminalTyping>$ done</TerminalTyping>);
      expect(c2.querySelector('[data-slot="terminal-typing"]')!.textContent).toBe("$ done");
    });
  });
});
```

- [ ] **Step 18.2: Run to verify it fails.** Expected: FAIL — cannot resolve `./terminal`.

- [ ] **Step 18.3: Implement** — `apps/docs/registry/marketing/terminal.tsx`:

```tsx
"use client";

import { motion, useReducedMotion, type HTMLMotionProps } from "motion/react";
import * as React from "react";

import { cn } from "@/lib/utils";

interface TerminalProps extends React.ComponentProps<"div"> {
  /** Window title shown in the chrome bar. */
  title?: string;
}

function Terminal({ title = "bash", className, children, ...props }: TerminalProps) {
  return (
    <div
      data-slot="terminal"
      className={cn("bg-background w-full max-w-lg rounded-xl border", className)}
      {...props}
    >
      <div data-slot="terminal-chrome" className="flex items-center gap-2 border-b p-3">
        <span className="bg-muted-foreground/40 size-2.5 rounded-full" aria-hidden="true" />
        <span className="bg-muted-foreground/40 size-2.5 rounded-full" aria-hidden="true" />
        <span className="bg-muted-foreground/40 size-2.5 rounded-full" aria-hidden="true" />
        <span className="text-muted-foreground ml-2 text-xs">{title}</span>
      </div>
      <pre data-slot="terminal-body" className="overflow-x-auto p-4 font-mono text-sm">
        <code className="grid gap-1">{children}</code>
      </pre>
    </div>
  );
}

interface AnimatedSpanProps extends Omit<HTMLMotionProps<"span">, "children"> {
  children: React.ReactNode;
  /** Delay before the line appears, ms. */
  delay?: number;
}

function AnimatedSpan({ delay = 0, className, children, ...props }: AnimatedSpanProps) {
  const reducedMotion = useReducedMotion();
  return (
    <motion.span
      data-slot="terminal-line"
      initial={reducedMotion ? false : { opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: delay / 1000 }}
      className={cn("block", className)}
      {...props}
    >
      {children}
    </motion.span>
  );
}

interface TerminalTypingProps extends React.ComponentProps<"span"> {
  children: string;
  /** Delay before typing starts, ms. */
  delay?: number;
  /** ms per character. */
  duration?: number;
}

/** Standalone typewriter line for Terminal — self-contained per registry convention
    (registry items install as single files, so this is deliberately not shared with
    typing-animation). */
function TerminalTyping({
  children,
  delay = 0,
  duration = 40,
  className,
  ...props
}: TerminalTypingProps) {
  const [visibleChars, setVisibleChars] = React.useState(0);

  React.useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisibleChars(children.length);
      return;
    }
    setVisibleChars(0);
    let interval: number | undefined;
    const start = window.setTimeout(() => {
      interval = window.setInterval(() => {
        setVisibleChars((prev) => {
          if (prev >= children.length) {
            if (interval) window.clearInterval(interval);
            return prev;
          }
          return prev + 1;
        });
      }, duration);
    }, delay);
    return () => {
      window.clearTimeout(start);
      if (interval) window.clearInterval(interval);
    };
  }, [children, duration, delay]);

  return (
    <span
      data-slot="terminal-typing"
      aria-label={children}
      className={cn("block", className)}
      {...props}
    >
      <span aria-hidden="true">{children.slice(0, visibleChars)}</span>
    </span>
  );
}

export { AnimatedSpan, Terminal, TerminalTyping };
export type { AnimatedSpanProps, TerminalProps, TerminalTypingProps };
```

- [ ] **Step 18.4: Run test to verify it passes.** Expected: PASS (2 test blocks).

- [ ] **Step 18.5: Wire.** Catalog entry:

```ts
  {
    name: "terminal",
    title: "Terminal",
    description: "Fake terminal window that plays a scripted session.",
    group: "Layout",
  },
```

Demo `apps/docs/components/demos/terminal-demo.tsx`:

```tsx
import { AnimatedSpan, Terminal, TerminalTyping } from "@/registry/marketing/terminal";

export default function TerminalDemo() {
  return (
    <Terminal title="~/my-app">
      <TerminalTyping duration={30}>$ npx shadcn@latest add marquee</TerminalTyping>
      <AnimatedSpan delay={1600} className="text-muted-foreground">
        ✔ Checking registry.
      </AnimatedSpan>
      <AnimatedSpan delay={2100} className="text-muted-foreground">
        ✔ Installing dependencies.
      </AnimatedSpan>
      <AnimatedSpan delay={2600} className="text-muted-foreground">
        ✔ Created components/marketing/marquee.tsx
      </AnimatedSpan>
      <AnimatedSpan delay={3100}>Done in 4.2s ✨</AnimatedSpan>
    </Terminal>
  );
}
```

`page.tsx`: import + `terminal: TerminalDemo,`. Copy + story
(`Marketing/Layout/Terminal`, `Terminal.stories.tsx`, same pattern).
(`terminal → motion` already in `marketingExtras` from Task 4.)

- [ ] **Step 18.6: Gate + commit**

```bash
git commit -m "feat(marketing): terminal — component, tests, demo, story, registry entry"
```

---

### Task 19: hero-video-dialog (Layout)

- [ ] **Step 19.1: Write the failing test** — `apps/docs/registry/marketing/hero-video-dialog.test.tsx`:

```tsx
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HeroVideoDialog } from "./hero-video-dialog";

const props = {
  videoSrc: "https://www.youtube-nocookie.com/embed/aqz-KE-bpKQ",
  thumbnailSrc: "data:image/gif;base64,R0lGODlhAQABAAAAACw=",
  thumbnailAlt: "Product tour",
};

describe("HeroVideoDialog", () => {
  it("opens the dialog with the video iframe on trigger click", () => {
    render(<HeroVideoDialog {...props} />);
    fireEvent.click(screen.getByRole("button", { name: "Play video" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    const iframe = document.querySelector('[data-slot="hero-video-dialog-iframe"]')!;
    expect(iframe).toHaveAttribute("src", props.videoSrc);
  });

  it("closes on Escape and returns focus to the trigger", async () => {
    render(<HeroVideoDialog {...props} />);
    const trigger = screen.getByRole("button", { name: "Play video" });
    fireEvent.click(trigger);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(document.activeElement).toBe(trigger);
  });

  it("closes via the close button", async () => {
    render(<HeroVideoDialog {...props} />);
    fireEvent.click(screen.getByRole("button", { name: "Play video" }));
    fireEvent.click(screen.getByRole("button", { name: "Close video" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });
});
```

- [ ] **Step 19.2: Run to verify it fails.** Expected: FAIL — cannot resolve `./hero-video-dialog`.

- [ ] **Step 19.3: Implement** — `apps/docs/registry/marketing/hero-video-dialog.tsx`:

```tsx
"use client";

import { Play, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import * as React from "react";

import { cn } from "@/lib/utils";

type HeroVideoAnimation = "from-center" | "from-bottom" | "fade";

const dialogVariants: Record<
  HeroVideoAnimation,
  { initial: object; animate: object; exit: object }
> = {
  "from-center": {
    initial: { scale: 0.6, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.6, opacity: 0 },
  },
  "from-bottom": {
    initial: { y: 80, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: 80, opacity: 0 },
  },
  fade: { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } },
};

interface HeroVideoDialogProps extends React.ComponentProps<"div"> {
  /** Embed URL for the player iframe. */
  videoSrc: string;
  thumbnailSrc: string;
  thumbnailAlt?: string;
  animationStyle?: HeroVideoAnimation;
}

function HeroVideoDialog({
  videoSrc,
  thumbnailSrc,
  thumbnailAlt = "Video thumbnail",
  animationStyle = "from-center",
  className,
  ...props
}: HeroVideoDialogProps) {
  const [open, setOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const reducedMotion = useReducedMotion();
  const variants = reducedMotion ? dialogVariants.fade : dialogVariants[animationStyle];

  const close = React.useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);

  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, close]);

  return (
    <div data-slot="hero-video-dialog" className={cn("relative", className)} {...props}>
      <button
        ref={triggerRef}
        type="button"
        data-slot="hero-video-dialog-trigger"
        aria-label="Play video"
        className="group relative block w-full cursor-pointer overflow-hidden rounded-xl border"
        onClick={() => setOpen(true)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- registry component must not depend on next/image */}
        <img
          src={thumbnailSrc}
          alt={thumbnailAlt}
          className="block w-full transition-transform duration-300 group-hover:scale-[1.02]"
        />
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="bg-background/80 flex size-16 items-center justify-center rounded-full border backdrop-blur transition-transform duration-300 group-hover:scale-110">
            <Play className="text-foreground ml-0.5 size-6" aria-hidden="true" />
          </span>
        </span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            data-slot="hero-video-dialog-overlay"
            role="dialog"
            aria-modal="true"
            aria-label={thumbnailAlt}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="bg-background/80 fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={close}
          >
            <motion.div
              data-slot="hero-video-dialog-content"
              {...variants}
              transition={{ duration: 0.25 }}
              className="relative aspect-video w-full max-w-3xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                aria-label="Close video"
                onClick={close}
                className="bg-background text-foreground absolute -top-12 right-0 flex size-9 cursor-pointer items-center justify-center rounded-full border"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
              <iframe
                data-slot="hero-video-dialog-iframe"
                src={videoSrc}
                title="Video player"
                className="size-full rounded-xl border"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export { HeroVideoDialog };
export type { HeroVideoDialogProps };
```

- [ ] **Step 19.4: Run test to verify it passes.** Expected: PASS (3 tests).

- [ ] **Step 19.5: Wire.** Catalog entry:

```ts
  {
    name: "hero-video-dialog",
    title: "Hero Video Dialog",
    description: "Thumbnail that opens a full-screen video lightbox.",
    group: "Layout",
  },
```

Update `marketingExtras` in `gen-registry.mts` — hero-video-dialog also needs lucide:

```ts
  "hero-video-dialog": { dependencies: ["motion", "lucide-react"] },
```

Demo `apps/docs/components/demos/hero-video-dialog-demo.tsx` (self-contained SVG
thumbnail — no external image dependency):

```tsx
import { HeroVideoDialog } from "@/registry/marketing/hero-video-dialog";

const thumbnail = `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720"><rect width="1280" height="720" fill="#e7e5e4"/><rect x="80" y="80" width="1120" height="560" rx="24" fill="#d6d3d1"/><text x="640" y="380" font-family="sans-serif" font-size="48" fill="#78716c" text-anchor="middle">Product tour</text></svg>`,
)}`;

export default function HeroVideoDialogDemo() {
  return (
    <div className="w-full max-w-xl">
      <HeroVideoDialog
        videoSrc="https://www.youtube-nocookie.com/embed/aqz-KE-bpKQ"
        thumbnailSrc={thumbnail}
        thumbnailAlt="Product tour"
      />
    </div>
  );
}
```

(Raw hex lives only in the demo's inline SVG *image data* — demos aren't registry files,
and the lint doesn't scan `components/demos/`. The component itself stays token-pure.)

`page.tsx`: import + `"hero-video-dialog": HeroVideoDialogDemo,`. Copy + story
(`Marketing/Layout/Hero Video Dialog`, `HeroVideoDialog.stories.tsx`, same pattern).

- [ ] **Step 19.6: Gate + commit**

```bash
git commit -m "feat(marketing): hero-video-dialog — component, tests, demo, story, registry entry"
```

---

### Task 20: confetti (Effects)

- [ ] **Step 20.1: Write the failing test** — `apps/docs/registry/marketing/confetti.test.tsx`:

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("canvas-confetti", () => ({ default: vi.fn() }));
import confetti from "canvas-confetti";
import { ConfettiButton } from "./confetti";

const confettiMock = vi.mocked(confetti);

const originalMatchMedia = window.matchMedia;
function stubReducedMotion(matches: boolean) {
  window.matchMedia = ((query: string) => ({
    matches: query === "(prefers-reduced-motion: reduce)" ? matches : false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}
afterEach(() => {
  window.matchMedia = originalMatchMedia;
  confettiMock.mockClear();
});

describe("ConfettiButton", () => {
  it("fires confetti from the button position on click", () => {
    stubReducedMotion(false);
    render(<ConfettiButton>Ship it</ConfettiButton>);
    fireEvent.click(screen.getByRole("button", { name: "Ship it" }));
    expect(confettiMock).toHaveBeenCalledOnce();
    const options = confettiMock.mock.calls[0][0]!;
    expect(options.origin).toBeDefined();
  });
  it("no-ops under prefers-reduced-motion but still forwards onClick", () => {
    stubReducedMotion(true);
    const onClick = vi.fn();
    render(<ConfettiButton onClick={onClick}>Ship it</ConfettiButton>);
    fireEvent.click(screen.getByRole("button"));
    expect(confettiMock).not.toHaveBeenCalled();
    expect(onClick).toHaveBeenCalledOnce();
  });
  it("exposes the data-slot contract and merges className", () => {
    stubReducedMotion(false);
    render(<ConfettiButton className="w-40">Go</ConfettiButton>);
    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("data-slot", "confetti-button");
    expect(button.classList.contains("w-40")).toBe(true);
  });
});
```

- [ ] **Step 20.2: Run to verify it fails.** Expected: FAIL — cannot resolve `./confetti`.

- [ ] **Step 20.3: Implement** — `apps/docs/registry/marketing/confetti.tsx`:

```tsx
"use client";

import confetti from "canvas-confetti";
import type { Options as ConfettiOptions } from "canvas-confetti";
import * as React from "react";

import { cn } from "@/lib/utils";

/** Fire a confetti burst. No-ops under prefers-reduced-motion. */
function fireConfetti(options?: ConfettiOptions) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  confetti({ particleCount: 80, spread: 70, origin: { y: 0.7 }, ...options });
}

interface ConfettiButtonProps extends React.ComponentProps<"button"> {
  /** Options passed to canvas-confetti on click. */
  options?: ConfettiOptions;
}

function ConfettiButton({ options, className, children, onClick, ...props }: ConfettiButtonProps) {
  return (
    <button
      data-slot="confetti-button"
      className={cn(
        "bg-primary text-primary-foreground inline-flex cursor-pointer items-center justify-center rounded-lg px-4 py-2 text-sm font-medium",
        className,
      )}
      onClick={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        fireConfetti({
          origin: {
            x: (rect.left + rect.width / 2) / window.innerWidth,
            y: rect.top / window.innerHeight,
          },
          ...options,
        });
        onClick?.(event);
      }}
      {...props}
    >
      {children}
    </button>
  );
}

export { ConfettiButton, fireConfetti };
export type { ConfettiButtonProps };
```

(Scope note vs the reference library: Magic UI also ships a `<Confetti>` canvas component;
wave 1 deliberately ships only the imperative `fireConfetti` + `ConfettiButton` pair — the
marketing use case is "celebrate on a click", and a managed canvas adds surface without a
demo we'd show. Revisit in wave 2 if a use appears.)

- [ ] **Step 20.4: Run test to verify it passes.** Expected: PASS (3 tests).

- [ ] **Step 20.5: Wire.** Catalog entry:

```ts
  {
    name: "confetti",
    title: "Confetti",
    description: "Confetti burst on click — celebration for CTAs and success states.",
    group: "Effects",
  },
```

Demo `apps/docs/components/demos/confetti-demo.tsx`:

```tsx
import { ConfettiButton } from "@/registry/marketing/confetti";
export default function ConfettiDemo() {
  return <ConfettiButton>Ship it 🎉</ConfettiButton>;
}
```

`page.tsx`: import + `confetti: ConfettiDemo,`. Copy + story
(`Marketing/Effects/Confetti`, `Confetti.stories.tsx`, same pattern).
(`confetti → canvas-confetti` already in `marketingExtras` from Task 4.)

- [ ] **Step 20.6: Gate + commit**

```bash
git commit -m "feat(marketing): confetti — component, tests, demo, story, registry entry"
```

---

### Task 21: Full-repo acceptance sweep

**Files:** none new — verification + any fixups it surfaces.

- [ ] **Step 21.1: Root gates**

Run from repo root:

```bash
pnpm typecheck && pnpm test && pnpm check:tokens && pnpm build:registry && pnpm build
```

Expected: all green. `check:tokens — 24 file(s) clean.` `registry.json — 24 items`.

- [ ] **Step 21.2: Registry output sanity**

Run: `ls apps/docs/public/r/ | wc -l` → ≥ 24 JSON files.
Run: `node -e "const r=require('./apps/docs/registry.json'); const m=r.items.filter(i=>i.files[0].path.startsWith('registry/marketing/')); console.log(m.length, m.every(i=>i.files[0].target.startsWith('components/marketing/')))"` → `15 true`.
Run: `node -e "const j=require('./apps/docs/public/r/marquee.json'); console.log(!!j.css || !!j.cssVars)"` → `true` (keyframes shipped).

- [ ] **Step 21.3: Storybook build + visual pass**

Run: `pnpm --filter storybook build`
Expected: build succeeds. Then `pnpm --filter storybook dev` and verify in the browser:
Marketing section present with 4 groups / 15 stories; each story renders in **light and
dark** via the theme toolbar; animations loop (marquee scrolls, beam traces, orbits spin);
reduced-motion emulation (DevTools → Rendering → prefers-reduced-motion: reduce) stops
marquee/orbits/beam/aurora, ticker snaps to final value, typing renders complete.

- [ ] **Step 21.4: Docs site pass**

Run: `pnpm --filter docs dev` and verify: sidebar shows `Marketing · Layout/Text/Buttons/Effects`;
each of the 15 component pages renders demo + code tab + `/r/<name>.json` install snippet.

- [ ] **Step 21.5: Commit any fixups**

```bash
git add -A && git commit -m "chore(marketing): wave-1 acceptance fixups" || echo "clean"
```

---

## Plan Self-Review Notes (already applied)

- Task numbering: components are Tasks 6–20; the code comments in Task 3 say the same.
- `marketingExtras` lifecycle: Task 4 seeds motion/canvas-confetti/cva entries; Tasks 14
  and 19 add/update the two lucide-react entries as part of wiring.
- Spec coverage: §2 roster → Tasks 6–20; §3 standards → embedded in every component's
  code; §4 plumbing → Tasks 1–5; §5 testing → step 1 of every component task; §6
  acceptance → Task 21. The spec's `cssVars` mention is satisfied by the generator's `css`
  emission (cssVars-shaped payloads ride the same field; see Task 4 schema note).


