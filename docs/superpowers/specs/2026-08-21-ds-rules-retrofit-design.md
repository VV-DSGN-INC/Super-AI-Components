# ds-rules retrofit — rules as records, gates unchanged

**Date:** 2026-08-21 · **Status:** approved design, pre-plan · **Owner:** Nick + Claude

Retrofit this repo onto the `ds-architecture` governance model: every design rule becomes
one typed record from which the detector, the docs, and the audit skill all derive; every
rule no script can run is *declared* unchecked instead of being silent; and the two
ratchets the repo already states in prose become machine-enforced. CI keeps its exact
eleven-step shape throughout.

## 1. Context and provenance

The architecture comes from the `ds-architecture` archive
(`~/ClaudeCode Projects/ds-architecture-archive-2026-08-21.zip`), extracted from
`pegbo-inc/design-system-rebuild` (PR #115 there). Its manual defines the three ideas this
retrofit imports:

1. **A rule and its detector are the same record** — no prose guide + separate lint
   script that drift apart.
2. **Un-checkability is a declared field, not a silence** — every rule states its detect
   method (`grep` / `heuristic` / `rendered` / `judgment`); the last two land in an
   `unchecked` list on every run automatically.
3. **Liveness gating** — a declared token that nothing consumes is a failure, not a fact.

This repo already runs partial equivalents in four separate homes: pattern rules inside
[`check-tokens.mjs`](../../../apps/docs/scripts/check-tokens.mjs), structural muted-pair
logic in `apps/docs/scripts/lib/token-rules.mjs`, prose bans in
[`anti-slop.md`](../../design-system/anti-slop.md) and the design spec §6, and warnings in
[`a11y-baseline.md`](../../design-system/a11y-baseline.md) / `CLAUDE.md`. Four homes is
the drift arrangement the architecture exists to end. The unslop skill already cites
`design-system-rebuild` as its origin, so this is a reunion, not an adoption.

**Success criteria**

- `pnpm check:tokens` (root) produces findings identical to today's on the current tree —
  proven by a parity test — but implemented from the rule records.
- Every rule record has a known-bad **and** known-good fixture, and a drift gate pins the
  emitted JSON to its TypeScript source.
- Every detector run prints an `unchecked` section naming the rules no script can run and
  what discharges each.
- The a11y exclusion list and the new cssVars liveness gate are enforced by tests, not by
  sentences in CLAUDE.md.
- `pnpm check:ladder` scores the repo against the vendored conformance checker (stage 00).
- `.github/workflows/ci.yml` is semantically unchanged: same eleven steps, same order.

## 2. Non-goals

Parked deliberately; each is real follow-up work, none blocks this retrofit:

- **Stage-04 meta judgments** (intent, antiPatterns, insteadUse, keyboard) across the
  shipped catalog — judgment authoring at catalog scale is where generators fabricate.
- **Docs citation gating** (stage 07) and **design-tool sync** (stage 08).
- **Writing ladder probes 01–09** for the vendored checker (its plan 2, never executed).
- **Fixing the checker's two documented open questions** (unchecked-collapses-to-exit-0
  for a structurally broken stage; `highestContiguous` counting partially-determined
  stages). Inherited as-is and noted in the vendor stamp.
- **Anything in the Minimal Design System repo.** Portability is a design constraint
  here, not a second deliverable.

## 3. Package layout — `packages/ds-rules`

First real member of the already-globbed `packages/*` workspace:

```
packages/ds-rules/
  package.json           test + emit scripts; devDeps: typescript, vitest, zod
  src/schema.ts          harvested verbatim from the archive starter kit (zod)
  src/core.ts            harvested portable bans, adapted (see §4)
  src/local.ts           this repo's rules (see §4)
  src/token-rules.mjs    moved from apps/docs/scripts/lib/, node:* imports only
  rules.json             emitted from core+local; drift-gated
  rulecheck.mjs          detector CLI; reads rules.json + the two structural checks
  __fixtures__/<id>/bad/ and /good/   one pair per rule
```

- `apps/docs` takes a `workspace:*` devDependency. Its `check:tokens` script becomes a
  delegation: `node ../../packages/ds-rules/rulecheck.mjs --severity blocker`. Root
  `pnpm check:tokens` therefore keeps working with **zero turbo/ci.yml changes**.
- Rule scopes inside records are repo-root-relative (`apps/docs/registry/super-ai`, …);
  `rulecheck.mjs` resolves the repo root from its own location.
- Root `lint` / `typecheck` / `test` pick the new workspace up automatically — gates run
  from the repo root, per standing practice.
- The detector imports nothing outside `node:*` and relative paths (the archive's
  portability discipline; its `no-deps` test pattern comes along).

## 4. Rule inventory — draining the four homes

### Local records (`src/local.ts`)

