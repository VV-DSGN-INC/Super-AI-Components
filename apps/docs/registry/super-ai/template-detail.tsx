"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { FieldRow } from "@/registry/super-ai/field-row";
import { PreviewTile } from "@/registry/super-ai/preview-tile";

/**
 * Template Detail — Template preview modal
 *
 * Spec: docs/design-system/component-specs.md#j6-template-detail
 * States: preview-strip · option-selects · author-follow · more-like-this
 *
 * **Options are configured before commit.** The primary action emits the
 * *configured* template — `onUseTemplate({ templateId, options })` — so the
 * option values are part of the commit, not something the host re-reads off
 * the component afterwards. A modal that commits a bare id has not customised
 * anything on the way in; it has only opened a second configuration step.
 *
 * **"More like this" never dead-ends, and the API is what guarantees it.**
 * The component is handed a `templates` *pool* and renders whichever member is
 * current, rather than being handed one template plus a list of ids it hands
 * back to the host. Picking a related tile therefore changes `templateId` and
 * nothing else — `open` is untouched, so the modal structurally cannot close
 * on the way to the next template. A host that wants to observe the move gets
 * `onTemplateChange`; a host that wants to drive it passes `templateId`.
 *
 * Preview and thumbnail strip follow H5 `frame-strip`: the strip is the
 * vendored Carousel, whose transform-scrolling sidesteps axe's
 * `scrollable-region-focusable` and whose visible previous/next buttons keep it
 * keyboard reachable. As there, `data-slot` on the Carousel is overridden —
 * house idiom for a *vendored* primitive, nothing keys on those — and each
 * thumbnail is one real `<button aria-current>` wrapping an inert A8
 * `preview-tile`, never A8's own `onSelect` (which renders `aria-pressed`,
 * toggle semantics, wrong for "which preview am I looking at").
 *
 * Base UI renders `Dialog.Popup` as `role="dialog"`, and a dialog with no
 * accessible name fails axe `aria-dialog-name` outright — L3
 * `feature-announcement` shipped that bug once. The popup is pointed
 * explicitly at the visible template title.
 */

interface TemplateDetailPreview {
  id: string;
  /**
   * Required: this is the thumbnail's accessible name. A preview identified
   * only by its picture is not identifiable at all to a screen reader.
   */
  label: string;
  /** The full-size preview. Decorative — pass `alt=""`; `label` names it. */
  media?: React.ReactNode;
  /** Strip art, when the full-size node is too heavy to render twice. */
  thumbnail?: React.ReactNode;
}

interface TemplateDetailOptionChoice {
  value: string;
  label: string;
}

/**
 * One configurable dimension of the template — size, page count, colourway.
 * Rendered as a labelled select, so the row reads the same as every other
 * settings row in the system (A6 `field-row`).
 */
interface TemplateDetailOption {
  id: string;
  label: string;
  choices: TemplateDetailOptionChoice[];
  /** Falls back to the first choice, so an option always has a committed value. */
  defaultValue?: string;
  hint?: string;
}

interface TemplateDetailAuthor {
  id: string;
  /** Also the follow control's accessible name, so it has to read as text. */
  name: string;
  avatar?: React.ReactNode;
  /** "1.2k templates", "Joined 2021" — whatever makes the author a person. */
  meta?: React.ReactNode;
  /**
   * Supply it and follow is controlled; omit it and the toggle keeps its own
   * state. Either way `onFollowChange` fires with the author id, so one
   * handler serves every author the modal can swap through.
   */
  following?: boolean;
}

interface TemplateDetailTemplate {
  id: string;
  /** The visible title, and the accessible name of the dialog itself. */
  title: string;
  description?: React.ReactNode;
  previews?: TemplateDetailPreview[];
  options?: TemplateDetailOption[];
  author?: TemplateDetailAuthor;
  /** Tile art for when this template appears in another one's "more like this". */
  thumbnail?: React.ReactNode;
  /**
   * Which pool members are "more like this". Omit and every *other* template
   * in the pool qualifies, which is the right default for a small hand-picked
   * pool and the reason the demo needs no wiring.
   */
  relatedIds?: string[];
}

