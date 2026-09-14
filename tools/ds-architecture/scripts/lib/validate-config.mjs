import { readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const SCHEMA_PATH = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../src/config/config.schema.json"
)

export const CONFIG_FILENAME = "ds-architecture.config.json"

/** Keys this validator actually implements. Anything else is a construct it
 *  would silently ignore, and silently ignoring a constraint means reporting a
 *  wrong value as valid — the collapse this repo exists to prevent, one layer
 *  down in the tool that gates every other check. */
const HANDLED_KEYS = new Set([
  "$schema",
  "title",
  "description",
  "type",
  "enum",
  "required",
  "properties",
  "items",
  "minLength",
  "minItems",
  "pattern",
  "additionalProperties",
  "propertyNames",
  "patternProperties",
])

const HANDLED_TYPES = new Set(["string", "array", "object"])

/** A deliberately small JSON Schema subset: object, string, array, enum,
 *  required, minLength, minItems, pattern, additionalProperties, propertyNames,
 *  patternProperties. That is everything toJsonSchema() emits. Anything wider
 *  would be a general validator, which is a dependency in disguise.
 *
 *  The subset is CLOSED, and enforced by throwing. Returning `[]` for a
 *  construct it does not understand — `oneOf`, a bare `minLength` with no
 *  `type`, `type: "integer"` — makes an unimplemented constraint
 *  indistinguishable from a satisfied one. Widening the subset must be a
 *  deliberate edit here, announced by a failing run rather than by nothing. */
export function validateAgainst(schema, value, where = "") {
  const errors = []
  const at = (key) => (where ? `${where}.${key}` : key)
  const site = where || "<root>"

  const unsupported = Object.keys(schema).filter((k) => !HANDLED_KEYS.has(k))
  if (unsupported.length > 0) {
    throw new Error(
      `schema at ${site} uses unsupported construct(s): ${unsupported.join(", ")} — this validator implements a closed subset, so widening it must be deliberate`
    )
  }
  if (schema.type !== undefined && !HANDLED_TYPES.has(schema.type)) {
    throw new Error(
      `schema at ${site} declares unsupported type "${schema.type}" — this validator implements ${[...HANDLED_TYPES].join(", ")} only`
    )
  }
  if (schema.type === undefined && schema.enum === undefined) {
    throw new Error(
      `schema at ${site} declares neither type nor enum, so nothing about the value would be checked`
    )
  }

  if (schema.enum && !schema.enum.includes(value)) {
    return [`${where || "value"} must be one of ${schema.enum.join(", ")}`]
  }

  if (schema.type === "string") {
    if (typeof value !== "string") return [`${where || "value"} must be a string`]
    if (schema.minLength && value.length < schema.minLength) {
      errors.push(`${where} must be at least ${schema.minLength} character(s)`)
    }
    if (schema.pattern && !new RegExp(schema.pattern).test(value)) {
      errors.push(`${where} must match ${schema.pattern}`)
    }
    return errors
  }

  if (schema.type === "array") {
    if (!Array.isArray(value)) return [`${where || "value"} must be an array`]
    if (schema.minItems && value.length < schema.minItems) {
      errors.push(`${where} must have at least ${schema.minItems} item(s)`)
    }
    if (schema.items) {
      value.forEach((item, i) =>
        errors.push(...validateAgainst(schema.items, item, `${where}[${i}]`))
      )
    }
    return errors
  }

  if (schema.type === "object") {
    if (value === null || typeof value !== "object" || Array.isArray(value)) {
      return [`${where || "value"} must be an object`]
    }
    for (const key of schema.required ?? []) {
      if (!(key in value)) errors.push(`${at(key)} is required`)
    }
    const known = new Set(Object.keys(schema.properties ?? {}))
    for (const [key, child] of Object.entries(value)) {
      if (schema.propertyNames?.enum && !schema.propertyNames.enum.includes(key)) {
        errors.push(`${at(key)} is not one of ${schema.propertyNames.enum.join(", ")}`)
        continue
      }
      if (schema.properties?.[key]) {
        errors.push(...validateAgainst(schema.properties[key], child, at(key)))
        continue
      }
      const pattern = Object.entries(schema.patternProperties ?? {}).find(([re]) =>
        new RegExp(re).test(key)
      )
      if (pattern) {
        errors.push(...validateAgainst(pattern[1], child, at(key)))
        continue
      }
      if (schema.additionalProperties === false && !known.has(key)) {
        errors.push(`${at(key)} is not a known key`)
      } else if (typeof schema.additionalProperties === "object") {
        errors.push(...validateAgainst(schema.additionalProperties, child, at(key)))
      }
    }
    return errors
  }

  return errors
}

/** Returns a discriminated result rather than throwing, because the caller has
 *  to turn "no config" into exit 2 and must not confuse it with exit 1. That
 *  promise covers every failure path, including an unreadable or malformed
 *  schema file — `schemaPath` is a parameter so those paths are testable
 *  without corrupting the shipped schema. */
export function loadConfig(targetRoot, schemaPath = SCHEMA_PATH) {
  const file = path.join(targetRoot, CONFIG_FILENAME)
  let raw
  try {
    raw = readFileSync(file, "utf8")
  } catch {
    return { ok: false, reason: `no ${CONFIG_FILENAME} at ${targetRoot}` }
  }

  let parsed
  try {
    parsed = JSON.parse(raw)
  } catch (err) {
    return { ok: false, reason: `${CONFIG_FILENAME} could not be parsed: ${err.message}` }
  }

  // Both reads below can throw, and this function is documented as returning a
  // discriminated result rather than throwing — a caller that has to turn "no
  // config" into exit 2 must not be handed an exception from a third path.
  let schema
  try {
    schema = JSON.parse(readFileSync(schemaPath, "utf8"))
  } catch (err) {
    return { ok: false, reason: `the config schema at ${schemaPath} could not be read: ${err.message}` }
  }

  let errors
  try {
    errors = validateAgainst(schema, parsed)
  } catch (err) {
    return { ok: false, reason: `${CONFIG_FILENAME} could not be validated: ${err.message}` }
  }
  if (errors.length > 0) {
    return { ok: false, reason: `${CONFIG_FILENAME} is invalid: ${errors.join("; ")}` }
  }

  return { ok: true, config: { vendored: {}, ...parsed } }
}
