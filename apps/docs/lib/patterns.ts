export interface PatternMapping {
  component: string; // display name
  href: string; // /components/{name} or external
  when: string;
}

export interface PatternDef {
  name: string;
  definition: string; // cited, 2–3 sentences
}

export interface PatternPage {
  slug: string;
  title: string;
  intro: string;
  patterns: PatternDef[];
  uxImplications: string[];
  mappings: PatternMapping[];
  states: string[];
  dos: { do: string; dont: string }[];
}

export const STANDING_LINE =
  "Components on this page are surfaces for these patterns — they render state and emit callbacks. The host application owns the agent loop.";

export const SOURCES =
  "Pattern definitions condensed from Antonio Gulli, Agentic Design Patterns (Springer, 2025) and Mark A. Lane, Agentic AI Handbook (2025).";

export const PATTERN_PAGES: PatternPage[] = [
  {
    slug: "execution-and-decomposition",
    title: "Execution & Decomposition",
    intro:
      "How an agent turns a goal into work it can actually do: break the problem down, pick a path, run independent parts concurrently, and elevate from executor to strategist.",
    patterns: [
      { name: "Prompt Chaining", definition: "Break a problem into a linear sequence of steps where each output feeds the next (Gulli ch. 1; Lane: Recursive Decomposition). Improves reliability over one mega-prompt." },
      { name: "Routing", definition: "Conditional logic that picks the most appropriate path, tool, or sub-agent based on the input (Gulli ch. 2; Lane: orchestration coordination)." },
      { name: "Parallelization", definition: "Run independent sub-tasks concurrently and join their results (Gulli ch. 3; Lane: Parallel Task Coordinator)." },
      { name: "Planning", definition: "Formulate an explicit multi-step plan toward a high-level objective before acting (Gulli ch. 6; Lane: Hierarchical Task Manager)." },
    ],
    uxImplications: [
      "Users must see the plan before and during execution — what will happen, what is happening, what already happened.",
      "Every routing decision is a moment of agent judgment: surface chosen path and rejected alternatives on demand, not by default.",
      "Concurrent work needs per-branch status; a single spinner hides too much.",
      "Plans change mid-run: visualize step insertion, skipping, and failure without losing history.",
    ],
    mappings: [
      { component: "Plan Timeline", href: "/components/plan-timeline", when: "Show a live or historical plan with per-step status, substeps, duration, and cost." },
      { component: "Plan Approval", href: "/components/plan-approval", when: "Gate execution on a human reviewing and editing the proposed plan." },
      { component: "Decision Trace", href: "/components/decision-trace", when: "Expose routing choices with confidence and alternatives." },
      { component: "Trace Timeline (planned)", href: "/components", when: "Full waterfall of steps, tool calls, and LLM calls — observability depth beyond the plan view." },
    ],
    states: [
      "Streaming: steps flip pending → running → done individually; never re-render the whole plan.",
      "Error: a failed step keeps its place in the timeline; downstream steps show skipped, not blank.",
      "Needs-approval: a step can pause the run and hand off to Plan Approval.",
    ],
    dos: [
      { do: "Show step count and current position (3 of 7).", dont: "Show an indeterminate spinner for a multi-step run." },
      { do: "Keep completed steps visible for audit.", dont: "Collapse history the moment a step finishes." },
      { do: "Label routing chips with the chosen route name.", dont: "Hide which tool or sub-agent was selected." },
    ],
  },
  {
    slug: "external-world",
    title: "The External World",
    intro:
      "Agents are only useful when grounded: calling tools, retrieving knowledge, and connecting to systems through standard protocols.",
    patterns: [
      { name: "Tool Use (Function Calling)", definition: "The agent invokes external APIs, databases, and services to act beyond its weights (Gulli ch. 5; Lane: Tool Selection / Tool Chain Composition)." },
      { name: "Knowledge Retrieval (RAG)", definition: "Query knowledge bases and ground responses in retrieved evidence — embeddings, chunking, vector search, Graph and Agentic RAG (Gulli ch. 14; Lane: Vector Search, Knowledge Integration)." },
      { name: "Model Context Protocol (MCP)", definition: "A standard for connecting agents to tools and data sources, replacing bespoke integrations (Gulli ch. 10; Lane notes MCP as the emerging tool standard)." },
    ],
    uxImplications: [
      "Tool calls are the agent's hands — show each call's target, arguments summary, and outcome inline where the work happens.",
      "Retrieval quality is inspectable: users should be able to see which sources grounded an answer.",
      "Connector health is environment status: auth expiry and server errors must be visible before they break a run.",
    ],
    mappings: [
      { component: "Connector Status", href: "/components/connector-status", when: "Show MCP server / connector health, tool counts, and latency." },
      { component: "RAG kit (planned)", href: "/components", when: "Ingestion pipelines, retrieval inspection, chunk highlighting." },
      { component: "AI Elements tool", href: "https://elements.ai-sdk.dev", when: "In-conversation rendering of a single tool call — compose, don't fork." },
    ],
    states: [
      "Streaming: a tool call shows pending → running → result/error as discrete states.",
      "Error: failed calls show the error and whether the agent retried or rerouted.",
      "Needs-approval: sensitive tools can require explicit confirmation before invocation.",
    ],
    dos: [
      { do: "Summarize tool arguments in one line with full detail on expand.", dont: "Dump raw JSON arguments by default." },
      { do: "Distinguish auth-needed from error on connectors.", dont: "Show one generic 'disconnected' state." },
      { do: "Link retrieved chunks back to their source documents.", dont: "Present grounded claims without provenance." },
    ],
  },
  {
    slug: "state-and-self-improvement",
    title: "State & Self-Improvement",
    intro:
      "What the agent remembers and how it gets better: session state, long-term memory, self-critique, and learning from feedback.",
    patterns: [
      { name: "Memory Management", definition: "Short-term session state plus long-term knowledge retention with provenance (Gulli ch. 8; Lane: Working Memory, Hierarchical Memory Store)." },
      { name: "Reflection", definition: "A producer/critic loop: draft, critique, revise until a stopping condition (Gulli ch. 4; Lane: Self-Reflection — at roughly 3–5× token cost)." },
      { name: "Learning & Adaptation", definition: "Behavior evolves from feedback and experience — from thumbs-up signals to self-improving systems like SICA and AlphaEvolve (Gulli ch. 9; Lane: Learning Feedback)." },
    ],
    uxImplications: [
      "Memory is user-facing state: people need to see, correct, and delete what the agent knows about them.",
      "Reflection cycles justify their cost only if visible — show iterations and what each critique changed.",
      "Learning needs a feedback surface where signal collection is honest and lightweight.",
    ],
    mappings: [
      { component: "Critique Panel", href: "/components/critique-panel", when: "Show draft ↔ critique iterations with verdicts and accept/iterate controls." },
      { component: "Memory Viewer (planned)", href: "/components", when: "Browse and edit agent memory with provenance." },
      { component: "Feedback (planned)", href: "/components", when: "Thumbs + reason capture feeding adaptation." },
    ],
    states: [
      "Streaming: critique text arrives progressively; verdict lands last.",
      "Error: a failed iteration preserves the prior best draft.",
      "Done: the accepted draft is clearly marked as final, with iteration history retained.",
    ],
    dos: [
      { do: "Show the iteration counter (2 of 3).", dont: "Hide how many refinement rounds ran." },
      { do: "Let users accept early — reflection is advisory.", dont: "Force every loop to exhaust its budget." },
      { do: "Make memory edits reversible.", dont: "Silently persist inferred facts about the user." },
    ],
  },
  {
    slug: "collaboration",
    title: "Collaboration",
    intro:
      "Complex goals are solved by teams of specialized agents — which makes identity, roles, and handoffs first-class UI concerns.",
    patterns: [
      { name: "Multi-Agent Collaboration", definition: "Specialized agents with distinct roles work together under coordination — planner, researcher, writer, critic (Gulli ch. 7; Lane: Supervisor-Worker, Expert Panel)." },
      { name: "Inter-Agent Communication (A2A)", definition: "A protocol for agents to exchange goals, context, and capabilities across systems and vendors (Gulli ch. 15)." },
    ],
    uxImplications: [
      "Identity first: every message, step, and artifact attributes to a named agent role.",
      "Handoffs are the seams of multi-agent work — make them explicit events with reasons, not invisible transitions.",
      "Fleet status answers 'who is doing what right now' at a glance.",
    ],
    mappings: [
      { component: "Handoff Indicator", href: "/components/handoff-indicator", when: "Mark an agent→agent transfer with reason and payload summary." },
      { component: "Agent Board (planned)", href: "/components", when: "Multi-agent fleet status grid." },
      { component: "Agent Console", href: "/components/agent-console", when: "One surface composing goal, plan, decisions, and handoffs for a full run." },
    ],
    states: [
      "Streaming: handoffs append to the sequence as they happen.",
      "Error: a failed handoff shows which side rejected and why.",
      "Done: the chain of custody for the final artifact is reconstructable from the handoff stack.",
    ],
    dos: [
      { do: "Name agents by role (Researcher, Critic).", dont: "Label everything 'Assistant'." },
      { do: "Show why a handoff happened.", dont: "Switch speakers with no visible cause." },
      { do: "Keep the org chart legible — who reports to whom.", dont: "Render a swarm with no structure." },
    ],
  },
  {
    slug: "human-oversight-and-reliability",
    title: "Human Oversight & Reliability",
    intro:
      "The trust layer: humans approve consequential actions, goals are monitored, failures recover gracefully, and guardrails refuse visibly.",
    patterns: [
      { name: "Human-in-the-Loop", definition: "Strategic checkpoints where a human reviews, corrects, or approves agent work (Gulli ch. 13; Lane: Human-in-the-Loop Evaluation)." },
      { name: "Goal Setting & Monitoring", definition: "Explicit goals with measurable success criteria and continuous progress monitoring (Gulli ch. 11)." },
      { name: "Exception Handling & Recovery", definition: "Detect failures, degrade gracefully, retry or reroute, and surface what happened (Gulli ch. 12; Lane: Graceful Degradation, Circuit Breaker)." },
      { name: "Guardrails / Safety", definition: "Policies that constrain agent behavior and block disallowed actions — visibly and accountably (Gulli ch. 18; Lane: Content Filter, Behavior Bounds)." },
    ],
    uxImplications: [
      "Approval moments must carry enough context to decide — the plan, the diff, the blast radius.",
      "A goal without visible criteria reads as vibes; show what 'done' means and how close the agent is.",
      "Refusals are trust-building if they explain themselves: what was blocked, by which policy, with a path to escalate.",
      "Degraded states (rate-limited, sandboxed, fallback model) belong in the chrome, not buried in logs.",
    ],
    mappings: [
      { component: "Plan Approval", href: "/components/plan-approval", when: "Pre-execution review of a proposed plan." },
      { component: "Goal Card", href: "/components/goal-card", when: "Goal, criteria, monitor state, budget, stop control." },
      { component: "Refusal Card", href: "/components/refusal-card", when: "A guardrail blocked an action and the user needs recourse." },
      { component: "Review Queue / Approval Card (planned)", href: "/components", when: "Queued human review of generated artifacts." },
      { component: "Safety Banner (stretch)", href: "/components", when: "System-level degraded/sandbox/filter state." },
    ],
    states: [
      "Needs-approval: the run is visibly paused on the human, with what's-blocked context.",
      "Error: recovery actions (retry, reroute, abort) are offered where the failure is shown.",
      "Done: approvals and refusals remain in the run history for audit.",
    ],
    dos: [
      { do: "Make 'Stop' always reachable during a run.", dont: "Provide no kill switch on an autonomous loop." },
      { do: "Explain refusals with the policy name.", dont: "Fail silently or with a generic 'cannot do that'." },
      { do: "Default to approval gates for irreversible actions.", dont: "Treat approval as an error state." },
    ],
  },
  {
    slug: "operations-and-cognition",
    title: "Operations & Cognition",
    intro:
      "Running agents in production: cost awareness, evaluation of trajectories, prioritization under load, and visible reasoning effort.",
    patterns: [
      { name: "Resource-Aware Optimization", definition: "Budget tokens, money, and latency; switch models by task difficulty (Gulli ch. 16; Lane: Token Budget Manager, Model Switching & Tiering)." },
      { name: "Evaluation & Monitoring", definition: "Assess agent trajectories — not just final answers — against criteria; contractor-style accountability (Gulli ch. 19; Lane: Metric-Driven Refinement)." },
      { name: "Prioritization", definition: "Rank and re-rank competing tasks under changing conditions (Gulli ch. 20)." },
      { name: "Reasoning Techniques", definition: "Inference-time deliberation — chain-of-thought, tree-of-thought, scaling test-time compute (Gulli ch. 17; Lane: CoT, ToT, Chain of Draft at ~7–10% of CoT cost)." },
    ],
    uxImplications: [
      "Cost is a first-class signal: per-step and per-run spend belongs next to the work, not in a monthly invoice.",
      "Trajectory evaluation needs the trajectory — keep step history inspectable after the run.",
      "Queue position and re-ranking events explain why the agent isn't working on your task yet.",
      "Reasoning effort should be disclosed proportionally — visible when it matters, collapsed when it doesn't.",
    ],
    mappings: [
      { component: "Cost Chip", href: "/components/cost-chip", when: "Per-action cost badges anywhere work happens." },
      { component: "Usage Dashboard / Quota Meter (planned)", href: "/components", when: "Aggregate spend, tokens, latency, plan limits." },
      { component: "Eval Board (planned)", href: "/components", when: "Score cards and pass/fail matrices over runs." },
      { component: "Task Queue (stretch)", href: "/components", when: "Ranked queue with re-rank and preemption indicators." },
      { component: "AI Elements reasoning", href: "https://elements.ai-sdk.dev", when: "In-conversation reasoning disclosure — compose, don't fork." },
    ],
    states: [
      "Streaming: spend accumulates live during a run.",
      "Error: budget exhaustion is a distinct, recoverable state (raise budget / downgrade model / abort).",
      "Done: final cost and evaluation scores attach to the run record.",
    ],
    dos: [
      { do: "Show cost at the moment of the action.", dont: "Surprise users at the end of the month." },
      { do: "Expose re-ranking with a reason (preempted by P0).", dont: "Reorder queues invisibly." },
      { do: "Let users trade depth for speed explicitly.", dont: "Hard-code one reasoning effort for all tasks." },
    ],
  },
];

export function getPatternPage(slug: string): PatternPage | undefined {
  return PATTERN_PAGES.find((p) => p.slug === slug);
}
