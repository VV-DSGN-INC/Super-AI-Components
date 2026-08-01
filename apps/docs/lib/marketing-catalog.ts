// collision guard only — marketing stays decoupled from the super-ai catalog otherwise
import { CATALOG } from "./catalog";

export interface MarketingItem {
  name: string;
  title: string;
  description: string;
  group: "Layout" | "Text" | "Buttons" | "Effects";
}

// Grows one entry per component task (Tasks 6–20). Order within a group = sidebar order.
export const MARKETING_ITEMS: MarketingItem[] = [
  {
    name: "dot-pattern",
    title: "Dot Pattern",
    description: "SVG dot grid backdrop with optional radial fade.",
    group: "Effects",
  },
  {
    name: "pulsating-button",
    title: "Pulsating Button",
    description: "Primary button with a soft expanding pulse halo.",
    group: "Buttons",
  },
];

export const MARKETING_GROUPS = ["Layout", "Text", "Buttons", "Effects"] as const;
export const MARKETING = MARKETING_ITEMS.map((i) => i.name);
export type MarketingName = string;

const collisions = MARKETING.filter((n, i) => MARKETING.indexOf(n) !== i || CATALOG.includes(n));
if (collisions.length) {
  throw new Error(`Marketing catalog name collisions: ${collisions.join(", ")}`);
}
