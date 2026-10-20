# Generated chat: replies that answer in registry components

**Date:** 2026-10-20 · **Owner:** Nick · **Status:** Approved direction, build started · **Baseline:** `main` at `fdf3a49`
**Related:** O2 `chat-shell` ([`block-specs.md`](../../design-system/block-specs.md)) · F7 `approval-card` · P1 `data-views` · the `/openui` page and [`openui-catalog.ts`](../../../apps/docs/scripts/lib/openui-catalog.ts) · [agentic contracts](2026-09-14-agentic-contracts-design.md) · D18, D20, D22

**TL;DR.** A chat whose answers are registry components. An assistant reply is a list of
AI SDK 7 message parts: text, plus typed data parts for a card, a row of widgets, a question
asked before an action, a saved view and follow-up chips. Two producers write those parts. A
scripted transport plays known turns as a real stream, and a model reaches the same parts
through tools. One renderer draws them from the registry. Phase 1 ships the engine as a
`registry:lib` item, three new components (`widget`, `widget-grid`, `view-frame`) and a demo
page. Phase 2 moves O2 `chat-shell` onto the parts. Phase 3 lets a model write a view's body
in OpenUI Lang over this registry's own catalog.

## 1. Decisions

### 1.1 Made with Nick, 2026-10-20

1. **Order: phase 1, then phase 2, then phase 3.** Nick picked the full port first, then the
   chat-shell adoption and the generated view bodies, from three options.
2. **The precedent is cited, never copied.** A private client concept study (October 2026)
   built this pattern on another stack and wrote up its architecture. This spec takes the
   architecture's lessons. No file, string, scenario, name or data from that study enters
   this public tree, and every file here is written new.
3. **Draft, then build.** An HTML draft of the demo goes to Nick before the components are
   merged, so the look can be redirected early.

### 1.2 Calls made in this spec (override any)

4. **Build on AI SDK 7, not a private parts union.** The registry already depends on `ai@7`
   and vendors AI Elements' conversation and message. Its consumers already hold a `useChat`.
   So a reply is a `UIMessage`, the extra UI rides as `data-*` parts, and scripted turns are a
   `ChatTransport`. A consumer swaps the scripted transport for `DefaultChatTransport` and
   keeps every renderer.
5. **Effects ride as transient data parts.** A turn that builds or edits a view writes a
   `data-effect` part with `transient: true`. `useChat` hands it to `onData` and never stores
   it, which is exactly "effects are data the host applies".
6. **The question card is F7 `approval-card`.** It already carries the title, the one sentence,
   Confirm and Skip, a submitting state and an undo window. No new component. Its fixed verbs
   ("Confirm", "Skip") do not name the outcome, so the title and summary must: the summary
   says what happens, to whom, and what it costs.
7. **New items are family R, "Generated chat".** Same reasoning as D18 and D20: their evidence
   is desk research plus the concept study, not the reference board, so filing them under F, J
   or K would lend them footing they lack. Collision noted: `gaps.md` uses "R" for recovered
   omissions. Different file, different namespace, as D20 recorded for Q.
8. **"View", not "artifact".** In this registry an artifact is a generated document (J4
   `artifact-grid`, O9 `artifact-shell`). A view is a saved question that reruns on open. The
   frame is `view-frame`.

## 2. Measured state at baseline

- 118 shipped items, 4 `registry:lib` contracts. A to O frozen at 114; P and Q counted apart.
- O2 `chat-shell` renders each message as a string through AI Elements `Message`, with feedback
  and J4 artifact cards. A reply cannot carry a component, a question or a view.
- F7 `approval-card` is the Approval contract's only implementation.
- `/openui` replays recorded OpenUI Lang answers over registry surfaces, read from
  `public/openui/catalog.json`, which `openui:emit` derives from the contract metas. No model.
- `ai@7.0.6` is installed. `@ai-sdk/react` is not; `4.0.7` is the release built against it.
- No tile family exists. The nearest items are `preview-tile` (the picker atom),
  `stat-readout` (a `dl` of figures) and `recent-grid`.
