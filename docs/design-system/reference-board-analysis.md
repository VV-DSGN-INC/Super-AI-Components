# Reference board analysis

**Source:** [AI Component LIst](https://www.figma.com/design/PnRO0vJFr1q9Q6Mi6VY0lr/AI-Component-LIst)
**Read:** 2026-07-28, section by section, via the Figma MCP server.

---

## 1. How the board is organised

Two orthogonal axes, and that organisation is the most valuable thing on the board:

- **App type** — Video Editor, Image Editor, Chats, Flow Builders, Node Editors, Note Editor,
  Text Editor, Presentation Apps, Coding & App Building, 3D Modeling, Lawyer/Document App.
- **Pattern type** — First Time Experience, Onboarding, Global Patterns, Sign In / Sign Up,
  plus the labelled `App Types/Layout` strip.

This is a stronger taxonomy than the approved spec's modality kits. Modality kits split things that
are the same component; app-type × pattern finds the components that recur *across* products, which
is exactly the reuse a registry needs.

## 2. The board's own Requirements frame

A frame titled `Requirements` contains six tables (A–F) defining 26 components with their shadcn
bases. It is the tightest prior articulation of this catalog, and this work keeps its discipline and
its "shadcn base" column.

| Table | Group | Items |
| ----- | ----- | ----- |
| A | Flow builder components | flow canvas · node card · node ports & edges · node settings section · inline result preview · run controls |
| B | Generation panel family | generation prompt bar · reference strip · model picker · dynamic settings controls · cost badge · balance indicator |
| C | Media & results | media gallery grid · video preview card · timeline/scrubber · audio player row |
| D | Documents & characters | AI document editor block · inline generate popup · document + chat layout · character (avatar) card |
| E | Libraries & voice | voice card + voices grid · track list / music library · TTS editor layout |
| F | Workspace | project / folder card · context-sensitive side panel · app layout shell |

The tables do not cover first-run, onboarding, auth, account/plan, or library/filtering. Those
families were derived from the board's pattern sections instead.

## 3. Products observed

| Area | Products |
| ---- | -------- |
| App Home | YouAI/MindStudio, Descript, Zapier, CapCut, Spline, Make |
| Editors | Descript, CapCut, Canva, Fotor, Simplified, Tripo 3D |
| Canvas / flow | OpenAI Agent Builder, Freepik Flows, ElevenLabs Flows, LTX Studio, an n8n-style workflow builder |
| Chat / agent | Manus, Claude |
| Library / gallery | Midjourney (Organize + Explore), Claude Artifacts, Canva templates |
| Docs / settings | OpenAI documentation, Lovable settings |
| Notebook | NotebookLM |
| Legal / document | Spellbook |
| Auth | Tripo |

## 4. Layout archetypes extracted

Fourteen distinct frames appear, not four.

| # | Archetype | Anatomy | Observed in |
|---|-----------|---------|-------------|
| S1 | **App Home / launcher** | sidebar → hero omnibox → suggestion chips → feature cards → recents grid → inspiration gallery | YouAI, Descript, Zapier, CapCut, Spline |
| S2 | **Chat / agent workspace** | sidebar (new task, nav, projects, task list) → thread → artifact cards → composer | Manus, Claude |
| S3 | **Studio editor** | modality rail → content panel → canvas → inspector → page/artboard strip | Canva, Fotor, Simplified |
| S4 | **Timeline editor** | as S3 but timeline-dominant; transcript-as-timeline variant | CapCut, Descript |
| S5 | **Node / flow canvas** | palette → canvas → inspector → run controls → omnibar → tool dock | Agent Builder, Freepik, ElevenLabs, LTX |
| S6 | **Generation workspace** | config panel (left) → result canvas (right) → cost + Generate | Freepik apps, Tripo, Playground |
| S7 | **Library / archive** | faceted filter rail → dense grid → detail lightbox | Midjourney Organize |
| S8 | **Explore gallery** | masonry → sort tabs → type pills → docked prompt bar | Midjourney Explore |
| S9 | **Artifact / document index** | search → filter → card grid grouped by session | Claude Artifacts, Manus Library |
| S10 | **Project / scenario list** | header CTA → filter + sort → rows with meta, toggle, overflow | Make, Spline |
| S11 | **Documentation** | icon rail → sectioned doc nav → content column → announcement strip | OpenAI docs |
| S12 | **Settings** | settings search → grouped nav with tier badges → content sections | Lovable |
| S13 | **Notebook (3-pane)** | sources ‖ chat ‖ studio outputs, each independently empty-able | NotebookLM |
| S14 | **Auth** | split marketing panel ‖ provider buttons + email + legal footer | Tripo |

**S3 and S4 are one shell with a variant**, not two. The difference is whether the bottom dock is a
page strip or a time ruler.

## 5. Pattern families extracted

### First Time Experience

Empty states, coach marks with and without a spotlight scrim, explanation popups, hotkeys/controls
primers, intro modals. Observed: CapCut yellow coach marks with step counters, Airtable Omni inline
announcement card, Tripo "View Your Model" controls primer, Pixlr What's New, Claude Cowork intro.

**Key finding:** NotebookLM ships three simultaneously-empty panes on first load. Empty states are
the default view of an AI product, not an edge case. This became the Empty contract.

### Onboarding

Role-survey steps with icon choice cards and dot progress (ElevenLabs), split-panel marketing intros
(Claude), multi-step setup wizards. All skippable, all with visible progress.

### Global Patterns

Generate popup (stepper dialog), input/recipe popup (Zapier recommendation detail), loading,
settings popup (Playground), select-with-preview (Freepik skills menu), user account dropdown with a
nested appearance submenu (Lovable), plan/upgrade popup (Spline), asset detail lightbox
(Playground/Midjourney), template detail (Canva), trust/confirm dialog (v0).

**Key finding:** the paywall is never only a billing page. It appears in-stream inside a chat
(Freepik agent), as a locked settings row with a tier badge (Tripo), as insufficient credits on the
Run button, and as a sidebar promo card. This became the observation that monetization is a *state*
on components in early waves, not a late-wave kit.

### Sign In / Sign Up

Split marketing panel + provider buttons + email fallback + legal footer (Tripo). One archetype with
no AI content at all — flagged as an open question.

## 6. Anatomy extracted per app type

### Video editors (Descript, CapCut)

Transcript-driven editing where deleting a word deletes the frames; modality rail; content panel with
search → curated sections → grid; canvas with floating selection toolbar; right inspector with
grouped property sections and per-row reset/keyframe controls; bottom timeline with ruler, playhead,
filmstrip/waveform/text/adjustment tracks; transport with timecode.

### Image editors / design tools (Canva, Fotor, Simplified)

Same shell as video, page/artboard strip instead of a timeline. Drawing tool rails with shape
flyouts, brush size/hardness/opacity, swatch grids. AI generation panel embedded as one rail item
with its own model picker, filter presets, and generation count.

### Flow / node builders (Agent Builder, Freepik, ElevenLabs, LTX)

Node palette grouped semantically (Core / Tools / Logic / Data); nodes with a header carrying type +
model + status, a body slot, and a footer model bar with a Run split-button; typed ports coloured by
payload type; right inspector driven by forms; floating tool dock bottom-centre; canvas omnibar.

### Chat / agent (Manus, Claude)

Sidebar that doubles as a job queue with running spinners; artifact cards inline in the stream;
composer with mode tabs, attachments and model select; feedback capture under responses;
disclaimer note under the composer; paywall cards inside the message stream.

### Libraries and galleries (Midjourney)

Two distinct surfaces: a dense faceted personal archive (filter rail with counts, saved searches,
view options) and a masonry community explore feed (sort tabs, type pills, docked prompt bar).

### 3D (Tripo)

Left generate panel with mode tabs, upload dropzone, collapsible settings, members-only rows with
tier badges, privacy select, model card and a Generate button carrying its cost; centre viewport with
a floating reference window and a topology/faces/vertices readout; right assets panel with an upgrade
promo above the grid.

### Documentation and settings (OpenAI docs, Lovable)

Icon rail + sectioned doc nav + measured content column + dismissible announcement strip. Settings:
search, grouped nav with Business/Enterprise tier badges, info callouts, copy-ready code blocks,
tabbed per-client instructions.

### Notebook (NotebookLM)

Three panes — sources, chat, studio outputs — each with its own empty state, and inline citations
that resolve back into the sources pane.

## 7. What the board added that the approved spec lacks

- The entire **first-run family**: empty states, coach marks, what's-new, onboarding wizard
- **Auth** and **settings** as archetypes, and the **account menu**
- The **home/launcher family**: hero omnibox, feature card rows, recents grid, recommendation cards
- **Five primitives** nobody had named: `preview-tile`, `entity-row`, `stat-readout`,
  `reset-affordance`, `section-header`
- New archetypes: **artifact index**, **project/record list**, **notebook**, **documentation**
- Two new contracts: **Empty** and **Provenance**
