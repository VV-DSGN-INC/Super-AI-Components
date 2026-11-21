import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { describe, expect, it } from "vitest";

const REPO = resolve(__dirname, "../../../..");

/** AGENTS.md is injected into every agent context on every task, and
 *  re-injected after every autocompact, so its byte count is a tax every
 *  session pays before it reads a line of code. The ceiling ratchets DOWN
 *  only: lowering it is a normal commit, raising it is an edit to this line
 *  that shows up in review as its own decision.
 *
 *  Deliberately not sufficient on its own: agents-provenance.test.ts is the
 *  other half, since ungated prose weighs bytes too. */
const CEILING = 11_500;
/** The file must sit within this many bytes of the ceiling, so the ceiling
 *  ratchets down as the file shrinks instead of sitting idle. */
const HEADROOM = 2_000;

/** CLAUDE.md measured 14,499 bytes before the split. The control below
 *  asserts the pre-split file would fail the ceiling. */
const PRE_SPLIT_BYTES = 14_499;

describe("AGENTS.md size", () => {
  const size = () => Buffer.byteLength(readFileSync(join(REPO, "AGENTS.md")));

  it(`is under the ceiling (${CEILING} bytes; the constant may only go down)`, () => {
    expect(size()).toBeLessThanOrEqual(CEILING);
  });

  it(`is within ${HEADROOM} bytes of the ceiling (lower CEILING when the file shrinks)`, () => {
    expect(size()).toBeGreaterThan(CEILING - HEADROOM);
  });

  it("CONTROL: the ceiling is low enough that the pre-split file would fail", () => {
    expect(CEILING).toBeLessThan(PRE_SPLIT_BYTES);
  });
});
