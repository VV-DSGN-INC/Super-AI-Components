# Project review remediation — design

**Date:** 2026-09-17. **Baseline:** `main` at `e769e95` (PR #57 merged). **Plan:**
[`../plans/2026-09-17-project-review-remediation.md`](../plans/2026-09-17-project-review-remediation.md).

This is the record of a repo-wide review run on the baseline above, and the
scope for the plan that follows it. The review found nothing wrong inside the
component code: every gate is green, the catalog is complete, and production
serves the same component bytes as `main`. Everything it did find sits around
the code: licensing, a compatibility claim the registry cannot keep, an
undeployed contracts layer, a docs site that never shows dark mode, dependency
advisories, a status file that has rotted again, a serial CI job, and lint
noise. Each finding below is one task in the plan.

## 1. Measured state

| check                                                             | result                                                                                                                 |
| ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| lint, format:check, typecheck, check:tokens, check:contract, test | all green: 153 test files, 1792 tests, 35 lint warnings, 0 errors                                                      |
| last 8 CI runs                                                    | all green, about 9 minutes each                                                                                        |
| production deploy                                                 | 2026-09-13 21:26 EDT, built from the tree before PR #56                                                                |
| prod vs main, component code                                      | 0 of 134 registry items differ (every `files[].content`, `dependencies`, `registryDependencies` compared)              |
| prod vs main, contracts layer                                     | 134 items lack their `.meta.json` file; `/llms.txt`, `/llms-full.txt`, `/llms/components/*.md` return 404              |
| license                                                           | no `LICENSE` file; repo is public; `package.json` has no `license` field                                               |
| `pnpm audit --prod`                                               | 2 critical, 25 high; all in tooling (`next`, `sharp`, `postcss`, …), none in the 8 runtime deps registry items declare |

The prod diff was done by building `public/r` locally and fetching every
`/r/<name>.json` from `https://super-ai-components.vercel.app`; the plan's Task 4
checks that method in as `pnpm prod:diff` so §7 of CONTINUE.md stops being
prose.

## 2. Findings and decisions

### F1. No license (plan Task 1)

A public registry with no license grants nobody the right to install it. The
README, the docs site and the llms.txt corpus never state terms.

**Decision needed:** license and copyright holder. Default in the plan: MIT,
which is what shadcn/ui uses and what the vendored `components/ui` files are
under. Vendored AI Elements files are Apache-2.0 and need a notice either way.
The Magic UI components under `registry/marketing` were rebuilt from a
behavioural reference with no source copied (spec 2026-07-31 §Sourcing), so
they carry no third-party notice.

### F2. "Install (any shadcn app)" is false (plan Task 2)

The README, the per-component Installation block and the llms.txt header all
imply any shadcn app can install these items. A consumer on a Radix style
(`new-york`, `default`) fails to typecheck: `reviews/2026-09-10/evidence/super-ai-radix-consumer.log.txt`
shows `render` rejected on `DialogTrigger` and `DropdownMenuTrigger`, and
`onOpenChangeComplete` rejected on `DropdownMenu`. This is SAI-02 from the
September review and the "…but adapted" open question in CONTINUE.md §5.1. The
consumer install test runs `shadcn init --defaults`, so CI never exercises a
Radix consumer.

**Decision taken:** state the requirement in one constant and render it in all
three places rather than build a second consumer test. A Radix consumer test
would double the slowest CI step to prove a failure we already have a log for.

### F3. Production lacks the contracts layer (plan Task 8)

PRs #56 and #57 made the guidance module the shipped contract. None of it is
live. Deploys are manual, from `apps/docs`, and need the `weeeha` account; the
deploy is the last task so one upload publishes every other task's output.

### F4. CONTINUE.md status is stale in the pessimistic direction (plan Task 4)

§1 says "Deployed: No", §7 says 97 of 135 items differ and `initials` 404s, the
header says "Last updated 2026-09-07". A deploy landed the evening of
2026-09-13, after §7 was measured that day. One §8 entry has also expired: the
"nameless buttons in `recent-grid`" latent violation is fixed in source
(`recent-grid.tsx` passes `frameLabel` for the `none` placement and
`preview-tile.tsx` takes the `aria-labelledby` branch for `below`).

**Decision taken:** make §7 derivable. A checked-in script produces the table;
the section quotes its output and the date, nothing else.

### F5. The docs site never shows dark mode, has no mobile nav, and a flat home (plan Task 7)

`globals.css` declares `@custom-variant dark (&:is(.dark *))` and a full `.dark`
token block, but nothing sets the class and `prefers-color-scheme` is not
mapped, so 116 components have never rendered dark on the site. At 375px the
sidebar is `hidden md:block` with no substitute. The home page is a two-column
list of 134 items with no family grouping, filter, or install command.

**Decision taken:** class-based theming through `next-themes` (already in the
lockfile via Storybook; Storybook's docs container toggles the same `.dark`
class), a `Sheet`-based drawer for the sidebar under `md`, and a home grouped by
catalog family with a filter and the install command. The `unslop` skill runs
before and after, per CLAUDE.md.

### F6. Next.js 16.2.9 carries 11 advisories, 2 critical (plan Task 3)

All fixed in 16.3.3; latest is 16.3.5. On Vercel the image optimizer is
Vercel's, so real exposure is low, but the audit is red and the bump is a
minor. Related drift: the repo tests against `@base-ui/react` 1.5 and
`lucide-react` 1.17 while fresh consumers receive 1.8 and 1.46 unpinned.

**Decision taken:** bump `next` and `eslint-config-next` now; add Dependabot
grouped weekly so this stops being a manual audit. **Decision deferred:**
`@base-ui/react` 1.5 → 1.8 is the primitive the whole registry sits on and is
excluded from Dependabot; bump it deliberately with the full gate, in its own
PR. Pinning versions inside registry `dependencies` is also deferred: it would
override whatever a consumer already has installed.

### F7. CI is one serial job (plan Task 5)

CLAUDE.md records that a red early step has already hidden the three product
gates once. Two parallel jobs from one install make a lint failure and a
consumer-test failure visible in the same run. Cost: a second runner's install,
about a minute. The local mirror `run-gates.sh` stays sequential, because its
job is to stop at the first failure the way a reviewer reads a run.

### F8. Lint noise and file placement (plan Task 6)

35 warnings: 23 `no-img-element` (tests, demos, examples, vendored
`ai-elements`, and four shipped registry files), 9 unused vars (test rest
siblings, vendored file, one shipped `props`), 2 unused disable directives (one
shipped in `voice-clone-recorder.tsx`), 1 `exhaustive-deps` in the vendored
`ai-elements/message.tsx`. The 2026-09-10 architecture review sits at repo root
while its evidence lives in `reviews/2026-09-10/`.

**Decision taken:** scope `no-img-element` off where `next/image` is not the
right answer (registry sources ship to consumers who own their image
pipeline; demos, examples and tests never ship; vendored files are not ours to
restyle), fix the shipped `props` and the stale directives, and enforce zero
with `--max-warnings 0`. The review file stays at the root: it carries a dozen
root-relative evidence links that moving it would break, and rewriting them for
tidiness is churn. Plans for the cut family G stay where they are for the same
reason.

## 3. Not in scope

- The §8 composition-gap backlog (opt-outs for L6, M1, J1, J3, E5, F2; roving
  tabIndex in `choice-chips`, `preset-grid`, `gen-settings-bar`) and §5
  decisions 2, 3, 5 and 8. Already tracked; each is a design act.
- A Radix consumer test. See F2.
- `@base-ui/react` 1.8, registry dependency pinning. See F6.
- A `/roadmap` page (§5.8).
