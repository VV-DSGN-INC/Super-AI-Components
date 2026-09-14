# Conformance ladder

Run: `node <path-to>/ds-architecture/scripts/conformance.mjs .`

| Stage | Status | Notes |
|---|---|---|
| 00 architecture map | built | |
| 01 token contract | built | `01.4c` is always `unchecked` — coverage needs the target's runner |
| 02 rule catalogue | pending | |
| 03 gate moments | pending | |
| 04 component meta | pending | |
| 05 derivation | pending | |
| 06 story coverage | pending | |
| 07 docs generation | pending | |
| 08 design-tool sync | pending | |
| 09 loops and conventions | built | |

`highestContiguous` from the runner is the honest number: stage 06 conformance with
stage 04 unmet is not "reached stage 6".

`highestContiguous` is computed over applicable stages in order, so a built stage 09
does not raise the number while stages 02–08 are unbuilt. That is the intended reading:
the ladder is climbed in order, not collected.
