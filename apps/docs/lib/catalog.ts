export interface CatalogItem {
  name: string;
  title: string;
  description: string;
  group: "Primitives" | "Components" | "Flow Kit";
  /** Short props/usage note rendered on the item's catalog page. */
  note?: string;
}

export const CATALOG_ITEMS: CatalogItem[] = [
  { name: "kbd", title: "Kbd", description: "Keycap chip for keyboard shortcuts.", group: "Primitives" },
  {
    name: "cost-chip",
    title: "Cost Chip",
    description: "Per-action credit cost chip (e.g. 17 credits, 900 credits/min).",
    group: "Primitives",
  },
  {
    name: "date-section",
    title: "Date Section",
    description: "Date-grouped section header for lists and grids.",
    group: "Primitives",
  },
  {
    name: "choice-chips",
    title: "Choice Chips",
    description: "Ring-selected chip group for visual and numeric parameters.",
    group: "Primitives",
  },
  {
    name: "filter-bar",
    title: "Filter Bar",
    description: "Category chips, add-filter chip, and filters button.",
    group: "Primitives",
  },
  {
    name: "field-row",
    title: "Field Row",
    description: "Label + control inspector row with unit-suffixed value input.",
    group: "Primitives",
  },
  {
    name: "gen-settings-bar",
    title: "Gen Settings Bar",
    description: "Compact model/aspect/resolution/duration/batch strip.",
    group: "Primitives",
  },
  {
    name: "shortcuts-sheet",
    title: "Shortcuts Sheet",
    description: "Keyboard shortcuts cheatsheet dialog.",
    group: "Components",
  },
  {
    name: "thread-list",
    title: "Thread List",
    description: "Date-grouped conversation list with rename, delete, and pin.",
    group: "Components",
  },
  // Flow Kit (wave 2) — canvas wiring, node anatomy, and the headless runner.
  {
    name: "flow-types",
    title: "Flow Types",
    description: "Flow Kit shared contracts: handle-type registry, statuses, id codec.",
    group: "Flow Kit",
    note:
      "Shared contracts (no UI): FLOW_STATUSES six-state union, the handle-type registry (registerHandleType / getHandleType), the {nodeId}:{dataType}:{in|out} handle-id codec, and isValidFlowConnection. " +
      'After install, import flow-tokens.css once in your global stylesheet (e.g. @import "@/components/super-ai/flow/flow-tokens.css") — handle/edge/status colors are defined there.',
  },
  {
    name: "typed-handle",
    title: "Typed Handle",
    description: "Colored, validated React Flow port — same-type out→in connections only.",
    group: "Flow Kit",
    note: "Props: dataType, type (source | target), position?, top? (stacking offset). nodeId is read from React Flow node context. Same-type out→in validation and --flow-<type> coloring are built in and not overridable.",
  },
  {
    name: "typed-edge",
    title: "Typed Edge",
    description: "Edge colored by its source handle's data type, with streaming animation.",
    group: "Flow Kit",
    note: "Register as edgeTypes={{ typed: TypedEdge }}. Stroke color derives from the source handle id; data.streaming animates a dash (motion-safe). Selection thickens the stroke; markers and extra style are forwarded.",
  },
  {
    name: "port-chip",
    title: "Port Chips",
    description: "IN/OUT typed port pills for dense node faces.",
    group: "Flow Kit",
    note: 'PortChips props: in / out (data-type arrays), satisfied (types whose upstream delivered). Each chip exposes data-satisfied="true|false" for CSS hooks; rows hide when empty.',
  },
  {
    name: "connection-hint",
    title: "Connection Hint",
    description: "Drop-on-empty-canvas mini palette filtered to compatible node types.",
    group: "Flow Kit",
    note: "Props: dataType, catalog (NodeCatalogEntry[]), position, onPick(kind), onDismiss?. Host wires React Flow onConnectEnd and positions it inside a relative container; compatibleTargets(dataType, catalog) is exported for filtering.",
  },
  {
    name: "node-status",
    title: "Node Status",
    description: "Status badge and ring map for the six-state generation contract.",
    group: "Flow Kit",
    note: 'NodeStatusBadge props: status, compact? (dot/spinner only, label via title). statusRingClass(status) maps the six contract states to card ring classes. UI copy renders streaming as "Running".',
  },
  {
    name: "ai-node",
    title: "AI Node",
    description: "Base canvas node card: header, media/body/error/footer slots, locked CTA state.",
    group: "Flow Kit",
    note: "Props: id, title, status, modelLabel?, runtime? (local | cloud), error?, selected?, size? (sm | md | lg), media / footer slots, children body, lockedCta?. locked replaces media+body with a CTA block; failed appends the error banner.",
  },
  {
    name: "media-slot",
    title: "Media Slot",
    description: "Aspect-locked media preview with empty, shimmer, output, and failed states.",
    group: "Flow Kit",
    note: "Props: kind (image | video | audio | text), status, src?, alt?, aspect? (video | square | auto), emptyText?. Streaming overlays a shimmer; audio renders a compact row; text renders children when done.",
  },
  {
    name: "run-button",
    title: "Run Button",
    description: "Split run control: status-driven primary plus run-scope menu and cost chip.",
    group: "Flow Kit",
    note: "Props: status, onRun, onStop?, plus onRunFrom? / onRunSelection? / onRunAll? — the scope menu renders only when one is present. cost? shows as a ~amount unit tooltip. streaming swaps the primary to Stop; locked disables both halves.",
  },
  {
    name: "model-bar",
    title: "Model Bar",
    description: "Node-docked params strip: model menu, cycling segments, toggles, Auto values.",
    group: "Flow Kit",
    note: "Props: segments (model | aspect | resolution | quality | duration | toggle | percent | seed), onChange(patch), disabled. Model opens a menu, other kinds cycle on click (duration gains an Auto stop); segments past 6 collapse into the ⋯ menu.",
  },
  {
    name: "node-prompt",
    title: "Node Prompt",
    description: "In-node prompt textarea with reference chips and collapsed summary mode.",
    group: "Flow Kit",
    note: "Props: value, onChange, references? (chips with type dot + remove), onRemoveReference?, collapsed?, onExpand?. collapsed renders a one-line summary button (Flora pattern); native textarea props are forwarded.",
  },
  {
    name: "use-flow-runner",
    title: "useFlowRunner",
    description: "Headless topological executor with dirty-tracking cache and branch-local failure.",
    group: "Flow Kit",
    note: "Headless hook — no UI. Topological execution with a content-hash cache, dirty tracking (markDirty), branch-local failure isolation, cycle detection, abortable runs (stop), scoped re-runs (runNode / runFrom / runSelection), and reset.",
  },
] as const;

export const CATALOG = CATALOG_ITEMS.map((i) => i.name);
export type CatalogName = (typeof CATALOG_ITEMS)[number]["name"];
