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
