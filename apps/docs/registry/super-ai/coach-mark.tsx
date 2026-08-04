"use client";

import { Popover as PopoverPrimitive } from "@base-ui/react/popover";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

/**
 * Coach Mark — one anchored step of a product tour.
 *
 * Spec: docs/design-system/component-specs.md#l2-coach-mark
 * States: spotlight · no-spotlight · step-counter · arrow-flip
 *
 * Three sentences in the spec carry the weight, and each is enforced by the
 * component rather than left to the call site:
 *
 * 1. "The scrim has a cut-out so the anchored element stays legible. Never dim
 *    what you point at." The scrim is not a full-screen backdrop with the
 *    popover on top of it — it is a `box-shadow` with a 9999px spread painted
 *    *around* the anchor's own box, so the cut-out is exactly the element being
 *    pointed at, with no measurement and no `getBoundingClientRect`. The anchor
 *    keeps its real colours and stays clickable (`pointer-events-none` on the
 *    scrim, `modal={false}` on the popover).
 * 2. "Step counter and Skip are mandatory." `step`, `total` and `onSkip` are
 *    **required props**, the counter is always rendered as text (never dots
 *    alone — the dots are decorative and `aria-hidden`), and the Skip button is
 *    always rendered inside the popup where focus lands. There is no prop that
 *    turns either off.
 * 3. "A tour is a sequence of coach-marks with shared state, not a separate
 *    component." So there is deliberately **no `<Tour>` here, and there should
 *    never be one.** This component owns exactly one step. `step`/`total`
 *    describe where that step sits and `onNext`/`onBack`/`onSkip` hand control
 *    back; the array of steps, the index and the persistence all live in the
 *    host. See the guidance module.
 *
 * On the anchor: `PopoverTrigger` renders an empty, absolutely-positioned span
 * laid over the anchor box rather than wrapping `children`. A coach-mark is
 * opened by the tour, not by the user clicking the thing it points at, and
 * wrapping an arbitrary child in a trigger would put a button inside a button
 * the moment a tour pointed at a control (axe `nested-interactive`). The span
 * is `aria-hidden` with `tabIndex={-1}`, so it is a positioning anchor and
 * nothing else.
 */

type CoachMarkSide = "top" | "right" | "bottom" | "left";
type CoachMarkAlign = "start" | "center" | "end";

/** Above this many steps the dot rail stops being readable; the text stays. */
const MAX_PROGRESS_DOTS = 8;

function defaultStepLabel(step: number, total: number) {
  return `Step ${step} of ${total}`;
}

interface CoachMarkProps
  extends Omit<React.ComponentProps<"div">, "title" | "content" | "onChange"> {
  /**
   * The heading. It is the coach-mark's accessible name — a tour step with no
   * name is announced as an unlabelled dialog, so this is required.
   */
  title: React.ReactNode;
  /** Body copy explaining the anchored element. */
  description?: React.ReactNode;
  /** The element being pointed at. Rendered untouched; the cut-out is its box. */
  children?: React.ReactNode;
  /** 1-based position of this step. Required — see rule 2 above. */
  step: number;
  /** How many steps the tour has. Required — see rule 2 above. */
  total: number;
  /** Required. There is always a way out of a tour. */
  onSkip: () => void;
  /** Advance. Omitting it renders no Next button — Skip is still there. */
  onNext?: () => void;
  /** Go back. Never rendered on the first step, whether or not it is passed. */
  onBack?: () => void;
  /**
   * Dim the rest of the page around the cut-out. Default `true`; pass `false`
   * for a tip that annotates without taking over the screen.
   */
  spotlight?: boolean;
  /** Preferred side of the anchor. The popover flips if there is no room. */
  side?: CoachMarkSide;
  align?: CoachMarkAlign;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /**
   * Move focus into the step when it opens. Default `true` — a tour that never
   * takes focus leaves Skip unreachable by keyboard. Turn it off only when the
   * host is doing its own focus choreography.
   */
  autoFocus?: boolean;
  skipLabel?: string;
  nextLabel?: string;
  backLabel?: string;
  /** Replaces the Next label on the last step. */
  finishLabel?: string;
  /** Override the counter's wording, e.g. for localisation. */
  stepLabel?: (step: number, total: number) => string;
}

