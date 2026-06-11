// apps/docs/registry/super-ai/flow/flow-types.test.ts
import { describe, expect, it } from "vitest";
import {
  FLOW_STATUSES,
  getHandleType,
  handleId,
  isValidFlowConnection,
  parseHandleId,
  registerHandleType,
  type FlowStatus,
} from "./flow-types";

describe("handle type registry", () => {
  it("ships the four built-in types", () => {
    for (const t of ["text", "image", "video", "audio"]) expect(getHandleType(t)?.cssVar).toBe(`--flow-${t}`);
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
