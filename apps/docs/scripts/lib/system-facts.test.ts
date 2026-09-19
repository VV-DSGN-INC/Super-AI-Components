import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";

import { afterAll, describe, expect, it } from "vitest";

import { deriveFacts, FACTS_FILE, FactsInputError, renderFactsFile } from "./system-facts";

const REPO = resolve(__dirname, "../../../..");
const EMIT = process.env.FACTS_EMIT === "1";

const FIXTURE_FILES: Record<string, string> = {
  ".github/workflows/ci.yml":
    "jobs:\n  verify:\n    steps:\n      - uses: actions/checkout@v4\n      - run: pnpm lint\n      - run: pnpm test\n",
  "packages/ds-rules/rules/core.json": JSON.stringify({
    version: 1,
    rules: [
      { id: "A-1", severity: "blocker", detect: { method: "grep" } },
      { id: "A-2", severity: "blocker", detect: { method: "rendered" } },
      { id: "A-3", severity: "review", detect: { method: "judgment" } },
    ],
  }),
  "apps/docs/registry/super-ai/a.meta.json": "{}",
  "apps/docs/registry/super-ai/b.meta.json": "{}",
  "apps/docs/registry/super-ai/a.tsx": "",
  "apps/storybook/src/stories/super-ai/A.stories.tsx": "",
  "apps/storybook/src/stories/Overview.mdx": "",
  "apps/docs/scripts/lib/x.baseline.json": "{}",
  // Must be ignored: a ledger inside node_modules is not ours.
  "apps/docs/node_modules/pkg/y.baseline.json": "{}",
  ".claude/skills/one/SKILL.md": "",
};

const FIXTURE_MANIFEST = [
  { status: "shipped", layer: "primitive" },
  { status: "shipped", layer: "component" },
  { status: "shipped", layer: "block" },
  { status: "cut", layer: "component" },
] as const;

const roots: string[] = [];

function plant(files: Record<string, string>): string {
  const root = mkdtempSync(join(tmpdir(), "system-facts-"));
  roots.push(root);
  for (const [rel, body] of Object.entries(files)) {
    mkdirSync(dirname(join(root, rel)), { recursive: true });
    writeFileSync(join(root, rel), body);
  }
  return root;
}

afterAll(() => {
  for (const root of roots) rmSync(root, { recursive: true, force: true });
});

describe("deriveFacts on a planted tree", () => {
  it("counts exactly what was planted", () => {
    expect(deriveFacts(plant(FIXTURE_FILES), FIXTURE_MANIFEST)).toEqual({
      ciSteps: 2,
      contracts: 2,
      ledgers: 1,
      prosePages: 1,
      ruleBlockers: 2,
      rules: 3,
      rulesJudgment: 1,
      rulesRendered: 1,
      rulesStatic: 1,
      shipped: 3,
      shippedBlocks: 1,
      shippedComponents: 1,
      shippedPrimitives: 1,
      skills: 1,
      storyFiles: 1,
    });
  });

  it("throws FactsInputError naming the key when an input is missing", () => {
    const withoutRules = Object.fromEntries(
      Object.entries(FIXTURE_FILES).filter(([rel]) => !rel.startsWith("packages/ds-rules/")),
    );
    expect(() => deriveFacts(plant(withoutRules), FIXTURE_MANIFEST)).toThrow(FactsInputError);
    expect(() => deriveFacts(plant(withoutRules), FIXTURE_MANIFEST)).toThrow('cannot derive "rules"');
  });

  it("throws FactsInputError when a count is zero, so a blind counter cannot pass", () => {
    const noBlocks = FIXTURE_MANIFEST.filter((item) => item.layer !== "block");
    expect(() => deriveFacts(plant(FIXTURE_FILES), noBlocks)).toThrow('cannot derive "shippedBlocks"');
  });
});

describe("deriveFacts on this repo", () => {
  it("finds one contract per shipped item", () => {
    const facts = deriveFacts(REPO);
    expect(facts.contracts).toBe(facts.shipped);
  });
});

describe("facts.json", () => {
  it(EMIT ? "writes the facts file" : "matches the tree", () => {
    const content = renderFactsFile(deriveFacts(REPO));
    const abs = join(REPO, FACTS_FILE);
    if (EMIT) {
      mkdirSync(dirname(abs), { recursive: true });
      writeFileSync(abs, content);
      return;
    }
    const committed = existsSync(abs) ? readFileSync(abs, "utf8") : "";
    expect(committed, `${FACTS_FILE} is stale. Run: cd apps/docs && pnpm facts:emit`).toBe(content);
  });
});
