# Docs Citation Gate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every backticked utility or slot/component citation in a docs module's claim-position fields is reachable in that component's composition graph, enforced inside `pnpm check:contract`.

**Architecture:** A new `scripts/check-citations.mts` with pure, exported extraction/classification functions and a main that imports each shipped item's docs module (spike-proven under tsx) and checks citations against the item's own source + `consumes` + `shadcn` files. Chained into the existing `check:contract` package script so ci.yml is untouched. Pure functions get their own vitest file; the tree-wide run is triaged before anything is "fixed".

**Tech Stack:** tsx, vitest, the existing manifest. **No new dependencies.**

**Spec:** `docs/superpowers/specs/2026-08-23-docs-citation-gate-design.md`

## Global Constraints

- **Run gates from the REPO ROOT**; pnpm, never npm; gate list mirrors `ci.yml` in order.
- **Every gate is control-tested before it is believed** — plant, observe the named failure, remove.
- **Fix prose by correcting it to what the component does, never by deleting the sentence.**
- **Never weaken the classifier to go green** — a finding is a stale citation, a gate defect, or vocabulary; there is no fourth bucket.
- **Branch:** `claude/ds-open-problems-review-6af3a1`; never `main`.

---

## File Structure

| File | Responsibility |
| --- | --- |
| `apps/docs/scripts/check-citations.mts` | **Create.** Pure extraction/classification + the tree-wide gate main. |
| `apps/docs/scripts/check-citations.test.ts` | **Create.** The spec's positive/negative controls as unit tests. |
| `apps/docs/package.json` | **Modify.** `check:contract` chains the new script. |
| `apps/docs/content/components/*.docs.tsx` | **Modify as the gate directs.** Backlog unknown until the first run. |

---

### Task 1: Pure functions, failing tests first

**Interfaces:**
- Produces: `classifySpan(span: string): "utility" | "name" | "allowed" | "ignored"`, `extractCitations(docs: unknown): { path: string; span: string }[]`, `slotTargets(source: string): { literals: Set<string>; prefixes: string[] }`, exported `ALLOWED_TERMS: Set<string>`, `UTILITY_PREFIXES: Set<string>`.

- [ ] **Step 1: Write the failing tests** (`check-citations.test.ts`)

```ts
import { describe, expect, it } from "vitest";
import { ALLOWED_TERMS, classifySpan, extractCitations, slotTargets } from "./check-citations.mts";

describe("classifySpan", () => {
  it("labels tailwind-prefixed and slash-step spans utilities", () => {
    expect(classifySpan("text-muted-foreground")).toBe("utility");
    expect(classifySpan("text-foreground/60")).toBe("utility");
    expect(classifySpan("focus-visible")).toBe("utility");
  });
  it("labels bare kebab spans names", () => {
    expect(classifySpan("entity-row")).toBe("name");
    expect(classifySpan("account-menu-item")).toBe("name");
  });
  it("passes allow-listed vocabulary and ignores runtime attributes", () => {
    expect(classifySpan("scrollable-region-focusable")).toBe("allowed");
    expect(classifySpan("aria-pressed")).toBe("ignored");
    expect(classifySpan("data-state")).toBe("ignored");
    expect(classifySpan("kbd")).toBe("ignored"); // single word, no hyphen
  });
});

describe("extractCitations", () => {
  it("walks claim fields and skips donts/pitfalls", () => {
    const docs = {
      whatItIs: "uses `text-foreground/60` captions",
      usage: "compose with `entity-row` rows",
      dos: [{ text: "keep `size-icon` glyphs" }],
      donts: [{ text: "never `text-muted-foreground` here" }],
      pitfalls: ["reaching for `bg-muted` under this"],
      accessibility: { keyboard: ["`focus-visible` ring on tab"], screenReader: [] },
      anatomy: [{ slot: "x", note: "shows a `preview-tile` child" }],
    };
    const spans = extractCitations(docs).map((c) => c.span);
    expect(spans).toContain("text-foreground/60");
    expect(spans).toContain("entity-row");
    expect(spans).toContain("preview-tile");
    expect(spans).not.toContain("text-muted-foreground");
    expect(spans).not.toContain("bg-muted");
  });
});

describe("slotTargets", () => {
  it("collects literal and template-prefix data-slots", () => {
    const src = 'a data-slot="approval-card" b data-slot={`approval-card-${verb}`} c';
    const t = slotTargets(src);
    expect(t.literals.has("approval-card")).toBe(true);
    expect(t.prefixes).toContain("approval-card-");
  });
});

describe("the allow-list is deliberate", () => {
  it("holds only reviewed vocabulary", () => {
    expect([...ALLOWED_TERMS]).toEqual(["scrollable-region-focusable"]);
  });
});
```