- The Minimal Design System (`@weeeha/ui`) ships `confirmation`, `message`, `prompt-input`,
  `conversation` and `code-block`. None of the three new items exists there. The overlap rule
  in `CLAUDE.md` is satisfied: this repo owns tiles, the view frame and the engine.

## 3. The pattern

| #   | Rule                                                                                                                                                         | Why                                                                                              |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| 1   | A reply is a list of typed parts. A new kind of UI is a new card type, rarely a new part type                                                                | One renderer to test, and a script and a model can never disagree about what a reply holds       |
| 2   | Script first; the model is a second producer of the same parts                                                                                               | Known prompts stay exact, the model adds reach, and any model failure falls back to the script   |
| 3   | Effects are data. A turn queues them, the host applies them                                                                                                  | The view store never changes inside a render, and tests run without view code                    |
| 4   | One primary action per card, classed by who it affects                                                                                                       | Each card has one next step                                                                      |
| 5   | Reading runs a new turn. Your own data changes at once with Undo. Anything that affects other people or spends money asks first, one open question at a time | Asking is reserved for what cannot be quietly taken back                                         |
| 6   | A view stores its question, never its rows, and reruns on open. A turn builds it; only a click shows it, unless the person named it                          | Views never go stale, and the screen never changes under the reader without a gesture            |
| 7   | Data is records plus pure derivations against a fixed today                                                                                                  | Two cards cannot show different counts for one fact                                              |
| 8   | Done means rendered in Chromium and WebKit at 375, 768 and 1440, and a prompt change is measured over six or more live samples                               | Stories at assumed widths pass while the real column clips; one good model sample proves nothing |

## 4. Phase 1: the engine, three items and a demo

### 4.1 `generated-chat` (`registry:lib`, `lib/generated-chat.tsx`)

Plain TypeScript plus one renderer. Depends on `ai` only; no `@ai-sdk/react`, so a consumer
keeps whichever `useChat` they already run.

**The message.** `GeneratedChatMessage = UIMessage<never, GeneratedChatData>`, with these data
parts:

| Part                      | Data                                 | Renders as                                     |
| ------------------------- | ------------------------------------ | ---------------------------------------------- |
| `data-card`               | `{ type, props }`                    | the consumer's card registered under `type`    |
| `data-widgets`            | `{ items: { type, size, props }[] }` | a `widget-grid` of registered widgets          |
| `data-question`           | `{ id, title, summary, undoable? }`  | an `approval-card` bound to the question store |
| `data-view`               | `{ viewId, title, kind }`            | a card that shows the built view on click      |
| `data-suggestions`        | `{ items: string[] }`                | `suggestion-chips`, always last                |
| `data-effect` (transient) | a view effect                        | nothing; the host's `onData` applies it        |

**Turns.** `Turn = { id, match: string[], parts, effects? }`. Matching is exact after
normalising (lower case, punctuation to spaces, collapsed). No fuzzy match: every phrasing a
chip or a person might use is listed. `FALLBACK_TURN` has no match strings and answers with the
ready prompts as chips. It never claims to lack access.

**`createScriptedTransport({ turns, fallback, stepMs })`** returns a `ChatTransport`. It reads
the last user message, finds the turn and streams its parts as `UIMessageChunk`s, one part per
step, honouring the abort signal. A scripted reply streams through the same `useChat` state a
model reply does, so there is one reveal clock, not two.

**The question store.** A pure reducer over `{ status: Record<id, Status>, settled:
Record<cardKey, Status> }`, with `ask`, `answer` and `undo`. Asking closes any other open
question as skipped and stamps the old card's own key, so an earlier card keeps the answer it
got. A card renders `settled[cardKey] ?? status[id]`. Asking an approved question again does
not re-run it. A question's id is derived from everything its sentence names, so editing the
inputs makes a new question.

**The view store.** A pure reducer: `build` (upsert, never shows), `show` (shows, keeps the
layout), `open` (shows as the page), `edit` (appends a version after `current`), `undo`, `pin`
(takes a copy under `pin:<id>`), `rerun` (stamps `ranAt`), `close`. Merging `show` and `open`
is the most likely porting mistake; the tests keep them apart.

