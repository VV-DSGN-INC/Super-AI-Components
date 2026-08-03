import type { ReactNode } from "react";

export interface DocsExample {
  /** One sentence, imperative. "Put creation last, below a separator." */
  text: string;
  /** Optional live render of the right (or wrong) thing. */
  example?: ReactNode;
}

export interface DocsSlot {
  /** Matches a data-slot attribute on the component. */
  slot: string;
  note: string;
}

export interface ComponentDocs {
  /** What the pattern is, in two or three sentences. */
  whatItIs: string;
  /** Why it earns registry status. Cites the reference board where possible. */
  whyItMatters: string;
  /** Products the pattern was observed in, from component-specs.md. */
  evidence: string[];
  /** Named slots, rendered as numbered callouts over the live component. */
  anatomy: DocsSlot[];
  /** How to reach for it — the decision, not the API. */
  usage: string;
  dos: DocsExample[];
  donts: DocsExample[];
  /** Things that go wrong in practice. */
  pitfalls: string[];
}
