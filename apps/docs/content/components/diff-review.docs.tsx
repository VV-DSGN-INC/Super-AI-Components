import type { ComponentDocs } from "@/lib/component-docs";
import {
  BulkVerbsApart,
  ParagraphSizedChange,
  RationalePerChange,
  RationaleThatRestatesTheEdit,
} from "./diff-review.examples";

/**
 * Seeded from docs/design-system/component-specs.md#k3-diff-review.
 *
 * No "use client" here: this module is plain data read by a Server Component
 * (component-docs.tsx). Live examples live in the ./diff-review.examples
 * client sidecar and are referenced here as zero-prop elements.
 */
export const DiffReviewDocs: ComponentDocs = {
  whatItIs:
    "Track changes on prose, where every change carries the reason it was made. A paragraph is one run of segments — unchanged, inserted, deleted — so the marks sit inside the sentence at word level rather than stacking a removed line above an added one. Each change gets its own accept and reject, named for the change it resolves; accept-all and reject-all live in a separate region of their own.",
  whyItMatters:
    "This is what an AI rewrite should come back as. Notion AI, Spellbook and Google Docs all converged on track-changes rather than silent replacement, because a model that rewrites your paragraph has made a series of small arguments and you are entitled to disagree with them one at a time. The rationale is the part most implementations skip, and skipping it is what makes review expensive: seven unexplained edits take longer to check than they took to write, so reviewers stop reading and start accepting everything — which is the same as having had no review step. Word-level marks matter for the same economic reason. A line diff on prose tells you the paragraph changed; you then re-read the whole paragraph to find the one word that moved. And the bulk verbs are deliberately somewhere else on screen, because 'accept all' next to 'accept' is a misclick that resolves an entire document.",
  evidence: ["Notion AI", "Spellbook", "Google Docs"],
  anatomy: [
    { slot: "diff-review", note: "The frame. Holds the document, the change list and the bulk region." },
    { slot: "diff-review-header", note: "The label plus the live remaining-changes count." },
    { slot: "diff-review-status", note: "Polite live region. Announces how many changes are still unresolved." },
    { slot: "diff-review-document", note: "The prose. Contains no interactive element at all, by design." },
    { slot: "diff-review-paragraph", note: "One paragraph, one element — a run of segments, never a stack of lines." },
    { slot: "diff-review-segment", note: "One run. Carries `data-kind` of unchanged, inserted or deleted; the changed kinds render as real `ins` and `del` elements." },
    { slot: "diff-review-changes", note: "The ordered review list, one item per change." },
    { slot: "diff-review-change", note: "One change. Carries `data-change-id` and `data-status`." },
    { slot: "diff-review-change-summary", note: "What the change does, derived from its own segments so it cannot drift." },
    { slot: "diff-review-rationale", note: "Why the change was made. Required, always rendered, full contrast." },
    { slot: "diff-review-change-verbs", note: "Per-change accept and reject, each named for its change." },
    { slot: "diff-review-resolution", note: "Replaces the verbs once a change is accepted or rejected, stated in words." },
    { slot: "diff-review-bulk", note: "The separate whole-document region: accept-all and reject-all, below a separator and outside the change list." },
  ],
  usage:
    "Give it `paragraphs` (ordered segment runs) and `changes` (one entry per `changeId`, each with a rationale). Both changed segment kinds require a `changeId`, and every id in the prose should have a matching entry in `changes` — that pairing is what guarantees nothing on screen is unexplained. Supply `onAccept`/`onReject` to get the per-change verbs, and `onAcceptAll`/`onRejectAll` to get the bulk region; omit them all and you have a read-only diff with its reasons, which is the right thing to render in an audit log. Statuses are yours to hold: set a change's `status` to accepted or rejected and the component applies it to the prose — an accepted insertion becomes ordinary text, a rejected one disappears — so the remaining marks are always the remaining work.",
  dos: [
    {
      text: "Write a rationale that says why, not what — the reviewer can already see what changed.",
      example: <RationalePerChange />,
    },
    {
      text: "Offer accept-all and reject-all in their own region, well away from the per-change verbs.",
      example: <BulkVerbsApart />,
    },
  ],
  donts: [
    {
      text: "Don't restate the edit in the rationale; it costs a line and answers nothing.",
      example: <RationaleThatRestatesTheEdit />,
    },
    {
      text: "Don't emit one paragraph-sized change — segment at word level or the reviewer re-reads everything.",
      example: <ParagraphSizedChange />,
    },
  ],
  pitfalls: [
    "Insertion and deletion are never signalled by colour alone. They are real `ins` and `del` elements, they carry visually-hidden lead-in text naming the kind, and on screen they differ by decoration shape — underline versus strike-through. If you restyle them, keep a non-colour distinction or you have reintroduced the exact failure this component was built around.",
    "The per-change buttons are named for their change (\"Accept: replace 'utilise' with 'use'\"), and that name is derived from the segments. Overriding `summary` with something vague gives a screen reader user eight buttons called \"Accept: change\" again.",
    "Nothing inside the document region is clickable. If you make a segment interactive, you cannot then put accept and reject inside it — that is a button inside a button, and it fails the accessibility gate.",
    "The bulk verbs disable themselves when nothing is pending, but they do not confirm. If your document is long enough that accept-all is genuinely risky, wrap it in your own confirmation rather than moving it next to the per-change verbs.",
    "A `changeId` that appears in the prose but not in `changes` renders as a mark with no reason and no verbs. It will look like a bug to the reviewer, because it is one.",
    "The remaining-changes count is a polite live region, so it is announced after whatever the reader is currently on. Don't also toast the same information — they will hear it twice.",
  ],
};
