export interface CatalogItem {
  name: string;
  title: string;
  description: string;
  group: "Primitives" | "Components";
}

export const CATALOG_ITEMS: CatalogItem[] = [
  { name: "kbd", title: "Kbd", description: "Keycap chip for keyboard shortcuts.", group: "Primitives" },
  {
    name: "cost-chip",
    title: "Cost Chip",
    description: "Per-action credit cost chip (e.g. 17 credits, 900 credits/min).",
    group: "Primitives",
  },
  {
    name: "date-section",
    title: "Date Section",
    description: "Date-grouped section header for lists and grids.",
    group: "Primitives",
  },
  {
    name: "choice-chips",
    title: "Choice Chips",
    description: "Ring-selected chip group for visual and numeric parameters.",
    group: "Primitives",
  },
  {
    name: "filter-bar",
    title: "Filter Bar",
    description: "Category chips, add-filter chip, and filters button.",
    group: "Primitives",
  },
  {
    name: "field-row",
    title: "Field Row",
    description: "Label + control inspector row with unit-suffixed value input.",
    group: "Primitives",
  },
  {
    name: "gen-settings-bar",
    title: "Gen Settings Bar",
    description: "Compact model/aspect/resolution/duration/batch strip.",
    group: "Primitives",
  },
  {
    name: "shortcuts-sheet",
    title: "Shortcuts Sheet",
    description: "Keyboard shortcuts cheatsheet dialog.",
    group: "Components",
  },
  {
    name: "thread-list",
    title: "Thread List",
    description: "Date-grouped conversation list with rename, delete, and pin.",
    group: "Components",
  },
] as const;

export const CATALOG = CATALOG_ITEMS.map((i) => i.name);
export type CatalogName = (typeof CATALOG_ITEMS)[number]["name"];
