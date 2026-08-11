// The registry's cross-cutting contracts, shipped as `registry:lib` items.
//
// Hand-maintained, like catalog.manifest.ts — nothing generates this. It is
// separate from MANIFEST because a contract is not a catalog item: it has no
// family, no states, no demo and no docs page, and counting it as one would
// corrupt the per-family reconciliation against catalog.md. See
// LibManifestItem in manifest-types.ts for the full reasoning.
import type { LibManifestItem } from "./manifest-types";

export const LIB_MANIFEST: LibManifestItem[] = [
  {
    name: "cost",
    title: "Cost & generation contracts",
    description:
      "The shared Cost type, its optional provider, and the generation lifecycle union every generation-aware component reports.",
    status: "shipped",
    shadcn: [],
    npm: [],
    target: "lib/cost.tsx",
  },
  {
    name: "use-view-mode",
    title: "View & detail mode contracts",
    description:
      "The collection-axis and record-axis preference hooks — each validated against what a section actually offers, persisted independently, and inert without a window.",
    status: "shipped",
    shadcn: [],
    npm: [],
    target: "lib/use-view-mode.tsx",
  },
];

export const LIB_NAMES = LIB_MANIFEST.map((i) => i.name);
