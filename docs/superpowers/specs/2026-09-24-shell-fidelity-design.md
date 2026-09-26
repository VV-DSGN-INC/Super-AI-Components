# Shell fidelity: real content, a full-viewport preview, and the states a real app shows

**Date:** 2026-09-24 · **Owner:** Nick · **Status:** Draft, for Nick's review · **Baseline:** `main` at `a2ee12a`

**TL;DR.** The thirteen shipped shells read as wireframes: grey boxes where media goes, a
42rem card inside a docs page, and no story for the moments a real product spends most of its
time in (streaming, failing, loading, asking permission). This spec adds four things, one PR
each, in this order: a library of generated stills that replaces the grey boxes; a
full-viewport route per block; the missing state stories built from components that already
ship; and two slots every shell lacks, `status` and `loading`. Nothing here restyles the
registry or adds a shell.

## 1. Decisions made with Nick, 2026-09-24

1. **Fidelity means real content and a real frame.** Of the four layers offered (content,
   frame, docs-site skin, one shell as a real app) Nick chose the first two. The skin waits
   until he has seen the result; the real-app prototype is not this repo's job.
2. **Media slots get generated stills, not procedural scenes.** Demos never ship to a
   consumer, so nothing argues for code over files. The August attempt at procedural
   scenes stays unmerged (§2).
3. **The shell review's four outcomes:** the docs rail brand defect is fixed now as its own
   PR (`claude/docs-shell-rail-brand`); the missing state stories are unit 3 here; the
   cross-cutting slots are unit 4 here; the per-shell flow gaps (share, export, version
   history, run logs, API keys) are parked in `CONTINUE.md` §8, not built.
4. **Family O stays at fourteen.** The five shell types the review found missing (builder,
   answer, voice session, agent run, data analysis) are a separate decision, and the catalog's
   own note already records those product areas as unsampled.

## 2. Measured state at baseline

- 13 shells shipped and live at `/components/<name>`; O5 cut by D9. 116 demos are wired
  through the generated `apps/docs/lib/demos.generated.ts` (written by `gen-wiring.mts`).
- **How a shell is framed today.** `PreviewTabs` (`apps/docs/components/preview-tabs.tsx`)
  renders every demo in a `min-h-40` bordered card; each shell demo hard-codes
  `className="h-[42rem]"` to give itself a height. There is no route that renders a block
  alone. Route groups today: `app/(system)` only.
- **Media.** Every media slot in the shell demos is a `bg-muted` rectangle. The 2026-08-12
  attempt in worktree `design-system-previews-b3e6f2` (branch
  `claude/design-system-previews-b3e6f2`) built `preview-scene.tsx` (493 lines, six
  `--scene-*` cssVars in `lib.manifest.ts`) and rewired 18 demos to it. It is uncommitted,
  317 commits behind `main`, and superseded by decision 2. It is not deleted by this spec.
- **Static files.** `apps/docs/public/` holds only `llms*` today; `public/r/` is gitignored.
  Storybook has no `staticDirs`, so a still the docs app serves is invisible to stories until
  one is added.
