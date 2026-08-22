#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { findCvaViolations, findSingleStringViolations } from "./src/token-rules.mjs";

/** Forked from the ds-architecture starter kit's 02-rules/rulecheck.mjs
 *  (provenance: packages/ds-rules/README.md). Reads the emitted rules and
 *  reports violations plus what it could not check. node:* and relative
 *  imports only — it runs from a hook, from vitest, and from a shell.
 *
 *  Deliberate divergences from the harvested original:
 *   1. Roots: rules load from this package, file paths are repo-root-relative,
 *      and the CLI works from any cwd (the old gate was cwd-dependent).
 *   2. STRUCTURAL: TOK-4/TOK-5 route to token-rules.mjs instead of the
 *      generic per-line scan — their pattern is only a pre-filter, and
 *      scanning it generically would flag every legitimate muted-text usage.
 *   3. Vendored demotion: findings under VENDORED_SCOPES report as severity
 *      "warning" (upstream shadcn ports; fixing means diverging, a decision
 *      nobody has made — docs/design-system/vendored-token-findings.md).
 *   4. Exit 1 only on a post-demotion blocker (the original exits on any
 *      violation; demotion requires the distinction).
 *   5. A scan over zero files warns loudly on stderr — a gate with no
 *      coverage must say so (carried from check-tokens.mjs). */

const PKG_ROOT = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(PKG_ROOT, "..", "..");

const SEVERITY_RANK = { blocker: 0, review: 1, warning: 2 };

/** Exported so records.test.ts can assert every structural id has a record —
 *  a STRUCTURAL entry routing to a nonexistent record is drift. */
export const STRUCTURAL = {
  "TOK-4": findSingleStringViolations,
  "TOK-5": findCvaViolations,
};

/** Mirrors VENDORED_SCOPES in src/local.ts — this runtime must stay free of
 *  TypeScript imports, so the value is duplicated and records.test.ts pins
 *  the two lists equal. */
export const VENDORED_SCOPES = ["apps/docs/components/ui"];

export function loadRules(dir = process.env.DS_RULES_DIR ?? path.join(PKG_ROOT, "rules")) {
  if (!existsSync(dir)) throw new Error(`rules dir not found (${dir}) — run: pnpm --filter ds-rules rules:emit`);
  return readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .flatMap((f) => JSON.parse(readFileSync(path.join(dir, f), "utf8")).rules);
}

export function walk(root, scopes, extensions) {
  const out = [];
  const visit = (rel) => {
    const abs = path.join(root, rel);
    if (!existsSync(abs)) return;
    for (const entry of readdirSync(abs)) {
      if (entry === "node_modules" || entry.startsWith(".")) continue;
      const childRel = path.join(rel, entry);
      if (statSync(path.join(root, childRel)).isDirectory()) visit(childRel);
      else if (extensions.includes(path.extname(entry))) out.push(childRel);
    }
  };
  scopes.forEach(visit);
  return out.sort();
}

function structuralFindings(rule, targets, root) {
  const out = [];
  for (const file of targets) {
    const source = readFileSync(path.join(root, file), "utf8");
    for (const message of STRUCTURAL[rule.id](file, source)) {
      // token-rules messages are `${file}:${line} — ${prose}`.
      const sep = message.indexOf(" — ");
      const head = message.slice(0, sep);
      out.push({
        id: rule.id,
        severity: rule.severity,
        method: "heuristic",
        confidence: "high",
        file,
        line: Number(head.slice(head.lastIndexOf(":") + 1)) || 1,
        snippet: message.slice(sep + 3).trim().slice(0, 120),
        fix: rule.fix,
      });
    }
  }
  return out;
}

