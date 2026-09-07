# Studio layout and IA slice — implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Read six creative-studio products (Descript, ElevenLabs Studio, Suno, Runway, Spline, Meshy) for their layout, information architecture and navigation patterns, and land `docs/design-system/studio-board-analysis.md` with every pattern counted, the D1 inclusion test re-run, and candidates classified as component, shell or docs pattern.

**Architecture:** Read-only walks through Nick's signed-in Chrome via the Claude in Chrome extension. Captures are saved by a macOS `screencapture` script aimed at the extension's own window, outside the repo. Widths come from page JavaScript. The analysis doc grows one product section per task, so a partial read is always committed. Two synthesis tasks follow the six walks, then the decision record and the PR.

**Tech Stack:** Claude in Chrome MCP tools (`tabs_context_mcp`, `navigate`, `browser_batch`, `computer`, `javascript_tool`, `resize_window`, `find`, `read_page`), macOS `osascript` + `screencapture` + `sips`, Markdown, prettier (repo config, `printWidth` 110), git, `gh`.

**Spec:** `docs/superpowers/specs/2026-09-07-studio-layout-ia-slice-design.md` — the plan argues from it; read both.

## Global Constraints

Copied from the spec. Every task's requirements include this section.

- **Read-only.** Allowed: navigating; opening existing projects; opening menus and dialogs without confirming them; resizing, collapsing, docking and undocking panels, restored afterwards; read-only JavaScript to measure the DOM; screenshots. Not allowed: creating, renaming, deleting or duplicating projects; generating anything (it spends credits); changing any setting; exporting, sharing, sending, inviting; purchasing; accepting terms or consent banners (decline non-essential); creating accounts.
- **Blocked stop.** If a stop can only be reached through a non-allowed action, stop there, mark the stop "not reached" in the doc, and report. Nick decides.
- **Viewport 1440 × 900 CSS px** for every capture. On this Mac the extension's `resize_window` sets the outer window, and Chrome's top chrome is 143 px, so the window is resized to **1440 × 1043** and `innerWidth × innerHeight` is checked to be `1440 × 900` before any capture. DPR is recorded once per product (it is 2 on this Mac).
- **Captures live outside the repo** at `~/ClaudeCode Projects/Super-AI-Components-research/studio-slice/<product>/`, named `<product>-<stop>-<nn>.png`. Products: `descript`, `elevenlabs`, `suno`, `runway`, `spline`, `meshy`. Stops: `home`, `projects`, `editor`, `settings`, `back`. `nn` starts at `01` per product per stop; `01` is always the on-arrival frame (the transition capture), later numbers are states at that stop.
- **D1:** a pattern passes at **three or more unrelated products**. Two is "stalled", one is "single". The six are six unrelated companies.
- **Alternates**, in order, if a product has no working session: Udio for Suno, CapCut for Runway, Tripo for Meshy. A swap is recorded in the doc's method section.
- **Repo files touched:** `docs/design-system/studio-board-analysis.md` (new), `docs/design-system/decisions.md` (D22), `docs/design-system/catalog.md` (one sentence in the re-sampling note), `docs/design-system/gaps.md` (one paragraph under the Move 3 note), `docs/CONTINUE.md` §1 (one paragraph), plus this plan's checkboxes. Nothing under `apps/`, `packages/`, `registry/`, and no change to `catalog.manifest.ts`, `component-specs.md`, `block-specs.md` or any story.
- **Branch:** `claude/layout-navigation-patterns-f02e70` on `VV-DSGN-INC/Super-AI-Components`. Never commit to `main`. Commit messages end with `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.
- **Chrome is one instrument.** Walk tasks (3 to 8) run one at a time, never concurrently, because they share one browser.

---

## Walk protocol

Tasks 3 to 8 each run this protocol. It is written once here so the six reads are identical; each task supplies the product-specific parts (URLs, stop mapping, section number). `RESEARCH` below means `~/ClaudeCode Projects/Super-AI-Components-research/studio-slice`.

### P0 · Tab

Call `tabs_context_mcp` with `createIfEmpty: true`. Note the `tabId`; every browser call below takes it. If several tabs exist, use the first and close the rest with `tabs_close_mcp`.

### P1 · Sign-in check

`navigate` to the product's home URL, then `computer` `screenshot` at `scale: 0.3`. If the page is a sign-in wall, the product is blocked: record it in the doc's §1 method table as "no session" and stop the task (the alternate from Global Constraints replaces it, in a new run of the same task). Never enter credentials.

### P2 · Viewport

Run in one `browser_batch`:

1. `resize_window` `{ width: 1440, height: 1043, tabId }`
2. `javascript_tool` `{ action: "javascript_exec", tabId, text: "({inner:[innerWidth,innerHeight],dpr:devicePixelRatio,ua:navigator.userAgent.slice(0,80)})" }`

Expected `inner` is `[1440, 900]`. If `innerHeight` is not 900, resize again with `height: 1043 + (900 - innerHeight)` and re-check. Record `dpr` for the product header.

### P3 · Capture

From Bash:

```bash
~/ClaudeCode\ Projects/Super-AI-Components-research/studio-slice/capture.sh <url-substring> <product>-<stop>-<nn>
```

`<url-substring>` is the product's domain as it appears in the tab URL (`descript.com`, `elevenlabs.io`, `suno.com`, `runwayml.com`, `spline.design`, `meshy.ai`). The script prints the saved path and `2880x1800`; any other size means the viewport moved, so redo P2 and recapture. The script is created in Task 1.

### P4 · Region discovery

`javascript_tool` with this text. It lists every element anchored to a viewport edge that is tall enough to be a sidebar, rail or inspector, or wide enough to be a top bar or bottom dock, in document order (outermost first). Read it to choose the region elements, then measure them in P5.

```js
(() => {
  const vw = innerWidth, vh = innerHeight, out = [];
  for (const el of document.querySelectorAll("body *")) {
    const r = el.getBoundingClientRect();
    if (r.width < 24 || r.height < 24) continue;
    const tall = r.height >= vh * 0.6 && r.width <= vw * 0.5;
    const wide = r.width >= vw * 0.6 && r.height <= vh * 0.45;
    const L = Math.abs(r.left) <= 2, R = Math.abs(r.right - vw) <= 2;
    const T = Math.abs(r.top) <= 2, B = Math.abs(r.bottom - vh) <= 2;
    const side = tall && (L || R), bar = wide && (T || B);
    if (!side && !bar) continue;
    out.push({
      tag: el.tagName.toLowerCase(), id: el.id || "", role: el.getAttribute("role") || "",
      testid: el.getAttribute("data-testid") || "", cls: String(el.className).slice(0, 60),
      edge: side ? (L ? "left" : "right") : (T ? "top" : "bottom"),
      x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height),
    });
  }
  return out.slice(0, 40);
})()
```

### P5 · Measurement

`javascript_tool` with the selectors chosen from P4 substituted into the array. Prefer `#id`, then `[data-testid=…]`, then `[role=…]`, then a structural selector such as `body > div:nth-child(2) > aside`. Hashed class names are not stable; if one is all there is, record the structural selector instead. Every width written in the doc cites the selector it came from.

