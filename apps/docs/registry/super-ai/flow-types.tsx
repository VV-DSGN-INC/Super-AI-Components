// Family G shared contracts: status vocabulary, handle-type registry, handle-id
// codec, node sizes. Ships as a registry:lib (lib/flow-types) so every flow
// component reaches one copy through `consumes`.
//
// Status vocabulary is the master state contract; no component adds a state.

export const FLOW_STATUSES = ["idle", "queued", "streaming", "done", "failed", "locked"] as const;
export type FlowStatus = (typeof FLOW_STATUSES)[number];

export interface HandleTypeDef {
  label: string;
  /** CSS custom property carrying the type colour; shipped as registry cssVars (lib/flow-tokens.ts). */
  cssVar: `--flow-${string}`;
}

/**
 * The ten built-in data types (spec, Contracts). Grouping: neutral for text,
 * blue for visual media, purple for anything audible, tan for identity and
 * geometry. The colours live in the token scale, never here.
 */
export const FLOW_HANDLE_TYPES = [
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
] as const;
export type HandleTypeKey = (typeof FLOW_HANDLE_TYPES)[number];

const BUILT_IN_LABELS: Record<HandleTypeKey, string> = {
  text: "Text",
  image: "Image",
  video: "Video",
  audio: "Audio",
  speech: "Speech",
  sound: "Sound",
  "3d": "3D",
  avatar: "Avatar",
  "start-frame": "Start frame",
  "end-frame": "End frame",
};

const registry = new Map<string, HandleTypeDef>(
  FLOW_HANDLE_TYPES.map((k) => [k, { label: BUILT_IN_LABELS[k], cssVar: `--flow-${k}` }]),
);

/**
 * Register a custom handle type.
 *
 * `key` must match `/^[a-z0-9][a-z0-9-]*$/`:
 *   - No colons; they would break the handle-id codec (`{nodeId}:{dataType}:{dir}`).
 *   - No spaces; they would break the CSS custom-property name (`--flow-{key}`).
 *   - A leading digit is fine (`3d` is built in): custom-property names may start with one.
 *
 * Call at module scope (not inside a React effect) so server and client render identically.
 * Re-registering an existing key overwrites its definition.
 */
export function registerHandleType(key: string, def: Partial<HandleTypeDef> & { label: string }) {
  if (process.env.NODE_ENV !== "production" && !/^[a-z0-9][a-z0-9-]*$/.test(key)) {
    console.warn(`registerHandleType: invalid key "${key}", use lowercase letters, digits, hyphens`);
  }
  registry.set(key, { label: def.label, cssVar: def.cssVar ?? `--flow-${key}` });
}
export const getHandleType = (key: string) => registry.get(key);
export const handleTypeKeys = () => [...registry.keys()];

/** Handle id codec: `{nodeId}:{dataType}:{in|out}`. */
export function handleId(nodeId: string, dataType: string, dir: "in" | "out") {
  return `${nodeId}:${dataType}:${dir}`;
}
export function parseHandleId(id: string | null | undefined) {
  if (!id) return null;
  const parts = id.split(":");
  if (parts.length < 3) return null;
  const dir = parts.pop()!;
  const dataType = parts.pop()!;
  const nodeId = parts.join(":");
  if (!nodeId || !dataType || (dir !== "in" && dir !== "out")) return null;
  return { nodeId, dataType, dir } as { nodeId: string; dataType: string; dir: "in" | "out" };
}
/** Strict: same data type, out → in. The spec's risk 6 keeps this a pure string compare. */
export function isValidFlowConnection(c: { sourceHandle?: string | null; targetHandle?: string | null }) {
  const s = parseHandleId(c.sourceHandle);
  const t = parseHandleId(c.targetHandle);
  return !!s && !!t && s.dir === "out" && t.dir === "in" && s.dataType === t.dataType;
}

export type NodeSize = "sm" | "md" | "lg";
export const NODE_WIDTH: Record<NodeSize, number> = { sm: 280, md: 320, lg: 420 };
