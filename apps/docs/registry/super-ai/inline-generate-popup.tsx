"use client";

import { Popover as PopoverPrimitive } from "@base-ui/react/popover";
import { Ban, Loader2, Sparkles } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverDescription, PopoverTitle, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

/**
 * Inline Generate Popup — click empty space, ask for something, get it written.
 *
 * Spec: docs/design-system/component-specs.md#k2-inline-generate-popup
 * States: idle · generating · cancelled
 *
 * Three rules from the spec carry the weight:
 *
 * 1. "The popover generates, it does not commit." There is no state in which
 *    this component draws the generated text. The result arrives on `result`
 *    and leaves immediately through `onCommit`, which is where the host turns
 *    it into a K1 `ai-doc-block` with the approval verbs. K1 is *not* imported
 *    — the handoff is a callback so the dependency runs one way, the same
 *    reason `context-toolbar` takes I4 as a slot rather than an import.
 * 2. "Anchored to the caret, so the insertion point is unambiguous." A
 *    registry component owns no editor and cannot measure a caret, so the
 *    decision is expressed rather than computed: the host passes the caret as
 *    `anchor` (an element, a ref, or a virtual element with a `getBoundingClientRect`)
 *    and chooses `placement`, which lands on `data-placement`. Same shape as
 *    `context-toolbar`'s `placement`.
 * 3. "Surrounding structure is implicit context." The heading the popup sits
 *    under is shown in the `context` slot and is the popup's accessible
 *    description, so the prompt does not have to restate it — which is why the
 *    default placeholder is four words and not an instruction template.
 *
 * Composed from the **Base UI** popover primitive rather than the vendored
 * `PopoverContent` wrapper: the wrapper forwards only `side`/`align`/offsets to
 * `Popover.Positioner` and drops `anchor`, which is the one prop caret
 * anchoring needs. `Popover.Root`, `Popover.Trigger`, `Popover.Title` and
 * `Popover.Description` still come through the wrapper.
 */

const INLINE_GENERATE_POPUP_STATES = ["idle", "generating", "cancelled"] as const;

type InlineGeneratePopupState = (typeof INLINE_GENERATE_POPUP_STATES)[number];

/** Which side of the caret the popup is drawn on. The host decides; see rule 2. */
type InlineGeneratePopupPlacement = "above" | "below";

/**
 * Anything Base UI's positioner accepts as an anchor — including a virtual
 * element built from a caret rect, which is the whole point.
 */
type InlineGeneratePopupAnchor = NonNullable<PopoverPrimitive.Positioner.Props["anchor"]>;

const PLACEMENT_SIDE: Record<InlineGeneratePopupPlacement, "top" | "bottom"> = {
  above: "top",
  below: "bottom",
};

