# Docs site EN/RU localization — Design Specification

**Date:** 2026-08-17
**Status:** Approved, not started.
**Follows:** nothing. This is the first localization work in the repo, and the first change to
`apps/docs/app/**` since the marketing routes landed.

| | |
| --- | --- |
| Scope | Full Russian translation of all 116 component docs pages plus site chrome, served under a `/ru` path prefix, produced by an unreviewed machine-translation pipeline and held in sync by a new CI gate |
| Touches | `apps/docs/app/**` (route restructure), new `apps/docs/lib/i18n/**`, new `apps/docs/content/ru/**`, new `scripts/i18n-sync.mts` + `scripts/check-i18n.mts`, `ci.yml`, and the two gate lists that must mirror it (`CLAUDE.md`, `CONTINUE.md` §1) |
| Explicitly out | Everything under `registry/super-ai/**`, all stories, all demos and `.examples.tsx`, `catalog.manifest.ts`, and the registry JSON. Also out: language persistence (cookies/middleware), and any third locale |

---

## 1. Why, and the four decisions this records

The docs site is English-only. The ask is a language switcher with English as the primary
language and Russian alongside it, for Russian-speaking readers.

Four decisions were taken in the 2026-08-17 brainstorm and are settled here rather than
re-litigated:

1. **Everything gets translated** — all 116 components, not chrome-only and not a subset. The
   measured corpus is ~174k words across `content/components/*.docs.tsx`, of which roughly
   100–120k words is prose (the rest is JSX, imports and comments).
2. **Machine translation, unreviewed** — a pipeline generates Russian and it ships as generated.
   There is no human review gate. The cost of this decision is stated plainly in §9; the design
   compensates for it structurally rather than procedurally.
3. **Russian is path-prefixed, English stays where it is** — `/components/empty-state` keeps its
   URL, Russian is served from `/ru/components/empty-state`. Nothing already shared breaks and
   the existing Playwright smoke gate keeps passing unmodified.
4. **Drift is a blocking gate with a one-command fix** — a stale translation fails CI with the
   message `run pnpm i18n:sync`.

Decision 2 is the one that shapes the rest of the design. Because no human reads the output
before it ships, every class of error that review would normally catch has to be made either
structurally impossible or mechanically detectable. §3 and §6 are largely that work.

## 2. Blast radius

**Unchanged, by construction:** `registry/super-ai/**`, all Storybook stories, all
`components/demos/*`, all `content/components/*.examples.tsx`, `lib/catalog.manifest.ts`, and
the generated registry JSON.

It follows that `check:tokens`, `test:stories` (the axe gate), `build:registry` and
`consumer-test.sh` cannot be affected by this change. The registry is the product, and this
change does not touch the product. Anyone reviewing this work should treat a failure in one of
those four gates as evidence that something outside the intended scope was edited.

**Changed:** the `apps/docs` route tree, plus new files listed in §11.

## 3. Content model

### 3.1 The overlay type

Russian text is stored as a **strings-only overlay**, merged over the English `ComponentDocs`
object at load time. It is not a parallel `ComponentDocs` module.

```ts
// apps/docs/lib/i18n/types.ts
export type Locale = "en" | "ru";

/** ComponentDocs reduced to prose. No JSX, no identifiers, no product names. */
export interface DocsTranslation {
  whatItIs: string;
  whyItMatters: string;
  usage: string;
  /** slot name -> translated note, keyed so reordering anatomy cannot misalign notes. */
  anatomy: Record<string, string>;
  dos: string[];   // index-aligned with the English `dos`
  donts: string[]; // index-aligned with the English `donts`
  accessibility: { keyboard: string[]; screenReader: string[]; focus?: string[] };
  pitfalls: string[];
}
```

What is **deliberately absent** from this type is the whole point of it:

- `anatomy[].slot` — these are `data-slot` attribute values (`"empty-state-header"`). A
  whole-file translator renders them into Russian and every anatomy callout silently stops
  matching the component. Keying by slot means the slot name is a key, never a value, so it can
  never be sent for translation.
