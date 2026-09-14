// apps/docs/registry/super-ai/flow/flow-types.test.ts
import { describe, expect, it, vi } from "vitest";
import { FLOW_CSS_VARS } from "@/lib/flow-tokens";
import {
  FLOW_HANDLE_TYPES,
  FLOW_STATUSES,
  getHandleType,
  handleId,
  isValidFlowConnection,
  parseHandleId,
  registerHandleType,
  type FlowStatus,
} from "@/registry/super-ai/flow-types";

describe("handle type registry", () => {
  it("ships the ten built-in types, each with a --flow-* token", () => {
    expect(FLOW_HANDLE_TYPES).toEqual([
      "text",
      "image",
      "video",
      "audio",
      "speech",
      "sound",
      "3d",
      "avatar",
      "start-frame",
      "end-frame",
    ]);
    for (const t of FLOW_HANDLE_TYPES) expect(getHandleType(t)?.cssVar).toBe(`--flow-${t}`);
    expect(getHandleType("3d")?.label).toBe("3D");
    expect(getHandleType("start-frame")?.label).toBe("Start frame");
  });
  it("every built-in type has a light token in lib/flow-tokens.ts", () => {
    for (const t of FLOW_HANDLE_TYPES) expect(FLOW_CSS_VARS.light).toHaveProperty(`flow-${t}`);
  });
  it("accepts a key that starts with a digit (3d) without warning", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    registerHandleType("3d", { label: "3D" });
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });
  it("registers custom types", () => {
    registerHandleType("style", { label: "Style" });
    expect(getHandleType("style")?.cssVar).toBe("--flow-style");
  });
  it("encodes and validates same-type connections from handle ids", () => {
    const a = handleId("node1", "image", "out");
    const b = handleId("node2", "image", "in");
    const c = handleId("node3", "audio", "in");
    expect(isValidFlowConnection({ sourceHandle: a, targetHandle: b })).toBe(true);
    expect(isValidFlowConnection({ sourceHandle: a, targetHandle: c })).toBe(false);
    expect(isValidFlowConnection({ sourceHandle: null, targetHandle: b })).toBe(false);
  });
  it("exposes the contract statuses", () => {
    const all: FlowStatus[] = ["idle", "queued", "streaming", "done", "failed", "locked"];
    expect(FLOW_STATUSES).toEqual(all);
  });
  it("rejects malformed and trailing-segment ids", () => {
    expect(parseHandleId("garbage")).toBeNull();
    expect(parseHandleId("a:b:in:extra")).toBeNull();
    expect(parseHandleId(null)).toBeNull();
  });
  it("round-trips node ids containing colons", () => {
    const id = handleId("group:1", "image", "out");
    expect(parseHandleId(id)).toEqual({ nodeId: "group:1", dataType: "image", dir: "out" });
  });
  it("validates direction: only out→in connects", () => {
    const out = handleId("n1", "image", "out");
    const inn = handleId("n2", "image", "in");
    expect(isValidFlowConnection({ sourceHandle: out, targetHandle: inn })).toBe(true);
    expect(isValidFlowConnection({ sourceHandle: out, targetHandle: out })).toBe(false);
    expect(isValidFlowConnection({ sourceHandle: inn, targetHandle: inn })).toBe(false);
  });
});
