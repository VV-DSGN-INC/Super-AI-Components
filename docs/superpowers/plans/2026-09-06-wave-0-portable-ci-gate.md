# Wave 0: A Portable CI Gate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Get `main` green so the consumer install test runs again, and leave the Storybook gate portable so it cannot go red the same way from a Mac.

**Architecture:** Measurement first. Task 1 makes the CI runner reproducible locally, because nothing after it can be judged from macOS. Tasks 2–4 remove the three environmental variables the gate currently depends on. Task 5 re-measures and produces the conversion inventory. Task 6 fans that inventory out. Task 7 writes the rule down.

**Tech Stack:** pnpm 11.1.0, Node 24, Docker, Storybook 9.1, vitest 4.1.8 browser mode, Playwright 1.60.0 chromium, Tailwind 4.

**Spec:** [`docs/superpowers/specs/2026-09-06-post-case-story-remediation-design.md`](../specs/2026-09-06-post-case-story-remediation-design.md)

## Global Constraints

- Run every gate **from the repo root**. Root `pnpm lint` and `pnpm typecheck` are turbo tasks covering docs, storybook and ds-rules; the same-named script inside a workspace is a different command.
- **No measurement taken on macOS decides anything in this wave.** The host and the runner disagree, which is the whole problem. Task 1's script is the instrument.
- The a11y exclusion list (`apps/storybook/vitest.config.ts`), `apps/storybook/a11y-exclusions.baseline.json` and `apps/docs/scripts/lib/story-coverage.baseline.json` **may only shrink, never grow.** An empty story-coverage baseline is the guarantee; do not delete the file.
- Never pair a bare `text-muted-foreground` with a bare `bg-muted` / `bg-accent` / `bg-secondary` in one quoted class string: 4.34:1 against a 4.5:1 minimum.
- `apps/docs/lib/catalog.manifest.ts` is the one shared file. A subagent never writes it.
- **Commit before dispatching agents.** A subagent worktree fast-forwards at step 0 and sees the branch as it was at dispatch time.
- **A rewritten assertion must be watched failing before it is kept.** Revert the value to something wrong, see the test go red, restore it. An assertion that cannot fail is worse than none, and this repo has shipped three of them.
- Branch per task. Never commit to `main`.
- Gate order: `install --frozen-lockfile` → `lint` → `typecheck` → `check:tokens` → `check:contract` → `test` → `build:registry` → `build` → Playwright smoke → Storybook a11y → consumer install test.

---

### Task 1: Make the CI runner reproducible in one command

The gate has never been portable and nothing said so. Before anything is changed, there has to be a way to measure on the platform that gates.

**Files:**

- Create: `scripts/linux-gate.sh`
- Modify: `docs/design-system/story-conventions.md` (add the section referenced by Task 7)

**Interfaces:**

- Consumes: Docker on the developer's machine, and `playwright@1.60.0` from `pnpm-lock.yaml`.
- Produces: `scripts/linux-gate.sh [vitest args…]` — runs the Storybook project inside the CI image against the **current working tree**, including uncommitted changes, and exits with the suite's exit code.

- [ ] **Step 1: Confirm the image matches the lockfile**

```bash
grep -nE "^  playwright@" pnpm-lock.yaml
```

Expected: `playwright@1.60.0:`. The image tag must track this exactly; if the lockfile moves, so does the tag in the script.

- [ ] **Step 2: Write the script**

Create `scripts/linux-gate.sh`:

