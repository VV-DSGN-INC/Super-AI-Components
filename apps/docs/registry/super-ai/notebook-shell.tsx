"use client";

import { MessagesSquare, Sparkles } from "lucide-react";
import * as React from "react";

import { Conversation, ConversationContent } from "@/components/ai-elements/conversation";
import { Message, MessageContent } from "@/components/ai-elements/message";
import { cn } from "@/lib/utils";
import { AnswerBlock, type AnswerCitation } from "@/registry/super-ai/answer-block";
import type { CitationState } from "@/registry/super-ai/citation-ref";
import { ContextChip, ContextChips, type ContextChipKind } from "@/registry/super-ai/context-chips";
import { DisclaimerNote } from "@/registry/super-ai/disclaimer-note";
import { EmptyState } from "@/registry/super-ai/empty-state";
import { FeatureCardRow, type FeatureCardRowItem } from "@/registry/super-ai/feature-card-row";
import { MediaPromptBar, type MediaPromptBarProps } from "@/registry/super-ai/media-prompt-bar";
import { ResultCard, type ResultCardProps } from "@/registry/super-ai/result-card";
import { SourcePanel, type SourcePanelSource } from "@/registry/super-ai/source-panel";

/**
 * Notebook Shell — three-pane sources ‖ chat ‖ outputs
 *
 * Spec: docs/design-system/block-specs.md#o13-notebook-shell
 * Regions: sources · chat · composer · studio-outputs
 *
 * Three sentences from the spec drive everything here:
 *
 * 1. "Three panes, each independently empty-able. On first load all three are
 *    empty at once — the case that turned the empty contract into a contract."
 *    So every pane is mounted unconditionally and falls to its own L1
 *    `empty-state`: K5 supplies the left pane's, the shell supplies the middle
 *    and the right. Nothing here is written for the populated case first.
 * 2. "Citations in the middle pane resolve into the left pane. Two ends of one
 *    mechanism, not two features." A citation therefore carries a `sourceId`
 *    rather than a hand-wired `onJumpToSource` — the shell owns the jump, and
 *    a citation pointing at a source that is not in the panel resolves to K6's
 *    `unresolved` state on its own rather than silently looking fine.
 * 3. "The right pane is a menu of output types, not a canvas. Choosing 'Audio
 *    Overview' or 'Mind Map' generates into that pane." The type menu is C3
 *    `feature-card-row` and it is always present; results land underneath it as
 *    F1 `result-card`s, in the same pane, never in a new surface.
 *
 * The chat pane composes AI Elements' `Conversation` and `Message` — the same
 * two surfaces O2 `chat-shell` composes, from a different vendor's registry
 * (registry.ai-sdk.dev), declared on the manifest row's `external` field. A
 * second hand-rolled message bubble in the same catalog would be the exact
 * defect this layer exists to prevent.
 */

/**
 * `use-stick-to-bottom` renders its own scroll element between
 * `ConversationContent`'s root and its children and sets no overflow on it, so
 * without this the chat pane does not scroll, it grows. It has to go through
 * `scrollClassName` — the only handle exposed on that element — which is also
 * why the region's tab stop and accessible name sit on `Conversation` instead.
 */
const CHAT_SCROLL = "h-full overflow-y-auto";

/**
 * D1 is the media-gen omnibox and offers a negative-prompt field in every
 * presentation but `node-embedded`. A notebook composer asks questions of
 * documents; there is nothing to negate. D1 exposes no opt-out —
 * `negativePrompt={false}` only closes the panel and leaves the toggle — so the
 * control is suppressed here, `display:none` rather than a visual hide so it
 * leaves the tab order and the accessibility tree too. Delete this the moment
 * D1 grows a real opt-out.
 */
const COMPOSER_NO_NEGATIVE_PROMPT = "[&_[data-slot=media-prompt-bar-negative-toggle]]:hidden";

