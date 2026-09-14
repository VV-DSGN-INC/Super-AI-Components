import { z } from "zod"

import {
  ELEVATION_GROUP,
  FONT_GROUP,
  RADIUS_GROUP,
  SEMANTIC_COLOR_GROUPS,
  SHADCN_ALIASES,
  SIZE_GROUPS,
  UNMAPPED_COLOR_TOKENS,
  UNMAPPED_SIZE_TOKENS,
} from "@nickv/pegbo-ui/tokens"

/** Machine-readable usage contract for a component: the judgments a human
 *  designer applies when placing it, written down so an agent doesn't have to
 *  infer them. Lives next to the component as `<slug>.meta.json`.
 *
 *  What belongs here is DECISIONS, not restated props — TypeScript already
 *  states the props. Each variant value carries the INTENT that picks it;
 *  every anti-pattern carries its WHY (a bare "don't" reads as arbitrary and
 *  gets overridden). Spec: research/specs/2026-08-12-component-meta.md */

const variantAxisSchema = z.object({
  /** The prop name as typed in the component, e.g. "variant", "size" — or,
   *  where one component exposes two divergent axes under the same prop name
   *  (Ruling H), a human disambiguation like `"DialogFooter showCloseButton"`
   *  or `"ToolHeader · state"`. This field is for the reader. */
  prop: z.string().min(1),
  /** The bare identifier the story-coverage gate matches on, required
   *  whenever `prop` is not already one.
   *
   *  Without it the gate builds its needle from `prop` verbatim, which is
   *  unsatisfiable by any correct story: no source text contains
   *  `ToolHeader · state="output-error"`. 57 obligations across 20 axes sat in
   *  exactly that state, and the space-separated ones were worse than the
   *  others — `"Sidebar collapsible"` happens to match the JSX
   *  `<Sidebar collapsible="icon">` by luck, so the report was right about
   *  some prose props and permanently wrong about the rest with nothing
   *  telling them apart.
   *
   *  `prop` keeps the prose because the disambiguation is real and a reader
   *  needs it; this carries the lookup key. Same shape as `insteadUse`:
   *  promote the datum the machine needs instead of parsing the prose. */
  propName: z
    .string()
    .regex(/^[A-Za-z_$][\w$]*$/, "propName must be a bare identifier")
    .optional(),
  default: z.string().optional(),
  values: z
    .array(
      z.object({
        value: z.string().min(1),
        /** When to pick this value — the judgment, not the appearance. */
        intent: z.string().min(1),
      })
    )
    .min(1),
})

const keyboardRowSchema = z.object({
  /** The join key the coverage gate matches on. Shaped like `<part>/<keys>`
   *  as a mnemonic, but **author-chosen, not derived** — deriving it from
   *  `part` + `keys` is unsound, because `keys: ["Shift", "Tab"]` (either
   *  key) and `keys: ["Shift+Tab"]` (the chord) slug to the same string and
   *  the needle would match the wrong row. Only shape and uniqueness are
   *  validated; the author owns stability. */
  id: z.string().regex(/^[a-z0-9-]+\/[a-z0-9+.-]+$/),
  /** Where focus is when the key is pressed. Dell groups by this, and the
   *  grouping is what makes the table scannable: "Trigger" vs "Menu".
   *  Display prose, read by humans — `id` carries the machine key, so `part`
   *  is free to read well ("Menu item", "Submenu trigger"). */
  part: z.string().min(1),
  /** Alternatives, not a chord — ["Enter", "Space"] reads "either".
   *  A chord is a single string: "Shift+Tab". */
  keys: z.array(z.string().min(1)).min(1),
  /** What it does AND where focus lands after. Both halves are required by
   *  convention: "opens the menu" without "focus moves to the first item"
   *  is the half that gets implemented wrong. */
  outcome: z.string().min(1),
  /** Only when this deviates from the ARIA APG pattern for the role — the
   *  deviation is the part a reviewer needs to see justified. */
  note: z.string().optional(),
})

export type KeyboardRow = z.infer<typeof keyboardRowSchema>

