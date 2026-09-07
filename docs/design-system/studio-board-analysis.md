# Studio board analysis — layout, IA and navigation across six creative-studio products

**Scope:** one pattern axis — the frame, its panels, the information architecture and the navigation
between home, project list, editor and settings — read across six products in three app types.
**Read:** started 2026-09-07. **Status:** 3 of 6 products read (Spline and Tripo in full, Descript with its editor pending).
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
| Descript | video | pilot; on the primary board | signed in after Nick cleared the onboarding questionnaire | 2026-09-07 |
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
- 2026-09-07 Spline editor reached on a second pass, after Nick created a starter file; the first
  pass had found an empty workspace.
- 2026-09-07 Meshy swapped for Tripo: Meshy had no session (redirects to its public community page);
  Tripo, its listed alternate, was signed in. Every id and column says Tripo.
- 2026-09-07 Tripo has no settings page: the avatar menu is the settings surface (Community Profile,
  API, an inline Notification toggle); its "nick · Free" row is display only. Recorded as-is.
- 2026-09-07 Tripo ⌘K tested on the home stop after the walk: no palette.
- 2026-09-07 Descript editor not reached: Recents, Personal and General are all empty, and the one
  project open in Nick's own browser belongs to another account (`You need permission`). Creating a
  project is outside the walk. Revisit once a project exists.
- 2026-09-07 the pilot moved again: Descript was blocked at a sign-in wall and then an onboarding
  questionnaire when the slice started, so **Spline wrote sheet v1** and Descript was read third,
  under it. No row was forced by Descript.

---

## 2. Products and captures

### 2.1 Descript

**Read** 2026-09-07 · **DPR** 2 · **viewport** 1440 × 900 · **stops** home `web.descript.com/` ·
projects `/projects?filter=recent-projects` and `/workspaces/<id>` · editor **not reached** (no
project in either workspace, §1.4) · settings `/view/settings/account?active=general`, a routed
dialog.
**Product's own names:** the whole app is a "Drive"; projects = Recents / a workspace's project list,
editor = the project editor (not reached), settings = "Settings" in the account menu.

| Id | Stop | Shows |
| --- | --- | --- |
| descript-home-01 | home | on arrival: header bar, drive sidebar, "What can I help you with?" hero omnibox with attach, an Auto model chip, Get started, seven task chips and a prompt-templates link; Record and New project above it |
| descript-home-02 | home | help menu: Help center · Feature requests · What's new · Contact support · Search actions… ⌘K · Keyboard shortcuts ⌥⌘K · licenses · Debug · version |
| descript-home-03 | home | account menu: avatar, name, email, Appearance, Settings, Log out |
| descript-projects-01 | projects | Recents, empty: All · Owned by me tabs, Filters, Grid view / List view toggle, Record and New project |
| descript-projects-02 | projects | the Personal workspace, empty, in list view: table columns Name · Duration · Created · Last Viewed · Favorite, plus Folders and Recordings groups |
| descript-settings-01 | settings | Settings as an 800 × 720 dialog over the drive, own URL, own 240-wide settings sidebar |

