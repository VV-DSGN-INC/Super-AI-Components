# Wave 2 — app shell, home & `home-shell` — Design Specification

**Date:** 2026-08-02
**Status:** Proposed — awaiting approval
**Wave:** 2 (per [decisions.md](../../design-system/decisions.md) §5 — "B (app shell) + C (home) + `home-shell`")
**Covers:** B1 `app-sidebar` · B2 `workspace-switcher` · B3 `sidebar-nav` · B4 `modality-rail` ·
B5 `promo-card` · B7 `app-topbar` · B8 `account-menu` · C1 `hero-omnibox` · C2 `suggestion-chips` ·
C3 `feature-card-row` · C4 `recent-grid` · C5 `recommendation-card` · O1 `home-shell`

B6 `thread-list` shipped in Wave 0. Twelve components plus the first block — the first `registry:block`
the pipeline has ever emitted.

| | |
| --- | --- |
| Scope | 12 components, 1 block, 1 additive primitive retrofit (A9), registry-pipeline extension for blocks |
| Registry | `super-ai` namespace; `registry/super-ai/*.tsx`, block at `registry/super-ai/home-shell.tsx` |
| Base | shadcn base-nova (sidebar, avatar, badge, breadcrumb, button-group, card, toggle-group, tooltip, radio-group, textarea, collapsible, item) + `@ai-elements/suggestion` for C2 |
| Testing | One co-located `*.test.tsx` per item, per repo convention |

---

## 1. Consumer audit (D13)

Method per **D13**: *"The table in concept-model.md is a derived summary, not a source of truth. The
per-component entries in component-specs.md are authoritative."* Every fan-out claim touching families
B and C was checked against the consuming component's own entry.

### 1.1 The five claims the fan-out table makes about B and C

| Claimed in `concept-model.md` §2 | What the consumer's own entry says | Verdict |
| --- | --- | --- |
| A9 `entity-row` → **B2** `workspace-switcher` | *"a checked list, or A9 rows with descriptions"* | ✅ confirmed |
| A9 `entity-row` → **C3** `feature-card-row` | *"Cards are A9 in a card layout — the same four slots, stacked vertically"* | ✅ confirmed — **but see §1.3** |
| A12 `section-header` → **B3** `sidebar-nav` | *"Section labels are A12 at its smallest size, not a bespoke caption style"* | ✅ confirmed |
| A12 `section-header` → **C3** `feature-card-row` | C3's entry never mentions A12 | ❌ **undeclared** |
| A8 `preview-tile` → **C4** `recent-grid` | **"Built on: A8"** | ✅ confirmed |

A12's C3 claim is the fourth in the list of five A12 consumers the D13 audit already flagged as
unproven (*"of the listed consumers only I1 and B3 declare A12"*). Wave 2 is the first wave where one
of those five actually gets built, and C3's entry settles it: **C3 is not an A12 consumer.** Whatever
section header sits above a feature card row belongs to O1's composition, not to C3's internals.

### 1.2 A sixth consumer the table cannot show, because the primitive has no row

**B8 `account-menu` declares A1 `kbd`:** *"Shortcut hints use A1. A row that has a shortcut must show
it, or the shortcut is never learned."*

`concept-model.md` §2 has **no row for A1** — and none for A4 `choice-chips` or A5 `filter-bar`
either. The table carries 9 rows for 12 primitives. D13 recorded A11 as *"had no row at all"*; that
was not a one-off. Three primitives are still missing, and one of them (A1) has two provable
consumers today: **L5 `shortcuts-sheet`** (shipped — `gen-registry.mts` already declares
`registryDependencies: ["dialog", self("kbd")]`) and **B8 `account-menu`**.

The pattern D13 named holds: **every fan-out row checked so far has been wrong, and the rows that are
absent are as wrong as the rows that are present.**

### 1.3 A9 cannot render what C3 declares

C3's claim on A9 is confirmed by declaration, and then contradicted by the shipped code.
`registry/super-ai/entity-row.tsx` line 33:

```
"flex min-h-14 w-full items-center gap-3 rounded-lg px-3 py-2 text-left"
```

That is a horizontal row with a fixed 56px minimum height. C3 needs *"the same four slots, **stacked
vertically**"*. The shipped A9 has no vertical presentation, and no prop that would produce one.

This is the same class of defect D13 found on A6 `field-row` — a component shipped without a
capability its own consumer's spec requires — caught before it ships this time rather than after.
**Resolution in §4.1: an additive `layout` prop on A9.**

### 1.4 The same test disqualifies A9 from B3

D13 removed `sidebar-nav` from A9's fan-out on the grounds that B3's entry declares A12 rather than
A9. That was a documentary argument. There is now a mechanical one: A9's `min-h-14` is 56px, and a
sidebar nav row is 36px — `thread-list.tsx` line 118 ships sibling rows at `h-9`. A sidebar built from
A9 rows would be half again as tall as the sidebar shipped in Wave 0, immediately beside it.

**B3's rows are B3's own.** The exclusion stands, now for a reason that survives a re-reading.

