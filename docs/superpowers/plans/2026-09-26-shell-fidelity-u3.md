# Shell fidelity U3: missing state stories and slots filled with the library

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the twelve case stories and four library-composition recipes that
U3 of the shell fidelity spec asks for, across the eight shells and slots the
spec names, without adding a shell prop, forking a component, or touching
`lib/catalog.manifest.ts`.

**Architecture:** Each task edits one shell's own five-file surface (its
Storybook story file, and in some tasks its docs-site demo) to compose
already-shipped registry components into slots and props those shells already
expose. Task 0 reconciles every row in both of U3's tables against the real
props before any story is written, and records the two rows that need a
labelled-sibling substitution plus the four shells that cannot take the
account-menu recipe without a new prop. The docs-shell task is isolated last,
gated on an unpushed branch. The final task re-runs the full gate list and the
reference-board measurement.

**Tech stack:** Next.js docs app, Storybook 9 + `@storybook/addon-a11y` +
`@storybook/addon-vitest`, Tailwind v4, Base UI primitives, vitest/browser.

**Spec:** [`docs/superpowers/specs/2026-09-24-shell-fidelity-design.md`](../specs/2026-09-24-shell-fidelity-design.md),
section 3 U3 (both tables) and section 6 (success criteria). Read alongside
this plan; the plan argues from it and does not restate its prose beyond what
each task needs.

## Global Constraints

- Never add a prop to a shell. Where a slot cannot take the named component as
  it ships, compose the nearest labelled sibling from vendored primitives at
  the story or demo layer, and record the gap in `docs/CONTINUE.md` §8. Never
  fork or reimplement a shipped component.
- Never hand-edit `apps/docs/lib/catalog.manifest.ts`, a `.meta.json`, `index/components.toon`
  or `public/llms*`. Nothing in this plan changes a manifest row, so
  `contract:emit` is not run by any task here.
- Every new Storybook story export gets a JSDoc description above it. Every
  story here is axe-gated by `preview.tsx`'s `a11y: { test: "error" }` default.
  A story whose description makes a claim (a button appears, a handler fires,
  a region renders) gets a `play()` that asserts it - follow
  `docs/design-system/story-conventions.md`, including mechanical fact 7 (D21:
  pin only a value a class dictates, verify with `./scripts/linux-gate.sh`
  rather than trusting a local run).
- Never pair a bare `text-muted-foreground` with a bare `bg-muted`, `bg-accent`
  or `bg-secondary` in one class string, and never pair `text-destructive`
  with a translucent `bg-destructive/NN` tint. Where a task paints a surface
  and a composed child's muted text lands on it, rebind `--muted-foreground`
  on the surface rather than restyling the child. See
  `docs/design-system/a11y-baseline.md`.
- `apps/docs/scripts/lib/story-coverage.baseline.json` and the Storybook a11y
  exclusion list (`apps/storybook/vitest.config.ts`) may only shrink. Nothing
  in this plan adds to either.
- No em dashes in any prose this plan or its tasks write (commit messages,
  JSDoc, docs prose). Use a comma, a colon, or a plain dash.
- A fresh worktree has no `node_modules`. Task 0 runs the install before
  anything else touches the tree.
- Recipes (the four rows in U3's second table, plus the account-menu fill-in)
  are stories and demo variants, never new props. Where a shell exposes the
  real slot as a `ReactNode`, the work lands in that shell's docs-site demo
  (`apps/docs/components/demos/<name>-demo.tsx`) so the measurement in the
  final task can see it, and is left out of the shell's own `FULL_ARGS` in its
  `.stories.tsx` file on purpose: every other exported story in that file
  (`RTL`, `KeyboardOrder`, `Boundary`, `Mobile`, and others) spreads
  `...FULL_ARGS`, and several of them pin exact pixel measurements or an exact
  tab sequence. Inserting a real `WorkspaceSwitcher`, `PromoCard` or
  `AccountMenu` trigger into the shared fixture would change the tab order
  `KeyboardOrder` counts and the geometry `RTL` reads back, silently breaking
  pinned assertions that have nothing to do with this work. The eight state
  stories and four recipes are new, independent exports and carry no such
  risk, so those land in the `.stories.tsx` files as planned.

---

### Task 0: Bootstrap, reconciliation and recorded gaps

**Files:**

- Modify: `docs/CONTINUE.md` (append one new `###` subsection to §8, after
  "Added by the shell review (2026-09-24)" and before `## 9. What each wave
found`)

**Interfaces:**

- Produces: the reconciliation table below, which every later task in this
  plan treats as settled. No later task re-derives a gap decision; each either
  composes the named component into the named slot, or points at the
  `CONTINUE.md §8` entry this task writes.

- [ ] **Step 1: Install dependencies**

Run from the repo root:

```bash
pnpm install --offline --frozen-lockfile
```

A fresh worktree carries no `node_modules`. If the offline store is missing a
package, drop `--offline` and re-run once; every later task assumes
`node_modules` exists.

- [ ] **Step 2: Confirm the starting baseline**

```bash
pnpm typecheck
pnpm check:contract
```

Both must be green before any story is added. Record the output; if either is
already red, stop and report it rather than building on a broken baseline.

- [ ] **Step 3: Reconciliation table**

For every row in U3's two tables, this is the component's real state checked
against its shipped props, the substitution where the row is at risk, and
which task in this plan carries it.

| #   | Row                                               | Component checked                                                                     | Real prop or state used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | Substitution                                                                                                                                                                                                                                                                                                                                                                                        | Task                                               |
| --- | ------------------------------------------------- | ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| 1   | chat `Streaming`                                  | AI Elements `Message`/`MessageContent`, D1 `media-prompt-bar`'s `generating`/`onStop` | `composer.generating`, `composer.onStop`; message content carries an `aria-hidden` cursor plus an `sr-only` status span                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | None needed                                                                                                                                                                                                                                                                                                                                                                                         | 1                                                  |
| 2   | chat `FailedTurn`                                 | No shipped component models a failed chat turn with inline retry                      | N/A, at risk                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Composed from vendored `Alert variant="destructive"` (safe: `bg-card text-destructive`, not a translucent tint) plus `Button variant="outline"`, as the failed turn's `content`. Gap recorded below.                                                                                                                                                                                                | 1                                                  |
| 3   | chat `ToolCall`                                   | N8 `permission-prompt`, controlled `open`                                             | `open`, `action`, `reason`, `args`, four handlers, rendered as one turn's `content`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | None needed                                                                                                                                                                                                                                                                                                                                                                                         | 1                                                  |
| 4   | timeline `FailedExport`                           | F6 `render-queue`, `onRetryJob`                                                       | `renderJobs` item with `state: "failed"`, shell's `onRetryJob`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | None needed                                                                                                                                                                                                                                                                                                                                                                                         | 2                                                  |
| 5   | generation `Blocked`                              | N10 `safety-block`, in the result canvas                                              | one `results` item's `media` is `<SafetyBlock variant="output-blocked" .../>`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | None needed                                                                                                                                                                                                                                                                                                                                                                                         | 3                                                  |
| 6   | library `UploadProgress`                          | No shipped component models an upload row with progress and cancel                    | N/A, at risk. A8 `preview-tile`'s states are `default \| loading \| locked \| failed`, none carrying a percentage or a cancel affordance reachable without nesting a control inside its own button                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Composed from vendored `Progress` + `Button` (Cancel) in `headerActions`, beside the existing Upload button, not in the tile grid. Gap recorded below.                                                                                                                                                                                                                                              | 4                                                  |
| 7   | notebook `IngestFailed`                           | K5 `source-panel`, `onRetrySource`                                                    | `sources` item with `stage: "failed"`, `errorMessage`, shell's `onRetrySource`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | None needed, already forwarded 1:1                                                                                                                                                                                                                                                                                                                                                                  | 5                                                  |
| 8   | auth `EmailSent`                                  | L1 `empty-state`, in the provider column                                              | `providers: []` with `providersEmpty` override                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | None needed, already an exposed override point                                                                                                                                                                                                                                                                                                                                                      | 6                                                  |
| 9   | every shell with an `AppSidebar`, `switcher` slot | B2 `workspace-switcher`                                                               | home, chat, artifact, records, docs (5 shells)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | None for home/chat/artifact; docs deferred to Task 11                                                                                                                                                                                                                                                                                                                                               | 1, 8, 9, 10, 11                                    |
| 10  | every shell with an `AppSidebar`, `promo` slot    | B5 `promo-card`                                                                       | home, chat, artifact take `sidebarPromo`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | records-shell and docs-shell declare no `promo`/`sidebarPromo` prop at all; B1's `promo` slot cannot be filled without adding one, which is U4's job. Gap recorded below.                                                                                                                                                                                                                           | 1, 8, 9 (records and docs: gap only, no task work) |
| 11  | every shell with an account slot, account trigger | B8 `account-menu`                                                                     | home/chat/artifact `sidebarFooter`; studio/generation `topbar.actions`; library `headerActions`; records `headerActions`; docs `railFooter` (deferred); settings `accountMenu`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | settings-shell already composes real `AccountMenu` in both its demo and its story (`SettingsShell.stories.tsx` lines 7, 152, and `FULL_ARGS.accountMenu`) - no work needed there. timeline-shell and explore-shell have no topbar and no `ReactNode` chrome slot; both expose only a typed `ModalityRailItemData[]` (`railPinned`), which cannot host a live dropdown. Gap recorded below for both. | 1, 3, 4, 7, 8, 9, 10, 11                           |
| 12  | chat `ArtifactApproval`                           | F7 `approval-card`, on a proposed artifact                                            | one assistant turn's `content` is `<ApprovalCard state="pending" .../>`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | None needed                                                                                                                                                                                                                                                                                                                                                                                         | 1                                                  |
| 13  | timeline `AudioRecipe`                            | H6 `waveform-editor` + H7 `stem-mixer`, in the track area                             | passed as the shell's `preview` region content (the "player surface... a `<video>`, a canvas, a compare viewer" per the shell's own prop doc)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | None needed; `preview` is documented as accepting exactly this kind of swap                                                                                                                                                                                                                                                                                                                         | 2                                                  |
| 14  | studio `ObjectAIActions`                          | I4 `ai-tools-menu`, on the selected element                                           | `toolbar.aiMenu`, per studio-shell's own docblock ("I4 as `aiMenu`")                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | None needed                                                                                                                                                                                                                                                                                                                                                                                         | 7                                                  |
| 15  | studio or generation `CompareRecipe`              | F5 `compare-viewer`, before and after                                                 | **Generation-shell**, decided here. Reasoning: compare-viewer's own spec text ("two or more renders of the same thing") is close to a paraphrase of a generation tool's core object - comparing generated variations. Generation's `result-canvas` region already accepts arbitrary media as a result's `children` (the exact mechanism the `Blocked` story above also uses), and it is full width; studio's two open surfaces (`children`, the single-node artboard, and the tool-panel's small results tiles) are either the shell's primary editing surface or too cramped for a two-pane comparison to read. Keeping both new generation-shell recipes on the same composition mechanism (a result's `media`) is also simpler to review than introducing a second one. | 3                                                                                                                                                                                                                                                                                                                                                                                                   |

