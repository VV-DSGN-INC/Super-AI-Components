/// <reference types="vite/client" />
import type { PatternDocs } from "@/lib/pattern-docs";

import { pascal } from "./scaffold-templates";

// import.meta.glob, for the same reason contract-source.ts uses it: the map is
// built from the real directory at transform time, so a typo in `slug` is a
// missing key and never a silent empty module.
const modules = import.meta.glob<Record<string, unknown>>("../../content/patterns/*.pattern.tsx");

/** Relative to this file; the glob's keys are spelled the same way. */
export function patternModulePath(slug: string): string {
  return `../../content/patterns/${slug}.pattern.tsx`;
}

/** Every module on disk, by slug, sorted. The directory is the list. */
export function patternSlugs(): string[] {
  return Object.keys(modules)
    .map((key) => key.replace(/^.*\/([^/]+)\.pattern\.tsx$/, "$1"))
    .sort();
}

/** Imports one module and returns its `<Pascal>Pattern` export. Throws,
 *  naming the slug, when the file is missing or exports the wrong name: an
 *  emit that cannot read its source must fail loudly, never write a blank. */
export async function loadPattern(slug: string): Promise<PatternDocs> {
  const loader = modules[patternModulePath(slug)];
  if (!loader) throw new Error(`${slug}: no pattern module at content/patterns/${slug}.pattern.tsx`);
  const mod = await loader();
  const key = `${pascal(slug)}Pattern`;
  const docs = mod[key];
  if (!docs || typeof docs !== "object") {
    throw new Error(`${slug}: content/patterns/${slug}.pattern.tsx does not export ${key}`);
  }
  return docs as PatternDocs;
}