interface TemplateDetailProps
  extends Omit<React.ComponentProps<"div">, "onSelect" | "title" | "defaultValue" | "children"> {
  /**
   * The template on screen *and* everything reachable from it. Handing the
   * component a pool rather than a single template is what makes the
   * "more like this" swap in-place by construction.
   */
  templates: TemplateDetailTemplate[];
  templateId?: string;
  defaultTemplateId?: string;
  onTemplateChange?: (id: string) => void;
  /** Which preview the hero shows. Uncontrolled per template by default. */
  previewId?: string;
  onPreviewChange?: (id: string) => void;
  /** Controlled option values, keyed by option id. Merged over the defaults. */
  optionValues?: Record<string, string>;
  onOptionValuesChange?: (values: Record<string, string>) => void;
  /**
   * The commit. Receives the configured template — id *and* option values —
   * because the options were configured on the way in, not afterwards.
   */
  onUseTemplate?: (payload: { templateId: string; options: Record<string, string> }) => void;
  useLabel?: React.ReactNode;
  onFollowChange?: (authorId: string, following: boolean) => void;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  showCloseButton?: boolean;
}

function TemplateDetail({
  templates,
  templateId: templateIdProp,
  defaultTemplateId,
  onTemplateChange,
  previewId: previewIdProp,
  onPreviewChange,
  optionValues,
  onOptionValuesChange,
  onUseTemplate,
  useLabel = "Use this template",
  onFollowChange,
  open,
  defaultOpen,
  onOpenChange,
  showCloseButton = true,
  className,
  ...props
}: TemplateDetailProps) {
  const titleId = React.useId();

  const [internalTemplateId, setInternalTemplateId] = React.useState(defaultTemplateId);
  const currentId = templateIdProp ?? internalTemplateId ?? templates[0]?.id;
  const template = templates.find((entry) => entry.id === currentId) ?? templates[0];

  // Per-template maps rather than one flat map reset on change: adjusting state
  // in an effect is banned in this repo (react-hooks/set-state-in-effect), and
  // keying by template id means stepping through "more like this" and back
  // finds the options exactly as they were left.
  const [previewOverrides, setPreviewOverrides] = React.useState<Record<string, string>>({});
  const [optionOverrides, setOptionOverrides] = React.useState<Record<string, Record<string, string>>>({});
  const [followOverrides, setFollowOverrides] = React.useState<Record<string, boolean>>({});

  const previews = React.useMemo(() => template?.previews ?? [], [template]);
  const options = React.useMemo(() => template?.options ?? [], [template]);

  // Every option always resolves to a value, so the commit payload can never
  // carry a half-configured template.
  const optionDefaults = React.useMemo(() => {
    const out: Record<string, string> = {};
    for (const option of options) out[option.id] = option.defaultValue ?? option.choices[0]?.value ?? "";
    return out;
  }, [options]);

  const related = React.useMemo(() => {
    if (!template) return [];
    const pool = template.relatedIds
      ? template.relatedIds.map((id) => templates.find((entry) => entry.id === id))
      : templates;
    return pool.filter((entry): entry is TemplateDetailTemplate => Boolean(entry) && entry!.id !== template.id);
  }, [template, templates]);

  if (!template) return null;

  const activePreviewId = previewIdProp ?? previewOverrides[template.id] ?? previews[0]?.id;
  const activePreview = previews.find((preview) => preview.id === activePreviewId) ?? previews[0];

  const optionsControlled = optionValues !== undefined;
  const resolvedOptions: Record<string, string> = {
    ...optionDefaults,
    ...(optionsControlled ? optionValues : (optionOverrides[template.id] ?? {})),
  };

  const author = template.author;
  const following = author ? (author.following ?? followOverrides[author.id] ?? false) : false;

  const selectPreview = (id: string) => {
    if (previewIdProp === undefined) setPreviewOverrides((prev) => ({ ...prev, [template.id]: id }));
    onPreviewChange?.(id);
  };

  const setOption = (optionId: string, value: string) => {
    if (!optionsControlled) {
      setOptionOverrides((prev) => ({ ...prev, [template.id]: { ...(prev[template.id] ?? {}), [optionId]: value } }));
    }
    onOptionValuesChange?.({ ...resolvedOptions, [optionId]: value });
  };

  const toggleFollow = () => {
    if (!author) return;
    const next = !following;
    if (author.following === undefined) setFollowOverrides((prev) => ({ ...prev, [author.id]: next }));
    onFollowChange?.(author.id, next);
  };

  // Swaps the modal's content. `open` is deliberately not touched — that is the
  // whole "never dead-ends" guarantee, expressed as code rather than a comment.
  const selectRelated = (id: string) => {
    if (templateIdProp === undefined) setInternalTemplateId(id);
    onTemplateChange?.(id);
  };

  return (
    <Dialog open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
      <DialogContent
        data-slot="template-detail"
        data-template-id={template.id}
        // Base UI's popup is role="dialog"; without a name it fails axe
        // aria-dialog-name. Pointed at the visible title, not a hidden string.
        aria-labelledby={titleId}
        showCloseButton={showCloseButton}
        className={cn("sm:max-w-3xl", className)}
        {...props}
      >
        <div className="grid gap-5 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <div className="flex min-w-0 flex-col gap-3">
            <div data-slot="template-detail-preview">
              <PreviewTile aspect="video" labelPlacement="none">
                {activePreview?.media}
              </PreviewTile>
            </div>

            {previews.length > 1 ? (
              // Vendored Carousel, data-slot overridden — the house idiom for
              // vendored primitives (H5 frame-strip does the same). Transform
              // scrolling, so no focusable-scroll-region violation.
              <Carousel
                opts={{ align: "start", dragFree: true }}
                data-slot="template-detail-strip"
                aria-label={`${template.title} previews`}
                className="w-full"
              >
                <CarouselContent>
                  {previews.map((preview) => {
                    const active = preview.id === activePreview?.id;
                    return (
                      <CarouselItem key={preview.id} className="basis-24 py-1 pr-1">
                        <button
                          type="button"
                          data-slot="template-detail-thumb"
                          // aria-current, not aria-pressed: "the preview you are
                          // looking at" within a set, and a real programmatic
                          // state so the ring is never the only carrier.
                          aria-current={active ? "true" : undefined}
                          onClick={() => selectPreview(preview.id)}
                          className="focus-visible:ring-ring w-full rounded-lg text-left focus-visible:ring-2 focus-visible:outline-none"
                        >
                          <PreviewTile aspect="video" selected={active} label={preview.label} labelPlacement="overlay">
                            {preview.thumbnail ?? preview.media}
                          </PreviewTile>
                        </button>
                      </CarouselItem>
                    );
                  })}
                </CarouselContent>
                <CarouselPrevious data-slot="template-detail-strip-previous" className="left-1" />
                <CarouselNext data-slot="template-detail-strip-next" className="right-1" />
              </Carousel>
            ) : null}
          </div>

          <div className="flex min-w-0 flex-col gap-4">
            <DialogHeader>
              <DialogTitle id={titleId} data-slot="template-detail-title">
                {template.title}
              </DialogTitle>
              {template.description ? (
                <DialogDescription data-slot="template-detail-description">{template.description}</DialogDescription>
              ) : null}
            </DialogHeader>

            {author ? (
              <div data-slot="template-detail-author" className="flex items-center gap-2">
                <span
                  data-slot="template-detail-avatar"
                  aria-hidden
                  className="bg-muted text-foreground flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full text-xs font-medium"
                >
                  {author.avatar ?? author.name.slice(0, 1)}
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span data-slot="template-detail-author-name" className="text-foreground truncate text-sm font-medium">
                    {author.name}
                  </span>
                  {author.meta ? (
                    <span data-slot="template-detail-author-meta" className="text-muted-foreground truncate text-xs">
                      {author.meta}
                    </span>
                  ) : null}
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant={following ? "outline" : "default"}
                  data-slot="template-detail-follow"
                  // A real toggle, and its name says *whose* follow this is —
                  // a page of bare "Follow" buttons is indistinguishable in a
                  // list of controls. Split rather than a suffixed sr-only
                  // span, which accname would concatenate ("FollowMarta Lin").
                  aria-pressed={following}
                  onClick={toggleFollow}
                >
                  <span aria-hidden>{following ? "Following" : "Follow"}</span>
                  <span className="sr-only">
                    {following ? `Following ${author.name}` : `Follow ${author.name}`}
                  </span>
                </Button>
              </div>
            ) : null}

            {options.length > 0 ? (
              <div data-slot="template-detail-options" className="flex flex-col gap-3">
                <h3 className="text-foreground text-xs font-medium">Options</h3>
                {options.map((option) => (
                  // No data-slot override: FieldRow spreads ...props after
                  // its own attributes, so one would erase `field-row` and
                  // hide that this is a composed A6 (CONTINUE.md §4).
                  // data-option-id is the real handle for addressing a row.
                  <FieldRow
                    key={option.id}
                    data-option-id={option.id}
                    label={option.label}
                    hint={option.hint}
                  >
                    {(controlId) => (
                      <Select
                        // Base UI reads `items` to render the *label* of the
                        // current value on the trigger. Without it the trigger
                        // shows the raw value ("16-9"), which is the id, not a
                        // word anybody chose.
                        items={option.choices.map((choice) => ({ value: choice.value, label: choice.label }))}
                        value={resolvedOptions[option.id] ?? ""}
                        onValueChange={(next) => setOption(option.id, String(next))}
                      >
                        {/* Named by A6's <label htmlFor>, so the control reads
                            as "Size" rather than as its current value. */}
                        <SelectTrigger id={controlId} size="sm" className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {option.choices.map((choice) => (
                            <SelectItem key={choice.value} value={choice.value}>
                              {choice.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </FieldRow>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        {related.length > 0 ? (
          <div data-slot="template-detail-related" className="flex flex-col gap-2">
            <h3 className="text-foreground text-xs font-medium">More like this</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {related.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  data-slot="template-detail-related-item"
                  data-template-id={entry.id}
                  onClick={() => selectRelated(entry.id)}
                  className="focus-visible:ring-ring rounded-lg text-left focus-visible:ring-2 focus-visible:outline-none"
                >
                  {/* An inert A8 tile inside one real button: A8's own
                      `onSelect` would make the frame a second interactive and
                      its `action` slot draws *inside* the frame, which is the
                      nested-interactive failure F1 result-card had to work
                      around. Nothing is ever put in `action` here, and the
                      `failed` state is never rendered — its text-destructive on
                      A8's bg-muted is ~4.0:1. */}
                  <PreviewTile aspect="video" label={entry.title} labelPlacement="below">
                    {entry.thumbnail ?? entry.previews?.[0]?.thumbnail ?? entry.previews?.[0]?.media}
                  </PreviewTile>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <DialogFooter>
          <Button
            type="button"
            data-slot="template-detail-use"
            disabled={!onUseTemplate}
            onClick={() => onUseTemplate?.({ templateId: template.id, options: resolvedOptions })}
          >
            {useLabel}
          </Button>
        </DialogFooter>

        {/* Swapping to a related template replaces everything above without a
            navigation, so the change is announced rather than silent. */}
        <span data-slot="template-detail-status" role="status" className="sr-only">
          Showing {template.title}
        </span>
      </DialogContent>
    </Dialog>
  );
}

export { TemplateDetail };
export type {
  TemplateDetailAuthor,
  TemplateDetailOption,
  TemplateDetailOptionChoice,
  TemplateDetailPreview,
  TemplateDetailProps,
  TemplateDetailTemplate,
};
