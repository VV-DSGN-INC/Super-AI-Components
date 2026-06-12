# Agent Kit Wave Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the Agent Kit wave — 8 agent-UX components + `agent-console` block + a six-page "Patterns" docs section — per `docs/superpowers/specs/2026-06-12-agent-kit-design.md`.

**Architecture:** All components are presentational registry items in `apps/docs/registry/super-ai/` (UI only, callbacks out, controlled props). A shared `agent-types` registry item supplies the data contracts. The docs site gains a catalog group "Agent Kit" (components render through the existing dynamic `[name]` pages) and a new static "Patterns" route driven by a `lib/patterns.ts` data file. The demo replays Gulli's research-assistant scenario from a static event script with a manual stepper — no timers, no LLM calls.

**Tech Stack:** React 19 + Next.js (apps/docs), Base UI shadcn primitives (`@/components/ui/*`), Tailwind v4 with shadcn CSS-variable tokens only, vitest + React Testing Library (jsdom), shadcn registry build (`gen-registry.mts` + `shadcn build`).

**Working conventions for every task (read once):**

- Repo root: `/Users/nickv/ClaudeCode Projects/AI Components`. All paths below are relative to it. Component work happens in `apps/docs/`.
- Branch: create `wave-agent-kit` off current `wave-0-foundation` HEAD before Task 1: `git checkout -b wave-agent-kit`.
- Run a single test file: `cd apps/docs && pnpm exec vitest run registry/super-ai/<name>.test.tsx`
- Full checks (used in verification steps): from repo root `pnpm test`, `pnpm check:tokens`, `pnpm typecheck`, `pnpm lint`.
- Token contract: never use raw hex, `oklch()`, or Tailwind palette classes (`bg-slate-100`…). Only CSS-variable utilities (`bg-muted`, `text-muted-foreground`, `border-destructive/50`, …).
- Every component: `"use client"`, `data-slot` attributes, props extend the host element's props, `cn()` from `@/lib/utils` for className merging.
- **Demos map (learned in Task 1 review):** `apps/docs/app/components/[name]/page.tsx` holds a static `demos` record mapping every catalog name to its demo component. EVERY task that adds a catalog entry must also import its demo there and add a `"{name}": {Name}Demo,` record entry (match existing import style/ordering), and include that file in the task's commit. Skipping this breaks `pnpm build` at prerender. Verify each component task with `cd apps/docs && pnpm build` if in doubt; Tasks 10/11/13 run the full build regardless.
- Registry typing decision (Task 1 review): `agent-types` ships as `registry:component` like everything else — uniform install target beats semantic `registry:lib` purity here. Do not "fix" this.
- Commit style: `{type}({scope}): {description}` (see `git log --oneline`).

---

### Task 1: `agent-types` shared contracts

**Files:**
- Create: `apps/docs/registry/super-ai/agent-types.tsx`
- Create: `apps/docs/registry/super-ai/agent-types.test.tsx`
- Modify: `apps/docs/lib/catalog.ts` (widen `group` union, add entry)
- Create: `apps/docs/components/demos/agent-types-demo.tsx`

Note: the file is `.tsx` (not `.ts`) so the catalog-driven registry build, which derives `registry/super-ai/{name}.tsx` paths from catalog names, needs no script changes. It contains no JSX — that is fine.

- [ ] **Step 1: Write the failing test**

```tsx
// apps/docs/registry/super-ai/agent-types.test.tsx
import { describe, expect, it } from "vitest";

import { isTerminalStatus, type PlanStep } from "./agent-types";

describe("agent-types", () => {
  it("isTerminalStatus is true only for done/failed/skipped", () => {
    expect(isTerminalStatus("done")).toBe(true);
    expect(isTerminalStatus("failed")).toBe(true);
    expect(isTerminalStatus("skipped")).toBe(true);
    expect(isTerminalStatus("pending")).toBe(false);
    expect(isTerminalStatus("running")).toBe(false);
    expect(isTerminalStatus("needs-approval")).toBe(false);
  });

  it("PlanStep supports nested substeps", () => {
    const step: PlanStep = {
      id: "s1",
      title: "Research",
      status: "running",
      substeps: [{ id: "s1a", title: "Search arXiv", status: "done" }],
    };
    expect(step.substeps?.[0].status).toBe("done");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/docs && pnpm exec vitest run registry/super-ai/agent-types.test.tsx`
Expected: FAIL — `Cannot find module './agent-types'`

- [ ] **Step 3: Write the implementation**

```tsx
// apps/docs/registry/super-ai/agent-types.tsx
// Shared data contracts for the Agent Kit. UI components render these;
// the host application owns the agent loop that produces them.

export type PlanStepStatus =
  | "pending"
  | "running"
  | "done"
  | "failed"
  | "skipped"
  | "needs-approval";

export interface PlanStep {
  id: string;
  title: string;
  status: PlanStepStatus;
  detail?: string;
  substeps?: PlanStep[];
  durationMs?: number;
  costUsd?: number;
}

export interface RouteDecision {
  id: string;
  input: string;
  chosen: { route: string; confidence: number; rationale?: string };
  alternatives: { route: string; confidence: number }[];
}

export interface HandoffEvent {
  id: string;
  from: string;
  to: string;
  reason: string;
  payloadSummary?: string;
  at?: string;
}

export type GuardrailKind = "refusal" | "degraded" | "sandbox" | "filter";

export interface GuardrailEvent {
  id: string;
  kind: GuardrailKind;
  policy: string;
  blocked?: string;
  preview?: string;
}

export type GoalState = "on-track" | "at-risk" | "stalled";

export interface GoalStatus {
  goal: string;
  state: GoalState;
  criteria: { id: string; label: string; met: boolean }[];
  elapsedMs?: number;
  budgetUsd?: number;
  spentUsd?: number;
}

export type ConnectorHealth = "connected" | "auth-needed" | "error";

export interface ConnectorState {
  id: string;
  name: string;
  health: ConnectorHealth;
  toolCount?: number;
  latencyMs?: number;
}

const TERMINAL: ReadonlySet<PlanStepStatus> = new Set(["done", "failed", "skipped"]);

export function isTerminalStatus(status: PlanStepStatus): boolean {
  return TERMINAL.has(status);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/docs && pnpm exec vitest run registry/super-ai/agent-types.test.tsx`
Expected: PASS (2 tests)

- [ ] **Step 5: Register in catalog and add demo**

In `apps/docs/lib/catalog.ts`, widen the group union and add the entry. Find:

```ts
group: "Primitives" | "Components";
```

Replace with:

```ts
group: "Primitives" | "Components" | "Agent Kit";
```

Append to `CATALOG_ITEMS`:

```ts
{
  name: "agent-types",
  title: "Agent Types",
  description: "Shared TypeScript contracts for Agent Kit components: plan steps, routing decisions, handoffs, guardrails, goals, connectors.",
  group: "Agent Kit",
},
```

Create the demo:

```tsx
// apps/docs/components/demos/agent-types-demo.tsx
import type { PlanStep } from "@/registry/super-ai/agent-types";

const example: PlanStep = {
  id: "s1",
  title: "Research common cryptographic algorithms",
  status: "running",
  substeps: [{ id: "s1a", title: "Search arXiv", status: "done", durationMs: 4200 }],
  costUsd: 0.012,
};

export default function AgentTypesDemo() {
  return (
    <pre className="bg-muted text-muted-foreground overflow-x-auto rounded-lg p-4 text-xs">
      <code>{JSON.stringify(example, null, 2)}</code>
    </pre>
  );
}
```

- [ ] **Step 6: Verify site + registry still build, then commit**

Run: `cd apps/docs && pnpm check:tokens && pnpm typecheck && pnpm build:registry`
Expected: all pass; `apps/docs/public/r/agent-types.json` exists.

```bash
git add apps/docs/registry/super-ai/agent-types.tsx apps/docs/registry/super-ai/agent-types.test.tsx apps/docs/lib/catalog.ts apps/docs/components/demos/agent-types-demo.tsx
git commit -m "feat(registry): agent-types — shared Agent Kit data contracts"
```

---

### Task 2: `plan-timeline`

**Files:**
- Create: `apps/docs/registry/super-ai/plan-timeline.tsx`
- Create: `apps/docs/registry/super-ai/plan-timeline.test.tsx`
- Create: `apps/docs/components/demos/plan-timeline-demo.tsx`
- Modify: `apps/docs/lib/catalog.ts`, `apps/docs/scripts/gen-registry.mts`

- [ ] **Step 1: Write the failing test**

```tsx
// apps/docs/registry/super-ai/plan-timeline.test.tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { PlanStep } from "./agent-types";
import { PlanTimeline } from "./plan-timeline";

const steps: PlanStep[] = [
  { id: "s1", title: "Identify foundational concepts", status: "done", durationMs: 8000, costUsd: 0.01 },
  {
    id: "s2",
    title: "Research cryptographic algorithms",
    status: "running",
    substeps: [{ id: "s2a", title: "Search arXiv", status: "running" }],
  },
  { id: "s3", title: "Synthesize findings into report", status: "pending" },
];

describe("PlanTimeline", () => {
  it("renders a list of steps with status exposed via data-status", () => {
    render(<PlanTimeline steps={steps} aria-label="Research plan" />);
    const list = screen.getByRole("list", { name: "Research plan" });
    expect(list).toBeInTheDocument();
    expect(screen.getByText("Identify foundational concepts").closest("li")).toHaveAttribute(
      "data-status",
      "done",
    );
    expect(screen.getByText("Research cryptographic algorithms").closest("li")).toHaveAttribute(
      "data-status",
      "running",
    );
  });

  it("toggles substeps with aria-expanded and fires onStepSelect", async () => {
    const onStepSelect = vi.fn();
    render(<PlanTimeline steps={steps} onStepSelect={onStepSelect} />);
    expect(screen.queryByText("Search arXiv")).not.toBeInTheDocument();
    const toggle = screen.getByRole("button", { name: "Toggle substeps for Research cryptographic algorithms" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Search arXiv")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Identify foundational concepts" }));
    expect(onStepSelect).toHaveBeenCalledWith("s1");
  });

  it("shows duration and cost when provided", () => {
    render(<PlanTimeline steps={steps} />);
    expect(screen.getByText("8.0s")).toBeInTheDocument();
    expect(screen.getByText("$0.010")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/docs && pnpm exec vitest run registry/super-ai/plan-timeline.test.tsx`
Expected: FAIL — `Cannot find module './plan-timeline'`

- [ ] **Step 3: Write the implementation**

