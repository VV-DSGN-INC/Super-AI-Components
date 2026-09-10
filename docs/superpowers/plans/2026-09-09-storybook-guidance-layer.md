# Storybook guidance layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the Storybook a reader-facing guidance layer, four sections and 31 MDX pages (Guides, Foundations, Content, Patterns), each drawn live from this repo's own registry, shadcn ports and AI Elements ports, and each citing the contract documents under `docs/design-system/` instead of restating them.

**Architecture:** MDX pages under `apps/storybook/src/stories/{guides,foundations,content,patterns}/`, found by the existing `../src/**/*.mdx` glob. Two shared helpers, `Example` and `DoDont`, in `apps/storybook/src/stories/_shared/doc-blocks.tsx`, plus a `TokenTable` for the Design Tokens page. A `ThemedDocsContainer` in `.storybook/preview.tsx` mirrors the `theme` global onto docs-only pages, which no story decorator reaches. Sidebar order is pinned in `storySort`. Nothing under `apps/docs`, `packages/` or the registry changes. Pages are not stories, so the a11y gate (`test:stories`) and `check:contract` are untouched; the pages must build (`pnpm build` runs `storybook build`), typecheck (the two TSX helpers), lint and pass `format:check`.

**Tech Stack:** Storybook 9.1.20, `@storybook/addon-docs/blocks` (`Meta`, `Unstyled`, `DocsContainer`), `storybook/theming`, Tailwind 4.3 with the `@source` globs already in `src/index.css`, prettier 3.8 (gated).

**Spec:** none. The decision record is the 2026-09-09 session: the sibling kit (a private reference repo, referred to only that way) carries this layer and this repo did not. The sibling's pages are the _skeletons_ for these; every claim is re-measured here.

## Global Constraints

- **Cite, never restate.** `CLAUDE.md` forbids a second copy of any contract. A page links to `docs/design-system/<file>.md` (as a relative repo path in backticks, since Storybook cannot serve the markdown) and carries only the reader-facing consequence with a live example. Where the sibling page taught a rule this repo enforces through a record, name the rule id from `packages/ds-rules/rules/*.json` (`TOK-4`, `CHT-1`, `MOT-2`, ...) and say `check:tokens` enforces it.
- **Truth rule.** Every count, name, class and behaviour is verified in this worktree on the day it is written and dated (`measured 2026-09-09`). The sibling's numbers never survive the port. Registry sources live in `apps/docs/registry/super-ai/` (116 items) and `apps/docs/registry/marketing/` (15); shadcn ports in `apps/storybook/src/components/ui/` (60); AI Elements ports in `apps/storybook/src/components/ai-elements/` (23); demos in `apps/docs/components/demos/` (131, importable as `@/components/demos/<name>-demo`).
- **Do not paste contracts into subagent prompts** (`docs/CONTINUE.md` §3.4). Point at the file.
- **Imports.** `@/components/ui/<name>` (shadcn), `@/components/ai-elements/<name>`, `@/registry/super-ai/<name>`, `@/components/demos/<name>-demo`, `@/components/marketing/<name>`, `lucide-react`. Never a relative path into `apps/docs`.
- **Tokens.** shadcn CSS variables only: `bg-background`, `bg-card`, `bg-popover`, `bg-muted`, `bg-accent`, `bg-secondary`, `bg-primary`, `bg-destructive`, `text-foreground`, `text-muted-foreground`, `text-primary-foreground`, `border-border`, `border-input`, `ring-ring`, `rounded-lg`, the sidebar and chart sets. **Never `text-muted-foreground` on `bg-muted`, `bg-accent` or `bg-secondary`** (4.34:1, `docs/design-system/a11y-baseline.md`); never `text-destructive` on a `bg-destructive/NN` tint. No hex, no `oklch()`, no palette classes, no gradients, no emoji.
- **Example helpers.** `Example` frames every live example; `DoDont` takes both captions and changes one variable between its sides. Examples render the real components, or a demo from `apps/docs/components/demos/`, and say so in a caption when a demo stands in.
- **MDX traps.** No pipe tables in MDX (the docs addon has no GFM plugin here; write a bullet mapping). Text inside a JSX child stays on its tag's line or in a `span`. No bare `<`, `>`, `{` or `}` in prose; write the word. Apostrophes in JSX attribute strings use `&apos;`.
- **Page skeleton.** `<Meta title="Section/Name" />`, H1, one paragraph, `##` headings that each make a claim, Foundations and Content pages end with `## Rules`; Pattern pages follow definition, `## Use it when`, `## The <thing>, live`, a decision section, `## Key decisions`, `## Rules`, `## Content notes`.
- **Writing.** No em dashes anywhere; use a comma, a colon or a new sentence. No "not X, it's Y" parallelism, no forced groups of three, no marketing register (`CPY-2`), no exclamation marks, no vocabulary from the anti-slop list (seamless, robust, delve, elevate, journey, tapestry, landscape). Demo content is something this system could emit (`docs/design-system/story-conventions.md` Rules): prompts, filenames, model names; no invented companies or metrics. `docs/design-system/decisions.md` D22: strings are English.
- **Names.** Neither the words `pegbo` nor `design-system-rebuild` nor the sibling kit's package name appear anywhere; say "a sibling kit" or "the reference repo".
- **Formatting.** Run `pnpm exec prettier --write <the files you wrote>` from the repo root before reporting. Never `pnpm format` on the whole tree.
- **Repo identity.** Remote is `VV-DSGN-INC/Super-AI-Components`; branch `claude/storybook-guidance-layer`; never `main`. Commit author `weeeha` with the noreply address.
- **Definition of done:** from the repo root, `pnpm lint && pnpm format:check && pnpm typecheck && pnpm build` green (that runs `storybook build`); every page opened in `storybook dev` in light and dark with an empty console; a screenshot per section for the PR.

