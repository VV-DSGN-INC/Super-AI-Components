"use client";

import * as React from "react";

import {
  addEdge,
  Background,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Connection,
  type EdgeTypes,
  type FinalConnectionState,
  type Node,
  type NodeProps,
  type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { Button } from "@/components/ui/button";
import { stubExecute } from "@/lib/flow/stub-execute";
import { AiNode } from "@/registry/super-ai/flow/ai-node";
import { ConnectionHint, type NodeCatalogEntry } from "@/registry/super-ai/flow/connection-hint";
import { handleId, parseHandleId, type FlowStatus } from "@/registry/super-ai/flow/flow-types";
import { MediaSlot } from "@/registry/super-ai/flow/media-slot";
import { ModelBar, type ModelBarSegment } from "@/registry/super-ai/flow/model-bar";
import { NodePrompt } from "@/registry/super-ai/flow/node-prompt";
import { PortChips } from "@/registry/super-ai/flow/port-chip";
import { RunButton } from "@/registry/super-ai/flow/run-button";
import { TypedEdge, type TypedEdgeType } from "@/registry/super-ai/flow/typed-edge";
import { TypedHandle } from "@/registry/super-ai/flow/typed-handle";
import { useFlowRunner, type NodeOutput } from "@/registry/super-ai/flow/use-flow-runner";

/* ------------------------------------------------------------------ */
/* Graph model                                                         */
/* ------------------------------------------------------------------ */

type DemoNodeData = Record<string, unknown> & {
  kind: "image" | "video" | "text";
  title: string;
  prompt: string;
  failPlease?: boolean;
  model?: string;
  aspect?: string;
  resolution?: string;
  duration?: string;
};
type DemoNode = Node<DemoNodeData>;
type DemoEdge = TypedEdgeType;

const STORAGE_KEY = "flow-kit-demo";

const seedNodes = (): DemoNode[] => [
  {
    id: "image-1",
    type: "image",
    position: { x: 0, y: 0 },
    data: {
      kind: "image",
      title: "Image 1",
      prompt: "A misty forest at dawn",
      model: "flux-2",
      aspect: "16:9",
      resolution: "1K",
      failPlease: false,
    },
  },
  {
    id: "image-2",
    type: "image",
    position: { x: 0, y: 420 },
    data: {
      kind: "image",
      title: "Image 2",
      prompt: "A neon city street at night",
      model: "flux-2",
      aspect: "16:9",
      resolution: "1K",
      failPlease: false,
    },
  },
  {
    id: "video-1",
    type: "video",
    position: { x: 480, y: 190 },
    data: {
      kind: "video",
      title: "Video",
      prompt: "Slow cinematic pan between the two scenes",
      model: "ltx-2",
      duration: "4",
    },
  },
];

const seedEdges = (): DemoEdge[] => [
  {
    id: "image-1->video-1",
    source: "image-1",
    target: "video-1",
    sourceHandle: handleId("image-1", "image", "out"),
    targetHandle: handleId("video-1", "image", "in"),
    type: "typed",
  },
  {
    id: "image-2->video-1",
    source: "image-2",
    target: "video-1",
    sourceHandle: handleId("image-2", "image", "out"),
    targetHandle: handleId("video-1", "image", "in"),
    type: "typed",
  },
];

/** The node kinds this demo can spawn — also the connection-hint catalog. */
const NODE_CATALOG: NodeCatalogEntry[] = [
  { kind: "image", label: "Image generator", in: ["text"], out: ["image"] },
  { kind: "video", label: "Video generator", in: ["image", "text"], out: ["video"] },
  { kind: "text", label: "Text prompt", in: [], out: ["text"] },
];

const DEFAULT_NODE_DATA: Record<string, DemoNodeData> = {
  image: {
    kind: "image",
    title: "Image",
    prompt: "",
    model: "flux-2",
    aspect: "16:9",
    resolution: "1K",
    failPlease: false,
  },
  video: { kind: "video", title: "Video", prompt: "", model: "ltx-2", duration: "4" },
  text: { kind: "text", title: "Text", prompt: "" },
};

const IMAGE_MODELS = [
  { value: "flux-2", label: "Flux 2" },
  { value: "sd-3.5", label: "SD 3.5" },
];
const VIDEO_MODELS = [
  { value: "ltx-2", label: "LTX 2" },
  { value: "veo-3", label: "Veo 3" },
];

const modelLabel = (options: Array<{ value: string; label: string }>, value: unknown) =>
  options.find((o) => o.value === value)?.label;

/* ------------------------------------------------------------------ */
/* Demo context — runner state + graph actions for the node components */
/* ------------------------------------------------------------------ */

interface FlowDemoContextValue {
  statuses: Record<string, FlowStatus>;
  errors: Record<string, Error>;
  outputs: Record<string, NodeOutput>;
  /** Per node: data types whose connected upstream already has an output. */
  satisfied: Record<string, string[]>;
  updateNodeData: (id: string, patch: Partial<DemoNodeData>) => void;
  runNode: (id: string) => void;
  runFrom: (id: string) => void;
  runAll: () => void;
  stop: () => void;
}

const FlowDemoContext = React.createContext<FlowDemoContextValue | null>(null);

function useFlowDemo(): FlowDemoContextValue {
  const ctx = React.useContext(FlowDemoContext);
  if (!ctx) throw new Error("useFlowDemo must be used inside FlowDemo");
  return ctx;
}

/* ------------------------------------------------------------------ */
/* Node components — registry flow parts composed into canvas nodes    */
/* ------------------------------------------------------------------ */

function ImageNode({ id, data, selected }: NodeProps<DemoNode>) {
  const { statuses, errors, outputs, updateNodeData, runNode, runFrom, runAll, stop } = useFlowDemo();
  const status = statuses[id] ?? "idle";
  const url = outputs[id]?.url;

  const segments: ModelBarSegment[] = [
    { kind: "model", id: "model", value: String(data.model ?? "flux-2"), options: IMAGE_MODELS },
    { kind: "aspect", id: "aspect", value: String(data.aspect ?? "16:9"), options: ["16:9", "1:1", "9:16"] },
    { kind: "resolution", id: "resolution", value: String(data.resolution ?? "1K"), options: ["1K", "2K"] },
  ];

  return (
    <>
      <AiNode
        id={id}
        title={data.title}
        status={status}
        selected={selected}
        modelLabel={modelLabel(IMAGE_MODELS, data.model)}
        runtime="local"
        error={errors[id]?.message}
        media={
          <MediaSlot
            kind="image"
            status={status}
            src={typeof url === "string" ? url : undefined}
            alt={data.prompt}
          />
        }
        footer={
          <>
            <ModelBar
              className="nodrag min-w-0"
              segments={segments}
              disabled={status === "streaming"}
              onChange={(patch) => updateNodeData(id, { [patch.id]: patch.value })}
            />
            <RunButton
              className="nodrag shrink-0"
              size="sm"
              status={status}
              onRun={() => runNode(id)}
              onStop={stop}
              onRunFrom={() => runFrom(id)}
              onRunAll={runAll}
            />
          </>
        }
      >
        <div className="nodrag flex flex-col gap-2">
          <NodePrompt
            value={data.prompt}
            onChange={(v) => updateNodeData(id, { prompt: v })}
            placeholder="Describe the image…"
            aria-label={`${data.title} prompt`}
          />
          {/* Demo-only failure switch: proves the failed banner + branch containment. */}
          <label className="flex w-fit items-center gap-1.5 text-[11px] text-muted-foreground">
            <input
              type="checkbox"
              checked={data.failPlease === true}
              onChange={(e) => updateNodeData(id, { failPlease: e.target.checked })}
            />
            Fail this node (demo)
          </label>
        </div>
      </AiNode>
      <TypedHandle dataType="text" type="target" top={36} />
      <TypedHandle dataType="image" type="source" />
    </>
  );
}

function VideoNode({ id, data, selected }: NodeProps<DemoNode>) {
  const { statuses, errors, outputs, satisfied, updateNodeData, runNode, runFrom, runAll, stop } =
    useFlowDemo();
  const status = statuses[id] ?? "idle";
  const url = outputs[id]?.url;

  const segments: ModelBarSegment[] = [
    { kind: "model", id: "model", value: String(data.model ?? "ltx-2"), options: VIDEO_MODELS },
    {
      kind: "duration",
      id: "duration",
      value: data.duration === "auto" ? "auto" : String(data.duration ?? "4"),
      options: [4, 6, 8],
    },
  ];

  return (
    <>
      <AiNode
        id={id}
        title={data.title}
        status={status}
        selected={selected}
        modelLabel={modelLabel(VIDEO_MODELS, data.model)}
        error={errors[id]?.message}
        media={
          <MediaSlot
            className="nodrag"
            kind="video"
            status={status}
            src={typeof url === "string" ? url : undefined}
          />
        }
        footer={
          <>
            <ModelBar
              className="nodrag min-w-0"
              segments={segments}
              disabled={status === "streaming"}
              onChange={(patch) => updateNodeData(id, { [patch.id]: patch.value })}
            />
            <RunButton
              className="nodrag shrink-0"
              size="sm"
              status={status}
              onRun={() => runNode(id)}
              onStop={stop}
              onRunFrom={() => runFrom(id)}
              onRunAll={runAll}
            />
          </>
        }
      >
        <div className="nodrag flex flex-col gap-2">
          <NodePrompt
            value={data.prompt}
            onChange={(v) => updateNodeData(id, { prompt: v })}
            placeholder="Describe the motion…"
            aria-label={`${data.title} prompt`}
          />
          <PortChips in={["image", "text"]} out={["video"]} satisfied={satisfied[id]} />
        </div>
      </AiNode>
      <TypedHandle dataType="image" type="target" top={36} />
      <TypedHandle dataType="text" type="target" top={64} />
      <TypedHandle dataType="video" type="source" />
    </>
  );
}

function TextNode({ id, data, selected }: NodeProps<DemoNode>) {
  const { statuses, errors, outputs, updateNodeData, runNode, runFrom, runAll, stop } = useFlowDemo();
  const status = statuses[id] ?? "idle";
  const text = outputs[id]?.text;

  return (
    <>
      <AiNode
        id={id}
        title={data.title}
        status={status}
        selected={selected}
        size="sm"
        error={errors[id]?.message}
        media={
          <MediaSlot kind="text" status={status} aspect="auto">
            {typeof text === "string" ? text : null}
          </MediaSlot>
        }
        footer={
          <>
            <PortChips out={["text"]} />
            <RunButton
              className="nodrag shrink-0"
              size="sm"
              status={status}
              onRun={() => runNode(id)}
              onStop={stop}
              onRunFrom={() => runFrom(id)}
              onRunAll={runAll}
            />
          </>
        }
      >
        <NodePrompt
          className="nodrag"
          value={data.prompt}
          onChange={(v) => updateNodeData(id, { prompt: v })}
          placeholder="Write a prompt…"
          aria-label={`${data.title} prompt`}
        />
      </AiNode>
      <TypedHandle dataType="text" type="source" />
    </>
  );
}

const nodeTypes: NodeTypes = { image: ImageNode, video: VideoNode, text: TextNode };
const edgeTypes: EdgeTypes = { typed: TypedEdge };

/* ------------------------------------------------------------------ */
/* Persistence helpers                                                 */
/* ------------------------------------------------------------------ */

const persistNode = (n: DemoNode) => ({ id: n.id, type: n.type, position: n.position, data: n.data });
const persistEdge = (e: DemoEdge) => ({
  id: e.id,
  source: e.source,
  target: e.target,
  sourceHandle: e.sourceHandle,
  targetHandle: e.targetHandle,
  type: e.type,
});

function readStoredGraph(): { nodes: DemoNode[]; edges: DemoEdge[] } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return null;
    const { nodes, edges } = parsed as { nodes?: unknown; edges?: unknown };
    if (!Array.isArray(nodes) || !Array.isArray(edges)) return null;
    if (!nodes.every((n) => n && typeof n.id === "string" && n.data)) return null;
    if (!edges.every((e) => e && typeof e.id === "string")) return null;
    return { nodes: nodes as DemoNode[], edges: edges as DemoEdge[] };
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/* The demo                                                            */
/* ------------------------------------------------------------------ */

interface HintState {
  dataType: string;
  /** Canvas-wrapper-relative position for the floating hint card. */
  panePosition: { x: number; y: number };
  /** Flow-space position for the node spawned from the hint. */
  flowPosition: { x: number; y: number };
  fromNodeId: string;
  fromHandleId: string;
}

function FlowDemoInner() {
  const [nodes, setNodes, onNodesChange] = useNodesState<DemoNode>(seedNodes());
  const [edges, setEdges, onEdgesChange] = useEdgesState<DemoEdge>(seedEdges());
  const [hint, setHint] = React.useState<HintState | null>(null);
  /* A connection drop on the pane is followed by a synthetic click (common-ancestor
     click after mousedown on the handle + mouseup on the pane) — swallow that one
     so it cannot instantly dismiss the hint it just opened. */
  const suppressNextPaneClick = React.useRef(false);
  const hydratedRef = React.useRef(false);
  const wrapperRef = React.useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();

  /* Persist nodes/edges. Declared before the restore effect so its first pass is a
     no-op (the ref flips below) and the seed never clobbers a stored graph. */
  React.useEffect(() => {
    if (!hydratedRef.current) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ nodes: nodes.map(persistNode), edges: edges.map(persistEdge) }),
      );
    } catch {
      // Storage may be unavailable (private mode, quota) — persistence is best-effort.
    }
  }, [nodes, edges]);

  /* Restore the persisted graph once on mount, then start persisting. */
  React.useEffect(() => {
    const stored = readStoredGraph();
    if (stored) {
      setNodes(stored.nodes);
      setEdges(stored.edges);
    }
    hydratedRef.current = true;
  }, [setNodes, setEdges]);

  /* Headless execution: React Flow state in, statuses/outputs/errors out. */
  const runnerNodes = React.useMemo(() => nodes.map((n) => ({ id: n.id, data: n.data })), [nodes]);
  const runnerEdges = React.useMemo(
    () =>
      edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle,
        targetHandle: e.targetHandle,
      })),
    [edges],
  );
  const runner = useFlowRunner({ nodes: runnerNodes, edges: runnerEdges, execute: stubExecute });

  /* Edges animate (dashed flow) while their source node streams. */
  const displayEdges = React.useMemo(
    () =>
      edges.map((e) => ({
        ...e,
        data: { ...e.data, streaming: runner.statuses[e.source] === "streaming" },
      })),
    [edges, runner.statuses],
  );

  /* Per node: which input types already have upstream output (port-chip "satisfied"). */
  const satisfied = React.useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const e of edges) {
      if (!runner.outputs[e.source]) continue;
      const dataType = parseHandleId(e.targetHandle)?.dataType;
      if (!dataType) continue;
      (map[e.target] ??= []).push(dataType);
    }
    return map;
  }, [edges, runner.outputs]);

  const updateNodeData = React.useCallback(
    (id: string, patch: Partial<DemoNodeData>) => {
      setNodes((nds) => nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, ...patch } } : n)));
    },
    [setNodes],
  );

  const onConnect = React.useCallback(
    (connection: Connection) => setEdges((eds) => addEdge({ ...connection, type: "typed" as const }, eds)),
    [setEdges],
  );

  /* Connection dropped on empty canvas → floating mini palette (connection-hint). */
  const onConnectEnd = React.useCallback(
    (event: MouseEvent | TouchEvent, connectionState: FinalConnectionState) => {
      if (connectionState.isValid) return;
      const fromHandle = connectionState.fromHandle;
      if (connectionState.toNode || !fromHandle?.id || fromHandle.type !== "source") return;
      const dataType = parseHandleId(fromHandle.id)?.dataType;
      const bounds = wrapperRef.current?.getBoundingClientRect();
      if (!dataType || !fromHandle.nodeId || !bounds) return;
      const point = "changedTouches" in event ? event.changedTouches[0] : event;
      suppressNextPaneClick.current = true;
      setHint({
        dataType,
        panePosition: { x: point.clientX - bounds.left, y: point.clientY - bounds.top },
        flowPosition: screenToFlowPosition({ x: point.clientX, y: point.clientY }),
        fromNodeId: fromHandle.nodeId,
        fromHandleId: fromHandle.id,
      });
    },
    [screenToFlowPosition],
  );

  /* Picking from the hint spawns the node and wires the dangling connection into it. */
  const spawnFromHint = React.useCallback(
    (kind: string) => {
      setHint((current) => {
        if (!current) return null;
        const defaults = DEFAULT_NODE_DATA[kind];
        if (!defaults) return null;
        const id = `${kind}-${Math.random().toString(36).slice(2, 8)}`;
        setNodes((nds) => [
          ...nds,
          { id, type: kind, position: current.flowPosition, data: { ...defaults } },
        ]);
        setEdges((eds) =>
          addEdge(
            {
              source: current.fromNodeId,
              sourceHandle: current.fromHandleId,
              target: id,
              targetHandle: handleId(id, current.dataType, "in"),
              type: "typed" as const,
            },
            eds,
          ),
        );
        return null;
      });
    },
    [setNodes, setEdges],
  );

  const resetToSeed = React.useCallback(() => {
    runner.reset();
    setNodes(seedNodes());
    setEdges(seedEdges());
    setHint(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // best-effort
    }
  }, [runner, setNodes, setEdges]);

  const contextValue = React.useMemo<FlowDemoContextValue>(
    () => ({
      statuses: runner.statuses,
      errors: runner.errors,
      outputs: runner.outputs,
      satisfied,
      updateNodeData,
      runNode: runner.runNode,
      runFrom: runner.runFrom,
      runAll: runner.run,
      stop: runner.stop,
    }),
    [runner, satisfied, updateNodeData],
  );

  return (
    <div className="flex h-dvh flex-col">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b px-6 py-4">
        <div className="max-w-2xl space-y-1">
          <h1 className="text-lg font-semibold">Flow Kit — image → video chain</h1>
          <p className="text-xs text-muted-foreground">
            Stub executor (800–2000 ms per node). Run all, then edit one image prompt and run again — only
            that image and the video re-execute; the untouched image is a cache hit. Tick “Fail this node” to
            see branch-local failure. Drag an output port onto empty canvas for the connection hint. The graph
            persists to localStorage.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => void runner.run()}>
            Run all
          </Button>
          <Button size="sm" variant="outline" onClick={runner.stop}>
            Stop
          </Button>
          <Button size="sm" variant="ghost" onClick={resetToSeed}>
            Reset
          </Button>
        </div>
      </header>
      <div ref={wrapperRef} className="relative min-h-0 flex-1">
        <FlowDemoContext.Provider value={contextValue}>
          <ReactFlow
            nodes={nodes}
            edges={displayEdges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onConnectEnd={onConnectEnd}
            onPaneClick={() => {
              if (suppressNextPaneClick.current) {
                suppressNextPaneClick.current = false;
                return;
              }
              setHint(null);
            }}
            fitView
            proOptions={{ hideAttribution: true }}
          >
            <Background />
          </ReactFlow>
        </FlowDemoContext.Provider>
        {hint && (
          <ConnectionHint
            dataType={hint.dataType}
            catalog={NODE_CATALOG}
            position={hint.panePosition}
            onPick={spawnFromHint}
            onDismiss={() => setHint(null)}
          />
        )}
      </div>
    </div>
  );
}

export function FlowDemo() {
  return (
    <ReactFlowProvider>
      <FlowDemoInner />
    </ReactFlowProvider>
  );
}
