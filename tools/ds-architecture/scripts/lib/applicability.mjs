import { readFileSync } from "node:fs"

const PROFILES = ["tokens-only", "component-library", "app-consumer"]

/** A claim id is `NN.n`. Validated rather than trusted, because the whole point
 *  of declaring the list is to cross-check it against what a probe emits — and a
 *  malformed id can never match, so it would silently report the stage's own
 *  claim as never emitted. */
const CLAIM_ID_RE = /^\d\d\.\d+$/

/** Reads one list-valued key out of an `ACCEPTANCE.md` frontmatter block.
 *  Shared by `readAppliesTo` and `readClaims` so the two cannot drift on which
 *  spellings they accept — bracketed, dashed, LF or CRLF.
 *
 *  \r?\n throughout: a CRLF file failing this match reports "no frontmatter"
 *  about a file that HAS frontmatter — a diagnostic that is actively wrong,
 *  which is worse than no diagnostic in a tool whose thesis is that a check
 *  must never lie about what it saw. */
function readFrontmatterList(acceptancePath, key) {
  const text = readFileSync(acceptancePath, "utf8")
  const frontmatter = text.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (!frontmatter) {
    throw new Error(`${acceptancePath}: no frontmatter, so no ${key} — declare it explicitly`)
  }

  const inline = frontmatter[1].match(new RegExp(String.raw`^${key}:\s*\[([^\]]*)\]`, "m"))
  const dashed = frontmatter[1].match(
    new RegExp(String.raw`^${key}:\s*\r?\n((?:\s*-\s*\S+\r?\n?)+)`, "m")
  )

  if (inline) {
    return inline[1]
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  }
  if (dashed) {
    return dashed[1]
      .split(/\r?\n/)
      .map((l) => l.replace(/^\s*-\s*/, "").trim())
      .filter(Boolean)
  }
  throw new Error(`${acceptancePath}: frontmatter has no ${key} key`)
}

/** Throwing rather than defaulting is the point. A stage authored without
 *  `appliesTo` would default to "applies to everything", which is wrong for six
 *  of the ten stages — and wrong silently, which is the failure mode this whole
 *  repo exists to prevent. */
export function readAppliesTo(acceptancePath) {
  const values = readFrontmatterList(acceptancePath, "appliesTo")

  // A stage that applies to no profile never runs and never reports, which is
  // indistinguishable from a stage that passed — the silent skip this repo
  // exists to catch. Emptying the list is not how you park a stage.
  if (values.length === 0) {
    throw new Error(`${acceptancePath}: appliesTo is empty — a stage that applies to no profile never runs and never reports`)
  }

  const unknown = values.filter((v) => !PROFILES.includes(v))
  if (unknown.length > 0) {
    throw new Error(`${acceptancePath}: unknown profile(s) ${unknown.join(", ")}`)
  }
  return values
}

/** The claim ids the stage's probe MUST emit, declared as data in frontmatter
 *  rather than parsed back out of the prose below it. Promoting the datum the
 *  machine needs is a lesson already paid for elsewhere in this architecture:
 *  a needle built by parsing human prose is right by luck on some inputs and
 *  permanently wrong on the rest, with nothing telling the two apart.
 *
 *  Strict for the same reason `appliesTo` is: without a declared list, a probe
 *  that quietly stops emitting a claim is invisible — the claim simply does not
 *  appear in any section, which reads exactly like a stage that had nothing to
 *  say. */
export function readClaims(acceptancePath) {
  const values = readFrontmatterList(acceptancePath, "claims")

  if (values.length === 0) {
    throw new Error(`${acceptancePath}: claims is empty — a stage that declares no claims can never be cross-checked against its probe`)
  }

  const malformed = values.filter((v) => !CLAIM_ID_RE.test(v))
  if (malformed.length > 0) {
    throw new Error(`${acceptancePath}: malformed claim id(s) ${malformed.join(", ")} — expected NN.n`)
  }

  const duplicates = values.filter((v, i) => values.indexOf(v) !== i)
  if (duplicates.length > 0) {
    throw new Error(`${acceptancePath}: duplicate claim id(s) ${[...new Set(duplicates)].join(", ")}`)
  }
  return values
}

export function appliesToProfile(appliesTo, profile) {
  return appliesTo.includes(profile)
}
