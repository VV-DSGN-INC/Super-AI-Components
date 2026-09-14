import { unchecked } from "../../../src/probe-kit/result.mjs"

/** A stage that determines nothing. Later stages will do this by design —
 *  `rendered` and `judgment` claims need the target's own runner. Contiguity
 *  must break here, not step over it. */
export default function probe() {
  return { stage: "01", results: [unchecked("01.1", "needs the target's own runner")] }
}
