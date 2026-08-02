# Wave 1 primitives (A9–A12) — Design Specification

**Date:** 2026-08-02
**Status:** Proposed — awaiting approval
**Wave:** 1 (completes the primitive layer with A8 `preview-tile`, shipped in #8)
**Covers:** A9 `entity-row` · A10 `stat-readout` · A11 `reset-affordance` · A12 `section-header`

---

## 1. Consumer audit

Same method that caught the A8 fan-out error: every claimed consumer checked against its own entry
in `component-specs.md` rather than against `concept-model.md`'s summary table.

### A9 `entity-row` — claimed 6, confirmed 4, membership wrong

| Claimed | Its own spec says | Verdict |
| --- | --- | --- |
| D6 `skill-menu` | *"Rows are A9"* | ✅ |
| I4 `ai-tools-menu` | **"Built on: A9"** | ✅ |
| F4 `action-stack` | **"Base: Dropdown-menu, A9"** | ✅ |
| K5 `source-panel` | **"Built on: A9, Progress"** | ✅ |
| C5 `recommendation-card` | no A9 mention | ❌ |
| B3 `sidebar-nav` | mentions **A12**, not A9 | ❌ |

Two unlisted consumers turned up instead:

- **C3 `feature-card-row`** — *"Cards are A9 in a card layout — the same four slots, stacked
  vertically."* The table names C5 where the evidence points at C3.
- **B2 `workspace-switcher`** — *"a checked list, or A9 rows with descriptions."*

**Corrected fan-out: D6, I4, F4, K5, C3, B2.** Still six, but two of the six were wrong. A9 remains
the highest fan-out primitive left.

### A10 `stat-readout` — claimed 4, one is a cut component

| Claimed | Verdict |
| --- | --- |
| F3 `asset-detail` | ✅ **"Base: Dialog, A10"** |
| N5 `run-inspector` | ✅ **"Base: Tabs, A10"** |
| N6 `usage-dashboard` | ❓ plausible, never declared |
| G5 `node-result` | ❌ **cut by D9** |

D9 removed family G but never propagated to this row — the same class of stale-fan-out error the A8
audit found. **Corrected: 2 confirmed + 1 unstated.**

### A11 `reset-affordance` — has no fan-out row at all, and one consumer is already shipped

A11 is missing from `concept-model.md`'s primitive fan-out table entirely. Its real consumers,
found by searching the specs:

- **A6 `field-row`** — *"A11 `reset-affordance` is the optional trailing slot. It is what makes a row
  feel bound to a value."*
- **I2 `property-inspector`** — **"Built on: A6, A11"**
- **A12 `section-header`** — carries the group-level reset (from A11's own spec).

**A6 `field-row` is already live in the registry, and it has no reset affordance.** Verified against
`registry/super-ai/field-row.tsx`: no reset, revert or ↺ anywhere. A6 shipped incomplete against its
own spec, and landing A11 means retrofitting it. See §4.

A11 is also consumed by two other primitives — the only primitive-on-primitive dependency in the
catalog — which fixes the build order.

### A12 `section-header` — claimed 5, confirmed 1

| Claimed | Verdict |
| --- | --- |
| I1 `tool-panel` | ✅ **"Built on: A12, A8"** |
| C3, L4, J2, J1 | ❓ never declared |
| **B3 `sidebar-nav`** | ➕ unlisted — *"Section labels are A12 at its smallest size"* |

A12's spec asserts *"'View all' is a link, never a button… holds across all five consumers"* — a
claim about five components, only one of which declares it. The pattern is real and observed on the
board; the specific list is unverified. **Built as specified, fan-out corrected to what's provable.**

### What the audit means

Three of four fan-out rows were wrong, in three different ways: wrong membership (A9), a cut
component still listed (A10), and a missing row (A11). `concept-model.md`'s table is a summary that
has drifted from the per-component specs beneath it. Correcting it is part of this work.

## 2. Build order

Forced by the dependencies above, not by preference:

1. **A9 `entity-row`** — six consumers, no dependencies. Highest leverage, safest to build first.
2. **A12 `section-header`** — no dependencies, and A11's group-level variant attaches to it.
3. **A11 `reset-affordance`** — depends on A12 for group-level scope; triggers the A6 retrofit.
4. **A10 `stat-readout`** — standalone, fewest consumers, build last.

## 3. APIs

All four follow the shipped conventions: `data-slot`, `cn()` from `@/lib/utils`, semantic shadcn
variables only, named exports, co-located tests, no npm dependencies.

### 3.1 A9 `entity-row`

```tsx
interface EntityRowProps extends Omit<React.ComponentProps<"div">, "onSelect"> {
  icon?: React.ReactNode;
  title: React.ReactNode;        // the only required slot
  description?: React.ReactNode;
  trailing?: React.ReactNode;    // badge · chevron · switch · cost-chip
  selected?: boolean;
  disabled?: boolean;
  onSelect?: () => void;
}
```

The load-bearing rule from its spec: *"Description is optional but row height is not — a menu of
mixed rows must not look ragged."* Row height is fixed whether or not `description` is present. That
is the assertion the tests exist to protect.

Interaction follows A8's resolved pattern: `onSelect` makes it a `<button>` with `aria-pressed`;
without it, a `<div>` outside the tab order. Reusing the pattern rather than reinventing it is the
point of settling it once on A8.

### 3.2 A12 `section-header`

```tsx
interface SectionHeaderProps extends React.ComponentProps<"div"> {
  title: React.ReactNode;        // required
  count?: number;
  action?: React.ReactNode;      // "View all" — rendered as a link, never a button
  collapsible?: boolean;
  defaultOpen?: boolean;         // uncontrolled
  open?: boolean;                // controlled
  onOpenChange?: (open: boolean) => void;
  size?: "default" | "sm";       // sm = B3's section labels
}
```

*"The collapsible variant owns its disclosure state; the panel below is a slot it knows nothing
about."* So `SectionHeader` renders only the header and reports state; it never wraps content. This
keeps it usable above a grid, a list, or nothing at all.

### 3.3 A11 `reset-affordance`

```tsx
interface ResetAffordanceProps extends React.ComponentProps<"button"> {
  state?: "modified" | "default" | "keyframed";
  scope?: "row" | "group";       // group = larger, sits on a section header
  collapsed?: boolean;           // degrades to a modified-dot
  onReset?: () => void;
  label?: string;                // accessible name; defaults to "Reset"
}
```

Three states share one slot so the control never changes position: `modified` (active), `default`
(dimmed), `keyframed` (diamond). `collapsed` renders the modified-dot, so *"a hidden section still
signals changes."*

### 3.4 A10 `stat-readout`

```tsx
interface StatReadoutProps extends React.ComponentProps<"dl"> {
  items: { label: React.ReactNode; value?: React.ReactNode; copyable?: boolean }[];
  columns?: 1 | 2;               // presentation is a prop, not a fork
}
```

Rendered as a `<dl>` — this is definition data, and the semantics are free. Two rules from its spec
are testable and both matter: **missing values render an em-dash, never a blank cell**, so absence
is visibly deliberate; and values are **copyable**, because seed and sampler exist to make a result
reproducible.

## 4. The A6 `field-row` retrofit

A6 is shipped and installed. Its spec says A11 is its optional trailing slot; the shipped component
has no such slot.

**Proposal: add an optional `reset` prop to A6, composing A11.** Purely additive — no existing
prop changes meaning, and omitting it renders exactly what ships today.

This is safe in a way it would not be in a normal library. shadcn registries **copy code into the
consumer's app**, so a registry change cannot affect an app that already installed the component —
only new installs see it. The design spec names this explicitly: *"upstream API changes affect new
installs only, never running apps."*

`field-row` therefore gains `registryDependencies: [reset-affordance]` and its `extras` entry in
`gen-registry.mts` — its first registry dependency.

## 5. Testing

One co-located test per component. Load-bearing assertions:

- **A9** — row height identical with and without `description`; `trailing` renders without shifting
  the row grid; button semantics only when `onSelect` is passed.
- **A12** — controlled and uncontrolled disclosure; `action` renders as a link, not a button; `count`
  omitted renders no count; `sm` differs from `default`.
- **A11** — each of the three states renders in the same slot; `collapsed` renders the dot; `onReset`
  fires on click and Enter/Space.
- **A10** — missing value renders an em-dash rather than empty; `columns` changes layout, not
  content; copyable values expose a copy control.
- **A6 retrofit** — without `reset` the output is unchanged from today; with it, A11 renders in the
  trailing slot.

## 6. Doc corrections

- `concept-model.md` — fix the A9 row (swap C5→C3, add B2, drop B3), fix A10 (drop the cut G5, mark
  N6 unstated), **add the missing A11 row**, and add B3 to A12.
- `component-specs.md` — A9's "six consumers" sentence lists the corrected six; A6 gains a note that
  its reset slot composes A11; A12's "all five consumers" claim is softened to what's provable.
- `decisions.md` — record the audit as **D13**, including that D9 never propagated to A10.

## 7. Non-goals

- **Retrofitting A11 into I2 `property-inspector`** — I2 is a Wave 6 component and does not exist yet.
- **Verifying A12's four unconfirmed consumers.** They are built when those components are built; the
  header pattern itself is well-evidenced on the board.
- **Changing A6's rendered output by default.** The retrofit is additive only.
