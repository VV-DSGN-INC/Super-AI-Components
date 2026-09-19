import type { SystemPage } from "@/lib/system-page";

/**
 * A draft for Nick's final pass. Remove `draft: true` when he has done it.
 *
 * Rules for every string here, enforced by pages.test.ts: numbers only as
 * `{facts.key}` placeholders, backticked repo paths must exist, no em dash, no
 * exclamation mark, none of the banned words.
 */
export const architecturePage: SystemPage = {
  slug: "architecture",
  title: "Architecture",
  description:
    "The machinery behind the components: where each kind of file lives, what is generated from what, and which check fails when any of it goes out of step.",
  draft: true,
  lede: [
    "This page is the machinery behind the components: where each kind of file lives, what is generated from what, and which check fails when any of it goes out of step.",
    "The short version: the catalog manifest is the one list of what exists, every component ships with a story and a written contract, generated files are compared with their sources on every run, and {facts.ciSteps} gate steps hold all of that in place. Read as far as you need. Every section adds detail to that paragraph and none of them changes it.",
    "Every number on this page is counted from the repository by a script and checked by a test. None is typed by hand.",
  ],
  sections: [
    {
      id: "loops",
      heading: "The build loop, and the loop that is missing",
      blocks: [
        {
          kind: "p",
          text: "One loop runs today. A change starts from the written contracts, produces a component together with its story, its documentation and its registry entry, passes the gates locally and in CI, and ends at a person.",
        },
        {
          kind: "figure",
          figure: "loops",
          caption:
            "The build loop as it runs, the edge that turns a rejection into a rule, and the audit loop this repository does not have yet.",
        },
        {
          kind: "p",
          text: "The missing loop matters. Gates run when something changes. Nothing re-checks the main branch on a schedule and nothing compares production with it, and because deploys are manual the two have drifted apart before. Closing that gap is planned work.",
        },
      ],
    },
    {
      id: "elements",
      heading: "What the system is made of",
      blocks: [
        {
          kind: "table",
          columns: ["Kind", "What it is", "Where it lives"],
          rows: [
            [
              "Instructions",
              "A map every session reads first. It points at the contracts and restates none of them.",
              "`CLAUDE.md`",
            ],
            [
              "Build briefs",
              "The house contract each component and block is built to.",
              "`docs/design-system/component-build-brief.md`",
            ],
            [
              "Rules",
              "{facts.rules} typed records of what generated UI may not do, {facts.ruleBlockers} of them blocking.",
              "`packages/ds-rules/src`",
            ],
            [
              "Skills",
              "{facts.skills} runnable procedures: build, integrate, run the gates, audit the look.",
              "`.claude/skills`",
            ],
            [
              "Manifest",
              "The single list of what exists: {facts.shipped} shipped items across {facts.shippedPrimitives} primitives, {facts.shippedComponents} components and {facts.shippedBlocks} blocks.",
              "`apps/docs/lib/catalog.manifest.ts`",
            ],
            [
              "Contracts",
              "{facts.contracts} usage contracts, one per item, derived from its guidance module.",
              "`apps/docs/registry/super-ai`",
            ],
            [
              "Stories",
              "{facts.storyFiles} story files. Declared-state stories restate the types. Case stories record the situations a component really meets.",
              "`apps/storybook/src/stories/super-ai`",
            ],
            [
              "Prose pages",
              "{facts.prosePages} pages of foundations, patterns and content guidance.",
              "`apps/storybook/src/stories`",
            ],
            ["Specs and plans", "Dated decisions, written before building.", "`docs/superpowers/specs`"],
            ["Gates", "{facts.ciSteps} steps that every change passes.", "`.github/workflows/ci.yml`"],
          ],
        },
      ],
    },
    {
      id: "derived",
      heading: "What is generated from what",
      blocks: [
        {
          kind: "p",
          text: "Several files in this repository are outputs. Nobody edits them. A command writes each one from its source, and a test or a gate compares the two on every run, so a stale output fails and cannot go on describing an older tree.",
        },
        { kind: "derived" },
        {
          kind: "p",
          text: "The numbers on this page work the same way. They live in `apps/docs/content/system/facts.json`, and they are as of the last time that file was written. A test fails when the tree has moved past it.",
        },
      ],
    },
    {
      id: "gates",
      heading: "The gates",
      blocks: [
        {
          kind: "p",
          text: "Each step below runs in CI and, in the same order, in the local script at `.claude/skills/gate-run/run-gates.sh`. The order is a list in one place, and a test fails when the workflow, the script and this page disagree.",
        },
        {
          kind: "figure",
          figure: "ci-pipeline",
          caption:
            "The steps in the order they run. The marked steps exercise what a consumer actually installs.",
        },
        { kind: "gates" },
        {
          kind: "p",
          text: "Two properties are deliberate. {facts.ledgers} ledgers are ratchets: the accessibility exclusions, the unmet story obligations, the unwritten contract fields and the CSS variable debts may shrink and may never grow. And a scanner earns trust by failing first: every rule record ships a fixture that must trip it, because a scan that finds nothing and a scan that looked at nothing print the same result.",
        },
      ],
    },
    {
      id: "contracts",
      heading: "Usage contracts",
      blocks: [
        {
          kind: "p",
          text: "Every item has a guidance module, and its contract is derived from that module. These are the fields an agent reads before placing a component.",
        },
        {
          kind: "table",
          columns: ["Field", "What it holds"],
          rows: [
            ["`purpose`", "The job the component does."],
            ["`usage`", "When to reach for it."],
            ["`variants`", "Each variant with its intent: when to pick it."],
            ["`insteadUse`", "Near twins, and when to reach for them instead."],
            ["`dos` and `donts`", "What to do and what to avoid, as sentences."],
            ["`accessibility`", "Keyboard, screen reader and focus behaviour."],
            ["`pitfalls`", "Traps that have bitten, including classes the component does not write."],
            ["`states`", "The declared states, each with a matching story."],
            ["`anatomy`", "Named parts, anchored to shipped `data-slot` values."],
          ],
        },
        {
          kind: "p",
          text: "A field nobody has written yet is recorded as unwritten. It is never filled with an empty value, and the count of unwritten fields is one of the ratchets.",
        },
      ],
    },
    {
      id: "stories",
      heading: "Stories and coverage",
      blocks: [
        {
          kind: "p",
          text: "A story file holds two kinds of story. Declared-state stories restate the types: one export per state the manifest declares, and a gate fails when one is missing. Case stories are the only place a component's real situations are written down: long content, an empty list, a narrow screen.",
        },
        {
          kind: "p",
          text: "Every story runs in Chromium with axe. That step is the backstop for the contrast shape the token gate cannot see, and its exclusion list is a ratchet.",
        },
      ],
    },
    {
      id: "a-change",
      heading: "A change, end to end",
      blocks: [
        {
          kind: "list",
          items: [
            "Read the map in `CLAUDE.md`, then the build brief, then the routing table, so nothing gets built twice.",
            "Scaffold the component with `pnpm new:component`. The files it writes move together.",
            "Write the judgment into the guidance module: when to use it and what to avoid, each with a reason.",
            "Run the anti-slop audit before building and again before calling it done.",
            "Run every gate locally, in the workflow's order, from the repository root.",
            "Open a pull request from a branch. Nothing is committed to the main branch directly.",
            "A person reviews. Merging does not deploy. Production ships by hand.",
          ],
        },
      ],
    },
    {
      id: "principles",
      heading: "The principles underneath",
      blocks: [
        {
          kind: "quote",
          text: "The registry is the product. A component that looks right in Storybook and breaks on install has failed.",
        },
        {
          kind: "quote",
          text: "A list of gates mirrors the workflow, in the workflow's order. CI stops at the first failure, so one red gate hides every gate behind it.",
        },
        {
          kind: "quote",
          text: "A green run can prove nothing. A test that serves a prebuilt app says nothing about source edited since the build.",
        },
        {
          kind: "quote",
          text: "An exclusion list may only shrink. Adding a file to silence a failure defeats the gate.",
        },
        {
          kind: "quote",
          text: "Blocks compose. When a composed component does not fit, the gap gets reported, and the component does not get reimplemented.",
        },
        {
          kind: "quote",
          text: "A number typed into prose goes stale. Count it from the tree or leave it out.",
        },
        {
          kind: "links",
          items: [
            {
              label: "Harness: what this system is, and how to say so",
              href: "/harness",
              storybook: "?path=/docs/harness--docs",
            },
            { label: "The component catalog", href: "/", storybook: "?path=/docs/overview--docs" },
          ],
        },
      ],
    },
  ],
};
