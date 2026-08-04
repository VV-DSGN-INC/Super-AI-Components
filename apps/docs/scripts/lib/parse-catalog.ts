export type RawRow = {
  id: string;
  name: string;
  family: string;
  description: string;
  states: string[];
  base: string[];
};

export type ParseDiagnostics = {
  rows: RawRow[];
  /**
   * Lines that started with "|", occurred while a family section was active,
   * were not the header or divider row, but had a cell count other than 3
   * (O · Blocks) or 5 (every other family). This shape should never
   * legitimately occur — a nonzero count means catalog.md has a malformed
   * row that would otherwise be dropped silently, the way the O · Blocks
   * 3-column table was until this parser accounted for it.
   */
  skipped: number;
};

const FAMILY_HEADING = /^## ([A-O]) ·/;
const ANY_HEADING = /^## /;
const TAG = /`(KEEP|NEW|RESTORED|SHIPPED)`/g;

const cell = (text: string) => text.trim();

const firstBacktickName = (text: string) => {
  const withoutTags = text.replace(TAG, "");
  const match = withoutTags.match(/`([^`]+)`/);
  return match ? match[1].trim() : "";
};

const splitStates = (text: string) =>
  cell(text)
    .split("·")
    .map((s) => s.trim())
    .filter(Boolean);

const splitBase = (text: string) => {
  const value = cell(text);
  // An em-dash means "no base", sometimes with a trailing annotation
  // (e.g. "— (new)"), so match on the leading dash rather than an exact "—".
  if (!value || value.startsWith("—")) return [];
  return value
    .split(",")
    .map((s) => s.trim().toLowerCase().replace(/\s+/g, "-"))
    .filter(Boolean);
};

export function parseCatalogTablesWithDiagnostics(markdown: string): ParseDiagnostics {
  const rows: RawRow[] = [];
  let family = "";
  let skipped = 0;

  for (const line of markdown.split("\n")) {
    // Any "## " heading ends the current family section, even one that
    // doesn't match a family letter (e.g. "## Totals") — otherwise a
    // trailing summary table would be walked as if it were still inside
    // the last real family, relying on a coincidental column-count
    // mismatch to be silently ignored instead of being genuinely excluded.
    if (ANY_HEADING.test(line)) {
      const heading = line.match(FAMILY_HEADING);
      family = heading ? heading[1] : "";
      continue;
    }

    if (!family || !line.startsWith("|")) continue;

    const cells = line.split("|").slice(1, -1);
    const idCell = cells[0] ?? "";
    if (cell(idCell) === "#" || /^-+$/.test(cell(idCell))) continue; // header + divider

    // Most family tables have 5 columns (# | Name | Purpose | States | shadcn base).
    // The O · Blocks family uses a leaner 3-column table (# | Name | Archetype).
    if (cells.length !== 5 && cells.length !== 3) {
      skipped++;
      continue;
    }

    const nameCell = cells[1];
    const name = firstBacktickName(nameCell);
    if (!name) continue;

    const rawId = cell(idCell);
    const id = rawId && rawId !== "—" ? rawId : `${family}-${name}`;

    const description = cell(cells[2]);
    const states = cells.length === 5 ? splitStates(cells[3]) : [];
    const base = cells.length === 5 ? splitBase(cells[4]) : [];

    rows.push({ id, name, family, description, states, base });
  }

  return { rows, skipped };
}

export function parseCatalogTables(markdown: string): RawRow[] {
  return parseCatalogTablesWithDiagnostics(markdown).rows;
}
