# Showcase Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the bare `<ul>` homepage of `apps/docs` with a showcase page (hero + seven sections + primitives strip), add a `/foundations` token reference and a header nav, move today's index to `/components`, and extend the token and a11y gates to cover all of it.

**Architecture:** Everything is a Next.js route inside the existing `apps/docs` app. A single new pure module, `lib/showcase.ts`, derives the seven-section spine from `lib/catalog.manifest.ts`; every page reads from it, so nothing is hand-listed and the page cannot drift from the catalog. The hero renders the shipped `generation-shell` block and overlays it with region outlines queried from the block's own `data-region` attributes, which are already in its DOM and already asserted by the contract gate.

**Tech Stack:** Next.js 16, React 19, Tailwind v4, shadcn (Base UI / `base-nova`), Vitest + Testing Library, Playwright, `next-themes`, `@axe-core/playwright`.

## Global Constraints

- Use `pnpm`, never `npm`. CI installs with `--frozen-lockfile`, so any new dependency must land with its `pnpm-lock.yaml` update in the same commit.
- **Never edit `registry/super-ai/**`.** The showcase consumes components; it does not modify them. A failing demo is fixed in the showcase or reported, not by editing a registry source.
- **Never re-run `scripts/gen-manifest.mts`.** `lib/catalog.manifest.ts` is hand-edited and the generator discards those edits. This plan adds no fields to the manifest at all.
- No raw hex, no raw `oklch(...)`, no Tailwind palette classes (`bg-zinc-400`) anywhere in new code. After Task 6 this is gated in `app/**` and `components/**` too.
- **Never pair `text-muted-foreground` with `bg-muted` / `bg-accent` / `bg-secondary`** in the same element. Same lightness in this token set: 4.34:1 against a 4.5:1 minimum.
- Write `GH-1234`, never `#1234`, in comments. The token gate reads `#1234` as a hex colour.
- Run gates from the **repo root**, not `apps/docs`.
- Playwright runs `pnpm start`, which serves the **prebuilt** output. Always `pnpm build` before `pnpm exec playwright test`, or you are testing a stale app.

---

## File Structure

**Create**

