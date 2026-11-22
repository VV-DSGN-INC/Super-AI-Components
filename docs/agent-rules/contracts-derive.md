# Contracts derive

This rule protects the one authored source of a component's usage judgments.

`ComponentDocs` in `apps/docs/lib/component-docs.ts` is the contract. The shipped `<name>.meta.json`, `index/components.toon` and `public/llms*` all derive from it, so never hand-edit them. Change the guidance module and run `pnpm contract:emit`, which writes every derived file.

The full account: `docs/superpowers/specs/2026-09-14-agentic-contracts-design.md` D23 (§3) and §5.

## What it costs

A hand edit to a derived file is erased by the next emit, or survives as a second authored copy that disagrees with the first. `contract-emit.test.ts` fails on any byte of difference, so the drift is caught, but late. Following the rule costs an author an emit run after each guidance change.
