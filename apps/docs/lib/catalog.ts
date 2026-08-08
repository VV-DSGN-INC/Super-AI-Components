import { MANIFEST } from "./catalog.manifest";
import type { ManifestItem } from "./manifest-types";

export interface CatalogItem {
  name: string;
  title: string;
  description: string;
  group: "Primitives" | "Components" | "Blocks";
}

const ORDER = { primitive: 0, component: 1, block: 2 } as const;

export const groupFor = (layer: ManifestItem["layer"]): CatalogItem["group"] =>
  layer === "primitive" ? "Primitives" : layer === "block" ? "Blocks" : "Components";

export const CATALOG_ITEMS: CatalogItem[] = MANIFEST.filter((i) => i.status === "shipped")
  .sort((a, b) => ORDER[a.layer] - ORDER[b.layer])
  .map((i) => ({
    name: i.name,
    title: i.title,
    description: i.description,
    group: groupFor(i.layer),
  }));

export const CATALOG = CATALOG_ITEMS.map((i) => i.name);
export type CatalogName = string;
