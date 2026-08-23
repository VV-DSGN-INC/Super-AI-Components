# Docs citations: prose may not cite what the component graph cannot reach

**Date:** 2026-08-23 · **Status:** designed, plan at `docs/superpowers/plans/2026-08-23-docs-citation-gate.md`
**Extends** `check:contract` (which asserts docs *structure* — "at least one pitfall" — and, per CONTINUE §9's own admission, "never that the export says anything").
**Origin:** second transfer from the `ds-open-problems` bundle (the sibling repo's meta-prose gate), adapted to this repo's typed docs modules.

## Why

`content/components/*.docs.tsx` carries 1,029 backticked citations across 123
files — utilities, slot names, attributes — rendered to every docs-site
visitor. Nothing verifies any of them. The defect class is already recorded
here, not hypothetical: CONTINUE §8 logs `catalog.md` promising `citation-ref`
a "copy quote" affordance the component does not have, "and nothing will
catch it."

The sibling repo hit the same class in its `.meta.json` prose (a recipe
banned by one PR survived in three prose fields) and closed it with a rule
this spec adapts: **a claim-position prose field may not cite a name the
component's reachable source does not carry.**

## What the audit taught the design

- **Docs modules are typed plain data** (`ComponentDocs`), deliberately
  importable — so the gate imports and walks fields instead of regex-parsing
  prose position out of file text. Verified by spike: `tsx` loads a docs
  module with its examples chain intact.
- **Claim position vs warning position is a field boundary here.**
  `donts[].text` and `pitfalls[]` legitimately cite what must NOT be written
  (all three "stale" hits in the audit sample were pitfalls doing their job).
  They are exempt in v1. Recorded refinement: pitfalls often end with a
  positive claim ("as the demo pane's `/70` does") that v1 does not check.
- **Reachability must span the composition graph.** Anatomy notes cite
  consumed children's slots (`asset-detail` cites `stat-readout`); the
  manifest's `consumes` and `shadcn` fields — reconciled from real imports —
  are the reach set, one level deep.
- **Slots can be dynamic.** `approval-card` builds `data-slot` from a verb
  array (`` data-slot={`approval-card-${verb}`} ``); a literal grep reads
  four true claims as lies. Template-literal prefixes count as reachable.
- **Not every kebab word is checkable.** `scrollable-region-focusable` is an
  axe rule id (9 citations); `focus-visible` is a Tailwind variant. The
  extractor classifies; an exported, tested allow-list absorbs the known
  non-checkable vocabulary — an auditable list, never a cleverer pattern
  (the sibling repo's `[a-z]+` lesson).

## Decisions

1. **Scope is citation, not content.** Judgment prose stays human; only
   backticked spans in claim-position fields are checked: `whatItIs`,
   `whyItMatters`, `usage`, `anatomy[].note`, `dos[].text`,
   `accessibility.keyboard[]`, `accessibility.screenReader[]`.
2. **Two vocabularies, two checks.** A span whose first segment is a known
   Tailwind prefix (or that carries a `/step`) is a utility: it must appear
   as a substring of the reachable source. Any other kebab span is a
   slot/component name: it must match a `data-slot` literal, a dynamic
   `data-slot` template prefix, or a consumed component's name.
3. **Reachable source = the item's own file(s) + its manifest `consumes`
   files + its `shadcn` (vendored) files.** One level; the triage widens it
   only if a real finding demands it.
4. **`anatomy[].slot` is checked structurally** — every declared slot must be
   reachable as a literal or dynamic-prefix `data-slot`. This is the most
   load-bearing claim a docs module makes.
5. **aria-*/role claims are deferred, recorded.** Radix injects them at
   runtime; source text cannot prove them and pretending otherwise would
   manufacture false rot. Proving announced behaviour is story work (the
   sibling repo's keyboard-contract analogue), not citation work.
6. **A finding is a failure naming component, field path, and citation.**
   No severity ladder; `check:contract` has none and this adds none.
7. **The gate ships chained into `check:contract`** as its own script with
   its own pure-function tests — ci.yml's step list does not change.

## Triage buckets (fixed before the first run)

1. **Stale claim** — component changed, prose didn't: correct the prose to
   what the component does. Never delete the sentence.
2. **Gate defect** — citation correct, extractor or reach cannot resolve it:
   fix the gate, add the case to its tests.
3. **Vocabulary** — a checkable-looking span that is neither utility nor
   slot (axe id, ARIA token): add to the allow-list with a comment.
4. There is no fourth bucket. A finding fitting none of these means a scope
   decision above is wrong — stop and say so.

## Scope

**In:** the extractor + classifier (pure, tested), the gate script, wiring
into `check:contract`, the full-tree triage, fixing what it finds.
**Out:** aria/role claim proof (deferred above); `donts`/`pitfalls` positive
tails (recorded); prose accuracy beyond citation; `catalog.md` and spec
prose (dated artifacts and normative sources have their own contract).

## First run and triage (2026-08-23, recorded after implementation)

227 findings; every one fit a bucket, none forced a fourth:

- **68** were catalog cross-references and **69** were the item's own declared
  states — bucket 2, the reach model widened to both vocabularies (decision 3
  amended: prose names also resolve against any manifest item name and the
  item's own `states`; anatomy slots deliberately do not). Zero citations
  needed *other* items' states.
- **58** were the O-family's parallel convention: shells mark regions with
  `data-region="…"` and anatomy claims the full attribute string — bucket 2,
  the resolver now reads regions.
- Extractor gaps (bucket 2): ternary `data-slot={cond ? "a" : "b"}` and
  `slot="…"` props flowing into `data-slot={slot}`; ten utility prefixes
  missing from the classifier.
- Vocabulary (bucket 3): two axe rule ids, one cursor keyword, one domain
  term, each now a commented allow-list entry.
- **Three genuine rot instances (bucket 1), fixed by correcting prose:**
  `action-stack` claimed a `action-stack-item` slot that never shipped (the
  row is A9 `entity-row`); `settings-dialog` claimed
  `settings-dialog-row-label` where `-row-text` ships; `generation-shell`
  filed the (real) `data-result-id` attribute in the anatomy *slot* field,
  re-anchored to the `result-card` entry.

End state: 116 docs modules, 272 checkable citations, all reachable; both
planted controls observed firing before this green was believed.

## Verification

- **Positive control:** plant `` `text-foreground/95` `` in a passing docs
  module's `usage`; the gate must name the module, the field, the span.
- **Slot control:** plant a fictional slot in an `anatomy` entry; same.
- **Negative controls:** a pitfall citing `text-muted-foreground` stays
  silent; `approval-card`'s dynamic verb slots stay silent;
  `scrollable-region-focusable` in an a11y note stays silent.
- The plant is observed failing before any green run is believed.
