import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import { describe, expect, it } from "vitest";

import { CONSUMER_RULES } from "@/lib/consumer-rules";

import { agentKitFiles, consumerRules, KIT_SOURCES, loadKitInput, renderAgentsFile } from "./agent-kit-emit";

describe("renderAgentsFile", () => {
  const text = renderAgentsFile(CONSUMER_RULES);

  it("fits the always-loaded budget", () => {
    expect(Buffer.byteLength(text, "utf8")).toBeLessThan(8192);
  });

  it("gives every rule its reason", () => {
    for (const r of CONSUMER_RULES) expect(text).toContain(`Why: ${r.why}`);
  });

  it("names the check, the index and the retrieval order", () => {
    expect(text).toContain("node scripts/super-ai/validate.mjs");
    expect(text).toContain("components/super-ai/index.toon");
    expect(text).toContain("the installed file wins on conflict");
  });

  it("carries no em dash", () => {
    expect(text.includes("—")).toBe(false);
  });
});

describe("rule coverage", () => {
  it("lists every blocker, and MOT-3, under exactly one consumer rule", () => {
    const { records } = loadKitInput();
    const ids = [...records.filter((r) => r.severity === "blocker").map((r) => r.id), "MOT-3"];
    const listed = CONSUMER_RULES.flatMap((r) => r.checks);
    for (const id of ids)
      expect(
        listed.filter((x) => x === id),
        id,
      ).toHaveLength(1);
  });
});

describe("consumerRules", () => {
  const { records } = loadKitInput();

  it("rewrites scopes to the consumer's folders, each with its src/ twin", () => {
    const mot2 = consumerRules(records).find((r) => r.id === "MOT-2")!;
    expect(mot2.detect.scope).toEqual([
      "components/super-ai",
      "src/components/super-ai",
      "components/marketing",
      "src/components/marketing",
    ]);
  });

  it("drops rules no static check can run", () => {
    const ids = consumerRules(records).map((r) => r.id);
    expect(ids).not.toContain("TOK-6");
    expect(ids).not.toContain("LAY-1");
  });

  it("throws on a scope it has no mapping for", () => {
    const bad = { ...records[0], detect: { ...records[0].detect, scope: ["apps/docs/lib"] } };
    expect(() => consumerRules([bad])).toThrow("unmapped scope apps/docs/lib");
  });
});

describe("agentKitFiles", () => {
  it("copies each runtime source byte for byte", () => {
    const input = loadKitInput();
    const files = agentKitFiles({ toon: "components[0]{}:\n", ...input });
    for (const [target, source] of Object.entries(KIT_SOURCES)) {
      expect(files.get(`registry/agent-kit/${target}`), target).toBe(input.sources[source]);
    }
    expect(files.get("registry/agent-kit/index.toon")).toBe("components[0]{}:\n");
    expect(JSON.parse(files.get("registry/agent-kit/scripts/super-ai/rules.json")!).version).toBe(1);
  });

  it("carries rulecheck's vendored scopes into rules.json, mapped to the consumer", () => {
    const files = agentKitFiles({ toon: "", ...loadKitInput() });
    expect(JSON.parse(files.get("registry/agent-kit/scripts/super-ai/rules.json")!).vendored).toEqual([
      "components/ui",
      "src/components/ui",
      "components/ai-elements",
      "src/components/ai-elements",
    ]);
  });

  it("ships a shim and a hook that point at the installed validate", () => {
    const files = agentKitFiles({ toon: "", ...loadKitInput() });
    expect(files.get("registry/agent-kit/scripts/check-tokens.mjs")).toContain(
      'from "./super-ai/validate.mjs"',
    );
    expect(files.get("registry/agent-kit/hooks/super-ai-guard.mjs")).toContain(
      "../../scripts/super-ai/validate.mjs",
    );
  });
});

describe("the emitted hook", () => {
  /** Lays the emitted kit out as agent-kit-hooks installs it, under a real
   *  directory reached through a symlink (macOS tmp, or any linked project). */
  function installed() {
    const real = mkdtempSync(join(tmpdir(), "kit-real-"));
    const link = `${real}-link`;
    symlinkSync(real, link);
    const files = agentKitFiles({ toon: "", ...loadKitInput() });
    for (const [rel, content] of files) {
      const at = rel.replace("registry/agent-kit/", "").replace(/^hooks\//, ".claude/hooks/");
      mkdirSync(dirname(join(real, at)), { recursive: true });
      writeFileSync(join(real, at), content);
    }
    const run = (filePath: string, content: string) =>
      spawnSync("node", [join(link, ".claude/hooks/super-ai-guard.mjs")], {
        input: JSON.stringify({ tool_name: "Write", tool_input: { file_path: filePath, content } }),
        encoding: "utf8",
      });
    return { real, link, run };
  }

  it("blocks a raw hex when the project path goes through a symlink", () => {
    const k = installed();
    expect(k.run(join(k.link, "app/x.tsx"), '<div className="bg-[#fff]" />').status).toBe(2);
    expect(k.run(join(k.real, "app/x.tsx"), '<div className="bg-[#fff]" />').status).toBe(2);
  });

  it("lets a clean edit through, and ignores files outside the project", () => {
    const k = installed();
    expect(k.run(join(k.link, "app/x.tsx"), '<div className="bg-background" />').status).toBe(0);
    expect(k.run(join(tmpdir(), "elsewhere.tsx"), '<div className="bg-[#fff]" />').status).toBe(0);
  });
});
