"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress, ProgressLabel } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { PreviewTile, type PreviewTileAspect, type PreviewTileState } from "@/registry/super-ai/preview-tile";

/**
 * Result Card — one generated asset, anywhere it appears.
 *
 * Spec: docs/design-system/component-specs.md#f1-result-card
 * States: idle · queued · streaming · done · failed · locked
 *
 * The load-bearing property is that **the box is identical in all six states**.
 * Everything that varies is either inside A8 `preview-tile`'s fixed-aspect
 * frame, absolutely positioned over it, or in a footer whose height is
 * reserved unconditionally. A grid of these never reflows as results resolve.
 *
 * Composition: this builds on A8 rather than reimplementing the frame, per
 * component-specs.md:432 ("Built on: A8") — A8's `locked` was written for this
 * component specifically ("locked shows the shape of what would have been
 * made, then the CTA", preview-tile.tsx:81-82) and already guarantees stable
 * geometry across its four states.
 */

/**
 * The six-name lifecycle union the State contract fixes — "idle · queued ·
 * streaming · done · failed · locked on every generation-aware component"
 * (concept-model.md:108). Declared locally because the shared contract module
 * the wave-4 spec §2.5 specifies has not been built; when it lands this type
 * should collapse into it rather than be duplicated. Note `streaming`, never
 * `running` — the two names must not both survive (wave-4 spec §1.6).
 */
type ResultCardState = "idle" | "queued" | "streaming" | "done" | "failed" | "locked";

/**
 * F1's six states onto A8's four (wave-4 spec §3.3). `streaming` maps to A8's
 * `loading` plus an F1-owned progress overlay rather than adding `streaming`
 * to A8 — four of A8's five consumers (preset grids, frame strips) can never
 * enter it, so it does not belong in the primitive. Deliberate, not an
 * oversight.
 */
const TILE_STATE: Record<ResultCardState, PreviewTileState> = {
  idle: "loading",
  queued: "loading",
  streaming: "loading",
  done: "default",
  failed: "failed",
  locked: "locked",
};

const STATUS_TEXT: Record<ResultCardState, string> = {
  idle: "Not started",
  queued: "Queued",
  streaming: "Generating",
  done: "Result ready",
  failed: "Generation failed",
  locked: "Locked",
};

interface ResultCardProps extends Omit<React.ComponentProps<"div">, "onSelect"> {
  state?: ResultCardState;
  /** Passthrough to A8. Fixes the frame, and with it the whole card's height. */
  aspect?: PreviewTileAspect;
  /** 0-100. `streaming` only; omit for an indeterminate bar. */
  progress?: number;
  /** Prompt excerpt. Rendered in A8's overlay label slot, so it costs no layout. */
  label?: React.ReactNode;
  /** Type · duration · queue position. A8's badge slot. */
  badge?: React.ReactNode;
  /** Actions · cost · provenance. Its height is reserved in every state. */
  footer?: React.ReactNode;
  /** Hover actions. Suppressed in select mode — the two are never both live. */
  actions?: React.ReactNode;
  /** Select mode, driven by F2 `generation-grid`. */
  selectable?: boolean;
  selected?: boolean;
  onSelect?: () => void;
  /** `failed` only. Retry belongs inside the card; a toast loses the association. */
  onRetry?: () => void;
  /** `locked` only. M5-shaped, but never an M5 import — M5 is a layer above. */
  lockedAction?: React.ReactNode;
  /** The media. Opaque, exactly as A8 treats it. */
  children?: React.ReactNode;
}

