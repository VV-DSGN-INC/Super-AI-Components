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
