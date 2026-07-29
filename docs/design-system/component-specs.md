# Component specifications — families A–N

Per-component design requirements. Each entry: purpose, the design rules that matter, and the
evidence from the reference board.

Summary tables are in [catalog.md](catalog.md). Blocks are in [block-specs.md](block-specs.md).
Wireframes for every entry are on the working board, column 4 — see
[figma-board-map.md](figma-board-map.md).

---

# A · Primitives (L2)

## A1 `kbd` — keycap chip
**Base:** Kbd · **Variants:** single · combo · sequence

- Platform-aware: callers pass semantic keys (`mod`), and the chip renders ⌘ on macOS, Ctrl
  elsewhere. Never pass glyphs in.
- Combo joins with a hairline `+`; sequence joins with the word "then". The distinction is meaningful
  and has to survive.
- Sizes to the type scale around it, so a keycap in a menu row and one in a cheatsheet are the same
  component.

**Evidence:** Pro tools earn keyboard UI — a cheatsheet is table stakes. Descript, CapCut, Spline, Playground.

## A2 `cost-chip` — per-action spend
**Base:** Badge, Tooltip · **States:** estimate · confirmed · insufficient · rate form

- Unit-agnostic: credits, GPU-minutes, tokens. The unit is a prop, because AI pricing is quota
  pricing, not seat pricing.
- Estimates recompute as settings change. A cost chip that goes stale is worse than showing no cost.
- `insufficient` is the handoff to M5 and E5 — same numbers, three surfaces, one source of truth.

**Evidence:** Cost disclosure appears in exactly three forms: persistent ring (Freepik, Tripo), per-action chip (ElevenLabs), pre-action line (Playground).

## A3 `date-section` — the universal grouper
**Variants:** with/without count · collapsible

- Relative buckets first (Today / Yesterday / Last 7 days / Older); absolute dates only past the
  relative window.
- The header is sticky within its scroll container — you must always be able to tell which bucket you
  are reading.
- Count and collapse are optional slots; the four consumers each use a different combination.

**Evidence:** Threads (Manus, Claude), generations (Midjourney), artifacts, scenario lists (Make).

## A4 `choice-chips` — ring-selected chip group
**Base:** Toggle-group · **Content:** numeric · text · preview-content

- Single- and multi-select from one component. Role switches between radio and checkbox, and
  `aria-checked` follows — it is not decorative.
- Selection is a ring drawn outside the chip so switching selection never reflows the row.
- `preview-content` chips embed A8. This is the seam where A4 and E4 `preset-grid` meet.

**Evidence:** Visual parameters get visual pickers, never dropdowns: Midjourney styles, CapCut filters, Freepik presets.

## A5 `filter-bar` — category chips + add-filter + filters button
**Base:** Button, Badge

- Remove buttons are siblings of the chip label, not nested inside it — assistive tech needs two
  distinct targets per chip.
- Fully controlled: the bar owns no filter state, it renders what it is handed and reports intent.
- Overflow collapses to a count (`+3`), never a horizontal scroll that hides applied filters.
- Past roughly six facets, escalate to J2 `filter-panel`.

**Evidence:** Filtering has a scale ladder: chips (CapCut, Claude Artifacts, Canva) → faceted rail (Midjourney Organize).

## A6 `field-row` — the inspector DNA
**Base:** Label, Slider, Select, Switch · **Controls:** slider+unit · select · toggle · colour · xy-pair

- Label · control · unit · reset are four slots on one grid, so every inspector in the system aligns
  to the same columns.
- Numeric inputs carry their unit as a suffix inside the field (%, s, ×, px) — never as separate
  label text.
- A11 `reset-affordance` is the optional trailing slot. It is what makes a row feel bound to a value.

**Evidence:** CapCut, Canva, Spline and Tripo all ship this row. After `preview-tile`, the highest-reuse primitive.

## A7 `gen-settings-bar` — model · aspect · resolution · duration · batch
**Base:** Select, Toggle-group · **Presentations:** inline · compact · node-docked

- Segments are model-derived. An image model removes duration; a video model adds it. The bar is
  never hand-configured per surface.
- Changing any segment re-estimates cost, which is why A2 lives inside the bar rather than beside it.
- G6 `model-bar` is this component with a Run split-button appended — one engine, two presentations.

**Evidence:** CapCut, Freepik, ElevenLabs Flows, Playground and Tripo all ship a variant of exactly this.

## A8 `preview-tile` — the load-bearing primitive
**Base:** Aspect-ratio, Skeleton · **Content:** image · video · colour · text · 3D ·
**States:** default · selected · locked · loading · failed

- One aspect-ratio wrapper, one label slot, one badge slot. Content is a children slot — the
  primitive never knows what it holds.
- The selection ring is drawn outside the box, so selecting never reflows the grid. This is why it is
  a ring and not a border.
- `locked` / `loading` / `failed` replace the content, never the frame. Grid geometry stays stable.

**Evidence:** Eleven consumers across six families. Prototype before anything else — see [decisions.md](decisions.md) Q5.

## A9 `entity-row` — icon + title + description
**Base:** Item · **Variants:** plain · selectable · with-badge · with-chevron · with-switch · disabled