interface InlineGeneratePopupProps
  extends Omit<React.ComponentProps<"div">, "children" | "title" | "onSubmit"> {
  /** Which of the three states to draw. Controlled: the host owns the request. */
  state?: InlineGeneratePopupState;
  /**
   * The caret. An element, a ref, or a virtual element — whatever the host
   * measured. When supplied, no trigger button is rendered: the popup is
   * opened by the click that produced the caret, not by a control.
   */
  anchor?: InlineGeneratePopupAnchor;
  /** Which side of the caret the popup sits on. Lands on `data-placement`. */
  placement?: InlineGeneratePopupPlacement;
  /** Optional control to open from when there is no caret rect to point at. */
  trigger?: React.ReactElement<Record<string, unknown>>;
  /** Visible label for the fallback trigger. */
  triggerLabel?: string;
  open?: boolean;
  /**
   * Open by default: this popup exists because the user just clicked an empty
   * line. It is already the answer to a gesture.
   */
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /**
   * The visible heading — and the popup's accessible name. Base UI renders the
   * popup as `role="dialog"`, and a dialog with no name fails axe
   * (`aria-dialog-name`) outright, so this is never optional.
   */
  title?: string;
  /**
   * What the popup inherited from the document around it — usually the heading
   * it sits under. Shown, and used as the popup's accessible description.
   */
  context?: React.ReactNode;
  /** Reads in front of `context`, e.g. "Under" → "Under Q3 revenue drivers". */
  contextLabel?: string;
  prompt?: string;
  defaultPrompt?: string;
  onPromptChange?: (prompt: string) => void;
  /**
   * Deliberately short. The structure above the caret is the instruction; a
   * placeholder demanding "Describe the tone, length and audience…" is the
   * component admitting it wasted the context it already has.
   */
  placeholder?: string;
  /** Accessible name for the prompt field. */
  promptLabel?: string;
  submitLabel?: string;
  /** Shown instead of `submitLabel` once a run has been cancelled. */
  retryLabel?: string;
  cancelLabel?: string;
  /** Announced in the live region while generating. */
  generatingLabel?: string;
  /**
   * Announced after a cancel. Text, not a colour or a faded border: the
   * cancelled state has to survive a greyscale screenshot.
   */
  cancelledLabel?: string;
  /** Fires with the trimmed prompt. The host runs the model. */
  onSubmit?: (prompt: string) => void;
  /** Fires when the run is abandoned. The prompt survives; nothing is committed. */
  onCancel?: () => void;
  /**
   * The generated text, handed in the moment it exists. The popup never draws
   * it — see rule 1. Emitted once per distinct value, and never while
   * `state="cancelled"`.
   */
  result?: string;
  /**
   * Receives the generated text. The host renders it as a K1 `ai-doc-block`
   * with the approval verbs; this component closes and gets out of the way.
   */
  onCommit?: (text: string) => void;
}

