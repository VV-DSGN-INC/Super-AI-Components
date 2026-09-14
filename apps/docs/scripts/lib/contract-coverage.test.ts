import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { MANIFEST } from "@/lib/catalog.manifest";

import { readMetas, unwrittenContracts } from "./contract-coverage";

const ROOT = resolve(__dirname, "../..");
const BASELINE = join(__dirname, "contract-coverage.baseline.json");

describe("unwrittenContracts", () => {
  it("names an item missing either field, sorted, and skips one with both", () => {
    expect(
      unwrittenContracts([
        { name: "z", variants: [], insteadUse: [] },
        { name: "b", variants: { none: "x" } },
        { name: "a", insteadUse: [] },
      ]),
    ).toEqual(["a", "b"]);
  });
});

describe("readMetas", () => {
  it("reads every emitted meta, one per shipped item", () => {
    const metas = readMetas(join(ROOT, "registry/super-ai"));
    expect(metas.map((m) => m.name).sort()).toEqual(
      MANIFEST.filter((i) => i.status === "shipped")
        .map((i) => i.name)
        .sort(),
    );
  });
});

describe("contract coverage ratchet", () => {
  const live = unwrittenContracts(readMetas(join(ROOT, "registry/super-ai")));
  const baseline: string[] = existsSync(BASELINE) ? JSON.parse(readFileSync(BASELINE, "utf8")) : [];

  it("no item is newly unwritten (the baseline may only shrink)", () => {
    const fresh = live.filter((n) => !baseline.includes(n));
    expect(
      fresh,
      "Items whose guidance module lacks `variants` or `insteadUse`. Write both fields (a { none: <why> } is a decision; an absent field is not). The baseline is adoption-time debt and may only shrink.",
    ).toEqual([]);
  });

  it("no baseline entry is stale (a written contract must be locked in)", () => {
    const stale = baseline.filter((n) => !live.includes(n));
    expect(
      stale,
      "These items now carry both fields but are still listed in contract-coverage.baseline.json. Run `pnpm contract-coverage:baseline` in apps/docs to lock the progress in.",
    ).toEqual([]);
  });
});
