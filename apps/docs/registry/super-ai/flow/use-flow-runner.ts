"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FlowStatus } from "./flow-types";

export interface RunnerNode {
  id: string;
  /** Node configuration. Must be JSON-serializable — it is content-hashed into the cache key. */
  data: Record<string, unknown>;
}
export interface RunnerEdge {
  id: string;
  source: string;
  target: string;
  /** Carried for @xyflow edge parity; unused until multi-input handle matching lands (wave 3). */
  sourceHandle?: string | null;
  /** Carried for @xyflow edge parity; unused until multi-input handle matching lands (wave 3). */
  targetHandle?: string | null;
}
/**
 * A node's resolved output. Must be JSON-serializable — outputs are content-hashed
 * (stable-stringified) into downstream cache keys, so functions, class instances, or
 * cyclic values break cache identity.
 */
export type NodeOutput = Record<string, unknown>;

export interface UseFlowRunnerOptions {
  nodes: RunnerNode[];
  edges: RunnerEdge[];
  /**
   * Produce the node's output from its upstream inputs. Executors SHOULD honor `signal`
   * (abort work promptly); results that settle after an abort are discarded either way.
   * The resolved value must be JSON-serializable — it participates in downstream cache keys.
   */
  execute: (node: RunnerNode, inputs: Record<string, NodeOutput>, signal: AbortSignal) => Promise<NodeOutput>;
  onStatus?: (nodeId: string, status: FlowStatus) => void;
}

