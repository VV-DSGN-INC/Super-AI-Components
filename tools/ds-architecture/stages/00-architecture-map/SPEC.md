# Stage 00 — Architecture map

## Problem

Ten stages need a shared vocabulary and a place to record where things are. Without
both, every later probe hardcodes a path — and a hardcoded path in a foreign target
scans nothing and reports clean.

## What this stage establishes

Four versioned primitives (instructions, rules, skills, schemas), two loops (build,
audit), one human gate. Plus `ds-architecture.config.json`, the file every later
stage's probe reads.

## Decisions

| Decision | Choice | Why |
|---|---|---|
| Config location | The target's root, not `ds-architecture` | It describes the target, and travels with it |
| Scope roles | A closed set of five | An open set lets a rule name a role no target defines, and a rule scoped to nothing reports clean |
| Config validation | Authored in zod, emitted to JSON Schema, drift-gated | Probes must stay dependency-free; the target's own tests want zod |
| Missing config | Exit `2`, never `1` | "Not configured" and "not conformant" are different facts |
| `appliesTo` | Required frontmatter, throws when absent | Defaulting to "applies" is wrong for six of the ten stages, and wrong silently |
| `claims` | Required frontmatter, declared as data, cross-checked against the probe in both directions | A probe that quietly stops emitting a claim is invisible: the claim appears in no section, which reads exactly like a stage that had nothing to say. Declared rather than parsed out of the numbered prose because a needle built from human sentences is right by luck on some inputs and permanently wrong on the rest |
| A stage directory missing `ACCEPTANCE.md` or `acceptance.mjs` | `unchecked`, naming the missing file | A `continue` made a stage with a spec and no probe exit `0` — the silent pass, one layer up from the probes it was built to police |
| Empty `scopeRoles` | `00.5` unmet, decided in the probe rather than the schema | `{}` is a well-formed config that simply has nothing scoped, so validity is the wrong question. Left alone, `unresolvedRoles` maps over zero entries and returns `[]`, which reads identically to "every role resolved" |
| The config validator's JSON Schema subset | Closed, and enforced by throwing on anything outside it | Returning `[]` for `oneOf`, a bare `minLength`, or `type: "integer"` makes an unimplemented constraint indistinguishable from a satisfied one. Widening the subset must be a deliberate edit announced by a failing run |
| Axis cell count | Product of `values.length + 1` | The unset state on each axis is a real cell that ships |
| `00.4` (config exists and validates) | Checked by the probe itself, via its own `loadConfig` call — not inferred from the caller | Reporting `met` because "the runner must have validated" is a claim resting on nothing having inspected it, and on the assumption that the runner is the only call path. The runner *also* validates before dispatch and exits `2` on failure — a deliberate second check, not redundancy: it aborts the whole run cheaply before any probe runs, while the probe's own read is what keeps `00.4` honest and testable when the probe is invoked directly, outside the runner |

## Rejected alternatives

- **Config inside `ds-architecture`.** It would describe one target, and cloning for a
  second would fork it.
- **An open scope-role vocabulary.** Flexible, and silently unenforceable.
- **A general JSON Schema validator dependency.** A dependency in the one place that
  must not have one.
- **Defaulting `appliesTo` to all profiles.** The convenient default is the wrong answer
  more often than the right one, and it fails quietly.
- **Putting the empty-`scopeRoles` check in the JSON Schema.** `minProperties` would have
  made `{}` an invalid config, and therefore exit `2` — "I could not tell". But the repo
  *can* tell: it read the config, and the config scopes nothing. That is exit `1`.
- **Trusting the runner for `00.4`.** Letting the probe report `met` on the runner's
  say-so was tried and rejected: it made `00.4` the one claim in this stage nothing
  actually inspected, and it broke the moment the probe was called outside the runner
  (directly, or from a future second caller) where no prior validation had happened.

## What a probe may assert

Structural facts read off the filesystem, never behaviour. Anything needing the target's
own test runner is a file in `reference/` that the target copies and runs itself; the
probe may check such a file exists and is reachable from `commands.test`, never that it
passes.

Every probe is control-tested against a fixture that must fail. A probe that cannot fail
passes silently, which is the failure this repo exists to prevent.