- Icon · title · description · trailing slot. The trailing slot takes a badge, chevron, switch or
  cost chip without changing the row grid.
- Description is optional but row height is not — a menu of mixed rows must not look ragged.
- Six consumers: `skill-menu`, `ai-tools-menu`, `action-stack`, `sidebar-nav`, `source-panel`,
  `recommendation-card`.

**Evidence:** After the card, the most-repeated pattern on the board. Manus skills, Freepik AI tools, Zapier starters, Tripo settings, Lovable connectors.

## A10 `stat-readout` — compact key→value metadata
**Presentations:** 2-col grid · inline rows

- Two presentations of one component. Column count is a prop, not a fork.
- Values are copyable. Seed and sampler exist so a result can be reproduced — the entire point of the
  provenance contract.
- Missing values render as an em-dash, never a blank cell, so the absence is deliberate.

**Evidence:** Midjourney, Playground and Freepik all attach seed, sampler, guidance and model to the asset — the recipe-card pattern.

## A11 `reset-affordance` — the ↺ / ◇ beside every editable value
**Base:** Button, Tooltip · **States:** modified · at-default · keyframed · group-level · modified-dot

- Three states share one slot: modified (reset active), default (dimmed or absent), keyframed
  (diamond, animatable).
- Group-level reset sits on the section header and clears every row beneath it — same component,
  larger scope.
- On a collapsed group it degrades to a modified-dot, so a hidden section still signals changes.

**Evidence:** CapCut, Canva, Spline and Tripo. Without it, reset becomes a context menu nobody finds.

## A12 `section-header` — group title + action + count + collapse
**Base:** Collapsible

- Title · count · action · collapse are four optional slots on one baseline, so stacked sections read
  as a consistent rhythm.
- "View all" is a link, never a button — it navigates, it does not act. Holds across all five
  consumers.
- The collapsible variant owns its disclosure state; the panel below is a slot it knows nothing about.

**Evidence:** Every tool panel on the board is a stack of these — CapCut, Canva, Fotor, Simplified, Spline.

---

# B · App shell & navigation

## B1 `app-sidebar`
**Base:** shadcn Sidebar · **Widths:** expanded · icon-rail · mobile-drawer

- Owns arrangement (switcher, nav, promo, footer), not sidebar mechanics.
- Three widths are one component, not three.
- Every slot is optional: the docs shell uses switcher + nav only; the studio shell swaps nav for B4.

**Evidence:** Descript, Zapier, Spline, CapCut, Manus, Midjourney — six products, one arrangement.

## B2 `workspace-switcher`
**Base:** Dropdown-menu, Avatar · **Flavours:** workspace list · multi-product with descriptions

- Two flavours from one component: a checked list, or A9 rows with descriptions.
- The trigger shows current context plus its plan. That plan badge is the cheapest upgrade prompt in
  the shell.
- Creation is always last, below a rule — never a plus icon competing with the trigger.

**Evidence:** Descript, CapCut, Spline, Make, Lovable. First element in every sidebar on the board.

## B3 `sidebar-nav`
**Base:** Sidebar, Badge · **Trailing slot:** count · tier badge · unread dot · running spinner · external-link

- Section labels are A12 at its smallest size, not a bespoke caption style.
- Tier badges are the cheapest paywall in the shell: they show what exists without hiding it.
- Active state is a filled row, not a left border — borders break when the sidebar collapses.

**Evidence:** Lovable settings, Spline, Descript, Manus.

## B4 `modality-rail` `NEW`
**Base:** Toggle-group, Tooltip

- Eight to fourteen items, icon over label, with an overflow chevron rather than a scrollbar in a
  92px column.
- The badge slot carries "New" dots and crown/Pro marks — the rail is where products advertise
  features you have not bought.
- Bottom-pinned items (settings, plugins, help) are a separate group so the scrollable middle never
  swallows them.

**Evidence:** CapCut, Canva, Fotor, Simplified, Tripo, Spline. The defining element of the studio shell.

## B5 `promo-card`
**Base:** Card · **Flavours:** upgrade · invite/refer · update-available · quota warning

- Four flavours, one component. The art slot is optional in all of them.
- Always dismissible, and dismissal must persist. A CTA that returns every session reads as a bug.
- The only paywall placement not attached to an action, which is why it is the only ambient one.

**Evidence:** Descript, Spline, Zapier, Claude, Manus.

## B6 `thread-list` `SHIPPED`
**Base:** Sidebar, Dropdown-menu

- Rename commits on blur as well as Enter. Losing a rename because you clicked away is the most
  common bug in this component.
- Pinned rows leave the date grouping entirely and sit above it — not "Today" items wearing a badge.
- The status slot carries running spinners for agent tasks; in Manus the sidebar doubles as a job
  queue.

**Evidence:** Manus, Claude, ChatGPT, Descript. Shipped in Wave 0.

## B7 `app-topbar` `NEW`
**Base:** Breadcrumb, Button-group · **Configurations:** document context · editor context

- One component, two configurations. Document context leads with breadcrumb + privacy; editor
  context leads with zoom + history.
- Saved-state is text, not an icon. "Last saved 5 days ago" answers a question a cloud glyph only
  raises.