### 1.5 C5 `recommendation-card` — the tension D13 left open, re-checked

D13 removed C5 from A9's fan-out (*"`recommendation-card` never declared it"*). Re-read against its
own entry, C5 says *"a one-line row in the feed, and a modal explaining inputs and steps"*. A one-line
row is A9-shaped. It is still not declared, and it carries an app-icon cluster and two competing
actions that A9's single `trailing` slot does not model.

**The exclusion holds.** Recorded here so the next audit does not re-litigate it from the same
sentence.

### 1.6 Layer-model violations in the source specs

The layer model states L3 components *"Never depend on each other"*. Four Wave-2 entries describe
exactly that:

| Entry | The sentence | The L3 components it names |
| --- | --- | --- |
| B1 `app-sidebar` | *"Owns arrangement (switcher, nav, promo, footer), not sidebar mechanics."* | B2, B3, B5, B8 |
| C1 `hero-omnibox` | *"Credits sit at the point of spend (M2), never buried in billing."* | M2 |
| C1 `hero-omnibox` | *"Attach, model select and mode chip live inside the field… Same slot arrangement as D1."* | D4, D1 |
| O1 `home-shell` | **"Filled by:"** nine components | B1, B7, C1–C5, M2, L1 |

These are not contradictions to resolve away — they are the *point* of a shell. But they only stay
legal one way: **shells accept regions as `React.ReactNode` props and never import another L3
component.** O1 (L4) may compose anything; B1 and C1 (L3) may not. This is the single most
load-bearing architectural rule in Wave 2, and §5 gives it a test in every shell-shaped component.

### 1.7 O1 `home-shell` — three internal inconsistencies

1. **The region list is short.** `block-specs.md` O1 lists five regions — *"sidebar · topbar · hero
   omnibox · feature cards · recents grid"* — then names nine filling components and an invariant
   order with five *content* stages: *"composer → starters → features → recents → inspiration"*.
   Starters (C2) and inspiration (C5) appear in the order and in the filled-by list but not in the
   regions. **The real region count is seven** (§4.13).
2. **Two of the nine filling components do not exist and are not due until Waves 9 and 10.** M2
   `credits-indicator` (Wave 10, family M) and L1 `empty-state` (Wave 9, family L). O1 cannot be
   "filled by" them in Wave 2.
3. **A direct contradiction about the empty day-one page.** O1: *"The whole page is C4's empty state
   on day one."* C4: *"The empty state is an in-grid tile, **not a page takeover**."* Flagged, not
   silently resolved. The reading that satisfies both: on day one the shell renders in full — hero,
   starters, features — and the recents *region* shows C4's in-grid empty tile. O1's sentence is about
   which surface dominates a new user's attention, not about replacing the page. **This needs Nick's
   confirmation before O1 is built**, because the other reading (a page-level takeover) would make L1
   a Wave-2 blocker.

### 1.8 Two contract rows that do not match the components beneath them

- **Cost** — binds *"B D E F G M"*, yet A2 `cost-chip`'s fan-out row contains no B item, and no B
  entry declares A2. B's binding is *placement-level*: B5 `promo-card`'s quota-warning flavour and
  B3's tier badges. Real, but not a composition. Worth stating so nobody wires A2 into the sidebar to
  satisfy a table.
- **Cost** also omits **C**, while C1 declares *"Credits sit at the point of spend (M2)"*. Family C
  hosts a cost placement and is not listed as bound by the contract.
- **Empty** — binds *"B C D F G I J K L N O"*, and L1 `empty-state` ships in **Wave 9**. Wave 2 must
  therefore ship empty *slots*, not empty *states*, or the Empty contract gets retrofitted twice. See
  §4 — B1, B3, C3 and C4 each take an `empty` slot now, which L1 fills later without an API change.

### 1.9 A shipped primitive that is incomplete against its own spec

Not a Wave-2 deliverable, reported because the audit surfaced it and B6 is the consumer.

A3 `date-section`'s entry states: *"The header is sticky within its scroll container"* and *"Count and
collapse are optional slots; the four consumers each use a different combination."* The shipped
`registry/super-ai/date-section.tsx` is 32 lines and has **no count, no collapse and no sticky
positioning** — only a `label`. Same class as the A6/A11 finding in D13.

Its four consumers are B6 (shipped, uses none of the missing slots), F2 (Wave 4), J4 and J5 (Wave 7).
**Nothing in Wave 2 is blocked.** Retrofit it in Wave 4 when F2 first needs a count. Recorded in §6.

### 1.10 Pipeline findings — the registry cannot emit a block

`apps/docs/scripts/gen-registry.mts`:

- `Item.type` is `"registry:component" | "registry:hook" | "registry:lib"` — **no `"registry:block"`**.
- `file()` hardcodes `type: "registry:component"` and `target: components/super-ai/<name>.tsx` for
  every item.
- `apps/docs/lib/catalog.ts` types `group` as `"Primitives" | "Components"` — no `"Blocks"`.

O1 is the first block in the catalog, so all three need extending. This is mechanical, but it is real
work that sits between "twelve components are done" and "Wave 2 is done".

