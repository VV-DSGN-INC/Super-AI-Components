// Produces the Russian docs overlays under content/ru/components/ and the
// Russian catalog in lib/i18n/catalog.ru.ts.
//
// Requires ANTHROPIC_API_KEY. CI NEVER runs this script — check-i18n.mts only
// compares hashes, so the pipeline stays entirely offline.
//
// Usage:
//   pnpm i18n:sync                 # translate whatever is stale
//   pnpm i18n:sync --only kbd      # one component
//   pnpm i18n:sync --all           # ignore hashes, regenerate everything
//   pnpm i18n:sync --dry-run       # report what is stale, write nothing
import Anthropic from "@anthropic-ai/sdk";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { MANIFEST } from "../lib/catalog.manifest";
import { componentDocs } from "../lib/docs.generated";
import { GLOSSARY } from "../lib/i18n/glossary";
import type { DocsTranslation } from "../lib/i18n/types";
import { extractStrings, hashStrings } from "./lib/i18n-extract";
import { renderOverlayFile, validateTranslation } from "./lib/i18n-validate";

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, "../content/ru/components");
const argv = process.argv.slice(2);
const only = argv.includes("--only") ? argv[argv.indexOf("--only") + 1] : undefined;
const all = argv.includes("--all");
const dryRun = argv.includes("--dry-run");
const MODEL = process.env.I18N_MODEL ?? "claude-sonnet-5";
const CONCURRENCY = 6;

const client = new Anthropic();

const SYSTEM = `You translate technical design-system documentation from English into Russian.

Rules, all mandatory:
- Return ONLY a JSON object matching the input's shape. No prose, no code fences.
- Preserve every array's length EXACTLY. Never merge, split, drop or add items.
- Preserve every object key EXACTLY as given. Keys are code identifiers, not text.
- Never translate: code identifiers, prop names, prop values in quotes (size="page"),
  data-* attribute names, CSS class names, HTML element names (div, figure, h1),
  ARIA attribute and role names (aria-hidden, role="note"), package names, or product names.
- Keep backticked spans and inline code verbatim.
- Use "вы" register, present tense, and the terminology in the glossary below.

Glossary (use these renderings consistently):
${GLOSSARY.map((g) => `  ${g.en} -> ${g.ru}`).join("\n")}`;

function readStoredHash(file: string): string | undefined {
  if (!existsSync(file)) return undefined;
  return /^\/\/ @source-hash: (\w+)$/m.exec(readFileSync(file, "utf8"))?.[1];
}

/**
 * The model is instructed to return bare JSON, but that instruction is not
 * enforced by the API — a code fence (```json ... ``` or plain ``` ... ```),
 * or stray leading/trailing whitespace around either, is a realistic response
 * shape and must not throw JSON.parse into an unhandled rejection that looks
 * like an API failure rather than a formatting one.
 */
function parseJsonResponse(text: string): unknown {
  const trimmed = text.trim();
  const fenced = /^```(?:json)?\s*\n?([\s\S]*?)\n?```$/.exec(trimmed);
  const body = fenced ? fenced[1] : trimmed;
  return JSON.parse(body);
}

function responseText(response: Anthropic.Message): string {
  return response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
}

async function translate(en: DocsTranslation): Promise<unknown> {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 8192,
    system: SYSTEM,
    messages: [{ role: "user", content: JSON.stringify(en, null, 2) }],
  });
  return parseJsonResponse(responseText(response));
}

async function syncOne(name: string): Promise<"skipped" | "written"> {
  const docs = componentDocs[name];
  const en = extractStrings(docs);
  const hash = hashStrings(en);
  const file = join(outDir, `${name}.ts`);

  if (!all && readStoredHash(file) === hash) return "skipped";
  if (dryRun) {
    console.log(`stale: ${name}`);
    return "skipped";
  }

  for (let attempt = 1; attempt <= 2; attempt++) {
    let candidate: unknown;
    try {
      candidate = await translate(en);
    } catch (err) {
      // A malformed JSON response is the same class of failure as a shape
      // error below: retry once, then give up loudly rather than writing
      // nothing and continuing silently.
      console.warn(`${name}: attempt ${attempt} did not parse as JSON — ${(err as Error).message}`);
      if (attempt === 2) throw new Error(`${name}: translation response was not valid JSON twice`);
      continue;
    }
    const errors = validateTranslation(en, candidate);
    if (errors.length === 0) {
      mkdirSync(outDir, { recursive: true });
      writeFileSync(file, renderOverlayFile(name, hash, candidate as DocsTranslation));
      return "written";
    }
    console.warn(`${name}: attempt ${attempt} invalid — ${errors.join("; ")}`);
    if (attempt === 2) throw new Error(`${name}: translation failed validation twice`);
  }
  // Unreachable — the loop above always returns or throws on its final
  // attempt — but keeps the function's return type honest without a
  // non-null assertion at the call site.
  throw new Error(`${name}: translation failed validation twice`);
}

