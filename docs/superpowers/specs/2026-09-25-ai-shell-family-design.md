# AI shell family: the app types no shell covers

**Date:** 2026-09-25 · **Owner:** Nick · **Status:** Draft, for Nick's review · **Baseline:** `main` at `a2ee12a`
**Related:** [`gaps.md`](../../design-system/gaps.md) §4 · [`reference-board-analysis.md`](../../design-system/reference-board-analysis.md) · [shell fidelity spec](2026-09-24-shell-fidelity-design.md) and `CONTINUE.md` §8 "Added by the shell review (2026-09-24)" · D1, D12, D14, D18, Q6

**TL;DR.** Six common AI app types have no shell here: document editor, answer, agent run, data
analysis, builder and voice session. This spec samples their categories once, from real
screens, then ships them one app type per PR in order of readiness. Each PR carries the app
type's missing components and its shell, built to the fidelity spec's bar from the first
commit. The sampling also tests whether builder, data analysis and agent run are one layout,
and whether `studio-shell` already covers presentation apps (Q6).

## 1. Decisions made with Nick, 2026-09-25

1. **Why now: coverage and showcase, both.** All five ship eventually, and each one must read
   as a finished product the day it lands, not as a wireframe.
2. **Evidence: one slice, from screens, all five categories.** D1's bar (3+ unrelated products)
   applies, and the result is recorded as its own family the way D18 recorded family P. Screens
   rather than docs because D18 found that docs establish that a pattern exists and cannot show
   how it is drawn; for a showcase, the drawing is the deliverable.
3. **Source: a mix.** Claude captures public material into a Figma board and lists the states
   it does not show. Nick fills those from his own accounts.
4. **Program: one app type per PR, readiest first** (option B in §4), with option C kept as a
   question the slice must answer (§3.2).
5. **Sequencing: the slice runs beside the fidelity work.** The new shells wait for the fidelity
   spec's U2 (full-viewport route) and U4 (`status` and `loading` slots), so none of them is
   born needing a retrofit.
6. **A document editor joins the family** (added after the reference-board coverage check).
   The board's Requirements frame names a "document + chat layout" and its Lawyer or Document
   App section shows Spellbook, yet no shell was built for it, and `inline-generate-popup`,
   `diff-review` and `selection-toolbar` appear in no shell. The board's empty Text Editor
   section folds into this app type.
7. **Q6 is settled by sampling, not assumption.** Presentation apps join the slice to test
   whether `studio-shell` covers them. The Text Editor half of Q6 is answered by decision 6.

## 2. Measured state at baseline

- 116 registry items. Family O is frozen at 14 by `catalog.manifest.test.ts`. Family P is the
  precedent for a second-population family: counted separately, component and shell together.
- `gaps.md` §4 already lists these categories as U-items and says to treat them as "categories
  to go sample, not a list to go build". Where the five stand:

| App type        | `gaps.md` §4 category                                 | Parts already shipped                                                                                      | Parts missing                                                         |
| --------------- | ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Answer          | Search & grounded answers                             | `hero-omnibox`, `answer-block` (was U12), `source-cards` (was U14), `citation-ref`, `context-chips`        | `search-steps` (U13)                                                  |
| Agent run       | the agent slice, D14                                  | `trace-timeline`, `run-inspector`, `permission-prompt`, `autonomy-selector`, `task-tray`, `approval-card`  | a viewport showing what the agent is driving                          |
| Data analysis   | Data & analytics                                      | `data-views` (table view)                                                                                  | `query-preview` (U9), `result-table` (U10), `chart-suggestion` (U11)  |
| Builder         | Coding agents                                         | chat parts, `mode-tabs`                                                                                    | `code-diff`, `change-tree`, `log-stream`, `preview-pane` (U15 to U18) |
| Voice session   | Realtime voice                                        | nothing session-shaped (`tts-composer` and `voice-clone-recorder` are authoring tools)                     | the orb (lives in `weeeha/AI-Orb`), `live-transcript` (U2)            |
| Document editor | the board's Requirements D and Lawyer or Document App | `ai-doc-block`, `inline-generate-popup`, `diff-review`, `selection-toolbar`, `citation-ref`, `quote-reply` | none known before sampling                                            |

- **Reference-board coverage, measured 2026-09-25.** Every layout archetype on the board has a
  shell except the cut flow canvas. Of 103 non-block items, 37 appear in no shell (registry
  imports, shell demos or shell stories). The fidelity spec's U3 takes the ones existing shells
  should show; the agent and document components land here.

