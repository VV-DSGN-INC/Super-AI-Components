# CI Concurrency and Docs-Only Scope Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cancel a pull request's superseded CI runs, and let a docs-only pull request skip the `product` job's steps while the job still reports green, without weakening any gate and without leaving a written mirror false.

**Architecture:** A `concurrency` block keyed by pull request number, or by commit SHA on `main` so nothing there is ever cancelled. One standard-library module, `apps/docs/scripts/lib/ci-scope.mjs`, decides whether a list of changed paths can reach the `product` job; it fails open. `ci.yml`'s `product` job runs it as its second step and guards every later step on its output. `gates` is never scoped. One test file covers the module, the module as a process, and the shape of `ci.yml` itself.

**Tech Stack:** GitHub Actions; Node standard library (the module runs before `pnpm install`); Vitest 4 with globals (`apps/docs/vitest.config.ts`); Prettier 3 (`printWidth: 110`); pnpm 11; GitHub CLI.

**Spec:** [`../specs/2026-09-18-ci-concurrency-and-scope-design.md`](../specs/2026-09-18-ci-concurrency-and-scope-design.md). Read §1 (what was measured) and §2.2 (why each light pattern is safe) before Task 1.

## Global Constraints

- **Precondition.** Task 5 of `docs/superpowers/plans/2026-09-17-project-review-remediation.md` and the whole of `docs/superpowers/plans/2026-09-18-review-round-budget.md` have merged to `main`. Task 1 Step 1 checks both. If either is missing, stop and tell Nick; do not adapt the plan.
- Use `pnpm`, never npm. If `node_modules` is missing in this checkout, run `pnpm install --frozen-lockfile` from the repo root first.
- Branch `claude/ci-scope`, cut from `origin/main`. Never commit to `main`. Before any push, run `git remote -v` and confirm out loud that the remote is `VV-DSGN-INC/Super-AI-Components`. Pushing needs the `weeeha` GitHub account.
- Do not disable, reorder or weaken any existing CI step. The only `if:` this plan adds is `steps.scope.outputs.heavy != 'false'`, and only inside the `product` job.
- The light list is exactly three patterns: `^docs/`, `^\.claude/`, `^[^/]+\.md$`. Do not add a fourth. A test pins it.
- `CLAUDE.md` is pinned at or under **14,500 bytes**; `CEILING` is never raised. This plan makes the file 211 bytes smaller.
- Code blocks in this plan were executed while it was written. Type them exactly; do not "improve" them.
- New prose contains no em dashes and no exclamation marks. Text the plan tells you to move keeps whatever it already has.
- This repository is public. Do not name any private repository, client or company in any file or pull request.
- Commit messages are conventional and end with the attribution trailer your session was given.

## Decisions Nick makes before Task 1 starts

| #   | decision                | default the plan assumes                                                    | alternative                                                           |
| --- | ----------------------- | --------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| D1  | the light list          | `docs/`, `.claude/`, root `*.md`                                            | also `research/` and `reviews/` (needs the pinned test changed too)   |
| D2  | runs on `main`          | never cancelled, keyed by SHA                                               | key by ref and cancel                                                 |
| D3  | what leaves `CLAUDE.md` | the `format:check` history paragraph moves to `docs/CONTINUE.md` §4         | move "One quirk worth knowing" instead, or both                       |
| D4  | proving the skip        | a throwaway draft pull request stacked on this branch, watched, then closed | skip Task 3 Steps 4 to 6 and check on the next real docs pull request |

If Nick has said nothing about these, use the defaults.

---

### Task 1: The classifier, the workflow wiring, and their test

**Files:**

- Create: `apps/docs/scripts/lib/ci-scope.test.ts`
- Create: `apps/docs/scripts/lib/ci-scope.mjs`
- Modify: `.github/workflows/ci.yml` (one block inserted, the `product` job replaced)

**Interfaces:**

- Consumes: nothing.
- Produces: `isHeavy(paths: readonly string[]): boolean` and `LIGHT: RegExp[]`, exported from `ci-scope.mjs`; the CLI contract "changed paths on stdin, `true` or `false` on stdout, no newline"; the step id `scope` with output `heavy`; the guard string `if: steps.scope.outputs.heavy != 'false'`. Task 2's prose cites the module path verbatim.