- `dos[].example` / `donts[].example` — React nodes. Live examples render once, from the English
  definition, in both locales.
- `evidence` — product names (`"NotebookLM"`). Must survive verbatim.

The extractor (§5) whitelists fields by walking this type, so the model never sees anything
outside it. This is the structural half of compensating for decision 2.

### 3.2 Merge and fallback

```ts
// apps/docs/lib/i18n/localize-docs.ts
export function localizeDocs(en: ComponentDocs, ru?: DocsTranslation): ComponentDocs;
```

Returns an ordinary `ComponentDocs`. A missing file, or a missing field within a file, yields the
English value. `ComponentDocsView` and every component beneath it are unchanged and never learn
that locales exist.

Fallback is a safety net, not a feature: §6 requires complete coverage, so in a passing build the
fallback path is unreachable for component docs. It exists so that a half-applied change renders
English rather than blank.

### 3.3 File shape

`apps/docs/content/ru/components/<name>.ts`, one per shipped manifest item:

```ts
// GENERATED by scripts/i18n-sync.mts. Do not edit by hand — edits are
// discarded on the next sync.
// @source-hash: 3f9a…
import type { DocsTranslation } from "@/lib/i18n/types";

export const EmptyStateRu: DocsTranslation = { /* … */ };
```

Typed TS rather than JSON, so a malformed emit fails `pnpm typecheck` as well as the gate.

The barrel `lib/docs.ru.generated.ts` mirrors the existing `lib/docs.generated.ts` and is
produced by **extending `scripts/gen-wiring.mts`**, not by the translation pipeline. That keeps
all barrel generation in one place, and — because `gen:wiring` already runs as the first step of
`build:registry`, which is in CI — the Russian barrel regenerates in CI with no API key involved.

### 3.4 Catalog titles and descriptions

The 116 titles and one-line descriptions live in `lib/catalog.manifest.ts`, which is the repo's
one shared file and must never be written by a script (`CONTINUE.md` §3.2). Russian versions
therefore go in a **separate** generated file, `lib/i18n/catalog.ru.ts`, keyed by component name.
The manifest is read, never written.

### 3.5 Chrome strings

`lib/i18n/messages.ts`, roughly 50 keys: nav group names, section headings ("Anatomy", "Do",
"Don't", "Accessibility", "Keyboard", "Screen reader", "Focus", "Pitfalls"), "Installation",
"Preview", "Code", and page furniture.

**Hand-written, not generated.** The volume does not justify a pipeline, and these strings set
the terminology that the glossary (§5.2) then holds the generated corpus to. Typed as
`Record<Locale, Messages>` so a missing Russian key is a compile error rather than a gate failure.

## 4. Routing

### 4.1 Two root layouts

`<html lang>` decides which voice a screen reader uses. In the App Router it can only be set in a
root layout, and there is at most one root layout per route group. Serving a correct `lang="ru"`
therefore requires splitting into two route groups, which means `app/layout.tsx` is deleted (a
file at that position forbids multiple root layouts).

```
apps/docs/app/
  (en)/layout.tsx                     <html lang="en">
  (en)/page.tsx                       →  /
  (en)/components/layout.tsx
  (en)/components/[name]/page.tsx     →  /components/empty-state
  (ru)/layout.tsx                     <html lang="ru">
  (ru)/ru/page.tsx                    →  /ru
  (ru)/ru/components/layout.tsx
  (ru)/ru/components/[name]/page.tsx  →  /ru/components/empty-state
```

Both root layouts import `./globals.css` and share a `RootShell` component carrying the font
variables and body classes, so the duplication is the `<html lang>` attribute and nothing else.

Navigating between root layouts triggers a full page load. For a language switch that is
acceptable and arguably correct.

### 4.2 One implementation, two wrappers

The current page bodies move to `components/pages/`:

- `components/pages/home.tsx` — from `app/page.tsx`
- `components/pages/docs-layout.tsx` — from `app/components/layout.tsx`
- `components/pages/component-page.tsx` — from `app/components/[name]/page.tsx`