```bash
#!/usr/bin/env bash
# Runs the Storybook a11y + interaction gate inside the image CI uses.
#
# Why this exists: the suite asserts rendered geometry, and geometry is not
# portable. The same three measurements come out four different ways across
# macOS, GitHub's amd64 runner and an arm64 container — see the wave 0 spec
# §2.4. A green run on a Mac says nothing about CI, and that is how main went
# red with eleven failures nobody could see locally.
#
# CAVEAT: if your Docker runs arm64 (colima on Apple silicon), this reproduces
# the failure CLASS but not GitHub's exact numbers — ubuntu-latest is amd64.
# It is a fast pre-push check, not a substitute for CI.
set -euo pipefail

IMAGE="mcr.microsoft.com/playwright:v1.60.0-noble"
CONTAINER="super-ai-linux-gate"
ROOT="$(git rev-parse --show-toplevel)"
STAGE="$(mktemp -d)"

cleanup() {
  rm -rf "$STAGE"
  docker rm -f "$CONTAINER" >/dev/null 2>&1 || true
}
trap cleanup EXIT

# Copy the WORKING TREE, not HEAD: an agent converting an assertion needs to
# test the edit it just made. node_modules is excluded because the host's is
# built for the host's platform and would break the install inside.
echo "==> staging working tree"
tar -c -C "$ROOT" \
  --exclude-vcs \
  --exclude=node_modules \
  --exclude=.next \
  --exclude=.turbo \
  --exclude=storybook-static \
  --exclude=test-results \
  --exclude=playwright-report \
  -f - . | tar -x -C "$STAGE"

docker rm -f "$CONTAINER" >/dev/null 2>&1 || true
docker create --name "$CONTAINER" -w /w "$IMAGE" bash -lc "
  set -euo pipefail
  corepack enable >/dev/null 2>&1
  corepack prepare pnpm@11.1.0 --activate >/dev/null 2>&1
  echo \"==> \$(uname -m) · node \$(node -v) · pnpm \$(pnpm -v)\"
  pnpm install --frozen-lockfile 2>&1 | tail -3
  cd apps/storybook
  pnpm exec vitest run --project storybook ${*:-}
" >/dev/null

echo "==> copying into container"
docker cp "$STAGE/." "$CONTAINER":/w

echo "==> running the gate"
docker start -a "$CONTAINER"
```

Then `chmod +x scripts/linux-gate.sh`.

- [ ] **Step 3: Verify it reproduces the known failure**

```bash
./scripts/linux-gate.sh 2>&1 | tail -30
```

Expected: `Test Files 11 failed | 120 passed (131)` on arm64, or 10 failed on amd64. **If it reports zero failures, the script is not testing what you think** — check that the staging copy actually contains `apps/storybook/src`.

- [ ] **Step 4: Verify it can target one file**

```bash
./scripts/linux-gate.sh src/stories/super-ai/ResultCard.stories.tsx 2>&1 | tail -20
```

Expected: one file run, `Mobile` failing with `retry=…` against `retry=73x28`. This is the loop every agent in Task 6 will use.

- [ ] **Step 5: Commit**

```bash
git add scripts/linux-gate.sh
git commit -m "feat(gate): reproduce the CI Storybook runner locally

The suite asserts rendered geometry and geometry is not portable: the same
three measurements come out four ways across macOS, GitHub amd64 and arm64.
A green run on a Mac has never said anything about CI, which is how main went
red with eleven failures invisible locally. Copies the working tree, not HEAD,
so an agent can test the edit it just made."
```

---

### Task 2: Align the dependency graph

Two Tailwind copies and two Vite majors resolve. Tailwind emits the CSS the failing assertions measure, so this lands **before** any assertion is touched or they get re-pinned twice.

**Files:**

- Modify: `apps/storybook/package.json`
- Modify: `apps/docs/package.json`
- Modify: `pnpm-workspace.yaml` (only if step 4 takes option 1)
- Modify: `tools/ds-architecture/package.json` (only if step 4 takes option 1)
- Modify: `CLAUDE.md` (the commands table gains a `check:ladder` row either way)
- Modify: `pnpm-lock.yaml` (by pnpm)

**Interfaces:**

- Consumes: nothing.
- Produces: a lockfile resolving one `tailwindcss`, one `vite` major, and `@types/node` matching the runtime.

- [ ] **Step 1: Record the starting state**