- Absorbs the spec's `chat-header` — a chat title bar is this with fewer slots filled.

**Evidence:** LTX Studio, CapCut, Canva, Spline, Freepik, Descript.

## B8 `account-menu` `NEW`
**Base:** Dropdown-menu, Radio-group

- Identity block on top, sign-out last, separated by rules. Conventional order; do not reinvent it.
- Appearance is a nested submenu, not a dialog. Theme is changed often and should not cost a modal.
- Shortcut hints use A1. A row that has a shortcut must show it, or the shortcut is never learned.

**Evidence:** Lovable, Claude, Spline, Midjourney.

---

# C · Home & launcher

## C1 `hero-omnibox` `NEW`
**Base:** Textarea, Button · **States:** idle · focused · generating · locked

- The whole card is the control. `locked` swaps the textarea for a paywall CTA in place — the
  composer is the gate.
- Attach, model select and mode chip live inside the field, not above it. Same slot arrangement as D1.
- Credits sit at the point of spend (M2), never buried in billing.

**Evidence:** Descript, Zapier Copilot, CapCut, Manus, Claude — five of five App Home screens.

## C2 `suggestion-chips`
**Composes:** `@ai-elements/suggestion`

- Composes rather than reimplements — the cleanest example of the L1 boundary in the catalog.
- Chips are prompts, not filters. Clicking fills the composer; it never navigates or submits.
- Overflow resolves to a link, because a half-visible chip reads as a layout bug.

**Evidence:** Descript, CapCut, Manus, Claude, Zapier.

## C3 `feature-card-row` `NEW`
**Base:** Card, Carousel

- Cards are A9 in a card layout — the same four slots, stacked vertically.
- "Start from scratch" and "Popular features" are one component with different content.
- Horizontal scroll needs a visible next affordance; trackpad-only scroll hides half the content.

**Evidence:** Descript, Zapier, CapCut, Spline.

## C4 `recent-grid` `NEW`
**Base:** Card, Aspect-ratio

- Thumbnail · title · edited-ago · duration badge. All optional except the title; card height fixed
  regardless.
- "Edited 19 hours ago" beats a timestamp — recency is the only reason this surface exists.
- The empty state is an in-grid tile, not a page takeover.

**Evidence:** Descript, Spline, CapCut, Canva, Midjourney.

## C5 `recommendation-card` `NEW`
**Base:** Card, Dialog

- Two levels: a one-line row in the feed, and a modal explaining inputs and steps before you commit.
- "How it works" is numbered steps, not prose. A recommendation you cannot audit is an instruction
  you should not follow.
- Save-for-later matters as much as Try it — dismissal without a middle option trains dismissal.

**Evidence:** Zapier recommendations, Freepik skills, Manus "get started with".

---

# D · Composer & context

## D1 `media-prompt-bar`
**Presentations:** floating · docked · node-embedded · **State:** locked

- Three presentations of one component. Floating collapses the settings strip; node-embedded drops
  the negative prompt.
- The settings strip is A7 embedded. Cost re-estimates live as settings change.
- `locked` replaces the input row in place — gate at the point of creation, not at a billing page.

**Evidence:** Freepik, ElevenLabs Flows, CapCut, Playground, Runway.

## D2 `reference-strip` `NEW`
**Roles:** reference · first frame · last frame · video ref · character

- Slots are typed and role-labelled. The role IS the data — it changes what the model does.
- Empty slots stay visible rather than collapsing, so the set of possible inputs is discoverable.
- Reorder and remove are per-slot. Removing a first frame must not silently promote another reference.

**Evidence:** Freepik, Runway, ElevenLabs, CapCut all place typed references ABOVE the prompt.

## D3 `context-chips`
**Base:** Badge · **States:** resolved · resolving · unresolved

- Chips are references, not text. Deleting a chip removes the context.
- Overflow collapses to a count chip — never a horizontal scroll inside a text input.
- `unresolved` is a real state: an @-mention whose target moved must say so.

**Evidence:** Claude, Manus, Cursor, Lovable. Shares machinery with D1 and G4.

## D4 `mode-tabs` `NEW`
**Base:** Toggle-group · **Range:** 2–5 modes

- Mode changes the interpretation of the prompt, not the model. Keeping E2 separate makes both
  legible.
- Two to five options only. Past five, the control is a select.
- The selected mode must survive a reload — it is a working context, not a transient toggle.

**Evidence:** CapCut Standard/Director, Claude Chat/Cowork, Manus Design/Build, Spellbook Ask/Draft/Review.

## D5 `quote-reply`
**Sources:** text range · image region · table cell · timeline range

- The quote carries a stable anchor, not just the text. If the source is edited, the quote must still
  resolve.
- Quotes are removable without clearing the typed message. Two independent pieces of state.
- Image-region and timeline-range variants exist because selection is not only textual.

**Evidence:** Claude, Notion AI, Spellbook, Descript.

## D6 `skill-menu` `NEW`
**Base:** Command, Popover

- Rows are A9; the hover preview is the differentiator. A skill you cannot see the output of is a
  name, not a choice.
- The footer is two verbs: author it yourself, or have the agent author it.
- Search filters titles AND descriptions — skills are discovered by what they do.

