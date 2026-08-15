import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent } from "storybook/test";

import { AnswerBlock, type AnswerClaim } from "@/registry/super-ai/answer-block";
import { CitationRef } from "@/registry/super-ai/citation-ref";
import { SourceCards } from "@/registry/super-ai/source-cards";
import { AnswerBlockDocs } from "@/content/components/answer-block.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const meta: Meta<typeof AnswerBlock> = {
  title: "Super AI/Answer Block",
  component: AnswerBlock,
  parameters: { layout: "centered", docs: { page: componentDocsPage(AnswerBlockDocs) } },
};

export default meta;
type Story = StoryObj<typeof AnswerBlock>;

/* A retrieval answer over an HR corpus — three claims a reader could check
 * separately, which is what makes claim-level attachment meaningful. */
const CITED_CLAIMS: AnswerClaim[] = [
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
  {
    id: "split",
    text: "The remaining weeks can be split into blocks of at least one week.",
    citations: [
      {
        id: "split-1",
        label: "3",
        source: "leave-policy-emea.docx",
        quote: "Remaining entitlement may be taken in blocks of no fewer than five working days.",
      },
    ],
  },
];

const UNCITED_CLAIMS: AnswerClaim[] = CITED_CLAIMS.map(({ id, text }) => ({ id, text }));

const PARTIAL_CLAIMS: AnswerClaim[] = [
  CITED_CLAIMS[0],
  CITED_CLAIMS[1],
  {
    id: "contractors",
    text: "Contractors accrue the same entitlement after twelve months on assignment.",
  },
];

/* -------------------------------------------------------------------------
 * Declared states. The manifest's raw `states` are catalog free text
 * ("uncited-warning; retrieved-but-uncited shown"); these are the normalized
 * single-situation names, matching the component's own `AnswerCoverage`
 * union plus its two independent props. See the report accompanying this
 * file — the manifest itself is not edited here.
 * ---------------------------------------------------------------------- */

/** Every claim carries a marker. No verdict is rendered, because there is nothing to warn about. */
export const Cited: Story = { args: { claims: CITED_CLAIMS } };

/**
 * Two of three claims are sourced. The spec's load-bearing rule is that this
 * must not read as `cited`: the verdict names the unmarked claims rather than
 * leaving the reader to notice a missing superscript.
 */
export const PartiallyCited: Story = { args: { claims: PARTIAL_CLAIMS } };

/** Nothing is sourced. The strongest verdict, and the one that says not to rely on the answer. */
export const Uncited: Story = { args: { claims: UNCITED_CLAIMS } };

/**
 * The loading shape. Only the final claim is in-flight: it renders its text
 * with no markers yet, because a citation that arrives before the sentence it
 * supports reads as a load failure. Both the coverage verdict and the unused
 * count stay withheld until the answer settles — a verdict on a half-written
 * answer is wrong by construction.
 */
export const Streaming: Story = { args: { claims: CITED_CLAIMS, streaming: true } };

/**
 * A fully cited answer that still used only some of what retrieval returned.
 * The gap is the informative part: it is how a reader notices the model
 * ignored the document they were thinking of. Independent of coverage, which
 * is why it is its own state rather than a clause on `uncited`.
 */
export const RetrievedUnused: Story = { args: { claims: CITED_CLAIMS, retrievedUnused: 3 } };

/**
 * The failure shape. A claim whose source could not be resolved keeps its
 * marker and says so, rather than dropping it — a silently removed citation is
 * how a document stops being verifiable. Note this is the only failure the
 * component can express: it is per-citation, passed straight through to K6.
 * There is no answer-level failure state (generation stopped, retrieval
 * errored) anywhere in `AnswerBlockProps`.
 */
export const CitationUnresolved: Story = {
  args: {
    claims: [
      CITED_CLAIMS[0],
      {
        id: "continuous",
        text: "The first four weeks must be taken continuously, within 12 months of the birth or placement.",
        citations: [{ id: "continuous-1", label: "2", source: "employee-handbook-2026.pdf", state: "unresolved" }],
      },
    ],
  },
};

