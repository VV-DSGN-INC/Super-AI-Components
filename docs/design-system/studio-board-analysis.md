# Studio board analysis — layout, IA and navigation across six creative-studio products

**Scope:** one pattern axis — the frame, its panels, the information architecture and the navigation
between home, project list, editor and settings — read across six products in three app types.
**Read:** started 2026-09-07. **Status:** 0 of 6 products read.
**Spec:** [`2026-09-07-studio-layout-ia-slice-design.md`](../superpowers/specs/2026-09-07-studio-layout-ia-slice-design.md).
**Decision:** D22 in [decisions.md](decisions.md), written when the read is complete.

Named after [agent-board-analysis.md](agent-board-analysis.md) and
[records-board-analysis.md](records-board-analysis.md) even though there is no board: the slices
share a name so they are found together.

---

## 1. Method — and how it differs from the primary board and the two slices

| | Primary board | Agent slice (D14) | Records slice (D18) | This slice |
| --- | --- | --- | --- | --- |
| Source | curated Figma board of screenshots | documentation and published analyses | public documentation | the signed-in products themselves |
| Unit of evidence | an observed screen | a documented behaviour | a documented behaviour | a captured screen plus a DOM measurement |
| Rigour | direct visual anatomy | named pattern plus a citation, ⚠ where docs-only | ⚠ throughout | capture id on every claim, selector on every width, no ⚠ |
| Population | creative tools, by app type | agents, by category | records products, by category | creative studios, by **pattern axis** across three app types |

### 1.1 What was read, and how

Six products were walked in Chrome, signed in, read-only (nothing created, generated, changed,
exported, shared or sent; panels that were moved were restored). Every capture is the 1440 × 900 CSS
px viewport at device pixel ratio 2, saved outside the repo at
`~/ClaudeCode Projects/Super-AI-Components-research/studio-slice/<product>/` and cited below by id.
Widths are `getBoundingClientRect()` readings with the selector recorded, so any of them can be
re-measured.

| Product | Type | Role | Session | Read on |
| --- | --- | --- | --- | --- |
| Descript | video | pilot; on the primary board | no session at the 2026-09-07 check (sign-in wall at `web.descript.com/authenticate`) | |
| ElevenLabs Studio | voice | named by Nick | signed in | |
| Suno | music | sibling of ElevenLabs | no session at the 2026-09-07 check (public landing page) | |
| Runway | video | sibling of Descript | no session at the 2026-09-07 check (app loads as guest, editor and projects gated) | |
| Spline | 3D | named by Nick; on the primary board | no session at the 2026-09-07 check (sign-in wall at `app.spline.design/signin`) | |
| Meshy | 3D | sibling of Spline | no session at the 2026-09-07 check (redirects to `meshy.ai/discover`) | |

Descript was walked first and its walk wrote the sheet (§1.3). The other five were walked under the
same sheet. A field a later product forced onto the sheet is marked `(forced by …)` in §1.3 and was
back-filled for every product already read; revisits are listed in §1.4.

### 1.2 The walk

Four stops per product, in order, with the on-arrival frame captured at each so the transition is
visible: **home** (the landing after sign-in) → **projects** (all projects, drive, library or
recents) → **editor** (an existing project opened, never a new one) → **settings** (account,
workspace, plan), then **back** (the way from the editor to home). At the editor stop every panel was
captured default, collapsed, and where offered resized (dragged about 120 px and back) and undocked.

### 1.3 The sheet

Written once per stop per product (§2). Rows are fixed so the six reads compare cell for cell.

| Row | Meaning |
| --- | --- |
| Frame · archetype | the chrome layout, named against the primary board's S1–S14 and the MDS taxonomy's nine (console, cockpit, framed page, framed split, rail + drawer, portal, focus column, master–detail, canvas-centric), or a new name |
| Frame · regions | the regions present, in `data-region` style names |
| Frame · fixed / flexible | which regions have a fixed size and which flex |
| Frame · widths | every sidebar, rail and panel width in CSS px, each with its selector |
| Panels · resizable | drag handle present; min and max reached by dragging |
| Panels · collapsible | to what: icon rail, edge tab, gone |
| Panels · dock / float | dockable, undockable, floatable |
| Panels · tabbed | tabs inside one panel |
| Panels · remembered | whether a collapsed or resized state survives leaving and returning |
| IA · sections | the top-level sections as the nav shows them, in order |
| IA · depth to editor | clicks from home to an open editor |
| IA · surface kind | for each surface met at the stop: page, panel or dialog |
| Nav · global | where global nav lives: left sidebar, top bar, rail, none |
| Nav · local | tabs, segmented controls |
| Nav · contextual | breadcrumb, back button, project switcher in the topbar |
| Nav · palette | command palette and its shortcut |
| Nav · home ↔ editor | what the frame changes between home and editor |
| AI · placement | where each AI feature sits: docked panel, inline, palette entry, floating button, its own stop |
| Captures | the ids behind the column |

Cell conventions: `n/a` when the row cannot apply at that stop; `none` when it applies and the product
has nothing; otherwise the observation with capture ids in parentheses.

### 1.4 Deviations

Swaps, blocked stops and revisits, one line each.

- 2026-09-07 session check: five of six products had no session in the walk's Chrome profile
  (see §1.1). Reported to Nick before any walk; the walks resume per product as sessions appear.

---

## 2. Products and captures

### 2.1 Descript

Not read yet.

### 2.2 ElevenLabs Studio

Not read yet.

### 2.3 Suno

Not read yet.

### 2.4 Runway

Not read yet.

### 2.5 Spline

Not read yet.

### 2.6 Meshy

Not read yet.

---

## 3. Frame archetypes found

Written in synthesis.

## 4. IA and navigation patterns

Written in synthesis.

## 5. Panel mechanics

Written in synthesis.

## 6. AI placement

Written in synthesis.

## 7. The D1 re-run

Written in synthesis.

## 8. Candidates

Written in synthesis.

## 9. Seen, not counted

Written in synthesis.

## 10. What this slice does not cover

Written in synthesis.
