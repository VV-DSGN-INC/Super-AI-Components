import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

/**
 * apps/storybook compiles apps/docs source through tsconfig `paths`/`include`
 * and vite aliases. Turbo cannot see that edge — a `paths` mapping is a
 * TypeScript resolution alias, not a package dependency — so
 * apps/storybook/turbo.json pins the reachable directories into `inputs` by
 * hand. Without it turbo hashes storybook's tasks from storybook's own files,
 * replays `cache hit` over broken code, and root `pnpm typecheck` exits 0 on
 * source that does not compile. That shipped once already: the branch making
 * `locale` required on ComponentDocsView stayed green for a session, and only
 * `pnpm test:stories` caught it, with 127 of 131 story files failing to import.
 *
 * A hand-maintained list that has to track another file is precisely the thing
 * this repo has been bitten by before, so this test is the thing that keeps
 * them in step. The blanket `$TURBO_ROOT$/apps/docs/**` that would need no
 * maintenance is not an option: a `$TURBO_ROOT$` glob ignores .gitignore, and
 * turbo 2.9.17 silently drops `!`-negations against it, so the blanket form
 * invalidates the cache on every tsbuildinfo/.next/node_modules write.
 *
 * Note this test lives in apps/docs, so turbo hashes it from apps/docs files
 * and a lone edit to apps/storybook's config may replay a cached pass locally.
 * CI configures no remote cache, so every CI runner starts cold and really
 * executes it — which is the run that matters here.
 */

const STORYBOOK = path.resolve(__dirname, "../../storybook");

/** Strip JSONC comments without mangling `https://` inside string literals. */
function parseJsonc(source: string): unknown {
  let out = "";
  let inString = false;
  let inLine = false;
  let inBlock = false;

  for (let i = 0; i < source.length; i++) {
    const ch = source[i];
    const next = source[i + 1];

    if (inLine) {
      if (ch === "\n") {
        inLine = false;
        out += ch;
      }
      continue;
    }
    if (inBlock) {
      if (ch === "*" && next === "/") {
        inBlock = false;
        i++;
      }
      continue;
    }
    if (inString) {
      out += ch;
      if (ch === "\\") {
        out += source[++i] ?? "";
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }
    if (ch === '"') {
      inString = true;
      out += ch;
      continue;
    }
    if (ch === "/" && next === "/") {
      inLine = true;
      i++;
      continue;
    }
    if (ch === "/" && next === "*") {
      inBlock = true;
      i++;
      continue;
    }
    out += ch;
  }

  return JSON.parse(out);
}

/** Every `apps/docs/<dir>` apps/storybook can resolve into, from either config. */
function reachableDocsDirs(): Set<string> {
  const tsconfig = readFileSync(path.join(STORYBOOK, "tsconfig.json"), "utf8");
  const vite = readFileSync(path.join(STORYBOOK, "vite.config.ts"), "utf8");

  const dirs = new Set<string>();
  // Matches "../docs/registry/*" in tsconfig and "../docs/registry/$1" in the
  // vite aliases alike — we only care about the first path segment.
  for (const source of [tsconfig, vite]) {
    for (const [, dir] of source.matchAll(/\.\.\/docs\/([A-Za-z0-9._-]+)/g)) {
      dirs.add(dir);
    }
  }
  return dirs;
}

function turboInputsByTask(): Record<string, string[]> {
  const raw = readFileSync(path.join(STORYBOOK, "turbo.json"), "utf8");
  const config = parseJsonc(raw) as { tasks?: Record<string, { inputs?: string[] }> };
  const tasks = config.tasks ?? {};
  return Object.fromEntries(Object.entries(tasks).map(([name, def]) => [name, def.inputs ?? []]));
}

describe("apps/storybook/turbo.json input coverage", () => {
  const reachable = reachableDocsDirs();
  const byTask = turboInputsByTask();

  it("finds the cross-package directories it is meant to be guarding", () => {
    // A regex that silently matched nothing would make every assertion below
    // vacuously pass, so pin the discovery itself.
    expect(reachable.size).toBeGreaterThan(0);
    expect(reachable).toContain("registry");
    expect(reachable).toContain("components");
  });

  it.each(["typecheck", "build"])("declares cross-package inputs for %s", (task) => {
    expect(Object.keys(byTask)).toContain(task);
    const inputs = byTask[task];

    expect(inputs).toContain("$TURBO_DEFAULT$");

    for (const dir of reachable) {
      const expected = `$TURBO_ROOT$/apps/docs/${dir}/**`;
      expect(
        inputs,
        `apps/storybook/${task} can resolve ../docs/${dir} but turbo.json does not hash it. ` +
          `A change under apps/docs/${dir} would leave the hash untouched and turbo would ` +
          `replay a cache hit over it. Add "${expected}" to the ${task} inputs.`,
      ).toContain(expected);
    }
  });

  it.each(["typecheck", "build"])("does not use the blanket apps/docs glob for %s", (task) => {
    // $TURBO_ROOT$ globs ignore .gitignore and turbo drops `!`-negations against
    // them, so the blanket form busts the cache on every tsbuildinfo/.next write.
    expect(byTask[task]).not.toContain("$TURBO_ROOT$/apps/docs/**");
  });

  it("still has no real lint or test task in apps/storybook to cover", () => {
    const pkg = JSON.parse(readFileSync(path.join(STORYBOOK, "package.json"), "utf8")) as {
      scripts?: Record<string, string>;
    };
    const scripts = pkg.scripts ?? {};

    // `lint` and `test` are turbo tasks that would inherit this exact blind
    // spot. They are safe today only by accident — storybook's lint is a no-op
    // and it has no test script at all, so neither can hide a failure. The
    // moment either becomes real it needs an entry in turbo.json, and this is
    // the tripwire that says so.
    expect(
      scripts.lint,
      "apps/storybook gained a real lint script. It lints files that import apps/docs, " +
        "so add a `lint` task with the same cross-package inputs to apps/storybook/turbo.json.",
    ).toBe('echo "no lint"');
    expect(
      scripts.test,
      "apps/storybook gained a test script. Add a `test` task with the same cross-package " +
        "inputs to apps/storybook/turbo.json, or it will replay cache hits over broken code.",
    ).toBeUndefined();
  });
});
