# AI app types board analysis: second reference population, slice 3

**Scope:** seven AI app types no shell covers: answer, agent run, data analysis, builder, voice
session, document editor, presentation (the Q6 check).
**Read:** 2026-09-25, public material only.
**Status:** DRAFT. Every claim was re-checked against its capture on 2026-09-26 (§4). Nick's
own-account captures are pending and get the same check. No decision rests on this draft; D26
waits for them.
**Spec:** [`2026-09-25-ai-shell-family-design.md`](../superpowers/specs/2026-09-25-ai-shell-family-design.md)
**Board:** [AI types slice · 2026-09-25](https://www.figma.com/design/sJHbH5byHh9FI0vf2HUG3N/Super-AI-Design-System?node-id=14-2),
164 captures from 31 products, each captioned with its state, source kind and URL.

---

## 1. Method, and how it differs from the three earlier reads

|                      | Primary board       | Agent slice                 | Records slice    | This slice                                   |
| -------------------- | ------------------- | --------------------------- | ---------------- | -------------------------------------------- |
| Source               | Curated Figma board | Docs + hands-on familiarity | Public docs only | Public docs, changelogs, blogs, some reviews |
| Screens seen         | Every one           | Some                        | None             | 164, mostly fragments                        |
| Claims verifiable by | The board           | The cited docs              | The cited docs   | The board: every capture carries its URL     |

Seven Sonnet readers captured pages headless at 1440x900 and looked at every tile they kept.
Three limits shape everything below:

- **Public material is the happy path.** Not one of the 31 products shows a failed state. Full
  application windows are rare; most captures are a feature crop inside a docs page.
- **Bot walls.** Every OpenAI page (help centre, blog, academy) returned a Cloudflare challenge,
  as did Perplexity, Lovable's home page, Canva and Julius. None was worked around. ChatGPT
  evidence is therefore third-party (NN/g, Search Engine Roundtable, Luzmo), labelled as such.
- **A reader error, corrected.** The first document and presentation pass read a numbered reply
  in the conversation as a product filter and skipped Word Copilot, Canva Docs, PowerPoint
  Copilot and Pitch. A second pass covered them.

**Counting.** D18 counted three work-management entrants once. This draft reports two numbers
for every pattern: **strict** applies that rule (products of one product type count once), and
**loose** counts distinct products. Verdicts use strict. The groupings used:

| Category        | Product types (strict data points)                                                                               |
| --------------- | ---------------------------------------------------------------------------------------------------------------- |
| Answer          | consumer web answer (Perplexity, Google AI Mode, ChatGPT search) · enterprise search (Glean) · academic (Elicit) |
| Agent run       | general-purpose agent (ChatGPT agent, Manus, Genspark) · coding agent (Devin)                                    |
| Data analysis   | notebook BI (Hex) · enterprise NL-to-SQL (Databricks Genie) · conversational analyst (Julius, ChatGPT)           |
| Builder         | app builder (v0, Lovable, Bolt, Replit Agent)                                                                    |
| Voice session   | voice-agent platform (ElevenLabs, Hume) · companion calls (Character.AI) · assistant voice (Gemini Live)         |
| Document editor | office suite (Google Docs, Word Copilot) · workspace (Notion) · add-in (Spellbook) · visual docs (Canva Docs)    |
| Presentation    | office suite (Google Slides, PowerPoint) · standalone decks (Gamma, Pitch) · design tool (Canva)                 |

## 2. Products observed

| Category        | Product          | Source kind        | States seen                    |
| --------------- | ---------------- | ------------------ | ------------------------------ |
| Answer          | Perplexity       | third-party        | empty                          |
|                 | Google AI Mode   | official marketing | done                           |
|                 | ChatGPT search   | third-party        | done                           |
|                 | Glean            | official docs      | empty                          |
|                 | Elicit           | official marketing | working, approval, done        |
| Agent run       | ChatGPT agent    | third-party (NN/g) | working, approval              |
|                 | Manus            | official docs      | working, approval              |
|                 | Devin            | official docs      | working, approval              |
|                 | Genspark         | third-party        | working, done                  |
| Data analysis   | Hex              | official docs      | working, done                  |
|                 | Julius           | third-party        | empty                          |
|                 | ChatGPT          | third-party        | done                           |
|                 | Databricks Genie | official docs      | empty, done                    |
| Builder         | v0               | official docs      | working, done                  |
|                 | Lovable          | official blog      | working                        |
|                 | Bolt             | official docs      | empty, working, approval       |
|                 | Replit Agent     | official docs      | approval, done                 |
| Voice session   | ElevenLabs       | official docs      | empty, working                 |
|                 | Hume EVI         | official marketing | working                        |
|                 | Character.AI     | official blog      | working                        |
|                 | Gemini Live      | third-party        | none usable                    |
| Document editor | Notion AI        | official docs      | empty                          |
|                 | Google Docs      | official docs      | working                        |
|                 | Spellbook        | official marketing | working, done                  |
|                 | Word Copilot     | official docs      | empty, working, approval, done |
|                 | Canva Docs       | third-party        | empty, done                    |
| Presentation    | Gamma            | official docs      | empty, done                    |
|                 | Google Slides    | official docs      | empty                          |
|                 | Canva            | third-party        | empty, done                    |
|                 | PowerPoint       | official docs      | empty, working, done           |
|                 | Pitch            | official blog      | empty, working, done           |

Word Copilot is the best-evidenced product in the slice: Microsoft's support pages carry real
screenshots of every state except failed.

## 3. The finding

**Where the AI sits depends on whether the product was built around it.** What the captures
show, after verification:

- **AI-first** (conversation left, work pane right): v0 and Bolt beside a live preview, Manus
  beside the agent's computer.
- **AI-added** (work surface centre, AI panel docked right): Google Docs and Spellbook beside a
  document; PowerPoint and Pitch beside a slide canvas, with the slide strip on the left.
- **A third arrangement for agents**: a step log on the left and the work detail on the right
  (Devin, Genspark).
- **Canva** puts its AI in the content panel beside the left tool rail, which is
  `studio-shell`'s arrangement, not the AI-added one.
- **Data analysis** shows no side pane anywhere: Hex and Databricks Genie stack question, query
  and result. No capture shows a full window, so this stays unconfirmed.

On 2026-09-26 Nick replaced the collapse test with the AI-first and AI-added split (spec
decision 8); the verified tally is at the end of §4.

**A second pattern crosses categories and has not yet been checked as a claim.** The verifiers
found AI output held for review and applied only on an explicit keep: v0 holds design edits as
pending until applied, Bolt batches visual edits until "Save changes", Word offers keep,
discard, regenerate or refine, PowerPoint's panel carries Keep and Undo, and Notion's
suggestions carry insert and retry. If it holds it is the strongest cross-category pattern in
the slice, and it maps onto K1 `ai-doc-block` (Keep, Edit, Regenerate, Discard) and F7
`approval-card`.

## 4. Inclusion test re-run, verified

On 2026-09-26 seven verifiers re-opened every capture cited for each claim and tried to refute
it. Only what a capture shows counted, not what the page's text describes. Two layout calls
were corrected by hand after looking at the capture: Devin (the docs site's own "Ask a
question" box had been read as Devin's chat) and Canva (its AI panel docks left, beside the
tool rail).

**Confirmed** lists the products whose captures show the pattern, **Strict** counts them under
D18's rule, and **Partly** lists products where only part of it is visible. "Pending" means a
capture on Nick's list could lift the count.

### Answer

| Pattern                                                | Confirmed         | Strict | Partly                                    | Verdict                                              |
| ------------------------------------------------------ | ----------------- | ------ | ----------------------------------------- | ---------------------------------------------------- |
| Search steps that collapse once the answer lands (U13) | none              | 0      | none                                      | not seen; the ChatGPT and Elicit captions overstated |
| Query-first start screen                               | Perplexity, Glean | 2      |                                           | covered by C1 `hero-omnibox`                         |
| Sources panel or cards                                 | ChatGPT search    | 1      | Elicit (the results table is the sources) | covered by K8 `source-cards`                         |
| Full answer page in one window                         | none              | 0      |                                           | not seen                                             |

### Agent run

| Pattern                                  | Confirmed                      | Strict | Partly | Verdict                                     |
| ---------------------------------------- | ------------------------------ | ------ | ------ | ------------------------------------------- |
| Agent viewport (browser, shell, screen)  | ChatGPT agent, Manus, Devin    | 2      |        | pending                                     |
| Takeover or approval prompt              | ChatGPT agent, Manus           | 1      |        | pending; Devin only describes it in text    |
| Step list or live trace                  | ChatGPT agent, Genspark, Devin | 2      |        | pending; N4 `trace-timeline` is the nearest |
| Scrubber labelled "Live" on the viewport | Manus, Devin                   | 2      |        | pending                                     |

### Data analysis

| Pattern                                       | Confirmed | Strict | Partly                                  | Verdict                                        |
| --------------------------------------------- | --------- | ------ | --------------------------------------- | ---------------------------------------------- |
| Editable generated query (U9 `query-preview`) | Hex       | 1      | Julius (code shown, no edit affordance) | pending; Genie's "Show code" is never expanded |
| Result table with row count and timing (U10)  | Hex       | 1      | Databricks Genie (row count only)       | pending                                        |
| One chart with alternatives (U11)             | none      | 0      |                                         | not seen; Hex has a table and chart toggle     |
| Stacked in one column, no side pane           | none      | 0      | Hex, Databricks Genie (cropped)         | pending                                        |

### Builder

| Pattern                                    | Confirmed    | Strict | Partly                               | Verdict            |
| ------------------------------------------ | ------------ | ------ | ------------------------------------ | ------------------ |
| Chat left, live preview right, code toggle | v0           | 1      | Bolt                                 | pending            |
| Build log or console                       | Bolt         | 1      | v0 (a Console tab, never open)       | pending            |
| Line-level code diff (U15)                 | v0           | 1      |                                      | pending            |
| Changed-file tree (U16)                    | none         | 0      | Bolt (a file tree, no changed state) | pending            |
| Checkpoint or rollback                     | Replit Agent | 1      |                                      | pending; Bolt none |

### Voice session

| Pattern                          | Confirmed          | Strict | Partly                            | Verdict |
| -------------------------------- | ------------------ | ------ | --------------------------------- | ------- |
| Orb or visualiser                | ElevenLabs         | 1      | Character.AI (a round avatar)     | pending |
| Live transcript (U2)             | ElevenLabs, Hume   | 1      |                                   | pending |
| Mute and end controls            | Hume, Character.AI | 2      | ElevenLabs (a config toggle)      | pending |
| Voice picker that auditions (U3) | none               | 0      | ElevenLabs (closed dropdown only) | pending |

No capture in this category shows a call in progress.

### Document editor

| Pattern                                | Confirmed              | Strict | Partly                                      | Verdict                                                 |
| -------------------------------------- | ---------------------- | ------ | ------------------------------------------- | ------------------------------------------------------- |
| Document centre, AI panel docked right | Google Docs, Spellbook | 2      |                                             | pending; Word's document and pane never appear together |
| Notion's AI panel floats over the page | Notion AI              | 1      |                                             | the exception, confirmed                                |
| Inline generate on an empty line (K2)  | Canva Docs             | 1      | Word Copilot (a floating button with chips) | pending                                                 |
| AI actions on a selection (K4)         | Word Copilot           | 1      |                                             | pending                                                 |
| AI edits as tracked changes (K3)       | Spellbook              | 1      |                                             | pending                                                 |
| Generated text marked as AI-made       | Canva Docs             | 1      |                                             | pending                                                 |
| "Allow editing" versus "Chat only"     | Word Copilot           | 1      |                                             | noted for N9 `autonomy-selector`                        |

### Presentation (the Q6 check)

| Pattern                                  | Confirmed         | Strict | Partly                                      | Verdict                                   |
| ---------------------------------------- | ----------------- | ------ | ------------------------------------------- | ----------------------------------------- |
| Generate a deck from a prompt            | PowerPoint, Pitch | 2      | Gamma, Canva (the prompt entry, no deck)    | pending; Google Slides not visible        |
| Slide strip left, canvas, AI panel right | PowerPoint, Pitch | 2      |                                             | pending; Google Slides not visible        |
| Outline step before slides               | none              | 0      | PowerPoint (clarifying questions first)     | pending                                   |
| Right-hand properties inspector          | none              | 0      |                                             | not seen; every side panel is an AI panel |
| `studio-shell`'s full arrangement        | none              | 0      | Canva (tool rail, AI content panel, canvas) | not seen                                  |

**Q6, provisional:** two presentation editors (PowerPoint, Pitch) use the AI-added arrangement
and one (Canva) the studio one. Not settled.

### The split test (spec §3.2), verified

| Group    | Products whose captures show it                           | Strict                              | Verdict                                                                       |
| -------- | --------------------------------------------------------- | ----------------------------------- | ----------------------------------------------------------------------------- |
| AI-first | v0, Bolt (app builders); Manus (general agent)            | 2                                   | pending: needs Claude artifacts, Gemini canvas or a full-window ChatGPT agent |
| AI-added | Google Docs, PowerPoint (office suites); Spellbook; Pitch | 3, or 2 if Spellbook counts as Word | passes provisionally, on the Spellbook caveat                                 |

In neither: Devin and Genspark (step log left, work detail right), Notion (floating panel),
Canva (AI in the left content panel), Perplexity and ElevenLabs (single pane).

## 5. What the slice changes in the spec

- **Verification removed both strict passes.** U9 `query-preview` and deck-from-prompt rested on
  captions, not captures. Nothing clears D1 strictly from public material; the AI-added group
  comes closest.
- **The split test.** AI-added passes provisionally on the Spellbook caveat, and a full-window
  Notion or Google Slides capture with a docked AI panel removes the caveat. AI-first is one
  product type short.
- **The order holds**: the AI-added group first (document editor, presentation), then agent
  run, answer, data analysis, builder, voice.
- **Agent run may need its own arrangement**: step log left, work detail right (Devin,
  Genspark), which is in neither group.
- **Builder** cannot clear D1 from app builders alone.

## 6. Not covered, and what closes it

- **Failed states:** none in 31 products. Every session on Nick's list includes one deliberate
  failure.
- **Full windows:** answer, data analysis and voice session have none; presentation has two
  (PowerPoint, Pitch).
- **Blocked products:** every OpenAI surface, Perplexity, Canva, Julius. Nick's ChatGPT session
  covers four categories.
- **Verification:** ran on the public board on 2026-09-26 (seven Sonnet verifiers, about 1.03M
  tokens) and runs again, the same way, on Nick's captures.

## Sources

Every capture on the board carries its own URL. The pages read:

- Answer: byriwa.com/how-to-use-perplexity-ai · search.google/ways-to-search/ai-mode ·
  seroundtable.com (ChatGPT sources, 41864) · docs.glean.com (how to search; how Glean accesses
  info) · elicit.com/solutions/search
- Agent run: nngroup.com/articles/impressions-chatgpt-agent · help.manus.im (take over the
  browser; the cloud computer) · docs.devin.ai/work-with-devin/devin-session-tools ·
  lindy.ai/blog/genspark-ai-features
- Data analysis: learn.hex.tech (SQL cells, query caching) · upsolve.ai/blog/julius-ai-review ·
  luzmo.com/blog/chatgpt-for-data-visualization · docs.databricks.com (talk to Genie; Genie
  monitor)
- Builder: v0.app/docs (code editing; design mode) · lovable.dev/blog/introducing-visual-edits ·
  support.bolt.new (code view; visual edits; release notes) · docs.replit.com (checkpoints and
  rollbacks; updates)
- Voice session: elevenlabs.io/docs (widget) · ui.elevenlabs.io/docs/components (conversation,
  orb, voice picker) · hume.ai/empathic-voice-interface · blog.character.ai (Character Calls) ·
  Google Play (Gemini)
- Document editor: notion.com/help/guides (Notion AI for docs; everything you can do) ·
  support.google.com/docs/answer/14206696 · spellbook.com (review; redline contracts) ·
  support.microsoft.com/word (welcome to Copilot; rewrite; draft; chat) ·
  makeuseof.com (Magic Write) · thissplendidshambles.com (Canva Docs)
- Presentation: help.gamma.app (create; edit with AI) · support.google.com/docs/answer/14207419
  and 17111393 · presentations.ai (Canva AI) · support.microsoft.com (Copilot in PowerPoint;
  prepare a presentation; tutorial) · pitch.com (Pitch Agent; Pitch 2.0; AI presentation maker)
