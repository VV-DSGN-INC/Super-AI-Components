# Composition Gaps Batch 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the first five entries of `CONTINUE.md` §8 by fixing the component and then deleting the workaround the reporting block shipped because the fix was missing.

**Architecture:** Seven registry components gain a capability; five shells and five docs pages then lose the compensation they carried for its absence. Nothing under `components/ui/` is edited — both vendored-origin defects (the sidebar's `h-svh`, the tabs contrast pairing) are corrected from our side, by a shell-level descendant variant and by call-site props respectively. Work is partitioned by **file** rather than by gap, so no file is opened by two tasks.

**Tech Stack:** React 19, Next.js, Tailwind v4 (container queries via `@container`), shadcn registry, Vitest + Testing Library (jsdom), Storybook 9 + `storybook/test` (real browser via Playwright), Playwright for docs smoke.

**Spec:** [`docs/superpowers/specs/2026-08-17-composition-gaps-batch-1-design.md`](../specs/2026-08-17-composition-gaps-batch-1-design.md)

## Global Constraints

- **No file under `apps/docs/components/ui/` may appear in any diff.** Vendored-origin defects are fixed from our side. This is spec §6 and success criterion 6.
- **Additive only**, with two narrow exceptions both named in the spec: A8's `aria-labelledby` for `labelPlacement="below"` (§4.1) and the container-query switch (§4.5). No other default may change.
- **Never name a story export `Default`.** House rule; use a meaningful state name.
- **Never assert layout or `:focus-visible` in jsdom.** Vitest runs in jsdom and has no layout; containment, overflow and focus-ring assertions belong in Storybook play functions, which run under Playwright.
- **Gates run from the repo root**, never from `apps/docs`: root `lint` and `typecheck` cover the storybook workspace too.
- **Rebuild before Playwright.** `playwright.config.ts` runs `pnpm start`, and `next start` serves the *prebuilt* output; editing source without rebuilding tests a stale app.
- **Registry sources must not contain a bare `#1234`-style issue reference** — `check:tokens` false-positives it as a hex colour. Write `GH-1234`.
- **`apps/docs/lib/catalog.manifest.ts` is not touched by this plan.** No component is added, removed or renamed.
- Package manager is **pnpm**. Never npm.

### Container queries are a first-adoption decision — confirm before Task 4

`@container` appears **zero times** across the registry, the docs app and the storybook workspace. Tasks 4 and 6 would be the first adopters, which means they set a repo-wide convention as a side effect of fixing two grids.

This is precisely the situation `CONTINUE.md` records for K6 `citation-ref` and logical properties: two agents independently declined to be first, on the grounds that "logical properties appeared in zero registry sources, so the first adopter would set a convention by accident." That decision was later taken deliberately, as a scoped sweep, rather than by whoever happened to touch a file first.

Tailwind v4 ships container queries in core, so nothing needs installing — the question is convention, not capability.

**This plan assumes adoption**, on the grounds that the defect is *by definition* a container-vs-viewport confusion and no viewport-keyed value can fix it. If that assumption holds, Task 4 must also add a short entry to `docs/design-system/decisions.md` recording container queries as an accepted convention, with these two grids as the pilots. If it does not hold, drop Tasks 4 and 6's column work from this batch and leave `ARTIFACTS_IN_STREAM` and `GRID_BESIDE_SIDEBAR` in place; every other task stands unchanged.

**Commands used throughout:**

```bash
pnpm --filter docs test -- <path>      # single vitest file
pnpm --filter storybook test:stories   # axe + interaction gate
pnpm lint && pnpm typecheck            # from repo root
pnpm check:tokens && pnpm check:contract
```

---

## File Structure

**Phase 1 — parallel, 5 agents, registry files only. No agent opens a shell.**

| Task | Files | Responsibility |
| --- | --- | --- |
| 1 | `registry/super-ai/preview-tile.tsx`, its test, its story, its docs page | Frame naming + `selectMode` |
| 2 | `registry/super-ai/feature-card-row.tsx`, its story | Arrows inside the box |
| 3 | `registry/super-ai/frame-strip.tsx`, its story | Arrows inside the box |
| 4 | `registry/super-ai/artifact-grid.tsx`, its story | Container-keyed columns |
| 5 | `registry/super-ai/parameter-panel.tsx`, `run-inspector.tsx` | TabsList contrast at our call sites |

**Phase 2 — one agent, the only consumer of Task 1's new API.**

| Task | Files | Responsibility |
| --- | --- | --- |
| 6 | `registry/super-ai/recent-grid.tsx`, its test, its story | Adopt naming props; container-keyed columns |

**Phase 3 — sequential, integrator, one pass. This is where the evidence is produced.**

| Task | Files | Responsibility |
| --- | --- | --- |
| 7 | 5 shells | `SIDEBAR_FILLS_SHELL` companion class |
| 8 | 5 shells | Delete the three compensation constants |
| 9 | 5 shells + 5 docs pages | Delete the clip warnings |
| 10 | `e2e/smoke.spec.ts` or shell stories | Real-browser proof for B1 and the arrows |
| 11 | `docs/CONTINUE.md`, `docs/design-system/vendored-token-findings.md` | Correct the two misattributions; record the tabs residue |

---

## Task 1: preview-tile — frame naming and `selectMode`

**Files:**
- Modify: `apps/docs/registry/super-ai/preview-tile.tsx:17-26` (props), `:41-54` (frame), `:120-124` (below label)
- Test: `apps/docs/registry/super-ai/preview-tile.test.tsx`
- Story: `apps/storybook/src/stories/super-ai/PreviewTile.stories.tsx`
- Modify: `apps/docs/content/components/preview-tile.docs.tsx`

**Interfaces:**
- Consumes: nothing.
- Produces: `PreviewTileProps` gains `frameLabel?: string` and `selectMode?: "toggle" | "open"`. Task 6 passes both. The `below` label span gains a generated `id` and the frame an `aria-labelledby` pointing at it — Task 6 relies on this to name its grid tiles with **no prop at all**.

Today `interactive = typeof onSelect === "function"` makes the frame a `<button>` and unconditionally sets `aria-pressed={selected}` (`preview-tile.tsx:41-54`). The button's only accessible name is the *overlay* label, which renders inside it. With `labelPlacement="below"` the label is a sibling (`:120-124`) and names nothing; with `"none"` there is no label at all. Both ship nameless buttons, and `recent-grid` ships both.

- [ ] **Step 1: Write the failing tests**

Add to `apps/docs/registry/super-ai/preview-tile.test.tsx`:

```tsx
  it("names the frame from a below-placed label without a prop", () => {
    render(
      <PreviewTile label="Q3 Launch Trailer" labelPlacement="below" onSelect={() => {}}>
        <div />
      </PreviewTile>,
    );
    expect(screen.getByRole("button", { name: "Q3 Launch Trailer" })).toBeInTheDocument();
  });

  it("names the frame from frameLabel when no label element exists", () => {
    render(
      <PreviewTile labelPlacement="none" frameLabel="Q3 Launch Trailer" onSelect={() => {}}>
        <div />
      </PreviewTile>,
    );
    expect(screen.getByRole("button", { name: "Q3 Launch Trailer" })).toBeInTheDocument();
  });

  it("keeps aria-pressed by default and drops it for an open action", () => {
    const { rerender } = render(<PreviewTile label="A" onSelect={() => {}} selected />);
    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "true");
    rerender(<PreviewTile label="A" onSelect={() => {}} selected selectMode="open" />);
    expect(screen.getByRole("button")).not.toHaveAttribute("aria-pressed");
  });

  it("gives two tiles on one page distinct label ids", () => {
    render(
      <>
        <PreviewTile label="One" labelPlacement="below" onSelect={() => {}} />
        <PreviewTile label="Two" labelPlacement="below" onSelect={() => {}} />
      </>,
    );
    const ids = Array.from(document.querySelectorAll('[data-slot="preview-tile-label"]')).map(
      (el) => el.id,
    );
    expect(new Set(ids).size).toBe(2);
    expect(ids.every(Boolean)).toBe(true);
  });
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm --filter docs test -- registry/super-ai/preview-tile.test.tsx`
Expected: FAIL. The first two fail on the accessible name being empty; the third fails because `selectMode` is not a prop; the fourth fails because the label span has no `id`.

- [ ] **Step 3: Add the props**

In `preview-tile.tsx`, extend the interface (after `labelPlacement`, before `badge`):

```tsx
  labelPlacement?: "overlay" | "below" | "none";
  /**
   * Accessible name for the interactive frame, for the one case the component
   * cannot name itself: `labelPlacement="none"` renders no label element to
   * point at. With `"below"` the frame is named from the label automatically
   * and this is unnecessary; with `"overlay"` the label is already inside the
   * button.
   */
  frameLabel?: string;
  /**
   * What pressing the frame means. `"toggle"` reports `aria-pressed` — right
   * for a filter or a selectable cell. `"open"` omits it — right for a tile
   * that navigates, where "pressed" is a claim about state the tile does not
   * hold. Default is `"toggle"`, which is what every caller got before this
   * prop existed.
   */
  selectMode?: "toggle" | "open";
  badge?: React.ReactNode;
```

- [ ] **Step 4: Wire the id and the frame attributes**

Destructure the new props (`frameLabel`, `selectMode = "toggle"`) alongside the others, then replace the body's opening lines:

```tsx
  const interactive = typeof onSelect === "function";
  const Frame = interactive ? "button" : "div";

  // The `below` label is a sibling of the frame, so it cannot name the button
  // by containment the way the overlay label does. Pointing at it beats a
  // `frameLabel` string: the name is the visible label by construction and
  // cannot drift from it.
  const labelId = React.useId();
  const namedByLabel = interactive && Boolean(label) && labelPlacement === "below";
```

and the frame's spread attributes:

```tsx
        {...(interactive
          ? {
              type: "button" as const,
              onClick: onSelect,
              ...(selectMode === "toggle" ? { "aria-pressed": selected } : {}),
              ...(namedByLabel ? { "aria-labelledby": labelId } : {}),
              ...(!namedByLabel && frameLabel ? { "aria-label": frameLabel } : {}),
            }
          : {})}
```

- [ ] **Step 5: Give the below label its id**

Replace the `below` label block at the end of the component:

```tsx
      {label && labelPlacement === "below" ? (
        <span
          id={labelId}
          data-slot="preview-tile-label"
          className="text-foreground truncate text-sm"
        >
          {label}
        </span>
      ) : null}
```

The overlay label is left alone: it is inside the frame and already names it.

- [ ] **Step 6: Run the tests to verify they pass**

Run: `pnpm --filter docs test -- registry/super-ai/preview-tile.test.tsx`
Expected: PASS, all four new tests plus the existing suite.

- [ ] **Step 7: Replace the `EmptyLabel` story's workaround with the fix**

`EmptyLabel` currently documents this defect and refuses to render the broken case, because doing so would put a live `button-name` violation into a gate that runs at `test: "error"`. Now the case is renderable. Replace the story in `PreviewTile.stories.tsx`:

```tsx
/**
 * `labelPlacement="none"` — a picture with no caption, which is how
 * `frame-strip` and `recent-grid`'s list layout both use this component.
 *
 * This story used to describe an unfixable defect: two of the three label
 * placements left an interactive tile as a button with no accessible name,
 * and it could not be fixed from outside, because props spread onto the outer
 * wrapper and never reach the `<button>`.
 *
 * Both halves are now closed, by different mechanisms, and the difference is
 * the point. `below` names itself: the label is a real element, so the frame
 * points at it with `aria-labelledby` and the name is the visible label by
 * construction. `none` renders no label at all, so there is nothing to point
 * at and a name has to be supplied — `frameLabel` is that supply, and the
 * right tile below shows what is still true without it.
 */
export const EmptyLabel: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-3">
      <PreviewTile
        aspect="video"
        labelPlacement="none"
        frameLabel="Frame 12 — harbour at dawn"
        onSelect={() => {}}
      >
        <Fill className="bg-primary" />
      </PreviewTile>
      <PreviewTile aspect="video" labelPlacement="none">
        <Fill className="bg-secondary" />
      </PreviewTile>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const named = canvas.getByRole("button", { name: "Frame 12 — harbour at dawn" });
    await expect(named).toBeInTheDocument();
    await expect(canvasElement.querySelectorAll("button")).toHaveLength(1);
  },
};
```

- [ ] **Step 8: Add a story for the `below` + `onSelect` pair**

This combination has never been staged, which is why the axe gate never failed on it. Add after `EmptyLabel`:

```tsx
/**
 * The pair `recent-grid` ships and nothing staged until now: an interactive
 * tile whose caption sits *below* the frame. Before the `aria-labelledby`
 * fix this was a nameless button in a shipped component, invisible to every
 * gate because no story rendered it — obligation coverage and execution
 * coverage are different measurements.
 *
 * No prop names these buttons. The frame points at the label element that was
 * already there.
 */
export const BelowLabelInteractive: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-3">
      <PreviewTile aspect="video" label="Q3 Launch Trailer" labelPlacement="below" onSelect={() => {}}>
        <Fill className="bg-primary" />
      </PreviewTile>
      <PreviewTile aspect="video" label="Brand Explainer" labelPlacement="below" onSelect={() => {}}>
        <Fill className="bg-secondary" />
      </PreviewTile>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("button", { name: "Q3 Launch Trailer" })).toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: "Brand Explainer" })).toBeInTheDocument();
  },
};
```

- [ ] **Step 9: Update the two stories whose prose now describes fixed behaviour**

In `LongContent`, the closing paragraph says handing the right tile an `onSelect` "would ship an unnamed button". Replace that paragraph with:

```
 * Only the left tile is interactive, and that is now a composition choice
 * rather than a constraint: a `below` label names its own frame, so the right
 * tile could take an `onSelect` safely. See `BelowLabelInteractive`.
```

In `Controlled`, the final paragraph says the `aria-pressed` toggle semantics are "API-shaped and carried in the report rather than patched here". Replace that clause with:

```
 * `onSelect` is still a bare `() => void` with no payload, so the caller has
 * to close over the item's identity itself (`() => request(preset.id)` above).
 * The toggle-semantics half is now fixed: `selectMode="open"` drops
 * `aria-pressed` for a tile that navigates rather than toggles. This story
 * keeps the default, because a picker *is* a toggle set.
```

- [ ] **Step 10: Update the docs page**

In `apps/docs/content/components/preview-tile.docs.tsx`, the `accessibility.screenReader` and `pitfalls` entries describe the nameless-button defect. Rewrite them to describe the current contract: a `below` label names its frame automatically; `none` requires `frameLabel`; `selectMode="open"` is the right choice for a tile that opens something.

- [ ] **Step 11: Run the full gate for this file**

```bash
pnpm --filter docs test -- registry/super-ai/preview-tile.test.tsx
pnpm --filter storybook test:stories
pnpm lint && pnpm typecheck && pnpm check:tokens && pnpm check:contract
```

Expected: all PASS. `check:contract` verifies every declared state still has a matching story export.

- [ ] **Step 12: Commit**

```bash
git add apps/docs/registry/super-ai/preview-tile.tsx apps/docs/registry/super-ai/preview-tile.test.tsx apps/storybook/src/stories/super-ai/PreviewTile.stories.tsx apps/docs/content/components/preview-tile.docs.tsx
git commit -m "fix(a8): name the preview-tile frame, and stop claiming a toggle

A below-placed label is a sibling of the frame, so it named nothing and every
interactive tile using it shipped a nameless button. The frame now points at
the label with aria-labelledby, so the name is the visible label by
construction. labelPlacement=none has no element to point at and takes the new
frameLabel prop instead.

selectMode=\"open\" drops aria-pressed for a tile that navigates rather than
toggles. Default stays \"toggle\".

BelowLabelInteractive is the story that never existed, which is why no gate
ever failed on the pair recent-grid ships."
```

---

## Task 2: feature-card-row — arrows inside their own box

**Files:**
- Modify: `apps/docs/registry/super-ai/feature-card-row.tsx:98-99`
- Story: `apps/storybook/src/stories/super-ai/FeatureCardRow.stories.tsx`

**Interfaces:**
- Consumes: nothing.
- Produces: nothing other tasks depend on. Task 8 deletes `FEATURE_ROW_ARROW_GUTTER` from `home-shell` on the strength of this.

Vendored `CarouselPrevious` / `CarouselNext` position themselves at `-left-12` / `-right-12` when horizontal (`components/ui/carousel.tsx:198`, `:228`). In a constrained column they are clipped or they turn the page into a horizontal scroller: O1 measured 407px of content in a 375px column, all of it the arrow. The vendored file is not editable under the global constraints, so the override goes at our call site.

- [ ] **Step 1: Write the failing story assertion**

Add to `FeatureCardRow.stories.tsx` (create the story if the file has no narrow-width case):

```tsx
/**
 * 375px. The vendored Carousel draws its arrows at `-left-12`/`-right-12`,
 * outside its own box — correct on a full-bleed marketing page, and in a
 * constrained column it is either clipped or it makes the whole page scroll
 * sideways. O1 measured 407px of content in a 375px column, all of it arrow.
 *
 * The arrows are pulled inside the box here. The assertion is on the
 * container's own overflow, not on the arrow's position, because the position
 * is the mechanism and the overflow is the defect.
 */
export const Mobile: Story = {
  render: (args) => (
    <div className="w-[375px] max-w-full overflow-x-hidden">
      <FeatureCardRow {...args} />
    </div>
  ),
  args: { items: DEMO_ITEMS },
  play: async ({ canvasElement }) => {
    const row = canvasElement.querySelector<HTMLElement>('[data-slot="feature-card-row"]')!;
    await expect(row.scrollWidth).toBeLessThanOrEqual(row.clientWidth);

    const prev = canvasElement.querySelector<HTMLElement>('[data-slot="feature-card-row-previous"]')!;
    const rowBox = row.getBoundingClientRect();
    const prevBox = prev.getBoundingClientRect();
    await expect(prevBox.left).toBeGreaterThanOrEqual(rowBox.left);
    await expect(prevBox.right).toBeLessThanOrEqual(rowBox.right);
  },
};
```

Reuse the file's existing demo items array for `DEMO_ITEMS`; if it defines them inline per story, hoist them to a module const first.

- [ ] **Step 2: Run the story to verify it fails**

Run: `pnpm --filter storybook test:stories`
Expected: FAIL on `prevBox.left` being less than `rowBox.left` — the arrow sits 3rem outside the row.

- [ ] **Step 3: Pull the arrows inside**

```tsx
      {/* The visible next affordance the spec calls out: trackpad-only
          scroll hides half the row, and Carousel's role="region" plus
          arrow-key handling is what keeps the row keyboard reachable.

          The vendored arrows sit at -left-12/-right-12, outside the carousel's
          own box. That is right for a full-bleed row and wrong in any
          constrained column, where it clips or forces a horizontal scroller.
          Overriding here rather than in the primitive: components/ui is
          vendored and stays byte-identical to upstream. */}
      <CarouselPrevious data-slot="feature-card-row-previous" className="left-2" />
      <CarouselNext data-slot="feature-card-row-next" className="right-2" />
```

- [ ] **Step 4: Run the story to verify it passes**

Run: `pnpm --filter storybook test:stories`
Expected: PASS.

- [ ] **Step 5: Run the gates**

```bash
pnpm lint && pnpm typecheck && pnpm check:tokens && pnpm check:contract
```

- [ ] **Step 6: Commit**

```bash
git add apps/docs/registry/super-ai/feature-card-row.tsx apps/storybook/src/stories/super-ai/FeatureCardRow.stories.tsx
git commit -m "fix(c3): draw the carousel arrows inside the row's own box

The vendored Carousel offsets its arrows to -left-12/-right-12, so in any
constrained column they are clipped or they turn the page into a horizontal
scroller — O1 measured 407px of content in a 375px column. Overridden at the
call site; components/ui stays byte-identical to upstream.

The Mobile story asserts the row's own scrollWidth, because the arrow position
is the mechanism and the overflow is the defect."
```

---

## Task 3: frame-strip — arrows inside their own box

**Files:**
- Modify: `apps/docs/registry/super-ai/frame-strip.tsx:404-405`
- Story: `apps/storybook/src/stories/super-ai/FrameStrip.stories.tsx`

**Interfaces:**
- Consumes: nothing. `frame-strip` composes `preview-tile` with `labelPlacement="overlay"` and `selected={active}` (`frame-strip.tsx:141-148`), so its tiles are genuine toggles whose overlay label already names them. **It needs nothing from Task 1** — that is why it sits in phase 1.
- Produces: nothing other tasks depend on.

Same vendored-arrow defect as Task 2, reported separately by O3.

- [ ] **Step 1: Write the failing story assertion**

Add to `FrameStrip.stories.tsx`, using whatever items const the file already defines:

```tsx
/**
 * 375px. Same vendored-arrow defect C3 hit: `-left-12`/`-right-12` puts the
 * controls outside the strip's own box, so a narrow column clips them or
 * scrolls sideways. Reported by O3 independently of O1's report on C3.
 */
export const Mobile: Story = {
  render: (args) => (
    <div className="w-[375px] max-w-full overflow-x-hidden">
      <FrameStrip {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const strip = canvasElement.querySelector<HTMLElement>('[data-slot="frame-strip"]')!;
    await expect(strip.scrollWidth).toBeLessThanOrEqual(strip.clientWidth);

    const prev = canvasElement.querySelector<HTMLElement>('[data-slot="frame-strip-previous"]')!;
    const stripBox = strip.getBoundingClientRect();
    const prevBox = prev.getBoundingClientRect();
    await expect(prevBox.left).toBeGreaterThanOrEqual(stripBox.left);
    await expect(prevBox.right).toBeLessThanOrEqual(stripBox.right);
  },
};
```

If the file already exports a `Mobile` story, extend that one with these assertions rather than adding a second.

- [ ] **Step 2: Run the story to verify it fails**

Run: `pnpm --filter storybook test:stories`
Expected: FAIL on the arrow sitting outside the strip.

- [ ] **Step 3: Pull the arrows inside**

```tsx
      {/* Vendored Carousel offsets these to -left-12/-right-12, outside the
          strip's box — clipped in any constrained column. Overridden here
          rather than in the primitive; components/ui stays upstream-identical.
          Same fix as C3 feature-card-row. */}
      <CarouselPrevious data-slot="frame-strip-previous" className="left-2" />
      <CarouselNext data-slot="frame-strip-next" className="right-2" />
```

- [ ] **Step 4: Run the story to verify it passes**

Run: `pnpm --filter storybook test:stories`
Expected: PASS.

- [ ] **Step 5: Run the gates**

```bash
pnpm lint && pnpm typecheck && pnpm check:tokens && pnpm check:contract
```

- [ ] **Step 6: Commit**

```bash
git add apps/docs/registry/super-ai/frame-strip.tsx apps/storybook/src/stories/super-ai/FrameStrip.stories.tsx
git commit -m "fix(h5): draw the frame-strip arrows inside the strip's own box

Same vendored -left-12/-right-12 defect O1 reported on C3, found
independently by O3. Overridden at the call site."
```

---

## Task 4: artifact-grid — columns keyed to the container

**Files:**
- Modify: `apps/docs/registry/super-ai/artifact-grid.tsx:331-334`
- Story: `apps/storybook/src/stories/super-ai/ArtifactGrid.stories.tsx`

**Interfaces:**
- Consumes: nothing.
- Produces: the `[data-slot="artifact-grid-items"]` element becomes a container-query context. Task 8 deletes `ARTIFACTS_IN_STREAM` (`chat-shell`) and `GRID_BESIDE_SIDEBAR` (`artifact-shell`) on the strength of this.

The grid steps to two and three columns at the `sm` and `lg` **viewport** breakpoints. The stream column is narrower than the viewport in every shell that has a sidebar, so two shells already shift each breakpoint up a step by hand with descendant-variant overrides.

Per spec §4.5 this is the one deliberate exception to additive-only: at full width a container query resolves identically to the viewport query, so a standalone consumer sees no change; inside a narrow column it renders correctly instead of over-columned.

- [ ] **Step 1: Write the failing story assertion**

Add to `ArtifactGrid.stories.tsx`:

```tsx
/**
 * The grid in a 420px column, which is what every shell with a sidebar gives
 * it. Keyed to the viewport it would step to two columns here purely because
 * the *window* is wide, and the excerpt — the field the component is built
 * around — clamps to nothing. Keyed to its own container it stays at one.
 *
 * chat-shell and artifact-shell both carried descendant-variant overrides to
 * force this by hand before the grid measured itself.
 */
export const NarrowColumn: Story = {
  render: (args) => (
    <div className="w-[420px] max-w-full">
      <ArtifactGrid {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const items = canvasElement.querySelector<HTMLElement>('[data-slot="artifact-grid-items"]')!;
    const columns = getComputedStyle(items).gridTemplateColumns.split(" ").length;
    await expect(columns).toBe(1);
  },
};
```

Give it the same args the file's existing open-session story uses, so at least two cards render.

- [ ] **Step 2: Run the story to verify it fails**

Run: `pnpm --filter storybook test:stories`
Expected: FAIL with 2 or 3 columns, depending on the test viewport width.

- [ ] **Step 3: Switch to container queries**

```tsx
      {open ? (
        // Columns key off this element's own width, not the window's. Every
        // shell that puts this grid beside a sidebar gives it a column
        // narrower than the viewport, and viewport breakpoints over-column it
        // there — chat-shell and artifact-shell each carried a descendant
        // override to correct it by hand.
        <div
          data-slot="artifact-grid-items"
          className="@container grid gap-3 @md:grid-cols-2 @4xl:grid-cols-3"
        >
```

`@md` is 28rem and `@4xl` is 56rem, the container-query analogues of the `sm`/`lg` steps this grid had. Confirm against the Tailwind v4 container scale in use and adjust the rungs if the project has customised them.

**This is the repo's first `@container`.** See the Global Constraints note: adopting it here sets a convention, so this step is paired with the next one rather than being a silent choice.

- [ ] **Step 3b: Record the convention**

Add to `docs/design-system/decisions.md`, following the file's existing entry format:

```markdown
### D-nn: Container queries are the default for a component's own layout

A component that lays itself out in columns keys them off its **own** width,
never the viewport. J4 `artifact-grid` and C4 `recent-grid` are the pilots.

Why: both shipped viewport-keyed columns, and every shell that put them beside
a sidebar carried a hand-written descendant override to shift each breakpoint
up a step — `ARTIFACTS_IN_STREAM` in `chat-shell`, `GRID_BESIDE_SIDEBAR` in
`artifact-shell`. The defect is a container-vs-viewport confusion by
construction, so no viewport-keyed value can fix it.

Scope: this is not a sweep. Existing viewport breakpoints stay until a
component is found to be wrong beside a narrower parent. Tailwind v4 ships
container queries in core, so there is no dependency to add.
```

Take the next free `D-nn` number from the file.

- [ ] **Step 4: Run the story to verify it passes**

Run: `pnpm --filter storybook test:stories`
Expected: PASS with 1 column. Confirm the file's existing full-width story still shows its old column count.

- [ ] **Step 5: Run the gates**

```bash
pnpm lint && pnpm typecheck && pnpm check:tokens && pnpm check:contract
```

- [ ] **Step 6: Commit**

```bash
git add apps/docs/registry/super-ai/artifact-grid.tsx apps/storybook/src/stories/super-ai/ArtifactGrid.stories.tsx docs/design-system/decisions.md
git commit -m "fix(j4): key artifact-grid columns to its container, not the viewport

Every shell with a sidebar hands this grid a column narrower than the window,
so viewport breakpoints over-columned it and the excerpt clamped to nothing.
Two shells carried descendant-variant overrides to correct it by hand; those
come out in the phase 3 sweep.

At full width a container query resolves the same as the viewport query, so a
standalone consumer sees no change."
```

---

## Task 5: TabsList contrast at our two default-variant call sites

**Files:**
- Modify: `apps/docs/registry/super-ai/parameter-panel.tsx:294`
- Modify: `apps/docs/registry/super-ai/run-inspector.tsx:301`

**Interfaces:**
- Consumes: nothing.
- Produces: nothing other tasks depend on. Task 11 records the residue in `vendored-token-findings.md`.

`tabsListVariants` puts `text-muted-foreground` in its cva base (`components/ui/tabs.tsx:19`) and `bg-muted` in its `default` variant value (`:24`) — 4.34:1 against a 4.5:1 minimum, and the exact pairing `check:tokens` exists to catch. It **is** scanned and `findCvaViolations` **does** detect it; it is downgraded to a warning because the file is vendored.

Four registry components use `TabsList`. `explore-shell.tsx:360` and `tool-panel.tsx:329` already pass `variant="line"` (`bg-transparent`, no violation). The two below take the default.

Per `CLAUDE.md`, rebind the variable rather than restyling slots: composed children carry their own muted classes and a slot-level override cannot reach them.

- [ ] **Step 1: Write the failing story assertions**

In both `ParameterPanel.stories.tsx` and `RunInspector.stories.tsx`, add a play function to the existing default story (or extend the one already there):

```tsx
  play: async ({ canvasElement }) => {
    const list = canvasElement.querySelector<HTMLElement>('[data-slot="tabs-list"]')!;
    // The vendored list pairs text-muted-foreground with bg-muted, which is
    // the same lightness in this token set. Read both back and require they
    // differ — a threshold assertion would need a contrast implementation
    // here; identity is enough to catch the pairing.
    const style = getComputedStyle(list);
    await expect(style.color).not.toBe(style.backgroundColor);
  },
```

- [ ] **Step 2: Run the stories to verify they fail**

Run: `pnpm --filter storybook test:stories`
Expected: FAIL on both, or pass trivially if the list paints no background at that nesting — inspect the computed values printed by the failure before continuing. If they pass trivially, the site is already safe and the correct action is to say so in Step 6's commit and change nothing.

- [ ] **Step 3: Rebind the muted foreground on both lists**

`parameter-panel.tsx:294`:

```tsx
      <TabsList
        data-slot="parameter-tabs-list"
        className="[--muted-foreground:var(--accent-foreground)]"
      >
```

`run-inspector.tsx:301`:

```tsx
        <TabsList
          aria-label={tabsLabel}
          data-slot="run-inspector-tabs"
          className="w-full justify-start [--muted-foreground:var(--accent-foreground)]"
        >
```

- [ ] **Step 4: Run the stories to verify they pass**

Run: `pnpm --filter storybook test:stories`
Expected: PASS.

- [ ] **Step 5: Run the gates**

```bash
pnpm lint && pnpm typecheck && pnpm check:tokens && pnpm check:contract
```

`check:tokens` should report one fewer warned vendored file, or an unchanged count with both call sites now safe — either satisfies spec success criterion 2.

- [ ] **Step 6: Commit**

```bash
git add apps/docs/registry/super-ai/parameter-panel.tsx apps/docs/registry/super-ai/run-inspector.tsx apps/storybook/src/stories/super-ai/ParameterPanel.stories.tsx apps/storybook/src/stories/super-ai/RunInspector.stories.tsx
git commit -m "fix(i1,n5): rebind muted-foreground on the two default TabsList sites

The vendored tabsListVariants pairs text-muted-foreground in its cva base with
bg-muted in the default variant — 4.34:1, the exact pairing check:tokens
exists to catch, downgraded to a warning because the file is vendored.

Rebinding the variable rather than restyling the triggers, per CLAUDE.md:
composed children carry their own muted classes and a slot-level override
cannot reach them. explore-shell and tool-panel already pass variant=line and
need nothing."
```

---

## Task 6: recent-grid — adopt the naming props and container columns

**Files:**
- Modify: `apps/docs/registry/super-ai/recent-grid.tsx:98-106` (grid item), `:120` (list item), `:164-168` (grid columns)
- Test: `apps/docs/registry/super-ai/recent-grid.test.tsx`
- Story: `apps/storybook/src/stories/super-ai/RecentGrid.stories.tsx`

**Interfaces:**
- Consumes: from Task 1 — `frameLabel?: string`, `selectMode?: "toggle" | "open"`, and the automatic `aria-labelledby` on `labelPlacement="below"`. **Task 1 must be merged before this task starts.**
- Produces: nothing other tasks depend on.

This is the component that ships the A8 defect. Its grid layout passes `labelPlacement="below"` with `onSelect={onOpen}` (`:100-104`); its list layout passes `labelPlacement="none"` with `onSelect={onOpen}` (`:120`). Both produce nameless buttons. Both are also **open actions, not toggles** — `onOpen` navigates — so both should drop `aria-pressed`.

The defect has never been caught because the component's own stories pass no `onOpen`, so every tile renders as an inert div.

- [ ] **Step 1: Write the failing tests**

`apps/docs/registry/super-ai/recent-grid.test.tsx` already exists and defines `ITEMS: RecentGridItem[]` at module scope. **Extend it** — do not recreate it, and do not redefine `ITEMS`.

Add one const beside the existing `ITEMS` (the existing rows deliberately pass no `onOpen`, which is the whole reason this defect went unseen):

```tsx
const OPENABLE: RecentGridItem[] = ITEMS.map((item) => ({ ...item, onOpen: () => {} }));
```

Then add these cases inside the existing `describe("RecentGrid", ...)` block:

```tsx
  it("names its grid tiles from the visible title", () => {
    render(<RecentGrid items={OPENABLE} layout="grid" />);
    expect(screen.getByRole("button", { name: "Q3 Launch Video" })).toBeInTheDocument();
  });

  it("names its list thumbnails from the visible title", () => {
    render(<RecentGrid items={OPENABLE} layout="list" />);
    expect(screen.getByRole("button", { name: "Q3 Launch Video" })).toBeInTheDocument();
  });

  it("opens rather than toggles, in both layouts", () => {
    const { rerender } = render(<RecentGrid items={OPENABLE} layout="grid" />);
    expect(screen.getByRole("button", { name: "Q3 Launch Video" })).not.toHaveAttribute(
      "aria-pressed",
    );
    rerender(<RecentGrid items={OPENABLE} layout="list" />);
    expect(screen.getByRole("button", { name: "Q3 Launch Video" })).not.toHaveAttribute(
      "aria-pressed",
    );
  });
```

Note the title is `"Q3 Launch Video"`, matching the existing fixture — not the `"Q3 Launch Trailer"` used in the story files.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm --filter docs test -- registry/super-ai/recent-grid.test.tsx`
Expected: FAIL. The name queries find no such button; the `aria-pressed` assertions fail because the attribute is present.

- [ ] **Step 3: Fix the grid item**

`RecentGridItemGrid`, replacing the `PreviewTile` call:

```tsx
      {/* Composes preview-tile (A8) for the media frame, badge and title
          label — "below" placement is exactly what A8's spec reserves for
          C4's title-under-thumbnail layout, so the tile owns aspect ratio,
          loading/failed states and the selection ring; this component only
          adds duration, edited-ago and hover actions around it.

          No frameLabel here: a below-placed label names its own frame, so the
          button's name is the visible title by construction. selectMode="open"
          because onOpen navigates — this tile holds no pressed state. */}
      <PreviewTile
        aspect="video"
        label={title}
        labelPlacement="below"
        selectMode="open"
        onSelect={onOpen}
        badge={<RecentGridDurationBadge durationLabel={durationLabel} />}
      >
        {thumbnail}
      </PreviewTile>
```

- [ ] **Step 4: Fix the list item**

`RecentGridItemList`, replacing the `PreviewTile` call. The title here is a sibling `<p>` outside the tile, so there is no label element for the frame to point at and `frameLabel` is required:

```tsx
      {/* labelPlacement="none": the title sits beside the thumbnail in this
          layout, not under it, so it is rendered below as a sibling. That
          leaves the frame with nothing to name itself from — hence frameLabel.
          selectMode="open" for the same reason as the grid layout. */}
      <PreviewTile
        aspect="video"
        labelPlacement="none"
        frameLabel={title}
        selectMode="open"
        onSelect={onOpen}
        className="w-28 shrink-0"
      >
        {thumbnail}
      </PreviewTile>
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `pnpm --filter docs test -- registry/super-ai/recent-grid.test.tsx`
Expected: PASS.

- [ ] **Step 6: Switch the grid columns to the container**

Replace the layout class at `:164-168`:

```tsx
        <div
          className={cn(
            layout === "grid"
              ? "@container grid grid-cols-2 gap-4 @2xl:grid-cols-3 @5xl:grid-cols-4"
              : "flex flex-col",
          )}
        >
```

Same reasoning as Task 4; confirm the rungs against the project's container scale.

- [ ] **Step 7: Give the stories an `onOpen`**

The stories pass no `onOpen`, which is why every tile renders inert and the defect stayed invisible. Add a story that exercises the interactive path in both layouts:

```tsx
/**
 * Both layouts with a real `onOpen`, which is what a product always passes and
 * what no story here did until now. That gap is why C4 shipped nameless
 * buttons through every gate: with no handler the tile renders as an inert
 * div, and an inert div cannot fail `button-name`.
 *
 * The grid tile is named by its own visible caption; the list thumbnail has no
 * caption inside the tile, so it is named explicitly. Neither reports
 * `aria-pressed` — opening a project is not a toggle.
 */
export const Interactive: Story = {
  render: () => (
    <div className="flex flex-col gap-8">
      <RecentGrid layout="grid" items={INTERACTIVE_ITEMS} />
      <RecentGrid layout="list" items={INTERACTIVE_ITEMS} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // One button per layout for the same record: the grid tile and the list
    // thumbnail. Use the title of the file's own first fixture row.
    const named = await canvas.findAllByRole("button", { name: FIRST_TITLE });
    await expect(named).toHaveLength(2);
    for (const button of named) {
      await expect(button).not.toHaveAttribute("aria-pressed");
    }
  },
};
```

Define `INTERACTIVE_ITEMS` at module scope from the file's existing items array, adding `onOpen: () => {}` to each, and `const FIRST_TITLE = INTERACTIVE_ITEMS[0].title;` beside it. Do not hardcode a title string — the story file and `recent-grid.test.tsx` use different fixture names, and a literal here would couple this story to whichever one the author had open.

- [ ] **Step 8: Run the full gate**

```bash
pnpm --filter docs test -- registry/super-ai/recent-grid.test.tsx
pnpm --filter storybook test:stories
pnpm lint && pnpm typecheck && pnpm check:tokens && pnpm check:contract
```

- [ ] **Step 9: Commit**

```bash
git add apps/docs/registry/super-ai/recent-grid.tsx apps/docs/registry/super-ai/recent-grid.test.tsx apps/storybook/src/stories/super-ai/RecentGrid.stories.tsx
git commit -m "fix(c4): name recent-grid's tiles, and stop reporting them as toggles

Both layouts handed preview-tile an onSelect with no name reachable from the
frame: the grid's caption is a sibling of the button, the list's title is
outside the tile entirely. Both shipped nameless buttons, and neither was ever
caught because the stories passed no onOpen — an inert div cannot fail
button-name.

Grid tiles now name themselves from their own caption; list thumbnails take
frameLabel. Both use selectMode=open, because opening a project is not a
toggle. Columns key off the container, so the shells' overrides can come out."
```

---

## Task 7: the sidebar fills its shell

**Files:**
- Modify: all five of `apps/docs/registry/super-ai/{chat,artifact,home,docs,records}-shell.tsx`, at each file's `EMBEDDABLE_SHELL` declaration and its application site

**Interfaces:**
- Consumes: nothing.
- Produces: `sidebarPromo` / `sidebarFooter` / `railFooter` become visible in an embedded shell. Tasks 9 and 10 depend on this.

The vendored `sidebar-container` is `fixed inset-y-0 z-10 h-svh` (`components/ui/sidebar.tsx:233`). `EMBEDDABLE_SHELL`'s `contain: layout` makes the shell the containing block, which is correct and must stay — without it the sidebar pins itself to the browser's left edge. But `h-svh` still takes its height from the **viewport**, so in any shell shorter than the viewport the sidebar's box overhangs and everything bottom-anchored falls below the visible edge.

`chat-shell.docs.tsx:109` already names this fix: "until the sidebar primitive learns to measure its containing block instead of `svh`."

- [ ] **Step 1: Add the companion constant to each shell**

Directly below each file's `EMBEDDABLE_SHELL` declaration:

```tsx
/**
 * The other half of `EMBEDDABLE_SHELL`. Containment redirects where the
 * vendored sidebar's `fixed` box is anchored, but its `h-svh` still takes its
 * height from the viewport — so in any shell shorter than the window the
 * sidebar overhangs and everything it bottom-anchors (`sidebarPromo`,
 * `sidebarFooter`) falls below the visible edge. Clipped, not hidden: those
 * controls stayed in the tab order while being invisible.
 *
 * Overriding here rather than in the primitive: `components/ui` is vendored
 * and stays byte-identical to upstream.
 */
const SIDEBAR_FILLS_SHELL = "[&_[data-slot=sidebar-container]]:h-full";
```

- [ ] **Step 2: Apply it beside `EMBEDDABLE_SHELL`**

At each shell's root `cn(...)` call, add `SIDEBAR_FILLS_SHELL` immediately after `EMBEDDABLE_SHELL`. In `chat-shell.tsx` that is line 292:

```tsx
        EMBEDDABLE_SHELL,
        SIDEBAR_FILLS_SHELL,
        className,
```

- [ ] **Step 3: Verify by hand in the browser before trusting any test**

```bash
pnpm --filter docs dev
```

Open a shell docs page, take **your own port** if another worktree is running (`CONTINUE.md` §1: a sibling worktree's dev server on port 3000 will serve *its* build while your preview reports success). Pass a `sidebarFooter` and confirm it is visible inside a shell that is shorter than the window.

- [ ] **Step 4: Run the gates**

```bash
pnpm lint && pnpm typecheck && pnpm check:tokens && pnpm check:contract
```

- [ ] **Step 5: Commit**

```bash
git add apps/docs/registry/super-ai/chat-shell.tsx apps/docs/registry/super-ai/artifact-shell.tsx apps/docs/registry/super-ai/home-shell.tsx apps/docs/registry/super-ai/docs-shell.tsx apps/docs/registry/super-ai/records-shell.tsx
git commit -m "fix(o): make the embedded sidebar measure its shell, not the viewport

EMBEDDABLE_SHELL's containment redirects where the vendored sidebar's fixed
box is anchored, but h-svh still sized it from the window — so in any shell
shorter than the viewport the box overhung and sidebarPromo/sidebarFooter fell
below the visible edge. Clipped is not hidden: those controls stayed in the
tab order while being invisible.

Reported four times over (O1, O9, O10, O11) as a defect in B1 app-sidebar.
B1 was never the defect: it wires both slots correctly. One companion class in
five shells closes all four reports."
```

---

## Task 8: delete the three compensation constants

**Files:**
- Modify: `apps/docs/registry/super-ai/home-shell.tsx:81` and its application site
- Modify: `apps/docs/registry/super-ai/chat-shell.tsx:85` and its application site
- Modify: `apps/docs/registry/super-ai/artifact-shell.tsx:78-83` and its application site

**Interfaces:**
- Consumes: Task 2 (`feature-card-row` arrows) and Task 4 (`artifact-grid` container columns). **Both must be merged before this task starts.**
- Produces: three of the six rows of the spec's evidence table.

This is where the fixes are proven. A constant that cannot be deleted means the fix did not land.

- [ ] **Step 1: Delete `FEATURE_ROW_ARROW_GUTTER`**

Remove the constant and its JSDoc from `home-shell.tsx:76-81`, and remove `FEATURE_ROW_ARROW_GUTTER` from the `cn(...)` call that applies it.

- [ ] **Step 2: Delete `ARTIFACTS_IN_STREAM`**

Remove the constant and its JSDoc from `chat-shell.tsx:77-86`, and remove it from its application site.

- [ ] **Step 3: Delete `GRID_BESIDE_SIDEBAR`**

Remove the constant and its JSDoc from `artifact-shell.tsx:74-83`, and remove it from its application site.

- [ ] **Step 4: Verify nothing regressed, in a browser**

```bash
pnpm --filter storybook test:stories
```

Then look at the three shells' stories: the feature row's arrows must sit on the row rather than in a 36px gutter, and both artifact grids must hold one column in a narrow stream and step up in a wide one.

- [ ] **Step 5: Run the gates**

```bash
pnpm lint && pnpm typecheck && pnpm check:tokens && pnpm check:contract
```

- [ ] **Step 6: Commit**

```bash
git add apps/docs/registry/super-ai/home-shell.tsx apps/docs/registry/super-ai/chat-shell.tsx apps/docs/registry/super-ai/artifact-shell.tsx
git commit -m "refactor(o): delete the three compensation constants the fixes retired

FEATURE_ROW_ARROW_GUTTER, ARTIFACTS_IN_STREAM and GRID_BESIDE_SIDEBAR each
existed because a composed component could not do something. All three can
now. The deletion is the evidence: a constant that could not be removed would
mean the fix did not land."
```

---

## Task 9: delete the clip warnings

**Files:**
- Modify: 5 shells' `sidebarPromo` / `sidebarFooter` / `railFooter` JSDoc
- Modify: `apps/docs/content/components/{chat,artifact,home,docs,records}-shell.docs.tsx` — each has the warning in both a `donts` entry and a `pitfalls` entry

**Interfaces:**
- Consumes: Task 7. **Must be merged before this task starts.**
- Produces: the fourth row of the evidence table.

The block builders described this defect **accurately** — `home-shell.tsx:110-116` names the containment and the `h-svh` box correctly, and `chat-shell.docs.tsx:109` even names the fix. Only `CONTINUE.md` §8's summary misattributed it. These are true statements that have stopped being true, not wrong ones being corrected.

- [ ] **Step 1: Rewrite the shell JSDoc**

In each of the five shells, replace the clip warning on the promo/footer props. `home-shell.tsx:110-119` becomes:

```tsx
  /** B5 promo or any ambient sidebar CTA. */
  sidebarPromo?: React.ReactNode;
  /** B8 account menu. Sits at the bottom of the sidebar, above the rail. */
  sidebarFooter?: React.ReactNode;
```

`docs-shell` names its slot `railFooter`; treat it the same way.

- [ ] **Step 2: Rewrite the docs-page `pitfalls` entry**

Each shell's docs page carries a long pitfall about the `h-svh` trade-off. The containment half is still true and load-bearing; the clipping half is not. Replace with a version that keeps the surviving warning, e.g. for `chat-shell.docs.tsx:109`:

```
"The vendored sidebar's desktop container is `fixed inset-y-0 h-svh`, which is right only when the shell owns the viewport. The root sets `contain: layout` so the shell stays embeddable in a panel, a preview or an app region — if you re-wrap or restyle the root, keep that containment or the sidebar will pin itself to the browser's left edge. The root also constrains that container to the shell's own height, which is what makes `sidebarPromo` and `sidebarFooter` usable in an embedded shell; before that they were bottom-anchored below the visible edge, invisible and still in the tab order."
```

- [ ] **Step 3: Delete the `donts` entries that only described the clip**

`chat-shell.docs.tsx:103` and `home-shell.docs.tsx:81` are don'ts whose entire content is the clip warning ("Fill those two slots only in a shell rendered at viewport height"). Delete them. Do **not** leave a don't that now argues against correct usage.

Check each docs page still has at least one `donts` entry — `check:contract` requires it.

- [ ] **Step 4: Run the gates**

```bash
pnpm lint && pnpm typecheck && pnpm check:tokens && pnpm check:contract
```

`check:contract` is the one that matters here: it requires `whatItIs`, `whyItMatters`, at least one do, at least one don't, at least one pitfall, and both accessibility arms on every docs module.

- [ ] **Step 5: Commit**

```bash
git add apps/docs/registry/super-ai/*-shell.tsx apps/docs/content/components/*-shell.docs.tsx
git commit -m "docs(o): retire the sidebar clip warnings, which have stopped being true

Five shells' JSDoc and five docs pages warned that sidebarPromo and
sidebarFooter are clipped out of view in an embedded shell. They described the
mechanism correctly — it is CONTINUE §8's summary that blamed B1 — and the
warning is now false, so it goes.

The containment half of each pitfall survives: re-wrap the root without
contain:layout and the sidebar still pins itself to the browser's left edge."
```

---

## Task 10: real-browser proof for the two layout fixes

**Files:**
- Create or modify: `apps/storybook/src/stories/super-ai/HomeShell.stories.tsx` (or the shell story file that already renders a sidebar)

**Interfaces:**
- Consumes: Tasks 7, 8, 9.
- Produces: spec success criterion 4.

Containment and overflow have **no representation in jsdom**, so neither of these can be asserted in a Vitest file. They belong in a Storybook play function, which runs under Playwright.

- [ ] **Step 1: Write the failing assertion**

Add to the shell story file:

```tsx
/**
 * The shell at 600px tall — shorter than any viewport, which is the ordinary
 * embedded case and the one that used to hide the sidebar's bottom slots.
 *
 * The assertion is geometric rather than a class check: the footer's box has
 * to sit inside the shell's box. A class assertion would pass against a
 * constant that had been deleted from the cn() call and left declared.
 */
export const EmbeddedWithSidebarFooter: Story = {
  render: (args) => (
    <div className="h-[600px] overflow-hidden">
      <HomeShell {...args} sidebarFooter={<button type="button">Account</button>} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const shell = canvasElement.firstElementChild as HTMLElement;
    const footer = canvasElement.querySelector<HTMLElement>('[data-slot="app-sidebar-footer"]')!;

    const shellBox = shell.getBoundingClientRect();
    const footerBox = footer.getBoundingClientRect();

    await expect(footerBox.bottom).toBeLessThanOrEqual(shellBox.bottom + 1);
    await expect(footerBox.height).toBeGreaterThan(0);
  },
};
```

- [ ] **Step 2: Verify it fails without the fix**

Temporarily remove `SIDEBAR_FILLS_SHELL` from `home-shell.tsx`'s `cn(...)`, run the story, confirm FAIL, then restore it. A gate that cannot fail is not a gate — do not skip this step.

Run: `pnpm --filter storybook test:stories`

- [ ] **Step 3: Verify it passes with the fix restored**

Run: `pnpm --filter storybook test:stories`
Expected: PASS.

- [ ] **Step 4: Rebuild, then run the docs smoke gate**

`next start` serves the prebuilt output, so the build must come first or the smoke test runs against stale pages.

```bash
pnpm build
cd apps/docs && pnpm exec playwright test
```

- [ ] **Step 5: Commit**

```bash
git add apps/storybook/src/stories/super-ai/HomeShell.stories.tsx
git commit -m "test(o): assert the embedded sidebar's footer is inside its shell

Containment has no representation in jsdom, so this cannot live in a Vitest
file. Geometric rather than a class assertion: a class check would pass
against a constant deleted from the cn() call and left declared.

Verified to fail with SIDEBAR_FILLS_SHELL removed before being committed."
```

---

## Task 11: correct the record

**Files:**
- Modify: `docs/CONTINUE.md` §8 (the B1 entry and the vendored `ui/tabs.tsx` entry)
- Modify: `docs/design-system/vendored-token-findings.md`

**Interfaces:**
- Consumes: every prior task.
- Produces: spec success criteria 5 and the tabs residue record.

Both §8 entries name the wrong cause. Left uncorrected, the next reader inherits the same two wrong starting points this plan had to discover for itself.

- [ ] **Step 1: Correct the B1 entry**

Replace the B1 bullet in `CONTINUE.md` §8 with a resolved entry:

```markdown
- **~~B1 `app-sidebar`'s bottom-anchored slots are clipped~~ — fixed 2026-08-17, and
  B1 was never the defect.** The clipping came from the vendored
  `sidebar-container`'s `fixed inset-y-0 h-svh` meeting the non-viewport
  containing block `EMBEDDABLE_SHELL` creates: containment redirects where the
  box is anchored, `h-svh` still sized it from the window. `app-sidebar` wires
  `promo` and `footer` correctly and was not changed. Fixed by
  `SIDEBAR_FILLS_SHELL` in five shells. Note the shells' own JSDoc and docs
  pages described the mechanism correctly all along — this entry's summary is
  what misattributed it to B1.
```

- [ ] **Step 2: Correct the `ui/tabs.tsx` entry**

```markdown
- **~~Vendored `ui/tabs.tsx` ... sitting outside its scan scope~~ — corrected and
  handled 2026-08-17.** It is not outside the scan scope: `check-tokens.mjs`
  globs `components/ui` and `findCvaViolations` detects the base/variant
  pairing correctly. It is *found and downgraded to a warning* because the file
  is vendored. Our two default-variant call sites now rebind
  `--muted-foreground`; the vendored default remains unsafe for consumers who
  compose a stock `TabsList`, recorded in `vendored-token-findings.md`.
```

- [ ] **Step 3: Record the tabs residue**

Add to `docs/design-system/vendored-token-findings.md`:

```markdown
### `tabs.tsx` — `tabsListVariants`, default variant

`text-muted-foreground` in the cva base against `bg-muted` in the `default`
variant value: 4.34:1 against a 4.5:1 minimum. Found by `findCvaViolations`,
warned rather than gated because the file is vendored.

Handled at our two call sites (`parameter-panel`, `run-inspector`) by rebinding
`--muted-foreground`; `explore-shell` and `tool-panel` already pass
`variant="line"`, which paints no background.

**Unhandled, and unhandleable from here:** a consumer who installs one of our
components and takes a stock `TabsList` at its default variant gets the failing
pairing. Fixing that means diverging from upstream, which is the open decision
this file exists to hold.
```

- [ ] **Step 4: Run the full CI gate order, from the repo root**

```bash
pnpm lint && pnpm typecheck && pnpm check:tokens && pnpm check:contract && pnpm test && pnpm build:registry && pnpm build
cd apps/docs && pnpm exec playwright test
cd ../storybook && pnpm test:stories
cd ../docs && ./scripts/consumer-test.sh
```

- [ ] **Step 5: Confirm no vendored file is in the batch's diff**

```bash
git diff --stat main...HEAD -- apps/docs/components/ui/
```

Expected: **empty output.** Any result here fails spec success criterion 6.

- [ ] **Step 6: Commit**

```bash
git add docs/CONTINUE.md docs/design-system/vendored-token-findings.md
git commit -m "docs: correct §8's two misattributed entries, record the tabs residue

B1 app-sidebar was never the defect, and ui/tabs was never outside the token
gate's scan scope. Both entries sent this batch's planning to the wrong file
before source disagreed with them; correcting them so the next reader does not
inherit the same two wrong starting points."
```

---

## Success Criteria

Checked against spec §8:

1. All six rows of the spec's evidence table are true.
2. `check:tokens` reports one fewer warned vendored file, or both call sites no longer resolve to the muted pairing.
3. The axe gate passes on `BelowLabelInteractive` and on `RecentGrid.Interactive` — combinations no story staged before this batch.
4. Two real-browser assertions exist and pass: the embedded sidebar footer (Task 10) and the narrow-column carousels (Tasks 2 and 3).
5. `CONTINUE.md` §8's B1 and `ui/tabs` entries name the correct cause.
6. `git diff --stat main...HEAD -- apps/docs/components/ui/` is empty.
