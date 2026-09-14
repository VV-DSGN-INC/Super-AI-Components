import { existsSync, mkdirSync, readFileSync, readdirSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

import { MANIFEST } from "@/lib/catalog.manifest";
import type { ComponentDocs } from "@/lib/component-docs";
import type { ManifestItem } from "@/lib/manifest-types";

import { deriveMeta, derivedFiles, renderComponentPage, renderLlmsTxt, renderToon } from "./contract-emit";
import { validateContract } from "./contract-schema";
import { loadDocs } from "./contract-source";

const why = "a reason long enough to pass the floor";
const item: ManifestItem = {
  id: "D4",
  name: "mode-tabs",
  title: "Mode Tabs",
  description: "Ask/Design/Build",
  family: "D",
  layer: "component",
  status: "shipped",
  wave: 1,
  base: [],
  shadcn: ["tabs"],
  consumes: [],
  npm: ["lucide-react"],
  states: ["text-only", "with-icon"],
  specAnchor: "component-specs.md#d4-mode-tabs",
};
const docs: ComponentDocs = {
  whatItIs: "Two to five interpretations of one input, as tabs.",
  whyItMatters: "Because a mode is not a model.",
  evidence: ["Claude"],
  anatomy: [{ slot: "mode-tabs", note: "The row." }],
  usage: "Reach for it when the input has modes.",
  dos: [{ text: "Keep it under five.", example: null }],
  donts: [{ text: "Do not use it as a model picker." }],
  accessibility: { keyboard: ["Arrows move."], screenReader: ["A tablist."] },
  pitfalls: ["Six modes."],
  variants: [
    {
      prop: "variant",
      default: "default",
      values: [
        { value: "default", intent: why },
        { value: "with-icon", intent: why },
      ],
    },
  ],
  insteadUse: [{ component: "model-picker", when: why }],
};

describe("deriveMeta", () => {
  const meta = deriveMeta(item, docs);

  it("merges manifest facts so the installed file is self-contained", () => {
    expect(meta.name).toBe("mode-tabs");
    expect(meta.layer).toBe("component");
    expect(meta.family).toBe("D");
    expect(meta.states).toEqual(["text-only", "with-icon"]);
    expect(meta.shadcn).toEqual(["tabs"]);
    expect(meta.regions).toEqual([]);
    expect(meta.source).toBe("content/components/mode-tabs.docs.tsx");
    expect(meta.docs).toBe("https://super-ai-components.vercel.app/components/mode-tabs");
  });

  it("keeps the text of a do and a don't and drops the example element", () => {
    expect(meta.dos).toEqual(["Keep it under five."]);
    expect(meta.donts).toEqual(["Do not use it as a model picker."]);
    expect(JSON.stringify(meta)).not.toContain("example");
  });

  it("omits an unwritten field instead of inventing an empty one", () => {
    const { variants: _v, insteadUse: _i, ...unwritten } = docs;
    const m = deriveMeta(item, unwritten);
    expect("variants" in m).toBe(false);
    expect("insteadUse" in m).toBe(false);
  });

  it("opens with the do-not-edit banner", () => {
    expect(meta.generated).toContain("pnpm contract:emit");
    expect(meta.generated).toContain("content/components/mode-tabs.docs.tsx");
  });
});

describe("renderToon", () => {
  it("writes one line per item with axes, redirects and a purpose cut at 100 characters", () => {
    const meta = deriveMeta(item, docs);
    const toon = renderToon([meta]);
    expect(toon.split("\n")[0]).toBe("components[1]{name,layer,family,meta,variants,insteadUse,purpose}:");
    expect(toon).toContain(
      "  mode-tabs,component,D,registry/super-ai/mode-tabs.meta.json,variant=default/with-icon,model-picker,",
    );
  });

  it("spells an unwritten field as `unwritten` and a decided none as `none`", () => {
    const { variants: _v, insteadUse: _i, ...unwritten } = docs;
    expect(renderToon([deriveMeta(item, unwritten)])).toContain(",unwritten,unwritten,");
    expect(
      renderToon([deriveMeta(item, { ...unwritten, variants: { none: why }, insteadUse: { none: why } })]),
    ).toContain(",none,none,");
  });

  it("quotes a purpose that contains a comma", () => {
    const m = deriveMeta(item, { ...docs, whatItIs: "Tabs, not a select." });
    expect(renderToon([m])).toContain(',"Tabs, not a select."');
  });
});

describe("renderComponentPage", () => {
  const page = renderComponentPage(deriveMeta(item, docs));

  it("leads with the title, the purpose, and the retrieval order", () => {
    expect(page.startsWith("# Mode Tabs\n\n> Two to five interpretations")).toBe(true);
    expect(page).toContain("npx shadcn@latest add https://super-ai-components.vercel.app/r/mode-tabs.json");
    expect(page).toContain("`components/super-ai/mode-tabs.meta.json`");
    expect(page).toContain("outranks this page");
  });

  it("renders every variant value with its intent, and every redirect", () => {
    expect(page).toContain("### variant (default: `default`)");
    expect(page).toContain(`- \`with-icon\`: ${why}`);
    expect(page).toContain(`- **model-picker**: ${why}`);
  });

  it("says when a field is not yet recorded rather than omitting the heading", () => {
    const { variants: _v, ...unwritten } = docs;
    expect(renderComponentPage(deriveMeta(item, unwritten))).toContain("## Variants\n\nNot yet recorded.");
  });
});

describe("renderLlmsTxt", () => {
  it("lists every component once, linking its page", () => {
    const txt = renderLlmsTxt([deriveMeta(item, docs)]);
    expect(txt).toContain("# Super AI Components");
    expect(txt).toContain("outrank these pages");
    expect(txt).toContain(
      "- [Mode Tabs](https://super-ai-components.vercel.app/llms/components/mode-tabs.md): Two to five",
    );
  });
});

describe("derivedFiles", () => {
  it("names one meta and one page per item plus the three shared files", () => {
    const files = derivedFiles([deriveMeta(item, docs)]);
    expect([...files.keys()].sort()).toEqual([
      "index/components.toon",
      "public/llms-full.txt",
      "public/llms.txt",
      "public/llms/components/mode-tabs.md",
      "registry/super-ai/mode-tabs.meta.json",
    ]);
    expect(files.get("registry/super-ai/mode-tabs.meta.json")!.endsWith("\n")).toBe(true);
  });
});

// Part 2: the gate. With CONTRACT_EMIT=1 it writes every derived file; without
// the flag it regenerates in memory and fails on any byte of difference.
// Same code path both ways, so writer and gate cannot disagree about "stale".
const EMIT = process.env.CONTRACT_EMIT === "1";
const ROOT = resolve(__dirname, "../.."); // apps/docs

describe("contract emit and drift", () => {
  const shipped = MANIFEST.filter((i) => i.status === "shipped");
  const shippedNames = new Set(shipped.map((i) => i.name));

  // 116 dynamic imports: concurrent, because sequentially they take longer
  // than vitest's default timeout once the rest of the suite is running in
  // parallel. Promise.all preserves order, which the derived files rely on.
  it(
    "validates every shipped item and derives exactly one contract per item",
    { timeout: 60_000 },
    async () => {
      const loaded = await Promise.all(
        shipped.map(async (entry) => [entry, await loadDocs(entry.name)] as const),
      );
      const errors: string[] = [];
      const metas = [];
      for (const [entry, moduleDocs] of loaded) {
        errors.push(...validateContract(entry.name, moduleDocs, shippedNames));
        metas.push(deriveMeta(entry, moduleDocs));
      }
      expect(
        errors,
        "Contract schema failures. Fix the guidance module; a reason or intent under 20 characters is a placeholder.",
      ).toEqual([]);

      const files = derivedFiles(metas);
      if (EMIT) {
        for (const [rel, content] of files) {
          mkdirSync(dirname(join(ROOT, rel)), { recursive: true });
          writeFileSync(join(ROOT, rel), content);
        }
      }
      const stale = [...files]
        .filter(
          ([rel, content]) =>
            !existsSync(join(ROOT, rel)) || readFileSync(join(ROOT, rel), "utf8") !== content,
        )
        .map(([rel]) => rel);
      expect(
        stale,
        "Derived files are stale. Run `pnpm contract:emit` in apps/docs and commit the result; never edit a derived file by hand.",
      ).toEqual([]);

      // The derived set is exactly the shipped set: a meta or a page with no
      // shipped item behind it is deleted on emit and fails the gate otherwise.
      const orphans = [
        ...readdirSync(join(ROOT, "registry/super-ai"))
          .filter((f) => f.endsWith(".meta.json"))
          .map((f) => `registry/super-ai/${f}`)
          .filter((rel) => !files.has(rel)),
        ...(existsSync(join(ROOT, "public/llms/components"))
          ? readdirSync(join(ROOT, "public/llms/components"))
              .map((f) => `public/llms/components/${f}`)
              .filter((rel) => !files.has(rel))
          : []),
      ];
      if (EMIT) for (const rel of orphans) unlinkSync(join(ROOT, rel));
      expect(
        orphans,
        "A derived file with no shipped manifest item behind it. Run `pnpm contract:emit` to remove it.",
      ).toEqual([]);
    },
  );
});
