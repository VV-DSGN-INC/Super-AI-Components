# App shell taxonomy — conceptual teardown

**Date:** 2026-08-11 · Companion to [2026-08-11-product-style-token-research.md](2026-08-11-product-style-token-research.md) (same live-extraction session). Visual page: **https://style-teardown.vercel.app/shells** · source: [research/style-teardowns/2026-08-11-shell-taxonomy.html](2026-08-11-shell-taxonomy.html)

**What this is.** A classification of how the studied products structure the frame around their content — the app shell — so Pegbo can name, compare and test shell directions the same way we test color/finish directions.

## The two axes (independent)

- **Axis 1 — chrome layout**: where navigation and search live; whether content is a region, a sheet, or a column.
- **Axis 2 — surface depth**: **coplanar** (one plane; separation by 1px borders + bg tint) vs **layered** (tinted canvas + content lifted as sheets: radius + 1px ring + whisper shadow).

Independence proof: Asana = classic cockpit chrome **+** layered rounded content sheet; Monday = same chrome, fully coplanar. The split archetype exists on both sides too (Gmail coplanar vs Intercom layered).

## Layout archetypes

1. **Cockpit** — global top bar (search center) + sidebar beneath; page is subordinate; search global-first. *Monday, Asana.*
2. **Console** — sidebar only; content full-bleed, owns its header row. *OpenAI, Claude Console, Pipedrive, Evernote, ElevenLabs.*
3. **Framed page** — tinted canvas; content floats as one sheet (radius + ring); sidebar sits on the canvas. "Page on background." *Linear, Twenty, Manus-lite.*
4. **Framed split** — several sheets side by side, each lifted. *Intercom inbox; Twenty record view.*
5. **Rail + drawer** *(modifier, composes with any of the above)* — slim icon rail (~48–72px) + inner contextual sidebar. *Intercom, Asana, Monday; Slack/Discord.*
6. **Portal** — no sidebar; global header + horizontal tabs, centered max-width column. Scales badly past ~7 sections. *Vercel, GitHub, Basecamp.*
7. **Focus column** — sidebar + one centered reading column, composer anchored at bottom; the default AI-product shell. *ChatGPT, Claude.ai, Manus.*
8. **Master–detail coplanar** — three panes split by 1px borders; the mail-client shell. *Gmail, Superhuman, Evernote notes.*
9. **Canvas-centric** — infinite canvas, chrome as floating islands. *Figma, Miro.* (Not a Pegbo fit.)

## Matrix (layout × depth)

| | Coplanar | Layered |
|---|---|---|
| Cockpit | Monday | **Asana** |
| Console | OpenAI · Claude · Pipedrive · Evernote · ElevenLabs | — |
| Framed page | — | Linear · Twenty · Manus |
| Split | Gmail · Evernote notes | Intercom |
| Portal | GitHub · Vercel | — |
| Focus column | ChatGPT · Claude.ai · Manus | — |

Consoles are almost always coplanar (full-bleed content *is* the canvas); framed layouts are layered by definition. The free choices live in the cockpit and split rows.

## Secondary parameters (orthogonal; most of the personality)

- **Sidebar finish**: dark-branded chrome (Asana, Pipedrive `#211c52`, Intercom rail) · tinted paper (Evernote `#f6f5f4`, Linear `#efeff0`, Manus `#f8f8f7`) · coplanar white + border (OpenAI, Claude) · transparent on-canvas (Twenty). Dark ↔ enterprise/sales; tinted ↔ notes/maker tools.
- **Header ownership**: global bar owns title/search (Asana, Monday) vs content region owns it (everyone else) — why Asana reads "in between."
- **Record presentation**: side peek (Twenty, Notion) · centered sheet over dimmed shell (Linear issues, Intercom editor) · full-page nav (Pipedrive). Twenty exposes this as a user setting.
- **Nav paradigm**: palette-first (Linear, ⌘K as the real nav) vs pointer-first (Asana, Monday).

## Per-product classification

| Product | Layout | Depth | Rail | Sidebar | Header | Record opens as |
|---|---|---|---|---|---|---|
| OpenAI | Console | Coplanar | — | white+border | content | full page |
| Claude Console | Console | Coplanar | — | same-bg+border | content | full page |
| Pipedrive | Console | Coplanar | — | dark navy | content | full page |
| Evernote | Console / master–detail | Coplanar | — | tinted | content | split editor |
| Monday | Cockpit | Coplanar | yes | light | **global** | side peek |
| Asana | Cockpit | **Layered** | yes | dark chrome | **global** | side peek |
| Linear | Framed page | Layered | — | tinted on-canvas | content | centered sheet |
| Twenty | Framed page | Layered | slim | transparent | content | side peek (setting) |
| Intercom | Framed split | Layered | yes | dark rail | content | sheet overlay |
| ElevenLabs | Console | Coplanar | — | tinted #fafafa | content | full page |
| Manus | Focus column | Coplanar-soft | — | tinted | content | right rail |

(Asana classified from screenshots; all others DOM-measured.)

## Measured sheet recipes (framed archetype)

| Product | Canvas | Sheet | Radius | Lift |
|---|---|---|---|---|
| Linear | `#efeff0`/`#f9f9fa` | `#fff` | 12px | ring `lch(80.94)` + `0 3 6 -2 /2%` + `0 1 1 /4%` |
| Twenty | `#f1f1f1` | `#fff` | **16px** | ring `#ebebeb` + `-4 0 4 /0.8%` |
| Intercom | `#eff0eb` | `#fff` | 12–16px | ring `#e9eae6` + `0 1 4 /15%` |
| Intercom dark | `#080808` | `#1c2026` | 12–16px | ring `#373c43` + `0 1 4 /55%` |

Common recipe: canvas one tint-step below page color · sheet = card color · radius 12–16 · ring = border token · shadow ≤15% alpha. Linear sidebar: 244px.

## Mapping to our system

Theme axis = color; finish axis = Axis 2 (`elevated` ≈ layered, `flat-dense` ≈ coplanar); **shell = Axis 1**, a candidate `data-shell` attribute on the app frame with sidebar finish as a shell prop:

```css
[data-shell="frame"] {
  --shell-canvas: /* --surface-page, one tint step down */;
  --shell-sheet: var(--surface-card);
  --shell-sheet-radius: 13px; /* our radius scale */
  --shell-sheet-lift: 0 0 0 1px var(--border),
    0 3px 6px -2px rgb(0 0 0 / .02), 0 1px 1px rgb(0 0 0 / .04);
}
```

Pegbo candidates: **Console** (current prototype) · **Framed page** (Linear/Twenty test — wrapper-only change) · **rail + drawer** if workspaces multiply · **Focus column** for the AI tier. Portal and Canvas don't fit a data-heavy contractor tool.
