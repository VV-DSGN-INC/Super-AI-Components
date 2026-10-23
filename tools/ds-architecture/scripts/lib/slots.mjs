import { readFileSync } from "node:fs"
import path from "node:path"

import { resolveRole } from "./resolve-roles.mjs"

/** Stories, tests and specs exercise components; they are not components. */
const NOT_A_COMPONENT = /\.(stories|test|spec)\.[jt]sx$/

/** Writes the attribute in JSX (`data-slot="x"`, `data-slot={"x"}`) or as an
 *  object key (`{ "data-slot": "x" }`). Stage 10 asks only whether a file writes
 *  one, so this is deliberately looser than SLOT_VALUE below. */
export const WRITES_SLOT = /data-slot\s*=|["']data-slot["']\s*:/

const SLOT_VALUE =
  /data-slot\s*=\s*\{?\s*["'`]([a-z0-9][a-z0-9-]*)["'`]|["']data-slot["']\s*:\s*["'`]([a-z0-9][a-z0-9-]*)["'`]/g

/** A component file: `.tsx` or `.jsx` from the `components` role, minus stories,
 *  tests and specs, minus files whose name starts with `_` (fixtures, icon
 *  barrels). Shared by the stage-10 probe and the census so "what counts as a
 *  component" cannot mean two things. */
export function componentFiles(targetRoot, config) {
  return resolveRole(targetRoot, config.scopeRoles?.components ?? [])
    .filter((f) => /\.[jt]sx$/.test(f))
    .filter((f) => !NOT_A_COMPONENT.test(f))
    .filter((f) => !path.basename(f).startsWith("_"))
}

/** Literal slot names a source file writes. A computed slot
 *  (`data-slot={name}`) has no literal to read and is skipped, so a census
 *  "unused" list can over-report a component built that way, never under-report. */
export function slotsIn(source) {
  return [...source.matchAll(SLOT_VALUE)].map((m) => m[1] ?? m[2])
}

/** Every literal slot the system's component files write, sorted and unique. */
export function declaredSlots(targetRoot, config) {
  const all = componentFiles(targetRoot, config).flatMap((f) => slotsIn(readFileSync(f, "utf8")))
  return [...new Set(all)].sort()
}