- [ ] **Step 4: Record the gaps in `docs/CONTINUE.md` §8**

Open `docs/CONTINUE.md`, find the end of the "Added by the shell review
(2026-09-24)" subsection (it ends right before `## 9. What each wave found`),
and insert this new subsection immediately after it and before `## 9`:

```markdown
### Added by the U3 case-story and slot wave (2026-09-26)

Six gaps found while building the U3 plan's state stories and library
recipes (`superpowers/plans/2026-09-26-shell-fidelity-u3.md`). None of these
add a shell prop or fork a component; each is recorded here rather than
built, per the plan's own rule.

- **No shipped component models a failed chat turn with inline retry.** O2
  `chat-shell`'s `FailedTurn` case story composes the vendored `Alert
variant="destructive"` (`bg-card text-destructive`, not a translucent tint,
  so it clears 4.5:1 without an override) plus a plain `Button` as the
  turn's `content`, rather than a catalog component. A shipped
  "message-error" primitive (title, body, Retry) would let O2 and O13
  `notebook-shell` (which composes the same AI Elements message turn) share
  one row instead of each inlining its own markup.
- **No shipped component models an upload-in-progress row with cancel.** A8
  `preview-tile`'s states (`default`, `loading`, `locked`, `failed`) carry no
  percentage and no cancel affordance reachable without nesting a control
  inside the tile's own button. O7 `library-shell`'s `UploadProgress` case
  story composes the vendored `Progress` and `Button` in `headerActions`,
  beside the Upload control, rather than in the tile grid.
- **O10 `records-shell` declares no `promo` prop.** Its `AppSidebar` is
  filled with `switcher` and `nav` only (the shell's own comment says so:
  "This shell forwards no `promo` or `footer` to B1"). B5 `promo-card`
  cannot be composed into it without adding one, which is U4's job.
- **O11 `docs-shell` declares no `promo` prop either.** Same shape as
  records-shell: `AppSidebar` gets `switcher={railBrand}` and
  `footer={railFooter}`, never `promo`. Also blocked on U4.
- **O4 `timeline-shell` has no topbar and no `ReactNode` chrome slot.** Its
  only generic slot is `railPinned`, typed `ModalityRailItemData[]` (id,
  label, icon, badge) - a rail button that calls one shared `onSelect(id)`,
  not a place to mount a live `AccountMenu` dropdown. B8 cannot be composed
  here without a new prop.
- **O8 `explore-shell` has the identical gap.** Its only generic slot is
  also a typed `railPinned: ModalityRailItemData[]`, not a `ReactNode`. Same
  reasoning, same blocker.
```

- [ ] **Step 5: Commit**

```bash
git add docs/CONTINUE.md
git commit -m "docs: record U3's six composition gaps in CONTINUE.md §8"
```

---

### Task 1: Chat shell - Streaming, FailedTurn, ToolCall, ArtifactApproval, and the switcher/promo/footer demo

**Files:**

- Modify: `apps/storybook/src/stories/super-ai/ChatShell.stories.tsx`
- Modify: `apps/docs/components/demos/chat-shell-demo.tsx`
- Test: `cd apps/storybook && pnpm exec vitest run --project storybook ChatShell`

**Interfaces:**

- Consumes: `PermissionPrompt` (`registry/super-ai/permission-prompt.tsx`),
  `ApprovalCard` (`registry/super-ai/approval-card.tsx`), `WorkspaceSwitcher`
  (`registry/super-ai/workspace-switcher.tsx`), `PromoCard`
  (`registry/super-ai/promo-card.tsx`), `AccountMenu`
  (`registry/super-ai/account-menu.tsx`), vendored `Alert`/`AlertTitle`/`AlertDescription`
  (`components/ui/alert.tsx`), vendored `Button` (`components/ui/button.tsx`).