/* -------------------------------------------------------------------------
 * Case stories — the situations this component meets in a product, as
 * opposed to the prop combinations above. See
 * docs/design-system/story-conventions.md for which of the eight apply.
 *
 * This is the first story file answer-block has ever had, so these are also
 * the first time it renders under axe (CONTINUE.md §9 — it is one of the
 * eleven contractExempt components with no story at all).
 *
 * Not written for this component, deliberately:
 *
 * // case-skip: Controlled — no value/onChange pair; onJumpToSource reports a jump
 * `AnswerBlockProps` exposes `claims`, `streaming` and `retrievedUnused` and
 * nothing else; coverage is derived by `coverageOf` rather than held, so
 * there is no value a parent could own. The one callback in reach,
 * `onJumpToSource`, is picked through to K6 and asks the surrounding surface
 * to scroll a source panel — it reports an intent, it does not propose a new
 * value for this component to render.
 *
 * // case-skip: EmptyLabel — the only optional text slots live inside K6's hovercard
 * `claim.text` is required, and a citation's `label` is the marker's whole
 * accessible name and equally required. The genuinely optional slots are
 * `source` and `quote`, which render inside the hovercard and so are
 * invisible until it opens — a static story of them is pixel-identical to
 * `Cited` and would imply coverage it does not have. The empty-hovercard
 * trap is real and is written up as the docs module's third pitfall, and the
 * rendered case belongs to citation-ref's own story.
 * ---------------------------------------------------------------------- */

/**
 * Right-to-left. Two directional facts, and they do not agree.
 *
 * The verdict row mirrors correctly: `flex items-start gap-1.5` is logical, so
 * the warning triangle leads on the right and the text runs away from it.
 *
 * The citation markers do not. `citation-ref` separates itself from the claim
 * text with `ml-0.5` — a physical left margin — so in RTL the gap opens on the
 * marker's far side and the marker sits flush against the word it follows.
 * Visible here at markers 1 and 2. The one-class fix is `ms-0.5`, and it
 * belongs to K6 rather than this file, so it is reported rather than applied.
 */
export const RTL: Story = {
  render: (args) => (
    <div dir="rtl" className="w-full max-w-md">
      <AnswerBlock {...args} claims={PARTIAL_CLAIMS} retrievedUnused={2} />
    </div>
  ),
};

/**
 * The reduced-motion branch, which lives one level down.
 *
 * `answer-block` itself animates nothing — and notably `streaming` is not an
 * exception, because it renders no in-flight affordance at all: no caret, no
 * spinner, no pulse, only the withholding of markers on the last claim. The
 * single animated element reachable through this component's API is a
 * composed `CitationRef` in its `loading` state, which pulses while its chunk
 * resolves.
 *
 * That one is already correct: it carries `animate-pulse
 * motion-reduce:animate-none`, making it one of the three components in the
 * repo that honour the media feature (CONTINUE.md §9). Because
 * `vitest.config.ts` forces `reducedMotion: "reduce"` for every test, the
 * marker below is rendered with its pulse suppressed in the run that gates —
 * which is the branch this story exists to pin.
 */
export const ReducedMotion: Story = {
  args: {
    claims: [
      CITED_CLAIMS[0],
      {
        id: "continuous",
        text: "The first four weeks must be taken continuously, within 12 months of the birth or placement.",
        citations: [{ id: "continuous-1", label: "2", source: "employee-handbook-2026.pdf", state: "loading" }],
      },
    ],
  },
};

/**
 * Tab traversal. The markers are the only focusable things in an answer, and
 * the contract they carry is positional: a citation belongs to the claim it
 * follows, so DOM order is reading order is tab order. A refactor that hoisted
 * the markers into a footer row would look tidier and would break exactly
 * that, while still rendering three focusable buttons.
 *
 * The loop is bounded by the marker count rather than walking until focus
 * leaves the canvas, because a resolved `CitationRef` is a HoverCard trigger:
 * focusing one can mount popover content carrying focusables of its own, and
 * an unbounded walk has no stable set to terminate on.
 */
