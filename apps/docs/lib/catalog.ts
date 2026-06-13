export interface CatalogItem {
  name: string;
  title: string;
  description: string;
  group: "Primitives" | "Components" | "Agent Kit";
}

export const CATALOG_ITEMS: CatalogItem[] = [
  { name: "kbd", title: "Kbd", description: "Keycap chip for keyboard shortcuts.", group: "Primitives" },
  {
    name: "cost-chip",
    title: "Cost Chip",
    description: "Per-action credit cost chip (e.g. 17 credits, 900 credits/min).",
    group: "Primitives",
  },
  {
    name: "date-section",
    title: "Date Section",
    description: "Date-grouped section header for lists and grids.",
    group: "Primitives",
  },
  {
    name: "choice-chips",
    title: "Choice Chips",
    description: "Ring-selected chip group for visual and numeric parameters.",
    group: "Primitives",
  },
  {
    name: "filter-bar",
    title: "Filter Bar",
    description: "Category chips, add-filter chip, and filters button.",
    group: "Primitives",
  },
  {
    name: "field-row",
    title: "Field Row",
    description: "Label + control inspector row with unit-suffixed value input.",
    group: "Primitives",
  },
  {
    name: "gen-settings-bar",
    title: "Gen Settings Bar",
    description: "Compact model/aspect/resolution/duration/batch strip.",
    group: "Primitives",
  },
  {
    name: "shortcuts-sheet",
    title: "Shortcuts Sheet",
    description: "Keyboard shortcuts cheatsheet dialog.",
    group: "Components",
  },
  {
    name: "thread-list",
    title: "Thread List",
    description: "Date-grouped conversation list with rename, delete, and pin.",
    group: "Components",
  },
  {
    name: "agent-types",
    title: "Agent Types",
    description: "Shared TypeScript contracts for Agent Kit components: plan steps, routing decisions, handoffs, guardrails, goals, connectors.",
    group: "Agent Kit",
  },
  {
    name: "plan-timeline",
    title: "Plan Timeline",
    description: "Multi-step agent plan with per-step status, collapsible substeps, duration and cost.",
    group: "Agent Kit",
  },
  {
    name: "plan-approval",
    title: "Plan Approval",
    description: "Pre-execution gate: edit and reorder proposed steps, approve, or reject with a reason.",
    group: "Agent Kit",
  },
  {
    name: "goal-card",
    title: "Goal Card",
    description: "Declared goal with success criteria, monitor state, budget spend, and stop control.",
    group: "Agent Kit",
  },
  {
    name: "critique-panel",
    title: "Critique Panel",
    description: "Producer/critic reflection cycle: draft and critique panes, iteration stepper, verdict, accept or iterate.",
    group: "Agent Kit",
  },
  {
    name: "decision-trace",
    title: "Decision Trace",
    description: "Routing breadcrumb: chosen route per decision with expandable rationale and rejected alternatives.",
    group: "Agent Kit",
  },
] as const;

export const CATALOG = CATALOG_ITEMS.map((i) => i.name);
export type CatalogName = (typeof CATALOG_ITEMS)[number]["name"];
