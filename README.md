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
Full catalog and roadmap: see the design spec below.

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

- Design spec: `docs/superpowers/specs/2026-06-10-super-ai-components-design.md`
- Flow Kit spec: `docs/superpowers/specs/2026-06-11-flow-kit-design.md` + `docs/flow-kit-inventory.md`
- Wave 0 plan: `docs/superpowers/plans/2026-06-11-wave-0-foundation.md`