```bash
grep -noE "tailwindcss@4\.[0-9.]+" pnpm-lock.yaml | cut -d: -f2 | sort -u
grep -noE "^  vite@[0-9.]+" pnpm-lock.yaml | cut -d: -f2 | sort -u
grep -noE "@vitejs/plugin-react@[0-9.]+" pnpm-lock.yaml | cut -d: -f2 | sort -u
```

Expected: `tailwindcss@4.3.0` and `4.3.2`; `vite@7.3.6` and `vite@8.0.16`; `@vitejs/plugin-react@5.2.0` and `6.0.2`.

- [ ] **Step 2: Align the versions**

In `apps/storybook/package.json`:

- `devDependencies.@vitejs/plugin-react`: `^5.0.0` → `^6.0.2`, matching `apps/docs`.
- `devDependencies.vite`: `^7.0.0` → `^8.0.0`. `@tailwindcss/vite@4.3.2` declares `vite: ^5.2.0 || ^6 || ^7 || ^8`, so 8 is in range.
- `devDependencies.tailwindcss`: `^4` → `^4.3.2`, so the direct dep and the one `@tailwindcss/vite` pulls resolve to a single copy.
- Add `"@types/node": "^24.0.0"`. The workspace declares none today and inherits `20.19.42` through peer hoisting, against Node 24 in `.nvmrc` and CI.
- Delete `devDependencies.tsx`. Its only apparent use, `apps/storybook/components.json:5`, is shadcn's JSX-flavor flag, not the package.
- Delete `devDependencies.date-fns`. Nothing imports it; it remains available transitively through `react-day-picker@10.0.1`.

In `apps/docs/package.json`, change `devDependencies.@types/node` from `^20` to `^24.0.0`.

- [ ] **Step 3: Reinstall and confirm the graph collapsed**

```bash
pnpm install
grep -noE "tailwindcss@4\.[0-9.]+" pnpm-lock.yaml | cut -d: -f2 | sort -u
grep -noE "^  vite@[0-9.]+" pnpm-lock.yaml | cut -d: -f2 | sort -u
```

Expected: one `tailwindcss` and one `vite` major.

- [ ] **Step 4: Decide what happens to `tools/ds-architecture`**

It has its own `package.json` but sits outside `pnpm-workspace.yaml`'s `apps/*` and `packages/*` globs, so `grep -c "ds-architecture" pnpm-lock.yaml` returns 0, its `node_modules` does not exist, and its `test`, `typecheck` and `emit` scripts cannot run after a clean install. It also declares `vitest ^2.1.0` against `^4.1.8` everywhere else. The root `check:ladder` script works only because `conformance.mjs` uses nothing but `node:` builtins and relative imports, and CI never runs it.

Two honest options, and this is a decision rather than a sweep:

1. **Bring it in.** Add `tools/*` to `pnpm-workspace.yaml`, align `vitest` to `^4.1.8` and `@types/node` to `^24`, and add `check:ladder` to CI. Its tests then run.
2. **Leave it out, and say so.** It is a vendored checker with a deliberate no-dependency seam. Record in `tools/ds-architecture/VENDOR.md` that its suite is run manually with `npm install`, and note in `CLAUDE.md` that `check:ladder` is a root script CI does not run.

Take option 1 unless the vendoring seam is load-bearing for carrying the checker to the sibling repo. Either way `CLAUDE.md`'s command table gains the `check:ladder` row it is missing today.

- [ ] **Step 5: Run the host gates**

```bash
pnpm lint && pnpm typecheck && pnpm check:tokens && pnpm check:contract && pnpm test
```

Expected: green. `@types/node` moving from 20 to 24 is the likeliest source of a new typecheck error; fix the call site rather than pinning the types back.

- [ ] **Step 6: Re-measure in the container and record the new failure set**

