import { z } from "zod"

/** Closed rather than open: an open set lets a core rule name a role no target
 *  defines, and a rule scoped to nothing reports clean. Adding a role is a
 *  schema change, which is exactly the friction it deserves. */
export const SCOPE_ROLES = ["components", "styles", "stories", "docs", "app"] as const
export const PROFILES = ["tokens-only", "component-library", "app-consumer"] as const
export const ADOPTIONS = ["greenfield", "retrofit"] as const

/** A `data-*` attribute, or `class`. `html.dark` is the single-attribute
 *  selector `[class~="dark"]`, so a class axis obeys the same rule a data-*
 *  axis does; the data-* pattern alone was narrower than the rule it encoded.
 *  Unlike a data-* attribute, `class` can carry more than one axis at once
 *  (`class="dark dense"`), so `attribute` identifies an axis only when it is a
 *  data-* name. One string feeds both the zod schema and the emitted JSON, so
 *  the two cannot drift apart on it. */
export const AXIS_ATTRIBUTE = "^(data-[a-z][a-z0-9-]*|class)$"

/** The id a library writes into `data-ds` (stage 10). Lowercase and hyphenated
 *  so it is safe as an attribute value and as a census grouping key. */
export const SYSTEM_ID = "^[a-z][a-z0-9-]*$"

const globList = z.array(z.string().min(1)).min(1)

export const configSchema = z
  .object({
    profile: z.enum(PROFILES),
    adoption: z.enum(ADOPTIONS),
    /** Partial: a target declares only the roles it has. Every declared role
     *  must resolve to a real path — checked at run time, not here, because
     *  the schema cannot see the filesystem. */
    scopeRoles: z.record(z.enum(SCOPE_ROLES), globList),
    paths: z
      .object({
        nameContract: z.string().min(1),
        styleEntry: z.array(z.string().min(1)).min(1),
        metaGlob: z.string().min(1).optional(),
      })
      .strict(),
    /** Required, and may be empty. A system with no axis has one cell, and
     *  `[]` is how it says so; the key stays required so nobody says it by
     *  omission. Requiring at least one axis made two cells the smallest
     *  statable system, so a single-theme site had to record a placeholder
     *  axis that doubled its cell count. */
    axes: z.array(
      z
        .object({
          attribute: z.string().regex(new RegExp(AXIS_ATTRIBUTE)),
          values: z.array(z.string().min(1)).min(1),
        })
        .strict()
    ),
    commands: z
      .object({
        test: z.string().min(1),
        lint: z.string().min(1).optional(),
        typecheck: z.string().min(1).optional(),
      })
      .strict(),
    vendored: z.record(z.string(), z.string()).default({}),
    /** Stage 10. Optional so every existing target stays valid; stage 10 reports
     *  what is missing as unmet rather than letting the schema reject the file,
     *  because "not yet declared" is a finding and an invalid config is exit 2.
     *  For the same reason an exemption's reason is only required non-empty here:
     *  the 20-character floor is a claim the probe reports, not a parse error. */
    runtime: z
      .object({
        systemId: z.string().regex(new RegExp(SYSTEM_ID)).optional(),
        slotExempt: z
          .array(z.object({ file: z.string().min(1), reason: z.string().min(1) }).strict())
          .optional(),
        partsRenderer: z.string().min(1).optional(),
      })
      .strict()
      .optional(),
  })
  .strict()

export type DsConfig = z.infer<typeof configSchema>

/** `+ 1` per axis because the UNSET state on each axis is a real cell that
 *  ships — two axes of two values is nine cells, not four. A class axis counts
 *  the same way (`.dark` set, and absent), and zero axes is the one cell. */
export function cellCount(axes: DsConfig["axes"]): number {
  return axes.reduce((n, axis) => n * (axis.values.length + 1), 1)
}

/** Hand-written rather than generated from zod: the emitted subset is small and
 *  fixed, and a generator would be a dependency the runner must not inherit.
 *  emit.test.ts is what keeps this honest against the zod schema above. */
export function toJsonSchema() {
  return {
    $schema: "http://json-schema.org/draft-07/schema#",
    type: "object",
    additionalProperties: false,
    required: ["profile", "adoption", "scopeRoles", "paths", "axes", "commands"],
    properties: {
      profile: { type: "string", enum: [...PROFILES] },
      adoption: { type: "string", enum: [...ADOPTIONS] },
      scopeRoles: {
        type: "object",
        additionalProperties: false,
        propertyNames: { enum: [...SCOPE_ROLES] },
        patternProperties: {
          "^(components|styles|stories|docs|app)$": {
            type: "array",
            minItems: 1,
            items: { type: "string", minLength: 1 },
          },
        },
      },
      paths: {
        type: "object",
        additionalProperties: false,
        required: ["nameContract", "styleEntry"],
        properties: {
          nameContract: { type: "string", minLength: 1 },
          styleEntry: { type: "array", minItems: 1, items: { type: "string", minLength: 1 } },
          metaGlob: { type: "string", minLength: 1 },
        },
      },
      axes: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["attribute", "values"],
          properties: {
            attribute: { type: "string", pattern: AXIS_ATTRIBUTE },
            values: { type: "array", minItems: 1, items: { type: "string", minLength: 1 } },
          },
        },
      },
      commands: {
        type: "object",
        additionalProperties: false,
        required: ["test"],
        properties: {
          test: { type: "string", minLength: 1 },
          lint: { type: "string", minLength: 1 },
          typecheck: { type: "string", minLength: 1 },
        },
      },
      vendored: { type: "object", additionalProperties: { type: "string" } },
      runtime: {
        type: "object",
        additionalProperties: false,
        properties: {
          systemId: { type: "string", pattern: SYSTEM_ID },
          slotExempt: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["file", "reason"],
              properties: {
                file: { type: "string", minLength: 1 },
                reason: { type: "string", minLength: 1 },
              },
            },
          },
          partsRenderer: { type: "string", minLength: 1 },
        },
      },
    },
  }
}