/**
 * Bounded worker pool. `limit` workers each pull from the shared queue until
 * it is empty, so the pool always terminates: every item is claimed exactly
 * once via `queue.shift()`, and `Promise.all` resolves once every worker's
 * loop exits (worker count is `Math.min(limit, queue.length)`, so an empty
 * `items` array yields zero workers and an immediately-resolved Promise.all).
 * A thrown error inside `fn` propagates out of that worker's loop, out of
 * `Promise.all`, and out of `pool()` — it is not caught here, so one failed
 * item fails the whole sync run rather than being swallowed.
 */
async function pool<T>(items: T[], limit: number, fn: (item: T) => Promise<unknown>) {
  const queue = [...items];
  await Promise.all(
    Array.from({ length: Math.min(limit, queue.length) }, async () => {
      for (let next = queue.shift(); next !== undefined; next = queue.shift()) await fn(next);
    }),
  );
}

const shipped = MANIFEST.filter((i) => i.status === "shipped")
  .map((i) => i.name)
  .filter((n) => componentDocs[n])
  .filter((n) => !only || n === only)
  .sort();

let written = 0;
await pool(shipped, CONCURRENCY, async (name) => {
  const result = await syncOne(name);
  if (result === "written") {
    written++;
    console.log(`✓ ${name}`);
  }
});

// The Russian catalog. A SEPARATE file: lib/catalog.manifest.ts is the repo's one
// shared file and is never written by a script.
type CatalogEntry = { title: string; description: string };

async function translateCatalog(source: Record<string, CatalogEntry>): Promise<unknown> {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 16384,
    system: `${SYSTEM}

This input is a catalog: component name -> { title, description }. Translate only
the title and description values. Every top-level key is a component identifier
and must be returned byte-identical.`,
    messages: [{ role: "user", content: JSON.stringify(source, null, 2) }],
  });
  return parseJsonResponse(responseText(response));
}

// The `--only` flag targets a single component's overlay file; the catalog
// covers every shipped component's title/description in one call, so it has
// no meaningful "only" scope and is skipped when --only is set (also skipped
// entirely on --dry-run, which writes nothing).
if (!dryRun && !only) {
  const source = Object.fromEntries(
    MANIFEST.filter((i) => i.status === "shipped").map((i) => [
      i.name,
      { title: i.title, description: i.description },
    ]),
  );

  let translated: Record<string, Partial<CatalogEntry>> = {};
  try {
    translated = (await translateCatalog(source)) as Record<string, Partial<CatalogEntry>>;
  } catch (err) {
    throw new Error(`catalog: translation response was not valid JSON — ${(err as Error).message}`);
  }

  const missing = Object.keys(source).filter(
    (n) => !translated[n]?.title?.trim() || !translated[n]?.description?.trim(),
  );
  if (missing.length) throw new Error(`catalog: ${missing.length} entries missing — ${missing.join(", ")}`);

  const entries = Object.keys(source)
    .sort()
    .map(
      (n) =>
        `  "${n}": { title: ${JSON.stringify(translated[n]!.title)}, description: ${JSON.stringify(translated[n]!.description)} },`,
    );
  writeFileSync(
    join(here, "../lib/i18n/catalog.ru.ts"),
    `// GENERATED by scripts/i18n-sync.mts. Do not edit.
export const CATALOG_RU: Record<string, { title: string; description: string }> = {
${entries.join("\n")}
};
`,
  );
  console.log(`i18n:sync — catalog.ru.ts written, ${entries.length} entries.`);
}

console.log(`i18n:sync — ${written} written, ${shipped.length - written} current.`);
