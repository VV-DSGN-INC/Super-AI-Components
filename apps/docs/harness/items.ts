import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { CATALOG_ITEMS } from "../lib/catalog";
import { MARKETING_ITEMS } from "../lib/marketing-catalog";

export interface HarnessItem {
  name: string;
  kind: "super-ai" | "marketing";
}

const demoFor = (name: string) =>
  fileURLToPath(new URL(`../components/demos/${name}-demo.tsx`, import.meta.url));

/** Every item the docs app can demo. Lib items (cost, initials, use-view-mode)
 *  have no demo and nothing to render; they are installed but not visited. */
export const HARNESS_ITEMS: HarnessItem[] = [
  ...CATALOG_ITEMS.filter((i) => existsSync(demoFor(i.name))).map((i) => ({
    name: i.name,
    kind: "super-ai" as const,
  })),
  ...MARKETING_ITEMS.filter((i) => existsSync(demoFor(i.name))).map((i) => ({
    name: i.name,
    kind: "marketing" as const,
  })),
];
