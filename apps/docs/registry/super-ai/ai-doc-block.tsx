"use client";

import { Check, Loader2, Pencil, RotateCcw, Sparkles, Trash2 } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

/**
 * AI Doc Block — a generated passage living inside a document.
 *
 * Spec: docs/design-system/component-specs.md#k1-ai-doc-block
 * States: streaming · editable · re-promptable · approval-verbs
 *
 * Three rules from the spec carry the weight here, and each is enforced by
 * the component rather than left to the call site:
 *
 * 1. **"A real document node, not an overlay."** The generated prose is
 *    rendered as the caller's own semantic markup, straight into
 *    `ai-doc-block-content`, with nothing wrapped around it and nothing
 *    positioned over it. That is what lets the block survive save, reload and
 *    export as ordinary content: a document model serialises the `<h3>` and
 *    `<p>` it handed in, not an opaque chrome layer. Anything that turns the
 *    content slot into an absolutely-positioned overlay, or that wraps the
 *    children in component-owned markup, breaks the one property this
 *    component exists to guarantee — there is a test pinned to the content
 *    slot's exact `innerHTML` for precisely that reason.
 *
 * 2. **"The four verbs are the approval contract applied to prose."** Keep ·
 *    Edit · Regenerate · Discard land in that order whatever order the
 *    handlers arrive in, so the muscle memory built on F7 `approval-card`
 *    holds when the same contract shows up mid-paragraph.
 *
 *    This *mirrors* F7 rather than composing it, for the same reason I4
 *    `ai-tools-menu` mirrors F4: F7's root **is** a `Card` carrying
 *    `data-slot="approval-card"`, its own title/summary/detail/undo model, and
 *    a hard-coded verb set whose two terminal verbs are named Confirm and
 *    Skip. Nesting it would put an approval card *inside* the document node,
 *    inverting the relationship — the block is the thing being approved, not a
 *    payload inside an approval surface — and it exposes no sub-component for
 *    the verb row alone. So the *rule* is copied verbatim (a fixed `VERBS`
 *    array, iterated as-is and filtered by which handlers exist) while the
 *    labels follow prose: you Keep a paragraph, you do not Confirm it.
 *
 * 3. **"Re-prompting keeps the block in place and swaps its content, so
 *    structure never moves."** The root element is unconditional: every state
 *    renders the same `Card`, and only what sits *inside* it changes. Opening
 *    the re-prompt affordance must never unmount or relocate the block, or the
 *    document reflows under the cursor while someone is typing an instruction
 *    into it.
 *
 * Two smaller decisions worth naming:
 *
 * - While `streaming` the verbs are rendered **disabled, not hidden**. Hiding
 *   them makes the footer shrink and then grow again when generation lands,
 *   which is exactly the structural movement rule 3 forbids; disabling them
 *   keeps the affordance discoverable and un-clickable at once.
 * - Streaming is announced in words (a persistent `role="status"` line) and
 *   drawn in words (a visible "Streaming" indicator beside the label), never
 *   by a tinted border alone.
 */

type AiDocBlockState = "streaming" | "editable" | "re-promptable" | "approval-verbs";

type AiDocBlockVerb = "keep" | "edit" | "regenerate" | "discard";

/**
 * The canonical order. Iterated as-is when rendering, which is what makes the
 * ordering a property of the component rather than of the call site — a caller
 * who passes only `onDiscard` and `onKeep` still gets Keep before Discard.
 */
const VERBS = [
  { id: "keep", label: "Keep", icon: Check },
  { id: "edit", label: "Edit", icon: Pencil },
  { id: "regenerate", label: "Regenerate", icon: RotateCcw },
  { id: "discard", label: "Discard", icon: Trash2 },
] as const;

/**
 * Discard is destructive, so it is solid rather than tinted. Button's own
 * `variant="destructive"` is `bg-destructive/10 text-destructive`, which
 * measures below 4.5:1 — the substitution here (`bg-destructive` paired with
 * `text-background`) is the same one `promo-card`'s quota-warning CTA and
 * `generation-queue`'s failed badge make, and it clears the threshold in both
 * themes. Applied over `variant="default"` because that variant carries no
 * `dark:` background of its own to fight with.
 */
const DISCARD_CLASS = "bg-destructive text-background hover:bg-destructive/90";

/**
 * Announced, not merely drawn. One persistent live region rather than a node
 * that appears with the state: an `aria-live` region has to be in the DOM
 * before its text changes for the change to be reliably announced.
 */
const STATUS_TEXT: Record<AiDocBlockState, string> = {
  streaming: "Generating this block. Its actions stay unavailable until it finishes.",
  editable: "This block is open for editing.",
  "re-promptable": "Re-prompting this block. Its content will be replaced in place.",
  "approval-verbs": "This block is generated and waiting on your decision.",
};

interface AiDocBlockProps extends React.ComponentProps<"div"> {
  state?: AiDocBlockState;
  /**
   * The attribution line. Text, never colour, is what marks a passage as
   * generated — a tinted border does not survive a colourblind reader, a
   * high-contrast theme, or an export to plain HTML.
   */
  label?: string;
  /**
   * The generated prose, as ordinary document markup (`<p>`, `<h3>`, `<ul>`).
   * Rendered into the content slot unwrapped so a document model can
   * serialise it back out unchanged.
   */
  children?: React.ReactNode;
  /** The source text behind `editable`. Controlled — pair with `onValueChange`. */
  value?: string;
  onValueChange?: (value: string) => void;
  /** Accessible name for the edit field. */
  editLabel?: string;
  /** The instruction behind `re-promptable`. Controlled — pair with `onPromptChange`. */
  prompt?: string;
  onPromptChange?: (prompt: string) => void;
  /** Submits the instruction. The host swaps `children`; the block stays put. */
  onRePrompt?: (prompt: string) => void;
  /** Closes the re-prompt affordance without regenerating. */
  onRePromptCancel?: () => void;
  rePromptLabel?: string;
  rePromptPlaceholder?: string;
  /** Commit the passage into the document as ordinary content. */
  onKeep?: () => void;
  /** Hand the passage to the editor. */
  onEdit?: () => void;
  /** Open the re-prompt affordance. */
  onRegenerate?: () => void;
  /** Destructive. Removes the passage. */
  onDiscard?: () => void;
}

