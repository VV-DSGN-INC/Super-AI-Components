"use client";

import { AlertTriangle } from "lucide-react";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { FieldRow } from "@/registry/super-ai/field-row";

/**
 * Prompt Template Form - A fill-in-the-blank prompt template with a live preview of what will be sent.
 *
 * Spec: docs/design-system/component-specs.md#d9-prompt-template-form
 * States: empty · partially-filled · complete · with-defaults · missing-required · multi-step
 *
 * Composition:
 * - `stacked` renders every blank as an A6 `field-row`; `inline` renders the
 *   same blanks as vendored `Input` / `Select` controls inside the sentence.
 *   The data, the values, the marks and the preview are identical in both -
 *   `layout` changes where the controls sit and nothing else.
 * - Provenance marks (default, carried, still needed) follow D7 `slot-summary`
 *   - the same badge idiom - but this file does not import it: family D
 *   components never import each other.
 *
 * Decisions that read like descriptions and are not:
 * - The preview and the `onRun` payload come out of one function, so the text
 *   a person reads is the text that is sent.
 * - Run is never `disabled`. A dead button gives no reason and no way to the
 *   blank that is missing; pressing it with a required blank empty marks the
 *   blank where it sits, moves focus there, and does not call `onRun`.
 */

type BlankKind = "text" | "select";

interface TemplateBlank {
  id: string;
  /** Names the control. In `inline` the surrounding prose is never the name. */
  label: string;
  kind: BlankKind;
  /** The choices of a `select` blank. */
  options?: string[];
  required?: boolean;
  /** What the template chose. Marked "Default" until the person edits the blank. */
  defaultValue?: string;
  /** The step this blank's value came from, for `multi-step` flows. */
  carriedFrom?: string;
  placeholder?: string;
}

/** A plain string is literal prompt text; an object is a blank. */
type TemplateSegment = string | TemplateBlank;

type TemplateLayout = "inline" | "stacked";

type PromptValues = Record<string, string>;

interface PromptTemplateStep {
  current: number;
  total: number;
  label: string;
}

interface PromptTemplateFormProps extends Omit<React.ComponentProps<"div">, "defaultValue"> {
  template: TemplateSegment[];
  /** `inline` reads as the sentence with blanks in it; `stacked` as a form. */
  layout?: TemplateLayout;
  /** Controlled values by blank id. A blank with no key falls back to its default. */
  values?: PromptValues;
  /** Initial values when uncontrolled, and the way a host carries a value in. */
  defaultValues?: PromptValues;
  /** Receives the full next record. Controlled callers apply it; nothing moves otherwise. */
  onValuesChange?: (values: PromptValues) => void;
  /** Called with the assembled prompt and the resolved values. Never called with a required blank empty. */
  onRun?: (prompt: string, values: PromptValues) => void;
  runLabel?: string;
  /** Mark empty required blanks before the person has tried to run, e.g. when resuming a draft. */
  showMissing?: boolean;
  /** Where this template sits in a multi-step flow. */
  step?: PromptTemplateStep;
}

function isBlank(segment: TemplateSegment): segment is TemplateBlank {
  return typeof segment !== "string";
}

/** The value a blank currently resolves to: what was entered, else the template default. */
function resolve(blank: TemplateBlank, values: PromptValues): string {
  return Object.prototype.hasOwnProperty.call(values, blank.id)
    ? values[blank.id]!
    : (blank.defaultValue ?? "");
}

/**
 * The one place the prompt is assembled. Preview and `onRun` both read it, so
 * they cannot drift. `placeholders` only ever differs from the sent text while
 * a required blank is empty, and Run is blocked exactly then.
 */
