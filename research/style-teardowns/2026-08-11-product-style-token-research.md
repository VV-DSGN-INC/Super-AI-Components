# Product style & token research — deep extraction

**What this is.** A measured teardown of ten SaaS products' visual systems — color tokens, numeric tokens (radius, spacing, type, borders, shadows, control sizes), dark-mode value pairs, and token *naming* conventions — captured live from each product's running UI, not eyeballed from screenshots. Purpose: give Pegbo concrete, paste-able value sets (`[data-theme="try-*"]` blocks below, keyed to our `globals.css` semantic token names) to test overall visual directions against our own product, plus naming precedent for evolving `tokens.ts`.

**Companion artifacts:**
- **Public visual teardown** (swatches, spec cards, live mini-specimens, dark strips, naming table): https://style-teardown.vercel.app (Vercel static deploy, project `style-teardown`)
- Private Claude artifact (same page, versioned): https://claude.ai/code/artifact/2928e1f1-ef91-4b74-a721-0d6b4b0cad7a

**Date:** 2026-08-11 · **Method:** live computed-style extraction in Chrome (CSS custom properties where exposed, plus histograms of computed backgrounds, text colors, border-radius, font-size/line-height/weight, borders, shadows, and flex/grid gaps across ~300–500 visible elements per page; button/input probes). Follows up the earlier product-design comparison session.

Products: OpenAI Platform, Claude Console, Twenty CRM, Evernote Web, Monday.com (AI Notetaker), Pipedrive, Linear, Intercom, ElevenLabs, Manus.

Each profile ends with a **paste-able test theme** mapped to our Layer-2 semantic tokens (`globals.css` names), so a style can be test-driven with a `data-theme` block without touching components.

---

## 1 · OpenAI Platform — "quiet gray lab"

**Type.** OpenAI Sans (custom grotesque). Body 16/24 w400; UI rows 14/20 w400; page title 24/36 **w400** (large-but-light headings); micro-labels 12/12 w500. Semibold w600 used sparingly for emphasis.

**Color.** Neutral, cool-free pure grays:
- Canvas `#f3f3f3`, cards `#ffffff` / `#f9f9f9`, hairline fill `#ededed`
- Text ramp: `#0d0d0d` headings → `#282828` primary → `#414141` → `#5d5d5d` secondary → `#8f8f8f` muted
- Single accent: link blue `#004f99`. Selected nav = black **4% alpha** overlay. Occasional purple `#6b3ab4` badge.

**Numerics.**
- Radius: **10px buttons/inputs, 12px cards, 16px large cards**, 6–8px small controls, pills 9999
- Borders: 1px **black-alpha 10–16%** (not solid gray — alpha hairlines that work on any bg)
- Shadows: none (one 0 1 4 popover). Flat, border-separated
- Spacing: 4px base (`--spacing: .25rem`), gap histogram 4 > 8 > 12 > 16 > 24 > 40
- Buttons h32–36, pad-x 10–12

```css
[data-theme="try-openai"] {
  --surface-page: #f3f3f3;   --surface-card: #ffffff;
  --surface-secondary: #f9f9f9; --surface-hover: rgb(0 0 0 / 0.04);
  --text-primary: #282828;   --text-secondary: #5d5d5d;
  --text-tertiary: #8f8f8f;  --border: rgb(0 0 0 / 0.12);
  --border-hover: rgb(0 0 0 / 0.16); --accent: #004f99;
  /* radius: 8 / 10 / 12–16 · shadows: none · body 16px, UI 14px */
}
```

---

## 2 · Claude Console — "warm paper + serif accent"

**Type.** anthropicSans **14px base** body 14/21; anthropicSerif for the greeting h1 (22/28 w500) — a serif display accent over a sans UI. Variable optical weights (433/533/580). Big numbers 30/36 w580. 12/15 w500 labels, 13px in-between size used freely.

