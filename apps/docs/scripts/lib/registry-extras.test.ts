import { describe, expect, it } from "vitest";
import { MANIFEST } from "../../lib/catalog.manifest";
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
    // a dependency nobody declared.
    const undeclared = MANIFEST.filter(
      (i) => i.status === "shipped" && !i.shadcn.length && !i.consumes.length && !i.npm.length,
    );
    for (const item of undeclared) expect(extras[item.name]).toBeUndefined();
  });

  it("omits items with no dependencies at all", () => {
    expect(extras.kbd).toBeUndefined();
  });

  it("orders shadcn bases before registry-internal deps", () => {
    expect(extras["shortcuts-sheet"].registryDependencies![0]).toBe("dialog");
  });
});
