import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";

/** Where harness/ is. Playwright compiles these files to CommonJS (the
 *  package has no "type"), and an import.meta.url in a file it loads flips
 *  the loader to ESM and fails on the CJS `exports` it just emitted — so no
 *  file the spec imports may use import.meta. playwright.config.ts sets
 *  HARNESS_DIR from its own __dirname; the tsx entry points (baseline-write,
 *  scaffold-consumer) run from apps/docs, which the fallback assumes. */
export function harnessDir(): string {
  return process.env.HARNESS_DIR ?? path.resolve(process.cwd(), "harness");
}

export type Theme = "light" | "dark";
export const THEMES: readonly Theme[] = ["light", "dark"];

export interface HarnessResult {
  row: string;
  theme: Theme;
  item: string;
  /** axe rule ids that fired, deduplicated and sorted. */
  violations: string[];
  /** page errors and console.error lines. */
  errors: string[];
}

export const BASELINE_FILE = path.join(harnessDir(), "baseline.json");
export const OUT_DIR = `${harnessDir()}/out/`;

export const keyFor = (row: string, theme: Theme, item: string, rule: string) =>
  `${row}/${theme}/${item}:${rule}`;

export function readBaseline(): string[] {
  return existsSync(BASELINE_FILE) ? (JSON.parse(readFileSync(BASELINE_FILE, "utf8")) as string[]) : [];
}

/** Every result file a row's run wrote. */
export function readResults(row: string): HarnessResult[] {
  const out: HarnessResult[] = [];
  for (const theme of THEMES) {
    const dir = `${OUT_DIR}${row}/${theme}/`;
    if (!existsSync(dir)) continue;
    for (const f of readdirSync(dir).filter((f) => f.endsWith(".json"))) {
      out.push(JSON.parse(readFileSync(dir + f, "utf8")) as HarnessResult);
    }
  }
  return out;
}

export function liveKeys(results: HarnessResult[]): string[] {
  return results.flatMap((r) => r.violations.map((v) => keyFor(r.row, r.theme, r.item, v)));
}