function assemble(template: TemplateSegment[], values: PromptValues, placeholders: boolean): string {
  return template
    .map((segment) => {
      if (!isBlank(segment)) return segment;
      const value = resolve(segment, values).trim();
      if (value) return value;
      return placeholders && segment.required ? `[${segment.label}]` : "";
    })
    .join("")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function PromptTemplateForm({
  template,
  layout = "stacked",
  values: valuesProp,
  defaultValues,
  onValuesChange,
  onRun,
  runLabel = "Run prompt",
  showMissing = false,
  step,
  className,
  ...props
}: PromptTemplateFormProps) {
  const uid = React.useId();
  const rootRef = React.useRef<HTMLDivElement>(null);
  const [inner, setInner] = React.useState<PromptValues>(defaultValues ?? {});
  const [touched, setTouched] = React.useState<ReadonlySet<string>>(() => new Set());
  const [attempted, setAttempted] = React.useState(false);

  const values = valuesProp ?? inner;
  const blanks = template.filter(isBlank);

  function setValue(id: string, next: string) {
    const merged = { ...values, [id]: next };
    if (valuesProp === undefined) setInner(merged);
    setTouched((prev) => new Set(prev).add(id));
    onValuesChange?.(merged);
  }

  const states = blanks.map((blank) => {
    const hasEntry = Object.prototype.hasOwnProperty.call(values, blank.id);
    const value = resolve(blank, values);
    const empty = value.trim() === "";
    const isDefault = !hasEntry && !!blank.defaultValue;
    const isCarried = !isDefault && !!blank.carriedFrom && !empty && !touched.has(blank.id);
    const missing = !!blank.required && empty;
    const flagged = missing && (attempted || showMissing || touched.has(blank.id));
    const source = isDefault ? "default" : isCarried ? "carried" : empty ? "empty" : "entered";
    return { blank, value, empty, isDefault, isCarried, missing, flagged, source };
  });

  const missingCount = states.filter((s) => s.missing).length;
  const revealed = attempted || showMissing;
  const preview = assemble(template, values, true);

  function run() {
    const first = states.find((s) => s.missing);
    if (first) {
      setAttempted(true);
      const controls = rootRef.current?.querySelectorAll<HTMLElement>("[data-prompt-control]") ?? [];
      Array.from(controls)
        .find((el) => el.dataset.promptControl === first.blank.id)
        ?.focus();
      return;
    }
    const resolved: PromptValues = {};
    for (const blank of blanks) resolved[blank.id] = resolve(blank, values).trim();
    onRun?.(assemble(template, values, false), resolved);
  }

  const blockedId = `${uid}-blocked`;
  const previewLabelId = `${uid}-preview-label`;

  function renderBlank(state: (typeof states)[number], controlId?: string, fieldDescribedBy?: string) {
    const { blank, value, flagged, missing, isDefault, isCarried, source } = state;
    const markId = `${uid}-${blank.id}-mark`;
    const hasMark = flagged || isDefault || isCarried || missing;
    const describedBy =
      [fieldDescribedBy, hasMark ? markId : undefined].filter(Boolean).join(" ") || undefined;
    const inline = layout === "inline";
    const common = {
      "data-prompt-control": blank.id,
      "aria-invalid": flagged || undefined,
      "aria-required": blank.required || undefined,
      "aria-describedby": describedBy,
    } as const;

    const control =
      blank.kind === "select" ? (
        <Select
          items={(blank.options ?? []).map((option) => ({ value: option, label: option }))}
          value={value || null}
          onValueChange={(next) => setValue(blank.id, next == null ? "" : String(next))}
        >
          <SelectTrigger
            id={controlId}
            aria-label={inline ? blank.label : undefined}
            className={inline ? "w-44 max-w-full" : "w-full min-w-0"}
            {...common}
          >
            <SelectValue placeholder={blank.placeholder ?? "Choose"} />
          </SelectTrigger>
          <SelectContent aria-label={`${blank.label} choices`}>
            {(blank.options ?? []).map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <Input
          id={controlId}
          type="text"
          value={value}
          aria-label={inline ? blank.label : undefined}
          placeholder={blank.placeholder ?? (inline ? blank.label : undefined)}
          className={inline ? "w-44 max-w-full" : "min-w-0"}
          onChange={(event) => setValue(blank.id, event.target.value)}
          {...common}
        />
      );

    const mark = hasMark ? (
      <span id={markId} data-slot="prompt-template-form-mark" className="inline-flex shrink-0 items-center">
        {flagged ? (
          // Solid, not Badge's own tint: bg-destructive/10 text-destructive
          // measures 4.0:1. Same substitution as slot-summary.
          <Badge variant="destructive" className="bg-destructive text-background text-[0.6875rem]">
            <AlertTriangle aria-hidden />
            Still needed
          </Badge>
        ) : isDefault ? (
          <Badge variant="outline" className="text-[0.6875rem]">
            Default
          </Badge>
        ) : isCarried ? (
          <Badge variant="outline" className="text-[0.6875rem]">
            From {blank.carriedFrom}
          </Badge>
        ) : (
          <span className="text-muted-foreground text-xs">Required</span>
        )}
      </span>
    ) : null;

    return { control, mark, source, missing: flagged };
  }

  return (
    <div
      ref={rootRef}
      data-slot="prompt-template-form"
      data-layout={layout}
      className={cn("flex w-full max-w-2xl flex-col gap-4", className)}
      {...props}
    >
      {step ? (
        <p data-slot="prompt-template-form-step" className="text-sm font-medium">
          Step {step.current} of {step.total} · {step.label}
        </p>
      ) : null}

      {layout === "inline" ? (
        <div
          role="group"
          aria-label="Prompt template"
          data-slot="prompt-template-form-template"
          className="text-base leading-10"
        >
          {template.map((segment, index) => {
            if (!isBlank(segment)) return <span key={index}>{segment}</span>;
            const state = states.find((s) => s.blank.id === segment.id)!;
            const { control, mark, source, missing } = renderBlank(state);
            return (
              <span
                key={segment.id}
                data-slot="prompt-template-form-blank"
                data-source={source}
                data-missing={missing ? "" : undefined}
                className="mx-1 inline-flex flex-col gap-1 align-middle leading-none"
              >
                {control}
                {mark}
              </span>
            );
          })}
        </div>
      ) : (
        <div
          role="group"
          aria-label="Prompt template"
          data-slot="prompt-template-form-template"
          className="flex flex-col gap-3"
        >
          {states.map((state) => {
            const { blank } = state;
            return (
              <div
                key={blank.id}
                data-slot="prompt-template-form-blank"
                data-source={state.source}
                data-missing={state.flagged ? "" : undefined}
              >
                <FieldRow label={blank.label}>
                  {(controlId, hintId) => {
                    const { control, mark } = renderBlank(state, controlId, hintId);
                    return (
                      <>
                        {control}
                        {mark}
                      </>
                    );
                  }}
                </FieldRow>
              </div>
            );
          })}
        </div>
      )}

      <div data-slot="prompt-template-form-preview" className="flex flex-col gap-1.5">
        <span id={previewLabelId} className="text-muted-foreground text-xs font-medium">
          Prompt preview
        </span>
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          aria-labelledby={previewLabelId}
          data-slot="prompt-template-form-preview-text"
          className="border-border text-foreground min-h-12 rounded-lg border p-3 text-sm break-words whitespace-pre-wrap"
        >
          {preview}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          data-slot="prompt-template-form-run"
          aria-describedby={revealed && missingCount > 0 ? blockedId : undefined}
          onClick={run}
        >
          {runLabel}
        </Button>
        {revealed && missingCount > 0 ? (
          <span id={blockedId} data-slot="prompt-template-form-blocked" className="text-foreground text-xs">
            {missingCount} still needed
          </span>
        ) : null}
      </div>
    </div>
  );
}

export { PromptTemplateForm };
export type {
  BlankKind,
  PromptTemplateFormProps,
  PromptTemplateStep,
  PromptValues,
  TemplateBlank,
  TemplateLayout,
  TemplateSegment,
};