| Field | Home | Projects | Editor | Settings |
| --- | --- | --- | --- | --- |
| Frame · archetype | console (MDS): full-width header bar over a left sidebar and content; S1 app home with a hero omnibox (descript-home-01) | console, same frame (descript-projects-01) | not reached | dialog over the console, with its own sidebar (descript-settings-01) |
| Frame · regions | header (search, credits, minutes, upgrade, avatar, help) · sidebar (drive switcher, nav, workspaces, tools) · plan-banner · content (hero omnibox, task chips, feature cards, tour card) | header · sidebar · plan-banner · content (title, tabs, filters, view toggle, project list) | not reached | dialog: settings-nav · settings-content |
| Frame · fixed / flexible | header fixed 48 tall; sidebar fixed 240; hero fixed 860 wide, centred; content flexes | same | not reached | dialog fixed 800 × 720 at (320, 90) |
| Frame · widths | header 1440 × 48 `[role=banner]`; sidebar 240 `[data-testid=drive-sidebar]`; content 1094 `#maincontent` (inset from the 1190-wide scroll area); hero 860 wide at y 201 | same header and sidebar; content 1094 `#maincontent` | not reached | dialog 800 × 720 `[class*="AccountDialog-module--hdZvAA"]`; settings nav 240 `[class*="AccountDialog-module--DpInk1"]` |
| Panels · resizable | none | none | not reached | none |
| Panels · collapsible | a sidebar-toggle button sits at the header's far left (descript-home-01); not exercised | same | not reached | n/a |
| Panels · dock / float | none | none | not reached | n/a |
| Panels · tabbed | none | All · Owned by me | not reached | nav sections (General · Account · Drive) |
| Panels · remembered | n/a | not testable: both lists are empty | not reached | n/a |
| IA · sections | drive switcher; Home · Recents · Shared with me; Workspaces (Personal · General); Tools (Brand Studio · Media library · Rooms recordings · AI speakers · Layout packs · Learn Descript) | same sidebar | not reached | Settings · General · Account (Profile · AI models · Notifications · Connected apps · Descript MCP `New` · API tokens) · Drive (Preferences · Members · Plan · Usage · Invoices) |
| IA · depth to editor | not measured: no project exists; New project or a task chip creates one in a single action | 1 click from a row, not verified | not reached | n/a |
| IA · surface kind | page; help and account are menus | page | not reached | routed dialog: own URL, overlay, closes back to the drive |
| Nav · global | left sidebar 240, plus a full-width header that carries global search | same | not reached | the dialog keeps the drive visible behind it |
| Nav · local | none | All · Owned by me tabs, Filters, grid/list toggle | not reached | settings nav |
| Nav · contextual | none | page title only, no breadcrumb | not reached | close (×) |
| Nav · palette | **⌘K "Search actions…", with ⌥⌘K for a keyboard-shortcuts sheet** — both advertised in the help menu (descript-home-02) | same | not reached | n/a |
| Nav · home ↔ editor | not reached | not reached | not reached | n/a |
| AI · placement | the home's primary action: hero omnibox with attach, an Auto model chip and Get started, over seven task chips (clean up, avatar, rough cut, social clips, translate and dub, slides to video, animated video) plus a prompt-templates link; three feature cards below | none | not reached | AI models as a settings section; Descript MCP as a new one |
| Captures | descript-home-01 · descript-home-02 · descript-home-03 | descript-projects-01 · descript-projects-02 | — | descript-settings-01 |

**The way back:** not reached (no editor).
**Seen, not counted:** a free-plan upgrade banner across the content column and a credits/minutes
readout in the header (descript-home-01); a "Take a tour of Descript" card at the foot of home; the
account menu carries an Appearance entry (descript-home-03).

### 2.2 ElevenLabs Studio

Not read yet.

### 2.3 Suno

Not read yet.

### 2.4 Runway

Not read yet.

### 2.5 Spline

**Read** 2026-09-07 · **DPR** 2 · **viewport** 1440 × 900 · **stops** home `app.spline.design/home` ·
projects `/files` · editor `/file/<id>` · settings `/workspace-settings/<id>`, a routed dialog opened
from the workspace switcher.
**Product's own names:** projects = "My files" (the sidebar's "Projects" are folders inside it),
editor = the scene editor, settings = "Settings" in the workspace switcher menu.

