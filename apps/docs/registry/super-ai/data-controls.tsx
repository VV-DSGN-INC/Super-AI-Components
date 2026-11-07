"use client";

import { Lock, ShieldCheck } from "lucide-react";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { EntityRow } from "@/registry/super-ai/entity-row";

/**
 * Data Controls — Training and retention as separate, explained controls with the default stated in the UI.
 *
 * Spec: docs/design-system/component-specs.md#n14-data-controls
 * States: training-on · training-off · retention · plan-locked · none-collected · admin-managed
 *
 * There is no variant axis. The six states are what the data says: `checked`
 * flips training-on / training-off, a `retention` row is the period Select, and
 * `kind` on a row is plan-locked / none-collected / admin-managed.
 *
 * Decisions from the spec that tests pin:
 *
 * 1. **Two rows, two controls.** Training is a switch, retention is a period
 *    select, and neither handler is ever called for the other. Separate
 *    controls make "changing one never changes the other" structural.
 * 2. **Every row carries `description` and `effect`, both required strings.**
 *    The description is what the setting trades (both sides, not the altruistic
 *    pitch alone); `effect` is the one sentence saying what happens to the data
 *    under the setting as it stands now, followed by a link to the long version.
 * 3. **`plan-locked` shows the lock and the plan name** and exposes
 *    `onUpgrade`. The host renders M5 `paywall-message`; this component never
 *    does. The row is never hidden from a plan that cannot change it.
 * 4. **`none-collected` is a state, not an absence.** The section still
 *    renders, with the reason there is no switch.
 * 5. **`admin-managed` is the disabled-shaped state.** It shows the policy and
 *    who to ask. The control is inert and the row stays.
 *
 * Composition: A9 `entity-row` for the label/description/control grid (M1's row
 * anatomy), vendored Card, Switch and Select. L3 components never import each
 * other, so nothing here imports M1 `settings-dialog`.
 *
 * Surface: no row paints a muted, accent or secondary surface behind muted
 * text. The only filled surface is the plan `Badge`, which carries its own
 * foreground token.
 */

interface DataControlRowCopy {
  /** The setting's name, e.g. "Improve the model for everyone". It names the control. */
  label: string;
  /**
   * Required on purpose. A toggle with no description is a setting nobody
   * changes. For training this is where both sides of the trade go: what the
   * user gives, and what they get back in aggregate.
   */
  description: string;
  /**
   * One sentence stating what happens to the data under the setting as it
   * stands right now. The caller writes it per state, so it is never stale
   * when the control flips.
   */
  effect: string;
  /** The long version of the policy. */
  learnMoreHref: string;
  /** Visible link text. The row's label is appended for the accessible name. Default "Read the full policy". */
  learnMoreLabel?: string;
}

/** What each non-editable state needs. `Value` is the control's current value; `Change` its handler. */
type DataControlGate<Value, Change> =
  | ({ kind?: "editable" } & Value & Change)
  | ({
      kind: "plan-locked";
      /** The plan that unlocks the setting, shown as text next to the lock. */
      plan: string;
      /** Called by the "Upgrade" button. The host opens M5 `paywall-message` from it. */
      onUpgrade?: () => void;
    } & Value)
  | ({
      kind: "admin-managed";
      /** What the administrator set, in a sentence. */
      policy: string;
      /** Who to ask to change it, e.g. "your workspace admin" or an address. */
      contact: string;
    } & Value)
  | {
      kind: "none-collected";
      /** Why there is no control. Shown in place of one. */
      reason: string;
    };

type DataControlsTraining = DataControlRowCopy &
  DataControlGate<{ checked: boolean }, { onCheckedChange?: (checked: boolean) => void }>;

interface DataControlsRetentionPeriod {
  value: string;
  label: string;
}

type DataControlsRetention = DataControlRowCopy &
  DataControlGate<
    { value: string; periods: DataControlsRetentionPeriod[] },
    { onValueChange?: (value: string) => void }
  >;

