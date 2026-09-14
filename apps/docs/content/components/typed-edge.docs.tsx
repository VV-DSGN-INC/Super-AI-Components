import type { ComponentDocs } from "@/lib/component-docs";

/** Seeded from docs/design-system/component-specs.md#g10-typed-edge. No sidecar: an edge renders only on a canvas. */
export const TypedEdgeDocs: ComponentDocs = {
  whatItIs:
    "A react-flow edge component that colours its stroke from the data type encoded in its source handle id, draws thicker while selected, and dashes and moves while the upstream node is streaming. It reads nothing from node state; the id is enough.",
  whyItMatters:
    "On Freepik Flows and ElevenLabs Flows the running path is visible from the edges before you read any badge: the lines move. Deriving colour from the source rather than the target is deliberate, because a drag in progress has no target yet and the colour must not change mid-drag.",
  evidence: ["Freepik Flows", "ElevenLabs Flows"],
  anatomy: [
    {
      slot: "typed-edge",
      note: "The path. Stroke and width are inline styles so they beat react-flow's unlayered CSS; the dash and its motion are classes.",
    },
  ],
  usage:
    'Register it once on the canvas as `edgeTypes: { typed: TypedEdge }` and give edges `type: "typed"`. Set `data.streaming` from the runner\'s per-node status for edges leaving a streaming node. Use `typedEdgeStyle` directly if you render a custom edge and only want the colour and width rules.',
  dos: [
    {
      text: "Feed `data.streaming` from useFlowRunner's statuses so the moving dash means a real run, never decoration.",
    },
    { text: "Keep the source handle id in the codec form; the colour is parsed from it." },
  ],
  donts: [
    {
      text: "Don't set `style.stroke` per edge to recolour it; the type owns the colour and the per-edge style is spread first so it loses.",
    },
  ],
  accessibility: {
    keyboard: [
      "The edge is an SVG path with no tab stop of its own; selecting and deleting edges by keyboard is react-flow's canvas behaviour.",
    ],
    screenReader: [
      'Nothing is announced by the edge itself. The connection is described by the two ports\' accessible names ("Image output port" to "Image input port"), and the run state by the node-status badge on the upstream node.',
    ],
  },
  pitfalls: [
    "The dash animation is the theme animation animate-flow-dash and needs its keyframes installed; the registry ships them as a css block with this item. A consumer who strips the css field gets a static dash.",
    "Width changes are a `transition-[stroke-width]`, deliberately not the transition-all shorthand; adding properties there is a MOT-2 blocker.",
    "`selected` comes from react-flow's edge state; it is not a prop you set on the edge object.",
  ],
};
