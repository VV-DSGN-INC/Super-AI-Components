# Anti-slop in this repo

The method lives in the `unslop` skill (`.claude/skills/unslop/SKILL.md`):
constraints before building, an audit before "done", and fixes by
substitution. Its Phase 0 binds it to this repo; the phases after it are
generated from the unslop plugin. This page holds the decisions other docs
here cite, and the rule that enforces each one.

## Decisions

- **No AI colour.** Product UI has no gradients (COL-1), and indigo, violet
  and purple appear only as `chart-4` (COL-6). The registry ships no colour
  that means "AI"; the one shared AI signal is the glyph `ai-label` owns.
- **Colour comes from tokens.** Registry sources never write a raw hex
  (TOK-1), `oklch()` (TOK-2), palette class (TOK-3) or `rgb()`/`hsl()`
  (TOK-7). Muted text never sits on a muted surface (TOK-4, TOK-5, TOK-6).
- **One icon library.** Icons come from `lucide-react` only (ICO-1), and none
  of them is an emoji (ICO-2).
- **The value ratchet.** The number of distinct radius, shadow, type-size and
  spacing values in the registry only goes down. A value the scale lacks is a
  proposal for the token system, not an inline literal; an arbitrary pixel
  value is reviewed under LAY-1.

## Where it runs

- `pnpm check:tokens` runs the blocker records, in CI and from the
  write-time hook.
- `node packages/ds-rules/rulecheck.mjs --json` runs every record at every
  severity and ends with the `unchecked` list the audit works by hand.
- The records live in `packages/ds-rules/src/core.ts` and `src/local.ts`,
  emitted to `packages/ds-rules/rules/*.json`. Each carries its own `fix` and
  `why`.
