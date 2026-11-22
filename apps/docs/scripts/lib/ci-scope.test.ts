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
