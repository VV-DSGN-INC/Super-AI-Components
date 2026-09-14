import { met } from "../../../src/probe-kit/result.mjs"

/** Drift in both directions at once: `05.2` is declared and never emitted,
 *  `05.9` is emitted and never declared. */
export default function probe() {
  return { stage: "05", results: [met("05.1"), met("05.9")] }
}