```js
((sels) => sels.map((s) => {
  const el = document.querySelector(s);
  if (!el) return { selector: s, missing: true };
  const r = el.getBoundingClientRect();
  return { selector: s, x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) };
}))(["aside", "nav", "main"])
```

### P6 · The four stops, in order

At every stop: capture `01` immediately on arrival (P3), run P4, run P5 on the regions, then capture each further state as `02`, `03`, …, and write a one-line "Shows" entry for each capture id as you go.

| Stop | Reach it by | Capture, beyond `01` | Record |
| --- | --- | --- | --- |
| `home` | the product's home URL | the global nav fully visible (open it if it is collapsed, then restore) | every top-level nav entry, in order; the hero or primary call to action |
| `projects` | the product's all-projects, drive, library or recents view | list vs grid if both exist | sort and filter controls; how a project opens (click, double-click, menu) |
| `editor` | open an existing project, never a new one | each panel default; each panel collapsed; each resizable panel dragged by about 120 px along its handle (`computer` `left_click_drag`) then dragged back; each undockable or floatable panel undocked then re-docked; each AI surface opened | see P7 |
| `settings` | the account, workspace or plan entry | the first settings surface | page, panel or dialog; the control that reached it |
| `back` | from the editor, the control that returns to home | `01` only, the first frame at home | the control used; what the frame kept and what it replaced |

If a product's own names differ (Runway calls projects "sessions", Suno calls them a "library"), record the mapping in the product header and keep the stop names.

### P7 · Editor panels

For every panel found in P4 at the editor stop, record: resizable (handle present; min and max reached by dragging until it stops, measured with P5); collapsible (to what: icon rail, edge tab, gone entirely); dockable, undockable or floatable; tabbed (tabs inside the panel); remembered (collapse one panel, `navigate` to home, come back through `projects` into the same project, capture, and note whether the collapse survived; then restore it). Restore every panel to its default before leaving the stop. If a state cannot be restored, reload the page and note it in the sheet.

### P8 · Write the product section

In `docs/design-system/studio-board-analysis.md`, replace the product's "Not read yet." stub in §2 with the block below, filled in. Cell conventions: `n/a` when the field cannot apply at that stop; `none` when it applies and the product has nothing; otherwise the observation followed by the capture ids in parentheses. Widths are `name width px \`selector\`` pairs.

```markdown
### 2.N <Product>

**Read** <YYYY-MM-DD> · **DPR** 2 · **viewport** 1440 × 900 · **stops** home `<url>` · projects `<url or how reached>` · editor `<how reached>` · settings `<how reached>`.
**Product's own names:** projects = "<name>", editor = "<name>", settings = "<name>".

| Id | Stop | Shows |
| --- | --- | --- |
| <product>-home-01 | home | on arrival after sign-in |
| … | … | … |

| Field | Home | Projects | Editor | Settings |
| --- | --- | --- | --- | --- |
| Frame · archetype | | | | |
| Frame · regions | | | | |
| Frame · fixed / flexible | | | | |
| Frame · widths | | | | |
| Panels · resizable | | | | |
| Panels · collapsible | | | | |
| Panels · dock / float | | | | |
| Panels · tabbed | | | | |
| Panels · remembered | | | | |
| IA · sections | | | | |
| IA · depth to editor | | | | |
| IA · surface kind | | | | |
| Nav · global | | | | |
| Nav · local | | | | |
| Nav · contextual | | | | |
| Nav · palette | | | | |
| Nav · home ↔ editor | | | | |
| AI · placement | | | | |
| Captures | | | | |

**The way back:** <control used> (<product>-back-01). Kept: <regions>. Replaced: <regions>.
**Seen, not counted:** <anything outside the five axes, one line each, with capture ids>.
```

Then update the doc's status line: `**Status:** N of 6 products read (<list>).`

### P9 · Ratchet

If the product needed a field the sheet does not have, and the field is inside the five axes: add the row to the sheet definition in §1.3 of the doc with `(forced by <Product>)`, add the same row to every product section already written, fill it from that product's captures, and where the captures cannot answer it, revisit that product in the browser before starting the next task. Record the revisit in §1.

### P10 · Verify and commit

```bash
ROOT=~/ClaudeCode\ Projects/Super-AI-Components-research/studio-slice
grep -o -E '(descript|elevenlabs|suno|runway|spline|meshy)-(home|projects|editor|settings|back)-[0-9]{2}' docs/design-system/studio-board-analysis.md | sort -u | while read -r id; do f="$ROOT/${id%%-*}/$id.png"; [ -f "$f" ] || echo "MISSING $f"; done
awk '/^## 2\./,/^## 3\./' docs/design-system/studio-board-analysis.md | grep -E '^\| Frame · widths' | grep -v '`' && echo "WIDTH ROW WITHOUT SELECTOR" || true
```

(The second check reads §2 only, because §1.3's row definition legitimately has no selector in it.)

Expected: no `MISSING` lines and no `WIDTH ROW WITHOUT SELECTOR`. Then:

```bash
git add docs/design-system/studio-board-analysis.md docs/superpowers/plans/2026-09-07-studio-layout-ia-slice.md
git commit -m "docs(studio-slice): read <Product>

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 1: Session check and the capture script

**Files:**
- Create: `~/ClaudeCode Projects/Super-AI-Components-research/studio-slice/capture.sh` (outside the repo)
- Create: `~/ClaudeCode Projects/Super-AI-Components-research/studio-slice/README.md` (outside the repo)

**Interfaces:**
- Produces: `capture.sh <url-substring> <product>-<stop>-<nn>` → writes `<dir>/<product>/<name>.png` and prints `<path> 2880x1800`. Used by every walk task through P3.
- Produces: the session table (which of the six products are signed in) that Tasks 3 to 8 depend on.

- [x] **Step 1: Create the research folder and the capture script**