export const KeyboardOrder: Story = {
  args: { claims: CITED_CLAIMS },
  play: async ({ canvasElement }) => {
    const markers = Array.from(canvasElement.querySelectorAll<HTMLButtonElement>('[data-slot="citation-ref"]'));

    await expect(markers).toHaveLength(3);
    await expect(markers.map((m) => m.textContent)).toEqual(["1", "2", "3"]);

    for (const marker of markers) {
      await userEvent.tab();
      await expect(document.activeElement).toBe(marker);
      // The KeyboardOrder must-show: every stop is visibly focused.
      await expect(marker.matches(":focus-visible")).toBe(true);
      const style = getComputedStyle(marker);
      await expect(style.boxShadow !== "none" || style.outlineStyle !== "none").toBe(true);
    }
  },
};

/**
 * A 90-character claim, which is an ordinary length for a generated sentence
 * rather than an edge case. The claim is a plain `<p>`, so it wraps and never
 * truncates — the answer to long content is that there is no answer, and none
 * is needed. What the wrap does expose is the marker: `align-super` puts it on
 * the last line beside the final word, so a claim that wraps to exactly the
 * width of its text can orphan the marker onto a line of its own.
 */
export const LongContent: Story = {
  args: {
    claims: [
      {
        id: "eligibility",
        text: "Employees who joined before the policy took effect keep their previous entitlement until it lapses.",
        citations: [
          {
            id: "eligibility-1",
            label: "1",
            source: "employee-handbook-2026.pdf",
            quote: "Grandfathered entitlements persist until the end of the leave year in which they were accrued.",
          },
        ],
      },
      CITED_CLAIMS[2],
    ],
  },
};

/**
 * 375px. The answer is a column of paragraphs, so it reflows without
 * horizontal scroll — the thing worth checking at this width is the verdict
 * row, whose `items-start` keeps the warning triangle aligned to the first
 * line of a message that now wraps to three. `items-center` would drift the
 * icon into the middle of the block as the text grows.
 */
export const Mobile: Story = {
  render: (args) => (
    <div className="w-[375px] max-w-full">
      <AnswerBlock {...args} claims={PARTIAL_CLAIMS} retrievedUnused={2} />
    </div>
  ),
};

/**
 * The three parts of a grounded answer, which are routinely confused because
 * they all show provenance. The rule is what each one is answering:
 *
 * - **Citation ref** answers "where did this sentence come from". It is one
 *   marker on one claim, and it has no opinion about the answer around it.
 * - **Answer block** answers "how much of this answer is sourced". It owns
 *   claim-level attachment and the verdict across claims — the judgment no
 *   single marker can make.
 * - **Source cards** answer "what did retrieval find". It is the corpus
 *   behind the answer, including what was found and deliberately not used.
 *
 * If you are rendering prose you already own and want to attach a source to
 * one sentence, reach for K6. If a reader needs to know whether to trust the
 * whole reply, that is K7. If the question is about the documents rather than
 * the answer, it is K8. The two counts are meant to agree: the three unused
 * sources K7 reports below are the three K8 renders as "Retrieved, not used".
 */
export const Boundary: Story = {
  render: () => (
    <div className="flex w-full max-w-md flex-col gap-6">
      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">Citation ref — one sentence&rsquo;s source</p>
        <p className="text-sm">
          Statutory parental leave in the EMEA entities is 16 weeks at full pay.
          <CitationRef
            label="1"
            source="leave-policy-emea.docx"
            quote="Eligible employees receive 16 weeks of parental leave at 100% of base salary."
          />
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">Answer block — the whole answer&rsquo;s coverage</p>
        <AnswerBlock claims={PARTIAL_CLAIMS} retrievedUnused={3} />
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">Source cards — the corpus behind it</p>
        <SourceCards
          sources={[
            { id: "s1", title: "leave-policy-emea.docx", relevance: "high", used: true },
            { id: "s2", title: "employee-handbook-2026.pdf", relevance: "high", used: true },
            { id: "s3", title: "benefits-faq.md", relevance: "medium" },
            { id: "s4", title: "leave-policy-amer.docx", relevance: "low" },
            { id: "s5", title: "onboarding-checklist.md", relevance: "low" },
          ]}
        />
      </section>
    </div>
  ),
};
