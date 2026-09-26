# AI app types board analysis: second reference population, slice 3

**Scope:** seven AI app types no shell covers: answer, agent run, data analysis, builder, voice
session, document editor, presentation (the Q6 check).
**Read:** 2026-09-25, public material only.
**Status:** DRAFT. Nick's own-account captures are pending, and so is the pass that re-checks
every inclusion claim against its capture. No decision rests on this draft; D26 waits for both.
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

**The AI panel sits on a different side depending on who came first.** Where the product was
built around the AI, the conversation is the left column and the work surface is the right
pane: v0 and Bolt (preview), ChatGPT agent and Manus (the agent's browser or computer). Where AI
was added to an existing editor, the work surface keeps the centre and the AI docks right as an
assistant pane: Google Docs, Word Copilot and Spellbook beside a document; PowerPoint, Pitch and
Google Slides beside a slide canvas with the slide strip on the left.

This matters for the collapse test (spec §3.2). The grouping it was written for (builder, data
analysis, agent run) does not hold, because data analysis does not use a side pane at all: Hex
and Databricks Genie stack the question, the query and the result in one column. The grouping
the evidence does suggest is two families of layout, AI-first and AI-added, and it crosses
categories. On 2026-09-26 Nick replaced the collapse test with that split (spec decision 8);
the provisional tally is at the end of §4.

## 4. Inclusion test re-run, provisional

"Pending" means strict is below three but a capture on Nick's list could lift it.

### Answer

| Pattern                                                | Loose | Strict | Seen in                | Verdict                      |
| ------------------------------------------------------ | ----- | ------ | ---------------------- | ---------------------------- |
| Search steps that collapse once the answer lands (U13) | 2     | 2      | ChatGPT search, Elicit | pending (Perplexity)         |
| Query-first start screen                               | 2     | 2      | Perplexity, Glean      | covered by C1 `hero-omnibox` |
| Sources panel or cards                                 | 2     | 2      | ChatGPT search, Elicit | covered by K8 `source-cards` |
| Full answer-page layout                                | 0     | 0      | none                   | not seen                     |

### Agent run

| Pattern                                   | Loose | Strict | Seen in                        | Verdict                                             |
| ----------------------------------------- | ----- | ------ | ------------------------------ | --------------------------------------------------- |
| Agent viewport (browser, shell or screen) | 3     | 2      | ChatGPT agent, Manus, Devin    | pending                                             |
| Takeover or approval prompt               | 3     | 2      | ChatGPT agent, Manus, Devin    | pending; N8 `permission-prompt` is the nearest item |
| Step list or live trace                   | 3     | 2      | ChatGPT agent, Genspark, Devin | pending; N4 `trace-timeline` is the nearest item    |
| Live and replay scrubber on the viewport  | 2     | 2      | Manus, Devin                   | pending                                             |

### Data analysis

| Pattern                                       | Loose | Strict | Seen in                       | Verdict    |
| --------------------------------------------- | ----- | ------ | ----------------------------- | ---------- |
| Editable generated query (U9 `query-preview`) | 3     | 3      | Hex, Databricks Genie, Julius | **passes** |
| Result table with row count and timing (U10)  | 2     | 2      | Hex, Databricks Genie         | pending    |
| One chart with alternatives (U11)             | 0     | 0      | none                          | fails      |
| Result stacked in the thread, no side pane    | 2     | 2      | Hex, Databricks Genie         | pending    |

### Builder

| Pattern                                    | Loose | Strict | Seen in            | Verdict                                   |
| ------------------------------------------ | ----- | ------ | ------------------ | ----------------------------------------- |
| Chat left, live preview right, code toggle | 2     | 1      | v0, Bolt           | pending (Claude artifacts, Gemini canvas) |
| Build log or console strip (U17)           | 2     | 1      | v0, Bolt           | pending                                   |
| Code diff (U15)                            | 1     | 1      | v0                 | fails for now                             |
| Changed-file tree (U16)                    | 1     | 1      | Bolt               | fails for now                             |
| Checkpoint or version control              | 2     | 1      | Bolt, Replit Agent | pending                                   |

All four builders are app builders, so the category is one data point until a general
assistant's builder (Claude artifacts, Gemini canvas) is captured.

### Voice session

| Pattern                          | Loose | Strict | Seen in                           | Verdict       |
| -------------------------------- | ----- | ------ | --------------------------------- | ------------- |
| Orb or visualiser                | 2     | 2      | ElevenLabs, Character.AI (avatar) | pending       |
| Live transcript (U2)             | 2     | 1      | ElevenLabs, Hume                  | pending       |
| Mute and end controls            | 3     | 2      | ElevenLabs, Hume, Character.AI    | pending       |
| Voice picker that auditions (U3) | 1     | 1      | ElevenLabs                        | fails for now |

ElevenLabs publishes its orb, conversation and voice-picker as an MIT UI kit
(`ui.elevenlabs.io`). That is the differentiation question already recorded for the AI-Orb repo.

### Document editor

| Pattern                                 | Loose | Strict | Seen in                              | Verdict                              |
| --------------------------------------- | ----- | ------ | ------------------------------------ | ------------------------------------ |
| Document centre, AI panel docked right  | 3     | 2      | Google Docs, Word Copilot, Spellbook | pending (Notion's panel floats)      |
| Inline generate on an empty line (K2)   | 2     | 2      | Word Copilot, Canva Docs             | pending; Notion describes it in text |
| AI actions on a selection (K4)          | 2     | 1      | Google Docs, Word Copilot            | pending                              |
| AI edits as tracked changes (K3)        | 1     | 1      | Spellbook (Word states it in text)   | pending                              |
| Generated text marked as AI-made        | 2     | 2      | Canva Docs, Spellbook                | pending                              |
| "Allow editing" versus "Chat only" gate | 1     | 1      | Word Copilot                         | noted for N9 `autonomy-selector`     |

### Presentation (the Q6 check)

| Pattern                                  | Loose | Strict | Seen in                                        | Verdict    |
| ---------------------------------------- | ----- | ------ | ---------------------------------------------- | ---------- |
| Generate a deck from a prompt            | 5     | 3      | Gamma, Google Slides, Canva, PowerPoint, Pitch | **passes** |
| Slide strip left, canvas, AI panel right | 3     | 2      | PowerPoint, Pitch, Google Slides               | pending    |
| Outline step before slides               | 2     | 1      | Google Slides, PowerPoint                      | pending    |
| Right-hand properties inspector          | 0     | 0      | none                                           | not seen   |
| `studio-shell`'s full arrangement        | 0     | 0      | none                                           | not seen   |

**Q6, provisional:** `studio-shell` does not cover presentation apps as drawn. They keep the
strip on the left and give the right side to the AI, not to an inspector. Full-window captures
of Gamma and Google Slides decide it.

### The split test (spec §3.2), provisional

| Group    | Arrangement                                                        | Products that show it                                                                 | Loose | Strict                                                                             | Verdict                                   |
| -------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------- | ----- | ---------------------------------------------------------------------------------- | ----------------------------------------- |
| AI-first | conversation left, one work pane right, controls on the pane       | v0, Bolt (app builders); ChatGPT agent, Manus (general agents)                        | 4     | 2                                                                                  | pending (Claude artifacts, Gemini canvas) |
| AI-added | document or canvas centre, AI panel docked right, opens and closes | Google Docs, Word Copilot, Google Slides, PowerPoint (office suite); Spellbook; Pitch | 6     | 3, or 2 if Spellbook counts as Word, since the arrangement is Word's own task pane | passes provisionally                      |

Not in either: Devin nests Progress, Shell, Code and Browser tabs inside its work pane with the
chat below it; Genspark splits a trace log from a result pane; Notion's AI panel floats over
the page rather than docking. If the AI-added group holds after verification, presentation is a
recipe on that shell and Q6 closes as "not `studio-shell`".

## 5. What the slice changes in the spec

- **The collapse test's grouping fails on data analysis** (§3), and Nick replaced it with the
  AI-first and AI-added split on 2026-09-26. The AI-added group passes provisionally; the
  AI-first group needs one more product type.
- **The order.** Document editor stays first: every component it needs ships and its layout is
  the best-evidenced of the seven. Answer should drop behind agent run; no answer page was seen
  whole.
- **U-items.** U9 passes. U10, U11, U13, U15 to U17, U2 and U3 fail or are pending, as above.
- **Builder** cannot clear D1 from app builders alone.

## 6. Not covered, and what closes it

- **Failed states:** none in 31 products. Every session on Nick's list includes one deliberate
  failure.
- **Full windows:** answer, data analysis and presentation have none.
- **Blocked products:** every OpenAI surface, Perplexity, Canva, Julius. Nick's ChatGPT session
  covers four categories.
- **Verification:** every row in §4 is re-checked against its cited capture after Nick's
  captures land, one pass over the whole board.

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
