# Shell fidelity U4: `status` and `loading` on every shell

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every one of the thirteen family O shells gains a `status` slot and a `loading`
state proven by a loading twin, `notebook-shell` gains `headerActions`, every shell's
guidance gains the command-palette `dos` line, and the demos show a notifications control
beside the account menu where the slot already exists, without changing what an existing
consumer renders.

**Architecture:** A new `registry:lib` item, `shell-skeleton`, supplies every skeleton
part. Each shell renders its manifest regions as `ShellSkeletonRegion`s in an early-return
`loading` branch, and marks each loaded region's box with `data-loading-region`. Two
harness helpers prove the contract: a jsdom half (`expectShellLoadingContract`,
`expectShellLoadedContract` in `apps/docs/lib/test-utils.ts`) and a real-browser half, the
loading twin (`apps/storybook/src/lib/loading-twin.tsx`), which measures both states of one
shell in one story. Controller tasks 0 to 3 land the shared pieces on the integration
branch; task 4 is a pathfinder shell; tasks 5 to 16 are one shell each and independent (a
contract wave); tasks 17 and 18 integrate, emit contracts once, and run the gates.

**Tech Stack:** Next.js 16 docs app, React 19, Tailwind v4, Base UI primitives, vitest +
jsdom (unit), Storybook 9 + `@storybook/addon-vitest` + `@storybook/addon-a11y` in
Chromium (stories), pnpm + turbo.

**Spec:** [`docs/superpowers/specs/2026-09-24-shell-fidelity-design.md`](../specs/2026-09-24-shell-fidelity-design.md),
§3 U4, §6 success criteria, §7 build order item 4, §9 open questions. Read it beside this
plan. The contract this plan designs is written, once, into
`docs/design-system/block-build-brief.md` by Task 3; this plan does not restate it after
that.

---

## Decisions for Nick

**Decided 2026-09-27:** Nick accepted both recommendations (A2, `status` as a slot; B1,
`loading` as one boolean) and vetoed none of the nine smaller calls. The shell wave runs as
two waves of six. The plan is executed from `main` at `697a5f7`, after PR #78 merged.

The spec leaves two calls to this plan. Both are made below, with the evidence, and the
tasks are written for the recommendation. Reply by letter to overrule.

### A. `status`: a manifest region, or a plain slot

**What was read.** `regions` is hand-kept in `apps/docs/lib/catalog.manifest.ts`
(`scripts/gen-manifest.mts` is a one-shot bootstrap nobody reruns). Three things read it:
`check-contract.mts` (every declared region must appear as the literal
`data-region="<id>"` in the shell's source, an `includes()` check), `contract:emit` (merges
`regions` verbatim into each `<name>.meta.json` and `public/llms/components/<name>.md`; the
`index/components.toon` row does not carry it), and each shell's unit test (`REGIONS`,
rendered from a bare `<Shell />`). `anatomy` is authored in the guidance module (D23) and
gated by `check-citations.mts`, which accepts an anatomy slot only if it exists as a
`data-slot` literal or a `data-region` in the shell or in something it consumes.
`block-build-brief.md` says "Mount every region unconditionally, even when empty". The spec
says `status` is "mounted only when given, so an existing consumer sees no change".

|                         | A1. Region                                                                                                                                  | A2. Slot (recommended)                                                                                                      |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Files and contracts     | 13 `regions` arrays in the manifest; 13 metas and 13 llms pages change `regions`; `block-build-brief.md`; every shell's `REGIONS` test list | Guidance `anatomy` gains `<name>-status` (13 metas and pages change through `contract:emit` anyway, for the guidance edits) |
| What the shell renders  | An always-mounted `<div data-region="status" className="contents">` in every shell, to honour the brief and the bare-render region test     | Nothing, unless `status` is passed                                                                                          |
| Loading twin            | Needs a carve-out: `status` has no skeleton, so it is the one region without a `data-loading-region`                                        | No carve-out                                                                                                                |
| Consumer-visible change | One more empty element in every shell's DOM, and a new region in every installed contract                                                   | One new optional prop                                                                                                       |

**Recommendation: A2, a slot.** The spec's own requirement, mounted only when given,
contradicts the brief's rule that a region mounts unconditionally; honouring both needs an
always-empty wrapper in every shell. `status` holds host content, the same kind as
`topbar`, `headerActions` and `sidebarFooter`, none of which are regions. A region is a
piece of the layout the skeleton must twin, and `status` has no loading form. The
contract gate's region check is a source `includes()`, so it would prove no more than the
anatomy citation check already proves for a slot.

**If Nick picks A1:** Task 3 adds `"status"` to 13 `regions` arrays and says so in the
brief text; Task 2's two helpers take an `exempt: ["status"]` option (no skeleton, no
`data-loading-region`); every shell task mounts
`<div data-region="status" className="contents">{status}</div>` in both branches in place
of the `statusStrip` markup, adds `"status"` to its test's `REGIONS`, leaves it out of the
twin map, and writes its anatomy entry as `data-region="status"`.

### B. `loading`: one boolean, or per region

**What was read.** The spec's candidate for a partial state is chat with threads loaded
and the stream pending. Every shell already takes an empty-override slot per data region
(`threadsEmpty`, `navEmpty`, `empty`, `featuresEmpty`, `recentsEmptyTitle`, `outputsEmpty`,
`tracksEmpty`, `contentEmpty`, `providersEmpty`). With one boolean, a chat host
passes `loading={false}`, its threads, `messages={[]}` and
`empty={<ShellSkeletonLines count={6} />}`: the stream shows lines while the thread list
and composer already work. A region-level wait is expressible from outside, with the same
skeleton parts, today.

|            | B1. One boolean (recommended)             | B2. Per region                                                                                                                          |
| ---------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| API        | `loading?: boolean` on 13 shells          | `loading?: boolean \| Partial<Record<Region, boolean>>`, with a region union type exported from 13 shells and written into 13 contracts |
| Shell code | One early-return branch per shell         | A conditional at every region site, 58 in total                                                                                         |
| Semantics  | `aria-busy` on the root, as the spec says | `aria-busy` moves to each region; "nothing interactive mounted" becomes per region                                                      |
| Proof      | One twin per shell, against one fixture   | A twin per partial combination, or a proof of none of them                                                                              |
| Stories    | `Loading` per shell                       | `Loading` per shell plus at least chat's partial story                                                                                  |

**Recommendation: B1, one boolean, plus a documented partial pattern.** It is what the
spec already assumes, the one real partial case has a clean answer with existing slots
(chat gets a `dos` line for it), and B2 ships a union type into 13 public APIs that cannot
be walked back (the same asymmetry D22 used).

**If Nick picks B2:** Task 1 adds a `regionLoading(loading, region)` resolver to the lib;
Task 2's helpers take the subset of regions that are loading; Task 3's brief text moves
`aria-busy` to the region; every shell task replaces the early return with per-region
conditionals, and Task 5 (chat) adds a `PartialLoading` story.

### Other calls this plan makes (veto by number)

1. **The twin compares edges by kind, not four edges everywhere.** A region's box is
   `frame` (x, y, width, height), `flow-lead` (x, y, width), `flow` (x, width) or `text`
   (x, y, height). The spec says "within 8px of loaded geometry per region". Heights set by
   the host's data inside a scroll column, and widths set by the words in a breadcrumb, are
   derived numbers (D21): comparing them compares a fixture or a font, not the skeleton.
   Of the 58 regions, five use `flow`, two `flow-lead` and one `text`, in three shells
   (home, chat, settings); the other 50 are `frame`.
2. **Rows are drawn from the vendored `Skeleton` at `SidebarMenuSkeleton`'s geometry, not
   with `SidebarMenuSkeleton`.** The spec names `SidebarMenuSkeleton`. It picks a random
   bar width in `useState`, so a server-rendered shell hydrates with a mismatch, and
   importing it would put the whole vendored `sidebar` on the eight shells that do not use
   B1. `ShellSkeletonRows` keeps its 32px row, 16px icon and 16px bar, with fixed widths.
3. **`status` still renders while `loading`.** "Offline" at first paint is exactly when a
   surface-wide message matters. It is the one host slot a loading shell renders, and the
   helpers exclude its subtree from the nothing-interactive check.
4. **Loading unmounts B1 `app-sidebar` and L6 `onboarding-wizard`**, because each leaves a
   control in the DOM (B1 always renders its rail button; L6 hides its step navigation with
   a class). The sidebar skeleton reads the provider's own state; `auth-shell`'s skeleton
   composes the vendored `Card`, so `auth-shell` gains `card` in `shadcn`.
5. **A skeleton reserves a row only for props the host has already passed** (`headline`,
   `suggestions`, `contextChips`, `headerActions`, `accountMenu`, `announcements`, `sorts`,
   `types`, selected facets, `onModeChange`, `providers`) and never invents one. List data
   is a fixed number of placeholders.
6. **U3's four prop gaps labelled "U4's job" in `CONTINUE.md` §8 stay parked**: a `promo`
   prop on records and docs, the account menu as the trailing header item in generation
   and records, and a chrome slot on timeline and explore. They are not in the spec's §3 U4
   list; taking them adds props to six shells. Say "take 6" to add a task per shell.
7. **The docs-shell demo gets no chrome here.** Its account menu is U3's deferred Task 11,
   waiting on `claude/docs-shell-rail-brand`; the notifications control goes in with it.
8. **`notebook-shell`'s `headerActions` renders as a bar above the chat column**, only when
   passed. A bar across all three panes would restructure the root for every consumer.
9. **Wave size.** Twelve shell agents is over the ten-agent line. Default: two waves of six
   after the pathfinder. One wave of twelve needs a yes.

---

## Global Constraints

- **Identity.** Repo `VV-DSGN-INC/Super-AI-Components`, not `weeeha/*`. Confirm the remote
  and branch out loud before any push. Never push to `main`. Commit author:
  `git -c user.name="weeeha" -c user.email="1083934+weeeha@users.noreply.github.com" commit`.
  End each commit message with the attribution trailer your own session's instructions
  give.
- **The one shared file.** `apps/docs/lib/catalog.manifest.ts` is written only by Task 3
  (controller). `apps/docs/lib/lib.manifest.ts` only by Task 1. No shell task writes either.
- **Contracts derive.** Never hand-edit a `.meta.json`, `index/components.toon` or
  `apps/docs/public/llms*`. The guidance module is the source; `pnpm contract:emit` writes
  the rest. A shell task runs it to prove its module evaluates, commits only its own
  `<name>.meta.json` and `public/llms/components/<name>.md`, and discards its changes to
  `apps/docs/index/components.toon`, `public/llms.txt` and `public/llms-full.txt`. Task 17 emits once
  after integration.
- **Shrink-only ledgers.** `apps/storybook/vitest.config.ts`'s a11y exclusion list,
  `apps/docs/scripts/lib/story-coverage.baseline.json` and
  `apps/docs/scripts/lib/contract-coverage.baseline.json` never grow. No shell agent
  commits either baseline or `apps/docs/content/system/facts.json`.
- **Tokens.** Never pair a bare `text-muted-foreground` with a bare `bg-muted`, `bg-accent`
  or `bg-secondary`; where a surface is painted and composed muted text lands on it,
  rebind `--muted-foreground` on the surface. A skeleton block is `bg-muted`, so a skeleton
  is never placed on a `bg-muted` surface. No literal `transition-all` or `animate-bounce`
  anywhere under `apps/docs/registry/`, comments included (MOT-1, MOT-2 grep the text).
  Prefer scale classes to arbitrary pixels (LAY-1): `w-23` for 92px, not `w-[92px]`.
- **D21.** A story pins only a number its own classes dictate. The loading twin compares
  two measured states of one shell in one run, and pins no number of its own.
- **Stories.** Every new export gets a JSDoc description. Story JSDoc renders on the docs
  page: no plan, task, wave or `CONTINUE.md` wording in it. Every story is axe-gated by
  `preview.tsx`'s `a11y: { test: "error" }`. Never add `status` or `loading` to a story
  file's `FULL_ARGS`: `KeyboardOrder`, `RTL` and others spread it and pin tab order and
  geometry. New exports go at the end of the file.
- **Lessons from U3, carried.**
  - Overlays portal to `document.body`: a play that opens a menu queries `within(document.body)`.
  - A component in a narrow region can fail axe's `scrollable-region-focusable`. Never
    blank a label to pass it; nothing in a loading shell scrolls, which is why every
    loading region is `overflow-hidden`.
  - The vendored `Alert`'s destructive description is 4.49:1 on `bg-card`. A destructive
    `Alert` puts `text-destructive` on the description's text span and on any button inside
    it, never only on `AlertDescription`.
  - Prettier may fold a prop list onto one line; compare against this plan indentation-
    and wrap-insensitively.
- **Copy.** No em dashes in any prose, comment or JSDoc this plan writes. English strings
  at the call site (D22): no label props for "Loading". Demo and story content is what this
  system could really emit; Northwind is the house fixture.
- **Fresh worktrees** have no `node_modules`: `pnpm install --offline --frozen-lockfile`
  from the repo root first (drop `--offline` once if the store misses a package).
- **Gates.** Only the controller runs `.claude/skills/gate-run/run-gates.sh`, and only in
  Task 18. An implementer runs the focused commands its task lists, in the foreground.
- **Storybook cache.** Never `rm -rf apps/storybook/node_modules/.cache/storybook` while a
  Storybook dev server is running from the same worktree.
- **Out of scope.** Deploying; the docs-site skin; any new shell; the flow gaps parked in
  `CONTINUE.md` §8; carrying any of this to the Minimal Design System (which has its own
  `skeleton` primitive and a loading-states pattern; the shell skeletons are shell-specific
  and belong here).

---

## The twin's targets, measured

Measured on 2026-09-26 against `apps/storybook/storybook-static` (built 19:18 EDT from this
branch, after U3's last commit), Chromium, 1200×900, each shell's first story (its
`FULL_ARGS`). Box relative to the shell root. Each shell task repeats its own rows; this
table is for review.

| shell      | region             | x   | y   | w    | h   | kind      |
| ---------- | ------------------ | --- | --- | ---- | --- | --------- |
| home       | sidebar            | 0   | 0   | 256  | 900 | frame     |
| home       | topbar             | 256 | 0   | 944  | 48  | frame     |
| home       | hero-omnibox       | 280 | 48  | 896  | 294 | flow-lead |
| home       | feature-cards      | 280 | 382 | 896  | 132 | flow      |
| home       | recents-grid       | 280 | 554 | 896  | 464 | flow      |
| chat       | sidebar            | 0   | 0   | 256  | 900 | frame     |
| chat       | topbar             | 256 | 0   | 944  | 48  | frame     |
| chat       | message-stream     | 256 | 48  | 944  | 657 | frame     |
| chat       | artifact-cards     | 360 | 248 | 736  | 306 | flow      |
| chat       | composer           | 256 | 705 | 944  | 196 | frame     |
| studio     | modality-rail      | 0   | 0   | 92   | 900 | frame     |
| studio     | topbar             | 92  | 0   | 1108 | 48  | frame     |
| studio     | tool-panel         | 92  | 48  | 288  | 852 | frame     |
| studio     | canvas             | 380 | 48  | 532  | 757 | frame     |
| studio     | page-strip         | 380 | 805 | 532  | 95  | frame     |
| studio     | inspector          | 912 | 48  | 288  | 852 | frame     |
| timeline   | rail               | 0   | 0   | 92   | 900 | frame     |
| timeline   | content-panel      | 92  | 0   | 288  | 900 | frame     |
| timeline   | preview            | 380 | 0   | 500  | 562 | frame     |
| timeline   | transport          | 380 | 562 | 500  | 81  | frame     |
| timeline   | tracks-ruler       | 380 | 643 | 500  | 257 | frame     |
| timeline   | inspector          | 880 | 0   | 320  | 900 | frame     |
| generation | topbar             | 0   | 0   | 1200 | 48  | frame     |
| generation | config-panel       | 16  | 64  | 384  | 820 | frame     |
| generation | cost-generate      | 40  | 836 | 344  | 32  | frame     |
| generation | result-canvas      | 416 | 64  | 768  | 820 | frame     |
| library    | facet-rail         | 0   | 0   | 256  | 900 | frame     |
| library    | header             | 256 | 0   | 944  | 139 | frame     |
| library    | dense-grid         | 256 | 139 | 944  | 761 | frame     |
| explore    | rail               | 0   | 0   | 92   | 900 | frame     |
| explore    | docked-prompt-bar  | 92  | 0   | 1108 | 151 | frame     |
| explore    | sort-tabs          | 108 | 163 | 1076 | 34  | frame     |
| explore    | masonry-feed       | 108 | 209 | 1076 | 675 | frame     |
| artifact   | sidebar            | 0   | 0   | 256  | 900 | frame     |
| artifact   | header             | 256 | 0   | 944  | 83  | frame     |
| artifact   | search             | 256 | 83  | 944  | 49  | frame     |
| artifact   | artifact-card-grid | 256 | 132 | 944  | 768 | frame     |
| records    | sidebar            | 0   | 0   | 256  | 900 | frame     |
| records    | header             | 256 | 0   | 944  | 56  | frame     |
| records    | filter-sort        | 256 | 56  | 944  | 47  | frame     |
| records    | record-rows        | 256 | 103 | 944  | 797 | frame     |
| docs       | icon-rail          | 0   | 0   | 48   | 900 | frame     |
| docs       | doc-nav            | 48  | 0   | 256  | 900 | frame     |
| docs       | announcement-strip | 304 | 0   | 896  | 49  | frame     |
| docs       | content-column     | 304 | 49  | 896  | 851 | frame     |
| settings   | breadcrumb         | 16  | 16  | 208  | 20  | text      |
| settings   | grouped-nav        | 0   | 53  | 240  | 847 | frame     |
| settings   | info-callout       | 256 | 69  | 928  | 40  | flow-lead |
| settings   | setting-sections   | 256 | 133 | 928  | 426 | flow      |
| settings   | code-block         | 256 | 583 | 928  | 215 | flow      |
| notebook   | sources            | 0   | 0   | 288  | 900 | frame     |
| notebook   | chat               | 288 | 0   | 592  | 709 | frame     |
| notebook   | composer           | 288 | 709 | 592  | 192 | frame     |
| notebook   | studio-outputs     | 880 | 0   | 320  | 900 | frame     |
| auth       | marketing-panel    | 184 | 300 | 388  | 370 | frame     |
| auth       | provider-rows      | 612 | 284 | 420  | 176 | frame     |
| auth       | email-fallback     | 612 | 476 | 420  | 123 | frame     |
| auth       | legal-footer       | 612 | 653 | 420  | 33  | frame     |

Three facts from the same measurement shaped the skeletons: the B1 sidebar regions are
`display: contents`, so their box is B1's own container; D1 `media-prompt-bar` measures
130px with modes and no chips and 164px with both (chips add 34px); and the auth card is
vertically centred, so every auth region's `y` depends on the card's total height (504px).

---

## Execution

**Branch.** If PR #78 (`claude/app-shell-design-patterns-36dd75`, U3) has merged, cut
`claude/shell-fidelity-u4` from `origin/main`; `main` then carries PR #75, so
`SMOKE_PORT=3101` works in Task 18. If #78 is still open, cut from
`origin/claude/app-shell-design-patterns-36dd75`, say in the PR body that U4 stacks on #78,
and retarget to `main` the moment #78 merges (stacked bases get merged into the wrong
branch here). If U2 (the preview route) lands first, its `h-[42rem]` to `h-full` demo edit
touches the same demo files as this plan's chrome edits; the conflicts are line-local.

**Order.**

1. Tasks 0 to 3, controller, sequential, committed on `claude/shell-fidelity-u4`.
2. Task 4, `home-shell`, the pathfinder: one implementer, then the controller reads its
   diff, its twin output and its deliberate-failure probe. Any fix to a Task 1 to 3
   artifact it forces lands on the integration branch before anything else is dispatched.
3. Tasks 5 to 16, one Sonnet (medium) implementer each, each in its own Agent-tool
   worktree (`isolation: "worktree"`). Default two waves: 5 to 10, then 11 to 16.
4. Task 17 (integrate) and Task 18 (docs, gates, verify), controller.

**Cost, stated before launch.** Pathfinder: 1 Sonnet agent, about 200k tokens. Wave: 12
Sonnet agents at 150k to 230k each, about 2.4M in total. Integration and review on the
session model. Nothing here runs on Opus or Fable.

**Implementer prompt.** Point, do not paste (`CONTINUE.md` §3.4):

> Step 0: `git merge --ff-only claude/shell-fidelity-u4`, then `git log -1 --oneline` and
> confirm it is at or after the Task 4 commit. Then `pnpm install --offline
--frozen-lockfile` at the repo root. Read `docs/design-system/component-build-brief.md`,
> `docs/design-system/block-build-brief.md` (all of it, including "Status and loading"),
> `docs/design-system/story-conventions.md`, then only Task N of
> `docs/superpowers/plans/2026-09-26-shell-fidelity-u4.md`. Do its steps in order. Write
> only the files Task N lists. Never run `run-gates.sh`. Commit only the files Task N's
> commit step names. Report tersely: commit sha, unit test count before and after, the
> story file's result, the twin's output if it failed at any point, and anything in the
> task you could not honour, with the reason.

---

## File Structure

| Path                                                                                                   | Task    | Responsibility                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------ | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/docs/registry/super-ai/shell-skeleton.tsx`                                                       | 1       | Create. `registry:lib`: `ShellSkeletonRegion`, `ShellSkeletonBlock`, `ShellSkeletonRows`, `ShellSkeletonLines`, `ShellSkeletonTiles`, `ShellSkeletonSidebar`, `ShellLoadingLabel` |
| `apps/docs/registry/super-ai/shell-skeleton.test.tsx`                                                  | 1       | Create. Its unit tests                                                                                                                                                            |
| `apps/docs/lib/lib.manifest.ts`                                                                        | 1       | Modify. The lib item's row                                                                                                                                                        |
| `apps/docs/lib/test-utils.ts`, `apps/docs/lib/test-utils.test.tsx`                                     | 2       | Modify. The jsdom half of the contract                                                                                                                                            |
| `apps/storybook/src/lib/loading-twin.tsx`                                                              | 2       | Create. `LoadingTwin`, `expectLoadingTwin`, `TwinKind`                                                                                                                            |
| `apps/docs/components/demos/demo-notifications.tsx`                                                    | 2       | Create. `DemoNotifications`, demo-only                                                                                                                                            |
| `docs/design-system/block-build-brief.md`                                                              | 3       | Modify. The "Status and loading" contract                                                                                                                                         |
| `apps/docs/lib/catalog.manifest.ts`                                                                    | 3       | Modify. 13 `consumes` gain `shell-skeleton`; `auth-shell` `shadcn` gains `card`                                                                                                   |
| `apps/docs/registry/super-ai/*.meta.json`, `apps/docs/public/llms*`, `apps/docs/index/components.toon` | 3, 17   | Derived by `pnpm contract:emit`                                                                                                                                                   |
| `apps/docs/registry/super-ai/<name>.tsx` ×13                                                           | 4 to 16 | Modify. Props, status strip, loaded markers, loading branch                                                                                                                       |
| `apps/docs/registry/super-ai/<name>.test.tsx` ×13                                                      | 4 to 16 | Modify. Status and loading tests                                                                                                                                                  |
| `apps/storybook/src/stories/super-ai/<Pascal>.stories.tsx` ×13                                         | 4 to 16 | Modify. `Loading` and `Status` exports                                                                                                                                            |
| `apps/docs/content/components/<name>.docs.tsx` ×13                                                     | 4 to 16 | Modify. usage, anatomy, dos, accessibility, pitfalls                                                                                                                              |
| `apps/docs/components/demos/<name>-demo.tsx` ×9                                                        | 4 to 16 | Modify. Notifications beside the account menu; chat's shortcuts hint; notebook's `headerActions`                                                                                  |
| `docs/CONTINUE.md`, the spec                                                                           | 18      | Modify. What U4 found; the spec's §9 answers                                                                                                                                      |

---

### Task 0: Bootstrap, baseline and the decisions on record (controller)

**Files:**

- Create (gitignored, not committed): `.superpowers/sdd/shell-fidelity-u4/ledger.md`

**Interfaces:**

- Produces: branch `claude/shell-fidelity-u4`, a green baseline, the ledger every later
  task appends to.

- [ ] **Step 1: Confirm the target out loud**

```bash
cd "/Users/nickv/ClaudeCode Projects/Super-AI-Components/.claude/worktrees/superai-design-system-alignment-e0e2b0"
git remote -v
git fetch origin
git merge-base --is-ancestor origin/claude/app-shell-design-patterns-36dd75 origin/main && echo "PR 78 merged" || echo "PR 78 open"
```

Expected: `origin` is `github.com/VV-DSGN-INC/Super-AI-Components`. Say which base the
branch will take, per "Execution" above.

- [ ] **Step 2: Cut the integration branch**

If PR 78 merged:

```bash
git switch -c claude/shell-fidelity-u4 origin/main
```

If PR 78 is open:

```bash
git switch -c claude/shell-fidelity-u4 origin/claude/app-shell-design-patterns-36dd75
```

If this worktree has uncommitted work, stop and ask; do not stash.

- [ ] **Step 3: Install and confirm the baseline is green**

```bash
pnpm install --offline --frozen-lockfile
pnpm typecheck
pnpm lint
cd apps/docs && pnpm check:contract && pnpm test && cd ../..
```

Expected: all four exit 0. Write the `pnpm test` file and test counts into the ledger. If
anything is red, stop and report it; nothing below is built on a red base.

- [ ] **Step 4: Record the decisions and the constraints**

Create `.superpowers/sdd/shell-fidelity-u4/ledger.md` with the base commit
(`git log -1 --oneline`), which of Decisions A, B and calls 1 to 9 Nick confirmed or
overruled, and the wave size chosen. Then run the repo's `unslop` skill
(`.claude/skills/unslop/`), Phase 0 only, for "a loading skeleton and a status strip in
thirteen app shells", and paste its constraints into the ledger. Tasks 4 to 16 read the
ledger through their reviewer, not through their prompt.

No commit in this task.

---

### Task 1: The `shell-skeleton` registry lib item (controller)

**Files:**

- Create: `apps/docs/registry/super-ai/shell-skeleton.tsx`
- Create: `apps/docs/registry/super-ai/shell-skeleton.test.tsx`
- Modify: `apps/docs/lib/lib.manifest.ts` (append one row to `LIB_MANIFEST`)

**Interfaces:**

- Produces, from `@/registry/super-ai/shell-skeleton`:
  - `ShellSkeletonRegion(props: React.ComponentProps<"div"> & { region: string })`: a
    `div` with `aria-hidden="true"`, `data-slot="shell-skeleton-region"`,
    `data-region={region}`, `data-loading-region={region}`; none overridable.
  - `ShellSkeletonBlock(props: React.ComponentProps<"div">)`: the vendored `Skeleton`,
    `aria-hidden`, with `motion-reduce:animate-none`.
  - `ShellSkeletonRows({ count = 6, className })`: 32px rows, icon and bar.
  - `ShellSkeletonLines({ count = 3, className })`: 16px lines, last one `w-2/3`.
  - `ShellSkeletonTiles({ count = 6, className, tileClassName })`: a `grid gap-3` of
    tiles, default `aspect-video w-full rounded-lg`.
  - `ShellSkeletonSidebar({ region, collapsed = false, className })`: a B1-width column.
  - `ShellLoadingLabel()`: a `p.sr-only` reading "Loading".

- [ ] **Step 1: Write the failing test**

Create `apps/docs/registry/super-ai/shell-skeleton.test.tsx`:

```tsx
import { render } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  ShellLoadingLabel,
  ShellSkeletonBlock,
  ShellSkeletonLines,
  ShellSkeletonRegion,
  ShellSkeletonRows,
  ShellSkeletonSidebar,
  ShellSkeletonTiles,
} from "./shell-skeleton";

describe("ShellSkeletonRegion", () => {
  it("marks the region for the contract gate and the loading twin, hidden from assistive tech", () => {
    const { container } = render(<ShellSkeletonRegion region="topbar" className="h-12" />);
    const region = container.firstElementChild!;
    expect(region).toHaveAttribute("data-slot", "shell-skeleton-region");
    expect(region).toHaveAttribute("data-region", "topbar");
    expect(region).toHaveAttribute("data-loading-region", "topbar");
    expect(region).toHaveAttribute("aria-hidden", "true");
    expect(region).toHaveClass("h-12");
  });

  it("does not let a caller unhide it or rename its region", () => {
    const { container } = render(
      <ShellSkeletonRegion
        region="topbar"
        aria-hidden={false}
        data-region="other"
        data-loading-region="other"
      />,
    );
    const region = container.firstElementChild!;
    expect(region).toHaveAttribute("aria-hidden", "true");
    expect(region).toHaveAttribute("data-region", "topbar");
    expect(region).toHaveAttribute("data-loading-region", "topbar");
  });
});

describe("ShellSkeletonBlock", () => {
  // jsdom evaluates no media queries, so the reduced-motion branch is only
  // observable as the class that creates it. That is why this one assertion
  // reads a class rather than a behaviour.
  it("is hidden from assistive tech and stills its pulse under reduced motion", () => {
    const { container } = render(<ShellSkeletonBlock className="h-4 w-24" />);
    const block = container.firstElementChild!;
    expect(block).toHaveAttribute("aria-hidden", "true");
    expect(block).toHaveClass("motion-reduce:animate-none", "h-4", "w-24");
  });
});

describe("ShellSkeletonRows", () => {
  it("renders the requested number of rows", () => {
    const { container } = render(<ShellSkeletonRows count={5} />);
    expect(container.querySelectorAll('[data-slot="shell-skeleton-row"]')).toHaveLength(5);
  });

  // The reason these rows exist instead of the vendored SidebarMenuSkeleton,
  // which picks a random width in state: two renders must be byte-identical,
  // or a server-rendered shell fails hydration.
  it("renders the same markup every time", () => {
    expect(renderToStaticMarkup(<ShellSkeletonRows count={6} />)).toBe(
      renderToStaticMarkup(<ShellSkeletonRows count={6} />),
    );
  });
});

describe("ShellSkeletonLines", () => {
  it("renders the requested number of lines with a short last line", () => {
    const { container } = render(<ShellSkeletonLines count={4} />);
    const lines = container.querySelectorAll('[data-slot="skeleton"]');
    expect(lines).toHaveLength(4);
    expect(lines[3]).toHaveClass("w-2/3");
    expect(lines[0]).toHaveClass("w-full");
  });
});

describe("ShellSkeletonTiles", () => {
  it("renders the requested number of tiles and takes the caller's grid and tile classes", () => {
    const { container } = render(
      <ShellSkeletonTiles count={3} className="grid-cols-3" tileClassName="aspect-square" />,
    );
    expect(container.firstElementChild).toHaveClass("grid", "grid-cols-3");
    const tiles = container.querySelectorAll('[data-slot="skeleton"]');
    expect(tiles).toHaveLength(3);
    expect(tiles[0]).toHaveClass("aspect-square");
  });
});

describe("ShellSkeletonSidebar", () => {
  it("takes B1's expanded width and draws rows", () => {
    const { container } = render(<ShellSkeletonSidebar region="sidebar" />);
    const region = container.firstElementChild!;
    expect(region).toHaveAttribute("data-loading-region", "sidebar");
    expect(region).toHaveClass("w-(--sidebar-width)");
    expect(region.querySelector('[data-slot="shell-skeleton-rows"]')).not.toBeNull();
  });

  it("takes B1's icon width and draws icons when collapsed", () => {
    const { container } = render(<ShellSkeletonSidebar region="icon-rail" collapsed />);
    const region = container.firstElementChild!;
    expect(region).toHaveAttribute("data-region", "icon-rail");
    expect(region).toHaveClass("w-(--sidebar-width-icon)");
    expect(region.querySelector('[data-slot="shell-skeleton-rows"]')).toBeNull();
  });
});

describe("ShellLoadingLabel", () => {
  it("is the one line a screen reader finds, and it is not visible", () => {
    const { container } = render(<ShellLoadingLabel />);
    expect(container.firstElementChild).toHaveTextContent("Loading");
    expect(container.firstElementChild).toHaveClass("sr-only");
  });
});
```

- [ ] **Step 2: Run it to see it fail**

```bash
cd apps/docs && pnpm vitest run registry/super-ai/shell-skeleton.test.tsx
```

Expected: FAIL, `Failed to resolve import "./shell-skeleton"`.

- [ ] **Step 3: Write the lib**

Create `apps/docs/registry/super-ai/shell-skeleton.tsx`:

```tsx
import * as React from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * Shell skeletons: the parts a shell draws while `loading`.
 *
 * Contract: docs/design-system/block-build-brief.md, "Status and loading".
 *
 * Every part is built on the vendored `Skeleton` and adds three things the bare
 * primitive does not have:
 *
 * 1. It is hidden from assistive tech. A skeleton has nothing to say; the shell
 *    root's `aria-busy` and `ShellLoadingLabel` say it, once.
 * 2. It stills the pulse under reduced motion. `Skeleton` pulses with no
 *    reduced-motion branch of its own.
 * 3. It renders the same markup on the server and on the client. The vendored
 *    `SidebarMenuSkeleton` picks a random bar width in state, which differs
 *    between the two and fails hydration; rows here cycle through fixed widths
 *    at the same 32px row height instead.
 */

/** The pulse, stilled for anyone who asked for less motion. */
const STILL = "motion-reduce:animate-none";

