"use client";

import { Ban, RotateCcw } from "lucide-react";
import * as React from "react";

import { EntityRow } from "./entity-row";
import { SectionHeader } from "./section-header";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

type AutonomyLevel = "ask" | "auto-reads" | "full";

interface AutonomyGrant {
  id: string;
  /** The tool the grant covers, e.g. "Send email". */
  tool: React.ReactNode;
  /** What it is scoped to. An unscoped grant is not reviewable. */
  scope?: React.ReactNode;
  /** When it was granted. Grants without an age cannot be audited. */
  granted?: React.ReactNode;
}

interface AutonomyDenial {
  id: string;
  tool: React.ReactNode;
  reason?: React.ReactNode;
}

interface AutonomySelectorProps extends Omit<React.ComponentProps<"div">, "onChange"> {
  level?: AutonomyLevel;
  defaultLevel?: AutonomyLevel;
  onLevelChange?: (level: AutonomyLevel) => void;
  /** Every "always allow" lands here. Grant is easy; revoke is the screen that makes it safe. */
  grants?: AutonomyGrant[];
  onRevoke?: (id: string) => void;
  /** Denials are not grants with a minus sign — deny wins and takes no exceptions. */
  denials?: AutonomyDenial[];
  /** Disables raising the level while a run is in flight, but never lowering it. */
  locked?: boolean;
}

const LEVELS: { value: AutonomyLevel; label: string; blast: string }[] = [
  { value: "ask", label: "Ask every time", blast: "Nothing runs without you." },
  {
    value: "auto-reads",
    label: "Auto-approve reads",
    blast: "Reads run alone. Anything that writes or sends still asks.",
  },
  { value: "full", label: "Full auto", blast: "Everything not on the deny list runs unattended." },
];

const RANK: Record<AutonomyLevel, number> = { ask: 0, "auto-reads": 1, full: 2 };

function AutonomySelector({
  level,
  defaultLevel = "ask",
  onLevelChange,
  grants = [],
  onRevoke,
  denials = [],
  locked = false,
  className,
  ...props
}: AutonomySelectorProps) {
  const [uncontrolled, setUncontrolled] = React.useState<AutonomyLevel>(defaultLevel);
  const current = level ?? uncontrolled;

  const handleChange = (next: string) => {
    const value = next as AutonomyLevel;
    // Lowering autonomy is always available, including mid-run. Only raising it
    // is gated — a safety control you cannot tighten during an incident is not one.
    if (locked && RANK[value] > RANK[current]) return;
    if (level === undefined) setUncontrolled(value);
    onLevelChange?.(value);
  };

  return (
    <div data-slot="autonomy-selector" className={cn("flex flex-col gap-6", className)} {...props}>
      <RadioGroup value={current} onValueChange={handleChange} className="gap-2">
        {LEVELS.map((option) => {
          const blocked = locked && RANK[option.value] > RANK[current];
          return (
            <label
              key={option.value}
              data-slot="autonomy-selector-level"
              data-blocked={blocked ? "" : undefined}
              className={cn(
                "border-border flex cursor-pointer items-start gap-3 rounded-lg border p-3",
                current === option.value && "border-ring bg-accent/40",
                blocked && "cursor-not-allowed opacity-50",
              )}
            >
              <RadioGroupItem value={option.value} disabled={blocked} className="mt-0.5" />
              <span className="flex flex-col gap-0.5">
                <span className="text-sm font-medium">{option.label}</span>
                {/* Every level states its blast radius. Raising autonomy is a
                    deliberate act, and it can only be deliberate if the
                    consequence is on screen at the moment of choosing. */}
                <span className="text-muted-foreground text-xs">{option.blast}</span>
              </span>
            </label>
          );
        })}
      </RadioGroup>

      <section data-slot="autonomy-selector-grants" className="flex flex-col gap-1">
        <SectionHeader title="Standing permissions" count={grants.length} />
        {grants.length === 0 ? (
          <p className="text-muted-foreground px-3 py-2 text-xs">
            No standing permissions. Every action asks first.
          </p>
        ) : (
          <ul>
            {grants.map((grant) => (
              <li key={grant.id}>
                <EntityRow
                  title={grant.tool}
                  description={
                    [grant.scope, grant.granted].filter(Boolean).length > 0 ? (
                      <>
                        {grant.scope}
                        {grant.scope && grant.granted ? " · " : null}
                        {grant.granted}
                      </>
                    ) : undefined
                  }
                  trailing={
                    onRevoke ? (
                      <Button type="button" variant="ghost" size="sm" onClick={() => onRevoke(grant.id)}>
                        <RotateCcw />
                        Revoke
                      </Button>
                    ) : undefined
                  }
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      {denials.length > 0 ? (
        <section data-slot="autonomy-selector-denials" className="flex flex-col gap-1">
          <SectionHeader title="Never allowed" count={denials.length} />
          <ul>
            {denials.map((denial) => (
              <li key={denial.id}>
                {/* Deliberately not revocable from here, and deliberately shaped
                    differently from a grant. Deny wins over any allow and takes
                    no exceptions — that asymmetry is what makes a generous
                    allow list safe, so the UI must not imply symmetry. */}
                <EntityRow
                  icon={<Ban className="size-4" />}
                  title={denial.tool}
                  description={denial.reason}
                />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

export { AutonomySelector };
export type { AutonomyDenial, AutonomyGrant, AutonomyLevel, AutonomySelectorProps };
