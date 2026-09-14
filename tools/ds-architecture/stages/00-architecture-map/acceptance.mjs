import { existsSync, readFileSync } from "node:fs"
import path from "node:path"

import { unresolvedRoles } from "../../scripts/lib/resolve-roles.mjs"
import { loadConfig } from "../../scripts/lib/validate-config.mjs"
import { met, unchecked, unmet } from "../../src/probe-kit/result.mjs"

const INSTRUCTION_FILES = ["AGENTS.md", "CLAUDE.md"]

/** A backticked shell command containing a known runner. Deliberately loose:
 *  the claim is that a runnable command is STATED, not that it is any
 *  particular one — a system whose done is `make check` is conformant.
 *
 *  Exported because `reference.test.ts` asserts the shipped template passes
 *  *these* checks. Its own copy of the patterns made that claim false: the
 *  regexes could be changed to something impossible here and the test stayed
 *  green, testing a constant against a constant. */
export const COMMAND_RE = /`[^`\n]*\b(npm|pnpm|yarn|bun|make|cargo|just)\b[^`\n]*`/
export const SPEC_RE = /specs?\//i
export const PLAN_RE = /plans?\//i

export default function probe(targetRoot, config) {
  const results = []

  const instructionFile = INSTRUCTION_FILES.map((f) => path.join(targetRoot, f)).find(existsSync)

  results.push(
    instructionFile
      ? met("00.1")
      : unmet(
          "00.1",
          `no ${INSTRUCTION_FILES.join(" or ")} at the target root`,
          "Copy stages/00-architecture-map/reference/AGENTS.md.template and fill it in."
        )
  )

  // With no instructions file there is nothing to read, so 00.2 and 00.3 are
  // UNCHECKED rather than unmet. "I could not look" and "I looked and it is
  // missing" are different facts, and this is the same distinction the rule
  // detector draws between a judgment rule and a violation. It also keeps every
  // nonconformant fixture a single-fault fixture.
  const NO_FILE = "no instructions file to read"

  if (!instructionFile) {
    results.push(unchecked("00.2", NO_FILE), unchecked("00.3", NO_FILE))
  } else {
    const text = readFileSync(instructionFile, "utf8")

    results.push(
      COMMAND_RE.test(text)
        ? met("00.2")
        : unmet(
            "00.2",
            "the instructions file states no runnable definition of done",
            "Add one line naming the command, e.g. `npm run lint && npm run typecheck && npm test`."
          )
    )

    results.push(
      SPEC_RE.test(text) && PLAN_RE.test(text)
        ? met("00.3")
        : unmet(
            "00.3",
            "the instructions file does not say where specs and plans live",
            "Add a Layout section naming both directories, e.g. research/specs/ and research/plans/."
          )
    )
  }

  // 00.4 is checked HERE, not inferred from the caller. Returning met()
  // because "the runner validated before dispatch" is a claim reporting
  // success with nothing having inspected it — the exact defect this repo
  // exists to catch — and it rests on the assumption that the runner is the
  // only call path. The runner does validate too; this second read is one file
  // and one JSON.parse, and it is what makes the probe honest when called
  // directly and testable in isolation.
  const configOnDisk = loadConfig(targetRoot)
  results.push(
    configOnDisk.ok
      ? met("00.4")
      : unmet(
          "00.4",
          configOnDisk.reason,
          "Add or repair ds-architecture.config.json at the target root; copy stages/00-architecture-map/reference/ds-architecture.config.example.json."
        )
  )

  // A config with no scope roles is well-formed — the schema is right not to
  // reject it — but `unresolvedRoles` then maps over zero entries and returns
  // an empty list, which reads identically to "every role resolved". A target
  // with no `src/` at all would report 00.5 met with nothing having been
  // inspected. Nothing scoped is a conformance answer, and the answer is no.
  const declaredRoles = Object.keys(config.scopeRoles ?? {})
  const unresolved = declaredRoles.length === 0 ? [] : unresolvedRoles(targetRoot, config.scopeRoles)
  results.push(
    declaredRoles.length === 0
      ? unmet(
          "00.5",
          "the config declares no scope roles, so this claim inspected nothing — an empty scopeRoles map is not every role resolving",
          'Declare at least one scope role in ds-architecture.config.json, e.g. "scopeRoles": { "components": ["src/components/**"] }.'
        )
      : unresolved.length === 0
        ? met("00.5")
        : unmet(
            "00.5",
            `scope role(s) resolve to no existing path: ${unresolved.join(", ")}`,
            "Point the role at a directory that exists, or remove it. A role matching nothing makes every downstream probe scan nothing and report clean."
          )
  )

  results.push(
    config.profile && config.adoption
      ? met("00.6")
      : unmet(
          "00.6",
          "the config declares no profile or no adoption mode",
          'Add "profile" and "adoption" to ds-architecture.config.json.'
        )
  )

  return { stage: "00", results }
}
