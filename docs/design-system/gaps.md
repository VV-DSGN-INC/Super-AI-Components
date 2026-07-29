# Gaps — what the catalog is missing

**Status:** Analysis. Nothing here is approved, and most of it is explicitly *not* validated.
Wireframes for all 32 items are on the working board, column 5 (`MISSING R/T/U1/U2`).

---

## 1. The root cause: sampling bias in the source

The [reference board](reference-board-analysis.md) is a **creative tools** board — Midjourney,
CapCut, Canva, Freepik, Spline, Tripo, Descript, Manus, Claude.

The inclusion test ("appears in 3+ unrelated products") is only as good as the population it tests
against. Every AI category absent from the board was silently filtered out, and the test gave no
signal that anything was missing. **A rule that discards single-occurrence patterns cannot
distinguish "rare" from "unsampled."**

This is a methodological limitation of the whole catalog, not a list of oversights.

---

## 2. R — Recovered omissions · 7 items

These are **not** gaps in the reference board. They are errors in my own consolidation: each was in
the approved spec and was dropped without justification. They should be restored.

| # | Component | What it does | Why it was wrongly dropped |
|---|-----------|--------------|----------------------------|
| R1 | `env-status` | Per-provider reachability: ok · degraded · key-invalid · not-running | The approved spec pairs it explicitly with `credits-indicator` ("reachability vs spend"). A flow can fail with credits available because a key expired. |
| R2 | `run-controls` | Graph-level execution toolbar: run all, stop, step, current-node indicator | Folded into G6 `model-bar` and G8 `canvas-toolbar`, neither of which covers graph-level intent. Run-this-node and run-whole-graph are different actions. |
| R3 | `waveform-editor` | Region selection, sample-level zoom, scrub, region actions | Collapsed into H3 `track-lane`, which selects whole clips. Region selection has no equivalent there, and H2's ruler tops out at frames rather than samples. |
| R4 | `stem-mixer` | Track lanes with mute/solo/volume/pan and live meters | Exclusive-vs-additive solo is a real behavioural decision H3 does not model. Stem lineage back to the source must stay visible. |
| R5 | `track-list` | Music library: artwork, tags, inline waveform, BPM, key | Folded into J1 `asset-library`, whose generic metadata cannot express BPM and key — the facets that actually matter for music. |
| R6 | `tts-composer` | Script editor with per-segment voice, emotion and speed | A structured document, not a textarea with settings. Per-segment regenerate is the primary loop; whole-script regeneration wastes credits and discards good takes. |
| R7 | `voice-clone-recorder` | Guided sample recording with level metering and consent | Flagged as a stretch item in the approved spec, then dropped entirely. Consent capture belongs in the flow, not in settings. |

**The audio family (R3–R6) was the worst of it.** Audio editing genuinely differs from video, and
the board's own Requirements table E named three of these. I overrode it without saying so.

---

## 3. T — Trust & control · 5 items · PROPOSED

Cross-cutting families with no representation in the catalog. Confidence is high that these are
needed; they are absent from the board because it samples creative tools rather than agents with
side effects.

| # | Component | What it does |
|---|-----------|--------------|
| T1 | `permission-prompt` | "The agent wants to send an email to anna@…" — allow once / always allow / deny / edit-first, with a visible revocable scope |
| T2 | `autonomy-selector` | Ask every time · auto-approve reads · full auto; per-session and per-tool, effective mid-run |
| T3 | `task-tray` | Background tasks that outlive the view that started them, with opt-in completion notification |
| T4 | `safety-block` | Content blocked with the policy named and the triggering fragment quoted; input-blocked vs output-blocked; sensitive-content blur |
| T5 | `connection-manager` | BYO keys with four distinct states, test-connection, local model download and hardware requirements |

**T1 is the most important missing component in the entire catalog.** Every tool-calling and
computer-use agent needs it, and it is a safety surface rather than a convenience one. T5 is the
config counterpart to R1, which is the runtime view.

T3 was observed once (Manus: "Receive a browser notification when tasks complete") — below the 3+
threshold, but structurally required by any agent whose work outlives a page view.

---

## 4. U — Unsampled AI types · 20 items · PROPOSED, NOT VALIDATED

**These are reasoned from the AI product landscape, not derived from the reference board.** That is
exactly the speculation the approved spec's "every component traces back to observed product
anatomy, not speculation" rule exists to prevent.

**Treat this as a list of categories to go sample, not a list to go build.**

### Realtime voice — 3

| # | Component | Note |
|---|-----------|------|
| U1 | `voice-session` | Four states (listening/thinking/speaking/idle), barge-in, latency and connection quality with a text fallback |
| U2 | `live-transcript` | In-flight text visually distinct from settled text; tappable low-confidence spans |
| U3 | `voice-picker` | Every card auditions the *same* sentence; exclusive playback; accent/age/use-case facets |