- **Capture probe, 2026-09-25.** Headless Playwright reached `hex.tech` (200). `perplexity.ai`
  and `lovable.dev` returned a Cloudflare challenge (403). Hex's hero shows a prompt box and
  nothing else of the product. So docs, help centres and changelogs are the public source, and
  marketing heroes are not.

## 3. Scope

### 3.1 The slice (docs only, no registry code)

- **Products.** Four to six per category, spread across product types, because D18 counted
  three same-category entrants as one data point. Starting candidates, pruned by what is
  capturable:
  - Answer: Perplexity, Google AI Mode, ChatGPT search, Glean, Elicit
  - Agent run: ChatGPT agent, Manus, Devin, Genspark
  - Data analysis: Hex, Julius, ChatGPT data analysis, Databricks Genie
  - Builder: Lovable, v0, Bolt, Replit Agent, Claude artifacts, ChatGPT canvas
  - Voice session: ChatGPT voice, Gemini Live, ElevenLabs agents, Hume
  - Document editor: Notion AI, Google Docs with Gemini, Microsoft Word with Copilot,
    Spellbook, Canva Docs
  - Presentation (the Q6 check): Gamma, Google Slides with Gemini, PowerPoint with Copilot,
    Canva presentations, Pitch
- **What each product is read for.** The layout regions at desktop width, and which of these
  states the captures show: empty or first run, working or streaming, waiting for approval or
  blocked, failed, done. Every state not shown goes on Nick's gap list for that product.
- **Where things live.** Screenshots go to a Figma board and never into git; third-party
  screens stay out of this repo. The analysis goes to
  `docs/design-system/ai-types-board-analysis.md` in the shape of the two earlier slices
  (method, products, finding, inclusion test re-run, corrections, not covered, sources). The
  outcome is a decision, D26, and a new family in `catalog.md`.

### 3.2 The collapse test (option C)

Builder, data analysis and agent run collapse into one `workspace-shell` with three recipes
if **3+ unrelated products across those categories** share one arrangement at desktop width: a
conversation column, one work pane, and the same header controls, with only the work pane's
contents differing. Fewer than three and each ships as its own shell. Either way the work panes
(`preview-pane`, `result-table` with `chart-suggestion`, the agent viewport) are components.
The verdict and its evidence go in the analysis doc.

### 3.3 One app type per PR

| Order | App type        | Components the PR adds (if they pass D1)                 | Shell (working name) |
| ----- | --------------- | -------------------------------------------------------- | -------------------- |
| 1     | Document editor | none known                                               | `document-shell`     |
| 2     | Answer          | `search-steps`                                           | `answer-shell`       |
| 3     | Agent run       | the agent viewport                                       | `agent-run-shell`    |
| 4     | Data analysis   | `query-preview`, `result-table`, `chart-suggestion`      | `analysis-shell`     |
| 5     | Builder         | `code-diff`, `change-tree`, `log-stream`, `preview-pane` | `builder-shell`      |
| 6     | Voice session   | `live-transcript`                                        | `voice-shell`        |

Order is by how much is missing, with voice last because of the cross-repo orb. It is
provisional until the captures are read: the first public pass found full layouts for agent
run and builder and none for answer, which may move agent run ahead of answer. Every PR
follows the existing pipeline: `catalog.manifest.ts` prepared centrally as task 0,
`pnpm new:component` for each item, blocks compose and never implement, `Empty` and
`Responsive` exports, case stories, guidance module then `pnpm contract:emit`, and the `unslop`
skill before building and before done.

### 3.4 Born at the fidelity bar

Each shell ships with stills from U1's library instead of grey boxes, a U2 full-viewport route,
U4's `status` and `loading` slots, and U3's run states as stories (working, blocked, failed,
done). If Nick changes the fidelity spec in review, this section follows it.

### 3.5 The presentation check (Q6)

If 3+ unrelated presentation products share `studio-shell`'s arrangement (modality rail,
content panel, canvas, inspector, page strip; H5 `frame-strip` already has a slide-pages
variant), Q6 closes as covered and `decisions.md` records it. If they do not, a presentation
shell becomes a candidate for this family, sized like the others.

## 4. Alternatives considered

- **A. Sample, then two waves** (all components in one parallel wave, then all shells). Shortest
  total time and the proven wave protocol, but nothing to show until the end, and one weak
  category holds up all five. Not chosen because showcase weighs as much as coverage.
- **C. One workspace shell, five recipes.** Fewest items, following D2, D5 and D6. Kept as the
  §3.2 test rather than chosen, because coverage shown as one entry undercuts both goals, and
  answer and voice do not fit the layout.
- **Evidence from docs only** (the D14 and D18 method) and **no slice at all** (a new decision
  exempting the family from D1) were both rejected in §1.2.