```bash
./scripts/linux-gate.sh 2>&1 | tee /tmp/after-deps.log | tail -30
grep -E "^ FAIL " /tmp/after-deps.log | sed -E 's/^ FAIL +storybook \(chromium\) +//' | sort -u
```

Write the resulting list into the commit message. **This step is the point of the task ordering** — if the count or the set changed, Tailwind was moving the measurements, and any earlier pin would have been wrong.

- [ ] **Step 7: Commit**

```bash
git add apps/storybook/package.json apps/docs/package.json pnpm-lock.yaml pnpm-workspace.yaml
git commit -m "chore(deps): one Tailwind, one Vite major, types matching the runtime

The lockfile resolved tailwindcss 4.3.0 and 4.3.2 and two Vite majors, with
storybook on a different Vite than the rest of the repo. Tailwind emits the CSS
the story assertions measure, so this lands before any of them are touched.
Also drops storybook's unreferenced tsx and date-fns, and moves @types/node from
20 to 24 to match .nvmrc and CI.

Container failure set after this change: <paste from step 5>"
```

---

### Task 3: Remove the node-builder dependency

`@xyflow/react` and 14 vendored files exist only to render stories for family G, which D9 cut. They are excluded from the a11y gate, referenced by nothing in `apps/docs`, and carry a heavyweight dependency.

**Files:**

- Delete: `apps/storybook/src/components/ai-elements/{canvas,connection,controls,edge,node,panel,toolbar}.tsx`
- Delete: `apps/storybook/src/stories/ai-elements/{Canvas,Connection,Controls,Edge,Node,Panel,Toolbar}.stories.tsx`
- Modify: `apps/storybook/package.json`

- [ ] **Step 1: Confirm nothing else imports them**

```bash
grep -rn "@xyflow" apps --include=*.ts --include=*.tsx --include=*.css -l | sort
grep -rn "ai-elements/\(canvas\|connection\|controls\|edge\|node\|panel\|toolbar\)" apps --include=*.tsx -l | sort
```

Expected: exactly the 14 files listed above, and nothing in `apps/docs`. **If anything outside that set appears, stop and report it** rather than deleting.

- [ ] **Step 2: Delete the files and the dependency**

```bash
git rm apps/storybook/src/components/ai-elements/{canvas,connection,controls,edge,node,panel,toolbar}.tsx
git rm apps/storybook/src/stories/ai-elements/{Canvas,Connection,Controls,Edge,Node,Panel,Toolbar}.stories.tsx
```

Remove `"@xyflow/react"` from `apps/storybook/package.json` dependencies, then `pnpm install`.

- [ ] **Step 3: Verify the suite shrank by exactly seven files and nothing else broke**

```bash
pnpm typecheck && pnpm lint
./scripts/linux-gate.sh 2>&1 | tail -5
```

Expected: the passing file count drops by 7 (those stories were excluded from a11y assertions but still ran), and the failing set is unchanged from Task 2's.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore(storybook): drop @xyflow/react and the node-builder ports

Seven vendored AI Elements flow components and their seven stories served only
family G, which D9 cut. They are excluded from the a11y gate, imported by
nothing in apps/docs, and kept a heavyweight dependency alive. Recoverable from
git if D9 is ever revisited."
```

---

### Task 4: Stop the gate downloading its own fonts

`apps/storybook/src/index.css:4` fetches Geist from `fonts.googleapis.com` at test time, while the docs app self-hosts through `next/font`. A blocking gate should not depend on the network.

**Read the spec's §2.4 before starting.** Installing Geist system-wide in the runner changed **nothing** — same 11 failures, same numbers. So this task removes a network dependency; it is not the fix, and its effect must be measured rather than assumed.

**Files:**

- Modify: `apps/storybook/package.json`
- Modify: `apps/storybook/src/index.css:4`

- [ ] **Step 1: Add the font packages**

```bash
pnpm --filter storybook add -D @fontsource-variable/geist @fontsource-variable/geist-mono
```

- [ ] **Step 2: Replace the network import**

In `apps/storybook/src/index.css`, replace line 4:

```css
@import url("https://fonts.googleapis.com/css2?family=Geist+Mono:wght@100..900&family=Geist:wght@100..900&display=swap");
```

with:

```css
/* Self-hosted, not fonts.googleapis.com: this is a blocking gate and it should
   not depend on the network. The docs app already self-hosts via next/font, so
   this also makes the two environments agree on where the family comes from.
   NOTE: this does NOT make text metrics portable — measured, see the wave 0
   spec §2.4 — it only removes one variable. */
