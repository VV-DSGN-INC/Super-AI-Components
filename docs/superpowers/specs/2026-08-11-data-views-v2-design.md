# Family P — the collection and record axes

**Status:** approved 2026-08-11
**Scope:** ports the two-axis browse/open contract from
[`DS-WebApp-Shells`](https://github.com/weeeha/DS-WebApp-Shells) into this registry as two catalog
items plus one lib contract, under a new **family P**, as the v2 project the catalog freeze
anticipated. Ends with `shadcn-shell` consuming the registry instead of authoring its own copies.

This spec does **not** cover O10 `records-shell`. That block composes these items and gets its own
spec once they ship.

---

## 1. Where this sits

[`2026-08-07-catalog-completion-design.md`](2026-08-07-catalog-completion-design.md) §1.1 froze the
catalog at 114 and ruled that a second reference board "becomes a **v2 project with its own
spec**". [`CONTINUE.md`](../../CONTINUE.md) §3.1 restates it: "the second reference board became its
own v2 project."

**This is that project.** The frozen arithmetic in `catalog.md` §Totals — 12 primitives, 89 L3, 13
blocks, 114 items — is not renumbered, not reopened, and not competed with. Family P is appended
after O and counted separately, so every number in that table stays literally true.

State at the time of writing, read from `apps/docs/lib/catalog.manifest.ts`, not from
documentation:

| | |
| --- | --- |
| Shipped | 102 |
| Planned | 12 — all family O blocks |
| Cut | 11 — family G's 10 (D9) plus O5 `flow-shell` |
| `registry.json` items | 98 |

## 2. Provenance

`shells/shadcn-shell` in DS-WebApp-Shells answers one structural question: how does a user choose
*how they browse* and *how records open*, independently and persistently, without either choice
constraining the other? It ships two separately persisted axes — collection
(`list`·`kanban`·`table`·`calendar`·`timeline`, keyed per section) and record
(`popup`·`overlay`·`fullscreen`, keyed per entity) — behind one config.

Five merged PRs, tests and Storybook stories throughout, deployed at
<https://shadcn-shell.vercel.app>.

Two facts make it portable, both verified rather than assumed:

- **The components are already controlled.** `DataViewsProps` takes `viewMode: ViewMode`;
  `DetailViewShellProps` takes `mode`, `open`, `onOpenChange`. Neither touches `localStorage` or a
  router. This is not luck — `use-persisted-preference.ts` documents a *single-owner rule* (a
  `storage` event does not fire in the tab that wrote it, so two hooks sharing a key drift), which
  forced a props-down architecture for correctness reasons.
- **The view components are framework-free.** `src/components/ui/` contains zero `react-router`
  imports. The coupling lives in `use-detail-navigation.ts` and `AppLayout.tsx`, neither of which
  ports.

## 3. The decisions this spec rests on

### 3.1 · A new family P, not new numbers in an existing family

`FamilyId` in `manifest-types.ts` is a closed union of `A`–`O`, so a v2 item needs a home in it
whichever scheme is chosen. Family **P · Records & views** is appended.

Rejected: extending family J. It is the right home by subject matter — `record-list` and
`asset-library` live there — but D12 flagged J as unclosed pending re-sampling, and mixing
board-1 and board-2 evidence inside one family destroys the ability to say which board justified
which item.

Rejected: a parallel `V1`/`V2` scheme tracked outside `catalog.md`. It invents a second numbering
convention, and the `FamilyId` union has to widen regardless, so it buys nothing.

### 3.2 · Two catalog items, not seven — D3 forces it

D3: "L3 components never depend on each other. If two need the same piece, it moves up."

`kanban-view`, `kanban-column`, `table-view`, `feed-view`, `calendar-view` and `timeline-view` are
imported by `data-views.tsx` **and by nothing else**. Shipping them as numbered siblings would make
one L3 import six L3s.

They are not shared pieces awaiting promotion to L2 — they are one component's internals. Promoting
them to family A was considered and rejected: A1–A12 are `kbd`, `cost-chip`, `entity-row`,
`preview-tile` — genuine atoms. A calendar grid is not one.

So P1 is a single catalog item whose file set contains them.

### 3.3 · `gen-registry.mts` gains multi-file items

`gen-registry.mts` line 249 hardcodes `files: [file(i.name)]`. Every one of the 98 registry items has
exactly one file because **the generator cannot emit anything else**. §3.2's design is not merely
unprecedented here; as things stand it is unbuildable.

**Decision: extend the generator.** An optional `files` field on the manifest item, consumed as
`files: i.files ?? [file(i.name)]`. Strictly additive — every existing item omits the field and
takes the current path unchanged.

Rejected: merging the six view files into one `data-views.tsx`. That is ~979 lines, 1.7× the
largest shipped item (`waveform-editor`, 591), and permanently harder to read, test and review. The
justification in §3.2 is precisely that these are one component's internals; internals do not have
to live in one file to be internal.

This is the one change in this spec that touches shared build infrastructure, and §8 verifies it
against all 102 existing items, not just the new ones.

### 3.4 · D1 is not satisfied by the current boards, and the wave 1 evidence is provisional

D1: "A component earns registry status only if it appears in three or more unrelated products on
the reference board."

`reference-board-analysis.md`, `agent-board-analysis.md` and `gaps.md` contain **no occurrence** of
`kanban`, `board view`, `calendar`, `gantt` or `view switch`. The observed products are AI tools —
Midjourney, Descript, Manus, Claude, Zapier, Make, Spline, NotebookLM, ElevenLabs. Multi-view
switching is a project-management pattern, and no PM tool is on either board.

By D1 as written, `data-views` is today "a demo, not a registry item". The resolution is the one
the system already uses — D16 added six items from a second board — and which §1.1 of the catalog
completion spec explicitly sanctioned for exactly this case.

**Method caveat, recorded because it changes how much D18 is worth.** The existing board analyses
derive from a collected Figma board of real product screens. Wave 1 here is **desk research from
public product documentation**, not a collected board. Every claim carries a source URL, and D18
lands marked **provisional** — it justifies building on a branch, and it does not justify
promoting family P to the same standing as A–O until the screens are verified. Wave 1's document
says this in its own first paragraph, not only here.

### 3.5 · Persistence ships as a lib contract, opt-in

`feature-announcement.tsx` states the house rule: "deliberately stateless about persistence: it
never writes to localStorage, cookies, or a backend. It emits, the host stores." Only 2 of 102
shipped components touch storage.

The hooks are the non-obvious part of the shell — per-section and per-entity keying, a validator
that reconciles a stored value against what a section actually offers, an SSR guard on every
`window` touch. Discarding them would discard the contract; embedding them would break the rule.

They ship through [`lib.manifest.ts`](../../../apps/docs/lib/lib.manifest.ts), joining `cost` as the
registry's second cross-cutting contract. That file's own comment settles why they get no catalog
number: "a contract is not a catalog item: it has no family, no states, no demo and no docs page,
and counting it as one would corrupt the per-family reconciliation against catalog.md."

### 3.6 · Tone is carried by shape, not by tint

Resolved in §6. Recorded here because it is a visible behaviour change, not a refactor.

## 4. Wave 1 — the records board slice

**Deliverable:** `docs/design-system/records-board-analysis.md`, structured like
`agent-board-analysis.md`, opening with the §3.4 method caveat.

**Sample:** Linear, Notion, Asana, Height, Airtable, Monday, ClickUp. Seven unrelated products, all
records-shaped, none represented on the existing boards.

**Questions it must answer, each with named products and source URLs:**

1. Does a user-selectable multi-view switch over one collection appear in 3+?
2. Is the view preference *persisted*, and at what scope — per section, per user, per workspace?
3. Does the record-open mode vary independently of the collection view, or do products couple them?
4. Do calendar and timeline appear as peers of list/board, or as separate destinations?

Question 3 is the one that matters most: the two-axis independence is the shell's central claim,
and it is the claim least likely to survive contact with the board. If products couple the axes,
the honest port is one axis, not two, and the spec is revised before wave 2 rather than after.

**Output:** D18 in `decisions.md`, following D16's form — what the slice found, what clears D1,
what does not, what is held, and its provisional status.

**Gate:** wave 2 does not begin until D18 is written. If question 1 fails to clear 3+, wave 2 does
not begin at all and the work folds into O10's internals; that outcome costs one document and no
code.

## 5. Wave 2 — two catalog items and one contract

| # | Item | Layer | Type |
|---|---|---|---|
| P1 | `data-views` | component | `registry:component` |
| P2 | `detail-view-shell` | component | `registry:component` |
| — | `use-view-mode` | — | `registry:lib`, via `lib.manifest.ts` |

**P1 `data-views`** — the collection axis. One config (`ViewGroup<T>`, `ColumnDef<T>`,
`TimeCapability<T>`) drives every view; the switcher picks a shell by `viewMode`. Its file set is
`data-views.tsx` plus `kanban-view`, `kanban-column`, `table-view`, `feed-view`, `calendar-view`,
`timeline-view` and the `data-views.ts` types. `view-switcher.tsx` folds in as the control unless
wave 1 shows it standing alone.

The both-or-neither time pair is preserved as-is: a `getDateRange` without a `renderChip` is a
compile error, because a calendar falling back to `renderCard` overflows a day cell.

**P2 `detail-view-shell`** — the record axis. Branches on `mode` into Dialog, Sheet or a plain
container. File set adds `detail-tabs`, `detail-fields` and `use-container-width.ts`.

Collapse is driven by *measured container width* at a 720px threshold, not by viewport or by mode —
so the same body works inside a 480px sheet and a full-width route without branching. The
pessimistic default before first measurement is retained; it is what prevents a flash of two
columns.

**`use-view-mode`** — `use-persisted-preference`, `use-view-mode`, `use-detail-mode` and their
`*-defaults.ts`. Optional; a host with server-side preferences installs P1 and P2 and never sees
`localStorage`.

**Not ported:**

| | Why |
|---|---|
| `use-detail-navigation.ts` | `react-router`-bound. Fullscreen's URL is the host's job; P2 already ignores `open` in fullscreen. |
| `AppLayout.tsx`, `src/pages/`, `src/lib/mock-data/` | App-level. Stay in the shell. |

**House conventions applied on the way in:** `data-slot` attributes, `components/super-ai/`
targets, one test file per item, a manifest row each, a docs page each, per-state stories. No item
ships `contractExempt` — the catalog-completion spec drove that count to zero and this spec does
not reopen it.

## 6. Token reconciliation

The `:root` blocks of the two repos are identical except that this repo adds `--warning` and
`--warning-foreground`. There is no palette migration. There are six contract violations.

`GROUP_TONE_CLASS` fails on all four tones:

```
neutral: "bg-muted text-muted-foreground"        muted-on-muted, 4.34:1
info:    "bg-blue-500/12 text-blue-700 …"        palette class
warning: "bg-amber-500/15 text-amber-700 …"      palette class
success: "bg-emerald-500/12 text-emerald-700 …"  palette class
```

`neutral` is the exact pairing `check-tokens.mjs` was written to catch — its comment records that
this pairing "has now failed the browser a11y gate across five separate rounds, in a new file each
time." `task-card.tsx` adds two more (`bg-red-500/15`, `bg-amber-500/15`).

This repo has exactly two chromatic tokens, `--destructive` and `--warning` (both mapped through
`@theme inline`, so `text-warning` is valid). There is no `--success` and no `--info`, so four
tinted tones cannot be ported by renaming — there is nothing to rename them to.

J5 `record-list` — the component O10 composes — already answered this, and stated why:

> Icon shape carries the state as well as the colour, and the words carry it a third time. The
> colour is on the icon only: `text-destructive` measures 4.0:1, which is fine for a graphic and
> not fine for a label.

That idiom is adopted wholesale. Group headers become an untinted surface plus a leading mark:

| Tone | Today | Ported |
|---|---|---|
| `neutral` | `bg-muted` + muted text | plain header, `CircleDashed` |
| `info` | blue tint | plain header, `Circle`, `text-primary` |
| `warning` | amber tint | plain header, `AlertTriangle`, `text-warning` |
| `success` | emerald tint | plain header, `CheckCircle2`, `text-primary` |

`task-card` P0 becomes a `text-destructive` mark and P1 a `text-warning` mark, under the same rule.
The four call sites — kanban column headers, feed section headers, timeline lanes, calendar bars —
keep using one shared map, so they cannot drift apart.

**Accepted cost, stated rather than discovered:** `info` and `success` both resolve to
`text-primary` and are separated by shape alone. A kanban board that today reads as coloured bands
will read as neutral bands with marks. Approved 2026-08-11 in preference to adding `--info` and
`--success`, which would break the system's monochrome-plus-`--destructive` stance for a
presentational gain. The change reaches the deployed shell once §7 lands.

## 7. The consumer flip

Sequenced last, after the registry is published.

`shadcn-shell` deletes its authored copies of the ported files and installs them with
`npx shadcn add`. It keeps `src/pages/`, `AppLayout.tsx`, `use-detail-navigation.ts`,
`src/lib/mock-data/` and its routing.

This is not tidying. `consumer-test.sh` proves the registry installs into a *scratch* app;
`shadcn-shell` is a real one, with routing, fullscreen URLs and multi-section state that the
scratch test cannot reproduce. Making it a consumer turns it into a standing integration test and
removes the second copy that would otherwise drift.

Its README needs a correction: "self-contained, runnable reference implementations — not published
packages" stops being true for the ported files, and the shells table gains a note that the view
layer is installed rather than authored.

**Deferred out of this spec's execution.** The flip needs the registry served from a published URL,
and deploying is a manual step on an account this work cannot reach. It lands in its own PR against
DS-WebApp-Shells once P1/P2 are live.

## 8. Verification

No new gates. Every item clears the existing pipeline:

```bash
pnpm check:tokens                    # §6 is what this is for — must pass with no new exemption
pnpm check:contract                  # manifest ↔ source reconciliation, incl. lib items
pnpm test                            # ported vitest files land with their source
pnpm test:stories                    # browser a11y gate; the real backstop for §6
pnpm build:registry
apps/docs/scripts/consumer-test.sh
```

Baselines are measured on the branch **before** the first commit rather than quoted from an older
spec, then held or beaten.

**§3.3 needs its own verification, because it touches shared infrastructure.** The generator change
is proven by diffing `public/r/*.json` before and after: all 102 existing items must be
byte-identical, and only the new items may carry a `files` array longer than one. `check-contract`
and `consumer-test.sh` both run against the changed generator, not just against the new items.

The shell already ships tests for `use-container-width`, `use-view-mode`, `use-persisted-preference`
(including an SSR case), `detail-view-shell`, `calendar-view`, `timeline-view` and `data-views`.
Those port with the source.

## 9. Risks

**The wave 1 slice fails D1.** Most likely on question 3 — products may couple the two axes rather
than keeping them independent. Mitigation: wave 1 is a gate, and folding into O10's internals is a
real outcome, not a failure.

**The wave 1 evidence is desk research.** D18 is provisional by construction (§3.4). Family P should
not be treated as equal in standing to A–O until the screens are verified against a collected
board. The risk is that a later verification pass demotes or removes an item that has already
shipped.

**The generator change breaks an existing item silently.** Mitigation is the before/after diff of
all 102 emitted JSON files in §8 — a behavioural check, not an inspection.

**P1's file set is large.** Seven files behind one item is unprecedented here. It is justified by D3
and by the fact that no other consumer imports them, but if wave 1 shows `kanban-view` or
`calendar-view` standing alone in 3+ products, they should be promoted to their own items and this
decision revisited in D18.

**The tone change is visible.** §6's cost lands in every grouped view at once. It is approved, but
it belongs in the wave 2 PR description as a behaviour change, not buried as a lint fix.

## 10. Out of scope

- **The consumer flip's execution** — specced in §7, deferred to its own PR (needs a published
  registry).
- **O10 `records-shell`** — composes these items; its own spec, after they ship.
- **The remaining twelve family O blocks** — unaffected; this spec adds nothing to their
  dependency sets.
- **Figma board sync** — `figma-board-map.md` is not updated by this spec.
- **The shell's routing model** — `use-detail-navigation.ts` and fullscreen URL ownership stay in
  the consumer.
- **`--info` / `--success` tokens** — explicitly rejected in §6.
