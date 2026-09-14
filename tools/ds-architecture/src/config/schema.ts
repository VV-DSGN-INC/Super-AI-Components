import { z } from "zod"

/** Closed rather than open: an open set lets a core rule name a role no target
 *  defines, and a rule scoped to nothing reports clean. Adding a role is a
 *  schema change, which is exactly the friction it deserves. */
export const SCOPE_ROLES = ["components", "styles", "stories", "docs", "app"] as const
export const PROFILES = ["tokens-only", "component-library", "app-consumer"] as const
export const ADOPTIONS = ["greenfield", "retrofit"] as const

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
    /** At least one axis. A system with no axis still has one cell; declaring
     *  zero axes hides that rather than stating it. */
    axes: z
      .array(
        z
          .object({
            attribute: z.string().regex(/^data-[a-z][a-z0-9-]*$/),
            values: z.array(z.string().min(1)).min(1),
          })
          .strict()
      )
      .min(1),
    commands: z
      .object({
        test: z.string().min(1),
        lint: z.string().min(1).optional(),
        typecheck: z.string().min(1).optional(),
      })
      .strict(),
    vendored: z.record(z.string(), z.string()).default({}),
  })
  .strict()

export type DsConfig = z.infer<typeof configSchema>

/** `+ 1` per axis because the UNSET state on each axis is a real cell that
 *  ships — two axes of two values is nine cells, not four. */
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
        minItems: 1,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["attribute", "values"],
          properties: {
            attribute: { type: "string", pattern: "^data-[a-z][a-z0-9-]*$" },
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
    },
  }
}