export function scan(rules, files, root = REPO_ROOT) {
  const violations = [];
  const unchecked = [];

  for (const rule of rules) {
    const d = rule.detect;

    if (d.method === "rendered" || d.method === "judgment") {
      unchecked.push({ id: rule.id, reason: d.method, how: d.how });
      continue;
    }

    const targets = files.filter(
      (f) =>
        d.scope.some((s) => f === s || f.startsWith(`${s}/`)) &&
        d.include.includes(path.extname(f)) &&
        !d.exempt.some((e) => f.includes(e)),
    );

    if (targets.length === 0) {
      unchecked.push({ id: rule.id, reason: "out-of-scope" });
      continue;
    }

    if (STRUCTURAL[rule.id]) {
      violations.push(...structuralFindings(rule, targets, root));
      continue;
    }

    // Strip `g`: re.test(line) with a global regex advances lastIndex across
    // calls and returns false on every other matching line.
    const re = new RegExp(d.pattern, d.flags.replace(/g/g, ""));
    for (const file of targets) {
      const lines = readFileSync(path.join(root, file), "utf8").split("\n");
      lines.forEach((line, i) => {
        if (!re.test(line)) return;
        violations.push({
          id: rule.id,
          severity: rule.severity,
          method: d.method,
          confidence: d.method === "heuristic" ? "medium" : "high",
          file,
          line: i + 1,
          snippet: line.trim().slice(0, 120),
          fix: rule.fix,
        });
      });
    }
  }

  for (const v of violations) {
    if (VENDORED_SCOPES.some((s) => v.file === s || v.file.startsWith(`${s}/`))) {
      v.severity = "warning";
    }
  }

  violations.sort(
    (a, b) =>
      SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity] ||
      a.file.localeCompare(b.file) ||
      a.line - b.line ||
      a.id.localeCompare(b.id),
  );

  const summary = { blocker: 0, review: 0, warning: 0, filesScanned: files.length };
  for (const v of violations) summary[v.severity] += 1;

  return { violations, unchecked, summary };
}

function main(argv) {
  const arg = (name) => {
    const i = argv.indexOf(name);
    return i === -1 ? null : argv[i + 1];
  };
  const list = (name) => {
    const i = argv.indexOf(name);
    if (i === -1) return null;
    const out = [];
    for (let j = i + 1; j < argv.length && !argv[j].startsWith("--"); j += 1) out.push(argv[j]);
    return out;
  };

  let rules = loadRules();
  const severity = arg("--severity");
  if (severity) rules = rules.filter((r) => r.severity === severity);

  const explicit = list("--files"); // repo-root-relative paths
  const scopes = [...new Set(rules.flatMap((r) => r.detect.scope ?? []))];
  const extensions = [...new Set(rules.flatMap((r) => r.detect.include ?? []))];
  const files = explicit ?? walk(REPO_ROOT, scopes, extensions);

  if (files.length === 0) {
    process.stderr.write("rulecheck — WARNING: no files matched any rule scope. Gate has no coverage.\n");
  }

  const report = scan(rules, files, REPO_ROOT);

  if (argv.includes("--json")) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  } else {
    for (const v of report.violations) {
      const tag = v.severity === "warning" ? "WARN " : "";
      process.stdout.write(`${tag}${v.file}:${v.line}  ${v.id} [${v.severity}]  ${v.snippet}\n    fix: ${v.fix}\n`);
    }
    for (const u of report.unchecked) {
      if (u.how) process.stdout.write(`unchecked ${u.id} (${u.reason}): ${u.how}\n`);
    }
    const ids = report.unchecked.map((u) => `${u.id}(${u.reason})`).join(" ");
    process.stdout.write(`\n${report.violations.length} violation(s). unchecked: ${ids || "none"}\n`);
  }

  return report.violations.some((v) => v.severity === "blocker") ? 1 : 0;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  try {
    process.exit(main(process.argv.slice(2)));
  } catch (error) {
    // Exit 2 is "I could not tell" — distinct from "nothing wrong". Callers
    // that block must treat it as non-blocking.
    process.stderr.write(`rulecheck: ${error.message}\n`);
    process.exit(2);
  }
}
