import { MANIFEST } from "./catalog.manifest";
import {
  SHAPE_OF_AI_CATEGORY_TITLES,
  type FamilyId,
  type ManifestItem,
  type ShapeOfAiCategory,
  type ShapeOfAiPattern,
} from "./manifest-types";

export interface CatalogItem {
  id: string;
  name: string;
  title: string;
  description: string;
  family: FamilyId;
  group: "Primitives" | "Components" | "Blocks";
  /** Shape of AI cross-reference (D27); empty when the audit maps nothing. */
  patterns: ShapeOfAiPattern[];
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
    patterns: i.patterns ?? [],
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
  Q: "Presentational chrome (Geist)",
};

const FAMILY_ORDER = Object.keys(FAMILY_TITLES) as FamilyId[];

/** One section of the home page. `family` is the catalog letter for A–P and
 *  the literal "Marketing" for the second registry namespace, so a heading
 *  reads "B · App shell & navigation" or "Marketing · Buttons". */
export interface CatalogFamily {
  family: string;
  title: string;
  items: (Pick<CatalogItem, "name" | "title" | "description"> & { patterns?: ShapeOfAiPattern[] })[];
}

/** Shipped items grouped by family in catalog order. Cut families (G) have no
 *  shipped items and therefore no section. */
export const CATALOG_BY_FAMILY: CatalogFamily[] = FAMILY_ORDER.map((family) => ({
  family,
  title: FAMILY_TITLES[family],
  items: CATALOG_ITEMS.filter((i) => i.family === family).map(({ name, title, description, patterns }) => ({
    name,
    title,
    description,
    patterns,
  })),
})).filter((f) => f.items.length > 0);

/** Splits `trust-builders/caveat` into the category key and its readable
 *  parts: "Trust builders" and "Caveat". The category prefix is a union member
 *  by construction (ShapeOfAiPattern), so the cast is safe. */
export const describePattern = (pattern: ShapeOfAiPattern) => {
  const [category, slug] = pattern.split("/") as [ShapeOfAiCategory, string];
  const words = slug.replace(/-/g, " ");
  return {
    category,
    categoryTitle: SHAPE_OF_AI_CATEGORY_TITLES[category],
    label: words.charAt(0).toUpperCase() + words.slice(1),
  };
};