---

## File structure

- Create: `apps/storybook/src/stories/_shared/doc-blocks.tsx` (Example, DoDont)
- Create: `apps/storybook/src/stories/_shared/token-table.tsx` (live swatches for Design Tokens)
- Modify: `apps/storybook/.storybook/preview.tsx` (ThemedDocsContainer, storySort)
- Modify: `apps/storybook/src/stories/Overview.mdx` (one paragraph naming the four sections)
- Create: `apps/storybook/src/stories/guides/{getting-started,contributing,documentation-guidelines,component-lifecycle,browser-support}.mdx`
- Create: `apps/storybook/src/stories/foundations/{principles,design-tokens,color,typography,layout-spacing,states,motion,iconography,icon-creation,inclusive-design,navigation,app-structure,data-visualization,theming}.mdx`
- Create: `apps/storybook/src/stories/content/{voice-principles,writing-mechanics,error-messages,empty-states,inclusive-writing}.mdx`
- Create: `apps/storybook/src/stories/patterns/{resource-index,resource-details,forms-wizards,actions-confirmation,status-feedback,loading-states,ai-conversation}.mdx`

Source skeletons (read, never copied): the sibling kit's `src/docs/<section>/<page>.mdx` at `/Users/nickv/ClaudeCode Projects/Minimal Design System/.claude/worktrees/film-planner-wiki-app-5b2a99/src/docs/`. Its `Foundations/Rules`, `Style axes`, `Icons` and `Mobile viewport` entries are not ported: the first is a rules catalogue this repo keeps in `packages/ds-rules`, the other three are story folders bound to that kit.

---

### Task 0: Scaffold

**Files:**

- Create: `apps/storybook/src/stories/_shared/doc-blocks.tsx`
- Create: `apps/storybook/src/stories/_shared/token-table.tsx`
- Modify: `apps/storybook/.storybook/preview.tsx`
- Modify: `apps/storybook/src/stories/Overview.mdx`

**Interfaces:**

- Produces: `Example({ className, ...divProps })`, `DoDont({ doExample, doCaption, dontExample, dontCaption })`, `TokenTable({ tokens: string[] })` which renders each `--token` name with a light and a dark swatch read from the cascade.

- [ ] **Step 1: doc-blocks.tsx**