```bash
mkdir -p ~/ClaudeCode\ Projects/Super-AI-Components-research/studio-slice
cat > ~/ClaudeCode\ Projects/Super-AI-Components-research/studio-slice/capture.sh <<'EOF'
#!/bin/bash
# capture.sh <url-substring> <name>
# Finds the Chrome window whose active tab URL contains <url-substring>, brings it to front,
# and screencaptures its viewport (window bounds minus Chrome's top chrome, 143 px on this Mac)
# to <script dir>/<product>/<name>.png, where <product> is the part of <name> before the first "-".
set -euo pipefail
SUB="$1"; NAME="$2"; PRODUCT="${NAME%%-*}"
DIR="$(cd "$(dirname "$0")" && pwd)/$PRODUCT"; mkdir -p "$DIR"
CH="${CHROME_TOP:-143}"
osascript -e "tell application \"Google Chrome\" to set index of (first window whose URL of active tab contains \"$SUB\") to 1" \
          -e 'tell application "Google Chrome" to activate' >/dev/null
sleep 0.5
B=$(osascript -e "tell application \"Google Chrome\" to get bounds of (first window whose URL of active tab contains \"$SUB\")")
X=$(echo "$B" | cut -d, -f1 | tr -d ' '); Y=$(echo "$B" | cut -d, -f2 | tr -d ' ')
X2=$(echo "$B" | cut -d, -f3 | tr -d ' '); Y2=$(echo "$B" | cut -d, -f4 | tr -d ' ')
screencapture -x -R "$X,$((Y+CH)),$((X2-X)),$((Y2-Y-CH))" "$DIR/$NAME.png"
W=$(sips -g pixelWidth "$DIR/$NAME.png" | awk '/pixelWidth/{print $2}')
H=$(sips -g pixelHeight "$DIR/$NAME.png" | awk '/pixelHeight/{print $2}')
echo "$DIR/$NAME.png ${W}x${H}"
EOF
chmod +x ~/ClaudeCode\ Projects/Super-AI-Components-research/studio-slice/capture.sh
```

- [x] **Step 2: Write the folder README**

```bash
cat > ~/ClaudeCode\ Projects/Super-AI-Components-research/studio-slice/README.md <<'EOF'
# Studio slice captures

Evidence for `docs/design-system/studio-board-analysis.md` in VV-DSGN-INC/Super-AI-Components
(branch `claude/layout-navigation-patterns-f02e70`). Kept outside the repo because the registry is
public and tracks no product screenshots.

- One folder per product: descript, elevenlabs, suno, runway, spline, meshy.
- Names: `<product>-<stop>-<nn>.png`; stops are home, projects, editor, settings, back; `01` is the
  on-arrival frame at each stop.
- Every capture is the 1440 × 900 CSS px viewport at DPR 2 (2880 × 1800), taken with `capture.sh`.
- The analysis doc's §2 lists every id and what it shows.
EOF
```

- [x] **Step 3: Smoke-test the script on a neutral page**

Call `tabs_context_mcp` with `createIfEmpty: true`, then in one `browser_batch`: `navigate` to `https://example.com`, `resize_window` `{ width: 1440, height: 1043 }`, `javascript_tool` `"({inner:[innerWidth,innerHeight],dpr:devicePixelRatio})"`. Expected `inner: [1440, 900]`. Then:

```bash
~/ClaudeCode\ Projects/Super-AI-Components-research/studio-slice/capture.sh example.com smoke-home-01
```

Expected: a line ending in `2880x1800`. Then delete the smoke folder:

```bash
rm -r ~/ClaudeCode\ Projects/Super-AI-Components-research/studio-slice/smoke
```

- [x] **Step 4: Check all six sessions**

For each URL below, `navigate` to it and take a `computer` `screenshot` at `scale: 0.3`. Do not sign in, do not accept any banner (decline non-essential cookies if a banner blocks the view). Record signed in / sign-in wall / other.

| Product | URL |
| --- | --- |
| Descript | `https://web.descript.com/` |
| ElevenLabs Studio | `https://elevenlabs.io/app/studio` |
| Suno | `https://suno.com/` |
| Runway | `https://app.runwayml.com/` |
| Spline | `https://app.spline.design/home` |
| Meshy | `https://app.meshy.ai/` |

- [x] **Step 5: Report the session table**

Report to Nick as a table: product, URL that resolved, signed in yes/no. For each product with no session, name its alternate from Global Constraints and ask whether to swap or sign in himself. Do not proceed past a product with no session; the walk tasks for signed-in products can start.

- [x] **Step 6: Commit**

Nothing in the repo changed in this task. No commit.

---

### Task 2: The analysis doc skeleton

**Files:**
- Create: `docs/design-system/studio-board-analysis.md`
- Modify: `docs/CONTINUE.md` §1 (insert one paragraph before the line beginning `**\`contractExempt\` has no members.**`)

**Interfaces:**
- Produces: the doc's §1 method (including the sheet definition in §1.3 that P8 fills and P9 grows), the six §2 stubs that Tasks 3 to 8 replace, and the §3 to §10 headings that Tasks 9 and 10 fill.

- [x] **Step 1: Write the skeleton**

```bash
cat > docs/design-system/studio-board-analysis.md <<'EOF'
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
| Descript | video | pilot; on the primary board | | |
| ElevenLabs Studio | voice | named by Nick | | |
| Suno | music | sibling of ElevenLabs | | |
| Runway | video | sibling of Descript | | |
| Spline | 3D | named by Nick; on the primary board | | |
| Meshy | 3D | sibling of Spline | | |

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

Swaps, blocked stops and revisits, one line each. None yet.

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
EOF
```

- [x] **Step 2: Add the CONTINUE.md line**

Use the Edit tool on `docs/CONTINUE.md` with this exact `old_string`:

```
**`contractExempt` has no members.**
```

and this `new_string`:

```
**Studio layout and IA slice in progress (2026-09-07).** Six creative-studio
products are being read for layout, IA and navigation patterns —
[`design-system/studio-board-analysis.md`](design-system/studio-board-analysis.md),
whose status line says which products are read. Spec:
`superpowers/specs/2026-09-07-studio-layout-ia-slice-design.md`. It ends with
candidates, not catalog items.

**`contractExempt` has no members.**
```

- [x] **Step 3: Verify the skeleton parses as the plan expects**

```bash
grep -c "^### 2\.[1-6] " docs/design-system/studio-board-analysis.md
grep -c "Not read yet\." docs/design-system/studio-board-analysis.md
grep -n "Studio layout and IA slice in progress" docs/CONTINUE.md
```

Expected: `6`, `6`, and one matching line in CONTINUE.md.

- [x] **Step 4: Commit**

```bash
git add docs/design-system/studio-board-analysis.md docs/CONTINUE.md
git commit -m "docs(studio-slice): analysis doc skeleton and CONTINUE pointer

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 3: Pilot walk — Descript

**Files:**
- Modify: `docs/design-system/studio-board-analysis.md` §2.1, §1.1 (session and date), §1.3 (any field the pilot adds), status line
- Create: `~/…/studio-slice/descript/descript-*.png`

**Interfaces:**
- Consumes: `capture.sh` from Task 1; the skeleton from Task 2.
- Produces: §2.1 filled; sheet v1 (§1.3 as amended by this walk), which Tasks 4 to 8 read under.

Product specifics: home `https://web.descript.com/`; url-substring `descript.com`; Descript's own names are expected to be "Drive" or "Projects" for the project list, a project editor with a script column, a media or scenes panel, a properties panel and a bottom timeline, and an AI panel (Descript calls its agent "Underlord"). Confirm each in the browser; record the actual names in the product header.

