# Wave 3: Registry Sweeps Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the duplication, right-to-left, reduced-motion and keyboard gaps across the shipped registry, and finish the six items the case-story program left open.

**Architecture:** Eight tasks over `apps/docs/registry/super-ai/**` and the vendored `apps/docs/components/ui/**`. Tasks 1–3 change what ships to consumers and touch the manifest, so the integrator prepares those rows centrally and dispatches after committing. Tasks 4–7 are per-file sweeps and are the natural fan-out. Task 8 is the handoff's backlog, where two items need a decision before a diff.

**Tech Stack:** React 19, Base UI, Tailwind 4, shadcn registry, vitest 4, Storybook 9.1.

**Spec:** [`docs/superpowers/specs/2026-09-06-post-case-story-remediation-design.md`](../specs/2026-09-06-post-case-story-remediation-design.md)

## Global Constraints

- **This wave must not start until wave 2's prettier task has landed.** That task rewrites 531 files; anything concurrent conflicts with all of it.
- Run every gate **from the repo root**. Root `pnpm lint` and `pnpm typecheck` fan out across docs, storybook and ds-rules.
- **`apps/docs/lib/catalog.manifest.ts` is the one shared file.** A subagent never writes it. The integrator prepares every row this wave needs before dispatching.
- **The registry is the product.** `pnpm build:registry` after any change under `registry/super-ai/**`, and treat a red `consumer-test.sh` as a shipping bug rather than a flake.
- **Blocks compose, they do not implement.** If a composed component does not fit, use a labelled sibling or a documented override and report the gap. Never fork or reimplement it.
- Never pair a bare `text-muted-foreground` with a bare `bg-muted` / `bg-accent` / `bg-secondary` in one quoted class string: 4.34:1 against a 4.5:1 minimum. When a component paints a surface, **rebind the variable** (`[--muted-foreground:var(--accent-foreground)]`) rather than restyling slots.
- **D21 applies to every story this wave touches.** A story may pin a number its own classes dictate; it may not pin one the browser derives from text metrics or scrollbars. Verify with `./scripts/linux-gate.sh`, not the host suite.
- **A guard must be watched failing before it is kept**, and `motion-reduce:transition-none` sets `transition-property`, not `transition-duration` — three wave-8 assertions passed green against a fix they could not see because they read the duration.
- Write `GH-1234`, never `#1234`, in registry sources.
- Branch per task. Never commit to `main`. **Commit before dispatching agents.**

---

### Task 1: Promote the duplicated helpers that carry logic

Eighteen names are defined in more than one file. They are not one problem. Sort them before touching any:

| helper                                    | copies              | identical?                                              | verdict                |
| ----------------------------------------- | ------------------- | ------------------------------------------------------- | ---------------------- |
| `usePrefersReducedMotion`                 | 3 named + 1 inlined | byte-identical, comment and all                         | **promote**            |
| `initials`                                | 3                   | 2 byte-identical, 1 differs by `.trim()` and a fallback | **promote**            |
| `EMBEDDABLE_SHELL`, `SIDEBAR_FILLS_SHELL` | 5 each              | values byte-identical, JSDoc differs                    | **leave** — see step 1 |
| `formatTimecode`                          | 3                   | three genuinely different signatures                    | **leave**              |
| `clamp`                                   | 3                   | two general, one closes over `duration`                 | **leave**              |
| `matchesQuery`                            | 3                   | three different signatures                              | Task 3                 |

**Files:**

- Create: `apps/docs/registry/super-ai/use-prefers-reduced-motion.tsx`
- Create: `apps/docs/registry/super-ai/use-prefers-reduced-motion.test.tsx`
- Modify: `apps/docs/registry/marketing/{terminal,typing-animation,hero-video-dialog,text-animate}.tsx`
- Modify: `apps/docs/registry/super-ai/{account-menu,workspace-switcher,record-list}.tsx`
- Modify: `apps/docs/lib/catalog.manifest.ts` (integrator only)

**Interfaces:**

- Produces: `usePrefersReducedMotion(): boolean` — hydration-safe, `false` on the server and on first client render, switching in the first post-hydration commit.
- Produces: `initials(name: string): string` — at most two uppercase letters, whitespace-trimmed, empty string for empty input.

- [ ] **Step 1: Decide the two className constants, and default to leaving them**