| id | rule | method | severity | notes |
|---|---|---|---|---|
| TOK-1 | raw hex colour | `grep` | blocker | pattern `#[0-9a-fA-F]{3,8}\b`; the GH-1234 issue-ref convention stays documented in `why` — semantics identical to today |
| TOK-2 | raw `oklch(` | `grep` | blocker | |
| TOK-3 | Tailwind palette class | `grep` | blocker | the existing prefix×palette regex, unchanged |
| TOK-4 | muted fg + muted bg in one class string | `heuristic` | blocker | pre-filter pattern `text-muted-foreground`; refined by `findSingleStringViolations` |
| TOK-5 | muted fg/bg split across cva base×variant | `heuristic` | blocker | same pre-filter; refined by `findCvaViolations` |
| TOK-6 | muted text in a child under a composed muted surface | `rendered` | blocker | **structurally unrunnable by the detector** — lands in `unchecked` every run with its discharge named: `pnpm test:stories` (the Storybook axe gate) |

TOK-4/5 keep the harvested schema unforked: `heuristic` already means "pattern with known
false positives", and the structural functions refine the pre-filter hits. A test asserts
every structural function maps to an existing record id, so code-backed rules cannot
become a fifth drift site.

### Core records (`src/core.ts`)

Adopt the harvested portable bans (gradients, `transition: all`, bounce easing, motion at
rest, "Get Started", chart defaults, emoji in chrome, happy-path-only views, …) with two
adaptations:

- **Scopes repointed** to this repo's directories.
- **The icon-adapter rule is dropped.** It enforces pegbo's `@nickv/pegbo-ui/lib/icons`
  adapter; this repo imports `lucide-react` directly by convention, so the rule has no
  local meaning.

Reconcile against `anti-slop.md`: any ban present there but absent from the harvested
core becomes a local record. After migration, `anti-slop.md` keeps the taxonomy, the fix
ladder, and every `why` — enumerated patterns are replaced by a pointer to the records.
One rule, one home.

### Behavior explicitly preserved from today's gate

- Findings under `apps/docs/components/ui/**` (vendored shadcn) **warn instead of fail**
  — the detector supports a per-scope severity downgrade, and the triage doc
  (`vendored-token-findings.md`) keeps its role.
- An empty file glob prints a loud "gate has no coverage" warning (a check that can match
  nothing must say so).
- Exit codes follow the archive discipline: `0` clean, `1` blockers, `2` the script
  itself failed — "nothing wrong" and "could not tell" never collapse.

## 5. The two ratchets, made mechanical

**a11y exclusion list (shrink-only).** The excluded-story list moves out of
`apps/storybook/.storybook/preview.tsx` into a data module beside a committed
`a11y-exclusions.baseline.json`. A test fails when the live list is not a subset of the
baseline; the regenerate script refuses to write a larger baseline. Growing it requires
hand-editing the JSON in a reviewed commit — the friction is the point. This upgrades the
existing CLAUDE.md sentence ("may only shrink, never grow") from rule-in-prose to gate.

**cssVars liveness.** New vitest in `apps/docs`: for every shipped manifest item, every
CSS variable its registry source writes — `var(--x)`, Tailwind arbitrary forms
(`bg-[var(--x)]`, `[--x:…]`, `text-(--x)`) — must resolve to (a) the stock shadcn set
*derived from the docs app's own stylesheet*, (b) the item's declared `cssVars`, or (c)
`cssVars` of its transitive `consumes`. Reverse direction too: a declared `cssVars` key
nobody writes is dead weight. This closes the manifest's own documented hole ("omitting
it silently ships a colourless component"). The first run is expected red; findings are
triaged as real bugs or fixture-documented exemptions in that first PR.

**`contractExempt` is deleted (decision D20).** Zero manifest entries carry it; the
retrofit is the moment to remove the field from `manifest-types.ts` and the honoring
branch from `check-contract.mts`, and to append D20 to
[`decisions.md`](../../design-system/decisions.md) recording that the escape-hatch
pattern it represented is superseded by explicit, baseline-ratcheted exemption lists
(the a11y mechanism above). It is unrelated to the a11y exclusion list and dies
independently of it.

## 6. Gate moments rewiring

- **CI:** eleven steps, zero diff to `ci.yml`. `check:tokens` keeps its name, position,
  and root invocation; only the implementation behind it changes. Schema gate, drift
  gate, per-rule fixtures, liveness, ratchet, and parity tests all ride inside the
  existing `test` step.
- **Write-time hook:** `.claude/hooks/check-tokens-on-edit.sh` repoints to
  `rulecheck.mjs --files <edited> --severity blocker`. Its current exit semantics are
  measured before the change and preserved exactly. The promotion criterion (what would
  justify making it stricter) is written in the hook script's header comment, per the
  manual: blocking requires every blocker rule to hold a passing known-good fixture plus
  two weeks of warn-mode sessions with no false positive.
