# Generated chat, phases 2 and 3: implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** O2 `chat-shell` owns the docked view and closes its three gaps (phase 2); a view body can be a generated OpenUI program with a last-good fallback (phase 3).

**Spec:** [`2026-10-20-generated-chat-design.md`](../specs/2026-10-20-generated-chat-design.md) §5 and §6. **Base:** phase 1 at `c7a9b3a`.

## Global constraints

The phase 1 plan's constraints hold: public tree, the build brief, English strings at the call
site, tokens only, `weeeha` commits, nothing pushed. Changes to shipped items (B6, O2) are
additive: every existing prop, story and test keeps its meaning.

## Review focus

1. A consumer that never passes `view`, `artifactsWhenEmpty` or `icon` sees no change.
2. Closing a view restores the sidebar to what the user had, open or collapsed.
3. A thread row in the rail is still named by its title for a screen reader.
4. A program that fails while streaming is not reported as failed until the stream ends.
5. A failed version with no earlier good version shows the failure and no stale body.

## Phase 2 (branch `claude/generated-chat-shell`)

### Task A: B6 `thread-list` rows take an icon and collapse to it

- `ThreadListItemProps` gains `icon?: React.ReactNode`, rendered before the title.
- Inside a collapsed icon sidebar (`group-data-[collapsible=icon]`), the title becomes `sr-only`,
  the row menu and `ThreadListSection` labels hide.
- Tests: the icon renders; the accessible name is the title with and without an icon. Story:
  `CollapsedRail` inside a collapsed `SidebarProvider`.

### Task B: O2 `chat-shell` takes a view

- `view?: React.ReactNode` renders `data-region="view"`; layout per spec §5.
- The sidebar's open state is held by the shell: initial `defaultSidebarOpen`; a view opening
  collapses it and remembers the prior state; a view closing restores it.
- Every thread gets `icon` (a default when none); the rail hides the L1 empty state.
- `artifactsWhenEmpty?: "show" | "hide"`, default `"show"`.
- Assistant turn content is `w-full`.
- Manifest regions gain `view`; `block-specs.md` O2 updated.
- Tests: the view region renders only with `view`; the sidebar collapses on a view and restores
  after; `artifactsWhenEmpty="hide"` omits the region until an artifact exists and the default
  still renders it; a card-only assistant turn is `w-full`. Stories: `WithView`, `WithViewMobile`.

### Task C: the demo moves back onto O2

- `GeneratedChatDemo` passes the frame as `view`, threads with icons, `artifactsWhenEmpty="hide"`.
- The existing demo tests and smoke pass unchanged.

## Phase 3 (branch `claude/generated-view-body`, on top of phase 2)

### Task D: R4 `generated-body` (one builder, the brief governs)

- Props: `program: string | null`, `library: Library`, `streaming?: boolean`,
  `fallbackProgram?: string | null`, `onRetry?: () => void`, `onRender?: (result: { ok: boolean;
errors: string[] }) => void`.
- States: `streaming`, `rendered`, `failed-with-fallback`, `failed-without-fallback`.
- `onRender` fires once per finished program (when `streaming` turns false), never while
  streaming.

### Task E: the demo's generated view

- Fixtures: recorded programs `spend-v1`, `spend-v2-chart`, `spend-v3-table`, built from `SPEND`.
- Turns: "Show spend by project" (build), "Add a daily trend" (edit to v2), "Show the daily trend
  as a table" (edit to v3). Every chip resolves.
- The frame renders `GeneratedBody` for kind `generated`, revealing the program line by line;
  the host records the last good version per view from `onRender`.
- Tests: v1 renders; v2 fails and shows v1 with Retry; Retry reaches v3, which renders.

### Task F: integrate and verify

Manifest, catalog, D26, counts (122), contracts, all gates, Storybook, smoke, consumer test,
rendered sweep, final review.