function CoachMark({
  title,
  description,
  children,
  step,
  total,
  onSkip,
  onNext,
  onBack,
  spotlight = true,
  side = "bottom",
  align = "center",
  open: openProp,
  defaultOpen = true,
  onOpenChange,
  autoFocus = true,
  skipLabel = "Skip tour",
  nextLabel = "Next",
  backLabel = "Back",
  finishLabel = "Done",
  stepLabel = defaultStepLabel,
  className,
  ...props
}: CoachMarkProps) {
  // The open state is mirrored here rather than left inside Base UI, because
  // the scrim lives in the document next to the anchor — not in the popover's
  // portal — and has to appear and disappear with the popup.
  const isControlled = openProp !== undefined;
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);
  const open = isControlled ? openProp : uncontrolledOpen;

  const handleOpenChange = React.useCallback(
    (next: boolean) => {
      if (!isControlled) setUncontrolledOpen(next);
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange],
  );

  const safeTotal = Math.max(1, Math.round(total));
  const safeStep = Math.min(Math.max(1, Math.round(step)), safeTotal);
  const isFirst = safeStep === 1;
  const isLast = safeStep === safeTotal;

  // Read by the callback ref below, which must stay identity-stable: a new
  // function identity would detach and reattach the popup and re-steal focus.
  const autoFocusRef = React.useRef(autoFocus);
  React.useEffect(() => {
    autoFocusRef.current = autoFocus;
  }, [autoFocus]);

  // A coach-mark takes focus. Base UI only moves focus into a popup that was
  // opened by a real interaction, and a tour opens its steps programmatically,
  // so nothing would move focus at all — leaving Skip somewhere at the end of
  // the document for a keyboard user to hunt for. Focus lands on the popup
  // itself rather than a button so the title and description are announced
  // first; Tab from there reaches Skip.
  //
  // A callback ref rather than an effect: the popup mounts a commit later than
  // this component (Base UI portals it once positioning is ready), so a ref
  // read in `useEffect` here is still null.
  const focusOnAttach = React.useCallback((node: HTMLDivElement | null) => {
    if (!node || !autoFocusRef.current) return;
    if (node.contains(document.activeElement)) return;
    node.focus();
  }, []);

  return (
    // Deliberately **not** modal, and deliberately not `modal="trap-focus"`
    // either: both make Base UI mark everything outside the popup
    // `aria-hidden`, including the anchored element. A coach-mark whose target
    // is hidden from a screen reader has dimmed the very thing it points at —
    // the same failure the cut-out exists to prevent, one layer down. Focus is
    // moved into the popup by `focusOnAttach` above instead, which gets Skip within
    // reach of one Tab without hiding the page.
    <Popover open={open} onOpenChange={handleOpenChange} modal={false}>
      <div
        data-slot="coach-mark"
        data-step={safeStep}
        data-total={safeTotal}
        data-spotlight={spotlight ? "on" : "off"}
        data-state={open ? "open" : "closed"}
        className={cn("relative inline-block", className)}
        {...props}
      >
        {children}

        {/* Positioning anchor only. Never wraps `children`, never focusable. */}
        <PopoverTrigger
          render={<span />}
          nativeButton={false}
          data-slot="coach-mark-anchor"
          aria-hidden="true"
          tabIndex={-1}
          className="pointer-events-none absolute inset-0 block"
        />

        {spotlight && open ? (
          <>
            {/*
              The cut-out. A 9999px shadow spread paints everything *outside*
              this box and nothing inside it, so the anchor is never dimmed.
              The colour is `--foreground` in light mode and `--background` in
              dark — both resolve to the near-black the rest of the system dims
              with, without either theme flipping to a white veil.
            */}
            <span
              data-slot="coach-mark-scrim"
              aria-hidden="true"
              className="pointer-events-none absolute -inset-2 z-40 rounded-lg opacity-40 shadow-[0_0_0_9999px_var(--foreground)] dark:shadow-[0_0_0_9999px_var(--background)]"
            />
            {/* Full-strength ring, so the cut-out reads as deliberate. */}
            <span
              data-slot="coach-mark-cutout"
              aria-hidden="true"
              className="ring-ring pointer-events-none absolute -inset-2 z-40 rounded-lg ring-2"
            />
          </>
        ) : null}
      </div>

      <PopoverContent
        data-slot="coach-mark-content"
        ref={focusOnAttach}
        side={side}
        align={align}
        sideOffset={12}
        // Focus is this component's job (see `focusOnAttach`), not Base UI's.
        initialFocus={false}
        // Base UI's default would restore focus to the anchor span, which is
        // aria-hidden. The host owns where focus goes when a step closes —
        // usually the next step's coach-mark. See the guidance module.
        finalFocus={false}
        className="w-80 gap-3 p-4"
      >
        <PopoverPrimitive.Arrow
          data-slot="coach-mark-arrow"
          className="data-[side=bottom]:-top-1 data-[side=left]:-right-1 data-[side=right]:-left-1 data-[side=top]:-bottom-1"
        >
          <span className="bg-popover ring-foreground/10 block size-2.5 rotate-45 rounded-[2px] ring-1" />
        </PopoverPrimitive.Arrow>

        <PopoverHeader data-slot="coach-mark-header">
          <PopoverTitle data-slot="coach-mark-title">{title}</PopoverTitle>
          {description ? (
            <PopoverDescription data-slot="coach-mark-description">
              {description}
            </PopoverDescription>
          ) : null}
        </PopoverHeader>

        <div
          data-slot="coach-mark-footer"
          className="flex flex-wrap items-center justify-between gap-2"
        >
          {/* Mandatory, and text first: the dots are decoration on top of a
              sentence, never the only carrier of "how much is left". */}
          <p data-slot="coach-mark-step" className="flex items-center gap-2 text-xs">
            {stepLabel(safeStep, safeTotal)}
            {safeTotal <= MAX_PROGRESS_DOTS ? (
              <span aria-hidden="true" className="flex items-center gap-1">
                {Array.from({ length: safeTotal }, (_, i) => (
                  <span
                    key={i}
                    data-active={i + 1 === safeStep ? "true" : undefined}
                    className="bg-border data-[active=true]:bg-primary size-1.5 rounded-full"
                  />
                ))}
              </span>
            ) : null}
          </p>

          <div className="flex items-center gap-1.5">
            {/* Mandatory, and rendered as the popover's own Close so that
                skipping actually dismisses the step even when the host forgets
                to drive `open` — the one control that must never be a no-op. */}
            <PopoverPrimitive.Close
              data-slot="coach-mark-skip"
              onClick={onSkip}
              render={<Button variant="ghost" size="sm" type="button" />}
            >
              {skipLabel}
            </PopoverPrimitive.Close>
            {onBack && !isFirst ? (
              <Button
                data-slot="coach-mark-back"
                variant="outline"
                size="sm"
                onClick={onBack}
                type="button"
              >
                {backLabel}
              </Button>
            ) : null}
            {onNext ? (
              <Button
                data-slot="coach-mark-next"
                size="sm"
                onClick={onNext}
                type="button"
              >
                {isLast ? finishLabel : nextLabel}
              </Button>
            ) : null}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export { CoachMark, MAX_PROGRESS_DOTS };
export type { CoachMarkAlign, CoachMarkProps, CoachMarkSide };
