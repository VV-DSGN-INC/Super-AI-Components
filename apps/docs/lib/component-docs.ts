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

/**
 * Split by the question a reader arrives with, not by WCAG criterion. Someone
 * checking "can this be driven without a mouse" and someone checking "what does
 * VoiceOver say" are two different visits, and a single flat list makes both
 * of them read the whole thing.
 */
export interface DocsAccessibility {
  /** Tab stops, activation keys, and — just as load-bearing — what a key does *not* do. */
  keyboard: string[];
  /** Roles, accessible names, and what assistive tech actually announces. */
  screenReader: string[];
  /** Where focus lands when the component changes shape. Omit when nothing moves focus. */
  focus?: string[];
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
  /**
   * How the component behaves for keyboard and assistive-tech users. Required:
   * the registry's recurring accessibility failures are cross-component ones a
   * visual review cannot see, so they have to be written down per component.
   */
  accessibility: DocsAccessibility;
  /** Things that go wrong in practice. */
  pitfalls: string[];
}