**Evidence:** Freepik skills menu, Manus plugins, Claude skills, Zapier actions.

---

# E · Generation & parameters

## E1 `generation-panel`
**Base:** Card, Collapsible

- Vertical order is fixed across every tool: inputs → directions → presets → settings → cost +
  Generate. Deviating breaks muscle memory.
- Sections collapse but the Generate row is pinned to the bottom — never requires scrolling.
- The empty right pane is L1 with a before→after example pair, not an inert grey box.

**Evidence:** Freepik apps, Tripo, Playground, getimg, Simplified.

## E2 `model-picker`
**Base:** Select, Popover, Card · **Variants:** dropdown · expanded-cards · node-inline

- Models are grouped by task signature (text→video, image→video), not alphabetically.
- Local vs cloud is a first-class badge with hardware requirements. A real decision, not a footnote.
- Selecting a model rewrites the settings strip. The picker owns capabilities; A7 only renders them.

**Evidence:** ElevenLabs Flows, Freepik, Tripo, Playground.

## E3 `parameter-panel`
**Base:** Field, Slider, Tabs

- Endpoints speak human — "More variable ↔ More literal", never "0.0 ↔ 1.0". The raw number stays
  visible.
- One-line education under a slider is a slot, not a tooltip. Tooltips hide the explanation that
  makes the control usable.
- Rows are A6, so this and I2 align to the same column grid.

**Evidence:** Playground, Freepik, Tripo, CapCut. Parameters teaching inline is a derived rule.

## E4 `preset-grid` `NEW`
**Built on:** A8

- Presets are data, not code. Style, palette, environment, avatar and filter grids are one component
  with a different array.
- Labels overlay the thumbnail rather than sitting below it, so a dense grid stays a grid.
- See-more is a tile in the grid, not a link below it — the grid never reflows when expanded.

**Evidence:** Midjourney styles, CapCut filters, Freepik environments, Simplified filters, Fotor text effects.

## E5 `run-button`
**Base:** Button, Progress · **States:** idle · estimating · running · done · failed · insufficient · locked

- Progress is drawn inside the button. A separate bar makes people wonder whether the button is live.
- Running state must expose Cancel. A generation you cannot stop burns credits and trust.
- The cost number here and in E1 / D1 come from one source. Two different prices is the failure mode.

**Evidence:** Freepik "Generate 55", Tripo, Playground, ElevenLabs.

## E6 `generation-queue`
**Base:** Skeleton, Progress

- Slots are reserved at submit time, at final aspect ratio, so results fill in place.
- Batch progress and per-slot progress are different numbers and both are needed.
- Cancel exists at both levels; cancelling a batch must not orphan completed slots.

**Evidence:** Midjourney, Freepik, Playground, getimg.

## E7 `member-gate-row` `NEW`
**Base:** Switch, Badge

- Locked features stay visible with a tier badge. Hiding paid features hides the reason to pay.
- Toggling a locked row reveals an inline upsell rather than opening a modal.
- "Free trial ×1" is a distinct state from locked and unlocked.

**Evidence:** Tripo members-only rows, Lovable tier badges, Spline Pro features, CapCut crown marks.

## E8 `generation-wizard` `NEW`
**Base:** Dialog, Tabs

- Every step is skippable and says so. A wizard that traps you is how a feature gets abandoned.
- The preview pane updates per step, so the cost of a wrong choice is visible before the next one.
- Completed steps stay clickable. Forward-only wizards force cancel-and-restart.

**Evidence:** Descript AI speaker flow, Tripo model setup, Canva magic flows.

---

# F · Results & assets

## F1 `result-card` `NEW`
**Base:** Card, Aspect-ratio · **States:** idle · streaming · done · failed · locked

- Card geometry is identical in all states. Only the media slot and footer change, so grids never
  reflow when a result resolves.
- Failure renders where the result would have been, with retry inside the card. A toast alone loses
  the association.
- `locked` shows the shape of what would have been made, then the CTA — never an empty box with a
  padlock.

**Evidence:** Absorbs the spec's `video-gen-card`, queue slots and failed-card variants.

## F2 `generation-grid`
**Built on:** F1 + A3

- Density is a prop, not a fork: eight-up in a library, four-up in a generation panel.
- Select mode replaces hover actions with checkboxes and a bulk bar. Both cannot be live at once.
- Empty is an in-grid tile, not a page takeover.

**Evidence:** Midjourney Organize, Freepik generations, Playground history, getimg.

## F3 `asset-detail` `NEW`
**Base:** Dialog, A10

- The highlighted span is the point: prompts are editable material, not a caption. Selecting a phrase
  feeds Remix.
- Copy prompt · Remix · Edit are the handoff verbs. Remix carries prompt and params into D1.
- Params render through A10 — the same grid N5 uses. Seed and sampler make results reproducible.

**Evidence:** Provenance contract. Midjourney, Playground, Freepik.

## F4 `action-stack` `NEW`
**Base:** Dropdown-menu, A9

- Each row carries its own cost chip. Chaining is where credits vanish fastest.
- Data-driven: which tools appear depends on the asset type.
- Visually identical to I4 on purpose, because conceptually they are the same thing.