`apps/docs/components/ui/` currently holds **seven** shadcn components (alert-dialog, button, dialog,
dropdown-menu, input, separator, tabs). Wave 2 needs roughly thirteen more. All of them already exist
and compile in `apps/storybook/src/components/ui/` under the same `base-nova` style and the same
`@base-ui/react ^1.5.0` — so this is a copy between workspaces, not a port.

**One exception: `carousel` pulls `embla-carousel-react`.** C3's catalog row names Carousel as a base,
but C3's own rule is about the *affordance*: *"Horizontal scroll needs a visible next affordance;
trackpad-only scroll hides half the content."* That is satisfiable with scroll-snap and two buttons.
**Recommendation: build C3 without Carousel** and keep the super-ai tier at its current single npm
dependency (`lucide-react`). Flagged as a decision, not taken unilaterally — see §6.

### 1.11 Audit summary

| # | Finding | Severity |
| --- | --- | --- |
| 1 | A12 → C3 disproved; C3 declares A9 only | doc fix |
| 2 | A1, A4, A5 have **no fan-out row at all**; A1's is provable today (L5 + B8) | doc fix, extends D13 |
| 3 | Shipped A9 cannot render C3's declared vertical card | **blocks C3** |
| 4 | A9's 56px row height mechanically disqualifies it from B3 | confirms D13 |
| 5 | Four L3 entries describe L3→L3 dependencies | architectural — §1.6 |
| 6 | O1's regions (5) ≠ its filled-by (9) ≠ its content order (5) | doc fix |
| 7 | O1 names M2 (Wave 10) and L1 (Wave 9) as fillers | scope — slots |
| 8 | O1 vs C4 contradict each other on the empty page | **needs a decision** |
| 9 | Cost contract binds B with no A2 consumer; omits C, which has a placement | doc fix |
| 10 | Empty contract binds B and C; L1 is Wave 9 | slot convention |
| 11 | A3 shipped without count / collapse / sticky | deferred to Wave 4 |
| 12 | `gen-registry.mts` cannot emit `registry:block` | **blocks O1** |

## 2. Build order

Forced by §1, not by family order.

1. **A9 `layout` retrofit** — the only cross-wave dependency in the wave (§1.3). C3 cannot start
   until it lands, and it is ten lines. First.
2. **B1 `app-sidebar`** — no dependencies, and it establishes the slot contract (§1.6) that four later
   items copy. Building it first means the rule is demonstrated rather than described.
3. **B3 `sidebar-nav`** — consumes A12 at `size="sm"`, which Wave 1 built *for this component*
   (*"sm = B3's section labels"*). Fills B1's `nav` slot.
4. **B2 `workspace-switcher`** — consumes A9. Fills B1's `switcher` slot.
5. **B5 `promo-card`** — fills B1's `promo` slot; carries the Cost contract's only ambient placement.
6. **B8 `account-menu`** — consumes A1. Fills B1's `footer` slot. **B1 is now demonstrably complete**,
   which is the first checkpoint worth showing.
7. **B7 `app-topbar`** — independent; O1's second region.
8. **B4 `modality-rail`** — independent, and the one Wave-2 component **no Wave-2 block exercises**
   (its shells, O3/O4, are Wave 6). Built here so family B closes, but it ships without a block to
   prove it — a named risk, not an oversight.
9. **C1 `hero-omnibox`** — the largest single component in the wave and O1's only emphasised element.
10. **C2 `suggestion-chips`** — composes `@ai-elements/suggestion`; the wave's only cross-registry
    dependency, and the first in the repo.
11. **C3 `feature-card-row`** — requires step 1.
12. **C4 `recent-grid`** — consumes A8 with `labelPlacement="below"`, the placement A8 added for it.
13. **C5 `recommendation-card`**.
14. **O1 `home-shell`** — composes 2, 7, 9–13, and requires the pipeline extension in §1.10. Last, by
    definition: a block is the demo that proves its components.

The shadcn base components (§1.10) are vendored as each step needs them, not in one batch — a batch
import adds thirteen untested files to the docs app before anything uses them.

## 3. APIs

All twelve follow the shipped conventions: `"use client"`, `data-slot` attributes, `cn()` from
`@/lib/utils`, semantic shadcn CSS variables only, named exports, co-located tests.

Two Wave-1 conventions apply throughout and are not restated per component:

- **Button semantics only when interactive.** An `onSelect`-style prop makes the element a `<button>`
  with `aria-pressed`; without it, a `<div>` outside the tab order.
- **Two explicit branches, never a dynamic tag,** wherever a button-only prop such as `disabled` is
  involved — `entity-row.tsx` line 69 records why: *"a union element type cannot be checked against
  div props."*

### 3.1 A9 retrofit — `layout`

```tsx
interface EntityRowProps /* … unchanged … */ {
  layout?: "row" | "card";   // default "row" — exactly what ships today
}
```