- [ ] **Step 1: P0, P1, P2**

Run P0 (tab), P1 (sign-in check at `https://web.descript.com/`), P2 (viewport). If P1 shows a sign-in wall, write `no session` in §1.1's Session cell for Descript, commit with message `docs(studio-slice): Descript blocked, no session`, and stop; Task 3 re-runs after Nick decides.

- [ ] **Step 2: Home stop**

P3 `capture.sh descript.com descript-home-01` on arrival. P4, then P5 on the region elements. If the global nav is collapsed, expand it, `capture.sh descript.com descript-home-02`, restore it. Write down every top-level nav entry in order and the primary call to action.

- [ ] **Step 3: Projects stop**

Move to the all-projects or drive view by its nav entry. `capture.sh descript.com descript-projects-01` on arrival. P4, P5. If list and grid both exist, capture the other as `descript-projects-02` and switch back. Note sort and filter controls and how a project opens.

- [ ] **Step 4: Editor stop**

Open an existing project (never "New project"). `capture.sh descript.com descript-editor-01` on arrival. P4, P5 on every panel and on the bottom dock. Then P7 for every panel, capturing `descript-editor-02` onward for each state (default of each panel is in `01`; collapsed, resized, undocked, and each AI surface open get their own numbers). Restore everything.

- [ ] **Step 5: Settings stop**

Reach settings through the account or workspace control. `capture.sh descript.com descript-settings-01`. Record page, panel or dialog and the control used. Close it without changing anything.

- [ ] **Step 6: Back**

From the editor, use the control that returns to home. `capture.sh descript.com descript-back-01` at the first frame. Record the control, what the frame kept, what it replaced.

- [ ] **Step 7: P8 — write §2.1**

Fill the block from P8 into §2.1. Fill §1.1's Session (`signed in`) and Read on (`2026-09-07`) cells for Descript. Status line: `**Status:** 1 of 6 products read (Descript).`

- [ ] **Step 8: Sheet v1**

Every row in §1.3 that Descript could not fill with an observation, `none` or `n/a` at some stop is a row the pilot could not define; rewrite its Meaning so it can be filled. Every behaviour Descript showed that no row holds, and that is inside the five axes, becomes a new row marked `(forced by Descript)`. This is sheet v1.

- [ ] **Step 9: P10 — verify and commit**

Run the P10 checks (expect no `MISSING`, no `WIDTH ROW WITHOUT SELECTOR`), then commit with message `docs(studio-slice): read Descript, sheet v1`.

---

### Task 4: Walk — ElevenLabs Studio

**Files:**
- Modify: `docs/design-system/studio-board-analysis.md` §2.2, §1.1, §1.3 (ratchet), status line
- Create: `~/…/studio-slice/elevenlabs/elevenlabs-*.png`

**Interfaces:**
- Consumes: sheet v1 from Task 3.
- Produces: §2.2 filled; any `(forced by ElevenLabs Studio)` rows, back-filled into §2.1.

Product specifics: home `https://elevenlabs.io/app/home`; the studio at `https://elevenlabs.io/app/studio` is one section of the ElevenLabs app; url-substring `elevenlabs.io`. Expected: a left sidebar listing products (Text to Speech, Studio, Voices, and others), Studio's project list at the studio URL, an editor with a script area and a right voice-settings panel, settings at `https://elevenlabs.io/app/settings`. Confirm each in the browser.

- [ ] **Step 1: P0, P1, P2**

Run P0, P1 at `https://elevenlabs.io/app/home`, P2. On a sign-in wall: `no session` in §1.1, commit `docs(studio-slice): ElevenLabs blocked, no session`, stop.

- [ ] **Step 2: Home stop**

`capture.sh elevenlabs.io elevenlabs-home-01`. P4, P5. Expand a collapsed nav for `-02` and restore. Record every top-level entry and the primary call to action.

- [ ] **Step 3: Projects stop**

Open Studio (the project list). `capture.sh elevenlabs.io elevenlabs-projects-01`. P4, P5. List vs grid as `-02` if both exist. Note sort, filter, how a project opens.

- [ ] **Step 4: Editor stop**

Open an existing Studio project. `capture.sh elevenlabs.io elevenlabs-editor-01`. P4, P5 on every panel. P7 per panel with `-02` onward. Open each AI surface (voice settings, generation controls) for its own capture. Restore everything. Do not press any generate or regenerate control.

- [ ] **Step 5: Settings stop**

`capture.sh elevenlabs.io elevenlabs-settings-01`. Record page, panel or dialog and the control used.

- [ ] **Step 6: Back**

From the editor to home. `capture.sh elevenlabs.io elevenlabs-back-01`. Record control, kept, replaced.

- [ ] **Step 7: P8 — write §2.2**

Fill §2.2, §1.1's cells for ElevenLabs Studio. Status line: `2 of 6 products read (Descript, ElevenLabs Studio).`

- [ ] **Step 8: P9 — ratchet**

New rows go into §1.3 as `(forced by ElevenLabs Studio)` and into §2.1, filled from Descript's captures; anything Descript's captures cannot answer is revisited in the browser now and logged in §1.4.

- [ ] **Step 9: P10 — verify and commit**

P10 checks, then commit `docs(studio-slice): read ElevenLabs Studio`.

---

### Task 5: Walk — Suno

**Files:**
- Modify: `docs/design-system/studio-board-analysis.md` §2.3, §1.1, §1.3 (ratchet), status line
- Create: `~/…/studio-slice/suno/suno-*.png`

**Interfaces:**
- Consumes: the sheet as of Task 4.
- Produces: §2.3 filled; any `(forced by Suno)` rows, back-filled into §2.1 and §2.2.

Product specifics: home `https://suno.com/`; url-substring `suno.com`. Expected: a left sidebar (Home, Create, Library, Explore), the Create page as the editor (a prompt panel on the left and a song list on the right, with a bottom player), the library at `https://suno.com/me` as the project list, settings under the account menu. Suno has no project editor in the Descript sense; the editor stop is the Create workspace with an existing song opened, and the doc says so in the product header. Confirm in the browser. Do not press Create or any generate control.

- [ ] **Step 1: P0, P1, P2**

P0, P1 at `https://suno.com/`, P2. On a sign-in wall: `no session` in §1.1, commit `docs(studio-slice): Suno blocked, no session`, stop; the alternate is Udio (`https://www.udio.com/`), run as a new Task 5 with `udio` as the product name in every id.

- [ ] **Step 2: Home stop**

`capture.sh suno.com suno-home-01`. P4, P5. Nav expanded as `-02` if needed. Record entries and the call to action.

- [ ] **Step 3: Projects stop**

Open Library. `capture.sh suno.com suno-projects-01`. P4, P5. List vs grid as `-02`. Note sort, filter, how a song opens.

- [ ] **Step 4: Editor stop**

