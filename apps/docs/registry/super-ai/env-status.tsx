"use client";

import { CheckCircle2, Clock, KeyRound, PowerOff } from "lucide-react";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { EntityRow } from "@/registry/super-ai/entity-row";

/**
 * Env Status — Per-provider reachability
 *
 * Spec: docs/design-system/component-specs.md#n7-env-status
 * States: ok · degraded · key-invalid · not-running
 *
 * Restored per D12 (gaps.md R1) after the original consolidation dropped it.
 * Two decisions run through the whole file:
 *
 * 1. **Four states because there are four different remedies.** `degraded`
 *    means wait; `key-invalid` means go fix a credential; `not-running`
 *    means start something locally. `STATE_CONDITIONS` pairs every state
 *    with both halves — what it means and what to do — because a state with
 *    no stated next step is a dead end, and collapsing the three failures
 *    into one red dot would erase exactly the distinction this component
 *    exists to draw.
 * 2. **Never status by colour alone.** Every row states its condition in
 *    words, visibly and outside `aria-hidden`: the status icon is always
 *    decorative, `entity-row`'s trailing slot carries a `Badge` naming the
 *    state as a word, and the block below the row spells out the condition
 *    and remedy as real sentences. A host that only reads colour still gets
 *    the same information a screen reader does.
 *
 * This is the runtime view of M7 `connection-manager`'s configuration — same
 * providers, two surfaces — so `EnvStatusProvider` deliberately shapes its
 * identity fields (`id`, `name`) the same way `ConnectionProvider` does, so
 * a host can drive both from one list without reconciling two shapes.
 *
 * Reachability is not spend: this pairs with M2 `credits-indicator` in the
 * approved spec ("reachability vs spend") because a run can fail with a full
 * balance when a key has simply expired, and a balance widget will never say
 * so — which is the gap D12 restored this component to close.
 *
 * Composes A9 `entity-row` without `onSelect` — an informational row, never
 * a button — so it never exercises `entity-row`'s known `selected`-state
 * contrast failure (`a11y-baseline.md`): that bug only fires when `selected`
 * sets `bg-accent` on the row, and no row here is ever selectable.
 */

type EnvStatusState = "ok" | "degraded" | "key-invalid" | "not-running";

interface EnvStatusProvider {
  id: string;
  /** Provider or model name — kept aligned with M7 `connection-manager`'s ConnectionProvider.name. */
  name: string;
  state: EnvStatusState;
  /** Overrides the default per-state icon. */
  icon?: React.ReactNode;
  /** When this reachability check last ran, e.g. "Checked 2 minutes ago". */
  checkedAt?: string;
}

interface EnvStatusProps extends Omit<React.ComponentProps<"div">, "title"> {
  label?: string;
  providers?: EnvStatusProvider[];
}

interface EnvStatusCondition {
  /** The row's state in words. Never a bare colour or dot. */
  label: string;
  /** What to do about it — different per state, by design. */
  remedy: string;
}

/** The short word `entity-row`'s trailing `Badge` renders — visible, not colour-only. */
const STATE_TEXT: Record<EnvStatusState, string> = {
  ok: "Ok",
  degraded: "Degraded",
  "key-invalid": "Key invalid",
  "not-running": "Not running",
};

const STATE_CONDITIONS: Record<EnvStatusState, EnvStatusCondition> = {
  ok: {
    label: "Reachable. This provider is answering requests normally.",
    remedy: "Nothing to do here.",
  },
  degraded: {
    label: "Degraded. Requests are succeeding, but answering slower than usual.",
    remedy: "Wait — this typically clears on its own, without anything to configure here.",
  },
  "key-invalid": {
    label: "Key invalid. The provider answered and rejected this request's credentials.",
    remedy: "Go fix the credential: replace the key for this provider in Connections.",
  },
  "not-running": {
    label: "Not running. Nothing answered — no local runtime is up for this provider.",
    remedy: "Start it locally, then this will recover on its own.",
  },
};

