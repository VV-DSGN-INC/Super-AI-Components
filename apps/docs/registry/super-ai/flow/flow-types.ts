// apps/docs/registry/super-ai/flow/flow-types.ts
// Flow Kit shared contracts: handle-type registry, statuses, id codec.
// Status vocabulary is the master state contract — do not add states here.

export const FLOW_STATUSES = ["idle", "queued", "streaming", "done", "failed", "locked"] as const;
export type FlowStatus = (typeof FLOW_STATUSES)[number];

export interface HandleTypeDef {
  label: string;
  /** CSS custom property carrying the type color; defined in flow-tokens.css */
  cssVar: `--flow-${string}`;
}

const registry = new Map<string, HandleTypeDef>(
  (["text", "image", "video", "audio"] as const).map((k) => [
    k,
    { label: k[0].toUpperCase() + k.slice(1), cssVar: `--flow-${k}` },
  ]),
);

export function registerHandleType(key: string, def: Partial<HandleTypeDef> & { label: string }) {
  registry.set(key, { label: def.label, cssVar: def.cssVar ?? `--flow-${key}` });
}
export const getHandleType = (key: string) => registry.get(key);
export const handleTypeKeys = () => [...registry.keys()];

/** Handle id codec: `{nodeId}:{dataType}:{in|out}` (Flow Builder pattern, direction added). */
export function handleId(nodeId: string, dataType: string, dir: "in" | "out") {
  return `${nodeId}:${dataType}:${dir}`;
}
export function parseHandleId(id: string | null | undefined) {
  if (!id) return null;
  const [nodeId, dataType, dir] = id.split(":");
  if (!nodeId || !dataType || (dir !== "in" && dir !== "out")) return null;
  return { nodeId, dataType, dir } as const;
}
export function isValidFlowConnection(c: { sourceHandle?: string | null; targetHandle?: string | null }) {
  const s = parseHandleId(c.sourceHandle);
  const t = parseHandleId(c.targetHandle);
  return !!s && !!t && s.dataType === t.dataType;
}

export type NodeSize = "sm" | "md" | "lg";
export const NODE_WIDTH: Record<NodeSize, number> = { sm: 280, md: 320, lg: 420 };