```tsx
// apps/docs/registry/super-ai/plan-timeline.tsx
"use client";

import {
  Check,
  ChevronRight,
  CircleDashed,
  Loader2,
  MinusCircle,
  ShieldQuestion,
  X,
} from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

import type { PlanStep, PlanStepStatus } from "./agent-types";

const STATUS_ICON: Record<PlanStepStatus, React.ReactNode> = {
  pending: <CircleDashed className="size-3.5 text-muted-foreground" aria-hidden />,
  running: <Loader2 className="size-3.5 animate-spin text-primary" aria-hidden />,
  done: <Check className="size-3.5 text-primary" aria-hidden />,
  failed: <X className="size-3.5 text-destructive" aria-hidden />,
  skipped: <MinusCircle className="size-3.5 text-muted-foreground" aria-hidden />,
  "needs-approval": <ShieldQuestion className="size-3.5 text-foreground" aria-hidden />,
};

function formatDuration(ms: number): string {
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatCost(usd: number): string {
  return `$${usd.toFixed(3)}`;
}

interface PlanTimelineProps extends Omit<React.ComponentProps<"ol">, "onSelect"> {
  steps: PlanStep[];
  onStepSelect?: (id: string) => void;
}

function PlanTimeline({ steps, onStepSelect, className, ...props }: PlanTimelineProps) {
  return (
    <ol data-slot="plan-timeline" role="list" className={cn("flex flex-col gap-0.5", className)} {...props}>
      {steps.map((step) => (
        <PlanTimelineStep key={step.id} step={step} onStepSelect={onStepSelect} />
      ))}
    </ol>
  );
}

function PlanTimelineStep({
  step,
  onStepSelect,
  depth = 0,
}: {
  step: PlanStep;
  onStepSelect?: (id: string) => void;
  depth?: number;
}) {
  const [expanded, setExpanded] = React.useState(false);
  const hasSubsteps = (step.substeps?.length ?? 0) > 0;

  return (
    <li data-slot="plan-timeline-step" data-status={step.status} className="flex flex-col">
      <div
        className={cn(
          "group/step flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-accent",
          depth > 0 && "ml-6",
        )}
      >
        {STATUS_ICON[step.status]}
        <button
          type="button"
          className="min-w-0 flex-1 truncate text-left text-sm text-foreground"
          onClick={() => onStepSelect?.(step.id)}
        >
          {step.title}
        </button>
        {step.durationMs !== undefined && (
          <span className="text-xs tabular-nums text-muted-foreground">{formatDuration(step.durationMs)}</span>
        )}
        {step.costUsd !== undefined && (
          <span className="text-xs tabular-nums text-muted-foreground">{formatCost(step.costUsd)}</span>
        )}
        {hasSubsteps && (
          <button
            type="button"
            aria-expanded={expanded}
            aria-label={`Toggle substeps for ${step.title}`}
            className="rounded-sm p-0.5 text-muted-foreground hover:text-foreground"
            onClick={() => setExpanded((v) => !v)}
          >
            <ChevronRight className={cn("size-3.5 transition-transform", expanded && "rotate-90")} aria-hidden />
          </button>
        )}
      </div>
      {step.detail && depth === 0 && (
        <p className="ml-8 text-xs text-muted-foreground">{step.detail}</p>
      )}
      {hasSubsteps && expanded && (
        <ol role="list" className="flex flex-col gap-0.5">
          {step.substeps!.map((sub) => (
            <PlanTimelineStep key={sub.id} step={sub} onStepSelect={onStepSelect} depth={depth + 1} />
          ))}
        </ol>
      )}
    </li>
  );
}

export { PlanTimeline };
export type { PlanTimelineProps };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/docs && pnpm exec vitest run registry/super-ai/plan-timeline.test.tsx`
Expected: PASS (3 tests)

- [ ] **Step 5: Catalog entry, registry extras, demo**

Append to `CATALOG_ITEMS` in `apps/docs/lib/catalog.ts`:

```ts
{
  name: "plan-timeline",
  title: "Plan Timeline",
  description: "Multi-step agent plan with per-step status, collapsible substeps, duration and cost.",
  group: "Agent Kit",
},
```

In `apps/docs/scripts/gen-registry.mts`, add to the `extras` object (same pattern as `thread-list`):

```ts
"plan-timeline": {
  dependencies: ["lucide-react"],
  registryDependencies: [self("agent-types")],
},
```

Create the demo:

```tsx
// apps/docs/components/demos/plan-timeline-demo.tsx
import type { PlanStep } from "@/registry/super-ai/agent-types";
import { PlanTimeline } from "@/registry/super-ai/plan-timeline";

const steps: PlanStep[] = [
  { id: "s1", title: "Identify foundational concepts of quantum computing", status: "done", durationMs: 8400, costUsd: 0.011 },
  {
    id: "s2",
    title: "Research common cryptographic algorithms",
    status: "running",
    substeps: [
      { id: "s2a", title: "Search arXiv for post-quantum cryptography", status: "done", durationMs: 4100 },
      { id: "s2b", title: "Query financial-data API for adoption metrics", status: "running" },
    ],
  },
  { id: "s3", title: "Find expert analysis on quantum threats", status: "needs-approval" },
  { id: "s4", title: "Synthesize findings into a structured report", status: "pending" },
];

export default function PlanTimelineDemo() {
  return <PlanTimeline steps={steps} aria-label="Research plan" className="w-full max-w-md" />;
}
```

- [ ] **Step 6: Verify and commit**

Run: `cd apps/docs && pnpm check:tokens && pnpm typecheck && pnpm exec vitest run registry/super-ai/plan-timeline.test.tsx`
Expected: all pass.

```bash
git add apps/docs/registry/super-ai/plan-timeline.tsx apps/docs/registry/super-ai/plan-timeline.test.tsx apps/docs/components/demos/plan-timeline-demo.tsx apps/docs/lib/catalog.ts apps/docs/scripts/gen-registry.mts
git commit -m "feat(registry): plan-timeline — agent plan surface with substeps, duration, cost"
```

---

### Task 3: `plan-approval`

**Files:**
- Create: `apps/docs/registry/super-ai/plan-approval.tsx`
- Create: `apps/docs/registry/super-ai/plan-approval.test.tsx`
- Create: `apps/docs/components/demos/plan-approval-demo.tsx`
- Modify: `apps/docs/lib/catalog.ts`, `apps/docs/scripts/gen-registry.mts`

- [ ] **Step 1: Write the failing test**

```tsx
// apps/docs/registry/super-ai/plan-approval.test.tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { PlanStep } from "./agent-types";
import { PlanApproval } from "./plan-approval";

const steps: PlanStep[] = [
  { id: "s1", title: "Search the web", status: "pending" },
  { id: "s2", title: "Email the report to the team", status: "pending" },
  { id: "s3", title: "Archive sources", status: "pending" },
];

describe("PlanApproval", () => {
  it("approves with the current (edited) step list", async () => {
    const onApprove = vi.fn();
    render(<PlanApproval steps={steps} onApprove={onApprove} onReject={vi.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: "Remove Email the report to the team" }));
    await userEvent.click(screen.getByRole("button", { name: "Approve plan" }));
    expect(onApprove).toHaveBeenCalledWith([
      expect.objectContaining({ id: "s1" }),
      expect.objectContaining({ id: "s3" }),
    ]);
  });

  it("reorders a step downward", async () => {
    const onApprove = vi.fn();
    render(<PlanApproval steps={steps} onApprove={onApprove} onReject={vi.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: "Move Search the web down" }));
    await userEvent.click(screen.getByRole("button", { name: "Approve plan" }));
    expect(onApprove.mock.calls[0][0].map((s: PlanStep) => s.id)).toEqual(["s2", "s1", "s3"]);
  });

  it("requires a reason to reject, then fires onReject with it", async () => {
    const onReject = vi.fn();
    render(<PlanApproval steps={steps} onApprove={vi.fn()} onReject={onReject} />);
    await userEvent.click(screen.getByRole("button", { name: "Reject plan" }));
    const reason = screen.getByRole("textbox", { name: "Rejection reason" });
    const confirm = screen.getByRole("button", { name: "Confirm rejection" });
    expect(confirm).toBeDisabled();
    await userEvent.type(reason, "Do not email externally");
    expect(confirm).toBeEnabled();
    await userEvent.click(confirm);
    expect(onReject).toHaveBeenCalledWith("Do not email externally");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/docs && pnpm exec vitest run registry/super-ai/plan-approval.test.tsx`
Expected: FAIL — `Cannot find module './plan-approval'`

- [ ] **Step 3: Write the implementation**

```tsx
// apps/docs/registry/super-ai/plan-approval.tsx
"use client";

import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type { PlanStep } from "./agent-types";

interface PlanApprovalProps extends Omit<React.ComponentProps<"div">, "onSubmit"> {
  steps: PlanStep[];
  onApprove: (steps: PlanStep[]) => void;
  onReject: (reason: string) => void;
  title?: string;
}

function PlanApproval({
  steps: initialSteps,
  onApprove,
  onReject,
  title = "Review proposed plan",
  className,
  ...props
}: PlanApprovalProps) {
  const [steps, setSteps] = React.useState(initialSteps);
  const [rejecting, setRejecting] = React.useState(false);
  const [reason, setReason] = React.useState("");

  function move(index: number, delta: -1 | 1) {
    setSteps((prev) => {
      const next = [...prev];
      const target = index + delta;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  return (
    <div
      data-slot="plan-approval"
      className={cn("flex flex-col gap-3 rounded-lg border bg-card p-4 text-card-foreground", className)}
      {...props}
    >
      <h3 className="text-sm font-medium">{title}</h3>
      <ol role="list" className="flex flex-col gap-1">
        {steps.map((step, i) => (
          <li
            key={step.id}
            data-slot="plan-approval-step"
            className="group/row flex items-center gap-2 rounded-md border bg-background px-2 py-1.5"
          >
            <span className="text-xs tabular-nums text-muted-foreground">{i + 1}.</span>
            <span className="min-w-0 flex-1 truncate text-sm">{step.title}</span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Move ${step.title} up`}
              disabled={i === 0}
              onClick={() => move(i, -1)}
            >
              <ArrowUp className="size-3.5" aria-hidden />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Move ${step.title} down`}
              disabled={i === steps.length - 1}
              onClick={() => move(i, 1)}
            >
              <ArrowDown className="size-3.5" aria-hidden />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Remove ${step.title}`}
              onClick={() => setSteps((prev) => prev.filter((s) => s.id !== step.id))}
            >
              <Trash2 className="size-3.5" aria-hidden />
            </Button>
          </li>
        ))}
      </ol>
      {rejecting ? (
        <div className="flex flex-col gap-2">
          <textarea
            aria-label="Rejection reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Why is this plan rejected?"
            className="min-h-16 w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setRejecting(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={reason.trim().length === 0}
              onClick={() => onReject(reason.trim())}
            >
              Confirm rejection
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" aria-label="Reject plan" onClick={() => setRejecting(true)}>
            Reject
          </Button>
          <Button type="button" aria-label="Approve plan" disabled={steps.length === 0} onClick={() => onApprove(steps)}>
            Approve
          </Button>
        </div>
      )}
    </div>
  );
}

export { PlanApproval };
export type { PlanApprovalProps };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/docs && pnpm exec vitest run registry/super-ai/plan-approval.test.tsx`
Expected: PASS (3 tests)

- [ ] **Step 5: Catalog entry, registry extras, demo**

Catalog entry (`apps/docs/lib/catalog.ts`):

```ts
{
  name: "plan-approval",
  title: "Plan Approval",
  description: "Pre-execution gate: edit and reorder proposed steps, approve, or reject with a reason.",
  group: "Agent Kit",
},
```

`gen-registry.mts` extras:

```ts
"plan-approval": {
  dependencies: ["lucide-react"],
  registryDependencies: ["button", self("agent-types")],
},
```

Demo:

```tsx
// apps/docs/components/demos/plan-approval-demo.tsx
"use client";

import * as React from "react";

import type { PlanStep } from "@/registry/super-ai/agent-types";
import { PlanApproval } from "@/registry/super-ai/plan-approval";

const proposed: PlanStep[] = [
  { id: "s1", title: "Identify foundational concepts of quantum computing", status: "pending" },
  { id: "s2", title: "Research common cryptographic algorithms", status: "pending" },
  { id: "s3", title: "Email preliminary findings to the security list", status: "pending" },
  { id: "s4", title: "Synthesize findings into a structured report", status: "pending" },
];

export default function PlanApprovalDemo() {
  const [result, setResult] = React.useState<string>();
  return (
    <div className="flex w-full max-w-md flex-col gap-2">
      <PlanApproval
        steps={proposed}
        onApprove={(steps) => setResult(`Approved ${steps.length} steps`)}
        onReject={(reason) => setResult(`Rejected: ${reason}`)}
      />
      {result && <p className="text-xs text-muted-foreground">{result}</p>}
    </div>
  );
}
```

- [ ] **Step 6: Verify and commit**

Run: `cd apps/docs && pnpm check:tokens && pnpm typecheck && pnpm exec vitest run registry/super-ai/plan-approval.test.tsx`
Expected: all pass.

```bash
git add apps/docs/registry/super-ai/plan-approval.tsx apps/docs/registry/super-ai/plan-approval.test.tsx apps/docs/components/demos/plan-approval-demo.tsx apps/docs/lib/catalog.ts apps/docs/scripts/gen-registry.mts
git commit -m "feat(registry): plan-approval — pre-execution HITL gate with edit/reorder/reject-reason"
```

---

### Task 4: `goal-card`

**Files:**
- Create: `apps/docs/registry/super-ai/goal-card.tsx`
- Create: `apps/docs/registry/super-ai/goal-card.test.tsx`
- Create: `apps/docs/components/demos/goal-card-demo.tsx`
- Modify: `apps/docs/lib/catalog.ts`, `apps/docs/scripts/gen-registry.mts`

- [ ] **Step 1: Write the failing test**

```tsx
// apps/docs/registry/super-ai/goal-card.test.tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { GoalStatus } from "./agent-types";
import { GoalCard } from "./goal-card";

