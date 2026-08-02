# preview-tile (A8) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `preview-tile`, the highest-fan-out primitive in the catalog, as an installable registry component with tests, demo, docs page and Storybook story — and correct the catalog docs its audit disproved.

**Architecture:** A fixed-aspect frame holding an untyped `children` slot, a label slot with three placements, a badge slot, and four states that change what sits inside the frame without ever changing the frame's box. Selection is a ring (box-shadow, zero layout) rather than a border. No npm or registry dependencies — Tailwind `aspect-*` utilities and an `animate-pulse` skeleton cover the spec's stated bases.

**Tech Stack:** React 19, Next 16, Tailwind v4, vitest + @testing-library/react, shadcn registry (`shadcn build`), Storybook 9 (Vite).

**Spec:** [`docs/superpowers/specs/2026-08-02-preview-tile-design.md`](../specs/2026-08-02-preview-tile-design.md)

---

## File Structure

| File | Responsibility |
| --- | --- |
| `apps/docs/registry/super-ai/preview-tile.tsx` | **Create.** The primitive. Single export `PreviewTile`. |
| `apps/docs/registry/super-ai/preview-tile.test.tsx` | **Create.** Co-located behaviour tests. |
| `apps/docs/lib/catalog.ts` | **Modify.** Add the catalog entry (drives registry, sidebar, docs route). |
| `apps/docs/components/demos/preview-tile-demo.tsx` | **Create.** Docs-site demo. |
| `apps/docs/app/components/[name]/page.tsx` | **Modify.** Register the demo in the `demos` map. |
| `apps/storybook/src/components/super-ai/preview-tile.tsx` | **Create.** Storybook's copy (Storybook copies, it does not alias). |
| `apps/storybook/src/components/super-ai/demos/preview-tile-demo.tsx` | **Create.** Storybook's demo copy. |
| `apps/storybook/src/stories/super-ai/PreviewTile.stories.tsx` | **Create.** Story. |
| `docs/design-system/concept-model.md` | **Modify.** Correct the A8 fan-out list. |
| `docs/design-system/decisions.md` | **Modify.** Add D11, mark Q5 resolved. |
| `docs/design-system/component-specs.md` | **Modify.** A8 real consumers; F1/C4 declare A8; J3/J4 notes. |
| `docs/superpowers/specs/2026-08-02-preview-tile-design.md` | **Modify.** Correct §4.2 `locked` behaviour (see Task 5). |

`scripts/gen-registry.mts` needs **no** change: `preview-tile` has no `dependencies` or `registryDependencies`, so it needs no `extras` entry. Adding it to `CATALOG_ITEMS` is sufficient.

---

### Task 1: Frame geometry is invariant across states

This is the load-bearing contract. If it regresses, every grid in the catalog reflows.

**Files:**
- Create: `apps/docs/registry/super-ai/preview-tile.tsx`
- Test: `apps/docs/registry/super-ai/preview-tile.test.tsx`

- [ ] **Step 1: Write the failing test**

The frame is located by its `data-slot` attribute — the same convention the other primitives use, and stable across every state.

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PreviewTile } from "./preview-tile";

const frameClassName = () =>
  document.querySelector('[data-slot="preview-tile-frame"]')!.className;

