"use client";

import { ChevronDown, Upload, X } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { CostChip } from "@/registry/super-ai/cost-chip";
import { PreviewTile } from "@/registry/super-ai/preview-tile";

/**
 * Generation Panel — The left config column of a tool app
 *
 * Spec: docs/design-system/component-specs.md#e1-generation-panel
 * States: dropzone · directions · presets · settings · cost-and-generate
 *
 * This is an assembly, not a variant switch: the five declared states are
 * the fixed top-to-bottom stages of one panel (spec order is load-bearing —
 * inputs → directions → presets → settings → cost + Generate). Following
 * the app-sidebar (B1) precedent, `presets`, `settings` and `generate` are
 * taken as plain `ReactNode` slots — E4 preset-grid, E2 model-picker + E3
 * parameter-panel, and E5 run-button are being built concurrently elsewhere
 * in this catalog and are composed here, never imported. The dropzone and
 * directions stages have no standalone catalog entry of their own, so this
 * component owns their real mechanics directly (drag/drop + keyboard file
 * intake, and the prompt textarea) rather than leaving them as inert slots.
 *
 * Sections collapse independently, but the cost-and-generate row lives in a
 * `CardFooter` outside the scrolling body, so it never requires scrolling
 * to reach — the F1 finding ("the price belongs at the point of spend")
 * only holds if Generate and its cost are always on screen together.
 */

interface GenerationPanelFile {
  id: string;
  name: string;
  /** Thumbnail for image-like uploads. Omit to render the filename instead. */
  preview?: string;
}

type GenerationPanelSectionKey = "dropzone" | "directions" | "presets" | "settings";

const DEFAULT_SECTION_TITLES: Record<GenerationPanelSectionKey, string> = {
  dropzone: "Source",
  directions: "Directions",
  presets: "Presets",
  settings: "Settings",
};

const ALL_SECTIONS: GenerationPanelSectionKey[] = ["dropzone", "directions", "presets", "settings"];

interface GenerationPanelProps extends Omit<React.ComponentProps<"div">, "children" | "onSubmit"> {
  // Stage 1 — dropzone.
  /** Uploaded/attached files, rendered as a preview-tile grid. */
  files?: GenerationPanelFile[];
  /** Presence of this handler is what turns the dropzone stage on. */
  onFilesAdd?: (files: FileList) => void;
  onFileRemove?: (id: string) => void;
  accept?: string;
  multiple?: boolean;
  /** Accessible name for the file input and its visible trigger button. */
  dropzoneLabel?: string;
  dropzoneDescription?: React.ReactNode;

  // Stage 2 — directions.
  directions?: string;
  onDirectionsChange?: (value: string) => void;
  directionsLabel?: string;
  directionsPlaceholder?: string;

  // Stages 3–5 — composed from sibling catalog components built concurrently
  // (E2–E5). Omitting a slot hides that stage entirely.
  /** E4 preset-grid, typically. */
  presets?: React.ReactNode;
  /** E2 model-picker and/or E3 parameter-panel (or A7 gen-settings-bar for a lighter strip). */
  settings?: React.ReactNode;
  /** E5 run-button, typically. Always rendered in the same row as `cost` — see class docs above. */
  generate?: React.ReactNode;

  /** Cost at the point of spend (F1/M2) — the same number shown on E5 and D1. */
  cost?: number | string;
  costUnit?: string;

  /** Override any stage's heading copy. */
  sectionTitles?: Partial<Record<GenerationPanelSectionKey, React.ReactNode>>;
  /** Which stages start expanded. Defaults to all of them. */
  defaultOpenSections?: GenerationPanelSectionKey[];
}

