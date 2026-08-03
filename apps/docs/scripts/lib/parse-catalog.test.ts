import { describe, expect, it } from "vitest";
import { parseCatalogTables } from "./parse-catalog";

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
