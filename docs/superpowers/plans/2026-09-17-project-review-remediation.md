# Project Review Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the eight findings of the 2026-09-17 project review: license the repo, state the Base UI requirement everywhere the install command appears, clear the Next.js advisories, make the deploy-state section of CONTINUE.md derivable, split CI so a red gate cannot hide the product gates, reach zero lint warnings, give the docs site dark mode, a mobile nav and a grouped home, and deploy the contracts layer to production.

**Architecture:** Eight independent tasks, each on its own branch cut from `main` and merged as its own PR, in the order below. Tasks 1 to 7 change one surface each and carry their own test; Task 8 is the deploy that publishes all of them at once and is gated on an explicit go from Nick. Nothing here touches component behaviour, the catalog, or any gate baseline.

**Tech Stack:** pnpm 11 workspaces + Turborepo; Next.js 16 App Router, React 19, Tailwind 4, Base UI via shadcn `base-nova`; Vitest 4 (jsdom) for unit tests; Playwright for the docs smoke gate; `tsx` for scripts; GitHub Actions; Vercel CLI 59 for the manual deploy.

**Spec:** [`../specs/2026-09-17-project-review-remediation-design.md`](../specs/2026-09-17-project-review-remediation-design.md). The spec's §2 has one finding per task; its §1 table is the measurement each task's verification re-derives.

## Global Constraints

- Use `pnpm`, never npm; CI installs with `--frozen-lockfile`, so any dependency change must update `pnpm-lock.yaml` in the same commit.
- Branch per task, cut from `main`; never commit to `main`. Confirm the remote is `VV-DSGN-INC/Super-AI-Components` before any push (`git remote -v`).
- Every task ends with the local gate mirror, `.claude/skills/gate-run/run-gates.sh`, green from the repo root. Doc-only tasks may run the subset named in the task while iterating, but the full script runs before the PR opens.
- `pnpm format` runs before every commit that touches `.md`, `.ts`, `.tsx`, `.mts` or `.yml`; `format:check` is a CI gate. `.prettierrc.json` sets `printWidth: 110`; markdown prose is not re-wrapped (`proseWrap` is the default `preserve`).
- `CLAUDE.md` is pinned at or under **14,500 bytes** and must stay within 2,000 bytes of that ceiling (`apps/docs/scripts/lib/claude-md.test.ts`). It is 14,244 bytes today. Only Task 5 edits it, and only by the amount the task states.
- `apps/docs/public/llms.txt`, `public/llms-full.txt`, `public/llms/components/*.md`, `registry/super-ai/*.meta.json` and `index/components.toon` are derived. Never hand-edit them; run `pnpm contract:emit` from `apps/docs` and commit what it writes.
- The a11y exclusion list and `story-coverage.baseline.json` may only shrink. No task here touches either.
- Commit messages are conventional (`feat(scope): …`, `fix(scope): …`, `docs(scope): …`, `chore(scope): …`) and end with the attribution trailer this session was given.
- Registry sources (`apps/docs/registry/super-ai/*.tsx`) are consumer-facing: any edit there is followed by `pnpm build:registry` and the full gate, because the consumer install test is what proves the registry still installs.

## Decisions Nick makes before Task 1 starts

| #   | decision                        | default the plan assumes                                                                                                      | alternatives                                                     |
| --- | ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| D1  | License                         | **MIT**, the license of shadcn/ui and of the vendored `components/ui` files                                                   | Apache-2.0 (what AI Elements uses)                               |
| D2  | Copyright holder on the LICENSE | `Nick Vyhouski` (the commit author)                                                                                           | `VV DSGN Inc.` (the GitHub org) if that is the legal entity      |
| D3  | Task 5, split CI into two jobs  | **Do it**: a red `gates` step stops hiding the product gates; wall clock drops by about two minutes; cost is one more install | Skip Task 5; leave `verify` serial                               |
| D4  | Task 8, deploy to production    | **Waits for an explicit "go"** in chat; the task is written so that go is its first step                                      | Defer; production keeps serving code without the contracts layer |

## Task order and why

1. **Task 1 LICENSE** and **Task 2 compatibility claim** first: they are text, they unblock consumers, and Task 7 renders Task 2's constant on the home page.
2. **Task 3 Next.js bump** before anything that builds the site, so every later gate run is on the version that ships.
3. **Task 4 prod-diff and CONTINUE refresh** before Task 8, which quotes its output.
4. **Task 5 CI split** and **Task 6 lint zero** are independent of everything and cheap.
5. **Task 7 docs site** is the largest change and touches the same page and smoke spec as Task 2, so it goes after Task 2 has merged.
6. **Task 8 deploy** last, once every PR above is on `main`, so one upload publishes everything.

Tasks 1, 3, 5 and 6 can run in parallel worktrees. Tasks 2 → 7 and 4 → 8 are ordered.

---

### Task 1: LICENSE, third-party notices, and the test that keeps them

**Review finding:** F1. The public repo has no license.

**Files:**

- Create: `LICENSE`
- Create: `THIRD_PARTY_NOTICES.md`
- Create: `licenses/Apache-2.0.txt` (fetched, verbatim)
- Modify: `package.json` (root, add `"license": "MIT"` after `"private": true`)
- Modify: `README.md` (append a `## License` section at the end of the file)
- Test: `apps/docs/scripts/lib/license.test.ts`

**Interfaces:**

- Consumes: nothing.
- Produces: `LICENSE` at the repo root, which Task 2's README edit sits above and Task 8's deploy ships (Vercel serves nothing from it; the file is for the repo and the `shadcn add` consumer who reads the source).

- [ ] **Step 1: Cut the branch**

```bash
git switch main && git pull --ff-only origin main
git switch -c claude/license
```

- [ ] **Step 2: Write the failing test**

Create `apps/docs/scripts/lib/license.test.ts`. Vitest runs with `globals: true` in this workspace, so `describe`, `it` and `expect` need no import (see `claude-md.test.ts` beside it).

```ts
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const REPO = resolve(__dirname, "../../../..");
const read = (file: string) => readFileSync(join(REPO, file), "utf8");

describe("license", () => {
  it("ships an MIT LICENSE file at the repo root", () => {
    expect(existsSync(join(REPO, "LICENSE"))).toBe(true);
    expect(read("LICENSE")).toContain("MIT License");
    expect(read("LICENSE")).toMatch(/Copyright \(c\) 2026 /);
  });

  it("declares the same license in the root package.json", () => {
    const pkg = JSON.parse(read("package.json")) as { license?: string };
    expect(pkg.license).toBe("MIT");
  });

  it("names both vendored licenses and ships the Apache text", () => {
    const notices = read("THIRD_PARTY_NOTICES.md");
    expect(notices).toContain("shadcn/ui");
    expect(notices).toContain("AI Elements");
    expect(notices).toContain("Apache-2.0");
    expect(read("licenses/Apache-2.0.txt")).toContain("Apache License");
  });

  it("points the README at the license", () => {
    expect(read("README.md")).toMatch(/^## License/m);
    expect(read("README.md")).toContain("THIRD_PARTY_NOTICES.md");
  });
});
```

- [ ] **Step 3: Run it to verify it fails**

Run from `apps/docs`:

```bash
pnpm exec vitest run scripts/lib/license.test.ts
```

Expected: 4 failed. The first message is `ENOENT ... LICENSE` or `expected false to be true`.

- [ ] **Step 4: Write LICENSE**

Create `LICENSE` at the repo root. Replace the holder if D2 chose the org.

```text
MIT License

Copyright (c) 2026 Nick Vyhouski

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

- [ ] **Step 5: Fetch the Apache text and write the notices**

Apache-2.0 §4 requires the license text to travel with the vendored AI Elements files. Fetch it verbatim rather than typing it:

```bash
mkdir -p licenses
curl -fsSL https://www.apache.org/licenses/LICENSE-2.0.txt -o licenses/Apache-2.0.txt
head -3 licenses/Apache-2.0.txt
```

Expected: the first non-blank line is `Apache License`.

Create `THIRD_PARTY_NOTICES.md`:

```markdown
# Third-party notices

This repository is MIT licensed (see [LICENSE](LICENSE)). It also carries vendored copies of third-party code, which keep their own terms.

