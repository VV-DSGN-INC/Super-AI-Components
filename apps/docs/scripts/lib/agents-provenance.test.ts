import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { UNGATED_MD, parseAgentStubs, readUngated } from "./agents-stubs";

const REPO = resolve(__dirname, "../../../..");

describe("AGENTS.md stub provenance", () => {
  // Read lazily: describe bodies run even when skipped, and AGENTS.md does not exist yet.
  const load = () => {
    const agentsMd = readFileSync(join(REPO, "AGENTS.md"), "utf8");
    const ungatedPath = join(REPO, UNGATED_MD);
    const ungated = readUngated(existsSync(ungatedPath) ? readFileSync(ungatedPath, "utf8") : "");
    return { agentsMd, ungated, stubs: parseAgentStubs(agentsMd) };
  };

  it("finds every stub, not just some", () => {
    const { agentsMd, stubs } = load();
    // Cross-check the parsed count against a plain substring count of the
    // opener, so a line that looks like a stub but does not parse (a typo'd
    // directory) fails loudly instead of dropping out of every check below.
    // The marker stops at "agent-rules" with no trailing slash on purpose.
    const opener = "Read `docs/agent-rules";
    const openerCount = agentsMd.split(opener).length - 1;
    expect(stubs.length).toBeGreaterThan(0);
    expect(stubs.length).toBe(openerCount);
  });

  it("every stub names a body that exists and a gate that exists", () => {
    const { ungated, stubs } = load();
    const problems: string[] = [];
    for (const stub of stubs) {
      if (!existsSync(join(REPO, stub.body)))
        problems.push(`AGENTS.md:${stub.line} - body ${stub.body} does not exist`);
      for (const gate of stub.gates)
        if (!existsSync(join(REPO, gate)))
          problems.push(`AGENTS.md:${stub.line} - gate ${gate} does not exist`);
      if (stub.gates.length === 0 && !ungated.has(stub.body))
        problems.push(`AGENTS.md:${stub.line} - ${stub.body} has no gate and no ${UNGATED_MD} entry`);
    }
    expect(problems).toEqual([]);
  });

  it("UNGATED carries no dead entries", () => {
    const { ungated, stubs } = load();
    const bodies = new Set(stubs.map((s) => s.body));
    expect([...ungated.keys()].filter((b) => !bodies.has(b))).toEqual([]);
  });
});

describe("parseAgentStubs fixtures", () => {
  it("reads body and gates from a well-formed stub", () => {
    const text = "- **Claim.** Read `docs/agent-rules/x.md`. Gate: `a.mjs`, `b.ts`.";
    expect(parseAgentStubs(text)).toEqual([
      { body: "docs/agent-rules/x.md", gates: ["a.mjs", "b.ts"], line: 1 },
    ]);
  });

  it("reads a stub with no Gate clause as zero gates, not as an error", () => {
    const text = "- **Claim.** Read `docs/agent-rules/x.md`.";
    expect(parseAgentStubs(text)[0]!.gates).toEqual([]);
  });

  it("ignores a backticked path that is not under docs/agent-rules", () => {
    expect(parseAgentStubs("see `src/tokens.ts` for the mirror")).toEqual([]);
  });

  it("reports the line number, so a failure names where to look", () => {
    const text = "intro\n\n- **Claim.** Read `docs/agent-rules/x.md`.";
    expect(parseAgentStubs(text)[0]!.line).toBe(3);
  });

  it("a stub whose bold text contains * still resolves its body", () => {
    const text =
      "- **Contracts derive; never hand-edit a `.meta.json`, `public/llms*`.** Read `docs/agent-rules/contracts.md`. Gate: `apps/docs/scripts/lib/contract-emit.test.ts`.";
    expect(parseAgentStubs(text)).toEqual([
      {
        body: "docs/agent-rules/contracts.md",
        gates: ["apps/docs/scripts/lib/contract-emit.test.ts"],
        line: 1,
      },
    ]);
  });
});

describe("readUngated", () => {
  it("maps a body path (backticks stripped) to its reason, skipping header and separator", () => {
    const text = [
      "intro prose",
      "",
      "| body | why nothing enforces it |",
      "| ---- | ----------------------- |",
      "| `docs/agent-rules/a.md` | A judgment call. |",
      "| `docs/agent-rules/b.md` | Procedural. |",
    ].join("\n");
    expect(readUngated(text)).toEqual(
      new Map([
        ["docs/agent-rules/a.md", "A judgment call."],
        ["docs/agent-rules/b.md", "Procedural."],
      ]),
    );
  });

  it("returns an empty map for text with no table", () => {
    expect(readUngated("no table here").size).toBe(0);
  });
});
