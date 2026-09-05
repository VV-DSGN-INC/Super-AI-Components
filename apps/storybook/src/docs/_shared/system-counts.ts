/** Every number the Welcome and Architecture pages state about this repo,
 *  counted from the tree instead of typed into prose.
 *
 *  The old Overview page said "30 AI Elements components" and "60 shadcn
 *  primitives" by hand, and CONTINUE.md §1 records the same class of drift
 *  for the catalog itself (114 frozen A–O items, 116 checked by the gate, two
 *  figures that had to be reconciled in a test). A retyped number has nothing
 *  that turns red when the tree moves past it, so the pages read these
 *  instead.
 *
 *  Two sources: the catalog manifest, which is the single source of truth the
 *  contract gate reads (CONTINUE.md §3.2), and lazy `import.meta.glob`s over
 *  the vendored copies this workbench renders. Lazy, so no module is loaded
 *  for the sake of a count; test files are excluded by pattern so vitest is
 *  never dragged into the Storybook build. */

import { MANIFEST } from "../../../../docs/lib/catalog.manifest";
import { LIB_MANIFEST } from "../../../../docs/lib/lib.manifest";
import coreRules from "../../../../../packages/ds-rules/rules/core.json";
import localRules from "../../../../../packages/ds-rules/rules/local.json";

const shipped = MANIFEST.filter((item) => item.status === "shipped");

/** The Marketing tier lives in its own registry namespace, outside the
 *  catalog manifest, so it is counted from its source files. */
const marketingModules = import.meta.glob([
  "../../../../docs/registry/marketing/*.tsx",
  "!../../../../docs/registry/marketing/*.test.tsx",
]);

/** The two vendored layers this workbench displays but does not publish. */
const uiModules = import.meta.glob("../../components/ui/*.tsx");
const aiElementsModules = import.meta.glob("../../components/ai-elements/*.tsx");

const storyModules = import.meta.glob("../../**/*.stories.tsx");
const docsPageModules = import.meta.glob("../**/*.mdx");

type RuleRecord = { id: string; severity: string };
const rules: RuleRecord[] = [...coreRules.rules, ...localRules.rules];
const bySeverity = (severity: string) => rules.filter((rule) => rule.severity === severity).length;

export type SystemCounts = {
  /** Shipped catalog items across families A–P. */
  catalogItems: number;
  primitives: number;
  components: number;
  blocks: number;
  /** Items cut from scope and retained as records (D9). */
  cut: number;
  families: number;
  /** registry:lib contracts (cost, use-view-mode), not catalog items. */
  libContracts: number;
  marketing: number;
  shadcn: number;
  aiElements: number;
  /** Declared states across shipped components; each one is a gated story. */
  statesDeclared: number;
  /** Declared regions across shipped blocks. */
  regionsDeclared: number;
  storyFiles: number;
  docsPages: number;
  rules: { total: number; blocker: number; warning: number; review: number };
};

export const systemCounts: SystemCounts = {
  catalogItems: shipped.length,
  primitives: shipped.filter((item) => item.layer === "primitive").length,
  components: shipped.filter((item) => item.layer === "component").length,
  blocks: shipped.filter((item) => item.layer === "block").length,
  cut: MANIFEST.filter((item) => item.status === "cut").length,
  families: new Set(shipped.map((item) => item.family)).size,
  libContracts: LIB_MANIFEST.filter((item) => item.status === "shipped").length,
  marketing: Object.keys(marketingModules).length,
  shadcn: Object.keys(uiModules).length,
  aiElements: Object.keys(aiElementsModules).length,
  statesDeclared: shipped.reduce((n, item) => n + item.states.length, 0),
  regionsDeclared: shipped.reduce((n, item) => n + (item.regions?.length ?? 0), 0),
  storyFiles: Object.keys(storyModules).length,
  docsPages: Object.keys(docsPageModules).length,
  rules: {
    total: rules.length,
    blocker: bySeverity("blocker"),
    warning: bySeverity("warning"),
    review: bySeverity("review"),
  },
};
