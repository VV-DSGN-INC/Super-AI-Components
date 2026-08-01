# Block specifications — family O

The 14 layout archetypes — **13 active** since O5 `flow-shell` was cut on 2026-07-31
([decisions.md](decisions.md) D9). Each block is a composition of L0–L3 components and doubles as
the demo that proves them.

Derived from the reference board's `App Types/Layout` strip plus the individual app-type sections —
see [reference-board-analysis.md](reference-board-analysis.md#4-layout-archetypes-extracted).

---

## O1 `home-shell` — App Home / launcher

**Regions:** sidebar · topbar · hero omnibox · feature cards · recents grid

**Filled by:** B1 `app-sidebar` · B7 `app-topbar` · C1 `hero-omnibox` · C2 `suggestion-chips` ·
C3 `feature-card-row` · C4 `recent-grid` · C5 `recommendation-card` · M2 `credits-indicator` ·
L1 `empty-state`

- The hero omnibox is above the fold and is the only emphasised element on the page. Everything else
  is a path back into existing work.
- Order is invariant across all five reference products: composer → starters → features → recents →
  inspiration.
- The whole page is C4's empty state on day one. That is the version most new users actually see.

**Evidence:** YouAI, Descript, Zapier, CapCut, Spline. The most consistent archetype on the board and completely absent from the approved spec.

## O2 `chat-shell` — chat / agent workspace

**Regions:** sidebar + task list · topbar · message stream · artifact cards · composer

**Filled by:** B1 · B6 `thread-list` · B7 · D1/D3/D4 composer family · J4 `artifact-grid` ·
N1 `feedback` · N3 `disclaimer-note` · M5 `paywall-message` · L1

- The sidebar doubles as a job queue: running tasks show spinners in B6, so background work is
  visible without leaving the thread.
- Artifacts render as cards inside the stream and open into their own surface. The conversation is an
  index, not a container.
- M5 lives in the stream, which is why monetization cannot be deferred to a late wave in this shell.

**Evidence:** Manus, Claude, ChatGPT. Composes AI Elements' conversation and message rather than reimplementing them.

## O3 `studio-shell` — creative studio editor

**Regions:** modality rail · tool panel · canvas · inspector · page strip

**Filled by:** B4 `modality-rail` · I1 `tool-panel` · B7 · I3 `context-toolbar` ·
I2 `property-inspector` · I5 `drawing-tools` · H5 `frame-strip` · E4 `preset-grid` · F1 `result-card`

- Five regions, fixed positions. Rail and inspector are the invariants; the middle three vary by what
  is being edited.
- The rail selects which tool panel is shown. It never changes the canvas — that separation is what
  keeps the shell legible.
- The inspector is selection-driven and must ship an empty state, because "nothing selected" is the
  most common state.

**Evidence:** Canva, Fotor, Simplified, Spline, Tripo.

## O4 `timeline-shell` — timeline-dominant editor · variant of O3

**Regions:** rail · content panel · preview · inspector · transport · tracks + ruler

**Filled by:** B4 · I1 · H1 `transport-controls` · H2 `time-ruler` · H3 `track-lane` ·
H4 `transcript-editor` · I2 · F6 `render-queue`

- Same five regions as O3, but the bottom dock is a time ruler with tracks instead of a page strip.
  One shell, one variant flag.
- The transcript variant (H4) replaces the track stack entirely — both are views of the same
  edit-decision list.
- Export is staged through F6: a cheap preview render precedes the expensive full export.

**Evidence:** CapCut, Descript, Topaz. The variant relationship to O3 removes an entire duplicate shell from the catalog.

## O5 `flow-shell` — node / flow canvas

> **CUT 2026-07-31** ([decisions.md](decisions.md) D9) — retained as a record.

**Regions:** palette · topbar · canvas · omnibar · tool dock · inspector

**Filled by:** G1–G9 (the whole canvas family) · D1 (omnibar, floating variant) · `useFlowRunner`

- Palette left, inspector right, dock floating bottom-centre. The dock shifts when the inspector
  opens rather than sliding beneath it.
- The omnibar is D1 in its floating variant — the canvas gets the same composer as everywhere else.
- Execution state is owned by `useFlowRunner` and rendered by G1 (animated edges) and G2 (status
  dots). The UI stays executor-agnostic.

**Evidence:** OpenAI Agent Builder, Freepik Flows, ElevenLabs Flows, LTX Studio. Strongest differentiation story with a working reference implementation to lift from.

## O6 `generation-shell` — single-purpose tool app

**Regions:** config panel · cost + Generate · topbar · result canvas

**Filled by:** E1 `generation-panel` · E2 · E3 · E4 · E5 `run-button` · A2 `cost-chip` ·
F1 · F2 · L1 · M2

- Config left, result right, Generate pinned to the bottom of the panel so it never requires
  scrolling.
- The empty right pane carries an L1 example pair (before → after). It teaches the tool faster than
  any description.
- The cheapest shell to build and the one most products ship first.

**Evidence:** Freepik apps, Tripo, Playground, getimg, Simplified. The default packaging for a single-purpose AI tool.

## O7 `library-shell` — personal archive

**Regions:** facet rail · header + search · dense grid

**Filled by:** J2 `filter-panel` · J1 `asset-library` · F2 · F3 `asset-detail` · A3 · A5 · A8 · L1

- Dense by default. This is an archive you scan, not a gallery you browse — thumbnail size is a user
  preference, not a brand decision.
- Facet counts are what make the rail usable at scale. Without them every filter click is a gamble.
- Clicking any tile opens F3, which is where the provenance contract pays off.

**Evidence:** Midjourney Organize is the reference implementation.

## O8 `explore-shell` — community gallery

**Regions:** rail · docked prompt bar · sort tabs + type pills · masonry feed

**Filled by:** J3 `explore-gallery` · D1 (docked) · A4 `choice-chips` · F3 · J6 `template-detail` · A8

- Masonry, not a grid. Community feeds are browsed for surprise, and equal-height rows suppress
  exactly that.
- The prompt bar sits above the feed so inspiration converts into a generation without a navigation
  step.
- Sort tabs and type pills are different axes and must stay as separate controls.

**Evidence:** Midjourney Explore, Spline Community, Pixlr, Canva templates. Two galleries, two jobs — a derived rule.

## O9 `artifact-shell` — artifact / document index

**Regions:** sidebar · header + filter · search · artifact card grid

**Filled by:** B1 · J4 `artifact-grid` · A5 · A3 · K1 `ai-doc-block` · L1

- Excerpts, not thumbnails. Artifacts are mostly text and their auto-generated titles are unreliable
  — the first lines are what identify them.
- Grouped by originating session, so the artifact index and the conversation history stay linked.
- Type badges double as filter facets and must be driven by the same value in both places.

**Evidence:** Claude Artifacts, Manus Library. A new archetype with no equivalent in the approved spec.

## O10 `records-shell` — project / scenario list

**Regions:** sidebar · header + create · filter + sort · record rows

**Filled by:** B1 · J5 `record-list` · A5 · J1 (folder mode) · L1 · N1

- These records execute, so the enable toggle is the primary control and belongs in the row, not
  behind an overflow menu.
- Run status in the subtitle (last run, draft, failing) is what makes the list operational rather
  than decorative.
- Distinct from O7 because the objects are runnable rather than stored — the same list layout would
  mislead.

**Evidence:** Make scenarios, Zapier zaps, n8n workflows, Spline projects.

## O11 `docs-shell` — documentation

**Regions:** icon rail · doc nav · announcement strip · content column

**Filled by:** B1 (icon rail) · B3 `sidebar-nav` · L3 `feature-announcement` (strip) ·
K6 `citation-ref` · A12 · A1

- Sectioned nav with a persistent icon rail. The rail switches product area; the nav switches page
  within it.
- The announcement strip is L3 in its dismissible-chip form, pinned above the content.
- The content column is measured for reading, not stretched to viewport width — the one place a
  max-width is non-negotiable.

**Evidence:** OpenAI docs, Lovable docs. Included because a registry needs its own docs site, and this is that shell.

## O12 `settings-shell` — full-page settings

**Regions:** search + grouped nav · breadcrumb · info callout · setting sections · code block

**Filled by:** M1 `settings-dialog` (full-page variant) · B3 (tier badges) · E7 `member-gate-row` ·
M3 `quota-meter` · M4 `pricing-table` · B8 `account-menu`

- Settings search is mandatory past about twenty settings. Grouped nav alone stops scaling exactly
  where products stop caring.
- Tier badges in the nav are a paywall placement as much as a label.
- Sections are deep-linkable. "Go to Settings → Workspace → MCP" has to be a URL.

**Evidence:** Lovable settings is the reference implementation, including tier badges and copy-ready configuration blocks.

## O13 `notebook-shell` — three-pane sources ‖ chat ‖ outputs

**Regions:** sources · chat · composer · studio outputs

**Filled by:** K5 `source-panel` · K6 `citation-ref` · D1/D3 · F1 · C3 (output types) ·
L1 × 3 · N3

- Three panes, each independently empty-able. On first load all three are empty at once — the case
  that turned the empty contract into a contract.
- Citations in the middle pane resolve into the left pane. Two ends of one mechanism, not two
  features.
- The right pane is a menu of output types, not a canvas. Choosing "Audio Overview" or "Mind Map"
  generates into that pane.

**Evidence:** NotebookLM. A genuinely distinct archetype — grounded generation with sources as first-class citizens.

## O14 `auth-shell` — sign in / sign up

**Regions:** marketing panel · provider buttons · email fallback · legal footer

**Filled by:** L6 `onboarding-wizard` (split-panel variant) · L1 · A9 (provider rows)

- UI only, no auth logic. Providers and copy are props; the shell has no opinion about your identity
  stack.
- The marketing panel is the same split layout as L6 — auth and first-run are one visual family.
- Terms and privacy links are part of the component, not an afterthought.

**Evidence:** Tripo. The one archetype with no AI content at all — see [decisions.md](decisions.md) Q4 for whether it should ship.