Each takes a `locale: Locale` prop. Every route file becomes a thin wrapper passing its locale.
There is one implementation of the component page, not two, and the marketing-demo registry and
`fs.readFileSync` of demo source inside it are untouched.

`generateStaticParams` is unchanged in each tree. Prerendered page count goes from 262 to 524.

### 4.3 English URLs are byte-identical

This is a hard requirement, not a preference: the Playwright smoke gate navigates to
`/components/<name>` and keys off the `data-slot="component-page-title"` heading. Preserving
English URLs means that gate keeps passing without modification, so a regression in the
restructure shows up as a smoke failure rather than being masked by a simultaneously-edited test.

## 5. The pipeline — `pnpm i18n:sync`

`apps/docs/scripts/i18n-sync.mts`.

### 5.1 Steps

1. Import `lib/docs.generated.ts`. For each component, extract the whitelisted strings (§3.1).
2. Hash the **extract**, not the file: sha256 over JSON serialised with sorted keys, so the hash
   is stable across unrelated reordering. Editing a code comment or an example component
   therefore does not mark a page stale. A blocking gate is only tolerable if it does not cry
   wolf.
3. Read the existing `content/ru/components/<name>.ts` and parse its `@source-hash`. Skip if it
   matches.
4. Translate stale entries via `@anthropic-ai/sdk` (new devDependency in `apps/docs`), JSON in and
   JSON out, at concurrency ~6.
5. Validate the response (§5.3). One retry on failure, then fail loud and non-zero.
6. Emit the typed file with a fresh `@source-hash`.

Flags: `--only <name>`, `--dry-run`, `--all` (ignore hashes and regenerate everything).

Requires `ANTHROPIC_API_KEY` in the local environment. **CI never calls this script** and needs no
secret — the gate only compares hashes.

The same run regenerates `lib/i18n/catalog.ru.ts` from the manifest's `title` and `description`
fields.

Before this script is written, load the `claude-api` skill for current model IDs and parameters
rather than working from memory.

### 5.2 The glossary

`lib/i18n/glossary.ts` is a fixed English→Russian mapping of design-system vocabulary: slot,
anatomy, tab stop, focus ring, live region, screen reader, empty state, surface, affordance,
primitive, block, and so on. It is injected into every prompt.

This exists because the corpus is translated by 116 **independent** calls with no shared context.
Without a glossary they will each render "slot" and "live region" differently, and the result is
116 unrelated documents rather than one design system. Terms in the glossary are also the terms
used in `messages.ts` (§3.5), so chrome and body agree.

The system prompt additionally states hard rules: never translate code identifiers, prop names,
prop values in quotes (`size="page"`), `data-*` attributes, or product names; preserve array
lengths exactly; return only JSON.

### 5.3 Validation

Before any file is written, the response must satisfy:

- parses as JSON and matches `DocsTranslation`
- every array length equals its English counterpart
- `anatomy` keys are exactly the English slot set, no more and no fewer

The length assertion is the important one. A model silently dropping the fourth pitfall is the
realistic failure mode, and with no human review it is otherwise undetectable.

## 6. The gate — `pnpm check:i18n`

`apps/docs/scripts/check-i18n.mts` fails when any of the following holds:

- a stored `@source-hash` does not match the recomputed hash of its English extract
- a shipped manifest item has no Russian file
- an array length diverges from English
- an `anatomy` key is missing, or is present but unknown to the English slot set
- `lib/i18n/catalog.ru.ts` lacks an entry for a shipped item
- the Russian chrome dictionary lacks a key present in English

Every failure prints the affected component and the remedy: `run pnpm i18n:sync`.

**CI placement:** immediately after `check:contract` in `.github/workflows/ci.yml`, job `verify`.
The job goes from eleven steps to twelve.

Per the standing rule that a gate list must mirror `ci.yml` in `ci.yml`'s order, the same PR
updates the CI list in `CLAUDE.md` and in `CONTINUE.md` §1. A gate missing from a written list
goes unrun for a whole phase; this has already happened in this repo once.

## 7. The switcher