**Evidence:** Cross-tool handoff is the signature interaction: ElevenLabs, Freepik, Topaz, CapCut.

## F5 `compare-viewer`
**Base:** Resizable · **Modes:** side · single · wipe

- Panes are numbered as well as labelled. In wipe or single view the label disappears; the number
  persists.
- Zoom, pan and playhead are synchronised. Drifting clips make the comparison misleading.
- Absorbs the before/after slider: a wipe is a mode, not a component.

**Evidence:** Topaz Video AI, Freepik upscale, Playground compare, Midjourney variants.

## F6 `render-queue`
**Base:** Table, Progress

- Rows carry their output spec (codec, resolution, fps). A queue showing only filenames cannot be
  audited before it bills you.
- Preview and export are separate stages — a 15-second preview costs almost nothing.
- Failed rows keep their spec and offer retry in place.

**Evidence:** Topaz Video AI, CapCut export queue, Descript. Preview-before-commit economics.

## F7 `approval-card`
**Base:** Card, Button-group · **Verbs:** Confirm · Edit · Regenerate · Skip

- Four verbs, always in the same order. Confirm and Skip are terminal; Edit and Regenerate return you
  to the artifact.
- Truncated detail with an explicit expand. Approving what you cannot read is what this prevents.
- Resolved state keeps Undo available for a window.

**Evidence:** Approval contract. Sprig AI, Zapier user-approval, OpenAI Agent Builder, Spellbook.

---

# G · Canvas & nodes

## G1 `flow-canvas`
**Extends:** `@ai-elements/canvas`

- Pan, zoom, marquee and viewport persistence are inherited, never reimplemented.
- The running state animates every edge on an executing path, so the graph's position is visible
  without reading node badges.
- Empty is L1 centred in the viewport with the add affordance.

**Evidence:** OpenAI Agent Builder, Freepik Flows, ElevenLabs Flows, LTX Studio.

## G2 `ai-node`
**Base:** Card · **States:** idle · running · done · failed · locked · collapsed

- The body is a slot: G5 when done, G4 when idle, a skeleton while running. One node type, not ten
  presets.
- The header carries type, status dot and model label; the status dot implements the state contract.
- Collapsing hides the body but keeps header and footer, so a large graph stays readable and runnable.

**Evidence:** The single biggest saving in the recut — Flow Kit from 25 items to 9 + a hook.

## G3 `typed-handle` + `typed-edge`
**States:** valid · invalid · dangling · selected · animated-while-running

- Edge colour derives from the SOURCE handle in v1. Deriving from the target would change colour
  mid-drag.
- Invalid connections are rejected at drag time with a visible reason, not accepted then failed at
  run time.
- Handle colours come from the `--flow-*` token scale, defined once centrally. Token contract.

**Evidence:** Freepik Flows, ElevenLabs Flows, OpenAI Agent Builder.

## G4 `node-prompt`
**Base:** Textarea

- @-mentions resolve to upstream nodes, not files. Typing `@Image 1` wires a dependency, which is why
  `unresolved` is a real state.
- The prompt persists and is re-runnable. This is why it is not built on AI Elements' chat-shaped
  `prompt-input`.
- Reference thumbnails mirror D2, so the mental model transfers between canvas and composer.

**Evidence:** Freepik Flows, ElevenLabs Flows.

## G5 `node-result` `NEW`
**Wraps:** F1

- Same six states and slots as F1, minus the hover action row a canvas cannot support.
- Empty copy states what WILL appear ("Generated text will appear here"), so an un-run node reads as
  ready rather than broken.
- Clicking the result opens F3 — provenance is reachable from the canvas.

**Evidence:** ElevenLabs Flows LLM nodes, Freepik nodes with an inline audio toggle.

## G6 `model-bar`
**Base:** Button-group · **Is:** A7 + Run split-button

- One engine, two presentations — not two components that look similar.
- The split-button matters: run-this-node, run-from-here and run-whole-flow are different intents.
- Duplicate, delete and overflow live here, not in the header, so the header stays readable zoomed
  out.

**Evidence:** ElevenLabs Flows, Freepik Flows. Zero products put it in the header.

## G7 `node-palette`
**Base:** Command, Popover

- Groups are semantic (Core / Tools / Logic / Data), not alphabetical.
- Two presentations: an anchored popover and a docked rail. Same catalog, same search.
- Dropping onto an existing edge inserts the node into that connection — highest-value interaction,
  easiest to miss.

**Evidence:** OpenAI Agent Builder popover, n8n-style docked library, Freepik tool dock.

## G8 `canvas-toolbar` `NEW`
**Base:** Button-group

- Tools and view controls are separate clusters in separate corners.
- The add-by-type row is the fast path; G7 is the complete path. Both are needed at scale.
- The dock shifts when the inspector opens rather than sliding under it.

**Evidence:** Freepik Flows, LTX Studio, OpenAI Agent Builder, Spline.

## G9 `node-inspector`
**Base:** A6, Collapsible

- Rows are A6, so this and I2 align to the same grid despite unrelated content.
- An empty state when nothing is selected is required — a blank panel reads as a loading failure.
- Destructive actions sit at the bottom, visually separated.

