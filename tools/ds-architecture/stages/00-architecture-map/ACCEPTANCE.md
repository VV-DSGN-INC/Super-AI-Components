---
appliesTo: [tokens-only, component-library, app-consumer]
claims: [00.1, 00.2, 00.3, 00.4, 00.5, 00.6]
---

# Stage 00 — architecture map: claims

This stage's job is to make the target repo legible before any later stage probes
it: an instructions file a future agent can act on, and a config the rest of the
conformance run can trust. All six claims apply under every profile — a
tokens-only system, a component library, and an app consuming one all need an
instructions file and a valid config equally.

The `claims:` key in the frontmatter above is the machine-readable copy of that
list, and the runner cross-checks it against what `acceptance.mjs` actually
emits: a declared claim the probe never emitted becomes `unchecked`, and so does
an emitted claim nobody declared. Both directions, because both are drift. It is
declared as data rather than parsed out of the numbered prose below for the
reason this architecture keeps relearning — a needle built by parsing human
prose is right by luck on some inputs and permanently wrong on the rest, with
nothing telling the two apart.

1. **00.1 — an instructions file exists.** `AGENTS.md` or `CLAUDE.md` is present
   at the target root. Checked by `acceptance.mjs` via a filesystem existence
   check; no parsing involved.
2. **00.2 — it names a runnable definition of done.** The instructions file
   contains a backticked shell command invoking a known runner (`npm`, `pnpm`,
   `yarn`, `bun`, `make`, `cargo`, `just`). Checked by `acceptance.mjs` with a
   regex over the file's text. Reports `unchecked`, not `unmet`, when 00.1 is
   itself unmet — there is no file to read, and "I could not look" must not be
   indistinguishable from "I looked and it is missing."
3. **00.3 — it states where specs and plans live.** The instructions file
   mentions both a specs directory and a plans directory. Checked by
   `acceptance.mjs` with two regexes over the file's text. Same `unchecked`
   fallback as 00.2 when there is no file.
4. **00.4 — the config exists and validates.** `ds-architecture.config.json` is
   present at the target root and matches `src/config/config.schema.json`.
   Checked by `acceptance.mjs` itself, via its own `loadConfig` call. The
   conformance runner also validates before dispatch and exits `2` on failure,
   so in a normal run this claim is checked twice — deliberately. Reporting
   `met` because the runner must have validated would be a claim reporting
   success with nothing having inspected it, and it would rest on the
   assumption that the runner is the only caller. The second read is one file
   and one `JSON.parse`, and it is what makes this probe honest when called
   directly and testable in isolation.
5. **00.5 — at least one scope role is declared, and every declared role
   resolves.** Every glob array under `scopeRoles` in the config matches at
   least one existing path in the target tree. Checked by `acceptance.mjs` via
   `unresolvedRoles`; the `why` names every role that resolved to nothing,
   because a role matching nothing makes every downstream probe scan nothing and
   report clean. An **empty** `scopeRoles` map is `unmet` too, and this is the
   probe's job rather than the schema's: `{}` is a well-formed config that
   simply has nothing scoped, which is a conformance question, not a validity
   one. Left to `unresolvedRoles` alone it maps over zero entries and returns an
   empty list — reading identically to "every role resolved", so a target with
   no source tree at all would report all six claims met with nothing
   inspected.
6. **00.6 — the config declares a profile and adoption mode.** Both `profile`
   and `adoption` are present on the loaded config. Checked by `acceptance.mjs`
   directly on the parsed object.

Every `unmet` result carries a `fix` naming the concrete edit that clears it.