interface DataControlsProps extends Omit<React.ComponentProps<"div">, "title"> {
  training: DataControlsTraining;
  /** Omit when the product exposes no retention choice. */
  retention?: DataControlsRetention;
  title?: string;
  description?: string;
  /** Heading level of the section title. Default 3, matching M1's section titles. */
  headingLevel?: 2 | 3 | 4;
}

interface RowIds {
  labelId: string;
  controlId: string;
  valueId: string;
  describedBy: string;
}

interface DataControlRowProps {
  slot: "training" | "retention";
  row: DataControlRowCopy & { kind?: "editable" | "plan-locked" | "admin-managed" | "none-collected" };
  gate: {
    plan?: string;
    onUpgrade?: () => void;
    policy?: string;
    contact?: string;
    reason?: string;
  };
  control: (ids: RowIds, disabled: boolean) => React.ReactNode;
}

function DataControlRow({ slot, row, gate, control }: DataControlRowProps) {
  const uid = React.useId();
  const labelId = `${uid}-label`;
  const controlId = `${uid}-control`;
  const valueId = `${uid}-value`;
  const descriptionId = `${uid}-description`;
  const effectId = `${uid}-effect`;
  const gateId = `${uid}-gate`;

  const kind = row.kind ?? "editable";
  const locked = kind === "plan-locked";
  const managed = kind === "admin-managed";
  const none = kind === "none-collected";
  const linkLabel = row.learnMoreLabel ?? "Read the full policy";

  const title = (
    <span className="flex flex-wrap items-center gap-x-2 gap-y-1 whitespace-normal">
      <span id={labelId} data-slot="data-controls-row-label">
        {row.label}
      </span>
      {locked ? (
        // The word carries the lock. A bare padlock has no name and a colour has
        // no meaning for a screen reader or a colourblind reader.
        <Badge data-slot="data-controls-plan" variant="secondary" className="gap-1">
          <Lock aria-hidden className="size-3" />
          {gate.plan}
        </Badge>
      ) : null}
      {none ? (
        <Badge data-slot="data-controls-none-badge" variant="outline">
          Not collected
        </Badge>
      ) : null}
    </span>
  );

  const describedBy = [descriptionId, effectId, locked || managed ? gateId : null].filter(Boolean).join(" ");

  return (
    <div
      data-slot="data-controls-row"
      data-row={slot}
      data-kind={kind}
      className="flex flex-col gap-1 border-b py-2 first:pt-0 last:border-b-0 last:pb-0"
    >
      <EntityRow
        title={title}
        description={
          <span
            id={descriptionId}
            data-slot="data-controls-row-description"
            className="block whitespace-normal"
          >
            {row.description}
          </span>
        }
        trailing={none ? undefined : control({ labelId, controlId, valueId, describedBy }, locked || managed)}
        className="items-start"
      />
      <div data-slot="data-controls-row-detail" className="flex flex-col gap-1.5 px-3 text-xs">
        <p className="text-foreground">
          <span id={effectId} data-slot="data-controls-effect" aria-live="polite">
            {row.effect}
          </span>{" "}
          <a
            href={row.learnMoreHref}
            data-slot="data-controls-link"
            aria-label={`${linkLabel}: ${row.label}`}
            className="text-foreground focus-visible:ring-ring rounded-sm underline underline-offset-4 hover:no-underline focus-visible:ring-2 focus-visible:outline-none"
          >
            {linkLabel}
          </a>
        </p>
        {locked ? (
          <div data-slot="data-controls-lock" className="flex flex-wrap items-center gap-2">
            <p id={gateId} className="text-foreground">
              Changing this needs the {gate.plan} plan.
            </p>
            {gate.onUpgrade ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                data-slot="data-controls-upgrade"
                onClick={gate.onUpgrade}
              >
                Upgrade to {gate.plan}
              </Button>
            ) : null}
          </div>
        ) : null}
        {managed ? (
          <p id={gateId} data-slot="data-controls-policy" className="text-foreground">
            Set by your administrator: {gate.policy} To change it, ask {gate.contact}.
          </p>
        ) : null}
        {none ? (
          <p data-slot="data-controls-reason" className="text-foreground flex items-start gap-1.5">
            <ShieldCheck aria-hidden className="mt-0.5 size-3.5 shrink-0" />
            <span>{gate.reason}</span>
          </p>
        ) : null}
      </div>
    </div>
  );
}