@import "@fontsource-variable/geist/index.css";
@import "@fontsource-variable/geist-mono/index.css";
```

- [ ] **Step 3: Verify the font actually renders**

```bash
pnpm --filter storybook dev
```

Open a story and confirm the sans is Geist, not a serif fallback. A wrong import path fails silently: Tailwind emits nothing for an unresolved `@import` and the page falls back without an error.

- [ ] **Step 4: Re-measure and record honestly**

```bash
./scripts/linux-gate.sh 2>&1 | tee /tmp/after-fonts.log | tail -30
diff <(grep -E "^ FAIL " /tmp/after-deps.log) <(grep -E "^ FAIL " /tmp/after-fonts.log) || true
```

Record whatever this shows in the commit message, including "no change" if that is the answer. Do not claim an improvement the diff does not show.

- [ ] **Step 5: Commit**

```bash
git add apps/storybook/package.json apps/storybook/src/index.css pnpm-lock.yaml
git commit -m "chore(storybook): self-host Geist instead of fetching it at test time

A blocking gate should not depend on fonts.googleapis.com. This removes one
environmental variable; it does not make text metrics portable — installing
Geist system-wide in the runner image changed neither the failure set nor the
measured values (spec §2.4).

Container failure set after this change: <paste from step 4>"
```

---

### Task 5: Produce the conversion inventory

The 58 files are not uniform, and a mechanical sweep over `toBe` would delete legitimate assertions. Before fanning out, classify every failing assertion.

**Files:**

- Create: `docs/superpowers/plans/wave-0-conversion-inventory.md`

**Interfaces:**

- Consumes: `/tmp/after-fonts.log` from Task 4.
- Produces: the per-file work list Task 6's agents are dispatched against.

- [ ] **Step 1: Get the authoritative failure list**

```bash
./scripts/linux-gate.sh 2>&1 | tee /tmp/baseline.log
grep -E "^ FAIL " /tmp/baseline.log | sed -E 's/^ FAIL +storybook \(chromium\) +//' | sort -u
```

- [ ] **Step 2: Classify each failing assertion into one of three buckets**

Per D21:

| bucket                | test                                                                                                                                                                           | action                                           |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------ |
| **Dictated**          | the number comes from a Tailwind class or a viewport the test set — `minHeight: "56px"`, `paddingLeft: "10px"`, a `w-23` rail at 92, `window.innerWidth` after `page.viewport` | **keep exactly as it is**                        |
| **Text-derived**      | an intrinsic width, a `scrollWidth` over ellipsised text, a content-sized box                                                                                                  | rewrite to the claim the comment already states  |
| **Scrollbar-derived** | a `clientWidth` of a scrollable container, or any relationship anchored to one                                                                                                 | re-anchor to something a scrollbar does not move |

- [ ] **Step 3: Write the inventory**

One row per failing assertion: file, line, current assertion, bucket, and the claim its own surrounding comment makes. The comment is usually the answer — these stories explain themselves, and the sentence above the assertion is what the rewrite must preserve.

- [ ] **Step 4: Commit**

```bash
git add docs/superpowers/plans/wave-0-conversion-inventory.md
git commit -m "docs(plan): classify every failing assertion before converting any"
```

---

### Task 6: Convert the assertions (fan-out)

Dispatch roughly eight agents, grouped by family so a group shares context. Each agent gets its own git worktree, its own files, and nothing else.

**Every agent's brief includes:** the D21 table from Task 5 step 2, the instruction to run `./scripts/linux-gate.sh <their file>` rather than the host suite, and the record-don't-pin rule.

**Interfaces:**

- Consumes: `scripts/linux-gate.sh`, the inventory from Task 5.
- Produces: converted story files. No agent writes `catalog.manifest.ts`, `story-conventions.md`, or any file outside its assigned list.

Three worked conversions follow. They are the templates; the reasoning transfers, the code does not.

- [ ] **Step 1: Text-derived, where the comment states the real claim**

`apps/storybook/src/stories/super-ai/ResultCard.stories.tsx:909-911` reads:

```ts
// The only control a failed card offers, against WCAG 2.2's 24×24.
const retry = canvas.getByRole("button", { name: "Retry" }).getBoundingClientRect();
await expect(`retry=${Math.round(retry.width)}x${Math.round(retry.height)}`).toBe("retry=73x28");
```

The comment names the claim and the assertion does not make it. Width is intrinsic to the label text: 73 on macOS, 74 on GitHub, 68 on arm64. Height is `h-7`, a class. Convert to:

```ts
// The only control a failed card offers, against WCAG 2.2's 24×24. Width is
// intrinsic to the label and moves with the platform's font stack (73 / 74 /
// 68 across macOS, GitHub amd64 and arm64), so assert the floor the success
// criterion actually sets. Height is `h-7` — a class, so it stays exact.
const retry = canvas.getByRole("button", { name: "Retry" }).getBoundingClientRect();
await expect(retry.width).toBeGreaterThanOrEqual(24);
await expect(Math.round(retry.height)).toBe(28);
```

- [ ] **Step 2: Text-derived, where the claim is an ordering**

`apps/storybook/src/stories/super-ai/StudioShell.stories.tsx:925-933` reads:

```ts
    const widths = labels.map((el) => `${el.clientWidth}/${el.scrollWidth}`);
    …
    // The preset tile is the tightest of the three: it shows an eighth of the
    // name the panel, the grid and the strip are all pointing at.
    await expect(widths.join(" ")).toBe("53/444 88/444 124/444");
