import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

import { describe, expect, it } from "vitest";

import type { ContractMeta } from "./contract-emit";
import { buildCatalog, CATALOG_FILE, flatAxes, readMetas, serializeCatalog } from "./openui-catalog";

const REPO = resolve(__dirname, "../../../..");
const EMIT = process.env.OPENUI_EMIT === "1";

/** A minimal meta: only the fields the builder reads. The cast is deliberate;
 *  the full shape is exercised by the tree-backed control test below. */
function meta(over: Partial<ContractMeta> & { name: string }): ContractMeta {
  return {
    title: over.name,
    layer: "component",
    family: "A",
    purpose: `Purpose of ${over.name}.`,
    donts: [],
    pitfalls: [],
    consumes: [],
    docs: `https://example.test/${over.name}`,
    ...over,
  } as ContractMeta;
}

const why = "a reason long enough to pass the floor";

describe("flatAxes", () => {
  it("keeps a bare prop and prefers propName", () => {
    expect(
      flatAxes(
        meta({
          name: "x",
          variants: [
            { prop: "variant", default: "a", values: [{ value: "a", intent: why }] },
            { prop: "ToolHeader · state", propName: "state", values: [{ value: "done", intent: why }] },
          ],
        }),
      ),
    ).toEqual([
      { prop: "variant", default: "a", values: [{ value: "a", intent: why }] },
      { prop: "state", values: [{ value: "done", intent: why }] },
    ]);
  });

  it("drops a part-scoped axis with no propName, because OpenUI props are flat", () => {
    const m = meta({
      name: "x",
      variants: [{ prop: "DialogFooter showCloseButton", values: [{ value: "true", intent: why }] }],
    });
    expect(flatAxes(m)).toEqual([]);
  });

  it("emits no axes for an unwritten field or a written `none`, rather than inventing them", () => {
    expect(flatAxes(meta({ name: "x" }))).toEqual([]);
    expect(flatAxes(meta({ name: "x", variants: { none: "one presentation" } }))).toEqual([]);
  });
});

describe("buildCatalog", () => {
  it("sorts by slug, groups by family, and carries purpose, notes and placement", () => {
    const catalog = buildCatalog([
      meta({ name: "zeta", title: "Zeta", family: "F", consumes: ["alpha"] }),
      meta({
        name: "alpha",
        title: "Alpha",
        layer: "primitive",
        donts: ["Never two."],
        pitfalls: ["Six of them."],
        insteadUse: [{ component: "zeta", when: why }],
      }),
    ]);
    expect(catalog.components.map((c) => c.slug)).toEqual(["alpha", "zeta"]);
    expect(catalog.components[0]).toMatchObject({
      name: "Alpha",
      slug: "alpha",
      family: "A",
      layer: "primitive",
      meta: "registry/super-ai/alpha.meta.json",
      description: "Purpose of alpha.",
      variants: [],
      notes: ["Never two.", "Six of them."],
      consumes: [],
      consumedBy: ["zeta"],
      insteadUse: [{ slug: "zeta", when: why }],
    });
    expect(catalog.components[1]).toMatchObject({ consumes: ["alpha"], consumedBy: [], insteadUse: [] });
    expect(catalog.groups).toEqual([
      { family: "A", title: "Primitives", components: ["alpha"] },
      { family: "F", title: "Results & assets", components: ["zeta"] },
    ]);
  });

  it("serializes deterministically with a trailing newline", () => {
    const out = serializeCatalog(buildCatalog([meta({ name: "a" })]));
    expect(out.endsWith("\n")).toBe(true);
    expect(JSON.parse(out).version).toBe(1);
  });

  it("control: the real tree yields one entry per shipped item and mode-tabs' axis", () => {
    const catalog = buildCatalog(readMetas(REPO));
    const slugs = catalog.components.map((c) => c.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(slugs.length).toBe(122);
    const modeTabs = catalog.components.find((c) => c.slug === "mode-tabs");
    expect(modeTabs?.variants.map((v) => v.prop)).toEqual(["variant"]);
    expect(modeTabs?.variants[0]?.values.map((v) => v.value)).toContain("with-tooltip");
    expect(catalog.components.find((c) => c.slug === "entity-row")?.consumedBy).toContain("model-picker");
  });
});

/** The emit is the drift gate, the system-facts idiom: the meta tree is the
 *  source, so the gate proves catalog-matches-tree. OPENUI_EMIT=1
 *  (`pnpm openui:emit`) writes; every other run compares. */
describe("public/openui/catalog.json", () => {
  it(EMIT ? "writes the catalog" : "matches the metas in the tree", () => {
    const content = serializeCatalog(buildCatalog(readMetas(REPO)));
    const abs = join(REPO, CATALOG_FILE);
    if (EMIT) {
      mkdirSync(dirname(abs), { recursive: true });
      writeFileSync(abs, content);
      return;
    }
    const committed = existsSync(abs) ? readFileSync(abs, "utf8") : "";
    expect(committed, `${CATALOG_FILE} is stale. Run: cd apps/docs && pnpm openui:emit`).toBe(content);
  });
});
