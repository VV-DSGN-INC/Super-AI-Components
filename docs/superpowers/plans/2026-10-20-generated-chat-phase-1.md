# Generated chat, phase 1: implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the `generated-chat` lib, three family R components and a `/generated-chat` demo page whose scripted replies answer in registry components.

**Architecture:** Replies are AI SDK 7 `UIMessage`s with typed `data-*` parts. A scripted `ChatTransport` streams known turns through `useChat`; two pure reducers own questions and views; `ReplyParts` renders parts through renderers the consumer passes. The demo composes O2 `chat-shell`, F7 `approval-card`, E6 `generation-queue` and P1 `data-views` around the new `widget`, `widget-grid` and `view-frame`.

**Tech stack:** Next 16.3.5, React 19.2.4, `ai@7.0.6`, `@ai-sdk/react@4.0.7`, Base UI, Tailwind 4, vitest, Storybook vitest addon, Playwright 1.60.

**Spec:** [`docs/superpowers/specs/2026-10-20-generated-chat-design.md`](../specs/2026-10-20-generated-chat-design.md)

## Global constraints

- Public tree. No client name, product name, scenario, person or data from the concept study anywhere: code, copy, tests, commit messages, PR body.
- Every new component follows `docs/design-system/component-build-brief.md` and `story-conventions.md`. Do not restate them here or in agent prompts; point at them.
- Registry strings are English at the call site (D22). No labels prop.
- Tokens only. `pnpm check:tokens` is the gate.
- `apps/docs/lib/catalog.manifest.ts` and `lib.manifest.ts` change only in tasks 1 and 6 and the integration task, never inside a component build.
- Pins: `ai` stays `7.0.6`; `@ai-sdk/react` is added at exactly `4.0.7`.
- Prose written for this tree uses no em dashes, except the `case-skip:` grammar, which requires one.
- Commits: `git -c user.name="weeeha" -c user.email="1083934+weeeha@users.noreply.github.com" commit`, with the attribution trailer.
- Nothing is pushed or deployed until Nick says so.

## Review focus

1. **A ready prompt typed in another case or with other punctuation** ("WHAT failed overnight") must reach the same turn. Test in task 1.
2. **A chip clicked while a reply streams** must not start a second reply. Test in task 11 (chips and send disabled unless `status === "ready"`).
3. **Approving a question that was already approved**, by clicking the source action again, must not run it twice. Test in task 3.
4. **Stop pressed mid-reply** must close the stream with the parts that arrived and emit nothing after. Test in task 2.
5. **Editing a view after pinning it** must leave the pinned copy unchanged. Test in task 4.

---

## File map

| File                                                            | Owns                                                            |
| --------------------------------------------------------------- | --------------------------------------------------------------- |
| `apps/docs/registry/super-ai/generated-chat.tsx`                | the lib: types, matching, transport, two reducers, `ReplyParts` |
| `apps/docs/registry/super-ai/generated-chat.test.tsx`           | its tests (split by `describe`, one per unit)                   |
| `apps/docs/registry/super-ai/{widget,widget-grid,view-frame}.*` | three components, five files each, built to the brief           |
| `apps/docs/components/generated-chat/fixtures.ts`               | scenario records and pure derivations, fixed today              |
| `apps/docs/components/generated-chat/turns.ts`                  | scripted turns and ready prompts                                |
| `apps/docs/components/generated-chat/renderers.tsx`             | card and widget renderers composing registry items              |
| `apps/docs/components/generated-chat/generated-chat-demo.tsx`   | the client demo: `useChat`, reducers, `ChatShell`, `ViewFrame`  |
| `apps/docs/app/generated-chat/page.tsx`                         | the route, server component                                     |
| `apps/docs/e2e/smoke.spec.ts`                                   | one new `describe` for the route                                |

---

### Task 1: Lib types and turn matching

**Files:**

