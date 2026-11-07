"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, Loader2, Plus, Sparkles, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Popover, PopoverContent, PopoverTitle, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { PreviewTile } from "@/registry/super-ai/preview-tile";
import { StatReadout } from "@/registry/super-ai/stat-readout";

/**
 * Reference Strip — Typed attachment slots above the prompt
 *
 * Spec: docs/design-system/component-specs.md#d2-reference-strip
 * States: empty · filled · with-roles · describe
 *
 * Built on A8 `preview-tile`: each slot is a preview-tile instance (frame,
 * loading/failed state, badge slot for remove) rather than a hand-rolled
 * thumbnail. Only the typed-slot chrome — role label, move controls, the
 * still-visible empty placeholder — lives here.
 *
 * D2's "empty slots stay visible rather than collapsing" is a *per-slot*
 * rule, separate from the catalog's whole-strip `empty` state: an item with
 * no `thumbnail` renders as a discoverable, still-present add affordance
 * (see `ReferenceSlot` below) even while sibling slots are filled — that's
 * what the `with-roles` story demonstrates. The whole-strip `empty` state
 * (no items at all) is the F4 first-class empty state instead: a full-width
 * panel with copy and a CTA, not a bare string or a single squeezed tile.
 *
 * The row uses the same Carousel base as `feature-card-row` for its
 * horizontal scroll: `role="region"` plus visible previous/next buttons are
 * what keep the strip reachable by keyboard, satisfying axe's
 * scrollable-region-focusable rule.
 */

type ReferenceRole = "reference" | "first-frame" | "last-frame" | "video-ref" | "character";

const ROLE_LABEL: Record<ReferenceRole, string> = {
  reference: "Reference",
  "first-frame": "First frame",
  "last-frame": "Last frame",
  "video-ref": "Video ref",
  character: "Character",
};

interface ReferenceStripItem {
  id: string;
  /** The role IS the data — it changes what the model does (D2). Drives the label. */
  role?: ReferenceRole;
  /** Overrides the label derived from `role`. */
  label?: React.ReactNode;
  /** Omit to render this slot as an empty, still-visible placeholder rather than collapsing it. */
  thumbnail?: { src: string; alt: string };
  state?: "loading" | "failed";
  onRemove?: () => void;
}

/**
 * What a host can say about a reference. `exact` is extracted, not guessed:
 * a prompt embedded in the file's metadata and the parameters that change
 * reproduction (seed, sampler, model), never decoration like the file size.
 * `inferred` is a model's reading of the picture; the strip shows at most
 * `MAX_INFERRED` of them.
 */
interface ReferenceDescription {
  exact?: { prompt?: string; params?: { label: string; value: string }[] };
  inferred?: string[];
}

/** Inferred prompt options shown per description; the rest are dropped. */
const MAX_INFERRED = 4;

interface ReferenceStripProps extends Omit<React.ComponentProps<"div">, "onSelect"> {
  items?: ReferenceStripItem[];
  /** Called with the slot's role (or undefined for a bare add) when an empty slot or the empty-state CTA is activated. */
  onAdd?: (role?: ReferenceRole) => void;
  /** Per-slot reorder. Omit to hide the move controls entirely. */
  onMove?: (id: string, direction: "left" | "right") => void;
  emptyTitle?: React.ReactNode;
  emptyDescription?: React.ReactNode;
  /**
   * Describes what is likely behind a filled slot. Passing it is what turns
   * the Describe action on: a host that cannot expose prompts omits it and no
   * slot offers the action. A rejection is shown as "could not be described".
   */
  onDescribe?: (slot: ReferenceStripItem) => Promise<ReferenceDescription>;
  /** Receives the prompt text the user picked from a description. */
  onUseDescription?: (text: string) => void;
}

type DescribePhase =
  | { status: "idle" }
  | { status: "pending" }
  | { status: "failed" }
  | { status: "done"; description: ReferenceDescription };