`row` is the current horizontal grid at `min-h-14`. `card` stacks the same four slots vertically:
icon, then title, then description, with `trailing` pinned to the bottom edge. **The four slots and
their names do not change** — that is what C3's *"the same four slots, stacked vertically"* asserts,
and what makes this a presentation prop rather than a second component.

Additive and safe for the same reason the A6 `reset` retrofit was: shadcn registries copy code into
the consumer's app, so *"a registry change never affects an already-installed component — only new
installs see it"* (D13).

### 3.2 B1 `app-sidebar`

```tsx
type AppSidebarWidth = "expanded" | "icon-rail" | "mobile-drawer";

interface AppSidebarProps extends React.ComponentProps<"div"> {
  width?: AppSidebarWidth;        // default "expanded"
  switcher?: React.ReactNode;     // B2
  nav?: React.ReactNode;          // B3 — or B4 in the studio shell
  content?: React.ReactNode;      // B6 thread-list, or any scrollable body
  promo?: React.ReactNode;        // B5
  footer?: React.ReactNode;       // B8
  empty?: React.ReactNode;        // Empty contract; L1 fills this in Wave 9
}
```

Every slot is optional, because *"the docs shell uses switcher + nav only; the studio shell swaps nav
for B4."* No slot is typed to a component — B1 imports nothing from family B (§1.6).

*"Three widths are one component, not three,"* so `width` maps onto the shadcn Sidebar's own
mechanics rather than forking markup: `expanded` → default, `icon-rail` → `collapsible="icon"` in its
collapsed state, `mobile-drawer` → the Sheet presentation. B1 *"owns arrangement… not sidebar
mechanics"* — the scroll behaviour, the rail collapse and the mobile breakpoint all stay in L0.

`content` scrolls; `promo` and `footer` are pinned below it. That ordering is B1's entire contribution
and is the thing worth asserting.

### 3.3 B3 `sidebar-nav`

```tsx
interface SidebarNavItem {
  id: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  href?: string;
  trailing?: React.ReactNode;   // count · tier badge · unread dot · running spinner · external-link
  disabled?: boolean;
}

interface SidebarNavSection {
  id: string;
  label?: React.ReactNode;      // rendered by A12 size="sm"; omit for an unlabelled group
  items: SidebarNavItem[];
  pinned?: boolean;             // bottom-pinned group — never scrolls with the middle
}

interface SidebarNavProps extends Omit<React.ComponentProps<"nav">, "onSelect"> {
  sections: SidebarNavSection[];
  activeId?: string;
  onSelect?: (id: string) => void;
  empty?: React.ReactNode;
}
```

Section labels compose **A12 with `size="sm"`** — Wave 1 shipped that size for this exact use. Not a
bespoke caption style, per B3's own rule.

`trailing` is one opaque slot covering all five listed variants. Five props would let two of them be
passed at once, which the sidebar has no room to render.

**Active state is a filled row (`bg-accent`), never a left border** — *"borders break when the sidebar
collapses."* This is the same reasoning as A8's ring-not-border rule, and it is testable.

`pinned` comes from the catalog table's B3 row (*"pinned group"*) rather than from the authoritative
entry; recorded so the provenance is clear. It is a property of the *section*, not of an item — a
pinned group is a separate list, which is what stops the scrollable middle from swallowing it.

### 3.4 B2 `workspace-switcher`

```tsx
interface Workspace {
  id: string;
  name: string;
  description?: React.ReactNode;  // presence of any description flips the flavour
  icon?: React.ReactNode;
  plan?: React.ReactNode;         // the badge shown on the trigger for the current workspace
}

interface WorkspaceSwitcherProps extends Omit<React.ComponentProps<"div">, "onSelect"> {
  workspaces: Workspace[];
  value?: string;
  onSelect?: (id: string) => void;
  createLabel?: React.ReactNode;  // default "Create workspace"
  onCreate?: () => void;          // omitted → no create row and no rule above it
}
```

*"Two flavours from one component: a checked list, or A9 rows with descriptions."* The flavour is
**derived from the data** — if any workspace carries a `description`, every entry renders as an
`EntityRow`; otherwise as a checked menu item. A `variant` prop would let a caller ask for a checked
list while supplying descriptions, and then drop them.

The trigger renders name + `plan` because *"that plan badge is the cheapest upgrade prompt in the
shell."*

*"Creation is always last, below a rule — never a plus icon competing with the trigger."* So `onCreate`
produces a trailing `Separator` + row, and there is deliberately no trigger-adjacent add affordance in
the API at all. The rule is enforced by the absence of a prop.

### 3.5 B5 `promo-card`

```tsx
type PromoCardFlavour = "upgrade" | "invite" | "update" | "quota";

interface PromoCardProps extends React.ComponentProps<"div"> {
  flavour?: PromoCardFlavour;   // default "upgrade"
  title: React.ReactNode;
  description?: React.ReactNode;
  art?: React.ReactNode;        // optional in all four
  action?: React.ReactNode;
  dismissed?: boolean;          // controlled — the component holds no dismissal state
  onDismiss?: () => void;       // omitted → no dismiss control renders
}
```