- Modify: `apps/docs/package.json` (add `"@ai-sdk/react": "4.0.7"`), `pnpm-lock.yaml`
- Modify: `apps/docs/lib/lib.manifest.ts` (add `generated-chat`, status `"building"`, `npm: ["ai"]`, `shadcn: []`, target `lib/generated-chat.tsx`)
- Create: `apps/docs/registry/super-ai/generated-chat.tsx`, `generated-chat.test.tsx`

**Interfaces (produces):**

```ts
export type WidgetSize = "small" | "medium" | "large";
export interface CardData {
  type: string;
  props?: Record<string, unknown>;
}
export interface WidgetData {
  type: string;
  size: WidgetSize;
  props?: Record<string, unknown>;
}
export interface QuestionData {
  id: string;
  title: string;
  summary: string;
  undoable?: boolean;
  after?: TurnPart[];
}
export interface ViewCardData {
  viewId: string;
  title: string;
  kind: string;
}
export interface ViewVersion {
  label: string;
  mode: string;
  variant?: string;
}
export interface ViewInput {
  id: string;
  kind: string;
  title: string;
  scope: string;
  origin: string;
  version: ViewVersion;
}
export type ViewLayout = "docked" | "page";
export type ViewEffect =
  | { type: "build-view"; view: ViewInput }
  | { type: "edit-view"; id: string; version: ViewVersion }
  | { type: "show-view"; id: string; layout: ViewLayout };
export type GeneratedChatData = {
  card: CardData;
  widgets: { items: WidgetData[] };
  question: QuestionData;
  view: ViewCardData;
  suggestions: { items: string[] };
  effect: ViewEffect;
};
export type GeneratedChatMessage = UIMessage<never, GeneratedChatData>;
export type TurnPart =
  | { type: "text"; text: string }
  | { type: "data-card"; data: CardData }
  | { type: "data-widgets"; data: { items: WidgetData[] } }
  | { type: "data-question"; data: QuestionData }
  | { type: "data-view"; data: ViewCardData }
  | { type: "data-suggestions"; data: { items: string[] } };
export interface Turn<C = unknown> {
  id: string;
  match: string[];
  parts: TurnPart[] | ((ctx: C) => TurnPart[]);
  effects?: ViewEffect[] | ((ctx: C) => ViewEffect[]);
}
export function normalise(text: string): string;
export function findTurn<C>(text: string, turns: Turn<C>[], fallback: Turn<C>): Turn<C>;
export function hasScript<C>(text: string, turns: Turn<C>[]): boolean;
export function lastUserText(messages: GeneratedChatMessage[]): string;
```

- [ ] **Step 1: Add the dependency.** Run from `apps/docs`: `pnpm add @ai-sdk/react@4.0.7 --save-exact`. Expected: lockfile shows one `ai@7.0.6`, no second `ai` version (`pnpm why ai` lists only 7.0.6).
- [ ] **Step 2: Write the failing tests** in `generated-chat.test.tsx`, `describe("turn matching")`:
  - `normalise("  What's my DAY?! ")` → `"what s my day"`.
  - `findTurn("WHAT failed overnight", turns, fallback).id === "failed"` where `turns = [{ id: "failed", match: ["what failed overnight"], parts: [] }]`.
  - `findTurn("anything else", turns, fallback) === fallback`; `hasScript("anything else", turns) === false`.
  - No turn can match into the fallback: `findTurn("", [...turns, fallback], fallback) === fallback` with `fallback.match = []`.
  - `lastUserText` joins the text parts of the last `role: "user"` message and returns `""` when there is none.
- [ ] **Step 3: Run** `pnpm vitest run registry/super-ai/generated-chat.test.tsx`. Expected: FAIL, module exports missing.
- [ ] **Step 4: Implement** the types and the four functions. `normalise`: lower case, `[^a-z0-9 ]+` to a space, collapse whitespace, trim.
- [ ] **Step 5: Run** the same command. Expected: PASS.
- [ ] **Step 6: Commit** `feat(generated-chat): lib types and turn matching`.

### Task 2: The scripted transport

**Files:** `generated-chat.tsx`, `generated-chat.test.tsx`

**Interfaces:**

- Consumes: task 1 types.
- Produces:

