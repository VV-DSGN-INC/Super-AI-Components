import { spawnSync } from "node:child_process"
import { mkdtempSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"

import { describe, expect, it } from "vitest"

import { NO_SYSTEM, censusHtml, formatCensus, runCensus } from "./census.mjs"
import { componentFiles, declaredSlots, slotsIn } from "./slots.mjs"

const TARGET = path.resolve(process.cwd(), "stages/10-runtime-identity-and-streams/__fixtures__/conformant")

const countOf = (r: any, system: string, slot: string) =>
  r.systems.find((s: any) => s.id === system)?.slots.find((s: any) => s.slot === slot)?.count ?? 0

describe("censusHtml", () => {
  it("attributes every slot to the data-ds on <html>", () => {
    const r = censusHtml(`<!doctype html><html data-ds="my-ui"><body>
      <div data-slot="card"><div data-slot="card-header"></div><button data-slot="button">a</button></div>
      <button data-slot='button'>b</button><img data-slot="avatar-image" src="x"><br>
    </body></html>`)
    expect(countOf(r, "my-ui", "button")).toBe(2)
    expect(countOf(r, "my-ui", "card")).toBe(1)
    expect(countOf(r, "my-ui", "card-header")).toBe(1)
    // A void element must not swallow the slots that follow it.
    expect(countOf(r, "my-ui", "avatar-image")).toBe(1)
    expect(r.total).toBe(5)
  })

  it("attributes by the nearest data-ds when two systems share a page", () => {
    const r = censusHtml(`<html data-ds="outer"><body>
      <div data-slot="sidebar"><section data-ds="inner"><span data-slot="badge"></span></section></div>
      <span data-slot="badge"></span>
    </body></html>`)
    expect(countOf(r, "inner", "badge")).toBe(1)
    expect(countOf(r, "outer", "badge")).toBe(1)
    expect(countOf(r, "outer", "sidebar")).toBe(1)
  })

  it("files slots with no data-ds above them under a named bucket, not under nothing", () => {
    const r = censusHtml(`<div data-slot="button"></div>`)
    expect(countOf(r, NO_SYSTEM, "button")).toBe(1)
  })

  it("ignores comments and the contents of scripts and styles", () => {
    const r = censusHtml(`<html data-ds="my-ui"><!-- <div data-slot="ghost"></div> -->
      <script>const s = '<div data-slot="ghost"></div>'</script>
      <style>[data-slot="ghost"] { color: red }</style>
      <p data-slot="real"></p></html>`)
    expect(countOf(r, "my-ui", "ghost")).toBe(0)
    expect(countOf(r, "my-ui", "real")).toBe(1)
  })
})

describe("slots", () => {
  it("lists component files without stories or underscore files", () => {
    const files = componentFiles(TARGET, { scopeRoles: { components: ["src/components/**"] } }).map((f: string) =>
      path.relative(TARGET, f)
    )
    expect(files).toContain("src/components/button.tsx")
    expect(files.some((f: string) => f.includes(".stories."))).toBe(false)
    expect(files.some((f: string) => path.basename(f).startsWith("_"))).toBe(false)
  })

  it("reads literal slot values in JSX and object-key form", () => {
    expect(slotsIn(`<div data-slot="a" /><i data-slot={"b"} />{ "data-slot": "c" }<b data-slot={name} />`)).toEqual([
      "a",
      "b",
      "c",
    ])
  })
})

describe("runCensus", () => {
  it("reports the target's declared slots the page never rendered", async () => {
    const dir = mkdtempSync(path.join(tmpdir(), "census-"))
    const page = path.join(dir, "page.html")
    writeFileSync(page, `<html data-ds="fixture-ds"><button data-slot="button"></button><div data-slot="card"></div></html>`)
    // `any` because census.mjs is plain JS under checkJs:false, so TS infers the
    // return type from the first return path, which has no `target`.
    const out: any = await runCensus(page, { target: TARGET })
    expect(out.target.systemId).toBe("fixture-ds")
    expect(out.target.used).toEqual(["button", "card"])
    expect(out.target.unused).toContain("card-header")
    expect(out.target.declared).toBe(declaredSlots(TARGET, { scopeRoles: { components: ["src/components/**"] } }).length)
    const text = formatCensus(out).join("\n")
    expect(text).toMatch(/fixture-ds/)
    expect(text).toMatch(/unused/)
  })

  it("says why nothing was attributed when the page carries no data-ds for the system", async () => {
    const dir = mkdtempSync(path.join(tmpdir(), "census-"))
    const page = path.join(dir, "page.html")
    writeFileSync(page, `<html><button data-slot="button"></button><div data-slot="card"></div></html>`)
    const text = formatCensus(await runCensus(page, { target: TARGET })).join("\n")
    expect(text).toMatch(/no element carries data-ds="fixture-ds", so 2 slot\(s\) under \(no data-ds\)/)
  })

  it("caps the unused list in the text report and points to --json for the rest", () => {
    const unused = Array.from({ length: 45 }, (_, i) => `slot-${i}`)
    const text = formatCensus({
      source: "x",
      total: 0,
      systems: [],
      target: { systemId: "my-ui", declared: 45, used: [], unused },
    }).join("\n")
    expect(text).toMatch(/unused here \(45\): slot-0,/)
    expect(text).toMatch(/and 15 more \(--json lists all\)/)
    expect(text).not.toMatch(/slot-44/)
  })

  it("throws a could-not-tell error for a missing file instead of reporting an empty page", async () => {
    await expect(runCensus("/nonexistent/page.html", {})).rejects.toThrow(/could not read/)
  })
})

describe("census through the bin", () => {
  const BIN = path.resolve(process.cwd(), "scripts/conformance.mjs")

  it("prints JSON and exits 0 for a readable page", () => {
    const dir = mkdtempSync(path.join(tmpdir(), "census-bin-"))
    const page = path.join(dir, "page.html")
    writeFileSync(page, `<html data-ds="fixture-ds"><button data-slot="button"></button></html>`)
    const run = spawnSync(process.execPath, [BIN, "census", page, "--target", TARGET, "--json"], { encoding: "utf8" })
    expect(run.status).toBe(0)
    expect(JSON.parse(run.stdout).target.used).toEqual(["button"])
  })

  it("exits 2 when the page cannot be read", () => {
    const run = spawnSync(process.execPath, [BIN, "census", "/nonexistent/page.html"], { encoding: "utf8" })
    expect(run.status).toBe(2)
    expect(run.stderr).toMatch(/could not tell/)
  })
})
