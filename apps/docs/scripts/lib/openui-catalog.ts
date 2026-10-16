import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { FAMILY_TITLES } from "@/lib/catalog";
import type { FamilyId, ManifestItem } from "@/lib/manifest-types";

import type { ContractMeta } from "./contract-emit";

/** The OpenUI component catalog: every shipped item's contract as data an
 *  OpenUI library can turn into `defineComponent` calls (name, description,
 *  flat enum axes with per-value intent, notes, placement). Judgment-free:
 *  the `.meta.json` files are the source, `openui-catalog.test.ts` holds the
 *  file to the tree, and a library on top does the curating. Ported from the
 *  design-system-rebuild emitter (its `src/lib/openui/build.ts`); the field
 *  mapping is this repo's meta shape, spec 2026-09-14 §4.1. */

/** Under `public/`, so the docs site serves it at `/openui/catalog.json`
 *  beside `llms.txt`; JSON, so the token gate (which scans `.tsx`) never
 *  reads it. */
export const CATALOG_FILE = "apps/docs/public/openui/catalog.json";

export const META_DIR = "apps/docs/registry/super-ai";

const BARE_IDENTIFIER = /^[A-Za-z_$][\w$]*$/;

export type CatalogVariant = {
  prop: string;
  default?: string;
  values: { value: string; intent: string }[];
};

export type CatalogComponent = {
  /** Display name, the meta's `title`. */
  name: string;
  /** Registry name, the meta's `name`; what `shadcn add` takes. */
  slug: string;
  family: FamilyId;
  layer: ManifestItem["layer"];
  meta: string;
  docs: string;
  /** The meta's `purpose`: what the item is, which is what a model places by. */
  description: string;
  /** Empty when the guidance module wrote no axes, or wrote `{ none }`. */
  variants: CatalogVariant[];
  /** The meta's `donts`, then its `pitfalls`, verbatim. */
  notes: string[];
  /** Registry items this one composes. */
  consumes: string[];
  /** Registry items that compose this one: the inverse of `consumes`. */
  consumedBy: string[];
  insteadUse: { slug: string; when: string }[];
};

export type CatalogGroup = { family: FamilyId; title: string; components: string[] };

export type OpenUICatalog = {
  version: 1;
  generatedFrom: string;
  components: CatalogComponent[];
  groups: CatalogGroup[];
};

/** OpenUI props are flat and positional, so only an axis with a bare
 *  identifier becomes an enum. `propName` is the meta's own promotion of
 *  that identifier; a `prop` that is one already qualifies on its own. A
 *  part-scoped axis ("ToolHeader · state" with no propName) is skipped. */
export function flatAxes(meta: Pick<ContractMeta, "variants">): CatalogVariant[] {
  if (!Array.isArray(meta.variants)) return [];
  return meta.variants.flatMap((axis) => {
    const prop = axis.propName ?? (BARE_IDENTIFIER.test(axis.prop) ? axis.prop : undefined);
    if (!prop) return [];
    const out: CatalogVariant = {
      prop,
      values: axis.values.map((v) => ({ value: v.value, intent: v.intent })),
    };
    if (axis.default !== undefined) out.default = axis.default;
    return [out];
  });
}

export function catalogComponent(meta: ContractMeta, consumedBy: string[] = []): CatalogComponent {
  return {
    name: meta.title,
    slug: meta.name,
    family: meta.family,
    layer: meta.layer,
    meta: `registry/super-ai/${meta.name}.meta.json`,
    docs: meta.docs,
    description: meta.purpose,
    variants: flatAxes(meta),
    notes: [...meta.donts, ...meta.pitfalls],
    consumes: meta.consumes,
    consumedBy,
    insteadUse: Array.isArray(meta.insteadUse)
      ? meta.insteadUse.map((r) => ({ slug: r.component, when: r.when }))
      : [],
  };
}

export function buildCatalog(metas: ContractMeta[]): OpenUICatalog {
  const consumedBy = new Map<string, string[]>();
  for (const m of metas) {
    for (const child of m.consumes) consumedBy.set(child, [...(consumedBy.get(child) ?? []), m.name]);
  }
  const components = metas
    .map((m) => catalogComponent(m, [...(consumedBy.get(m.name) ?? [])].sort()))
    .sort((a, b) => a.slug.localeCompare(b.slug));
  const byFamily = new Map<FamilyId, string[]>();
  for (const c of components) byFamily.set(c.family, [...(byFamily.get(c.family) ?? []), c.slug]);
  const groups = [...byFamily]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([family, slugs]) => ({ family, title: FAMILY_TITLES[family], components: slugs }));
  return { version: 1, generatedFrom: `${META_DIR}/*.meta.json`, components, groups };
}

/** Every committed meta under `<repo>/apps/docs/registry/super-ai`. */
export function readMetas(repo: string): ContractMeta[] {
  const dir = join(repo, META_DIR);
  return readdirSync(dir)
    .filter((f) => f.endsWith(".meta.json"))
    .map((f) => JSON.parse(readFileSync(join(dir, f), "utf8")) as ContractMeta);
}

export function serializeCatalog(catalog: OpenUICatalog): string {
  return JSON.stringify(catalog, null, 2) + "\n";
}
