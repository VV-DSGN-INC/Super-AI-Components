import type { ComponentDocs } from "@/lib/component-docs";

import { PortChips } from "@/registry/super-ai/connection-hint";

/** Seeded from docs/design-system/component-specs.md#g12-connection-hint. PortChips examples are static; the hint itself needs a positioned host, so its example is the demo. */
export const ConnectionHintDocs: ComponentDocs = {
  whatItIs:
    "Two small pieces of the connect gesture. The hint is a positioned mini palette that appears when a connection is dropped on empty canvas, listing the node kinds whose inputs accept the dragged type and adding one on pick. The port chips list a node kind's IN and OUT types, with a satisfied mark per chip, for palettes and inspectors.",
  whyItMatters:
    "OpenAI Agent Builder and Freepik Flows both turn a dropped-on-nothing drag into an offer rather than a failure: the most common way a new user learns what connects to what. Filtering by the handle-type registry means the offer is always true, because it is computed from the same vocabulary the ports enforce.",
  evidence: ["OpenAI Agent Builder", "Freepik Flows"],
  anatomy: [
    {
      slot: "connection-hint",
      note: "A dialog, absolutely positioned at the drop point inside a positioned host. Labelled by its heading.",
    },
    {
      slot: "connection-hint-option",
      note: "One button per compatible kind: its input-type dots, then the label. The first one takes focus on mount.",
    },
    { slot: "port-chips", note: "The IN and OUT rows." },
    {
      slot: "port-chip",
      note: "One type: a dot in the type colour and the registered label. data-satisfied is always present, true or false.",
    },
  ],
  usage:
    "Render the hint from react-flow's onConnectEnd when the drop had no valid target, inside a container with position relative, and unmount it from onPick and onDismiss. Pass the same catalog the palette uses so both offer the same kinds. Use PortChips wherever a kind is described rather than instantiated: a palette row, an inspector header, an empty node.",
  dos: [
    {
      text: "Give every chip a verdict: pass `satisfied` so connected ports read as filled and the rest as open.",
      example: <PortChips in={["image", "text"]} out={["video"]} satisfied={["image"]} />,
    },
  ],
  donts: [
    {
      text: "Don't render chips for a type nobody registered; it falls back to the raw key and the neutral colour, which reads as a bug.",
      example: <PortChips in={["mask"]} />,
    },
  ],
  accessibility: {
    keyboard: [
      "Focus lands on the first option when the hint mounts. Tab moves through the options in catalog order; Escape calls onDismiss. There is no focus trap, because the hint is transient and the canvas behind it stays live.",
      "The chips are decoration with zero tab stops.",
    ],
    screenReader: [
      'The hint is a dialog named "Add compatible node". Each option is a button named by its label; the type dots are aria-hidden.',
      'The empty state is plain text, "No compatible nodes", inside the same dialog, so the announcement still explains why nothing is offered.',
    ],
    focus: [
      "On pick or dismiss the host unmounts the hint; focus returns to wherever the host puts it, which for flow-canvas is the canvas pane. The hint does not manage return focus itself.",
    ],
  },
  pitfalls: [
    "position is in the host's coordinate space and the host must be positioned. A static host places the hint relative to the page.",
    "The Escape listener is on document, so it fires for any Escape while the hint is mounted; unmount promptly from onDismiss or the next Escape is swallowed.",
    "autoFocus on the first option means mounting the hint moves focus. Only mount it on a real drop.",
  ],
};
