import { describe, expect, it } from "vitest";
import { parseCatalogTables, parseCatalogTablesWithDiagnostics } from "./parse-catalog";

const SAMPLE = `
## B · App shell & navigation — 8

| # | Name | Purpose | Key states / variants | shadcn base |
|---|------|---------|-----------------------|-------------|
| B1 | \`app-sidebar\` | Assembled product sidebar | expanded · icon-rail · mobile-drawer | Sidebar |
| B6 | \`thread-list\` \`KEEP\` | Date-grouped conversations | pin · rename · active | Sidebar, Dropdown-menu |
| B7 | \`app-topbar\` \`NEW\` | Breadcrumb + title | document context · editor context | Breadcrumb, Button-group |

**Dropped from the spec:** \`chat-header\` (absorbed by B7).

## G · Canvas & nodes — CUT 2026-07-31

| # | Name | Purpose | Key states / variants | shadcn base |
|---|------|---------|-----------------------|-------------|
| G3 | \`typed-handle\` + \`typed-edge\` | Ports and lines | valid · invalid | — |
| — | \`useFlowRunner\` | **Headless.** Execution | executor-swappable | — |
`;

describe("parseCatalogTables", () => {
  const rows = parseCatalogTables(SAMPLE);

  it("reads one row per catalog line, skipping prose between tables", () => {
    expect(rows).toHaveLength(5);
  });

  it("strips KEEP/NEW tags from the name", () => {
    expect(rows.map((r) => r.name)).toContain("thread-list");
    expect(rows.find((r) => r.name === "thread-list")!.name).not.toMatch(/KEEP/);
  });

  it("splits states on the middle dot", () => {
    expect(rows.find((r) => r.id === "B1")!.states).toEqual([
      "expanded",
      "icon-rail",
      "mobile-drawer",
    ]);
  });

  it("kebab-cases and splits the shadcn base column", () => {
    expect(rows.find((r) => r.id === "B7")!.base).toEqual(["breadcrumb", "button-group"]);
  });

  it("reads an em-dash base column as no base", () => {
    expect(rows.find((r) => r.id === "G3")!.base).toEqual([]);
  });

  it("takes the first name when a row declares two", () => {
    expect(rows.find((r) => r.id === "G3")!.name).toBe("typed-handle");
  });

  it("derives an id from the name when the id column is an em-dash", () => {
    expect(rows.find((r) => r.name === "useFlowRunner")!.id).toBe("G-useFlowRunner");
  });

  it("tags each row with its family letter", () => {
    expect(rows.find((r) => r.id === "B1")!.family).toBe("B");
    expect(rows.find((r) => r.id === "G3")!.family).toBe("G");
  });
});

// Copied verbatim from `## O · Blocks (L4) — 14` in docs/design-system/catalog.md.
// This family uses a leaner 3-column table (# | Name | Archetype) instead of
// the 5-column shape every other family uses — a shape the original SAMPLE
// above never exercised, which is exactly how it silently dropped all 14
// O-family rows the first time around. Re-copy from the real file if this
// section ever changes; do not hand-edit or re-imagine it.
const REAL_FAMILY_O = `
## O · Blocks (L4) — 14

| # | Name | Archetype |
|---|------|-----------|
| O1 | \`home-shell\` | App Home / launcher |
| O2 | \`chat-shell\` | Chat / agent workspace |
| O3 | \`studio-shell\` | Creative studio editor |
| O4 | \`timeline-shell\` | Timeline-dominant editor (variant of O3) |
| O5 | ~~\`flow-shell\`~~ | Node / flow canvas — cut (D9) |
| O6 | \`generation-shell\` | Single-purpose tool app |
| O7 | \`library-shell\` | Personal archive |
| O8 | \`explore-shell\` | Community gallery |
| O9 | \`artifact-shell\` | Artifact / document index |
| O10 | \`records-shell\` | Project / scenario list |
| O11 | \`docs-shell\` | Documentation |
| O12 | \`settings-shell\` | Full-page settings |
| O13 | \`notebook-shell\` | Three-pane sources ‖ chat ‖ outputs |
| O14 | \`auth-shell\` | Sign in / sign up |
`;

describe("parseCatalogTables — real family-O (3-column table)", () => {
  const rows = parseCatalogTables(REAL_FAMILY_O);

  it("reads all 14 blocks from the 3-column table", () => {
    expect(rows).toHaveLength(14);
  });

  it("puts the archetype text in description, and leaves states/base empty", () => {
    const homeShell = rows.find((r) => r.id === "O1")!;
    expect(homeShell.name).toBe("home-shell");
    expect(homeShell.description).toBe("App Home / launcher");
    expect(homeShell.states).toEqual([]);
    expect(homeShell.base).toEqual([]);
  });

  it("still extracts the name out of a strikethrough cell (O5, cut)", () => {
    const flowShell = rows.find((r) => r.id === "O5")!;
    expect(flowShell.name).toBe("flow-shell");
    expect(flowShell.description).toBe("Node / flow canvas — cut (D9)");
  });
});

// Copied verbatim from `## G · Canvas & nodes` in docs/design-system/catalog.md.
// G3's real shadcn-base cell is "— (new)", not a bare "—" — the original
// SAMPLE only ever used a bare em-dash.
const REAL_G3_ROW = `
## G · Canvas & nodes — CUT 2026-07-31

| # | Name | Purpose | Key states / variants | shadcn base |
|---|------|---------|-----------------------|-------------|
| G3 | \`typed-handle\` + \`typed-edge\` | Ports and the lines between them | valid · invalid · dangling · selected · animated-while-running · type-coloured | — (new) |
`;

describe("parseCatalogTables — annotated em-dash base column", () => {
  it("reads '— (new)' as no base, same as a bare em-dash", () => {
    const rows = parseCatalogTables(REAL_G3_ROW);
    expect(rows.find((r) => r.id === "G3")!.base).toEqual([]);
  });
});

describe("parseCatalogTablesWithDiagnostics", () => {
  it("counts a malformed row instead of silently dropping it", () => {
    const MALFORMED = `
## B · App shell & navigation — 8

| # | Name | Purpose | Key states / variants | shadcn base |
|---|------|---------|-----------------------|-------------|
| B1 | \`app-sidebar\` | Assembled product sidebar | expanded · icon-rail · mobile-drawer | Sidebar |
| B2 | \`broken-row\` | Missing a column | only-one-state |
`;
    const { rows, skipped } = parseCatalogTablesWithDiagnostics(MALFORMED);

    expect(rows).toHaveLength(1);
    expect(rows[0]!.id).toBe("B1");
    expect(skipped).toBe(1);
  });

  it("reports zero skipped rows and agrees with parseCatalogTables on well-formed input", () => {
    const { rows, skipped } = parseCatalogTablesWithDiagnostics(SAMPLE);

    expect(skipped).toBe(0);
    expect(rows).toEqual(parseCatalogTables(SAMPLE));
  });
});