```ts
export interface ScriptedTransportOptions<C> {
  turns: Turn<C>[];
  fallback: Turn<C>;
  stepMs?: number /* default 350 */;
  context?: () => C;
}
export function createScriptedTransport<C>(
  o: ScriptedTransportOptions<C>,
): ChatTransport<GeneratedChatMessage>;
```

Chunk order for one reply: `start`, then per part either `text-start`/`text-delta` (whole text)/`text-end` or one `data-<name>` chunk with a stable `id`, waiting `stepMs` between parts; then each effect as `{ type: "data-effect", data, transient: true }`; then `finish`. `reconnectToStream` resolves `null`. Read the chunk shapes from `node_modules/ai/dist/index.d.ts` (`UIMessageChunk`) before writing.

- [ ] **Step 1: Failing tests**, `describe("createScriptedTransport")`, reading the stream with `readUIMessageStream` from `ai` and keeping the last message:
  - A two-part turn (text, suggestions) yields one assistant message whose parts are `[{type:"text"}, {type:"data-suggestions"}]` in that order, text equal to the turn's text.
  - An effect never appears in the message parts; collect raw chunks and assert one chunk `{ type: "data-effect", transient: true }` arrives after the last part chunk and before `finish`.
  - A function turn receives `context()`'s value.
  - Unknown input plays the fallback.
  - Abort after the first part (`stepMs: 20`, abort at 25 ms): the stream closes, the message holds exactly one part, and no chunk is enqueued after close (spy on `controller.enqueue` via the raw reader count staying fixed for 100 ms).
- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement** with a `ReadableStream` whose `start` awaits a timer per part and checks `abortSignal.aborted` before every enqueue.
- [ ] **Step 4: Run.** Expected: PASS.
- [ ] **Step 5: Commit** `feat(generated-chat): scripted transport`.

### Task 3: The question store

**Files:** `generated-chat.tsx`, `generated-chat.test.tsx`

**Interfaces (produces):**

```ts
export type QuestionStatus = "requested" | "approved" | "skipped" | "undone";
export interface QuestionState {
  status: Record<string, QuestionStatus>; // latest status per question id
  cards: Record<string, string>; // id -> the card key showing it now
  settled: Record<string, QuestionStatus>; // card key -> status frozen when superseded
  openId: string | null;
}
export type QuestionAction =
  | { type: "ask"; id: string; cardKey: string }
  | { type: "answer"; id: string; approved: boolean }
  | { type: "undo"; id: string };
export const initialQuestionState: QuestionState;
export function questionReducer(s: QuestionState, a: QuestionAction): QuestionState;
export function questionStatusFor(s: QuestionState, id: string, cardKey: string): QuestionStatus | undefined;
export function isQuestionLocked(status: QuestionStatus | undefined): boolean; // requested or approved
export function questionId(...inputs: (string | number)[]): string; // inputs joined with "-", normalised
```

- [ ] **Step 1: Failing tests**, `describe("questionReducer")`:
  - ask `q1` then ask `q2`: `status.q1 === "skipped"`, `openId === "q2"`.
  - ask, answer approved, ask the same id again from a new card: state is returned unchanged (`toBe` the same object). (Review focus 3.)
  - ask from card A, answer skipped, ask again from card B: `questionStatusFor(s, id, "A") === "skipped"`, for `"B"` it is `"requested"`.
  - undo from approved gives `"undone"`; undo from requested or skipped returns the same object.
  - `isQuestionLocked` is true for requested and approved only.
  - `questionId("retry", "r2", "r1")` equals `questionId("retry", "r2", "r1")` and differs from `questionId("retry", "r1")`.
- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement.** On ask with a different card key than `cards[id]`, stamp `settled[cards[id]] = status[id]` first.
- [ ] **Step 4: Run.** Expected: PASS.
- [ ] **Step 5: Commit** `feat(generated-chat): question store`.

### Task 4: The view store

**Files:** `generated-chat.tsx`, `generated-chat.test.tsx`

**Interfaces (produces):**