- [ ] **Step 1: Cut the branch and check the precondition**

```bash
git fetch origin
git switch -c claude/ci-scope origin/main
grep -c "^  product:" .github/workflows/ci.yml
grep -c "^concurrency:" .github/workflows/ci.yml
wc -c CLAUDE.md
```

Expected: `1`, then `0`, then `14495`.

- `0` on the first line means remediation Task 5 has not merged. Stop.
- `14367` on the last line means the review-round budget has not merged. Stop and tell Nick to land `2026-09-18-review-round-budget.md` first: it is a short docs change, and landing it first keeps one plan from rewriting another's expected numbers.
- Any other number: stop and report it.

- [ ] **Step 2: Write the test**

Create `apps/docs/scripts/lib/ci-scope.test.ts` with exactly this content:

```ts
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { isHeavy, LIGHT } from "./ci-scope.mjs";

const REPO = resolve(__dirname, "../../../..");
const SCRIPT = join(__dirname, "ci-scope.mjs");
const WORKFLOW = readFileSync(join(REPO, ".github/workflows/ci.yml"), "utf8");
const GUARD = "if: steps.scope.outputs.heavy != 'false'";

describe("isHeavy", () => {
  it.each([
    ["one doc", ["docs/CONTINUE.md"]],
    ["a root markdown file", ["CLAUDE.md"]],
    ["a skill", [".claude/skills/gate-run/SKILL.md"]],
    ["all three kinds together", ["docs/design-system/gaps.md", "README.md", ".claude/settings.json"]],
    ["blank lines around a doc", ["", "docs/CONTINUE.md", "  "]],
  ])("skips the product steps for %s", (_, paths) => {
    expect(isHeavy(paths)).toBe(false);
  });

  // The control half: a classifier that answered `false` to everything would pass
  // the block above. Each of these is a path the product job really does read, or
  // one that only looks light.
  it.each([
    ["a registry source", ["apps/docs/registry/super-ai/prompt-input.tsx"]],
    ["a rule record", ["packages/ds-rules/rules/core.json"]],
    ["the workflow itself", [".github/workflows/ci.yml"]],
    ["this classifier", ["apps/docs/scripts/lib/ci-scope.mjs"]],
    ["the lockfile", ["pnpm-lock.yaml"]],
    ["the root manifest", ["package.json"]],
    ["a Storybook MDX page", ["apps/storybook/src/stories/foundations/motion.mdx"]],
    ["markdown nested under an app", ["apps/docs/content/notes.md"]],
    ["the vendored ladder", ["tools/ds-architecture/VENDOR.md"]],
    ["a file literally named docs", ["docs"]],
    ["a directory that only starts with docs", ["docsite/index.md"]],
    ["a path git had to quote", ['"docs/caf\\303\\251.md"']],
    ["one heavy path among docs", ["docs/CONTINUE.md", "apps/docs/lib/catalog.manifest.ts"]],
    ["an empty list", []],
    ["only blank lines", ["", "  "]],
  ])("runs the product steps for %s", (_, paths) => {
    expect(isHeavy(paths)).toBe(true);
  });

  it("keeps the light list to the three claims that were checked", () => {
    expect(LIGHT.map(String)).toEqual(["/^docs\\//", "/^\\.claude\\//", "/^[^/]+\\.md$/"]);
  });
});

describe("ci-scope.mjs as ci.yml runs it", () => {
  const run = (stdin: string) => execFileSync("node", [SCRIPT], { input: stdin, encoding: "utf8" });

  it("prints false for a docs-only diff", () => {
    expect(run("docs/CONTINUE.md\nCLAUDE.md\n")).toBe("false");
  });

  it("prints true for a mixed diff, and for no input at all", () => {
    expect(run("docs/CONTINUE.md\napps/docs/app/page.tsx\n")).toBe("true");
    expect(run("")).toBe("true");
  });
});

describe("ci.yml wiring", () => {
  const job = (name: string) => {
    const start = WORKFLOW.indexOf(`\n  ${name}:\n`);
    expect(start, `ci.yml has no job named ${name}`).toBeGreaterThan(-1);
    const rest = WORKFLOW.slice(start + 1);
    const next = rest.slice(1).search(/\n {2}[a-z-]+:\n/);
    return next === -1 ? rest : rest.slice(0, next + 1);
  };
  const steps = (block: string) => block.split(/\n {6}- /).slice(1);

  it("never scopes the gates job", () => {
    expect(job("gates")).not.toContain("steps.scope");
  });

  it("checks out two commits, so HEAD^1 is the pull request's base", () => {
    expect(steps(job("product"))[0]).toContain("fetch-depth: 2");
  });

  it("decides scope second, before anything that costs time", () => {
    const second = steps(job("product"))[1];
    expect(second).toContain("id: scope");
    expect(second).toContain("apps/docs/scripts/lib/ci-scope.mjs");
    expect(second).toContain("--no-renames");
  });

  it("guards every later product step, and only an explicit false skips one", () => {
    const later = steps(job("product")).slice(2);
    expect(later.length).toBeGreaterThanOrEqual(8);
    for (const step of later) expect(step, step.split("\n")[0]).toContain(GUARD);
  });

  it("scopes with step guards, never a workflow-level path filter", () => {
    expect(WORKFLOW).not.toMatch(/^\s*paths(-ignore)?:/m);
  });

  it("cancels superseded pull request runs and never a run on main", () => {
    expect(WORKFLOW).toContain("group: ci-${{ github.event.pull_request.number || github.sha }}");
    expect(WORKFLOW).toContain("cancel-in-progress: true");
  });
});
```