**`ReplyParts`.** Renders one message's parts through a `renderers` map the consumer passes.
An unknown card or widget type throws in development and renders nothing in production, so a
typo fails in the story that caused it.

### 4.2 Three components, family R

| ID  | Name          | What it is                                                                                                                                                                            | States                                                                |
| --- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| R1  | `widget`      | A fixed-size tile: small (1×1), medium (2×1), large (2×2). Icon, title, meta, one action or a whole-tile open button, a body that clips, a skeleton while loading                     | `small`, `medium`, `large`, `loading`, `openable`, `header-hidden`    |
| R2  | `widget-grid` | A container-query grid: two columns below 43.5rem of its own width, four from there. Rows match the column width, so tiles stay square                                                | `two-column`, `four-column`, `mixed-sizes`                            |
| R3  | `view-frame`  | The chrome of a generated view: header with a title floor and a wrapping actions row, a scrolling content part, an in-flow foot slot for an ask bar, a footer with origin and version | `docked`, `page`, `with-modes`, `with-ask-bar`, `rerunning`, `failed` |

All three are props-only. `widget` composes `card`, `button`, `skeleton` and `tooltip`.
`view-frame` composes `button` and leaves mode tabs, Undo, Pin and Share to the caller as
children, so it carries no view logic. Tile sizes are fixed families, not one elastic tile,
because each size is a layout that can be tested at its exact size.

### 4.3 The demo page, `/generated-chat`

A docs-site page beside `/openui`, with the scripted transport behind `useChat`. Its scenario
is a small team's generation workspace, fixed at Tuesday 20 October 2026, 09:00:

- 26 runs overnight across three projects (an image campaign, an onboarding video, a podcast
  intro). Three failed: two video runs timed out, one image run was blocked by the content
  filter.
- A monthly plan of 2,000 credits, 1,640 used, resetting in 12 days.
- Every number is derived from the run records. No company or person is named.

The hero path:

1. "What failed overnight?" Text, then a `generation-queue` card of the three failures with
   one action, "Retry 2 timed-out runs".
2. The action asks first: an `approval-card` titled "Retry 2 video runs?" whose summary names
   the model and the cost (80 credits, `cost-chip`). Confirm queues them; the receipt keeps a
   10-second Undo.
3. "Track failed runs" builds a view and posts its card. A click shows it docked: a
   `view-frame` around `data-views` (table, board), rerun on open.
4. "What's my day?" answers with four small widgets: credits left, running now, failed
   overnight, next reset. A small tile asks for its larger answer.
5. Anything off-script gets the fallback with the ready prompts.

### 4.4 Wave 2: the real model

An `/api/chat` route on the docs site through Vercel AI Gateway. The system prompt is built
from the same fixture modules the page reads. Three read-only tools (`show_card`,
`build_view`, `suggest_followups`) write the same data parts the script does; each result
carries a note that matches its description. The step plan guarantees words and chips. Any
failure, before or during the stream, falls back to the scripted reply. Limits: POST only, a
body cap, the last 12 messages, an output cap, a per-address rate limit and a kill switch.
Wave 2 needs a gateway credential on the docs project and Nick's go before it deploys.

## 5. Phase 2: `chat-shell` answers in parts

Approved as drafted (Nick, 2026-10-20). The phase 1 demo had to build the docked view around O2,
and the sweep found three O2 gaps around generated replies. Phase 2 moves the docked view into
the shell and closes those gaps.

- **A `view` region.** `ChatShell` takes `view?: ReactNode`. From `lg` the view is the main area
  and the stream narrows to 24rem beside it. Below `lg` they stack: the view on top, the stream
  under it. Opening a view collapses the sidebar to its icon rail; closing it restores whatever
  the sidebar was. The region list gains `view`.
- **The rail shows icons only.** B6 `thread-list` rows gain an optional `icon`. Inside a
  collapsed sidebar a row shows its icon alone, its title kept as the accessible name, and the
  section labels and row menus hide. The shell gives every thread a default icon and hides its
  empty state in the rail.
- **The artifacts region can wait for an artifact.** `artifactsWhenEmpty?: "show" | "hide"`,
  default `"show"`. Ruling: the draft hid it by default, but O2 recorded "always mounted, so the
  region is discoverable on day one", and every current consumer relies on that. Opt-in keeps
  both.
