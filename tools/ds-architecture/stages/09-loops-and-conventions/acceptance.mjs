import { existsSync, readFileSync } from "node:fs"
import path from "node:path"

import { met, unchecked, unmet } from "../../src/probe-kit/result.mjs"

const INSTRUCTION_FILES = ["AGENTS.md", "CLAUDE.md"]

/** Coarse on purpose. These claims check that a decision was RECORDED, not that
 *  it was recorded well — a convention nobody wrote down gets re-litigated every
 *  session, while one written badly at least has a place to be argued with.
 *  Tightening these into prose-quality judgements would make them `judgment`
 *  checks, which belong to a skill and not to a probe. */
const CHECKS = [
  {
    claim: "09.1",
    all: [/build loop/i, /audit loop/i, /human gate/i],
    why: "the instructions file does not describe both loops and the human gate",
    fix: "Add a Loops section naming the build loop, the audit loop, and the human gate. Copy stages/09-loops-and-conventions/reference/AGENTS.md.section.",
  },
  {
    claim: "09.2",
    all: [/five co-located files|five files/i],
    why: "the five co-located files a component change produces are not named",
    fix: "Name them in the build loop: implementation, meta, tokens, stories, tests.",
  },
  {
    claim: "09.3",
    all: [/round\s*3|rounds?\s*1[–-]2/i, /blocker/i],
    why: "no review-round budget is written down",
    fix: "State that rounds 1-2 fix everything worth fixing, that from round 3 a non-blocker becomes a follow-up, and what counts as a blocker.",
  },
  {
    claim: "09.4",
    all: [/worktree/i, /install/i],
    why: "worktree isolation and per-checkout install discipline are not written down",
    fix: "State that concurrent sessions each work in their own worktree, and that every checkout needs its own dependency install.",
  },
]

export default function probe(targetRoot, config) {
  const file = INSTRUCTION_FILES.map((f) => path.join(targetRoot, f)).find(existsSync)

  // No file means nothing could be looked at. Every claim is unchecked rather
  // than unmet — the same distinction stage 00 draws, and the reason every
  // nonconformant fixture here stays single-fault.
  if (!file) {
    return {
      stage: "09",
      results: CHECKS.map((c) => unchecked(c.claim, "no instructions file to read")),
    }
  }

  const text = readFileSync(file, "utf8")
  return {
    stage: "09",
    results: CHECKS.map((c) =>
      c.all.every((re) => re.test(text)) ? met(c.claim) : unmet(c.claim, c.why, c.fix)
    ),
  }
}
