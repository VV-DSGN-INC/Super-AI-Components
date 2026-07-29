# Figma board map

Two boards. One is the input, one is the working artifact.

---

## Reference board — input

**[AI Component LIst](https://www.figma.com/design/PnRO0vJFr1q9Q6Mi6VY0lr/AI-Component-LIst)** ·
Figma design file · read-only for this work

Screenshots of real AI products, organised by app type and pattern type. See
[reference-board-analysis.md](reference-board-analysis.md) for what was extracted.

Notable node: the `Requirements` frame (`3017:23`) contains six tables defining 26 components with
their shadcn bases — the board author's own prior articulation of this catalog.

## Working board — output

**[AI-Components-Thinking](https://www.figma.com/board/6QSzRk2FCCfpfrYpo3SmjD/AI-Components-Thinking)** ·
FigJam · created by this work

Four columns, left to right.

### Column 1 · x ≈ 0 — Catalog wireframes

Fifteen sections, one per family, 110 compact tiles (320 × 240). Each tile carries the component ID,
name, a grey-box anatomy sketch, and a caption listing key states/variants plus the shadcn base.

A dark header sits above the column at y ≈ −420 with the totals and the tone legend.

| Section | Family | Items |
| ------- | ------ | ----- |
| A | Primitives (L2) | 12 |
| B | App shell & navigation | 8 |
| C | Home & launcher | 5 |
| D | Composer & context | 6 |
| E | Generation & parameters | 8 |
| F | Results & assets | 7 |
| G | Canvas & nodes | 9 |
| H | Timeline & transport | 5 |
| I | Editor surfaces | 5 |
| J | Library, filtering & discovery | 6 |
| K | Documents & knowledge | 6 |
| L | First-run & onboarding | 6 |
| M | Account, plan & monetization | 6 |
| N | Feedback, trust & observability | 6 |
| O | Blocks / layout archetypes | 14 |

### Column 2 · x = 1620 — Concept map

| Section | Contents |
| ------- | -------- |
| **CM1** Layer model | L0–L4 dependency stack, the promotion rule, why copy-and-own contains risk |
| **CM2** Primitive fan-out | Each L2 primitive and every L3 component consuming it, one row per primitive |
| **CM3** Asset lifecycle loop | COMPOSE → GENERATE → RESULT → LIBRARY with the return edge, EDIT branch, and the canvas note |
| **CM4** Cross-cutting contracts | Six contracts × fifteen families as a binding matrix |

### Column 3 · x = 3160 — Deep dives

Eight components at higher fidelity than the rest, each 700 px wide with real copy, every state, and
four numbered annotations. These duplicate components that also appear in column 4 — they are
longer-form versions, not different content.

| Section | Components |
| ------- | ---------- |
| **DW-a** | A8 preview-tile · C1 hero-omnibox |
| **DW-b** | D1 media-prompt-bar + D2 reference-strip · G2 ai-node |
| **DW-c** | F1 result-card · F3 asset-detail |
| **DW-d** | Paywall as a state (M5 · E7 · E5 · B5) · L1 empty-state + L2 coach-mark |

### Column 4 · x = 4800 — Full detail

Fifteen sections (`FULL A` … `FULL O`), **109 detailed cards** — one per component, two per row.

Each card carries:

- ID, name, layer and shadcn base
- A wireframe with real copy, showing every state side by side
- Three design annotations covering the API decisions that matter
- One evidence line naming the products it was derived from

O cards additionally list which components fill each region of the shell.

**109, not 110** — `useFlowRunner` is a headless hook with no UI to wireframe. It is documented in
the G section header and in [component-specs.md](component-specs.md).

Column height ≈ 35,500 px.

### Column 5 · x = 6500 — Missing components

Four sections, **32 cards**, colour-coded by confidence. See [gaps.md](gaps.md).

| Section | Fill | Contents |
| ------- | ---- | -------- |
| **MISSING R** — Recovered omissions · 7 | green | Errors in my consolidation, not gaps in the board. `env-status`, `run-controls`, and the audio family |
| **MISSING T** — Trust & control · 5 | amber | `permission-prompt`, `autonomy-selector`, `task-tray`, `safety-block`, `connection-manager` |
| **MISSING U1** — Unsampled · 8 | amber | Voice, extraction, vision |
| **MISSING U2** — Unsampled · 12 | amber | Data, search, coding, predictive |

Cards carry a status badge: green `RECOVERED` (restore these) or amber `PROPOSED · <TYPE>`
(unvalidated — sample before building). Proposed cards also have a 2px amber border so the
distinction survives at any zoom level.

Column height ≈ 10,650 px.

---

## Conventions used in the wireframes

| Tone | Hex | Meaning |
| ---- | --- | ------- |
| light | `#E9EBEE` | container / surface |
| medium | `#C9CED6` | content block |
| dark | `#98A0AB` | emphasis / label |
| accent | `#2F6FEB` | primary / active / selected |
| card | `#FFFFFF` + 1px `#D6DBE1` | a card or panel on a white background |

Status colours: green `#16A34A` done · amber `#EA8A0B` running/warning · red `#DC2626` failed ·
violet `#8B5CF6` tool call / text type.

Selection is always drawn as a **ring outside** the element, never as a border, so selecting never
reflows a grid.

## Reproducing or extending the board

The board was built with the Figma MCP `use_figma` tool. Key techniques worth reusing:

- **FigJam accepts design nodes.** `createFrame`, `createRectangle`, `createEllipse` and
  `createAutoLayout` all work in a `/board/` file, despite the docs implying FigJam is limited to
  stickies, connectors and shapes-with-text. Probe before assuming.
- **Derive layout from measured content.** The card builder draws the wireframe, walks
  `frame.children` to find the actual content bottom, then places annotations relative to it and
  resizes the frame. Hardcoding annotation positions caused three rounds of collisions before this
  was fixed.
- **White fills need a border.** A white-filled rectangle on a white card is invisible. Use a
  dedicated `card` element type with a 1px stroke.
