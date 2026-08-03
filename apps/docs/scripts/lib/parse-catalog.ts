export type RawRow = {
  id: string;
  name: string;
  family: string;
  description: string;
  states: string[];
  base: string[];
};

const FAMILY_HEADING = /^## ([A-O]) ·/;
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

export function parseCatalogTables(markdown: string): RawRow[] {
  const rows: RawRow[] = [];
  let family = "";

  for (const line of markdown.split("\n")) {
    const heading = line.match(FAMILY_HEADING);
    if (heading) {
      family = heading[1];
      continue;
    }

    if (!family || !line.startsWith("|")) continue;

    const cells = line.split("|").slice(1, -1);
    // Most family tables have 5 columns (# | Name | Purpose | States | shadcn base).
    // The O · Blocks family uses a leaner 3-column table (# | Name | Archetype).
    if (cells.length !== 5 && cells.length !== 3) continue;

    const [idCell, nameCell] = cells;
    if (cell(idCell) === "#" || /^-+$/.test(cell(idCell))) continue; // header + divider

    const name = firstBacktickName(nameCell);
    if (!name) continue;

    const rawId = cell(idCell);
    const id = rawId && rawId !== "—" ? rawId : `${family}-${name}`;

    const description = cell(cells[2]);
    const states = cells.length === 5 ? splitStates(cells[3]) : [];
    const base = cells.length === 5 ? splitBase(cells[4]) : [];

    rows.push({ id, name, family, description, states, base });
  }

  return rows;
}
