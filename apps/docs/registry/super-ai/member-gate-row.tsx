"use client";

import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { EntityRow } from "@/registry/super-ai/entity-row";

/**
 * Member Gate Row — Feature row locked behind a plan
 *
 * Spec: docs/design-system/component-specs.md#e7-member-gate-row
 * States: locked · unlocked · trial-available · inline-upsell
 *
 * Composes A9 `entity-row` for the icon/title/description grid and fills its
 * trailing slot with the gate affordance (tier badge + switch) rather than
 * reimplementing the row.
 */
type MemberGateRowState = "locked" | "unlocked" | "trial-available" | "inline-upsell";

interface MemberGateRowProps extends Omit<React.ComponentProps<"div">, "onSelect"> {
  icon?: React.ReactNode;
  label: React.ReactNode;
  description?: React.ReactNode;
  state: MemberGateRowState;
  /** Trailing tier badge shown while gated (`locked` / `inline-upsell`), e.g. "Pro". */
  tier?: React.ReactNode;
  /** Trailing trial badge shown in `trial-available`, e.g. "Free trial ×1". */
  trialLabel?: React.ReactNode;
  /** Switch value in `unlocked` and `trial-available` — both are real, functioning toggles. */
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  /**
   * Called instead of `onCheckedChange` when the switch is activated while
   * `state` is `locked`. The switch itself never actually turns on — flip
   * `state` to `inline-upsell` in response to reveal the upsell in place.
   * There is no modal here on purpose; see the spec's second bullet.
   */
  onRequestUpgrade?: () => void;
  upsellTitle?: React.ReactNode;
  upsellDescription?: React.ReactNode;
  ctaLabel?: React.ReactNode;
  onUpgrade?: () => void;
  /** Collapses the upsell back to `locked` without upgrading. */
  onDismissUpsell?: () => void;
  dismissUpsellLabel?: React.ReactNode;
}

function MemberGateRow({
  icon,
  label,
  description,
  state,
  tier,
  trialLabel = "Free trial",
  checked = false,
  onCheckedChange,
  onRequestUpgrade,
  upsellTitle,
  upsellDescription,
  ctaLabel,
  onUpgrade,
  onDismissUpsell,
  dismissUpsellLabel = "Not now",
  className,
  ...props
}: MemberGateRowProps) {
  const titleId = React.useId();
  const lockDescId = React.useId();

  // `locked` and `inline-upsell` share the same gated trailing affordance —
  // the upsell is content revealed *below* the row, not a different row.
  const gated = state === "locked" || state === "inline-upsell";

  // Read this state's switch value/handler off `state`, not off `checked`
  // directly. The row is fully controlled: a gated switch always renders as
  // off (the feature was never granted) and reports an activation attempt
  // upward rather than flipping itself, exactly the "reveal, don't hide"
  // behaviour the spec and B3 `sidebar-nav`'s tier badges both call for.
  const switchChecked = gated ? false : checked;
  const handleSwitchChange = gated ? () => onRequestUpgrade?.() : (next: boolean) => onCheckedChange?.(next);

  const trailing = (
    <span data-slot="member-gate-row-trailing" className="flex items-center gap-2">
      {gated && tier ? (
        <Badge variant="secondary" data-slot="member-gate-row-tier-badge">
          {tier}
        </Badge>
      ) : null}
      {state === "trial-available" ? (
        <Badge variant="secondary" data-slot="member-gate-row-trial-badge">
          {trialLabel}
        </Badge>
      ) : null}
      <Switch
        aria-labelledby={titleId}
        aria-describedby={gated ? lockDescId : undefined}
        checked={switchChecked}
        onCheckedChange={handleSwitchChange}
      />
      {/*
        A11y trap this closes: a locked row must say so programmatically, not
        merely look dimmed or rely on a padlock glyph. This text — not colour,
        not opacity — is what tells assistive tech (and a sighted user who
        skims past the badge) that the switch won't actually turn on.
      */}
      {gated ? (
        <span id={lockDescId} className="sr-only">
          Locked{tier ? <> — requires {tier}</> : null}. Activating opens upgrade options.
        </span>
      ) : null}
    </span>
  );

  return (
    <div data-slot="member-gate-row" data-state={state} className={cn("flex flex-col gap-2", className)} {...props}>
      <EntityRow
        icon={icon}
        title={<span id={titleId}>{label}</span>}
        description={description}
        trailing={trailing}
      />
      {state === "inline-upsell" ? (
        // Revealed in place under the row it gates, never a dialog — see the
        // spec's second bullet and F1 (docs/design-system/decisions.md),
        // which makes this placement load-bearing rather than deferrable.
        <div
          data-slot="member-gate-row-upsell"
          role="status"
          className="ml-3 flex flex-col gap-2 rounded-lg border bg-muted/30 px-3 py-2.5 text-sm"
        >
          <p data-slot="member-gate-row-upsell-title" className="text-foreground font-medium">
            {upsellTitle ?? (
              <>
                Upgrade{tier ? <> to {tier}</> : null} to unlock {label}
              </>
            )}
          </p>
          {upsellDescription ? (
            // text-foreground/70, not text-muted-foreground: this panel sits on
            // its own bg-muted/30 tint, and text-muted-foreground measures
            // under 4.5:1 against bg-muted-derived surfaces in this token set
            // (see the muted-on-muted note in component-build-brief.md). The
            // same fix `promo-card` uses for description text on a tinted card.
            <p data-slot="member-gate-row-upsell-description" className="text-foreground/70 text-xs leading-snug">
              {upsellDescription}
            </p>
          ) : null}
          <div className="flex items-center gap-2">
            <Button type="button" size="sm" onClick={onUpgrade} data-slot="member-gate-row-upsell-cta">
              {ctaLabel ?? <>Upgrade{tier ? <> to {tier}</> : null}</>}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={onDismissUpsell}
              data-slot="member-gate-row-upsell-dismiss"
            >
              {dismissUpsellLabel}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export { MemberGateRow };
export type { MemberGateRowProps, MemberGateRowState };