const STATE_ICON: Record<EnvStatusState, React.ElementType> = {
  ok: CheckCircle2,
  degraded: Clock,
  "key-invalid": KeyRound,
  "not-running": PowerOff,
};

/**
 * `degraded` reads as a wait, not an error — `--warning` exists in this
 * token set for exactly that third state (see globals.css). `key-invalid`
 * is the one state that asks the user to touch a credential, so it is the
 * only one drawn as destructive — mirroring `connection-manager`, where
 * `unreachable` deliberately stays neutral so the two failures never look
 * interchangeable. `not-running` is this component's `unreachable`
 * counterpart and stays neutral for the same reason.
 */
const STATE_ROW_TONE: Record<EnvStatusState, string> = {
  ok: "",
  degraded: "border-warning/40",
  "key-invalid": "border-destructive/40",
  "not-running": "",
};

const STATE_ICON_TONE: Record<EnvStatusState, string> = {
  ok: "text-foreground",
  degraded: "text-warning",
  "key-invalid": "text-destructive",
  "not-running": "text-foreground",
};

const STATE_BADGE_VARIANT: Record<EnvStatusState, "secondary" | "outline" | "destructive"> = {
  ok: "secondary",
  degraded: "outline",
  "key-invalid": "destructive",
  "not-running": "secondary",
};

/**
 * `outline`'s own `text-foreground` reads fine, but `degraded` needs to say
 * "wait" visually too — `text-warning`. `destructive`'s own
 * `bg-destructive/10 text-destructive` is 4.0:1 against a 4.5:1 minimum
 * (a11y-baseline.md); going solid (`bg-destructive text-background`) is the
 * same fix `generation-queue.tsx`'s failed badge and `tts-composer.tsx` use.
 */
const STATE_BADGE_CLASS: Record<EnvStatusState, string | undefined> = {
  ok: undefined,
  degraded: "border-warning/40 text-warning",
  "key-invalid": "bg-destructive text-background",
  "not-running": undefined,
};

function EnvStatusRow({ provider }: { provider: EnvStatusProvider }) {
  const { id, name, state, icon, checkedAt } = provider;
  const condition = STATE_CONDITIONS[state];
  const StatusIcon = STATE_ICON[state];

  return (
    <li
      data-slot="env-status-provider"
      data-provider-id={id}
      data-state={state}
      className={cn("flex flex-col gap-1.5 rounded-lg border py-1", STATE_ROW_TONE[state])}
    >
      <EntityRow
        icon={icon ?? <StatusIcon aria-hidden className={cn("size-4", STATE_ICON_TONE[state])} />}
        title={name}
        description={checkedAt}
        trailing={
          <Badge
            data-slot="env-status-badge"
            variant={STATE_BADGE_VARIANT[state]}
            className={STATE_BADGE_CLASS[state]}
          >
            {STATE_TEXT[state]}
          </Badge>
        }
      />

      {/* The condition and its remedy are always both present, as real
          visible text — the sentence that replaces a coloured dot. `role`
          "status" announces a state that changes after mount (e.g. a host
          polling reachability), matching connection-manager's own result
          region. */}
      <div data-slot="env-status-result" role="status" className="flex flex-col gap-1 px-3 text-sm">
        <p data-slot="env-status-condition" className="font-medium">
          {condition.label}
        </p>
        <p data-slot="env-status-remedy" className="text-muted-foreground text-xs">
          {condition.remedy}
        </p>
      </div>
    </li>
  );
}

function EnvStatus({ label = "Provider status", providers = [], className, ...props }: EnvStatusProps) {
  return (
    <div data-slot="env-status" className={cn("flex w-full max-w-xl flex-col gap-3", className)} {...props}>
      <span className="text-foreground text-sm font-medium">{label}</span>
      <ul className="flex flex-col gap-2">
        {providers.map((provider) => (
          <EnvStatusRow key={provider.id} provider={provider} />
        ))}
      </ul>
    </div>
  );
}

export { EnvStatus };
export type { EnvStatusCondition, EnvStatusProps, EnvStatusProvider, EnvStatusState };
