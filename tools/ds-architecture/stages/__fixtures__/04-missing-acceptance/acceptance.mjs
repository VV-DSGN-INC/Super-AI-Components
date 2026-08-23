import { met } from "../../../src/probe-kit/result.mjs"

/** A probe with no ACCEPTANCE.md: nothing declares what it must emit, so
 *  nothing can tell whether it emitted all of it. */
export default function probe() {
  return { stage: "04", results: [met("04.1")] }
}