/** `focusable: true` rows are checked for two contradictions a `.optional()`
 *  discriminated union can't catch on its own (they're cross-row rules, not
 *  per-field shape): two rows resolving to the same coverage-gate needle, and
 *  the same key documented twice for the same part. `focusable: false` is
 *  `.strict()` so a hand-edited file that also carries `rows` fails Zod —
 *  TypeScript's discriminated union already forbids this for anything
 *  authored through the type, but a `.meta.json` file is parsed from raw
 *  JSON, where TypeScript has no say. */
const keyboardSchema = z.discriminatedUnion("focusable", [
  z.object({ focusable: z.literal(false), why: z.string().min(20) }).strict(),
  z
    .object({
      focusable: z.literal(true),
      rows: z.array(keyboardRowSchema).min(1),
    })
    .superRefine((val, ctx) => {
      const seenIds = new Set<string>()
      const seenPairs = new Set<string>()
      val.rows.forEach((row, i) => {
        if (seenIds.has(row.id)) {
          ctx.addIssue({
            code: "custom",
            message: `Duplicate keyboard row id "${row.id}" — the coverage gate's needle can't tell these rows apart.`,
            path: ["rows", i, "id"],
          })
        }
        seenIds.add(row.id)

        const pairKey = `${row.part} ${[...row.keys].sort().join(",")}`
        if (seenPairs.has(pairKey)) {
          ctx.addIssue({
            code: "custom",
            message: `Duplicate part+keys pair for part "${row.part}" — the same key documented twice for one part is a contradiction.`,
            path: ["rows", i, "keys"],
          })
        }
        seenPairs.add(pairKey)
      })
    }),
])

