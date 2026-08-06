"use client";

import { Toolbar } from "@base-ui/react/toolbar";
import {
  Loader2,
  Maximize2,
  MessageSquarePlus,
  Minimize2,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  ContextToolbar,
  MAX_TOOLBAR_ACTIONS,
  type ContextToolbarAction,
  type ContextToolbarPlacement,
} from "@/registry/super-ai/context-toolbar";

/**
 * Selection Toolbar — the ✨ menu on selected text.
 *
 * Spec: docs/design-system/component-specs.md#k4-selection-toolbar
 * States: improve · shorten · expand · tone-submenu · custom-prompt
 *
 * This is I3 `context-toolbar` with a writing vocabulary, not a second
 * toolbar. Everything the bar does structurally — the eight-action ceiling,
 * the AI entry pinned to index 0, overflow, `placement`, the roving toolbar
 * focus — is I3's, and is reached through I3's own props:
 *
 * 1. "Improve is first and visually distinct; everything else is a plain
 *    verb." I3's AI slot is exactly that shape: index 0, `variant="default"`,
 *    never eligible for overflow. So Improve is passed as `aiLabel` /
 *    `onAiSelect` rather than as a row in `actions`, and Shorten and Expand
 *    are ordinary `actions` with their labels drawn.
 * 2. Tone and Custom prompt each own a popup, and I3's `actions` are flat
 *    `{ id, label }` rows behind a single `onAction` — a row cannot be a
 *    trigger. They go through I3's `children` slot instead, wrapped in
 *    `Toolbar.Button` so keyboard travel along the bar still reaches them.
 *    (This is the seam I4 `ai-tools-menu` did *not* have against F4
 *    `action-stack`, which is why I4 had to mirror and this does not.)
 * 3. Because those two children are buttons I3 does not know about, the
 *    ceiling is reserved for them here — see {@link SelectionToolbarProps.maxActions}.
 *    Otherwise a caller with eight `actions` would get a ten-button bar and
 *    I3's cap would quietly stop meaning anything.
 *
 * And the sentence that makes family K coherent: **this component emits an
 * intent and never rewrites anything.** There is no `onReplace`, no `value`,
 * no text in, no text out. `onIntent` fires; the host runs the model; the
 * result comes back as a K3 `diff-review` the reader can reject. A toolbar
 * that swapped the paragraph itself would be indistinguishable from a bug.
 */

/** The five verbs the bar owns. Caller-supplied extras arrive as `"action"`. */
type SelectionVerb = "improve" | "shorten" | "expand" | "tone" | "custom";

/** The two verbs that open something rather than firing immediately. */
type SelectionSurface = "tone" | "custom";

interface SelectionTone {
  id: string;
  label: string;
}

/**
 * What the toolbar asks for. Deliberately a request, not a result: the `tone`
 * and `custom` members carry the extra input the host needs, and nothing
 * anywhere carries replacement text.
 */
type SelectionIntentBody =
  | { verb: "improve" }
  | { verb: "shorten" }
  | { verb: "expand" }
  | { verb: "tone"; tone: string }
  | { verb: "custom"; prompt: string }
  /** A caller-supplied verb passed through `actions`. */
  | { verb: "action"; id: string };

type SelectionIntent = SelectionIntentBody & {
  /** Echoed back so a handler never has to re-read the live DOM selection. */
  selectionText?: string;
};

const DEFAULT_TONES: SelectionTone[] = [
  { id: "professional", label: "Professional" },
  { id: "friendly", label: "Friendly" },
  { id: "casual", label: "Casual" },
  { id: "confident", label: "Confident" },
  { id: "direct", label: "Direct" },
];

/**
 * Announced while a request is in flight. Each one ends by naming the
 * contract, because "Improving…" alone leaves a screen-reader user expecting
 * the paragraph to change underneath them.
 */
const PENDING_MESSAGE: Record<SelectionVerb, string> = {
  improve: "Improving the selection",
  shorten: "Shortening the selection",
  expand: "Expanding the selection",
  tone: "Rewriting the selection in a new tone",
  custom: "Rewriting the selection from your instruction",
};

/**
 * A call-site dim for the in-flight state. I3's action shape has no
 * `className`, and a Base UI toolbar button reports `aria-disabled` rather
 * than the native attribute (so arrow-key travel still reaches it), which
 * means `buttonVariants`' own `disabled:opacity-50` never fires. Reaching the
 * buttons from the bar is the only override available — the same shape as
 * `model-picker`'s `ENTITY_ROW_SELECTED_DESCRIPTION_FIX`.
 */
const PENDING_DIM = "[&_[aria-disabled=true]]:opacity-50";

