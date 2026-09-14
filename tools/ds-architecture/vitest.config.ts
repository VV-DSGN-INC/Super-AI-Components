import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts", "scripts/**/*.test.ts", "stages/**/*.test.ts"],
    // Neither fixtures nor reference templates are tests OF THIS REPO.
    //
    // `__fixtures__` are input to the probes. Stage 01's fixtures carry
    // placeholder `contrast.test.ts` / `liveness.test.ts` files purely so the
    // probe has something to find, and without this the suite collected ten of
    // them. That is not only noise: the moment a fixture needs a deliberately
    // FAILING test to represent a nonconformant target, this repo's own suite
    // would go red for a fixture behaving exactly as designed.
    //
    // `reference/` holds templates a TARGET copies. They are written against a
    // target's layout — `reference/liveness.test.ts` reads
    // `src/styles/globals.css` at module scope, which this repo does not have
    // and never will. Collected, it fails on ENOENT forever.
    //
    // Note this excludes the reference DIRECTORY, not `reference.test.ts` at a
    // stage root — those are real tests asserting the templates are well-formed,
    // and they still run.
    exclude: ["**/node_modules/**", "**/__fixtures__/**", "**/reference/**"],
  },
})