**Evidence:** OpenAI Agent Builder, n8n-style builders, Freepik.

## `useFlowRunner` — headless hook
**No UI.** Topological execution, per-node status, cancellation. Executor-swappable.

- v1 does naive full-graph topological runs; output caching is deferred.
- Owns execution state; G1 renders it as animated edges and G2 as status dots. The UI stays
  executor-agnostic.

---

# H · Timeline & transport

## H1 `transport-controls`
**Base:** Button-group · **Variants:** simple · frame-accurate

- Two variants, one component. Frame-accurate adds timecode, frame step and in/out; button order is
  unchanged.
- Elapsed/total is text and editable — typing a timecode should seek.
- Every control has a keyboard equivalent. Transport without keyboard is preview, not editing.

**Evidence:** CapCut, Descript, Topaz, Freepik.

## H2 `time-ruler` `NEW`
**Base:** Slider (heavily extended)

- Tick density is derived from zoom. Labels thin out rather than overlapping.
- The playhead spans every track, not just the ruler.
- In/out handles are a separate layer from the playhead.

**Evidence:** CapCut, Descript, Topaz. Extracted from the spec's monolithic `timeline-editor`.

## H3 `track-lane` `NEW`
**Types:** filmstrip · waveform · text · adjustment

- The lane header is a fixed-width gutter with mute, solo and lock. It never scrolls horizontally.
- Trim handles appear only on selection and belong to the clip, not the lane.
- Track type changes clip rendering but not lane behaviour. One component, four renderers.

**Evidence:** CapCut, Descript, Premiere-lineage editors.

## H4 `transcript-editor`

- The transcript is a view of the same edit-decision list the timeline renders. Editing either
  updates the other.
- Deleted words are struck through before removal, so a destructive edit is visible and reversible.
- Speaker labels are editable and drive diarisation corrections.

**Evidence:** Descript is canonical; CapCut and Premiere have since shipped text-based editing.

## H5 `frame-strip` `NEW`
**Built on:** A8

- One component for video frames, slide pages and artboards. Selection, reorder and add are identical.
- Active item is ringed, not bordered, so the strip does not shift when selection moves.
- The in/out variant feeds D2 — picking first and last frames is how image→video conditioning is set.

**Evidence:** Descript, CapCut, Canva page strip, Simplified artboards, Freepik frame conditioning.

---

# I · Editor surfaces

## I1 `tool-panel`
**Built on:** A12, A8

- Almost entirely composition, which is why it is cheap to build and to vary.
- The docked prompt box is what makes it a modality panel rather than an asset browser.
- Infinite section lists must lazy-render.

**Evidence:** CapCut, Canva, Fotor, Simplified, Spline — remarkably invariant anatomy.

## I2 `property-inspector`
**Built on:** A6, A11

- Content is selection-driven: one variant per element type, plus an empty state.
- Group-level reset on the section header; row-level reset at the end of each A6 row.
- Sections remember collapsed state per element type.

**Evidence:** CapCut, Canva, Spline, Tripo. F2 in the board's own Requirements table.

## I3 `context-toolbar`
**Base:** Toolbar

- Six to eight actions maximum. Past that it competes with the inspector.
- The AI entry is always first and always opens I4.
- Flips above or below the selection to stay in the viewport, and never covers the selection.

**Evidence:** Canva, Fotor, Spline, Notion. Selection surfaces are a family.

## I4 `ai-tools-menu`
**Built on:** A9

- AI actions attach to objects, not only to chats. The selection is the prompt context.
- Each row carries a cost chip where the action spends.
- Grouped by intent, with expensive or destructive options below a rule.

**Evidence:** Canva Magic, Fotor AI tools, Spline AI, CapCut AI effects.

## I5 `drawing-tools` `NEW`
**Base:** Toggle-group, Popover

- Rails are toggle-groups with flyouts, not nested menus. Switching tool is never more than one click
  deep.
- Size, hardness and opacity are A6 instances, so brush controls and the inspector share one grid.
- Mask mode connects this to generation — brushing a region is how inpaint gets its input.

**Evidence:** Canva draw tools, Fotor, Playground mask brush. Absorbs the spec's `brush-controls`.

---

# J · Library, filtering & discovery

## J1 `asset-library`
**Base:** Table, Toggle-group

- Folders and files share one table. A separate folder pane forces thinking about storage.
- Row actions live in an overflow menu — the row is a target, not a toolbar.
- Selection mode swaps hover for checkboxes and reveals a bulk bar, as F2 does.

**Evidence:** Make scenarios, Spline files, Canva projects, Claude Library.

## J2 `filter-panel`
**Base:** Checkbox, Collapsible

- Counts beside each facet are essential. A filter that will return nothing should say so first.
- Saved searches separate a power archive from a library — the top of the filtering scale ladder.
- Sections collapse and remember state.

**Evidence:** Midjourney Organize is the reference implementation.

## J3 `explore-gallery`

- Masonry, not a grid. Community feeds are browsed for surprise; equal-height rows suppress it.
- The docked prompt bar sits above the feed so inspiration converts without a navigation step.
- Sort tabs and type pills are different axes and must stay separate.

**Evidence:** Midjourney Explore, Spline Community, Pixlr, Canva templates.