```ts
export interface ViewSpec {
  id: string;
  kind: string;
  title: string;
  scope: string;
  origin: string;
  versions: ViewVersion[];
  current: number;
  pinned: boolean;
  ranAt: number;
}
export interface ViewState {
  views: Record<string, ViewSpec>;
  activeId: string | null;
  layout: ViewLayout;
  recentId: string | null;
}
export type ViewAction =
  | { type: "effect"; effect: ViewEffect; at: number }
  | { type: "show"; id: string; at: number } // keeps layout
  | { type: "open"; id: string; at: number } // layout "page"
  | { type: "edit"; id: string; version: ViewVersion; at: number }
  | { type: "undo"; id: string }
  | { type: "pin"; id: string }
  | { type: "rerun"; id: string; at: number }
  | { type: "close" };
export const initialViewState: ViewState; // layout "docked"
export function viewReducer(s: ViewState, a: ViewAction): ViewState;
export function currentVersion(v: ViewSpec): ViewVersion;
export function pinnedId(id: string): string; // `pin:${id}`
```

- [ ] **Step 1: Failing tests**, `describe("viewReducer")`:
  - A `build-view` effect adds the view, sets `recentId`, and leaves `activeId` null. A turn builds; it never shows.
  - `show` sets `activeId` and keeps `layout`; `open` sets `activeId` and `layout: "page"`.
  - A `show-view` effect sets `activeId` and the given layout.
  - `edit` after `undo` drops the undone version (`versions.length` back to `current + 1` before appending).
  - `pin` stores a copy under `pin:<id>` with `pinned: true`; a later `edit` of `<id>` leaves `views["pin:<id>"].versions` unchanged. (Review focus 5.)
  - `rerun` updates `ranAt` only.
  - Actions on an unknown id return the same object.
- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run.** Expected: PASS.
- [ ] **Step 5: Commit** `feat(generated-chat): view store`.

### Task 5: `ReplyParts`

**Files:** `generated-chat.tsx`, `generated-chat.test.tsx`

**Interfaces (produces):**

```ts
export interface ReplyRenderers {
  cards: Record<string, React.ComponentType<Record<string, unknown>>>;
  widgets?: Record<string, Partial<Record<WidgetSize, React.ComponentType<Record<string, unknown>>>>>;
  widgetGrid?: (items: { key: string; size: WidgetSize; node: React.ReactNode }[]) => React.ReactNode;
  question?: (data: QuestionData, cardKey: string) => React.ReactNode;
  view?: (data: ViewCardData) => React.ReactNode;
  suggestions?: (items: string[]) => React.ReactNode;
  text?: (text: string, streaming: boolean) => React.ReactNode;
}
export function ReplyParts(props: {
  message: GeneratedChatMessage;
  renderers: ReplyRenderers;
  streaming?: boolean;
}): React.ReactNode;
```

Card key is `${message.id}:${partIndex}`. Default `text` renders a `<p data-slot="reply-text" className="whitespace-pre-wrap">`. Parts render in message order inside `<div data-slot="reply-parts" className="flex min-w-0 flex-col gap-3">`. `data-effect` parts, if a consumer persisted any, render nothing.

- [ ] **Step 1: Failing tests**, `describe("ReplyParts")` with `@testing-library/react`:
  - Renders text, a registered card with its props, then suggestions, in DOM order.
  - Passes `"<messageId>:<index>"` as the question's card key.
  - An unregistered card type throws in test (NODE_ENV `test`), naming the type in the message.
  - A widgets part calls `widgetGrid` with one entry per item, sizes preserved.
- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement.** Throw only when `process.env.NODE_ENV !== "production"`; render `null` otherwise.
- [ ] **Step 4: Run** the file, then `pnpm typecheck` and `pnpm check:tokens` from `apps/docs`. Expected: PASS, clean, clean.
- [ ] **Step 5: Commit** `feat(generated-chat): ReplyParts renderer`.

### Task 6: Family R prep and scaffold

**Files:**