/**
 * C3's carousel arrows are positioned `-left-12`/`-right-12` and vertically
 * centred — three rem *outside* the row, which is correct on a page with
 * margins and wrong in a twenty-rem studio pane, where both land outside the
 * pane and are clipped away. Pulling them inside instead (`left-1`/`right-1`)
 * was worse: at that width the cards are the full pane, so a centred arrow
 * lands on the card's own title.
 *
 * So they move to the row's header line, right-aligned above the cards, which
 * is where a constrained horizontal row normally puts them. C3 exposes no
 * placement option and the arrows are inner slots a plain `className` cannot
 * reach, hence the call-site descendant variants — same idiom as
 * `model-picker`'s ENTITY_ROW_SELECTED_DESCRIPTION_FIX. Delete this the moment
 * C3 takes an `arrows` placement prop.
 *
 * The vertical override carries its own `!` (`!-top-7`, not `-top-7`): C3
 * top-anchors its own arrows with `!top-2` (an `!important` declaration, to
 * defeat `inset-y-0` surviving tailwind-merge — see that file). An `!important`
 * author declaration beats a normal one before specificity is ever consulted,
 * so a plain `-top-7` here loses to C3's `!top-2` regardless of this
 * selector's higher specificity, and the arrows end up back inside the row,
 * over the first card — verified in a browser, and pinned by this file's
 * `ArrowsClearTheRow` story. Matching the `!` is what lets this override's
 * higher specificity decide the outcome again. `inset-y-auto` does not need
 * the same treatment: C3 never marks `bottom` important, so this selector's
 * plain `bottom: auto` already wins on specificity alone.
 */
const OUTPUT_TYPES_IN_PANE = [
  "[&_[data-slot=feature-card-row-previous]]:inset-y-auto",
  "[&_[data-slot=feature-card-row-previous]]:!-top-7",
  "[&_[data-slot=feature-card-row-previous]]:left-auto",
  "[&_[data-slot=feature-card-row-previous]]:right-9",
  "[&_[data-slot=feature-card-row-next]]:inset-y-auto",
  "[&_[data-slot=feature-card-row-next]]:!-top-7",
  "[&_[data-slot=feature-card-row-next]]:right-0",
].join(" ");

/**
 * K5 is `max-w-md` by design — it was specified as a panel, not as a pane. The
 * left pane of this shell *is* its width, so the cap is released here rather
 * than in the component, where it is right for every other consumer.
 */
const SOURCES_FILL_PANE = "max-w-none";

interface NotebookShellCitation {
  id: string;
  /** The marker text — usually an index. */
  label: React.ReactNode;
  /**
   * Which entry of `sources` this citation resolves to. Not a callback: the
   * left pane and the middle pane are two ends of one mechanism, so the shell
   * owns the jump and the caller only says where.
   */
  sourceId: string;
  /** The quoted chunk. A citation that only names a document is not verifiable. */
  quote?: React.ReactNode;
  /**
   * Overrides the derived state. A citation whose `sourceId` is not in
   * `sources` is forced to `unresolved` regardless — a dangling citation that
   * renders as resolved is worse than one that admits it is broken.
   */
  state?: CitationState;
}

interface NotebookShellClaim {
  id: string;
  text: React.ReactNode;
  /** Citations attach to the claim, not to the turn. K7's data model, kept. */
  citations?: NotebookShellCitation[];
}

interface NotebookShellMessage {
  id: string;
  role: "user" | "assistant";
  /** A plain turn body. Use `claims` instead when the answer is grounded. */
  content?: React.ReactNode;
  /**
   * A grounded answer, rendered as K7 `answer-block`: claim by claim, each with
   * its K6 citations, plus K7's own "some of this isn't sourced" warning. The
   * warning is the point — an ungrounded answer in a grounded product has to
   * say so.
   */
  claims?: NotebookShellClaim[];
  /** K7 passthrough: the final claim renders without markers while streaming. */
  streaming?: boolean;
  /** K7 passthrough: retrieved-but-unused sources. The gap is the signal. */
  retrievedUnused?: number;
}

interface NotebookShellContextChip {
  id: string;
  kind: ContextChipKind;
  label: string;
  unresolved?: boolean;
  onRemove?: () => void;
}

/** One entry in the studio's menu of output types. C3's card, minus the wiring. */
interface NotebookShellOutputType extends Omit<FeatureCardRowItem, "onSelect"> {
  id: string;
}