## J4 `artifact-grid` `NEW`
**Base:** Card

- Excerpt is the load-bearing field. Auto-generated titles are unreliable; first lines are not.
- Type badge is a filter facet as well as a label, driven by the same value in both places.
- Privacy icon and view count sit together in the footer.

**Evidence:** Claude Artifacts, Manus Library. A new archetype with no equivalent in the spec.

## J5 `record-list` `NEW`
**Base:** Table, Switch

- The enable toggle is the primary control and sits in the row. These records represent things that
  run.
- App-icon clusters communicate what a record touches faster than any title. Data, not decoration.
- Last-run and draft states belong in the subtitle.

**Evidence:** Make scenarios, Zapier zaps, n8n workflows.

## J6 `template-detail` `NEW`
**Base:** Dialog, Carousel

- Options are configured before commit, so the template is customised on the way in.
- Author attribution with follow makes the template a social object.
- "More like this" means the modal never dead-ends.

**Evidence:** Canva template modal, Spline templates, Freepik, Pixlr.

---

# K · Documents & knowledge

## K1 `ai-doc-block`
**Base:** Card, Textarea

- A real document node, not an overlay. Must survive save, reload and export as ordinary content.
- The four verbs are the approval contract applied to prose.
- Re-prompting keeps the block in place and swaps its content, so structure never moves.

**Evidence:** Notion AI, Manus reports, Spellbook drafting, Claude artifacts.

## K2 `inline-generate-popup`
**Base:** Popover, Textarea

- Anchored to the caret, so the insertion point is unambiguous.
- Surrounding structure is implicit context — the heading above usually makes instructions
  unnecessary.
- Output lands as a K1 block with the same approval verbs; the popover generates, it does not commit.

**Evidence:** Notion AI, Simplified, Canva docs, Spellbook.

## K3 `diff-review`

- Rationale per change is a required slot. Seven unexplained edits take longer to review than to
  write.
- Word-level, not line-level. Line diffs on prose force re-reading whole paragraphs.
- Accept-all and reject-all sit apart from the per-change verbs.

**Evidence:** AI edits arrive as track changes with rationale — a derived rule. Notion AI, Spellbook, Google Docs.

## K4 `selection-toolbar`
**Built on:** I3

- Improve is first and visually distinct; everything else is a plain verb.
- A rewrite returns as a K3 diff, never a silent replacement.
- Absorbs the spec's `tone-selector` — a submenu here, an E4 grid in a generation panel.

**Evidence:** Notion AI, Spellbook, Google Docs, Canva Docs. The most copied AI interaction in writing tools.

## K5 `source-panel` `NEW`
**Built on:** A9, Progress

- The pipeline is the status: parsing → chunking → embedding → ready. A generic spinner hides which
  stage failed.
- Chunk counts belong on ready sources — retrieval quality is otherwise invisible.
- Failures are per-source and retryable in place.

**Evidence:** NotebookLM sources pane, Lovable knowledge, Claude projects. Absorbs `ingestion-dropzone` and `knowledge-base`.

## K6 `citation-ref` `NEW`
**Base:** Hover-card

- The hovercard shows the actual quoted chunk, not just the document name.
- Jump-to-source scrolls K5 to the exact chunk. Two ends of one mechanism.
- `unresolved` is a visible state. Silently dropping a citation is how a document stops being
  verifiable.

**Evidence:** NotebookLM citations, Spellbook clause references, Manus reports.

---

# L · First-run & onboarding

## L1 `empty-state` `NEW`
**Base:** Empty · **Sizes:** page · panel · in-grid

- Three sizes, one component. The in-grid variant is a tile so the grid keeps its rhythm.
- The CTA uses the same verb as the primary action of the surface it replaces.
- The example-pair variant is the strongest form for generation tools — it shows the transformation.

**Evidence:** Empty contract. NotebookLM ships three simultaneously-empty panes on first load.

## L2 `coach-mark` `NEW`
**Base:** Popover

- The scrim has a cut-out so the anchored element stays legible. Never dim what you point at.
- Step counter and Skip are mandatory.
- A tour is a sequence of coach-marks with shared state, not a separate component.

**Evidence:** CapCut yellow tips, Lovable tooltips, Airtable Omni, Spline onboarding.

## L3 `feature-announcement`
**Sizes:** modal · anchored popover · inline card · dismissible chip

- Escalation should match the news.
- Dismissal persists per announcement id. Returning after dismissal is the most-hated pattern here.
- Stage badges (New / Beta / Preview / version) set expectations.

**Evidence:** Airtable Omni, Spline Hana, Claude usage chip, Pixlr What's New.

## L4 `whats-new` `NEW`
**Base:** Dialog

- Entries carry a date and a CTA that lands you in the feature, not on a marketing page.
- Unread dots drive the badge on the trigger; reading one entry clears one dot.
- Hero media per entry does the explaining.

**Evidence:** Pixlr What's New, Spline Updates, CapCut. The escalation target when L3 has too much to say.

## L5 `shortcuts-sheet` `SHIPPED`
**Base:** Dialog, A1