/** Bar widths a column of rows cycles through, so it reads as text rather than as a barcode. */
const ROW_WIDTHS = ["w-3/4", "w-1/2", "w-2/3", "w-5/6"] as const;

interface ShellSkeletonRegionProps extends React.ComponentProps<"div"> {
  /** The manifest region this skeleton stands in for, such as "topbar". */
  region: string;
}

/**
 * One region of a loading shell. It carries the region marker the contract gate
 * reads and the marker the loading twin measures, and it is hidden from
 * assistive tech. A caller can override none of the three.
 */
function ShellSkeletonRegion({ region, ...props }: ShellSkeletonRegionProps) {
  return (
    <div
      {...props}
      aria-hidden="true"
      data-slot="shell-skeleton-region"
      data-region={region}
      data-loading-region={region}
    />
  );
}

/** One pulse block, sized by its classes. */
function ShellSkeletonBlock({ className, ...props }: React.ComponentProps<"div">) {
  return <Skeleton {...props} aria-hidden="true" className={cn(STILL, className)} />;
}

interface ShellSkeletonCountProps {
  count?: number;
  className?: string;
}

/** Rows the height of a sidebar menu item: 32px, an icon and a bar. For rails, navs and lists. */
function ShellSkeletonRows({ count = 6, className }: ShellSkeletonCountProps) {
  return (
    <div data-slot="shell-skeleton-rows" className={cn("flex flex-col gap-1", className)}>
      {Array.from({ length: count }, (_, index) => (
        <div key={index} data-slot="shell-skeleton-row" className="flex h-8 items-center gap-2 px-2">
          <ShellSkeletonBlock className="size-4 shrink-0" />
          <ShellSkeletonBlock className={cn("h-4", ROW_WIDTHS[index % ROW_WIDTHS.length])} />
        </div>
      ))}
    </div>
  );
}

/** Lines of prose, 16px each, the last one short. */
function ShellSkeletonLines({ count = 3, className }: ShellSkeletonCountProps) {
  return (
    <div data-slot="shell-skeleton-lines" className={cn("flex flex-col gap-2", className)}>
      {Array.from({ length: count }, (_, index) => (
        <ShellSkeletonBlock key={index} className={cn("h-4", index === count - 1 ? "w-2/3" : "w-full")} />
      ))}
    </div>
  );
}

interface ShellSkeletonTilesProps extends ShellSkeletonCountProps {
  /** Classes for every tile. The default is a 16:9 tile as wide as its column. */
  tileClassName?: string;
}

/** Tiles for a grid. Pass the loaded grid's own column classes as `className`. */
function ShellSkeletonTiles({ count = 6, className, tileClassName }: ShellSkeletonTilesProps) {
  return (
    <div data-slot="shell-skeleton-tiles" className={cn("grid gap-3", className)}>
      {Array.from({ length: count }, (_, index) => (
        <ShellSkeletonBlock key={index} className={cn("aspect-video w-full rounded-lg", tileClassName)} />
      ))}
    </div>
  );
}

interface ShellSkeletonSidebarProps {
  /** The manifest region: "sidebar", or the docs shell's "icon-rail". */
  region: string;
  /** The sidebar provider's state. Read it with `useSidebar()` inside the provider. */
  collapsed?: boolean;
  className?: string;
}

/**
 * A B1 sidebar's skeleton, at B1's own width. Render it inside the shell's
 * `SidebarProvider`, which sets the two width variables it reads. Hidden below
 * `md`, where B1 is a drawer and draws nothing until it is opened.
 */
function ShellSkeletonSidebar({ region, collapsed = false, className }: ShellSkeletonSidebarProps) {
  return (
    <ShellSkeletonRegion
      region={region}
      className={cn(
        "bg-sidebar hidden h-full shrink-0 flex-col gap-2 border-e p-2 md:flex",
        collapsed ? "w-(--sidebar-width-icon)" : "w-(--sidebar-width)",
        className,
      )}
    >
      <ShellSkeletonBlock className="h-8 w-full" />
      {collapsed ? (
        <div className="flex flex-col items-center gap-2 pt-2">
          {Array.from({ length: 6 }, (_, index) => (
            <ShellSkeletonBlock key={index} className="size-8" />
          ))}
        </div>
      ) : (
        <ShellSkeletonRows count={8} />
      )}
    </ShellSkeletonRegion>
  );
}

/** The one line a screen reader finds inside a loading shell. */
function ShellLoadingLabel() {
  return (
    <p data-slot="shell-loading-label" className="sr-only">
      Loading
    </p>
  );
}

export {
  ShellLoadingLabel,
  ShellSkeletonBlock,
  ShellSkeletonLines,
  ShellSkeletonRegion,
  ShellSkeletonRows,
  ShellSkeletonSidebar,
  ShellSkeletonTiles,
};
export type { ShellSkeletonRegionProps, ShellSkeletonSidebarProps, ShellSkeletonTilesProps };
```

- [ ] **Step 4: Run the test to see it pass**

```bash
cd apps/docs && pnpm vitest run registry/super-ai/shell-skeleton.test.tsx
```

Expected: PASS, 10 tests.

- [ ] **Step 5: Register the lib item**

In `apps/docs/lib/lib.manifest.ts`, append after the `initials` row, inside `LIB_MANIFEST`:

```ts
  {
    name: "shell-skeleton",
    title: "Shell skeletons",
    description:
      "Skeleton regions, rows, lines, tiles and a sidebar for a shell's loading state: hidden from assistive tech, still under reduced motion, and the same on server and client.",
    status: "shipped",
    shadcn: ["skeleton"],
    npm: [],
    target: "lib/shell-skeleton.tsx",
  },
```

`target` follows `initials`, whose `lib/initials.tsx` is imported by `account-menu` as
`@/registry/super-ai/initials` and resolves in the consumer install test's `pnpm build`;
the same path does the same here.

- [ ] **Step 6: Verify the item is legal and installable**

```bash
cd apps/docs
pnpm check:tokens
pnpm check:contract
pnpm vitest run lib/catalog.manifest.test.ts scripts/lib/registry-extras.test.ts
pnpm build:registry
node -e 'const r=require("./public/r/shell-skeleton.json"); console.log(r.type, r.files[0].target, r.registryDependencies)'
cd ../.. && pnpm typecheck && pnpm lint
```

Expected: all exit 0; the last line prints `registry:lib lib/shell-skeleton.tsx [ 'skeleton' ]`.
`check:contract` is still fully green here: no shell consumes the item yet.

- [ ] **Step 7: Commit**

```bash
pnpm exec prettier --write apps/docs/registry/super-ai/shell-skeleton.tsx apps/docs/registry/super-ai/shell-skeleton.test.tsx apps/docs/lib/lib.manifest.ts
git add apps/docs/registry/super-ai/shell-skeleton.tsx apps/docs/registry/super-ai/shell-skeleton.test.tsx apps/docs/lib/lib.manifest.ts
git -c user.name="weeeha" -c user.email="1083934+weeeha@users.noreply.github.com" commit -m "feat(shell-fidelity): shell-skeleton registry lib item for the loading state"
```

---

### Task 2: The two halves of the proof, and the demo notifications control (controller)

**Files:**

- Modify: `apps/docs/lib/test-utils.ts` (append)
- Modify: `apps/docs/lib/test-utils.test.tsx` (append)
- Create: `apps/storybook/src/lib/loading-twin.tsx`
- Create: `apps/docs/components/demos/demo-notifications.tsx`

**Interfaces:**

- Consumes: `ShellSkeletonRegion` (Task 1), only inside the test of Step 1.
- Produces:
  - `expectShellLoadingContract(root: Element, contract: { name: string; regions: readonly string[] }): void`
    from `@/lib/test-utils`. Throws unless the root has `aria-busy="true"`, each region is
    marked once with `data-region` and once with a hidden `data-loading-region`, and no
    interactive element is mounted outside `[data-slot="<name>-status"]`.
  - `expectShellLoadedContract(root: Element, contract: { name: string; regions: readonly string[] }): void`
    from `@/lib/test-utils`. Throws unless the root has no `aria-busy`, each region has
    exactly one `data-loading-region`, and no `shell-skeleton-region` is mounted.
  - `LoadingTwin({ children: (loading: boolean) => React.ReactNode })`,
    `expectLoadingTwin(canvasElement: HTMLElement, shell: string, regions: Record<string, TwinKind>): Promise<void>`,
    `type TwinKind = "frame" | "flow-lead" | "flow" | "text"`,
    `LOADING_TWIN_TOLERANCE = 8`, from `@/lib/loading-twin` (Storybook's `@/` is
    `apps/storybook/src`).
  - `DemoNotifications({ unread?: number })` from `@/components/demos/demo-notifications`.

- [ ] **Step 1: Write the failing tests for the jsdom half**

Append to `apps/docs/lib/test-utils.test.tsx`, and add
`expectShellLoadedContract, expectShellLoadingContract` to its `./test-utils` import:

```tsx
describe("expectShellLoadingContract", () => {
  const REGIONS = ["topbar", "canvas"];

  it("passes a busy root whose regions are hidden skeletons and which mounts nothing interactive", () => {
    const { container } = render(
      <div data-slot="demo-shell" aria-busy="true">
        <div data-region="topbar" data-loading-region="topbar" aria-hidden="true" />
        <div data-region="canvas" data-loading-region="canvas" aria-hidden="true" />
        <div data-slot="demo-shell-status">
          <button type="button">Retry</button>
        </div>
      </div>,
    );
    expect(() =>
      expectShellLoadingContract(container.firstElementChild!, { name: "demo-shell", regions: REGIONS }),
    ).not.toThrow();
  });

  it("fails a root that is not busy, a skeleton that is announced, and a mounted control", () => {
    const { container } = render(
      <div data-slot="demo-shell">
        <div data-region="topbar" data-loading-region="topbar" />
        <div data-region="canvas" data-loading-region="canvas" aria-hidden="true">
          <a href="#next">Next</a>
        </div>
      </div>,
    );
    expect(() =>
      expectShellLoadingContract(container.firstElementChild!, { name: "demo-shell", regions: REGIONS }),
    ).toThrow(/aria-busy[\s\S]*"topbar" skeleton is not hidden[\s\S]*1 interactive element/);
  });

  it("fails a region with no skeleton", () => {
    const { container } = render(
      <div data-slot="demo-shell" aria-busy="true">
        <div data-region="topbar" data-loading-region="topbar" aria-hidden="true" />
      </div>,
    );
    expect(() =>
      expectShellLoadingContract(container.firstElementChild!, { name: "demo-shell", regions: REGIONS }),
    ).toThrow(/region "canvas" is marked 0 times/);
  });
});

describe("expectShellLoadedContract", () => {
  const REGIONS = ["topbar", "canvas"];

  it("passes a loaded root with one measured box per region", () => {
    const { container } = render(
      <div data-slot="demo-shell">
        <header data-region="topbar" data-loading-region="topbar" />
        <div data-region="canvas" data-loading-region="canvas" />
      </div>,
    );
    expect(() =>
      expectShellLoadedContract(container.firstElementChild!, { name: "demo-shell", regions: REGIONS }),
    ).not.toThrow();
  });

  it("fails a loaded root that is still busy or has lost a region's marker", () => {
    const { container } = render(
      <div data-slot="demo-shell" aria-busy="true">
        <header data-region="topbar" data-loading-region="topbar" />
        <div data-region="canvas" />
      </div>,
    );
    expect(() =>
      expectShellLoadedContract(container.firstElementChild!, { name: "demo-shell", regions: REGIONS }),
    ).toThrow(/aria-busy while loaded[\s\S]*"canvas" has 0/);
  });
});
```

- [ ] **Step 2: Run them to see them fail**

```bash
cd apps/docs && pnpm vitest run lib/test-utils.test.tsx
```

Expected: FAIL, `expectShellLoadingContract is not a function` (or the equivalent import
error).

- [ ] **Step 3: Write the jsdom half**

Append to `apps/docs/lib/test-utils.ts`:

```ts
/**
 * Everything a user could focus, click or type into. DOM-level on purpose: jsdom
 * applies no stylesheet, so it cannot tell a hidden control from a shown one, and
 * the loading contract says nothing interactive is mounted, not that it is hidden.
 */
const INTERACTIVE = [
  "a[href]",
  "button",
  "input",
  "select",
  "textarea",
  "summary",
  '[contenteditable="true"]',
  '[tabindex]:not([tabindex="-1"])',
  '[role="button"]',
  '[role="link"]',
  '[role="checkbox"]',
  '[role="radio"]',
  '[role="switch"]',
  '[role="tab"]',
  '[role="menuitem"]',
  '[role="option"]',
  '[role="slider"]',
  '[role="combobox"]',
  '[role="textbox"]',
].join(", ");

interface ShellContract {
  /** The shell's registry name, which is also its root `data-slot`. */
  name: string;
  /** The shell's manifest `regions`. */
  regions: readonly string[];
}

function describeElement(el: Element): string {
  const slot = el.getAttribute("data-slot");
  return slot ? `${el.tagName.toLowerCase()}[data-slot=${slot}]` : el.tagName.toLowerCase();
}

function fail(name: string, half: string, problems: string[]): void {
  if (problems.length > 0) throw new Error(`${name} ${half} contract:\n  ${problems.join("\n  ")}`);
}

/**
 * The loading half of a family O shell's contract (block-build-brief.md, "Status
 * and loading"): a busy root, every region drawn once as a skeleton hidden from
 * assistive tech, and nothing mounted that takes focus apart from `status`.
 * The browser half, that each skeleton sits where its region will land, is the
 * loading twin in apps/storybook/src/lib/loading-twin.tsx.
 */
export function expectShellLoadingContract(root: Element, { name, regions }: ShellContract): void {
  const problems: string[] = [];
  if (root.getAttribute("aria-busy") !== "true") problems.push('the root does not carry aria-busy="true"');
  for (const region of regions) {
    const marked = root.querySelectorAll(`[data-region="${region}"]`).length;
    if (marked !== 1) problems.push(`region "${region}" is marked ${marked} times, expected once`);
    const twins = root.querySelectorAll(`[data-loading-region="${region}"]`);
    if (twins.length !== 1) problems.push(`region "${region}" has ${twins.length} skeletons, expected one`);
    else if (!twins[0].closest('[aria-hidden="true"]'))
      problems.push(`the "${region}" skeleton is not hidden from assistive tech`);
  }
  const status = root.querySelector(`[data-slot="${name}-status"]`);
  const live = Array.from(root.querySelectorAll(INTERACTIVE)).filter((el) => !status?.contains(el));
  if (live.length > 0)
    problems.push(
      `${live.length} interactive element(s) mounted while loading: ${live.slice(0, 3).map(describeElement).join(", ")}`,
    );
  fail(name, "loading", problems);
}

/**
 * The loaded half: no `aria-busy`, and each region's box carries the
 * `data-loading-region` marker the loading twin measures, exactly once.
 */
export function expectShellLoadedContract(root: Element, { name, regions }: ShellContract): void {
  const problems: string[] = [];
  if (root.hasAttribute("aria-busy")) problems.push("the root carries aria-busy while loaded");
  for (const region of regions) {
    const boxes = root.querySelectorAll(`[data-loading-region="${region}"]`).length;
    if (boxes !== 1)
      problems.push(`region "${region}" has ${boxes} [data-loading-region] boxes, expected one`);
  }
  if (root.querySelector('[data-slot="shell-skeleton-region"]'))
    problems.push("a skeleton region is mounted while loaded");
  fail(name, "loaded", problems);
}
```

- [ ] **Step 4: Run them to see them pass**

```bash
cd apps/docs && pnpm vitest run lib/test-utils.test.tsx
```

Expected: PASS, the two existing tests plus five new ones.

- [ ] **Step 5: Write the browser half, the loading twin**

Create `apps/storybook/src/lib/loading-twin.tsx`:

```tsx
import * as React from "react";
import { expect, userEvent, waitFor } from "storybook/test";

/**
 * The loading twin: the proof that a family O shell's skeleton sits where its
 * loaded regions will land, so the page does not jump when the data arrives.
 *
 * Contract: docs/design-system/block-build-brief.md, "Status and loading". The
 * jsdom half (a busy root, one hidden skeleton per region, nothing mounted that
 * takes focus) is expectShellLoadingContract in apps/docs/lib/test-utils.ts.
 */

/** Every compared edge may differ by at most this many CSS pixels. */
export const LOADING_TWIN_TOLERANCE = 8;

/** The gate's own viewport, pinned so the proof measures one layout everywhere. */
const VIEWPORT = { width: 1200, height: 900 } as const;

const FLIP_EVENT = "loading-twin:flip";

type Edge = "x" | "y" | "width" | "height";

/**
 * What decides a region's box, and so which edges the twin compares. Only a
 * number the layout's classes dictate is compared (D21):
 *
 * - `frame`: a rail, a bar, a panel or a pane the layout places and sizes. All four.
 * - `flow-lead`: the first region in a scroll column, whose height the host's
 *   data decides. Everything but the height.
 * - `flow`: a later region in a scroll column, whose top and height the data
 *   above it and inside it decide. Its x and width.
 * - `text`: a region as wide as the words in it. Everything but the width.
 */
export type TwinKind = "frame" | "flow-lead" | "flow" | "text";

const EDGES: Record<TwinKind, readonly Edge[]> = {
  frame: ["x", "y", "width", "height"],
  "flow-lead": ["x", "y", "width"],
  flow: ["x", "width"],
  text: ["x", "y", "height"],
};

/**
 * Renders one shell and lets `expectLoadingTwin` flip it between its loading and
 * loaded states without remounting the story. It starts loading, which is what
 * the docs page shows.
 */
export function LoadingTwin({ children }: { children: (loading: boolean) => React.ReactNode }) {
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    const onFlip = (event: Event) => setLoading((event as CustomEvent<boolean>).detail);
    document.addEventListener(FLIP_EVENT, onFlip);
    return () => document.removeEventListener(FLIP_EVENT, onFlip);
  }, []);
  return <>{children(loading)}</>;
}

type Box = Record<Edge, number>;

function measure(root: HTMLElement, regions: readonly string[]): Record<string, Box> {
  const origin = root.getBoundingClientRect();
  const boxes: Record<string, Box> = {};
  for (const region of regions) {
    const found = root.querySelectorAll<HTMLElement>(`[data-loading-region="${region}"]`);
    if (found.length !== 1)
      throw new Error(`${region}: expected one [data-loading-region], found ${found.length}`);
    const rect = found[0].getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0)
      throw new Error(
        `${region}: its box is empty at ${VIEWPORT.width}x${VIEWPORT.height}, so there is nothing to compare`,
      );
    boxes[region] = {
      x: rect.left - origin.left,
      y: rect.top - origin.top,
      width: rect.width,
      height: rect.height,
    };
  }
  return boxes;
}

const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

/**
 * Measures every region of `shell` loading and loaded, in one frame, from the
 * story's own fixture, and fails when a compared edge differs by more than
 * LOADING_TWIN_TOLERANCE. It also fails when the loading shell draws a region
 * the map does not name (or misses one it does), and when a Tab from the page
 * lands inside the loading shell. It leaves the shell loading, so axe checks the
 * state the story is named for.
 */
export async function expectLoadingTwin(
  canvasElement: HTMLElement,
  shell: string,
  regions: Record<string, TwinKind>,
): Promise<void> {
  try {
    const { page } = await import("vitest/browser");
    await page.viewport(VIEWPORT.width, VIEWPORT.height);
  } catch (_outsideVitest) {
    // `vitest/browser` exists only inside the vitest runner. In Storybook's own
    // UI the proof measures at whatever viewport the reader has open.
  }

  const root = () => {
    const found = canvasElement.querySelector<HTMLElement>(`[data-slot="${shell}"]`);
    if (!found) throw new Error(`no [data-slot="${shell}"] in this story`);
    return found;
  };
  const flip = async (loading: boolean) => {
    document.dispatchEvent(new CustomEvent(FLIP_EVENT, { detail: loading }));
    await waitFor(() => expect(root().getAttribute("aria-busy") === "true").toBe(loading));
    await nextFrame();
    await nextFrame();
  };
  const names = Object.keys(regions);

  await flip(true);
  const drawn = Array.from(root().querySelectorAll("[data-loading-region]"), (el) =>
    el.getAttribute("data-loading-region"),
  ).sort();
  await expect(drawn).toEqual([...names].sort());

  (document.activeElement as HTMLElement | null)?.blur();
  await userEvent.tab();
  await expect(root().contains(document.activeElement)).toBe(false);

  const skeleton = measure(root(), names);
  await flip(false);
  const loaded = measure(root(), names);
  await flip(true);

  const misses: string[] = [];
  for (const [region, kind] of Object.entries(regions)) {
    for (const edge of EDGES[kind]) {
      const delta = Math.abs(skeleton[region][edge] - loaded[region][edge]);
      if (delta > LOADING_TWIN_TOLERANCE)
        misses.push(
          `${region} ${edge}: skeleton ${Math.round(skeleton[region][edge])}, loaded ${Math.round(loaded[region][edge])}`,
        );
    }
  }
  await expect(misses).toEqual([]);
}
```

The helper is exercised by the first shell story that uses it (Task 4), which also makes
it fail on purpose before trusting it.

- [ ] **Step 6: Write the demo notifications control**

Create `apps/docs/components/demos/demo-notifications.tsx`:

```tsx
"use client";

import { Bell } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * The notifications control a host puts beside its account menu. Demo-only: the
 * registry ships no notifications component, and every shell with an account
 * slot takes this in that same slot, which is why no shell has a
 * `notifications` prop (shell fidelity spec, section 4).
 */
export function DemoNotifications({ unread = 2 }: { unread?: number }) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
      className="relative"
    >
      <Bell aria-hidden />
      {unread > 0 ? (
        <span aria-hidden className="bg-primary absolute end-1 top-1 size-1.5 rounded-full" />
      ) : null}
    </Button>
  );
}
```

The dot is decoration; the count is in the accessible name, so nothing rests on colour.

- [ ] **Step 7: Verify and commit**

```bash
cd apps/docs && pnpm vitest run lib/test-utils.test.tsx && cd ../..
pnpm typecheck
pnpm lint
pnpm exec prettier --write apps/docs/lib/test-utils.ts apps/docs/lib/test-utils.test.tsx apps/storybook/src/lib/loading-twin.tsx apps/docs/components/demos/demo-notifications.tsx
git add apps/docs/lib/test-utils.ts apps/docs/lib/test-utils.test.tsx apps/storybook/src/lib/loading-twin.tsx apps/docs/components/demos/demo-notifications.tsx
git -c user.name="weeeha" -c user.email="1083934+weeeha@users.noreply.github.com" commit -m "test(shell-fidelity): loading contract helpers, the loading twin, and a demo notifications control"
```

Expected: typecheck and lint exit 0 (typecheck covers `apps/storybook`).

---

### Task 3: The contract in writing, and the manifest prepared (controller)

**Files:**

- Modify: `docs/design-system/block-build-brief.md` (insert a section)
- Modify: `apps/docs/lib/catalog.manifest.ts` (13 `consumes`, one `shadcn`)
- Derived and committed: 13 `apps/docs/registry/super-ai/<shell>.meta.json`,
  `apps/docs/public/llms/components/<shell>.md`, `apps/docs/public/llms-full.txt`, and
  `apps/docs/index/components.toon` and `apps/docs/public/llms.txt` if the emit changes them

**Interfaces:**

- Produces: the normative text every shell agent reads; `shell-skeleton` in every shell's
  `consumes`, which is what lets `check-citations.mts` accept the anatomy entry
  `shell-skeleton-region` and what makes each shell's own `pnpm reconcile:deps <name>`
  clean the moment it imports the lib.

- [ ] **Step 1: Write the contract into the block brief**

In `docs/design-system/block-build-brief.md`, insert this section immediately before
`## The four gate assertions, and what each is worth`:

```markdown
## Status and loading

Every shell takes two props beyond its regions, and both follow one contract.

**`status`** is a slot, not a region. It holds a message about the whole surface (offline,
reconnecting, a failed save, an expired session, a rate limit), filled by M6
`rate-limit-banner` or the vendored `Alert`. It renders under the topbar, or at the top of
the content column in a shell with no topbar, in a wrapper carrying
`data-slot="<shell>-status"`, and only when given: a shell without it renders exactly what
it rendered before. The shell adds no live region; the component passed in owns its
announcement. It is the one host slot that still renders while `loading`.

**`loading`** is one boolean, for first paint. While it is true:

1. The root carries `aria-busy="true"` and one visually hidden line, `ShellLoadingLabel`.
2. Every manifest region renders as exactly one `ShellSkeletonRegion`, which carries
   `data-region`, `data-loading-region` and `aria-hidden`. Composed components are not
   mounted, host slots other than `status` are not rendered, and no element scrolls or
   takes a tab stop. B1 `app-sidebar` and L6 `onboarding-wizard` are not mounted either:
   each leaves a control in the DOM (B1's rail button, L6's class-hidden step navigation).
3. A skeleton reserves a row only for props the host has already passed (`headline`,
   `contextChips`, `accountMenu`, `headerActions` and the like). It never draws a row the
   loaded shell would not render. List data (threads, messages, items) is a fixed number
   of placeholders.
4. Every block comes from `shell-skeleton`, the `registry:lib` item, which hides it from
   assistive tech, stills its pulse under reduced motion and renders the same markup on
   server and client.

While it is false, each region's box carries `data-loading-region="<region>"` too: the
`data-region` element itself, or, where that wrapper is `display: contents`, the composed
component that draws the box (B1, in O1, O2, O9, O10 and O11).

**The loading twin** is the proof, in each shell's `Loading` story. `expectLoadingTwin`
(`apps/storybook/src/lib/loading-twin.tsx`) renders the shell from the story's full
fixture, measures every `data-loading-region` against the shell root in both states at
1200×900, and fails when a compared edge differs by more than 8px. Which edges it compares
depends on what decides them (D21):

| kind        | compared            | for a region that                                               |
| ----------- | ------------------- | --------------------------------------------------------------- |
| `frame`     | x, y, width, height | the layout places and sizes: a rail, a bar, a panel, a pane     |
| `flow-lead` | x, y, width         | opens a scroll column, and whose height the host's data decides |
| `flow`      | x, width            | follows another region in a scroll column                       |
| `text`      | x, y, height        | is as wide as the words in it                                   |

The kind is fixed per region in the story. A failing twin is fixed in the skeleton's
classes, never by changing a kind, the tolerance or the fixture. The jsdom half is
`expectShellLoadingContract` and `expectShellLoadedContract` in `apps/docs/lib/test-utils.ts`.

A host that needs one region to wait while the rest works (a thread whose history is still
arriving) leaves `loading` off and passes a `shell-skeleton` part through that region's
empty-override prop.
```

Run `pnpm exec prettier --write docs/design-system/block-build-brief.md` and read the
table back: prettier re-pads it.

- [ ] **Step 2: Prepare the manifest**

In `apps/docs/lib/catalog.manifest.ts`, for each of the thirteen shipped `layer: "block"`
rows (`home-shell`, `chat-shell`, `studio-shell`, `timeline-shell`, `generation-shell`,
`library-shell`, `explore-shell`, `artifact-shell`, `records-shell`, `docs-shell`,
`settings-shell`, `notebook-shell`, `auth-shell`), append `"shell-skeleton"` as the last
entry of `consumes`. On `auth-shell`, change `shadcn: ["button", "field", "input"]` to
`shadcn: ["button", "card", "field", "input"]`. Touch nothing else, and not `flow-shell`
(O5, cut).

- [ ] **Step 3: Emit the contracts the manifest change moved**

```bash
cd apps/docs
pnpm contract:emit
pnpm vitest run scripts/lib/contract-emit.test.ts lib/catalog.manifest.test.ts
pnpm exec tsx scripts/check-contract.mts
pnpm exec tsx scripts/check-citations.mts
pnpm reconcile:deps
cd ../..
```

Expected: the two vitest files pass; `check-contract.mts` and `check-citations.mts` exit 0;
`reconcile:deps` exits 1 with `13 item(s) drifted`, each listing
`consumes declared [..., "shell-skeleton"] · real [...]`, and `auth-shell` also listing
`shadcn declared ["button","card","field","input"]`. That drift is the wave's to close:
`pnpm check:contract` stays red on this branch until Task 17, and no task before 17 uses
it as a signal. Each shell task instead runs `pnpm reconcile:deps <its-name>`, which goes
clean the moment it imports the lib.

- [ ] **Step 4: Commit**

```bash
git add docs/design-system/block-build-brief.md apps/docs/lib/catalog.manifest.ts apps/docs/registry/super-ai/*.meta.json apps/docs/public/llms apps/docs/public/llms.txt apps/docs/public/llms-full.txt apps/docs/index/components.toon
git -c user.name="weeeha" -c user.email="1083934+weeeha@users.noreply.github.com" commit -m "docs(shell-fidelity): the status and loading contract, and shell-skeleton in every shell's consumes"
```

After this commit, and after Task 4 is reviewed, the integration branch is what every
shell agent fast-forwards to.

---

## The shell tasks

Tasks 4 to 16 have one shape. Each writes only its own shell's files, so any two can run
at once. Each is complete on its own: where two tasks carry the same sentence, both carry
it in full.

Every shell task **consumes** from Task 1 the `shell-skeleton` parts, from Task 2
`expectShellLoadingContract` and `expectShellLoadedContract` (`@/lib/test-utils`),
`LoadingTwin` and `expectLoadingTwin` (`@/lib/loading-twin`), and `DemoNotifications`
(`@/components/demos/demo-notifications`); and **produces** two optional props on its
shell, `status?: React.ReactNode` and `loading?: boolean`, plus the wrapper
`data-slot="<name>-status"`. No other task reads anything a shell task produces.

---

### Task 4: `home-shell` (O1), the pathfinder

**Files:**

- Modify: `apps/docs/registry/super-ai/home-shell.tsx`
- Modify: `apps/docs/registry/super-ai/home-shell.test.tsx`
- Modify: `apps/storybook/src/stories/super-ai/HomeShell.stories.tsx`
- Modify: `apps/docs/content/components/home-shell.docs.tsx`
- Modify: `apps/docs/components/demos/home-shell-demo.tsx`
- Derived, committed: `apps/docs/registry/super-ai/home-shell.meta.json`,
  `apps/docs/public/llms/components/home-shell.md`

**Twin targets** (loaded, 1200×900, from `Launcher`): sidebar 0,0,256,900 `frame` ·
topbar 256,0,944,48 `frame` · hero-omnibox 280,48,896,294 `flow-lead` · feature-cards
280,382,896,132 `flow` · recents-grid 280,554,896,464 `flow`.

- [ ] **Step 1: Write the failing tests**

Add `import { expectShellLoadedContract, expectShellLoadingContract } from "@/lib/test-utils";`
to `home-shell.test.tsx`, then append:

```tsx
describe("HomeShell status and loading", () => {
  const root = (container: HTMLElement) => container.querySelector('[data-slot="home-shell"]')!;

  it("marks every region's box and renders no status by default", () => {
    const { container } = render(<HomeShell />);
    expectShellLoadedContract(root(container), { name: "home-shell", regions: REGIONS });
    expect(container.querySelector('[data-slot="home-shell-status"]')).toBeNull();
  });

  it("renders status directly under the topbar", () => {
    const { container } = render(<HomeShell status={<p>You are offline.</p>} />);
    const status = container.querySelector('[data-slot="home-shell-status"]')!;
    expect(status).toHaveTextContent("You are offline.");
    expect(status.previousElementSibling).toHaveAttribute("data-region", "topbar");
  });

  it("draws every region as a skeleton, busy and with nothing to focus, while loading", () => {
    const { container } = render(
      <HomeShell
        loading
        headline="Good afternoon"
        nav={<a href="#projects">Projects</a>}
        sidebarFooter={<button type="button">Account</button>}
        suggestions={SUGGESTIONS}
        features={FEATURES}
        recents={RECENTS}
      />,
    );
    expectShellLoadingContract(root(container), { name: "home-shell", regions: REGIONS });
    expect(container.querySelector('[data-slot="app-sidebar"]')).toBeNull();
    expect(container.querySelector('[data-slot="hero-omnibox"]')).toBeNull();
  });

  it("keeps status while loading", () => {
    const { container } = render(<HomeShell loading status={<p>Reconnecting</p>} />);
    expect(container.querySelector('[data-slot="home-shell-status"]')).toHaveTextContent("Reconnecting");
  });
});
```

- [ ] **Step 2: Run them to see them fail**

```bash
cd apps/docs && pnpm vitest run registry/super-ai/home-shell.test.tsx
```

Expected: the four new tests FAIL (no `data-loading-region`, no status wrapper, no
`aria-busy`); every existing test still passes.

- [ ] **Step 3: Props, imports, the status strip and the loaded markers**

In `home-shell.tsx`:

1. Add `useSidebar` to the existing `@/components/ui/sidebar` import, and add:

```tsx
import {
  ShellLoadingLabel,
  ShellSkeletonBlock,
  ShellSkeletonRegion,
  ShellSkeletonSidebar,
  ShellSkeletonTiles,
} from "@/registry/super-ai/shell-skeleton";
```

2. At the end of `HomeShellProps`, after `recommendationsEmpty`, add:

```tsx
  /**
   * A message about the whole surface: offline, reconnecting, a failed save, an
   * expired session, a rate limit. Renders under the topbar, above everything it
   * affects, and only when given. Pass M6 `rate-limit-banner` or the vendored
   * `Alert`; the shell adds no live region, so the component you pass carries its
   * own role. Still renders while `loading`.
   */
  status?: React.ReactNode;
  /**
   * First paint, before the workspace has loaded. Every region draws a skeleton at
   * the size it will take, the root carries `aria-busy`, and nothing the shell
   * composes is mounted, so there is nothing to focus or click. The hero reserves
   * a headline and a row of starters only when `headline` and `suggestions` are
   * passed.
   */
  loading?: boolean;
```