/** One generated output. Everything F1 takes, forwarded whole. */
interface NotebookShellOutput extends Omit<ResultCardProps, "id"> {
  id: string;
}

interface NotebookShellProps extends Omit<React.ComponentProps<"div">, "title"> {
  /** K5 sources, in ingest order. Empty renders K5's own L1. */
  sources?: SourcePanelSource[];
  /** Heading over the left pane, and the pane's accessible name. */
  sourcesLabel?: string;
  /** The add-source control. Caller-supplied so it names your own ingest verb. */
  sourcesAction?: React.ReactNode;
  /** Per-source re-ingest. There is deliberately no panel-wide retry — K5's rule. */
  onRetrySource?: (id: string) => void;
  /** The CTA inside K5's empty state. Same verb as `sourcesAction`. */
  sourcesEmptyAction?: React.ReactNode;
  /** Fires after a citation has scrolled its source into view. */
  onJumpToSource?: (id: string) => void;

  /** The conversation, oldest first. Empty renders L1 in the chat pane. */
  messages?: NotebookShellMessage[];
  /** Accessible name for the scrolling chat pane. */
  chatLabel?: string;
  /** Replaces the default L1 shown when there are no turns. */
  empty?: React.ReactNode;

  /** D1, the composer. `presentation` and `contextChips` are the shell's. */
  composer?: Omit<MediaPromptBarProps, "presentation" | "contextChips">;
  /** D3 references attached to the next question. */
  contextChips?: NotebookShellContextChip[];
  /** Replaces N3's default "AI can make mistakes" wording. */
  disclaimer?: React.ReactNode;

  /** Heading over the right pane, and the pane's accessible name. */
  studioLabel?: string;
  /** The menu of things this notebook can make. Always shown when non-empty. */
  outputTypes?: NotebookShellOutputType[];
  /** Label over the type menu — the row's accessible name too. */
  outputTypesLabel?: string;
  onGenerateOutput?: (id: string) => void;
  /** What has been generated, newest first. Empty renders L1 under the menu. */
  outputs?: NotebookShellOutput[];
  /** Replaces the default L1 shown when nothing has been generated. */
  outputsEmpty?: React.ReactNode;
}

/**
 * AI Elements' `Message` + `MessageContent`, not a hand-rolled bubble: `from`
 * drives the `is-user`/`is-assistant` class that carries every alignment and
 * surface decision in the AI Elements family.
 *
 * An assistant turn with `claims` renders K7 `answer-block` inside that frame
 * rather than laying claims and markers out here. K7 already owns the
 * claim → citation arrangement, the coverage warning and the streaming order
 * (claim first, marker second — a marker that arrives before its sentence
 * reads as a load failure), and it composes K6 itself.
 */
function NotebookShellTurn({
  message,
  resolveCitation,
}: {
  message: NotebookShellMessage;
  resolveCitation: (citation: NotebookShellCitation) => AnswerCitation;
}) {
  const grounded = message.role === "assistant" && message.claims && message.claims.length > 0;

  return (
    <Message
      from={message.role}
      data-slot="notebook-shell-turn"
      data-message-id={message.id}
      data-role={message.role}
    >
      <MessageContent data-slot="notebook-shell-turn-body" className="leading-relaxed">
        {grounded ? (
          <AnswerBlock
            claims={message.claims!.map((claim) => ({
              id: claim.id,
              text: claim.text,
              citations: claim.citations?.map(resolveCitation),
            }))}
            streaming={message.streaming}
            retrievedUnused={message.retrievedUnused}
          />
        ) : (
          message.content
        )}
      </MessageContent>
    </Message>
  );
}

