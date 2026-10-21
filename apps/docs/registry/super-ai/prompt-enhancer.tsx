"use client";

import * as React from "react";
import { ChevronDown, Loader2, Sparkles, Undo2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Popover, PopoverContent, PopoverTitle, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type PromptEnhancerState = "idle" | "enhancing" | "suggested" | "accepted" | "reverted" | "failed";

/** One run of the suggested text. `added` runs are the words the person did not write. */
interface EnhancerSegment {
  text: string;
  added: boolean;
}

/** Past this many word comparisons the exact diff is skipped for a prefix and suffix trim. */
const MAX_DIFF_CELLS = 1_000_000;

/**
 * Splits the suggestion into words that keep their trailing whitespace, so the
 * marked text re-joins to exactly the string the enhancer returned.
 */
function tokenise(text: string): string[] {
  return text.match(/\S+\s*/g) ?? [];
}

/** Trailing sentence punctuation does not make a word new: "sea" and "sea," are the same word. */
function key(token: string): string {
  return token.trim().replace(/[,.;:!?]+$/, "");
}

/**
 * Marks which words of `next` are not in `original`. A longest-common-
 * subsequence over words, so a moved sentence reads as removed-and-added
 * rather than unchanged. Pure text in, runs out; nothing here touches the DOM.
 */
function diffAdded(original: string, next: string): EnhancerSegment[] {
  const a = tokenise(original).map(key);
  const rawB = tokenise(next);
  const b = rawB.map(key);
  const added = new Array<boolean>(b.length).fill(true);

  if (a.length * b.length > MAX_DIFF_CELLS) {
    let start = 0;
    while (start < a.length && start < b.length && a[start] === b[start]) start++;
    let endA = a.length;
    let endB = b.length;
    while (endA > start && endB > start && a[endA - 1] === b[endB - 1]) {
      endA--;
      endB--;
    }
    for (let i = 0; i < b.length; i++) added[i] = i >= start && i < endB;
  } else {
    const width = b.length + 1;
    const table = new Uint16Array((a.length + 1) * width);
    for (let i = a.length - 1; i >= 0; i--) {
      for (let j = b.length - 1; j >= 0; j--) {
        table[i * width + j] =
          a[i] === b[j]
            ? table[(i + 1) * width + j + 1]! + 1
            : Math.max(table[(i + 1) * width + j]!, table[i * width + j + 1]!);
      }
    }
    let i = 0;
    let j = 0;
    while (i < a.length && j < b.length) {
      if (a[i] === b[j]) {
        added[j] = false;
        i++;
        j++;
      } else if (table[(i + 1) * width + j]! >= table[i * width + j + 1]!) i++;
      else j++;
    }
  }

  const segments: EnhancerSegment[] = [];
  rawB.forEach((token, index) => {
    const flag = added[index]!;
    const last = segments[segments.length - 1];
    if (last && last.added === flag) last.text += token;
    else segments.push({ text: token, added: flag });
  });
  return segments;
}

function describeAdded(segments: EnhancerSegment[]): string {
  const runs = segments.filter((s) => s.added);
  const words = runs.reduce((sum, s) => sum + tokenise(s.text).length, 0);
  if (words === 0) return "No words added";
  const places = runs.length;
  return `${words} ${words === 1 ? "word" : "words"} added in ${places} ${places === 1 ? "place" : "places"}`;
}

const LIVE_MESSAGE: Record<PromptEnhancerState, string> = {
  idle: "",
  enhancing: "Enhancing your prompt.",
  suggested: "Suggested rewrite ready.",
  accepted: "Enhanced prompt applied. Revert is available.",
  reverted: "Original prompt restored.",
  failed: "Enhance failed. Your prompt is unchanged.",
};

const DEFAULT_REFINEMENTS = ["More concise", "Add examples"];

interface PromptEnhancerProps extends Omit<React.ComponentProps<"div">, "onChange"> {
  /** The host field's current text. Read when Enhance starts; never written back except through `onAccept` and `onRevert`. */
  value: string;
  /**
   * Returns the rewritten prompt. Called with the text as it was when Enhance
   * started and, for a refinement chip, the chip's label. Nothing is submitted
   * and the host field is not touched until the person accepts.
   */
  onEnhance: (value: string, refinement?: string) => Promise<string>;
  /** Receives the accepted text, including any edits the person made to the suggestion. */
  onAccept: (next: string) => void;
  /** Receives the exact original string on Revert. When omitted, Revert calls `onAccept` with it. */
  onRevert?: (original: string) => void;
  /** Quick refinements behind the advanced disclosure. Each re-runs the enhance from the original. */
  refinements?: string[];
}

/**
 * Prompt Enhancer — proposes a rewrite of the prompt beside the original, and
 * the person accepts, edits or dismisses it. It never owns the host's field and
 * never submits.
 *
 * Spec: docs/design-system/component-specs.md#d8-prompt-enhancer
 * States: idle · enhancing · suggested · accepted · reverted · failed
 */
function PromptEnhancer({
  value,
  onEnhance,
  onAccept,
  onRevert,
  refinements = DEFAULT_REFINEMENTS,
  className,
  ...props
}: PromptEnhancerProps) {
  const [state, setState] = React.useState<PromptEnhancerState>("idle");
  const [open, setOpen] = React.useState(false);
  const [suggestion, setSuggestion] = React.useState("");
  const [refinement, setRefinement] = React.useState<string | undefined>();
  const [editing, setEditing] = React.useState(false);
  // The exact text Enhance started from. Revert restores this string, so it is
  // captured once per run and never re-read from `value`.
  const [source, setSource] = React.useState("");
  // Bumped on every start and cancel, so a promise that resolves after Cancel
  // finds its ticket stale and is dropped instead of reopening the panel.
  const ticket = React.useRef(0);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const primaryRef = React.useRef<HTMLButtonElement>(null);
  const ids = React.useId();
  const summaryId = `${ids}-summary`;

  const run = React.useCallback(
    async (from: string, chip?: string) => {
      const mine = ++ticket.current;
      setSource(from);
      setRefinement(chip);
      setEditing(false);
      setState("enhancing");
      setOpen(true);
      try {
        const next = await onEnhance(from, chip);
        if (mine !== ticket.current) return;
        setSuggestion(next);
        setState("suggested");
      } catch {
        if (mine !== ticket.current) return;
        setState("failed");
      }
    },
    [onEnhance],
  );

  const close = React.useCallback(() => {
    // Any dismissal while a run is live or its result is on screen discards it.
    ticket.current++;
    setOpen(false);
    setEditing(false);
    setState("idle");
  }, []);

  // The control that held focus (Cancel, Retry) is replaced when the state
  // changes; hand focus to the new primary action so it is not dropped.
  React.useEffect(() => {
    if (open && (state === "suggested" || state === "failed" || state === "enhancing")) {
      primaryRef.current?.focus();
    }
  }, [open, state]);

  const segments = React.useMemo(
    () => (state === "suggested" ? diffAdded(source, suggestion) : []),
    [state, source, suggestion],
  );
  const summary = describeAdded(segments);

  function accept() {
    const next = suggestion;
    ticket.current++;
    setOpen(false);
    setEditing(false);
    setState("accepted");
    onAccept(next);
  }

  function revert() {
    const text = source;
    setState("reverted");
    if (onRevert) onRevert(text);
    else onAccept(text);
    triggerRef.current?.focus();
  }

  const canEnhance = value.trim().length > 0;
  const title =
    state === "enhancing"
      ? "Enhancing your prompt"
      : state === "failed"
        ? "Enhance failed"
        : "Suggested rewrite";

  return (
    <div
      data-slot="prompt-enhancer"
      data-state={state}
      className={cn("flex flex-wrap items-center gap-2", className)}
      {...props}
    >
      <Popover
        open={open}
        onOpenChange={(next) => {
          if (next) {
            if (canEnhance) void run(value);
          } else if (state === "enhancing" || state === "suggested" || state === "failed") close();
          else setOpen(false);
        }}
      >
        <PopoverTrigger
          render={
            <Button ref={triggerRef} type="button" variant="outline" size="sm" disabled={!canEnhance} />
          }
        >
          <Sparkles aria-hidden />
          Enhance prompt
        </PopoverTrigger>
        <PopoverContent
          data-slot="prompt-enhancer-panel"
          data-state={state}
          align="start"
          className="w-[min(40rem,calc(100vw-2rem))] motion-reduce:data-open:animate-none motion-reduce:data-closed:animate-none"
        >
          <PopoverTitle data-slot="prompt-enhancer-title">{title}</PopoverTitle>

          {state === "enhancing" ? (
            <div className="flex items-center justify-between gap-3">
              <p className="text-foreground flex items-center gap-2 text-sm">
                <Loader2 aria-hidden className="size-4 animate-spin motion-reduce:animate-none" />
                Rewriting {refinement ? `with "${refinement}"` : "your prompt"}. Nothing changes until you
                accept.
              </p>
              <Button ref={primaryRef} type="button" variant="outline" size="sm" onClick={close}>
                Cancel
              </Button>
            </div>
          ) : null}

          {state === "failed" ? (
            <>
              <p data-slot="prompt-enhancer-error" className="text-foreground text-sm">
                The rewrite did not come back. Your prompt is unchanged.
              </p>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={close}>
                  Dismiss
                </Button>
                <Button ref={primaryRef} type="button" size="sm" onClick={() => void run(source, refinement)}>
                  Try again
                </Button>
              </div>
            </>
          ) : null}

          {state === "suggested" ? (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <section
                  data-slot="prompt-enhancer-original"
                  aria-label="Your prompt"
                  className="flex flex-col gap-1"
                >
                  <h3 className="text-muted-foreground text-xs font-medium">Your prompt</h3>
                  <p className="text-foreground border-border rounded-md border p-2 text-sm break-words whitespace-pre-wrap">
                    {source}
                  </p>
                </section>
                <section
                  data-slot="prompt-enhancer-suggestion"
                  aria-label="Suggested rewrite"
                  aria-describedby={summaryId}
                  className="flex flex-col gap-1"
                >
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-muted-foreground text-xs font-medium">Suggested rewrite</h3>
                    {refinement ? (
                      <Badge variant="outline" data-slot="prompt-enhancer-refinement">
                        {refinement}
                      </Badge>
                    ) : null}
                  </div>
                  {editing ? (
                    <Textarea
                      data-slot="prompt-enhancer-editor"
                      aria-label="Edit the suggested rewrite"
                      aria-describedby={summaryId}
                      value={suggestion}
                      onChange={(event) => setSuggestion(event.target.value)}
                      className="min-h-24"
                    />
                  ) : (
                    <p
                      data-slot="prompt-enhancer-text"
                      className="text-foreground border-border rounded-md border p-2 text-sm break-words whitespace-pre-wrap"
                    >
                      {segments.map((segment, index) =>
                        segment.added ? (
                          // Added words are underlined and bracketed for assistive
                          // tech, as well as tinted: the tint alone would not survive
                          // forced colours or a screen reader.
                          <ins
                            key={index}
                            data-slot="prompt-enhancer-added"
                            className="bg-primary/10 text-foreground rounded-sm underline decoration-2 underline-offset-2"
                          >
                            <span className="sr-only">added start </span>
                            {segment.text}
                            <span className="sr-only"> added end</span>
                          </ins>
                        ) : (
                          <span key={index}>{segment.text}</span>
                        ),
                      )}
                    </p>
                  )}
                  <p
                    id={summaryId}
                    data-slot="prompt-enhancer-summary"
                    className="text-muted-foreground text-xs"
                  >
                    {summary}
                    {editing ? "" : ". Added words are underlined."}
                  </p>
                </section>
              </div>

              <Collapsible data-slot="prompt-enhancer-advanced">
                <CollapsibleTrigger
                  render={<Button type="button" variant="ghost" size="sm" className="group" />}
                >
                  Advanced
                  <ChevronDown
                    aria-hidden
                    className="transition-transform group-aria-expanded:rotate-180 motion-reduce:transition-none"
                  />
                </CollapsibleTrigger>
                <CollapsibleContent className="flex flex-wrap gap-2 pt-2">
                  {refinements.map((chip) => (
                    <Button
                      key={chip}
                      type="button"
                      variant="outline"
                      size="xs"
                      data-slot="prompt-enhancer-chip"
                      onClick={() => void run(source, chip)}
                    >
                      {chip}
                    </Button>
                  ))}
                </CollapsibleContent>
              </Collapsible>

              <div className="flex flex-wrap justify-end gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={close}>
                  Dismiss
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setEditing((v) => !v)}>
                  {editing ? "Show changes" : "Edit"}
                </Button>
                <Button ref={primaryRef} type="button" size="sm" onClick={accept}>
                  Accept
                </Button>
              </div>
            </>
          ) : null}
        </PopoverContent>
      </Popover>

      {state === "accepted" ? (
        <Button type="button" variant="ghost" size="sm" data-slot="prompt-enhancer-revert" onClick={revert}>
          <Undo2 aria-hidden />
          Revert to original
        </Button>
      ) : null}
      {state === "reverted" ? (
        <span aria-hidden data-slot="prompt-enhancer-note" className="text-muted-foreground text-xs">
          Original restored
        </span>
      ) : null}

      {/* Always mounted: a live region that appears with its text is often not announced. */}
      <span role="status" aria-live="polite" data-slot="prompt-enhancer-status" className="sr-only">
        {LIVE_MESSAGE[state]}
      </span>
    </div>
  );
}

export { PromptEnhancer, diffAdded };
export type { EnhancerSegment, PromptEnhancerProps, PromptEnhancerState };
