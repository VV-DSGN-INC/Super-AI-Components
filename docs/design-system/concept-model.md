# Concept model

How the components relate to each other. Four views: the layer model, the primitive fan-out, the
asset lifecycle loop, and the cross-cutting contracts.

Visualised on the working board as sections **CM1–CM4**.

---

## 1. Layer model

Each layer may depend downward only. This is what keeps 84 components from collapsing into 84
mutually-entangled files.

| Layer | Contents | Rule |
| ----- | -------- | ---- |
| **L4** Blocks · 14 | The layout archetypes (shells) | May compose anything |
| **L3** Components · 84 | Families B–N | **Never depend on each other** |
| **L2** Primitives · 12 | Family A | Shared DNA |
| **L1** AI Elements | conversation, message, prompt-input, reasoning, tool, sources, canvas/node/edge, suggestion, model-selector | Cross-registry dependencies. Composed, never copied |
| **L0** shadcn/ui | button, card, dialog, popover, select, slider, switch, table, tabs, sidebar, command, resizable, collapsible, empty, item, kbd, chart | `registryDependencies` |

### The promotion rule

If two L3 components need the same piece, that piece moves **up** to L2. It is never imported
sideways.

This rule is what produced primitives A8–A12. `preview-tile` was hiding inside `preset-grid`,
`result-card`, `frame-strip`, `artifact-grid`, `tool-panel` and six more.

### Why copy-and-own contains risk

shadcn copies source into the consumer app. Upstream AI Elements changes affect new installs only —
never a running app. This is what makes composing against a fast-moving upstream library safe.

---

## 2. Primitive fan-out

Which L3 components consume each L2 primitive. Row length is the argument for that primitive
existing.

| Primitive | Consumers |
| --------- | --------- |
| **A8 preview-tile** | E4 preset-grid · F1 result-card · F2 generation-grid · H5 frame-strip · J4 artifact-grid · I1 tool-panel · J6 template-detail · J3 explore-gallery · C4 recent-grid · E2 model-picker · C3 feature-card-row |
| **A9 entity-row** | D6 skill-menu · I4 ai-tools-menu · F4 action-stack · B3 sidebar-nav · K5 source-panel · C5 recommendation-card |
| **A6 field-row** | E3 parameter-panel · I2 property-inspector · G9 node-inspector · M1 settings-dialog · E1 generation-panel |
| **A2 cost-chip** | E5 run-button · F4 action-stack · M5 paywall-message · M2 credits-indicator · G6 model-bar |
| **A7 gen-settings-bar** | G6 model-bar · D1 media-prompt-bar · E1 generation-panel |
| **A10 stat-readout** | F3 asset-detail · N5 run-inspector · N6 usage-dashboard · G5 node-result |
| **A12 section-header** | I1 tool-panel · C3 feature-card-row · L4 whats-new · J2 filter-panel · J1 asset-library |
| **A3 date-section** | B6 thread-list · F2 generation-grid · J4 artifact-grid · J5 record-list |

**`preview-tile` is the load-bearing one** — eleven consumers across six unrelated families. It is
the first thing to prototype, because if its API does not hold across image / video / colour / text
content, eleven components inherit the problem.

---

## 3. The asset lifecycle loop

The spine of every creative AI app on the reference board. Components earn their place by sitting on
it.

```
COMPOSE (D) ──▶ GENERATE (E) ──▶ RESULT (F) ──▶ LIBRARY (J)
    ▲                                │                │
    │                                ▼                │
    │                             EDIT (H · I)        │
    └────────────────────────────────────────────────-┘
        saved assets become new prompt references
        (D2 reference-strip · D3 context-chips)
```

| Stage | Family | Components |
| ----- | ------ | ---------- |
| COMPOSE | D | media-prompt-bar · reference-strip · context-chips · mode-tabs |
| GENERATE | E | generation-panel · model-picker · parameter-panel · run-button |
| RESULT | F | result-card · generation-grid · asset-detail · action-stack |
| LIBRARY | J | asset-library · filter-panel · artifact-grid · explore-gallery |
| EDIT | H · I | context-toolbar · property-inspector · track-lane · transcript-editor |

### G — Canvas is the same loop, spatialised

An `ai-node` is COMPOSE + GENERATE + RESULT collapsed into one card: `node-prompt`, `model-bar`,
`run-button`, `node-result`. The edges between nodes are the loop drawn explicitly.

That is why Flow Kit needs almost no components of its own — **nine, not twenty-five**.

---

## 4. Cross-cutting contracts

Contracts are the second axis of the system. A component is not "done" until it satisfies every
contract that crosses its family. This is what makes 95 components feel like one library rather than
95 libraries.

| Contract | Definition | Binds families |
| -------- | ---------- | -------------- |
| **Token** | shadcn CSS variables only; no raw hex or arbitrary Tailwind colour values. Kit-scoped semantic tokens (the Flow Kit's `--flow-*` type and execution colours) defined once centrally with light and dark values. Enforced by `check:tokens`. | All (A–O) |
| **State** | `idle · queued · streaming · done · failed · locked` on every generation-aware component, with shared visuals: shimmer while streaming, inline failure card, CTA-replaced lock. | C D E F G K |
| **Cost** | Three forms of one number: chip (per action, A2), line (pre-commit, E5), ring (app level, M2). | B D E F G M |
| **Provenance** `NEW` | Prompt, model, seed, params and cost travel with every asset. Any surface showing an asset can render them via A10 stat-readout. | F G J K |
| **Empty** `NEW` | Every panel, list, grid and pane ships an empty state. | B C D F G I J K L N O |
| **Approval** | Artifact approval surfaces expose Confirm · Edit · Regenerate · Skip callbacks. | F K N |

### Where the two new contracts came from

**Empty** — NotebookLM ships three simultaneously-empty panes on first load. Empties are the default
view of an AI product, not an edge case. The approved spec has no first-run family at all.

**Provenance** — Midjourney, Playground and Freepik all attach seed, sampler, guidance, model and
prompt to the asset itself, so any surface showing that asset can render them. This is the
recipe-card pattern, and it is what makes a result reproducible.

### Where the Cost contract lands

The paywall is a state, not a page. It appears four ways:

| Placement | Component | Context |
| --------- | --------- | ------- |
| In-stream | M5 paywall-message | Inside a chat or result stream, carrying the prompt and model it would have used |
| Locked row | E7 member-gate-row | A settings row that stays visible with a tier badge |
| At the point of spend | E5 run-button | "Need 4 credits, you have 2" beside Generate |
| Ambient | B5 promo-card | Sidebar card — the only placement not tied to an action, and the only dismissible one |

This is why monetization cannot be deferred to a late wave. See [decisions.md](decisions.md).