function NotebookShell({
  sources = [],
  sourcesLabel = "Sources",
  sourcesAction,
  onRetrySource,
  sourcesEmptyAction,
  onJumpToSource,

  messages = [],
  chatLabel = "Chat",
  empty,

  composer,
  contextChips = [],
  disclaimer,

  studioLabel = "Studio",
  outputTypes = [],
  outputTypesLabel = "Create",
  onGenerateOutput,
  outputs = [],
  outputsEmpty,

  className,
  ...props
}: NotebookShellProps) {
  const studioLabelId = React.useId();
  const outputTypesLabelId = React.useId();

  const sourcesRef = React.useRef<HTMLElement>(null);
  const [jumpedSourceId, setJumpedSourceId] = React.useState<string | null>(null);

  /**
   * The left half of "two ends of one mechanism". K5 renders its own rows and
   * stamps no per-source identifier on them, so the row is found positionally
   * from the array the shell handed it — the two lists cannot drift, because
   * they are the same list. See the docs page: K5 growing a `data-source-id`
   * would make this an attribute lookup.
   */
  const jumpToSource = React.useCallback(
    (sourceId: string) => {
      const index = sources.findIndex((source) => source.id === sourceId);
      if (index === -1) return;
      const rows = sourcesRef.current?.querySelectorAll('[data-slot="source-panel-item"]');
      rows?.[index]?.scrollIntoView({ block: "nearest" });
      setJumpedSourceId(sourceId);
      onJumpToSource?.(sourceId);
    },
    [onJumpToSource, sources],
  );

  const resolveCitation = React.useCallback(
    (citation: NotebookShellCitation): AnswerCitation => {
      const source = sources.find((candidate) => candidate.id === citation.sourceId);
      return {
        id: citation.id,
        label: citation.label,
        source: source?.name,
        quote: citation.quote,
        // A citation pointing at a document that is not in the panel is broken,
        // whatever the caller passed. K6 renders `unresolved` visibly rather
        // than dropping the marker, which is what keeps an answer auditable.
        state: source ? (citation.state ?? "resolved") : "unresolved",
        onJumpToSource: source ? () => jumpToSource(citation.sourceId) : undefined,
      };
    },
    [jumpToSource, sources],
  );

  const jumpedSource = sources.find((source) => source.id === jumpedSourceId);

  return (
    <div
      data-slot="notebook-shell"
      className={cn(
        "bg-background text-foreground flex h-full min-h-0 w-full flex-col overflow-y-auto",
        // Three panes side by side is the archetype, but three panes side by
        // side below `lg` is three unusable columns. Narrow stacks them in
        // reading order — sources, then the conversation about them, then what
        // it produced — and moves the scroll to the shell itself.
        "lg:flex-row lg:overflow-hidden",
        className,
      )}
      {...props}
    >
      {/* Pane one. Mounted whether or not anything has been ingested: on day
          one this is K5's own empty state, and a pane that appears from
          nowhere cannot teach that it exists. */}
      <section
        ref={sourcesRef}
        data-region="sources"
        // Named here rather than by `aria-labelledby`, because K5 owns its own
        // header row: passing `heading` and `action` through keeps the label
        // and the add-source control in the component that specified them,
        // instead of rebuilding that row in the shell to get an id onto it.
        aria-label={sourcesLabel}
        // The pane scrolls, so it needs its own tab stop and its own name
        // (axe `scrollable-region-focusable`).
        tabIndex={0}
        className="bg-card flex shrink-0 flex-col gap-3 border-b p-3 lg:h-full lg:w-72 lg:overflow-y-auto lg:border-r lg:border-b-0"
      >
        <SourcePanel
          sources={sources}
          heading={sourcesLabel}
          action={sourcesAction}
          onRetrySource={onRetrySource}
          emptyAction={sourcesEmptyAction}
          className={SOURCES_FILL_PANE}
        />
        {/* A jump that only scrolls is invisible to anyone who is not watching
            the left pane. The destination is named, not just moved to. */}
        <span data-slot="notebook-shell-jump-status" role="status" className="sr-only">
          {jumpedSource ? `Showing ${jumpedSource.name} in ${sourcesLabel}` : ""}
        </span>
      </section>

      {/* `min-h-96` is load-bearing in the stacked layout, not padding: the
          column is `flex-1` inside a scrolling root, so with two tall panes
          above and below it, `flex-1` resolves to nothing and the conversation
          renders zero rows high. At `lg` the panes are side by side and the
          floor gives way to `min-h-0`, which is what lets the chat pane
          scroll instead of stretching the row. */}
      <div className="flex min-h-96 min-w-0 flex-1 flex-col lg:h-full lg:min-h-0">
        {/* Pane two. AI Elements' Conversation brings role="log" and
            stick-to-bottom pinning; `scrollClassName` is what makes the
            element it owns actually scroll. */}
        <Conversation
          data-region="chat"
          aria-label={chatLabel}
          tabIndex={0}
          className="min-h-0 flex-1"
        >
          <ConversationContent
            scrollClassName={CHAT_SCROLL}
            className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-6"
          >
            {messages.length > 0 ? (
              messages.map((message) => (
                <NotebookShellTurn
                  key={message.id}
                  message={message}
                  resolveCitation={resolveCitation}
                />
              ))
            ) : (
              (empty ?? (
                <EmptyState
                  size="page"
                  title="Ask your sources"
                  description="Every answer here is drawn from the documents on the left, and every claim links back to the passage it came from."
                  icon={<MessagesSquare />}
                />
              ))
            )}
          </ConversationContent>
        </Conversation>

        <div data-region="composer" className="bg-background shrink-0 border-t px-4 pb-2">
          <div className="mx-auto w-full max-w-2xl">
            <MediaPromptBar
              presentation="docked"
              placeholder="Ask a question about your sources"
              label="Question"
              submitLabel="Ask"
              attachLabel="Add a source"
              contextChips={
                contextChips.length > 0 ? (
                  <ContextChips>
                    {contextChips.map((chip) => (
                      <ContextChip
                        key={chip.id}
                        kind={chip.kind}
                        label={chip.label}
                        unresolved={chip.unresolved}
                        onRemove={chip.onRemove}
                      />
                    ))}
                  </ContextChips>
                ) : undefined
              }
              {...composer}
              // cn last: a bare className after the spread would silently
              // swallow a caller's `composer.className`.
              className={cn(COMPOSER_NO_NEGATIVE_PROMPT, "border-b", composer?.className)}
            />
            <DisclaimerNote variant="under-composer">{disclaimer}</DisclaimerNote>
          </div>
        </div>
      </div>

      {/* Pane three. A menu of output types with results underneath — never a
          canvas, and never a new surface: choosing "Audio Overview" generates
          into this same pane. */}
      <section
        data-region="studio-outputs"
        aria-labelledby={studioLabelId}
        tabIndex={0}
        className="bg-card flex shrink-0 flex-col gap-4 border-t p-3 lg:h-full lg:w-80 lg:overflow-y-auto lg:border-t-0 lg:border-l"
      >
        <h2 id={studioLabelId} className="text-sm font-medium">
          {studioLabel}
        </h2>

        {outputTypes.length > 0 ? (
          <div data-slot="notebook-shell-output-types" className="flex flex-col gap-2">
            <h3 id={outputTypesLabelId} className="text-foreground text-xs font-medium">
              {outputTypesLabel}
            </h3>
            <FeatureCardRow
              aria-labelledby={outputTypesLabelId}
              items={outputTypes.map(
                (type): FeatureCardRowItem => ({
                  ...type,
                  onSelect: onGenerateOutput ? () => onGenerateOutput(type.id) : undefined,
                }),
              )}
              className={OUTPUT_TYPES_IN_PANE}
            />
          </div>
        ) : null}

        <div data-slot="notebook-shell-outputs" className="flex flex-col gap-3">
          {outputs.length > 0
            ? outputs.map(({ id, ...output }) => (
                <ResultCard key={id} data-output-id={id} {...output} />
              ))
            : (outputsEmpty ?? (
                <EmptyState
                  size="panel"
                  title="Nothing generated yet"
                  description="Pick an output type above. Whatever it makes stays in this pane, beside the sources it was built from."
                  icon={<Sparkles />}
                />
              ))}
        </div>
      </section>
    </div>
  );
}

export { NotebookShell };
export type {
  NotebookShellCitation,
  NotebookShellClaim,
  NotebookShellContextChip,
  NotebookShellMessage,
  NotebookShellOutput,
  NotebookShellOutputType,
  NotebookShellProps,
};