- Produces: four new story exports (`Streaming`, `FailedTurn`, `ToolCall`,
  `ArtifactApproval`) other tasks do not depend on.

- [ ] **Step 1: Add the four imports to `ChatShell.stories.tsx`**

```tsx
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ApprovalCard } from "@/registry/super-ai/approval-card";
import { PermissionPrompt } from "@/registry/super-ai/permission-prompt";
```

- [ ] **Step 2: Write the `Streaming` story**

Add after the existing `Paywalled` export. Bind the `onStop` mock once, in
`args`, and read it back through the `args` Storybook passes into `play` (not
through `FULL_ARGS`, which this story does not mutate):

```tsx
/**
 * AI Elements' streaming message, with D1's stop control live. The cursor is
 * `aria-hidden` decoration - the fact that a response is still arriving is
 * carried by the composer's `aria-busy` state and by a visually-hidden status
 * span, not by the blinking bar alone.
 */
export const Streaming: Story = {
  args: {
    ...FULL_ARGS,
    messages: [
      MESSAGES![0]!,
      {
        id: "m2",
        role: "assistant",
        content: (
          <>
            Reading the four voice guides now
            <span
              aria-hidden
              className="ms-1 inline-block h-4 w-1.5 animate-pulse bg-foreground/70 align-middle motion-reduce:animate-none"
            />
            <span role="status" className="sr-only">
              Still generating a response.
            </span>
          </>
        ),
      },
    ],
    composer: { generating: true, onStop: fn() },
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const stop = canvas.getByRole("button", { name: "Stop generating" });
    await userEvent.click(stop);
    await expect(args.composer!.onStop).toHaveBeenCalledTimes(1);
  },
};
```

- [ ] **Step 3: Write the `FailedTurn` story**

```tsx
/**
 * A turn that failed to generate, with retry inline where the turn would have
 * rendered. No shipped component models this shape (`CONTINUE.md` §8,
 * "Added by the U3 case-story and slot wave"), so this composes the vendored
 * `Alert variant="destructive"` directly: it paints `bg-card text-destructive`
 * rather than a translucent destructive tint, which is what keeps it clear of
 * the contrast pairing `a11y-baseline.md` bans.
 */
export const FailedTurn: Story = {
  args: {
    ...FULL_ARGS,
    messages: [
      MESSAGES![0]!,
      {
        id: "m2",
        role: "assistant",
        content: (
          <Alert variant="destructive" data-slot="chat-shell-turn-failed">
            <AlertTriangle aria-hidden />
            <AlertTitle>Could not generate a reply</AlertTitle>
            <AlertDescription className="flex flex-col items-start gap-2">
              <span>The model timed out after 30 seconds.</span>
              <Button type="button" size="sm" variant="outline" onClick={fn()}>
                <RotateCcw aria-hidden />
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        ),
      },
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("Could not generate a reply")).toBeVisible();
    const retry = canvas.getByRole("button", { name: "Retry" });
    await expect(retry).toBeVisible();
  },
};
```

- [ ] **Step 4: Write the `ToolCall` story**

```tsx
/**
 * N8 `permission-prompt`, held open inline in the stream at the point the
 * agent paused. Arguments stay hidden behind the explicit expand, the same
 * rule F7 `approval-card`'s `detail` follows below.
 */
export const ToolCall: Story = {
  args: {
    ...FULL_ARGS,
    messages: [
      MESSAGES![0]!,
      {
        id: "m2",
        role: "assistant",
        content: (
          <PermissionPrompt
            open
            action="Send the audit to #brand-review"
            reason="You asked for the summary to reach the channel once it was ready."
            args={[{ key: "channel", value: "#brand-review" }]}
            onAllowOnce={fn()}
            onAlwaysAllow={fn()}
            onDeny={fn()}
            onEditFirst={fn()}
          />
        ),
      },
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("Send the audit to #brand-review")).toBeVisible();
    await expect(canvas.getByRole("button", { name: "Allow once" })).toBeVisible();
  },
};
```

- [ ] **Step 5: Write the `ArtifactApproval` story**

```tsx
/**
 * F7 `approval-card` on a proposed artifact, before it has been kept. The
 * four verbs render in F7's own fixed order (Confirm, Edit, Regenerate, Skip)
 * regardless of the order the handlers are passed below.
 */
export const ArtifactApproval: Story = {
  args: {
    ...FULL_ARGS,
    messages: [
      MESSAGES![0]!,
      {
        id: "m2",
        role: "assistant",
        content: (
          <ApprovalCard
            title="Brand audit for Northwind"
            summary="A 400-word summary comparing Northwind's voice against three competitors."
            detail="Northwind is the only voice in the set that opens on reassurance. Competitors open on speed."
            state="pending"
            onConfirm={fn()}
            onEdit={fn()}
            onRegenerate={fn()}
            onSkip={fn()}
          />
        ),
      },
    ],
    artifacts: [],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("button", { name: "Confirm" })).toBeVisible();
    await expect(canvas.getByRole("button", { name: "Skip" })).toBeVisible();
  },
};
```

- [ ] **Step 6: Fill the demo's switcher, promo and footer**

In `apps/docs/components/demos/chat-shell-demo.tsx`, add imports:

```tsx
import { WorkspaceSwitcher } from "@/registry/super-ai/workspace-switcher";
import { PromoCard } from "@/registry/super-ai/promo-card";
import { AccountMenu } from "@/registry/super-ai/account-menu";
```

Add fixtures beside `ARTIFACTS`:

```tsx
const WORKSPACES = [
  { id: "northwind", name: "Northwind", plan: "Pro" },
  { id: "acme", name: "Acme Labs" },
];
```

Replace the `switcher` line and add `sidebarPromo`/`sidebarFooter` in the
returned `<ChatShell>`:

```tsx
switcher={
  <WorkspaceSwitcher workspaces={WORKSPACES} currentId="northwind" onSelect={() => {}} />
}
sidebarPromo={
  <PromoCard
    flavour="upgrade"
    title="Get more render minutes"
    description="Upgrade to Pro for priority queues and longer exports."
    ctaLabel="Upgrade"
    onCtaClick={() => {}}
    onDismiss={() => {}}
  />
}
sidebarFooter={
  <AccountMenu
    user={{ name: "Ada Lovelace", email: "ada@northwind.example" }}
    theme="system"
    onThemeChange={() => {}}
    background="default"
    onBackgroundChange={() => {}}
    onSignOut={() => {}}
  />
}
```

- [ ] **Step 7: Run the story tests for this file**

```bash
cd apps/storybook
rm -rf node_modules/.cache/storybook
pnpm exec vitest run --project storybook ChatShell
```

Expected: all `ChatShell.stories.tsx` tests pass, including the four new
exports.

- [ ] **Step 8: Typecheck and commit**

```bash
cd "/Users/nickv/ClaudeCode Projects/Super-AI-Components/.claude/worktrees/superai-design-system-alignment-e0e2b0"
pnpm typecheck
git add apps/storybook/src/stories/super-ai/ChatShell.stories.tsx apps/docs/components/demos/chat-shell-demo.tsx
git commit -m "feat(shell-fidelity): chat-shell state stories and sidebar slots"
```

