/**
 * Files in this repository that are outputs: what each derives from, the
 * command that writes it, and what holds it to its source. Every `note` is
 * public prose. No Node imports: Storybook bundles this file.
 */

export interface DerivedRow {
  /** Repo-relative source the outputs are written from. */
  source: string;
  /** Repo-relative outputs. An entry with `*` or `<` is a pattern. */
  derived: string[];
  command: string;
  /** Repo-relative test or script that compares output with source. */
  heldBy: string;
  committed: boolean;
  note: string;
}

export const DERIVED_ROWS: DerivedRow[] = [
  {
    source: "apps/docs/registry/super-ai",
    derived: ["apps/docs/public/r"],
    command: "pnpm build:registry",
    heldBy: "apps/docs/scripts/consumer-test.sh",
    committed: false,
    note: "What `shadcn add` downloads. Built fresh in CI and never committed.",
  },
  {
    source: "apps/docs/content/components",
    derived: [
      "apps/docs/registry/super-ai/<name>.meta.json",
      "apps/docs/index/components.toon",
      "apps/docs/public/llms.txt",
      "apps/docs/public/llms-full.txt",
      "apps/docs/public/llms",
    ],
    command: "cd apps/docs && pnpm contract:emit",
    heldBy: "apps/docs/scripts/lib/contract-emit.test.ts",
    committed: true,
    note: "The contracts layer. One guidance module per component is the source for all of it.",
  },
  {
    source: "packages/ds-rules/src",
    derived: ["packages/ds-rules/rules/core.json", "packages/ds-rules/rules/local.json"],
    command: "pnpm --filter ds-rules rules:emit",
    heldBy: "packages/ds-rules/src/emit.test.ts",
    committed: true,
    note: "The rule records as JSON, which is what the detector reads.",
  },
  {
    source: "apps/docs/lib/catalog.manifest.ts",
    derived: ["apps/docs/lib/demos.generated.ts", "apps/docs/lib/docs.generated.ts"],
    command: "cd apps/docs && pnpm gen:wiring",
    heldBy: "apps/docs/scripts/check-contract.mts",
    committed: true,
    note: "The wiring from each catalog item to its demo and its documentation.",
  },
  {
    source: "apps/docs/scripts/lib/system-facts.ts",
    derived: ["apps/docs/content/system/facts.json"],
    command: "cd apps/docs && pnpm facts:emit",
    heldBy: "apps/docs/scripts/lib/system-facts.test.ts",
    committed: true,
    note: "The numbers on these pages, counted from the tree.",
  },
];
