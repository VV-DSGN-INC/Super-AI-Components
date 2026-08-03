# Catalog

**114 active items: 12 primitives · 89 components · 13 blocks.** Family G (canvas & nodes, incl.
the headless `useFlowRunner`) and O5 `flow-shell` were **cut 2026-07-31** — see
[decisions.md](decisions.md) D9; their tables remain below, marked, as a record. Eight components
were **restored 2026-08-02** (D12) from the gaps analysis. Per-component requirements are in
[component-specs.md](component-specs.md) and [block-specs.md](block-specs.md).

`NEW` = not in the approved spec. `KEEP` = already shipped. `RESTORED` = re-added by D12 from
[gaps.md](gaps.md) §2–3.

> **The catalog is not final.** D12 chose to broaden the reference sampling rather than narrow the
> positioning. Families J, K and N — and any new family the second board produces — should not be
> treated as closed until the re-sampling is done. Families A, B, C and D are unaffected.
>
> **Re-sampling status (D14, 2026-08-03):** one slice done — enterprise assistants and tool-calling
> agents ([agent-board-analysis.md](agent-board-analysis.md)), which added K7–K8 and N9–N12 and
> produced the **Dialog** contract. K and N are correspondingly further along; J is untouched. Voice,
> extraction, vision, data and coding remain unsampled, so this note still stands for them.

---

## A · Primitives (L2) — 12

| # | Name | Purpose | Key states / variants | shadcn base |
|---|------|---------|-----------------------|-------------|
| A1 | `kbd` `KEEP` | Keycap chip | single · combo · sequence | Kbd |
| A2 | `cost-chip` `KEEP` | Per-action credit cost | estimate · confirmed · insufficient · rate form | Badge, Tooltip |
| A3 | `date-section` `KEEP` | Date-grouped section header | with/without count · collapsible | — |
| A4 | `choice-chips` `KEEP` | Ring-selected chip group | numeric · text · preview-content; single/multi; disabled; loading | Toggle-group |
| A5 | `filter-bar` `KEEP` | Category chips + add-filter + filters button | applied chips · overflow count · clear-all | Button, Badge |
| A6 | `field-row` `KEEP` | Label + control row; the inspector DNA | slider+unit · select · toggle · colour · xy-pair | Label, Slider, Select, Switch |
| A7 | `gen-settings-bar` `KEEP` | Model · aspect · resolution · duration · batch strip | inline · compact · node-docked | Select, Toggle-group |
| A8 | `preview-tile` `NEW` | Thumbnail + label tile; the atom of every picker and grid | image/video/colour/text/3D · selected · locked · loading · failed | Aspect-ratio, Skeleton |
| A9 | `entity-row` `NEW` | Icon + title + description row | plain · selectable · with-badge · with-chevron · with-switch · disabled | Item |
| A10 | `stat-readout` `NEW` | Compact key→value metadata | 2-col grid · inline rows · missing-value em-dash | — |
| A11 | `reset-affordance` `NEW` | The ↺ / ◇ beside every editable value | modified · at-default · keyframed · group-level · modified-dot | Button, Tooltip |
| A12 | `section-header` `NEW` | Group title + action + count + collapse | plain · with-action · with-count · collapsible | Collapsible |

## B · App shell & navigation — 8

| # | Name | Purpose | Key states / variants | shadcn base |
|---|------|---------|-----------------------|-------------|
| B1 | `app-sidebar` | Assembled product sidebar | expanded · icon-rail · mobile-drawer | Sidebar |
| B2 | `workspace-switcher` | Avatar/logo + name dropdown | workspace · multi-product with description rows | Dropdown-menu, Avatar |
| B3 | `sidebar-nav` | Sectioned icon+label nav | count badge · tier badge · unread dot · running spinner · pinned group | Sidebar, Badge |
| B4 | `modality-rail` `NEW` | Vertical icon+label tool switcher for editors | 8–14 items · overflow · active · badge · bottom-pinned | Toggle-group, Tooltip |
| B5 | `promo-card` | Sidebar CTA card | upgrade · invite/refer · update-available · quota warning | Card |
| B6 | `thread-list` `KEEP` | Date-grouped conversations/tasks | pin · inline rename · delete-confirm · active · unread · running | Sidebar, Dropdown-menu |
| B7 | `app-topbar` `NEW` | Breadcrumb + title + status + actions | document context · editor context; privacy chip; saved-state | Breadcrumb, Button-group |
| B8 | `account-menu` `NEW` | Avatar menu with nested appearance submenu | theme radio · background swatches · shortcut hints | Dropdown-menu, Radio-group |