Open Create with an existing song selected. `capture.sh suno.com suno-editor-01`. P4, P5 on every panel and the player. P7 per panel with `-02` onward. Open each AI surface (custom mode, style, lyrics helpers) without submitting. Restore.

- [ ] **Step 5: Settings stop**

`capture.sh suno.com suno-settings-01`. Record page, panel or dialog and the control.

- [ ] **Step 6: Back**

`capture.sh suno.com suno-back-01`. Record control, kept, replaced.

- [ ] **Step 7: P8 — write §2.3**

Fill §2.3 and §1.1's cells. Status line: `3 of 6 products read (…)`.

- [ ] **Step 8: P9 — ratchet**

`(forced by Suno)` rows into §1.3, §2.1 and §2.2; revisits logged in §1.4.

- [ ] **Step 9: P10 — verify and commit**

P10 checks, commit `docs(studio-slice): read Suno`.

---

### Task 6: Walk — Runway

**Files:**
- Modify: `docs/design-system/studio-board-analysis.md` §2.4, §1.1, §1.3 (ratchet), status line
- Create: `~/…/studio-slice/runway/runway-*.png`

**Interfaces:**
- Consumes: the sheet as of Task 5.
- Produces: §2.4 filled; any `(forced by Runway)` rows, back-filled into §2.1 to §2.3.

Product specifics: home `https://app.runwayml.com/`; url-substring `runwayml.com`. Expected: a left sidebar of tools, a dashboard home, "Assets" or "Sessions" as the project list, a generation session or the video editor as the editor, settings at `https://app.runwayml.com/settings`. Confirm in the browser. Do not press Generate.

- [ ] **Step 1: P0, P1, P2**

P0, P1 at `https://app.runwayml.com/`, P2. On a sign-in wall: `no session` in §1.1, commit `docs(studio-slice): Runway blocked, no session`, stop; the alternate is CapCut (`https://www.capcut.com/`), run as a new Task 6 with `capcut` in every id.

- [ ] **Step 2: Home stop**

`capture.sh runwayml.com runway-home-01`. P4, P5. Nav expanded as `-02` if needed. Record entries and the call to action.

- [ ] **Step 3: Projects stop**

Open the assets or sessions view. `capture.sh runwayml.com runway-projects-01`. P4, P5. List vs grid as `-02`. Note sort, filter, how an item opens.

- [ ] **Step 4: Editor stop**

Open an existing session or project. `capture.sh runwayml.com runway-editor-01`. P4, P5 on every panel and any timeline. P7 per panel with `-02` onward. Open each AI surface without generating. Restore.

- [ ] **Step 5: Settings stop**

`capture.sh runwayml.com runway-settings-01`. Record page, panel or dialog and the control.

- [ ] **Step 6: Back**

`capture.sh runwayml.com runway-back-01`. Record control, kept, replaced.

- [ ] **Step 7: P8 — write §2.4**

Fill §2.4 and §1.1's cells. Status line: `4 of 6 products read (…)`.

- [ ] **Step 8: P9 — ratchet**

`(forced by Runway)` rows into §1.3 and §2.1 to §2.3; revisits in §1.4.

- [ ] **Step 9: P10 — verify and commit**

P10 checks, commit `docs(studio-slice): read Runway`.

---

### Task 7: Walk — Spline

**Files:**
- Modify: `docs/design-system/studio-board-analysis.md` §2.5, §1.1, §1.3 (ratchet), status line
- Create: `~/…/studio-slice/spline/spline-*.png`

**Interfaces:**
- Consumes: the sheet as of Task 6.
- Produces: §2.5 filled; any `(forced by Spline)` rows, back-filled into §2.1 to §2.4.

Product specifics: home `https://app.spline.design/home`; url-substring `spline.design`. Expected: a file browser home with a left sidebar (files, teams, community, library), the file list as the project list, the 3D editor as the editor (left scene hierarchy, top toolbar, right properties panel, a floating bottom toolbar), settings under the account or team menu. The editor is heavy; wait for the viewport to render before P4. Confirm in the browser.

- [ ] **Step 1: P0, P1, P2**

P0, P1 at `https://app.spline.design/home`, P2. On a sign-in wall: `no session` in §1.1, commit `docs(studio-slice): Spline blocked, no session`, stop. Spline has no alternate: it was named by Nick, so report and wait.

- [ ] **Step 2: Home stop**

`capture.sh spline.design spline-home-01`. P4, P5. Nav expanded as `-02` if needed. Record entries and the call to action.

- [ ] **Step 3: Projects stop**

Open the all-files view. `capture.sh spline.design spline-projects-01`. P4, P5. List vs grid as `-02`. Note sort, filter, how a file opens.

- [ ] **Step 4: Editor stop**

Open an existing file. Wait with `computer` `wait` `{ duration: 5 }` for the scene to load. `capture.sh spline.design spline-editor-01`. P4, P5 on every panel. P7 per panel with `-02` onward, including the floating toolbar and any AI surface. Do not run any generate or export control. Restore.

- [ ] **Step 5: Settings stop**

`capture.sh spline.design spline-settings-01`. Record page, panel or dialog and the control.

- [ ] **Step 6: Back**

`capture.sh spline.design spline-back-01`. Record control, kept, replaced.

- [ ] **Step 7: P8 — write §2.5**

Fill §2.5 and §1.1's cells. Status line: `5 of 6 products read (…)`.

- [ ] **Step 8: P9 — ratchet**

`(forced by Spline)` rows into §1.3 and §2.1 to §2.4; revisits in §1.4.

- [ ] **Step 9: P10 — verify and commit**

P10 checks, commit `docs(studio-slice): read Spline`.

---

### Task 8: Walk — Meshy

**Files:**
- Modify: `docs/design-system/studio-board-analysis.md` §2.6, §1.1, §1.3 (ratchet), status line
- Create: `~/…/studio-slice/meshy/meshy-*.png`

**Interfaces:**
- Consumes: the sheet as of Task 7.
- Produces: §2.6 filled; the final sheet; any `(forced by Meshy)` rows, back-filled into §2.1 to §2.5.

Product specifics: home `https://app.meshy.ai/`; url-substring `meshy.ai`. Expected: a left sidebar of tools (text to 3D, image to 3D, and others), a workspace home, "My Assets" as the project list, a model detail or editor view as the editor (viewport centre, settings or texture panel right), settings under the account menu. Confirm in the browser. Do not press Generate.

- [ ] **Step 1: P0, P1, P2**

P0, P1 at `https://app.meshy.ai/`, P2. On a sign-in wall: `no session` in §1.1, commit `docs(studio-slice): Meshy blocked, no session`, stop; the alternate is Tripo (`https://www.tripo3d.ai/app`), run as a new Task 8 with `tripo` in every id.

- [ ] **Step 2: Home stop**

`capture.sh meshy.ai meshy-home-01`. P4, P5. Nav expanded as `-02` if needed. Record entries and the call to action.

- [ ] **Step 3: Projects stop**

