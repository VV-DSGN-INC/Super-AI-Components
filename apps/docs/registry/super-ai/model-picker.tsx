"use client";

import { Cloud, HardDrive } from "lucide-react";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { CostChip } from "@/registry/super-ai/cost-chip";
import { EntityRow } from "@/registry/super-ai/entity-row";
import { SectionHeader } from "@/registry/super-ai/section-header";

/**
 * Model Picker — Choose a model; drives dynamic settings
 *
 * Spec: docs/design-system/component-specs.md#e2-model-picker
 * Presentations: dropdown · expanded-cards · node-inline
 *
 * One component, three containers. The model list — grouped by task
 * signature, never alphabetically — and the shared badge set (price,
 * capability, runtime) are identical across all three; only what holds them
 * changes:
 *  - `dropdown` uses Select, whose SelectItem is already the interactive
 *    `role="option"` element. Rows compose `entity-row` *without* `onSelect`
 *    so it stays a plain non-interactive wrapper — the same nested-interactive
 *    fix documented on workspace-switcher (DropdownMenuRadioItem) and
 *    skill-menu (CommandItem): an interactive <button> nested inside an
 *    already-interactive option would trip axe's `nested-interactive` rule.
 *  - `node-inline` uses Popover behind a small trigger for embedding inside a
 *    canvas/node UI. Its content is a plain (non-interactive) container, so
 *    rows compose `entity-row` *with* `onSelect` — same as expanded-cards.
 *  - `expanded-cards` composes `entity-row` (icon/title/description/trailing
 *    is exactly a model row) directly inside Card, always visible, with
 *    `onSelect` — selection state has to be programmatic on the row itself
 *    here, which is exactly what entity-row's `aria-pressed`/`data-state`
 *    button branch provides.
 */

type ModelPickerPresentation = "dropdown" | "expanded-cards" | "node-inline";
type ModelPickerRuntime = "local" | "cloud";

interface ModelPickerModel {
  id: string;
  name: string;
  description?: string;
  icon?: React.ReactNode;
  /** Task signature, e.g. "Text → video". Rows are grouped by this, never alphabetically. */
  group: string;
  price?: number | string;
  priceUnit?: string;
  capabilities?: string[];
  runtime: ModelPickerRuntime;
  /** Rendered inline on the runtime badge for "local" models — a real decision, never a footnote. */
  hardware?: string;
}

interface ModelPickerProps extends Omit<React.ComponentProps<"div">, "onSelect"> {
  presentation?: ModelPickerPresentation;
  models: ModelPickerModel[];
  selectedId?: string;
  onSelect?: (id: string) => void;
  /** Prefixes the trigger's accessible name, e.g. "Model: Veo 3.1" — never a static "Model" alone. */
  label?: string;
  placeholder?: string;
}

// entity-row (pre-Wave-1.5 legacy, see a11y-baseline.md) sets bg-accent
// text-accent-foreground on its own root when `selected`, but its internal
// description span keeps text-muted-foreground — 4.34:1 against bg-accent,
// under 4.5:1. entity-row doesn't forward className to that inner span, so
// the call site can't override it with a plain text-* class; this arbitrary
// descendant selector retints only entity-row-description, and only while
// the row carries entity-row's own data-state="on" (selected), leaving the
// deliberately muted look of an unselected row untouched.
const ENTITY_ROW_SELECTED_DESCRIPTION_FIX =
  "data-[state=on]:[&_[data-slot=entity-row-description]]:text-accent-foreground";

function groupBySignature(models: ModelPickerModel[]) {
  const groups = new Map<string, ModelPickerModel[]>();
  for (const model of models) {
    const bucket = groups.get(model.group);
    if (bucket) bucket.push(model);
    else groups.set(model.group, [model]);
  }
  return groups;
}

function ModelPickerBadges({ model }: { model: ModelPickerModel }) {
  return (
    <div data-slot="model-picker-badges" className="flex flex-wrap items-center gap-1">
      {/* Local vs cloud is a first-class badge with hardware requirements baked
          into its own text — never a colour-only dot, never a tooltip-only aside. */}
      <Badge variant="outline" data-slot="model-picker-runtime-badge" className="gap-1">
        {model.runtime === "local" ? (
          <HardDrive aria-hidden className="size-3" />
        ) : (
          <Cloud aria-hidden className="size-3" />
        )}
        {model.runtime === "local" ? (model.hardware ? `Local · ${model.hardware}` : "Local") : "Cloud"}
      </Badge>
      {model.capabilities?.map((capability) => (
        <Badge key={capability} variant="secondary" data-slot="model-picker-capability-badge">
          {capability}
        </Badge>
      ))}
      {model.price !== undefined ? (
        <CostChip amount={model.price} unit={model.priceUnit} />
      ) : null}
    </div>
  );
}

