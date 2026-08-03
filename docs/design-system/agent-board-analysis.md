# Agent board analysis — second reference population, slice 1

**Scope:** Enterprise assistants and tool-calling agents — the first of the categories
[gaps.md](gaps.md) §5 Move 3 committed to sampling.
**Read:** 2026-08-03.
**Status:** Actions Move 3 for **one slice only**. Voice, extraction, vision, data and coding
remain unsampled; the §1 limitation still stands for those.

---

## 1. Method — and how it differs from the primary board

The [primary board](reference-board-analysis.md) was read through the Figma MCP server, section by
section, off a curated board of product screenshots. **This slice was not.** There is no Figma board
for agent products, and pretending to parity would be worse than saying so.

| | Primary board | This slice |
| --- | --- | --- |
| Source | Curated Figma board of screenshots | Product documentation, framework references, published UI analyses |
| Unit of evidence | An observed screen | A documented, named behaviour or surface |
| Rigour | Direct visual anatomy | Named pattern + at least one citable description |
| Failure mode | Sampling bias (§1 of gaps.md) | Documentation describes intent, not always pixels |

**Consequence for the inclusion test.** D1 counts *products*, not sources. That still works here, but
the evidence for each count is a documented pattern rather than a screenshot. Where a count rests on
framework documentation rather than a shipped UI, the row is marked ⚠ and **must be verified against
the running product before it earns a spec.**

This is a weaker read than the primary board. It is strong enough to move items from *speculation*
to *candidate with named evidence*, which is exactly what §4 of gaps.md asked for and no more.

---

## 2. Products and frameworks observed

| Area | Observed |
| --- | --- |
| Agent frameworks (HITL) | OpenAI Agents SDK, Microsoft Agent Framework (+ AG-UI), LangChain / LangGraph, Laravel AI SDK |
| Coding agents | Claude Code, GitHub Copilot (coding agent + background agents), Cursor |
| CX / support agents | Sierra, Decagon, Intercom Fin, Voiceflow |
| Enterprise search & grounded answers | Glean, NotebookLM (incl. Enterprise), iManage "Ask iManage", Microsoft Copilot Studio + Azure AI Search |
| Conversation frameworks | Rasa (default patterns), Google Assistant conversation design |
| Research agents | Perplexity, Manus, ChatGPT deep research, Gemini |
| Task delegation | ChatGPT Workspace Agents, Microsoft Copilot Tasks, GitHub Copilot async delegation |
| Guardrails | AWS Bedrock Guardrails |
| Enterprise design systems | ServiceNow Horizon (`now-ai-summary-card`) |

Deliberately **not** counted as independent products: Claude Code and the Claude chat client (same
vendor); Copilot coding agent and Copilot Tasks (same vendor). D1 says *unrelated* products, and
vendor siblings are one datapoint, not two.

---

## 3. The load-bearing finding

**The conversation-state layer is real, universal, and has no UI.**

Rasa ships it as *named default patterns* — `pattern_correction`, `pattern_clarification`,
`pattern_cannot_handle`, `pattern_continue_interrupted`, `pattern_validate_slot`,
`pattern_human_handoff`, `pattern_skip_question`, `pattern_user_silence`, `pattern_internal_error`,
`pattern_cancel_flow`, `pattern_completed`. Google's conversation-design guidance ships the same
territory as confirmation policy. Every CX agent implements the handoff case.

But almost none of it surfaces as **chrome**. It surfaces as *behaviour* — different words, a
different next turn, a different route. `pattern_continue_interrupted` ("resume what we were doing?")
has no standard visual anywhere in the population.

**So the right output here is a contract, not a component family.** A contract is how this catalog
already models behaviour that crosses components without owning pixels — Token, State, Cost,
Provenance, Empty, Approval. Dialog is the seventh. Shipping `repair-prompt` and `slot-summary` as
components without the contract would ship the chrome and miss the behaviour, which is the actual
product requirement.

This is the second time the board has answered a question the catalog did not ask. The first was
Empty.

---

## 4. Inclusion test re-run

Counting unrelated products per D1. Candidates come from gaps.md §3 (T) and §4 (U), plus what this
slice surfaced on its own.

### Passes

| Candidate | Count | Products | Verdict |
| --- | --- | --- | --- |
| `permission-prompt` (T1) | 5 | OpenAI Agents SDK, Microsoft Agent Framework, LangChain, Laravel AI SDK, Claude Code | **Already shipped as N8 — now evidenced, not reasoned.** See §5 |
| `escalation-handoff` `NEW` | 5 | Sierra, Decagon, Intercom Fin, Voiceflow, Rasa | **PASS** — strongest result in the slice |
| `autonomy-selector` (T2) | 4 | Claude Code, Cursor, GitHub Copilot, ChatGPT Workspace Agents | **PASS** |
| `answer-block` (U12) | 4 | Glean, NotebookLM, iManage, Copilot Studio | **PASS** |
| `task-tray` (T3) | 4 | GitHub Copilot, ChatGPT Workspace Agents, Copilot Tasks, Manus | **PASS** — was 1 on the creative board |
| `safety-block` (T4) ⚠ | 3 | AWS Bedrock Guardrails, ChatGPT, Claude | **PASS**, verify pixels |
| `slot-summary` `NEW` ⚠ | 3 | Google Assistant, Rasa, ServiceNow Horizon | **PASS**, verify pixels |
| `source-cards` (U14) | 3 | Glean, NotebookLM, Perplexity | **PASS** |

