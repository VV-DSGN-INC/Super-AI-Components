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