**Dropped from the spec:** `chat-header` (absorbed by B7), `credits-indicator` (moved to M2).

## C · Home & launcher — 5

| # | Name | Purpose | Key states / variants | shadcn base |
|---|------|---------|-----------------------|-------------|
| C1 | `hero-omnibox` `NEW` | The centred "What can I help you with?" prompt | idle · focused · generating · locked; mode tabs, attach, model, submit | Textarea, Button |
| C2 | `suggestion-chips` | Task starter chips | plain · with-icon · with-thumbnail · overflow link | composes `@ai-elements/suggestion` |
| C3 | `feature-card-row` `NEW` | "Popular features" / "Start from scratch" | icon+title+desc · with-thumbnail · horizontal-scroll | Card, Carousel |
| C4 | `recent-grid` `NEW` | Recent projects with thumbnails | grid/list · duration badge · edited-ago · in-grid empty · hover actions | Card, Aspect-ratio |
| C5 | `recommendation-card` `NEW` | "Recommended for you" with apps + steps | collapsed row · expanded detail · dismissible · save-for-later | Card, Dialog |

## D · Composer & context — 7

| # | Name | Purpose | Key states / variants | shadcn base |
|---|------|---------|-----------------------|-------------|
| D1 | `media-prompt-bar` | The media-gen omnibox | floating · docked · node-embedded · locked · negative-prompt | Textarea, Button-group |
| D2 | `reference-strip` `NEW` | Typed attachment slots above the prompt | empty · filled; roles: reference / first frame / last frame / video ref / character | Aspect-ratio |
| D3 | `context-chips` | Removable entity/range/file references | file · selection · url · @-mention · overflow; resolved/resolving/unresolved | Badge |
| D4 | `mode-tabs` `NEW` | Ask/Design/Build · Chat/Cowork · Standard/Director | 2–5 modes · with-icon · with-tooltip | Toggle-group |
| D5 | `quote-reply` | Select content → quoted block in composer | text range · image region · table cell · timeline range | Card |
| D6 | `skill-menu` `NEW` | Select-with-preview menu of agent skills | search · hover preview · new-skill footer | Command, Popover |
| D7 | `slot-summary` `NEW` | What the system understood, before it acts | per-slot source (stated · inferred · defaulted · retrieved) · low-confidence flag · correct in place · missing · confirm/act | A9, Badge |

## E · Generation & parameters — 10

| # | Name | Purpose | Key states / variants | shadcn base |
|---|------|---------|-----------------------|-------------|
| E1 | `generation-panel` | The left config column of a tool app | dropzone → directions → presets → settings → cost + Generate | Card, Collapsible |
| E2 | `model-picker` | Choose a model; drives dynamic settings | dropdown · expanded-cards · node-inline; price, capability, runtime badges | Select, Popover, Card |
| E3 | `parameter-panel` | Generation params with plain-language ends | slider+unit · segmented · tabbed · reset-all · inline education | Field, Slider, Tabs |
| E4 | `preset-grid` `NEW` | Visual preset chooser with labelled thumbnails | style · palette · filter · environment · avatar; single/multi; see-more | built on A8 |
| E5 | `run-button` | Trigger + cost + progress in one control | idle · estimating · running · done · failed · insufficient-credits · locked | Button, Progress |
| E6 | `generation-queue` | Pending slots with progress | queued · running % · done · failed · cancel | Skeleton, Progress |
| E7 | `member-gate-row` `NEW` | Feature row locked behind a plan | locked+badge · unlocked · trial-available · inline upsell | Switch, Badge |
| E8 | `generation-wizard` `NEW` | Multi-step generate dialog | stepper · preview pane · Skip / Back / primary | Dialog, Tabs |
| E9 | `tts-composer` `RESTORED` | Script editor with per-segment voice, emotion, speed | per-segment regenerate · segment select · whole-script play | Textarea, A6 |
| E10 | `voice-clone-recorder` `RESTORED` | Guided sample recording | prompt script · level metering · retake · consent capture | Progress, Alert-dialog |

