"use client";

import { ActionStack, type AssetAction } from "@/registry/super-ai/action-stack";

/**
 * Live examples for action-stack.docs.tsx. A client sidecar: the docs module
 * is plain data read by a Server Component and cannot carry handlers.
 */

const PRICED: AssetAction[] = [
  { id: "extend", title: "Extend", description: "Add 4 seconds", cost: { amount: 55 } },
  { id: "upscale", title: "Upscale", description: "To 4K", cost: { amount: 900, per: "min" } },
];

const UNPRICED: AssetAction[] = [
  { id: "extend", title: "Extend", description: "Add 4 seconds" },
  { id: "upscale", title: "Upscale", description: "To 4K" },
];

const WITH_LOCK: AssetAction[] = [
  ...PRICED,
  { id: "lipsync", title: "Use in Lip sync", description: "Available on Studio", cost: { amount: 120 }, locked: true },
];

/** DO — a price on every row, because chaining is where credits vanish. */
export function PriceOnEveryRow() {
  return <ActionStack presentation="inline" actions={PRICED} onAction={() => {}} className="rounded-lg border p-1" />;
}

/** DO — keep locked rows visible, with their cost, so the upgrade has a subject. */
export function LockedRowsStayVisible() {
  return <ActionStack presentation="inline" actions={WITH_LOCK} onAction={() => {}} className="rounded-lg border p-1" />;
}

/**
 * DON&apos;T — actions with no prices. Every row here bills, and the stack
 * gives no way to tell the 55-credit hop from the 900-a-minute one.
 */
export function NoPrices() {
  return <ActionStack presentation="inline" actions={UNPRICED} onAction={() => {}} className="rounded-lg border p-1" />;
}

/**
 * DON&apos;T — hiding what a plan does not include. Drop the locked row and
 * the person never learns Lip sync exists, so the upgrade never gets asked for.
 */
export function LockedRowsRemoved() {
  return <ActionStack presentation="inline" actions={PRICED} onAction={() => {}} className="rounded-lg border p-1" />;
}