function GenerationPanelSection({
  stage,
  title,
  defaultOpen,
  children,
}: {
  stage: GenerationPanelSectionKey;
  title: React.ReactNode;
  defaultOpen: boolean;
  children: React.ReactNode;
}) {
  const headingId = React.useId();

  return (
    <Collapsible
      data-slot="generation-panel-section"
      data-stage={stage}
      defaultOpen={defaultOpen}
      className="border-b py-3 last:border-b-0"
    >
      <CollapsibleTrigger
        data-slot="generation-panel-section-trigger"
        className="group focus-visible:ring-ring flex w-full items-center justify-between gap-2 text-left focus-visible:ring-2 focus-visible:outline-none"
      >
        <h3 id={headingId} className="text-foreground text-sm font-semibold">
          {title}
        </h3>
        <ChevronDown
          aria-hidden
          className="text-muted-foreground size-4 shrink-0 transition-transform group-data-[panel-open]:rotate-180"
        />
      </CollapsibleTrigger>
      <CollapsibleContent data-slot="generation-panel-section-content">
        <div role="group" aria-labelledby={headingId} className="pt-3">
          {children}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function GenerationPanelDropzone({
  files,
  onFilesAdd,
  onFileRemove,
  accept,
  multiple,
  label,
  description,
}: {
  files?: GenerationPanelFile[];
  onFilesAdd?: (files: FileList) => void;
  onFileRemove?: (id: string) => void;
  accept?: string;
  multiple?: boolean;
  label: string;
  description: React.ReactNode;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = React.useState(false);

  const openPicker = () => inputRef.current?.click();

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      onFilesAdd?.(event.target.files);
    }
    // Reset so selecting the same file twice still fires a change.
    event.target.value = "";
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(false);
    if (event.dataTransfer.files.length > 0) onFilesAdd?.(event.dataTransfer.files);
  };

  return (
    <div data-slot="generation-panel-dropzone" data-drag-over={dragOver || undefined} className="flex flex-col gap-2">
      {/* The visible trigger is a real button — Enter/Space opens the file
          picker without touching the mouse. Drag-and-drop on the wrapping
          div is additive, never a replacement for it. */}
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={cn("rounded-lg border border-dashed p-4 transition-colors", dragOver && "border-ring bg-muted/50")}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          aria-label={label}
          onChange={handleInputChange}
          data-slot="generation-panel-dropzone-input"
          className="sr-only"
        />
        <button
          type="button"
          onClick={openPicker}
          aria-label={label}
          data-slot="generation-panel-dropzone-trigger"
          className="focus-visible:ring-ring text-foreground flex w-full flex-col items-center gap-1.5 rounded-md text-center text-xs focus-visible:ring-2 focus-visible:outline-none"
        >
          <Upload aria-hidden className="text-muted-foreground size-5" />
          <span>{description}</span>
        </button>
      </div>

      {files && files.length > 0 ? (
        <div data-slot="generation-panel-dropzone-files" className="grid grid-cols-3 gap-2">
          {files.map((file) => (
            <PreviewTile
              key={file.id}
              aspect="square"
              labelPlacement={file.preview ? "none" : "below"}
              label={file.preview ? undefined : file.name}
              badge={
                onFileRemove ? (
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon-xs"
                    data-slot="generation-panel-dropzone-remove"
                    aria-label={`Remove ${file.name}`}
                    onClick={() => onFileRemove(file.id)}
                    className="rounded-full"
                  >
                    <X aria-hidden />
                  </Button>
                ) : undefined
              }
            >
              {file.preview ? (
                <img src={file.preview} alt={file.name} className="h-full w-full object-cover" />
              ) : (
                <span className="text-foreground flex h-full items-center justify-center p-1 text-center text-[0.65rem] break-all">
                  {file.name}
                </span>
              )}
            </PreviewTile>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function GenerationPanel({
  files,
  onFilesAdd,
  onFileRemove,
  accept,
  multiple = true,
  dropzoneLabel = "Upload source file",
  dropzoneDescription = "Drag and drop, or click to browse",
  directions,
  onDirectionsChange,
  directionsLabel = "Directions",
  directionsPlaceholder = "Describe what you want to generate…",
  presets,
  settings,
  generate,
  cost,
  costUnit,
  sectionTitles,
  defaultOpenSections = ALL_SECTIONS,
  className,
  ...props
}: GenerationPanelProps) {
  const titles = { ...DEFAULT_SECTION_TITLES, ...sectionTitles };
  const directionsInputId = React.useId();
  const showDropzone = Boolean(onFilesAdd);
  const showFooter = cost !== undefined || Boolean(generate);

  return (
    <Card data-slot="generation-panel" className={cn("flex h-full flex-col gap-0 py-0", className)} {...props}>
      <CardContent className="flex flex-1 flex-col gap-0 overflow-y-auto px-(--card-spacing) py-1">
        {showDropzone ? (
          <GenerationPanelSection
            stage="dropzone"
            title={titles.dropzone}
            defaultOpen={defaultOpenSections.includes("dropzone")}
          >
            <GenerationPanelDropzone
              files={files}
              onFilesAdd={onFilesAdd}
              onFileRemove={onFileRemove}
              accept={accept}
              multiple={multiple}
              label={dropzoneLabel}
              description={dropzoneDescription}
            />
          </GenerationPanelSection>
        ) : null}

        <GenerationPanelSection
          stage="directions"
          title={titles.directions}
          defaultOpen={defaultOpenSections.includes("directions")}
        >
          <label htmlFor={directionsInputId} className="sr-only">
            {directionsLabel}
          </label>
          <Textarea
            id={directionsInputId}
            data-slot="generation-panel-directions-textarea"
            aria-label={directionsLabel}
            placeholder={directionsPlaceholder}
            value={directions}
            onChange={(event) => onDirectionsChange?.(event.target.value)}
            className="min-h-20 resize-none"
          />
        </GenerationPanelSection>

        {presets ? (
          <GenerationPanelSection
            stage="presets"
            title={titles.presets}
            defaultOpen={defaultOpenSections.includes("presets")}
          >
            <div data-slot="generation-panel-presets">{presets}</div>
          </GenerationPanelSection>
        ) : null}

        {settings ? (
          <GenerationPanelSection
            stage="settings"
            title={titles.settings}
            defaultOpen={defaultOpenSections.includes("settings")}
          >
            <div data-slot="generation-panel-settings">{settings}</div>
          </GenerationPanelSection>
        ) : null}
      </CardContent>

      {showFooter ? (
        // F1: the price belongs at the point of spend. Cost and Generate
        // are structurally one row — there is no prop combination that can
        // put them in different sections of this component.
        <CardFooter data-slot="generation-panel-generate" className="flex shrink-0 items-center justify-between gap-2">
          {cost !== undefined ? (
            <div data-slot="generation-panel-cost">
              <CostChip amount={cost} unit={costUnit} />
            </div>
          ) : (
            <span />
          )}
          {generate}
        </CardFooter>
      ) : null}
    </Card>
  );
}

export { GenerationPanel };
export type { GenerationPanelFile, GenerationPanelProps, GenerationPanelSectionKey };
