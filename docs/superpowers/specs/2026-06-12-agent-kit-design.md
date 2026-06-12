# Agent Kit — Design Specification

Status: approved (brainstorm 2026-06-12)
Parent spec: `2026-06-10-super-ai-components-design.md`

## 1. Overview

Agent Kit is a wave of Super-AI-Components that ships the UI surfaces for *agentic behavior*:
plans, goals, reflection cycles, routing decisions, guardrail refusals, agent-to-agent handoffs,
and MCP connector health. It is paired with a new **Patterns** documentation section that maps
the established agentic design patterns literature onto this registry's components.

Sources: the wave's catalog and docs are derived from two pattern books read in June 2026 —
**Antonio Gulli, *Agentic Design Patterns* (Springer 2025; 21 patterns)** and
**Mark A. Lane, *Agentic AI Handbook* (2025; ~105 patterns, 19-part template)**.
Gulli supplies the competency grouping and the demo scenario; Lane supplies the
fine-grained taxonomy cross-references (cognitive/orchestration/control/security categories).

Positioning is unchanged from the parent spec: AI Elements owns the conversation;
Super-AI-Components owns the application. Agent Kit extends that claim to the agentic layer —
AI Elements shows the agent *talking*; Agent Kit shows the agent *working*.

## 2. Goals and non-goals

Goals:

- Ship the gap-fill components that the pattern literature implies and no planned kit covers.
- Establish the Patterns docs section: six grouped pages mapping patterns → components,
  reusable as the documentation spine for all later waves.
- Demonstrate composition with an `agent-console` block replaying a scripted multi-agent run.

Non-goals (inherits parent spec §12, plus):

- No agent runtime, orchestration logic, or LLM calls — components render data and emit
  callbacks; the host owns the loop. Components are *surfaces for* patterns, not
  implementations of them.
- No duplication of AI Elements' in-chat `reasoning`, `tool`, or `task` components, and no
  duplication of already-planned kit items (`review-queue`, `approval-card`, `trace-timeline`,
  `run-inspector`, `memory-viewer`, `agent-board`, `eval-board`, RAG kit, monetization kit).
- No new visual language — existing tokens, primitives, and API conventions only.
- Pattern pages document UX guidance, not book summaries; no reproduction of book content
  beyond brief cited definitions.

## 3. Catalog

Eight core components, two stretch (`*` may slip to a cleanup wave without blocking).
All follow parent-spec conventions: UI only, callbacks out, controlled-first with
uncontrolled fallbacks, shadcn CSS variables only.

| Name | Pattern(s) | One-liner |
| --- | --- | --- |
| `plan-timeline` | Planning; Prompt Chaining | Multi-step plan: per-step status (pending/running/done/failed/skipped/needs-approval), collapsible substeps, optional per-step duration + cost. Application-side surface — richer than AI Elements' in-chat `task` list. |
| `plan-approval` | Planning; Human-in-the-Loop | Pre-execution gate: proposed steps as an editable list (remove/reorder/annotate), approve / reject-with-reason verbs. Complements `approval-card` (per-artifact, post-hoc) by gating *before* execution. |
| `goal-card` | Goal Setting & Monitoring | Declared goal, success criteria checklist, monitor state (on-track / at-risk / stalled), elapsed/budget meters, stop control. |
| `critique-panel` | Reflection; Self-Correction | Producer/critic cycle: draft ↔ critique ↔ revision panes, iteration counter, verdict chip (e.g. approved / needs-work), accept / iterate verbs. |
| `decision-trace` | Routing | Compact breadcrumb of routing decisions; each node expands to chosen route + rejected alternatives with confidence and rationale. |
| `refusal-card` | Guardrails / Safety | Structured refusal: what was blocked, policy/guardrail that fired, optional redacted preview, escalate / override-request affordances. |
| `handoff-indicator` | Multi-Agent Collaboration; A2A | Agent→agent handoff chip and stackable sequence: from/to identity, reason, payload summary, timestamp. |
| `connector-status` | MCP; Tool Use | Connector/MCP-server health chip + expandable detail: connected / auth-needed / error, tool count, last-seen latency. |
| `safety-banner` * | Guardrails; Exception Handling | System-level state banner: degraded mode, sandboxed execution, content-filter active. Complements `rate-limit-banner` (quota) with policy/health states. |
| `task-queue` * | Prioritization | Ranked work queue: priority badges, re-rank indicators, preemption marker, per-item status. |

Shared states across the kit (documented per component, tested in vitest):
empty, streaming/in-progress, error, needs-approval, and done. Components accept
data via props; no fetching, no polling, no timers beyond CSS animation.