```

The claim is that one string is shown three ways, tightest first. Convert to:

```ts
// All three render the same string, so they share one scrollWidth; what
// differs is how much each shows. scrollWidth is text-derived and moves with
// the platform (444 / 472 / 411), so assert the shape of the claim: one
// shared full width, a strict ordering, and the preset tile showing a sliver.
const shown = labels.map((el) => ({ visible: el.clientWidth, full: el.scrollWidth }));
await expect(new Set(shown.map((s) => s.full)).size).toBe(1);
const [preset, grid, strip] = shown;
await expect(preset.visible).toBeLessThan(grid.visible);
await expect(grid.visible).toBeLessThan(strip.visible);
await expect(preset.visible / preset.full).toBeLessThan(0.2);
```

- [ ] **Step 3: Scrollbar-derived, where rephrasing is not enough**

`apps/storybook/src/stories/super-ai/RecordsShell.stories.tsx:966-972` reads:

```ts
// The record table is a sideways scroller and the folder table is not.
const containers = Array.from(canvasElement.querySelectorAll<HTMLElement>('[data-slot="table-container"]'));
await expect(containers).toHaveLength(2);
await expect(containers[0].scrollWidth).toBe(containers[0].clientWidth);
await expect(containers[1].scrollWidth).toBeGreaterThan(containers[1].clientWidth);
```

This is **already relational and still fails**: on Linux a classic scrollbar takes 16px off `clientWidth`, the folder table no longer fits, and `scrollWidth` exceeds it. The design claim is about which container is _allowed_ to scroll, not which happens to overflow at one viewport on one platform. Convert to:

```ts
// The record table is a sideways scroller and the folder table is not. Assert
// the declaration rather than the current overflow: clientWidth is 16px
// narrower wherever scrollbars are classic rather than overlay, which is
// enough to tip a table that fits on macOS into overflowing on Linux.
const containers = Array.from(canvasElement.querySelectorAll<HTMLElement>('[data-slot="table-container"]'));
await expect(containers).toHaveLength(2);
await expect(getComputedStyle(containers[0]).overflowX).toBe("visible");
await expect(getComputedStyle(containers[1]).overflowX).toBe("auto");
```

- [ ] **Step 4: Each agent watches each rewritten assertion fail**

For every assertion touched, break it deliberately and confirm red:

```bash
./scripts/linux-gate.sh src/stories/super-ai/<File>.stories.tsx
```

Then restore and confirm green. An assertion that cannot fail is worse than no assertion, and this repo has already shipped three of them.

- [ ] **Step 5: Integrator runs the whole suite in the container**

```bash
./scripts/linux-gate.sh 2>&1 | tail -20
```

Expected: `Test Files 131 passed (131)`.

- [ ] **Step 6: Commit per agent group**

```bash
git add apps/storybook/src/stories/super-ai/
git commit -m "test(stories): convert derived-pixel assertions in family <X>

