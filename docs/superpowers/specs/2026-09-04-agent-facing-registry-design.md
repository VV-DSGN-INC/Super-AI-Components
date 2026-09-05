# Agent-facing registry — fill the channels that actually carry content

**Date:** 2026-09-04 · **Status:** designed, pre-plan · **Owner:** Nick + Claude

**Extends** the registry emitter (`apps/docs/scripts/gen-registry.mts`) and the typed
docs modules whose citations `check:contract` already verifies.

**Origin:** the ladder review of 2026-09-04, which scored this library against the
`ds-architecture` ladder and found stages 00–03 met and 04–07 partial. The review's
follow-up question was "agentic ready", resolved into two directions: agents building
the remaining backlog _in_ this repo, and agents building real apps _from_ the
published registry. This spec is the first slice of the second direction.

---

## 1. Why

**The registry is the product, and a coding agent is now one of its consumers.** An
agent asked to build an approval flow in a consumer app can already reach this
registry: `shadcn` ships an MCP server (`shadcn mcp`), and any harness that speaks
MCP — Claude Code, Cursor, Codex — can query it. What it gets back today is close to
nothing: a name, a terse description, a dependency list, and a _count_ of files.

Everything this repo knows about when to reach for a component, what not to do with
it, and which near-twin to use instead lives in two places an agent never sees: the
docs site's rendered prose, and 116 typed docs modules that are compiled into the
Next.js app and shipped nowhere else.

**This is a distribution gap, not an authoring gap.** The judgments exist. The
demos exist. The transport exists. Nothing connects them.

## 2. What the tooling actually surfaces — measured, 2026-09-04

Against `shadcn@4.11.0` as installed in `apps/docs`. The MCP server exposes five
tools; the formatter each one uses is what decides whether a field ever reaches an
agent.

| MCP tool                            | Returns                                                              | Carries our content?                                      |
| ----------------------------------- | -------------------------------------------------------------------- | --------------------------------------------------------- |
| `search_items_in_registries`        | name, type, description, registry, add-command                       | **Yes** — fuzzy match is over _name and description only_ |
| `view_items_in_registries`          | name, description, type, `**Files:** N file(s)`, dependencies        | **No** — the count, never the content                     |
| `get_item_examples_from_registries` | name, description, and every file's **full source** in fenced blocks | **Yes** — the only tool that returns code                 |
| `get_add_command_for_items`         | the `shadcn add` command line                                        | n/a                                                       |
| `get_audit_checklist`               | a fixed generic checklist                                            | n/a, and not ours                                         |

Three findings follow, and each one changed this design:

- **`docs`, `meta` and `categories` are accepted by `registryItemSchema` and
  surfaced by no MCP tool.** Verified by parsing a probe item (all three survive
  validation) and by reading the view formatter, which emits only the six fields
  above. Shipping judgments into `meta` today would be writing to a channel nothing
  reads.
- **The examples tool is keyed on naming.** Its own description tells the agent to
  search `{item-name}-demo`, `{item} example`. It fuzzy-matches the registry for
  those, then dumps full file contents. **This repo has 131 demo files and publishes
  none of them**, so the tool returns nothing for every query against this registry.
- **Findability rests entirely on `description`.** Not on `categories`, not on
  `docs`. The current descriptions name the shape, as A1's does in naming a keycap
  chip, which is what a _designer browsing a catalog_ needs and not what an agent
  matching intent needs.

Nothing reconciles `description` against `catalog.md`: `gen-manifest.mts` is wired
to no script and to no CI step, and the two already differ (`catalog.md` row A1 says
"Keycap chip"). Descriptions are therefore free to change in the manifest.

## 3. Decisions

1. **Examples are the payload channel.** Every shipped item with a demo gets a
   sibling registry item, `<name>-demo`, of type `registry:example`, carrying the
   demo source. This is the only path that returns code to an agent, and the files
   already exist under `apps/docs/components/demos/` — one per shipped item, an
   invariant `demos.generated.test.ts` already gates in both directions. Both tiers
   are covered: 116 super-ai demos and 15 marketing demos. `cost` and
   `use-view-mode` have no demo and get no example item.

   **Targets and dependencies.** An example lands in an `examples/` subfolder
   beside its tier's components:

   | tier      | example target                                  |
   | --------- | ----------------------------------------------- |
   | super-ai  | `components/super-ai/examples/<name>-demo.tsx`  |
   | marketing | `components/marketing/examples/<name>-demo.tsx` |

   The subfolder is chosen so an example can never collide with a component
   file. Its `registryDependencies` are reconciled from the demo's
   _real_ imports, the same rule `CONTINUE.md` §3.5 already sets for components and
   `reconcile-deps.mts` already implements — never from an assumed list. That
   reconciliation must at minimum resolve the demo's own component, so that adding
   an example pulls the thing it demonstrates.

