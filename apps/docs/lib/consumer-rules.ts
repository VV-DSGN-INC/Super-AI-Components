/**
 * The rules a consumer's agent reads after `npx shadcn add @super-ai/agent-kit`.
 *
 * The one authored copy. `pnpm contract:emit` renders it into
 * `registry/agent-kit/AGENTS.super-ai.md`, and the drift test in
 * `scripts/lib/contract-emit.test.ts` holds the emitted file to this module.
 * `checks` names the ds-rules ids that back each rule; the coverage test in
 * `agent-kit-emit.test.ts` fails when a blocker in `packages/ds-rules/rules`
 * is listed under no rule, so the gate and the prose cannot drift apart.
 *
 * Spec: docs/superpowers/specs/2026-11-06-consumer-guardrails.md §3.
 */

export interface ConsumerRule {
  n: 1 | 2 | 3 | 4 | 5 | 6;
  title: string;
  body: string;
  why: string;
  checks: string[];
}

export const CONSUMER_RULES_INTRO =
  "These rules apply to UI built with the Super AI Components registry in this project.\n" +
  "Each rule says why. Where a rule can be checked, the check is the authority, not this text.";

export const CONSUMER_RULES: readonly ConsumerRule[] = [
  {
    n: 1,
    title: "Build from installed items before writing UI",
    body:
      "Before writing a component, check `components/super-ai/` and the index in\n" +
      "`components/super-ai/index.toon`. If an item covers the job, install or compose it; do not\n" +
      "rebuild it by hand.",
    why:
      "a hand-built copy passes every check and still drifts from the contract, the\n" +
      "accessibility work and the fixes the registry item carries.",
    checks: [],
  },
  {
    n: 2,
    title: "Style from tokens, never raw colour",
    body:
      "Use the shadcn CSS variables through Tailwind (`bg-background`, `text-muted-foreground`,\n" +
      "`border-border`, `chart-1` to `chart-5`). No hex, `rgb()`, `hsl()`, `oklch()`, palette steps\n" +
      "like `bg-zinc-400`, or gradients. When a surface is painted, rebind the variable\n" +
      "(`[--muted-foreground:var(--accent-foreground)]`) rather than restyling each child.",
    why:
      "tokens are what makes dark mode, theming and contrast hold; a raw value is correct in one\n" +
      "theme and wrong in the other.",
    checks: [
      "TOK-1",
      "TOK-2",
      "TOK-3",
      "TOK-4",
      "TOK-5",
      "TOK-6",
      "TOK-7",
      "TOK-8",
      "COL-1",
      "CHT-1",
      "CHT-3",
    ],
  },
  {
    n: 3,
    title: "Motion only on state change, and always reducible",
    body:
      "Animate a change of state, never as decoration. Name the transitioned property\n" +
      "(`transition-opacity`, not `transition-all`). Use Tailwind's duration scale as the installed\n" +
      "components do; do not invent durations. Pair every animation with `motion-reduce:animate-none`\n" +
      "or `motion-reduce:transition-none`. Infinite animation is for genuine progress only.",
    why:
      "decorative motion is the most common tell of generated UI, and unpaired motion fails\n" +
      "users who asked the OS for less of it.",
    checks: ["MOT-1", "MOT-2", "MOT-3"],
  },
  {
    n: 4,
    title: "Follow the contract in the installed `.meta.json`",
    body:
      "Each installed item has `components/super-ai/<name>.meta.json`. Read it before composing the\n" +
      "item. It wins over the docs site when they disagree. The cross-cutting contracts it names:\n" +
      "\n" +
      "- State: generation-aware UI shows idle, queued, streaming, done, failed and locked.\n" +
      "- Cost: an action that spends shows its cost before the user commits.\n" +
      "- Provenance: a generated asset keeps its prompt, model, seed and params.\n" +
      "- Empty: every panel, list and pane has an empty state; it is the first thing users see.\n" +
      "- Approval: an artifact awaiting approval offers Confirm, Edit, Regenerate and Skip.\n" +
      "- Dialog: multi-turn flows record where each value came from and allow correction without\n" +
      "  restarting.",
    why:
      "the installed file is version-locked to the code you have; the web copy may be newer\n" +
      "than your install.",
    checks: [],
  },
  {
    n: 5,
    title: "Ask before changing the system, not before building features",
    body:
      "Stop and ask the human before you:\n" +
      "\n" +
      "- create a new primitive in `components/ui/` or `components/super-ai/`,\n" +
      "- edit an installed registry file instead of composing it,\n" +
      "- add, remove or change the value of a CSS variable in `globals.css`.\n" +
      "\n" +
      "Do not ask for routine feature work: composing installed items, writing app components that\n" +
      "use tokens, adding pages, wiring data.",
    why:
      "system changes outlive the task and touch every screen; feature work does not, and\n" +
      "asking about it trains the human to approve without reading.",
    checks: [],
  },
  {
    n: 6,
    title: "Run the check before calling UI done",
    body:
      "Run `node scripts/super-ai/validate.mjs <changed files>` and fix every blocker. Exit 0 is the\n" +
      "bar. Exit 3 means the diff changes the system (rule 5): show it to the human. Add `--system`\n" +
      "to check the working tree against `HEAD`.\n" +
      "\n" +
      "The check also covers generic CTAs, icons from outside lucide-react, emoji in chrome, and\n" +
      "outline-none with no focus-visible replacement.",
    why: "a sentence asks, a check that runs is what actually changes the result.",
    checks: ["CPY-1", "ICO-1", "ICO-2", "STA-3"],
  },
];
