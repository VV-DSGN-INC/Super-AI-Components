---
appliesTo: [tokens-only, component-library, app-consumer]
claims: [09.1, 09.2, 09.3, 09.4]
---

# Stage 09 — Loops and conventions · acceptance

| Claim | Statement | Checked by |
|---|---|---|
| `09.1` | The instructions file describes a build loop, an audit loop, and a human gate. | `acceptance.mjs` |
| `09.2` | The five co-located files a component change produces are named. | `acceptance.mjs` |
| `09.3` | A review-round budget is written down, including what counts as a blocker. | `acceptance.mjs` |
| `09.4` | Worktree isolation and per-checkout install discipline are written down. | `acceptance.mjs` |

Every claim is a text assertion over the file `stage 00`'s claim `00.1` located. These
are deliberately coarse: the probe checks that the decision was *recorded*, not that it
was recorded well. A convention nobody wrote down gets re-litigated every session; a
convention written badly at least has a place to be argued with.

`09.3` exists because review loops do not end on their own. The budget's measured basis:
median 6 rounds, max 15, with 7 of 10 pull requests reaching round 3 or beyond.

`09.4` exists because one checkout has one HEAD. Switching branches in a shared checkout
carries every other session's uncommitted files onto your branch, and a checkout whose
dependencies predate a package degrades into type errors that read like an API change.

## Nonconformant fixtures

Four trees, each breaking exactly one claim: `no-loops`, `no-five-files`,
`no-round-budget`, `no-worktree-rule`.
