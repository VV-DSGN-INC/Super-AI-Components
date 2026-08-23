# Foreground-Opacity Floor (TOK-8) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Foreground-opacity composites are pinned to the measured-safe set (`text-foreground/60|70|80`) by a new ds-rules blocker, and the two docs pitfalls that recommend the device stop disagreeing about the floor.

**Architecture:** One heuristic rule record (TOK-8) in `packages/ds-rules/src/local.ts`, exercised by the existing fixture harness (`rulecheck.test.ts` auto-generates bad/good tests per rule from the emitted JSON). No component changes — all 31 live sites measured AA-safe; the deliverable is the gate plus prose hygiene around it.

**Tech Stack:** TypeScript rule records + zod schema (existing), vitest, the dependency-free `rulecheck.mjs` detector. **No new dependencies.**

**Spec:** `docs/superpowers/specs/2026-08-23-foreground-opacity-floor-design.md`

## Global Constraints

- **Run gates from the REPO ROOT, never `apps/docs`** — root lint + typecheck cover storybook too (this has bitten twice).
- **pnpm, never npm**; CI installs `--frozen-lockfile`.
- **The gate list mirrors `ci.yml`, in `ci.yml`'s order:** lint → typecheck → check:tokens → check:contract → test → build:registry → build → Playwright smoke → Storybook a11y + interaction → consumer install test.
- **Playwright smoke serves the prebuilt app** — rebuild before running or it tests a stale build.
- **A green gate is not evidence until it has been made to fail** — plant, observe the rule name the file, remove.
- **The a11y exclusion list may only shrink.**
- **Branch per task; never commit to `main`.** This plan runs on `claude/ds-open-problems-review-6af3a1`.

---

## File Structure

| File | Responsibility |
| --- | --- |
| `packages/ds-rules/src/local.ts` | **Modify.** TOK-8 appended to `LOCAL_RULES`. |
| `packages/ds-rules/__fixtures__/TOK-8/bad/case.tsx` | **Create.** Known-bad: below-floor, wrong-colour, stroke, arbitrary-alpha forms. |
| `packages/ds-rules/__fixtures__/TOK-8/good/case.tsx` | **Create.** Known-good: the three pinned steps, a variant prefix, the `text-sm/6` size shorthand. |
| `packages/ds-rules/rules/local.json` | **Regenerate** via `pnpm rules:emit` (drift-gated). |
| `apps/docs/registry/super-ai/calendar-view.tsx:235` | **Modify.** History comment rephrased off the utility form (GH-1234 precedent). |
| `apps/docs/content/components/generation-wizard.docs.tsx:100` | **Modify.** Pitfall states the measured floor. |
| `apps/docs/content/components/onboarding-wizard.docs.tsx:104` | **Modify.** Same floor, same numbers. |

---

### Task 1: The TOK-8 record, its fixtures, and the tree made clean for it

**Files:**
- Modify: `packages/ds-rules/src/local.ts` (append to `LOCAL_RULES`)
- Create: `packages/ds-rules/__fixtures__/TOK-8/bad/case.tsx`, `.../good/case.tsx`
- Regenerate: `packages/ds-rules/rules/local.json`
- Modify: `apps/docs/registry/super-ai/calendar-view.tsx:235`

**Interfaces:**
- Consumes: `catalogGrep` and the `Rule` type already in `local.ts`.
- Produces: rule id `TOK-8` in the emitted `rules/local.json`, which `rulecheck.mjs` and the fixture harness pick up with no further wiring.

- [ ] **Step 1: Append the record and watch `records.test.ts` demand fixtures**

Append to `LOCAL_RULES` in `packages/ds-rules/src/local.ts`, after `TOK-5` (it belongs with the contrast family; `ICO-1`/`LAY-1` close the array):