- Modify: `apps/docs/lib/manifest-types.ts` (add `"R"` to `FamilyId` with a comment citing D26)
- Modify: `apps/docs/lib/catalog.manifest.ts` (three rows, below)
- Modify: `apps/docs/lib/catalog.manifest.test.ts` (assert `family === "R"` has length 3, beside the P and Q lines)
- Modify: `docs/design-system/catalog.md` (a `## R · Generated chat — 3` table after Q), `component-specs.md` (`## R1 widget`, `## R2 widget-grid`, `## R3 view-frame`), `decisions.md` (D26: family R)
- Create via scaffold: five files per item

Manifest rows (status `"building"`, wave 14, layer `"component"`):

| id  | name          | base                            | states                                                                | specAnchor                          |
| --- | ------------- | ------------------------------- | --------------------------------------------------------------------- | ----------------------------------- |
| R1  | `widget`      | card, button, skeleton, tooltip | `small`, `medium`, `large`, `loading`, `openable`, `header-hidden`    | `component-specs.md#r1-widget`      |
| R2  | `widget-grid` | (none)                          | `two-column`, `four-column`, `mixed-sizes`                            | `component-specs.md#r2-widget-grid` |
| R3  | `view-frame`  | button                          | `docked`, `page`, `with-modes`, `with-ask-bar`, `rerunning`, `failed` | `component-specs.md#r3-view-frame`  |

Each `component-specs.md` entry carries: what it is (from spec §4.2), its parts with `data-slot` names, its states, the composition it must use, and Evidence. Evidence is desk research and says so: R1 and R2 cite Apple WidgetKit's small, medium and large families and the iOS and macOS widget galleries; R3 cites ChatGPT's canvas and Claude's artifacts panel (a generated surface beside the conversation with its own header, version and actions). Do not name the concept study.

- [ ] **Step 1:** Edit the docs and the manifest as above.
- [ ] **Step 2:** From `apps/docs`, run `pnpm new:component widget`, `pnpm new:component widget-grid`, `pnpm new:component view-frame`. Expected: five files each, tests red.
- [ ] **Step 3:** Run `pnpm vitest run lib/catalog.manifest.test.ts`. Expected: PASS (the new family assert included).
- [ ] **Step 4: Commit** `chore(family-r): manifest, specs and scaffolds for widget, widget-grid, view-frame`.

### Tasks 7 to 9: Build R1, R2, R3 (parallel)

One agent per item, each in its own worktree cut from this branch after task 6 (verify the base commit has the scaffolds). Each agent receives only: a pointer to `component-build-brief.md`, its `component-specs.md` anchor, its states, and the steering below. Agents never touch the manifest, never commit to this branch, and report in the brief's terse format.

**R1 `widget` steering.** Compose `card`, `button`, `skeleton`, `tooltip`. Props: `size: WidgetSize`, `title: string`, `icon?`, `meta?`, `action?: React.ReactNode`, `onOpen?: () => void`, `openLabel?: string` (required when `onOpen` is set, typed as a union so it cannot be missing), `hideHeader?: boolean`, `loading?: boolean`, `children`. Whole-tile open is one native `<button>` overlay, first in tab order, ring drawn on the overlay. `onOpen` and `action` are mutually exclusive in the type. The body clips, never scrolls. `hideHeader` moves the header to `sr-only`, never removes it. Height is `h-full`; the grid sizes the tile.

**R2 `widget-grid` steering.** `WidgetGrid` (an `@container` wrapper plus the grid) and `WidgetGridItem` (`size` sets the span: small 1×1, medium 2×1, large 2×2). Two columns below `43.5rem` of its own width, four from there; `grid-auto-rows` matches the column width so tiles stay square, gap from the spacing scale used by the row calc so the two cannot drift. Export the literal as `FOUR_COLUMN_MIN_REM = 43.5`. Plain `div`s, no list semantics; say so in the accessibility notes.