**Color.** Warm-tinted throughout (R ≥ G ≥ B everywhere):
- Canvas `#fcfcfb` (warm near-white), secondary `#f9f9f7`; hover/selected = black **5% alpha**
- Text: `#0b0b0b` → `#52514e` secondary → `#898781` muted → `#c3c2b7` faint
- Accents are **pastel object colors**, not UI chrome: blue `#6da7ec`, coral `#f09978`, sage `#bcd1ca`, cream `#f0eee6`; warning = `#f9dca4` bg + `#734500` brown text; info-selected `#cde2fb` + link `#184f95`
- Primary button: solid near-black `#0b0b0b` with white text

**Numerics.**
- Radius: **8px controls (dominant), 12px cards**, 7px/5px small, 9.6px (0.6rem) CTAs, 2px micro
- Borders: 1px black-10% and **0.5px hairlines** (`rgba(222,220,209,.3)`) — hairline aesthetic
- Shadows: zero. Flat; separation via bg tint + hairlines
- Gaps: 12 > 4 > 8 > 6 > 16. Buttons h32–36 pad-x 8; hero CTA h44 pad-x 20

```css
[data-theme="try-claude"] {
  --surface-page: #fcfcfb;   --surface-card: #fcfcfb;
  --surface-secondary: #f9f9f7; --surface-hover: rgb(11 11 11 / 0.05);
  --text-primary: #0b0b0b;   --text-secondary: #52514e;
  --text-tertiary: #898781;  --border: rgb(11 11 11 / 0.10);
  --accent: #0b0b0b;         /* primary action = ink */
  /* radius: 5 / 8 / 12 · serif display headings · body 14px */
}
```

---

## 3 · Twenty CRM — "13px mono-scale, floating panel"

**Type.** Inter **13px flat scale** — essentially one size for the whole app (274× w400, 66× w500, rare w600), 10–12px micro only. Emphasis is done with weight, never size.

**Color.** Pure neutral grays in display-p3:
- App frame `#f1f1f1`, floating content panel `#ffffff`
- Text: `#333` primary, `#666` secondary, `#999` muted (clean 0.2/0.4/0.6 steps)
- Chip pastels with same-hue dark text: mint `p3(0.76,0.91,0.88)`, periwinkle `(0.83,0.87,1)`, salmon `(0.98,0.81,0.81)`, peach `(1,0.82,0.58)`

**Numerics.**
- Signature move: white content panel floats on the gray frame with **16px radius + 1px #ebebeb ring** (as box-shadow) + faint 4px blur
- Radius: 16 panels / 8 controls / 4 small / 999 pills
- Borders: 1px `#ebebeb`, black-4% alpha; 1px pastel borders on chips
- Buttons: h24–28 (smallest of the set), pad ~4px; hover/selected = black-4%
- Gaps: 4 >> 2 > 8 > 12 — densest layout of the set

```css
[data-theme="try-twenty"] {
  --surface-page: #f1f1f1;   --surface-card: #ffffff;
  --surface-hover: rgb(0 0 0 / 0.04);
  --text-primary: #333333;   --text-secondary: #666666;
  --text-tertiary: #999999;  --border: #ebebeb;
  /* radius: 4 / 8 / 16 · base font 13px, one-size scale · h24 controls */
}
```

---

## 4 · Evernote Web — "warm paper + brand pill"

**Type.** Inter. Content 16/24; chrome runs at 13px (w400 rows, w600 section heads); buttons 14 w600; page title 22/28 w600.

