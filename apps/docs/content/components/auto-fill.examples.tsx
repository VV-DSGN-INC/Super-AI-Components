"use client";

import * as React from "react";

import { Switch } from "@/components/ui/switch";
import {
  AutoFillCell,
  AutoFillPanel,
  type AutoFillRecord,
  type AutoFillSample,
} from "@/registry/super-ai/auto-fill";

/**
 * Live examples for auto-fill.docs.tsx.
 *
 * A client sidecar on purpose: the docs module is read by a Server Component
 * and cannot carry handlers, so every example that owns state lives here and
 * crosses over as a zero-prop element.
 */

const FIELDS = [
  { id: "industry", label: "Industry" },
  { id: "size", label: "Company size" },
];

const RECORDS: AutoFillRecord[] = [
  { id: "r1", label: "Northwind Traders", current: null },
  { id: "r2", label: "Fabrikam", current: "Manufacturing" },
  { id: "r3", label: "Contoso", current: null },
  { id: "r4", label: "Tailspin Toys", current: "Retail" },
];

const SAMPLES: AutoFillSample[] = [
  { id: "r1", value: "Wholesale", reason: "Imports and resells goods.", cost: 2, durationMs: 1240 },
  { id: "r2", value: "Industrial manufacturing", cost: 2, durationMs: 980 },
  { id: "r3", value: "Software", reason: "Sells licences for a desktop suite.", cost: 2, durationMs: 1100 },
];

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** The panel inline, so the default prompt, the overwrite count and the preview step are visible at once. */
export function PreviewBeforeApply() {
  return (
    <div className="w-96 max-w-full">
      <AutoFillPanel
        fields={FIELDS}
        records={RECORDS}
        onSample={async () => {
          await wait(400);
          return SAMPLES;
        }}
        onApply={async () => {
          await wait(400);
        }}
      />
    </div>
  );
}

export function SuggestedKeepsItsMark() {
  return (
    <div className="w-64">
      <AutoFillCell
        status="suggested"
        value="Wholesale"
        label="Northwind Traders, Industry"
        reason="Imports and resells goods."
      />
    </div>
  );
}

/** Wrong: a generated value written straight into the cell with nothing to say who wrote it. */
export function GeneratedValueUnmarked() {
  return (
    <div className="w-64 text-sm">
      <span>Wholesale</span>
    </div>
  );
}

/** Wrong: overwrite switched on for the person, with no count of what it replaces. */
export function OverwriteOnByDefault() {
  return (
    <div className="flex items-center gap-2 text-sm">
      <Switch size="sm" checked aria-label="Replace existing values" />
      <span>Replace existing values</span>
    </div>
  );
}
