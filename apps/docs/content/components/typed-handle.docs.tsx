import type { ComponentDocs } from "@/lib/component-docs";

/**
 * Seeded from docs/design-system/component-specs.md#g3-typed-handle.
 * No live examples: a handle only renders inside a react-flow node, and the
 * docs page's demo already shows one. No .examples sidecar.
 */
export const TypedHandleDocs: ComponentDocs = {
  whatItIs:
    "A react-flow port that carries its data type in the handle id, paints the type's colour from the flow token scale, and refuses to connect to a port of another type or the same direction. It is the one component in the family that talks to react-flow's Handle directly.",
  whyItMatters:
    "Every node canvas on the reference board (Freepik Flows, ElevenLabs Flows, OpenAI Agent Builder) colours ports by type and rejects a bad drag before it lands, rather than accepting it and failing at run time. Encoding the type into the id is what makes that a string compare instead of a lookup, and it is why the edge that follows can colour itself from the source id alone.",
  evidence: ["Freepik Flows", "ElevenLabs Flows", "OpenAI Agent Builder"],
  anatomy: [
    {
      slot: "typed-handle",
      note: "The port: a 14px circle with a background-coloured border, react-flow's Handle underneath. Carries data-flow-type and, while a compatible drag is in progress, data-flow-compatible.",
    },
  ],
  usage:
    "Render one per port inside a react-flow node component. Give it `dataType` and `type`; inside a node context it reads the node id itself, and in a story or test you pass `nodeId`. Stack several on one side with `top`. Register a type that is not one of the ten built in with `registerHandleType` from flow-types before rendering, so it gets a label and a colour token.",
  dos: [
    {
      text: "Let position default: targets on the left, sources on the right, which is what every reference canvas does.",
    },
    { text: "Register custom types once at module scope, so server and client render the same colour." },
  ],
  donts: [
    {
      text: "Don't set `style.background` to recolour a port. The colour is the type's identity; change the token or register a type.",
    },
    {
      text: "Don't pass `id` or `isValidConnection` through; both are owned by the codec and the prop types omit them for that reason.",
    },
  ],
  accessibility: {
    keyboard: [
      "The port is not a tab stop. React-flow's Handle renders a div; connecting by keyboard is react-flow's own accessibility mode on the canvas, not a per-port control.",
    ],
    screenReader: [
      'The port carries role="img" and an accessible name of the form "Image input port" or "Audio output port", built from the registered label and the direction. The role is load-bearing rather than decorative: React Flow renders the handle as a bare div, and an aria-label on a div with no role is prohibited, so the name would be dropped rather than announced. An unregistered type reads its raw key, so the omission is audible.',
    ],
  },
  pitfalls: [
    'Outside a react-flow node context and without `nodeId`, the handle id is ":image:in" and a development warning is logged. Tests and stories must pass `nodeId`.',
    "`top` is a pixel offset inside the node, which is canvas geometry rather than layout; it is not mirrored for RTL, and should not be.",
    "The compatible scale-up is a `transition-transform`, not a keyframe, so it needs no reduced-motion story; but it only fires when the canvas sets data-flow-compatible from `useConnection()`, which flow-canvas does in phase 2.",
  ],
};
