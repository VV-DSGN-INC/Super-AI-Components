import { existsSync, readFileSync, readdirSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { resolveRole } from "../../scripts/lib/resolve-roles.mjs"
import { WRITES_SLOT, componentFiles } from "../../scripts/lib/slots.mjs"
import { met, notApplicable, unmet } from "../../src/probe-kit/result.mjs"

const REFERENCE = path.join(path.dirname(fileURLToPath(import.meta.url)), "reference")
const MIN_REASON = 20

/** The part list and the recorded stream ids are read from this stage's own
 *  reference/ at run time, so adding a recording or bumping the SDK list is one
 *  edit there and the probe follows. */
export function partList() {
  return JSON.parse(readFileSync(path.join(REFERENCE, "ui-part-types.json"), "utf8"))
}

export function streamIds() {
  return readdirSync(path.join(REFERENCE, "streams"))
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.slice(0, -".json".length))
    .sort()
}

const quoted = (s) => new RegExp(`["'\`]${s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["'\`]`)
const normalize = (p) => (p.startsWith("./") ? p.slice(2) : p)
const read = (file) => {
  try {
    return readFileSync(file, "utf8")
  } catch {
    return null
  }
}

export default function probe(targetRoot, config) {
  const runtime = config.runtime ?? {}
  const results = []
  const rel = (f) => path.relative(targetRoot, f).split(path.sep).join("/")

  const files = componentFiles(targetRoot, config)
  const source = new Map(files.map((f) => [f, read(f) ?? ""]))

  // 10.1: every component file writes a data-slot, or is exempt for a reason
  // that is long enough to be one and still true.
  const exemptions = (runtime.slotExempt ?? []).map((e) => ({ ...e, file: normalize(e.file) }))
  const exempt = new Set(exemptions.map((e) => e.file))
  const missing = files.filter((f) => !WRITES_SLOT.test(source.get(f)) && !exempt.has(rel(f))).map(rel)
  const short = exemptions.filter((e) => e.reason.trim().length < MIN_REASON).map((e) => e.file)
  const stale = exemptions
    .filter((e) => {
      const text = read(path.join(targetRoot, e.file))
      return text === null || WRITES_SLOT.test(text)
    })
    .map((e) => e.file)

  if (files.length === 0) {
    results.push(
      unmet(
        "10.1",
        "the components role resolved no .tsx or .jsx component files, so there was nothing to check",
        "Point scopeRoles.components at the component sources. A gate over zero files reports clean about nothing."
      )
    )
  } else if (missing.length + short.length + stale.length === 0) {
    results.push(met("10.1"))
  } else {
    const why = [
      missing.length ? `no data-slot written: ${missing.join(", ")}` : null,
      short.length ? `exemption reason shorter than ${MIN_REASON} characters: ${short.join(", ")}` : null,
      stale.length ? `exemption no longer applies (file gone or now writes a data-slot): ${stale.join(", ")}` : null,
    ]
      .filter(Boolean)
      .join("; ")
    results.push(
      unmet(
        "10.1",
        why,
        "Write data-slot on each component's root element. A component that genuinely renders no DOM of its own goes in runtime.slotExempt with a reason a reviewer can check; delete exemptions that no longer apply."
      )
    )
  }

  // 10.2: the system names itself, and something renders that name.
  if (!runtime.systemId) {
    results.push(
      unmet(
        "10.2",
        "runtime.systemId is not declared",
        'Add runtime.systemId (lowercase, hyphenated) to ds-architecture.config.json, e.g. "my-ui".'
      )
    )
  } else {
    const carriers = files.filter((f) => /data-ds/.test(source.get(f)) && source.get(f).includes(runtime.systemId))
    results.push(
      carriers.length > 0
        ? met("10.2")
        : unmet(
            "10.2",
            `no component file writes data-ds with "${runtime.systemId}"`,
            `Have the root provider write data-ds="${runtime.systemId}" (onto <html> or its own root element) so the census can attribute every slot under it.`
          )
    )
  }

  // 10.3 and 10.4 apply only to a library that declares it renders model output.
  if (!runtime.partsRenderer) {
    const because = `${config.profile}, with no runtime.partsRenderer declared: this library renders no model output`
    results.push(notApplicable("10.3", because), notApplicable("10.4", because))
    return { stage: "10", results }
  }

  const rendererPath = normalize(runtime.partsRenderer)
  const renderer = read(path.join(targetRoot, rendererPath))
  if (renderer === null) {
    results.push(
      unmet(
        "10.3",
        `no parts renderer at ${rendererPath}`,
        "Create it: one switch over the message part's type, a component per type, and a never-typed default."
      )
    )
  } else {
    const list = partList()
    const missingTypes = [...list.types, ...list.prefixes].filter((t) => !quoted(t).test(renderer))
    const hasNever = /:\s*never\b/.test(renderer)
    const why = [
      missingTypes.length ? `part type(s) the renderer never names: ${missingTypes.join(", ")}` : null,
      hasNever ? null : "no never-typed exhaustiveness guard, so a new SDK part type would render nothing without a type error",
    ].filter(Boolean)
    results.push(
      why.length === 0
        ? met("10.3")
        : unmet(
            "10.3",
            `${why.join("; ")} (list: ${list.verifiedAgainst})`,
            "Add a case for each missing type (tool- and data- are prefixes, matched with startsWith) and end the switch with `const unhandled: never = part`."
          )
    )
  }

  const stories = resolveRole(targetRoot, config.scopeRoles?.stories ?? []).map((f) => read(f) ?? "")
  const unreplayed = streamIds().filter((id) => !stories.some((s) => s.includes(id)))
  results.push(
    stories.length === 0
      ? unmet(
          "10.4",
          "the stories role resolved no files, so no recorded stream can be replayed",
          "Declare scopeRoles.stories and add a story that replays each recording in reference/streams/ through the parts renderer."
        )
      : unreplayed.length === 0
        ? met("10.4")
        : unmet(
            "10.4",
            `recorded stream(s) no story replays: ${unreplayed.join(", ")}`,
            "Copy the recording from reference/streams/ next to the parts renderer and add a story that replays it, naming the recording by id."
          )
  )

  return { stage: "10", results }
}
