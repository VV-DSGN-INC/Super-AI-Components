# `settings-shell` Usage & Billing sections — Design Specification

**Date:** 2026-08-03
**Status:** Proposed — awaiting approval
**Covers:** O12 `settings-shell` composition · M2 `credits-indicator` · M3 `quota-meter` ·
M4 `pricing-table` · N6 `usage-dashboard`

---

## 1. Context & Goal

Question raised in review: usage and billing are conceptually different (real-time consumption vs.
transactional plan/payment management) — should the catalog carry two separate shells for them, or
one?

**Decision: one shell, two sections.** `settings-shell` (O12) already defines its regions as
*grouped nav → deep-linkable sections*; Usage and Billing are two more entries in that nav, not a
new layout archetype. The O-family is differentiated by **layout shape** (three-pane, canvas,
single-column-with-nav), not by content topic, and Usage/Billing are both "nav item → content
panel," identical in shape to every other settings section (Workspace, MCP, Appearance, etc. —
see [block-specs.md §O12](../design-system/block-specs.md)).

Precedent for *not* forking shells over topic: `reference-board-analysis.md` explicitly warns
against this pattern elsewhere — **"S3 and S4 are one shell with a variant, not two."** The same
reasoning applies here.

## 2. What already exists (audit)

The catalog already draws a usage/billing distinction — just along a different axis than "usage
shell vs. billing shell." It splits by **audience**, not by shell:

| Component | Family | Audience | Data |
| --- | --- | --- | --- |
| M2 `credits-indicator` | Account, plan & monetization | Individual | Persistent balance (ring/counter) |
| M3 `quota-meter` | Account, plan & monetization | Individual | Per-resource plan usage + reset countdown |
| M4 `pricing-table` | Account, plan & monetization | Individual | Plan tiers, upgrade path |
| N6 `usage-dashboard` | Feedback, trust & observability | **Team** | Per-model spend breakdown, deltas, period select |

N6's own spec calls this out directly: *"the team-facing counterpart to M2 — same data, different
audience"* ([component-specs.md](../design-system/component-specs.md)). Its home in the build
sequence is **Wave 11 — "N4–N6 (observability) + `records-shell`"**, not `settings-shell`
([decisions.md §5](../design-system/decisions.md)).

So there are, in effect, already two places usage data surfaces — but the split is individual
settings (`settings-shell`) vs. team observability (`records-shell`), not usage vs. billing. That
existing structure is correct and this spec does not change it. What's undefined is what "Billing"
looks like *within* `settings-shell` once you're past the upgrade prompt.

### Gap found during this audit

**No component covers billing history (invoices/receipts) or payment method management.** M4
`pricing-table` is upgrade/plan-selection only — feature lists, monthly/yearly toggle, add-on row.
Nothing in the catalog renders a past-invoices list or a saved-card/payment-method row. Searched all
of `catalog.md`, `component-specs.md`, `decisions.md`, `gaps.md` for "invoice," "payment method,"
"receipt" — zero hits. This is a real hole, not an oversight in this document.

Also noted in passing, unrelated to this question but same audit pass: **M7 `connection-manager`**
is listed in `catalog.md` and `decisions.md`/`gaps.md` but has no entry in `component-specs.md`
(family M jumps M1–M6 straight to N1). Flagged in §6, not fixed here.

## 3. Composition — the two sections

Both live under `settings-shell`'s existing "setting sections" region, added to the grouped nav
alongside Workspace/Appearance/MCP/etc.

### 3.1 "Usage" section
**Filled by:** M3 `quota-meter` (per-resource rows) + M2 `credits-indicator` (persistent balance,
already visible in the topbar/sidebar per its own spec — this section is its detail/history view,
not a second instance of the widget).

- Per-resource rows, not one aggregate bar — M3's spec is explicit that an aggregate "hides the one
  you'll hit."
- Reset countdown is the primary decision-driver, ranked above the raw numbers.
- No new component required. This section is existing M2/M3 content given a nav slot.

### 3.2 "Billing" section
**Filled by:** M4 `pricing-table` (plan/upgrade) + **two components that do not yet exist**:

- `payment-method-card` — saved card(s), add/replace/remove, default marker. Not designed here.
- `invoice-list` — past charges, date/amount/status, downloadable receipt. Not designed here.

M4 alone is sufficient for "what plan am I on / how do I upgrade." It is not sufficient for "show me
my last six charges" or "update my card" — those need the two components above.

## 4. Non-goals

- Designing `payment-method-card` or `invoice-list` — flagged as a gap, not scoped in this spec.
  Follow-up spec needed before Billing can be built as more than an upgrade prompt.
- Changing N6 `usage-dashboard`'s home in `records-shell` — audience split (individual vs. team) is
  correct as-is and out of scope here.
- A dedicated top-level "Billing" or "Usage" shell — explicitly rejected in §1.

## 5. Open question

**Q7 · Does Billing need `payment-method-card` + `invoice-list` before Wave 10, or can
`settings-shell`'s Billing section ship as upgrade-only (M4 alone) with history/payment management
deferred?** Affects whether Wave 10 ("M + `settings-shell`," per `decisions.md` §5) needs two new
components added to its scope or can ship as originally sized.

## 6. Doc corrections

- `component-specs.md` is missing a full entry for M7 `connection-manager` (present in `catalog.md`
  and `decisions.md`/`gaps.md` only). Same class of drift the wave-1 primitives audit found
  elsewhere in this catalog — not fixed here, noted for whoever picks up family M next.
