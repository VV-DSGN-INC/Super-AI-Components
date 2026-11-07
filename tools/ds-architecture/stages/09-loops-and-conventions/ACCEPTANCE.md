---
appliesTo: [tokens-only, component-library, app-consumer]
claims: [09.1, 09.2, 09.3, 09.4, 09.5, 09.6]
---

# Stage 09 — Loops and conventions · acceptance

| Claim | Statement | Checked by |
|---|---|---|
| `09.1` | The instructions file describes a build loop, an audit loop, and a human gate. | `acceptance.mjs` |
| `09.2` | The five co-located files a component change produces are named. | `acceptance.mjs` |
| `09.3` | A review-round budget is written down, including what counts as a blocker. | `acceptance.mjs` |
| `09.4` | Worktree isolation and per-checkout install discipline are written down. | `acceptance.mjs` |
| `09.5` | The blocker taxonomy names a weakened existing test or gate, and contract prose the change made false. | `acceptance.mjs` |
| `09.6` | Each review reads a report of the lines the change removed or changed in tests that existed before it, against the author's stated reasons. | **unchecked**: review-process behaviour, no file to read |

Claims `09.1` to `09.5` are text assertions over the file `stage 00`'s claim `00.1` located. These
are deliberately coarse: the probe checks that the decision was *recorded*, not that it
was recorded well. A convention nobody wrote down gets re-litigated every session; a
convention written badly at least has a place to be argued with.

`09.3` exists because review loops do not end on their own.

`09.4` exists because one checkout has one HEAD. Switching branches in a shared checkout
carries every other session's uncommitted files onto your branch, and a checkout whose
dependencies predate a package degrades into type errors that read like an API change.

`09.5` exists because a review loop that approves is only as good as its definition of
a blocker. Two failure classes pass a suite and a reviewer that reads only for defects:
a change that keeps a test's name and still passes while no longer pinning what it did,
and a change that leaves a doc, a meta field or a comment stating something the code no
longer does. Both go in the taxonomy by name, or each reviewer defines blocker privately.

## Why `09.6` is a separate, unchecked claim

Whether a review reads a test-change report is a fact about how reviews run, not about
any file in the target. `09.5` can show the class was written down; nothing a probe can
open shows the report was read. Emitting `09.6` unchecked on every run keeps that gap in
the output instead of letting a green `09.5` stand in for it. `starter-kit/09-conventions/`
carries the report script and a review skill that consumes it; running them is the
target's evidence.

## Nonconformant fixtures

Five trees, each breaking exactly one claim: `no-loops`, `no-five-files`,
`no-round-budget`, `no-worktree-rule`, `no-test-gate-class`. `no-file` carries no
instructions file and makes every claim `unchecked`.
