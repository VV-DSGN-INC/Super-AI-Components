// Shape check for rules/core.json. validateRegistry returns a list of
// problems; an empty list means the registry is valid.
//
// Pattern strings are JavaScript regular-expression source and compile with
// the "u" flag. A co-occur rule fires on a file that matches `when` and does
// not match `must`.

export const AREAS = ["EFF", "TYP", "LAY", "CMP", "ICO", "MOT", "CPY", "CHT", "STA", "RSP"]
export const TIERS = ["floor", "reflex", "finish"]
export const KINDS = ["pattern", "co-occur", "render", "judgment"]
export const REQUIRES = ["tokens", "scale", "loaders"]

const ID = new RegExp(`^(${AREAS.join("|")})-[1-9]\\d*$`)
const isText = (v) => typeof v === "string" && v.trim() !== ""
const isTextList = (v) => Array.isArray(v) && v.length > 0 && v.every(isText)

function regexProblem(label, source) {
  if (!isText(source)) return `${label} must be a non-empty string`
  try {
    new RegExp(source, "u")
  } catch (e) {
    return `${label} does not compile: ${e.message}`
  }
  return null
}

function checkDetect(id, detect, problems) {
  if (!detect || typeof detect !== "object") return problems.push(`${id}: detect must be an object`)
  if (!KINDS.includes(detect.kind)) return problems.push(`${id}: detect.kind must be one of ${KINDS.join(", ")}`)
  const need = (cond, msg) => cond || problems.push(`${id}: ${msg}`)
  if (detect.kind === "pattern") {
    const p = regexProblem("detect.pattern", detect.pattern)
    if (p) problems.push(`${id}: ${p}`)
    need(isTextList(detect.files), "detect.files must be a non-empty list of globs")
  } else if (detect.kind === "co-occur") {
    for (const key of ["when", "must"]) {
      const p = regexProblem(`detect.${key}`, detect[key])
      if (p) problems.push(`${id}: ${p}`)
    }
    need(isTextList(detect.files), "detect.files must be a non-empty list of globs")
  } else if (detect.kind === "render") {
    need(isText(detect.check), "detect.check must be a non-empty string")
  } else {
    need(isText(detect.how), "detect.how must be a non-empty string")
  }
  if (detect.requires !== undefined) {
    need(["pattern", "co-occur"].includes(detect.kind), "detect.requires only applies to pattern and co-occur rules")
    need(REQUIRES.includes(detect.requires), `detect.requires must be one of ${REQUIRES.join(", ")}`)
  }
}

export function validateRegistry(json) {
  const problems = []
  if (!json || typeof json !== "object") return ["registry must be an object"]
  if (json.version !== 1) problems.push("version must be 1")
  if (!Array.isArray(json.rules)) return [...problems, "rules must be an array"]
  const seen = new Set()
  for (const [i, rule] of json.rules.entries()) {
    const id = rule && typeof rule.id === "string" ? rule.id : `rules[${i}]`
    if (!rule || typeof rule !== "object") {
      problems.push(`${id}: rule must be an object`)
      continue
    }
    if (!ID.test(rule.id ?? "")) problems.push(`${id}: id must look like EFF-1`)
    else if (seen.has(rule.id)) problems.push(`${id}: duplicate id`)
    else seen.add(rule.id)
    if (!AREAS.includes(rule.area)) problems.push(`${id}: area must be one of ${AREAS.join(", ")}`)
    else if (ID.test(rule.id ?? "") && !rule.id.startsWith(`${rule.area}-`)) problems.push(`${id}: id prefix does not match area ${rule.area}`)
    if (!TIERS.includes(rule.tier)) problems.push(`${id}: tier must be one of ${TIERS.join(", ")}`)
    for (const key of ["title", "fix", "why"]) if (!isText(rule[key])) problems.push(`${id}: ${key} must be a non-empty string`)
    if (rule.fixtures !== undefined && !isTextList(rule.fixtures)) problems.push(`${id}: fixtures must be a non-empty list of paths`)
    checkDetect(id, rule.detect, problems)
  }
  return problems
}
