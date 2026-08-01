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
