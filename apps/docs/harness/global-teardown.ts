// Runs once after the row's tests. A baselined key that no longer fires is a
// stale entry, and the run fails on it: the baseline may only shrink, and the
// shrinking is a commit, not something that happens silently.
import { liveKeys, readBaseline, readResults } from "./baseline";

export default async function globalTeardown() {
  const row = process.env.HARNESS_ROW ?? "default";
  const results = readResults(row);
  if (results.length === 0) return; // nothing ran; never certify an empty run
  const live = new Set(liveKeys(results));
  const tested = new Set(results.map((r) => `${r.row}/${r.theme}/${r.item}`));
  const stale = readBaseline().filter((k) => {
    const [pair] = k.split(":");
    return k.startsWith(`${row}/`) && tested.has(pair) && !live.has(k);
  });
  if (stale.length > 0) {
    throw new Error(
      `harness/baseline.json carries ${stale.length} entr${stale.length === 1 ? "y" : "ies"} for row "${row}" that no longer fire${stale.length === 1 ? "s" : ""}:\n  ${stale.join("\n  ")}\nShrink it: pnpm --filter docs harness:baseline ${row}`,
    );
  }
}
