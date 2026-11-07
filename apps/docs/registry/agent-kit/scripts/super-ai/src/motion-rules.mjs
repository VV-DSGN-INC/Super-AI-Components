/** MOT-3: movement that ignores the reduced-motion preference.
 *
 *  Structural, like TOK-4: rulecheck routes the id here instead of running the
 *  record's pattern line by line, because the question is about a whole class
 *  string (does it carry a motion-reduce: pair?), not about one token.
 *  node:* and relative imports only; this file ships into consumer apps with
 *  the agent-kit registry item. */

const QUOTED = /(["'`])([^"'`\n]*)\1/g;
const MOVEMENT = /(^|:)(animate-(?!none|spin)[a-z0-9-]+|transition-transform|transition)$/;

function isMovement(token) {
  return MOVEMENT.test(token) && !token.startsWith("motion-reduce:") && !token.startsWith("motion-safe:");
}

/** One message per unpaired class string, `${file}:${line} — ${prose}`, the
 *  format rulecheck's structuralFindings parses. */
export function findUnpairedMotion(file, source) {
  const out = [];
  for (const m of source.matchAll(QUOTED)) {
    const tokens = m[2].split(/\s+/).filter(Boolean);
    const moving = tokens.filter(isMovement);
    if (moving.length === 0) continue;
    if (tokens.some((t) => t.startsWith("motion-reduce:"))) continue;
    const line = source.slice(0, m.index).split("\n").length;
    out.push(`${file}:${line} — ${moving.join(" ")} has no motion-reduce: pair in the same class string`);
  }
  return out;
}
