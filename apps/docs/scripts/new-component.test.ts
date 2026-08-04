import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it, afterAll } from "vitest";

import { renderScaffold, statePascal } from "./lib/scaffold-templates";
import type { ManifestItem } from "../lib/manifest-types";

const ITEM: ManifestItem = {
  id: "B2",
  name: "workspace-switcher",
  title: "Workspace Switcher",
  description: "Avatar/logo + name dropdown.",
  family: "B",
  layer: "component",
  status: "planned",
  wave: 2,
  base: ["dropdown-menu", "avatar"],
  shadcn: [],
  consumes: [],
  npm: [],
  states: ["workspace-list", "multi-product"],
  specAnchor: "component-specs.md#b2-workspace-switcher",
};

// Manifest `states` are free text copied from catalog.md and can contain
// spaces, slashes, and other characters that are not valid in a JS
// identifier — e.g. B2's real states in catalog.manifest.ts are
// ["workspace", "multi-product with description rows"]. `statePascal` must
// still produce a usable story export name.
const MESSY_ITEM: ManifestItem = {
  ...ITEM,
  states: ["multi-product with description rows", "invite/refer", "3d preview"],
};

const dir = mkdtempSync(join(tmpdir(), "scaffold-"));
afterAll(() => rmSync(dir, { recursive: true, force: true }));

describe("renderScaffold", () => {
  const files = renderScaffold(ITEM);

  it("emits five files", () => {
    expect(Object.keys(files)).toHaveLength(5);
  });

  it("names the component export in PascalCase", () => {
    expect(files["registry/super-ai/workspace-switcher.tsx"]).toContain("export function WorkspaceSwitcher");
  });

  it("carries a data-slot matching the registry name", () => {
    expect(files["registry/super-ai/workspace-switcher.tsx"]).toContain('data-slot="workspace-switcher"');
  });

  it("writes one failing test per declared state", () => {
    const test = files["registry/super-ai/workspace-switcher.test.tsx"];
    expect(test).toContain('it("renders the workspace-list state"');
    expect(test).toContain('it("renders the multi-product state"');
    expect(test).toContain("expect.fail");
  });

  it("writes one story per declared state", () => {
    const story = files["../storybook/src/stories/super-ai/WorkspaceSwitcher.stories.tsx"];
    expect(story).toContain("export const WorkspaceList");
    expect(story).toContain("export const MultiProduct");
    expect(story).not.toContain("export const Default");
  });

  it("seeds the docs module with the spec anchor and empty guidance fields", () => {
    const docs = files["content/components/workspace-switcher.docs.tsx"];
    expect(docs).toContain("component-specs.md#b2-workspace-switcher");
    expect(docs).toContain("export const WorkspaceSwitcherDocs: ComponentDocs");
    expect(docs).toContain("dos: [");
  });

  // The docs module is plain data read by a Server Component, so it must
  // never carry "use client" — see the workspace-switcher/promo-card/
  // sidebar-nav static-export fix this template was hardened to prevent
  // a repeat of. Interactive examples belong in a sibling client module.
  it("does not put the client directive on the docs module", () => {
    const docs = files["content/components/workspace-switcher.docs.tsx"];
    expect(docs.trimStart().startsWith('"use client";')).toBe(false);
  });

  it("shows the zero-prop example pattern and explains why inline handlers break the static export", () => {
    const docs = files["content/components/workspace-switcher.docs.tsx"];
    expect(docs).toContain("workspace-switcher.examples");
    expect(docs).toContain("example: <GoodExample />");
    expect(docs).toContain("cannot be serialized across the server/client boundary");
  });
});

describe("statePascal", () => {
  it("converts a simple hyphenated state to PascalCase", () => {
    expect(statePascal("workspace-list")).toBe("WorkspaceList");
  });

  it("produces a valid JS identifier from messy free-text state names", () => {
    expect(statePascal("multi-product with description rows")).toBe("MultiProductWithDescriptionRows");
    expect(statePascal("invite/refer")).toBe("InviteRefer");
    // A leading digit is not a valid identifier start, so it must be prefixed.
    expect(statePascal("3d preview")).toMatch(/^[A-Za-z_$][A-Za-z0-9_$]*$/);
  });

  it("writes one valid story export per declared state for messy manifest text", () => {
    const story = renderScaffold(MESSY_ITEM)["../storybook/src/stories/super-ai/WorkspaceSwitcher.stories.tsx"];
    for (const state of MESSY_ITEM.states) {
      const ident = statePascal(state);
      expect(ident).toMatch(/^[A-Za-z_$][A-Za-z0-9_$]*$/);
      expect(story).toContain(`export const ${ident}`);
    }
  });
});