- **Generic slots each shell already exposes** (measured from the props, so "no account
  menu" in the review meant "the demo does not show one", except where noted):

  | shell      | slot a host can put an account menu or notifications in |
  | ---------- | ------------------------------------------------------- |
  | home       | `topbar` (B7 trailing), `sidebarFooter`                 |
  | chat       | `topbar`, `sidebarFooter`                               |
  | studio     | `topbar`, `pinnedModalities`                            |
  | timeline   | `railPinned`                                            |
  | generation | `topbar`                                                |
  | library    | `headerActions`                                         |
  | explore    | `railPinned`                                            |
  | artifact   | `headerActions`, `sidebarFooter`                        |
  | records    | `headerActions`                                         |
  | docs       | `railFooter`                                            |
  | settings   | `accountMenu`                                           |
  | notebook   | none (only `sourcesAction`)                             |
  | auth       | none, correctly                                         |

  No shell has a slot for a status banner (offline, save failed, session expired, rate
  limited) and none has a loading state.

- **Components that ship and no shell composes:** `permission-prompt` (N8), `safety-block`
  (N10), `shortcuts-sheet`, `account-menu` (B8), `rate-limit-banner`, `task-tray` (N12),
  `escalation-handoff` (N11). `render-queue` (F6) already models a failed job;
  `source-panel` (K5) already models a failed source; `media-prompt-bar` (D1) already
  models a stop control.
- **Stories.** Every shell has the eight case names. None has a story for streaming, a
  failed turn, a tool call or approval, a failed export, a blocked result, an upload in
  progress, a failed ingest, or a sent email. None has a loading story.
- **Gates at baseline:** `check:tokens` and `check:contract` pass; the full twelve are green
  on `main` (CI run on `a2ee12a`).

## 3. Scope: four units, four PRs

### U1. Stills

A library of generated photographs that stand in for what a Northwind user made.

- **Art direction, one world.** Photographic, natural light, muted colour, shallow depth
  where it helps. No faces, no legible text, no logos, no UI in the picture. Subjects come
  from prompts the demos already carry (lighthouse at dusk, harbour film, neon city, paper-cut
  forest, chrome jellyfish, brutalist greenhouse, red bicycle, blue awning, market stall,
  bridge at noon). A studio portrait becomes a studio still life, because of the no-faces
  rule.
- **Generation.** The `nano-banana` skill (Gemini CLI), one prompt per still, recorded in
  the manifest beside the file so a still can be regenerated. Needs `GEMINI_API_KEY` on the
  machine that runs it; Nick supplies it, never the agent.
- **Files.** `apps/docs/public/stills/<slug>.webp`. Three crops: 3:2 at 960×640, 1:1 at
  640×640, 9:16 at 480×854. WebP, quality about 75, at most 80 KB each, at most 3 MB in
  total, about 30 files. Photographs do not change with the theme; the frame around them
  does.
- **Manifest.** `apps/docs/lib/stills.ts` exports the list (slug, crop, prompt, alt) and
  `still(slug)` returning the public URL. A test asserts the manifest and the directory agree
  in both directions, every still is under the per-file cap, and the directory total is under
  a committed ratchet that may only shrink.
- **Storybook.** `staticDirs: [{ from: "../../docs/public/stills", to: "/stills" }]` in
  `.storybook/main.ts`, so a story and a demo reference the same URL.
- **Where they go.** First the shell demos: home recents, studio style presets and slide
  thumbnails, timeline clips and b-roll, generation results and presets, library tiles,
  explore feed, auth marketing panel. Then the component demos and examples that share the
  same fixtures (preset-grid, reference-strip, frame-strip, feature-card-row, template-detail,
  whats-new, recent-grid, explore-gallery, generation-panel, tool-panel, asset-detail). One
  rule carried from the August attempt: a card and the detail it opens show the same still.
- **Never in the registry.** `registry/super-ai/**` does not reference a still; media stays a
  node the host passes. The token gate's scope makes this checkable and the stills test
  greps for it.

### U2. Full-viewport preview route

- **Route.** `apps/docs/app/(preview)/preview/[name]/page.tsx`, its own layout without the
  docs shell, statically generated from the manifest's blocks (`layer` L4). Any other name
  returns 404.
- **Frame.** The page is a `h-svh` column: a 40px bar, then the demo filling the rest. Demos
  stop carrying `h-[42rem]` and use `h-full`; `PreviewTabs` supplies the 42rem height for
  blocks in its `fullBleed` container, so the docs page looks the same as today.
- **The bar.** Block name, a link back to the block's docs page, and the theme toggle from
  PR #74. If #74 has not merged when U2 lands, the bar ships without the toggle and gains it
  in a follow-up; U2 does not fork the toggle.
- **Entry.** The block's docs page shows "Open full screen" beside the Preview and Code
  tabs, blocks only. The route is not in the nav and not on the home.
- **Smoke.** For every block: the preview renders the block's root `data-slot`, the root's
  height is within 1px of the viewport minus the bar, and there is no horizontal overflow at
  1440 and at 375. Runs in Chromium and WebKit like the rest of the smoke suite.

### U3. The missing state stories

Case stories, one per state, each built from components that already ship, each with a
JSDoc description, each under axe. A state with a claim carries a play that asserts it.

| shell      | story            | composed from                                    |
| ---------- | ---------------- | ------------------------------------------------ |
| chat       | `Streaming`      | AI Elements streaming message, D1's stop control |
| chat       | `FailedTurn`     | the failure row and a retry action               |
| chat       | `ToolCall`       | N8 `permission-prompt` inline in the stream      |
| timeline   | `FailedExport`   | F6 `render-queue` failed job, `onRetryJob`       |
| generation | `Blocked`        | N10 `safety-block` in the result canvas          |
| library    | `UploadProgress` | an upload row with progress and cancel           |
| notebook   | `IngestFailed`   | K5 `source-panel` failed source, `onRetrySource` |
| auth       | `EmailSent`      | L1 `empty-state` in the provider column          |

The plan's task 0 checks each row's third column against the component's real states and
records the substitution where one is needed. If a row needs a component that does not exist
(the chat failure row and the library upload row are the two at risk), the story composes the
nearest labelled sibling and the gap is written to `CONTINUE.md` §8, never a reimplementation.

**Slots filled with the library (added 2026-09-25, Nick's call).** Measured on 2026-09-25
across registry imports (transitive), shell demos and shell stories, 66 of the 103 non-block
items appear in at least one shell and 37 appear in none. The manifest's `consumes` cannot
show this, because shells take slots and only the demos fill them. Four shell demos pass
`<div>Northwind</div>` into `switcher` and none passes a promo. This unit closes the part of
that gap that existing shells should show:

| shell                               | where               | component                                                     |
| ----------------------------------- | ------------------- | ------------------------------------------------------------- |
| every shell with an `AppSidebar`    | `switcher` slot     | B2 `workspace-switcher`                                       |
| every shell with an `AppSidebar`    | `promo` slot        | B5 `promo-card`                                               |
| every shell with an account slot    | the account trigger | B8 `account-menu` (only `SettingsShell.stories.tsx` shows it) |
| chat                                | `ArtifactApproval`  | F7 `approval-card` on a proposed artifact                     |
| timeline                            | `AudioRecipe`       | H6 `waveform-editor` and H7 `stem-mixer` in the track area    |
| studio                              | `ObjectAIActions`   | I4 `ai-tools-menu` on the selected element                    |
| studio or generation (task 0 picks) | `CompareRecipe`     | F5 `compare-viewer`, before and after                         |

Recipes are stories and demo variants, not new props. If a slot cannot take the component as
it ships, that is a gap for `CONTINUE.md` §8, not a wrapper.

Still in no shell after this unit, by where they are expected to land: the agent components
(`trace-timeline`, `task-tray`, `autonomy-selector`, `escalation-handoff`, `env-status`,
`trust-dialog`, `source-cards`) and the document components (`inline-generate-popup`,
`diff-review`, `selection-toolbar`, `quote-reply`) go to the AI shell family
([`2026-09-25-ai-shell-family-design.md`](2026-09-25-ai-shell-family-design.md)). No home yet:
`gen-settings-bar`, `reference-strip`, `generation-queue`, `generation-wizard`,
`tts-composer`, `voice-clone-recorder`, `track-list`, `skill-menu`, `slot-summary`, `action-stack`, `coach-mark`, `whats-new`, `shortcuts-sheet`,
`rate-limit-banner`, `connection-manager`, `usage-dashboard`, `data-views`.

### U4. Two slots every shell lacks

- **`status`.** A region under the topbar (or above the content column where there is no
  topbar) for what a real app has to say across the whole surface: offline, reconnecting, save
  failed, session expired, rate limited. Composes `rate-limit-banner` and the vendored Alert.
  Mounted only when given, so an existing consumer sees no change.
- **`loading`.** A boolean. When true, every region renders its skeleton (the vendored
  `SidebarMenuSkeleton` for rails and navs, tile skeletons for grids, a line skeleton for
  prose), the root carries `aria-busy="true"`, and nothing interactive is mounted. The
  loading twin proof from the pegbo audit (item 7) is the test: skeleton geometry within 8px
  of loaded geometry per region.
- **Notebook gains `headerActions`**, the one shell with no generic slot.
- **Not a slot: the command palette.** A host mounts it at the app root; each shell's
  guidance gains a `dos` line saying so, and the chat demo shows the `shortcuts-sheet` hint
  in its topbar.
- **Demos show the host chrome** in the slots that already exist: B8 `account-menu` in the
  topbar trailing slot or the rail footer, a notifications control beside it.
- Each new prop is a guidance-module change, so `contract:emit` regenerates the `.meta.json`,
  `index/components.toon` and `public/llms*`. If `status` becomes a region, the manifest's
  `regions` for thirteen items change, and `catalog.manifest.ts` is prepared centrally as
  the plan's task 0.

## 4. Alternatives considered

- **Procedural scenes** (the August attempt): dark-mode aware and installable, but the
  ceiling is stylised illustration, and installability was never needed because demos are
  docs-only.
- **Both stills and scenes**: stills where a shell shows artwork, scenes where a control
  transforms the picture. Dropped: a CSS filter on a still demonstrates a grade as honestly.
- **A docs-site skin** and **one shell as a real app**: layers 3 and 4 of the fidelity fork,
  deferred by decision 1.
- **A preview route for every component**: a 375px card does not need a viewport; blocks
  do.
- **A `notifications` slot**: the existing generic slots already take one.

## 5. Constraints

- The registry stays host-neutral and token-only; stills never enter it.
- `apps/docs/lib/catalog.manifest.ts` is prepared centrally (CONTINUE §3.2); no agent
  writes it.
- Contracts derive: no hand-edited `.meta.json`, `components.toon` or `llms*`.
- The a11y exclusion list and the story-coverage baseline may only shrink.
- `check:tokens` scopes `registry/super-ai/**`; demos are outside it, and the stills test
  is what keeps stills out of the registry.
- Prettier-clean, the gate list in `ci.yml`'s order, one PR per unit.

## 6. Success criteria

- The thirteen block pages show photographs where they showed grey.
- Each block has a URL that renders it alone at viewport size, in both themes, with no
  horizontal overflow at 375.
- The eight stories in §3 U3 exist, are described, and pass axe.
- Every sidebar slot a shell demo exposes is filled with the component its JSDoc names, and
  the four recipes in U3's second table exist. Re-running the 2026-09-25 measurement shows
  `workspace-switcher`, `promo-card`, `account-menu`, `approval-card`, `waveform-editor`,
  `stem-mixer`, `ai-tools-menu` and `compare-viewer` in at least one shell.
- Every shell accepts `status` and `loading`; every `Loading` story passes the twin proof.
- All twelve gates green on each PR; `pnpm prod:diff` clean after the next deploy.
- Nick's look checkpoint after the first six stills passes before the rest are generated.

## 7. Build order and checkpoints

1. **U1 stills**, with a look checkpoint after six: art direction is approved on evidence,
   not on a prompt. Then the remaining stills and the demo rewiring.
2. **U2 route**, after PR #74 merges (theme toggle, `app/page.tsx`, the internal docs
   shell) so the bar reuses its toggle and the two do not conflict. Screenshot checkpoint at
   1440 and 375, both themes.
3. **U3 stories**, after the docs rail fix PR merges (it touches `DocsShell.stories.tsx`).
4. **U4 slots**, the only registry API change, as a wave: task 0 prepares the manifest and
   the twin-proof helper, then one Sonnet agent per shell in its own worktree, the
   integrator emits contracts once (the contract wave protocol).

## 8. Out of scope

- The docs-site skin (fidelity layer 3) and any shell as a real product (layer 4).
- New shell types; the five candidates are a catalog decision.
- The flow gaps parked in `CONTINUE.md` §8 (share, export, version history, run logs, API
  keys, invoices, trash and restore).
- Merging or deleting the August procedural-scene worktree.
- Carrying any of this to the Minimal Design System.
- Deploying. Prod is behind `main` by thirteen PRs already; the deploy is its own go.

## 9. Open questions

- **Art direction** is decided at the six-still checkpoint, not here. Owner: Nick.
- **`GEMINI_API_KEY`** must be present in the shell that runs the skill. Owner: Nick.
- **`loading` as one boolean or per region.** One boolean here; the plan revisits if a shell
  needs a partially loaded state (chat with threads loaded and the stream pending is the
  candidate).
- **`status` as a region or a slot.** A region changes the manifest and the anatomy of
  thirteen contracts; a slot does not. Plan task 0 decides after reading how `anatomy` is
  derived.
- **The chat failure row and the library upload row** may need a component that does not
  exist; U3's rule above says what happens then.
- **Provenance line for generated images.** The license test pins third-party notices;
  generated stills are this repo's own work and need a one-line statement in the README's
  license section, or nothing. Decide in U1.

## 10. Handoff pointers

- Stills: `apps/docs/lib/stills.ts` is the only import path; `public/stills/` is the only
  location.
- Route: `app/(preview)/preview/[name]`; the block list comes from the manifest, never a
  hand list.
- States: the table in §3 U3 is the story roster; the plan adds the per-story play.
- Slots: `status` and `loading` are documented in each shell's guidance module first, and
  the contract follows.

---

## Changelog

- 2026-09-24 — initial draft from the shell review and the fidelity brainstorm.
- 2026-09-25: U3 gains "slots filled with the library", from the reference-board coverage
  check (Nick chose it); matching success criterion added.
