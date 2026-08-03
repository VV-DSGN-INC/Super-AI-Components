export type FamilyId = "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I" | "J" | "K" | "L" | "M" | "N" | "O";

export type ManifestStatus = "planned" | "building" | "shipped" | "cut";

export interface ManifestItem {
  /** Catalog ID, e.g. "B2". The join key to catalog.md and component-specs.md. */
  id: string;
  /** Registry name, e.g. "workspace-switcher". */
  name: string;
  title: string;
  description: string;
  family: FamilyId;
  layer: "primitive" | "component" | "block";
  status: ManifestStatus;
  wave: number;
  /** Design-level base from catalog.md. Documentation only — never build input. */
  base: string[];
  /** shadcn registry items the code imports. Build input. */
  shadcn: string[];
  /** Registry-internal items this component composes. Build input. */
  consumes: string[];
  /** npm packages the component needs at runtime. */
  npm: string[];
  /** States the story file must export. */
  states: string[];
  /** Anchor into component-specs.md. */
  specAnchor: string;
  /**
   * Shipped before Wave 1.5. Exempt from the story-state and documentation
   * assertions until the retrofit task runs. Never set on a new component.
   */
  contractExempt?: true;
}

export const shippedItems = (items: ManifestItem[]) => items.filter((i) => i.status === "shipped");