2. **Demo imports are rewritten on the published artifact, not left to the CLI.**
   Demos import through this repo's own aliases, which do not exist in a consumer
   app. They are rewritten to the tier's declared install target:

   | in the demo source            | in the published example        |
   | ----------------------------- | ------------------------------- |
   | `@/registry/super-ai/<name>`  | `@/components/super-ai/<name>`  |
   | `@/registry/marketing/<name>` | `@/components/marketing/<name>` |

   `@/components/ui/*`, `lucide-react` and `react` are already correct in a
   consumer and are left alone; an import survey of all 131 demos found no other
   shapes. The CLI's own import transformer is not relied on: it recognises its own
   style names, and depending on it would make correctness a property of a vendored
   implementation detail rather than of ours.

   **Where the rewrite runs, and why it is not the emitter.** `registry.json`
   carries file _paths_, and `shadcn build` inlines each file's content by reading
   that path from disk — **discarding any inline `content` an item supplies.**
   Measured 2026-09-04 against `shadcn@4.11.0` by building an item whose `content`
   was a sentinel string: the sentinel did not survive. So the rewrite cannot
   happen in `gen-registry.mts`. It runs as a post-build pass over `public/r/*.json`,
   chained into `build:registry` after `shadcn build`, which is also exactly the
   artifact a consumer and the MCP server fetch. The alternative considered and
   rejected was staging 131 transformed copies of the demos on disk: it duplicates
   every demo in the tree, creates a drift site, and puts files carrying
   consumer-only aliases inside a typechecked workspace.

3. **The completeness check lives in the build script, not in a test.** `pnpm test`
   is CI step 5 and `pnpm build:registry` is step 6, so a vitest reading
   `public/r` would read _the previous build's output_ and pass against stale,
   un-rewritten content. That is the same stale-artifact trap as `next start`
   serving a prebuilt app, which has already cost this repo a debugging session.
   The post-build script therefore asserts its own completeness — zero surviving
   repo-internal aliases, and a loud failure if it matched no example items at all
   — and exits non-zero. Pure rewrite logic is unit-tested separately.

4. **Descriptions are rewritten to carry the decision, not the shape.** One line per
   shipped item, phrased as what the component decides or affords, because fuzzy
   search over name and description is the whole of an agent's discovery. The same
   field renders as the docs page subtitle, so this improves both surfaces; it is
   not a second copy.

5. **`categories` ships from the item's family.** Free, correct, and useful to the
   CLI's own `search`, even though the MCP ignores it today.

6. **`docs` ships the prose the docs modules already carry** (PR 2): `whatItIs`,
   `usage`, `dos[].text`, `donts[].text`, `pitfalls`, and the accessibility notes.
   Text only — `dos[].example` is a React node and does not serialize. This reaches
   agents through the CLI (`shadcn docs`, and the post-install output of
   `shadcn add`), not through the MCP.

7. **An `llms.txt` route** (PR 2) covers every shipped item plus the house rules a
   composing agent needs — chiefly _blocks compose, they do not implement_, and the
   `--muted-foreground` rebind — for agents that browse rather than speak MCP.

8. **`meta` is deferred, deliberately.** Structured judgments (`insteadUse`,
   `pairsWith`, per-variant intent) belong to ladder stage 04, which this repo has
   not done. Inventing them here would create a second home for judgments and
   invite exactly the drift the rules-as-records architecture exists to end, in a
   field no consumer currently reads. It waits for stage 04.

9. **Examples install in the consumer test.** The test derives its install list from
   `registry.json` and then runs `pnpm build` on the consumer app, so a demo whose
   imports do not resolve fails the build. That is precisely the control decisions 2 and 3
   need, and it is worth the CI time.

## 4. Scope

**In:** example-item emission with import rewriting; the description rewrite;
`categories`; the `docs` field; the `llms.txt` route; the gates and controls in §6.

