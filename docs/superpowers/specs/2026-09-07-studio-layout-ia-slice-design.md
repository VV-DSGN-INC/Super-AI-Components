# Studio layout and IA slice — design

**Written 2026-09-07, on branch `claude/layout-navigation-patterns-f02e70`.** A
research slice, not a build. It reads six creative-studio products for their
layout, information architecture and navigation patterns, and it ends with
candidates for the catalog, not items in it.

---

## 1. Why this exists

The repo already has a layout layer: family B (eight navigation components) and
family O (thirteen shells, each a fixed arrangement derived from the primary
board's fourteen archetypes,
[reference-board-analysis.md §4](../../design-system/reference-board-analysis.md#4-layout-archetypes-extracted)).
Three things sit outside it:

1. **Nothing describes how the shells connect.** A shell is one arrangement.
   The path a user takes from home to a project to the editor and back, and
   what the frame does along that path (does the sidebar collapse to a rail
   inside the editor, does the topbar change owner), is written nowhere.
2. **Panel mechanics have no primitive.** The shells hard-code their grids. A
   panel that resizes, collapses, docks or carries tabs has no registry item.
   The vendored `resizable.tsx` is used by one component, `compare-viewer`.
3. **The docs site has nowhere to put a pattern.** It is a flat list of
   components.

Every registry item here earned its spec through a sampled population and the
D1 inclusion test: three or more unrelated products. The catalog's own status
note says the sampling is not finished. So before anything is built for these
three holes, the population is read, the way D14 read agents and D18 read
records, and the evidence decides which hole gets a component, which a shell,
and which a docs page.

## 2. Scope

**In:** six products, four stops each, five axes and an evidence block per stop (§5), a synthesis
with product counts and a D1 re-run, and candidates classified as component,
shell or docs pattern.

**Out:** no catalog items, no manifest rows, no registry code, no component or
block specs, no docs-site pages, no FigJam board, no mobile layouts (every
product here is a desktop web app; a mobile web layout is recorded only if a
product serves one at the capture viewport), no pricing or paywall reads
(family M covers those), and no full component anatomy of any product.
Anything seen outside the five axes is logged in the analysis doc under "seen,
not counted" for a later slice and does not enter the D1 re-run.

This slice does **not** close Move 3
([gaps.md §5](../../design-system/gaps.md)) for voice, vision or any other
category. It reads one pattern axis across categories; it does not read a
category's components.

## 3. Products

| # | Product | Type | Role |
| --- | --- | --- | --- |
| 1 | Descript | video | pilot; on the primary board |
| 2 | ElevenLabs Studio | voice | named by Nick |
| 3 | Suno | music | sibling of ElevenLabs |
| 4 | Runway | video | sibling of Descript |
| 5 | Spline | 3D | named by Nick; on the primary board |
| 6 | Meshy | 3D | sibling of Spline |

Six unrelated companies, so any three of them satisfy D1's "unrelated"
clause. Alternates, in order, if a product cannot be read (§5.6): Udio for
Suno, CapCut for Runway, Tripo for Meshy.

Descript and Spline were on the primary board for specific screens only
(Descript: S1 home and S4 timeline editor; Spline: S1 home and S10 project
list). Those reads recorded neither IA nor navigation, so both are re-read
here in full.

## 4. Method, in one line

Descript is walked first and its walk writes the sheet. The other five are
walked under the same sheet. An axis that a later product forces onto the
sheet is back-filled for the products already read. Then the sheet is
synthesised.

## 5. Reading

### 5.1 Instrument and rules

Chrome, driven through the Claude in Chrome extension against Nick's existing
sessions. The read is **read-only**:

| Allowed | Not allowed |
| --- | --- |
| navigating; opening existing projects; opening menus and dialogs without confirming them; resizing, collapsing, docking and undocking panels, restored afterwards; read-only JavaScript to measure the DOM; screenshots | creating, renaming, deleting or duplicating projects; generating anything (it spends credits); changing any setting; exporting, sharing, sending, inviting; purchasing; accepting terms or consent banners (decline non-essential); creating accounts |

If a stop can only be reached through a non-allowed action (an editor that
needs a project, a workspace with none), the read stops there and reports.
Nick decides.

The viewport is fixed at **1440 × 900 CSS px** for every capture, set with the
extension's resize, so widths compare across products. Device pixel ratio is
recorded once per product.

### 5.2 Captures

Captures live **outside the repo**, at
`~/ClaudeCode Projects/Super-AI-Components-research/studio-slice/<product>/`,
because the registry is public and tracks no product screenshots. Names follow
`<product>-<stop>-<nn>.png`, for example `descript-editor-03.png`. The
analysis doc carries an index of every capture (§6.4), so the folder is
findable from the repo without being in it.

### 5.3 The walk

Four stops per product, in this order, with the transitions between them
captured as well.

| Stop | Reached how | Captured |
| --- | --- | --- |
| home | the landing after sign-in | the frame; every top-level nav entry; the hero or primary call to action |
| project list | the all-projects, drive or recents view | the frame; list vs grid; sort and filter; how a project opens |
| editor | open an existing project | the frame; every panel in its default state, collapsed, and where offered resized or undocked; the bottom dock; the AI surfaces; the way back to home |
| settings | account, workspace, plan | the frame; whether it is a page, a panel or a dialog; how it is reached |

Transitions: one capture immediately after each stop-to-stop move, so what the
frame kept and what it replaced is visible side by side.

### 5.4 The sheet

Written once per stop per product. The axes and fields are fixed here so the
six reads are comparable. Version 1 of the sheet is what Descript's walk
produces; the fields below are its floor, not its ceiling.

| Axis | Fields |
| --- | --- |
| Frame | chrome archetype, named against the primary board's S1 to S14 and the MDS taxonomy's nine, or new; regions present, in `data-region` style names; each region fixed or flexible; the width of every sidebar, rail and panel in CSS px from `getBoundingClientRect()`, with the selector recorded |
| Panels | per panel: resizable (drag handle, min and max); collapsible (to what: rail, edge tab, gone); dockable, undockable or floatable; tabbed (tabs inside one panel); state remembered after leaving and returning |
| IA | top-level sections, the sitemap as the nav shows it; depth in clicks from home to the editor; for each surface met: page, panel or dialog |
| Navigation | where global nav lives (left sidebar, top bar, rail, none); local nav (tabs, segmented controls); contextual nav (breadcrumb, back button, project switcher in the topbar); command palette and its shortcut; what the frame changes between home and editor |
| AI placement | where each AI feature sits in the layout: docked panel, inline in the content, palette entry, floating button, its own stop |
| Evidence | capture ids; viewport; DPR; every selector used for a measurement |

The MDS taxonomy
(`Minimal Design System/research/style-teardowns/2026-08-11-app-shell-taxonomy.md`)
is a naming aid, not an authority. A product that fits none of its nine
archetypes gets a new name in this doc, and the taxonomy is cited, never
edited.

### 5.5 The ratchet

If a product shows something the sheet has no field for, and it is inside the
five axes, the field is added and **every product already read is revisited
for that field** before the next product starts. An added field is marked with
the product that forced it, so the doc records that the sheet grew.

### 5.6 Blocked reads

A product with no working session is reported, not worked around. The
alternate from §3 replaces it, and the doc's method section names the swap. A
product that is reachable but has an empty workspace stops at the project
list; its editor row is marked "not reached" and counts for nothing.

## 6. Synthesis

### 6.1 Naming and counting a pattern

A pattern is one named, checkable behaviour on one axis: "the global sidebar
collapses to an icon rail on entering the editor", "the inspector is a right
panel with tabs", "settings open as a dialog over the current stop". Each
pattern row lists the products it was observed in, by capture id. Its count is
the number of products. **D1 passes at three or more.** A pattern at two is
kept in the doc as "stalled at two", with the note that the wider
twelve-product grid Nick chose these six from could settle it. A pattern at one is listed as single: a demo, not a candidate, as D1 says.

### 6.2 Against what exists

Every pattern is checked against three things and the result is written on
the row:

- the primary board's fourteen archetypes: same, variant, or new;
- family B and family O items: covered, covered with a gap (name the missing
  prop or region), or not covered;
- the MDS shell taxonomy: which archetype, if any, as a cross-reference only.

### 6.3 Candidate classes

A passing pattern becomes one of three candidates, by this test.

| Class | Test |
| --- | --- |
| component | one piece of UI with its own state and accessibility contract that at least one shell would compose: a resizable panel group, a project switcher, a panel tab strip |
| shell | an arrangement, not a piece: a distinct set of regions in distinct positions that no existing O item has, or an O item's variant, the way O4 is O3's |
| docs pattern | a relationship across stops, not a thing on one screen: the home to project to editor path and what the frame keeps along it. It can be documented, not installed |

A candidate is not a commitment. Turning candidates into catalog rows is the
next brainstorm's job.

### 6.4 The analysis doc

`docs/design-system/studio-board-analysis.md`, named after the two existing
slice docs even though there is no board. Sections, in order:

1. Method, and how it differs from the primary board and the two slices:
   screens and DOM measurements, read-only, fixed viewport, the ratchet.
2. Products and captures: one table per product listing every capture by id
   and stop, the read date, and the DPR.
3. Frame archetypes found, against S1 to S14 and the MDS nine.
4. IA and navigation patterns, with counts.
5. Panel mechanics, with counts and measured widths.
6. AI placement, with counts.
7. The D1 re-run: every pattern, its count, and pass, stalled or single.
8. Candidates by class (§6.3), each pointing at the rows that justify it.
9. Seen, not counted: anything outside the five axes, for a later slice.
10. What this slice does not cover, and what remains unsampled.

## 7. Outputs

| Touched | Change |
| --- | --- |
| `docs/design-system/studio-board-analysis.md` | new |
| `docs/design-system/decisions.md` | D22: the slice, its method, what it changes, what it leaves open |
| `docs/design-system/catalog.md` | the re-sampling status paragraph gains one sentence pointing at the slice; no rows change |
| `docs/design-system/gaps.md` | the Move 3 note gains one sentence: this slice read a pattern axis and closes no category |
| `docs/CONTINUE.md` §1 | one line on where the slice stands |
| `~/ClaudeCode Projects/Super-AI-Components-research/studio-slice/` | captures, outside the repo |

Not touched: `catalog.manifest.ts`, anything under `registry/`,
`component-specs.md`, `block-specs.md`, any story, the docs site.

## 8. Verification

The doc is checkable by a reader who has the captures folder:

- every pattern row cites capture ids, and every id resolves to a file;
- every width cites its selector, so it can be re-measured;
- every count can be recomputed from the per-product tables in §2 of the doc;
- no row rests on documentation, so no ⚠ rows are expected; any that appear
  are listed in the method section with the reason;
- the D1 threshold and the "unrelated" clause are applied as D1 states them.

## 9. Risks

| Risk | Handling |
| --- | --- |
| a product has no session, or a login wall appears mid-walk | §5.6: swap to the alternate and record the swap |
| the editor needs a project and there is none | stop at the project list, mark "not reached", ask |
| a panel's state is user-persisted and the walk changes it | restore every panel before leaving the editor; note any that could not be restored |
| product UIs change under later readers | the doc states the read date per product, next to the captures |
| the walk takes longer than one session | the ratchet keeps partial reads valid; CONTINUE.md §1 records which products are done |
| consent or cookie banners | decline non-essential; never accept terms |

## 10. Sequencing

Pilot (Descript), then sheet v1, then five walks under it with back-fill, then
synthesis and the D1 re-run, then the analysis doc, then D22 and the catalog,
gaps and CONTINUE notes, then the PR. The implementation plan breaks this into
tasks.

## 11. Deferred

- A FigJam board of the captures, arranged product by stop, for visual review.
  A separate step, on request, after the read.
- Widening to the twelve-product grid where a pattern stalls at two.
