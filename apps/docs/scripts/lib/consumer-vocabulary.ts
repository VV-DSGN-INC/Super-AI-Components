/** Detector half of TOK-9. Pure functions over source text; the test file
 *  owns the manifest lookups. Kept separate so harness/assert-stock.mts can
 *  reuse customPropNames on a scaffolded consumer's stylesheet. */

export interface Read {
  /** A colour stem (`warning`) or a custom property (`--warning`). */
  name: string;
  line: number;
  kind: "color" | "var";
}

export interface Allowed {
  colors: Set<string>;
  vars: Set<string>;
}

/** Stems of every `--color-<stem>:` declaration, wherever it sits. */
export function themeColorNames(css: string): Set<string> {
  return new Set([...css.matchAll(/--color-([a-zA-Z0-9-]+)\s*:/g)].map((m) => m[1]));
}

/** Every `--x:` declaration, `--` included. */
export function customPropNames(css: string): Set<string> {
  return new Set([...css.matchAll(/(--[a-zA-Z0-9-]+)\s*:/g)].map((m) => m[1]));
}

/** Custom properties declared inside one `/* == name == *\/` block of
 *  marketing.css — the slicing gen-registry.mts does to build cssVars. */
export function marketingBlockNames(css: string, block: string): Set<string> {
  const marker = /^\/\* == ([\w-]+) == \*\/$/gm;
  const starts: { name: string; index: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = marker.exec(css))) starts.push({ name: m[1], index: m.index });
  const i = starts.findIndex((s) => s.name === block);
  if (i === -1) return new Set();
  const end = i + 1 < starts.length ? starts[i + 1].index : css.length;
  return customPropNames(css.slice(starts[i].index, end));
}

const COLOR_UTILITY =
  /(?<![\w-])(?:bg|text|border|ring|inset-ring|outline|fill|stroke|divide|decoration|caret|placeholder|accent|shadow|from|via|to)-([a-z][a-z0-9-]*)/g;

/** Colour-utility stems that resolve against `declared`. A stem the docs
 *  stylesheet does not declare (`text-left`, `bg-transparent`, `bg-surface-x`)
 *  is filtered out: it is either a Tailwind built-in or colourless everywhere. */
export function colorReads(source: string, declared: Set<string>): Read[] {
  const out: Read[] = [];
  source.split("\n").forEach((text, i) => {
    for (const m of text.matchAll(COLOR_UTILITY)) {
      if (declared.has(m[1])) out.push({ name: m[1], line: i + 1, kind: "color" });
    }
  });
  return out;
}

/** `var(--x)` and Tailwind's `(--x)` shorthand, filtered to `declared`. */
export function varReads(source: string, declared: Set<string>): Read[] {
  const out: Read[] = [];
  source.split("\n").forEach((text, i) => {
    for (const m of text.matchAll(/\((--[a-zA-Z0-9-]+)\)/g)) {
      if (declared.has(m[1])) out.push({ name: m[1], line: i + 1, kind: "var" });
    }
  });
  return out;
}

export function vocabularyViolations(reads: Read[], allowed: Allowed): Read[] {
  return reads.filter((r) => (r.kind === "color" ? !allowed.colors.has(r.name) : !allowed.vars.has(r.name)));
}
