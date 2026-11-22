/** Parses AGENTS.md stub lines. A stub names one body file and zero or more
 *  gates:
 *
 *    - **Claim.** Read `docs/agent-rules/x.md`. Gate: `a.mjs`, `b.ts`.
 *
 *  Zero gates is legal here and caught by the provenance gate instead, which
 *  requires an UNGATED entry with a reason. Splitting parse from judgment is
 *  deliberate: the parser is fed hand-built text by its fixture suite.
 *  Gate paths are repo-relative. */
export type AgentStub = { body: string; gates: string[]; line: number };

export const UNGATED_MD = "docs/design-system/UNGATED.md";

export function parseAgentStubs(text: string): AgentStub[] {
  const stubs: AgentStub[] = [];
  text.split("\n").forEach((raw, i) => {
    const body = raw.match(/`(docs\/agent-rules\/[\w.-]+\.md)`/);
    if (!body) return;
    const gateClause = raw.split("Gate:")[1] ?? "";
    const gates = [...gateClause.matchAll(/`([^`]+)`/g)].map((m) => m[1]!);
    stubs.push({ body: body[1]!, gates, line: i + 1 });
  });
  return stubs;
}

/** Reads the UNGATED.md table: first column is a body path (backticks
 *  stripped), second column is the reason. Header and separator rows are
 *  skipped; a row with no reason is dropped rather than read as excused. */
export function readUngated(text: string): Map<string, string> {
  const out = new Map<string, string>();
  const lines = text.split("\n");
  const isSeparator = (l: string | undefined) => /^\s*\|[\s:|-]+\|\s*$/.test(l ?? "") && l!.includes("---");
  for (const [i, line] of lines.entries()) {
    if (!line.trimStart().startsWith("|")) continue;
    if (isSeparator(lines[i + 1])) continue; // header row
    const cells = line
      .trim()
      .replace(/^\|/, "")
      .replace(/\|$/, "")
      .split("|")
      .map((c) => c.trim());
    if (cells.length < 2) continue;
    if (/^:?-{3,}:?$/.test(cells[0]!)) continue;
    const key = cells[0]!.replace(/`/g, "");
    const reason = cells[1]!;
    if (!key || !reason) continue;
    out.set(key, reason);
  }
  return out;
}
