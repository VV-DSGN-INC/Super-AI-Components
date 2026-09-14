// D23: @xyflow/react is confined to the two react-flow bindings. Every other
// family G file is plain React so it installs without the dependency. This
// test is the boundary; a new import elsewhere fails here before it fails a
// consumer.
//
// NOTE: the URL constructor is imported explicitly from node:url rather than
// relying on the global. Under this project's jsdom test environment, a
// module-scope `new URL(".", import.meta.url)` against the jsdom-polyfilled
// global URL throws "The URL must be of scheme file" before any test body
// runs; importing the real Node URL sidesteps that.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath, URL as NodeURL } from "node:url";
import { describe, expect, it } from "vitest";

const DIR = fileURLToPath(new NodeURL(".", import.meta.url));
const ALLOWED = new Set(["typed-handle.tsx", "typed-edge.tsx"]);

describe("family G dependency boundary", () => {
  it("only typed-handle and typed-edge import @xyflow/react", () => {
    const offenders = readdirSync(DIR)
      .filter((f) => f.endsWith(".tsx") && !f.endsWith(".test.tsx") && !ALLOWED.has(f))
      .filter((f) => /from\s+["']@xyflow\/react/.test(readFileSync(join(DIR, f), "utf8")));
    expect(offenders).toEqual([]);
  });
});
