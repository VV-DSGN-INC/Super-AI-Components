"use client";

import { LoaderCircle } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTitle, PopoverTrigger } from "@/components/ui/popover";
import { Progress, ProgressLabel, ProgressValue } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { AI_LABEL_ICON, AiLabel } from "@/registry/super-ai/ai-label";
import { CostChip } from "@/registry/super-ai/cost-chip";

/**
 * Auto Fill: one prompt across many fields, previewed on a few records before
 * it writes anything.
 *
 * Three parts a host places:
 * - `AutoFill`: the column-header action. A button that opens the panel in a popover.
 * - `AutoFillPanel`: the configuration, sample preview, progress and failure
 *   flow, for a host that wants it inline instead of in a popover.
 * - `AutoFillCell`: the cell renderer for suggested, accepted and overridden values.
 *
 * It plugs into a collection view (P1 `data-views` hosts the header action and
 * the cell) without importing it. Every async call is host-owned.
 *
 * Spec: docs/design-system/component-specs.md#p3-auto-fill
 * States: configuring · sample-preview · applying · suggested · accepted · overridden · failed
 */

interface AutoFillField {
  id: string;
  label: string;
}

interface AutoFillRecord {
  id: string;
  /** What the person calls this record: a name, a title. Shown in the preview. */
  label: string;
  /** The value already in the target cell. Empty or missing means unfilled. */
  current?: string | null;
}

interface AutoFillSample {
  id: string;
  value: string;
  /** Why the model chose it, when the host has one. */
  reason?: string;
  /** Cost of this one record, already a number or formatted. */
  cost?: number | string;
  costUnit?: string;
  /** Wall time of this one record in milliseconds. */
  durationMs?: number;
}

interface AutoFillRunContext {
  field: string;
  /** Aborts when the person cancels or goes back. */
  signal: AbortSignal;
}

interface AutoFillProgress {
  done: number;
  total: number;
}

type AutoFillPhase = "configuring" | "sample-preview" | "applying" | "failed";

interface AutoFillPanelProps extends Omit<React.ComponentProps<"section">, "children" | "onSelect"> {
  /** Fields the prompt can fill. One field needs no choice, but is still shown. */
  fields: AutoFillField[];
  field?: string;
  defaultField?: string;
  onFieldChange?: (field: string) => void;
  /** Every record the apply would reach, in display order. */
  records: AutoFillRecord[];
  /** Shown and editable. Never hidden behind a smart column. */
  defaultPrompt?: string;
  /** How many records the preview runs on. */
  sampleSize?: number;
  onSample: (prompt: string, recordIds: string[], context: AutoFillRunContext) => Promise<AutoFillSample[]>;
  /** Called by "Apply to all". Resolve when the run has finished. */
  onApply: (prompt: string, overwrite: boolean, context: AutoFillRunContext) => Promise<void>;
  /** Host-owned progress while applying. Without it the bar is indeterminate. */
  progress?: AutoFillProgress;
  onCancel?: () => void;
  /** Fires after an apply resolves, so a popover host can close. */
  onApplied?: () => void;
}

const DEFAULT_PROMPT = "Fill this field for each record using the other fields in the row.";

