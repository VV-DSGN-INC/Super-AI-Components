import type { ComponentDocs } from "@/lib/component-docs";

/**
 * Seeded from docs/design-system/component-specs.md#n4-trace-timeline.
 * Translate the spec's internal voice into consumer-facing guidance — do not
 * ship the seed text verbatim.
 *
 * No "use client" here: this module is plain data read by a Server
 * Component (component-docs.tsx), which destructures `docs.whatItIs`,
 * `docs.evidence`, etc. directly. If a Do/Don't needs a live example,
 * define a zero-prop component in a sibling "trace-timeline.examples.tsx"
 * client module ("use client" at the top of that file, not this one) and
 * reference it here as an element with no props, e.g.:
 *
 * // import { GoodExample } from "./trace-timeline.examples";
 * // dos: [{ text: "...", example: <GoodExample /> }]
 *
 * An inline handler on an element created in *this* file — e.g.
 * `<TraceTimeline onSelect={() => {}} />` passed straight into `dos`/`donts` —
 * cannot be serialized across the server/client boundary and breaks the
 * static export.
 */
export const TraceTimelineDocs: ComponentDocs = {
  whatItIs: "Waterfall of steps / tool calls / LLM calls",
  whyItMatters: "",
  evidence: [],
  anatomy: [],
  usage: "",
  dos: [],
  donts: [],
  pitfalls: [],
};