| paths                                                                                 | origin                                                                                                                    | license                                                            |
| ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `apps/docs/components/ui/**`, `apps/storybook/src/components/ui/**`                   | [shadcn/ui](https://ui.shadcn.com), `base-nova` style on Base UI primitives                                               | MIT, Copyright (c) 2023 shadcn                                     |
| `apps/docs/components/ai-elements/**`, `apps/storybook/src/components/ai-elements/**` | [AI Elements](https://elements.ai-sdk.dev), vendored from `registry.ai-sdk.dev` with the Base UI edits noted in each file | Apache-2.0, see [licenses/Apache-2.0.txt](licenses/Apache-2.0.txt) |

`apps/docs/registry/marketing/**` was rebuilt from [Magic UI](https://magicui.design) as a behavioural reference only; no Magic UI source is copied (`docs/superpowers/specs/2026-07-31-marketing-mini-components-design.md`, "Sourcing"). No notice is owed.

The shadcn/ui MIT notice, reproduced as its license requires:

> Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions: The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
```

- [ ] **Step 6: Declare the license in package.json and the README**

In the root `package.json`, after `"private": true,` add:

```json
  "license": "MIT",
```

Append to the end of `README.md`:

```markdown
## License

MIT, see [LICENSE](LICENSE). Vendored shadcn/ui (MIT) and AI Elements (Apache-2.0) files keep their own terms; see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
```

- [ ] **Step 7: Run the test to verify it passes**

Run from `apps/docs`:

```bash
pnpm exec vitest run scripts/lib/license.test.ts
```

Expected: 4 passed.

- [ ] **Step 8: Format, run the gate, commit**

From the repo root:

```bash
pnpm format && pnpm format:check
.claude/skills/gate-run/run-gates.sh
git add LICENSE THIRD_PARTY_NOTICES.md licenses/Apache-2.0.txt package.json README.md apps/docs/scripts/lib/license.test.ts
git commit -m "chore(license): MIT license, third-party notices, and the test that pins them"
```

Expected from the gate: `All gates green.`

- [ ] **Step 9: Push and open the PR**

```bash
git remote -v   # must read VV-DSGN-INC/Super-AI-Components
git push -u origin claude/license
gh pr create --base main --title "chore(license): MIT license and third-party notices" --body "Closes review finding F1 (docs/superpowers/specs/2026-09-17-project-review-remediation-design.md). Adds LICENSE (MIT), THIRD_PARTY_NOTICES.md for the vendored shadcn/ui (MIT) and AI Elements (Apache-2.0) files, the Apache text, the package.json license field, and scripts/lib/license.test.ts which fails if any of them go missing."
```

---

### Task 2: One compatibility note, rendered everywhere the install command is

**Review finding:** F2. "Install (any shadcn app)" is false; a Radix consumer fails to typecheck.

**Files:**

- Create: `apps/docs/lib/install.ts`
- Modify: `README.md:7-11` (the Install heading and its intro)
- Modify: `apps/docs/app/components/[name]/page.tsx:87-92` (the Installation block)
- Modify: `apps/docs/scripts/lib/contract-emit.ts:1-6` (import) and `:175-181` (the `HEADER` template)
- Modify: `apps/docs/scripts/lib/contract-emit.test.ts:131-140` (the `renderLlmsTxt` test)
- Modify: `apps/docs/e2e/smoke.spec.ts` (one new test, one new import)
- Regenerate: `apps/docs/public/llms.txt`, `apps/docs/public/llms-full.txt` via `pnpm contract:emit`
- Test: `apps/docs/scripts/lib/readme.test.ts`

**Interfaces:**

- Consumes: nothing.
- Produces: `COMPAT_NOTE: string` exported from `apps/docs/lib/install.ts`. Task 7's home page imports it. The string is plain prose with no backticks or markdown, so the same bytes render in JSX, markdown and `llms.txt`, and a test can match them verbatim.

- [ ] **Step 1: Cut the branch**

```bash
git switch main && git pull --ff-only origin main
git switch -c claude/install-compat-note
```

- [ ] **Step 2: Write the failing README test**

Create `apps/docs/scripts/lib/readme.test.ts`:

```ts
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { COMPAT_NOTE } from "../../lib/install";

const REPO = resolve(__dirname, "../../../..");

describe("README install section", () => {
  const readme = readFileSync(join(REPO, "README.md"), "utf8");

  it("carries the compatibility note verbatim, so the README and the site cannot disagree", () => {
    expect(readme).toContain(COMPAT_NOTE);
  });

  it("no longer promises any shadcn app", () => {
    expect(readme).not.toContain("any shadcn app");
  });
});
```

- [ ] **Step 3: Extend the llms.txt test**

In `apps/docs/scripts/lib/contract-emit.test.ts`, add the import next to the other `@/lib` imports at the top of the file:

```ts
import { COMPAT_NOTE } from "@/lib/install";
```

and inside the existing `describe("renderLlmsTxt", …)` block, after `expect(txt).toContain("outrank these pages");`, add:

```ts
expect(txt).toContain(COMPAT_NOTE);
```

- [ ] **Step 4: Run both to verify they fail**

Run from `apps/docs`:

```bash
pnpm exec vitest run scripts/lib/readme.test.ts scripts/lib/contract-emit.test.ts
```

Expected: the run fails to resolve `lib/install` (module not found). That is the failure for this step.

- [ ] **Step 5: Create the constant**

Create `apps/docs/lib/install.ts`:

```ts
/** The one sentence every install surface repeats. The README, the docs page's
 *  Installation block and the llms.txt header all render this constant, and
 *  scripts/lib/readme.test.ts fails if the README stops carrying it verbatim.
 *
 *  Plain prose on purpose: no backticks, no markdown, so the same bytes are
 *  correct in JSX, in a .md file and in llms.txt. Evidence for the claim:
 *  reviews/2026-09-10/evidence/super-ai-radix-consumer.log.txt, and
 *  CONTINUE.md §5.1 ("no registry mechanism expresses '…but adapted'"). */
export const COMPAT_NOTE =
  "Requires a shadcn app on Base UI (style base-nova). Radix-based styles such as new-york fail to typecheck: these components use Base UI's render prop and callbacks like onOpenChangeComplete, which Radix primitives do not have.";
```

- [ ] **Step 6: Render it in the README**

In `README.md`, replace lines 7 to 11:

````markdown
## Install (any shadcn app)

```bash
npx shadcn@latest add https://super-ai-components.vercel.app/r/thread-list.json
```
````

with:

````markdown
## Install (shadcn apps on Base UI)

Requires a shadcn app on Base UI (style base-nova). Radix-based styles such as new-york fail to typecheck: these components use Base UI's render prop and callbacks like onOpenChangeComplete, which Radix primitives do not have.

```bash
npx shadcn@latest add https://super-ai-components.vercel.app/r/thread-list.json
```
````

The sentence must be byte-identical to `COMPAT_NOTE`; the test in Step 2 checks that.

- [ ] **Step 7: Render it on the component page**

In `apps/docs/app/components/[name]/page.tsx`, add to the imports (alphabetical among the `@/lib` imports):

```tsx
import { COMPAT_NOTE } from "@/lib/install";
```

and replace the Installation block:

```tsx
<div className="space-y-2">
  <h2 className="text-lg font-semibold">Installation</h2>
  <pre className="bg-muted overflow-x-auto rounded-lg p-4 text-xs">
    <code>{`npx shadcn@latest add https://super-ai-components.vercel.app/r/${name}.json`}</code>
  </pre>
</div>
```

with:

```tsx
<div className="space-y-2">
  <h2 className="text-lg font-semibold">Installation</h2>
  <pre className="bg-muted overflow-x-auto rounded-lg p-4 text-xs">
    <code>{`npx shadcn@latest add https://super-ai-components.vercel.app/r/${name}.json`}</code>
  </pre>
  <p data-slot="install-compat" className="text-muted-foreground text-xs">
    {COMPAT_NOTE}
  </p>
</div>
```

`{COMPAT_NOTE}` is an expression, so the apostrophe in "Base UI's" never hits `react/no-unescaped-entities`, which is an error in this app (CONTINUE.md §4).

- [ ] **Step 8: Render it in the llms.txt header**

In `apps/docs/scripts/lib/contract-emit.ts`, add after the two existing `import type` lines (a relative import, matching how the `.mts` scripts in this folder import runtime values):

```ts
import { COMPAT_NOTE } from "../../lib/install";
```

and in the `HEADER` template, after the line that begins `Install one item:`, insert one line:

```ts
${COMPAT_NOTE}
```

so the template reads:

```ts
const HEADER = `# Super AI Components

> A shadcn-style registry of AI-interface components: primitives, components and blocks installed one item at a time with \`npx shadcn add\`, on stock shadcn tokens plus \`--warning\`. Code is the source of truth; every page here derives from the component's guidance module.

Install one item: \`npx shadcn@latest add ${DOCS_URL}/r/<name>.json\`. Each item installs its component and a \`<name>.meta.json\` beside it.
${COMPAT_NOTE}
Retrieval order: with an item installed, read \`components/super-ai/<name>.meta.json\` first; it is version-locked to the installed code and its contents outrank these pages. Before installing, read the component's page below, then the full corpus if you are choosing between several.
`;
```

- [ ] **Step 9: Regenerate the derived corpus**

Run from `apps/docs`:

```bash
pnpm contract:emit
git status --short public/
```

Expected: exactly `public/llms.txt` and `public/llms-full.txt` modified; no `public/llms/components/*.md` change (component pages do not include `HEADER`).

- [ ] **Step 10: Run the unit tests to verify they pass**

Run from `apps/docs`:

```bash
pnpm exec vitest run scripts/lib/readme.test.ts scripts/lib/contract-emit.test.ts
```

Expected: all passed, including the drift assertions in `contract-emit.test.ts` that byte-compare `public/llms*.txt` with what the emitter produces.

- [ ] **Step 11: Add the smoke assertion**

In `apps/docs/e2e/smoke.spec.ts`, add to the imports:

```ts
import { COMPAT_NOTE } from "../lib/install";
```

and append this test after the `for (const item of …)` loop:

```ts
test("the Installation block states the Base UI requirement", async ({ page }) => {
  await page.goto("/components/kbd");
  await expect(page.locator('[data-slot="install-compat"]')).toHaveText(COMPAT_NOTE);
});
```

- [ ] **Step 12: Build and run the smoke gate**

`next start` serves the prebuilt output, so rebuild first. From the repo root:

```bash
pnpm build
CI=1 pnpm --filter docs exec playwright test -g "Installation block"
```

Expected: 1 passed.

- [ ] **Step 13: Format, run the full gate, commit**

```bash
pnpm format && pnpm format:check
.claude/skills/gate-run/run-gates.sh
git add README.md apps/docs/lib/install.ts 'apps/docs/app/components/[name]/page.tsx' apps/docs/scripts/lib/contract-emit.ts apps/docs/scripts/lib/contract-emit.test.ts apps/docs/scripts/lib/readme.test.ts apps/docs/e2e/smoke.spec.ts apps/docs/public/llms.txt apps/docs/public/llms-full.txt
git commit -m "docs(install): state the Base UI requirement in the README, the page and llms.txt from one constant"
```

Expected: `All gates green.`

- [ ] **Step 14: Push and open the PR**

```bash
git push -u origin claude/install-compat-note
gh pr create --base main --title "docs(install): one compatibility note, rendered in the README, the page and llms.txt" --body "Closes review finding F2 / SAI-02's consumer-facing half. COMPAT_NOTE in apps/docs/lib/install.ts is rendered by the README (pinned verbatim by scripts/lib/readme.test.ts), the component page's Installation block (smoke-tested) and the llms.txt header (drift-tested). The Radix typecheck failure itself stays open in CONTINUE.md §5.1; this makes the requirement visible before install instead of after."
```

---

### Task 3: Next.js 16.3.5 and Dependabot

**Review finding:** F6. `next@16.2.9` carries 11 advisories, 2 critical, fixed in 16.3.3.

**Files:**

- Modify: `apps/docs/package.json` (`next`, `eslint-config-next`)
- Modify: `pnpm-lock.yaml` (by `pnpm add`)
- Create: `.github/dependabot.yml`

**Interfaces:**

- Consumes: nothing.
- Produces: nothing other tasks import. Task 7 builds on this Next version.

- [ ] **Step 1: Cut the branch and record the starting audit**

```bash
git switch main && git pull --ff-only origin main
git switch -c claude/next-16-3-and-dependabot
cd apps/docs && pnpm audit --prod 2>&1 | grep -c "Next.js"
```

Expected: `11`. This is the number the task drives to zero.

- [ ] **Step 2: Bump next and its ESLint config together**

They ship in lockstep; a mismatch makes `eslint-config-next` lint against rules for a version that is not installed. From `apps/docs`:

```bash
pnpm add next@16.3.5 eslint-config-next@16.3.5
git -C ../.. diff --stat
```

Expected: exactly two files changed, `apps/docs/package.json` and `pnpm-lock.yaml`.

- [ ] **Step 3: Verify the lockfile is frozen-installable and the advisories are gone**

From the repo root:

```bash
pnpm install --frozen-lockfile
cd apps/docs && pnpm audit --prod 2>&1 | grep -c "Next.js"; pnpm audit --prod 2>&1 | tail -3
```

Expected: `0` for the grep. The tail shows the remaining count, which is now tooling only (`sharp`, `postcss`, `js-yaml`, …, all reachable through the `shadcn` CLI dependency, not through anything a registry item declares).

- [ ] **Step 4: Add Dependabot**

Create `.github/dependabot.yml`:

```yaml
version: 2
updates:
  # Minor and patch bumps arrive as one grouped PR a week. Majors arrive alone.
  - package-ecosystem: npm
    directory: /
    schedule:
      interval: weekly
      day: monday
    open-pull-requests-limit: 3
    groups:
      minor-and-patch:
        update-types: [minor, patch]
    ignore:
      # The primitive every registry item sits on. A bump is a deliberate PR
      # run through the full gate, not a scheduled one (spec F6).
      - dependency-name: "@base-ui/react"
  - package-ecosystem: github-actions
    directory: /
    schedule:
      interval: weekly
      day: monday
```

Dependabot reads `pnpm-workspace.yaml` from `directory: /` and covers all three workspaces.

- [ ] **Step 5: Run the gates**

The Next bump is the one change here that can break a build; the smoke gate and the consumer test are the proof. From the repo root:

```bash
pnpm format && pnpm format:check
.claude/skills/gate-run/run-gates.sh
```

Expected: `All gates green.` If `pnpm build` fails on a Next 16.3 change, read the error before touching anything: the only files this task may edit are the three listed above. A build failure means the bump needs its own investigation, and the task stops and reports.

- [ ] **Step 6: Commit, push, PR**

```bash
git add apps/docs/package.json pnpm-lock.yaml .github/dependabot.yml
git commit -m "chore(deps): next 16.3.5 clears eleven advisories; dependabot groups the rest weekly"
git push -u origin claude/next-16-3-and-dependabot
gh pr create --base main --title "chore(deps): Next.js 16.3.5 and Dependabot" --body "Closes review finding F6. next 16.2.9 → 16.3.5 (with eslint-config-next) removes the 11 Next advisories from pnpm audit --prod, two of them critical. Dependabot groups minor+patch bumps into one weekly PR and ignores @base-ui/react, which is bumped deliberately (spec F6). Full gate green."
```

---

### Task 4: `pnpm prod:diff`, and CONTINUE.md §1, §7 and §8 brought back to what is true

**Review finding:** F4. The status prose is stale in the pessimistic direction; make §7 derivable.

**Files:**

- Create: `apps/docs/scripts/lib/prod-diff.ts`
- Create: `apps/docs/scripts/prod-diff.mts`
- Modify: `apps/docs/package.json` (one script)
- Modify: `docs/CONTINUE.md:7` (header date), `:20-24` (§1 table rows), `:809-843` (§7), `:1014-1018` (the expired §8 bullet)
- Test: `apps/docs/scripts/lib/prod-diff.test.ts`

**Interfaces:**

- Consumes: `DOCS_URL` from `apps/docs/scripts/lib/contract-emit.ts` (`"https://super-ai-components.vercel.app"`).
- Produces: `compareItem(local, remote): Verdict`, `summarize(verdicts): Summary`, `renderTable(summary, measuredOn): string` from `scripts/lib/prod-diff.ts`; the `pnpm prod:diff` script, which Task 8 runs as its post-deploy check and whose output §7 quotes.

- [ ] **Step 1: Cut the branch**

```bash
git switch main && git pull --ff-only origin main
git switch -c claude/prod-diff
```

- [ ] **Step 2: Write the failing unit test**

Create `apps/docs/scripts/lib/prod-diff.test.ts`:

```ts
import { compareItem, renderTable, summarize, type RegistryItemJson, type Verdict } from "./prod-diff";

const local: RegistryItemJson = {
  name: "kbd",
  files: [
    { path: "registry/super-ai/kbd.tsx", content: "export const Kbd = 1;" },
    { path: "registry/super-ai/kbd.meta.json", content: '{"generated":"2026-09-17"}' },
  ],
  dependencies: [],
  registryDependencies: [],
};
const code = local.files![0];
const meta = local.files![1];

describe("compareItem", () => {
  it("is identical when every file and dependency list matches, whatever the order", () => {
    expect(compareItem(local, { ...local, files: [meta, code] })).toBe("identical");
  });

  it("is contract when only the meta file is absent or differs", () => {
    expect(compareItem(local, { ...local, files: [code] })).toBe("contract");
    expect(compareItem(local, { ...local, files: [code, { ...meta, content: "{}" }] })).toBe("contract");
  });

  it("is code when a component file differs, even if the meta matches", () => {
    expect(
      compareItem(local, { ...local, files: [{ ...code, content: "export const Kbd = 2;" }, meta] }),
    ).toBe("code");
  });

  it("is code when a dependency list differs with identical files", () => {
    expect(compareItem(local, { ...local, dependencies: ["lucide-react"] })).toBe("code");
    expect(compareItem(local, { ...local, registryDependencies: ["button"] })).toBe("code");
  });

  it("is missing when production has no such item", () => {
    expect(compareItem(local, null)).toBe("missing");
  });
});

describe("summarize and renderTable", () => {
  it("counts every verdict and renders the table §7 quotes", () => {
    const verdicts = new Map<string, Verdict>([
      ["a", "identical"],
      ["b", "contract"],
      ["c", "code"],
      ["d", "missing"],
      ["e", "identical"],
    ]);
    const s = summarize(verdicts);
    expect(s).toEqual({ total: 5, identical: 2, contract: 1, code: 1, missing: 1 });

    const table = renderTable(s, "2026-09-17");
    expect(table).toContain("| measured 2026-09-17");
    expect(table).toMatch(/^\| items compared +\| +5 \|$/m);
    expect(table).toMatch(/^\| absent from production +\| +1 \|$/m);
    // Every row is the same width, so prettier leaves the table alone.
    const widths = new Set(table.split("\n").map((line) => line.length));
    expect(widths.size).toBe(1);
  });
});
```

- [ ] **Step 3: Run it to verify it fails**

From `apps/docs`:

```bash
pnpm exec vitest run scripts/lib/prod-diff.test.ts
```

Expected: fails to resolve `./prod-diff`.

- [ ] **Step 4: Write the pure module**

Create `apps/docs/scripts/lib/prod-diff.ts`:

```ts
/** Pure comparison of a locally built registry item against the copy
 *  production serves. All IO is in scripts/prod-diff.mts; this file is what the
 *  unit test covers, so the verdict rules cannot drift from the report. */

export interface RegistryFile {
  path: string;
  content?: string;
}

export interface RegistryItemJson {
  name: string;
  files?: RegistryFile[];
  dependencies?: string[];
  registryDependencies?: string[];
}

/** identical: every file and dependency list matches.
 *  contract:  only `.meta.json` files differ or are absent. The component code
 *             is deployed; the contracts layer (PR #56) is not.
 *  code:      a component file or a dependency list differs.
 *  missing:   production has no such item. */
export type Verdict = "identical" | "contract" | "code" | "missing";

const isMeta = (f: RegistryFile) => f.path.endsWith(".meta.json");

function fingerprint(item: RegistryItemJson, keepMeta: boolean): string {
  const files = (item.files ?? [])
    .filter((f) => keepMeta || !isMeta(f))
    .map((f) => [f.path, f.content ?? ""] as const)
    .sort(([a], [b]) => a.localeCompare(b));
  return JSON.stringify({
    files,
    dependencies: [...(item.dependencies ?? [])].sort(),
    registryDependencies: [...(item.registryDependencies ?? [])].sort(),
  });
}

export function compareItem(local: RegistryItemJson, remote: RegistryItemJson | null): Verdict {
  if (remote === null) return "missing";
  if (fingerprint(local, true) === fingerprint(remote, true)) return "identical";
  if (fingerprint(local, false) === fingerprint(remote, false)) return "contract";
  return "code";
}

export interface Summary {
  total: number;
  identical: number;
  contract: number;
  code: number;
  missing: number;
}

export function summarize(verdicts: ReadonlyMap<string, Verdict>): Summary {
  const s: Summary = { total: verdicts.size, identical: 0, contract: 0, code: 0, missing: 0 };
  for (const v of verdicts.values()) s[v] += 1;
  return s;
}

/** The markdown table CONTINUE.md §7 quotes verbatim. Right-aligned counts so
 *  prettier leaves the column widths alone. */
export function renderTable(s: Summary, measuredOn: string): string {
  const row = (label: string, n: number) => `| ${label.padEnd(27)} | ${String(n).padStart(5)} |`;
  return [
    `| ${`measured ${measuredOn}`.padEnd(27)} | count |`,
    `| ${"-".repeat(27)} | ----: |`,
    row("items compared", s.total),
    row("identical to `main`", s.identical),
    row("contract layer only differs", s.contract),
    row("component code differs", s.code),
    row("absent from production", s.missing),
  ].join("\n");
}
```

- [ ] **Step 5: Run the test to verify it passes**

From `apps/docs`:

```bash
pnpm exec vitest run scripts/lib/prod-diff.test.ts
```

Expected: 7 passed.

- [ ] **Step 6: Write the script**

Create `apps/docs/scripts/prod-diff.mts`:

```ts
// Measures production against this tree's registry build, item by item.
//
//   pnpm build:registry && pnpm prod:diff     table + lists; exit 1 unless everything is identical
//   pnpm prod:diff --report-only              same output, always exit 0
//   PROD_URL=https://<preview>.vercel.app pnpm prod:diff
//
// CONTINUE.md §7 quotes this script's table instead of describing the state in
// prose, because prose there has been wrong in both directions (§1's header).
// The verdict rules live in scripts/lib/prod-diff.ts, which is unit-tested.
import { existsSync, readFileSync } from "node:fs";

import { DOCS_URL } from "./lib/contract-emit";
import { compareItem, renderTable, summarize, type RegistryItemJson, type Verdict } from "./lib/prod-diff";

const base = (process.env.PROD_URL ?? DOCS_URL).replace(/\/$/, "");
const reportOnly = process.argv.includes("--report-only");

if (!existsSync("public/r/registry.json")) {
  console.error("prod:diff — public/r/registry.json is missing; run `pnpm build:registry` first.");
  process.exit(2);
}
const index = JSON.parse(readFileSync("public/r/registry.json", "utf8")) as { items: { name: string }[] };
const names = index.items.map((i) => i.name);

async function fetchItem(name: string): Promise<RegistryItemJson | null> {
  const res = await fetch(`${base}/r/${name}.json`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`${base}/r/${name}.json → HTTP ${res.status}`);
  return (await res.json()) as RegistryItemJson;
}

// Eight in flight: 134 items finish in a few seconds and the CDN never
// rate-limits a single run.
async function pool<T, R>(inputs: T[], size: number, fn: (t: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(inputs.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: size }, async () => {
      while (next < inputs.length) {
        const i = next++;
        out[i] = await fn(inputs[i]);
      }
    }),
  );
  return out;
}

const remotes = await pool(names, 8, fetchItem);
const verdicts = new Map<string, Verdict>();
names.forEach((name, i) => {
  const local = JSON.parse(readFileSync(`public/r/${name}.json`, "utf8")) as RegistryItemJson;
  verdicts.set(name, compareItem(local, remotes[i]));
});

// The derived corpus is served from public/ too, so it is part of "deployed".
const corpusDrift: string[] = [];
for (const file of ["llms.txt", "llms-full.txt"]) {
  const res = await fetch(`${base}/${file}`);
  const remote = res.ok ? await res.text() : null;
  if (remote !== readFileSync(`public/${file}`, "utf8"))
    corpusDrift.push(`${file}${remote === null ? " (404)" : ""}`);
}

const summary = summarize(verdicts);
console.log(renderTable(summary, new Date().toISOString().slice(0, 10)));
for (const kind of ["code", "contract", "missing"] as const) {
  const list = [...verdicts].filter(([, v]) => v === kind).map(([n]) => n);
  if (list.length) console.log(`\n${kind} (${list.length}): ${list.join(", ")}`);
}
if (corpusDrift.length) console.log(`\nderived corpus differs: ${corpusDrift.join(", ")}`);

const clean = summary.identical === summary.total && corpusDrift.length === 0;
console.log(
  clean
    ? "\nprod:diff — production matches this build."
    : "\nprod:diff — production differs from this build.",
);
if (!clean && !reportOnly) process.exit(1);
```

Add the script to `apps/docs/package.json`, after `"reconcile:deps"`:

```json
    "prod:diff": "tsx scripts/prod-diff.mts",
```

- [ ] **Step 7: Run it against production**

From `apps/docs`:

```bash
pnpm build:registry && pnpm prod:diff --report-only
```

Expected today (before Task 8): the table shows `items compared 134`, `identical 0`, `contract layer only differs 134`, `component code differs 0`, `absent 0`, then `derived corpus differs: llms.txt (404), llms-full.txt (404)` and `production differs from this build.` Copy the table: §7 quotes it in Step 9.

If `component code differs` is not 0, stop: something was deployed or merged since this plan was written, and §7 must say what. Do not paste a table you do not understand.

- [ ] **Step 8: Refresh the CONTINUE.md header and §1 rows**

`docs/CONTINUE.md` line 7, replace:

```markdown
**Last updated:** 2026-09-07, after wave 2 of the post-case-story remediation.
```

with:

```markdown
**Last updated:** 2026-09-17, after the project review (`superpowers/specs/2026-09-17-project-review-remediation-design.md`).
```

In the §1 table (lines 20 to 24), replace the `Branch`, `HEAD` and `Deployed` rows with:

```markdown
| Branch | `main`, at `e769e95` |
| HEAD | **PRs #53–#57 merged by 2026-09-17.** §1/§7 reconciliation, the sidebar-footer guard, the ScrollArea stub, the agentic contracts layer (#56) and contract wave 2 (#57) |
| Deployed | **Component code yes, contracts layer no.** `pnpm prod:diff` on 2026-09-17: 134 items compared, 0 differ in code, all 134 lack their `.meta.json`, `/llms.txt` 404s — see §7 |
```

Leave the `Pushed` row and the note under the table untouched; they are still true and the note is the reason this section exists.

- [ ] **Step 9: Rewrite §7**

Replace everything from `## 7. Deploy state` up to (not including) the `---` line that precedes `## 8.` with:

```markdown
## 7. Deploy state

**Production is measured, never estimated: `pnpm build:registry && pnpm prod:diff` from `apps/docs`.**
The script fetches every `/r/<name>.json` from production, compares each file's
contents and both dependency lists against the local build, and separates three
kinds of drift: component code, the contracts layer (the `.meta.json` inside each
item plus the `/llms*.txt` corpus), and items absent from production. It exits 1
unless everything is identical, so it doubles as the post-deploy check.
`PROD_URL=<preview url>` points it at a preview. The rules are in
`scripts/lib/prod-diff.ts` and unit-tested; `--report-only` always exits 0.

Deploys are manual, from `apps/docs`, with the `weeeha` GitHub account:
`vercel --prod`. The Vercel project is `super-ai-components`, root directory
`apps/docs`, and `.vercel/project.json` must already name it (§4, "Vercel project
linking") or the CLI creates a new project.

Last measurement, 2026-09-17, against `main` at `e769e95`:

<paste the table from Step 7 here>

derived corpus differs: llms.txt (404), llms-full.txt (404)

Everything production lacks is the contracts layer from PRs #56 and #57: the
`.meta.json` beside every component, `/llms.txt`, `/llms-full.txt` and the
`/llms/components/*.md` pages. Component code has been identical since the
2026-09-13 evening deploy, which landed after the previous version of this
section measured "97 differ" that same day. The figure was true when written and
wrong by midnight, which is why this section now quotes a script and a date
instead of a sentence.

---
```

- [ ] **Step 10: Retire the expired §8 bullet**

At line 1014, replace the `A8 preview-tile` bullet:

```markdown
- **A8 `preview-tile`** cannot name its own frame button unless the label is
  `overlay`, and its interactive frame is always a toggle (`aria-pressed`) even
  when the tile is an open action. O7 notes C4 `recent-grid` uses `below` +
  `onSelect` and therefore ships nameless buttons — **a latent violation in a
  shipped component, not yet caught by a gate.**
```

with:

```markdown
- **~~A8 `preview-tile` cannot name its own frame button unless the label is
  `overlay`~~ — fixed, and found expired on 2026-09-17.** `preview-tile.tsx` now
  takes an `aria-labelledby` branch for `labelPlacement="below"` and an
  `aria-label` branch from `frameLabel` for `"none"`, and `selectMode="open"`
  drops `aria-pressed`. `recent-grid.tsx` uses both: `below` in the grid layout,
  `none` + `frameLabel={title}` in the list layout, with a comment saying why. The
  "latent violation in a shipped component" this entry warned about is not in
  the shipped component; it was in this entry.
```

- [ ] **Step 11: Format and run the relevant gates**

From the repo root:

```bash
pnpm format && pnpm format:check
pnpm --filter docs typecheck && pnpm --filter docs test
```

Expected: green. Then the full mirror before the PR:

```bash
.claude/skills/gate-run/run-gates.sh
```

Expected: `All gates green.`

- [ ] **Step 12: Commit, push, PR**

```bash
git add apps/docs/scripts/lib/prod-diff.ts apps/docs/scripts/lib/prod-diff.test.ts apps/docs/scripts/prod-diff.mts apps/docs/package.json docs/CONTINUE.md
git commit -m "feat(prod-diff): measure production per item; CONTINUE §1/§7/§8 say what is true on 2026-09-17"
git push -u origin claude/prod-diff
gh pr create --base main --title "feat(prod-diff): pnpm prod:diff, and CONTINUE.md §7 quotes it" --body "Closes review finding F4. scripts/lib/prod-diff.ts (unit-tested) separates code drift from contracts-layer drift from missing items; scripts/prod-diff.mts fetches every /r/<name>.json plus the llms corpus and exits 1 unless identical. §1 and §7 now state the measured 2026-09-17 position (code identical, contracts layer undeployed) instead of the 97-differ figure that expired the evening it was written. The A8/C4 'nameless buttons' §8 entry is struck through: the fix is in source."
```

---

### Task 5: CI as two parallel jobs, with the written mirrors updated in the same commit

**Review finding:** F7. One serial job; a red early step hides the three product gates.

**Files:**

- Modify: `.github/workflows/ci.yml` (whole file)
- Modify: `.claude/skills/gate-run/run-gates.sh:1-5` (header comment only; the run order does not change)
- Modify: `.claude/skills/gate-run/SKILL.md:12-13`
- Modify: `CLAUDE.md:116-120` (the CI section's first three paragraphs)

**Interfaces:**

- Consumes: nothing.
- Produces: job names `gates` and `product`. `main` has no branch protection today (`gh api …/branches/main/protection` returns 404), so no required-check name needs updating. If protection is added later, require both.

- [ ] **Step 1: Cut the branch and record CLAUDE.md's size**

```bash
git switch main && git pull --ff-only origin main
git switch -c claude/ci-two-jobs
wc -c CLAUDE.md
```

Expected: `14244`. The ceiling is 14,500; this task may add at most 256 bytes to the file.

- [ ] **Step 2: Rewrite ci.yml**

Replace the whole of `.github/workflows/ci.yml` with:

```yaml
name: CI
on:
  push: { branches: [main] }
  pull_request:

# Two jobs from the same checkout. `gates` is the static and unit layer;
# `product` is the three steps that exercise what consumers install, plus the
# builds they need. They run in parallel so a red lint no longer hides a red
# consumer test (CLAUDE.md records that this happened). Both must pass. Within a
# job a red step still hides every step after it, which is why the order inside
# each job is the same as before the split. The local mirror,
# .claude/skills/gate-run/run-gates.sh, runs `gates` then `product` sequentially.
jobs:
  gates:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 11.1.0 }
      - uses: actions/setup-node@v4
        with: { node-version: 24, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm format:check
      - run: pnpm typecheck
      - run: pnpm check:tokens
      - run: pnpm check:contract
      - run: pnpm test

  product:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 11.1.0 }
      - uses: actions/setup-node@v4
        with: { node-version: 24, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm build:registry
      - run: pnpm build
      - name: Playwright smoke
        run: |
          pnpm --filter docs exec playwright install --with-deps chromium
          pnpm --filter docs exec playwright test
      - name: Storybook a11y + interaction
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
        run: apps/docs/scripts/consumer-test.sh
```

The twelve steps and their relative order are unchanged; only the job boundary is new.

- [ ] **Step 3: Update the local mirror's header**

In `.claude/skills/gate-run/run-gates.sh`, replace lines 2 to 5:

```bash
# Runs every gate in .github/workflows/ci.yml's order. Stops at the first
# failure, exactly as GitHub Actions does — which is precisely why order
# matters: a red gate early in the pipeline hides every gate behind it, and
# that has already happened here (CONTINUE.md §1).
```

with:

```bash
# Runs every gate in .github/workflows/ci.yml's order: the `gates` job's steps,
# then the `product` job's. CI runs those two jobs in parallel; this script runs
# them back to back and stops at the first failure, as each job does — which is
# why order matters: a red gate hides every gate behind it in the same job, and
# that has already happened here (CONTINUE.md §1).
```

No `run` line changes. Confirm with `git diff --stat .claude/skills/gate-run/run-gates.sh` showing only the header lines.

- [ ] **Step 4: Update the skill text**

In `.claude/skills/gate-run/SKILL.md`, replace lines 12 and 13:

```markdown
Twelve steps, in `.github/workflows/ci.yml`'s order. It stops at the first
failure, as CI does.
```

with:

```markdown
Twelve steps, in `.github/workflows/ci.yml`'s order: the `gates` job's seven,
then the `product` job's five. CI runs the two jobs in parallel; this script
runs them back to back and stops at the first failure, as each job does.
```

- [ ] **Step 5: Update CLAUDE.md's CI section within the byte budget**

In `CLAUDE.md`, replace lines 116 to 120:

```markdown
`.github/workflows/ci.yml`, job `verify`, in this order:

`install --frozen-lockfile` → `lint` → `format:check` → `typecheck` → `check:tokens` → `check:contract` → `test` → `build:registry` → `build` → **Playwright smoke** → **Storybook a11y + interaction** → **consumer install test**

Twelve steps. The last three are the ones that actually exercise the product, and they are last — so any earlier failure hides them entirely. Do not add a step that duplicates one of these, and do not disable a step to get a PR green: the consumer test, the a11y gate and the token gate are the three that protect people downstream.
```

with:

```markdown
`.github/workflows/ci.yml`, two parallel jobs, each in this order:

`gates`: `install --frozen-lockfile` → `lint` → `format:check` → `typecheck` → `check:tokens` → `check:contract` → `test`
`product`: `install --frozen-lockfile` → `build:registry` → `build` → **Playwright smoke** → **Storybook a11y + interaction** → **consumer install test**

Twelve steps. The last three are the ones that actually exercise the product; they run in their own job so a red `gates` step no longer hides them, and within a job a red step still hides every step after it. Do not add a step that duplicates one of these, and do not disable a step to get a PR green: the consumer test, the a11y gate and the token gate are the three that protect people downstream.
```

Then check the budget:

```bash
wc -c CLAUDE.md
```

Expected: `14367` (the replacement adds 123 bytes; the ceiling is 14,500). If it differs, the replacement was not applied verbatim; do not shorten any other part of the file to compensate.

- [ ] **Step 6: Validate the workflow and run the pinned tests**

```bash
pnpm format && pnpm format:check
cd apps/docs && pnpm exec vitest run scripts/lib/claude-md.test.ts
```

Expected: green (the size test and the rule-provenance test both read `CLAUDE.md`).

- [ ] **Step 7: Run the full mirror, commit, push, PR**

```bash
cd "$(git rev-parse --show-toplevel)"
.claude/skills/gate-run/run-gates.sh
git add .github/workflows/ci.yml .claude/skills/gate-run/run-gates.sh .claude/skills/gate-run/SKILL.md CLAUDE.md
git commit -m "ci: gates and product as two parallel jobs; the mirrors say so"
git push -u origin claude/ci-two-jobs
gh pr create --base main --title "ci: split verify into parallel gates and product jobs" --body "Closes review finding F7. Same twelve steps, same order inside each job; a red lint no longer hides the consumer install test. run-gates.sh keeps the sequential order (header comment updated), SKILL.md and CLAUDE.md's CI section say the same thing, and CLAUDE.md stays under its 14,500-byte ceiling."
```

- [ ] **Step 8: Confirm on the PR itself**

```bash
gh pr checks --watch
```

Expected: two checks, `gates` and `product`, both passing, with `gates` finishing first.

---

### Task 6: Zero lint warnings, enforced

**Review finding:** F8. 35 warnings; a stale disable directive ships to consumers; the root-level review file. (The file move is dropped: the review has a dozen root-relative evidence links that moving it would break. See the spec's F8.)

**Files:**

- Modify: `apps/docs/eslint.config.mjs`
- Modify: `apps/docs/package.json` (`lint` script)
- Modify: `apps/storybook/package.json` (`lint` script; it already lints with 0 warnings)
- Modify: `apps/docs/registry/super-ai/voice-clone-recorder.tsx:343` (delete the line)
- Modify: `apps/docs/registry/super-ai/account-menu.tsx:133` (delete the line)
- Modify: `apps/docs/registry/super-ai/recent-grid.test.tsx:100` (delete the line)
- Modify: `apps/docs/registry/super-ai/approval-card.tsx:135` (spread `props`)
- Test: `apps/docs/registry/super-ai/approval-card.test.tsx` (one new test)

**Interfaces:**

- Consumes: nothing.
- Produces: `pnpm lint` fails on any warning from here on, so later tasks (7) must land warning-free.

- [ ] **Step 1: Cut the branch and record the baseline**

```bash
git switch main && git pull --ff-only origin main
git switch -c claude/lint-zero
cd apps/docs && pnpm exec eslint . 2>&1 | tail -2
```

Expected: `✖ 35 problems (0 errors, 35 warnings)`.

- [ ] **Step 2: Write the failing approval-card test**

`ApprovalCard`'s props type extends `React.ComponentProps<"div">`, but the rest is never spread, so a consumer's `id` or `aria-describedby` silently vanishes. That is the one real bug behind the 35 warnings. Add to `apps/docs/registry/super-ai/approval-card.test.tsx`, inside `describe("ApprovalCard", …)`, after the first `it(...)`:

```tsx
it("forwards unknown div props to the root, so a consumer can address the card", () => {
  const { container } = render(
    <ApprovalCard
      id="approval-7"
      aria-describedby="why-7"
      title="Publish the Q3 summary"
      onConfirm={() => {}}
    />,
  );
  const root = container.querySelector('[data-slot="approval-card"]');
  expect(root).toHaveAttribute("id", "approval-7");
  expect(root).toHaveAttribute("aria-describedby", "why-7");
});
```

- [ ] **Step 3: Run it to verify it fails**

```bash
pnpm exec vitest run registry/super-ai/approval-card.test.tsx -t "forwards unknown div props"
```

Expected: FAIL, `expected <div …> to have attribute "id"`.

- [ ] **Step 4: Spread the rest props**

In `apps/docs/registry/super-ai/approval-card.tsx` line 135, replace:

```tsx
    <Card data-slot="approval-card" data-state={state} className={cn("gap-3", className)}>
```

with:

```tsx
    <Card data-slot="approval-card" data-state={state} className={cn("gap-3", className)} {...props}>
```

Spread last, as every shadcn primitive in `components/ui` does.

- [ ] **Step 5: Run the test to verify it passes, then the whole file**

```bash
pnpm exec vitest run registry/super-ai/approval-card.test.tsx
```

Expected: all passed.

- [ ] **Step 6: Delete the three stale or soon-stale directives**

Delete exactly these lines (the code under each stays):

- `apps/docs/registry/super-ai/voice-clone-recorder.tsx:343`: `// eslint-disable-next-line jsx-a11y/media-has-caption -- a spoken voice sample has no track to caption` (the rule is not in `eslint-config-next`'s jsx-a11y subset, so the directive has never applied; the axe gate covers media).
- `apps/docs/registry/super-ai/recent-grid.test.tsx:100`: `// eslint-disable-next-line no-await-in-loop` (the rule is not enabled).
- `apps/docs/registry/super-ai/account-menu.tsx:133`: `// eslint-disable-next-line @next/next/no-img-element` (Step 7 turns the rule off for the registry, which would make this directive the next unused-directive warning).

- [ ] **Step 7: Scope the rules in the config**

Replace `apps/docs/eslint.config.mjs` with:

```js
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    // A rest element exists to drop its named siblings; `const { a: _a, ...rest }`
    // is the idiom, not an unused binding.
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { ignoreRestSiblings: true, argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  {
    // `next/image` is a docs-app concern. Registry sources ship into apps that
    // own their image pipeline; demos, examples and tests never ship at all.
    files: ["registry/**", "components/demos/**", "content/**", "**/*.test.tsx"],
    rules: { "@next/next/no-img-element": "off" },
  },
  {
    // Vendored from registry.ai-sdk.dev (see the file header). Not ours to
    // restyle: the next re-vendor overwrites any local fix.
    files: ["components/ai-elements/**"],
    rules: {
      "@next/next/no-img-element": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "react-hooks/exhaustive-deps": "off",
    },
  },
]);