- Sections mirror the app's own vocabulary. A flat alphabetical list is unusable at 60+ shortcuts.
- Search matches the action name, not the keys.
- `controls-primer` is a variant: grouped input-method cards instead of keycaps. Not a separate item.

**Evidence:** Shipped in Wave 0. Descript, CapCut, Spline, Figma. Tripo's "View Your Model" is the controls-primer variant.

## L6 `onboarding-wizard` `NEW`
**Base:** Card, Progress

- Every step is skippable and the dot progress shows how many remain.
- Answers must change the product — segment defaults, templates, sample content. A survey that
  changes nothing is a tax.
- The split-panel variant is the same component with a marketing pane instead of a question.

**Evidence:** ElevenLabs role survey, Descript, CapCut, Claude Cowork intro.

---

# M · Account, plan & monetization

## M1 `settings-dialog` `NEW`
**Base:** Dialog, Sidebar, Switch · **Variants:** dialog · full-page

- Rows are label + description + control. A toggle with no description is a setting nobody changes.
- Destructive actions render as text in the control column, never as a filled button beside benign
  toggles.
- Full-page adds settings search and deep-linkable sections; the row grid is identical.

**Evidence:** Playground settings dialog, Lovable full-page settings, Spline, Descript.

## M2 `credits-indicator`
**Base:** Badge, Progress · **Forms:** ring · counter · low · empty · with top-up

- Always visible and always clickable through to plan management.
- `low` and `empty` are distinct states — the useful moment is before zero.
- This is the app-level "ring" of the cost contract; A2 is the per-action chip, E5 the pre-commit
  line.

**Evidence:** Freepik 414 credits, Tripo 200, Simplified 1/5 used, Descript minutes.

## M3 `quota-meter`
**Base:** Progress

- Per-resource rows, because AI plans meter several things and one aggregate hides the one you'll hit.
- Three thresholds with distinct colours: normal, near-limit, at-limit.
- The reset countdown changes the decision more than the raw number does.

**Evidence:** Zapier plan tasks, Lovable credit usage, Claude usage, Descript minutes.

## M4 `pricing-table`
**Base:** Card, Toggle-group

- Feature lists grouped by product area with sub-headings, not one flat list of twenty ticks.
- The add-on row with a switch is not a plan tier and must not be styled as one.
- Anchor pricing (annual under monthly) is what the toggle is actually for.

**Evidence:** Spline upgrade modal, Tripo, Lovable, Descript.

## M5 `paywall-message` `NEW`
**Base:** Card

- The card carries the prompt and model it WOULD have used, so upgrading resumes the exact work.
- Greyed preview text shows what was going to be produced.
- The agent explains in prose before and after; a bare upgrade card reads as an ad.

**Evidence:** Freepik agent. The clearest evidence that the paywall is a state, not a Wave 12 kit.

## M6 `rate-limit-banner`
**Base:** Alert

- Distinguish your quota from provider capacity. Blaming the user for a busy model loses trust.
- Live countdown, not "try again later".
- Inline above the composer, never a toast — the constraint persists, so the message must.

**Evidence:** Claude usage limits, Midjourney queue caps, Freepik concurrency.

---

# N · Feedback, trust & observability

## N1 `feedback`
**Base:** Popover, Button-group

- Positive feedback is one click; negative asks why. Asking for a reason on praise suppresses the
  signal.
- Every reason chip is optional and free text never blocks submission.
- Thumbs and 5-star are two presentations of one component — pick one per product.

**Evidence:** Manus star rating, Claude thumbs, Playground, Freepik.

## N2 `trust-dialog` `NEW`
**Base:** Alert-dialog, Checkbox

- The primary action stays disabled until the trust checkbox is ticked.
- A preview of what will run sits above the warning.
- The account picker on Continue chooses where untrusted code executes — as important as whether.

**Evidence:** v0 template dialog. Running other people's prompts and code is becoming routine.

## N3 `disclaimer-note` `NEW`

- Permanent and non-dismissible. A disclaimer that can be dismissed is one that did not need to exist.
- Adjacent to the output it qualifies, never in a settings page.
- Quiet by design — findable when questioned, not competing with the content.

**Evidence:** Manus, Claude, NotebookLM, Freepik. Now a regulatory expectation as much as a convention.

## N4 `trace-timeline`
**Base:** Collapsible

- Bars are positioned by start time, not stacked. A waterfall that hides concurrency is a list.
- Retries render as sibling rows rather than replacing the failed attempt.
- Rows expand into N5 in place.

**Evidence:** LangSmith-style tracing, Vercel AI observability, agent debuggers.

## N5 `run-inspector`
**Base:** Tabs, A10

- Raw input and output are copyable JSON. Pretty-printed but uncopyable cannot go in a bug report.
- Cache hit/miss belongs beside cost — usually the largest lever on spend.
- The error tab explains what was retried and whether it worked.

**Evidence:** Tracing tools. Shares A10 with F3 — provenance and observability are the same need.

## N6 `usage-dashboard`
**Base:** Chart, Card

- Per-model breakdown is the actionable view; total spend only says there is a problem.
- Deltas beside every summary figure.
- Period select drives every panel at once.

**Evidence:** Provider consoles. The team-facing counterpart to M2 — same data, different audience.