const goal: GoalStatus = {
  goal: "Produce a cited report on quantum threats",
  state: "at-risk",
  criteria: [
    { id: "c1", label: "≥ 5 primary sources", met: true },
    { id: "c2", label: "Critic approves draft", met: false },
  ],
  budgetUsd: 2,
  spentUsd: 1.4,
};

describe("GoalCard", () => {
  it("renders goal, state badge, and criteria progress", () => {
    render(<GoalCard status={goal} />);
    expect(screen.getByText("Produce a cited report on quantum threats")).toBeInTheDocument();
    expect(screen.getByText("at-risk")).toBeInTheDocument();
    expect(screen.getByText("1/2 criteria met")).toBeInTheDocument();
    const root = screen.getByText("at-risk").closest("[data-slot='goal-card']");
    expect(root).toHaveAttribute("data-state", "at-risk");
  });

  it("marks met criteria and fires onStop", async () => {
    const onStop = vi.fn();
    render(<GoalCard status={goal} onStop={onStop} />);
    expect(screen.getByText("≥ 5 primary sources").closest("li")).toHaveAttribute("data-met", "true");
    expect(screen.getByText("Critic approves draft").closest("li")).toHaveAttribute("data-met", "false");
    await userEvent.click(screen.getByRole("button", { name: "Stop agent" }));
    expect(onStop).toHaveBeenCalledOnce();
  });

  it("shows budget spend when provided", () => {
    render(<GoalCard status={goal} />);
    expect(screen.getByText("$1.40 / $2.00")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/docs && pnpm exec vitest run registry/super-ai/goal-card.test.tsx`
Expected: FAIL — `Cannot find module './goal-card'`

- [ ] **Step 3: Write the implementation**

```tsx
// apps/docs/registry/super-ai/goal-card.tsx
"use client";

import { Check, CircleDashed, OctagonX } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type { GoalState, GoalStatus } from "./agent-types";

const STATE_CLASS: Record<GoalState, string> = {
  "on-track": "bg-primary/10 text-primary",
  "at-risk": "bg-muted text-foreground",
  stalled: "bg-destructive/10 text-destructive",
};

interface GoalCardProps extends React.ComponentProps<"div"> {
  status: GoalStatus;
  onStop?: () => void;
}

function GoalCard({ status, onStop, className, ...props }: GoalCardProps) {
  const met = status.criteria.filter((c) => c.met).length;
  return (
    <div
      data-slot="goal-card"
      data-state={status.state}
      className={cn("flex flex-col gap-3 rounded-lg border bg-card p-4 text-card-foreground", className)}
      {...props}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium">{status.goal}</p>
        <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", STATE_CLASS[status.state])}>
          {status.state}
        </span>
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{`${met}/${status.criteria.length} criteria met`}</span>
        {status.budgetUsd !== undefined && status.spentUsd !== undefined && (
          <span className="tabular-nums">{`$${status.spentUsd.toFixed(2)} / $${status.budgetUsd.toFixed(2)}`}</span>
        )}
      </div>
      <ul role="list" className="flex flex-col gap-1">
        {status.criteria.map((c) => (
          <li key={c.id} data-met={c.met} className="flex items-center gap-2 text-sm">
            {c.met ? (
              <Check className="size-3.5 text-primary" aria-hidden />
            ) : (
              <CircleDashed className="size-3.5 text-muted-foreground" aria-hidden />
            )}
            <span className={cn(!c.met && "text-muted-foreground")}>{c.label}</span>
          </li>
        ))}
      </ul>
      {onStop && (
        <div className="flex justify-end">
          <Button type="button" variant="outline" size="sm" aria-label="Stop agent" onClick={onStop}>
            <OctagonX className="size-3.5" aria-hidden />
            Stop
          </Button>
        </div>
      )}
    </div>
  );
}

export { GoalCard };
export type { GoalCardProps };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/docs && pnpm exec vitest run registry/super-ai/goal-card.test.tsx`
Expected: PASS (3 tests)

- [ ] **Step 5: Catalog entry, registry extras, demo**

Catalog entry:

```ts
{
  name: "goal-card",
  title: "Goal Card",
  description: "Declared goal with success criteria, monitor state, budget spend, and stop control.",
  group: "Agent Kit",
},
```

`gen-registry.mts` extras:

```ts
"goal-card": {
  dependencies: ["lucide-react"],
  registryDependencies: ["button", self("agent-types")],
},
```

Demo:

```tsx
// apps/docs/components/demos/goal-card-demo.tsx
import type { GoalStatus } from "@/registry/super-ai/agent-types";
import { GoalCard } from "@/registry/super-ai/goal-card";

const status: GoalStatus = {
  goal: "Analyze the impact of quantum computing on cybersecurity",
  state: "on-track",
  criteria: [
    { id: "c1", label: "≥ 5 primary sources gathered", met: true },
    { id: "c2", label: "Threat matrix completed", met: true },
    { id: "c3", label: "Critic approves final draft", met: false },
  ],
  budgetUsd: 2,
  spentUsd: 0.85,
};

export default function GoalCardDemo() {
  return <GoalCard status={status} onStop={() => {}} className="w-full max-w-sm" />;
}
```

- [ ] **Step 6: Verify and commit**

Run: `cd apps/docs && pnpm check:tokens && pnpm typecheck && pnpm exec vitest run registry/super-ai/goal-card.test.tsx`
Expected: all pass.

```bash
git add apps/docs/registry/super-ai/goal-card.tsx apps/docs/registry/super-ai/goal-card.test.tsx apps/docs/components/demos/goal-card-demo.tsx apps/docs/lib/catalog.ts apps/docs/scripts/gen-registry.mts
git commit -m "feat(registry): goal-card — goal monitor with criteria, state, budget, stop"
```

---

### Task 5: `critique-panel`

**Files:**
- Create: `apps/docs/registry/super-ai/critique-panel.tsx`
- Create: `apps/docs/registry/super-ai/critique-panel.test.tsx`
- Create: `apps/docs/components/demos/critique-panel-demo.tsx`
- Modify: `apps/docs/lib/catalog.ts`, `apps/docs/scripts/gen-registry.mts`

- [ ] **Step 1: Write the failing test**

```tsx
// apps/docs/registry/super-ai/critique-panel.test.tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { CritiquePanel, type CritiqueIteration } from "./critique-panel";

const iterations: CritiqueIteration[] = [
  { draft: "Quantum computers break RSA.", critique: "Too absolute; cite Shor's algorithm and timelines.", verdict: "needs-work" },
  { draft: "Shor's algorithm threatens RSA within 10–20 years.", critique: "No further critiques found.", verdict: "approved" },
];

describe("CritiquePanel", () => {
  it("shows iteration counter and latest panes by default", () => {
    render(<CritiquePanel iterations={iterations} onAccept={vi.fn()} onIterate={vi.fn()} />);
    expect(screen.getByText("Iteration 2 of 2")).toBeInTheDocument();
    expect(screen.getByText("Shor's algorithm threatens RSA within 10–20 years.")).toBeInTheDocument();
    expect(screen.getByText("approved")).toBeInTheDocument();
  });

  it("steps back to a previous iteration", async () => {
    render(<CritiquePanel iterations={iterations} onAccept={vi.fn()} onIterate={vi.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: "Previous iteration" }));
    expect(screen.getByText("Iteration 1 of 2")).toBeInTheDocument();
    expect(screen.getByText("Quantum computers break RSA.")).toBeInTheDocument();
  });

  it("fires onAccept and onIterate", async () => {
    const onAccept = vi.fn();
    const onIterate = vi.fn();
    render(<CritiquePanel iterations={iterations} onAccept={onAccept} onIterate={onIterate} />);
    await userEvent.click(screen.getByRole("button", { name: "Accept draft" }));
    expect(onAccept).toHaveBeenCalledOnce();
    await userEvent.click(screen.getByRole("button", { name: "Run another iteration" }));
    expect(onIterate).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/docs && pnpm exec vitest run registry/super-ai/critique-panel.test.tsx`
Expected: FAIL — `Cannot find module './critique-panel'`

- [ ] **Step 3: Write the implementation**

```tsx
// apps/docs/registry/super-ai/critique-panel.tsx
"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CritiqueIteration {
  draft: string;
  critique: string;
  verdict: "approved" | "needs-work";
}

interface CritiquePanelProps extends React.ComponentProps<"div"> {
  iterations: CritiqueIteration[];
  onAccept: () => void;
  onIterate: () => void;
}

function CritiquePanel({ iterations, onAccept, onIterate, className, ...props }: CritiquePanelProps) {
  const [index, setIndex] = React.useState(iterations.length - 1);
  const current = iterations[index];

  return (
    <div
      data-slot="critique-panel"
      className={cn("flex flex-col gap-3 rounded-lg border bg-card p-4 text-card-foreground", className)}
      {...props}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Previous iteration"
            disabled={index === 0}
            onClick={() => setIndex((i) => i - 1)}
          >
            <ChevronLeft className="size-3.5" aria-hidden />
          </Button>
          <span className="text-xs tabular-nums text-muted-foreground">
            {`Iteration ${index + 1} of ${iterations.length}`}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Next iteration"
            disabled={index === iterations.length - 1}
            onClick={() => setIndex((i) => i + 1)}
          >
            <ChevronRight className="size-3.5" aria-hidden />
          </Button>
        </div>
        <span
          data-slot="critique-verdict"
          className={cn(
            "rounded-full px-2 py-0.5 text-xs font-medium",
            current.verdict === "approved" ? "bg-primary/10 text-primary" : "bg-muted text-foreground",
          )}
        >
          {current.verdict}
        </span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <section className="flex flex-col gap-1">
          <h4 className="text-xs font-medium uppercase text-muted-foreground">Draft</h4>
          <p className="rounded-md border bg-background p-3 text-sm">{current.draft}</p>
        </section>
        <section className="flex flex-col gap-1">
          <h4 className="text-xs font-medium uppercase text-muted-foreground">Critique</h4>
          <p className="rounded-md border bg-background p-3 text-sm">{current.critique}</p>
        </section>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" aria-label="Run another iteration" onClick={onIterate}>
          Iterate
        </Button>
        <Button type="button" aria-label="Accept draft" onClick={onAccept}>
          Accept
        </Button>
      </div>
    </div>
  );
}

export { CritiquePanel };
export type { CritiqueIteration, CritiquePanelProps };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/docs && pnpm exec vitest run registry/super-ai/critique-panel.test.tsx`
Expected: PASS (3 tests)

- [ ] **Step 5: Catalog entry, registry extras, demo**

Catalog entry:

```ts
{
  name: "critique-panel",
  title: "Critique Panel",
  description: "Producer/critic reflection cycle: draft and critique panes, iteration stepper, verdict, accept or iterate.",
  group: "Agent Kit",
},
```

`gen-registry.mts` extras:

```ts
"critique-panel": {
  dependencies: ["lucide-react"],
  registryDependencies: ["button"],
},
```

Demo:

```tsx
// apps/docs/components/demos/critique-panel-demo.tsx
import { CritiquePanel, type CritiqueIteration } from "@/registry/super-ai/critique-panel";

const iterations: CritiqueIteration[] = [
  {
    draft: "Quantum computers will break all encryption soon.",
    critique: "Overstated. Distinguish symmetric vs asymmetric; cite Shor's algorithm and NIST PQC timelines.",
    verdict: "needs-work",
  },
  {
    draft: "Shor's algorithm threatens RSA and ECC; NIST PQC migration is underway, with symmetric crypto largely safe.",
    critique: "No further critiques found. The draft is accurate and balanced.",
    verdict: "approved",
  },
];

export default function CritiquePanelDemo() {
  return <CritiquePanel iterations={iterations} onAccept={() => {}} onIterate={() => {}} className="w-full max-w-lg" />;
}
```

- [ ] **Step 6: Verify and commit**

Run: `cd apps/docs && pnpm check:tokens && pnpm typecheck && pnpm exec vitest run registry/super-ai/critique-panel.test.tsx`
Expected: all pass.

```bash
git add apps/docs/registry/super-ai/critique-panel.tsx apps/docs/registry/super-ai/critique-panel.test.tsx apps/docs/components/demos/critique-panel-demo.tsx apps/docs/lib/catalog.ts apps/docs/scripts/gen-registry.mts
git commit -m "feat(registry): critique-panel — reflection cycle with iteration stepper and verdict"
```

---

### Task 6: `decision-trace`

**Files:**
- Create: `apps/docs/registry/super-ai/decision-trace.tsx`
- Create: `apps/docs/registry/super-ai/decision-trace.test.tsx`
- Create: `apps/docs/components/demos/decision-trace-demo.tsx`
- Modify: `apps/docs/lib/catalog.ts`, `apps/docs/scripts/gen-registry.mts`

- [ ] **Step 1: Write the failing test**

```tsx
// apps/docs/registry/super-ai/decision-trace.test.tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import type { RouteDecision } from "./agent-types";
import { DecisionTrace } from "./decision-trace";

const decisions: RouteDecision[] = [
  {
    id: "d1",
    input: "Find expert analysis on quantum threats",
    chosen: { route: "web-search", confidence: 0.92, rationale: "Fresh sources required" },
    alternatives: [{ route: "internal-kb", confidence: 0.31 }],
  },
  {
    id: "d2",
    input: "Summarize findings",
    chosen: { route: "writer-agent", confidence: 0.88 },
    alternatives: [{ route: "direct-llm", confidence: 0.55 }],
  },
];

describe("DecisionTrace", () => {
  it("renders chosen routes as a breadcrumb", () => {
    render(<DecisionTrace decisions={decisions} />);
    expect(screen.getByText("web-search")).toBeInTheDocument();
    expect(screen.getByText("writer-agent")).toBeInTheDocument();
  });

  it("expands a decision to show rationale and alternatives with confidence", async () => {
    render(<DecisionTrace decisions={decisions} />);
    const toggle = screen.getByRole("button", { name: "Toggle decision detail for web-search" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Fresh sources required")).toBeInTheDocument();
    expect(screen.getByText("internal-kb")).toBeInTheDocument();
    expect(screen.getByText("31%")).toBeInTheDocument();
    expect(screen.getByText("92%")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/docs && pnpm exec vitest run registry/super-ai/decision-trace.test.tsx`
Expected: FAIL — `Cannot find module './decision-trace'`

- [ ] **Step 3: Write the implementation**

```tsx
// apps/docs/registry/super-ai/decision-trace.tsx
"use client";

import { ChevronRight, Split } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

import type { RouteDecision } from "./agent-types";

function pct(confidence: number): string {
  return `${Math.round(confidence * 100)}%`;
}

interface DecisionTraceProps extends React.ComponentProps<"div"> {
  decisions: RouteDecision[];
}

function DecisionTrace({ decisions, className, ...props }: DecisionTraceProps) {
  const [openId, setOpenId] = React.useState<string | null>(null);

  return (
    <div data-slot="decision-trace" className={cn("flex flex-col gap-1", className)} {...props}>
      <div className="flex flex-wrap items-center gap-1">
        {decisions.map((d, i) => (
          <React.Fragment key={d.id}>
            {i > 0 && <ChevronRight className="size-3 text-muted-foreground" aria-hidden />}
            <button
              type="button"
              aria-expanded={openId === d.id}
              aria-label={`Toggle decision detail for ${d.chosen.route}`}
              data-slot="decision-trace-node"
              className={cn(
                "flex items-center gap-1 rounded-full border bg-background px-2 py-0.5 text-xs hover:bg-accent",
                openId === d.id && "bg-accent",
              )}
              onClick={() => setOpenId((cur) => (cur === d.id ? null : d.id))}
            >
              <Split className="size-3 text-muted-foreground" aria-hidden />
              {d.chosen.route}
              <span className="tabular-nums text-muted-foreground">{pct(d.chosen.confidence)}</span>
            </button>
          </React.Fragment>
        ))}
      </div>
      {decisions
        .filter((d) => d.id === openId)
        .map((d) => (
          <div key={d.id} data-slot="decision-trace-detail" className="rounded-md border bg-card p-3 text-sm">
            <p className="text-xs text-muted-foreground">Input</p>
            <p className="mb-2">{d.input}</p>
            {d.chosen.rationale && (
              <>
                <p className="text-xs text-muted-foreground">Rationale</p>
                <p className="mb-2">{d.chosen.rationale}</p>
              </>
            )}
            <p className="text-xs text-muted-foreground">Rejected alternatives</p>
            <ul role="list" className="mt-1 flex flex-col gap-1">
              {d.alternatives.map((a) => (
                <li key={a.route} className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{a.route}</span>
                  <span className="tabular-nums">{pct(a.confidence)}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
    </div>
  );
}

export { DecisionTrace };
export type { DecisionTraceProps };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/docs && pnpm exec vitest run registry/super-ai/decision-trace.test.tsx`
Expected: PASS (2 tests)

- [ ] **Step 5: Catalog entry, registry extras, demo**

Catalog entry:

```ts
{
  name: "decision-trace",
  title: "Decision Trace",
  description: "Routing breadcrumb: chosen route per decision with expandable rationale and rejected alternatives.",
  group: "Agent Kit",
},
```

`gen-registry.mts` extras:

```ts
"decision-trace": {
  dependencies: ["lucide-react"],
  registryDependencies: [self("agent-types")],
},
```

Demo:

```tsx
// apps/docs/components/demos/decision-trace-demo.tsx
import type { RouteDecision } from "@/registry/super-ai/agent-types";
import { DecisionTrace } from "@/registry/super-ai/decision-trace";

const decisions: RouteDecision[] = [
  {
    id: "d1",
    input: "Find expert analysis on quantum threats to cryptography",
    chosen: { route: "web-search", confidence: 0.92, rationale: "Needs sources fresher than the knowledge base" },
    alternatives: [
      { route: "internal-kb", confidence: 0.31 },
      { route: "direct-llm", confidence: 0.12 },
    ],
  },
  {
    id: "d2",
    input: "Summarize gathered findings",
    chosen: { route: "writer-agent", confidence: 0.88 },
    alternatives: [{ route: "direct-llm", confidence: 0.55 }],
  },
];

export default function DecisionTraceDemo() {
  return <DecisionTrace decisions={decisions} className="w-full max-w-lg" />;
}
```

- [ ] **Step 6: Verify and commit**

Run: `cd apps/docs && pnpm check:tokens && pnpm typecheck && pnpm exec vitest run registry/super-ai/decision-trace.test.tsx`
Expected: all pass.

```bash
git add apps/docs/registry/super-ai/decision-trace.tsx apps/docs/registry/super-ai/decision-trace.test.tsx apps/docs/components/demos/decision-trace-demo.tsx apps/docs/lib/catalog.ts apps/docs/scripts/gen-registry.mts
git commit -m "feat(registry): decision-trace — routing breadcrumb with alternatives and confidence"
```

---

### Task 7: `refusal-card`

**Files:**
- Create: `apps/docs/registry/super-ai/refusal-card.tsx`
- Create: `apps/docs/registry/super-ai/refusal-card.test.tsx`
- Create: `apps/docs/components/demos/refusal-card-demo.tsx`
- Modify: `apps/docs/lib/catalog.ts`, `apps/docs/scripts/gen-registry.mts`

- [ ] **Step 1: Write the failing test**

```tsx
// apps/docs/registry/super-ai/refusal-card.test.tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { GuardrailEvent } from "./agent-types";
import { RefusalCard } from "./refusal-card";

const event: GuardrailEvent = {
  id: "g1",
  kind: "refusal",
  policy: "external-communication",
  blocked: "Send report to mailing list",
  preview: "Subject: Quantum threat report…",
};

describe("RefusalCard", () => {
  it("renders blocked action, policy, and alert role", () => {
    render(<RefusalCard event={event} />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("Send report to mailing list")).toBeInTheDocument();
    expect(screen.getByText("external-communication")).toBeInTheDocument();
  });

  it("reveals the redacted preview on demand", async () => {
    render(<RefusalCard event={event} />);
    expect(screen.queryByText("Subject: Quantum threat report…")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Show blocked content" }));
    expect(screen.getByText("Subject: Quantum threat report…")).toBeInTheDocument();
  });

  it("fires onEscalate and onRequestOverride", async () => {
    const onEscalate = vi.fn();
    const onRequestOverride = vi.fn();
    render(<RefusalCard event={event} onEscalate={onEscalate} onRequestOverride={onRequestOverride} />);
    await userEvent.click(screen.getByRole("button", { name: "Escalate to a human" }));
    expect(onEscalate).toHaveBeenCalledWith("g1");
    await userEvent.click(screen.getByRole("button", { name: "Request override" }));
    expect(onRequestOverride).toHaveBeenCalledWith("g1");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/docs && pnpm exec vitest run registry/super-ai/refusal-card.test.tsx`
Expected: FAIL — `Cannot find module './refusal-card'`

- [ ] **Step 3: Write the implementation**

```tsx
// apps/docs/registry/super-ai/refusal-card.tsx
"use client";

import { Eye, ShieldAlert } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type { GuardrailEvent } from "./agent-types";

interface RefusalCardProps extends React.ComponentProps<"div"> {
  event: GuardrailEvent;
  onEscalate?: (id: string) => void;
  onRequestOverride?: (id: string) => void;
}

function RefusalCard({ event, onEscalate, onRequestOverride, className, ...props }: RefusalCardProps) {
  const [revealed, setRevealed] = React.useState(false);

  return (
    <div
      data-slot="refusal-card"
      data-kind={event.kind}
      role="alert"
      className={cn(
        "flex flex-col gap-2 rounded-lg border border-destructive/50 bg-card p-4 text-card-foreground",
        className,
      )}
      {...props}
    >
      <div className="flex items-center gap-2">
        <ShieldAlert className="size-4 text-destructive" aria-hidden />
        <p className="text-sm font-medium">Action blocked by guardrail</p>
      </div>
      {event.blocked && <p className="text-sm">{event.blocked}</p>}
      <p className="text-xs text-muted-foreground">
        Policy: <span className="rounded-sm bg-muted px-1 py-0.5 font-mono text-foreground">{event.policy}</span>
      </p>
      {event.preview &&
        (revealed ? (
          <p className="rounded-md border bg-background p-2 text-xs text-muted-foreground">{event.preview}</p>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="self-start"
            aria-label="Show blocked content"
            onClick={() => setRevealed(true)}
          >
            <Eye className="size-3.5" aria-hidden />
            Show blocked content
          </Button>
        ))}
      {(onEscalate || onRequestOverride) && (
        <div className="flex justify-end gap-2">
          {onRequestOverride && (
            <Button type="button" variant="outline" size="sm" aria-label="Request override" onClick={() => onRequestOverride(event.id)}>
              Request override
            </Button>
          )}
          {onEscalate && (
            <Button type="button" size="sm" aria-label="Escalate to a human" onClick={() => onEscalate(event.id)}>
              Escalate
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export { RefusalCard };
export type { RefusalCardProps };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/docs && pnpm exec vitest run registry/super-ai/refusal-card.test.tsx`
Expected: PASS (3 tests)

- [ ] **Step 5: Catalog entry, registry extras, demo**

Catalog entry:

```ts
{
  name: "refusal-card",
  title: "Refusal Card",
  description: "Structured guardrail refusal: blocked action, policy, redacted preview, escalate and override-request verbs.",
  group: "Agent Kit",
},
```

`gen-registry.mts` extras:

```ts
"refusal-card": {
  dependencies: ["lucide-react"],
  registryDependencies: ["button", self("agent-types")],
},
```

Demo:

```tsx
// apps/docs/components/demos/refusal-card-demo.tsx
import type { GuardrailEvent } from "@/registry/super-ai/agent-types";
import { RefusalCard } from "@/registry/super-ai/refusal-card";

const event: GuardrailEvent = {
  id: "g1",
  kind: "refusal",
  policy: "external-communication",
  blocked: "Email preliminary findings to the public security mailing list",
  preview: "Subject: Quantum threat report (draft) — contains unreviewed claims…",
};

export default function RefusalCardDemo() {
  return <RefusalCard event={event} onEscalate={() => {}} onRequestOverride={() => {}} className="w-full max-w-md" />;
}
```

- [ ] **Step 6: Verify and commit**

Run: `cd apps/docs && pnpm check:tokens && pnpm typecheck && pnpm exec vitest run registry/super-ai/refusal-card.test.tsx`
Expected: all pass.

```bash
git add apps/docs/registry/super-ai/refusal-card.tsx apps/docs/registry/super-ai/refusal-card.test.tsx apps/docs/components/demos/refusal-card-demo.tsx apps/docs/lib/catalog.ts apps/docs/scripts/gen-registry.mts
git commit -m "feat(registry): refusal-card — guardrail refusal with policy, preview reveal, escalate/override"
```

---

### Task 8: `handoff-indicator`

**Files:**
- Create: `apps/docs/registry/super-ai/handoff-indicator.tsx`
- Create: `apps/docs/registry/super-ai/handoff-indicator.test.tsx`
- Create: `apps/docs/components/demos/handoff-indicator-demo.tsx`
- Modify: `apps/docs/lib/catalog.ts`, `apps/docs/scripts/gen-registry.mts`

- [ ] **Step 1: Write the failing test**

```tsx
// apps/docs/registry/super-ai/handoff-indicator.test.tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import type { HandoffEvent } from "./agent-types";
import { HandoffIndicator, HandoffStack } from "./handoff-indicator";

const handoff: HandoffEvent = {
  id: "h1",
  from: "Researcher",
  to: "Writer",
  reason: "Sources gathered; draft needed",
  payloadSummary: "12 sources, threat matrix",
  at: "14:02",
};

describe("HandoffIndicator", () => {
  it("renders from → to and expands to reason/payload", async () => {
    render(<HandoffIndicator handoff={handoff} />);
    expect(screen.getByText("Researcher")).toBeInTheDocument();
    expect(screen.getByText("Writer")).toBeInTheDocument();
    const toggle = screen.getByRole("button", { name: "Toggle handoff detail from Researcher to Writer" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(toggle);
    expect(screen.getByText("Sources gathered; draft needed")).toBeInTheDocument();
    expect(screen.getByText("12 sources, threat matrix")).toBeInTheDocument();
  });

  it("HandoffStack renders a list of handoffs", () => {
    render(
      <HandoffStack
        handoffs={[handoff, { id: "h2", from: "Writer", to: "Critic", reason: "Draft ready for review" }]}
      />,
    );
    expect(screen.getByRole("list")).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getByText("Critic")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/docs && pnpm exec vitest run registry/super-ai/handoff-indicator.test.tsx`
Expected: FAIL — `Cannot find module './handoff-indicator'`

- [ ] **Step 3: Write the implementation**

```tsx
// apps/docs/registry/super-ai/handoff-indicator.tsx
"use client";

import { ArrowRight, Users } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

import type { HandoffEvent } from "./agent-types";

interface HandoffIndicatorProps extends React.ComponentProps<"div"> {
  handoff: HandoffEvent;
}

function HandoffIndicator({ handoff, className, ...props }: HandoffIndicatorProps) {
  const [expanded, setExpanded] = React.useState(false);

  return (
    <div data-slot="handoff-indicator" className={cn("flex flex-col gap-1", className)} {...props}>
      <button
        type="button"
        aria-expanded={expanded}
        aria-label={`Toggle handoff detail from ${handoff.from} to ${handoff.to}`}
        className="flex w-fit items-center gap-1.5 rounded-full border bg-background px-2.5 py-1 text-xs hover:bg-accent"
        onClick={() => setExpanded((v) => !v)}
      >
        <Users className="size-3 text-muted-foreground" aria-hidden />
        <span className="font-medium">{handoff.from}</span>
        <ArrowRight className="size-3 text-muted-foreground" aria-hidden />
        <span className="font-medium">{handoff.to}</span>
        {handoff.at && <span className="tabular-nums text-muted-foreground">{handoff.at}</span>}
      </button>
      {expanded && (
        <div data-slot="handoff-detail" className="rounded-md border bg-card p-2 text-xs">
          <p>{handoff.reason}</p>
          {handoff.payloadSummary && <p className="mt-1 text-muted-foreground">{handoff.payloadSummary}</p>}
        </div>
      )}
    </div>
  );
}

interface HandoffStackProps extends React.ComponentProps<"ul"> {
  handoffs: HandoffEvent[];
}

function HandoffStack({ handoffs, className, ...props }: HandoffStackProps) {
  return (
    <ul data-slot="handoff-stack" role="list" className={cn("flex flex-col gap-1.5", className)} {...props}>
      {handoffs.map((h) => (
        <li key={h.id}>
          <HandoffIndicator handoff={h} />
        </li>
      ))}
    </ul>
  );
}

export { HandoffIndicator, HandoffStack };
export type { HandoffIndicatorProps, HandoffStackProps };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/docs && pnpm exec vitest run registry/super-ai/handoff-indicator.test.tsx`
Expected: PASS (2 tests)

- [ ] **Step 5: Catalog entry, registry extras, demo**

Catalog entry:

```ts
{
  name: "handoff-indicator",
  title: "Handoff Indicator",
  description: "Agent-to-agent handoff chip with reason and payload detail; stackable sequence.",
  group: "Agent Kit",
},
```

`gen-registry.mts` extras:

```ts
"handoff-indicator": {
  dependencies: ["lucide-react"],
  registryDependencies: [self("agent-types")],
},
```

Demo:

```tsx
// apps/docs/components/demos/handoff-indicator-demo.tsx
import type { HandoffEvent } from "@/registry/super-ai/agent-types";
import { HandoffStack } from "@/registry/super-ai/handoff-indicator";

const handoffs: HandoffEvent[] = [
  { id: "h1", from: "Planner", to: "Researcher", reason: "Plan approved; gather sources", at: "13:58" },
  { id: "h2", from: "Researcher", to: "Writer", reason: "Sources gathered; draft needed", payloadSummary: "12 sources, threat matrix", at: "14:02" },
  { id: "h3", from: "Writer", to: "Critic", reason: "Draft ready for review", at: "14:05" },
];

export default function HandoffIndicatorDemo() {
  return <HandoffStack handoffs={handoffs} className="w-full max-w-sm" />;
}
```

- [ ] **Step 6: Verify and commit**

Run: `cd apps/docs && pnpm check:tokens && pnpm typecheck && pnpm exec vitest run registry/super-ai/handoff-indicator.test.tsx`
Expected: all pass.

```bash
git add apps/docs/registry/super-ai/handoff-indicator.tsx apps/docs/registry/super-ai/handoff-indicator.test.tsx apps/docs/components/demos/handoff-indicator-demo.tsx apps/docs/lib/catalog.ts apps/docs/scripts/gen-registry.mts
git commit -m "feat(registry): handoff-indicator — A2A handoff chip + stack"
```

---

### Task 9: `connector-status`

**Files:**
- Create: `apps/docs/registry/super-ai/connector-status.tsx`
- Create: `apps/docs/registry/super-ai/connector-status.test.tsx`
- Create: `apps/docs/components/demos/connector-status-demo.tsx`
- Modify: `apps/docs/lib/catalog.ts`, `apps/docs/scripts/gen-registry.mts`

- [ ] **Step 1: Write the failing test**

```tsx
// apps/docs/registry/super-ai/connector-status.test.tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { ConnectorState } from "./agent-types";
import { ConnectorStatus } from "./connector-status";

const connectors: ConnectorState[] = [
  { id: "c1", name: "github-mcp", health: "connected", toolCount: 12, latencyMs: 45 },
  { id: "c2", name: "figma-mcp", health: "auth-needed" },
  { id: "c3", name: "sql-mcp", health: "error", toolCount: 0 },
];

describe("ConnectorStatus", () => {
  it("renders one chip per connector with health on data-health", () => {
    render(<ConnectorStatus connectors={connectors} />);
    expect(screen.getByText("github-mcp").closest("[data-slot='connector-chip']")).toHaveAttribute(
      "data-health",
      "connected",
    );
    expect(screen.getByText("figma-mcp").closest("[data-slot='connector-chip']")).toHaveAttribute(
      "data-health",
      "auth-needed",
    );
  });

  it("expands a connector to show tools and latency, and fires onConnectorSelect", async () => {
    const onConnectorSelect = vi.fn();
    render(<ConnectorStatus connectors={connectors} onConnectorSelect={onConnectorSelect} />);
    const chip = screen.getByRole("button", { name: "Toggle detail for github-mcp" });
    await userEvent.click(chip);
    expect(screen.getByText("12 tools")).toBeInTheDocument();
    expect(screen.getByText("45ms")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Open github-mcp" }));
    expect(onConnectorSelect).toHaveBeenCalledWith("c1");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/docs && pnpm exec vitest run registry/super-ai/connector-status.test.tsx`
Expected: FAIL — `Cannot find module './connector-status'`

- [ ] **Step 3: Write the implementation**

```tsx
// apps/docs/registry/super-ai/connector-status.tsx
"use client";

import { CircleAlert, CircleCheck, KeyRound, Plug } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type { ConnectorHealth, ConnectorState } from "./agent-types";

const HEALTH_ICON: Record<ConnectorHealth, React.ReactNode> = {
  connected: <CircleCheck className="size-3 text-primary" aria-hidden />,
  "auth-needed": <KeyRound className="size-3 text-muted-foreground" aria-hidden />,
  error: <CircleAlert className="size-3 text-destructive" aria-hidden />,
};

interface ConnectorStatusProps extends React.ComponentProps<"div"> {
  connectors: ConnectorState[];
  onConnectorSelect?: (id: string) => void;
}

function ConnectorStatus({ connectors, onConnectorSelect, className, ...props }: ConnectorStatusProps) {
  const [openId, setOpenId] = React.useState<string | null>(null);
  const open = connectors.find((c) => c.id === openId);

  return (
    <div data-slot="connector-status" className={cn("flex flex-col gap-1.5", className)} {...props}>
      <div className="flex flex-wrap items-center gap-1.5">
        {connectors.map((c) => (
          <button
            key={c.id}
            type="button"
            data-slot="connector-chip"
            data-health={c.health}
            aria-expanded={openId === c.id}
            aria-label={`Toggle detail for ${c.name}`}
            className={cn(
              "flex items-center gap-1.5 rounded-full border bg-background px-2.5 py-1 text-xs hover:bg-accent",
              openId === c.id && "bg-accent",
            )}
            onClick={() => setOpenId((cur) => (cur === c.id ? null : c.id))}
          >
            <Plug className="size-3 text-muted-foreground" aria-hidden />
            <span className="font-mono">{c.name}</span>
            {HEALTH_ICON[c.health]}
          </button>
        ))}
      </div>
      {open && (
        <div data-slot="connector-detail" className="flex items-center justify-between rounded-md border bg-card p-2 text-xs">
          <div className="flex items-center gap-3 text-muted-foreground">
            <span>{open.health}</span>
            {open.toolCount !== undefined && <span>{`${open.toolCount} tools`}</span>}
            {open.latencyMs !== undefined && <span className="tabular-nums">{`${open.latencyMs}ms`}</span>}
          </div>
          {onConnectorSelect && (
            <Button type="button" variant="ghost" size="sm" aria-label={`Open ${open.name}`} onClick={() => onConnectorSelect(open.id)}>
              Open
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export { ConnectorStatus };
export type { ConnectorStatusProps };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/docs && pnpm exec vitest run registry/super-ai/connector-status.test.tsx`
Expected: PASS (2 tests)

- [ ] **Step 5: Catalog entry, registry extras, demo**

Catalog entry:

```ts
{
  name: "connector-status",
  title: "Connector Status",
  description: "MCP server and connector health chips with expandable tool count and latency detail.",
  group: "Agent Kit",
},
```

`gen-registry.mts` extras:

```ts
"connector-status": {
  dependencies: ["lucide-react"],
  registryDependencies: ["button", self("agent-types")],
},
```

Demo:

```tsx
// apps/docs/components/demos/connector-status-demo.tsx
import type { ConnectorState } from "@/registry/super-ai/agent-types";
import { ConnectorStatus } from "@/registry/super-ai/connector-status";

const connectors: ConnectorState[] = [
  { id: "c1", name: "github-mcp", health: "connected", toolCount: 12, latencyMs: 45 },
  { id: "c2", name: "figma-mcp", health: "auth-needed", toolCount: 8 },
  { id: "c3", name: "sql-mcp", health: "error", toolCount: 0, latencyMs: 1200 },
];

export default function ConnectorStatusDemo() {
  return <ConnectorStatus connectors={connectors} className="w-full max-w-md" />;
}
```

- [ ] **Step 6: Verify and commit**

Run: `cd apps/docs && pnpm check:tokens && pnpm typecheck && pnpm exec vitest run registry/super-ai/connector-status.test.tsx`
Expected: all pass.

```bash
git add apps/docs/registry/super-ai/connector-status.tsx apps/docs/registry/super-ai/connector-status.test.tsx apps/docs/components/demos/connector-status-demo.tsx apps/docs/lib/catalog.ts apps/docs/scripts/gen-registry.mts
git commit -m "feat(registry): connector-status — MCP connector health chips with detail"
```

---

### Task 10: `agent-console` block + scripted demo

**Files:**
- Create: `apps/docs/registry/super-ai/agent-console.tsx`
- Create: `apps/docs/registry/super-ai/agent-console.test.tsx`
- Create: `apps/docs/components/demos/agent-console-demo.tsx`
- Modify: `apps/docs/lib/catalog.ts`, `apps/docs/scripts/gen-registry.mts`

The console is a layout composition; the host owns the loop. The demo owns a static event
script (Gulli's research-assistant scenario) and a "Next event" stepper — no timers.

- [ ] **Step 1: Write the failing test**

```tsx
// apps/docs/registry/super-ai/agent-console.test.tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { GoalStatus, GuardrailEvent, HandoffEvent, PlanStep, RouteDecision } from "./agent-types";
import { AgentConsole } from "./agent-console";

const goal: GoalStatus = {
  goal: "Analyze quantum computing impact on cybersecurity",
  state: "on-track",
  criteria: [{ id: "c1", label: "Report drafted", met: false }],
};
const steps: PlanStep[] = [{ id: "s1", title: "Identify concepts", status: "running" }];
const decisions: RouteDecision[] = [
  { id: "d1", input: "Gather sources", chosen: { route: "web-search", confidence: 0.9 }, alternatives: [] },
];
const handoffs: HandoffEvent[] = [{ id: "h1", from: "Planner", to: "Researcher", reason: "Plan approved" }];
const refusal: GuardrailEvent = { id: "g1", kind: "refusal", policy: "external-communication", blocked: "Email list" };

describe("AgentConsole", () => {
  it("composes goal, plan, decisions, handoffs and cost", () => {
    render(
      <AgentConsole goal={goal} steps={steps} decisions={decisions} handoffs={handoffs} spentUsd={0.42} />,
    );
    expect(screen.getByText("Analyze quantum computing impact on cybersecurity")).toBeInTheDocument();
    expect(screen.getByText("Identify concepts")).toBeInTheDocument();
    expect(screen.getByText("web-search")).toBeInTheDocument();
    expect(screen.getByText("Researcher")).toBeInTheDocument();
    expect(screen.getByText("$0.42")).toBeInTheDocument();
  });

  it("renders a refusal interrupt and fires onEscalate", async () => {
    const onEscalate = vi.fn();
    render(
      <AgentConsole goal={goal} steps={steps} decisions={[]} handoffs={[]} refusal={refusal} onEscalate={onEscalate} />,
    );
    expect(screen.getByRole("alert")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Escalate to a human" }));
    expect(onEscalate).toHaveBeenCalledWith("g1");
  });

  it("renders a plan-approval interrupt and fires onApprovePlan", async () => {
    const onApprovePlan = vi.fn();
    render(
      <AgentConsole
        goal={goal}
        steps={[]}
        decisions={[]}
        handoffs={[]}
        approval={{ steps: [{ id: "p1", title: "Search the web", status: "pending" }] }}
        onApprovePlan={onApprovePlan}
        onRejectPlan={vi.fn()}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Approve plan" }));
    expect(onApprovePlan).toHaveBeenCalledWith([expect.objectContaining({ id: "p1" })]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/docs && pnpm exec vitest run registry/super-ai/agent-console.test.tsx`
Expected: FAIL — `Cannot find module './agent-console'`

- [ ] **Step 3: Write the implementation**

```tsx
// apps/docs/registry/super-ai/agent-console.tsx
"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

import type { GoalStatus, GuardrailEvent, HandoffEvent, PlanStep, RouteDecision } from "./agent-types";
import { DecisionTrace } from "./decision-trace";
import { GoalCard } from "./goal-card";
import { HandoffStack } from "./handoff-indicator";
import { PlanApproval } from "./plan-approval";
import { PlanTimeline } from "./plan-timeline";
import { RefusalCard } from "./refusal-card";

interface AgentConsoleProps extends React.ComponentProps<"div"> {
  goal: GoalStatus;
  steps: PlanStep[];
  decisions: RouteDecision[];
  handoffs: HandoffEvent[];
  refusal?: GuardrailEvent;
  /** When set, the console shows a pre-execution plan-approval interrupt. */
  approval?: { steps: PlanStep[]; title?: string };
  spentUsd?: number;
  onStop?: () => void;
  onStepSelect?: (id: string) => void;
  onEscalate?: (id: string) => void;
  onRequestOverride?: (id: string) => void;
  onApprovePlan?: (steps: PlanStep[]) => void;
  onRejectPlan?: (reason: string) => void;
}

function AgentConsole({
  goal,
  steps,
  decisions,
  handoffs,
  refusal,
  approval,
  spentUsd,
  onStop,
  onStepSelect,
  onEscalate,
  onRequestOverride,
  onApprovePlan,
  onRejectPlan,
  className,
  ...props
}: AgentConsoleProps) {
  return (
    <div
      data-slot="agent-console"
      className={cn("grid w-full gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]", className)}
      {...props}
    >
      <div className="flex flex-col gap-4">
        <GoalCard status={goal} onStop={onStop} />
        {handoffs.length > 0 && (
          <section aria-label="Agent handoffs" className="flex flex-col gap-2">
            <h4 className="text-xs font-medium uppercase text-muted-foreground">Handoffs</h4>
            <HandoffStack handoffs={handoffs} />
          </section>
        )}
        {spentUsd !== undefined && (
          <div data-slot="agent-console-usage" className="flex items-center justify-between rounded-md border bg-card px-3 py-2 text-xs">
            <span className="text-muted-foreground">Run cost</span>
            <span className="tabular-nums">{`$${spentUsd.toFixed(2)}`}</span>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-4">
        {refusal && <RefusalCard event={refusal} onEscalate={onEscalate} onRequestOverride={onRequestOverride} />}
        {approval && onApprovePlan && onRejectPlan && (
          <PlanApproval
            steps={approval.steps}
            title={approval.title}
            onApprove={onApprovePlan}
            onReject={onRejectPlan}
          />
        )}
        <section aria-label="Plan" className="flex flex-col gap-2">
          <h4 className="text-xs font-medium uppercase text-muted-foreground">Plan</h4>
          <PlanTimeline steps={steps} onStepSelect={onStepSelect} aria-label="Agent plan" />
        </section>
        {decisions.length > 0 && (
          <section aria-label="Routing decisions" className="flex flex-col gap-2">
            <h4 className="text-xs font-medium uppercase text-muted-foreground">Decisions</h4>
            <DecisionTrace decisions={decisions} />
          </section>
        )}
      </div>
    </div>
  );
}

export { AgentConsole };
export type { AgentConsoleProps };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/docs && pnpm exec vitest run registry/super-ai/agent-console.test.tsx`
Expected: PASS (2 tests)

- [ ] **Step 5: Catalog entry, registry extras, scripted replay demo**

Catalog entry:

```ts
{
  name: "agent-console",
  title: "Agent Console",
  description: "Composed 'watch the agent work' surface: goal, plan, decisions, handoffs, interrupts, run cost.",
  group: "Agent Kit",
},
```

`gen-registry.mts` extras:

```ts
"agent-console": {
  registryDependencies: [
    self("agent-types"),
    self("plan-timeline"),
    self("plan-approval"),
    self("goal-card"),
    self("decision-trace"),
    self("handoff-indicator"),
    self("refusal-card"),
  ],
},
```

Optional fidelity improvement (spec §3 names `cost-chip` for the usage strip): read
`apps/docs/registry/super-ai/cost-chip.tsx`; if its props accept a single formatted amount,
render it inside the `agent-console-usage` strip in place of the plain `<span>` and add
`self("cost-chip")` to the registryDependencies above. If its API is per-action rather than
per-run, keep the plain span — do not bend the primitive.

Demo — the Gulli research-assistant replay with a manual stepper:

```tsx
// apps/docs/components/demos/agent-console-demo.tsx
"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import type {
  GoalStatus,
  GuardrailEvent,
  HandoffEvent,
  PlanStep,
  RouteDecision,
} from "@/registry/super-ai/agent-types";
import { AgentConsole } from "@/registry/super-ai/agent-console";

interface Frame {
  label: string;
  goalState: GoalStatus["state"];
  criteriaMet: number;
  stepStatuses: PlanStep["status"][];
  decisions: number;
  handoffs: number;
  refusal?: GuardrailEvent;
  awaitingApproval?: boolean;
  spentUsd: number;
}

const PLAN: Omit<PlanStep, "status">[] = [
  { id: "s1", title: "Identify foundational concepts of quantum computing" },
  { id: "s2", title: "Research common cryptographic algorithms" },
  { id: "s3", title: "Find expert analysis on quantum threats" },
  { id: "s4", title: "Synthesize findings into a structured report" },
];

const DECISIONS: RouteDecision[] = [
  { id: "d1", input: "Gather sources", chosen: { route: "web-search", confidence: 0.92, rationale: "Fresh sources required" }, alternatives: [{ route: "internal-kb", confidence: 0.31 }] },
  { id: "d2", input: "Draft the report", chosen: { route: "writer-agent", confidence: 0.88 }, alternatives: [{ route: "direct-llm", confidence: 0.55 }] },
];

const HANDOFFS: HandoffEvent[] = [
  { id: "h1", from: "Planner", to: "Researcher", reason: "Plan approved; gather sources", at: "13:58" },
  { id: "h2", from: "Researcher", to: "Writer", reason: "Sources gathered; draft needed", payloadSummary: "12 sources", at: "14:02" },
  { id: "h3", from: "Writer", to: "Critic", reason: "Draft ready for review", at: "14:05" },
];

const REFUSAL: GuardrailEvent = {
  id: "g1",
  kind: "refusal",
  policy: "external-communication",
  blocked: "Email preliminary findings to the public security list",
};

// Frame-by-frame replay of Gulli's research-assistant capstone:
// Planner proposes → human approves plan → Researcher → (refusal interrupt) → Writer → Critic → done.
const FRAMES: Frame[] = [
  { label: "Planner proposes a plan — awaiting approval", goalState: "on-track", criteriaMet: 0, stepStatuses: ["pending", "pending", "pending", "pending"], decisions: 0, handoffs: 0, awaitingApproval: true, spentUsd: 0.02 },
  { label: "Plan approved; Researcher gathers sources via web-search", goalState: "on-track", criteriaMet: 0, stepStatuses: ["done", "running", "pending", "pending"], decisions: 1, handoffs: 1, spentUsd: 0.18 },
  { label: "Guardrail blocks external email", goalState: "at-risk", criteriaMet: 0, stepStatuses: ["done", "running", "needs-approval", "pending"], decisions: 1, handoffs: 1, refusal: REFUSAL, spentUsd: 0.21 },
  { label: "Writer drafts the report", goalState: "on-track", criteriaMet: 1, stepStatuses: ["done", "done", "done", "running"], decisions: 2, handoffs: 2, spentUsd: 0.49 },
  { label: "Critic approves; run complete", goalState: "on-track", criteriaMet: 2, stepStatuses: ["done", "done", "done", "done"], decisions: 2, handoffs: 3, spentUsd: 0.61 },
];

export default function AgentConsoleDemo() {
  const [frame, setFrame] = React.useState(0);
  const f = FRAMES[frame];

  const goal: GoalStatus = {
    goal: "Analyze the impact of quantum computing on cybersecurity",
    state: f.goalState,
    criteria: [
      { id: "c1", label: "≥ 5 primary sources gathered", met: f.criteriaMet >= 1 },
      { id: "c2", label: "Critic approves final draft", met: f.criteriaMet >= 2 },
    ],
  };
  const steps: PlanStep[] = PLAN.map((p, i) => ({ ...p, status: f.stepStatuses[i] }));
  const advance = () => setFrame((v) => Math.min(v + 1, FRAMES.length - 1));

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">{`${frame + 1}/${FRAMES.length} — ${f.label}`}</p>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" disabled={frame === 0} onClick={() => setFrame(0)}>
            Reset
          </Button>
          <Button type="button" size="sm" disabled={frame === FRAMES.length - 1} onClick={advance}>
            Next event
          </Button>
        </div>
      </div>
      <AgentConsole
        goal={goal}
        steps={f.awaitingApproval ? [] : steps}
        decisions={DECISIONS.slice(0, f.decisions)}
        handoffs={HANDOFFS.slice(0, f.handoffs)}
        refusal={f.refusal}
        approval={f.awaitingApproval ? { steps, title: "Planner proposes this plan" } : undefined}
        spentUsd={f.spentUsd}
        onStop={() => {}}
        onEscalate={advance}
        onApprovePlan={advance}
        onRejectPlan={() => setFrame(0)}
      />
    </div>
  );
}
```

- [ ] **Step 6: Verify and commit**

Run: `cd apps/docs && pnpm check:tokens && pnpm typecheck && pnpm test`
Expected: all pass (full suite — console composes everything).

```bash
git add apps/docs/registry/super-ai/agent-console.tsx apps/docs/registry/super-ai/agent-console.test.tsx apps/docs/components/demos/agent-console-demo.tsx apps/docs/lib/catalog.ts apps/docs/scripts/gen-registry.mts
git commit -m "feat(registry): agent-console block — composed run surface + Gulli research-assistant replay demo"
```

---

### Task 11: Patterns docs section — data, route, nav

**Files:**
- Create: `apps/docs/lib/patterns.ts`
- Create: `apps/docs/app/patterns/[slug]/page.tsx`
- Create: `apps/docs/app/patterns/page.tsx`
- Modify: `apps/docs/components/docs-nav.tsx`

Six pattern pages from the spec §4, content as structured data. Definitions are cited and
condensed (2–3 sentences per pattern); UX guidance, mapping, states, and do/don'ts are complete.
The standing line from spec §8 appears on every page.

- [ ] **Step 1: Create the data file with all six pages**

```ts
// apps/docs/lib/patterns.ts
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
```

- [ ] **Step 2: Create the dynamic page route**

```tsx
// apps/docs/app/patterns/[slug]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";

import { getPatternPage, PATTERN_PAGES, SOURCES, STANDING_LINE } from "@/lib/patterns";

export function generateStaticParams() {
  return PATTERN_PAGES.map((p) => ({ slug: p.slug }));
}

export default async function PatternPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = getPatternPage(slug);
  if (!page) notFound();

  return (
    <article className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-10">
      <header>
        <p className="text-xs font-medium uppercase text-muted-foreground">Pattern</p>
        <h1 className="mt-1 text-3xl font-bold">{page.title}</h1>
        <p className="mt-2 text-muted-foreground">{page.intro}</p>
        <p className="mt-3 rounded-md border bg-muted/50 p-3 text-xs text-muted-foreground">{STANDING_LINE}</p>
      </header>

      <section>
        <h2 className="text-xl font-semibold">Patterns in this group</h2>
        <dl className="mt-3 flex flex-col gap-3">
          {page.patterns.map((p) => (
            <div key={p.name}>
              <dt className="text-sm font-medium">{p.name}</dt>
              <dd className="text-sm text-muted-foreground">{p.definition}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 text-xs text-muted-foreground">{SOURCES}</p>
      </section>

      <section>
        <h2 className="text-xl font-semibold">UX implications</h2>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
          {page.uxImplications.map((u) => (
            <li key={u}>{u}</li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold">Component mapping</h2>
        <table className="mt-3 w-full text-left text-sm">
          <thead>
            <tr className="border-b text-xs uppercase text-muted-foreground">
              <th className="py-2 pr-4 font-medium">Component</th>
              <th className="py-2 font-medium">When to use</th>
            </tr>
          </thead>
          <tbody>
            {page.mappings.map((m) => (
              <tr key={m.component} className="border-b last:border-0 align-top">
                <td className="py-2 pr-4">
                  <Link href={m.href} className="underline underline-offset-4 hover:text-foreground">
                    {m.component}
                  </Link>
                </td>
                <td className="py-2 text-muted-foreground">{m.when}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2 className="text-xl font-semibold">States checklist</h2>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
          {page.states.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold">Do / Don't</h2>
        <ul className="mt-3 flex flex-col gap-2 text-sm">
          {page.dos.map((pair) => (
            <li key={pair.do} className="rounded-md border p-3">
              <p>
                <span className="font-medium text-primary">Do</span> {pair.do}
              </p>
              <p className="text-muted-foreground">
                <span className="font-medium text-destructive">Don't</span> {pair.dont}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </article>
  );
}
```

- [ ] **Step 3: Create the index page**

```tsx
// apps/docs/app/patterns/page.tsx
import Link from "next/link";

import { PATTERN_PAGES } from "@/lib/patterns";

export default function PatternsIndexPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-10">
      <header>
        <h1 className="text-3xl font-bold">Agentic Patterns</h1>
        <p className="mt-2 text-muted-foreground">
          The established agentic design patterns, mapped to the components that give them a user interface.
        </p>
      </header>
      <ul className="flex flex-col gap-3">
        {PATTERN_PAGES.map((p) => (
          <li key={p.slug} className="rounded-lg border p-4 hover:bg-accent">
            <Link href={`/patterns/${p.slug}`} className="flex flex-col gap-1">
              <span className="font-medium">{p.title}</span>
              <span className="text-sm text-muted-foreground">{p.intro}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 4: Add Patterns to the sidebar nav**

Open `apps/docs/components/docs-nav.tsx`. After the catalog-driven groups render, add a
"Patterns" group that links the six pages. Add the import and a nav block (adapt placement
to the file's existing group-rendering structure — same markup/classes as an existing group):

```tsx
import { PATTERN_PAGES } from "@/lib/patterns";
```

```tsx
{/* Patterns section — static pages, not catalog items */}
<div data-slot="docs-nav-group">
  <p className="px-2 pt-4 text-xs font-medium uppercase text-muted-foreground">Patterns</p>
  <ul className="mt-1 flex flex-col">
    {PATTERN_PAGES.map((p) => (
      <li key={p.slug}>
        <Link
          href={`/patterns/${p.slug}`}
          className="block rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          {p.title}
        </Link>
      </li>
    ))}
  </ul>
</div>
```

If `docs-nav.tsx` highlights the active route via `usePathname()`, reuse that mechanism for
these links the same way the component links do.

- [ ] **Step 5: Back-link component pages to their pattern page**

Spec §4: every Agent Kit component doc links to its pattern page. Three edits:

(a) In `apps/docs/lib/catalog.ts`, extend the interface:

```ts
export interface CatalogItem {
  name: string;
  title: string;
  description: string;
  group: "Primitives" | "Components" | "Agent Kit";
  patternSlug?: string; // links the component page to /patterns/{slug}
}
```

(b) Set `patternSlug` on the ten Agent Kit entries added in Tasks 1–10 (and 14–15 when done):

| name | patternSlug |
| --- | --- |
| agent-types | execution-and-decomposition |
| plan-timeline | execution-and-decomposition |
| plan-approval | human-oversight-and-reliability |
| goal-card | human-oversight-and-reliability |
| critique-panel | state-and-self-improvement |
| decision-trace | execution-and-decomposition |
| refusal-card | human-oversight-and-reliability |
| handoff-indicator | collaboration |
| connector-status | external-world |
| agent-console | collaboration |
| safety-banner | human-oversight-and-reliability |
| task-queue | operations-and-cognition |

(c) In `apps/docs/app/components/[name]/page.tsx`, under the description paragraph, render
the link when the catalog item has `patternSlug` (match surrounding markup):

```tsx
{item.patternSlug && (
  <p className="mt-2 text-sm">
    <Link href={`/patterns/${item.patternSlug}`} className="text-muted-foreground underline underline-offset-4 hover:text-foreground">
      Pattern background
    </Link>
  </p>
)}
```

Add `import Link from "next/link";` to that page if it is not already imported.

- [ ] **Step 6: Verify build and pages render**

Run: `cd apps/docs && pnpm typecheck && pnpm check:tokens && pnpm build`
Expected: build succeeds; static params include all six pattern slugs.

Run: `cd apps/docs && pnpm dev` and manually open `http://localhost:3000/patterns` and one
detail page (`/patterns/execution-and-decomposition`); confirm nav shows the Patterns group
and a component page (e.g. `/components/plan-timeline`) shows the "Pattern background" link.
Stop the dev server.

- [ ] **Step 7: Commit**

```bash
git add apps/docs/lib/patterns.ts apps/docs/app/patterns apps/docs/components/docs-nav.tsx apps/docs/lib/catalog.ts "apps/docs/app/components/[name]/page.tsx"
git commit -m "feat(docs): Patterns section — six pattern pages, nav group, component back-links"
```

---

### Task 12: Parent spec amendment + README

**Files:**
- Modify: `docs/superpowers/specs/2026-06-10-super-ai-components-design.md` (sequencing table)
- Modify: `README.md` (one line in the catalog/roadmap blurb)

- [ ] **Step 1: Amend the parent spec wave table**

In `docs/superpowers/specs/2026-06-10-super-ai-components-design.md` §11, add a row to the
wave table directly under the `1 — App Shell & Nav` row:

```markdown
| AK — Agent Kit       | Agent Kit components (plan, goal, critique, decision, refusal, handoff, connector) + `agent-console` block + Patterns docs section. Spec: `2026-06-12-agent-kit-design.md`. Slots after Wave 1 by priority; flow-wave plan docs keep their numbering. |
```

- [ ] **Step 2: Mention the kit in the README**

In `README.md`, extend the registry description sentence ("app shells, creative studios, flow
canvases, feedback loops, observability, and monetization UI") to include agent surfaces:

```markdown
app shells, creative studios, flow canvases, agent consoles, feedback loops, observability,
and monetization UI
```

- [ ] **Step 3: Commit**

```bash
git add docs/superpowers/specs/2026-06-10-super-ai-components-design.md README.md
git commit -m "docs(spec): register Agent Kit wave in parent sequencing + README mention"
```

---

### Task 13: Full verification + consumer test

**Files:** none created — verification only.

- [ ] **Step 1: Full pipeline from repo root**

Run: `pnpm lint && pnpm typecheck && pnpm test && pnpm check:tokens && pnpm build`
Expected: all pass. If lint flags import order or formatting, run `pnpm format` and re-run.

- [ ] **Step 2: Registry output sanity**

Run: `ls apps/docs/public/r | grep -E "agent-types|plan-timeline|plan-approval|goal-card|critique-panel|decision-trace|refusal-card|handoff-indicator|connector-status|agent-console"`
Expected: ten `.json` files listed.

- [ ] **Step 3: Consumer install test**

Run: `apps/docs/scripts/consumer-test.sh`
Expected: PASS — every registry item (including the ten new ones) installs into a fresh app.
If the script pins an item list, add the ten new names to it first and include that change in
the commit below.

- [ ] **Step 4: Commit any verification fixes**

```bash
git add -A
git commit -m "test: consumer-test covers Agent Kit items; verification fixes"
```

Only commit if Step 1–3 produced changes; otherwise skip.

---

### Task 14 (stretch — may slip without blocking): `safety-banner`

**Files:**
- Create: `apps/docs/registry/super-ai/safety-banner.tsx`
- Create: `apps/docs/registry/super-ai/safety-banner.test.tsx`
- Create: `apps/docs/components/demos/safety-banner-demo.tsx`
- Modify: `apps/docs/lib/catalog.ts`, `apps/docs/scripts/gen-registry.mts`

- [ ] **Step 1: Write the failing test**

```tsx
// apps/docs/registry/super-ai/safety-banner.test.tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { SafetyBanner } from "./safety-banner";

describe("SafetyBanner", () => {
  it("renders status role with kind and message", () => {
    render(<SafetyBanner kind="degraded" message="Fallback model active — responses may be slower." />);
    const banner = screen.getByRole("status");
    expect(banner).toHaveAttribute("data-kind", "degraded");
    expect(screen.getByText("Fallback model active — responses may be slower.")).toBeInTheDocument();
  });

  it("fires onDismiss when dismissible", async () => {
    const onDismiss = vi.fn();
    render(<SafetyBanner kind="sandbox" message="Running in sandbox." onDismiss={onDismiss} />);
    await userEvent.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(onDismiss).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/docs && pnpm exec vitest run registry/super-ai/safety-banner.test.tsx`
Expected: FAIL — `Cannot find module './safety-banner'`

- [ ] **Step 3: Write the implementation**

```tsx
// apps/docs/registry/super-ai/safety-banner.tsx
"use client";

import { Box, Filter, ShieldAlert, TriangleAlert, X } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type { GuardrailKind } from "./agent-types";

const KIND_ICON: Record<GuardrailKind, React.ReactNode> = {
  refusal: <ShieldAlert className="size-4" aria-hidden />,
  degraded: <TriangleAlert className="size-4" aria-hidden />,
  sandbox: <Box className="size-4" aria-hidden />,
  filter: <Filter className="size-4" aria-hidden />,
};

interface SafetyBannerProps extends React.ComponentProps<"div"> {
  kind: GuardrailKind;
  message: string;
  onDismiss?: () => void;
}

function SafetyBanner({ kind, message, onDismiss, className, ...props }: SafetyBannerProps) {
  return (
    <div
      data-slot="safety-banner"
      data-kind={kind}
      role="status"
      className={cn(
        "flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2 text-sm text-foreground",
        kind === "degraded" && "border-destructive/50",
        className,
      )}
      {...props}
    >
      <span className="text-muted-foreground">{KIND_ICON[kind]}</span>
      <p className="min-w-0 flex-1">{message}</p>
      {onDismiss && (
        <Button type="button" variant="ghost" size="icon" aria-label="Dismiss" onClick={onDismiss}>
          <X className="size-3.5" aria-hidden />
        </Button>
      )}
    </div>
  );
}

export { SafetyBanner };
export type { SafetyBannerProps };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/docs && pnpm exec vitest run registry/super-ai/safety-banner.test.tsx`
Expected: PASS (2 tests)

- [ ] **Step 5: Catalog entry, registry extras, demo**

Catalog entry:

```ts
{
  name: "safety-banner",
  title: "Safety Banner",
  description: "System-level guardrail state: degraded mode, sandboxed execution, content filter active.",
  group: "Agent Kit",
  patternSlug: "human-oversight-and-reliability",
},
```

`gen-registry.mts` extras:

```ts
"safety-banner": {
  dependencies: ["lucide-react"],
  registryDependencies: ["button", self("agent-types")],
},
```

Demo:

```tsx
// apps/docs/components/demos/safety-banner-demo.tsx
import { SafetyBanner } from "@/registry/super-ai/safety-banner";

export default function SafetyBannerDemo() {
  return (
    <div className="flex w-full max-w-md flex-col gap-2">
      <SafetyBanner kind="degraded" message="Fallback model active — responses may be slower." />
      <SafetyBanner kind="sandbox" message="Code execution is sandboxed for this session." onDismiss={() => {}} />
      <SafetyBanner kind="filter" message="Content filter is active for this workspace." />
    </div>
  );
}
```

- [ ] **Step 6: Verify and commit**

Run: `cd apps/docs && pnpm check:tokens && pnpm typecheck && pnpm exec vitest run registry/super-ai/safety-banner.test.tsx`
Expected: all pass.

```bash
git add apps/docs/registry/super-ai/safety-banner.tsx apps/docs/registry/super-ai/safety-banner.test.tsx apps/docs/components/demos/safety-banner-demo.tsx apps/docs/lib/catalog.ts apps/docs/scripts/gen-registry.mts
git commit -m "feat(registry): safety-banner — system guardrail states (stretch)"
```

---

### Task 15 (stretch — may slip without blocking): `task-queue`

**Files:**
- Create: `apps/docs/registry/super-ai/task-queue.tsx`
- Create: `apps/docs/registry/super-ai/task-queue.test.tsx`
- Create: `apps/docs/components/demos/task-queue-demo.tsx`
- Modify: `apps/docs/lib/catalog.ts`, `apps/docs/scripts/gen-registry.mts`

- [ ] **Step 1: Write the failing test**

```tsx
// apps/docs/registry/super-ai/task-queue.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TaskQueue, type QueuedTask } from "./task-queue";

const tasks: QueuedTask[] = [
  { id: "t1", title: "Hotfix prod incident report", priority: "P0", status: "running" },
  { id: "t2", title: "Summarize standup notes", priority: "P2", status: "queued", rankDelta: -1 },
  { id: "t3", title: "Draft release notes", priority: "P1", status: "queued", rankDelta: 1, preempted: true },
];

describe("TaskQueue", () => {
  it("renders tasks in order with priority badges", () => {
    render(<TaskQueue tasks={tasks} aria-label="Agent queue" />);
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(3);
    expect(items[0]).toHaveTextContent("P0");
    expect(items[0]).toHaveAttribute("data-status", "running");
  });

  it("marks preempted tasks and rank changes", () => {
    render(<TaskQueue tasks={tasks} />);
    const preempted = screen.getByText("Draft release notes").closest("li");
    expect(preempted).toHaveAttribute("data-preempted", "true");
    expect(screen.getByLabelText("Moved down 1")).toBeInTheDocument();
    expect(screen.getByLabelText("Moved up 1")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/docs && pnpm exec vitest run registry/super-ai/task-queue.test.tsx`
Expected: FAIL — `Cannot find module './task-queue'`

- [ ] **Step 3: Write the implementation**

```tsx
// apps/docs/registry/super-ai/task-queue.tsx
"use client";

import { ArrowDown, ArrowUp, Loader2, Zap } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

type QueuePriority = "P0" | "P1" | "P2" | "P3";
type QueueStatus = "queued" | "running" | "blocked";

interface QueuedTask {
  id: string;
  title: string;
  priority: QueuePriority;
  status: QueueStatus;
  rankDelta?: number; // positive = moved up N places this re-rank, negative = moved down
  preempted?: boolean;
}

const PRIORITY_CLASS: Record<QueuePriority, string> = {
  P0: "bg-destructive/10 text-destructive",
  P1: "bg-primary/10 text-primary",
  P2: "bg-muted text-foreground",
  P3: "bg-muted text-muted-foreground",
};

interface TaskQueueProps extends React.ComponentProps<"ol"> {
  tasks: QueuedTask[];
}

function TaskQueue({ tasks, className, ...props }: TaskQueueProps) {
  return (
    <ol data-slot="task-queue" role="list" className={cn("flex flex-col gap-1", className)} {...props}>
      {tasks.map((t, i) => (
        <li
          key={t.id}
          data-slot="task-queue-item"
          data-status={t.status}
          data-preempted={t.preempted || undefined}
          className="flex items-center gap-2 rounded-md border bg-background px-2 py-1.5"
        >
          <span className="w-5 text-xs tabular-nums text-muted-foreground">{i + 1}.</span>
          <span className={cn("rounded-full px-1.5 py-0.5 text-xs font-medium", PRIORITY_CLASS[t.priority])}>
            {t.priority}
          </span>
          <span className="min-w-0 flex-1 truncate text-sm">{t.title}</span>
          {t.preempted && <Zap className="size-3.5 text-muted-foreground" aria-label="Preempted" />}
          {t.rankDelta !== undefined && t.rankDelta !== 0 && (
            <span
              aria-label={t.rankDelta > 0 ? `Moved up ${t.rankDelta}` : `Moved down ${Math.abs(t.rankDelta)}`}
              className="flex items-center text-xs tabular-nums text-muted-foreground"
            >
              {t.rankDelta > 0 ? <ArrowUp className="size-3" aria-hidden /> : <ArrowDown className="size-3" aria-hidden />}
              {Math.abs(t.rankDelta)}
            </span>
          )}
          {t.status === "running" && <Loader2 className="size-3.5 animate-spin text-primary" aria-label="Running" />}
        </li>
      ))}
    </ol>
  );
}

export { TaskQueue };
export type { QueuedTask, TaskQueueProps };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/docs && pnpm exec vitest run registry/super-ai/task-queue.test.tsx`
Expected: PASS (2 tests)

- [ ] **Step 5: Catalog entry, registry extras, demo**

Catalog entry:

```ts
{
  name: "task-queue",
  title: "Task Queue",
  description: "Prioritized agent work queue with rank-change and preemption indicators.",
  group: "Agent Kit",
  patternSlug: "operations-and-cognition",
},
```

`gen-registry.mts` extras:

```ts
"task-queue": {
  dependencies: ["lucide-react"],
},
```

Demo:

```tsx
// apps/docs/components/demos/task-queue-demo.tsx
import { TaskQueue, type QueuedTask } from "@/registry/super-ai/task-queue";

const tasks: QueuedTask[] = [
  { id: "t1", title: "Hotfix prod incident report", priority: "P0", status: "running" },
  { id: "t2", title: "Draft release notes", priority: "P1", status: "queued", rankDelta: 1, preempted: true },
  { id: "t3", title: "Summarize standup notes", priority: "P2", status: "queued", rankDelta: -1 },
  { id: "t4", title: "Refresh competitor digest", priority: "P3", status: "blocked" },
];

export default function TaskQueueDemo() {
  return <TaskQueue tasks={tasks} aria-label="Agent queue" className="w-full max-w-md" />;
}
```

- [ ] **Step 6: Verify and commit**

Run: `cd apps/docs && pnpm check:tokens && pnpm typecheck && pnpm exec vitest run registry/super-ai/task-queue.test.tsx`
Expected: all pass.

```bash
git add apps/docs/registry/super-ai/task-queue.tsx apps/docs/registry/super-ai/task-queue.test.tsx apps/docs/components/demos/task-queue-demo.tsx apps/docs/lib/catalog.ts apps/docs/scripts/gen-registry.mts
git commit -m "feat(registry): task-queue — prioritization queue with re-rank/preemption (stretch)"
```

---

## Completion checklist

- All ten registry items install via `public/r/*.json` (Task 13 Step 2/3).
- `/patterns` index + six detail pages render and appear in the sidebar.
- Parent spec table references the Agent Kit wave (Task 12).
- Full pipeline green: `pnpm lint && pnpm typecheck && pnpm test && pnpm check:tokens && pnpm build`.
- If stretch Tasks 14–15 were skipped, note it in the final report; spec marks them slippable.
