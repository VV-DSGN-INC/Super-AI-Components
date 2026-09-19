/**
 * The gate roster: every step CI runs, as data.
 *
 * gates.test.ts holds this list to .github/workflows/ci.yml and to
 * .claude/skills/gate-run/run-gates.sh, in order. The Architecture page and
 * the CI pipeline figure print it. Every string here is public prose.
 *
 * No Node imports: Storybook bundles this file.
 */

export type GateKind = "install" | "static" | "test" | "build" | "browser";

export interface GateCheck {
  /** Repo-relative path of the script, config or test that does the checking. */
  file: string;
  protects: string;
}

export interface GateRow {
  /** The step's `name:` in ci.yml when it has one, otherwise its `run:` string. */
  ciStep: string;
  /** The label run-gates.sh gives the same step. */
  localLabel: string;
  title: string;
  kind: GateKind;
  /** One sentence: what breaks, and for whom, when this gate is off. */
  protects: string;
  checks: GateCheck[];
  /** Shrink-only ledgers this gate enforces, repo-relative. */
  ledgers?: string[];
  /** What this gate is known not to see. Printed on the page. */
  blindSpot?: string;
  /** True for the steps that exercise what a consumer installs. */
  product?: true;
}

/** ci.yml `run:` steps that are not gates, each with its reason. */
export const PLUMBING: { ciStep: string; reason: string }[] = [];