**Consolidation:** E1–E5 replace the spec's `style-picker`, `palette-picker`, `tone-selector`,
`shot-controls`, `music-brief` and `brush-controls`.

## F · Results & assets — 7

| # | Name | Purpose | Key states / variants | shadcn base |
|---|------|---------|-----------------------|-------------|
| F1 | `result-card` `NEW` | One generated asset, anywhere it appears | image/video/audio/text/3D · idle · streaming · done · failed · locked | Card, Aspect-ratio |
| F2 | `generation-grid` | Batch gallery of results | date sections · density · select-mode · empty | F1 + A3 |
| F3 | `asset-detail` `NEW` | Lightbox: media + provenance rail | prompt with highlighted spans · params grid · Copy/Remix/Edit · more-like-this | Dialog, A10 |
| F4 | `action-stack` `NEW` | Cross-tool handoff on a result | Extend → Upscale → Use in Lip sync; cost per action | Dropdown-menu, A9 |
| F5 | `compare-viewer` | Labelled panes | side · single · wipe; synced zoom and transport | Resizable |
| F6 | `render-queue` | Staged jobs: inputs → preview → export | per-row spec · progress · retry · cancel · download | Table, Progress |
| F7 | `approval-card` | Single-artifact approval | Confirm · Edit · Regenerate · Skip; submitting; resolved with undo | Card, Button-group |

## G · Canvas & nodes — CUT 2026-07-31

> **Cut from scope** ([decisions.md](decisions.md) D9). Not registry items; table kept as a record.
> Working code is parked unmerged on `wave-2-flow-foundation`.

| # | Name | Purpose | Key states / variants | shadcn base |
|---|------|---------|-----------------------|-------------|
| G1 | `flow-canvas` | Pan/zoom surface | empty · populated · selecting · connecting · running | extends `@ai-elements/canvas` |
| G2 | `ai-node` | One node | header + body slot + footer; idle/running/done/failed/locked; collapsed | Card |
| G3 | `typed-handle` + `typed-edge` | Ports and the lines between them | valid · invalid · dangling · selected · animated-while-running · type-coloured | — (new) |
| G4 | `node-prompt` | Prompt field inside a node | idle · generating · @-mention chips · reference thumbnails · unresolved | Textarea |
| G5 | `node-result` `NEW` | Inline output preview in a node | image · video+audio · audio · text · empty · failed | wraps F1 |
| G6 | `model-bar` | Node-docked A7 | model select · toggles · duplicate · delete · overflow · Run split-button | Button-group |
| G7 | `node-palette` | Add-node catalog | grouped · searchable · popover vs docked rail · drag-to-canvas · insert-on-edge | Command, Popover |
| G8 | `canvas-toolbar` `NEW` | Floating tool dock + view controls | select/pan/comment · add-by-type · zoom · fit · undo/redo | Button-group |
| G9 | `node-inspector` | Right panel for the selected node | grouped form sections · schema editor · delete · empty when nothing selected | A6, Collapsible |
| — | `useFlowRunner` | **Headless.** Topological execution, per-node status, cancellation | executor-swappable; no UI | — |

**Consolidation:** the spec's 10 modality node presets become demo recipes on G2, not registry items.

## H · Timeline & transport — 7