- **Audit skill:** `unslop` Phase 1's mechanical bans become "run rulecheck"; Phase 2 is
  driven by the run's `unchecked` list (TOK-6 and the core `judgment` rules); Phase 3
  stays fix-as-substitution using each record's own `fix` string. The skill keeps only
  how-to-judge and how-to-fix; bans leave prose entirely.
- **Map updates:** the handful of `CLAUDE.md` / `CONTINUE.md` lines naming
  `check-tokens.mjs` update to name the package. Maps point; they do not restate.

## 7. Vendored checker and stage-00 config

- `tools/ds-architecture/` vendors the archive's checker **runtime only** — `scripts/`,
  `src/`, `stages/`, `LADDER.md`, `package.json` — with one correction found while
  verifying the archive: `@types/node` added to devDependencies (its typecheck fails
  without it). `MANUAL.md`/`DESIGN.md` are *not* vendored: the rule book lives in one
  copy, and theirs is the archive.
- A regenerated `VENDOR.md` stamp records source, date, the two inherited open questions
  (§2), and the known archive erratum (its ARCHIVE.md counts the starter kit as 17 files
  / 11 harvested; the kit's own README correctly enumerates 16 / 10).
- Root `ds-architecture.config.json`, keyed per the checker's own
  `stages/00-architecture-map/reference/ds-architecture.config.example.json`: role
  `component-library`, specs at `docs/design-system/`, instructions `CLAUDE.md`, done
  command `pnpm lint && pnpm typecheck && pnpm check:tokens && pnpm check:contract &&
  pnpm test` (the local gate prefix; full CI adds build, smoke, stories, consumer test).
- Root script `check:ladder` → `node tools/ds-architecture/scripts/conformance.mjs .`.
  **Informational, not a CI step** — only stage 00 is scoreable today, and CI must not
  grow a step that proves little.

## 8. Migration safety, testing, rollout

**Discipline (from the manual's Part 10, all of which this repo has been bitten by):**
fixtures first and red before wired; control-test every new gate with an input that must
fail; run commands bare when the exit status matters (a pipe reports the pipe).

**Parity test:** one temporary test runs today's `check-tokens.mjs` and the new
`rulecheck.mjs` against the real tree and asserts identical finding sets. It exists to
make the swap commit provable, and it is deleted *in the same commit* that deletes the
old script — a permanent parity test against a deleted script is how dead code survives.

**Rollout — five small PRs, in order:**

1. **Package + records + fixtures.** `packages/ds-rules` lands complete and tested;
   nothing in CI consumes it yet.
2. **Parity, then swap.** Parity test green → `check:tokens` delegates to rulecheck →
   old script and parity test deleted together. PR body flags the portability change
   (CLAUDE.md asks for exactly this so it can be carried to the sibling repo).
3. **Ratchets.** a11y baseline mechanism; cssVars liveness with its first-run triage;
   `contractExempt` removal + D20.
4. **Hook + skill.** Hook repoint with preserved semantics; unslop/anti-slop.md slimming.
5. **Checker + score.** `tools/ds-architecture/`, root config, `check:ladder`, and the
   first recorded ladder score.

Each PR: gates green from the repo root before review, preview/link in the PR body.

## 9. Risks

- **The token gate is the repo's most trusted script.** Mitigated by the parity test and
  by migrating patterns byte-for-byte rather than "improving" them in flight. Any pattern
  improvement is its own later PR with its own fixtures.
- **Liveness first-run unknowns.** The gate may surface real long-shipped gaps (that is
  its job); triage happens inside PR 3, and if volume is large the PR ships the gate
  plus a shrink-only exemption baseline of pre-existing findings rather than stalling.
- **Harvested core bans may over-fire here.** Every adopted core rule gets a known-good
  fixture from this repo's real components before it gates; a rule that cannot get one
  is scoped down or moved to `warning` with the reason recorded in the record.

## 10. References

- Archive: `~/ClaudeCode Projects/ds-architecture-archive-2026-08-21.zip` (MANUAL.md
  Parts 0–3, 6, 9–10 are the load-bearing ones for this retrofit).
- Upstream: `pegbo-inc/design-system-rebuild`, PR #115.
- This repo: `apps/docs/scripts/check-tokens.mjs`, `apps/docs/scripts/lib/token-rules.mjs`,
  `apps/docs/scripts/check-contract.mts`, `apps/docs/lib/manifest-types.ts`,
  `docs/design-system/{anti-slop,a11y-baseline,decisions}.md`, `.claude/skills/unslop/`,
  `.claude/settings.json` (hooks), `.github/workflows/ci.yml`.
