import { MANIFEST } from "@/lib/catalog.manifest";

import { loadDocs } from "./contract-source";

const shipped = MANIFEST.filter((i) => i.status === "shipped").map((i) => i.name);

describe("contract-source", () => {
  it("has shipped items to probe (a zero here is a broken manifest read, not a clean tree)", () => {
    expect(shipped.length).toBeGreaterThan(0);
  });

  // Every guidance module must evaluate outside Next: the emit step imports
  // them, and a module that cannot be imported would otherwise fail one wave
  // deep instead of here.
  it.each(shipped)("%s exports its Docs object from content/components", async (name) => {
    const docs = await loadDocs(name);
    expect(typeof docs.whatItIs).toBe("string");
    expect(docs.whatItIs.length).toBeGreaterThan(0);
  });

  it("throws, naming the item, when there is no guidance module", async () => {
    await expect(loadDocs("no-such-item")).rejects.toThrow("no-such-item");
  });
});
