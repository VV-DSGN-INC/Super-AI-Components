import { compareItem, renderTable, summarize, type RegistryItemJson, type Verdict } from "./prod-diff";

const local: RegistryItemJson = {
  name: "kbd",
  files: [
    { path: "registry/super-ai/kbd.tsx", content: "export const Kbd = 1;" },
    { path: "registry/super-ai/kbd.meta.json", content: '{"generated":"2026-09-17"}' },
  ],
  dependencies: [],
  registryDependencies: [],
};
const code = local.files![0];
const meta = local.files![1];

describe("compareItem", () => {
  it("is identical when every file and dependency list matches, whatever the order", () => {
    expect(compareItem(local, { ...local, files: [meta, code] })).toBe("identical");
  });

  it("is contract when only the meta file is absent or differs", () => {
    expect(compareItem(local, { ...local, files: [code] })).toBe("contract");
    expect(compareItem(local, { ...local, files: [code, { ...meta, content: "{}" }] })).toBe("contract");
  });

  it("is code when a component file differs, even if the meta matches", () => {
    expect(
      compareItem(local, { ...local, files: [{ ...code, content: "export const Kbd = 2;" }, meta] }),
    ).toBe("code");
  });

  it("is code when a dependency list differs with identical files", () => {
    expect(compareItem(local, { ...local, dependencies: ["lucide-react"] })).toBe("code");
    expect(compareItem(local, { ...local, registryDependencies: ["button"] })).toBe("code");
  });

  it("is missing when production has no such item", () => {
    expect(compareItem(local, null)).toBe("missing");
  });
});

describe("summarize and renderTable", () => {
  it("counts every verdict and renders the table §7 quotes", () => {
    const verdicts = new Map<string, Verdict>([
      ["a", "identical"],
      ["b", "contract"],
      ["c", "code"],
      ["d", "missing"],
      ["e", "identical"],
    ]);
    const s = summarize(verdicts);
    expect(s).toEqual({ total: 5, identical: 2, contract: 1, code: 1, missing: 1 });

    const table = renderTable(s, "2026-09-17");
    expect(table).toContain("| measured 2026-09-17");
    expect(table).toMatch(/^\| items compared +\| +5 \|$/m);
    expect(table).toMatch(/^\| absent from production +\| +1 \|$/m);
    // Every row is the same width, so prettier leaves the table alone.
    const widths = new Set(table.split("\n").map((line) => line.length));
    expect(widths.size).toBe(1);
  });
});
