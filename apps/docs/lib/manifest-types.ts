export type FamilyId = "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I" | "J" | "K" | "L" | "M" | "N" | "O";

export type ManifestStatus = "planned" | "building" | "shipped" | "cut";

/**
 * Registry-item `cssVars` shape (shadcn's registry schema), reproduced here
 * rather than imported so the manifest has no dependency on the `shadcn`
 * package. Matches `WARNING_CSS_VARS` in the manifest and in the pre-manifest
 * `gen-registry.mts` extras record it replaces.
 */
export type CssVars = {
  theme?: Record<string, string>;
  light?: Record<string, string>;
  dark?: Record<string, string>;
};

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
  /**
   * Registry-level CSS custom properties this component's code depends on,
   * beyond stock shadcn (e.g. the `--warning` token used by near-limit /
   * over-limit states). Threaded verbatim into the emitted registry.json item
   * by deriveExtras() so `npx shadcn add` installs the token alongside the
   * component — omitting it here silently ships a colourless component to
   * any consumer who doesn't already define the var themselves.
   */
  cssVars?: CssVars;
}

export const shippedItems = (items: ManifestItem[]) => items.filter((i) => i.status === "shipped");
