# Composition gaps, batch 1 — Design Specification

**Date:** 2026-08-17
**Status:** Approved, not started.
**Follows:** [`CONTINUE.md` §8](../../CONTINUE.md), the composition-gap backlog produced by the
family-O fan-out. This spec takes the first five of its ~20 entries and closes them. Two of those
five entries are corrected here: they name the wrong file as the cause.

| | |
| --- | --- |
| Scope | Five gap groups: A8 frame naming, vendored `ui/tabs` contrast at our call sites, B1's clipped bottom slots, carousel arrows drawn outside their own box, viewport-keyed grid columns |
| Touches | `preview-tile`, `feature-card-row`, `artifact-grid`, `recent-grid`, `frame-strip`, `parameter-panel` / `run-inspector` (TabsList sites), the five embeddable shells, `CONTINUE.md` §8, `vendored-token-findings.md` |
| Explicitly out | The other ~15 §8 gaps, all new gates, every edit to a vendored file, the `--warning` token decision |

---

## 1. Why these five, in this order

`CONTINUE.md` §8 orders its entries by **how many builders hit them**. That is the right ordering
for "what is the component layer worst at", and the wrong one for "what is broken for someone
right now". Two entries filed under *smaller, but real* are shipping defects today:

- **A8 `preview-tile`** produces a nameless button whenever an interactive tile uses
  `labelPlacement="below"` or `"none"`. C4 `recent-grid` does exactly this at two call sites, so
  the violation is live in a shipped component. §8 already flags it as "a latent violation in a
  shipped component, not yet caught by a gate."
- **Vendored `ui/tabs.tsx`** pairs `text-muted-foreground` with `bg-muted` — 4.34:1 against a
  4.5:1 minimum, the exact pairing `check:tokens` exists to catch. Any consumer taking the default
  `TabsList` variant hits it.

So this batch runs **consumer-broken first, then the three-or-more-builder tier**. The remaining
§8 entries (the missing opt-outs and the rest of the smaller tier) are untouched and stay in
`CONTINUE.md` as the backlog.

## 2. Definition of done, and why it is countable

Every gap in §8 has a **workaround living in a shipped block**, and in this repo those workarounds
are already legible: each is a named constant at the top of its shell, with a comment explaining
what it compensates for. That makes done measurable rather than assertable.

A fix is not done when the component gains a prop. It is done when the constant that existed
because the prop was missing has been **deleted**, and the shell still renders correctly without
it. The shell is the proof; the component change is only the claim.

| Evidence of done | Where it lives today |
| --- | --- |
| `FEATURE_ROW_ARROW_GUTTER = "px-9"` deleted | `home-shell.tsx:81` |
| `ARTIFACTS_IN_STREAM` deleted | `chat-shell.tsx:85` |
| `GRID_BESIDE_SIDEBAR` deleted | `artifact-shell.tsx:78` |
| The `footer`/`promo` clip warnings deleted | 5 shells' JSDoc + 5 docs pages |
| C4's two interactive tiles carry accessible names | `recent-grid.tsx:98`, `:120` |
| Both default-variant `TabsList` sites pass contrast | 2 of 4 TabsList consumers |

This is the same measure `CONTINUE.md` §1 already applies to the A-family retrofit: "had
`cost-chip` still carried its default, the compensation list would have grown rather than gone to
zero."

## 3. Two backlog entries name the wrong file

Both were verified against source before this spec was written. Both would have sent an agent to
change something that is working.

### 3.1 B1 `app-sidebar` is not the defect

§8 says the bottom-anchored slots are clipped "by its own `[contain:layout]`". `app-sidebar.tsx`
contains no `contain` rule; it wires `promo` and `footer` correctly at lines 50–59. The actual
mechanism is two files away:

- the vendored `sidebar-container` is `fixed inset-y-0 z-10 h-svh` (`ui/sidebar.tsx:233`);
- the shells wrap themselves in `EMBEDDABLE_SHELL = "[contain:layout]"` so that fixed box does not
  escape to the browser's left edge — which is correct and must stay;