| Id | Stop | Shows |
| --- | --- | --- |
| spline-home-01 | home | on arrival: sidebar, page header with create actions, "Welcome back" hero omnibox with three suggestion chips |
| spline-home-02 | home | ⌘K: a workspace file search modal ("Search files in this workspace"), not a command palette |
| spline-home-03 | home | workspace switcher menu: Settings · Invite · account email · workspace list · Create Workspace · Upgrade Plan · Theme › · Download Desktop App · Archive · Help & Feedback › · Logout |
| spline-projects-01 | projects | My files, empty workspace: "How would you like to start?" with 3D Scene / Design / Generate / Import tiles and template tiles; header carries My files · Shared with me tabs, + New Folder, grid/list toggle, All filter, Last modified sort, Create |
| spline-projects-02 | projects | My files with one file: a 257 × 212 card in the grid, "Edited 2 hours ago" |
| spline-editor-01 | editor | the scene editor on arrival: left sidebar 320 on the Agent tab, canvas, right inspector 230, top bar with Preview · Edit · Code, create tools, Toggle Timeline, zoom, Share, Export |
| spline-editor-02 | editor | left sidebar dragged to its maximum, 560 |
| spline-editor-03 | editor | left sidebar collapsed by Hide Sidebar: gone entirely, canvas widens to 1178 |
| spline-editor-04 | editor | left sidebar on the Objects tab: scene hierarchy (Scenes, Welcome to Spline, States & Events, Materials, Timeline Animation, Camera, Point Light, Ground) |
| spline-editor-05 | editor | the main dropdown: Go to Dashboard · New 3D Scene · New Design · Duplicate File · Open/Import ⌘O · Move To… · Version History · Save File To Local · Undo/Redo · clipboard actions · Rename ^R · Toggle UI ⌘\ · Toggle Full Screen · Zoom |
| spline-settings-01 | settings | Workspace Settings as a 1100 × 760 dialog over the files page, own URL, settings nav 252 + content 846 |
| spline-back-01 | back | home again, reached by the editor's main dropdown → Go to Dashboard |

