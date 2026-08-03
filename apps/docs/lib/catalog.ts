import { MANIFEST } from "./catalog.manifest";

export interface CatalogItem {
  name: string;
  title: string;
  description: string;
  group: "Primitives" | "Components";
}

const ORDER = { primitive: 0, component: 1, block: 2 } as const;

export const CATALOG_ITEMS: CatalogItem[] = MANIFEST.filter((i) => i.status === "shipped")
  .sort((a, b) => ORDER[a.layer] - ORDER[b.layer])
  .map((i) => ({
    name: i.name,
    title: i.title,
    description: i.description,
    group: i.layer === "primitive" ? "Primitives" : "Components",
  }));

export const CATALOG = CATALOG_ITEMS.map((i) => i.name);
export type CatalogName = string;