Open the assets view. `capture.sh meshy.ai meshy-projects-01`. P4, P5. List vs grid as `-02`. Note sort, filter, how an asset opens.

- [ ] **Step 4: Editor stop**

Open an existing asset. `capture.sh meshy.ai meshy-editor-01`. P4, P5 on every panel. P7 per panel with `-02` onward, including each AI surface without generating. Restore.

- [ ] **Step 5: Settings stop**

`capture.sh meshy.ai meshy-settings-01`. Record page, panel or dialog and the control.

- [ ] **Step 6: Back**

`capture.sh meshy.ai meshy-back-01`. Record control, kept, replaced.

- [ ] **Step 7: P8 — write §2.6**

Fill §2.6 and §1.1's cells. Status line: `6 of 6 products read.`

- [ ] **Step 8: P9 — ratchet**

`(forced by Meshy)` rows into §1.3 and §2.1 to §2.5; revisits in §1.4. After this step the sheet is final.

- [ ] **Step 9: Close the browser tab**

`tabs_close_mcp` on the walk tab.

- [ ] **Step 10: P10 — verify and commit**

P10 checks, commit `docs(studio-slice): read Meshy, sheet final`.

---

### Task 9: Synthesis — §3 to §7

**Files:**
- Modify: `docs/design-system/studio-board-analysis.md` §3, §4, §5, §6, §7

**Interfaces:**
- Consumes: the six filled §2 sections.
- Produces: the numbered pattern table in §7 with fixed columns `| # | Pattern | Axis | Descript | ElevenLabs | Suno | Runway | Spline | Meshy | Count | Verdict |`; §3 to §6 each cite pattern numbers from §7. Task 10 cites `#n` from this table.

- [ ] **Step 1: Build the pattern list**

Read the six sheets row by row. For every row, write one pattern per distinct behaviour observed in at least one product, phrased as one checkable sentence on one axis (for example `the global sidebar collapses to an icon rail on entering the editor`, `the inspector is a right panel with tabs`, `settings open as a dialog over the current stop`). Do not merge two behaviours into one pattern; a pattern that needs "and" is two.

- [ ] **Step 2: Write §7**

Replace `Written in synthesis.` under `## 7. The D1 re-run` with this table, one row per pattern. A product cell holds the capture ids that show the pattern, or `—` when the product does not show it. `Count` is the number of non-`—` cells. `Verdict` is `pass` at 3 or more, `stalled` at 2, `single` at 1.

```markdown
Every pattern found in §2, with the products that show it. A product cell holds the capture ids that
show the pattern, or `—`. Count is the number of products; D1 passes at three or more unrelated
products, and all six here are unrelated companies.

| # | Pattern | Axis | Descript | ElevenLabs | Suno | Runway | Spline | Meshy | Count | Verdict |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | <sentence> | Frame | descript-home-01 | — | … | … | … | … | 3 | pass |
```

- [ ] **Step 3: Verify the counts and verdicts mechanically**

```bash
F=docs/design-system/studio-board-analysis.md
awk -F'|' '/^\| [0-9]+ \|/ { n=0; for (i=5;i<=10;i++) { c=$i; gsub(/^[ \t]+|[ \t]+$/,"",c); if (c!="" && c!="—") n++ }; k=$11; gsub(/[ \t]/,"",k); if (n+0!=k+0) print "COUNT row " $2 ": cells=" n " count=" k }' "$F"
awk -F'|' '/^\| [0-9]+ \|/ { k=$11; gsub(/[ \t]/,"",k); v=$12; gsub(/^[ \t]+|[ \t]+$/,"",v); e=(k>=3?"pass":(k==2?"stalled":"single")); if (v!=e) print "VERDICT row " $2 ": count=" k " verdict=" v " expected=" e }' "$F"
```

Expected: no output from either line. If a row prints, fix the row, not the check.

- [ ] **Step 4: Write §3 to §6**

Replace each `Written in synthesis.`:

- **§3 Frame archetypes found.** One subsection per distinct frame seen at the home stop and one per distinct frame at the editor stop. For each: the products that show it, the S1–S14 archetype it matches (same, variant, new), the MDS taxonomy name if any, the measured widths from §2, and the pattern numbers from §7 it rests on.
- **§4 IA and navigation patterns.** The home → projects → editor → back path per product as a one-line chain, then each navigation pattern from §7 with its count, and for each whether family B covers it (`covered`, `covered with a gap: <missing prop or region>`, `not covered`).
- **§5 Panel mechanics.** Each panel behaviour from §7 with its count and the measured widths, min and max where dragged; and for each whether any family O shell or the vendored `resizable.tsx` covers it.
- **§6 AI placement.** Each placement from §7 with its count, and which existing component (E1, I1, D1, C1 or another) the placement maps to.

Every claim in §3 to §6 cites `#n` from §7.

- [ ] **Step 5: Verify the citations resolve**

```bash
F=docs/design-system/studio-board-analysis.md
MAX=$(awk -F'|' '/^\| [0-9]+ \|/ { n=$2; gsub(/ /,"",n); if (n+0>m) m=n+0 } END { print m }' "$F")
awk '/^## 3\./,/^## 7\./' "$F" | grep -o -E '#[0-9]+' | tr -d '#' | sort -un | awk -v max="$MAX" '$1>max || $1<1 { print "DANGLING #" $1 }'
```

Expected: no `DANGLING` lines.

- [ ] **Step 6: Commit**

```bash
git add docs/design-system/studio-board-analysis.md
git commit -m "docs(studio-slice): synthesis, patterns counted and D1 re-run

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 10: Candidates — §8 to §10

**Files:**
- Modify: `docs/design-system/studio-board-analysis.md` §8, §9, §10

**Interfaces:**
- Consumes: §7's numbered table and verdicts from Task 9; the "Seen, not counted" lines from each §2 section.
- Produces: §8 candidate table with fixed columns `| Candidate | Class | Rests on | Existing coverage | Note |`; Task 11's D22 quotes its counts.

- [ ] **Step 1: Classify every passing pattern**

For each `pass` row in §7, apply the spec's §6.3 test and write one candidate row:

- `component` when it is one piece of UI with its own state and accessibility contract that at least one shell would compose;
- `shell` when it is an arrangement, a distinct set of regions in distinct positions that no existing O item has, or an O item's variant;
- `docs pattern` when it is a relationship across stops that can be documented but not installed.

Several passing patterns may rest under one candidate (a resizable panel group is one component resting on the resize, min-max and remembered-state patterns). A candidate cites every `#n` it rests on.

- [ ] **Step 2: Write §8**

Replace `Written in synthesis.` under `## 8. Candidates`:

