import { readFileSync } from "node:fs"
import path from "node:path"

import { declaredTokens, literalAliases, themeAliases } from "../../scripts/lib/css-tokens.mjs"
import { deadTokens } from "../../scripts/lib/liveness.mjs"
import { resolveRole } from "../../scripts/lib/resolve-roles.mjs"
import { met, unchecked, unmet } from "../../src/probe-kit/result.mjs"

const CONTRAST_HINT = /contrast/i
const LIVENESS_HINT = /liveness|consumers/i

function readIfPresent(file) {
  try {
    return readFileSync(file, "utf8")
  } catch {
    return null
  }
}

/** Shipped component source only — stories and tests are excluded because a
 *  story writing a utility proves the utility can be typed, not that anything
 *  ships it. That distinction is the whole point of the liveness walk. */
function componentSources(targetRoot, config) {
  const globs = config.scopeRoles?.components ?? []
  return resolveRole(targetRoot, globs)
    .filter((f) => !/\.(stories|test|spec)\.[jt]sx?$/.test(f))
    .map((f) => readIfPresent(f))
    .filter((s) => s !== null)
}

export default function probe(targetRoot, config) {
  const results = []

  const contractPath = path.join(targetRoot, config.paths.nameContract)
  const contract = readIfPresent(contractPath)

  results.push(
    contract !== null
      ? met("01.1")
      : unmet(
          "01.1",
          `no name-contract module at ${config.paths.nameContract}`,
          "Create it, exporting every token name. It is the contract with the design tool, so the names must match byte for byte."
        )
  )

  const css = config.paths.styleEntry
    .map((rel) => readIfPresent(path.join(targetRoot, rel)))
    .filter((s) => s !== null)
    .join("\n")

  const declared = declaredTokens(css)

  if (contract === null) {
    results.push(unchecked("01.2", "no name-contract module to compare against"))
  } else {
    const missing = declared.filter((t) => !contract.includes(t))
    results.push(
      missing.length === 0
        ? met("01.2")
        : unmet(
            "01.2",
            `declared in the style entry points but absent from the name contract: ${missing.join(", ")}`,
            "Add each name to the name contract. A token the contract does not know cannot be mirrored in the design tool, and renaming it silently breaks the sync diff."
          )
    )
  }

  const literals = literalAliases(css)
  results.push(
    literals.length === 0
      ? met("01.3")
      : unmet(
          "01.3",
          `alias(es) carrying a literal instead of a var(): ${literals.join(", ")}`,
          "Point the alias at a semantic token. An alias that restates a value is a fourth place to change a colour, and the axes cannot reach it."
        )
  )

  const testCommand = config.commands.test
  const styleFiles = resolveRole(targetRoot, config.scopeRoles?.styles ?? [])
  const allFiles = [...styleFiles, ...resolveRole(targetRoot, ["**"])]

  const hasFile = (hint) =>
    allFiles.some((f) => hint.test(path.basename(f)) && /\.test\.[jt]sx?$/.test(f))

  results.push(
    hasFile(CONTRAST_HINT)
      ? met("01.4")
      : unmet(
          "01.4",
          "no contrast test file found",
          "Add one asserting the text ramp's contrast ratios. Copy stages/01-token-contract/reference/contrast.test.ts."
        )
  )

  // Existence is settleable; coverage is not. Whether the file covers every
  // axis cell needs the target's own runner, which a dependency-free probe must
  // never invoke. Reporting met here would let one token-pair assertion look
  // identical to nine cells of coverage.
  results.push(
    unchecked(
      "01.4c",
      `coverage across all ${config.axes.reduce((n, a) => n * (a.values.length + 1), 1)} axis cells needs the target's own test runner — run \`${testCommand}\``
    )
  )

  results.push(
    hasFile(LIVENESS_HINT)
      ? met("01.5")
      : unmet(
          "01.5",
          "no liveness test file found",
          "Add one walking declaration to alias to component consumer. Copy stages/01-token-contract/reference/liveness.test.ts."
        )
  )

  const sources = componentSources(targetRoot, config)

  // Only tokens carrying an `@theme inline` alias are walked. Two kinds of name
  // are excluded because neither CAN own a utility, so demanding one would fail
  // every conformant system: a raw primitive consumed by another token
  // (`--surface-primary`, read only by `--background`), and the alias names
  // themselves (`--color-background`), which are the walk's destination rather
  // than its start. The narrowing is stated in ACCEPTANCE.md too — a liveness
  // claim narrowed to nothing still reports `met`, so what it covers has to be
  // written down where a reader will see it.
  const themed = new Set(themeAliases(css).values())
  const walked = declared.filter((t) => themed.has(t))
  const dead = deadTokens(css, walked, sources)

  results.push(
    dead.length === 0
      ? met("01.6")
      : unmet(
          "01.6",
          `token(s) reaching no consumer: ${dead.join(", ")}`,
          "Either a component must write the utility, or the token should be deleted. A token declared, themed and mirrored but read by nothing is decoration."
        )
  )

  return { stage: "01", results }
}
