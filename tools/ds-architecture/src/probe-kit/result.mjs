/** The four states a claim can be in. `unchecked` and `notApplicable` exist
 *  because a claim nothing looked at must never be indistinguishable from a
 *  claim that passed — the whole architecture turns on that distinction. */
export const STATUS = {
  MET: "met",
  UNMET: "unmet",
  UNCHECKED: "unchecked",
  NOT_APPLICABLE: "notApplicable",
}

export function met(claim) {
  return { status: STATUS.MET, claim }
}

/** `fix` is required by convention here for the same reason the rule catalogue
 *  requires it: a finding without a remedy is a complaint. */
export function unmet(claim, why, fix) {
  return { status: STATUS.UNMET, claim, why, fix }
}

export function unchecked(claim, reason) {
  return { status: STATUS.UNCHECKED, claim, reason }
}

export function notApplicable(claim, profile) {
  return { status: STATUS.NOT_APPLICABLE, claim, profile }
}

/** Exit 1 iff something is actually unmet. Exit 2 is deliberately NOT reachable
 *  from here — it means "I could not tell", which is a property of the caller
 *  (a throw, a missing config), not of a result set. */
export function exitCodeFor(results) {
  return results.some((r) => r.status === STATUS.UNMET) ? 1 : 0
}