A pair of server-rendered `<Link>`s in the sidebar header beside the wordmark, and in the home
page header. No client JavaScript: both targets are static pages and the counterpart href is
derivable from `locale` and `name`.

Accessibility details that are not optional here:

- the Russian label carries `lang="ru"`, so a screen reader pronounces "Русский" with a Russian
  voice instead of reading Cyrillic through an English one
- both links carry `hrefLang`
- page metadata sets `alternates.languages` so the `hreflang` link tags are emitted

**No persistence in v1.** `/` is always English and language is whatever the URL says. A cookie
plus middleware redirect costs full static generation and produces surprise redirects for anyone
following a shared link; if it is wanted later it is an additive change.

## 8. Testing

**Vitest** (`apps/docs`):

- `localizeDocs` falls back per-field and per-file
- the extractor whitelist holds: a slot name and a product name survive a round trip untranslated
- hash stability: an unrelated comment edit does not change the extract hash
- each gate rule in §6 fires on a crafted-bad fixture

**Playwright**, one added case: `/ru/components/<one>` renders its title, `<html lang="ru">` is
set, and the switcher round-trips to the English page and back. Rebuild before running — `next
start` serves prebuilt output and editing source without rebuilding tests a stale app.

**Unaffected and expected to stay green without modification:** `check:tokens`, `test:stories`,
`build:registry`, `consumer-test.sh`, and the existing Playwright cases.

## 9. Cost, and the known risk

A full run is roughly 160k tokens in and somewhat more out (Russian runs ~10–15% longer than
English) across 116 calls. Default model: Sonnet 5, overridable by env var. That places a full run
in the single-digit to low-double-digit dollars; Opus would be several times that. Incremental
runs after the first are near-free, since only drifted components regenerate.

**The risk, recorded rather than mitigated:** this corpus is dense technical prose about ARIA
semantics, focus behaviour and live regions. A mistranslation here reads as confidently wrong
rather than obviously broken, and with no review gate nothing catches it. §3.1 and §5.3 remove the
mechanical failure modes (translated identifiers, dropped list items, misaligned anatomy) but
cannot address semantic error. This was an explicit decision, and if the first run's output reads
thin the correct response is to raise the model tier, not to add process.

## 10. Rollout

One PR. The full sync is run locally and committed before the PR is opened, because the gate
requires complete coverage from the moment it lands.

Order of work within the PR:

1. Types, `localizeDocs`, messages dictionary, glossary — with tests, no routes yet
2. Route restructure to two root layouts, English behaviour unchanged, smoke gate still green
3. `i18n-sync.mts` and a first run over 3–5 components to validate the prompt and the emitted shape
4. Full sync, all 116, plus `catalog.ru.ts`
5. `check-i18n.mts`, its tests, the `ci.yml` step, and the two gate-list doc updates
6. Switcher, metadata, Playwright case

## 11. New and changed files

**New:** `lib/i18n/{types,localize-docs,messages,glossary,catalog.ru}.ts`,
`lib/docs.ru.generated.ts`, `content/ru/components/*.ts` (116),
`components/pages/{home,docs-layout,component-page}.tsx`, `components/language-switcher.tsx`,
`scripts/i18n-sync.mts`, `scripts/check-i18n.mts`, plus tests.

**Moved:** `app/layout.tsx`, `app/page.tsx`, `app/components/layout.tsx`,
`app/components/[name]/page.tsx` into the `(en)` / `(ru)` groups as wrappers.

**Edited:** `apps/docs/scripts/gen-wiring.mts` (emit the Russian barrel too),
`apps/docs/package.json` (`i18n:sync` + `check:i18n` scripts, `@anthropic-ai/sdk` devDependency),
root `package.json` / `turbo.json` (the `check:i18n` task), `.github/workflows/ci.yml`,
`CLAUDE.md`, `docs/CONTINUE.md` §1.

## 12. Open items

- **Model choice** for translation. Default Sonnet 5; revisit after the §10 step 3 sample.
- **A third locale** is additive: one more `Locale` union member, one overlay directory, one route
  group. Nothing in this design is two-language-specific.