### Fails or defers

| Candidate | Count | Verdict |
| --- | --- | --- |
| `repair-prompt` `NEW` | 2 | **FAIL as a component.** Rasa and Google both model repair as *behaviour*; no shared chrome. Absorbed by the Dialog contract instead |
| `interrupted-flow-resume` `NEW` | 1 | **FAIL.** Rasa `pattern_continue_interrupted` only. Real requirement, no observed UI — becomes a contract obligation |
| `confidence-badge` (U5) | 1 | **DEFER** — its evidence lives in the extraction/vision slice, which is unsampled |
| `correction-queue` (U6) | 1 | **DEFER** — same |
| `trace-timeline` (N4) | 4 | Already in the catalog; Manus, Perplexity, ChatGPT, Gemini **re-validate** it. No change |
| `connection-manager` (T5) | — | Already shipped by D12. Not re-tested |

**Net: six additions** — one new component family member evidenced (`escalation-handoff`), four
promoted from PROPOSED to validated (`autonomy-selector`, `task-tray`, `safety-block`,
`slot-summary`), and two grounded-answer items (`answer-block`, `source-cards`). Plus one contract.

---

## 5. What the slice corrected about existing items

**N8 `permission-prompt` — the fourth verb is confirmed, and it is the important one.**
Every framework in the population implements approve / reject / **edit** on a paused tool call, not
just allow/deny. gaps.md guessed "edit-first" from first principles; the population agrees
unanimously. Reject discards the agent's work; edit-first keeps it and puts the human in the loop
productively. The spec should make edit-first equal in weight to allow, not a tertiary action.

**N8's scope surface is under-specified.** Claude Code's permission model is allow / deny / ask
rules where *deny wins and cannot have allowlist exceptions* — the denylist is the real boundary,
which is what makes a generous allowlist safe. "Always allow" without a visible, revocable scope
list is a grant with no review surface. That review surface is the component nobody in the
population ships well, and it belongs in T2's spec, not T1's.

**T4 `safety-block`'s input/output split was right.** AWS Bedrock Guardrails configures the blocked
message separately for a blocked *prompt* and a blocked *response*. gaps.md called that split from
reasoning alone.

**The design rule T4 needs, which the population gets wrong:** refusals are typically delivered in
the assistant's own voice, so the user cannot tell a system policy fired rather than the model being
evasive. A block must be visibly *not the assistant talking*. That is the whole reason it is a
component and not a message.

---

## 6. What this slice does not cover

Unchanged from gaps.md §1 — voice, extraction, vision, data/analytics, search-as-product and coding
agents remain unsampled as *categories*, even where individual coding-agent products appear above as
evidence for agent-generic patterns. The twenty U-items are now nineteen candidates and one
deferral; they are not commitments.

**Open question for the next slice:** does `confidence-badge` become the 13th primitive? Three of
this slice's passers (`slot-summary`, `answer-block`, `source-cards`) each want confidence banding,
which is the strongest argument yet for promoting it — but its own evidence is still unsampled, and
promoting a primitive on its consumers' say-so is how A8 nearly went wrong.

---

## Sources

- [Human-in-the-loop — OpenAI Agents SDK](https://openai.github.io/openai-agents-python/human_in_the_loop/)
- [Using function tools with human in the loop approvals — Microsoft Learn](https://learn.microsoft.com/en-us/agent-framework/agents/tools/tool-approval)
- [Human-in-the-Loop with AG-UI — Microsoft Learn](https://learn.microsoft.com/en-us/agent-framework/integrations/ag-ui/human-in-the-loop)
- [Human-in-the-Loop — LangChain docs](https://docs.langchain.com/oss/python/langchain/frontend/human-in-the-loop)
- [Laravel AI SDK adds human-in-the-loop tool approval](https://laravel-news.com/laravel-ai-sdk-adds-human-in-the-loop-tool-approval)
- [Choose a permission mode — Claude Code docs](https://code.claude.com/docs/en/permission-modes)
- [Patterns — Rasa documentation](https://rasa.com/docs/reference/primitives/patterns/)
- [Confirmations — Google conversation design](https://developers.google.com/assistant/conversation-design/confirmations)
- [Human agent handoff — Voiceflow](https://www.voiceflow.com/blog/human-agent-handoff)
- [Complete AI customer support setup — Decagon](https://decagon.ai/blog/ai-customer-support-setup)
- [Top AI assistants for accurate source citations — Glean](https://www.glean.com/perspectives/top-ai-assistants-for-accurate-source-citations)
- [Async task delegation — GitHub Copilot CLI](https://deepwiki.com/github/copilot-cli/3.8-async-task-delegation)
- [Workspace Agents — OpenAI](https://developers.openai.com/workspace-agents)
- [Deep research UIs — Perplexity vs Manus vs ChatGPT vs Gemini](https://www.franciscomoretti.com/blog/comparing-deep-research-uis)
- [AI Summary Card — ServiceNow Horizon design system](https://horizon.servicenow.com/workspace/components/now-ai-summary-card)