| File | Responsibility |
| --- | --- |
| `apps/docs/lib/showcase.ts` | The seven-section spine. Pure functions over `MANIFEST`. No JSX. |
| `apps/docs/lib/showcase.test.ts` | Proves the mapping is total and the counts are the ones the spec claims. |
| `apps/docs/components/theme-toggle.tsx` | Light/dark button. Client. |
| `apps/docs/components/site-header.tsx` | Top nav: Showcase / Foundations / Components + Storybook + theme toggle. |
| `apps/docs/components/showcase/component-tile.tsx` | One catalog item as a linked tile. Presentational. |
| `apps/docs/components/showcase/section-tabs.tsx` | The seven-tab bar + panel switching. Client. |
| `apps/docs/components/showcase/hero-app.tsx` | `generation-shell` + region overlay. Client. |
| `apps/docs/app/components/page.tsx` | The full index (today's `app/page.tsx`, moved). |
| `apps/docs/app/foundations/page.tsx` | Token reference: colour, radius, type, spacing. |
| `apps/docs/e2e/showcase.spec.ts` | Smoke + axe for the new routes. |

**Modify**

| File | Change |
| --- | --- |
| `apps/docs/app/page.tsx` | Becomes the showcase. |
| `apps/docs/app/layout.tsx` | Wraps children in `ThemeProvider` + `SiteHeader`. |
| `apps/docs/e2e/smoke.spec.ts:6-9` | The `/` heading assertion changes with the new homepage. |
| `apps/docs/scripts/check-tokens.mjs:5-7` | Glob widens to `app/**` and `components/**`. |
| `apps/docs/package.json` | `next-themes` dep, `@axe-core/playwright` devDep. |
| `docs/CONTINUE.md` | Gate baselines (page count, Playwright count). |

---

### Task 1: The section spine

The keystone. Every later task reads from this file, so it is built and proved first, with no UI in the way.

**Files:**

- Create: `apps/docs/lib/showcase.ts`
- Test: `apps/docs/lib/showcase.test.ts`

**Interfaces:**

- Consumes: `MANIFEST` from `./catalog.manifest`, `ManifestItem` and `FamilyId` from `./manifest-types`.
- Produces:
  - `type SectionId = "shell" | "compose" | "generate" | "results" | "knowledge" | "trust" | "account"`
  - `interface ShowcaseSection { id: SectionId; title: string; blurb: string; items: ShowcaseItem[] }`
  - `interface ShowcaseItem { name: string; title: string; description: string; family: FamilyId }`
  - `const SHOWCASE_SECTIONS: ShowcaseSection[]` (length 7, in tab order)
  - `const SHOWCASE_PRIMITIVES: ShowcaseItem[]` (the 12 `layer: "primitive"` items)
  - `const SHOWCASE_BLOCKS: ShowcaseItem[]` (the 13 `layer: "block"` items)
  - `const HERO_BLOCK_NAME = "generation-shell"`

- [ ] **Step 1: Write the failing test**

Create `apps/docs/lib/showcase.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { MANIFEST } from "./catalog.manifest";
import {
  SHOWCASE_BLOCKS,
  SHOWCASE_PRIMITIVES,
  SHOWCASE_SECTIONS,
  type SectionId,
} from "./showcase";

const shipped = MANIFEST.filter((i) => i.status === "shipped");

describe("the showcase spine", () => {
  it("has seven sections in tab order", () => {
    expect(SHOWCASE_SECTIONS.map((s) => s.id)).toEqual([
      "shell",
      "compose",
      "generate",
      "results",
      "knowledge",
      "trust",
      "account",
    ] satisfies SectionId[]);
  });

  it("gives every section the count the spec claims", () => {
    const counts = Object.fromEntries(SHOWCASE_SECTIONS.map((s) => [s.id, s.items.length]));
    expect(counts).toEqual({
      shell: 13,
      compose: 7,
      generate: 17,
      results: 12,
      knowledge: 17,
      trust: 18,
      account: 7,
    });
  });

  // The property that matters: the seven sections partition the component
  // layer. Not a subset, not an overlap — a partition. If a new family is
  // added to the manifest and not mapped, this fails rather than silently
  // dropping its components off the page.
  it("partitions every shipped component-layer item exactly once", () => {
    const componentNames = shipped.filter((i) => i.layer === "component").map((i) => i.name);
    const placed = SHOWCASE_SECTIONS.flatMap((s) => s.items.map((i) => i.name));

    expect(placed.length).toBe(componentNames.length);
    expect(new Set(placed).size).toBe(placed.length);
    expect([...placed].sort()).toEqual([...componentNames].sort());
  });

  it("keeps the other two layers out of the sections and in their own lists", () => {
    expect(SHOWCASE_PRIMITIVES).toHaveLength(12);
    expect(SHOWCASE_BLOCKS).toHaveLength(13);

    const placed = new Set(SHOWCASE_SECTIONS.flatMap((s) => s.items.map((i) => i.name)));
    for (const item of [...SHOWCASE_PRIMITIVES, ...SHOWCASE_BLOCKS]) {
      expect(placed.has(item.name)).toBe(false);
    }
  });

  it("adds up to the manifest's shipped total", () => {
    const sectioned = SHOWCASE_SECTIONS.reduce((n, s) => n + s.items.length, 0);
    expect(sectioned + SHOWCASE_PRIMITIVES.length + SHOWCASE_BLOCKS.length).toBe(shipped.length);
  });

  it("gives every section a title and a blurb", () => {
    for (const section of SHOWCASE_SECTIONS) {
      expect(section.title.length).toBeGreaterThan(0);
      expect(section.blurb.length).toBeGreaterThan(0);
    }
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
cd apps/docs && pnpm vitest run lib/showcase.test.ts
```

Expected: FAIL, `Failed to resolve import "./showcase"`.

- [ ] **Step 3: Write the implementation**

Create `apps/docs/lib/showcase.ts`:

```ts
import { MANIFEST } from "./catalog.manifest";
import type { FamilyId, ManifestItem } from "./manifest-types";

export type SectionId =
  | "shell"
  | "compose"
  | "generate"
  | "results"
  | "knowledge"
  | "trust"
  | "account";

export interface ShowcaseItem {
  name: string;
  title: string;
  description: string;
  family: FamilyId;
}

export interface ShowcaseSection {
  id: SectionId;
  title: string;
  blurb: string;
  items: ShowcaseItem[];
}

/** The block the hero renders. Chosen because its four regions span the whole
 *  arc of an AI app — topbar, config, cost/generate, result canvas. */
export const HERO_BLOCK_NAME = "generation-shell";

/**
 * Families A and O are absent by design: they are whole layers, not sections.
 * A is `layer: "primitive"` and surfaces as the foundations strip; O is
 * `layer: "block"` and surfaces as the hero. G is cut (D9) and ships nothing.
 *
 * Every other family holds `layer: "component"` items and must appear here.
 * `sectionFor` throws on a miss rather than dropping the item, so adding a
 * family to the manifest without mapping it fails loudly.
 */
const FAMILY_TO_SECTION: Partial<Record<FamilyId, SectionId>> = {
  B: "shell",
  C: "shell",
  D: "compose",
  E: "generate",
  H: "generate",
  F: "results",
  I: "results",
  J: "knowledge",
  K: "knowledge",
  P: "knowledge",
  L: "trust",
  N: "trust",
  M: "account",
};

const SECTION_META: { id: SectionId; title: string; blurb: string }[] = [
  {
    id: "shell",
    title: "Shell",
    blurb: "The frame the app lives in: navigation, workspace switching, and the way in.",
  },
  {
    id: "compose",
    title: "Compose",
    blurb: "Everything between an intent and a request — the composer and the context it carries.",
  },
  {
    id: "generate",
    title: "Generate",
    blurb: "Parameters, runs, progress and transport. What happens while the model is working.",
  },
  {
    id: "results",
    title: "Results",
    blurb: "What comes back, and the surfaces for editing it rather than only reading it.",
  },
  {
    id: "knowledge",
    title: "Knowledge",
    blurb: "Libraries, filtering, documents and records — the app's memory of its own output.",
  },
  {
    id: "trust",
    title: "Trust",
    blurb: "Approval, feedback, observability and first-run. Where autonomy is negotiated.",
  },
  {
    id: "account",
    title: "Account",
    blurb: "Plans, credits and limits, treated as interface rather than as billing plumbing.",
  },
];

const sectionFor = (item: ManifestItem): SectionId => {
  const section = FAMILY_TO_SECTION[item.family];
  if (!section) {
    throw new Error(
      `showcase: family ${item.family} (${item.id} ${item.name}) has no section. ` +
        `Add it to FAMILY_TO_SECTION in lib/showcase.ts.`,
    );
  }
  return section;
};

const toShowcaseItem = (i: ManifestItem): ShowcaseItem => ({
  name: i.name,
  title: i.title,
  description: i.description,
  family: i.family,
});

const shipped = MANIFEST.filter((i) => i.status === "shipped");
const byLayer = (layer: ManifestItem["layer"]) => shipped.filter((i) => i.layer === layer);

export const SHOWCASE_SECTIONS: ShowcaseSection[] = SECTION_META.map((meta) => ({
  ...meta,
  items: byLayer("component")
    .filter((i) => sectionFor(i) === meta.id)
    .map(toShowcaseItem),
}));

export const SHOWCASE_PRIMITIVES: ShowcaseItem[] = byLayer("primitive").map(toShowcaseItem);
export const SHOWCASE_BLOCKS: ShowcaseItem[] = byLayer("block").map(toShowcaseItem);
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
cd apps/docs && pnpm vitest run lib/showcase.test.ts
```

Expected: PASS, 6 tests.

If the count test fails, **do not edit the expected numbers to match**. The counts come from the approved spec; a mismatch means either a family is mapped to the wrong section or the manifest changed. Read the diff and fix the cause.

- [ ] **Step 5: Commit**

```bash
git add apps/docs/lib/showcase.ts apps/docs/lib/showcase.test.ts
git commit -m "feat(showcase): derive the seven-section spine from the manifest"
```

---

### Task 2: Header nav, theme toggle, and the moved index

Self-contained: after this task the site has a real header and `/components` exists, while `/` is still the old list. Nothing is removed yet.

**Files:**

- Create: `apps/docs/components/theme-toggle.tsx`, `apps/docs/components/site-header.tsx`, `apps/docs/app/components/page.tsx`
- Modify: `apps/docs/app/layout.tsx`, `apps/docs/package.json`

**Interfaces:**

- Produces: `<SiteHeader />` (no props), `<ThemeToggle />` (no props). `SiteHeader` is rendered once, by `app/layout.tsx`.

- [ ] **Step 1: Add the dependency**

```bash
cd apps/docs && pnpm add next-themes
```

- [ ] **Step 2: Write the theme toggle**

Create `apps/docs/components/theme-toggle.tsx`:

```tsx
"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import * as React from "react";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // next-themes cannot know the resolved theme until after hydration, so the
  // icon would otherwise differ between server and client markup.
  React.useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <button
      type="button"
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="hover:bg-accent hover:text-accent-foreground inline-flex size-8 items-center justify-center rounded-md transition-colors"
    >
      {isDark ? <Moon className="size-4" /> : <Sun className="size-4" />}
    </button>
  );
}
```

- [ ] **Step 3: Write the header**

Create `apps/docs/components/site-header.tsx`:

```tsx
import Link from "next/link";

import { ThemeToggle } from "@/components/theme-toggle";

const LINKS = [
  { href: "/", label: "Showcase" },
  { href: "/foundations", label: "Foundations" },
  { href: "/components", label: "Components" },
];

export function SiteHeader() {
  return (
    <header className="bg-background/80 sticky top-0 z-50 border-b backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-6">
        <Link href="/" className="font-mono text-sm font-semibold">
          super-ai
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <a
            href="https://super-ai-components.vercel.app/storybook"
            className="text-muted-foreground hover:text-foreground text-sm transition-colors"
          >
            Storybook
          </a>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
```

- [ ] **Step 4: Wire it into the root layout**

In `apps/docs/app/layout.tsx`, add the imports and replace the `<body>` element:

```tsx
import { ThemeProvider } from "next-themes";

import { SiteHeader } from "@/components/site-header";
```

```tsx
      <body className="flex min-h-full flex-col">
        {/* suppressHydrationWarning on <html> is required by next-themes: it
            writes the class attribute before React hydrates. */}
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <SiteHeader />
          {children}
        </ThemeProvider>
      </body>
```

And add `suppressHydrationWarning` to the `<html>` element:

```tsx
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
```

- [ ] **Step 5: Move the index to `/components`**

Create `apps/docs/app/components/page.tsx` with the current body of `app/page.tsx`, retitled. Do not delete `app/page.tsx` yet; Task 3 replaces it.

```tsx
import Link from "next/link";

import { CATALOG_ITEMS } from "@/lib/catalog";

export default function ComponentsIndex() {
  return (
    <main className="mx-auto max-w-2xl space-y-6 p-10">
      <h1 data-slot="page-title" className="text-2xl font-bold">
        Components
      </h1>
      <p className="text-muted-foreground">
        Every shipped item in the registry, in catalog order.
      </p>
      <ul className="grid gap-2 sm:grid-cols-2">
        {CATALOG_ITEMS.map((item) => (
          <li key={item.name}>
            <Link
              className="hover:bg-accent hover:text-accent-foreground block rounded-md border px-3 py-2 text-sm"
              href={`/components/${item.name}`}
            >
              <span className="font-medium">{item.title}</span>
              <span className="text-muted-foreground mt-0.5 block text-xs">{item.description}</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
```

- [ ] **Step 6: Verify it builds and renders**

```bash
cd apps/docs && pnpm typecheck && pnpm build
```

Expected: build succeeds, page count is one higher than before.

- [ ] **Step 7: Commit**

```bash
git add apps/docs/components/theme-toggle.tsx apps/docs/components/site-header.tsx apps/docs/app/components/page.tsx apps/docs/app/layout.tsx apps/docs/package.json pnpm-lock.yaml
git commit -m "feat(showcase): site header, theme toggle, and the index at /components"
```

---

### Task 3: The showcase sections

**Files:**

- Create: `apps/docs/components/showcase/component-tile.tsx`, `apps/docs/components/showcase/section-tabs.tsx`
- Modify: `apps/docs/app/page.tsx`, `apps/docs/e2e/smoke.spec.ts:6-9`

**Interfaces:**

- Consumes: `SHOWCASE_SECTIONS`, `SHOWCASE_PRIMITIVES`, `ShowcaseItem` from `@/lib/showcase` (Task 1).
- Produces: `<ComponentTile item={ShowcaseItem} />`, `<SectionTabs sections={ShowcaseSection[]} />`.

- [ ] **Step 1: Write the tile**

Create `apps/docs/components/showcase/component-tile.tsx`:

```tsx
import Link from "next/link";

import type { ShowcaseItem } from "@/lib/showcase";

export function ComponentTile({ item }: { item: ShowcaseItem }) {
  return (
    <Link
      href={`/components/${item.name}`}
      data-slot="showcase-tile"
      className="hover:border-foreground/20 group block rounded-lg border p-4 transition-colors"
    >
      <span className="group-hover:text-foreground block text-sm font-medium transition-colors">
        {item.title}
      </span>
      <span className="text-muted-foreground mt-1 block text-xs leading-relaxed">
        {item.description}
      </span>
      <span className="text-muted-foreground mt-2 block font-mono text-[10px]">{item.name}</span>
    </Link>
  );
}
```

- [ ] **Step 2: Write the tab bar**

Create `apps/docs/components/showcase/section-tabs.tsx`:

```tsx
"use client";

import * as React from "react";

import { ComponentTile } from "@/components/showcase/component-tile";
import type { ShowcaseSection } from "@/lib/showcase";

export function SectionTabs({ sections }: { sections: ShowcaseSection[] }) {
  const [active, setActive] = React.useState(sections[0].id);
  const current = sections.find((s) => s.id === active) ?? sections[0];

  return (
    <section data-slot="showcase-sections">
      <div role="tablist" aria-label="Component sections" className="flex flex-wrap gap-1 border-b">
        {sections.map((section) => {
          const selected = section.id === active;
          return (
            <button
              key={section.id}
              role="tab"
              type="button"
              id={`tab-${section.id}`}
              aria-selected={selected}
              aria-controls={`panel-${section.id}`}
              onClick={() => setActive(section.id)}
              className={
                selected
                  ? "border-foreground text-foreground -mb-px border-b-2 px-3 py-2 text-sm font-medium"
                  : "text-muted-foreground hover:text-foreground -mb-px border-b-2 border-transparent px-3 py-2 text-sm transition-colors"
              }
            >
              {section.title}
              <span className="text-muted-foreground ml-1.5 text-xs">{section.items.length}</span>
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id={`panel-${current.id}`}
        aria-labelledby={`tab-${current.id}`}
        className="pt-6"
      >
        <p className="text-muted-foreground mb-6 max-w-2xl text-sm">{current.blurb}</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {current.items.map((item) => (
            <ComponentTile key={item.name} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Rewrite the homepage**

Replace `apps/docs/app/page.tsx` entirely:

```tsx
import Link from "next/link";

import { ComponentTile } from "@/components/showcase/component-tile";
import { SectionTabs } from "@/components/showcase/section-tabs";
import { SHOWCASE_BLOCKS, SHOWCASE_PRIMITIVES, SHOWCASE_SECTIONS } from "@/lib/showcase";

export default function Showcase() {
  // 116, not 91: the seven sections cover the component layer only, and the
  // headline count is every shipped item. Do not quote this as "the catalog",
  // which is frozen at 114 — the difference is family P, counted separately
  // by decision D18.
  const shippedCount =
    SHOWCASE_SECTIONS.reduce((n, s) => n + s.items.length, 0) +
    SHOWCASE_PRIMITIVES.length +
    SHOWCASE_BLOCKS.length;

  return (
    <main className="mx-auto max-w-6xl space-y-16 px-6 py-12">
      <header className="max-w-2xl space-y-4">
        <h1 data-slot="page-title" className="text-4xl font-semibold tracking-tight">
          The other half of an AI app.
        </h1>
        <p className="text-muted-foreground leading-relaxed">
          AI Elements gives you the conversation. This gives you the application: {shippedCount}{" "}
          components across shells, composers, generation, results, knowledge, trust and billing, on
          the shadcn base-nova theme. Installed with the shadcn CLI, not npm.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Link
            href="/components"
            className="bg-primary text-primary-foreground rounded-md px-3 py-2 text-sm font-medium"
          >
            Browse components
          </Link>
          <Link href="/foundations" className="rounded-md border px-3 py-2 text-sm font-medium">
            Foundations
          </Link>
        </div>
      </header>

      <SectionTabs sections={SHOWCASE_SECTIONS} />

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-medium">Primitives</h2>
          <p className="text-muted-foreground mt-1 max-w-2xl text-sm">
            The atoms everything above composes from. See{" "}
            <Link href="/foundations" className="underline underline-offset-4">
              Foundations
            </Link>{" "}
            for the tokens they read.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {SHOWCASE_PRIMITIVES.map((item) => (
            <ComponentTile key={item.name} item={item} />
          ))}
        </div>
      </section>
    </main>
  );
}
```

- [ ] **Step 4: Fix the smoke test the new homepage breaks**

`apps/docs/e2e/smoke.spec.ts` lines 6-9 assert an `h1` reading `Super-AI-Components` on `/`. That heading is gone. Replace that test with:

```ts
test("home is the showcase", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator('[data-slot="page-title"]')).toHaveText("The other half of an AI app.");
  await expect(page.getByRole("tab", { name: /Shell/ })).toBeVisible();
});
```

- [ ] **Step 5: Rebuild and run the smoke gate**

`next start` serves the prebuilt output, so the build must come first.

```bash
cd apps/docs && pnpm build && pnpm exec playwright test
```

Expected: PASS. If the homepage test fails on the heading text, the copy in `page.tsx` and the assertion have drifted; make them match rather than loosening the assertion to a regex.

- [ ] **Step 6: Commit**

```bash
git add apps/docs/components/showcase apps/docs/app/page.tsx apps/docs/e2e/smoke.spec.ts
git commit -m "feat(showcase): seven sections, tiles, and the primitives strip"
```

---

### Task 4: The hero

The one interactive claim on the page. It renders the shipped `generation-shell` block and outlines its four regions, reading the region names from the block's own `data-region` attributes rather than from a hand-written list.

**Files:**

- Create: `apps/docs/components/showcase/hero-app.tsx`
- Modify: `apps/docs/app/page.tsx`

**Interfaces:**

- Consumes: `HERO_BLOCK_NAME` from `@/lib/showcase`, `demos` from `@/lib/demos.generated`, `MANIFEST` from `@/lib/catalog.manifest`.
- Produces: `<HeroApp />` (no props).

- [ ] **Step 1: Confirm the regions are in the DOM before building on them**

```bash
cd apps/docs && grep -n 'data-region' registry/super-ai/generation-shell.tsx
```

Expected: four matches — `topbar`, `config-panel`, `cost-generate`, `result-canvas`. These must equal the `regions` array on the `O6` row of `lib/catalog.manifest.ts`. If they do not, **stop and report it**: that is a contract-gate bug, and this plan does not authorise editing a registry source to fix it.

- [ ] **Step 2: Write the hero**

Create `apps/docs/components/showcase/hero-app.tsx`:

```tsx
"use client";