- **Nick collects the whole board**, or **public material only**, were rejected in §1.3: the
  first costs his time, the second misses the failure and approval states the showcase needs.

## 5. Constraints

- **D1** holds for every new component and shell. An item that fails it is recorded as failing,
  not built.
- **D9** holds. Neither the builder nor the agent viewport may bring back a node canvas.
- **Blocks compose.** A shell whose part does not exist waits for the part; it never draws its
  own.
- **Overlap with `@weeeha/ui`.** Before each component, check Minimal Design System and say
  which repo owns it (CLAUDE.md, open decisions).
- **The orb stays in `weeeha/AI-Orb`.** This repo references it and does not copy it.
- **Bot walls are never worked around.** A challenged page goes on the gap list. Frames from
  demo videos mean downloading video files, which needs Nick's yes per source.
- **Cost.** Readers run on Sonnet medium, one per category: five in the first pass, two more
  for the document editor and presentation categories.

## 6. Success criteria

- The analysis doc traces every inclusion claim to a captured screen, and every category either
  clears D1 or is recorded as failing it.
- The collapse test has a verdict with its evidence, and so does the presentation check (Q6).
- Every shipped shell passes the twelve CI gates, renders in its full-viewport route with real
  content and no grey boxes, and shows working, blocked, failed and done.
- Nick reviews each shell at full viewport before merge and accepts it as finished.

## 7. Build order and checkpoints

1. **Slice capture** (five Sonnet readers, then two for the document editor and presentation).
   Checkpoint: Nick sees the board and the gap list, and fills the gaps.
2. **Analysis doc, D26 and the family's catalog rows.** Checkpoint: Nick approves the family,
   including the collapse verdict and the Q6 verdict.
3. **In parallel:** Nick reviews the fidelity spec; U1 to U4 land.
4. **First app type PR** (document editor, unless the captures reorder it). Checkpoint: does the
   fidelity bar hold on a new shell? Adjust the template before the rest.
5. **The remaining app types**, one PR each, in §3.3's order as revised.

## 8. Out of scope

- The other unsampled categories in `gaps.md` §4: extraction, vision, predictive.
- Retrofitting the thirteen shipped shells (the fidelity spec owns that) and the per-shell flow
  gaps parked in `CONTINUE.md` §8.
- Family O: it stays at fourteen.
- Real backends. Demos run on fixtures.
- Building the orb.

## 9. Open questions

- ~~**Which Figma account holds the board.**~~ Settled 2026-09-25: the project's own file,
  [Super-AI-Design-System](https://www.figma.com/design/sJHbH5byHh9FI0vf2HUG3N/Super-AI-Design-System?node-id=14-2),
  page "AI types slice · 2026-09-25".
- **Family letter and membership.** Q is next, but `decisions.md` already uses Q1 to Q6 for
  open questions. Whether new components join this family or their natural ones (K for
  `search-steps`, N for the viewport); family P put both in one family. Owner: the analysis doc.
- **How the voice shell gets the orb:** a registry dependency, an `orb` slot the consumer
  fills, or vendoring. `CONTINUE.md` records that `npx shadcn add <third-party URL>` is unsafe
  here, which leans toward the slot. Owner: the voice PR.
- **What the agent viewport is** in a demo-only registry: a frame around a still, or something
  that renders a live surface. Owner: the slice, from what products show.
- **Whether the fidelity spec lands first** or this family pilots it. This spec assumes first.
  Owner: Nick, at fidelity review.

## 10. Handoff pointers

- Analysis: `docs/design-system/ai-types-board-analysis.md`; decision D26 in `decisions.md`.
- Screens: the Figma board only; its URL goes in the analysis doc's method section.
- Each app type PR: manifest task 0, then `pnpm new:component` per item, then the shell.
- Accessibility: the a11y exclusion list only shrinks. Run states that paint a muted surface
  rebind `--muted-foreground` rather than restyling slots.

---

## Changelog

- 2026-09-25: initial draft from the AI shell family brainstorm.
- 2026-09-25: board location settled; public capture pass run (5 Sonnet readers, about 1.06M
  tokens, 88 captures kept across 21 products).
- 2026-09-25: after the reference-board coverage check, Nick added the document editor
  (decision 6) and the presentation check for Q6 (decision 7); U3 of the fidelity spec takes
  the shell-slot gaps. The fidelity spec now travels on this branch.
- 2026-09-25: document editor and presentation sampled (two passes of two readers; the first
  skipped four products by misreading a numbered reply, the second covered them). The board
  holds 164 captures across 31 products; Nick's own-account captures are next.