```tsx
import * as React from "react";
import { Unstyled } from "@storybook/addon-docs/blocks";

import { cn } from "@/lib/utils";

type ExampleProps = React.ComponentProps<"div">;

/** Frame for every live example on a docs page. MDX-inline JSX bypasses the
 *  preview decorator that frames stories, so without this the example sits on
 *  the docs page's own background and breaks in dark mode. `Unstyled` opts
 *  out of the docs typography so the kit's styles apply. */
function Example({ className, ...props }: ExampleProps) {
  return (
    <Unstyled>
      <div
        data-slot="doc-example"
        className={cn(
          "bg-background text-foreground border-border my-4 rounded-xl border p-6 font-sans",
          className,
        )}
        {...props}
      />
    </Unstyled>
  );
}

type DoDontProps = React.ComponentProps<"div"> & {
  doExample: React.ReactNode;
  doCaption: string;
  dontExample: React.ReactNode;
  dontCaption: string;
};

/** Side-by-side Do and Don't. Both captions are required: a pair without a
 *  stated reason is decoration. Borders are `primary` and `destructive`, the
 *  same pair `apps/docs/components/component-docs.tsx` uses for guidance. */
function DoDont({ doExample, doCaption, dontExample, dontCaption, className, ...props }: DoDontProps) {
  return (
    <Unstyled>
      <div
        data-slot="doc-do-dont"
        className={cn("my-4 grid gap-4 font-sans sm:grid-cols-2", className)}
        {...props}
      >
        <figure className="m-0">
          <div className="bg-background text-foreground border-primary/40 overflow-x-auto rounded-xl border-2 p-6">
            {doExample}
          </div>
          <figcaption className="text-foreground mt-2 text-sm">
            <span className="font-semibold">Do</span>{" "}
            <span className="text-muted-foreground">{doCaption}</span>
          </figcaption>
        </figure>
        <figure className="m-0">
          <div className="bg-background text-foreground border-destructive/40 overflow-x-auto rounded-xl border-2 p-6">
            {dontExample}
          </div>
          <figcaption className="text-foreground mt-2 text-sm">
            <span className="font-semibold">Don&apos;t</span>{" "}
            <span className="text-muted-foreground">{dontCaption}</span>
          </figcaption>
        </figure>
      </div>
    </Unstyled>
  );
}

export { Example, DoDont };
export type { ExampleProps, DoDontProps };
```

- [ ] **Step 2: token-table.tsx**

```tsx
import * as React from "react";
import { Unstyled } from "@storybook/addon-docs/blocks";

/** One row per CSS variable, with the light and dark values read from the
 *  cascade rather than restated: the stylesheet stays the only copy. The dark
 *  swatch sits inside a `.dark` scope so `.dark { --x }` resolves without
 *  flipping the page. */
function Swatch({ token, dark }: { token: string; dark?: boolean }) {
  return (
    <span className={dark ? "dark bg-background inline-block rounded-md p-1" : "inline-block p-1"}>
      <span
        className="border-border block size-8 rounded-md border"
        style={{ background: `var(${token})` }}
      />
    </span>
  );
}

function TokenTable({ tokens }: { tokens: string[] }) {
  return (
    <Unstyled>
      <ul className="my-4 grid gap-2 font-sans sm:grid-cols-2">
        {tokens.map((token) => (
          <li key={token} className="border-border flex items-center gap-3 rounded-lg border px-3 py-2">
            <Swatch token={token} />
            <Swatch token={token} dark />
            <code className="text-muted-foreground text-xs">{token}</code>
          </li>
        ))}
      </ul>
    </Unstyled>
  );
}

export { TokenTable };
```

- [ ] **Step 3: preview.tsx**

Add above `const preview`:

```tsx
import { DocsContainer } from "@storybook/addon-docs/blocks";
import { themes } from "storybook/theming";

/** Docs-only MDX pages have no story decorators, so the `theme` global never
 *  reaches them. This container mirrors it: `.dark` on <html> for the tokens,
 *  Storybook's dark docs theme for the page chrome. It reads the boot-time
 *  globals from the channel's replay and follows toolbar changes after. */
function ThemedDocsContainer(props: React.ComponentProps<typeof DocsContainer>) {
  const { channel } = props.context;
  const [dark, setDark] = React.useState(() => {
    const last = channel.last("globalsUpdated") as [{ globals?: { theme?: string } }] | undefined;
    return last?.[0]?.globals?.theme === "dark";
  });
  React.useEffect(() => {
    const onUpdate = ({ globals }: { globals?: { theme?: string } }) => {
      if (globals && "theme" in globals) setDark(globals.theme === "dark");
    };
    channel.on("globalsUpdated", onUpdate);
    return () => channel.off("globalsUpdated", onUpdate);
  }, [channel]);
  React.useLayoutEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);
  return <DocsContainer {...props} theme={dark ? themes.dark : themes.light} />;
}
```

Add `docs: { container: ThemedDocsContainer },` to `parameters`, and change `storySort.order` to:

```ts
order: [
  "Overview",
  "Guides",
  ["Getting Started", "Contributing", "Documentation Guidelines", "Component Lifecycle", "Browser Support"],
  "Foundations",
  [
    "Principles", "Design Tokens", "Color", "Typography", "Layout & spacing", "States", "Motion",
    "Iconography", "Icon creation", "Inclusive design", "Navigation", "App structure",
    "Data Visualization", "Theming",
  ],
  "Content",
  ["Voice & principles", "Writing mechanics", "Error messages", "Empty states", "Inclusive writing"],
  "Patterns",
  ["Resource index", "Resource details", "Forms & wizards", "Actions & confirmation", "Status & feedback", "Loading states", "AI conversation"],
  "Super AI",
  "AI Elements",
  "shadcn",
  ["ui"],
  "Marketing",
  ["Layout", "Text", "Buttons", "Effects"],
],
```

Keep the existing comment about `"shadcn"` matching one title segment.

- [ ] **Step 4: Overview.mdx.** After the first paragraph add one paragraph: the sidebar now opens with four guidance sections (Guides, Foundations, Content, Patterns) that draw their examples from the three component layers below them and cite `docs/design-system/` for the contracts.

- [ ] **Step 5: Verify.** `pnpm --filter storybook typecheck && pnpm --filter storybook lint`, then `pnpm exec prettier --write apps/storybook/src/stories/_shared apps/storybook/.storybook/preview.tsx apps/storybook/src/stories/Overview.mdx` and `pnpm exec prettier --check` on the same. Start `pnpm --filter storybook dev` and confirm Overview renders, and that the Theme toggle darkens a docs page.

- [ ] **Step 6: Commit.**

```bash
git add apps/storybook/src/stories/_shared apps/storybook/.storybook/preview.tsx apps/storybook/src/stories/Overview.mdx docs/superpowers/plans/2026-09-09-storybook-guidance-layer.md
git commit -m "feat(storybook): docs helpers, themed docs container, and the four guidance sections in sidebar order"
```

---

## The page brief, applied by every page task below

For each page the executor:

1. Reads the sibling skeleton at the path given, for structure and the kind of claim each section makes.
2. Reads this repo's sources named under **Measure here** and takes every number, name and class from them.
3. Writes the page at the target path with the page skeleton above, keeping the sibling's headings only where the claim still holds here, and replacing any heading about that kit's machinery (three-tier tokens, ramps, Layer 1/2/3, Figma mirror, liveness gate, capability contract, `check:stories`, both-themes runner) with the claim this repo actually makes.
4. Cites `docs/design-system/<file>.md` or a rule id for every rule, and links neighbouring pages as **Section → Page** in bold.
5. Runs `pnpm exec prettier --write <file>` and reports: the headings, every measured number with its source line, and any claim it could not verify (left out, not guessed).

Each task below is one commit: `docs(storybook): <section> pages, <names>`.

### Task 1: Guides

**Files:** `apps/storybook/src/stories/guides/getting-started.mdx`, `contributing.mdx`, `documentation-guidelines.mdx`, `component-lifecycle.mdx`, `browser-support.mdx`. Titles `Guides/Getting Started`, `Guides/Contributing`, `Guides/Documentation Guidelines`, `Guides/Component Lifecycle`, `Guides/Browser Support`.

**Skeletons:** sibling `src/docs/guides/*.mdx`.

**Measure here:** `README.md` (install line, develop block), `CLAUDE.md` (commands, CI order, identity), `.github/workflows/ci.yml` (the twelve steps, in order), `docs/CONTINUE.md` §3 (how a component gets built) and §4 titles only, `docs/design-system/component-build-brief.md` §Guidance, `apps/docs/lib/component-docs.ts` (the `ComponentDocs` fields), `docs/design-system/story-conventions.md` (the eight case stories, `case-skip` grammar), `apps/docs/lib/catalog.manifest.ts` (status values; count of `shipped`), `docs/design-system/decisions.md` D19, D20, D22, `apps/storybook/src/index.css` (self-hosted Geist, `@source` globs), `apps/storybook/vitest.config.ts` (Chromium, reduced motion), `apps/docs/next.config.ts` and any `browserslist` field for the support floor.