*"Always dismissible, and dismissal must persist. A CTA that returns every session reads as a bug."*

A copied component cannot own persistence, and internal `useState` dismissal is precisely the bug that
sentence describes — hidden for a session, back on reload. **B5 therefore holds no dismissal state at
all.** `dismissed` is the only truth; when true the component renders `null`. Persistence is the
consumer's, and the docs page must say so. This is the rare case where refusing to make a prop
uncontrolled *is* the design rule.

*"Four flavours, one component"* — `flavour` changes emphasis and default iconography, never the slot
structure.

### 3.6 B8 `account-menu`

```tsx
type ThemePreference = "light" | "dark" | "system";

interface AccountMenuItem {
  id: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  shortcut?: string[];          // SEMANTIC keys — ["mod", "K"] — handed to A1, never glyphs
  onSelect?: () => void;
}

interface AccountMenuProps {
  trigger?: React.ReactNode;    // defaults to the avatar
  name: React.ReactNode;
  email?: React.ReactNode;
  avatar?: React.ReactNode;
  plan?: React.ReactNode;
  items?: AccountMenuItem[];
  theme?: ThemePreference;
  onThemeChange?: (theme: ThemePreference) => void;
  backgrounds?: { id: string; swatch: React.ReactNode }[];
  background?: string;
  onBackgroundChange?: (id: string) => void;
  onSignOut?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}
```

*"Identity block on top, sign-out last, separated by rules. Conventional order; do not reinvent it."*
The order is fixed by the component; `items` fills only the middle block. There is no prop that can
move sign-out.

*"Appearance is a nested submenu, not a dialog."* Rendered as a `DropdownMenuSub` containing a
`RadioGroup` for `theme` and the `backgrounds` swatches. *"Theme is changed often and should not cost a
modal."*

`shortcut` is `string[]` of **semantic** keys, not a display string, because A1's own rule is
*"callers pass semantic keys (`mod`), and the chip renders ⌘ on macOS, Ctrl elsewhere. Never pass
glyphs in."* The array type is what makes passing `"⌘K"` awkward — the API discourages the misuse
rather than documenting against it.

### 3.7 B7 `app-topbar`

```tsx
interface AppTopbarProps extends React.ComponentProps<"header"> {
  context?: "document" | "editor";  // default "document"
  breadcrumb?: React.ReactNode;
  title?: React.ReactNode;
  privacy?: React.ReactNode;        // the privacy chip
  savedState?: React.ReactNode;     // TEXT: "Last saved 5 days ago"
  leading?: React.ReactNode;        // editor context: zoom + history
  actions?: React.ReactNode;        // trailing button-group
}
```

*"One component, two configurations. Document context leads with breadcrumb + privacy; editor context
leads with zoom + history."* `context` reorders the leading region; it does not fork the markup, and
`actions` stays trailing in both.

*"Saved-state is text, not an icon. 'Last saved 5 days ago' answers a question a cloud glyph only
raises."* The prop is `React.ReactNode` for formatting freedom, but the component never substitutes an
icon of its own, and the test asserts the text reaches the accessible output.

*"Absorbs the spec's `chat-header` — a chat title bar is this with fewer slots filled."* So there is no
chat variant: `title` + `actions` **is** the chat header. Any prop that made that a mode would
re-create the component D8 deleted.

### 3.8 B4 `modality-rail`

```tsx
interface ModalityRailItem {
  id: string;
  icon: React.ReactNode;        // required — the rail is icon-over-label
  label: React.ReactNode;       // required — always rendered, never icon-only
  badge?: React.ReactNode;      // "New" dot, crown / Pro mark
  disabled?: boolean;
}

interface ModalityRailProps extends Omit<React.ComponentProps<"nav">, "onSelect"> {
  items: ModalityRailItem[];
  pinned?: ModalityRailItem[];  // settings · plugins · help
  value?: string;
  onSelect?: (id: string) => void;
  maxVisible?: number;          // default 10; the remainder go behind the overflow chevron
}
```

Both `icon` and `label` are required: *"icon over label"* is the rail's identity, and an icon-only rail
is B1's `icon-rail` width, which is a different component.

*"Bottom-pinned items (settings, plugins, help) are a separate group so the scrollable middle never
swallows them."* Modelled as a **second array**, not a flag on an item — a flag permits interleaving,
and interleaving is the failure the sentence describes.

*"Eight to fourteen items… with an overflow chevron rather than a scrollbar in a 92px column."*
`maxVisible` produces the chevron; there is no scroll mode.

`badge` is *"where products advertise features you have not bought"* — the rail's paywall placement,
alongside B3's tier badges and B5's ambient card.

### 3.9 C1 `hero-omnibox`

```tsx
type HeroOmniboxState = "idle" | "focused" | "generating" | "locked";

interface HeroOmniboxProps extends Omit<React.ComponentProps<"div">, "onSubmit"> {
  heading?: React.ReactNode;        // "What can I help you with?"
  placeholder?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  state?: HeroOmniboxState;         // default "idle"
  mode?: React.ReactNode;           // D4 mode-tabs — a slot, never an import
  attach?: React.ReactNode;
  model?: React.ReactNode;
  credits?: React.ReactNode;        // M2 — a slot, never an import
  lockedAction?: React.ReactNode;   // replaces the textarea in place when locked
  onSubmit?: (value: string) => void;
  footer?: React.ReactNode;         // C2 sits below the card
}
```