- [ ] **Step 2: Run to confirm they fail** — `cd apps/docs && pnpm exec vitest run scripts/check-citations.test.ts` → FAIL (module does not exist).

- [ ] **Step 3: Implement the pure half** of `check-citations.mts`: `UTILITY_PREFIXES` (first-segment set: bg text border ring outline fill stroke placeholder decoration caret shadow rounded gap p px py pt pb pl pr m mx my mt mb ml mr size h w min max grid col flex items justify self font leading tracking underline opacity inset truncate divide space animate transition duration hover focus active disabled group peer sr); classify: backtick span with `/\d` or `/[…]` step → utility; first segment in prefixes → utility; `aria-`/`data-` prefix or no hyphen → ignored; in `ALLOWED_TERMS` → allowed; other kebab → name. Claim fields walked: `whatItIs, whyItMatters, usage, anatomy[].note, dos[].text, accessibility.keyboard[], accessibility.screenReader[]`.

- [ ] **Step 4: Green** — same vitest command. Then `pnpm lint && pnpm typecheck` from root.

---

### Task 2: The gate main, wired and run — findings recorded before any fix

- [ ] **Step 1: Write main.** Guarded so test imports don't trigger it (`process.argv[1]` ends with the script name). For each `MANIFEST` item with `status: "shipped"` and an existing docs file: dynamically import the docs module, take the export carrying `whatItIs`; build reach text = own file(s) + `consumes` + `shadcn` sources (read `lib/manifest-types.ts` first for the real field names — do not assume); check every citation (utility → substring of reach; name → slot literal, template prefix match, or consumed-item name) and every `anatomy[].slot` (literal or template prefix). Failures print `name field: \`span\` unreachable (own + N consumed files)`; non-zero exit on any.
- [ ] **Step 2: Chain it** — `apps/docs/package.json`: `"check:contract": "tsx scripts/check-contract.mts && tsx scripts/check-citations.mts"`.
- [ ] **Step 3: First tree-wide run.** `pnpm check:contract` from root. **Record the complete finding list in the commit body before touching a single docs file.**
- [ ] **Step 4: Triage every finding into the spec's three buckets** (stale claim → correct prose; gate defect → fix gate + add test; vocabulary → allow-list + comment). Stop and re-scope if anything fits none.

---

### Task 3: Controls, gates, commit

- [ ] **Step 1: Positive controls.** Plant `` `text-foreground/95` `` in a passing module's `usage` → gate names module+field+span; plant slot `not-a-real-slot` in an `anatomy` entry → same. Remove both; `git status` clean.
- [ ] **Step 2: Negative controls hold** — pitfalls citing `text-muted-foreground`, approval-card's verb slots, `scrollable-region-focusable` all silent (already pinned by unit tests; confirm on the tree run).
- [ ] **Step 3: Repo gates in ci.yml order** — `pnpm lint && pnpm typecheck && pnpm check:tokens && pnpm check:contract && pnpm test`, then `pnpm build:registry && pnpm build`, smoke, storybook a11y (skip consumer test locally; CI runs it).
- [ ] **Step 4: Commit** — script + test + package.json + triaged docs fixes, findings list in the body.

## Self-Review Notes

- Spec decisions 1–7 → Task 1 (1, 2, 5-part), Task 2 (3, 4, 6, 7).
- The PR body flags this as the second bundle transfer and portable in *shape* (the sibling's meta layer) though not in code.