export const componentMetaSchema = z.object({
  name: z.string().min(1),
  /** Kebab-case, must equal the component's file name (button ⇒ button.tsx). */
  slug: z.string().regex(/^[a-z0-9-]+$/),
  category: z.enum([
    "action",
    "input",
    "display",
    "feedback",
    "navigation",
    "layout",
    "overlay",
    "ai",
  ]),
  /** One or two sentences: the job, and the decision its main axis encodes. */
  purpose: z.string().min(20),
  /** Node id of the component set in the DS Draft Figma file. */
  figma: z.object({ node: z.string().regex(/^\d+:\d+$/) }).optional(),
  variants: z.array(variantAxisSchema),
  /** Interaction states are recipes, not tokens (see AGENTS.md) — each entry
   *  records the recipe so an agent doesn't invent a state token. */
  states: z.array(z.object({ state: z.string().min(1), recipe: z.string().min(1) })),
  /** Layer 2 tokens (tokens.ts cssVar names, no leading --) this component
   *  consumes, with the role each plays. Validated against tokens.ts. */
  tokens: z
    .array(z.object({ cssVar: z.string().min(1), role: z.string().min(1) }))
    .min(1),
  relationships: z.object({
    /** What it may contain. */
    contains: z.array(z.string()).default([]),
    /** Containers it is designed to sit in. */
    within: z.array(z.string()).default([]),
    /** Components it composes with by design — used TOGETHER. Not the
     *  relation a Boundary story needs (see insteadUse below); this stays
     *  legitimate data for a different purpose. */
    pairsWith: z.array(z.string()).default([]),
  }),
  /** Near-twins you might reach for instead — the opposite relation from
   *  pairsWith. `name` matches the sibling's own meta `name` (exact-name
   *  lookup, not fuzzy — see obligations.ts); `when` is the prose reason
   *  you'd pick that one. Optional/defaulted so meta files written before
   *  this field existed stay valid unchanged. Mirrors the docs pages'
   *  CompactDef `insteadUse`, promoted into the schema so the boundary
   *  obligation has real data to read instead of pairsWith's prose.
   *
   *  Deliberately at the schema root rather than inside `relationships`,
   *  decided now because moving it once 94 files carry it is far more
   *  expensive than moving it while one does. Three reasons it won:
   *  `relationships` is the composition graph — contains/within/pairsWith all
   *  answer "what does this sit with" — while insteadUse answers "what would
   *  you have reached for instead", a choosing judgment like antiPatterns;
   *  the root position mirrors the docs pages' CompactDef shape, so the
   *  parity branch's generator copies a field instead of reshaping one, and
   *  reshaping is where drift enters; and keeping it out of `relationships`
   *  keeps the two opposite relations from sitting adjacent, which is exactly
   *  the adjacency that let the boundary rule read pairsWith and derive zero. */
  insteadUse: z
    .array(z.object({ name: z.string().min(1), when: z.string().min(1) }))
    .default([]),
  /** The component's named sub-parts, in READING order — that order is the
   *  numbering the docs legend and the Figma diagram both show. Not DOM
   *  order: a card's action lives in the header markup but is met by the
   *  reader after the title and description.
   *
   *  `anchor` is a `data-slot` value the component already ships, which is
   *  what keeps the anatomy from inventing a second naming scheme; the gate
   *  in component-meta.test.ts proves the slot exists in the .tsx source.
   *
   *  `purpose` states the job of the box. It does NOT state how props change
   *  it — that is variants[].values[].intent. A purpose that reads "a boolean
   *  swaps the alignment" is a variant fact wearing an anatomy costume, and
   *  becomes the fifth copy of something the props table already carries.
   *
   *  The 20-character floor is the same device as coverageSkips.why: it makes
   *  "the title" fail Zod before any gate runs, so a part costs a sentence. */
  parts: z
    .array(
      z.object({
        name: z.string().min(1),
        anchor: z.string().min(1),
        purpose: z.string().min(20),
        presence: z
          .enum(["required", "optional", "conditional"])
          .default("required"),
        /** Required when presence is "conditional" — enforced by the gate,
         *  not by Zod, so the failure names the component and the part. */
        when: z.string().optional(),
      })
    )
    .default([]),
  /** Named compositions an agent may reproduce verbatim. */
  patterns: z.array(z.object({ name: z.string().min(1), rule: z.string().min(1) })),
  /** Explicit negatives — the highest-value content in the file. */
  antiPatterns: z
    .array(z.object({ rule: z.string().min(1), why: z.string().min(1) }))
    .min(1),
  a11y: z.array(z.string().min(1)),
  /** Obligations from the story-coverage gate that genuinely do not apply.
   *  The 20-character floor on `why` is the point: it makes "n/a" fail Zod
   *  before the gate runs, so a skip costs a sentence of thought. */
  coverageSkips: z
    .array(
      z.object({
        obligation: z.string().min(1),
        why: z.string().min(20),
      })
    )
    .default([]),
  /** Key → outcome, and where focus lands — orthogonal to `states[]`, which
   *  records the visual recipe (e.g. focus-visible ring) for the same event.
   *  Required as of sub-project B (2026-08-19): every one of the 95 real
   *  metas declares it, proven by 41 Chromium play functions. A future
   *  component without a keyboard contract now fails the meta gate instead of
   *  shipping a silent omission. Spec: research/specs/2026-08-17-keyboard-interaction-contract-design.md */
  keyboard: keyboardSchema,
})

export type ComponentMeta = z.infer<typeof componentMetaSchema>

/** The shape of a `.meta.json` file as it sits on disk — BEFORE zod applies
 *  defaults. A consumer importing the raw JSON (e.g. the Storybook overview
 *  template's `import.meta.glob`) must use this type, or TypeScript will
 *  claim schema-defaulted fields like `insteadUse` and `parts` are always
 *  present when a third of the files legitimately omit them. */
export type ComponentMetaInput = z.input<typeof componentMetaSchema>

/** Every cssVar name tokens.ts knows about, aliases included. A meta file
 *  claiming a token outside this set has fabricated one — the same rule the
 *  anti-slop spec states in prose, enforced mechanically. */
export function knownTokenCssVars(): Set<string> {
  const vars = new Set<string>()
  for (const group of [
    ...SEMANTIC_COLOR_GROUPS,
    RADIUS_GROUP,
    ...SIZE_GROUPS,
    ELEVATION_GROUP,
    FONT_GROUP,
  ]) {
    for (const token of group.tokens) vars.add(token.cssVar)
  }
  for (const alias of SHADCN_ALIASES) vars.add(alias.cssVar)
  for (const token of [...UNMAPPED_COLOR_TOKENS, ...UNMAPPED_SIZE_TOKENS]) {
    vars.add(token.cssVar)
  }
  return vars
}
