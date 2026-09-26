import { MANIFEST } from "./catalog.manifest";
import type { FamilyId, ManifestItem } from "./manifest-types";

export interface CatalogItem {
  id: string;
  name: string;
  title: string;
  description: string;
  family: FamilyId;
  group: "Primitives" | "Components" | "Blocks";
}

export const ORDER = { primitive: 0, component: 1, block: 2 } as const;

export const groupFor = (layer: ManifestItem["layer"]): CatalogItem["group"] =>
  layer === "primitive" ? "Primitives" : layer === "block" ? "Blocks" : "Components";

export const CATALOG_ITEMS: CatalogItem[] = MANIFEST.filter((i) => i.status === "shipped")
  .sort((a, b) => ORDER[a.layer] - ORDER[b.layer])
  .map((i) => ({
    id: i.id,
    name: i.name,
    title: i.title,
    description: i.description,
    family: i.family,
    group: groupFor(i.layer),
  }));

export const CATALOG = CATALOG_ITEMS.map((i) => i.name);
export type CatalogName = string;

/** Family titles, verbatim from the `## X · Title` headings in
 *  docs/design-system/catalog.md; lib/catalog.test.ts fails if they drift.
 *  `Record<FamilyId, …>` means adding a family to the union is a type error
 *  until it has a title here. */
export const FAMILY_TITLES: Record<FamilyId, string> = {
  A: "Primitives",
  B: "App shell & navigation",
  C: "Home & launcher",
  D: "Composer & context",
  E: "Generation & parameters",
  F: "Results & assets",
  G: "Canvas & nodes",
  H: "Timeline & transport",
  I: "Editor surfaces",
  J: "Library, filtering & discovery",
  K: "Documents & knowledge",
  L: "First-run & onboarding",
  M: "Account, plan & monetization",
  N: "Feedback, trust & observability",
  O: "Blocks",
  P: "Records & views",
};

const FAMILY_ORDER = Object.keys(FAMILY_TITLES) as FamilyId[];

/** One section of the home page. `family` is the catalog letter for A–P and
 *  the literal "Marketing" for the second registry namespace, so a heading
 *  reads "B · App shell & navigation" or "Marketing · Buttons". */
export interface CatalogFamily {
  family: string;
  title: string;
  items: Pick<CatalogItem, "name" | "title" | "description">[];
}

/** Shipped items grouped by family in catalog order. Cut families (G) have no
 *  shipped items and therefore no section. */
export const CATALOG_BY_FAMILY: CatalogFamily[] = FAMILY_ORDER.map((family) => ({
  family,
  title: FAMILY_TITLES[family],
  items: CATALOG_ITEMS.filter((i) => i.family === family).map(({ name, title, description }) => ({
    name,
    title,
    description,
  })),
})).filter((f) => f.items.length > 0);