- containment redirects **where** the box is anchored, but `h-svh` still sets its height from the
  **viewport**. In any shell shorter than the viewport, the sidebar's box is taller than its own
  container, so everything bottom-anchored falls below the shell's visible edge.

The consequence for the plan: **one companion class in five shells fixes all four reports at
once**.

A correction to this correction, found while planning: the block builders got the mechanism
**right**. `home-shell.tsx:110-116` says "the containment that keeps the shell embeddable also
clips B1's `h-svh` box", and `chat-shell.docs.tsx:109` goes further, naming the fix — "until the
sidebar primitive learns to measure its containing block instead of `svh`". Only `CONTINUE.md`
§8's one-line summary misattributes it to `app-sidebar`. Unwinding is therefore deleting an
accurate warning that has stopped being true, not correcting a wrong one.

The unwind surface is also larger than a first read suggests: **five shells and five docs pages**,
not four JSDoc comments. Each shell carries the warning on its `sidebarPromo` / `sidebarFooter`
props (`docs-shell` calls its slot `railFooter`), and each docs page repeats it in both a `donts`
entry and a `pitfalls` entry.

### 3.2 `ui/tabs.tsx` is not outside the token gate's scan scope

§8 says the pairing sits "outside its scan scope". `check-tokens.mjs:5` globs
`{registry/{super-ai,marketing},components/ui}/**/*.tsx`, so the file **is** scanned, and
`findCvaViolations` already detects this exact shape: `text-muted-foreground` in the cva base
(`tabs.tsx:19`) against `bg-muted` in the `default` variant value (`tabs.tsx:24`). It is found,
then **downgraded to a warning** because the file is vendored and diverging from upstream is an
undecided question.

The gate is working. The policy is what let this ship. Recording that distinction matters: the
remedy is not a checker change.

## 4. The five fixes

### 4.1 A8 `preview-tile` — naming and the false toggle

Today `interactive = typeof onSelect === "function"` and the frame renders as a `button` with
`aria-pressed={selected}` unconditionally (`preview-tile.tsx:41–54`). The button's only accessible
name is the overlay label rendered inside it, so `labelPlacement="below"` and `"none"` both ship a
nameless control, and every interactive tile claims to be a toggle even when it opens something.

The component's own story file already diagnoses this and names the better fix. `EmptyLabel` says:
"The real fix is an `aria-labelledby` from the frame to the label element; that is API-shaped, so
it is recorded rather than done here." Planning confirmed it is the right call, so this spec
adopts it in preference to the string prop it originally proposed:

- **`labelPlacement="below"` self-names.** The label already renders as a sibling span
  (`preview-tile.tsx:120-124`). Give it a `useId` and point the frame at it with
  `aria-labelledby`. **No new prop**, no duplicated string, and the name cannot drift from the
  visible label. This fixes `recent-grid`'s grid layout with no call-site change at all.
- **`frameLabel?: string`** remains, for `labelPlacement="none"` only — there is no label element
  to point at, so a name has to be supplied. This is what `recent-grid`'s list layout needs.
- **`selectMode?: "toggle" | "open"`**, default `"toggle"` — `"open"` omits `aria-pressed`.

The `aria-labelledby` half is the one departure from additive-only in this fix, and it is narrow:
nothing renders differently and no prop changes meaning: a button that had no accessible name
gains the one already sitting beside it. Nobody can depend on a control being nameless. The
alternative, making `below` consumers pass `frameLabel` to get a name, would duplicate a string
already in the DOM and leave the default broken.

Residue, deliberate and recorded: a tile with `labelPlacement="none"` and no `frameLabel` still
produces a nameless button. There is nothing to name it with, so this is a documentation
obligation rather than a defect the component can close.

A story exercising `labelPlacement="below"` with `onSelect` is part of this fix. The defect was
invisible because no story staged it; the axe gate cannot fail on a combination nothing renders.

### 4.2 Vendored `ui/tabs` — fixed at our call sites

