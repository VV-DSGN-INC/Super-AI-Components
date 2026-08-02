# Super-AI-Components

The missing half of [AI Elements](https://elements.ai-sdk.dev): a shadcn registry of components
for AI applications — app shells, creative studios, flow canvases, feedback loops, observability,
and monetization UI. AI Elements gives you the conversation; this gives you the application.

## Install (any shadcn app)

```bash
npx shadcn@latest add https://super-ai-components.vercel.app/r/thread-list.json
```

Wave 0 ships 7 primitives (`kbd`, `cost-chip`, `date-section`, `choice-chips`, `filter-bar`,
`field-row`, `gen-settings-bar`) and 2 pilot components (`shortcuts-sheet`, `thread-list`).
Full catalog and roadmap: `docs/design-system/` (see below).

**Marketing wave 1** adds a second registry namespace — 15 landing-page mini-components
(`bento-grid`, `marquee`, `terminal`, `hero-video-dialog`, `number-ticker`, `text-animate`,
`typing-animation`, `aurora-text`, `rainbow-button`, `ripple-button`, `pulsating-button`,
`border-beam`, `orbiting-circles`, `dot-pattern`, `confetti`) rebuilt to the same standards:
shadcn CSS variables for chrome, tunable `--marketing-*` custom properties for signature
palettes, `prefers-reduced-motion` honored by every animated component, and one test file each.
They install the same way (`/r/<name>.json`) and land in `components/marketing/`, with their
keyframes and palette variables shipped into the consumer's stylesheet by the registry.

## Develop

```bash
pnpm install
pnpm dev              # docs site = component workbench (apps/docs)
pnpm test             # vitest behavior tests
pnpm check:tokens     # token-contract lint (shadcn CSS variables only)
pnpm build:registry   # emit public/r/*.json
pnpm build            # build the docs site
apps/docs/scripts/consumer-test.sh   # install everything into a fresh app
```

- **Catalog and roadmap (authoritative):** `docs/design-system/` — 99-item catalog, concept model,
  per-component specs, decisions and open questions, derived from a reference board of real AI
  products. Approved 2026-08-02 (D10); supersedes §5 and §11 of the design spec.
- Design spec: `docs/superpowers/specs/2026-06-10-super-ai-components-design.md` — current except
  §5 and §11, which are retained there as superseded records.
- Flow Kit spec: `docs/superpowers/specs/2026-06-11-flow-kit-design.md` + `docs/flow-kit-inventory.md`
  — **cut from scope 2026-07-31** (D9); retained as a record.
- Wave 0 plan: `docs/superpowers/plans/2026-06-11-wave-0-foundation.md`
- Marketing wave 1: `docs/superpowers/specs/2026-07-31-marketing-mini-components-design.md` +
  `docs/superpowers/plans/2026-07-31-marketing-mini-components-wave-1.md`
