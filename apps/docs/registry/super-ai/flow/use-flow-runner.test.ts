import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useFlowRunner, type NodeOutput, type RunnerNode } from "./use-flow-runner";

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
        // Annotate the generic: a bare `new Promise` that only ever rejects infers
        // `Promise<unknown>`, which would not satisfy `execute`'s `Promise<NodeOutput>`.
        new Promise<NodeOutput>((resolve, reject) => {
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
  it("stop() mid-chain resets queued downstream to idle and discards the late result", async () => {
    let resolveA!: (v: NodeOutput) => void;
    const execute = vi.fn(
      () =>
        new Promise<NodeOutput>((resolve) => {
          resolveA = resolve; // slow executor: only settles when the test says so
        }),
    );
    const statuses: Array<[string, string]> = [];
    const hook = renderHook(() =>
      useFlowRunner({
        nodes: [node("a"), node("b"), node("c")],
        edges: [edge("a", "b"), edge("b", "c")],
        execute,
        onStatus: (id, s) => statuses.push([id, s]),
      }),
    );
    act(() => {
      void hook.result.current.run();
    });
    await waitFor(() => expect(execute).toHaveBeenCalledTimes(1)); // "a" is in flight
    act(() => hook.result.current.stop());
    await act(async () => resolveA({ url: "late-a" })); // resolves only after the abort
    await waitFor(() => {
      expect(hook.result.current.statuses).toEqual({ a: "idle", b: "idle", c: "idle" });
    });
    // The late result was discarded: no done status, no committed output, b/c never executed.
    expect(statuses).not.toContainEqual(["a", "done"]);
    expect(hook.result.current.outputs.a).toBeUndefined();
    expect(execute).toHaveBeenCalledTimes(1);
  });
  it("re-runs downstream when upstream output content changes; identical content stays cached", async () => {
    let aContent = "v1";
    const ran: string[] = [];
    const execute = vi.fn(async (n: RunnerNode, inputs: Record<string, NodeOutput>) => {
      ran.push(n.id);
      if (n.id === "a") return { content: aContent };
      return { content: `${n.id}(${String(Object.values(inputs)[0]?.content ?? "")})` };
    });
    const hook = renderHook(() =>
      useFlowRunner({
        nodes: [node("a"), node("b"), node("c")],
        edges: [edge("a", "b"), edge("b", "c")],
        execute,
        onStatus: () => {},
      }),
    );
    await act(() => hook.result.current.run());
    expect(ran).toEqual(["a", "b", "c"]);
    // "a" now produces different content: downstream cache keys change, b (and c) re-run.
    aContent = "v2";
    ran.length = 0;
    await act(() => hook.result.current.runNode("a"));
    await act(() => hook.result.current.run());
    expect(ran).toEqual(["a", "b", "c"]);
    // Negative control: re-running "a" with identical content keeps b/c cached.
    ran.length = 0;
    await act(() => hook.result.current.runNode("a"));
    await act(() => hook.result.current.run());
    expect(ran).toEqual(["a"]);
  });
  it("runSelection runs exactly the selected ids and feeds intra-selection inputs", async () => {
    const { hook, order, execute, statuses } = setup();
    await act(() => hook.result.current.runSelection(["a", "b"]));
    expect(order).toEqual(["a", "b"]);
    const callForB = execute.mock.calls.find(([n]) => n.id === "b")!;
    expect(callForB[1]).toEqual({ a: { url: "out-a" } });
    // "c" is untouched: no status events, no output.
    expect(statuses.find(([id]) => id === "c")).toBeUndefined();
    expect(hook.result.current.outputs.c).toBeUndefined();
  });
});