function InlineGeneratePopup({
  state = "idle",
  anchor,
  placement = "below",
  trigger,
  triggerLabel = "Ask AI",
  open: openProp,
  defaultOpen = true,
  onOpenChange,
  title = "Generate here",
  context,
  contextLabel = "Under",
  prompt: promptProp,
  defaultPrompt = "",
  onPromptChange,
  placeholder = "What should go here?",
  promptLabel = "Prompt",
  submitLabel = "Generate",
  retryLabel = "Try again",
  cancelLabel = "Cancel",
  generatingLabel = "Generating…",
  cancelledLabel = "Cancelled. Nothing was inserted.",
  onSubmit,
  onCancel,
  result,
  onCommit,
  className,
  ...props
}: InlineGeneratePopupProps) {
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen);
  const isOpenControlled = openProp !== undefined;
  const isOpen = isOpenControlled ? openProp : internalOpen;

  const [internalPrompt, setInternalPrompt] = React.useState(defaultPrompt);
  const isPromptControlled = promptProp !== undefined;
  const promptValue = isPromptControlled ? promptProp : internalPrompt;

  const isGenerating = state === "generating";
  const isCancelled = state === "cancelled";

  const handleOpenChange = React.useCallback(
    (next: boolean) => {
      if (!isOpenControlled) setInternalOpen(next);
      onOpenChange?.(next);
    },
    [isOpenControlled, onOpenChange],
  );

  const handlePromptChange = (next: string) => {
    if (!isPromptControlled) setInternalPrompt(next);
    onPromptChange?.(next);
  };

  const submit = () => {
    const value = promptValue.trim();
    // An empty prompt is not a request, and a second Enter mid-run is not a
    // second request.
    if (!value || isGenerating) return;
    onSubmit?.(value);
  };

  // The handoff. The result passes straight through to the host — it is never
  // written into the DOM here, because the moment output exists it belongs to a
  // K1 block that survives save, reload and export. The popup then closes: its
  // job ended at "generate".
  const emitted = React.useRef<string | undefined>(undefined);
  React.useEffect(() => {
    if (!result || isCancelled) return;
    if (emitted.current === result) return;
    emitted.current = result;
    onCommit?.(result);
    handleOpenChange(false);
  }, [result, isCancelled, onCommit, handleOpenChange]);

  const statusText = isGenerating ? generatingLabel : isCancelled ? cancelledLabel : null;

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      {/* With a caret to anchor to there is nothing to click: the click already
          happened. The fallback trigger exists for hosts that have a control
          instead of a caret. */}
      {anchor ? null : (
        <PopoverTrigger
          data-slot="inline-generate-popup-trigger"
          render={trigger ?? <Button variant="outline" size="sm" />}
        >
          {trigger ? undefined : triggerLabel}
        </PopoverTrigger>
      )}
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Positioner
          anchor={anchor}
          side={PLACEMENT_SIDE[placement]}
          align="start"
          sideOffset={6}
          className="isolate z-50"
        >
          <PopoverPrimitive.Popup
            data-slot="inline-generate-popup"
            data-state={state}
            data-placement={placement}
            className={cn(
              "bg-popover text-popover-foreground z-50 flex w-80 origin-(--transform-origin) flex-col gap-2.5 rounded-lg p-2.5 text-sm shadow-md ring-1 ring-foreground/10 outline-hidden",
              className,
            )}
            {...props}
          >
            {/* Base UI wires the popup's aria-labelledby to this title, which is
                what keeps role="dialog" from shipping unnamed. */}
            <PopoverTitle data-slot="inline-generate-popup-title" className="flex items-center gap-1.5">
              <Sparkles aria-hidden="true" className="size-3.5" />
              {title}
            </PopoverTitle>

            {context ? (
              <PopoverDescription data-slot="inline-generate-popup-context" className="text-xs">
                {contextLabel}{" "}
                <span className="text-foreground font-medium">{context}</span>
              </PopoverDescription>
            ) : null}

            <Textarea
              data-slot="inline-generate-popup-prompt"
              aria-label={promptLabel}
              placeholder={placeholder}
              value={promptValue}
              // Not `disabled`: a disabled field drops the text out of the
              // accessibility tree and greys it out, and the prompt has to stay
              // readable through the run and after a cancel.
              readOnly={isGenerating}
              onChange={(event) => handlePromptChange(event.target.value)}
              onKeyDown={(event) => {
                // Enter sends, Shift+Enter breaks the line — the contract every
                // prompt field in this system keeps.
                if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) return;
                event.preventDefault();
                submit();
              }}
              className="min-h-14 text-sm"
            />

            {/* Present in every state so the live region exists before it has
                anything to announce. */}
            <p
              data-slot="inline-generate-popup-status"
              role="status"
              aria-live="polite"
              className="text-foreground flex min-h-4 items-center gap-1.5 text-xs"
            >
              {isGenerating ? <Loader2 aria-hidden="true" className="size-3.5 animate-spin" /> : null}
              {isCancelled ? <Ban aria-hidden="true" className="size-3.5" /> : null}
              {statusText}
            </p>

            <div
              data-slot="inline-generate-popup-actions"
              className="flex items-center justify-end gap-2"
            >
              {isGenerating ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  data-slot="inline-generate-popup-cancel"
                  onClick={onCancel}
                >
                  {cancelLabel}
                </Button>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  data-slot="inline-generate-popup-submit"
                  disabled={promptValue.trim().length === 0}
                  onClick={submit}
                >
                  {isCancelled ? retryLabel : submitLabel}
                </Button>
              )}
            </div>
          </PopoverPrimitive.Popup>
        </PopoverPrimitive.Positioner>
      </PopoverPrimitive.Portal>
    </Popover>
  );
}

export { INLINE_GENERATE_POPUP_STATES, InlineGeneratePopup };
export type {
  InlineGeneratePopupAnchor,
  InlineGeneratePopupPlacement,
  InlineGeneratePopupProps,
  InlineGeneratePopupState,
};