**R3 `view-frame` steering.** Compound: `ViewFrame` (`title` names the section; `aria-labelledby` wins when given), `ViewFrameHeader`, `ViewFrameTitle`, `ViewFrameDescription`, `ViewFrameActions`, `ViewFrameAction` (ghost icon `button`, required `label` used as accessible name and hover title, 44px target below 768px), `ViewFrameContent` (the one scroll region, `min-h-0 flex-1 overflow-auto`, focusable for axe), `ViewFrameFoot` (renders nothing without children), `ViewFrameFooter`. The header wraps; the title keeps a `basis-56` floor; actions go full width and wrap below `md`. The frame owns no mode tabs, versions or rerun logic: the `rerunning` and `failed` states are stories that show the caller's skeleton and the caller's `Alert` with Retry inside `ViewFrameContent`.

For each agent:

- [ ] **Step 1:** Fill the five files per the brief; replace every red test.
- [ ] **Step 2:** Run, from `apps/docs`, `pnpm vitest run registry/super-ai/<name>.test.tsx`, `pnpm typecheck`, `pnpm check:tokens`. Expected: all green.
- [ ] **Step 3:** Run `pnpm contract:emit`; stage only its own files.
- [ ] **Step 4:** Report per the brief.

### Task 10: Integrate

- [ ] **Step 1:** Land the three agents' files on this branch; check each against task 6's scaffold, not against `main`.
- [ ] **Step 2:** Reconcile deps from real imports (`CONTINUE.md` §3.5 loop), set `shadcn`, `consumes`, `npm`, flip all three to `"shipped"`, flip `generated-chat` in `lib.manifest.ts` to `"shipped"`.
- [ ] **Step 3:** From `apps/docs`: `pnpm contract:emit && pnpm facts:emit && pnpm gen:wiring && pnpm check:contract && pnpm story-coverage:report widget widget-grid view-frame`. Expected: contract green, zero unmet obligations.
- [ ] **Step 4:** From the root, in `ci.yml` order: `pnpm lint && pnpm format:check && pnpm typecheck && pnpm check:tokens && pnpm check:contract && pnpm test`, then `pnpm build:registry && pnpm build`, then `cd apps/storybook && rm -rf node_modules/.cache/storybook && pnpm test:stories`. Expected: all green.
- [ ] **Step 5: Commit** `feat(family-r): widget, widget-grid and view-frame`.

### Task 11: The demo page

**Files:**

- Create: `apps/docs/components/generated-chat/{fixtures.ts,fixtures.test.ts,turns.ts,turns.test.ts,renderers.tsx,generated-chat-demo.tsx,generated-chat-demo.test.tsx}`
- Create: `apps/docs/app/generated-chat/page.tsx`
- Modify: `apps/docs/e2e/smoke.spec.ts`, and add a link to `/generated-chat` wherever `/openui` is linked from the site

**Interfaces:**

- Consumes: everything from tasks 1 to 5, and `Widget`, `WidgetGrid`, `WidgetGridItem`, `ViewFrame*` from tasks 7 to 9.
- Produces (`fixtures.ts`):

```ts
export const TODAY: Date; // new Date(2026, 9, 20, 9, 0)
export type RunKind = "image" | "video" | "audio";
export interface Run {
  id: string;
  at: string;
  kind: RunKind;
  project: string;
  prompt: string;
  model: string;
  status: "done" | "failed" | "running";
  reason?: string;
  credits: number;
  overnight: boolean;
  progress?: number;
}
export const PLAN: { credits: 2000; used: 1640; resetsOn: "Nov 1"; resetsInDays: 12 };
export const RUNS: Run[]; // 26 overnight (23 done, 3 failed), 3 running, 2 earlier failures
export function failedOvernight(runs?: Run[]): Run[];
export function timedOutOvernight(runs?: Run[]): Run[];
export function creditsLeft(): number; // 360
export function retryCost(runs: Run[]): number; // 80 for the two timed-out video runs
export function weekSpend(): { video: number; image: number; audio: number }; // 420, 150, 40
```

- Produces (`turns.ts`): `READY_PROMPTS: string[]` (`"What failed overnight?"`, `"What's my day?"`, `"How much have we spent this week?"`), `TURNS: Turn<DemoContext>[]`, `FALLBACK: Turn<DemoContext>`, `type DemoContext = { viewBuilt: boolean }`.