The fifteen "runs the product steps" cases are the control half. A classifier that answered `false` to everything would pass the five "skips" cases, and only the heavy list would catch it.

- [ ] **Step 3: Run it and watch it fail**

```bash
pnpm --filter docs exec vitest run scripts/lib/ci-scope.test.ts
```

Expected: the file fails to load, with an error naming `./ci-scope.mjs` (the module does not exist yet). Zero tests run.

- [ ] **Step 4: Write the module**

Create `apps/docs/scripts/lib/ci-scope.mjs` with exactly this content:

```js
#!/usr/bin/env node
// Decides whether a pull request can change anything the `product` CI job
// exercises. Stdlib only and no build step, because ci.yml runs it before
// `pnpm install`, on the runner's preinstalled Node.
//
//   git diff --name-only --no-renames HEAD^1 HEAD | node ci-scope.mjs
//
// Prints `true` (run the product steps) or `false` (skip them). Anything it
// cannot decide is `true`: an empty list, a quoted path, a path outside LIGHT.
import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";

/** Paths that cannot reach build:registry, build, Playwright, the Storybook
 *  gate or the consumer install test. Every entry is a claim that the product
 *  job reads nothing under it, so the list stays short. `docs/**` IS read by
 *  check:contract and claude-md.test.ts, and both run in the `gates` job, which
 *  is never scoped. Nested markdown (`apps/docs/content/x.md`) is not light:
 *  only a root-level `*.md` is. */
export const LIGHT = [/^docs\//, /^\.claude\//, /^[^/]+\.md$/];

/** @param {readonly string[]} paths changed paths, as `git diff --name-only` prints them
 *  @returns {boolean} true when the product steps must run */
export function isHeavy(paths) {
  const changed = paths.map((p) => p.trim()).filter(Boolean);
  if (changed.length === 0) return true;
  return changed.some((p) => !LIGHT.some((re) => re.test(p)));
}

// Compare real paths: a symlinked invocation would otherwise make this file a
// silent no-op that prints nothing, and ci.yml would read that as "undecided".
const invokedDirectly =
  process.argv[1] !== undefined && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);