export const GATE_ROWS: GateRow[] = [
  {
    ciStep: "pnpm install --frozen-lockfile",
    localLabel: "install",
    title: "Install from the lockfile",
    kind: "install",
    protects:
      "Every gate below runs against the dependency versions the lockfile records, so nothing passes on a newer package than the one that ships.",
    checks: [{ file: "pnpm-lock.yaml", protects: "The resolved version of every dependency." }],
  },
  {
    ciStep: "pnpm lint",
    localLabel: "lint",
    title: "Lint",
    kind: "static",
    protects: "Catches unescaped quotes in JSX prose and unused code before a reviewer has to.",
    checks: [
      { file: "apps/docs/eslint.config.mjs", protects: "Rules for the docs app and the registry sources." },
      { file: "apps/storybook/eslint.config.mjs", protects: "Rules for the stories." },
    ],
  },
  {
    ciStep: "pnpm format:check",
    localLabel: "format:check",
    title: "Formatting",
    kind: "static",
    protects:
      "Keeps a diff about the change. A generated file that must match its generator byte for byte is listed as ignored and is never reformatted.",
    checks: [
      { file: ".prettierrc.json", protects: "The one formatting configuration." },
      { file: ".prettierignore", protects: "The generated files whose emitters own their shape." },
    ],
  },
  {
    ciStep: "pnpm typecheck",
    localLabel: "typecheck",
    title: "Types",
    kind: "static",
    protects:
      "A prop a component does not declare is an error here, in the registry sources, the stories and the rule records alike.",
    checks: [
      { file: "apps/docs/tsconfig.json", protects: "The docs app, the registry and the scripts." },
      { file: "apps/storybook/tsconfig.json", protects: "The stories, against the real component types." },
      { file: "packages/ds-rules/tsconfig.json", protects: "The rule records." },
    ],
  },
  {
    ciStep: "pnpm check:tokens",
    localLabel: "check:tokens",
    title: "Token contract",
    kind: "static",
    protects:
      "No raw colour, palette class, gradient or banned motion utility reaches a registry component, so a consumer's theme restyles everything they install.",
    checks: [
      { file: "packages/ds-rules/rulecheck.mjs", protects: "The detector." },
      {
        file: "packages/ds-rules/rules/core.json",
        protects: "The bans shared with the sibling design system.",
      },
      { file: "packages/ds-rules/rules/local.json", protects: "The bans specific to this repository." },
    ],
    blindSpot:
      "It reads one class string at a time. Muted text in a child whose ancestor paints the muted surface passes here, and every contrast bug that shipped had that shape. The accessibility step below is the backstop.",
  },
  {
    ciStep: "pnpm check:contract",
    localLabel: "check:contract",
    title: "Manifest, story and docs contract",
    kind: "static",
    protects:
      "Every catalog item has the story exports its declared states promise, documentation whose citations resolve, and dependencies reconciled from real imports.",
    checks: [
      {
        file: "apps/docs/scripts/check-contract.mts",
        protects: "Manifest, story and docs agreement, and the generated wiring files byte for byte.",
      },
      {
        file: "apps/docs/scripts/check-citations.mts",
        protects: "Every backticked citation in the component docs.",
      },
      {
        file: "apps/docs/scripts/reconcile-deps.mts",
        protects: "Declared dependencies against what the source really imports.",
      },
    ],
  },
  {
    ciStep: "pnpm test",
    localLabel: "test",
    title: "Unit tests and ratchets",
    kind: "test",
    protects:
      "The ledgers below may shrink and never grow, derived files must match their sources, and the numbers on this page must match the tree.",
    checks: [
      {
        file: "apps/docs/lib/catalog.manifest.test.ts",
        protects: "The catalog is complete and the cut families stay cut.",
      },
      {
        file: "apps/docs/scripts/new-component.test.ts",
        protects: "The scaffolder never emits a state named `default`.",
      },
      {
        file: "apps/docs/scripts/lib/a11y-ratchet.test.ts",
        protects: "The accessibility exclusion list only shrinks.",
      },
      {
        file: "apps/docs/scripts/lib/story-coverage.test.ts",
        protects: "Unmet story obligations only shrink.",
      },
      {
        file: "apps/docs/scripts/lib/contract-coverage.test.ts",
        protects: "Unwritten contract fields only shrink.",
      },
      {
        file: "apps/docs/scripts/lib/cssvars-liveness.test.ts",
        protects: "Every CSS variable a component reads resolves, and none is declared unread.",
      },
      {
        file: "apps/docs/scripts/lib/contract-emit.test.ts",
        protects:
          "Installed contracts, the routing table and the `llms.txt` corpus match the guidance modules.",
      },
      {
        file: "apps/docs/scripts/lib/claude-md.test.ts",
        protects: "The instructions file stays under its byte ceiling, and each rule in it names a gate.",
      },
      {
        file: "packages/ds-rules/src/emit.test.ts",
        protects: "The emitted rule JSON matches the typed records.",
      },
      {
        file: "apps/docs/scripts/lib/system-facts.test.ts",
        protects: "The numbers on these pages match the tree.",
      },
      {
        file: "apps/docs/content/system/gates.test.ts",
        protects: "This roster matches the workflow and the local gate script.",
      },
      {
        file: "apps/docs/content/system/claims.test.ts",
        protects: "Counts typed into prose elsewhere match the tree.",
      },
      {
        file: "apps/docs/content/system/pages.test.ts",
        protects: "These pages cite real files, type no numbers and keep the writing rules.",
      },
    ],
    ledgers: [
      "apps/docs/cssvars-liveness.baseline.json",
      "apps/docs/scripts/lib/contract-coverage.baseline.json",
      "apps/docs/scripts/lib/story-coverage.baseline.json",
      "apps/storybook/a11y-exclusions.baseline.json",
    ],
  },
  {
    ciStep: "pnpm build:registry",
    localLabel: "build:registry",
    title: "Registry build",
    kind: "build",
    protects:
      "Regenerates what consumers install. A stale registry is invisible locally and broken for them.",
    checks: [
      {
        file: "apps/docs/scripts/gen-wiring.mts",
        protects: "The generated wiring between manifest, demos and docs.",
      },
      {
        file: "apps/docs/scripts/gen-registry.mts",
        protects: "The registry index that `shadcn build` reads.",
      },
    ],
  },
  {
    ciStep: "pnpm build",
    localLabel: "build",
    title: "Full build",
    kind: "build",
    protects: "The docs app and Storybook both compile from the same sources the registry ships.",
    checks: [
      { file: "apps/docs/next.config.ts", protects: "The docs app build." },
      { file: "apps/storybook/.storybook/main.ts", protects: "The Storybook build." },
    ],
  },
  {
    ciStep: "Playwright smoke",
    localLabel: "playwright smoke",
    title: "Smoke test of every page",
    kind: "browser",
    protects: "Every component page renders in a real browser without a console error.",
    checks: [
      { file: "apps/docs/e2e/smoke.spec.ts", protects: "One test per catalog item, plus the system pages." },
      { file: "apps/docs/playwright.config.ts", protects: "Serves the built app on its own port." },
    ],
    blindSpot:
      "It serves the prebuilt app. Edit a source file without rebuilding and a green run proves nothing.",
    product: true,
  },
  {
    ciStep: "Storybook a11y + interaction",
    localLabel: "storybook a11y",
    title: "Accessibility and interaction",
    kind: "browser",
    protects:
      "Every story passes axe and its own interaction assertions in Chromium. This is the step that catches the contrast shape the token gate cannot see.",
    checks: [
      {
        file: "apps/storybook/vitest.config.ts",
        protects: "Runs every story in a browser, with the exclusion list the ratchet guards.",
      },
    ],
    product: true,
  },
  {
    ciStep: "Consumer install test",
    localLabel: "consumer install",
    title: "Consumer install",
    kind: "build",
    protects:
      "Installs every item into a fresh app with `shadcn add` and builds it. A component that looks right here and breaks there has failed.",
    checks: [
      { file: "apps/docs/scripts/consumer-test.sh", protects: "The install and the build, end to end." },
    ],
    product: true,
  },
];