### Block: `agent-console`

One composed surface — "watch the agent work": `goal-card` header, `plan-timeline` spine,
inline `decision-trace` and `handoff-indicator` entries, `plan-approval`/`refusal-card`
interrupts, and a usage strip (`cost-chip`, existing primitive). Registry block, same
mechanics as `app-shell`/`generation-panel` blocks in the parent spec.

### Shared types

`agent-types` module inside the kit (mirrors Flow Kit's shared node types):
`PlanStep`, `RouteDecision`, `HandoffEvent`, `GuardrailEvent`, `GoalStatus`,
`ConnectorState`. Exported for hosts; every kit component types its props from these.
No runtime code beyond type guards.

## 4. Patterns documentation section

New top-level docs group **Patterns** in `apps/docs` with six pages, grouped per Gulli's
competency framing and cross-referenced to Lane's categories:

| Page | Patterns covered | Mapped components (this kit **bold**) |
| --- | --- | --- |
| Execution & Decomposition | Prompt Chaining, Routing, Parallelization, Planning | **plan-timeline**, **plan-approval**, **decision-trace**, trace-timeline |
| The External World | Tool Use, Knowledge Retrieval (RAG), MCP | **connector-status**, RAG kit, AI Elements `tool` |
| State & Self-Improvement | Memory, Reflection, Learning & Adaptation | memory-viewer, **critique-panel**, feedback |
| Collaboration | Multi-Agent, Inter-Agent Communication (A2A) | agent-board, **handoff-indicator** |
| Human Oversight & Reliability | Human-in-the-Loop, Goal Setting, Exception Handling, Guardrails | review-queue, approval-card, **goal-card**, **refusal-card**, **safety-banner*** |
| Operations & Cognition | Resource-Aware Optimization, Evaluation & Monitoring, Prioritization, Reasoning Techniques | cost-chip, quota-meter, usage-dashboard, eval-board, **task-queue***, AI Elements `reasoning` |

Fixed page template (writing stays bounded; each page ≤ ~1,200 words):

1. Pattern definitions — 2–3 sentences each, cited to Gulli chapter + Lane category.
2. UX implications — what the user must be able to see/do when this pattern runs.
3. Component mapping table — ours, planned, and AI Elements items, with "when to use".
4. States checklist — streaming / error / needs-approval coverage expectations.
5. Do / don't — 3–5 concrete pairs.

Pages link both directions: each component doc gains a "Pattern background" link to its page.
Pages are written to be blog-extractable, but blog posts are not a deliverable of this wave.

## 5. Demo

Scripted replay of Gulli's capstone scenario (research assistant): Planner agent decomposes
"Analyze the impact of quantum computing on the cybersecurity landscape" → Researcher gathers
via tools → Writer drafts → Critic reflects → revision → done. Rendered entirely from registry
components inside `agent-console`, driven by a static event script (no LLM calls), with one
`plan-approval` interrupt and one `refusal-card` event to exercise oversight states.
Ships as a docs-site page like the Flow Kit demos.

## 6. Testing

- Vitest behavior tests per component (state transitions, callback firing, a11y roles/labels).
- One composed test driving `agent-console` through the full demo event script.
- `check:tokens` token-contract lint passes; `consumer-test.sh` installs the kit into a fresh app.

## 7. Sequencing

Priority agreed at brainstorm: **next new wave after Wave 1 (App Shell), ahead of the
remaining Flow Kit waves (presets/canvas chrome)**. Note: plan documents
`2026-06-11-wave-2-flow-foundation.md` / `2026-06-11-wave-3-flow-presets.md` already exist
and keep their numbering; the parent spec's wave table gets a one-line amendment when this
wave's implementation plan is written, and the exact slot is confirmed against in-flight
work at that point. This spec does not renumber anything.

## 8. Risks

| Risk | Mitigation |
| --- | --- |
| Overlap with AI Elements (`task`, `reasoning`, `tool`) | Positioning table on every pattern page; compose-don't-fork is already a parent-spec non-goal. `plan-timeline` is justified only by its application-side scope (approvals, cost, substeps); revisit if AI Elements grows equivalents. |
| Docs scope creep | Six pages, fixed template, hard word cap. |
| Over-claiming (UI ≠ pattern implementation) | Standing line on every page: components are surfaces for patterns; the host owns the loop. |
| Pattern fidelity drift between books and UX advice | Definitions are cited and kept to 2–3 sentences; UX guidance is ours, clearly separated from the citations. |