- Getting Started: install one item with `npx shadcn@latest add https://super-ai-components.vercel.app/r/<name>.json`, what lands in the consumer (`components/super-ai/`, `components/marketing/`, keyframes and `--marketing-*` variables), running `pnpm dev` and `pnpm --filter storybook dev` on port 6007, where a component's guidance renders (the docs site route `/components/<name>` and the story's docs tab share one renderer, `apps/storybook/src/lib/component-docs-page.tsx`).
- Contributing: branch discipline (never `main`, worktree per agent, `pnpm` only), the pipeline (manifest → scaffold `pnpm new:component` → build → integrate → gates), the gate list in `ci.yml` order, what a red `consumer-test.sh` means.
- Documentation Guidelines: the two documentation surfaces (per-component `<name>.docs.tsx` with its required fields and the citation gate in `check:contract`; these MDX pages and their conventions from the Global Constraints), the server/client boundary trap, the citation gate (`apps/docs/scripts/check-citations.mts`).
- Component Lifecycle: `building` → `shipped` in the manifest, the story-state contract (`check:contract`), the eight case stories and the `story-coverage` baseline that only shrinks, D20 (no exemptions remain), what is enforced mechanically and what is not.
- Browser Support: what the gates run in (Chromium via Playwright, reduced motion emulated), container queries as the default (D19), self-hosted fonts, and an honest line that no browserslist is declared if that is what the sources show.

### Task 2: Foundations, the token half

**Files:** `foundations/principles.mdx`, `design-tokens.mdx`, `color.mdx`, `typography.mdx`, `layout-spacing.mdx`. Titles `Foundations/Principles`, `Foundations/Design Tokens`, `Foundations/Color`, `Foundations/Typography`, `Foundations/Layout & spacing`.

**Skeletons:** sibling `src/docs/foundations/{principles,color,typography,layout-spacing}.mdx`; the sibling's Design Tokens is a story that renders from a mirror file, so this page is written from `src/index.css` directly.

**Measure here:** `docs/superpowers/specs/2026-06-10-super-ai-components-design.md` §6 (consistency approach, layer model, contracts), `docs/design-system/concept-model.md` §1 and §4, `docs/design-system/decisions.md` D1, D3, D19, `apps/storybook/src/index.css` (every `:root` and `.dark` variable, the `@theme inline` radius scale from `--radius: 0.625rem`, the font stacks), `packages/ds-rules/rules/core.json` and `local.json` (rule ids and titles), `docs/design-system/a11y-baseline.md` §The rule and §Gate hole (`--warning` undefined), `docs/design-system/component-build-brief.md` §Tokens, and greps over `apps/docs/registry/super-ai/*.tsx` for: `text-(xs|sm|base|lg|xl)` counts, `font-(medium|semibold|bold)` counts, `rounded-(sm|md|lg|xl|2xl|full)` counts, `gap-|p-|px-|py-` most common values, `@container|@md:|@sm:` for container queries.

- Principles: the repo's own, numbered like the sibling's: the registry is the product; primitives + contracts + automated checks; three unrelated products before registry status (D1); compose before you build, promote to L2 (D3); every super-ai story is an accessibility test; guidance is part of the component; a gate list mirrors `ci.yml`; exclusion lists only shrink; container queries by default (D19); English strings (D22).
- Design Tokens: `TokenTable` for the surface set, the foreground set, the primary/secondary/accent/destructive set, the border/input/ring set, the chart set (note: the five chart tokens are neutral greys in this theme, measured), the sidebar set; the radius scale; the two font stacks and why "Geist Variable" leads; the token rules `TOK-1` to `TOK-8` as one bullet each with the rule title, enforced by `check:tokens` over registry sources; the `--warning` gate hole.
- Color: surfaces (`bg-background`, `bg-card`, `bg-popover`, `bg-muted`, `bg-accent`, `bg-secondary`) and that four of them share one lightness in this theme; text has two tiers here (`text-foreground`, `text-muted-foreground`), not three; the 4.34:1 pairing and its rules `TOK-4`, `TOK-5`, `TOK-6`; the destructive tint rule; `COL-1` no gradients; `COL-6` violet only as chart-4; marketing palettes live in `--marketing-*` custom properties; live `DoDont` for the muted pairing.
- Typography: Geist Variable and Geist Mono self-hosted; the scale the registry actually uses (counts); weight steps; `Kbd` as the mono use case.
- Layout & spacing: the radius scale derived from one `--radius`; the spacing values the registry uses most; container queries (D19) with a live example from a registry component that declares `@container`; `LAY-1` (review) on arbitrary pixel values.

### Task 3: Foundations, the behaviour half

**Files:** `foundations/states.mdx`, `motion.mdx`, `iconography.mdx`, `icon-creation.mdx`, `inclusive-design.mdx`. Titles `Foundations/States`, `Foundations/Motion`, `Foundations/Iconography`, `Foundations/Icon creation`, `Foundations/Inclusive design`.