describe("PreviewTile", () => {
  it("keeps identical frame classes across every state", () => {
    const states = ["default", "loading", "locked", "failed"] as const;
    const frames = states.map((state) => {
      const { unmount } = render(
        <PreviewTile state={state}>
          <img alt="" src="data:," />
        </PreviewTile>,
      );
      const className = frameClassName();
      unmount();
      return className;
    });
    expect(new Set(frames).size).toBe(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter docs exec vitest run registry/super-ai/preview-tile.test.tsx`
Expected: FAIL — `Failed to resolve import "./preview-tile"`

- [ ] **Step 3: Write minimal implementation**

```tsx
"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

type PreviewTileAspect = "square" | "video" | "portrait" | "wide";
type PreviewTileState = "default" | "loading" | "locked" | "failed";

const ASPECT: Record<PreviewTileAspect, string> = {
  square: "aspect-square",
  video: "aspect-video",
  portrait: "aspect-[3/4]",
  wide: "aspect-[21/9]",
};

interface PreviewTileProps extends Omit<React.ComponentProps<"div">, "onSelect"> {
  aspect?: PreviewTileAspect;
  state?: PreviewTileState;
}

function PreviewTile({
  aspect = "square",
  state = "default",
  className,
  children,
  ...props
}: PreviewTileProps) {
  return (
    <div
      data-slot="preview-tile"
      data-state={state}
      className={cn("flex flex-col gap-2", className)}
      {...props}
    >
      <div
        data-slot="preview-tile-frame"
        className={cn("bg-muted relative w-full overflow-hidden rounded-lg", ASPECT[aspect])}
      >
        {children}
      </div>
    </div>
  );
}

export { PreviewTile };
export type { PreviewTileAspect, PreviewTileProps, PreviewTileState };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter docs exec vitest run registry/super-ai/preview-tile.test.tsx`
Expected: PASS (1 test)

- [ ] **Step 5: Commit**

```bash
git add apps/docs/registry/super-ai/preview-tile.tsx apps/docs/registry/super-ai/preview-tile.test.tsx
git commit -m "feat(preview-tile): fixed-aspect frame invariant across states"
```

---

### Task 2: Selection is a ring and adds no layout box

**Files:**
- Modify: `apps/docs/registry/super-ai/preview-tile.tsx`
- Test: `apps/docs/registry/super-ai/preview-tile.test.tsx`

- [ ] **Step 1: Write the failing test**

Append inside the `describe` block:

```tsx
it("applies a ring when selected and never a border", () => {
  const { rerender } = render(<PreviewTile selected={false} />);
  const frame = () => document.querySelector('[data-slot="preview-tile-frame"]')!;
  expect(frame().className).not.toMatch(/\bring-2\b/);
  rerender(<PreviewTile selected />);
  expect(frame().className).toMatch(/\bring-2\b/);
  expect(frame().className).not.toMatch(/\bborder-2\b/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter docs exec vitest run registry/super-ai/preview-tile.test.tsx`
Expected: FAIL — `expected '' to match /\bring-2\b/`

- [ ] **Step 3: Write minimal implementation**

Add `selected` to the interface and destructuring, then to the frame's `cn(...)`:

```tsx
interface PreviewTileProps extends Omit<React.ComponentProps<"div">, "onSelect"> {
  aspect?: PreviewTileAspect;
  state?: PreviewTileState;
  selected?: boolean;
}
```

```tsx
function PreviewTile({
  aspect = "square",
  state = "default",
  selected = false,
  className,
  children,
  ...props
}: PreviewTileProps) {
```

```tsx
      <div
        data-slot="preview-tile-frame"
        className={cn(
          "bg-muted relative w-full overflow-hidden rounded-lg",
          ASPECT[aspect],
          // A ring is a box-shadow: zero layout contribution, so selecting never
          // reflows the grid. A border would add 2px per side. This is the reason
          // E4 preset-grid and H5 frame-strip both specify a ring.
          selected && "ring-ring ring-offset-background ring-2 ring-offset-2",
        )}
      >
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter docs exec vitest run registry/super-ai/preview-tile.test.tsx`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add apps/docs/registry/super-ai/preview-tile.tsx apps/docs/registry/super-ai/preview-tile.test.tsx
git commit -m "feat(preview-tile): ring-not-border selection"
```

---

### Task 3: Label placement — overlay, below, none

**Files:**
- Modify: `apps/docs/registry/super-ai/preview-tile.tsx`
- Test: `apps/docs/registry/super-ai/preview-tile.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
it("places the label per labelPlacement", () => {
  const frame = () => document.querySelector('[data-slot="preview-tile-frame"]')!;

  const overlay = render(<PreviewTile label="Neon noir" labelPlacement="overlay" />);
  expect(frame().textContent).toContain("Neon noir");
  overlay.unmount();

  const below = render(<PreviewTile label="Neon noir" labelPlacement="below" />);
  expect(frame().textContent).not.toContain("Neon noir");
  expect(screen.getByText("Neon noir")).toBeInTheDocument();
  below.unmount();

  render(<PreviewTile label="Neon noir" labelPlacement="none" />);
  expect(screen.queryByText("Neon noir")).not.toBeInTheDocument();
});

it("renders the badge inside the frame", () => {
  render(<PreviewTile badge={<span>17 credits</span>} />);
  const frame = document.querySelector('[data-slot="preview-tile-frame"]')!;
  expect(frame.textContent).toContain("17 credits");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter docs exec vitest run registry/super-ai/preview-tile.test.tsx`
Expected: FAIL — label text absent from the frame

- [ ] **Step 3: Write minimal implementation**

Extend the interface:

```tsx
interface PreviewTileProps extends Omit<React.ComponentProps<"div">, "onSelect"> {
  aspect?: PreviewTileAspect;
  state?: PreviewTileState;
  selected?: boolean;
  label?: React.ReactNode;
  labelPlacement?: "overlay" | "below" | "none";
  badge?: React.ReactNode;
}
```

Destructure `label`, `labelPlacement = "overlay"`, `badge`. Inside the frame, after `{children}`:

```tsx
        {badge ? (
          <span data-slot="preview-tile-badge" className="absolute top-2 right-2">
            {badge}
          </span>
        ) : null}
        {label && labelPlacement === "overlay" ? (
          <span
            data-slot="preview-tile-label"
            className="bg-background/80 text-foreground absolute inset-x-0 bottom-0 truncate px-2 py-1 text-xs backdrop-blur-sm"
          >
            {label}
          </span>
        ) : null}
```

After the frame, still inside the outer div:

```tsx
      {label && labelPlacement === "below" ? (
        <span data-slot="preview-tile-label" className="text-foreground truncate text-sm">
          {label}
        </span>
      ) : null}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter docs exec vitest run registry/super-ai/preview-tile.test.tsx`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add apps/docs/registry/super-ai/preview-tile.tsx apps/docs/registry/super-ai/preview-tile.test.tsx
git commit -m "feat(preview-tile): label placement and badge slots"
```

---

### Task 4: Interaction and accessibility

**Files:**
- Modify: `apps/docs/registry/super-ai/preview-tile.tsx`
- Test: `apps/docs/registry/super-ai/preview-tile.test.tsx`

- [ ] **Step 1: Write the failing test**

Add `userEvent` to the imports at the top of the test file:

```tsx
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
```

```tsx
it("is a button carrying aria-pressed when selectable", async () => {
  const onSelect = vi.fn();
  render(<PreviewTile label="Tile" onSelect={onSelect} selected />);
  const button = screen.getByRole("button");
  expect(button).toHaveAttribute("aria-pressed", "true");
  await userEvent.click(button);
  expect(onSelect).toHaveBeenCalledOnce();
});

it("fires onSelect on Enter and Space", async () => {
  const onSelect = vi.fn();
  render(<PreviewTile onSelect={onSelect} />);
  screen.getByRole("button").focus();
  await userEvent.keyboard("{Enter}");
  await userEvent.keyboard(" ");
  expect(onSelect).toHaveBeenCalledTimes(2);
});

it("is not focusable and exposes no button when not selectable", () => {
  render(<PreviewTile label="Static" />);
  expect(screen.queryByRole("button")).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter docs exec vitest run registry/super-ai/preview-tile.test.tsx`
Expected: FAIL — `Unable to find an accessible element with the role "button"`

- [ ] **Step 3: Write minimal implementation**

Add `onSelect?: () => void;` to the interface, destructure it, then make the frame element conditional. Replace the frame's opening tag with:

```tsx
  const interactive = typeof onSelect === "function";
  const Frame = interactive ? "button" : "div";
```

```tsx
      <Frame
        // A native button gives Enter/Space, focus and disabled semantics for free.
        // Decorative tiles stay a div so they never enter the tab order.
        {...(interactive
          ? { type: "button" as const, onClick: onSelect, "aria-pressed": selected }
          : {})}
        data-slot="preview-tile-frame"
        className={cn(
          "bg-muted relative w-full overflow-hidden rounded-lg",
          ASPECT[aspect],
          interactive && "focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
          selected && "ring-ring ring-offset-background ring-2 ring-offset-2",
        )}
      >
```

and close it with `</Frame>`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter docs exec vitest run registry/super-ai/preview-tile.test.tsx`
Expected: PASS (7 tests)

- [ ] **Step 5: Commit**

```bash
git add apps/docs/registry/super-ai/preview-tile.tsx apps/docs/registry/super-ai/preview-tile.test.tsx
git commit -m "feat(preview-tile): button semantics only when selectable"
```

---

### Task 5: States — loading, locked, failed

**Spec correction applied here.** Spec §4.2 says `locked` replaces content. F1 `result-card` requires the opposite: *"`locked` shows the shape of what would have been made, then the CTA — never an empty box with a padlock."* Replacing content would produce exactly that forbidden empty box. Therefore: `loading` and `failed` replace children; `locked` keeps children under a scrim and overlays `action`. The spec is corrected in Step 6.

**Files:**
- Modify: `apps/docs/registry/super-ai/preview-tile.tsx`
- Modify: `docs/superpowers/specs/2026-08-02-preview-tile-design.md`
- Test: `apps/docs/registry/super-ai/preview-tile.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
it("loading and failed replace children; locked keeps them", () => {
  const child = <span>CHILD</span>;

  const loading = render(<PreviewTile state="loading">{child}</PreviewTile>);
  expect(screen.queryByText("CHILD")).not.toBeInTheDocument();
  loading.unmount();

  const failed = render(<PreviewTile state="failed">{child}</PreviewTile>);
  expect(screen.queryByText("CHILD")).not.toBeInTheDocument();
  failed.unmount();

  render(<PreviewTile state="locked">{child}</PreviewTile>);
  expect(screen.getByText("CHILD")).toBeInTheDocument();
});

it("renders the action slot in locked and failed, and keeps label and badge in every state", () => {
  const locked = render(
    <PreviewTile state="locked" label="Tile" badge={<span>PRO</span>} action={<button>Upgrade</button>} />,
  );
  expect(screen.getByRole("button", { name: "Upgrade" })).toBeInTheDocument();
  expect(screen.getByText("Tile")).toBeInTheDocument();
  expect(screen.getByText("PRO")).toBeInTheDocument();
  locked.unmount();

  render(<PreviewTile state="failed" action={<button>Retry</button>} />);
  expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter docs exec vitest run registry/super-ai/preview-tile.test.tsx`
Expected: FAIL — `CHILD` still present in the `loading` case

- [ ] **Step 3: Write minimal implementation**

Add `action?: React.ReactNode;` to the interface and destructure it. Replace `{children}` inside the frame with:

```tsx
        {state === "loading" ? (
          <div data-slot="preview-tile-loading" className="bg-muted h-full w-full animate-pulse" />
        ) : state === "failed" ? (
          <div
            data-slot="preview-tile-failed"
            className="text-destructive absolute inset-0 flex flex-col items-center justify-center gap-2 p-3 text-center text-xs"
          >
            {action}
          </div>
        ) : (
          <>
            {children}
            {state === "locked" ? (
              // F1: locked shows the shape of what would have been made, then the
              // CTA — never an empty box with a padlock. Children stay, scrim over.
              <div
                data-slot="preview-tile-locked"
                className="bg-background/60 absolute inset-0 flex flex-col items-center justify-center gap-2 p-3 text-center text-xs backdrop-blur-[2px]"
              >
                {action}
              </div>
            ) : null}
          </>
        )}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter docs exec vitest run registry/super-ai/preview-tile.test.tsx`
Expected: PASS (9 tests)

- [ ] **Step 5: Run the full docs test suite**

Run: `pnpm --filter docs test`
Expected: PASS — 10 test files, all green

- [ ] **Step 6: Correct the spec**

In `docs/superpowers/specs/2026-08-02-preview-tile-design.md` §4.2, replace the `locked` row of the states table with:

```markdown
| `locked` | `children` retained under a scrim + `action` overlaid | unchanged |
```

and add this sentence directly beneath the table:

```markdown
`locked` deliberately retains `children` rather than replacing them. F1 requires that locked shows
the shape of what would have been made before the CTA; replacing the content would produce exactly
the empty box with a padlock that F1 forbids.
```

- [ ] **Step 7: Commit**

```bash
git add apps/docs/registry/super-ai/preview-tile.tsx apps/docs/registry/super-ai/preview-tile.test.tsx docs/superpowers/specs/2026-08-02-preview-tile-design.md
git commit -m "feat(preview-tile): loading, locked and failed states"
```

---

### Task 6: Catalog entry and registry build

**Files:**
- Modify: `apps/docs/lib/catalog.ts`

- [ ] **Step 1: Add the catalog entry**

In `CATALOG_ITEMS`, insert after the `gen-settings-bar` entry (keeping Primitives together and before the `shortcuts-sheet` Components entry):

```ts
  {
    name: "preview-tile",
    title: "Preview Tile",
    description: "Fixed-aspect media tile with label, badge, selection ring and states.",
    group: "Primitives",
  },
```

- [ ] **Step 2: Build the registry and verify the item appears**

Run: `pnpm --filter docs build:registry`
Expected: output includes `registry.json — 25 items` and a line `- Building preview-tile...`

- [ ] **Step 3: Verify the emitted JSON**

Run: `cat apps/docs/public/r/preview-tile.json | head -20`
Expected: `"name": "preview-tile"`, `"type": "registry:component"`, one file entry targeting `components/super-ai/preview-tile.tsx`, and no `dependencies` or `registryDependencies` beyond empty arrays.

- [ ] **Step 4: Commit**

```bash
git add apps/docs/lib/catalog.ts
git commit -m "feat(preview-tile): catalog entry and registry item"
```

---

### Task 7: Demo and docs page

**Files:**
- Create: `apps/docs/components/demos/preview-tile-demo.tsx`
- Modify: `apps/docs/app/components/[name]/page.tsx`

- [ ] **Step 1: Write the demo**

```tsx
"use client";
import { useState } from "react";

import { PreviewTile } from "@/registry/super-ai/preview-tile";

const PRESETS = [
  { id: "noir", label: "Neon noir", fill: "bg-primary" },
  { id: "pastel", label: "Pastel", fill: "bg-secondary" },
  { id: "mono", label: "Mono", fill: "bg-muted-foreground" },
];

export default function PreviewTileDemo() {
  const [selected, setSelected] = useState("noir");
  return (
    <div className="grid w-full max-w-md grid-cols-3 gap-3">
      {PRESETS.map((preset) => (
        <PreviewTile
          key={preset.id}
          label={preset.label}
          selected={selected === preset.id}
          onSelect={() => setSelected(preset.id)}
        >
          <div className={`h-full w-full ${preset.fill}`} />
        </PreviewTile>
      ))}
      <PreviewTile label="Loading" state="loading" />
      <PreviewTile label="Locked" state="locked" action={<span>Upgrade</span>}>
        <div className="bg-primary h-full w-full" />
      </PreviewTile>
      <PreviewTile label="Failed" state="failed" action={<span>Retry</span>} />
    </div>
  );
}
```

- [ ] **Step 2: Register the demo**

In `apps/docs/app/components/[name]/page.tsx`, add the import alongside the other super-ai demo imports:

```tsx
import PreviewTileDemo from "@/components/demos/preview-tile-demo";
```

and add to the `demos` map, after the `"gen-settings-bar"` line:

```tsx
  "preview-tile": PreviewTileDemo,
```

- [ ] **Step 3: Verify the page builds and renders**

Run: `pnpm --filter docs build`
Expected: build succeeds; route list shows `/components/[name]` with 25 prerendered paths.

- [ ] **Step 4: Commit**

```bash
git add apps/docs/components/demos/preview-tile-demo.tsx "apps/docs/app/components/[name]/page.tsx"
git commit -m "feat(preview-tile): docs demo and page wiring"
```

---

### Task 8: Storybook

Storybook keeps its own copies under `apps/storybook/src/components/super-ai/` — it aliases `@` to its own `src`, not to `apps/docs`. Both copies must be added.

**Files:**
- Create: `apps/storybook/src/components/super-ai/preview-tile.tsx`
- Create: `apps/storybook/src/components/super-ai/demos/preview-tile-demo.tsx`
- Create: `apps/storybook/src/stories/super-ai/PreviewTile.stories.tsx`

- [ ] **Step 1: Copy the component and demo**

```bash
cp apps/docs/registry/super-ai/preview-tile.tsx apps/storybook/src/components/super-ai/preview-tile.tsx
cp apps/docs/components/demos/preview-tile-demo.tsx apps/storybook/src/components/super-ai/demos/preview-tile-demo.tsx
```

- [ ] **Step 2: Fix the demo's import path for Storybook**

In `apps/storybook/src/components/super-ai/demos/preview-tile-demo.tsx`, change:

```tsx
import { PreviewTile } from "@/registry/super-ai/preview-tile";
```

to:

```tsx
import { PreviewTile } from "@/components/super-ai/preview-tile";
```

- [ ] **Step 3: Write the story**

```tsx
import type { Meta, StoryObj } from "@storybook/react-vite";

import PreviewTileDemo from "@/components/super-ai/demos/preview-tile-demo";

const meta: Meta<typeof PreviewTileDemo> = {
  title: "Super AI/Preview Tile",
  component: PreviewTileDemo,
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof PreviewTileDemo>;

export const Default: Story = {};
```

- [ ] **Step 4: Verify Storybook builds**

Run: `pnpm --filter storybook build`
Expected: `✓ built in …` with no unresolved-import errors.

- [ ] **Step 5: Commit**

```bash
git add apps/storybook/src/components/super-ai/preview-tile.tsx apps/storybook/src/components/super-ai/demos/preview-tile-demo.tsx apps/storybook/src/stories/super-ai/PreviewTile.stories.tsx
git commit -m "feat(preview-tile): storybook story"
```

---

### Task 9: Catalog corrections

The audit in the spec disproves the documented fan-out. Fix the source docs so the next component isn't built against the same error.

**Files:**
- Modify: `docs/design-system/concept-model.md`
- Modify: `docs/design-system/decisions.md`
- Modify: `docs/design-system/component-specs.md`

- [ ] **Step 1: Correct the fan-out table**

In `concept-model.md`, replace the `A8 preview-tile` row of the primitive fan-out table with:

```markdown
| **A8 preview-tile** | E4 preset-grid · H5 frame-strip · I1 tool-panel · F1 result-card · C4 recent-grid (· F2 generation-grid, transitively through F1) |
```

- [ ] **Step 2: Correct the prose beneath it**

Replace the sentence beginning "**`preview-tile` is the load-bearing one** — eleven consumers across six unrelated families." with:

```markdown
**`preview-tile` is the load-bearing one** — five direct consumers plus one transitive, across four
families. It remains the highest fan-out primitive in the catalog. An earlier draft listed eleven
consumers; six of those were disproved by their own entries in component-specs.md — see the audit in
[the preview-tile spec](../superpowers/specs/2026-08-02-preview-tile-design.md) §2 and D11.
```

- [ ] **Step 3: Add D11 and resolve Q5**

In `decisions.md`, after the D10 block, add:

```markdown
### D11 · `preview-tile` is one primitive — 2026-08-02

Resolves Q5. One primitive, not two.

Q5's content list — image, video, colour swatch, text excerpt, 3D model — is what made two primitives
look necessary. Two entries on it do not survive an audit of the actual consumers:

- **Text excerpt** came from J4 `artifact-grid`, which is not an A8 consumer. Its own spec makes the
  excerpt load-bearing and never mentions a thumbnail.
- **Audio** was already excluded in [gaps.md](gaps.md) §4: U3 `voice-picker` needs play/pause,
  exclusive playback and a shared audition sentence. That is a control, not a preview.

What remains is visual media at a fixed aspect ratio, which one component covers with an untyped
children slot that never branches on content type.

The audit also corrected the fan-out from eleven consumers to five direct plus one transitive. C3
declares A9, E2 is entity-row shaped, J4 is text-first, J6 is a dialog, and J3 `explore-gallery`
requires masonry — which contradicts A8's fixed frame outright. J3 and J4 each need their own
component. Full reasoning in
[the preview-tile spec](../superpowers/specs/2026-08-02-preview-tile-design.md) §2–3.
```

Then change the Q5 heading and append a resolution line:

```markdown
### Q5 · Is `preview-tile` one primitive or two? — RESOLVED
```

```markdown
**Resolved 2026-08-02 (D11):** one primitive. The content types that argued for a second belong to
components that are not consumers.
```

- [ ] **Step 4: Correct the A8 spec entry**

In `component-specs.md`, replace the A8 `**Evidence:**` line with:

```markdown
**Consumers:** E4 `preset-grid` · H5 `frame-strip` · I1 `tool-panel` · F1 `result-card` ·
C4 `recent-grid` (· F2 transitively through F1). Label placement is a variant: `overlay` for dense
grids (E4), `below` for title-under-thumbnail (C4), `none` for frame strips (H5). Audio previews are
out of scope — see gaps.md §4 and D11.
```

- [ ] **Step 5: Make F1 and C4 declare A8**

In `component-specs.md`, change F1 `result-card`'s base line from `**Base:** Card, Aspect-ratio · **States:** …` to:

```markdown
**Built on:** A8 · **Base:** Card · **States:** idle · streaming · done · failed · locked
```

and C4 `recent-grid`'s from `**Base:** Card, Aspect-ratio` to:

```markdown
**Built on:** A8 · **Base:** Card
```

- [ ] **Step 6: Note the two non-consumers**

Append a bullet to J3 `explore-gallery`:

```markdown
- Cannot be built on A8: masonry needs variable heights, and A8 exists to fix the frame. This
  component owns its own tile.
```

and to J4 `artifact-grid`:

```markdown
- Not an A8 consumer: this is a text card. The excerpt is the content, not a thumbnail.
```

- [ ] **Step 7: Commit**

```bash
git add docs/design-system/concept-model.md docs/design-system/decisions.md docs/design-system/component-specs.md
git commit -m "docs(design-system): D11 — correct A8 fan-out, resolve Q5"
```

---

### Task 10: Full gate

**Files:** none — verification only.

- [ ] **Step 1: Run the CI gate exactly as ci.yml does**

Run:

```bash
pnpm lint && pnpm typecheck && pnpm check:tokens && pnpm test && pnpm build:registry && pnpm build
```

Expected: all six pass. `pnpm test` reports 10 test files. If `pnpm lint` reports thousands of problems from `.vercel/output`, delete that directory first — it is local build output, not source.

- [ ] **Step 2: Playwright smoke**

Run:

```bash
pnpm --filter docs exec playwright test
```

Expected: PASS.

- [ ] **Step 3: Consumer install test**

Run: `apps/docs/scripts/consumer-test.sh`
Expected: completes without error, having installed every registry item including `preview-tile` into a scratch app.

- [ ] **Step 4: Push and open the PR**

```bash
git push -u origin claude/wave-1-preview-tile
gh pr create --base main --title "feat(preview-tile): A8 primitive — resolves Q5" --body "Implements docs/superpowers/specs/2026-08-02-preview-tile-design.md. Resolves Q5 as one primitive and corrects the A8 fan-out from eleven consumers to five direct plus one transitive."
```

---

## Self-Review

**Spec coverage:** §2 audit → Task 9. §3 Q5 → Task 9 Step 3. §4 API: aspect presets → Task 1; content opaque → Task 1; states → Task 5; ring selection → Task 2; labelPlacement → Task 3; interaction/a11y → Task 4. §5 testing: all six assertions covered across Tasks 1–5. §6 catalog corrections → Task 9. §7 non-goals → nothing to build; J3/J4 recorded in Task 9 Step 6.

**Type consistency:** `PreviewTileAspect`, `PreviewTileState`, `PreviewTileProps` defined in Task 1 and extended — never renamed — in Tasks 2–5. `data-slot` values (`preview-tile`, `preview-tile-frame`, `preview-tile-label`, `preview-tile-badge`, `preview-tile-loading`, `preview-tile-locked`, `preview-tile-failed`) are used consistently in tests and implementation.

**Known deviation from spec:** Task 5 changes `locked` from replacing content to retaining it, because the spec as written contradicts F1. The spec is corrected in the same task rather than left divergent.