function ResultCard({
  state = "idle",
  aspect = "square",
  progress,
  label,
  badge,
  footer,
  actions,
  selectable = false,
  selected = false,
  onSelect,
  onRetry,
  lockedAction,
  className,
  children,
  ...props
}: ResultCardProps) {
  const selectLabelId = React.useId();

  // A8 draws its `action` slot INSIDE the frame, so in `failed` and `locked`
  // the frame already hosts a control (Retry, or the unlock CTA). Making the
  // frame a button in those states nests one interactive inside another, which
  // axe fails outright — and it is the wrong affordance anyway: a failed or
  // locked result is something you retry or unlock, not something you pick.
  const hostsOverlayAction = state === "failed" || state === "locked";

  // In select mode the checkbox owns selection, so the tile must not also be a
  // button — that would be two controls for one fact, and a checkbox layered
  // over a button. Otherwise the tile is interactive only when a handler
  // exists, which is A8's own rule (preview-tile.tsx:41-42).
  const tileInteractive = !selectable && !hostsOverlayAction && typeof onSelect === "function";

  // A8 renders `action` inside whichever of its `failed`/`locked` treatments is
  // showing, and nothing at all otherwise.
  const tileAction =
    state === "failed" ? (
      <>
        <AlertTriangle aria-hidden className="size-4" />
        {/* text-foreground, not the inherited text-destructive: destructive on
            the frame's bg-muted is the contrast pairing this system keeps
            failing. The icon carries the colour, the words carry the meaning,
            so nothing here is conveyed by colour alone. */}
        <span className="text-foreground">{STATUS_TEXT.failed}</span>
        {onRetry ? (
          <Button data-slot="result-card-retry" type="button" size="sm" variant="outline" onClick={onRetry}>
            <RotateCcw aria-hidden />
            Retry
          </Button>
        ) : null}
      </>
    ) : state === "locked" ? (
      lockedAction
    ) : null;

  return (
    <Card
      data-slot="result-card"
      data-state={state}
      // gap-3 replaces the card's default spacing between media and footer.
      className={cn("gap-3", className)}
      {...props}
    >
      {/* The card keeps its own horizontal padding so A8's selected ring —
          ring-offset-2 — is not clipped by the card's overflow-hidden. */}
      <div className="px-(--card-spacing)">
        <div data-slot="result-card-media" className="relative">
          <PreviewTile
            aspect={aspect}
            state={TILE_STATE[state]}
            selected={selected}
            label={label}
            badge={badge}
            action={tileAction}
            {...(tileInteractive ? { onSelect } : {})}
          >
            {children}
          </PreviewTile>

          {state === "streaming" ? (
            // Pinned to the top of the frame: A8 puts its overlay label at the
            // bottom, and absolute positioning contributes no layout either way.
            <div data-slot="result-card-progress" className="absolute inset-x-2 top-2">
              <Progress value={progress ?? null}>
                <ProgressLabel className="sr-only">Generation progress</ProgressLabel>
              </Progress>
            </div>
          ) : null}

          {/* One slot, two mutually exclusive occupants: "Select mode replaces
              hover actions with checkboxes. Both cannot be live at once."
              (component-specs.md:447) */}
          {selectable ? (
            <div data-slot="result-card-select" className="absolute top-2 left-2">
              <Checkbox
                checked={selected}
                onCheckedChange={onSelect ? () => onSelect() : undefined}
                aria-labelledby={selectLabelId}
              />
              <span id={selectLabelId} className="sr-only">
                Select this result
              </span>
            </div>
          ) : actions ? (
            <div
              data-slot="result-card-actions"
              // opacity, never display:none — a hover affordance that is not
              // keyboard reachable is an a11y failure, so focus-within reveals
              // it too and it stays in the tab order throughout.
              className="absolute top-2 left-2 opacity-0 transition-opacity group-hover/card:opacity-100 group-focus-within/card:opacity-100"
            >
              {actions}
            </div>
          ) : null}
        </div>
      </div>

      {/* Reserved in EVERY state. A footer that appears only in `done`
          reintroduces exactly the reflow A8 exists to prevent — which is why
          this div is unconditional and carries a min height. */}
      <div
        data-slot="result-card-footer"
        className="text-foreground mx-(--card-spacing) flex min-h-9 items-center gap-2 border-t pt-2 text-xs"
      >
        {footer}
      </div>

      <span data-slot="result-card-status" role="status" className="sr-only">
        {state === "streaming" && typeof progress === "number"
          ? `${STATUS_TEXT.streaming}, ${Math.round(progress)}%`
          : STATUS_TEXT[state]}
      </span>
    </Card>
  );
}

export { ResultCard };
export type { ResultCardProps, ResultCardState };
