export type FamilyId =
  | "A"
  | "B"
  | "C"
  | "D"
  | "E"
  | "F"
  | "G"
  | "H"
  | "I"
  | "J"
  | "K"
  | "L"
  | "M"
  | "N"
  | "O"
  // P is the first family from the second reference board, kept separate from
  // A–O so the 114-item freeze stays literally true. See D18.
  | "P";

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
  /**
   * Absolute registry URLs from *other* vendors' registries, spread into
   * registryDependencies verbatim. C2 `suggestion-chips` is the first: it
   * declares AI Elements' own item rather than vendoring or reimplementing it,
   * which is what its spec's "composes rather than reimplements" line requires.
   * Distinct from `consumes` (registry-internal, resolved through self()) and
   * from `shadcn` (bare names shadcn resolves against its own registry).
   */
  external?: string[];
  /**
   * Blocks only. Kebab-case region identifiers taken from the block's
   * `Regions:` line in block-specs.md. Blocks have no `states` — a shell is a
   * layout, not a state machine — so regions are what the contract gate
   * asserts instead.
   */
  regions?: string[];
  /**
   * Extra files this item ships beyond `registry/super-ai/<name>.tsx`.
   *
   * Present only when a component's internals are genuinely its own. D3
   * forbids an L3 depending on another L3, so a component whose parts have
   * exactly one importer can make them neither sibling items nor a sideways
   * import — they have to be its own files. P1 `data-views` is the first:
   * its six view shells are imported by `data-views.tsx` and by nothing else,
   * and promoting them to family A was rejected because A1–A12 are atoms
   * (`kbd`, `entity-row`) and a calendar grid is not one.
   *
   * Omit it and the item emits its single name-derived file, unchanged — the
   * path all 102 shipped items take. Every file listed here is exempt from
   * check-contract's orphan detection, because this row accounts for it.
   */
  files?: { path: string; type: string; target: string }[];
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

/**
 * A cross-cutting contract shipped as a `registry:lib` item rather than a
 * component — `cost.tsx` is the first.
 *
 * Deliberately NOT a `ManifestItem` with a `layer: "lib"`. A contract has no
 * family (it is consumed across all of them), no states, no demo, no docs page
 * and no stories, so every one of those required fields would need a
 * placeholder, and `family` in particular feeds the per-family reconciliation
 * against catalog.md's Totals table — where a lib item would silently inflate
 * whichever family it was parked in. Keeping it a separate, narrower type
 * means the contract gate can hold it to what actually applies (the file and
 * its tests exist; its name cannot be shadowed by an orphan) without either
 * manifest lying about the other.
 */
export interface LibManifestItem {
  name: string;
  title: string;
  description: string;
  status: Extract<ManifestStatus, "planned" | "building" | "shipped">;
  /** shadcn registry items the code imports. */
  shadcn: string[];
  /** npm packages needed at runtime. */
  npm: string[];
  /** Where the file lands in a consumer's app, relative to their src root. */
  target: string;
}