interface SelectionToolbarProps extends Omit<React.ComponentProps<"div">, "onSelect"> {
  /**
   * The selected prose. Shown as context in the custom-prompt popover and
   * echoed on every intent. The toolbar reads it; it never writes it back.
   */
  selectionText?: string;
  /**
   * The only output. Fires once per chosen verb and returns a request — the
   * host produces the rewrite and returns it as a reviewable diff.
   */
  onIntent?: (intent: SelectionIntent) => void;
  /** Extra plain verbs — "Translate", "Fix spelling". They overflow first. */
  actions?: ContextToolbarAction[];
  improveLabel?: string;
  shortenLabel?: string;
  expandLabel?: string;
  toneLabel?: string;
  customLabel?: string;
  /**
   * The tone submenu. Empty drops the verb entirely. In a generation panel
   * the same list belongs in an E4 `preset-grid` instead — a compact menu
   * here, a visual grid there.
   */
  tones?: SelectionTone[];
  /** Which verb's popup is open. Uncontrolled when omitted. */
  open?: SelectionSurface | null;
  onOpenChange?: (surface: SelectionSurface | null) => void;
  /**
   * The verb whose request is in flight. The bar stays put and says so; it is
   * the visible proof that nothing was replaced while you waited.
   */
  pending?: SelectionVerb | null;
  /** Overrides the accessible name of the bar. */
  label?: string;
  placement?: ContextToolbarPlacement;
  /**
   * Buttons in the bar, counting Improve, Tone and Custom prompt. Clamped to
   * I3's ceiling of {@link MAX_TOOLBAR_ACTIONS}, and the popup verbs are
   * subtracted before the rest is handed to I3 — so the number you pass is
   * the number of buttons you get, not the number I3 knows about.
   */
  maxActions?: number;
  promptTitle?: string;
  promptPlaceholder?: string;
  promptSubmitLabel?: string;
}

/** One short line of the selection, for the popover's context. */
function previewOf(text: string, max = 80): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
}

/**
 * Icons come from this file, but they are wrapped the way I3 wraps a caller's
 * icon so a lucide title can never double a button's accessible name.
 */
function VerbIcon({ children }: { children: React.ReactNode }) {
  return (
    <span aria-hidden="true" className="flex items-center [&_svg]:size-3.5">
      {children}
    </span>
  );
}