```ts
  {
    id: "TOK-8",
    title: "Foreground composites only from foreground, only at the measured steps",
    severity: "blocker",
    detect: {
      method: "heuristic",
      pattern:
        "\\b(?:text|fill|stroke|placeholder|decoration|caret)-(?!(?:xs|sm|base|lg|[2-9]?xl)/)(?!foreground/(?:60|70|80)\\b)[a-z][a-z-]*/(?:\\d+|\\[[^\\]]*\\])",
      ...catalogGrep,
      falsePositives:
        "A comment or docs string naming a banned form rather than applying one — phrase prose as 'muted-foreground at 60% opacity', never the utility form (the GH-1234 convention; applied to calendar-view's history note when this rule landed). The size shorthand text-sm/6 is excluded by the pattern itself.",
    },
    fix: "Quiet text derives from the foreground token at a pinned step — text-foreground/60, /70 or /80 (floor measured 2026-08-23: /60 ≥ 5.11:1 on every shipped surface, both themes). Below the floor, any other colour's composite, and arbitrary alphas: use the flat semantic token or TOK-6's rebind device instead.",
    why: "A composite resolves against whatever sits behind it, so neither the pair rules nor a story-scoped axe run reliably sees one. foreground/50 measures 3.65–3.71:1 in light (AA fail); composites of muted-foreground are strictly worse than its flat 4.34:1. The pinned set {60,70,80} is the live set and may only shrink — a new step is a rule change carrying a new measurement (docs/superpowers/specs/2026-08-23-foreground-opacity-floor-design.md).",
  },
```

Run: `cd packages/ds-rules && pnpm exec vitest run src/records.test.ts`
Expected: FAIL — `TOK-8 missing __fixtures__/TOK-8/bad/`. That red drives Step 2.

- [ ] **Step 2: Write both fixtures**

`packages/ds-rules/__fixtures__/TOK-8/bad/case.tsx`:

```tsx
export const Bad = () => (
  <div>
    <p className="text-foreground/50">below the measured floor</p>
    <p className="text-muted-foreground/60">composite of a non-foreground colour</p>
    <svg className="stroke-border/50" />
    <p className="text-foreground/[0.55]">arbitrary alpha</p>
  </div>
);
```

`packages/ds-rules/__fixtures__/TOK-8/good/case.tsx`:

```tsx
export const Good = () => (
  <div>
    <p className="text-foreground/60">the floor</p>
    <a className="hover:text-foreground/70 text-sm/6">pinned step under a variant; size-with-leading shorthand</a>
    <span className="text-foreground/80 text-muted-foreground">top pinned step; flat muted text</span>
  </div>
);
```

Run: `pnpm exec vitest run src/records.test.ts` — Expected: PASS.

- [ ] **Step 3: Rephrase the calendar-view history comment before emitting**

The tree-clean CLI test will otherwise fail on prose. In `apps/docs/registry/super-ai/calendar-view.tsx:235`, replace the utility form inside the comment: `` `text-muted-foreground/60` `` → `muted-foreground at 60% opacity` (keep the rest of the sentence intact).

- [ ] **Step 4: Emit and run the package suite**

Run: `pnpm rules:emit` (in `packages/ds-rules`), then `pnpm exec vitest run`
Expected: PASS, including the auto-generated `TOK-8 fires on its known-bad fixture` / `stays quiet on its known-good fixture` pair and the tree-clean CLI gate. Before trusting Step 4, confirm both TOK-8 fixture tests actually appear in the output — a rule missing from the emitted JSON generates no tests and reads as green.

- [ ] **Step 5: Sweep the vendored scope for pre-existing hits**

Run: `grep -rEn "(text|fill|stroke|placeholder|decoration|caret)-[a-z][a-z-]*/[0-9]" apps/docs/components/ui --include='*.tsx'`
Expected: no output. If hits appear they downgrade to warnings under `VENDORED_SCOPES` (not blockers), but each needs a line in `docs/design-system/vendored-token-findings.md` per that file's convention.

- [ ] **Step 6: Commit rule + fixtures + emitted JSON + comment + spec + plan**