*"The whole card is the control."* The card is one `focus-within` region; clicking anywhere in it
focuses the textarea. This is why `heading` is inside the component rather than beside it.

*"`locked` swaps the textarea for a paywall CTA **in place** — the composer is the gate."* In place
means the card's box does not change: same padding, same height, same width across all four states.
This is A8's states-replace-content-never-the-frame discipline applied to a composer, and it is the
assertion the tests exist to protect.

*"Attach, model select and mode chip live inside the field, not above it."* Those three slots render as
DOM descendants of `data-slot="hero-omnibox-field"`. Their position is not a styling choice, so the
test asserts containment rather than appearance.

`focused` is normally derived from `:focus-within`; the prop exists so a story or a screenshot can pin
it. Naming it in the union without saying that would invite consumers to drive focus from state.

`credits` and `mode` are `ReactNode` slots for exactly the reason in §1.6: C1 is L3, M2 and D4 are L3.

### 3.10 C2 `suggestion-chips`

```tsx
interface SuggestionChipsProps extends Omit<React.ComponentProps<"div">, "onSelect"> {
  suggestions: {
    id: string;
    label: string;
    icon?: React.ReactNode;
    thumbnail?: React.ReactNode;
  }[];
  onSelect?: (label: string, id: string) => void;
  maxVisible?: number;
  moreHref?: string;              // overflow resolves to a LINK
  moreLabel?: React.ReactNode;    // default "See all"
}
```

*"Composes rather than reimplements — the cleanest example of the L1 boundary in the catalog."* C2
wraps `Suggestions` + `Suggestion` from `@ai-elements/suggestion` and adds only the icon/thumbnail
slots and the overflow rule. The chip itself is never re-drawn. Declared as a cross-registry
`registryDependency` per the design spec: *"Cross-registry dependencies reference AI Elements item URLs
so the shadcn CLI resolves the full chain."*

*"Chips are prompts, not filters. Clicking fills the composer; it never navigates or submits."* Hence
`onSelect(label, id)` — label first, because the label is the payload the composer receives. There is
no `onSubmit`, deliberately.

*"Overflow resolves to a link, because a half-visible chip reads as a layout bug."* Note this is the
**opposite** of A5 `filter-bar`, which *"collapses to a count (`+3`)"*. The divergence is deliberate:
applied filters must stay countable because they change what you are looking at; starters are
disposable.

### 3.11 C3 `feature-card-row`

```tsx
interface FeatureCard {
  id: string;
  icon?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  trailing?: React.ReactNode;
  disabled?: boolean;
}

interface FeatureCardRowProps extends Omit<React.ComponentProps<"div">, "onSelect"> {
  cards: FeatureCard[];
  onSelect?: (id: string) => void;
  empty?: React.ReactNode;
}
```

Each card renders as `<EntityRow layout="card" />` (§3.1). The prop names deliberately mirror A9's
slots, because *"the same four slots"* is the claim being implemented.

*"'Start from scratch' and 'Popular features' are one component with different content."* There is no
`variant` prop — the difference is the array.

*"Horizontal scroll needs a visible next affordance; trackpad-only scroll hides half the content."*
Implemented with scroll-snap plus explicit prev/next buttons that appear only when the row overflows.
**Recommended without `Carousel`**, avoiding an `embla-carousel-react` dependency for a rule about an
affordance (§1.10, §6).

### 3.12 C4 `recent-grid`

```tsx
interface RecentItem {
  id: string;
  title: React.ReactNode;         // the only required field
  thumbnail?: React.ReactNode;
  editedAgo?: React.ReactNode;    // "Edited 19 hours ago" — formatted by the caller
  duration?: React.ReactNode;     // rendered in A8's badge slot
  actions?: React.ReactNode;      // hover actions
}

interface RecentGridProps extends Omit<React.ComponentProps<"div">, "onSelect"> {
  items: RecentItem[];
  onSelect?: (id: string) => void;
  aspect?: "square" | "video" | "portrait" | "wide";  // passed to A8; default "video"
  emptyTile?: React.ReactNode;    // an in-grid tile, never a page takeover
}
```

**Built on A8** with `labelPlacement="below"` — the placement A8's spec added specifically for C4
(*"`below` — label sits under the frame. C4 `recent-grid`: thumbnail · title · edited-ago"*).

*"All optional except the title; card height fixed regardless."* A8 already guarantees the frame; the
below-frame meta block is C4's own and must **reserve its line even when `editedAgo` is absent**, or a
mixed grid goes ragged. That is C4's version of A9's row-height rule and the load-bearing assertion.

`editedAgo` is caller-formatted. *"'Edited 19 hours ago' beats a timestamp"* is a copy rule, not a
formatting engine — the super-ai tier ships no date library and relative time is a locale concern.