`EMBEDDABLE_SHELL` is `"[contain:layout]"` and `SIDEBAR_FILLS_SHELL` is `"[&_[data-slot=app-sidebar]]:h-full"`, byte-identical in `chat-shell`, `artifact-shell`, `home-shell`, `docs-shell` and `records-shell`.

D3 says promote shared pieces to L2 rather than importing sideways, and five copies is exactly its target. But these are two string literals with no behaviour, and promoting them makes five shells carry a cross-item registry dependency so a consumer installing one shell pulls a second file to obtain thirty characters of Tailwind. **The coupling costs more than the duplication.** Leave them, and record why in each shell's existing JSDoc so the next reader does not re-open it.

If the integrator disagrees, that is a decision for a D-record, not for an agent mid-sweep.

- [ ] **Step 2: Write the failing test for the hook**

Create `apps/docs/registry/super-ai/use-prefers-reduced-motion.test.tsx`:

```tsx
import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { usePrefersReducedMotion } from "./use-prefers-reduced-motion";

function stubMatchMedia(matches: boolean) {
  const listeners = new Set<() => void>();
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: query === "(prefers-reduced-motion: reduce)" ? matches : false,
    media: query,
    addEventListener: (_: string, fn: () => void) => listeners.add(fn),
    removeEventListener: (_: string, fn: () => void) => listeners.delete(fn),
  })) as unknown as typeof window.matchMedia;
  return listeners;
}

describe("usePrefersReducedMotion", () => {
  it("reports false when the user has expressed no preference", () => {
    stubMatchMedia(false);
    expect(renderHook(() => usePrefersReducedMotion()).result.current).toBe(false);
  });

  it("reports true under reduce", () => {
    stubMatchMedia(true);
    expect(renderHook(() => usePrefersReducedMotion()).result.current).toBe(true);
  });

  it("queries the explicit ': reduce' value, not the bare feature", () => {
    stubMatchMedia(true);
    renderHook(() => usePrefersReducedMotion());
    expect(window.matchMedia).toHaveBeenCalledWith("(prefers-reduced-motion: reduce)");
  });
});
```

- [ ] **Step 3: Run it and watch it fail**

```bash
cd apps/docs && pnpm exec vitest run registry/super-ai/use-prefers-reduced-motion.test.tsx
```

Expected: FAIL, module not found.

- [ ] **Step 4: Create the hook from the existing copy verbatim**

Create `apps/docs/registry/super-ai/use-prefers-reduced-motion.tsx` with the body currently in `terminal.tsx:8-23`, unchanged. Keep its comment: it explains why motion's own `useReducedMotion` is not used, and that reasoning is still load-bearing.

```tsx
"use client";

import * as React from "react";

/**
 * Hydration-safe prefers-reduced-motion read: server and first client render
 * agree (false), reduced clients switch in the first post-hydration commit and
 * react to live preference changes. motion's useReducedMotion is deliberately
 * not used — it queries "(prefers-reduced-motion)" without a value, which this
 * repo's exact-string matchMedia handling doesn't recognize.
 */
export function usePrefersReducedMotion() {
  return React.useSyncExternalStore(
    (onStoreChange) => {
      const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
      mql.addEventListener("change", onStoreChange);
      return () => mql.removeEventListener("change", onStoreChange);
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
}
```

- [ ] **Step 5: Run the test to verify it passes**

```bash
cd apps/docs && pnpm exec vitest run registry/super-ai/use-prefers-reduced-motion.test.tsx
```

Expected: 3 passed.

- [ ] **Step 6: Replace the four copies**

In `terminal.tsx`, `typing-animation.tsx` and `hero-video-dialog.tsx`, delete the local function and import the shared one. In `text-animate.tsx:48-63`, delete the inlined `useSyncExternalStore` block and call the hook, keeping the local variable name `reducedMotion` so the rest of the component is untouched.

Leave `number-ticker.tsx:34-36` and `ripple-button.tsx:26` alone: they are differently shaped reads, not copies of this hook, and changing them is a behaviour change rather than a dedupe.

- [ ] **Step 7: Promote `initials` the same way**

Create `apps/docs/registry/super-ai/initials.tsx` from the `account-menu.tsx:101-109` version, which is the strictest of the three: it trims, takes at most two words, and uppercases. Write a test covering an empty string, one word, three words, and leading whitespace before implementing. Then replace all three call sites. `record-list.tsx:135-143` loses its `?? ""` fallback, which the shared version covers with the same behaviour.

