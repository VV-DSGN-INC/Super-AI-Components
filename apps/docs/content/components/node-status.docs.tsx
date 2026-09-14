import type { ComponentDocs } from "@/lib/component-docs";

import { NodeStatusBadge } from "@/registry/super-ai/node-status";

/**
 * Seeded from docs/design-system/component-specs.md#g11-node-status.
 * No "use client": plain data read by a Server Component. The examples are
 * static markup with no handlers, so no .examples sidecar is needed.
 */
export const NodeStatusDocs: ComponentDocs = {
  whatItIs:
    'A small inline badge that turns one of the six flow statuses into a dot or a spinner plus a word, and a helper that returns the ring a node card paints for the same status. It is the only place in the registry where a status becomes a glyph, so a node, a palette row and an inspector header all agree on what "queued" looks like.',
  whyItMatters:
    'A node canvas is read at a distance. ElevenLabs Flows and Freepik Flows both mark a running node with a dot and a ring rather than a sentence, because at 60% zoom a sentence is unreadable and a colour is not. Keeping the map in one component means the status vocabulary in flow-types has exactly one rendering, which is what lets the runner report `streaming` and the UI say "Running" without the two drifting.',
  evidence: ["ElevenLabs Flows", "Freepik Flows"],
  anatomy: [
    {
      slot: "node-status",
      note: "The inline wrapper. Carries data-status, the polite live region, and the title in compact mode.",
    },
    {
      slot: "node-status-dot",
      note: "A 6px dot painted with the status colour; rendered for every status except streaming.",
    },
    {
      slot: "node-status-spinner",
      note: "The streaming spinner. Motion-safe: it holds still under prefers-reduced-motion.",
    },
    {
      slot: "node-status-label",
      note: "The word. Visually hidden in compact mode, never removed, so the announcement survives.",
    },
  ],
  usage:
    "Render it wherever a node's run state has to be read: the card header (ai-node does this for you), a palette row, an inspector heading. Pass the status straight from the runner; never translate it first. Use `compact` inside dense chrome and rely on the title for the sighted hover. Use `statusRingClass` on the container that should glow, not on the badge.",
  dos: [
    {
      text: "Pass the runner's status unchanged; the badge owns the wording.",
      example: <NodeStatusBadge status="streaming" />,
    },
    {
      text: "Use compact in a header and let the title carry the word.",
      example: <NodeStatusBadge status="queued" compact />,
    },
  ],
  donts: [
    {
      text: "Don't add a seventh status by passing a string the union does not know; the map has no fallback branch and TypeScript rejects it for a reason.",
      example: <NodeStatusBadge status="failed" />,
    },
  ],
  accessibility: {
    keyboard: [
      "Zero tab stops. The badge is a span with no role and no handlers; it decorates the node that has focus rather than taking focus itself.",
    ],
    screenReader: [
      'The wrapper is aria-live="polite", so a status change is announced without stealing focus. The dot and spinner are aria-hidden; only the label is read.',
      "In compact mode the label is sr-only, not removed. The title attribute is for sighted hover and is not what a screen reader announces.",
    ],
  },
  pitfalls: [
    "The ring helper returns an empty string for idle and done on purpose. If a card always shows a ring, the caller is passing selected styling through the same class list; keep the two separate as ai-node does.",
    "The ring classes use an opacity modifier on a CSS variable (ring-[var(--flow-failed)]/60). That works because the variable resolves to an oklch colour; a consumer who overrides --flow-failed with a non-colour value gets no ring and no error.",
  ],
};
