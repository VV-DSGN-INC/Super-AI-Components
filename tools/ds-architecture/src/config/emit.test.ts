import { readFileSync, writeFileSync } from "node:fs"
import path from "node:path"

import { describe, expect, it } from "vitest"

import { toJsonSchema } from "./schema"

/** Doubles as the emitter under CONFIG_SCHEMA_EMIT=1. Same idiom as the rule
 *  catalogue's emit gate: one file is the source, the other is committed, and
 *  the test is what stops them drifting. */
const target = path.resolve(process.cwd(), "src/config/config.schema.json")

describe("config.schema.json", () => {
  it("matches its TypeScript source", () => {
    const emitted = JSON.stringify(toJsonSchema(), null, 2) + "\n"
    if (process.env.CONFIG_SCHEMA_EMIT === "1") {
      writeFileSync(target, emitted)
      return
    }
    expect(readFileSync(target, "utf8")).toBe(emitted)
  })
})