- [ ] **Step 8: Integrator adds the manifest rows and reconciles**

Add both as `registry:lib` items in `apps/docs/lib/lib.manifest.ts`, following `cost.tsx`. They have no family, no states, no demo and no stories, which is exactly why the narrower `LibManifestItem` type exists. Then add them to each consuming item's `consumes` and run:

```bash
cd apps/docs && pnpm reconcile:deps
```

Expected: no drift.

- [ ] **Step 9: Verify and commit**

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build:registry
apps/docs/scripts/consumer-test.sh
```

```bash
git add apps/docs/registry apps/docs/lib
git commit -m "refactor(registry): promote usePrefersReducedMotion and initials to lib items

Four byte-identical copies of the hook and three of initials, which is what D3
means by promoting shared pieces rather than importing sideways. The two shell
className constants are deliberately left duplicated: they are string literals,
and a cross-item registry dependency costs a consumer more than thirty
characters of Tailwind does."
```

---

### Task 2: Give every animated component a reduced-motion branch

27 files carry `animate-*` or `transition-*` with no guard, against 53 that have one. Two are keyframe animations and are the priority: a spinner that ignores the preference is the case the criterion exists for.

**Files:**

- Modify: `apps/docs/registry/super-ai/generation-queue.tsx:117`
- Modify: `apps/docs/registry/marketing/typing-animation.tsx:76`
- Modify: the 25 `transition-*` files listed in step 3
- Modify: the corresponding `apps/storybook/src/stories/super-ai/*.stories.tsx` `ReducedMotion` stories

**Interfaces:**

- Consumes: nothing.
- Produces: nothing. Class-level changes only.

- [ ] **Step 1: Fix the two keyframe animations first**

`apps/docs/registry/super-ai/generation-queue.tsx:117`:

```tsx
<Loader2 aria-hidden className="size-4 animate-spin" />
```

becomes:

```tsx
<Loader2 aria-hidden className="size-4 animate-spin motion-reduce:animate-none" />
```

`apps/docs/registry/marketing/typing-animation.tsx:76` takes the same treatment on `animate-pulse`. `record-list.tsx:131` is the model already in the tree.

- [ ] **Step 2: Write the guard and watch it fail**

For each fixed component, the `ReducedMotion` story must assert the property the fix actually moves:

```ts
// motion-reduce:animate-none sets animation-name, NOT animation-duration.
// Three wave-8 assertions passed green against a fix they could not see
// because they read the duration.
const spinner = canvasElement.querySelector('[data-slot="generation-queue-spinner"]')!;
await expect(getComputedStyle(spinner).animationName).toBe("none");
```

Then revert the class, run `./scripts/linux-gate.sh src/stories/super-ai/GenerationQueue.stories.tsx`, confirm red, restore, confirm green. The browser project already runs with `reducedMotion: "reduce"`, so the story needs no media emulation of its own.

- [ ] **Step 3: Sweep the 25 transition-only files**

Zero `motion-reduce` anywhere in the file: `marketing/bento-grid.tsx:55,75` · `marketing/hero-video-dialog.tsx:121,124` · `marketing/rainbow-button.tsx:9` · `super-ai/context-chips.tsx:81,104` · `data-views.tsx:254` · `detail-tabs.tsx:76` · `entity-row.tsx:49` · `explore-gallery.tsx:209,489` · `feed-view.tsx:55` · `filter-bar.tsx:26,70,87` · `frame-strip.tsx:254` · `gen-settings-bar.tsx:50` · `hero-omnibox.tsx:128` · `media-prompt-bar.tsx:158` · `recent-grid.tsx:61` · `reset-affordance.tsx:54` · `result-card.tsx:203` · `table-view.tsx:68` · `timeline-view.tsx:173`.

Guarded elsewhere in the file but not on this line: `asset-library.tsx:222` · `feedback.tsx:221` · `generation-panel.tsx:193` · `settings-dialog.tsx:293` · `sidebar-nav.tsx:67` · `whats-new.tsx:209`.

Each gets `motion-reduce:transition-none` appended to the same quoted class string. A `transition-colors` is a weaker case than a keyframe animation, but the rule is uniform and a mixed convention is what produced the six half-guarded files above.

- [ ] **Step 4: Verify the token gate still passes**

```bash
pnpm check:tokens
```

Expected: the same 5 known vendored warnings, no new ones. Appending a variant to a class string can trip the contrast rule if it lands next to a `text-muted-foreground`; if it does, rebind the variable rather than restyling.

- [ ] **Step 5: Commit**

```bash
git add apps/docs/registry apps/storybook/src/stories
git commit -m "fix(a11y): reduced-motion branches for the 27 components that had none

Two were keyframe animations, including a spinner — the case the criterion
exists for. Each guard was watched failing on a reverted class, asserting
animation-name and transition-property rather than the durations those variants
do not touch."
```

---

### Task 3: Resolve the divergent `matchesQuery`

`settings-dialog.tsx:224` owns the predicate and does not export it; `settings-shell.tsx:189` re-implements it with a different signature, and the two now visibly disagree. O12 measured a query where the shell's badge reads 1, its status line reads "1 setting matches across 4 sections", the gated row renders, and the composed panel one region up reads "No settings in MCP match this search".

**The shell's own constant says to delete its overrides when M1 grows an opt-out, and that is still the right instruction — so the fix is an API on `settings-dialog`, not a patch on the shell.**

**Files:**

- Modify: `apps/docs/registry/super-ai/settings-dialog.tsx`
- Modify: `apps/docs/registry/super-ai/settings-shell.tsx`
- Modify: `apps/docs/registry/super-ai/settings-dialog.test.tsx`
- Modify: `apps/storybook/src/stories/super-ai/SettingsShell.stories.tsx`

**Interfaces:**

- Produces: `matchesQuery(row: SettingsRowData, query: string): boolean`, exported from `settings-dialog`.
- Produces: a `nav` prop on the dialog, defaulting to `true`, so a composing shell can render the rows without a second navigation.

- [ ] **Step 1: Write the failing test for the divergence**

In `settings-dialog.test.tsx`, assert that one query produces one answer across both surfaces: render the shell with a query matching only a gated description, and assert the composed panel and the shell's own count agree.

- [ ] **Step 2: Export the predicate and add the opt-out**

Export `matchesQuery` and `SettingsRowData` from `settings-dialog.tsx`. Add `nav?: boolean` defaulting to `true`; when `false`, the dialog renders its rows without the section navigation.

- [ ] **Step 3: Delete the shell's copy**

Remove `settings-shell.tsx:188-192` and its call sites at `:299`, `:300` and `:329`, replacing them with the imported predicate. The shell's rows have to be shaped into `SettingsRowData` to use it, which is the point: one shape, one predicate.

- [ ] **Step 4: Verify the story that measured the divergence now passes**

```bash
./scripts/linux-gate.sh src/stories/super-ai/SettingsShell.stories.tsx
```

Update `KeyboardOrder`, which recorded the cost of the divergence as zero tabs and an orphan `tabpanel`. If the orphan is gone, the assertion has to change; if it is not, say so rather than deleting it.

- [ ] **Step 5: Integrator reconciles and commits**

```bash
cd apps/docs && pnpm reconcile:deps && cd ../.. && pnpm build:registry
git add apps/docs/registry apps/storybook/src/stories apps/docs/lib
git commit -m "fix(settings): one predicate, exported, instead of two that disagree

settings-shell re-implemented settings-dialog's private matchesQuery with a
different signature and the two diverged in a measurable way. Exports the
predicate and adds nav={false} so the shell can compose the dialog's rows
rather than restating its logic."
```

---

### Task 4: Logical direction utilities

41 files carry a physical-direction token. Nine are horizontally-scrolled pixel canvases where physical direction is load-bearing and must not be swapped. The other 32 are mechanical.

**Do not swap:** `timeline-view`, `calendar-view`, `time-ruler`, `track-lane`, `compare-viewer`, `frame-strip`, `timeline-shell`, `track-list`, and `coach-mark.tsx:254`, whose `data-[side=…]` values are Base UI's own physical sides.

- [ ] **Step 1: Swap the 32 mechanical files**

`ml-*` → `ms-*`, `mr-*` → `me-*`, `pl-*` → `ps-*`, `pr-*` → `pe-*`, `border-l` → `border-s`, `border-r` → `border-e`, `text-left` → `text-start`, `text-right` → `text-end`, `rounded-l*` → `rounded-s*`, `rounded-r*` → `rounded-e*`. `left-*` and `right-*` on absolutely-positioned elements become `start-*` and `end-*`.

`notebook-shell.tsx:103-107` is coupled: it retargets `feature-card-row`'s own arrows through arbitrary descendant selectors, so both files change together or neither does.

- [ ] **Step 2: Verify against the RTL stories**

```bash
./scripts/linux-gate.sh
```

Every touched component's `RTL` story must still pass. A swap that changes LTR rendering is a mistake, not a fix.

- [ ] **Step 3: Commit**

```bash
git add apps/docs/registry
git commit -m "refactor(rtl): logical direction utilities in the 32 files that can take them

Nine files are left physical on purpose: horizontally-scrolled pixel canvases
and Base UI's own data-[side] values, where physical direction is the meaning."
```

---

### Task 5: Stable keys where the data is the consumer's

Five sites key consumer-supplied arrays by index. Two have a stable key available today; three do not, and inventing one is an API change.

- [ ] **Step 1: Fix the two that can be fixed**

`asset-detail.tsx:139,153,160` maps `segments`, produced by `segmentPrompt` at `:74-90`, which already tracks a character offset in `cursor` but does not emit it. Emit it as `start` and key on it.

`record-list.tsx:293` keys `fragments`, which is derived rather than passed, and `i` is also read at `:303` to place the separator. Key on the fragment's text instead, keeping the index for the separator.

- [ ] **Step 2: Report the three that need a type change**

`sidebar-nav.tsx:174` keys `sections`, whose type has no id and whose `label` is a `React.ReactNode`. `pricing-table.tsx:186` keys `React.ReactNode[]`. `escalation-handoff.tsx:114` keys `React.ReactNode[]`.

Adding an id to these types is a public API change across shipped components. **Report them as a documented gap rather than inventing a prop**, and use a composite key where a parent key exists, as `pricing-table` can with `group.title`.

- [ ] **Step 3: Commit**

```bash
git add apps/docs/registry
git commit -m "fix(keys): stable keys where the data carries one

asset-detail's segmenter already tracked the offset and did not emit it.
Three further sites key React.ReactNode arrays with no id on the type; adding
one is a public API change and is reported rather than taken."
```

---

### Task 6: Roving tabIndex

`choice-chips`, `preset-grid` and `gen-settings-bar` ship Tab-per-item with a TODO for the APG pattern. All three declare a container role that promises arrow-key navigation and none delivers it, so a keyboard user tabs through every chip in a group where the pattern says one tab stop and arrows within.

Each is a real keyboard gap that axe cannot see, which is why three case-story waves passed over them.

- [ ] **Step 1: Write the failing keyboard story first**

For `choice-chips`, whose container is `role="radiogroup"` at `:35-44` and whose chips are plain `<button role="radio">` at `:56-77` with no `tabIndex` handling:

```ts
// APG radiogroup: one tab stop for the group, arrows move within it.
await userEvent.tab();
await expect(document.activeElement).toBe(chips[0]);
await userEvent.keyboard("{ArrowRight}");
await expect(document.activeElement).toBe(chips[1]);
await userEvent.tab();
await expect(chips.some((c) => c === document.activeElement)).toBe(false);
```

Run it and watch it fail: today the second Tab lands on the next chip.

- [ ] **Step 2: Implement the pattern**

The selected chip carries `tabIndex={0}` and every other `tabIndex={-1}`; when none is selected the first carries it. Arrow keys move selection and focus together in a radiogroup. `preset-grid` in `multiple` mode is a checkbox group, where arrows move focus without changing selection, and it has a second focusable child, `PresetGridSeeMore` at `:128`, which stays a normal tab stop outside the group.

`gen-settings-bar` is `role="toolbar"`: arrows move focus only, and it has no selection model.

- [ ] **Step 3: Delete the TODOs and update the docs modules**

Each component's docs module has a keyboard note describing the Tab-per-item behaviour as a known gap. Those notes are now wrong; rewrite them. The citation gate checks prose against the code, so a stale note here is a gate failure rather than a silent rot.

- [ ] **Step 4: Verify and commit**

```bash
./scripts/linux-gate.sh
pnpm check:contract
```

```bash
git add apps/docs/registry apps/docs/content apps/storybook/src/stories
git commit -m "feat(a11y): roving tabIndex for the three components that promised it

All three declared a container role implying arrow-key navigation and shipped
Tab-per-item with a TODO. axe cannot see this, which is why three case-story
waves passed over it."
```

---

### Task 7: The handoff's six

Two are contained. Two are vendored and need a decision said out loud before a diff. Two are open questions.

- [ ] **Step 1: `hover-card.tsx` reduced-motion branch**

`apps/docs/components/ui/hover-card.tsx:36` animates with no `motion-reduce`, and there is a second identical copy at `apps/storybook/src/components/ui/hover-card.tsx:66`. Its single consumer, `citation-ref.tsx:64`, **can** reach the class, so by this repo's rule the pair belongs at the call site. Fix both copies, assert `animation-name: none`, and watch it fail on a reverted class.

- [ ] **Step 2: `model-picker`'s unnamed listbox**

Now at `apps/docs/registry/super-ai/model-picker.tsx:238`, not `:236`. It is the only `SelectContent` in the registry without an `aria-label`. Copy the shape from `records-shell.tsx:388` or `hero-omnibox.tsx:204`. **axe's behaviour here is configuration-dependent** and one measurement had it raise nothing on an open unnamed listbox, so the story assertion is what protects the name. Strip the attribute, watch exactly one test fail, restore.

- [ ] **Step 3: The vendored sidebar's RTL mirroring — say it out loud first**

`apps/docs/components/ui/sidebar.tsx:220` places the fixed container with `data-[side=left]:left-0` while the in-flow gap at `:208` follows direction, so under `dir="rtl"` a 256px blank strip sits at the inline-start edge and the sidebar lies over the first 256px of content. Measured four times by four shells at two widths.

This is a layout change to a vendored file shared by five shells, and it will move boxes that landed RTL assertions already pin. **Budget for rewriting those assertions in the same commit**, and state in the PR body that a vendored file diverges from upstream.

- [ ] **Step 4: The tooltip that eats an Escape — a behaviour change**

`apps/docs/components/ui/sidebar.tsx:517` passes `hidden={state !== "collapsed" || isMobile}` to `TooltipContent`, so the popup opens on focus and is merely hidden rather than unmounted: Escape closes a tooltip nobody can see, and a second Escape closes the drawer. Every sidebar consumer with tooltip rows has this. The fix is to stop rendering it rather than to hide it, which is a behavioural change to a vendored file. **Say so before taking it.**

- [ ] **Step 5: The notebook chat pane — report, do not force**

`notebook-shell.tsx:6` composes AI Elements' `Conversation`, and `StickToBottom.Content` renders the scrolling div itself while accepting exactly one prop for it, `scrollClassName` — a class, never `tabIndex` or `aria-label`, verified against `use-stick-to-bottom@1.1.6`'s own types. The standard repair is unavailable. The file already documents this at `:51-54` and puts the tab stop on the outer `Conversation`.

Fixing it properly means patching the vendored port or upstreaming a prop. **Neither is this task's to decide.** Confirm the workaround still holds and leave the gap recorded.

- [ ] **Step 6: Verify and commit**

```bash
./scripts/linux-gate.sh
pnpm build:registry && apps/docs/scripts/consumer-test.sh
```

Commit steps 1 and 2 together, and each vendored change separately with its rationale in the message.

---

### Task 8: Update the backlog

- [ ] **Step 1: Rewrite `CONTINUE.md` §8**

Every item this wave closed comes out; every gap it reported goes in, with its measurement. §8 is the live backlog and is what `CLAUDE.md` points at as current work.

- [ ] **Step 2: Verify no closed item is still described as open**

```bash
grep -n "hover-card\|model-picker\|matchesQuery\|roving tabIndex" docs/CONTINUE.md
```

- [ ] **Step 3: Commit**

```bash
git add docs/CONTINUE.md
git commit -m "docs: update the composition-gap backlog after wave 3"
```

---

## Wave exit gate

From the repo root, in `ci.yml`'s order:

```bash
pnpm install --frozen-lockfile && pnpm lint && pnpm format:check && pnpm typecheck \
  && pnpm check:tokens && pnpm check:contract && pnpm test \
  && pnpm build:registry && pnpm build \
  && pnpm --filter docs exec playwright test
rm -rf apps/storybook/node_modules/.cache/storybook
pnpm --filter storybook test:stories
apps/docs/scripts/consumer-test.sh
./scripts/linux-gate.sh
```

Run the Storybook suite **once from a cleared cache with the 6007 dev server down**: a warm cache hid a real flake in `whats-new` for two whole waves, passing six warm runs and failing deterministically cold.