function SelectionToolbar({
  selectionText,
  onIntent,
  actions = [],
  improveLabel = "Improve",
  shortenLabel = "Shorten",
  expandLabel = "Expand",
  toneLabel = "Tone",
  customLabel = "Custom prompt",
  tones = DEFAULT_TONES,
  open,
  onOpenChange,
  pending = null,
  label = "AI writing tools",
  placement = "above",
  maxActions = MAX_TOOLBAR_ACTIONS,
  promptTitle = "Custom instruction",
  promptPlaceholder = "Tell the model what to do with the selection",
  promptSubmitLabel = "Rewrite",
  className,
  ...props
}: SelectionToolbarProps) {
  const [uncontrolledSurface, setUncontrolledSurface] = React.useState<SelectionSurface | null>(
    null,
  );
  const [prompt, setPrompt] = React.useState("");

  const surface = open === undefined ? uncontrolledSurface : open;
  const busy = pending != null;

  const setSurface = (next: SelectionSurface | null) => {
    if (open === undefined) setUncontrolledSurface(next);
    onOpenChange?.(next);
  };

  /**
   * The single exit. Every verb funnels through here, which is what makes
   * "emits an intent, never a replacement" a property of the component rather
   * than a rule five call sites have to remember.
   */
  const emit = (body: SelectionIntentBody) => {
    if (busy) return;
    onIntent?.({ ...body, selectionText } as SelectionIntent);
  };

  const submitPrompt = () => {
    const value = prompt.trim();
    if (!value) return;
    emit({ verb: "custom", prompt: value });
    setPrompt("");
    setSurface(null);
  };

  const showTone = tones.length > 0;
  // The bar's own buttons, invisible to I3's accounting.
  const popupVerbs = (showTone ? 1 : 0) + 1;

  // Reserve the popup verbs out of the ceiling before I3 sees it, so the cap
  // counts what the user counts: buttons.
  const budget = Math.max(1, Math.min(maxActions, MAX_TOOLBAR_ACTIONS) - popupVerbs);

  const verbIcon = (verb: SelectionVerb, icon: React.ReactNode) =>
    pending === verb ? <Loader2 className="animate-spin" /> : icon;

  const barActions: ContextToolbarAction[] = [
    {
      id: "shorten",
      label: shortenLabel,
      icon: verbIcon("shorten", <Minimize2 />),
      showLabel: true,
      disabled: busy,
    },
    {
      id: "expand",
      label: expandLabel,
      icon: verbIcon("expand", <Maximize2 />),
      showLabel: true,
      disabled: busy,
    },
    ...actions.map((action) => ({ ...action, disabled: action.disabled || busy })),
  ];

  const side = placement === "above" ? "top" : "bottom";

  return (
    <div
      data-slot="selection-toolbar"
      data-pending={pending ?? undefined}
      data-surface={surface ?? undefined}
      aria-busy={busy || undefined}
      className={cn("w-fit", className)}
      {...props}
    >
      <ContextToolbar
        selection="text"
        label={label}
        placement={placement}
        maxActions={budget}
        // Improve rides I3's AI slot: index 0, filled, never overflowed. It is
        // not in `actions`, so no ordering of the plain verbs can displace it.
        aiLabel={improveLabel}
        aiIcon={verbIcon("improve", <Sparkles />)}
        onAiSelect={() => emit({ verb: "improve" })}
        actions={barActions}
        onAction={(id) => {
          if (id === "shorten" || id === "expand") {
            emit({ verb: id });
            return;
          }
          emit({ verb: "action", id });
        }}
        className={cn(busy && PENDING_DIM)}
      >
        {showTone ? (
          <DropdownMenu
            open={surface === "tone"}
            onOpenChange={(next) => {
              if (busy) return;
              setSurface(next ? "tone" : null);
            }}
          >
            <DropdownMenuTrigger
              render={
                <Toolbar.Button
                  data-slot="selection-toolbar-tone"
                  disabled={busy}
                  render={<Button variant="ghost" size="sm" />}
                />
              }
            >
              <VerbIcon>
                {pending === "tone" ? <Loader2 className="animate-spin" /> : <SlidersHorizontal />}
              </VerbIcon>
              {toneLabel}
            </DropdownMenuTrigger>
            <DropdownMenuContent
              data-slot="selection-toolbar-tone-menu"
              side={side}
              align="start"
              className="w-44"
            >
              {tones.map((tone) => (
                <DropdownMenuItem
                  key={tone.id}
                  data-slot="selection-toolbar-tone-item"
                  data-tone={tone.id}
                  onClick={() => emit({ verb: "tone", tone: tone.id })}
                >
                  {tone.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}

        <Popover
          open={surface === "custom"}
          onOpenChange={(next) => {
            if (busy) return;
            setSurface(next ? "custom" : null);
          }}
        >
          <PopoverTrigger
            render={
              <Toolbar.Button
                data-slot="selection-toolbar-custom"
                disabled={busy}
                render={<Button variant="ghost" size="sm" />}
              />
            }
          >
            <VerbIcon>
              {pending === "custom" ? <Loader2 className="animate-spin" /> : <MessageSquarePlus />}
            </VerbIcon>
            {customLabel}
          </PopoverTrigger>
          <PopoverContent
            data-slot="selection-toolbar-prompt"
            side={side}
            align="start"
            className="w-80"
          >
            {/* A Base UI popup is a dialog. Without a title it has no
                accessible name and axe fails outright, so the title is
                structural here rather than decorative. */}
            <PopoverHeader>
              <PopoverTitle>{promptTitle}</PopoverTitle>
              {selectionText ? (
                <PopoverDescription data-slot="selection-toolbar-prompt-selection">
                  “{previewOf(selectionText)}”
                </PopoverDescription>
              ) : null}
            </PopoverHeader>

            <form
              className="flex flex-col gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                submitPrompt();
              }}
            >
              <Textarea
                data-slot="selection-toolbar-prompt-input"
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                onKeyDown={(event) => {
                  if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                    event.preventDefault();
                    submitPrompt();
                  }
                }}
                placeholder={promptPlaceholder}
                // The placeholder is not a name. A visible label would double
                // the popover title in a 320px popup, so the name is stated.
                aria-label={promptPlaceholder}
                className="min-h-20"
              />
              <Button
                data-slot="selection-toolbar-prompt-submit"
                type="submit"
                size="sm"
                disabled={prompt.trim().length === 0}
                className="self-end"
              >
                {promptSubmitLabel}
              </Button>
            </form>
          </PopoverContent>
        </Popover>
      </ContextToolbar>

      {/* The bar does not move and the paragraph does not change, so the
          transition into "working" needs saying out loud. */}
      <div
        data-slot="selection-toolbar-status"
        role="status"
        aria-live="polite"
        className="sr-only"
      >
        {pending
          ? `${PENDING_MESSAGE[pending]}. The result will arrive as a change you can review.`
          : ""}
      </div>
    </div>
  );
}

export { DEFAULT_TONES, SelectionToolbar };
export type {
  SelectionIntent,
  SelectionSurface,
  SelectionTone,
  SelectionToolbarProps,
  SelectionVerb,
};