No vendored file is edited (§6). Four registry components use `TabsList`. Two already pass
`variant="line"`, which is `bg-transparent` and carries no violation: `explore-shell.tsx:360` and
`tool-panel.tsx:329`. The two default-variant sites — `parameter-panel.tsx:294` and
`run-inspector.tsx:301` — take either `variant="line"` or the rebind documented in `CLAUDE.md`:
`[--muted-foreground:var(--accent-foreground)]` on the list.

The rebind is the correct tool rather than restyling the trigger slots, for the reason `CLAUDE.md`
already gives: composed children carry their own muted classes and a slot-level override cannot
reach them.

`vendored-token-findings.md` gains a line recording that the default `TabsList` variant is unsafe
for consumers, which is the part of this defect we cannot fix from our side.

### 4.3 B1 — one companion to `EMBEDDABLE_SHELL`

Given §3.1, the fix constrains the fixed container to its shell rather than the viewport:

```
[&_[data-slot=sidebar-container]]:h-full
```

applied alongside `EMBEDDABLE_SHELL` in all five shells. `EMBEDDABLE_SHELL` itself stays: it is
load-bearing and correct. `app-sidebar` is not modified.

Unwind: the four `footer`/`promo` JSDoc warnings are deleted and both slots become live.

### 4.4 Carousel arrows

Vendored `CarouselPrevious` / `CarouselNext` position themselves at `-left-12` / `-right-12` when
horizontal (`ui/carousel.tsx:198`, `:228`). In a constrained column they are clipped or they turn
the page into a horizontal scroller — O1 measured 407px of content in a 375px column, all of it
the arrow.

C3 `feature-card-row` and H5 `frame-strip` already pass `data-slot` to both arrows; each gains a
className placing the arrow inside its own box. Four one-line changes.

Unwind: `FEATURE_ROW_ARROW_GUTTER` is deleted from `home-shell`.

### 4.5 Grid columns keyed to the container

J4 `artifact-grid:334` is `grid gap-3 sm:grid-cols-2 lg:grid-cols-3`; C4 `recent-grid:166` is
`grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4`. Both key off the viewport, so every shell
that puts a grid beside a sidebar shifts each breakpoint up a step by hand.

Both switch to container queries: `@container` on the grid's wrapper, `@sm:` / `@lg:` on the
column classes. Tailwind v4 supports these natively.

**This is the one deliberate exception to the additive-only rule**, and it is narrow: at full
width a container query resolves identically to the viewport query, so a standalone consumer sees
no change. Inside a narrow column it renders correctly instead of over-columned — which is the
defect. Putting it behind a prop was considered and refused: the prop would exist only so callers
could opt into correct behaviour, and every current caller would pass it.

Unwind: `ARTIFACTS_IN_STREAM` and `GRID_BESIDE_SIDEBAR` are deleted.

## 5. Execution — three phases, no file touched twice

Partitioning by **gap** collides: `recent-grid` is wanted by both §4.1 and §4.5, so two agents
would hold the same file, and all the unwinding lands in the same five shells. Partitioning by
**file** removes every collision, at the cost of one extra phase for the single file that
consumes another phase's new API.

**Phase 1 — parallel, 5 agents, registry files only, never a shell**

| Agent | File | Fix |
| --- | --- | --- |
| 1 | `preview-tile.tsx` | §4.1 props + story |
| 2 | `feature-card-row.tsx` | §4.4 arrows |
| 3 | `frame-strip.tsx` | §4.4 arrows |
| 4 | `artifact-grid.tsx` | §4.5 container queries |
| 5 | `parameter-panel.tsx`, `run-inspector.tsx` | §4.2 TabsList sites |

**Phase 2 — one agent, the only consumer of phase 1's new API**

| Agent | File | Fix |
| --- | --- | --- |
| 6 | `recent-grid.tsx` | adopt `frameLabel` + `selectMode="open"` at both call sites; §4.5 container queries |