`emptyTile` renders inside the grid when `items` is empty. Deliberately not named `empty`, so the
distinction C4 draws — *"an in-grid tile, not a page takeover"* — is visible at the call site.

### 3.13 C5 `recommendation-card`

```tsx
interface RecommendationStep {
  title: React.ReactNode;
  description?: React.ReactNode;
}

interface RecommendationCardProps extends React.ComponentProps<"div"> {
  title: React.ReactNode;
  summary?: React.ReactNode;      // the one-line feed row
  apps?: React.ReactNode;         // input / app icons
  steps?: RecommendationStep[];   // numbered, rendered as <ol>
  open?: boolean;                 // the detail modal
  onOpenChange?: (open: boolean) => void;
  onTry?: () => void;
  onSave?: () => void;            // save-for-later — the middle option
  onDismiss?: () => void;
}
```

*"Two levels: a one-line row in the feed, and a modal explaining inputs and steps before you commit."*
One component, two levels — the row is always rendered and `open` reveals the Dialog.

*"'How it works' is numbered steps, not prose. A recommendation you cannot audit is an instruction you
should not follow."* `steps` is an array of structured steps rendered as an `<ol>`. **The type is the
enforcement** — there is no prop that accepts a paragraph.

*"Save-for-later matters as much as Try it — dismissal without a middle option trains dismissal."* So
`onSave` and `onTry` render as equal-weight actions, and the docs mark `onSave` as strongly
recommended rather than optional-in-spirit.

### 3.14 O1 `home-shell` — the region contract

```tsx
interface HomeShellProps extends React.ComponentProps<"div"> {
  sidebar?: React.ReactNode;      // B1
  topbar?: React.ReactNode;       // B7
  omnibox: React.ReactNode;       // C1 — required
  starters?: React.ReactNode;     // C2
  features?: React.ReactNode;     // C3
  recents?: React.ReactNode;      // C4
  inspiration?: React.ReactNode;  // C5
}
```

**Seven regions, not five** (§1.7). Starters and inspiration were named in O1's order and filled-by
lists but omitted from its regions line.

Two rules make this a block rather than a `<div>` with props:

1. **`omnibox` is the only required region.** *"The hero omnibox is above the fold and is the only
   emphasised element on the page. Everything else is a path back into existing work."* A home shell
   without a composer is not this archetype.
2. **The main column's order is owned by the block.** *"Order is invariant across all five reference
   products: composer → starters → features → recents → inspiration."* Callers supply content per
   region and **cannot reorder it** — there is no `order` prop and no `children` passthrough for the
   main column. This invariance is the entire finding O1 encodes.

M2 `credits-indicator` and L1 `empty-state` are **not regions**. They reach the page through their
hosts — M2 through C1's `credits` slot or B1's `footer`; L1 through the `empty` / `emptyTile` slots of
B1, B3, C3 and C4. O1's filled-by list names participants, not regions, and Wave 2 ships without
either component existing.

Registry: `type: "registry:block"`, target `components/super-ai/home-shell.tsx`, with
`registryDependencies` on the seven `super-ai` items it composes — requiring the §1.10 pipeline
extension.

## 4. Testing

One co-located test per item. Load-bearing assertions only — each protects a rule stated above.

- **A9 retrofit** — `layout="row"` output is byte-identical to today's (the retrofit is additive);
  `layout="card"` renders the same four slots in vertical order; both layouts keep a fixed height
  within their layout.
- **B1** — every slot is independently omittable and renders nothing when omitted; the three widths
  render one component (same `data-slot`, different `data-state`); `content` scrolls while `promo` and
  `footer` stay pinned below it; **B1 imports no family-B component** (assert by rendering with all
  slots empty and finding no `data-slot="entity-row"` / `"section-header"` in the tree).
- **B3** — section labels render a `data-slot="section-header"` at `size="sm"`; the active row is
  filled (`bg-accent`) and carries **no left-border class**; a pinned section renders outside the
  scrolling container; `trailing` renders without changing row height.
- **B2** — any `description` present flips every entry to `entity-row`; none present renders a checked
  list; the create row is last and preceded by a separator; omitting `onCreate` renders neither.
- **B5** — `dismissed` renders `null`; the component never hides itself without the prop changing
  (click `onDismiss`, assert still rendered); omitting `onDismiss` renders no dismiss control; all four
  flavours keep the same slot structure.
- **B8** — identity is first and sign-out last regardless of `items` order; appearance opens a submenu
  and **not a dialog** (assert no `role="dialog"`); an item with `shortcut: ["mod","K"]` renders a
  `kbd`, and the component never receives a pre-rendered glyph.
- **B7** — `savedState` text appears in the header's text content; switching `context` reorders the
  leading region while `actions` stays trailing; `title` + `actions` alone produce a valid chat header
  with no empty breadcrumb region.
- **B4** — `icon` and `label` both render for every item (no icon-only mode); pinned items render in a
  separate group after the overflow boundary; exceeding `maxVisible` produces the chevron and **no
  scroll container**; `badge` renders without changing item height.
