/**
 * The words inside the four figures. Every string is public prose and is
 * scanned by pages.test.ts. A number appears only as a `{facts.key}`
 * placeholder. No Node imports: Storybook bundles this file.
 */

export interface HarnessPart {
  id: "instructions" | "tools" | "memory" | "loops";
  label: string;
  job: string;
  items: string[];
}

export const HARNESS_PARTS: HarnessPart[] = [
  {
    id: "instructions",
    label: "Instructions",
    job: "Standing orders every session reads before anything else.",
    items: [
      "`CLAUDE.md` is a map. It points at the contracts and restates none of them.",
      "It sits under a byte ceiling with a test behind it, because context is the scarce resource.",
      "The build briefs under `docs/design-system` are the contracts themselves.",
    ],
  },
  {
    id: "tools",
    label: "Tools",
    job: "What an agent runs to constrain, check and fix its own work.",
    items: [
      "{facts.rules} rule records behind `pnpm check:tokens`, each with a fixture that must fail and one that must pass.",
      "{facts.skills} skills: build a component, integrate a batch, run every gate, audit for a generated look.",
      "A scaffolder that writes a component's files together, so none ships without its story.",
    ],
  },
  {
    id: "memory",
    label: "Memory",
    job: "What the system knows about itself, derived so it cannot go stale quietly.",
    items: [
      "{facts.contracts} usage contracts, one installed beside each component.",
      "A routing table with one line per component, read before any full contract.",
      "The `llms.txt` corpus, for agents working in other repositories.",
    ],
  },
  {
    id: "loops",
    label: "Loops",
    job: "The cycle every change runs through, ending at a person.",
    items: [
      "Build: scaffold, write the judgment down, pass {facts.ciSteps} gate steps, open a pull request.",
      "A rejection is finished when its lesson has become a rule or a gate.",
      "Audit: not built yet. Nothing re-checks `main` on a schedule.",
    ],
  },
];

export interface ConsumerSurface {
  id: "contract" | "page" | "corpus";
  when: string;
  label: string;
  what: string;
  artifact: string;
}

export const CONSUMER_SURFACES: ConsumerSurface[] = [
  {
    id: "contract",
    when: "With a component installed",
    label: "The installed contract",
    what: "Read this first. It is locked to the version of the code beside it, so it outranks anything on the web.",
    artifact: "`components/super-ai/<name>.meta.json`",
  },
  {
    id: "page",
    when: "Before installing",
    label: "The component's page",
    what: "When to reach for it, which variant fits which case, and what to use instead.",
    artifact: "`llms.txt`, then the page it links",
  },
  {
    id: "corpus",
    when: "When choosing between components",
    label: "The full corpus",
    what: "Every component page in one file.",
    artifact: "`llms-full.txt`",
  },
];

export interface LoopStep {
  id: string;
  label: string;
  detail: string;
}

export const BUILD_LOOP: LoopStep[] = [
  { id: "read", label: "Read first", detail: "The map, the build brief, the routing table." },
  {
    id: "scaffold",
    label: "Scaffold",
    detail: "Component, story, documentation and registry entry, together.",
  },
  {
    id: "judgment",
    label: "Write the judgment down",
    detail: "When to use it and what to avoid, each with its reason.",
  },
  {
    id: "audit",
    label: "Audit the look",
    detail: "The anti-slop checklist, before building and again before done.",
  },
  {
    id: "gates",
    label: "Run the gates",
    detail: "Locally, in the workflow's order, from the repository root.",
  },
  {
    id: "review",
    label: "A person reviews",
    detail: "Gates settle what a machine can settle. Review spends its attention on fit and hierarchy.",
  },
];

export const REJECTION_EDGE =
  "When review rejects something, fixing it is half the job. The other half is a new rule or gate that fails the next time.";

export const AUDIT_LOOP = {
  label: "Audit loop",
  status: "Not built",
  detail:
    "Nothing re-checks `main` on a schedule, and nothing compares production with `main`. Deploys are manual, so the two can drift apart unseen.",
};

/** Every prose string in this file, for pages.test.ts. */
export function figureStrings(): string[] {
  return [
    ...HARNESS_PARTS.flatMap((part) => [part.label, part.job, ...part.items]),
    ...CONSUMER_SURFACES.flatMap((surface) => [surface.when, surface.label, surface.what, surface.artifact]),
    ...BUILD_LOOP.flatMap((step) => [step.label, step.detail]),
    REJECTION_EDGE,
    AUDIT_LOOP.label,
    AUDIT_LOOP.status,
    AUDIT_LOOP.detail,
  ];
}
