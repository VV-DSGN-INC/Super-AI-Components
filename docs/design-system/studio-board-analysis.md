# Studio board analysis — layout, IA and navigation across six creative-studio products

**Scope:** one pattern axis — the frame, its panels, the information architecture and the navigation
between home, project list, editor and settings — read across six products in three app types.
**Read:** started 2026-09-07. **Status:** 2 of 6 products read (Spline with its editor pending, Tripo).
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
| Spline | 3D | named by Nick; on the primary board | signed in after Nick's sign-in, later the same day | 2026-09-07 |
| Meshy → **Tripo** | 3D | sibling of Spline; swapped for its alternate Tripo (§1.4) | Meshy: no session; Tripo: signed in | 2026-09-07 |

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

- 2026-09-07 session check: five of six products had no session in the walk's Chrome profile.
  Nick signed in to Descript, ElevenLabs Studio, Spline and Tripo (Meshy's alternate); Suno, Runway,
  Meshy, Udio and CapCut stayed signed out.
- 2026-09-07 pilot order: Descript landed on an onboarding questionnaire and ElevenLabs on a
  platform chooser, both settings the walk may not answer, so **Spline was walked first** and wrote
  sheet v1. Descript still writes nothing new unless it forces a row (§1.3 marks those).
- 2026-09-07 Spline editor not reached: the workspace has no files, and creating one is outside the
  walk. Revisit once a file exists.
- 2026-09-07 Meshy swapped for Tripo: Meshy had no session (redirects to its public community page);
  Tripo, its listed alternate, was signed in. Every id and column says Tripo.
- 2026-09-07 Tripo has no settings page: the avatar menu is the settings surface (Community Profile,
  API, an inline Notification toggle); its "nick · Free" row is display only. Recorded as-is.
- 2026-09-07 Tripo ⌘K tested on the home stop after the walk: no palette.

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

**Read** 2026-09-07 · **DPR** 2 · **viewport** 1440 × 900 · **stops** home `app.spline.design/home` ·
projects `/files` · editor **not reached** (empty workspace, §1.4) · settings
`/workspace-settings/<id>`, a routed dialog opened from the workspace switcher.
**Product's own names:** projects = "My files" (the sidebar's "Projects" are folders inside it),
editor = the scene editor (not reached), settings = "Settings" in the workspace switcher menu.

| Id | Stop | Shows |
| --- | --- | --- |
| spline-home-01 | home | on arrival: sidebar, page header with create actions, "Welcome back" hero omnibox with three suggestion chips |
| spline-home-02 | home | ⌘K: a workspace file search modal ("Search files in this workspace"), not a command palette |
| spline-home-03 | home | workspace switcher menu open: Settings · Invite · account email · workspace list · Create Workspace · Upgrade Plan · Theme › · Download Desktop App · Archive · Help & Feedback › · Logout |
| spline-projects-01 | projects | on arrival, empty workspace: "How would you like to start?" with 3D Scene / Design / Generate / Import tiles and three template tiles; header carries My files · Shared with me tabs, + New Folder, grid/list toggle, All filter, Last modified sort, Create |
| spline-settings-01 | settings | Workspace Settings as a 1100 × 760 dialog over the files page, own URL, two columns: settings nav 252 + content 846 |