function topoOrder(nodes: RunnerNode[], edges: RunnerEdge[]): string[] {
  const indeg = new Map(nodes.map((n) => [n.id, 0]));
  for (const e of edges) indeg.set(e.target, (indeg.get(e.target) ?? 0) + 1);
  const queue = nodes.filter((n) => !indeg.get(n.id)).map((n) => n.id);
  const out: string[] = [];
  while (queue.length) {
    const id = queue.shift()!;
    out.push(id);
    for (const e of edges)
      if (e.source === id) {
        const d = indeg.get(e.target)! - 1;
        indeg.set(e.target, d);
        if (d === 0) queue.push(e.target);
      }
  }
  return out;
}
const downstreamOf = (ids: string[], edges: RunnerEdge[]) => {
  const seen = new Set(ids);
  let grew = true;
  while (grew) {
    grew = false;
    for (const e of edges)
      if (seen.has(e.source) && !seen.has(e.target)) {
        seen.add(e.target);
        grew = true;
      }
  }
  return seen;
};
/** Deterministic JSON: object keys sorted recursively, arrays in order, primitives as-is. */
function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value) ?? "undefined";
  if (Array.isArray(value)) return `[${value.map((v) => stableStringify(v)).join(",")}]`;
  const obj = value as Record<string, unknown>;
  const body = Object.keys(obj)
    .sort()
    .map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`)
    .join(",");
  return `{${body}}`;
}
/** Content-hash cache identity: node config plus the *content* of its upstream outputs. */
const cacheKey = (node: RunnerNode, upstreamOutputs: unknown[]) =>
  stableStringify([node.data, upstreamOutputs]);
/** Drop record keys not present in `keep`; returns `rec` unchanged when nothing is stale. */
function pruneTo<T>(rec: Record<string, T>, keep: Set<string>): Record<string, T> {
  const stale = Object.keys(rec).filter((k) => !keep.has(k));
  if (!stale.length) return rec;
  const next = { ...rec };
  for (const k of stale) delete next[k];
  return next;
}

/**
 * Headless topological flow executor with a content-hash cache.
 *
 * - **Run snapshot**: each run captures `nodes`/`edges` at call time; graph edits made
 *   mid-run are ignored until the next run (which also prunes state for removed nodes).
 * - **Last run wins**: starting any run aborts the in-flight one; the newest run owns
 *   node statuses, and late results from a superseded run are discarded.
 * - **Cache**: a node re-executes only when its content-hash key — `node.data` plus the
 *   content of its upstream outputs (stable-stringified) — changes, or it was marked
 *   dirty. Clean hits report `done` without calling `execute`, so re-running an upstream
 *   node that produces *identical* content leaves downstream nodes cached, while changed
 *   content re-runs exactly the affected chain.
 * - **Dirty tracking**: `markDirty(id)` dirties `id` *and* everything downstream of it,
 *   forcing those nodes to re-execute on the next run.
 * - **Failure isolation**: a node failure marks it `failed` and halts only its own
 *   downstream branch (skipped nodes report `idle`); independent branches finish.
 * - **Cycles**: nodes on a dependency cycle never reach the executor — every run marks
 *   them `failed` with a "Cycle detected" error and excludes them; the acyclic remainder
 *   runs normally.
 * - **Scoped runs** (`runNode`/`runFrom`/`runSelection`): only in-scope nodes execute and
 *   only their errors are cleared at run start; out-of-scope statuses, errors, and
 *   outputs are left as-is (a full `run()` clears all errors).
 * - **Inputs**: `inputs` holds one key per upstream edge source that has an output;
 *   sources that have not produced one (out of scope and uncached, or never run) are
 *   simply absent — executors cannot distinguish "no upstream" from "not yet run". This
 *   is intentional: executors should treat missing keys as "input unavailable".
 * - **Cancellation**: `stop()` aborts in-flight `execute` calls via the shared
 *   `AbortController`; starting a new run aborts the previous one the same way. Nodes
 *   still waiting in the queue are reset to `idle`.
 */
export function useFlowRunner({ nodes, edges, execute, onStatus }: UseFlowRunnerOptions) {
  const cache = useRef(new Map<string, { key: string; output: NodeOutput }>());
  const dirty = useRef(new Set<string>());
  const controller = useRef<AbortController | null>(null);
  const [statuses, setStatuses] = useState<Record<string, FlowStatus>>({});
  const [errors, setErrors] = useState<Record<string, Error>>({});
  const [outputs, setOutputs] = useState<Record<string, NodeOutput>>({});

  useEffect(() => () => controller.current?.abort(), []);

  const setStatus = useCallback(
    (id: string, s: FlowStatus) => {
      setStatuses((prev) => ({ ...prev, [id]: s }));
      onStatus?.(id, s);
    },
    [onStatus],
  );

  const runScope = useCallback(
    async (scope: Set<string> | null) => {
      controller.current?.abort();
      const ctl = new AbortController();
      controller.current = ctl;

      // Prune bookkeeping for nodes that left the graph since the last run.
      const present = new Set(nodes.map((n) => n.id));
      for (const id of [...cache.current.keys()]) if (!present.has(id)) cache.current.delete(id);
      for (const id of [...dirty.current]) if (!present.has(id)) dirty.current.delete(id);
      setStatuses((prev) => pruneTo(prev, present));
      setOutputs((prev) => pruneTo(prev, present));
      // Clear errors for the ids this run covers (full runs clear all); drop stale ids too.
      setErrors((prev) => {
        if (!scope) return {};
        const next: Record<string, Error> = {};
        for (const [id, err] of Object.entries(prev)) if (present.has(id) && !scope.has(id)) next[id] = err;
        return next;
      });

      // Cycle detection: nodes that never reach indegree 0 are on (or behind) a cycle.
      // They are excluded from the run and reported failed; the acyclic rest proceeds.
      const fullOrder = topoOrder(nodes, edges);
      const ordered = new Set(fullOrder);
      const cyclic = nodes.filter((n) => !ordered.has(n.id));
      if (cyclic.length) {
        setErrors((prev) => {
          const next = { ...prev };
          for (const n of cyclic)
            next[n.id] = new Error("Cycle detected — node is part of a dependency cycle");
          return next;
        });
        for (const n of cyclic) setStatus(n.id, "failed");
      }

      const order = fullOrder.filter((id) => !scope || scope.has(id));
      const failedBranch = new Set<string>();
      const runOutputs = new Map<string, NodeOutput>(
        [...cache.current.entries()].map(([id, v]) => [id, v.output]),
      );

      // Pre-mark pending work as queued. Clean-cached candidates skip the queued flash and
      // simply flip to done (cache hit) or streaming (key miss) at their turn.
      const queuedPending = new Set<string>();
      for (const id of order) {
        if (cache.current.has(id) && !dirty.current.has(id)) continue;
        setStatus(id, "queued");
        queuedPending.add(id);
      }

      for (const id of order) {
        if (ctl.signal.aborted) break;
        if (failedBranch.has(id)) {
          queuedPending.delete(id);
          setStatus(id, "idle");
          continue;
        }
        const node = nodes.find((n) => n.id === id);
        if (!node) continue; // dangling edge target — no such node; the sweep below resets it
        queuedPending.delete(id);
        const upstream = edges.filter((e) => e.target === id);
        const inputs: Record<string, NodeOutput> = {};
        for (const e of upstream) {
          const out = runOutputs.get(e.source);
          if (out) inputs[e.source] = out;
        }
        const key = cacheKey(
          node,
          upstream.map((e) => runOutputs.get(e.source) ?? e.source),
        );
        const cached = cache.current.get(id);
        if (cached && cached.key === key && !dirty.current.has(id)) {
          runOutputs.set(id, cached.output);
          setStatus(id, "done");
          continue;
        }
        setStatus(id, "streaming");
        try {
          const output = await execute(node, inputs, ctl.signal);
          if (ctl.signal.aborted) {
            // Superseded or stopped while awaiting — discard the late result, commit nothing.
            setStatus(id, "idle");
            break;
          }
          cache.current.set(id, { key, output });
          dirty.current.delete(id);
          runOutputs.set(id, output);
          setOutputs((prev) => ({ ...prev, [id]: output }));
          setStatus(id, "done");
        } catch (err) {
          if (ctl.signal.aborted) {
            setStatus(id, "idle");
            break;
          }
          setErrors((prev) => ({ ...prev, [id]: err as Error }));
          setStatus(id, "failed");
          for (const d of downstreamOf([id], edges)) if (d !== id) failedBranch.add(d);
        }
      }

      // Sweep: an abort (or a dangling id) can leave pre-marked nodes stuck "queued" — reset them.
      for (const id of queuedPending) setStatus(id, "idle");
    },
    [nodes, edges, execute, setStatus],
  );

  const markDirty = useCallback(
    (id: string) => {
      for (const d of downstreamOf([id], edges)) dirty.current.add(d);
    },
    [edges],
  );

  const run = useCallback(() => runScope(null), [runScope]);
  const runNode = useCallback(
    (id: string) => {
      dirty.current.add(id);
      return runScope(new Set([id]));
    },
    [runScope],
  );
  const runFrom = useCallback(
    (id: string) => {
      markDirty(id);
      return runScope(downstreamOf([id], edges));
    },
    [edges, markDirty, runScope],
  );
  const runSelection = useCallback(
    (ids: string[]) => {
      for (const i of ids) dirty.current.add(i);
      return runScope(new Set(ids));
    },
    [runScope],
  );
  const stop = useCallback(() => controller.current?.abort(), []);
  /** Abort any in-flight run and clear all runner state — cache, dirty marks, statuses, errors, outputs. */
  const reset = useCallback(() => {
    controller.current?.abort();
    cache.current.clear();
    dirty.current.clear();
    setStatuses({});
    setErrors({});
    setOutputs({});
  }, []);

  return useMemo(
    () => ({ statuses, errors, outputs, run, runNode, runFrom, runSelection, stop, markDirty, reset }),
    [statuses, errors, outputs, run, runNode, runFrom, runSelection, stop, markDirty, reset],
  );
}