import * as React from "react";

import { MANIFEST } from "@/lib/catalog.manifest";
import { demos } from "@/lib/demos.generated";
import { HERO_BLOCK_NAME } from "@/lib/showcase";

const heroRow = MANIFEST.find((i) => i.name === HERO_BLOCK_NAME)!;

/** Human labels for the block's own region ids. Region ids come from the
 *  manifest and the DOM; only the prose lives here. */
const REGION_LABELS: Record<string, string> = {
  topbar: "App topbar",
  "config-panel": "Parameters and presets",
  "cost-generate": "Cost and run",
  "result-canvas": "Results",
};

export function HeroApp() {
  const Demo = demos[HERO_BLOCK_NAME];
  const rootRef = React.useRef<HTMLDivElement>(null);
  const [regions, setRegions] = React.useState<{ id: string; rect: DOMRect }[]>([]);
  const [hovered, setHovered] = React.useState<string | null>(null);

  // Measure after paint, and again on resize. The block owns its own layout;
  // the overlay only mirrors it.
  React.useEffect(() => {
    const measure = () => {
      const root = rootRef.current;
      if (!root) return;
      const rootRect = root.getBoundingClientRect();
      const found = Array.from(root.querySelectorAll<HTMLElement>("[data-region]")).map((el) => {
        const r = el.getBoundingClientRect();
        return {
          id: el.dataset.region!,
          rect: new DOMRect(r.x - rootRect.x, r.y - rootRect.y, r.width, r.height),
        };
      });
      setRegions(found);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  return (
    <section className="space-y-4">
      <div ref={rootRef} className="relative overflow-hidden rounded-xl border">
        <Demo />
        <div className="pointer-events-none absolute inset-0">
          {regions.map((region) => (
            <div
              key={region.id}
              className={
                hovered === region.id
                  ? "border-foreground absolute rounded-md border-2 transition-opacity"
                  : "absolute rounded-md border-2 border-transparent transition-opacity"
              }
              style={{
                left: region.rect.x,
                top: region.rect.y,
                width: region.rect.width,
                height: region.rect.height,
              }}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {regions.map((region) => (
          <button
            key={region.id}
            type="button"
            data-slot="hero-region-key"
            onMouseEnter={() => setHovered(region.id)}
            onMouseLeave={() => setHovered(null)}
            onFocus={() => setHovered(region.id)}
            onBlur={() => setHovered(null)}
            className="hover:border-foreground/40 rounded-md border px-2.5 py-1.5 text-xs transition-colors"
          >
            {REGION_LABELS[region.id] ?? region.id}
          </button>
        ))}
      </div>

      <p className="text-muted-foreground text-sm">
        One block, <span className="font-mono text-xs">{HERO_BLOCK_NAME}</span>, composed from{" "}
        {heroRow.consumes.length} components. Blocks compose; they never reimplement.
      </p>
    </section>
  );
}
```

- [ ] **Step 3: Mount it on the homepage**

In `apps/docs/app/page.tsx`, add the import and render it directly below the `</header>` element:

```tsx
import { HeroApp } from "@/components/showcase/hero-app";
```

```tsx
      <HeroApp />
```

- [ ] **Step 4: Rebuild and verify no console errors**

```bash
cd apps/docs && pnpm build && pnpm exec playwright test e2e/smoke.spec.ts -g "home is the showcase"
```

Expected: PASS.

The known risk here is the `h1` readiness assertion: if the block's demo opens a Base UI overlay on mount, the library sets `aria-hidden` on the page shell and role-based locators stop finding the title. The assertion added in Task 3 uses `[data-slot="page-title"]`, a DOM locator, specifically to be immune to that. Do not change it to `getByRole`.

- [ ] **Step 5: Commit**

```bash
git add apps/docs/components/showcase/hero-app.tsx apps/docs/app/page.tsx
git commit -m "feat(showcase): hero renders generation-shell with region overlay"
```

---

### Task 5: The foundations page

**Files:**

- Create: `apps/docs/app/foundations/page.tsx`

**Interfaces:**

- Consumes: nothing from earlier tasks. Reads CSS custom properties by name at render time.

- [ ] **Step 1: Read the token names actually defined**

```bash
cd apps/docs && grep -oE '^\s+--[a-z-]+:' app/globals.css | tr -d ' :' | sort -u
```

Use only names this prints. A swatch for a token that does not exist renders as a transparent box and looks like a styling bug.

- [ ] **Step 2: Write the page**

Create `apps/docs/app/foundations/page.tsx`. Replace the arrays below with the names Step 1 printed if they differ.

```tsx
const SURFACES = ["background", "card", "muted", "accent", "secondary", "popover"];
const CONTENT = ["foreground", "muted-foreground", "primary", "destructive", "border", "ring"];
const RADII = ["radius-sm", "radius-md", "radius-lg", "radius-xl"];

function Swatch({ token }: { token: string }) {
  return (
    <div className="space-y-1.5">
      <div
        className="h-14 rounded-md border"
        style={{ background: `var(--${token})` }}
        aria-hidden="true"
      />
      <p className="font-mono text-[11px]">{token}</p>
    </div>
  );
}

export default function Foundations() {
  return (
    <main className="mx-auto max-w-6xl space-y-14 px-6 py-12">
      <header className="max-w-2xl space-y-3">
        <h1 data-slot="page-title" className="text-3xl font-semibold tracking-tight">
          Foundations
        </h1>
        <p className="text-muted-foreground leading-relaxed">
          The token set every component reads. This is stock shadcn base-nova plus one addition,
          <span className="font-mono text-xs"> --warning</span>, which the near-limit and over-limit
          states need and which ships with the components that use it.
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="text-lg font-medium">Surfaces</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {SURFACES.map((token) => (
            <Swatch key={token} token={token} />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-medium">Content and state</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {CONTENT.map((token) => (
            <Swatch key={token} token={token} />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-medium">The pairing that fails</h2>
        <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">
          Never put <span className="font-mono text-xs">text-muted-foreground</span> on{" "}
          <span className="font-mono text-xs">bg-muted</span>,{" "}
          <span className="font-mono text-xs">bg-accent</span> or{" "}
          <span className="font-mono text-xs">bg-secondary</span>. Those surfaces sit at the same
          lightness as muted text in this token set, measuring 4.34:1 against a 4.5:1 minimum. When
          a component paints a surface, rebind the variable rather than restyling slots: composed
          children carry their own muted classes and a slot-level override cannot reach them.
        </p>
        <pre className="bg-card overflow-x-auto rounded-md border p-4 font-mono text-xs">
          {`<div className="bg-muted [--muted-foreground:var(--accent-foreground)]">`}
        </pre>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-medium">Radius</h2>
        <div className="flex flex-wrap gap-4">
          {RADII.map((token) => (
            <div key={token} className="space-y-1.5">
              <div
                className="bg-card size-14 border"
                style={{ borderRadius: `var(--${token})` }}
                aria-hidden="true"
              />
              <p className="font-mono text-[11px]">{token}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-medium">Type</h2>
        <div className="space-y-2">
          <p className="text-4xl font-semibold tracking-tight">Display, page titles</p>
          <p className="text-lg font-medium">Heading, section titles</p>
          <p className="text-sm">Body, the default reading size</p>
          <p className="text-muted-foreground text-xs">Caption, metadata and labels</p>
          <p className="font-mono text-sm">Mono, identifiers and commands</p>
        </div>
      </section>
    </main>
  );
}
```

- [ ] **Step 3: Verify it builds**

```bash
cd apps/docs && pnpm typecheck && pnpm build
```

Expected: build succeeds.

- [ ] **Step 4: Commit**

```bash
git add apps/docs/app/foundations/page.tsx
git commit -m "feat(showcase): foundations page with the token reference"
```

---

### Task 6: Extend the token gate

Closes the hole where the most-visited page in the project is the least-checked.

**Files:**

- Modify: `apps/docs/scripts/check-tokens.mjs:5-7`

- [ ] **Step 1: Widen the glob**

Replace lines 5-7 of `apps/docs/scripts/check-tokens.mjs`:

```js
const FILES = globSync("{registry/{super-ai,marketing},components,app}/**/*.tsx", {
  exclude: (f) => f.includes(".test."),
});
```

- [ ] **Step 2: Run the gate and read every finding**

```bash
cd "$(git rev-parse --show-toplevel)" && pnpm check:tokens
```

Expected: either clean, or violations in the showcase files this plan created.

**Fix the code, never the gate.** If a finding is in `components/ui/**` it warns rather than fails, which is existing triaged behaviour. If a finding is in a demo under `components/demos/**` that this plan did not write, and fixing it would mean changing a demo's meaning, stop and report it rather than widening the exclude list. The exclusion list may shrink, never grow.

- [ ] **Step 3: Confirm the gate actually gained coverage**

The final line prints a file count. It must be larger than before the change; if it is unchanged, the glob did not match and the gate is silently no-oping.

```bash
cd "$(git rev-parse --show-toplevel)" && pnpm check:tokens 2>&1 | tail -1
```

- [ ] **Step 4: Commit**

```bash
git add apps/docs/scripts/check-tokens.mjs
git commit -m "feat(gate): check:tokens now covers app/ and components/, not just the registry"
```

---

### Task 7: Axe coverage, and the baselines

**Files:**

- Create: `apps/docs/e2e/showcase.spec.ts`
- Modify: `apps/docs/package.json`, `docs/CONTINUE.md`

- [ ] **Step 1: Add the dependency**

```bash
cd apps/docs && pnpm add -D @axe-core/playwright
```

- [ ] **Step 2: Write the spec**

Create `apps/docs/e2e/showcase.spec.ts`:

```ts
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const ROUTES = [
  { path: "/", title: "The other half of an AI app." },
  { path: "/foundations", title: "Foundations" },
  { path: "/components", title: "Components" },
];

for (const route of ROUTES) {
  test(`${route.path} renders without console errors`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
    await page.goto(route.path);
    // A DOM locator, not getByRole: Base UI sets aria-hidden on the page shell
    // when an overlay opens on mount, which removes headings from the
    // accessibility tree while leaving them in the DOM.
    await expect(page.locator('[data-slot="page-title"]')).toHaveText(route.title);
    expect(errors).toEqual([]);
  });

  test(`${route.path} has no serious or critical axe violations`, async ({ page }) => {
    await page.goto(route.path);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    const blocking = results.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical",
    );
    expect(blocking.map((v) => `${v.id}: ${v.nodes.length} node(s)`)).toEqual([]);
  });
}

test("the hero exposes its regions as focusable keys", async ({ page }) => {
  await page.goto("/");
  const keys = page.locator('[data-slot="hero-region-key"]');
  await expect(keys).toHaveCount(4);
});

test("every section tab switches the panel", async ({ page }) => {
  await page.goto("/");
  const tabs = page.getByRole("tab");
  await expect(tabs).toHaveCount(7);
  await tabs.nth(3).click();
  await expect(tabs.nth(3)).toHaveAttribute("aria-selected", "true");
  await expect(page.locator('[data-slot="showcase-tile"]').first()).toBeVisible();
});
```

- [ ] **Step 3: Rebuild and run the full smoke gate**

```bash
cd apps/docs && pnpm build && pnpm exec playwright test
```

Expected: PASS. Record the new test count and the new page count from the build output.

If an axe violation appears, **fix the markup**. Contrast failures on the showcase are the likeliest, and the fix is the one in the foundations page: rebind `--muted-foreground` on the painted surface rather than restyling the child.

- [ ] **Step 4: Run every gate, in CI's order, from the repo root**

CI stops at the first failure, so a green run of one gate proves nothing about the ones behind it. Run the whole sequence.

```bash
cd "$(git rev-parse --show-toplevel)" && pnpm lint && pnpm typecheck && pnpm check:tokens && pnpm check:contract && pnpm test && pnpm build:registry && pnpm build
```

Then the three that exercise the product:

```bash
cd apps/docs && pnpm exec playwright test
cd apps/storybook && pnpm test:stories
cd apps/docs && ./scripts/consumer-test.sh
```

- [ ] **Step 5: Update the recorded baselines**

In `docs/CONTINUE.md` §1, the gate baselines line records `pnpm build` **133 pages** and Playwright **131/131**. Replace both with the numbers Step 3 and Step 4 printed. Leave the other baselines alone; this plan does not touch the registry, the stories or the contract.

- [ ] **Step 6: Commit**

```bash
git add apps/docs/e2e/showcase.spec.ts apps/docs/package.json pnpm-lock.yaml docs/CONTINUE.md
git commit -m "test(showcase): axe and smoke coverage for the new routes, baselines updated"
```

---

## Notes for the PR body

`CLAUDE.md` asks that improvements to `check-tokens.mjs` be called out so they can be carried to the sibling `Minimal Design System` repo, which has no equivalent checker. Task 6 widens its scope from the registry to the whole app. Say so in the PR body.
