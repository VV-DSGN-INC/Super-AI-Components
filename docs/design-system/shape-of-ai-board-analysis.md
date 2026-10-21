# Shape of AI board analysis - fourth source, Trust builders slice

**Scope:** [Shape of AI](https://www.shapeof.ai) by Emily Campbell: a curated library of 60 AI
interaction patterns in six categories (Wayfinders, Inputs, Tuners, Governors, Trust builders,
Identifiers), each with named product examples and screenshot cards. This read maps all six
categories against the catalog and runs the inclusion test on the one category the catalog is
thinnest in, Trust builders.
**Read:** 2026-10-20.
**Status:** Audit complete for all six categories (§3). Inclusion test run for Trust builders
and for the non-trust candidates the audit surfaced (§4). Nothing here is in the catalog yet;
the catalog rows, specs and manifest entries are written at prep time (CONTINUE.md §3.2) from
§5, and §5 is the only copy until then.

---

## 1. Method, and where this source sits between the other three

|                  | Primary board                      | Agent slice                                | This slice                                                                  |
| ---------------- | ---------------------------------- | ------------------------------------------ | --------------------------------------------------------------------------- |
| Source           | Curated Figma board of screenshots | Product docs, framework references         | A third party's curated pattern library with screenshot cards per example   |
| Unit of evidence | An observed screen                 | A documented, named behaviour              | A named product example on a pattern page, each with a screenshot card      |
| Rigour           | Direct visual anatomy              | Named pattern + one citable description    | Observed pixels, but selected and described by someone else                 |
| Failure mode     | Sampling bias (gaps.md §1)         | Documentation describes intent, not pixels | Curation bias: the library shows the examples that fit the pattern it names |

Two consequences for the inclusion test (D1: three or more unrelated products).

- **Counts come from the pattern pages' named examples**, so they are a floor, not a census.
  Shape of AI lists the products that illustrate a pattern well; it does not list every product
  that has it. A candidate at 3 here is likely higher in the wild.
- **This read was of the pattern text, not of the screenshot cards.** The pages were fetched and
  summarised; the cards were not opened one by one. Every count below therefore carries the same ⚠
  the agent slice used: **verify the example screenshots before a spec is treated as settled.**
  The agent slice's rule applies unchanged.

The vendor-sibling rule from the agent slice holds: Gemini and Chrome are one Google datapoint,
Perplexity and Comet are one, Firefly is Adobe.

---

## 2. The load-bearing finding

**The catalog's "trust" is the Shape of AI's "Governors".** Family N is named "Feedback, trust &
observability", and nine of its twelve items are oversight surfaces: `permission-prompt`,
`autonomy-selector`, `safety-block`, `escalation-handoff`, `task-tray`, `trust-dialog`, plus the
three observability items. Shape of AI files every one of those under Governors ("human-in-the-loop
features that keep users in oversight and control"). Its Trust builders category is something else:
disclosure, consent, data ownership, provenance, private sessions, watermarks. The catalog has one
item there, N3 `disclaimer-note`.

This is not a naming error. The catalog cuts by surface (where a thing renders) and Shape of AI
cuts by intent (what the user is reassured of), and the two axes are both valid. But it means the
family label has been reading as coverage it does not have. The honest statement is: **the catalog
covers oversight well and reassurance barely**, and the gap is five components wide (§4), not one.

The second finding repeats the agent slice's: one of the five is a **primitive, not a component.**
Disclosure's visible form, the "AI-generated" chip, is already drawn three times in the registry
(K1's icon + label, J4's type badge, F1's asset type) and would be drawn a fourth time by N11. The
promotion rule in concept-model.md says that piece moves to L2. See §4 and §6.

---

## 3. Audit: all six categories against the catalog

Vocabulary. **Covered**: a catalog item or an AI Elements component (L1, composed never copied)
carries the pattern as described. **Partial**: the behaviour exists but a form Shape of AI names is
absent. **Missing**: nothing in the catalog, L1 or the gaps. **State**: the gap is a variant on an
existing item, not a new item. **Cut**: deliberately out, on the record.

### Wayfinders (8)

| Pattern         | Catalog                                                             | Status  |
| --------------- | ------------------------------------------------------------------- | ------- |
| Example gallery | J3 `explore-gallery`, J6 `template-detail`, O8 `explore-shell`      | Covered |
| Follow up       | D7 `slot-summary`, the Dialog contract (D15); L1 `Question`         | Covered |
| Initial CTA     | C1 `hero-omnibox`                                                   | Covered |
| Nudges          | L2 `coach-mark`, L3 `feature-announcement`, I3 (AI entry first), B5 | Covered |
| Prompt details  | F3 `asset-detail`, the Provenance contract via A10                  | Covered |
| Randomize       | No "surprise me" on C1 or D1                                        | State   |
| Suggestions     | C2 `suggestion-chips`; L1 `Suggestion`                              | Covered |
| Templates       | J6 `template-detail`, C3 `feature-card-row`, E8 `generation-wizard` | Covered |

### Inputs (15)

| Pattern        | Catalog                                                                                  | Status  |
| -------------- | ---------------------------------------------------------------------------------------- | ------- |
| Prompt actions | I4 `ai-tools-menu`, K4 `selection-toolbar`, D6 `skill-menu`                              | Covered |
| Auto-fill      | Nothing; a table pattern, belongs to the unsampled data slice (gaps.md §4)               | Missing |
| Chained action | Family G, cut by D9                                                                      | Cut     |
| Describe       | No reference-to-prompt affordance on D2 `reference-strip`                                | State   |
| Expand         | K4 `selection-toolbar` (expand verb)                                                     | Covered |
| Inline Action  | K2 `inline-generate-popup`, K4, I3 `context-toolbar`, D5 `quote-reply`                   | Covered |
| Inpainting     | I5 `drawing-tools` mask mode, D5 image-region quote                                      | Covered |
| Madlibs        | E8 has a stepper, nothing has fill-in variables; a `prompt-template-form` would (§4)     | Partial |
| Open input     | C1, D1 `media-prompt-bar`; L1 `Prompt Input`                                             | Covered |
| Regenerate     | K1 and F7 verbs, E9 per-segment; L1 `Actions`                                            | Covered |
| Restructure    | D5 `quote-reply`, F3 and F4 Remix                                                        | Covered |
| Restyle        | E4 `preset-grid`, K4 tone submenu, F4 `action-stack`                                     | Covered |
| Summary        | K4 shorten verb only; no summary surface (the agent slice saw ServiceNow's summary card) | Partial |
| Synthesis      | K7 `answer-block`, O13 `notebook-shell`                                                  | Covered |
| Transform      | F4 `action-stack` cross-tool handoff, H4 `transcript-editor`                             | Covered |

### Tuners (10)

| Pattern          | Catalog                                                             | Status  |
| ---------------- | ------------------------------------------------------------------- | ------- |
| Attachments      | D2 `reference-strip`, D3 `context-chips`; L1 `Attachments`          | Covered |
| Connectors       | M7 `connection-manager`, N7 `env-status`, K5 `source-panel`         | Covered |
| Filters          | J2 `filter-panel`, A5 `filter-bar`, K8 permission-filtered          | Covered |
| Model management | E2 `model-picker`, A7 `gen-settings-bar`; L1 `Model Selector`       | Covered |
| Modes            | D4 `mode-tabs`                                                      | Covered |
| Parameters       | E3 `parameter-panel`, A6, A7                                        | Covered |
| Preset styles    | E4 `preset-grid`                                                    | Covered |
| Prompt enhancer  | No enhance affordance, no rewrite-before-run view; passes at 7 (§4) | Missing |
| Saved styles     | E4 has no user-presets section; J2 has saved searches               | State   |
| Voice and tone   | K4 tone submenu, E9 per-segment voice; no persistent voice profile  | Partial |

### Governors (13)

| Pattern           | Catalog                                                                                  | Status  |
| ----------------- | ---------------------------------------------------------------------------------------- | ------- |
| Action plan       | D7 `slot-summary`; L1 `Plan`, `Task`                                                     | Covered |
| Branches          | L1 `Branch`; F2 and F3 more-like-this for generations                                    | Covered |
| Citations         | K6 `citation-ref`, K7 `answer-block`; L1 `Inline Citation`, `Sources`                    | Covered |
| Controls          | E5 `run-button`, E6 `generation-queue` cancel, N12 per-task cancel; L1 `Queue`           | Covered |
| Cost estimates    | A2 `cost-chip`, E5, E1, the Cost contract                                                | Covered |
| Draft mode        | No draft/final quality toggle on A7 or E5; implicit routing lives in E2                  | State   |
| Memory            | Nothing; no memory list, no per-item delete, no on/off. Passes at 5 ⚠ (§4)               | Missing |
| References        | K5 `source-panel`, K8 `source-cards`, D3                                                 | Covered |
| Sample response   | F7 `approval-card`, E8 preview pane; no try-on-one-record form (data slice)              | Partial |
| Shared vision     | Q1 `browser-frame` is presentational; no ambient "agent is working here" cue or takeover | Partial |
| Stream of Thought | N4 `trace-timeline`; L1 `Reasoning`, `Chain of Thought`, `Tool`                          | Covered |
| Variations        | F2 `generation-grid`, F5 `compare-viewer`, E6                                            | Covered |
| Verification      | N8 `permission-prompt`, F7, N2 `trust-dialog`, the Approval contract; L1 `Confirmation`  | Covered |

### Trust builders (7)

| Pattern        | Catalog                                                                                                  | Status  |
| -------------- | -------------------------------------------------------------------------------------------------------- | ------- |
| Caveat         | N3 `disclaimer-note`: under-composer, in-card, inline, with link                                         | Covered |
| Consent        | E10 `voice-clone-recorder` gates on likeness consent. No capture notice, no recording indicator          | Partial |
| Data ownership | Only a "Share usage data" row in M1's demo content. No training or retention control                     | Missing |
| Disclosure     | K1 `ai-doc-block` marks generated prose. No reusable label, no sender badge, nothing survives a handoff  | Partial |
| Footprints     | F3 provenance rail, Provenance contract, N4/N5, K6-K8. No media footprint that survives export           | Partial |
| Incognito Mode | B7 `app-topbar` has an unspecified privacy chip slot. No mode, no statement, no sealed-session treatment | Missing |
| Watermark      | Nothing on F1 `result-card`, no content-info panel                                                       | Missing |

### Identifiers (5)

| Pattern     | Catalog                                                                                        | Status          |
| ----------- | ---------------------------------------------------------------------------------------------- | --------------- |
| Avatar      | Vendored shadcn Avatar; the AI's identity is the consumer's brand decision                     | Not a component |
| Color       | The token contract deliberately has no "AI colour"; anti-slop.md bans the purple gradient      | Not a component |
| Iconography | `Sparkles` from lucide is used ad hoc (K1, I3); no rule says which glyph means "AI acted here" | Partial         |
| Name        | Consumer's decision                                                                            | Not a component |
| Personality | Consumer's decision; D22 ships English strings only                                            | Not a component |

Iconography is the one Identifier with a catalog consequence: V1 `ai-label` (§5) should own the
glyph, so that "AI acted here" is drawn one way across K1, F1, J4 and N11 instead of four.

### Tally

| Category       | Patterns | Covered | Partial | State | Missing | Cut / not a component |
| -------------- | -------- | ------- | ------- | ----- | ------- | --------------------- |
| Wayfinders     | 8        | 7       | 0       | 1     | 0       | 0                     |
| Inputs         | 15       | 10      | 2       | 1     | 1       | 1                     |
| Tuners         | 10       | 7       | 1       | 1     | 1       | 0                     |
| Governors      | 13       | 9       | 2       | 1     | 1       | 0                     |
| Trust builders | 7        | 1       | 3       | 0     | 3       | 0                     |
| Identifiers    | 5        | 0       | 1       | 0     | 0       | 4                     |

Trust builders is the only category where Covered is the minority. Everything else is a handful
of states and two or three candidates.

---

## 4. Inclusion test re-run

Counting unrelated products named on the Shape of AI pattern pages, per D1. ⚠ means the count
rests on this read's text summary and the screenshot cards were not opened.

### Passes: Trust builders

| Candidate                       | Count | Products                                                                                                  | Verdict                                  |
| ------------------------------- | ----- | --------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| `ai-label` (V1) ⚠               | 8     | Character.ai, Intercom Fin, Productboard, Tactiq, TikTok, Zapier, Zoom, iA Writer                         | **PASS**, as a primitive (see §6)        |
| `capture-consent` (V2) ⚠        | 6     | Fireflies, Gong, Granola, Limitless, Notion, Zoom AI Companion                                            | **PASS**                                 |
| `data-controls` (V3) ⚠          | 9     | ChatGPT, Claude, Gemini, GitHub, Notion, Perplexity, Substack, Figma, Limitless                           | **PASS**, strongest result in the slice  |
| `private-session-notice` (V4) ⚠ | 7     | ChatGPT, Google (Gemini, Chrome), Perplexity (incl. Comet), Dia, Microsoft Copilot, Notion AI, Apple Siri | **PASS**                                 |
| `content-credentials` (V5) ⚠    | 5     | Adobe Content Credentials, TikTok, Shutterstock, Snap, Google SynthID                                     | **PASS**; absorbs Watermark's panel form |

### Passes outside Trust builders, held for their own slices

| Candidate                | Count | Products                                                             | Verdict                                                                 |
| ------------------------ | ----- | -------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `prompt-enhancer` ⚠      | 7     | Adobe Firefly, Bolt, Cofounder, Copy.ai, FloraFauna, Leonardo.ai, v0 | **PASS**, Tuners slice. A popover showing the rewrite before it runs    |
| `prompt-template-form` ⚠ | 6     | Coda, Copy.ai, Google, Jasper, Relay, Writer                         | **PASS**, Inputs slice (Madlibs). Variables, not parameters             |
| `memory-manager` ⚠       | 5     | ChatGPT, Claude, Gemini, Microsoft Copilot, Perplexity               | **PASS**, Governors slice. V4's twin; Shape of AI pairs them explicitly |
| `shared-vision` ⚠        | 3     | Perplexity Comet, OpenAI Operator, Claude computer use               | **PASS at the floor**, agent slice v2. Novel, hard, not for this batch  |

### States, not components

| Shape of AI pattern  | Lands on                                 | New state                                                 |
| -------------------- | ---------------------------------------- | --------------------------------------------------------- |
| Watermark (overlay)  | F1 `result-card`                         | `watermarked`: a visible overlay mark, consumer-supplied  |
| Disclosure (handoff) | N11 `escalation-handoff`                 | the packet and the human-side thread carry V1             |
| Incognito (compact)  | B7 `app-topbar`                          | the privacy chip is V4's compact form; vocabulary from V4 |
| Randomize            | C1 `hero-omnibox`, D1 `media-prompt-bar` | `randomize` affordance                                    |
| Draft mode           | A7 `gen-settings-bar`, E5 `run-button`   | `draft` quality; E5 shows the cost delta                  |
| Saved styles         | E4 `preset-grid`                         | `user-presets` section with save-current                  |
| Describe             | D2 `reference-strip`                     | `describe` action on a filled slot                        |

### Fails or defers

| Candidate            | Verdict                                                                                              |
| -------------------- | ---------------------------------------------------------------------------------------------------- |
| `auto-fill`          | **DEFER**: a table pattern; its evidence is the unsampled data slice                                 |
| `sample-response`    | **DEFER**: same slice (Notion databases, Zapier test-on-one-record)                                  |
| `summary-card`       | **DEFER**: one named product here (ServiceNow, from the agent slice); verb exists on K4              |
| `voice-profile`      | **DEFER**: a settings section; wait for the voice slice                                              |
| `chained-action`     | **CUT** by D9. Shape of AI's node-board form is exactly family G                                     |
| Identifiers (4 of 5) | **NOT COMPONENTS**: brand decisions the consumer makes; D22 already keeps the registry voice-neutral |

**Net for this slice: five additions**, one of them a primitive, plus three states on shipped items
(F1, N11, B7). Four further passes recorded for the slices they belong to.

---

## 5. The five, as design notes for the specs

These are the notes `component-specs.md` entries are written from at prep time. Each carries its
Shape of AI design rules translated into this catalog's vocabulary, the contracts it binds to, and
what it must compose. Evidence is the §4 row.

### V1 `ai-label`: proposed A13, primitive

**Base:** Badge, Tooltip · **States:** generated · edited · summarized · sender · after-handoff ·
text-tint

- **Label the action, not the feature.** "Rewrote with AI" sets a clearer expectation than "AI".
  The default copy per state says what happened to the content.
- **One glyph.** The label owns the "AI acted here" icon; consumers stop importing `Sparkles`
  themselves. Iconography (§3) is settled by this rule alone.
- **The treatment is reserved.** Whatever tint `text-tint` applies to AI-sourced prose (iA Writer's
  grey) is applied to nothing else in the registry. A rule for the token gate, not only the spec.
- **`sender` is never confusable with a person.** It renders beside the name in a message, comment
  or notification, and it stays in `after-handoff` on the AI's turns once a human takes over
  (Intercom Fin), so the reader can see where the AI stopped.
- **Tooltip carries the detail**: model, time, and a link to V5 when credentials exist.
- Composed by K1 `ai-doc-block` (replacing its own icon + label), F1 `result-card`, J4
  `artifact-grid`, N11 `escalation-handoff`. That fan-out is why it is A13 and not N13.

### V2 `capture-consent`: proposed N13

**Base:** Alert, Badge, Switch · **States:** pre-notice · recording · others-notified · declined ·
ended

- **Consent is a gate, not a setting**, the rule E10 already lives by. `pre-notice` renders before
  capture can start and names who will be told; the callback that starts capture fires only from
  it.
- **Recording, training and sharing are three separate choices.** One toggle for all three is the
  dark pattern the Disclosure page names. Training consent routes to V3, never into this component.
- **The indicator is on every surface while capturing.** `recording` is a persistent chip, not a
  toast; it has a `compact` form for B7 and a `bar` form for the surface that owns the capture.
- **Participants, not just the initiator.** `others-notified` confirms the notice went to the
  other people in the call or document (Notion's marquee, Zoom's acknowledgment); `declined` is a
  participant opting out, and it is a first-class state with a visible consequence.
- **Reversible, with the consequence stated.** Stopping says what is kept and what is deleted.
- Boundary: capture consent only. Likeness and voice cloning stay in E10.

### V3 `data-controls`: proposed N14

**Base:** Card, Switch, A9 `entity-row` · **States:** training-on · training-off · retention ·
plan-locked · none-collected · admin-managed

- **The default is stated in the UI, not only in the policy.** Each row says what happens to the
  data under the current setting, in one sentence, with the link to the long version.
- **Training and retention are separate rows.** Changing one never changes the other; the
  component makes that structural, with two controls, not a copy promise.
- **Both sides.** The training row explains the trade (what the user gives, what they get in
  aggregate) rather than only the altruistic pitch Shape of AI calls out in ChatGPT.
- **`plan-locked` says so.** When the opt-out is limited to a paid plan, the row renders the lock
  and the plan name, and routes to M5 `paywall-message`. Hiding the setting from free users is the
  pattern's named failure.
- **`none-collected` is a state, not an absence.** A product that does not train still renders the
  section and explains why there is no toggle (Limitless), so silence is not misread.
- **`admin-managed`** shows the policy the administrator set and who to ask; it never hides the
  row.
- Memory is not in here. Shape of AI separates personal caches from data ownership; a future
  `memory-manager` owns them.
- Composes M1's row grid; M1 `settings-dialog` and O12 `settings-shell` host it.

### V4 `private-session-notice`: proposed N15

**Base:** Alert, Badge, A9 · **States:** entering · active · connectors-reduced · exiting ·
unavailable

- **Unmistakable on every surface.** `active` is a persistent chip (B7's privacy slot renders it)
  plus the surface treatment the host chooses; the component ships the chip and the statement, the
  host ships the header tint.
- **One fixed sentence**, plain, never rewritten per screen: what is and is not remembered. The
  `entering` state shows it above the input before the first message (Gemini, Perplexity).
- **Sealed.** Prompts, files and outputs are excluded from memory, personalisation, team models
  and training. The component states that; the host enforces it. The statement must not claim
  more than the host does, so the sentence is a required prop with no default.
- **`connectors-reduced` lists what is off.** Private mode runs connectors with reduced or null
  scope; the permissions summary names each one, composing A9 rows.
- **`exiting` says what happens to the session** (deleted now, deleted in 24 hours, kept locally),
  the three retention shapes Shape of AI names.
- **`unavailable`** is the plan- or admin-gated case; same rule as V3's `plan-locked`.

### V5 `content-credentials`: proposed N16

**Base:** Hover-card, Popover, A10 `stat-readout` · **States:** verified · unverified · stripped ·
ai-generated · ai-edited · with-history

- **Consumers get the label, creators and researchers get the panel.** V1 is the visible mark; V5
  is what opens from it. The pair is the whole pattern.
- **Shows the context, not just the badge**: source model, generation time, edits, verified
  publisher, through A10 the way F3 and N5 already do.
- **`stripped` is honest.** Content whose credentials were removed renders as such, which is a
  different claim from "human-made". `unverified` is metadata present whose signature failed.
- **`with-history`** is the Footprints media form: the edit list, in order, each step attributed.
- **Consistent location.** On F1 it is the hover state of the `watermarked` mark; in F3 it is a
  rail section; in J4 it is the type badge's popover. Always the same panel.
- Standards named, not implemented: C2PA Content Credentials is the metadata shape the panel
  expects; the component renders a typed record and never parses a file.

---

## 6. What the slice corrected about existing items

**N3 `disclaimer-note` is right, and its spec already knows why.** Shape of AI's Caveat guidance
(adjacent to the output, plain language, link to documentation, assume it will be ignored) matches
N3's three rules line by line. One addition for its docs page: prefer context-specific copy ("check
the dates") over a generic warning.

**E10 `voice-clone-recorder`'s "consent is a gate in the flow, not a checkbox in settings" is
validated** by the Consent page's likeness section (ElevenLabs seeking estate permission). V2
inherits the rule and leaves cloning consent to E10.

**K1 `ai-doc-block` already ships Disclosure's text-tint form** (icon, label, "This block is
generated" accessible text). It becomes V1's first consumer; the promotion rule applies because
F1, J4 and N11 want the same piece.

**F1 `result-card` has no mark on the asset itself.** The Provenance contract puts prompt, seed
and params one click away in F3, which is Footprints. Watermark asks for a mark on the surface
and a panel from it, which F1 lacks: a `watermarked` state and V5.

**N11 `escalation-handoff` drops the AI's identity at the handoff.** Intercom Fin keeps the badge
visible after a human takes over so the reader can see where the AI stopped; the packet and the
thread should carry V1 in `after-handoff`.

**B7 `app-topbar`'s privacy chip was a slot with no vocabulary.** It is V4's compact form, and
V2's `recording` chip shares the slot. The spec should say so instead of leaving `label` free text.

**Family N's name overstates.** "Feedback, trust & observability" reads as covering Trust
builders; it covers Governors. No rename is proposed (renaming a shipped family churns every
spec anchor), but the docs site should stop implying the coverage. See §7.

---

## 7. What this slice does not cover, and one open question

The data, voice, extraction, vision and coding slices remain unsampled, unchanged from gaps.md §1.
Auto-fill, Sample response and Voice and tone wait for them. The four non-trust passes in §4 are
recorded, not committed.

**Open question: should the docs site carry a pattern cross-reference?** The catalog's families
and Shape of AI's categories are both legitimate cuts, and consumers arrive speaking either. A
`patterns` field on the manifest ("trust/caveat", "governors/verification") would let the docs site
answer "which component is the Caveat pattern" without re-cutting the families. It is a derived
surface under D23, cheap, and separate from the build. Decide it as its own item, not inside this
batch.

---

## Sources

- [Shape of AI, pattern index](https://www.shapeof.ai/)
- [Caveat](https://www.shapeof.ai/patterns/caveat)
- [Consent](https://www.shapeof.ai/patterns/consent)
- [Data ownership](https://www.shapeof.ai/patterns/data-ownership)
- [Disclosure](https://www.shapeof.ai/patterns/disclosure)
- [Footprints](https://www.shapeof.ai/patterns/footprints)
- [Incognito Mode](https://www.shapeof.ai/patterns/incognito-mode)
- [Watermark](https://www.shapeof.ai/patterns/watermark)
- [Chained action](https://www.shapeof.ai/patterns/chained-action)
- [Madlibs](https://www.shapeof.ai/patterns/madlibs)
- [Prompt enhancer](https://www.shapeof.ai/patterns/prompt-enhancer)
- [Nudges](https://www.shapeof.ai/patterns/nudges)
- [Prompt details](https://www.shapeof.ai/patterns/prompt-details)
- [Controls](https://www.shapeof.ai/patterns/controls)
- [Draft mode](https://www.shapeof.ai/patterns/draft-mode)
- [Sample response](https://www.shapeof.ai/patterns/sample-response)
- [Shared vision](https://www.shapeof.ai/patterns/shared-vision)
- [AI Elements, component index](https://elements.ai-sdk.dev/) (the L1 layer this catalog composes)