**Color.** Warm paper grays (very close to Claude's family):
- Sidebar `#f6f5f4`, selected row `#e7e6e5`, content `#ffffff`
- Text: `#212121` → `#4e4d4c` secondary → `#696564` muted
- Brand green `#00a82d` **only on the primary pill button**; red `#e54e40`, purple `#a158eb`, blue `#4d64ff` as icon accents

**Numerics.**
- Radius: 6px nav rows, 8px inputs/cards, **48px full-pill primary CTA** (h40)
- Borders: sparse — 1px `#dad9d8` warm gray where needed; surfaces mostly separated by bg tint
- Shadows: one popover (0 4 8 + ring); flat otherwise
- Inputs h40 r8; nav rows h30; gaps 4 > 8 > 2 > 12 > 24

```css
[data-theme="try-evernote"] {
  --surface-page: #ffffff;   --surface-sidebar: #f6f5f4;
  --surface-hover: #e7e6e5;  --text-primary: #212121;
  --text-secondary: #4e4d4c; --text-tertiary: #696564;
  --border: #dad9d8;         --accent: #00a82d;
  /* radius: 6 / 8 / pill CTA · chrome 13px, content 16px */
}
```

---

## 5 · Monday.com Notetaker — "friendly blue enterprise"

**Type.** Figtree (rounded geometric — the friendliness carrier). Body 15/22.5 w400 (exact 1.5); 14/22 and 16/22 common; headings 24/30 + 18/24 w500; occasional w300 light CTAs.

**Color.** White-dominant + one hard-working brand blue:
- Canvas `#ffffff`, tint `#f6f7fb`; text `#323338` primary, `#676879` secondary (cool blue-grays)
- Brand blue `#0073ea` for primary buttons, links, selected tab underline; pale selection `#cce5ff`; green `#00c875`
- Search pill: gray-alpha `rgba(103,104,121,.1)`

**Numerics.**
- Radius: **4px dominant** (squarest of the set) on buttons/cards/chips; 8px cards; 100–240px marketing pills; search pill 100px
- Borders: 1px `#c3c6d4` / `#d0d4e4` — most visible borders of the set; inset 1px ring on inputs; blue 1px outline-button border
- Shadows: modest real shadows (0 4 6 dropdowns, 0 6 20 modals)
- Buttons h30–32 r4; gaps 4 > 8 > 16 > 24

```css
[data-theme="try-monday"] {
  --surface-page: #ffffff;   --surface-secondary: #f6f7fb;
  --surface-hover: rgb(103 104 121 / 0.10);
  --text-primary: #323338;   --text-secondary: #676879;
  --border: #c3c6d4;         --accent: #0073ea;
  /* radius: 4 / 4 / 8 · Figtree, body 15px · h30 controls */
}
```

---

## 6 · Pipedrive — "ink + weight-450 confidence"

**Type.** Inter at **weight 450** for all body text (14/21 w450 — no plain w400 anywhere). Emphasis w600 at 14, 12/16, and **10/16 uppercase micro-labels**. Display 25/38 w400. The half-step weight makes everything feel slightly denser/inkier without reading as bold.

**Color.**
- Body text **ink navy-black `#21232c`**, secondary `#65686f`; canvas white over `#f5f5f6`
- Link blue `#0d68c5` used heavily as interactive color; success green `#2d8647` for solid primary CTAs (+ text green `#077838`); red `#d83c38`
- Dark navy sidebar `#211c52` with purple selection `#6150e1`/`#6962f2` — the only dark-chrome product here
- Skeletons: ink-alpha 12%

**Numerics.**
- Radius: 6px buttons, 8px, 12px cards/list containers, 100px icon-pills, 50% avatars
- Borders: **one token: 1px `rgba(33,35,44,.14)`** (ink-alpha) used everywhere — most consistent border system of the set
- Shadows: every card carries `rgba(42,54,71,.05) 0 1 2`; layered popover/modal shadows. Most shadow-forward, still whisper-quiet
- Buttons **h40** (biggest); gaps 16 > 8 > 4 > 12 — most generous spacing

```css
[data-theme="try-pipedrive"] {
  --surface-page: #f5f5f6;   --surface-card: #ffffff;
  --surface-sidebar: #211c52;
  --text-primary: #21232c;   --text-secondary: #65686f;
  --border: rgb(33 35 44 / 0.14); --accent: #0d68c5;
  --elevation-card: 0 1px 2px rgb(42 54 71 / 0.05);
  /* radius: 6 / 8 / 12 · Inter wght 450 body · h40 controls, 16px gaps */
}
```

---

## 7 · Linear — "hue-282 precision"

**Type.** Inter Variable / SF Pro Display. Document content 16/24 w400; UI chrome 13px and 12px **w500** with `line-height: normal`; **15/24 w450** in list bodies (the half-step weight again); headings 19/28 w600. Exposed scale tokens: small 13px · regular 15px · large 18px.

**Color.** Everything is `lch()` at **hue 282** with chroma 0–1.25 — grays with a barely-perceptible cool blue-violet cast, tokenized four-deep in both directions (their real names):
- `--color-bg-primary` `lch(97.94)` ≈ `#f9f9fa` page · sidebar `#efeff0` · content panel white · quaternary `lch(94.44)`
- Text: primary `lch(9.79)` ≈ `#19191b` → secondary `lch(19.59)` ≈ `#2f3035` → tertiary `lch(39.18)` ≈ `#5c5d63` → quaternary `lch(64.64)` ≈ `#9b9ca4`
- Borders three-deep: `lch(95.24)` ≈ `#f0f0f1` → `lch(88.49)` ≈ `#dedee1` → `lch(84.44)`; plus **0.5px hairlines**

**Numerics.**
- Radius: **8px overwhelmingly dominant** (72 hits), 9999 pills for chips/labels (52), 10px buttons, 12px cards
- Shadows: signature layered whisper — `lch(0 0 0/.02) 0 3 6 -2 + lch(0 0 0/.04) 0 1 1`; cards get ring `lch(80.94) 0 0 0 1px` + that same pair; popovers 0 6 18
- Buttons **h28**, ghost, 12–13px
- Gaps: **6 > 8 > 2 > 4** — a 6px rhythm, not 4. Sidebar 244px

```css
[data-theme="try-linear"] {
  --surface-page: #f9f9fa;   --surface-card: #ffffff;
  --surface-sidebar: #efeff0; --surface-hover: rgb(25 25 27 / 0.04);
  --text-primary: #19191b;   --text-secondary: #5c5d63;
  --text-tertiary: #9b9ca4;  --border: #dedee1;
  --elevation-card: 0 0 0 1px #ced0d4, 0 3px 6px -2px rgb(0 0 0 / .02), 0 1px 1px rgb(0 0 0 / .04);
  /* radius: 4 / 8–10 / 12 · UI 13px w500 + 15px w450 · h28 controls, 6px gaps */
}
```

---

## 8 · Intercom — "olive canvas, pill everything"

**Type.** Inter. Body 14/20 w400; secondary rows 13/16; emphasis is **w600, used constantly** (button labels, section heads, list titles); headings 20/24 w600. No mid-weights — a hard 400/600 two-step.

**Color.**
- Canvas `#eff0eb` — an **olive/green-tinted warm gray**, the most distinctive canvas of the whole set; floating panels white / `#f8f8f7` / `#fbfbf9`
- Text `#1a1a1a`, secondary `#646462` (warm)
- Primary button near-black `#222222`; accent pastels for objects: peach `#ffccb2`, lavender `#e7e2fd`, blue `#9ec5fa`; alert red `#df2020`; purple `#b09efa` reserved for Fin/AI
- Panels separated by **ring `#e9eae6` 0 0 0 1px + `rgba(20,20,20,.15)` 0 1 4** — floating-panel-on-canvas, like Twenty but warmer

**Numerics.**
- Radius: 8px controls/rows, 12–16px panels, and **9999 pills for nearly every button** (h32, w600, pad-x 12; small h24)
- Borders: almost none — separation is ring + shadow + canvas tint
- Gaps: 4 > 8 > 16

```css
[data-theme="try-intercom"] {
  --surface-page: #eff0eb;   --surface-card: #ffffff;
  --surface-secondary: #f8f8f7; --surface-hover: rgb(26 26 26 / 0.05);
  --text-primary: #1a1a1a;   --text-secondary: #646462;
  --border: #e9eae6;         --accent: #222222;
  --elevation-card: 0 0 0 1px #e9eae6, 0 1px 4px rgb(20 20 20 / 0.15);
  /* radius: 8 / pill buttons / 12–16 panels · body 14px, w600 emphasis · h32 */
}
```

---

## 9 · ElevenLabs — "alpha-ink minimal"

**Type.** Inter. UI chrome is 13/20 **w500** (dominant), labels 12/16 w500, body 16/24 w400; stats 36.8/24 w600. Medium-weight-first like Linear.

**Color.** The purest take on alpha ramps: text primary `#0f0f10`, then secondary is **black at 53% alpha** and muted **44% alpha** — a tokenized `--gray-alpha-*` ramp, not gray hexes. White canvas, `#fafafa` sidebar, hover black 2–4%. Borders black/10% and 7.5%. Primary button solid near-black.

**Numerics.** Radius 10 buttons / 8 / 16 cards / 6 chips / 12 search / pills. Buttons h32–36. Gaps 8 > 4 > 6 > 16. Effectively zero shadows.

```css
[data-theme="try-elevenlabs"] {
  --surface-page: #ffffff;  --surface-sidebar: #fafafa;
  --surface-hover: rgb(0 0 0 / 0.04);
  --text-primary: #0f0f10;  --text-secondary: rgb(0 0 0 / 0.53);
  --text-tertiary: rgb(0 0 0 / 0.44); --border: rgb(0 0 0 / 0.10);
  --accent: #0f0f10;
  /* radius: 6 / 10 / 16 · UI 13px w500 · h32-36 controls */
}
```

## 10 · Manus — "system-native Notion ink"

**Type.** The only product on a **pure system font stack** (-apple-system → Segoe UI Variable). Body 16/24; UI 14/18 w500 and 13/18.

**Color.** Literally Notion's warm ink: text `#34322d`, overlays `rgba(55,53,47, .04–.08)` (Notion's exact base color), secondary `#5e5e5b`, muted `#858481`. White canvas, panels `#f8f8f7`, fill `#f0f0f0`, primary button `#1a1a19`, one sparse accent blue `#0081f2`. Borders nearly absent — 1px black/6%, hairline 0.5px black/14%.

