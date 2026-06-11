import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useFlowRunner, type RunnerNode } from "./use-flow-runner";

const node = (id: string, data: Record<string, unknown> = {}): RunnerNode => ({ id, data });
const edge = (s: string, t: string) => ({ id: `${s}-${t}`, source: s, target: t });

function setup(opts?: Partial<Parameters<typeof useFlowRunner>[0]>) {
  const order: string[] = [];
  // Full 3-param signature (type-only; params unused) so `mock.calls` tuples
  // carry the inputs slot asserted via `callForC[1]` — vi.fn would otherwise
  // infer arity 1 and reject the index at typecheck.
  const execute = vi.fn(async (n: RunnerNode, _inputs: Record<string, unknown>, _signal: AbortSignal) => {
    order.push(n.id);
    return { url: `out-${n.id}` };
  });
  const statuses: Array<[string, string]> = [];
  const hook = renderHook(() =>
    useFlowRunner({
      nodes: [node("a"), node("b"), node("c")],
      edges: [edge("a", "b"), edge("b", "c")],
      execute,
      onStatus: (id, s) => statuses.push([id, s]),
      ...opts,
    }),
  );
  return { hook, order, execute, statuses };
}

describe("useFlowRunner", () => {
  it("runs in topological order and reports contract statuses", async () => {
    const { hook, order, statuses } = setup();
    await act(() => hook.result.current.run());
    expect(order).toEqual(["a", "b", "c"]);
    expect(statuses.filter(([id]) => id === "b").map(([, s]) => s)).toEqual(["queued", "streaming", "done"]);
  });
  it("caches clean nodes; re-run only executes dirtied + downstream", async () => {
    const { hook, order, execute } = setup();
    await act(() => hook.result.current.run());
    execute.mockClear();
    order.length = 0;
    act(() => hook.result.current.markDirty("b"));
    await act(() => hook.result.current.run());
    expect(order).toEqual(["b", "c"]);
    expect(execute).toHaveBeenCalledTimes(2);
  });
  it("feeds upstream outputs as inputs", async () => {
    const { hook, execute } = setup();
    await act(() => hook.result.current.run());
    const callForC = execute.mock.calls.find(([n]) => n.id === "c")!;
    expect(callForC[1]).toEqual({ b: { url: "out-b" } });
  });
  it("branch-local failure: independent branches still finish", async () => {
    const execute = vi.fn(async (n: RunnerNode) => {
      if (n.id === "b") throw new Error("boom");
      return { url: n.id };
    });
    const statuses: Array<[string, string]> = [];
    const hook = renderHook(() =>
      useFlowRunner({
        nodes: [node("a"), node("b"), node("c"), node("x")],
        edges: [edge("a", "b"), edge("b", "c")],
        execute,
        onStatus: (id, s) => statuses.push([id, s]),
      }),
    );
    await act(() => hook.result.current.run());
    expect(statuses).toContainEqual(["b", "failed"]);
    expect(statuses).not.toContainEqual(["c", "streaming"]);
    expect(statuses).toContainEqual(["x", "done"]);
    expect(hook.result.current.errors.b?.message).toBe("boom");
  });
  it("stop() aborts in-flight executes", async () => {
    let abortSeen = false;
    const execute = vi.fn(
      (n: RunnerNode, _i: unknown, signal: AbortSignal) =>
        new Promise((resolve, reject) => {
          signal.addEventListener("abort", () => {
            abortSeen = true;
            reject(new DOMException("aborted", "AbortError"));
          });
        }),
    );
    const hook = renderHook(() =>
      useFlowRunner({ nodes: [node("a")], edges: [], execute, onStatus: () => {} }),
    );
    act(() => {
      void hook.result.current.run();
    });
    await waitFor(() => expect(execute).toHaveBeenCalled());
    act(() => hook.result.current.stop());
    await waitFor(() => expect(abortSeen).toBe(true));
  });
  it("runFrom(id) dirties id + downstream then runs", async () => {
    const { hook, order } = setup();
    await act(() => hook.result.current.run());
    order.length = 0;
    await act(() => hook.result.current.runFrom("b"));
    expect(order).toEqual(["b", "c"]);
  });
});
