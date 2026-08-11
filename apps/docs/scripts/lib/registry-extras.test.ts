import { describe, expect, it } from "vitest";
import { MANIFEST } from "../../lib/catalog.manifest";
import type { ManifestItem } from "../../lib/manifest-types";
import { deriveExtras } from "./registry-extras";

const REGISTRY_URL = "https://super-ai-components.vercel.app";
const self = (name: string) => `${REGISTRY_URL}/r/${name}.json`;

// Verbatim copy of the hand-written record this replaces. It is a snapshot of
// what already-published registry items resolve to — every entry here must keep
// deriving identically forever, or a consumer's `npx shadcn add` changes under
// them. New components add keys; they must never alter these.
const LEGACY = {
  "cost-chip": { dependencies: ["lucide-react"] },
  "filter-bar": { dependencies: ["lucide-react"] },
  "field-row": { registryDependencies: [self("reset-affordance")] },
  "shortcuts-sheet": { registryDependencies: ["dialog", self("kbd")] },
  "thread-list": {
    registryDependencies: ["button", "input", "dropdown-menu", "alert-dialog", self("date-section")],
    dependencies: ["lucide-react"],
  },
};

describe("deriveExtras", () => {
  const extras = deriveExtras(MANIFEST, self);

  it("reproduces every legacy entry exactly", () => {
    for (const [name, entry] of Object.entries(LEGACY)) {
      expect(extras[name], `legacy entry "${name}" changed`).toEqual(entry);
    }
  });

  it("adds nothing for a component that declares no dependencies", () => {
    // Guards the other direction: a stray key would mean a published item gained
    // a dependency nobody declared. `cssVars` counts as a declared extra too —
    // credits-indicator/quota-meter/pricing-table have no shadcn/consumes/npm
    // but do declare cssVars, so they're excluded here and covered by the
    // cssVars-specific tests below instead.
    const undeclared = MANIFEST.filter(
      (i) => i.status === "shipped" && !i.shadcn.length && !i.consumes.length && !i.npm.length && !i.cssVars,
    );
    for (const item of undeclared) expect(extras[item.name]).toBeUndefined();
  });

  it("omits items with no dependencies at all", () => {
    expect(extras.kbd).toBeUndefined();
  });

  it("orders shadcn bases before registry-internal deps", () => {
    expect(extras["shortcuts-sheet"].registryDependencies![0]).toBe("dialog");
  });

  // cssVars ported from main's hand-written `extras` record (WARNING_CSS_VARS)
  // when the pre-manifest gen-registry.mts extras it replaced still owned this
  // field directly. deriveExtras() must thread a manifest item's `cssVars`
  // through unchanged, or these three silently lose the `--warning` token and
  // render colourless near-limit/over-limit states for any consumer who
  // doesn't already define it.
  const WARNING_CSS_VARS = {
    theme: {
      "color-warning": "var(--warning)",
      "color-warning-foreground": "var(--warning-foreground)",
    },
    light: { warning: "oklch(0.76 0.16 70)", "warning-foreground": "oklch(0.26 0.05 70)" },
    dark: { warning: "oklch(0.82 0.14 72)", "warning-foreground": "oklch(0.24 0.05 70)" },
  };

  it.each(["credits-indicator", "quota-meter", "pricing-table"])("threads cssVars through for %s", (name) => {
    expect(extras[name]?.cssVars).toEqual(WARNING_CSS_VARS);
  });

  it("emits no cssVars for a shipped item that declares none", () => {
    expect(extras["citation-ref"]?.cssVars).toBeUndefined();
  });

  it("spreads external registry URLs into registryDependencies", () => {
    const items = [
      {
        id: "C2",
        name: "suggestion-chips",
        title: "Suggestion Chips",
        description: "Task starter chips",
        family: "C",
        layer: "component",
        status: "shipped",
        wave: 2,
        base: [],
        shadcn: ["button"],
        consumes: [],
        npm: [],
        states: ["plain"],
        specAnchor: "component-specs.md#c2-suggestion-chips",
        external: ["https://registry.ai-sdk.dev/suggestion.json"],
      },
    ] as unknown as ManifestItem[];

    const extras = deriveExtras(items, (n) => `https://example.test/r/${n}.json`);

    expect(extras["suggestion-chips"].registryDependencies).toEqual([
      "button",
      "https://registry.ai-sdk.dev/suggestion.json",
    ]);
  });
});