| Field | Home | Projects | Editor | Settings |
| --- | --- | --- | --- | --- |
| Frame · archetype | console (MDS): left sidebar, content owns its header; S1 app home with hero omnibox (spline-home-01) | console, same frame (spline-projects-01) | not reached | dialog over the console: a page-sized modal with its own sidebar + content (spline-settings-01) |
| Frame · regions | sidebar (workspace-switcher, search, inbox, nav, projects-folders, promo-cards) · page-header (title, create actions) · content (hero omnibox, chips) | sidebar · page-header (local tabs, new-folder, view-toggle, filter, sort, create) · content (empty state) | not reached | dialog: settings-nav · settings-content; the app frame stays underneath, dimmed |
| Frame · fixed / flexible | sidebar fixed, header fixed height, content flexes | same | not reached | dialog fixed 1100 × 760, centred (170, 70) |
| Frame · widths | sidebar 252 `aside`; sidebar scroll area 251 × 672 `#user-sidebar-scrollable-area` (64 above it for the switcher row, 164 below for the promo cards); header 64 tall `[class*="PageHeader-module"][class*="__header"]`; omnibox textarea 620 `textarea` | sidebar 252 `aside`; header 64 `[class*="PageHeader-module"][class*="__header"]` | not reached | dialog 1100 × 760 `[class*="UserModal-module"][class*="__modal"]`; settings nav 252 `[class*="SettingsSidebar-module"][class*="settingsSidebar"]`; content 846 `[class*="Page-module"][class*="__content"]` |
| Panels · resizable | none: no handle on the sidebar | none | not reached | none |
| Panels · collapsible | none found: no collapse control on the sidebar or in its buttons | none found | not reached | n/a |
| Panels · dock / float | none | none | not reached | n/a |
| Panels · tabbed | none | page-header local tabs (My files · Shared with me) | not reached | nav sections (My Account · Workspace · Settings), not tabs |
| Panels · remembered | n/a | view toggle state not testable on an empty list | not reached | n/a |
| IA · sections | Home · My files · Templates · Community · Academy; then Projects (folders, + New Project); top: workspace switcher · Search · Inbox; bottom: Connect with MCP (dismissible) · Upgrade your workspace | same sidebar | not reached | My Account (Account Settings · Community Profile · Refer a Friend) · Workspace (nick's Workspace · Members · Billing) · Settings (MCP) |
| IA · depth to editor | not measured: no file exists; the header's 3D Scene / Design / Generate / Import and the omnibox each create a new scene in one action | one click from a file card, not verified | not reached | n/a |
| IA · surface kind | page; ⌘K search = modal | page; community file (seen on the way) = page with an embedded viewer | not reached | routed dialog: own URL, overlay, Escape returns to `/files` |
| Nav · global | left sidebar 252, persistent on every stop reached | same | not reached | the dialog keeps the sidebar visible but dimmed |
| Nav · local | none | page-header tabs; community page has Explore · Feed · Notifications | not reached | settings nav |
| Nav · contextual | none | none, no breadcrumb on the community file page either | not reached | close (×) and Escape |
| Nav · palette | ⌘K = file search only; the omnibox accepts "/" for commands | ⌘K = file search | not reached | none |
| Nav · home ↔ editor | not reached | not reached | not reached | n/a |
| AI · placement | the home's primary action: hero omnibox (prompt, attach, what-to-generate, quality, thinking-effort, send) with suggestion chips; Generate as a header action; Connect with MCP promo in the sidebar | Generate as one of four start tiles in the empty state and as a header action | not reached | MCP as a settings section |
| Captures | spline-home-01 · spline-home-02 · spline-home-03 | spline-projects-01 | — | spline-settings-01 |

**The way back:** not reached (no editor).
**Seen, not counted:** the Community page is an explore gallery (S8: card grid, Explore · Feed ·
Notifications tabs, search, Publish); a community file opens as a detail page inside the same frame
(embedded live viewer, author, stats, Remix, share, more-by); the empty files page is an empty state
with four creation modes plus template tiles; the sidebar carries an Inbox (notifications) button and
the switcher an Invite action.

### 2.6 Tripo (Meshy's alternate)

**Read** 2026-09-07 · **DPR** 2 · **viewport** 1440 × 900 · **stops** home `studio.tripo3d.ai/` ·
projects `/assets` · editor `/workspace/generate` (an opened asset is `/workspace/generate/<id>`,
a switched tool is `/workspace/<tool>`) · settings = the avatar menu; no settings page exists behind
it (§1.4).
**Product's own names:** projects = "Assets" (My Assets · Collected), editor = "3D Workspace",
settings = the account menu (Community Profile · API · Notification · Logout).

| Id | Stop | Shows |
| --- | --- | --- |
| tripo-home-01 | home | on arrival: top bar with horizontal nav, upgrade banner, "Hi, nick! What will you bring into 3D?" hero with an image dropzone, Best Quality · Clean Topology chips and Generate; below, a Gallery with category chips and a card grid |
| tripo-projects-01 | projects | Assets on arrival: Model · Image segmented control, My Assets · Collected tabs, All · Smart Mesh · Untextured · Textured · Rigged chips, Manage, four-column card grid, no sort, no list toggle |
| tripo-editor-01 | editor | 3D Workspace on arrival (Model tool): rail, Generate Model panel, empty viewport with "Ready For A New 3D Model?", Assets panel with existing models, floating right toolbar, floating notification strip |
| tripo-editor-02 | editor | Property tab with nothing selected: "Hierarchy", empty |
| tripo-editor-03 | editor | rail switched to Texture: route `/workspace/texture`, left panel swapped to the Texture Generator empty state, rail expanded with Edit · Upscale · PBR, viewport and right panel unchanged |
| tripo-editor-04 | editor | an existing asset opened from the Assets panel: route `/workspace/generate/<id>`, model in the viewport, Triangle Faces · Vertices readout, bottom toolbar, first-run "View Your Model" coach mark |
| tripo-editor-05 | editor | same asset, Property tab: Hierarchy lists the node; bottom toolbar with undo · redo · view modes · 3D Print · Share · Export · Feature My Model |
| tripo-settings-01 | settings | account menu open, 232 wide: Switch Account · nick · Free · Create Team · Community Profile · API › · Notification toggle · Contact Us · Join Community · Logout |
| tripo-back-01 | back | home after leaving the workspace through the top bar's Home |

| Field | Home | Projects | Editor | Settings |
| --- | --- | --- | --- | --- |
| Frame · archetype | portal (MDS): top bar with horizontal nav, no sidebar, centred scrolling content; the content is S1's hero plus an S8 explore gallery (tripo-home-01) | portal, same top bar (tripo-projects-01) | the same top bar over a canvas-centric workspace of floating islands: rail + tool panel left, viewport, side panel right, toolbars floating over the canvas; S6 generation workspace with S3's rail-selects-panel rule (tripo-editor-01, -03) | a popover menu, no page (tripo-settings-01) |
| Frame · regions | topbar (product-switcher, nav, credits, upgrade, notifications, community, help, avatar) · promo-banner · hero (dropzone, chips, generate) · gallery (filter chips, card grid) | topbar · promo-banner · content (segmented control, local tabs, filter chips, manage, card grid) | topbar · notification-strip · modality-rail · tool-panel · viewport · floating-toolbar · stats-readout · bottom-toolbar (once a model is loaded) · side-panel (Assets · Property) | menu |
| Frame · fixed / flexible | topbar fixed 60 tall; banner fixed 46; hero fixed 920 wide, centred; gallery grid flexes | topbar and banner fixed; grid flexes, four columns at 1440 | rail, tool panel and side panel fixed; viewport flexes | fixed 232 |
| Frame · widths | topbar 60 tall `[class*="h-15"][class*="absolute"]` with `header` 48 tall inset 12 and `nav` 602 wide; banner 46 tall (the full-width `div` at y 60); hero 920 wide `main .mx-auto` at y 278 | topbar as home; asset grid 1416 wide `.flex.flex-wrap.gap-4` at (12, 300) | rail 54 × 816 at (12, 72) `[class*="w-13.5"]`; tool panel 248 × 816 at (67, 72), the `div` after the rail; side panel 248 × 816 at (1180, 72) `[class*="rounded-5"][class*="bg-gray-3"]`; viewport 865 × 840 at (315, 60) `canvas`; notification strip 549 × 40 at (473, 72); right toolbar buttons 32 wide at x 1116; bottom toolbar buttons 32 tall at y 848 | menu 232 × 412 at (1196, 73) |
| Panels · resizable | n/a | n/a | none: a scan of every element's computed cursor found no col-resize or ew-resize anywhere (tripo-editor-01) | n/a |
| Panels · collapsible | n/a | n/a | none found: no collapse control on the rail, the tool panel or the side panel | n/a |
| Panels · dock / float | n/a | n/a | fixed islands with 12 px insets and rounded corners; toolbars float over the viewport (right column, bottom row, top strip); nothing undocks | n/a |
| Panels · tabbed | none | Model · Image segmented control; My Assets · Collected tabs | side panel Assets · Property (`[role=tab]`) | none |
| Panels · remembered | n/a | n/a | nothing collapsible; the selected tool and the opened asset are routes, so both survive leaving and returning by URL | n/a |
| IA · sections | 3D Workspace ▾ · Home · Assets · Creator Hub · Resources ▾; right side: DCC Bridge · 200 credits · Upgrade · notifications · community · help · avatar | same top bar | rail: Image · Model · Segment · Retopo · Texture (Edit · Upscale · PBR) · Animate | Switch Account · Create Team · Community Profile · API · Notification · Contact Us · Join Community · Logout |
| IA · depth to editor | 1 click (3D Workspace) to the empty workspace; 2 to an opened asset (workspace, then an Assets thumbnail) | 1 click from a card, not verified: cards are not anchors | — | n/a |
| IA · surface kind | page; the Upgrade button opens a pricing modal, and closing it opens an exit-intent modal (§9) | page | page with a routed tool and a routed selection; the first-run hint is a modal coach mark (tripo-editor-04) | popover menu; nick · Free is display only, not a link |
| Nav · global | top bar | top bar | the top bar stays, unchanged, above the workspace | top bar |
| Nav · local | gallery category chips | segmented control, tabs, filter chips | rail (routed); side panel tabs | none |
| Nav · contextual | none; no breadcrumb anywhere | none | none; the product switcher doubles as the editor entry; back is Home in the top bar | none |
| Nav · palette | none: ⌘K does nothing (tested after tripo-back-01, see §1.4) | none | none | none |
| Nav · home ↔ editor | — | — | the top bar is kept; the promo banner goes and a floating notification strip takes its place; the scrolling page becomes a fixed-height workspace (tripo-editor-01 vs tripo-home-01) | n/a |
| AI · placement | the home's primary action: an image dropzone with quality chips and Generate; the gallery below is community output | none (Manage only) | the tool panel is the AI: model picker "v3.1 – Best Quality", members-only rows with Trial x1 badges, privacy select, Generate carrying its cost 55; the rail is a list of AI tools; Generate Image for 3D as a secondary path (tripo-editor-01) | none |
| Captures | tripo-home-01 | tripo-projects-01 | tripo-editor-01 · tripo-editor-02 · tripo-editor-03 · tripo-editor-04 · tripo-editor-05 | tripo-settings-01 |

**The way back:** Home in the top bar (tripo-back-01). Kept: the top bar. Replaced: the workspace
islands by the hero and gallery, and the promo banner returns.
**Seen, not counted:** a pricing dialog (Individual · Team, Monthly · Annually, Free · Pro · Max)
behind Upgrade, and an exit-intent "Special Bonus" dialog when it is closed (not captured, opened
by accident while looking for the avatar); the first-run coach mark (tripo-editor-04); a Triangle
Faces · Vertices stats readout over the viewport (tripo-editor-04); members-only rows with Trial
badges and a Generate button carrying its cost (tripo-editor-01); the home gallery as an explore feed
with category chips (tripo-home-01).

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