| # | Name | Purpose | Key states / variants | shadcn base |
|---|------|---------|-----------------------|-------------|
| H1 | `transport-controls` | Play / skip / speed / elapsed | simple · frame-accurate (timecode, frame-step, in/out) | Button-group |
| H2 | `time-ruler` `NEW` | Scrubbable ruler + playhead | zoom levels · snap · in/out range · scrubbing | Slider (heavily extended) |
| H3 | `track-lane` `NEW` | One timeline track | filmstrip · waveform · text · adjustment; mute · lock · trim handles | — |
| H4 | `transcript-editor` | Edit media by editing text | word-level select · speaker labels · inline media chips · strikethrough | — |
| H5 | `frame-strip` `NEW` | Keyframe / page / artboard strip | video frames · slide pages · in/out picker · add · reorder | built on A8 |
| H6 | `waveform-editor` `RESTORED` | Sample-level audio editing | region select · zoom to sample · scrub · region actions | — |
| H7 | `stem-mixer` `RESTORED` | Per-stem lanes with mute/solo/volume/pan | exclusive vs additive solo · live meters · stem lineage | Slider, Progress |

**Dropped:** `timeline-editor` as a monolith — it is H1 + H2 + H3 composed, which makes it a block.

## I · Editor surfaces — 5

| # | Name | Purpose | Key states / variants | shadcn base |
|---|------|---------|-----------------------|-------------|
| I1 | `tool-panel` | The content panel beside the canvas | search → curated sections → grid → docked prompt; tabs | A12, A8 |
| I2 | `property-inspector` | Object styling rows | per element type; grouped sections; group + row reset; empty state | A6, A11 |
| I3 | `context-toolbar` | Selection-following floating toolbar | text · image · shape · media; overflow; AI entry first | Toolbar |
| I4 | `ai-tools-menu` | Object-scoped AI actions | grouped rows with cost chips | A9 |
| I5 | `drawing-tools` `NEW` | Tool + shape flyouts | tool rail · shape rail · size/hardness/opacity · swatch grid · mask mode | Toggle-group, Popover |

## J · Library, filtering & discovery — 7

| # | Name | Purpose | Key states / variants | shadcn base |
|---|------|---------|-----------------------|-------------|
| J1 | `asset-library` | Header actions, search, chips, list/grid, folders | file · folder · mixed · empty · selection mode | Table, Toggle-group |
| J2 | `filter-panel` | Faceted rail | checkbox groups with counts · see-more · collapsible · saved searches · view options | Checkbox, Collapsible |
| J3 | `explore-gallery` | Masonry community feed | sort tabs · type pills · infinite · docked prompt | — |
| J4 | `artifact-grid` `NEW` | Document/artifact cards grouped by session | type badge · excerpt · edited-ago · view count · privacy icon | Card |
| J5 | `record-list` `NEW` | Project / scenario rows | app-icon cluster · meta · enable toggle · run status · overflow | Table, Switch |
| J6 | `template-detail` `NEW` | Template preview modal | preview + thumbnail strip · option selects · author + follow · more-like-this | Dialog, Carousel |
| J7 | `track-list` `RESTORED` | Music library rows | artwork · tags · inline waveform · BPM · key | Table |

## K · Documents & knowledge — 8

| # | Name | Purpose | Key states / variants | shadcn base |
|---|------|---------|-----------------------|-------------|
| K1 | `ai-doc-block` | Generated text block inside a document | streaming · editable · re-promptable · Keep/Edit/Regenerate/Discard | Card, Textarea |
| K2 | `inline-generate-popup` | Click empty space → prompt popover | idle · generating · cancel | Popover, Textarea |
| K3 | `diff-review` | Track changes with per-change rationale | word-level · per-change accept/reject · accept-all/reject-all | — |
| K4 | `selection-toolbar` | The ✨ menu on selected text | improve · shorten · expand · tone submenu · custom prompt | I3 |
| K5 | `source-panel` `NEW` | Ingested sources with pipeline status | parsing → chunking → embedding → ready/failed; chunk counts; empty | A9, Progress |
| K6 | `citation-ref` `NEW` | Inline citation → source popover | resolved · loading · unresolved; jump-to-source; copy quote | Hover-card |
| K7 | `answer-block` `NEW` | Grounded answer with citations at the claim | streaming · cited · partially-cited · uncited-warning; retrieved-but-uncited shown | K6, A9 |
| K8 | `source-cards` `NEW` | The retrieved set behind an answer | ranked · relevance shown · used vs retrieved-unused · permission-filtered · empty | Card, A10 |

