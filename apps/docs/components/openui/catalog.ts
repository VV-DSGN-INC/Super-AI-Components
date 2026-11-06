import { z } from "zod";

// Relative, not `@/`: Storybook compiles this file and maps `@/` to its own
// src, so only paths it aliases into apps/docs (registry, components/ui)
// may use the alias.
import catalogJson from "../../public/openui/catalog.json";
import type { CatalogComponent, OpenUICatalog } from "../../lib/openui-catalog-types";

/** The emitted catalog, typed. A surface that names a slug the catalog lacks
 *  throws at import, so a renamed registry item fails this library's suite
 *  and the page build rather than drifting silently. */
export const catalog = catalogJson as OpenUICatalog;

export function catalogEntry(slug: string): CatalogComponent {
  const entry = catalog.components.find((c) => c.slug === slug);
  if (!entry) throw new Error(`openui catalog has no component "${slug}"`);
  return entry;
}

function keptValues(slug: string, prop: string, exclude: string[] = []) {
  const axis = catalogEntry(slug).variants.find((v) => v.prop === prop);
  if (!axis) throw new Error(`openui catalog: "${slug}" has no flat axis "${prop}"`);
  return { axis, kept: axis.values.filter((v) => !exclude.includes(v.value)) };
}

/** A zod enum whose values and per-value guidance are the meta's. The
 *  guidance rides in `.describe()`, which reaches `toJSONSchema()` (what a
 *  parser or a tool-calling model reads). `exclude` is the surface's
 *  judgment (an empty state inside a chat answer never needs the full-page
 *  size). */
export function enumFor(slug: string, prop: string, opts: { exclude?: string[] } = {}) {
  const { axis, kept } = keptValues(slug, prop, opts.exclude);
  const values = kept.map((v) => v.value) as [string, ...string[]];
  const schema = z.enum(values).describe(kept.map((v) => `${v.value}: ${v.intent}`).join(" "));
  return axis.default && values.includes(axis.default) ? schema.default(axis.default) : schema;
}

export function descriptionFor(slug: string): string {
  return catalogEntry(slug).description;
}

/** The meta's donts and pitfalls, prefixed with the surface name the model
 *  sees, for a component group's notes. */
export function notesFor(slug: string, name: string): string[] {
  return catalogEntry(slug).notes.map((n) => `${name}: ${n}`);
}

/** The same per-value guidance as one group note. Measured on react-lang
 *  0.3.2: `.prompt()` prints each prop's type but never its `.describe()`
 *  text, so without this line the model sees the enum values and none of the
 *  intent that picks between them. Pass the same `exclude` as `enumFor`. */
export function intentNote(
  slug: string,
  prop: string,
  name: string,
  opts: { exclude?: string[] } = {},
): string {
  const { kept } = keptValues(slug, prop, opts.exclude);
  return `${name}.${prop}: ${kept.map((v) => `"${v.value}" ${v.intent}`).join(" ")}`;
}