function AiDocBlock({
  state = "approval-verbs",
  label = "AI generated",
  children,
  value,
  onValueChange,
  editLabel = "Edit generated text",
  prompt,
  onPromptChange,
  onRePrompt,
  onRePromptCancel,
  rePromptLabel = "What should change?",
  rePromptPlaceholder = "Make it shorter and drop the second example.",
  onKeep,
  onEdit,
  onRegenerate,
  onDiscard,
  className,
  ...props
}: AiDocBlockProps) {
  const promptId = React.useId();
  const streaming = state === "streaming";

  const handlers: Record<AiDocBlockVerb, (() => void) | undefined> = {
    keep: onKeep,
    edit: onEdit,
    regenerate: onRegenerate,
    discard: onDiscard,
  };

  return (
    // The root is unconditional across every state. Re-prompting swaps what is
    // inside it and nothing else, so the block never unmounts and never moves
    // relative to the paragraphs around it.
    <Card
      data-slot="ai-doc-block"
      data-state={state}
      className={cn("gap-3", className)}
      {...props}
    >
      <CardHeader
        data-slot="ai-doc-block-header"
        className="flex flex-row items-center gap-2 text-xs"
      >
        <Sparkles aria-hidden className="size-3.5 shrink-0" />
        <span data-slot="ai-doc-block-label" className="text-foreground font-medium">
          {label}
        </span>
        {/* Shape *and* words. The spinner alone would make "still arriving" a
            purely visual fact; the word survives a screenshot in greyscale. */}
        {streaming ? (
          <span
            data-slot="ai-doc-block-streaming"
            className="text-foreground flex items-center gap-1.5"
          >
            <Loader2 aria-hidden className="size-3 animate-spin" />
            Streaming
          </span>
        ) : null}
      </CardHeader>

      {/* Nothing is wrapped around `children` and nothing is layered over them:
          this element's innerHTML is exactly the markup the caller passed, so
          the document model that owns this node can save and export it as
          ordinary content. */}
      <CardContent
        data-slot="ai-doc-block-content"
        aria-busy={streaming || undefined}
        className="text-foreground text-sm"
      >
        {state === "editable" ? (
          <Textarea
            data-slot="ai-doc-block-editor"
            aria-label={editLabel}
            value={value ?? ""}
            onChange={(event) => onValueChange?.(event.target.value)}
          />
        ) : (
          children
        )}
      </CardContent>

      <CardContent>
        {state === "re-promptable" ? (
          <div data-slot="ai-doc-block-reprompt" className="flex flex-col gap-2">
            {/* A real label, not a placeholder: the placeholder disappears the
                moment someone starts typing, taking the field's name with it. */}
            <Label htmlFor={promptId} className="text-foreground text-xs">
              {rePromptLabel}
            </Label>
            <Textarea
              id={promptId}
              data-slot="ai-doc-block-prompt"
              value={prompt ?? ""}
              placeholder={rePromptPlaceholder}
              onChange={(event) => onPromptChange?.(event.target.value)}
              className="min-h-12"
            />
            <div className="flex items-center gap-2">
              <Button
                data-slot="ai-doc-block-reprompt-submit"
                type="button"
                size="sm"
                onClick={() => onRePrompt?.(prompt ?? "")}
              >
                <RotateCcw aria-hidden />
                Regenerate
              </Button>
              {onRePromptCancel ? (
                <Button
                  data-slot="ai-doc-block-reprompt-cancel"
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={onRePromptCancel}
                >
                  Cancel
                </Button>
              ) : null}
            </div>
          </div>
        ) : (
          <ButtonGroup data-slot="ai-doc-block-verbs" aria-label="Generated block actions">
            {VERBS.filter((verb) => handlers[verb.id]).map((verb) => {
              const Icon = verb.icon;
              return (
                <Button
                  key={verb.id}
                  data-slot={`ai-doc-block-${verb.id}`}
                  type="button"
                  size="sm"
                  // Present but not actionable while the text is still
                  // arriving — approving prose you have not finished reading is
                  // the failure this contract exists to prevent.
                  disabled={streaming}
                  variant={verb.id === "keep" || verb.id === "discard" ? "default" : "outline"}
                  className={verb.id === "discard" ? DISCARD_CLASS : undefined}
                  onClick={handlers[verb.id]}
                >
                  {/* Icon *and* label on every verb. No icon-only control here
                      needs a tooltip to acquire a name. */}
                  <Icon aria-hidden />
                  {verb.label}
                </Button>
              );
            })}
          </ButtonGroup>
        )}
      </CardContent>

      <span data-slot="ai-doc-block-status" role="status" className="sr-only">
        {STATUS_TEXT[state]}
      </span>
    </Card>
  );
}

export { AiDocBlock, VERBS as AI_DOC_BLOCK_VERBS };
export type { AiDocBlockProps, AiDocBlockState, AiDocBlockVerb };
