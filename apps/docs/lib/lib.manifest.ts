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
  {
    name: "initials",
    title: "Initials",
    description:
      "Two-letter initials from a name, for the avatar marks A10, B2 and K4 all paint when no image is supplied.",
    status: "shipped",
    shadcn: [],
    npm: [],
    target: "lib/initials.tsx",
  },
  {
    name: "flow-types",
    title: "Flow contracts",
    description:
      "Family G's shared vocabulary: the six-status contract, the ten typed-port keys, the handle-id codec that decides which ports connect, and the three node widths.",
    status: "shipped",
    shadcn: [],
    npm: [],
    target: "lib/flow-types.ts",
  },
  {
    name: "use-flow-runner",
    title: "Flow runner",
    description:
      "Headless topological executor for a typed node graph: per-node status, a content-hash cache, cancellation, cycle detection and scoped runs. Executor-swappable; ships no UI.",
    status: "shipped",
    shadcn: [],
    npm: [],
    target: "lib/use-flow-runner.ts",
  },
];

export const LIB_NAMES = LIB_MANIFEST.map((i) => i.name);