---

### Task 2: Timeline shell - FailedExport and AudioRecipe

**Files:**

- Modify: `apps/storybook/src/stories/super-ai/TimelineShell.stories.tsx`
- Test: `cd apps/storybook && pnpm exec vitest run --project storybook TimelineShell`

**Interfaces:**

- Consumes: `RenderQueue`'s `onRetry` (already wired through
  `TimelineShellProps.onRetryJob`), `WaveformEditor`
  (`registry/super-ai/waveform-editor.tsx`), `StemMixer`
  (`registry/super-ai/stem-mixer.tsx`).
- Produces: two new story exports (`FailedExport`, `AudioRecipe`).

- [ ] **Step 1: Add imports**

```tsx
import { WaveformEditor } from "@/registry/super-ai/waveform-editor";
import { StemMixer } from "@/registry/super-ai/stem-mixer";
```

- [ ] **Step 2: Write the `FailedExport` story**

The existing `Exporting` story already shows a failed job for the render-queue
`stage`/`spec` columns, but wires no retry handler and asserts nothing. This
story is the focused case: one failed job, `onRetryJob` as a real mock, and a
play that fires it.

```tsx
/** F6 `render-queue`'s failed row, with `onRetryJob` wired and asserted. */
export const FailedExport: Story = {
  args: {
    ...FULL_ARGS,
    renderJobs: [
      {
        id: "failed",
        name: "Vertical cut",
        stage: "export",
        state: "failed",
        spec: { format: "MP4", codec: "H.264", resolution: "1080×1920", fps: 30 },
        cost: { amount: 18, unit: "credits" },
        error: "The source clip was trimmed while the export was running.",
      },
    ],
    onRetryJob: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const retry = canvas.getByRole("button", { name: "Retry Vertical cut" });
    await userEvent.click(retry);
    await expect(args.onRetryJob).toHaveBeenCalledWith("failed");
  },
};
```

- [ ] **Step 3: Write the `AudioRecipe` story**

`preview` is documented as "the player surface - a `<video>`, a canvas, a
compare viewer," so a sample-level editing pair is a valid swap for it without
a new prop.

```tsx
/**
 * H6 `waveform-editor` and H7 `stem-mixer` as the stage: a sample-level audio
 * edit, composed as the shell's `preview` region content rather than the
 * placeholder player. Neither component owns any part of the transport or the
 * tracks dock below it - this is what the region already accepts.
 */
export const AudioRecipe: Story = {
  args: {
    ...FULL_ARGS,
    preview: (
      <div className="flex h-full w-full flex-col gap-3 overflow-y-auto p-2">
        <WaveformEditor
          peaks={Array.from({ length: 64 }, (_, i) => Math.abs(Math.sin(i / 4)))}
          sampleCount={48000 * 13}
          sampleRate={48000}
          region={{ start: 24000, end: 96000, label: "Breath" }}
          onRegionChange={fn()}
          onScrub={fn()}
        />
        <StemMixer
          stems={[
            { id: "voice", name: "Narration", volume: 100, level: 62 },
            { id: "harbour", name: "Harbour ambience", volume: 70, level: 24 },
          ]}
          onMuteChange={fn()}
          onSoloChange={fn()}
          onVolumeChange={fn()}
          onPanChange={fn()}
        />
      </div>
    ),
  },
  play: async ({ canvasElement }) => {
    const region = (id: string) => canvasElement.querySelector<HTMLElement>(`[data-region="${id}"]`)!;
    const stage = region("preview");
    await expect(stage.querySelector('[data-slot="waveform-editor"]')).not.toBeNull();
    await expect(stage.querySelector('[data-slot="stem-mixer"]')).not.toBeNull();
  },
};
```

- [ ] **Step 4: Run the story tests, typecheck, commit**

```bash
cd apps/storybook
rm -rf node_modules/.cache/storybook
pnpm exec vitest run --project storybook TimelineShell
cd ..
cd "/Users/nickv/ClaudeCode Projects/Super-AI-Components/.claude/worktrees/superai-design-system-alignment-e0e2b0"
pnpm typecheck
git add apps/storybook/src/stories/super-ai/TimelineShell.stories.tsx
git commit -m "feat(shell-fidelity): timeline-shell FailedExport and AudioRecipe stories"
```

---

### Task 3: Generation shell - Blocked and CompareRecipe, plus the topbar account slot

**Files:**

- Modify: `apps/storybook/src/stories/super-ai/GenerationShell.stories.tsx`
- Modify: `apps/docs/components/demos/generation-shell-demo.tsx`
- Test: `cd apps/storybook && pnpm exec vitest run --project storybook GenerationShell`

**Interfaces:**

- Consumes: `SafetyBlock` (`registry/super-ai/safety-block.tsx`),
  `CompareViewer` (`registry/super-ai/compare-viewer.tsx`), `AccountMenu`.
- Produces: two new story exports (`Blocked`, `CompareRecipe`); one demo edit.

- [ ] **Step 1: Add imports to `GenerationShell.stories.tsx`**

```tsx
import { SafetyBlock } from "@/registry/super-ai/safety-block";
import { CompareViewer } from "@/registry/super-ai/compare-viewer";
```

- [ ] **Step 2: Write the `Blocked` story**

```tsx
/**
 * N10 `safety-block` in the result canvas: the run completed, but the output
 * is withheld. `variant="output-blocked"` is the correct half of the pair,
 * since the request itself was not stopped.
 */
export const Blocked: Story = {
  args: {
    ...FULL_ARGS,
    results: [
      {
        id: "blocked",
        state: "done",
        label: "A lighthouse at dusk, slow push in",
        media: (
          <SafetyBlock
            variant="output-blocked"
            policy="Likeness policy"
            alternatives="Try a wider shot with no recognisable landmark."
          />
        ),
      },
      ...RESULTS!.slice(0, 2),
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("Response withheld")).toBeVisible();
  },
};
```

- [ ] **Step 3: Write the `CompareRecipe` story**