export default eslintConfig;
```

- [ ] **Step 8: Verify zero, then make zero the rule**

```bash
pnpm exec eslint . 2>&1 | tail -2
```

Expected: no `✖` line at all (ESLint prints nothing on a clean run). If any warning remains, the output names it; fix that file, do not widen the config.

Then in `apps/docs/package.json` change:

```json
    "lint": "eslint .",
```

to:

```json
    "lint": "eslint . --max-warnings 0",
```

and the same in `apps/storybook/package.json` (it already reports 0 warnings; this keeps it there):

```json
    "lint": "eslint . --max-warnings 0",
```

- [ ] **Step 9: Rebuild the registry and run the full gate**

Three registry sources changed, so the consumer install test is the proof. From the repo root:

```bash
pnpm format && pnpm format:check
pnpm lint
.claude/skills/gate-run/run-gates.sh
```

Expected: `pnpm lint` exits 0 with no warnings; `All gates green.`

- [ ] **Step 10: Commit, push, PR**

```bash
git add apps/docs/eslint.config.mjs apps/docs/package.json apps/storybook/package.json apps/docs/registry/super-ai/voice-clone-recorder.tsx apps/docs/registry/super-ai/account-menu.tsx apps/docs/registry/super-ai/recent-grid.test.tsx apps/docs/registry/super-ai/approval-card.tsx apps/docs/registry/super-ai/approval-card.test.tsx
git commit -m "fix(lint): zero warnings, enforced; approval-card forwards its div props"
git push -u origin claude/lint-zero
gh pr create --base main --title "fix(lint): zero warnings, enforced with --max-warnings 0" --body "Closes review finding F8. no-img-element is scoped off where next/image is the wrong tool (registry sources, demos, examples, tests, vendored ai-elements); rest-sibling bindings are ignored; three stale directives are deleted, one of which shipped to consumers. The one real bug found on the way: ApprovalCard dropped its rest props, so a consumer's id never reached the root; now spread and tested. lint runs with --max-warnings 0 in both apps."
```

---

### Task 7: Docs site: dark mode, a mobile nav, and a home grouped by family

**Review finding:** F5. The `.dark` tokens exist but nothing sets the class; the sidebar vanishes under `md` with no substitute; the home is a flat list.

**Files:**

- Modify: `apps/docs/package.json` (add `next-themes`), `pnpm-lock.yaml`
- Create: `apps/docs/components/theme-provider.tsx`
- Create: `apps/docs/components/theme-toggle.tsx`
- Create: `apps/docs/components/mobile-nav.tsx`
- Create: `apps/docs/components/catalog-index.tsx`
- Modify: `apps/docs/app/layout.tsx`
- Modify: `apps/docs/app/components/layout.tsx`
- Modify: `apps/docs/app/page.tsx`
- Modify: `apps/docs/components/docs-nav.tsx` (an `onNavigate` prop)
- Modify: `apps/docs/lib/catalog.ts` (family on each item, `FAMILY_TITLES`, `CATALOG_BY_FAMILY`)
- Modify: `apps/docs/lib/marketing-catalog.ts` (`MARKETING_BY_GROUP`)
- Modify: `apps/docs/e2e/smoke.spec.ts` (three new tests)
- Test: `apps/docs/lib/catalog.test.ts` (two new tests)

**Interfaces:**

- Consumes: `COMPAT_NOTE` from `apps/docs/lib/install.ts` (Task 2). `Sheet`, `SheetContent`, `SheetDescription`, `SheetHeader`, `SheetTitle`, `SheetTrigger` from `components/ui/sheet.tsx`; `Button` from `components/ui/button.tsx` (variants `ghost`, size `icon`); `Input` from `components/ui/input.tsx`; `MenuIcon`, `MoonIcon`, `SunIcon` from `lucide-react` 1.17 (all three verified present).
- Produces: `CatalogFamily { family: string; title: string; items: { name; title; description }[] }`, `FAMILY_TITLES: Record<FamilyId, string>`, `CATALOG_BY_FAMILY: CatalogFamily[]` from `lib/catalog.ts`; `MARKETING_BY_GROUP: CatalogFamily[]` from `lib/marketing-catalog.ts`; `ThemeToggle`, `MobileNav`, `CatalogIndex` components. `DocsNav` gains `onNavigate?: () => void`.

Before writing any UI in this task, run the `unslop` skill (`.claude/skills/unslop/`), Phase 1, and keep its constraints open; run its audit again at Step 13. The concrete bans that matter here: no gradients, no decorative borders standing in for hierarchy, no invented copy, tokens only, and never `text-muted-foreground` over `bg-muted`/`bg-accent`/`bg-secondary`.

- [ ] **Step 1: Cut the branch and add the dependency**

```bash
git switch main && git pull --ff-only origin main
git switch -c claude/docs-theme-nav-home
cd apps/docs && pnpm add next-themes@^0.4.6
git -C ../.. diff --stat
```

Expected: `apps/docs/package.json` and `pnpm-lock.yaml`. `next-themes@0.4.6` is already in the lockfile through Storybook, so the install is offline-capable and adds no new resolution.

- [ ] **Step 2: Write the failing catalog tests**

Append to `apps/docs/lib/catalog.test.ts`:

```ts
describe("CATALOG_BY_FAMILY", () => {
  it("places every shipped item in exactly one family, in catalog order, and skips cut family G", async () => {
    const { CATALOG_BY_FAMILY, FAMILY_TITLES } = await import("./catalog");
    const placed = CATALOG_BY_FAMILY.flatMap((f) => f.items.map((i) => i.name));
    expect(placed.sort()).toEqual([...CATALOG].sort());
    expect(new Set(placed).size).toBe(placed.length);
    expect(CATALOG_BY_FAMILY[0].family).toBe("A");
    expect(CATALOG_BY_FAMILY.map((f) => f.family)).not.toContain("G");
    for (const f of CATALOG_BY_FAMILY)
      expect(f.title).toBe(FAMILY_TITLES[f.family as keyof typeof FAMILY_TITLES]);
  });

  it("titles families the way docs/design-system/catalog.md does", async () => {
    const { FAMILY_TITLES } = await import("./catalog");
    const { readFileSync } = await import("node:fs");
    const { resolve } = await import("node:path");
    const md = readFileSync(resolve(__dirname, "../../../docs/design-system/catalog.md"), "utf8");
    const headings = [...md.matchAll(/^## ([A-P]) · (.+?)(?: \((?:L\d|v\d)\))? — /gm)];
    expect(headings.length).toBe(16);
    for (const [, id, title] of headings) {
      expect(FAMILY_TITLES[id as keyof typeof FAMILY_TITLES]).toBe(title);
    }
  });
});
```

Dynamic imports keep the file's existing top-level imports untouched; the two new exports do not exist yet, which is the failure.

- [ ] **Step 3: Run them to verify they fail**

```bash
pnpm exec vitest run lib/catalog.test.ts
```

Expected: the two new tests fail (`CATALOG_BY_FAMILY` is undefined).

- [ ] **Step 4: Extend lib/catalog.ts**

Replace the whole of `apps/docs/lib/catalog.ts` with:

```ts
import { MANIFEST } from "./catalog.manifest";
import type { FamilyId, ManifestItem } from "./manifest-types";

export interface CatalogItem {
  id: string;
  name: string;
  title: string;
  description: string;
  family: FamilyId;
  group: "Primitives" | "Components" | "Blocks";
}

export const ORDER = { primitive: 0, component: 1, block: 2 } as const;

export const groupFor = (layer: ManifestItem["layer"]): CatalogItem["group"] =>
  layer === "primitive" ? "Primitives" : layer === "block" ? "Blocks" : "Components";

export const CATALOG_ITEMS: CatalogItem[] = MANIFEST.filter((i) => i.status === "shipped")
  .sort((a, b) => ORDER[a.layer] - ORDER[b.layer])
  .map((i) => ({
    id: i.id,
    name: i.name,
    title: i.title,
    description: i.description,
    family: i.family,
    group: groupFor(i.layer),
  }));

export const CATALOG = CATALOG_ITEMS.map((i) => i.name);
export type CatalogName = string;

/** Family titles, verbatim from the `## X · Title` headings in
 *  docs/design-system/catalog.md; lib/catalog.test.ts fails if they drift.
 *  `Record<FamilyId, …>` means adding a family to the union is a type error
 *  until it has a title here. */
export const FAMILY_TITLES: Record<FamilyId, string> = {
  A: "Primitives",
  B: "App shell & navigation",
  C: "Home & launcher",
  D: "Composer & context",
  E: "Generation & parameters",
  F: "Results & assets",
  G: "Canvas & nodes",
  H: "Timeline & transport",
  I: "Editor surfaces",
  J: "Library, filtering & discovery",
  K: "Documents & knowledge",
  L: "First-run & onboarding",
  M: "Account, plan & monetization",
  N: "Feedback, trust & observability",
  O: "Blocks",
  P: "Records & views",
};

const FAMILY_ORDER = Object.keys(FAMILY_TITLES) as FamilyId[];

/** One section of the home page. `family` is the catalog letter for A–P and
 *  the literal "Marketing" for the second registry namespace, so a heading
 *  reads "B · App shell & navigation" or "Marketing · Buttons". */
export interface CatalogFamily {
  family: string;
  title: string;
  items: Pick<CatalogItem, "name" | "title" | "description">[];
}

/** Shipped items grouped by family in catalog order. Cut families (G) have no
 *  shipped items and therefore no section. */
export const CATALOG_BY_FAMILY: CatalogFamily[] = FAMILY_ORDER.map((family) => ({
  family,
  title: FAMILY_TITLES[family],
  items: CATALOG_ITEMS.filter((i) => i.family === family).map(({ name, title, description }) => ({
    name,
    title,
    description,
  })),
})).filter((f) => f.items.length > 0);
```

- [ ] **Step 5: Run the catalog tests to verify they pass**

```bash
pnpm exec vitest run lib/catalog.test.ts lib/catalog.manifest.test.ts
```

Expected: all passed. `catalog.manifest.test.ts` is included because it asserts counts derived from the same manifest and must be unaffected.

- [ ] **Step 6: Add the marketing grouping**

In `apps/docs/lib/marketing-catalog.ts`, change the first import to also bring the type:

```ts
import { CATALOG, type CatalogFamily } from "./catalog";
```

and after the `MARKETING_GROUPS` line add:

```ts
/** The marketing namespace as home-page sections, one per group. */
export const MARKETING_BY_GROUP: CatalogFamily[] = MARKETING_GROUPS.map((group) => ({
  family: "Marketing",
  title: group,
  items: MARKETING_ITEMS.filter((i) => i.group === group).map(({ name, title, description }) => ({
    name,
    title,
    description,
  })),
})).filter((f) => f.items.length > 0);
```

- [ ] **Step 7: Theme provider and toggle**

Create `apps/docs/components/theme-provider.tsx`:

```tsx
"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

/** Class-based theming: next-themes puts `dark` on <html>, which is the
 *  selector globals.css already declares (`@custom-variant dark (&:is(.dark *))`)
 *  and the one Storybook's docs container toggles. `system` follows
 *  prefers-color-scheme until the visitor picks. */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      {children}
    </NextThemesProvider>
  );
}
```

Create `apps/docs/components/theme-toggle.tsx`:

```tsx
"use client";

import { MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import * as React from "react";

import { Button } from "@/components/ui/button";

const subscribeNever = () => () => {};

/** Flips between light and dark. On the server the resolved theme is unknown,
 *  so the button renders the "to dark" affordance and swaps once hydrated.
 *  `useSyncExternalStore` with a server snapshot of `false` is the mounted
 *  check that does not set state inside an effect, which this app's lint
 *  config rejects (`react-hooks/set-state-in-effect` is an error). */
export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = React.useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false,
  );
  const dark = mounted && resolvedTheme === "dark";

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      data-slot="theme-toggle"
      className={className}
      aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
      onClick={() => setTheme(dark ? "light" : "dark")}
    >
      {dark ? <SunIcon /> : <MoonIcon />}
    </Button>
  );
}
```

Replace `apps/docs/app/layout.tsx`'s `RootLayout` with:

```tsx
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // suppressHydrationWarning: next-themes writes the theme class on <html>
    // before hydration, and React would otherwise report the attribute
    // mismatch on every load.
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
```

and add the import after `import "./globals.css";`:

```tsx
import { ThemeProvider } from "@/components/theme-provider";
```

- [ ] **Step 8: The mobile nav, and the layout that hosts both navs**

In `apps/docs/components/docs-nav.tsx`, thread an `onNavigate` callback through so a drawer can close itself when a link is chosen, without an effect that sets state on route change. Change the `NavList` signature and its `Link`:

```tsx
function NavList({
  items,
  pathname,
  onNavigate,
}: {
  items: { name: string; title: string }[];
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <ul className="space-y-0.5">
      {items.map((item) => {
        const href = `/components/${item.name}`;
        const isActive = pathname === href;
        return (
          <li key={item.name}>
            <Link
              href={href}
              onClick={onNavigate}
              className={`block rounded-md px-2 py-1.5 text-sm transition-colors ${
                isActive
                  ? "bg-accent text-accent-foreground font-medium"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              {item.title}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
```

Change `DocsNav`'s signature to `export function DocsNav({ onNavigate }: { onNavigate?: () => void } = {})` and pass `onNavigate={onNavigate}` to both `NavList` call sites.

Create `apps/docs/components/mobile-nav.tsx`:

```tsx
"use client";

import { MenuIcon } from "lucide-react";
import Link from "next/link";
import * as React from "react";

import { DocsNav } from "@/components/docs-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

/** The sidebar under `md`, as a drawer. Closes on `onNavigate` from the list
 *  rather than on a pathname effect, so no state is set inside an effect. */
export function MobileNav() {
  const [open, setOpen] = React.useState(false);

  return (
    <header
      data-slot="mobile-nav"
      className="bg-background sticky top-0 z-40 flex items-center gap-2 border-b px-4 py-2 md:hidden"
    >
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          render={<Button type="button" variant="ghost" size="icon" aria-label="Open navigation" />}
        >
          <MenuIcon />
        </SheetTrigger>
        <SheetContent side="left" className="overflow-y-auto p-4">
          <SheetHeader className="p-0">
            <SheetTitle>Components</SheetTitle>
            <SheetDescription className="sr-only">Every catalog and marketing item</SheetDescription>
          </SheetHeader>
          <DocsNav onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
      <Link href="/" className="text-sm font-semibold">
        Super-AI-Components
      </Link>
      <ThemeToggle className="ms-auto" />
    </header>
  );
}
```

Replace `apps/docs/app/components/layout.tsx` with:

```tsx
import Link from "next/link";

import { DocsNav } from "@/components/docs-nav";
import { MobileNav } from "@/components/mobile-nav";
import { ThemeToggle } from "@/components/theme-toggle";

export default function ComponentsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Sidebar, md and up */}
      <aside className="hidden w-56 shrink-0 border-e md:block">
        <div className="sticky top-0 h-screen overflow-y-auto p-4">
          <div className="mb-6 flex items-center justify-between">
            <Link href="/" className="text-sm font-semibold">
              Super-AI-Components
            </Link>
            <ThemeToggle />
          </div>
          <DocsNav />
        </div>
      </aside>

      {/* Drawer trigger, below md */}
      <MobileNav />

      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
```

(`border-r` becomes `border-e`: the RTL logical sweep's rule, CONTINUE.md §8.)

- [ ] **Step 9: The grouped home**

Create `apps/docs/components/catalog-index.tsx`:

```tsx
"use client";

import Link from "next/link";
import * as React from "react";

import { Input } from "@/components/ui/input";
import type { CatalogFamily } from "@/lib/catalog";

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-");

/** Family sections with a text filter. Filtering is by name, title and
 *  description; a family with no match disappears rather than showing an empty
 *  heading. The count line is live so a screen reader hears the narrowing. */
export function CatalogIndex({ families }: { families: CatalogFamily[] }) {
  const [query, setQuery] = React.useState("");
  const q = query.trim().toLowerCase();
  const total = families.reduce((n, f) => n + f.items.length, 0);
  const visible = families
    .map((f) => ({
      ...f,
      items: q
        ? f.items.filter((i) => `${i.name} ${i.title} ${i.description}`.toLowerCase().includes(q))
        : f.items,
    }))
    .filter((f) => f.items.length > 0);
  const shown = visible.reduce((n, f) => n + f.items.length, 0);

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <label htmlFor="catalog-filter" className="text-sm font-medium">
          Filter
        </label>
        <Input
          id="catalog-filter"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Name, title or description"
        />
        <p className="text-muted-foreground text-xs" aria-live="polite">
          {shown} of {total} items
        </p>
      </div>

      {visible.length === 0 ? (
        <p data-slot="catalog-empty" className="text-muted-foreground text-sm">
          Nothing matches. Try a shorter word.
        </p>
      ) : null}

      {visible.map((f) => {
        const id = `family-${slug(`${f.family}-${f.title}`)}`;
        return (
          <section key={id} aria-labelledby={id}>
            <h2 id={id} className="mb-2 text-sm font-semibold">
              {f.family} · {f.title}{" "}
              <span className="text-muted-foreground font-normal tabular-nums">{f.items.length}</span>
            </h2>
            <ul className="grid gap-2 sm:grid-cols-2">
              {f.items.map((item) => (
                <li key={item.name}>
                  <Link
                    className="hover:bg-accent block rounded-md border px-3 py-2 text-sm"
                    href={`/components/${item.name}`}
                  >
                    <span className="font-medium">{item.title}</span>
                    <span className="text-muted-foreground mt-0.5 block text-xs">{item.description}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
```

The card markup is the existing home's, moved as-is, so the item cards do not change.

Replace `apps/docs/app/page.tsx` with:

```tsx
import { CatalogIndex } from "@/components/catalog-index";
import { ThemeToggle } from "@/components/theme-toggle";
import { CATALOG_BY_FAMILY } from "@/lib/catalog";
import { COMPAT_NOTE } from "@/lib/install";
import { MARKETING_BY_GROUP } from "@/lib/marketing-catalog";

export default function Home() {
  return (
    <main className="mx-auto max-w-3xl space-y-8 p-6 sm:p-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Super-AI-Components</h1>
          <p className="text-muted-foreground mt-1">
            The missing half of AI Elements — components for AI applications.
          </p>
        </div>
        <ThemeToggle />
      </div>

      <div className="space-y-2">
        <pre className="bg-muted overflow-x-auto rounded-lg p-4 text-xs">
          <code>{"npx shadcn@latest add https://super-ai-components.vercel.app/r/<name>.json"}</code>
        </pre>
        <p className="text-muted-foreground text-xs">{COMPAT_NOTE}</p>
      </div>

      <CatalogIndex families={[...CATALOG_BY_FAMILY, ...MARKETING_BY_GROUP]} />
    </main>
  );
}
```

The `h1` text stays `Super-AI-Components`; the existing smoke test finds the home by that heading.

- [ ] **Step 10: Typecheck and lint before touching the browser**

From the repo root:

```bash
pnpm --filter docs typecheck && pnpm --filter docs lint
```

Expected: clean. (`lint` runs with `--max-warnings 0` once Task 6 has merged; if this task lands first, the bar is still zero new warnings.)

- [ ] **Step 11: Add the smoke tests**

Append to `apps/docs/e2e/smoke.spec.ts`:

```ts
test("home groups the catalog by family and filters it", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 2, name: /^A · Primitives/ })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: /^Marketing · Buttons/ })).toBeVisible();
  await page.getByLabel("Filter").fill("thread-list");
  await expect(page.getByRole("link", { name: /Thread List/ })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: /^A · Primitives/ })).toHaveCount(0);
  await page.getByLabel("Filter").fill("zzzz-no-such-item");
  await expect(page.locator('[data-slot="catalog-empty"]')).toBeVisible();
});

test("the theme toggle switches the document to dark", async ({ page }) => {
  await page.goto("/components/kbd");
  await expect(page.locator("html")).not.toHaveClass(/dark/);
  await page.getByRole("button", { name: "Switch to dark theme" }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await expect(page.getByRole("button", { name: "Switch to light theme" })).toBeVisible();
});

test.describe("below md", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("the sidebar is reachable from the menu button and closes on navigation", async ({ page }) => {
    await page.goto("/components/kbd");
    await page.getByRole("button", { name: "Open navigation" }).click();
    await page.getByRole("dialog").getByRole("link", { name: "Thread List" }).click();
    await expect(page).toHaveURL(/\/components\/thread-list$/);
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });
});
```

`getByRole` ignores elements hidden by `display: none`, so at desktop width only the sidebar's toggle matches and at 375px only the header's; no `.first()` is needed and a second visible match would be a real bug.

- [ ] **Step 12: Build, run the smoke gate, and look**

From the repo root:

```bash
pnpm build
CI=1 pnpm --filter docs exec playwright test
```

Expected: every test passes, including the 134 per-component console-error tests, which now run under the theme provider.

Then open the built site in the built-in browser (`preview_start` with the `docs` configuration from `.claude/launch.json`) and check, in this order: the home at desktop width in light, the same in dark (`resize_window` with `colorScheme: "dark"`), the home at the `mobile` preset, `/components/thread-list` at the mobile preset with the drawer open. Take a screenshot of each; the PR body gets the four. Nick's standing rule is Chrome and Safari both; the built-in browser is Chromium, so open the same four in Safari from the terminal and say so in the PR.

- [ ] **Step 13: Unslop audit, then the full gate**

Run the `unslop` skill's audit over the four new files and the two edited pages. Expected findings: none. If it flags the filter's placeholder or the count line as filler, cut them; do not add anything.

```bash
pnpm format && pnpm format:check
.claude/skills/gate-run/run-gates.sh
```

Expected: `All gates green.`

- [ ] **Step 14: Commit, push, PR**

```bash
git add apps/docs/package.json pnpm-lock.yaml apps/docs/components/theme-provider.tsx apps/docs/components/theme-toggle.tsx apps/docs/components/mobile-nav.tsx apps/docs/components/catalog-index.tsx apps/docs/app/layout.tsx apps/docs/app/components/layout.tsx apps/docs/app/page.tsx apps/docs/components/docs-nav.tsx apps/docs/lib/catalog.ts apps/docs/lib/catalog.test.ts apps/docs/lib/marketing-catalog.ts apps/docs/e2e/smoke.spec.ts
git commit -m "feat(docs): dark mode, a drawer nav below md, and a home grouped by family with a filter"
git push -u origin claude/docs-theme-nav-home
gh pr create --base main --title "feat(docs): dark mode, mobile nav, grouped home" --body "Closes review finding F5. next-themes sets the .dark class globals.css already declares (system by default, toggle in the sidebar, the mobile header and the home). Below md the sidebar becomes a Sheet drawer that closes on navigation. The home is grouped by catalog family (titles pinned to catalog.md by test) plus the marketing groups, with a filter and the install command. Three new smoke tests; full gate green. Screenshots: light, dark, mobile home, mobile drawer."
```

---

### Task 8: Deploy production, prove it, and record it

**Review finding:** F3. Production lacks the contracts layer. **This task starts only on an explicit "go" from Nick in chat** (decision D4). Everything before that go is preparation and is safe.

**Files:**

- Modify: `docs/CONTINUE.md` §1 `Deployed` row and §7's "Last measurement" block (from Task 4)

**Interfaces:**

- Consumes: `pnpm prod:diff` (Task 4). Every PR from Tasks 1 to 7 merged to `main`.
- Produces: production at `main`.

- [ ] **Step 1: Confirm every prerequisite, in this order, from the main checkout (not a worktree)**

```bash
git switch main && git pull --ff-only origin main
git log --oneline -10
gh pr list --state open
gh auth status
git remote -v
cat apps/docs/.vercel/project.json
```

Expected: the log shows the merges for Tasks 1 to 7; no open PRs from this plan; `gh auth status` names `weeeha`; the remote is `VV-DSGN-INC/Super-AI-Components`; the project file reads `{"projectId":"prj_Z0ri0CNPMxq5LJawVq8z9y3FQdmy","orgId":"team_a028ZfIo8cWgn1t63MHMUVfw","projectName":"super-ai-components"}`. If `.vercel/` is missing (it is gitignored), link before deploying:

```bash
cd apps/docs && vercel link --yes --project super-ai-components
```

- [ ] **Step 2: Measure before**

From `apps/docs`:

```bash
pnpm build:registry && pnpm prod:diff --report-only
```

Expected: `contract layer only differs 134`, corpus 404s. Keep the output; the PR body quotes before and after.

- [ ] **Step 3: Wait for the go**

Post in chat: the commit `main` is at, the before-table, and the one-line command below. Do nothing until Nick answers "go" (or a number that maps to it). "Deploy" in the plan is not the go; the go is his reply.

- [ ] **Step 4: Deploy**

From `apps/docs`:

```bash
vercel --prod
```

Expected: the CLI prints a `Production:` URL ending in `super-ai-components.vercel.app` and `Ready`. The project's root directory is `apps/docs` and its build command is `next build`, which runs `build:registry` first through the workspace's `build` script.

- [ ] **Step 5: Measure after**

From `apps/docs`:

```bash
pnpm prod:diff
curl -sI https://super-ai-components.vercel.app/llms.txt | head -1
curl -s https://super-ai-components.vercel.app/r/kbd.json | python3 -c 'import sys,json; print([f["path"] for f in json.load(sys.stdin)["files"]])'
```

Expected: the table shows `identical 134`, the script prints `production matches this build.` and exits 0; the first curl prints `HTTP/2 200`; the second prints both `registry/super-ai/kbd.tsx` and `registry/super-ai/kbd.meta.json`.

- [ ] **Step 6: Look at it**

Open `https://super-ai-components.vercel.app/` in the built-in browser and in Safari: home in light, home in dark, one component page at the mobile preset with the drawer open. Read the console (`read_console_messages` with `onlyErrors`) on each. Expected: no errors.

- [ ] **Step 7: Record it**

On a branch, in `docs/CONTINUE.md`: set the §1 `Deployed` row to

```markdown
| Deployed | **Yes, at `main`.** `pnpm prod:diff` on <date>: 134 identical, corpus identical — see §7 |
```

and replace §7's "Last measurement" table and the two paragraphs after it with the new table from Step 5 and:

```markdown
Production matches `main` at `<sha>`, deployed <date> after the project-review remediation (spec 2026-09-17). The contracts layer from PRs #56 and #57 is live: every item carries its `.meta.json`, and `/llms.txt`, `/llms-full.txt` and `/llms/components/*.md` resolve.
```

```bash
git switch -c claude/record-deploy
pnpm format && pnpm format:check
git add docs/CONTINUE.md
git commit -m "docs(continue): production at main, measured by prod:diff"
git push -u origin claude/record-deploy
gh pr create --base main --title "docs(continue): record the production deploy" --body "Production deployed from main at <sha> on <date>. pnpm prod:diff: 134 identical, llms corpus identical. Before: 134 contract-layer-only, corpus 404."
```

- [ ] **Step 8: Give Nick the link**

Reply with `https://super-ai-components.vercel.app`, the after-table, and the PR link. That is the end of the plan.

---

## Self-review against the spec

- **F1** → Task 1. **F2** → Task 2. **F3** → Task 8. **F4** → Task 4. **F5** → Task 7. **F6** → Task 3. **F7** → Task 5. **F8** → Task 6 (file move dropped, reason recorded in the spec and the task header).
- Names used across tasks: `COMPAT_NOTE` (Task 2 → Task 7); `CatalogFamily`, `CATALOG_BY_FAMILY`, `FAMILY_TITLES`, `MARKETING_BY_GROUP` (Task 7, internal); `compareItem`, `summarize`, `renderTable`, `Verdict`, `RegistryItemJson` (Task 4, internal); `pnpm prod:diff` (Task 4 → Task 8); job names `gates`, `product` (Task 5).
- The one behaviour change in a shipped component is `ApprovalCard` spreading its rest props (Task 6), and it carries its own test.
