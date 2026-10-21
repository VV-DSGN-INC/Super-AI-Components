import type { ComponentDocs } from "@/lib/component-docs";

/**
 * Seeded from docs/design-system/component-specs.md#n14-data-controls.
 * Translate the spec's internal voice into consumer-facing guidance — do not
 * ship the seed text verbatim.
 *
 * No "use client" here: this module is plain data read by a Server
 * Component (component-docs.tsx), which destructures `docs.whatItIs`,
 * `docs.evidence`, etc. directly. If a Do/Don't needs a live example,
 * define a zero-prop component in a sibling "data-controls.examples.tsx"
 * client module ("use client" at the top of that file, not this one) and
 * reference it here as an element with no props, e.g.:
 *
 * // import { GoodExample } from "./data-controls.examples";
 * // dos: [{ text: "...", example: <GoodExample /> }]
 *
 * An inline handler on an element created in *this* file — e.g.
 * `<DataControls onSelect={() => {}} />` passed straight into `dos`/`donts` —
 * cannot be serialized across the server/client boundary and breaks the
 * static export.
 */
export const DataControlsDocs: ComponentDocs = {
  whatItIs: "Training and retention as separate, explained controls with the default stated in the UI.",
  whyItMatters: "",
  evidence: [],
  anatomy: [],
  usage: "",
  dos: [],
  donts: [],
  accessibility: {
    keyboard: [],
    screenReader: [],
  },
  pitfalls: [],
  // Both fields are the contract's machine half (spec 2026-09-14 §4). Replace
  // the seed with a list, or keep { none } and write the reason: the schema
  // gate rejects anything under 20 characters.
  variants: { none: "unwritten" },
  insteadUse: { none: "unwritten" },
};