| Field | Home | Projects | Editor | Settings |
| --- | --- | --- | --- | --- |
| Frame · archetype | console (MDS): left sidebar, content owns its header; S1 app home with hero omnibox (spline-home-01) | console, same frame (spline-projects-01) | S3 studio editor: left panel · canvas · right inspector under a full-width top bar; canvas-centric with docked panels rather than floating islands (spline-editor-01) | dialog over the console: a page-sized modal with its own sidebar + content (spline-settings-01) |
| Frame · regions | sidebar (workspace-switcher, search, inbox, nav, projects-folders, promo-cards) · page-header (title, create actions) · content (hero omnibox, chips) | sidebar · page-header (local tabs, new-folder, view-toggle, filter, sort, create) · content (grid) | topbar (main-dropdown, file-name, mode-tabs, create-tools, timeline-toggle, presence, zoom, share, export, inspector-toggle) · left-panel (tabs: agent · objects · assets) · canvas · inspector · view-controls (floating, bottom-right) | dialog: settings-nav · settings-content; the app frame stays underneath, dimmed |
| Frame · fixed / flexible | sidebar fixed, header fixed height, content flexes | same | top bar fixed 56 tall; both side panels user-sized; canvas flexes to what is left | dialog fixed 1100 × 760, centred (170, 70) |
| Frame · widths | sidebar 252 `aside`; sidebar scroll area 251 × 672 `#user-sidebar-scrollable-area`; header 64 tall `[class*="PageHeader-module"][class*="__header"]`; omnibox textarea 620 `textarea` | sidebar 252 `aside`; header 64; file card 257 × 212 `[class*="Item-module"][class*="__container"]` | left panel 320 default `[class*="Sidebar-module"][class*="container"]` (first); inspector 230 at x 1210 (second); inspector scroll 229 `#inspectorScroll`; canvas 1178 wide at x 16 with the left panel collapsed; drag handles 10 wide at x 319 and 8 wide at x 1211, both `[class*="Sidebar-module"][class*="handle"]` | dialog 1100 × 760 `[class*="UserModal-module"][class*="__modal"]`; settings nav 252 `[class*="SettingsSidebar-module"][class*="settingsSidebar"]`; content 846 `[class*="Page-module"][class*="__content"]` |
| Panels · resizable | none | none | **both side panels**, each with a col-resize handle. Left: default 320, min 320, max 560 (dragged past both ends and measured, spline-editor-02). Right: handle present at x 1211, same class | none |
| Panels · collapsible | none found | none found | **both**, to nothing: Hide Sidebar sets the left panel to `display: none` and the canvas takes the space (spline-editor-03); Hide Inspector does the same on the right, and the top-bar button then reads Show Inspector | n/a |
| Panels · dock / float | none | none | side panels are docked and do not undock; only the view controls float over the canvas, and they collapse | n/a |
| Panels · tabbed | none | page-header local tabs (My files · Shared with me) | left panel: Agent · Objects · Assets (`[role=tab]`), plus Versions, New chat and Chat history buttons on the same row | nav sections (My Account · Workspace · Settings), not tabs |
| Panels · remembered | n/a | view toggle state not tested | **width yes, tab no.** After a reload the left panel came back at the width the drag left it (322, not the 320 default); the selected tab reset from Objects to Agent | n/a |
| IA · sections | Home · My files · Templates · Community · Academy; then Projects (folders, + New Project); top: workspace switcher · Search · Inbox; bottom: Connect with MCP (dismissible) · Upgrade your workspace | same sidebar | no product nav at all inside the editor: the sidebar is replaced by the file's own panels, and the app's sections are reachable only through the main dropdown | My Account (Account Settings · Community Profile · Refer a Friend) · Workspace (nick's Workspace · Members · Billing) · Settings (MCP) |
| IA · depth to editor | 2 clicks: My files, then a file card | 1 click from a file card | — | n/a |
| IA · surface kind | page; ⌘K search = modal | page | page, one URL per file; the main dropdown is a menu | routed dialog: own URL, overlay, Escape returns to `/files` |
| Nav · global | left sidebar 252, persistent | same | **gone**: the editor drops the product sidebar entirely | the dialog keeps the sidebar visible but dimmed |
| Nav · local | none | page-header tabs | mode tabs Preview · Edit · Code in the top bar; the left panel's own tabs | settings nav |
| Nav · contextual | none | none | file name in the top bar; no breadcrumb; the way out is the main dropdown | close (×) and Escape |
| Nav · palette | ⌘K = file search only; the omnibox accepts "/" for commands | ⌘K = file search | no palette, but the main dropdown lists shortcuts for most of its items (⌘O, ⌘⇧S, ⌘Z, ⌘A, ⌘\, ⌘⇧F) | none |
| Nav · home ↔ editor | — | — | **the frame is fully replaced.** Home's sidebar, page header and hero go; the editor's top bar, two side panels and canvas take over. Nothing but the browser tab persists (spline-home-01 vs spline-editor-01) | n/a |
| AI · placement | the home's primary action: hero omnibox (prompt, attach, what-to-generate, quality, thinking-effort, send) with suggestion chips; Generate as a header action; Connect with MCP promo in the sidebar | Generate as one of four start tiles in the empty state and as a header action | **the Agent tab is the left panel's default tab**: a chat panel with an empty state ("Let's build!"), five suggestion chips, an "Upgrade to use the AI agent" gate, the MCP promo, and a composer with attach, Medium/High quality, Refine 2x and Send (spline-editor-01) | MCP as a settings section |
| Captures | spline-home-01 · spline-home-02 · spline-home-03 | spline-projects-01 · spline-projects-02 | spline-editor-01 · spline-editor-02 · spline-editor-03 · spline-editor-04 · spline-editor-05 | spline-settings-01 |

**The way back:** the main dropdown's Go to Dashboard (spline-back-01). Kept: nothing but the browser
tab. Replaced: the whole frame.
**Seen, not counted:** the Community page is an explore gallery (S8: card grid, Explore · Feed ·
Notifications tabs, search, Publish); a community file opens as a detail page inside the same frame
(embedded live viewer, author, stats, Remix, share, more-by); the empty files page is an empty state
with four creation modes plus template tiles; the sidebar carries an Inbox button and the switcher an
Invite action; the editor's top bar carries a presence avatar, a zoom readout and a Performance
toggle; a Toggle Timeline button implies a bottom dock that this file never showed.

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