Turns, in the copy the draft fixed (`docs/drafts/generated-chat.html`): "What failed overnight?", "Why was the poster blocked?", "Track failed runs" (builds `failed-runs`, kind `runs`, modes table and board), "Make it a board" (an `edit-view` effect when `viewBuilt`, otherwise asks to track first), "What's my day?" (two small widgets and one medium), "How much have we spent this week?" (a `stat-readout` card). The retry question is not a turn: the failed-runs card's action calls `requestQuestion` with `questionId("retry", ...ids)`, title "Retry 2 video runs?", summary naming Video HD, the cost and what is left, `undoable: true`, `after` = the "Queued" text and chips.

Card renderers (`renderers.tsx`): `failed-runs` composes `GenerationQueue` (items in state `failed`, `errorMessage` the reason) plus one primary `Button` disabled while the question is locked; `week-spend` composes `StatReadout` and `CostChip`. Widgets: `credits` (small), `failed` (small), `running` (medium) inside `Widget`. The question renders as `ApprovalCard` with `onConfirm`, `onSkip`, `onUndo`, `undoWindowMs={10000}`, state from `questionStatusFor`. The view card is an `EntityRow` with a Show button that reads "Showing" while active. Suggestions render as `SuggestionChips`.

The demo (`generated-chat-demo.tsx`): `useChat({ transport, onData })` where `onData` dispatches `data-effect` parts to `viewReducer`; `ChatShell` with `messages` mapped to `<ReplyParts>`; composer `generating` while `status !== "ready"`, `onStop` calls `stop()`. When `activeId` is set, the page lays out a `ViewFrame` (flex-1) beside the shell (fixed `w-96` at `lg`, a Chat/View toggle below `lg`). Approving a question appends its `after` parts as a new assistant message with `setMessages`.

- [ ] **Step 1: Failing tests:**
  - `fixtures.test.ts`: overnight runs total 26, failed 3, timed out 2, `creditsLeft() === 360`, `retryCost(timedOutOvernight()) === 80`, week spend sums to 610.
  - `turns.test.ts`: every `READY_PROMPTS` entry and every chip string any turn emits resolves through `findTurn` to a turn other than `FALLBACK`; no two turns share a match string.
  - `generated-chat-demo.test.tsx` with `stepMs: 0`: the hero path. Click "What failed overnight?", see the three failures; click "Retry 2 timed-out runs", see "Retry 2 video runs?"; Confirm, see "Queued"; click "Track failed runs", the view card appears and no view frame is shown; click Show, the frame titled "Failed runs this week" appears. And: while a reply streams (`stepMs: 50`), chips and send are disabled. (Review focus 2.)
- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement** fixtures, turns, renderers, the demo and the page. Page header copy: one paragraph saying replies are scripted, the workspace is a fixture, and no model is called; link the spec's public sections only.
- [ ] **Step 4: Run** the three test files, `pnpm typecheck`, `pnpm check:tokens`, `pnpm lint`. Expected: green.
- [ ] **Step 5: Smoke.** Add `test.describe("/generated-chat")` mirroring `/openui`'s: at 1280 and 375, play the hero path to the shown view, assert no console error and no sideways scroll. Rebuild (`pnpm build`), then `pnpm exec playwright test e2e/smoke.spec.ts -g generated-chat`. Expected: PASS.
- [ ] **Step 6: Commit** `feat(generated-chat): demo page`.

### Task 12: Verify and open the PR

- [ ] **Step 1:** Rendered sweep in Chromium and WebKit at 375, 768 and 1440 of the hero path, dark and light, with screenshots kept in the session scratchpad.
- [ ] **Step 2:** unslop Phase 2 per `.claude/skills/unslop/SKILL.md`: `node packages/ds-rules/rulecheck.mjs --json`, fix findings by substitution.
- [ ] **Step 3:** Full gate list from task 10 step 4, then `apps/docs/scripts/consumer-test.sh`.
- [ ] **Step 4:** Ask Nick before pushing. On his go: push `claude/generated-chat`, open the PR against `main` citing the spec, and report the preview link.
