export const CATALOG = [
  "kbd",
  "cost-chip",
  "date-section",
  "choice-chips",
  "filter-bar",
  "field-row",
  "gen-settings-bar",
  "shortcuts-sheet",
  "thread-list",
] as const;
export type CatalogName = (typeof CATALOG)[number];

/** Flow Kit (wave 2) — canvas wiring, node anatomy, and the headless runner. */
export const FLOW_CATALOG = [
  "flow-types",
  "typed-handle",
  "typed-edge",
  "port-chip",
  "connection-hint",
  "node-status",
  "ai-node",
  "media-slot",
  "run-button",
  "model-bar",
  "node-prompt",
  "use-flow-runner",
] as const;
export type FlowCatalogName = (typeof FLOW_CATALOG)[number];

/** Short props/usage note rendered on each Flow Kit catalog page. */
export const FLOW_NOTES: Record<FlowCatalogName, string> = {
  "flow-types":
    "Shared contracts (no UI): FLOW_STATUSES six-state union, the handle-type registry (registerHandleType / getHandleType), the {nodeId}:{dataType}:{in|out} handle-id codec, and isValidFlowConnection. Installs flow-tokens.css, the only place --flow-* colors are defined.",
  "typed-handle":
    "Props: dataType, type (source | target), position?, top? (stacking offset). nodeId is read from React Flow node context. Same-type out→in validation and --flow-<type> coloring are built in and not overridable.",
  "typed-edge":
    "Register as edgeTypes={{ typed: TypedEdge }}. Stroke color derives from the source handle id; data.streaming animates a dash (motion-safe). Selection thickens the stroke; markers and extra style are forwarded.",
  "port-chip":
    'PortChips props: in / out (data-type arrays), satisfied (types whose upstream delivered). Each chip exposes data-satisfied="true|false" for CSS hooks; rows hide when empty.',
  "connection-hint":
    "Props: dataType, catalog (NodeCatalogEntry[]), position, onPick(kind), onDismiss?. Host wires React Flow onConnectEnd and positions it inside a relative container; compatibleTargets(dataType, catalog) is exported for filtering.",
  "node-status":
    'NodeStatusBadge props: status, compact? (dot/spinner only, label via title). statusRingClass(status) maps the six contract states to card ring classes. UI copy renders streaming as "Running".',
  "ai-node":
    "Props: id, title, status, modelLabel?, runtime? (local | cloud), error?, selected?, size? (sm | md | lg), media / footer slots, children body, lockedCta?. locked replaces media+body with a CTA block; failed appends the error banner.",
  "media-slot":
    "Props: kind (image | video | audio | text), status, src?, alt?, aspect? (video | square | auto), emptyText?. Streaming overlays a shimmer; audio renders a compact row; text renders children when done.",
  "run-button":
    "Props: status, onRun, onStop?, plus onRunFrom? / onRunSelection? / onRunAll? — the scope menu renders only when one is present. cost? shows as a ~amount unit tooltip. streaming swaps the primary to Stop; locked disables both halves.",
  "model-bar":
    "Props: segments (model | aspect | resolution | quality | duration | toggle | percent | seed), onChange(patch), disabled. Model opens a menu, other kinds cycle on click (duration gains an Auto stop); segments past 6 collapse into the ⋯ menu.",
  "node-prompt":
    "Props: value, onChange, references? (chips with type dot + remove), onRemoveReference?, collapsed?, onExpand?. collapsed renders a one-line summary button (Flora pattern); native textarea props are forwarded.",
  "use-flow-runner":
    "Headless hook — no UI. Topological execution with a content-hash cache, dirty tracking (markDirty), branch-local failure isolation, cycle detection, abortable runs (stop), scoped re-runs (runNode / runFrom / runSelection), and reset.",
};