```markdown
A candidate is not a commitment; turning one into a catalog row is the next brainstorm's job. Every
candidate rests only on `pass` rows of §7.

| Candidate | Class | Rests on | Existing coverage | Note |
| --- | --- | --- | --- | --- |
| <name> | component | #3, #7 | not covered | <one line> |

**Stalled at two:** <pattern numbers>, each with the products that show it. The wider twelve-product
grid these six were chosen from (Udio, CapCut, Tripo, Krea, Midjourney, Freepik) is the way to settle
them.
```

- [ ] **Step 3: Write §9 and §10**

§9: every "Seen, not counted" line from the six §2 sections, grouped by product, unchanged, with a one-line header saying these are outside the five axes and enter no count. §10: the three app types read (video, voice and music, 3D) and the three not read from the grid (image and design, and the two siblings per type not walked); a sentence that this slice closes no Move 3 category; a sentence that mobile layouts were not read; and the swaps and blocked stops from §1.4, restated.

- [ ] **Step 4: Verify every candidate rests on pass rows only**

```bash
F=docs/design-system/studio-board-analysis.md
awk '/^## 8\./,/^## 9\./' "$F" | awk -F'|' '/^\| [^|#-]/ && NR>0 { print $4 }' | grep -o -E '#[0-9]+' | tr -d '#' | sort -un | while read -r n; do v=$(awk -F'|' -v n="$n" '/^\| [0-9]+ \|/ { k=$2; gsub(/ /,"",k); if (k==n) { s=$12; gsub(/^[ \t]+|[ \t]+$/,"",s); print s } }' "$F"); [ "$v" = "pass" ] || echo "CANDIDATE RESTS ON NON-PASS #$n ($v)"; done
```

Expected: no output.

- [ ] **Step 5: Commit**

```bash
git add docs/design-system/studio-board-analysis.md
git commit -m "docs(studio-slice): candidates by class, seen-not-counted, coverage

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 11: D22, the catalog and gaps notes, CONTINUE, and formatting

**Files:**
- Modify: `docs/design-system/decisions.md` (insert D22 after D21, before the `---` that precedes `## 2. Components dropped from the approved spec`)
- Modify: `docs/design-system/catalog.md` (one blockquote paragraph after the re-sampling status paragraph)
- Modify: `docs/design-system/gaps.md` (one paragraph after the "Move 3 remains **open**" paragraph)
- Modify: `docs/CONTINUE.md` §1 (replace the in-progress paragraph from Task 2)
- Modify: `docs/design-system/studio-board-analysis.md` (status and decision lines)

**Interfaces:**
- Consumes: §7 and §8 counts from Tasks 9 and 10.

- [ ] **Step 1: Count what the doc found**

```bash
F=docs/design-system/studio-board-analysis.md
echo "patterns: $(grep -c -E '^\| [0-9]+ \|' "$F")"
for v in pass stalled single; do echo "$v: $(awk -F'|' -v v="$v" '/^\| [0-9]+ \|/ { s=$12; gsub(/^[ \t]+|[ \t]+$/,"",s); if (s==v) n++ } END { print n+0 }' "$F")"; done
for c in component shell "docs pattern"; do echo "$c: $(awk '/^## 8\./,/^## 9\./' "$F" | grep -c -E "^\| [^|]+ \| $c \|")"; done
```

Write the eight numbers down; the next steps use them.

- [ ] **Step 2: Insert D22 in decisions.md**

Use the Edit tool with this exact `old_string` (the end of D21 and the divider before §2):

```
Recorded in `story-conventions.md`; wave 0 of
`docs/superpowers/specs/2026-09-06-post-case-story-remediation-design.md`.

---

## 2. Components dropped from the approved spec
```

and this `new_string`, with the bracketed numbers replaced by Step 1's:

```
Recorded in `story-conventions.md`; wave 0 of
`docs/superpowers/specs/2026-09-06-post-case-story-remediation-design.md`.

### D22 · The studio slice: layout, IA and navigation across six creative-studio products — 2026-09-07

[`studio-board-analysis.md`](studio-board-analysis.md) reads Descript, ElevenLabs Studio, Suno,
Runway, Spline and Meshy for one pattern axis — the frame, its panels, the information architecture
and the navigation between home, project list, editor and settings — and re-runs D1 over what it
finds. Spec: `docs/superpowers/specs/2026-09-07-studio-layout-ia-slice-design.md`.

**Why a pattern axis and not a category.** Three holes sit outside the existing layout layer: nothing
records how the O shells connect, panel mechanics have no primitive, and the docs site has no place
for a pattern. Each is a claim about layout across app types, so the population was cut across app
types rather than within one.

**Method, and why it is stronger than D14 and D18.** Screens, not documentation: every product was
walked read-only in a signed-in browser at a fixed 1440 × 900 viewport, every capture is on disk and
cited by id, and every width is a DOM measurement with its selector recorded. No row rests on
documentation, so no row carries ⚠. Descript was walked first and its walk wrote the sheet; the other
five were walked under it, and a field a later product forced was back-filled for the products already
read.

**What it found.** [patterns] patterns: [pass] pass D1, [stalled] stalled at two, [single] single.
[component] component candidates, [shell] shell candidates, [docs pattern] docs-pattern candidates,
all in §8 of the doc, each resting only on passing patterns.

**What it changes.** The catalog's re-sampling note and gaps.md's Move 3 note each gain a paragraph.
No catalog row, manifest row or registry file changes: candidates are inputs to the next brainstorm,
not commitments.

**What it leaves open.** Move 3's five categories are still unsampled for their components. Patterns
stalled at two are listed with the wider twelve-product grid the six were chosen from as the way to
settle them.

---

## 2. Components dropped from the approved spec
```

- [ ] **Step 3: Add the catalog note**

Edit tool on `docs/design-system/catalog.md`, exact `old_string`:

```
> extraction, vision, data and coding remain unsampled, so this note still stands for them.
```

`new_string`:

```
> extraction, vision, data and coding remain unsampled, so this note still stands for them.
>
> **Studio slice (D22, 2026-09-07):** a second slice read six creative-studio products for layout,
> IA and navigation only — [studio-board-analysis.md](studio-board-analysis.md). It produced
> candidates, not rows, and closes no category: the five above are still unsampled for their
> components.
```

- [ ] **Step 4: Add the gaps note**

Edit tool on `docs/design-system/gaps.md`, exact `old_string`:

```
remaining U-items are candidates, not commitments, and the sampling-bias limitation in §1 still
stands for them.
```

`new_string`:

```
remaining U-items are candidates, not commitments, and the sampling-bias limitation in §1 still
stands for them.

**2026-09-07 (D22) — a pattern-axis slice, not a category slice.** Six creative-studio products
(Descript, ElevenLabs Studio, Suno, Runway, Spline, Meshy) were read for layout, IA and navigation
only — [studio-board-analysis.md](studio-board-analysis.md). It closes none of the five categories
above: ElevenLabs and Suno are voice and music products, but only their frames were read, not their
components.
```

- [ ] **Step 5: Replace the CONTINUE paragraph**

Edit tool on `docs/CONTINUE.md`, exact `old_string`:

```
**Studio layout and IA slice in progress (2026-09-07).** Six creative-studio
products are being read for layout, IA and navigation patterns —
[`design-system/studio-board-analysis.md`](design-system/studio-board-analysis.md),
whose status line says which products are read. Spec:
`superpowers/specs/2026-09-07-studio-layout-ia-slice-design.md`. It ends with
candidates, not catalog items.
```

`new_string`, with the bracketed numbers from Step 1:

```
**Studio layout and IA slice done (2026-09-07, D22).** Six creative-studio
products read for layout, IA and navigation patterns —
[`design-system/studio-board-analysis.md`](design-system/studio-board-analysis.md):
[patterns] patterns, [pass] passing D1, [component] component, [shell] shell and
[docs pattern] docs-pattern candidates in its §8. Candidates, not catalog items:
the next brainstorm picks what ships. Spec:
`superpowers/specs/2026-09-07-studio-layout-ia-slice-design.md`.
```

- [ ] **Step 6: Finish the analysis doc's header**

Edit tool on `docs/design-system/studio-board-analysis.md`: replace `**Decision:** D22 in [decisions.md](decisions.md), written when the read is complete.` with `**Decision:** D22 in [decisions.md](decisions.md).`, and confirm the status line reads `**Status:** 6 of 6 products read.`

- [ ] **Step 7: Format the new doc and decisions.md with the repo's prettier**

Only these two. `catalog.md`, `gaps.md` and `CONTINUE.md` are **not** prettier-clean on `main` today (checked 2026-09-07), so `--write` on them would drag unrelated reflows into this PR; `format:check` is not in CI, so leaving them as they are costs nothing.

```bash
pnpm install --offline --frozen-lockfile
pnpm exec prettier --write docs/design-system/studio-board-analysis.md docs/design-system/decisions.md
pnpm exec prettier --check docs/design-system/studio-board-analysis.md docs/design-system/decisions.md
git diff --stat docs/design-system/decisions.md
```

Expected: the check passes, and the `decisions.md` diff is D22 only (it was clean before this task). Then re-run the Task 9 Step 3 and Task 10 Step 4 checks, since prettier realigns tables:

```bash
F=docs/design-system/studio-board-analysis.md
awk -F'|' '/^\| [0-9]+ +\|/ { n=0; for (i=5;i<=10;i++) { c=$i; gsub(/^[ \t]+|[ \t]+$/,"",c); if (c!="" && c!="—") n++ }; k=$11; gsub(/[ \t]/,"",k); if (n+0!=k+0) print "COUNT row " $2 ": cells=" n " count=" k }' "$F"
```

Expected: no output. (Prettier pads the `#` column, so this variant allows extra spaces before the pipe.)

- [ ] **Step 8: Commit**

```bash
git add docs/design-system/studio-board-analysis.md docs/design-system/decisions.md docs/design-system/catalog.md docs/design-system/gaps.md docs/CONTINUE.md
git commit -m "docs(studio-slice): D22, catalog and gaps notes, CONTINUE status

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 12: Push and open the PR

**Files:** none in the repo beyond the plan's checkboxes.

- [ ] **Step 1: Confirm the target out loud**

```bash
git remote get-url origin
git branch --show-current
gh auth status 2>&1 | head -3
```

Expected: `https://github.com/VV-DSGN-INC/Super-AI-Components.git`, `claude/layout-navigation-patterns-f02e70`, and a `gh` login as `weeeha`. State all three in the report before pushing. If the account is not `weeeha`, stop and report: pushing needs that account.

- [ ] **Step 2: Push**

```bash
git push -u origin claude/layout-navigation-patterns-f02e70
```

- [ ] **Step 3: Open the PR**

```bash
gh pr create --base main --title "docs: studio layout and IA slice (D22)" --body "$(cat <<'EOF'
## What

A research slice, not a build. Six creative-studio products (Descript, ElevenLabs Studio, Suno, Runway, Spline, Meshy) read for layout, information architecture and navigation patterns, with every pattern counted and the D1 inclusion test re-run. Ends with candidates classified as component, shell or docs pattern. No catalog row, manifest row or registry file changes.

- `docs/design-system/studio-board-analysis.md` — method, six product sections with capture ids and DOM-measured widths, counted patterns, D1 re-run, candidates
- `docs/design-system/decisions.md` — D22
- `docs/design-system/catalog.md`, `docs/design-system/gaps.md`, `docs/CONTINUE.md` — status notes
- spec and plan under `docs/superpowers/`

Captures live outside the repo (`~/ClaudeCode Projects/Super-AI-Components-research/studio-slice/`); the doc indexes every id.

## Why

Three holes sit outside the existing layout layer: nothing records how the O shells connect, panel mechanics have no primitive, and the docs site has no place for a pattern. The population was read before anything is built, the way D14 and D18 were.

## Gates

Docs only. Lint, typecheck, token, contract, test, registry, build, smoke, a11y and consumer gates are unaffected. Prettier run on the new doc and on `decisions.md`; `catalog.md`, `gaps.md` and `CONTINUE.md` are not prettier-clean on `main` and were left as they are so the diff stays scoped.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 4: Report**

Give Nick the PR URL, the counts from Task 11 Step 1, and the path of the captures folder. No deploy: nothing in `apps/` changed.

---

## Self-review

**Spec coverage.** §1 why → Task 2 skeleton §1 and D22. §2 scope in/out → Global Constraints, Task 10 §10. §3 products and alternates → Task 1 session check, Tasks 3–8 product specifics and alternate handling. §4 method → protocol order across Tasks 3–8. §5.1 rules and viewport → Global Constraints, P1, P2. §5.2 captures → Task 1 script, P3, README. §5.3 walk → P6, P7. §5.4 sheet → Task 2 §1.3, P8. §5.5 ratchet → P9. §5.6 blocked reads → P1 and each task's Step 1. §6.1 counting → Task 9 Step 2 and Step 3 checks. §6.2 against what exists → Task 9 Step 4. §6.3 classes → Task 10. §6.4 doc sections → Task 2 skeleton and Tasks 9–10. §7 outputs → Tasks 2, 9, 10, 11. §8 verification → P10, Task 9 Steps 3 and 5, Task 10 Step 4. §9 risks → P1, P7 restore rule, §1.4 deviations, status line. §10 sequencing → task order. §11 deferred → not planned, by design.

**Placeholders.** None: every step carries its command, text or table. Bracketed values in Task 11 are computed by Task 11 Step 1, not left open.

**Consistency.** Stop names `home|projects|editor|settings|back` and product names `descript|elevenlabs|suno|runway|spline|meshy` are the same in the capture script, P3, P10's regex, the README and every task. The §7 column order used by the awk checks matches the table header in Task 9 Step 2. The candidate table's third column (`Rests on`) is `$4` in Task 10 Step 4's awk, matching `| Candidate | Class | Rests on |`.