Chosen for generation-shell over studio-shell in Task 0's reconciliation
(compare-viewer's own "two or more renders of the same thing" maps onto
generated variations, and the result canvas already accepts arbitrary media as
a card's content).

```tsx
/** F5 `compare-viewer`, before and after, composed as one result's media. */
export const CompareRecipe: Story = {
  args: {
    ...FULL_ARGS,
    results: [
      {
        id: "compare",
        state: "done",
        label: "A lighthouse at dusk - two takes",
        media: (
          <CompareViewer
            panes={[
              {
                id: "take-1",
                label: "Static wide",
                content: (
                  <div className="bg-secondary flex h-full items-center justify-center text-xs">Take 1</div>
                ),
              },
              {
                id: "take-2",
                label: "Slow push in",
                content: (
                  <div className="bg-primary/20 flex h-full items-center justify-center text-xs">Take 2</div>
                ),
              },
            ]}
            onModeChange={fn()}
          />
        ),
      },
      ...RESULTS!.slice(0, 2),
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("1")).toBeVisible();
    await expect(canvas.getByText("2")).toBeVisible();
  },
};
```

- [ ] **Step 4: Add the account menu to the demo's topbar**

In `apps/docs/components/demos/generation-shell-demo.tsx`, add the import:

```tsx
import { AccountMenu } from "@/registry/super-ai/account-menu";
```

Change the `topbar` prop passed to `<GenerationShell>`:

```tsx
topbar={{
  privacy: { label: "Private" },
  actions: (
    <AccountMenu
      user={{ name: "Ada Lovelace", email: "ada@northwind.example" }}
      theme="system"
      onThemeChange={() => {}}
      background="default"
      onBackgroundChange={() => {}}
      onSignOut={() => {}}
    />
  ),
}}
```

- [ ] **Step 5: Run tests, typecheck, commit**

```bash
cd apps/storybook
rm -rf node_modules/.cache/storybook
pnpm exec vitest run --project storybook GenerationShell
cd "/Users/nickv/ClaudeCode Projects/Super-AI-Components/.claude/worktrees/superai-design-system-alignment-e0e2b0"
pnpm typecheck
git add apps/storybook/src/stories/super-ai/GenerationShell.stories.tsx apps/docs/components/demos/generation-shell-demo.tsx
git commit -m "feat(shell-fidelity): generation-shell Blocked and CompareRecipe stories, account menu in topbar"
```

---

### Task 4: Library shell - UploadProgress, plus the headerActions account slot

**Files:**

- Modify: `apps/storybook/src/stories/super-ai/LibraryShell.stories.tsx`
- Modify: `apps/docs/components/demos/library-shell-demo.tsx`
- Test: `cd apps/storybook && pnpm exec vitest run --project storybook LibraryShell`

**Interfaces:**

- Consumes: vendored `Progress` (`components/ui/progress.tsx`), vendored
  `Button`, `AccountMenu`.
- Produces: one new story export (`UploadProgress`); one demo edit.

- [ ] **Step 1: Add imports to `LibraryShell.stories.tsx`**

```tsx
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
```

- [ ] **Step 2: Write the `UploadProgress` story**

Per Task 0's reconciliation, no shipped component models this row. It
composes vendored `Progress` and `Button` in `headerActions`, beside the
existing Upload control, rather than forcing it into the tile grid.

```tsx
/**
 * An upload in progress, with cancel. No shipped component models this shape
 * (`CONTINUE.md` §8, "Added by the U3 case-story and slot wave") - A8
 * `preview-tile`'s `loading` state carries no percentage and no cancel
 * affordance, so this composes the vendored `Progress` and `Button` in
 * `headerActions` instead of the tile grid.
 */
export const UploadProgress: Story = {
  args: {
    ...FULL_ARGS,
    headerActions: (
      <div className="flex items-center gap-3">
        <div className="flex min-w-40 flex-col gap-1">
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="text-foreground">Uploading landscape.jpg</span>
            <span className="text-foreground tabular-nums">42%</span>
          </div>
          <Progress value={42} aria-label="Uploading landscape.jpg" />
        </div>
        <Button type="button" size="sm" variant="outline" onClick={fn()}>
          Cancel
        </Button>
      </div>
    ),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("Uploading landscape.jpg")).toBeVisible();
    await expect(canvas.getByRole("button", { name: "Cancel" })).toBeVisible();
  },
};
```

- [ ] **Step 3: Add the account menu beside Upload in the demo**

In `apps/docs/components/demos/library-shell-demo.tsx`:

```tsx
import { AccountMenu } from "@/registry/super-ai/account-menu";
```

```tsx
headerActions={
  <div className="flex items-center gap-2">
    <Button size="sm" variant="outline">
      Upload
    </Button>
    <AccountMenu
      user={{ name: "Ada Lovelace", email: "ada@northwind.example" }}
      theme="system"
      onThemeChange={() => {}}
      background="default"
      onBackgroundChange={() => {}}
      onSignOut={() => {}}
    />
  </div>
}
```

- [ ] **Step 4: Run tests, typecheck, commit**

```bash
cd apps/storybook
rm -rf node_modules/.cache/storybook
pnpm exec vitest run --project storybook LibraryShell
cd "/Users/nickv/ClaudeCode Projects/Super-AI-Components/.claude/worktrees/superai-design-system-alignment-e0e2b0"
pnpm typecheck
git add apps/storybook/src/stories/super-ai/LibraryShell.stories.tsx apps/docs/components/demos/library-shell-demo.tsx
git commit -m "feat(shell-fidelity): library-shell UploadProgress story, account menu in header"
```

---

### Task 5: Notebook shell - IngestFailed

**Files:**

- Modify: `apps/storybook/src/stories/super-ai/NotebookShell.stories.tsx`
- Test: `cd apps/storybook && pnpm exec vitest run --project storybook NotebookShell`

**Interfaces:**

- Consumes: K5 `source-panel`'s `onRetrySource`, already forwarded 1:1 by
  `NotebookShellProps`.
- Produces: one new story export (`IngestFailed`). Notebook-shell has "none,
  correctly" for an account slot per the spec's own §2 measurement, so no
  demo edit in this task.

- [ ] **Step 1: Write the `IngestFailed` story**

The existing `Ingesting` story already carries a failed source in its list but
wires no `onRetrySource` mock and asserts nothing. This story isolates the
failed case and proves retry fires.

```tsx
/** K5 `source-panel`'s failed source, with `onRetrySource` wired and asserted. */
export const IngestFailed: Story = {
  args: {
    ...FULL_ARGS,
    sources: [
      { id: "q3-report", name: "Q3-report.pdf", meta: "PDF · 2.4 MB", stage: "ready", chunkCount: 184 },
      {
        id: "contract",
        name: "master-agreement.docx",
        meta: "DOCX · 812 KB",
        stage: "failed",
        errorMessage: "Could not read the file, it looks password protected.",
      },
    ],
    onRetrySource: fn(),
    messages: [],
    outputs: [],
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const retry = canvas.getByRole("button", { name: "Retry master-agreement.docx" });
    await userEvent.click(retry);
    await expect(args.onRetrySource).toHaveBeenCalledWith("contract");
  },
};
```

- [ ] **Step 2: Run tests, typecheck, commit**

```bash
cd apps/storybook
rm -rf node_modules/.cache/storybook
pnpm exec vitest run --project storybook NotebookShell
cd "/Users/nickv/ClaudeCode Projects/Super-AI-Components/.claude/worktrees/superai-design-system-alignment-e0e2b0"
pnpm typecheck
git add apps/storybook/src/stories/super-ai/NotebookShell.stories.tsx
git commit -m "feat(shell-fidelity): notebook-shell IngestFailed story"
```

---

### Task 6: Auth shell - EmailSent

**Files:**

- Modify: `apps/storybook/src/stories/super-ai/AuthShell.stories.tsx`
- Test: `cd apps/storybook && pnpm exec vitest run --project storybook AuthShell`

**Interfaces:**

- Consumes: `AuthShellProps.providersEmpty`, an already-exposed override
  point that falls back to L1 `empty-state` when `providers` is empty.
- Produces: one new story export (`EmailSent`). Auth-shell has "none,
  correctly" for an account slot, so no demo edit in this task.

- [ ] **Step 1: Add the icon import**

```tsx
import { Mail } from "lucide-react";
```

- [ ] **Step 2: Write the `EmailSent` story**

```tsx
/**
 * L1 `empty-state` in the provider column, standing in for the confirmation
 * after a magic-link email is sent. `providers: []` triggers the column's
 * existing empty affordance; `providersEmpty` overrides its default copy.
 */
export const EmailSent: Story = {
  args: {
    ...FULL_ARGS,
    providers: [],
    providersEmpty: (
      <EmptyState
        size="panel"
        icon={<Mail aria-hidden />}
        title="Check your email"
        description="We sent a sign-in link to ada@northwind.com. It expires in 15 minutes."
      />
    ),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("Check your email")).toBeVisible();
  },
};
```

`EmptyState` is not yet imported in this file. Add it beside the existing
registry imports:

```tsx
import { EmptyState } from "@/registry/super-ai/empty-state";
```

- [ ] **Step 3: Run tests, typecheck, commit**

```bash
cd apps/storybook
rm -rf node_modules/.cache/storybook
pnpm exec vitest run --project storybook AuthShell
cd "/Users/nickv/ClaudeCode Projects/Super-AI-Components/.claude/worktrees/superai-design-system-alignment-e0e2b0"
pnpm typecheck
git add apps/storybook/src/stories/super-ai/AuthShell.stories.tsx
git commit -m "feat(shell-fidelity): auth-shell EmailSent story"
```

---

### Task 7: Studio shell - ObjectAIActions, plus the topbar account slot

**Files:**

- Modify: `apps/storybook/src/stories/super-ai/StudioShell.stories.tsx`
- Modify: `apps/docs/components/demos/studio-shell-demo.tsx`
- Test: `cd apps/storybook && pnpm exec vitest run --project storybook StudioShell`

**Interfaces:**

- Consumes: `AiToolsMenu` (`registry/super-ai/ai-tools-menu.tsx`), composed
  through `StudioShellProps.toolbar.aiMenu` (`ContextToolbarProps.aiMenu`,
  rendered inside I3's own Popover), `AccountMenu`.
- Produces: one new story export (`ObjectAIActions`); one demo edit.

- [ ] **Step 1: Add imports to `StudioShell.stories.tsx`**

```tsx
import { AiToolsMenu } from "@/registry/super-ai/ai-tools-menu";
```

- [ ] **Step 2: Write the `ObjectAIActions` story**

```tsx
/**
 * I4 `ai-tools-menu` on the selected element, composed through I3's own
 * `aiMenu` slot (per studio-shell's docblock: "the rest of I3: actions, the
 * AI entry, I4 as `aiMenu`, placement"). `presentation="inline"` because I3
 * already supplies the Popover shell around it.
 */
export const ObjectAIActions: Story = {
  args: {
    ...FULL_ARGS,
    selection: { type: "text", label: "Heading" },
    toolbar: {
      actions: [
        { id: "font", label: "Font", showLabel: true },
        { id: "colour", label: "Colour", showLabel: true },
      ],
      aiMenu: (
        <AiToolsMenu
          presentation="inline"
          selection={{ label: "Heading", type: "Text frame" }}
          groups={[
            {
              id: "edit",
              label: "Edit",
              actions: [
                { id: "rewrite", title: "Rewrite tone", cost: { amount: 1, unit: "credits" } },
                { id: "shorten", title: "Shorten to one line" },
              ],
            },
          ]}
          onAction={fn()}
        />
      ),
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const aiEntry = canvas.getByRole("button", { name: "AI" });
    await userEvent.click(aiEntry);
    await waitFor(() => expect(canvas.getByText("Rewrite tone")).toBeVisible());
  },
};
```

If the AI entry's accessible name in this file's fixture is not the bare word
"AI" (check `ContextToolbar`'s default `aiIcon`/label before writing the
assertion), query by role and read the actual accessible name back with
`canvas.getAllByRole("button")` first, then pin whichever string it reads.

- [ ] **Step 3: Add the account menu to the demo's topbar**

In `apps/docs/components/demos/studio-shell-demo.tsx`:

```tsx
import { AccountMenu } from "@/registry/super-ai/account-menu";
```

Change `topbar={{ zoomLabel: "72%", savedLabel: "Saved just now" }}` to:

```tsx
topbar={{
  zoomLabel: "72%",
  savedLabel: "Saved just now",
  actions: (
    <AccountMenu
      user={{ name: "Ada Lovelace", email: "ada@northwind.example" }}
      theme="system"
      onThemeChange={() => {}}
      background="default"
      onBackgroundChange={() => {}}
      onSignOut={() => {}}
    />
  ),
}}
```

- [ ] **Step 4: Run tests, typecheck, commit**

```bash
cd apps/storybook
rm -rf node_modules/.cache/storybook
pnpm exec vitest run --project storybook StudioShell
cd "/Users/nickv/ClaudeCode Projects/Super-AI-Components/.claude/worktrees/superai-design-system-alignment-e0e2b0"
pnpm typecheck
git add apps/storybook/src/stories/super-ai/StudioShell.stories.tsx apps/docs/components/demos/studio-shell-demo.tsx
git commit -m "feat(shell-fidelity): studio-shell ObjectAIActions story, account menu in topbar"
```

---

### Task 8: Home shell - switcher and promo

**Files:**

- Modify: `apps/docs/components/demos/home-shell-demo.tsx`

**Interfaces:**

- Consumes: `WorkspaceSwitcher`, `PromoCard`, `AccountMenu`.
- Produces: nothing another task depends on.

Home-shell already has `sidebarFooter` in its own type, but the demo does not
set it today (confirmed: no `sidebarFooter` line in `home-shell-demo.tsx`), so
this task fills `switcher`, `sidebarPromo` and `sidebarFooter` together.

- [ ] **Step 1: Add imports to `home-shell-demo.tsx`**

```tsx
import { WorkspaceSwitcher } from "@/registry/super-ai/workspace-switcher";
import { PromoCard } from "@/registry/super-ai/promo-card";
import { AccountMenu } from "@/registry/super-ai/account-menu";
```

- [ ] **Step 2: Add the workspace fixture and replace the switcher, add promo and footer**

```tsx
const WORKSPACES = [
  { id: "northwind", name: "Northwind", plan: "Pro" },
  { id: "acme", name: "Acme Labs" },
];
```

Replace `switcher={<div className="px-2 text-sm font-medium">Northwind</div>}`
with:

```tsx
switcher={
  <WorkspaceSwitcher workspaces={WORKSPACES} currentId="northwind" onSelect={() => {}} />
}
sidebarPromo={
  <PromoCard
    flavour="upgrade"
    title="Get more render minutes"
    description="Upgrade to Pro for priority queues and longer exports."
    ctaLabel="Upgrade"
    onCtaClick={() => {}}
    onDismiss={() => {}}
  />
}
sidebarFooter={
  <AccountMenu
    user={{ name: "Ada Lovelace", email: "ada@northwind.example" }}
    theme="system"
    onThemeChange={() => {}}
    background="default"
    onBackgroundChange={() => {}}
    onSignOut={() => {}}
  />
}
```

- [ ] **Step 3: Typecheck and commit**

```bash
cd "/Users/nickv/ClaudeCode Projects/Super-AI-Components/.claude/worktrees/superai-design-system-alignment-e0e2b0"
pnpm typecheck
git add apps/docs/components/demos/home-shell-demo.tsx
git commit -m "feat(shell-fidelity): home-shell sidebar switcher, promo and footer"
```

---

### Task 9: Artifact shell - switcher, promo and footer

**Files:**

- Modify: `apps/docs/components/demos/artifact-shell-demo.tsx`

**Interfaces:**

- Consumes: `WorkspaceSwitcher`, `PromoCard`, `AccountMenu`.

- [ ] **Step 1: Add imports**

```tsx
import { WorkspaceSwitcher } from "@/registry/super-ai/workspace-switcher";
import { PromoCard } from "@/registry/super-ai/promo-card";
import { AccountMenu } from "@/registry/super-ai/account-menu";
```

- [ ] **Step 2: Add the fixture, replace `switcher`, add `sidebarPromo` and `sidebarFooter`**

```tsx
const WORKSPACES = [
  { id: "northwind", name: "Northwind", plan: "Pro" },
  { id: "acme", name: "Acme Labs" },
];
```

Replace `switcher={<div className="px-2 text-sm font-medium">Northwind</div>}`
with the same three props as Task 8:

```tsx
switcher={
  <WorkspaceSwitcher workspaces={WORKSPACES} currentId="northwind" onSelect={() => {}} />
}
sidebarPromo={
  <PromoCard
    flavour="upgrade"
    title="Get more render minutes"
    description="Upgrade to Pro for priority queues and longer exports."
    ctaLabel="Upgrade"
    onCtaClick={() => {}}
    onDismiss={() => {}}
  />
}
sidebarFooter={
  <AccountMenu
    user={{ name: "Ada Lovelace", email: "ada@northwind.example" }}
    theme="system"
    onThemeChange={() => {}}
    background="default"
    onBackgroundChange={() => {}}
    onSignOut={() => {}}
  />
}
```

- [ ] **Step 3: Typecheck and commit**

```bash
cd "/Users/nickv/ClaudeCode Projects/Super-AI-Components/.claude/worktrees/superai-design-system-alignment-e0e2b0"
pnpm typecheck
git add apps/docs/components/demos/artifact-shell-demo.tsx
git commit -m "feat(shell-fidelity): artifact-shell sidebar switcher, promo and footer"
```

---

### Task 10: Records shell - switcher and header account slot

**Files:**

- Modify: `apps/docs/components/demos/records-shell-demo.tsx`

**Interfaces:**

- Consumes: `WorkspaceSwitcher`, `AccountMenu`. No `promo` work here: Task 0
  recorded that `records-shell` declares no `promo` prop (see `CONTINUE.md`
  §8).

- [ ] **Step 1: Add imports**

```tsx
import { WorkspaceSwitcher } from "@/registry/super-ai/workspace-switcher";
import { AccountMenu } from "@/registry/super-ai/account-menu";
```

- [ ] **Step 2: Add the fixture and replace `switcher`**

```tsx
const WORKSPACES = [
  { id: "northwind", name: "Northwind", plan: "Pro" },
  { id: "acme", name: "Acme Labs" },
];
```

Replace `switcher={<div className="px-2 text-sm font-medium">Northwind</div>}`
with:

```tsx
switcher={
  <WorkspaceSwitcher workspaces={WORKSPACES} currentId="northwind" onSelect={() => {}} />
}
```

- [ ] **Step 3: Add the account menu to `headerActions`**

Read the current `headerActions` value in `records-shell-demo.tsx` first (it
was not read while researching this plan) and add the account menu beside
whatever is already there, rather than replacing it, per "scoped change is a
scoped change." If `headerActions` is currently unset, add it fresh:

```tsx
headerActions={
  <AccountMenu
    user={{ name: "Ada Lovelace", email: "ada@northwind.example" }}
    theme="system"
    onThemeChange={() => {}}
    background="default"
    onBackgroundChange={() => {}}
    onSignOut={() => {}}
  />
}
```

- [ ] **Step 4: Typecheck and commit**

```bash
cd "/Users/nickv/ClaudeCode Projects/Super-AI-Components/.claude/worktrees/superai-design-system-alignment-e0e2b0"
pnpm typecheck
git add apps/docs/components/demos/records-shell-demo.tsx
git commit -m "feat(shell-fidelity): records-shell sidebar switcher and header account menu"
```

---

### Task 11: Docs shell - switcher and rail footer (gated, do last)

**Files:**

- Modify: `apps/docs/components/demos/docs-shell-demo.tsx`

**Interfaces:**

- Consumes: `WorkspaceSwitcher`, `AccountMenu`. No `promo` work here either:
  `docs-shell` also declares no `promo` prop (see `CONTINUE.md` §8).

- [ ] **Step 1: Check the gate before touching anything**

```bash
git fetch origin --quiet
git show origin/main:apps/docs/registry/super-ai/app-sidebar.tsx \
  | grep -c 'group-data-\[collapsible=icon\]:overflow-hidden'
```

This checks the fix's content, not its commit message: the branch's commit is
titled "fix(app-sidebar): clip the switcher slot at icon-rail width", and a
squash merge would rename it anyway. A count of 1 or more means the rail fix is
on `origin/main`; 0 means it is not.

If `claude/docs-shell-rail-brand` has not merged into `origin/main`, **stop
this task**. Do not edit `docs-shell-demo.tsx` or `DocsShell.stories.tsx`.
Report the branch as still unmerged and leave this task undone; re-check it
the next time this plan is picked up. `DocsShell.stories.tsx` and
`docs-shell-demo.tsx` both change on that branch, and editing either one here
first turns an ordinary merge into a conflict neither branch's author is
expecting.

- [ ] **Step 2: If merged, add imports**

```tsx
import { WorkspaceSwitcher } from "@/registry/super-ai/workspace-switcher";
import { AccountMenu } from "@/registry/super-ai/account-menu";
```

- [ ] **Step 3: Add the fixture and replace `railBrand`**

```tsx
const WORKSPACES = [
  { id: "northwind", name: "Northwind", plan: "Pro" },
  { id: "acme", name: "Acme Labs" },
];
```

Replace `railBrand={<div className="px-1 text-sm font-medium">Northwind</div>}`
with:

```tsx
railBrand={
  <WorkspaceSwitcher workspaces={WORKSPACES} currentId="northwind" onSelect={() => {}} />
}
```

- [ ] **Step 4: Add the account menu to `railFooter`**

Read the current `railFooter` value in `docs-shell-demo.tsx` first (not read
while researching this plan, since the file changes on the gating branch). If
it is unset, add it:

```tsx
railFooter={
  <AccountMenu
    user={{ name: "Ada Lovelace", email: "ada@northwind.example" }}
    theme="system"
    onThemeChange={() => {}}
    background="default"
    onBackgroundChange={() => {}}
    onSignOut={() => {}}
  />
}
```

- [ ] **Step 5: Typecheck and commit**

```bash
cd "/Users/nickv/ClaudeCode Projects/Super-AI-Components/.claude/worktrees/superai-design-system-alignment-e0e2b0"
pnpm typecheck
git add apps/docs/components/demos/docs-shell-demo.tsx
git commit -m "feat(shell-fidelity): docs-shell rail switcher and footer account menu"
```

---

### Task 12: Full gate run and the reference-board measurement

**Files:**

- Create (scratch, not committed): a temporary Node script, run once and
  discarded, matching how the original 2026-09-25 measurement was done (no
  script for it was ever committed; see Task 0's research).

**Interfaces:**

- Consumes: every commit from Tasks 0 through 11 (Task 11 only if its branch
  gate allowed it to land).
- Produces: the plan's own exit criteria: a full green gate run, and evidence
  that `workspace-switcher`, `promo-card`, `account-menu`, `approval-card`,
  `waveform-editor`, `stem-mixer`, `ai-tools-menu` and `compare-viewer` now
  appear in at least one shell.

- [ ] **Step 1: Rebuild before the smoke gate**

`playwright.config.ts` runs `pnpm start`, which serves the prebuilt output.
Editing source without rebuilding tests a stale app.

```bash
cd "/Users/nickv/ClaudeCode Projects/Super-AI-Components/.claude/worktrees/superai-design-system-alignment-e0e2b0"
pnpm build:registry
pnpm build
```

- [ ] **Step 2: Run the full gate list, in `ci.yml`'s order**

```bash
.claude/skills/gate-run/run-gates.sh
```

Before running it, check port 3100. On this branch `apps/docs/playwright.config.ts`
hard-codes 3100 and nothing reads a `SMOKE_PORT` override (that arrives with PR
#75), so a held port fails the smoke gate:

```bash
lsof -nP -iTCP:3100 -sTCP:LISTEN
```

If anything is listening, stop and ask Nick. It is usually Jobsmith's `next dev`,
another project's process: never kill it without his go. Once #75 is in the
base, `SMOKE_PORT=3101 .claude/skills/gate-run/run-gates.sh` replaces this step.

The script runs, in order: `install --frozen-lockfile`, `lint`,
`format:check`, `typecheck`, `check:tokens`, `check:contract`, `test`,
`build:registry`, `build`, Playwright smoke, `pnpm --filter storybook
test:stories` (run `rm -rf apps/storybook/node_modules/.cache/storybook`
first if it has not already been cleared this session, per `CONTINUE.md`
§3.5), and the consumer install test. Expected: all twelve steps pass. If any
step is red, stop and fix it before writing the measurement below, per
"a green run proved nothing" until it is a full run.

- [ ] **Step 3: Write and run the measurement script**

Write this to a scratch path (not committed):

```js
// measure-shell-slots.mjs
// Re-runs the 2026-09-25 measurement for U3's eight targets: is each one
// imported by any shell's registry file, docs-site demo or Storybook story?
// It matches import specifiers, not names: a JSDoc mention such as
// "I4 as `aiMenu`" is not a use, and one already exists today.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const SHELLS = [
  "home-shell",
  "chat-shell",
  "studio-shell",
  "timeline-shell",
  "generation-shell",
  "library-shell",
  "explore-shell",
  "artifact-shell",
  "records-shell",
  "docs-shell",
  "settings-shell",
  "notebook-shell",
  "auth-shell",
];
const TARGETS = [
  "workspace-switcher",
  "promo-card",
  "account-menu",
  "approval-card",
  "waveform-editor",
  "stem-mixer",
  "ai-tools-menu",
  "compare-viewer",
];

const pascal = (slug) =>
  slug
    .split("-")
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join("");
const filesFor = (shell) => [
  join(ROOT, "apps/docs/registry/super-ai", `${shell}.tsx`),
  join(ROOT, "apps/docs/components/demos", `${shell}-demo.tsx`),
  join(ROOT, "apps/storybook/src/stories/super-ai", `${pascal(shell)}.stories.tsx`),
];
const imports = (text, slug) => new RegExp(`from\\s+["'](?:@/registry/super-ai/|\\./)${slug}["']`).test(text);

let missing = 0;
for (const slug of TARGETS) {
  const shells = SHELLS.filter((shell) =>
    filesFor(shell).some((file) => existsSync(file) && imports(readFileSync(file, "utf8"), slug)),
  );
  if (shells.length === 0) missing += 1;
  console.log(`${slug.padEnd(20)} ${shells.length ? shells.join(", ") : "in NO shell"}`);
}
if (missing > 0) {
  console.error(`\n${missing} target(s) appear in no shell.`);
  process.exit(1);
}
console.log("\nAll eight targets appear in at least one shell.");
```

Run it from the repo root:

```bash
node measure-shell-slots.mjs
```

Before this plan it prints `account-menu  settings-shell` and "7 target(s) appear
in no shell", exit 1 (checked on 2026-09-26). Expected after Tasks 1 to 10: all
eight targets list at least one shell, exit 0. None of the eight depends on
`docs-shell` alone, so Task 11 being held by its gate does not change the result.

- [ ] **Step 4: Delete the scratch script**

```bash
rm measure-shell-slots.mjs
```

- [ ] **Step 5: Report**

State plainly: which gate steps ran and passed, the measurement script's full
output, whether Task 11 landed or is still blocked on
`claude/docs-shell-rail-brand`, and a link to the local docs URL
(`pnpm --filter docs dev`, then `http://localhost:3000/components/chat-shell`
or the relevant shell) as the preview. Do not commit anything in this task
beyond what Tasks 0 through 11 already committed; this task only verifies.

---

## Self-review

**Spec coverage.** Every row of U3's first table (chat Streaming/FailedTurn/ToolCall,
timeline FailedExport, generation Blocked, library UploadProgress, notebook
IngestFailed, auth EmailSent) has a task and a concrete story. Every row of the
second table (switcher/promo for every `AppSidebar` shell, account-menu for
every account-slotted shell, chat ArtifactApproval, timeline AudioRecipe,
studio ObjectAIActions, and the studio-or-generation CompareRecipe decision)
has a task, a concrete composition, or a recorded gap. The docs-shell branch
gate is Task 11, last before the closing measurement. The final measurement
and full gate run is Task 12.

**Placeholder scan.** No step in this plan contains a TODO, a "handle
appropriately," or an unshown code block. Every new story and every demo edit
is written out in full, including its `play()` where the story makes a claim.

**Type consistency.** `WorkspaceSwitcherWorkspace`'s fields (`id`, `name`,
`plan`) are used identically across Tasks 1, 8, 9, 10 and 11. `AccountMenu`'s
required props (`user`, `theme`, `onThemeChange`, `background`,
`onBackgroundChange`, `onSignOut`) are passed identically everywhere it
appears. `PromoCard`'s required `onDismiss` is present in both places it is
used (Tasks 1, 8, 9). `RenderJob`'s shape (`id`, `name`, `stage`, `state`,
`spec`, `cost`, `error`) matches the type `render-queue.tsx` exports. Where a
task's step reads "check the current value first" (Task 10 Step 3, Task 11
Steps 3 to 4) it is because this plan's research did not open that exact file
region, and the step says so rather than inventing content for a file nobody
read.

## Anything this plan could not settle

- **Task 7's exact accessible name for the AI entry button** was not
  independently re-verified against `context-toolbar.tsx`'s default `aiIcon`
  and label rendering; the step tells the implementer to read it back rather
  than trust the string in the plan.
- **`records-shell-demo.tsx`'s and `docs-shell-demo.tsx`'s current
  `headerActions`/`railFooter` values** were not read while researching this
  plan (the former because it was judged lower-risk than the AppSidebar wiring
  already confirmed by grep; the latter because it lives behind Task 11's
  branch gate). Both tasks say to read the file before editing rather than
  guessing its current content.
- **Whether Nick wants the eight state stories and four recipes also
  reflected in each shell's docs-site demo**, beyond the switcher/promo/account
  fill-ins this plan already puts there. The plan deliberately keeps them
  Storybook-only, matching this repo's existing convention (`JobQueue`,
  `Paywalled`, `Exporting`, `Ingesting`, `TierGated` are all Storybook-only
  today) and avoiding any change to the docs-site Preview tab beyond what was
  asked for. If broader docs-site coverage is wanted, it is a follow-up, not a
  gap in this plan.