`frame-strip` was checked and is **not** a phase 2 file. It composes `preview-tile` with
`labelPlacement="overlay"` and `selected={active}` (`frame-strip.tsx:141–148`), so its tiles are
genuine toggles whose overlay label names the button. It has no A8 naming defect and needs
nothing from phase 1, which is why it sits in phase 1 with its arrow fix alone. Recorded so the
next reader does not re-derive it.

**Phase 3 — sequential, integrator, one pass**

The five shells opened once each: add §4.3's companion class, delete `FEATURE_ROW_ARROW_GUTTER`,
`ARTIFACTS_IN_STREAM`, `GRID_BESIDE_SIDEBAR`, and the clip warning from each shell's
`sidebarPromo` / `sidebarFooter` / `railFooter` JSDoc. Then the five matching docs pages, where
the same warning appears twice each (a `donts` entry and a `pitfalls` entry). Finally correct
`CONTINUE.md` §8 per §3 of this spec, and add the `vendored-token-findings.md` line from §4.2.

Parallel mechanics per `CONTINUE.md` §3.4 and §1: each agent gets its own git worktree **cut from
the integration branch, not `main`**, and its own port and browser tab. The base-commit check is
not optional — the family-O fan-out lost time to twelve worktrees cut from `main` that could not
see the prep.

## 6. Vendored-file policy for this batch

**No file under `components/ui/` is edited.** Both B1 and the tabs contrast defect originate in
vendored code and are fixed from our side: a shell-level class for the first, call-site props for
the second.

This keeps `shadcn add` upgrades mergeable and requires no new decision. It also means the tabs
defect remains real for any consumer who installs a component of ours that composes a stock
`TabsList` — recorded in `vendored-token-findings.md` rather than silently accepted.

## 7. Verification

The B1 and carousel fixes are layout and containment bugs. **They cannot be asserted in jsdom** —
there is no layout there to measure — so each needs a real-browser assertion, via Playwright or a
Storybook interaction test:

- a shell rendered shorter than the viewport, asserting its sidebar footer is within the shell's
  visible bounds;
- a carousel at 375px, asserting no horizontal overflow of its container.

Rebuild before running Playwright: `playwright.config.ts` runs `pnpm start`, and `next start`
serves the **prebuilt** output, so editing source without rebuilding tests a stale app.

Full gate order from the **repo root** at the end of each phase, per `ci.yml`: `lint` → `typecheck`
→ `check:tokens` → `check:contract` → `test` → `build:registry` → `build` → Playwright smoke →
Storybook a11y → consumer install test.

## 8. Success criteria

1. All six rows of §2's table are true.
2. `check:tokens` reports one fewer warned vendored file, or the two call sites no longer resolve
   to the muted pairing.
3. The axe gate passes on a story that renders `preview-tile` with `labelPlacement="below"` and
   `onSelect` — a combination no story staged before this batch.
4. Two real-browser assertions exist and pass (§7).
5. `CONTINUE.md` §8's B1 and `ui/tabs` entries name the correct cause.
6. No file under `components/ui/` appears in the diff.

## 9. Non-goals, and what stays open

- **No new gates.** Fix-and-unwind was chosen over fix-unwind-and-gate, so the arrow-position and
  viewport-breakpoint classes can recur. If they do, that is the argument for gating them, and it
  will be better evidenced then than now.
- **The other ~15 §8 gaps stay open**, including the whole missing-opt-outs tier.
  `FOLDERS_NO_VIEW_SWITCH` (`records-shell`) and `COMPOSER_NO_NEGATIVE_PROMPT` (`chat-shell`) will
  still be sitting in their shells after this batch. Their presence is not a failure of this work.
- **The `--warning` token decision is untouched.** It is recorded in `CONTINUE.md` as deliberately
  unfixed because defining the variable turns several components red at once, and `text-warning`
  measures ~2.2:1 where it does resolve. Nothing here changes that.
- **A8's `labelPlacement="none"` remains capable of producing a nameless button** when no
  `frameLabel` is passed (§4.1). Unlike the `below` case there is no label element to point at, so
  the component cannot close this itself. Written down rather than assumed away.