if (invokedDirectly) {
  let input = "";
  process.stdin.setEncoding("utf8");
  for await (const chunk of process.stdin) input += chunk;
  process.stdout.write(String(isHeavy(input.split("\n"))));
}
```

- [ ] **Step 5: Run the test again**

```bash
pnpm --filter docs exec vitest run scripts/lib/ci-scope.test.ts
```

Expected: `Tests  4 failed | 25 passed (29)`. The four failures are all under "ci.yml wiring", and they are the right ones:

```
checks out two commits, so HEAD^1 is the pull request's base
decides scope second, before anything that costs time
guards every later product step, and only an explicit false skips one
cancels superseded pull request runs and never a run on main
```

If anything under "isHeavy" or "ci-scope.mjs as ci.yml runs it" fails, the module was not typed exactly. Fix the module, not the test.

- [ ] **Step 6: Add the concurrency block to `ci.yml`**

In `.github/workflows/ci.yml`, find the line `  pull_request:`. It is followed by one blank line. Directly after that blank line, insert this block and one blank line after it:

```yaml
# One run per pull request at a time: a new push cancels the run it supersedes.
# A push to main is keyed by its commit, so every merge keeps its own verdict and
# nothing on main is cancelled or queued behind another run. Keying main by ref
# would not do that: a concurrency group holds one pending run, so three quick
# merges would silently drop the middle one even with cancel-in-progress off.
concurrency:
  group: ci-${{ github.event.pull_request.number || github.sha }}
  cancel-in-progress: true
```

- [ ] **Step 7: Replace the `product` job in `ci.yml`**

Delete everything from the line `  product:` to the end of the file, and put this in its place. The two-space indent on `  product:` is part of the content: the job sits under `jobs:`, at the same depth as `  gates:`. The `gates` job above it is not touched.

<!-- prettier-ignore -->
```yaml
  product:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        # Two commits: on a pull request HEAD is GitHub's merge commit, and its
        # first parent is the base, so HEAD^1..HEAD is exactly what the PR changes.
        with: { fetch-depth: 2 }
      - name: Scope
        id: scope
        # A docs-only pull request cannot change anything this job exercises, so
        # every later step is skipped and the job still reports green. Guards sit
        # on steps, never on the workflow: a required check whose workflow never
        # starts never reports, and the PR waits forever. Fails open: a push, an
        # empty diff, a git or node error all leave heavy=true, and the guards
        # below skip only on an explicit 'false'. `gates` is never scoped; it is
        # the job that reads docs/ (check:contract, claude-md.test.ts).
        run: |
          heavy=true
          if [ "${{ github.event_name }}" = "pull_request" ]; then
            files=$(git diff --name-only --no-renames HEAD^1 HEAD) \
              && heavy=$(printf '%s\n' "$files" | node apps/docs/scripts/lib/ci-scope.mjs) \
              || heavy=true
          fi
          [ "$heavy" = "false" ] || heavy=true
          echo "scope: heavy=$heavy"
          echo "heavy=$heavy" >> "$GITHUB_OUTPUT"
          [ "$heavy" = "true" ] || echo "Docs-only change: product steps skipped (apps/docs/scripts/lib/ci-scope.mjs)." >> "$GITHUB_STEP_SUMMARY"
      - if: steps.scope.outputs.heavy != 'false'
        uses: pnpm/action-setup@v4
        with: { version: 11.1.0 }
      - if: steps.scope.outputs.heavy != 'false'
        uses: actions/setup-node@v4
        with: { node-version: 24, cache: pnpm }
      - if: steps.scope.outputs.heavy != 'false'
        run: pnpm install --frozen-lockfile
      - if: steps.scope.outputs.heavy != 'false'
        run: pnpm build:registry
      - if: steps.scope.outputs.heavy != 'false'
        run: pnpm build
      - name: Playwright smoke
        if: steps.scope.outputs.heavy != 'false'
        run: |
          pnpm --filter docs exec playwright install --with-deps chromium
          pnpm --filter docs exec playwright test
      - name: Storybook a11y + interaction
        if: steps.scope.outputs.heavy != 'false'
        # Blocking. Covers what this repo owns and publishes — super-ai and
        # marketing stories — not vendored ports (shadcn/ui, AI Elements) it
        # merely displays. Exclusions are in
        # apps/storybook/vitest.config.ts's `test.exclude`; full audit and
        # rationale in docs/design-system/a11y-baseline.md. The exclusion
        # list may only shrink — never grow to silence a new failure.
        run: |
          pnpm --filter storybook exec playwright install --with-deps chromium
          pnpm --filter storybook test:stories
      - name: Consumer install test
        if: steps.scope.outputs.heavy != 'false'
        run: apps/docs/scripts/consumer-test.sh