- **C1** — **card geometry is identical across `idle` / `focused` / `generating` / `locked`** (the
  defining contract, mirroring A8's frame test); `locked` replaces the textarea with `lockedAction` in
  place; `attach`, `model` and `mode` are DOM descendants of the field slot, not siblings; clicking the
  card focuses the textarea; `onSubmit` receives the current value.
- **C2** — chips come from `@ai-elements/suggestion` (assert the composed markup, not a re-drawn
  button); `onSelect` fires with the label and never submits or navigates; overflow past `maxVisible`
  renders an anchor, **not a count chip** — the explicit divergence from A5.
- **C3** — every card renders `entity-row` with `layout="card"`; the next affordance appears when the
  row overflows and is absent when it does not; `empty` renders when `cards` is empty.
- **C4** — **card height is identical with and without `editedAgo` and `duration`**; tiles carry
  `labelPlacement="below"`; `emptyTile` renders inside the grid and the grid container is still
  present (no page takeover); `duration` reaches A8's badge slot.
- **C5** — `steps` renders an `<ol>` with one `<li>` per step; the collapsed row renders without
  `open`; `open` reveals the dialog; `onTry` and `onSave` both render controls when supplied.
- **O1** — the main column's DOM order is composer → starters → features → recents → inspiration
  **regardless of prop order**; omitting `sidebar` / `topbar` still renders a valid page; omitted
  optional regions render nothing (no empty wrappers holding layout space).

## 5. Doc corrections

`concept-model.md`

- §2 — **add the missing A1 row** (L5 `shortcuts-sheet` · B8 `account-menu`), and note that A4 and A5
  still have no rows, with their consumers unproven.
- §2 — remove **C3** from the A12 row; C3 declares A9 and never A12 (§1.1).
- §1 (L0) — the shadcn list omits `dropdown-menu` (used by shipped `thread-list`), `avatar`, `badge`,
  `breadcrumb`, `button-group`, `toggle-group`, `tooltip`, `radio-group`, `textarea`, `aspect-ratio`
  and `separator`, all of which families B and C declare as bases. Either complete it or mark it
  illustrative.
- §4 — Cost contract: record that family B's binding is placement-level (B5, B3 tier badges) with no
  A2 consumer, and **add C**, which hosts a credits placement via C1.
- §4 — Empty contract: record the Wave-2 slot convention (`empty` / `emptyTile` props now, L1 fills
  them in Wave 9) so the contract is not retrofitted twice.

`component-specs.md`

- A9 — record the `layout` prop and that C3 is the consumer that forced it.
- A1 — add a consumers line: L5 and B8.
- A3 — note that the shipped component lacks the count, collapse and sticky behaviour its entry
  requires; retrofit scheduled for Wave 4 with F2.
- B3 — record that its rows are its own, with the 56px-vs-36px reason (§1.4), so A9 is not re-proposed.
- C3 — record the Carousel decision once taken (§6).
- C4 — the catalog table lists a `grid/list` variant the authoritative entry never mentions; either
  add it to the entry or drop it from the table.

`block-specs.md`

- O1 — regions list corrected to seven; M2 and L1 marked as participants reached through host slots
  rather than as regions; and the *"whole page is C4's empty state"* sentence reconciled with C4's
  *"not a page takeover"* (§1.7, item 3).

`decisions.md`

- Record this audit as **D14**: A1/A4/A5 have no fan-out rows (extending D13's A11 finding to three
  more primitives); A12→C3 disproved; the shipped A9 could not render its declared consumer; and the
  **shell slot rule** — L3 shells accept regions as `ReactNode` and never import another L3 component —
  stated once, binding for every shell-shaped component from here on.

## 6. Decisions needed before build

1. **O1's empty day-one page** (§1.7, item 3). If it means a page-level takeover, L1 `empty-state`
   becomes a Wave-2 blocker. The reading proposed here — full shell, C4's in-grid empty tile — does
   not. Needs Nick's call.
2. **C3 and Carousel** (§1.10). Recommendation: build without it, keeping the super-ai tier on
   `lucide-react` alone. Requires a one-line catalog correction if accepted.

## 7. Non-goals

- **Building M2 `credits-indicator` or L1 `empty-state` to complete O1.** They are Waves 10 and 9. O1
  ships with slots that they fill later without an API change.
- **Retrofitting A3 `date-section`** with count, collapse and sticky. Real (§1.9), but its first
  unserved consumer is F2 in Wave 4. Reported, not fixed here.
- **Re-opening D13's exclusion of C5 from A9's fan-out** (§1.5).
- **Persisting B5's dismissal.** The component is controlled by design; storage is the consumer's.
- **A relative-time formatter for C4.** `editedAgo` is caller-formatted.
- **The other twelve blocks.** O1 only. Each remaining block waits on its own families.
- **A block to prove B4 `modality-rail`.** Its shells are O3 and O4, in Wave 6. B4 ships in Wave 2
  with stories and tests but no block — named as a risk in §2, not hidden.
