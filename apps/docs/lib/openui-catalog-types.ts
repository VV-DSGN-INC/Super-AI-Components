// Relative import on purpose: Storybook compiles the demo library that reads
// these types and maps `@/` to its own src.
import type { FamilyId, ManifestItem } from "./manifest-types";

/** The shape of `public/openui/catalog.json`, emitted by
 *  `scripts/lib/openui-catalog.ts`. Its own module so the docs-site demo
 *  library can read the types without importing the emitter. */

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