function DescribeAction({
  item,
  accessibleName,
  onDescribe,
  onUseDescription,
}: {
  item: ReferenceStripItem;
  accessibleName: string;
  onDescribe: (slot: ReferenceStripItem) => Promise<ReferenceDescription>;
  onUseDescription?: (text: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [phase, setPhase] = React.useState<DescribePhase>({ status: "idle" });
  // A newer ticket (or a cancel) makes an older in-flight result stale.
  const ticket = React.useRef(0);

  const start = () => {
    const mine = ++ticket.current;
    setPhase({ status: "pending" });
    new Promise<ReferenceDescription>((resolve) => resolve(onDescribe(item))).then(
      (description) => {
        if (ticket.current === mine) setPhase({ status: "done", description });
      },
      () => {
        if (ticket.current === mine) setPhase({ status: "failed" });
      },
    );
  };

  const cancel = () => {
    ticket.current += 1;
    setPhase({ status: "idle" });
    setOpen(false);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      if (phase.status === "pending") return cancel();
      setOpen(false);
      return;
    }
    setOpen(true);
    if (phase.status === "idle" || phase.status === "failed") start();
  };

  const use = (text: string) => {
    onUseDescription?.(text);
    setOpen(false);
  };

  const statusText =
    phase.status === "pending"
      ? `Describing ${accessibleName}`
      : phase.status === "failed"
        ? `${accessibleName} could not be described`
        : "";

  return (
    <div data-slot="reference-strip-describe" data-state={phase.status}>
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger
          render={
            <Button
              type="button"
              variant="outline"
              size="xs"
              data-slot="reference-strip-describe-trigger"
              aria-label={`Describe ${accessibleName}`}
            />
          }
        >
          <Sparkles aria-hidden /> Describe
        </PopoverTrigger>
        <PopoverContent
          data-slot="reference-strip-describe-panel"
          className="w-80 max-w-[calc(100vw-2rem)] motion-reduce:data-closed:animate-none motion-reduce:data-open:animate-none"
        >
          <PopoverTitle>{`About ${accessibleName}`}</PopoverTitle>
          {phase.status === "pending" ? (
            <div data-slot="reference-strip-describe-pending" className="flex items-center gap-2 text-sm">
              <Loader2 aria-hidden className="size-4 shrink-0 animate-spin motion-reduce:animate-none" />
              <span className="min-w-0 flex-1">Describing this reference…</span>
              <Button type="button" variant="ghost" size="xs" onClick={cancel}>
                Cancel
              </Button>
            </div>
          ) : null}
          {phase.status === "failed" ? (
            <div data-slot="reference-strip-describe-failed" className="flex items-center gap-2 text-sm">
              <span className="min-w-0 flex-1">This reference could not be described.</span>
              <Button type="button" variant="outline" size="xs" onClick={start}>
                Try again
              </Button>
            </div>
          ) : null}
          {phase.status === "done" ? <DescriptionResult description={phase.description} onUse={use} /> : null}
        </PopoverContent>
      </Popover>
      {/* Always mounted so the pending and failed changes are announced. */}
      <span data-slot="reference-strip-describe-status" role="status" className="sr-only">
        {statusText}
      </span>
    </div>
  );
}

function DescriptionResult({
  description,
  onUse,
}: {
  description: ReferenceDescription;
  onUse: (text: string) => void;
}) {
  const prompt = description.exact?.prompt?.trim();
  const params = (description.exact?.params ?? []).filter((param) => param.value.trim() !== "");
  const inferred = (description.inferred ?? []).filter((text) => text.trim() !== "").slice(0, MAX_INFERRED);

  if (!prompt && params.length === 0 && inferred.length === 0) {
    return (
      <p data-slot="reference-strip-describe-none" className="text-sm">
        Nothing could be read from this reference.
      </p>
    );
  }

  return (
    <div data-slot="reference-strip-describe-result" className="flex flex-col gap-3">
      {prompt || params.length > 0 ? (
        <section data-slot="reference-strip-describe-exact" className="flex flex-col gap-1.5">
          <h3 className="text-xs font-medium">Extracted</h3>
          {prompt ? <DescriptionOption text={prompt} onUse={onUse} /> : null}
          {params.length > 0 ? <StatReadout items={params} /> : null}
        </section>
      ) : null}
      {inferred.length > 0 ? (
        <section data-slot="reference-strip-describe-inferred" className="flex flex-col gap-1.5">
          <h3 className="text-xs font-medium">Inferred, may not match</h3>
          <ul className="flex flex-col gap-1.5">
            {inferred.map((text, index) => (
              <li key={index}>
                <DescriptionOption text={text} onUse={onUse} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function DescriptionOption({ text, onUse }: { text: string; onUse: (text: string) => void }) {
  return (
    <div data-slot="reference-strip-describe-option" className="flex items-start gap-2">
      <p className="min-w-0 flex-1 text-sm">{text}</p>
      <Button
        type="button"
        variant="outline"
        size="xs"
        data-slot="reference-strip-describe-use"
        aria-label={`Use prompt: ${text}`}
        onClick={() => onUse(text)}
      >
        Use
      </Button>
    </div>
  );
}

function ReferenceSlot({
  item,
  index,
  count,
  showRole,
  onAdd,
  onMove,
  onDescribe,
  onUseDescription,
}: {
  item: ReferenceStripItem;
  index: number;
  count: number;
  showRole: boolean;
  onAdd?: (role?: ReferenceRole) => void;
  onMove?: (id: string, direction: "left" | "right") => void;
  onDescribe?: ReferenceStripProps["onDescribe"];
  onUseDescription?: ReferenceStripProps["onUseDescription"];
}) {
  const roleLabel = item.label ?? (item.role ? ROLE_LABEL[item.role] : undefined);
  const accessibleName = typeof roleLabel === "string" ? roleLabel : "reference";

  if (!item.thumbnail) {
    return (
      <div data-slot="reference-strip-slot" data-state="slot-empty" className="flex w-full flex-col gap-1.5">
        <PreviewTile aspect="square" onSelect={onAdd ? () => onAdd(item.role) : undefined}>
          {/* text-foreground, not text-muted-foreground: the tile frame's own
              background is bg-muted, and that pairing fails contrast (see
              docs/design-system/a11y-baseline.md). */}
          <div className="text-foreground flex h-full w-full flex-col items-center justify-center gap-1 p-2 text-center text-xs">
            <Plus className="size-4" aria-hidden />
            <span>{showRole && roleLabel ? roleLabel : "Add"}</span>
          </div>
        </PreviewTile>
      </div>
    );
  }

  return (
    <div data-slot="reference-strip-slot" data-state="slot-filled" className="flex w-full flex-col gap-1.5">
      <PreviewTile
        aspect="square"
        state={item.state ?? "default"}
        labelPlacement="none"
        action={item.state === "failed" ? <span>Couldn&apos;t load</span> : undefined}
        badge={
          item.onRemove ? (
            <Button
              type="button"
              variant="secondary"
              size="icon-xs"
              data-slot="reference-strip-remove"
              aria-label={`Remove ${accessibleName}`}
              onClick={item.onRemove}
              className="rounded-full"
            >
              <X aria-hidden />
            </Button>
          ) : undefined
        }
      >
        <img src={item.thumbnail.src} alt={item.thumbnail.alt} className="h-full w-full object-cover" />
      </PreviewTile>
      {showRole || onMove ? (
        <div className="flex items-center justify-between gap-1">
          {showRole ? (
            <span data-slot="reference-strip-role" className="text-foreground min-w-0 truncate text-xs">
              {roleLabel}
            </span>
          ) : (
            <span />
          )}
          {onMove ? (
            <div className="flex shrink-0 gap-0.5">
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                data-slot="reference-strip-move"
                aria-label={`Move ${accessibleName} left`}
                disabled={index === 0}
                onClick={() => onMove(item.id, "left")}
              >
                <ChevronLeft aria-hidden />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                data-slot="reference-strip-move"
                aria-label={`Move ${accessibleName} right`}
                disabled={index === count - 1}
                onClick={() => onMove(item.id, "right")}
              >
                <ChevronRight aria-hidden />
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}
      {onDescribe && !item.state ? (
        <DescribeAction
          item={item}
          accessibleName={accessibleName}
          onDescribe={onDescribe}
          onUseDescription={onUseDescription}
        />
      ) : null}
    </div>
  );
}

function ReferenceStrip({
  items = [],
  onAdd,
  onMove,
  onDescribe,
  onUseDescription,
  emptyTitle = "No references yet",
  emptyDescription = "Attach an image, frame or character to guide generation.",
  className,
  ...props
}: ReferenceStripProps) {
  if (items.length === 0) {
    return (
      <div data-slot="reference-strip" data-state="empty" className={cn("w-full", className)} {...props}>
        <div
          data-slot="reference-strip-empty"
          className="border-border flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-6 text-center"
        >
          <p className="text-foreground text-sm font-medium">{emptyTitle}</p>
          <p className="text-muted-foreground text-xs">{emptyDescription}</p>
          {onAdd ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              data-slot="reference-strip-add"
              onClick={() => onAdd()}
            >
              <Plus aria-hidden /> Add reference
            </Button>
          ) : null}
        </div>
      </div>
    );
  }

  const hasRoles = items.some((item) => item.role || item.label);

  return (
    <Carousel
      opts={{ align: "start", dragFree: true }}
      data-slot="reference-strip"
      data-state={hasRoles ? "with-roles" : "filled"}
      className={cn("w-full", className)}
      {...props}
    >
      <CarouselContent>
        {items.map((item, index) => (
          <CarouselItem key={item.id} data-slot="reference-strip-item" className="basis-24 sm:basis-28">
            <ReferenceSlot
              item={item}
              index={index}
              count={items.length}
              showRole={hasRoles}
              onAdd={onAdd}
              onMove={onMove}
              onDescribe={onDescribe}
              onUseDescription={onUseDescription}
            />
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious data-slot="reference-strip-previous" />
      <CarouselNext data-slot="reference-strip-next" />
    </Carousel>
  );
}

export { ReferenceStrip };
export type { ReferenceStripItem, ReferenceStripProps, ReferenceRole, ReferenceDescription };