```

The same five commands run, in the same order, as before. What is new: `fetch-depth: 2` on the checkout, the `Scope` step, and one `if:` line on each of the eight steps after it. The two setup actions are guarded as well, because `actions/setup-node@v4` fails the job in its cache post-step when the pnpm store does not exist, and a skipped install never creates it.

- [ ] **Step 8: Run the test a third time**

```bash
pnpm --filter docs exec vitest run scripts/lib/ci-scope.test.ts
```

Expected: `Tests  29 passed (29)`.

- [ ] **Step 9: Format, lint, typecheck**

```bash
pnpm exec prettier --check .github/workflows/ci.yml apps/docs/scripts/lib/ci-scope.mjs apps/docs/scripts/lib/ci-scope.test.ts
pnpm --filter docs exec eslint scripts/lib/ci-scope.mjs scripts/lib/ci-scope.test.ts
pnpm --filter docs typecheck
```

Expected: `All matched files use Prettier code style!`; no ESLint output; no TypeScript output. A Prettier complaint about `ci.yml` means the YAML was mistyped, usually an indent: compare it against Steps 6 and 7 line by line before reaching for `--write`.

- [ ] **Step 10: Try the module by hand**

```bash
printf 'docs/CONTINUE.md\nCLAUDE.md\n' | node apps/docs/scripts/lib/ci-scope.mjs; echo
printf 'docs/CONTINUE.md\napps/docs/app/page.tsx\n' | node apps/docs/scripts/lib/ci-scope.mjs; echo
printf '' | node apps/docs/scripts/lib/ci-scope.mjs; echo
```

Expected: `false`, `true`, `true`.

- [ ] **Step 11: Commit**

```bash
git add apps/docs/scripts/lib/ci-scope.mjs apps/docs/scripts/lib/ci-scope.test.ts .github/workflows/ci.yml
git commit -m "ci: cancel superseded PR runs, and skip product steps on docs-only PRs"
```

Append your session's attribution trailer to the message.

---

### Task 2: The written mirrors

**Files:**

- Modify: `.claude/skills/gate-run/run-gates.sh` (header comment only)
- Modify: `.claude/skills/gate-run/SKILL.md` (one paragraph added)
- Modify: `CLAUDE.md` (one paragraph replaced, in the CI section)
- Modify: `docs/CONTINUE.md` (one paragraph added at the end of §4)

**Interfaces:**

- Consumes: the path `apps/docs/scripts/lib/ci-scope.mjs` from Task 1.
- Produces: nothing a later task needs.

- [ ] **Step 1: `run-gates.sh` header**

Find this comment line near the top of `.claude/skills/gate-run/run-gates.sh`:

```bash
# that has already happened here (CONTINUE.md §1).
```

Add these three lines directly below it:

```bash
#
# CI skips the `product` job's steps on a docs-only pull request
# (apps/docs/scripts/lib/ci-scope.mjs decides). This script never skips anything.
```

No `run` line changes. Check:

```bash
bash -n .claude/skills/gate-run/run-gates.sh && git diff --stat .claude/skills/gate-run/run-gates.sh
```

Expected: no syntax error, and `1 file changed, 3 insertions(+)`.

- [ ] **Step 2: `SKILL.md`**

In `.claude/skills/gate-run/SKILL.md`, find the paragraph that ends with this line:

```markdown
runs them back to back and stops at the first failure, as each job does.
```

Add one blank line after it, then this paragraph:

```markdown
On a docs-only pull request CI skips the `product` job's steps
(`apps/docs/scripts/lib/ci-scope.mjs` decides). This script never skips
anything, so a green run here always means all twelve steps ran.
```

- [ ] **Step 3: `CLAUDE.md`, the CI section**

Find this paragraph. It is seven lines:

```markdown
`format:check` joined the list on 2026-09-07, when the tree was made
prettier-clean. The bash hook used to deny a repo-wide format on the grounds
that `check-contract.mts`'s guidance regexes could not survive re-wrapping;
measured, they can — `\s*` spans newlines and prettier never splits a string
literal. The only real breakage was the two `gen-wiring.mts` outputs being
reformatted out of byte-agreement with their generator, and they are now
prettier-ignored.
```

Replace all seven lines with this one line:

```markdown
On a docs-only pull request (`docs/**`, `.claude/**`, root `*.md`) the `product` job goes green without running its steps; `apps/docs/scripts/lib/ci-scope.mjs` decides, and anything it cannot decide runs everything. Pushes to `main` always run all twelve.
```

The blank lines above and below the paragraph stay. The paragraph after it, which starts "One quirk worth knowing", stays.

```bash
wc -c CLAUDE.md
```

Expected: `14284`. If it differs, the replacement was not exact. Fix the paragraph. Do not shorten anything else and do not touch `CEILING`.

- [ ] **Step 4: `docs/CONTINUE.md` §4 receives the history**

Find the heading `## 5. Open decisions — these need a human, don't guess`. Two lines above it is a line that contains only `---`. Directly above that `---` line, insert this paragraph and one blank line after it:

```markdown
**`format:check`, and the hook that used to block a repo-wide format.**
`format:check` joined CI on 2026-09-07, when the tree was made
prettier-clean. The bash hook used to deny a repo-wide format on the grounds
that `check-contract.mts`'s guidance regexes could not survive re-wrapping;
measured, they can — `\s*` spans newlines and prettier never splits a string
literal. The only real breakage was the two `gen-wiring.mts` outputs being
reformatted out of byte-agreement with their generator, and they are now
prettier-ignored. (Moved here from `CLAUDE.md` on 2026-09-18 to make room for
the docs-only CI scope.)
```

Check:

```bash
grep -c "joined the list on 2026-09-07" CLAUDE.md
grep -c "joined CI on 2026-09-07" docs/CONTINUE.md
```

Expected: `0`, then `1`.

- [ ] **Step 5: Pinned test and format**

```bash
pnpm --filter docs exec vitest run scripts/lib/claude-md.test.ts
pnpm format:check
```

Expected: all green. If `format:check` names one of your files, run `pnpm exec prettier --write <that file>` and confirm with `git diff` that only whitespace moved.

- [ ] **Step 6: Commit**

```bash
git add .claude/skills/gate-run/run-gates.sh .claude/skills/gate-run/SKILL.md CLAUDE.md docs/CONTINUE.md
git commit -m "docs(ci): say where CI can skip, and move the format:check history out of CLAUDE.md"
```

Append your session's attribution trailer to the message.

---

### Task 3: The gate, the pull request, and the proof

**Files:**

- Create, on a throwaway branch only: `docs/ci-scope-proof.md`. It is never merged.

**Interfaces:**

- Consumes: the branch `claude/ci-scope` with Tasks 1 and 2 committed.
- Produces: one open pull request for Nick, and a closed proof pull request whose run shows the skip.

- [ ] **Step 1: Run the full local gate**

Make sure nothing is listening on port 3100, then from the repo root:

```bash
.claude/skills/gate-run/run-gates.sh
```

Expected: `All gates green.` It takes about ten minutes. If a gate is red, report it with its output. The only code this plan adds is one module and one test, so a red Playwright, Storybook or consumer gate is very unlikely to be yours.

- [ ] **Step 2: Push and open the pull request**

```bash
git remote -v
```

Say the target out loud: repository `VV-DSGN-INC/Super-AI-Components`, branch `claude/ci-scope`, base `main`. Then:

```bash
git push -u origin HEAD
gh pr create --base main --title "ci: cancel superseded PR runs, and skip product steps on docs-only PRs" --body-file - <<'EOF'
TL;DR: a new push to a pull request cancels the run it replaces, and a docs-only pull request no longer waits for the product job. No gate is removed or weakened.

- Concurrency is keyed by pull request number, and by commit SHA on main, so nothing on main is ever cancelled or queued.
- `apps/docs/scripts/lib/ci-scope.mjs` decides what is docs-only: `docs/`, `.claude/`, root `*.md`. It fails open, and 29 tests cover it, including the shape of `ci.yml`.
- Guards sit on steps, never on the workflow, so the `product` check always reports. `gates` is never scoped.
- `CLAUDE.md` is 211 bytes smaller: the `format:check` history moved to `CONTINUE.md` §4.

Measured payoff: about two and a half minutes on roughly one pull request in eight. Spec: `docs/superpowers/specs/2026-09-18-ci-concurrency-and-scope-design.md`.
EOF
```