3. In the parameter list, directly before `className,`, add `status,` and `loading = false,`.

4. Above `function HomeShell(`, add:

```tsx
/**
 * The sidebar region while `loading`. B1 is not mounted, because it always
 * renders its rail button and a loading shell mounts nothing to click. The width
 * comes from the provider's state instead, the same state B1 reads, so the
 * skeleton follows a Cmd/Ctrl+B toggle too.
 */
function HomeShellSidebarSkeleton() {
  const { state } = useSidebar();
  return <ShellSkeletonSidebar region="sidebar" collapsed={state === "collapsed"} />;
}
```

5. After `handleSelectSuggestion` and before the component's `return (`, add:

```tsx
const statusStrip = status ? (
  <div data-slot="home-shell-status" className="shrink-0 border-b px-3 py-2">
    {status}
  </div>
) : null;
```

6. Mark each loaded region's box with `data-loading-region`, on the line after its
   `data-region`: the topbar `div`, and the `hero-omnibox`, `feature-cards` and
   `recents-grid` sections. The sidebar's `data-region` wrapper is `display: contents`, so
   its marker goes on B1 instead: change `<AppSidebar` to `<AppSidebar data-loading-region="sidebar"`.

7. Insert `{statusStrip}` directly after the `</div>` that closes the
   `data-region="topbar"` row, before the `{/* The page column.` comment.

- [ ] **Step 4: The loading branch**

Directly before the component's `return (`, after `statusStrip`, add:

```tsx
if (loading) {
  return (
    <SidebarProvider
      data-slot="home-shell"
      aria-busy="true"
      defaultOpen={defaultSidebarOpen}
      className={cn(
        "bg-background text-foreground h-full min-h-0 w-full overflow-hidden",
        EMBEDDABLE_SHELL,
        SIDEBAR_FILLS_SHELL,
        className,
      )}
      {...props}
    >
      <ShellLoadingLabel />
      <HomeShellSidebarSkeleton />
      <SidebarInset className="min-w-0 overflow-hidden">
        <ShellSkeletonRegion
          region="topbar"
          className="bg-background flex h-12 shrink-0 items-center gap-2 border-b px-3"
        >
          <ShellSkeletonBlock className="size-7" />
          <ShellSkeletonBlock className="h-4 w-32" />
          <ShellSkeletonBlock className="ms-auto h-6 w-24" />
        </ShellSkeletonRegion>
        {statusStrip}
        <div
          data-slot="home-shell-page"
          className="flex min-h-0 flex-1 flex-col gap-10 overflow-hidden px-4 pb-12 sm:px-6"
        >
          <ShellSkeletonRegion
            region="hero-omnibox"
            className="flex w-full flex-col items-center gap-4 pt-10 sm:pt-16"
          >
            {headline ? <ShellSkeletonBlock className="h-8 w-full max-w-2xl sm:h-9" /> : null}
            <ShellSkeletonBlock className="h-33.5 w-full max-w-2xl rounded-2xl" />
            {suggestions.length > 0 || suggestionsOverflow ? (
              <ShellSkeletonBlock className="h-7 w-full max-w-2xl" />
            ) : null}
          </ShellSkeletonRegion>
          <ShellSkeletonRegion
            region="feature-cards"
            className="mx-auto flex w-full max-w-5xl flex-col gap-2"
          >
            <ShellSkeletonBlock className="h-6 w-40" />
            <ShellSkeletonTiles
              count={4}
              className="grid-cols-2 sm:grid-cols-4"
              tileClassName="aspect-auto h-25"
            />
          </ShellSkeletonRegion>
          <ShellSkeletonRegion region="recents-grid" className="mx-auto flex w-full max-w-5xl flex-col gap-2">
            <ShellSkeletonBlock className="h-6 w-24" />
            <div className="@container">
              <ShellSkeletonTiles
                count={6}
                className="grid-cols-2 @[40rem]:grid-cols-3 @[64rem]:grid-cols-4"
              />
            </div>
          </ShellSkeletonRegion>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
```

The page column keeps its `data-slot` and classes but is `overflow-hidden`: a loading
column that scrolled would be a scroll region with nothing to focus, which axe fails.

- [ ] **Step 5: Run the unit tests to see them pass**

```bash
cd apps/docs && pnpm vitest run registry/super-ai/home-shell.test.tsx registry/super-ai/shell-skeleton.test.tsx
```

Expected: PASS, every test in both files.

- [ ] **Step 6: The `Loading` and `Status` stories**

In `HomeShell.stories.tsx`, add `WifiOff` to the `lucide-react` import, and add:

```tsx
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { expectLoadingTwin, LoadingTwin } from "@/lib/loading-twin";
```

Append at the end of the file:

```tsx
/**
 * First paint, before the workspace has loaded. Each region draws a skeleton at
 * the size it will take: the sidebar at B1's width, the topbar at its height,
 * and the hero, features and recents bands where the page will put them. The
 * root is marked busy and nothing inside it takes focus. The play renders the
 * loaded launcher in the same frame and fails if a skeleton sits more than 8px
 * from where its region lands. The bands' heights are left out of that
 * comparison, because the workspace's own data decides them.
 */
export const Loading: Story = {
  args: FULL_ARGS,
  render: (args) => <LoadingTwin>{(loading) => <HomeShell {...args} loading={loading} />}</LoadingTwin>,
  play: async ({ canvasElement }) => {
    await expectLoadingTwin(canvasElement, "home-shell", {
      sidebar: "frame",
      topbar: "frame",
      "hero-omnibox": "flow-lead",
      "feature-cards": "flow",
      "recents-grid": "flow",
    });
  },
};

/**
 * The workspace is offline. The message sits under the topbar, above everything
 * it affects, while the page below keeps working from what the device has. The
 * shell adds no live region of its own: the vendored Alert is given
 * `role="status"` here, so the change is announced politely, once.
 */
export const Status: Story = {
  args: {
    ...FULL_ARGS,
    status: (
      <Alert role="status">
        <WifiOff aria-hidden />
        <AlertTitle>You are offline</AlertTitle>
        <AlertDescription>New work saves on this device and syncs when you reconnect.</AlertDescription>
      </Alert>
    ),
  },
  play: async ({ canvasElement }) => {
    const status = canvasElement.querySelector<HTMLElement>('[data-slot="home-shell-status"]');
    await expect(status).not.toBeNull();
    await expect(status!.previousElementSibling).toHaveAttribute("data-region", "topbar");
    await expect(within(status!).getByText("You are offline")).toBeVisible();
  },
};
```

- [ ] **Step 7: Run the story file, then prove the twin can fail**

```bash
cd apps/storybook && pnpm exec vitest run --project storybook src/stories/super-ai/HomeShell.stories.tsx
```

Expected: PASS, every story in the file including `Loading` and `Status`, each under axe.