- **An assistant turn fills the column**, so a reply that is only a card is never shrink-wrapped.
- **Messages stay `ReactNode`.** A consumer passes `<ReplyParts>` as a turn's content. Ruling: O2
  takes no dependency on the `generated-chat` lib, so a block never imports a contract it does
  not need.
- The demo page moves back onto O2.

## 6. Phase 3: generated view bodies

Approved as drafted (Nick, 2026-10-20).

- **R4 `generated-body`** renders an OpenUI Lang program with the consumer's library. It streams
  line by line. When the stream ends with parse errors (a component the catalog does not expose,
  a bad argument), it shows a status alert naming the failure, a Retry button when the caller
  gives one, and the last version that rendered under it. It reports each finished render as
  rendered or failed, so the caller can track the last good version. It owns no timers and no
  versions. npm: `@openuidev/react-lang`.
- **The demo** gains a generated view. "Show spend by project" builds it. "Add a daily trend"
  makes a version that uses `Chart`, which the catalog does not expose, so it fails, keeps the
  last good version and offers Retry. Retry asks for the trend as a table, which renders.
- **Programs are recorded**, built from the spend records the rest of the page reads. No model
  is called. The catalog is the one `/openui` already uses, so a body can only contain surfaces
  that exist; overlays and charts stay excluded.

## 7. Alternatives considered

- **A private parts union and reducer, as the precedent used.** Rejected: it would ship a
  second chat state beside the `useChat` every consumer already runs, and the scripted and
  model paths would need two reveal clocks.
- **One `question-card` component.** Rejected: F7 already is the Approval contract, and a
  second implementation is the fork the block brief forbids.
- **Name the frame `artifact`.** Rejected: collides with J4 and O9's meaning in this registry.
- **Glob-registered card files, as the precedent used.** Rejected for the registry: a consumer's
  bundler is unknown, so registration is an explicit `renderers` object.

## 8. Constraints

- Public tree: no client name, product name, scenario or data from the concept study.
- `component-build-brief.md` governs the three items: five files each, contract emitted, case
  stories or written skips, axe green, `check:tokens` green.
- Registry strings are English at the call site (D22).
- `apps/docs/lib/catalog.manifest.ts` changes only in the integration commit.
- A new npm dependency is `@ai-sdk/react@4.0.7`, pinned to the installed `ai`, for the demo only.

## 9. Success criteria

1. `shadcn add` of `generated-chat`, `widget`, `widget-grid` and `view-frame` installs and
   typechecks in a fresh app (`consumer-test.sh`).
2. The hero path plays end to end on `/generated-chat` in Chromium and WebKit at 375, 768 and
   1440, with no horizontal scroll and no console error.
3. Every offered chip and ready prompt resolves to a turn; a test fails when one does not.
4. The reducers are tested with injected turns and no view code.
5. All twelve CI steps green.

## 10. Build order and checkpoints

1. This spec, then the HTML draft to Nick.
2. The lib with its tests.
3. Manifest prep, scaffold, then the three items in parallel worktrees.
4. Integration: reconcile deps, emit contracts and facts, all gates.
5. The demo page, rendered sweep, PR. Deploy waits for Nick.
6. Wave 2, then phase 2 and phase 3, each its own PR.

## 11. Out of scope

- Actions taken by the model. Its tools stay read-only; it points to the scripted flow that
  asks first.
- Comments on views, real sharing, persistence beyond per-viewer `localStorage`.
- Charts in replies. They wait for a surface designed against the palette rules.

## 12. Open questions

1. Should `widget` expose `size` as a prop the grid also reads, or should the grid item own the
   span alone? Proposed: both carry it, and a test fails when they disagree.
2. Does wave 2 deploy to production with the model on, or stay on preview until a live eval?
   Proposed: preview until six-sample evals of the hero questions pass.

## Changelog

- 2026-10-20: first version, after Nick picked phase 1, then 2 and 3.
- 2026-10-20: §5 and §6 detailed after Nick approved the phase 2 and 3 draft as drawn.