U3 was in the board's own Requirements table E ("voice card + voices grid") and I collapsed it into
`preset-grid` — A8 `preview-tile` cannot express an audio preview.

### Extraction & classification — 3

| # | Component | Note |
|---|-----------|------|
| U4 | `field-extraction` | Every field links to its source *region*; extraction provenance is spatial |
| U5 | `confidence-badge` | Would be the 13th primitive — three bands, not raw percentages; needed by extraction, transcription, vision and retrieval alike |
| U6 | `correction-queue` | Triage by confidence, keyboard-first; the volume counterpart to F7 `approval-card` |

**Commercially the biggest gap.** Document AI is a larger market than image generation, and its core
interaction — a field, a confidence score, a click to correct — appears nowhere in the catalog.

### Vision — 2

| # | Component | Note |
|---|-----------|------|
| U7 | `annotation-overlay` | Boxes as strokes with labels outside them; confidence threshold slider; boxes/masks/points modes |
| U8 | `label-review` | Five verbs — accept · reclass · adjust · delete · **add**. Without "add", review produces silently biased data |

**Technically the biggest gap** — needs a canvas overlay primitive that nothing in G or I provides.

### Data & analytics — 3

| # | Component | Note |
|---|-----------|------|
| U9 | `query-preview` | The generated SQL is always visible and editable, with the model's assumptions stated |
| U10 | `result-table` | Row count, timing and cache state as trust signals; cell-level drill-down |
| U11 | `chart-suggestion` | One suggestion with alternatives beside it, and a rationale naming the data shape |

### Search & grounded answers — 3

| # | Component | Note |
|---|-----------|------|
| U12 | `answer-block` | Inline citations at the claim; retrieved-but-uncited sources shown as uncited |
| U13 | `search-steps` | Makes a multi-second wait legible and the answer auditable; collapses once the answer arrives |
| U14 | `source-cards` | Relevance scores shown — the user-facing form of the spec's dropped `retrieval-inspector` |

### Coding agents — 4

| # | Component | Note |
|---|-----------|------|
| U15 | `code-diff` | Line-level with syntax highlighting; per-hunk apply/skip. K3 `diff-review` is word-level for prose |
| U16 | `change-tree` | Unchanged files hidden; per-file review state; distinct rename marker |
| U17 | `log-stream` | Failures parsed into an actionable card above the raw stream; pinnable scroll |
| U18 | `preview-pane` | Runtime errors routed back to the agent with file and line; viewport toggles |

The board contains Lovable but only its *settings* screens, which is why coding agents came through
as a settings shell rather than as a component family.

### Predictive & scoring — 2

| # | Component | Note |
|---|-----------|------|
| U19 | `forecast-chart` | The confidence band is mandatory; the actual/predicted boundary is drawn explicitly |
| U20 | `prediction-explainer` | Signed contributions ordered by magnitude, plus a counterfactual — the actionable part |

---

## 5. Other gaps named but not wireframed

- **Collaboration** — presence, comments on artifacts, suggestion mode
- **Mobile** — everything on the board is desktop; bottom-sheet composers and thumb-reach are a
  different problem, not a responsive tweak
- **Integrations onboarding** — connect-your-accounts grid, OAuth consent screens
- **Translation / localisation** review UI
- **Prompt & eval tooling** — prompt versioning, test-case tables, A/B model comparison. Arguably
  out of scope: developer tooling rather than end-user AI application UI.

---

## 6. Recommendation

Not "add 32 components." Three moves, in order:

1. **Restore R1–R7 now.** These are recovered errors, not new scope. R1 and R2 in particular leave
   the Flow Kit incomplete against its own approved spec.
2. **Add T1 `permission-prompt` and T5 `connection-manager`.** Both are trust surfaces where absence
   is a defect rather than a scope decision, and both are cheap.
3. **Collect a second reference board** covering voice, extraction, vision, data, search and coding —
   one screenshot set per category. Then re-run the 3+ test against the combined population. That is
   the methodologically correct fix for §1, and it is roughly an afternoon of collection work.

Hold the rest. A registry that credibly covers creative + agent + chat is a better product than one
that thinly covers eleven categories.

---

## 7. Open question this raises

Does the catalog's scope statement need to change? The approved spec positions Super-AI-Components as
"everything around and beyond the conversation" for **AI products generally**. What was actually
derived is a catalog for **creative and agentic AI products**.

Either narrow the positioning to match what exists, or broaden the sampling to match the positioning.
The current mismatch is the thing worth deciding — see [decisions.md](decisions.md).