**Numerics.** Radius 8 controls / 10 / 12 cards / 22 composer / pills. Buttons h28–36. Gaps 4 > 8 > 12.

```css
[data-theme="try-manus"] {
  --surface-page: #ffffff;  --surface-secondary: #f8f8f7;
  --surface-hover: rgb(55 53 47 / 0.06);
  --text-primary: #34322d;  --text-secondary: #5e5e5b;
  --text-tertiary: #858481; --border: rgb(0 0 0 / 0.06);
  --accent: #1a1a19;
  /* radius: 8 / 10 / 12 · system font stack · h32 controls */
}
```

---

## How they name their tokens

Extracted from each product's live CSS custom properties (or, where compiled away, from the semantic utility classes referencing them).

| Product | Namespace | Text color naming | Type scale naming | Spacing naming |
|---|---|---|---|---|
| OpenAI | none | `--color-text-{intent}-{style}[-{state}]` (primary-ghost-hover) | `--font-heading-{size}-{prop}` + `--font-text-{size}-{prop}` — separate heading/text families, each size exploded into size/line-height/weight/tracking | TW `--spacing` + component tokens (`--control-gutter`, `--input-gap`) |
| Claude Console | `--cds-` | `--cds-text-primary/secondary/muted/disabled` + intents (danger/success/warning/accent/pro) + domain (`git-added`…) | `--cds-font-*`, `--cds-leading-*` | `--cds-pad-xs/sm/md/lg` (t-shirt) |
| Twenty | `--t-` | `--t-font-color-primary/secondary/tertiary/light/extra-light/inverted/danger` | `--t-font-size-xxs…`, `--t-text-line-height-md/lg` | `--t-spacing-0…28` + `--t-spacing-multiplicator` (numbered × base) |
| Evernote | none | `--color-{component}-{element}-fill-{state}` — e.g. `color-input-inputtext-fill-active` | in component tokens | — |
| Monday (Vibe) | none | `--primary-text-color`, `--secondary-text-color`, `--text-color-on-primary/-on-inverted` | `--font-size-10…60` + `-h1…h5`, `--font-line-height-10…60`, weights incl. `very-light` | `--space-2…80` (**value-named px**) |
| Pipedrive | `--pd-` | compiled away (`--pd-color-primary-default/hover/extra-strong` survives) | — | — |
| Linear | none | `--color-text-primary…quaternary` (bg and border same rank pattern) | `--font-size-micro/microPlus/mini/miniPlus/small/smallPlus/regular/regularPlus/large/largePlus/title1-3`; fonts by role: `--font-regular/display/monospace/emoji` | none public (layout tokens like `--sidebar-width`) |
| Intercom | no vars — semantic Tailwind | `text-default`, `text-muted` | `text-sm/xs/h1` utilities | stock TW + named `module` step (`gap-module`, `rounded-module`); `shadow-lvl-0` |
| ElevenLabs | none | `--gray-alpha-{step}` ramp; status `--{normal/success/info/warning/error}-{text/bg}[-hover]` | `--font-waldenburg` (brand face) | TW `--spacing`; `--radius-xs/sm/default/md` |
| Manus | none | `--text-primary/secondary/tertiary/onblack`, `--icon-primary/secondary` | — | none — raw px literals (`gap-[4px]`) |

