import type { SystemPage } from "@/lib/system-page";

/**
 * NICK: `ONE_LINER` and the rest of `LEDE` are yours to write. What is here is
 * a stand-in so the page renders. Everything else in this file is a draft for
 * your final pass. Remove `draft: true` when you have done it.
 *
 * Rules for every string here, enforced by pages.test.ts: numbers only as
 * `{facts.key}` placeholders, backticked repo paths must exist, no em dash, no
 * exclamation mark, none of the banned words.
 */
const ONE_LINER =
  "Components for AI products, with rules a machine can check. Install one and your agent gets the reasoning along with the code.";

const LEDE = [
  ONE_LINER,
  "Super AI Components is a registry of {facts.shipped} interface components for AI products, installed one at a time with `shadcn add`. Around the components sits a harness: the instructions, rules, contracts and tests that let an agent build here unattended and fail visibly when it gets something wrong.",
  "The short version: components tell an agent what it may use. The harness tells it, in a failing test, when it used them wrong. This page is about the harness.",
];

export const harnessPage: SystemPage = {
  slug: "harness",
  title: "Harness",
  description:
    "What surrounds the components: the instructions, rules, contracts and tests that hold an agent's work to the system.",
  draft: true,
  lede: LEDE,
  sections: [
    {
      id: "beyond-the-component",
      heading: "What you get beyond the component",
      blocks: [
        {
          kind: "p",
          text: "Each item installs two files: the component and a usage contract beside it. The contract records when to reach for the component, which variant fits which case, what to avoid and why, and what to use instead.",
        },
        {
          kind: "p",
          text: "An agent working in your app reads that contract before it places the component. The contract is locked to the installed version, so it cannot describe a different component from the one in your tree.",
        },
        {
          kind: "figure",
          figure: "consumer-surfaces",
          caption: "What an agent in your repository meets, in the order it should read.",
        },
        {
          kind: "p",
          text: "All of it derives from one guidance module per component. The {facts.contracts} contracts, the routing table at `apps/docs/index/components.toon` and the corpus at `apps/docs/public/llms.txt` are written by one command and compared with their source by a test, so none of them can describe an older component quietly.",
        },
      ],
    },
    {
      id: "four-parts",
      heading: "The four parts",
      blocks: [
        {
          kind: "p",
          text: "A harness is the scaffolding around a model that makes its work dependable. Here it has four parts, and each one holds content specific to this system.",
        },
        {
          kind: "figure",
          figure: "harness-parts",
          caption: "The harness, part by part, with what this repository puts in each.",
        },
        {
          kind: "p",
          text: "The instructions file is short on purpose. `CLAUDE.md` is a map under a byte ceiling, and a test fails when it grows past it, because every line there competes with the task for the agent's attention.",
        },
      ],
    },
    {
      id: "built-here",
      heading: "The part that has to be built here",
      blocks: [
        {
          kind: "p",
          text: "A coding agent arrives with its own tools and its own loop. None of them can tell it whether a component is right for this system. That answer has to live in the repository, and here it lives in {facts.ciSteps} gate steps that every change passes before it merges.",
        },
        {
          kind: "p",
          text: "An ordinary test asks whether the component still works. These ask whether it still obeys the system: a colour came through a token, a contract matches its component, a catalog entry has the stories its states promise.",
        },
        {
          kind: "p",
          text: "The limits are part of the design. Of {facts.rules} rules, {facts.ruleBlockers} block a merge, and they are checked in three ways.",
        },
        {
          kind: "table",
          columns: ["How a rule is checked", "Rules"],
          rows: [
            ["By reading source", "{facts.rulesStatic}"],
            ["In a rendered page", "{facts.rulesRendered}"],
            ["By a person", "{facts.rulesJudgment}"],
          ],
        },
        {
          kind: "p",
          text: "The contrast rule reads one element at a time, so muted text inside a muted surface painted by an ancestor passes it. The accessibility step in Storybook catches that shape.",
        },
        {
          kind: "p",
          text: "There is no audit loop yet. Gates run on every push and pull request. Nothing re-checks the main branch on a schedule, and production is deployed by hand, so it can fall behind.",
        },
      ],
    },
    {
      id: "how-to-explain-it",
      heading: "How to explain it",
      blocks: [
        { kind: "p", text: "The longer version, for someone deciding whether it matters:" },
        {
          kind: "quote",
          text: "Most component libraries stop at the code. This one ships the reasoning with it and tests the reasoning like code. Every component has a contract that says when to use it and what to avoid. Every rule the system cares about is a test that fails. An agent can build with it unattended, and when it gets something wrong the build says so before a person has to.",
        },
        {
          kind: "p",
          text: "One question comes back reliably: is that a component library with tests? Close. The difference is what the tests check. They check design decisions, and they check the documentation against the code, so the written guidance cannot drift from what ships.",
        },
        {
          kind: "links",
          items: [
            {
              label: "Architecture: the same system as machinery",
              href: "/architecture",
              storybook: "?path=/docs/architecture--docs",
            },
            { label: "The component catalog", href: "/", storybook: "?path=/docs/overview--docs" },
          ],
        },
      ],
    },
  ],
};