**Skeletons:** sibling `src/docs/foundations/{states,motion,iconography,icon-creation,inclusive-design}.mdx` (the last two were written 2026-09-09; read the current file).

**Measure here:** the design spec §6 state contract (`idle | queued | streaming | done | failed | locked`), `apps/docs/registry/super-ai/{run-button,generation-queue,preview-tile,result-card,media-prompt-bar}.tsx` for how those states paint, `apps/storybook/src/lib/focus-ring.ts` (`settledFocusRing`), rules `STA-3`, `MOT-1`, `MOT-2`, `ICO-1`, `ICO-2`, `TOK-8`, greps over registry sources for `transition-`, `duration-`, `animate-`, `motion-reduce:`, `prefers-reduced-motion`, `data-state=`, `aria-busy`, `disabled:`, `focus-visible:`; `apps/storybook/src/components/ai-elements/{loader,shimmer}.tsx`; `lucide-react` version in `apps/storybook/package.json` and its default attributes in `node_modules/lucide-react/dist/cjs/lucide-react.js` (`viewBox`, `strokeWidth`, `strokeLinecap`, `strokeLinejoin`); grep registry and `ai-elements` for `<svg` to count hand-drawn glyphs; `docs/design-system/a11y-baseline.md` §What the gate enforces, §Recurring failure, §Excluded; `apps/storybook/vitest.config.ts` exclusions; `docs/design-system/story-conventions.md` the eight (`RTL`, `ReducedMotion`, `KeyboardOrder`, `Mobile`).