```bash
git add packages/ds-rules docs/superpowers/specs/2026-08-23-foreground-opacity-floor-design.md docs/superpowers/plans/2026-08-23-foreground-opacity-floor.md "apps/docs/registry/super-ai/calendar-view.tsx"
git commit -m "feat(ds-rules): TOK-8 pins foreground composites to the measured floor"
```

---

### Task 2: Prove the gate on the real tree, then align the two pitfalls

**Files:**
- Temporarily modify (reverted): `apps/docs/registry/super-ai/promo-card.tsx`
- Modify: `apps/docs/content/components/generation-wizard.docs.tsx:100`
- Modify: `apps/docs/content/components/onboarding-wizard.docs.tsx:104`

**Interfaces:**
- Consumes: TOK-8 from Task 1 via `pnpm check:tokens`.
- Produces: nothing later tasks import; the deliverable is a proven gate and consistent published guidance.

- [ ] **Step 1: Positive control on the live tree**

Change `text-foreground/70` to `text-foreground/50` at one site in `promo-card.tsx`. Run from the repo root: `pnpm check:tokens`
Expected: exit 1, naming `promo-card.tsx`, id `TOK-8`.

- [ ] **Step 2: Revert the plant completely**

`git checkout apps/docs/registry/super-ai/promo-card.tsx`, then `git status` — the file must not appear. Run `pnpm check:tokens` again — Expected: exit 0. A forgotten plant is a shipped AA failure.

- [ ] **Step 3: Align the generation-wizard pitfall**

In `generation-wizard.docs.tsx:100`, replace the tail `` use `text-foreground` or `text-foreground/60`+ instead, as the component's own header text and step captions do. `` with `` use `text-foreground` or a pinned foreground step instead, as the component's own header text and step captions do — `text-foreground/60` is the measured floor (TOK-8): `/50` reads 3.7:1 in light mode. ``

- [ ] **Step 4: Align the onboarding-wizard pitfall**

In `onboarding-wizard.docs.tsx:104`, replace the tail `` use `text-foreground` or `text-foreground/70`, as the demo pane does. `` with `` use `text-foreground` or a pinned foreground step (`text-foreground/60` floor, TOK-8), as the demo pane's `/70` does. ``

- [ ] **Step 5: Commit**

```bash
git add apps/docs/content/components/generation-wizard.docs.tsx apps/docs/content/components/onboarding-wizard.docs.tsx
git commit -m "docs(components): the two composite pitfalls state one measured floor"
```

---

### Task 3: The gate run, in CI's order

**Files:** none beyond what earlier tasks touched; fixes only if a gate is red.

- [ ] **Step 1: Run the local gate sequence from the repo root**

```bash
pnpm lint && pnpm typecheck && pnpm check:tokens && pnpm check:contract && pnpm test
```

Expected: all green. Any red is fixed before proceeding — CI stops at the first failure, so a red here hides every later gate.

- [ ] **Step 2: Rebuild, then the product gates**

```bash
pnpm build:registry && pnpm build
```

then `cd apps/docs && pnpm exec playwright test` (the smoke gate against the fresh build), then `cd apps/storybook && pnpm test:stories` (the axe gate — TOK-6's discharge, and the only rendered check over the registry docs pages).

Expected: green. The consumer install test is left to CI: nothing in this change alters registry output beyond a comment, and the gate exists there.

- [ ] **Step 3: Confirm the working tree is clean and the branch holds exactly the two commits**

Run: `git status` and `git log --oneline -3`. Nothing unstaged; the plant from Task 2 must not survive anywhere.

---

## Self-Review Notes

- Spec decisions 1–7 map to: 1→no component task exists (deliberate), 2–6→Task 1, 7→Task 2 Steps 3–4.
- The PR body must flag TOK-8 as portable to `Minimal Design System` — CLAUDE.md asks for this whenever the checker improves.
- Out of scope, recorded in the spec: a palette-derived floor test recomputing 4.5:1 from `globals.css`.
