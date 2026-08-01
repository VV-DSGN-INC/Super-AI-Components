// collision guard only — marketing stays decoupled from the super-ai catalog otherwise
import { CATALOG } from "./catalog";

export interface MarketingItem {
  name: string;
  title: string;
  description: string;
  group: "Layout" | "Text" | "Buttons" | "Effects";
}

// Grows one entry per component task (Tasks 6–20). Order within a group = sidebar order.
export const MARKETING_ITEMS: MarketingItem[] = [];

export const MARKETING_GROUPS = ["Layout", "Text", "Buttons", "Effects"] as const;
export const MARKETING = MARKETING_ITEMS.map((i) => i.name);
export type MarketingName = string;

const collisions = MARKETING.filter((n, i) => MARKETING.indexOf(n) !== i || CATALOG.includes(n));
if (collisions.length) {
  throw new Error(`Marketing catalog name collisions: ${collisions.join(", ")}`);
}