- States: the six-state contract with a live `run-button` or `generation-queue` demo per state where a demo exists; disabled and locked are different states (locked replaces the CTA); focus is `focus-visible` with the ring set, `STA-3`; selected vs focused.
- Motion: what the registry actually does (transitions on named properties `MOT-2`, no loops outside progress `MOT-1`, shimmer and loader as the two progress loops, reduced-motion branches in the marketing components, the test runner emulating reduced motion); `DoDont` skeleton vs spinner from `preview-tile`'s loading state.
- Iconography: `ICO-1` lucide only, `ICO-2` no emoji, the size rungs measured from registry `size-*` on `svg`, icon-only controls need a name (cite the a11y baseline's accessible-name findings), placement.
- Icon creation: lucide's constraints from the installed package, the count of hand-drawn `<svg>` in this repo's own sources, when a custom glyph is allowed (data or motion a static glyph cannot draw), the test before it ships (three sizes, two themes, a name).
- Inclusive design: the gate (axe on super-ai and marketing stories, Chromium, both a11y and interaction), the exclusion list that only shrinks, the recurring contrast failure and its rules, `KeyboardOrder`/`RTL`/`Mobile` case stories, the Base UI focus-guard exclusion, `TOK-8` foreground composites.

### Task 4: Foundations, the structure half

**Files:** `foundations/navigation.mdx`, `app-structure.mdx`, `data-visualization.mdx`, `theming.mdx`. Titles `Foundations/Navigation`, `Foundations/App structure`, `Foundations/Data Visualization`, `Foundations/Theming`.

**Skeletons:** sibling `src/docs/foundations/{navigation,app-structure,data-visualization,theming}.mdx` (navigation and app-structure written 2026-09-09; read the current file).

**Measure here:** registry `app-sidebar.tsx`, `app-topbar.tsx`, `sidebar-nav.tsx`, `mode-tabs.tsx`, `detail-tabs.tsx`, `modality-rail.tsx`, `workspace-switcher.tsx`, and the demos for each; `docs/design-system/block-specs.md` (the 14 archetypes O1 to O14, O5 cut) and `catalog.md` §B and §O; the block registry files `home-shell.tsx`, `chat-shell.tsx`, `studio-shell.tsx`, `library-shell.tsx`, `settings-shell.tsx`, `auth-shell.tsx` and their demos; `apps/storybook/src/components/ui/{breadcrumb,tabs,pagination,sidebar}.tsx`; `apps/storybook/src/components/ui/chart.tsx`, registry `usage-dashboard.tsx`, `stat-readout.tsx`, `quota-meter.tsx`, `credits-indicator.tsx`, `trace-timeline.tsx`; rules `CHT-1`, `CHT-3`; `src/index.css` chart values; `apps/docs/app/layout.tsx` and `apps/docs/components/*theme*` for how the docs site switches theme (`next-themes`), `src/index.css` `.dark`, `--marketing-*` in `apps/storybook/src/marketing.css`, and the spec §6 note that kit-scoped tokens are defined centrally.

- Navigation: structure picks the component, with this repo's own: `app-sidebar` + `sidebar-nav` for the top level, `app-topbar` for the page row, `mode-tabs` and `detail-tabs` for sibling views, `modality-rail` for tool families, `workspace-switcher` for the tenant; shadcn `breadcrumb` and `pagination` where the registry has no equivalent; one current-place rule; what folds at 375px (the `Mobile` case story is the evidence).
- App structure: the fourteen shells as the decision, one live demo of `chat-shell` and one of `home-shell` (or the two whose demos render in a docs column), the rule for choosing a shell by app type (`catalog.md` §O), and that O5 is cut.
- Data Visualization: which registry components chart (list them), the neutral chart palette this theme ships (measured values) and what that means for emphasis, `CHT-1` and `CHT-3`, one live `usage-dashboard` or `stat-readout` demo, the four-state box rule.
- Theming: one axis, the `.dark` class, how the docs site and Storybook each set it, a rebrand is overriding `:root` and `.dark` variables in the consumer's stylesheet, `--marketing-*` as the second tier, what a theme may not do (the contrast pairs), the `--warning` hole.

### Task 5: Content

**Files:** `content/voice-principles.mdx`, `writing-mechanics.mdx`, `error-messages.mdx`, `empty-states.mdx`, `inclusive-writing.mdx`. Titles `Content/Voice & principles`, `Content/Writing mechanics`, `Content/Error messages`, `Content/Empty states`, `Content/Inclusive writing`.

**Skeletons:** sibling `src/docs/content/*.mdx`.

**Measure here:** rules `CPY-1`, `CPY-2`; `docs/design-system/anti-slop.md` §2.5 Copy; `docs/design-system/component-build-brief.md` §Guidance (consumer-facing voice); D22; the strings the registry actually ships: grep `apps/docs/registry/super-ai/*.tsx` for default labels (`aria-label=`, `label = "`, `placeholder=`, `"Try again"`, `"Retry"`, `"Generate"`), ellipsis characters (`…` vs `...`), sentence vs title case in button labels; registry `empty-state.tsx`, `safety-block.tsx`, `rate-limit-banner.tsx`, `paywall-message.tsx`, `permission-prompt.tsx`, `disclaimer-note.tsx`, `feedback.tsx` and their demos; the design spec §4 "Failure is a first-class state, rendered inline where the result would have been, never only a toast"; `docs/design-system/block-build-brief.md` for the `Empty` story blocks must export; `preview-tile.tsx` and `result-card.tsx` for alt text handling.

- Voice & principles: front-load, verbs, say the number, no cheerleading (`CPY-2`), errors and empties work harder, which voice by situation, all with this repo's strings as the examples.
- Writing mechanics: case, punctuation, numbers, truncation, the words already settled (measured from the registry's default labels).
- Error messages: the failed-state contract (inline, where the result would have been), the formula, which surface (`safety-block`, `rate-limit-banner`, `paywall-message`, `permission-prompt`, a field error), live demos.
- Empty states: nothing yet, nothing matched, nothing loaded, with `empty-state` and the blocks' `Empty` stories as evidence.
- Inclusive writing: any person no pronoun, device verbs, names and alt text (`preview-tile`, `result-card`), words that travel (D22 English strings, and what that implies for a consumer localising).

### Task 6: Patterns, index to confirmation

**Files:** `patterns/resource-index.mdx`, `resource-details.mdx`, `forms-wizards.mdx`, `actions-confirmation.mdx`. Titles `Patterns/Resource index`, `Patterns/Resource details`, `Patterns/Forms & wizards`, `Patterns/Actions & confirmation`.

**Skeletons:** sibling `src/docs/patterns/{resource-index,resource-details,forms-wizards,actions-confirmation}.mdx`.

**Measure here:** registry `library-shell.tsx`, `asset-library.tsx`, `record-list.tsx`, `table-view.tsx`, `kanban-view.tsx`, `feed-view.tsx`, `filter-bar.tsx`, `filter-panel.tsx`, `date-section.tsx`, `thread-list.tsx`, `records-shell.tsx`, `use-view-mode.tsx`; `detail-view-shell.tsx`, `detail-fields.tsx`, `detail-tabs.tsx`, `asset-detail.tsx`, `template-detail.tsx`; `generation-wizard.tsx`, `onboarding-wizard.tsx`, `field-row.tsx`, `parameter-panel.tsx`, `settings-dialog.tsx`, `gen-settings-bar.tsx`; `approval-card.tsx`, `trust-dialog.tsx`, `permission-prompt.tsx`, `action-stack.tsx`, `run-button.tsx`, `selection-toolbar.tsx`, `cost.tsx`, `cost-chip.tsx`; the spec §4 "Cost confirmation precedes commit" and "The four verbs of artifact approval"; `docs/design-system/concept-model.md` §4 contracts (Dialog, Cost, Approval); the demos for each.

- Resource index: cards, rows or a table with this repo's three views and `use-view-mode`; filter bar vs filter panel; date as the grouper; paging or scrolling as the registry does it.
- Resource details: `detail-view-shell` anatomy, fields vs tabs, the related rail if one exists.
- Forms & wizards: page, dialog or steps (`settings-dialog`, `generation-wizard`, `onboarding-wizard`), `field-row` as the row primitive, parameters speak human (spec §4).
- Actions & confirmation: the approval contract's four verbs, cost confirmation before commit, when a dialog interrupts (`trust-dialog`, `permission-prompt`), `action-stack` chaining.

### Task 7: Patterns, feedback to conversation

**Files:** `patterns/status-feedback.mdx`, `loading-states.mdx`, `ai-conversation.mdx`. Titles `Patterns/Status & feedback`, `Patterns/Loading states`, `Patterns/AI conversation`.

**Skeletons:** sibling `src/docs/patterns/{status-feedback,loading-states,ai-conversation}.mdx` (loading-states written 2026-09-09; read the current file).

**Measure here:** registry `env-status.tsx`, `rate-limit-banner.tsx`, `feedback.tsx`, `generation-queue.tsx`, `render-queue.tsx`, `task-tray.tsx`, `disclaimer-note.tsx`, `quota-meter.tsx`, `credits-indicator.tsx`; the state contract (`queued`, `streaming`) in `run-button.tsx`, `preview-tile.tsx`, `result-card.tsx`, `media-prompt-bar.tsx`; `apps/storybook/src/components/ui/{skeleton,spinner,progress,sonner}.tsx`; `ai-elements/{loader,shimmer,conversation,message,prompt-input,reasoning,tool,sources,suggestion}.tsx`; registry `chat-shell.tsx`, `context-chips.tsx`, `quote-reply.tsx`, `suggestion-chips.tsx`, `answer-block.tsx`, `citation-ref.tsx`, `source-cards.tsx`, `model-picker.tsx`, `autonomy-selector.tsx`; the demos for each.

- Status & feedback: a fact or an event, mapped onto this repo's surfaces (`env-status`, `quota-meter`, `rate-limit-banner`, toast via `sonner`, `feedback`), live.
- Loading states: the wait is drawn where the result lands; `queued` and `streaming` from the contract; skeleton, spinner, shimmer, loader, and the queues; hold the frame; one indicator per wait; the three exits (data, `empty-state`, failed inline).
- AI conversation: `chat-shell` composing AI Elements `Conversation`, `Message`, `PromptInput` with the registry's `context-chips`, `quote-reply`, `suggestion-chips`, `answer-block`, `citation-ref`, `model-picker`; when the model asks (`approval-card`, `permission-prompt`); the composer as a context-assembly surface (spec §4).

### Task 8: Definition of done

- [ ] From the repo root: `pnpm lint && pnpm format:check && pnpm typecheck`.
- [ ] `pnpm --filter storybook build` (what `pnpm build` runs for this workspace); fix every MDX compile error at its file and line.
- [ ] `pnpm --filter storybook dev`, open every one of the 31 pages plus Overview in light and dark; the console shows no React nesting warnings and no failed imports; one screenshot per section.
- [ ] Sweep: `grep -rn "—" apps/storybook/src/stories/{guides,foundations,content,patterns}` returns nothing; `grep -rniE "pegbo|design-system-rebuild|@weeeha|text-text-|bg-surface-|--ink-|--base-|ramp" apps/storybook/src/stories/{guides,foundations,content,patterns} apps/storybook/src/stories/_shared` returns nothing; `grep -rn "^|" ... ` returns nothing (no pipe tables).
- [ ] Push `claude/storybook-guidance-layer` to `VV-DSGN-INC/Super-AI-Components` and open the PR against `main`. The PR body names the plan, lists the pages, states that the prose is a generated draft awaiting a hand pass, and lists any claim a page could not verify.