function gateOf(row: {
  plan?: string;
  onUpgrade?: () => void;
  policy?: string;
  contact?: string;
  reason?: string;
}) {
  return {
    plan: row.plan,
    onUpgrade: row.onUpgrade,
    policy: row.policy,
    contact: row.contact,
    reason: row.reason,
  };
}

function TrainingRow({ training }: { training: DataControlsTraining }) {
  return (
    <DataControlRow
      slot="training"
      row={training}
      gate={gateOf(training as Parameters<typeof gateOf>[0])}
      control={({ labelId, controlId, describedBy }, disabled) =>
        training.kind === "none-collected" ? null : (
          <Switch
            id={controlId}
            data-slot="data-controls-training-switch"
            aria-labelledby={labelId}
            aria-describedby={describedBy}
            checked={training.checked}
            disabled={disabled}
            onCheckedChange={
              training.kind === undefined || training.kind === "editable"
                ? (next) => training.onCheckedChange?.(next)
                : undefined
            }
          />
        )
      }
    />
  );
}

function RetentionRow({ retention }: { retention: DataControlsRetention }) {
  return (
    <DataControlRow
      slot="retention"
      row={retention}
      gate={gateOf(retention as Parameters<typeof gateOf>[0])}
      control={({ labelId, controlId, valueId, describedBy }, disabled) => {
        if (retention.kind === "none-collected") return null;
        const current = retention.periods.find((period) => period.value === retention.value);
        const onChange =
          retention.kind === undefined || retention.kind === "editable" ? retention.onValueChange : undefined;
        return (
          <Select
            value={retention.value}
            disabled={disabled}
            onValueChange={(next) => onChange?.(String(next))}
          >
            <SelectTrigger
              id={controlId}
              data-slot="data-controls-retention-trigger"
              // Named by the row label plus its own value ("Keep chats  30 days"),
              // so the closed trigger says what it is and what it is set to.
              aria-labelledby={`${labelId} ${valueId}`}
              aria-describedby={describedBy}
              className="min-w-32"
            >
              {/* SelectValue renders the raw `value` unless given children. */}
              <SelectValue id={valueId}>{current?.label ?? retention.value}</SelectValue>
            </SelectTrigger>
            <SelectContent
              data-slot="data-controls-retention-content"
              aria-labelledby={labelId}
              className="motion-reduce:data-open:animate-none motion-reduce:data-closed:animate-none"
            >
              {retention.periods.map((period) => (
                <SelectItem key={period.value} value={period.value} data-slot="data-controls-retention-item">
                  {period.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      }}
    />
  );
}

function DataControls({
  training,
  retention,
  title = "Data controls",
  description,
  headingLevel = 3,
  className,
  ...props
}: DataControlsProps) {
  const titleId = React.useId();

  return (
    <Card
      data-slot="data-controls"
      role="group"
      aria-labelledby={titleId}
      className={cn("w-full max-w-xl", className)}
      {...props}
    >
      <CardHeader>
        <CardTitle id={titleId} role="heading" aria-level={headingLevel} data-slot="data-controls-title">
          {title}
        </CardTitle>
        {description ? (
          <CardDescription data-slot="data-controls-description">{description}</CardDescription>
        ) : null}
      </CardHeader>
      <CardContent data-slot="data-controls-rows" className="flex flex-col">
        <TrainingRow training={training} />
        {retention ? <RetentionRow retention={retention} /> : null}
      </CardContent>
    </Card>
  );
}

export { DataControls };
export type { DataControlsProps, DataControlsRetention, DataControlsRetentionPeriod, DataControlsTraining };
