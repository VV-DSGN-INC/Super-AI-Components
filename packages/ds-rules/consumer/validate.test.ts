import { spawnSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { describe, expect, it } from "vitest";

import { loadRules } from "../rulecheck.mjs";

const PKG = fileURLToPath(new URL("..", import.meta.url));

/** The scope map the kit emitter applies (agent-kit-emit.ts); duplicated here
 *  only so this test can run the shipped layout without apps/docs. */
const SCOPE_MAP: Record<string, string> = {
  "apps/docs/registry/super-ai": "components/super-ai",
  "apps/docs/registry/marketing": "components/marketing",
  "apps/docs/components": "components",
  "apps/docs/app": "app",
};

/** A temp consumer with the kit installed exactly as agent-kit lays it out. */
function consumer(opts: { src?: boolean } = {}) {
  const root = mkdtempSync(path.join(tmpdir(), "super-ai-consumer-"));
  const kit = path.join(root, "scripts/super-ai");
  mkdirSync(path.join(kit, "src"), { recursive: true });
  copyFileSync(path.join(PKG, "rulecheck.mjs"), path.join(kit, "rulecheck.mjs"));
  copyFileSync(path.join(PKG, "src/token-rules.mjs"), path.join(kit, "src/token-rules.mjs"));
  copyFileSync(path.join(PKG, "src/motion-rules.mjs"), path.join(kit, "src/motion-rules.mjs"));
  copyFileSync(path.join(PKG, "consumer/system-diff.mjs"), path.join(kit, "system-diff.mjs"));
  copyFileSync(path.join(PKG, "consumer/validate.mjs"), path.join(kit, "validate.mjs"));
  const rules = loadRules()
    .filter((r) => r.detect.method === "grep" || r.detect.method === "heuristic")
    .map((r) => ({
      ...r,
      detect: { ...r.detect, scope: r.detect.scope.flatMap((s: string) => [SCOPE_MAP[s], `src/${SCOPE_MAP[s]}`]) },
    }));
  writeFileSync(path.join(kit, "rules.json"), JSON.stringify({ version: 1, rules }, null, 2));
  writeFileSync(
    path.join(root, "components.json"),
    JSON.stringify({ aliases: { components: "@/components", ui: "@/components/ui" } }),
  );
  if (opts.src) mkdirSync(path.join(root, "src"));
  const put = (rel: string, text: string) => {
    mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
    writeFileSync(path.join(root, rel), text);
  };
  const run = (...args: string[]) =>
    spawnSync("node", ["scripts/super-ai/validate.mjs", ...args], { cwd: root, encoding: "utf8" });
  const git = (...args: string[]) =>
    spawnSync("git", ["-c", "user.email=t@t", "-c", "user.name=t", ...args], { cwd: root, encoding: "utf8" });
  return { root, put, run, git };
}

const cls = (c: string) => `export const X = () => <div className="${c}" />;\n`;

describe("consumer validate", () => {
  it("exits 0 on a clean installed tree", () => {
    const c = consumer();
    c.put("components/super-ai/a.tsx", cls("bg-background text-foreground"));
    expect(c.run().status).toBe(0);
  });

  it("exits 1 on a planted raw hex and names TOK-1", () => {
    const c = consumer();
    c.put("app/x.tsx", cls("bg-[#ff0000]"));
    const r = c.run();
    expect(r.status).toBe(1);
    expect(r.stdout).toContain("TOK-1");
  });

  it("demotes the same hex under the ui primitives to a warning", () => {
    const c = consumer();
    c.put("components/ui/x.tsx", cls("bg-[#ff0000]"));
    const r = c.run();
    expect(r.status).toBe(0);
    expect(r.stdout).toMatch(/^WARN components\/ui\/x\.tsx/m);
  });

  it("scans src/ when the consumer uses a src directory", () => {
    const c = consumer({ src: true });
    c.put("src/components/super-ai/b.tsx", cls("bg-zinc-400"));
    expect(c.run().status).toBe(1);
  });

  it("does not fail on a MOT-3 finding alone", () => {
    const c = consumer();
    c.put("components/super-ai/m.tsx", cls("animate-pulse"));
    const r = c.run();
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("MOT-3");
  });

  it("checks only the paths it is given", () => {
    const c = consumer();
    c.put("app/x.tsx", cls("bg-[#ff0000]"));
    c.put("app/y.tsx", cls("bg-background"));
    expect(c.run("app/y.tsx").status).toBe(0);
    expect(c.run("app/x.tsx").status).toBe(1);
  });

  it("--system exits 3 on a token change, and 1 when a blocker is present too", () => {
    const c = consumer();
    c.put("app/globals.css", ":root {\n  --radius: 0.5rem;\n}\n");
    c.git("init", "-q");
    c.git("add", "-A");
    c.git("commit", "-qm", "base");
    c.put("app/globals.css", ":root {\n  --radius: 0.5rem;\n  --brand: oklch(0.6 0.1 250);\n}\n");
    const r = c.run("--system");
    expect(r.status).toBe(3);
    expect(r.stdout).toContain("SYSTEM token-change app/globals.css");
    c.put("app/x.tsx", cls("bg-[#ff0000]"));
    expect(c.run("--system").status).toBe(1);
  });

  it("--system without git exits 2 and says git is required", () => {
    const c = consumer();
    const r = c.run("--system");
    expect(r.status).toBe(2);
    expect(r.stderr).toMatch(/git/);
  });

  it("lintText returns the global hook's shape", async () => {
    const c = consumer();
    const mod = await import(pathToFileURL(path.join(c.root, "scripts/super-ai/validate.mjs")).href);
    const found = mod.lintText("app/x.tsx", '<div className="bg-[#fff]" />');
    expect(found).toHaveLength(1);
    expect(found[0].values[0]).toContain("#fff");
    expect(typeof found[0].why).toBe("string");
    expect(mod.lintText("app/x.tsx", '<div className="bg-background" />')).toEqual([]);
  });
});