**Takeaways:**

1. **Rank naming won.** `primary / secondary / tertiary (/ quaternary)` is the majority convention for text colors (Linear, Twenty, Manus, Claude, Monday-ish) — exactly our `--text-primary/secondary/tertiary` scheme. Tail ranks get words (`muted`, `disabled`, `light`, `extra-light`) rather than numbers.
2. **Two philosophies on states.** OpenAI and Evernote encode style+state *into token names* (`…-soft-alpha-hover`), producing 1,000–1,900 tokens. Linear, Manus, Claude Console keep names small (≤ a few hundred) and resolve states elsewhere — the camp our "interaction states are recipes, not tokens" rule belongs to.
3. **Namespacing splits evenly.** `--cds-` / `--t-` / `--pd-` prefix vs bare names. Namespaces buy collision safety with embedded/3rd-party CSS; bare reads cleaner. (We're bare, inside our own app — fine.)
4. **Spacing has three schools**: numbered-steps-×-base (Twenty's `0…28` with a multiplicator; Tailwind's `--spacing`), **value-named** (Monday's `--space-8` = 8px — readable but locks the value into the name), and t-shirt (`--cds-pad-md`). Linear and Manus ship none at all.
5. **Status vocabulary is unsettled**: `positive/negative` (Monday), `success/danger` (Twenty, Claude), `error/warning` (ElevenLabs), `info` (OpenAI). Our `tone=neutral|info|warning|positive` is closest to Monday+OpenAI hybrid.
6. **Most elegant type naming: Linear** — font families named by *role* (`--font-regular/display/monospace`), sizes as a word-scale with codified half-steps (`small` / `smallPlus`). OpenAI's per-property explosion (`--font-text-md-line-height`) is the Figma-friendly extreme; Monday's numeric `10…60` is the most mechanical.
7. **Component tokens appear at every maturity level** — from Manus's lone `--Button-black` to Evernote's 1,900-token component matrix. The middle ground (a handful: `--control-height-*`, like ours) is where OpenAI sits too (`--control-gutter`).

---

## Cross-product comparison

| | OpenAI | Claude | Twenty | Evernote | Monday | Pipedrive | Linear | Intercom | ElevenLabs | Manus |
|---|---|---|---|---|---|---|---|---|---|---|
| Font | OpenAI Sans | anthropicSans + Serif | Inter | Inter | Figtree | Inter **450** | Inter Var (450/500) | Inter | Inter | **system stack** |
| Base size | 16 (UI 14) | **14** | **13** | 16 (UI 13) | 15 | 14 | 13–15 (UI 13) | 14 | 16 (UI 13 w500) | 16 (UI 14) |
| Gray temp | neutral | **warm** | neutral | **warm** | cool | ink-navy | cool (lch h282) | **olive-warm** | neutral | **warm (Notion ink)** |
| Page bg | #f3f3f3 | #fcfcfb | #f1f1f1 | #fff/#f6f5f4 | #fff | #f5f5f6 | #f9f9fa | #eff0eb | #fff/#fafafa | #fff/#f8f8f7 |
| Text 1° | #282828 | #0b0b0b | #333 | #212121 | #323338 | #21232c | #19191b | #1a1a1a | #0f0f10 | #34322d |
| Text 2° | #5d5d5d | #52514e | #666 | #4e4d4c | #676879 | #65686f | #5c5d63 | #646462 | **black/53%** | #5e5e5b |
| Border | black/12% | black/10% + 0.5px | #ebebeb | #dad9d8 | #c3c6d4 | ink/14% | #dedee1 + 0.5px | ring #e9eae6 | black/10% | black/6% |
| Control radius | 10 | 8 | 8 | 6–8 | **4** | 6 | 8–10 + pills | **pill** | 10 | 8–10 |
| Card radius | 12–16 | 12 | **16** | 8 | 8 | 12 | 12 | 12–16 | 16 | 12 |
| Shadows | none | none | panel ring | ~none | modest | subtle, everywhere | layered 2–4% | panel ring + 15% | none | ~none |
| Button h | 32–36 | 32–36 | **24–28** | 30–40 | 30–32 | **40** | **28** | 32 | 32–36 | 28–36 |
| Gap mode | 4 | 12 | 4 | 4 | 4 | **16** | **6** | 4 | 8 | 4 |
| Accent strategy | 1 link blue | ink btn + pastels | chip pastels | 1 brand green | 1 brand blue | green CTA + blue links | per-object hues | ink btn + pastels | ink btn only | ink btn + 1 blue |

## Dark-mode pass

Measured by flipping each product into its own dark theme (DOM token toggle where the app defines dark values in CSS, the product's real settings toggle otherwise; every setting was restored afterward). Claude Console ships **no user-facing dark mode**; Evernote/Monday/Pipedrive were skipped this round.

### OpenAI dark
Canvas `#131313` · cards `#303030` / `#212121` / `#181818` · text `#dcdcdc` → `#afafaf` → `#8f8f8f` (the muted gray is **identical in both modes**) · borders `white / 12%` — the exact mirror of light's `black / 12%` · link brightens `#004f99` → `#339cff`.

```css
[data-theme="try-openai"].dark, .dark [data-theme="try-openai"] {
  --surface-page: #131313; --surface-card: #212121; --surface-secondary: #303030;
  --text-primary: #dcdcdc; --text-secondary: #afafaf; --text-tertiary: #8f8f8f;
  --border: rgb(255 255 255 / 0.12); --accent: #339cff;
}
```

### Twenty dark
Frame `#1d1d1d` · content panel `#1b1b1b` — **the panel goes darker than the frame**, inverting the light-mode relationship · sidebar `#171717` · raised `#222222` · hover white 3–6% · text `#ebebeb` → `#b3b3b3` → `#818181` · borders `#222222` · selection blue `#4662d6`.

### Linear dark
Full token mirror, hue shifted **282 → 272**: bg `lch(5.52)` ≈ `#101012` → `7.32` → `8.22` → `9.35`; text `white` → `lch(90.45)` ≈ `#e2e3e6` → `lch(61.8)` ≈ `#95969c` → `lch(36.98)`; borders `lch(9.84 / 14.16 / 16.32)` ≈ `#1b1c1f / #26272b / #2c2d31` with chroma raised to 1.48. Light text ramp L-values (9.8/19.6/39.2/64.6) are almost exactly mirrored in dark (100/90.5/61.8/37).

### Intercom dark
The boldest flip: warm olive canvas becomes **near-black `#080808`**, and panels become **cool blue-gray `#1c2026`** (raised `#2b2f35`, ring `#373c43`) — temperature is re-decided per mode, not inherited. Text `#fafafa` / `#c9c6c5` (secondary stays warm). Shadow alpha jumps 15% → 55%. Pastels deepen to muted versions: peach → `#683d27`, lavender → `#342e4d`, blue → `#3d5f8f`.

### Dark patterns

1. **Alpha borders self-mirror.** OpenAI's `black/12%` becomes `white/12%` with zero extra tokens — the payoff of pattern #1 above. Solid-gray border systems (Twenty, Linear) need a full second border ramp.
2. **Raised surfaces go lighter than canvas in dark** (Linear, Intercom, OpenAI cards) — except Twenty, which keeps its panel *darker* than the frame in both directions of the inversion.
3. **Muted text converges** across all products to ≈`#818181`–`#9b9ca4` — mid-gray is mode-independent (OpenAI literally reuses the same value).
4. **Shadow opacity multiplies ~3×** in dark (Intercom 15%→55%) or shadows stay absent — nobody keeps light-mode shadow values.
5. **Temperature is a per-mode decision.** Intercom flips warm→cool; Linear shifts hue 282→272. Matches how our `.dark` blocks re-state values rather than derive them.

## Patterns worth stealing

1. **Alpha borders beat solid grays.** OpenAI (black/12%), Claude (black/10%), Pipedrive (ink/14%) all define borders as text-color-alpha — one token self-adapts to every surface tint and to dark mode. Twenty/Evernote/Monday use solid grays and need per-surface variants.
2. **Hover/selected is an alpha overlay, not a token color** — black 4–5% at OpenAI, Claude, Twenty. Matches our "recipes, not tokens" rule.
3. **Nobody uses real elevation on light UI.** Four of six ship effectively zero shadows; Pipedrive's card shadow is 5% alpha. Separation = bg tint + hairline.
4. **One accent doing real work.** Every product has exactly one interactive color; extra colors are demoted to chips/pastel data colors (Claude's model cards, Twenty's tags).
5. **Warm gray = "paper/notes" products (Claude, Evernote); cool/neutral gray = "tool" products.** Temperature is doing brand work, matching our pegbo-warm vs pegbo-emerald axis.
6. **Weight replaces size at small scales.** Twenty (13px everywhere, w500 emphasis), Pipedrive (w450 base) and Linear (13px w500 chrome, 15px w450 lists) prove a 2-size UI scale works if weight carries hierarchy. The **half-step weight 450** appears independently at Pipedrive and Linear — it reads denser without reading bold.
7. **Radius encodes density**: Monday 4px enterprise-square → Pipedrive/Evernote 6 → Claude/Twenty/Linear 8 → OpenAI 10 casual → Intercom pill. Card radius ≈ control radius + 4 (or ×1.5) in every product — same relationship as our 7/13/19 scale.
8. **The floating-panel frame** (Twenty, Intercom, Linear-lite): tinted canvas + white content panels lifted by a 1px ring and whisper shadow, 12–16px panel radius. It replaces both borders and elevation as the primary structure device.
9. **Tinted canvas as brand**: Intercom's olive `#eff0eb` and Linear's hue-282 lch grays show the gray itself carrying identity — chroma so low it never registers as "color," only as temperature.