Then, pathfinder only: change the topbar skeleton's `h-12` to `h-16` in `home-shell.tsx`,
rerun the same command, and confirm `Loading` FAILS with a message containing
`topbar height: skeleton 64, loaded 48` (and later regions' `y` if they move). Revert the
change and rerun: PASS. Paste both outputs into your report. A proof that has never
failed has not been shown to prove anything.

If the twin fails on a real region, fix the skeleton's size classes against the twin
target above, never the kind, the tolerance or the fixture.

- [ ] **Step 8: The guidance module**

In `apps/docs/content/components/home-shell.docs.tsx`:

1. Append to the end of the `usage` string:

```text
 Pass `status` for a message about the whole surface (offline, reconnecting, a failed save, an expired session, a rate limit): it renders under the topbar, only when given, and holds M6 or the vendored Alert. Pass `loading` for first paint: every region draws a skeleton at its loaded size, the root is marked busy, and nothing is mounted that could take focus.
```

2. Append to `anatomy`:

```tsx
    {
      slot: "home-shell-status",
      note: "Under the topbar, only when `status` is passed. Holds M6 or the vendored Alert; the shell adds no live region of its own.",
    },
    {
      slot: "shell-skeleton-region",
      note: "One per region while `loading`: hidden from assistive tech and sized like the loaded region. It carries `data-loading-region`, as does each loaded region's box, which is what the loading twin measures.",
    },
```

3. Append to `dos`:

```tsx
    {
      text: "Mount the command palette once, at the root of your app, and keep it out of the shell: it is not a shell slot, and a palette mounted in each shell binds its shortcut once per surface.",
    },
```

4. Append to `accessibility.keyboard`:

```tsx
      "While `loading`, the shell mounts none of its controls, so there is no tab stop inside it until the data arrives; a control you pass in `status` is the only one.",
```

5. Append to `accessibility.screenReader`:

```tsx
      "While `loading`, the root carries `aria-busy` and every skeleton is hidden from assistive tech, so a screen reader finds one visually hidden line, Loading, plus anything you pass in `status`.",
      "The shell puts no live region around `status`. M6 is a note that announces its countdown politely and the vendored Alert defaults to an assertive alert, so choose the one whose announcement fits the message. Inside a busy root, a screen reader may hold an announcement until `loading` clears.",
```

6. Append to `pitfalls`:

```tsx
    "While `loading`, B1 is not mounted, because it always renders its rail button and a loading shell mounts nothing to click. The sidebar skeleton takes its width from the sidebar provider's state instead, so it follows `defaultSidebarOpen` and a Cmd/Ctrl+B toggle, but anything you pass to `switcher`, `nav`, `sidebarPromo` or `sidebarFooter` appears only once loading ends.",
    "The hero skeleton reserves a headline and a row of starters only when `headline` and `suggestions` are passed. Pass them while loading if the loaded page will show them, or the hero grows when the data arrives.",
```

- [ ] **Step 9: The demo: notifications beside the account menu**

In `apps/docs/components/demos/home-shell-demo.tsx`, add
`import { DemoNotifications } from "@/components/demos/demo-notifications";` and replace
the `sidebarFooter` value with:

```tsx
      sidebarFooter={
        <div className="flex items-center justify-between gap-1 group-data-[collapsible=icon]:flex-col">
          <AccountMenu
            user={{ name: "Ada Lovelace", email: "ada@northwind.example" }}
            theme="system"
            onThemeChange={() => {}}
            background="default"
            onBackgroundChange={() => {}}
            onSignOut={() => {}}
          />
          <DemoNotifications />
        </div>
      }
```

- [ ] **Step 10: Verify**

```bash
cd apps/docs
pnpm vitest run registry/super-ai/home-shell.test.tsx
pnpm reconcile:deps home-shell
pnpm check:tokens
pnpm exec tsx scripts/check-citations.mts
pnpm contract:emit
pnpm vitest run scripts/lib/contract-emit.test.ts scripts/lib/story-coverage.test.ts
cd ../..
pnpm typecheck
pnpm lint
pnpm exec prettier --write apps/docs/registry/super-ai/home-shell.tsx apps/docs/registry/super-ai/home-shell.test.tsx apps/storybook/src/stories/super-ai/HomeShell.stories.tsx apps/docs/content/components/home-shell.docs.tsx apps/docs/components/demos/home-shell-demo.tsx
```

Expected: every command exits 0; `reconcile:deps home-shell` prints
`1 item(s) reconciled, no drift.`; `check-citations` reports all citations reachable.

- [ ] **Step 11: Commit**

```bash
git checkout -- apps/docs/index/components.toon apps/docs/public/llms.txt apps/docs/public/llms-full.txt
git add apps/docs/registry/super-ai/home-shell.tsx apps/docs/registry/super-ai/home-shell.test.tsx apps/docs/registry/super-ai/home-shell.meta.json apps/docs/public/llms/components/home-shell.md apps/storybook/src/stories/super-ai/HomeShell.stories.tsx apps/docs/content/components/home-shell.docs.tsx apps/docs/components/demos/home-shell-demo.tsx
git -c user.name="weeeha" -c user.email="1083934+weeeha@users.noreply.github.com" commit -m "feat(shell-fidelity): home-shell status and loading, with its loading twin"
```

- [ ] **Step 12: Controller review before the wave**

The controller reads this commit's diff, the Step 7 outputs, and the report. Any change to
`shell-skeleton.tsx`, `test-utils.ts`, `loading-twin.tsx` or the brief that the pathfinder
forced is made, tested and committed on the integration branch now, and Tasks 5 to 16 are
dispatched only after it.

---

### Task 5: `chat-shell` (O2)

**Files:**

- Modify: `apps/docs/registry/super-ai/chat-shell.tsx`
- Modify: `apps/docs/registry/super-ai/chat-shell.test.tsx`
- Modify: `apps/storybook/src/stories/super-ai/ChatShell.stories.tsx`
- Modify: `apps/docs/content/components/chat-shell.docs.tsx`
- Modify: `apps/docs/components/demos/chat-shell-demo.tsx`
- Derived, committed: `apps/docs/registry/super-ai/chat-shell.meta.json`,
  `apps/docs/public/llms/components/chat-shell.md`

**Twin targets** (loaded, 1200×900, from `Conversation`): sidebar 0,0,256,900 `frame` ·
topbar 256,0,944,48 `frame` · message-stream 256,48,944,657 `frame` · artifact-cards
360,248,736,306 `flow` · composer 256,705,944,196 `frame`. D1 measures 130px with modes and
no context chips and 164px with both; the composer region adds 32px (border, disclaimer,
bottom padding).

- [ ] **Step 1: Write the failing tests**

Add `import { expectShellLoadedContract, expectShellLoadingContract } from "@/lib/test-utils";`
to `chat-shell.test.tsx`, then append:

```tsx
describe("ChatShell status and loading", () => {
  const root = (container: HTMLElement) => container.querySelector('[data-slot="chat-shell"]')!;

  it("marks every region's box and renders no status by default", () => {
    const { container } = render(<ChatShell />);
    expectShellLoadedContract(root(container), { name: "chat-shell", regions: REGIONS });
    expect(container.querySelector('[data-slot="chat-shell-status"]')).toBeNull();
  });

  it("renders status directly under the topbar", () => {
    const { container } = render(<ChatShell status={<p>The model is at capacity.</p>} />);
    const status = container.querySelector('[data-slot="chat-shell-status"]')!;
    expect(status).toHaveTextContent("The model is at capacity.");
    expect(status.previousElementSibling).toHaveAttribute("data-region", "topbar");
  });

  it("draws every region as a skeleton, busy and with nothing to focus, while loading", () => {
    const { container } = render(
      <ChatShell
        loading
        threadGroups={[{ id: "today", label: "Today", threads: [{ id: "t1", title: "Brand audit" }] }]}
        messages={[{ id: "m1", role: "user", content: "Audit the brand voice." }]}
        contextChips={[{ id: "c1", kind: "file", label: "brand-guide.pdf" }]}
        sidebarFooter={<button type="button">Account</button>}
      />,
    );
    expectShellLoadingContract(root(container), { name: "chat-shell", regions: REGIONS });
    expect(container.querySelector('[data-slot="app-sidebar"]')).toBeNull();
    expect(container.querySelector('[data-slot="media-prompt-bar"]')).toBeNull();
  });

  it("keeps status while loading", () => {
    const { container } = render(<ChatShell loading status={<p>Reconnecting</p>} />);
    expect(container.querySelector('[data-slot="chat-shell-status"]')).toHaveTextContent("Reconnecting");
  });
});
```

- [ ] **Step 2: Run them to see them fail**

```bash
cd apps/docs && pnpm vitest run registry/super-ai/chat-shell.test.tsx
```

Expected: the four new tests FAIL; every existing test still passes.

- [ ] **Step 3: Props, imports, the status strip and the loaded markers**

In `chat-shell.tsx`:

1. Add `useSidebar` to the `@/components/ui/sidebar` import, and add:

```tsx
import {
  ShellLoadingLabel,
  ShellSkeletonBlock,
  ShellSkeletonLines,
  ShellSkeletonRegion,
  ShellSkeletonSidebar,
  ShellSkeletonTiles,
} from "@/registry/super-ai/shell-skeleton";
```

2. At the end of `ChatShellProps`, after `disclaimer`, add:

```tsx
  /**
   * A message about the whole surface: offline, reconnecting, a failed save, an
   * expired session, a rate limit. Renders under the topbar, above the stream it
   * affects, and only when given. Pass M6 `rate-limit-banner` or the vendored
   * `Alert`; the shell adds no live region, so the component you pass carries its
   * own role. Still renders while `loading`.
   */
  status?: React.ReactNode;
  /**
   * First paint, before the workspace has loaded. Every region draws a skeleton at
   * the size it will take, the root carries `aria-busy`, and nothing the shell
   * composes is mounted, so there is nothing to focus or click. For a thread whose
   * history is still arriving while the rest works, leave this off and pass a
   * skeleton through `empty` instead.
   */
  loading?: boolean;
```

3. In the parameter list, directly before `className,`, add `status,` and `loading = false,`.

4. Above `function ChatShell(`, add:

```tsx
/**
 * The sidebar region while `loading`. B1 is not mounted, because it always
 * renders its rail button and a loading shell mounts nothing to click. The width
 * comes from the provider's state instead, the same state B1 reads, so the
 * skeleton follows a Cmd/Ctrl+B toggle too.
 */
function ChatShellSidebarSkeleton() {
  const { state } = useSidebar();
  return <ShellSkeletonSidebar region="sidebar" collapsed={state === "collapsed"} />;
}
```

5. After `const hasTurns = ...;` add:

```tsx
const statusStrip = status ? (
  <div data-slot="chat-shell-status" className="shrink-0 border-b px-3 py-2">
    {status}
  </div>
) : null;
```

6. Add `data-loading-region` beside each loaded region's `data-region`: the topbar `div`,
   the `Conversation` (`data-loading-region="message-stream"`), the `artifact-cards`
   section and the composer `div`. The sidebar's wrapper is `display: contents`, so change
   `<AppSidebar` to `<AppSidebar data-loading-region="sidebar"`.

7. Insert `{statusStrip}` directly after the `</div>` closing the `data-region="topbar"`
   row, before the `{/* AI Elements' Conversation` comment.

- [ ] **Step 4: The loading branch**

Directly before the component's `return (`, after `statusStrip`, add:

```tsx
if (loading) {
  return (
    <SidebarProvider
      data-slot="chat-shell"
      aria-busy="true"
      defaultOpen={defaultSidebarOpen}
      className={cn(
        "bg-background text-foreground h-full min-h-0 w-full overflow-hidden",
        EMBEDDABLE_SHELL,
        SIDEBAR_FILLS_SHELL,
        className,
      )}
      {...props}
    >
      <ShellLoadingLabel />
      <ChatShellSidebarSkeleton />
      <SidebarInset className="min-w-0 overflow-hidden">
        <ShellSkeletonRegion
          region="topbar"
          className="bg-background flex h-12 shrink-0 items-center gap-2 border-b px-3"
        >
          <ShellSkeletonBlock className="size-7" />
          <ShellSkeletonBlock className="h-4 w-48" />
          <ShellSkeletonBlock className="ms-auto h-5 w-20" />
        </ShellSkeletonRegion>
        {statusStrip}
        <ShellSkeletonRegion region="message-stream" className="relative min-h-0 flex-1 overflow-hidden">
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6">
            <ShellSkeletonBlock className="ms-auto h-10 w-2/3 rounded-2xl" />
            <ShellSkeletonLines count={4} />
            <ShellSkeletonRegion region="artifact-cards" className="flex w-full flex-col gap-3 border-t pt-6">
              <ShellSkeletonBlock className="h-5 w-24" />
              <ShellSkeletonTiles count={2} className="sm:grid-cols-2" tileClassName="aspect-auto h-28" />
            </ShellSkeletonRegion>
          </div>
        </ShellSkeletonRegion>
        <ShellSkeletonRegion region="composer" className="bg-background shrink-0 border-t px-4 pb-2">
          <div className="mx-auto w-full max-w-3xl">
            <ShellSkeletonBlock
              className={cn(
                "w-full rounded-t-2xl rounded-b-none",
                contextChips.length > 0 ? "h-41" : "h-32.5",
              )}
            />
            <div className="flex justify-center px-2 pt-1.5">
              <ShellSkeletonBlock className="h-4 w-56" />
            </div>
          </div>
        </ShellSkeletonRegion>
      </SidebarInset>
    </SidebarProvider>
  );
}
```

- [ ] **Step 5: Run the unit tests to see them pass**

```bash
cd apps/docs && pnpm vitest run registry/super-ai/chat-shell.test.tsx
```

Expected: PASS, every test in the file.

- [ ] **Step 6: The `Loading` and `Status` stories**

In `ChatShell.stories.tsx` add:

```tsx
import { expectLoadingTwin, LoadingTwin } from "@/lib/loading-twin";
import { RateLimitBanner } from "@/registry/super-ai/rate-limit-banner";
```

Append at the end of the file:

```tsx
/**
 * First paint, before the workspace has loaded. The sidebar, the topbar, the
 * stream and the composer each draw a skeleton at the size they will take, with
 * the artifact band inside the stream where it will sit, the root is marked busy,
 * and nothing inside it takes focus. The play renders the loaded conversation in
 * the same frame and fails if a skeleton sits more than 8px from where its region
 * lands. The artifact band is compared on its left edge and width only, because
 * the turns above it decide how far down it starts.
 */
export const Loading: Story = {
  args: FULL_ARGS,
  render: (args) => <LoadingTwin>{(loading) => <ChatShell {...args} loading={loading} />}</LoadingTwin>,
  play: async ({ canvasElement }) => {
    await expectLoadingTwin(canvasElement, "chat-shell", {
      sidebar: "frame",
      topbar: "frame",
      "message-stream": "frame",
      "artifact-cards": "flow",
      composer: "frame",
    });
  },
};

/**
 * The model is at capacity. M6 sits under the topbar, above the stream and the
 * composer it holds up, and says in words that nothing is wrong with the request.
 * It is a note rather than an alert: its countdown changes every second, and only
 * a coarse line inside it, one that changes once a minute, is announced.
 */
export const Status: Story = {
  args: {
    ...FULL_ARGS,
    status: <RateLimitBanner cause="provider-capacity" resource="Claude Opus 4.5" remainingSeconds={154} />,
  },
  play: async ({ canvasElement }) => {
    const status = canvasElement.querySelector<HTMLElement>('[data-slot="chat-shell-status"]');
    await expect(status).not.toBeNull();
    await expect(status!.previousElementSibling).toHaveAttribute("data-region", "topbar");
    await expect(within(status!).getByText("The model is at capacity")).toBeVisible();
  },
};
```

- [ ] **Step 7: Run the story file**

```bash
cd apps/storybook && pnpm exec vitest run --project storybook src/stories/super-ai/ChatShell.stories.tsx
```

Expected: PASS, every story in the file, each under axe. If the twin fails on a region,
fix the skeleton's size classes against the twin targets above, never the kind, the
tolerance or the fixture.

- [ ] **Step 8: The guidance module**

In `apps/docs/content/components/chat-shell.docs.tsx`:

1. Append to the end of the `usage` string:

```text
 Pass `status` for a message about the whole surface (offline, reconnecting, a failed save, an expired session, a rate limit): it renders under the topbar, only when given, and holds M6 or the vendored Alert. Pass `loading` for first paint: every region draws a skeleton at its loaded size, the root is marked busy, and nothing is mounted that could take focus.
```

2. Append to `anatomy`:

```tsx
    {
      slot: "chat-shell-status",
      note: "Under the topbar, only when `status` is passed. Holds M6 or the vendored Alert; the shell adds no live region of its own.",
    },
    {
      slot: "shell-skeleton-region",
      note: "One per region while `loading`: hidden from assistive tech and sized like the loaded region. It carries `data-loading-region`, as does each loaded region's box, which is what the loading twin measures.",
    },
```

3. Append to `dos`:

```tsx
    {
      text: "Mount the command palette once, at the root of your app, and keep it out of the shell: it is not a shell slot, and a palette mounted in each shell binds its shortcut once per surface.",
    },
    {
      text: "For a thread whose history is still arriving, leave `loading` off and pass `ShellSkeletonLines` from `shell-skeleton` through `empty`: `loading` is for the first paint of the whole surface, and the thread list and composer already work.",
    },
```

4. Append to `accessibility.keyboard`:

```tsx
      "While `loading`, the shell mounts none of its controls, so there is no tab stop inside it until the data arrives; a control you pass in `status` is the only one.",
```

5. Append to `accessibility.screenReader`:

```tsx
      "While `loading`, the root carries `aria-busy` and every skeleton is hidden from assistive tech, so a screen reader finds one visually hidden line, Loading, plus anything you pass in `status`.",
      "The shell puts no live region around `status`. M6 is a note that announces its countdown politely and the vendored Alert defaults to an assertive alert, so choose the one whose announcement fits the message. Inside a busy root, a screen reader may hold an announcement until `loading` clears.",
```

6. Append to `pitfalls`:

```tsx
    "While `loading`, B1 is not mounted, because it always renders its rail button and a loading shell mounts nothing to click. The sidebar skeleton takes its width from the sidebar provider's state instead, so it follows `defaultSidebarOpen` and a Cmd/Ctrl+B toggle, but `switcher`, `sidebarPromo` and `sidebarFooter` appear only once loading ends.",
    "The composer skeleton reserves D1's context-chip row only when `contextChips` is non-empty. Pass the chips while loading if the loaded composer will show them, or the composer grows by that row when the data arrives.",
```

- [ ] **Step 9: The demo: notifications beside the account menu, and the shortcuts hint**

In `apps/docs/components/demos/chat-shell-demo.tsx`, add these imports:

```tsx
import { Keyboard } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DemoNotifications } from "@/components/demos/demo-notifications";
import { ShortcutsSheet } from "@/registry/super-ai/shortcuts-sheet";
```

Add beside `WORKSPACES`:

```tsx
// Only shortcuts this shell really binds: D1 sends on Enter and breaks a line on
// Shift+Enter, and the vendored sidebar toggles on Cmd/Ctrl+B.
const SHORTCUTS = [
  {
    title: "Conversation",
    shortcuts: [
      { label: "Send the message", keys: ["Enter"] },
      { label: "Start a new line", keys: ["⇧", "Enter"] },
    ],
  },
  { title: "Workspace", shortcuts: [{ label: "Show or hide the sidebar", keys: ["⌘", "B"] }] },
];
```

Replace the `topbar` prop with:

```tsx
      topbar={{
        privacy: { label: "Private" },
        savedLabel: "Saved just now",
        actions: (
          <ShortcutsSheet
            sections={SHORTCUTS}
            trigger={
              <Button type="button" variant="ghost" size="sm">
                <Keyboard aria-hidden />
                Shortcuts
              </Button>
            }
          />
        ),
      }}
```

Replace the `sidebarFooter` value with:

```tsx
      sidebarFooter={
        <div className="flex items-center justify-between gap-1 group-data-[collapsible=icon]:flex-col">
          <AccountMenu
            user={{ name: "Ada Lovelace", email: "ada@northwind.example" }}
            theme="system"
            onThemeChange={() => {}}
            background="default"
            onBackgroundChange={() => {}}
            onSignOut={() => {}}
          />
          <DemoNotifications />
        </div>
      }
```

- [ ] **Step 10: Verify**

```bash
cd apps/docs
pnpm vitest run registry/super-ai/chat-shell.test.tsx
pnpm reconcile:deps chat-shell
pnpm check:tokens
pnpm exec tsx scripts/check-citations.mts
pnpm contract:emit
pnpm vitest run scripts/lib/contract-emit.test.ts scripts/lib/story-coverage.test.ts
cd ../..
pnpm typecheck
pnpm lint
pnpm exec prettier --write apps/docs/registry/super-ai/chat-shell.tsx apps/docs/registry/super-ai/chat-shell.test.tsx apps/storybook/src/stories/super-ai/ChatShell.stories.tsx apps/docs/content/components/chat-shell.docs.tsx apps/docs/components/demos/chat-shell-demo.tsx
```

Expected: every command exits 0; `reconcile:deps chat-shell` prints
`1 item(s) reconciled, no drift.`.

- [ ] **Step 11: Commit**

```bash
git checkout -- apps/docs/index/components.toon apps/docs/public/llms.txt apps/docs/public/llms-full.txt
git add apps/docs/registry/super-ai/chat-shell.tsx apps/docs/registry/super-ai/chat-shell.test.tsx apps/docs/registry/super-ai/chat-shell.meta.json apps/docs/public/llms/components/chat-shell.md apps/storybook/src/stories/super-ai/ChatShell.stories.tsx apps/docs/content/components/chat-shell.docs.tsx apps/docs/components/demos/chat-shell-demo.tsx
git -c user.name="weeeha" -c user.email="1083934+weeeha@users.noreply.github.com" commit -m "feat(shell-fidelity): chat-shell status and loading, shortcuts hint in the demo"
```

---

### Task 6: `artifact-shell` (O9)

**Files:**

- Modify: `apps/docs/registry/super-ai/artifact-shell.tsx`
- Modify: `apps/docs/registry/super-ai/artifact-shell.test.tsx`
- Modify: `apps/storybook/src/stories/super-ai/ArtifactShell.stories.tsx`
- Modify: `apps/docs/content/components/artifact-shell.docs.tsx`
- Modify: `apps/docs/components/demos/artifact-shell-demo.tsx`
- Derived, committed: `apps/docs/registry/super-ai/artifact-shell.meta.json`,
  `apps/docs/public/llms/components/artifact-shell.md`

**Twin targets** (loaded, 1200×900, from `Index`): sidebar 0,0,256,900 `frame` · header
256,0,944,83 `frame` · search 256,83,944,49 `frame` · artifact-card-grid 256,132,944,768
`frame`. The header is 83px: an 8px pad, a 28px title row, an 8px gap, the 30px facet
row, an 8px pad and a 1px rule.

- [ ] **Step 1: Write the failing tests**

Add `import { expectShellLoadedContract, expectShellLoadingContract } from "@/lib/test-utils";`
to `artifact-shell.test.tsx`, then append:

```tsx
describe("ArtifactShell status and loading", () => {
  const root = (container: HTMLElement) => container.querySelector('[data-slot="artifact-shell"]')!;

  it("marks every region's box and renders no status by default", () => {
    const { container } = render(<ArtifactShell />);
    expectShellLoadedContract(root(container), { name: "artifact-shell", regions: REGIONS });
    expect(container.querySelector('[data-slot="artifact-shell-status"]')).toBeNull();
  });

  it("renders status directly under the header", () => {
    const { container } = render(<ArtifactShell status={<p>Your session expired.</p>} />);
    const status = container.querySelector('[data-slot="artifact-shell-status"]')!;
    expect(status).toHaveTextContent("Your session expired.");
    expect(status.previousElementSibling).toHaveAttribute("data-region", "header");
    expect(status.nextElementSibling).toHaveAttribute("data-region", "search");
  });

  it("draws every region as a skeleton, busy and with nothing to focus, while loading", () => {
    const { container } = render(
      <ArtifactShell
        loading
        nav={<a href="#all">All artifacts</a>}
        headerActions={<button type="button">Share</button>}
        onOpenFilters={() => {}}
      />,
    );
    expectShellLoadingContract(root(container), { name: "artifact-shell", regions: REGIONS });
    expect(container.querySelector('[data-slot="app-sidebar"]')).toBeNull();
    expect(container.querySelector('[data-slot="filter-bar"]')).toBeNull();
  });

  it("keeps status while loading", () => {
    const { container } = render(<ArtifactShell loading status={<p>Reconnecting</p>} />);
    expect(container.querySelector('[data-slot="artifact-shell-status"]')).toHaveTextContent("Reconnecting");
  });
});
```

- [ ] **Step 2: Run them to see them fail**

```bash
cd apps/docs && pnpm vitest run registry/super-ai/artifact-shell.test.tsx
```

Expected: the four new tests FAIL; every existing test still passes.

- [ ] **Step 3: Props, imports, the status strip and the loaded markers**

In `artifact-shell.tsx`:

1. Add `useSidebar` to the `@/components/ui/sidebar` import, and add:

```tsx
import {
  ShellLoadingLabel,
  ShellSkeletonBlock,
  ShellSkeletonRegion,
  ShellSkeletonSidebar,
  ShellSkeletonTiles,
} from "@/registry/super-ai/shell-skeleton";
```

2. At the end of `ArtifactShellProps`, after `noResults`, add:

```tsx
  /**
   * A message about the whole surface: offline, reconnecting, a failed save, an
   * expired session, a rate limit. Renders under the header, above the search and
   * the index it affects, and only when given. Pass M6 `rate-limit-banner` or the
   * vendored `Alert`; the shell adds no live region, so the component you pass
   * carries its own role. Still renders while `loading`.
   */
  status?: React.ReactNode;
  /**
   * First paint, before the index has loaded. Every region draws a skeleton at the
   * size it will take, the root carries `aria-busy`, and nothing the shell composes
   * is mounted, so there is nothing to focus or click.
   */
  loading?: boolean;
```

3. In the parameter list, directly before `className,`, add `status,` and `loading = false,`.

4. Above `function ArtifactShell(`, add:

```tsx
/**
 * The sidebar region while `loading`. B1 is not mounted, because it always
 * renders its rail button and a loading shell mounts nothing to click. The width
 * comes from the provider's state instead, the same state B1 reads, so the
 * skeleton follows a Cmd/Ctrl+B toggle too.
 */
function ArtifactShellSidebarSkeleton() {
  const { state } = useSidebar();
  return <ShellSkeletonSidebar region="sidebar" collapsed={state === "collapsed"} />;
}
```

5. After `const resultSummary = ...;` add:

```tsx
const statusStrip = status ? (
  <div data-slot="artifact-shell-status" className="shrink-0 border-b px-3 py-2">
    {status}
  </div>
) : null;
```

6. Add `data-loading-region` beside each loaded region's `data-region`: the `header` div,
   the `search` div and the `artifact-card-grid` section. Change `<AppSidebar` to
   `<AppSidebar data-loading-region="sidebar"`.

7. Insert `{statusStrip}` directly after the `</div>` closing the `data-region="header"`
   div, before the `{/* Search is its own region` comment.

- [ ] **Step 4: The loading branch**

Directly before the component's `return (`, after `statusStrip`, add:

```tsx
if (loading) {
  return (
    <SidebarProvider
      data-slot="artifact-shell"
      aria-busy="true"
      defaultOpen={defaultSidebarOpen}
      className={cn(
        "bg-background text-foreground h-full min-h-0 w-full overflow-hidden",
        EMBEDDABLE_SHELL,
        SIDEBAR_FILLS_SHELL,
        className,
      )}
      {...props}
    >
      <ShellLoadingLabel />
      <ArtifactShellSidebarSkeleton />
      <SidebarInset className="min-w-0 overflow-hidden">
        <ShellSkeletonRegion
          region="header"
          className="bg-background flex shrink-0 flex-col gap-2 border-b px-3 py-2"
        >
          <div className={cn("flex items-center gap-2", headerActions ? "h-8" : "h-7")}>
            <ShellSkeletonBlock className="size-7" />
            <ShellSkeletonBlock className="h-4 w-32" />
            {headerActions ? <ShellSkeletonBlock className="ms-auto h-8 w-24" /> : null}
          </div>
          <div className="flex h-7.5 items-center gap-1.5">
            <ShellSkeletonBlock className="h-7.5 w-12 rounded-full" />
            <ShellSkeletonBlock className="h-7.5 w-24 rounded-full" />
            <ShellSkeletonBlock className="h-7.5 w-20 rounded-full" />
            <ShellSkeletonBlock className="h-7.5 w-20 rounded-full" />
          </div>
        </ShellSkeletonRegion>
        {statusStrip}
        <ShellSkeletonRegion
          region="search"
          className="bg-background flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1 border-b px-3 py-2"
        >
          <ShellSkeletonBlock className="h-8 min-w-0 flex-1 sm:max-w-md" />
          <ShellSkeletonBlock className="h-4 w-14" />
        </ShellSkeletonRegion>
        <ShellSkeletonRegion
          region="artifact-card-grid"
          className="flex min-h-0 flex-1 flex-col gap-6 overflow-hidden px-3 py-4"
        >
          <ShellSkeletonBlock className="h-6 w-24" />
          <div className="@container">
            <ShellSkeletonTiles
              count={6}
              className="@[40rem]:grid-cols-2 @[64rem]:grid-cols-3"
              tileClassName="aspect-auto h-36"
            />
          </div>
        </ShellSkeletonRegion>
      </SidebarInset>
    </SidebarProvider>
  );
}
```

- [ ] **Step 5: Run the unit tests to see them pass**

```bash
cd apps/docs && pnpm vitest run registry/super-ai/artifact-shell.test.tsx
```

Expected: PASS, every test in the file.

- [ ] **Step 6: The `Loading` and `Status` stories**

In `ArtifactShell.stories.tsx`, add `LogIn` to a `lucide-react` import (create the import
if the file has none), add `Button` from `@/components/ui/button` if the file does not
import it yet, and add:

```tsx
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { expectLoadingTwin, LoadingTwin } from "@/lib/loading-twin";
```

Append at the end of the file:

```tsx
/**
 * First paint, before the index has loaded. The sidebar, the header with its facet
 * row, the search row and the card grid each draw a skeleton at the size they
 * will take, the root is marked busy, and nothing inside it takes focus. The play
 * renders the loaded index in the same frame and fails if a skeleton sits more
 * than 8px from where its region lands.
 */
export const Loading: Story = {
  args: FULL_ARGS,
  render: (args) => <LoadingTwin>{(loading) => <ArtifactShell {...args} loading={loading} />}</LoadingTwin>,
  play: async ({ canvasElement }) => {
    await expectLoadingTwin(canvasElement, "artifact-shell", {
      sidebar: "frame",
      header: "frame",
      search: "frame",
      "artifact-card-grid": "frame",
    });
  },
};

/**
 * The session expired while the index was open. The message sits under the
 * header, above the search and the cards it now blocks, and offers the one action
 * that clears it. The vendored Alert keeps its own role, an assertive alert,
 * because this one stops work until it is answered.
 */
export const Status: Story = {
  args: {
    ...FULL_ARGS,
    status: (
      <Alert>
        <LogIn aria-hidden />
        <AlertTitle>Your session expired</AlertTitle>
        <AlertDescription className="flex flex-col items-start gap-2">
          <span>Sign in again to keep working. Nothing you saved is lost.</span>
          <Button type="button" size="sm" variant="outline" onClick={fn()}>
            Sign in again
          </Button>
        </AlertDescription>
      </Alert>
    ),
  },
  play: async ({ canvasElement }) => {
    const status = canvasElement.querySelector<HTMLElement>('[data-slot="artifact-shell-status"]');
    await expect(status).not.toBeNull();
    await expect(status!.previousElementSibling).toHaveAttribute("data-region", "header");
    await expect(within(status!).getByRole("button", { name: "Sign in again" })).toBeVisible();
  },
};
```

- [ ] **Step 7: Run the story file**

```bash
cd apps/storybook && pnpm exec vitest run --project storybook src/stories/super-ai/ArtifactShell.stories.tsx
```

Expected: PASS, every story in the file, each under axe. If the twin fails on a region,
fix the skeleton's size classes against the twin targets above, never the kind, the
tolerance or the fixture.

- [ ] **Step 8: The guidance module**

In `apps/docs/content/components/artifact-shell.docs.tsx`:

1. Append to the end of the `usage` string:

```text
 Pass `status` for a message about the whole surface (offline, reconnecting, a failed save, an expired session, a rate limit): it renders under the header, only when given, and holds M6 or the vendored Alert. Pass `loading` for first paint: every region draws a skeleton at its loaded size, the root is marked busy, and nothing is mounted that could take focus.
```

2. Append to `anatomy`:

```tsx
    {
      slot: "artifact-shell-status",
      note: "Under the header, only when `status` is passed. Holds M6 or the vendored Alert; the shell adds no live region of its own.",
    },
    {
      slot: "shell-skeleton-region",
      note: "One per region while `loading`: hidden from assistive tech and sized like the loaded region. It carries `data-loading-region`, as does each loaded region's box, which is what the loading twin measures.",
    },
```

3. Append to `dos`:

```tsx
    {
      text: "Mount the command palette once, at the root of your app, and keep it out of the shell: it is not a shell slot, and a palette mounted in each shell binds its shortcut once per surface.",
    },
```

4. Append to `accessibility.keyboard`:

```tsx
      "While `loading`, the shell mounts none of its controls, so there is no tab stop inside it until the data arrives; a control you pass in `status` is the only one.",
```

5. Append to `accessibility.screenReader`:

```tsx
      "While `loading`, the root carries `aria-busy` and every skeleton is hidden from assistive tech, so a screen reader finds one visually hidden line, Loading, plus anything you pass in `status`.",
      "The shell puts no live region around `status`. M6 is a note that announces its countdown politely and the vendored Alert defaults to an assertive alert, so choose the one whose announcement fits the message. Inside a busy root, a screen reader may hold an announcement until `loading` clears.",
```

6. Append to `pitfalls`:

```tsx
    "While `loading`, B1 is not mounted, because it always renders its rail button and a loading shell mounts nothing to click. The sidebar skeleton takes its width from the sidebar provider's state instead, so it follows `defaultSidebarOpen` and a Cmd/Ctrl+B toggle, but `switcher`, `nav`, `sidebarPromo` and `sidebarFooter` appear only once loading ends.",
    "The header skeleton always reserves the facet row. An index with one artifact type and no `onOpenFilters` renders no facet row once loaded, so its header shrinks by that row when the data arrives.",
```

- [ ] **Step 9: The demo: notifications beside the account menu**

In `apps/docs/components/demos/artifact-shell-demo.tsx`, add
`import { DemoNotifications } from "@/components/demos/demo-notifications";` and replace
the `sidebarFooter` value with:

```tsx
      sidebarFooter={
        <div className="flex items-center justify-between gap-1 group-data-[collapsible=icon]:flex-col">
          <AccountMenu
            user={{ name: "Ada Lovelace", email: "ada@northwind.example" }}
            theme="system"
            onThemeChange={() => {}}
            background="default"
            onBackgroundChange={() => {}}
            onSignOut={() => {}}
          />
          <DemoNotifications />
        </div>
      }
```

- [ ] **Step 10: Verify**

```bash
cd apps/docs
pnpm vitest run registry/super-ai/artifact-shell.test.tsx
pnpm reconcile:deps artifact-shell
pnpm check:tokens
pnpm exec tsx scripts/check-citations.mts
pnpm contract:emit
pnpm vitest run scripts/lib/contract-emit.test.ts scripts/lib/story-coverage.test.ts
cd ../..
pnpm typecheck
pnpm lint
pnpm exec prettier --write apps/docs/registry/super-ai/artifact-shell.tsx apps/docs/registry/super-ai/artifact-shell.test.tsx apps/storybook/src/stories/super-ai/ArtifactShell.stories.tsx apps/docs/content/components/artifact-shell.docs.tsx apps/docs/components/demos/artifact-shell-demo.tsx
```

Expected: every command exits 0; `reconcile:deps artifact-shell` prints
`1 item(s) reconciled, no drift.`.

- [ ] **Step 11: Commit**

```bash
git checkout -- apps/docs/index/components.toon apps/docs/public/llms.txt apps/docs/public/llms-full.txt
git add apps/docs/registry/super-ai/artifact-shell.tsx apps/docs/registry/super-ai/artifact-shell.test.tsx apps/docs/registry/super-ai/artifact-shell.meta.json apps/docs/public/llms/components/artifact-shell.md apps/storybook/src/stories/super-ai/ArtifactShell.stories.tsx apps/docs/content/components/artifact-shell.docs.tsx apps/docs/components/demos/artifact-shell-demo.tsx
git -c user.name="weeeha" -c user.email="1083934+weeeha@users.noreply.github.com" commit -m "feat(shell-fidelity): artifact-shell status and loading"
```

---

### Task 7: `records-shell` (O10)

**Files:**

- Modify: `apps/docs/registry/super-ai/records-shell.tsx`
- Modify: `apps/docs/registry/super-ai/records-shell.test.tsx`
- Modify: `apps/storybook/src/stories/super-ai/RecordsShell.stories.tsx`
- Modify: `apps/docs/content/components/records-shell.docs.tsx`
- Modify: `apps/docs/components/demos/records-shell-demo.tsx`
- Derived, committed: `apps/docs/registry/super-ai/records-shell.meta.json`,
  `apps/docs/public/llms/components/records-shell.md`

**Twin targets** (loaded, 1200×900, from `Scenarios`): sidebar 0,0,256,900 `frame` ·
header 256,0,944,56 `frame` · filter-sort 256,56,944,47 `frame` · record-rows
256,103,944,797 `frame`.

- [ ] **Step 1: Write the failing tests**

Add `import { expectShellLoadedContract, expectShellLoadingContract } from "@/lib/test-utils";`
to `records-shell.test.tsx`, then append:

```tsx
describe("RecordsShell status and loading", () => {
  const root = (container: HTMLElement) => container.querySelector('[data-slot="records-shell"]')!;

  it("marks every region's box and renders no status by default", () => {
    const { container } = render(<RecordsShell />);
    expectShellLoadedContract(root(container), { name: "records-shell", regions: REGIONS });
    expect(container.querySelector('[data-slot="records-shell-status"]')).toBeNull();
  });

  it("renders status directly under the header", () => {
    const { container } = render(<RecordsShell status={<p>Could not save the schedule.</p>} />);
    const status = container.querySelector('[data-slot="records-shell-status"]')!;
    expect(status).toHaveTextContent("Could not save the schedule.");
    expect(status.previousElementSibling).toHaveAttribute("data-region", "header");
    expect(status.nextElementSibling).toHaveAttribute("data-region", "filter-sort");
  });

  it("draws every region as a skeleton, busy and with nothing to focus, while loading", () => {
    const { container } = render(
      <RecordsShell
        loading
        headerActions={<button type="button">Export</button>}
        onCreate={() => {}}
        filters={[{ id: "failing", label: "Failing", active: true }]}
      />,
    );
    expectShellLoadingContract(root(container), { name: "records-shell", regions: REGIONS });
    expect(container.querySelector('[data-slot="app-sidebar"]')).toBeNull();
    expect(container.querySelector('[data-slot="filter-bar"]')).toBeNull();
  });

  it("keeps status while loading", () => {
    const { container } = render(<RecordsShell loading status={<p>Reconnecting</p>} />);
    expect(container.querySelector('[data-slot="records-shell-status"]')).toHaveTextContent("Reconnecting");
  });
});
```

- [ ] **Step 2: Run them to see them fail**

```bash
cd apps/docs && pnpm vitest run registry/super-ai/records-shell.test.tsx
```

Expected: the four new tests FAIL; every existing test still passes.

- [ ] **Step 3: Props, imports, the status strip and the loaded markers**

In `records-shell.tsx`:

1. Add `useSidebar` to the `@/components/ui/sidebar` import, and add:

```tsx
import {
  ShellLoadingLabel,
  ShellSkeletonBlock,
  ShellSkeletonRegion,
  ShellSkeletonRows,
  ShellSkeletonSidebar,
} from "@/registry/super-ai/shell-skeleton";
```

2. At the end of `RecordsShellProps`, after `feedbackCaption`, add:

```tsx
  /**
   * A message about the whole surface: offline, reconnecting, a failed save, an
   * expired session, a rate limit. Renders under the header, above the filters and
   * rows it affects, and only when given. Pass M6 `rate-limit-banner` or the
   * vendored `Alert`; the shell adds no live region, so the component you pass
   * carries its own role. Still renders while `loading`.
   */
  status?: React.ReactNode;
  /**
   * First paint, before the records have loaded. Every region draws a skeleton at
   * the size it will take, the root carries `aria-busy`, and nothing the shell
   * composes is mounted, so there is nothing to focus or click.
   */
  loading?: boolean;
```

3. In the parameter list, directly before `className,`, add `status,` and `loading = false,`.

4. Above `function RecordsShell(`, add:

```tsx
/**
 * The sidebar region while `loading`. B1 is not mounted, because it always
 * renders its rail button and a loading shell mounts nothing to click. The width
 * comes from the provider's state instead, the same state B1 reads, so the
 * skeleton follows a Cmd/Ctrl+B toggle too.
 */
function RecordsShellSidebarSkeleton() {
  const { state } = useSidebar();
  return <ShellSkeletonSidebar region="sidebar" collapsed={state === "collapsed"} />;
}
```

5. After the `folderItems` mapping, add:

```tsx
const statusStrip = status ? (
  <div data-slot="records-shell-status" className="shrink-0 border-b px-3 py-2">
    {status}
  </div>
) : null;
```

6. Add `data-loading-region` beside each loaded region's `data-region`: the `header`
   element, the `filter-sort` div and the `record-rows` section. Change `<AppSidebar` to
   `<AppSidebar data-loading-region="sidebar"`.

7. Insert `{statusStrip}` directly after `</header>`, before the `{/* "filter + sort".`
   comment.

- [ ] **Step 4: The loading branch**

Directly before the component's `return (`, after `statusStrip`, add:

```tsx
if (loading) {
  return (
    <SidebarProvider
      data-slot="records-shell"
      aria-busy="true"
      defaultOpen={defaultSidebarOpen}
      className={cn(
        "bg-background text-foreground h-full min-h-0 w-full overflow-hidden",
        EMBEDDABLE_SHELL,
        SIDEBAR_FILLS_SHELL,
        className,
      )}
      {...props}
    >
      <ShellLoadingLabel />
      <RecordsShellSidebarSkeleton />
      <SidebarInset className="min-w-0 overflow-hidden">
        <ShellSkeletonRegion
          region="header"
          className="bg-background flex h-14 shrink-0 items-center gap-2 border-b px-2"
        >
          <ShellSkeletonBlock className="size-7" />
          <ShellSkeletonBlock className="h-5 w-28" />
          <ShellSkeletonBlock className="size-4" />
          {headerActions || createAction || onCreate ? (
            <ShellSkeletonBlock className="ms-auto h-7 w-28" />
          ) : null}
        </ShellSkeletonRegion>
        {statusStrip}
        <ShellSkeletonRegion
          region="filter-sort"
          className="bg-background flex shrink-0 flex-wrap items-center gap-2 border-b px-3 py-2"
        >
          <ShellSkeletonBlock className="h-7.5 w-20 rounded-full" />
          <ShellSkeletonBlock className="h-7.5 w-28 rounded-full" />
          <ShellSkeletonBlock className="h-7.5 w-20" />
          <ShellSkeletonBlock className="ms-auto h-7 w-24" />
        </ShellSkeletonRegion>
        <ShellSkeletonRegion
          region="record-rows"
          className="flex min-h-0 flex-1 flex-col gap-6 overflow-hidden px-3 py-4"
        >
          <div className="flex flex-col gap-3">
            <ShellSkeletonBlock className="h-5 w-24" />
            <ShellSkeletonBlock className="h-8 w-full" />
            <ShellSkeletonRows count={3} />
          </div>
          <ShellSkeletonRows count={6} />
        </ShellSkeletonRegion>
      </SidebarInset>
    </SidebarProvider>
  );
}
```

- [ ] **Step 5: Run the unit tests to see them pass**

```bash
cd apps/docs && pnpm vitest run registry/super-ai/records-shell.test.tsx
```

Expected: PASS, every test in the file.

- [ ] **Step 6: The `Loading` and `Status` stories**

In `RecordsShell.stories.tsx`, add `fn` to the `storybook/test` import; add
`AlertTriangle` and `RotateCcw` to a `lucide-react` import (create it if the file has
none); add `Button` from `@/components/ui/button` if the file does not import it yet; and
add:

```tsx
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { expectLoadingTwin, LoadingTwin } from "@/lib/loading-twin";
```

Append at the end of the file:

```tsx
/**
 * First paint, before the records have loaded. The sidebar, the header, the filter
 * and sort row and the rows each draw a skeleton at the size they will take, the
 * root is marked busy, and nothing inside it takes focus. The play renders the
 * loaded list in the same frame and fails if a skeleton sits more than 8px from
 * where its region lands.
 */
export const Loading: Story = {
  args: FULL_ARGS,
  render: (args) => <LoadingTwin>{(loading) => <RecordsShell {...args} loading={loading} />}</LoadingTwin>,
  play: async ({ canvasElement }) => {
    await expectLoadingTwin(canvasElement, "records-shell", {
      sidebar: "frame",
      header: "frame",
      "filter-sort": "frame",
      "record-rows": "frame",
    });
  },
};

/**
 * A save failed. The message sits under the header, above the rows it concerns,
 * with the retry beside the reason. The vendored Alert's destructive description
 * is 4.49:1 on the card, so the text and the Retry button carry
 * `text-destructive` at full strength themselves.
 */
export const Status: Story = {
  args: {
    ...FULL_ARGS,
    status: (
      <Alert variant="destructive">
        <AlertTriangle aria-hidden />
        <AlertTitle>Could not save the schedule</AlertTitle>
        <AlertDescription className="flex flex-col items-start gap-2">
          <span className="text-destructive">The new run time is only on this device. Retry to keep it.</span>
          <Button type="button" size="sm" variant="outline" className="text-destructive" onClick={fn()}>
            <RotateCcw aria-hidden />
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    ),
  },
  play: async ({ canvasElement }) => {
    const status = canvasElement.querySelector<HTMLElement>('[data-slot="records-shell-status"]');
    await expect(status).not.toBeNull();
    await expect(status!.previousElementSibling).toHaveAttribute("data-region", "header");
    await expect(within(status!).getByRole("button", { name: "Retry" })).toBeVisible();
  },
};
```

- [ ] **Step 7: Run the story file**

```bash
cd apps/storybook && pnpm exec vitest run --project storybook src/stories/super-ai/RecordsShell.stories.tsx
```

Expected: PASS, every story in the file, each under axe. If the twin fails on a region,
fix the skeleton's size classes against the twin targets above, never the kind, the
tolerance or the fixture.

- [ ] **Step 8: The guidance module**

In `apps/docs/content/components/records-shell.docs.tsx`:

1. Append to the end of the `usage` string:

```text
 Pass `status` for a message about the whole surface (offline, reconnecting, a failed save, an expired session, a rate limit): it renders under the header, only when given, and holds M6 or the vendored Alert. Pass `loading` for first paint: every region draws a skeleton at its loaded size, the root is marked busy, and nothing is mounted that could take focus.
```

2. Append to `anatomy`:

```tsx
    {
      slot: "records-shell-status",
      note: "Under the header, only when `status` is passed. Holds M6 or the vendored Alert; the shell adds no live region of its own.",
    },
    {
      slot: "shell-skeleton-region",
      note: "One per region while `loading`: hidden from assistive tech and sized like the loaded region. It carries `data-loading-region`, as does each loaded region's box, which is what the loading twin measures.",
    },
```

3. Append to `dos`:

```tsx
    {
      text: "Mount the command palette once, at the root of your app, and keep it out of the shell: it is not a shell slot, and a palette mounted in each shell binds its shortcut once per surface.",
    },
```

4. Append to `accessibility.keyboard`:

```tsx
      "While `loading`, the shell mounts none of its controls, so there is no tab stop inside it until the data arrives; a control you pass in `status` is the only one.",
```

5. Append to `accessibility.screenReader`:

```tsx
      "While `loading`, the root carries `aria-busy` and every skeleton is hidden from assistive tech, so a screen reader finds one visually hidden line, Loading, plus anything you pass in `status`.",
      "The shell puts no live region around `status`. M6 is a note that announces its countdown politely and the vendored Alert defaults to an assertive alert, so choose the one whose announcement fits the message. Inside a busy root, a screen reader may hold an announcement until `loading` clears.",
```

6. Append to `pitfalls`:

```tsx
    "While `loading`, B1 is not mounted, because it always renders its rail button and a loading shell mounts nothing to click. The sidebar skeleton takes its width from the sidebar provider's state instead, so it follows `defaultSidebarOpen` and a Cmd/Ctrl+B toggle, but `switcher` and `nav` appear only once loading ends.",
    "While `loading`, neither `headerActions` nor the create action is mounted; the header reserves one placeholder for them when either is passed, and keeps its height because the bar is a fixed `h-14`.",
```

- [ ] **Step 9: The demo: notifications beside the account menu**

In `apps/docs/components/demos/records-shell-demo.tsx`, add
`import { DemoNotifications } from "@/components/demos/demo-notifications";` and replace
the `headerActions` value with:

```tsx
      headerActions={
        <div className="flex items-center gap-1">
          <DemoNotifications />
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

The create action still renders after `headerActions`; putting the account menu last is
U3's parked prop gap, not this task.

- [ ] **Step 10: Verify**

```bash
cd apps/docs
pnpm vitest run registry/super-ai/records-shell.test.tsx
pnpm reconcile:deps records-shell
pnpm check:tokens
pnpm exec tsx scripts/check-citations.mts
pnpm contract:emit
pnpm vitest run scripts/lib/contract-emit.test.ts scripts/lib/story-coverage.test.ts
cd ../..
pnpm typecheck
pnpm lint
pnpm exec prettier --write apps/docs/registry/super-ai/records-shell.tsx apps/docs/registry/super-ai/records-shell.test.tsx apps/storybook/src/stories/super-ai/RecordsShell.stories.tsx apps/docs/content/components/records-shell.docs.tsx apps/docs/components/demos/records-shell-demo.tsx
```

Expected: every command exits 0; `reconcile:deps records-shell` prints
`1 item(s) reconciled, no drift.`.

- [ ] **Step 11: Commit**

```bash
git checkout -- apps/docs/index/components.toon apps/docs/public/llms.txt apps/docs/public/llms-full.txt
git add apps/docs/registry/super-ai/records-shell.tsx apps/docs/registry/super-ai/records-shell.test.tsx apps/docs/registry/super-ai/records-shell.meta.json apps/docs/public/llms/components/records-shell.md apps/storybook/src/stories/super-ai/RecordsShell.stories.tsx apps/docs/content/components/records-shell.docs.tsx apps/docs/components/demos/records-shell-demo.tsx
git -c user.name="weeeha" -c user.email="1083934+weeeha@users.noreply.github.com" commit -m "feat(shell-fidelity): records-shell status and loading"
```

---

### Task 8: `docs-shell` (O11)

**Files:**

- Modify: `apps/docs/registry/super-ai/docs-shell.tsx`
- Modify: `apps/docs/registry/super-ai/docs-shell.test.tsx`
- Modify: `apps/storybook/src/stories/super-ai/DocsShell.stories.tsx`
- Modify: `apps/docs/content/components/docs-shell.docs.tsx`
- Derived, committed: `apps/docs/registry/super-ai/docs-shell.meta.json`,
  `apps/docs/public/llms/components/docs-shell.md`

No demo edit: the docs demo's account menu is U3's deferred Task 11 (waiting on
`claude/docs-shell-rail-brand`), and its notifications control goes in with it.
`DocsShell.stories.tsx` is also touched by that branch; this task only appends to the
file's end, so the two merge line-locally.

**Twin targets** (loaded, 1200×900, from `Reference`'s fixture, `FULL_ARGS`): icon-rail
0,0,48,900 `frame` · doc-nav 48,0,256,900 `frame` · announcement-strip 304,0,896,49
`frame` · content-column 304,49,896,851 `frame`. The rail starts collapsed
(`defaultRailExpanded` is false), so its width is `--sidebar-width-icon`.

- [ ] **Step 1: Write the failing tests**

Add `import { expectShellLoadedContract, expectShellLoadingContract } from "@/lib/test-utils";`
to `docs-shell.test.tsx`, then append:

```tsx
describe("DocsShell status and loading", () => {
  const root = (container: HTMLElement) => container.querySelector('[data-slot="docs-shell"]')!;

  it("marks every region's box and renders no status by default", () => {
    const { container } = render(<DocsShell />);
    expectShellLoadedContract(root(container), { name: "docs-shell", regions: REGIONS });
    expect(container.querySelector('[data-slot="docs-shell-status"]')).toBeNull();
  });

  it("renders status at the top of the content column, above the announcement strip", () => {
    const { container } = render(<DocsShell status={<p>You are offline.</p>} />);
    const status = container.querySelector('[data-slot="docs-shell-status"]')!;
    expect(status).toHaveTextContent("You are offline.");
    expect(status.nextElementSibling).toHaveAttribute("data-region", "announcement-strip");
  });

  it("draws every region as a skeleton, busy and with nothing to focus, while loading", () => {
    const { container } = render(
      <DocsShell loading railFooter={<button type="button">Account</button>}>
        <a href="#install">Install</a>
      </DocsShell>,
    );
    expectShellLoadingContract(root(container), { name: "docs-shell", regions: REGIONS });
    expect(container.querySelector('[data-slot="app-sidebar"]')).toBeNull();
    expect(container.querySelector('[data-slot="docs-shell-article"]')).toBeNull();
  });

  it("keeps status while loading", () => {
    const { container } = render(<DocsShell loading status={<p>Reconnecting</p>} />);
    expect(container.querySelector('[data-slot="docs-shell-status"]')).toHaveTextContent("Reconnecting");
  });
});
```

- [ ] **Step 2: Run them to see them fail**

```bash
cd apps/docs && pnpm vitest run registry/super-ai/docs-shell.test.tsx
```

Expected: the four new tests FAIL; every existing test still passes.

- [ ] **Step 3: Props, imports, the status strip and the loaded markers**

In `docs-shell.tsx`:

1. Add `useSidebar` to the multi-line `@/components/ui/sidebar` import, and add:

```tsx
import {
  ShellLoadingLabel,
  ShellSkeletonBlock,
  ShellSkeletonLines,
  ShellSkeletonRegion,
  ShellSkeletonRows,
  ShellSkeletonSidebar,
} from "@/registry/super-ai/shell-skeleton";
```

2. At the end of `DocsShellProps`, after `children`, add:

```tsx
  /**
   * A message about the whole surface: offline, reconnecting, a failed save, an
   * expired session, a rate limit. Renders at the top of the content column, above
   * the announcement strip and the page, and only when given. Pass M6
   * `rate-limit-banner` or the vendored `Alert`; the shell adds no live region, so
   * the component you pass carries its own role. Still renders while `loading`.
   */
  status?: React.ReactNode;
  /**
   * First paint, before the docs have loaded. Every region draws a skeleton at the
   * size it will take, the root carries `aria-busy`, and nothing the shell composes
   * is mounted, so there is nothing to focus or click. The strip reserves one
   * announcement's height only when `announcements` has an undismissed entry.
   */
  loading?: boolean;
```

3. In the parameter list, directly before `className,`, add `status,` and `loading = false,`.

4. Above `function DocsShell(`, add:

```tsx
/**
 * The icon rail while `loading`. B1 is not mounted, because it always renders its
 * rail button and a loading shell mounts nothing to click. The width comes from
 * the provider's state instead, the same state B1 reads, so the skeleton follows
 * `defaultRailExpanded` and a Cmd/Ctrl+B toggle.
 */
function DocsShellRailSkeleton() {
  const { state } = useSidebar();
  return <ShellSkeletonSidebar region="icon-rail" collapsed={state === "collapsed"} />;
}
```

5. After `const liveAnnouncements = ...;` add:

```tsx
const statusStrip = status ? (
  <div data-slot="docs-shell-status" className="shrink-0 border-b px-3 py-2">
    {status}
  </div>
) : null;
```

6. Add `data-loading-region` beside each loaded region's `data-region`: the `doc-nav` div,
   the `announcement-strip` div and the `content-column` section. The rail's wrapper is
   `display: contents`, so change `<AppSidebar` (the one with `collapsible="icon"`) to
   `<AppSidebar data-loading-region="icon-rail"`.

7. Insert `{statusStrip}` as the first child of
   `<div className="flex min-w-0 flex-1 flex-col overflow-hidden">`, before the
   `{/* Always mounted, so it is part of the page` comment.

- [ ] **Step 4: The loading branch**

Directly before the component's `return (`, after `statusStrip`, add:

```tsx
if (loading) {
  return (
    <SidebarProvider
      data-slot="docs-shell"
      aria-busy="true"
      defaultOpen={defaultRailExpanded}
      className={cn(
        "bg-background text-foreground h-full min-h-0 w-full overflow-hidden",
        EMBEDDABLE_SHELL,
        SIDEBAR_FILLS_SHELL,
        className,
      )}
      {...props}
    >
      <ShellLoadingLabel />
      <DocsShellRailSkeleton />
      <SidebarInset className="min-w-0 flex-col overflow-hidden md:flex-row">
        <ShellSkeletonRegion
          region="doc-nav"
          className="bg-background max-h-56 shrink-0 overflow-hidden border-b md:max-h-none md:w-64 md:border-e md:border-b-0"
        >
          <div className="flex items-center gap-2 border-b px-2 py-2">
            <ShellSkeletonBlock className="size-7" />
            <ShellSkeletonBlock className="h-4 w-24" />
          </div>
          <ShellSkeletonRows count={10} className="p-2" />
        </ShellSkeletonRegion>
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          {statusStrip}
          <ShellSkeletonRegion
            region="announcement-strip"
            className={cn("shrink-0", liveAnnouncements.length > 0 && "flex items-center border-b px-4 py-2")}
          >
            {liveAnnouncements.length > 0 ? (
              <ShellSkeletonBlock className="h-8 w-md max-w-full rounded-full" />
            ) : null}
          </ShellSkeletonRegion>
          <ShellSkeletonRegion region="content-column" className="min-h-0 flex-1 overflow-hidden px-6 py-8">
            <div className={cn(CONTENT_MEASURE, "flex flex-col gap-8")}>
              <div className="flex flex-col gap-2">
                <ShellSkeletonBlock className="h-8 w-2/3" />
                {lede ? <ShellSkeletonLines count={2} /> : null}
              </div>
              <div className="flex flex-col gap-3">
                <ShellSkeletonBlock className="h-6 w-40" />
                <ShellSkeletonLines count={3} />
              </div>
              <div className="flex flex-col gap-3">
                <ShellSkeletonBlock className="h-6 w-48" />
                <ShellSkeletonLines count={4} />
              </div>
            </div>
          </ShellSkeletonRegion>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
```

- [ ] **Step 5: Run the unit tests to see them pass**

```bash
cd apps/docs && pnpm vitest run registry/super-ai/docs-shell.test.tsx
```

Expected: PASS, every test in the file.

- [ ] **Step 6: The `Loading` and `Status` stories**

In `DocsShell.stories.tsx`, add `WifiOff` to the `lucide-react` import, and add:

```tsx
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { expectLoadingTwin, LoadingTwin } from "@/lib/loading-twin";
```

Append at the end of the file:

```tsx
/**
 * First paint, before the docs have loaded. The icon rail, the page nav, the
 * announcement strip and the content column each draw a skeleton at the size
 * they will take, the root is marked busy, and nothing inside it takes focus.
 * The strip keeps one announcement's height because this page has one waiting.
 * The play renders the loaded page in the same frame and fails if a skeleton sits
 * more than 8px from where its region lands.
 */
export const Loading: Story = {
  args: FULL_ARGS,
  render: (args) => <LoadingTwin>{(loading) => <DocsShell {...args} loading={loading} />}</LoadingTwin>,
  play: async ({ canvasElement }) => {
    await expectLoadingTwin(canvasElement, "docs-shell", {
      "icon-rail": "frame",
      "doc-nav": "frame",
      "announcement-strip": "frame",
      "content-column": "frame",
    });
  },
};

/**
 * The reader is offline. The message sits at the top of the content column, above
 * the announcement strip and the page it qualifies, and says what the reader is
 * looking at. The vendored Alert is given `role="status"`, so it is announced
 * politely, once.
 */
export const Status: Story = {
  args: {
    ...FULL_ARGS,
    status: (
      <Alert role="status">
        <WifiOff aria-hidden />
        <AlertTitle>You are offline</AlertTitle>
        <AlertDescription>These pages are the copy saved on your last visit.</AlertDescription>
      </Alert>
    ),
  },
  play: async ({ canvasElement }) => {
    const status = canvasElement.querySelector<HTMLElement>('[data-slot="docs-shell-status"]');
    await expect(status).not.toBeNull();
    await expect(status!.nextElementSibling).toHaveAttribute("data-region", "announcement-strip");
    await expect(within(status!).getByText("You are offline")).toBeVisible();
  },
};
```

- [ ] **Step 7: Run the story file**

```bash
cd apps/storybook && pnpm exec vitest run --project storybook src/stories/super-ai/DocsShell.stories.tsx
```

Expected: PASS, every story in the file, each under axe. If the twin fails on a region,
fix the skeleton's size classes against the twin targets above, never the kind, the
tolerance or the fixture.

- [ ] **Step 8: The guidance module**

In `apps/docs/content/components/docs-shell.docs.tsx`:

1. Append to the end of the `usage` string:

```text
 Pass `status` for a message about the whole surface (offline, reconnecting, a failed save, an expired session, a rate limit): it renders at the top of the content column, above the announcement strip, only when given, and holds M6 or the vendored Alert. Pass `loading` for first paint: every region draws a skeleton at its loaded size, the root is marked busy, and nothing is mounted that could take focus.
```

2. Append to `anatomy`:

```tsx
    {
      slot: "docs-shell-status",
      note: "At the top of the content column, only when `status` is passed. Holds M6 or the vendored Alert; the shell adds no live region of its own.",
    },
    {
      slot: "shell-skeleton-region",
      note: "One per region while `loading`: hidden from assistive tech and sized like the loaded region. It carries `data-loading-region`, as does each loaded region's box, which is what the loading twin measures.",
    },
```

3. Append to `dos`:

```tsx
    {
      text: "Mount the command palette once, at the root of your app, and keep it out of the shell: it is not a shell slot, and a palette mounted in each shell binds its shortcut once per surface.",
    },
```

4. Append to `accessibility.keyboard`:

```tsx
      "While `loading`, the shell mounts none of its controls, so there is no tab stop inside it until the data arrives; a control you pass in `status` is the only one.",
```

5. Append to `accessibility.screenReader`:

```tsx
      "While `loading`, the root carries `aria-busy` and every skeleton is hidden from assistive tech, so a screen reader finds one visually hidden line, Loading, plus anything you pass in `status`.",
      "The shell puts no live region around `status`. M6 is a note that announces its countdown politely and the vendored Alert defaults to an assertive alert, so choose the one whose announcement fits the message. Inside a busy root, a screen reader may hold an announcement until `loading` clears.",
```

6. Append to `pitfalls`:

```tsx
    "While `loading`, B1 is not mounted, because it always renders its rail button and a loading shell mounts nothing to click. The rail skeleton takes its width from the sidebar provider's state instead, so it follows `defaultRailExpanded` and a Cmd/Ctrl+B toggle, but `railBrand` and `railFooter` appear only once loading ends.",
    "The announcement strip's skeleton keeps one announcement's height only when `announcements` has an undismissed entry while loading. An announcement that arrives with the data pushes the content column down by one strip.",
```

- [ ] **Step 9: Verify**

```bash
cd apps/docs
pnpm vitest run registry/super-ai/docs-shell.test.tsx
pnpm reconcile:deps docs-shell
pnpm check:tokens
pnpm exec tsx scripts/check-citations.mts
pnpm contract:emit
pnpm vitest run scripts/lib/contract-emit.test.ts scripts/lib/story-coverage.test.ts
cd ../..
pnpm typecheck
pnpm lint
pnpm exec prettier --write apps/docs/registry/super-ai/docs-shell.tsx apps/docs/registry/super-ai/docs-shell.test.tsx apps/storybook/src/stories/super-ai/DocsShell.stories.tsx apps/docs/content/components/docs-shell.docs.tsx
```

Expected: every command exits 0; `reconcile:deps docs-shell` prints
`1 item(s) reconciled, no drift.`.

- [ ] **Step 10: Commit**

```bash
git checkout -- apps/docs/index/components.toon apps/docs/public/llms.txt apps/docs/public/llms-full.txt
git add apps/docs/registry/super-ai/docs-shell.tsx apps/docs/registry/super-ai/docs-shell.test.tsx apps/docs/registry/super-ai/docs-shell.meta.json apps/docs/public/llms/components/docs-shell.md apps/storybook/src/stories/super-ai/DocsShell.stories.tsx apps/docs/content/components/docs-shell.docs.tsx
git -c user.name="weeeha" -c user.email="1083934+weeeha@users.noreply.github.com" commit -m "feat(shell-fidelity): docs-shell status and loading"
```

---

### Task 9: `studio-shell` (O3)

**Files:**

- Modify: `apps/docs/registry/super-ai/studio-shell.tsx`
- Modify: `apps/docs/registry/super-ai/studio-shell.test.tsx`
- Modify: `apps/storybook/src/stories/super-ai/StudioShell.stories.tsx`
- Modify: `apps/docs/content/components/studio-shell.docs.tsx`
- Modify: `apps/docs/components/demos/studio-shell-demo.tsx`
- Derived, committed: `apps/docs/registry/super-ai/studio-shell.meta.json`,
  `apps/docs/public/llms/components/studio-shell.md`

**Twin targets** (loaded, 1200×900, from `Editing`): modality-rail 0,0,92,900 `frame` ·
topbar 92,0,1108,48 `frame` · tool-panel 92,48,288,852 `frame` · canvas 380,48,532,757
`frame` · page-strip 380,805,532,95 `frame` · inspector 912,48,288,852 `frame`. The page
strip is 95px: a 1px rule, 8px of padding each side of H5's 78px strip.

- [ ] **Step 1: Write the failing tests**

Add `import { expectShellLoadedContract, expectShellLoadingContract } from "@/lib/test-utils";`
to `studio-shell.test.tsx`, then append:

```tsx
describe("StudioShell status and loading", () => {
  const root = (container: HTMLElement) => container.querySelector('[data-slot="studio-shell"]')!;

  it("marks every region's box and renders no status by default", () => {
    const { container } = render(<StudioShell />);
    expectShellLoadedContract(root(container), { name: "studio-shell", regions: REGIONS });
    expect(container.querySelector('[data-slot="studio-shell-status"]')).toBeNull();
  });

  it("renders status directly under the topbar", () => {
    const { container } = render(<StudioShell status={<p>Could not save your changes.</p>} />);
    const status = container.querySelector('[data-slot="studio-shell-status"]')!;
    expect(status).toHaveTextContent("Could not save your changes.");
    expect(status.previousElementSibling).toHaveAttribute("data-region", "topbar");
  });

  it("draws every region as a skeleton, busy and with nothing to focus, while loading", () => {
    const { container } = render(
      <StudioShell loading topbar={{ actions: <button type="button">Share</button> }}>
        <button type="button">Title frame</button>
      </StudioShell>,
    );
    expectShellLoadingContract(root(container), { name: "studio-shell", regions: REGIONS });
    expect(container.querySelector('[data-slot="modality-rail"]')).toBeNull();
    expect(container.querySelector('[data-slot="tool-panel"]')).toBeNull();
    expect(container.querySelector('[data-slot="property-inspector"]')).toBeNull();
  });

  it("keeps status while loading", () => {
    const { container } = render(<StudioShell loading status={<p>Reconnecting</p>} />);
    expect(container.querySelector('[data-slot="studio-shell-status"]')).toHaveTextContent("Reconnecting");
  });
});
```

- [ ] **Step 2: Run them to see them fail**

```bash
cd apps/docs && pnpm vitest run registry/super-ai/studio-shell.test.tsx
```

Expected: the four new tests FAIL; every existing test still passes.

- [ ] **Step 3: Props, imports, the status strip and the loaded markers**

In `studio-shell.tsx`:

1. Add:

```tsx
import {
  ShellLoadingLabel,
  ShellSkeletonBlock,
  ShellSkeletonLines,
  ShellSkeletonRegion,
  ShellSkeletonTiles,
} from "@/registry/super-ai/shell-skeleton";
```

2. At the end of `StudioShellProps`, after `pageStripEmpty`, add:

```tsx
  /**
   * A message about the whole surface: offline, reconnecting, a failed save, an
   * expired session, a rate limit. Renders under the topbar, above the panel,
   * canvas and inspector it affects, and only when given. Pass M6
   * `rate-limit-banner` or the vendored `Alert`; the shell adds no live region, so
   * the component you pass carries its own role. Still renders while `loading`.
   */
  status?: React.ReactNode;
  /**
   * First paint, before the document has loaded. Every region draws a skeleton at
   * the size it will take, the root carries `aria-busy`, and nothing the shell
   * composes is mounted, so there is nothing to focus or click.
   */
  loading?: boolean;
```

3. In the parameter list, directly before `className,`, add `status,` and `loading = false,`.

4. After `const hasStrip = ...;` add:

```tsx
const statusStrip = status ? (
  <div data-slot="studio-shell-status" className="shrink-0 border-b px-3 py-2">
    {status}
  </div>
) : null;
```

5. Add `data-loading-region` beside each loaded region's `data-region`: on `ModalityRail`
   (`data-loading-region="modality-rail"`), on `AppTopbar` (`"topbar"`), and on the
   `tool-panel`, `canvas`, `page-strip` and `inspector` divs.

6. Insert `{statusStrip}` directly after the `AppTopbar` element's closing `/>`, before
   the `{/* Below \`md\` the three middle regions` comment.

- [ ] **Step 4: The loading branch**

Directly before the component's `return (`, after `statusStrip`, add:

```tsx
if (loading) {
  return (
    <div
      data-slot="studio-shell"
      aria-busy="true"
      className={cn("bg-background text-foreground flex h-full min-h-0 w-full overflow-hidden", className)}
      {...props}
    >
      <ShellLoadingLabel />
      {/* B4's own width, 92px. The twin is what notices if B4 changes it. */}
      <ShellSkeletonRegion
        region="modality-rail"
        className="flex w-23 shrink-0 flex-col gap-1 border-e p-1.5"
      >
        <ShellSkeletonBlock className="h-11 w-full" />
        <ShellSkeletonBlock className="h-11 w-full" />
        <ShellSkeletonBlock className="h-11 w-full" />
        <ShellSkeletonBlock className="h-11 w-full" />
      </ShellSkeletonRegion>
      <div className="flex min-w-0 flex-1 flex-col">
        <ShellSkeletonRegion region="topbar" className="flex h-12 shrink-0 items-center gap-3 border-b px-3">
          <ShellSkeletonBlock className="h-7 w-24" />
          <ShellSkeletonBlock className="h-7 w-14" />
          <ShellSkeletonBlock className="h-4 w-24" />
          <ShellSkeletonBlock className="ms-auto h-4 w-20" />
        </ShellSkeletonRegion>
        {statusStrip}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden md:flex-row">
          <ShellSkeletonRegion
            region="tool-panel"
            className="flex shrink-0 flex-col gap-3 border-b p-4 md:w-72 md:border-e md:border-b-0"
          >
            <ShellSkeletonBlock className="h-8 w-full" />
            <ShellSkeletonTiles count={6} className="grid-cols-2" />
          </ShellSkeletonRegion>
          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            <ShellSkeletonRegion
              region="canvas"
              className="flex min-h-64 flex-1 items-center justify-center p-6 md:min-h-0"
            >
              <ShellSkeletonBlock className="aspect-video w-full max-w-2xl" />
            </ShellSkeletonRegion>
            <ShellSkeletonRegion region="page-strip" className="bg-background shrink-0 border-t px-3 py-2">
              <ShellSkeletonTiles
                count={4}
                className="h-19.5 grid-cols-4"
                tileClassName="aspect-auto h-full"
              />
            </ShellSkeletonRegion>
          </div>
          <ShellSkeletonRegion
            region="inspector"
            className="shrink-0 border-t p-3 md:w-72 md:border-t-0 md:border-s"
          >
            <ShellSkeletonBlock className="mb-3 h-6 w-28" />
            <ShellSkeletonLines count={6} />
          </ShellSkeletonRegion>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Run the unit tests to see them pass**

```bash
cd apps/docs && pnpm vitest run registry/super-ai/studio-shell.test.tsx
```

Expected: PASS, every test in the file.

- [ ] **Step 6: The `Loading` and `Status` stories**

In `StudioShell.stories.tsx`, add `AlertTriangle` and `RotateCcw` to the `lucide-react`
import, and add:

```tsx
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { expectLoadingTwin, LoadingTwin } from "@/lib/loading-twin";
```

Append at the end of the file:

```tsx
/**
 * First paint, before the document has loaded. The rail, the topbar, the tool
 * panel, the canvas, the page strip and the inspector each draw a skeleton at the
 * size they will take, the root is marked busy, and nothing inside it takes focus.
 * The play renders the loaded editor in the same frame and fails if a skeleton
 * sits more than 8px from where its region lands.
 */
export const Loading: Story = {
  args: FULL_ARGS,
  render: (args) => <LoadingTwin>{(loading) => <StudioShell {...args} loading={loading} />}</LoadingTwin>,
  play: async ({ canvasElement }) => {
    await expectLoadingTwin(canvasElement, "studio-shell", {
      "modality-rail": "frame",
      topbar: "frame",
      "tool-panel": "frame",
      canvas: "frame",
      "page-strip": "frame",
      inspector: "frame",
    });
  },
};

/**
 * A save failed. The message sits under the topbar, above the canvas it concerns,
 * with the retry beside the reason. The vendored Alert's destructive description
 * is 4.49:1 on the card, so the text and the Retry button carry
 * `text-destructive` at full strength themselves.
 */
export const Status: Story = {
  args: {
    ...FULL_ARGS,
    status: (
      <Alert variant="destructive">
        <AlertTriangle aria-hidden />
        <AlertTitle>Could not save your changes</AlertTitle>
        <AlertDescription className="flex flex-col items-start gap-2">
          <span className="text-destructive">Your last three edits are only on this device.</span>
          <Button type="button" size="sm" variant="outline" className="text-destructive" onClick={fn()}>
            <RotateCcw aria-hidden />
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    ),
  },
  play: async ({ canvasElement }) => {
    const status = canvasElement.querySelector<HTMLElement>('[data-slot="studio-shell-status"]');
    await expect(status).not.toBeNull();
    await expect(status!.previousElementSibling).toHaveAttribute("data-region", "topbar");
    await expect(within(status!).getByRole("button", { name: "Retry" })).toBeVisible();
  },
};
```

- [ ] **Step 7: Run the story file**

```bash
cd apps/storybook && pnpm exec vitest run --project storybook src/stories/super-ai/StudioShell.stories.tsx
```

Expected: PASS, every story in the file, each under axe. If the twin fails on a region,
fix the skeleton's size classes against the twin targets above, never the kind, the
tolerance or the fixture.

- [ ] **Step 8: The guidance module**

In `apps/docs/content/components/studio-shell.docs.tsx`:

1. Append to the end of the `usage` string:

```text
 Pass `status` for a message about the whole surface (offline, reconnecting, a failed save, an expired session, a rate limit): it renders under the topbar, only when given, and holds M6 or the vendored Alert. Pass `loading` for first paint: every region draws a skeleton at its loaded size, the root is marked busy, and nothing is mounted that could take focus.
```

2. Append to `anatomy`:

```tsx
    {
      slot: "studio-shell-status",
      note: "Under the topbar, only when `status` is passed. Holds M6 or the vendored Alert; the shell adds no live region of its own.",
    },
    {
      slot: "shell-skeleton-region",
      note: "One per region while `loading`: hidden from assistive tech and sized like the loaded region. It carries `data-loading-region`, as does each loaded region's box, which is what the loading twin measures.",
    },
```

3. Append to `dos`:

```tsx
    {
      text: "Mount the command palette once, at the root of your app, and keep it out of the shell: it is not a shell slot, and a palette mounted in each shell binds its shortcut once per surface.",
    },
```

4. Append to `accessibility.keyboard`:

```tsx
      "While `loading`, the shell mounts none of its controls, so there is no tab stop inside it until the data arrives; a control you pass in `status` is the only one.",
```

5. Append to `accessibility.screenReader`:

```tsx
      "While `loading`, the root carries `aria-busy` and every skeleton is hidden from assistive tech, so a screen reader finds one visually hidden line, Loading, plus anything you pass in `status`.",
      "The shell puts no live region around `status`. M6 is a note that announces its countdown politely and the vendored Alert defaults to an assertive alert, so choose the one whose announcement fits the message. Inside a busy root, a screen reader may hold an announcement until `loading` clears.",
```

6. Append to `pitfalls`:

```tsx
    "The rail skeleton is B4's width, 92px, written into this shell as `w-23` rather than read from B4. If B4 changes width, this skeleton falls out of step with it, and that class is the one to change.",
```

- [ ] **Step 9: The demo: notifications beside the account menu**

In `apps/docs/components/demos/studio-shell-demo.tsx`, add
`import { DemoNotifications } from "@/components/demos/demo-notifications";` and replace
the `actions` value inside `topbar` with:

```tsx
        actions: (
          <div className="flex items-center gap-1">
            <DemoNotifications />
            <AccountMenu
              user={{ name: "Ada Lovelace", email: "ada@northwind.example" }}
              theme="system"
              onThemeChange={() => {}}
              background="default"
              onBackgroundChange={() => {}}
              onSignOut={() => {}}
            />
          </div>
        ),
```

- [ ] **Step 10: Verify**

```bash
cd apps/docs
pnpm vitest run registry/super-ai/studio-shell.test.tsx
pnpm reconcile:deps studio-shell
pnpm check:tokens
pnpm exec tsx scripts/check-citations.mts
pnpm contract:emit
pnpm vitest run scripts/lib/contract-emit.test.ts scripts/lib/story-coverage.test.ts
cd ../..
pnpm typecheck
pnpm lint
pnpm exec prettier --write apps/docs/registry/super-ai/studio-shell.tsx apps/docs/registry/super-ai/studio-shell.test.tsx apps/storybook/src/stories/super-ai/StudioShell.stories.tsx apps/docs/content/components/studio-shell.docs.tsx apps/docs/components/demos/studio-shell-demo.tsx
```

Expected: every command exits 0; `reconcile:deps studio-shell` prints
`1 item(s) reconciled, no drift.`.

- [ ] **Step 11: Commit**

```bash
git checkout -- apps/docs/index/components.toon apps/docs/public/llms.txt apps/docs/public/llms-full.txt
git add apps/docs/registry/super-ai/studio-shell.tsx apps/docs/registry/super-ai/studio-shell.test.tsx apps/docs/registry/super-ai/studio-shell.meta.json apps/docs/public/llms/components/studio-shell.md apps/storybook/src/stories/super-ai/StudioShell.stories.tsx apps/docs/content/components/studio-shell.docs.tsx apps/docs/components/demos/studio-shell-demo.tsx
git -c user.name="weeeha" -c user.email="1083934+weeeha@users.noreply.github.com" commit -m "feat(shell-fidelity): studio-shell status and loading"
```

---

### Task 10: `timeline-shell` (O4)

**Files:**

- Modify: `apps/docs/registry/super-ai/timeline-shell.tsx`
- Modify: `apps/docs/registry/super-ai/timeline-shell.test.tsx`
- Modify: `apps/storybook/src/stories/super-ai/TimelineShell.stories.tsx`
- Modify: `apps/docs/content/components/timeline-shell.docs.tsx`
- Derived, committed: `apps/docs/registry/super-ai/timeline-shell.meta.json`,
  `apps/docs/public/llms/components/timeline-shell.md`

No demo edit: this shell has no slot that takes an account menu (`CONTINUE.md` §8, U3).

**Twin targets** (loaded, 1200×900, from `Tracks`): rail 0,0,92,900 `frame` ·
content-panel 92,0,288,900 `frame` · preview 380,0,500,562 `frame` · transport
380,562,500,81 `frame` · tracks-ruler 380,643,500,257 `frame` · inspector 880,0,320,900
`frame`. At 500px the transport controls wrap to two rows (32px, then 28px, 8px apart);
the skeleton wraps the same way because its blocks are the controls' own sizes. The
tracks list is capped at `max-h-64`, so the region is 257px with three lanes.

- [ ] **Step 1: Write the failing tests**

Add `import { expectShellLoadedContract, expectShellLoadingContract } from "@/lib/test-utils";`
to `timeline-shell.test.tsx`, then append:

```tsx
describe("TimelineShell status and loading", () => {
  const root = (container: HTMLElement) => container.querySelector('[data-slot="timeline-shell"]')!;

  it("marks every region's box and renders no status by default", () => {
    const { container } = render(<TimelineShell />);
    expectShellLoadedContract(root(container), { name: "timeline-shell", regions: REGIONS });
    expect(container.querySelector('[data-slot="timeline-shell-status"]')).toBeNull();
  });

  it("renders status at the top of the preview column", () => {
    const { container } = render(<TimelineShell status={<p>Reconnecting.</p>} />);
    const status = container.querySelector('[data-slot="timeline-shell-status"]')!;
    expect(status).toHaveTextContent("Reconnecting.");
    expect(status.nextElementSibling).toHaveAttribute("data-region", "preview");
  });

  it("draws every region as a skeleton, busy and with nothing to focus, while loading", () => {
    const { container } = render(<TimelineShell loading preview={<button type="button">Play</button>} />);
    expectShellLoadingContract(root(container), { name: "timeline-shell", regions: REGIONS });
    expect(container.querySelector('[data-slot="modality-rail"]')).toBeNull();
    expect(container.querySelector('[data-slot="tool-panel"]')).toBeNull();
    expect(container.querySelector('[data-slot="transport-controls"]')).toBeNull();
  });

  it("keeps status while loading", () => {
    const { container } = render(<TimelineShell loading status={<p>Reconnecting</p>} />);
    expect(container.querySelector('[data-slot="timeline-shell-status"]')).toHaveTextContent("Reconnecting");
  });
});
```

- [ ] **Step 2: Run them to see them fail**

```bash
cd apps/docs && pnpm vitest run registry/super-ai/timeline-shell.test.tsx
```

Expected: the four new tests FAIL; every existing test still passes.

- [ ] **Step 3: Props, imports, the status strip and the loaded markers**

In `timeline-shell.tsx`:

1. Add:

```tsx
import {
  ShellLoadingLabel,
  ShellSkeletonBlock,
  ShellSkeletonLines,
  ShellSkeletonRegion,
  ShellSkeletonRows,
} from "@/registry/super-ai/shell-skeleton";
```

2. At the end of `TimelineShellProps`, after `transcriptLabel`, add:

```tsx
  /**
   * A message about the whole surface: offline, reconnecting, a failed save, an
   * expired session, a rate limit. Renders at the top of the preview column, above
   * the stage, the transport and the tracks it affects, and only when given. Pass
   * M6 `rate-limit-banner` or the vendored `Alert`; the shell adds no live region,
   * so the component you pass carries its own role. Still renders while `loading`.
   */
  status?: React.ReactNode;
  /**
   * First paint, before the project has loaded. Every region draws a skeleton at
   * the size it will take, the root carries `aria-busy`, and nothing the shell
   * composes is mounted, so there is nothing to focus or click.
   */
  loading?: boolean;
```

3. In the parameter list, directly before `className,`, add `status,` and `loading = false,`.

4. After the `transcript` destructuring, add:

```tsx
const statusStrip = status ? (
  <div data-slot="timeline-shell-status" className="shrink-0 border-b px-3 py-2">
    {status}
  </div>
) : null;
```

5. Add `data-loading-region` beside each loaded region's `data-region`: on `ModalityRail`
   (`data-loading-region="rail"`), and on the `content-panel`, `preview`, `transport`,
   `tracks-ruler` and `inspector` divs.

6. Insert `{statusStrip}` as the first child of
   `<div className="flex min-h-0 min-w-0 flex-1 flex-col">`, before the
   `data-region="preview"` div.

- [ ] **Step 4: The loading branch**

Directly before the component's `return (`, after `statusStrip`, add:

```tsx
if (loading) {
  return (
    <div
      data-slot="timeline-shell"
      data-variant={variant}
      aria-busy="true"
      className={cn("bg-background text-foreground flex h-full min-h-0 w-full overflow-hidden", className)}
      {...props}
    >
      <ShellLoadingLabel />
      {/* B4's own width, 92px. The twin is what notices if B4 changes it. */}
      <ShellSkeletonRegion region="rail" className="flex h-full w-23 shrink-0 flex-col gap-1 border-e p-1.5">
        <ShellSkeletonBlock className="h-11 w-full" />
        <ShellSkeletonBlock className="h-11 w-full" />
        <ShellSkeletonBlock className="h-11 w-full" />
      </ShellSkeletonRegion>
      <ShellSkeletonRegion region="content-panel" className="hidden w-72 shrink-0 p-2 md:block">
        <div className="flex h-full flex-col gap-3 rounded-lg border p-3">
          <ShellSkeletonBlock className="h-8 w-full" />
          <ShellSkeletonRows count={8} />
        </div>
      </ShellSkeletonRegion>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        {statusStrip}
        <ShellSkeletonRegion
          region="preview"
          className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden p-2"
        >
          <ShellSkeletonBlock className="min-h-0 flex-1 rounded-lg" />
          <div className="flex h-42 shrink-0 flex-col gap-2 rounded-lg border p-2">
            <ShellSkeletonBlock className="h-5 w-28" />
            <ShellSkeletonRows count={3} />
          </div>
        </ShellSkeletonRegion>
        <ShellSkeletonRegion
          region="transport"
          className="bg-background flex shrink-0 items-center gap-2 border-t px-2 py-1.5"
        >
          <div className="flex w-fit min-w-0 flex-wrap items-center gap-2">
            <ShellSkeletonBlock className="h-8 w-56" />
            <ShellSkeletonBlock className="h-8 w-56" />
            <ShellSkeletonBlock className="h-7 w-12" />
            <ShellSkeletonBlock className="h-4 w-56" />
          </div>
        </ShellSkeletonRegion>
        <ShellSkeletonRegion region="tracks-ruler" className="bg-background shrink-0 border-t">
          <div className="flex h-64 flex-col gap-1 overflow-hidden p-2">
            {variant === "transcript" ? (
              <ShellSkeletonLines count={10} />
            ) : (
              <>
                <ShellSkeletonBlock className="h-8 w-full" />
                <ShellSkeletonBlock className="h-16 w-full rounded-lg" />
                <ShellSkeletonBlock className="h-16 w-full rounded-lg" />
                <ShellSkeletonBlock className="h-16 w-full rounded-lg" />
              </>
            )}
          </div>
        </ShellSkeletonRegion>
      </div>
      <ShellSkeletonRegion region="inspector" className="hidden w-80 shrink-0 border-s p-3 lg:block">
        <ShellSkeletonBlock className="mb-3 h-6 w-28" />
        <ShellSkeletonLines count={6} />
      </ShellSkeletonRegion>
    </div>
  );
}
```

- [ ] **Step 5: Run the unit tests to see them pass**

```bash
cd apps/docs && pnpm vitest run registry/super-ai/timeline-shell.test.tsx
```

Expected: PASS, every test in the file.

- [ ] **Step 6: The `Loading` and `Status` stories**

In `TimelineShell.stories.tsx`, add `LoaderCircle` to the `lucide-react` import, and add:

```tsx
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { expectLoadingTwin, LoadingTwin } from "@/lib/loading-twin";
```

Append at the end of the file:

```tsx
/**
 * First paint, before the project has loaded. The rail, the content panel, the
 * stage with its render queue, the transport, the tracks and the inspector each
 * draw a skeleton at the size they will take, the root is marked busy, and nothing
 * inside it takes focus. The transport skeleton is the controls' own blocks, so it
 * wraps where the controls wrap. The play renders the loaded editor in the same
 * frame and fails if a skeleton sits more than 8px from where its region lands.
 */
export const Loading: Story = {
  args: FULL_ARGS,
  render: (args) => <LoadingTwin>{(loading) => <TimelineShell {...args} loading={loading} />}</LoadingTwin>,
  play: async ({ canvasElement }) => {
    await expectLoadingTwin(canvasElement, "timeline-shell", {
      rail: "frame",
      "content-panel": "frame",
      preview: "frame",
      transport: "frame",
      "tracks-ruler": "frame",
      inspector: "frame",
    });
  },
};

/**
 * The editor lost its connection and is getting it back. The message sits at the
 * top of the preview column, above the stage and the render queue it concerns,
 * and says the one thing a waiting editor needs: exports keep going. The vendored
 * Alert is given `role="status"`, and its spinner stops under reduced motion,
 * leaving the words.
 */
export const Status: Story = {
  args: {
    ...FULL_ARGS,
    status: (
      <Alert role="status">
        <LoaderCircle aria-hidden className="animate-spin motion-reduce:animate-none" />
        <AlertTitle>Reconnecting</AlertTitle>
        <AlertDescription>
          Exports keep rendering on the server and appear in the queue when you are back.
        </AlertDescription>
      </Alert>
    ),
  },
  play: async ({ canvasElement }) => {
    const status = canvasElement.querySelector<HTMLElement>('[data-slot="timeline-shell-status"]');
    await expect(status).not.toBeNull();
    await expect(status!.nextElementSibling).toHaveAttribute("data-region", "preview");
    await expect(within(status!).getByText("Reconnecting")).toBeVisible();
  },
};
```

- [ ] **Step 7: Run the story file**

```bash
cd apps/storybook && pnpm exec vitest run --project storybook src/stories/super-ai/TimelineShell.stories.tsx
```

Expected: PASS, every story in the file, each under axe. If the twin fails on a region,
fix the skeleton's size classes against the twin targets above, never the kind, the
tolerance or the fixture.

- [ ] **Step 8: The guidance module**

In `apps/docs/content/components/timeline-shell.docs.tsx`:

1. Append to the end of the `usage` string:

```text
 Pass `status` for a message about the whole surface (offline, reconnecting, a failed save, an expired session, a rate limit): it renders at the top of the preview column, only when given, and holds M6 or the vendored Alert. Pass `loading` for first paint: every region draws a skeleton at its loaded size, the root is marked busy, and nothing is mounted that could take focus.
```

2. Append to `anatomy`:

```tsx
    {
      slot: "timeline-shell-status",
      note: "At the top of the preview column, only when `status` is passed. Holds M6 or the vendored Alert; the shell adds no live region of its own.",
    },
    {
      slot: "shell-skeleton-region",
      note: "One per region while `loading`: hidden from assistive tech and sized like the loaded region. It carries `data-loading-region`, as does each loaded region's box, which is what the loading twin measures.",
    },
```

3. Append to `dos`:

```tsx
    {
      text: "Mount the command palette once, at the root of your app, and keep it out of the shell: it is not a shell slot, and a palette mounted in each shell binds its shortcut once per surface.",
    },
```

4. Append to `accessibility.keyboard`:

```tsx
      "While `loading`, the shell mounts none of its controls, so there is no tab stop inside it until the data arrives; a control you pass in `status` is the only one.",
```

5. Append to `accessibility.screenReader`:

```tsx
      "While `loading`, the root carries `aria-busy` and every skeleton is hidden from assistive tech, so a screen reader finds one visually hidden line, Loading, plus anything you pass in `status`.",
      "The shell puts no live region around `status`. M6 is a note that announces its countdown politely and the vendored Alert defaults to an assertive alert, so choose the one whose announcement fits the message. Inside a busy root, a screen reader may hold an announcement until `loading` clears.",
```

6. Append to `pitfalls`:

```tsx
    "The rail skeleton is B4's width, 92px, written into this shell as `w-23` rather than read from B4. If B4 changes width, this skeleton falls out of step with it, and that class is the one to change.",
    "The transport skeleton is fixed blocks the size of H1's own controls, so it wraps to a second row at the same widths the controls do. The tracks skeleton always fills the list's `max-h-64` cap, so a project with one short track shrinks the tracks area when it loads.",
```

- [ ] **Step 9: Verify**

```bash
cd apps/docs
pnpm vitest run registry/super-ai/timeline-shell.test.tsx
pnpm reconcile:deps timeline-shell
pnpm check:tokens
pnpm exec tsx scripts/check-citations.mts
pnpm contract:emit
pnpm vitest run scripts/lib/contract-emit.test.ts scripts/lib/story-coverage.test.ts
cd ../..
pnpm typecheck
pnpm lint
pnpm exec prettier --write apps/docs/registry/super-ai/timeline-shell.tsx apps/docs/registry/super-ai/timeline-shell.test.tsx apps/storybook/src/stories/super-ai/TimelineShell.stories.tsx apps/docs/content/components/timeline-shell.docs.tsx
```

Expected: every command exits 0; `reconcile:deps timeline-shell` prints
`1 item(s) reconciled, no drift.`.

- [ ] **Step 10: Commit**

```bash
git checkout -- apps/docs/index/components.toon apps/docs/public/llms.txt apps/docs/public/llms-full.txt
git add apps/docs/registry/super-ai/timeline-shell.tsx apps/docs/registry/super-ai/timeline-shell.test.tsx apps/docs/registry/super-ai/timeline-shell.meta.json apps/docs/public/llms/components/timeline-shell.md apps/storybook/src/stories/super-ai/TimelineShell.stories.tsx apps/docs/content/components/timeline-shell.docs.tsx
git -c user.name="weeeha" -c user.email="1083934+weeeha@users.noreply.github.com" commit -m "feat(shell-fidelity): timeline-shell status and loading"
```

---

### Task 11: `explore-shell` (O8)

**Files:**

- Modify: `apps/docs/registry/super-ai/explore-shell.tsx`
- Modify: `apps/docs/registry/super-ai/explore-shell.test.tsx`
- Modify: `apps/storybook/src/stories/super-ai/ExploreShell.stories.tsx`
- Modify: `apps/docs/content/components/explore-shell.docs.tsx`
- Derived, committed: `apps/docs/registry/super-ai/explore-shell.meta.json`,
  `apps/docs/public/llms/components/explore-shell.md`

No demo edit: this shell has no slot that takes an account menu (`CONTINUE.md` §8, U3).

**Twin targets** (loaded, 1200×900, from `Feed`): rail 0,0,92,900 `frame` ·
docked-prompt-bar 92,0,1108,151 `frame` · sort-tabs 108,163,1076,34 `frame` ·
masonry-feed 108,209,1076,675 `frame`. The sort strip is 34px because the type pills
are; the sort tabs alone are 32px.

- [ ] **Step 1: Write the failing tests**

Add `import { expectShellLoadedContract, expectShellLoadingContract } from "@/lib/test-utils";`
to `explore-shell.test.tsx`, then append:

```tsx
describe("ExploreShell status and loading", () => {
  const root = (container: HTMLElement) => container.querySelector('[data-slot="explore-shell"]')!;

  it("marks every region's box and renders no status by default", () => {
    const { container } = render(<ExploreShell />);
    expectShellLoadedContract(root(container), { name: "explore-shell", regions: REGIONS });
    expect(container.querySelector('[data-slot="explore-shell-status"]')).toBeNull();
  });

  it("renders status at the top of the feed column, above the prompt bar", () => {
    const { container } = render(<ExploreShell status={<p>The model is at capacity.</p>} />);
    const status = container.querySelector('[data-slot="explore-shell-status"]')!;
    expect(status).toHaveTextContent("The model is at capacity.");
    expect(status.nextElementSibling).toHaveAttribute("data-region", "docked-prompt-bar");
  });

  it("draws every region as a skeleton, busy and with nothing to focus, while loading", () => {
    const { container } = render(
      <ExploreShell
        loading
        sorts={[{ value: "new", label: "New" }]}
        types={[{ value: "image", label: "Images" }]}
        empty={<button type="button">Create the first one</button>}
      />,
    );
    expectShellLoadingContract(root(container), { name: "explore-shell", regions: REGIONS });
    expect(container.querySelector('[data-slot="modality-rail"]')).toBeNull();
    expect(container.querySelector('[data-slot="media-prompt-bar"]')).toBeNull();
  });

  it("keeps status while loading", () => {
    const { container } = render(<ExploreShell loading status={<p>Reconnecting</p>} />);
    expect(container.querySelector('[data-slot="explore-shell-status"]')).toHaveTextContent("Reconnecting");
  });
});
```

- [ ] **Step 2: Run them to see them fail**

```bash
cd apps/docs && pnpm vitest run registry/super-ai/explore-shell.test.tsx
```

Expected: the four new tests FAIL; every existing test still passes.

- [ ] **Step 3: Props, imports, the status strip and the loaded markers**

In `explore-shell.tsx`:

1. Add:

```tsx
import {
  ShellLoadingLabel,
  ShellSkeletonBlock,
  ShellSkeletonRegion,
} from "@/registry/super-ai/shell-skeleton";
```

2. At module level, above `function ExploreShell(`, add:

```tsx
/**
 * The feed skeleton's tile shapes, mixed so it reads as a masonry column rather
 * than a grid. Fixed, so the server and the client draw the same feed.
 */
const FEED_SKELETON_ASPECTS = [
  "aspect-square",
  "aspect-3/4",
  "aspect-video",
  "aspect-4/5",
  "aspect-video",
  "aspect-square",
  "aspect-4/5",
  "aspect-3/4",
] as const;
```

3. At the end of `ExploreShellProps`, after `moreLikeThisCount`, add:

```tsx
  /**
   * A message about the whole surface: offline, reconnecting, a failed save, an
   * expired session, a rate limit. Renders at the top of the feed column, above the
   * prompt bar and the feed it affects, and only when given. Pass M6
   * `rate-limit-banner` or the vendored `Alert`; the shell adds no live region, so
   * the component you pass carries its own role. Still renders while `loading`.
   */
  status?: React.ReactNode;
  /**
   * First paint, before the feed has loaded. Every region draws a skeleton at the
   * size it will take, the root carries `aria-busy`, and nothing the shell composes
   * is mounted, so there is nothing to focus or click. The sort strip reserves the
   * tabs and pills for the `sorts` and `types` you pass.
   */
  loading?: boolean;
```

4. In the parameter list, directly before `className,`, add `status,` and `loading = false,`.

5. After the `feed` constant, add:

```tsx
const statusStrip = status ? (
  <div data-slot="explore-shell-status" className="shrink-0 border-b px-3 py-2">
    {status}
  </div>
) : null;
```

6. Add `data-loading-region` beside each loaded region's `data-region`: on `ModalityRail`
   (`data-loading-region="rail"`), on the `docked-prompt-bar` div, on the `controls` div
   (`data-loading-region="sort-tabs"`), and on both `masonry-feed` elements, the
   `TabsContent` and the plain `div`.

7. Insert `{statusStrip}` as the first child of
   `<div className="flex min-w-0 flex-1 flex-col overflow-hidden">`, before the
   `{/* Above the feed, not below it` comment.

- [ ] **Step 4: The loading branch**

Directly before the component's `return (`, after `statusStrip`, add:

```tsx
if (loading) {
  return (
    <div
      data-slot="explore-shell"
      aria-busy="true"
      className={cn("bg-background text-foreground flex h-full min-h-0 w-full overflow-hidden", className)}
      {...props}
    >
      <ShellLoadingLabel />
      {/* B4's own width, 92px. The twin is what notices if B4 changes it. */}
      <ShellSkeletonRegion region="rail" className="flex w-23 shrink-0 flex-col gap-1 border-e p-1.5">
        <ShellSkeletonBlock className="h-11 w-full" />
        <ShellSkeletonBlock className="h-11 w-full" />
        <ShellSkeletonBlock className="h-11 w-full" />
      </ShellSkeletonRegion>
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {statusStrip}
        <ShellSkeletonRegion region="docked-prompt-bar" className="shrink-0 border-b px-4 py-3">
          <div className="mx-auto w-full max-w-5xl">
            <ShellSkeletonBlock className="h-31.5 w-full rounded-2xl" />
          </div>
        </ShellSkeletonRegion>
        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden px-4 pt-3 pb-4">
          <ShellSkeletonRegion
            region="sort-tabs"
            className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2"
          >
            {sorts.length > 0 ? <ShellSkeletonBlock className="h-8 w-33" /> : null}
            {types.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {types.map((option) => (
                  <ShellSkeletonBlock key={option.value} className="h-8.5 w-24 rounded-full" />
                ))}
              </div>
            ) : null}
            {sorts.length === 0 && types.length === 0 ? <ShellSkeletonBlock className="h-5 w-40" /> : null}
          </ShellSkeletonRegion>
          <ShellSkeletonRegion region="masonry-feed" className="min-h-0 flex-1 overflow-hidden">
            <div className="columns-2 gap-3 sm:columns-3 lg:columns-4">
              {FEED_SKELETON_ASPECTS.map((aspect, index) => (
                <ShellSkeletonBlock key={index} className={cn("mb-3 w-full break-inside-avoid", aspect)} />
              ))}
            </div>
          </ShellSkeletonRegion>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Run the unit tests to see them pass**

```bash
cd apps/docs && pnpm vitest run registry/super-ai/explore-shell.test.tsx
```

Expected: PASS, every test in the file.

- [ ] **Step 6: The `Loading` and `Status` stories**

In `ExploreShell.stories.tsx`, add `fn` to the `storybook/test` import, and add:

```tsx
import { expectLoadingTwin, LoadingTwin } from "@/lib/loading-twin";
import { RateLimitBanner } from "@/registry/super-ai/rate-limit-banner";
```

Append at the end of the file:

```tsx
/**
 * First paint, before the feed has loaded. The rail, the prompt bar, the sort
 * strip and the feed each draw a skeleton at the size they will take, the root is
 * marked busy, and nothing inside it takes focus. The sort strip keeps room for
 * the tabs and pills this feed offers, because those are known before the items
 * are. The play renders the loaded feed in the same frame and fails if a skeleton
 * sits more than 8px from where its region lands.
 */
export const Loading: Story = {
  args: FULL_ARGS,
  render: (args) => <LoadingTwin>{(loading) => <ExploreShell {...args} loading={loading} />}</LoadingTwin>,
  play: async ({ canvasElement }) => {
    await expectLoadingTwin(canvasElement, "explore-shell", {
      rail: "frame",
      "docked-prompt-bar": "frame",
      "sort-tabs": "frame",
      "masonry-feed": "frame",
    });
  },
};

/**
 * The model is at capacity and the provider has given no estimate. M6 sits at the
 * top of the feed column, above the prompt bar it holds up, says honestly that
 * there is no estimate rather than inventing one, and offers to notify instead.
 * The feed below stays browsable.
 */
export const Status: Story = {
  args: {
    ...FULL_ARGS,
    status: <RateLimitBanner cause="provider-capacity" resource="Image generations" onNotifyMe={fn()} />,
  },
  play: async ({ canvasElement }) => {
    const status = canvasElement.querySelector<HTMLElement>('[data-slot="explore-shell-status"]');
    await expect(status).not.toBeNull();
    await expect(status!.nextElementSibling).toHaveAttribute("data-region", "docked-prompt-bar");
    await expect(
      within(status!).getByRole("button", { name: "Notify me when capacity returns" }),
    ).toBeVisible();
  },
};
```

- [ ] **Step 7: Run the story file**

```bash
cd apps/storybook && pnpm exec vitest run --project storybook src/stories/super-ai/ExploreShell.stories.tsx
```

Expected: PASS, every story in the file, each under axe. If the twin fails on a region,
fix the skeleton's size classes against the twin targets above, never the kind, the
tolerance or the fixture.

- [ ] **Step 8: The guidance module**

In `apps/docs/content/components/explore-shell.docs.tsx`:

1. Append to the end of the `usage` string:

```text
 Pass `status` for a message about the whole surface (offline, reconnecting, a failed save, an expired session, a rate limit): it renders at the top of the feed column, above the prompt bar, only when given, and holds M6 or the vendored Alert. Pass `loading` for first paint: every region draws a skeleton at its loaded size, the root is marked busy, and nothing is mounted that could take focus.
```

2. Append to `anatomy`:

```tsx
    {
      slot: "explore-shell-status",
      note: "At the top of the feed column, only when `status` is passed. Holds M6 or the vendored Alert; the shell adds no live region of its own.",
    },
    {
      slot: "shell-skeleton-region",
      note: "One per region while `loading`: hidden from assistive tech and sized like the loaded region. It carries `data-loading-region`, as does each loaded region's box, which is what the loading twin measures.",
    },
```

3. Append to `dos`:

```tsx
    {
      text: "Mount the command palette once, at the root of your app, and keep it out of the shell: it is not a shell slot, and a palette mounted in each shell binds its shortcut once per surface.",
    },
```

4. Append to `accessibility.keyboard`:

```tsx
      "While `loading`, the shell mounts none of its controls, so there is no tab stop inside it until the data arrives; a control you pass in `status` is the only one.",
```

5. Append to `accessibility.screenReader`:

```tsx
      "While `loading`, the root carries `aria-busy` and every skeleton is hidden from assistive tech, so a screen reader finds one visually hidden line, Loading, plus anything you pass in `status`.",
      "The shell puts no live region around `status`. M6 is a note that announces its countdown politely and the vendored Alert defaults to an assertive alert, so choose the one whose announcement fits the message. Inside a busy root, a screen reader may hold an announcement until `loading` clears.",
```

6. Append to `pitfalls`:

```tsx
    "The rail skeleton is B4's width, 92px, written into this shell as `w-23` rather than read from B4. If B4 changes width, this skeleton falls out of step with it, and that class is the one to change.",
    "The sort strip's skeleton reserves tabs and pills only for the `sorts` and `types` passed while loading. Pass them if the loaded feed will offer them, or the strip changes height when the data arrives.",
```

- [ ] **Step 9: Verify**

```bash
cd apps/docs
pnpm vitest run registry/super-ai/explore-shell.test.tsx
pnpm reconcile:deps explore-shell
pnpm check:tokens
pnpm exec tsx scripts/check-citations.mts
pnpm contract:emit
pnpm vitest run scripts/lib/contract-emit.test.ts scripts/lib/story-coverage.test.ts
cd ../..
pnpm typecheck
pnpm lint
pnpm exec prettier --write apps/docs/registry/super-ai/explore-shell.tsx apps/docs/registry/super-ai/explore-shell.test.tsx apps/storybook/src/stories/super-ai/ExploreShell.stories.tsx apps/docs/content/components/explore-shell.docs.tsx
```

Expected: every command exits 0; `reconcile:deps explore-shell` prints
`1 item(s) reconciled, no drift.`.

- [ ] **Step 10: Commit**

```bash
git checkout -- apps/docs/index/components.toon apps/docs/public/llms.txt apps/docs/public/llms-full.txt
git add apps/docs/registry/super-ai/explore-shell.tsx apps/docs/registry/super-ai/explore-shell.test.tsx apps/docs/registry/super-ai/explore-shell.meta.json apps/docs/public/llms/components/explore-shell.md apps/storybook/src/stories/super-ai/ExploreShell.stories.tsx apps/docs/content/components/explore-shell.docs.tsx
git -c user.name="weeeha" -c user.email="1083934+weeeha@users.noreply.github.com" commit -m "feat(shell-fidelity): explore-shell status and loading"
```

---

### Task 12: `generation-shell` (O6)

**Files:**

- Modify: `apps/docs/registry/super-ai/generation-shell.tsx`
- Modify: `apps/docs/registry/super-ai/generation-shell.test.tsx`
- Modify: `apps/storybook/src/stories/super-ai/GenerationShell.stories.tsx`
- Modify: `apps/docs/content/components/generation-shell.docs.tsx`
- Modify: `apps/docs/components/demos/generation-shell-demo.tsx`
- Derived, committed: `apps/docs/registry/super-ai/generation-shell.meta.json`,
  `apps/docs/public/llms/components/generation-shell.md`

**Twin targets** (loaded, 1200×900, from `Tool`): topbar 0,0,1200,48 `frame` ·
config-panel 16,64,384,820 `frame` · cost-generate 40,836,344,32 `frame` · result-canvas
416,64,768,820 `frame`. The cost row sits in E1's 65px footer (16px padding, the 32px
row, a 1px rule), 8px in from the footer's empty leading span.

- [ ] **Step 1: Write the failing tests**

Add `import { expectShellLoadedContract, expectShellLoadingContract } from "@/lib/test-utils";`
to `generation-shell.test.tsx`, then append:

```tsx
describe("GenerationShell status and loading", () => {
  const root = (container: HTMLElement) => container.querySelector('[data-slot="generation-shell"]')!;

  it("marks every region's box and renders no status by default", () => {
    const { container } = render(<GenerationShell />);
    expectShellLoadedContract(root(container), { name: "generation-shell", regions: REGIONS });
    expect(container.querySelector('[data-slot="generation-shell-status"]')).toBeNull();
  });

  it("renders status directly under the topbar", () => {
    const { container } = render(<GenerationShell status={<p>You reached your plan limit.</p>} />);
    const status = container.querySelector('[data-slot="generation-shell-status"]')!;
    expect(status).toHaveTextContent("You reached your plan limit.");
    expect(status.previousElementSibling).toHaveAttribute("data-region", "topbar");
  });

  it("draws every region as a skeleton, busy and with nothing to focus, while loading", () => {
    const { container } = render(
      <GenerationShell loading topbar={{ actions: <button type="button">Share</button> }} cost={4} />,
    );
    expectShellLoadingContract(root(container), { name: "generation-shell", regions: REGIONS });
    expect(container.querySelector('[data-slot="generation-panel"]')).toBeNull();
    expect(container.querySelector('[data-slot="app-topbar"]')).toBeNull();
  });

  it("keeps status while loading", () => {
    const { container } = render(<GenerationShell loading status={<p>Reconnecting</p>} />);
    expect(container.querySelector('[data-slot="generation-shell-status"]')).toHaveTextContent(
      "Reconnecting",
    );
  });
});
```

- [ ] **Step 2: Run them to see them fail**

```bash
cd apps/docs && pnpm vitest run registry/super-ai/generation-shell.test.tsx
```

Expected: the four new tests FAIL; every existing test still passes.

- [ ] **Step 3: Props, imports, the status strip and the loaded markers**

In `generation-shell.tsx`:

1. Add:

```tsx
import {
  ShellLoadingLabel,
  ShellSkeletonBlock,
  ShellSkeletonLines,
  ShellSkeletonRegion,
  ShellSkeletonTiles,
} from "@/registry/super-ai/shell-skeleton";
```

2. At the end of `GenerationShellProps`, after `empty`, add:

```tsx
  /**
   * A message about the whole surface: offline, reconnecting, a failed save, an
   * expired session, a rate limit. Renders under the topbar, above the panel and
   * the results it affects, and only when given. Pass M6 `rate-limit-banner` or
   * the vendored `Alert`; the shell adds no live region, so the component you pass
   * carries its own role. Still renders while `loading`.
   */
  status?: React.ReactNode;
  /**
   * First paint, before the tool has loaded. Every region draws a skeleton at the
   * size it will take, the root carries `aria-busy`, and nothing the shell composes
   * is mounted, so there is nothing to focus or click.
   */
  loading?: boolean;
```

3. In the parameter list, directly before `className,`, add `status,` and `loading = false,`.

4. After `const hasSettings = ...;` add:

```tsx
const statusStrip = status ? (
  <div data-slot="generation-shell-status" className="shrink-0 border-b px-3 py-2">
    {status}
  </div>
) : null;
```

5. Add `data-loading-region` beside each loaded region's `data-region`: on `AppTopbar`
   (`"topbar"`), on `GenerationPanel` (`"config-panel"`), on the `cost-generate` div
   passed as `generate`, and on the `result-canvas` section.

6. Insert `{statusStrip}` directly after the `AppTopbar` element's closing `/>`, before
   `<div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden p-4 md:flex-row">`.

- [ ] **Step 4: The loading branch**

Directly before the component's `return (`, after `statusStrip`, add:

```tsx
if (loading) {
  return (
    <div
      data-slot="generation-shell"
      aria-busy="true"
      className={cn(
        "bg-background text-foreground flex h-full min-h-0 w-full flex-col overflow-hidden",
        className,
      )}
      {...props}
    >
      <ShellLoadingLabel />
      <ShellSkeletonRegion region="topbar" className="flex h-12 shrink-0 items-center gap-3 border-b px-3">
        <ShellSkeletonBlock className="h-4 w-28" />
        <ShellSkeletonBlock className="h-5 w-14 rounded-full" />
        <ShellSkeletonBlock className="ms-auto h-6 w-24" />
      </ShellSkeletonRegion>
      {statusStrip}
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden p-4 md:flex-row">
        <ShellSkeletonRegion
          region="config-panel"
          className="flex h-auto min-h-0 shrink-0 basis-1/2 flex-col overflow-hidden rounded-xl border md:h-full md:w-96 md:basis-auto"
        >
          <div className="flex min-h-0 flex-1 flex-col gap-6 p-4">
            <ShellSkeletonBlock className="h-5 w-24" />
            <ShellSkeletonTiles count={4} className="grid-cols-2" tileClassName="aspect-square" />
            <ShellSkeletonBlock className="h-5 w-20" />
            <ShellSkeletonLines count={4} />
          </div>
          {/* E1's footer: an empty leading span, then the cost row, as in the loaded panel. */}
          <div className="flex shrink-0 items-center justify-between gap-2 border-t p-4">
            <span />
            <ShellSkeletonRegion
              region="cost-generate"
              className="flex min-w-0 flex-1 items-center justify-between gap-2"
            >
              <ShellSkeletonBlock className="h-5.5 w-22 rounded-full" />
              <ShellSkeletonBlock className="h-8 w-20" />
            </ShellSkeletonRegion>
          </div>
        </ShellSkeletonRegion>
        <ShellSkeletonRegion region="result-canvas" className="min-h-0 min-w-0 flex-1 overflow-hidden">
          <ShellSkeletonTiles
            count={8}
            className="gap-4 sm:grid-cols-2 lg:grid-cols-4"
            tileClassName="aspect-square"
          />
        </ShellSkeletonRegion>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Run the unit tests to see them pass**

```bash
cd apps/docs && pnpm vitest run registry/super-ai/generation-shell.test.tsx
```

Expected: PASS, every test in the file.

- [ ] **Step 6: The `Loading` and `Status` stories**

In `GenerationShell.stories.tsx` add:

```tsx
import { expectLoadingTwin, LoadingTwin } from "@/lib/loading-twin";
import { RateLimitBanner } from "@/registry/super-ai/rate-limit-banner";
```

Append at the end of the file:

```tsx
/**
 * First paint, before the tool has loaded. The topbar, the settings panel with its
 * cost and Generate row, and the result canvas each draw a skeleton at the size
 * they will take, the root is marked busy, and nothing inside it takes focus. The
 * play renders the loaded tool in the same frame and fails if a skeleton sits more
 * than 8px from where its region lands.
 */
export const Loading: Story = {
  args: FULL_ARGS,
  render: (args) => <LoadingTwin>{(loading) => <GenerationShell {...args} loading={loading} />}</LoadingTwin>,
  play: async ({ canvasElement }) => {
    await expectLoadingTwin(canvasElement, "generation-shell", {
      topbar: "frame",
      "config-panel": "frame",
      "cost-generate": "frame",
      "result-canvas": "frame",
    });
  },
};

/**
 * The plan's limit is reached. M6 sits under the topbar, above the panel and the
 * results it holds up, says which limit and that it is the plan's cap rather than
 * a fault in the request, and counts down to the reset.
 */
export const Status: Story = {
  args: {
    ...FULL_ARGS,
    status: <RateLimitBanner cause="your-limit" resource="Video generations" remainingSeconds={5400} />,
  },
  play: async ({ canvasElement }) => {
    const status = canvasElement.querySelector<HTMLElement>('[data-slot="generation-shell-status"]');
    await expect(status).not.toBeNull();
    await expect(status!.previousElementSibling).toHaveAttribute("data-region", "topbar");
    await expect(within(status!).getByText("Video generations")).toBeVisible();
  },
};
```

- [ ] **Step 7: Run the story file**

```bash
cd apps/storybook && pnpm exec vitest run --project storybook src/stories/super-ai/GenerationShell.stories.tsx
```

Expected: PASS, every story in the file, each under axe. If the twin fails on a region,
fix the skeleton's size classes against the twin targets above, never the kind, the
tolerance or the fixture.

- [ ] **Step 8: The guidance module**

In `apps/docs/content/components/generation-shell.docs.tsx`:

1. Append to the end of the `usage` string:

```text
 Pass `status` for a message about the whole surface (offline, reconnecting, a failed save, an expired session, a rate limit): it renders under the topbar, only when given, and holds M6 or the vendored Alert. Pass `loading` for first paint: every region draws a skeleton at its loaded size, the root is marked busy, and nothing is mounted that could take focus.
```

2. Append to `anatomy`:

```tsx
    {
      slot: "generation-shell-status",
      note: "Under the topbar, only when `status` is passed. Holds M6 or the vendored Alert; the shell adds no live region of its own.",
    },
    {
      slot: "shell-skeleton-region",
      note: "One per region while `loading`: hidden from assistive tech and sized like the loaded region. It carries `data-loading-region`, as does each loaded region's box, which is what the loading twin measures.",
    },
```

3. Append to `dos`:

```tsx
    {
      text: "Mount the command palette once, at the root of your app, and keep it out of the shell: it is not a shell slot, and a palette mounted in each shell binds its shortcut once per surface.",
    },
```

4. Append to `accessibility.keyboard`:

```tsx
      "While `loading`, the shell mounts none of its controls, so there is no tab stop inside it until the data arrives; a control you pass in `status` is the only one.",
```

5. Append to `accessibility.screenReader`:

```tsx
      "While `loading`, the root carries `aria-busy` and every skeleton is hidden from assistive tech, so a screen reader finds one visually hidden line, Loading, plus anything you pass in `status`.",
      "The shell puts no live region around `status`. M6 is a note that announces its countdown politely and the vendored Alert defaults to an assertive alert, so choose the one whose announcement fits the message. Inside a busy root, a screen reader may hold an announcement until `loading` clears.",
```

6. Append to `pitfalls`:

```tsx
    "E1's card is drawn with a ring and its loading skeleton with a border, so the skeleton's contents sit 1px further in on each edge. That is inside the loading twin's tolerance; restyling either one is where a jump on load would come from.",
```

- [ ] **Step 9: The demo: notifications beside the account menu**

In `apps/docs/components/demos/generation-shell-demo.tsx`, add
`import { DemoNotifications } from "@/components/demos/demo-notifications";` and replace
the `actions` value inside `topbar` with:

```tsx
        actions: (
          <div className="flex items-center gap-1">
            <DemoNotifications />
            <AccountMenu
              user={{ name: "Ada Lovelace", email: "ada@northwind.example" }}
              theme="system"
              onThemeChange={() => {}}
              background="default"
              onBackgroundChange={() => {}}
              onSignOut={() => {}}
            />
          </div>
        ),
```

The credits indicator still renders after `topbar.actions`; putting the account menu last
is U3's parked prop gap, not this task.

- [ ] **Step 10: Verify**

```bash
cd apps/docs
pnpm vitest run registry/super-ai/generation-shell.test.tsx
pnpm reconcile:deps generation-shell
pnpm check:tokens
pnpm exec tsx scripts/check-citations.mts
pnpm contract:emit
pnpm vitest run scripts/lib/contract-emit.test.ts scripts/lib/story-coverage.test.ts
cd ../..
pnpm typecheck
pnpm lint
pnpm exec prettier --write apps/docs/registry/super-ai/generation-shell.tsx apps/docs/registry/super-ai/generation-shell.test.tsx apps/storybook/src/stories/super-ai/GenerationShell.stories.tsx apps/docs/content/components/generation-shell.docs.tsx apps/docs/components/demos/generation-shell-demo.tsx
```

Expected: every command exits 0; `reconcile:deps generation-shell` prints
`1 item(s) reconciled, no drift.`.

- [ ] **Step 11: Commit**

```bash
git checkout -- apps/docs/index/components.toon apps/docs/public/llms.txt apps/docs/public/llms-full.txt
git add apps/docs/registry/super-ai/generation-shell.tsx apps/docs/registry/super-ai/generation-shell.test.tsx apps/docs/registry/super-ai/generation-shell.meta.json apps/docs/public/llms/components/generation-shell.md apps/storybook/src/stories/super-ai/GenerationShell.stories.tsx apps/docs/content/components/generation-shell.docs.tsx apps/docs/components/demos/generation-shell-demo.tsx
git -c user.name="weeeha" -c user.email="1083934+weeeha@users.noreply.github.com" commit -m "feat(shell-fidelity): generation-shell status and loading"
```

---

### Task 13: `library-shell` (O7)

**Files:**

- Modify: `apps/docs/registry/super-ai/library-shell.tsx`
- Modify: `apps/docs/registry/super-ai/library-shell.test.tsx`
- Modify: `apps/storybook/src/stories/super-ai/LibraryShell.stories.tsx`
- Modify: `apps/docs/content/components/library-shell.docs.tsx`
- Modify: `apps/docs/components/demos/library-shell-demo.tsx`
- Derived, committed: `apps/docs/registry/super-ai/library-shell.meta.json`,
  `apps/docs/public/llms/components/library-shell.md`

**Twin targets** (loaded, 1200×900, from `Archive`): facet-rail 0,0,256,900 `frame` ·
header 256,0,944,139 `frame` · dense-grid 256,139,944,761 `frame`. The header is J1's
36px title row, its 32px search and its 30px applied-filter row, 12px apart, inside 8px of
padding and a 1px rule. With no facet selected J1 still renders the filter row, empty, so
the gap stays and the header is 109px.

- [ ] **Step 1: Write the failing tests**

Add `import { expectShellLoadedContract, expectShellLoadingContract } from "@/lib/test-utils";`
to `library-shell.test.tsx`, then append:

```tsx
describe("LibraryShell status and loading", () => {
  const root = (container: HTMLElement) => container.querySelector('[data-slot="library-shell"]')!;

  it("marks every region's box and renders no status by default", () => {
    const { container } = render(<LibraryShell />);
    expectShellLoadedContract(root(container), { name: "library-shell", regions: REGIONS });
    expect(container.querySelector('[data-slot="library-shell-status"]')).toBeNull();
  });

  it("renders status at the top of the content column, above the header", () => {
    const { container } = render(<LibraryShell status={<p>You are offline.</p>} />);
    const status = container.querySelector('[data-slot="library-shell-status"]')!;
    expect(status).toHaveTextContent("You are offline.");
    expect(status.nextElementSibling).toHaveAttribute("data-region", "header");
  });

  it("draws every region as a skeleton, busy and with nothing to focus, while loading", () => {
    const { container } = render(
      <LibraryShell loading headerActions={<button type="button">Upload</button>} />,
    );
    expectShellLoadingContract(root(container), { name: "library-shell", regions: REGIONS });
    expect(container.querySelector('[data-slot="filter-panel"]')).toBeNull();
    expect(container.querySelector('[data-slot="asset-library"]')).toBeNull();
    expect(container.querySelector('[data-slot="generation-grid"]')).toBeNull();
  });

  it("keeps status while loading", () => {
    const { container } = render(<LibraryShell loading status={<p>Reconnecting</p>} />);
    expect(container.querySelector('[data-slot="library-shell-status"]')).toHaveTextContent("Reconnecting");
  });
});
```

- [ ] **Step 2: Run them to see them fail**

```bash
cd apps/docs && pnpm vitest run registry/super-ai/library-shell.test.tsx
```

Expected: the four new tests FAIL; every existing test still passes.

- [ ] **Step 3: Props, imports, the status strip and the loaded markers**

In `library-shell.tsx`:

1. Add:

```tsx
import {
  ShellLoadingLabel,
  ShellSkeletonBlock,
  ShellSkeletonRegion,
  ShellSkeletonRows,
  ShellSkeletonTiles,
} from "@/registry/super-ai/shell-skeleton";
```

2. At the end of `LibraryShellProps`, after `moreLikeThis`, add:

```tsx
  /**
   * A message about the whole surface: offline, reconnecting, a failed save, an
   * expired session, a rate limit. Renders at the top of the content column, above
   * the header and the grid it affects, and only when given. Pass M6
   * `rate-limit-banner` or the vendored `Alert`; the shell adds no live region, so
   * the component you pass carries its own role. Still renders while `loading`.
   */
  status?: React.ReactNode;
  /**
   * First paint, before the archive has loaded. Every region draws a skeleton at
   * the size it will take, the root carries `aria-busy`, and nothing the shell
   * composes is mounted, so there is nothing to focus or click. The header
   * reserves room for `headerActions` and for any facets already selected.
   */
  loading?: boolean;
```

3. In the parameter list, directly before `className,`, add `status,` and `loading = false,`.

4. After the `emptyTile` constant, add:

```tsx
const statusStrip = status ? (
  <div data-slot="library-shell-status" className="shrink-0 border-b px-3 py-2">
    {status}
  </div>
) : null;
```

5. Add `data-loading-region` beside each loaded region's `data-region`: the `facet-rail`
   aside, the `header` div and the `dense-grid` section.

6. Insert `{statusStrip}` as the first child of
   `<div className="flex min-h-0 min-w-0 flex-1 flex-col">`, before the
   `{/* "header + search" is one region` comment.

- [ ] **Step 4: The loading branch**

Directly before the component's `return (`, after `statusStrip`, add:

```tsx
if (loading) {
  return (
    <div
      data-slot="library-shell"
      aria-busy="true"
      className={cn(
        "bg-background text-foreground flex h-full min-h-0 w-full flex-col overflow-hidden md:flex-row",
        className,
      )}
      {...props}
    >
      <ShellLoadingLabel />
      <ShellSkeletonRegion
        region="facet-rail"
        className="flex max-h-56 w-full shrink-0 flex-col gap-4 overflow-hidden border-b p-4 md:h-full md:max-h-none md:w-64 md:border-e md:border-b-0"
      >
        <ShellSkeletonBlock className="h-6 w-24" />
        <ShellSkeletonRows count={3} />
        <ShellSkeletonRows count={6} />
      </ShellSkeletonRegion>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        {statusStrip}
        <ShellSkeletonRegion region="header" className="flex shrink-0 flex-col gap-3 border-b px-4 py-2">
          <div className={cn("flex items-center justify-between gap-2", headerActions ? "h-12" : "h-9")}>
            <ShellSkeletonBlock className="h-5 w-24" />
            {headerActions ? <ShellSkeletonBlock className="h-8 w-32" /> : null}
          </div>
          <ShellSkeletonBlock className="h-8 w-full" />
          {/* J1 renders its filter row even when it is empty, so the gap above it stays either way. */}
          {appliedFacets.length > 0 ? <ShellSkeletonBlock className="h-7.5 w-48 rounded-full" /> : <div />}
        </ShellSkeletonRegion>
        <ShellSkeletonRegion region="dense-grid" className="min-h-0 flex-1 overflow-hidden px-4 py-3">
          <ShellSkeletonBlock className="mb-2 h-4 w-20" />
          <ShellSkeletonTiles
            count={12}
            className="grid-cols-3 sm:grid-cols-4 lg:grid-cols-6"
            tileClassName="aspect-square"
          />
        </ShellSkeletonRegion>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Run the unit tests to see them pass**

```bash
cd apps/docs && pnpm vitest run registry/super-ai/library-shell.test.tsx
```

Expected: PASS, every test in the file.

- [ ] **Step 6: The `Loading` and `Status` stories**

In `LibraryShell.stories.tsx`, add `WifiOff` to the `lucide-react` import, and add:

```tsx
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { expectLoadingTwin, LoadingTwin } from "@/lib/loading-twin";
```

Append at the end of the file:

```tsx
/**
 * First paint, before the archive has loaded. The facet rail, the header with its
 * search and applied-filter row, and the grid each draw a skeleton at the size
 * they will take, the root is marked busy, and nothing inside it takes focus. The
 * play renders the loaded archive in the same frame and fails if a skeleton sits
 * more than 8px from where its region lands.
 */
export const Loading: Story = {
  args: FULL_ARGS,
  render: (args) => <LoadingTwin>{(loading) => <LibraryShell {...args} loading={loading} />}</LoadingTwin>,
  play: async ({ canvasElement }) => {
    await expectLoadingTwin(canvasElement, "library-shell", {
      "facet-rail": "frame",
      header: "frame",
      "dense-grid": "frame",
    });
  },
};

/**
 * The archive is offline. The message sits at the top of the content column,
 * above the header and the grid it qualifies, and says what still works. The
 * vendored Alert is given `role="status"`, so it is announced politely, once.
 */
export const Status: Story = {
  args: {
    ...FULL_ARGS,
    status: (
      <Alert role="status">
        <WifiOff aria-hidden />
        <AlertTitle>You are offline</AlertTitle>
        <AlertDescription>
          The archive shows what this device has cached. Uploads start again when you reconnect.
        </AlertDescription>
      </Alert>
    ),
  },
  play: async ({ canvasElement }) => {
    const status = canvasElement.querySelector<HTMLElement>('[data-slot="library-shell-status"]');
    await expect(status).not.toBeNull();
    await expect(status!.nextElementSibling).toHaveAttribute("data-region", "header");
    await expect(within(status!).getByText("You are offline")).toBeVisible();
  },
};
```

- [ ] **Step 7: Run the story file**

```bash
cd apps/storybook && pnpm exec vitest run --project storybook src/stories/super-ai/LibraryShell.stories.tsx
```

Expected: PASS, every story in the file, each under axe. If the twin fails on a region,
fix the skeleton's size classes against the twin targets above, never the kind, the
tolerance or the fixture.

- [ ] **Step 8: The guidance module**

In `apps/docs/content/components/library-shell.docs.tsx`:

1. Append to the end of the `usage` string:

```text
 Pass `status` for a message about the whole surface (offline, reconnecting, a failed save, an expired session, a rate limit): it renders at the top of the content column, above the header, only when given, and holds M6 or the vendored Alert. Pass `loading` for first paint: every region draws a skeleton at its loaded size, the root is marked busy, and nothing is mounted that could take focus.
```

2. Append to `anatomy`:

```tsx
    {
      slot: "library-shell-status",
      note: "At the top of the content column, only when `status` is passed. Holds M6 or the vendored Alert; the shell adds no live region of its own.",
    },
    {
      slot: "shell-skeleton-region",
      note: "One per region while `loading`: hidden from assistive tech and sized like the loaded region. It carries `data-loading-region`, as does each loaded region's box, which is what the loading twin measures.",
    },
```

3. Append to `dos`:

```tsx
    {
      text: "Mount the command palette once, at the root of your app, and keep it out of the shell: it is not a shell slot, and a palette mounted in each shell binds its shortcut once per surface.",
    },
```

4. Append to `accessibility.keyboard`:

```tsx
      "While `loading`, the shell mounts none of its controls, so there is no tab stop inside it until the data arrives; a control you pass in `status` is the only one.",
```

5. Append to `accessibility.screenReader`:

```tsx
      "While `loading`, the root carries `aria-busy` and every skeleton is hidden from assistive tech, so a screen reader finds one visually hidden line, Loading, plus anything you pass in `status`.",
      "The shell puts no live region around `status`. M6 is a note that announces its countdown politely and the vendored Alert defaults to an assertive alert, so choose the one whose announcement fits the message. Inside a busy root, a screen reader may hold an announcement until `loading` clears.",
```

6. Append to `pitfalls`:

```tsx
    "The header skeleton reserves a taller title row only when `headerActions` is passed, and an applied-filter row only when facets are already selected, the same rules J1 follows once loaded. Pass both while loading if the loaded header will show them.",
```

- [ ] **Step 9: The demo: notifications beside the account menu**

In `apps/docs/components/demos/library-shell-demo.tsx`, add
`import { DemoNotifications } from "@/components/demos/demo-notifications";` and, inside
the existing `headerActions` row, insert `<DemoNotifications />` between the Upload
`Button` and the `AccountMenu`:

```tsx
      headerActions={
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline">
            Upload
          </Button>
          <DemoNotifications />
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

- [ ] **Step 10: Verify**

```bash
cd apps/docs
pnpm vitest run registry/super-ai/library-shell.test.tsx
pnpm reconcile:deps library-shell
pnpm check:tokens
pnpm exec tsx scripts/check-citations.mts
pnpm contract:emit
pnpm vitest run scripts/lib/contract-emit.test.ts scripts/lib/story-coverage.test.ts
cd ../..
pnpm typecheck
pnpm lint
pnpm exec prettier --write apps/docs/registry/super-ai/library-shell.tsx apps/docs/registry/super-ai/library-shell.test.tsx apps/storybook/src/stories/super-ai/LibraryShell.stories.tsx apps/docs/content/components/library-shell.docs.tsx apps/docs/components/demos/library-shell-demo.tsx
```

Expected: every command exits 0; `reconcile:deps library-shell` prints
`1 item(s) reconciled, no drift.`.

- [ ] **Step 11: Commit**

```bash
git checkout -- apps/docs/index/components.toon apps/docs/public/llms.txt apps/docs/public/llms-full.txt
git add apps/docs/registry/super-ai/library-shell.tsx apps/docs/registry/super-ai/library-shell.test.tsx apps/docs/registry/super-ai/library-shell.meta.json apps/docs/public/llms/components/library-shell.md apps/storybook/src/stories/super-ai/LibraryShell.stories.tsx apps/docs/content/components/library-shell.docs.tsx apps/docs/components/demos/library-shell-demo.tsx
git -c user.name="weeeha" -c user.email="1083934+weeeha@users.noreply.github.com" commit -m "feat(shell-fidelity): library-shell status and loading"
```

---

### Task 14: `settings-shell` (O12)

**Files:**

- Modify: `apps/docs/registry/super-ai/settings-shell.tsx`
- Modify: `apps/docs/registry/super-ai/settings-shell.test.tsx`
- Modify: `apps/storybook/src/stories/super-ai/SettingsShell.stories.tsx`
- Modify: `apps/docs/content/components/settings-shell.docs.tsx`
- Modify: `apps/docs/components/demos/settings-shell-demo.tsx`
- Derived, committed: `apps/docs/registry/super-ai/settings-shell.meta.json`,
  `apps/docs/public/llms/components/settings-shell.md`

**Twin targets** (loaded, 1200×900, from `Workspace`): breadcrumb 16,16,208,20 `text` ·
grouped-nav 0,53,240,847 `frame` · info-callout 256,69,928,40 `flow-lead` ·
setting-sections 256,133,928,426 `flow` · code-block 256,583,928,215 `flow`. The header
row is 53px because the account menu's 32px trigger sets it; without `accountMenu` it is
41px. The breadcrumb is as wide as its words, so its width is not compared.

- [ ] **Step 1: Write the failing tests**

Add `import { expectShellLoadedContract, expectShellLoadingContract } from "@/lib/test-utils";`
to `settings-shell.test.tsx`, then append:

```tsx
describe("SettingsShell status and loading", () => {
  const root = (container: HTMLElement) => container.querySelector('[data-slot="settings-shell"]')!;

  it("marks every region's box and renders no status by default", () => {
    const { container } = render(<SettingsShell />);
    expectShellLoadedContract(root(container), { name: "settings-shell", regions: REGIONS });
    expect(container.querySelector('[data-slot="settings-shell-status"]')).toBeNull();
  });

  it("renders status directly under the header row", () => {
    const { container } = render(<SettingsShell status={<p>Could not save your changes.</p>} />);
    const status = container.querySelector('[data-slot="settings-shell-status"]')!;
    expect(status).toHaveTextContent("Could not save your changes.");
    expect(status.previousElementSibling).toHaveAttribute("data-slot", "settings-shell-header");
  });

  it("draws every region as a skeleton, busy and with nothing to focus, while loading", () => {
    const { container } = render(
      <SettingsShell loading accountMenu={<button type="button">Account</button>} />,
    );
    expectShellLoadingContract(root(container), { name: "settings-shell", regions: REGIONS });
    expect(container.querySelector('[data-slot="settings-shell-search"]')).toBeNull();
    expect(container.querySelector('[data-slot="settings-dialog"]')).toBeNull();
  });

  it("keeps status while loading", () => {
    const { container } = render(<SettingsShell loading status={<p>Reconnecting</p>} />);
    expect(container.querySelector('[data-slot="settings-shell-status"]')).toHaveTextContent("Reconnecting");
  });
});
```

- [ ] **Step 2: Run them to see them fail**

```bash
cd apps/docs && pnpm vitest run registry/super-ai/settings-shell.test.tsx
```

Expected: the four new tests FAIL; every existing test still passes.

- [ ] **Step 3: Props, imports, the status strip and the loaded markers**

In `settings-shell.tsx`:

1. Add:

```tsx
import {
  ShellLoadingLabel,
  ShellSkeletonBlock,
  ShellSkeletonLines,
  ShellSkeletonRegion,
  ShellSkeletonRows,
} from "@/registry/super-ai/shell-skeleton";
```

2. At the end of `SettingsShellProps`, after `codeFallbackLabel`, add:

```tsx
  /**
   * A message about the whole surface: offline, reconnecting, a failed save, an
   * expired session, a rate limit. Renders under the breadcrumb row, above the nav
   * and the settings it affects, and only when given. Pass M6 `rate-limit-banner`
   * or the vendored `Alert`; the shell adds no live region, so the component you
   * pass carries its own role. Still renders while `loading`.
   */
  status?: React.ReactNode;
  /**
   * First paint, before the settings have loaded. Every region draws a skeleton at
   * the size it will take, the root carries `aria-busy`, and nothing the shell
   * composes is mounted, so there is nothing to focus or click. The header keeps a
   * place for `accountMenu` when it is passed, without mounting it.
   */
  loading?: boolean;
```

3. In the parameter list, directly before `className,`, add `status,` and `loading = false,`.

4. After `const code = active?.code;` add:

```tsx
const statusStrip = status ? (
  <div data-slot="settings-shell-status" className="shrink-0 border-b px-3 py-2">
    {status}
  </div>
) : null;
```

5. Add `data-loading-region` beside each loaded region's `data-region`: on `Breadcrumb`
   (`"breadcrumb"`), and on the `grouped-nav`, `info-callout` and `setting-sections` divs
   and the `code-block` section.

6. Insert `{statusStrip}` directly after the `</div>` closing
   `data-slot="settings-shell-header"`, before the `{/* Below \`md\` the nav stops being
   a column` comment.

- [ ] **Step 4: The loading branch**

Directly before the component's `return (`, after `statusStrip`, add:

```tsx
if (loading) {
  return (
    <div
      data-slot="settings-shell"
      aria-busy="true"
      className={cn("bg-background text-foreground flex h-full min-h-0 w-full flex-col", className)}
      {...props}
    >
      <ShellLoadingLabel />
      <div
        data-slot="settings-shell-header"
        className="flex shrink-0 items-center justify-between gap-3 border-b px-4 py-2.5"
      >
        <ShellSkeletonRegion region="breadcrumb" className="flex h-5 items-center gap-1.5">
          <ShellSkeletonBlock className="h-4 w-14" />
          <ShellSkeletonBlock className="h-4 w-16" />
          <ShellSkeletonBlock className="h-4 w-12" />
        </ShellSkeletonRegion>
        {accountMenu ? <ShellSkeletonBlock className="size-8 rounded-full" /> : null}
      </div>
      {statusStrip}
      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <ShellSkeletonRegion
          region="grouped-nav"
          className="flex max-h-64 w-full shrink-0 flex-col gap-4 overflow-hidden border-b p-3 md:max-h-none md:w-60 md:border-e md:border-b-0"
        >
          <div className="flex flex-col gap-1">
            <ShellSkeletonBlock className="h-8 w-full" />
            <div className="min-h-4" />
          </div>
          <ShellSkeletonRows count={8} />
        </ShellSkeletonRegion>
        <div
          data-slot="settings-shell-content"
          className="flex min-w-0 flex-1 flex-col gap-6 overflow-hidden p-4"
        >
          <ShellSkeletonRegion region="info-callout">
            <ShellSkeletonBlock className="h-10 w-full rounded-lg" />
          </ShellSkeletonRegion>
          <ShellSkeletonRegion region="setting-sections" className="flex flex-col gap-8">
            <div className="flex flex-col gap-1">
              <ShellSkeletonBlock className="h-6 w-40" />
              <ShellSkeletonBlock className="h-4 w-72" />
            </div>
            <ShellSkeletonLines count={6} />
          </ShellSkeletonRegion>
          <ShellSkeletonRegion region="code-block" className="flex flex-col gap-2 border-t pt-6">
            <div className="flex h-7 items-center justify-between gap-2">
              <ShellSkeletonBlock className="h-4 w-40" />
              <ShellSkeletonBlock className="h-7 w-18" />
            </div>
            <ShellSkeletonBlock className="h-36 w-full rounded-md" />
          </ShellSkeletonRegion>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Run the unit tests to see them pass**

```bash
cd apps/docs && pnpm vitest run registry/super-ai/settings-shell.test.tsx
```

Expected: PASS, every test in the file.

- [ ] **Step 6: The `Loading` and `Status` stories**

In `SettingsShell.stories.tsx`, add `AlertTriangle` and `RotateCcw` to the `lucide-react`
import, add `Button` from `@/components/ui/button` if the file does not import it yet,
and add:

```tsx
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { expectLoadingTwin, LoadingTwin } from "@/lib/loading-twin";
```

Append at the end of the file:

```tsx
/**
 * First paint, before the settings have loaded. The breadcrumb, the grouped nav
 * and the three content bands each draw a skeleton where they will land, the
 * header keeps a place for the account menu without mounting it, the root is
 * marked busy, and nothing inside it takes focus. The play renders the loaded page
 * in the same frame and fails if a skeleton sits more than 8px from where its
 * region lands. The breadcrumb's width, and the bands' heights and later bands'
 * tops, are left out, because words and the section's own rows decide them.
 */
export const Loading: Story = {
  args: FULL_ARGS,
  render: (args) => <LoadingTwin>{(loading) => <SettingsShell {...args} loading={loading} />}</LoadingTwin>,
  play: async ({ canvasElement }) => {
    await expectLoadingTwin(canvasElement, "settings-shell", {
      breadcrumb: "text",
      "grouped-nav": "frame",
      "info-callout": "flow-lead",
      "setting-sections": "flow",
      "code-block": "flow",
    });
  },
};

/**
 * A save failed. The message sits under the breadcrumb row, above the nav and the
 * section that did not save, with the retry beside the reason. The vendored
 * Alert's destructive description is 4.49:1 on the card, so the text and the
 * Retry button carry `text-destructive` at full strength themselves.
 */
export const Status: Story = {
  args: {
    ...FULL_ARGS,
    status: (
      <Alert variant="destructive">
        <AlertTriangle aria-hidden />
        <AlertTitle>Could not save your changes</AlertTitle>
        <AlertDescription className="flex flex-col items-start gap-2">
          <span className="text-destructive">The workspace name is unchanged. Retry to save it.</span>
          <Button type="button" size="sm" variant="outline" className="text-destructive" onClick={fn()}>
            <RotateCcw aria-hidden />
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    ),
  },
  play: async ({ canvasElement }) => {
    const status = canvasElement.querySelector<HTMLElement>('[data-slot="settings-shell-status"]');
    await expect(status).not.toBeNull();
    await expect(status!.previousElementSibling).toHaveAttribute("data-slot", "settings-shell-header");
    await expect(within(status!).getByRole("button", { name: "Retry" })).toBeVisible();
  },
};
```

- [ ] **Step 7: Run the story file**

```bash
cd apps/storybook && pnpm exec vitest run --project storybook src/stories/super-ai/SettingsShell.stories.tsx
```

Expected: PASS, every story in the file, each under axe. If the twin fails on a region,
fix the skeleton's size classes against the twin targets above, never the kind, the
tolerance or the fixture.

- [ ] **Step 8: The guidance module**

In `apps/docs/content/components/settings-shell.docs.tsx`:

1. Append to the end of the `usage` string:

```text
 Pass `status` for a message about the whole surface (offline, reconnecting, a failed save, an expired session, a rate limit): it renders under the breadcrumb row, only when given, and holds M6 or the vendored Alert. Pass `loading` for first paint: every region draws a skeleton at its loaded size, the root is marked busy, and nothing is mounted that could take focus.
```

2. Append to `anatomy`:

```tsx
    {
      slot: "settings-shell-status",
      note: "Under the breadcrumb row, only when `status` is passed. Holds M6 or the vendored Alert; the shell adds no live region of its own.",
    },
    {
      slot: "shell-skeleton-region",
      note: "One per region while `loading`: hidden from assistive tech and sized like the loaded region. It carries `data-loading-region`, as does each loaded region's box, which is what the loading twin measures.",
    },
```

3. Append to `dos`:

```tsx
    {
      text: "Mount the command palette once, at the root of your app, and keep it out of the shell: it is not a shell slot, and a palette mounted in each shell binds its shortcut once per surface.",
    },
```

4. Append to `accessibility.keyboard`:

```tsx
      "While `loading`, the shell mounts none of its controls, so there is no tab stop inside it until the data arrives; a control you pass in `status` is the only one.",
```

5. Append to `accessibility.screenReader`:

```tsx
      "While `loading`, the root carries `aria-busy` and every skeleton is hidden from assistive tech, so a screen reader finds one visually hidden line, Loading, plus anything you pass in `status`.",
      "The shell puts no live region around `status`. M6 is a note that announces its countdown politely and the vendored Alert defaults to an assertive alert, so choose the one whose announcement fits the message. Inside a busy root, a screen reader may hold an announcement until `loading` clears.",
```

6. Append to `pitfalls`:

```tsx
    "While `loading`, `accountMenu` is not mounted: the header keeps a round placeholder its size when it is passed, which is what holds the row at the menu's height, but the menu cannot be opened until loading ends.",
```

- [ ] **Step 9: The demo: notifications beside the account menu**

In `apps/docs/components/demos/settings-shell-demo.tsx`, add
`import { DemoNotifications } from "@/components/demos/demo-notifications";` and replace
the `accountMenu` value with:

```tsx
      accountMenu={
        <div className="flex items-center gap-1">
          <DemoNotifications />
          <AccountMenu
            user={{ name: "Ada Lovelace", email: "ada@northwind.example" }}
            theme={theme}
            onThemeChange={setTheme}
            background={background}
            onBackgroundChange={setBackground}
            onSignOut={() => {}}
          />
        </div>
      }
```

- [ ] **Step 10: Verify**

```bash
cd apps/docs
pnpm vitest run registry/super-ai/settings-shell.test.tsx
pnpm reconcile:deps settings-shell
pnpm check:tokens
pnpm exec tsx scripts/check-citations.mts
pnpm contract:emit
pnpm vitest run scripts/lib/contract-emit.test.ts scripts/lib/story-coverage.test.ts
cd ../..
pnpm typecheck
pnpm lint
pnpm exec prettier --write apps/docs/registry/super-ai/settings-shell.tsx apps/docs/registry/super-ai/settings-shell.test.tsx apps/storybook/src/stories/super-ai/SettingsShell.stories.tsx apps/docs/content/components/settings-shell.docs.tsx apps/docs/components/demos/settings-shell-demo.tsx
```

Expected: every command exits 0; `reconcile:deps settings-shell` prints
`1 item(s) reconciled, no drift.`.

- [ ] **Step 11: Commit**

```bash
git checkout -- apps/docs/index/components.toon apps/docs/public/llms.txt apps/docs/public/llms-full.txt
git add apps/docs/registry/super-ai/settings-shell.tsx apps/docs/registry/super-ai/settings-shell.test.tsx apps/docs/registry/super-ai/settings-shell.meta.json apps/docs/public/llms/components/settings-shell.md apps/storybook/src/stories/super-ai/SettingsShell.stories.tsx apps/docs/content/components/settings-shell.docs.tsx apps/docs/components/demos/settings-shell-demo.tsx
git -c user.name="weeeha" -c user.email="1083934+weeeha@users.noreply.github.com" commit -m "feat(shell-fidelity): settings-shell status and loading"
```

---

### Task 15: `notebook-shell` (O13), including `headerActions`

**Files:**

- Modify: `apps/docs/registry/super-ai/notebook-shell.tsx`
- Modify: `apps/docs/registry/super-ai/notebook-shell.test.tsx`
- Modify: `apps/storybook/src/stories/super-ai/NotebookShell.stories.tsx`
- Modify: `apps/docs/content/components/notebook-shell.docs.tsx`
- Modify: `apps/docs/components/demos/notebook-shell-demo.tsx`
- Derived, committed: `apps/docs/registry/super-ai/notebook-shell.meta.json`,
  `apps/docs/public/llms/components/notebook-shell.md`

**Interfaces (beyond the shared ones):** produces `headerActions?: React.ReactNode` on
`NotebookShellProps` and the wrapper `data-slot="notebook-shell-header"`. Nothing reads it.

**Twin targets** (loaded, 1200×900, from `Grounded`): sources 0,0,288,900 `frame` · chat
288,0,592,709 `frame` · composer 288,709,592,192 `frame` · studio-outputs 880,0,320,900
`frame`. D1 here measures 160px with context chips (126px without); the composer region
adds 32px.

- [ ] **Step 1: Write the failing tests**

Add `import { expectShellLoadedContract, expectShellLoadingContract } from "@/lib/test-utils";`
to `notebook-shell.test.tsx`, then append:

```tsx
describe("NotebookShell header actions, status and loading", () => {
  const root = (container: HTMLElement) => container.querySelector('[data-slot="notebook-shell"]')!;

  it("marks every region's box and renders no header bar and no status by default", () => {
    const { container } = render(<NotebookShell />);
    expectShellLoadedContract(root(container), { name: "notebook-shell", regions: REGIONS });
    expect(container.querySelector('[data-slot="notebook-shell-header"]')).toBeNull();
    expect(container.querySelector('[data-slot="notebook-shell-status"]')).toBeNull();
  });

  it("renders headerActions in a bar at the top of the chat column", () => {
    const { container } = render(<NotebookShell headerActions={<button type="button">Account</button>} />);
    const header = container.querySelector('[data-slot="notebook-shell-header"]')!;
    expect(within(header as HTMLElement).getByRole("button", { name: "Account" })).toBeInTheDocument();
    expect(header.nextElementSibling).toHaveAttribute("data-region", "chat");
  });

  it("renders status at the top of the chat column, under the header bar when there is one", () => {
    const { container } = render(
      <NotebookShell headerActions={<button type="button">Account</button>} status={<p>Reconnecting.</p>} />,
    );
    const status = container.querySelector('[data-slot="notebook-shell-status"]')!;
    expect(status).toHaveTextContent("Reconnecting.");
    expect(status.previousElementSibling).toHaveAttribute("data-slot", "notebook-shell-header");
    expect(status.nextElementSibling).toHaveAttribute("data-region", "chat");
  });

  it("draws every region as a skeleton, busy and with nothing to focus, while loading", () => {
    const { container } = render(
      <NotebookShell
        loading
        headerActions={<button type="button">Account</button>}
        sourcesAction={<button type="button">Add source</button>}
        contextChips={[{ id: "c1", kind: "file", label: "Q3-report.pdf" }]}
      />,
    );
    expectShellLoadingContract(root(container), { name: "notebook-shell", regions: REGIONS });
    expect(container.querySelector('[data-slot="source-panel"]')).toBeNull();
    expect(container.querySelector('[data-slot="media-prompt-bar"]')).toBeNull();
    expect(container.querySelector('[data-slot="notebook-shell-header"]')).not.toBeNull();
  });

  it("keeps status while loading", () => {
    const { container } = render(<NotebookShell loading status={<p>Reconnecting</p>} />);
    expect(container.querySelector('[data-slot="notebook-shell-status"]')).toHaveTextContent("Reconnecting");
  });
});
```

- [ ] **Step 2: Run them to see them fail**

```bash
cd apps/docs && pnpm vitest run registry/super-ai/notebook-shell.test.tsx
```

Expected: the five new tests FAIL; every existing test still passes.

- [ ] **Step 3: Props, imports, the header bar, the status strip and the loaded markers**

In `notebook-shell.tsx`:

1. Add:

```tsx
import {
  ShellLoadingLabel,
  ShellSkeletonBlock,
  ShellSkeletonLines,
  ShellSkeletonRegion,
  ShellSkeletonRows,
  ShellSkeletonTiles,
} from "@/registry/super-ai/shell-skeleton";
```

2. At the end of `NotebookShellProps`, after `outputsEmpty`, add:

```tsx
  /**
   * Host chrome for the notebook: an account menu, a notifications control.
   * Renders in a bar at the top of the chat column, and only when given, so a
   * notebook without it is unchanged. The one generic slot this shell has.
   */
  headerActions?: React.ReactNode;
  /**
   * A message about the whole surface: offline, reconnecting, a failed save, an
   * expired session, a rate limit. Renders at the top of the chat column, under
   * `headerActions`' bar when there is one, and only when given. Pass M6
   * `rate-limit-banner` or the vendored `Alert`; the shell adds no live region, so
   * the component you pass carries its own role. Still renders while `loading`.
   */
  status?: React.ReactNode;
  /**
   * First paint, before the notebook has loaded. Every region draws a skeleton at
   * the size it will take, the root carries `aria-busy`, and nothing the shell
   * composes is mounted, so there is nothing to focus or click. The bar for
   * `headerActions` keeps its place, without its controls, when it is passed.
   */
  loading?: boolean;
```

3. In the parameter list, directly before `className,`, add `headerActions,`, `status,`
   and `loading = false,`.

4. After `const jumpedSource = ...;` add:

```tsx
const headerBar = headerActions ? (
  <div
    data-slot="notebook-shell-header"
    className="flex h-12 shrink-0 items-center justify-end gap-2 border-b px-3"
  >
    {headerActions}
  </div>
) : null;

const statusStrip = status ? (
  <div data-slot="notebook-shell-status" className="shrink-0 border-b px-3 py-2">
    {status}
  </div>
) : null;
```

5. Add `data-loading-region` beside each loaded region's `data-region`: the `sources`
   section, the `Conversation` (`"chat"`), the `composer` div and the `studio-outputs`
   section.

6. Insert `{headerBar}` then `{statusStrip}` as the first two children of
   `<div className="flex min-h-96 min-w-0 flex-1 flex-col lg:h-full lg:min-h-0">`,
   before the `{/* Pane two.` comment.

- [ ] **Step 4: The loading branch**

Directly before the component's `return (`, after `statusStrip`, add:

```tsx
if (loading) {
  return (
    <div
      data-slot="notebook-shell"
      aria-busy="true"
      className={cn(
        "bg-background text-foreground flex h-full min-h-0 w-full flex-col overflow-hidden lg:flex-row",
        className,
      )}
      {...props}
    >
      <ShellLoadingLabel />
      <ShellSkeletonRegion
        region="sources"
        className="bg-card flex shrink-0 flex-col gap-3 border-b p-3 lg:h-full lg:w-72 lg:border-e lg:border-b-0"
      >
        <div className="flex h-7 items-center justify-between">
          <ShellSkeletonBlock className="h-4 w-20" />
          <ShellSkeletonBlock className="h-7 w-24" />
        </div>
        <ShellSkeletonRows count={6} />
      </ShellSkeletonRegion>
      <div className="flex min-h-96 min-w-0 flex-1 flex-col lg:h-full lg:min-h-0">
        {headerActions ? (
          <div
            data-slot="notebook-shell-header"
            className="flex h-12 shrink-0 items-center justify-end gap-2 border-b px-3"
          >
            <ShellSkeletonBlock className="h-8 w-24" />
          </div>
        ) : null}
        {statusStrip}
        <ShellSkeletonRegion region="chat" className="relative min-h-0 flex-1 overflow-hidden">
          <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-6">
            <ShellSkeletonBlock className="ms-auto h-10 w-2/3 rounded-2xl" />
            <ShellSkeletonLines count={5} />
          </div>
        </ShellSkeletonRegion>
        <ShellSkeletonRegion region="composer" className="bg-background shrink-0 border-t px-4 pb-2">
          <div className="mx-auto w-full max-w-2xl">
            <ShellSkeletonBlock
              className={cn(
                "w-full rounded-t-2xl rounded-b-none",
                contextChips.length > 0 ? "h-40" : "h-31.5",
              )}
            />
            <div className="flex justify-center px-2 pt-1.5">
              <ShellSkeletonBlock className="h-4 w-56" />
            </div>
          </div>
        </ShellSkeletonRegion>
      </div>
      <ShellSkeletonRegion
        region="studio-outputs"
        className="bg-card flex shrink-0 flex-col gap-4 border-t p-3 lg:h-full lg:w-80 lg:border-t-0 lg:border-s"
      >
        <ShellSkeletonBlock className="h-5 w-16" />
        <ShellSkeletonTiles count={2} className="grid-cols-2" tileClassName="aspect-auto h-25" />
        <ShellSkeletonTiles count={2} tileClassName="aspect-auto h-57" />
      </ShellSkeletonRegion>
    </div>
  );
}
```

The sources and studio panes paint `bg-card`, not `bg-muted`, so the `bg-muted` blocks on
them stay visible and no muted text sits on a muted surface.

- [ ] **Step 5: Run the unit tests to see them pass**

```bash
cd apps/docs && pnpm vitest run registry/super-ai/notebook-shell.test.tsx
```

Expected: PASS, every test in the file.

- [ ] **Step 6: The `Loading`, `Status` and `HeaderActions` stories**

In `NotebookShell.stories.tsx` add:

```tsx
import { DemoNotifications } from "@/components/demos/demo-notifications";
import { expectLoadingTwin, LoadingTwin } from "@/lib/loading-twin";
import { AccountMenu } from "@/registry/super-ai/account-menu";
import { RateLimitBanner } from "@/registry/super-ai/rate-limit-banner";
```

Append at the end of the file:

```tsx
/**
 * First paint, before the notebook has loaded. The sources pane, the chat, the
 * composer and the studio pane each draw a skeleton at the size they will take,
 * the root is marked busy, and nothing inside it takes focus. The play renders the
 * loaded notebook in the same frame and fails if a skeleton sits more than 8px
 * from where its region lands.
 */
export const Loading: Story = {
  args: FULL_ARGS,
  render: (args) => <LoadingTwin>{(loading) => <NotebookShell {...args} loading={loading} />}</LoadingTwin>,
  play: async ({ canvasElement }) => {
    await expectLoadingTwin(canvasElement, "notebook-shell", {
      sources: "frame",
      chat: "frame",
      composer: "frame",
      "studio-outputs": "frame",
    });
  },
};

/**
 * The plan's limit on answers is reached. M6 sits at the top of the chat column,
 * above the conversation and the composer it holds up, and counts down to the
 * reset while the sources and the studio pane stay usable.
 */
export const Status: Story = {
  args: {
    ...FULL_ARGS,
    status: (
      <RateLimitBanner cause="your-limit" resource="Answers from your sources" remainingSeconds={540} />
    ),
  },
  play: async ({ canvasElement }) => {
    const status = canvasElement.querySelector<HTMLElement>('[data-slot="notebook-shell-status"]');
    await expect(status).not.toBeNull();
    await expect(status!.nextElementSibling).toHaveAttribute("data-region", "chat");
    await expect(within(status!).getByText("Answers from your sources")).toBeVisible();
  },
};

/**
 * The host's own chrome, a notifications control and the account menu, in the bar
 * `headerActions` adds at the top of the chat column. The bar exists only when the
 * prop is passed, so a notebook without it is unchanged.
 */
export const HeaderActions: Story = {
  args: {
    ...FULL_ARGS,
    headerActions: (
      <div className="flex items-center gap-1">
        <DemoNotifications />
        <AccountMenu
          user={{ name: "Ada Lovelace", email: "ada@northwind.example" }}
          theme="system"
          onThemeChange={fn()}
          background="default"
          onBackgroundChange={fn()}
          onSignOut={fn()}
        />
      </div>
    ),
  },
  play: async ({ canvasElement }) => {
    const header = canvasElement.querySelector<HTMLElement>('[data-slot="notebook-shell-header"]');
    await expect(header).not.toBeNull();
    await expect(header!.nextElementSibling).toHaveAttribute("data-region", "chat");
    await expect(
      within(header!).getByRole("button", { name: "Account menu for Ada Lovelace" }),
    ).toBeVisible();
    await expect(within(header!).getByRole("button", { name: "Notifications, 2 unread" })).toBeVisible();
  },
};
```

- [ ] **Step 7: Run the story file**

```bash
cd apps/storybook && pnpm exec vitest run --project storybook src/stories/super-ai/NotebookShell.stories.tsx
```

Expected: PASS, every story in the file, each under axe. If the twin fails on a region,
fix the skeleton's size classes against the twin targets above, never the kind, the
tolerance or the fixture.

- [ ] **Step 8: The guidance module**

In `apps/docs/content/components/notebook-shell.docs.tsx`:

1. Append to the end of the `usage` string:

```text
 `headerActions` puts host chrome, such as an account menu or a notifications control, in a bar at the top of the chat column, and the bar renders only when you pass it. Pass `status` for a message about the whole surface (offline, reconnecting, a failed save, an expired session, a rate limit): it renders at the top of the chat column, only when given, and holds M6 or the vendored Alert. Pass `loading` for first paint: every region draws a skeleton at its loaded size, the root is marked busy, and nothing is mounted that could take focus.
```

2. Append to `anatomy`:

```tsx
    {
      slot: "notebook-shell-header",
      note: "A bar at the top of the chat column for `headerActions`, mounted only when it is passed.",
    },
    {
      slot: "notebook-shell-status",
      note: "At the top of the chat column, under the header bar when there is one, only when `status` is passed. Holds M6 or the vendored Alert; the shell adds no live region of its own.",
    },
    {
      slot: "shell-skeleton-region",
      note: "One per region while `loading`: hidden from assistive tech and sized like the loaded region. It carries `data-loading-region`, as does each loaded region's box, which is what the loading twin measures.",
    },
```

3. Append to `dos`:

```tsx
    {
      text: "Mount the command palette once, at the root of your app, and keep it out of the shell: it is not a shell slot, and a palette mounted in each shell binds its shortcut once per surface.",
    },
```

4. Append to `accessibility.keyboard`:

```tsx
      "`headerActions` sits in a bar at the top of the chat column, so its controls come after the sources pane in the tab order and before the conversation.",
      "While `loading`, the shell mounts none of its controls, so there is no tab stop inside it until the data arrives; a control you pass in `status` is the only one.",
```

5. Append to `accessibility.screenReader`:

```tsx
      "While `loading`, the root carries `aria-busy` and every skeleton is hidden from assistive tech, so a screen reader finds one visually hidden line, Loading, plus anything you pass in `status`.",
      "The shell puts no live region around `status`. M6 is a note that announces its countdown politely and the vendored Alert defaults to an assertive alert, so choose the one whose announcement fits the message. Inside a busy root, a screen reader may hold an announcement until `loading` clears.",
```

6. Append to `pitfalls`:

```tsx
    "`headerActions` adds a 48px bar above the chat only when it is passed, so the chat pane is shorter in a notebook that has one. While `loading` the bar keeps its place, with a placeholder instead of your controls.",
    "The composer skeleton reserves D1's context-chip row only when `contextChips` is non-empty. Pass the chips while loading if the loaded composer will show them, or the composer grows by that row when the data arrives.",
```

- [ ] **Step 9: The demo: the account menu and notifications in the new slot**

In `apps/docs/components/demos/notebook-shell-demo.tsx`, add:

```tsx
import { DemoNotifications } from "@/components/demos/demo-notifications";
import { AccountMenu } from "@/registry/super-ai/account-menu";
```

and add this prop to `<NotebookShell`, directly after `className="h-[42rem]"`:

```tsx
      headerActions={
        <div className="flex items-center gap-1">
          <DemoNotifications />
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

This fills the one gap the spec's slot table (§2) records for the notebook: it had no slot
an account menu could go in.

- [ ] **Step 10: Verify**

```bash
cd apps/docs
pnpm vitest run registry/super-ai/notebook-shell.test.tsx
pnpm reconcile:deps notebook-shell
pnpm check:tokens
pnpm exec tsx scripts/check-citations.mts
pnpm contract:emit
pnpm vitest run scripts/lib/contract-emit.test.ts scripts/lib/story-coverage.test.ts
cd ../..
pnpm typecheck
pnpm lint
pnpm exec prettier --write apps/docs/registry/super-ai/notebook-shell.tsx apps/docs/registry/super-ai/notebook-shell.test.tsx apps/storybook/src/stories/super-ai/NotebookShell.stories.tsx apps/docs/content/components/notebook-shell.docs.tsx apps/docs/components/demos/notebook-shell-demo.tsx
```

Expected: every command exits 0; `reconcile:deps notebook-shell` prints
`1 item(s) reconciled, no drift.` (the story and the demo import `account-menu`; the
shell does not).

- [ ] **Step 11: Commit**

```bash
git checkout -- apps/docs/index/components.toon apps/docs/public/llms.txt apps/docs/public/llms-full.txt
git add apps/docs/registry/super-ai/notebook-shell.tsx apps/docs/registry/super-ai/notebook-shell.test.tsx apps/docs/registry/super-ai/notebook-shell.meta.json apps/docs/public/llms/components/notebook-shell.md apps/storybook/src/stories/super-ai/NotebookShell.stories.tsx apps/docs/content/components/notebook-shell.docs.tsx apps/docs/components/demos/notebook-shell-demo.tsx
git -c user.name="weeeha" -c user.email="1083934+weeeha@users.noreply.github.com" commit -m "feat(shell-fidelity): notebook-shell headerActions, status and loading"
```

---

### Task 16: `auth-shell` (O14)

**Files:**

- Modify: `apps/docs/registry/super-ai/auth-shell.tsx`
- Modify: `apps/docs/registry/super-ai/auth-shell.test.tsx`
- Modify: `apps/storybook/src/stories/super-ai/AuthShell.stories.tsx`
- Modify: `apps/docs/content/components/auth-shell.docs.tsx`
- Derived, committed: `apps/docs/registry/super-ai/auth-shell.meta.json`,
  `apps/docs/public/llms/components/auth-shell.md`

No demo edit: a sign-in page has no account chrome, correctly.

**Twin targets** (loaded, 1200×900, from `SignIn`): marketing-panel 184,300,388,370
`frame` · provider-rows 612,284,420,176 `frame` · email-fallback 612,476,420,123 `frame` ·
legal-footer 612,653,420,33 `frame`. L6's card is 896×504 and vertically centred, so every
region's top depends on the card's total height: 16px padding, a 54px header (22px title,
12px gap, 20px description), 16px, the 402px content grid, 16px. The content column is
three 56px provider rows 4px apart, 16px, the email fallback (a divider, a 59px field, 12px,
a 32px button), 16px, the 22px mode switch, 16px, the 33px legal footer.

- [ ] **Step 1: Write the failing tests**

Add `import { expectShellLoadedContract, expectShellLoadingContract } from "@/lib/test-utils";`
to `auth-shell.test.tsx`, then append:

```tsx
describe("AuthShell status and loading", () => {
  const root = (container: HTMLElement) => container.querySelector('[data-slot="auth-shell"]')!;

  it("marks every region's box and renders no status by default", () => {
    const { container } = render(<AuthShell />);
    expectShellLoadedContract(root(container), { name: "auth-shell", regions: REGIONS });
    expect(container.querySelector('[data-slot="auth-shell-status"]')).toBeNull();
  });

  it("renders status at the top of the form column, above the providers", () => {
    const { container } = render(<AuthShell status={<p>Your session expired.</p>} />);
    const status = container.querySelector('[data-slot="auth-shell-status"]')!;
    expect(status).toHaveTextContent("Your session expired.");
    expect(status.nextElementSibling).toHaveAttribute("data-region", "provider-rows");
  });

  it("draws every region as a skeleton, busy and with nothing to focus, while loading", () => {
    const { container } = render(
      <AuthShell
        loading
        providers={[{ id: "google", name: "Google" }]}
        marketing={<a href="/pricing">See pricing</a>}
        onModeChange={() => {}}
      />,
    );
    expectShellLoadingContract(root(container), { name: "auth-shell", regions: REGIONS });
    expect(container.querySelector('[data-slot="onboarding-wizard"]')).toBeNull();
    expect(container.querySelector('[data-slot="entity-row"]')).toBeNull();
    expect(screen.getByText("Sign in")).toBeInTheDocument();
  });

  it("keeps status while loading", () => {
    const { container } = render(<AuthShell loading status={<p>Reconnecting</p>} />);
    expect(container.querySelector('[data-slot="auth-shell-status"]')).toHaveTextContent("Reconnecting");
  });
});
```

The title is not a region and is not data: it is the mode's own copy, so a loading sign-in
page still says what it is.

- [ ] **Step 2: Run them to see them fail**

```bash
cd apps/docs && pnpm vitest run registry/super-ai/auth-shell.test.tsx
```

Expected: the four new tests FAIL; every existing test still passes.

- [ ] **Step 3: Props, imports, the status slot and the loaded markers**

In `auth-shell.tsx`:

1. Add:

```tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ShellLoadingLabel,
  ShellSkeletonBlock,
  ShellSkeletonLines,
  ShellSkeletonRegion,
} from "@/registry/super-ai/shell-skeleton";
```

`card` is already in this shell's `shadcn` list (Task 3).

2. At the end of `AuthShellProps`, after `legal`, add:

```tsx
  /**
   * A message about the whole surface: offline, an expired session, a rate limit.
   * Renders at the top of the form column, above the providers, and only when
   * given. Pass M6 `rate-limit-banner` or the vendored `Alert`; the shell adds no
   * live region, so the component you pass carries its own role. Still renders
   * while `loading`.
   */
  status?: React.ReactNode;
  /**
   * First paint, before the sign-in options have loaded. The title and description
   * stay, since they are the mode's own copy; every region draws a skeleton at the
   * size it will take, the root carries `aria-busy`, and nothing the shell composes
   * is mounted, so there is nothing to focus or click.
   */
  loading?: boolean;
```

3. In the parameter list, directly before `className,`, add `status,` and `loading = false,`.

4. After `const emailId = React.useId();` add:

```tsx
const statusNode = status ? <div data-slot="auth-shell-status">{status}</div> : null;
```

5. Add `data-loading-region` beside each loaded region's `data-region`: the
   `marketing-panel`, `provider-rows`, `email-fallback` and `legal-footer` divs.

6. In `step.content`, make `{statusNode}` the first child of
   `<div className="flex flex-col gap-4">`, before `{providerRows}`.

- [ ] **Step 4: The loading branch**

Directly before the component's final `return (` (after `const step = ...`), add:

```tsx
if (loading) {
  // L6 is not mounted: its step navigation is hidden with a class rather than
  // removed, and a loading shell mounts nothing to click. The vendored Card it
  // is built on draws the same frame, so the card lands where L6's will.
  return (
    <div
      data-slot="auth-shell"
      data-mode={mode}
      aria-busy="true"
      className={cn("bg-background text-foreground flex h-full w-full overflow-hidden p-4 sm:p-8", className)}
      {...props}
    >
      <ShellLoadingLabel />
      <Card className="m-auto w-full max-w-4xl">
        <CardHeader className="gap-3">
          <CardTitle>{title ?? copy.title}</CardTitle>
          <CardDescription>{description ?? copy.description}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <div className="flex min-w-0 flex-col gap-4">
            {statusNode}
            <ShellSkeletonRegion region="provider-rows" className="flex flex-col gap-1">
              {Array.from({ length: providers.length > 0 ? providers.length : 3 }, (_, index) => (
                <ShellSkeletonBlock key={index} className="h-14 w-full rounded-lg" />
              ))}
            </ShellSkeletonRegion>
            <ShellSkeletonRegion region="email-fallback" className="flex flex-col gap-4">
              <div className="border-t" />
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-2">
                  <ShellSkeletonBlock className="h-5 w-12" />
                  <ShellSkeletonBlock className="h-8 w-full" />
                </div>
                <ShellSkeletonBlock className="h-8 w-full" />
              </div>
            </ShellSkeletonRegion>
            {onModeChange ? <ShellSkeletonBlock className="h-5.5 w-56" /> : null}
            <ShellSkeletonRegion region="legal-footer" className="border-t pt-4">
              <ShellSkeletonBlock className="h-4 w-3/4" />
            </ShellSkeletonRegion>
          </div>
          <div
            className={cn(
              "flex flex-col justify-center gap-2 rounded-lg border p-4",
              marketingSide === "start" && "md:order-first",
            )}
          >
            <ShellSkeletonRegion
              region="marketing-panel"
              className="flex h-full flex-col justify-center gap-3"
            >
              <ShellSkeletonBlock className="size-5" />
              <ShellSkeletonLines count={2} />
              <ShellSkeletonBlock className="h-4 w-1/2" />
            </ShellSkeletonRegion>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

The pitch pane is outlined rather than painted: L6 paints it `bg-muted`, and a `bg-muted`
skeleton on a `bg-muted` pane would not show.

- [ ] **Step 5: Run the unit tests to see them pass**

```bash
cd apps/docs && pnpm vitest run registry/super-ai/auth-shell.test.tsx
```

Expected: PASS, every test in the file.

- [ ] **Step 6: The `Loading` and `Status` stories**

In `AuthShell.stories.tsx`, add `Clock` to the `lucide-react` import, and add:

```tsx
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { expectLoadingTwin, LoadingTwin } from "@/lib/loading-twin";
```

Append at the end of the file:

```tsx
/**
 * First paint, before the sign-in options have loaded. The title and description
 * stay, because they are the page's own words; the pitch pane, the provider rows,
 * the email form and the legal line each draw a skeleton at the size they will
 * take, the root is marked busy, and nothing inside it takes focus. The card is
 * centred, so every region's top depends on the card's height; the play renders
 * the loaded page in the same frame and fails if a skeleton sits more than 8px
 * from where its region lands.
 */
export const Loading: Story = {
  args: FULL_ARGS,
  render: (args) => <LoadingTwin>{(loading) => <AuthShell {...args} loading={loading} />}</LoadingTwin>,
  play: async ({ canvasElement }) => {
    await expectLoadingTwin(canvasElement, "auth-shell", {
      "marketing-panel": "frame",
      "provider-rows": "frame",
      "email-fallback": "frame",
      "legal-footer": "frame",
    });
  },
};

/**
 * The person was sent here because their session expired. The message sits at the
 * top of the form column, above the providers that clear it, and says that signing
 * in again resumes the work. The vendored Alert keeps its own role, an assertive
 * alert, because it explains why the page appeared at all.
 */
export const Status: Story = {
  args: {
    ...FULL_ARGS,
    status: (
      <Alert>
        <Clock aria-hidden />
        <AlertTitle>Your session expired</AlertTitle>
        <AlertDescription>Sign in again to pick up where you left off.</AlertDescription>
      </Alert>
    ),
  },
  play: async ({ canvasElement }) => {
    const status = canvasElement.querySelector<HTMLElement>('[data-slot="auth-shell-status"]');
    await expect(status).not.toBeNull();
    await expect(status!.nextElementSibling).toHaveAttribute("data-region", "provider-rows");
    await expect(within(status!).getByText("Your session expired")).toBeVisible();
  },
};
```

- [ ] **Step 7: Run the story file**

```bash
cd apps/storybook && pnpm exec vitest run --project storybook src/stories/super-ai/AuthShell.stories.tsx
```

Expected: PASS, every story in the file, each under axe. If the twin fails on a region,
fix the skeleton's size classes against the twin targets above, never the kind, the
tolerance or the fixture.

- [ ] **Step 8: The guidance module**

In `apps/docs/content/components/auth-shell.docs.tsx`:

1. Append to the end of the `usage` string:

```text
 Pass `status` for a message about the whole surface (offline, an expired session, a rate limit): it renders at the top of the form column, above the providers, only when given, and holds M6 or the vendored Alert. Pass `loading` for first paint: the title stays, every region draws a skeleton at its loaded size, the root is marked busy, and nothing is mounted that could take focus.
```

2. Append to `anatomy`:

```tsx
    {
      slot: "auth-shell-status",
      note: "At the top of the form column, only when `status` is passed. Holds M6 or the vendored Alert; the shell adds no live region of its own.",
    },
    {
      slot: "shell-skeleton-region",
      note: "One per region while `loading`: hidden from assistive tech and sized like the loaded region. It carries `data-loading-region`, as does each loaded region's box, which is what the loading twin measures.",
    },
```

3. Append to `dos`:

```tsx
    {
      text: "Mount the command palette once, at the root of your app, and keep it out of the shell: it is not a shell slot, and a palette mounted in each shell binds its shortcut once per surface.",
    },
```

4. Append to `accessibility.keyboard`:

```tsx
      "While `loading`, the shell mounts none of its controls, so there is no tab stop inside it until the data arrives; a control you pass in `status` is the only one.",
```

5. Append to `accessibility.screenReader`:

```tsx
      "While `loading`, the root carries `aria-busy` and every skeleton is hidden from assistive tech, so a screen reader finds the title, the description and one visually hidden line, Loading, plus anything you pass in `status`.",
      "The shell puts no live region around `status`. M6 is a note that announces its countdown politely and the vendored Alert defaults to an assertive alert, so choose the one whose announcement fits the message. Inside a busy root, a screen reader may hold an announcement until `loading` clears.",
```

6. Append to `pitfalls`:

```tsx
    "While `loading`, L6 is not mounted, because its step navigation is hidden with a class rather than removed and a loading shell mounts nothing to click. The skeleton composes the vendored Card L6 is built on, with the real title and description, so the card lands where L6's will; restyle one and restyle the other.",
    "The card is centred on the page, so every region's position depends on the card's height. The skeleton draws three provider rows unless `providers` is passed, and a mode-switch line only when `onModeChange` is; pass both while loading if the loaded page will show them.",
```

- [ ] **Step 9: Verify**

```bash
cd apps/docs
pnpm vitest run registry/super-ai/auth-shell.test.tsx
pnpm reconcile:deps auth-shell
pnpm check:tokens
pnpm exec tsx scripts/check-citations.mts
pnpm contract:emit
pnpm vitest run scripts/lib/contract-emit.test.ts scripts/lib/story-coverage.test.ts
cd ../..
pnpm typecheck
pnpm lint
pnpm exec prettier --write apps/docs/registry/super-ai/auth-shell.tsx apps/docs/registry/super-ai/auth-shell.test.tsx apps/storybook/src/stories/super-ai/AuthShell.stories.tsx apps/docs/content/components/auth-shell.docs.tsx
```

Expected: every command exits 0; `reconcile:deps auth-shell` prints
`1 item(s) reconciled, no drift.` (it now sees `card` imported, matching Task 3's list).

- [ ] **Step 10: Commit**

```bash
git checkout -- apps/docs/index/components.toon apps/docs/public/llms.txt apps/docs/public/llms-full.txt
git add apps/docs/registry/super-ai/auth-shell.tsx apps/docs/registry/super-ai/auth-shell.test.tsx apps/docs/registry/super-ai/auth-shell.meta.json apps/docs/public/llms/components/auth-shell.md apps/storybook/src/stories/super-ai/AuthShell.stories.tsx apps/docs/content/components/auth-shell.docs.tsx
git -c user.name="weeeha" -c user.email="1083934+weeeha@users.noreply.github.com" commit -m "feat(shell-fidelity): auth-shell status and loading"
```

---

### Task 17: Integrate, emit once, prove on Linux (controller)

**Files:**

- Derived and committed: every `apps/docs/registry/super-ai/<shell>.meta.json`,
  `apps/docs/public/llms/**`, `apps/docs/public/llms.txt`, `apps/docs/public/llms-full.txt`,
  `apps/docs/index/components.toon`, and `apps/docs/content/system/facts.json` if it moved
- Must not change: `apps/docs/scripts/lib/story-coverage.baseline.json`,
  `apps/docs/scripts/lib/contract-coverage.baseline.json`, the a11y exclusion list

**Interfaces:**

- Consumes: the thirteen shell commits (Task 4 already on the branch; Tasks 5 to 16 on
  their agent branches, which share this repository's refs).
- Produces: one branch where `pnpm check:contract` is green again and every contract is
  derived from its guidance module.

- [ ] **Step 1: Bring the shell commits in, in task order**

For Tasks 5 to 16, in order:

```bash
git log --oneline -1 <agent-branch-for-task-N>
git cherry-pick <that-sha>
```

The files are disjoint, so a conflict is unexpected. If one appears in a derived file (a
`.meta.json` or an `llms/components/*.md`), take the incoming side with
`git checkout --theirs <path>`, `git add <path>`, `git cherry-pick --continue`: Step 3
rewrites all of them. A conflict in any other file stops the integration; read both sides
before choosing.

- [ ] **Step 2: Reconcile, then the contract gate**

```bash
cd apps/docs
pnpm reconcile:deps
pnpm check:contract
```

Expected: `reconcile:deps` reports no drift, and `check:contract` exits 0 for the first
time since Task 3.

- [ ] **Step 3: Emit once, and hold the ledgers**

```bash
pnpm contract:emit
pnpm facts:emit
pnpm story-coverage:baseline
pnpm contract-coverage:baseline
git diff --exit-code -- scripts/lib/story-coverage.baseline.json scripts/lib/contract-coverage.baseline.json
pnpm test
```

Expected: the `git diff` exits 0 (no new case obligation: `Loading`, `Status` and
`HeaderActions` are extra exports, and no module declared a variant); `pnpm test` passes.
A growing baseline stops the integration.

- [ ] **Step 4: Registry and the whole tree**

```bash
pnpm build:registry
node -e 'for (const n of ["home-shell","auth-shell"]) { const r = require(`./public/r/${n}.json`); console.log(n, r.registryDependencies.filter((d) => /shell-skeleton|^card$/.test(d))) }'
cd ../..
pnpm typecheck
pnpm lint
pnpm format:check
```

Expected: `home-shell [ '<registry url>/r/shell-skeleton.json' ]` and
`auth-shell [ 'card', '<registry url>/r/shell-skeleton.json' ]`; the three root commands
exit 0. If `format:check` fails straight after a format, run the format again before
assuming anything else (`CLAUDE.md`'s note on converging tables).

- [ ] **Step 5: The thirteen story files, locally and in the CI image**

```bash
cd apps/storybook
rm -rf node_modules/.cache/storybook
pnpm exec vitest run --project storybook src/stories/super-ai/*Shell.stories.tsx
cd ../..
./scripts/linux-gate.sh src/stories/super-ai/HomeShell.stories.tsx src/stories/super-ai/ChatShell.stories.tsx src/stories/super-ai/StudioShell.stories.tsx src/stories/super-ai/TimelineShell.stories.tsx src/stories/super-ai/GenerationShell.stories.tsx src/stories/super-ai/LibraryShell.stories.tsx src/stories/super-ai/ExploreShell.stories.tsx src/stories/super-ai/ArtifactShell.stories.tsx src/stories/super-ai/RecordsShell.stories.tsx src/stories/super-ai/DocsShell.stories.tsx src/stories/super-ai/SettingsShell.stories.tsx src/stories/super-ai/NotebookShell.stories.tsx src/stories/super-ai/AuthShell.stories.tsx
```

Run the cache removal only with no Storybook dev server up from this worktree. Expected:
both runs pass. The Linux run is the one that counts (D21): a twin that passes on macOS
and fails in the image means a loaded region's height comes from text, and the fix is the
skeleton class that mirrors it, never the kind. If Docker is not running, say so in the
report; CI is then the first Linux run.

- [ ] **Step 6: Commit the derived output**

```bash
git add apps/docs/registry/super-ai/*.meta.json apps/docs/public/llms apps/docs/public/llms.txt apps/docs/public/llms-full.txt apps/docs/index/components.toon apps/docs/content/system/facts.json
git -c user.name="weeeha" -c user.email="1083934+weeeha@users.noreply.github.com" commit -m "chore(shell-fidelity): emit contracts once after the U4 wave"
```

---

### Task 18: Record, audit, gate, verify (controller)

**Files:**

- Modify: `docs/CONTINUE.md` (a new §8 subsection)
- Modify: `docs/superpowers/specs/2026-09-24-shell-fidelity-design.md` (§9 and the changelog)

- [ ] **Step 1: Write down what U4 leaves open**

In `docs/CONTINUE.md`, insert after the "Added by the U3 case-story and slot wave
(2026-09-26)" subsection and before `## 9. What each wave found`:

```markdown
### Added by the U4 status and loading wave (2026-09-26)

Every shell takes `status` (a slot under the topbar, or at the top of the content column)
and `loading` (one boolean, proven per shell by the loading twin), and `notebook-shell`
takes `headerActions`. The contract is
[`design-system/block-build-brief.md`](design-system/block-build-brief.md), "Status and
loading"; the plan is
[`superpowers/plans/2026-09-26-shell-fidelity-u4.md`](superpowers/plans/2026-09-26-shell-fidelity-u4.md).
What stays open:

- **U3's four prop gaps stay parked.** A `promo` prop on O10 and O11, the account menu as
  the trailing header item in O6 and O10, and a chrome slot on O4 and O8. The spec's U4
  did not list them, and each adds a prop to a shell.
- **O11's demo has no host chrome yet.** Its account menu and notifications control go in
  with U3's Task 11, which waits for `claude/docs-shell-rail-brand`.
- **Rows are not `SidebarMenuSkeleton`.** The spec named it. It picks a random bar width
  in state, which fails hydration, and importing it puts the vendored sidebar on eight
  shells that do not use B1. `ShellSkeletonRows` keeps its 32px geometry with fixed widths.
- **The twin proves one fixture at one viewport.** Each shell's `Loading` story checks its
  full fixture at 1200×900. Rows mirrored for props no fixture passes (a library or
  artifact header with `headerActions`, a chat or notebook composer without context chips)
  are class arithmetic, not measurements.
- **A region-level wait goes through the empty-override slots.** Chat's history-pending
  case is `empty` plus `ShellSkeletonLines`; no shell has per-region loading.
```

Then add one bullet per finding the shell agents reported that is not fixed on the branch.

- [ ] **Step 2: Close the spec's two open questions**

In the spec's §9, append to the `loading` bullet: `Settled by the U4 plan: one boolean;
a region-level wait uses that region's empty-override slot.` Append to the `status`
bullet: `Settled by the U4 plan: a slot.` (Write what Nick confirmed in Task 0, if he
overruled either.) Add to the changelog:

```markdown
- 2026-09-26: U4 planned (`superpowers/plans/2026-09-26-shell-fidelity-u4.md`): `status` is a slot, `loading` one boolean, and the loading twin compares each region's edges by what decides them.
```

```bash
pnpm exec prettier --write docs/CONTINUE.md docs/superpowers/specs/2026-09-24-shell-fidelity-design.md
git add docs/CONTINUE.md docs/superpowers/specs/2026-09-24-shell-fidelity-design.md
git -c user.name="weeeha" -c user.email="1083934+weeeha@users.noreply.github.com" commit -m "docs(shell-fidelity): what U4 leaves open, and the spec's two questions settled"
```

- [ ] **Step 3: The unslop audit**

Run the repo's `unslop` skill (`.claude/skills/unslop/`), audit phase, over the `Loading`
and `Status` stories of four shells (home, studio, settings, auth) and the chat demo's
topbar. Fix what it finds inside this unit's files; record anything larger in the §8
subsection above.

- [ ] **Step 4: The full gate run**

Check the smoke port first:

```bash
lsof -nP -iTCP:3100 -sTCP:LISTEN
```

If the branch carries PR #75 (it does when it was cut from `main` after PR 78 merged):

```bash
nohup env SMOKE_PORT=3101 .claude/skills/gate-run/run-gates.sh > .superpowers/sdd/shell-fidelity-u4/gate.log 2>&1 &
```

If it does not, and 3100 is free:

```bash
nohup .claude/skills/gate-run/run-gates.sh > .superpowers/sdd/shell-fidelity-u4/gate.log 2>&1 &
```

If it does not and 3100 is held (usually Jobsmith's `next dev`), do not kill another
project's process: either ask Nick, or let the run finish its first nine steps, then from
`apps/docs` run the smoke suite on a copy of the config
(`sed 's/3100/3101/g' playwright.config.ts > playwright.3101.config.ts && CI=1 pnpm exec playwright test --config playwright.3101.config.ts; rm playwright.3101.config.ts`)
and the Storybook and consumer steps by hand. Wait for the detached run by polling the log
for `All gates green` or `FAILED`, and read the diff while it runs. Expected: all twelve
steps green, the consumer install test included (it installs `shell-skeleton` into
`lib/` and builds a Next app on it).

- [ ] **Step 5: Look at it, in both browsers**

```bash
pnpm --filter storybook dev
pnpm --filter docs dev
```

In Chrome and in Safari, at 1440 and at 375: open `Super AI/Home Shell/Loading`, `.../Status`,
the same two for Studio, Settings and Auth, and `Super AI/Notebook Shell/Header Actions`
(Storybook on 6007). At 375 the B1 sidebars are drawers, so the sidebar skeleton is
hidden; confirm nothing scrolls sideways. On the docs site open `/components/chat-shell`
(the Shortcuts control opens the sheet; the notifications control sits beside the account
menu), `/components/notebook-shell` and `/components/settings-shell`. Take a screenshot of
each state you checked and say which browser it came from; a state you could not check is
reported as unverified.

- [ ] **Step 6: Report, and stop before pushing**

Report: the gate log's summary, the Linux run's result, the §8 findings, the screenshots,
and the local URLs as the preview (`http://localhost:6007/?path=/story/super-ai-home-shell--loading`,
`http://localhost:3000/components/chat-shell`, or the port each server printed). State the
remote (`VV-DSGN-INC/Super-AI-Components`) and the branch out loud, and push or open the
PR only on Nick's go. The PR body names the stacking if the branch was cut from PR 78.

---

## Self-review

**Spec coverage (§3 U4, §6, §7, §9).**

- `status` on all thirteen, under the topbar or atop the content column, composing M6 or the
  vendored Alert, mounted only when given: the props, placement and unit test in Tasks 4
  to 16; M6 in chat, generation, explore and notebook stories; the Alert in the other
  nine, three destructive with the 4.49:1 fix.
- `loading` as one boolean; every region's skeleton (rows for rails and navs, tiles for
  grids, lines for prose); `aria-busy`; nothing interactive: Task 1's parts, Task 2's
  jsdom check, each shell's loading branch and unit test.
- The loading twin, 8px per region, keyed by `data-loading-region`: Task 2's helper, Task 3's
  written contract, a `Loading` story per shell, the deliberate failure in Task 4, the Linux
  run in Task 17. The edge kinds narrow "per region" for eight regions, surfaced as call 1.
- Notebook `headerActions`: Task 15, with a story and the demo.
- The command-palette `dos` line: step 8 of every shell task. The chat shortcuts hint:
  Task 5, step 9.
- Demos with host chrome: notifications beside the account menu in home, chat, artifact,
  records, studio, generation, library, settings and notebook; timeline and explore have no
  slot (U3's recorded gaps); docs waits on U3's Task 11; auth has none, correctly.
- Contracts regenerate through `contract:emit`: Task 3 (the manifest-driven fields) and
  Task 17 (once, after the wave). The manifest is prepared in a controller task before the
  wave (Task 3). §9's two questions: the "Decisions for Nick" section, closed in Task 18.
- §6 "every shell accepts status and loading; every Loading story passes the twin proof;
  all twelve gates green": Tasks 17 and 18. `prod:diff` after a deploy is out of scope.

**Placeholder scan.** Every code step carries its code. The one step that asks for content
not in this plan is Task 18 Step 1's "one bullet per finding the agents reported", which
cannot exist before the wave runs. No "similar to Task N": the shared sentences are
repeated in each task.

**Type and name consistency.** `ShellSkeletonRegion({ region })`, `ShellSkeletonBlock`,
`ShellSkeletonRows({ count, className })`, `ShellSkeletonLines({ count, className })`,
`ShellSkeletonTiles({ count, className, tileClassName })`,
`ShellSkeletonSidebar({ region, collapsed, className })` and `ShellLoadingLabel()` are
defined in Task 1 and used with those names and props in Tasks 4 to 16.
`expectShellLoadingContract` and `expectShellLoadedContract` take `(root, { name, regions })`
everywhere. `expectLoadingTwin(canvasElement, shell, Record<region, TwinKind>)` with kinds
`frame`, `flow-lead`, `flow`, `text` matches Task 2 in all thirteen stories. The status
wrapper is `data-slot="<name>-status"` in every shell, which is what the jsdom helper
excludes. Each story's twin map names exactly the shell's manifest `regions`.

## What this plan could not settle

- **Heights for props no story fixture passes** (a library or artifact header with
  `headerActions`, chat and notebook composers without chips, a timeline transcript) are
  class arithmetic, not measurements. The twin checks the full fixtures only.
- **Linux numbers.** Every target was measured in Chromium on macOS. The twin compares two
  states in one run, which removes most platform drift, but a region whose loaded height
  comes from wrapped text can still differ; Task 17's `linux-gate.sh` run is the check,
  and it needs Docker.
- **`userEvent.tab()` with nothing focusable** is expected to leave focus on the body in the
  vitest browser runner; Task 4's pathfinder run is the first place that is observed.
- **Whether Nick takes call 6** (U3's parked props) changes the task count, not the tasks
  written here.
