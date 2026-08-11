# Product style extraction — raw notes (2026-08-11)

## 1. OpenAI Platform (platform.openai.com/home)

- **Font**: "OpenAI Sans", helvetica, sans-serif. Body 16px/24px w400. UI rows 14px/20px w400. Page title 24px/36px w400 (light-weight large heading). Micro-labels 12px/12px w500. Semibold accents 14px/20px w600.
- **Body bg**: rgb(243,243,243) (page canvas is light gray #f3f3f3); sidebar/canvas split — content cards on rgb(255,255,255) / rgb(249,249,249) #f9f9f9.
- **Gray text ramp**: #282828 (primary, rgb 40), #0d0d0d (headings, rgb 13), #414141 (65), #5d5d5d (93 secondary), #8f8f8f (143 muted).
- **Link/accent blue**: rgb(0,79,153) #004f99. Purple badge text rgb(107,58,180).
- **Selected nav item**: black-alpha oklab ~4% overlay; badge fill pink/magenta 15% alpha.
- **Radii in use**: 10px (buttons, search), 12px (cards), 16px (large cards), 6px (small icons btns), 8px (project switcher), 9999/50% pills+avatars. Tailwind v4 default radius vars present (--radius-sm .375rem, md .5rem, lg .625rem, xl .75rem, 2xl 1rem).
- **Borders**: 1px black-alpha 12% (oklab 0.159 / 0.12) dominant; also 10%, 16% variants and #ededed. Hairline-alpha border system, not solid gray.
- **Shadows**: nearly none — one rgba(0,0,0,0.2) 0 1 4 -1. Flat, border-driven UI.
- **Buttons**: h32-36, pad 0 10-12px, radius 8-10px, mostly ghost/transparent with #282828 text; search input-like button white bg + 16% alpha border.
- **Gaps**: 4px (dominant), 8, 12, 2, 16, 24, 40. Base-4 rhythm.
- **--spacing: .25rem** (Tailwind v4 4px base).

## 2. Claude Platform / Console (platform.claude.com/dashboard)

- **Fonts**: anthropicSans (body, 14px base!), anthropicSerif for page greeting h1 22px/28px w500 (serif display accent). Variable weights (w433, w533, w580 — optical variable font).
- **Body bg**: rgb(252,252,251) — warm near-white #fcfcfb. Cards on same bg or rgb(249,249,247). Hover/selected: black 5% alpha overlay (srgb 0.043 / 0.05).
- **Text ramp (warm grays)**: #0b0b0b primary, rgb(82,81,78) secondary #52514e, rgb(137,135,129) muted #898781, rgb(195,194,183) faint. Warm-tinted grays (R≥G≥B).
- **Accent/status colors**: model-card pastels — blue rgb(109,167,236), coral rgb(240,153,120), sage rgb(188,209,202), cream rgb(240,238,230); warning banner rgb(249,220,164) bg + brown text rgb(115,69,0); info-selected bg rgb(205,226,251) + link blue rgb(24,79,149).
- **Type scale**: 14/21 w400 body (dominant), 14/20, 12/15 w500 labels, 20/20 headings, 30/36 w580 big numbers, 22/28 serif greeting, 13px between-size also used.
- **Radii**: 8px dominant (buttons, inputs), 12px cards, 7px, 5px small, 2px, 9.6px (0.6rem CTA), 24px rare. Tighter, more mixed than OpenAI.
- **Borders**: 1px black 10% alpha; hairline 0.5px borders (0.5px rgba(222,220,209,0.3), 0.5px black 10%) — hairline border aesthetic.
- **Shadows**: effectively none (all-zero placeholders). Flat, border+bg-tint driven.
- **Buttons**: h32-36, pad 0 8px, radius 8px; primary "Build an agent" = black bg (rgb(11,11,11)) white text; big CTA 44px h, 9.6px radius, pad 0 20px. Ghost buttons everywhere.
- **Gaps**: 12 (dominant), 4, 8, 6, 16, 10. Base-2/4 rhythm, denser than OpenAI.

## 3. Twenty CRM (q.twenty.com)

- **Font**: Inter, 13px base (!), line-height "normal" (no explicit lh). Weights: 400 body, 500 emphasis (66 uses), 600 rare. Micro text 10-12px. Single-size system: everything is 13px.
- **Colors (display-p3)**: page frame bg p3 0.945 ≈ #f1f1f1; content panel white; text 0.2 ≈ #333 primary, 0.4 ≈ #666 secondary, 0.6 ≈ #999 muted. Neutral pure-gray ramp (no tint).
- **Structure**: gray app frame + floating white content panel with **16px radius** and a 1px ring shadow (color p3 0.922 = #ebebeb 0 0 0 1px + faint 4px blur). Very distinctive "card app in a frame" look.
- **Radii**: 16px main panels, 8px controls, 999px pills, 4px small, 32px rare.
- **Borders**: 1px #ebebeb (p3 0.922), 1px black 4% alpha; colored 1px pastel borders on tag chips (mint 0.682/0.864/0.825, periwinkle, salmon, orange).
- **Chip/tag pastels**: mint bg p3(0.761,0.914,0.878), periwinkle (0.831,0.87,1), salmon (0.984,0.812,0.811), peach (1,0.821,0.583), green (0.858,0.941,0.893) — with darker same-hue text (e.g. deep green 0.142,0.229,0.194).
- **Buttons**: tiny — 24-28px height, 13px/400, pad 4px, ghost. Selected = black 4% overlay.
- **Gaps**: 4px dominant, 2px, 8, 12. The densest of the set.
- **Shadows**: none except the panel ring. Flat.

## 4. Evernote Web (evernote.com/client/web)

- **Font**: Inter. Body 16px/24; UI lists 13px (w400 rows, w600 headings), 14px w600 buttons. Page title 22px/28 w600.
- **Colors**: warm paper grays — sidebar rgb(246,245,244) #f6f5f4, selected row rgb(231,230,229) #e7e6e5, white content. Text: rgb(33,33,33) primary #212121, rgb(78,77,76) secondary, rgb(105,101,100) muted — warm-tinted like Claude.
- **Brand**: Evernote green rgb(0,168,45) primary button (h40, radius 48px full-pill, white text 14/600); red accent rgb(229,78,64); purple rgb(161,88,235) and blue rgb(77,100,255) accents in icons.
- **Radii**: 6px list rows/nav items, 8px inputs/cards, 48px pill buttons, 24px, 50% avatars. Pill primary CTA + small radii elsewhere.
- **Borders**: 1px rgb(218,217,216) #dad9d8 solid warm-gray; 1px black-20% rare. Few borders overall — surfaces separated by bg tint.
- **Shadow**: one popover shadow rgba(16,0,0,0.08) 0 4 8 -2 + 1px ring. Otherwise flat.
- **Inputs**: h40, radius 8px, transparent bg on gray field wrapper, pad 12px left.
- **Gaps**: 4, 8, 2, 12, 24. Nav rows h30.

## 5. Monday.com — AI Notetaker view (pegbo-group.monday.com)

- **Font**: Figtree (rounded geometric sans). Body 15px/22.5 w400 (1.5 ratio); 14px/22, 16px/22 also common; headings 24/30 w500, 18/24 w500; light w300 on some CTAs.
- **Colors**: white-dominant. Text rgb(50,51,56) #323338 primary, rgb(103,104,121) #676879 secondary (cool blue-gray). Brand blue rgb(0,115,234) #0073ea (buttons/links/selected tab), lighter blue rgb(0,133,255), pale blue selection rgb(204,229,255), page tint rgb(246,247,251); green accent rgb(0,200,117) #00c875.
- **Radii**: 4px dominant (buttons, cards, chips — squarest of the set), 8px cards, 100px/240px pills (search bar, marketing CTA), 50% avatars.
- **Borders**: 1px rgb(195,198,212) #c3c6d4 (cool gray, fairly visible), 1px #d0d4e4, 1px brand-blue on outline buttons + inset 1px ring inputs. Border-forward tables.
- **Shadows**: modest — rgba(0,0,0,0.1) 0 4 6 -4 dropdowns, 0 6 20 modals.
- **Buttons**: h30-32, radius 4px, pad 4-8px; primary solid #0073ea white text; outline = blue border + blue text; search pill = gray-10% bg, radius 100px.
- **Gaps**: 4 dominant, 8, 16, 24, 12.

## 6. Pipedrive (123132.pipedrive.com/setup-guide)

- **Font**: Inter at **weight 450** for body (14px/21 w450 dominant — 255 uses). Emphasis w600 (14/20, 14/21, 12/16 labels, 10/16 uppercase micro-labels). Display 25px/38 w400. No w400 body at all — everything slightly heavier.
- **Colors**: body text rgb(33,35,44) #21232c (ink navy-black), secondary rgb(101,104,111) #65686f. Link blue rgb(13,104,197) #0d68c5 heavily used (49). Sidebar dark navy rgb(33,28,82) #211c52 with selected purple rgb(97,80,225) #6150e1 / rgb(105,98,242). Success green solid buttons rgb(45,134,71) #2d8647, green text rgb(7,120,56). Red rgb(216,60,56). Skeleton gray rgba(33,35,44,0.12), page tint rgb(245,245,246), pale purple hero rgb(236,236,237)+#f5f5fd-ish.
- **Radii**: 6px buttons/CTAs, 8px, 12px cards/list containers, 100px/48px pill icon-buttons, 50% avatars, 20px.
- **Borders**: single border token: 1px rgba(33,35,44,0.14) — ink-alpha 14% everywhere (19 uses). Very consistent.
- **Shadows**: subtle card shadow rgba(42,54,71,0.05) 0 1 2 (10 uses — every card), layered popover shadows, modal 0 16 24. Most shadow-forward of the set but still whisper-quiet.
- **Buttons**: h40 (largest), radius 6px solid green primary; icon buttons pill 100px w/ ink-14% border on white.
- **Gaps**: 16 dominant (26), 8, 4, 12, 2. Most generous spacing of the set.
- CSS vars: none exposed (compiled CSS-in-JS).

## 7. Linear (linear.app — Pegbo 2.0 MVP initiative)

- **Font**: Inter Variable / SF Pro Display. Doc content 16/24 w400; UI chrome 13px & 12px w500 (lh normal); **15px/24 w450** (36 uses — weight 450 again); headings 19/28 w600. Exposed tokens: --font-size-small .8125rem (13), regular .9375rem (15), large 1.125rem (18).
- **Colors**: ALL lch, hue 282 (barely-cool blue-violet cast at chroma 0–1.25). Exposed: --color-bg-primary lch(97.94)≈#f9f9fa (their own --bg-base-color-light:#f9f9fa), sidebar #efeff0, content panel white; text primary lch(9.79)≈#19191b, secondary lch(19.59)≈#2f3035, tertiary lch(39.18)≈#5c5d63, quaternary lch(64.64)≈#9b9ca4. Borders: primary lch(95.24)≈#f0f0f1, secondary lch(88.49)≈#dedee1, tertiary lch(84.44). 0.5px hairline borders. Chart pink lch(40 60 340) + teal accents.
- **Radii**: 8px hugely dominant (72), 9999 pills (52 — labels/chips/avatars), 10px buttons, 12px cards, 3-6 small.
- **Shadows**: signature layered whisper — lch(0 0 0/.02) 0 3 6 -2 + lch(0 0 0/.04) 0 1 1; ring+shadow combo (lch(80.94) 0 0 0 1px + same); popover 0 6 18/.02 + 0 3 9/.04.
- **Buttons**: h28, radius 10px or pill, ghost, 13.33px/400 or 12/500.
- **Gaps**: 6px dominant (28) — 6px base grid feel; 8, 2, 4, 3, 12. Sidebar 244px.

## 8. Intercom (app.intercom.com inbox)

- **Font**: Inter. Body 14/20 w400 dominant; 13/16 secondary rows; emphasis **w600** everywhere (13/16, 14/16, 14/20); headings 20/24 w600; rare w700 micro.
- **Colors**: canvas rgb(239,240,235) **#eff0eb — olive/green-tinted warm gray** (distinctive); floating panels white / #f8f8f7 / #fbfbf9; text #1a1a1a, secondary rgb(100,100,98) #646462 (warm). Dark primary button #222222. Accent pastels: peach #ffccb2, lavender #e7e2fd, blue #9ec5fa; red #df2020; purple border #b09efa (AI/Fin accent).
- **Radii**: 8px dominant, 12/16 panels, **9999 pills for nearly all buttons** (h32 w600 pad 8/12; small h24).
- **Panels**: ring rgb(233,234,230) 0 0 0 1px + rgba(20,20,20,.15) 0 1 4 shadow — floating-panel-on-canvas like Twenty.
- **Borders**: almost none as borders — separation by ring+shadow+canvas tint.
- **Gaps**: 4 > 8 > 16.

## Dark-mode pass (2026-08-11, same session)

- **OpenAI** (via data-theme=dark, restored): canvas #131313, cards #303030/#212121/#181818, text #dcdcdc → #afafaf → #8f8f8f (muted UNCHANGED between modes), borders white/12% (exact mirror of light black/12%), link #339cff, selection blue-alpha 13%.
- **Claude Console**: NO user-facing dark mode (no theme option in menus; data-mode=dark flips only body to #151515, components stay light — not a real theme).
- **Twenty** (via Settings→Experience→Dark, restored to System): frame p3 0.114 ≈ #1d1d1d, panel 0.106 ≈ #1b1b1b (panel DARKER than frame in dark — relationship inverts), sidebar 0.09 ≈ #171717, raised 0.133 ≈ #222, hover white 3–6%, text #ebebeb/#b3b3b3/#818181, borders #222, selection blue ≈ #4662d6.
- **Linear** (via cmd-K theme command, restored to Light): tokens — bg lch(5.52 0.4 272) ≈ #101012 → secondary 7.32 → tertiary 8.22 → quaternary 9.35 ≈ #191a1c; text lch 100 (white) → 90.45 ≈ #e2e3e6 → 61.8 ≈ #95969c → 36.98 ≈ #55565c; borders lch 9.84/14.16/16.32 chroma 1.48 ≈ #1b1c1f/#26272b/#2c2d31. **Hue shifts 282→272 in dark**, border chroma rises.
- **Intercom** (via .dark class, restored): canvas **#080808**, panels rgb(28,32,38) #1c2026 — **cool blue-gray** (light mode is warm olive — temperature flips!), raised #2b2f35, text #fafafa, secondary #c9c6c5 (stays warm), ring #373c43, shadow alpha jumps 15%→55%. Pastels deepen: peach→#683d27, lavender→#342e4d, blue→#3d5f8f.

## 9. ElevenLabs (elevenlabs.io/app/flows)

- Inter; UI chrome 13/20 w500 dominant, 12/16 w500, body 16/24; stat 36.8/24 w600.
- White canvas, #fafafa sidebar; text #0f0f10; **secondary = black 53% alpha, muted 44% alpha** (alpha text ramp, tokenized as --gray-alpha-*); hover black 2–4.3%; borders black/10% + 7.5%.
- Radii: 10 buttons, 8, 16 cards, 6 chips, 12 search, pills. Primary btn black #0f0f10. Buttons h32–36. Gaps 8>4>6>16. ~No shadows.
- Naming: --gray-alpha-{step}; primitives --studio-{tailwindHue}-{step} (×20 hues); status --{normal|success|info|warning|error}-{text|bg}[-hover]; --radius-xs/sm/default/md; --spacing (TW4); --font-waldenburg (brand face tokens).

## 10. Manus (manus.im/app)

- **Pure system font stack** (-apple-system…) — only product with no webfont. Body 16/24; UI 14/18 w500, 13/18.
- Notion-ink palette: text #34322d, secondary #5e5e5b, muted #858481, overlays rgba(55,53,47,.04–.08) (Notion's exact ink); canvas white, surface #f8f8f7, fill #f0f0f0; primary btn #1a1a19; accent blue #0081f2 (sparse); borders 1px black/6%, hairline 0.5px black/14%.
- Radii: 8 controls, 10, 12 cards, 22 composer, pills. Buttons h28–36. Gaps 4>8>12.
- Naming (via Tailwind arbitrary values): --text-primary/secondary/tertiary/onblack; --icon-primary/secondary; --background-nav/-gray-main/-menu-white; --border-main/-dark; --fill-tsp-*; --Button-black (capitalized component token). Spacing: raw px literals, no tokens.

## Token NAMING conventions (text / color / spacing)

- **OpenAI**: `--color-{layer}-{intent}-{style}-{state}` — e.g. color-background-info-soft-hover, color-text-primary-ghost. Styles: soft/solid/outline/ghost(+alpha); states in names (hover/active) = full token matrix (~1016 vars). Type: --font-heading-{size}-{size|line-height|weight|tracking} + --font-text-{size}-{…} (heading vs text familes, property-exploded). Weights --font-weight-normal/medium/semibold/bold. Spacing: TW --spacing + component tokens (--control-gutter, --input-gap, --control-size-*).
- **Claude Console**: `--cds-` namespace. --cds-text-primary/secondary/muted/disabled + intents (danger/success/warning/accent/pro) + domain tokens (git-added/removed/merged…); --cds-bg-{intent}[-chip][-hover]; --cds-on-* (Material-style on-colors); primitives --cds-{hue}-{step} ×10 + --cds-alpha-*; type --cds-font-*, --cds-leading-*; spacing **--cds-pad-xs/sm/md/lg**.
- **Twenty**: `--t-` namespace. --t-font-color-primary/secondary/tertiary/light/extra-light/inverted/danger; --t-font-size-xxs…; --t-background-primary…quaternary, -transparent-{strong/medium/light/lighter}, -inverted-*; --t-border-color-strong/medium/light; --t-border-radius-xs…xxl; **--t-spacing-0…28 + --t-spacing-multiplicator**; primitives --t-color-* (745).
- **Evernote**: component-scoped: `--color-{component}-{element}-fill-{state}` (color-input-inputtext-fill-active; color-textbutton-base-fill-primary-hover) — "fill" terminology, 1900+ tokens (token explosion cautionary tale); primitives --colors-grey-*/-secondary-*/-brandonly-*.
- **Monday (Vibe)**: flat, no namespace: --primary-color, --primary-text-color, --secondary-text-color, --positive/negative/warning-color[-hover/-selected], --ui-border-color, --layout-border-color, --text-color-on-primary/-on-inverted. Type numeric: --font-size-10…60 + -h1…h5; --font-line-height-10…60; weights incl "very-light". Spacing **--space-{px}: 2/4/8/12/16/20/24/32/40/48/64/80** (value-named).
- **Pipedrive**: all compiled away; only --pd-color-primary-default/hover/extra-strong survives (pd- ns; "Convention UI"/cui traces).
- **Linear**: --color-{layer}-{rank}: bg/text-primary…quaternary, border-primary/secondary/tertiary. Fonts by ROLE: --font-regular/display/monospace/emoji. Sizes: **--font-size-micro/microPlus/mini/miniPlus/small/smallPlus/regular/regularPlus/large/largePlus/title1-3** (named scale with codified half-steps). Layout tokens --sidebar-width/--header-height. No public spacing scale.
- **Intercom**: zero CSS vars — semantic Tailwind classes: text-default/text-muted; bg-{palette}-{surface}: bg-neutral-container, bg-base-module, bg-base-input, bg-accent-container-emphasis; border-neutral-border; **shadow-lvl-0** (leveled elevation); spacing stock TW + named **module** step (gap-module, rounded-module).
- **ElevenLabs / Manus**: see above.

Naming takeaways: (1) namespaced (--cds-/--t-/--pd-) vs bare — namespaces prevent 3rd-party collisions; (2) primary/secondary/tertiary(/quaternary) rank naming is the majority for text; (3) OpenAI/Evernote put state+style INTO names (matrix, 1000–1900 tokens) while Linear/Manus/Claude keep names small and handle states elsewhere — matches our "recipes not tokens"; (4) spacing schools: numbered-multiplier (Twenty), px-named (Monday), t-shirt (Claude pad-*), none (Manus/Linear); (5) status vocab varies: positive/negative vs success/danger vs error; (6) Linear's -Plus half-steps and role-named font families are the most elegant type naming.

Dark patterns: (1) alpha borders self-mirror (OpenAI black/12%↔white/12%); (2) raised surfaces get LIGHTER than canvas in dark (Linear, Intercom) except Twenty which inverts; (3) muted text converges ≈#818–#9b across all; (4) shadow opacity multiplies ~3× in dark; (5) hue/temperature is re-decided in dark, not inherited (Intercom warm→cool, Linear 282→272).
