import { z } from "zod"

/** Machine-readable form of the anti-slop rules. One record holds what the
 *  monolith's pipeline splits across a governance skill and a detection skill:
 *  the rule, its severity, AND how (or whether) it can be detected.
 *
 *  Keeping them in one record is the point. When the rule list and the
 *  detector list are separate documents they drift, and "I did not check this"
 *  becomes indistinguishable from "this passed". A rule whose method is
 *  `judgment` is structurally unrunnable, so the detector reports it as
 *  unchecked every run without anyone deciding to.
 *
 *  Spec: research/specs/2026-08-20-rule-catalogue-design.md
 *  Rule IDs and rationale: research/specs/2026-08-11-anti-slop-rules.md Part 3 */

/** Bumped when the record shape changes. Vendored copies (me:unslop) print
 *  this so a stale copy is visible in the transcript instead of silent. */
export const CATALOGUE_VERSION = 1

export const RULE_ID_PATTERN = /^(COL|TYP|LAY|CMP|ICO|MOT|CPY|CHT|STA|SYS|TOK)-\d+$/

/** Patterns are STRINGS, not RegExp literals: the record is emitted to JSON
 *  for the dependency-free detector, and a RegExp does not survive
 *  JSON.stringify. catalogue.test.ts compiles every one of them, so an invalid
 *  pattern fails `npm test` rather than silently matching nothing at runtime —
 *  which is exactly how two of the old skill's greps sat broken for weeks. */
const grepFields = {
  pattern: z.string().min(1),
  flags: z.string().regex(/^[dgimsuvy]*$/, "invalid RegExp flags"),
  /** Directory prefixes, repo-relative. */
  scope: z.array(z.string().min(1)).min(1),
  /** File extensions, with the dot. */
  include: z.array(z.string().regex(/^\.[a-z]+$/)).min(1),
  /** Path substrings that are sanctioned exceptions, e.g. "skeleton.tsx" for
   *  the one legitimate animate-pulse. Each one is a decision, so it is listed
   *  explicitly rather than encoded into the pattern. */
  exempt: z.array(z.string().min(1)),
}

const grepDetect = z.object({ method: z.literal("grep"), ...grepFields })

const heuristicDetect = z.object({
  method: z.literal("heuristic"),
  ...grepFields,
  /** What this pattern is known to match wrongly. Required: a heuristic whose
   *  false positives nobody has characterised cannot be promoted to blocking. */
  falsePositives: z.string().min(1),
})

const renderedDetect = z.object({
  method: z.literal("rendered"),
  /** What to do in a browser to check it. */
  how: z.string().min(1),
})

const judgmentDetect = z.object({
  method: z.literal("judgment"),
  /** What to look at, and what would make it a violation. */
  how: z.string().min(1),
})

export const detectSchema = z.discriminatedUnion("method", [
  grepDetect,
  heuristicDetect,
  renderedDetect,
  judgmentDetect,
])

export const ruleSchema = z.object({
  /** The ID that already exists — see RULE_ID_PATTERN. */
  id: z.string().regex(RULE_ID_PATTERN, "must be an existing-scheme rule id, e.g. COL-1"),
  /** One line, imperative, as it reads in a report. */
  title: z.string().min(1),
  /** blocker = a hard ban, fails the tree-clean test.
   *  review  = needs a human call (ratchet growth, a new component).
   *  warning = drift; fix unless there is a documented reason. */
  severity: z.enum(["blocker", "review", "warning"]),
  detect: detectSchema,
  /** The substitution. AGENTS.md already requires that fixes are
   *  substitutions rather than deletions; making the field non-optional turns
   *  that sentence into something the test suite enforces. */
  fix: z.string().min(1),
  /** Why the ban exists. Optional, strongly encouraged — a bare "don't" gets
   *  rationalized away, which is the reason component metas carry the same field. */
  why: z.string().min(1).optional(),
})

export type Rule = z.infer<typeof ruleSchema>