function ModelPicker({
  presentation = "dropdown",
  models,
  selectedId,
  onSelect,
  label = "Model",
  placeholder = "Select a model",
  className,
  ...props
}: ModelPickerProps) {
  const groups = React.useMemo(() => groupBySignature(models), [models]);
  const current = models.find((model) => model.id === selectedId);
  const isExpandedCards = presentation === "expanded-cards";
  const isNodeInline = presentation === "node-inline";
  const triggerName = `${label}: ${current?.name ?? placeholder}`;

  return (
    <div
      data-slot="model-picker"
      data-presentation={presentation}
      className={cn(isExpandedCards ? "flex w-full max-w-md flex-col gap-4" : "inline-flex", className)}
      {...props}
    >
      {isExpandedCards ? (
        Array.from(groups.entries()).map(([group, groupModels]) => (
          <div key={group} data-slot="model-picker-group" className="flex flex-col gap-1.5">
            <SectionHeader title={group} size="sm" />
            <Card data-slot="model-picker-cards" className="gap-0 divide-y divide-border py-0">
              {groupModels.map((model) => (
                <EntityRow
                  key={model.id}
                  icon={model.icon}
                  title={model.name}
                  description={model.description}
                  trailing={<ModelPickerBadges model={model} />}
                  selected={model.id === selectedId}
                  onSelect={() => onSelect?.(model.id)}
                  className={cn(
                    "rounded-none first:rounded-t-xl last:rounded-b-xl",
                    ENTITY_ROW_SELECTED_DESCRIPTION_FIX,
                  )}
                />
              ))}
            </Card>
          </div>
        ))
      ) : isNodeInline ? (
        <Popover>
          <PopoverTrigger
            render={
              <Button
                variant="outline"
                size="sm"
                data-slot="model-picker-trigger"
                aria-label={triggerName}
                className="h-7 max-w-40 justify-start gap-1.5 px-2 text-xs"
              />
            }
          >
            {current?.icon ? (
              <span aria-hidden className="shrink-0">
                {current.icon}
              </span>
            ) : null}
            <span className="truncate">{current?.name ?? placeholder}</span>
          </PopoverTrigger>
          <PopoverContent data-slot="model-picker-content" align="start" className="w-72 gap-3 p-2">
            {Array.from(groups.entries()).map(([group, groupModels]) => (
              <div key={group} data-slot="model-picker-group" className="flex flex-col gap-1">
                <SectionHeader title={group} size="sm" className="px-1 py-0.5" />
                <div className="flex flex-col gap-0.5">
                  {groupModels.map((model) => (
                    <EntityRow
                      key={model.id}
                      icon={model.icon}
                      title={model.name}
                      description={model.description}
                      trailing={<ModelPickerBadges model={model} />}
                      selected={model.id === selectedId}
                      onSelect={() => onSelect?.(model.id)}
                      className={cn("min-h-0 py-1.5", ENTITY_ROW_SELECTED_DESCRIPTION_FIX)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </PopoverContent>
        </Popover>
      ) : (
        <Select value={selectedId} onValueChange={(value) => onSelect?.(String(value))}>
          <SelectTrigger data-slot="model-picker-trigger" aria-label={triggerName} className="w-full min-w-56">
            <SelectValue placeholder={placeholder}>{current?.name ?? placeholder}</SelectValue>
          </SelectTrigger>
          <SelectContent data-slot="model-picker-content">
            {Array.from(groups.entries()).map(([group, groupModels]) => (
              <SelectGroup key={group} data-slot="model-picker-group">
                <SelectLabel>{group}</SelectLabel>
                {groupModels.map((model) => (
                  <SelectItem key={model.id} value={model.id} data-slot="model-picker-item" className="p-0">
                    <EntityRow
                      icon={model.icon}
                      title={model.name}
                      description={model.description}
                      trailing={<ModelPickerBadges model={model} />}
                      className="min-h-0 w-full py-1.5"
                    />
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}

export { ModelPicker };
export type { ModelPickerModel, ModelPickerPresentation, ModelPickerProps, ModelPickerRuntime };
