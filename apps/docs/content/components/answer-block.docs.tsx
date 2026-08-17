import type { ComponentDocs } from "@/lib/component-docs";
import { AnswerBlock } from "@/registry/super-ai/answer-block";

/**
 * Seeded from docs/design-system/component-specs.md#k7-answer-block.
 * Translate the spec's internal voice into consumer-facing guidance — do not
 * ship the seed text verbatim.
 *
 * No "use client" here: this module is plain data read by a Server Component
 * (component-docs.tsx). The examples below are safe to inline rather than
 * split into an .examples.tsx sidecar because every one of them passes data
 * only — `claims`, `streaming`, `retrievedUnused`. Nothing here carries an
 * event handler, so nothing has to cross the server/client boundary. Add the
 * sidecar the moment an example needs `onJumpToSource`.
 */
export const AnswerBlockDocs: ComponentDocs = {
  whatItIs:
    "The body of a grounded answer: a list of claims, each carrying its own inline citation markers, plus a verdict on how much of the answer is actually sourced. It composes citation-ref for the markers themselves and adds the two things a single marker cannot express — the coverage of the answer as a whole, and the gap between what retrieval found and what the answer used.",
  whyItMatters:
    "Every enterprise assistant that answers from documents has to answer a second question alongside the first: how much of this should you believe. Glean, NotebookLM, Ask iManage and Microsoft Copilot Studio all attach provenance at the sentence rather than the reply, because a citation bar under a paragraph tells you the paragraph came from somewhere without telling you which sentence. The part worth copying is the coverage verdict: an answer where two of five claims are sourced looks, at a glance, exactly like an answer where all five are, and the only thing standing between a user and that misreading is a component that refuses to render them the same way.",
  evidence: ["Glean", "NotebookLM", "iManage", "Microsoft Copilot Studio"],
  anatomy: [
    { slot: "answer-block", note: "Root. Carries data-coverage (cited/partially-cited/uncited) and data-streaming." },
    {
      slot: "answer-block-claim",
      note: "One claim paragraph, with its markers inline at the end. Carries data-settled — absent on the in-flight claim while streaming.",
    },
    {
      slot: "answer-block-coverage-warning",
      note: "The verdict, rendered only when coverage isn't `cited` and only once streaming has finished.",
    },
    {
      slot: "answer-block-unused",
      note: "The retrieved-but-unused count. Rendered only after streaming, and only when the count is above zero.",
    },
  ],
  usage:
    "Give it the answer already split into claims — one claim per assertion a reader could check independently, not one per paragraph — and attach citations to the claim they support rather than to the block. Coverage is derived, never declared: pass citations where you have them and the component works out whether the answer reads as sourced, partly sourced or unsourced. While tokens are still arriving, hold `streaming` true and append claims as they complete; the component suppresses both the coverage verdict and the unused-source count until the answer settles, because a verdict on a half-written answer is wrong by construction. Pair it with source-cards when the reader needs the corpus behind the answer, and pass `retrievedUnused` so the two agree on how much went unused.",
  dos: [
    {
      text: "Split the answer into one claim per independently checkable assertion, so a marker points at the sentence it supports rather than the paragraph.",
      example: (
        <AnswerBlock
          claims={[
            {
              id: "length",
              text: "Statutory parental leave in the EMEA entities is 16 weeks at full pay.",
              citations: [
                {
                  id: "length-1",
                  label: "1",
                  source: "leave-policy-emea.docx",
                  quote: "Eligible employees receive 16 weeks of parental leave at 100% of base salary.",
                },
              ],
            },
            {
              id: "continuous",
              text: "The first four weeks must be taken continuously, within 12 months of the birth or placement.",
              citations: [
                {
                  id: "continuous-1",
                  label: "2",
                  source: "employee-handbook-2026.pdf",
                  quote: "The initial four-week block is continuous and must begin within 12 months.",
                },
              ],
            },
          ]}
        />
      ),
    },
    {
      text: "Pass retrievedUnused so the answer says out loud how much of what was retrieved it ignored.",
      example: (
        <AnswerBlock
          retrievedUnused={3}
          claims={[
            {
              id: "split",
              text: "The remaining weeks can be split into blocks of at least one week.",
              citations: [
                {
                  id: "split-1",
                  label: "1",
                  source: "leave-policy-emea.docx",
                  quote: "Remaining entitlement may be taken in blocks of no fewer than five working days.",
                },
              ],
            },
          ]}
        />
      ),
    },
  ],
  donts: [
    {
      text: "Don't hand it one claim holding the whole answer — the marker then means the same unhelpful thing a citation bar under a paragraph means.",
      example: (
        <AnswerBlock
          claims={[
            {
              id: "everything",
              text: "Statutory parental leave in the EMEA entities is 16 weeks at full pay. The first four weeks must be taken continuously, within 12 months of the birth or placement. The remaining weeks can be split into blocks of at least one week.",
              citations: [
                {
                  id: "everything-1",
                  label: "1",
                  source: "leave-policy-emea.docx",
                  quote: "Eligible employees receive 16 weeks of parental leave at 100% of base salary.",
                },
              ],
            },
          ]}
        />
      ),
    },
    {
      text: "Don't drop the claims you couldn't source to make the answer read as fully cited — a partially-cited answer that renders as cited is the failure this component exists to prevent.",
      example: (
        <AnswerBlock
          claims={[
            {
              id: "kept",
              text: "Statutory parental leave in the EMEA entities is 16 weeks at full pay.",
              citations: [
                {
                  id: "kept-1",
                  label: "1",
                  source: "leave-policy-emea.docx",
                  quote: "Eligible employees receive 16 weeks of parental leave at 100% of base salary.",
                },
              ],
            },
            {
              id: "dropped",
              text: "Contractors accrue the same entitlement after twelve months on assignment.",
            },
          ]}
        />
      ),
    },
  ],
  accessibility: {
    keyboard: [
      "The block has exactly one tab stop per citation marker and none of its own. An answer of five claims carrying nine markers is nine Tab presses, and the claim text between them is not focusable.",
      "A `loading` or `unresolved` marker is still a real `<button>`, and still a tab stop, but has no `onClick` — pressing it does nothing. Only a `resolved` marker with `onJumpToSource` actually goes anywhere.",
      "Focusing a resolved marker opens its hovercard, so the quoted chunk is reachable without a pointer. Nothing dismisses it from the keyboard except moving focus away; there is no Escape handler on the card.",
      "There is no arrow-key movement between markers, no shortcut to the next citation, and no key that jumps from a claim to its sources.",
    ],
    screenReader: [
      "A resolved marker's accessible name is its `label` and nothing else, so it announces as \"1, button\" — with no word saying it is a citation. Only the `unresolved` state gets a written name, \"Citation 1 — source unavailable\".",
      "That unresolved name is built from `typeof label === \"string\"`, and a numeric `label` is not a string. Passing `label={1}` rather than `label=\"1\"` degrades every broken marker in the answer to the identical \"Citation  — source unavailable\".",
      "The hovercard is portalled with no `aria-describedby`, no role and no other relationship back to the marker. Focus opens it visually, but the source name and the quoted chunk are never announced with the marker — a screen-reader user hears the number and nothing behind it.",
      "The coverage warning is an ordinary paragraph, not an alert and not a live region. An answer that finishes streaming with nothing sourced announces nothing; the sentence is only found by reading on.",
      "`data-coverage` on the root reaches styling and tests, never assistive technology. \"Partially cited\" is carried entirely by that warning sentence.",
      "The retrieved-but-unused count is likewise plain text with no live region — the single most informative line on the surface arrives silently.",
      "The warning triangle is the one icon here without `aria-hidden`, so unlike every other glyph in this registry it is not explicitly removed from the accessible tree.",
    ],
    focus: [
      "Nothing here moves focus. `onJumpToSource` scrolls your source panel; moving focus into the chunk it scrolled to is your job, and without it a keyboard user is told nothing happened.",
      "Markers carry their own `focus-visible:ring-2`, so they are visible on focus even inside a consumer with no global focus style.",
      "While `streaming`, the final claim renders without its markers and gains them when it settles. A marker therefore appears in the tab order behind wherever focus already is, which is harmless — but appending a claim before the previous one has its citations makes markers materialise mid-answer under a user who has already tabbed past.",
    ],
  },
  pitfalls: [
    "Coverage is computed from the claims you pass, not from a prop — a claim with an empty `citations` array counts as uncited exactly like one with the key omitted. So a retrieval step that returns an empty array on failure silently downgrades the whole answer to `partially-cited`, complete with the warning, and the only clue is a marker that never appears.",
    "`streaming` suppresses the coverage warning and the unused-source count, not the citations themselves. Only the last claim in the array is treated as in-flight; every earlier one renders its markers as normal. If you append a new claim before the previous one has its citations attached, that previous claim settles uncited and the answer's coverage moves under the reader.",
    "A citation with no `quote` still renders a marker, and the hovercard it opens is then empty — the reader gets a claim that looks sourced and cannot be checked. `source` alone names a document; it does not make the claim verifiable. Pass the retrieved chunk.",
    "The component renders no in-flight affordance of its own. `streaming` changes what is withheld, not what is shown — there is no caret, spinner or pulse on the answer, so on a slow first token an empty AnswerBlock is indistinguishable from one that has finished with nothing to say. Supply that signal from the surrounding surface.",
  ],
};
