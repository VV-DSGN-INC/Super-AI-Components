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
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { MANIFEST } from "../lib/catalog.manifest";
import { componentDocs } from "../lib/docs.generated";
import { GLOSSARY } from "../lib/i18n/glossary";
import type { DocsTranslation } from "../lib/i18n/types";
import { canonicalJson, extractStrings, hashStrings } from "./lib/i18n-extract";
import { renderOverlayFile, validateTranslation } from "./lib/i18n-validate";

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, "../content/ru/components");
const catalogFile = join(here, "../lib/i18n/catalog.ru.ts");
const argv = process.argv.slice(2);

// `--only` with no following value (or one that looks like the next flag)
// used to silently fall through to translating the entire corpus — an easy
// way to spend a full paid run by mistyping the invocation. A misspelled
// component name was worse: it filtered `shipped` to an empty array and the
// run exited 0 printing "0 written, 0 current", which reads as success. Both
// are validated below, before any network call.
const onlyIndex = argv.indexOf("--only");
let only: string | undefined;
if (onlyIndex !== -1) {
  const value = argv[onlyIndex + 1];
  if (value === undefined || value.startsWith("--")) {
    throw new Error(
      `--only requires a component name as the next argument (got ${
        value === undefined ? "nothing" : JSON.stringify(value)
      })`,
    );
  }
  only = value;
}

const all = argv.includes("--all");
const dryRun = argv.includes("--dry-run");
const MODEL = process.env.I18N_MODEL ?? "claude-sonnet-5";
const CONCURRENCY = 6;
const TRANSLATE_MAX_TOKENS = 8192;
const CATALOG_MAX_TOKENS = 16384;

const shippedWithDocs = MANIFEST.filter((i) => i.status === "shipped")
  .map((i) => i.name)
  .filter((n) => componentDocs[n])
  .sort();

if (only !== undefined && !shippedWithDocs.includes(only)) {
  throw new Error(`--only ${JSON.stringify(only)}: no shipped component with a docs module by that name`);
}

const shipped = only ? [only] : shippedWithDocs;

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

async function translate(en: DocsTranslation, name: string): Promise<unknown> {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: TRANSLATE_MAX_TOKENS,
    system: SYSTEM,
    messages: [{ role: "user", content: JSON.stringify(en, null, 2) }],
  });
  // Checked before parsing: a truncated response is truncated JSON, and
  // without this check that surfaces as an opaque "did not parse as JSON"
  // twice in a row, never mentioning the actual cause. The largest component
  // (home-shell) measures around 5k Russian output tokens against this
  // 8,192 ceiling — under 2x headroom, and Cyrillic tokenizes worse than
  // that estimate assumes, so this is a real, not theoretical, failure mode.
  if (response.stop_reason === "max_tokens") {
    throw new Error(
      `${name}: translation response was truncated at the ${TRANSLATE_MAX_TOKENS}-token max_tokens ceiling`,
    );
  }
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
      candidate = await translate(en, name);
    } catch (err) {
      // Only a genuine JSON.parse failure (a SyntaxError from
      // parseJsonResponse) is a formatting problem worth retrying. An
      // Anthropic.APIError (bad key, rate limit, 5xx) or the max_tokens
      // truncation thrown above is not a formatting problem and would not
      // be fixed by trying the same request again with the same prompt —
      // rethrow it unwrapped rather than misreporting it as "did not parse
      // as JSON", which used to point every auth/quota failure at the wrong
      // cause (and, at CONCURRENCY=6, produced six wrong diagnostics before
      // the run died).
      if (!(err instanceof SyntaxError)) throw err;
      console.warn(`${name}: attempt ${attempt} did not parse as JSON — ${err.message}`);
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

/** Same canonical-hash approach as hashStrings, generalized to the catalog's shape. */
function hashCatalogSource(source: Record<string, CatalogEntry>): string {
  return createHash("sha256").update(canonicalJson(source)).digest("hex").slice(0, 16);
}

function isBlank(value: unknown): boolean {
  return typeof value !== "string" || value.trim() === "";
}

async function translateCatalog(source: Record<string, CatalogEntry>): Promise<unknown> {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: CATALOG_MAX_TOKENS,
    system: `${SYSTEM}

This input is a catalog: component name -> { title, description }. Translate only
the title and description values. Every top-level key is a component identifier
and must be returned byte-identical.`,
    messages: [{ role: "user", content: JSON.stringify(source, null, 2) }],
  });
  if (response.stop_reason === "max_tokens") {
    throw new Error(`catalog: translation response was truncated at the ${CATALOG_MAX_TOKENS}-token max_tokens ceiling`);
  }
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
  const sourceHash = hashCatalogSource(source);

  if (all || readStoredHash(catalogFile) !== sourceHash) {
    let translated: Record<string, Partial<CatalogEntry>> = {};
    try {
      translated = (await translateCatalog(source)) as Record<string, Partial<CatalogEntry>>;
    } catch (err) {
      // Same rationale as syncOne's catch: only a genuine JSON.parse
      // SyntaxError is a formatting problem. An APIError or the truncation
      // error thrown above must not be relabelled as one.
      if (!(err instanceof SyntaxError)) throw err;
      throw new Error(`catalog: translation response was not valid JSON — ${err.message}`);
    }

    const missing = Object.keys(source).filter(
      (n) => isBlank(translated[n]?.title) || isBlank(translated[n]?.description),
    );
    if (missing.length) throw new Error(`catalog: ${missing.length} entries missing — ${missing.join(", ")}`);

    const entries = Object.keys(source)
      .sort()
      .map(
        (n) =>
          `  "${n}": { title: ${JSON.stringify(translated[n]!.title)}, description: ${JSON.stringify(translated[n]!.description)} },`,
      );
    writeFileSync(
      catalogFile,
      `// GENERATED by scripts/i18n-sync.mts. Do not edit.
// @source-hash: ${sourceHash}
export const CATALOG_RU: Record<string, { title: string; description: string }> = {
${entries.join("\n")}
};
`,
    );
    console.log(`i18n:sync — catalog.ru.ts written, ${entries.length} entries.`);
  } else {
    console.log("i18n:sync — catalog.ru.ts current.");
  }
}

console.log(`i18n:sync — ${written} written, ${shipped.length - written} current.`);
if (written > 0) {
  console.log("Run `pnpm gen:wiring` to add the new overlays to the Russian docs barrel.");
}