**Out:** `meta` and stage-04 judgments (decision 8). New components. Any change to
the eleven-step shape of `ci.yml`. The Claude Code plugin layer — a skill and the
rulecheck hook running in a _consumer's_ session is a thin layer on top of this one,
and is only worth writing once the payload it would cite is real. The other agentic
direction (flows for shrinking this repo's own backlog) is a separate spec.

## 5. Rollout — two PRs

**PR 1 — the MCP channel.** Example items, the import rewrite, the description
rewrite, `categories`, and their gates. This is the PR that makes an agent using
Cursor's or Claude Code's shadcn MCP get working code out of this registry.

**PR 2 — the prose channel.** The `docs` field and the `llms.txt` route, with a
drift gate tying both to the docs modules.

PR 1 stands alone and is the one that matters; PR 2 is additive and can slip.

## 6. Gates and controls

Everything rides inside existing CI steps. No new step, per `CLAUDE.md`.

- **Emission round-trips the schema.** `gen-registry.mts` already parses the whole
  registry against shadcn's own `registrySchema` before writing, and `shadcn build`
  validates again; example items ride both.
- **Pairing, both directions.** Every shipped item with a demo has an example item,
  and every example item traces back to a shipped item. Mirrors
  `demos.generated.test.ts`, which is where the demo-per-item invariant already
  lives.
- **The rewrite control, in the build script.** No published example file content
  may contain `@/registry/`. This is the assertion that proves decision 2 actually
  ran, and per decision 3 it lives in the post-build script rather than a vitest,
  because a test would read the previous build's output. It is written to fail
  first against un-rewritten content before the rewrite exists, and it also fails
  loudly if it matches zero example items, so a filter that stops matching cannot
  report success.
- **The rewrite's semantics are unit-tested** on the pure function, in both
  directions: an alias is rewritten, and content that is already consumer-correct
  is returned untouched.
- **The consumer test is the end-to-end control.** It installs every item and builds
  the app; a demo importing something a consumer does not have breaks the build.
- **PR 2 drift gate.** Regenerating `docs` from the docs modules on an unchanged
  tree produces no diff, and `llms.txt` names every shipped item.

## 7. Risks

- **Registry size roughly doubles**, and the consumer test installs all of it.

  |            | items in `registry.json`             |
  | ---------- | ------------------------------------ |
  | today      | 133 (118 component, 13 block, 2 lib) |
  | after PR 1 | 264                                  |

  Mitigation: none proposed, accepted deliberately. If CI time becomes the binding
  constraint, the fallback is to install a named sample of examples rather than all
  of them, and that decision should be taken on a measured runtime rather than
  pre-emptively.

- **Demo content becomes consumer-facing.** A demo written as a docs-site fixture is
  now code an agent will copy. The story convention's fixture rule ("demo content
  must be something this system could really emit") already governs these files, and
  the `unslop` skill's fabrication ban applies. Worth one pass over the demos for
  invented company names during PR 1's review, not a blocking prerequisite.

- **The CLI's formatters are a vendored dependency.** This design is calibrated to
  what `shadcn@4.11.0` surfaces. A later version that starts rendering `docs` or
  `meta` would make PR 2 reach MCP agents too, which is upside, but the measurement
  in §2 should be re-run rather than trusted when the CLI is upgraded.

- **Descriptions are load-bearing twice.** They drive agent discovery and the docs
  page subtitle. A rewrite optimised only for fuzzy matching could read badly on the
  page. The rule: write the decision in plain language, and read it back on the page
  before landing.

## 8. Verification

- **The rewrite control is planted first.** Emit one example item with an
  un-rewritten import, watch the assertion fail, then implement the rewrite. A green
  run before that failure has been seen proves nothing (`MANUAL.md` Part 10, and the
  repo's own history of gates that could not fail).
- **The examples tool is exercised against a real MCP client**, not assumed: query
  `approval-card-demo` and confirm full source comes back.
- **A search control:** query an intent phrase the old description could not match
  and the new one can, and confirm the item is returned.
- Gates from the repo root in `ci.yml` order, including the consumer test, before
  either PR is called done.

## 9. References

- `apps/docs/scripts/gen-registry.mts`, `apps/docs/scripts/lib/registry-extras.ts`,
  `apps/docs/components/demos/`, `apps/docs/scripts/consumer-test.sh`.
- `apps/docs/lib/component-docs.ts` (the `ComponentDocs` shape PR 2 serializes),
  `apps/docs/scripts/check-citations.mts` (which already keeps its prose honest).
- `docs/design-system/story-conventions.md` (fixture rules that now govern
  consumer-facing demo content), `docs/CONTINUE.md` §8.
- The ladder review of 2026-09-04 and the stage 04 gap it records, which decision 8
  defers to.
