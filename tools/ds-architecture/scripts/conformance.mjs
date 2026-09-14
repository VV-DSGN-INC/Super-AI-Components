import { existsSync, readdirSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { appliesToProfile, readAppliesTo, readClaims } from "./lib/applicability.mjs"
import { loadConfig } from "./lib/validate-config.mjs"
import { formatStamp, readVendorStamp } from "./vendor-stamp.mjs"
import { STATUS, exitCodeFor, notApplicable, unchecked } from "../src/probe-kit/result.mjs"

const HERE = path.dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = path.resolve(HERE, "..")
const STAGES_DIR = path.resolve(REPO_ROOT, "stages")

function discoverStages() {
  return readdirSync(STAGES_DIR)
    .filter((name) => /^\d\d-/.test(name))
    .sort()
    .map((name) => path.join(STAGES_DIR, name))
}

const empty = () => ({ met: [], unmet: [], unchecked: [], notApplicable: [] })

/** The vendor stamp rides on every returned object, including the exit-2 ones.
 *  Its comment promises it prints on every run, and `--json` is a run. A stamp
 *  that appears in one output mode and not the other is a stale copy that is
 *  visible to a human and invisible to a script. */
const withStamp = (out) => ({ ...out, vendored: readVendorStamp(REPO_ROOT) })

export async function runConformance(targetRoot, opts = {}) {
  const loaded = loadConfig(targetRoot)
  if (!loaded.ok) {
    return withStamp({ ...empty(), summary: { exitCode: 2, reason: loaded.reason } })
  }
  const config = loaded.config

  const stageDirs = (opts.stageDirs ?? discoverStages()).filter((dir) =>
    opts.stage ? path.basename(dir).startsWith(opts.stage) : true
  )

  // An explicit --stage that selects nothing is "I could not tell", not "all
  // clear". Reporting 0 here would mean a typo'd stage number certifies a repo
  // nothing was run against.
  if (opts.stage && stageDirs.length === 0) {
    return withStamp({
      ...empty(),
      summary: {
        exitCode: 2,
        reason: `--stage ${opts.stage} matched no stage directory under ${STAGES_DIR}`,
      },
    })
  }

  const buckets = empty()

  for (const dir of stageDirs) {
    const stage = path.basename(dir).slice(0, 2)
    const acceptance = path.join(dir, "ACCEPTANCE.md")
    const probeFile = path.join(dir, "acceptance.mjs")

    // A stage directory missing either file used to be `continue`d past, which
    // made a stage that reports NOTHING indistinguishable from a stage that
    // passed — the exact collapse this repo exists to prevent. Missing files
    // are an `unchecked` entry naming what is absent.
    const missing = [
      existsSync(acceptance) ? null : "ACCEPTANCE.md",
      existsSync(probeFile) ? null : "acceptance.mjs",
    ].filter(Boolean)
    if (missing.length > 0) {
      buckets.unchecked.push({
        ...unchecked(
          `${stage}.*`,
          `stage directory ${path.basename(dir)} is missing ${missing.join(" and ")}, so no claim of this stage was checked`
        ),
        stage,
      })
      continue
    }

    let appliesTo
    let declared
    try {
      appliesTo = readAppliesTo(acceptance)
      declared = readClaims(acceptance)
    } catch (err) {
      return withStamp({ ...buckets, summary: { exitCode: 2, reason: err.message } })
    }

    if (!appliesToProfile(appliesTo, config.profile)) {
      buckets.notApplicable.push({ ...notApplicable(stage, config.profile), stage })
      continue
    }

    let outcome
    try {
      const mod = await import(probeFile)
      outcome = mod.default(targetRoot, config)
    } catch (err) {
      // A probe that throws means "I could not tell", which is exit 2. Never
      // let it fall through as an absence of findings.
      return withStamp({
        ...buckets,
        summary: { exitCode: 2, reason: `stage ${stage} probe failed: ${err.message}` },
      })
    }

    const stageId = outcome.stage ?? stage
    const declaredSet = new Set(declared)
    const emittedSet = new Set(outcome.results.map((r) => r.claim))

    for (const r of outcome.results) {
      // Both directions are drift, and both land in `unchecked` rather than in
      // the bucket the probe asked for. A result nobody declared has no spec
      // text behind it; treating it as met would be a claim reporting success
      // that the stage never promised to make.
      if (!declaredSet.has(r.claim)) {
        buckets.unchecked.push({
          ...unchecked(
            r.claim,
            `the probe emitted this claim but ACCEPTANCE.md does not declare it — the probe and the spec have drifted`
          ),
          stage: stageId,
        })
        continue
      }
      const key = r.status === STATUS.NOT_APPLICABLE ? "notApplicable" : r.status
      buckets[key].push({ ...r, stage: stageId })
    }

    for (const claim of declared) {
      if (emittedSet.has(claim)) continue
      buckets.unchecked.push({
        ...unchecked(
          claim,
          `ACCEPTANCE.md declares this claim but the probe emitted no result for it — a claim nothing looked at`
        ),
        stage: stageId,
      })
    }
  }

  const byStageThenClaim = (a, b) =>
    a.stage === b.stage ? a.claim.localeCompare(b.claim) : a.stage.localeCompare(b.stage)
  for (const key of Object.keys(buckets)) buckets[key].sort(byStageThenClaim)

  const unmetStages = new Set(buckets.unmet.map((r) => r.stage))
  // A stage is "determined" only if something actually decided one of its
  // claims. A stage whose every result is `unchecked` decided nothing, and a
  // stage nothing determined is not a stage reached — later stages will emit
  // `unchecked` by design, so treating it as transparent would let contiguity
  // step straight over them.
  const determined = new Set([...buckets.met, ...buckets.unmet].map((r) => r.stage))
  const seen = [
    ...new Set([...buckets.met, ...buckets.unmet, ...buckets.unchecked].map((r) => r.stage)),
  ].sort()

  let highestContiguous = null
  for (const stage of seen) {
    if (!determined.has(stage) || unmetStages.has(stage)) break
    highestContiguous = stage
  }

  const allResults = [
    ...buckets.met,
    ...buckets.unmet,
    ...buckets.unchecked,
    ...buckets.notApplicable,
  ]

  return withStamp({
    ...buckets,
    summary: {
      // One definition of the exit-code contract, in result.mjs. Restating the
      // rule here is how the two drift apart.
      exitCode: exitCodeFor(allResults),
      profile: config.profile,
      adoption: config.adoption,
      stagesReached: seen.filter((s) => determined.has(s) && !unmetStages.has(s)),
      highestContiguous,
    },
  })
}

/** Separated from printing so the four sections are assertable without a
 *  process boundary. */
export function formatReport(out) {
  const lines = []
  for (const key of ["met", "unmet", "unchecked", "notApplicable"]) {
    if (out[key].length === 0) continue
    lines.push(`${key}:`)
    for (const r of out[key]) {
      // r.claim already carries its stage prefix ("00.5"); prefixing again
      // renders "00.00.5".
      // An `unchecked` result printed as a bare claim id is the silence this
      // whole repo argues against: a claim nothing looked at, rendered exactly
      // like a claim nobody needed to explain. The reason IS the finding.
      const detail = r.why ?? r.reason ?? (r.profile ? `not applicable under ${r.profile}` : null)
      const why = detail ? ` — ${detail}` : ""
      const fix = r.fix ? `\n      fix: ${r.fix}` : ""
      lines.push(`  ${r.claim}${why}${fix}`)
    }
  }
  // On a could-not-tell run there is no profile and no ladder position to
  // report, and printing `profile=undefined highestContiguous=undefined` states
  // three facts the run never established.
  lines.push(
    out.summary.reason
      ? `summary: could not tell — ${out.summary.reason}`
      : `summary: profile=${out.summary.profile} adoption=${out.summary.adoption} ` +
        `highestContiguous=${out.summary.highestContiguous}`
  )
  lines.push(formatStamp(out.vendored ?? readVendorStamp(REPO_ROOT)))
  return lines
}

function render(out) {
  if (out.summary.reason) console.error(`could not tell: ${out.summary.reason}`)
  for (const line of formatReport(out)) console.log(line)
}

const invokedDirectly =
  process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))

if (invokedDirectly) {
  const args = process.argv.slice(2)
  const target = args.find((a) => !a.startsWith("--"))
  if (!target) {
    console.error("usage: node scripts/conformance.mjs <targetRoot> [--stage NN] [--json]")
    process.exit(2)
  }
  const stageArg = args.indexOf("--stage")
  const out = await runConformance(path.resolve(target), {
    stage: stageArg >= 0 ? args[stageArg + 1] : undefined,
  })
  if (args.includes("--json")) console.log(JSON.stringify(out, null, 2))
  else render(out)
  process.exit(out.summary.exitCode)
}