**Dropped:** `rewrite-panel`, `outline-builder`, `inline-suggestion`, `chunk-highlighter`,
`memory-viewer` — single-product patterns. `retrieval-inspector` was dropped by the approved spec and
returns as K8 `source-cards`, its user-facing form (D16).

## L · First-run & onboarding — 6 · all NEW

| # | Name | Purpose | Key states / variants | shadcn base |
|---|------|---------|-----------------------|-------------|
| L1 | `empty-state` | The canonical nothing-here surface | page · panel · in-grid; illustration / icon / example-pair | Empty |
| L2 | `coach-mark` | Anchored product-tour tooltip | with/without scrim spotlight · step counter · Next/Done/Skip · arrow flip | Popover |
| L3 | `feature-announcement` | New-feature surface | modal · anchored popover · inline card · dismissible chip; stage badges | Dialog / Popover / Card |
| L4 | `whats-new` | Changelog browser | entry list ‖ detail; unread markers; per-entry CTA | Dialog |
| L5 | `shortcuts-sheet` `KEEP` | Shortcuts cheatsheet | sectioned · searchable · pinned header · controls-primer variant | Dialog, A1 |
| L6 | `onboarding-wizard` | Multi-step first-run survey / setup | question + choice cards · dot progress · Back/Skip · split-panel variant | Card, Progress |

## M · Account, plan & monetization — 7

| # | Name | Purpose | Key states / variants | shadcn base |
|---|------|---------|-----------------------|-------------|
| M1 | `settings-dialog` `NEW` | Nav ‖ sections settings surface | dialog · full-page; toggle rows; destructive rows; tier-badged nav | Dialog, Sidebar, Switch |
| M2 | `credits-indicator` | Persistent balance | ring · counter · low · empty · with top-up; hover detail | Badge, Progress |
| M3 | `quota-meter` | Plan usage + reset countdown | per-resource rows · near-limit · over-limit · sidebar compact | Progress |
| M4 | `pricing-table` | Billing toggle + plan cards | monthly/yearly + save badge · grouped feature lists · add-on row with switch | Card, Toggle-group |
| M5 | `paywall-message` `NEW` | Upgrade card inside a result or message stream | locked-model · quota-exhausted · feature-locked | Card |
| M6 | `rate-limit-banner` | Cooldown countdown | your-limit · provider-capacity · live countdown · notify-me | Alert |
| M7 | `connection-manager` `RESTORED` | BYO keys and local models | not-set · valid · invalid · unreachable; test-connection; download + hardware reqs | Card, Input |

## N · Feedback, trust & observability — 12

