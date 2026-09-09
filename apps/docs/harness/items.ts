import { existsSync } from "node:fs";
import path from "node:path";

import { CATALOG_ITEMS } from "../lib/catalog";
import { MARKETING_ITEMS } from "../lib/marketing-catalog";
import { harnessDir } from "./baseline";

export interface HarnessItem {
  name: string;
  kind: "super-ai" | "marketing";
}

const demoFor = (name: string) => path.resolve(harnessDir(), "..", "components", "demos", `${name}-demo.tsx`);

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
