"use client";
import { useCallback, useRef, useState } from "react";
import type { FlowStatus } from "./flow-types";

export interface RunnerNode {
  id: string;
  data: Record<string, unknown>;
}
export interface RunnerEdge {
  id: string;
  source: string;
  target: string;
}
export type NodeOutput = Record<string, unknown>;

export interface UseFlowRunnerOptions {
  nodes: RunnerNode[];
  edges: RunnerEdge[];
  /**
   * Produce the node's output. The resolved value is stored as the node's
   * `NodeOutput`. Typed as `Promise<unknown>` (not `Promise<NodeOutput>`) so
   * executors whose promises infer loosely — e.g. a bare `new Promise(...)`
   * that only ever rejects — remain assignable.
   */
  execute: (node: RunnerNode, inputs: Record<string, NodeOutput>, signal: AbortSignal) => Promise<unknown>;
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
const cacheKey = (node: RunnerNode, upstreamOutputIds: string[]) =>
  JSON.stringify([node.data, upstreamOutputIds]);

/**
 * Headless topological flow executor with a dirty-tracking cache.
 *
 * - **Cache**: each node's result is memoized under a key derived from `node.data`
 *   plus the identity of its upstream outputs. Clean cache hits report `done`
 *   without calling `execute` again.
 * - **Dirty tracking**: `markDirty(id)` dirties `id` *and* everything downstream
 *   of it, forcing those nodes to re-execute on the next run.
 * - **Failure isolation**: a node failure marks it `failed` and halts only its own
 *   downstream branch (skipped nodes report `idle`); independent branches finish.
 * - **Cancellation**: `stop()` aborts in-flight `execute` calls via the shared
 *   `AbortController`; starting a new run aborts the previous one the same way.
 */
export function useFlowRunner({ nodes, edges, execute, onStatus }: UseFlowRunnerOptions) {
  const cache = useRef(new Map<string, { key: string; output: NodeOutput }>());
  const dirty = useRef(new Set<string>());
  const controller = useRef<AbortController | null>(null);
  const [statuses, setStatuses] = useState<Record<string, FlowStatus>>({});
  const [errors, setErrors] = useState<Record<string, Error>>({});
  const [outputs, setOutputs] = useState<Record<string, NodeOutput>>({});

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
      setErrors({});
      const order = topoOrder(nodes, edges).filter((id) => !scope || scope.has(id));
      const failedBranch = new Set<string>();
      const runOutputs = new Map<string, NodeOutput>(
        [...cache.current.entries()].map(([id, v]) => [id, v.output]),
      );
      for (const id of order) if (!failedBranch.has(id)) setStatus(id, "queued");
      for (const id of order) {
        if (ctl.signal.aborted) break;
        if (failedBranch.has(id)) {
          setStatus(id, "idle");
          continue;
        }
        const node = nodes.find((n) => n.id === id)!;
        const upstream = edges.filter((e) => e.target === id);
        const inputs: Record<string, NodeOutput> = {};
        for (const e of upstream) {
          const out = runOutputs.get(e.source);
          if (out) inputs[e.source] = out;
        }
        const key = cacheKey(
          node,
          upstream.map((e) => String(runOutputs.get(e.source)?.url ?? e.source)),
        );
        const cached = cache.current.get(id);
        if (cached && cached.key === key && !dirty.current.has(id)) {
          runOutputs.set(id, cached.output);
          setStatus(id, "done");
          continue;
        }
        setStatus(id, "streaming");
        try {
          const output = (await execute(node, inputs, ctl.signal)) as NodeOutput;
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
    },
    [nodes, edges, execute, setStatus],
  );

  const markDirty = useCallback(
    (id: string) => {
      for (const d of downstreamOf([id], edges)) dirty.current.add(d);
    },
    [edges],
  );

  return {
    statuses,
    errors,
    outputs,
    run: () => runScope(null),
    runNode: (id: string) => {
      dirty.current.add(id);
      return runScope(new Set([id]));
    },
    runFrom: (id: string) => {
      markDirty(id);
      return runScope(downstreamOf([id], edges));
    },
    runSelection: (ids: string[]) => {
      ids.forEach((i) => dirty.current.add(i));
      return runScope(new Set(ids));
    },
    stop: () => controller.current?.abort(),
    markDirty,
  };
}
