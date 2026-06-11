export const CATALOG = [
  "kbd",
  "cost-chip",
  "date-section",
  "choice-chips",
  "filter-bar",
  "field-row",
  "gen-settings-bar",
  "shortcuts-sheet",
  "thread-list",
] as const;
export type CatalogName = (typeof CATALOG)[number];
