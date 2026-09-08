# Four studios, no breadcrumbs — the navigation pattern

**Published:** https://claude.ai/code/artifact/049be321-35a2-4666-8cc5-9bf0951781b5
**Evidence:** [studio-board-analysis.md](../studio-board-analysis.md) §4 and §7 · decision
[D22](../decisions.md) · captures in `~/ClaudeCode Projects/Super-AI-Components-research/studio-slice/`

The first entry in this directory, which exists because the studio slice found that **the docs site
has nowhere to put a pattern** (candidate 5 in the analysis, §8). A pattern note is a relationship
across surfaces: it can be documented and cited, but not installed. Each one states what was
observed, in how many products, and what it changes for the registry.

---

## The path, per product

| Product    | Chain                                                   | In one line                                                   |
| ---------- | ------------------------------------------------------- | ------------------------------------------------------------- |
| Descript   | drive → Recents → _editor unreached_ → settings, dialog | One page, one sidebar, all the way down                       |
| ElevenLabs | home → Studio list → tool workspace → settings, page    | The frame never changes; only the content column does         |
| Spline     | home → My files → file editor → settings, dialog        | The editor discards the frame and rebuilds it around the file |
| Tripo      | home → Assets → 3D Workspace → account menu only        | No sidebar anywhere, and no settings page behind the menu     |

## 1 · Nobody uses a breadcrumb — #15, 4 of 4

Not on a project list, not inside an editor, not on a community detail page three levels down. Depth
stays shallow enough that a sidebar entry, a file name and one back affordance carry the whole
burden. Spline's editor is the sharpest case: it throws away the product sidebar entirely, and the
only thing identifying the open file is its name in the top bar beside a dropdown whose first item is
_Go to Dashboard_.

Evidence: `descript-projects-01` · `elevenlabs-projects-01` · `spline-editor-01` ·
`tripo-projects-01`.

**For the registry.** B7 `app-topbar` composes shadcn's `Breadcrumb`, and five shells pass one
through. Every one of them expresses a pattern this population does not have. The component is not
wrong; the default is.

## 2 · The switcher is universal, its position is not — #16, 4 of 4

All four ship a switcher and no two agree on where it goes or what it switches. Descript and Spline
put a drive or workspace switcher at the sidebar's top; Tripo puts one in the top bar because it has
no sidebar; ElevenLabs pins a **product** switcher to the sidebar's foot, listing three products with
a description line each.

Evidence: `descript-home-01` (Choose drive, 208 wide) · `spline-home-03` (12-item menu) ·
`elevenlabs-home-02` (304 × 166, sidebar foot) · `tripo-home-01` (top-bar dropdown).

**For the registry.** B2 `workspace-switcher` already has a multi-product variant with description
rows, so the object is covered. Its position is not: nothing in family B expresses a switcher pinned
to the sidebar's foot.

## 3 · ⌘K is reserved, and means three different things — #17 passes, #18 single

ElevenLabs opens a true command palette, 720 × 470, headed _Search for commands_, with quick actions
for creating a voice, generating speech and transcribing audio. Spline opens a file search scoped to
the workspace. Descript advertises _Search actions… ⌘K_ in its help menu and puts a separate
shortcuts sheet on ⌥⌘K, splitting the two jobs across two shortcuts. Tripo binds nothing.

Evidence: `elevenlabs-home-02` · `spline-home-02` · `descript-home-02` · Tripo tested on the home
stop after the walk, nothing opened.

**For the registry.** There is no command surface in the catalog at all; D6 `skill-menu` composes
`Command` for a different job. A component would have to take its mode as a prop, and this read
cannot say which mode is the default.

## 4 · Settings agrees on its shape, not its container — #14 passes 3 of 3, #13 stalls at 2

Every settings surface in the population carries its own internal navigation. Descript renders an
800 × 720 dialog with a 240 nav; Spline renders 1100 × 760 with a 252 nav; ElevenLabs gives settings
a page in the frame with page-level tabs. Tripo has no settings surface at all, only an account menu
with an inline notification toggle.

Evidence: `descript-settings-01` · `spline-settings-01` · `elevenlabs-settings-01` ·
`tripo-settings-01`.

**For the registry.** O12 `settings-shell` models the internal navigation, which is the part that
passes. The dialog container is a variant it does not have, and at two of three it is a candidate for
O12's shape rather than grounds for a new block.

## Measured chrome

Every value is a `getBoundingClientRect()` reading at 1440 × 900, DPR 2, with the selector recorded
in the analysis so it can be re-measured.

| Element                                     |       px |
| ------------------------------------------- | -------: |
| Descript sidebar                            |      240 |
| Spline sidebar                              |      252 |
| ElevenLabs sidebar                          |      256 |
| ElevenLabs sidebar, collapsed to a rail     |       56 |
| Spline editor left panel (min 320, max 560) |      320 |
| Spline editor inspector                     |      230 |
| Tripo rail + tool panel                     | 54 + 248 |
| ElevenLabs tool settings panel              |      500 |

Sidebars cluster inside a 16-pixel band.

## What this does not cover

- **Four products, not six.** Suno, Runway and Meshy had no session; Meshy was swapped for Tripo.
  Video, voice and 3D, with no image or design tool.
- **Two editors were not seen as editors.** Descript's was never reached and ElevenLabs' stop is a
  tool workspace. Editor findings rest on three products where the threshold is three, so they pass
  only when all three agree.
- **One day, one browser profile.** Every claim carries a capture id and a read date.
