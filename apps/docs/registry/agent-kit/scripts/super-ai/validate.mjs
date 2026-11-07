#!/usr/bin/env node
/** Super AI Components agent-kit: the check a consumer's agent runs.
 *
 *  Installed at scripts/super-ai/validate.mjs beside byte copies of this
 *  repository's rulecheck.mjs and its detectors, and a rules.json whose scopes
 *  point at the consumer's own folders. node:* and relative imports only.
 *
 *    node scripts/super-ai/validate.mjs [paths...] [--system [--base <ref>]] [--json]
 *
 *  Exit 0 clean, 1 any blocker, 2 could not run, 3 the diff changes the
 *  system (rule 5 in AGENTS.super-ai.md) and no blocker. Blocker wins.
 *
 *  Also exports lintText(relPath, text), the function a PreToolUse hook (the
 *  kit's own, or any hook that loads scripts/check-tokens.mjs) calls with the
 *  text an edit is about to write. */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { scan, walk } from "./rulecheck.mjs";
import { systemChanges } from "./system-diff.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(HERE, "..", "..");

export function loadConsumerRules(file = path.join(HERE, "rules.json")) {
  return JSON.parse(readFileSync(file, "utf8")).rules.filter(
    (r) => r.detect.method === "grep" || r.detect.method === "heuristic",
  );
}

/** Folders the kit treats as the system: shadcn primitives and installed items. */
export function resolveDirs(cwd) {
  let aliases = {};
  const config = path.join(cwd, "components.json");
  if (existsSync(config)) aliases = JSON.parse(readFileSync(config, "utf8")).aliases ?? {};
  const useSrc = existsSync(path.join(cwd, "src"));
  const local = (alias, fallback) => {
    const rel = (alias ?? fallback).replace(/^@\//, "").replace(/^~\//, "");
    return useSrc && !rel.startsWith("src/") ? `src/${rel}` : rel;
  };
  const ui = local(aliases.ui, "components/ui");
  const kit = `${local(aliases.components, "components")}/super-ai`;
  return { ui, kit, vendored: [ui] };
}

const posix = (p) => p.split(path.sep).join("/");

function lint(rules, files, root) {
  return scan(rules, files, root, resolveDirs(root).vendored);
}

/** One entry per rule, blockers only: a hook blocks on any entry, and a
 *  review finding (MOT-3) must never block an edit. */
export function lintText(relPath, text) {
  const tmp = mkdtempSync(path.join(tmpdir(), "super-ai-lint-"));
  try {
    const rel = posix(relPath);
    mkdirSync(path.dirname(path.join(tmp, rel)), { recursive: true });
    writeFileSync(path.join(tmp, rel), text);
    const config = path.join(PROJECT_ROOT, "components.json");
    if (existsSync(config)) writeFileSync(path.join(tmp, "components.json"), readFileSync(config));
    if (existsSync(path.join(PROJECT_ROOT, "src"))) mkdirSync(path.join(tmp, "src"), { recursive: true });
    const { violations } = lint(loadConsumerRules(), [rel], tmp);
    const byRule = new Map();
    const rules = new Map(loadConsumerRules().map((r) => [r.id, r]));
    for (const v of violations) {
      if (v.severity !== "blocker") continue;
      const r = rules.get(v.id);
      if (!byRule.has(v.id)) byRule.set(v.id, { why: `${v.id} ${r?.why ?? r?.title ?? ""}`.trim(), values: [] });
      byRule.get(v.id).values.push(v.snippet);
    }
    return [...byRule.values()];
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

function git(cwd, args) {
  return execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
}

function systemReport(cwd, base) {
  try {
    git(cwd, ["rev-parse", "--is-inside-work-tree"]);
  } catch {
    throw new Error("--system needs a git work tree; run it from the project root of a git repository");
  }
  const diff = git(cwd, ["diff", "--unified=0", base]);
  const untracked = git(cwd, ["ls-files", "--others", "--exclude-standard"]).split("\n").filter(Boolean);
  const { ui, kit } = resolveDirs(cwd);
  return systemChanges({ diff, untracked, dirs: { ui, kit } });
}

function main(argv) {
  const cwd = process.cwd();
  const flag = (name) => argv.includes(name);
  const baseAt = argv.indexOf("--base");
  const base = baseAt === -1 ? "HEAD" : argv[baseAt + 1];
  const paths = argv.filter((a, i) => !a.startsWith("--") && !(baseAt !== -1 && i === baseAt + 1));

  const rules = loadConsumerRules();
  const scopes = [...new Set(rules.flatMap((r) => r.detect.scope))];
  const extensions = [...new Set(rules.flatMap((r) => r.detect.include))];
  const files = paths.length
    ? paths.map((p) => posix(path.relative(cwd, path.resolve(cwd, p))))
    : [...new Set(walk(cwd, scopes, extensions).map(posix))];

  const report = lint(rules, files, cwd);
  const system = flag("--system") ? systemReport(cwd, base) : [];

  if (flag("--json")) {
    process.stdout.write(`${JSON.stringify({ ...report, system }, null, 2)}\n`);
  } else {
    for (const v of report.violations) {
      const tag = v.severity === "warning" ? "WARN " : "";
      process.stdout.write(`${tag}${v.file}:${v.line}  ${v.id} [${v.severity}]  ${v.snippet}\n    fix: ${v.fix}\n`);
    }
    for (const s of system) process.stdout.write(`SYSTEM ${s.reason} ${s.file}\n`);
    if (system.length) process.stdout.write("Rule 5: show this diff to the human before continuing.\n");
    process.stdout.write(`\n${report.summary.blocker} blocker(s), ${files.length} file(s) checked.\n`);
  }

  if (report.summary.blocker > 0) return 1;
  if (system.length > 0) return 3;
  return 0;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  try {
    process.exit(main(process.argv.slice(2)));
  } catch (error) {
    process.stderr.write(`super-ai validate: ${error.message}\n`);
    process.exit(2);
  }
}