Append the pull request attribution line your session was given. Nick edits the body by hand before anyone else reads it.

- [ ] **Step 3: Watch the heavy path**

This pull request changes `ci.yml` and a file under `apps/`, so it is heavy.

```bash
gh pr checks --watch
RUN=$(gh run list --branch claude/ci-scope --workflow ci.yml --limit 1 --json databaseId -q '.[0].databaseId')
gh run view "$RUN" --log | grep "scope: heavy="
```

Expected: `gates` and `product` both pass, and the log line reads `scope: heavy=true`.

- [ ] **Step 4: Open the proof pull request (D4)**

A gate that has only ever passed has proved nothing, so watch the skip happen once. The proof is stacked on your branch, because a pull request runs the workflow from its own merge commit.

```bash
git switch -c claude/ci-scope-proof
printf '# CI scope proof\n\nThrowaway. Never merge.\n' > docs/ci-scope-proof.md
git add docs/ci-scope-proof.md
git commit -m "chore: ci-scope proof (never merge)"
git push -u origin HEAD
gh pr create --draft --base claude/ci-scope --title "PROOF, do not merge: docs-only CI scope" --body "Throwaway pull request that shows the product job skipping on a docs-only change. It will be closed without merging."
printf '\nSecond push, to watch the first run get cancelled.\n' >> docs/ci-scope-proof.md
git commit -am "chore: ci-scope proof, second push"
git push
```

Run the last three commands straight after `gh pr create`, while the first run is still going.

- [ ] **Step 5: Read the proof**

```bash
gh pr checks --watch
gh run list --branch claude/ci-scope-proof --workflow ci.yml --limit 2 --json databaseId,conclusion -q '.[] | "\(.databaseId) \(.conclusion)"'
RUN=$(gh run list --branch claude/ci-scope-proof --workflow ci.yml --limit 1 --json databaseId -q '.[0].databaseId')
gh run view "$RUN" --json jobs -q '.jobs[] | select(.name=="product") | .steps[] | "\(.conclusion)\t\(.name)"'
gh run view "$RUN" --log | grep "scope: heavy="
```

Expected:

- two runs: the newer one `success`, the older one `cancelled`. If the older one says `success`, it finished before the second push arrived; that is a timing miss, not a defect. Say so in your report.
- in the `product` job: `success` for "Set up job", the checkout and "Scope", then `skipped` for every other step until the post steps.
- the log line `scope: heavy=false`.
- `gates` ran in full and passed.

If `product` ran its steps, or went red, stop and report. Do not merge anything.

- [ ] **Step 6: Remove the proof**

```bash
gh pr close claude/ci-scope-proof --delete-branch
git switch claude/ci-scope
git branch -D claude/ci-scope-proof
git status --short
```

Expected: the pull request is closed, the remote branch is gone, and the working tree is clean. `docs/ci-scope-proof.md` must not exist on `claude/ci-scope`.

- [ ] **Step 7: Report**

Give Nick the pull request URL, the two run ids from Step 5 with their conclusions, and the `heavy=` line from each path. Do not merge.

---

## Self-review against the spec

| spec section                          | where the plan does it                                 |
| ------------------------------------- | ------------------------------------------------------ |
| §2.1 concurrency, keyed by PR or SHA  | Task 1 Step 6; asserted by the last wiring test        |
| §2.2 the module, three light patterns | Task 1 Steps 2 to 5 and 10                             |
| §2.2 fails open                       | the heavy cases in Step 2; the shell in Step 7         |
| §2.3 wiring, step guards only         | Task 1 Step 7; five wiring tests                       |
| §2.4 29 tests, red then green         | Task 1 Steps 3, 5 and 8                                |
| §2.5 four written mirrors             | Task 2 Steps 1 to 4                                    |
| §2.6 `CLAUDE.md` at 14,284 bytes      | Task 2 Step 3                                          |
| §3 D1 to D4                           | "Decisions Nick makes before Task 1 starts"            |
| §4 acceptance                         | Task 1 Step 8, Task 2 Step 5, Task 3 Steps 1, 3 and 5  |
| §5 not in scope                       | `gates` is never edited; no branch protection is added |
