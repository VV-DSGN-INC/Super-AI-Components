---
name: unslop
description: Anti-slop audit for UI built on <system name>. Use before building a screen, component or page (constraints first) and again before calling it done (audit, then fix). Also use when a screen looks generic or template-made.
---

# Unslop

<One paragraph: what <system name> has already decided. A screen only
instantiates those decisions; it never makes them again.>

## Phase 0: This repo's bindings

These are law for every screen and component in this repo.

- **Tokens:** <the token contract, e.g. `src/styles/globals.css` and
  `tokens.ts`, and the semantic utilities a component may write>.
- **Type:** <the declared type steps and the one family>.
- **Icons:** <the single module components import icons from>.
- **Radius, spacing, elevation:** <each scale, and which axis owns it>.
- **Components:** import from `<package name>`. Never rebuild a component
  the package already ships.

**Mechanical audit.** Run the detector, not greps from memory:

    node scripts/rulecheck.mjs                      # every severity
    node scripts/rulecheck.mjs --severity blocker   # what the hook enforces

**Exceptions to the core:** <each rule this system decided differently, with
its reason, or "none">.

<!-- The block between the markers is generated. From a checkout of the unslop
plugin, run `node skills/unslop/scripts/sync.mjs write <this repo>` to fill
and stamp it; `sync.mjs check <this repo>` reports when it falls behind. -->
<!-- unslop-core:start -->
<!-- unslop-core:end -->
