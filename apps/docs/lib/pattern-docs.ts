import type { DocsSlot } from "./component-docs";

/**
 * The spine of the patterns index (spec 2026-09-15 §5, D27): the lifecycle
 * loop from concept-model.md §3 in the order a user meets it. Ids are the
 * enum the gate checks; labels are display text.
 *
 * Deliberately not the families: a component is placed once, by what it is,
 * and a behaviour is placed by the question it answers. Family N splits
 * across `watch` (streaming, runs, tool calls) and `trust` (permission,
 * attribution), which is the case that rules out deriving one from the other.
 */
export const STAGES = [
  { id: "start", label: "Start", question: "How do I get in, and where am I?" },
  { id: "ask", label: "Ask", question: "How do I say what I want?" },
  { id: "tune", label: "Tune", question: "How do I control what comes back, and what it costs?" },
  { id: "watch", label: "Watch", question: "What is it doing right now?" },
  { id: "review", label: "Review", question: "Is this right, and how do I fix it?" },
  { id: "keep", label: "Keep", question: "Where does it go, and how do I find it again?" },
  { id: "trust", label: "Trust", question: "What is it allowed to do, and what am I paying?" },
] as const;

export type PatternStage = (typeof STAGES)[number]["id"];

/** A slug is a file name, a route segment and an export-name seed at once. */
export const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** One behaviour the interface performs for the user, as a guidance module
 *  (spec 2026-09-15 §4). The only hand-written source for a pattern page. */
export interface PatternDocs {
  /** Reader-facing name of the behaviour. Never a registry name. */
  title: string;
  stage: PatternStage;
  /** What the interface does for the user, two or three sentences. */
  definition: string;
  /** Why it earns a page: the problem it solves, cited to the boards where possible. */
  whyItMatters: string;
  /** Shipped manifest names, in composition order. Empty only when unfilled. */
  components: string[];
  /** Named regions of the composition; the grey-box anatomy when unfilled. */
  anatomy: DocsSlot[];
  /** Situations the composition gets wrong in practice. */
  pitfalls: string[];
  /** Products the behaviour was observed in. Optional when shipped (inherited
   *  from the components); required when unfilled. */
  evidence?: string[];
  status: "shipped" | "unfilled";
  /** Required when unfilled, at least 20 characters (D26). */
  unfilledBecause?: string;
}