Per D21: a story may pin a number its own classes dictate and may not pin one
the browser derives from text metrics or scrollbars. Each rewritten assertion
was watched failing on a broken value in the CI runner image before being kept."
```

---

### Task 7: Write the rule down

Without this, wave 3 reintroduces the problem on the first component it touches.

**Files:**

- Modify: `docs/design-system/story-conventions.md`
- Modify: `docs/design-system/decisions.md`
- Modify: `CLAUDE.md`

- [ ] **Step 1: Confirm the decision number is free**

```bash
grep -n "^### D2[0-9]" docs/design-system/decisions.md
```

The 2026-09-04 ladder review earmarked a D21 for its stage 08 and never wrote it. If it has landed by now, take the next free number and say so in the commit.

- [ ] **Step 2: Write D21 into `decisions.md`**

Use the spec's §3 D21 text: the dictated/derived split, the three-platform measurement table, and the point that a relationship anchored to a derived quantity is no more portable than an absolute one.

- [ ] **Step 3: Write the convention into `story-conventions.md`**

Add a numbered fact in the file's existing style covering: the two buckets with examples of each; that `page.viewport(375, 812)` sets a viewport you may then assert; that a scrollbar removes roughly 16px from `clientWidth` wherever scrollbars are classic; and that `./scripts/linux-gate.sh` is how a story is verified before it is pushed.

- [ ] **Step 4: Add the container run to the CLAUDE.md commands table**

One row: `./scripts/linux-gate.sh` — "the Storybook gate in the CI runner image; the only honest check of a geometry assertion."

- [ ] **Step 5: Verify the docs gate still passes**

```bash
pnpm check:contract
```

- [ ] **Step 6: Commit**

```bash
git add docs/design-system/story-conventions.md docs/design-system/decisions.md CLAUDE.md
git commit -m "docs(stories): D21 — dictated numbers may be pinned, derived ones may not"
```

---

## Wave exit gate

From the repo root, in `ci.yml`'s order, stopping at the first failure:

```bash
pnpm install --frozen-lockfile && pnpm lint && pnpm typecheck && pnpm check:tokens \
  && pnpm check:contract && pnpm test && pnpm build:registry && pnpm build \
  && pnpm --filter docs exec playwright test
rm -rf apps/storybook/node_modules/.cache/storybook
pnpm --filter storybook test:stories
apps/docs/scripts/consumer-test.sh
```

Then the two that actually prove this wave:

```bash
./scripts/linux-gate.sh
```

and a green `verify` job on GitHub, with the **consumer install test visibly running** rather than skipped behind an earlier failure. That last observation is the wave's real deliverable: it is the step that has not run on `main` since the case-story program landed.