| # | Name | Purpose | Key states / variants | shadcn base |
|---|------|---------|-----------------------|-------------|
| N1 | `feedback` | Thumbs / stars + reason popover | idle · rating · submitted with undo | Popover, Button-group |
| N2 | `trust-dialog` `NEW` | Confirm running third-party content | preview · warning · trust checkbox · Continue split-button with account picker | Alert-dialog, Checkbox |
| N3 | `disclaimer-note` `NEW` | "AI can make mistakes" footnote | under-composer · in-card · inline | — |
| N4 | `trace-timeline` | Waterfall of steps / tool calls / LLM calls | collapsed · expanded · errored · retries as siblings | Collapsible |
| N5 | `run-inspector` | Span detail: I/O, tokens, cost, errors | input · output · metadata · error tabs | Tabs, A10 |
| N6 | `usage-dashboard` | Aggregate cost / token / latency | period select · summary cards with deltas · per-model breakdown | Chart, Card |
| N7 | `env-status` `RESTORED` | Per-provider reachability | ok · degraded · key-invalid · not-running | Badge, A9 |
| N8 | `permission-prompt` `RESTORED` | Agent asks before a side effect | allow once · always allow · deny · **edit-first** (equal weight, D16) | Alert-dialog |
| N9 | `autonomy-selector` `NEW` | How much the agent may do unasked | ask every time · auto-approve reads · full auto; per-tool override; **grant list with revoke**; effective mid-run | Radio-group, A9 |
| N10 | `safety-block` `NEW` | A request or response stopped by policy | input-blocked · output-blocked; policy named; triggering fragment quoted; sensitive-content blur; appeal/reroute | Alert |
| N11 | `escalation-handoff` `NEW` | Agent hands the conversation to a person | triggered (user · budget-exhausted · low-confidence · policy) · packet preview · queued with wait estimate · accepted · unavailable | Card, A10, A12 |
| N12 | `task-tray` `NEW` | Work that outlives the view that started it | running · needs-input · done · failed; per-task cancel; opt-in completion notification; empty | Sheet, A9 |

**Dropped:** `agent-board`, `eval-board`, `model-compare`, `response-diff`, `review-queue` —
single-product patterns on this board.

N9–N12 enter by D16 via [agent-board-analysis.md](agent-board-analysis.md), not by the primary
board. N10 and the `slot-summary` candidate carry a ⚠ in that doc: their counts rest on framework
documentation rather than observed pixels, and must be verified against the running products before
their specs are treated as settled. `slot-summary` passed at 3 but is **held** — it is the surface
the Dialog contract governs, and it waits for the contract's first consumer.

## O · Blocks (L4) — 14

| # | Name | Archetype |
|---|------|-----------|
| O1 | `home-shell` | App Home / launcher |
| O2 | `chat-shell` | Chat / agent workspace |
| O3 | `studio-shell` | Creative studio editor |
| O4 | `timeline-shell` | Timeline-dominant editor (variant of O3) |
| O5 | ~~`flow-shell`~~ | Node / flow canvas — cut (D9) |
| O6 | `generation-shell` | Single-purpose tool app |
| O7 | `library-shell` | Personal archive |
| O8 | `explore-shell` | Community gallery |
| O9 | `artifact-shell` | Artifact / document index |
| O10 | `records-shell` | Project / scenario list |
| O11 | `docs-shell` | Documentation |
| O12 | `settings-shell` | Full-page settings |
| O13 | `notebook-shell` | Three-pane sources ‖ chat ‖ outputs |
| O14 | `auth-shell` | Sign in / sign up |

---

## Totals

| Family | Count |
| ------ | ----- |
| A — Primitives (L2) | 12 |
| B — App shell & navigation | 8 |
| C — Home & launcher | 5 |
| D — Composer & context | 7 |
| E — Generation & parameters | 10 |
| F — Results & assets | 7 |
| G — Canvas & nodes | ~~9 + `useFlowRunner` = 10~~ 0 · cut (D9) |
| H — Timeline & transport | 7 |
| I — Editor surfaces | 5 |
| J — Library, filtering & discovery | 7 |
| K — Documents & knowledge | 8 |
| L — First-run & onboarding | 6 |
| M — Account, plan & monetization | 7 |
| N — Feedback, trust & observability | 12 |
| **B–N subtotal (L3)** | **89** (88 after D16, 82 before it, 74 before D12, 84 before D9) |
| O — Blocks (L4) | 13 (O5 cut) |
| **Total registry items** | **114** (113 after D16, 107 before it, 99 before D12, 110 before D9) |

The Figma boards still carry the G-family and `flow-shell` cards — drawn before the D9 cut, kept
as records. (`useFlowRunner` was headless with no wireframe, which is why column 4 carries 109
cards.)

See [decisions.md](decisions.md) for what changed against the approved spec.
