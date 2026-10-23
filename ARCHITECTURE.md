# The architecture, on one page

**TL;DR.** The registry is the product: shadcn-style components a consumer installs by URL, built for repos where an agent writes most of the code. Rules are records that emit their own detectors, so a rule and its check cannot drift apart. A rule nothing can check says so and shows up as `unchecked` in every run. A token has to be read by something that paints, or it goes. Work moves through a build loop and an audit loop over four versioned primitives, and ends at a human gate that judges decisions rather than syntax. `CLAUDE.md` is the map; the rule book lives in `docs/`; this page is the shape.

## The one rule

```
 apps/docs/app/globals.css        values are decided here and nowhere else
 apps/docs/registry/**/*.tsx      consume tokens; never a raw colour or size
 registry.json entries            how each component is installed, and with what
        │
        ├─ derived ──▶ packages/ds-rules/rules/*.json · the built registry · the docs site
        └─ checked ──▶ the token gate, the contract check, the ladder, the story run
```

A rule in `CLAUDE.md` names the test that fails when it is broken, or it is recorded as ungated on purpose. `pnpm lint && pnpm typecheck && pnpm check:tokens && pnpm check:contract && pnpm test` green is the definition of on-system.

## Four primitives, versioned once

| Primitive    | What it is                                               | Where                                                                                                 |
| :----------- | :------------------------------------------------------- | :---------------------------------------------------------------------------------------------------- |
| Instructions | The file every agent session reads first                 | `CLAUDE.md`, with bodies under `docs/`                                                                |
| Rules        | One typed record per rule, with its detector and its fix | `packages/ds-rules/src/core.ts` and `local.ts`, emitted to `packages/ds-rules/rules/*.json`           |
| Skills       | The procedures an agent runs                             | `.claude/skills/`: `build-component`, `gate-run`, `integrate-batch`, `unslop`, `green`, `gate-repair` |
| Schemas      | The token name contract and the rule schema              | `packages/ds-rules/src/tokens.ts`, `packages/ds-rules/src/schema.ts`                                  |

## Three moments where a rule runs

1. **The test run.** `pnpm check:tokens` runs every blocker-severity rule over the catalogue; `pnpm check:contract` holds the registry to its contract; `pnpm test` runs each package's suite, including the rules package's drift gate. CI runs the same list.
2. **A write-time hook.** `.claude/hooks/check-tokens-on-edit.sh` runs after every Write and Edit and reports the token failures on the file just changed. Advisory, always exit 0.
3. **The audit skill.** `unslop`: the detector first, then the rendered passes, then fix by substitution.

## Two loops and a human gate

```
 BUILD   manifest ──▶ scaffold ──▶ component + story + registry entry ──▶ gates
                                     │
 AUDIT   token gate + contract check + the story run, on every PR
                                     │
 HUMAN   review judges the decisions; a rejection is encoded back into a rule
         so the same defect cannot recur
```

- A component ships with its story and its registry entry in the same commit, or it is invisible or untested.
- Rounds 1-2 fix everything worth fixing. From round 3 only a blocker holds the PR; the rest becomes a follow-up.
- A weakened test or gate, and contract prose the change made false, are blocker classes of their own.

## The ladder

`pnpm check:ladder` runs the vendored ds-architecture checker; `ds-architecture.config.json` maps this repo for it. `tools/ds-architecture/VENDOR.md` records which upstream commit is vendored.

## Read next

- `CLAUDE.md` for the rules that are easy to break by accident, each with its gate.
- `docs/design-system/review-rounds.md` for the human gate.
- `packages/ds-rules/README.md` for how a rule record becomes a detector.
