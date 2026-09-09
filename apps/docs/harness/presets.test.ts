import { readFileSync } from "node:fs";
import path from "node:path";

import {
  PRESET_BASES,
  PRESET_BASE_COLORS,
  PRESET_ICON_LIBRARIES,
  PRESET_RADII,
  PRESET_STYLES,
  PRESET_THEMES,
  decodePreset,
} from "shadcn/preset";
import { describe, expect, it } from "vitest";

import { ACTIVE_ROWS, HARNESS_ROWS, codeFor, configFor, rowById } from "./presets";

describe("preset rows", () => {
  it("ids are unique and filesystem-safe", () => {
    const ids = HARNESS_ROWS.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z0-9-]+$/);
  });

  it("the default row is what `shadcn init --defaults` produces", () => {
    expect(codeFor(rowById("default"))).toBe("b0");
  });

  it("every row's code round-trips through the CLI's own decoder", () => {
    for (const row of HARNESS_ROWS) expect(decodePreset(codeFor(row))).toEqual(configFor(row));
  });

  it("every row value is in the CLI's vocabulary (a shadcn upgrade that renames one fails here by name)", () => {
    const vocab = {
      style: PRESET_STYLES,
      baseColor: PRESET_BASE_COLORS,
      theme: PRESET_THEMES,
      iconLibrary: PRESET_ICON_LIBRARIES,
      radius: PRESET_RADII,
    } as const;
    for (const row of HARNESS_ROWS) {
      expect(PRESET_BASES, `${row.id} base`).toContain(row.base);
      for (const [key, values] of Object.entries(vocab)) {
        const v = row.values[key as keyof typeof vocab];
        if (v !== undefined) expect(values as readonly string[], `${row.id} ${key}`).toContain(v);
      }
    }
  });

  it("the matrix moves every axis it exists to move", () => {
    const configs = HARNESS_ROWS.map(configFor);
    expect(new Set(HARNESS_ROWS.map((r) => r.base))).toEqual(new Set(["base", "radix"]));
    for (const key of ["style", "baseColor", "theme", "iconLibrary", "radius"] as const) {
      expect(new Set(configs.map((c) => c[key])).size, `no row moves ${key}`).toBeGreaterThan(1);
    }
  });

  it("ci.yml's presets matrix is exactly the non-default rows (a hand-written mirror that drifts is a gate that never runs)", () => {
    // cwd-relative like every other docs test (vitest rewrites import.meta.url
    // to a non-file URL): vitest runs from apps/docs.
    const ci = readFileSync(path.resolve(process.cwd(), "../../.github/workflows/ci.yml"), "utf8");
    const m = ci.match(/row:\s*\[([^\]]+)\]/);
    expect(m, "no `row: [...]` matrix in ci.yml").not.toBeNull();
    const inCi = m![1]
      .split(",")
      .map((s) => s.trim())
      .sort();
    const expected = ACTIVE_ROWS.map((r) => r.id)
      .filter((id) => id !== "default")
      .sort();
    expect(inCi).toEqual(expected);
  });

  it("a deferred row carries a dated reason long enough to be one, and the default row is never deferred", () => {
    for (const row of HARNESS_ROWS) {
      if (!row.knownFailure) continue;
      expect(row.id).not.toBe("default");
      expect(row.knownFailure.since).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(row.knownFailure.reason.length, `${row.id} reason`).toBeGreaterThan(80);
    }
  });
});