function hasValue(value: string | null | undefined): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`;
}

function formatSeconds(ms: number): string {
  return `${(ms / 1000).toFixed(1)} s`;
}

function messageOf(error: unknown): string {
  return error instanceof Error && error.message ? error.message : "The request did not complete.";
}

function AutoFillPanel({
  fields,
  field: fieldProp,
  defaultField,
  onFieldChange,
  records,
  defaultPrompt = DEFAULT_PROMPT,
  sampleSize = 3,
  onSample,
  onApply,
  progress,
  onCancel,
  onApplied,
  className,
  ...props
}: AutoFillPanelProps) {
  const uid = React.useId();
  const [phase, setPhase] = React.useState<AutoFillPhase>("configuring");
  const [prompt, setPrompt] = React.useState(defaultPrompt);
  const [overwrite, setOverwrite] = React.useState(false);
  const [fieldState, setFieldState] = React.useState(defaultField ?? fields[0]?.id ?? "");
  const [samples, setSamples] = React.useState<AutoFillSample[] | null>(null);
  const [failure, setFailure] = React.useState<{ stage: "sample" | "apply"; message: string } | null>(null);
  const [note, setNote] = React.useState<string | null>(null);
  const run = React.useRef(0);
  const controller = React.useRef<AbortController | null>(null);

  const field = fieldProp ?? fieldState;
  const fieldLabel = fields.find((f) => f.id === field)?.label ?? field;
  const filled = records.filter((r) => hasValue(r.current)).length;
  const empty = records.length - filled;
  const reach = overwrite ? records.length : empty;
  const promptBlank = !prompt.trim();
  const sampleCount = Math.max(1, Math.min(sampleSize, records.length));

  React.useEffect(() => () => controller.current?.abort(), []);

  function begin(): AbortSignal {
    controller.current?.abort();
    controller.current = new AbortController();
    run.current += 1;
    return controller.current.signal;
  }

  function changeField(next: string) {
    setFieldState(next);
    onFieldChange?.(next);
  }

  async function runSample() {
    const signal = begin();
    const id = run.current;
    setNote(null);
    setFailure(null);
    setSamples(null);
    setPhase("sample-preview");
    try {
      const ids = records.slice(0, sampleSize).map((r) => r.id);
      const out = await onSample(prompt, ids, { field, signal });
      if (run.current === id) setSamples(out);
    } catch (error) {
      if (run.current !== id) return;
      setFailure({ stage: "sample", message: messageOf(error) });
      setPhase("failed");
    }
  }

  async function runApply() {
    const signal = begin();
    const id = run.current;
    setNote(null);
    setFailure(null);
    setPhase("applying");
    try {
      await onApply(prompt, overwrite, { field, signal });
      if (run.current !== id) return;
      setSamples(null);
      setPhase("configuring");
      onApplied?.();
    } catch (error) {
      if (run.current !== id) return;
      setFailure({ stage: "apply", message: messageOf(error) });
      setPhase("failed");
    }
  }

  function backToPrompt() {
    controller.current?.abort();
    run.current += 1;
    setSamples(null);
    setPhase("configuring");
  }

  function cancelApply() {
    controller.current?.abort();
    run.current += 1;
    onCancel?.();
    setNote("Cancelled. Existing values were not changed.");
    setPhase("configuring");
  }

  const statusText =
    phase === "sample-preview" && samples
      ? `Preview ready: ${plural(samples.length, "result", "results")}. Nothing has been written.`
      : phase === "applying"
        ? `Filling ${fieldLabel}.`
        : "";

  return (
    <section
      data-slot="auto-fill-panel"
      data-phase={phase}
      aria-labelledby={`${uid}-title`}
      className={cn("flex flex-col gap-3 text-sm", className)}
      {...props}
    >
      <h3 id={`${uid}-title`} data-slot="auto-fill-title" className="font-medium">
        Auto fill {fieldLabel}
      </h3>
      <p role="status" className="sr-only">
        {statusText}
      </p>

      {phase === "configuring" ? (
        <div data-slot="auto-fill-config" className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label id={`${uid}-field-label`}>Field to fill</Label>
            <Select
              value={field}
              onValueChange={(next) => changeField(String(next))}
              items={fields.map((f) => ({ value: f.id, label: f.label }))}
            >
              <SelectTrigger aria-labelledby={`${uid}-field-label`} data-slot="auto-fill-field">
                <SelectValue />
              </SelectTrigger>
              <SelectContent aria-label="Fields" alignItemWithTrigger={false}>
                {fields.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${uid}-prompt`}>Prompt</Label>
            <Textarea
              id={`${uid}-prompt`}
              data-slot="auto-fill-prompt"
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              aria-describedby={`${uid}-prompt-hint`}
              rows={3}
            />
            <p id={`${uid}-prompt-hint`} className="text-xs text-muted-foreground">
              {prompt === defaultPrompt
                ? "This is the default prompt. Edit it before you preview."
                : "Edited from the default prompt."}
            </p>
          </div>

          <div data-slot="auto-fill-overwrite" className="flex items-start gap-2">
            <Switch
              size="sm"
              checked={overwrite}
              onCheckedChange={setOverwrite}
              aria-labelledby={`${uid}-overwrite-label`}
              aria-describedby={`${uid}-overwrite-hint`}
              className="mt-0.5"
            />
            <div className="flex flex-col gap-0.5">
              <span id={`${uid}-overwrite-label`} className="font-medium">
                Overwrite filled cells
              </span>
              <span id={`${uid}-overwrite-hint`} className="text-xs text-muted-foreground">
                {overwrite
                  ? `Will replace ${plural(filled, "filled cell", "filled cells")}.`
                  : `Off. Would change ${plural(filled, "filled cell", "filled cells")} if turned on, so they are skipped.`}
              </span>
            </div>
          </div>

          {note ? (
            <p data-slot="auto-fill-note" className="text-xs">
              {note}
            </p>
          ) : null}

          <Button
            data-slot="auto-fill-preview"
            onClick={() => void runSample()}
            disabled={promptBlank || records.length === 0}
          >
            Preview on first {plural(sampleCount, "record", "records")}
          </Button>
        </div>
      ) : null}

      {phase === "sample-preview" ? (
        <div data-slot="auto-fill-preview-panel" className="flex flex-col gap-3">
          {samples === null ? (
            <p data-slot="auto-fill-sampling" className="flex items-center gap-2">
              <LoaderCircle aria-hidden className="size-4 animate-spin motion-reduce:animate-none" />
              Running on {plural(sampleCount, "record", "records")}
            </p>
          ) : (
            <ul data-slot="auto-fill-samples" className="flex flex-col gap-2">
              {samples.map((sample) => {
                const record = records.find((r) => r.id === sample.id);
                return (
                  <li
                    key={sample.id}
                    data-slot="auto-fill-sample"
                    className="flex flex-col gap-1.5 rounded-md border p-2"
                  >
                    <p className="font-medium">{record?.label ?? sample.id}</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-xs text-muted-foreground">Existing</p>
                        <p data-slot="auto-fill-sample-existing">
                          {hasValue(record?.current) ? record?.current : "Empty"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Suggested</p>
                        <p data-slot="auto-fill-sample-value">{sample.value}</p>
                      </div>
                    </div>
                    {sample.reason ? <p className="text-xs">{sample.reason}</p> : null}
                    {sample.cost !== undefined || sample.durationMs !== undefined ? (
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        {sample.cost !== undefined ? (
                          <CostChip amount={sample.cost} unit={sample.costUnit} />
                        ) : null}
                        {sample.durationMs !== undefined ? (
                          <span data-slot="auto-fill-sample-time">{formatSeconds(sample.durationMs)}</span>
                        ) : null}
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}

          <p id={`${uid}-apply-hint`} className="text-xs">
            Nothing is written until you apply.{" "}
            {overwrite
              ? `Apply will write ${plural(reach, "cell", "cells")}, replacing ${plural(filled, "filled cell", "filled cells")}.`
              : `Apply will write ${plural(reach, "empty cell", "empty cells")} and skip ${plural(filled, "filled cell", "filled cells")}.`}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              data-slot="auto-fill-apply"
              onClick={() => void runApply()}
              disabled={samples === null || reach === 0}
              aria-describedby={`${uid}-apply-hint`}
            >
              Apply to all
            </Button>
            <Button variant="outline" onClick={() => void runSample()} disabled={samples === null}>
              Run again
            </Button>
            <Button variant="ghost" onClick={backToPrompt}>
              Edit prompt
            </Button>
          </div>
        </div>
      ) : null}

      {phase === "applying" ? (
        <div data-slot="auto-fill-applying" className="flex flex-col gap-3">
          <Progress
            value={progress && progress.total > 0 ? (progress.done / progress.total) * 100 : null}
            aria-valuetext={progress ? `${progress.done} of ${progress.total} cells` : "In progress"}
          >
            <ProgressLabel>Filling {fieldLabel}</ProgressLabel>
            <ProgressValue>
              {() => (progress ? `${progress.done} of ${progress.total} cells` : "Working")}
            </ProgressValue>
          </Progress>
          <Button data-slot="auto-fill-cancel" variant="outline" onClick={cancelApply}>
            Cancel
          </Button>
        </div>
      ) : null}

      {phase === "failed" ? (
        <div data-slot="auto-fill-failed" role="alert" className="flex flex-col gap-2">
          <p className="font-medium">
            {failure?.stage === "sample" ? "The preview did not run." : `${fieldLabel} was not filled.`}
          </p>
          {failure ? <p>{failure.message}</p> : null}
          <p>Every existing value was kept. Nothing was written.</p>
          <div>
            <Button variant="outline" onClick={backToPrompt}>
              Back to prompt
            </Button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

interface AutoFillProps extends AutoFillPanelProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Trigger text. Defaults to "Auto fill". */
  label?: string;
}

/** The column-header action: a button that opens `AutoFillPanel` in a popover. */
function AutoFill({
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  label = "Auto fill",
  className,
  onApplied,
  ...panel
}: AutoFillProps) {
  const [openState, setOpenState] = React.useState(defaultOpen);
  const open = openProp ?? openState;
  const setOpen = (next: boolean) => {
    setOpenState(next);
    onOpenChange?.(next);
  };
  const Icon = AI_LABEL_ICON;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        data-slot="auto-fill"
        render={<Button variant="ghost" size="xs" className={className} />}
      >
        <Icon aria-hidden />
        {label}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[26rem] max-w-[calc(100vw-2rem)] gap-0 p-3">
        <PopoverTitle className="sr-only">Auto fill</PopoverTitle>
        <AutoFillPanel
          {...panel}
          onApplied={() => {
            onApplied?.();
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

type AutoFillCellStatus = "suggested" | "accepted" | "overridden";

interface AutoFillCellProps extends Omit<React.ComponentProps<"div">, "onSelect"> {
  status: AutoFillCellStatus;
  value: string;
  /** Names the cell for its buttons, e.g. "Acme, Industry". */
  label: string;
  /** The value this suggestion replaces, when it replaces one. */
  previous?: string;
  /** Why the model chose it (suggested) or why the person changed it (overridden). */
  reason?: string;
  onAccept?: () => void;
  onOverride?: (value: string, reason?: string) => void;
}

/** Cell renderer for generated values. The mark stays until a person acts. */
function AutoFillCell({
  status,
  value,
  label,
  previous,
  reason,
  onAccept,
  onOverride,
  className,
  ...props
}: AutoFillCellProps) {
  const uid = React.useId();
  const valueRef = React.useRef<HTMLSpanElement>(null);
  const refocus = React.useRef(false);
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(value);
  const [draftReason, setDraftReason] = React.useState("");

  // Accept and override remove their own buttons. Move focus to the value so
  // it does not fall back to the page.
  React.useEffect(() => {
    if (status !== "suggested" && refocus.current) {
      refocus.current = false;
      valueRef.current?.focus();
    }
  }, [status]);

  return (
    <div
      data-slot="auto-fill-cell"
      data-status={status}
      className={cn("flex flex-col gap-1 text-sm", className)}
      {...props}
    >
      <span ref={valueRef} tabIndex={-1} data-slot="auto-fill-cell-value">
        {value}
      </span>
      {status === "suggested" ? <AiLabel variant="generated" /> : null}
      {status === "overridden" ? (
        <span data-slot="auto-fill-cell-edited" className="text-xs">
          Edited by you
        </span>
      ) : null}
      {previous && status === "suggested" ? (
        <span data-slot="auto-fill-cell-previous" className="text-xs">
          Replaces: {previous}
        </span>
      ) : null}
      {reason ? (
        <span data-slot="auto-fill-cell-reason" className="text-xs">
          {status === "overridden" ? "Your reason: " : "Reason: "}
          {reason}
        </span>
      ) : null}
      {status === "suggested" ? (
        <div data-slot="auto-fill-cell-actions" className="flex gap-1">
          <Button
            variant="outline"
            size="xs"
            aria-label={`Accept suggestion for ${label}`}
            onClick={() => {
              refocus.current = true;
              onAccept?.();
            }}
          >
            Accept
          </Button>
          <Popover
            open={editing}
            onOpenChange={(next) => {
              setEditing(next);
              if (next) {
                setDraft(value);
                setDraftReason("");
              }
            }}
          >
            <PopoverTrigger
              render={<Button variant="ghost" size="xs" />}
              aria-label={`Override suggestion for ${label}`}
            >
              Override
            </PopoverTrigger>
            <PopoverContent align="start" className="w-64">
              <PopoverTitle className="sr-only">Override {label}</PopoverTitle>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`${uid}-value`}>New value</Label>
                <Input id={`${uid}-value`} value={draft} onChange={(e) => setDraft(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`${uid}-reason`}>Reason (optional)</Label>
                <Input
                  id={`${uid}-reason`}
                  value={draftReason}
                  onChange={(e) => setDraftReason(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  disabled={!draft.trim()}
                  onClick={() => {
                    refocus.current = true;
                    setEditing(false);
                    onOverride?.(draft.trim(), draftReason.trim() || undefined);
                  }}
                >
                  Save
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      ) : null}
    </div>
  );
}

export { AutoFill, AutoFillCell, AutoFillPanel };
export type {
  AutoFillCellProps,
  AutoFillCellStatus,
  AutoFillField,
  AutoFillPanelProps,
  AutoFillPhase,
  AutoFillProgress,
  AutoFillProps,
  AutoFillRecord,
  AutoFillRunContext,
  AutoFillSample,
};
